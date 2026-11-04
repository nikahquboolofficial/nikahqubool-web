"use client";

import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Loader2, ChevronDown, 
  ShieldCheck, Heart, Sparkles, CheckCircle2, Lock
} from 'lucide-react';
import { sendOtpApi, verifyOtpApi, sanitizeErrorMessage } from '@/lib/api';
import { handleAuthSuccessRedirect } from '@/lib/auth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  useEffect(() => {
    mobileInputRef.current?.focus();
  }, []);

  // 🎯 Auto-focus first OTP box immediately & smoothly on Step 2
  useEffect(() => {
    if (step === 2) {
      otpRefs.current[0]?.focus();
      const t1 = setTimeout(() => otpRefs.current[0]?.focus(), 40);
      const t2 = setTimeout(() => otpRefs.current[0]?.focus(), 150);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [step]);

  // Resend OTP Countdown timer
  useEffect(() => {
    let interval: any;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

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
      action: "WEB_AUTH", // Automatically logs in if registered, or creates new user entry if new!
      fullName: "",
      mobileNumber: mobile,
      otpCode,
      email: null,
      gender: null,
      profileCreatedFor: 0
    });

    if (res && (res.success === true || res.success === "true" || res.success === 1 || res.status === 200)) {
      handleAuthSuccessRedirect(res, router);
    } else {
      setApiMessage(sanitizeErrorMessage(res?.message || 'Invalid OTP code. Please check and try again.'));
      setLoading(false);
      setLoadingAction('');
    }
  };

  // 🎯 Smooth Auto-advance & Auto-submit on 6 digits
  const handleOtpChange = (val: string, index: number) => {
    const digitsOnly = val.replace(/\D/g, '');
    
    // User deleted the digit
    if (!digitsOnly) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    // If multiple digits typed or pasted or autofilled by SMS
    if (digitsOnly.length > 1) {
      const pasted = digitsOnly.slice(0, 6);
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || '';
      }
      setOtp(newOtp);
      const targetIdx = Math.min(pasted.length, 5);
      otpRefs.current[targetIdx]?.focus();
      if (pasted.length === 6) {
        handleVerifyOtp(pasted);
      }
      return;
    }

    // Single digit typed
    const singleDigit = digitsOnly.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = singleDigit;
    setOtp(newOtp);
    setError('');
    setApiMessage('');

    // Smoothly advance cursor to next box
    if (index < 5 && singleDigit) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto submit immediately when 6th digit is entered
    const fullCode = newOtp.join('');
    if (fullCode.length === 6) {
      handleVerifyOtp(fullCode);
    }
  };

  // 🎯 Keydown handler for Backspace, Enter, and Arrow navigation
  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        e.preventDefault();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpRefs.current[index - 1]?.focus();
      } else if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
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
    <div className="min-h-screen w-full flex bg-white font-sans selection:bg-[#d91b5c] selection:text-white">
      
      {/* 👑 LEFT COLUMN: HERO NIKAH BRIDE IMAGE (DESKTOP ONLY - HIDDEN ON MOBILE) */}
      <div className="hidden md:flex md:w-1/2 lg:w-[54%] relative flex-col justify-between p-10 lg:p-14 text-white overflow-hidden bg-slate-950 min-h-screen select-none">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{ 
            backgroundImage: "url('/login-hero-bride.jpg')",
            filter: 'brightness(0.85)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />

        {/* Top Header Link to Home */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-2 group-hover:bg-white/20 transition-all">
              <Sparkles size={13} className="text-amber-300" />
              <span>Nikah Qubool Matrimony</span>
            </div>
          </Link>

          <Link href="/" className="text-xs text-white/80 hover:text-white underline font-bold transition-colors">
            Back to Home
          </Link>
        </div>

        {/* Bottom Inspirational Brand Text (Filled with Barakah & Hope for Marriage) */}
        <div className="relative z-10 space-y-4 max-w-lg text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 backdrop-blur-md border border-amber-300/30 text-amber-200 text-[11px] font-black uppercase tracking-wider">
            <Sparkles size={12} className="text-amber-300" />
            <span>Where Sincere Intentions Meet Sacred Unions</span>
          </div>

          <h2 className="text-3xl lg:text-5xl font-serif font-black tracking-tight leading-[1.18] text-white drop-shadow-md">
            Begin Your Blessed Journey,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-300 to-amber-300 italic font-normal">
              Filled With Barakah &amp; Hope.
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed drop-shadow max-w-md">
            &ldquo;And We created you in pairs with love, peace &amp; mercy.&rdquo; Every blessed Nikah starts with a sincere intention. Connect with verified practicing Muslim proposals guided by dignity and family trust.
          </p>

          <div className="pt-3 flex flex-wrap gap-2.5 text-xs font-bold text-slate-200">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15">
              <Heart size={14} className="text-rose-300 shrink-0" />
              <span>Sacred Sunnah Nikah</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <span>100% Verified Proposals</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15">
              <Lock size={14} className="text-amber-300 shrink-0" />
              <span>Strict Privacy Shield</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📱 RIGHT COLUMN: CLEAN FORM PANEL (EXACT NIKAH FOREVER LAYOUT: INPUTS AT TOP, BUTTON PINNED AT BOTTOM) */}
      <div className="w-full md:w-1/2 lg:w-[46%] min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-white">
        
        {/* 1. TOP SECTION: BRAND LOGO + TEXT INPUTS AT THE VERY TOP */}
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col pt-2 sm:pt-4">
          
          {/* Centered Brand Logo */}
          <div className="flex items-center justify-center pb-8 sm:pb-12">
            <Link href="/" className="inline-block">
              <img 
                src="/nikah-qubool-logo.png" 
                alt="Nikah Qubool" 
                className="h-9 sm:h-11 w-auto object-contain cursor-pointer"
              />
            </Link>
          </div>

          {/* Form Content at the TOP */}
          <AnimatePresence mode="wait">
            {step === 1 ? (
              /* ========================================================
                 SCREEN 1: ENTER MOBILE NUMBER
                 ======================================================== */
              <motion.div
                key="step-mobile"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                <div className="space-y-1.5 text-left">
                  <h3 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
                    Enter your mobile number
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    We'll send you a 6-digit OTP to verify your number.
                  </p>
                </div>

                {/* Country Flag + Mobile Input */}
                <div className="space-y-2 text-left">
                  <div className={`flex items-center border rounded-xl overflow-hidden transition-all bg-slate-50/50 ${
                    error ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus-within:border-[#d91b5c] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#d91b5c]/20'
                  }`}>
                    <div className="flex items-center gap-1 px-3 py-3.5 bg-slate-100/70 border-r border-slate-300 text-xs font-bold text-slate-800 shrink-0 select-none">
                      <span>IN +91</span>
                      <ChevronDown size={14} className="text-slate-400" />
                    </div>

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
                      className="w-full px-4 py-3.5 text-base sm:text-lg font-bold text-slate-900 outline-none bg-transparent placeholder-slate-400 caret-[#d91b5c]"
                    />
                  </div>

                  {error && (
                    <p className="text-xs font-bold text-rose-600 px-1">{error}</p>
                  )}
                  {apiMessage && (
                    <p className="text-xs font-bold text-rose-600 px-1">{apiMessage}</p>
                  )}
                </div>
              </motion.div>
            ) : (
              /* ========================================================
                 SCREEN 2: ENTER OTP (MATCHES SCREENSHOT)
                 ======================================================== */
              <motion.div
                key="step-otp"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
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
                  className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={18} />
                </button>

                <div className="space-y-1.5 text-left">
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

                {/* 6-DIGIT OTP BOXES */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { otpRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete={idx === 0 ? "one-time-code" : "off"}
                        autoFocus={idx === 0}
                        maxLength={1}
                        value={digit}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                        onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        onPaste={handleOtpPaste}
                        className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-xl border transition-all outline-none caret-[#d91b5c] ${
                          digit 
                            ? 'border-[#d91b5c] bg-rose-50/50 text-[#d91b5c]' 
                            : 'border-slate-300 bg-slate-50/70 text-slate-900 focus:border-[#d91b5c] focus:bg-white focus:ring-2 focus:ring-[#d91b5c]/20'
                        }`}
                      />
                    ))}
                  </div>

                  {error && (
                    <p className="text-xs font-bold text-rose-600 px-1 text-left">{error}</p>
                  )}
                  {apiMessage && (
                    <p className="text-xs font-bold text-rose-600 px-1 text-left">{apiMessage}</p>
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
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* 2. BOTTOM SECTION: PINNED CONTINUE BUTTON AT VERY BOTTOM */}
        <div className="w-full max-w-md mx-auto pt-6 pb-4 sm:pb-8">
          <button
            type="button"
            disabled={step === 1 ? (mobile.length !== 10 || loading) : (otp.join('').length !== 6 || loading)}
            onClick={() => {
              if (step === 1) {
                handleSendOtp();
              } else {
                handleVerifyOtp();
              }
            }}
            className={`w-full py-3.5 sm:py-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${
              (step === 1 ? mobile.length === 10 : otp.join('').length === 6) && !loading
                ? 'bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] hover:brightness-110 text-white shadow-md active:scale-98 cursor-pointer'
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

          <p className="text-[11px] text-slate-400 text-center mt-4 font-medium">
            By continuing, you agree to our{' '}
            <Link href="/terms-conditions" className="text-slate-600 underline font-bold">Terms</Link> &{' '}
            <Link href="/privacy-policy" className="text-slate-600 underline font-bold">Privacy Policy</Link>
          </p>
        </div>

      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#d91b5c]" size={32} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
