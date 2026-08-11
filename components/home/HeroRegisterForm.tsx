"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Mail, Users, ShieldCheck, ArrowRight, Loader2, Lock } from 'lucide-react';
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
        className="w-full max-w-[420px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-rose-950/15 border-2 border-rose-100 overflow-hidden relative group"
      >
        {/* HEADER WITH GRADIENT & ICON */}
        <div className="bg-gradient-to-r from-[#870c3f] via-[#a3124e] to-[#870c3f] px-6 py-4.5 text-center text-white relative shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck size={18} className="text-amber-300" />
            <span className="font-serif font-black text-xs sm:text-sm tracking-widest uppercase text-amber-200">
              Begin Your Blessed Journey
            </span>
          </div>
          <p className="text-[11px] font-medium text-rose-100/90 mt-0.5">Free Registration • 100% Verified Profiles</p>
        </div>
        
        <div className="p-6 sm:p-7 space-y-4 text-slate-800">

          {/* 1. PROFILE CREATED FOR DROPDOWN */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Create Profile For
            </label>
            <div className="relative">
              <Users size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#870c3f] pointer-events-none" />
              <select
                value={profileFor}
                onChange={(e) => handleProfileForChange(e.target.value)}
                className={`w-full pl-10 pr-4 py-3.5 rounded-xl border-2 bg-slate-50/80 outline-none text-sm font-semibold transition-all shadow-xs ${
                  errors.profileFor 
                    ? 'border-rose-500 text-rose-600 bg-rose-50/30' 
                    : 'border-slate-300 focus:border-[#870c3f] focus:bg-white focus:ring-4 focus:ring-[#870c3f]/10 text-slate-800'
                }`}
              >
                <option value="">{dropdownLoading ? 'Loading Options...' : 'Select Relation'}</option>
                {options.map((opt) => (
                  <option key={opt.id} value={opt.id} className="text-slate-900">
                    {opt.value}
                  </option>
                ))}
              </select>
            </div>
            {errors.profileFor && <p className="text-[11px] text-rose-600 font-bold ml-1 mt-1">{errors.profileFor}</p>}
          </div>

          {/* GENDER SELECTION (IF SELF OR RELATIVE) */}
          {showGenderSelection && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Gender
              </label>
              <div className={`flex gap-2 p-1.5 rounded-xl border-2 bg-slate-50 transition-all ${errors.gender ? 'border-rose-500' : 'border-slate-300'}`}>
                {['male', 'female'].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      gender === g 
                        ? 'bg-[#870c3f] text-white shadow-md' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {g === 'male' ? '👨 Male' : '👩 Female'}
                  </button>
                ))}
              </div>
              {errors.gender && <p className="text-[11px] text-rose-600 font-bold ml-1 mt-1">{errors.gender}</p>}
            </div>
          )}

          {/* 2. FULL NAME */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#870c3f] pointer-events-none" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className={`w-full pl-10 pr-4 py-3.5 rounded-xl border-2 bg-slate-50/80 outline-none text-sm font-semibold transition-all shadow-xs ${
                  errors.fullName 
                    ? 'border-rose-500 text-rose-600 bg-rose-50/30' 
                    : 'border-slate-300 focus:border-[#870c3f] focus:bg-white focus:ring-4 focus:ring-[#870c3f]/10 text-slate-800'
                }`}
                placeholder="e.g. Mohammad Sameer"
              />
            </div>
            {errors.fullName && <p className="text-[11px] text-rose-600 font-bold ml-1 mt-1">{errors.fullName}</p>}
          </div>

          {/* 3. MOBILE NUMBER */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Mobile Number
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-500 font-bold text-xs pointer-events-none border-r border-slate-300 pr-2">
                <Phone size={14} className="text-[#870c3f]" />
                <span>+91</span>
              </div>
              <input
                type="tel"
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                className={`w-full pl-18 pr-4 py-3.5 rounded-xl border-2 bg-slate-50/80 outline-none text-sm font-semibold transition-all shadow-xs ${
                  errors.mobileNumber 
                    ? 'border-rose-500 text-rose-600 bg-rose-50/30' 
                    : 'border-slate-300 focus:border-[#870c3f] focus:bg-white focus:ring-4 focus:ring-[#870c3f]/10 text-slate-800'
                }`}
                placeholder="10-digit number"
              />
            </div>
            {errors.mobileNumber && <p className="text-[11px] text-rose-600 font-bold ml-1 mt-1">{errors.mobileNumber}</p>}
          </div>

          {/* 4. EMAIL ADDRESS */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#870c3f] pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full pl-10 pr-4 py-3.5 rounded-xl border-2 bg-slate-50/80 outline-none text-sm font-semibold transition-all shadow-xs ${
                  errors.email 
                    ? 'border-rose-500 text-rose-600 bg-rose-50/30' 
                    : 'border-slate-300 focus:border-[#870c3f] focus:bg-white focus:ring-4 focus:ring-[#870c3f]/10 text-slate-800'
                }`}
                placeholder="name@example.com"
              />
            </div>
            {errors.email && <p className="text-[11px] text-rose-600 font-bold ml-1 mt-1">{errors.email}</p>}
          </div>

          {/* SUBMIT BUTTON */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            onClick={handleRegisterSubmit}
            className="w-full py-4 bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-rose-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-rose-300/30"
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
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
              <p className="text-xs font-bold text-rose-600">{apiMessage}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* OTP MODAL */}
      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-[390px] bg-white p-7 sm:p-8 rounded-3xl shadow-2xl border border-rose-100 my-auto text-slate-800"
            >
              <button
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-[#870c3f] hover:text-white flex items-center justify-center font-bold text-xs transition-all cursor-pointer"
                onClick={() => setShowOtpModal(false)}
              >
                ✕
              </button>

              <div className="space-y-5 text-center">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#870c3f] flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <Lock size={24} />
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-slate-900">Verify Mobile OTP</h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Enter 6-digit OTP sent to <span className="font-bold text-[#870c3f]">+91 {mobileNumber}</span></p>
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
                      className={`w-11 h-13 text-lg font-bold text-center border-2 rounded-xl outline-none text-slate-900 bg-slate-50 transition-all ${
                        activeOtpIndex === i 
                          ? 'border-[#870c3f] ring-4 ring-[#870c3f]/20 bg-white' 
                          : 'border-slate-200'
                      }`}
                    />
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  onClick={() => handleVerifyOtpWithCode()}
                  className="w-full py-4 bg-[#870c3f] hover:bg-[#6e0932] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>{loadingAction}</span>
                    </>
                  ) : (
                    'Verify & Create Account'
                  )}
                </motion.button>

                <div className="pt-1">
                  <p className="text-xs text-slate-500 font-medium">Resend code in <span className="font-bold text-[#870c3f]">0:{timer.toString().padStart(2, '0')}</span></p>
                  {timer === 0 && (
                    <button onClick={handleRegisterSubmit} className="text-[#870c3f] font-bold text-xs underline mt-2 hover:text-[#6e0932] cursor-pointer">
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