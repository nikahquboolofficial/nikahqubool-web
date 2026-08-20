"use client";
import { useEffect, useState, useRef } from 'react';
import { Search, MessageSquare, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSignalR } from '@/context/SignalRContext';
import { fetchChatInboxApi, markChatReadApi, blockUserApiCall } from '@/lib/api';
import { getOptimizedImageUrl } from '@/lib/imageUtils';

export default function InboxList({ onSelectUser, selectedId }: any) {
  const router = useRouter();
  const { connection, onlineUsers } = useSignalR();

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
    if (parts.length === 2) return parts.pop()?.split(';').shift() ?? null;
    return null;
  };

  const getToken = (): string | null => getCookie("user_token");

  const formatChatTime = (dateString: string) => {
    if (!dateString) return "";
    const messageDate = new Date(dateString);
    const now = new Date();
    const isToday = messageDate.toDateString() === now.toDateString();
    if (isToday) return messageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return messageDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
  };

  const fetchInbox = async () => {
    const token = getToken();
    if (!token) return;
    const res = await fetchChatInboxApi(1, 30, token);
    if (res.success && res.data) {
      setChats(res.data?.data ?? res.data ?? []);
    }
  };

  useEffect(() => { 
    fetchInbox();
    const interval = setInterval(() => {
      fetchInbox();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!connection) return;

    const handleReceiveMessage = (senderId: any, messageText: string) => {
      const incomingSenderId = Number(senderId);
      setChats((prevChats) => {
        const index = prevChats.findIndex(c => Number(c.userId ?? c.UserId) === incomingSenderId);
        const isOpen = Number(selectedIdRef.current) === incomingSenderId;

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
    };

    connection.on("ReceiveMessage", handleReceiveMessage);
    return () => { connection.off("ReceiveMessage", handleReceiveMessage); };
  }, [connection]);

  const handleChatClick = async (chat: any) => {
    const targetUserId = chat.userId ?? chat.UserId;
    onSelectUser(chat);

    const unread = chat.unreadCount ?? chat.UnreadCount ?? 0;
    if (unread > 0) {
      setChats(prev => prev.map(c => ((c.userId ?? c.UserId) === targetUserId ? { ...c, unreadCount: 0, UnreadCount: 0 } : c)));
      const token = getToken();
      markChatReadApi(targetUserId, token).catch(() => {});
    }
  };

  // 🔓 INSTANT INBOX UNBLOCK HANDLER
  const handleUnblockUser = async (e: React.MouseEvent, chat: any) => {
    e.stopPropagation(); // Chat select prevent karta hai
    const targetUserId = chat.userId ?? chat.UserId;
    const token = getToken();
    if (!token) return;

    const res = await blockUserApiCall(targetUserId, token);
    if (res.success) {
      setChats(prev => prev.map(c => {
        if ((c.userId ?? c.UserId) === targetUserId) {
          return {
            ...c,
            isBlockedByMe: false,
            IsBlockedByMe: false,
            isBlocked: false,
            IsBlocked: false
          };
        }
        return c;
      }));
    } else {
      alert(res.message ?? "Failed to unblock user.");
    }
  };

  const filteredChats = chats.filter(c => (c.fullName ?? c.FullName ?? "").toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-white border-r-2 border-rose-100 selection:bg-[#d91b5c] selection:text-white">
      <div className="p-4 border-b border-rose-100 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-serif font-extrabold uppercase tracking-tight text-slate-900">Messages</h2>
          <div className="bg-rose-50 p-2 rounded-2xl text-[#d91b5c] border border-rose-200 shadow-xs">
            <MessageSquare size={18} />
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search chat..." 
            className="w-full bg-slate-50 border border-rose-100 py-2.5 pl-10 pr-4 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#d91b5c]/20 transition-all placeholder-slate-400" 
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-1.5 bg-white">
        {filteredChats.map((chat) => {
          const uId = Number(chat.userId ?? chat.UserId);
          const fName = chat.fullName ?? chat.FullName ?? "User";
          const lastMsg = chat.lastMessage ?? chat.LastMessage ?? "Start a conversation...";
          const lastTime = chat.lastMessageTime ?? chat.LastMessageTime;
          const unread = chat.unreadCount ?? chat.UnreadCount ?? 0;
          const isSelected = Number(selectedId) === uId;
          const isUserOnline = onlineUsers[uId] ? onlineUsers[uId].isOnline : Boolean(chat.isOnline ?? chat.IsOnline);

          // 🎯 INSTAGRAM / FACEBOOK STYLE BLOCK PREVIEW TEXT
          const isBlockedByMe = Boolean(chat.isBlockedByMe ?? chat.IsBlockedByMe);
          const isBlockedByOther = Boolean(chat.isBlockedByOther ?? chat.IsBlockedByOther);
          const isBlocked = Boolean(chat.isBlocked ?? chat.IsBlocked);
          
          let displayPreview = lastMsg;
          if (isBlockedByMe) displayPreview = "You blocked this user";
          else if (isBlockedByOther || isBlocked) displayPreview = "User unavailable";

          const rawPhoto = chat.photoUrl ?? chat.PhotoUrl;
          const pUrl = rawPhoto ? getOptimizedImageUrl(rawPhoto) : `https://ui-avatars.com/api/?name=${encodeURIComponent(fName)}&background=FFF0F3&color=870c3f&bold=true`;

          return (
            <div 
              key={uId} 
              onClick={() => handleChatClick(chat)}
              className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                isSelected 
                  ? 'bg-rose-50/80 border border-rose-200 shadow-xs' 
                  : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="relative flex-shrink-0 w-12 h-12">
                <img 
                  src={pUrl} 
                  className="w-12 h-12 rounded-full object-cover object-top border-2 border-rose-200 shadow-xs flex-shrink-0" 
                  alt="avatar"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                />
                {isUserOnline && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs z-10" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-serif font-extrabold uppercase text-slate-900 truncate">{fName}</h4>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    {formatChatTime(lastTime)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-1 gap-2">
                  <p className={`text-[11px] truncate flex-1 ${
                    (isBlockedByMe || isBlockedByOther || isBlocked)
                      ? "text-rose-500 font-bold italic"
                      : unread > 0 ? "text-[#d91b5c] font-black" : "text-slate-500 font-semibold"
                  }`}>
                    {displayPreview}
                  </p>

                  {/* 🔓 DIRECT UNBLOCK BUTTON IN INBOX ITEM */}
                  {isBlockedByMe && (
                    <button 
                      type="button"
                      onClick={(e) => handleUnblockUser(e, chat)}
                      className="text-[10px] font-black text-[#d91b5c] bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                    >
                      <UserX size={11} /> Unblock
                    </button>
                  )}

                  {unread > 0 && !isBlockedByMe && !isBlockedByOther && !isBlocked && (
                    <span className="bg-[#d91b5c] text-white text-[10px] font-black h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center shadow-xs shrink-0">
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
