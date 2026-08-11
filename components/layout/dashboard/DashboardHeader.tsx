"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Bell, MessageSquare, ChevronDown, User, 
  LogOut, Edit3, Search, Menu, Crown, Sparkles, Eye, Bookmark,
  Heart, Send, Inbox, Lock, Flame, CheckCircle2
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

  // UNIQUE MATRIMONY CONNECTION GROUPS WITH DESCRIPTIONS
  const connectionGroups = {
    myProposals: [
      { label: 'Interests Expressed', desc: 'Profiles where you expressed interest', path: '/dashboard/interests-sent', icon: Send },
      { label: 'Saved Favorites', desc: 'Bookmarks saved for later review', path: '/dashboard/shortlisted-by-me', icon: Bookmark },
      { label: 'Photo Access Sent', desc: 'Private photo requests you made', path: '/dashboard/gallery-requests', icon: Lock },
      { label: 'Recently Viewed', desc: 'Profiles you recently inspected', path: '/dashboard/profiles-viewed', icon: Eye },
    ],
    receivedProposals: [
      { label: 'Incoming Interests', desc: 'Members looking to connect with you', path: '/dashboard/interests-received', icon: Inbox },
      { label: 'Photo Access Requests', desc: 'Members requesting your photo unlock', path: '/dashboard/gallery-requests-received', icon: Sparkles },
      { label: 'Profile Visitors', desc: 'Members who checked your profile', path: '/dashboard/viewed-my-profile', icon: Flame },
      { label: 'Saved By Members', desc: 'Members who bookmarked your profile', path: '/dashboard/shortlisted-me', icon: Heart },
    ]
  };

  return (
    <header className="h-16 md:h-20 bg-white/95 backdrop-blur-xl border-b-2 border-rose-100 sticky top-0 z-[100] px-4 md:px-8 flex items-center justify-between shadow-md shadow-rose-950/5 text-slate-900 selection:bg-[#870c3f] selection:text-white">
      
      {/* BRAND & MOBILE TOGGLE */}
      <div className="flex items-center gap-3">
        <button 
          type="button"
          onClick={onOpenMobileMenu} 
          className="lg:hidden p-2.5 text-slate-700 hover:text-[#870c3f] hover:bg-rose-50 rounded-2xl transition-all cursor-pointer border border-slate-200"
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

        <Link 
          href="/dashboard/find-match" 
          className={`text-xs font-black uppercase tracking-wider transition-all py-2 border-b-2 flex items-center gap-1.5 ${pathname.startsWith('/dashboard/find-match') ? 'text-[#870c3f] border-[#870c3f]' : 'text-slate-700 hover:text-[#870c3f] border-transparent'}`}
        >
          <Search size={16} className="text-amber-500" /> Find Matches
        </Link>

        {/* 🌟 UNIQUE RISHTA CONNECTIONS MEGA DROPDOWN */}
        <div className="group h-full flex items-center relative cursor-pointer">
          <button className="text-xs font-black uppercase tracking-wider text-slate-700 group-hover:text-[#870c3f] flex items-center gap-1.5 transition-colors py-4">
            Connections <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
          </button>
          
          <div className="absolute top-[100%] left-[-180px] pt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 z-[110]">
            <div className="w-[640px] bg-white shadow-2xl rounded-3xl border-t-4 border-[#870c3f] p-7 grid grid-cols-2 gap-6 border-2 border-rose-100 backdrop-blur-xl text-slate-800">
              
              {/* MY OUTBOUND ACTIVITIES */}
              <div>
                <h5 className="text-[11px] font-black text-[#870c3f] uppercase tracking-widest mb-4 flex items-center gap-2 border-b-2 border-slate-100 pb-2.5">
                  <Send size={15} /> My Expressed Interest
                </h5>
                <ul className="space-y-2">
                  {connectionGroups.myProposals.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <li key={i}>
                        <Link 
                          href={item.path} 
                          className="p-3 rounded-2xl hover:bg-rose-50/60 transition-all flex items-start gap-3 group/link block border border-transparent hover:border-rose-200"
                        >
                          <div className="p-2 rounded-xl bg-rose-50 text-[#870c3f] group-hover/link:bg-[#870c3f] group-hover/link:text-white border border-rose-200 transition-all shadow-xs">
                            <Icon size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-900 group-hover/link:text-[#870c3f] block uppercase">{item.label}</span>
                            <span className="text-[10px] font-bold text-slate-500 block">{item.desc}</span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* INBOUND RESPONSES */}
              <div className="border-l-2 border-slate-100 pl-6">
                <h5 className="text-[11px] font-black text-[#870c3f] uppercase tracking-widest mb-4 flex items-center gap-2 border-b-2 border-slate-100 pb-2.5">
                  <Inbox size={15} /> Responses To Me
                </h5>
                <ul className="space-y-2">
                  {connectionGroups.receivedProposals.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <li key={i}>
                        <Link 
                          href={item.path} 
                          className="p-3 rounded-2xl hover:bg-rose-50/60 transition-all flex items-start gap-3 group/link block border border-transparent hover:border-rose-200"
                        >
                          <div className="p-2 rounded-xl bg-rose-50 text-amber-600 group-hover/link:bg-[#870c3f] group-hover/link:text-white border border-rose-200 transition-all shadow-xs">
                            <Icon size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-900 group-hover/link:text-[#870c3f] block uppercase">{item.label}</span>
                            <span className="text-[10px] font-bold text-slate-500 block">{item.desc}</span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

            </div>
          </div>
        </div>

        <Link 
          href="/dashboard/messages" 
          className={`text-xs font-black uppercase tracking-wider transition-all py-2 border-b-2 ${pathname.startsWith('/dashboard/messages') ? 'text-[#870c3f] border-[#870c3f]' : 'text-slate-700 hover:text-[#870c3f] border-transparent'}`}
        >
          Messages
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
        
        {/* 🔔 100% DYNAMIC NOTIFICATION BELL BADGE */}
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
                  <Link href="/dashboard/profile" className="flex items-center gap-2.5 p-3 text-xs font-black text-slate-800 hover:bg-rose-50 hover:text-[#870c3f] rounded-xl transition-all"><User size={16} className="text-[#870c3f]" /> View My Profile</Link>
                  <Link href="/complete-profile" className="flex items-center gap-2.5 p-3 text-xs font-black text-slate-800 hover:bg-rose-50 hover:text-[#870c3f] rounded-xl transition-all"><Edit3 size={16} className="text-[#870c3f]" /> Edit My Profile</Link>
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