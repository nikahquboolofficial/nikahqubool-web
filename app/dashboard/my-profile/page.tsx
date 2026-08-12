"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Share2, Edit2, CheckCircle2, ChevronRight, Crown, Settings, 
  UserCheck, MessageSquare, Eye, Sparkles, Shield, CreditCard, 
  HelpCircle, ArrowLeft, Loader2, Camera, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { fetchActiveSubscriptionApi, fetchProfileDetailsApi } from '@/lib/api';

export default function MySelfProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'premium' | 'settings'>('premium');
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop()?.split(';').shift() : null;
  };

  const getToken = useCallback(() => getCookie("user_token"), []);

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

    setLoading(true);
    const res = await fetchProfileDetailsApi(userId > 0 ? userId : 0, token);
    if (res.success && res.data) {
      const p = res.data.profile || res.data.Profile || res.data;
      setProfileData(p);
    }
    setLoading(false);
  }, [getToken, router]);

  useEffect(() => {
    loadMyProfile();
  }, [loadMyProfile]);

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: profileData?.fullName || 'Pakiza Rishte Profile',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Profile link copied!");
    }
  };

  const photo = profileData?.mainPhotoUrl || profileData?.photoUrl || '/placeholder.png';
  const fullName = profileData?.fullName || 'Member Profile';
  const isVerified = Boolean(profileData?.isVerified ?? profileData?.IsVerified ?? true);
  const profileCompletion = profileData?.profileCompletion || 85;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-28 pt-4 selection:bg-[#870c3f] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      <div className="max-w-xl mx-auto px-4 space-y-6">
        
        {/* HEADER BAR */}
        <div className="flex items-center justify-between py-2">
          <h1 className="text-xl font-serif font-extrabold text-slate-900 tracking-tight">
            My Profile
          </h1>
          <button 
            type="button"
            onClick={handleShareProfile} 
            className="p-2.5 rounded-full bg-white border-2 border-slate-200 text-slate-700 hover:text-[#870c3f] shadow-xs cursor-pointer transition-all"
            aria-label="Share Profile"
          >
            <Share2 size={18} />
          </button>
        </div>

        {/* PROFILE CARD WITH PERCENTAGE RING & EDIT ICON */}
        <div className="bg-white rounded-3xl p-6 border-2 border-rose-100 shadow-xl text-center space-y-4 relative">
          
          {/* AVATAR WITH 85% COMPLETION RING */}
          <div className="relative w-28 h-28 mx-auto cursor-pointer" onClick={() => router.push('/dashboard/gallery')}>
            <div className="w-full h-full rounded-full p-1 border-4 border-[#870c3f] relative flex items-center justify-center bg-white shadow-md">
              <img 
                src={photo} 
                alt={fullName} 
                className="w-full h-full rounded-full object-cover" 
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} 
              />
            </div>
            
            {/* EDIT PENCIL BUTTON */}
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push('/dashboard/gallery');
              }}
              className="absolute top-1 right-0 w-8 h-8 rounded-full bg-white border-2 border-slate-200 text-slate-800 shadow-md flex items-center justify-center cursor-pointer hover:bg-slate-50"
            >
              <Edit2 size={14} />
            </button>

            {/* % COMPLETION BADGE */}
            <div className="absolute -bottom-2 inset-x-0 mx-auto w-fit px-3 py-0.5 rounded-full bg-[#870c3f] text-white text-[11px] font-black shadow-md border-2 border-white">
              {profileCompletion}%
            </div>
          </div>

          {/* FULL NAME & VERIFIED BADGE */}
          <div className="pt-2">
            <h2 className="text-xl font-serif font-extrabold uppercase text-slate-900 flex items-center justify-center gap-1.5">
              <span>{fullName}</span>
              {isVerified && <CheckCircle2 size={18} className="fill-emerald-500 text-white" />}
            </h2>

            {/* INCOMPLETE PROFILE LINK -> OPENS /dashboard/edit-profile */}
            <button 
              type="button"
              onClick={() => router.push('/dashboard/edit-profile')}
              className="text-xs font-black text-[#870c3f] hover:underline uppercase tracking-wider flex items-center justify-center gap-1 mx-auto mt-1 cursor-pointer"
            >
              <span>Incomplete profile</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* 🌟 COMPACT NON-SCROLLABLE TAB SWITCHER: [ PREMIUM ] | [ SETTINGS ] */}
          <div className="pt-2 grid grid-cols-2 gap-2 max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => setActiveTab('premium')}
              className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-2 ${
                activeTab === 'premium'
                  ? 'bg-slate-950 text-white border-slate-950 shadow-md'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Premium
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-2 ${
                activeTab === 'settings'
                  ? 'bg-slate-950 text-white border-slate-950 shadow-md'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Settings
            </button>
          </div>

        </div>

        {/* 🌟 TAB CONTENT 1: PREMIUM */}
        {activeTab === 'premium' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#fffdf2] rounded-3xl p-6 border-2 border-amber-200/70 shadow-xl text-center space-y-6"
          >
            <div>
              <h3 className="text-xl md:text-2xl font-serif font-extrabold text-amber-950 uppercase tracking-tight">
                Find Your Match Faster with Premium
              </h3>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="flex -space-x-2 overflow-hidden">
                  <img className="inline-block h-6 w-6 rounded-full ring-2 ring-white" src="/placeholder.png" alt="" />
                  <img className="inline-block h-6 w-6 rounded-full ring-2 ring-white" src="/placeholder.png" alt="" />
                  <img className="inline-block h-6 w-6 rounded-full ring-2 ring-white" src="/placeholder.png" alt="" />
                </div>
                <span className="text-xs font-bold text-amber-900/80">
                  1000+ users joined premium this week
                </span>
              </div>
            </div>

            {/* CHECKLIST */}
            <div className="bg-white rounded-2xl p-5 border border-amber-200/60 shadow-xs text-left space-y-3 text-xs font-black text-slate-800">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>Unlimited Messaging</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>Contact Views & Phone Numbers</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>Weekly Profile Boost & Priority Listing</span>
              </div>
            </div>

            {/* UPGRADE BUTTON */}
            <div>
              <button
                type="button"
                onClick={() => router.push('/dashboard/membership')}
                className="w-full py-4 rounded-2xl bg-slate-950 text-white font-black text-xs uppercase tracking-wider shadow-xl hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300/30"
              >
                <Crown size={18} className="fill-amber-400 text-amber-400" />
                <span>Upgrade at ₹1299</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* 🌟 TAB CONTENT 2: SETTINGS (Matching Screenshot 3) */}
        {activeTab === 'settings' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-3 border-2 border-rose-100 shadow-xl space-y-1"
          >
            <button 
              type="button" 
              onClick={() => router.push('/dashboard/edit-profile')} 
              className="w-full p-4 rounded-2xl hover:bg-rose-50/60 flex items-center justify-between text-slate-900 transition-all group cursor-pointer border border-transparent hover:border-rose-100"
            >
              <div className="flex items-center gap-3.5">
                <Edit2 size={18} className="text-[#870c3f]" />
                <span className="text-xs font-black uppercase">Edit my profile</span>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              type="button" 
              onClick={() => router.push('/dashboard/gallery')} 
              className="w-full p-4 rounded-2xl hover:bg-rose-50/60 flex items-center justify-between text-slate-900 transition-all group cursor-pointer border border-transparent hover:border-rose-100"
            >
              <div className="flex items-center gap-3.5">
                <Shield size={18} className="text-[#870c3f]" />
                <span className="text-xs font-black uppercase">Profile Privacy</span>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              type="button" 
              onClick={() => router.push('/dashboard/membership')} 
              className="w-full p-4 rounded-2xl hover:bg-rose-50/60 flex items-center justify-between text-slate-900 transition-all group cursor-pointer border border-transparent hover:border-rose-100"
            >
              <div className="flex items-center gap-3.5">
                <Crown size={18} className="text-amber-500" />
                <span className="text-xs font-black uppercase">Explore Plans</span>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              type="button" 
              onClick={() => router.push('/dashboard/membership')} 
              className="w-full p-4 rounded-2xl hover:bg-rose-50/60 flex items-center justify-between text-slate-900 transition-all group cursor-pointer border border-transparent hover:border-rose-100"
            >
              <div className="flex items-center gap-3.5">
                <CreditCard size={18} className="text-[#870c3f]" />
                <span className="text-xs font-black uppercase">Payment Info</span>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              type="button" 
              onClick={() => router.push('/dashboard/support')} 
              className="w-full p-4 rounded-2xl hover:bg-rose-50/60 flex items-center justify-between text-slate-900 transition-all group cursor-pointer border border-transparent hover:border-rose-100"
            >
              <div className="flex items-center gap-3.5">
                <HelpCircle size={18} className="text-[#870c3f]" />
                <span className="text-xs font-black uppercase">Help & Support</span>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              type="button" 
              onClick={() => router.push('/dashboard/settings')} 
              className="w-full p-4 rounded-2xl hover:bg-rose-50/60 flex items-center justify-between text-slate-900 transition-all group cursor-pointer border border-transparent hover:border-rose-100"
            >
              <div className="flex items-center gap-3.5">
                <Settings size={18} className="text-[#870c3f]" />
                <span className="text-xs font-black uppercase">Account Settings & Deactivate</span>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
}
