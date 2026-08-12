"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Bell, MessageSquare, ChevronDown, User, 
  LogOut, Edit3, Search, Menu, Crown, CheckCircle2, HeartHandshake, Settings
} from 'lucide-react';

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

  return (
    <header className="h-16 md:h-20 bg-white/95 backdrop-blur-xl border-b-2 border-rose-100 sticky top-0 z-[100] px-4 md:px-8 flex items-center justify-between shadow-md shadow-rose-950/5 text-slate-900 selection:bg-[#870c3f] selection:text-white">
      
      {/* BRAND LOGO: PAKIZA RISHTE ON LEFT */}
      <div className="flex items-center gap-3">
        <button 
          type="button"
          onClick={onOpenMobileMenu} 
          className="lg:hidden p-2 text-slate-700 hover:text-[#870c3f] hover:bg-rose-50 rounded-2xl transition-all cursor-pointer border border-slate-200"
          aria-label="Open Navigation Menu"
        >
          <Menu size={22} />
        </button>

        <Link href="/dashboard" className="flex items-center py-1 group">
          <img 
            src="/pakiza-rishte-website-logo-removebg-preview.png" 
            alt="Pakiza Rishte" 
            className="h-12 sm:h-16 md:h-18 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
          />
        </Link>
      </div>

      {/* DESKTOP HIGH-END NAVIGATION */}
      <nav className="hidden lg:flex items-center gap-8 h-full">
        <Link 
          href="/dashboard" 
          className={`text-xs font-black uppercase tracking-wider transition-all py-2 border-b-2 ${pathname === '/dashboard' ? 'text-[#870c3f] border-[#870c3f]' : 'text-slate-700 hover:text-[#870c3f] border-transparent'}`}
        >
          Dashboard
        </Link>

        {/* ACTIVITY CENTER LINK */}
        <Link 
          href="/dashboard/activity" 
          className={`text-xs font-black uppercase tracking-wider transition-all py-2 border-b-2 flex items-center gap-1.5 ${pathname.startsWith('/dashboard/activity') ? 'text-[#870c3f] border-[#870c3f]' : 'text-slate-700 hover:text-[#870c3f] border-transparent'}`}
        >
          <HeartHandshake size={16} className="text-[#870c3f]" /> Activity
        </Link>

        <Link 
          href="/dashboard/find-match" 
          className={`text-xs font-black uppercase tracking-wider transition-all py-2 border-b-2 flex items-center gap-1.5 ${pathname.startsWith('/dashboard/find-match') ? 'text-[#870c3f] border-[#870c3f]' : 'text-slate-700 hover:text-[#870c3f] border-transparent'}`}
        >
          <Search size={16} className="text-amber-500" /> Find Matches
        </Link>

        <Link 
          href="/dashboard/messages" 
          className={`text-xs font-black uppercase tracking-wider transition-all py-2 border-b-2 ${pathname.startsWith('/dashboard/messages') ? 'text-[#870c3f] border-[#870c3f]' : 'text-slate-700 hover:text-[#870c3f] border-transparent'}`}
        >
          Messages
        </Link>

        <Link 
          href="/dashboard/my-profile" 
          className={`text-xs font-black uppercase tracking-wider transition-all py-2 border-b-2 ${pathname.startsWith('/dashboard/my-profile') ? 'text-[#870c3f] border-[#870c3f]' : 'text-slate-700 hover:text-[#870c3f] border-transparent'}`}
        >
          My Profile
        </Link>

        <Link 
          href="/dashboard/membership" 
          className="text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 px-6 py-3 rounded-full border border-rose-300/30 transition-all shadow-md shadow-rose-900/20 flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          <Crown size={16} className="text-amber-300 fill-amber-300" /> Upgrade VIP
        </Link>
      </nav>

      {/* RIGHT SIDE QUICK ACTION BAR */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        <Link 
          href="/dashboard/messages" 
          className="p-2.5 text-slate-700 hover:text-[#870c3f] hover:bg-rose-50 rounded-full transition-all cursor-pointer border border-slate-200 bg-slate-50"
          aria-label="Direct Messages"
        >
          <MessageSquare size={20} />
        </Link>
        
        {/* 🔔 NOTIFICATION BELL BADGE SHOWING TOTAL UNREAD COUNT */}
        <button 
          type="button"
          onClick={onOpenNotifications} 
          className="p-2.5 text-slate-700 hover:text-[#870c3f] hover:bg-rose-50 rounded-full transition-all cursor-pointer relative border border-slate-200 bg-slate-50"
          aria-label="Live Activity Feed"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-[#870c3f] text-white text-[9px] flex items-center justify-center rounded-full font-black animate-pulse shadow-md border border-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* PROFILE ACCOUNT QUICK OVERLAY */}
        <div className="relative hidden lg:block group/profile">
          <div className="flex items-center gap-2 cursor-pointer p-1.5 rounded-full border-2 border-slate-200 hover:border-rose-300 transition-all bg-slate-50">
            <div className="w-8 h-8 rounded-full border-2 border-[#870c3f] overflow-hidden bg-white flex items-center justify-center shadow-xs">
              <User size={18} className="text-[#870c3f]" />
            </div>
            <ChevronDown size={14} className="text-slate-500 group-hover/profile:rotate-180 transition-transform" />
          </div>
          
          <div className="absolute right-0 top-full pt-2 opacity-0 pointer-events-none group-hover/profile:opacity-100 group-hover/profile:pointer-events-auto transition-all duration-200 z-[110]">
            <div className="w-64 bg-white rounded-3xl shadow-2xl border-2 border-rose-100 p-3 text-slate-800">
               <div className="p-3 border-b-2 border-slate-100 mb-1 bg-slate-50 rounded-2xl">
                  <p className="font-serif font-extrabold text-slate-900 text-xs uppercase">My Account</p>
                  <span className="text-[10px] font-black text-emerald-700 uppercase flex items-center gap-1 mt-0.5">
                    <CheckCircle2 size={13} /> Verified Member
                  </span>
               </div>
               <div className="space-y-1">
                  <Link href="/dashboard/my-profile" className="flex items-center gap-2.5 p-3 text-xs font-black text-slate-800 hover:bg-rose-50 hover:text-[#870c3f] rounded-xl transition-all"><User size={16} className="text-[#870c3f]" /> My Profile</Link>
                  <Link href="/complete-profile" className="flex items-center gap-2.5 p-3 text-xs font-black text-slate-800 hover:bg-rose-50 hover:text-[#870c3f] rounded-xl transition-all"><Edit3 size={16} className="text-[#870c3f]" /> Edit Profile</Link>
                  <Link href="/dashboard/settings" className="flex items-center gap-2.5 p-3 text-xs font-black text-slate-800 hover:bg-rose-50 hover:text-[#870c3f] rounded-xl transition-all"><Settings size={16} className="text-[#870c3f]" /> Account Settings</Link>
                  <Link href="/dashboard/membership" className="flex items-center gap-2.5 p-3 text-xs font-black text-slate-800 hover:bg-rose-50 hover:text-[#870c3f] rounded-xl transition-all"><Crown size={16} className="text-amber-500" /> My Plan & Balance</Link>
                  <div className="h-0.5 bg-slate-100 my-1 mx-2" />
                  <button type="button" onClick={handleLogout} className="w-full text-left flex items-center gap-2.5 p-3 text-xs font-black text-rose-700 hover:bg-rose-50 rounded-xl cursor-pointer transition-all"><LogOut size={16} /> Logout Account</button>
               </div>
            </div>
          </div>
        </div>
      </div>

    </header>
  );
}