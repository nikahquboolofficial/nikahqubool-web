"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Edit2, CheckCircle2, ChevronRight, Crown, Settings, 
  ShieldCheck, CreditCard, HelpCircle, Camera, Lock,
  LogOut, Loader2, Sparkles, AlertCircle, Check, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { 
  fetchActiveSubscriptionApi, 
  fetchProfileDetailsApi, 
  updatePhotoPrivacyApiCall 
} from '@/lib/api';
import { getOptimizedImageUrl, DEFAULT_FEMALE_AVATAR } from '@/lib/imageUtils';
import VerificationModal from '@/components/profile/VerificationModal';
import { getAuthToken, getStoredUserPhoto } from '@/lib/auth';

// 🧮 100% REAL PROFILE COMPLETION CALCULATION
export const calculateRealProfileCompletion = (p: any): number => {
  if (!p) return 0;
  let score = 0;
  const isNonEmpty = (v: any) => v !== null && v !== undefined && String(v).trim() !== '' && String(v).trim() !== '0';

  // 1. Basic Identity (20%)
  if (isNonEmpty(p.fullName || p.FullName || p.name)) score += 5;
  if (isNonEmpty(p.gender || p.Gender)) score += 5;
  if (Number(p.age || p.Age) > 0 || isNonEmpty(p.dateOfBirth || p.dob)) score += 5;
  if (isNonEmpty(p.maritalStatus || p.MaritalStatus || p.maritalStatusName)) score += 5;

  // 2. Cultural & Physical (15%)
  if (isNonEmpty(p.height || p.Height)) score += 5;
  if (isNonEmpty(p.motherTongue || p.MotherTongue || p.motherTongueName)) score += 5;
  if (isNonEmpty(p.sect || p.Sect || p.caste || p.Caste)) score += 5;

  // 3. Location (10%)
  if (isNonEmpty(p.stateName || p.StateName || p.currentStateName || p.location)) score += 5;
  if (isNonEmpty(p.cityName || p.CityName || p.currentCityName)) score += 5;

  // 4. Education & Career (20%)
  if (isNonEmpty(p.highestDegree || p.HighestDegree || p.education || p.highestDegreeName)) score += 10;
  if (isNonEmpty(p.profession || p.Profession || p.designation || p.employmentSector || p.job)) score += 10;

  // 5. Income & Financial (10%)
  if (isNonEmpty(p.annualIncome || p.AnnualIncome || p.income) && !String(p.annualIncome).toLowerCase().includes('no income')) score += 10;

  // 6. Family & Bio (15%)
  if (isNonEmpty(p.fatherName || p.fatherOccupation || p.motherName || p.familyType || p.familyAbout)) score += 10;
  if (isNonEmpty(p.aboutMe || p.AboutMe)) score += 5;

  // 7. Profile Photo (10%)
  const rawPhoto = p.mainPhotoUrl || p.photoUrl || p.PhotoUrl || p.mainPhoto || p.photo;
  if (isNonEmpty(rawPhoto) && !String(rawPhoto).includes('placeholder') && !String(rawPhoto).includes('default')) score += 10;

  return Math.min(100, Math.max(15, score));
};

