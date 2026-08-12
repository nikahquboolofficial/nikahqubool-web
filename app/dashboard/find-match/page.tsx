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
import { searchMatchesApi, handleInteractionApiCall } from '@/lib/api';

// MASTER OPTIONS LIST
const MARITAL_STATUS_OPTIONS = ["Never Married", "Awaiting Divorce", "Divorced", "Widowed", "Separated"];
const SECT_OPTIONS = ["Sunni", "Shia", "Barelvi", "Deobandi", "Ahle Hadees"];
const CASTE_OPTIONS = ["Sheikh", "Syed", "Pathan", "Khan", "Ansari", "Qureshi", "Siddiqui", "Farooqui"];
const STATE_OPTIONS = ["Maharashtra", "Uttar Pradesh", "Delhi", "Bihar", "West Bengal", "Telangana", "Karnataka", "Punjab"];
const CITY_OPTIONS = ["Mumbai", "Delhi", "Lucknow", "Bareilly", "Kolkata", "Hyderabad", "Patna", "Pune"];
const DEGREE_OPTIONS = ["B.Tech", "M.Tech", "MBA", "MBBS", "MD", "B.Sc", "Doctorate", "CA / CS"];
const PROFESSION_OPTIONS = ["Private Sector", "Govt / PSU", "Business / Entrepreneur", "Doctor", "Engineer", "Teacher / Academic"];

