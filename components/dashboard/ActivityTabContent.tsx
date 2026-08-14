"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, RefreshCw, Sparkles, ArrowLeft, Crown, 
  Send, Inbox, Bookmark, Heart, Lock, Eye, Flame 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { fetchDashboardApi, handleInteractionApiCall } from '@/lib/api';
import ProfileCard from '@/components/dashboard/ProfileCard';
import SubscriptionModal from '@/components/dashboard/SubscriptionModal';

export type IconType = 'send' | 'inbox' | 'bookmark' | 'heart' | 'lock' | 'sparkles' | 'eye' | 'flame';

interface ActivityTabContentProps {
  activeTab: string;
  title: string;
  subtitle: string;
  iconName: IconType;
}

const iconMap: Record<IconType, React.ElementType> = {
  send: Send,
  inbox: Inbox,
  bookmark: Bookmark,
  heart: Heart,
  lock: Lock,
  sparkles: Sparkles,
  eye: Eye,
  flame: Flame,
};

interface FlyingHeart {
  id: number;
  x: number;
  y: number;
}

export default function ActivityTabContent({ 
  activeTab, 
  title, 
  subtitle, 
  iconName 
}: ActivityTabContentProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [actionState, setActionState] = useState<{ [key: number]: boolean }>({});
  
  // 💖 FLYING HEARTS ANIMATION STATE
  const [flyingHearts, setFlyingHearts] = useState<FlyingHeart[]>([]);

  const HeaderIcon = iconMap[iconName] || Sparkles;

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

  const loadData = useCallback(async (pageNum: number, append: boolean = false) => {
    const token = getToken();
    if (!token) {
      router.push('/');
      return;
    }

    if (pageNum === 1) setLoading(true);
    else setFetchingMore(true);

    const res = await fetchDashboardApi(activeTab, pageNum, token);

    if (res.isUnauthorized) {
      toast.dismiss();
      toast.error("Session expired.");
      router.push('/');
      return;
    }

    if (res.success && res.data) {
      const list = res.data.profiles || res.data.Profiles || [];
      if (list.length > 0 && list[0].totalRecords) {
        setTotalRecords(list[0].totalRecords);
      } else {
        setTotalRecords(list.length);
      }

      if (append) {
        setProfiles((prev) => [...prev, ...list]);
      } else {
        setProfiles(list);
      }

      setHasMore(list.length >= 12);
    } else {
      toast.error(res.message || "Failed to load activity profiles.");
    }

    setLoading(false);
    setFetchingMore(false);
  }, [activeTab, getToken, router]);

  useEffect(() => {
    setPage(1);
    loadData(1, false);
  }, [loadData]);

  const handleLoadMore = () => {
    if (!hasMore || fetchingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadData(nextPage, true);
  };

  const triggerFlyingHearts = () => {
    const newHearts: FlyingHeart[] = Array.from({ length: 7 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 160,
      y: (Math.random() - 0.5) * 40,
    }));
    setFlyingHearts(prev => [...prev, ...newHearts]);

    setTimeout(() => {
      setFlyingHearts(prev => prev.filter(h => !newHearts.some(nh => nh.id === h.id)));
    }, 1800);
  };

  const handleInteraction = async (receiverUserId: number, type: string, status: string = 'PENDING') => {
    const token = getToken();

    if (type === 'INTEREST') {
      triggerFlyingHearts();
    }

    setProfiles((prevProfiles) =>
      prevProfiles.map((p) => {
        if (p.userId === receiverUserId) {
          if (type === 'SHORTLIST') {
            const currentIsShort = Boolean(p.isShortlisted ?? p.IsShortlisted);
            return { ...p, isShortlisted: !currentIsShort, IsShortlisted: !currentIsShort };
          }
          if (type === 'INTEREST') {
            const newStatus = status === 'ACCEPTED' ? 'Accepted' : status === 'DECLINED' ? 'Declined' : 'SentPending';
            return { ...p, interestStatus: newStatus, InterestStatus: newStatus };
          }
          if (type === 'PHOTO_REQUEST') {
            if (status === 'ACCEPTED') {
              return { 
                ...p, 
                photoRequestStatus: 'ACCEPTED', 
                isPhotoApproved: true, 
                isPhotoHidden: false, 
                isPhotoRequestReceived: false 
              };
            }
            if (status === 'DECLINED') {
              return { 
                ...p, 
                photoRequestStatus: 'DECLINED', 
                isPhotoApproved: false, 
                isPhotoRequestReceived: false 
              };
            }
            return { ...p, hasRequestedPhoto: true, HasRequestedPhoto: true, photoRequestStatus: 'PENDING' };
          }
        }
        return p;
      })
    );

    setActionState((prev) => ({ ...prev, [receiverUserId]: true }));
    const res = await handleInteractionApiCall(receiverUserId, type, status, token);
    setActionState((prev) => ({ ...prev, [receiverUserId]: false }));

    if (res.success) {
      toast.dismiss();
      toast.success(res.message || "Action updated instantly");
    } else {
      toast.dismiss();
      toast.error(res.message || "Action failed");
      loadData(1, false);
    }
  };

  const handleViewProfile = (userId: number) => {
    const token = getToken();
    sessionStorage.setItem("viewing_profile_target", JSON.stringify({ userId }));
    if (token) {
      handleInteractionApiCall(userId, 'VISIT', 'PENDING', token).catch(() => {});
    }
    router.push('/dashboard/profile');
  };

  const handleInitiateChat = (profile: any) => {
    let isPaid = Boolean(profile.isCurrentUserPaid ?? profile.IsCurrentUserPaid);
    if (!isPaid && typeof window !== "undefined") {
      const stored = localStorage.getItem("user_details") || localStorage.getItem("user_session");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          isPaid = Boolean(parsed.isPaid ?? parsed.IsPaid ?? parsed.isCurrentUserPaid ?? parsed.IsCurrentUserPaid);
        } catch (e) {}
      }
    }

    if (isPaid) {
      sessionStorage.setItem('active_chat_target', JSON.stringify({
        userId: profile.userId || profile.UserId,
        fullName: profile.fullName || profile.FullName,
        photoUrl: profile.photoUrl || profile.mainPhotoUrl || profile.PhotoUrl || ''
      }));
      router.push('/dashboard/messages');
    } else {
      setShowSubscriptionModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-28 pt-4 relative selection:bg-[#870c3f] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      {/* 💖 FLOATING HEARTS ANIMATION OVERLAY */}
      <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
        <AnimatePresence>
          {flyingHearts.map((heart) => (
            <motion.div
              key={heart.id}
              initial={{ opacity: 1, y: '75vh', x: `calc(50vw + ${heart.x}px)`, scale: 0.6, rotate: 0 }}
              animate={{ 
                opacity: [1, 1, 0], 
                y: '15vh', 
                x: `calc(50vw + ${heart.x * 1.8}px)`, 
                scale: [0.6, 1.4, 1.8],
                rotate: [0, -15, 15, 0]
              }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              className="absolute text-rose-500 drop-shadow-[0_4px_10px_rgba(135,12,63,0.5)]"
            >
              <Heart size={36} className="fill-[#870c3f] text-[#870c3f]" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* PAGE HEADER */}
        <div className="bg-white rounded-3xl p-6 border-2 border-rose-100 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button onClick={() => router.back()} className="p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-[#870c3f] border-2 border-rose-200 transition-all cursor-pointer shadow-xs">
              <ArrowLeft size={20} />
            </button>
            <div className="p-3.5 bg-gradient-to-tr from-[#870c3f] to-[#9e0f4a] text-white rounded-2xl shadow-md border border-rose-300/30">
              <HeaderIcon size={24} className="text-amber-300" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-serif font-extrabold uppercase text-slate-900 tracking-tight">{title}</h1>
              <p className="text-xs font-semibold text-slate-500">{subtitle}</p>
            </div>
          </div>
          <div className="px-5 py-2 rounded-full bg-rose-50 border-2 border-rose-200 text-[#870c3f] font-black text-xs uppercase tracking-wider self-start sm:self-auto shadow-xs">
            Total {totalRecords} Profiles
          </div>
        </div>

        {/* PROFILES GRID */}
        {loading ? (
          <div className="min-h-[420px] flex flex-col items-center justify-center text-[#870c3f]">
            <Loader2 size={48} className="animate-spin mb-3 text-[#870c3f]" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Fetching {title}...</span>
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-rose-100 shadow-xl max-w-md mx-auto space-y-4">
            <div className="w-18 h-18 rounded-full bg-rose-50 border-2 border-rose-200 text-[#870c3f] flex items-center justify-center mx-auto shadow-xs">
              <Sparkles size={36} className="text-amber-500" />
            </div>
            <h3 className="text-lg font-serif font-extrabold text-slate-900 uppercase">No Activity Found</h3>
            <p className="text-slate-500 text-xs font-semibold max-w-xs mx-auto leading-relaxed">
              There are currently no profiles under {title}.
            </p>
            <button onClick={() => router.push('/dashboard')} className="px-7 py-3 rounded-full bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-rose-900/20 border border-rose-300/30">
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.userId}
                profile={profile}
                activeTab={activeTab}
                actionLoading={actionState[profile.userId] || false}
                onInteraction={handleInteraction}
                onViewProfile={handleViewProfile}
                onInitiateChat={handleInitiateChat}
              />
            ))}
          </div>
        )}

        {/* LOAD MORE BUTTON */}
        {!loading && hasMore && (
          <div className="text-center pt-6">
            <button onClick={handleLoadMore} disabled={fetchingMore} className="px-9 py-3.5 rounded-full bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 text-white border border-rose-300/30 font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-900/20 active:scale-95 transition-all flex items-center gap-2.5 mx-auto cursor-pointer">
              {fetchingMore ? <Loader2 size={18} className="animate-spin text-amber-300" /> : <RefreshCw size={18} className="text-amber-300" />}
              <span>Load More Profiles</span>
            </button>
          </div>
        )}

      </div>

      {/* SUBSCRIPTION MODAL */}
      <SubscriptionModal 
        isOpen={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)} 
      />
    </div>
  );
}