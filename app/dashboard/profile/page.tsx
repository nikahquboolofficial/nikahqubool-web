"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, MoreVertical, Info, Phone, GraduationCap, 
  Users, Moon, Sparkles, Heart, CheckCircle2, Lock, 
  Flag, Ban, Star, MessageCircle, Loader2, ChevronLeft, ChevronRight, Crown, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { fetchProfileDetailsApi, viewContactDetailsApi, handleInteractionApiCall, blockUserApiCall } from '@/lib/api';

export default function MobileFixedProfileDetailPage() {
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
      const stored = sessionStorage.getItem("viewing_profile_target");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          targetUserId = parsed.userId || parsed.targetUserId;
        } catch (e) {}
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
    if (!profileData?.isCurrentUserPaid) {
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
    const res = await handleInteractionApiCall(profileData.userId, type, status, token);
    setActionLoading(false);
    setShowThreeDotMenu(false);
    toast.dismiss();

    if (res.success) {
      toast.success(res.message || "Action executed successfully");

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

    if (profileData?.isCurrentUserPaid) {
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-[#870c3f]">
        <Loader2 className="animate-spin mb-3 text-[#870c3f]" size={48} />
        <span className="font-black text-xs uppercase tracking-widest text-slate-500">Loading Member Profile...</span>
      </div>
    );
  }

  if (!profileData) return null;

  const allPhotos = gallery.length > 0 ? gallery : [{ photoUrl: profileData.mainPhotoUrl || profileData.photoUrl || '/placeholder.png' }];
  const interestStatus = profileData.interestStatus;
  const fullName = profileData.fullName || "Member Profile";

  const rawPrivacy = profileData.photoPrivacy || profileData.PhotoPrivacy || 'All Members';
  const privacyClean = String(rawPrivacy).toLowerCase().replace(/\s+/g, '');
  const isUserPaid = Boolean(profileData.isCurrentUserPaid ?? profileData.IsCurrentUserPaid);
  const hasRequestedPhoto = Boolean(profileData.hasRequestedPhoto ?? profileData.HasRequestedPhoto);
  const isSpHidden = Boolean(profileData.isPhotoHidden ?? profileData.IsPhotoHidden);

  const isPhotoHidden = isSpHidden 
    || (privacyClean.includes('premium') && !isUserPaid)
    || (privacyClean.includes('onlyapproved') && !hasRequestedPhoto)
    || (privacyClean.includes('protected') && !hasRequestedPhoto);

  const isPhotoReqSent = hasRequestedPhoto || String(profileData.photoRequestStatus).toUpperCase().includes('SENT');

  const isVerified = Boolean(profileData.isVerified ?? profileData.IsVerified);
  const isPremium = Boolean(profileData.isPremium ?? profileData.IsPremium ?? profileData.isCurrentUserPaid);
  const currentPhotoSrc = allPhotos[activePhotoIndex]?.photoUrl || profileData.mainPhotoUrl || profileData.photoUrl || '/placeholder.png';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 w-full relative selection:bg-[#870c3f] selection:text-white pb-28">
      <Toaster position="top-center" richColors duration={2000} />

      {/* TOP HEADER */}
      <div className="bg-white border-b-2 border-rose-100 sticky top-0 z-[60] py-3.5 px-4 md:px-8 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} className="p-2 hover:bg-rose-50 rounded-2xl text-[#870c3f] border border-rose-200 transition-colors cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-sm md:text-base font-serif font-extrabold uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
              <span>{fullName}</span>
              {isVerified && <CheckCircle2 size={16} className="fill-emerald-500 text-white" />}
              {isPremium && <Crown size={15} className="fill-amber-400 text-amber-400" />}
            </h1>
            <p className="text-[10px] font-black text-rose-700 uppercase">PR-{profileData.userId}</p>
          </div>
        </div>

        <div className="relative">
          <button type="button" onClick={() => setShowThreeDotMenu(!showThreeDotMenu)} className="p-2 hover:bg-rose-50 text-slate-700 rounded-full transition-colors cursor-pointer border border-slate-200">
            <MoreVertical size={20} />
          </button>

          <AnimatePresence>
            {showThreeDotMenu && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border-2 border-rose-100 p-2 z-[70] text-slate-800">
                <button type="button" disabled={actionLoading} onClick={(e) => handleInteraction(e, 'REPORT', 'PENDING')} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-rose-50 hover:text-[#870c3f] transition-all cursor-pointer">
                  <Flag size={15} /> Report Profile
                </button>
                <button type="button" disabled={actionLoading} onClick={handleBlockUser} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer">
                  <Ban size={15} /> Block User
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-6 space-y-6">
        
        {/* 🖼️ ELEGANT UN-CROPPED HERO PHOTO GALLERY CONTAINER */}
        <div className="bg-white rounded-3xl p-4 md:p-6 border-2 border-rose-100 shadow-xl space-y-4">
          <div className="relative w-full aspect-[4/4.5] max-h-[520px] bg-slate-950 rounded-2xl overflow-hidden shadow-md">
            <img 
              src={currentPhotoSrc} 
              className={`w-full h-full object-contain bg-slate-950 transition-all duration-500 ${isPhotoHidden ? 'blur-xl opacity-60 scale-105' : ''}`} 
              alt={fullName} 
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} 
            />

            {/* 🔒 PHOTO PRIVACY OVERLAY */}
            {isPhotoHidden && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md z-[20] flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-md">
                  <Lock size={26} className="text-amber-300" />
                </div>
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-amber-300">Photo Access Protected</h4>
                <p className="text-xs text-rose-100 max-w-xs font-medium">
                  Photos are private according to member privacy settings.
                </p>

                {/* SIMPLE CLEAN PHOTO REQUEST BUTTON */}
                {isPhotoReqSent ? (
                  <div className="px-5 py-2.5 rounded-full bg-amber-500/90 text-white font-black text-xs uppercase tracking-wider shadow-md border border-amber-300/30">
                    Request Access Sent ✓
                  </div>
                ) : (
                  <button 
                    type="button" 
                    disabled={actionLoading} 
                    onClick={(e) => handleInteraction(e, 'PHOTO_REQUEST', 'PENDING')} 
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 text-white text-xs font-black uppercase tracking-wider shadow-lg border border-rose-300/30 flex items-center gap-2 cursor-pointer"
                  >
                    {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                    <span>Request Photo Access</span>
                  </button>
                )}
              </div>
            )}

            {!isPhotoHidden && allPhotos.length > 1 && (
              <>
                <button type="button" onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer hover:bg-black/80">
                  <ChevronLeft size={20} />
                </button>
                <button type="button" onClick={() => setActivePhotoIndex((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0))} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer hover:bg-black/80">
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {/* PHOTO THUMBNAILS (UP TO 3+ PHOTOS) */}
          {!isPhotoHidden && allPhotos.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pt-1">
              {allPhotos.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0 ${
                    activePhotoIndex === idx ? 'border-[#870c3f] scale-105 shadow-md' : 'border-slate-200 opacity-60'
                  }`}
                >
                  <img src={p.photoUrl} alt="Thumbnail" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 📋 PROFILE DETAILS SECTION (NO IMAGE OVERLAP) */}
        <ProfileDetailsSection 
          fullName={fullName} 
          profileData={profileData} 
          contactData={contactData} 
          preferences={preferences} 
          interestStatus={interestStatus} 
          actionLoading={actionLoading} 
          handleUnlockContact={handleUnlockContact} 
          handleInteraction={handleInteraction} 
        />

      </div>

      {/* 🔴 BOTTOM FIXED ACTION DOCK */}
      {interestStatus !== 'ReceivedPending' && (
        <div className="fixed bottom-0 left-0 right-0 z-[9990] bg-white/95 backdrop-blur-xl border-t-2 border-rose-100 p-3.5 shadow-2xl">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            {interestStatus === 'Accepted' ? (
              <button type="button" onClick={handleInitiateChat} className="flex-1 py-3.5 rounded-full bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 border border-rose-300/30 cursor-pointer">
                <MessageCircle size={16} className="text-amber-300" /> CHAT NOW
              </button>
            ) : interestStatus === 'SentPending' ? (
              <div className="flex-1 py-3.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-xs uppercase text-center flex items-center justify-center gap-1.5 border-2 border-emerald-200">
                <CheckCircle2 size={16} /> INTEREST SENT ✓
              </div>
            ) : (
              <button type="button" disabled={actionLoading} onClick={(e) => handleInteraction(e, 'INTEREST', 'PENDING')} className="flex-1 py-3.5 rounded-full bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2 border border-rose-300/30 cursor-pointer">
                <Heart size={16} className="fill-amber-300 text-amber-300" /> EXPRESS INTEREST
              </button>
            )}

            <button type="button" disabled={actionLoading} onClick={(e) => handleInteraction(e, 'SHORTLIST', profileData.isShortlisted ? 'REMOVED' : 'ACTIVE')} className={`p-3.5 rounded-full border-2 transition-all cursor-pointer ${profileData.isShortlisted ? 'bg-[#870c3f] text-white border-[#870c3f] shadow-md' : 'bg-rose-50 text-[#870c3f] border-rose-200'}`}>
              <Star size={18} className={profileData.isShortlisted ? 'fill-amber-300 text-amber-300' : ''} />
            </button>
          </div>
        </div>
      )}

      {/* SUBSCRIPTION MODAL */}
      <AnimatePresence>
        {showSubscriptionModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl max-w-sm w-full p-7 text-center shadow-2xl border-2 border-rose-100 text-slate-800">
              <h3 className="text-lg font-serif font-extrabold uppercase text-slate-900 mb-1">Upgrade to Premium</h3>
              <p className="text-slate-500 text-xs font-semibold mb-6 leading-relaxed">Direct contact details and messaging are exclusive to Premium members.</p>
              <div className="flex flex-col gap-2.5">
                <button type="button" onClick={() => router.push('/dashboard/membership')} className="w-full bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-900/20 cursor-pointer border border-rose-300/30">View Plans & Upgrade</button>
                <button type="button" onClick={() => setShowSubscriptionModal(false)} className="w-full bg-slate-100 text-slate-600 hover:bg-slate-200 py-3 rounded-2xl font-bold text-xs uppercase cursor-pointer">Maybe Later</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function ProfileDetailsSection({ fullName, profileData, contactData, preferences, interestStatus, actionLoading, handleUnlockContact, handleInteraction }: any) {
  return (
    <div className="space-y-5">
      <SectionCard icon={Info} title="Basic Information">
        <BulletRow label="Name" value={fullName} />
        <BulletRow label="Age | Gender" value={`${profileData.age} Yrs | ${profileData.gender || 'Female'}`} />
        <BulletRow label="Marital Status" value={profileData.maritalStatus || 'Never Married'} />
        <BulletRow label="Caste / Sect" value={`${profileData.sect || 'Sunni'} / ${profileData.caste || 'General'}`} />
        <BulletRow label="Height" value={profileData.height || '5ft 5in'} />
        <BulletRow label="Disability Status" value={profileData.physicalStatus || 'None'} />
      </SectionCard>

      <SectionCard icon={Phone} title="Contact Details">
        {contactData ? (
          <>
            <BulletRow label="Mobile" value={contactData.mobile} />
            <BulletRow label="Email" value={contactData.email} />
          </>
        ) : (
          <div className="space-y-3.5 pt-1">
            <BulletRow label="Mobile" value="+91-805*****99" />
            <BulletRow label="Email" value="tam*******@gmail.com" />
            
            <div className="pt-2 text-center">
              <button 
                type="button"
                onClick={handleUnlockContact}
                disabled={actionLoading}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-md shadow-rose-900/20 active:scale-95 transition-all cursor-pointer border border-rose-300/30"
              >
                VIEW CONTACT DETAILS
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard icon={GraduationCap} title="Education & Career">
        <BulletRow label="Highest Education" value={profileData.highestDegree || profileData.education || 'Graduate'} />
        <BulletRow label="College / University" value={profileData.collegeName || 'Not Disclosed'} />
        <BulletRow label="Employed In" value={profileData.employmentSector || 'Private Sector'} />
        <BulletRow label="Profession" value={profileData.designation || profileData.profession || 'Professional'} />
        <BulletRow label="Annual Income" value={profileData.annualIncome || 'Confidential'} />
      </SectionCard>

      <SectionCard icon={Users} title="Family Details">
        <BulletRow label="Family Type" value={profileData.familyType || 'Nuclear'} />
        <BulletRow label="Family Status" value={profileData.familyStatus || 'Middle Class'} />
        <BulletRow label="Father's Work" value={profileData.fatherOccupation || 'Employed'} />
        <BulletRow label="Mother's Work" value={profileData.motherOccupation || 'Homemaker'} />
        <BulletRow label="Brothers / Sisters" value={`${profileData.totalBrothers || 0} Bros / ${profileData.totalSisters || 0} Sis`} />
      </SectionCard>

      <SectionCard icon={Moon} title="Religious Background">
        <BulletRow label="Religion" value="Islam" />
        <BulletRow label="Sect" value={profileData.sect || 'Sunni'} />
        <BulletRow label="Maslak" value={profileData.maslak || 'Barelvi / Deobandi'} />
        <BulletRow label="Namaz Habit" value={profileData.namazHabit || 'Regular'} />
        <BulletRow label="Quran Reading" value="Yes" />
      </SectionCard>

      {preferences && (
        <SectionCard icon={Sparkles} title="Partner Preferences">
          <BulletRow label="Age Range" value={`${preferences.minAge || 18} to ${preferences.maxAge || 30} Yrs`} />
          <BulletRow label="Height Range" value={`${preferences.minHeight || "5ft"} to ${preferences.maxHeight || "6ft"}`} />
          <BulletRow label="Preferred Sect" value={preferences.preferredSect || 'Any'} />
          <BulletRow label="Preferred Education" value={preferences.preferredEducation || 'Graduate'} />
          <BulletRow label="Preferred Location" value={preferences.preferredState || 'Any'} />
        </SectionCard>
      )}

      {interestStatus === 'ReceivedPending' && (
        <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-rose-100 text-center space-y-4">
          <p className="text-xs font-bold text-slate-800">
            <span className="text-[#870c3f] font-black">{fullName}</span> sent you a proposal.
          </p>
          <div className="flex items-center gap-3">
            <button 
              type="button"
              disabled={actionLoading} 
              onClick={(e) => handleInteraction(e, 'INTEREST', 'ACCEPTED')}
              className="flex-1 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer"
            >
              ACCEPT PROPOSAL
            </button>
            <button 
              type="button"
              disabled={actionLoading} 
              onClick={(e) => handleInteraction(e, 'INTEREST', 'DECLINED')}
              className="flex-1 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer"
            >
              DECLINE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl p-6 border-2 border-rose-100 shadow-xl space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-100">
        <div className="w-9 h-9 rounded-full bg-rose-50 border border-rose-200 text-[#870c3f] flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
          <Icon size={18} />
        </div>
        <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">{title}</h3>
      </div>
      <div className="space-y-2.5 pt-1 text-xs">
        {children}
      </div>
    </div>
  );
}

function BulletRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 font-medium text-slate-800">
      <span className="w-2.5 h-2.5 rounded-full bg-[#870c3f] flex-shrink-0" />
      <span className="font-bold text-slate-500">{label} :</span>
      <span className="font-black text-slate-900 truncate">{value || 'Not Disclosed'}</span>
    </div>
  );
}