export default function FindMatchesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserPaid, setIsUserPaid] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const [activeBottomSheet, setActiveBottomSheet] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // FILTERS STATE
  const [filters, setFilters] = useState({
    ageMin: 18, ageMax: 45,
    heightMin: 4.0, heightMax: 6.5,
    maritalStatus: [] as string[],
    sect: [] as string[],
    caste: [] as string[],
    states: [] as string[],
    cities: [] as string[], // 🔒 Paid
    education: [] as string[], // 🔒 Paid
    employedIn: [] as string[], // 🔒 Paid
  });

  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop()?.split(';').shift() : null;
  };

  const getToken = useCallback(() => getCookie("user_token"), []);

  const loadMatches = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push('/');
      return;
    }

    setLoading(true);
    const payload = {
      searchText: "",
      ageMin: filters.ageMin,
      ageMax: filters.ageMax,
      maritalStatus: filters.maritalStatus,
      sect: filters.sect,
      caste: filters.caste,
      states: filters.states,
      cities: isUserPaid ? filters.cities : [],
      education: isUserPaid ? filters.education : [],
      employedIn: isUserPaid ? filters.employedIn : [],
      pageNumber: 1,
      pageSize: 24
    };

    const res = await searchMatchesApi(payload, token);
    setLoading(false);

    if (res && (res.success) && res.data) {
      setProfiles(res.data);
      setIsUserPaid(Boolean(res.isUserPaid));
    } else {
      setProfiles([]);
    }
  }, [getToken, filters, isUserPaid, router]);

  useEffect(() => {
    loadMatches();
  }, []);

  const handleReset = () => {
    setFilters({
      ageMin: 18, ageMax: 45,
      heightMin: 4.0, heightMax: 6.5,
      maritalStatus: [],
      sect: [],
      caste: [],
      states: [],
      cities: [],
      education: [],
      employedIn: [],
    });
    toast.success("Filters reset to default.");
  };

  const openCategorySheet = (categoryKey: string, isLocked: boolean = false) => {
    if (isLocked && !isUserPaid) {
      setShowUpgradeModal(true);
      return;
    }
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
      toast.success(res.message || "Connected successfully!");
      setProfiles(prev => prev.filter(p => (p.userId || p.UserId) !== receiverId));
    } else {
      toast.error(res?.message || "Action failed");
    }
  };

  const openProfileView = (user: any) => {
    const uId = user.userId || user.UserId;
    sessionStorage.setItem('viewing_profile_target', JSON.stringify({
      userId: uId,
      targetUserId: uId
    }));
    router.push('/dashboard/profile');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-32 selection:bg-[#870c3f] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        input[type='range'] { pointer-events: none; position: absolute; width: 100%; appearance: none; background: none; z-index: 10; }
        input[type='range']::-webkit-slider-thumb { pointer-events: auto; width: 20px; height: 20px; border-radius: 50%; background: #870c3f; appearance: none; border: 3px solid white; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); cursor: pointer; }
      `}</style>

      {/* --- STICKY TOP HEADER --- */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b-2 border-rose-100 px-4 py-3.5 shadow-md shadow-rose-950/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="p-2 hover:bg-rose-50 rounded-2xl text-[#870c3f] border-2 border-rose-200 transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-extrabold font-serif text-lg text-slate-900 uppercase tracking-tight">Find Matches</span>
              {!isUserPaid && (
                <span className="px-3 py-1 rounded-full bg-rose-50 text-[#870c3f] text-[10px] font-black uppercase border border-rose-200 flex items-center gap-1 shadow-xs">
                  <Sparkles size={11} className="text-amber-500" /> Free Plan
                </span>
              )}
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setShowFilters(true)} 
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 text-white rounded-full shadow-md shadow-rose-900/20 font-black uppercase text-xs tracking-wider active:scale-95 transition-all cursor-pointer border border-rose-300/30"
          >
            <SlidersHorizontal size={15} className="text-amber-300" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* --- PROFILES GRID --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-800">
            <Loader2 className="animate-spin mb-3 text-[#870c3f]" size={48} />
            <span className="font-black text-xs uppercase tracking-widest text-slate-500">Finding Verified Matches...</span>
          </div>
        ) : profiles.length === 0 ? (
          <div className="min-h-[320px] bg-white rounded-3xl p-10 text-center border-2 border-rose-100 flex flex-col items-center justify-center space-y-3 shadow-xl max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-rose-50 border-2 border-rose-200 flex items-center justify-center text-[#870c3f] mb-1">
              <Users2 size={32} />
            </div>
            <h3 className="text-lg font-extrabold uppercase text-slate-900">No Matches Found</h3>
            <p className="text-xs text-slate-500 font-semibold max-w-xs">Try resetting or broadening your search filters to discover more life partners.</p>
            <button 
              onClick={handleReset} 
              className="mt-3 px-6 py-2.5 bg-[#870c3f] text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-sm hover:brightness-110 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {profiles.map((user) => {
              const uId = user.userId || user.UserId;
              const uName = user.fullName || user.FullName || "Member";
              const uAge = user.age || user.Age || user.ageYears || "";
              const uPhoto = user.photoUrl || user.PhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(uName)}&background=FAF7F2&color=870C3F&bold=true`;
              const isPhotoLocked = Boolean(user.isPhotoHidden ?? user.IsPhotoHidden);
              const uCity = user.cityName || user.CityName || user.CurrentCityName || "";
              const uState = user.stateName || user.StateName || user.CurrentStateName || "";
              const uProfession = user.profession || user.Profession || user.Designation || user.Occupation || 'Professional';
              const uEducation = user.education || user.Education || user.HighestDegree || 'Graduate';
              const uSect = user.sect || user.Sect || 'Sunni';
              const uCaste = user.caste || user.Caste || 'General';
              const isVerified = Boolean(user.isVerified ?? user.IsVerified ?? true);

              return (
                <motion.div 
                  key={uId} 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="bg-white rounded-3xl overflow-hidden border-2 border-rose-100 shadow-xl group flex flex-col justify-between hover:shadow-2xl hover:border-rose-300 transition-all duration-300"
                >
                  <div>
                    {/* CARD PHOTO HEADER */}
                    <div className="relative h-[270px] overflow-hidden bg-slate-950">
                      <img 
                        src={uPhoto} 
                        className={`w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ${isPhotoLocked ? 'blur-xl opacity-60' : ''}`} 
                        alt={uName} 
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(uName)}&background=FAF7F2&color=870C3F&bold=true`; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                      
                      {isPhotoLocked && (
                        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-amber-300 text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md uppercase border border-amber-400/30">
                          <Lock size={12} /> Photo Protected
                        </div>
                      )}

                      {/* NAME & LOCATION OVERLAY (z-40 for full visibility) */}
                      <div className="absolute bottom-4 left-5 right-5 text-white z-40">
                        <div className="flex items-center gap-2 font-extrabold">
                          <h3 className="text-xl font-serif tracking-tight text-white">
                            {uName}{uAge ? `, ${uAge}` : ''}
                          </h3>
                          {isVerified && <CheckCircle2 size={18} className="text-emerald-400 fill-emerald-400 shrink-0" />}
                        </div>
                        <p className="text-rose-200 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                          <MapPin size={13} className="text-amber-400" /> 
                          <span>{uCity ? `${uCity}, ` : ''}{uState || 'India'}</span>
                        </p>
                      </div>
                    </div>

                    {/* CARD DETAILS BODY */}
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-slate-800">
                        <MiniDetail icon={<Briefcase size={14}/>} label={uProfession} />
                        <MiniDetail icon={<GraduationCap size={14}/>} label={uEducation} />
                        <MiniDetail icon={<Users2 size={14}/>} label={uSect} />
                        <MiniDetail icon={<Star size={14}/>} label={uCaste} />
                      </div>
                    </div>
                  </div>

                  {/* CARD ACTION BUTTONS */}
                  <div className="p-5 pt-0 flex gap-2.5">
                    <button 
                      type="button"
                      onClick={() => openProfileView(user)} 
                      className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-[#870c3f] font-black text-xs uppercase rounded-xl border-2 border-rose-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Eye size={14} />
                      <span>View</span>
                    </button>

                    <button 
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleInteraction(uId, 'INTEREST', 'PENDING')} 
                      className="flex-1 py-2.5 bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-rose-900/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-rose-300/30"
                    >
                      <Heart size={14} className="fill-amber-300 text-amber-300" />
                      <span>Connect</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* --- FILTER DRAWER --- */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFilters(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] flex flex-col shadow-2xl text-slate-800">
              
              {/* Drawer Header */}
              <div className="p-5 border-b-2 border-rose-100 flex justify-between items-center bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-amber-300" />
                  <h3 className="text-lg font-serif font-extrabold uppercase tracking-tight">Refine Matches</h3>
                </div>
                <button onClick={() => setShowFilters(false)} className="p-1.5 bg-white/20 hover:bg-white text-white hover:text-slate-900 rounded-full transition-all cursor-pointer"><X size={18}/></button>
              </div>

              {/* FILTER SECTIONS */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-32">
                
                {/* BASIC CRITERIA CARD */}
                <div className="bg-slate-50 rounded-3xl p-5 border-2 border-slate-200 shadow-xs space-y-6">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#870c3f] block">Basic Criteria</span>

                  <DualRange min={18} max={60} valMin={filters.ageMin} valMax={filters.ageMax} onChangeMin={(v)=>setFilters({...filters, ageMin:v})} onChangeMax={(v)=>setFilters({...filters, ageMax:v})} title="Age Range" label="yrs" />

                  <DualRange min={4.0} max={7.0} valMin={filters.heightMin} valMax={filters.heightMax} onChangeMin={(v)=>setFilters({...filters, heightMin:v})} onChangeMax={(v)=>setFilters({...filters, heightMax:v})} title="Height Range" label="ft" step={0.1} />

                  <CategoryRow 
                    title="Marital Status" 
                    count={filters.maritalStatus.length} 
                    onClick={() => openCategorySheet('MARITAL_STATUS')} 
                  />
                </div>

                {/* RELIGION & COMMUNITY CARD */}
                <div className="bg-slate-50 rounded-3xl p-5 border-2 border-slate-200 shadow-xs space-y-4">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#870c3f] block">Religion & Community</span>
                  
                  <CategoryRow title="Sect" count={filters.sect.length} onClick={() => openCategorySheet('SECT')} />
                  <CategoryRow title="Caste" count={filters.caste.length} onClick={() => openCategorySheet('CASTE')} />
                  <CategoryRow title="State Location" count={filters.states.length} onClick={() => openCategorySheet('STATE')} />
                </div>

                {/* PREMIUM FILTERS CARD (PRO 👑) */}
                <div className="bg-rose-50/50 rounded-3xl p-5 border-2 border-rose-200 shadow-xs space-y-4 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#870c3f] block">Premium Filters</span>
                    <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-700 text-[10px] font-black uppercase flex items-center gap-1 border border-amber-400/30">
                      <Crown size={12} className="text-amber-600" /> PRO
                    </span>
                  </div>

                  <CategoryRow title="City Location" isLocked={!isUserPaid} count={filters.cities.length} onClick={() => openCategorySheet('CITY', true)} />
                  <CategoryRow title="Education" isLocked={!isUserPaid} count={filters.education.length} onClick={() => openCategorySheet('EDUCATION', true)} />
                  <CategoryRow title="Profession" isLocked={!isUserPaid} count={filters.employedIn.length} onClick={() => openCategorySheet('PROFESSION', true)} />
                </div>

              </div>

              {/* ACTION BAR (RESET ↺ + FIND MATCHES) */}
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t-2 border-rose-100 flex items-center gap-3 z-50 shadow-2xl">
                <button 
                  type="button"
                  onClick={handleReset} 
                  className="w-13 h-13 rounded-2xl border-2 border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer"
                  title="Reset Filters"
                >
                  <RotateCcw size={18} />
                </button>

                <button 
                  type="button"
                  onClick={() => { setShowFilters(false); loadMatches(); }} 
                  className="flex-1 py-4 bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-900/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 border border-rose-300/30"
                >
                  <Search size={16} className="text-amber-300" />
                  <span>Search Matches</span>
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* BOTTOM SHEET SELECTION MODAL */}
      <AnimatePresence>
        {activeBottomSheet && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveBottomSheet(null)} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative bg-white rounded-t-[36px] max-w-md w-full p-6 space-y-4 z-10 max-h-[70vh] flex flex-col shadow-2xl border-t-2 border-rose-100 text-slate-800">
              
              <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto" />
              
              <div className="flex justify-between items-center border-b-2 border-slate-100 pb-3">
                <h3 className="text-base font-serif font-extrabold uppercase text-[#870c3f]">
                  {activeBottomSheet.replace('_', ' ')}
                </h3>
                <button onClick={() => setActiveBottomSheet(null)} className="p-1.5 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"><X size={18}/></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1 no-scrollbar">
                {getOptionsForSheet(activeBottomSheet).map((opt) => {
                  const isSelected = getIsSelected(activeBottomSheet, opt);
                  return (
                    <div 
                      key={opt} 
                      onClick={() => handleToggleOption(activeBottomSheet, opt)}
                      className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-[#870c3f] bg-rose-50 text-[#870c3f] font-black' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold'
                      }`}
                    >
                      <span className="text-xs uppercase">{opt}</span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected ? 'bg-[#870c3f] text-white shadow-xs' : 'border-2 border-slate-300'
                      }`}>
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIP UPGRADE MODAL */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl max-w-sm w-full p-7 text-center shadow-2xl border-2 border-rose-100 text-slate-800">
              <div className="w-16 h-16 bg-rose-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-rose-200 shadow-xs">
                <Crown size={32} />
              </div>
              <h3 className="text-lg font-serif font-extrabold uppercase text-slate-900 mb-1">VIP Filter Locked</h3>
              <p className="text-slate-500 text-xs font-semibold mb-6 leading-relaxed">
                City, Degree, and Profession filters are reserved for VIP Premium members. Upgrade to search your exact match!
              </p>
              <div className="flex flex-col gap-2.5">
                <button onClick={() => router.push('/dashboard/membership')} className="w-full bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-900/20 cursor-pointer border border-rose-300/30">Upgrade to VIP</button>
                <button onClick={() => setShowUpgradeModal(false)} className="w-full bg-slate-100 text-slate-600 hover:bg-slate-200 py-3 rounded-2xl font-bold text-xs uppercase cursor-pointer">Maybe Later</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );

  function getOptionsForSheet(sheetKey: string) {
    switch (sheetKey) {
      case 'MARITAL_STATUS': return MARITAL_STATUS_OPTIONS;
      case 'SECT': return SECT_OPTIONS;
      case 'CASTE': return CASTE_OPTIONS;
      case 'STATE': return STATE_OPTIONS;
      case 'CITY': return CITY_OPTIONS;
      case 'EDUCATION': return DEGREE_OPTIONS;
      case 'PROFESSION': return PROFESSION_OPTIONS;
      default: return [];
    }
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
}

// HELPER COMPONENTS
function MiniDetail({ icon, label }: any) {
  return (
    <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 overflow-hidden">
      <div className="text-[#870c3f] shrink-0">{icon}</div>
      <span className="text-[11px] font-bold uppercase truncate tracking-tight">{label}</span>
    </div>
  );
}

function DualRange({ min, max, valMin, valMax, onChangeMin, onChangeMax, label, title, step = 1 }: any) {
  const minPos = ((valMin - min) / (max - min)) * 100;
  const maxPos = ((valMax - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-[11px] font-black uppercase text-slate-700">{title}</label>
        <span className="text-[11px] font-black text-[#870c3f] bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">{valMin} - {valMax} {label}</span>
      </div>
      <div className="relative h-2 bg-slate-200 rounded-full mx-1">
        <div className="absolute h-full bg-[#870c3f] rounded-full" style={{ left: `${minPos}%`, right: `${100 - maxPos}%` }} />
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
      className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-rose-300 hover:bg-rose-50/30 transition-all shadow-xs"
    >
      <div className="flex items-center gap-2">
        <h4 className="text-xs font-black text-slate-800 uppercase">{title}</h4>
        {isLocked && <Crown size={14} className="text-amber-500" />}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] font-black text-[#870c3f]">
          {count === 0 ? 'Any' : `${count} selected`}
        </span>
        <ChevronRight size={16} className="text-slate-400" />
      </div>
    </div>
  );
}