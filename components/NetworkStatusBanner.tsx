"use client";

import React, { useEffect, useState, useRef } from "react";
import { WifiOff, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NetworkStatusBanner() {
  const [status, setStatus] = useState<"online" | "slow" | "offline">("online");
  const [showRestored, setShowRestored] = useState(false);
  const probeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stopProbing = () => {
      if (probeIntervalRef.current) {
        clearInterval(probeIntervalRef.current);
        probeIntervalRef.current = null;
      }
    };

    const attemptRecovery = async () => {
      try {
        // Fast lightweight probe to verify actual live network connectivity
        const res = await fetch(`/nikah-qubool-logo.png?probe=${Date.now()}`, {
          method: "HEAD",
          cache: "no-store"
        });
        if (res.ok || res.status < 500) {
          stopProbing();
          setStatus("online");
          setShowRestored(true);
          window.dispatchEvent(new Event("network_recovered"));
          setTimeout(() => {
            setShowRestored(false);
          }, 1800);
        }
      } catch (e) {
        // Still unreachable, will retry on next tick
      }
    };

    const startProbing = () => {
      if (!probeIntervalRef.current) {
        probeIntervalRef.current = setInterval(attemptRecovery, 3000);
      }
    };

    // Initial browser online check
    if (!navigator.onLine) {
      setStatus("offline");
      startProbing();
    }

    const handleOffline = () => {
      setStatus("offline");
      setShowRestored(false);
      startProbing();
    };

    const handleOnline = () => {
      // Run probe to confirm genuine connection
      attemptRecovery();
    };

    const handleSlowEvent = () => {
      if (status !== "offline") {
        setStatus("slow");
        startProbing();
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("network:slow", handleSlowEvent);

    return () => {
      stopProbing();
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
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-700/95 text-white shadow-2xl backdrop-blur-md text-xs font-bold tracking-wide border border-emerald-400/40">
              <CheckCircle2 size={15} className="text-white shrink-0" />
              <span>Internet connection restored</span>
            </div>
          ) : status === "offline" ? (
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-950/95 text-white shadow-2xl backdrop-blur-md text-xs font-semibold tracking-wide border border-rose-500/50">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <WifiOff size={15} className="text-rose-400 shrink-0" />
              <span>No internet connection. Reconnecting...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-950/95 text-white shadow-2xl backdrop-blur-md text-xs font-semibold tracking-wide border border-slate-800">
              <RefreshCw size={14} className="text-amber-400 shrink-0 animate-spin" />
              <span>Slow network connection. Reconnecting...</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
