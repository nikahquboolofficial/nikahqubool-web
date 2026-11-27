"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Edit3, CheckCircle2, ChevronRight, Crown, Settings, 
  CreditCard, HelpCircle, Camera, Lock,
  LogOut, Loader2, Sparkles, Check, Eye, Copy,
  SlidersHorizontal, HeartHandshake
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { 
  fetchActiveSubscriptionApi, 
  fetchProfileDetailsApi, 
  updatePhotoPrivacyApiCall 
} from '@/lib/api';
import { getOptimizedImageUrl, DEFAULT_FEMALE_AVATAR } from '@/lib/imageUtils';
import { getAuthToken, getStoredUserPhoto } from '@/lib/auth';

// 🧮 100% REAL PROFILE COMPLETION CALCULATION
export const calculateRealProfileCompletion = (p: any): number => {
  if (!p) return 50;

  const apiScore = Number(p.profileCompletionScore ?? p.ProfileCompletionScore ?? 0);
  if (apiScore > 0) {
    return Math.min(100, Math.max(50, apiScore));
  }

  let score = 50;

  // 1. Photos (+20%)
  const rawPhoto = p.mainPhotoUrl || p.photoUrl || p.PhotoUrl || p.mainPhoto || p.photo;
  const hasPhoto = Boolean(rawPhoto && !String(rawPhoto).includes('placeholder') && !String(rawPhoto).includes('default') && String(rawPhoto).trim().length > 0);
  if (hasPhoto) score += 20;

  // 2. Family Details (+10%)
  const hasFamily = Boolean(
    Number(p.familyType || p.FamilyType) > 0 ||
    Number(p.fatherOccupationId || p.FatherOccupationId) > 0 ||
    (p.fatherOccupation && String(p.fatherOccupation).trim().length > 0 && String(p.fatherOccupation) !== 'None') ||
    (p.nativeLocation && String(p.nativeLocation).trim().length > 0) ||
    (Array.isArray(p.completedSections) && p.completedSections.includes('family'))
  );
  if (hasFamily) score += 10;

  // 3. Religious Details (+5%)
  const hasReligious = Boolean(
    Number(p.namazHabitId || p.NamazHabitId) > 0 ||
    (p.namazHabit && String(p.namazHabit).trim().length > 0) ||
    Number(p.quranReadingId || p.QuranReadingId) > 0 ||
    (p.quranReading && String(p.quranReading).trim().length > 0) ||
    (Array.isArray(p.completedSections) && p.completedSections.includes('religious'))
  );
  if (hasReligious) score += 5;

  // 4. Lifestyle & Interests (+10%)
  const hasLifestyle = Boolean(
    Number(p.dietTypeId || p.DietTypeId) > 0 ||
    (p.dietType && String(p.dietType).trim().length > 0) ||
    (p.hobbies && String(p.hobbies).trim().length > 0) ||
    (p.music && String(p.music).trim().length > 0) ||
    (p.sports && String(p.sports).trim().length > 0) ||
    (p.languagesKnown && String(p.languagesKnown).trim().length > 0) ||
    (Array.isArray(p.completedSections) && p.completedSections.includes('lifestyle'))
  );
  if (hasLifestyle) score += 10;

  // 5. Other Details (+5%)
  const hasOther = Boolean(
    (p.aboutMe && String(p.aboutMe).trim().length > 0) ||
    (p.collegeName && String(p.collegeName).trim().length > 0) ||
    Number(p.disabilityId || p.DisabilityId) > 0 ||
    (p.whatsAppNumber && String(p.whatsAppNumber).trim().length > 0) ||
    (Array.isArray(p.completedSections) && p.completedSections.includes('other'))
  );
  if (hasOther) score += 5;

  return Math.min(100, Math.max(50, score));
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

  const [profileData, setProfileData] = useState<any>(null);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isPhotoLoaded, setIsPhotoLoaded] = useState<boolean>(false);

  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [selectedPrivacy, setSelectedPrivacy] = useState<string>('All Members');
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  const getToken = useCallback(() => getAuthToken(), []);

  // ⚡ INSTANT 0ms HYDRATION FROM LOCAL CACHE
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("last_browse_page", "/dashboard/my-profile");
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

      const storedSub = localStorage.getItem("active_subscription");
      if (storedSub) {
        try {
          setActivePlan(JSON.parse(storedSub));
        } catch {}
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
  }, [getToken, router, profileData]);

  useEffect(() => {
    loadMyProfile();
  }, [loadMyProfile]);

  useEffect(() => {
    const handlePhotoUpdated = (e: any) => {
      const newPhoto = e?.detail?.photoUrl !== undefined ? e.detail.photoUrl : getStoredUserPhoto();
      setProfileData((prev: any) => ({
        ...prev,
        mainPhotoUrl: newPhoto,
        photoUrl: newPhoto,
        PhotoUrl: newPhoto,
        mainPhoto: newPhoto,
        photo: newPhoto
      }));
      loadMyProfile();
    };

    const handleSubUpdated = () => {
      loadMyProfile();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("user_photo_updated", handlePhotoUpdated);
      window.addEventListener("subscription_updated", handleSubUpdated);
      window.addEventListener("user_details_updated", handleSubUpdated);
      return () => {
        window.removeEventListener("user_photo_updated", handlePhotoUpdated);
        window.removeEventListener("subscription_updated", handleSubUpdated);
        window.removeEventListener("user_details_updated", handleSubUpdated);
      };
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

  const handleCopyMemberId = (id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(id);
      toast.success("Member ID copied to clipboard!");
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_token");
      localStorage.removeItem("user_session");
      localStorage.removeItem("user_details");
      document.cookie = "user_token=; path=/; max-age=0;";
    }
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
  const rawExpiry = activePlan?.expiresAt || activePlan?.ExpiresAt || activePlan?.expiryDate || activePlan?.ExpiryDate || profileData?.planExpiryDate || profileData?.PlanExpiryDate;
  
  const isExpired = Boolean(
    activePlan?.isExpired ?? activePlan?.IsExpired ?? profileData?.isPlanExpired ?? profileData?.IsPlanExpired ??
    (rawExpiry ? new Date(rawExpiry).getTime() < Date.now() : false)
  );

  const rawPlanName = activePlan?.planName || activePlan?.PlanName || profileData?.planName || profileData?.PlanName || '';
  const isPaid = !isExpired && Boolean(
    activePlan?.isPaid ?? activePlan?.IsPaid ?? 
    activePlan?.isActive ?? activePlan?.IsActive ?? 
    profileData?.isPaid ?? profileData?.IsPaid ?? 
    profileData?.isPremium ?? profileData?.IsPremium ??
    (rawPlanName && !rawPlanName.toLowerCase().includes('free'))
  );
  const planName = rawPlanName || (isPaid ? "VIP Member" : "Free Member");
  
  const formatExpiry = (exp: any) => {
    if (!exp) return "";
    try {
      const d = new Date(exp);
      if (isNaN(d.getTime())) return "";
      return `Valid till ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } catch {
      return "";
    }
  };
  const displayExpiry = formatExpiry(rawExpiry);

  // SVG circular completion calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (profileCompletion / 100) * circumference;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-28 pt-0 selection:bg-[#E21E5B] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      {/* 🏷️ TOP BAR (100% FIXED HEADER) */}
      <div className="fixed top-0 lg:top-20 inset-x-0 z-40 bg-white py-3 px-4 sm:px-6 border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            My Profile
          </h1>
          
          <button
            type="button"
            onClick={() => handleCopyMemberId(memberId)}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-full text-xs font-bold text-slate-700 active:scale-95 transition-all cursor-pointer shadow-2xs"
            title="Click to copy Member ID"
          >
            <span>ID: <strong className="text-slate-900 font-extrabold">{memberId}</strong></span>
            <Copy size={12} className="text-slate-500" />
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-14 lg:pt-20 space-y-4">
        
        {/* 🎴 1. MAIN PROFILE SUMMARY CARD (CIRCULAR RING AVATAR & STATS) */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100 text-center space-y-4 relative overflow-hidden">
          
          {/* AVATAR WITH CIRCULAR COMPLETION RING & CAMERA BUTTON */}
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

            {/* Photo inside Ring - Opens Gallery Directly */}
            <div 
              className="absolute inset-2 rounded-full overflow-hidden cursor-pointer group bg-slate-100"
              onClick={() => {
                if (typeof window !== "undefined") {
                  sessionStorage.setItem('gallery_return_url', '/dashboard/my-profile');
                }
                router.push('/dashboard/gallery');
              }}
              title="Click to manage photos"
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
                if (typeof window !== "undefined") {
                  sessionStorage.setItem('gallery_return_url', '/dashboard/my-profile');
                }
                router.push('/dashboard/gallery');
              }}
              className="absolute top-1 right-1 w-7 h-7 rounded-full bg-white border border-rose-200 text-[#E21E5B] shadow-sm flex items-center justify-center hover:bg-rose-50 transition-all cursor-pointer z-20"
              title="Manage Photos"
            >
              <Camera size={13} />
            </button>

            {/* Percentage Badge */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                if (typeof window !== "undefined") {
                  sessionStorage.setItem('gallery_return_url', '/dashboard/my-profile');
                }
                router.push('/dashboard/gallery');
              }}
              className="absolute -bottom-1 inset-x-0 mx-auto w-fit px-3 py-0.5 rounded-full bg-[#E21E5B] text-white text-[11px] font-black shadow-sm border-2 border-white z-20 cursor-pointer hover:scale-105 transition-transform"
              title="Click to view photo gallery"
            >
              {profileCompletion}%
            </div>
          </div>

          {/* STATUS PILL BADGE */}
          <div className="pt-1">
            {isIncomplete ? (
              <span 
                onClick={() => router.push('/dashboard/edit-profile')}
                className="inline-flex items-center px-4 py-1 rounded-full bg-rose-50 text-[#E21E5B] text-xs font-bold cursor-pointer hover:bg-rose-100 transition-colors"
              >
                Incomplete Profile &bull; Click to Edit
              </span>
            ) : (
              <span 
                onClick={() => {
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem('gallery_return_url', '/dashboard/my-profile');
                  }
                  router.push('/dashboard/gallery');
                }}
                className="inline-flex items-center px-4 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold cursor-pointer hover:bg-emerald-100 transition-colors"
                title="Profile Completed • Click to manage photos"
              >
                Profile Completed
              </span>
            )}
          </div>

          {/* NAME, VERIFIED BADGE & VIP CROWN */}
          <div className="space-y-1">
            <h2 
              onClick={() => router.push('/dashboard/edit-profile')}
              className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center justify-center gap-1.5 cursor-pointer hover:text-[#E21E5B] transition-colors"
              title="Click to edit profile"
            >
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
            <div className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center justify-center gap-1.5 pt-0.5">
              {isPaid ? (
                <>
                  <Crown size={15} className="fill-amber-400 text-amber-500" />
                  <span className="font-bold text-slate-900">{planName}</span>
                  {displayExpiry && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 font-medium">{displayExpiry}</span>
                    </>
                  )}
                </>
              ) : isExpired ? (
                <>
                  <span className="text-rose-600 font-bold">
                    Plan Expired {displayExpiry ? `(${displayExpiry})` : ''}
                  </span>
                  <span className="text-slate-300">•</span>
                  <Link prefetch={false} href="/dashboard/membership" className="text-[#E21E5B] font-extrabold hover:underline">
                    Renew Plan
                  </Link>
                </>
              ) : (
                <>
                  <span className="text-slate-500 font-medium">Free Member</span>
                  <span className="text-slate-300">•</span>
                  <Link prefetch={false} href="/dashboard/membership" className="text-[#E21E5B] font-bold hover:underline">
                    Upgrade to VIP
                  </Link>
                </>
              )}
            </div>
          </div>

        </div>

        {/* 👑 2. UPGRADE TO ADVANCED PLAN BANNER CARD */}
        <Link prefetch={false} href="/dashboard/membership"
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

        {/* 📋 3. STACKED APP-STYLE MENU OPTIONS LIST CARD */}
        <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden divide-y divide-slate-100">
          
          {/* 1. Edit my profile */}
          <Link prefetch={false} href="/dashboard/edit-profile"
            className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Edit3 size={18} className="text-slate-600 group-hover:text-[#E21E5B] transition-colors" />
              <span className="text-sm font-semibold text-slate-800">Edit my profile</span>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* 2. Partner Preference */}
          <Link prefetch={false} href="/dashboard/settings?tab=preferences"
            className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <SlidersHorizontal size={18} className="text-slate-600 group-hover:text-[#E21E5B] transition-colors" />
              <div className="text-left">
                <span className="text-sm font-semibold text-slate-800 block">Partner Preference</span>
                <span className="text-[11px] text-slate-400 block font-medium">Set ideal matches criteria</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* 3. Profile Privacy - Only visible when user has at least 1 photo */}
          {Boolean(profileData?.photoUrl || profileData?.mainPhotoUrl || profileData?.MainPhotoUrl || (profileData?.userPhotos && profileData.userPhotos.length > 0)) && (
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
          )}

          {/* 4. Explore Plans */}
          <Link prefetch={false} href="/dashboard/membership"
            className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Crown size={18} className="text-slate-600 group-hover:text-amber-500 transition-colors" />
              <span className="text-sm font-semibold text-slate-800">Explore Plans</span>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* 5. Payment Info */}
          <Link prefetch={false} href="/dashboard/payment-info"
            className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <CreditCard size={18} className="text-slate-600 group-hover:text-[#E21E5B] transition-colors" />
              <span className="text-sm font-semibold text-slate-800">Payment Info</span>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* 6. Help & Support */}
          <Link prefetch={false} href="/dashboard/support"
            className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <HelpCircle size={18} className="text-slate-600 group-hover:text-[#E21E5B] transition-colors" />
              <span className="text-sm font-semibold text-slate-800">Help & Support</span>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* 7. Account Settings */}
          <Link prefetch={false} href="/dashboard/settings"
            className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Settings size={18} className="text-slate-600 group-hover:text-[#E21E5B] transition-colors" />
              <div className="text-left">
                <span className="text-sm font-semibold text-slate-800 block">Account Settings</span>
                <span className="text-[11px] text-slate-400 block font-medium">Blocked users, notifications & manage</span>
              </div>
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
                  { value: 'Premium Only', title: 'Premium Only', desc: 'Visible only to verified paid VIP subscribers' },
                  { value: 'Only Approved', title: 'Only Approved', desc: 'Photos blurred until you accept photo request' }
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

    </div>
  );
}
