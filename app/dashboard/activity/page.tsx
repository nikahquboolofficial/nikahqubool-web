"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  UserCheck, Loader2, Sparkles, Heart, Flame, RefreshCw, Crown, 
  Send, Inbox, Bookmark, Eye, ArrowLeft, Lock, Users, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { fetchDashboardApi, handleInteractionApiCall } from '@/lib/api';
import ProfileCard from '@/components/dashboard/ProfileCard';

type MainCategory = 'all' | 'interests' | 'visitors' | 'gallery' | 'contacts' | 'shortlist';

interface SubTabConfig {
  id: string;
  label: string;
  countKey?: string;
  icon: any;
}

const CATEGORY_SUBTABS: Record<MainCategory, SubTabConfig[]> = {
  all: [
    { id: 'all', label: 'All Activity', icon: Sparkles }
  ],
  interests: [
    { id: 'requests', label: 'Received', countKey: 'requestsCount', icon: Inbox },
    { id: 'interests-sent', label: 'Sent', icon: Send },
    { id: 'accepted', label: 'Accepted', countKey: 'acceptedCount', icon: CheckCircle2 },
  ],
  visitors: [
    { id: 'visitors', label: 'Visited Me', countKey: 'visitorsCount', icon: Flame },
    { id: 'profiles-viewed', label: 'I Visited', icon: Eye },
  ],
  gallery: [
    { id: 'gallery-requests-received', label: 'Received', countKey: 'photosCount', icon: Inbox },
    { id: 'gallery-requests', label: 'Sent', icon: Lock },
  ],
  contacts: [
    { id: 'viewed-my-profile', label: 'Viewed Mine', icon: Eye },
    { id: 'profiles-viewed', label: 'I Viewed', icon: Eye },
  ],
  shortlist: [
    { id: 'shortlisted-by-me', label: 'Shortlisted By Me', countKey: 'shortlistedCount', icon: Bookmark },
  ],
};

function ActivityPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryCat = (searchParams.get('cat') as MainCategory) || 'all';
  const queryTab = searchParams.get('tab') || 'all';

  const [activeCat, setActiveCat] = useState<MainCategory>(queryCat);
  const [activeSubTab, setActiveSubTab] = useState<string>(queryTab);

  const [profiles, setProfiles] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [tabCounts, setTabCounts] = useState<any>({ 
    matchesCount: 0, requestsCount: 0, acceptedCount: 0, photosCount: 0, visitorsCount: 0, shortlistedCount: 0 
  });
  const [actionState, setActionState] = useState<{ [key: number]: boolean }>({});

  // 🚀 HIGH-PERFORMANCE ENTERPRISE CACHE STORE (STALE-WHILE-REVALIDATE PATTERN)
  const tabCacheRef = useRef<{ [tabName: string]: { profiles: any[]; counts: any; hasMore: boolean } }>({});
  const initialLoadRef = useRef(false);

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

  useEffect(() => {
    const qCat = searchParams.get('cat') as MainCategory;
    const qTab = searchParams.get('tab');
    if (qCat && qCat !== activeCat) setActiveCat(qCat);
    if (qTab && qTab !== activeSubTab) setActiveSubTab(qTab);
  }, [searchParams, activeCat, activeSubTab]);

  const loadActivityData = useCallback(async (tabName: string, pageNum: number, append: boolean = false) => {
    const token = getToken();
    if (!token) {
      router.push('/');
      return;
    }

    // ⚡ INSTANT RENDER FROM CACHE IF AVAILABLE (0 MILLISECONDS DELAY!)
    if (pageNum === 1 && tabCacheRef.current[tabName]) {
      const cached = tabCacheRef.current[tabName];
      setProfiles(cached.profiles);
      if (cached.counts) setTabCounts(cached.counts);
      setHasMore(cached.hasMore);
      setLoading(false); // 🚫 NO LOADING SPINNER OVERLAY!
    } else if (pageNum === 1 && !tabCacheRef.current[tabName]) {
      setLoading(true);
    } else if (pageNum > 1) {
      setFetchingMore(true);
    }

    // 🌐 SILENT BACKGROUND REVALIDATION (STAYS 100% FRESH SILENTLY)
    const res = await fetchDashboardApi(tabName, pageNum, token);

    if (res.isUnauthorized) {
      toast.dismiss();
      toast.error("Session expired.");
      router.push('/');
      return;
    }

    if (res.success && res.data) {
      const list = res.data.profiles || res.data.Profiles || [];
      const counts = res.data.counts || res.data.Counts || {};

      const newProfilesList = append ? [...(tabCacheRef.current[tabName]?.profiles || []), ...list] : list;
      const updatedCounts = (counts && Object.keys(counts).length > 0) ? counts : tabCacheRef.current[tabName]?.counts;
      const updatedHasMore = list.length >= 12;

      tabCacheRef.current[tabName] = {
        profiles: newProfilesList,
        counts: updatedCounts,
        hasMore: updatedHasMore
      };

      if (append) {
        setProfiles((prev) => [...prev, ...list]);
      } else {
        setProfiles(list);
      }

      if (counts && Object.keys(counts).length > 0) {
        setTabCounts(counts);
      }

      setHasMore(updatedHasMore);
    }

    setLoading(false);
    setFetchingMore(false);
  }, [getToken, router]);

  useEffect(() => {
    setPage(1);
    loadActivityData(activeSubTab, 1, false);
  }, [activeSubTab, loadActivityData]);

  const handleCatChange = (cat: MainCategory) => {
    setActiveCat(cat);
    const firstSubTab = CATEGORY_SUBTABS[cat]?.[0]?.id || 'requests';
    setActiveSubTab(firstSubTab);

    // ⚡ Instant Cache Switch (0 ms)
    if (tabCacheRef.current[firstSubTab]) {
      setProfiles(tabCacheRef.current[firstSubTab].profiles);
      setHasMore(tabCacheRef.current[firstSubTab].hasMore);
      setLoading(false);
    }
  };

  const handleSubTabChange = (subTabId: string) => {
    setActiveSubTab(subTabId);

    // ⚡ Instant Cache Switch (0 ms)
    if (tabCacheRef.current[subTabId]) {
      setProfiles(tabCacheRef.current[subTabId].profiles);
      setHasMore(tabCacheRef.current[subTabId].hasMore);
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || fetchingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadActivityData(activeSubTab, nextPage, true);
  };

  const handleInteraction = async (receiverUserId: number, type: string, status: string = 'PENDING') => {
    const token = getToken();

    // ⚡ OPTIMISTIC INSTANT CACHE UPDATE ACROSS ALL TABS
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
    const res = await handleInteractionApiCall(receiverUserId, type, status, token);
    setActionState((prev) => ({ ...prev, [receiverUserId]: false }));

    if (res.success) {
      toast.dismiss();
      toast.success(res.message || "Action updated instantly");
    } else {
      toast.dismiss();
      toast.error(res.message || "Action failed");
      loadActivityData(activeSubTab, 1, false);
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

  const handleInitiateChat = (profile: any) => {
    const isPaid = Boolean(profile.isCurrentUserPaid ?? profile.IsCurrentUserPaid);
    
    if (isPaid) {
      sessionStorage.setItem('active_chat_target', JSON.stringify({
        userId: profile.userId,
        fullName: profile.fullName,
        photoUrl: profile.photoUrl || profile.mainPhotoUrl || ''
      }));
      router.push('/dashboard/messages');
    } else {
      setShowSubscriptionModal(true);
    }
  };

  const mainCategories: { id: MainCategory; label: string; icon: any }[] = [
    { id: 'all', label: 'All', icon: Sparkles },
    { id: 'interests', label: 'Interests', icon: Heart },
    { id: 'visitors', label: 'Profile Visits', icon: Flame },
    { id: 'gallery', label: 'Gallery Request', icon: Lock },
    { id: 'contacts', label: 'Contacts View', icon: Eye },
    { id: 'shortlist', label: 'Shortlist', icon: Bookmark },
  ];

  const currentSubTabs = CATEGORY_SUBTABS[activeCat] || [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-28 pt-4 selection:bg-[#d91b5c] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-3 pt-2">
        
        {/* 🌟 LEVEL 1: MAIN CATEGORY TABS (PURE WHITE THEME + COMPACT BLACK HIGHLIGHT PILL) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {mainCategories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCat === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCatChange(cat.id)}
                className={`py-1.5 px-4 rounded-full text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer whitespace-nowrap active:scale-95 ${
                  isActive 
                    ? 'bg-slate-950 text-white font-black shadow-sm' 
                    : 'bg-white hover:bg-slate-100 text-slate-900 font-bold border border-slate-200 shadow-xs'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-amber-300 fill-amber-300' : 'text-slate-700'} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* 🌟 LEVEL 2: SECONDARY NESTED SUB-TABS (PURE WHITE THEME + COMPACT BLACK HIGHLIGHT PILL) */}
        {currentSubTabs.length > 1 && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {currentSubTabs.map((sub) => {
              const SubIcon = sub.icon;
              const isSubActive = activeSubTab === sub.id;
              const cnt = sub.countKey ? tabCounts[sub.countKey] || 0 : 0;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleSubTabChange(sub.id)}
                  className={`py-1 px-3.5 rounded-full text-[11px] font-bold tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                    isSubActive 
                      ? 'bg-slate-900 text-white font-black shadow-xs' 
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200 font-semibold'
                  }`}
                >
                  <SubIcon size={12} className={isSubActive ? 'text-amber-300' : 'text-slate-600'} />
                  <span>{sub.label}</span>
                  {cnt > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${isSubActive ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}`}>
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* 🚀 PROFILES GRID WITH ZERO FLICKERING & ZERO JUMP LOADING */}
        {loading && profiles.length === 0 ? (
          <div className="min-h-[420px] flex flex-col items-center justify-center text-[#d91b5c]">
            <Loader2 size={44} className="animate-spin mb-3 text-[#d91b5c]" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Loading Activity Profiles...</span>
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto space-y-4 my-6">
            <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center mx-auto shadow-xs">
              <Sparkles size={32} className="text-amber-500" />
            </div>
            <h3 className="text-lg font-serif font-extrabold text-slate-900">No Activity Recorded</h3>
            <p className="text-slate-500 text-xs font-medium max-w-xs mx-auto leading-relaxed">
              There are currently no profiles under this activity category. Switch categories to view other records.
            </p>
            <button 
              type="button"
              onClick={() => handleCatChange('interests')} 
              className="px-6 py-2.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold tracking-wide cursor-pointer shadow-sm"
            >
              View Interests
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.userId}
                profile={profile}
                activeTab={activeSubTab}
                actionLoading={actionState[profile.userId] || false}
                onInteraction={handleInteraction}
                onViewProfile={handleViewProfile}
                onInitiateChat={handleInitiateChat}
              />
            ))}
          </div>
        )}

        {/* LOAD MORE BUTTON */}
        {!loading && hasMore && profiles.length > 0 && (
          <div className="text-center pt-6">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={fetchingMore}
              className="px-8 py-3 rounded-full bg-slate-950 hover:bg-slate-800 text-white border border-slate-700 font-bold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center gap-2.5 mx-auto cursor-pointer"
            >
              {fetchingMore ? <Loader2 size={16} className="animate-spin text-amber-300" /> : <RefreshCw size={16} className="text-amber-300" />}
              <span>Load More Profiles</span>
            </button>
          </div>
        )}

      </div>

      {/* 👑 VIP PREMIUM SUBSCRIPTION MODAL */}
      <AnimatePresence>
        {showSubscriptionModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border-2 border-rose-100 relative"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                <Crown size={36} className="fill-slate-950" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-serif font-black text-slate-900 uppercase">Upgrade to VIP</h3>
                <p className="text-xs text-slate-600 font-bold">
                  Direct Messaging is unlocked for active VIP members!
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubscriptionModal(false);
                    router.push('/dashboard/membership');
                  }}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-[#d91b5c] to-rose-600 hover:brightness-110 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-rose-900/20 active:scale-95 transition-all cursor-pointer"
                >
                  View Membership Plans
                </button>
                <button
                  type="button"
                  onClick={() => setShowSubscriptionModal(false)}
                  className="w-full py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function ActivityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#d91b5c]" size={36} />
      </div>
    }>
      <ActivityPageContent />
    </Suspense>
  );
}
