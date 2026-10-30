"use client";
import { useState, useEffect, useRef, useMemo } from 'react';
import { Send, ArrowLeft, MoreVertical, CheckCheck, Heart, ShieldAlert, UserX, Smile, ChevronDown, Loader2, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSignalR } from '@/context/SignalRContext';
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

const QUICK_EMOJIS = ["❤️", "😂", "🔥", "👍", "😍", "😊", "🙏", "🎉", "😭", "😮", "💖", "✨"];

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
  const [showScrollBottom, setShowScrollBottom] = useState(false);
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

  const scrollRef = useRef<HTMLDivElement>(null);

  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() ?? null;
    return null;
  };

  const getToken = (): string | null => getAuthToken();

  // Dynamic Presence Status
  const currentPresence = onlineUsers[Number(receiverId)];
  const isOnline = currentPresence ? Boolean(currentPresence.isOnline) : false;
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

  // 🔒 Session & Query-based navigation to /dashboard/profile
  const handleViewProfile = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDeletedUser || isDeactiveUser || isAdminBlockedUser) {
      return;
    }
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

  useEffect(() => {
    if (!receiverId) return;
    const token = getToken();
    if (!token) return;

    const loadData = async () => {
      setLoading(true);
      const res = await fetchChatHistoryApi(receiverId, 1, 100, token);
      if (res.success && res.data) {
        const rawData = res.data?.data ?? res.data ?? [];
        const formatted = rawData.map((m: any, idx: number) => ({
          uniqueKey: `hist-${m.messageId ?? m.MessageId ?? 'idx'}-${idx}-${Math.random()}`,
          messageId: m.messageId ?? m.MessageId,
          senderId: m.senderId ?? m.SenderId, 
          text: m.messageText ?? m.MessageText, 
          timestamp: parseUtcDate(m.sentAt ?? m.SentAt ?? Date.now()),
          isRead: (m.isRead === 1 || m.isRead === true || m.IsRead === 1 || m.IsRead === true) ? 1 : 0
        }));
        setMessages(formatted);
      }

      const blockRes = await fetchBlockStatusApi(receiverId, token);
      if (blockRes.success && blockRes.data) {
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
      setLoading(false);
    };

    loadData();
  }, [receiverId]);

  const playMessageChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  };

  useEffect(() => {
    if (!connection || !receiverId) return;

    const handleReceiveMessage = (senderId: any, rId: any, messageText: string, msgId?: any, sentAt?: string) => {
      const incomingSenderId = Number(senderId);
      const incomingReceiverId = Number(rId);

      if (incomingSenderId === Number(receiverId)) {
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
        playMessageChime();
        markChatReadApi(incomingSenderId, getToken()).catch(() => {});
      }
    };

    const handleMessagesRead = (data: any) => {
      if (data && Number(data.readerId ?? data.ReaderId) === Number(receiverId)) {
        setMessages(prev => prev.map(m => ({ ...m, isRead: 1 })));
      }
    };

    connection.on("ReceiveMessage", handleReceiveMessage);
    connection.on("MessagesRead", handleMessagesRead);

    return () => {
      connection.off("ReceiveMessage", handleReceiveMessage);
      connection.off("MessagesRead", handleMessagesRead);
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

  const handleSend = async () => {
    if (!msg.trim() || isBlocked) return;
    const token = getToken();
    if (!token) return;

    const currentMsgText = msg.trim();
    setMsg(""); 
    setShowEmojiPicker(false);

    // Cancel typing
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTyping(Number(receiverId), false);

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      uniqueKey: tempId,
      messageId: tempId,
      senderId: "me", 
      text: currentMsgText, 
      timestamp: new Date(), 
      isRead: 0 
    };

    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom("smooth");

    // ⚡ Send message via API (which archives to DB, caches to Redis RAM, and broadcasts via SignalR)
    const res = await sendChatMessageApi(Number(receiverId), currentMsgText, "Text", token);
    if (res.success && res.data) {
      const realId = res.data?.messageId ?? res.data?.MessageId;
      if (realId) {
        setMessages(prev => prev.map(m => m.uniqueKey === tempId ? { ...m, messageId: realId, uniqueKey: `real-${realId}` } : m));
      }
    } else {
      setMessages(prev => prev.filter(m => m.uniqueKey !== tempId));
      setMsg(currentMsgText);
      toast.error(res.message ?? "Failed to send message.");
    }
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

  const displayStatus = isDeletedUser 
    ? "Account Deleted" 
    : (isDeactiveUser 
      ? "Account Deactivated" 
      : (isAdminBlockedUser 
        ? "Unavailable" 
        : (isOnline ? "Online" : formatLastSeen(lastSeenTime))));

  const getBlockNoticeMessage = () => {
    if (isDeletedUser) return "This account has been deleted. You can't reply to this conversation.";
    if (isDeactiveUser) return "This account has been deactivated. You can't reply to this conversation.";
    if (isAdminBlockedUser) return "This user is unavailable. You can't reply to this conversation.";
    if (blockStatus.isBlockedByMe) return "You have blocked this account.";
    return "You can't reply to this conversation.";
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#efeae2]/30 relative overflow-hidden selection:bg-[#d91b5c] selection:text-white">
      
      {/* 📌 WHATSAPP-STYLE STICKY TOP HEADER */}
      <div className="shrink-0 bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] p-3 sm:p-3.5 flex items-center gap-3 text-white shadow-md z-30 border-b border-rose-900/20">
        <button onClick={onBack} className="p-2 hover:bg-white/15 rounded-2xl transition-colors cursor-pointer md:hidden">
          <ArrowLeft size={20} />
        </button>

        <div onClick={handleViewProfile} className={`flex items-center gap-3 group ${(isDeletedUser || isDeactiveUser || isAdminBlockedUser) ? 'cursor-default' : 'cursor-pointer'}`}>
          <div className="relative shrink-0 w-10 h-10 md:w-11 md:h-11">
            <img 
              src={displayAvatar} 
              className="w-10 h-10 md:w-11 md:h-11 rounded-full shadow-sm border-2 border-white/40 object-cover object-top shrink-0" 
              alt="avatar"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
            />
            {isOnline && !isDeletedUser && !isDeactiveUser && !isAdminBlockedUser && (
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#d91b5c] rounded-full z-20 shadow-sm animate-pulse" />
            )}
          </div>

          <div className="flex flex-col">
            <h3 className={`font-serif font-extrabold text-sm md:text-base leading-tight uppercase tracking-tight flex items-center gap-1.5 text-white ${(isDeletedUser || isDeactiveUser || isAdminBlockedUser) ? '' : 'group-hover:underline'}`}>
              {displayName} {(!isDeletedUser && !isDeactiveUser && !isAdminBlockedUser) && <Heart size={14} className="fill-amber-300 text-amber-300" />}
            </h3>
            <span className="text-[10px] font-black text-rose-100 uppercase tracking-widest mt-0.5">
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

      {/* 📜 MESSAGES SCROLL AREA (ONLY MESSAGES SCROLL, HEADER & INPUT REMAIN FIXED) */}
      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#fbf8f5] scroll-smooth"
      >
        {/* 💌 PROPOSAL ACTION BANNER FOR RECIPIENT */}
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
                Decline Proposal
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

        {Object.keys(groupedMessages).map(dateKey => (
          <div key={dateKey} className="space-y-3">
            <div className="flex justify-center my-2 sticky top-2 z-10">
              <span className="bg-white/90 backdrop-blur-xs text-slate-600 text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-xs border border-rose-100">
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
                      
                      {/* 🎯 DOUBLE TICKS: CYAN IF READ, WHITE/GRAY IF UNREAD (INSTANT DELIVERED) */}
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
        {Boolean(typingUsers[Number(receiverId)]) && (
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
          className="absolute bottom-20 right-6 bg-[#d91b5c] text-white p-2.5 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all z-30 border border-rose-200"
        >
          <ChevronDown size={18} />
        </button>
      )}

      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 bg-white border-2 border-rose-100 shadow-2xl rounded-3xl p-3 z-50 grid grid-cols-6 gap-2">
          {QUICK_EMOJIS.map(emoji => (
            <button 
              key={emoji} 
              type="button"
              onClick={() => setMsg(prev => prev + emoji)}
              className="text-xl p-2.5 hover:bg-rose-50 rounded-2xl transition-all hover:scale-125 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* 📌 WHATSAPP-STYLE STICKY BOTTOM INPUT PANEL */}
      <div className="shrink-0 p-3.5 bg-white border-t border-rose-100 z-30 shadow-lg">
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
        ) : (
          <div className="max-w-4xl mx-auto bg-slate-50 p-1.5 pl-3 rounded-full border-2 border-rose-100 flex items-center gap-2 focus-within:ring-2 focus-within:ring-[#d91b5c]/20 focus-within:bg-white transition-all shadow-xs">
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
              className="p-2 text-slate-400 hover:text-[#d91b5c] rounded-full transition-colors cursor-pointer"
            >
              <Smile size={22} />
            </button>
            <input 
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
            >
              <Send size={16} className="ml-0.5 text-amber-300" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
