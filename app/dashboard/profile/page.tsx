"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, MoreVertical, Info, GraduationCap, 
  Users, Moon, Sparkles, Heart, CheckCircle2, Lock, 
  Flag, Ban, Star, MessageCircle, Loader2, ChevronLeft, ChevronRight, Crown, Camera,
  MapPin, Briefcase, Calendar, User, ShieldCheck, Check, X, Maximize2, ExternalLink,
  BookOpen, Home, HeartHandshake, Compass, Phone, Copy, Mail, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { fetchProfileDetailsApi, viewContactDetailsApi, handleInteractionApiCall, blockUserApiCall, reportUserApiCall } from '@/lib/api';
import { getOptimizedImageUrl, getBlurredPhotoUrl } from '@/lib/imageUtils';
import { useSignalR } from '@/context/SignalRContext';
import SubscriptionModal from '@/components/dashboard/SubscriptionModal';

interface SectionTab {
  id: string;
  label: string;
  icon: any;
}

const SECTION_TABS: SectionTab[] = [
  { id: 'section-basic', label: 'Basic Info', icon: User },
  { id: 'section-about', label: 'About', icon: Info },
  { id: 'section-contact', label: 'Contact', icon: Phone },
  { id: 'section-education', label: 'Education & Career', icon: GraduationCap },
  { id: 'section-family', label: 'Family', icon: Home },
  { id: 'section-lifestyle', label: 'Lifestyle', icon: Sparkles },
  { id: 'section-preferences', label: 'Preferences', icon: HeartHandshake },
];

