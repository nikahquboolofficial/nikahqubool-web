"use client";

import SubscriptionModal from '@/components/dashboard/SubscriptionModal';
import { getClientSubscriptionStatus } from '@/lib/subscriptionUtils';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, Flame, RefreshCw, Crown, Lock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { fetchDashboardApi, handleInteractionApiCall, fetchActiveSubscriptionApi, handleSilentSessionExpiry } from '@/lib/api';
import { checkDailyViewLimit, formatTimeRemaining, DAILY_FREE_PROFILE_LIMIT } from '@/lib/limitUtils';
import { getAuthToken } from '@/lib/auth';
import ProfileCard from '@/components/dashboard/ProfileCard';
import ProfileCardSkeleton from '@/components/dashboard/ProfileCardSkeleton';
import ProfileAvatarLoader from '@/components/ProfileAvatarLoader';
import { useSignalR } from '@/context/SignalRContext';

const preloadCardImages = (urls: string[]): Promise<void> => {
  if (typeof window === "undefined" || !urls || urls.length === 0) return Promise.resolve();
  const promises = urls.slice(0, 8).map((url) => {
    if (!url || typeof url !== 'string') return Promise.resolve();
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
  });
  return Promise.all(promises).then(() => {});
};

function LiveCountdownDisplay({ tab = 'best-matches' }: { tab?: string }) {
  const [timeText, setTimeText] = useState('24h 00m 00s');

  useEffect(() => {
    const updateTimer = () => {
      const storageKey = `daily_profile_views_tracker_${tab}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const remaining = Math.max(0, 86400000 - (Date.now() - parsed.timestamp));
          setTimeText(formatTimeRemaining(remaining));
        } catch (e) {}
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [tab]);

  return <span>{timeText}</span>;
}

// ⚡ GLOBAL IN-MEMORY FEED CACHE (PERSISTS ACROSS SPA ROUTING FOR ZERO SKELETON FLASHES)
const globalFeedCache: Record<string, { profiles: any[], hasMore: boolean, timestamp: number }> = {};

const getInitialFeed = (tabName: string = 'best-matches'): any[] => {
  if (typeof window !== "undefined") {
    try {
      const saved = sessionStorage.getItem(`cached_dashboard_feed_${tabName}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profiles && Array.isArray(parsed.profiles) && parsed.profiles.length > 0 && Date.now() - parsed.timestamp < 300000) {
          globalFeedCache[tabName] = parsed;
          return parsed.profiles;
        }
      }
    } catch (e) {}
  }
  return globalFeedCache[tabName]?.profiles || [];
};

