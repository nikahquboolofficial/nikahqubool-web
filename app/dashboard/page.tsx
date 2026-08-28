"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, Flame, RefreshCw, Crown, Lock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { fetchDashboardApi, handleInteractionApiCall, fetchActiveSubscriptionApi } from '@/lib/api';
import { checkDailyViewLimit, formatTimeRemaining } from '@/lib/limitUtils';
import ProfileCard from '@/components/dashboard/ProfileCard';
import SubscriptionModal from '@/components/dashboard/SubscriptionModal';

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
  const [activeTab, setActiveTab] = useState('best-matches');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [actionState, setActionState] = useState<{ [key: number]: boolean }>({});
  const [actionTypeState, setActionTypeState] = useState<{ [key: number]: string | null }>({});

  // 🔒 24-HOUR / 20 PROFILE VIEW LIMIT STATE FOR FREE USERS
  const [isCurrentUserPaid, setIsCurrentUserPaid] = useState<boolean>(false);
  const [dailyLimitReached, setDailyLimitReached] = useState<boolean>(false);

  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const val = parts.pop()?.split(';').shift();
      return val ?? null;
    }
    return null;
  };

  const getToken = useCallback((): string | null => getCookie("user_token"), []);

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

    if (pageNum === 1) setLoading(true);
    else setFetchingMore(true);

    const res = await fetchDashboardApi(tabName, pageNum, token);

    if (res.isUnauthorized) {
      toast.dismiss();
      toast.error("Session expired.");
      router.push('/');
      return;
    }

    if (res.success && res.data) {
      const list = res.data.profiles || res.data.Profiles || [];
      const userPaid = Boolean(res.data.isCurrentUserPaid ?? res.data.IsCurrentUserPaid ?? list[0]?.isCurrentUserPaid ?? list[0]?.IsCurrentUserPaid);
      
      setIsCurrentUserPaid(userPaid);

      const limitState = checkDailyViewLimit(list.length, userPaid);
      setDailyLimitReached(limitState.isLimitReached && !userPaid);

      if (append) {
        setProfiles((prev) => {
          const combined = [...prev, ...list];
          const curLimit = checkDailyViewLimit(combined.length, userPaid);
          if (curLimit.isLimitReached && !userPaid) {
            return combined.slice(0, 20);
          }
          return combined;
        });
      } else {
        let updatedList = list;
        if (limitState.isLimitReached && !userPaid) {
          updatedList = list.slice(0, 20);
        }
        setProfiles(updatedList);
      }

      setHasMore(list.length >= 12 && (!limitState.isLimitReached || userPaid));
    } else {
      toast.error(res.message || "Failed to load profiles.");
    }

    setLoading(false);
    setFetchingMore(false);
  }, [getToken, router, checkDailyViewLimitState, dailyLimitReached]);

  useEffect(() => {
    setPage(1);
    loadDashboardData(activeTab, 1, false);
  }, [activeTab, loadDashboardData]);

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
        if (p.userId === receiverUserId) {
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
    if (typeof window !== "undefined") {
      sessionStorage.setItem("viewing_profile_target", JSON.stringify({ userId }));
      localStorage.setItem("viewing_profile_target", JSON.stringify({ userId }));
    }
    if (token) {
      handleInteractionApiCall(userId, 'VISIT', 'PENDING', token).catch(() => {});
    }
    router.push('/dashboard/profile?userId=' + userId);
  };

  const handleInitiateChat = async (profile: any) => {
    const token = getToken();
    let isPaid = Boolean(profile.isCurrentUserPaid ?? profile.IsCurrentUserPaid ?? isCurrentUserPaid);
    
    if (!isPaid && typeof window !== "undefined") {
      const stored = localStorage.getItem("user_details");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          isPaid = Boolean(parsed.isPaid || parsed.IsPaid || parsed.isCurrentUserPaid || parsed.IsCurrentUserPaid || parsed.isPremium || parsed.IsPremium);
        } catch (e) {}
      }
    }

    if (!isPaid && token) {
      const subRes = await fetchActiveSubscriptionApi(token);
      if (subRes.success && subRes.data) {
        isPaid = true;
        setIsCurrentUserPaid(true);
      }
    }

    if (isPaid) {
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
    { id: 'best-matches', label: 'Best Matches', icon: Sparkles },
    { id: 'online', label: 'Online', icon: Flame },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-28 pt-4 selection:bg-[#d91b5c] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* 🌟 CLEAN COMPACT 2-TAB BAR CONTAINER (BEST MATCHES & ONLINE - PURE WHITE THEME) */}
        <div className="bg-white border border-slate-200 rounded-full p-1.5 shadow-xs max-w-xs mx-auto">
          <div className="grid grid-cols-2 gap-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`py-2 px-3 rounded-full text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-slate-950 text-white font-black shadow-sm' 
                      : 'bg-transparent hover:bg-slate-100 text-slate-900 font-bold'
                  }`}
                >
                  <Icon size={15} className={isActive ? 'text-amber-300 fill-amber-300' : 'text-slate-700'} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PROFILES GRID */}
        {loading ? (
          <div className="min-h-[420px] flex flex-col items-center justify-center text-[#d91b5c]">
            <Loader2 size={48} className="animate-spin mb-3 text-[#d91b5c]" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Discovering Verified Profiles...</span>
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-rose-100 shadow-xl max-w-md mx-auto space-y-4">
            <div className="w-18 h-18 rounded-full bg-rose-50 border-2 border-rose-200 text-[#d91b5c] flex items-center justify-center mx-auto shadow-xs">
              <Sparkles size={36} className="text-amber-500" />
            </div>
            <h3 className="text-lg font-serif font-extrabold text-slate-900 uppercase">No Profiles Available</h3>
            <p className="text-slate-500 text-xs font-semibold max-w-xs mx-auto leading-relaxed">
              {activeTab === 'online' 
                ? 'There are currently no members online right now. Switch to Best Matches to explore profiles.'
                : 'There are currently no profiles available in this category. Check back later.'}
            </p>
            <button 
              type="button"
              onClick={() => setActiveTab('best-matches')} 
              className="px-7 py-3 rounded-full bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] hover:brightness-110 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-rose-900/20 border border-rose-300/30"
            >
              Explore Best Matches
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {profiles.map((profile) => (
                <ProfileCard
                  key={profile.userId}
                  profile={profile}
                  actionLoading={actionState[profile.userId] || false}
                  actionLoadingType={actionTypeState[profile.userId] || null}
                  onInteraction={handleInteraction}
                  onViewProfile={handleViewProfile}
                  onInitiateChat={handleInitiateChat}
                />
              ))}
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
