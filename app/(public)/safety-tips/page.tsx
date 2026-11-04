"use client";

import React from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, Lock, Eye, AlertTriangle, CheckCircle2, 
  PhoneCall, Users, ArrowRight 
} from 'lucide-react';

export default function SafetyTipsPage() {
  return (
    <div className="min-h-screen bg-white py-12 sm:py-16 px-4 sm:px-6 lg:px-[8%] font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="bg-rose-50 text-[#d91b5c] border border-rose-200 text-[11px] font-black uppercase px-3.5 py-1 rounded-full tracking-widest inline-flex items-center gap-1.5">
            <ShieldAlert size={13} /> Trust & Security
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-black text-slate-900 tracking-tight">
            Safe Matrimony Guidelines
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Your safety and dignity are our highest priorities. Please review these essential guidelines for a secure matrimonial journey.
          </p>
        </div>

        {/* INTRO ALERT */}
        <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs sm:text-sm text-amber-900 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Golden Rule: Never Share Financial Details or Transfer Money</p>
            <p className="text-amber-800 text-xs leading-relaxed">
              Nikah Qubool will NEVER ask you for bank account numbers, UPI PINs, or money transfers for matchmaking. Beware of anyone asking for financial help under any pretext.
            </p>
          </div>
        </div>

        {/* GUIDELINES GRID */}
        <div className="space-y-6 text-left">
          
          <div className="p-6 rounded-2xl bg-[#faf7f5] border border-slate-200 space-y-3 shadow-xs">
            <h3 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-[#d91b5c]" /> 1. Involve Your Family & Guardians Early
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Islamic marriage is a union of two families. Always keep your parents, guardians (Wali), or elder family members informed right from the initial conversations. Direct family-to-family interaction guarantees transparency and genuine intentions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#faf7f5] border border-slate-200 space-y-3 shadow-xs">
            <h3 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
              <Lock size={18} className="text-[#d91b5c]" /> 2. Protect Your Personal Contact Information
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Use Nikah Qubool&apos;s built-in secure chat system during your initial interactions. Do not share your personal phone number, home address, or social media handles until you and your family have thoroughly established trust.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#faf7f5] border border-slate-200 space-y-3 shadow-xs">
            <h3 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[#d91b5c]" /> 3. Verify Background & Documentation Independently
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              While Nikah Qubool performs phone OTP and manual screenings, families are strongly advised to independently verify key details such as profession, employer, family background, and marital history before finalizing any proposal.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#faf7f5] border border-slate-200 space-y-3 shadow-xs">
            <h3 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
              <Eye size={18} className="text-[#d91b5c]" /> 4. Meet Only in Safe, Public Spaces with Family
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              If both families agree to an in-person meeting, arrange it in a dignified, well-lit, public setting (such as a family restaurant) or at the bride&apos;s home in the presence of parents or trusted guardians. Never agree to meet alone in private places.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#faf7f5] border border-slate-200 space-y-3 shadow-xs">
            <h3 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
              <PhoneCall size={18} className="text-[#d91b5c]" /> 5. Report Suspicious Activity Immediately
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              If you encounter any member exhibiting inappropriate behavior, asking for money, or providing contradictory details, block them and use the &quot;Report User&quot; button immediately. Our safety team investigates and takes immediate action within hours.
            </p>
          </div>

        </div>

        {/* SUPPORT BANNER */}
        <div className="p-6 rounded-2xl bg-rose-50/60 border border-rose-200 text-center space-y-2">
          <p className="text-xs sm:text-sm font-bold text-slate-900">
            Need Help or Wish to Report an Incident?
          </p>
          <p className="text-xs text-slate-600">
            Contact our dedicated trust & safety cell directly at <strong className="text-[#d91b5c]">support@nikahqubool.in</strong> or call <strong className="text-slate-900">+91 84452 20256</strong>.
          </p>
        </div>

      </div>
    </div>
  );
}
