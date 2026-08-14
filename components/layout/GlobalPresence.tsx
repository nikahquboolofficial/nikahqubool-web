"use client";

import { useSignalR } from '@/context/SignalRContext';

export default function GlobalPresence() {
  // Uses global single SignalR connection initialized by SignalRProvider in layout
  const { isConnected } = useSignalR();
  return null;
}