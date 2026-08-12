"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
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
    { id: 'gallery-requests-accepted', label: 'Accepted', icon: CheckCircle2 },
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

  const queryCat = (searchParams.get('cat') as MainCategory) || 'interests';
  const queryTab = searchParams.get('tab') || 'requests';

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
      const counts = res.data.counts || res.data.Counts || {};

      if (append) {
        setProfiles((prev) => [...prev, ...list]);
      } else {
        setProfiles(list);
      }

      if (counts && Object.keys(counts).length > 0) {
        setTabCounts(counts);
      }

      setHasMore(list.length >= 12);
    } else {
      toast.error(res.message || "Failed to load activity profiles.");
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
    router.replace(`/dashboard/activity?cat=${cat}&tab=${firstSubTab}`);
  };

  const handleSubTabChange = (subTabId: string) => {
    setActiveSubTab(subTabId);
    router.replace(`/dashboard/activity?cat=${activeCat}&tab=${subTabId}`);
  };

  const handleLoadMore = () => {
    if (!hasMore || fetchingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadActivityData(activeSubTab, nextPage, true);
  };

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
    sessionStorage.setItem("viewing_profile_target", JSON.stringify({ userId }));
    if (token) {
      handleInteractionApiCall(userId, 'VISIT', 'PENDING', token).catch(() => {});
    }
    router.push('/dashboard/profile');
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-28 pt-4 selection:bg-[#870c3f] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        
        {/* HEADER BAR */}
        <div className="bg-white rounded-3xl p-5 border-2 border-rose-100 shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button 
              type="button"
              onClick={() => router.push('/dashboard')} 
              className="p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-[#870c3f] border-2 border-rose-200 transition-all cursor-pointer shadow-xs"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-serif font-extrabold uppercase text-slate-900 tracking-tight">
                Activity Center
              </h1>
              <p className="text-xs font-semibold text-slate-500">
                Track all your proposals, visits, photo requests, and views
              </p>
            </div>
          </div>
        </div>

        {/* 🌟 LEVEL 1: MAIN CATEGORY TABS (App Native Pill Style) */}
        <div className="bg-white/90 backdrop-blur-xl border-2 border-rose-100 rounded-3xl p-2.5 shadow-xl shadow-rose-950/5">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {mainCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCat === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCatChange(cat.id)}
                  className={`px-5 py-3 rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all duration-300 flex-shrink-0 cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white font-black shadow-lg shadow-rose-900/25 scale-[1.03] border border-rose-300/30' 
                      : 'bg-rose-50/60 hover:bg-rose-100/80 text-slate-700 font-extrabold border border-rose-200/60'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-amber-300 fill-amber-300' : 'text-[#870c3f]'} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 🌟 LEVEL 2: SECONDARY NESTED SUB-TABS (Renders below selected category) */}
        {currentSubTabs.length > 1 && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-50/80 border-2 border-rose-200/80 rounded-2xl p-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar max-w-xl mx-auto"
          >
            {currentSubTabs.map((sub) => {
              const SubIcon = sub.icon;
              const isSubActive = activeSubTab === sub.id;
              const cnt = sub.countKey ? tabCounts[sub.countKey] || 0 : 0;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleSubTabChange(sub.id)}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 font-black transition-all cursor-pointer whitespace-nowrap ${
                    isSubActive 
                      ? 'bg-white text-[#870c3f] shadow-md border border-rose-200 scale-[1.02]' 
                      : 'text-slate-600 hover:text-[#870c3f]'
                  }`}
                >
                  <SubIcon size={14} className={isSubActive ? 'text-[#870c3f]' : 'text-slate-400'} />
                  <span>{sub.label}</span>
                  {cnt > 0 && (
                    <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-[#870c3f] text-white">
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}

        {/* PROFILES GRID */}
        {loading ? (
          <div className="min-h-[420px] flex flex-col items-center justify-center text-[#870c3f]">
            <Loader2 size={48} className="animate-spin mb-3 text-[#870c3f]" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Fetching Activity Profiles...</span>
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-rose-100 shadow-xl max-w-md mx-auto space-y-4">
            <div className="w-18 h-18 rounded-full bg-rose-50 border-2 border-rose-200 text-[#870c3f] flex items-center justify-center mx-auto shadow-xs">
              <Sparkles size={36} className="text-amber-500" />
            </div>
            <h3 className="text-lg font-serif font-extrabold text-slate-900 uppercase">No Activity Recorded</h3>
            <p className="text-slate-500 text-xs font-semibold max-w-xs mx-auto leading-relaxed">
              There are currently no profiles under this activity category. Switch categories to view other records.
            </p>
            <button 
              type="button"
              onClick={() => handleCatChange('interests')} 
              className="px-7 py-3 rounded-full bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-rose-900/20 border border-rose-300/30"
            >
              View Interests
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        {!loading && hasMore && (
          <div className="text-center pt-6">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={fetchingMore}
              className="px-9 py-3.5 rounded-full bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 text-white border border-rose-300/30 font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-900/20 active:scale-95 transition-all flex items-center gap-2.5 mx-auto cursor-pointer"
            >
              {fetchingMore ? <Loader2 size={18} className="animate-spin text-amber-300" /> : <RefreshCw size={18} className="text-amber-300" />}
              <span>Load More Profiles</span>
            </button>
          </div>
        )}

      </div>

      {/* 👑 VIP PREMIUM SUBSCRIPTION MODAL */}
      <AnimatePresence>
        {showSubscriptionModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-white rounded-3xl max-w-sm w-full p-7 text-center shadow-2xl border-2 border-rose-100 text-slate-800 space-y-5"
            >
              <div className="w-16 h-16 bg-rose-50 text-amber-500 rounded-full flex items-center justify-center mx-auto border-2 border-rose-200 shadow-xs">
                <Crown size={32} />
              </div>
              <div>
                <h3 className="text-lg font-serif font-extrabold uppercase text-slate-900">Upgrade to Premium</h3>
                <p className="text-slate-500 text-xs font-semibold mt-1 leading-relaxed">
                  Direct messaging & instant chat are exclusive features for Premium members.
                </p>
              </div>
              <div className="flex flex-col gap-2.5 pt-1">
                <button 
                  type="button"
                  onClick={() => router.push('/dashboard/membership')} 
                  className="w-full bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-900/20 cursor-pointer border border-rose-300/30"
                >
                  View Membership Plans
                </button>
                <button 
                  type="button"
                  onClick={() => setShowSubscriptionModal(false)} 
                  className="w-full bg-slate-100 text-slate-600 hover:bg-slate-200 py-3 rounded-2xl font-bold text-xs uppercase cursor-pointer"
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-[#870c3f] font-black text-xs uppercase tracking-widest">
        Loading Activity...
      </div>
    }>
      <ActivityPageContent />
    </Suspense>
  );
}
