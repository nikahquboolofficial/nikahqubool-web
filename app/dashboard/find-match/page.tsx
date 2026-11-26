"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, SlidersHorizontal, X, ChevronRight, ChevronDown, ChevronLeft,
  MapPin, Briefcase, GraduationCap, Heart, Loader2,
  Crown, Lock, RotateCcw, CheckCircle2, Eye, Sparkles, ArrowLeft,
  Globe, Moon, Languages, DollarSign, Star, MessageCircle, Check, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { 
  searchMatchesApi, handleInteractionApiCall, fetchMasterDataApi, 
  fetchCitiesApi, getCachedMasterValues, fetchDashboardApi, fetchProfileDetailsApi 
} from '@/lib/api';
import { getAuthToken } from '@/lib/auth';
import { getClientSubscriptionStatus } from '@/lib/subscriptionUtils';
import { getOptimizedImageUrl, DEFAULT_FEMALE_AVATAR } from '@/lib/imageUtils';
import SubscriptionModal from '@/components/dashboard/SubscriptionModal';

// --- Height Conversion Utilities ---
function cmToFtIn(cm: number): string {
  const totalInches = Math.round(cm / 2.54);
  const ft = Math.floor(totalInches / 12);
  const inch = totalInches % 12;
  return `${ft}ft ${inch}in`;
}

