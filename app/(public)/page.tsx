"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Lock, Heart, Sparkles, CheckCircle2, 
  ChevronRight, ChevronLeft, ArrowRight, HelpCircle, Star, Users,
  Phone, Flame, UserCheck, ChevronDown, Crown, MessageSquare, Eye, Award
} from 'lucide-react';
import HeroRegisterForm from '@/components/home/HeroRegisterForm';
import { useAuthModal } from '@/context/AuthModalContext';

export default function HomePage() {
  const { openRegisterModal, openLoginModal } = useAuthModal();
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [activeStory, setActiveStory] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [profileType, setProfileType] = useState<'groom' | 'bride'>('bride');

  const stories = [
    {
      name: "Sana & Zaid Siddiqui",
      location: "Bareilly, UP",
      date: "Nikah: Jan 2026",
      img: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200",
      text: "Alhamdulillah, Nikah Qubool se humein wo sab mila jo hum ek partner mein dhoond rahe the. Family-centric approach aur 100% verified profiles ki wajah se humari baat 15 din me final ho gayi!"
    },
    {
      name: "Mehak & Dr. Arif Khan",
      location: "Civil Lines, Bareilly",
      date: "Nikah: Dec 2025",
      img: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200",
      text: "Photo protection aur phone privacy feature bohot hi umda hai. Mujhe exact meri preference aur Maslak ke mutabiq rishta mila. May Allah bless the Nikah Qubool team!"
    },
    {
      name: "Iqra & Er. Sameer Ansari",
      location: "Lucknow, UP",
      date: "Nikah: Nov 2025",
      img: "https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?q=80&w=1200",
      text: "Apne hi shehar me decent aur verified rishta dhoondna bohot mushkil tha pehle. Nikah Qubool ne process ko transparent aur aasan bana diya."
    },
  ];

  const sampleProfiles = {
    bride: [
      { id: 1, name: "Farheen S.", age: 23, height: "5' 3\"", degree: "M.Sc Computer Science", city: "Bareilly", sect: "Sunni Hanafi", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600" },
      { id: 2, name: "Ayesha K.", age: 25, height: "5' 4\"", degree: "B.Tech IT", city: "Lucknow", sect: "Sunni Hanafi", photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600" },
      { id: 3, name: "Zainab F.", age: 22, height: "5' 2\"", degree: "B.A. B.Ed", city: "Moradabad", sect: "Sunni Hanafi", photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600" },
      { id: 4, name: "Mariyam R.", age: 24, height: "5' 5\"", degree: "B.Pharm", city: "Aligarh", sect: "Sunni Hanafi", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600" },
    ],
    groom: [
      { id: 5, name: "Er. Yasar M.", age: 26, height: "5' 10\"", degree: "B.Tech Software Engineer", city: "Bareilly", sect: "Sunni Hanafi", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600" },
      { id: 6, name: "Dr. Danish A.", age: 28, height: "5' 11\"", degree: "M.D. Physician", city: "Lucknow", sect: "Sunni Hanafi", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600" },
      { id: 7, name: "Bilal H.", age: 27, height: "5' 9\"", degree: "MBA Marketing Manager", city: "Noida / UP", sect: "Sunni Hanafi", photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=600" },
      { id: 8, name: "Shahbaz K.", age: 29, height: "6' 0\"", degree: "Chartered Accountant", city: "Delhi NCR", sect: "Sunni Hanafi", photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=600" },
    ]
  };

  const banners = [
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=100&w=2400",
    "https://images.unsplash.com/photo-1519741497674-611481863552?q=100&w=2400",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=100&w=2400"
  ];

  const faqs = [
    { 
      q: "How are profiles verified on Nikah Qubool?", 
      a: "Every single profile undergoes mandatory phone OTP verification and strict manual screening by our team. Family backgrounds and documents are cross-verified to maintain 100% genuine proposals." 
    },
    { 
      q: "Is photo privacy and contact number protection available?", 
      a: "Yes! Nikah Qubool offers complete privacy controls. You can set your photos to 'Only Approved Members' or 'Blurred', and your phone number remains masked until you explicitly grant access." 
    },
    { 
      q: "Can parents or family members create a profile?", 
      a: "Absolutely! Over 70% of profiles on Nikah Qubool are managed directly by parents, brothers, or sisters. You can select 'Creating for Son/Daughter/Sibling' during registration." 
    },
    { 
      q: "Is basic registration free on Nikah Qubool?", 
      a: "Yes, creating a profile, searching compatible proposals, and expressing interests are 100% Free! Optional VIP plans unlock direct contact numbers and instant messaging." 
    }
  ];

  useEffect(() => {
    const int = setInterval(() => setCurrentSlide(p => (p === 2 ? 0 : p + 1)), 7000);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#d91b5c] selection:text-white">
      
      {/* 🌟 HERO SECTION */}
      <section className="relative min-h-[95vh] flex items-center justify-center pt-24 pb-16 overflow-hidden bg-slate-950">
        
        {/* BACKGROUND SLIDESHOW WITH LUXURY BLUR */}
        <div className="absolute inset-0 z-0">
          {banners.map((img, idx) => (
            <div 
              key={idx} 
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 transform scale-105"
              style={{ 
                backgroundImage: `url('${img}')`, 
                opacity: currentSlide === idx ? 0.35 : 0,
                filter: 'brightness(0.65)'
              }}
            />
          ))}
          <div className="absolute top-1/4 left-10 w-[500px] h-[500px] bg-[#d91b5c]/30 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/40" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col lg:grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* HERO CONTENT LEFT */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full lg:col-span-7 text-center lg:text-left space-y-6 order-2 lg:order-1"
          >
            {/* VIP BADGE */}
            <div className="inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-xs font-bold uppercase tracking-widest shadow-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              #1 Trusted Muslim Matrimony Platform
            </div>

            {/* MAIN HEADLINE */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black text-white leading-[1.1] tracking-tight">
              Find Your Blessed <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-amber-400 italic font-normal">
                Halal Life Partner.
              </span>
            </h1>

            <p className="text-slate-200 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl">
              Connect with thousands of verified Muslim brides and grooms. Complete privacy control, family-centric matchmaking, and Sunnah-guided Nikah process.
            </p>

            {/* TRUST BADGES ROW */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs font-black text-slate-200 uppercase tracking-wider">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>100% Verified Profiles</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <ShieldCheck size={16} className="text-amber-400" />
                <span>Halal & Secure</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <Lock size={16} className="text-rose-400" />
                <span>Privacy Control</span>
              </div>
            </div>

            {/* STATS HIGHLIGHT */}
            <div className="grid grid-cols-3 gap-3 pt-4 max-w-lg mx-auto lg:mx-0">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-2xl text-center">
                <p className="text-xl sm:text-2xl font-serif font-black text-amber-300">10,000+</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Active Profiles</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-2xl text-center">
                <p className="text-xl sm:text-2xl font-serif font-black text-rose-300">2,500+</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Blessed Nikahs</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-2xl text-center">
                <p className="text-xl sm:text-2xl font-serif font-black text-emerald-300">100%</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Privacy Safe</p>
              </div>
            </div>
          </motion.div>

          {/* HERO REGISTER FORM RIGHT */}
          <div className="w-full lg:col-span-5 flex justify-center order-1 lg:order-2">
            <HeroRegisterForm />
          </div>

        </div>
      </section>

      {/* 🚀 TRUST TICKER BAR */}
      <div className="relative py-4 bg-gradient-to-r from-[#d91b5c] via-[#a3124e] to-[#d91b5c] text-white overflow-hidden shadow-lg border-y border-rose-900">
        <div className="relative flex overflow-hidden">
          <div className="flex whitespace-nowrap animate-[scrollText_28s_linear_infinite] hover:[animation-play-state:paused] cursor-pointer">
            {[1, 2].map((group) => (
              <div key={group} className="flex items-center">
                {[
                  { t: "100% Verified Profiles", i: "✅" },
                  { t: "Secure & Halal Nikah Platform", i: "🕌" },
                  { t: "Photo & Phone Privacy Control", i: "🔒" },
                  { t: "Trusted Family Matchmaking", i: "🤝" },
                  { t: "Bareilly & UP Top Matrimony", i: "⭐" },
                  { t: "Strict Manual Screening", i: "🛡️" }
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className="relative flex items-center mx-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-xs hover:bg-white/20 transition-all duration-300"
                  >
                    <span className="text-sm mr-2">{item.i}</span>
                    <span className="text-[11px] font-black tracking-wider uppercase text-white">{item.t}</span>
                    <div className="ml-3 text-amber-300 text-xs">✦</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          @keyframes scrollText {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>

      {/* 💖 FEATURED PROFILES PREVIEW SECTION */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[#d91b5c] font-black uppercase tracking-[0.25em] text-xs bg-rose-50 px-5 py-2 rounded-full border border-rose-200 shadow-xs">
              Verified Proposals
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-black text-slate-900 tracking-tight">
              Explore Compatible <span className="text-[#d91b5c] italic font-normal">Proposals</span>
            </h2>
            <p className="text-slate-600 text-sm font-medium">
              Browse genuine verified profiles looking for honorable Nikah connections.
            </p>

            {/* GROOM / BRIDE FILTER TOGGLE */}
            <div className="inline-flex p-1 bg-white rounded-full border-2 border-rose-100 shadow-md">
              <button 
                onClick={() => setProfileType('bride')}
                className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  profileType === 'bride' 
                    ? 'bg-[#d91b5c] text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👰 Muslim Brides
              </button>
              <button 
                onClick={() => setProfileType('groom')}
                className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  profileType === 'groom' 
                    ? 'bg-[#d91b5c] text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🤵 Muslim Grooms
              </button>
            </div>
          </div>

          {/* PROFILES GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sampleProfiles[profileType].map((p) => (
              <motion.div 
                key={p.id}
                whileHover={{ y: -6 }}
                className="bg-white rounded-3xl border-2 border-rose-100/80 shadow-lg overflow-hidden group hover:border-rose-300 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-64 w-full overflow-hidden bg-slate-900">
                    <img 
                      src={p.photo} 
                      alt={p.name} 
                      className="w-full h-full object-cover object-top filter blur-xs group-hover:blur-0 transition-all duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    
                    <span className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                      <CheckCircle2 size={12} /> Verified
                    </span>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-serif font-extrabold text-lg uppercase tracking-tight">{p.name}</h3>
                      <p className="text-xs font-bold text-amber-300">{p.age} yrs | {p.height}</p>
                    </div>
                  </div>

                  <div className="p-5 space-y-2 text-xs font-semibold text-slate-600">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Education</span>
                      <span className="font-extrabold text-slate-800">{p.degree}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">City</span>
                      <span className="font-extrabold text-slate-800">{p.city}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Sect</span>
                      <span className="font-extrabold text-[#d91b5c]">{p.sect}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-rose-100">
                  <button 
                    onClick={openRegisterModal}
                    className="w-full py-2.5 rounded-2xl bg-[#d91b5c] hover:bg-[#6e0932] text-white text-xs font-black uppercase tracking-wider shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Connect Now</span>
                    <ArrowRight size={14} className="text-amber-300" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center pt-4">
            <button 
              onClick={openRegisterModal}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-rose-900/20 cursor-pointer border border-rose-300/30 inline-flex items-center gap-2"
            >
              <Sparkles size={16} className="text-amber-300" />
              <span>Register Free to View All 10,000+ Profiles</span>
            </button>
          </div>
        </div>
      </section>

      {/* 🛡️ WHY CHOOSE Nikah Qubool */}
      <section className="relative py-20 md:py-28 px-6 bg-white overflow-hidden border-b border-slate-200">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-[#d91b5c] font-black uppercase tracking-[0.25em] text-xs bg-rose-50 px-5 py-2 rounded-full border border-rose-200 shadow-xs">
              Excellence in Matchmaking
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-black text-slate-900 tracking-tight">
              Why Choose <span className="text-[#d91b5c] italic font-normal">Nikah Qubool?</span>
            </h2>
            <p className="text-slate-600 text-sm md:text-base font-medium">
              Designed exclusively keeping Islamic values, absolute privacy, and verified families in mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: "100% Halal & Secure", 
                desc: "Every single profile undergoes rigorous manual 3-step screening to ensure zero fake accounts and complete peace of mind for Nikah.", 
                badge: "100% VERIFIED", 
                icon: "🛡️" 
              },
              { 
                title: "Privacy First Control", 
                desc: "Advanced privacy controls put you in charge. Choose exactly who views your family details, pictures, and contact numbers.", 
                badge: "COMPLETE PRIVACY", 
                icon: "🔒" 
              },
              { 
                title: "Family Involvement", 
                desc: "Built for serious families looking for honorable Sunnah Nikah. No casual dating or swiping, only dignified proposals.", 
                badge: "FAMILY FIRST", 
                icon: "🤝" 
              }
            ].map((item, index) => (
              <motion.div 
                key={index} 
                whileHover={{ y: -8 }}
                className="group relative bg-slate-50 p-8 rounded-3xl border-2 border-slate-200/80 shadow-sm hover:shadow-2xl hover:border-rose-300 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-200 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-black tracking-widest text-[#d91b5c] bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-slate-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
                <div className="pt-6 mt-6 border-t border-slate-200/80 flex items-center justify-between text-[#d91b5c] font-bold text-xs tracking-wider uppercase">
                  <span>Explore More</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 🚀 HOW IT WORKS STEP BY STEP */}
      <section className="relative py-20 md:py-28 px-6 bg-slate-100 overflow-hidden border-b border-slate-200">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-[#d91b5c] font-black uppercase tracking-[0.25em] text-xs bg-white px-5 py-2 rounded-full border border-slate-200 shadow-xs">
              Simple Process
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-black text-slate-900 tracking-tight">
              How Nikah Qubool <span className="text-[#d91b5c] italic font-normal">Works</span>
            </h2>
            <p className="text-slate-600 text-sm md:text-base font-medium">
              Finding your ideal life partner is now structured, safe, and transparent in just 3 easy steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create Free Profile", desc: "Register securely with your family background, education, and partner preferences." },
              { step: "02", title: "Discover & Express Interest", desc: "Browse verified profiles and send interest requests directly to compatible candidates." },
              { step: "03", title: "Connect & Perform Nikah", desc: "Interact safely through instant chat, involve families, and take the blessed step forward." }
            ].map((box, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-3xl border-2 border-slate-200 shadow-sm space-y-4 relative overflow-hidden group hover:border-rose-300 transition-all duration-300"
              >
                <span className="text-6xl font-serif font-black text-slate-200/80 absolute top-4 right-6 group-hover:text-rose-200 transition-colors">{box.step}</span>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#d91b5c] font-black text-lg shadow-xs">
                  {box.step}
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-900">{box.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{box.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 💖 TESTIMONIALS & SUCCESS STORIES */}
      <section className="relative py-20 md:py-28 px-6 bg-white overflow-hidden border-b border-slate-200">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 space-y-3">
            <span className="text-[#d91b5c] font-black uppercase tracking-[0.25em] text-xs bg-rose-50 px-4 py-2 rounded-full border border-rose-200 shadow-xs">
              Alhamdulillah
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-black text-slate-900 tracking-tight">
              United by <span className="text-[#d91b5c] italic font-normal">Destiny</span>
            </h2>
          </div>

          <div className="relative max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-10 md:gap-14">
              <div className="w-full lg:w-[45%]">
                <div className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900">
                  <img 
                    key={activeStory}
                    src={stories[activeStory].img} 
                    className="w-full h-full object-cover transition-all duration-700"
                    alt={stories[activeStory].name} 
                  />
                </div>
              </div>

              <div className="w-full lg:w-[55%] text-center lg:text-left space-y-6">
                <div>
                  <h3 className="text-3xl font-serif font-bold text-slate-900 italic">
                    {stories[activeStory].name}
                  </h3>
                  <p className="text-[#d91b5c] font-black text-xs tracking-widest uppercase mt-1">
                    Location: {stories[activeStory].location} • {stories[activeStory].date}
                  </p>
                </div>

                <p className="text-base text-slate-700 leading-relaxed font-medium italic bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
                  "{stories[activeStory].text}"
                </p>

                <div className="flex items-center justify-center lg:justify-start gap-3 pt-2">
                  <button 
                    onClick={() => setActiveStory(activeStory === 0 ? stories.length - 1 : activeStory - 1)}
                    className="w-12 h-12 rounded-full border border-slate-300 bg-white flex items-center justify-center hover:bg-[#d91b5c] hover:text-white transition-all text-slate-800 cursor-pointer shadow-md"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={() => setActiveStory(activeStory === stories.length - 1 ? 0 : activeStory + 1)}
                    className="w-12 h-12 rounded-full border border-slate-300 bg-white flex items-center justify-center hover:bg-[#d91b5c] hover:text-white transition-all text-slate-800 cursor-pointer shadow-md"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ❓ FREQUENTLY ASKED QUESTIONS */}
      <section className="relative py-20 md:py-28 px-6 bg-slate-50 overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <span className="text-[#d91b5c] font-black uppercase tracking-[0.25em] text-xs bg-white px-5 py-2 rounded-full border border-slate-200 shadow-xs">
              Got Questions?
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-black text-slate-900 tracking-tight">
              Frequently Asked <span className="text-[#d91b5c] italic font-normal">Questions</span>
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx} 
                  className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-xs transition-all"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <h4 className="text-base sm:text-lg font-serif font-bold text-slate-900">{faq.q}</h4>
                    <ChevronDown size={20} className={`text-[#d91b5c] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="px-6 pb-6 text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100 pt-3"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 🌟 VIP FOOTER CTA BANNER */}
      <section className="py-16 px-6 bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] text-white text-center relative overflow-hidden shadow-2xl">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <Crown size={42} className="text-amber-300 mx-auto animate-bounce" />
          <h2 className="text-3xl sm:text-5xl font-serif font-black tracking-tight">
            Your Soulmate is Waiting.
          </h2>
          <p className="text-rose-100 text-sm sm:text-base font-semibold max-w-xl mx-auto">
            Take the first step towards a blessed life partnership today. Registration takes less than 2 minutes!
          </p>
          <div className="pt-2">
            <button
              onClick={openRegisterModal}
              className="px-10 py-4 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-widest shadow-2xl shadow-amber-500/30 active:scale-95 transition-all cursor-pointer border-2 border-amber-300 inline-flex items-center gap-2"
            >
              <span>Begin Free Registration Now</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
