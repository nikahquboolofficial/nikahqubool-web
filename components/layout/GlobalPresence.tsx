"use client";

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSignalR, playMessageChime } from '@/context/SignalRContext';
import { MessageCircle, X, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getOptimizedImageUrl, DEFAULT_FEMALE_AVATAR } from '@/lib/imageUtils';
import { fetchProfileDetailsApi } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';

interface IncomingNotification {
  senderId: number;
  fullName: string;
  photoUrl: string;
  messageText: string;
}

export default function GlobalPresence() {
  const { isConnected } = useSignalR();
  const pathname = usePathname();
  const router = useRouter();

  const [activeBanner, setActiveBanner] = useState<IncomingNotification | null>(null);
  const [activeChatUserId, setActiveChatUserId] = useState<number | null>(null);
  const dismissTimerRef = useRef<any>(null);

  useEffect(() => {
    const handleActiveChatSelected = (e: any) => {
      setActiveChatUserId(e.detail?.activeReceiverId ?? null);
    };
    window.addEventListener('active_chat_selected', handleActiveChatSelected);
    return () => window.removeEventListener('active_chat_selected', handleActiveChatSelected);
  }, []);

  useEffect(() => {
    const handleGlobalMsg = async (e: any) => {
      const { senderId, messageText, senderName, senderPhoto } = e.detail || {};
      if (!senderId || !messageText) return;

      const currentActive = (typeof window !== "undefined" && (window as any).activeChatReceiverId) 
        ?? activeChatUserId;

      // 🎯 RULE: If the chat with THIS sender is currently open, DO NOT show notification banner
      if (currentActive && Number(currentActive) === Number(senderId)) {
        return;
      }

      // 🔔 If no chat is open, OR if another user's chat is open:
      // Play sound chime and show incoming message notification banner!
      playMessageChime();

      let resolvedName = senderName || '';
      let resolvedPhoto = senderPhoto || '';

      // 1. Try resolving name and avatar from cached chat inbox (0ms instant)
      if (!resolvedName || !resolvedPhoto) {
        try {
          const cached = sessionStorage.getItem('cached_chat_inbox');
          if (cached) {
            const list = JSON.parse(cached);
            if (Array.isArray(list)) {
              const found = list.find((c: any) => Number(c.userId ?? c.UserId) === Number(senderId));
              if (found) {
                resolvedName = resolvedName || found.fullName || found.FullName;
                resolvedPhoto = resolvedPhoto || found.photoUrl || found.PhotoUrl;
              }
            }
          }
        } catch (e) {}
      }

      // 2. Fallback: Fetch profile details in background if still missing
      if (!resolvedName) {
        const token = getAuthToken();
        if (token) {
          try {
            const pRes = await fetchProfileDetailsApi(Number(senderId), token);
            if (pRes?.success && pRes.data) {
              const profile = pRes.data.profile || pRes.data.Profile || pRes.data;
              resolvedName = profile.fullName || profile.FullName;
              resolvedPhoto = resolvedPhoto || profile.mainPhotoUrl || profile.photoUrl;
            }
          } catch (e) {}
        }
      }

      const bannerData: IncomingNotification = {
        senderId: Number(senderId),
        fullName: resolvedName || 'Member',
        photoUrl: resolvedPhoto || '',
        messageText
      };

      setActiveBanner(bannerData);

      // Auto-dismiss after 6 seconds
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => {
        setActiveBanner(null);
      }, 6000);
    };

    window.addEventListener("global_message_received", handleGlobalMsg);
    return () => {
      window.removeEventListener("global_message_received", handleGlobalMsg);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [activeChatUserId]);

  const handleOpenChat = () => {
    if (!activeBanner) return;
    const target = {
      userId: activeBanner.senderId,
      fullName: activeBanner.fullName,
      photoUrl: activeBanner.photoUrl
    };
    if (typeof window !== "undefined") {
      sessionStorage.setItem('active_chat_target', JSON.stringify(target));
      window.dispatchEvent(new CustomEvent('open_chat_direct', { detail: target }));
    }
    setActiveBanner(null);
    router.push('/dashboard/messages');
  };

  return (
    <AnimatePresence>
      {activeBanner && (
        <motion.div
          initial={{ opacity: 0, y: -80, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -70, scale: 0.94 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          onClick={handleOpenChat}
          className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-[99999] w-[95%] max-w-md cursor-pointer select-none"
        >
          <div className="bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 border-2 border-rose-200/90 shadow-[0_16px_45px_rgba(217,27,92,0.20)] hover:shadow-[0_20px_50px_rgba(217,27,92,0.25)] transition-all flex items-center gap-3 relative group overflow-hidden">
            
            {/* Top Micro Brand Header */}
            <div className="absolute top-1.5 left-4 right-4 flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1 text-[#d91b5c]">
                <MessageCircle size={10} className="fill-[#d91b5c]" />
                Nikah Qubool
              </span>
              <span>Just now</span>
            </div>

            {/* Left DP Avatar with Live Ring */}
            <div className="relative shrink-0 mt-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#d91b5c] shadow-sm bg-rose-50">
                <img 
                  src={activeBanner.photoUrl ? getOptimizedImageUrl(activeBanner.photoUrl) : DEFAULT_FEMALE_AVATAR}
                  alt={activeBanner.fullName}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = DEFAULT_FEMALE_AVATAR;
                  }}
                />
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs ring-1 ring-emerald-300" />
            </div>

            {/* Middle Message Text Details */}
            <div className="flex-1 min-w-0 pr-1 mt-3">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-tight truncate leading-tight">
                {activeBanner.fullName}
              </h4>
              <p className="text-xs font-semibold text-slate-600 line-clamp-1 mt-0.5 leading-snug">
                {activeBanner.messageText}
              </p>
            </div>

            {/* Right Action: WhatsApp-Style Reply Pill & Close Button */}
            <div className="shrink-0 flex items-center gap-1.5 mt-3">
              <div className="bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 group-hover:brightness-110 transition-all">
                <span>Reply</span>
                <ChevronRight size={12} className="stroke-[3]" />
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveBanner(null);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close notification"
              >
                <X size={15} />
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
