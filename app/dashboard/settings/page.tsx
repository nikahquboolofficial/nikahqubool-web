"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { 
  Bell, Heart, ArrowLeft, Check, Save, 
  PauseCircle, Trash2, Power, Loader2, ChevronRight, 
  LogOut, AlertTriangle, Eye, UserX, Unlock, Shield,
  SlidersHorizontal, CheckCircle2, Info, Sparkles
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
    namazHabits: [],
    hijabOrBeard: []
  });

  const [masterData, setMasterData] = useState<{ [key: string]: MasterOption[] }>({});

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
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams, router]);

  // Load Master Data & Existing Partner Preferences when tab is opened
  useEffect(() => {
    if (activeTab !== 'preferences') return;
    let isMounted = true;

    const loadMastersAndPref = async () => {
      const types = ['MARITAL_STATUS', 'SECTS', 'MOTHER_TONGUES', 'EDUCATIONS', 'OCCUPATIONS', 'CASTES', 'STATES'];
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

  const getSubTitle = () => {
    switch (activeTab) {
      case 'notifications': return "Notification Preferences";
      case 'preferences': return "Partner Preferences";
      case 'privacy': return "Privacy & Blocked Users";
      case 'manage': return "Account Visibility & Security";
      default: return "Account Settings";
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] font-sans text-slate-900 pb-28 pt-3 sm:pt-5 selection:bg-[#d91b5c] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      <div className="max-w-xl mx-auto px-4 sm:px-6 space-y-4">
        
        {/* 🏷️ TOP NAVIGATION BAR */}
        <div className="flex items-center gap-3 py-1 border-b border-rose-100/70">
          <button 
            type="button" 
            onClick={() => {
              if (activeTab !== 'menu') {
                setActiveTab('menu');
              } else {
                router.push('/dashboard/my-profile');
              }
            }} 
            className="flex p-2 hover:bg-rose-50 text-[#d91b5c] rounded-full transition-colors cursor-pointer"
            aria-label="Back"
            title="Go Back"
          >
            <ArrowLeft size={20} className="stroke-[2.5]" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              {getSubTitle()}
            </h1>
            <p className="text-[11px] font-semibold text-slate-500">
              Manage your notifications, match preferences and account privacy
            </p>
          </div>
        </div>

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

        {/* 💖 3. PARTNER PREFERENCES SUB-SCREEN */}
        {activeTab === 'preferences' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm space-y-4">
            
            <div className="space-y-3.5">
              {/* Age Range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Min Age (Years)</label>
                  <input
                    type="number"
                    min={18}
                    max={prefData.maxAge || 60}
                    value={prefData.minAge || 18}
                    onChange={(e) => updatePrefField('minAge', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-[#d91b5c]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Max Age (Years)</label>
                  <input
                    type="number"
                    min={prefData.minAge || 18}
                    max={75}
                    value={prefData.maxAge || 60}
                    onChange={(e) => updatePrefField('maxAge', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-[#d91b5c]"
                  />
                </div>
              </div>

              {/* Height Range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Min Height (ft)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="4.0"
                    max={prefData.maxHeight || '7.0'}
                    value={prefData.minHeight || '4.5'}
                    onChange={(e) => updatePrefField('minHeight', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-[#d91b5c]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Max Height (ft)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={prefData.minHeight || '4.0'}
                    max="7.5"
                    value={prefData.maxHeight || '6.5'}
                    onChange={(e) => updatePrefField('maxHeight', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-[#d91b5c]"
                  />
                </div>
              </div>

              {/* Marital Status Multi-Select */}
              <MultiSelectDropdown
                label="Preferred Marital Status"
                options={masterData.MARITAL_STATUS || []}
                selectedIds={prefData.maritalStatusList || []}
                onChange={(ids) => updatePrefField('maritalStatusList', ids)}
                placeholder="Any Marital Status"
              />

              {/* Sect / Maslak Multi-Select */}
              <MultiSelectDropdown
                label="Preferred Sect / Maslak"
                options={masterData.SECTS || []}
                selectedIds={prefData.sectIds || []}
                onChange={(ids) => updatePrefField('sectIds', ids)}
                placeholder="Any Sect / Maslak"
              />

              {/* Caste Multi-Select */}
              <MultiSelectDropdown
                label="Preferred Caste / Community"
                options={masterData.CASTES || []}
                selectedIds={prefData.casteIds || []}
                onChange={(ids) => updatePrefField('casteIds', ids)}
                placeholder="Any Caste (Caste No Bar)"
              />

              {/* Mother Tongue Multi-Select */}
              <MultiSelectDropdown
                label="Preferred Mother Tongue"
                options={masterData.MOTHER_TONGUES || []}
                selectedIds={prefData.languageIds || []}
                onChange={(ids) => updatePrefField('languageIds', ids)}
                placeholder="Any Language"
              />

              {/* Education Multi-Select */}
              <MultiSelectDropdown
                label="Preferred Education"
                options={masterData.EDUCATIONS || []}
                selectedIds={prefData.educationIds || []}
                onChange={(ids) => updatePrefField('educationIds', ids)}
                placeholder="Any Education Level"
              />

              {/* Occupation Multi-Select */}
              <MultiSelectDropdown
                label="Preferred Occupation"
                options={masterData.OCCUPATIONS || []}
                selectedIds={prefData.occupationIds || []}
                onChange={(ids) => updatePrefField('occupationIds', ids)}
                placeholder="Any Profession"
              />

              {/* State & City Filter */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Preferred State</label>
                  <select
                    value={prefData.stateId || 0}
                    onChange={(e) => {
                      updatePrefField('stateId', Number(e.target.value));
                      updatePrefField('cityId', 0);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#d91b5c]"
                  >
                    <option value={0}>Any State / Pan India</option>
                    {(masterData.STATES || []).map((s) => (
                      <option key={s.id} value={s.id}>{s.value}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Preferred City</label>
                  <select
                    value={prefData.cityId || 0}
                    disabled={!prefData.stateId}
                    onChange={(e) => updatePrefField('cityId', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#d91b5c] disabled:opacity-50"
                  >
                    <option value={0}>Any City</option>
                    {(masterData.CITIES || []).map((c) => (
                      <option key={c.id} value={c.id}>{c.value}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Religious Expectations: Namaz Habits */}
              <MultiSelectDropdown
                label="Preferred Namaz Habit"
                options={PREF_NAMAZ_OPTIONS}
                selectedIds={prefData.namazHabits || []}
                onChange={(vals) => updatePrefField('namazHabits', vals)}
                placeholder="Any / Flexible"
              />

              {/* Religious Expectations: Hijab / Beard */}
              <MultiSelectDropdown
                label="Preferred Hijab / Beard"
                options={PREF_HIJAB_BEARD_OPTIONS}
                selectedIds={prefData.hijabOrBeard || []}
                onChange={(vals) => updatePrefField('hijabOrBeard', vals)}
                placeholder="Any / Open Minded"
              />
            </div>

            <button 
              type="button" 
              onClick={handleSavePartnerPreferences}
              disabled={savingPref}
              className="w-full py-3 rounded-2xl bg-[#d91b5c] hover:bg-[#c21852] text-white font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer flex items-center justify-center gap-2 transition-colors"
            >
              {savingPref ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
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
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm space-y-3">
                <div className="space-y-2.5">
                  {[
                    {
                      id: "All Members",
                      title: "All Members",
                      desc: "All verified candidates can view your photos (Recommended for 3x higher responses)."
                    },
                    {
                      id: "Premium Only",
                      title: "VIP / Premium Only",
                      desc: "Only active paid members can view your full profile photos."
                    },
                    {
                      id: "Only Approved",
                      title: "Only Approved Members",
                      desc: "Photos remain protected and require your explicit consent per member."
                    }
                  ].map((option) => (
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

        {/* ⚙️ 5. MANAGE ACCOUNT SUB-SCREEN (VIP HIGH-LEVEL) */}
        {activeTab === 'manage' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-1">
            
            {/* PAUSE ACCOUNT CARD - SOBER ELEGANT */}
            <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                    <PauseCircle size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">
                      Temporarily Pause Profile
                    </h4>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                      Hide your profile from searches and daily recommendations.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  type="button" 
                  onClick={() => {
                    if (isAccountPaused) {
                      handleReactivateAccount();
                    } else {
                      setShowPauseModal(true);
                    }
                  }} 
                  disabled={pausingLoading}
                  className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-all ${
                    isAccountPaused
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  {pausingLoading ? <Loader2 size={13} className="animate-spin" /> : null}
                  <span>{isAccountPaused ? 'Reactivate Profile' : 'Pause Profile'}</span>
                </button>
              </div>
            </div>

            {/* DELETE ACCOUNT CARD - SOBER ELEGANT */}
            <div className="p-4 bg-white rounded-3xl border border-rose-100 shadow-sm space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0">
                    <Trash2 size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-rose-950">
                      Permanently Delete Account
                    </h4>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                      Permanently delete your profile data, verified photos, and match history.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  type="button" 
                  onClick={() => {
                    setDeleteStep(1);
                    setDeleteConfirmedCheck(false);
                    setDeleteKeyword("");
                    setShowDeleteModal(true);
                  }} 
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl uppercase tracking-wider cursor-pointer border border-rose-200 transition-all"
                >
                  Request Account Deletion
                </button>
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

    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#d91b5c]" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
