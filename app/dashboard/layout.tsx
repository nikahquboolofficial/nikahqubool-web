"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Bell, MessageSquare, ChevronDown, User, 
  LogOut, Edit3, Search, X, 
  BellRing, Heart, Crown, Sparkles, 
  Eye, Bookmark, Send, Inbox, Flame, ChevronRight, LayoutDashboard, CheckCircle2,
  ArrowLeft, ExternalLink, HeartHandshake, Lock, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardHeader from '@/components/layout/dashboard/DashboardHeader';
import DashboardBottomNav from '@/components/layout/dashboard/DashboardBottomNav';
import { fetchDashboardApi, handleInteractionApiCall } from '@/lib/api';
import GlobalPresence from '@/components/layout/GlobalPresence';
import { SignalRProvider } from '@/context/SignalRContext';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // 💬 MOBILE CHAT STATE
  const [isChatOpenOnMobile, setIsChatOpenOnMobile] = useState(false);

  useEffect(() => {
    const handleChatStateChange = (e: any) => {
      setIsChatOpenOnMobile(Boolean(e.detail?.isChatOpen));
    };
    window.addEventListener('chat_view_changed', handleChatStateChange);
    return () => window.removeEventListener('chat_view_changed', handleChatStateChange);
  }, []);

  useEffect(() => {
    if (!pathname.startsWith('/dashboard/messages')) {
      setIsChatOpenOnMobile(false);
    }
  }, [pathname]);

  // 🚪 LOGOUT FUNCTION
  const handleLogout = useCallback(() => {
    document.cookie = "user_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }
    router.push('/');
  }, [router]);

  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // 🔔 NOTIFICATION DRAWER STATE
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [readKeys, setReadKeys] = useState<{ [key: string]: boolean }>({});
  
  const [counts, setCounts] = useState({
    requestsCount: 0,
    acceptedCount: 0,
    photosCount: 0,
    visitorsCount: 0,
    matchesCount: 0,
    shortlistedCount: 0
  });

  // 📱 MOBILE BOTTOM NAV & MAIN HEADER VISIBILITY RULES
  const isMobileBottomNavVisible = 
    pathname === '/dashboard' ||
    pathname === '/dashboard/activity' ||
    pathname === '/dashboard/find-match' ||
    pathname === '/dashboard/interests-received' ||
    pathname === '/dashboard/interests-sent' ||
    pathname === '/dashboard/viewed-my-profile' ||
    pathname === '/dashboard/profiles-viewed' ||
    pathname === '/dashboard/shortlisted-by-me' ||
    pathname === '/dashboard/shortlisted-me' ||
    pathname === '/dashboard/my-profile' ||
    (pathname.startsWith('/dashboard/messages') && !isChatOpenOnMobile);

  const isMainHeaderVisibleOnMobile = 
    (pathname === '/dashboard' ||
    pathname === '/dashboard/activity' ||
    pathname === '/dashboard/find-match' ||
    pathname === '/dashboard/interests-received' ||
    pathname === '/dashboard/interests-sent' ||
    pathname === '/dashboard/viewed-my-profile' ||
    pathname === '/dashboard/profiles-viewed' ||
    pathname === '/dashboard/shortlisted-by-me' ||
    pathname === '/dashboard/shortlisted-me') &&
    !pathname.startsWith('/dashboard/messages') &&
    (pathname as string) !== '/dashboard/my-profile';

  const isStandaloneBackVisibleOnMobile = 
    !isMobileBottomNavVisible && 
    !pathname.startsWith('/dashboard/messages') &&
    !pathname.startsWith('/dashboard/profile') &&
    !pathname.startsWith('/dashboard/edit-profile') &&
    !pathname.startsWith('/dashboard/gallery') &&
    !pathname.startsWith('/dashboard/settings') &&
    !pathname.startsWith('/dashboard/membership') &&
    !pathname.startsWith('/dashboard/payment-info') &&
    !pathname.startsWith('/dashboard/support') &&
    pathname !== '/dashboard/my-profile';

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('read_notifications');
      if (saved) setReadKeys(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const markKeyAsRead = (key: string) => {
    setReadKeys((prev) => {
      const updated = { ...prev, [key]: true };
      try {
        sessionStorage.setItem('read_notifications', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const val = parts.pop()?.split(';').shift();
      return val ?? null;
    }
    return null;
  };

  const getToken = useCallback((): string | null => getCookie("user_token"), []);

  const loadNotificationCounts = useCallback(async () => {
    const token = getToken();
    if (!token) {
      handleLogout();
      return;
    }

    const res = await fetchDashboardApi('best-matches', 1, token);
    if (res.isUnauthorized) {
      handleLogout();
      return;
    }
    if (res.success && res.data) {
      const c = res.data.counts || res.data.Counts || {};
      let notes = res.data.notifications || res.data.Notifications || res.data.recentNotifications || [];
      
      if (notes && !Array.isArray(notes) && typeof notes === 'object') {
        notes = Object.values(notes).flat();
      }

      setNotificationsList(Array.isArray(notes) ? notes : []);
      setCounts({
        requestsCount: c.requestsCount || c.RequestsCount || 0,
        acceptedCount: c.acceptedCount || c.AcceptedCount || 0,
        photosCount: c.photosCount || c.PhotosCount || 0,
        visitorsCount: c.visitorsCount || c.VisitorsCount || 0,
        matchesCount: c.matchesCount || c.MatchesCount || 0,
        shortlistedCount: c.shortlistedCount || c.ShortlistedCount || 0,
      });
    }
  }, [getToken, handleLogout]);

  useEffect(() => {
    loadNotificationCounts();
  }, [pathname, loadNotificationCounts]);

  const handleNotificationAction = async (senderUserId: number, type: string, status: string) => {
    const token = getToken();
    if (!senderUserId) return;
    await handleInteractionApiCall(senderUserId, type, status, token);
    loadNotificationCounts();
  };

  const handleViewUserProfile = (userId: number) => {
    if (!userId) return;
    sessionStorage.setItem("viewing_profile_target", JSON.stringify({ userId }));
    closeAll();
    router.push('/dashboard/profile');
  };

  const closeAll = useCallback(() => {
    setIsProfileDrawerOpen(false);
    setIsMobileMenuOpen(false);
    setIsNotificationOpen(false);
    setSelectedCategory(null);
  }, []);

  useEffect(() => {
    closeAll();
  }, [pathname, closeAll]);

  // 🔔 4 NOTIFICATION CATEGORIES
  const categoriesList = [
    { key: 'interests-requests', label: 'Interest Requests', desc: 'Incoming proposal requests', count: readKeys['interests-requests'] ? 0 : counts.requestsCount, path: '/dashboard/activity?cat=interests&tab=requests', icon: Inbox },
    { key: 'interests-accepted', label: 'Interest Accepted', desc: 'Members who accepted your proposal', count: readKeys['interests-accepted'] ? 0 : counts.acceptedCount, path: '/dashboard/activity?cat=interests&tab=accepted', icon: CheckCircle2 },
    { key: 'photo-requests', label: 'Photo Request', desc: 'Requests to view your private photos', count: readKeys['photo-requests'] ? 0 : counts.photosCount, path: '/dashboard/activity?cat=gallery&tab=gallery-requests-received', icon: Lock },
    { key: 'other-visitors', label: 'Other Notifications', desc: 'Profile visitors and updates', count: readKeys['other-visitors'] ? 0 : counts.visitorsCount, path: '/dashboard/activity?cat=visitors&tab=visitors', icon: Flame },
  ];

  const activeCategoryObj = categoriesList.find((c) => c.key === selectedCategory);

  const filteredNotifications = useMemo(() => {
    if (!selectedCategory) return notificationsList;
    const matches = notificationsList.filter((item) => {
      if (item.category === selectedCategory || item.key === selectedCategory || item.type === selectedCategory) return true;
      const itemType = String(item.type || item.notificationType || item.interactionType || item.category || '').toUpperCase();
      const itemStatus = String(item.status || item.interactionStatus || '').toUpperCase();
      if (selectedCategory === 'interests-requests') {
        if (itemStatus === 'ACCEPTED' || itemStatus === 'DECLINED') return false;
        return itemType.includes('INTEREST') || itemType.includes('PROPOSAL') || itemType.includes('REQUEST') || itemStatus === 'PENDING';
      }
      if (selectedCategory === 'interests-accepted') return itemType.includes('ACCEPT') || itemStatus === 'ACCEPTED' || itemType.includes('ACCEPTED');
      if (selectedCategory === 'photo-requests') return itemType.includes('PHOTO') || itemType.includes('GALLERY') || itemType.includes('UNLOCK');
      if (selectedCategory === 'other-visitors') return itemType.includes('VIEW') || itemType.includes('VISIT');
      return true;
    });
    return matches.length > 0 ? matches : notificationsList;
  }, [selectedCategory, notificationsList]);

  // TOTAL UNREAD NOTIFICATIONS COUNT ACROSS ALL CATEGORIES
  const unreadTotal = (readKeys['interests-requests'] ? 0 : counts.requestsCount) 
    + (readKeys['interests-accepted'] ? 0 : counts.acceptedCount) 
    + (readKeys['photo-requests'] ? 0 : counts.photosCount)
    + (readKeys['other-visitors'] ? 0 : counts.visitorsCount);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-[#d91b5c] selection:text-white">
      
      {/* 🟢 WEBSITE-WIDE REALTIME ONLINE PRESENCE */}
      <GlobalPresence />

      {/* 📌 TOP MAIN HEADER (VISIBLE ON DESKTOP & ON MAIN TABS MOBILE) */}
      <div className={isMainHeaderVisibleOnMobile ? 'block' : 'hidden lg:block'}>
        <DashboardHeader 
          unreadCount={unreadTotal}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          handleLogout={handleLogout}
        />
      </div>

      {/* 📌 STANDALONE MOBILE BACK BUTTON ONLY (FOR SUBPAGES WHERE BOTTOM NAV & MAIN HEADER ARE HIDDEN) */}
      {isStandaloneBackVisibleOnMobile && (
        <div className="lg:hidden sticky top-0 z-[100] bg-white/95 backdrop-blur-xl border-b-2 border-rose-100 px-4 py-3 flex items-center shadow-xs">
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="p-2 -ml-2 rounded-full text-[#d91b5c] hover:bg-rose-50 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
            aria-label="Back"
            title="Go Back"
          >
            <ArrowLeft size={22} className="stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* MAIN CANVAS */}
      <main className={(pathname.startsWith('/dashboard/edit-profile') || pathname.startsWith('/dashboard/messages')) ? "flex-1 w-full p-0 m-0 overflow-hidden" : "flex-1 w-full pb-20 lg:pb-0"}>{children}</main>

      {/* MOBILE BOTTOM DOCK */}
      {isMobileBottomNavVisible && (
        <DashboardBottomNav 
          unreadCount={unreadTotal}
        />
      )}

      {/* NOTIFICATION DRAWER */}
      <AnimatePresence>
        {isNotificationOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeAll} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9990]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 220 }} className="fixed top-0 right-0 bottom-0 w-full max-w-[400px] bg-white z-[9999] shadow-2xl flex flex-col border-l-2 border-rose-100 text-slate-800">
              <div className="p-5 border-b-2 border-rose-100 flex items-center justify-between bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] text-white sticky top-0 z-10 shadow-md">
                <div className="flex items-center gap-3">
                  {selectedCategory ? (
                    <button onClick={() => setSelectedCategory(null)} className="p-1.5 rounded-full hover:bg-white/20 text-white transition-all cursor-pointer">
                      <ArrowLeft size={20} />
                    </button>
                  ) : (
                    <div className="p-2 bg-white/20 rounded-xl text-white">
                      <BellRing size={20} className="text-amber-300" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-serif font-extrabold text-xs uppercase tracking-wider">
                      {selectedCategory ? activeCategoryObj?.label : 'Live Notifications'}
                    </h3>
                    <p className="text-[10px] text-rose-100 font-bold">
                      {selectedCategory ? activeCategoryObj?.desc : 'Real-time Member Activity'}
                    </p>
                  </div>
                </div>
                <button onClick={closeAll} className="p-1.5 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer">
                  <X size={20}/>
                </button>
              </div>

              {!selectedCategory ? (
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  <div className="text-[11px] font-black text-[#d91b5c] uppercase tracking-widest px-1 mb-1">
                    Notification Categories
                  </div>
                  {categoriesList.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <div 
                        key={cat.key} 
                        onClick={() => {
                          markKeyAsRead(cat.key);
                          setSelectedCategory(cat.key);
                          closeAll();
                          router.push(cat.path);
                        }} 
                        className="flex items-center justify-between p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl hover:border-[#d91b5c] hover:bg-rose-50/40 shadow-xs transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="p-2.5 rounded-xl bg-white border-2 border-slate-200 text-[#d91b5c] group-hover:bg-[#d91b5c] group-hover:text-white transition-all shadow-xs">
                            <Icon size={20} />
                          </div>
                          <div>
                            <span className="font-black text-slate-900 text-xs block group-hover:text-[#d91b5c] uppercase tracking-tight">{cat.label}</span>
                            <span className="text-[10px] font-bold text-slate-500 block">{cat.desc}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {cat.count > 0 ? (
                            <span className="bg-[#d91b5c] text-white text-[10px] font-black px-3 py-1 rounded-full shadow-xs">
                              {cat.count} New
                            </span>
                          ) : (
                            <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-slate-300">0</span>
                          )}
                          <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto flex flex-col justify-between p-5 bg-slate-50">
                  <div className="space-y-3">
                    {filteredNotifications.length === 0 ? (
                      <div className="text-center py-14 space-y-3">
                        <Sparkles size={36} className="text-amber-500 mx-auto" />
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider">No new notifications in this category</p>
                      </div>
                    ) : (
                      filteredNotifications.map((item, idx) => {
                        const senderId = item.senderUserId || item.userId || item.fromUserId || item.id;
                        const senderName = item.senderName || item.userName || item.name || item.fullName || 'Member';
                        const senderPhoto = item.senderPhoto || item.userPhoto || item.photo || item.profilePhoto || '/placeholder.png';
                        const message = item.notificationMessage || item.message || item.text || item.title || 'Interaction update';

                        return (
                          <div key={idx} className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-xs flex items-center justify-between gap-3 hover:border-rose-300 transition-all">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleViewUserProfile(senderId)}>
                              <img src={senderPhoto} alt={senderName} className="w-11 h-11 rounded-full object-cover border-2 border-rose-100 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} />
                              <div>
                                <h4 className="text-xs font-black text-slate-900 hover:text-[#d91b5c] line-clamp-1 uppercase">{senderName}</h4>
                                <p className="text-[10px] font-bold text-slate-500 line-clamp-1">{message}</p>
                                <span className="text-[9px] font-bold text-slate-400">
                                  {new Date(item.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {selectedCategory === 'interests-requests' ? (
                                <>
                                  <button onClick={() => handleNotificationAction(senderId, 'INTEREST', 'ACCEPTED')} className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase shadow-xs transition-all cursor-pointer">ACCEPT</button>
                                  <button onClick={() => handleNotificationAction(senderId, 'INTEREST', 'DECLINED')} className="px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase shadow-xs transition-all cursor-pointer">REJECT</button>
                                </>
                              ) : selectedCategory === 'photo-requests' ? (
                                <button onClick={() => handleNotificationAction(senderId, 'PHOTO_REQUEST', 'ACCEPTED')} className="px-3.5 py-1 rounded-full bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] text-white text-[10px] font-black uppercase shadow-xs cursor-pointer hover:brightness-110 border border-rose-300/30">UNLOCK</button>
                              ) : (
                                <button onClick={() => handleViewUserProfile(senderId)} className="px-3.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-[#d91b5c] text-[10px] font-black uppercase border border-rose-200 cursor-pointer">VIEW</button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="pt-4 border-t-2 border-slate-200">
                    <button onClick={() => { const path = activeCategoryObj?.path || '/dashboard/activity'; closeAll(); router.push(path); }} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] hover:brightness-110 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 cursor-pointer transition-all border border-rose-300/30">
                      <span>View Activity Section</span>
                      <ExternalLink size={15} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MOBILE MENU DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeAll} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9990]" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: "spring", damping: 25, stiffness: 220 }} className="fixed top-0 left-0 bottom-0 w-[88%] max-w-sm bg-white z-[9999] shadow-2xl flex flex-col border-r-2 border-rose-100 text-slate-800">
              <div className="p-4 flex justify-between items-center border-b-2 border-rose-100 bg-slate-50">
                 <img src="/logo.png" alt="Nikah Qubool" className="h-12 sm:h-14 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).src = '/logo.jpg'; }} />
                 <button onClick={closeAll} className="p-2 bg-white rounded-full text-slate-700 border-2 border-slate-200 hover:bg-slate-100 cursor-pointer"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
                <Link href="/dashboard" onClick={closeAll} className="flex items-center gap-3 p-4 bg-slate-50 text-slate-900 font-black rounded-2xl text-xs uppercase tracking-wider border-2 border-slate-200 hover:border-rose-300">
                  <LayoutDashboard size={18} className="text-[#d91b5c]" /> For You / Dashboard
                </Link>
                <Link href="/dashboard/activity" onClick={closeAll} className="flex items-center gap-3 p-4 bg-slate-50 text-slate-900 font-black rounded-2xl text-xs uppercase tracking-wider border-2 border-slate-200 hover:border-rose-300">
                  <HeartHandshake size={18} className="text-[#d91b5c]" /> Activity Center
                </Link>
                <Link href="/dashboard/find-match" onClick={closeAll} className="flex items-center gap-3 p-4 text-slate-900 font-black border-2 border-slate-200 rounded-2xl text-xs uppercase tracking-wider hover:bg-rose-50/50 hover:border-rose-300">
                  <Search size={18} className="text-[#d91b5c]" /> Find Matches
                </Link>
                <Link href="/dashboard/messages" onClick={closeAll} className="flex items-center gap-3 p-4 text-slate-900 font-black border-2 border-slate-200 rounded-2xl text-xs uppercase tracking-wider hover:bg-rose-50/50 hover:border-rose-300">
                  <MessageSquare size={18} className="text-[#d91b5c]" /> Messages
                </Link>
                <Link href="/dashboard/my-profile" onClick={closeAll} className="flex items-center gap-3 p-4 text-slate-900 font-black border-2 border-slate-200 rounded-2xl text-xs uppercase tracking-wider hover:bg-rose-50/50 hover:border-rose-300">
                  <User size={18} className="text-[#d91b5c]" /> My Profile
                </Link>
                <Link href="/dashboard/settings" onClick={closeAll} className="flex items-center gap-3 p-4 text-slate-900 font-black border-2 border-slate-200 rounded-2xl text-xs uppercase tracking-wider hover:bg-rose-50/50 hover:border-rose-300">
                  <Settings size={18} className="text-[#d91b5c]" /> Account Settings & Deactivate
                </Link>

                <Link href="/dashboard/membership" onClick={closeAll} className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] hover:brightness-110 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-rose-900/20 border border-rose-300/30">
                  <Crown size={18} className="text-amber-300 fill-amber-300" /> Upgrade VIP Membership
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SignalRProvider>
      <Suspense fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-[#d91b5c] font-black text-xs uppercase tracking-widest">
          Loading Dashboard...
        </div>
      }>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </Suspense>
    </SignalRProvider>
  );
}
