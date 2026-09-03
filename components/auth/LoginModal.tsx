"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, Loader2, LogIn, ShieldCheck, ArrowRight } from 'lucide-react';
import { sendOtpApi, verifyOtpApi } from '@/lib/api';
import { handleAuthSuccessRedirect } from '@/lib/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [timer, setTimer] = useState(60);
  const [error, setError] = useState('');
  const [apiMessage, setApiMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState('');
  const [activeOtpIndex, setActiveOtpIndex] = useState<number>(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen && step === 2) {
      setTimeout(() => {
        otpRefs.current[0]?.focus();
        setActiveOtpIndex(0);
      }, 150);
    }
  }, [isOpen, step]);

  useEffect(() => {
    let interval: any;
    if (isOpen && step === 2 && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, step, timer]);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    setApiMessage('');
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Enter valid 10-digit number');
      return;
    }
    setLoading(true);
    setLoadingAction('Sending OTP...');
    const res = await sendOtpApi(mobile, "null", 'Login');
    if (res.success) {
      setStep(2);
      setTimer(60);
      setOtp(new Array(6).fill(''));
      setError('');
    } else {
      setApiMessage(res.message);
    }
    setLoading(false);
    setLoadingAction('');
  };

  const handleVerifyOtpWithCode = async (codeToVerify?: string) => {
    const otpCode = codeToVerify || otp.join('');
    if (otpCode.length < 6) return;
    setLoading(true);
    setLoadingAction('Logging In...');
    setApiMessage('');

    const res = await verifyOtpApi({
      action: "WEB_LOGIN",
      fullName: "",
      mobileNumber: mobile,
      otpCode,
      email: null,
      gender: null,
      profileCreatedFor: 0
    });

    if (res && (res.success === true || res.success === "true" || res.status === 200)) {
      onClose();
      handleAuthSuccessRedirect(res, router);
    } else {
      setApiMessage(res.message || 'Login verification failed');
      setLoading(false);
      setLoadingAction('');
    }
  };

  const handleOtpChange = (val: string, index: number) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    if (val !== '' && index < 5) {
      otpRefs.current[index + 1]?.focus();
      setActiveOtpIndex(index + 1);
    }

    if (val !== '' && index === 5) {
      const fullCode = newOtp.join('');
      if (fullCode.length === 6) {
        setTimeout(() => handleVerifyOtpWithCode(fullCode), 120);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      otpRefs.current[5]?.focus();
      setActiveOtpIndex(5);
      setTimeout(() => handleVerifyOtpWithCode(pastedData), 120);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 overflow-y-auto">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-[400px] bg-white rounded-3xl shadow-2xl border-2 border-rose-100 overflow-hidden my-auto text-slate-800"
        >
          {/* CLOSE BUTTON */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-500 text-slate-700 hover:text-white border border-slate-200 flex items-center justify-center font-extrabold text-sm transition-all cursor-pointer shadow-sm active:scale-95"
          >
            ✕
          </button>

          {/* CLEAN WHITE HEADER */}
          <div className="bg-white px-6 pt-7 pb-3 text-center text-slate-900 border-b border-slate-100 relative">
            <h2 className="font-sans font-extrabold text-xl text-slate-900">
              {step === 1 ? 'Welcome Back' : 'Verify Mobile OTP'}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1">
              {step === 1 ? 'Sign in to access your Nikah Qubool account' : `OTP sent to +91 ${mobile}`}
            </p>
          </div>

          <div className="p-6 sm:p-7">
            {step === 1 ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-500 font-bold text-xs pointer-events-none border-r border-slate-300 pr-2">
                      <Phone size={14} className="text-[#d91b5c]" />
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '')); setError(''); }}
                      className={`w-full pl-18 pr-4 py-3.5 rounded-xl border-2 bg-slate-50/80 outline-none text-sm font-semibold transition-all shadow-xs ${
                        error 
                          ? 'border-rose-500 text-rose-600 bg-rose-50/30' 
                          : 'border-slate-300 focus:border-[#d91b5c] focus:bg-white focus:ring-4 focus:ring-[#d91b5c]/10 text-slate-800'
                      }`}
                      placeholder="Enter 10-digit number"
                    />
                  </div>
                  {error && <p className="text-rose-600 text-[11px] font-bold ml-1 mt-1">{error}</p>}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  onClick={handleSendOtp}
                  className="w-full py-4 bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] hover:brightness-110 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-rose-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-rose-300/30"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-amber-300" />
                      <span>{loadingAction}</span>
                    </>
                  ) : (
                    <>
                      <span>Send Login OTP</span>
                      <ArrowRight size={16} className="text-amber-300" />
                    </>
                  )}
                </motion.button>

                {apiMessage && (
                  <p className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 text-center">
                    {apiMessage}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-5 text-center">
                <div className="flex gap-2 justify-center py-2">
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onFocus={() => setActiveOtpIndex(i)}
                      onPaste={handleOtpPaste}
                      onChange={(e) => handleOtpChange(e.target.value, i)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[i] && i > 0) {
                          otpRefs.current[i - 1]?.focus();
                          setActiveOtpIndex(i - 1);
                        }
                      }}
                      className={`w-11 h-13 text-lg font-bold text-center border-2 rounded-xl outline-none text-slate-900 bg-slate-50 transition-all ${
                        activeOtpIndex === i 
                          ? 'border-[#d91b5c] ring-4 ring-[#d91b5c]/20 bg-white' 
                          : 'border-slate-300'
                      }`}
                    />
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  onClick={() => handleVerifyOtpWithCode()}
                  className="w-full py-4 bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] hover:brightness-110 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-rose-300/30"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-amber-300" />
                      <span>{loadingAction}</span>
                    </>
                  ) : (
                    'Verify & Login Now'
                  )}
                </motion.button>

                <div className="pt-1">
                  <p className="text-xs text-slate-500 font-medium">Resend code in <span className="font-bold text-[#d91b5c]">0:{timer.toString().padStart(2, '0')}</span></p>
                  {timer === 0 && (
                    <button onClick={handleSendOtp} className="text-[#d91b5c] font-bold text-xs underline mt-2 hover:text-[#6e0932] cursor-pointer">
                      Resend OTP Now
                    </button>
                  )}
                  {apiMessage && <p className="text-xs text-rose-600 font-bold mt-2">{apiMessage}</p>}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
