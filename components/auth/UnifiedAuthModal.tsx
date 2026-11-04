"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, ArrowLeft, X, Loader2, ChevronDown, 
  ShieldCheck, Users, Heart, Sparkles, CheckCircle2 
} from 'lucide-react';
import { sendOtpApi, verifyOtpApi, sanitizeErrorMessage } from '@/lib/api';
import { handleAuthSuccessRedirect } from '@/lib/auth';

interface UnifiedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMobile?: string;
}

export default function UnifiedAuthModal({ isOpen, onClose, initialMobile = '' }: UnifiedAuthModalProps) {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1); // 1 = Mobile, 2 = OTP
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [timer, setTimer] = useState(60);
  const [error, setError] = useState('');
  const [apiMessage, setApiMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState('');

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync initialMobile when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setMobile(initialMobile.replace(/\D/g, '').slice(0, 10));
      setOtp(new Array(6).fill(''));
      setError('');
      setApiMessage('');
      setLoading(false);
      setTimeout(() => mobileInputRef.current?.focus(), 150);
    }
  }, [isOpen, initialMobile]);

  // Focus first OTP box on step 2
  useEffect(() => {
    if (isOpen && step === 2) {
      setTimeout(() => otpRefs.current[0]?.focus(), 200);
    }
  }, [isOpen, step]);

  // Resend OTP Countdown timer
  useEffect(() => {
    let interval: any;
    if (isOpen && step === 2 && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, step, timer]);

  if (!isOpen) return null;

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(raw);
    setError('');
    setApiMessage('');
  };

  const handleSendOtp = async () => {
    if (mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Number must start with 6, 7, 8, or 9');
      return;
    }

    setLoading(true);
    setLoadingAction('Sending OTP...');
    setError('');
    setApiMessage('');

    const res = await sendOtpApi(mobile, "null", "Both");

    if (res?.success === true || res?.success === 1) {
      setStep(2);
      setTimer(60);
      setOtp(new Array(6).fill(''));
      setError('');
    } else {
      setApiMessage(sanitizeErrorMessage(res?.message || 'Failed to send OTP. Please try again.'));
    }
    setLoading(false);
    setLoadingAction('');
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const otpCode = codeToVerify || otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setLoadingAction('Verifying...');
    setError('');
    setApiMessage('');

    const res = await verifyOtpApi({
      action: "WEB_AUTH", // Automatically logs in if existing, or registers if new!
      fullName: "",
      mobileNumber: mobile,
      otpCode,
      email: null,
      gender: null,
      profileCreatedFor: 0
    });

    if (res && (res.success === true || res.success === "true" || res.success === 1 || res.status === 200)) {
      onClose();
      handleAuthSuccessRedirect(res, router);
    } else {
      setApiMessage(sanitizeErrorMessage(res?.message || 'Invalid OTP code. Please check and try again.'));
      setLoading(false);
      setLoadingAction('');
    }
  };

  const handleOtpChange = (val: string, index: number) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);
    setError('');
    setApiMessage('');

    if (val && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    const fullCode = newOtp.join('');
    if (fullCode.length === 6) {
      handleVerifyOtp(fullCode);
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter' && otp.join('').length === 6) {
      handleVerifyOtp();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || '';
      }
      setOtp(newOtp);
      const nextIndex = Math.min(pasted.length, 5);
      otpRefs.current[nextIndex]?.focus();
      if (pasted.length === 6) {
        handleVerifyOtp(pasted);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* 🌟 NIKAH FOREVER STYLE DUAL-COLUMN CARD */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative max-h-[92vh] border border-rose-100">
        
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* 👰 LEFT COLUMN: HERO COUPLE IMAGE WITH LUXURY OVERLAY (NIKAH FOREVER STYLE) */}
        <div className="hidden md:flex md:w-[48%] relative flex-col justify-end p-8 text-white overflow-hidden bg-slate-900 min-h-[520px]">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 scale-105"
            style={{ 
              backgroundImage: `url('https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200')`,
              filter: 'brightness(0.78)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

          {/* Top Brand Pill */}
          <div className="absolute top-6 left-6 z-10 flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-bold text-amber-300 uppercase tracking-widest">
            <Sparkles size={13} className="text-amber-300" />
            <span>Nikah Qubool</span>
          </div>

          {/* Bottom Captions */}
          <div className="relative z-10 space-y-3.5 text-left">
            <h2 className="text-2xl lg:text-3xl font-serif font-black tracking-tight leading-tight text-white drop-shadow-md">
              More than matches, <br />
              <span className="text-rose-300 italic font-medium">meaningful beginnings</span>
            </h2>

            <p className="text-xs text-slate-200 font-medium leading-relaxed max-w-xs drop-shadow">
              A trusted platform for Muslim singles and families, built on values, faith and a brighter tomorrow.
            </p>

            <div className="pt-2 flex flex-col gap-2 text-xs font-bold text-slate-200">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-rose-300 shrink-0" />
                <span>Trusted Community</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-400 shrink-0" />
                <span>100% Verified Profiles</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart size={15} className="text-amber-300 shrink-0" />
                <span>Values First & Sunnah Guided</span>
              </div>
            </div>
          </div>
        </div>

        {/* 📱 RIGHT COLUMN: MOBILE INPUT & 6-DIGIT OTP (NIKAH FOREVER STYLE) */}
        <div className="w-full md:w-[52%] p-6 sm:p-10 flex flex-col justify-center min-h-[460px] bg-white">
          
          {/* Brand Logo Header */}
          <div className="mb-6 flex items-center justify-between">
            <img 
              src="/nikah-qubool-logo.png" 
              alt="Nikah Qubool" 
              className="h-9 sm:h-11 w-auto object-contain"
            />
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              /* ========================================================
                 SCREEN 1: ENTER MOBILE NUMBER
                 ======================================================== */
              <motion.div
                key="step-mobile"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h3 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
                    Enter your mobile number
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    We'll send you an OTP to verify your number.
                  </p>
                </div>

                {/* Country Flag + Mobile Input Container */}
                <div className="space-y-2">
                  <div className={`flex items-center border-2 rounded-2xl overflow-hidden transition-all bg-slate-50/70 ${
                    error ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus-within:border-[#d91b5c] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#d91b5c]/10'
                  }`}>
                    {/* Country Code Pill */}
                    <div className="flex items-center gap-1.5 px-3.5 py-3.5 bg-slate-100/80 border-r border-slate-200 text-xs font-black text-slate-800 shrink-0 select-none">
                      <span className="text-base leading-none">🇮🇳</span>
                      <span>+91</span>
                      <ChevronDown size={14} className="text-slate-400" />
                    </div>

                    {/* 10-Digit Mobile Input */}
                    <input
                      ref={mobileInputRef}
                      type="tel"
                      inputMode="numeric"
                      value={mobile}
                      onChange={handleMobileChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && mobile.length === 10 && !loading) {
                          handleSendOtp();
                        }
                      }}
                      placeholder="Mobile number"
                      maxLength={10}
                      autoComplete="tel"
                      className="w-full px-4 py-3.5 text-base sm:text-lg font-bold text-slate-900 tracking-wider outline-none bg-transparent placeholder-slate-400"
                    />
                  </div>

                  {error && (
                    <p className="text-xs font-bold text-rose-600 px-1">{error}</p>
                  )}
                  {apiMessage && (
                    <p className="text-xs font-bold text-rose-600 px-1">{apiMessage}</p>
                  )}
                </div>

                {/* 🎯 CONTINUE BUTTON: ACTIVE ONLY WHEN 10 DIGITS ARE ENTERED */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={mobile.length !== 10 || loading}
                    onClick={handleSendOtp}
                    className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${
                      mobile.length === 10 && !loading
                        ? 'bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] hover:brightness-110 text-white shadow-lg shadow-rose-950/20 active:scale-98 cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-white" />
                        <span>{loadingAction}</span>
                      </>
                    ) : (
                      <span>Continue</span>
                    )}
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100 text-center">
                  <p className="text-[11px] text-slate-400 font-medium">
                    By continuing, you agree to our{' '}
                    <a href="/terms-conditions" target="_blank" className="text-[#d91b5c] underline font-bold">Terms</a> &{' '}
                    <a href="/privacy-policy" target="_blank" className="text-[#d91b5c] underline font-bold">Privacy Policy</a>
                  </p>
                </div>
              </motion.div>
            ) : (
              /* ========================================================
                 SCREEN 2: ENTER OTP (IMAGE 3 MATCH)
                 ======================================================== */
              <motion.div
                key="step-otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Back Arrow Button */}
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError('');
                    setApiMessage('');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>

                <div className="space-y-1">
                  <h3 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
                    Enter the OTP
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Sent to +91 {mobile}{' '}
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[#d91b5c] font-black underline hover:text-rose-700 cursor-pointer ml-1"
                    >
                      Change
                    </button>
                  </p>
                </div>

                {/* 6-DIGIT OTP BOXES (IMAGE 3 MATCH) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2.5">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { otpRefs.current[idx] = el; }}
                        type="tel"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                        onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        onPaste={handleOtpPaste}
                        className={`w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-black rounded-2xl border-2 transition-all outline-none ${
                          digit 
                            ? 'border-[#d91b5c] bg-rose-50/50 text-[#d91b5c] shadow-xs' 
                            : 'border-slate-200 bg-slate-50/70 text-slate-900 focus:border-[#d91b5c] focus:bg-white focus:ring-4 focus:ring-[#d91b5c]/10'
                        }`}
                      />
                    ))}
                  </div>

                  {error && (
                    <p className="text-xs font-bold text-rose-600 px-1">{error}</p>
                  )}
                  {apiMessage && (
                    <p className="text-xs font-bold text-rose-600 px-1">{apiMessage}</p>
                  )}

                  {/* Resend OTP Timer Row */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    {timer > 0 ? (
                      <span className="text-slate-400 font-bold">
                        Resend OTP in <strong className="text-slate-700">{timer}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-[#d91b5c] font-black underline hover:text-rose-700 cursor-pointer"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                {/* 🎯 CONTINUE BUTTON FOR OTP */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={otp.join('').length !== 6 || loading}
                    onClick={() => handleVerifyOtp()}
                    className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${
                      otp.join('').length === 6 && !loading
                        ? 'bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] hover:brightness-110 text-white shadow-lg shadow-rose-950/20 active:scale-98 cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-white" />
                        <span>{loadingAction}</span>
                      </>
                    ) : (
                      <span>Continue</span>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
