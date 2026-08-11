"use client";
import { useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { SIGNALR_HUB_URL } from '@/lib/api';

export default function GlobalPresence() {
  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const val = parts.pop()?.split(';').shift();
      return val ?? null;
    }
    return null;
  };

  useEffect(() => {
    const token = getCookie("user_token");
    if (!token) return;

    let isMounted = true;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_HUB_URL, {
        accessTokenFactory: () => token,
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        if (!isMounted) connection.stop().catch(() => {});
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.stop().catch(() => {});
      }
    };
  }, []);

  return null;
}