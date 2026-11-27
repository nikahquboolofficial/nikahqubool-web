"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { 
  Bell, Heart, ArrowLeft, ChevronLeft, Check, Save, 
  PauseCircle, Trash2, Power, Loader2, ChevronRight, 
  LogOut, AlertTriangle, Eye, UserX, Unlock, Shield,
  SlidersHorizontal, CheckCircle2, Info, Sparkles,
  X, Search, MapPin, Briefcase, GraduationCap, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import { 
  fetchMasterDataApi, fetchCitiesApi, savePartnerPreferencesApi, fetchProfileDetailsApi,
  deactivateAccountApi, deleteAccountApi, fetchBlockedUsersApi,
  unblockUserApiCall, updatePhotoPrivacyApiCall, MasterOption 
} from '@/lib/api';
import { MultiSelectDropdown } from '@/components/profile/CompactSelect';
import { getAuthToken, clearAuthCookies } from '@/lib/auth';

const PREF_INCOME_OPTIONS: MasterOption[] = [
  { id: 'Any Income', value: 'Any Income' },
  { id: 'Below ₹2 Lakhs', value: 'Below ₹2 Lakhs' },
  { id: '₹2 Lakhs - ₹5 Lakhs', value: '₹2 Lakhs - ₹5 Lakhs' },
  { id: '₹5 Lakhs - ₹10 Lakhs', value: '₹5 Lakhs - ₹10 Lakhs' },
  { id: '₹10 Lakhs - ₹20 Lakhs', value: '₹10 Lakhs - ₹20 Lakhs' },
  { id: '₹20 Lakhs - ₹35 Lakhs', value: '₹20 Lakhs - ₹35 Lakhs' },
  { id: '₹35 Lakhs - ₹50 Lakhs', value: '₹35 Lakhs - ₹50 Lakhs' },
  { id: '₹50 Lakhs & Above', value: '₹50 Lakhs & Above' }
];

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
      <div className="absolute inset-x-0 h-1.5 bg-slate-200/90 rounded-full" />
      <div
        className="absolute h-1.5 bg-gradient-to-r from-[#E21E5B] to-[#C2185B] rounded-full pointer-events-none transition-[left,width] duration-75"
        style={{
          left: `${minPercent}%`,
          width: `${Math.max(0, maxPercent - minPercent)}%`,
        }}
      />
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
        style={{ zIndex: 22 }}
      />
    </div>
  );
}

const PREF_NAMAZ_OPTIONS: MasterOption[] = [
  { id: '5 Times Daily', value: '5 Times Daily' },
  { id: 'Regularly / Most Times', value: 'Regularly / Most Times' },
  { id: 'Only Jummah', value: 'Only Jummah' },
  { id: 'Sometimes / Occasional', value: 'Sometimes / Occasional' },
  { id: 'Planning to Start', value: 'Planning to Start' },
  { id: 'Any / Does Not Matter', value: 'Any / Does Not Matter' }
];

const PREF_HIJAB_BEARD_OPTIONS: MasterOption[] = [
  { id: 'Always Hijab / Niqab', value: 'Always Hijab / Niqab' },
  { id: 'Modest Hijab', value: 'Modest Hijab' },
  { id: 'Full Sunnah Beard', value: 'Full Sunnah Beard' },
  { id: 'Trimmed Beard', value: 'Trimmed Beard' },
  { id: 'No Hijab / Clean Shaved', value: 'No Hijab / Clean Shaved' },
  { id: 'Any / Open Minded', value: 'Any / Open Minded' }
];

