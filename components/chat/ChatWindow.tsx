"use client";

import { getClientSubscriptionStatus } from '@/lib/subscriptionUtils';
import SubscriptionModal from '@/components/dashboard/SubscriptionModal';
import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, ArrowLeft, MoreVertical, CheckCheck, Heart, 
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
  formatLastSeen
} from '@/lib/api';
import { getOptimizedImageUrl } from '@/lib/imageUtils';
import { getAuthToken } from '@/lib/auth';
import { toast } from 'sonner';

// 🌟 MULTI-CATEGORY EXPANDED EMOJIS (Islamic Greetings, Love, Expressions, Gestures)
const EMOJI_CATEGORIES = {
  "Nikah & Pure": ["🌸", "🤲", "💍", "🌹", "🤍", "✨", "🕊️", "🌙", "🕌", "💐", "💖", "❤️"],
  "Smilies": ["😊", "😍", "🥰", "😇", "😌", "😃", "😂", "🤗", "😉", "🤩", "😎", "🥺"],
  "Gestures": ["👍", "🙏", "🤝", "👌", "👏", "🙌", "👋", "🎉", "🔥", "💯", "⭐", "💫"]
};

// 💬 INSTANT PREDEFINED QUICK ICEBREAKERS (Click to Send)
const QUICK_TEMPLATES = [
  "Assalam Alaikum! Kaise hain aap? 🌸",
  "Aapki profile achhi lagi! ✨",
  "Family se baat kar sakte hain? 🤲",
  "Biodata share karenge? 📄",
  "Photos dekh sakte hain? 📸",
  "Aap kahan se belong karte hain? 📍"
];

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
  const { connection, onlineUsers, typingUsers, sendTyping } = useSignalR();

  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>("Nikah & Pure");
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [dismissSafetyBanner, setDismissSafetyBanner] = useState(false);
  const typingTimeoutRef = useRef<any>(null);

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
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [canChatUser, setCanChatUser] = useState(true);

  useEffect(() => {
    const checkSub = () => {
      const sub = getClientSubscriptionStatus();
      setCanChatUser(sub.canChat);
    };
    checkSub();
    window.addEventListener("user_details_updated", checkSub);
    return () => window.removeEventListener("user_details_updated", checkSub);
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getToken = (): string | null => getAuthToken();

  // Dynamic Presence Status (From Ultra-Fast In-Memory SignalR Store)
  const currentPresence = onlineUsers[Number(receiverId)];
  const isOnline = currentPresence ? Boolean(currentPresence.isOnline) : Boolean(initialIsOnline);
  const lastSeenTime = currentPresence ? currentPresence.lastSeen : (initialLastSeen ?? null);

  const stateStr = String(initialAccountState || blockStatus.targetAccountState || '').toLowerCase();

  const isDeletedUser = Boolean(
    userName === "Deleted User" || 
    (userName && String(userName).toLowerCase().includes("deleted")) ||
    stateStr.includes("del") ||
    blockStatus.isTargetDeleted
  );

  const isDeactiveUser = !isDeletedUser && Boolean(
    userName === "Deactivated User" ||
    (userName && String(userName).toLowerCase().includes("deactivated")) ||
    stateStr.includes("deact") ||
    stateStr.includes("pause") ||
    blockStatus.isTargetDeactivated
  );

  const isAdminBlockedUser = !isDeletedUser && !isDeactiveUser && Boolean(
    userName === "User Unavailable" ||
    stateStr.includes("admin") ||
    blockStatus.isTargetAdminBlocked
  );

  const handleViewProfile = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDeletedUser || isDeactiveUser || isAdminBlockedUser) return;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("viewing_profile_target", JSON.stringify({ 
        userId: Number(receiverId),
        targetUserId: Number(receiverId)
      }));
    }
    router.push('/dashboard/profile?userId=' + receiverId);
  };

  const parseUtcDate = (dateVal: any) => {
    if (!dateVal) return new Date();
    if (typeof dateVal === 'object' && dateVal instanceof Date) return dateVal;
    let str = String(dateVal).trim();
    if (!str.endsWith('Z') && !str.includes('+') && !str.includes('Z')) {
      str += 'Z';
    }
    return new Date(str);
  };

  // 📥 FETCH CHAT HISTORY DEFENSIVELY
  useEffect(() => {
    if (!receiverId) return;
    const token = getToken();
    if (!token) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetchChatHistoryApi(receiverId, 1, 100, token);
        const rawData = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);
        const formatted = rawData.map((m: any, idx: number) => ({
          uniqueKey: `hist-${m.messageId ?? m.MessageId ?? 'idx'}-${idx}-${Math.random()}`,
          messageId: m.messageId ?? m.MessageId,
          senderId: m.senderId ?? m.SenderId, 
          text: m.messageText ?? m.MessageText, 
          timestamp: parseUtcDate(m.sentAt ?? m.SentAt ?? Date.now()),
          isRead: (m.isRead === 1 || m.isRead === true || m.IsRead === 1 || m.IsRead === true) ? 1 : 0
        }));
        setMessages(formatted);
      } catch {
        setMessages([]);
      }

      try {
        const blockRes = await fetchBlockStatusApi(receiverId, token);
        if (blockRes?.success && blockRes.data) {
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

      setLoading(false);
    };

    loadData();
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
          return [...prev, { 
            uniqueKey: `sig-${newMsgId}-${Math.random()}`,
            messageId: newMsgId,
            senderId: incomingSenderId, 
            text: messageText, 
            timestamp: sentAt ? new Date(sentAt) : new Date(), 
            isRead: 1 
          }];
        });

        // 🎵 Instant WhatsApp Sound Ping
        playMessageChime();
        markChatReadApi(incomingSenderId, getToken()).catch(() => {});
        scrollToBottom("smooth");
      }
    };

    if (connection) {
      connection.on("ReceiveMessage", appendIncoming);
    }

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
        connection.off("ReceiveMessage", appendIncoming);
        connection.off("MessagesRead", handleMessagesRead);
      }
      window.removeEventListener("global_message_received", handleGlobalMsg);
    };
  }, [connection, receiverId]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
    }
  };

  useEffect(() => { scrollToBottom("auto"); }, [receiverId]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight - scrollTop - clientHeight < 150) scrollToBottom("smooth");
  }, [messages]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 250);
  };

  // 🚀 INSTANT SEND (OPTIMISTIC UI LIKE WHATSAPP)
  const handleSendText = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isBlocked) return;
    const token = getToken();
    if (!token) return;

    setMsg(""); 
    setShowEmojiPicker(false);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTyping(Number(receiverId), false);

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      uniqueKey: tempId,
      messageId: tempId,
      senderId: "me", 
      text: trimmed, 
      timestamp: new Date(), 
      isRead: 0 
    };

    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom("smooth");

    const res = await sendChatMessageApi(Number(receiverId), trimmed, "Text", token);
    if (res.success && res.data) {
      const realId = res.data?.messageId ?? res.data?.MessageId;
      if (realId) {
        setMessages(prev => prev.map(m => m.uniqueKey === tempId ? { ...m, messageId: realId, uniqueKey: `real-${realId}` } : m));
      }
    } else {
      setMessages(prev => prev.filter(m => m.uniqueKey !== tempId));
      setMsg(trimmed);
      toast.error(res.message ?? "Failed to send message.");
      if (res.message && (res.message.toLowerCase().includes('subscription') || res.message.toLowerCase().includes('upgrade') || res.message.toLowerCase().includes('vip') || res.message.toLowerCase().includes('renew'))) {
        setShowSubscriptionModal(true);
      }
    }
  };

  const handleSend = () => handleSendText(msg);

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

  const groupedMessages = useMemo(() => {
    const groups: { [dateStr: string]: any[] } = {};
    messages.forEach(m => {
      const dateObj = new Date(m.timestamp);
      const dateKey = dateObj.toDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(m);
    });
    return groups;
  }, [messages]);

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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
      toast.success(finalStatus === 'ACCEPTED' ? "Proposal Accepted! You can now chat freely." : "Proposal Declined.");
    } else {
      toast.error(res.message || "Failed to update proposal status.");
    }
  };

  const isBlocked = blockStatus.isBlockedByMe || blockStatus.isBlockedByOther || isDeletedUser || isDeactiveUser || isAdminBlockedUser;

  const displayAvatar = (isDeletedUser || isDeactiveUser || isAdminBlockedUser) 
    ? "/placeholder.png" 
    : (photoUrl ? getOptimizedImageUrl(photoUrl) : `https://ui-avatars.com/api/?name=${encodeURIComponent(userName ?? 'User')}&background=FFF0F3&color=870c3f&bold=true`);

  const displayName = isDeletedUser 
    ? "Deleted User" 
    : (isDeactiveUser 
      ? "Deactivated User" 
      : (isAdminBlockedUser 
        ? "User Unavailable" 
        : (userName ?? 'Member')));

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
    <div className="flex flex-col h-full w-full bg-[#fbf8f5] relative overflow-hidden overscroll-contain selection:bg-[#d91b5c] selection:text-white">
      
      {/* 📌 WHATSAPP-STYLE STICKY TOP HEADER */}
      <div className="shrink-0 bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-3 text-white shadow-md z-30 border-b border-rose-900/20">
        <button onClick={onBack} className="p-2 hover:bg-white/15 rounded-2xl transition-colors cursor-pointer md:hidden">
          <ArrowLeft size={20} />
        </button>

        <div onClick={handleViewProfile} className={`flex items-center gap-3 group ${(isDeletedUser || isDeactiveUser || isAdminBlockedUser) ? 'cursor-default' : 'cursor-pointer'}`}>
          <div className="relative shrink-0 w-10 h-10 md:w-11 md:h-11">
            <img 
              src={displayAvatar} 
              className="w-10 h-10 md:w-11 md:h-11 rounded-full shadow-sm border-2 border-white/40 object-cover object-top shrink-0" 
              alt="avatar"
              onError={(e) => { 
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = '/placeholder.png'; 
              }}
            />
            {isOnline && !isDeletedUser && !isDeactiveUser && !isAdminBlockedUser && (
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#d91b5c] rounded-full z-20 shadow-sm animate-pulse" />
            )}
          </div>

          <div className="flex flex-col">
            <h3 className={`font-serif font-extrabold text-sm md:text-base leading-tight uppercase tracking-tight flex items-center gap-1.5 text-white ${(isDeletedUser || isDeactiveUser || isAdminBlockedUser) ? '' : 'group-hover:underline'}`}>
              {displayName} {(!isDeletedUser && !isDeactiveUser && !isAdminBlockedUser) && <Heart size={14} className="fill-amber-300 text-amber-300" />}
            </h3>
            <span className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${
              isUserTyping ? "text-amber-200 animate-pulse font-bold" : (isOnline ? "text-emerald-200" : "text-rose-100")
            }`}>
              {displayStatus}
            </span>
          </div>
        </div>

        <div className="ml-auto relative">
          <button 
            type="button"
            onClick={() => setShowMenu(!showMenu)} 
            className="p-2 rounded-2xl hover:bg-white/15 transition-colors cursor-pointer text-white"
          >
            <MoreVertical size={20} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-12 w-52 bg-white rounded-3xl shadow-2xl border-2 border-rose-100 py-2 z-50 text-slate-800">
              <button 
                type="button"
                onClick={handleToggleBlock}
                className="w-full px-4 py-2.5 text-left text-xs font-black flex items-center gap-2.5 hover:bg-rose-50 text-rose-700 transition-colors cursor-pointer"
              >
                <UserX size={16} /> {blockStatus.isBlockedByMe ? "Unblock User" : "Block User"}
              </button>
              <button 
                type="button"
                onClick={() => { alert(`User ${displayName} reported.`); setShowMenu(false); }}
                className="w-full px-4 py-2.5 text-left text-xs font-black flex items-center gap-2.5 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              >
                <ShieldAlert size={16} className="text-amber-500" /> Report Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 🛡️ NIKAH QUBOOL OFFICIAL SAFETY & SCAM ADVISORY BANNER */}
      {!dismissSafetyBanner && (
        <div className="shrink-0 bg-amber-50/95 border-b border-amber-200/80 px-3.5 py-2 flex items-center justify-between gap-2.5 text-[11px] font-bold text-amber-900 shadow-2xs z-20">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ShieldCheck size={16} className="text-amber-600 shrink-0" />
            <p className="truncate sm:whitespace-normal">
              <strong>Nikah Qubool Advisory:</strong> Kabhi kisi ko OTP, password ya online payment na bhejein. Suraksha ka dhyan rakhein.
            </p>
          </div>
          <button 
            onClick={() => setDismissSafetyBanner(true)}
            className="text-amber-600 hover:text-amber-900 p-1 rounded-full hover:bg-amber-100/50 shrink-0"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 📜 MESSAGES SCROLL AREA */}
      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#fbf8f5] scroll-smooth overscroll-contain"
      >
        {/* 💌 PROPOSAL BANNER */}
        {proposalState === 'PENDING' && !isDeletedUser && !isDeactiveUser && !isAdminBlockedUser && (
          <div className="bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] p-5 rounded-3xl text-white shadow-xl border-2 border-rose-300/40 text-center space-y-3 my-2">
            <div className="flex items-center justify-center gap-2 text-amber-300">
              <Heart size={22} className="fill-amber-300" />
              <h4 className="text-base font-serif font-black tracking-tight">Nikah Proposal Request Received</h4>
            </div>
            <p className="text-xs text-rose-100 font-medium">
              {displayName} has sent you a soulmate proposal request. Accept proposal to start private messaging!
            </p>
            <div className="flex justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleProposalAction('DECLINE')}
                disabled={proposalLoading}
                className="px-5 py-2 bg-slate-900 text-rose-200 font-bold text-xs uppercase rounded-xl border border-rose-300/20 cursor-pointer"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => handleProposalAction('ACCEPT')}
                disabled={proposalLoading}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                {proposalLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                <span>Accept Proposal</span>
              </button>
            </div>
          </div>
        )}

        {loading && messages.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <Loader2 size={24} className="animate-spin text-[#d91b5c] mx-auto" />
            <p className="text-xs font-bold text-slate-400">Loading messages...</p>
          </div>
        ) : null}

        {Object.keys(groupedMessages).map(dateKey => (
          <div key={dateKey} className="space-y-3">
            <div className="flex justify-center my-2 sticky top-2 z-10">
              <span className="bg-white/95 backdrop-blur-xs text-slate-600 text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-xs border border-rose-100">
                {formatDateLabel(dateKey)}
              </span>
            </div>

            {groupedMessages[dateKey].map((m) => {
              const isMe = Number(m.senderId) !== Number(receiverId);
              const isMessageRead = m.isRead === 1;

              return (
                <div key={m.uniqueKey} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[65%] p-3 px-4 rounded-2xl text-xs md:text-sm shadow-sm relative transition-all ${
                    isMe 
                    ? 'bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] text-white rounded-br-none shadow-rose-950/10 border border-rose-300/30' 
                    : 'bg-white text-slate-900 rounded-bl-none border border-rose-100 shadow-xs font-medium'
                  }`}>
                    <p className="font-semibold leading-relaxed tracking-wide break-words">{m.text}</p>
                    
                    <div className="flex items-center gap-1.5 mt-1 justify-end text-[9px]">
                      <span className={`font-black uppercase tracking-wider ${isMe ? 'text-rose-100' : 'text-slate-400'}`}>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      
                      {/* 🎯 DOUBLE TICKS: CYAN IF READ, WHITE IF DELIVERED */}
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

        {/* ✍️ REAL-TIME VIP TYPING INDICATOR BUBBLE */}
        {isUserTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-rose-200 rounded-2xl rounded-bl-none px-4 py-2 shadow-xs flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-[#d91b5c] tracking-wider">typing</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d91b5c] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#d91b5c] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#d91b5c] animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
      </div>

      {showScrollBottom && (
        <button 
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-24 right-5 bg-[#d91b5c] text-white p-2.5 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all z-30 border border-rose-200 cursor-pointer"
        >
          <ChevronDown size={18} />
        </button>
      )}

      {/* 🌟 EXPANDED RICH EMOJI PICKER WITH CATEGORIES */}
      {showEmojiPicker && (
        <div className="absolute bottom-28 left-4 right-4 sm:right-auto sm:w-80 bg-white border-2 border-rose-100 shadow-2xl rounded-3xl p-3 z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-rose-100 pb-2 mb-2">
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {(Object.keys(EMOJI_CATEGORIES) as Array<keyof typeof EMOJI_CATEGORIES>).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedEmojiCategory(cat)}
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                    selectedEmojiCategory === cat ? 'bg-[#d91b5c] text-white' : 'bg-rose-50 text-slate-700 hover:bg-rose-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button 
              type="button" 
              onClick={() => setShowEmojiPicker(false)}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto">
            {EMOJI_CATEGORIES[selectedEmojiCategory].map(emoji => (
              <button 
                key={emoji} 
                type="button"
                onClick={() => {
                  setMsg(prev => prev + emoji);
                  inputRef.current?.focus();
                }}
                className="text-xl p-2 hover:bg-rose-50 rounded-2xl transition-all hover:scale-125 cursor-pointer text-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 👑 VIP SUBSCRIPTION MODAL */}
      <SubscriptionModal 
        isOpen={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)} 
      />

      {/* 📌 WHATSAPP-STYLE STICKY BOTTOM INPUT PANEL */}
      <div className="shrink-0 bg-white border-t border-rose-100 z-30 shadow-lg p-2.5 sm:p-3 space-y-2">
        
        {/* 💬 QUICK ICEBREAKER CHIPS */}
        {!isBlocked && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 flex items-center gap-1 pl-1">
              <Sparkles size={11} className="text-amber-500" /> Quick:
            </span>
            {QUICK_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendText(tmpl)}
                className="text-[11px] font-bold text-slate-700 bg-rose-50/70 hover:bg-[#d91b5c] hover:text-white border border-rose-200/60 rounded-full px-3 py-1 whitespace-nowrap transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95"
              >
                {tmpl}
              </button>
            ))}
          </div>
        )}

        {isBlocked ? (
          <div className="p-3 bg-rose-50 rounded-2xl text-center border border-rose-200">
            <p className="text-xs font-extrabold text-slate-600 uppercase tracking-wide">
              {getBlockNoticeMessage()}
            </p>
            {blockStatus.isBlockedByMe && !isDeletedUser && !isDeactiveUser && !isAdminBlockedUser && (
              <button type="button" onClick={handleToggleBlock} className="text-xs font-black text-[#d91b5c] underline mt-1 cursor-pointer">
                Unblock User
              </button>
            )}
          </div>
        ) : !canChatUser ? (
          <div className="p-3 bg-gradient-to-r from-amber-50 via-rose-50 to-amber-50 rounded-2xl text-center border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 px-4">
            <div className="flex items-center gap-2 text-left">
              <Crown className="text-amber-500 fill-amber-500 shrink-0" size={20} />
              <div>
                <p className="text-xs font-black text-slate-800">VIP Subscription Required to Chat</p>
                <p className="text-[11px] text-slate-500 font-medium">Direct messaging is an exclusive feature for active VIP members.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSubscriptionModal(true)}
              className="bg-gradient-to-r from-amber-500 to-[#d91b5c] text-white text-xs font-black px-4 py-2 rounded-full shadow-md hover:brightness-110 shrink-0 cursor-pointer"
            >
              Upgrade VIP Plan
            </button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto bg-slate-50 p-1.5 pl-3 rounded-full border-2 border-rose-100 flex items-center gap-2 focus-within:ring-2 focus-within:ring-[#d91b5c]/20 focus-within:bg-white transition-all shadow-xs">
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
              className="p-2 text-slate-400 hover:text-[#d91b5c] rounded-full transition-colors cursor-pointer"
              title="Add Emoji"
            >
              <Smile size={22} />
            </button>
            <input 
              ref={inputRef}
              value={msg} 
              onChange={(e) => {
                setMsg(e.target.value);
                sendTyping(Number(receiverId), true);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                  sendTyping(Number(receiverId), false);
                }, 2000);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..." 
              className="flex-1 py-2 text-xs sm:text-sm outline-none font-bold text-slate-800 bg-transparent placeholder-slate-400"
            />
            <button 
              type="button"
              onClick={handleSend} 
              className="h-10 w-10 bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] hover:brightness-110 rounded-full flex items-center justify-center text-white shadow-md active:scale-90 transition-all flex-shrink-0 cursor-pointer border border-rose-300/30"
              title="Send Message"
            >
              <Send size={16} className="ml-0.5 text-amber-300" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
