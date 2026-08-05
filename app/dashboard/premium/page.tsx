"use client";

import React, { useState } from 'react';
import { 
  Check, Star, Crown, ShieldCheck, Zap, 
  ArrowRight, Heart, CreditCard,
  Infinity, Sparkles, Gem, CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function PremiumPremium() {
  const [selectedPlan, setSelectedPlan] = useState('pro');

  const plans = [
    {
      id: 'basic',
      name: "Standard",
      price: "1,499",
      duration: "1 Month",
      features: ["15 Contact Numbers", "Unlimited Messages", "Standard Placement", "Basic Support"],
      color: "border-slate-100",
      accent: "text-slate-400",
      bg: "bg-white"
    },
    {
      id: 'pro',
      name: "Gold",
      price: "3,499",
      duration: "3 Months",
      features: ["45 Contact Numbers", "Profile Highlight", "Advanced Filters", "Priority Support"],
      color: "border-amber-200",
      accent: "text-amber-500",
      bg: "bg-amber-50/20",
      popular: true
    },
    {
      id: 'elite',
      name: "Elite",
      price: "5,999",
      duration: "6 Months",
      features: ["100 Contact Numbers", "VIP Badge", "Incognito Mode", "Social Links View"],
      color: "border-pink-200",
      accent: "text-[#D2136E]",
      bg: "bg-pink-50/20"
    },
    {
      id: 'lifetime',
      name: "Till Marry",
      price: "11,999",
      duration: "Unlimited",
      features: ["Unlimited Contacts", "Personal Matchmaker", "Till You Get Married", "Top Rank in Search"],
      color: "border-purple-200",
      accent: "text-purple-600",
      bg: "bg-purple-50/30",
      special: true
    }
  ];

  return (
    <div className="min-h-screen bg-[#FFF9FA] text-[#4D0628] font-sans pb-20 overflow-x-hidden">
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>

      {/* Hero Section with Main Theme Color */}
      <div className="bg-white px-6 py-16 md:py-24 text-center border-b border-pink-50 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-pink-100/30 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100/20 blur-3xl rounded-full translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex justify-center items-center gap-2 mb-6"
          >
            <Heart fill="#D2136E" className="text-[#D2136E]" size={28} />
            <span className="text-2xl font-black text-[#D2136E] uppercase tracking-tighter">PAKIZA RISHTE</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-7xl font-black italic text-slate-800 leading-[1.1] mb-6">
            Choose the Perfect <br/> <span className="text-[#D2136E]">Success Plan</span>
          </h1>
          <p className="text-gray-500 font-medium text-lg italic max-w-2xl mx-auto">
            Upgrade your profile to get 10x more responses and find your soulmate faster.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20">
        {/* Plans Container - Mobile Swipeable */}
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-10 px-2">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ y: -8 }}
              className={`min-w-[300px] md:min-w-0 snap-center flex-1 bg-white rounded-[50px] border-2 ${plan.color} p-8 flex flex-col shadow-[0_20px_50px_rgba(210,19,110,0.05)] relative overflow-hidden transition-all`}
            >
              {/* Popular/Special Badge */}
              {(plan.popular || plan.special) && (
                <div className={`absolute top-6 right-8 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${plan.special ? 'bg-purple-600 text-white' : 'bg-amber-500 text-white'}`}>
                  {plan.special ? 'Best Value' : 'Popular'}
                </div>
              )}

              <div className={`w-14 h-14 rounded-2xl ${plan.bg} flex items-center justify-center mb-8`}>
                {plan.id === 'basic' && <Zap className={plan.accent} />}
                {plan.id === 'pro' && <Star className={plan.accent} />}
                {plan.id === 'elite' && <Gem className={plan.accent} />}
                {plan.id === 'lifetime' && <Infinity className={plan.accent} size={28} />}
              </div>

              <h3 className="text-2xl font-black italic mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black tracking-tighter">₹{plan.price}</span>
                <span className="text-xs font-bold text-gray-400 uppercase">/ {plan.duration}</span>
              </div>

              <div className="flex-1 space-y-4 mb-10">
                {plan.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0`}>
                      <Check size={12} className={plan.accent} strokeWidth={4} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{feat}</span>
                  </div>
                ))}
              </div>

              <button 
                className={`w-full py-5 rounded-3xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 ${
                  plan.id === 'elite' || plan.special
                  ? 'bg-[#D2136E] text-white shadow-lg shadow-pink-200' 
                  : 'bg-white border-2 border-slate-100 text-slate-800 hover:border-[#D2136E]'
                }`}
              >
                Get Started
              </button>
            </motion.div>
          ))}
        </div>

        {/* Features Comparison Strip */}
        <div className="mt-16 bg-white rounded-[60px] p-10 md:p-16 border border-pink-50 shadow-sm flex flex-col md:flex-row items-center justify-around gap-12">
          <div className="text-center md:text-left space-y-2">
            <h4 className="text-2xl font-black italic">Why Go Premium?</h4>
            <p className="text-gray-400 text-sm font-medium">Verified badges for 100% trust.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 w-full md:w-auto">
            {[
              { label: "Verified Contact", icon: <CheckCircle2 className="text-green-500" /> },
              { label: "Secure Chat", icon: <ShieldCheck className="text-blue-500" /> },
              { label: "Premium Support", icon: <Sparkles className="text-amber-500" /> }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className="p-3 bg-gray-50 rounded-2xl">{item.icon}</div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods Footer */}
        <div className="mt-12 flex flex-col items-center gap-6">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">Secure Payments via</p>
          <div className="flex gap-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
            {/* Replace with actual payment icons if available */}
            <span className="text-xs font-black italic">RAZORPAY</span>
            <span className="text-xs font-black italic">UPI</span>
            <span className="text-xs font-black italic">CARDS</span>
          </div>
        </div>
      </div>
    </div>
  );
}