"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Search, MessageSquare, User, Sparkles } from 'lucide-react';

interface BottomNavProps {
  unreadCount?: number;
  onOpenProfileDrawer: () => void;
}

export default function DashboardBottomNav({ unreadCount = 0, onOpenProfileDrawer }: BottomNavProps) {
  const pathname = usePathname();

  const isHome = pathname === '/dashboard';
  const isSearch = pathname.startsWith('/dashboard/find-match');
  const isChat = pathname.startsWith('/dashboard/messages');

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-[9995] bg-white/98 backdrop-blur-xl border-t-2 border-rose-100 shadow-[0_-8px_25px_rgba(0,0,0,0.08)]">
      <nav className="w-full px-2 py-2 flex justify-around items-center max-w-lg mx-auto">
        
        {/* HOME */}
        <Link 
          href="/dashboard" 
          className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl transition-all duration-300 ${
            isHome 
              ? 'bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white shadow-md shadow-rose-950/20 scale-105 border border-rose-300/30' 
              : 'text-slate-600 font-extrabold hover:text-[#870c3f]'
          }`}
        >
          <LayoutDashboard size={20} className={isHome ? 'text-amber-300' : 'text-[#870c3f]'} /> 
          <span className="text-[9px] uppercase tracking-wider font-black mt-1">Home</span>
        </Link>

        {/* SEARCH */}
        <Link 
          href="/dashboard/find-match" 
          className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl transition-all duration-300 ${
            isSearch 
              ? 'bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white shadow-md shadow-rose-950/20 scale-105 border border-rose-300/30' 
              : 'text-slate-600 font-extrabold hover:text-[#870c3f]'
          }`}
        >
          <Search size={20} className={isSearch ? 'text-amber-300' : 'text-[#870c3f]'} /> 
          <span className="text-[9px] uppercase tracking-wider font-black mt-1">Search</span>
        </Link>

        {/* CHAT */}
        <Link 
          href="/dashboard/messages" 
          className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl transition-all duration-300 ${
            isChat 
              ? 'bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white shadow-md shadow-rose-950/20 scale-105 border border-rose-300/30' 
              : 'text-slate-600 font-extrabold hover:text-[#870c3f]'
          }`}
        >
          <MessageSquare size={20} className={isChat ? 'text-amber-300' : 'text-[#870c3f]'} /> 
          <span className="text-[9px] uppercase tracking-wider font-black mt-1">Chat</span>
        </Link>

        {/* PROFILE "ME" DRAWER TRIGGER WITH UNREAD BADGE */}
        <button 
          type="button"
          onClick={onOpenProfileDrawer} 
          className="flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl text-slate-600 font-extrabold hover:text-[#870c3f] cursor-pointer relative"
        >
          <div className="w-6.5 h-6.5 rounded-full border-2 border-[#870c3f] p-0.5 flex items-center justify-center relative bg-rose-50 shadow-xs">
            <User size={14} className="text-[#870c3f]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#870c3f] rounded-full border-2 border-white animate-pulse" />
            )}
          </div>
          <span className="text-[9px] uppercase tracking-wider font-black mt-1">Me</span>
        </button>

      </nav>
    </div>
  );
}