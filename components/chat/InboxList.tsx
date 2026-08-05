"use client";
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Search, MessageSquare, Sparkles, UserPlus } from 'lucide-react';
import * as signalR from '@microsoft/signalr';

export default function InboxList({ onSelectUser, selectedId }: any) {
  const [chats, setChats] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const selectedIdRef = useRef(selectedId); 
  const BASE_URL = "https://crm.altawafumrah.com";

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // --- SESSION HELPERS ---
  const getSession = () => {
    if (typeof window !== "undefined") {
      const session = localStorage.getItem('user_session');
      if (session) {
        try { return JSON.parse(session); } catch (e) { /* ignore */ }
      }
      const value = `; ${document.cookie}`;
      const parts = value.split(`; user_token=`);
      if (parts.length === 2) {
        const token = parts.pop()?.split(';').shift();
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || payload.sub;
            return { userId: userId ? Number(userId) : null, token };
          } catch (e) { /* ignore */ }
        }
      }
    }
    return null;
  };

  const getToken = () => {
    const session = getSession();
    return session ? session.token : null;
  };

  // --- TIME FORMATTING ---
  const formatChatTime = (dateString: string) => {
    if (!dateString) return "";
    let messageDate: Date;
    if (dateString.includes('T')) {
      try {
        const [datePart, timePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute, second] = timePart.split('.')[0].split(':').map(Number);
        messageDate = new Date(year, month - 1, day, hour, minute, second || 0);
      } catch (e) {
        messageDate = new Date(dateString);
      }
    } else {
      messageDate = new Date(dateString);
    }

    const now = new Date();
    const diffInMs = now.getTime() - messageDate.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));

    if (diffInMins < 1 && diffInMs >= -15000) return "Just now";

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const msgDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

    if (msgDateOnly.getTime() === startOfToday.getTime()) {
      return messageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    if (msgDateOnly.getTime() === startOfYesterday.getTime()) return "Yesterday";

    const day = String(messageDate.getDate()).padStart(2, '0');
    const month = String(messageDate.getMonth() + 1).padStart(2, '0');
    const year = String(messageDate.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const session = getSession();
    if (session && session.userId) {
      setCurrentUserId(Number(session.userId));
    }
  }, []);

  const fetchInbox = async () => {
    const session = getSession();
    if (!session || !session.userId) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/Chat/inbox/${session.userId}`, {
        headers: { Authorization: `Bearer ${session.token}` }
      });
      const data = res.data?.data || res.data || [];
      setChats(data);
    } catch (err) { 
      console.error("Inbox fetch error:", err); 
    }
  };

  // SIGNALR REAL-TIME LISTENER
  useEffect(() => {
    if (!currentUserId) return;
    fetchInbox();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}/chatHub?userId=${currentUserId}`, {
        accessTokenFactory: () => getToken() || ""
      })
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        connection.on("ReceiveMessage", (senderId, messageText) => {
          const incomingSenderId = Number(senderId);

          setChats((prevChats) => {
            const existingChatIndex = prevChats.findIndex(c => (c.userId ?? c.UserId) === incomingSenderId);
            const isChatCurrentlyOpen = selectedIdRef.current === incomingSenderId;

            const localNow = new Date();
            const offset = localNow.getTimezoneOffset() * 60000;
            const localISOTime = new Date(localNow.getTime() - offset).toISOString().slice(0, -1);

            if (existingChatIndex !== -1) {
              const updatedChats = [...prevChats];
              const targetChat = { ...updatedChats[existingChatIndex] };

              targetChat.lastMessage = messageText;
              targetChat.lastMessageTime = localISOTime; 

              if (!isChatCurrentlyOpen) {
                targetChat.unreadCount = (targetChat.unreadCount || targetChat.UnreadCount || 0) + 1;
              }

              updatedChats.splice(existingChatIndex, 1);
              return [targetChat, ...updatedChats];
            } else {
              fetchInbox();
              return prevChats;
            }
          });
        });

        connection.on("UserStatusChanged", (userId, isOnline) => {
          const targetUserId = Number(userId);
          setChats((prevChats) => 
            prevChats.map(c => ((c.userId ?? c.UserId) === targetUserId ? { ...c, isOnline: isOnline } : c))
          );
        });
      })
      .catch(err => console.error("Inbox SignalR Error:", err));

    return () => {
      connection.off("ReceiveMessage");
      connection.off("UserStatusChanged");
      connection.stop();
    };
  }, [currentUserId]);

  const handleChatClick = async (chat: any) => {
    const targetUserId = chat.userId ?? chat.UserId;
    onSelectUser(chat);

    const currentUnread = chat.unreadCount ?? chat.UnreadCount ?? 0;
    if (currentUnread > 0) {
      setChats(prevChats =>
        prevChats.map(c => ((c.userId ?? c.UserId) === targetUserId ? { ...c, unreadCount: 0, UnreadCount: 0 } : c))
      );

      try {
        const token = getToken();
        await axios.post(`${BASE_URL}/api/Chat/mark-read`, null, {
          params: { senderId: targetUserId, receiverId: currentUserId },
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) { 
        console.error("Mark read API error:", err); 
      }
    }
  };

  const filteredChats = chats.filter(chat => {
    const name = chat.fullName ?? chat.FullName ?? "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (!currentUserId) {
    return <div className="flex h-full items-center justify-center text-slate-400 font-semibold bg-white">Loading Inbox...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white md:bg-[#FDF2F5]/30">
      
      {/* HEADER */}
      <div className="flex-none p-5 md:p-6 bg-white/90 backdrop-blur-xl border-b border-pink-50 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-black italic text-[#D2136E] uppercase tracking-tighter leading-none">Messages</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest flex items-center gap-1">
              <Sparkles size={10} className="text-pink-400" /> Recent Conversations
            </p>
          </div>
          <div className="bg-pink-50 p-2 rounded-xl text-[#D2136E] hidden md:block">
            <MessageSquare size={20} />
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#D2136E] transition-colors" size={18} />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..." 
            className="w-full bg-gray-50/50 border border-pink-100 py-3.5 pl-12 pr-4 rounded-[22px] text-sm font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-pink-100/50 transition-all shadow-sm" 
          />
        </div>
      </div>

      {/* SCROLLABLE LIST */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => {
            const uId = chat.userId ?? chat.UserId;
            const fName = chat.fullName ?? chat.FullName ?? "Member";
            const lastMsg = chat.lastMessage ?? chat.LastMessage;
            const lastTime = chat.lastMessageTime ?? chat.LastMessageTime;
            const unread = chat.unreadCount ?? chat.UnreadCount ?? 0;
            const isSelected = selectedId === uId;

            return (
              <div 
                key={uId} 
                onClick={() => handleChatClick(chat)}
                className={`flex items-center gap-4 p-4 rounded-[28px] cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                  isSelected 
                  ? 'bg-white shadow-[0_15px_35px_rgba(210,19,110,0.08)] border border-pink-100 scale-[1.02]' 
                  : 'hover:bg-white/70 border border-transparent hover:shadow-md'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fName)}&background=FDF2F5&color=D2136E&bold=true&font-size=0.4`} 
                    className="w-14 h-14 rounded-[22px] shadow-sm relative z-10 border border-white object-cover" 
                    alt="avatar"
                  />
                  {chat.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full z-20 shadow-sm animate-pulse"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0 z-10">
                  <div className="flex justify-between items-center mb-0.5">
                    <h4 className="text-[14px] font-black italic uppercase text-slate-800 truncate tracking-tight">{fName}</h4>
                    <span className="text-[9px] font-black text-slate-400 uppercase italic whitespace-nowrap">
                      {formatChatTime(lastTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-[12px] truncate ${unread > 0 ? "text-[#D2136E] font-black" : "text-slate-400 font-medium"}`}>
                      {lastMsg || "Start a conversation..."}
                    </p>
                    {unread > 0 && (
                      <span className="bg-[#D2136E] text-white text-[9px] font-black h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center shadow-lg shadow-pink-200">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#D2136E]"></div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center h-full">
            <div className="w-24 h-24 bg-white rounded-[35px] shadow-xl shadow-pink-100/50 flex items-center justify-center mb-6 border border-pink-50 relative">
               <div className="absolute -top-2 -right-2 bg-pink-500 text-white p-1.5 rounded-full animate-bounce shadow-lg">
                  <Sparkles size={14} />
               </div>
               <UserPlus size={40} className="text-pink-100" />
            </div>
            <h3 className="text-lg font-black italic text-slate-700 uppercase tracking-tighter">Quiet Here...</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase mt-2 leading-relaxed tracking-widest max-w-[200px]">
              Find your soulmate and start a beautiful journey today!
            </p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}