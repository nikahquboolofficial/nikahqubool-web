"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Sparkles, Heart, Crown, Send, Inbox, Eye, ArrowLeft, Lock, 
  Users, CheckCircle2, ChevronRight, X, Check, Star, MessageCircle,
  Building2, MapPin, Loader2, ShieldCheck, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { fetchDashboardApi, handleInteractionApiCall } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';
import { getClientSubscriptionStatus } from '@/lib/subscriptionUtils';
import { getOptimizedImageUrl, DEFAULT_FEMALE_AVATAR } from '@/lib/imageUtils';
import SubscriptionModal from '@/components/dashboard/SubscriptionModal';

type MainTab = 'all' | 'interests' | 'visitors' | 'contacts' | 'gallery';

interface SubTabItem {
  id: string;
  label: string;
}

const SUBTABS_CONFIG: Record<MainTab, SubTabItem[]> = {
  all: [],
  interests: [
    { id: 'requests', label: 'Received' },
    { id: 'interests-sent', label: 'Sent' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'declined', label: 'Restricted' },
  ],
  visitors: [
    { id: 'visitors', label: 'Visited Me' },
    { id: 'profiles-viewed', label: 'I Visited' },
  ],
  contacts: [
    { id: 'contact-views-received', label: 'Viewed Mine' },
    { id: 'contact-views', label: 'I Viewed' },
  ],
  gallery: [
    { id: 'gallery-requests-received', label: 'Received' },
    { id: 'gallery-requests', label: 'Sent' },
    { id: 'gallery-requests-accepted', label: 'Accepted' },
  ],
};

// Global In-Memory Tab Cache for instant 0ms switching
const activityTabCache: Record<string, { profiles: any[]; timestamp: number }> = {};

