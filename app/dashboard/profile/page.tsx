"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, MoreVertical, Info, GraduationCap, 
  Users, Moon, Sparkles, Heart, CheckCircle2, Lock, 
  Flag, Ban, Star, MessageCircle, Loader2, ChevronLeft, ChevronRight, Crown, Camera,
  MapPin, Briefcase, Calendar, User, ShieldCheck, Check, X, Maximize2, ExternalLink,
  BookOpen, Home, HeartHandshake, Compass, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { fetchProfileDetailsApi, viewContactDetailsApi, handleInteractionApiCall, blockUserApiCall } from '@/lib/api';
import { getOptimizedImageUrl } from '@/lib/imageUtils';
import SubscriptionModal from '@/components/dashboard/SubscriptionModal';

interface SectionTab {
  id: string;
  label: string;
  icon: any;
}

const SECTION_TABS: SectionTab[] = [
  { id: 'section-about', label: 'About', icon: Info },
  { id: 'section-basic', label: 'Basic Info', icon: User },
  { id: 'section-education', label: 'Education & Career', icon: GraduationCap },
  { id: 'section-religious', label: 'Religious', icon: Moon },
  { id: 'section-family', label: 'Family', icon: Home },
  { id: 'section-preferences', label: 'Preferences', icon: HeartHandshake },
];