function parseHeightToFeet(val: any): number {
  if (!val) return 5.3;
  if (typeof val === 'number') return val;
  const str = String(val).trim();
  const match = str.match(/(\d+)\s*(?:ft|')(?:\s*(\d+)\s*(?:in|"))?/i);
  if (match) {
    const ft = parseInt(match[1], 10) || 5;
    const inch = parseInt(match[2], 10) || 0;
    return ft + inch / 12;
  }
  const cmMatch = str.match(/(\d{2,3})\s*cm/i);
  if (cmMatch) {
    return (parseInt(cmMatch[1], 10) / 2.54) / 12;
  }
  const num = parseFloat(str);
  return isNaN(num) ? 5.3 : num;
}

const INCOME_STEPS = [
  "No Income",
  "Under ₹3 Lakhs",
  "₹3 - 5 Lakhs",
  "₹5 - 7 Lakhs",
  "₹7 - 10 Lakhs",
  "₹10 - 15 Lakhs",
  "₹15 - 25 Lakhs",
  "₹25 - 50 Lakhs",
  "₹50 Lakhs - 1 Crore",
  "Rs. 1 Crore & Above"
];

// Default Filters Model
const INITIAL_SEARCH_FILTERS = {
  ageMin: 21,
  ageMax: 59,
  heightMin: 4.58, // 4ft 7in
  heightMax: 6.0,  // 6ft 0in
  maritalStatus: [] as string[],
  motherTongue: [] as string[],
  sect: [] as string[],
  caste: [] as string[],
  country: [] as string[],
  states: [] as string[],
  cities: [] as string[],
  education: [] as string[],
  employedIn: [] as string[],
  incomeIndexMin: 0,
  incomeIndexMax: 9,
  profileCreatedFor: [] as string[],
  // Quick Chips
  verifiedOnly: false,
  withPhotoOnly: false,
  onlineOnly: false,
  premiumOnly: false,
};

const STORAGE_KEY = "nikah_find_match_saved_filters_v2";

// 🌟 REUSABLE PREMIUM DUAL-THUMB RANGE SLIDER (Single Track with Left & Right Thumbs)
interface DualRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  minVal: number;
  maxVal: number;
  minGap?: number;
  onChange: (min: number, max: number) => void;
}

function DualRangeSlider({
  min,
  max,
  step = 1,
  minVal,
  maxVal,
  minGap = 1,
  onChange,
}: DualRangeSliderProps) {
  const minPercent = Math.max(0, Math.min(100, ((minVal - min) / (max - min)) * 100));
  const maxPercent = Math.max(0, Math.min(100, ((maxVal - min) / (max - min)) * 100));

  return (
    <div className="relative w-full h-7 flex items-center select-none touch-none">
      {/* Background Track */}
      <div className="absolute inset-x-0 h-1.5 bg-slate-200/90 rounded-full" />

      {/* Active Range Highlight Bar */}
      <div
        className="absolute h-1.5 bg-gradient-to-r from-[#E21E5B] to-[#C2185B] rounded-full pointer-events-none transition-[left,width] duration-75"
        style={{
          left: `${minPercent}%`,
          width: `${Math.max(0, maxPercent - minPercent)}%`,
        }}
      />

      {/* Left Thumb (Min) */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={minVal}
        onChange={(e) => {
          const val = Math.min(Number(e.target.value), maxVal - minGap);
          onChange(val, maxVal);
        }}
        className="absolute inset-x-0 w-full h-1.5 appearance-none bg-transparent pointer-events-none cursor-pointer
          [&::-webkit-slider-runnable-track]:appearance-none
          [&::-moz-range-track]:appearance-none
          [&::-webkit-slider-thumb]:pointer-events-auto
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-5
          [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-[#E21E5B]
          [&::-webkit-slider-thumb]:border-2
          [&::-webkit-slider-thumb]:border-white
          [&::-webkit-slider-thumb]:shadow-md
          [&::-webkit-slider-thumb]:hover:scale-110
          [&::-webkit-slider-thumb]:active:scale-125
          [&::-webkit-slider-thumb]:transition-transform
          [&::-moz-range-thumb]:pointer-events-auto
          [&::-moz-range-thumb]:appearance-none
          [&::-moz-range-thumb]:w-5
          [&::-moz-range-thumb]:h-5
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-[#E21E5B]
          [&::-moz-range-thumb]:border-2
          [&::-moz-range-thumb]:border-white
          [&::-moz-range-thumb]:shadow-md
          [&::-moz-range-thumb]:hover:scale-110
          [&::-moz-range-thumb]:active:scale-125
          [&::-moz-range-thumb]:transition-transform"
        style={{ zIndex: minVal > max - (max - min) * 0.15 ? 25 : 20 }}
      />

      {/* Right Thumb (Max) */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={maxVal}
        onChange={(e) => {
          const val = Math.max(Number(e.target.value), minVal + minGap);
          onChange(minVal, val);
        }}
        className="absolute inset-x-0 w-full h-1.5 appearance-none bg-transparent pointer-events-none cursor-pointer
          [&::-webkit-slider-runnable-track]:appearance-none
          [&::-moz-range-track]:appearance-none
          [&::-webkit-slider-thumb]:pointer-events-auto
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-5
          [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-[#E21E5B]
          [&::-webkit-slider-thumb]:border-2
          [&::-webkit-slider-thumb]:border-white
          [&::-webkit-slider-thumb]:shadow-md
          [&::-webkit-slider-thumb]:hover:scale-110
          [&::-webkit-slider-thumb]:active:scale-125
          [&::-webkit-slider-thumb]:transition-transform
          [&::-moz-range-thumb]:pointer-events-auto
          [&::-moz-range-thumb]:appearance-none
          [&::-moz-range-thumb]:w-5
          [&::-moz-range-thumb]:h-5
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-[#E21E5B]
          [&::-moz-range-thumb]:border-2
          [&::-moz-range-thumb]:border-white
          [&::-moz-range-thumb]:shadow-md
          [&::-moz-range-thumb]:hover:scale-110
          [&::-moz-range-thumb]:active:scale-125
          [&::-moz-range-thumb]:transition-transform"
        style={{ zIndex: 21 }}
      />
    </div>
  );
}

export default function FindMatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode: 'form' (Search Profiles form) or 'results' (Search Results card feed)
  const [viewMode, setViewMode] = useState<'form' | 'results'>('form');

  // Filters State
  const [filters, setFilters] = useState(INITIAL_SEARCH_FILTERS);

  // Active Bottom Sheet in Form Mode (e.g. 'maritalStatus', 'caste', 'states', etc.)
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [sheetSearch, setSheetSearch] = useState("");

  // User Gender & Minimum Legal Marriage Age (Male searches Female -> min 18, Female searches Male -> min 21)
  const [currentUserGender, setCurrentUserGender] = useState<'Male' | 'Female' | null>(null);

  const targetMinAge = useMemo(() => {
    if (currentUserGender?.toLowerCase() === 'female') {
      return 21; // Female user seeks Groom (Male) -> Indian Legal Marriage Age is 21
    }
    return 18; // Male user seeks Bride (Female) -> Indian Legal Marriage Age is 18
  }, [currentUserGender]);

  // 2-Column Filters Modal in Results Mode (Screenshots 6-9)
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState<string>("Age");
  const [modalCasteSearch, setModalCasteSearch] = useState("");

  // Results & Profiles State
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isUserPaid, setIsUserPaid] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeatureName, setUpgradeFeatureName] = useState("Advanced Filters");

  // Dynamic Masters from DB
  const [masterOptions, setMasterOptions] = useState<Record<string, string[]>>({
    MARITAL_STATUS: ["Never Married", "Divorced", "Separated", "Widowed", "Annulled"],
    SECTS: ["Sunni", "Shia", "Ahl-e-Hadith", "Other"],
    CASTES: getCachedMasterValues('CASTES').length > 0 ? getCachedMasterValues('CASTES') : [
      "Ansari", "Qureshi", "Syed", "Sheikh or Shaikh", "Khan / Pathan", "Siddiqui",
      "Malik", "Choudhary", "Mansoori", "Saifi", "Abbasi", "Farooqui", "Usmani", "Alvi"
    ],
    MOTHER_TONGUES: ["Urdu", "Hindi", "English", "Bengali", "Telugu", "Marathi", "Tamil", "Gujarati", "Malayalam", "Kannada", "Kashmiri", "Punjabi"],
    COUNTRIES: ["India", "United Arab Emirates", "Saudi Arabia", "United Kingdom", "United States", "Canada", "Qatar", "Kuwait", "Oman"],
    STATES: getCachedMasterValues('STATES').length > 0 ? getCachedMasterValues('STATES') : [
      "Uttar Pradesh", "Delhi", "Maharashtra", "Bihar", "Karnataka", "Telangana", "West Bengal", "Gujarat", "Madhya Pradesh", "Rajasthan"
    ],
    CITIES: [] as string[],
    EDUCATIONS: ["B.Tech / B.E.", "MBA / PGDM", "BCA / MCA", "MBBS / MD / Medical", "B.Sc / M.Sc", "B.Com / M.Com", "B.A. / M.A.", "Islamic Scholar / Aalim", "Chartered Accountant (CA)", "Law / LLB / LLM", "Diploma / High School"],
    EMPLOYED_IN: ["Private Sector", "Government / Public Sector", "Business / Self Employed", "Civil Services", "Defense / Police", "Not Working / Homemaker"]
  });

  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const getToken = useCallback(() => getAuthToken(), []);

  // 1. Load Saved Filters from localStorage on Mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            setFilters(prev => ({ ...prev, ...parsed }));
          }
        } catch {}
      }

      // Check URL query parameters (e.g. if arriving directly with ?view=results)
      if (searchParams.get('view') === 'results') {
        setViewMode('results');
      }

      // Check localStorage for gender
      try {
        const detailsStr = localStorage.getItem("user_details");
        if (detailsStr) {
          const u = JSON.parse(detailsStr);
          const g = u?.gender || u?.Gender;
          if (g && (String(g).toLowerCase() === 'male' || String(g).toLowerCase() === 'female')) {
            setCurrentUserGender(String(g).toLowerCase() === 'female' ? 'Female' : 'Male');
          }
        }
      } catch {}
    }
  }, [searchParams]);

  // 1b. Fetch User Profile to accurately detect Gender & enforce Legal Marriage Age
  useEffect(() => {
    const fetchUserGender = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetchProfileDetailsApi(0, token);
        if (res.success && res.data) {
          const p = res.data.profile || res.data.Profile || res.data;
          const g = p?.gender || p?.Gender;
          if (g && (String(g).toLowerCase() === 'male' || String(g).toLowerCase() === 'female')) {
            setCurrentUserGender(String(g).toLowerCase() === 'female' ? 'Female' : 'Male');
          }
        }
      } catch {}
    };
    fetchUserGender();
  }, [getToken]);

  // 1c. Automatically ensure ageMin satisfies targetMinAge constraint
  useEffect(() => {
    setFilters(prev => {
      if (prev.ageMin < targetMinAge) {
        return { ...prev, ageMin: targetMinAge };
      }
      return prev;
    });
  }, [targetMinAge]);

  // 2. Fetch Master Data from Backend
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [marital, sects, castes, tongues, states, educations, occupations] = await Promise.all([
          fetchMasterDataApi('MARITAL_STATUS').catch(() => []),
          fetchMasterDataApi('SECTS').catch(() => []),
          fetchMasterDataApi('CASTES').catch(() => []),
          fetchMasterDataApi('MOTHER_TONGUES').catch(() => []),
          fetchMasterDataApi('STATES').catch(() => []),
          fetchMasterDataApi('EDUCATIONS').catch(() => []),
          fetchMasterDataApi('EMPLOYMENT_SECTORS').catch(() => [])
        ]);

        const extractVals = (list: any[]) => {
          if (Array.isArray(list) && list.length > 0) {
            return list.map(item => String(item.value || item.Value || item.name || item.Name || '').trim()).filter(Boolean);
          }
          return [];
        };

        setMasterOptions(prev => ({
          ...prev,
          MARITAL_STATUS: extractVals(marital).length > 0 ? extractVals(marital) : prev.MARITAL_STATUS,
          SECTS: extractVals(sects).length > 0 ? extractVals(sects) : prev.SECTS,
          CASTES: extractVals(castes).length > 0 ? extractVals(castes) : prev.CASTES,
          MOTHER_TONGUES: extractVals(tongues).length > 0 ? extractVals(tongues) : prev.MOTHER_TONGUES,
          STATES: extractVals(states).length > 0 ? extractVals(states) : prev.STATES,
          EDUCATIONS: extractVals(educations).length > 0 ? extractVals(educations) : prev.EDUCATIONS,
          EMPLOYED_IN: extractVals(occupations).length > 0 ? extractVals(occupations) : prev.EMPLOYED_IN,
        }));
      } catch {}
    };
    loadMasters();

    // Check user subscription status
    const status = getClientSubscriptionStatus();
    setIsUserPaid(Boolean(status?.isPaid));
  }, []);

  // 3. Load Cities dynamically when States change
  useEffect(() => {
    if (filters.states.length === 0) {
      setAvailableCities([]);
      return;
    }
    const loadCities = async () => {
      setLoadingCities(true);
      try {
        // Fetch cities for first selected state
        const stateRes = await fetchMasterDataApi('STATES');
        const matchedState = stateRes.find((s: any) => filters.states.includes(s.value || s.Value));
        if (matchedState && (matchedState.id || (matchedState as any).Id)) {
          const cities = await fetchCitiesApi(Number(matchedState.id || (matchedState as any).Id));
          setAvailableCities(cities.map((c: any) => c.value || c.Value));
        }
      } catch {
        setAvailableCities([]);
      } finally {
        setLoadingCities(false);
      }
    };
    loadCities();
  }, [filters.states]);

  // 4. Load Matches API Call
  const loadMatches = useCallback(async (pageNum: number = 1, append: boolean = false, customFilters?: typeof filters) => {
    const token = getToken();
    if (!token) return;

    if (pageNum === 1) setLoading(true);
    else setFetchingMore(true);

    const f = customFilters || filters;

    const payload = {
      searchText: "",
      ageMin: Math.max(f.ageMin || targetMinAge, targetMinAge),
      ageMax: f.ageMax || 70,
      heightMin: f.heightMin || null,
      heightMax: f.heightMax || null,
      maritalStatus: f.maritalStatus.length > 0 ? f.maritalStatus : null,
      motherTongue: f.motherTongue.length > 0 ? f.motherTongue : null,
      sect: f.sect.length > 0 ? f.sect : null,
      caste: f.caste.length > 0 ? f.caste : null,
      states: f.states.length > 0 ? f.states : null,
      cities: isUserPaid && f.cities.length > 0 ? f.cities : null,
      education: isUserPaid && f.education.length > 0 ? f.education : null,
      employedIn: isUserPaid && f.employedIn.length > 0 ? f.employedIn : null,
      withPhotoOnly: Boolean(f.withPhotoOnly),
      verifiedOnly: Boolean(f.verifiedOnly),
      onlineOnly: Boolean(f.onlineOnly),
      premiumOnly: Boolean(f.premiumOnly),
      pageNumber: pageNum,
      pageSize: 20
    };

    try {
      const res = await searchMatchesApi(payload, token);
      let list = (res && res.success && Array.isArray(res.data)) ? res.data : [];

      // Fallback: If 0 returned and page 1, fetch general recommendation feed
      if (list.length === 0 && pageNum === 1) {
        try {
          const feedRes = await fetchDashboardApi('best-matches', 1, token);
          if (feedRes && feedRes.success && Array.isArray(feedRes.data)) {
            list = feedRes.data;
          }
        } catch {}
      }

      setIsUserPaid(Boolean(res?.isUserPaid ?? isUserPaid));

      setProfiles(prev => {
        if (!append) return list;
        const existingIds = new Set(prev.map(p => Number(p.userId || p.UserId)));
        const newAdditions = list.filter((p: any) => !existingIds.has(Number(p.userId || p.UserId)));
        return [...prev, ...newAdditions];
      });

      setHasMore(list.length >= 10);
    } catch (err) {
      console.error("Error searching matches:", err);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  }, [getToken, filters, isUserPaid]);

  // Execute Search from Form
  const handleExecuteSearch = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    }
    setViewMode('results');
    setPage(1);
    loadMatches(1, false, filters);
  };

  // Quick Chip Toggles
  const toggleQuickChip = (chipKey: 'verifiedOnly' | 'withPhotoOnly' | 'onlineOnly' | 'premiumOnly') => {
    setFilters(prev => {
      const updated = { ...prev, [chipKey]: !prev[chipKey] };
      loadMatches(1, false, updated);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Interaction (Shortlist, Interest, Chat)
  const handleAction = async (receiverId: number, type: string) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await handleInteractionApiCall(receiverId, type, 'PENDING', token);
      if (res && res.success) {
        if (type === 'INTEREST') {
          toast.success("Interest sent successfully!");
          // Mark interest sent in local state
          setProfiles(prev => prev.map(p => {
            if (Number(p.userId || p.UserId) === receiverId) {
              return { ...p, hasSentInterest: true };
            }
            return p;
          }));
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
        toast.error(res?.message || "Action could not be completed.");
      }
    } catch {
      toast.error("Failed to complete action. Please try again.");
    }
  };

  const openProfileDetail = (user: any) => {
    const uId = user.userId || user.UserId;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("last_browse_page", "/dashboard/find-match");
      sessionStorage.setItem("viewing_profile_target", JSON.stringify(user));
      localStorage.setItem("viewing_profile_target", JSON.stringify(user));
    }
    router.push(`/dashboard/profile?userId=${uId}`);
  };

  const handleStartChat = (user: any) => {
    const status = getClientSubscriptionStatus();
    if (!status.isPaid || !status.canChat) {
      setUpgradeFeatureName("Unlimited Chatting");
      setShowUpgradeModal(true);
      return;
    }
    const uId = user.userId || user.UserId;
    const name = user.fullName || user.FullName || 'Member';
    const photo = user.photoUrl || user.PhotoUrl || '';
    router.push(`/dashboard/messages?targetUserId=${uId}&targetName=${encodeURIComponent(name)}&targetPhoto=${encodeURIComponent(photo)}`);
  };

  // Multi-select Toggle Handler for Form Bottom Sheets
  const toggleSheetOption = (listKey: keyof typeof filters, val: string) => {
    setFilters(prev => {
      const list = (prev[listKey] as string[]) || [];
      const exists = list.includes(val);
      const updated = exists ? list.filter(item => item !== val) : [...list, val];
      return { ...prev, [listKey]: updated };
    });
  };

  const setAllOrNone = (listKey: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [listKey]: [] })); // empty array = "Open to all"
  };

  // Helper formatting for summary text
  const getSummary = (list: string[], fallback: string = "Open to all") => {
    if (!list || list.length === 0) return fallback;
    if (list.length === 1) return list[0];
    return `${list[0]}, ${list[1]}${list.length > 2 ? ` (+${list.length - 2})` : ''}`;
  };

  // Convert decimal feet to label
  const formatHeightFeet = (ftVal: number) => {
    const totalInches = Math.round(ftVal * 12);
    const ft = Math.floor(totalInches / 12);
    const inch = totalInches % 12;
    return inch === 0 ? `${ft}ft` : `${ft}ft ${inch}in`;
  };

  // VIP Feature lock trigger
  const handleVipLockClick = (featureName: string) => {
    setUpgradeFeatureName(featureName);
    setShowUpgradeModal(true);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-24 selection:bg-[#E21E5B] selection:text-white">
      <Toaster position="top-center" richColors />

      {/* ========================================================================= */}
      {/* 🧭 VIEW 1: SEARCH PROFILES (SCREENSHOTS 1, 3, 4)                           */}
      {/* ========================================================================= */}
      {viewMode === 'form' && (
        <>
          {/* Top Bar (Fixed) */}
          <div className="fixed top-0 lg:top-20 inset-x-0 z-40 bg-white py-3 px-4 border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="max-w-md mx-auto flex items-center gap-3">
              <button 
                onClick={() => {
                  if (typeof window !== "undefined") {
                    const last = sessionStorage.getItem('last_browse_page');
                    if (last && last !== '/dashboard/find-match') {
                      router.push(last);
                      return;
                    }
                    if (window.history.length > 1) {
                      router.back();
                      return;
                    }
                  }
                  router.push('/dashboard');
                }} 
                className="w-9 h-9 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
                aria-label="Back"
              >
                <ChevronLeft size={20} className="stroke-[2.5]" />
              </button>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Search Profiles
              </h1>
            </div>
          </div>

          <div className="max-w-md mx-auto px-4 pt-16 lg:pt-28 pb-32 space-y-5">

          {/* 🌟 SECTION 1: BASIC DETAILS */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 pl-1">Basic Details</h2>

            {/* AGE DUAL SLIDER CARD */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Age</span>
                <span className="text-[10px] font-medium text-slate-400">
                  {currentUserGender === 'Female' ? 'Groom legal min: 21 yrs' : 'Bride legal min: 18 yrs'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-extrabold text-slate-900">
                <span>Min {Math.max(filters.ageMin, targetMinAge)} yrs</span>
                <span>Max {filters.ageMax} yrs</span>
              </div>
              <DualRangeSlider
                min={targetMinAge}
                max={70}
                step={1}
                minVal={Math.max(filters.ageMin, targetMinAge)}
                maxVal={filters.ageMax}
                minGap={1}
                onChange={(min, max) => setFilters(prev => ({ ...prev, ageMin: min, ageMax: max }))}
              />
            </div>

            {/* HEIGHT DUAL SLIDER CARD */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
              <div className="text-xs font-semibold text-slate-500">Height</div>
              <div className="flex items-center justify-between text-sm font-extrabold text-slate-900">
                <span>Min {formatHeightFeet(filters.heightMin)}</span>
                <span>Max {formatHeightFeet(filters.heightMax)}</span>
              </div>
              <DualRangeSlider
                min={4.0}
                max={7.0}
                step={0.0833}
                minVal={filters.heightMin}
                maxVal={filters.heightMax}
                minGap={0.0833}
                onChange={(min, max) => setFilters(prev => ({ ...prev, heightMin: min, heightMax: max }))}
              />
            </div>

            {/* MARITAL STATUS CARD */}
            <div 
              onClick={() => { setSheetSearch(""); setActiveSheet('maritalStatus'); }}
              className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-[#E21E5B]/40 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-600">
                  <Heart size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Marital Status</div>
                  <div className="text-[11px] font-medium text-slate-500">
                    {getSummary(filters.maritalStatus)}
                  </div>
                </div>
              </div>
              <ChevronDown size={18} className="text-slate-400" />
            </div>

            {/* MOTHER TONGUE CARD */}
            <div 
              onClick={() => { setSheetSearch(""); setActiveSheet('motherTongue'); }}
              className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-[#E21E5B]/40 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-600">
                  <Languages size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Mother Tongue</div>
                  <div className="text-[11px] font-medium text-slate-500">
                    {getSummary(filters.motherTongue)}
                  </div>
                </div>
              </div>
              <ChevronDown size={18} className="text-slate-400" />
            </div>
          </div>

          {/* 🌙 SECTION 2: COMMUNITY */}
          <div className="space-y-3 pt-1">
            <h2 className="text-sm font-bold text-slate-900 pl-1">Community</h2>

            {/* SECT CARD */}
            <div 
              onClick={() => { setSheetSearch(""); setActiveSheet('sect'); }}
              className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-[#E21E5B]/40 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-600">
                  <Moon size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Sect</div>
                  <div className="text-[11px] font-medium text-slate-500">
                    {getSummary(filters.sect)}
                  </div>
                </div>
              </div>
              <ChevronDown size={18} className="text-slate-400" />
            </div>

            {/* CASTE CARD */}
            <div 
              onClick={() => { setSheetSearch(""); setActiveSheet('caste'); }}
              className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-[#E21E5B]/40 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-600">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Caste</div>
                  <div className="text-[11px] font-medium text-slate-500">
                    {getSummary(filters.caste)}
                  </div>
                </div>
              </div>
              <ChevronDown size={18} className="text-slate-400" />
            </div>
          </div>

          {/* 📍 SECTION 3: LOCATION */}
          <div className="space-y-3 pt-1">
            <h2 className="text-sm font-bold text-slate-900 pl-1">Location</h2>

            {/* COUNTRY */}
            <div 
              onClick={() => { setSheetSearch(""); setActiveSheet('country'); }}
              className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-[#E21E5B]/40 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-600">
                  <Globe size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Country</div>
                  <div className="text-[11px] font-medium text-slate-500">
                    {getSummary(filters.country)}
                  </div>
                </div>
              </div>
              <ChevronDown size={18} className="text-slate-400" />
            </div>

            {/* STATE */}
            <div 
              onClick={() => { setSheetSearch(""); setActiveSheet('states'); }}
              className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-[#E21E5B]/40 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-600">
                  <MapPin size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">State</div>
                  <div className="text-[11px] font-medium text-slate-500">
                    {getSummary(filters.states)}
                  </div>
                </div>
              </div>
              <ChevronDown size={18} className="text-slate-400" />
            </div>

            {/* CITY (Dependent on State) */}
            <div 
              onClick={() => {
                if (!isUserPaid) {
                  handleVipLockClick("City Filter");
                  return;
                }
                if (filters.states.length === 0) {
                  toast.info("Please select a State first to view cities.");
                  return;
                }
                setSheetSearch("");
                setActiveSheet('cities');
              }}
              className={`bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer transition-all ${
                filters.states.length === 0 ? 'opacity-80' : 'hover:border-[#E21E5B]/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400">
                  <Building2 size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">City</span>
                    {!isUserPaid && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold flex items-center gap-0.5">
                        <Crown size={9} /> VIP
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-medium text-slate-400">
                    {filters.states.length === 0 
                      ? "Select a state first" 
                      : (filters.cities.length > 0 ? getSummary(filters.cities) : "Open to all cities")}
                  </div>
                </div>
              </div>
              <ChevronDown size={18} className="text-slate-400" />
            </div>
          </div>

          {/* 🎓 SECTION 4: EDUCATION & INCOME */}
          <div className="space-y-3 pt-1">
            <h2 className="text-sm font-bold text-slate-900 pl-1">Education & Income</h2>

            {/* EDUCATION */}
            <div 
              onClick={() => {
                if (!isUserPaid) {
                  handleVipLockClick("Education Filter");
                  return;
                }
                setSheetSearch("");
                setActiveSheet('education');
              }}
              className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-[#E21E5B]/40 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-600">
                  <GraduationCap size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">Education</span>
                    {!isUserPaid && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold flex items-center gap-0.5">
                        <Crown size={9} /> VIP
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500">
                    {getSummary(filters.education)}
                  </div>
                </div>
              </div>
              <ChevronDown size={18} className="text-slate-400" />
            </div>

            {/* ANNUAL INCOME SLIDER */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Annual Income</span>
                {!isUserPaid && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold flex items-center gap-0.5">
                    <Crown size={9} /> VIP
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold text-slate-900">
                <span>{INCOME_STEPS[filters.incomeIndexMin]}</span>
                <span>{INCOME_STEPS[filters.incomeIndexMax]}</span>
              </div>
              <div className="relative pt-2 pb-1">
                <input 
                  type="range"
                  min={0}
                  max={9}
                  value={filters.incomeIndexMin}
                  onChange={(e) => {
                    if (!isUserPaid) {
                      handleVipLockClick("Annual Income Filter");
                      return;
                    }
                    const val = Number(e.target.value);
                    if (val <= filters.incomeIndexMax) {
                      setFilters(prev => ({ ...prev, incomeIndexMin: val }));
                    }
                  }}
                  className="w-full accent-[#E21E5B] h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* EMPLOYED IN */}
            <div 
              onClick={() => {
                if (!isUserPaid) {
                  handleVipLockClick("Employed In Filter");
                  return;
                }
                setSheetSearch("");
                setActiveSheet('employedIn');
              }}
              className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-[#E21E5B]/40 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-600">
                  <Briefcase size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">Employed In</span>
                    {!isUserPaid && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold flex items-center gap-0.5">
                        <Crown size={9} /> VIP
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500">
                    {getSummary(filters.employedIn)}
                  </div>
                </div>
              </div>
              <ChevronDown size={18} className="text-slate-400" />
            </div>
          </div>

          </div>

          {/* 🔍 SEARCH PROFILES BOTTOM CTA BUTTON (100% FIXED AT BOTTOM) */}
          <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 pt-3 pb-[max(env(safe-area-inset-bottom,0px),16px)] shadow-[0_-4px_25px_rgba(0,0,0,0.08)]">
            <div className="max-w-md mx-auto">
              <button
                onClick={handleExecuteSearch}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#E21E5B] via-[#E91E63] to-[#C2185B] text-white font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search size={18} className="stroke-[2.5]" />
                <span>Search Profiles</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 📸 VIEW 2: SEARCH RESULTS (SCREENSHOT 5)                                  */}
      {/* ========================================================================= */}
      {viewMode === 'results' && (
        <>
          {/* 🌟 100% FIXED RESULTS TOP BAR & QUICK-FILTERS */}
          <div className="fixed top-0 lg:top-20 inset-x-0 z-40 bg-white pt-2.5 pb-2 px-4 border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="max-w-md mx-auto space-y-2">
              {/* Results Top Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <button 
                    onClick={() => setViewMode('form')} 
                    className="w-9 h-9 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    <ChevronLeft size={20} className="stroke-[2.5]" />
                  </button>
                  <h1 className="text-lg font-bold tracking-tight text-slate-900">
                    Search Results
                  </h1>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {profiles.length} found
                </span>
              </div>

              {/* ⚡ HORIZONTAL QUICK-FILTER CHIPS BAR */}
              <div className="flex items-center gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5">
            {/* 1. All Filters Drawer Button */}
            <button
              onClick={() => setShowFiltersModal(true)}
              className="shrink-0 px-4 py-1.5 rounded-full border border-slate-200/90 bg-white text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-xs hover:border-[#E21E5B] active:scale-95 transition-all"
            >
              <SlidersHorizontal size={13} className="text-[#E21E5B]" />
              <span>Filters</span>
            </button>

            {/* 2. Verified Chip */}
            <button
              onClick={() => toggleQuickChip('verifiedOnly')}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer select-none ${
                filters.verifiedOnly
                  ? 'bg-[#1e293b] text-white border border-[#1e293b]'
                  : 'bg-white text-slate-700 border border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <span>Verified</span>
            </button>

            {/* 3. Photos Only Chip */}
            <button
              onClick={() => toggleQuickChip('withPhotoOnly')}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer select-none ${
                filters.withPhotoOnly
                  ? 'bg-[#1e293b] text-white border border-[#1e293b]'
                  : 'bg-white text-slate-700 border border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <span>With Photo</span>
            </button>

            {/* 4. Online Profiles Chip */}
            <button
              onClick={() => toggleQuickChip('onlineOnly')}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer select-none ${
                filters.onlineOnly
                  ? 'bg-[#1e293b] text-white border border-[#1e293b]'
                  : 'bg-white text-slate-700 border border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <span>Online Now</span>
            </button>

            {/* 5. Premium Profiles Chip */}
            <button
              onClick={() => toggleQuickChip('premiumOnly')}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer select-none ${
                filters.premiumOnly
                  ? 'bg-[#1e293b] text-white border border-[#1e293b]'
                  : 'bg-white text-slate-700 border border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <span>VIP Members</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-24 lg:pt-36 pb-28 space-y-4">
        {/* 🌟 PROFILES CARD FEED (SCREENSHOT 5) */}
          {loading ? (
            <div className="space-y-4 pt-2">
              {[1, 2].map((i) => (
                <div key={i} className="aspect-[4/5] rounded-3xl shimmer-luxury shadow-sm border border-slate-100" />
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-3 mt-4 shadow-xs">
              <div className="w-14 h-14 rounded-full bg-rose-50 text-[#E21E5B] flex items-center justify-center mx-auto">
                <Search size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Matching Profiles</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                No profiles matched your exact search filters. Try broadening your age, sect, or city filters.
              </p>
              <button
                onClick={() => {
                  setFilters(INITIAL_SEARCH_FILTERS);
                  loadMatches(1, false, INITIAL_SEARCH_FILTERS);
                }}
                className="mt-2 px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {profiles.map((user, idx) => {
                const uId = Number(user.userId || user.UserId);
                const name = user.fullName || user.FullName || 'Member';
                const age = user.age || user.Age || 24;
                const isPremium = Boolean(user.isPremium || user.IsPremium);
                const isVerified = Boolean(user.isVerified || user.IsVerified);
                const location = `${user.cityName || user.CityName || 'India'}${user.stateName || user.StateName ? `, ${user.stateName || user.StateName}` : ''}`;
                const community = `${user.sect || user.Sect || 'Muslim'}${user.caste || user.Caste ? ` / ${user.caste || user.Caste}` : ''}`;
                const profession = user.profession || user.Profession || user.education || user.Education || 'Professional';
                const photoUrl = getOptimizedImageUrl(user.photoUrl || user.PhotoUrl);
                const hasSentInterest = Boolean(user.hasSentInterest);
                const isShortlisted = Boolean(user.isShortlisted);

                return (
                  <div 
                    key={uId || idx}
                    className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-md bg-slate-900 border border-slate-200/60 group"
                  >
                    {/* Background Image */}
                    <img 
                      src={photoUrl}
                      alt={name}
                      onClick={() => openProfileDetail(user)}
                      className="w-full h-full object-cover object-top cursor-pointer group-hover:scale-102 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_FEMALE_AVATAR; }}
                    />

                    {/* Gradient Overlay for Text & Buttons */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
                      {isVerified ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm backdrop-blur-xs">
                          <CheckCircle2 size={11} className="stroke-[3]" /> Verified
                        </span>
                      ) : <span />}

                      {isPremium && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center gap-1 shadow-sm">
                          <Crown size={11} className="fill-slate-950" /> VIP
                        </span>
                      )}
                    </div>

                    {/* Profile Details Overlay at Bottom */}
                    <div className="absolute bottom-0 inset-x-0 p-4 space-y-3 z-10">
                      <div 
                        onClick={() => openProfileDetail(user)}
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

                      {/* 3 Circular Action Buttons (Screenshot 5) */}
                      <div className="flex items-center justify-center gap-6 pt-1">
                        {/* 1. Shortlist Button */}
                        <div className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAction(uId, 'SHORTLIST')}
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

                        {/* 2. Chat Button */}
                        <div className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartChat(user)}
                            className="w-12 h-12 rounded-full bg-[#E5B54F] text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
                          >
                            <MessageCircle size={20} className="fill-white stroke-none" />
                          </button>
                          <span className="text-[10px] font-semibold text-white/90">Chat</span>
                        </div>

                        {/* 3. Send Interest Button */}
                        <div className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            disabled={hasSentInterest}
                            onClick={() => handleAction(uId, 'INTEREST')}
                            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer ${
                              hasSentInterest 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-[#E21E5B] text-white hover:bg-[#d91b5c]'
                            }`}
                          >
                            {hasSentInterest ? (
                              <Check size={18} className="stroke-[3]" />
                            ) : (
                              <Heart size={18} className="fill-white stroke-none" />
                            )}
                          </button>
                          <span className="text-[10px] font-semibold text-white/90">
                            {hasSentInterest ? 'Sent' : 'Send Interest'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
      )}

      {/* ========================================================================= */}
      {/* 📋 POPUP 1: SINGLE-FIELD BOTTOM SHEET IN FORM MODE (SCREENSHOT 2)          */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeSheet && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 capitalize">
                    {activeSheet.replace(/([A-Z])/g, ' $1')}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Select one or more options
                  </p>
                </div>
                <button
                  onClick={() => setActiveSheet(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search input for Caste, City, State */}
              {['caste', 'cities', 'states'].includes(activeSheet) && (
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={sheetSearch}
                    onChange={(e) => setSheetSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#E21E5B]"
                  />
                </div>
              )}

              {/* Options List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[50vh]">
                {/* 1. Open to All Option */}
                <div 
                  onClick={() => setAllOrNone(activeSheet as keyof typeof filters)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                    (filters[activeSheet as keyof typeof filters] as string[])?.length === 0
                      ? 'bg-[#E21E5B] border-[#E21E5B] text-white'
                      : 'border-slate-300 bg-white'
                  }`}>
                    {(filters[activeSheet as keyof typeof filters] as string[])?.length === 0 && <Check size={13} className="stroke-[3]" />}
                  </div>
                  <span className="text-xs font-bold text-slate-900">Open to all</span>
                </div>

                {/* 2. Specific Options */}
                {(() => {
                  let options: string[] = [];
                  if (activeSheet === 'maritalStatus') options = masterOptions.MARITAL_STATUS;
                  else if (activeSheet === 'motherTongue') options = masterOptions.MOTHER_TONGUES;
                  else if (activeSheet === 'sect') options = masterOptions.SECTS;
                  else if (activeSheet === 'caste') options = masterOptions.CASTES;
                  else if (activeSheet === 'country') options = masterOptions.COUNTRIES;
                  else if (activeSheet === 'states') options = masterOptions.STATES;
                  else if (activeSheet === 'cities') options = availableCities;
                  else if (activeSheet === 'education') options = masterOptions.EDUCATIONS;
                  else if (activeSheet === 'employedIn') options = masterOptions.EMPLOYED_IN;

                  const filtered = sheetSearch.trim().length > 0
                    ? options.filter(o => o.toLowerCase().includes(sheetSearch.toLowerCase()))
                    : options;

                  const selectedList = (filters[activeSheet as keyof typeof filters] as string[]) || [];

                  return filtered.map((opt) => {
                    const isChecked = selectedList.includes(opt);
                    return (
                      <div
                        key={opt}
                        onClick={() => toggleSheetOption(activeSheet as keyof typeof filters, opt)}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                          isChecked 
                            ? 'bg-[#E21E5B] border-[#E21E5B] text-white' 
                            : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check size={13} className="stroke-[3]" />}
                        </div>
                        <span className="text-xs font-semibold text-slate-800">{opt}</span>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Done Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSheet(null)}
                  className="w-full py-3 rounded-xl bg-[#E21E5B] text-white text-xs font-bold shadow-md hover:bg-[#d91b5c] active:scale-[0.98] transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 🧭 POPUP 2: 2-COLUMN FILTERS DRAWER / MODAL (SCREENSHOTS 6 TO 9)            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showFiltersModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-lg h-full sm:h-[88vh] bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Top Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setShowFiltersModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200"
                >
                  <X size={16} />
                </button>
                <h3 className="text-base font-extrabold text-slate-900">Filters</h3>
                <button
                  onClick={() => {
                    setFilters(INITIAL_SEARCH_FILTERS);
                    toast.info("All filters cleared.");
                  }}
                  className="text-xs font-bold text-[#E21E5B] hover:underline"
                >
                  Clear All
                </button>
              </div>

              {/* 2-Column Body */}
              <div className="flex-1 flex overflow-hidden">
                {/* LEFT COLUMN: CATEGORIES TAB LIST */}
                <div className="w-[38%] border-r border-slate-200/80 bg-slate-50 overflow-y-auto py-2">
                  {[
                    "Age", "Height", "Marital Status", "Sect", "Caste", "Country", 
                    "State", "City", "Verified Profiles", "Education", "Employed In", 
                    "Mother Tongue", "Annual Income", "Premium Profiles", "Online Profiles", 
                    "Profiles With Photos"
                  ].map((tab) => {
                    const isActive = modalActiveTab === tab;
                    return (
                      <div
                        key={tab}
                        onClick={() => { setModalCasteSearch(""); setModalActiveTab(tab); }}
                        className={`px-3.5 py-3 text-xs font-semibold cursor-pointer transition-colors relative flex items-center ${
                          isActive 
                            ? 'bg-white font-extrabold text-[#e21e5b] shadow-xs' 
                            : 'text-slate-600 hover:bg-slate-100/60'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#e21e5b] rounded-r-md" />
                        )}
                        <span className="truncate">{tab}</span>
                      </div>
                    );
                  })}
                </div>

                {/* RIGHT COLUMN: CONTROLS FOR SELECTED TAB */}
                <div className="w-[62%] p-4 overflow-y-auto flex flex-col">
                  {/* TAB 1: AGE */}
                  {modalActiveTab === "Age" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Filter by Age</span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {currentUserGender === 'Female' ? 'Min 21 yrs' : 'Min 18 yrs'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-extrabold text-slate-900">
                        <span>Min {Math.max(filters.ageMin, targetMinAge)} yrs</span>
                        <span>Max {filters.ageMax} yrs</span>
                      </div>
                      <div className="pt-2">
                        <DualRangeSlider
                          min={targetMinAge}
                          max={70}
                          step={1}
                          minVal={Math.max(filters.ageMin, targetMinAge)}
                          maxVal={filters.ageMax}
                          minGap={1}
                          onChange={(min, max) => setFilters(p => ({ ...p, ageMin: min, ageMax: max }))}
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 2: HEIGHT */}
                  {modalActiveTab === "Height" && (
                    <div className="space-y-4">
                      <div className="text-xs font-semibold text-slate-500">Filter by Height</div>
                      <div className="flex items-center justify-between text-xs font-extrabold text-slate-900">
                        <span>Min {formatHeightFeet(filters.heightMin)}</span>
                        <span>Max {formatHeightFeet(filters.heightMax)}</span>
                      </div>
                      <div className="pt-2">
                        <DualRangeSlider
                          min={4.0}
                          max={7.0}
                          step={0.0833}
                          minVal={filters.heightMin}
                          maxVal={filters.heightMax}
                          minGap={0.0833}
                          onChange={(min, max) => setFilters(p => ({ ...p, heightMin: min, heightMax: max }))}
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB: MARITAL STATUS (SCREENSHOT 7) */}
                  {modalActiveTab === "Marital Status" && (
                    <div className="space-y-2">
                      <div 
                        onClick={() => setAllOrNone('maritalStatus')}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <div className={`w-4 h-4 rounded-xs border flex items-center justify-center ${
                          filters.maritalStatus.length === 0 ? 'bg-[#E21E5B] border-[#E21E5B] text-white' : 'border-slate-300'
                        }`}>
                          {filters.maritalStatus.length === 0 && <Check size={11} className="stroke-[3]" />}
                        </div>
                        <span className="text-xs font-bold text-slate-900">All</span>
                      </div>
                      {masterOptions.MARITAL_STATUS.map((opt) => {
                        const isChecked = filters.maritalStatus.includes(opt);
                        return (
                          <div 
                            key={opt}
                            onClick={() => toggleSheetOption('maritalStatus', opt)}
                            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                          >
                            <div className={`w-4 h-4 rounded-xs border flex items-center justify-center ${
                              isChecked ? 'bg-[#E21E5B] border-[#E21E5B] text-white' : 'border-slate-300'
                            }`}>
                              {isChecked && <Check size={11} className="stroke-[3]" />}
                            </div>
                            <span className="text-xs font-medium text-slate-800">{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* TAB: CASTE (SCREENSHOT 8) */}
                  {modalActiveTab === "Caste" && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Search"
                        value={modalCasteSearch}
                        onChange={(e) => setModalCasteSearch(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#E21E5B]"
                      />
                      <div 
                        onClick={() => setAllOrNone('caste')}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <div className={`w-4 h-4 rounded-xs border flex items-center justify-center ${
                          filters.caste.length === 0 ? 'bg-[#E21E5B] border-[#E21E5B] text-white' : 'border-slate-300'
                        }`}>
                          {filters.caste.length === 0 && <Check size={11} className="stroke-[3]" />}
                        </div>
                        <span className="text-xs font-bold text-slate-900">All</span>
                      </div>
                      {masterOptions.CASTES
                        .filter(c => c.toLowerCase().includes(modalCasteSearch.toLowerCase()))
                        .map((c) => {
                          const isChecked = filters.caste.includes(c);
                          return (
                            <div 
                              key={c}
                              onClick={() => toggleSheetOption('caste', c)}
                              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                            >
                              <div className={`w-4 h-4 rounded-xs border flex items-center justify-center ${
                                isChecked ? 'bg-[#E21E5B] border-[#E21E5B] text-white' : 'border-slate-300'
                              }`}>
                                {isChecked && <Check size={11} className="stroke-[3]" />}
                              </div>
                              <span className="text-xs font-medium text-slate-800">{c}</span>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* TAB: PROFILES WITH PHOTOS (SCREENSHOT 9) */}
                  {modalActiveTab === "Profiles With Photos" && (
                    <div className="space-y-2">
                      <div 
                        onClick={() => setFilters(p => ({ ...p, withPhotoOnly: true }))}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <div className={`w-4 h-4 rounded-xs border flex items-center justify-center ${
                          filters.withPhotoOnly ? 'bg-[#E21E5B] border-[#E21E5B] text-white' : 'border-slate-300'
                        }`}>
                          {filters.withPhotoOnly && <Check size={11} className="stroke-[3]" />}
                        </div>
                        <span className="text-xs font-medium text-slate-800">Profiles with photos</span>
                      </div>
                      <div 
                        onClick={() => setFilters(p => ({ ...p, withPhotoOnly: false }))}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <div className={`w-4 h-4 rounded-xs border flex items-center justify-center ${
                          !filters.withPhotoOnly ? 'bg-[#E21E5B] border-[#E21E5B] text-white' : 'border-slate-300'
                        }`}>
                          {!filters.withPhotoOnly && <Check size={11} className="stroke-[3]" />}
                        </div>
                        <span className="text-xs font-medium text-slate-800">All profiles</span>
                      </div>
                    </div>
                  )}

                  {/* TAB: VERIFIED PROFILES */}
                  {modalActiveTab === "Verified Profiles" && (
                    <div className="space-y-2">
                      <div 
                        onClick={() => setFilters(p => ({ ...p, verifiedOnly: true }))}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <div className={`w-4 h-4 rounded-xs border flex items-center justify-center ${
                          filters.verifiedOnly ? 'bg-[#E21E5B] border-[#E21E5B] text-white' : 'border-slate-300'
                        }`}>
                          {filters.verifiedOnly && <Check size={11} className="stroke-[3]" />}
                        </div>
                        <span className="text-xs font-medium text-slate-800">Verified profiles only</span>
                      </div>
                      <div 
                        onClick={() => setFilters(p => ({ ...p, verifiedOnly: false }))}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <div className={`w-4 h-4 rounded-xs border flex items-center justify-center ${
                          !filters.verifiedOnly ? 'bg-[#E21E5B] border-[#E21E5B] text-white' : 'border-slate-300'
                        }`}>
                          {!filters.verifiedOnly && <Check size={11} className="stroke-[3]" />}
                        </div>
                        <span className="text-xs font-medium text-slate-800">All profiles</span>
                      </div>
                    </div>
                  )}

                  {/* OTHER LIST TABS (Sect, States, Cities, Education, Employed In, etc.) */}
                  {!["Age", "Height", "Marital Status", "Caste", "Profiles With Photos", "Verified Profiles"].includes(modalActiveTab) && (
                    <div className="space-y-2">
                      {(() => {
                        let opts: string[] = [];
                        let filterKey: keyof typeof filters = 'sect';

                        if (modalActiveTab === "Sect") { opts = masterOptions.SECTS; filterKey = 'sect'; }
                        else if (modalActiveTab === "Country") { opts = masterOptions.COUNTRIES; filterKey = 'country'; }
                        else if (modalActiveTab === "State") { opts = masterOptions.STATES; filterKey = 'states'; }
                        else if (modalActiveTab === "City") { opts = availableCities; filterKey = 'cities'; }
                        else if (modalActiveTab === "Education") { opts = masterOptions.EDUCATIONS; filterKey = 'education'; }
                        else if (modalActiveTab === "Employed In") { opts = masterOptions.EMPLOYED_IN; filterKey = 'employedIn'; }
                        else if (modalActiveTab === "Mother Tongue") { opts = masterOptions.MOTHER_TONGUES; filterKey = 'motherTongue'; }

                        const selectedArr = (filters[filterKey] as string[]) || [];

                        return (
                          <>
                            <div 
                              onClick={() => setAllOrNone(filterKey)}
                              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                            >
                              <div className={`w-4 h-4 rounded-xs border flex items-center justify-center ${
                                selectedArr.length === 0 ? 'bg-[#E21E5B] border-[#E21E5B] text-white' : 'border-slate-300'
                              }`}>
                                {selectedArr.length === 0 && <Check size={11} className="stroke-[3]" />}
                              </div>
                              <span className="text-xs font-bold text-slate-900">All</span>
                            </div>
                            {opts.map((opt) => {
                              const isChecked = selectedArr.includes(opt);
                              return (
                                <div 
                                  key={opt}
                                  onClick={() => toggleSheetOption(filterKey, opt)}
                                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                                >
                                  <div className={`w-4 h-4 rounded-xs border flex items-center justify-center ${
                                    isChecked ? 'bg-[#E21E5B] border-[#E21E5B] text-white' : 'border-slate-300'
                                  }`}>
                                    {isChecked && <Check size={11} className="stroke-[3]" />}
                                  </div>
                                  <span className="text-xs font-medium text-slate-800">{opt}</span>
                                </div>
                              );
                            })}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Sticky Action: Show Profiles */}
              <div className="p-4 border-t border-slate-100 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setShowFiltersModal(false);
                    loadMatches(1, false, filters);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#E21E5B] to-[#C2185B] text-white font-bold text-sm shadow-md active:scale-[0.98] transition-all"
                >
                  Show Profiles
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Subscription Upgrade Modal */}
      {showUpgradeModal && (
        <SubscriptionModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          title={`Unlock ${upgradeFeatureName}`}
          subtitle={`Upgrade to Nikah Qubool VIP to search by specific cities, income brackets, education levels, and more.`}
        />
      )}
    </div>
  );
}
