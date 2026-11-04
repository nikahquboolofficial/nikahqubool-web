"use client";

import { ProfileStatusIcons, checkIsVerified, checkIsPremium } from '@/components/common/ProfileBadges';

import SubscriptionModal from '@/components/dashboard/SubscriptionModal';

import { getClientSubscriptionStatus } from '@/lib/subscriptionUtils';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, MoreVertical, Info, GraduationCap, 
  Users, Moon, Sparkles, Heart, CheckCircle2, Lock, 
  Flag, Ban, Star, MessageCircle, Loader2, ChevronLeft, ChevronRight, Crown, Camera,
  MapPin, Briefcase, Calendar, User, UserX, ShieldCheck, Check, X, Maximize2,
  BookOpen, Home, HeartHandshake, Compass, Phone, Copy, Mail, Share2, Printer, Mic,
  Ruler, Globe, Wallet, Bookmark, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { fetchProfileDetailsApi, viewContactDetailsApi, handleInteractionApiCall, blockUserApiCall, reportUserApiCall, formatLastSeen } from '@/lib/api';
import { getOptimizedImageUrl, DEFAULT_FEMALE_AVATAR } from '@/lib/imageUtils';
import { useSignalR } from '@/context/SignalRContext';
import IslamicBiodataModal from '@/components/dashboard/IslamicBiodataModal';
import CompatibilityScoreModal, { calculateCompatibilityScore } from '@/components/dashboard/CompatibilityScoreModal';
import { getAuthToken } from '@/lib/auth';

