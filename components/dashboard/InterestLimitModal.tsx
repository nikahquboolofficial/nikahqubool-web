"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Clock, Heart, Sparkles } from 'lucide-react';
import { getRemainingTimeUntilMidnight, formatTimeRemaining } from '@/lib/limitUtils';

interface InterestLimitModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function InterestLimitModal({ 
  isOpen: propIsOpen, 
  onClose: propOnClose 
}: InterestLimitModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [remainingMs, setRemainingMs] = useState<number>(() => getRemainingTimeUntilMidnight());

  // Listen for global custom event 'interest_limit_reached'
  useEffect(() => {
    const handleGlobalLimit = () => {
      setRemainingMs(getRemainingTimeUntilMidnight());
      setInternalOpen(true);
    };

    if (typeof window !== "undefined") {
      window.addEventListener('interest_limit_reached', handleGlobalLimit);
      return () => {
        window.removeEventListener('interest_limit_reached', handleGlobalLimit);
      };
    }
  }, []);

  const isOpen = propIsOpen !== undefined ? propIsOpen : internalOpen;

  const handleClose = () => {
    if (propOnClose) propOnClose();
    setInternalOpen(false);
  };

  // Live countdown timer ticking every 1 second
  useEffect(() => {
    if (!isOpen) return;

    setRemainingMs(getRemainingTimeUntilMidnight());
    const interval = setInterval(() => {
      setRemainingMs(getRemainingTimeUntilMidnight());
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        {/* Backdrop click to dismiss */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0"
        />

        {/* Modal Card: Compact, Pure White & Champagne Gold Accents */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 text-center z-10 overflow-hidden"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Top Decorative Icon */}
          <div className="relative mx-auto w-14 h-14 rounded-full bg-gradient-to-tr from-rose-50 to-amber-50 border border-rose-200/60 flex items-center justify-center mb-3.5 shadow-xs">
            <Heart size={26} className="text-[#d91b5c] fill-[#d91b5c]/20" />
            <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 rounded-full p-1 shadow-xs">
              <Crown size={12} className="fill-slate-900" />
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-serif font-extrabold text-slate-900 tracking-tight mb-1">
            Daily Interest Limit Reached
          </h3>

          <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
            Free members can send up to <span className="font-bold text-slate-800">20 interests</span> in 24 hours. Your limit will reset automatically at midnight IST.
          </p>

          {/* Live Countdown Timer */}
          <div className="bg-gradient-to-r from-amber-50 via-rose-50/40 to-amber-50 border border-amber-200/80 rounded-xl py-2 px-3 flex items-center justify-center gap-2 text-amber-900 mb-4 shadow-2xs">
            <Clock size={15} className="text-amber-600 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Resets in:</span>
            <span className="text-xs font-black font-mono tracking-widest text-[#d91b5c]">
              {formatTimeRemaining(remainingMs)}
            </span>
          </div>

          {/* VIP Upgrade Pitch */}
          <p className="text-[11px] text-slate-500 font-medium mb-4">
            Want to connect without daily limits? Upgrade to VIP for <span className="text-emerald-700 font-semibold">unlimited interests</span> & direct phone numbers.
          </p>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Link
              href="/dashboard/membership"
              onClick={handleClose}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-amber-500 via-rose-500 to-[#d91b5c] hover:brightness-110 shadow-md shadow-rose-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Crown size={14} className="fill-white" />
              <span>Upgrade to VIP</span>
            </Link>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Maybe Later
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
