"use client";

import React from 'react';

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-[#ffe0e9]/20 py-8 px-4 sm:px-6 lg:px-[8%]">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md rounded-[32px] p-6 sm:p-10 shadow-xl border border-[#870c3f]/20">
        <div className="text-center mb-8">
          <span className="bg-[#870c3f]/10 text-[#870c3f] text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">User Agreement</span>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#870c3f] mt-2">Terms & Conditions</h1>
          <p className="text-xs sm:text-sm text-[#870c3f]/80 mt-2">Please read these terms carefully before registering on Pakiza Rishte.</p>
        </div>

        <div className="space-y-6 text-[#870c3f]/90 text-xs sm:text-sm leading-relaxed">
          <p>
            By accessing or registering on <strong className="text-[#870c3f]">Pakiza Rishte</strong>, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please refrain from using our services.
          </p>
          <h3 className="font-serif font-bold text-base text-[#870c3f] pt-2">1. Eligibility</h3>
          <p>
            You must be of legal marriageable age as per Indian law (18 years for females, 21 years for males) to register a profile. Profiles created for sons, daughters, brothers, or sisters must be managed by authorized family members.
          </p>
          <h3 className="font-serif font-bold text-base text-[#870c3f] pt-2">2. Account Security</h3>
          <p>
            You are responsible for maintaining the confidentiality of your login credentials and OTP verifications. Pakiza Rishte is not liable for any unauthorized usage resulting from shared phone access.
          </p>
          <h3 className="font-serif font-bold text-base text-[#870c3f] pt-2">3. Code of Conduct</h3>
          <p>
            Any abusive language, harassment, fraudulent representation, or commercial solicitation on the platform will lead to immediate account termination without refund.
          </p>
        </div>
      </div>
    </div>
  );
}