"use client";

import { ProfileStatusIcons } from '@/components/common/ProfileBadges';

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Crown,
  Send, ArrowLeft, ChevronLeft, MoreVertical, CheckCheck, Heart, 
  ShieldAlert, UserX, Smile, ChevronDown, Loader2, 
  CheckCircle2, ShieldCheck, Sparkles, MessageCircle, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSignalR, playMessageChime } from '@/context/SignalRContext';
import { 
  fetchChatHistoryApi, 
  sendChatMessageApi, 
  markChatReadApi, 
  fetchBlockStatusApi, 
  blockUserApiCall, 
  handleInteractionApiCall,
  formatLastSeen,
  fetchProfileDetailsApi
} from '@/lib/api';
import { getOptimizedImageUrl, DEFAULT_FEMALE_AVATAR } from '@/lib/imageUtils';
import { getAuthToken } from '@/lib/auth';
import { toast } from 'sonner';

// 🌟 MULTI-CATEGORY EXPANDED EMOJIS (Islamic Greetings, Love, Expressions, Gestures)
const EMOJI_CATEGORIES = {
  "Nikah & Pure": ["🌸", "🤲", "💍", "🌹", "🤍", "✨", "🕊️", "🌙", "🕌", "💐", "💖", "❤️"],
  "Smilies": ["😊", "😍", "🥰", "😇", "😌", "😃", "😂", "🤗", "😉", "🤩", "😎", "🥺"],
  "Gestures": ["👍", "🙏", "🤝", "👌", "👏", "🙌", "👋", "🎉", "🔥", "💯", "⭐", "💫"]
};

// ⚡ In-Memory Cache to guarantee 0ms instant display and zero message disappearance
const globalChatHistoryCache: Record<string, any[]> = {};

// 🛡️ High-Precision UTC to Local Indian Time Parser
export const parseChatUtcDate = (dateVal: any): Date => {
  if (!dateVal) return new Date();
  if (typeof dateVal === 'object' && dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? new Date() : dateVal;
  }
  try {
    let str = String(dateVal).trim();
    if (!str) return new Date();
    if (/^\d{10,13}$/.test(str)) {
      const num = Number(str);
      const d = new Date(num < 10000000000 ? num * 1000 : num);
      if (!isNaN(d.getTime())) return d;
    }
    // If it already contains 'Z' or timezone offset (+05:30, etc.), parse as standard ISO
    if (/Z$/i.test(str) || /[+-]\d{2}:?\d{2}$/.test(str)) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) return d;
    }
    // Backend API & SQL Server send UTC timestamps without trailing 'Z' (e.g. 2026-11-05T06:32:00)
    // Appending 'Z' tells JavaScript the timestamp is in UTC, allowing accurate conversion to local IST (+5:30)
    const isoUtc = str.replace(' ', 'T') + 'Z';
    const dUtc = new Date(isoUtc);
    if (!isNaN(dUtc.getTime())) return dUtc;

    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date() : d;
  } catch {
    return new Date();
  }
};