// 🌟 LUXURY APP-STYLE TOGGLE SWITCH COMPONENT
function LuxuryToggle({ 
  checked, 
  onChange, 
  label, 
  description 
}: { 
  checked: boolean; 
  onChange: (val: boolean) => void; 
  label: string; 
  description: string; 
}) {
  return (
    <div 
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-100 hover:border-rose-200/80 shadow-xs cursor-pointer transition-all group"
    >
      <div className="space-y-0.5 pr-3">
        <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#d91b5c] transition-colors">{label}</h4>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={(e) => {
          e.stopPropagation();
          onChange(!checked);
        }}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-[#d91b5c]' : 'bg-slate-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'menu';

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [loading, setLoading] = useState(false);
  const [savingPref, setSavingPref] = useState(false);

  // 1. Notification Settings State (Stored in localStorage for persistence)
  const [emailNotif, setEmailNotif] = useState(true);
  const [appNotif, setAppNotif] = useState(true);
  const [matchAlerts, setMatchAlerts] = useState(true);

  // Load notification state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user_notif_prefs");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.emailNotif !== undefined) setEmailNotif(parsed.emailNotif);
          if (parsed.appNotif !== undefined) setAppNotif(parsed.appNotif);
          if (parsed.matchAlerts !== undefined) setMatchAlerts(parsed.matchAlerts);
        } catch {}
      }
    }
  }, []);

  // 2. Partner Preferences State
  const [prefData, setPrefData] = useState<any>({
    minAge: 20, maxAge: 35,
    minHeight: '5.0', maxHeight: '6.2',
    maritalStatusList: [],
    educationIds: [],
    occupationIds: [],
    casteIds: [],
    languageIds: [],
    sectIds: [],
    stateId: 0,
    cityId: 0,
    incomeLabel: 'Any Income',
    namazHabits: [],
    hijabOrBeard: []
  });

  const [hasUserPhoto, setHasUserPhoto] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("cached_profile_details") || localStorage.getItem("user_details");
        if (cached) {
          const parsed = JSON.parse(cached);
          const p = parsed.profile || parsed.Profile || parsed;
          const g = parsed.gallery || parsed.Gallery || p?.userPhotos || p?.UserPhotos || [];
          return (Array.isArray(g) && g.length > 0) || Boolean(p?.mainPhotoUrl || p?.photoUrl);
        }
      } catch {}
    }
    return false;
  });

  const [masterData, setMasterData] = useState<{ [key: string]: MasterOption[] }>({});

  // 📋 Partner Preference Bottom Sheet State (Matching Screenshots 1, 2, 3, 4)
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [sheetSearch, setSheetSearch] = useState<string>('');

  const toggleOption = (fieldKey: string, optId: any) => {
    setPrefData((prev: any) => {
      const list = Array.isArray(prev[fieldKey]) ? [...prev[fieldKey]] : [];
      const exists = list.some((item: any) => String(item) === String(optId));
      const updated = exists 
        ? list.filter((item: any) => String(item) !== String(optId))
        : [...list, optId];
      return { ...prev, [fieldKey]: updated };
    });
  };

  const getSummaryText = (id: string): string => {
    switch (id) {
      case 'age':
        return `${prefData.minAge || 18} - ${prefData.maxAge || 60} yrs`;
      case 'maritalStatus': {
        const list = prefData.maritalStatusList || [];
        if (list.length === 0) return 'Any';
        const names = (masterData.MARITAL_STATUS || []).filter(m => list.some((x: any) => String(x) === String(m.id))).map(m => m.value);
        if (names.length === 0) return 'Any';
        if (names.length <= 2) return names.join(', ');
        return `${names[0]}, ${names[1]} (+${names.length - 2})`;
      }
      case 'income':
        return prefData.incomeLabel || 'Any Income';
      case 'education': {
        const list = prefData.educationIds || [];
        if (list.length === 0) return 'Any';
        const names = (masterData.EDUCATIONS || []).filter(m => list.some((x: any) => String(x) === String(m.id))).map(m => m.value);
        if (names.length === 0) return 'Any';
        if (names.length <= 2) return names.join(', ');
        return `${names[0]} (+${names.length - 1})`;
      }
      case 'occupation': {
        const list = prefData.occupationIds || [];
        if (list.length === 0) return 'Any';
        const names = (masterData.OCCUPATIONS || []).filter(m => list.some((x: any) => String(x) === String(m.id))).map(m => m.value);
        if (names.length === 0) return 'Any';
        if (names.length <= 2) return names.join(', ');
        return `${names[0]} (+${names.length - 1})`;
      }
      case 'motherTongue': {
        const list = prefData.languageIds || [];
        if (list.length === 0) return 'Any';
        const names = (masterData.MOTHER_TONGUES || []).filter(m => list.some((x: any) => String(x) === String(m.id))).map(m => m.value);
        if (names.length === 0) return 'Any';
        if (names.length <= 2) return names.join(', ');
        return `${names[0]} (+${names.length - 1})`;
      }
      case 'sect': {
        const list = prefData.sectIds || [];
        if (list.length === 0) return 'Any';
        const names = (masterData.SECTS || []).filter(m => list.some((x: any) => String(x) === String(m.id))).map(m => m.value);
        if (names.length === 0) return 'Any';
        if (names.length <= 2) return names.join(', ');
        return `${names[0]} (+${names.length - 1})`;
      }
      case 'caste': {
        const list = prefData.casteIds || [];
        if (list.length === 0) return 'Any';
        const names = (masterData.CASTES || []).filter(m => list.some((x: any) => String(x) === String(m.id))).map(m => m.value);
        if (names.length === 0) return 'Any';
        if (names.length <= 2) return names.join(', ');
        return `${names[0]} (+${names.length - 1})`;
      }
      case 'height':
        return `${prefData.minHeight || '4.5'} - ${prefData.maxHeight || '6.5'} ft`;
      case 'state': {
        if (!prefData.stateId) return 'Any State';
        const s = (masterData.STATES || []).find(x => Number(x.id) === Number(prefData.stateId));
        return s ? s.value : 'Any State';
      }
      case 'city': {
        if (!prefData.cityId) return 'Any City';
        const c = (masterData.CITIES || []).find(x => Number(x.id) === Number(prefData.cityId));
        return c ? c.value : 'Any City';
      }
      case 'namaz': {
        const list = prefData.namazHabits || [];
        if (list.length === 0) return 'Any / Flexible';
        if (list.length <= 2) return list.join(', ');
        return `${list[0]} (+${list.length - 1})`;
      }
      case 'hijab': {
        const list = prefData.hijabOrBeard || [];
        if (list.length === 0) return 'Any / Open Minded';
        if (list.length <= 2) return list.join(', ');
        return `${list[0]} (+${list.length - 1})`;
      }
      default:
        return '';
    }
  };

  // 3. Privacy & Blocked Users State
  const [privacySubTab, setPrivacySubTab] = useState<'photo' | 'blocked'>('photo');
  const [photoPrivacy, setPhotoPrivacy] = useState<string>('All Members');
  const [savingPhotoPrivacy, setSavingPhotoPrivacy] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loadingBlockedUsers, setLoadingBlockedUsers] = useState(false);
  const [unblockingUserId, setUnblockingUserId] = useState<number | null>(null);

  // 4. Pause / Deactivate Modal State
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseReason, setPauseReason] = useState("Found my life partner on Nikah Qubool 💖");
  const [pauseRemark, setPauseRemark] = useState("");
  const [isAccountPaused, setIsAccountPaused] = useState(false);
  const [pausingLoading, setPausingLoading] = useState(false);

  // 5. Delete Account Modal State (VIP Multi-Step)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteReason, setDeleteReason] = useState("Found my life partner on Nikah Qubool 💖");
  const [deleteRemark, setDeleteRemark] = useState("");
  const [deleteConfirmedCheck, setDeleteConfirmedCheck] = useState(false);
  const [deleteKeyword, setDeleteKeyword] = useState("");
  const [deletingLoading, setDeletingLoading] = useState(false);

  const getToken = useCallback((): string | null => getAuthToken(), []);

  const handleLogout = useCallback(() => {
    clearAuthCookies();
    setTimeout(() => {
      router.push('/');
    }, 400);
  }, [router]);

  useEffect(() => {
    router.prefetch('/dashboard/payment-info');
    router.prefetch('/dashboard/my-profile');
    router.prefetch('/dashboard/membership');
    const tabParam = searchParams.get('tab');
    setActiveTab(tabParam || 'menu');
  }, [searchParams, router]);

  // Load Master Data & Existing Partner Preferences when tab is opened
  useEffect(() => {
    if (activeTab !== 'preferences') return;
    let isMounted = true;

    const loadMastersAndPref = async () => {
      const types = ['MARITAL_STATUS', 'SECTS', 'MOTHER_TONGUES', 'EDUCATIONS', 'OCCUPATIONS', 'CASTES', 'STATES', 'PHOTO_PRIVACY'];
      try {
        const results = await Promise.all(types.map(t => fetchMasterDataApi(t)));
        if (!isMounted) return;
        const newMasterData: { [key: string]: MasterOption[] } = {};
        types.forEach((t, index) => {
          newMasterData[t] = results[index] || [];
        });
        setMasterData(prev => ({ ...prev, ...newMasterData }));

        // Load existing saved preferences from API
        const token = getToken();
        if (token) {
          const profileRes = await fetchProfileDetailsApi(0, token);
          if (profileRes.success && profileRes.data) {
            const p = profileRes.data.profile || profileRes.data.Profile || profileRes.data;
            if (p) {
              setPhotoPrivacy(p.photoPrivacy || p.PhotoPrivacy || 'All Members');
              setIsAccountPaused(p.accountState === 'Paused' || p.accountState === 'Deactivated');
              const hasPhotos = Boolean(
                p.mainPhotoUrl || p.photoUrl || p.PhotoUrl || 
                (Array.isArray(profileRes.data.gallery) && profileRes.data.gallery.length > 0) ||
                (Array.isArray(p.userPhotos) && p.userPhotos.length > 0) ||
                Number(p.photosCount || 0) > 0
              );
              setHasUserPhoto(hasPhotos);
            }

            const pref = profileRes.data.preferences || profileRes.data.Preferences;
            if (pref && typeof pref === 'object') {
              const parseList = (val: any) => {
                if (!val) return [];
                if (Array.isArray(val)) return val.map(Number);
                return String(val).split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);
              };

              const parseStringList = (val: any) => {
                if (!val) return [];
                if (Array.isArray(val)) return val.map(String);
                return String(val).split(',').map(s => s.trim()).filter(Boolean);
              };

              const firstStateId = Number(pref.preferredStateID || pref.preferredState || 0);
              if (firstStateId > 0) {
                fetchCitiesApi(firstStateId).then(cities => {
                  if (isMounted) setMasterData(prev => ({ ...prev, CITIES: cities }));
                });
              }

              const parsedSectList = parseList(pref.preferredSect);
              const fallbackSect = Number(pref.preferredSect || 1);

              setPrefData({
                minAge: pref.minAge || 18,
                maxAge: pref.maxAge || 60,
                minHeight: pref.minHeight ? String(pref.minHeight) : '4.5',
                maxHeight: pref.maxHeight ? String(pref.maxHeight) : '6.8',
                maritalStatusList: parseList(pref.preferredMaritalStatus),
                educationIds: parseList(pref.preferredEducation),
                occupationIds: parseList(pref.preferredOccupation),
                casteIds: parseList(pref.preferredCaste),
                languageIds: parseList(pref.preferredMotherTongue),
                sectIds: parsedSectList.length > 0 ? parsedSectList : (fallbackSect > 0 && pref.preferredSect ? [fallbackSect] : []),
                stateId: firstStateId,
                cityId: Number(pref.preferredCityID || pref.preferredCity || 0),
                namazHabits: parseStringList(pref.preferredNamazHabit || pref.namazHabit),
                hijabOrBeard: parseStringList(pref.preferredHijabOrBeard || pref.hijabOrBeard)
              });
            }
          }
        }
      } catch (e) {}
    };

    loadMastersAndPref();
    return () => { isMounted = false; };
  }, [activeTab, getToken]);

  // Load Blocked Users when Privacy tab -> Blocked subtab is active
  useEffect(() => {
    if (activeTab !== 'privacy' || privacySubTab !== 'blocked') return;
    const token = getToken();
    if (!token) return;

    setLoadingBlockedUsers(true);
    fetchBlockedUsersApi(token).then((res) => {
      setBlockedUsers(res.data || []);
      setLoadingBlockedUsers(false);
    });
  }, [activeTab, privacySubTab, getToken]);

  // Fetch Cities when State changes
  useEffect(() => {
    if (prefData.stateId > 0) {
      fetchCitiesApi(prefData.stateId).then(cities => setMasterData(prev => ({ ...prev, CITIES: cities })));
    }
  }, [prefData.stateId]);

  const updatePrefField = (field: string, val: any) => {
    setPrefData((prev: any) => ({ ...prev, [field]: val }));
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("user_notif_prefs", JSON.stringify({ emailNotif, appNotif, matchAlerts }));
    }
    setTimeout(() => {
      setLoading(false);
      toast.success("Notification preferences updated successfully!");
    }, 400);
  };

  const handleSavePartnerPreferences = async () => {
    const token = getToken();
    if (!token) return;

    setSavingPref(true);

    let currentUserId = 0;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user_details") || localStorage.getItem("user_session");
        if (stored) {
          const u = JSON.parse(stored);
          currentUserId = u.userId || u.UserId || u.id || 0;
        }
      } catch (e) {}
    }

    const cleanArr = (arr: any) => {
      if (!arr) return '';
      if (Array.isArray(arr)) return arr.filter(Boolean).join(',');
      return String(arr).trim();
    };

    const prefPayload = {
      userId: currentUserId,
      minAge: Number(prefData.minAge || 18),
      maxAge: Number(prefData.maxAge || 60),
      minHeight: parseFloat(prefData.minHeight || '4.0'),
      maxHeight: parseFloat(prefData.maxHeight || '7.0'),
      preferredSect: cleanArr(prefData.sectIds) || (prefData.sectId ? String(prefData.sectId) : ''),
      preferredStateID: prefData.stateId ? String(prefData.stateId) : '',
      preferredCityID: prefData.cityId ? String(prefData.cityId) : '',
      preferredEducation: cleanArr(prefData.educationIds) || '',
      preferredOccupation: cleanArr(prefData.occupationIds) || '',
      minAnnualIncome: 0,
      preferredMaritalStatus: cleanArr(prefData.maritalStatusList) || '',
      preferredMotherTongue: cleanArr(prefData.languageIds) || '',
      preferredCaste: cleanArr(prefData.casteIds) || '',
      preferredNamazHabit: cleanArr(prefData.namazHabits) || '',
      preferredHijabOrBeard: cleanArr(prefData.hijabOrBeard) || ''
    };

    const res = await savePartnerPreferencesApi(prefPayload, token);
    setSavingPref(false);
    if (res.success) {
      toast.success("Partner preferences saved successfully!");
    } else {
      toast.error(res.message || "Failed to save preferences.");
    }
  };

  const handleSavePhotoPrivacy = async () => {
    const token = getToken();
    setSavingPhotoPrivacy(true);
    const res = await updatePhotoPrivacyApiCall(photoPrivacy, token);
    setSavingPhotoPrivacy(false);
    if (res.success) {
      toast.success("Photo privacy settings updated successfully!");
    } else {
      toast.error(res.message || "Failed to update photo privacy.");
    }
  };

  const handleUnblockUser = async (targetUserId: number) => {
    const token = getToken();
    setUnblockingUserId(targetUserId);
    const res = await unblockUserApiCall(targetUserId, token);
    setUnblockingUserId(null);

    if (res.success) {
      setBlockedUsers(prev => prev.filter(u => (u.userId ?? u.UserId) !== targetUserId));
      toast.success("User unblocked successfully!");
    } else {
      toast.error(res.message || "Failed to unblock user.");
    }
  };

  const handleConfirmPauseAccount = async () => {
    const token = getToken();
    const finalReason = pauseRemark.trim() ? `${pauseReason} - ${pauseRemark.trim()}` : pauseReason;
    setPausingLoading(true);
    const res = await deactivateAccountApi(finalReason, true, token);
    setPausingLoading(false);
    if (res.success) {
      setIsAccountPaused(true);
      setShowPauseModal(false);
      toast.success("Your profile is now paused. You can log back in anytime to reactivate.");
      handleLogout();
    } else {
      toast.error(res.message || "Failed to pause account.");
    }
  };

  const handleReactivateAccount = async () => {
    const token = getToken();
    setPausingLoading(true);
    const res = await deactivateAccountApi("Reactivated", false, token);
    setPausingLoading(false);
    if (res.success) {
      setIsAccountPaused(false);
      toast.success("Welcome back! Your profile is now active and visible to matches.");
    } else {
      toast.error(res.message || "Failed to reactivate account.");
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (deleteKeyword.trim().toUpperCase() !== 'DELETE') {
      toast.error("Please type DELETE to confirm permanent deletion.");
      return;
    }
    const token = getToken();
    const finalReason = deleteRemark.trim() ? `${deleteReason} - ${deleteRemark.trim()}` : deleteReason;
    setDeletingLoading(true);
    const res = await deleteAccountApi(finalReason, token);
    setDeletingLoading(false);
    if (res.success) {
      toast.success("Account deleted permanently.");
      setShowDeleteModal(false);
      setTimeout(() => {
        handleLogout();
      }, 800);
    } else {
      toast.error(res.message || "Failed to delete account.");
    }
  };

  const PREFERENCE_ROWS = [
    { id: 'age', label: 'Age' },
    { id: 'maritalStatus', label: 'Marital Status' },
    { id: 'income', label: 'Annual Income' },
    { id: 'education', label: 'Education' },
    { id: 'occupation', label: 'Employed In' },
    { id: 'motherTongue', label: 'Mother Tongue' },
    { id: 'sect', label: 'Sect' },
    { id: 'caste', label: 'Caste' },
    { id: 'height', label: 'Height' },
    { id: 'state', label: 'State' },
    { id: 'city', label: 'City' },
    { id: 'namaz', label: 'Namaz Habit' },
    { id: 'hijab', label: 'Hijab / Beard' },
  ];

  const getSheetTitle = (id: string | null) => {
    switch (id) {
      case 'age': return 'Select Age';
      case 'maritalStatus': return 'Select Marital Status';
      case 'income': return 'Select Annual Income';
      case 'education': return 'Select Education';
      case 'occupation': return 'Select Employed In';
      case 'motherTongue': return 'Select Mother Tongue';
      case 'sect': return 'Select Sect';
      case 'caste': return 'Select Caste';
      case 'height': return 'Select Height';
      case 'state': return 'Select State';
      case 'city': return 'Select City';
      case 'namaz': return 'Select Namaz Habit';
      case 'hijab': return 'Select Hijab / Beard Preference';
      default: return 'Select Option';
    }
  };

  const renderMultiSelectSheet = (fieldKey: string, options: MasterOption[], showSearch: boolean = false) => {
    const selectedList: any[] = Array.isArray(prefData[fieldKey]) ? prefData[fieldKey] : [];
    const selectedOptions = options.filter((o) => selectedList.some((s) => String(s) === String(o.id || o.value)));
    const filteredOptions = showSearch && sheetSearch.trim()
      ? options.filter((o) => o.value.toLowerCase().includes(sheetSearch.toLowerCase().trim()))
      : options;

    return (
      <div className="space-y-3">
        {/* Selected Chips Row (Screenshot 2) */}
        {selectedOptions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100">
            {selectedOptions.slice(0, 3).map((opt) => (
              <span
                key={opt.id || opt.value}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#d91b5c] text-slate-800 bg-rose-50/30 text-xs font-semibold"
              >
                <span>{opt.value}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(fieldKey, opt.id || opt.value);
                  }}
                  className="hover:text-[#d91b5c] cursor-pointer"
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              </span>
            ))}
            {selectedOptions.length > 3 && (
              <span className="text-xs font-bold text-[#d91b5c]">
                +{selectedOptions.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Search Input for long lists */}
        {showSearch && (
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={sheetSearch}
              onChange={(e) => setSheetSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#d91b5c]"
            />
          </div>
        )}

        {/* Checkbox Rows (Screenshots 2 & 3) */}
        <div className="space-y-0.5 divide-y divide-slate-100 max-h-[46vh] overflow-y-auto px-1">
          {filteredOptions.map((opt) => {
            const isChecked = selectedList.some((s) => String(s) === String(opt.id || opt.value));
            return (
              <div
                key={opt.id || opt.value}
                onClick={() => toggleOption(fieldKey, opt.id || opt.value)}
                className="flex items-center justify-between py-3.5 px-2 cursor-pointer hover:bg-slate-50 rounded-xl transition"
              >
                <span className={`text-sm ${isChecked ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                  {opt.value}
                </span>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition ${
                    isChecked
                      ? 'bg-[#d91b5c] text-white shadow-xs'
                      : 'border-2 border-slate-300'
                  }`}
                >
                  {isChecked && <Check size={14} strokeWidth={3} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSheetContent = () => {
    switch (activeSheet) {
      case 'age': {
        const minA = prefData.minAge || 18;
        const maxA = prefData.maxAge || 60;
        return (
          <div className="space-y-6 py-2">
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 space-y-4">
              <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                <span>Min yrs{minA}yrs</span>
                <span>Max yrs{maxA}yrs</span>
              </div>
              <DualRangeSlider
                min={18}
                max={70}
                minVal={minA}
                maxVal={maxA}
                minGap={1}
                onChange={(minVal, maxVal) => {
                  setPrefData((prev: any) => ({ ...prev, minAge: minVal, maxAge: maxVal }));
                }}
              />
            </div>
          </div>
        );
      }

      case 'height': {
        const minH = parseFloat(prefData.minHeight || '4.5') || 4.5;
        const maxH = parseFloat(prefData.maxHeight || '6.5') || 6.5;
        return (
          <div className="space-y-6 py-2">
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 space-y-4">
              <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                <span>Min height {minH.toFixed(1)} ft</span>
                <span>Max height {maxH.toFixed(1)} ft</span>
              </div>
              <DualRangeSlider
                min={4.0}
                max={7.5}
                step={0.1}
                minVal={minH}
                maxVal={maxH}
                minGap={0.1}
                onChange={(minVal, maxVal) => {
                  setPrefData((prev: any) => ({
                    ...prev,
                    minHeight: minVal.toFixed(1),
                    maxHeight: maxVal.toFixed(1),
                  }));
                }}
              />
            </div>
          </div>
        );
      }

      case 'maritalStatus':
        return renderMultiSelectSheet('maritalStatusList', masterData.MARITAL_STATUS || [], false);

      case 'income': {
        const currentVal = prefData.incomeLabel || 'Any Income';
        return (
          <div className="space-y-0.5 divide-y divide-slate-100 max-h-[50vh] overflow-y-auto px-1">
            {PREF_INCOME_OPTIONS.map((opt) => {
              const isSelected = currentVal === opt.value;
              return (
                <div
                  key={opt.id}
                  onClick={() => updatePrefField('incomeLabel', opt.value)}
                  className="flex items-center justify-between py-3.5 px-2 cursor-pointer hover:bg-slate-50 rounded-xl transition"
                >
                  <span className={`text-sm ${isSelected ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                    {opt.value}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition ${
                      isSelected
                        ? 'bg-[#d91b5c] text-white shadow-xs'
                        : 'border-2 border-slate-300'
                    }`}
                  >
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'education':
        return renderMultiSelectSheet('educationIds', masterData.EDUCATIONS || [], true);

      case 'occupation':
        return renderMultiSelectSheet('occupationIds', masterData.OCCUPATIONS || [], true);

      case 'motherTongue':
        return renderMultiSelectSheet('languageIds', masterData.MOTHER_TONGUES || [], true);

      case 'sect':
        return renderMultiSelectSheet('sectIds', masterData.SECTS || [], false);

      case 'caste':
        return renderMultiSelectSheet('casteIds', masterData.CASTES || [], true);

      case 'state': {
        const filteredStates = (masterData.STATES || []).filter((s) =>
          s.value.toLowerCase().includes(sheetSearch.toLowerCase().trim())
        );
        return (
          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={sheetSearch}
                onChange={(e) => setSheetSearch(e.target.value)}
                placeholder="Search state..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#d91b5c]"
              />
            </div>
            <div className="space-y-0.5 divide-y divide-slate-100 max-h-[48vh] overflow-y-auto px-1">
              <div
                onClick={() => {
                  updatePrefField('stateId', 0);
                  updatePrefField('cityId', 0);
                }}
                className="flex items-center justify-between py-3 px-2 cursor-pointer hover:bg-slate-50 rounded-xl"
              >
                <span className={`text-sm ${!prefData.stateId ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                  Any State / Pan India
                </span>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${!prefData.stateId ? 'bg-[#d91b5c] text-white' : 'border-2 border-slate-300'}`}>
                  {!prefData.stateId && <Check size={14} strokeWidth={3} />}
                </div>
              </div>
              {filteredStates.map((s) => {
                const isSelected = Number(prefData.stateId) === Number(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      updatePrefField('stateId', Number(s.id));
                      updatePrefField('cityId', 0);
                    }}
                    className="flex items-center justify-between py-3 px-2 cursor-pointer hover:bg-slate-50 rounded-xl"
                  >
                    <span className={`text-sm ${isSelected ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {s.value}
                    </span>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center ${isSelected ? 'bg-[#d91b5c] text-white' : 'border-2 border-slate-300'}`}>
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'city': {
        const availableCities = (masterData.CITIES || []).filter((c) =>
          c.value.toLowerCase().includes(sheetSearch.toLowerCase().trim())
        );
        return (
          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={sheetSearch}
                onChange={(e) => setSheetSearch(e.target.value)}
                placeholder="Search city..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#d91b5c]"
              />
            </div>
            <div className="space-y-0.5 divide-y divide-slate-100 max-h-[48vh] overflow-y-auto px-1">
              <div
                onClick={() => updatePrefField('cityId', 0)}
                className="flex items-center justify-between py-3 px-2 cursor-pointer hover:bg-slate-50 rounded-xl"
              >
                <span className={`text-sm ${!prefData.cityId ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                  Any City
                </span>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${!prefData.cityId ? 'bg-[#d91b5c] text-white' : 'border-2 border-slate-300'}`}>
                  {!prefData.cityId && <Check size={14} strokeWidth={3} />}
                </div>
              </div>
              {availableCities.map((c) => {
                const isSelected = Number(prefData.cityId) === Number(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => updatePrefField('cityId', Number(c.id))}
                    className="flex items-center justify-between py-3 px-2 cursor-pointer hover:bg-slate-50 rounded-xl"
                  >
                    <span className={`text-sm ${isSelected ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {c.value}
                    </span>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center ${isSelected ? 'bg-[#d91b5c] text-white' : 'border-2 border-slate-300'}`}>
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'namaz':
        return renderMultiSelectSheet('namazHabits', PREF_NAMAZ_OPTIONS, false);

      case 'hijab':
        return renderMultiSelectSheet('hijabOrBeard', PREF_HIJAB_BEARD_OPTIONS, false);

      default:
        return null;
    }
  };

  const getSubTitle = () => {
    switch (activeTab) {
      case 'notifications': return "Notification Preferences";
      case 'preferences': return "Partner Preference";
      case 'privacy': return "Privacy & Blocked Users";
      case 'manage': return "Account Visibility & Security";
      default: return "Account Settings";
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-28 pt-3 sm:pt-5 selection:bg-[#d91b5c] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      {/* 🏷️ TOP NAVIGATION BAR (100% FIXED AT TOP) */}
      <div className="fixed top-0 lg:top-20 inset-x-0 z-40 bg-white py-2.5 px-4 sm:px-6 border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-xl mx-auto flex items-center gap-2.5">
          <button 
            type="button" 
            onClick={() => {
              const urlTab = searchParams.get('tab');
              if (activeTab !== 'menu' && !urlTab) {
                setActiveTab('menu');
              } else {
                if (typeof window !== "undefined") {
                  const last = sessionStorage.getItem('last_browse_page');
                  if (last && !last.startsWith('/dashboard/settings')) {
                    router.push(last);
                    return;
                  }
                  if (window.history.length > 1) {
                    router.back();
                    return;
                  }
                }
                router.push('/dashboard/my-profile');
              }
            }} 
            className="w-9 h-9 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
            aria-label="Back"
            title="Go Back"
          >
            <ChevronLeft size={20} className="stroke-[2.5]" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
              {getSubTitle()}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 sm:px-6 space-y-4 pt-14 lg:pt-20">

        {/* 📱 1. MAIN MENU SCREEN */}
        {activeTab === 'menu' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-1">
            
            {/* PAUSED WARNING BANNER IF PAUSED */}
            {isAccountPaused && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 space-y-2 shadow-xs">
                <div className="flex items-center gap-2 text-amber-800">
                  <PauseCircle size={18} className="text-amber-600 shrink-0" />
                  <h3 className="font-bold text-xs uppercase tracking-wide">Your Profile is Currently Paused</h3>
                </div>
                <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                  Your profile is hidden from searches and recommendations. You can reactivate anytime!
                </p>
                <button
                  type="button"
                  onClick={handleReactivateAccount}
                  disabled={pausingLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {pausingLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Reactivate Profile Now</span>
                </button>
              </div>
            )}

            {/* VIP ELEGANT MENU OPTIONS LIST */}
            <div className="bg-white rounded-3xl p-2 sm:p-3 border border-slate-100 shadow-sm space-y-1">
              
              {/* OPTION 1: NOTIFICATION SETTINGS */}
              <div 
                onClick={() => setActiveTab('notifications')}
                className="p-3.5 hover:bg-rose-50/40 rounded-2xl flex items-center justify-between cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#d91b5c] border border-rose-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Bell size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 group-hover:text-[#d91b5c] transition-colors">
                      Notification Preferences
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Configure instant push alerts and email updates
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400 group-hover:text-[#d91b5c] group-hover:translate-x-1 transition-all shrink-0" />
              </div>

              {/* OPTION 2: PARTNER PREFERENCES */}
              <div 
                onClick={() => setActiveTab('preferences')}
                className="p-3.5 hover:bg-rose-50/40 rounded-2xl flex items-center justify-between cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#d91b5c] border border-rose-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Heart size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 group-hover:text-[#d91b5c] transition-colors">
                      Partner Preferences
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Set criteria for your ideal life partner
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400 group-hover:text-[#d91b5c] group-hover:translate-x-1 transition-all shrink-0" />
              </div>

              {/* OPTION 3: PRIVACY & BLOCKED USERS */}
              <div 
                onClick={() => setActiveTab('privacy')}
                className="p-3.5 hover:bg-rose-50/40 rounded-2xl flex items-center justify-between cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#d91b5c] border border-rose-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Shield size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 group-hover:text-[#d91b5c] transition-colors">
                      Privacy & Blocked Users
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Control photo visibility & unblock members
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400 group-hover:text-[#d91b5c] group-hover:translate-x-1 transition-all shrink-0" />
              </div>

              {/* OPTION 4: MANAGE ACCOUNT (PAUSE / DELETE) */}
              <div 
                onClick={() => setActiveTab('manage')}
                className="p-3.5 hover:bg-rose-50/40 rounded-2xl flex items-center justify-between cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Power size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 group-hover:text-[#d91b5c] transition-colors">
                      Account Visibility & Security
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Temporarily pause visibility or delete account
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400 group-hover:text-[#d91b5c] group-hover:translate-x-1 transition-all shrink-0" />
              </div>

            </div>

            {/* 🚪 BOTTOM CLEAN LOGOUT BUTTON */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3 px-5 rounded-2xl bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs uppercase tracking-wider border border-rose-200/80 shadow-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut size={16} className="text-rose-600" />
                <span>Sign Out</span>
              </button>
            </div>

          </motion.div>
        )}

        {/* 🔔 2. NOTIFICATION SETTINGS SUB-SCREEN */}
        {activeTab === 'notifications' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-1">
            
            <div className="space-y-2.5">
              <LuxuryToggle 
                label="Email Notifications" 
                description="Receive interest alerts and proposal messages on your email"
                checked={emailNotif} 
                onChange={setEmailNotif} 
              />

              <LuxuryToggle 
                label="App Push & Chat Alerts" 
                description="Get instant alerts on real-time messages and profile views"
                checked={appNotif} 
                onChange={setAppNotif} 
              />

              <LuxuryToggle 
                label="Daily Match Recommendations" 
                description="Receive curated daily profiles matching your religious & lifestyle criteria"
                checked={matchAlerts} 
                onChange={setMatchAlerts} 
              />
            </div>

            <button 
              type="button" 
              onClick={handleSaveNotifications}
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-[#d91b5c] hover:bg-[#c21852] text-white font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              <span>Save Preferences</span>
            </button>
          </motion.div>
        )}

        {/* 💖 3. PARTNER PREFERENCES SUB-SCREEN (Matching App Screenshots 1, 2, 3, 4, 5) */}
        {activeTab === 'preferences' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            
            {/* Divided List Container (Screenshot 4) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {PREFERENCE_ROWS.map((row) => {
                const summary = getSummaryText(row.id);
                return (
                  <div
                    key={row.id}
                    onClick={() => {
                      setSheetSearch('');
                      setActiveSheet(row.id);
                    }}
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50/70 transition-colors group"
                  >
                    <span className="text-sm font-bold text-slate-800 group-hover:text-[#d91b5c] transition-colors">
                      {row.label}
                    </span>
                    <div className="flex items-center gap-2 max-w-[55%]">
                      <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-600 truncate text-right">
                        {summary}
                      </span>
                      <ChevronRight size={18} className="text-slate-400 group-hover:text-[#d91b5c] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save Preferences Button */}
            <button 
              type="button" 
              onClick={handleSavePartnerPreferences}
              disabled={savingPref}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#E21E5B] to-[#C2185B] text-white font-bold text-sm tracking-wide shadow-md hover:opacity-95 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 transition"
            >
              {savingPref ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>Save Partner Preferences</span>
            </button>
          </motion.div>
        )}

        {/* 🛡️ 4. PRIVACY & BLOCKED USERS SUB-SCREEN */}
        {activeTab === 'privacy' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-1">
            
            {/* SUB-TABS PILLS: PHOTO PRIVACY / BLOCKED USERS */}
            <div className="flex items-center bg-slate-200/70 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setPrivacySubTab('photo')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  privacySubTab === 'photo'
                    ? 'bg-white text-[#d91b5c] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye size={15} />
                <span>Photo Privacy</span>
              </button>

              <button
                type="button"
                onClick={() => setPrivacySubTab('blocked')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  privacySubTab === 'blocked'
                    ? 'bg-white text-[#d91b5c] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserX size={15} />
                <span>Blocked ({blockedUsers.length})</span>
              </button>
            </div>

            {/* 📸 SUB-TAB 1: PHOTO PRIVACY */}
            {privacySubTab === 'photo' && (
              !hasUserPhoto ? (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-rose-50 text-[#d91b5c] flex items-center justify-center mx-auto">
                    <Eye size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">No Profile Photos Uploaded</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Photo privacy controls will automatically become active once you upload at least one profile photo.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/gallery')}
                    className="py-2.5 px-6 rounded-full bg-[#d91b5c] hover:bg-[#c21852] text-white font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer transition-all"
                  >
                    Upload Photo Now
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm space-y-3">
                  <div className="space-y-2.5">
                    {(masterData.PHOTO_PRIVACY && masterData.PHOTO_PRIVACY.length > 0 
                      ? masterData.PHOTO_PRIVACY.map(opt => ({
                          id: opt.id || opt.value,
                          title: opt.value || opt.id,
                          desc: opt.description || (opt.id === 'All Members' ? 'Sabhi verified members dekh sakte hain.' : opt.id === 'Premium Only' ? 'Sirf serious active VIP rishte dekh sakte hain.' : 'Sirf aapki ijazat ke baad hi photo dikhegi.')
                        }))
                      : [
                          { id: "All Members", title: "Visible to All", desc: "Sabhi verified members dekh sakte hain (Recommended for faster proposals)." },
                          { id: "Premium Only", title: "VIP Only", desc: "Sirf serious active VIP rishte dekh sakte hain." },
                          { id: "Only Approved", title: "Parda Mode", desc: "Sirf aapki ijazat ke baad hi photo dikhegi." }
                        ]
                    ).map((option) => (
                      <div 
                        key={option.id}
                        onClick={() => setPhotoPrivacy(option.id)}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          photoPrivacy === option.id 
                            ? 'bg-rose-50/50 border-[#d91b5c] ring-1 ring-[#d91b5c]' 
                            : 'bg-white border-slate-200 hover:border-rose-200'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="photoPrivacy" 
                          value={option.id} 
                          checked={photoPrivacy === option.id}
                          onChange={() => setPhotoPrivacy(option.id)}
                          className="mt-0.5 w-4 h-4 accent-[#d91b5c] cursor-pointer shrink-0" 
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{option.title}</h4>
                          <p className="text-[11px] font-medium text-slate-500 mt-0.5 leading-relaxed">{option.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    type="button" 
                    onClick={handleSavePhotoPrivacy}
                    disabled={savingPhotoPrivacy}
                    className="w-full py-3 rounded-2xl bg-[#d91b5c] hover:bg-[#c21852] text-white font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer flex items-center justify-center gap-2 transition-colors"
                  >
                    {savingPhotoPrivacy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    <span>Save Photo Privacy</span>
                  </button>
                </div>
              )
            )}

            {/* 🚫 SUB-TAB 2: BLOCKED USERS */}
            {privacySubTab === 'blocked' && (
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm space-y-3">
                {loadingBlockedUsers ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-2xl shimmer-luxury h-16" />
                    ))}
                  </div>
                ) : blockedUsers.length === 0 ? (
                  <div className="p-6 text-center space-y-2">
                    <div className="w-12 h-12 bg-rose-50 text-[#d91b5c] rounded-full flex items-center justify-center mx-auto border border-rose-100">
                      <UserX size={22} />
                    </div>
                    <h4 className="font-bold text-xs text-slate-800">No Blocked Members</h4>
                    <p className="text-[11px] font-medium text-slate-500 max-w-xs mx-auto">
                      You haven't blocked any members. Users you block in chats or profiles appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {blockedUsers.map((user) => {
                      const uId = user.userId ?? user.UserId;
                      const uName = user.fullName ?? user.FullName ?? `Member #${uId}`;
                      const uPhoto = user.photoUrl ?? user.PhotoUrl;
                      const isUnblocking = unblockingUserId === uId;

                      return (
                        <div 
                          key={uId} 
                          className="p-3 bg-slate-50/60 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden shrink-0">
                              {uPhoto ? (
                                <img src={uPhoto} alt={uName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-600">
                                  {uName.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{uName}</h4>
                              <span className="text-[10px] text-rose-600 font-semibold block">Blocked</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleUnblockUser(uId)}
                            disabled={isUnblocking}
                            className="px-3 py-1.5 bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-[11px] rounded-xl border border-slate-200 cursor-pointer flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                          >
                            {isUnblocking ? <Loader2 size={12} className="animate-spin" /> : <Unlock size={12} />}
                            <span>Unblock</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </motion.div>
        )}

        {/* ⚙️ 5. MANAGE ACCOUNT SUB-SCREEN (Clean App-Style Grouped Card) */}
        {activeTab === 'manage' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-1">
            
            {/* Informational Header Note */}
            <p className="text-xs text-slate-500 font-medium px-1">
              Control your account visibility or permanently remove your profile from Nikah Qubool.
            </p>

            {/* Divided App-Style List Container */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
              
              {/* ROW 1: PAUSE / REACTIVATE PROFILE */}
              <div
                onClick={() => {
                  if (isAccountPaused) {
                    handleReactivateAccount();
                  } else {
                    setShowPauseModal(true);
                  }
                }}
                className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50/70 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    isAccountPaused
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-600 border border-amber-200/80'
                  }`}>
                    <PauseCircle size={22} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                        Temporarily Pause Profile
                      </h4>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isAccountPaused 
                          ? 'bg-amber-100 text-amber-800 border-amber-300' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {isAccountPaused ? 'Paused' : 'Active'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {isAccountPaused 
                        ? 'Profile is currently hidden. Click to reactivate.' 
                        : 'Temporarily hide from searches & daily recommendations'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {pausingLoading && <Loader2 size={16} className="animate-spin text-amber-600" />}
                  <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 group-hover:text-amber-600 transition-all" />
                </div>
              </div>

              {/* ROW 2: PERMANENTLY DELETE ACCOUNT */}
              <div
                onClick={() => {
                  setDeleteStep(1);
                  setDeleteConfirmedCheck(false);
                  setDeleteKeyword("");
                  setShowDeleteModal(true);
                }}
                className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-rose-50/40 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                    <Trash2 size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
                      Permanently Delete Account
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      Irreversible removal of matches, verified photos & profile data
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-bold text-rose-600 hidden sm:inline">Delete</span>
                  <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 group-hover:text-rose-600 transition-all" />
                </div>
              </div>

            </div>

          </motion.div>
        )}

      </div>

      {/* ⏸️ VIP DEACTIVATE / PAUSE PROFILE MODAL */}
      <AnimatePresence>
        {showPauseModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 text-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                  <PauseCircle size={18} />
                  <span>Pause Profile Visibility</span>
                </div>
                <button onClick={() => setShowPauseModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">✕</button>
              </div>

              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Your profile will be hidden from all candidate searches and daily recommendations. Your data and photos remain safe, and you can log back in anytime to reactivate instantly.
              </p>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Select Reason</label>
                {[
                  "Found my life partner on Nikah Qubool 💖",
                  "Found partner through family / friends",
                  "Taking a temporary break / busy",
                  "Privacy or personal reasons",
                  "Other reason"
                ].map((reason) => (
                  <label key={reason} className="flex items-center gap-2.5 p-2.5 bg-slate-50 hover:bg-rose-50/40 rounded-xl border border-slate-200 cursor-pointer transition-colors text-xs font-semibold text-slate-800">
                    <input 
                      type="radio" 
                      name="pauseReason" 
                      value={reason} 
                      checked={pauseReason === reason} 
                      onChange={(e) => setPauseReason(e.target.value)} 
                      className="w-3.5 h-3.5 accent-[#d91b5c]"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Remarks / Feedback (Optional)</label>
                <textarea
                  value={pauseRemark}
                  onChange={(e) => setPauseRemark(e.target.value)}
                  placeholder="Share a thought, blessing or suggestion..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#d91b5c]"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPauseModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Keep Profile Active
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPauseAccount}
                  disabled={pausingLoading}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {pausingLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                  <span>Confirm Pause</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🗑️ VIP MULTI-STEP ACCOUNT DELETION MODAL */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-rose-100 text-slate-800 space-y-4"
            >
              {/* STEP 1: REASON & WARNING */}
              {deleteStep === 1 && (
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                      <AlertTriangle size={18} />
                      <span>Permanent Account Deletion (Step 1/2)</span>
                    </div>
                    <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">✕</button>
                  </div>

                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                    <h5 className="text-[11px] font-bold text-rose-900">What happens when you delete:</h5>
                    <p className="text-[10px] text-rose-700 font-medium leading-relaxed">
                      All your photos, matches, proposal interests, and chat records will be permanently erased. This cannot be undone.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Why are you leaving?</label>
                    {[
                      "Found my life partner on Nikah Qubool 💖",
                      "Found partner through family / other sources",
                      "Not getting relevant matches in my area",
                      "Privacy or security concerns",
                      "Other feedback"
                    ].map((reason) => (
                      <label key={reason} className="flex items-center gap-2.5 p-2.5 bg-slate-50 hover:bg-rose-50/40 rounded-xl border border-slate-200 cursor-pointer transition-colors text-xs font-semibold text-slate-800">
                        <input 
                          type="radio" 
                          name="deleteReason" 
                          value={reason} 
                          checked={deleteReason === reason} 
                          onChange={(e) => setDeleteReason(e.target.value)} 
                          className="w-3.5 h-3.5 accent-[#d91b5c]"
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Remarks / Suggestions (Optional)</label>
                    <textarea
                      value={deleteRemark}
                      onChange={(e) => setDeleteRemark(e.target.value)}
                      placeholder="Tell us what we could improve..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#d91b5c]"
                      rows={2}
                    />
                  </div>

                  <label className="flex items-start gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deleteConfirmedCheck}
                      onChange={(e) => setDeleteConfirmedCheck(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-[#d91b5c] cursor-pointer"
                    />
                    <span className="text-[11px] font-medium text-slate-600">
                      I understand that this action is irreversible and all my matrimonial data will be permanently deleted.
                    </span>
                  </label>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!deleteConfirmedCheck}
                      onClick={() => setDeleteStep(2)}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-40"
                    >
                      <span>Proceed to Confirm</span>
                    </button>
                  </div>
                </>
              )}

              {/* STEP 2: SECURITY CONFIRMATION GUARD */}
              {deleteStep === 2 && (
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                      <AlertTriangle size={18} />
                      <span>Final Security Confirmation (Step 2/2)</span>
                    </div>
                    <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">✕</button>
                  </div>

                  <div className="text-center space-y-2 py-2">
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
                      <Trash2 size={22} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">Are you absolutely sure?</h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      To permanently delete your Nikah Qubool account, please type <strong className="text-rose-600 font-bold">DELETE</strong> below:
                    </p>
                  </div>

                  <input
                    type="text"
                    value={deleteKeyword}
                    onChange={(e) => setDeleteKeyword(e.target.value)}
                    placeholder="Type DELETE"
                    className="w-full text-center tracking-widest font-bold uppercase p-2.5 bg-slate-50 border-2 border-rose-200 rounded-xl text-xs text-rose-700 focus:outline-none focus:border-rose-500"
                  />

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setDeleteStep(1)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={deleteKeyword.trim().toUpperCase() !== 'DELETE' || deletingLoading}
                      onClick={handleConfirmDeleteAccount}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-40"
                    >
                      {deletingLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      <span>Delete Account Forever</span>
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📋 PARTNER PREFERENCE BOTTOM SHEET DIALOG (Matching App Screenshots 1, 2, 3, 4, 5) */}
      <AnimatePresence>
        {activeSheet && (
          <div className="fixed inset-0 z-[10000] flex flex-col justify-end bg-black/60 backdrop-blur-xs">
            {/* Backdrop click to close */}
            <div 
              className="absolute inset-0 -z-10" 
              onClick={() => setActiveSheet(null)} 
            />

            {/* Floating Close Button Centered Directly Above Sheet (Screenshots 2, 3, 5) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex justify-center mb-3 pointer-events-auto"
            >
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-slate-800 shadow-2xl hover:scale-105 active:scale-95 transition cursor-pointer"
                aria-label="Close"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </motion.div>

            {/* Slide-Up Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="bg-white rounded-t-[32px] w-full max-w-lg mx-auto p-5 sm:p-6 shadow-2xl max-h-[82vh] flex flex-col relative z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sheet Title */}
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 shrink-0">
                {getSheetTitle(activeSheet)}
              </h3>

              {/* Dynamic Content */}
              <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                {renderSheetContent()}
              </div>

              {/* Full-width Done Button (Pink Pill - Screenshots 2, 3, 5) */}
              <div className="pt-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveSheet(null)}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#E21E5B] to-[#C2185B] text-white font-bold text-sm tracking-wide shadow-md hover:opacity-95 active:scale-[0.99] transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#d91b5c]" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
