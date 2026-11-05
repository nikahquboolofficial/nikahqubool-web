"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Bell, MessageSquare, ChevronDown, User, 
  LogOut, Edit3, Search, Crown, CheckCircle2, HeartHandshake, Settings, ArrowLeft, Rocket
} from 'lucide-react';
import { getOptimizedImageUrl, getFallbackPhoto, DEFAULT_FEMALE_AVATAR } from '@/lib/imageUtils';
import { fetchProfileDetailsApi, fetchBoostStatusApi, fetchActiveSubscriptionApi } from '@/lib/api';
import { getAuthToken, getStoredUserPhoto } from '@/lib/auth';
import { getClientSubscriptionStatus, syncSubscriptionToStorage } from '@/lib/subscriptionUtils';
import BoostModal from '@/components/dashboard/BoostModal';

interface HeaderProps {
  unreadCount?: number;
  onOpenMobileMenu: () => void;
  onOpenNotifications: () => void;
  handleLogout: () => void;
}

export default function DashboardHeader({ 
  unreadCount = 0, 
  onOpenMobileMenu, 
  onOpenNotifications, 
  handleLogout 
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [userPhoto, setUserPhoto] = useState<string>(() => getStoredUserPhoto());
  const [userName, setUserName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user_details") || localStorage.getItem("user_session");
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.fullName || parsed.FullName || 'My Account';
        }
      } catch (e) {}
    }
    return 'My Account';
  });
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(() => getClientSubscriptionStatus().isPaid);
  const [planName, setPlanName] = useState<string>(() => getClientSubscriptionStatus().planName || 'Free Member');
  const [isBoostModalOpen, setIsBoostModalOpen] = useState<boolean>(false);
  const [isBoosted, setIsBoosted] = useState<boolean>(false);
  const lastSubCheckRef = useRef<number>(0);
  const lastBoostCheckRef = useRef<number>(0);

  useEffect(() => {
    const updatePhotoFromStorage = async () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("user_details") || localStorage.getItem("user_session");
        let parsed: any = null;
        if (stored) {
          try {
            parsed = JSON.parse(stored);
          } catch (e) {}
        }

        const rawPhoto = parsed?.mainPhotoUrl || parsed?.photoUrl || parsed?.PhotoUrl || parsed?.mainPhoto || parsed?.photo;
        const token = getAuthToken();

        if (parsed && (rawPhoto || parsed.userId)) {
          setUserPhoto(getOptimizedImageUrl(rawPhoto, parsed.userId || 1, parsed.gender));
          setUserName(parsed.fullName || parsed.FullName || 'My Account');
          setIsVerified(Boolean(parsed.isVerified ?? parsed.IsVerified ?? false));
          const clientStatus = getClientSubscriptionStatus();
          setIsPaid(clientStatus.isPaid);
          setPlanName(clientStatus.isPaid ? clientStatus.planName : 'Free Member');
        }

        if (token && (!rawPhoto || rawPhoto === '/placeholder.png')) {
          try {
            const userId = parsed?.userId || 0;
            const res = await fetchProfileDetailsApi(userId, token);
            if (res.success && res.data) {
              const profile = res.data.profile || res.data.Profile || res.data;
              const freshPhoto = profile.mainPhotoUrl || profile.photoUrl || profile.PhotoUrl || profile.mainPhoto || profile.photo;
              if (freshPhoto) {
                setUserPhoto(getOptimizedImageUrl(freshPhoto, profile.userId || userId || 1, profile.gender));
                setUserName(profile.fullName || profile.FullName || 'My Account');
                const updatedSession = { ...(parsed || {}), mainPhotoUrl: freshPhoto, photoUrl: freshPhoto, photo: freshPhoto };
                localStorage.setItem('user_details', JSON.stringify(updatedSession));
                localStorage.setItem('user_session', JSON.stringify(updatedSession));
              }
            }
          } catch (err) {}
        }
      }
    };

    const checkSubscriptionStatus = async (force: boolean = false) => {
      // 1. Immediately read client subscription status (0ms latency, zero flash)
      const clientStatus = getClientSubscriptionStatus();
      setIsPaid(clientStatus.isPaid);
      setPlanName(clientStatus.isPaid ? clientStatus.planName : 'Free Member');

      const now = Date.now();
      if (!force && now - lastSubCheckRef.current < 60000) return;
      lastSubCheckRef.current = now;

      const token = getAuthToken();
      if (!token) return;
      try {
        const res = await fetchActiveSubscriptionApi(token);
        if (res.success && res.data && (res.data.planName || res.data.PlanName || res.data.membershipType || res.data.isPaid)) {
          syncSubscriptionToStorage(res.data);
          const updated = getClientSubscriptionStatus();
          setIsPaid(updated.isPaid);
          setPlanName(updated.isPaid ? updated.planName : 'Free Member');
        }
      } catch (e) {}
    };

    const checkBoostStatus = async (force: boolean = false) => {
      const now = Date.now();
      if (!force && now - lastBoostCheckRef.current < 60000) return;
      lastBoostCheckRef.current = now;

      const token = getAuthToken();
      if (!token) return;
      try {
        const res = await fetchBoostStatusApi(token);
        if (res.success && res.data) {
          setIsBoosted(Boolean(res.data.isBoosted ?? res.data.IsBoosted));
        }
      } catch (e) {}
    };

    updatePhotoFromStorage();
    checkBoostStatus(false);
    checkSubscriptionStatus(false);

    const handleBoostUpdated = (e: any) => {
      if (e?.detail) {
        setIsBoosted(Boolean(e.detail.isBoosted ?? e.detail.IsBoosted));
      } else {
        checkBoostStatus();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("user_photo_updated", updatePhotoFromStorage);
      window.addEventListener("boost_updated", handleBoostUpdated);
      window.addEventListener("user_details_updated", checkSubscriptionStatus);
      window.addEventListener("subscription_updated", checkSubscriptionStatus);
      return () => {
        window.removeEventListener("user_photo_updated", updatePhotoFromStorage);
        window.removeEventListener("boost_updated", handleBoostUpdated);
        window.removeEventListener("user_details_updated", checkSubscriptionStatus);
        window.removeEventListener("subscription_updated", checkSubscriptionStatus);
      };
    }
  }, [pathname]);

  return (
    <header className="h-16 md:h-20 bg-white/90 backdrop-blur-2xl border-b border-rose-100/80 sticky top-0 z-[100] px-4 md:px-8 flex items-center justify-between shadow-[0_4px_20px_-4px_rgba(217,27,92,0.06)] text-slate-900 selection:bg-[#d91b5c] selection:text-white">
      
      {/* 👑 BRAND LOGO IMAGE */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <img
            src="/nikah-qubool-logo.png"
            alt="Nikah Qubool Logo"
            className="h-10 sm:h-12 md:h-13 w-auto max-w-[190px] sm:max-w-[250px] object-contain object-left transition-transform duration-200 group-hover:scale-105"
          />
        </Link>
      </div>

      {/* DESKTOP NAVIGATION */}
      <nav className="hidden lg:flex items-center gap-3 h-full">
        <Link 
          href="/dashboard" 
          className={`text-xs font-black uppercase tracking-wider transition-all px-3.5 py-1.5 rounded-full ${
            pathname === '/dashboard' 
              ? 'bg-rose-50 text-[#d91b5c] border border-rose-200/80 shadow-xs' 
              : 'text-slate-600 hover:text-[#d91b5c] hover:bg-rose-50/50'
          }`}
        >
          Dashboard
        </Link>

        <Link 
          href="/dashboard/activity" 
          className={`text-xs font-black uppercase tracking-wider transition-all px-3.5 py-1.5 rounded-full flex items-center gap-1.5 ${
            pathname.startsWith('/dashboard/activity') 
              ? 'bg-rose-50 text-[#d91b5c] border border-rose-200/80 shadow-xs' 
              : 'text-slate-600 hover:text-[#d91b5c] hover:bg-rose-50/50'
          }`}
        >
          <HeartHandshake size={15} className="text-[#d91b5c]" /> Activity
        </Link>

        <Link 
          href="/dashboard/find-match" 
          className={`text-xs font-black uppercase tracking-wider transition-all px-3.5 py-1.5 rounded-full ${
            pathname.startsWith('/dashboard/find-match') 
              ? 'bg-rose-50 text-[#d91b5c] border border-rose-200/80 shadow-xs' 
              : 'text-slate-600 hover:text-[#d91b5c] hover:bg-rose-50/50'
          }`}
        >
          Find Matches
        </Link>

        <Link 
          href="/dashboard/messages" 
          className={`text-xs font-black uppercase tracking-wider transition-all px-3.5 py-1.5 rounded-full flex items-center gap-1.5 ${
            pathname.startsWith('/dashboard/messages') 
              ? 'bg-rose-50 text-[#d91b5c] border border-rose-200/80 shadow-xs' 
              : 'text-slate-600 hover:text-[#d91b5c] hover:bg-rose-50/50'
          }`}
        >
          <MessageSquare size={15} className="text-[#d91b5c]" /> Messages
        </Link>

        <Link 
          href="/dashboard/my-profile" 
          className={`text-xs font-black uppercase tracking-wider transition-all px-3.5 py-1.5 rounded-full ${
            pathname.startsWith('/dashboard/my-profile') 
              ? 'bg-rose-50 text-[#d91b5c] border border-rose-200/80 shadow-xs' 
              : 'text-slate-600 hover:text-[#d91b5c] hover:bg-rose-50/50'
          }`}
        >
          My Profile
        </Link>
      </nav>

      {/* RIGHT SIDE ACTIONS: VIP UPGRADE & USER AVATAR */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {isPaid ? (
          <Link 
            href="/dashboard/payment-info"
            className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-slate-950 px-4 py-2 rounded-full font-black text-xs shadow-[0_4px_14px_rgba(245,158,11,0.35)] transition-all transform hover:-translate-y-0.5 border border-amber-300"
          >
            <Crown size={15} className="text-slate-950 fill-slate-950" />
            <span className="uppercase">{planName || 'VIP Member'}</span>
          </Link>
        ) : (
          <Link 
            href="/dashboard/membership"
            className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-[#d91b5c] hover:brightness-110 text-white px-4 py-2 rounded-full font-black text-xs shadow-[0_4px_14px_rgba(217,27,92,0.25)] transition-all transform hover:-translate-y-0.5 border border-white/20"
          >
            <Crown size={15} className="text-amber-200 fill-amber-200 animate-pulse" />
            <span>Upgrade VIP</span>
          </Link>
        )}

        {/* 🚀 NIKAH FOREVER STYLE PROFILE BOOST BUTTON */}
        <button
          type="button"
          onClick={() => setIsBoostModalOpen(true)}
          className={`relative p-2 sm:p-2.5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
            isBoosted 
              ? 'bg-[#E21E5B] text-white ring-2 ring-[#E21E5B]/40 shadow-[0_0_15px_rgba(226,30,91,0.5)] animate-pulse'
              : 'bg-rose-50 hover:bg-[#E21E5B] text-[#E21E5B] hover:text-white border border-rose-200/60 shadow-xs'
          }`}
          title={isBoosted ? "Profile Boost Active! (Rank #1)" : "Boost Profile (Get 10X Views)"}
          aria-label="Boost Profile"
        >
          <Rocket size={19} className={isBoosted ? "fill-white" : "fill-[#E21E5B] hover:fill-white"} />
          {isBoosted && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white shadow-xs" />
          )}
        </button>

        {/* NOTIFICATIONS BELL */}
        <button 
          onClick={onOpenNotifications}
          className="relative p-2.5 rounded-full hover:bg-rose-50 text-slate-700 hover:text-[#d91b5c] transition-colors cursor-pointer border border-transparent hover:border-rose-100"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[17px] h-[17px] bg-[#d91b5c] text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 border-2 border-white shadow-xs animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* USER PROFILE AVATAR DP (DESKTOP ONLY) */}
        <div className="relative group hidden md:flex">
          <Link 
            href="/dashboard/my-profile" 
            className="flex items-center gap-2.5 py-1 px-2.5 rounded-full bg-rose-50/60 hover:bg-rose-100/60 border border-rose-200/60 transition-all duration-200 shadow-xs"
          >
            <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-[#d91b5c] shadow-xs bg-slate-100">
              <img 
                src={userPhoto} 
                alt={userName} 
                className="w-full h-full object-cover object-top"
                onError={(e) => { 
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = DEFAULT_FEMALE_AVATAR;
                }}
              />
            </div>
            <div className="hidden md:block text-left">
              <div className="flex items-center gap-1">
                <p className="text-xs font-black text-slate-900 leading-tight truncate max-w-[110px]">
                  {userName}
                </p>
                {isVerified && <CheckCircle2 size={12} className="fill-emerald-500 text-white shrink-0" />}
              </div>
              <p className="text-[10px] text-[#d91b5c] font-bold flex items-center gap-0.5">
                {isPaid ? (
                  <span className="flex items-center gap-1 text-amber-600 font-extrabold uppercase"><Crown size={10} className="fill-amber-500" /> {planName || 'VIP'}</span>
                ) : (
                  <span>Free Member</span>
                )}
              </p>
            </div>
          </Link>
        </div>

      </div>

      {/* 🚀 BOOST MODAL */}
      <BoostModal 
        isOpen={isBoostModalOpen} 
        onClose={() => setIsBoostModalOpen(false)} 
        onBoostSuccess={() => setIsBoosted(true)} 
      />

    </header>
  );
}