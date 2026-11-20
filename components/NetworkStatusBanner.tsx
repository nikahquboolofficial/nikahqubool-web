"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, Wifi, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NetworkStatusBanner() {
  const [status, setStatus] = useState<"online" | "slow" | "offline">("online");
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initial check
    if (!navigator.onLine) {
      setStatus("offline");
    }

    const handleOffline = () => {
      setStatus("offline");
      setShowRestored(false);
    };

    const handleOnline = () => {
      setStatus("online");
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
      }, 2500);
      return () => clearTimeout(timer);
    };

    const handleSlowEvent = () => {
      if (status !== "offline") {
        setStatus("slow");
        const timer = setTimeout(() => {
          if (navigator.onLine) setStatus("online");
        }, 5000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("network:slow", handleSlowEvent);

    // Check Network Information API if supported (exclude localhost to prevent virtual adapter false alarms)
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const conn = !isLocalhost ? (navigator as any).connection : null;
    if (conn) {
      const handleConnChange = () => {
        if (conn.effectiveType === "2g" || conn.effectiveType === "slow-2g") {
          setStatus("slow");
        } else if (navigator.onLine) {
          setStatus("online");
        }
      };
      conn.addEventListener("change", handleConnChange);
      return () => {
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("network:slow", handleSlowEvent);
        conn.removeEventListener("change", handleConnChange);
      };
    }

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("network:slow", handleSlowEvent);
    };
  }, [status]);

  const isVisible = status === "offline" || status === "slow" || showRestored;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="fixed top-3 inset-x-0 z-[9999] flex justify-center px-4 pointer-events-none"
        >
          {showRestored ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600/95 text-white shadow-xl backdrop-blur-md text-xs font-semibold tracking-wide border border-emerald-400/40">
              <CheckCircle2 size={15} className="text-white shrink-0" />
              <span>Internet connection restored</span>
            </div>
          ) : status === "offline" ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/95 text-white shadow-xl backdrop-blur-md text-xs font-semibold tracking-wide border border-rose-500/40">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <WifiOff size={15} className="text-rose-400 shrink-0" />
              <span>No internet connection. Reconnecting, please wait...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/95 text-slate-950 shadow-xl backdrop-blur-md text-xs font-bold tracking-wide border border-amber-300/40">
              <AlertTriangle size={15} className="text-slate-950 shrink-0 animate-pulse" />
              <span>Slow internet connection. Reconnecting, please wait...</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
