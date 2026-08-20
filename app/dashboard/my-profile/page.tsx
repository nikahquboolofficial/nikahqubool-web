"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Share2, Edit2, CheckCircle2, ChevronRight, Crown, Settings, 
  UserCheck, MessageSquare, Eye, Sparkles, Shield, CreditCard, 
  HelpCircle, ArrowLeft, Loader2, Camera, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { fetchActiveSubscriptionApi, fetchProfileDetailsApi, fetchSubscriptionPlansApi } from '@/lib/api';
import { getOptimizedImageUrl } from '@/lib/imageUtils';
import VerificationModal from '@/components/profile/VerificationModal';

export default function MySelfProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'premium' | 'settings'>('premium');
  const [profileData, setProfileData] = useState<any>(null);
  const [cheapestPlan, setCheapestPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);

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
        title: profileData?.fullName || 'Nikah Qubool Profile',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Profile link copied!");
    }
  };

  const photo = getOptimizedImageUrl(profileData?.mainPhotoUrl || profileData?.photoUrl);
  const fullName = profileData?.fullName || 'Member Profile';
  const isVerified = Boolean(profileData?.isVerified ?? profileData?.IsVerified ?? false);
  const profileCompletion = profileData?.profileCompletion || 85;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-28 pt-4 selection:bg-[#d91b5c] selection:text-white">
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
            className="p-2.5 rounded-full bg-white border-2 border-slate-200 text-slate-700 hover:text-[#d91b5c] shadow-xs cursor-pointer transition-all"
            aria-label="Share Profile"
          >
            <Share2 size={18} />
          </button>
        </div>

        {/* PROFILE CARD WITH PERCENTAGE RING & EDIT ICON */}
        <div className="bg-white rounded-3xl p-6 border-2 border-rose-100 shadow-xl text-center space-y-4 relative">
          
          {/* AVATAR WITH 85% COMPLETION RING */}
          <div className="relative w-28 h-28 mx-auto cursor-pointer" onClick={() => router.push('/dashboard/gallery')}>
            <div className="w-full h-full rounded-full p-1 border-4 border-[#d91b5c] relative flex items-center justify-center bg-white shadow-md">
              <img 
                src={photo} 
                alt={fullName} 
                className="w-full h-full rounded-full object-cover object-top" 
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
            <div className="absolute -bottom-2 inset-x-0 mx-auto w-fit px-3 py-0.5 rounded-full bg-[#d91b5c] text-white text-[11px] font-black shadow-md border-2 border-white">
              {profileCompletion}%
            </div>
          </div>

          {/* FULL NAME & VERIFIED BADGE */}
          <div className="pt-2">
            <h2 className="text-xl font-serif font-extrabold uppercase text-slate-900 flex items-center justify-center gap-1.5">
              <span>{fullName}</span>
              {isVerified && <CheckCircle2 size={18} className="fill-emerald-500 text-white" />}
            </h2>

            {/* PROMINENT VERIFICATION BADGE BUTTON */}
            <div className="pt-2">
              {isVerified ? (
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-black uppercase tracking-wider shadow-xs">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Profile Verified</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsVerificationOpen(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-black uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer border border-emerald-300"
                >
                  <Shield size={16} className="text-emerald-200" />
                  <span>Get Verified Badge Now</span>
                </button>
              )}
            </div>

            {/* INCOMPLETE PROFILE LINK -> OPENS /dashboard/edit-profile */}
            <button 
              type="button"
              onClick={() => router.push('/dashboard/edit-profile')}
              className="text-xs font-black text-[#d91b5c] hover:underline uppercase tracking-wider flex items-center justify-center gap-1 mx-auto mt-2 cursor-pointer"
            >
              <span>Edit Profile Details</span>
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
            className="bg-gradient-to-br from-amber-500/10 via-rose-50/70 to-amber-500/10 rounded-3xl p-6 border-2 border-amber-300/70 shadow-xl text-center space-y-5 relative overflow-hidden"
          >
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-950 text-[11px] font-black uppercase tracking-wider">
                <Sparkles size={13} className="text-amber-600 fill-amber-500" />
                <span>Nikah Qubool Premium Matchmaking</span>
              </div>

              <h3 className="text-xl font-serif font-extrabold text-slate-900 uppercase tracking-tight pt-1">
                Elevate Your Matchmaking with Premium
              </h3>

              <p className="text-xs font-semibold text-slate-600 max-w-sm mx-auto leading-relaxed">
                Connect directly with verified families & unlock 100% genuine contact numbers instantly.
              </p>
            </div>

            {/* DYNAMIC PLAN DETAILS BADGE */}
            {cheapestPlan && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-amber-300/80 shadow-md flex items-center justify-between">
                <div className="text-left">
                  <div className="text-[10px] font-black uppercase tracking-wider text-rose-800">
                    {cheapestPlan.planName || cheapestPlan.PlanName || "Starter VIP Plan"}
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-black text-slate-900">
                      ₹{cheapestPlan.discountPrice ?? cheapestPlan.DiscountPrice ?? cheapestPlan.originalPrice ?? cheapestPlan.OriginalPrice ?? 799}
                    </span>
                    {(cheapestPlan.discountPrice || cheapestPlan.DiscountPrice) && (cheapestPlan.originalPrice || cheapestPlan.OriginalPrice) > (cheapestPlan.discountPrice || cheapestPlan.DiscountPrice) && (
                      <span className="text-xs font-bold text-slate-400 line-through">
                        ₹{cheapestPlan.originalPrice || cheapestPlan.OriginalPrice}
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-[10px] font-black uppercase border border-amber-300">
                  Best Value
                </div>
              </div>
            )}

            {/* CHECKLIST */}
            <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs text-left space-y-2.5 text-xs font-black text-slate-800">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>Direct Messaging & Instant Proposal Calls</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>Full Contact Details & Verified Phone Numbers</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>Priority Profile Placement in Match Searches</span>
              </div>
            </div>

            {/* UPGRADE BUTTON */}
            <div>
              <Link
                href="/dashboard/membership"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-900/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-rose-300/30 block"
              >
                <div className="flex items-center justify-center gap-2 w-full">
                  <Crown size={18} className="fill-amber-300 text-amber-300" />
                  <span>
                    Upgrade Now {cheapestPlan ? `at ₹${cheapestPlan.discountPrice ?? cheapestPlan.DiscountPrice ?? cheapestPlan.originalPrice ?? cheapestPlan.OriginalPrice}` : ''}
                  </span>
                </div>
              </Link>
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
            <Link 
              href="/dashboard/edit-profile" 
              className="w-full p-4 rounded-2xl hover:bg-rose-50/60 flex items-center justify-between text-slate-900 transition-all group cursor-pointer border border-transparent hover:border-rose-100 block"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3.5">
                  <Edit2 size={18} className="text-[#d91b5c]" />
                  <span className="text-xs font-black uppercase">Edit my profile</span>
                </div>
                <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link 
              href="/dashboard/gallery" 
              className="w-full p-4 rounded-2xl hover:bg-rose-50/60 flex items-center justify-between text-slate-900 transition-all group cursor-pointer border border-transparent hover:border-rose-100 block"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3.5">
                  <Shield size={18} className="text-[#d91b5c]" />
                  <span className="text-xs font-black uppercase">Profile Privacy</span>
                </div>
                <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link 
              href="/dashboard/membership" 
              className="w-full p-4 rounded-2xl hover:bg-rose-50/60 flex items-center justify-between text-slate-900 transition-all group cursor-pointer border border-transparent hover:border-rose-100 block"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3.5">
                  <Crown size={18} className="text-amber-500" />
                  <span className="text-xs font-black uppercase">Explore Plans</span>
                </div>
                <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link 
              href="/dashboard/payment-info" 
              className="w-full p-4 rounded-2xl hover:bg-rose-50/60 flex items-center justify-between text-slate-900 transition-all group cursor-pointer border border-transparent hover:border-rose-100 block"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3.5">
                  <CreditCard size={18} className="text-[#d91b5c]" />
                  <span className="text-xs font-black uppercase">Payment Info</span>
                </div>
                <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link 
              href="/dashboard/support" 
              className="w-full p-4 rounded-2xl hover:bg-rose-50/60 flex items-center justify-between text-slate-900 transition-all group cursor-pointer border border-transparent hover:border-rose-100 block"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3.5">
                  <HelpCircle size={18} className="text-[#d91b5c]" />
                  <span className="text-xs font-black uppercase">Help & Support</span>
                </div>
                <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link 
              href="/dashboard/settings" 
              className="w-full p-4 rounded-2xl hover:bg-rose-50/60 flex items-center justify-between text-slate-900 transition-all group cursor-pointer border border-transparent hover:border-rose-100 block"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3.5">
                  <Settings size={18} className="text-[#d91b5c]" />
                  <span className="text-xs font-black uppercase">Account Settings & Deactivate</span>
                </div>
                <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>
        )}

      </div>

      {/* 🛡️ DUAL VERIFICATION MODAL */}
      <VerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        userId={profileData?.userId || 0}
        token={getToken() || null}
        onVerificationSuccess={() => {
          loadMyProfile();
        }}
      />
    </div>
  );
}