export default function MyProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch('/dashboard/edit-profile');
    router.prefetch('/dashboard/gallery');
    router.prefetch('/dashboard/membership');
    router.prefetch('/dashboard/settings');
    router.prefetch('/dashboard/payment-info');
    router.prefetch('/dashboard/support');
  }, [router]);

  const [profileData, setProfileData] = useState<any>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("cached_profile_details") || localStorage.getItem("user_details");
        if (cached) {
          const parsed = JSON.parse(cached);
          return parsed.profile || parsed.Profile || parsed;
        }
      } catch (e) {}
    }
    return null;
  });
  const [activePlan, setActivePlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isPhotoLoaded, setIsPhotoLoaded] = useState<boolean>(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [selectedPrivacy, setSelectedPrivacy] = useState<string>('All Members');
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  const getToken = useCallback(() => getAuthToken(), []);

  // ⚡ INSTANT 0ms HYDRATION FROM LOCAL CACHE
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("cached_profile_details") || localStorage.getItem("user_details");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const p = parsed.profile || parsed.Profile || parsed;
          if (p && typeof p === "object") {
            setProfileData(p);
          }
        } catch (e) {}
      }
    }
  }, []);

  const loadMyProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push('/');
      return;
    }

    let userId = 0;
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user_details");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          userId = parsed.userId || parsed.UserId || parsed.id;
        } catch (e) {}
      }
    }

    // Only show skeleton if we have zero cached data
    if (!profileData && typeof window !== "undefined" && !localStorage.getItem("cached_profile_details") && !localStorage.getItem("user_details")) {
      setLoading(true);
    }

    try {
      const [profileRes, subRes] = await Promise.all([
        fetchProfileDetailsApi(userId > 0 ? userId : 0, token),
        fetchActiveSubscriptionApi(token)
      ]);

      if (profileRes.success && profileRes.data) {
        const p = profileRes.data.profile || profileRes.data.Profile || profileRes.data;
        setProfileData(p);
        setSelectedPrivacy(p.photoPrivacy || p.PhotoPrivacy || 'All Members');
        if (typeof window !== "undefined") {
          localStorage.setItem("cached_profile_details", JSON.stringify(p));
        }
      }

      if (subRes.success && subRes.data) {
        setActivePlan(subRes.data);
      }
    } catch (err) {
      console.error("Failed to load profile details", err);
    } finally {
      setLoading(false);
    }
  }, [getToken, router]);

  useEffect(() => {
    loadMyProfile();
  }, [loadMyProfile]);

  useEffect(() => {
    const handlePhotoUpdated = (e: any) => {
      const newPhoto = e?.detail?.photoUrl || getStoredUserPhoto();
      if (newPhoto) {
        setProfileData((prev: any) => ({
          ...prev,
          mainPhotoUrl: newPhoto,
          photoUrl: newPhoto,
          PhotoUrl: newPhoto,
          mainPhoto: newPhoto,
          photo: newPhoto
        }));
      }
      loadMyProfile();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("user_photo_updated", handlePhotoUpdated);
      return () => window.removeEventListener("user_photo_updated", handlePhotoUpdated);
    }
  }, [loadMyProfile]);

  const handleSavePrivacy = async (privacyOption: string) => {
    const token = getToken();
    if (!token) return;
    setSavingPrivacy(true);
    const res = await updatePhotoPrivacyApiCall(privacyOption, token);
    setSavingPrivacy(false);
    if (res.success) {
      setSelectedPrivacy(privacyOption);
      toast.success("Profile privacy updated successfully!");
      setIsPrivacyModalOpen(false);
      loadMyProfile();
    } else {
      toast.error(res.message || "Failed to update privacy.");
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_token");
      localStorage.removeItem("user_session");
      localStorage.removeItem("user_details");
      document.cookie = "user_token=; path=/; max-age=0;";
    }
    // Logged out quietly without toast
    router.push('/');
  };

  // Calculations
  const rawPhoto = profileData?.mainPhotoUrl || profileData?.photoUrl || profileData?.PhotoUrl || profileData?.mainPhoto || profileData?.photo;
  const hasRealPhoto = Boolean(rawPhoto && rawPhoto !== '/placeholder.png' && !String(rawPhoto).includes('default') && !String(rawPhoto).startsWith('data:image'));
  const photo = hasRealPhoto ? getOptimizedImageUrl(rawPhoto, profileData?.userId || 1, profileData?.gender) : getStoredUserPhoto();
  const fullName = profileData?.fullName || 'Member Profile';
  const isVerified = Boolean(profileData?.isVerified ?? profileData?.IsVerified ?? false);
  
  // Real percentage calculation
  const profileCompletion = calculateRealProfileCompletion(profileData);
  const isIncomplete = profileCompletion < 100;

  // Member ID generation
  const userIdNum = Number(profileData?.userId || profileData?.UserId || 1);
  const memberId = profileData?.memberId || profileData?.MemberId || `NQ${(8800000 + userIdNum).toString()}`;

  // Plan & Expiry
  const isPaid = Boolean(
    activePlan?.isActive ?? activePlan?.IsActive ?? 
    profileData?.isPaid ?? profileData?.IsPaid ?? 
    profileData?.isPremium ?? profileData?.IsPremium
  );
  const planName = activePlan?.planName || activePlan?.PlanName || profileData?.planName || profileData?.PlanName || "Silver Plan";
  const rawExpiry = activePlan?.expiresAt || activePlan?.ExpiresAt || profileData?.planExpiryDate || profileData?.PlanExpiryDate;
  
  const formatExpiry = (exp: any) => {
    if (!exp) return "Valid till 2027";
    try {
      const d = new Date(exp);
      if (isNaN(d.getTime())) return "Valid till 2027";
      return `Valid till ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } catch {
      return "Valid till 2027";
    }
  };
  const displayExpiry = formatExpiry(rawExpiry);

  if (loading && !profileData) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-slate-900 pb-28 pt-4 sm:pt-6">
        <div className="max-w-xl mx-auto px-4 sm:px-6 space-y-4">
          <div className="flex items-center justify-between py-1">
            <div className="w-36 h-7 bg-slate-200 rounded-lg shimmer-luxury" />
            <div className="w-28 h-5 bg-slate-200 rounded-md shimmer-luxury" />
          </div>
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100 text-center space-y-4 relative overflow-hidden">
            <div className="w-28 h-28 mx-auto rounded-full bg-slate-200 shimmer-luxury" />
            <div className="w-48 h-6 mx-auto bg-slate-200 rounded-lg shimmer-luxury" />
            <div className="w-32 h-4 mx-auto bg-slate-100 rounded-md shimmer-luxury" />
            <div className="w-full h-12 bg-rose-50/60 rounded-2xl shimmer-luxury" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 h-16 shimmer-luxury" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // SVG circular completion calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (profileCompletion / 100) * circumference;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 pb-28 pt-4 sm:pt-6 selection:bg-[#E21E5B] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      <div className="max-w-xl mx-auto px-4 sm:px-6 space-y-4">
        
        {/* 🏷️ TOP BAR: "My Profile" on left, "Member ID: NQ-XXXXX" on right */}
        <div className="flex items-center justify-between py-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Profile
          </h1>
          <span className="text-xs sm:text-sm font-semibold text-slate-500 tracking-wide">
            Member ID: <strong className="text-slate-800 font-bold">{memberId}</strong>
          </span>
        </div>

                {/* 🎴 MAIN PROFILE SUMMARY CARD (EXACT TARGET SCREENSHOT DESIGN) */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100 text-center space-y-4 relative overflow-hidden">
          
          {/* AVATAR WITH CIRCULAR COMPLETION RING & BADGE */}
          <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
            
            {/* SVG Progress Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="stroke-slate-100"
                strokeWidth="5"
                fill="transparent"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="stroke-[#E21E5B] transition-all duration-1000 ease-out"
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Photo inside Ring */}
            <div 
              className="absolute inset-2 rounded-full overflow-hidden cursor-pointer group bg-slate-100"
              onClick={() => router.push('/dashboard/gallery')}
              title="Click to view/change photos"
            >
              {hasRealPhoto && !isPhotoLoaded && (
                <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center z-10">
                  <Loader2 size={24} className="animate-spin text-slate-400" />
                </div>
              )}
              <img 
                src={photo} 
                alt={fullName} 
                onLoad={() => setIsPhotoLoaded(true)}
                className={`w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105 ${hasRealPhoto && !isPhotoLoaded ? 'opacity-0' : 'opacity-100'}`}
                onError={(e) => { 
                  (e.target as HTMLImageElement).src = DEFAULT_FEMALE_AVATAR;
                  setIsPhotoLoaded(true);
                }}
              />
            </div>

            {/* Camera Overlay Icon on Avatar */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push('/dashboard/gallery');
              }}
              className="absolute top-1 right-1 w-7 h-7 rounded-full bg-white border border-rose-200 text-[#E21E5B] shadow-sm flex items-center justify-center hover:bg-rose-50 transition-all cursor-pointer z-20"
              title="Manage Photos"
            >
              <Camera size={13} />
            </button>

            {/* Percentage Badge */}
            <div className="absolute -bottom-1 inset-x-0 mx-auto w-fit px-3 py-0.5 rounded-full bg-[#E21E5B] text-white text-[11px] font-black shadow-sm border-2 border-white z-20">
              {profileCompletion}%
            </div>
          </div>

          {/* STATUS PILL BADGE */}
          <div className="pt-1">
            {isIncomplete ? (
              <span className="inline-flex items-center px-4 py-1 rounded-full bg-rose-50 text-[#E21E5B] text-xs font-bold">
                Incomplete Profile
              </span>
            ) : (
              <span className="inline-flex items-center px-4 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                Profile Completed
              </span>
            )}
          </div>

          {/* NAME, VERIFIED BADGE & VIP CROWN */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center justify-center gap-1.5">
              <span>{fullName}</span>
              {isVerified && (
                <span title="Verified Member">
                  <CheckCircle2 size={18} className="fill-[#0284C7] text-white" />
                </span>
              )}
              {isPaid && (
                <span title="VIP Member">
                  <Crown size={16} className="fill-amber-400 text-amber-500" />
                </span>
              )}
            </h2>

            {/* ACTIVE PLAN & EXPIRY DETAILS */}
            <p className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center justify-center gap-1.5 pt-0.5">
              {isPaid ? (
                <>
                  <Crown size={15} className="fill-amber-400 text-amber-500" />
                  <span className="font-bold text-slate-900">{planName}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 font-medium">{displayExpiry}</span>
                </>
              ) : (
                <>
                  <span className="text-slate-500 font-medium">Free Member</span>
                  <span className="text-slate-300">•</span>
                  <Link prefetch={true} href="/dashboard/membership" className="text-[#E21E5B] font-bold hover:underline">
                    Upgrade to VIP
                  </Link>
                </>
              )}
            </p>
          </div>

        </div>

        {/* 👑 SECOND CARD: UPGRADE BANNER (MATCHING TARGET SCREENSHOT) */}
        <Link prefetch={true} href="/dashboard/membership"
          className="bg-[#FFFBF2] hover:bg-[#FFF7E6] border border-[#FDE68A] rounded-2xl p-4 sm:p-4.5 flex items-center justify-between text-slate-900 transition-all shadow-xs group cursor-pointer block"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-400/20 text-amber-600 flex items-center justify-center shrink-0">
              <Crown size={18} className="fill-amber-400 text-amber-600" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              Upgrade to advanced plan with more benefits.
            </span>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
        </Link>

        {/* 📋 STACKED MENU OPTIONS CARD (EXACT SCREENSHOT LAYOUT) */}
        <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden divide-y divide-slate-100">
          
          {/* 1. Edit my profile */}
          <Link prefetch={true} href="/dashboard/edit-profile"
            className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Edit2 size={18} className="text-slate-600 group-hover:text-[#E21E5B] transition-colors" />
              <span className="text-sm font-semibold text-slate-800">Edit my profile</span>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* 2. Profile Privacy */}
          <button
            type="button"
            onClick={() => setIsPrivacyModalOpen(true)}
            className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer text-left"
          >
            <div className="flex items-center gap-3.5">
              <Lock size={18} className="text-slate-600 group-hover:text-[#E21E5B] transition-colors" />
              <div>
                <span className="text-sm font-semibold text-slate-800 block">Profile Privacy</span>
                <span className="text-[11px] text-slate-400 block font-medium">Currently: {selectedPrivacy}</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* 3. Profile Verification (Selfie or Govt Document) */}
          <button
            type="button"
            onClick={() => setIsVerificationOpen(true)}
            className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer text-left"
          >
            <div className="flex items-center gap-3.5">
              <ShieldCheck size={18} className={isVerified ? "text-emerald-600" : "text-[#E21E5B]"} />
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">Profile Verification</span>
                {isVerified ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    ✓ Verified
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-[#E21E5B] text-[10px] font-bold">
                    Verify Now
                  </span>
                )}
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* 4. Payment Info */}
          <Link prefetch={true} href="/dashboard/payment-info"
            className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <CreditCard size={18} className="text-slate-600 group-hover:text-[#E21E5B] transition-colors" />
              <span className="text-sm font-semibold text-slate-800">Payment Info</span>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* 5. Explore Plans */}
          <Link prefetch={true} href="/dashboard/membership"
            className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Crown size={18} className="text-slate-600 group-hover:text-amber-500 transition-colors" />
              <span className="text-sm font-semibold text-slate-800">Explore Plans</span>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* 6. Help & Support */}
          <Link prefetch={true} href="/dashboard/support"
            className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <HelpCircle size={18} className="text-slate-600 group-hover:text-[#E21E5B] transition-colors" />
              <span className="text-sm font-semibold text-slate-800">Help & Support</span>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* 7. Account Settings */}
          <Link prefetch={true} href="/dashboard/settings"
            className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Settings size={18} className="text-slate-600 group-hover:text-[#E21E5B] transition-colors" />
              <span className="text-sm font-semibold text-slate-800">Account Settings</span>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* 8. Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-rose-50/50 transition-colors group cursor-pointer text-left"
          >
            <div className="flex items-center gap-3.5 text-rose-600">
              <LogOut size={18} />
              <span className="text-sm font-semibold">Logout Account</span>
            </div>
            <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
          </button>

        </div>

      </div>

      {/* 🔒 PROFILE PRIVACY MODAL / BOTTOM SHEET */}
      <AnimatePresence>
        {isPrivacyModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setIsPrivacyModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto sm:hidden mb-2" />
              
              <div className="text-left space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Photo & Profile Privacy</h3>
                <p className="text-xs text-slate-500">Control who can view your photos and profile details.</p>
              </div>

              <div className="space-y-2 pt-2">
                {[
                  { value: 'All Members', title: 'All Members', desc: 'Visible to all registered members (Recommended for fastest proposals)' },
                  { value: 'Only Premium Members', title: 'VIP Members Only', desc: 'Visible only to verified paid VIP subscribers' },
                  { value: 'Visible on Request', title: 'Visible on Request', desc: 'Photos blurred until you accept photo request' }
                ].map((item) => {
                  const isSelected = selectedPrivacy === item.value;
                  return (
                    <div
                      key={item.value}
                      onClick={() => handleSavePrivacy(item.value)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        isSelected 
                          ? 'border-[#E21E5B] bg-rose-50/60 shadow-xs' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{item.title}</p>
                        <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{item.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-3 ${
                        isSelected ? 'border-[#E21E5B] bg-[#E21E5B]' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check size={12} className="text-white stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer mt-2"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🛡️ STRICT 2-OPTION VERIFICATION MODAL */}
      <VerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        userId={userIdNum}
        token={getToken() || null}
        mainPhotoUrl={rawPhoto}
        onVerificationSuccess={() => {
          loadMyProfile();
        }}
      />

    </div>
  );
}