export default function VIPCleanDashboardPage() {
  const router = useRouter();
  const { onlineUsers, fetchBulkOnlineStatuses } = useSignalR();
  const [activeTab, setActiveTab] = useState('best-matches');
  const [profiles, setProfiles] = useState<any[]>(() => getInitialFeed('best-matches'));
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState<boolean>(() => getInitialFeed('best-matches').length === 0);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [actionState, setActionState] = useState<{ [key: number]: boolean }>({});
  const [actionTypeState, setActionTypeState] = useState<{ [key: number]: string | null }>({});

  // 🔒 24-HOUR / 15 PROFILE VIEW LIMIT STATE FOR FREE USERS
  const [isCurrentUserPaid, setIsCurrentUserPaid] = useState<boolean>(false);
  const [dailyLimitReached, setDailyLimitReached] = useState<boolean>(false);

  const getToken = useCallback((): string | null => getAuthToken(), []);

  const loadDashboardData = useCallback(async (tabName: string, pageNum: number, append: boolean = false) => {
    const token = getToken();
    if (!token) {
      router.push('/');
      return;
    }

    // ⚡ 0MS INSTANT TAB CACHE HIT
    if (pageNum === 1 && !append && globalFeedCache[tabName] && globalFeedCache[tabName].profiles.length > 0) {
      const cached = globalFeedCache[tabName];
      setProfiles(cached.profiles);
      setHasMore(cached.hasMore);
      setLoading(false);

      // If cached less than 45 seconds ago, skip network call entirely (Zero DB Hit)
      if (Date.now() - cached.timestamp < 45000) {
        return;
      }
    } else if (pageNum === 1 && !append) {
      if (!globalFeedCache[tabName] || globalFeedCache[tabName].profiles.length === 0) {
        setLoading(true);
      }
    } else {
      setFetchingMore(true);
    }

    const startTime = Date.now();
    const res = await fetchDashboardApi(tabName, pageNum, token);

    if (res.isUnauthorized) {
      toast.dismiss();
      handleSilentSessionExpiry();
      return;
    }

    if (res.success && res.data) {
      const list = res.data.profiles || res.data.Profiles || [];
      const userPaid = Boolean(
        res.data.isCurrentUserPaid ?? res.data.IsCurrentUserPaid ?? 
        getClientSubscriptionStatus().isPaid
      );
      
      setIsCurrentUserPaid(userPaid);

      // Sync live paid status into localStorage user_details if present
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("user_details");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.isPaid = userPaid;
            parsed.isCurrentUserPaid = userPaid;
            if (res.data.currentUserPlanName) {
              parsed.planName = res.data.currentUserPlanName;
              parsed.membershipType = res.data.currentUserPlanName;
            }
            if (res.data.currentUserPlanExpiry) {
              parsed.planExpiryDate = res.data.currentUserPlanExpiry;
            }
            if (res.data.remainingContactsAllowed !== undefined) {
              parsed.remainingContacts = res.data.remainingContactsAllowed;
            }
            localStorage.setItem("user_details", JSON.stringify(parsed));
            window.dispatchEvent(new Event("user_details_updated"));
          } catch (e) {}
        }
      }

      const limitState = checkDailyViewLimit(list.length, userPaid, tabName);
      setDailyLimitReached(limitState.isLimitReached && !userPaid);

      let finalProfiles: any[] = [];
      if (append) {
        setProfiles((prev) => {
          const combined = [...prev, ...list];
          const curLimit = checkDailyViewLimit(combined.length, userPaid, tabName);
          finalProfiles = (curLimit.isLimitReached && !userPaid) ? combined.slice(0, DAILY_FREE_PROFILE_LIMIT) : combined;
          return finalProfiles;
        });
      } else {
        let updatedList = list;
        if (limitState.isLimitReached && !userPaid) {
          updatedList = list.slice(0, DAILY_FREE_PROFILE_LIMIT);
        }
        finalProfiles = updatedList;
        setProfiles(updatedList);
      }

      const nextHasMore = list.length >= 12 && (!limitState.isLimitReached || userPaid);
      setHasMore(nextHasMore);

      // Save to client-side tab cache and persistent sessionStorage
      if (!append) {
        const cacheObj = {
          profiles: finalProfiles,
          hasMore: nextHasMore,
          timestamp: Date.now()
        };
        globalFeedCache[tabName] = cacheObj;
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(`cached_dashboard_feed_${tabName}`, JSON.stringify(cacheObj));
          } catch (e) {}
        }

        // ⚡ PRELOAD PROFILE CARD IMAGES FOR INSTANT LOAD WITH ZERO BLANK PHOTOS
        if (finalProfiles.length > 0) {
          const photoUrls = finalProfiles.map((p: any) => p.photoUrl || p.mainPhotoUrl || p.PhotoUrl).filter(Boolean);
          await preloadCardImages(photoUrls);

          const elapsed = Date.now() - startTime;
          if (elapsed < 650) {
            await new Promise((r) => setTimeout(r, 650 - elapsed));
          }
        }
      }
    } else {
      // Graceful fallback - network status handled by NetworkStatusBanner
    }

    setLoading(false);
    setFetchingMore(false);
  }, [getToken, router]);

  useEffect(() => {
    setPage(1);
    loadDashboardData(activeTab, 1, false);
  }, [activeTab, loadDashboardData]);

  // ⚡ PURE REAL-TIME VERIFICATION: Query Redis to ensure only truly active users show green dots
  useEffect(() => {
    if (profiles.length > 0) {
      const ids = profiles.map((p: any) => Number(p.userId || p.UserId)).filter((id: number) => id > 0);
      if (ids.length > 0) {
        fetchBulkOnlineStatuses(ids);
      }
    }
  }, [profiles, fetchBulkOnlineStatuses]);

  // 🚀 AUTOMATIC INFINITE SCROLL PAGING (TRIGGERED NEAR BOTTOM OF SCROLL)
  useEffect(() => {
    const handleScroll = () => {
      if (loading || fetchingMore || !hasMore) return;
      if (dailyLimitReached && !isCurrentUserPaid) return;

      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 400) {
        setPage((prevPage) => {
          const nextPage = prevPage + 1;
          loadDashboardData(activeTab, nextPage, true);
          return nextPage;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, fetchingMore, hasMore, dailyLimitReached, isCurrentUserPaid, activeTab, loadDashboardData]);

  // 🚀 0MS INSTANT OPTIMISTIC UI INTERACTION
  const handleInteraction = async (receiverUserId: number, type: string, status: string = 'PENDING') => {
    const token = getToken();

    const targetId = Number(receiverUserId);
    // ⚡ INSTANT CARD REMOVAL IF ACCEPTED OR DECLINED ON DASHBOARD
    if (status === 'ACCEPTED' || status === 'DECLINED' || activeTab === 'requests') {
      setProfiles((prevProfiles) => prevProfiles.filter((p) => Number(p.userId || p.UserId || 0) !== targetId));
      if (globalFeedCache[activeTab]) {
        globalFeedCache[activeTab].profiles = globalFeedCache[activeTab].profiles.filter(
          (p) => Number(p.userId || p.UserId || 0) !== targetId
        );
      }
    } else {
      setProfiles((prevProfiles) =>
        prevProfiles.map((p) => {
          if (Number(p.userId || p.UserId || 0) === targetId) {
            const updated = { ...p };
            if (type.toUpperCase() === 'INTEREST') {
              updated.isInterestSent = true;
              updated.interestStatus = 'Sent';
            } else if (type.toUpperCase() === 'SHORTLIST') {
              updated.isShortlisted = status !== 'NONE';
            }
            return updated;
          }
          return p;
        })
      );
    }

    setActionState((prev) => ({ ...prev, [targetId]: true }));
    setActionTypeState((prev) => ({ ...prev, [targetId]: type }));

    if (token) {
      try {
        const response = await handleInteractionApiCall(receiverUserId, type, status, token);
        if (response && response.isUnauthorized) {
          toast.dismiss();
          toast.error("Session expired.");
          router.push('/');
        }
      } catch (e) {
        console.error("Optimistic interaction sync failed:", e);
      } finally {
        setActionState((prev) => ({ ...prev, [targetId]: false }));
        setActionTypeState((prev) => ({ ...prev, [targetId]: null }));
      }
    } else {
      setActionState((prev) => ({ ...prev, [targetId]: false }));
      setActionTypeState((prev) => ({ ...prev, [targetId]: null }));
    }
  };

  const handleViewProfile = (userId: number) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("last_browse_page", "/dashboard");
    }
    router.push(`/dashboard/profile?userId=${userId}`);
  };

  const handleInitiateChat = (profile: any) => {
    const status = getClientSubscriptionStatus();
    const canChat = status.isPaid && status.canChat;

    if (canChat) {
      if (typeof window !== "undefined") { sessionStorage.setItem("last_browse_page", "/dashboard"); }
      sessionStorage.setItem('active_chat_target', JSON.stringify({
        userId: profile.userId || profile.UserId,
        fullName: profile.fullName || profile.FullName,
        photoUrl: profile.photoUrl || profile.mainPhotoUrl || profile.PhotoUrl || ''
      }));
      router.push('/dashboard/messages');
    } else {
      setShowSubscriptionModal(true);
    }
  };

  const tabs = [
    { id: 'best-matches', label: 'Top Matches' },
    { id: 'online', label: 'Online Now' },
    { id: 'premium', label: 'VIP Members' },
  ];

  // ⚡ PURE REAL-TIME FILTERING: Strict Redis presence verification
  const displayedProfiles = useMemo(() => {
    if (activeTab === 'online') {
      return profiles.filter((p) => {
        const uId = Number(p.userId || p.UserId || 0);
        return onlineUsers[uId]?.isOnline === true || Boolean(p.isOnline ?? p.IsOnline);
      });
    }
    if (activeTab === 'premium') {
      return profiles.filter((p) => Boolean(p.isPremium ?? p.IsPremium));
    }
    return profiles;
  }, [profiles, activeTab, onlineUsers]);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-28 pt-2 sm:pt-4 selection:bg-[#e21e5b] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-3 sm:space-y-5">
        
        {/* 🌟 NIKAH FILTER TABS ROW */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 no-scrollbar">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  if (activeTab !== t.id) {
                    const cached = globalFeedCache[t.id];
                    if (cached && cached.profiles && cached.profiles.length > 0) {
                      setProfiles(cached.profiles);
                      setHasMore(cached.hasMore);
                      const curLimit = checkDailyViewLimit(cached.profiles.length, isCurrentUserPaid, t.id);
                      setDailyLimitReached(curLimit.isLimitReached && !isCurrentUserPaid);
                      setLoading(false);
                    } else {
                      const sessionFeed = getInitialFeed(t.id);
                      if (sessionFeed.length > 0) {
                        setProfiles(sessionFeed);
                        setLoading(false);
                      } else {
                        setLoading(true);
                      }
                    }
                    setActiveTab(t.id);
                  }
                }}
                className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer whitespace-nowrap border ${
                  isActive 
                    ? 'bg-[#0f0f0f] text-white border-[#0f0f0f] font-semibold shadow-xs' 
                    : 'bg-white text-[#0f0f0f] border-slate-200 hover:bg-slate-50 font-medium'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* PROFILES GRID */}
        {loading ? (
          <div className="py-10 sm:py-16 flex items-center justify-center">
            <ProfileAvatarLoader 
              message="Finding Best Matches For You" 
              subMessage="Connecting with verified halal matrimonial profiles..." 
            />
          </div>
        ) : displayedProfiles.length === 0 ? (
          <div className="py-16 px-4 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 text-[#d91b5c] flex items-center justify-center mx-auto shadow-xs">
              <Sparkles size={28} className="text-[#d91b5c]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-serif font-extrabold uppercase text-slate-900 tracking-tight">No Profiles Available</h3>
              <p className="text-slate-500 text-xs font-semibold max-w-xs mx-auto leading-relaxed">
                {activeTab === 'online' 
                  ? 'There are currently no members online right now. Switch to Best Matches to explore profiles.'
                  : 'There are currently no profiles available in this category. Check back later.'}
              </p>
            </div>
            <button 
              type="button"
              onClick={() => loadDashboardData(activeTab, 1, false)}
              className="px-6 py-2.5 rounded-full bg-[#d91b5c] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#b01348] shadow-md flex items-center gap-2 mx-auto cursor-pointer"
            >
              <RefreshCw size={14} /> Refresh Feed
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {displayedProfiles.map((profile) => {
                const uId = Number(profile.userId || profile.UserId || 0);
                return (
                  <ProfileCard
                    key={uId}
                    profile={profile}
                    actionLoading={actionState[uId] || false}
                    actionLoadingType={actionTypeState[uId] || null}
                    onInteraction={handleInteraction}
                    onViewProfile={handleViewProfile}
                    onInitiateChat={handleInitiateChat}
                  />
                );
              })}
            </div>

            {/* 🔒 24-HOUR DAILY 15 PROFILES VIEW LIMIT CARD (FOR FREE UNPAID USERS) */}
            {dailyLimitReached && !isCurrentUserPaid && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-[#1b0811] via-[#2c0b1a] to-[#120309] text-white rounded-3xl p-6 sm:p-8 border-2 border-amber-400/50 shadow-2xl text-center max-w-xl mx-auto space-y-4 relative overflow-hidden my-4"
              >
                {/* Glowing Background Accent */}
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-[#d91b5c]/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/30 text-amber-300 border-2 border-amber-400/60 flex items-center justify-center mx-auto shadow-lg shadow-amber-950/40">
                    <Lock size={30} className="text-amber-300" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="inline-block bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[10px] font-black uppercase px-3.5 py-1 rounded-full tracking-widest shadow-sm">
                    👑 VIP Daily Limit Reached
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif font-extrabold uppercase mt-2 text-white tracking-wide">
                    {activeTab === 'online' ? '15 / 15 Online Members Viewed Today' : '15 / 15 Free Profiles Viewed Today'}
                  </h3>
                  <p className="text-rose-100/80 text-xs sm:text-sm font-medium max-w-md mx-auto leading-relaxed">
                    Aapne aaj ke 15 muft rishte dekh liye hain. Naye rishte unlock hone me baaki hain, ya abhi VIP ban kar <span className="text-amber-300 font-bold">Unlimited Profiles</span> unlock karein!
                  </p>
                </div>
                
                {/* 🕒 LIVE TICKING COUNTDOWN TIMER */}
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-amber-400/40 max-w-xs mx-auto text-center space-y-1.5 shadow-inner">
                  <span className="text-[10px] uppercase font-black tracking-widest text-amber-300/90 block">
                    Daily Limit Resetting In
                  </span>
                  <div className="flex items-center justify-center gap-2 text-amber-300 font-mono font-bold text-xl sm:text-2xl tracking-wider">
                    <LiveCountdownDisplay tab={activeTab} />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowSubscriptionModal(true)}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer border border-amber-200"
                  >
                    <Crown size={18} className="fill-slate-950" />
                    <span>Upgrade to VIP Premium</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* INFINITE SCROLL BOTTOM LOADING INDICATOR */}
            {fetchingMore && (
              <div className="flex items-center justify-center gap-2 py-6 text-[#d91b5c]">
                <Loader2 size={24} className="animate-spin text-[#d91b5c]" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Loading More Profiles...</span>
              </div>
            )}
          </div>
        )}

      </div>

      {/* 👑 VIP PREMIUM SUBSCRIPTION MODAL */}
      <SubscriptionModal 
        isOpen={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)} 
      />

    </div>
  );
}