export default function ChatWindow({ 
  receiverId, 
  userName, 
  photoUrl, 
  initialIsOnline, 
  initialLastSeen, 
  initialAccountState,
  onBack 
}: any) {
  const router = useRouter();
  const getToken = (): string | null => getAuthToken();
  const { connection, onlineUsers, typingUsers, sendTyping } = useSignalR();

  const [msg, setMsg] = useState("");
  // ⚡ Synchronously initialize from in-memory cache or sessionStorage (Zero Blank Glitch)
  const [messages, setMessages] = useState<any[]>(() => {
    if (receiverId && globalChatHistoryCache[String(receiverId)]?.length) {
      return globalChatHistoryCache[String(receiverId)];
    }
    if (typeof window !== "undefined" && receiverId) {
      try {
        const cached = sessionStorage.getItem(`cached_chat_history_${receiverId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const initial = parsed.map((m: any) => ({
              ...m,
              timestamp: parseChatUtcDate(m.timestamp)
            }));
            globalChatHistoryCache[String(receiverId)] = initial;
            return initial;
          }
        }
      } catch (e) {}
    }
    return [];
  });
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>("Nikah & Pure");
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const isSendingRef = useRef(false);
  const lastSentTextRef = useRef<string>("");
  const lastSentTimeRef = useRef<number>(0);

  const [blockStatus, setBlockStatus] = useState<{
    isBlockedByMe: boolean;
    isBlockedByOther: boolean;
    isTargetDeleted?: boolean;
    isTargetDeactivated?: boolean;
    isTargetAdminBlocked?: boolean;
    targetAccountState?: string;
  }>({ 
    isBlockedByMe: false, 
    isBlockedByOther: false 
  });

  const [proposalState, setProposalState] = useState<'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED'>('NONE');
  const [proposalLoading, setProposalLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🛡️ Resolve User Identity Defensively
  const [resolvedName, setResolvedName] = useState<string>(userName || '');
  const [resolvedPhoto, setResolvedPhoto] = useState<string>(photoUrl || '');
  const [targetProfile, setTargetProfile] = useState<any>(null);

  useEffect(() => {
    if (userName) setResolvedName(userName);
    if (photoUrl) setResolvedPhoto(photoUrl);
  }, [userName, photoUrl]);

  useEffect(() => {
    if (!receiverId) return;
    if (resolvedName && resolvedName !== 'Member' && resolvedPhoto) return;

    // Check inbox cache first (0ms)
    try {
      const inboxRaw = sessionStorage.getItem('cached_chat_inbox');
      if (inboxRaw) {
        const list = JSON.parse(inboxRaw);
        if (Array.isArray(list)) {
          const found = list.find((c: any) => (c.userId ?? c.UserId) === Number(receiverId));
          if (found) {
            if (!resolvedName || resolvedName === 'Member') {
              setResolvedName(found.fullName || found.FullName || 'Member');
            }
            if (!resolvedPhoto) {
              setResolvedPhoto(found.photoUrl || found.PhotoUrl || '');
            }
            setTargetProfile(found);
            return;
          }
        }
      }
    } catch (e) {}

    // Fallback: fetch profile details
    const token = getToken();
    if (token) {
      fetchProfileDetailsApi(Number(receiverId), token).then((res) => {
        if (res.success && res.data) {
          const p = res.data.profile || res.data.Profile || res.data;
          const freshName = p.fullName || p.FullName;
          const freshPhoto = p.mainPhotoUrl || p.photoUrl || p.PhotoUrl;
          if (freshName) setResolvedName(freshName);
          if (freshPhoto) setResolvedPhoto(freshPhoto);
          setTargetProfile(p);
        }
      }).catch(() => {});
    }
  }, [receiverId, resolvedName, resolvedPhoto]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamic Presence Status (From Ultra-Fast In-Memory SignalR Store)
  const currentPresence = onlineUsers[Number(receiverId)];
  const isOnline = currentPresence ? Boolean(currentPresence.isOnline) : Boolean(initialIsOnline);
  const lastSeenTime = currentPresence ? currentPresence.lastSeen : (initialLastSeen ?? null);

  const stateStr = String(initialAccountState || blockStatus.targetAccountState || '').toLowerCase();

  const isDeletedUser = Boolean(
    resolvedName === "Deleted User" || 
    (resolvedName && String(resolvedName).toLowerCase().includes("deleted")) ||
    stateStr.includes("del") ||
    blockStatus.isTargetDeleted
  );

  const isDeactiveUser = !isDeletedUser && Boolean(
    resolvedName === "Deactivated User" ||
    (resolvedName && String(resolvedName).toLowerCase().includes("deactivated")) ||
    stateStr.includes("deact") ||
    stateStr.includes("pause") ||
    blockStatus.isTargetDeactivated
  );

  const isAdminBlockedUser = !isDeletedUser && !isDeactiveUser && Boolean(
    resolvedName === "User Unavailable" ||
    stateStr.includes("admin") ||
    blockStatus.isTargetAdminBlocked
  );

  const handleViewProfile = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDeletedUser || isDeactiveUser || isAdminBlockedUser) return;
    if (inputRef.current) inputRef.current.blur();
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (typeof window !== "undefined") {
      sessionStorage.setItem('last_browse_page', '/dashboard/messages');
      sessionStorage.setItem("viewing_profile_target", JSON.stringify({ 
        userId: Number(receiverId),
        targetUserId: Number(receiverId)
      }));
    }
    router.push('/dashboard/profile?userId=' + receiverId);
  };

  const parseUtcDate = parseChatUtcDate;

  // 📥 FETCH CHAT HISTORY DEFENSIVELY (0ms CACHE HYDRATION + AUTO-RETRY + SMART MERGE)
  useEffect(() => {
    if (!receiverId) return;
    const token = getToken();
    if (!token) return;

    // ⚡ 1. 0ms Instant Hydration from Session Cache & Memory Cache
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem(`cached_chat_history_${receiverId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const list = parsed.map((m: any) => ({
              ...m,
              timestamp: parseUtcDate(m.timestamp)
            }));
            globalChatHistoryCache[String(receiverId)] = list;
            setMessages(list);
          }
        }
      } catch (e) {}
    }

    let isMounted = true;

    const fetchHistoryWithRetry = async (attempt = 1): Promise<any[]> => {
      try {
        const res = await fetchChatHistoryApi(receiverId, 1, 100, token);
        const rawData = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);
        if (rawData.length > 0 || attempt >= 2) {
          return rawData;
        }
      } catch (e) {}

      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 600));
        return fetchHistoryWithRetry(attempt + 1);
      }
      return [];
    };

    const loadData = async () => {
      setLoading(true);
      const rawData = await fetchHistoryWithRetry();

      if (isMounted && rawData.length > 0) {
        const formatted = rawData.map((m: any, idx: number) => ({
          uniqueKey: `hist-${m.messageId ?? m.MessageId ?? idx}`,
          messageId: m.messageId ?? m.MessageId,
          senderId: m.senderId ?? m.SenderId, 
          text: m.messageText ?? m.MessageText ?? m.text ?? m.Text ?? m.message ?? m.Message ?? "", 
          timestamp: parseUtcDate(m.sentAt ?? m.SentAt ?? Date.now()),
          isRead: (m.isRead === 1 || m.isRead === true || m.IsRead === 1 || m.IsRead === true) ? 1 : 0
        }));

        setMessages(prev => {
          // formatted is authoritative from server
          const merged = [...formatted];

          // Only keep genuine recent in-flight pending messages that haven't landed yet
          prev.forEach(p => {
            const isTemp = String(p.messageId).startsWith('temp-') || String(p.uniqueKey).startsWith('temp-');
            const exists = merged.some(m => {
              if (m.messageId && String(m.messageId) === String(p.messageId)) return true;
              if (m.uniqueKey && m.uniqueKey === p.uniqueKey) return true;
              if (isTemp && m.text === p.text && (p.senderId === 'me' || String(m.senderId) !== String(receiverId))) return true;
              return false;
            });

            if (!exists && isTemp && (p.isPending || p.isError)) {
              const age = Date.now() - new Date(p.timestamp).getTime();
              if (age < 30000) {
                merged.push(p);
              }
            }
          });

          // Deduplicate by messageId or uniqueKey
          const seen = new Set();
          const cleanMerged: any[] = [];
          for (const m of merged) {
            const key = m.messageId ? `id-${m.messageId}` : m.uniqueKey;
            if (!seen.has(key)) {
              seen.add(key);
              cleanMerged.push(m);
            }
          }

          cleanMerged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

          globalChatHistoryCache[String(receiverId)] = cleanMerged;
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem(`cached_chat_history_${receiverId}`, JSON.stringify(cleanMerged));
            } catch (e) {}
          }

          return cleanMerged;
        });

        scrollToBottom("auto");
      }

      try {
        const blockRes = await fetchBlockStatusApi(receiverId, token);
        if (isMounted && blockRes?.success && blockRes.data) {
          const bData = blockRes.data ?? {};
          setBlockStatus({
            isBlockedByMe: Boolean(bData.isBlockedByMe ?? bData.IsBlockedByMe),
            isBlockedByOther: Boolean(bData.isBlockedByOther ?? bData.IsBlockedByOther),
            isTargetDeleted: Boolean(bData.isTargetDeleted ?? bData.IsTargetDeleted),
            isTargetDeactivated: Boolean(bData.isTargetDeactivated ?? bData.IsTargetDeactivated),
            isTargetAdminBlocked: Boolean(bData.isTargetAdminBlocked ?? bData.IsTargetAdminBlocked),
            targetAccountState: bData.targetAccountState ?? bData.TargetAccountState ?? 'Active'
          });
        }
      } catch {}

      if (isMounted) setLoading(false);
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [receiverId]);

  // 🔔 REAL-TIME LIVE MESSAGE RECEPTION (DIRECT SIGNALR + GLOBAL EVENT BUS)
  useEffect(() => {
    if (!receiverId) return;

    const appendIncoming = (senderId: any, rId: any, messageText: string, msgId?: any, sentAt?: string) => {
      const incomingSenderId = Number(senderId);
      const targetId = Number(receiverId);
      if (incomingSenderId === targetId) {
        const newMsgId = msgId ?? Date.now();
        setMessages(prev => {
          if (prev.some(m => m.messageId === newMsgId)) return prev;
          const updated = [...prev, { 
            uniqueKey: `sig-${newMsgId}-${Math.random().toString(36).substring(2, 7)}`,
            messageId: newMsgId,
            senderId: incomingSenderId, 
            text: messageText, 
            timestamp: sentAt ? parseUtcDate(sentAt) : new Date(), 
            isRead: 1 
          }];
          globalChatHistoryCache[String(receiverId)] = updated.slice(-100);
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem(`cached_chat_history_${receiverId}`, JSON.stringify(updated.slice(-100)));
            } catch (e) {}
          }
          return updated;
        });

        playMessageChime();
        markChatReadApi(incomingSenderId, getToken()).catch(() => {});
        scrollToBottom("smooth");
      }
    };

    const handleGlobalMsg = (e: any) => {
      const { senderId, receiverId: rId, messageText, msgId, sentAt } = e.detail || {};
      if (senderId && messageText) {
        appendIncoming(senderId, rId, messageText, msgId, sentAt);
      }
    };

    window.addEventListener("global_message_received", handleGlobalMsg);

    const handleMessagesRead = (data: any) => {
      if (data && Number(data.readerId ?? data.ReaderId) === Number(receiverId)) {
        setMessages(prev => prev.map(m => ({ ...m, isRead: 1 })));
      }
    };

    if (connection) {
      connection.on("MessagesRead", handleMessagesRead);
    }

    return () => {
      if (connection) {
        connection.off("MessagesRead", handleMessagesRead);
      }
      window.removeEventListener("global_message_received", handleGlobalMsg);
    };
  }, [connection, receiverId]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    } else if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
    }
  };

  useEffect(() => { 
    scrollToBottom("auto"); 
  }, [receiverId]);

  // 🚀 Ultra-Smooth Auto Scroll when new message arrives or typing changes
  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages, isUserTyping]);

  // 📱 Mobile Viewport auto-scroll when soft keyboard opens
  useEffect(() => {
    if (typeof window !== "undefined" && window.visualViewport) {
      const handleViewportResize = () => {
        scrollToBottom("smooth");
      };
      window.visualViewport.addEventListener("resize", handleViewportResize);
      return () => window.visualViewport?.removeEventListener("resize", handleViewportResize);
    }
  }, []);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 250);
  };

  // 🚀 NON-BLOCKING RAPID DISPATCH (WHATSAPP-STYLE RAPID ENTER SAFE + RAPID QUEUE)
  const handleSendText = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isBlocked) return;
    
    // 🛡️ Prevent duplicate execution from simultaneous touch & click on same button (80ms guard)
    const nowTimestamp = Date.now();
    if (lastSentTextRef.current === trimmed && (nowTimestamp - lastSentTimeRef.current) < 80) {
      return;
    }
    lastSentTextRef.current = trimmed;
    lastSentTimeRef.current = nowTimestamp;

    const token = getToken();
    if (!token) {
      return;
    }

    const hadExistingConversation = messages.some(m => !String(m.messageId).startsWith('temp-') && !m.isError);

    // Immediately clear input for instant butter-smooth typing
    setMsg(""); 
    setShowEmojiPicker(false);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTyping(Number(receiverId), false);

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const nowD = new Date();
    const nowIso = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, '0')}-${String(nowD.getDate()).padStart(2, '0')}T${String(nowD.getHours()).padStart(2, '0')}:${String(nowD.getMinutes()).padStart(2, '0')}:${String(nowD.getSeconds()).padStart(2, '0')}`;
    const optimisticMsg = {
      uniqueKey: tempId,
      messageId: tempId,
      senderId: "me", 
      text: trimmed, 
      timestamp: new Date(), 
      isRead: 0,
      isPending: true
    };

    setMessages(prev => {
      const updated = [...prev, optimisticMsg];
      globalChatHistoryCache[String(receiverId)] = updated.slice(-100);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(`cached_chat_history_${receiverId}`, JSON.stringify(updated.slice(-100)));
        } catch (e) {}
      }
      return updated;
    });
    scrollToBottom("smooth");

    // ⚡ 0ms INSTANT INBOX SYNC: Immediately add/update this user at top of inbox list
    if (typeof window !== "undefined") {
      try {
        const inboxRaw = sessionStorage.getItem("cached_chat_inbox");
        let inboxList: any[] = inboxRaw ? JSON.parse(inboxRaw) : [];
        if (!Array.isArray(inboxList)) inboxList = [];

        const idx = inboxList.findIndex(c => Number(c.userId ?? c.UserId) === Number(receiverId));
        if (idx !== -1) {
          const item = { ...inboxList[idx], lastMessage: trimmed, lastMessageTime: nowIso };
          inboxList.splice(idx, 1);
          inboxList.unshift(item);
        } else {
          inboxList.unshift({
            userId: Number(receiverId),
            fullName: resolvedName || 'Member',
            photoUrl: resolvedPhoto || '',
            lastMessage: trimmed,
            lastMessageTime: nowIso,
            unreadCount: 0,
            accountState: 'Active',
            isOnline: isOnline
          });
        }
        sessionStorage.setItem("cached_chat_inbox", JSON.stringify(inboxList));
      } catch (e) {}

      window.dispatchEvent(new CustomEvent('chat_conversation_updated', {
        detail: {
          userId: Number(receiverId),
          fullName: resolvedName || 'Member',
          photoUrl: resolvedPhoto || '',
          lastMessage: trimmed,
          lastMessageTime: nowIso
        }
      }));
    }

    // Asynchronously dispatch without blocking future typing
    sendChatMessageApi(Number(receiverId), trimmed, "Text", token).then(res => {
      if (res.success && res.data) {
        const realId = res.data?.messageId ?? res.data?.MessageId;
        if (realId) {
          setMessages(prev => {
            const updated = prev.map(m => m.uniqueKey === tempId ? { ...m, messageId: realId, uniqueKey: `real-${realId}`, isPending: false } : m);
            globalChatHistoryCache[String(receiverId)] = updated.slice(-100);
            if (typeof window !== "undefined") {
              try {
                sessionStorage.setItem(`cached_chat_history_${receiverId}`, JSON.stringify(updated.slice(-100)));
              } catch (e) {}
            }
            return updated;
          });
        }
      } else {
        // Mark failed rather than completely vanishing
        setMessages(prev => {
          const updated = prev.map(m => m.uniqueKey === tempId ? { ...m, isPending: false, isError: true } : m);
          globalChatHistoryCache[String(receiverId)] = updated.slice(-100);
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem(`cached_chat_history_${receiverId}`, JSON.stringify(updated.slice(-100)));
            } catch (e) {}
          }
          return updated;
        });
        if (typeof window !== "undefined") {
          try {
            const inboxRaw = sessionStorage.getItem("cached_chat_inbox");
            if (inboxRaw) {
              let inboxList: any[] = JSON.parse(inboxRaw);
              if (Array.isArray(inboxList) && !hadExistingConversation) {
                inboxList = inboxList.filter(c => Number(c.userId ?? c.UserId) !== Number(receiverId));
                sessionStorage.setItem("cached_chat_inbox", JSON.stringify(inboxList));
                window.dispatchEvent(new Event("refresh_inbox_list"));
              }
            }
          } catch (e) {}
        }
        toast.error(res?.message || "Failed to send message.");
      }
    }).catch(() => {
      setMessages(prev => prev.map(m => m.uniqueKey === tempId ? { ...m, isPending: false, isError: true } : m));
    });
  };

  const handleSend = () => handleSendText(msg);

  // Dismiss mobile keyboard on unmount to prevent touch coordinate lock
  useEffect(() => {
    return () => {
      if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    };
  }, []);

  const handleBackSafe = () => {
    if (inputRef.current) inputRef.current.blur();
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (onBack) onBack();
  };

  const handleToggleBlock = async () => {
    const token = getToken();
    if (!token) return;
    const res = await blockUserApiCall(Number(receiverId), token);
    if (res.success) {
      setBlockStatus(prev => ({ ...prev, isBlockedByMe: !prev.isBlockedByMe }));
      setShowMenu(false);
    } else {
      alert(res.message ?? "Failed to update block status.");
    }
  };

  const formatMsgTime = (val: any) => {
    if (!val) return '';
    try {
      const d = parseUtcDate(val);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  const groupedMessages = useMemo(() => {
    const groups: { [dateStr: string]: any[] } = {};
    if (!Array.isArray(messages)) return groups;

    messages.forEach(m => {
      if (!m) return;
      try {
        const dateObj = m.timestamp ? parseUtcDate(m.timestamp) : new Date();
        const dateKey = !isNaN(dateObj.getTime()) ? dateObj.toDateString() : new Date().toDateString();
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(m);
      } catch {
        const fallbackKey = new Date().toDateString();
        if (!groups[fallbackKey]) groups[fallbackKey] = [];
        groups[fallbackKey].push(m);
      }
    });
    return groups;
  }, [messages]);

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr || dateStr === 'Invalid Date') return "Today";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Today";
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      if (date.toDateString() === today.toDateString()) return "Today";
      if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return "Today";
    }
  };

  const handleProposalAction = async (status: string) => {
    const token = getToken();
    if (!token) return;
    const finalStatus = (status === 'ACCEPT' || status === 'ACCEPTED') ? 'ACCEPTED' : 'DECLINED';
    setProposalLoading(true);
    const res = await handleInteractionApiCall(receiverId, 'INTEREST', finalStatus, token);
    setProposalLoading(false);
    if (res.success) {
      setProposalState(finalStatus);
      // silent accept/decline without toast
    } else {
      toast.error(res.message || "Failed to update proposal status.");
    }
  };

  const isBlocked = blockStatus.isBlockedByMe || blockStatus.isBlockedByOther || isDeletedUser || isDeactiveUser || isAdminBlockedUser;

  const displayAvatar = (isDeletedUser || isDeactiveUser || isAdminBlockedUser) 
    ? DEFAULT_FEMALE_AVATAR 
    : (resolvedPhoto ? getOptimizedImageUrl(resolvedPhoto) : `https://ui-avatars.com/api/?name=${encodeURIComponent(resolvedName || 'User')}&background=FFF0F3&color=870c3f&bold=true`);

  const displayName = isDeletedUser 
    ? "Deleted User" 
    : (isDeactiveUser 
      ? "Deactivated User" 
      : (isAdminBlockedUser 
        ? "User Unavailable" 
        : (resolvedName || 'Member')));

  const isUserTyping = Boolean(typingUsers[Number(receiverId)]);

  const displayStatus = isDeletedUser 
    ? "Account Deleted" 
    : (isDeactiveUser 
      ? "Account Deactivated" 
      : (isAdminBlockedUser 
        ? "Unavailable" 
        : (isUserTyping ? "typing..." : (isOnline ? "Online" : formatLastSeen(lastSeenTime)))));

  const getBlockNoticeMessage = () => {
    if (isDeletedUser) return "This account has been deleted. You can't reply to this conversation.";
    if (isDeactiveUser) return "This account has been deactivated. You can't reply to this conversation.";
    if (isAdminBlockedUser) return "This user is unavailable. You can't reply to this conversation.";
    if (blockStatus.isBlockedByMe) return "You have blocked this account.";
    return "You can't reply to this conversation.";
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#F8FAFC] relative overflow-hidden overscroll-none select-none md:select-auto selection:bg-[#E21E5B] selection:text-white">
      
      {/* 🏷️ PURE WHITE GLOSSY VIP HEADER */}
      <div className="shrink-0 bg-white/95 backdrop-blur-md px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3 text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.03)] z-30 border-b border-slate-100">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button 
            type="button" 
            onClick={handleBackSafe} 
            className="w-9 h-9 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-xs cursor-pointer md:hidden shrink-0"
            aria-label="Back"
          >
            <ChevronLeft size={20} className="stroke-[2.5]" />
          </button>

          <div 
            onClick={handleViewProfile} 
            className={`flex items-center gap-3 group min-w-0 ${(isDeletedUser || isDeactiveUser || isAdminBlockedUser) ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <div className="relative shrink-0 w-10 h-10 md:w-11 md:h-11">
              <img 
                src={displayAvatar} 
                className="w-10 h-10 md:w-11 md:h-11 rounded-full shadow-2xs border border-slate-200/90 object-cover object-top shrink-0 group-hover:scale-102 transition-transform" 
                alt={displayName}
                onError={(e) => { 
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = DEFAULT_FEMALE_AVATAR; 
                }}
              />
              {isOnline && !isDeletedUser && !isDeactiveUser && !isAdminBlockedUser && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full z-20 shadow-xs ring-1 ring-emerald-500/20" />
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <h3 className={`font-bold text-sm md:text-base leading-tight text-slate-900 tracking-tight flex items-center gap-1.5 truncate ${(isDeletedUser || isDeactiveUser || isAdminBlockedUser) ? '' : 'group-hover:text-[#E21E5B] transition-colors'}`}>
                <span className="truncate">{displayName}</span>
                {(!isDeletedUser && !isDeactiveUser && !isAdminBlockedUser) && (
                  <ProfileStatusIcons profile={targetProfile} size={15} />
                )}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] mt-0.5 truncate">
                {isUserTyping ? (
                  <span className="text-[#E21E5B] font-bold flex items-center gap-1">
                    <span className="flex items-center gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-[#E21E5B] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 rounded-full bg-[#E21E5B] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 rounded-full bg-[#E21E5B] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    <span>typing...</span>
                  </span>
                ) : isOnline && !isDeletedUser && !isDeactiveUser && !isAdminBlockedUser ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Online</span>
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">
                    {displayStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="relative shrink-0">
          <button 
            type="button"
            onClick={() => setShowMenu(!showMenu)} 
            className="w-9 h-9 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 shadow-xs cursor-pointer transition active:scale-95"
            aria-label="More options"
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-11 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 text-slate-800 animate-in fade-in zoom-in-95">
              <button 
                type="button"
                onClick={handleToggleBlock}
                className="w-full px-4 py-2.5 text-left text-xs font-bold flex items-center gap-2.5 hover:bg-rose-50 text-rose-700 transition-colors cursor-pointer"
              >
                <UserX size={16} /> {blockStatus.isBlockedByMe ? "Unblock User" : "Block User"}
              </button>
              <button 
                type="button"
                onClick={() => { alert(`User ${displayName} reported.`); setShowMenu(false); }}
                className="w-full px-4 py-2.5 text-left text-xs font-bold flex items-center gap-2.5 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              >
                <ShieldAlert size={16} className="text-amber-500" /> Report Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 📜 MESSAGES SCROLL AREA */}
      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 md:p-6 space-y-3.5 bg-[#F8FAFC] scroll-smooth overscroll-contain"
      >
        {/* 💌 PROPOSAL BANNER */}
        {proposalState === 'PENDING' && !isDeletedUser && !isDeactiveUser && !isAdminBlockedUser && (
          <div className="bg-gradient-to-r from-rose-500 to-[#E21E5B] p-4 sm:p-5 rounded-3xl text-white shadow-lg border border-rose-300/30 text-center space-y-2.5 my-2 max-w-lg mx-auto">
            <div className="flex items-center justify-center gap-2 text-white">
              <Heart size={20} className="fill-white" />
              <h4 className="text-sm sm:text-base font-bold tracking-tight">Nikah Proposal Request Received</h4>
            </div>
            <p className="text-xs text-rose-100 font-medium">
              {displayName} has sent you a rishta proposal. Accept proposal to begin halal conversation!
            </p>
            <div className="flex justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleProposalAction('DECLINE')}
                disabled={proposalLoading}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-full border border-white/30 cursor-pointer transition"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => handleProposalAction('ACCEPT')}
                disabled={proposalLoading}
                className="px-5 py-2 bg-white text-[#E21E5B] font-bold text-xs rounded-full shadow-sm hover:bg-rose-50 cursor-pointer flex items-center gap-1.5 transition active:scale-95"
              >
                {proposalLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                <span>Accept Proposal</span>
              </button>
            </div>
          </div>
        )}

        {loading && messages.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Loader2 size={24} className="animate-spin text-[#E21E5B] mx-auto" />
            <p className="text-xs font-semibold text-slate-400">Loading conversation...</p>
          </div>
        ) : null}

        {Object.keys(groupedMessages).map(dateKey => (
          <div key={dateKey} className="space-y-3">
            <div className="flex justify-center my-3 sticky top-2 z-10 pointer-events-none">
              <span className="bg-white/95 backdrop-blur-md text-slate-500 text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-2xs border border-slate-200/80">
                {formatDateLabel(dateKey)}
              </span>
            </div>

            {groupedMessages[dateKey].map((m) => {
              const isMe = Number(m.senderId) !== Number(receiverId);
              const isMessageRead = m.isRead === 1;

              return (
                <div key={m.uniqueKey} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[65%] p-3 px-4 text-xs sm:text-sm shadow-2xs relative transition-all ${
                    isMe 
                    ? 'bg-gradient-to-r from-[#E21E5B] to-[#C2185B] text-white rounded-2xl rounded-tr-xs shadow-[0_2px_8px_rgba(226,30,91,0.20)] border border-rose-400/20' 
                    : 'bg-white text-slate-900 rounded-2xl rounded-tl-xs border border-slate-200/90 shadow-2xs font-normal'
                  }`}>
                    <p className="font-medium leading-relaxed tracking-normal break-words">{m.text}</p>
                    
                    <div className="flex items-center gap-1.5 mt-1 justify-end text-[9px]">
                      <span className={`font-semibold tracking-wider ${isMe ? 'text-white/80' : 'text-slate-400'}`}>
                        {formatMsgTime(m.timestamp)}
                      </span>
                      
                      {/* 🎯 DOUBLE TICKS: CYAN IF READ, WHITE/70 IF DELIVERED */}
                      {isMe && (
                        <span>
                          {isMessageRead ? (
                            <CheckCheck size={14} className="text-cyan-300 stroke-[3]" />
                          ) : (
                            <CheckCheck size={14} className="text-white/70 stroke-[2.5]" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* ✍️ REAL-TIME VIP TYPING INDICATOR BUBBLE WITH CANDIDATE NAME & SMOOTH BOUNCE */}
        {isUserTyping && (
          <div className="flex items-end gap-2 justify-start animate-in fade-in slide-in-from-bottom-2 duration-200">
            <img
              src={displayAvatar}
              alt={displayName}
              className="w-6 h-6 rounded-full object-cover object-top border border-slate-200 shrink-0 mb-0.5"
            />
            <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs px-3.5 py-2 shadow-2xs flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-700">{displayName} is typing</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E21E5B] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#E21E5B] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#E21E5B] animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}

        {/* Scroll anchor to guarantee perfect bottom view */}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {showScrollBottom && (
        <button 
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-20 right-5 bg-white text-slate-700 hover:text-[#E21E5B] p-2.5 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all z-30 border border-slate-200 cursor-pointer"
          aria-label="Scroll to bottom"
        >
          <ChevronDown size={18} />
        </button>
      )}

      {/* 🌟 EXPANDED RICH EMOJI PICKER WITH CATEGORIES */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-3 right-3 sm:left-4 sm:right-auto sm:w-80 bg-white border border-slate-200 shadow-2xl rounded-3xl p-3 z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              {(Object.keys(EMOJI_CATEGORIES) as Array<keyof typeof EMOJI_CATEGORIES>).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedEmojiCategory(cat)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                    selectedEmojiCategory === cat ? 'bg-[#E21E5B] text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button 
              type="button" 
              onClick={() => setShowEmojiPicker(false)}
              className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto">
            {EMOJI_CATEGORIES[selectedEmojiCategory].map(emoji => (
              <button 
                key={emoji} 
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setMsg(prev => prev + emoji);
                  requestAnimationFrame(() => inputRef.current?.focus());
                }}
                className="text-xl p-2 hover:bg-slate-100 rounded-2xl transition-all hover:scale-125 cursor-pointer text-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 📌 WHATSAPP-STYLE DOCKED INPUT PANEL */}
      <div className="shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-100 z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] p-2.5 sm:p-3 space-y-2 pb-[max(env(safe-area-inset-bottom,0px),10px)]">
        
        {isBlocked ? (
          <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-200">
            <p className="text-xs font-bold text-slate-600 tracking-wide">
              {getBlockNoticeMessage()}
            </p>
            {blockStatus.isBlockedByMe && !isDeletedUser && !isDeactiveUser && !isAdminBlockedUser && (
              <button type="button" onClick={handleToggleBlock} className="text-xs font-bold text-[#E21E5B] underline mt-1 cursor-pointer">
                Unblock User
              </button>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto bg-slate-50 focus-within:bg-white p-1.5 pl-3 rounded-full border border-slate-200/90 focus-within:border-[#E21E5B] focus-within:ring-2 focus-within:ring-[#E21E5B]/15 flex items-center gap-2 transition-all shadow-2xs">
            <button 
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
              className="p-1.5 text-slate-400 hover:text-[#E21E5B] rounded-full transition-colors cursor-pointer active:scale-95"
              title="Add Emoji"
            >
              <Smile size={21} />
            </button>
            <input 
              ref={inputRef}
              value={msg} 
              enterKeyHint="send"
              autoComplete="off"
              autoCorrect="off"
              onFocus={() => {
                setTimeout(() => scrollToBottom("smooth"), 150);
              }}
              onChange={(e) => {
                setMsg(e.target.value);
                sendTyping(Number(receiverId), true);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                  sendTyping(Number(receiverId), false);
                }, 2000);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..." 
              className="flex-1 py-1.5 text-xs sm:text-sm font-medium text-slate-800 bg-transparent placeholder-slate-400 outline-none"
            />
            <button 
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSend} 
              className="h-9 w-9 sm:h-10 sm:w-10 bg-gradient-to-r from-[#E21E5B] to-[#C2185B] hover:brightness-105 active:scale-90 rounded-full flex items-center justify-center text-white shadow-xs transition-transform flex-shrink-0 cursor-pointer touch-manipulation"
              title="Send Message"
            >
              <Send size={15} className="ml-0.5 text-white" />
            </button>
          </div>
        )}
      </div>

    </div>
  );

    </div>
  );
}
