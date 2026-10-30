"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, SlidersHorizontal, X, ChevronRight,
  MapPin, Briefcase, GraduationCap, Users2, Star, Check, Heart, Loader2,
  Crown, Lock, RotateCcw, CheckCircle2, Eye, Sparkles, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import { searchMatchesApi, handleInteractionApiCall, fetchMasterDataApi } from '@/lib/api';
import { checkDailyViewLimit, formatTimeRemaining } from '@/lib/limitUtils';
import ProfileCard from '@/components/dashboard/ProfileCard';
import ProfileCardSkeleton from '@/components/dashboard/ProfileCardSkeleton';
import SubscriptionModal from '@/components/dashboard/SubscriptionModal';
import { getAuthToken } from '@/lib/auth';

// COMPREHENSIVE MASTER FALLBACK DATA
const MASTER_FALLBACKS: Record<string, string[]> = {
  MARITAL_STATUS: ["Never Married", "Divorced", "Widowed", "Awaiting Divorce", "Annulled"],
  SECT: ["Sunni", "Shia", "Deobandi", "Barelvi", "Ahle Hadith", "Salafi", "Jamaat-e-Islami", "Other"],
  CASTE: [
    "Shaikh / Sheikh", "Syed", "Pathan / Khan", "Ansari / Momin", "Qureshi / Baig", "Siddiqui", 
    "Farooqui", "Usmani", "Alvi", "Abbasi", "Hashmi", "Mirza", "Mughal", "Malik", 
    "Choudhary / Jat Muslim", "Mansoori / Dhunia", "Rayeen / Kunjra", "Idrisi / Darzi", 
    "Saifi / Lohar / Najjari", "Rangrez", "Ghosi", "Meo / Mewati", "Other"
  ],
  STATE: [
    "Uttar Pradesh", "Delhi", "Maharashtra", "Bihar", "Karnataka", "Telangana", 
    "West Bengal", "Madhya Pradesh", "Rajasthan", "Gujarat", "Punjab", "Haryana", 
    "Jharkhand", "Uttarakhand", "Jammu and Kashmir", "Andhra Pradesh", "Tamil Nadu", "Kerala"
  ],
  CITY: [
    "Bareilly", "Lucknow", "Delhi", "Mumbai", "Kanpur", "Agra", "Varanasi", 
    "Meerut", "Aligarh", "Moradabad", "Rampur", "Saharanpur", "Gorakhpur", 
    "Hyderabad", "Bengaluru", "Patna", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Bhopal", "Indore"
  ],
  EDUCATION: [
    "B.Tech / B.E.", "B.Sc", "B.Com", "B.A.", "B.CA", "M.Tech / M.E.", "M.Sc", 
    "M.Com", "M.A.", "MCA", "MBA", "MBBS / MD", "BDS", "LL.B / LL.M", "High School / Diploma", "Ph.D / Doctorate"
  ],
  PROFESSION: [
    "Software Engineer / IT Professional", "Doctor / Healthcare", "Teacher / Professor", 
    "Chartered Accountant / Finance", "Businessperson / Entrepreneur", "Government / Public Sector", 
    "Private Sector", "Civil Engineer", "Defense / Civil Services", "Banking Professional", "Homemaker", "Other"
  ]
};

const DEFAULT_FILTERS = {
  ageMin: 18, ageMax: 50,
  heightMin: 4.5, heightMax: 6.8,
  maritalStatus: [] as string[],
  sect: [] as string[],
  caste: [] as string[],
  states: [] as string[],
  cities: [] as string[], // 🔒 Paid
  education: [] as string[], // 🔒 Paid
  employedIn: [] as string[], // 🔒 Paid
};

const STORAGE_KEY = "nikah_find_match_saved_filters";

