"use client";

import { ProfileStatusIcons } from '@/components/common/ProfileBadges';
import { useEffect, useState, useRef } from 'react';
import { Search, MessageSquare, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSignalR } from '@/context/SignalRContext';
import { fetchChatInboxApi, markChatReadApi, blockUserApiCall } from '@/lib/api';
import { getOptimizedImageUrl, DEFAULT_FEMALE_AVATAR } from '@/lib/imageUtils';
import { getAuthToken } from '@/lib/auth';

export default function InboxList({ onSelectUser, selectedId }: any) {
  const router = useRouter();
  const { connection, onlineUsers, typingUsers } = useSignalR();

  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const selectedIdRef = useRef(selectedId); 

  useEffect(() => {
    // When user closes active chat (onBack) or selectedId becomes null/undefined, refresh inbox
    if (!selectedId && selectedIdRef.current) {
      fetchInbox();
    }
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // ⚡ 0ms INSTANT HYDRATION FROM SESSION CACHE (Zero Empty-Flicker)
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("cached_chat_inbox");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setChats(parsed);
            setLoading(false);
          }
        }
      } catch (e) {}
    }
  }, []);

  // ⚡ Sync Unread Count to Bottom Nav & Global Layout whenever chats change
  useEffect(() => {
    if (typeof window !== "undefined" && Array.isArray(chats)) {
      const total = chats.reduce((sum, c) => sum + Number(c.unreadCount ?? c.UnreadCount ?? 0), 0);
      window.dispatchEvent(new CustomEvent('chat_unread_count_updated', { detail: { count: total } }));
      try {
        sessionStorage.setItem('cached_chat_inbox', JSON.stringify(chats));
      } catch (e) {}
    }
  }, [chats]);

  const getToken = (): string | null => getAuthToken();
  const processedInboxMsgIdsRef = useRef<Set<string>>(new Set());

  const parseUtcDate = (dateVal: any) => {
    if (!dateVal) return new Date();
    if (typeof dateVal === 'object' && dateVal instanceof Date) {
      return isNaN(dateVal.getTime()) ? new Date() : dateVal;
    }
    try {
      // Clean string and strip trailing Z to preserve Indian Standard Time without artificial +5:30 offset
      const str = String(dateVal).trim().replace(/z$/i, '').replace(' ', 'T');
      const d = new Date(str);
      return isNaN(d.getTime()) ? new Date() : d;
    } catch {
      return new Date();
    }
  };

  const formatChatTime = (dateString: string) => {
    if (!dateString) return "";
    const messageDate = parseUtcDate(dateString);
    const now = new Date();
    const isToday = messageDate.toDateString() === now.toDateString();
    if (isToday) return messageDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return messageDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
  };

  const fetchInbox = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetchChatInboxApi(1, 50, token);
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);
      setChats(list);
      if (typeof window !== "undefined") {
        try { sessionStorage.setItem("cached_chat_inbox", JSON.stringify(list)); } catch (e) {}
      }
    } catch {
      // keep existing if any
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchInbox();
  }, []);

  // 🔔 REAL-TIME MESSAGE RECEPTION (DIRECT SINGLE GLOBAL EVENT BUS WITH DEDUPLICATION)
  useEffect(() => {
    const handleIncomingMessage = (senderId: any, rId: any, messageText: string, msgId?: any, sentAt?: string) => {
      const incomingSenderId = Number(senderId);
      const incomingReceiverId = Number(rId);

      // Deduplicate rapid or duplicate dispatches by unique msgId
      if (msgId) {
        const idKey = String(msgId);
        if (processedInboxMsgIdsRef.current.has(idKey)) return;
        processedInboxMsgIdsRef.current.add(idKey);
      }

      setChats((prevChats) => {
        const currentList = Array.isArray(prevChats) ? prevChats : [];
        const index = currentList.findIndex(c => {
          const cId = Number(c.userId ?? c.UserId);
          return cId === incomingSenderId || cId === incomingReceiverId;
        });

        const isOpen = Number(selectedIdRef.current) === incomingSenderId || Number(selectedIdRef.current) === incomingReceiverId;

        if (index !== -1) {
          const updated = [...currentList];
          const target = { ...updated[index] };
          target.lastMessage = messageText;
          target.lastMessageTime = sentAt || new Date().toISOString();
          if (!isOpen && incomingSenderId === Number(target.userId ?? target.UserId)) {
            target.unreadCount = (target.unreadCount ?? target.UnreadCount ?? 0) + 1;
          }
          updated.splice(index, 1);
          const finalList = [target, ...updated];
          try { sessionStorage.setItem("cached_chat_inbox", JSON.stringify(finalList)); } catch (e) {}
          return finalList;
        } else {
          fetchInbox();
          return currentList;
        }
      });
    };

    const handleGlobalMsg = (e: any) => {
      const { senderId, receiverId, messageText, msgId, sentAt } = e.detail || {};
      if (senderId && messageText) {
        handleIncomingMessage(senderId, receiverId, messageText, msgId, sentAt);
      }
    };

    // ⚡ INSTANT INBOX SYNC: When current user sends a message to any new or existing user
    const handleConversationUpdated = (e: any) => {
      const data = e.detail;
      if (!data || !data.userId) return;
      const targetUserId = Number(data.userId);

      setChats((prevChats) => {
        const currentList = Array.isArray(prevChats) ? [...prevChats] : [];
        const index = currentList.findIndex(c => Number(c.userId ?? c.UserId) === targetUserId);

        if (index !== -1) {
          const target = { ...currentList[index] };
          target.lastMessage = data.lastMessage;
          target.lastMessageTime = data.lastMessageTime || new Date().toISOString();
          currentList.splice(index, 1);
          const updated = [target, ...currentList];
          try { sessionStorage.setItem("cached_chat_inbox", JSON.stringify(updated)); } catch (err) {}
          return updated;
        } else {
          const newChat = {
            userId: targetUserId,
            fullName: data.fullName || 'Member',
            photoUrl: data.photoUrl || '',
            lastMessage: data.lastMessage,
            lastMessageTime: data.lastMessageTime || new Date().toISOString(),
            unreadCount: 0,
            accountState: 'Active',
            isOnline: true
          };
          const updated = [newChat, ...currentList];
          try { sessionStorage.setItem("cached_chat_inbox", JSON.stringify(updated)); } catch (err) {}
          fetchInbox();
          return updated;
        }
      });
    };

    const handleRefresh = () => {
      fetchInbox();
    };

    window.addEventListener("global_message_received", handleGlobalMsg);
    window.addEventListener("chat_conversation_updated", handleConversationUpdated);
    window.addEventListener("refresh_inbox_list", handleRefresh);
    window.addEventListener("focus", handleRefresh);

    return () => {
      window.removeEventListener("global_message_received", handleGlobalMsg);
      window.removeEventListener("chat_conversation_updated", handleConversationUpdated);
      window.removeEventListener("refresh_inbox_list", handleRefresh);
      window.removeEventListener("focus", handleRefresh);
    };
  }, []);

  const handleChatClick = async (chat: any) => {
    const targetUserId = chat.userId ?? chat.UserId;
    const accountStateStr = String(chat.accountState || chat.AccountState || '').toLowerCase();

    const isDeleted = Boolean(
      (chat.isDeleted ?? chat.IsDeleted) ||
      accountStateStr.includes('del') ||
      (chat.fullName && String(chat.fullName).toLowerCase() === 'deleted user')
    );
    const isDeactive = !isDeleted && Boolean(
      (chat.isDeactive ?? chat.IsDeactive) ||
      accountStateStr.includes('deact') || 
      accountStateStr.includes('pause') ||
      (chat.fullName && String(chat.fullName).toLowerCase() === 'deactivated user')
    );
    const isAdminBlocked = !isDeleted && !isDeactive && Boolean(
      (chat.isAdminBlocked ?? chat.IsAdminBlocked) ||
      accountStateStr.includes('admin') ||
      (chat.fullName && String(chat.fullName).toLowerCase() === 'user unavailable')
    );

    let chatToPass = { ...chat };
    if (isDeleted) {
      chatToPass = {
        ...chat,
        fullName: "Deleted User",
        FullName: "Deleted User",
        photoUrl: DEFAULT_FEMALE_AVATAR,
        PhotoUrl: DEFAULT_FEMALE_AVATAR,
        accountState: "Deleted",
        isDeleted: true
      };
    } else if (isDeactive) {
      chatToPass = {
        ...chat,
        fullName: "Deactivated User",
        FullName: "Deactivated User",
        photoUrl: DEFAULT_FEMALE_AVATAR,
        PhotoUrl: DEFAULT_FEMALE_AVATAR,
        accountState: "Deactivated",
        isDeactive: true
      };
    } else if (isAdminBlocked) {
      chatToPass = {
        ...chat,
        fullName: "User Unavailable",
        FullName: "User Unavailable",
        photoUrl: DEFAULT_FEMALE_AVATAR,
        PhotoUrl: DEFAULT_FEMALE_AVATAR,
        accountState: "Blocked",
        isAdminBlocked: true
      };
    }

    onSelectUser(chatToPass);

    const unread = chat.unreadCount ?? chat.UnreadCount ?? 0;
    if (unread > 0) {
      setChats(prev => {
        const updated = prev.map(c => ((c.userId ?? c.UserId) === targetUserId ? { ...c, unreadCount: 0, UnreadCount: 0 } : c));
        try {
          sessionStorage.setItem("cached_chat_inbox", JSON.stringify(updated));
          const totalUnread = updated.reduce((sum, c) => sum + Number(c.unreadCount ?? c.UnreadCount ?? 0), 0);
          window.dispatchEvent(new CustomEvent('chat_unread_count_updated', { detail: { count: totalUnread } }));
        } catch (e) {}
        return updated;
      });
      const token = getToken();
      markChatReadApi(targetUserId, token).catch(() => {});
    }
  };

  // 🔓 INSTANT INBOX UNBLOCK HANDLER
  const handleUnblockUser = async (e: React.MouseEvent, chat: any) => {
    e.stopPropagation();
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

  const safeChatList = Array.isArray(chats) ? chats : [];
  const filteredChats = safeChatList.filter(c => (c.fullName ?? c.FullName ?? "").toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-white border-r border-rose-100/80 selection:bg-[#d91b5c] selection:text-white">
      <div className="p-4 border-b border-rose-100/80 bg-white/90 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-serif font-black uppercase tracking-tight text-slate-900">Messages</h2>
            {safeChatList.length > 0 && (
              <span className="text-[10px] font-black bg-rose-50 text-[#d91b5c] px-2 py-0.5 rounded-full border border-rose-200/60">
                {safeChatList.length}
              </span>
            )}
          </div>
          <div className="bg-rose-50 p-2 rounded-2xl text-[#d91b5c] border border-rose-200/60 shadow-xs">
            <MessageSquare size={18} />
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search chat..." 
            className="w-full bg-rose-50/40 border border-rose-100/80 py-2.5 pl-10 pr-4 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#d91b5c]/20 focus:border-[#d91b5c] transition-all placeholder-slate-400" 
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-1.5 bg-white pb-24 md:pb-4">
        {loading && safeChatList.length === 0 ? (
          <div className="space-y-2 p-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 animate-pulse border border-slate-100/80">
                <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="w-28 h-3.5 bg-slate-200 rounded-md" />
                    <div className="w-10 h-2.5 bg-slate-150 rounded-md" />
                  </div>
                  <div className="w-40 h-3 bg-slate-150 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-[#d91b5c] flex items-center justify-center mx-auto">
              <MessageSquare size={20} />
            </div>
            <p className="text-xs font-bold text-slate-500">No conversations yet</p>
            <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">Send a proposal or message from Find Match to start chatting</p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const uId = Number(chat.userId ?? chat.UserId);
            const accountStateStr = String(chat.accountState || chat.AccountState || '').toLowerCase();

            const isDeleted = Boolean(
              (chat.isDeleted ?? chat.IsDeleted) || 
              accountStateStr.includes('del') ||
              (chat.fullName && String(chat.fullName).toLowerCase() === 'deleted user') ||
              ((chat.isActive === false || chat.IsActive === false) && !accountStateStr.includes('deact') && !accountStateStr.includes('pause'))
            );
            const isDeactive = !isDeleted && Boolean(
              (chat.isDeactive ?? chat.IsDeactive) || 
              accountStateStr.includes('deact') || 
              accountStateStr.includes('pause') ||
              (chat.fullName && String(chat.fullName).toLowerCase() === 'deactivated user')
            );
            const isAdminBlocked = !isDeleted && !isDeactive && Boolean(
              (chat.isAdminBlocked ?? chat.IsAdminBlocked) || 
              accountStateStr.includes('admin') ||
              (chat.fullName && String(chat.fullName).toLowerCase() === 'user unavailable')
            );

            const fName = isDeleted ? "Deleted User" : (isDeactive ? "Deactivated User" : (isAdminBlocked ? "User Unavailable" : (chat.fullName ?? chat.FullName ?? "User")));
            const lastMsg = chat.lastMessage ?? chat.LastMessage ?? "Start a conversation...";
            const lastTime = chat.lastMessageTime ?? chat.LastMessageTime;
            const unread = chat.unreadCount ?? chat.UnreadCount ?? 0;
            const isSelected = Number(selectedId) === uId;
            const isUserOnline = !isDeleted && !isDeactive && !isAdminBlocked && (onlineUsers[uId] ? Boolean(onlineUsers[uId].isOnline) : false);
            const isUserTyping = Boolean(typingUsers[uId]);

            // 🎯 BLOCK PREVIEWS
            const isBlockedByMe = Boolean(chat.isBlockedByMe ?? chat.IsBlockedByMe);
            const isBlockedByOther = Boolean(chat.isBlockedByOther ?? chat.IsBlockedByOther);
            const isBlocked = Boolean(chat.isBlocked ?? chat.IsBlocked);
            
            let displayPreview = lastMsg;
            if (isUserTyping) displayPreview = "typing...";
            else if (isDeleted) displayPreview = "Account Deleted";
            else if (isDeactive) displayPreview = "Account Paused";
            else if (isAdminBlocked) displayPreview = "User Unavailable";
            else if (isBlockedByMe) displayPreview = "You blocked this user";
            else if (isBlockedByOther || isBlocked) displayPreview = "User unavailable";

            const rawPhoto = chat.photoUrl ?? chat.PhotoUrl;
            const pUrl = (isDeleted || isDeactive || isAdminBlocked)
              ? DEFAULT_FEMALE_AVATAR 
              : (rawPhoto ? getOptimizedImageUrl(rawPhoto) : `https://ui-avatars.com/api/?name=${encodeURIComponent(fName)}&background=FFF0F3&color=870c3f&bold=true`);

            return (
              <div 
                key={uId} 
                onClick={() => handleChatClick(chat)}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-rose-50/90 border border-rose-200/90 shadow-xs ring-1 ring-[#d91b5c]/15' 
                    : 'hover:bg-rose-50/40 border border-transparent hover:border-rose-100/60'
                }`}
              >
                <div className="relative flex-shrink-0 w-12 h-12">
                  <img 
                    src={pUrl} 
                    className="w-12 h-12 rounded-full object-cover object-top border-2 border-[#d91b5c]/25 shadow-xs flex-shrink-0" 
                    alt="avatar"
                    onError={(e) => { 
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = DEFAULT_FEMALE_AVATAR; 
                  }}
                  />
                  {isUserOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs ring-1 ring-emerald-300 z-10" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4 className="text-xs font-serif font-black uppercase text-slate-900 truncate">{fName}</h4>
                      {!isDeleted && !isDeactive && !isAdminBlocked && <ProfileStatusIcons profile={chat} size={15} />}
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                      {formatChatTime(lastTime)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1 gap-2">
                    <p className={`text-[11px] truncate flex-1 ${
                      isUserTyping
                        ? "text-emerald-600 font-black animate-pulse"
                        : (isBlockedByMe || isBlockedByOther || isBlocked)
                          ? "text-rose-500 font-bold italic"
                          : unread > 0 ? "text-[#d91b5c] font-black" : "text-slate-500 font-semibold"
                    }`}>
                      {displayPreview}
                    </p>

                    {/* 🔓 UNBLOCK BUTTON */}
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
                      <span className="bg-gradient-to-r from-[#d91b5c] to-rose-600 text-white text-[10px] font-black h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center shadow-xs shrink-0">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
