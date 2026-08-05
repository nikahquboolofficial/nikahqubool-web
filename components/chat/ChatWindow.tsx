"use client";
import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, MoreVertical, CheckCheck, Heart } from 'lucide-react';
import axios from 'axios';
import * as signalR from "@microsoft/signalr";

export default function ChatWindow({ receiverId, userName, onBack }: any) {
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const BASE_URL = "https://crm.altawafumrah.com";

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

  const parseSafeDate = (dateString: string) => {
    if (!dateString) return new Date();
    if (dateString.includes('T') && !dateString.endsWith('Z') && !dateString.includes('+')) {
      try {
        const [datePart, timePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute, second] = timePart.split('.')[0].split(':').map(Number);
        return new Date(year, month - 1, day, hour, minute, second || 0);
      } catch (e) {
        return new Date(dateString);
      }
    }
    return new Date(dateString);
  };

  useEffect(() => {
    const session = getSession();
    if (session && session.userId) {
      setCurrentUserId(Number(session.userId));
    }
  }, []);

  useEffect(() => {
    if (!receiverId || !currentUserId) return;

    const loadHistory = async () => {
      try {
        const token = getToken();
        const res = await axios.get(`${BASE_URL}/api/Chat/history`, {
          params: { sId: currentUserId, rId: receiverId, page: 1, size: 50 },
          headers: { Authorization: `Bearer ${token}` }
        });

        const rawData = res.data?.data || res.data || [];
        setMessages(rawData.map((m: any) => ({
          senderId: m.senderId ?? m.SenderId, 
          text: m.messageText ?? m.MessageText, 
          timestamp: parseSafeDate(m.sentAt ?? m.SentAt ?? m.timestamp),
          isRead: (m.isRead !== undefined ? m.isRead : m.IsRead) ?? 0
        })));
      } catch (err) { console.error("History fetch error:", err); }
    };

    loadHistory();
  }, [receiverId, currentUserId]);

  useEffect(() => {
    if (!receiverId || !currentUserId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}/chatHub?userId=${currentUserId}`, {
        accessTokenFactory: () => getToken() || ""
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveMessage", (senderId, messageText) => {
      const incomingSenderId = Number(senderId);
      const targetReceiverId = Number(receiverId);

      if (incomingSenderId === targetReceiverId) {
        setMessages(prev => [...prev, { 
          senderId: incomingSenderId, 
          text: messageText, 
          timestamp: new Date(), 
          isRead: 0 
        }]);

        axios.post(`${BASE_URL}/api/Chat/mark-read`, null, {
          params: { senderId: incomingSenderId, receiverId: currentUserId },
          headers: { Authorization: `Bearer ${getToken()}` }
        }).catch(err => console.error("Auto mark-read error:", err));
      }
    });

    connection.on("MessagesRead", (data) => {
      if (data && Number(data.readerId) === Number(receiverId)) {
        setMessages(prev => prev.map(m => ({ ...m, isRead: 1 })));
      }
    });

    connection.start()
      .then(() => {
        connectionRef.current = connection;
      })
      .catch(err => console.log("SignalR Connection Error:", err));

    return () => {
      connection.off("ReceiveMessage");
      connection.off("MessagesRead");
      connection.stop();
    };
  }, [receiverId, currentUserId]);

  const handleSend = async () => {
    if (!msg.trim() || !currentUserId) return;
    const currentMsgText = msg;
    setMsg(""); 

    try {
      const token = getToken();
      await axios.post(`${BASE_URL}/api/Chat/send`, 
        {
          senderId: currentUserId, 
          receiverId: Number(receiverId), 
          messageText: currentMsgText, 
          messageType: "Text"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(prev => [...prev, { 
        senderId: currentUserId, 
        text: currentMsgText, 
        timestamp: new Date(), 
        isRead: 0 
      }]);
    } catch (e) { 
      console.error("Send Error:", e);
      setMsg(currentMsgText); 
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!currentUserId) {
    return <div className="flex h-full items-center justify-center text-slate-500 font-semibold bg-white">Loading Chat...</div>;
  }

  return (
    <div className="flex flex-col h-full w-full bg-white md:bg-[#FFF0F3] overflow-hidden relative">
      
      {/* HEADER */}
      <div className="flex-none bg-gradient-to-r from-[#D2136E] via-[#E63946] to-[#FF4D6D] p-3.5 sm:p-4 flex items-center gap-3 text-white z-30 shadow-md">
        <button onClick={onBack} className="md:hidden p-1.5 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="relative">
          <img 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=FFF0F3&color=D2136E&bold=true`} 
            className="w-10 h-10 rounded-full shadow-md border-2 border-white/40 object-cover" 
            alt="avatar"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-[#D2136E] rounded-full z-20"></span>
        </div>
        <div className="flex flex-col">
           <h3 className="font-black text-sm md:text-[16px] leading-tight uppercase italic tracking-wide flex items-center gap-1">
             {userName || 'Member'} <Heart size={14} fill="white" className="text-white animate-pulse" />
           </h3>
           <span className="text-[9px] md:text-[10px] font-bold text-pink-100 uppercase tracking-widest">
             Active Now
           </span>
        </div>
        <div className="ml-auto opacity-90 cursor-pointer hover:bg-white/10 p-2 rounded-full transition-colors">
          <MoreVertical size={20} />
        </div>
      </div>

      {/* CHAT AREA */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 pb-24 md:pb-28"
        style={{ 
          background: 'linear-gradient(135deg, #FFE5EC 0%, #FFF0F3 50%, #FFE3E8 100%)',
          backgroundImage: 'radial-gradient(#FF4D6D12 1.5px, transparent 1.5px)', 
          backgroundSize: '24px 24px' 
        }}
      >
        {messages.map((m, i) => {
          const isMe = Number(m.senderId) === currentUserId;
          const isMessageRead = m.isRead == 1 || m.isRead === true || m.isRead === "1";

          return (
            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
              <div className={`max-w-[80%] md:max-w-[65%] p-3 px-4 rounded-[24px] text-[14px] shadow-sm relative transition-all ${
                isMe 
                ? 'bg-gradient-to-r from-[#FF4D6D] to-[#D2136E] text-white rounded-br-none shadow-pink-200/50' 
                : 'bg-white text-slate-800 rounded-bl-none border border-pink-100/60 shadow-[0_4px_12px_rgba(0,0,0,0.02)]'
              }`}>
                <p className="font-semibold leading-relaxed tracking-wide break-words">{m.text}</p>
                
                <div className="flex items-center gap-1.5 mt-1.5 justify-end text-[9px]">
                  <span className={`font-bold uppercase italic opacity-70 ${isMe ? 'text-pink-100' : 'text-slate-400'}`}>
                    {m.timestamp instanceof Date ? m.timestamp.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                  </span>
                  
                  {isMe && (
                    <span className={isMessageRead ? "text-[#00F5FF] drop-shadow-[0_0_4px_#00F5FF] opacity-100" : "text-white/50"}>
                      <CheckCheck size={13} className="stroke-[3]" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* INPUT PANEL */}
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-[#FFF0F3] via-[#FFF0F3]/95 to-transparent z-40">
        <div className="max-w-4xl mx-auto bg-white p-2 pl-5 rounded-[32px] shadow-[0_12px_40px_rgba(210,19,110,0.15)] border border-pink-100 flex items-center gap-3 focus-within:ring-2 focus-within:ring-[#FF4D6D]/30 transition-all">
          <input 
            value={msg} 
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..." 
            className="flex-1 py-2 text-[14px] md:text-[15px] outline-none font-bold text-slate-700 bg-transparent placeholder-slate-400"
          />
          <button 
            onClick={handleSend} 
            className="h-10 w-10 md:h-12 md:w-12 bg-gradient-to-r from-[#FF4D6D] to-[#D2136E] rounded-full flex items-center justify-center text-white shadow-md active:scale-90 hover:opacity-95 transition-all flex-shrink-0"
          >
            <Send size={16} fill="white" className="ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}