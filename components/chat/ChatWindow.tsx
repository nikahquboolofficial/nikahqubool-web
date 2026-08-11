"use client";
import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, MoreVertical, CheckCheck, Heart, ShieldAlert, UserX, Smile, Check } from 'lucide-react';
import * as signalR from "@microsoft/signalr";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  fetchChatHistoryApi, 
  sendChatMessageApi, 
  markChatReadApi, 
  fetchBlockStatusApi, 
  blockUserApiCall, 
  SIGNALR_HUB_URL,
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
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [blockStatus, setBlockStatus] = useState({ isBlockedByMe: false, isBlockedByOther: false });
  
  const [isOnline, setIsOnline] = useState<boolean>(Boolean(initialIsOnline));
  const [lastSeenTime, setLastSeenTime] = useState<string | Date | null>(initialLastSeen ?? null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

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

  const getToken = (): string | null => getCookie("user_token");

  useEffect(() => {
    setIsOnline(Boolean(initialIsOnline));
    setLastSeenTime(initialLastSeen ?? null);
  }, [receiverId, initialIsOnline, initialLastSeen]);

  useEffect(() => {
    if (!receiverId) return;
    const token = getToken();
    if (!token) {
      router.push('/');
      return;
    }

    const loadData = async () => {
      const res = await fetchChatHistoryApi(receiverId, 1, 50, token);
      if (res.isUnauthorized) {
        router.push('/');
        return;
      }
      if (res.success && res.data) {
        const rawData = res.data?.data ?? res.data ?? [];
        setMessages(rawData.map((m: any) => ({
          messageId: m.messageId ?? m.MessageId,
          senderId: m.senderId ?? m.SenderId, 
          text: m.messageText ?? m.MessageText, 
          timestamp: new Date(m.sentAt ?? m.SentAt ?? Date.now()),
          isRead: (m.isRead === 1 || m.isRead === true || m.IsRead === 1 || m.IsRead === true) ? 1 : 0
        })));
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
  }, [receiverId, router]);

  useEffect(() => {
    if (!receiverId) return;
    const token = getToken();
    if (!token) return;

    let isMounted = true;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_HUB_URL, {
        accessTokenFactory: () => token,
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveMessage", (senderId, messageText, msgId) => {
      const incomingSenderId = Number(senderId);

      if (incomingSenderId === Number(receiverId)) {
        setMessages(prev => [...prev, { 
          messageId: msgId,
          senderId: incomingSenderId, 
          text: messageText, 
          timestamp: new Date(), 
          isRead: 1 
        }]);

        markChatReadApi(incomingSenderId, getToken()).catch(() => {});
      }
    });

    connection.on("MessagesRead", (data) => {
      if (data && Number(data.readerId ?? data.ReaderId) === Number(receiverId)) {
        setMessages(prev => prev.map(m => ({ ...m, isRead: 1 })));
      }
    });

    connection.on("UserStatusChanged", (uId, status, lastSeen) => {
      if (Number(uId) === Number(receiverId)) {
        setIsOnline(Boolean(status));
        if (lastSeen) setLastSeenTime(lastSeen);
      }
    });

    connection.start()
      .then(() => {
        if (isMounted) {
          connectionRef.current = connection;
        } else {
          connection.stop().catch(() => {});
        }
      })
      .catch(err => {
        if (isMounted) console.error("SignalR Connection Error:", err);
      });

    return () => {
      isMounted = false;
      connection.off("ReceiveMessage");
      connection.off("MessagesRead");
      connection.off("UserStatusChanged");
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.stop().catch(() => {});
      }
    };
  }, [receiverId]);

  const handleSend = async () => {
    if (!msg.trim() || isBlocked) return;
    const token = getToken();
    if (!token) return;

    const currentMsgText = msg;
    setMsg(""); 
    setShowEmojiPicker(false);

    const res = await sendChatMessageApi(Number(receiverId), currentMsgText, "Text", token);
    if (res.success && res.data) {
      setMessages(prev => [...prev, { 
        messageId: res.data?.messageId ?? res.data?.MessageId,
        senderId: res.data?.senderId ?? res.data?.SenderId, 
        text: currentMsgText, 
        timestamp: new Date(), 
        isRead: 0 
      }]);
    } else {
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isBlocked = blockStatus.isBlockedByMe || blockStatus.isBlockedByOther;
  const displayAvatar = photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName ?? 'User')}&background=FFF0F3&color=870c3f&bold=true`;

  return (
    <div className="fixed md:relative inset-0 md:inset-auto h-[100dvh] md:h-full w-full bg-slate-50 flex flex-col z-[100] md:z-auto overflow-hidden selection:bg-[#870c3f] selection:text-white">
      
      {/* 📌 TOP HEADER - FIXED */}
      <div className="flex-none bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] p-3.5 sm:p-4 flex items-center gap-3 text-white shadow-lg z-30 relative border-b-2 border-rose-200/30">
        <button onClick={onBack} className="p-2 hover:bg-white/15 rounded-2xl transition-colors cursor-pointer md:hidden">
          <ArrowLeft size={20} />
        </button>

        <Link href={`/profile/${receiverId}`} className="flex items-center gap-3 group cursor-pointer">
          <div className="relative">
            <img 
              src={displayAvatar} 
              className="w-11 h-11 rounded-2xl shadow-md border-2 border-white/40 object-cover group-hover:scale-105 transition-transform" 
              alt="avatar"
            />
            {isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#870c3f] rounded-full z-20 shadow-sm animate-pulse" />
            )}
          </div>

          <div className="flex flex-col">
            <h3 className="font-serif font-extrabold text-sm md:text-base leading-tight uppercase tracking-tight flex items-center gap-1.5 text-white group-hover:underline">
              {userName ?? 'Member'} <Heart size={14} className="fill-amber-300 text-amber-300 animate-bounce" />
            </h3>
            <span className="text-[10px] font-black text-rose-100 uppercase tracking-widest mt-0.5">
              {isOnline ? "Online" : formatLastSeen(lastSeenTime)}
            </span>
          </div>
        </Link>

        <div className="ml-auto relative">
          <button 
            type="button"
            onClick={() => setShowMenu(!showMenu)} 
            className="p-2.5 rounded-2xl hover:bg-white/15 transition-colors cursor-pointer text-white"
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

      {/* 📜 MESSAGES AREA */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50">
        {messages.map((m, i) => {
          const isMe = Number(m.senderId) !== Number(receiverId);
          const isMessageRead = m.isRead === 1;

          return (
            <div key={m.messageId ?? i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] md:max-w-[65%] p-3.5 px-4.5 rounded-3xl text-sm shadow-sm relative transition-all ${
                isMe 
                ? 'bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white rounded-br-none shadow-rose-950/10 border border-rose-300/30' 
                : 'bg-white text-slate-900 rounded-bl-none border-2 border-rose-100 shadow-xs font-medium'
              }`}>
                <p className="font-semibold leading-relaxed tracking-wide break-words">{m.text}</p>
                
                <div className="flex items-center gap-1.5 mt-1.5 justify-end text-[9px]">
                  <span className={`font-black uppercase tracking-wider ${isMe ? 'text-rose-100' : 'text-slate-400'}`}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  {isMe && (
                    <span className={isMessageRead ? "text-cyan-300" : "text-white/60"}>
                      {isMessageRead ? (
                        <CheckCheck size={15} className="stroke-[3]" />
                      ) : (
                        <Check size={15} className="stroke-[2.5]" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* EMOJI PICKER POPUP */}
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

      {/* 📌 BOTTOM INPUT PANEL - FIXED */}
      <div className="flex-none p-3.5 bg-white border-t-2 border-rose-100 z-40">
        {isBlocked ? (
          <div className="p-3.5 bg-rose-50 rounded-2xl text-center border-2 border-rose-200">
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
          <div className="max-w-4xl mx-auto bg-slate-50 p-2 pl-3 rounded-full border-2 border-rose-100 flex items-center gap-2 focus-within:ring-2 focus-within:ring-[#870c3f]/30 focus-within:bg-white transition-all shadow-xs">
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
              className="h-11 w-11 bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 rounded-full flex items-center justify-center text-white shadow-md active:scale-90 transition-all flex-shrink-0 cursor-pointer border border-rose-300/30"
            >
              <Send size={18} className="ml-0.5 text-amber-300" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}