export default function ProfileDetailPage() {
  const router = useRouter();
  const { onlineUsers } = useSignalR();
  const [profileData, setProfileData] = useState<any>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contactData, setContactData] = useState<{ mobile: string; email: string } | null>(null);
  const [contactQuota, setContactQuota] = useState<{ total: number; used: number; remaining: number } | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionLoadingType, setActionLoadingType] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showThreeDotMenu, setShowThreeDotMenu] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [activeTabId, setActiveTabId] = useState<string>('section-about');
  const [localPhotoReqSent, setLocalPhotoReqSent] = useState<boolean>(false);

  const scrollToSection = (id: string) => {
    setActiveTabId(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = SECTION_TABS.map((t) => t.id);
      const scrollPosition = window.scrollY + 120;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveTabId(sectionIds[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop()?.split(';').shift() : null;
  };

  const getToken = useCallback(() => getCookie("user_token"), []);

  const checkIsUserPaid = useCallback((profile?: any, apiData?: any): boolean => {
    if (apiData) {
      if (
        apiData.isCurrentUserPaid || apiData.IsCurrentUserPaid ||
        apiData.isPaid || apiData.IsPaid ||
        apiData.isCanChat || apiData.IsCanChat ||
        apiData.isUserPaid || apiData.IsUserPaid
      ) return true;
    }

    if (profile) {
      if (
        profile.isCurrentUserPaid || profile.IsCurrentUserPaid ||
        profile.isPaid || profile.IsPaid ||
        profile.isCanChat || profile.IsCanChat ||
        profile.isUserPaid || profile.IsUserPaid
      ) return true;
    }

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user_details");
        if (stored) {
          const u = JSON.parse(stored);
          const val = (v: any) => v === true || v === 1 || v === "1" || v === "true";
          if (
            val(u.isPaid) || val(u.IsPaid) ||
            val(u.isCurrentUserPaid) || val(u.IsCurrentUserPaid) ||
            val(u.isCanChat) || val(u.IsCanChat) ||
            val(u.isUserPaid) || val(u.IsUserPaid) ||
            String(u.membershipType || u.MembershipType || '').toLowerCase().includes('paid') ||
            String(u.membershipType || u.MembershipType || '').toLowerCase().includes('vip') ||
            String(u.membershipType || u.MembershipType || '').toLowerCase().includes('premium') ||
            (u.membershipTypeId && Number(u.membershipTypeId) > 1)
          ) {
            return true;
          }
        }
      } catch (e) {}
    }

    return false;
  }, []);

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

      // Check if contact info was already unlocked in DB or returned by profile details API
      const existingMob = p.mobileNumber || p.MobileNumber || p.mobile || p.Mobile || p.phoneNumber || p.PhoneNumber || p.contactNumber || p.phone || p.Phone;
      const existingEml = p.email || p.Email;
      
      const isUnmaskedInBackend = Boolean(
        p.isContactUnlocked || p.IsContactUnlocked || p.isUnlocked || p.IsUnlocked || res.data?.isContactUnlocked || res.data?.IsContactUnlocked ||
        (existingMob && !String(existingMob).includes('X') && !String(existingMob).includes('x') && String(existingMob).length >= 8)
      );

      let unlockedList: number[] = [];
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("unlocked_contact_profiles");
          if (stored) unlockedList = JSON.parse(stored);
        } catch (err) {}
      }
      const wasUnlockedBefore = unlockedList.includes(targetUserId);

      if ((existingMob || existingEml) && (isUnmaskedInBackend || wasUnlockedBefore)) {
        setContactData({
          mobile: existingMob || 'Not Disclosed',
          email: existingEml || 'Not Disclosed'
        });

        if (!wasUnlockedBefore && typeof window !== "undefined") {
          unlockedList.push(targetUserId);
          localStorage.setItem("unlocked_contact_profiles", JSON.stringify(unlockedList));
        }
      }

      // 👁️ Automatically record PROFILE_VIEW in UserInteractions table
      if (targetUserId > 0) {
        handleInteractionApiCall(targetUserId, 'PROFILE_VIEW', 'VIEW', token).catch(() => {});
      }
    } else if (showFullLoader) {
      toast.error(res.message || "Failed to load profile details.");
    }
    if (showFullLoader) setLoading(false);
  }, [getToken, router, checkIsUserPaid]);

  useEffect(() => {
    loadProfileDetails(true);
  }, [loadProfileDetails]);


  const handleUnlockContact = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    
    const isUserPaid = checkIsUserPaid(profileData);

    if (!isUserPaid) {
      setShowSubscriptionModal(true);
      return;
    }

    const token = getToken();
    const targetId = Number(profileData?.userId || profileData?.UserId || 0);

    let alreadyUnlockedList: number[] = [];
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("unlocked_contact_profiles");
        if (stored) alreadyUnlockedList = JSON.parse(stored);
      } catch (err) {}
    }
    const isAlreadyUnlocked = alreadyUnlockedList.includes(targetId);

    setActionLoading(true);
    const res = await viewContactDetailsApi(targetId, token);
    setActionLoading(false);

    if (res.success && res.data) {
      const d = res.data.data || res.data.profile || res.data;
      const mob = d.mobileNumber || d.MobileNumber || d.mobile || d.Mobile || d.phoneNumber || d.PhoneNumber || d.contactNumber || d.phone || d.Phone || res.data.mobileNumber || res.data.MobileNumber || res.data.mobile || res.data.Mobile;
      const eml = d.email || d.Email || res.data.email || res.data.Email;

      setContactData({ mobile: mob || 'Not Disclosed', email: eml || 'Not Disclosed' });

      if (!isAlreadyUnlocked && typeof window !== "undefined") {
        alreadyUnlockedList.push(targetId);
        localStorage.setItem("unlocked_contact_profiles", JSON.stringify(alreadyUnlockedList));
      }

      const total = d.totalContactsAllowed || d.TotalContactsAllowed || res.data.totalContactsAllowed || res.data.TotalContactsAllowed || 10;
      const used = d.contactsUsed || d.ContactsUsed || res.data.contactsUsed || res.data.ContactsUsed || 1;
      const remaining = Math.max(0, total - used);
      setContactQuota({ total, used, remaining });

      handleInteractionApiCall(targetId, 'CONTACT_VIEW', 'VIEWED', token).catch(() => {});
    } else {
      toast.error(res.message || "Failed to unlock contact details.");
    }
  };

  const handleInitiateChat = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const isUserPaid = checkIsUserPaid(profileData);
    if (isUserPaid) {
      sessionStorage.setItem('active_chat_target', JSON.stringify({
        userId: profileData.userId || profileData.UserId,
        fullName: profileData.fullName || profileData.FullName,
        photoUrl: profileData.mainPhotoUrl || profileData.MainPhotoUrl || ''
      }));
      router.push('/dashboard/messages');
    } else {
      setShowSubscriptionModal(true);
    }
  };

  const handleInteraction = async (e: React.MouseEvent | null, type: string, status: string = 'PENDING') => {
    if (e) { e.preventDefault(); e.stopPropagation(); }

    const token = getToken();
    setActionLoading(true);
    setActionLoadingType(type);

    if (type === 'PHOTO_REQUEST') {
      setLocalPhotoReqSent(true);
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

  const handleReportUser = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }

    const token = getToken();
    const targetId = Number(profileData?.userId || profileData?.UserId || 0);
    if (!targetId || targetId <= 0) return;

    setActionLoading(true);
    const res = await reportUserApiCall(targetId, token, "Inappropriate Behavior");
    setActionLoading(false);
    setShowThreeDotMenu(false);
    toast.dismiss();

    if (res.success) {
      toast.success(res.message || "Profile reported successfully.");
    } else {
      toast.error(res.message || "Failed to report user.");
    }
  };

  const handleBlockUser = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }

    const token = getToken();
    const targetId = Number(profileData?.userId || profileData?.UserId || 0);
    if (!targetId || targetId <= 0) return;

    setActionLoading(true);
    const res = await blockUserApiCall(targetId, token);
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

  const handleShareProfile = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setShowThreeDotMenu(false);

    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareText = `Check out ${fullName}'s profile on Nikah Qubool Matrimony: ${shareUrl}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: `${fullName} - Nikah Qubool Profile`,
        text: `Check out ${fullName}'s profile on Nikah Qubool Matrimony`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl);
      }
      toast.success("Profile link copied & WhatsApp share opened!");
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6 max-w-4xl mx-auto space-y-6 animate-pulse pt-6">
        {/* Profile Card Header Skeleton */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-32 h-32 rounded-3xl bg-slate-200 shrink-0 shadow-xs" />
            <div className="flex-1 space-y-3 w-full text-center sm:text-left">
              <div className="w-48 h-6 bg-slate-300 rounded-md mx-auto sm:mx-0" />
              <div className="w-36 h-4 bg-slate-200 rounded-md mx-auto sm:mx-0" />
              <div className="w-64 h-4 bg-slate-200 rounded-md mx-auto sm:mx-0" />
              <div className="flex gap-2 justify-center sm:justify-start pt-2">
                <div className="w-28 h-9 bg-slate-300 rounded-2xl" />
                <div className="w-28 h-9 bg-slate-300 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Section Cards Skeleton */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="w-40 h-5 bg-slate-300 rounded-md" />
          <div className="space-y-3 pt-2">
            <div className="w-full h-4 bg-slate-200 rounded-md" />
            <div className="w-5/6 h-4 bg-slate-200 rounded-md" />
            <div className="w-4/6 h-4 bg-slate-200 rounded-md" />
          </div>
        </div>
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
  const targetUserIdNum = Number(profileData?.userId || profileData?.UserId || 0);

  const rawPrivacy = profileData.photoPrivacy || profileData.PhotoPrivacy || 'All Members';
  const privacyClean = String(rawPrivacy).toLowerCase().replace(/\s+/g, '');
  const isUserPaid = checkIsUserPaid(profileData);
  const hasRequestedPhoto = Boolean(profileData.hasRequestedPhoto ?? profileData.HasRequestedPhoto);
  
  const rawPhotoReqStatus = String(
    profileData.photoRequestStatus || profileData.PhotoRequestStatus || 
    profileData.galleryRequestStatus || profileData.GalleryRequestStatus || ''
  ).trim();
  const rawPhotoReqStatusUpper = rawPhotoReqStatus.toUpperCase();

  // 1. Target User ACCEPTED Current User's photo request -> Target's photo is UNBLURRED for Current User
  const isPhotoReqAccepted = (
    rawPhotoReqStatusUpper === 'ACCEPTED' || 
    rawPhotoReqStatusUpper === 'SENTACCEPTED' || 
    rawPhotoReqStatusUpper === 'APPROVED' ||
    Boolean(profileData.isPhotoReqAccepted ?? profileData.IsPhotoReqAccepted)
  );

  // 2. Current User SENT a photo request to Target User (pending response)
  const isPhotoReqSent = localPhotoReqSent || hasRequestedPhoto || (
    rawPhotoReqStatusUpper === 'SENTPENDING'
  );

  // Check if current user is viewing their own profile
  let isOwnProfile = false;
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("user_details") || localStorage.getItem("user_session");
      if (stored) {
        const u = JSON.parse(stored);
        const myId = Number(u.userId || u.UserId || u.id || u.user?.userId || u.user?.id || 0);
        if (myId > 0 && targetUserIdNum > 0 && myId === targetUserIdNum) {
          isOwnProfile = true;
        }
      }
    } catch (e) {}
  }

  // Check exact 3 photo privacy settings: "All Members", "Premium Only", "Only Approved"
  let isPhotoHidden = false;

  if (!isOwnProfile) {
    if (isPhotoReqAccepted) {
      // Candidate has approved the viewer's photo request
      isPhotoHidden = false;
    } else if (privacyClean.includes('approved')) {
      // 1. "Only Approved" -> Hidden until candidate explicitly approves photo request
      isPhotoHidden = true;
    } else if (privacyClean.includes('premium')) {
      // 2. "Premium Only" -> Hidden for Free members, visible for Premium members
      isPhotoHidden = !isUserPaid;
    } else {
      // 3. "All Members" / Public -> Visible to all logged-in members
      isPhotoHidden = false;
    }
  }

  const isVerified = Boolean(profileData.isVerified ?? profileData.IsVerified);
  const isPremium = Boolean(profileData.isPremium ?? profileData.IsPremium ?? isUserPaid);
  const rawPhotoSrc = allPhotos[activePhotoIndex]?.photoUrl || profileData.mainPhotoUrl || profileData.photoUrl;
  const currentPhotoSrc = getOptimizedImageUrl(rawPhotoSrc, profileData.userId || 1, profileData.gender);

  const displayAge = profileData.age || 24;
  const maritalStatus = profileData.maritalStatus || 'Never Married';

  const getSectText = (sectVal: any, sectNameVal: any) => {
    if (sectNameVal && String(sectNameVal).trim() !== '' && isNaN(Number(sectNameVal))) {
      return String(sectNameVal).trim();
    }
    if (!sectVal || sectVal === 0 || sectVal === '0') return '';
    if (typeof sectVal === 'string' && isNaN(Number(sectVal))) return sectVal.trim();
    const num = Number(sectVal);
    const map: { [key: number]: string } = {
      1: 'Sunni',
      2: 'Shia',
      3: 'Barelvi',
      4: 'Deobandi',
      5: 'Ahle Hadith',
      6: 'Other'
    };
    return map[num] || String(sectVal);
  };

  const getMaslakText = (maslakVal: any, maslakNameVal: any) => {
    if (maslakNameVal && String(maslakNameVal).trim() !== '' && isNaN(Number(maslakNameVal))) {
      return String(maslakNameVal).trim();
    }
    if (!maslakVal || maslakVal === 0 || maslakVal === '0') return '';
    if (typeof maslakVal === 'string' && isNaN(Number(maslakVal))) return maslakVal.trim();
    const num = Number(maslakVal);
    const map: { [key: number]: string } = {
      1: 'Barelvi',
      2: 'Deobandi',
      3: 'Ahle Hadith',
      4: 'Salafi',
      5: 'Tablighi',
      6: 'Sufi',
      7: 'Other'
    };
    return map[num] || String(maslakVal);
  };

  const sectText = getSectText(profileData.sect || profileData.Sect, profileData.sectName || profileData.SectName);
  const maslakText = getMaslakText(profileData.maslak || profileData.Maslak, profileData.maslakName || profileData.MaslakName);
  const religionText = 'Islam';

  const getCanCookText = (val: any) => {
    if (val === null || val === undefined || val === '') return null;
    const str = String(val).trim().toLowerCase();
    if (str === 'yes' || str === 'true' || str === '1') return 'Yes, Can Cook';
    if (str === 'no' || str === 'false' || str === '0') return 'No';
    return String(val);
  };

  const currentPresence = onlineUsers[targetUserIdNum];
  const isOnline = currentPresence ? currentPresence.isOnline : Boolean(profileData.isOnline ?? profileData.IsOnline ?? false);

  const getComplexionText = (val: any) => {
    if (val === null || val === undefined || val === '' || val === 0 || val === '0' || val === 'N/A') return null;
    if (typeof val === 'string' && isNaN(Number(val))) return val;
    const num = Number(val);
    const map: { [key: number]: string } = {
      1: 'Very Fair',
      2: 'Fair',
      3: 'Wheatish',
      4: 'Wheatish Brown',
      5: 'Dark'
    };
    return map[num] || null;
  };

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
                      onClick={handleReportUser}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer border-b border-slate-100"
                    >
                      <Flag size={16} className="text-amber-500" />
                      <span>Report</span>
                    </button>

                    <button 
                      onClick={handleBlockUser}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer border-b border-slate-100"
                    >
                      <Ban size={16} className="text-rose-600" />
                      <span>Block</span>
                    </button>

                    <button 
                      onClick={handleShareProfile}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Share2 size={16} className="text-rose-500" />
                      <span>Share Profile</span>
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
                {isPhotoReqSent ? (
                  <div className="px-5 py-2 bg-emerald-600 text-white font-black text-xs rounded-full shadow-lg border border-emerald-400 flex items-center gap-1.5 cursor-default">
                    <CheckCircle2 size={16} className="text-emerald-200" />
                    <span>Photo Request Sent</span>
                  </div>
                ) : (
                  <button
                    onClick={(e) => handleInteraction(e, 'PHOTO_REQUEST', 'PENDING')}
                    disabled={actionLoading}
                    className="px-5 py-2 bg-[#d91b5c] text-white font-bold text-xs rounded-full shadow-lg hover:bg-[#b01348] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    {actionLoading && actionLoadingType === 'PHOTO_REQUEST' ? (
                      <Loader2 size={14} className="animate-spin text-amber-300" />
                    ) : (
                      <Camera size={14} />
                    )}
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
                {/* 🚀 CLEAN MINI TABS NAVIGATION BAR */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-xs py-2 px-2 my-2 rounded-2xl">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {SECTION_TABS.filter((tab) => {
              if (tab.id === 'section-about') return Boolean(profileData.aboutMe || profileData.AboutMe);
              if (tab.id === 'section-lifestyle') return Boolean(profileData.dietType || profileData.DietType || profileData.smokeHabit || profileData.SmokeHabit || profileData.drinkHabit || profileData.DrinkHabit || (profileData.canCook !== undefined && profileData.canCook !== null) || profileData.hobbies || profileData.Hobbies || profileData.interests || profileData.Interests);
              if (tab.id === 'section-preferences') return Boolean(preferences && (preferences.minAge || preferences.minHeight || preferences.preferredMaritalStatus || preferences.preferredSect || preferences.preferredEducation || preferences.preferredOccupation || preferences.preferredState || profileData.partnerExpectations || profileData.PartnerExpectations));
              return true;
            }).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTabId === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold tracking-wide whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#d91b5c] text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-white' : 'text-slate-500'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 📋 PROFILE ALL SECTIONS VERTICALLY STACKED */}
        <div className="space-y-6 px-4 md:px-0">

          {/* 1. 📌 ABOUT SECTION (CLEAN SIMPLE BIO FROM DB TABLE) */}
          {(profileData.aboutMe || profileData.AboutMe) && (
            <section id="section-about" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-[#d91b5c] flex items-center justify-center">
                  <Info size={18} />
                </div>
                <h3 className="font-serif font-bold text-lg text-slate-800">About {fullName}</h3>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed font-sans bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {profileData.aboutMe || profileData.AboutMe}
              </p>
            </section>
          )}

          {/* 📱 DIRECT CANDIDATE CONTACT DETAILS CARD */}
          <section id="section-contact" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-lg text-slate-900">Contact Details</h3>

              {isUserPaid && (
                <div className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#d91b5c] font-extrabold text-[11px] flex items-center gap-1.5 shadow-2xs">
                  <Crown size={13} className="fill-[#d91b5c]" />
                  <span>{contactQuota ? `${contactQuota.remaining} / ${contactQuota.total} Left` : 'VIP Member'}</span>
                </div>
              )}
            </div>

            {!contactData && (
              <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900">Contact Details</h4>
                    <p className="text-[11px] font-medium text-slate-500">Use credits to unlock contact info</p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-amber-500 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-xs">
                  {isUserPaid ? (contactQuota ? `${contactQuota.remaining} LEFT` : 'PREMIUM') : 'VIP ONLY'}
                </div>
              </div>
            )}

            <div className="space-y-3 pt-1">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-[#d91b5c] flex items-center justify-center shrink-0">
                    <Phone size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Mobile Number</span>
                    <span className="text-xs font-extrabold text-slate-800 block truncate">
                      {contactData ? (contactData.mobile || 'Not Disclosed') : '+91 98XXX XXXXX'}
                    </span>
                  </div>
                </div>
                {contactData?.mobile && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(contactData.mobile);
                      toast.success("Phone number copied to clipboard!");
                    }}
                    className="p-2 rounded-xl bg-white hover:bg-rose-50 text-[#d91b5c] transition-all cursor-pointer border border-rose-200 shrink-0"
                    title="Copy Phone Number"
                  >
                    <Copy size={15} />
                  </button>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-[#d91b5c] flex items-center justify-center shrink-0">
                    <Mail size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Email Address</span>
                    <span className="text-xs font-extrabold text-slate-800 block truncate">
                      {contactData ? (contactData.email || 'Not Disclosed') : 'axx***@gm***.com'}
                    </span>
                  </div>
                </div>
                {contactData?.email && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(contactData.email);
                      toast.success("Email address copied to clipboard!");
                    }}
                    className="p-2 rounded-xl bg-white hover:bg-rose-50 text-[#d91b5c] transition-all cursor-pointer border border-rose-200 shrink-0"
                    title="Copy Email Address"
                  >
                    <Copy size={15} />
                  </button>
                )}
              </div>
            </div>

            {!contactData && (
              <div className="pt-2">
                <button
                  onClick={handleUnlockContact}
                  disabled={actionLoading}
                  className="w-full py-3 bg-[#d91b5c] hover:bg-[#b01348] text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  {actionLoading ? <Loader2 size={15} className="animate-spin text-white" /> : <Lock size={15} />}
                  <span>{isUserPaid ? 'Unlock Contact Details' : 'Upgrade to Unlock Contact Details'}</span>
                </button>
              </div>
            )}
          </section>

          {/* 2. 👤 BASIC DETAILS */}
          <section id="section-basic" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-[#d91b5c] flex items-center justify-center">
                <User size={18} />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-800">Basic Details</h3>
            </div>

            <div className="space-y-3">
              <DetailIconRow icon={Heart} label="Marital Status" value={profileData.maritalStatusName || profileData.MaritalStatusName || profileData.maritalStatus || profileData.MaritalStatus} />
              <DetailIconRow icon={User} label="Height" value={profileData.height || profileData.Height} />
              <DetailIconRow icon={Sparkles} label="Weight" value={profileData.weight || profileData.Weight} />
              <DetailIconRow icon={Calendar} label="Age" value={displayAge ? `${displayAge} Years` : null} />
              <DetailIconRow icon={Calendar} label="Date of Birth" value={profileData.dateOfBirth || profileData.DateOfBirth ? new Date(profileData.dateOfBirth || profileData.DateOfBirth).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
              <DetailIconRow icon={MapPin} label="Current Location" value={(profileData.currentCityName || profileData.CurrentCityName || profileData.cityName) ? `${profileData.currentCityName || profileData.CurrentCityName || profileData.cityName}, ${profileData.currentStateName || profileData.CurrentStateName || profileData.stateName}` : null} />
              <DetailIconRow icon={MapPin} label="Native Place" value={(profileData.nativeCityName || profileData.NativeCityName) ? `${profileData.nativeCityName || profileData.NativeCityName}, ${profileData.nativeStateName || profileData.NativeStateName}` : null} />
              <DetailIconRow icon={Compass} label="Mother Tongue / Language" value={profileData.motherTongueName || profileData.MotherTongueName || profileData.motherTongue || profileData.MotherTongue} />
              <DetailIconRow icon={Moon} label="Religion & Maslak" value={religionText} />
              <DetailIconRow icon={Moon} label="Sect" value={sectText} />
              <DetailIconRow icon={Moon} label="Maslak" value={maslakText} />
              <DetailIconRow icon={Users} label="Caste / Sub-Caste" value={profileData.casteName || profileData.CasteName || profileData.caste || profileData.Caste} />
              <DetailIconRow icon={Sparkles} label="Complexion" value={getComplexionText(profileData.complexion || profileData.Complexion)} />
              <DetailIconRow icon={User} label="Profile Created For" value={profileData.profileCreatedForName || profileData.ProfileCreatedForName || profileData.profileCreatedFor || profileData.ProfileCreatedFor} />
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

            <div className="space-y-3">
              <DetailIconRow icon={GraduationCap} label="Highest Qualification" value={profileData.highestDegreeName || profileData.HighestDegreeName || profileData.highestDegree || profileData.HighestDegree} />
              <DetailIconRow icon={BookOpen} label="College / University" value={profileData.collegeName || profileData.CollegeName} />
              <DetailIconRow icon={Briefcase} label="Employment Sector" value={profileData.employmentSectorName || profileData.EmploymentSectorName || profileData.employmentSector || profileData.EmploymentSector} />
              <DetailIconRow icon={User} label="Designation / Profession" value={profileData.designationName || profileData.DesignationName || profileData.designation || profileData.Designation || profileData.profession} />
              <DetailIconRow icon={Briefcase} label="Occupation Details" value={profileData.occupationDetails || profileData.OccupationDetails} />
              <DetailIconRow icon={Sparkles} label="Annual Income" value={profileData.annualIncome || profileData.AnnualIncome ? `Earns ${profileData.annualIncome || profileData.AnnualIncome}` : null} />
            </div>
          </section>

          {/* 4. 🏡 FAMILY DETAILS */}
          <section id="section-family" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-[#d91b5c] flex items-center justify-center">
                <Home size={18} />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-800">Family Background</h3>
            </div>

            <div className="space-y-3">
              <DetailIconRow icon={Home} label="Family Type" value={profileData.familyTypeName || profileData.FamilyTypeName || profileData.familyType || profileData.FamilyType} />
              <DetailIconRow icon={Sparkles} label="Family Status" value={profileData.familyStatusName || profileData.FamilyStatusName || profileData.familyStatus || profileData.FamilyStatus} />
              <DetailIconRow icon={User} label="Father's Name" value={profileData.fatherName || profileData.FatherName} />
              <DetailIconRow icon={Briefcase} label="Father's Occupation" value={profileData.fatherOccupationName || profileData.FatherOccupationName || profileData.fatherOccupation || profileData.FatherOccupation} />
              <DetailIconRow icon={User} label="Mother's Name" value={profileData.motherName || profileData.MotherName} />
              <DetailIconRow icon={User} label="Mother's Occupation" value={profileData.motherOccupationName || profileData.MotherOccupationName || profileData.motherOccupation || profileData.MotherOccupation} />
              <DetailIconRow icon={Users} label="Brothers" value={(profileData.totalBrothers !== undefined && profileData.totalBrothers !== null && Number(profileData.totalBrothers) > 0) ? `${profileData.totalBrothers} Brother(s) (${profileData.marriedBrothers || 0} Married)` : null} />
              <DetailIconRow icon={Users} label="Sisters" value={(profileData.totalSisters !== undefined && profileData.totalSisters !== null && Number(profileData.totalSisters) > 0) ? `${profileData.totalSisters} Sister(s) (${profileData.marriedSisters || 0} Married)` : null} />
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

          {/* 5. 🌿 LIFESTYLE & HABITS */}
          {(profileData.dietType || profileData.DietType || profileData.smokeHabit || profileData.SmokeHabit || profileData.drinkHabit || profileData.DrinkHabit || (profileData.canCook !== undefined && profileData.canCook !== null) || profileData.hobbies || profileData.Hobbies || profileData.interests || profileData.Interests) && (
            <section id="section-lifestyle" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-[#d91b5c] flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <h3 className="font-serif font-bold text-lg text-slate-800">Lifestyle & Habits</h3>
              </div>

              <div className="space-y-3">
                <DetailIconRow icon={Sparkles} label="Dietary Preference" value={profileData.dietType || profileData.DietType} />
                <DetailIconRow icon={Sparkles} label="Smoking Habit" value={profileData.smokeHabit || profileData.SmokeHabit} />
                <DetailIconRow icon={Sparkles} label="Drinking Habit" value={profileData.drinkHabit || profileData.DrinkHabit} />
                <DetailIconRow icon={Sparkles} label="Cooking Skills" value={getCanCookText(profileData.canCook ?? profileData.CanCook)} />
              </div>

              {(profileData.hobbies || profileData.Hobbies) && (
                <div className="pt-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-2">Hobbies</span>
                  <div className="flex flex-wrap gap-2">
                    {String(profileData.hobbies || profileData.Hobbies).split(',').map((h: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#d91b5c] font-bold text-xs shadow-2xs">
                        {h.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(profileData.interests || profileData.Interests) && (
                <div className="pt-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-2">Interests</span>
                  <div className="flex flex-wrap gap-2">
                    {String(profileData.interests || profileData.Interests).split(',').map((i: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs shadow-2xs">
                        {i.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 6. 🎯 PARTNER PREFERENCES & EXPECTATIONS */}
          {preferences && (preferences.minAge || preferences.minHeight || preferences.preferredMaritalStatus || preferences.preferredSect || preferences.preferredEducation || preferences.preferredOccupation || preferences.preferredState || profileData.partnerExpectations || profileData.PartnerExpectations) && (
            <section id="section-preferences" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-[#d91b5c] flex items-center justify-center">
                  <HeartHandshake size={18} />
                </div>
                <h3 className="font-serif font-bold text-lg text-slate-800">Partner Preferences</h3>
              </div>

              {(profileData.partnerExpectations || profileData.PartnerExpectations) && (
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                  "{profileData.partnerExpectations || profileData.PartnerExpectations}"
                </p>
              )}

              <div className="space-y-3">
                <DetailIconRow icon={Calendar} label="Preferred Age" value={preferences?.minAge ? `${preferences.minAge} to ${preferences.maxAge} Years` : null} />
                <DetailIconRow icon={User} label="Preferred Height" value={preferences?.minHeight ? `${preferences.minHeight} - ${preferences.maxHeight}` : null} />
                <DetailIconRow icon={Heart} label="Preferred Marital Status" value={preferences?.preferredMaritalStatus || preferences?.maritalStatus} />
                <DetailIconRow icon={Moon} label="Preferred Sect" value={preferences?.preferredSect || preferences?.sect} />
                <DetailIconRow icon={Users} label="Preferred Caste" value={preferences?.preferredCaste || preferences?.caste} />
                <DetailIconRow icon={GraduationCap} label="Preferred Education" value={preferences?.preferredEducation || preferences?.education} />
                <DetailIconRow icon={Briefcase} label="Preferred Profession" value={preferences?.preferredOccupation || preferences?.occupation} />
                <DetailIconRow icon={MapPin} label="Preferred Location" value={preferences?.preferredState || preferences?.state} />
              </div>
            </section>
          )}

        </div>
      </div>

      {/* 🔴 ACTION ICON BUTTONS ROW */}
      <div className="fixed bottom-4 inset-x-0 z-50 py-2 px-6 flex items-center justify-center gap-6 max-w-md mx-auto pointer-events-none">
        
        {/* 1. ❤️ INTEREST BUTTON */}
        {isInterestReceived ? (
          <div className="flex items-center gap-4 pointer-events-auto">
            {/* ACCEPT BUTTON WITH HOVER TOOLTIP */}
            <div className="relative group/btn flex flex-col items-center">
              <motion.button 
                type="button"
                whileHover={{ scale: 1.12, y: -2 }}
                whileTap={{ scale: 0.85 }}
                onClick={(e) => handleInteraction(e, 'INTEREST', 'ACCEPTED')}
                disabled={actionLoading}
                className="w-13 h-13 rounded-full bg-[#e6f7ec] hover:bg-[#d1fae5] text-[#16a34a] border-2 border-emerald-400 shadow-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                aria-label="Accept Proposal"
                title="Accept Proposal"
              >
                {(actionLoading && actionLoadingType === 'INTEREST') ? (
                  <Loader2 size={22} className="animate-spin text-[#16a34a]" />
                ) : (
                  <Check size={24} className="text-[#16a34a] stroke-[3]" />
                )}
              </motion.button>
              <div className="absolute -top-9 opacity-0 group-hover/btn:opacity-100 transition-all duration-200 pointer-events-none z-50 whitespace-nowrap">
                <span className="text-[11px] font-semibold text-white bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-lg border border-slate-700/50">
                  Accept
                </span>
              </div>
            </div>

            {/* DECLINE BUTTON WITH HOVER TOOLTIP */}
            <div className="relative group/btn flex flex-col items-center">
              <motion.button 
                type="button"
                whileHover={{ scale: 1.12, y: -2 }}
                whileTap={{ scale: 0.85 }}
                onClick={(e) => handleInteraction(e, 'INTEREST', 'DECLINED')}
                disabled={actionLoading}
                className="w-13 h-13 rounded-full bg-[#fde8e8] hover:bg-[#ffe4e6] text-[#f43f5e] border-2 border-rose-400 shadow-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                aria-label="Decline Proposal"
                title="Decline Proposal"
              >
                <X size={24} className="text-[#f43f5e] stroke-[3]" />
              </motion.button>
              <div className="absolute -top-9 opacity-0 group-hover/btn:opacity-100 transition-all duration-200 pointer-events-none z-50 whitespace-nowrap">
                <span className="text-[11px] font-semibold text-white bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-lg border border-slate-700/50">
                  Decline
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative group/btn flex flex-col items-center pointer-events-auto">
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
            <div className="absolute -top-9 opacity-0 group-hover/btn:opacity-100 transition-all duration-200 pointer-events-none z-50 whitespace-nowrap">
              <span className="text-[11px] font-semibold text-white bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-lg border border-slate-700/50">
                {isInterestSent ? 'Sent' : isConnected ? 'Connected' : 'Interest'}
              </span>
            </div>
          </div>
        )}

        {/* 2. 💬 CHAT BUTTON WITH HOVER TOOLTIP */}
        <div className="relative group/btn flex flex-col items-center pointer-events-auto">
          <motion.button 
            type="button"
            whileHover={{ scale: 1.12, y: -2 }}
            whileTap={{ scale: 0.85 }}
            onClick={handleInitiateChat}
            disabled={actionLoading}
            className="w-13 h-13 rounded-full bg-slate-900 hover:bg-[#d91b5c] text-white border-2 border-slate-700 shadow-xl flex items-center justify-center cursor-pointer active:scale-95 transition-colors"
            aria-label="Direct Message"
            title="Start Chat"
          >
            {(actionLoading && actionLoadingType === 'CHAT') ? (
              <Loader2 size={22} className="animate-spin text-white" />
            ) : (
              <MessageCircle size={22} className="fill-white text-white" />
            )}
          </motion.button>
          <div className="absolute -top-9 opacity-0 group-hover/btn:opacity-100 transition-all duration-200 pointer-events-none z-50 whitespace-nowrap">
            <span className="text-[11px] font-semibold text-white bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-lg border border-slate-700/50">
              Chat
            </span>
          </div>
        </div>

        {/* 3. ⭐ SHORTLIST STAR ICON BUTTON WITH HOVER TOOLTIP */}
        <div className="relative group/btn flex flex-col items-center pointer-events-auto">
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
            title={isShortlisted ? 'Saved' : 'Shortlist Profile'}
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
          <div className="absolute -top-9 opacity-0 group-hover/btn:opacity-100 transition-all duration-200 pointer-events-none z-50 whitespace-nowrap">
            <span className="text-[11px] font-semibold text-white bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-lg border border-slate-700/50">
              {isShortlisted ? 'Saved' : 'Shortlist'}
            </span>
          </div>
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

function DetailIconRow({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  if (
    value === null || 
    value === undefined || 
    value === '' || 
    value === 0 || 
    value === '0' || 
    value === 'N/A' || 
    value === 'Not Disclosed' || 
    String(value).trim() === ''
  ) {
    return null;
  }

  return (
    <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 hover:bg-rose-50/30 transition-all">
      <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#d91b5c] flex items-center justify-center shrink-0 shadow-xs border border-rose-100">
        <Icon size={18} />
      </div>
      <div>
        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-0.5">{label}</span>
        <span className="text-xs font-extrabold text-slate-800 block">{String(value)}</span>
      </div>
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