export default function FindMatchesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [isUserPaid, setIsUserPaid] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const [activeBottomSheet, setActiveBottomSheet] = useState<string | null>(null);
  const [sheetSearch, setSheetSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // DYNAMIC MASTER OPTIONS STATE
  const [masterOptions, setMasterOptions] = useState<Record<string, string[]>>(MASTER_FALLBACKS);

  // FILTERS STATE
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const getToken = useCallback(() => getAuthToken(), []);

  // 1. Load saved filters from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            setFilters(prev => ({ ...prev, ...parsed }));
          }
        } catch (e) {}
      }
    }
  }, []);

  // 2. Load dynamic master options from API on mount
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [marital, sects, castes, states, educations, occupations] = await Promise.all([
          fetchMasterDataApi('MARITAL_STATUS').catch(() => []),
          fetchMasterDataApi('SECTS').catch(() => []),
          fetchMasterDataApi('CASTES').catch(() => []),
          fetchMasterDataApi('STATES').catch(() => []),
          fetchMasterDataApi('EDUCATIONS').catch(() => []),
          fetchMasterDataApi('OCCUPATIONS').catch(() => [])
        ]);

        const extractValues = (list: any[], fallback: string[]) => {
          if (Array.isArray(list) && list.length > 0) {
            const vals = list.map((item: any) => String(item.value || item.Value || item.name || item.Name || '').trim()).filter(Boolean);
            if (vals.length > 0) return Array.from(new Set([...vals, ...fallback]));
          }
          return fallback;
        };

        setMasterOptions({
          MARITAL_STATUS: extractValues(marital, MASTER_FALLBACKS.MARITAL_STATUS),
          SECT: extractValues(sects, MASTER_FALLBACKS.SECT),
          CASTE: extractValues(castes, MASTER_FALLBACKS.CASTE),
          STATE: extractValues(states, MASTER_FALLBACKS.STATE),
          CITY: MASTER_FALLBACKS.CITY,
          EDUCATION: extractValues(educations, MASTER_FALLBACKS.EDUCATION),
          PROFESSION: extractValues(occupations, MASTER_FALLBACKS.PROFESSION)
        });
      } catch (e) {}
    };
    loadMasters();
  }, []);

  const loadMatches = useCallback(async (pageNum: number = 1, append: boolean = false, overrideFilters?: typeof filters) => {
    const token = getToken();
    if (!token) {
      router.push('/');
      return;
    }

    if (pageNum === 1) setLoading(true);
    else setFetchingMore(true);

    const activeFilters = overrideFilters || filters;

    const payload = {
      searchText: "",
      ageMin: activeFilters.ageMin,
      ageMax: activeFilters.ageMax,
      heightMin: activeFilters.heightMin,
      heightMax: activeFilters.heightMax,
      maritalStatus: activeFilters.maritalStatus,
      sect: activeFilters.sect,
      caste: activeFilters.caste,
      states: activeFilters.states,
      cities: isUserPaid ? activeFilters.cities : [],
      education: isUserPaid ? activeFilters.education : [],
      employedIn: isUserPaid ? activeFilters.employedIn : [],
      pageNumber: pageNum,
      pageSize: 12
    };

    const res = await searchMatchesApi(payload, token);
    setLoading(false);
    setFetchingMore(false);

    if (res && res.success && res.data) {
      const list = res.data || [];
      const userPaid = Boolean(res.isUserPaid ?? isUserPaid);
      setIsUserPaid(userPaid);

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
      if (!append) setProfiles([]);
    }
  }, [getToken, filters, isUserPaid, router]);

  useEffect(() => {
    setPage(1);
    loadMatches(1, false);
  }, [filters]);

  // 🚀 AUTOMATIC INFINITE SCROLL PAGING
  useEffect(() => {
    const handleScroll = () => {
      if (loading || fetchingMore || !hasMore) return;
      if (dailyLimitReached && !isUserPaid) return;

      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 400) {
        setPage((prevPage) => {
          const nextPage = prevPage + 1;
          loadMatches(nextPage, true);
          return nextPage;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, fetchingMore, hasMore, dailyLimitReached, isUserPaid, loadMatches]);

  const handleApplyFilters = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    }
    setShowFilters(false);
    toast.success("Filters applied and saved!");
    loadMatches(1, false);
  };

  const handleReset = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    setFilters(DEFAULT_FILTERS);
    loadMatches(1, false, DEFAULT_FILTERS);
    setShowFilters(false);
    toast.info("Filters cleared.");
  };

  const openCategorySheet = (categoryKey: string, isLocked: boolean = false) => {
    if (isLocked && !isUserPaid) {
      setShowUpgradeModal(true);
      return;
    }
    setSheetSearch("");
    setActiveBottomSheet(categoryKey);
  };

  const toggleOption = (listKey: keyof typeof filters, val: string) => {
    setFilters(prev => {
      const list = prev[listKey] as string[];
      const exists = list.includes(val);
      return { ...prev, [listKey]: exists ? list.filter(i => i !== val) : [...list, val] };
    });
  };

  const handleInteraction = async (receiverId: number, type: string, status: string = 'PENDING') => {
    const token = getToken();
    if (!token) return;

    setActionLoading(true);
    const res = await handleInteractionApiCall(receiverId, type, status, token);
    setActionLoading(false);

    if (res && (res.success)) {
      setProfiles(prev => prev.filter(p => (p.userId || p.UserId) !== receiverId));
    } else {
      toast.error("Unable to update action. Please try again.");
    }
  };

  const openProfileView = (user: any) => {
    const uId = user.userId || user.UserId;
    sessionStorage.setItem('viewing_profile_target', JSON.stringify({
      userId: uId,
      targetUserId: uId
    }));
    router.push('/dashboard/profile?userId=' + uId);
  };

  const handleInitiateChat = (user: any) => {
    const isPaid = Boolean(
      user.isCanChat ?? user.IsCanChat ?? 
      user.isCurrentUserPaid ?? user.IsCurrentUserPaid ?? 
      isUserPaid
    );

    if (isPaid) {
      sessionStorage.setItem('active_chat_target', JSON.stringify({
        userId: user.userId || user.UserId,
        fullName: user.fullName || user.FullName,
        photoUrl: user.photoUrl || user.mainPhotoUrl || user.PhotoUrl || ''
      }));
      router.push('/dashboard/messages');
    } else {
      setShowUpgradeModal(true);
    }
  };

  function getOptionsForSheet(sheetKey: string) {
    const list = masterOptions[sheetKey] || MASTER_FALLBACKS[sheetKey] || [];
    if (!sheetSearch.trim()) return list;
    return list.filter(item => item.toLowerCase().includes(sheetSearch.toLowerCase().trim()));
  }

  function getIsSelected(sheetKey: string, opt: string) {
    switch (sheetKey) {
      case 'MARITAL_STATUS': return filters.maritalStatus.includes(opt);
      case 'SECT': return filters.sect.includes(opt);
      case 'CASTE': return filters.caste.includes(opt);
      case 'STATE': return filters.states.includes(opt);
      case 'CITY': return filters.cities.includes(opt);
      case 'EDUCATION': return filters.education.includes(opt);
      case 'PROFESSION': return filters.employedIn.includes(opt);
      default: return false;
    }
  }

  function handleToggleOption(sheetKey: string, opt: string) {
    switch (sheetKey) {
      case 'MARITAL_STATUS': toggleOption('maritalStatus', opt); break;
      case 'SECT': toggleOption('sect', opt); break;
      case 'CASTE': toggleOption('caste', opt); break;
      case 'STATE': toggleOption('states', opt); break;
      case 'CITY': toggleOption('cities', opt); break;
      case 'EDUCATION': toggleOption('education', opt); break;
      case 'PROFESSION': toggleOption('employedIn', opt); break;
    }
  }

  function getSelectedCount(sheetKey: string) {
    switch (sheetKey) {
      case 'MARITAL_STATUS': return filters.maritalStatus.length;
      case 'SECT': return filters.sect.length;
      case 'CASTE': return filters.caste.length;
      case 'STATE': return filters.states.length;
      case 'CITY': return filters.cities.length;
      case 'EDUCATION': return filters.education.length;
      case 'PROFESSION': return filters.employedIn.length;
      default: return 0;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F5] via-white to-[#FAF8F5] text-slate-900 font-sans pb-32 selection:bg-[#d91b5c] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        input[type='range'] { pointer-events: none; position: absolute; width: 100%; appearance: none; background: none; z-index: 10; }
        input[type='range']::-webkit-slider-thumb { pointer-events: auto; width: 20px; height: 20px; border-radius: 50%; background: #d91b5c; appearance: none; border: 3px solid white; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); cursor: pointer; }
      `}</style>

      {/* --- STICKY TOP HEADER --- */}
      <div className="sticky top-16 md:top-20 z-40 bg-white/90 backdrop-blur-xl border-b border-rose-100/80 px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif font-black text-base sm:text-lg text-slate-900 uppercase tracking-tight truncate">
              Find Matches
            </h1>
            <span className="text-[11px] font-black bg-rose-50 text-[#d91b5c] px-2.5 py-0.5 rounded-full border border-rose-200/60">
              {profiles.length} Profiles
            </span>
          </div>

          <button 
            type="button"
            onClick={() => setShowFilters(true)} 
            className="flex items-center gap-1.5 px-4.5 py-2 bg-gradient-to-r from-[#d91b5c] to-rose-600 hover:brightness-110 text-white rounded-full font-black uppercase text-[11px] tracking-wider active:scale-95 transition-all cursor-pointer shrink-0 shadow-[0_4px_12px_rgba(217,27,92,0.25)] border border-rose-300/30"
          >
            <SlidersHorizontal size={14} className="text-amber-300" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* --- PROFILES GRID --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="py-4">
            <ProfileCardSkeleton count={4} />
          </div>
        ) : profiles.length === 0 ? (
          <div className="py-16 px-4 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-[#d91b5c] mx-auto shadow-xs">
              <Users2 size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-serif font-extrabold uppercase text-slate-900 tracking-tight">No Matches Found</h3>
              <p className="text-xs text-slate-500 font-semibold max-w-xs mx-auto leading-relaxed">Try resetting or broadening your search filters to discover more life partners.</p>
            </div>
            <button 
              onClick={handleReset} 
              className="px-6 py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-sm cursor-pointer transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {profiles.map((user) => {
                const uId = user.userId || user.UserId;
                return (
                  <ProfileCard
                    key={uId}
                    profile={user}
                    activeTab="matches"
                    actionLoading={actionLoading}
                    onInteraction={handleInteraction}
                    onViewProfile={() => openProfileView(user)}
                    onInitiateChat={handleInitiateChat}
                  />
                );
              })}
            </div>

            {/* 🔒 24-HOUR DAILY 20 PROFILES VIEW LIMIT CARD (FOR FREE UNPAID USERS) */}
            {dailyLimitReached && !isUserPaid && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-slate-900 via-[#3a051b] to-slate-950 text-white rounded-3xl p-8 border-2 border-amber-400/40 shadow-2xl text-center max-w-xl mx-auto space-y-4 relative overflow-hidden my-8"
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
                    <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* INFINITE SCROLL BOTTOM LOADING INDICATOR */}
            {fetchingMore && (
              <div className="flex items-center justify-center gap-2 py-6 text-[#d91b5c]">
                <Loader2 size={24} className="animate-spin text-[#d91b5c]" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Finding More Matches...</span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- NATIVE APP STYLE SOBER FILTER DRAWER --- */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFilters(false)} className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[60]" />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 220 }} 
              className="fixed inset-y-0 right-0 h-[100dvh] w-full sm:max-w-md bg-white z-[70] flex flex-col shadow-2xl overflow-hidden border-l border-slate-200 text-slate-900"
            >
              
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white text-slate-900 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#d91b5c] border border-rose-100 flex items-center justify-center">
                    <SlidersHorizontal size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-extrabold uppercase tracking-tight leading-none text-slate-900">Filter Matches</h3>
                    <span className="text-[10px] text-slate-500 font-medium">Select criteria for your ideal matches</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={handleReset}
                    className="text-[11px] font-bold uppercase text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full transition-all cursor-pointer border border-slate-200"
                  >
                    Reset All
                  </button>
                  <button onClick={() => setShowFilters(false)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-full transition-all cursor-pointer"><X size={18}/></button>
                </div>
              </div>

              {/* FILTER SECTIONS (Scrollable Content Body) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 no-scrollbar bg-slate-50/50">
                
                {/* BASIC CRITERIA CARD */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#d91b5c] block border-b border-slate-100 pb-2">Basic Criteria</span>

                  <DualRange min={18} max={60} valMin={filters.ageMin} valMax={filters.ageMax} onChangeMin={(v: number)=>setFilters({...filters, ageMin:v})} onChangeMax={(v: number)=>setFilters({...filters, ageMax:v})} title="Age Range" label="yrs" />

                  <DualRange min={4.0} max={7.0} valMin={filters.heightMin} valMax={filters.heightMax} onChangeMin={(v: number)=>setFilters({...filters, heightMin:v})} onChangeMax={(v: number)=>setFilters({...filters, heightMax:v})} title="Height Range" label="ft" step={0.1} />

                  <CategoryRow 
                    title="Marital Status" 
                    count={filters.maritalStatus.length} 
                    onClick={() => openCategorySheet('MARITAL_STATUS')} 
                  />
                </div>

                {/* RELIGION & COMMUNITY CARD */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#d91b5c] block border-b border-slate-100 pb-2">Religion & Community</span>
                  
                  <CategoryRow title="Sect / Maslak" count={filters.sect.length} onClick={() => openCategorySheet('SECT')} />
                  <CategoryRow title="Caste / Community" count={filters.caste.length} onClick={() => openCategorySheet('CASTE')} />
                  <CategoryRow title="State Location" count={filters.states.length} onClick={() => openCategorySheet('STATE')} />
                </div>

                {/* PREMIUM ADVANCED FILTERS CARD (VIP PRO 👑) */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 relative">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Crown size={15} className="text-amber-500 fill-amber-400" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#d91b5c]">VIP Advanced Filters</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-black uppercase shadow-2xs">
                      PRO ONLY
                    </span>
                  </div>

                  <CategoryRow title="City Location" isLocked={!isUserPaid} count={filters.cities.length} onClick={() => openCategorySheet('CITY', true)} />
                  <CategoryRow title="Education" isLocked={!isUserPaid} count={filters.education.length} onClick={() => openCategorySheet('EDUCATION', true)} />
                  <CategoryRow title="Profession" isLocked={!isUserPaid} count={filters.employedIn.length} onClick={() => openCategorySheet('PROFESSION', true)} />
                </div>

              </div>

              {/* ⚡ FIXED ACTION FOOTER */}
              <div className="p-4 pb-20 sm:pb-4 bg-white border-t border-slate-200 flex items-center gap-2.5 shrink-0 shadow-lg z-30">
                <button 
                  type="button"
                  onClick={() => setShowFilters(false)} 
                  className="px-3.5 py-3 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 active:scale-95 shadow-xs"
                  title="Close Filters"
                >
                  Close
                </button>

                <button 
                  type="button"
                  onClick={handleReset} 
                  className="w-11 h-11 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-xs"
                  title="Reset Filters"
                >
                  <RotateCcw size={18} />
                </button>

                <button 
                  type="button"
                  onClick={handleApplyFilters} 
                  className="flex-1 py-3 bg-[#d91b5c] hover:bg-[#b01348] text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Search size={16} className="text-amber-300" />
                  <span>Apply & Save</span>
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MULTI-SELECT BOTTOM SHEET MODAL WITH SEARCH */}
      <AnimatePresence>
        {activeBottomSheet && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveBottomSheet(null)} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 220 }} className="relative bg-white rounded-t-[36px] max-w-md w-full p-6 space-y-4 z-10 max-h-[80vh] flex flex-col shadow-2xl border-t-2 border-rose-100 text-slate-800">
              
              <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto" />
              
              <div className="flex justify-between items-center border-b-2 border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-serif font-extrabold uppercase text-[#d91b5c]">
                    Select {activeBottomSheet.replace('_', ' ')}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    {getSelectedCount(activeBottomSheet) > 0 ? `${getSelectedCount(activeBottomSheet)} selected` : 'Multi-select allowed'}
                  </span>
                </div>
                <button onClick={() => setActiveBottomSheet(null)} className="p-1.5 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"><X size={18}/></button>
              </div>

              {/* Search in Options */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeBottomSheet.replace('_', ' ')}...`}
                  value={sheetSearch}
                  onChange={(e) => setSheetSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-bold outline-none bg-slate-50 rounded-xl border border-slate-200 text-slate-800 focus:border-[#d91b5c] transition-colors"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1 no-scrollbar max-h-[45vh]">
                {getOptionsForSheet(activeBottomSheet).map((opt) => {
                  const isSelected = getIsSelected(activeBottomSheet, opt);
                  return (
                    <div 
                      key={opt} 
                      onClick={() => handleToggleOption(activeBottomSheet, opt)}
                      className={`p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-[#d91b5c] bg-rose-50 text-[#d91b5c] font-black shadow-2xs' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold'
                      }`}
                    >
                      <span className="text-xs uppercase">{opt}</span>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        isSelected ? 'bg-[#d91b5c] text-white shadow-xs' : 'border-2 border-slate-300'
                      }`}>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
                {getOptionsForSheet(activeBottomSheet).length === 0 && (
                  <div className="py-6 text-center text-xs text-slate-400 font-semibold">
                    No options match your search.
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveBottomSheet(null)}
                className="w-full py-3.5 bg-slate-950 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer text-center"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIP UPGRADE MODAL */}
      <SubscriptionModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />

    </div>
  );
}

// HELPER COMPONENTS
function DualRange({ min, max, valMin, valMax, onChangeMin, onChangeMax, label, title, step = 1 }: any) {
  const minPos = ((valMin - min) / (max - min)) * 100;
  const maxPos = ((valMax - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-[11px] font-black uppercase text-slate-700">{title}</label>
        <span className="text-[11px] font-black text-[#d91b5c] bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
          {valMin} {label} - {valMax} {label}
        </span>
      </div>
      <div className="relative h-2 bg-slate-200 rounded-full mx-1">
        <div className="absolute h-full bg-[#d91b5c] rounded-full" style={{ left: `${minPos}%`, right: `${100 - maxPos}%` }} />
        <input type="range" min={min} max={max} step={step} value={valMin} onChange={(e) => onChangeMin(Math.min(Number(e.target.value), valMax - step))} />
        <input type="range" min={min} max={max} step={step} value={valMax} onChange={(e) => onChangeMax(Math.max(Number(e.target.value), valMin + step))} />
      </div>
    </div>
  );
}

function CategoryRow({ title, count, onClick, isLocked = false }: { title: string; count: number; onClick: () => void; isLocked?: boolean }) {
  return (
    <div 
      onClick={onClick}
      className={`rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all border shadow-2xs group ${
        isLocked 
          ? 'bg-amber-50/40 border-amber-200/80 hover:border-amber-400' 
          : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/20'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {isLocked ? (
          <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Lock size={12} />
          </div>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-[#d91b5c]" />
        )}
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">{title}</h4>
      </div>

      <div className="flex items-center gap-2">
        {isLocked ? (
          <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
            <Lock size={10} /> Locked (VIP)
          </span>
        ) : (
          <span className={`text-[11px] font-bold ${count > 0 ? 'text-[#d91b5c] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 font-black' : 'text-slate-400'}`}>
            {count === 0 ? 'Any' : `${count} selected`}
          </span>
        )}
        <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
}

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
