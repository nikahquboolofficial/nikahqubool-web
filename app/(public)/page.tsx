"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Lock, Heart, Sparkles, CheckCircle2, 
  ChevronRight, ChevronLeft, ArrowRight, HelpCircle, Star, Users
} from 'lucide-react';
import HeroRegisterForm from '@/components/home/HeroRegisterForm';

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [activeStory, setActiveStory] = useState(0);

  const stories = [
    {
      name: "Sana & Zaid",
      location: "Bareilly, UP",
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
      location: "Lucknow, UP",
      img: "https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?q=80&w=1200",
      text: "Finding a soulmate in your own city was never this easy. Today we are happily married and thankful to the entire team of Pakiza Rishte."
    },
  ];

  const banners = [
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=100&w=2400",
    "https://images.unsplash.com/photo-1519741497674-611481863552?q=100&w=2400",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=100&w=2400"
  ];

  useEffect(() => {
    const int = setInterval(() => setCurrentSlide(p => (p === 2 ? 0 : p + 1)), 6000);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#870c3f] selection:text-white">
      
      {/* 🌟 HERO SECTION */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 overflow-hidden bg-slate-950">
        
        {/* BACKGROUND SLIDESHOW */}
        <div className="absolute inset-0 z-0">
          {banners.map((img, idx) => (
            <div 
              key={idx} 
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 transform scale-105"
              style={{ 
                backgroundImage: `url('${img}')`, 
                opacity: currentSlide === idx ? 0.35 : 0,
                filter: 'brightness(0.7)'
              }}
            />
          ))}
          <div className="absolute top-1/4 left-10 w-96 h-96 bg-[#870c3f]/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col lg:grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* HERO CONTENT LEFT */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full lg:col-span-7 text-center lg:text-left space-y-6 order-2 lg:order-1"
          >
            <div className="inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-xs font-bold uppercase tracking-widest shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              100% Verified Nikah Platform
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black text-white leading-[1.1] tracking-tight">
              Discover. Connect. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-amber-400 italic font-normal">
                Soulful Matches.
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl">
              Find your ideal life partner with absolute privacy, traditional respect, and trusted verified profiles tailored for honorable families.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <span>Verified Profiles</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-400" />
                <span>Halal & Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-rose-400" />
                <span>Privacy Control</span>
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
      <div className="relative py-6 bg-[#870c3f] text-white overflow-hidden shadow-lg border-y border-rose-900">
        <div className="relative flex overflow-hidden">
          <div className="flex whitespace-nowrap animate-[scrollText_28s_linear_infinite] hover:[animation-play-state:paused] cursor-pointer">
            {[1, 2].map((group) => (
              <div key={group} className="flex items-center">
                {[
                  { t: "100% Verified Profiles", i: "✅" },
                  { t: "Secure & Halal Nikah", i: "🕌" },
                  { t: "Privacy Protection Guaranteed", i: "🔒" },
                  { t: "Trusted Family Matchmaking", i: "🤝" },
                  { t: "Strict Manual Screening", i: "🛡️" }
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className="relative flex items-center mx-4 px-5 py-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-xs hover:bg-white/20 transition-all duration-300"
                  >
                    <span className="text-base mr-3">{item.i}</span>
                    <span className="text-xs font-black tracking-widest uppercase text-white">{item.t}</span>
                    <div className="ml-4 text-amber-300 text-xs">✦</div>
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

      {/* 🛡️ WHY CHOOSE SECTION */}
      <section className="relative py-20 md:py-28 px-6 bg-white overflow-hidden border-b border-slate-200">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-[#870c3f] font-black uppercase tracking-[0.25em] text-xs bg-rose-50 px-5 py-2 rounded-full border border-rose-200 shadow-xs">
              Excellence in Matchmaking
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-black text-slate-900 tracking-tight">
              Why Choose <span className="text-[#870c3f] italic font-normal">Pakiza Rishte?</span>
            </h2>
            <p className="text-slate-600 text-sm md:text-base font-medium">
              Designed exclusively keeping Islamic values, absolute privacy, and verified families in mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Halal & Secure", desc: "Every single profile undergoes rigorous manual 3-step screening to ensure zero fake accounts and complete peace of mind for Nikah.", badge: "100% VERIFIED", icon: "🛡️" },
              { title: "Privacy Control", desc: "Advanced privacy controls put you in charge. Choose exactly who views your family details, pictures, and contact numbers.", badge: "COMPLETE PRIVACY", icon: "💎" },
              { title: "Marriage Focus", desc: "Exclusively built for families and individuals serious about Sunnah and lifelong Nikah. No casual swiping, only meaningful connections.", badge: "NO DATING APP", icon: "🌿" }
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
                    <span className="text-[10px] font-black tracking-widest text-[#870c3f] bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200">
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
                <div className="pt-6 mt-6 border-t border-slate-200/80 flex items-center justify-between text-[#870c3f] font-bold text-xs tracking-wider uppercase">
                  <span>Explore More</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 🚀 HOW IT WORKS */}
      <section className="relative py-20 md:py-28 px-6 bg-slate-100 overflow-hidden border-b border-slate-200">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-[#870c3f] font-black uppercase tracking-[0.25em] text-xs bg-white px-5 py-2 rounded-full border border-slate-200 shadow-xs">
              Simple Process
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-black text-slate-900 tracking-tight">
              How Pakiza Rishte <span className="text-[#870c3f] italic font-normal">Works</span>
            </h2>
            <p className="text-slate-600 text-sm md:text-base font-medium">
              Finding your ideal life partner is now structured, safe, and transparent in just 3 easy steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create Profile", desc: "Register securely with your family background, education, and partner preferences." },
              { step: "02", title: "Connect Families", desc: "Browse verified profiles and send interest requests directly to compatible families." },
              { step: "03", title: "Begin Nikah Journey", desc: "Interact safely through our platform and take the blessed step forward." }
            ].map((box, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-3xl border-2 border-slate-200 shadow-sm space-y-4 relative overflow-hidden group hover:border-rose-300 transition-all duration-300"
              >
                <span className="text-6xl font-serif font-black text-slate-200/80 absolute top-4 right-6 group-hover:text-rose-200 transition-colors">{box.step}</span>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#870c3f] font-black text-lg shadow-xs">
                  {box.step}
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-900">{box.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{box.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 💖 TESTIMONIALS SLIDER */}
      <section className="relative py-20 md:py-28 px-6 bg-white overflow-hidden border-b border-slate-200">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 space-y-3">
            <span className="text-[#870c3f] font-black uppercase tracking-[0.25em] text-xs bg-rose-50 px-4 py-2 rounded-full border border-rose-200 shadow-xs">
              Alhamdulillah
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-black text-slate-900 tracking-tight">
              United by <span className="text-[#870c3f] italic font-normal">Destiny</span>
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
                  <p className="text-[#870c3f] font-black text-xs tracking-widest uppercase mt-1">
                    Location: {stories[activeStory].location}
                  </p>
                </div>

                <p className="text-base text-slate-700 leading-relaxed font-medium italic bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
                  "{stories[activeStory].text}"
                </p>

                <div className="flex items-center justify-center lg:justify-start gap-3 pt-2">
                  <button 
                    onClick={() => setActiveStory(activeStory === 0 ? stories.length - 1 : activeStory - 1)}
                    className="w-12 h-12 rounded-full border border-slate-300 bg-white flex items-center justify-center hover:bg-[#870c3f] hover:text-white transition-all text-slate-800 cursor-pointer shadow-md"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={() => setActiveStory(activeStory === stories.length - 1 ? 0 : activeStory + 1)}
                    className="w-12 h-12 rounded-full border border-slate-300 bg-white flex items-center justify-center hover:bg-[#870c3f] hover:text-white transition-all text-slate-800 cursor-pointer shadow-md"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ❓ FAQ SECTION */}
      <section className="relative py-20 md:py-28 px-6 bg-slate-50 overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <span className="text-[#870c3f] font-black uppercase tracking-[0.25em] text-xs bg-white px-5 py-2 rounded-full border border-slate-200 shadow-xs">
              Got Questions?
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-black text-slate-900 tracking-tight">
              Frequently Asked <span className="text-[#870c3f] italic font-normal">Questions</span>
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { q: "How are profiles verified on Pakiza Rishte?", a: "Every single profile goes through a strict manual verification process involving phone confirmation and valid identity proofs to ensure complete family safety." },
              { q: "Is my personal and family contact information secure?", a: "Yes, your data is completely secure. Only approved members with your explicit permission can view your contact details and pictures." },
              { q: "How can I register my son or daughter's profile?", a: "You can easily sign up by entering basic details, uploading verification documents, and setting up partner expectations." }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white border-2 border-slate-200 p-6 md:p-8 rounded-2xl space-y-2 shadow-sm">
                <h4 className="text-lg md:text-xl font-serif font-bold text-slate-900">{faq.q}</h4>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}