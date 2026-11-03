"use client";

import SubscriptionModal from '@/components/dashboard/SubscriptionModal';

import { getClientSubscriptionStatus } from '@/lib/subscriptionUtils';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, Flame, RefreshCw, Crown, Lock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { fetchDashboardApi, handleInteractionApiCall, fetchActiveSubscriptionApi } from '@/lib/api';
import { checkDailyViewLimit, formatTimeRemaining } from '@/lib/limitUtils';
import { getAuthToken } from '@/lib/auth';
import ProfileCard from '@/components/dashboard/ProfileCard';
import ProfileCardSkeleton from '@/components/dashboard/ProfileCardSkeleton';
import { useSignalR } from '@/context/SignalRContext';

function LiveCountdownDisplay() {
  const [timeText, setTimeText] = useState('24h 00m 00s');

  useEffect(() => {
    const updateTimer = () => {
      const stored = localStorage.getItem('daily_profile_views_tracker');
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
  }, []);

  return <span>{timeText}</span>;
}

export default function VIPCleanDashboardPage() {
  const router = useRouter();
  const { onlineUsers, fetchBulkOnlineStatuses } = useSignalR();
  const [activeTab, setActiveTab] = useState('best-matches');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [actionState, setActionState] = useState<{ [key: number]: boolean }>({});
  const [actionTypeState, setActionTypeState] = useState<{ [key: number]: string | null }>({});

  // ⚡ HIGH-SPEED CLIENT TAB CACHE (STALE-WHILE-REVALIDATE FOR 0MS TAB SWITCHING)
  const tabCacheRef = React.useRef<Record<string, { profiles: any[], hasMore: boolean, timestamp: number }>>({});

  // 🔒 24-HOUR / 20 PROFILE VIEW LIMIT STATE FOR FREE USERS
  const [isCurrentUserPaid, setIsCurrentUserPaid] = useState<boolean>(false);
  const [dailyLimitReached, setDailyLimitReached] = useState<boolean>(false);

  const getToken = useCallback((): string | null => getAuthToken(), []);

  // 🕒 CHECK & UPDATE 24-HOUR PROFILE VIEW COUNT IN LOCALSTORAGE
  const checkDailyViewLimitState = useCallback((newLoadedProfilesCount: number, paidStatus: boolean) => {
    const limitState = checkDailyViewLimit(newLoadedProfilesCount, paidStatus);
    setDailyLimitReached(limitState.isLimitReached);
    return limitState.isLimitReached;
  }, []);

  const loadDashboardData = useCallback(async (tabName: string, pageNum: number, append: boolean = false) => {
    const token = getToken();
    if (!token) {
      router.push('/');
      return;
    }

    // ⚡ 0MS INSTANT TAB CACHE HIT
    if (pageNum === 1 && !append && tabCacheRef.current[tabName]) {
      const cached = tabCacheRef.current[tabName];
      setProfiles(cached.profiles);
      setHasMore(cached.hasMore);
      setLoading(false);

      // If cached less than 45 seconds ago, skip network call entirely (Zero DB Hit)
      if (Date.now() - cached.timestamp < 45000) {
        return;
      }
    } else if (pageNum === 1 && !append) {
      setLoading(true);
    } else {
      setFetchingMore(true);
    }

    const res = await fetchDashboardApi(tabName, pageNum, token);

    if (res.isUnauthorized) {
      toast.dismiss();
      toast.error("Session expired.");
      router.push('/');
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

      const limitState = checkDailyViewLimit(list.length, userPaid);
      setDailyLimitReached(limitState.isLimitReached && !userPaid);

      let finalProfiles: any[] = [];
      if (append) {
        setProfiles((prev) => {
          const combined = [...prev, ...list];
          const curLimit = checkDailyViewLimit(combined.length, userPaid);
          finalProfiles = (curLimit.isLimitReached && !userPaid) ? combined.slice(0, 20) : combined;
          return finalProfiles;
        });
      } else {
        let updatedList = list;
        if (limitState.isLimitReached && !userPaid) {
          updatedList = list.slice(0, 20);
        }
        finalProfiles = updatedList;
        setProfiles(updatedList);
      }

      const nextHasMore = list.length >= 12 && (!limitState.isLimitReached || userPaid);
      setHasMore(nextHasMore);

      // Save to client-side tab cache
      if (!append) {
        tabCacheRef.current[tabName] = {
          profiles: finalProfiles,
          hasMore: nextHasMore,
          timestamp: Date.now()
        };
      }
    } else {
      toast.error(res.message || "Failed to load profiles.");
    }

    setLoading(false);
    setFetchingMore(false);
  }, [getToken, router, checkDailyViewLimitState]);

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

    setProfiles((prevProfiles) =>
      prevProfiles.map((p) => {
        const uId = Number(p.userId || p.UserId || 0);
        if (uId === receiverUserId) {
          if (type === 'SHORTLIST') {
            const currentIsShort = Boolean(p.isShortlisted ?? p.IsShortlisted);
            return { ...p, isShortlisted: !currentIsShort, IsShortlisted: !currentIsShort };
          }
          if (type === 'INTEREST') {
            const newStatus = status === 'ACCEPTED' ? 'Accepted' : status === 'DECLINED' ? 'Declined' : 'SentPending';
            return { ...p, interestStatus: newStatus, InterestStatus: newStatus };
          }
        }
        return p;
      })
    );

    setActionState((prev) => ({ ...prev, [receiverUserId]: true }));
    setActionTypeState((prev) => ({ ...prev, [receiverUserId]: type }));

    const res = await handleInteractionApiCall(receiverUserId, type, status, token);

    setActionState((prev) => ({ ...prev, [receiverUserId]: false }));
    setActionTypeState((prev) => ({ ...prev, [receiverUserId]: null }));

    if (!res.success) {
      loadDashboardData(activeTab, 1, false);
    }
  };

  const handleViewProfile = (userId: number) => {
    const token = getToken();
    const targetProfile = profiles.find((p) => Number(p.userId || p.UserId) === userId);
    if (typeof window !== "undefined") {
      const dataToStore = targetProfile ? { ...targetProfile, userId } : { userId };
      sessionStorage.setItem("viewing_profile_target", JSON.stringify(dataToStore));
      localStorage.setItem("viewing_profile_target", JSON.stringify(dataToStore));
    }
    if (token) {
      handleInteractionApiCall(userId, 'VISIT', 'PENDING', token).catch(() => {});
    }
    router.push('/dashboard/profile?userId=' + userId);
  };

  const handleInitiateChat = async (profile: any) => {
    const status = getClientSubscriptionStatus();
    const canChat = isCurrentUserPaid || status.canChat;

    if (canChat) {
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
    { id: 'best-matches', label: 'Best Matches' },
    { id: 'online', label: 'Online' },
    { id: 'premium', label: 'Premium' },
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
    <div className="min-h-screen bg-[#faf8f5] font-sans text-slate-900 pb-28 pt-2 sm:pt-4 selection:bg-[#e21e5b] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-3 sm:space-y-5">
        
        {/* 🌟 NIKAH FOREVER FILTER TABS ROW */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 no-scrollbar">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  if (activeTab !== t.id) {
                    setProfiles([]);
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
          <div className="py-4">
            <ProfileCardSkeleton count={4} />
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
              onClick={() => setActiveTab('best-matches')} 
              className="px-6 py-2.5 rounded-full bg-slate-950 hover:bg-slate-900 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm transition-all"
            >
              Explore Best Matches
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 justify-center max-w-[420px] sm:max-w-none mx-auto">
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

            {/* 🔒 24-HOUR DAILY 20 PROFILES VIEW LIMIT CARD (FOR FREE UNPAID USERS) */}
            {dailyLimitReached && !isCurrentUserPaid && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-slate-900 via-[#3a051b] to-slate-950 text-white rounded-3xl p-8 border-2 border-amber-400/40 shadow-2xl text-center max-w-xl mx-auto space-y-4 relative overflow-hidden"
              >
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-300 border-2 border-amber-400/50 flex items-center justify-center mx-auto shadow-lg">
                  <Lock size={32} />
                </div>
                <div>
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
                    24-Hour Limit Reached
                  </span>
                  <h3 className="text-xl font-serif font-extrabold uppercase mt-2 text-white tracking-wide">
                    20 / 20 Free Profiles Viewed Today
                  </h3>
                  <p className="text-rose-100/80 text-xs font-medium max-w-md mx-auto mt-1 leading-relaxed">
                    Free accounts are restricted to viewing 20 profiles per 24 hours. Upgrade to VIP Premium to unlock unlimited instant profiles or wait for timer reset.
                  </p>
                </div>
                
                {/* 🕒 LIVE TICKING COUNTDOWN TIMER */}
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-amber-400/30 max-w-xs mx-auto text-center space-y-1 shadow-inner">
                  <span className="text-[10px] uppercase font-black tracking-widest text-amber-300">Resetting Daily Limit In</span>
                  <div className="flex items-center justify-center gap-2 text-amber-300 font-mono font-bold text-xl">
                    <LiveCountdownDisplay />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="button"
                    onClick={() => router.push('/dashboard/membership')}
                    className="px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 mx-auto cursor-pointer border border-amber-200"
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
