"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Bell, MessageSquare, ChevronDown, User, 
  LogOut, Edit3, Search, Menu, X, 
  BellRing, Heart, Crown, ShieldCheck, Sparkles, 
  Eye, Bookmark, Send, Inbox, Flame, Lock, ChevronRight, LayoutDashboard, CheckCircle2,
  ArrowLeft, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardHeader from '@/components/layout/dashboard/DashboardHeader';
import DashboardBottomNav from '@/components/layout/dashboard/DashboardBottomNav';
import { fetchDashboardApi, handleInteractionApiCall } from '@/lib/api';
import GlobalPresence from '@/components/layout/GlobalPresence';

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
  
  // 🔒 CONNECTIONS IS NOW CLOSED BY DEFAULT IN MOBILE MENU
  const [isConnectionsExpanded, setIsConnectionsExpanded] = useState(false);
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

  // 📱 MOBILE BOTTOM NAV VISIBILITY RULES: HIDDEN ON /profile, /membership, /find-match, AND ACTIVE MOBILE CHAT
  const isMobileBottomNavVisible = 
    pathname !== '/dashboard/profile' && 
    pathname !== '/dashboard/membership' && 
    !pathname.startsWith('/dashboard/find-match') &&
    !(pathname.startsWith('/dashboard/messages') && isChatOpenOnMobile);

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
    if (!token) return;

    const res = await fetchDashboardApi('best-matches', 1, token);
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
  }, [getToken]);

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

  const connectionGroups = {
    myProposals: [
      { key: 'interests-sent', label: 'Interests Expressed', desc: 'Profiles where you expressed interest', path: '/dashboard/interests-sent', icon: Send },
      { key: 'shortlisted-by-me', label: 'Saved Favorites', desc: 'Bookmarks saved for later review', path: '/dashboard/shortlisted-by-me', icon: Bookmark },
      { key: 'gallery-requests', label: 'Photo Access Sent', desc: 'Private photo requests you made', path: '/dashboard/gallery-requests', icon: Lock },
      { key: 'profiles-viewed', label: 'Recently Viewed', desc: 'Profiles you recently inspected', path: '/dashboard/profiles-viewed', icon: Eye },
    ],
    receivedProposals: [
      { key: 'interests-received', label: 'Incoming Interests', desc: 'Members looking to connect with you', path: '/dashboard/interests-received', icon: Inbox },
      { key: 'gallery-requests-received', label: 'Photo Access Requests', desc: 'Members requesting your photo unlock', path: '/dashboard/gallery-requests-received', icon: Sparkles },
      { key: 'viewed-my-profile', label: 'Profile Visitors', desc: 'Members who checked your profile', path: '/dashboard/viewed-my-profile', icon: Flame },
      { key: 'shortlisted-me', label: 'Saved By Members', desc: 'Members who bookmarked your profile', path: '/dashboard/shortlisted-me', icon: Heart },
    ]
  };

  const categoriesList = [
    { key: 'interests-received', label: 'Incoming Interests', desc: 'Members who sent you interest', count: readKeys['interests-received'] ? 0 : counts.requestsCount, path: '/dashboard/interests-received', icon: Inbox },
    { key: 'interests-accepted', label: 'Interests Accepted', desc: 'Members who accepted your interest', count: readKeys['interests-accepted'] ? 0 : counts.acceptedCount, path: '/dashboard/interests-sent', icon: CheckCircle2 },
    { key: 'gallery-requests-received', label: 'Photo Access Requests', desc: 'Requests to unlock your private photos', count: readKeys['gallery-requests-received'] ? 0 : counts.photosCount, path: '/dashboard/gallery-requests-received', icon: Sparkles },
    { key: 'viewed-my-profile', label: 'Profile Visitors', desc: 'Members who checked your profile', count: readKeys['viewed-my-profile'] ? 0 : counts.visitorsCount, path: '/dashboard/viewed-my-profile', icon: Flame },
  ];

  const activeCategoryObj = categoriesList.find((c) => c.key === selectedCategory);

  const filteredNotifications = useMemo(() => {
    if (!selectedCategory) return notificationsList;
    const matches = notificationsList.filter((item) => {
      if (item.category === selectedCategory || item.key === selectedCategory || item.type === selectedCategory) return true;
      const itemType = String(item.type || item.notificationType || item.interactionType || item.category || '').toUpperCase();
      const itemStatus = String(item.status || item.interactionStatus || '').toUpperCase();
      if (selectedCategory === 'interests-received') {
        if (itemStatus === 'ACCEPTED' || itemStatus === 'DECLINED') return false;
        return itemType.includes('INTEREST') || itemType.includes('PROPOSAL') || itemType.includes('REQUEST') || itemStatus === 'PENDING';
      }
      if (selectedCategory === 'interests-accepted') return itemType.includes('ACCEPT') || itemStatus === 'ACCEPTED' || itemType.includes('ACCEPTED');
      if (selectedCategory === 'gallery-requests-received') return itemType.includes('PHOTO') || itemType.includes('GALLERY') || itemType.includes('UNLOCK');
      if (selectedCategory === 'viewed-my-profile') return itemType.includes('VIEW') || itemType.includes('VISIT');
      return true;
    });
    return matches.length > 0 ? matches : notificationsList;
  }, [selectedCategory, notificationsList]);

  const unreadTotal = (readKeys['interests-received'] ? 0 : counts.requestsCount) 
    + (readKeys['interests-accepted'] ? 0 : counts.acceptedCount) 
    + (readKeys['gallery-requests-received'] ? 0 : counts.photosCount)
    + (readKeys['viewed-my-profile'] ? 0 : counts.visitorsCount);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-[#870c3f] selection:text-white">
      
      {/* 🟢 WEBSITE-WIDE REALTIME ONLINE PRESENCE */}
      <GlobalPresence />

      {/* 📌 TOP HEADER */}
      <div className={pathname.startsWith('/dashboard/messages') || pathname === '/dashboard/profile' ? 'hidden md:block' : 'block'}>
        <DashboardHeader 
          unreadCount={unreadTotal}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          handleLogout={handleLogout}
        />
      </div>

      {/* MAIN CANVAS */}
      <main className="flex-1 w-full pb-20 lg:pb-0">{children}</main>

      {/* MOBILE BOTTOM DOCK: Hidden on /profile, /membership, /find-match, and active chat */}
      {isMobileBottomNavVisible && (
        <DashboardBottomNav 
          unreadCount={unreadTotal}
          onOpenProfileDrawer={() => setIsProfileDrawerOpen(true)}
        />
      )}

      {/* NOTIFICATION DRAWER */}
      <AnimatePresence>
        {isNotificationOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeAll} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9990]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 220 }} className="fixed top-0 right-0 bottom-0 w-full max-w-[400px] bg-white z-[9999] shadow-2xl flex flex-col border-l-2 border-rose-100 text-slate-800">
              <div className="p-5 border-b-2 border-rose-100 flex items-center justify-between bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white sticky top-0 z-10 shadow-md">
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
                  <div className="text-[11px] font-black text-[#870c3f] uppercase tracking-widest px-1 mb-1">
                    Notification Activity
                  </div>
                  {categoriesList.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <div 
                        key={cat.key} 
                        onClick={() => {
                          markKeyAsRead(cat.key);
                          setSelectedCategory(cat.key);
                        }} 
                        className="flex items-center justify-between p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl hover:border-[#870c3f] hover:bg-rose-50/40 shadow-xs transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="p-2.5 rounded-xl bg-white border-2 border-slate-200 text-[#870c3f] group-hover:bg-[#870c3f] group-hover:text-white transition-all shadow-xs">
                            <Icon size={20} />
                          </div>
                          <div>
                            <span className="font-black text-slate-900 text-xs block group-hover:text-[#870c3f] uppercase tracking-tight">{cat.label}</span>
                            <span className="text-[10px] font-bold text-slate-500 block">{cat.desc}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {cat.count > 0 ? (
                            <span className="bg-[#870c3f] text-white text-[10px] font-black px-3 py-1 rounded-full shadow-xs">
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
                                <h4 className="text-xs font-black text-slate-900 hover:text-[#870c3f] line-clamp-1 uppercase">{senderName}</h4>
                                <p className="text-[10px] font-bold text-slate-500 line-clamp-1">{message}</p>
                                <span className="text-[9px] font-bold text-slate-400">
                                  {new Date(item.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {selectedCategory === 'interests-received' ? (
                                <>
                                  <button onClick={() => handleNotificationAction(senderId, 'INTEREST', 'ACCEPTED')} className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase shadow-xs transition-all cursor-pointer">ACCEPT</button>
                                  <button onClick={() => handleNotificationAction(senderId, 'INTEREST', 'DECLINED')} className="px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase shadow-xs transition-all cursor-pointer">REJECT</button>
                                </>
                              ) : selectedCategory === 'gallery-requests-received' ? (
                                <button onClick={() => handleNotificationAction(senderId, 'PHOTO_REQUEST', 'ACCEPTED')} className="px-3.5 py-1 rounded-full bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white text-[10px] font-black uppercase shadow-xs cursor-pointer hover:brightness-110 border border-rose-300/30">UNLOCK</button>
                              ) : (
                                <button onClick={() => handleViewUserProfile(senderId)} className="px-3.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-[#870c3f] text-[10px] font-black uppercase border border-rose-200 cursor-pointer">VIEW</button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="pt-4 border-t-2 border-slate-200">
                    <button onClick={() => { const path = activeCategoryObj?.path || '/dashboard'; closeAll(); router.push(path); }} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 cursor-pointer transition-all border border-rose-300/30">
                      <span>View All in Full Page</span>
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
                 <img src="/pakiza-rishte-website-logo-removebg-preview.png" alt="Pakiza Rishte" className="h-14 sm:h-16 w-auto object-contain" />
                 <button onClick={closeAll} className="p-2 bg-white rounded-full text-slate-700 border-2 border-slate-200 hover:bg-slate-100 cursor-pointer"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
                <Link href="/dashboard" onClick={closeAll} className="flex items-center gap-3 p-4 bg-slate-50 text-slate-900 font-black rounded-2xl text-xs uppercase tracking-wider border-2 border-slate-200 hover:border-rose-300">
                  <LayoutDashboard size={18} className="text-[#870c3f]" /> Dashboard
                </Link>
                <Link href="/dashboard/find-match" onClick={closeAll} className="flex items-center gap-3 p-4 text-slate-900 font-black border-2 border-slate-200 rounded-2xl text-xs uppercase tracking-wider hover:bg-rose-50/50 hover:border-rose-300">
                  <Search size={18} className="text-[#870c3f]" /> Find Matches
                </Link>
                <Link href="/dashboard/messages" onClick={closeAll} className="flex items-center gap-3 p-4 text-slate-900 font-black border-2 border-slate-200 rounded-2xl text-xs uppercase tracking-wider hover:bg-rose-50/50 hover:border-rose-300">
                  <MessageSquare size={18} className="text-[#870c3f]" /> Messages
                </Link>

                <div className="border-2 border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                  <button onClick={() => setIsConnectionsExpanded(!isConnectionsExpanded)} className="w-full flex justify-between items-center p-4 font-black text-slate-900 bg-slate-50 text-xs uppercase tracking-wider cursor-pointer border-b-2 border-slate-200">
                    <span className="flex items-center gap-2">
                      <Heart size={16} className="fill-[#870c3f] text-[#870c3f]" /> Connections
                    </span>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isConnectionsExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {isConnectionsExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="p-3 space-y-4 bg-white">
                       <div>
                          <p className="text-[10px] font-black text-[#870c3f] uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5 border-b-2 border-slate-100 pb-1">
                            <Send size={12} /> My Expressed Interest
                          </p>
                          <div className="space-y-1.5">
                             {connectionGroups.myProposals.map((item, i) => {
                               const Icon = item.icon;
                               return (
                                 <Link key={i} href={item.path} onClick={() => { markKeyAsRead(item.key); closeAll(); }} className="p-3 rounded-xl hover:bg-rose-50/50 transition-all flex items-center justify-between group/mitem block">
                                   <div className="flex items-center gap-3">
                                     <div className="p-2 rounded-lg bg-rose-50 text-[#870c3f] border border-rose-200"><Icon size={15} /></div>
                                     <div>
                                       <span className="text-xs font-black text-slate-900 block">{item.label}</span>
                                       <span className="text-[9px] font-bold text-slate-500 block">{item.desc}</span>
                                     </div>
                                   </div>
                                   <ChevronRight size={16} className="text-slate-400 group-hover/mitem:text-[#870c3f]" />
                                 </Link>
                               );
                             })}
                          </div>
                       </div>
                       <div className="pt-3 border-t-2 border-slate-100">
                          <p className="text-[10px] font-black text-[#870c3f] uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5 border-b-2 border-slate-100 pb-1">
                            <Inbox size={12} /> Responses To Me
                          </p>
                          <div className="space-y-1.5">
                             {connectionGroups.receivedProposals.map((item, i) => {
                               const Icon = item.icon;
                               return (
                                 <Link key={i} href={item.path} onClick={() => { markKeyAsRead(item.key); closeAll(); }} className="p-3 rounded-xl hover:bg-rose-50/50 transition-all flex items-center justify-between group/mitem block">
                                   <div className="flex items-center gap-3">
                                     <div className="p-2 rounded-lg bg-rose-50 text-amber-600 border border-rose-200"><Icon size={15} /></div>
                                     <div>
                                       <span className="text-xs font-black text-slate-900 block">{item.label}</span>
                                       <span className="text-[9px] font-bold text-slate-500 block">{item.desc}</span>
                                     </div>
                                   </div>
                                   <ChevronRight size={16} className="text-slate-400 group-hover/mitem:text-[#870c3f]" />
                                 </Link>
                               );
                             })}
                          </div>
                       </div>
                    </motion.div>
                  )}
                </div>

                <Link href="/dashboard/membership" onClick={closeAll} className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-rose-900/20 border border-rose-300/30">
                  <Crown size={18} className="text-amber-300 fill-amber-300" /> Upgrade VIP Membership
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MOBILE PROFILE DRAWER */}
      <AnimatePresence>
        {isProfileDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeAll} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9990]" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 220 }} className="fixed bottom-0 left-0 right-0 bg-white z-[9999] rounded-t-[36px] p-6 pb-12 shadow-2xl border-t-2 border-rose-100 text-slate-800">
              <div className="w-14 h-1.5 bg-slate-300 rounded-full mx-auto mb-5" />
              <div className="flex items-center gap-3.5 mb-5 p-4 bg-slate-50 rounded-2xl border-2 border-slate-200">
                <div className="w-12 h-12 rounded-full border-2 border-[#870c3f] bg-white flex items-center justify-center shadow-xs">
                  <User size={24} className="text-[#870c3f]" />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-extrabold text-slate-900 uppercase">My Account</h3>
                  <span className="text-[10px] font-black text-emerald-700 uppercase flex items-center gap-1">
                    <CheckCircle2 size={13} /> Verified Member
                  </span>
                </div>
              </div>
              <div className="space-y-2.5">
                <Link href="/dashboard/profile" onClick={closeAll} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl font-black text-slate-800 text-xs uppercase tracking-wider block border-2 border-slate-200 hover:border-rose-300">
                  <User size={18} className="text-[#870c3f]" /> View My Profile
                </Link>
                <Link href="/complete-profile" onClick={closeAll} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl font-black text-slate-800 text-xs uppercase tracking-wider block border-2 border-slate-200 hover:border-rose-300">
                  <Edit3 size={18} className="text-[#870c3f]" /> Edit My Profile
                </Link>
                <Link href="/dashboard/membership" onClick={closeAll} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl font-black text-slate-800 text-xs uppercase tracking-wider block border-2 border-slate-200 hover:border-rose-300">
                  <Crown size={18} className="text-amber-500" /> Upgrade VIP Membership
                </Link>
                <button onClick={() => { closeAll(); handleLogout(); }} className="w-full flex items-center gap-3 p-4 text-rose-700 font-black bg-rose-50 rounded-2xl mt-3 text-xs uppercase tracking-wider border-2 border-rose-200 cursor-pointer">
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-[#870c3f] font-black text-xs uppercase tracking-widest">
        Loading Dashboard...
      </div>
    }>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}