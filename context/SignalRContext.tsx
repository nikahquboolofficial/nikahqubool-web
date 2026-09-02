"use client";
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as signalR from "@microsoft/signalr";
import { SIGNALR_HUB_URL } from '@/lib/api';

interface PresenceInfo {
  isOnline: boolean;
  lastSeen?: string | Date | null;
}

interface SignalRContextType {
  connection: signalR.HubConnection | null;
  isConnected: boolean;
  onlineUsers: Record<number, PresenceInfo>;
  fetchBulkOnlineStatuses: (userIds: number[]) => Promise<void>;
}

const SignalRContext = createContext<SignalRContextType>({
  connection: null,
  isConnected: false,
  onlineUsers: {},
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
  const connRef = useRef<signalR.HubConnection | null>(null);

  const fetchBulkOnlineStatuses = async (userIds: number[]) => {
    if (!userIds || userIds.length === 0) return;
    const token = getCookie("user_token");
    if (!token) return;

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5027/api";
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
          const updated = { ...prev };
          Object.keys(data).forEach(idStr => {
            const id = Number(idStr);
            updated[id] = {
              isOnline: Boolean(data[idStr].isOnline),
              lastSeen: data[idStr].lastSeen
            };
          });
          return updated;
        });
      }
    } catch (e) {
      // Silent error handling for background presence fetch
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
      .configureLogging(signalR.LogLevel.None)
      .withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 15000, 30000])
      .build();

    conn.on("UserStatusChanged", (userId: number | string, status: boolean, lastSeen?: string | Date) => {
      setOnlineUsers(prev => ({
        ...prev,
        [Number(userId)]: { isOnline: Boolean(status), lastSeen: lastSeen ?? new Date().toISOString() }
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
      .catch(() => {
        // Silent catch, auto-reconnect will handle
      });

    // 📱 Mobile Sleep / Tab Focus Auto-Sync Listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (connRef.current && connRef.current.state === signalR.HubConnectionState.Disconnected) {
          connRef.current.start()
            .then(() => setIsConnected(true))
            .catch(() => {});
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (connRef.current) {
        connRef.current.off("UserStatusChanged");
        if (connRef.current.state !== signalR.HubConnectionState.Disconnected) {
          connRef.current.stop().catch(() => {});
        }
      }
    };
  }, []);

  return (
    <SignalRContext.Provider value={{ connection, isConnected, onlineUsers, fetchBulkOnlineStatuses }}>
      {children}
    </SignalRContext.Provider>
  );
}