"use client";
import { useState, useEffect, Suspense } from 'react';
import InboxList from '@/components/chat/InboxList';
import ChatWindow from '@/components/chat/ChatWindow';
import { MessageSquare, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

function MessagesContainer() {
  const [selectedChat, setSelectedChat] = useState<any>(null);

  useEffect(() => {
    const savedTarget = sessionStorage.getItem('active_chat_target');
    if (savedTarget) {
      try {
        const parsedTarget = JSON.parse(savedTarget);
        setSelectedChat(parsedTarget);
        sessionStorage.removeItem('active_chat_target');
      } catch (e) {
        console.error("Error parsing target chat:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent('chat_view_changed', { 
        detail: { isChatOpen: Boolean(selectedChat) } 
      }));
    }
  }, [selectedChat]);

  return (
    <div className="flex h-[100dvh] md:h-[calc(100vh-80px)] w-full max-w-7xl mx-auto bg-white md:shadow-2xl md:rounded-3xl overflow-hidden my-0 md:my-3 border-0 md:border-2 border-rose-100 selection:bg-[#d91b5c] selection:text-white fixed inset-0 md:static z-[99]">
      
      {/* SIDEBAR INBOX */}
      <div className={`w-full md:w-[360px] lg:w-[420px] h-full flex-shrink-0 border-r-2 border-rose-100 bg-white ${selectedChat ? 'hidden md:block' : 'block'}`}>
        <InboxList 
          selectedId={selectedChat?.userId ?? selectedChat?.UserId} 
          onSelectUser={(chat: any) => setSelectedChat(chat)} 
        />
      </div>

      {/* CHAT WINDOW */}
      <div className={`flex-1 h-full min-w-0 bg-slate-50 flex flex-col ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {selectedChat ? (
          <ChatWindow 
            receiverId={selectedChat.userId ?? selectedChat.UserId} 
            userName={selectedChat.fullName ?? selectedChat.FullName} 
            photoUrl={selectedChat.photoUrl ?? selectedChat.PhotoUrl ?? selectedChat.mainPhotoUrl ?? selectedChat.MainPhotoUrl}
            initialIsOnline={selectedChat.isOnline ?? selectedChat.IsOnline}
            initialLastSeen={selectedChat.lastSeen ?? selectedChat.LastSeen}
            onBack={() => setSelectedChat(null)} 
          />
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-8 bg-gradient-to-b from-rose-50/40 via-white to-slate-50 space-y-4">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="w-20 h-20 bg-rose-50 text-[#d91b5c] rounded-full flex items-center justify-center border-2 border-rose-200 shadow-xl"
            >
              <MessageSquare size={36} className="text-[#d91b5c]" />
            </motion.div>
            
            <div>
              <h3 className="text-xl font-serif font-extrabold text-slate-900 uppercase tracking-tight">Select a Conversation</h3>
              <p className="text-xs font-semibold text-slate-500 max-w-sm mt-1 leading-relaxed">
                Choose a soulmate proposal from your left inbox list to start private end-to-end encrypted messaging.
              </p>
            </div>

            <div className="px-5 py-2 rounded-full bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] text-white text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-1.5 border border-rose-300/30">
              <Sparkles size={13} className="text-amber-300" /> Direct Messaging Unlocked
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen flex-col items-center justify-center text-[#d91b5c] font-black text-xs uppercase tracking-widest gap-3 bg-slate-50">
        <Loader2 size={42} className="animate-spin text-[#d91b5c]" />
        <span>Loading Messenger...</span>
      </div>
    }>
      <MessagesContainer />
    </Suspense>
  );
}
