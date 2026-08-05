"use client";
import { useState, useEffect, Suspense } from 'react';
import InboxList from '@/components/chat/InboxList';
import ChatWindow from '@/components/chat/ChatWindow';

function MessagesContainer() {
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [tempNewChat, setTempNewChat] = useState<any>(null);

  // Page load hone par sessionStorage se active target read karo (Dashboard ke sath matching)
  useEffect(() => {
    const savedTarget = sessionStorage.getItem('active_chat_target');
    if (savedTarget) {
      try {
        const parsedTarget = JSON.parse(savedTarget);
        setSelectedChat(parsedTarget);
        setTempNewChat(parsedTarget); // First time user ko InboxList mein temporary push karne ke liye
        
        // Read karne ke baad clear kar dein taaki refresh par bar-bar wahi open na ho
        sessionStorage.removeItem('active_chat_target');
      } catch (e) {
        console.error("Error parsing target chat:", e);
      }
    }
  }, []);

  return (
    <div className="flex h-[calc(100vh-80px)] w-full max-w-7xl mx-auto bg-white shadow-xl rounded-3xl overflow-hidden my-4 border border-pink-100">
      
      {/* LEFT INBOX LIST */}
      <div className={`w-full md:w-[380px] lg:w-[420px] flex-shrink-0 border-r border-pink-50 ${selectedChat ? 'hidden md:block' : 'block'}`}>
        <InboxList 
          selectedId={selectedChat?.userId ?? selectedChat?.UserId} 
          onSelectUser={(chat: any) => {
            setSelectedChat(chat);
            setTempNewChat(null);
          }} 
          newExternalChat={tempNewChat} // Naye user ko first-time list mein show karne ke liye prop
        />
      </div>

      {/* RIGHT CHAT WINDOW */}
      <div className={`flex-1 h-full bg-white ${!selectedChat ? 'hidden md:flex' : 'flex'} flex-col`}>
        {selectedChat ? (
          <ChatWindow 
            receiverId={selectedChat.userId ?? selectedChat.UserId} 
            userName={selectedChat.fullName ?? selectedChat.FullName} 
            onBack={() => {
              setSelectedChat(null);
              setTempNewChat(null);
            }} 
          />
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full bg-[#FFF0F3]/30 text-center p-6">
            <h3 className="text-xl font-black italic text-slate-700 uppercase tracking-tight">Select a Conversation</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Choose someone from your inbox list to start messaging.</p>
          </div>
        )}
      </div>

    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-[#D2136E] font-bold">Loading Messenger...</div>}>
      <MessagesContainer />
    </Suspense>
  );
}