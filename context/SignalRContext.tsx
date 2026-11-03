"use client";
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import * as signalR from "@microsoft/signalr";
import { SIGNALR_HUB_URL, API_BASE_URL } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';

interface PresenceInfo {
  isOnline: boolean;
  lastSeen?: string | Date | null;
}

interface SignalRContextType {
  connection: signalR.HubConnection | null;
  isConnected: boolean;
  onlineUsers: Record<number, PresenceInfo>;
  typingUsers: Record<number, boolean>;
  sendTyping: (receiverId: number, isTyping: boolean) => void;
  fetchBulkOnlineStatuses: (userIds: number[]) => Promise<void>;
  playMessageChime: () => void;
}

const SignalRContext = createContext<SignalRContextType>({
  connection: null,
  isConnected: false,
  onlineUsers: {},
  typingUsers: {},
  sendTyping: () => {},
  fetchBulkOnlineStatuses: async () => {},
  playMessageChime: () => {}
});

export const useSignalR = () => useContext(SignalRContext);

// 🎵 PURE WHATSAPP-STYLE SOFT AUDIO CHIME (Zero external MP3 dependency, 0ms latency)
export const playMessageChime = () => {
  try {
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Smooth dual-tone WhatsApp style marimba ping
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(850, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1350, ctx.currentTime + 0.08);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1700, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(2700, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.18);
    osc2.stop(ctx.currentTime + 0.18);
  } catch (e) {}
};

export function SignalRProvider({ children }: { children: React.ReactNode }) {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Record<number, PresenceInfo>>({});
  const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({});
  const connRef = useRef<signalR.HubConnection | null>(null);

  const fetchBulkOnlineStatuses = useCallback(async (userIds: number[]) => {
    if (!userIds || userIds.length === 0) return;
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/Chat/online-statuses`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(userIds)
      });

      if (res.ok) {
        const data = await res.json();
        setOnlineUsers(prev => {
          let hasChange = false;
          const updated = { ...prev };
          Object.keys(data).forEach(idStr => {
            const id = Number(idStr);
            const isOnline = Boolean(data[idStr]?.isOnline);
            const lastSeen = data[idStr]?.lastSeen;
            if (!prev[id] || prev[id].isOnline !== isOnline || prev[id].lastSeen !== lastSeen) {
              updated[id] = { isOnline, lastSeen };
              hasChange = true;
            }
          });
          return hasChange ? updated : prev;
        });
      }
    } catch (e) {}
  }, []);

  const sendTyping = (receiverId: number, isTyping: boolean) => {
    if (connRef.current && connRef.current.state === signalR.HubConnectionState.Connected && receiverId > 0) {
      connRef.current.invoke("SendTypingNotification", receiverId, isTyping).catch(() => {});
    }
  };

  useEffect(() => {
    let isMounted = true;
    let retryTimer: any = null;
    let tokenPollTimer: any = null;
    let heartbeatInterval: any = null;

    // 🔒 Bulletproof SignalR Setup with Automatic Fallbacks & Infinite Reconnects
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_HUB_URL, {
        accessTokenFactory: () => getAuthToken() || "",
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling
      })
      .configureLogging(process.env.NODE_ENV === 'development' ? signalR.LogLevel.Warning : signalR.LogLevel.None)
      .withAutomaticReconnect([0, 1000, 2000, 4000, 8000, 15000, 30000])
      .build();

    // 🟢 Real-time Presence Change
    conn.on("UserStatusChanged", (userId: number | string, status: boolean, lastSeen?: string | Date) => {
      setOnlineUsers(prev => ({
        ...prev,
        [Number(userId)]: { isOnline: Boolean(status), lastSeen: lastSeen ?? new Date().toISOString() }
      }));
    });

    // ✍️ Real-time Typing Indicator
    conn.on("UserTyping", (senderId: number | string, isTyping: boolean) => {
      setTypingUsers(prev => ({
        ...prev,
        [Number(senderId)]: Boolean(isTyping)
      }));
    });

    // 💬 Global Live Message Broadcast
    conn.on("ReceiveMessage", (senderId: any, receiverId: any, messageText: string, msgId?: any, sentAt?: string) => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("global_message_received", {
          detail: {
            senderId: Number(senderId),
            receiverId: Number(receiverId),
            messageText,
            msgId: msgId ?? Date.now(),
            sentAt: sentAt ?? new Date().toISOString()
          }
        }));
      }
    });

    conn.onreconnecting(() => {
      if (isMounted) setIsConnected(false);
    });

    conn.onreconnected(() => {
      if (isMounted) {
        setIsConnected(true);
        conn.invoke("HeartbeatPing").catch(() => {});
      }
    });

    conn.onclose(() => {
      if (isMounted) {
        setIsConnected(false);
        // Attempt immediate safe reconnection
        clearTimeout(retryTimer);
        retryTimer = setTimeout(startConnection, 2000);
      }
    });

    const startConnection = async () => {
      if (!isMounted) return;
      const token = getAuthToken();
      if (!token) {
        // Poll for token every 1.5s if user just logged in
        clearTimeout(tokenPollTimer);
        tokenPollTimer = setTimeout(startConnection, 1500);
        return;
      }

      if (conn.state === signalR.HubConnectionState.Disconnected) {
        try {
          await conn.start();
          if (isMounted) {
            setIsConnected(true);
            connRef.current = conn;
            setConnection(conn);
            conn.invoke("HeartbeatPing").catch(() => {});
          }
        } catch (err) {
          if (isMounted) {
            setIsConnected(false);
            // Retry initial connection every 3s until successful!
            clearTimeout(retryTimer);
            retryTimer = setTimeout(startConnection, 3000);
          }
        }
      }
    };

    startConnection();

    // 💓 Regular Heartbeat Ping (Every 25 seconds to keep In-Memory Presence active)
    heartbeatInterval = setInterval(() => {
      if (conn.state === signalR.HubConnectionState.Connected) {
        conn.invoke("HeartbeatPing").catch(() => {});
      }
    }, 25000);

    // 📱 Mobile Sleep / Tab Focus Auto-Sync Listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startConnection();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      clearTimeout(retryTimer);
      clearTimeout(tokenPollTimer);
      clearInterval(heartbeatInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      conn.off("UserStatusChanged");
      conn.off("UserTyping");
      conn.off("ReceiveMessage");
      if (conn.state !== signalR.HubConnectionState.Disconnected) {
        conn.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <SignalRContext.Provider value={{ connection, isConnected, onlineUsers, typingUsers, sendTyping, fetchBulkOnlineStatuses, playMessageChime }}>
      {children}
    </SignalRContext.Provider>
  );
}
