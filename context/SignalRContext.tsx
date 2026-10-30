"use client";
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import * as signalR from "@microsoft/signalr";
import { SIGNALR_HUB_URL, API_BASE_URL } from '@/lib/api';

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
}

const SignalRContext = createContext<SignalRContextType>({
  connection: null,
  isConnected: false,
  onlineUsers: {},
  typingUsers: {},
  sendTyping: () => {},
  fetchBulkOnlineStatuses: async () => {}
});

export const useSignalR = () => useContext(SignalRContext);

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() ?? null;
  return null;
};

export function SignalRProvider({ children }: { children: React.ReactNode }) {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Record<number, PresenceInfo>>({});
  const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({});
  const connRef = useRef<signalR.HubConnection | null>(null);

  const fetchBulkOnlineStatuses = useCallback(async (userIds: number[]) => {
    if (!userIds || userIds.length === 0) return;
    const token = getCookie("user_token");
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
            const isOnline = Boolean(data[idStr].isOnline);
            const lastSeen = data[idStr].lastSeen;
            if (!prev[id] || prev[id].isOnline !== isOnline || prev[id].lastSeen !== lastSeen) {
              updated[id] = { isOnline, lastSeen };
              hasChange = true;
            }
          });
          return hasChange ? updated : prev;
        });
      }
    } catch (e) {
      // Silent error handling for background presence fetch
    }
  }, []);

  const sendTyping = (receiverId: number, isTyping: boolean) => {
    if (connRef.current && connRef.current.state === signalR.HubConnectionState.Connected && receiverId > 0) {
      connRef.current.invoke("SendTypingNotification", receiverId, isTyping).catch(() => {});
    }
  };

  useEffect(() => {
    const token = getCookie("user_token");
    if (!token) return;

    // 🔒 Bulletproof SignalR Setup with Infinite Automatic Reconnects
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_HUB_URL, {
        accessTokenFactory: () => token
      })
      .configureLogging(process.env.NODE_ENV === 'development' ? signalR.LogLevel.Warning : signalR.LogLevel.None)
      .withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 15000, 30000])
      .build();

    conn.on("UserStatusChanged", (userId: number | string, status: boolean, lastSeen?: string | Date) => {
      setOnlineUsers(prev => ({
        ...prev,
        [Number(userId)]: { isOnline: Boolean(status), lastSeen: lastSeen ?? new Date().toISOString() }
      }));
    });

    conn.on("UserTyping", (senderId: number | string, isTyping: boolean) => {
      setTypingUsers(prev => ({
        ...prev,
        [Number(senderId)]: Boolean(isTyping)
      }));
    });

    conn.onreconnecting(() => {
      setIsConnected(false);
    });

    conn.onreconnected(() => {
      setIsConnected(true);
    });

    conn.onclose(() => {
      setIsConnected(false);
    });

    conn.start()
      .then(() => {
        setIsConnected(true);
        connRef.current = conn;
        setConnection(conn);
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn("SignalR connection attempt warning:", err);
        }
      });

    // 💓 Regular Heartbeat Ping (Every 45 seconds to keep Redis sliding session alive)
    const heartbeatInterval = setInterval(() => {
      if (connRef.current && connRef.current.state === signalR.HubConnectionState.Connected) {
        connRef.current.invoke("HeartbeatPing").catch(() => {});
      }
    }, 45000);

    // 📱 Mobile Sleep / Tab Focus Auto-Sync Listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (connRef.current && connRef.current.state === signalR.HubConnectionState.Disconnected) {
          connRef.current.start()
            .then(() => setIsConnected(true))
            .catch(() => {});
        } else if (connRef.current && connRef.current.state === signalR.HubConnectionState.Connected) {
          connRef.current.invoke("HeartbeatPing").catch(() => {});
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (connRef.current) {
        connRef.current.off("UserStatusChanged");
        connRef.current.off("UserTyping");
        if (connRef.current.state !== signalR.HubConnectionState.Disconnected) {
          connRef.current.stop().catch(() => {});
        }
      }
    };
  }, []);

  return (
    <SignalRContext.Provider value={{ connection, isConnected, onlineUsers, typingUsers, sendTyping, fetchBulkOnlineStatuses }}>
      {children}
    </SignalRContext.Provider>
  );
}