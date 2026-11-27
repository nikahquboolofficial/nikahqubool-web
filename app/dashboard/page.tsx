"use client";

import SubscriptionModal from '@/components/dashboard/SubscriptionModal';
import { getClientSubscriptionStatus } from '@/lib/subscriptionUtils';
import { applyPersistedInteractions, saveShortlistState, saveInterestSentState } from '@/lib/interactionStore';
import React, { useRef,  useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, Flame, RefreshCw, Crown, Lock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { fetchDashboardApi, handleInteractionApiCall, fetchActiveSubscriptionApi, handleSilentSessionExpiry } from '@/lib/api';
import { checkDailyViewLimit, formatTimeRemaining, DAILY_FREE_PROFILE_LIMIT, getRemainingTimeUntilMidnight } from '@/lib/limitUtils';
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
      const remaining = getRemainingTimeUntilMidnight();
      setTimeText(formatTimeRemaining(remaining));
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
          const applied = applyPersistedInteractions(parsed.profiles);
          globalFeedCache[tabName] = { ...parsed, profiles: applied };
          return applied;
        }
      }
    } catch (e) {}
  }
  const fallback = globalFeedCache[tabName]?.profiles || [];
  return applyPersistedInteractions(fallback);
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

  // 🔒 24-HOUR / 20 PROFILE VIEW LIMIT STATE FOR FREE USERS
  const [isCurrentUserPaid, setIsCurrentUserPaid] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return getClientSubscriptionStatus().isPaid;
    }
    return false;
  });
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
      setProfiles(applyPersistedInteractions(cached.profiles));
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
      const rawList = res.data.profiles || res.data.Profiles || [];
      const list = applyPersistedInteractions(rawList);
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

      const nextHasMore = list.length >= 20 && (!limitState.isLimitReached || userPaid);
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
      const isInterest = type.toUpperCase() === 'INTEREST';
      const isShortlist = type.toUpperCase() === 'SHORTLIST';
      const nextShort = isShortlist ? (status === 'SHORTLISTED' || status === 'ACTIVE') : false;

      if (isInterest) {
        saveInterestSentState(targetId);
      } else if (isShortlist) {
        saveShortlistState(targetId, nextShort);
      }

      setProfiles((prevProfiles) =>
        prevProfiles.map((p) => {
          if (Number(p.userId || p.UserId || 0) === targetId) {
            const updated = { ...p };
            if (isInterest) {
              updated.isInterestSent = true;
              updated.interestStatus = 'Sent';
            } else if (isShortlist) {
              updated.isShortlisted = nextShort;
              updated.IsShortlisted = nextShort;
            }
            return updated;
          }
          return p;
        })
      );

      // ⚡ Synchronize across all cached tabs so tab switching never reverts interaction
      Object.keys(globalFeedCache).forEach((tabKey) => {
        if (globalFeedCache[tabKey]?.profiles) {
          globalFeedCache[tabKey].profiles = globalFeedCache[tabKey].profiles.map((p) => {
            if (Number(p.userId || p.UserId || 0) === targetId) {
              const updated = { ...p };
              if (isInterest) {
                updated.isInterestSent = true;
                updated.IsInterestSent = true;
                updated.hasSentInterest = true;
                updated.interestStatus = 'Sent';
                updated.InterestStatus = 'Sent';
              } else if (isShortlist) {
                updated.isShortlisted = nextShort;
                updated.IsShortlisted = nextShort;
              }
              return updated;
            }
            return p;
          });
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem(`cached_dashboard_feed_${tabKey}`, JSON.stringify(globalFeedCache[tabKey]));
            } catch (e) {}
          }
        }
      });
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
        } else if (response && !response.success) {
          // 🔄 Revert optimistic state if interest limit reached or request rejected
          if (type.toUpperCase() === 'INTEREST') {
            setProfiles((prevProfiles) =>
              prevProfiles.map((p) => {
                if (Number(p.userId || p.UserId || 0) === targetId) {
                  return { ...p, isInterestSent: false, interestStatus: '' };
                }
                return p;
              })
            );
          }
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

  const isNavigatingRef = useRef(false);
  const handleViewProfile = (userId: number) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setTimeout(() => { isNavigatingRef.current = false; }, 1200);
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

  
  // ⚡ Sync shortlist updates in real-time across all tabs & pages
  useEffect(() => {
    const handleShortlistUpdate = (e: any) => {
      const { userId, isShortlisted } = e.detail || {};
      if (!userId) return;
      setProfiles((prev) =>
        prev.map((p) => {
          if (Number(p.userId || p.UserId || 0) === Number(userId)) {
            return { ...p, isShortlisted, IsShortlisted: isShortlisted };
          }
          return p;
        })
      );
      Object.keys(globalFeedCache).forEach((tabKey) => {
        if (globalFeedCache[tabKey]?.profiles) {
          globalFeedCache[tabKey].profiles = globalFeedCache[tabKey].profiles.map((p) => {
            if (Number(p.userId || p.UserId || 0) === Number(userId)) {
              return { ...p, isShortlisted, IsShortlisted: isShortlisted };
            }
            return p;
          });
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem('cached_dashboard_feed_' + tabKey, JSON.stringify(globalFeedCache[tabKey]));
            } catch (e) {}
          }
        }
      });
    };
    const handleInterestSentUpdate = (e: any) => {
      const { userId } = e.detail || {};
      if (!userId) return;
      const targetNum = Number(userId);

      setProfiles((prev) =>
        prev.map((p) => {
          if (Number(p.userId || p.UserId || 0) === targetNum) {
            return { ...p, isInterestSent: true, interestStatus: 'Sent' };
          }
          return p;
        })
      );

      Object.keys(globalFeedCache).forEach((tabKey) => {
        if (globalFeedCache[tabKey]?.profiles) {
          globalFeedCache[tabKey].profiles = globalFeedCache[tabKey].profiles.map((p) => {
            if (Number(p.userId || p.UserId || 0) === targetNum) {
              return { 
                ...p, 
                isInterestSent: true, 
                IsInterestSent: true, 
                hasSentInterest: true, 
                interestStatus: 'Sent', 
                InterestStatus: 'Sent' 
              };
            }
            return p;
          });
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem(`cached_dashboard_feed_${tabKey}`, JSON.stringify(globalFeedCache[tabKey]));
            } catch (e) {}
          }
        }
      });
    };

    const handleNetworkRecovered = () => {
      loadDashboardData(activeTab, 1, false);
    };

    window.addEventListener('shortlist_updated', handleShortlistUpdate);
    window.addEventListener('interest_sent_updated', handleInterestSentUpdate);
    window.addEventListener('network_recovered', handleNetworkRecovered);

    return () => {
      window.removeEventListener('shortlist_updated', handleShortlistUpdate);
      window.removeEventListener('interest_sent_updated', handleInterestSentUpdate);
      window.removeEventListener('network_recovered', handleNetworkRecovered);
    };
  }, [activeTab, loadDashboardData]);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-28 pt-0 selection:bg-[#e21e5b] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* 🌟 NIKAH FILTER TABS ROW (100% FIXED UNDER FIXED SLIM HEADER) */}
      <div className="fixed top-14 md:top-15 inset-x-0 z-40 bg-white py-2 px-3 sm:px-6 lg:px-8 border-b border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
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
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-[104px] md:pt-[114px] space-y-4">
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

            {/* 🔒 24-HOUR DAILY 20 PROFILES VIEW LIMIT CARD (CHAMPAGNE GOLD & GLOSSY PURE WHITE VIP THEME) */}
            {(!loading && !isCurrentUserPaid && dailyLimitReached) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-b from-white via-[#FFFDF5] to-white text-slate-900 rounded-3xl p-6 sm:p-9 border-2 border-amber-300 shadow-[0_12px_45px_rgba(217,119,6,0.12)] text-center max-w-xl mx-auto space-y-5 relative overflow-hidden my-6 backdrop-blur-md"
              >
                {/* Glowing Glossy Gold Background Accents */}
                <div className="absolute -top-16 -right-16 w-44 h-44 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-[#E21E5B]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-500 text-slate-950 border-2 border-white flex items-center justify-center mx-auto shadow-lg shadow-amber-400/30">
                    <Lock size={28} className="text-slate-950 stroke-[2.5]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 border border-amber-300/80 text-[11px] font-black uppercase px-4 py-1.5 rounded-full tracking-wider shadow-xs">
                    <Crown size={13} className="text-amber-600 fill-amber-600" />
                    <span>VIP Daily Limit Reached</span>
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight mt-1">
                    {activeTab === 'online' ? '20 / 20 Online Members Viewed Today' : '20 / 20 Free Profiles Viewed Today'}
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm font-medium max-w-md mx-auto leading-relaxed">
                    Aapne aaj ke 20 muft rishte dekh liye hain. Naye rishte kal 12:00 AM unlock honge, ya abhi VIP ban kar <span className="text-[#E21E5B] font-bold">Unlimited Profiles</span> unlock karein!
                  </p>
                </div>
                
                {/* 🕒 LIVE TICKING COUNTDOWN TIMER BOX (GLOSSY GOLD DIGITAL) */}
                <div className="bg-gradient-to-br from-amber-500/10 via-yellow-500/15 to-amber-500/5 p-4 rounded-2xl border-2 border-amber-300/70 max-w-xs mx-auto text-center space-y-1.5 shadow-sm backdrop-blur-xs">
                  <span className="text-[10px] uppercase font-black tracking-widest text-amber-800 block">
                    Daily Limit Resetting In
                  </span>
                  <div className="flex items-center justify-center gap-2 text-amber-700 font-mono font-black text-2xl sm:text-3xl tracking-widest">
                    <LiveCountdownDisplay tab={activeTab} />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowSubscriptionModal(true)}
                    className="w-full sm:w-auto px-9 py-4 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/25 hover:shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer border border-amber-200"
                  >
                    <Crown size={18} className="fill-slate-950" />
                    <span>Upgrade to VIP & Unlock All</span>
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
