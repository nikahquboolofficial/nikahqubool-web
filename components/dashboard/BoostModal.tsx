"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Loader2, Sparkles, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchBoostStatusApi, applyProfileBoostApi } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';
import { toast } from 'sonner';

interface BoostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBoostSuccess?: () => void;
}

export default function BoostModal({ isOpen, onClose, onBoostSuccess }: BoostModalProps) {
  // Plans exactly matching the reference screenshot:
  // Add 1 Boost: ₹99 (99 each)
  // Add 2 Boosts: ₹149 (74.5 each) with BEST SELLER badge
  // Add 3 Boosts: ₹199 (66.3 each)
  const plans = [
    {
      id: 'boost-1',
      title: 'Add 1 Boost',
      subtext: '99 each',
      hours: 24,
      cost: 99,
      badge: null
    },
    {
      id: 'boost-2',
      title: 'Add 2 Boosts',
      subtext: '74.5 each',
      hours: 48,
      cost: 149,
      badge: 'BEST SELLER'
    },
    {
      id: 'boost-3',
      title: 'Add 3 Boosts',
      subtext: '66.3 each',
      hours: 72,
      cost: 199,
      badge: null
    }
  ];

  const [selectedPlanId, setSelectedPlanId] = useState<string>('boost-2');
  const [loading, setLoading] = useState(false);
  const [boostStatus, setBoostStatus] = useState<{
    isBoosted: boolean;
    remainingMinutes: number;
    expiresAt?: string;
  } | null>(null);

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[1];

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadStatus = async () => {
    const token = getAuthToken();
    try {
      const res = await fetchBoostStatusApi(token);
      if (res.success && res.data) {
        const d = res.data;
        const isBoosted = Boolean(d.isBoosted ?? d.IsBoosted);
        const remainingMinutes = Number(d.remainingMinutes ?? d.RemainingMinutes ?? d.minutesRemaining ?? 0);
        const expiresAt = d.boostExpiresAt || d.BoostExpiresAt || d.expiresAt;
        setBoostStatus({ isBoosted, remainingMinutes, expiresAt });
      }
    } catch (e) {
      console.error("Boost status fetch failed", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const handleBuyNow = async () => {
    const token = getAuthToken();
    setLoading(true);
    try {
      const res = await applyProfileBoostApi(selectedPlan.hours, selectedPlan.cost, token);
      if (res.success) {
        toast.success(res.message || "🚀 Profile Boosted Successfully!");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("boost_updated", { detail: res.data }));
        }
        await loadStatus();
        if (onBoostSuccess) onBoostSuccess();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        toast.error(res.message || "Failed to activate boost.");
      }
    } catch (err: any) {
      toast.error("Failed to activate boost.");
    } finally {
      setLoading(false);
    }
  };

  const formatRemainingTime = (totalMins: number) => {
    if (totalMins <= 0) return "Expired";
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m left`;
    }
    return `${mins}m left`;
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          
          {/* BACKDROP CLICK */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* BOTTOM POPUP SHEET CONTAINER */}
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 p-6 sm:p-7 border border-slate-100 text-slate-900 pb-8 sm:pb-7"
            onClick={(e) => e.stopPropagation()}
          >
            {/* DRAG HANDLE (MOBILE BOTTOM SHEET INDICATOR) */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3 sm:hidden" />

            {/* TOP CLOSE BUTTON */}
            <button 
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {/* HEADLINE & SUBTITLE (EXACT SCREENSHOT LAYOUT) */}
            <div className="text-center space-y-1 pt-1 pb-4">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Add boost and get 10X matches
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-normal max-w-xs mx-auto leading-relaxed">
                Multiply the chances of getting matches and likes
              </p>
            </div>

            {/* ACTIVE STATUS NOTIFICATION IF ALREADY BOOSTED */}
            {boostStatus?.isBoosted && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-bold text-emerald-900">Current Boost Active!</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-black text-[11px] flex items-center gap-1">
                  <Clock size={12} /> {formatRemainingTime(boostStatus.remainingMinutes)}
                </span>
              </div>
            )}

            {/* PLANS SELECTION LIST WITH RADIO BUTTONS */}
            <div className="space-y-3.5 my-3">
              {plans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-2 border-[#E21E5B] bg-white shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {/* BADGE (BEST SELLER AT TOP BORDER) */}
                    {plan.badge && (
                      <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-[#E21E5B] text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                        {plan.badge}
                      </div>
                    )}

                    {/* LEFT: RADIO CIRCLE + TITLE & SUBTITLE */}
                    <div className="flex items-center gap-3.5">
                      {/* RADIO BUTTON */}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? 'border-[#E21E5B]' : 'border-slate-300'
                      }`}>
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#E21E5B]" />
                        )}
                      </div>

                      {/* TITLE & PRICE BREAKDOWN */}
                      <div className="text-left">
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                          {plan.title}
                        </h4>
                        <p className="text-xs text-slate-400 font-normal mt-0.5">
                          {plan.subtext}
                        </p>
                      </div>
                    </div>

                    {/* RIGHT: TOTAL PRICE */}
                    <div className="text-right pl-3 shrink-0">
                      <span className="text-base font-bold text-slate-900">
                        ₹{plan.cost}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BOTTOM FULL-WIDTH "BUY NOW" BUTTON */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-full bg-[#E21E5B] hover:bg-[#c2154b] text-white font-bold text-base shadow-[0_4px_16px_rgba(226,30,91,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-white" />
                    <span>Activating Boost...</span>
                  </>
                ) : (
                  <span>Buy Now</span>
                )}
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
