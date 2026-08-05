"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface FormErrors {
  profileFor: string; gender: string; fullName: string; mobileNumber: string; email: string;
}

interface MasterOption {
  id: number;
  value: string;
  stateId?: any;
}

export default function PakizaRishteFinalTS() {
  const router = useRouter();
  
  // --- FORM STATES ---
  const [profileFor, setProfileFor] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
   const [activeStory, setActiveStory] = useState(0);

  const [errors, setErrors] = useState<FormErrors>({ profileFor: '', gender: '', fullName: '', mobileNumber: '', email: '' });

  // Dynamic Dropdown State
  const [profileForOptions, setProfileForOptions] = useState<MasterOption[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState<boolean>(true);

  // API Message States
  const [regApiMessage, setRegApiMessage] = useState<string>('');
  const [loginApiMessage, setLoginApiMessage] = useState<string>('');

  // Modal & Step States
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginStep, setLoginStep] = useState<1 | 2>(1);
  const [loginMobile, setLoginMobile] = useState<string>('');
  const [loginOtp, setLoginOtp] = useState<string[]>(new Array(6).fill(''));
  const [loginTimer, setLoginTimer] = useState<number>(60);
  const [loginError, setLoginError] = useState<string>('');
const [isMounted, setIsMounted] = useState(false);
  const [showRegOtpModal, setShowRegOtpModal] = useState<boolean>(false);
  const [regOtp, setRegOtp] = useState<string[]>(new Array(6).fill(''));
  const [regTimer, setRegTimer] = useState<number>(60);
  
  // Process / Loader states for buttons
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<string>('');
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const loginOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

   const stories = [
    {
      name: "Sana & Zaid",
      location: "Bareilly",
      img: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200",
      text: "Alhamdulillah, Pakiza Rishte se humein wo sab mila jo hum ek partner mein dhoond rahe the. Process itna simple tha ki family ne bhi turant haan keh di."
    },
    {
      name: "Mehak & Arif",
      location: "Bareilly (Civil Lines)",
      img: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200",
      text: "The security features here are best. Maine kayi profiles dekhi par jab Arif se baat hui to pata chala ki verified profiles ka kya fayda hota hai."
    },
    {
      name: "Iqra & Sameer",
      location: "Bareilly",
      img: "https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?q=80&w=1200",
      text: "Finding a soulmate in your own city was never this easy. Today we are happily married and thankful to the entire team of Pakiza Rishte."
    },
  ];


  // Crisp, high-definition Nikah / Muslim Wedding imagery (Zero Blur)
  const banners = [
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=100&w=2400",
    "https://images.unsplash.com/photo-1519741497674-611481863552?q=100&w=2400",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=100&w=2400"
  ];

  // --- FETCH MASTER DATA FOR PROFILE_CREATED_FOR ---
  useEffect(() => {
    const fetchProfileForDropdown = async () => {
      try {
        const res = await fetch("https://crm.altawafumrah.com/api/Master/PROFILE_CREATED_FOR");
        const result = await res.json();
        if (result && result.success && Array.isArray(result.data)) {
          setProfileForOptions(result.data);
        }
      } catch (e) {
        console.error("Failed to fetch profile options", e);
      } finally {
        setDropdownLoading(false);
      }
    };

    fetchProfileForDropdown();
  }, []);

  // Auto focus first OTP input when modal opens
  useEffect(() => {
    if (showRegOtpModal) {
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    }
  }, [showRegOtpModal]);

  useEffect(() => {
    if (showLoginModal && loginStep === 2) {
      setTimeout(() => loginOtpRefs.current[0]?.focus(), 150);
    }
  }, [showLoginModal, loginStep]);

  const setAuthCookies = (result: any) => {
    const days = 7; 
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
   
    const isCompletedRaw = result?.isProfileCompleted ?? result?.IsProfileCompleted;
    const isCompleted = (isCompletedRaw === true || isCompletedRaw === 1 || isCompletedRaw === "1" || isCompletedRaw === "true");
    const profileCompletedVal = isCompleted ? '1' : '0';

    document.cookie = `user_token=${result.token}; expires=${expires}; path=/; SameSite=Lax`;
    document.cookie = `is_profile_completed=${profileCompletedVal}; expires=${expires}; path=/; SameSite=Lax`;

    const sessionData = {
      token: result.token,
      userId: result.userId,
      fullName: result.fullName,
      isProfileCompleted: isCompleted,
      loginDate: new Date().getTime()
    };
    localStorage.setItem('user_session', JSON.stringify(sessionData));
  };

  const handleAuthSuccess = (result: any) => {
    setAuthCookies(result);

    const isCompletedRaw = result?.isProfileCompleted ?? result?.IsProfileCompleted;
    const isProfileDone = (isCompletedRaw === true || isCompletedRaw === 1 || isCompletedRaw === "1" || isCompletedRaw === "true");

    if (isProfileDone) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/complete-profile';
    }
  };

  // --- HELPERS ---
  const handleInputChange = (field: keyof FormErrors, value: string) => {
    if (field === 'profileFor') {
        setProfileFor(value);
        const selectedOpt = profileForOptions.find(opt => opt.id.toString() === value.toString());
        const lowerVal = selectedOpt ? selectedOpt.value.toLowerCase() : '';
        
        if(['son', 'brother'].includes(lowerVal)) setGender('male');
        else if(['daughter', 'sister'].includes(lowerVal)) setGender('female');
        else setGender('');
    }
    if (field === 'gender') setGender(value);
    if (field === 'fullName') setFullName(value);
    if (field === 'mobileNumber') setMobileNumber(value.replace(/\D/g,''));
    if (field === 'email') setEmail(value);
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // Smooth scroll active field above mobile keyboard
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  useEffect(() => {
    const int = setInterval(() => setCurrentSlide(p => (p === 2 ? 0 : p + 1)), 6000);
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    let int: any;
    if (showRegOtpModal && regTimer > 0) int = setInterval(() => setRegTimer(p => p - 1), 1000);
    return () => clearInterval(int);
  }, [showRegOtpModal, regTimer]);

  useEffect(() => {
    let int: any;
    if (showLoginModal && loginStep === 2 && loginTimer > 0) int = setInterval(() => setLoginTimer(p => p - 1), 1000);
    return () => clearInterval(int);
  }, [showLoginModal, loginStep, loginTimer]);

  // --- API LOGIC ---
  const sendOtpApi = async (phone: string, mail: string, action: 'Register' | 'Login') => {
    try {
      const res = await fetch("https://crm.altawafumrah.com/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: phone, email: mail || "null", source: "Web", action: action }),
      });
      return await res.json();
    } catch (e) { return { success: false, message: 'Server Connection Error' }; }
  };

  const verifyOtpApi = async (payload: any) => {
    try {
      const res = await fetch("https://crm.altawafumrah.com/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e) { return { success: false, message: 'Connection Error' }; }
  };

  // --- HANDLERS ---
  const handleRegistration = async () => {
    setRegApiMessage('');
    const mobileRegex = /^[6-9]\d{9}$/;
    let errs = { profileFor: '', gender: '', fullName: '', mobileNumber: '', email: '' };
    let fail = false;

    if (!profileFor) { errs.profileFor = 'Please select an option'; fail = true; }
    if (!fullName.trim()) { errs.fullName = 'Full name is required'; fail = true; }
    if (!mobileRegex.test(mobileNumber)) { errs.mobileNumber = 'Valid 10-digit number required'; fail = true; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errs.email = 'Valid email required'; fail = true; }
    
    const selectedOpt = profileForOptions.find(opt => opt.id.toString() === profileFor.toString());
    const lowerProfileFor = selectedOpt ? selectedOpt.value.toLowerCase() : '';
    if (['self', 'relative/friend'].includes(lowerProfileFor) && !gender) { errs.gender = 'Gender required'; fail = true; }

    setErrors(errs);
    if (fail) return;

    setLoading(true);
    setLoadingAction('Sending OTP...');
    const result = await sendOtpApi(mobileNumber, email, 'Register');
    if (result.success) { setShowRegOtpModal(true); setRegTimer(60); }
    else setRegApiMessage(result.message);
    setLoading(false);
    setLoadingAction('');
  };

  const handleVerifyRegistration = async () => {
    const otpCode = regOtp.join('');
    if(otpCode.length < 6) return;
    
    setLoading(true);
    setLoadingAction('Verifying & Registering...');
    setRegApiMessage('');

    const payload = {
        action: "WEB_REG", 
        fullName: fullName.trim(), 
        mobileNumber: mobileNumber.trim(), 
        otpCode: otpCode.trim(), 
        email: email.trim(),
        gender: gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : '',
        profileCreatedFor: profileFor ? Number(profileFor) : 0
    };

    const result = await verifyOtpApi(payload);
    
    if (result && (result.success === true || result.success === "true" || result.status === 200)) { 
      handleAuthSuccess(result); 
    } else { 
      setRegApiMessage(result.message || 'Verification failed. Please try again.'); 
      setLoading(false);
      setLoadingAction('');
    }
  };

  const handleLoginSubmit = async () => {
    setLoginApiMessage('');
    if (!/^[6-9]\d{9}$/.test(loginMobile)) { setLoginError('Enter valid 10-digit number'); return; }
    setLoading(true);
    setLoadingAction('Sending OTP...');
    const result = await sendOtpApi(loginMobile, "null", 'Login');
    if (result.success) { setLoginStep(2); setLoginTimer(60); setLoginError(''); }
    else setLoginApiMessage(result.message);
    setLoading(false);
    setLoadingAction('');
  };

  const handleVerifyLogin = async () => {
    const otpCode = loginOtp.join('');
    if(otpCode.length < 6) return;
    setLoading(true);
    setLoadingAction('Logging In...');
    const result = await verifyOtpApi({
        action: "WEB_LOGIN", fullName: "", mobileNumber: loginMobile, otpCode, email: null, gender: null, profileCreatedFor: 0
    });
    if (result && (result.success === true || result.success === "true" || result.status === 200)) {
      handleAuthSuccess(result);
    } else {
      setLoginApiMessage(result.message || 'Login verification failed');
      setLoading(false);
      setLoadingAction('');
    }
  };

  const handleOtpInput = (value: string, index: number, type: 'reg' | 'login') => {
    if (!/^\d*$/.test(value)) return;
    const isReg = type === 'reg';
    const newOtp = isReg ? [...regOtp] : [...loginOtp];
    newOtp[index] = value.slice(-1);
    isReg ? setRegOtp(newOtp) : setLoginOtp(newOtp);
    if (value !== '' && index < 5) (isReg ? otpRefs : loginOtpRefs).current[index + 1]?.focus();
  };

  const currentSelectedOpt = profileForOptions.find(opt => opt.id.toString() === profileFor.toString());
  const showGenderSelection = currentSelectedOpt && ['self', 'relative/friend'].includes(currentSelectedOpt.value.toLowerCase());

  return (
    <div className="min-h-screen bg-[#ffe0e9] text-[#870c3f] font-sans selection:bg-[#870c3f] selection:text-white">
      {/* Navbar with exact user colors */}
     <nav className="fixed top-0 w-full h-20 bg-[#ffe0e9]/95 backdrop-blur-md flex items-center justify-between px-3 sm:px-6 lg:px-[8%] z-[1000] border-b border-[#870c3f]/25 shadow-md m-0 rounded-none">
  <div className="flex items-center h-full">
    <a href="/" className="flex items-center h-full py-1">
      <img 
        src="/pakiza-rishte-website-logo-removebg-preview.png" 
        alt="Pakiza Rishte Logo" 
        className="h-14 sm:h-16 md:h-24 w-auto object-contain scale-[1.6] sm:scale-[1.8] md:scale-[2.3] origin-left drop-shadow-sm" 
      />
    </a>
  </div>

  <button 
    onClick={() => { setShowLoginModal(true); setLoginStep(1); setLoginMobile(''); setLoginOtp(new Array(6).fill('')); setLoginApiMessage(''); setLoginError(''); }}
    className="bg-[#870c3f] text-[#ffe0e9] px-4 sm:px-7 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-lg hover:bg-[#680930] active:scale-95 transition-all shrink-0 ml-2"
  >
    Login
  </button>
</nav>

      {/* Hero Section: Crystal Clear Images on Top, Form Stays on Top in Mobile, Zero Color Overlay on Images */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden">
        {/* High-Resolution Nikah Background Images without Color Filters */}
        <div className="absolute inset-0 z-0">
          {banners.map((img, idx) => (
            <div 
              key={idx} 
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 transform scale-100"
              style={{ 
                backgroundImage: `url('${img}')`, 
                opacity: currentSlide === idx ? 1 : 0,
                filter: 'brightness(0.9)'
              }}
            />
          ))}
          {/* Subtle vignette gradient only at extreme bottom/edges for readability, keeping image crystal clear */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#ffe0e9] via-transparent to-black/30 pointer-events-none" />
        </div>

        {/* Content Layout: Form First on Mobile (order-1), Text/Branding Next (order-2) */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col lg:grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Registration Card - Placed on Top for Mobile View */}
          <div className="w-full lg:col-span-5 flex justify-center order-1 lg:order-2">
            <div className="w-full max-w-[410px] bg-[#ffe0e9]/95 backdrop-blur-xl rounded-[32px] shadow-2xl shadow-[#870c3f]/30 overflow-hidden border-2 border-[#870c3f]/30">
              <div className="bg-[#870c3f] px-6 py-4 text-center text-[#ffe0e9] font-serif font-black text-sm tracking-widest uppercase shadow-md">
                Begin Your Blessed Journey
              </div>
              <div className="p-6 sm:p-7 space-y-4">
                {/* Profile For */}
                <div>
                  <select 
                    value={profileFor} 
                    onFocus={handleInputFocus}
                    className={`w-full px-4 py-3.5 rounded-2xl border bg-white outline-none text-sm font-semibold transition-all shadow-xs ${errors.profileFor ? 'border-red-500 text-[#870c3f]' : 'border-[#870c3f]/30 focus:border-[#870c3f] text-[#870c3f]'}`}
                    onChange={(e) => handleInputChange('profileFor', e.target.value)}
                  >
                    <option value="" className="text-gray-400">{dropdownLoading ? 'Loading Options...' : 'Profile Created For'}</option>
                    {profileForOptions.map((opt) => (
                      <option key={opt.id} value={opt.id} className="text-[#870c3f]">
                        {opt.value}
                      </option>
                    ))}
                  </select>
                  {errors.profileFor && <p className="text-[11px] text-red-600 font-bold ml-2 mt-1">{errors.profileFor}</p>}
                </div>

                {/* Gender Toggle Pill */}
                {showGenderSelection && (
                  <div>
                    <div className={`flex gap-2 p-1.5 rounded-2xl border bg-white transition-all ${errors.gender ? 'border-red-500' : 'border-[#870c3f]/30'}`}>
                      {['male', 'female'].map(g => (
                        <button 
                          key={g} 
                          type="button" 
                          onClick={() => handleInputChange('gender', g)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${gender === g ? 'bg-[#870c3f] text-[#ffe0e9] shadow-md' : 'text-[#870c3f]/60 hover:text-[#870c3f]'}`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                    {errors.gender && <p className="text-[11px] text-red-600 font-bold ml-2 mt-1">{errors.gender}</p>}
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <input 
                    type="text" 
                    value={fullName} 
                    onFocus={handleInputFocus}
                    onChange={(e)=>handleInputChange('fullName', e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-2xl border bg-white outline-none text-sm font-semibold transition-all shadow-xs ${errors.fullName ? 'border-red-500 text-[#870c3f]' : 'border-[#870c3f]/30 focus:border-[#870c3f] text-[#870c3f]'}`} 
                    placeholder="Full Name" 
                  />
                  {errors.fullName && <p className="text-[11px] text-red-600 font-bold ml-2 mt-1">{errors.fullName}</p>}
                </div>

                {/* Mobile Number */}
                <div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#870c3f]/60">+91</span>
                    <input 
                      type="tel" 
                      maxLength={10} 
                      value={mobileNumber} 
                      onFocus={handleInputFocus}
                      onChange={(e)=>handleInputChange('mobileNumber', e.target.value)}
                      className={`w-full px-4 py-3.5 pl-14 rounded-2xl border bg-white outline-none text-sm font-semibold transition-all shadow-xs ${errors.mobileNumber ? 'border-red-500 text-[#870c3f]' : 'border-[#870c3f]/30 focus:border-[#870c3f] text-[#870c3f]'}`} 
                      placeholder="Mobile Number" 
                    />
                  </div>
                  {errors.mobileNumber && <p className="text-[11px] text-red-600 font-bold ml-2 mt-1">{errors.mobileNumber}</p>}
                </div>

                {/* Email Address */}
                <div>
                  <input 
                    type="email" 
                    value={email} 
                    onFocus={handleInputFocus}
                    onChange={(e)=>handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-2xl border bg-white outline-none text-sm font-semibold transition-all shadow-xs ${errors.email ? 'border-red-500 text-[#870c3f]' : 'border-[#870c3f]/30 focus:border-[#870c3f] text-[#870c3f]'}`} 
                    placeholder="Email Address" 
                  />
                  {errors.email && <p className="text-[11px] text-red-600 font-bold ml-2 mt-1">{errors.email}</p>}
                </div>

                {/* Submit Action Button with Active Loader */}
                <button 
                  disabled={loading} 
                  onClick={handleRegistration} 
                  className="w-full py-4 bg-[#870c3f] text-[#ffe0e9] rounded-2xl text-sm font-black uppercase tracking-wider hover:bg-[#680930] shadow-xl shadow-[#870c3f]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {loading && (
                    <svg className="animate-spin h-5 w-5 text-[#ffe0e9]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {loading ? loadingAction : 'Register Now'}
                </button>

                {regApiMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                    <p className="text-xs font-bold text-red-600">{regApiMessage}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hero Branding & Content */}
          <div className="w-full lg:col-span-7 text-center lg:text-left space-y-6 order-2 lg:order-1 drop-shadow-lg">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#ffe0e9]/90 backdrop-blur-md border border-[#870c3f]/40 text-[#870c3f] text-xs font-black uppercase tracking-widest shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-[#870c3f] animate-ping"></span>
              100% Verified Nikah Platform
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-extrabold text-white leading-[1.1] tracking-tight">
              Pure Connections, <br/>
              <span className="text-[#ffe0e9] italic font-normal drop-shadow-md">Soulful Matches.</span>
            </h1>
            <p className="text-[#ffe0e9] text-sm sm:text-base max-w-lg mx-auto lg:mx-0 font-bold leading-relaxed bg-black/40 p-4 rounded-2xl backdrop-blur-xs border border-white/10">
              Find your ideal life partner with absolute privacy and trusted verified profiles tailored for honorable families.
            </p>
          </div>

        </div>
      </section>


 {/* --- 3. TRUST BAR --- */}
     {/* --- 3. PREMIUM GLOWING TRUST BAR --- */}
<div className="relative py-10 md:py-14 bg-[#ffe0e9] overflow-hidden border-y border-[#870c3f]/20">
  
  {/* Background Glow Effect */}
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[80px] bg-[#870c3f]/10 blur-[90px] rounded-full pointer-events-none" />

  <div className="relative flex overflow-hidden">
    {/* Marquee Container */}
    <div className="flex whitespace-nowrap animate-[scrollText_30s_linear_infinite] hover:[animation-play-state:paused] cursor-pointer">
      {[1, 2].map((group) => (
        <div key={group} className="flex items-center">
          {[
            { t: "100% Verified Profiles", i: "✅" },
            { t: "Secure & Halal", i: "🕌" },
            { t: "Privacy Guaranteed", i: "🔒" },
            { t: "Trusted Matchmaking", i: "🤝" },
            { t: "Strict Screening", i: "🛡️" }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="relative flex items-center mx-3 md:mx-4 px-4 py-2.5 md:px-6 md:py-3 rounded-xl bg-white/90 backdrop-blur-xl border border-[#870c3f]/20 shadow-[0_10px_25px_-5px_rgba(135,12,63,0.08)] hover:shadow-[0_15px_30px_-5px_rgba(135,12,63,0.15)] hover:border-[#870c3f] hover:-translate-y-0.5 transition-all duration-300 group"
            >
              {/* Subtle inner card gradient glow on hover */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#870c3f]/0 via-[#870c3f]/5 to-[#870c3f]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              {/* Icon */}
              <span className="text-lg md:text-xl mr-3 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                {item.i}
              </span>

              {/* Text Styling */}
              <span className="text-[11px] md:text-xs font-black tracking-wider text-[#870c3f] uppercase group-hover:text-[#680930] transition-colors">
                {item.t}
              </span>

              {/* Luxury Diamond Separator */}
              <div className="ml-4 md:ml-6 text-[#870c3f]/40 group-hover:text-[#870c3f] group-hover:rotate-90 transition-all duration-500 text-[10px]">
                ✦
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>

  {/* Left & Right Smooth Gradients matching theme */}
  <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-[#ffe0e9] via-[#ffe0e9]/80 to-transparent z-10 pointer-events-none" />
  <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-[#ffe0e9] via-[#ffe0e9]/80 to-transparent z-10 pointer-events-none" />

  <style jsx>{`
    @keyframes scrollText {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
  `}</style>
</div>




 
{/* SECTION 1: Why Choose Pakiza Rishte? (Pure White Background) */}
<section className="relative py-20 md:py-28 px-6 bg-white overflow-hidden border-b border-[#870c3f]/10">
  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#ffe0e9]/50 rounded-full blur-[140px] -z-10" />
  
  <div className="max-w-7xl mx-auto relative z-10">
    <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20 space-y-4">
      <span className="text-[#870c3f] font-black uppercase tracking-[0.3em] text-[10px] md:text-xs bg-[#ffe0e9] px-5 py-2 rounded-full shadow-xs border border-[#870c3f]/20">
        Excellence in Matchmaking
      </span>
      <h2 className="text-3xl md:text-5xl font-serif font-black text-[#870c3f] tracking-tight">
        Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#870c3f] to-amber-700 italic">Pakiza Rishte?</span>
      </h2>
      <p className="text-[#870c3f]/80 text-sm md:text-base font-medium">
        Designed exclusively keeping community values, absolute privacy, and verified families in mind.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[
        { title: "Halal & Secure", desc: "Every single profile undergoes rigorous manual 3-step screening to ensure zero fake accounts and complete peace of mind for Nikah.", badge: "100% VERIFIED", icon: "🛡️" },
        { title: "Privacy Control", desc: "Advanced privacy controls put you in charge. Choose exactly who views your family details, pictures, and contact numbers.", badge: "COMPLETE PRIVACY", icon: "💎" },
        { title: "Marriage Focus", desc: "Exclusively built for families and individuals serious about Sunnah and lifelong Nikah. No casual swiping, only meaningful connections.", badge: "NO DATING APP", icon: "🌿" }
      ].map((item, index) => (
        <div key={index} className="group relative bg-[#ffe0e9]/40 p-8 rounded-[36px] border border-[#870c3f]/15 shadow-[0_10px_30px_rgba(135,12,63,0.05)] hover:shadow-[0_20px_50px_rgba(135,12,63,0.12)] transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-[#870c3f]/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </div>
              <span className="text-[10px] font-black tracking-widest text-[#870c3f] bg-white px-3 py-1.5 rounded-full border border-[#870c3f]/20 shadow-xs">
                {item.badge}
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-serif font-black text-[#870c3f] mb-3">
              {item.title}
            </h3>
            <p className="text-[#870c3f]/75 text-sm md:text-base leading-relaxed font-medium">
              {item.desc}
            </p>
          </div>
          <div className="pt-6 mt-6 border-t border-[#870c3f]/10 flex items-center justify-between text-[#870c3f] font-black text-xs tracking-wider uppercase">
            <span className="group-hover:translate-x-1 transition-transform">Explore More</span>
            <span>→</span>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

{/* SECTION 2: How It Works / Steps (Soft Pink Background) */}
<section className="relative py-20 md:py-28 px-6 bg-[#ffe0e9] overflow-hidden border-b border-[#870c3f]/15">
  <div className="absolute top-1/2 left-0 w-[450px] h-[450px] bg-white/40 rounded-full blur-[120px] -z-10" />
  
  <div className="max-w-7xl mx-auto relative z-10">
    <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
      <span className="text-[#870c3f] font-black uppercase tracking-[0.3em] text-[10px] md:text-xs bg-white px-5 py-2 rounded-full shadow-xs border border-[#870c3f]/20">
        Simple Process
      </span>
      <h2 className="text-3xl md:text-5xl font-serif font-black text-[#870c3f] tracking-tight">
        How Pakiza Rishte <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#870c3f] to-amber-700 italic">Works</span>
      </h2>
      <p className="text-[#870c3f]/80 text-sm md:text-base font-medium">
        Finding your ideal life partner is now structured, safe, and transparent in just 3 easy steps.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[
        { step: "01", title: "Create Profile", desc: "Register securely with your family background, education, and partner preferences." },
        { step: "02", title: "Connect Families", desc: "Browse verified profiles and send interest requests directly to compatible families." },
        { step: "03", title: "Begin Nikah Journey", desc: "Interact safely through our platform and take the blessed step forward." }
      ].map((box, i) => (
        <div key={i} className="bg-white/80 backdrop-blur-md p-8 rounded-[36px] border border-[#870c3f]/20 shadow-lg space-y-4 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <span className="text-5xl font-serif font-black text-[#870c3f]/15 absolute top-4 right-6 group-hover:text-[#870c3f]/25 transition-colors">{box.step}</span>
          <div className="w-12 h-12 rounded-2xl bg-[#ffe0e9] border border-[#870c3f]/20 flex items-center justify-center text-[#870c3f] font-black text-lg">
            {box.step}
          </div>
          <h3 className="text-xl font-serif font-black text-[#870c3f]">{box.title}</h3>
          <p className="text-[#870c3f]/75 text-sm leading-relaxed font-medium">{box.desc}</p>
        </div>
      ))}
    </div>
  </div>
</section>

{/* SECTION 3: Featured / Verified Profiles Preview (Pure White Background) */}
<section className="relative py-20 md:py-28 px-6 bg-white overflow-hidden border-b border-[#870c3f]/10">
  <div className="max-w-7xl mx-auto relative z-10">
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
      <div className="space-y-4">
        <span className="text-[#870c3f] font-black uppercase tracking-[0.3em] text-[10px] md:text-xs bg-[#ffe0e9] px-5 py-2 rounded-full shadow-xs border border-[#870c3f]/20">
          Exclusive Matches
        </span>
        <h2 className="text-3xl md:text-5xl font-serif font-black text-[#870c3f] tracking-tight">
          Verified <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#870c3f] to-amber-700 italic">Profiles</span>
        </h2>
      </div>
      <button className="px-6 py-3 rounded-2xl bg-[#ffe0e9] border border-[#870c3f]/20 text-[#870c3f] font-black text-xs uppercase tracking-widest hover:bg-[#870c3f] hover:text-white transition-all shadow-sm">
        View All Profiles →
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[
        { id: "PR-8492", age: "26 Yrs", profession: "Software Engineer", location: "Bareilly, UP", edu: "B.Tech / M.Tech" },
        { id: "PR-9120", age: "24 Yrs", profession: "Doctor / Medical Professional", location: "Lucknow, UP", edu: "MBBS" },
        { id: "PR-7341", age: "27 Yrs", profession: "Business / Entrepreneur", location: "Delhi NCR", edu: "MBA" }
      ].map((profile, i) => (
        <div key={i} className="bg-[#ffe0e9]/30 rounded-[32px] border border-[#870c3f]/15 overflow-hidden shadow-sm hover:shadow-md transition-all p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-white border border-[#870c3f]/20 text-[10px] font-black text-[#870c3f]">{profile.id}</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">★ 100% Verified</span>
          </div>
          <div className="space-y-2">
            <h4 className="text-xl font-serif font-black text-[#870c3f]">{profile.profession}</h4>
            <p className="text-xs text-[#870c3f]/75 font-semibold">📍 {profile.location} • 🎓 {profile.edu} • 👤 {profile.age}</p>
          </div>
          <button className="w-full py-3 rounded-xl bg-white border border-[#870c3f]/20 text-[#870c3f] font-black text-xs uppercase tracking-wider hover:bg-[#870c3f] hover:text-white transition-all shadow-xs">
            Send Interest Request
          </button>
        </div>
      ))}
    </div>
  </div>
</section>

{/* SECTION 4: App Download / Mobile Showcase (Rich Deep Maroon Contrast Background) */}
<section className="relative py-24 md:py-32 px-6 bg-gradient-to-br from-[#380414] via-[#22020a] to-[#120105] text-white overflow-hidden">
  <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[150px] pointer-events-none" />
  
  <div className="max-w-7xl mx-auto relative z-10">
    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
      
      <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
        <span className="text-rose-300 font-black uppercase tracking-[0.3em] text-[10px] md:text-xs bg-rose-950/80 px-4 py-2 rounded-full border border-rose-700/40 shadow-lg">
          Fast & Secure Platform
        </span>
        <h2 className="text-3xl md:text-5xl font-serif font-black tracking-tight leading-tight">
          Your Perfect Match, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-pink-300 to-amber-200 italic">Always With You</span>
        </h2>
        <p className="text-rose-200/80 text-sm md:text-base leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium">
          Nikah ka safar ab aur bhi aasaan aur mehfooz ho gaya hai. Download karein app aur paayein verified rishton ki seedhi jankari apne phone par.
        </p>

        <div className="pt-4 flex flex-wrap justify-center lg:justify-start gap-4">
          <div className="px-6 py-3.5 rounded-2xl bg-white text-[#22020a] font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 cursor-pointer hover:bg-rose-100 transition-all">
            <span>🍏</span> App Store
          </div>
          <div className="px-6 py-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-white font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 cursor-pointer hover:bg-rose-900/80 transition-all">
            <span>🤖</span> Google Play
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex justify-center relative">
        <div className="absolute -inset-4 bg-gradient-to-r from-rose-500/20 to-amber-500/20 rounded-full blur-2xl" />
        <div className="relative p-4 rounded-[40px] bg-rose-950/40 border border-rose-500/20 backdrop-blur-md shadow-2xl max-w-sm w-full text-center">
          <div className="py-12 px-6 space-y-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-4xl shadow-lg shadow-rose-900/50">
              💍
            </div>
            <h4 className="text-2xl font-serif font-black text-white">Pakiza Rishte App</h4>
            <p className="text-xs text-rose-200/70">Instant notifications, chat securely with families, and browse profiles on the go.</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>

{/* SECTION 5: Success Stories / Testimonial Slider (Soft Pink Classic Theme) */}
<section className="relative py-20 md:py-28 px-6 bg-[#ffe0e9] overflow-hidden border-b border-[#870c3f]/15">
  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#870c3f]/10 rounded-full blur-[120px] -z-10" />

  <div className="max-w-7xl mx-auto relative z-10">
    <div className="text-center mb-12 md:mb-16">
      <span className="text-[#870c3f] font-black uppercase tracking-[0.25em] text-[10px] md:text-xs bg-white px-4 py-2 rounded-full shadow-xs border border-[#870c3f]/20">
        Alhamdulillah
      </span>
      <h2 className="text-3xl md:text-5xl font-serif font-black text-[#870c3f] mt-4 tracking-tight">
        United by <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#870c3f] to-amber-700 italic">Destiny</span>
      </h2>
    </div>

    <div className="relative max-w-5xl mx-auto">
      <div className="flex flex-col lg:flex-row items-center gap-10 md:gap-14">
        
        <div className="w-full lg:w-[45%] relative group">
          <div className="absolute -inset-4 bg-[#870c3f]/15 rounded-[36px] md:rounded-[44px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative aspect-[3/4] md:aspect-[4/5] w-full rounded-[32px] md:rounded-[40px] overflow-hidden shadow-[0_20px_50px_-15px_rgba(135,12,63,0.15)] border-6 border-white bg-white">
            <img 
              key={activeStory}
              src={stories[activeStory].img} 
              className="w-full h-full object-cover transition-all duration-700 animate-grand-entry"
              alt={stories[activeStory].name} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#870c3f]/30 via-transparent to-transparent" />
          </div>

          <div className="absolute -bottom-4 -right-3 md:-right-5 bg-white/95 backdrop-blur-md p-3.5 md:p-5 rounded-[24px] shadow-xl border border-[#870c3f]/20 animate-float">
            <span className="text-2xl md:text-3xl">❤️</span>
          </div>
        </div>

        <div className="w-full lg:w-[55%] text-center lg:text-left space-y-5 md:space-y-6">
          <div className="space-y-3">
            <div className="flex justify-center lg:justify-start items-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-amber-500 text-sm md:text-base animate-pulse">★</span>
              ))}
              <span className="h-[1px] w-8 bg-[#870c3f]/20 ml-3 hidden md:block" />
            </div>
            
            <h3 className="text-2xl md:text-4xl font-serif font-black text-[#870c3f] italic tracking-tight">
              {stories[activeStory].name}
            </h3>
            <p className="text-[#870c3f] font-black text-xs md:text-sm tracking-[0.2em] uppercase">
              Location: {stories[activeStory].location}
            </p>
          </div>

          <div className="relative">
            <span className="absolute -top-8 -left-6 text-[100px] text-[#870c3f]/15 font-serif -z-10 select-none">“</span>
            <p className="text-sm md:text-base text-[#870c3f]/85 leading-relaxed font-semibold italic relative z-10 pr-2">
              {stories[activeStory].text}
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-2">
            <div className="flex gap-3">
              <button 
                onClick={() => setActiveStory(activeStory === 0 ? stories.length - 1 : activeStory - 1)}
                className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-[#870c3f]/30 bg-white flex items-center justify-center hover:bg-[#870c3f] hover:border-[#870c3f] hover:text-white transition-all text-base shadow-xs hover:shadow-md text-[#870c3f]"
              >
                ←
              </button>
              <button 
                onClick={() => setActiveStory(activeStory === stories.length - 1 ? 0 : activeStory + 1)}
                className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-[#870c3f]/30 bg-white flex items-center justify-center hover:bg-[#870c3f] hover:border-[#870c3f] hover:text-white transition-all text-base shadow-xs hover:shadow-md text-[#870c3f]"
              >
                →
              </button>
            </div>

            <div className="flex flex-col items-center md:items-end gap-2">
               <div className="flex gap-2">
                 {stories.map((_, i) => (
                   <div 
                     key={i} 
                     className={`h-1.5 rounded-full transition-all duration-500 ${activeStory === i ? 'w-8 bg-[#870c3f] shadow-[0_0_10px_rgba(135,12,63,0.4)]' : 'w-2 bg-[#870c3f]/25'}`} 
                   />
                 ))}
               </div>
               <p className="text-[#870c3f]/70 font-black text-[9px] md:text-[10px] tracking-widest uppercase">Experience the Magic</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <style jsx>{`
    @keyframes grand-entry {
      0% { opacity: 0; transform: scale(1.08) translateY(15px); filter: blur(8px); }
      100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
    }
    .animate-grand-entry {
      animation: grand-entry 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-12px) rotate(5deg); }
    }
    .animate-float {
      animation: float 5s ease-in-out infinite;
    }
  `}</style>
</section>

{/* SECTION 6: FAQ / Community Trust Section (Pure White Background) */}
<section className="relative py-20 md:py-28 px-6 bg-white overflow-hidden border-b border-[#870c3f]/10">
  <div className="max-w-4xl mx-auto relative z-10 space-y-12">
    <div className="text-center space-y-4">
      <span className="text-[#870c3f] font-black uppercase tracking-[0.3em] text-[10px] md:text-xs bg-[#ffe0e9] px-5 py-2 rounded-full shadow-xs border border-[#870c3f]/20">
        Got Questions?
      </span>
      <h2 className="text-3xl md:text-5xl font-serif font-black text-[#870c3f] tracking-tight">
        Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#870c3f] to-amber-700 italic">Questions</span>
      </h2>
    </div>

    <div className="space-y-4">
      {[
        { q: "How are profiles verified on Pakiza Rishte?", a: "Every single profile goes through a strict manual verification process involving phone confirmation and valid identity proofs to ensure complete family safety." },
        { q: "Is my personal and family contact information secure?", a: "Yes, your data is completely secure. Only approved members with your explicit permission can view your contact details and pictures." },
        { q: "How can I register my son or daughter's profile?", a: "You can easily sign up by entering basic details, uploading verification documents, and setting up partner expectations." }
      ].map((faq, idx) => (
        <div key={idx} className="bg-[#ffe0e9]/30 border border-[#870c3f]/15 p-6 md:p-8 rounded-[24px] space-y-2">
          <h4 className="text-lg md:text-xl font-serif font-black text-[#870c3f]">{faq.q}</h4>
          <p className="text-sm text-[#870c3f]/75 font-medium leading-relaxed">{faq.a}</p>
        </div>
      ))}
    </div>
  </div>
</section>

{/* SECTION 7: FOOTER (Royal Fantasy Maroon Finish with Floating Hearts) */}
<footer className="relative bg-[#1a0208] text-rose-100 py-12 md:py-16 px-6 md:px-[8%] overflow-hidden border-t border-rose-900/40">
  {/* Printed Theme Pattern & Background Overlay */}
  <div className="absolute inset-0 opacity-[0.07] pointer-events-none bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:16px_16px]" />
  
  {/* Floating Hearts Animation Container */}
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {isMounted && [...Array(12)].map((_, i) => (
      <div 
        key={i}
        className="absolute animate-float-heart opacity-[0.15] text-rose-400 blur-[0.2px]"
        style={{
          left: `${(i * 9) % 100}%`, 
          top: `110%`,
          fontSize: `${10 + (i * 2.5)}px`,
          animationDelay: `${i * 1.1}s`,
          animationDuration: `${10 + (i % 5)}s`
        }}
      >
        ❤️
      </div>
    ))}
  </div>

  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-rose-600/15 rounded-full blur-[140px] pointer-events-none" />
  
  <div className="max-w-7xl mx-auto relative z-10">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      
      {/* Brand Column */}
      <div className="lg:col-span-5 space-y-4 text-center lg:text-left">
        <div className="space-y-2">
          <h3 className="text-3xl md:text-4xl font-serif font-black text-white tracking-tight">
            Pakiza <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 italic">Rishte</span>
          </h3>
          <div className="w-16 h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 mx-auto lg:mx-0 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.4)]" />
        </div>
        
        <p className="text-rose-200/80 max-w-sm mx-auto lg:mx-0 font-serif italic text-sm md:text-base leading-relaxed">
          "And We created you in pairs." <br />
          <span className="not-italic font-sans text-[11px] text-rose-300/70 font-black tracking-wide uppercase">Bareilly's Most Trusted Halal Matchmaking Platform</span>
        </p>

        <div className="flex justify-center lg:justify-start gap-3 pt-1">
          {[
            { name: "FB", icon: "🌐", label: "Facebook" },
            { name: "IG", icon: "📸", label: "Instagram" },
            { name: "WA", icon: "💬", label: "WhatsApp" },
            { name: "X", icon: "🅧", label: "Twitter" }
          ].map((soc, idx) => (
            <a 
              key={idx} 
              href="#_" 
              aria-label={soc.label}
              className="group relative w-9 h-9 rounded-xl bg-rose-950/60 border border-rose-800/50 flex items-center justify-center hover:bg-gradient-to-br hover:from-rose-600 hover:to-pink-600 hover:border-rose-400 transition-all duration-300 shadow-md cursor-pointer"
            >
              <span className="text-[11px] group-hover:scale-110 transition-transform duration-300">{soc.icon}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Links Columns */}
      <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 text-left">
        
        <div className="space-y-3">
          <h4 className="font-black uppercase tracking-[0.2em] text-[10px] text-rose-400 flex items-center gap-1.5">
            <span>✨</span> Explore
          </h4>
          <ul className="space-y-2 text-rose-200/70 font-bold text-xs">
            {['About Us', 'Blog', 'Career', 'Contact Us'].map(l => (
              <li key={l} className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-pointer flex items-center gap-1.5">
                <span className="text-rose-500 text-[9px]">‹</span> {l}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-black uppercase tracking-[0.2em] text-[10px] text-rose-400 flex items-center gap-1.5">
            <span>🛡️</span> Trust & Legal
          </h4>
          <ul className="space-y-2 text-rose-200/70 font-bold text-xs">
            {['Child Safety Policy', 'Terms & Conditions', 'Privacy Policy', 'Refund Policy'].map(l => (
              <li key={l} className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-pointer flex items-center gap-1.5">
                <span className="text-rose-500 text-[9px]">‹</span> {l}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 col-span-2 sm:col-span-1">
          <h4 className="font-black uppercase tracking-[0.2em] text-[10px] text-rose-400 flex items-center gap-1.5">
            <span>💌</span> Support
          </h4>
          <ul className="space-y-2 text-rose-200/70 font-bold text-xs mb-3">
            <li className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-pointer flex items-center gap-1.5">
              <span className="text-rose-500 text-[9px]">‹</span> FAQs
            </li>
          </ul>
          
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/40 space-y-1.5 backdrop-blur-md shadow-inner">
            <p className="text-[10px] font-black text-rose-100 flex items-center gap-1.5">
              <span>📍</span> Bareilly, UP, India
            </p>
            <p className="text-[10px] font-black text-rose-100 flex items-center gap-1.5">
              <span>📞</span> Support Line
            </p>
          </div>
        </div>

      </div>
    </div>

    {/* Bottom Bar */}
    <div className="mt-10 pt-6 border-t border-rose-900/30 flex flex-col items-center">
      
      <div className="flex flex-wrap justify-center gap-6 items-center opacity-70 hover:opacity-100 transition-all duration-300 mb-4 text-[10px] font-black tracking-widest text-rose-300">
        <span className="hover:text-white transition-colors">🔒 SECURE SSL</span>
        <span className="hover:text-white transition-colors">💎 100% VERIFIED</span>
        <span className="hover:text-white transition-colors">🌿 HALAL MATCHMAKING</span>
      </div>

      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-950/80 rounded-full border border-rose-700/40 shadow-md">
          <span className="text-rose-400 animate-pulse text-xs">❤️</span>
          <p className="text-[9px] md:text-[10px] text-rose-200 uppercase tracking-[0.2em] font-black">Crafted with pure love for Bareilly families</p>
          <span className="text-rose-400 animate-pulse text-xs">❤️</span>
        </div>
        <p className="text-[9px] md:text-[10px] text-rose-300/50 font-black uppercase tracking-widest pt-1">
          © 2026 PAKIZA RISHTE • A PROUD DIGITAL PROPERTY OF <span className="text-rose-200/90 underline decoration-rose-500/50">IT CREATIVE SOLUTION</span>
        </p>
      </div>
    </div>
  </div>

  <style jsx>{`
    @keyframes float-heart {
      0% { transform: translateY(0) scale(0.8) rotate(0deg); opacity: 0; }
      20% { opacity: 0.15; }
      80% { opacity: 0.15; }
      100% { transform: translateY(-100vh) scale(1.3) rotate(45deg); opacity: 0; }
    }
    .animate-float-heart {
      animation: float-heart linear infinite;
    }
  `}</style>
</footer>



























      {/* --- MODAL: LOGIN --- */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-[380px] bg-[#ffe0e9] p-7 sm:p-8 rounded-[32px] shadow-2xl border-2 border-[#870c3f]/40 my-auto">
            <button 
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#870c3f] text-[#ffe0e9] hover:bg-[#680930] flex items-center justify-center font-bold text-xs transition-all shadow-md" 
              onClick={() => setShowLoginModal(false)}
            >
              ✕
            </button>

            {loginStep === 1 ? (
              <div className="space-y-5 text-center">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-[#870c3f]">Welcome Back</h2>
                  <p className="text-xs text-[#870c3f]/80 mt-1 font-medium">Enter your mobile number to sign in</p>
                </div>
                <div className="space-y-1 text-left">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#870c3f]/60">+91</span>
                    <input 
                      type="tel" 
                      maxLength={10} 
                      value={loginMobile} 
                      onFocus={handleInputFocus}
                      onChange={(e)=>{setLoginMobile(e.target.value.replace(/\D/g,'')); setLoginError('');}}
                      className={`w-full px-4 py-3.5 pl-14 rounded-2xl border outline-none text-sm font-semibold text-[#870c3f] ${loginError ? 'border-red-500 bg-red-50' : 'border-[#870c3f]/30 focus:border-[#870c3f] bg-white'}`} 
                      placeholder="Mobile Number" 
                    />
                  </div>
                  {loginError && <p className="text-red-600 text-[11px] font-bold ml-1">{loginError}</p>}
                </div>
                <button 
                  disabled={loading} 
                  onClick={handleLoginSubmit} 
                  className="w-full py-4 bg-[#870c3f] text-[#ffe0e9] rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg hover:bg-[#680930] transition-all flex items-center justify-center gap-2"
                >
                  {loading && (
                    <svg className="animate-spin h-4 w-4 text-[#ffe0e9]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {loading ? loadingAction : 'Send OTP'}
                </button>
                {loginApiMessage && <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{loginApiMessage}</p>}
              </div>
            ) : (
              <div className="space-y-5 text-center">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-[#870c3f]">Verify OTP</h2>
                  <p className="text-xs text-[#870c3f]/80 mt-1 font-medium">Code sent to <span className="font-bold text-[#870c3f]">+91 {loginMobile}</span></p>
                </div>
                <div className="flex gap-2 justify-center py-2">
                  {loginOtp.map((d, i) => (
                    <input 
                      key={i} 
                      ref={el => {loginOtpRefs.current[i] = el}} 
                      type="text" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1} 
                      value={d}
                      onFocus={handleInputFocus}
                      className="w-10 h-12 text-lg font-black text-center border-2 border-[#870c3f]/30 rounded-xl focus:border-[#870c3f] bg-white outline-none transition-all text-[#870c3f] shadow-inner"
                      onChange={(e) => handleOtpInput(e.target.value, i, 'login')}
                      onKeyDown={(e) => { if (e.key === 'Backspace' && !loginOtp[i] && i > 0) loginOtpRefs.current[i-1]?.focus(); }} 
                    />
                  ))}
                </div>
                <button 
                  disabled={loading} 
                  onClick={handleVerifyLogin} 
                  className="w-full py-4 bg-[#870c3f] text-[#ffe0e9] rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg hover:bg-[#680930] transition-all flex items-center justify-center gap-2"
                >
                  {loading && (
                    <svg className="animate-spin h-4 w-4 text-[#ffe0e9]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {loading ? loadingAction : 'Login Now'}
                </button>
                <div className="pt-1">
                  <p className="text-xs text-[#870c3f]/80 font-medium">Resend code in <span className="font-bold text-[#870c3f]">0:{loginTimer.toString().padStart(2, '0')}</span></p>
                  {loginTimer === 0 && (
                    <button onClick={handleLoginSubmit} className="text-[#870c3f] font-bold text-xs underline mt-2 hover:text-[#680930]">
                      Resend OTP Now
                    </button>
                  )}
                  {loginApiMessage && <p className="text-xs text-red-600 font-bold mt-2">{loginApiMessage}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL: REGISTRATION OTP --- */}
      {showRegOtpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-[380px] bg-[#ffe0e9] p-7 sm:p-8 rounded-[32px] shadow-2xl border-2 border-[#870c3f]/40 my-auto">
            <button 
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#870c3f] text-[#ffe0e9] hover:bg-[#680930] flex items-center justify-center font-bold text-xs transition-all shadow-md" 
              onClick={() => setShowRegOtpModal(false)}
            >
              ✕
            </button>
            <div className="space-y-5 text-center">
              <div>
                <h2 className="text-2xl font-serif font-bold text-[#870c3f]">Verify Registration</h2>
                <p className="text-xs text-[#870c3f]/80 mt-1 font-medium">OTP sent to <span className="font-bold text-[#870c3f]">+91 {mobileNumber}</span></p>
              </div>
              <div className="flex gap-2 justify-center py-2">
                {regOtp.map((d, i) => (
                  <input 
                    key={i} 
                    ref={el => {otpRefs.current[i] = el}} 
                    type="text" 
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1} 
                    value={d}
                    onFocus={handleInputFocus}
                    className="w-10 h-12 text-lg font-black text-center border-2 border-[#870c3f]/30 rounded-xl focus:border-[#870c3f] bg-white outline-none transition-all text-[#870c3f] shadow-inner"
                    onChange={(e) => handleOtpInput(e.target.value, i, 'reg')}
                    onKeyDown={(e) => { if (e.key === 'Backspace' && !regOtp[i] && i > 0) otpRefs.current[i-1]?.focus(); }} 
                  />
                ))}
              </div>
              <button 
                disabled={loading} 
                onClick={handleVerifyRegistration} 
                className="w-full py-4 bg-[#870c3f] text-[#ffe0e9] rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg hover:bg-[#680930] transition-all flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4 text-[#ffe0e9]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? loadingAction : 'Verify & Register'}
              </button>
              <div className="pt-1">
                <p className="text-xs text-[#870c3f]/80 font-medium">Resend code in <span className="font-bold text-[#870c3f]">0:{regTimer.toString().padStart(2, '0')}</span></p>
                {regTimer === 0 && (
                  <button onClick={handleRegistration} className="text-[#870c3f] font-bold text-xs underline mt-2 hover:text-[#680930]">
                    Resend OTP Now
                  </button>
                )}
                {regApiMessage && <p className="text-xs text-red-600 font-bold mt-2">{regApiMessage}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}