"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSignalR, playMessageChime } from '@/context/SignalRContext';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';

export default function GlobalPresence() {
  const { isConnected } = useSignalR();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleGlobalMsg = (e: any) => {
      const { senderId, messageText } = e.detail || {};
      if (!senderId || !messageText) return;

      // If outside the active chat screen, notify with soft chime and interactive toast
      if (!pathname?.startsWith('/dashboard/messages')) {
        playMessageChime();
        toast(`New message received`, {
          description: messageText.length > 45 ? `${messageText.slice(0, 45)}...` : messageText,
          icon: <MessageSquare size={16} className="text-[#d91b5c]" />,
          duration: 4500,
          action: {
            label: "Open Chat",
            onClick: () => {
              if (typeof window !== "undefined") {
                sessionStorage.setItem('active_chat_target', JSON.stringify({ userId: senderId }));
              }
              router.push('/dashboard/messages');
            }
          }
        });
      }
    };

    window.addEventListener("global_message_received", handleGlobalMsg);
    return () => window.removeEventListener("global_message_received", handleGlobalMsg);
  }, [pathname, router]);

  return null;
}
