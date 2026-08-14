"use client";

import React, { useState } from 'react';
import { 
  Heart, Star, Lock, Check, X, MessageCircle, 
  MapPin, GraduationCap, Briefcase, Loader2, CheckCircle2, Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getOptimizedImageUrl } from '@/lib/imageUtils';

export interface ProfileCardProps {
  profile: any;
  actionLoading?: boolean;
  activeTab?: string;
  onInteraction: (receiverUserId: number, type: string, status?: string) => void;
  onViewProfile: (userId: number) => void;
  onInitiateChat?: (profile: any) => void;
}

export default function ProfileCard({ 
  profile, 
  actionLoading = false, 
  activeTab = '',
  onInteraction, 
  onViewProfile,
  onInitiateChat 
}: ProfileCardProps) {

  // 💖 LOCAL FLOATING HEARTS ANIMATION
  const [localHearts, setLocalHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  const triggerLocalHearts = () => {
    const newHearts = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 80,
      y: (Math.random() - 0.5) * 30,
    }));
    setLocalHearts(prev => [...prev, ...newHearts]);
    setTimeout(() => {
      setLocalHearts(prev => prev.filter(h => !newHearts.some(nh => nh.id === h.id)));
    }, 1500);
  };

  // 🔒 PHOTO PRIVACY CONTROL
  const rawPrivacy = profile.photoPrivacy || profile.PhotoPrivacy || 'All Members';
  const privacyClean = String(rawPrivacy).toLowerCase().replace(/\s+/g, '');
  const isUserPaid = Boolean(profile.isCurrentUserPaid ?? profile.IsCurrentUserPaid);
  
  const isSpHidden = (profile.isPhotoHidden !== undefined)
    ? Boolean(profile.isPhotoHidden)
    : (profile.IsPhotoHidden !== undefined)
      ? Boolean(profile.IsPhotoHidden)
      : (
          (privacyClean.includes('premium') && !isUserPaid) ||
          (privacyClean.includes('onlyapproved') || privacyClean.includes('protected'))
        );

  const rawPhotoReqStatus = String(
    profile.photoRequestStatus || 
    profile.PhotoRequestStatus || 
    profile.requestStatus || 
    profile.RequestStatus || 
    profile.status || 
    profile.Status ||
    ''
  ).toUpperCase();

  const isPhotoApproved = 
    rawPhotoReqStatus === 'ACCEPTED' || 
    rawPhotoReqStatus.includes('APPROVE') || 
    Boolean(profile.isPhotoApproved ?? profile.IsPhotoApproved);

  const isPhotoHidden = !isPhotoApproved && isSpHidden;

  // 🌟 VERIFIED & PREMIUM BADGE FLAGS
  const isVerified = Boolean(profile.isVerified ?? profile.IsVerified);
  const isPremium = Boolean(profile.isPremium ?? profile.IsPremium ?? profile.isCurrentUserPaid ?? profile.IsCurrentUserPaid);

  // 🟢 ONLINE STATUS FLAG
  const isOnline = Boolean(profile.isOnline ?? profile.IsOnline ?? profile.online ?? profile.Online);

  // ❤️ INTEREST STATUS
  const cleanActiveTab = activeTab.toLowerCase();
  const rawInterestStatus = String(profile.interestStatus || profile.InterestStatus || 'None').toUpperCase();

  const isInterestSent = 
    rawInterestStatus === 'SENTPENDING' || 
    rawInterestStatus.includes('SENT') ||
    (cleanActiveTab.includes('sent'));

  const isInterestReceived = 
    !isInterestSent && (
      rawInterestStatus === 'RECEIVEDPENDING' || 
      rawInterestStatus.includes('RECEIVED') || 
      (cleanActiveTab === 'requests')
    );

  const isConnected = rawInterestStatus === 'ACCEPTED' || Boolean(profile.isCanChat ?? profile.IsCanChat);
  const isShortlisted = Boolean(profile.isShortlisted ?? profile.IsShortlisted);

  const rawPhoto = profile.mainPhotoUrl || profile.MainPhotoUrl || profile.photoUrl || profile.PhotoUrl;
  const photo = getOptimizedImageUrl(rawPhoto);
  const state = profile.stateName || profile.StateName || profile.currentStateName || profile.CurrentStateName || '';
  const city = profile.cityName || profile.CityName || profile.currentCityName || profile.CurrentCityName || '';
  const edu = profile.education || profile.Education || profile.highestDegree || profile.HighestDegree || 'Education N/A';
  const job = profile.profession || profile.Profession || profile.designation || profile.Designation || profile.employmentSector || 'Profession N/A';
  const displayAge = (!profile.age || profile.age <= 0) ? 24 : profile.age;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl overflow-hidden border-2 border-rose-100 shadow-xl hover:shadow-2xl hover:border-rose-300 transition-all duration-300 flex flex-col group relative selection:bg-[#870c3f] selection:text-white"
    >
      {/* 🖼️ HERO PHOTO CONTAINER (Nikah Forever Mobile App Aesthetic) */}
      <div 
        className="relative w-full aspect-[4/4.8] bg-slate-950 overflow-hidden cursor-pointer" 
        onClick={(e) => {
          e.stopPropagation();
          onViewProfile(profile.userId);
        }}
      >
        <img 
          src={photo} 
          alt={profile.fullName}
          className={`w-full h-full object-cover object-top transition-all duration-700 group-hover:scale-105 ${
            isPhotoHidden ? 'blur-xl scale-110 opacity-60' : ''
          }`}
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
        />

        {/* 🟢 TOP BADGES: ONLINE & VERIFIED & PREMIUM */}
        <div className="absolute top-3 inset-x-3 z-40 flex items-center justify-between pointer-events-none">
          {/* LEFT: ONLINE BADGE */}
          {isOnline ? (
            <span className="bg-slate-950/80 backdrop-blur-md text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md border border-emerald-400/40 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 absolute" />
              <span className="ml-2">Online</span>
            </span>
          ) : <div />}

          {/* RIGHT: PREMIUM BADGE */}
          {isPremium && (
            <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md border border-amber-300 uppercase tracking-wider">
              <Crown size={12} className="fill-slate-950 text-slate-950" /> VIP
            </span>
          )}
        </div>

        {/* GRADIENT OVERLAY */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent pointer-events-none z-35" />

        {/* NAME, AGE, VERIFIED ICON & LOCATION */}
        <div className="absolute bottom-3.5 inset-x-4 z-40 text-white pointer-events-none">
          <h3 className="font-serif font-extrabold text-lg uppercase tracking-tight flex items-center gap-1.5 text-white">
            <span className="truncate">{profile.fullName || 'Member'}, {displayAge}</span>
            {isVerified && (
              <span title="Verified Profile" className="flex-shrink-0">
                <CheckCircle2 size={17} className="fill-emerald-500 text-slate-950" />
              </span>
            )}
            {isPremium && (
              <span title="VIP Premium Member" className="flex-shrink-0">
                <Crown size={16} className="fill-amber-400 text-amber-400" />
              </span>
            )}
          </h3>
          <p className="text-[11px] font-bold text-rose-200 flex items-center gap-1 mt-0.5 uppercase tracking-wider">
            <MapPin size={13} className="text-amber-400 flex-shrink-0" />
            <span className="truncate">{city ? `${city}, ` : ''}{state || 'Location N/A'}</span>
          </p>
        </div>
      </div>

      {/* 📋 PROFILE HIGHLIGHTS */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between bg-white text-slate-800">
        <div className="space-y-2 text-xs font-bold text-slate-800">
          <div className="flex items-center gap-2">
            <Briefcase size={15} className="text-[#870c3f] flex-shrink-0" />
            <span className="truncate uppercase">{job}</span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap size={15} className="text-[#870c3f] flex-shrink-0" />
            <span className="truncate uppercase">{edu}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase pt-0.5">
            <span className="px-2.5 py-1 rounded-xl bg-rose-50 text-[#870c3f] border border-rose-200">{profile.sect || 'Sect N/A'}</span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">{profile.height || '5ft 6in'}</span>
          </div>
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
                className="absolute text-[#870c3f] drop-shadow-[0_4px_10px_rgba(135,12,63,0.5)]"
              >
                <Heart size={32} className="fill-[#870c3f] text-[#870c3f]" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 🔴 NATIVE APP ACTION BUTTONS ROW */}
        <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-around gap-2 px-1 relative z-20">
          
          {/* 1. ❤️ INTEREST PROPOSAL ACCEPT / DECLINE OR SEND BUTTONS */}
          {isInterestReceived ? (
            <div className="flex items-center gap-2.5">
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
                className="w-12 h-12 rounded-full bg-[#e6f7ec] hover:bg-[#d1fae5] text-[#16a34a] border-2 border-emerald-400 shadow-md flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                aria-label="Accept Proposal"
                title="Accept Proposal"
              >
                {actionLoading ? (
                  <Loader2 size={20} className="animate-spin text-[#16a34a]" />
                ) : (
                  <Check size={22} className="text-[#16a34a] stroke-[3]" />
                )}
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
                className="w-12 h-12 rounded-full bg-[#fde8e8] hover:bg-[#ffe4e6] text-[#f43f5e] border-2 border-rose-400 shadow-md flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                aria-label="Decline Proposal"
                title="Decline Proposal"
              >
                <X size={22} className="text-[#f43f5e] stroke-[3]" />
              </motion.button>
            </div>
          ) : (
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
              className={`w-13 h-13 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
                isInterestSent || isConnected
                  ? 'bg-emerald-600 text-white border-2 border-emerald-400 cursor-not-allowed opacity-95 shadow-emerald-200' 
                  : 'bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white border-2 border-rose-300/40 cursor-pointer shadow-rose-900/20'
              }`}
              aria-label="Send Interest"
              title={isInterestSent ? 'Interest Sent' : isConnected ? 'Connected' : 'Send Interest'}
            >
              {actionLoading ? (
                <Loader2 size={22} className="animate-spin text-white" />
              ) : isInterestSent || isConnected ? (
                <Check size={24} className="text-white stroke-[3]" />
              ) : (
                <Heart size={24} className="fill-amber-300 text-amber-300" />
              )}
            </motion.button>
          )}

          {/* 2. 💬 CHAT BUTTON */}
          {onInitiateChat && (
            <motion.button 
              type="button"
              whileHover={{ scale: 1.12, y: -2 }}
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onInitiateChat(profile);
              }}
              disabled={actionLoading}
              className="w-12 h-12 rounded-full bg-slate-900 hover:bg-[#870c3f] text-white border-2 border-slate-700 shadow-md flex items-center justify-center cursor-pointer active:scale-95 transition-colors"
              aria-label="Direct Message"
              title="Send Message"
            >
              <MessageCircle size={22} className="fill-white text-white" />
            </motion.button>
          )}

          {/* 3. ⭐ SHORTLIST STAR ICON BUTTON */}
          <motion.button 
            type="button"
            whileHover={{ scale: 1.12, y: -2 }}
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onInteraction(profile.userId, 'SHORTLIST', isShortlisted ? 'REMOVED' : 'ACTIVE');
            }}
            disabled={actionLoading}
            className={`w-12 h-12 rounded-full shadow-md flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 border-2 ${
              isShortlisted 
                ? 'bg-amber-50 text-amber-500 border-amber-300 shadow-xs' 
                : 'bg-rose-50/60 hover:bg-rose-100 text-[#870c3f] border-rose-200'
            }`}
            aria-label="Shortlist Profile"
            title={isShortlisted ? "Shortlisted" : "Shortlist Profile"}
          >
            <Star 
              size={22} 
              className={isShortlisted ? 'fill-amber-500 text-amber-500' : 'text-amber-500 fill-none'} 
            />
          </motion.button>

        </div>

      </div>
    </motion.div>
  );
}