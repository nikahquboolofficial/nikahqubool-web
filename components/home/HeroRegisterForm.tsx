"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Mail, Users, ShieldCheck, ArrowRight, Loader2, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { fetchProfileCreatedForOptions, sendOtpApi, verifyOtpApi, MasterOption } from '@/lib/api';
import { handleAuthSuccessRedirect } from '@/lib/auth';

export default function HeroRegisterForm() {
  const router = useRouter();
  
  const [profileFor, setProfileFor] = useState('');
  const [gender, setGender] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const [options, setOptions] = useState<MasterOption[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [errors, setErrors] = useState({ profileFor: '', gender: '', fullName: '', mobileNumber: '', email: '' });

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [timer, setTimer] = useState(60);
  const [apiMessage, setApiMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState('');
  const [activeOtpIndex, setActiveOtpIndex] = useState<number>(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetchProfileCreatedForOptions().then((res) => {
      setOptions(res);
      setDropdownLoading(false);
    });
  }, []);

  useEffect(() => {
    let int: any;
    if (showOtpModal && timer > 0) {
      int = setInterval(() => setTimer((p) => p - 1), 1000);
    }
    return () => clearInterval(int);
  }, [showOtpModal, timer]);

  useEffect(() => {
    if (showOtpModal) {
      setTimeout(() => {
        otpRefs.current[0]?.focus();
        setActiveOtpIndex(0);
      }, 150);
    }
  }, [showOtpModal]);

  const handleProfileForChange = (val: string) => {
    setProfileFor(val);
    const selectedOpt = options.find(o => o.id.toString() === val.toString());
    const lowerVal = selectedOpt ? selectedOpt.value.toLowerCase() : '';
    if (['son', 'brother'].includes(lowerVal)) setGender('male');
    else if (['daughter', 'sister'].includes(lowerVal)) setGender('female');
    else setGender('');
    setErrors(prev => ({ ...prev, profileFor: '' }));
  };

  const handleInputChange = (field: string, val: string) => {
    if (field === 'fullName') setFullName(val);
    if (field === 'mobileNumber') setMobileNumber(val.replace(/\D/g, ''));
    if (field === 'email') setEmail(val);
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRegisterSubmit = async () => {
    setApiMessage('');
    let errs = { profileFor: '', gender: '', fullName: '', mobileNumber: '', email: '' };
    let fail = false;

    if (!profileFor) { errs.profileFor = 'Please select relation'; fail = true; }
    if (!fullName.trim()) { errs.fullName = 'Full name is required'; fail = true; }
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) { errs.mobileNumber = 'Valid 10-digit number required'; fail = true; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errs.email = 'Valid email required'; fail = true; }

    const selectedOpt = options.find(o => o.id.toString() === profileFor.toString());
    const lowerVal = selectedOpt ? selectedOpt.value.toLowerCase() : '';
    if (['self', 'relative/friend'].includes(lowerVal) && !gender) {
      errs.gender = 'Gender required'; fail = true;
    }

    setErrors(errs);
    if (fail) return;

    setLoading(true);
    setLoadingAction('Sending OTP...');
    const res = await sendOtpApi(mobileNumber, email, 'Register');
    if (res.success) {
      setShowOtpModal(true);
      setTimer(60);
      setOtp(new Array(6).fill(''));
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
    setLoadingAction('Verifying...');
    setApiMessage('');

    const payload = {
      action: "WEB_REG",
      fullName: fullName.trim(),
      mobileNumber: mobileNumber.trim(),
      otpCode: otpCode.trim(),
      email: email.trim(),
      gender: gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : '',
      profileCreatedFor: profileFor ? Number(profileFor) : 0
    };

    const res = await verifyOtpApi(payload);
    if (res && (res.success === true || res.success === "true" || res.status === 200)) {
      setShowOtpModal(false);
      handleAuthSuccessRedirect(res, router);
    } else {
      setApiMessage(res.message || 'Verification failed. Please try again.');
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

  const selectedOpt = options.find(o => o.id.toString() === profileFor.toString());
  const showGenderSelection = selectedOpt && ['self', 'relative/friend'].includes(selectedOpt.value.toLowerCase());

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative group"
      >
        {/* CLEAN WHITE HEADER */}
        <div className="bg-white px-7 pt-7 pb-2 text-center text-slate-900 border-b border-slate-100">
          <h2 className="font-sans font-black text-xl sm:text-22px tracking-tight text-slate-900">
            Register and find your soulmate
          </h2>
          <p className="text-xs font-bold text-[#d91b5c] mt-1 flex items-center justify-center gap-1.5">
            <Sparkles size={13} className="text-amber-500" /> Free Registration • 100% Verified Proposals
          </p>
        </div>
        
        <div className="p-6 sm:p-7 space-y-4 text-slate-800">

          {/* 1. PROFILE CREATED FOR DROPDOWN */}
          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
              Create Profile For <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Users size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#d91b5c] pointer-events-none" />
              <select
                value={profileFor}
                onChange={(e) => handleProfileForChange(e.target.value)}
                className={`w-full pl-10 pr-4 py-3.5 rounded-2xl border-2 bg-slate-50 outline-none text-xs sm:text-sm font-bold transition-all shadow-xs ${
                  errors.profileFor 
                    ? 'border-rose-500 text-rose-600 bg-rose-50/40' 
                    : 'border-slate-200 focus:border-[#d91b5c] focus:bg-white focus:ring-4 focus:ring-[#d91b5c]/10 text-slate-800'
                }`}
              >
                <option value="">{dropdownLoading ? 'Loading Options...' : 'Select Relation'}</option>
                {options.map((opt) => (
                  <option key={opt.id} value={opt.id} className="text-slate-900 font-bold">
                    {opt.value}
                  </option>
                ))}
              </select>
            </div>
            {errors.profileFor && <p className="text-[11px] text-rose-600 font-bold ml-1 mt-1">{errors.profileFor}</p>}
          </div>

          {/* GENDER SELECTION (IF APPLICABLE) */}
          {showGenderSelection && (
            <div>
              <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
                Gender <span className="text-rose-500">*</span>
              </label>
              <div className={`flex gap-2 p-1 rounded-2xl border-2 bg-slate-50 transition-all ${errors.gender ? 'border-rose-500' : 'border-slate-200'}`}>
                {['male', 'female'].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      gender === g 
                        ? 'bg-[#d91b5c] text-white shadow-md' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {g === 'male' ? '👨 Groom (Male)' : '👩 Bride (Female)'}
                  </button>
                ))}
              </div>
              {errors.gender && <p className="text-[11px] text-rose-600 font-bold ml-1 mt-1">{errors.gender}</p>}
            </div>
          )}

          {/* 2. FULL NAME */}
          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#d91b5c] pointer-events-none" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className={`w-full pl-10 pr-4 py-3.5 rounded-2xl border-2 bg-slate-50 outline-none text-xs sm:text-sm font-bold transition-all shadow-xs ${
                  errors.fullName 
                    ? 'border-rose-500 text-rose-600 bg-rose-50/40' 
                    : 'border-slate-200 focus:border-[#d91b5c] focus:bg-white focus:ring-4 focus:ring-[#d91b5c]/10 text-slate-800'
                }`}
                placeholder="e.g. Mohammad Sameer Khan"
              />
            </div>
            {errors.fullName && <p className="text-[11px] text-rose-600 font-bold ml-1 mt-1">{errors.fullName}</p>}
          </div>

          {/* 3. MOBILE NUMBER */}
          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
              Mobile Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-600 font-extrabold text-xs pointer-events-none border-r border-slate-300 pr-2">
                <Phone size={14} className="text-[#d91b5c]" />
                <span>+91</span>
              </div>
              <input
                type="tel"
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                className={`w-full pl-18 pr-4 py-3.5 rounded-2xl border-2 bg-slate-50 outline-none text-xs sm:text-sm font-bold transition-all shadow-xs ${
                  errors.mobileNumber 
                    ? 'border-rose-500 text-rose-600 bg-rose-50/40' 
                    : 'border-slate-200 focus:border-[#d91b5c] focus:bg-white focus:ring-4 focus:ring-[#d91b5c]/10 text-slate-800'
                }`}
                placeholder="10-digit mobile number"
              />
            </div>
            {errors.mobileNumber && <p className="text-[11px] text-rose-600 font-bold ml-1 mt-1">{errors.mobileNumber}</p>}
          </div>

          {/* 4. EMAIL ADDRESS */}
          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#d91b5c] pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full pl-10 pr-4 py-3.5 rounded-2xl border-2 bg-slate-50 outline-none text-xs sm:text-sm font-bold transition-all shadow-xs ${
                  errors.email 
                    ? 'border-rose-500 text-rose-600 bg-rose-50/40' 
                    : 'border-slate-200 focus:border-[#d91b5c] focus:bg-white focus:ring-4 focus:ring-[#d91b5c]/10 text-slate-800'
                }`}
                placeholder="name@example.com"
              />
            </div>
            {errors.email && <p className="text-[11px] text-rose-600 font-bold ml-1 mt-1">{errors.email}</p>}
          </div>

          {/* SUBMIT BUTTON */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            onClick={handleRegisterSubmit}
            className="w-full py-4 bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] hover:brightness-110 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-rose-900/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-rose-300/30"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin text-amber-300" />
                <span>{loadingAction}</span>
              </>
            ) : (
              <>
                <span>Register Free Now</span>
                <ArrowRight size={16} className="text-amber-300" />
              </>
            )}
          </motion.button>

          {apiMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-center">
              <p className="text-xs font-bold text-rose-600">{apiMessage}</p>
            </div>
          )}

          <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-wider">
            By registering, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </motion.div>

      {/* OTP MODAL */}
      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-[400px] bg-white p-7 sm:p-8 rounded-3xl shadow-2xl border-2 border-rose-100 my-auto text-slate-800"
            >
              <button
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-[#d91b5c] hover:text-white flex items-center justify-center font-bold text-xs transition-all cursor-pointer shadow-xs"
                onClick={() => setShowOtpModal(false)}
              >
                ✕
              </button>

              <div className="space-y-5 text-center">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 text-[#d91b5c] border-2 border-rose-100 flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Lock size={26} />
                  </div>
                  <h2 className="text-2xl font-serif font-extrabold text-slate-900 uppercase tracking-tight">Verify Mobile OTP</h2>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">Enter 6-digit OTP sent to <span className="font-extrabold text-[#d91b5c]">+91 {mobileNumber}</span></p>
                </div>

                <div className="flex gap-2 justify-center py-2">
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el }}
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
                      className={`w-11 h-13 text-xl font-black text-center border-2 rounded-2xl outline-none text-slate-900 transition-all ${
                        activeOtpIndex === i 
                          ? 'border-[#d91b5c] ring-4 ring-[#d91b5c]/20 bg-white shadow-md' 
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    />
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  onClick={() => handleVerifyOtpWithCode()}
                  className="w-full py-4 bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] hover:brightness-110 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-rose-300/30"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-amber-300" />
                      <span>{loadingAction}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} className="text-amber-300" />
                      <span>Verify & Create Account</span>
                    </>
                  )}
                </motion.button>

                <div className="pt-1">
                  <p className="text-xs text-slate-500 font-semibold">Resend code in <span className="font-bold text-[#d91b5c]">0:{timer.toString().padStart(2, '0')}</span></p>
                  {timer === 0 && (
                    <button onClick={handleRegisterSubmit} className="text-[#d91b5c] font-extrabold text-xs underline mt-2 hover:text-[#6e0932] cursor-pointer">
                      Resend OTP Now
                    </button>
                  )}
                  {apiMessage && <p className="text-xs text-rose-600 font-bold mt-2">{apiMessage}</p>}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
