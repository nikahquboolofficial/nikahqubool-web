"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Bell, MessageSquare, ChevronDown, User, 
  LogOut, Edit3, Search, Crown, CheckCircle2, HeartHandshake, Settings, ArrowLeft
} from 'lucide-react';
import { getOptimizedImageUrl, getFallbackPhoto } from '@/lib/imageUtils';

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

  const [userPhoto, setUserPhoto] = useState<string>('/placeholder.png');
  const [userName, setUserName] = useState<string>('My Account');
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);

  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() ?? null;
    return null;
  };

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

        if (parsed) {
          const rawPhoto = parsed.mainPhotoUrl || parsed.photoUrl || parsed.PhotoUrl || parsed.mainPhoto || parsed.photo;
          setUserPhoto(getOptimizedImageUrl(rawPhoto, parsed.userId || 1, parsed.gender));
          setUserName(parsed.fullName || parsed.FullName || 'My Account');
          setIsVerified(Boolean(parsed.isVerified ?? parsed.IsVerified ?? false));
          setIsPaid(Boolean(parsed.isPaid ?? parsed.IsPaid ?? false));
        } else {
          // 🔄 Auto Fetch Logged-in User Profile to ensure Avatar DP works on EVERY page
          const token = getCookie("user_token");
          if (token) {
            try {
              const res = await fetch('http://115.124.106.149/api/User/get-profile-details', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (res.ok) {
                const json = await res.json();
                const profile = json?.data?.profile || json?.data || json?.profile;
                if (profile) {
                  localStorage.setItem("user_details", JSON.stringify(profile));
                  const rawPhoto = profile.mainPhotoUrl || profile.photoUrl || profile.PhotoUrl;
                  setUserPhoto(getOptimizedImageUrl(rawPhoto, profile.userId || 1, profile.gender));
                  setUserName(profile.fullName || 'My Account');
                  setIsVerified(Boolean(profile.isVerified ?? false));
                  setIsPaid(Boolean(profile.isPaid ?? false));
                }
              }
            } catch (err) {}
          }
        }
      }
    };

    updatePhotoFromStorage();

    if (typeof window !== "undefined") {
      window.addEventListener("user_photo_updated", updatePhotoFromStorage);
      return () => window.removeEventListener("user_photo_updated", updatePhotoFromStorage);
    }
  }, [pathname]);

  return (
    <header className="h-16 md:h-20 bg-white/95 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-[100] px-4 md:px-8 flex items-center justify-between shadow-xs text-slate-900 selection:bg-[#d91b5c] selection:text-white">
      
      {/* 👑 STYLISH NIKAH QUBOOL TEXT BRAND LOGO */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <span className="font-serif font-black text-xl sm:text-2xl tracking-tight text-[#d91b5c]">
            Nikah Qubool
          </span>
        </Link>
      </div>

      {/* DESKTOP NAVIGATION */}
      <nav className="hidden lg:flex items-center gap-8 h-full">
        <Link 
          href="/dashboard" 
          className={`text-xs font-bold uppercase tracking-wider transition-all py-2 border-b-2 ${pathname === '/dashboard' ? 'text-[#d91b5c] border-[#d91b5c]' : 'text-slate-700 hover:text-[#d91b5c] border-transparent'}`}
        >
          Dashboard
        </Link>

        <Link 
          href="/dashboard/activity" 
          className={`text-xs font-bold uppercase tracking-wider transition-all py-2 border-b-2 flex items-center gap-1.5 ${pathname.startsWith('/dashboard/activity') ? 'text-[#d91b5c] border-[#d91b5c]' : 'text-slate-700 hover:text-[#d91b5c] border-transparent'}`}
        >
          <HeartHandshake size={16} className="text-[#d91b5c]" /> Activity
        </Link>

        <Link 
          href="/dashboard/find-match" 
          className={`text-xs font-bold uppercase tracking-wider transition-all py-2 border-b-2 ${pathname.startsWith('/dashboard/find-match') ? 'text-[#d91b5c] border-[#d91b5c]' : 'text-slate-700 hover:text-[#d91b5c] border-transparent'}`}
        >
          Find Matches
        </Link>

        <Link 
          href="/dashboard/messages" 
          className={`text-xs font-bold uppercase tracking-wider transition-all py-2 border-b-2 flex items-center gap-1.5 ${pathname.startsWith('/dashboard/messages') ? 'text-[#d91b5c] border-[#d91b5c]' : 'text-slate-700 hover:text-[#d91b5c] border-transparent'}`}
        >
          Messages
        </Link>

        <Link 
          href="/dashboard/my-profile" 
          className={`text-xs font-bold uppercase tracking-wider transition-all py-2 border-b-2 ${pathname.startsWith('/dashboard/my-profile') ? 'text-[#d91b5c] border-[#d91b5c]' : 'text-slate-700 hover:text-[#d91b5c] border-transparent'}`}
        >
          My Profile
        </Link>
      </nav>

      {/* RIGHT SIDE ACTIONS: VIP UPGRADE & USER AVATAR */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        <Link 
          href="/dashboard/membership"
          className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-[#d91b5c] to-rose-600 hover:from-rose-600 hover:to-[#d91b5c] text-white px-4 py-2 rounded-full font-bold text-xs shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 border border-rose-300/30"
        >
          <Crown size={15} className="text-amber-300 fill-amber-300 animate-pulse" />
          <span>Upgrade VIP</span>
        </Link>

        {/* NOTIFICATIONS BELL */}
        <button 
          onClick={onOpenNotifications}
          className="relative p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#d91b5c] rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* USER PROFILE AVATAR DP (DESKTOP ONLY - HIDDEN ON MOBILE VIEW AS REQUESTED) */}
        <div className="relative group hidden md:flex">
          <Link 
            href="/dashboard/my-profile" 
            className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-[#d91b5c] shadow-sm bg-slate-100">
              <img 
                src={userPhoto} 
                alt={userName} 
                className="w-full h-full object-cover"
                onError={(e) => { 
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80';
                }}
              />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-extrabold text-slate-900 leading-tight truncate max-w-[110px]">
                {userName}
              </p>
              <p className="text-[10px] text-[#d91b5c] font-semibold flex items-center gap-1">
                {isPaid ? 'VIP Member' : 'Free Member'}
              </p>
            </div>
          </Link>
        </div>

      </div>

    </header>
  );
}