function formatRelativeTime(dateInput: any): string {
  if (!dateInput) return "Recently";
  const now = new Date();
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "Recently";

  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 2) return "Just now";
  if (diffMin < 60) return `${diffMin} mins ago`;
  if (diffHours < 24) return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function ActivityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab State
  const initialMainTab: MainTab = (searchParams.get('cat') as MainTab) || 'all';
  const initialSubTab = searchParams.get('tab') || (SUBTABS_CONFIG[initialMainTab]?.[0]?.id || 'all');

  const [activeMainTab, setActiveMainTab] = useState<MainTab>(initialMainTab);
  const [activeSubTab, setActiveSubTab] = useState<string>(initialSubTab);

  // Tab button refs for smooth auto-scrolling
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const subTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const mainBtn = tabRefs.current[activeMainTab];
    if (mainBtn) {
      mainBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeMainTab]);

  useEffect(() => {
    const subBtn = subTabRefs.current[activeSubTab];
    if (subBtn) {
      subBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeSubTab]);

  // Profiles State
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // VIP Subscription Modal
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Track in-flight action state per user
  const [actionInProgress, setActionInProgress] = useState<Record<number, boolean>>({});

  const getToken = useCallback(() => getAuthToken(), []);
  const activeSubTabRef = useRef(activeSubTab);
  useEffect(() => {
    activeSubTabRef.current = activeSubTab;
  }, [activeSubTab]);

  // Sync with URL params
  useEffect(() => {
    const cat = searchParams.get('cat') as MainTab;
    const tab = searchParams.get('tab');
    if (cat && SUBTABS_CONFIG[cat]) {
      setActiveMainTab(cat);
      if (tab) {
        setActiveSubTab(tab);
      } else if (SUBTABS_CONFIG[cat].length > 0) {
        setActiveSubTab(SUBTABS_CONFIG[cat][0].id);
      }
    }
  }, [searchParams]);

  // Load Activity Data
  const loadData = useCallback(async (tabName: string, pageNum: number, append: boolean = false) => {
    const token = getToken();
    if (!token) return;

    if (pageNum === 1) {
      if (activityTabCache[tabName]?.profiles?.length > 0) {
        setProfiles(activityTabCache[tabName].profiles);
        setLoading(false);
      } else {
        setProfiles([]);
        setLoading(true);
      }
    } else {
      setFetchingMore(true);
    }

    try {
      const res = await fetchDashboardApi(tabName, pageNum, token);

      // Race condition check
      if (activeSubTabRef.current !== tabName) return;

      if (res && res.success && res.data) {
        const rawList = Array.isArray(res.data) 
          ? res.data 
          : (res.data?.profiles || res.data?.Profiles || (Array.isArray(res.data?.data) ? res.data.data : []));

        if (append) {
          setProfiles(prev => [...prev, ...rawList]);
        } else {
          setProfiles(rawList);
          activityTabCache[tabName] = {
            profiles: rawList,
            timestamp: Date.now()
          };
        }

        setHasMore(rawList.length >= 10);
      }
    } catch (err) {
      console.error("Error loading activity:", err);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  }, [getToken]);

  // Trigger load when tab changes
  useEffect(() => {
    setPage(1);
    loadData(activeSubTab, 1, false);
  }, [activeSubTab, loadData]);

  // Handle Main Tab Switch
  const handleMainTabChange = (mainTab: MainTab) => {
    setActiveMainTab(mainTab);
    const subTabs = SUBTABS_CONFIG[mainTab];
    const defaultSub = subTabs.length > 0 ? subTabs[0].id : mainTab;
    setActiveSubTab(defaultSub);
    router.replace(`/dashboard/activity?cat=${mainTab}&tab=${defaultSub}`);
  };

  // Handle Sub-Tab Switch
  const handleSubTabChange = (subTabId: string) => {
    setActiveSubTab(subTabId);
    router.replace(`/dashboard/activity?cat=${activeMainTab}&tab=${subTabId}`);
  };

  // Handle Interactions (Accept, Decline, Shortlist, Chat)
  const handleInteraction = async (receiverId: number, type: 'INTEREST' | 'PHOTO_REQUEST' | 'SHORTLIST', status: 'ACCEPTED' | 'DECLINED' | 'PENDING') => {
    const token = getToken();
    if (!token) return;

    setActionInProgress(prev => ({ ...prev, [receiverId]: true }));
    try {
      const res = await handleInteractionApiCall(receiverId, type, status, token);
      if (res && res.success) {
        if (status === 'ACCEPTED') {
          toast.success("Request accepted successfully!");
          setProfiles(prev => prev.map(p => {
            if (Number(p.userId || p.UserId) === receiverId) {
              return { ...p, interestStatus: 'Accepted' };
            }
            return p;
          }));
        } else if (status === 'DECLINED') {
          toast.info("Request declined.");
          setProfiles(prev => prev.filter(p => Number(p.userId || p.UserId) !== receiverId));
        } else if (type === 'SHORTLIST') {
          toast.success("Profile shortlisted!");
          setProfiles(prev => prev.map(p => {
            if (Number(p.userId || p.UserId) === receiverId) {
              return { ...p, isShortlisted: !p.isShortlisted };
            }
            return p;
          }));
        }
      } else {
        toast.error(res?.message || "Failed to complete action.");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setActionInProgress(prev => ({ ...prev, [receiverId]: false }));
    }
  };

  const openProfileView = (user: any) => {
    const uId = user.userId || user.UserId;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("last_browse_page", `/dashboard/activity?cat=${activeMainTab}&tab=${activeSubTab}`);
      sessionStorage.setItem("viewing_profile_target", JSON.stringify(user));
      localStorage.setItem("viewing_profile_target", JSON.stringify(user));
    }
    router.push(`/dashboard/profile?userId=${uId}`);
  };

  const startChat = (user: any) => {
    const status = getClientSubscriptionStatus();
    if (!status.isPaid || !status.canChat) {
      setShowSubscriptionModal(true);
      return;
    }
    const uId = user.userId || user.UserId;
    const name = user.fullName || user.FullName || 'Member';
    const photo = user.photoUrl || user.PhotoUrl || '';
    router.push(`/dashboard/messages?targetUserId=${uId}&targetName=${encodeURIComponent(name)}&targetPhoto=${encodeURIComponent(photo)}`);
  };

  // Helper text per tab
  const getActivityHeadline = (user: any, name: string) => {
    if (activeMainTab === 'interests') {
      if (activeSubTab === 'requests') return `${name} has sent you an interest request`;
      if (activeSubTab === 'interests-sent') return `You sent ${name} an interest request`;
      if (activeSubTab === 'accepted') return `You and ${name} are connected`;
      if (activeSubTab === 'declined') return `Declined interest with ${name}`;
    }
    if (activeMainTab === 'visitors') {
      if (activeSubTab === 'visitors') return `${name} visited your profile`;
      if (activeSubTab === 'profiles-viewed') return `You visited ${name}'s profile`;
    }
    if (activeMainTab === 'contacts') {
      if (activeSubTab === 'contact-views-received') return `${name} viewed your contact details`;
      if (activeSubTab === 'contact-views') return `You viewed ${name}'s contact details`;
    }
    if (activeMainTab === 'gallery') {
      if (activeSubTab === 'gallery-requests-received') return `${name} requested photo access`;
      if (activeSubTab === 'gallery-requests') return `You requested photo access from ${name}`;
      if (activeSubTab === 'gallery-requests-accepted') return `Photo access unlocked with ${name}`;
    }
    return `${name} interacted with your profile`;
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-slate-900 pb-24 selection:bg-[#E21E5B] selection:text-white">
      <Toaster position="top-center" richColors />

      <div className="max-w-md mx-auto px-4 pt-1 pb-4 space-y-3">
        {/* 🌟 1. MAIN TAB BAR (HORIZONTALLY SCROLLABLE, ZERO-SCROLLBAR, AUTO-SCROLL TO ACTIVE) */}
        <div className="flex items-center gap-6 overflow-x-auto border-b border-slate-200/80 pb-1 pt-0.5 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: 'all' as MainTab, label: 'All' },
            { id: 'interests' as MainTab, label: 'Interests' },
            { id: 'visitors' as MainTab, label: 'Profile Visits' },
            { id: 'contacts' as MainTab, label: 'Contact Views' },
            { id: 'gallery' as MainTab, label: 'Gallery Requests' },
          ].map((tab) => {
            const isActive = activeMainTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[tab.id] = el; }}
                onClick={(e) => {
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                  handleMainTabChange(tab.id);
                }}
                className={`shrink-0 pb-2 text-sm transition-all relative font-bold cursor-pointer select-none ${
                  isActive ? 'text-slate-950 font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="mainTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-950 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* 🌟 2. SUB-TAB PILLS BAR (HORIZONTALLY SCROLLABLE, ZERO-SCROLLBAR) */}
        {SUBTABS_CONFIG[activeMainTab].length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto py-0.5 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {SUBTABS_CONFIG[activeMainTab].map((subTab) => {
              const isSelected = activeSubTab === subTab.id;
              return (
                <button
                  key={subTab.id}
                  ref={(el) => { subTabRefs.current[subTab.id] = el; }}
                  onClick={(e) => {
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                    handleSubTabChange(subTab.id);
                  }}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs transition-all shadow-xs font-bold cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[#1e293b] text-white border border-[#1e293b]'
                      : 'bg-white text-slate-700 border border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  {subTab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* 🌟 3. TOP INTERESTS MINI-CAROUSEL (SCREENSHOT 2) */}
        {activeMainTab === 'interests' && activeSubTab === 'requests' && profiles.length > 0 && (
          <div className="bg-gradient-to-b from-rose-50/50 to-transparent p-4 rounded-3xl border border-rose-100/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Top Interests</h3>
                <p className="text-[11px] font-medium text-slate-500">
                  We&apos;ve picked the best profiles interested in you.
                </p>
              </div>
              <button 
                onClick={() => handleSubTabChange('requests')} 
                className="w-7 h-7 rounded-full bg-white border border-rose-200 flex items-center justify-center text-slate-700 shadow-xs hover:bg-rose-50"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pt-1">
              {profiles.slice(0, 4).map((topUser, idx) => {
                const uId = topUser.userId || topUser.UserId;
                const name = topUser.fullName || topUser.FullName || 'Member';
                const age = topUser.age || topUser.Age || 24;
                const city = topUser.cityName || topUser.CityName || 'India';
                const photo = getOptimizedImageUrl(topUser.photoUrl || topUser.PhotoUrl);

                return (
                  <div
                    key={uId || idx}
                    onClick={() => openProfileView(topUser)}
                    className="relative shrink-0 w-28 aspect-[3/4] rounded-2xl overflow-hidden shadow-xs border border-rose-200/80 cursor-pointer group"
                  >
                    <img 
                      src={photo}
                      alt={name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
                      onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_FEMALE_AVATAR; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                    <div className="absolute bottom-2 left-2 right-2 text-white text-left pointer-events-none">
                      <div className="text-[11px] font-extrabold truncate">{name}, {age}</div>
                      <div className="text-[9px] text-white/80 truncate">{city}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 🌟 4. ACTIVITY PROFILES CARD FEED (SCREENSHOTS 1, 2, 3) */}
        {loading ? (
          <div className="space-y-6 pt-1">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
                  <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
                </div>
                <div className="aspect-[4/5] rounded-3xl shimmer-luxury shadow-xs border border-slate-100" />
              </div>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-3 mt-4 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-[#E21E5B] flex items-center justify-center mx-auto">
              <Sparkles size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Activity Yet</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              There is currently no activity in this section. Explore new profiles and connect with matches!
            </p>
            <button
              onClick={() => router.push('/dashboard/find-match')}
              className="mt-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#E21E5B] to-[#C2185B] text-white text-xs font-bold shadow-md hover:shadow-lg active:scale-95 transition-all"
            >
              Discover Matches
            </button>
          </div>
        ) : (
          <div className="space-y-6 pt-1">
            {profiles.map((user, idx) => {
              const uId = Number(user.userId || user.UserId);
              const name = user.fullName || user.FullName || 'Member';
              const age = user.age || user.Age || 24;
              const isPremium = Boolean(user.isPremium || user.IsPremium);
              const isOnline = Boolean(user.isOnline || user.IsOnline);
              const location = `${user.cityName || user.CityName || 'India'}${user.stateName || user.StateName ? `, ${user.stateName || user.StateName}` : ''}`;
              const community = `${user.sect || user.Sect || 'Muslim'}${user.caste || user.Caste ? ` / ${user.caste || user.Caste}` : ''}`;
              const profession = user.profession || user.Profession || user.education || user.Education || 'Professional';
              const photoUrl = getOptimizedImageUrl(user.photoUrl || user.PhotoUrl);
              const isShortlisted = Boolean(user.isShortlisted);
              const isPendingReceived = (activeMainTab === 'interests' && activeSubTab === 'requests') || 
                                        user.interestStatus === 'ReceivedPending' || 
                                        (activeMainTab === 'all' && user.interestStatus === 'ReceivedPending');

              const relativeTime = formatRelativeTime(user.interactionDate || user.createdAt || user.CreatedAt);
              const headlineText = getActivityHeadline(user, name);

              return (
                <div key={uId || idx} className="space-y-2">
                  {/* Top Activity Headline Header (Screenshots 1, 2, 3) */}
                  <div className="flex items-center gap-2.5 px-1">
                    <img
                      src={photoUrl}
                      alt={name}
                      onClick={() => openProfileView(user)}
                      className="w-8 h-8 rounded-full object-cover object-top border border-slate-200 cursor-pointer"
                      onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_FEMALE_AVATAR; }}
                    />
                    <div className="leading-tight">
                      <div className="text-xs font-extrabold text-slate-900">
                        {headlineText}
                      </div>
                      <div className="text-[10px] font-medium text-slate-400">
                        {relativeTime}
                      </div>
                    </div>
                  </div>

                  {/* Large Profile Card (Screenshots 1, 2, 3) */}
                  <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-md bg-slate-900 border border-slate-200/60 group">
                    <img 
                      src={photoUrl}
                      alt={name}
                      onClick={() => openProfileView(user)}
                      className="w-full h-full object-cover object-top cursor-pointer group-hover:scale-102 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_FEMALE_AVATAR; }}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
                      {isPremium ? (
                        <div className="w-8 h-8 rounded-full bg-amber-400/90 text-slate-950 flex items-center justify-center shadow-md">
                          <Crown size={16} className="fill-slate-950" />
                        </div>
                      ) : <span />}

                      {isOnline && (
                        <span className="px-2.5 py-0.5 rounded-full bg-black/40 text-emerald-400 text-[10px] font-bold flex items-center gap-1.5 shadow-sm backdrop-blur-xs border border-white/10">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Online
                        </span>
                      )}
                    </div>

                    {/* Profile Details Overlay at Bottom */}
                    <div className="absolute bottom-0 inset-x-0 p-4 space-y-3 z-10">
                      <div 
                        onClick={() => openProfileView(user)}
                        className="text-white text-center cursor-pointer space-y-0.5"
                      >
                        <div className="flex items-center justify-center gap-1.5 text-base sm:text-lg font-black tracking-tight drop-shadow-xs">
                          <span>{name}, {age}</span>
                          {isPremium && <Crown size={15} className="fill-amber-400 text-amber-400" />}
                        </div>
                        <div className="text-xs text-white/90 font-medium drop-shadow-xs">
                          {location} &bull; {community}
                        </div>
                        <div className="text-[11px] text-white/80 font-medium drop-shadow-xs">
                          {profession}
                        </div>
                      </div>

                      {/* 🌟 ACTION BUTTONS (EXACT SCREENSHOT BUTTONS) */}
                      <div className="flex items-center justify-center gap-6 pt-1">
                        {isPendingReceived ? (
                          <>
                            {/* Decline Button (Grey Circle with '✕') */}
                            <div className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                disabled={actionInProgress[uId]}
                                onClick={() => handleInteraction(uId, 'INTEREST', 'DECLINED')}
                                className="w-12 h-12 rounded-full bg-slate-700/80 text-white flex items-center justify-center shadow-lg active:scale-90 hover:bg-slate-800 transition-all cursor-pointer backdrop-blur-xs border border-white/20"
                              >
                                {actionInProgress[uId] ? (
                                  <Loader2 size={18} className="animate-spin text-white" />
                                ) : (
                                  <X size={20} className="stroke-[2.5]" />
                                )}
                              </button>
                              <span className="text-[10px] font-semibold text-white/90">Decline</span>
                            </div>

                            {/* Accept Button (Green Circle with '✓') */}
                            <div className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                disabled={actionInProgress[uId]}
                                onClick={() => handleInteraction(uId, 'INTEREST', 'ACCEPTED')}
                                className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg active:scale-90 hover:bg-emerald-700 transition-all cursor-pointer border border-white/20"
                              >
                                {actionInProgress[uId] ? (
                                  <Loader2 size={18} className="animate-spin text-white" />
                                ) : (
                                  <Check size={22} className="stroke-[3]" />
                                )}
                              </button>
                              <span className="text-[10px] font-semibold text-white/90">Accept</span>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Shortlist Button (Star in Circle) */}
                            <div className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleInteraction(uId, 'SHORTLIST', 'PENDING')}
                                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer backdrop-blur-xs ${
                                  isShortlisted 
                                    ? 'bg-amber-400 text-slate-900' 
                                    : 'bg-black/40 text-white border border-white/30 hover:bg-black/60'
                                }`}
                              >
                                <Star size={18} className={isShortlisted ? 'fill-slate-900' : ''} />
                              </button>
                              <span className="text-[10px] font-semibold text-white/90">Shortlist</span>
                            </div>

                            {/* Chat Button (Yellow Message Bubble in Circle) */}
                            <div className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                onClick={() => startChat(user)}
                                className="w-12 h-12 rounded-full bg-[#E5B54F] text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
                              >
                                <MessageCircle size={20} className="fill-white stroke-none" />
                              </button>
                              <span className="text-[10px] font-semibold text-white/90">Chat</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          title="VIP Subscription Required"
          subtitle="Direct chat & contact viewing are exclusive to VIP members."
        />
      )}
    </div>
  );
}

export default function ActivityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <Loader2 size={28} className="animate-spin text-[#E21E5B]" />
      </div>
    }>
      <ActivityContent />
    </Suspense>
  );
}
