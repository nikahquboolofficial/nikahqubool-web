"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Lock, Heart, Sparkles, CheckCircle2, 
  ChevronRight, ChevronLeft, ArrowRight, HelpCircle, Star, Users,
  Phone, Smartphone, Check, UserCheck, Search, MessageCircle, 
  Award, Building2, MapPin, GraduationCap, Briefcase
} from 'lucide-react';
import BrowseProfilesSection from '@/components/home/BrowseProfilesSection';
import { ProfileStatusIcons } from '@/components/common/ProfileBadges';

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [profileType, setProfileType] = useState<'bride' | 'groom'>('bride');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // 🕌 High-Quality Halal Muslim Couple Banners
  const slides = [
    { img: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1600" },
    { img: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1600" },
    { img: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600" }
  ];

  // Auto-advance banner every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Sample verified proposals preview
  const sampleProfiles = {
    bride: [
      {
        id: 1,
        name: "Ayesha S.",
        age: 24,
        height: "5'4\"",
        city: "Bareilly, UP",
        sect: "Sunni Hanafi",
        education: "M.Sc Mathematics",
        profession: "Lecturer",
        photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600"
      },
      {
        id: 2,
        name: "Dr. Farhana K.",
        age: 26,
        height: "5'5\"",
        city: "Lucknow, UP",
        sect: "Syed Sunni",
        education: "MBBS, MD",
        profession: "Resident Doctor",
        photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600"
      },
      {
        id: 3,
        name: "Zainab F.",
        age: 23,
        height: "5'3\"",
        city: "Delhi NCR",
        sect: "Sunni",
        education: "B.Tech Computer Science",
        profession: "Software Engineer",
        photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600"
      },
      {
        id: 4,
        name: "Mariam Q.",
        age: 25,
        height: "5'6\"",
        city: "Hyderabad, TS",
        sect: "Sunni Hanafi",
        education: "MBA Finance",
        profession: "Financial Analyst",
        photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600"
      }
    ],
    groom: [
      {
        id: 5,
        name: "Er. Zaid Siddiqui",
        age: 28,
        height: "5'11\"",
        city: "Delhi NCR",
        sect: "Sunni Siddiqui",
        education: "B.Tech IIT Delhi",
        profession: "Senior Tech Lead",
        photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600"
      },
      {
        id: 6,
        name: "Dr. Hamza Khan",
        age: 29,
        height: "6'0\"",
        city: "Bareilly, UP",
        sect: "Sunni Pathan",
        education: "MS General Surgery",
        profession: "Surgeon",
        photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600"
      },
      {
        id: 7,
        name: "Tariq Mansoori",
        age: 27,
        height: "5'10\"",
        city: "Mumbai, MH",
        sect: "Sunni",
        education: "Chartered Accountant (CA)",
        profession: "Senior Auditor",
        photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=600"
      },
      {
        id: 8,
        name: "Rehan Alvi",
        age: 28,
        height: "5'9\"",
        city: "Lucknow, UP",
        sect: "Sunni Alvi",
        education: "MBA Marketing",
        profession: "Product Manager",
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600"
      }
    ]
  };

  const stories = [
    {
      couple: "Sana & Zaid Siddiqui",
      location: "Bareilly & Delhi",
      date: "Blessed Nikah: January 2026",
      text: "Alhamdulillah, Nikah Qubool made our matchmaking so dignified. The 100% verified identity check and respect for family values gave our parents complete confidence.",
      img: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=600"
    },
    {
      couple: "Dr. Farheen & Dr. Arif Khan",
      location: "Lucknow & Aligarh",
      date: "Blessed Nikah: November 2025",
      text: "Finding someone who shares the same Islamic mindset and professional background seemed tough until we connected on Nikah Qubool. Truly a blessed platform.",
      img: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=600"
    },
    {
      couple: "Nida & Er. Salman Ansari",
      location: "Mumbai & Pune",
      date: "Blessed Nikah: February 2026",
      text: "The photo privacy feature is what convinced me to register. Only serious, verified proposals could connect, and within 3 weeks our families met and finalized everything.",
      img: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600"
    }
  ];

  const faqs = [
    {
      q: "How does Nikah Qubool ensure genuine, verified profiles?",
      a: "Every member verifies their mobile number through an authentic 6-digit OTP during registration. Furthermore, our dedicated moderation team manually screens each profile, photos, and family details before granting full access."
    },
    {
      q: "Is my photo and contact information private?",
      a: "Yes, 100%. We take Islamic modesty and privacy very seriously. You have complete control to set photo visibility to 'Visible to all', 'Visible on request only', or 'Blurred preview'. Your phone number is never shared without your mutual consent."
    },
    {
      q: "Can parents or guardians register on behalf of their children?",
      a: "Absolutely. A significant percentage of profiles on Nikah Qubool are managed by parents, elder siblings, or guardians looking for honorable proposals for their son, daughter, brother, or sister."
    },
    {
      q: "How can I start interacting with a compatible proposal?",
      a: "Simply create your profile in 1 minute. Once registered, you can browse compatible matches, send interest requests, and initiate dignified conversations through our secure real-time chat."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-[#d91b5c] selection:text-white">
      
      {/* ================================================================
          1. LUXURY MUSLIM MATRIMONY HERO BANNER (ORIGINAL DESIGN)
          ================================================================ */}
      <section className="relative w-full bg-[#15191e] overflow-hidden">
        
        {/* DESKTOP BANNER CONTAINER (HIDDEN ON MOBILE) */}
        <div className="hidden md:block relative w-full h-[560px] lg:h-[620px] xl:h-[660px] overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover"
            style={{ 
              backgroundImage: "url('/desktop-hero-banner.jpg')",
              backgroundPosition: 'right 15%'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#12161b] via-[#12161b]/70 via-40% to-transparent pointer-events-none" />

          {/* Left-Aligned Headline, Tagline & Action Badges (Natural Wide Headline in 2 Lines) */}
          <div className="relative z-10 h-full w-full max-w-2xl lg:max-w-3xl px-6 sm:px-10 lg:px-[6%] xl:px-[8%] flex flex-col justify-center items-start text-left text-white space-y-5 pb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 backdrop-blur-md border border-amber-400/25 text-xs font-bold text-amber-300 uppercase tracking-wider shadow-sm">
              <Sparkles size={13} className="text-amber-300 shrink-0" />
              <span>Dedicated to Pure Sunnah Matchmaking</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[42px] xl:text-5xl font-serif font-black tracking-tight leading-[1.2] text-white drop-shadow-md">
              Find Your Pious Life Partner<br />With Trust &amp; Dignity
            </h1>

            <p className="text-sm lg:text-base text-slate-200 font-medium leading-relaxed drop-shadow max-w-xl">
              India&apos;s verified matrimonial platform for practicing Muslim families. 100% verified identities with strict photo privacy and direct family interaction.
            </p>

            {/* CTA + App Store Download Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d91b5c] to-rose-600 hover:from-[#c2144f] hover:to-rose-700 text-white font-bold text-sm shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <span>Register Free</span>
                <ArrowRight size={15} />
              </Link>

              {/* Google Play */}
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/80 hover:bg-black border border-white/25 text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-lg group"
                title="Download on Google Play"
              >
                <svg className="w-4 h-4 text-amber-400 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a2.21 2.21 0 0 1-.61-.954V2.768c.14-.37.36-.697.61-.954zm11.306 11.309l2.428-2.428-2.428-2.428L12.59 10.59l2.325 2.533zM4.717.703l11.492 6.55-2.025 2.025L4.717.703zm11.492 16.044L4.717 23.297l9.467-8.575 2.025 2.025z"/>
                </svg>
                <div className="text-left leading-tight">
                  <span className="block text-[7px] uppercase tracking-wider text-slate-300 font-medium">Get it on</span>
                  <span className="block text-xs font-bold text-white">Google Play</span>
                </div>
              </Link>

              {/* Apple App Store */}
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/80 hover:bg-black border border-white/25 text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-lg group"
                title="Download on Apple App Store"
              >
                <svg className="w-4 h-4 text-white fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.64-.78 1.08-1.86.96-2.95-1 .04-2.16.67-2.83 1.45-.59.68-1.11 1.77-.97 2.83 1.11.09 2.2-.55 2.84-1.33z"/>
                </svg>
                <div className="text-left leading-tight">
                  <span className="block text-[7px] uppercase tracking-wider text-slate-300 font-medium">Download on</span>
                  <span className="block text-xs font-bold text-white">App Store</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* MOBILE BANNER CONTAINER (CLEAN ARTWORK WITHOUT TEXT OVER FACES - EXTENDED PROPORTIONAL HEIGHT) */}
        <div className="block md:hidden relative w-full h-[450px] sm:h-[500px] overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover"
            style={{ 
              backgroundImage: "url('/mobile-hero-banner.jpg')",
              backgroundPosition: 'center top'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#15191e] via-transparent to-black/20 pointer-events-none" />
        </div>

      </section>

      {/* ================================================================
          2. FLOATING OVERLAPPING "OUR MATRIMONIAL PILLARS" CARD
          ================================================================ */}
      <section className="relative z-20 px-3 sm:px-6 lg:px-[6%] -mt-6 sm:-mt-8 md:-mt-10">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl border border-rose-100/80 p-5 sm:p-7 md:p-8 text-center space-y-5">
          
          <div className="space-y-1">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#d91b5c]">
              The Nikah Qubool Promise
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Three sacred pillars that make our matchmaking safe, respectful, and blessed
            </p>
          </div>

          {/* 3 DISTINCTIVE PILLARS (NOT NIKAHFOREVER COPIED COUNTERS) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-6 pt-1">
            
            {/* Pillar 1 */}
            <div className="flex sm:flex-col items-center gap-3 sm:gap-2.5 p-3.5 sm:p-4 rounded-2xl bg-rose-50/50 sm:bg-transparent border border-rose-100 sm:border-0 text-left sm:text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-100 to-rose-50 text-[#d91b5c] flex items-center justify-center shadow-xs border border-rose-200/60 shrink-0">
                <Heart size={22} className="stroke-[2.2] fill-[#d91b5c]/20" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-black text-slate-900 tracking-tight">100% Sunnah Aligned</p>
                <p className="text-[11px] font-medium text-slate-500 leading-tight pt-0.5">Parent &amp; Wali guided dignified rishtey</p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="flex sm:flex-col items-center gap-3 sm:gap-2.5 p-3.5 sm:p-4 rounded-2xl bg-rose-50/50 sm:bg-transparent border border-rose-100 sm:border-0 text-left sm:text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-100 to-rose-50 text-[#d91b5c] flex items-center justify-center shadow-xs border border-rose-200/60 shrink-0">
                <Lock size={22} className="stroke-[2.2]" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-black text-slate-900 tracking-tight">Strict Photo Privacy</p>
                <p className="text-[11px] font-medium text-slate-500 leading-tight pt-0.5">Visible only to profiles you approve</p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="flex sm:flex-col items-center gap-3 sm:gap-2.5 p-3.5 sm:p-4 rounded-2xl bg-rose-50/50 sm:bg-transparent border border-rose-100 sm:border-0 text-left sm:text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-100 to-rose-50 text-[#d91b5c] flex items-center justify-center shadow-xs border border-rose-200/60 shrink-0">
                <ShieldCheck size={22} className="stroke-[2.2]" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-black text-slate-900 tracking-tight">Manual Verification</p>
                <p className="text-[11px] font-medium text-slate-500 leading-tight pt-0.5">Zero fake accounts, verified contacts</p>
              </div>
            </div>

          </div>

          {/* Mobile Quick Action Strip */}
          <div className="block sm:hidden pt-2 border-t border-rose-100">
            <Link
              href="/login"
              className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#d91b5c] to-rose-600 text-white shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <div className="text-left">
                <span className="block text-[10px] font-medium text-rose-100">Begin your blessed journey</span>
                <span className="block text-xs font-black">Register Free on Nikah Qubool</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white text-[#d91b5c] text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <span>Start</span>
                <ArrowRight size={12} />
              </div>
            </Link>
          </div>

        </div>
      </section>

      {/* ================================================================
          3. FEATURED PROPOSALS PREVIEW (CLEAN CARDS)
          ================================================================ */}
      <section className="px-3 sm:px-6 lg:px-[6%] py-12 sm:py-16 bg-[#faf7f5] border-y border-rose-100/60">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#d91b5c] bg-white px-3.5 py-1 rounded-full border border-rose-200 shadow-xs inline-block">
              Verified Profiles
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
              Explore Suitable Proposals
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Browse genuine, verified candidates seeking pure Sunnah matrimony.
            </p>

            {/* Groom / Bride Toggle */}
            <div className="pt-2 flex justify-center">
              <div className="inline-flex p-1 bg-white rounded-full border border-rose-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => setProfileType('bride')}
                  className={"px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer " + (profileType === 'bride' ? "bg-[#d91b5c] text-white shadow-xs" : "text-slate-600 hover:text-slate-900")}
                >
                  Muslim Brides
                </button>
                <button
                  type="button"
                  onClick={() => setProfileType('groom')}
                  className={"px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer " + (profileType === 'groom' ? "bg-[#d91b5c] text-white shadow-xs" : "text-slate-600 hover:text-slate-900")}
                >
                  Muslim Grooms
                </button>
              </div>
            </div>
          </div>

          {/* Profiles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {sampleProfiles[profileType].map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-rose-300 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Photo with privacy watermark preview */}
                  <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                    <img
                      src={p.photo}
                      alt={p.name}
                      className="w-full h-full object-cover object-top filter blur-[1px] hover:blur-0 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                    
                    <div className="absolute bottom-2.5 left-3 right-3 text-white">
                      <div className="flex items-center gap-1.5 drop-shadow-md">
                        <p className="text-sm font-bold">{p.name}</p>
                        <ProfileStatusIcons isVerified={true} isPremium={p.id % 2 === 1} size={16} />
                      </div>
                      <p className="text-[11px] text-slate-200">{p.age} yrs • {p.height}</p>
                    </div>
                  </div>

                  {/* Profile Key Details */}
                  <div className="p-3.5 space-y-1.5 text-xs text-slate-600 text-left">
                    <p className="flex items-center gap-1.5 truncate">
                      <MapPin size={13} className="text-[#d91b5c] shrink-0" />
                      <span>{p.city}</span>
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <Building2 size={13} className="text-[#d91b5c] shrink-0" />
                      <span>{p.sect}</span>
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <GraduationCap size={13} className="text-[#d91b5c] shrink-0" />
                      <span>{p.education}</span>
                    </p>
                    <p className="flex items-center gap-1.5 truncate font-semibold text-slate-800">
                      <Briefcase size={13} className="text-[#d91b5c] shrink-0" />
                      <span>{p.profession}</span>
                    </p>
                  </div>
                </div>

                {/* Connect CTA */}
                <div className="p-3 bg-slate-50 border-t border-slate-100">
                  <Link
                    href="/login"
                    className="w-full py-2 rounded-xl bg-[#d91b5c] hover:bg-[#c21450] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                  >
                    <span>Connect Now</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white border border-rose-200 text-[#d91b5c] hover:bg-rose-50 text-xs font-bold tracking-wider shadow-xs transition-all cursor-pointer"
            >
              <Search size={14} />
              <span>Browse All 10,000+ Verified Proposals</span>
            </Link>
          </div>

        </div>
      </section>

      {/* ================================================================
          4. WHY CHOOSE NIKAH QUBOOL (CLEAN VALUE CARDS)
          ================================================================ */}
      <section className="px-3 sm:px-6 lg:px-[6%] py-12 sm:py-18 bg-white">
        <div className="max-w-6xl mx-auto space-y-10">
          
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#d91b5c] bg-rose-50 px-3.5 py-1 rounded-full border border-rose-200 shadow-xs inline-block">
              Why Nikah Qubool
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
              Designed For Honor, Privacy & Faith
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              We prioritize Sunnah values and user security above everything else.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-rose-200 hover:shadow-md transition-all space-y-3 text-left">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#d91b5c]">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-serif font-bold text-slate-900">
                100% Manual Screening
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Every profile is thoroughly reviewed to eliminate non-serious users. We verify identities via phone OTP and documentation.
              </p>
            </div>

            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-rose-200 hover:shadow-md transition-all space-y-3 text-left">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#d91b5c]">
                <Lock size={24} />
              </div>
              <h3 className="text-lg font-serif font-bold text-slate-900">
                Photo & Contact Privacy
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Control exactly who views your photos and personal contacts. Only members you mutually accept can see your full details.
              </p>
            </div>

            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-rose-200 hover:shadow-md transition-all space-y-3 text-left">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#d91b5c]">
                <Heart size={24} />
              </div>
              <h3 className="text-lg font-serif font-bold text-slate-900">
                Pure Halal Matchmaking
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                No casual dating or meaningless swiping. Nikah Qubool is built exclusively for serious Muslim singles and respectable families.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ================================================================
          5. HOW IT WORKS (3 SIMPLE STEPS)
          ================================================================ */}
      <section className="px-3 sm:px-6 lg:px-[6%] py-12 sm:py-16 bg-[#faf7f5] border-y border-rose-100/60">
        <div className="max-w-6xl mx-auto space-y-10">
          
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#d91b5c] bg-white px-3.5 py-1 rounded-full border border-rose-200 shadow-xs inline-block">
              Easy Journey
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
              How Nikah Qubool Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Find your ideal life partner in three simple, respectful steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs text-left space-y-3 relative overflow-hidden">
              <span className="text-3xl font-serif font-black text-rose-200 absolute top-4 right-4">
                01
              </span>
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-[#d91b5c] font-black text-sm">
                1
              </div>
              <h3 className="text-base font-serif font-bold text-slate-900">
                Create Free Profile
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Enter your mobile number, verify via OTP, and fill basic family and lifestyle details in under 2 minutes.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs text-left space-y-3 relative overflow-hidden">
              <span className="text-3xl font-serif font-black text-rose-200 absolute top-4 right-4">
                02
              </span>
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-[#d91b5c] font-black text-sm">
                2
              </div>
              <h3 className="text-base font-serif font-bold text-slate-900">
                Set Preferences & Search
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Filter proposals by age, location, education, sect (Hanafi, Shafi, Syed, etc.), and professional background.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs text-left space-y-3 relative overflow-hidden">
              <span className="text-3xl font-serif font-black text-rose-200 absolute top-4 right-4">
                03
              </span>
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-[#d91b5c] font-black text-sm">
                3
              </div>
              <h3 className="text-base font-serif font-bold text-slate-900">
                Connect & Involve Family
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Express interest, chat securely, and share contact details when both families are ready to take discussions forward.
              </p>
            </div>

          </div>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[#d91b5c] hover:bg-[#c21450] text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>Begin Your Search Today</span>
              <ArrowRight size={14} />
            </Link>
          </div>

        </div>
      </section>

      {/* ================================================================
          6. BLESSED STORIES / TESTIMONIALS
          ================================================================ */}
      <section className="px-3 sm:px-6 lg:px-[6%] py-12 sm:py-18 bg-white">
        <div className="max-w-6xl mx-auto space-y-10">
          
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#d91b5c] bg-rose-50 px-3.5 py-1 rounded-full border border-rose-200 shadow-xs inline-block">
              Blessed Beginnings
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
              Real Stories of Halal Nikahs
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Read how couples completed their deen through Nikah Qubool.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stories.map((s, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-left flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={s.img}
                      alt={s.couple}
                      className="w-12 h-12 rounded-full object-cover border-2 border-rose-200"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{s.couple}</p>
                      <p className="text-[11px] text-slate-500">{s.location}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{s.text}"
                  </p>
                </div>
                <p className="text-[10px] font-bold text-[#d91b5c] uppercase tracking-wider pt-2 border-t border-slate-100">
                  {s.date}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ================================================================
          7. FREQUENTLY ASKED QUESTIONS (ACCORDION)
          ================================================================ */}
      <section className="px-3 sm:px-6 lg:px-[6%] py-12 sm:py-16 bg-[#faf7f5] border-t border-rose-100/60">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#d91b5c] bg-white px-3.5 py-1 rounded-full border border-rose-200 shadow-xs inline-block">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Everything you need to know about our halal matrimonial platform.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((f, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 hover:text-[#d91b5c] transition-colors cursor-pointer"
                >
                  <span>{f.q}</span>
                  <ChevronRight
                    size={16}
                    className={"text-slate-400 transition-transform duration-200 shrink-0 ml-2 " + (activeFaq === idx ? "rotate-90 text-[#d91b5c]" : "")}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-50">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ================================================================
          8. CALL TO ACTION BANNER (CLEAN & WARM)
          ================================================================ */}
      <section className="px-3 sm:px-6 lg:px-[6%] py-12 sm:py-16 bg-white">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-r from-[#d91b5c] via-[#ce1755] to-[#b8124b] text-white p-8 sm:p-12 text-center space-y-4 shadow-xl">
          <span className="inline-block p-2 rounded-full bg-white/15 text-amber-300">
            <Heart size={24} />
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-black tracking-tight">
            Your Soulmate is Waiting.
          </h2>
          <p className="text-xs sm:text-sm text-rose-100 max-w-lg mx-auto font-medium">
            Take the first step towards completing half your deen today. Free registration takes less than 2 minutes!
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white text-[#d91b5c] hover:bg-rose-50 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>Register Free Now</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
