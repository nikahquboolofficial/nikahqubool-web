"use client";

import React from 'react';

export default function SafetyTipsPage() {
  return (
    <div className="min-h-screen bg-[#ffe0e9]/20 py-8 px-4 sm:px-6 lg:px-[8%]">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md rounded-[32px] p-6 sm:p-10 shadow-xl border border-[#d91b5c]/20">
        <div className="text-center mb-8">
          <span className="bg-[#d91b5c]/10 text-[#d91b5c] text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Secure Matchmaking</span>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#d91b5c] mt-2">Safety Tips</h1>
          <p className="text-xs sm:text-sm text-[#d91b5c]/80 mt-2">Your safety and security are our highest priorities. Please follow these guidelines.</p>
        </div>

        <div className="space-y-6 text-[#d91b5c]/90 text-xs sm:text-sm leading-relaxed">
          <div className="bg-[#ffe0e9]/40 p-5 rounded-2xl border border-[#d91b5c]/10">
            <h3 className="font-serif font-bold text-base text-[#d91b5c] mb-2">1. Protect Your Financial Information</h3>
            <p>Never share your bank details, credit card numbers, or transfer money to anyone you meet online, regardless of how urgent or convincing their reason may be.</p>
          </div>

          <div className="bg-[#ffe0e9]/40 p-5 rounded-2xl border border-[#d91b5c]/10">
            <h3 className="font-serif font-bold text-base text-[#d91b5c] mb-2">2. Meet in Public Spaces First</h3>
            <p>When meeting a prospective match or their family in person for the first time, always choose a public venue and inform a family member about your whereabouts.</p>
          </div>

          <div className="bg-[#ffe0e9]/40 p-5 rounded-2xl border border-[#d91b5c]/10">
            <h3 className="font-serif font-bold text-base text-[#d91b5c] mb-2">3. Verify Background Details Independently</h3>
            <p>Take your time to know the person and their family background thoroughly through mutual references before taking any major decisions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
