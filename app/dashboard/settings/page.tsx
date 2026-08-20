"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { 
  Bell, Heart, ArrowLeft, Check, Save, 
  PauseCircle, Trash2, Power, Loader2, Sliders, ChevronRight, 
  LogOut, ShieldAlert, CheckCircle2, UserCheck, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import { 
  fetchMasterDataApi, fetchCitiesApi, savePartnerPreferencesApi,
  deactivateAccountApi, deleteAccountApi, MasterOption 
} from '@/lib/api';
import { CompactSelect, MultiSelectDropdown } from '@/components/profile/CompactSelect';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'menu';

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [loading, setLoading] = useState(false);
  const [savingPref, setSavingPref] = useState(false);

  // 1. Notification Settings State
  const [emailNotif, setEmailNotif] = useState(true);
  const [appNotif, setAppNotif] = useState(true);
  const [matchAlerts, setMatchAlerts] = useState(true);

  // 2. Partner Preferences State
  const [prefData, setPrefData] = useState<any>({
    minAge: 20, maxAge: 35,
    minHeight: '5.0', maxHeight: '6.2',
    maritalStatusList: [1],
    educationIds: [1],
    occupationIds: [1],
    casteIds: [1],
    languageIds: [1],
    sectId: 1,
    stateId: 0,
    cityId: 0
  });

  const [masterData, setMasterData] = useState<{ [key: string]: MasterOption[] }>({});

  // 3. Pause / Deactivate Modal State
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseReason, setPauseReason] = useState("Found my partner on Nikah Qubool");
  const [customReason, setCustomReason] = useState("");
  const [isAccountPaused, setIsAccountPaused] = useState(false);
  const [pausingLoading, setPausingLoading] = useState(false);

  // 4. Delete Account Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop()?.split(';').shift() ?? null : null;
  };

  const getToken = useCallback((): string | null => getCookie("user_token"), []);

  const handleLogout = useCallback(() => {
    document.cookie = "user_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }
    toast.success("Logged out successfully.");
    setTimeout(() => {
      router.push('/');
    }, 600);
  }, [router]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

  // Load Master Data only when Partner Preferences tab is opened
  useEffect(() => {
    if (activeTab !== 'preferences') return;
    let isMounted = true;

    const loadMasters = async () => {
      const types = ['MARITAL_STATUS', 'SECTS', 'MOTHER_TONGUES', 'EDUCATIONS', 'OCCUPATIONS', 'CASTES', 'STATES'];
      try {
        const results = await Promise.all(types.map(t => fetchMasterDataApi(t)));
        if (!isMounted) return;
        const newMasterData: { [key: string]: MasterOption[] } = {};
        types.forEach((t, index) => {
          newMasterData[t] = results[index] || [];
        });
        setMasterData(prev => ({ ...prev, ...newMasterData }));
      } catch (e) {}
    };

    loadMasters();
    return () => { isMounted = false; };
  }, [activeTab]);

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
    setTimeout(() => {
      setLoading(false);
      toast.success("Notification preferences saved successfully!");
    }, 600);
  };

  const handleSavePartnerPreferences = async () => {
    const token = getToken();
    setSavingPref(true);
    const res = await savePartnerPreferencesApi(prefData, token);
    setSavingPref(false);
    if (res.success) {
      toast.success("Partner preferences saved successfully!");
    } else {
      toast.error(res.message || "Failed to save preferences.");
    }
  };

  const handleConfirmPauseAccount = async () => {
    const token = getToken();
    const finalReason = pauseReason === "Other" ? customReason : pauseReason;
    setPausingLoading(true);
    const res = await deactivateAccountApi(finalReason, true, token);
    setPausingLoading(false);
    if (res.success) {
      setIsAccountPaused(true);
      setShowPauseModal(false);
      toast.success("Your profile is now paused and hidden from search results.");
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
    const token = getToken();
    setDeletingLoading(true);
    const res = await deleteAccountApi("User requested deletion", token);
    setDeletingLoading(false);
    if (res.success) {
      toast.success("Account deleted permanently.");
      setTimeout(() => {
        handleLogout();
      }, 1000);
    } else {
      toast.error(res.message || "Failed to delete account.");
    }
  };

  const getSubTitle = () => {
    switch (activeTab) {
      case 'notifications': return "Notification Settings";
      case 'preferences': return "Partner Preferences";
      case 'manage': return "Manage Account";
      default: return "Settings";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-32 pt-4 selection:bg-[#d91b5c] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      <div className="max-w-xl mx-auto px-4 md:px-6 space-y-6">
        
        {/* 📌 TOP INLINE HEADER (SAME STYLE AS GALLERY PAGE) */}
        <div className="flex items-center gap-3 py-2 border-b border-slate-200">
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
            <ArrowLeft size={22} className="stroke-[2.5]" />
          </button>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            {getSubTitle()}
          </h1>
        </div>

        {/* 📱 1. MAIN MENU SCREEN */}
        {activeTab === 'menu' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* PAUSED WARNING BANNER IF PAUSED */}
            {isAccountPaused && (
              <div className="p-5 bg-amber-50 rounded-3xl border-2 border-amber-200 space-y-3 shadow-md">
                <div className="flex items-center gap-2.5 text-amber-800">
                  <PauseCircle size={22} className="text-amber-600 shrink-0" />
                  <h3 className="font-extrabold text-sm uppercase">Your Account is Currently Paused</h3>
                </div>
                <p className="text-xs text-amber-700 font-semibold leading-relaxed">
                  Your profile is hidden from all members, searches, and recommendations. You can reactivate anytime!
                </p>
                <button
                  type="button"
                  onClick={handleReactivateAccount}
                  disabled={pausingLoading}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-sm cursor-pointer flex items-center gap-2"
                >
                  {pausingLoading ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                  Reactivate Profile Now
                </button>
              </div>
            )}

            {/* MAIN SETTINGS OPTIONS LIST */}
            <div className="bg-white rounded-3xl border-2 border-rose-100 shadow-xl overflow-hidden divide-y-2 divide-slate-100">
              
              {/* OPTION 1: NOTIFICATION SETTINGS */}
              <div 
                onClick={() => setActiveTab('notifications')}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-rose-50/40 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#d91b5c] border-2 border-rose-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Bell size={22} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase text-slate-900 tracking-tight">
                      Notification Settings
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      Control push notifications & email alerts
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-400 group-hover:text-[#d91b5c] group-hover:translate-x-1 transition-all" />
              </div>

              {/* OPTION 2: PARTNER PREFERENCES */}
              <div 
                onClick={() => setActiveTab('preferences')}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-rose-50/40 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#d91b5c] border-2 border-rose-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Heart size={22} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase text-slate-900 tracking-tight">
                      Partner Preferences
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      Set expectations & criteria for life partner
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-400 group-hover:text-[#d91b5c] group-hover:translate-x-1 transition-all" />
              </div>

              {/* OPTION 3: MANAGE ACCOUNT */}
              <div 
                onClick={() => setActiveTab('manage')}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-rose-50/40 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#d91b5c] border-2 border-rose-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Power size={22} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase text-slate-900 tracking-tight">
                      Manage Account
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      Pause profile visibility or delete account
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-400 group-hover:text-[#d91b5c] group-hover:translate-x-1 transition-all" />
              </div>

            </div>

            {/* 🚪 BOTTOM CENTER LOGOUT BUTTON */}
            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full max-w-xs mx-auto py-3.5 px-6 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs uppercase tracking-wider border-2 border-rose-200 shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut size={18} className="text-rose-600" />
                <span>Log Out of Account</span>
              </button>
            </div>

          </motion.div>
        )}

        {/* 🔔 2. NOTIFICATION SETTINGS SUB-SCREEN */}
        {activeTab === 'notifications' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 md:p-8 border-2 border-rose-100 shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
              <div className="p-2.5 bg-rose-50 rounded-2xl text-[#d91b5c] border border-rose-200">
                <Bell size={22} />
              </div>
              <div>
                <h2 className="text-base font-serif font-extrabold uppercase text-slate-900">Notification Preferences</h2>
                <p className="text-xs font-semibold text-slate-500">Manage instant push notifications & email alerts</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-slate-200">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-900">Email Notifications</h4>
                  <p className="text-[11px] font-semibold text-slate-500">Receive new proposal interest alerts via Email</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={emailNotif} 
                  onChange={(e) => setEmailNotif(e.target.checked)} 
                  className="w-5 h-5 accent-[#d91b5c] cursor-pointer" 
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-slate-200">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-900">App Interest & Chat Alerts</h4>
                  <p className="text-[11px] font-semibold text-slate-500">Receive instant push notifications for proposal activity</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={appNotif} 
                  onChange={(e) => setAppNotif(e.target.checked)} 
                  className="w-5 h-5 accent-[#d91b5c] cursor-pointer" 
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-slate-200">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-900">Daily Match Recommendations</h4>
                  <p className="text-[11px] font-semibold text-slate-500">Receive curated life partner profiles matching your criteria</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={matchAlerts} 
                  onChange={(e) => setMatchAlerts(e.target.checked)} 
                  className="w-5 h-5 accent-[#d91b5c] cursor-pointer" 
                />
              </div>

              <button 
                type="button" 
                onClick={handleSaveNotifications}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-900/20 cursor-pointer border border-rose-300/30 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Save Notification Settings</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* 💖 3. PARTNER PREFERENCES SUB-SCREEN */}
        {activeTab === 'preferences' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 md:p-8 border-2 border-rose-100 shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
              <div className="p-2.5 bg-rose-50 rounded-2xl text-[#d91b5c] border border-rose-200">
                <Heart size={22} />
              </div>
              <div>
                <h2 className="text-base font-serif font-extrabold uppercase text-slate-900">Partner Preferences</h2>
                <p className="text-xs font-semibold text-slate-500">Set criteria for ideal matches using multi-select dropdowns</p>
              </div>
            </div>

            <div className="space-y-5">
              
              <MultiSelectDropdown 
                label="Preferred Marital Status" 
                options={masterData.MARITAL_STATUS || []} 
                selectedIds={prefData.maritalStatusList} 
                onChange={(ids) => updatePrefField('maritalStatusList', ids)} 
              />

              <MultiSelectDropdown 
                label="Preferred Education" 
                options={masterData.EDUCATIONS || []} 
                selectedIds={prefData.educationIds} 
                onChange={(ids) => updatePrefField('educationIds', ids)} 
              />

              <MultiSelectDropdown 
                label="Preferred Occupation" 
                options={masterData.OCCUPATIONS || []} 
                selectedIds={prefData.occupationIds} 
                onChange={(ids) => updatePrefField('occupationIds', ids)} 
              />

              <MultiSelectDropdown 
                label="Preferred Caste" 
                options={masterData.CASTES || []} 
                selectedIds={prefData.casteIds} 
                onChange={(ids) => updatePrefField('casteIds', ids)} 
              />

              <MultiSelectDropdown 
                label="Preferred Mother Tongue" 
                options={masterData.MOTHER_TONGUES || []} 
                selectedIds={prefData.languageIds} 
                onChange={(ids) => updatePrefField('languageIds', ids)} 
              />

              <CompactSelect 
                label="Preferred Sect" 
                options={masterData.SECTS || []} 
                value={prefData.sectId} 
                onChange={(val) => updatePrefField('sectId', Number(val))} 
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CompactSelect 
                  label="Preferred State" 
                  options={masterData.STATES || []} 
                  value={prefData.stateId} 
                  onChange={(val) => updatePrefField('stateId', Number(val))} 
                />

                <CompactSelect 
                  label="Preferred City" 
                  options={masterData.CITIES || []} 
                  value={prefData.cityId} 
                  onChange={(val) => updatePrefField('cityId', Number(val))} 
                />
              </div>

              <button 
                type="button" 
                onClick={handleSavePartnerPreferences}
                disabled={savingPref}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-900/20 cursor-pointer border border-rose-300/30 flex items-center justify-center gap-2"
              >
                {savingPref ? <Loader2 size={16} className="animate-spin text-amber-300" /> : <Save size={16} className="text-amber-300" />}
                <span>Save Partner Preferences</span>
              </button>

            </div>
          </motion.div>
        )}

        {/* ⚙️ 4. MANAGE ACCOUNT SUB-SCREEN */}
        {activeTab === 'manage' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 md:p-8 border-2 border-rose-100 shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
              <div className="p-2.5 bg-rose-50 rounded-2xl text-[#d91b5c] border border-rose-200">
                <Power size={22} />
              </div>
              <div>
                <h2 className="text-base font-serif font-extrabold uppercase text-slate-900">Manage Account Status</h2>
                <p className="text-xs font-semibold text-slate-500">Pause profile visibility or delete account permanently</p>
              </div>
            </div>

            <div className="space-y-4">
              
              {/* PAUSE ACCOUNT OPTION */}
              <div className="p-5 bg-amber-50/70 rounded-3xl border-2 border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-serif font-extrabold text-sm uppercase text-slate-900 flex items-center gap-2">
                    <PauseCircle size={18} className="text-amber-600" /> Pause / Deactivate Account
                  </h4>
                  <p className="text-xs font-semibold text-slate-600">
                    Temporarily hide your profile from all members while keeping your match data intact.
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    if (isAccountPaused) {
                      handleReactivateAccount();
                    } else {
                      setShowPauseModal(true);
                    }
                  }} 
                  className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider cursor-pointer shadow-sm shrink-0 ${
                    isAccountPaused
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  }`}
                >
                  {isAccountPaused ? 'Reactivate Profile' : 'Pause Profile'}
                </button>
              </div>

              {/* DELETE ACCOUNT OPTION */}
              <div className="p-5 bg-rose-50/70 rounded-3xl border-2 border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-serif font-extrabold text-sm uppercase text-rose-900 flex items-center gap-2">
                    <Trash2 size={18} className="text-rose-600" /> Delete Account
                  </h4>
                  <p className="text-xs font-semibold text-slate-600">
                    Permanently delete your profile, photos, and match history from Nikah Qubool.
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowDeleteModal(true)} 
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-2xl uppercase tracking-wider cursor-pointer shadow-sm shrink-0"
                >
                  Delete Account
                </button>
              </div>

            </div>
          </motion.div>
        )}

      </div>

      {/* ⏸️ PAUSE ACCOUNT MODAL */}
      <AnimatePresence>
        {showPauseModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-white rounded-3xl max-w-md w-full p-7 shadow-2xl border-2 border-rose-100 text-slate-800 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5 text-amber-600 font-serif font-extrabold text-base uppercase">
                  <PauseCircle size={22} />
                  <span>Pause My Account</span>
                </div>
                <button onClick={() => setShowPauseModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
              </div>

              <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                Please let us know why you are pausing your profile. Your profile will be completely hidden from all search results and recommendations until you log back in and reactivate.
              </p>

              <div className="space-y-2">
                {[
                  "Found my partner on Nikah Qubool",
                  "Taking a temporary break",
                  "Privacy & security concerns",
                  "Other"
                ].map((reason) => (
                  <label key={reason} className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-rose-50/50 rounded-2xl border border-slate-200 cursor-pointer transition-colors text-xs font-bold text-slate-800">
                    <input 
                      type="radio" 
                      name="pauseReason" 
                      value={reason} 
                      checked={pauseReason === reason} 
                      onChange={(e) => setPauseReason(e.target.value)} 
                      className="w-4 h-4 accent-[#d91b5c]"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              {pauseReason === "Other" && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Tell us more about your reason..."
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#d91b5c]"
                  rows={2}
                />
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPauseModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPauseAccount}
                  disabled={pausingLoading}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl uppercase cursor-pointer flex items-center justify-center gap-2 shadow-md"
                >
                  {pausingLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  <span>Confirm Pause</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🗑️ DELETE ACCOUNT MODAL */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-white rounded-3xl max-w-md w-full p-7 shadow-2xl border-2 border-rose-100 text-slate-800 space-y-5 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border-2 border-rose-200 shadow-xs">
                <AlertTriangle size={32} />
              </div>

              <div>
                <h3 className="text-lg font-serif font-extrabold uppercase text-slate-900">Delete Account Permanently?</h3>
                <p className="text-slate-500 text-xs font-semibold mt-1 leading-relaxed">
                  This action cannot be undone. All your profile information, photos, shortlists, and chat history will be permanently deleted.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmDeleteAccount}
                  disabled={deletingLoading}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer border border-rose-400 flex items-center justify-center gap-2"
                >
                  {deletingLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  <span>Permanently Delete My Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full bg-slate-100 text-slate-600 hover:bg-slate-200 py-3 rounded-2xl font-bold text-xs uppercase cursor-pointer"
                >
                  Keep My Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function AccountSettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-[#d91b5c] p-8">
        <Loader2 size={36} className="animate-spin" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
