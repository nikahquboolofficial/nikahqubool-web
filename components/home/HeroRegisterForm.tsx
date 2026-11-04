"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, ChevronDown, ArrowRight, ShieldCheck, Heart, Sparkles, CheckCircle2 } from 'lucide-react';
import UnifiedAuthModal from '@/components/auth/UnifiedAuthModal';

export default function HeroRegisterForm() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(raw);
  };

  const handleStart = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (mobileNumber.length === 10) {
      setShowAuthModal(true);
    }
  };

  return (
    <>
      <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 relative overflow-hidden">
        
        {/* Glow decoration */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#d91b5c]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-5 text-left">
          
          {/* Header Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#d91b5c] text-[11px] font-black uppercase tracking-wider border border-rose-200">
            <Sparkles size={12} className="text-[#d91b5c]" />
            <span>Fast & 100% Free Signup</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-serif font-black text-slate-900 tracking-tight leading-tight">
              Begin Your Halal Journey
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Enter your mobile number to get an instant OTP.
            </p>
          </div>

          <form onSubmit={handleStart} className="space-y-4">
            {/* Country Flag + Mobile Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Mobile Number
              </label>

              <div className="flex items-center border-2 border-slate-200 focus-within:border-[#d91b5c] focus-within:ring-4 focus-within:ring-[#d91b5c]/10 rounded-2xl overflow-hidden bg-slate-50/70 focus-within:bg-white transition-all shadow-xs">
                {/* Flag + Code */}
                <div className="flex items-center gap-1 px-3 py-3.5 bg-slate-100 border-r border-slate-200 text-xs font-black text-slate-800 shrink-0 select-none">
                  <span className="text-base leading-none">🇮🇳</span>
                  <span>+91</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </div>

                <input
                  type="tel"
                  inputMode="numeric"
                  value={mobileNumber}
                  onChange={handleMobileChange}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className="w-full px-3.5 py-3.5 text-base sm:text-lg font-bold text-slate-900 tracking-wider outline-none bg-transparent placeholder-slate-400"
                />
              </div>
            </div>

            {/* Continue Button */}
            <button
              type="submit"
              disabled={mobileNumber.length !== 10}
              className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                mobileNumber.length === 10
                  ? 'bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] hover:brightness-110 text-white shadow-rose-950/20 active:scale-98 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Continue with OTP</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Trust badges */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-500" /> 100% Privacy
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={13} className="text-[#d91b5c]" /> Verified OTP
            </span>
            <span className="flex items-center gap-1">
              <Heart size={13} className="text-amber-500" /> Free to Join
            </span>
          </div>

        </div>
      </div>

      <UnifiedAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMobile={mobileNumber}
      />
    </>
  );
}
