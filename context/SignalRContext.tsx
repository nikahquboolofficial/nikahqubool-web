"use client";
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as signalR from "@microsoft/signalr";
import { SIGNALR_HUB_URL } from '@/lib/api';

interface SignalRContextType {
  connection: signalR.HubConnection | null;
  isConnected: boolean;
  onlineUsers: Record<number, { isOnline: boolean; lastSeen?: string | Date }>;
}

const SignalRContext = createContext<SignalRContextType>({
  connection: null,
  isConnected: false,
  onlineUsers: {}
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
  const [onlineUsers, setOnlineUsers] = useState<Record<number, { isOnline: boolean; lastSeen?: string | Date }>>({});
  const connRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    const token = getCookie("user_token");
    if (!token) return;

    // 🔒 Robust SignalR Setup (Clean Handshake & Suppressed Console Error Spam)
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_HUB_URL, {
        accessTokenFactory: () => token
      })
      .configureLogging(signalR.LogLevel.None) // Prevents console.error dumping on 1006 auto-reconnects
      .withAutomaticReconnect([0, 1000, 2000, 5000, 10000])
      .build();

    conn.on("UserStatusChanged", (userId: number | string, status: boolean, lastSeen?: string | Date) => {
      setOnlineUsers(prev => ({
        ...prev,
        [Number(userId)]: { isOnline: Boolean(status), lastSeen: lastSeen ?? new Date().toISOString() }
      }));
    });

    // Auto-reconnect Silent Event Handlers
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
        // Silent catch for initial fail, auto-reconnect will handle
      });

    return () => {
      if (connRef.current) {
        connRef.current.off("UserStatusChanged");
        if (connRef.current.state !== signalR.HubConnectionState.Disconnected) {
          connRef.current.stop().catch(() => {});
        }
      }
    };
  }, []);

  return (
    <SignalRContext.Provider value={{ connection, isConnected, onlineUsers }}>
      {children}
    </SignalRContext.Provider>
  );
}