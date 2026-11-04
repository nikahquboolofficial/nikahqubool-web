"use client";
import React, { useState, useEffect, Suspense, Component, ErrorInfo, ReactNode } from 'react';
import InboxList from '@/components/chat/InboxList';
import ChatWindow from '@/components/chat/ChatWindow';
import { MessageSquare, Sparkles, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

class ChatErrorBoundary extends Component<{ children: ReactNode; onReset?: () => void; resetKey?: any }, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps: any) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Chat Window Error caught by ChatErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4 bg-rose-50/40">
          <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shadow-md">
            <AlertTriangle size={30} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Chat Window Reconnected</h3>
            <p className="text-xs text-slate-500 max-w-xs">
              Chat session refreshed. Click below to continue uninterrupted.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
            className="px-5 py-2.5 rounded-full bg-[#d91b5c] hover:bg-[#b01348] text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-all"
          >
            <RefreshCw size={14} /> Open Chat
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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

  // 🔔 Handle direct conversation switch from incoming notification banner
  useEffect(() => {
    const handleOpenDirect = (e: any) => {
      if (e.detail) {
        setSelectedChat(e.detail);
      }
    };
    window.addEventListener('open_chat_direct', handleOpenDirect);
    return () => window.removeEventListener('open_chat_direct', handleOpenDirect);
  }, []);

  // 🎯 Track currently active open chat globally so notifications for THIS user are muted
  useEffect(() => {
    if (typeof window !== "undefined") {
      const activeId = selectedChat ? Number(selectedChat.userId ?? selectedChat.UserId) : null;
      (window as any).activeChatReceiverId = activeId;
      window.dispatchEvent(new CustomEvent('active_chat_selected', { 
        detail: { activeReceiverId: activeId } 
      }));
      window.dispatchEvent(new CustomEvent('chat_view_changed', { 
        detail: { isChatOpen: Boolean(selectedChat) } 
      }));
    }
    return () => {
      if (typeof window !== "undefined") {
        (window as any).activeChatReceiverId = null;
        window.dispatchEvent(new CustomEvent('active_chat_selected', { 
          detail: { activeReceiverId: null } 
        }));
      }
    };
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
      <div className={`flex-1 h-full min-w-0 bg-[#FAF8F5] flex flex-col ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {selectedChat ? (
          <ChatErrorBoundary 
            resetKey={selectedChat.userId ?? selectedChat.UserId}
            onReset={() => setSelectedChat({ ...selectedChat })}
          >
            <ChatWindow 
              key={`chat-win-${selectedChat.userId ?? selectedChat.UserId}`}
              receiverId={selectedChat.userId ?? selectedChat.UserId} 
              userName={selectedChat.fullName ?? selectedChat.FullName} 
              photoUrl={selectedChat.photoUrl ?? selectedChat.PhotoUrl ?? selectedChat.mainPhotoUrl ?? selectedChat.MainPhotoUrl}
              initialIsOnline={selectedChat.isOnline ?? selectedChat.IsOnline}
              initialLastSeen={selectedChat.lastSeen ?? selectedChat.LastSeen}
              initialAccountState={selectedChat.accountState ?? selectedChat.AccountState}
              onBack={() => setSelectedChat(null)} 
            />
          </ChatErrorBoundary>
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-8 bg-gradient-to-b from-[#FAF8F5] via-white to-[#FAF8F5] space-y-4">
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
      <div className="flex h-screen w-full bg-slate-50 p-4 animate-pulse">
        <div className="w-full md:w-96 h-full bg-white rounded-3xl p-4 border border-slate-200 space-y-4">
          <div className="w-32 h-6 bg-slate-300 rounded-md" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-28 h-4 bg-slate-300 rounded-md" />
                  <div className="w-40 h-3 bg-slate-200 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <MessagesContainer />
    </Suspense>
  );
}
