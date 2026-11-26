"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Edit3, CheckCircle2, ChevronRight, Crown, Settings, 
  ShieldCheck, CreditCard, HelpCircle, Camera, Lock,
  LogOut, Loader2, Sparkles, Check, Eye, Copy,
  SlidersHorizontal, FileText, Image as ImageIcon,
  ArrowUpRight, Phone, MessageSquare, Shield, Award
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
  const [selectedPrivacy, setSelectedPrivacy] = useState<string>('Visible to All');
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
        const privacyVal = p.photoPrivacy || p.PhotoPrivacy || 'Visible to All';
        setSelectedPrivacy(
          privacyVal === 'All Members' ? 'Visible to All' :
          privacyVal === 'Premium Only' ? 'VIP Only' :
          privacyVal === 'Only Approved' ? 'Parda Mode' : privacyVal
        );
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
    
    // Map to API recognized value
    const apiVal = 
      privacyOption === 'Visible to All' ? 'All Members' :
      privacyOption === 'VIP Only' ? 'Premium Only' :
      privacyOption === 'Parda Mode' ? 'Only Approved' : privacyOption;

    const res = await updatePhotoPrivacyApiCall(apiVal, token);
    setSavingPrivacy(false);
    if (res.success) {
      setSelectedPrivacy(privacyOption);
      toast.success("Photo privacy updated successfully!");
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
    router.push('/');
  };

  const handleCopyMemberId = (id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(id);
      toast.success(`Member ID #${id} copied!`);
    }
  };

  // Calculations
  const rawPhoto = profileData?.mainPhotoUrl || profileData?.photoUrl || profileData?.PhotoUrl || profileData?.mainPhoto || profileData?.photo;
  const hasRealPhoto = Boolean(rawPhoto && rawPhoto !== '/placeholder.png' && !String(rawPhoto).includes('default') && !String(rawPhoto).startsWith('data:image'));
  const photo = hasRealPhoto ? getOptimizedImageUrl(rawPhoto, profileData?.userId || 1, profileData?.gender) : getStoredUserPhoto();
  const fullName = profileData?.fullName || 'Valued Candidate';
  const isVerified = Boolean(profileData?.isVerified ?? profileData?.IsVerified ?? false);
  const profileCompletion = calculateRealProfileCompletion(profileData);

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
  const planName = rawPlanName || (isPaid ? "VIP Membership" : "Free Member");
  
  const remainingContacts = activePlan?.remainingContacts ?? activePlan?.RemainingContacts ?? profileData?.remainingContactsAllowed ?? 0;

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

  const quickMeta = [
    profileData?.age ? `${profileData.age} yrs` : '',
    profileData?.height ? `${profileData.height}ft` : '',
    profileData?.cityName || profileData?.city || profileData?.stateName || '',
    profileData?.profession || profileData?.occupation || ''
  ].filter(Boolean).join(" • ");

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-28 pt-0 selection:bg-[#E21E5B] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      {/* 🏷️ TOP BAR (100% FIXED HEADER) */}
      <div className="fixed top-0 lg:top-20 inset-x-0 z-40 bg-white py-3 px-4 sm:px-6 border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            My Profile Hub
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

      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-16 lg:pt-28 space-y-4 sm:space-y-5">
        
        {/* 🎴 1. BESPOKE VIP IDENTITY HERO CARD (MODERN BENTO STYLE) */}
        <div className="bg-gradient-to-br from-white via-white to-slate-50/60 rounded-3xl p-5 sm:p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-200/90 space-y-4 relative overflow-hidden">
          
          {/* TOP ROW: AVATAR & IDENTITY DETAILS */}
          <div className="flex items-center gap-4 sm:gap-5">
            {/* AVATAR CONTAINER */}
            <div className="relative shrink-0">
              <div 
                onClick={() => {
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem('gallery_return_url', '/dashboard/my-profile');
                  }
                  router.push('/dashboard/gallery');
                }}
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-md relative cursor-pointer group"
                title="Manage Photo Album"
              >
                {hasRealPhoto && !isPhotoLoaded && (
                  <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center z-10">
                    <Loader2 size={20} className="animate-spin text-slate-400" />
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

              {/* Mini Camera Edit Pill */}
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem('gallery_return_url', '/dashboard/my-profile');
                  }
                  router.push('/dashboard/gallery');
                }}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm flex items-center justify-center hover:bg-rose-50 hover:text-[#d91b5c] transition-all cursor-pointer z-20 active:scale-90"
                title="Upload Photo"
              >
                <Camera size={13} className="stroke-[2.2]" />
              </button>
            </div>

            {/* CANDIDATE INFO */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                  {fullName}
                </h2>
                {isVerified && (
                  <span title="Verified Matrimonial Candidate">
                    <CheckCircle2 size={17} className="fill-[#0284C7] text-white shrink-0" />
                  </span>
                )}
                {isPaid && (
                  <span title="VIP Member">
                    <Crown size={15} className="fill-amber-400 text-amber-500 shrink-0" />
                  </span>
                )}
              </div>

              {quickMeta && (
                <p className="text-xs font-semibold text-slate-500 truncate">
                  {quickMeta}
                </p>
              )}

              {/* Status Badge */}
              <div className="pt-0.5">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isPaid 
                    ? 'bg-amber-50 text-amber-800 border border-amber-200/80'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {isPaid ? <Crown size={11} className="fill-amber-400 text-amber-600" /> : <Award size={11} className="text-slate-500" />}
                  <span>{planName}</span>
                </span>
              </div>
            </div>
          </div>

          {/* PROFILE COMPLETION PROGRESS BAR */}
          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#d91b5c]" />
                <span>Biodata Strength</span>
              </span>
              <span className="font-extrabold text-[#d91b5c]">{profileCompletion}%</span>
            </div>

            {/* Track */}
            <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#d91b5c] to-rose-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>

            {profileCompletion < 100 && (
              <p className="text-[11px] font-medium text-slate-500">
                100% complete profiles get up to 5X more marriage proposals.
              </p>
            )}
          </div>

          {/* TWO PRIMARY QUICK ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => router.push('/dashboard/edit-profile')}
              className="py-2.5 px-3 rounded-2xl bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
            >
              <Edit3 size={14} />
              <span>Edit Biodata</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem('last_browse_page', '/dashboard/my-profile');
                router.push(`/dashboard/profile?userId=${userIdNum}`);
              }}
              className="py-2.5 px-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
            >
              <Eye size={14} className="text-slate-600" />
              <span>Public Preview</span>
            </button>
          </div>
        </div>

        {/* 👑 2. MEMBERSHIP BENTO STATUS CARD */}
        {isPaid ? (
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 border border-emerald-200/80 rounded-3xl p-4 sm:p-5 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase text-emerald-800 tracking-wide">
                <Sparkles size={14} className="text-emerald-600" />
                <span>Active VIP Membership</span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">{planName}</h3>
              <p className="text-[11px] font-semibold text-emerald-700">{displayExpiry}</p>
            </div>

            <div className="text-right space-y-1.5 shrink-0">
              <span className="inline-block bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-2xs">
                {remainingContacts} Contacts Left
              </span>
              <div>
                <Link
                  href="/dashboard/membership"
                  className="text-xs font-bold text-emerald-800 hover:underline block"
                >
                  Manage Plan &rarr;
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <Link
            href="/dashboard/membership"
            className="bg-gradient-to-r from-amber-50/90 via-rose-50/40 to-amber-50/90 hover:from-amber-100/90 hover:to-amber-100/90 border border-amber-200/80 rounded-3xl p-4 sm:p-5 flex items-center justify-between text-slate-900 transition-all shadow-xs group cursor-pointer block"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-400/20 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300/40">
                <Crown size={22} className="fill-amber-400 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-[#d91b5c] transition-colors">
                  Upgrade to VIP Membership
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Unlock verified phone numbers, direct messaging & top ranking
                </p>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 group-hover:bg-[#d91b5c] group-hover:text-white group-hover:border-[#d91b5c] transition-all shrink-0 ml-2 shadow-2xs">
              <ChevronRight size={16} />
            </div>
          </Link>
        )}

        {/* 📋 3. SECTION 1: MATRIMONIAL BIODATA & ALBUM HUB */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 pl-1">
            Matrimonial Biodata & Album
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Card 1: Manage Biodata */}
            <Link
              href="/dashboard/edit-profile"
              className="p-4 rounded-3xl bg-white hover:bg-slate-50 border border-slate-200/90 shadow-xs transition-all flex items-start gap-3.5 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#d91b5c] border border-rose-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#d91b5c] transition-colors">
                  Personal & Family Details
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                  Bio, Education, Profession, Sect & Deen values
                </p>
              </div>
            </Link>

            {/* Card 2: Photo Gallery */}
            <Link
              href="/dashboard/gallery"
              className="p-4 rounded-3xl bg-white hover:bg-slate-50 border border-slate-200/90 shadow-xs transition-all flex items-start gap-3.5 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ImageIcon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Photo Gallery & Album
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                  Manage up to 4 solo photos with AI face verification
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* 🔒 4. SECTION 2: MATCHMAKING FILTERS & PRIVACY */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 pl-1">
            Privacy & Match Criteria
          </h3>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {/* Parda & Photo Privacy */}
            <button
              type="button"
              onClick={() => setIsPrivacyModalOpen(true)}
              className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block group-hover:text-[#d91b5c] transition-colors">
                    Parda & Photo Visibility
                  </span>
                  <span className="text-xs text-slate-500 font-medium block">
                    Mode: <strong className="text-slate-800">{selectedPrivacy}</strong>
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Partner Match Criteria */}
            <Link
              href="/dashboard/settings"
              className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <SlidersHorizontal size={18} />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block group-hover:text-[#d91b5c] transition-colors">
                    Partner Match Criteria
                  </span>
                  <span className="text-xs text-slate-500 font-medium block">
                    Preferred Age, Height, Sect, Caste & Location
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* 💳 5. SECTION 3: MEMBERSHIP & ASSISTANCE */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 pl-1">
            Membership, Billing & Support
          </h3>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {/* VIP Matchmaking Packages */}
            <Link
              href="/dashboard/membership"
              className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Crown size={18} />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block group-hover:text-amber-600 transition-colors">
                    VIP Matchmaking Packages
                  </span>
                  <span className="text-xs text-slate-500 font-medium block">
                    View Silver, Gold & Diamond subscription plans
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Billing & Tax Invoices */}
            <Link
              href="/dashboard/payment-info"
              className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CreditCard size={18} />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block group-hover:text-emerald-700 transition-colors">
                    Billing & Tax Invoices
                  </span>
                  <span className="text-xs text-slate-500 font-medium block">
                    Order history, GST invoices & contact quota status
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* 24x7 Counselor Helpdesk */}
            <Link
              href="/dashboard/support"
              className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#d91b5c] flex items-center justify-center shrink-0">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block group-hover:text-[#d91b5c] transition-colors">
                    24x7 Relationship Advisory
                  </span>
                  <span className="text-xs text-slate-500 font-medium block">
                    Direct WhatsApp help & customer support desk
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* 🚪 6. SECTION 4: SIGN OUT BUTTON */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full p-4 rounded-3xl bg-white hover:bg-rose-50/50 border border-rose-100 flex items-center justify-center gap-2 text-rose-600 hover:text-rose-700 transition-all font-bold text-sm cursor-pointer shadow-xs active:scale-98"
          >
            <LogOut size={16} />
            <span>Secure Sign Out</span>
          </button>
        </div>

      </div>

      {/* 🔒 PHOTO & PROFILE PRIVACY MODAL */}
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
                <h3 className="text-lg font-bold text-slate-900">Parda & Photo Visibility</h3>
                <p className="text-xs text-slate-500">Choose who can view your photo gallery on Nikah Qubool.</p>
              </div>

              <div className="space-y-2 pt-2">
                {[
                  { value: 'Visible to All', title: 'Visible to All', desc: 'Visible to all verified members (Recommended for fastest proposals)' },
                  { value: 'VIP Only', title: 'VIP Members Only', desc: 'Visible only to verified paid VIP subscribers' },
                  { value: 'Parda Mode', title: 'Parda Mode (Locked)', desc: 'Photos blurred with halal parda until you approve photo request' }
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
