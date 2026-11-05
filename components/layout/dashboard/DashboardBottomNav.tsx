"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Loader2, Home, Sparkles, Search, MessageCircle, User } from 'lucide-react';
import { getOptimizedImageUrl, DEFAULT_FEMALE_AVATAR } from '@/lib/imageUtils';
import { getStoredUserPhoto } from '@/lib/auth';

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
  const [activeTabOverride, setActiveTabOverride] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<string>(() => getStoredUserPhoto());
  const [isPhotoLoaded, setIsPhotoLoaded] = useState<boolean>(false);

  useEffect(() => {
    setActiveTabOverride(null);
  }, [pathname]);

  useEffect(() => {
    const updatePhotoFromStorage = () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("user_details") || localStorage.getItem("user_session");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const rawPhoto = parsed.mainPhotoUrl || parsed.photoUrl || parsed.PhotoUrl || parsed.mainPhoto || parsed.photo;
            if (rawPhoto && rawPhoto !== '/placeholder.png') {
              setUserPhoto(getOptimizedImageUrl(rawPhoto, parsed.userId || 1, parsed.gender));
              return;
            }
          } catch (e) {}
        }
        setUserPhoto(getStoredUserPhoto());
      }
    };

    updatePhotoFromStorage();
    if (typeof window !== "undefined") {
      window.addEventListener("user_photo_updated", updatePhotoFromStorage);
      return () => window.removeEventListener("user_photo_updated", updatePhotoFromStorage);
    }
  }, []);

  const isHome = activeTabOverride ? activeTabOverride === 'home' : pathname === '/dashboard';
  const isActivity = activeTabOverride ? activeTabOverride === 'activity' : pathname.startsWith('/dashboard/activity');
  const isSearch = activeTabOverride ? activeTabOverride === 'search' : pathname.startsWith('/dashboard/find-match');
  const isChat = activeTabOverride ? activeTabOverride === 'chat' : pathname.startsWith('/dashboard/messages');
  const isProfile = activeTabOverride ? activeTabOverride === 'profile' : (pathname.startsWith('/dashboard/my-profile') || pathname.startsWith('/dashboard/edit-profile'));

  const recordBrowseLocation = (url: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem('last_browse_page', url);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[999] bg-[#FAF8F5]/98 backdrop-blur-xl border-t border-rose-100 lg:hidden shadow-[0_-4px_25px_rgba(0,0,0,0.08)] pb-[max(env(safe-area-inset-bottom,0px),4px)] touch-manipulation select-none pointer-events-auto">
      <div className="grid grid-cols-5 items-center h-16 px-1">
        
        {/* 1. HOME */}
        <Link 
          href="/dashboard"
          prefetch={false}
          onClick={() => {
            setActiveTabOverride('home');
            recordBrowseLocation('/dashboard');
          }}
          className={`touch-manipulation select-none active:scale-90 transition-transform duration-100 flex flex-col items-center justify-center py-1 cursor-pointer ${
            isHome 
              ? 'text-[#e21e5b]' 
              : 'text-[#534344]/80 hover:text-[#e21e5b]'
          }`}
        >
          <div className="relative pointer-events-none">
            <Home size={22} className={isHome ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            {isHome && (
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#e21e5b]" />
            )}
          </div>
          <span className={`text-[10px] mt-1 tracking-tight pointer-events-none ${isHome ? 'font-bold text-[#e21e5b]' : 'font-medium text-[#534344]'}`}>
            Home
          </span>
        </Link>

        {/* 2. ACTIVITY */}
        <Link 
          href="/dashboard/activity" 
          prefetch={false}
          onClick={() => {
            setActiveTabOverride('activity');
            recordBrowseLocation('/dashboard/activity');
          }}
          className={`touch-manipulation select-none active:scale-90 transition-transform duration-100 relative flex flex-col items-center justify-center py-1 cursor-pointer ${
            isActivity 
              ? 'text-[#e21e5b]' 
              : 'text-[#534344]/80 hover:text-[#e21e5b]'
          }`}
        >
          <div className="relative pointer-events-none">
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
          <span className={`text-[10px] mt-1 tracking-tight pointer-events-none ${isActivity ? 'font-bold text-[#e21e5b]' : 'font-medium text-[#534344]'}`}>
            Activity
          </span>
        </Link>

        {/* 3. SEARCH */}
        <Link 
          href="/dashboard/find-match" 
          prefetch={false}
          onClick={() => {
            setActiveTabOverride('search');
            recordBrowseLocation('/dashboard/find-match');
          }}
          className={`touch-manipulation select-none active:scale-90 transition-transform duration-100 flex flex-col items-center justify-center py-1 cursor-pointer ${
            isSearch 
              ? 'text-[#e21e5b]' 
              : 'text-[#534344]/80 hover:text-[#e21e5b]'
          }`}
        >
          <div className="relative pointer-events-none">
            <Search size={22} className={isSearch ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            {isSearch && (
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#e21e5b]" />
            )}
          </div>
          <span className={`text-[10px] mt-1 tracking-tight pointer-events-none ${isSearch ? 'font-bold text-[#e21e5b]' : 'font-medium text-[#534344]'}`}>
            Search
          </span>
        </Link>

        {/* 4. CHAT */}
        <Link 
          href="/dashboard/messages" 
          prefetch={false}
          onClick={() => {
            setActiveTabOverride('chat');
            recordBrowseLocation('/dashboard/messages');
          }}
          className={`touch-manipulation select-none active:scale-90 transition-transform duration-100 relative flex flex-col items-center justify-center py-1 cursor-pointer ${
            isChat 
              ? 'text-[#e21e5b]' 
              : 'text-[#534344]/80 hover:text-[#e21e5b]'
          }`}
        >
          <div className="relative pointer-events-none">
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
          <span className={`text-[10px] mt-1 tracking-tight pointer-events-none ${isChat ? 'font-bold text-[#e21e5b]' : 'font-medium text-[#534344]'}`}>
            Chat
          </span>
        </Link>

        {/* 5. PROFILE */}
        <Link 
          href="/dashboard/my-profile" 
          prefetch={false}
          onClick={() => {
            setActiveTabOverride('profile');
            recordBrowseLocation('/dashboard/my-profile');
          }}
          className={`touch-manipulation select-none active:scale-90 transition-transform duration-100 flex flex-col items-center justify-center py-1 cursor-pointer ${
            isProfile 
              ? 'text-[#e21e5b]' 
              : 'text-[#534344]/80 hover:text-[#e21e5b]'
          }`}
        >
          <div className="relative pointer-events-none">
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
          <span className={`text-[10px] mt-1 tracking-tight pointer-events-none ${isProfile ? 'font-bold text-[#e21e5b]' : 'font-medium text-[#534344]'}`}>
            Profile
          </span>
        </Link>

      </div>
    </div>
  );
}
