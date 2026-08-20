"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, MoreVertical, Info, Phone, GraduationCap, 
  Users, Moon, Sparkles, Heart, CheckCircle2, Lock, 
  Flag, Ban, Star, MessageCircle, Loader2, ChevronLeft, ChevronRight, Crown, Camera,
  MapPin, Briefcase, Calendar, User, ShieldCheck, Check, X, Maximize2, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { fetchProfileDetailsApi, viewContactDetailsApi, handleInteractionApiCall, blockUserApiCall } from '@/lib/api';
import { getOptimizedImageUrl } from '@/lib/imageUtils';

export default function ProfileDetailPage() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<any>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contactData, setContactData] = useState<{ mobile: string; email: string } | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showThreeDotMenu, setShowThreeDotMenu] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

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

    // ⚡ Optimistic UI update for photo request
    if (type === 'PHOTO_REQUEST') {
      setProfileData((prev: any) => ({
        ...prev,
        hasRequestedPhoto: true,
        photoRequestStatus: 'SentPending'
      }));
    }

    const res = await handleInteractionApiCall(profileData.userId, type, status, token);
    setActionLoading(false);
    setShowThreeDotMenu(false);
    toast.dismiss();

    if (res.success) {
      toast.success(res.message || "Action updated successfully");

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
      } else if (type === 'PHOTO_REQUEST') {
        setProfileData((prev: any) => ({
          ...prev,
          hasRequestedPhoto: true,
          photoRequestStatus: 'SentPending'
        }));
      }

      loadProfileDetails(false);
    } else {
      toast.error(res.message || "Action failed");
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
        <span className="font-black text-xs uppercase tracking-widest text-slate-500">Loading Member Profile...</span>
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

  // 🔒 Photo Hidden Check
  const isSpHidden = Boolean(profileData.isPhotoHidden ?? profileData.IsPhotoHidden);
  const isPhotoReqAccepted = rawPhotoReqStatus.includes('ACCEPT');

  const isPhotoHidden = !isPhotoReqAccepted && (
    isSpHidden 
    || (privacyClean.includes('premium') && !isUserPaid)
    || (privacyClean.includes('onlyapproved') || privacyClean.includes('protected'))
  );

  // Photo Request Sent check
  const isPhotoReqSent = hasRequestedPhoto || rawPhotoReqStatus.includes('SENT') || rawPhotoReqStatus.includes('PENDING');

  const isVerified = Boolean(profileData.isVerified ?? profileData.IsVerified);
  const isPremium = Boolean(profileData.isPremium ?? profileData.IsPremium ?? isUserPaid);
  const rawPhotoSrc = allPhotos[activePhotoIndex]?.photoUrl || profileData.mainPhotoUrl || profileData.photoUrl;
  const currentPhotoSrc = getOptimizedImageUrl(rawPhotoSrc);

  const displayAge = profileData.age || 24;
  const maritalStatus = profileData.maritalStatus || 'Never Married';
  const religion = 'Islam';
  const sect = profileData.sect || 'Sunni';

  const isInterestSent = interestStatus === 'SentPending' || interestStatus.includes('Sent');
  const isInterestReceived = interestStatus === 'ReceivedPending';
  const isConnected = interestStatus === 'Accepted' || Boolean(profileData.isCanChat ?? profileData.IsCanChat);
  const isShortlisted = Boolean(profileData.isShortlisted);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 w-full relative selection:bg-[#d91b5c] selection:text-white pb-12">
      <Toaster position="top-center" richColors duration={2000} />

      <div className="max-w-4xl mx-auto md:py-6 md:px-4 space-y-4">
        
        {/* 🖼️ HERO PROFILE PHOTO CONTAINER & ACTION BAR (ICON BUTTONS, SAME AS DASHBOARD CARDS) */}
        <div className="bg-white md:rounded-3xl overflow-hidden shadow-xl border-b-2 md:border-2 border-rose-100">
          
          {/* HERO PHOTO CONTAINER (FULL BLEED COVER AT TOP) */}
          <div 
            className="relative w-full aspect-[4/4.8] max-h-[580px] bg-slate-950 overflow-hidden cursor-pointer group"
            onClick={() => {
              if (!isPhotoHidden && allPhotos.length > 0) {
                setShowPhotoModal(true);
              }
            }}
          >
            {/* FLOATING TOP OVERLAY CONTROLS: BACK ARROW & 3-DOTS MENU (INSIDE IMAGE) */}
            <div className="absolute top-4 inset-x-4 z-40 flex items-center justify-between pointer-events-auto">
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); router.back(); }} 
                className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
                aria-label="Go Back"
              >
                <ArrowLeft size={22} />
              </button>

              <div className="relative">
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); setShowThreeDotMenu(!showThreeDotMenu); }} 
                  className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
                  aria-label="More Options"
                >
                  <MoreVertical size={22} />
                </button>

                <AnimatePresence>
                  {showThreeDotMenu && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 5 }} 
                      animate={{ opacity: 1, scale: 1, y: 0 }} 
                      exit={{ opacity: 0, scale: 0.9, y: 5 }} 
                      className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border-2 border-rose-100 p-2 z-[70] text-slate-800"
                    >
                      <button 
                        type="button" 
                        disabled={actionLoading} 
                        onClick={(e) => handleInteraction(e, 'REPORT', 'PENDING')} 
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-rose-50 hover:text-[#d91b5c] transition-all cursor-pointer"
                      >
                        <Flag size={15} /> Report Profile
                      </button>
                      <button 
                        type="button" 
                        disabled={actionLoading} 
                        onClick={handleBlockUser} 
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                      >
                        <Ban size={15} /> Block User
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* REALISTIC GAUSSIAN BLUR ON IMAGE */}
            <img 
              src={currentPhotoSrc} 
              className={`w-full h-full object-cover object-top transition-all duration-700 ${
                isPhotoHidden ? 'blur-2xl scale-110 opacity-75 contrast-105 brightness-95' : 'group-hover:scale-105'
              }`} 
              alt={fullName} 
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} 
            />

            {/* SOFT AMBIENT GLASSMORPHIC OVERLAY WHEN BLURRED (NO HEAVY BLACK BOX) */}
            {isPhotoHidden && (
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-rose-950/20 to-transparent backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
                <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg animate-pulse">
                  <Lock size={24} className="text-amber-300" />
                </div>
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-amber-300 drop-shadow-md">Photo Access Private</h4>
                <p className="text-xs text-rose-100 max-w-xs font-semibold drop-shadow-xs">
                  Photos are private according to member privacy settings.
                </p>

                {/* 🔘 SIMPLE CLEAN PHOTO REQUEST BUTTON (TURNS TO "REQUEST SENT ✓" IMMEDIATELY) */}
                {isPhotoReqSent ? (
                  <div className="px-6 py-2.5 rounded-full bg-emerald-600/90 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg border border-emerald-300/40 flex items-center gap-1.5">
                    <Check size={16} className="stroke-[3]" /> Request Sent ✓
                  </div>
                ) : (
                  <button 
                    type="button" 
                    disabled={actionLoading} 
                    onClick={(e) => handleInteraction(e, 'PHOTO_REQUEST', 'PENDING')} 
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] hover:brightness-110 active:scale-95 text-white text-xs font-black uppercase tracking-wider shadow-xl border border-rose-300/30 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                    <span>Request Photo Access</span>
                  </button>
                )}
              </div>
            )}

            {/* FULL PHOTO MAXIMIZE ICON OVERLAY */}
            {!isPhotoHidden && (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPhotoModal(true);
                }}
                className="absolute top-4 right-18 z-30 p-2.5 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 transition-all cursor-pointer"
                title="View Full Photo"
              >
                <Maximize2 size={18} />
              </button>
            )}

            {/* LEFT / RIGHT SWIPE ARROWS FOR GALLERY */}
            {!isPhotoHidden && allPhotos.length > 1 && (
              <>
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1));
                  }} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-all z-30 border border-white/20"
                >
                  <ChevronLeft size={22} />
                </button>
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePhotoIndex((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0));
                  }} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-all z-30 border border-white/20"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}

            {/* GRADIENT OVERLAY AT BOTTOM OF PHOTO */}
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-slate-950 via-slate-950/65 to-transparent pointer-events-none z-25" />

            {/* CANDIDATE NAME, AGE & PILLS ON PHOTO BOTTOM */}
            <div className="absolute bottom-4 inset-x-5 z-30 text-white pointer-events-none space-y-2">
              <h2 className="font-serif font-extrabold text-2xl md:text-3xl uppercase tracking-wide flex items-center gap-2 drop-shadow-md">
                <span>{fullName}, {displayAge}</span>
                {isVerified && <CheckCircle2 size={22} className="fill-emerald-500 text-slate-950" />}
                {isPremium && <Crown size={20} className="fill-amber-400 text-amber-400" />}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/30 uppercase tracking-wider">
                  {maritalStatus}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/30 uppercase tracking-wider">
                  {religion}
                </span>
                {sect && (
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/30 uppercase tracking-wider">
                    {sect}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* GALLERY THUMBNAIL STRIP */}
          {!isPhotoHidden && allPhotos.length > 1 && (
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-3 overflow-x-auto no-scrollbar">
              {allPhotos.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0 ${
                    activePhotoIndex === idx ? 'border-rose-500 scale-105 shadow-lg' : 'border-slate-700 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={getOptimizedImageUrl(p.photoUrl)} alt="Thumbnail" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} />
                </button>
              ))}
            </div>
          )}

          {/* 🔴 ACTION ICON BUTTONS ROW DIRECTLY BELOW HERO IMAGE (EXACT DASHBOARD CARD STYLE) */}
          <div className="py-4 px-6 bg-white border-t border-rose-100 flex items-center justify-around gap-4 max-w-md mx-auto">
            
            {/* 1. ❤️ INTEREST PROPOSAL ACCEPT / DECLINE OR SEND BUTTON */}
            {isInterestReceived ? (
              <div className="flex items-center gap-3">
                <motion.button 
                  type="button"
                  whileHover={{ scale: 1.12, y: -2 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => handleInteraction(e, 'INTEREST', 'ACCEPTED')}
                  disabled={actionLoading}
                  className="w-13 h-13 rounded-full bg-[#e6f7ec] hover:bg-[#d1fae5] text-[#16a34a] border-2 border-emerald-400 shadow-md flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                  aria-label="Accept Proposal"
                  title="Accept Proposal"
                >
                  {actionLoading ? (
                    <Loader2 size={22} className="animate-spin text-[#16a34a]" />
                  ) : (
                    <Check size={24} className="text-[#16a34a] stroke-[3]" />
                  )}
                </motion.button>

                <motion.button 
                  type="button"
                  whileHover={{ scale: 1.12, y: -2 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => handleInteraction(e, 'INTEREST', 'DECLINED')}
                  disabled={actionLoading}
                  className="w-13 h-13 rounded-full bg-[#fde8e8] hover:bg-[#ffe4e6] text-[#f43f5e] border-2 border-rose-400 shadow-md flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                  aria-label="Decline Proposal"
                  title="Decline Proposal"
                >
                  <X size={24} className="text-[#f43f5e] stroke-[3]" />
                </motion.button>
              </div>
            ) : (
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
                className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
                  isInterestSent || isConnected
                    ? 'bg-emerald-600 text-white border-2 border-emerald-400 cursor-not-allowed opacity-95 shadow-emerald-200' 
                    : 'bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] text-white border-2 border-rose-300/40 cursor-pointer shadow-rose-900/20'
                }`}
                aria-label="Send Interest"
                title={isInterestSent ? 'Interest Sent' : isConnected ? 'Connected' : 'Send Interest'}
              >
                {actionLoading ? (
                  <Loader2 size={24} className="animate-spin text-white" />
                ) : isInterestSent || isConnected ? (
                  <Check size={26} className="text-white stroke-[3]" />
                ) : (
                  <Heart size={26} className="fill-amber-300 text-amber-300" />
                )}
              </motion.button>
            )}

            {/* 2. 💬 CHAT BUTTON */}
            <motion.button 
              type="button"
              whileHover={{ scale: 1.12, y: -2 }}
              whileTap={{ scale: 0.85 }}
              onClick={handleInitiateChat}
              disabled={actionLoading}
              className="w-13 h-13 rounded-full bg-slate-900 hover:bg-[#d91b5c] text-white border-2 border-slate-700 shadow-md flex items-center justify-center cursor-pointer active:scale-95 transition-colors"
              aria-label="Direct Message"
              title="Send Message"
            >
              <MessageCircle size={24} className="fill-white text-white" />
            </motion.button>

            {/* 3. ⭐ SHORTLIST STAR ICON BUTTON */}
            <motion.button 
              type="button"
              whileHover={{ scale: 1.12, y: -2 }}
              whileTap={{ scale: 0.85 }}
              onClick={(e) => handleInteraction(e, 'SHORTLIST', profileData.isShortlisted ? 'REMOVED' : 'ACTIVE')}
              disabled={actionLoading}
              className={`w-13 h-13 rounded-full shadow-md flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 border-2 ${
                profileData.isShortlisted 
                  ? 'bg-amber-50 text-amber-500 border-amber-300 shadow-xs' 
                  : 'bg-rose-50/60 hover:bg-rose-100 text-[#d91b5c] border-rose-200'
              }`}
              aria-label="Shortlist Profile"
              title={profileData.isShortlisted ? "Shortlisted" : "Shortlist Profile"}
            >
              <Star 
                size={24} 
                className={profileData.isShortlisted ? 'fill-amber-500 text-amber-500' : 'text-amber-500 fill-none'} 
              />
            </motion.button>

          </div>
        </div>

        {/* 📋 PROFILE DETAILS CARDS GRID (ALL EDITED DETAILS INCLUDED) */}
        <div className="space-y-5 px-4 md:px-0">

          {/* 🧕 WALI / GUARDIAN CONTACT DETAILS CARD */}
          <SectionCard icon={ShieldCheck} title="Wali / Guardian Details (Halal Proposals)">
            {(profileData?.isCurrentUserPaid || profileData?.IsCurrentUserPaid) ? (
              <>
                <GridRow label="Wali Name" value={profileData.waliName || 'Parent / Guardian'} />
                <GridRow label="Relation" value={profileData.waliRelation || 'Father'} />
                <GridRow label="Wali Contact Number" value={profileData.waliContactNumber || profileData.mobileNumber || 'Contact Unlocked'} />
              </>
            ) : (
              <div className="py-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-[#d91b5c] flex items-center justify-center mx-auto">
                  <Lock size={22} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-900">Wali Contact Locked</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">Upgrade to Nikah Qubool VIP to view verified Parent/Guardian contact details.</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/plans')}
                  className="px-5 py-2 bg-[#d91b5c] hover:bg-[#6b0932] text-white text-xs font-black uppercase rounded-xl shadow-md cursor-pointer"
                >
                  Unlock Wali Contact
                </button>
              </div>
            )}
          </SectionCard>

          {/* 1. BASIC INFORMATION CARD */}
          <SectionCard icon={User} title="Basic Details">
            <GridRow label="Full Name" value={fullName} />
            <GridRow label="Age" value={`${displayAge} Years`} />
            <GridRow label="Date of Birth" value={profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not Disclosed'} />
            <GridRow label="Gender" value={profileData.gender || 'Female'} />
            <GridRow label="Profile Created For" value={profileData.profileCreatedFor || 'Self'} />
            <GridRow label="Marital Status" value={profileData.maritalStatus || 'Never Married'} />
            <GridRow label="Height" value={profileData.height || '5ft 6in'} />
            <GridRow label="Weight" value={profileData.weight || 'Not Disclosed'} />
            <GridRow label="Complexion" value={profileData.complexion || 'Fair'} />
            <GridRow label="Mother Tongue" value={profileData.motherTongue || 'Hindi'} />
            <GridRow label="Sect / Maslak" value={`${profileData.sect || 'Sunni'} ${profileData.maslak ? `(${profileData.maslak})` : ''}`} />
            <GridRow label="Caste" value={profileData.caste || 'General'} />
            <GridRow label="Physical Status" value={profileData.physicalStatus || 'Normal / None'} />
            <GridRow label="Current City & State" value={`${profileData.currentCityName || profileData.cityName || 'City N/A'}, ${profileData.currentStateName || profileData.stateName || 'State N/A'}`} />
            <GridRow label="Native Place" value={`${profileData.nativeCityName || 'N/A'}, ${profileData.nativeStateName || 'N/A'}`} />
          </SectionCard>

          {/* 2. EDUCATION & CAREER CARD */}
          <SectionCard icon={GraduationCap} title="Education & Career">
            <GridRow label="Highest Qualification" value={profileData.highestDegree || profileData.education || 'Graduate'} />
            <GridRow label="College / University" value={profileData.collegeName || 'Not Disclosed'} />
            <GridRow label="Employment Sector" value={profileData.employmentSector || 'Private Sector'} />
            <GridRow label="Profession / Designation" value={profileData.designation || profileData.profession || 'Professional'} />
            <GridRow label="Occupation Details" value={profileData.occupationDetails || 'Not Disclosed'} />
            <GridRow label="Annual Income" value={profileData.annualIncome || 'Confidential'} />
          </SectionCard>

          {/* 3. 🔒 FAMILY DETAILS CARD (LOCKED FOR FREE USERS - MATCHING SCREENSHOT 2) */}
          <div className="bg-white rounded-3xl p-6 border-2 border-rose-100 shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-[#d91b5c] flex items-center justify-center font-bold shadow-xs">
                <Users size={20} />
              </div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">Family Details</h3>
            </div>

            {/* IF USER IS NOT PAID: SHOW LOCKED CONTAINER AS SHOWN IN SCREENSHOT 2 */}
            {!isUserPaid ? (
              <div className="bg-rose-50/70 border-2 border-rose-100/80 rounded-3xl p-6 md:p-8 text-center space-y-3.5 my-2">
                <div className="w-14 h-14 rounded-full bg-rose-100 text-[#d91b5c] flex items-center justify-center mx-auto shadow-inner border border-rose-200">
                  <Lock size={26} className="text-[#d91b5c]" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif font-extrabold text-base text-slate-900 uppercase tracking-wide">
                    Family Background Locked
                  </h4>
                  <p className="text-xs text-slate-600 font-semibold max-w-md mx-auto leading-relaxed">
                    Unlock premium to view detailed family Information including parents, siblings, and background.
                  </p>
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSubscriptionModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-lg shadow-rose-900/20 active:scale-95 transition-all cursor-pointer border border-rose-300/30 inline-flex items-center gap-2"
                  >
                    <span>View Premium Plans</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ) : (
              /* IF USER IS PAID: REVEAL FULL FAMILY DETAILS */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                <GridRow label="Family Type" value={profileData.familyType || 'Nuclear'} />
                <GridRow label="Family Status" value={profileData.familyStatus || 'Middle Class'} />
                <GridRow label="Family Values" value={profileData.familyValues || 'Traditional'} />
                <GridRow label="Father's Occupation" value={profileData.fatherOccupation || 'Employed'} />
                <GridRow label="Mother's Occupation" value={profileData.motherOccupation || 'Homemaker'} />
                <GridRow label="Brothers" value={`${profileData.totalBrothers || 0} Total (${profileData.marriedBrothers || 0} Married)`} />
                <GridRow label="Sisters" value={`${profileData.totalSisters || 0} Total (${profileData.marriedSisters || 0} Married)`} />
                {profileData.familyAbout && (
                  <div className="col-span-1 md:col-span-2 pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-500 block mb-1">About Family:</span>
                    <p className="font-medium text-slate-800 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs leading-relaxed">
                      {profileData.familyAbout}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. RELIGIOUS BACKGROUND & LIFESTYLE CARD */}
          <SectionCard icon={Moon} title="Religious & Lifestyle Habits">
            <GridRow label="Religion" value="Islam" />
            <GridRow label="Sect" value={profileData.sect || 'Sunni'} />
            <GridRow label="Maslak" value={profileData.maslak || 'General / Sunni'} />
            <GridRow label="Diet Type" value={profileData.dietType || 'Halal Only'} />
            <GridRow label="Smoking Habit" value={profileData.smokeHabit || 'No'} />
            <GridRow label="Drinking Habit" value={profileData.drinkHabit || 'No'} />
            <GridRow label="Cooking Knowledge" value={profileData.canCook === true || profileData.canCook === 'Yes' ? 'Yes' : 'No'} />
            {profileData.hobbies && <GridRow label="Hobbies" value={profileData.hobbies} />}
            {profileData.interests && <GridRow label="Interests" value={profileData.interests} />}
          </SectionCard>

          {/* 5. 📞 CONTACT DETAILS CARD (UPGRADED WITH DIRECT ACTION BUTTONS) */}
          <SectionCard icon={Phone} title="Contact Details">
            {contactData ? (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <GridRow label="Mobile Number" value={contactData.mobile} />
                  <GridRow label="Email Address" value={contactData.email} />
                </div>
                
                {/* DIRECT QUICK ACTION BUTTONS (CALL & WHATSAPP) */}
                <div className="flex items-center gap-3 pt-2 flex-wrap">
                  {contactData.mobile && (
                    <>
                      <a
                        href={`tel:${contactData.mobile}`}
                        className="flex-1 min-w-[140px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all"
                      >
                        <Phone size={15} /> Call Now
                      </a>
                      <a
                        href={`https://wa.me/${contactData.mobile.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[140px] py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all"
                      >
                        <MessageCircle size={15} /> WhatsApp Chat
                      </a>
                    </>
                  )}
                  {contactData.email && (
                    <a
                      href={`mailto:${contactData.email}`}
                      className="flex-1 min-w-[140px] py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all"
                    >
                      <ExternalLink size={15} /> Send Email
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 pt-1">
                <GridRow label="Mobile Number" value="+91-805*****99" />
                <GridRow label="Email Address" value="usr*******@gmail.com" />
                
                <div className="pt-2 text-center">
                  <button 
                    type="button"
                    onClick={handleUnlockContact}
                    disabled={actionLoading}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-lg shadow-rose-900/20 active:scale-95 transition-all cursor-pointer border border-rose-300/30"
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin inline mr-2" /> : null}
                    <span>VIEW CONTACT DETAILS</span>
                  </button>
                </div>
              </div>
            )}
          </SectionCard>

          {/* 6. PARTNER PREFERENCES CARD */}
          {preferences && (
            <SectionCard icon={Sparkles} title="Partner Preferences">
              <GridRow label="Age Range" value={`${preferences.minAge || 18} to ${preferences.maxAge || 35} Yrs`} />
              <GridRow label="Height Range" value={`${preferences.minHeight || "5.0"} to ${preferences.maxHeight || "6.2"} ft`} />
              <GridRow label="Preferred Sect" value={preferences.preferredSect || 'Any'} />
              <GridRow label="Preferred Caste" value={preferences.preferredCaste || 'Any'} />
              <GridRow label="Preferred Education" value={preferences.preferredEducation || 'Graduate'} />
              <GridRow label="Preferred Occupation" value={preferences.preferredOccupation || 'Any'} />
              <GridRow label="Preferred Location" value={preferences.preferredState || 'Any'} />
              <GridRow label="Preferred Marital Status" value={preferences.preferredMaritalStatus || 'Never Married'} />
              <GridRow label="Preferred Mother Tongue" value={preferences.preferredMotherTongue || 'Any'} />
            </SectionCard>
          )}

          {/* 7. ABOUT CANDIDATE & PARTNER EXPECTATIONS */}
          {profileData.partnerExpectations && (
            <SectionCard icon={Heart} title="Partner Expectations">
              <p className="font-medium text-slate-800 text-xs leading-relaxed">
                {profileData.partnerExpectations}
              </p>
            </SectionCard>
          )}

        </div>

      </div>

      {/* 🖼️ FULL PHOTO PREVIEW MODAL POPUP */}
      <AnimatePresence>
        {showPhotoModal && !isPhotoHidden && (
          <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="relative max-w-3xl w-full bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col items-center max-h-[90vh]"
            >
              {/* CLOSE BUTTON */}
              <button 
                type="button" 
                onClick={() => setShowPhotoModal(false)}
                className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-black/60 hover:bg-black text-white border border-white/20 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>

              {/* MAIN IMAGE */}
              <div className="relative w-full flex-1 flex items-center justify-center p-2 overflow-hidden max-h-[70vh]">
                <img 
                  src={currentPhotoSrc} 
                  alt={fullName} 
                  className="max-h-[68vh] w-auto max-w-full object-contain rounded-2xl shadow-xl"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} 
                />

                {allPhotos.length > 1 && (
                  <>
                    <button 
                      type="button" 
                      onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1))} 
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center cursor-pointer border border-white/20"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setActivePhotoIndex((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0))} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center cursor-pointer border border-white/20"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </div>

              {/* FOOTER PHOTO COUNTER & THUMBNAILS */}
              <div className="w-full p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4">
                <span className="text-xs font-extrabold text-slate-300 uppercase tracking-widest">
                  Photo {activePhotoIndex + 1} of {allPhotos.length}
                </span>

                {allPhotos.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {allPhotos.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                          activePhotoIndex === idx ? 'border-rose-500 scale-105' : 'border-slate-700 opacity-40'
                        }`}
                      >
                        <img src={getOptimizedImageUrl(p.photoUrl)} alt="Thumb" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 👑 SUBSCRIPTION UPGRADE MODAL */}
      <AnimatePresence>
        {showSubscriptionModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-white rounded-3xl max-w-sm w-full p-7 text-center shadow-2xl border-2 border-rose-100 text-slate-800 space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-rose-50 text-[#d91b5c] flex items-center justify-center mx-auto border-2 border-rose-200 shadow-md">
                <Crown size={32} className="text-amber-500 fill-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-extrabold uppercase text-slate-900">Upgrade to Premium</h3>
                <p className="text-slate-500 text-xs font-semibold mt-1 leading-relaxed">
                  Family details, direct contact numbers, and unlimited messaging are exclusive to Premium members.
                </p>
              </div>
              <div className="flex flex-col gap-2.5 pt-2">
                <button 
                  type="button" 
                  onClick={() => router.push('/dashboard/membership')} 
                  className="w-full bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] hover:brightness-110 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-900/20 cursor-pointer border border-rose-300/30"
                >
                  View Plans & Upgrade
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowSubscriptionModal(false)} 
                  className="w-full bg-slate-100 text-slate-600 hover:bg-slate-200 py-3 rounded-2xl font-bold text-xs uppercase cursor-pointer"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function SectionCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl p-6 border-2 border-rose-100 shadow-xl space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-100">
        <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-[#d91b5c] flex items-center justify-center font-bold shadow-xs">
          <Icon size={20} />
        </div>
        <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
        {children}
      </div>
    </div>
  );
}

function GridRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 font-medium text-slate-800 p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
      <span className="w-2 h-2 rounded-full bg-[#d91b5c] flex-shrink-0" />
      <span className="font-bold text-slate-500 min-w-[120px]">{label}:</span>
      <span className="font-black text-slate-900 truncate">{value || 'Not Disclosed'}</span>
    </div>
  );
}
