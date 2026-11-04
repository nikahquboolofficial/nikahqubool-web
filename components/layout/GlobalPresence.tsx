"use client";

import { useEffect, useState } from 'react';
import { playMessageChime } from '@/context/SignalRContext';

export default function GlobalPresence() {
  const [activeChatUserId, setActiveChatUserId] = useState<number | null>(null);

  useEffect(() => {
    const handleActiveChatSelected = (e: any) => {
      setActiveChatUserId(e.detail?.activeReceiverId ?? null);
    };
    window.addEventListener('active_chat_selected', handleActiveChatSelected);
    return () => window.removeEventListener('active_chat_selected', handleActiveChatSelected);
  }, []);

  useEffect(() => {
    const handleGlobalMsg = (e: any) => {
      const { senderId, messageText } = e.detail || {};
      if (!senderId || !messageText) return;

      const currentActive = (typeof window !== "undefined" && (window as any).activeChatReceiverId) 
        ?? activeChatUserId;

      // 🎵 If chat with THIS sender is currently open, ChatWindow already plays the chime
      // If user is on any other page or in another chat, play the message audio chime!
      if (!currentActive || Number(currentActive) !== Number(senderId)) {
        playMessageChime();
      }
    };

    window.addEventListener("global_message_received", handleGlobalMsg);
    return () => {
      window.removeEventListener("global_message_received", handleGlobalMsg);
    };
  }, [activeChatUserId]);

  // 🚫 Visual popup/toast notification banner completely removed as requested
  // Only the message audio chime is kept active
  return null;
}
