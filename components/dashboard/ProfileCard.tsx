"use client";

import Link from 'next/link';

import { getClientSubscriptionStatus } from '@/lib/subscriptionUtils';
import React, { useState } from 'react';
import { 
  Heart, Bookmark, Lock, Check, X, MessageCircle, 
  MapPin, GraduationCap, Briefcase, Loader2, CheckCircle2, Crown, Sparkles, ShieldCheck, Camera, Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getOptimizedImageUrl, getFallbackPhoto } from '@/lib/imageUtils';
import { useSignalR } from '@/context/SignalRContext';
import { ProfileStatusIcons, checkIsVerified, checkIsPremium } from '@/components/common/ProfileBadges';

export interface ProfileCardProps {
  profile: any;
  actionLoading?: boolean;
  actionLoadingType?: 'INTEREST' | 'SHORTLIST' | 'CHAT' | string | null;
  activeTab?: string;
  onInteraction: (receiverUserId: number, type: string, status?: string) => void;
  onViewProfile: (userId: number) => void;
  onInitiateChat?: (profile: any) => void;
}

export default function ProfileCard({ 
  profile, 
  actionLoading = false, 
  actionLoadingType = null,
  activeTab = 'best-matches',
  onInteraction, 
  onViewProfile,
  onInitiateChat
}: ProfileCardProps) {
  const { onlineUsers } = useSignalR();
  const [localHearts, setLocalHearts] = useState<{ id: number; x: number }[]>([]);
  const [isImgLoaded, setIsImgLoaded] = useState<boolean>(false);

  const userIdNum = Number(profile.userId || profile.UserId || 0);
  const presence = onlineUsers[userIdNum];
  const isOnline = presence ? Boolean(presence.isOnline) : false;
  const isVerified = checkIsVerified(profile);
  const isTargetPremium = checkIsPremium(profile);
  const isProfileBoosted = Boolean(profile.isBoosted ?? profile.IsBoosted ?? false);

  let localPaid = false;
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
          localPaid = true;
        }
      }
    } catch (e) {}
  }

  const isCurrentUserPaid = getClientSubscriptionStatus().isPaid || Boolean(
    profile.isCurrentUserPaid ?? profile.IsCurrentUserPaid ?? localPaid
  );

  const rawPrivacy = String(profile.photoPrivacy || profile.PhotoPrivacy || 'All Members').toLowerCase().replace(/\s+/g, '');
  const hasRequestedPhoto = Boolean(profile.hasRequestedPhoto ?? profile.HasRequestedPhoto);
  const rawPhotoReqStatus = String(
    profile.photoRequestStatus || profile.PhotoRequestStatus || 
    profile.galleryRequestStatus || profile.GalleryRequestStatus || ''
  ).trim().toUpperCase();

  const isPhotoReqAccepted = (
    rawPhotoReqStatus === 'ACCEPTED' || 
    rawPhotoReqStatus === 'SENTACCEPTED' || 
    rawPhotoReqStatus === 'APPROVED' ||
    Boolean(profile.isPhotoReqAccepted ?? profile.IsPhotoReqAccepted)
  );

  let isPhotoHidden = false;
  if (isPhotoReqAccepted) {
    isPhotoHidden = false;
  } else if (rawPrivacy.includes('approved')) {
    isPhotoHidden = true;
  } else if (rawPrivacy.includes('premium')) {
    isPhotoHidden = !isCurrentUserPaid;
  } else {
    isPhotoHidden = false;
  }

  const rawPhoto = profile.mainPhotoUrl || profile.MainPhotoUrl || profile.photoUrl || profile.PhotoUrl || profile.mainPhoto || profile.MainPhoto || profile.profilePhoto || profile.ProfilePhoto || profile.avatarUrl || profile.AvatarUrl || (profile.userPhotos && profile.userPhotos[0]?.photoUrl) || (profile.UserPhotos && profile.UserPhotos[0]?.PhotoUrl);
  const photo = getOptimizedImageUrl(rawPhoto, userIdNum, profile.gender || profile.Gender);
  
  const rawLocation = profile.location || profile.Location || profile.fullLocation || profile.FullLocation;
  const state = profile.stateName || profile.StateName || profile.currentStateName || profile.CurrentStateName || profile.state || profile.State || (rawLocation && rawLocation.includes(',') ? rawLocation.split(',')[1]?.trim() : '') || '';
  const city = profile.cityName || profile.CityName || profile.currentCityName || profile.CurrentCityName || profile.city || profile.City || profile.currentCity || profile.CurrentCity || (rawLocation && rawLocation.includes(',') ? rawLocation.split(',')[0]?.trim() : '') || '';
  const displayLocation = (city && state) ? `${city}, ${state}` : (city || state || rawLocation || 'India');

  const edu = profile.education || profile.Education || profile.highestDegree || profile.HighestDegree || '';
  const job = profile.profession || profile.Profession || profile.designation || profile.Designation || profile.employmentSector || profile.job || profile.Job || '';
  const rawIncome = profile.annualIncome || profile.AnnualIncome || profile.income || profile.Income || '';
  const sect = profile.sect || profile.Sect || '';
  const caste = profile.caste || profile.Caste || '';
  const displayAge = (!profile.age || profile.age <= 0) ? 24 : profile.age;

  const displayName = profile.fullName || profile.FullName || profile.name || profile.Name || 'Member';
  const interestStatus = String(profile.interestStatus || profile.InterestStatus || 'None');
  const isInterestSent = Boolean(
    profile.isInterestSent || profile.IsInterestSent || 
    interestStatus === 'SentPending' || interestStatus === 'Sent' || interestStatus === 'SENT'
  );
  const isInterestReceived = Boolean(
    profile.isInterestReceived || profile.IsInterestReceived ||
    interestStatus === 'ReceivedPending' || interestStatus === 'Received' || 
    interestStatus === 'RECEIVED' || interestStatus === 'SentToMe' || interestStatus === 'Incoming'
  );
  const isConnected = interestStatus === 'Accepted' || interestStatus === 'ACCEPTED';
  const isShortlisted = Boolean(profile.isShortlisted || profile.IsShortlisted);

  const photosCount = Number(profile.photosCount || profile.PhotosCount || (profile.userPhotos?.length || (rawPhoto ? 1 : 0)));

  // 📝 Line 2: Job/Profession • City, State • Sect/Caste (Exact target screenshot structure)
  const displayJob = job && job !== 'Professional' ? job : (edu && edu !== 'Education N/A' ? edu : 'Professional');
  const displayCommunity = [sect, caste].filter(Boolean).join('/') || (sect || caste || 'Sunni');
  const metaLine2 = [displayJob, displayLocation, displayCommunity].filter(Boolean).join(' • ');

  // 💰 Line 3: Income formatted cleanly: "Earns Rs. 20 - 35 Lakh"
  const formatIncome = (inc: any) => {
    if (!inc || String(inc).trim() === '' || String(inc).toLowerCase().includes('no income')) {
      return 'Earns Not Disclosed';
    }
    const s = String(inc).trim();
    if (s.toLowerCase().startsWith('earns')) return s;
    if (s.toLowerCase().startsWith('rs') || s.startsWith('₹')) return `Earns ${s}`;
    return `Earns Rs. ${s}`;
  };
  const displayIncome = formatIncome(rawIncome);

  const triggerLocalHearts = () => {
    const newHearts = Array.from({ length: 7 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: (Math.random() - 0.5) * 120
    }));
    setLocalHearts((prev) => [...prev, ...newHearts]);

    setTimeout(() => {
      setLocalHearts((prev) => prev.filter((h) => !newHearts.some((nh) => nh.id === h.id)));
    }, 1600);
  };

  return (
    <article 
      className="bg-black rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.16)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.25)] transition-all duration-300 relative group flex flex-col select-none border border-slate-800/40"
      style={{ scrollSnapAlign: 'center', scrollSnapStop: 'always' }}
    >
      {/* 🖼️ CARD MEDIA CONTAINER */}
      <div className="relative w-full h-[530px] sm:h-[500px] md:h-[515px] overflow-hidden select-none">
        {/* 🔗 FULL CARD LINK (Prefetches and opens profile in 0ms on click) */}
        <Link 
          href={`/dashboard/profile?userId=${userIdNum}`}
          prefetch={true}
          onClick={() => onViewProfile(userIdNum)}
          className="absolute inset-0 z-10 block cursor-pointer touch-manipulation select-none active:brightness-95 transition-all duration-75"
          aria-label={`View profile of ${displayName}`}
        />
        {/* PHOTO & SKELETON LOADER */}
        {!isImgLoaded && (
          <div className="absolute inset-0 bg-slate-900 animate-pulse flex items-center justify-center z-0">
            <Loader2 size={32} className="animate-spin text-slate-600" />
          </div>
        )}
        <img 
          src={photo} 
          alt={displayName}
          onLoad={() => setIsImgLoaded(true)}
          className={`w-full h-full object-cover object-top transition-all duration-300 group-hover:scale-[1.03] ${
            isImgLoaded ? 'opacity-100' : 'opacity-0'
          } ${isPhotoHidden ? 'blur-2xl scale-110 opacity-75' : ''}`}
          onError={(e) => { 
            const fallback = DEFAULT_MALE_AVATAR;
            if ((e.target as HTMLImageElement).src !== fallback) {
              (e.target as HTMLImageElement).src = fallback;
            }
            setIsImgLoaded(true);
          }} 
        />

        {/* 🌓 EXACT NIKAH FOREVER GRADIENT OVERLAY (Seamless transparent to black) */}
        <div 
          className="absolute inset-x-0 bottom-0 pointer-events-none z-10"
          style={{
            height: '62%',
            background: 'linear-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.42) 28%, rgba(0, 0, 0, 0.88) 72%, #000000 100%)'
          }}
        />

        {/* 🟢 TOP LEFT: BOOSTED OR ONLINE BADGE */}
        <div className="absolute top-3.5 left-3.5 z-20 pointer-events-none flex items-center gap-1.5">
          {isProfileBoosted && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-[#E21E5B] text-white text-[11px] font-black tracking-tight shadow-[0_2px_10px_rgba(226,30,91,0.5)] border border-white/20 animate-pulse">
              <Rocket size={12} className="fill-white" />
              Boosted
            </span>
          )}
          {isOnline && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold tracking-tight shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          )}
        </div>

        {/* 📸 TOP RIGHT: GALLERY COUNT / VERIFIED BADGE */}
        <div className="absolute top-3.5 right-3.5 z-20 pointer-events-none flex items-center gap-1.5">
          {photosCount > 1 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold shadow-md">
              <Camera size={13} className="text-white/90" />
              {photosCount}
            </span>
          )}
          {isTargetPremium && (
            <span title="VIP Premium Member" className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md border border-amber-300/50 text-amber-300 flex items-center justify-center shadow-md">
              <Crown size={14} className="fill-amber-300" />
            </span>
          )}
        </div>

        {/* 💖 LOCAL RISING HEARTS ANIMATION */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          <AnimatePresence>
            {localHearts.map((heart) => (
              <motion.div
                key={heart.id}
                initial={{ opacity: 1, bottom: '60px', left: '50%', x: heart.x, scale: 0.5 }}
                animate={{ 
                  opacity: [1, 1, 0], 
                  bottom: '260px', 
                  x: heart.x * 2.2, 
                  scale: [0.5, 1.4, 1.8],
                  rotate: [0, -15, 15, 0]
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute text-[#E21E5B] filter drop-shadow-[0_4px_16px_rgba(226,30,91,0.8)]"
              >
                <Heart size={32} className="fill-[#E21E5B] text-[#E21E5B]" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 📝 PROFILE DETAILS & CIRCULAR ACTIONS OVERLAY */}
        <div className="absolute bottom-0 inset-x-0 p-4 pb-5 z-20 flex flex-col justify-end text-white space-y-3 pointer-events-auto">
          
          {/* NAME, AGE & METADATA (EXACT NIKAH FOREVER FORMAT) */}
          <div className="space-y-1 text-left pointer-events-none">
            {/* Line 1: Mohd Saif, 26 [Verified Star/Badge] */}
            <h4 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              <span>{displayName}, {displayAge}</span>
              <ProfileStatusIcons isVerified={isVerified} isPremium={isTargetPremium} size={19} />
              
            </h4>

            {/* Line 2: Management / Executive • New Delhi, India • Sunni/Sheikh */}
            {metaLine2 && (
              <p className="text-xs text-white/90 font-medium leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] line-clamp-1">
                {metaLine2}
              </p>
            )}

            {/* Line 3: Dedicated Income Line: Earns Rs. 20 - 35 Lakh */}
            <p className="text-xs sm:text-sm font-semibold text-white/95 flex items-center gap-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              <span>{displayIncome}</span>
            </p>
          </div>

          {/* 🔘 EXACT NIKAH FOREVER 3-BUTTON CIRCULAR ACTION DECK */}
          <div 
            className="pt-1 flex items-center justify-center gap-6 sm:gap-8 z-30 relative pointer-events-auto"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            
            {/* INCOMING INTEREST PROPOSAL DECK: DECLINE / ACCEPT */}
            {(isInterestReceived || activeTab === 'requests') ? (
              <div className="flex items-center justify-center gap-8 w-full">
                {/* DECLINE */}
                <div className="flex flex-col items-center gap-1.5 min-w-[60px]">
                  <motion.button 
                    type="button"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onInteraction(userIdNum, 'INTEREST', 'DECLINED');
                    }}
                    disabled={actionLoading}
                    className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-rose-300 hover:bg-rose-600 hover:text-white flex items-center justify-center shadow-lg transition-all cursor-pointer"
                    aria-label="Decline proposal"
                  >
                    <X size={20} className="stroke-[2.5]" />
                  </motion.button>
                  <span className="text-[11px] font-medium text-white/90">Decline</span>
                </div>

                {/* ACCEPT */}
                <div className="flex flex-col items-center gap-1.5 min-w-[60px]">
                  <motion.button 
                    type="button"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerLocalHearts();
                      onInteraction(userIdNum, 'INTEREST', 'ACCEPTED');
                    }}
                    disabled={actionLoading}
                    className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-[0_6px_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
                    aria-label="Accept proposal"
                  >
                    {actionLoading ? <Loader2 size={20} className="animate-spin text-white" /> : <Check size={22} className="stroke-[2.8]" />}
                  </motion.button>
                  <span className="text-[11px] font-bold text-white">Accept</span>
                </div>
              </div>
            ) : (
              /* DEFAULT HOME / MATCHES DECK: SHORTLIST (LEFT) • MESSAGE (MIDDLE) • INTEREST (RIGHT) */
              <>
                {/* 1. SHORTLIST (LEFT) */}
                <div className="flex flex-col items-center gap-1.5 min-w-[58px]">
                  <motion.button 
                    type="button"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onInteraction(userIdNum, 'SHORTLIST', isShortlisted ? 'REMOVED' : 'ACTIVE');
                    }}
                    disabled={actionLoading}
                    className={`w-12 h-12 rounded-full backdrop-blur-md border flex items-center justify-center shadow-lg transition-all cursor-pointer ${
                      isShortlisted 
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-amber-400/30' 
                        : 'bg-white/15 hover:bg-white/25 text-white border-white/25'
                    }`}
                    aria-label={isShortlisted ? "Shortlisted" : "Shortlist"}
                  >
                    {(actionLoading && actionLoadingType === 'SHORTLIST') ? (
                      <Loader2 size={18} className="animate-spin text-amber-400" />
                    ) : (
                      <Bookmark 
                        size={20} 
                        className={isShortlisted ? 'fill-current stroke-[2]' : 'fill-none stroke-[2]'} 
                      />
                    )}
                  </motion.button>
                  <span className={`text-[11px] ${isShortlisted ? 'font-bold text-amber-300' : 'font-medium text-white/90'}`}>
                    {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                  </span>
                </div>

                {/* 2. MESSAGE (MIDDLE) */}
                <div className="flex flex-col items-center gap-1.5 min-w-[58px]">
                  <motion.button 
                    type="button"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onInitiateChat) onInitiateChat(profile);
                    }}
                    disabled={actionLoading}
                    className="w-12 h-12 rounded-full bg-[#4F46E5] hover:bg-[#4338CA] backdrop-blur-md border border-indigo-400/30 text-white flex items-center justify-center shadow-[0_4px_16px_rgba(79,70,229,0.35)] transition-all cursor-pointer"
                    aria-label="Message"
                  >
                    {(actionLoading && actionLoadingType === 'CHAT') ? (
                      <Loader2 size={18} className="animate-spin text-white" />
                    ) : (
                      <MessageCircle size={20} className="stroke-[2] fill-white/20" />
                    )}
                  </motion.button>
                  <span className="text-[11px] font-medium text-white/90">Message</span>
                </div>

                {/* 3. INTEREST / HEART (RIGHT) */}
                <div className="flex flex-col items-center gap-1.5 min-w-[58px]">
                  <motion.button 
                    type="button"
                    whileHover={(isInterestSent || isConnected) ? {} : { scale: 1.08 }}
                    whileTap={(isInterestSent || isConnected) ? {} : { scale: 0.92 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isInterestSent && !isConnected) {
                        triggerLocalHearts();
                        onInteraction(userIdNum, 'INTEREST', 'PENDING');
                      }
                    }}
                    disabled={actionLoading || isInterestSent || isConnected}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isInterestSent || isConnected
                        ? 'bg-white/90 text-[#E21E5B] border-2 border-[#E21E5B] cursor-default shadow-lg' 
                        : 'bg-[#E21E5B] hover:bg-[#CE1B53] text-white shadow-[0_6px_20px_rgba(226,30,91,0.5)] cursor-pointer'
                    }`}
                    aria-label={isInterestSent ? 'Sent' : isConnected ? 'Connected' : 'Interest'}
                  >
                    {(actionLoading && (actionLoadingType === 'INTEREST' || !actionLoadingType)) ? (
                      <Loader2 size={20} className="animate-spin text-white" />
                    ) : (
                      <Heart 
                        size={22} 
                        className={isInterestSent || isConnected ? 'fill-[#E21E5B] stroke-[2]' : 'fill-white text-white stroke-[0]'} 
                      />
                    )}
                  </motion.button>
                  <span className={`text-[11px] font-bold ${isInterestSent || isConnected ? 'text-rose-200' : 'text-white'}`}>
                    {isInterestSent ? 'Sent' : isConnected ? 'Connected' : 'Interest'}
                  </span>
                </div>
              </>
            )}

          </div>

        </div>

      </div>
    </article>
  );
}
