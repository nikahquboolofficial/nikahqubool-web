"use client";

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, Heart, Lock, Users, Sparkles, CheckCircle2, 
  Award, Globe, BookOpen, ArrowRight 
} from 'lucide-react';

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-white py-12 sm:py-16 px-4 sm:px-6 lg:px-[8%] font-sans text-slate-800">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="bg-rose-50 text-[#d91b5c] border border-rose-200 text-[11px] font-black uppercase px-3.5 py-1 rounded-full tracking-widest inline-flex items-center gap-1.5">
            <Sparkles size={13} /> Our Sacred Mission
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-black text-slate-900 tracking-tight">
            About Nikah Qubool
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Preserving Islamic values, family honor, and sincere connections in modern matrimonial matchmaking.
          </p>
        </div>

        {/* HERO BANNER CARD */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white p-8 sm:p-12 shadow-xl">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600')" }}
          />
          <div className="relative z-10 max-w-2xl space-y-4 text-left">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-snug">
              Connecting Sincere Hearts For Pure, Halal Nikah
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
              In a digital world crowded with casual dating apps and unverified platforms, Nikah Qubool was created to bring back the sacred purity of Islamic marriage. We believe that marriage in Islam is half our Deen, founded upon mutual respect, shared faith, and family blessings.
            </p>
            <div className="pt-2 flex flex-wrap gap-3 text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                <CheckCircle2 size={14} className="text-emerald-400" /> 100% Verified Identities
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                <Lock size={14} className="text-rose-300" /> Complete Photo Privacy
              </span>
            </div>
          </div>
        </div>

        {/* 3 CORE PILLARS */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
              Our Guiding Principles
            </h3>
            <p className="text-xs text-slate-500">
              Every feature on Nikah Qubool is crafted around these three core pillars.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-2xl bg-[#faf7f5] border border-rose-100 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-rose-200 flex items-center justify-center text-[#d91b5c]">
                <BookOpen size={22} />
              </div>
              <h4 className="text-base font-serif font-bold text-slate-900">1. Guided by Sunnah</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                We strictly adhere to Islamic matrimonial principles. Our platform focuses entirely on serious proposals, zero superficial swiping, and respectful communication with direct family involvement.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#faf7f5] border border-rose-100 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-rose-200 flex items-center justify-center text-[#d91b5c]">
                <ShieldCheck size={22} />
              </div>
              <h4 className="text-base font-serif font-bold text-slate-900">2. Authenticity & Verification</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Every member is verified via a 6-digit mobile OTP. Our dedicated screening team manually checks profiles, backgrounds, and documents to eliminate fraudulent and duplicate accounts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#faf7f5] border border-rose-100 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-rose-200 flex items-center justify-center text-[#d91b5c]">
                <Lock size={22} />
              </div>
              <h4 className="text-base font-serif font-bold text-slate-900">3. Absolute Privacy</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Modesty (Haya) is an integral part of faith. Sisters and families have granular controls over who sees photos and contact details. No phone number or picture is made public without consent.
              </p>
            </div>
          </div>
        </div>

        {/* STATS HIGHLIGHT */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 rounded-3xl bg-rose-50/50 border border-rose-100 text-center">
          <div>
            <p className="text-2xl sm:text-3xl font-serif font-black text-[#d91b5c]">10,000+</p>
            <p className="text-xs text-slate-600 font-medium mt-1">Active Muslim Profiles</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-serif font-black text-[#d91b5c]">2,500+</p>
            <p className="text-xs text-slate-600 font-medium mt-1">Blessed Nikahs Completed</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-serif font-black text-[#d91b5c]">100%</p>
            <p className="text-xs text-slate-600 font-medium mt-1">Verified Identities</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-serif font-black text-[#d91b5c]">50+ Cities</p>
            <p className="text-xs text-slate-600 font-medium mt-1">Across India & Abroad</p>
          </div>
        </div>

        {/* CTA CARD */}
        <div className="text-center p-8 sm:p-10 rounded-3xl bg-[#faf7f5] border border-rose-100 space-y-4">
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
            Ready to Begin Your Sacred Journey?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            Join thousands of respectable Muslim singles and families who have found their ideal life partners on Nikah Qubool.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[#d91b5c] hover:bg-[#c21450] text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer active:scale-95"
            >
              <span>Register Free Today</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
