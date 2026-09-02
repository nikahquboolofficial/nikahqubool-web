"use client";

import React, { useState } from 'react';
import { 
  Heart, Star, Lock, Check, X, MessageCircle, 
  MapPin, GraduationCap, Briefcase, Loader2, CheckCircle2, Crown, Sparkles, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getOptimizedImageUrl, getFallbackPhoto, getBlurredPhotoUrl } from '@/lib/imageUtils';
import { useSignalR } from '@/context/SignalRContext';

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

  const userIdNum = Number(profile.userId || profile.UserId);
  const presence = onlineUsers[userIdNum];
  const isOnline = presence ? presence.isOnline : Boolean(profile.isOnline ?? profile.IsOnline ?? false);
  const isVerified = Boolean(profile.isVerified ?? profile.IsVerified ?? false);
  const isPremium = Boolean(profile.isPremium ?? profile.IsPremium ?? false);

  const rawPrivacy = String(profile.photoPrivacy || profile.PhotoPrivacy || 'All Members').toLowerCase().replace(/\s+/g, '');
  const rawPhotoReqStatus = String(profile.photoRequestStatus || profile.PhotoRequestStatus || profile.galleryRequestStatus || profile.GalleryRequestStatus || '').toUpperCase();
  const isPhotoReqAccepted = rawPhotoReqStatus.includes('ACCEPT');

  const isPhotoHidden = !isPhotoReqAccepted && (
    Boolean(profile.isPhotoHidden ?? profile.IsPhotoHidden ?? false) ||
    (rawPrivacy.includes('approved') && !isPhotoReqAccepted) ||
    (rawPrivacy.includes('premium') && !isPremium)
  );

  const rawPhoto = profile.mainPhotoUrl || profile.MainPhotoUrl || profile.photoUrl || profile.PhotoUrl || profile.mainPhoto || profile.MainPhoto || profile.profilePhoto || profile.ProfilePhoto || profile.avatarUrl || profile.AvatarUrl || (profile.userPhotos && profile.userPhotos[0]?.photoUrl) || (profile.UserPhotos && profile.UserPhotos[0]?.PhotoUrl);
  const photo = getOptimizedImageUrl(rawPhoto, profile.userId || profile.UserId || 1, profile.gender || profile.Gender);
  
  const rawLocation = profile.location || profile.Location || profile.fullLocation || profile.FullLocation;
  const state = profile.stateName || profile.StateName || profile.currentStateName || profile.CurrentStateName || profile.state || profile.State || (rawLocation && rawLocation.includes(',') ? rawLocation.split(',')[1]?.trim() : '') || '';
  const city = profile.cityName || profile.CityName || profile.currentCityName || profile.CurrentCityName || profile.city || profile.City || profile.currentCity || profile.CurrentCity || (rawLocation && rawLocation.includes(',') ? rawLocation.split(',')[0]?.trim() : '') || '';
  const displayLocation = (city && state) ? `${city}, ${state}` : (city || state || rawLocation || 'Location N/A');

  const edu = profile.education || profile.Education || profile.highestDegree || profile.HighestDegree || 'Education N/A';
  const job = profile.profession || profile.Profession || profile.designation || profile.Designation || profile.employmentSector || profile.job || profile.Job || 'Professional';
  const income = profile.annualIncome || profile.AnnualIncome || profile.income || profile.Income || '';
  const sect = profile.sect || profile.Sect || '';
  const caste = profile.caste || profile.Caste || '';
  const displayAge = (!profile.age || profile.age <= 0) ? 24 : profile.age;

  const interestStatus = String(profile.interestStatus || profile.InterestStatus || 'None');
  const isInterestSent = Boolean(
    profile.isInterestSent || profile.IsInterestSent || 
    interestStatus === 'SentPending' || interestStatus.includes('Sent') ||
    interestStatus === 'SENT' || interestStatus === 'PENDING' || interestStatus === 'Sent'
  );
  const isInterestReceived = interestStatus === 'ReceivedPending' || interestStatus === 'Received' || interestStatus === 'RECEIVED';
  const isConnected = interestStatus === 'Accepted' || interestStatus === 'ACCEPTED' || Boolean(profile.isCanChat ?? profile.IsCanChat);
  const isShortlisted = Boolean(profile.isShortlisted || profile.IsShortlisted);

  const isFullScreenCard = activeTab === 'best-matches' || activeTab === 'online' || activeTab === 'matches';

  const triggerLocalHearts = () => {
    const newHearts = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: (Math.random() - 0.5) * 120
    }));
    setLocalHearts((prev) => [...prev, ...newHearts]);

    setTimeout(() => {
      setLocalHearts((prev) => prev.filter((h) => !newHearts.some((nh) => nh.id === h.id)));
    }, 1600);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col group relative selection:bg-[#d91b5c] selection:text-white"
    >
      {/* 🖼️ ELEGANT MATCH CARD CONTAINER (FULL HEIGHT ON MOBILE, PROPORTIONED RESPONSIVE GRID ON DESKTOP) */}
      <div 
        className={`relative w-full ${
          isFullScreenCard 
            ? 'h-[calc(100vh-150px)] min-h-[500px] max-h-[640px] md:h-[500px] md:min-h-[480px] md:max-h-[540px] md:aspect-[4/5]' 
            : 'aspect-[4/5] min-h-[480px] max-h-[520px]'
        } bg-slate-950 overflow-hidden cursor-pointer`} 
        onClick={(e) => {
          e.stopPropagation();
          onViewProfile(profile.userId);
        }}
      >
        <img 
          src={photo} 
          alt={profile.fullName}
          className={`w-full h-full object-cover object-top transition-all duration-700 group-hover:scale-105 ${
            isPhotoHidden ? 'blur-2xl scale-110 opacity-80' : 'opacity-100'
          }`}
          onError={(e) => { 
            const fallback = getFallbackPhoto(profile.userId || profile.UserId || 1, profile.gender || profile.Gender);
            if ((e.target as HTMLImageElement).src !== fallback) {
              (e.target as HTMLImageElement).src = fallback;
            }
          }}
        />

        {/* 🟢 TOP LEFT MATCH SCORE BADGE (BEST MATCHES & ONLINE TABS ONLY) */}
        <div className="absolute top-3.5 left-3.5 z-40 pointer-events-none">
          {isFullScreenCard && (
            <span className="bg-slate-950/80 backdrop-blur-md text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md border border-emerald-400/30 tracking-wide">
              <Sparkles size={11} className="text-amber-300 fill-amber-300" />
              <span>{profile.matchScore || (88 + (profile.userId % 11))}% Match</span>
            </span>
          )}
        </div>

        {/* 🌓 DARK GRADIENT SHADOW OVERLAY FOR TEXT READABILITY */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none z-30" />

        {/* 📝 CANDIDATE TEXT DETAILS OVERLAY (STRUCTURED 5-LINE LAYOUT WITH GAP ABOVE BUTTONS) */}
        <div className="absolute bottom-[96px] inset-x-3.5 z-40 text-white pointer-events-none space-y-0.5 drop-shadow-md">
          
          {/* 1. NAME & AGE ONLY (BOLD) + VERIFIED TICK + CROWN + ONLINE GREEN DOT */}
          <h3 className="font-serif font-extrabold text-base md:text-lg tracking-tight flex items-center gap-1 text-white leading-tight">
            <span className="truncate">{profile.fullName || 'Member'}, {displayAge}</span>
            {isVerified && (
              <span title="Verified Profile" className="flex-shrink-0">
                <CheckCircle2 size={15} className="fill-emerald-500 text-slate-950" />
              </span>
            )}
            {isPremium && (
              <span title="VIP Premium Member" className="flex-shrink-0">
                <Crown size={15} className="fill-amber-400 text-amber-400" />
              </span>
            )}
            {isOnline && (
              <span title="Online Now" className="flex-shrink-0 relative flex h-2 w-2 ml-0.5 mb-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 border border-slate-950"></span>
              </span>
            )}
          </h3>

          {/* 2. STATE & CITY (CLEAN LINE) */}
          <p className="text-[11px] font-medium text-slate-200/90 flex items-center gap-1 truncate tracking-wide">
            <MapPin size={11} className="text-amber-400 flex-shrink-0" />
            <span className="truncate">
              {displayLocation}
            </span>
          </p>

          {/* 3. SECT & CASTE (CLEAN SEPARATE LINE) */}
          {(sect || caste) && (
            <p className="text-[11px] font-medium text-slate-300/90 truncate tracking-wide">
              {sect}{caste ? ` / ${caste}` : ''}
            </p>
          )}

          {/* 4. PROFESSION & EDUCATION */}
          <p className="text-[11px] font-normal text-slate-300/80 truncate tracking-wide">
            {job} • {edu}
          </p>

          {/* 5. ANNUAL INCOME (CLEAR GAP ABOVE BUTTONS) */}
          {income && (
            <p className="text-[11px] font-bold text-amber-300 tracking-wide truncate">
              Earns {income}
            </p>
          )}

        </div>

        {/* 💖 LOCAL RISING HEARTS OVERLAY */}
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          <AnimatePresence>
            {localHearts.map((heart) => (
              <motion.div
                key={heart.id}
                initial={{ opacity: 1, y: '75%', x: `calc(50% + ${heart.x}px)`, scale: 0.5, rotate: 0 }}
                animate={{ 
                  opacity: [1, 1, 0], 
                  y: '15%', 
                  x: `calc(50% + ${heart.x * 1.6}px)`, 
                  scale: [0.5, 1.4, 1.8],
                  rotate: [0, -15, 15, 0]
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute text-[#d91b5c] drop-shadow-[0_4px_10px_rgba(135,12,63,0.5)]"
              >
                <Heart size={32} className="fill-[#d91b5c] text-[#d91b5c]" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 🔴 ACTION BUTTONS ROW (SITTING DIRECTLY AT VERY BOTTOM EDGE OF CARD IMAGE) */}
        <div className="absolute bottom-3 inset-x-4 z-40">
        {/* CARD TOP BADGE FOR RECEIVED INTEREST IN VISITS/CONTACTS */}
        {isInterestReceived && (activeTab === 'visitors' || activeTab === 'profiles-viewed' || activeTab === 'viewed-my-profile') && (
          <div className="mb-2 bg-[#d91b5c]/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full text-center border border-rose-300/40 shadow-xs">
            ✨ Also sent you an interest request
          </div>
        )}

        {/* 🌟 ACTION BUTTONS BAR */}
        <div className="flex items-center justify-center gap-3 pt-1">
          
          {/* RULE 1: IF GALLERY REQUEST RECEIVED -> SHOW PHOTO ACCEPT / DECLINE (ICON ONLY) */}
          {activeTab === 'gallery-requests-received' ? (
            <div className="flex items-center justify-center gap-4 w-full">
              <motion.button 
                type="button"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onInteraction(profile.userId, 'GALLERY_REQUEST', 'ACCEPTED');
                }}
                disabled={actionLoading}
                className="w-11 h-11 rounded-full bg-[#e6f7ec] hover:bg-[#d1fae5] text-[#16a34a] border-2 border-emerald-400 font-extrabold flex items-center justify-center shadow-md cursor-pointer transition-all shrink-0"
                title="Accept Photo Request"
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin text-[#16a34a]" /> : <Check size={20} className="text-[#16a34a] stroke-[3]" />}
              </motion.button>
              <motion.button 
                type="button"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onInteraction(profile.userId, 'GALLERY_REQUEST', 'DECLINED');
                }}
                disabled={actionLoading}
                className="w-11 h-11 rounded-full bg-[#fde8e8] hover:bg-[#ffe4e6] text-[#f43f5e] border-2 border-rose-400 font-extrabold flex items-center justify-center shadow-md cursor-pointer transition-all shrink-0"
                title="Decline Photo Request"
              >
                <X size={20} className="text-[#f43f5e] stroke-[3]" />
              </motion.button>
            </div>
          ) : (isInterestReceived || activeTab === 'requests') ? (
            /* RULE 2: IF INTEREST REQUEST RECEIVED -> SHOW ICON ONLY BUTTONS (GREEN CHECK & RED CROSS) */
            <div className="flex items-center justify-center gap-5 w-full">
              <motion.button 
                type="button"
                whileHover={{ scale: 1.12, y: -2 }}
                whileTap={{ scale: 0.85 }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  triggerLocalHearts();
                  onInteraction(profile.userId, 'INTEREST', 'ACCEPTED');
                }}
                disabled={actionLoading}
                className="w-12 h-12 rounded-full bg-[#e6f7ec] hover:bg-[#d1fae5] text-[#16a34a] border-2 border-emerald-400 font-extrabold flex items-center justify-center shadow-lg cursor-pointer active:scale-95 transition-all shrink-0"
                title="Accept Proposal"
              >
                {actionLoading ? <Loader2 size={18} className="animate-spin text-[#16a34a]" /> : <Check size={24} className="text-[#16a34a] stroke-[3]" />}
              </motion.button>

              <motion.button 
                type="button"
                whileHover={{ scale: 1.12, y: -2 }}
                whileTap={{ scale: 0.85 }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onInteraction(profile.userId, 'INTEREST', 'DECLINED');
                }}
                disabled={actionLoading}
                className="w-12 h-12 rounded-full bg-[#fde8e8] hover:bg-[#ffe4e6] text-[#f43f5e] border-2 border-rose-400 font-extrabold flex items-center justify-center shadow-lg cursor-pointer active:scale-95 transition-all shrink-0"
                title="Decline Proposal"
              >
                <X size={24} className="text-[#f43f5e] stroke-[3]" />
              </motion.button>
            </div>
          ) : (
            /* RULE 3: NORMAL TABS (SHORTLIST, MESSAGE, INTEREST) */
            <div className="flex items-start justify-center gap-5 w-full">
              {/* 1. ❤️ INTEREST BUTTON (HIDDEN IN ACCEPTED TAB) */}
              {activeTab !== 'accepted' && (
                <div className="flex flex-col items-center gap-1">
                  <motion.button 
                    type="button"
                    whileHover={(isInterestSent || isConnected) ? {} : { scale: 1.12, y: -2 }}
                    whileTap={(isInterestSent || isConnected) ? {} : { scale: 0.85 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (!isInterestSent && !isConnected) {
                        triggerLocalHearts();
                        onInteraction(profile.userId, 'INTEREST', 'PENDING');
                      }
                    }}
                    disabled={actionLoading || isInterestSent || isConnected}
                    className={`w-11 h-11 rounded-full shadow-md flex items-center justify-center transition-all duration-200 ${
                      isInterestSent || isConnected
                        ? 'bg-[#2A2D32] border-2 border-[#3F444D] cursor-not-allowed opacity-90' 
                        : 'bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] text-white border-2 border-rose-300/40 cursor-pointer shadow-rose-950/40'
                    }`}
                    aria-label="Send Interest"
                    title={isInterestSent ? 'Interest Sent' : isConnected ? 'Connected' : 'Send Interest'}
                  >
                    {(actionLoading && (actionLoadingType === 'INTEREST' || !actionLoadingType)) ? (
                      <Loader2 size={18} className="animate-spin text-white" />
                    ) : isInterestSent || isConnected ? (
                      <Heart size={20} className="fill-[#8E95A2] text-[#8E95A2]" />
                    ) : (
                      <Heart size={20} className="fill-white text-white drop-shadow-xs" />
                    )}
                  </motion.button>
                  <span className="text-[10px] font-extrabold text-white uppercase tracking-wider drop-shadow-sm">
                    {isInterestSent ? 'Sent' : isConnected ? 'Connected' : 'Interest'}
                  </span>
                </div>
              )}

              {/* 2. 💬 CHAT BUTTON */}
              <div className="flex flex-col items-center gap-1">
                <motion.button 
                  type="button"
                  whileHover={{ scale: 1.12, y: -2 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (onInitiateChat) onInitiateChat(profile);
                  }}
                  disabled={actionLoading}
                  className="w-11 h-11 rounded-full bg-slate-900 hover:bg-[#d91b5c] text-white border-2 border-slate-700 shadow-md flex items-center justify-center cursor-pointer active:scale-95 transition-colors"
                  aria-label="Direct Message"
                  title="Send Message"
                >
                  {(actionLoading && actionLoadingType === 'CHAT') ? (
                    <Loader2 size={18} className="animate-spin text-white" />
                  ) : (
                    <MessageCircle size={20} className="fill-white text-white" />
                  )}
                </motion.button>
                <span className="text-[10px] font-extrabold text-white uppercase tracking-wider drop-shadow-sm">
                  Chat
                </span>
              </div>

              {/* 3. ⭐ SHORTLIST STAR BUTTON */}
              <div className="flex flex-col items-center gap-1">
                <motion.button 
                  type="button"
                  whileHover={{ scale: 1.12, y: -2 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onInteraction(profile.userId, 'SHORTLIST', profile.isShortlisted ? 'REMOVED' : 'ACTIVE');
                  }}
                  disabled={actionLoading}
                  className={`w-11 h-11 rounded-full shadow-md flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 border-2 ${
                    profile.isShortlisted 
                      ? 'bg-amber-50 text-amber-500 border-amber-300' 
                      : 'bg-white hover:bg-rose-50 text-[#d91b5c] border-slate-200'
                  }`}
                  aria-label="Shortlist Profile"
                  title={profile.isShortlisted ? "Shortlisted" : "Shortlist Profile"}
                >
                  {(actionLoading && actionLoadingType === 'SHORTLIST') ? (
                    <Loader2 size={18} className="animate-spin text-amber-500" />
                  ) : (
                    <Star 
                      size={20} 
                      className={profile.isShortlisted ? 'fill-amber-500 text-amber-500' : 'text-amber-500 fill-none'} 
                    />
                  )}
                </motion.button>
                <span className="text-[10px] font-extrabold text-white uppercase tracking-wider drop-shadow-sm">
                  {profile.isShortlisted ? 'Saved' : 'Shortlist'}
                </span>
              </div>
            </div>
          )}

        </div>

        </div>

      </div>
    </motion.div>
  );
}
