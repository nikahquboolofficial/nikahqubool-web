"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Search, MessageCircle, User } from 'lucide-react';
import { getOptimizedImageUrl, DEFAULT_FEMALE_AVATAR } from '@/lib/imageUtils';
import { getAuthToken, syncUserProfilePhoto } from '@/lib/auth';
import { fetchProfileDetailsApi } from '@/lib/api';

interface BottomNavProps {
  unreadCount?: number;
  unreadChatCount?: number;
  onOpenProfileDrawer?: () => void;
}

export default function DashboardBottomNav({ 
  unreadCount = 0,
  unreadChatCount = 0
}: BottomNavProps) {
  const pathname = usePathname();
  const [userPhoto, setUserPhoto] = useState<string>(DEFAULT_FEMALE_AVATAR);

  useEffect(() => {
    const updatePhotoFromStorage = async () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("user_details") || localStorage.getItem("user_session");
        let parsed: any = null;
        if (stored) {
          try {
            parsed = JSON.parse(stored);
            const rawPhoto = parsed.mainPhotoUrl || parsed.photoUrl || parsed.PhotoUrl || parsed.mainPhoto || parsed.photo;
            if (rawPhoto && rawPhoto !== '/placeholder.png') {
              setUserPhoto(getOptimizedImageUrl(rawPhoto, parsed.userId || 1, parsed.gender));
              return;
            }
          } catch (e) {}
        }

        const token = getAuthToken();
        if (token) {
          try {
            const userId = parsed?.userId || 0;
            const res = await fetchProfileDetailsApi(userId, token);
            if (res.success && res.data) {
              const profile = res.data.profile || res.data.Profile || res.data;
              const freshPhoto = profile.mainPhotoUrl || profile.photoUrl || profile.PhotoUrl || profile.mainPhoto || profile.photo;
              if (freshPhoto) {
                setUserPhoto(getOptimizedImageUrl(freshPhoto, profile.userId || userId || 1, profile.gender));
                syncUserProfilePhoto(freshPhoto);
              }
            }
          } catch (err) {}
        }
      }
    };

    updatePhotoFromStorage();
    if (typeof window !== "undefined") {
      window.addEventListener("user_photo_updated", updatePhotoFromStorage);
      return () => window.removeEventListener("user_photo_updated", updatePhotoFromStorage);
    }
  }, []);

  const isHome = pathname === '/dashboard';
  const isActivity = pathname.startsWith('/dashboard/activity');
  const isSearch = pathname.startsWith('/dashboard/find-match');
  const isChat = pathname.startsWith('/dashboard/messages');
  const isProfile = pathname.startsWith('/dashboard/my-profile') || pathname.startsWith('/dashboard/edit-profile');

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-xl border-t border-rose-100 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]">
      <div className="grid grid-cols-5 items-center h-16 px-1">
        
        {/* 1. HOME */}
        <Link 
          href="/dashboard" 
          className={`flex flex-col items-center justify-center py-1 transition-all duration-150 ${
            isHome 
              ? 'text-[#e21e5b]' 
              : 'text-[#534344]/80 hover:text-[#e21e5b]'
          }`}
        >
          <div className="relative">
            <Home size={22} className={isHome ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            {isHome && (
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#e21e5b]" />
            )}
          </div>
          <span className={`text-[10px] mt-1 tracking-tight ${isHome ? 'font-bold text-[#e21e5b]' : 'font-medium text-[#534344]'}`}>
            Home
          </span>
        </Link>

        {/* 2. ACTIVITY */}
        <Link 
          href="/dashboard/activity" 
          className={`relative flex flex-col items-center justify-center py-1 transition-all duration-150 ${
            isActivity 
              ? 'text-[#e21e5b]' 
              : 'text-[#534344]/80 hover:text-[#e21e5b]'
          }`}
        >
          <div className="relative">
            <Sparkles size={22} className={isActivity ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] bg-[#e21e5b] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 border-2 border-white shadow-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            {isActivity && (
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#e21e5b]" />
            )}
          </div>
          <span className={`text-[10px] mt-1 tracking-tight ${isActivity ? 'font-bold text-[#e21e5b]' : 'font-medium text-[#534344]'}`}>
            Activity
          </span>
        </Link>

        {/* 3. SEARCH */}
        <Link 
          href="/dashboard/find-match" 
          className={`flex flex-col items-center justify-center py-1 transition-all duration-150 ${
            isSearch 
              ? 'text-[#e21e5b]' 
              : 'text-[#534344]/80 hover:text-[#e21e5b]'
          }`}
        >
          <div className="relative">
            <Search size={22} className={isSearch ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            {isSearch && (
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#e21e5b]" />
            )}
          </div>
          <span className={`text-[10px] mt-1 tracking-tight ${isSearch ? 'font-bold text-[#e21e5b]' : 'font-medium text-[#534344]'}`}>
            Search
          </span>
        </Link>

        {/* 4. CHAT */}
        <Link 
          href="/dashboard/messages" 
          className={`relative flex flex-col items-center justify-center py-1 transition-all duration-150 ${
            isChat 
              ? 'text-[#e21e5b]' 
              : 'text-[#534344]/80 hover:text-[#e21e5b]'
          }`}
        >
          <div className="relative">
            <MessageCircle size={22} className={isChat ? 'stroke-[2.4] fill-[#e21e5b]/15' : 'stroke-[1.8]'} />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] bg-[#e21e5b] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 border-2 border-white shadow-xs">
                {unreadChatCount > 99 ? '99+' : unreadChatCount}
              </span>
            )}
            {isChat && (
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#e21e5b]" />
            )}
          </div>
          <span className={`text-[10px] mt-1 tracking-tight ${isChat ? 'font-bold text-[#e21e5b]' : 'font-medium text-[#534344]'}`}>
            Chat
          </span>
        </Link>

        {/* 5. PROFILE */}
        <Link 
          href="/dashboard/my-profile" 
          className={`flex flex-col items-center justify-center py-1 transition-all duration-150 ${
            isProfile 
              ? 'text-[#e21e5b]' 
              : 'text-[#534344]/80 hover:text-[#e21e5b]'
          }`}
        >
          <div className="relative">
            <div className={`w-6 h-6 rounded-full overflow-hidden border transition-all ${
              isProfile ? 'border-[#e21e5b] ring-2 ring-[#e21e5b]/20 scale-105' : 'border-slate-300'
            }`}>
              <img 
                src={userPhoto} 
                alt="My Profile" 
                className="w-full h-full object-cover object-top"
                onError={(e) => { 
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = DEFAULT_FEMALE_AVATAR; 
                }}
              />
            </div>
            {isProfile && (
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#e21e5b]" />
            )}
          </div>
          <span className={`text-[10px] mt-1 tracking-tight ${isProfile ? 'font-bold text-[#e21e5b]' : 'font-medium text-[#534344]'}`}>
            Profile
          </span>
        </Link>

      </div>
    </div>
  );
}
