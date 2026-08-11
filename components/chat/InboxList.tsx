"use client";
import { useEffect, useState, useRef } from 'react';
import { Search, MessageSquare, Sparkles } from 'lucide-react';
import * as signalR from '@microsoft/signalr';
import { useRouter } from 'next/navigation';
import { fetchChatInboxApi, markChatReadApi, SIGNALR_HUB_URL } from '@/lib/api';

export default function InboxList({ onSelectUser, selectedId }: any) {
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const selectedIdRef = useRef(selectedId); 

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

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

  const formatChatTime = (dateString: string) => {
    if (!dateString) return "";
    const messageDate = new Date(dateString);
    const now = new Date();
    const isToday = messageDate.toDateString() === now.toDateString();

    if (isToday) {
      return messageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return messageDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
  };

  const fetchInbox = async () => {
    const token = getToken();
    if (!token) {
      router.push('/');
      return;
    }

    const res = await fetchChatInboxApi(1, 20, token);
    if (res.isUnauthorized) {
      router.push('/');
      return;
    }
    if (res.success && res.data) {
      setChats(res.data?.data ?? res.data ?? []);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/');
      return;
    }

    let isMounted = true;
    fetchInbox();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_HUB_URL, {
        accessTokenFactory: () => token,
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveMessage", (senderId, messageText) => {
      const incomingSenderId = Number(senderId);

      setChats((prevChats) => {
        const index = prevChats.findIndex(c => (c.userId ?? c.UserId) === incomingSenderId);
        const isOpen = selectedIdRef.current === incomingSenderId;

        if (index !== -1) {
          const updated = [...prevChats];
          const target = { ...updated[index] };
          target.lastMessage = messageText;
          target.lastMessageTime = new Date().toISOString();
          if (!isOpen) {
            target.unreadCount = (target.unreadCount ?? target.UnreadCount ?? 0) + 1;
          }
          updated.splice(index, 1);
          return [target, ...updated];
        } else {
          fetchInbox();
          return prevChats;
        }
      });
    });

    connection.on("UserStatusChanged", (userId, isOnline) => {
      setChats(prev => prev.map(c => ((c.userId ?? c.UserId) === Number(userId) ? { ...c, isOnline: Boolean(isOnline) } : c)));
    });

    connection.start()
      .then(() => {
        if (!isMounted) connection.stop().catch(() => {});
      })
      .catch(err => {
        if (isMounted) console.error("SignalR Inbox Error:", err);
      });

    return () => {
      isMounted = false;
      connection.off("ReceiveMessage");
      connection.off("UserStatusChanged");
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.stop().catch(() => {});
      }
    };
  }, [router]);

  const handleChatClick = async (chat: any) => {
    const targetUserId = chat.userId ?? chat.UserId;
    onSelectUser(chat);

    const unread = chat.unreadCount ?? chat.UnreadCount ?? 0;
    if (unread > 0) {
      setChats(prev => prev.map(c => ((c.userId ?? c.UserId) === targetUserId ? { ...c, unreadCount: 0, UnreadCount: 0 } : c)));
      const token = getToken();
      markChatReadApi(targetUserId, token).catch(err => console.error("Mark read error:", err));
    }
  };

  const filteredChats = chats.filter(c => (c.fullName ?? c.FullName ?? "").toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-white border-r-2 border-rose-100 selection:bg-[#870c3f] selection:text-white">
      <div className="p-5 border-b-2 border-rose-100 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-serif font-extrabold uppercase tracking-tight text-slate-900">Messages</h2>
          <div className="bg-rose-50 p-2.5 rounded-2xl text-[#870c3f] border-2 border-rose-200 shadow-xs">
            <MessageSquare size={20} />
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search chat..." 
            className="w-full bg-slate-50 border-2 border-rose-100 py-3 pl-11 pr-4 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#870c3f]/20 transition-all placeholder-slate-400" 
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
        {filteredChats.map((chat) => {
          const uId = chat.userId ?? chat.UserId;
          const fName = chat.fullName ?? chat.FullName ?? "User";
          const lastMsg = chat.lastMessage ?? chat.LastMessage ?? "Start a conversation...";
          const lastTime = chat.lastMessageTime ?? chat.LastMessageTime;
          const unread = chat.unreadCount ?? chat.UnreadCount ?? 0;
          const isSelected = selectedId === uId;
          const isUserOnline = Boolean(chat.isOnline ?? chat.IsOnline);
          const pUrl = chat.photoUrl ?? chat.PhotoUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(fName)}&background=FFF0F3&color=870c3f&bold=true`;

          return (
            <div 
              key={uId} 
              onClick={() => handleChatClick(chat)}
              className={`flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-all ${
                isSelected 
                  ? 'bg-rose-50/70 border-2 border-rose-200 shadow-sm' 
                  : 'hover:bg-slate-50 border-2 border-transparent'
              }`}
            >
              <div className="relative">
                <img 
                  src={pUrl} 
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-rose-200 shadow-xs" 
                  alt="avatar"
                />
                {isUserOnline && (
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-serif font-extrabold uppercase text-slate-900 truncate">{fName}</h4>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    {formatChatTime(lastTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className={`text-[11px] truncate ${unread > 0 ? "text-[#870c3f] font-black" : "text-slate-500 font-semibold"}`}>
                    {lastMsg}
                  </p>
                  {unread > 0 && (
                    <span className="bg-[#870c3f] text-white text-[10px] font-black h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center shadow-xs">
                      {unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}