export default function ProfileDetailPage() {
  const router = useRouter();
  const { onlineUsers, fetchBulkOnlineStatuses } = useSignalR();
  const [profileData, setProfileData] = useState<any>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [contactData, setContactData] = useState<{ mobile: string; email: string } | null>(null);
  const [contactQuota, setContactQuota] = useState<{ total: number; used: number; remaining: number } | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showBiodataModal, setShowBiodataModal] = useState(false);
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionLoadingType, setActionLoadingType] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showThreeDotMenu, setShowThreeDotMenu] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [activeTabId, setActiveTabId] = useState<string>('section-basic');
  const [localPhotoReqSent, setLocalPhotoReqSent] = useState<boolean>(false);
  const [isBioExpanded, setIsBioExpanded] = useState<boolean>(false);

  // Load current user profile from localStorage to compute "Things you both share in common"
  // And ⚡ PRE-SEED target profile data for 0ms instantaneous page opening
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user_details") || localStorage.getItem("user_session");
        if (stored) {
          setCurrentUserData(JSON.parse(stored));
        }

        const previewTarget = sessionStorage.getItem("viewing_profile_target") || localStorage.getItem("viewing_profile_target");
        if (previewTarget) {
          const parsed = JSON.parse(previewTarget);
          if (parsed && (parsed.fullName || parsed.FullName || parsed.photoUrl || parsed.PhotoUrl)) {
            setProfileData((prev: any) => prev || parsed);
            setLoading(false);
          }
        }
      } catch (e) {}
    }
  }, []);

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined") {
      const lastPage = sessionStorage.getItem('last_browse_page');
      if (lastPage && !lastPage.includes('/dashboard/profile')) {
        router.push(lastPage);
        return;
      }
      if (window.history.length > 1) {
        router.back();
        setTimeout(() => {
          if (window.location.pathname.includes('/dashboard/profile')) {
            router.push('/dashboard/find-match');
          }
        }, 250);
        return;
      }
    }
    router.push('/dashboard/find-match');
  }, [router]);

  const getToken = useCallback(() => getAuthToken(), []);

  const checkIsUserPaid = useCallback((profile?: any, apiData?: any): boolean => {
    const status = getClientSubscriptionStatus();
    if (status.canChat) return true;
    if (apiData && (apiData.isCurrentUserPaid || apiData.IsCurrentUserPaid)) return true;
    if (profile && (profile.isCurrentUserPaid || profile.IsCurrentUserPaid)) return true;
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

    if (showFullLoader && !profileData) setLoading(true);
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

      const existingMob = p.mobileNumber || p.MobileNumber || p.mobile || p.Mobile || p.phoneNumber || p.PhoneNumber || p.contactNumber || p.phone || p.Phone;
      const existingEml = p.email || p.Email;
      
      const isUnmaskedInBackend = Boolean(p.isContactUnlocked || p.IsContactUnlocked);
      const userPaid = checkIsUserPaid(p, res.data);

      // 🔒 STRICT PRIVACY: NEVER UNMASK ON LOAD UNLESS VERIFIED UNLOCKED ON SERVER AND CURRENT USER IS PAID
      if (isUnmaskedInBackend && userPaid && existingMob && !String(existingMob).includes('*')) {
        setContactData({
          mobile: existingMob,
          email: existingEml || 'Not Disclosed'
        });
      } else {
        setContactData(null);
      }

      if (p.remainingContactsAllowed !== undefined && p.remainingContactsAllowed !== null) {
        setContactQuota({
          total: 100,
          used: 0,
          remaining: p.remainingContactsAllowed
        });
      }

      if (targetUserId > 0) {
        try {
          fetchBulkOnlineStatuses([targetUserId]);
          handleInteractionApiCall(targetUserId, 'PROFILE_VIEW', 'VIEW', token).catch(() => {});
        } catch (e) {}
      }
    } else if (showFullLoader) {
      toast.error(res.message || "Failed to load profile details.");
    }
    if (showFullLoader) setLoading(false);
  }, [getToken, router]);

  const initialLoadDoneRef = React.useRef<string | null>(null);

  useEffect(() => {
    let urlId = '';
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("unlocked_contact_profiles");
      } catch (e) {}
      const urlParams = new URLSearchParams(window.location.search);
      urlId = urlParams.get('userId') || urlParams.get('id') || urlParams.get('targetUserId') || '';
    }
    if (initialLoadDoneRef.current !== urlId) {
      initialLoadDoneRef.current = urlId;
      loadProfileDetails(true);
    }
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

    setActionLoading(true);
    setActionLoadingType('VIEW_CONTACT');
    const res = await viewContactDetailsApi(targetId, token);
    setActionLoading(false);
    setActionLoadingType(null);

    if (res.success && res.data) {
      const d = res.data.data || res.data.profile || res.data;
      const mob = d.mobileNumber || d.MobileNumber || d.mobile || d.Mobile || d.phoneNumber || d.PhoneNumber || d.contactNumber || d.phone || d.Phone || res.data.mobileNumber || res.data.MobileNumber || res.data.mobile || res.data.Mobile;
      const eml = d.email || d.Email || res.data.email || res.data.Email;

      setContactData({ 
        mobile: (mob && !String(mob).includes('*')) ? mob : 'Not Disclosed', 
        email: (eml && !String(eml).includes('*')) ? eml : 'Not Disclosed' 
      });

      const total = d.totalContactsAllowed || d.TotalContactsAllowed || res.data.totalContactsAllowed || res.data.TotalContactsAllowed || 50;
      const used = d.contactsUsed || d.ContactsUsed || res.data.contactsUsed || res.data.ContactsUsed || 1;
      const remaining = Math.max(0, total - used);
      setContactQuota({ total, used, remaining });

      setProfileData((prev: any) => ({
        ...prev,
        isContactUnlocked: true,
        remainingContactsAllowed: remaining
      }));

      toast.success("Contact details unlocked successfully!");
      handleInteractionApiCall(targetId, 'CONTACT_VIEW', 'VIEWED', token).catch(() => {});
    } else {
      if (res.message && (res.message.toLowerCase().includes('quota') || res.message.toLowerCase().includes('limit') || res.message.toLowerCase().includes('contact'))) {
        toast.error(res.message);
        setShowSubscriptionModal(true);
      } else {
        toast.error(res.message || "Failed to unlock contact details.");
      }
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
      toast.success("Photo request sent successfully!");
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
        toast.success(status === 'ACCEPTED' ? "Interest accepted!" : status === 'DECLINED' ? "Interest declined." : "Interest sent successfully!");
      } else if (type === 'SHORTLIST') {
        setProfileData((prev: any) => ({
          ...prev,
          isShortlisted: status === 'ACTIVE'
        }));
        toast.success(status === 'ACTIVE' ? "Added to shortlist" : "Removed from shortlist");
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

  const targetUserIdNum = Number(profileData?.userId || profileData?.UserId || 0);
  const fullName = profileData?.fullName || profileData?.FullName || "Member Profile";
  const profileMemberId = profileData?.memberId || profileData?.MemberId || `NQ${(8800000 + targetUserIdNum).toString()}`;

  const handleShareProfile = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setShowThreeDotMenu(false);

    // 🌐 STRICT LIVE URL FOR SHARING AS PER USER REQUIREMENT
    const liveBaseUrl = "https://nikahqubool.in";
    const shareUrl = `${liveBaseUrl}/dashboard/profile?userId=${targetUserIdNum}`;
    const shareText = `Check out ${fullName}'s profile (Member ID: ${profileMemberId}) on Nikah Qubool Matrimony:\n${shareUrl}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: `${fullName} (${profileMemberId}) - Nikah Qubool`,
        text: shareText,
        url: shareUrl,
      }).catch(() => {});
    } else {
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText);
      }
      toast.success("Live profile link copied with Member ID!");
    }
  };

  // Helper function for Sect mapping
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

  // Helper function for Maslak mapping
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

  const getCanCookText = (val: any) => {
    if (val === null || val === undefined || val === '') return null;
    const str = String(val).trim().toLowerCase();
    if (str === 'yes' || str === 'true' || str === '1') return 'Yes, Can Cook';
    if (str === 'no' || str === 'false' || str === '0') return 'No';
    return String(val);
  };

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

  const sectText = profileData ? getSectText(profileData.sect || profileData.Sect, profileData.sectName || profileData.SectName) : '';
  const maslakText = profileData ? getMaslakText(profileData.maslak || profileData.Maslak, profileData.maslakName || profileData.MaslakName) : '';

  // Masked Phone display: e.g., "+91 - 91******53" or "+91 - 98******21"
  const maskedPhoneDisplay = useMemo(() => {
    const rawMob = String(profileData?.mobileNumber || profileData?.MobileNumber || profileData?.mobile || '').trim();
    const digits = rawMob.replace(/\D/g, '');
    if (digits.length >= 10) {
      const last10 = digits.slice(-10);
      return `+91 - ${last10.slice(0, 2)}******${last10.slice(-2)}`;
    }
    return '+91 - 91******53';
  }, [profileData]);

  // Masked Email display: e.g., "ya*********@XXXXX.com" or "as*********@XXXXX.com"
  const maskedEmailDisplay = useMemo(() => {
    const rawEmail = String(profileData?.email || profileData?.Email || '').trim();
    const atIndex = rawEmail.indexOf('@');
    if (atIndex > 2) {
      const prefix = rawEmail.slice(0, 2);
      return `${prefix}*********@XXXXX.com`;
    }
    if (rawEmail && rawEmail.length >= 2) {
      return `${rawEmail.slice(0, 2)}*********@XXXXX.com`;
    }
    return 'as*********@XXXXX.com';
  }, [profileData]);

  // Remaining contacts quota (accurate count from API or localStorage)
  const remainingContactsCount = useMemo(() => {
    if (contactQuota?.remaining !== undefined) return contactQuota.remaining;
    if (profileData?.remainingContactsAllowed !== undefined && profileData.remainingContactsAllowed !== null) {
      return profileData.remainingContactsAllowed;
    }
    if (profileData?.RemainingContactsAllowed !== undefined && profileData.RemainingContactsAllowed !== null) {
      return profileData.RemainingContactsAllowed;
    }
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user_details");
        if (stored) {
          const u = JSON.parse(stored);
          if (u.remainingContactsAllowed !== undefined) return u.remainingContactsAllowed;
          if (u.contactsRemaining !== undefined) return u.contactsRemaining;
          if (u.totalContactsAllowed && u.contactsUsed !== undefined) {
            return Math.max(0, u.totalContactsAllowed - u.contactsUsed);
          }
        }
      } catch (e) {}
    }
    return 56;
  }, [contactQuota, profileData]);

  // Determine available tabs strictly based on data presence
  const availableTabs = useMemo(() => {
    if (!profileData) return [];

    const tabs: { id: string; label: string }[] = [];

    // Basic: Always available
    tabs.push({ id: 'section-basic', label: 'Basic' });

    // Contact: Always available
    tabs.push({ id: 'section-contact', label: 'Contact' });

    // Education & Career: only if any education/career field is filled
    const hasEducation = Boolean(
      profileData.highestDegreeName || profileData.HighestDegreeName || profileData.highestDegree || profileData.HighestDegree ||
      profileData.collegeName || profileData.CollegeName ||
      profileData.employmentSectorName || profileData.EmploymentSectorName || profileData.employmentSector || profileData.EmploymentSector ||
      profileData.designationName || profileData.DesignationName || profileData.designation || profileData.Designation || profileData.profession ||
      profileData.annualIncome || profileData.AnnualIncome || profileData.occupationDetails || profileData.OccupationDetails
    );
    if (hasEducation) tabs.push({ id: 'section-education', label: 'Education & Career' });

    // Family: only if family fields are filled
    const hasFamily = Boolean(
      profileData.familyTypeName || profileData.FamilyTypeName || profileData.familyType || profileData.FamilyType ||
      profileData.familyStatusName || profileData.FamilyStatusName || profileData.familyStatus || profileData.FamilyStatus ||
      profileData.fatherName || profileData.FatherName ||
      profileData.fatherOccupationName || profileData.FatherOccupationName || profileData.fatherOccupation || profileData.FatherOccupation ||
      profileData.motherName || profileData.MotherName ||
      profileData.motherOccupationName || profileData.MotherOccupationName || profileData.motherOccupation || profileData.MotherOccupation ||
      (profileData.totalBrothers !== undefined && profileData.totalBrothers !== null && Number(profileData.totalBrothers) > 0) ||
      (profileData.totalSisters !== undefined && profileData.totalSisters !== null && Number(profileData.totalSisters) > 0) ||
      profileData.familyAbout
    );
    if (hasFamily) tabs.push({ id: 'section-family', label: 'Family' });

    // Religious: only if sect, maslak, caste or religious fields are filled
    const hasReligious = Boolean(
      sectText || maslakText || profileData.casteName || profileData.CasteName || profileData.caste || profileData.Caste ||
      profileData.namazHabit || profileData.NamazHabit || profileData.quranHabit || profileData.fastingHabit
    );
    if (hasReligious) tabs.push({ id: 'section-religious', label: 'Religious' });

    // Lifestyle: only if lifestyle fields are filled
    const hasLifestyle = Boolean(
      profileData.dietType || profileData.DietType || 
      profileData.smokeHabit || profileData.SmokeHabit || 
      profileData.drinkHabit || profileData.DrinkHabit || 
      (profileData.canCook !== undefined && profileData.canCook !== null) || 
      profileData.hobbies || profileData.Hobbies || 
      profileData.interests || profileData.Interests
    );
    if (hasLifestyle) tabs.push({ id: 'section-lifestyle', label: 'Lifestyle' });

    // Preferences: only if partner preferences or expectations exist
    const hasPreferences = Boolean(
      (preferences && (preferences.minAge || preferences.minHeight || preferences.preferredMaritalStatus || preferences.preferredSect || preferences.preferredEducation || preferences.preferredOccupation || preferences.preferredState)) ||
      (profileData.partnerExpectations || profileData.PartnerExpectations)
    );
    if (hasPreferences) tabs.push({ id: 'section-preferences', label: 'Preferences' });

    return tabs;
  }, [profileData, preferences, sectText, maslakText]);

  // Scroll to section handler with responsive offset
  const scrollToSection = (id: string) => {
    setActiveTabId(id);
    const element = document.getElementById(id);
    if (element) {
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
      const yOffset = isDesktop ? -130 : -55;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Sticky Scroll Spy to highlight active tab smoothly
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const tabIds = availableTabs.map((t) => t.id);
          const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
          const scrollPosition = window.scrollY + (isDesktop ? 140 : 65);

          for (let i = tabIds.length - 1; i >= 0; i--) {
            const el = document.getElementById(tabIds[i]);
            if (el && el.offsetTop <= scrollPosition) {
              setActiveTabId((prev) => (prev !== tabIds[i] ? tabIds[i] : prev));
              break;
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [availableTabs]);

  // Calculate High-Precision AI Compatibility Match Score & Breakdown
  const compatibility = useMemo(() => {
    return calculateCompatibilityScore(currentUserData, profileData);
  }, [currentUserData, profileData]);

  // Compute common traits between current user and profile candidate
  const commonTraits = useMemo(() => {
    if (!currentUserData || !profileData) return [];
    const traits: string[] = [];

    // Marital Status
    const myMarital = String(currentUserData.maritalStatus || currentUserData.maritalStatusName || '').toLowerCase().trim();
    const theirMarital = String(profileData.maritalStatus || profileData.maritalStatusName || '').toLowerCase().trim();
    if (myMarital && theirMarital && (myMarital === theirMarital || (myMarital.includes('never') && theirMarital.includes('never')))) {
      traits.push(profileData.maritalStatus || 'Never Married');
    }

    // Sect
    const mySect = String(currentUserData.sect || currentUserData.sectName || '').toLowerCase().trim();
    const theirSect = String(sectText || '').toLowerCase().trim();
    if (mySect && theirSect && mySect === theirSect) {
      traits.push(sectText);
    }

    // Location
    const myState = String(currentUserData.stateName || currentUserData.currentStateName || '').toLowerCase().trim();
    const theirState = String(profileData.currentStateName || profileData.stateName || '').toLowerCase().trim();
    if (myState && theirState && myState === theirState) {
      traits.push(`Same State (${profileData.currentStateName || profileData.stateName})`);
    }

    // Mother Tongue
    const myLang = String(currentUserData.motherTongue || currentUserData.motherTongueName || '').toLowerCase().trim();
    const theirLang = String(profileData.motherTongue || profileData.motherTongueName || '').toLowerCase().trim();
    if (myLang && theirLang && myLang === theirLang) {
      traits.push(`Speaks ${profileData.motherTongue || profileData.motherTongueName}`);
    }

    // Diet
    const myDiet = String(currentUserData.dietType || '').toLowerCase().trim();
    const theirDiet = String(profileData.dietType || '').toLowerCase().trim();
    if (myDiet && theirDiet && myDiet === theirDiet) {
      traits.push(profileData.dietType);
    }

    return traits;
  }, [currentUserData, profileData, sectText]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6 max-w-3xl mx-auto space-y-6 animate-pulse pt-6">
        <div className="w-full aspect-[4/5] md:aspect-[16/9] rounded-3xl bg-slate-200" />
        <div className="h-10 bg-slate-200 rounded-xl" />
        <div className="h-40 bg-slate-200 rounded-3xl" />
        <div className="h-40 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-[#E21E5B] mb-4 shadow-sm">
          <User size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Profile Not Found</h2>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          This candidate profile could not be loaded or may no longer be available.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-2.5 bg-[#E21E5B] text-white font-bold text-sm rounded-xl shadow-md hover:bg-[#c2154b] transition-all cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const allPhotos = gallery.length > 0 ? gallery : [{ photoUrl: profileData.mainPhotoUrl || profileData.photoUrl || DEFAULT_FEMALE_AVATAR }];
  const interestStatus = profileData.interestStatus || profileData.InterestStatus || 'None';
  const rawPrivacy = profileData.photoPrivacy || profileData.PhotoPrivacy || 'All Members';
  const privacyClean = String(rawPrivacy).toLowerCase().replace(/\s+/g, '');
  const isUserPaid = checkIsUserPaid(profileData);
  const hasRequestedPhoto = Boolean(profileData.hasRequestedPhoto ?? profileData.HasRequestedPhoto);
  
  const rawPhotoReqStatus = String(
    profileData.photoRequestStatus || profileData.PhotoRequestStatus || 
    profileData.galleryRequestStatus || profileData.GalleryRequestStatus || ''
  ).trim().toUpperCase();

  const isPhotoReqAccepted = (
    rawPhotoReqStatus === 'ACCEPTED' || 
    rawPhotoReqStatus === 'SENTACCEPTED' || 
    rawPhotoReqStatus === 'APPROVED' ||
    Boolean(profileData.isPhotoReqAccepted ?? profileData.IsPhotoReqAccepted)
  );

  const isPhotoReqSent = localPhotoReqSent || hasRequestedPhoto || (rawPhotoReqStatus === 'SENTPENDING');

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

  // Block access to Deleted / Deactivated profiles
  const targetAccountState = String(profileData.accountState || profileData.AccountState || '').toLowerCase();
  const targetIsActive = Boolean(profileData.isActive ?? profileData.IsActive ?? true);

  if (!isOwnProfile && (
    targetAccountState.includes('del') || 
    targetAccountState.includes('deact') || 
    targetAccountState.includes('pause') || 
    targetAccountState.includes('admin') || 
    targetAccountState.includes('block') || 
    targetIsActive === false
  )) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center text-[#E21E5B] mb-4 shadow-md border-2 border-rose-200">
          <UserX size={40} />
        </div>
        <h2 className="text-2xl font-serif font-extrabold text-slate-900 mb-2 uppercase tracking-tight">Profile Unavailable</h2>
        <p className="text-sm font-semibold text-slate-500 max-w-sm mb-6 leading-relaxed">
          This candidate profile is no longer available because the account has been deleted or temporarily deactivated.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 bg-[#E21E5B] text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-lg hover:bg-[#c2154b] transition-all cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Photo privacy condition
  let isPhotoHidden = false;
  if (!isOwnProfile) {
    if (isPhotoReqAccepted) {
      isPhotoHidden = false;
    } else if (privacyClean.includes('approved')) {
      isPhotoHidden = true;
    } else if (privacyClean.includes('premium')) {
      isPhotoHidden = !isUserPaid;
    } else {
      isPhotoHidden = false;
    }
  }

  const isVerified = checkIsVerified(profileData);
  const isPremium = checkIsPremium(profileData);
  const rawPhotoSrc = allPhotos[activePhotoIndex]?.photoUrl || profileData.mainPhotoUrl || profileData.photoUrl;
  const currentPhotoSrc = getOptimizedImageUrl(rawPhotoSrc, profileData.userId || 1, profileData.gender);
  const myAvatarUrl = currentUserData?.mainPhotoUrl || currentUserData?.photoUrl || DEFAULT_FEMALE_AVATAR;

  const displayAge = profileData.age || 24;
  const maritalStatus = profileData.maritalStatusName || profileData.MaritalStatusName || profileData.maritalStatus || profileData.MaritalStatus || 'Never Married';

  const currentPresence = onlineUsers[targetUserIdNum];
  const isOnline = currentPresence ? Boolean(currentPresence.isOnline) : false;
  const lastSeenTime = currentPresence ? currentPresence.lastSeen : (profileData.lastSeen || profileData.LastSeen || null);

  const isInterestSent = Boolean(
    profileData.isInterestSent || profileData.IsInterestSent || 
    interestStatus === 'SentPending' || interestStatus.includes('Sent') ||
    interestStatus === 'SENT' || interestStatus === 'PENDING' || interestStatus === 'Sent'
  );
  const isConnected = interestStatus === 'Accepted' || interestStatus === 'ACCEPTED' || Boolean(profileData.isCanChat ?? profileData.IsCanChat);
  const isShortlisted = Boolean(profileData.isShortlisted || profileData.IsShortlisted);

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-slate-900 w-full relative selection:bg-[#E21E5B] selection:text-white pb-32">
      <Toaster position="top-center" richColors duration={2000} />

      <div className="max-w-3xl mx-auto md:py-6 md:px-4 space-y-4">
        
        {/* 🖼️ HERO PROFILE PHOTO CONTAINER */}
        <div className="relative w-full rounded-b-3xl md:rounded-3xl overflow-hidden bg-slate-950 shadow-lg border border-slate-200">
          
          {/* HEADER NAV BAR (BACK BUTTON & 3-DOT MENU) */}
          <div className="absolute top-4 inset-x-4 z-30 flex items-center justify-between pointer-events-auto">
            <button
              type="button"
              onClick={handleBack}
              className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-lg cursor-pointer transition-transform duration-100 active:scale-90 touch-manipulation select-none"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex items-center gap-2">
              {/* 📄 Sleek Top Header Biodata PDF Button */}
              <button 
                type="button"
                onClick={() => setShowBiodataModal(true)}
                className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-md cursor-pointer transition-all active:scale-90"
                title="Download Islamic Biodata (PDF)"
                aria-label="Download Biodata"
              >
                <Printer size={18} className="text-white" />
              </button>

              <div className="relative">
                <button 
                  onClick={() => setShowThreeDotMenu(!showThreeDotMenu)}
                  className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-md cursor-pointer transition-all active:scale-90"
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
                    className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden"
                  >
                    <button 
                      onClick={handleShareProfile}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-[#E21E5B] flex items-center gap-2.5 transition-colors cursor-pointer border-b border-slate-100"
                    >
                      <Share2 size={16} className="text-[#E21E5B]" />
                      <div>
                        <span>Share Profile</span>
                        <span className="block text-[10px] text-slate-400 font-normal">ID: {profileMemberId}</span>
                      </div>
                    </button>

                    <button 
                      onClick={() => {
                        setShowThreeDotMenu(false);
                        setShowBiodataModal(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-stone-800 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2.5 transition-colors cursor-pointer border-b border-slate-100"
                    >
                      <Printer size={16} className="text-amber-700" />
                      <div>
                        <span>Download Biodata (PDF)</span>
                        <span className="block text-[10px] text-stone-400 font-normal">Official Islamic Format</span>
                      </div>
                    </button>

                    <button 
                      onClick={handleReportUser}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-b border-slate-100"
                    >
                      <Flag size={16} className="text-amber-500" />
                      <span>Report Profile</span>
                    </button>

                    <button 
                      onClick={handleBlockUser}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Ban size={16} className="text-rose-600" />
                      <span>Block Profile</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

          {/* MAIN PHOTO FRAME */}
          <div 
            onClick={() => !isPhotoHidden && setShowPhotoModal(true)}
            className="relative aspect-[4/5] md:aspect-[16/10] w-full bg-slate-950 cursor-pointer overflow-hidden"
          >
            <img 
              src={currentPhotoSrc}
              alt={fullName}
              className={`w-full h-full object-cover object-top ${isPhotoHidden ? 'blur-2xl scale-110 opacity-60' : ''}`}
            />

            {/* PHOTO COUNT BADGE */}
            {!isPhotoHidden && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPhotoModal(true);
                }}
                className="absolute top-4 right-16 z-30 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white flex items-center gap-1.5 border border-white/20 shadow-md cursor-pointer transition-all text-xs font-bold"
                title="View Photo Gallery"
              >
                <Camera size={14} />
                <span>{allPhotos.length}</span>
              </button>
            )}

            {/* PHOTO HIDDEN PRIVACY BADGE */}
            {isPhotoHidden && (
              <div 
                onClick={(e) => e.stopPropagation()} 
                className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-black/60 backdrop-blur-md text-white space-y-3 cursor-default"
              >
                <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300">
                  <Lock size={26} />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="font-bold text-base">Photo is Protected</h4>
                  <p className="text-xs text-slate-300">This member has kept photos private. Send a request to view.</p>
                </div>
                {isPhotoReqSent ? (
                  <div className="px-5 py-2.5 bg-emerald-50 border border-emerald-400 text-emerald-700 font-bold text-xs rounded-full shadow-lg flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>✓ Photo Request Sent</span>
                  </div>
                ) : (
                  <button
                    onClick={(e) => handleInteraction(e, 'PHOTO_REQUEST', 'PENDING')}
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-[#E21E5B] hover:bg-[#c2154b] text-white font-bold text-xs rounded-full shadow-lg transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                  >
                    {actionLoading && actionLoadingType === 'PHOTO_REQUEST' ? (
                      <Loader2 size={15} className="animate-spin text-white" />
                    ) : (
                      <Camera size={15} />
                    )}
                    <span>Request Photo</span>
                  </button>
                )}
              </div>
            )}

            {/* GRADIENT OVERLAY */}
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent pointer-events-none z-20" />

            {/* CANDIDATE INFO OVERLAY */}
            <div className="absolute bottom-4 inset-x-5 z-30 text-white pointer-events-none space-y-1">
              <div className="flex items-center gap-2">
                {isOnline && (
                  <span className="flex items-center gap-1.5 bg-emerald-950/80 backdrop-blur-sm border border-emerald-400/60 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Online 🟢</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap drop-shadow-md">
                <h2 className="font-serif font-bold text-2xl md:text-3xl tracking-wide flex items-center gap-2">
                  <span>{fullName}, {displayAge}</span>
                </h2>
                <div className="flex items-center gap-1.5 pointer-events-auto">
                  <ProfileStatusIcons isVerified={isVerified} isPremium={isPremium} size={22} />
                  
                  {/* ⚡ Sleek Compatibility Badge inside Hero */}
                  <button
                    type="button"
                    onClick={() => setShowCompatibilityModal(true)}
                    className="inline-flex items-center gap-1 bg-emerald-500/30 hover:bg-emerald-500/50 backdrop-blur-md border border-emerald-400/50 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm cursor-pointer transition-all active:scale-95 ml-1"
                  >
                    <Sparkles size={11} className="text-emerald-300" />
                    <span>{compatibility.score}% Match</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🚀 HORIZONTAL UNDERLINE TABS BAR (STICKY WITH SCROLL-SPY) */}
        {availableTabs.length > 0 && (
          <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-0 shadow-xs -mx-2 md:mx-0 md:rounded-2xl transition-all">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth">
              {availableTabs.map((tab) => {
                const isActive = activeTabId === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => scrollToSection(tab.id)}
                    className={`py-3 text-sm whitespace-nowrap transition-all duration-200 cursor-pointer border-b-2 font-bold ${
                      isActive
                        ? 'border-[#E21E5B] text-[#E21E5B]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 📋 PROFILE SECTIONS STACK */}
        <div className="space-y-4 px-2 md:px-0">

          {/* 1. 👤 BASIC DETAILS (FIRST IN ORDER AS PER USER SCREENSHOT 1) */}
          <section id="section-basic" className="bg-white rounded-3xl p-5 md:p-6 shadow-xs border border-slate-200/80 space-y-4 scroll-mt-20">
            <h3 className="font-serif font-extrabold text-base md:text-lg text-slate-900">Basic Details</h3>
            <div className="space-y-3 pt-1">
              {/* Marital Status */}
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                  <HeartHandshake size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-extrabold text-slate-900 block font-sans">
                    {maritalStatus || "Never Married"}
                  </span>
                </div>
              </div>

              {/* Height */}
              {(profileData.height || profileData.Height) && (
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                    <Ruler size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-extrabold text-slate-900 block font-sans">
                      {profileData.height || profileData.Height}
                    </span>
                  </div>
                </div>
              )}

              {/* Location */}
              {((profileData.currentCityName || profileData.CurrentCityName || profileData.cityName) || profileData.currentStateName || profileData.stateName) && (
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-extrabold text-slate-900 block font-sans">
                      {[profileData.currentCityName || profileData.CurrentCityName || profileData.cityName, profileData.currentStateName || profileData.CurrentStateName || profileData.stateName, "India"].filter(Boolean).join(", ")}
                    </span>
                  </div>
                </div>
              )}

              {/* Language / Mother Tongue */}
              {(profileData.motherTongueName || profileData.MotherTongueName || profileData.motherTongue || profileData.MotherTongue) && (
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                    <Globe size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-extrabold text-slate-900 block font-sans">
                      {profileData.motherTongueName || profileData.MotherTongueName || profileData.motherTongue || profileData.MotherTongue}
                    </span>
                  </div>
                </div>
              )}

              {/* Sect / Caste / Maslak */}
              {(sectText || maslakText || profileData.casteName || profileData.caste) && (
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                    <Moon size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-extrabold text-slate-900 block font-sans">
                      {[sectText || "Muslim", profileData.casteName || profileData.caste, maslakText].filter(Boolean).join(", ")}
                    </span>
                  </div>
                </div>
              )}

              {/* Profile Created By */}
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                  <User size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-extrabold text-slate-900 block font-sans">
                    {profileData.profileCreatedForName || profileData.ProfileCreatedForName 
                      ? `Profile created for ${profileData.profileCreatedForName || profileData.ProfileCreatedForName}`
                      : profileData.profileCreatedFor 
                        ? `Profile created for ${profileData.profileCreatedFor}`
                        : "Profile created by Self"}
                  </span>
                </div>
              </div>

              {/* Native Place */}
              {(profileData.nativeCityName || profileData.NativeCityName) && (
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                    <Compass size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-extrabold text-slate-900 block font-sans">
                      Native: {[profileData.nativeCityName || profileData.NativeCityName, profileData.nativeStateName || profileData.NativeStateName].filter(Boolean).join(", ")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 2. 📌 CANDIDATE'S BIO (RIGHT AFTER BASIC DETAILS MATCHING USER SCREENSHOT 1) */}
          {(profileData.aboutMe || profileData.AboutMe) && (
            <section id="section-about" className="bg-white rounded-3xl p-5 md:p-6 shadow-xs border border-slate-200/80 space-y-3">
              <h3 className="font-serif font-extrabold text-base md:text-lg text-slate-900">
                {profileData.fullName ? `${String(profileData.fullName).trim().split(' ')[0]}'s Bio` : "Candidate's Bio"}
              </h3>
              <div className="text-sm text-slate-600 leading-relaxed font-sans">
                <p className={isBioExpanded ? '' : 'line-clamp-3'}>
                  {profileData.aboutMe || profileData.AboutMe}
                </p>
                {String(profileData.aboutMe || profileData.AboutMe).length > 130 && (
                  <button 
                    type="button"
                    onClick={() => setIsBioExpanded(!isBioExpanded)}
                    className="text-[#E21E5B] font-extrabold text-xs mt-1 hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>{isBioExpanded ? 'View Less' : 'View More'}</span>
                  </button>
                )}
              </div>
            </section>
          )}

          {/* 3. 🤝 THINGS YOU BOTH SHARE IN COMMON */}
          {commonTraits.length > 0 && (
            <section className="bg-white rounded-3xl p-5 md:p-6 shadow-xs border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center -space-x-3">
                  <img 
                    src={myAvatarUrl} 
                    alt="You" 
                    className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm bg-slate-200" 
                  />
                  <img 
                    src={currentPhotoSrc} 
                    alt={fullName} 
                    className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm bg-slate-200" 
                  />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Things you both share in common</h4>
                  <p className="text-[11px] text-slate-500 font-medium">You both have {commonTraits.length} matching preferences</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {commonTraits.map((trait, idx) => (
                  <span 
                    key={idx} 
                    className="px-3 py-1 rounded-full bg-rose-50 text-[#E21E5B] border border-rose-200 text-xs font-bold"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* 3. 📱 DIRECT CANDIDATE CONTACT DETAILS CARD */}
          <section id="section-contact" className="bg-white rounded-3xl p-5 md:p-6 shadow-xs border border-rose-100/90 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif font-extrabold text-base md:text-lg text-slate-900">Contact Details</h3>
              {contactData ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Unlocked</span>
                </span>
              ) : isUserPaid ? (
                <span className="text-[11px] font-bold text-[#E21E5B] bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  {remainingContactsCount} Contacts Left
                </span>
              ) : null}
            </div>

            {!contactData ? (
              /* MASKED CONTACT CARD (MATCHES USER SCREENSHOT) */
              <div className="space-y-4 pt-1">
                {/* Masked Phone Row */}
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-[#E21E5B] shrink-0 shadow-xs">
                    <Phone size={19} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-base font-extrabold text-slate-800 tracking-wide font-sans block">
                      {maskedPhoneDisplay}
                    </span>
                  </div>
                </div>

                {/* Masked Email Row */}
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-[#E21E5B] shrink-0 shadow-xs">
                    <Mail size={19} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-base font-extrabold text-slate-800 tracking-wide font-sans block">
                      {maskedEmailDisplay}
                    </span>
                  </div>
                </div>

                {/* Divider & Action Area */}
                <div className="border-t border-slate-100 pt-4 text-center space-y-3">
                  {isUserPaid ? (
                    <>
                      <p className="text-sm font-extrabold text-slate-900">
                        View contact details
                      </p>

                      <button
                        onClick={handleUnlockContact}
                        disabled={actionLoading}
                        className="w-full max-w-xs mx-auto py-3 px-8 rounded-full bg-[#E21E5B] hover:bg-[#c2154b] text-white font-extrabold text-sm shadow-md shadow-rose-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        {actionLoading && actionLoadingType === 'VIEW_CONTACT' ? (
                          <Loader2 size={17} className="animate-spin text-white" />
                        ) : (
                          <Phone size={16} />
                        )}
                        <span>View Contact</span>
                      </button>

                      <p className="text-xs text-slate-500 font-medium">
                        You currently have <strong className="text-[#E21E5B] font-extrabold">{remainingContactsCount} contacts left</strong>
                      </p>
                    </>
                  ) : (
                    /* 🔒 FREE UNPAID USER: VIEW CONTACT BUTTON STRICTLY HIDDEN */
                    <div className="py-2 space-y-3">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                        <Lock size={13} />
                        <span>Premium Feature</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        Upgrade to Premium to view contact details
                      </p>
                      <button
                        onClick={() => router.push('/dashboard/membership')}
                        className="w-full max-w-xs mx-auto py-2.5 px-6 rounded-full bg-gradient-to-r from-amber-500 via-[#E21E5B] to-rose-600 hover:brightness-110 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Crown size={14} className="text-amber-200 fill-amber-200" />
                        <span>Upgrade to View Contact</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* UNLOCKED CONTACT DETAILS */
              <div className="space-y-3 pt-1">
                {/* Phone Unlocked */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Phone size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Phone Number</span>
                      <span className="text-sm font-extrabold text-slate-900 block truncate font-mono">
                        {contactData.mobile}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:${contactData.mobile}`}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-emerald-600 hover:border-emerald-200 transition-all cursor-pointer shadow-xs"
                      title="Call"
                    >
                      <Phone size={15} />
                    </a>
                    <a
                      href={`https://wa.me/${contactData.mobile.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-emerald-600 hover:border-emerald-200 transition-all cursor-pointer shadow-xs"
                      title="WhatsApp"
                    >
                      <MessageCircle size={15} />
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(contactData.mobile);
                        toast.success("Phone number copied!");
                      }}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#E21E5B] hover:border-rose-200 transition-all cursor-pointer shadow-xs"
                      title="Copy Number"
                    >
                      <Copy size={15} />
                    </button>
                  </div>
                </div>

                {/* Email Unlocked */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Mail size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Email Address</span>
                      <span className="text-sm font-extrabold text-slate-900 block truncate font-mono">
                        {contactData.email}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`mailto:${contactData.email}`}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer shadow-xs"
                      title="Send Email"
                    >
                      <Mail size={15} />
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(contactData.email);
                        toast.success("Email address copied!");
                      }}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#E21E5B] hover:border-rose-200 transition-all cursor-pointer shadow-xs"
                      title="Copy Email"
                    >
                      <Copy size={15} />
                    </button>
                  </div>
                </div>

                {/* 📲 1-CLICK DIRECT WHATSAPP CONNECT */}
                {contactData.mobile && contactData.mobile !== 'Not Disclosed' && (
                  <a
                    href={`https://api.whatsapp.com/send?phone=${contactData.mobile.replace(/\D/g, '')}&text=${encodeURIComponent(
                      `Assalamu Alaikum! I viewed your profile on Nikah Qubool (Member ID: ${profileData?.memberId || 'NQ' + (profileData?.userId || '')}). We liked your profile and would like to connect regarding the matrimonial alliance. JazakAllah Khair.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer mt-1"
                  >
                    <MessageCircle size={18} className="fill-white" />
                    <span>Chat on WhatsApp Directly</span>
                  </a>
                )}

                {isUserPaid && (
                  <p className="text-[11px] text-center text-slate-400 font-medium pt-1">
                    Remaining contacts quota: <strong className="text-[#E21E5B] font-bold">{remainingContactsCount}</strong>
                  </p>
                )}
              </div>
            )}
          </section>

          {/* 5. 🎓 EDUCATION & CAREER (MATCHING USER SCREENSHOT 2) */}
          {(profileData.highestDegreeName || profileData.HighestDegreeName || profileData.highestDegree || profileData.HighestDegree || profileData.collegeName || profileData.designationName || profileData.designation || profileData.profession || profileData.annualIncome) && (
            <section id="section-education" className="bg-white rounded-3xl p-5 md:p-6 shadow-xs border border-slate-200/80 space-y-4 scroll-mt-20">
              <h3 className="font-serif font-extrabold text-base md:text-lg text-slate-900">Education & Career</h3>
              <div className="space-y-4 pt-1">
                {/* Degree */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-xs">
                    <GraduationCap size={18} />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <span className="text-sm font-extrabold text-slate-900 block font-sans">
                      {profileData.highestDegreeName || profileData.HighestDegreeName || profileData.highestDegree || profileData.HighestDegree || "Graduate"}
                    </span>
                    {(profileData.collegeName || profileData.CollegeName) && (
                      <span className="text-xs text-slate-500 font-medium block mt-0.5">
                        {profileData.collegeName || profileData.CollegeName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Profession / Sector */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-xs">
                    <Briefcase size={18} />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <span className="text-sm font-extrabold text-slate-900 block font-sans">
                      {profileData.designationName || profileData.DesignationName || profileData.designation || profileData.profession || "Working Professional"}
                    </span>
                    <span className="text-xs text-slate-500 font-medium block mt-0.5">
                      {profileData.employmentSectorName || profileData.EmploymentSectorName || profileData.employmentSector || "Business / Self Employed"}
                    </span>
                  </div>
                </div>

                {/* Income */}
                {(profileData.annualIncome || profileData.AnnualIncome) && (
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-xs">
                      <Wallet size={18} />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <span className="text-sm font-extrabold text-slate-900 block font-sans">
                        {profileData.annualIncome || profileData.AnnualIncome}
                      </span>
                      <span className="text-xs text-slate-500 font-medium block mt-0.5">
                        Annual Income
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 6. 🏡 FAMILY DETAILS (MATCHING USER SCREENSHOT 2) */}
          {(profileData.familyTypeName || profileData.familyType || profileData.fatherOccupation || profileData.motherOccupation || (profileData.totalBrothers !== undefined && profileData.totalBrothers !== null && Number(profileData.totalBrothers) > 0) || (profileData.totalSisters !== undefined && profileData.totalSisters !== null && Number(profileData.totalSisters) > 0) || profileData.familyAbout) && (
            <section id="section-family" className="bg-white rounded-3xl p-5 md:p-6 shadow-xs border border-slate-200/80 space-y-4 scroll-mt-20">
              <h3 className="font-serif font-extrabold text-base md:text-lg text-slate-900">Family Details</h3>
              <div className="space-y-4 pt-1">
                {/* Family Location */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-xs">
                    <MapPin size={18} />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Family lives in</span>
                    <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                      {[profileData.currentCityName || profileData.CurrentCityName || profileData.cityName, profileData.currentStateName || profileData.CurrentStateName || profileData.stateName, "India"].filter(Boolean).join(", ")}
                    </span>
                  </div>
                </div>

                {/* Native Place */}
                {(profileData.nativeCityName || profileData.NativeCityName) && (
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-xs">
                      <Compass size={18} />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Native Place</span>
                      <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                        {[profileData.nativeCityName || profileData.NativeCityName, profileData.nativeStateName || profileData.NativeStateName].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Family Background */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-xs">
                    <Users size={18} />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Family Background</span>
                    <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                      {[profileData.familyStatusName || profileData.FamilyStatusName || "Upper Middle Class", profileData.familyTypeName || profileData.FamilyTypeName || "Joint Family"].filter(Boolean).join(", ")}
                    </span>
                  </div>
                </div>

                {/* Father's Occupation */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-xs">
                    <Briefcase size={18} />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Father&apos;s Occupation</span>
                    <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                      {profileData.fatherOccupationName || profileData.FatherOccupationName || profileData.fatherOccupation || "Business / Self Employed"}
                    </span>
                  </div>
                </div>

                {/* Mother's Occupation */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-xs">
                    <Briefcase size={18} />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Mother&apos;s Occupation</span>
                    <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                      {profileData.motherOccupationName || profileData.MotherOccupationName || profileData.motherOccupation || "Homemaker"}
                    </span>
                  </div>
                </div>

                {/* Siblings */}
                {((profileData.totalBrothers !== undefined && profileData.totalBrothers !== null) || (profileData.totalSisters !== undefined && profileData.totalSisters !== null)) && (
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-xs">
                      <Users size={18} />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Brothers / Sisters</span>
                      <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                        {[
                          Number(profileData.totalBrothers || 0) > 0 ? `${profileData.totalBrothers} Brother${Number(profileData.totalBrothers) > 1 ? 's' : ''}${Number(profileData.marriedBrothers || 0) > 0 ? ` (${profileData.marriedBrothers} Married)` : ''}` : null,
                          Number(profileData.totalSisters || 0) > 0 ? `${profileData.totalSisters} Sister${Number(profileData.totalSisters) > 1 ? 's' : ''}${Number(profileData.marriedSisters || 0) > 0 ? ` (${profileData.marriedSisters} Married)` : ''}` : null
                        ].filter(Boolean).join(", ") || "No siblings specified"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {profileData.familyAbout && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">About Family</span>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    {profileData.familyAbout}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* 7. 🕌 RELIGIOUS DETAILS (MATCHING USER SCREENSHOT 3) */}
          {(sectText || maslakText || profileData.casteName || profileData.caste || profileData.namazHabit) && (
            <section id="section-religious" className="bg-white rounded-3xl p-5 md:p-6 shadow-xs border border-slate-200/80 space-y-3.5 scroll-mt-20">
              <h3 className="font-serif font-extrabold text-base md:text-lg text-slate-900">Religious Details</h3>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-700 shadow-xs">
                  <span>🕌</span>
                  <span>{profileData.namazHabit || profileData.preferredNamazHabit || 'Regularly'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-700 shadow-xs">
                  <Check size={14} className="text-emerald-600 stroke-[3]" />
                  <span>{profileData.fastingHabit || 'Yes'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-700 shadow-xs">
                  <span>🕌</span>
                  <span>{profileData.quranHabit || 'Regularly'}</span>
                </span>
                {profileData.zakatHabit && (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-700 shadow-xs">
                    <span>🤲</span>
                    <span>{profileData.zakatHabit}</span>
                  </span>
                )}
                {(profileData.hijabOrBeard || preferences?.preferredHijabOrBeard) && (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-700 shadow-xs">
                    <span>✨</span>
                    <span>{profileData.hijabOrBeard || preferences?.preferredHijabOrBeard}</span>
                  </span>
                )}
              </div>
            </section>
          )}

          {/* 8. 🌿 LIFESTYLE & INTEREST (MATCHING USER SCREENSHOT 3) */}
          {(profileData.dietType || profileData.DietType || profileData.smokeHabit || profileData.SmokeHabit || profileData.drinkHabit || profileData.DrinkHabit || (profileData.canCook !== undefined && profileData.canCook !== null) || profileData.hobbies || profileData.Hobbies || profileData.interests || profileData.Interests) && (
            <section id="section-lifestyle" className="bg-white rounded-3xl p-5 md:p-6 shadow-xs border border-slate-200/80 space-y-3.5 scroll-mt-20">
              <h3 className="font-serif font-extrabold text-base md:text-lg text-slate-900">Lifestyle & Interest</h3>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-700 shadow-xs">
                  <span>🚭</span>
                  <span>{profileData.smokeHabit || 'No'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-700 shadow-xs">
                  <span>🍷</span>
                  <span>{profileData.drinkHabit || 'No'}</span>
                </span>
                {(profileData.dietType || profileData.DietType) && (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-700 shadow-xs">
                    <span>🍲</span>
                    <span>{profileData.dietType || profileData.DietType}</span>
                  </span>
                )}
              </div>

              {/* Hobbies / Interests tags if present */}
              {((profileData.hobbies || profileData.Hobbies) || (profileData.interests || profileData.Interests)) && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                  {String(profileData.hobbies || profileData.Hobbies || profileData.interests || profileData.Interests).split(',').map((item: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs">
                      {item.trim()}
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* 9. 🎯 PARTNER PREFERENCES */}
          {preferences && (preferences.minAge || preferences.minHeight || preferences.preferredMaritalStatus || preferences.preferredSect || preferences.preferredEducation || preferences.preferredOccupation || preferences.preferredState || profileData.partnerExpectations || profileData.PartnerExpectations) && (
            <section id="section-preferences" className="bg-white rounded-3xl p-5 md:p-6 shadow-xs border border-slate-200/80 space-y-4 scroll-mt-20">
              <h3 className="font-serif font-extrabold text-base md:text-lg text-slate-900">Partner Preferences</h3>

              {(profileData.partnerExpectations || profileData.PartnerExpectations) && (
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100 italic">
                  &ldquo;{profileData.partnerExpectations || profileData.PartnerExpectations}&rdquo;
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <CardInfoItem label="Preferred Age" value={preferences?.minAge ? `${preferences.minAge} to ${preferences.maxAge} Years` : null} />
                <CardInfoItem label="Preferred Height" value={preferences?.minHeight ? `${preferences.minHeight} - ${preferences.maxHeight}` : null} />
                <CardInfoItem label="Preferred Marital Status" value={preferences?.preferredMaritalStatus || preferences?.maritalStatus} />
                <CardInfoItem label="Preferred Sect" value={preferences?.preferredSect || preferences?.sect} />
                <CardInfoItem label="Preferred Caste" value={preferences?.preferredCaste || preferences?.caste} />
                <CardInfoItem label="Preferred Education" value={preferences?.preferredEducation || preferences?.education} />
                <CardInfoItem label="Preferred Profession" value={preferences?.preferredOccupation || preferences?.occupation} />
                <CardInfoItem label="Preferred Location" value={preferences?.preferredState || preferences?.state} />
              </div>
            </section>
          )}

          {/* 10. 🏷️ MEMBER PROFILE ID & CIRCULAR ACTION BUTTONS (EXACT DESIGN MATCHING USER SCREENSHOT 3) */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 text-center space-y-6 pt-6 pb-8">
            {/* Member Profile ID */}
            <div className="inline-flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-700">
                Member Profile ID: <strong className="font-mono text-slate-900 uppercase">{profileMemberId}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  const liveShareUrl = `https://nikahqubool.in/dashboard/profile?userId=${targetUserIdNum}`;
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(liveShareUrl);
                  }
                  toast.success("Live profile link copied to clipboard!");
                }}
                className="p-1 text-slate-400 hover:text-[#E21E5B] cursor-pointer transition-colors"
                title="Copy live profile link"
              >
                <Copy size={15} />
              </button>
            </div>

            {/* 3 Circular Action Buttons - Dashboard Best Matches Theme & Colors */}
            <div className="flex items-center justify-center gap-8 pt-2">
              {/* 1. Shortlist */}
              <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={(e) => handleInteraction(e, 'SHORTLIST', isShortlisted ? 'REMOVED' : 'ACTIVE')}
                  disabled={actionLoading}
                  className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full border flex items-center justify-center shadow-md transition-all cursor-pointer ${
                    isShortlisted
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-amber-400/30'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300 shadow-slate-200/50'
                  }`}
                  aria-label={isShortlisted ? "Shortlisted" : "Shortlist"}
                >
                  {actionLoading && actionLoadingType === 'SHORTLIST' ? (
                    <Loader2 size={20} className="animate-spin text-amber-500" />
                  ) : (
                    <Bookmark size={22} className={isShortlisted ? 'fill-current stroke-[2]' : 'fill-none stroke-[2]'} />
                  )}
                </motion.button>
                <span className={`text-xs font-bold ${isShortlisted ? 'text-amber-600' : 'text-slate-600'}`}>
                  {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                </span>
              </div>

              {/* 2. Message */}
              <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={handleInitiateChat}
                  disabled={actionLoading}
                  className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#4F46E5] hover:bg-[#4338CA] text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                  aria-label="Message"
                >
                  {actionLoading && actionLoadingType === 'CHAT' ? (
                    <Loader2 size={20} className="animate-spin text-white" />
                  ) : (
                    <MessageCircle size={22} className="stroke-[2] fill-white/20" />
                  )}
                </motion.button>
                <span className="text-xs font-bold text-slate-600">Message</span>
              </div>

              {/* 3. Interest */}
              <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
                <motion.button
                  type="button"
                  whileHover={(isInterestSent || isConnected) ? {} : { scale: 1.08 }}
                  whileTap={(isInterestSent || isConnected) ? {} : { scale: 0.92 }}
                  onClick={(e) => {
                    if (!isInterestSent && !isConnected) {
                      handleInteraction(e, 'INTEREST', 'PENDING');
                    }
                  }}
                  disabled={actionLoading || isInterestSent || isConnected}
                  className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${
                    isInterestSent || isConnected
                      ? 'bg-rose-50 text-[#E21E5B] border-2 border-[#E21E5B] cursor-default shadow-md'
                      : 'bg-[#E21E5B] hover:bg-[#CE1B53] text-white shadow-lg shadow-rose-500/35 cursor-pointer'
                  }`}
                  aria-label={isInterestSent ? 'Sent' : isConnected ? 'Connected' : 'Interest'}
                >
                  {actionLoading && actionLoadingType === 'INTEREST' ? (
                    <Loader2 size={22} className="animate-spin text-white" />
                  ) : (
                    <Heart
                      size={24}
                      className={isInterestSent || isConnected ? 'fill-[#E21E5B] stroke-[2]' : 'fill-white text-white stroke-[0]'}
                    />
                  )}
                </motion.button>
                <span className={`text-xs font-bold ${isInterestSent || isConnected ? 'text-[#E21E5B]' : 'text-slate-600'}`}>
                  {isInterestSent ? 'Sent' : isConnected ? 'Connected' : 'Interest'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>



      {/* 🖼️ FULL PHOTO GALLERY MODAL (POPUP WITH COUNTER & ARROWS) */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 md:p-6 select-none">
          {/* Top Header: Close Button on Left, Counter on Right */}
          <div className="flex items-center justify-between z-20">
            <button 
              onClick={() => setShowPhotoModal(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              aria-label="Close"
            >
              <X size={22} />
            </button>

            <span className="text-sm font-bold text-white tracking-wider">
              {activePhotoIndex + 1} / {allPhotos.length}
            </span>
          </div>

          {/* Center Image with Prev / Next Navigation Arrows */}
          <div className="relative flex-1 flex items-center justify-center my-4">
            {allPhotos.length > 1 && (
              <button
                type="button"
                onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1))}
                className="absolute left-2 md:left-6 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 flex items-center justify-center cursor-pointer transition-all"
                aria-label="Previous Photo"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <img 
              src={getOptimizedImageUrl(allPhotos[activePhotoIndex]?.photoUrl || currentPhotoSrc, profileData.userId, profileData.gender)} 
              alt={`${fullName} photo ${activePhotoIndex + 1}`}
              className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-2xl transition-all duration-300"
            />

            {allPhotos.length > 1 && (
              <button
                type="button"
                onClick={() => setActivePhotoIndex((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0))}
                className="absolute right-2 md:right-6 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 flex items-center justify-center cursor-pointer transition-all"
                aria-label="Next Photo"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Bottom Horizontal Thumbnails Strip */}
          {allPhotos.length > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-20 no-scrollbar">
              {allPhotos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setActivePhotoIndex(index)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    activePhotoIndex === index 
                      ? 'border-[#E21E5B] scale-105 shadow-md shadow-rose-500/30' 
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img 
                    src={getOptimizedImageUrl(photo.photoUrl, profileData.userId, profileData.gender)} 
                    alt="thumb" 
                    className="w-full h-full object-cover" 
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBSCRIPTION MODAL FOR UNPAID USERS */}
      {showSubscriptionModal && (
        <SubscriptionModal 
          isOpen={showSubscriptionModal} 
          onClose={() => setShowSubscriptionModal(false)} 
        />
      )}

      {/* 📄 OFFICIAL ISLAMIC BIODATA MODAL */}
      {showBiodataModal && (
        <IslamicBiodataModal
          isOpen={showBiodataModal}
          onClose={() => setShowBiodataModal(false)}
          profile={profileData}
          contactData={contactData}
          isUserPaid={isUserPaid}
          maskedPhone={maskedPhoneDisplay}
          maskedEmail={maskedEmailDisplay}
          isPhotoHidden={isPhotoHidden}
        />
      )}

      {/* ⚡ AI COMPATIBILITY SCORE BREAKDOWN MODAL */}
      {showCompatibilityModal && (
        <CompatibilityScoreModal
          isOpen={showCompatibilityModal}
          onClose={() => setShowCompatibilityModal(false)}
          currentUser={currentUserData}
          targetProfile={profileData}
        />
      )}

    </div>
  );
}

// 📦 Reusable Detail Card Info Item
function CardInfoItem({ label, value, highlight = false }: { label: string; value: any; highlight?: boolean }) {
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
    <div className={`p-3 rounded-xl border transition-all ${
      highlight 
        ? 'bg-rose-50/70 border-rose-200 text-[#E21E5B]' 
        : 'bg-slate-50/70 border-slate-100 text-slate-800'
    }`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">{label}</span>
      <span className={`text-xs font-bold block ${highlight ? 'text-[#E21E5B]' : 'text-slate-800'}`}>{String(value)}</span>
    </div>
  );
}