export default function ProfileDetailPage() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<any>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contactData, setContactData] = useState<{ mobile: string; email: string } | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionLoadingType, setActionLoadingType] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showThreeDotMenu, setShowThreeDotMenu] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [activeTabId, setActiveTabId] = useState<string>('section-about');

  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop()?.split(';').shift() : null;
  };

  const getToken = useCallback(() => getCookie("user_token"), []);

  const loadProfileDetails = useCallback(async (showFullLoader: boolean = true) => {
    const token = getToken();
    if (!token) {
      router.push('/');
      return;
    }

    let targetUserId = 0;
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlId = urlParams.get('userId') || urlParams.get('id') || urlParams.get('targetUserId');
      if (urlId && parseInt(urlId, 10) > 0) {
        targetUserId = parseInt(urlId, 10);
      } else {
        const storedSession = sessionStorage.getItem("viewing_profile_target");
        const storedLocal = localStorage.getItem("viewing_profile_target");
        const stored = storedSession || storedLocal;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            targetUserId = parsed.userId || parsed.targetUserId || parsed.id || 0;
          } catch (e) {}
        }
      }
    }

    if (!targetUserId || targetUserId <= 0) {
      toast.error("Profile context missing.");
      router.push('/dashboard');
      return;
    }

    if (showFullLoader) setLoading(true);
    const res = await fetchProfileDetailsApi(targetUserId, token);

    if (res.isUnauthorized) {
      toast.dismiss();
      toast.error("Session expired.");
      router.push('/');
      return;
    }

    if (res.success && res.data) {
      const p = res.data.profile || res.data.Profile || res.data;
      setProfileData(p);
      setGallery(res.data.gallery || res.data.Gallery || []);
      setPreferences(res.data.preferences || res.data.Preferences || null);
    } else if (showFullLoader) {
      toast.error(res.message || "Failed to load profile details.");
    }
    if (showFullLoader) setLoading(false);
  }, [getToken, router]);

  useEffect(() => {
    loadProfileDetails(true);
  }, [loadProfileDetails]);

  // 📜 SCROLL SPY EFFECT TO AUTOMATICALLY UPDATE ACTIVE TAB WHILE SCROLLING
  useEffect(() => {
    if (!profileData) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;

      for (let i = SECTION_TABS.length - 1; i >= 0; i--) {
        const section = document.getElementById(SECTION_TABS[i].id);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveTabId(SECTION_TABS[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [profileData]);

  const scrollToSection = (id: string) => {
    setActiveTabId(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -110;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleUnlockContact = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    
    const isUserPaid = Boolean(profileData?.isCurrentUserPaid ?? profileData?.IsCurrentUserPaid);
    if (!isUserPaid) {
      setShowSubscriptionModal(true);
      return;
    }

    const token = getToken();
    setActionLoading(true);
    const res = await viewContactDetailsApi(profileData.userId, token);
    setActionLoading(false);

    if (res.success && res.data) {
      const mob = res.data.mobileNumber || res.data.MobileNumber;
      const eml = res.data.email || res.data.Email;

      if (mob || eml) {
        setContactData({ mobile: mob, email: eml });
        toast.success(res.message || "Contact details unlocked!");
      } else {
        setShowSubscriptionModal(true);
      }
    } else {
      toast.error(res.message || "Failed to unlock contact details.");
      setShowSubscriptionModal(true);
    }
  };

  const handleInteraction = async (e: React.MouseEvent | null, type: string, status: string = 'PENDING') => {
    if (e) { e.preventDefault(); e.stopPropagation(); }

    const token = getToken();
    setActionLoading(true);
    setActionLoadingType(type);

    if (type === 'PHOTO_REQUEST') {
      setProfileData((prev: any) => ({
        ...prev,
        hasRequestedPhoto: true,
        photoRequestStatus: 'SentPending'
      }));
    }

    const res = await handleInteractionApiCall(profileData.userId, type, status, token);
    setActionLoading(false);
    setActionLoadingType(null);
    setShowThreeDotMenu(false);

    if (res.success) {
      if (type === 'INTEREST') {
        setProfileData((prev: any) => ({
          ...prev,
          interestStatus: status === 'ACCEPTED' ? 'Accepted' : status === 'DECLINED' ? 'Declined' : 'SentPending'
        }));
      } else if (type === 'SHORTLIST') {
        setProfileData((prev: any) => ({
          ...prev,
          isShortlisted: status === 'ACTIVE'
        }));
      }
      loadProfileDetails(false);
    } else {
      loadProfileDetails(false);
    }
  };

  const handleBlockUser = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }

    const token = getToken();
    setActionLoading(true);
    const res = await blockUserApiCall(profileData.userId, token);
    setActionLoading(false);
    setShowThreeDotMenu(false);
    toast.dismiss();

    if (res.success) {
      toast.success(res.message || "User blocked successfully.");
      router.push('/dashboard');
    } else {
      toast.error(res.message || "Failed to block user.");
    }
  };

  const handleInitiateChat = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const isUserPaid = Boolean(profileData?.isCurrentUserPaid ?? profileData?.IsCurrentUserPaid);
    if (isUserPaid) {
      sessionStorage.setItem('active_chat_target', JSON.stringify({
        userId: profileData.userId,
        fullName: profileData.fullName,
        photoUrl: profileData.mainPhotoUrl || ''
      }));
      router.push('/dashboard/messages');
    } else {
      setShowSubscriptionModal(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-[#d91b5c]">
        <Loader2 className="animate-spin mb-3 text-[#d91b5c]" size={48} />
        <span className="font-black text-xs uppercase tracking-widest text-slate-500">Loading Candidate Details...</span>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-[#d91b5c] mb-4 shadow-sm">
          <User size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Profile Not Found</h2>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          This candidate profile could not be loaded or may no longer be available.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-2.5 bg-[#d91b5c] text-white font-bold text-sm rounded-xl shadow-md hover:bg-[#6b0932] transition-all cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const allPhotos = gallery.length > 0 ? gallery : [{ photoUrl: profileData.mainPhotoUrl || profileData.photoUrl || '/placeholder.png' }];
  const interestStatus = profileData.interestStatus || profileData.InterestStatus || 'None';
  const fullName = profileData.fullName || profileData.FullName || "Member Profile";

  const rawPrivacy = profileData.photoPrivacy || profileData.PhotoPrivacy || 'All Members';
  const privacyClean = String(rawPrivacy).toLowerCase().replace(/\s+/g, '');
  const isUserPaid = Boolean(profileData.isCurrentUserPaid ?? profileData.IsCurrentUserPaid);
  const hasRequestedPhoto = Boolean(profileData.hasRequestedPhoto ?? profileData.HasRequestedPhoto);
  const rawPhotoReqStatus = String(profileData.photoRequestStatus || profileData.PhotoRequestStatus || '').toUpperCase();

  const isSpHidden = Boolean(profileData.isPhotoHidden ?? profileData.IsPhotoHidden);
  const isPhotoReqAccepted = rawPhotoReqStatus.includes('ACCEPT');
  const isPhotoReqSent = hasRequestedPhoto || rawPhotoReqStatus.includes('SENT') || rawPhotoReqStatus.includes('PENDING');

  const isPhotoHidden = !isPhotoReqAccepted && (
    isSpHidden 
    || (privacyClean.includes('premium') && !isUserPaid)
    || (privacyClean.includes('onlyapproved') || privacyClean.includes('protected'))
  );

  const isVerified = Boolean(profileData.isVerified ?? profileData.IsVerified);
  const isPremium = Boolean(profileData.isPremium ?? profileData.IsPremium ?? isUserPaid);
  const rawPhotoSrc = allPhotos[activePhotoIndex]?.photoUrl || profileData.mainPhotoUrl || profileData.photoUrl;
  const currentPhotoSrc = getOptimizedImageUrl(rawPhotoSrc);

  const displayAge = profileData.age || 24;
  const maritalStatus = profileData.maritalStatus || 'Never Married';
  const sect = profileData.sect || 'Sunni';
  const isOnline = Boolean(profileData.isOnline ?? profileData.IsOnline ?? false);

  const isInterestSent = Boolean(
    profileData.isInterestSent || profileData.IsInterestSent || 
    interestStatus === 'SentPending' || interestStatus.includes('Sent') ||
    interestStatus === 'SENT' || interestStatus === 'PENDING' || interestStatus === 'Sent'
  );
  const isInterestReceived = interestStatus === 'ReceivedPending' || interestStatus === 'Received';
  const isConnected = interestStatus === 'Accepted' || interestStatus === 'ACCEPTED' || Boolean(profileData.isCanChat ?? profileData.IsCanChat);
  const isShortlisted = Boolean(profileData.isShortlisted || profileData.IsShortlisted);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 w-full relative selection:bg-[#d91b5c] selection:text-white pb-20">
      <Toaster position="top-center" richColors duration={2000} />

      <div className="max-w-4xl mx-auto md:py-6 md:px-4 space-y-5">
        
        {/* 🖼️ HERO PROFILE PHOTO CONTAINER & OVERLAY */}
        <div className="relative w-full rounded-b-3xl md:rounded-3xl overflow-hidden bg-slate-950 shadow-xl border border-slate-200/80">
          
          {/* HEADER NAV BAR (BACK BUTTON & 3-DOT MENU) */}
          <div className="absolute top-4 inset-x-4 z-30 flex items-center justify-between pointer-events-auto">
            <button 
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-slate-950/60 hover:bg-slate-950/80 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-md cursor-pointer transition-all active:scale-90"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowThreeDotMenu(!showThreeDotMenu)}
                className="w-10 h-10 rounded-full bg-slate-950/60 hover:bg-slate-950/80 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-md cursor-pointer transition-all active:scale-90"
                aria-label="More Options"
              >
                <MoreVertical size={20} />
              </button>

              <AnimatePresence>
                {showThreeDotMenu && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-1.5 z-50 overflow-hidden"
                  >
                    <button 
                      onClick={handleBlockUser}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Ban size={16} />
                      <span>Block Account</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* MAIN PHOTO FRAME */}
          <div className="relative aspect-[4/5] md:aspect-[16/9] w-full bg-slate-950">
            <img 
              src={currentPhotoSrc}
              alt={fullName}
              className={`w-full h-full object-cover object-top transition-all duration-500 ${isPhotoHidden ? 'blur-xl scale-110 opacity-70' : ''}`}
            />

            {/* FULL PHOTO VIEW BUTTON */}
            {!isPhotoHidden && (
              <button 
                onClick={() => setShowPhotoModal(true)}
                className="absolute top-4 right-16 z-30 w-10 h-10 rounded-full bg-slate-950/60 hover:bg-slate-950/80 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-md cursor-pointer transition-all active:scale-90"
                title="View Full Screen Photo"
              >
                <Maximize2 size={18} />
              </button>
            )}

            {/* PHOTO HIDDEN PRIVACY BADGE */}
            {isPhotoHidden && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-950/60 backdrop-blur-md text-white space-y-3">
                <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300">
                  <Lock size={28} />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="font-bold text-base">Photo Protected</h4>
                  <p className="text-xs text-slate-300">This member has protected their profile photos.</p>
                </div>
                {!isPhotoReqSent && (
                  <button
                    onClick={(e) => handleInteraction(e, 'PHOTO_REQUEST', 'PENDING')}
                    disabled={actionLoading}
                    className="px-5 py-2 bg-[#d91b5c] text-white font-bold text-xs rounded-full shadow-lg hover:bg-[#b01348] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Camera size={14} />
                    <span>Request Photo Access</span>
                  </button>
                )}
              </div>
            )}

            {/* GRADIENT OVERLAY */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent pointer-events-none z-20" />

            {/* CANDIDATE NAME, AGE & BADGES */}
            <div className="absolute bottom-4 inset-x-5 z-30 text-white pointer-events-none flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap drop-shadow-md">
                <h2 className="font-serif font-extrabold text-2xl md:text-3xl uppercase tracking-wide flex items-center gap-2">
                  <span>{fullName}, {displayAge}</span>
                </h2>
                <div className="flex items-center gap-1.5 inline-flex align-middle">
                  {isVerified && <CheckCircle2 size={20} className="fill-emerald-500 text-slate-950" />}
                  {isPremium && <Crown size={20} className="fill-amber-400 text-amber-400 drop-shadow-xs" />}
                  {isOnline && (
                    <span className="flex items-center gap-1 bg-emerald-950/80 backdrop-blur-sm border border-emerald-400/50 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Online</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🚀 STICKY MINI TABS NAVIGATION BAR (BELOW HERO IMAGE - SCROLL SPY + CLICK TO SCROLL) */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-y border-slate-200/80 shadow-xs py-2.5 px-4 my-2 -mx-4 md:mx-0 md:rounded-2xl">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
            {SECTION_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTabId === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#d91b5c] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <Icon size={13} className={isActive ? 'text-white' : 'text-slate-500'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 📋 PROFILE SECTIONS GRID (DIVIDED INTO DISTINCT CARDS WITH ANCHOR IDs) */}
        <div className="space-y-6 px-4 md:px-0">

          {/* 1. 📌 ABOUT SECTION */}
          <section id="section-about" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-[#d91b5c] flex items-center justify-center">
                <Info size={18} />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-800">About {fullName}</h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed font-sans bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
              "{profileData.aboutMe || 'Looking for a respectful, family-oriented partner for a happy and blessed Nikah.'}"
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-rose-50/50 p-3 rounded-2xl border border-rose-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Profile For</span>
                <span className="text-xs font-bold text-[#d91b5c]">{profileData.profileCreatedFor || 'Self'}</span>
              </div>
              <div className="bg-rose-50/50 p-3 rounded-2xl border border-rose-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Match Score</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
                  <Sparkles size={12} className="fill-amber-400 text-amber-400" />
                  <span>{profileData.matchScore || 92}% Match</span>
                </span>
              </div>
              <div className="bg-rose-50/50 p-3 rounded-2xl border border-rose-100 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Verification</span>
                <span className="text-xs font-bold text-slate-700">{isVerified ? 'Verified Member' : 'Standard Profile'}</span>
              </div>
            </div>
          </section>

          {/* 2. 👤 BASIC & PERSONAL DETAILS */}
          <section id="section-basic" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-[#d91b5c] flex items-center justify-center">
                <User size={18} />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-800">Basic & Personal Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailRow label="Age" value={`${displayAge} Years`} />
              <DetailRow label="Marital Status" value={maritalStatus} />
              <DetailRow label="Height" value={profileData.height || '5ft 6in'} />
              <DetailRow label="Weight" value={profileData.weight || 'Not Disclosed'} />
              <DetailRow label="Complexion" value={profileData.complexion || 'Fair'} />
              <DetailRow label="Mother Tongue" value={profileData.motherTongue || 'Urdu'} />
              <DetailRow label="Current City & State" value={`${profileData.currentCityName || 'City'}, ${profileData.currentStateName || 'State'}`} />
              <DetailRow label="Native Place" value={`${profileData.nativeCityName || profileData.currentCityName || 'City'}, ${profileData.nativeStateName || profileData.currentStateName || 'State'}`} />
            </div>
          </section>

          {/* 3. 🎓 EDUCATION & CAREER */}
          <section id="section-education" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-[#d91b5c] flex items-center justify-center">
                <GraduationCap size={18} />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-800">Education & Career</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailRow label="Highest Qualification" value={profileData.highestDegree || 'Graduate'} />
              <DetailRow label="College / University" value={profileData.collegeName || 'Not Disclosed'} />
              <DetailRow label="Employment Sector" value={profileData.employmentSector || 'Private Sector'} />
              <DetailRow label="Designation / Profession" value={profileData.designation || profileData.occupationDetails || 'Professional'} />
              <DetailRow label="Annual Income" value={profileData.annualIncome ? `Earns ${profileData.annualIncome}` : 'Not Disclosed'} highlight />
            </div>
          </section>

          {/* 4. 🕌 RELIGIOUS & CULTURAL DETAILS */}
          <section id="section-religious" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-[#d91b5c] flex items-center justify-center">
                <Moon size={18} />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-800">Religious & Cultural Background</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailRow label="Religion" value="Islam" />
              <DetailRow label="Sect" value={sect} />
              <DetailRow label="Maslak" value={profileData.maslak || 'Sunni / Hanafi'} />
              <DetailRow label="Caste / Sub-Caste" value={profileData.caste || 'Syed'} />
              <DetailRow label="Dietary Preference" value={profileData.dietType || 'Halal Non-Veg'} />
            </div>
          </section>

          {/* 5. 🏡 FAMILY DETAILS */}
          <section id="section-family" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-[#d91b5c] flex items-center justify-center">
                <Home size={18} />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-800">Family Background</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailRow label="Family Type" value={profileData.familyType || 'Nuclear Family'} />
              <DetailRow label="Family Status" value={profileData.familyStatus || 'Upper Middle Class'} />
              <DetailRow label="Father's Occupation" value={profileData.fatherOccupation || 'Business'} />
              <DetailRow label="Mother's Occupation" value={profileData.motherOccupation || 'Homemaker'} />
              <DetailRow label="Brothers" value={`${profileData.totalBrothers || 0} Brother(s) (${profileData.marriedBrothers || 0} Married)`} />
              <DetailRow label="Sisters" value={`${profileData.totalSisters || 0} Sister(s) (${profileData.marriedSisters || 0} Married)`} />
            </div>

            {profileData.familyAbout && (
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-500 uppercase block mb-1">About Family</span>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {profileData.familyAbout}
                </p>
              </div>
            )}
          </section>

          {/* 6. 🎯 PARTNER PREFERENCES */}
          <section id="section-preferences" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-[#d91b5c] flex items-center justify-center">
                <HeartHandshake size={18} />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-800">Partner Preferences</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailRow label="Preferred Age" value={preferences?.minAge ? `${preferences.minAge} to ${preferences.maxAge} Years` : '21 - 32 Years'} />
              <DetailRow label="Preferred Height" value={preferences?.minHeight ? `${preferences.minHeight} - ${preferences.maxHeight}` : '5ft 2in - 6ft 0in'} />
              <DetailRow label="Preferred Marital Status" value={preferences?.preferredMaritalStatus || preferences?.maritalStatus || 'Never Married'} />
              <DetailRow label="Preferred Sect" value={preferences?.preferredSect || preferences?.sect || 'Any Sect'} />
              <DetailRow label="Preferred Caste" value={preferences?.preferredCaste || preferences?.caste || 'Any Caste'} />
              <DetailRow label="Preferred Education" value={preferences?.preferredEducation || preferences?.education || 'Graduate / Master'} />
              <DetailRow label="Preferred Profession" value={preferences?.preferredOccupation || preferences?.occupation || 'Any Profession'} />
              <DetailRow label="Preferred Location" value={preferences?.preferredState || preferences?.state || 'Any Location'} />
            </div>
          </section>

          {/* 📱 DIRECT CANDIDATE CONTACT DETAILS CARD */}
          <section className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-lg space-y-4 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <Phone size={18} />
                </div>
                <h3 className="font-serif font-bold text-lg text-white">Direct Candidate Contact</h3>
              </div>
            </div>

            {contactData ? (
              <div className="space-y-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <DetailRow label="Mobile Number" value={contactData.mobile || 'Unlocked'} dark />
                <DetailRow label="Email Address" value={contactData.email || 'Unlocked'} dark />
              </div>
            ) : (
              <div className="py-3 text-center space-y-3">
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Unlock direct contact number to connect for Halal marriage proposal.
                </p>
                <button
                  onClick={handleUnlockContact}
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#d91b5c] to-[#e11d48] text-white font-bold text-xs rounded-full shadow-lg hover:shadow-rose-900/40 transition-all cursor-pointer flex items-center gap-2 mx-auto"
                >
                  <Lock size={14} />
                  <span>Unlock Contact Number</span>
                </button>
              </div>
            )}
          </section>

        </div>
      </div>

      {/* 🔴 ACTION ICON BUTTONS ROW (TRANSPARENT FLOATING BAR AT BOTTOM OF VIEWPORT) */}
      <div className="fixed bottom-4 inset-x-0 z-50 py-2 px-6 flex items-start justify-center gap-6 max-w-md mx-auto pointer-events-none">
        
        {/* 1. ❤️ INTEREST BUTTON */}
        {isInterestReceived ? (
          <div className="flex items-start gap-4 pointer-events-auto">
            <div className="flex flex-col items-center gap-1">
              <motion.button 
                type="button"
                whileHover={{ scale: 1.12, y: -2 }}
                whileTap={{ scale: 0.85 }}
                onClick={(e) => handleInteraction(e, 'INTEREST', 'ACCEPTED')}
                disabled={actionLoading}
                className="w-13 h-13 rounded-full bg-[#e6f7ec] hover:bg-[#d1fae5] text-[#16a34a] border-2 border-emerald-400 shadow-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                aria-label="Accept Proposal"
              >
                {(actionLoading && actionLoadingType === 'INTEREST') ? (
                  <Loader2 size={22} className="animate-spin text-[#16a34a]" />
                ) : (
                  <Check size={24} className="text-[#16a34a] stroke-[3]" />
                )}
              </motion.button>
              <span className="text-[10px] font-extrabold text-slate-800 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider border border-slate-200">
                Accept
              </span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <motion.button 
                type="button"
                whileHover={{ scale: 1.12, y: -2 }}
                whileTap={{ scale: 0.85 }}
                onClick={(e) => handleInteraction(e, 'INTEREST', 'DECLINED')}
                disabled={actionLoading}
                className="w-13 h-13 rounded-full bg-[#fde8e8] hover:bg-[#ffe4e6] text-[#f43f5e] border-2 border-rose-400 shadow-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                aria-label="Decline Proposal"
              >
                <X size={24} className="text-[#f43f5e] stroke-[3]" />
              </motion.button>
              <span className="text-[10px] font-extrabold text-slate-800 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider border border-slate-200">
                Decline
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 pointer-events-auto">
            <motion.button 
              type="button"
              whileHover={(isInterestSent || isConnected) ? {} : { scale: 1.12, y: -2 }}
              whileTap={(isInterestSent || isConnected) ? {} : { scale: 0.85 }}
              onClick={(e) => {
                if (!isInterestSent && !isConnected) {
                  handleInteraction(e, 'INTEREST', 'PENDING');
                }
              }}
              disabled={actionLoading || isInterestSent || isConnected}
              className={`w-13 h-13 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 ${
                isInterestSent || isConnected
                  ? 'bg-[#2A2D32] border-2 border-[#3F444D] cursor-not-allowed opacity-90' 
                  : 'bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] text-white border-2 border-rose-300/40 cursor-pointer shadow-rose-950/40'
              }`}
              aria-label="Send Interest"
              title={isInterestSent ? 'Interest Sent' : isConnected ? 'Connected' : 'Send Interest'}
            >
              {(actionLoading && actionLoadingType === 'INTEREST') ? (
                <Loader2 size={22} className="animate-spin text-white" />
              ) : isInterestSent || isConnected ? (
                <Heart size={22} className="fill-[#8E95A2] text-[#8E95A2]" />
              ) : (
                <Heart size={22} className="fill-white text-white drop-shadow-xs" />
              )}
            </motion.button>
            <span className="text-[10px] font-extrabold text-slate-800 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider border border-slate-200">
              {isInterestSent ? 'Sent' : isConnected ? 'Connected' : 'Interest'}
            </span>
          </div>
        )}

        {/* 2. 💬 CHAT BUTTON */}
        <div className="flex flex-col items-center gap-1 pointer-events-auto">
          <motion.button 
            type="button"
            whileHover={{ scale: 1.12, y: -2 }}
            whileTap={{ scale: 0.85 }}
            onClick={handleInitiateChat}
            disabled={actionLoading}
            className="w-13 h-13 rounded-full bg-slate-900 hover:bg-[#d91b5c] text-white border-2 border-slate-700 shadow-xl flex items-center justify-center cursor-pointer active:scale-95 transition-colors"
            aria-label="Direct Message"
          >
            {(actionLoading && actionLoadingType === 'CHAT') ? (
              <Loader2 size={22} className="animate-spin text-white" />
            ) : (
              <MessageCircle size={22} className="fill-white text-white" />
            )}
          </motion.button>
          <span className="text-[10px] font-extrabold text-slate-800 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider border border-slate-200">
            Chat
          </span>
        </div>

        {/* 3. ⭐ SHORTLIST STAR ICON BUTTON */}
        <div className="flex flex-col items-center gap-1 pointer-events-auto">
          <motion.button 
            type="button"
            whileHover={{ scale: 1.12, y: -2 }}
            whileTap={{ scale: 0.85 }}
            onClick={(e) => handleInteraction(e, 'SHORTLIST', isShortlisted ? 'REMOVED' : 'ACTIVE')}
            disabled={actionLoading}
            className={`w-13 h-13 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 border-2 ${
              isShortlisted 
                ? 'bg-amber-50 text-amber-500 border-amber-300 shadow-xs' 
                : 'bg-white hover:bg-rose-50 text-[#d91b5c] border-slate-200'
            }`}
            aria-label="Shortlist Profile"
          >
            {(actionLoading && actionLoadingType === 'SHORTLIST') ? (
              <Loader2 size={22} className="animate-spin text-amber-500" />
            ) : (
              <Star 
                size={22} 
                className={isShortlisted ? 'fill-amber-500 text-amber-500' : 'text-amber-500 fill-none'} 
              />
            )}
          </motion.button>
          <span className="text-[10px] font-extrabold text-slate-800 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider border border-slate-200">
            {isShortlisted ? 'Saved' : 'Shortlist'}
          </span>
        </div>

      </div>

      {/* FULL PHOTO VIEW MODAL */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <button 
            onClick={() => setShowPhotoModal(false)}
            className="absolute top-6 right-6 text-white hover:text-rose-400 z-50 cursor-pointer transition-all"
          >
            <X size={32} />
          </button>

          {allPhotos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1))}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white flex items-center justify-center z-50 cursor-pointer transition-all"
                title="Previous Photo"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                type="button"
                onClick={() => setActivePhotoIndex((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0))}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white flex items-center justify-center z-50 cursor-pointer transition-all"
                title="Next Photo"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          <img 
            src={currentPhotoSrc} 
            alt={fullName} 
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* SUBSCRIPTION MODAL FOR UNPAID USERS */}
      {showSubscriptionModal && (
        <SubscriptionModal 
          isOpen={showSubscriptionModal} 
          onClose={() => setShowSubscriptionModal(false)} 
        />
      )}

    </div>
  );
}

function DetailRow({ label, value, highlight = false, dark = false }: { label: string; value: string; highlight?: boolean; dark?: boolean }) {
  return (
    <div className={`flex flex-col p-3 rounded-2xl border transition-all ${
      dark 
        ? 'bg-slate-800/80 border-slate-700/80 text-white' 
        : highlight 
          ? 'bg-rose-50/60 border-rose-100 text-[#d91b5c]' 
          : 'bg-slate-50/70 border-slate-100 text-slate-800'
    }`}>
      <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${dark ? 'text-slate-400' : 'text-slate-400'}`}>{label}</span>
      <span className={`text-xs font-bold ${dark ? 'text-white' : highlight ? 'text-[#d91b5c]' : 'text-slate-700'}`}>{value}</span>
    </div>
  );
}
