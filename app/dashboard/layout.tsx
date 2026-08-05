"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Heart, Bell, MessageSquare, ChevronDown, User, 
  Settings, CreditCard, LogOut, Edit3, Search, 
  LayoutDashboard, Menu, X, Star, Globe, BellRing 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isActivitiesExpanded, setIsActivitiesExpanded] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();

  // 🔒 Comprehensive Logout Handler (Clears Cookies, LocalStorage, and Cache)
  const handleLogoutAction = () => {
    // 1. Clear JWT Token and Profile Cookie by setting their expiry to the past
    document.cookie = "user_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "is_profile_completed=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // 2. Clear all browser local/session storage just in case
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }

    // 3. Redirect to login/home page
    router.push('/');

    // 4. Force hard reload to completely reset Next.js router cache & middleware state
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  // Sabhi menus ko band karne ka helper function
  const closeAll = () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    setIsNotificationOpen(false);
    setIsActivitiesExpanded(false);
  };

  // URL badalte hi state reset karna zaroori hai
  useEffect(() => {
    closeAll();
  }, [pathname]);

  const activityGroups = {
    myActivities: [
      { label: 'Interests Sent', path: '/dashboard/interests-sent' },
      { label: 'Profiles Viewed by Me', path: '/dashboard/profiles-viewed' },
      { label: 'Shortlisted by Me', path: '/dashboard/shortlisted-by-me' },
      { label: 'Gallery Requests Sent', path: '/dashboard/gallery-requests' },
    ],
    othersActivities: [
      { label: 'Interests Received', path: '/dashboard/interests-received' },
      { label: 'Who Viewed My Profile', path: '/dashboard/viewed-my-profile' },
      { label: 'Who Requested My Gallery', path: '/dashboard/gallery-requests-received' },
      { label: 'Who Shortlisted Me', path: '/dashboard/shortlisted-me' },
    ]
  };

  const notificationOptions = [
    { label: 'Interest Request', count: 5, path: '/dashboard/interest-request' },
    { label: 'Interest Accepted', count: 2, path: '/dashboard/interest-accepted' },
    { label: 'Photo Request', count: 8, path: '/dashboard/photo-request' },
    { label: 'Photo Request Accepted', count: 3, path: '/dashboard/photo-accepted' },
    { label: 'Who Viewed My Profile', count: 12, path: '/dashboard/viewed-profile' },
  ];

  return (
    <div className="min-h-screen bg-[#FDF2F5] text-slate-800 font-sans">
      
      {/* HEADER */}
      <header className="h-16 md:h-20 bg-white border-b border-pink-100 sticky top-0 z-[70] px-4 md:px-10 flex items-center justify-between shadow-sm">
        
        {/* Left: Mobile Menu & Logo */}
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-600 active:bg-pink-50 rounded-xl">
            <Menu size={24} />
          </button>
          <Link href="/dashboard" onClick={closeAll} className="flex items-center gap-2 cursor-pointer">
            <div className="bg-[#D2136E] p-1.5 rounded-lg shadow-md shadow-pink-100">
              <Heart fill="white" className="text-white" size={18} />
            </div>
            <span className="text-lg md:text-xl font-black text-[#D2136E] tracking-tighter uppercase italic">Pakiza Rishte</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 h-full">
          <Link href="/dashboard" onClick={closeAll} className={`text-xs font-black uppercase ${pathname === '/dashboard' ? 'text-[#D2136E]' : 'text-slate-400 hover:text-[#D2136E]'}`}>Home</Link>
          
          <div className="group h-full flex items-center relative">
            <button className="text-xs font-black uppercase text-slate-400 group-hover:text-[#D2136E] flex items-center gap-1 transition-all">
              Activities <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />
            </button>
            
            <div className="absolute top-[100%] left-[-150px] w-[550px] bg-white shadow-2xl rounded-b-[32px] border-t-2 border-[#D2136E] p-10 grid grid-cols-2 gap-10 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300">
              <div>
                <h5 className="text-[11px] font-black text-[#D2136E] uppercase tracking-[0.2em] mb-5">My Activities</h5>
                <ul className="space-y-4">
                  {activityGroups.myActivities.map((item, i) => (
                    <li key={i}>
                      <Link href={item.path} onClick={closeAll} className="text-sm font-bold text-slate-600 hover:text-[#D2136E] cursor-pointer transition-colors block">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-l border-gray-100 pl-10">
                <h5 className="text-[11px] font-black text-[#D2136E] uppercase tracking-[0.2em] mb-5">Others Activities</h5>
                <ul className="space-y-4">
                  {activityGroups.othersActivities.map((item, i) => (
                    <li key={i}>
                      <Link href={item.path} onClick={closeAll} className="text-sm font-bold text-slate-600 hover:text-[#D2136E] cursor-pointer transition-colors block">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <Link href="/dashboard/messages" onClick={closeAll} className="text-xs font-black uppercase text-slate-400 hover:text-[#D2136E]">Messages</Link>
          <Link href="/dashboard/find-match" onClick={closeAll} className="text-xs font-black uppercase text-slate-400 hover:text-[#D2136E]">Search</Link>
          <Link href="/dashboard/premium" onClick={closeAll} className="text-xs font-black uppercase text-[#D2136E] bg-pink-50 px-5 py-2.5 rounded-full border border-pink-100 font-bold">Go Premium</Link>
        </nav>

        {/* Right side: Desktop Icons */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/dashboard/messages" onClick={closeAll} className="p-2 text-slate-400 relative hover:text-[#D2136E] cursor-pointer">
            <MessageSquare size={22} />
          </Link>
          
          <div onClick={() => setIsNotificationOpen(true)} className="p-2 text-slate-400 relative hover:text-[#D2136E] cursor-pointer bg-pink-50/50 rounded-full transition-all">
            <Bell size={22} />
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#D2136E] text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white font-bold">18</span>
          </div>
          
          <div className="relative hidden lg:block group/profile">
            <div className="flex items-center gap-2 cursor-pointer p-1 bg-gray-50 rounded-full border border-transparent hover:border-pink-100 transition-all">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100" className="w-9 h-9 rounded-full border-2 border-[#D2136E] p-0.5" alt="Maazni" />
              <ChevronDown size={14} className="text-slate-400 group-hover/profile:rotate-180 transition-transform" />
            </div>
            {/* Profile Dropdown */}
            <div className="absolute right-0 mt-3 w-64 bg-white rounded-[28px] shadow-2xl border border-pink-50 p-2 opacity-0 pointer-events-none group-hover/profile:opacity-100 group-hover/profile:pointer-events-auto transition-all">
               <div className="p-4 border-b border-pink-50 mb-2">
                  <p className="font-black text-slate-800 text-sm italic">Maazni Sheikh</p>
                  <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mt-1">✓ Verified Account</p>
               </div>
               <div className="space-y-1">
                  <Link href="/dashboard/profile" onClick={closeAll} className="block p-3.5 text-[13px] font-bold text-slate-600 hover:bg-pink-50 rounded-2xl transition-all">View Profile</Link>
                  <Link href="/dashboard/profile/edit" onClick={closeAll} className="block p-3.5 text-[13px] font-bold text-slate-600 hover:bg-pink-50 rounded-2xl transition-all">Edit My Profile</Link>
                  <Link href="/dashboard/payment" onClick={closeAll} className="block p-3.5 text-[13px] font-bold text-slate-600 hover:bg-pink-50 rounded-2xl transition-all">Payment</Link>
                  <div className="h-px bg-gray-50 my-2 mx-2" />
                  <button 
                    onClick={() => { closeAll(); handleLogoutAction(); }} 
                    className="w-full text-left block p-3.5 text-[13px] font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                  >
                    Logout Account
                  </button>
               </div>
            </div>
          </div>
        </div>
      </header>

      {/* NOTIFICATION PANEL */}
      <AnimatePresence>
        {isNotificationOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeAll} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 bottom-0 w-full max-w-[360px] bg-white z-[110] shadow-2xl flex flex-col">
              <div className="p-6 border-b border-pink-50 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#D2136E] rounded-xl text-white shadow-lg shadow-pink-100"><BellRing size={20} /></div>
                  <h3 className="font-black text-slate-800 text-lg uppercase tracking-tighter italic">Notifications</h3>
                </div>
                <button onClick={closeAll} className="p-2 hover:bg-pink-50 rounded-full text-slate-400 transition-colors"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 pt-6 space-y-3">
                {notificationOptions.map((note, i) => (
                  <Link key={i} href={note.path} onClick={closeAll} className="flex items-center justify-between p-5 bg-white border border-pink-50 rounded-[28px] hover:border-[#D2136E] transition-all cursor-pointer group relative overflow-hidden block">
                    <span className="font-bold text-slate-700 text-[14px] z-10">{note.label}</span>
                    <div className="bg-red-500 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-lg shadow-red-100 z-10">{note.count}</div>
                    <div className="absolute inset-0 bg-pink-50/30 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MOBILE SIDEBAR */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeAll} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="fixed top-0 left-0 bottom-0 w-[85%] bg-white z-[100] shadow-2xl flex flex-col">
              <div className="p-6 flex justify-between items-center border-b border-pink-50">
                 <span className="font-black text-[#D2136E] text-xl tracking-tighter italic uppercase">Pakiza Rishte</span>
                 <button onClick={closeAll} className="p-2 bg-pink-50 rounded-full text-[#D2136E]"><X size={20}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 mt-4">
                <Link href="/dashboard" onClick={closeAll} className="block p-4 bg-pink-50 text-[#D2136E] font-black rounded-2xl">Home</Link>
                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                  <button onClick={() => setIsActivitiesExpanded(!isActivitiesExpanded)} className="w-full flex justify-between items-center p-4 font-bold text-slate-600">
                    Activities <ChevronDown size={18} className={`transition-transform ${isActivitiesExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {isActivitiesExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="bg-gray-50 px-6 py-2">
                       <div className="py-4 space-y-6">
                          <div>
                             <p className="text-[10px] font-black text-[#D2136E] uppercase mb-3">My Side</p>
                             <div className="space-y-4">
                                {activityGroups.myActivities.map((a, i) => <Link key={i} href={a.path} onClick={closeAll} className="block text-sm font-bold text-slate-500">{a.label}</Link>)}
                             </div>
                          </div>
                          <div className="pt-4 border-t border-gray-200">
                             <p className="text-[10px] font-black text-[#D2136E] uppercase mb-3">Others Side</p>
                             <div className="space-y-4">
                                {activityGroups.othersActivities.map((a, i) => <Link key={i} href={a.path} onClick={closeAll} className="block text-sm font-bold text-slate-500">{a.label}</Link>)}
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  )}
                </div>
                <Link href="/dashboard/messages" onClick={closeAll} className="block p-4 text-slate-600 font-bold border border-gray-100 rounded-2xl">Messages</Link>
                <Link href="/dashboard/find-match" onClick={closeAll} className="block p-4 text-slate-600 font-bold border border-gray-100 rounded-2xl">Search</Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto p-4 md:p-10 pb-32 lg:pb-10">{children}</main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-pink-100 px-8 py-3 flex justify-between items-center z-[80] shadow-2xl">
        <Link href="/dashboard" onClick={closeAll} className={`flex flex-col items-center gap-1 ${pathname === '/dashboard' ? 'text-[#D2136E]' : 'text-slate-300'}`}><LayoutDashboard size={24}/> <span className="text-[8px] font-black uppercase">Home</span></Link>
        <Link href="/dashboard/find-match" onClick={closeAll} className={`flex flex-col items-center gap-1 ${pathname === '/dashboard/find-match' ? 'text-[#D2136E]' : 'text-slate-300'}`}><Search size={24}/> <span className="text-[8px] font-black uppercase">Search</span></Link>
        <Link href="/dashboard/matches" onClick={closeAll} className={`flex flex-col items-center gap-1 ${pathname === '/dashboard/matches' ? 'text-[#D2136E]' : 'text-slate-300'}`}><Heart size={24}/> <span className="text-[8px] font-black uppercase">Matches</span></Link>
        <div onClick={() => setIsProfileOpen(true)} className="flex flex-col items-center gap-1 cursor-pointer">
          <div className={`w-7 h-7 rounded-full border-2 p-0.5 overflow-hidden ${isProfileOpen ? 'border-[#D2136E]' : 'border-slate-100'}`}>
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100" className="w-full h-full object-cover" alt="Me" />
          </div>
          <span className="text-[8px] font-black uppercase text-slate-300">Me</span>
        </div>
      </nav>

      {/* MOBILE PROFILE DRAWER */}
      <AnimatePresence>
        {isProfileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeAll} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 left-0 right-0 bg-white z-[120] rounded-t-[40px] p-8 pb-12 shadow-2xl">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
              <div className="flex items-center gap-4 mb-8">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100" className="w-16 h-16 rounded-full border-4 border-pink-50" alt="p" />
                <h3 className="text-xl font-black text-slate-800 italic">Maazni Sheikh</h3>
              </div>
              <div className="space-y-2">
                <Link href="/dashboard/profile" onClick={closeAll} className="flex items-center gap-4 p-4.5 bg-gray-50 rounded-2xl font-bold text-slate-700 text-sm block">
                  <User size={18} className="text-[#D2136E]" /> View My Profile
                </Link>
                <Link href="/dashboard/profile/edit" onClick={closeAll} className="flex items-center gap-4 p-4.5 bg-gray-50 rounded-2xl font-bold text-slate-700 text-sm block">
                  <Edit3 size={18} className="text-[#D2136E]" /> Edit My Profile
                </Link>
                <button 
                  onClick={() => { closeAll(); handleLogoutAction(); }} 
                  className="w-full flex items-center gap-4 p-4.5 text-red-600 font-bold bg-red-50 rounded-2xl mt-4"
                >
                  <LogOut size={18} /> Logout Account
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}