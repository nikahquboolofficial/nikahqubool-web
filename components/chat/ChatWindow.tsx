"use client";
import { useState, useEffect, useRef, useMemo } from 'react';
import { Send, ArrowLeft, MoreVertical, CheckCheck, Heart, ShieldAlert, UserX, Smile, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSignalR } from '@/context/SignalRContext';
import { 
  fetchChatHistoryApi, 
  sendChatMessageApi, 
  markChatReadApi, 
  fetchBlockStatusApi, 
  blockUserApiCall, 
  formatLastSeen
} from '@/lib/api';

const QUICK_EMOJIS = ["❤️", "😂", "🔥", "👍", "😍", "😊", "🙏", "🎉", "😭", "😮", "💖", "✨"];

export default function ChatWindow({ 
  receiverId, 
  userName, 
  photoUrl, 
  initialIsOnline, 
  initialLastSeen, 
  onBack 
}: any) {
  const router = useRouter();
  const { connection, onlineUsers } = useSignalR();

  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [blockStatus, setBlockStatus] = useState({ isBlockedByMe: false, isBlockedByOther: false });

  const scrollRef = useRef<HTMLDivElement>(null);

  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() ?? null;
    return null;
  };

  const getToken = (): string | null => getCookie("user_token");

  // Dynamic Presence Status
  const currentPresence = onlineUsers[Number(receiverId)];
  const isOnline = currentPresence ? currentPresence.isOnline : Boolean(initialIsOnline);
  const lastSeenTime = currentPresence ? currentPresence.lastSeen : (initialLastSeen ?? null);

  // 🔒 Session-based navigation to /dashboard/profile
  const handleViewProfile = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      sessionStorage.setItem("viewing_profile_target", JSON.stringify({ 
        userId: Number(receiverId),
        targetUserId: Number(receiverId)
      }));
    }
    router.push('/dashboard/profile');
  };

  useEffect(() => {
    if (!receiverId) return;
    const token = getToken();
    if (!token) return;

    const loadData = async () => {
      const res = await fetchChatHistoryApi(receiverId, 1, 100, token);
      if (res.success && res.data) {
        const rawData = res.data?.data ?? res.data ?? [];
        const formatted = rawData.map((m: any, idx: number) => ({
          uniqueKey: `hist-${m.messageId ?? m.MessageId ?? idx}`,
          messageId: m.messageId ?? m.MessageId,
          senderId: m.senderId ?? m.SenderId, 
          text: m.messageText ?? m.MessageText, 
          timestamp: new Date(m.sentAt ?? m.SentAt ?? Date.now()),
          isRead: (m.isRead === 1 || m.isRead === true || m.IsRead === 1 || m.IsRead === true) ? 1 : 0
        }));
        setMessages(formatted);
      }

      const blockRes = await fetchBlockStatusApi(receiverId, token);
      if (blockRes.success && blockRes.data) {
        const bData = blockRes.data ?? {};
        setBlockStatus({
          isBlockedByMe: Boolean(bData.isBlockedByMe ?? bData.IsBlockedByMe),
          isBlockedByOther: Boolean(bData.isBlockedByOther ?? bData.IsBlockedByOther)
        });
      }
    };

    loadData();
  }, [receiverId]);

  useEffect(() => {
    if (!connection || !receiverId) return;

    const handleReceiveMessage = (senderId: any, messageText: string, msgId?: any) => {
      const incomingSenderId = Number(senderId);
      if (incomingSenderId === Number(receiverId)) {
        const newMsgId = msgId ?? Date.now();
        setMessages(prev => {
          if (prev.some(m => m.messageId === newMsgId)) return prev;
          return [...prev, { 
            uniqueKey: `sig-${newMsgId}-${Math.random()}`,
            messageId: newMsgId,
            senderId: incomingSenderId, 
            text: messageText, 
            timestamp: new Date(), 
            isRead: 1 
          }];
        });
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

    const currentMsgText = msg;
    setMsg(""); 
    setShowEmojiPicker(false);

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

    const res = await sendChatMessageApi(Number(receiverId), currentMsgText, "Text", token);
    if (res.success && res.data) {
      const realId = res.data?.messageId ?? res.data?.MessageId;
      if (realId) {
        setMessages(prev => prev.map(m => m.uniqueKey === tempId ? { ...m, messageId: realId, uniqueKey: `real-${realId}` } : m));
      }
    } else {
      setMessages(prev => prev.filter(m => m.uniqueKey !== tempId));
      setMsg(currentMsgText);
      alert(res.message ?? "Failed to send message.");
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

  const isBlocked = blockStatus.isBlockedByMe || blockStatus.isBlockedByOther;
  const displayAvatar = photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName ?? 'User')}&background=FFF0F3&color=870c3f&bold=true`;

  return (
    <div className="flex flex-col h-full w-full bg-[#efeae2]/30 relative overflow-hidden selection:bg-[#870c3f] selection:text-white">
      
      {/* TOP HEADER */}
      <div className="flex-none bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] p-3 sm:p-3.5 flex items-center gap-3 text-white shadow-md z-20 border-b border-rose-900/20">
        <button onClick={onBack} className="p-2 hover:bg-white/15 rounded-2xl transition-colors cursor-pointer md:hidden">
          <ArrowLeft size={20} />
        </button>

        <div onClick={handleViewProfile} className="flex items-center gap-3 group cursor-pointer">
          <div className="relative">
            <img 
              src={displayAvatar} 
              className="w-10 h-10 md:w-11 md:h-11 rounded-2xl shadow-sm border-2 border-white/40 object-cover group-hover:scale-105 transition-transform" 
              alt="avatar"
            />
            {isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#870c3f] rounded-full z-20 shadow-sm animate-pulse" />
            )}
          </div>

          <div className="flex flex-col">
            <h3 className="font-serif font-extrabold text-sm md:text-base leading-tight uppercase tracking-tight flex items-center gap-1.5 text-white group-hover:underline">
              {userName ?? 'Member'} <Heart size={14} className="fill-amber-300 text-amber-300" />
            </h3>
            <span className="text-[10px] font-black text-rose-100 uppercase tracking-widest mt-0.5">
              {isOnline ? "Online" : formatLastSeen(lastSeenTime)}
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
                onClick={() => { alert(`User ${userName} reported.`); setShowMenu(false); }}
                className="w-full px-4 py-2.5 text-left text-xs font-black flex items-center gap-2.5 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              >
                <ShieldAlert size={16} className="text-amber-500" /> Report Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#fbf8f5]"
      >
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
                    ? 'bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white rounded-br-none shadow-rose-950/10 border border-rose-300/30' 
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
      </div>

      {showScrollBottom && (
        <button 
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-20 right-6 bg-[#870c3f] text-white p-2.5 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all z-30 border border-rose-200"
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

      {/* INPUT PANEL WITH INSTAGRAM STYLE BLOCK NOTICE */}
      <div className="flex-none p-3.5 bg-white border-t border-rose-100 z-30">
        {isBlocked ? (
          <div className="p-3 bg-rose-50 rounded-2xl text-center border border-rose-200">
            <p className="text-xs font-extrabold text-slate-600 uppercase tracking-wide">
              {blockStatus.isBlockedByMe ? "You have blocked this account." : "You can't reply to this conversation."}
            </p>
            {blockStatus.isBlockedByMe && (
              <button type="button" onClick={handleToggleBlock} className="text-xs font-black text-[#870c3f] underline mt-1 cursor-pointer">
                Unblock User
              </button>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto bg-slate-50 p-1.5 pl-3 rounded-full border-2 border-rose-100 flex items-center gap-2 focus-within:ring-2 focus-within:ring-[#870c3f]/20 focus-within:bg-white transition-all shadow-xs">
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
              className="p-2 text-slate-400 hover:text-[#870c3f] rounded-full transition-colors cursor-pointer"
            >
              <Smile size={22} />
            </button>
            <input 
              value={msg} 
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..." 
              className="flex-1 py-2 text-xs sm:text-sm outline-none font-bold text-slate-800 bg-transparent placeholder-slate-400"
            />
            <button 
              type="button"
              onClick={handleSend} 
              className="h-10 w-10 bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 rounded-full flex items-center justify-center text-white shadow-md active:scale-90 transition-all flex-shrink-0 cursor-pointer border border-rose-300/30"
            >
              <Send size={16} className="ml-0.5 text-amber-300" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}