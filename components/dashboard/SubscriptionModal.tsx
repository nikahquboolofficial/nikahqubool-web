"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Sparkles, Check, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchSubscriptionPlansApi } from '@/lib/api';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  title = "VIP Subscription Required",
  subtitle = "Direct messaging & contact view are exclusive features for VIP Premium members."
}: SubscriptionModalProps) {
  const router = useRouter();
  const [cheapestPlan, setCheapestPlan] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      const loadPlans = async () => {
        const res = await fetchSubscriptionPlansApi();
        if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const sorted = [...res.data].sort((a, b) => {
            const priceA = a.discountPrice ?? a.DiscountPrice ?? a.price ?? a.Price ?? 9999;
            const priceB = b.discountPrice ?? b.DiscountPrice ?? b.price ?? b.Price ?? 9999;
            return priceA - priceB;
          });
          setCheapestPlan(sorted[0]);
        } else {
          setCheapestPlan({
            planName: "Starter VIP",
            discountPrice: 499,
            originalPrice: 999,
            validityDays: 30,
            contactViewsAllowed: 25
          });
        }
      };
      loadPlans();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const planName = cheapestPlan?.planName || cheapestPlan?.PlanName || "Starter VIP Plan";
  const origPrice = cheapestPlan?.originalPrice ?? cheapestPlan?.OriginalPrice ?? 999;
  const discPrice = cheapestPlan?.discountPrice ?? cheapestPlan?.DiscountPrice ?? cheapestPlan?.price ?? cheapestPlan?.Price ?? 499;
  const days = cheapestPlan?.validityDays ?? cheapestPlan?.ValidityDays ?? 30;
  const contacts = cheapestPlan?.contactViewsAllowed ?? cheapestPlan?.ContactViewsAllowed ?? 25;
  const savingsPct = origPrice > discPrice ? Math.round(((origPrice - discPrice) / origPrice) * 100) : 50;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.9, opacity: 0, y: 20 }} 
          className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border-2 border-rose-100 text-slate-800 space-y-5 relative overflow-hidden selection:bg-[#d91b5c] selection:text-white"
        >
          {/* CLOSE BUTTON */}
          <button 
            type="button" 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-[#d91b5c] transition-all cursor-pointer z-10"
          >
            <X size={18} />
          </button>

          {/* CROWN BADGE HEADER */}
          <div className="w-16 h-16 bg-gradient-to-tr from-[#d91b5c] via-[#e11d48] to-amber-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-rose-900/25 border-2 border-rose-200">
            <Crown size={32} className="text-amber-300 fill-amber-300 animate-pulse" />
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-serif font-extrabold uppercase text-slate-900 tracking-tight">
              {title}
            </h3>
            <p className="text-slate-500 text-xs font-semibold mt-1 leading-relaxed px-2">
              {subtitle}
            </p>
          </div>

          {/* DYNAMIC CHEAPEST PLAN HIGHLIGHT CARD */}
          <div className="bg-gradient-to-b from-rose-50/80 to-amber-50/60 p-4 rounded-2xl border-2 border-rose-200/80 text-left space-y-3 relative overflow-hidden shadow-inner">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-[#d91b5c] text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <Sparkles size={11} className="text-amber-300" /> Best Price Offer
              </span>
              {savingsPct > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-xs">
                  {savingsPct}% OFF
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between border-b border-rose-200/60 pb-2.5">
              <div>
                <h4 className="font-serif font-black text-slate-900 text-base uppercase">{planName}</h4>
                <p className="text-[10px] font-bold text-slate-500">{days} Days Membership Validity</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-[#d91b5c]">₹{discPrice}</span>
                {origPrice > discPrice && (
                  <span className="text-xs font-bold text-slate-400 line-through ml-1.5">₹{origPrice}</span>
                )}
              </div>
            </div>

            {/* HIGHLIGHT FEATURES */}
            <div className="space-y-1.5 text-[11px] font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 stroke-[3] shrink-0" />
                <span>Unlimited Direct Chat & Messaging</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 stroke-[3] shrink-0" />
                <span>{contacts} Contact Number Views</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 stroke-[3] shrink-0" />
                <span>Verified VIP Badge on Profile</span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col gap-2.5 pt-1">
            <button 
              type="button"
              onClick={() => {
                onClose();
                router.push('/dashboard/membership');
              }} 
              className="w-full bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] hover:brightness-110 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-900/20 active:scale-95 transition-all cursor-pointer border border-rose-300/30 flex items-center justify-center gap-2"
            >
              <Crown size={16} className="text-amber-300 fill-amber-300" />
              <span>Unlock VIP Now</span>
              <ArrowRight size={16} />
            </button>

            <button 
              type="button"
              onClick={() => {
                onClose();
                router.push('/dashboard/membership');
              }} 
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              View All Membership Plans
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

