"use client";
import React, { useState, useEffect, Suspense, Component, ErrorInfo, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
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

  handleReset = () => {
    if (typeof window !== "undefined") {
      try {
        const key = this.props.resetKey;
        if (key) {
          sessionStorage.removeItem(`cached_chat_history_${key}`);
        }
        sessionStorage.removeItem('active_chat_target');
      } catch (e) {}
      // If chunk script or initialization mismatch, perform clean reload to hydrate latest build
      if (this.state.error?.name === 'ReferenceError' || String(this.state.error?.message).includes('initialization')) {
        window.location.reload();
        return;
      }
    }
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4 bg-white">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-[#E21E5B] shadow-sm border border-rose-100">
            <AlertTriangle size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Chat Window Reconnected</h3>
            <p className="text-xs text-slate-500 max-w-xs">
              Chat session refreshed. Click below to continue uninterrupted.
            </p>
            {this.state.error && (
              <p className="text-[10px] text-rose-500 font-mono bg-rose-50/70 p-2 rounded-xl max-w-xs overflow-x-auto text-left mx-auto border border-rose-100">
                {this.state.error.message || String(this.state.error)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#E21E5B] to-[#C2185B] text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition active:scale-95"
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
  const [chatNonce, setChatNonce] = useState(0);
  const searchParams = useSearchParams();

  useEffect(() => {
    const savedTarget = sessionStorage.getItem('active_chat_target');
    if (savedTarget) {
      try {
        const parsedTarget = JSON.parse(savedTarget);
        if (parsedTarget && (parsedTarget.userId || parsedTarget.UserId)) {
          setSelectedChat(parsedTarget);
          sessionStorage.removeItem('active_chat_target');
          return;
        }
      } catch (e) {
        console.error("Error parsing target chat:", e);
      }
    }

    // Direct URL search param fallback from Activity/Find Match
    const paramUserId = searchParams.get('targetUserId') || searchParams.get('userId');
    if (paramUserId) {
      const name = searchParams.get('targetName') || searchParams.get('name') || 'Member';
      const photo = searchParams.get('targetPhoto') || searchParams.get('photo') || '';
      setSelectedChat({
        userId: Number(paramUserId),
        fullName: name,
        name: name,
        photoUrl: photo
      });
    }
  }, [searchParams]);

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
        window.dispatchEvent(new CustomEvent('chat_view_changed', { 
          detail: { isChatOpen: false } 
        }));
      }
    };
  }, [selectedChat]);

  return (
    <div className="flex h-[100dvh] md:h-[calc(100vh-80px)] w-full max-w-7xl mx-auto bg-white md:shadow-xl md:rounded-3xl overflow-hidden my-0 md:my-3 border-0 md:border border-slate-200/90 selection:bg-[#E21E5B] selection:text-white fixed inset-0 md:static z-[99]">
      
      {/* SIDEBAR INBOX */}
      <div className={`w-full md:w-[360px] lg:w-[420px] h-full flex-shrink-0 border-r border-slate-100 bg-white ${selectedChat ? 'hidden md:block' : 'block'}`}>
        <InboxList 
          selectedId={selectedChat?.userId ?? selectedChat?.UserId} 
          onSelectUser={(chat: any) => setSelectedChat(chat)} 
        />
      </div>

      {/* CHAT WINDOW */}
      <div className={`flex-1 h-full min-w-0 bg-[#F8FAFC] flex flex-col ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {selectedChat ? (
          <ChatErrorBoundary 
            resetKey={`${selectedChat.userId ?? selectedChat.UserId}-${chatNonce}`}
            onReset={() => {
              setChatNonce(prev => prev + 1);
              setSelectedChat({ ...selectedChat });
            }}
          >
            <ChatWindow 
              key={`chat-win-${selectedChat.userId ?? selectedChat.UserId}-${chatNonce}`}
              receiverId={selectedChat.userId ?? selectedChat.UserId} 
              userName={selectedChat.fullName ?? selectedChat.FullName ?? selectedChat.name ?? selectedChat.Name ?? 'Member'} 
              photoUrl={selectedChat.photoUrl ?? selectedChat.PhotoUrl ?? selectedChat.mainPhotoUrl ?? selectedChat.MainPhotoUrl}
              initialIsOnline={selectedChat.isOnline ?? selectedChat.IsOnline}
              initialLastSeen={selectedChat.lastSeen ?? selectedChat.LastSeen}
              initialAccountState={selectedChat.accountState ?? selectedChat.AccountState}
              onBack={() => {
                setSelectedChat(null);
              }} 
            />
          </ChatErrorBoundary>
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-8 bg-gradient-to-b from-slate-50 via-white to-slate-50 space-y-4">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="w-18 h-18 bg-rose-50 text-[#E21E5B] rounded-full flex items-center justify-center border border-rose-100 shadow-md"
            >
              <MessageSquare size={32} className="text-[#E21E5B]" />
            </motion.div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Select a Conversation</h3>
              <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto leading-relaxed">
                Choose a matched proposal from your left inbox list to begin respectful halal messaging.
              </p>
            </div>

            <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#E21E5B] to-[#C2185B] text-white text-[11px] font-bold shadow-xs flex items-center gap-1.5">
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
