"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Search, MessageSquare, User, HeartHandshake } from 'lucide-react';

interface BottomNavProps {
  unreadCount?: number;
  onOpenProfileDrawer?: () => void;
}

export default function DashboardBottomNav({ unreadCount = 0 }: BottomNavProps) {
  const pathname = usePathname();
  const [userPhoto, setUserPhoto] = useState<string>('/placeholder.png');

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user_details");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const photo = parsed.photoUrl || parsed.PhotoUrl || parsed.mainPhotoUrl || '/placeholder.png';
          setUserPhoto(photo);
        } catch (e) {}
      }
    }
  }, []);

  const isHome = pathname === '/dashboard';
  const isActivity = pathname.startsWith('/dashboard/activity');
  const isSearch = pathname.startsWith('/dashboard/find-match');
  const isChat = pathname.startsWith('/dashboard/messages');
  const isProfile = pathname.startsWith('/dashboard/my-profile') || pathname.startsWith('/dashboard/gallery');

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-[9995] bg-white/98 backdrop-blur-xl border-t-2 border-rose-100 shadow-[0_-8px_25px_rgba(0,0,0,0.08)]">
      <nav className="w-full px-2 py-2 flex justify-around items-center max-w-lg mx-auto">
        
        {/* 1. FOR YOU / HOME */}
        <Link 
          href="/dashboard" 
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-300 ${
            isHome 
              ? 'bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white shadow-md scale-105 border border-rose-300/30' 
              : 'text-slate-600 font-extrabold hover:text-[#870c3f]'
          }`}
        >
          <LayoutDashboard size={19} className={isHome ? 'text-amber-300' : 'text-[#870c3f]'} /> 
          <span className="text-[9px] uppercase tracking-wider font-black mt-1">For You</span>
        </Link>

        {/* 2. ACTIVITY */}
        <Link 
          href="/dashboard/activity" 
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-300 ${
            isActivity 
              ? 'bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white shadow-md scale-105 border border-rose-300/30' 
              : 'text-slate-600 font-extrabold hover:text-[#870c3f]'
          }`}
        >
          <HeartHandshake size={19} className={isActivity ? 'text-amber-300' : 'text-[#870c3f]'} /> 
          <span className="text-[9px] uppercase tracking-wider font-black mt-1">Activity</span>
        </Link>

        {/* 3. SEARCH */}
        <Link 
          href="/dashboard/find-match" 
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-300 ${
            isSearch 
              ? 'bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white shadow-md scale-105 border border-rose-300/30' 
              : 'text-slate-600 font-extrabold hover:text-[#870c3f]'
          }`}
        >
          <Search size={19} className={isSearch ? 'text-amber-300' : 'text-[#870c3f]'} /> 
          <span className="text-[9px] uppercase tracking-wider font-black mt-1">Search</span>
        </Link>

        {/* 4. CHATS */}
        <Link 
          href="/dashboard/messages" 
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-300 ${
            isChat 
              ? 'bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white shadow-md scale-105 border border-rose-300/30' 
              : 'text-slate-600 font-extrabold hover:text-[#870c3f]'
          }`}
        >
          <MessageSquare size={19} className={isChat ? 'text-amber-300' : 'text-[#870c3f]'} /> 
          <span className="text-[9px] uppercase tracking-wider font-black mt-1">Chats</span>
        </Link>

        {/* 5. PROFILE (MATCHING SCREENSHOT 1 & 3 - DIRECT ROUTE TO /dashboard/my-profile) */}
        <Link 
          href="/dashboard/my-profile" 
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-300 ${
            isProfile 
              ? 'bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white shadow-md scale-105 border border-rose-300/30' 
              : 'text-slate-600 font-extrabold hover:text-[#870c3f]'
          }`}
        >
          <div className="w-5.5 h-5.5 rounded-full border-2 border-[#870c3f] overflow-hidden bg-white flex items-center justify-center shadow-xs">
            <img src={userPhoto} alt="Me" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} />
          </div>
          <span className="text-[9px] uppercase tracking-wider font-black mt-1">Profile</span>
        </Link>

      </nav>
    </div>
  );
}