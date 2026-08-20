"use client";

import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#ffe0e9]/20 py-8 px-4 sm:px-6 lg:px-[8%]">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md rounded-[32px] p-6 sm:p-10 shadow-xl border border-[#d91b5c]/20">
        <div className="text-center mb-8">
          <span className="bg-[#d91b5c]/10 text-[#d91b5c] text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Data Protection</span>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#d91b5c] mt-2">Privacy Policy</h1>
          <p className="text-xs sm:text-sm text-[#d91b5c]/80 mt-2">Last updated: August 2026</p>
        </div>

        <div className="space-y-6 text-[#d91b5c]/90 text-xs sm:text-sm leading-relaxed">
          <p>
            At <strong className="text-[#d91b5c]">Nikah Qubool</strong>, we take your personal privacy very seriously. This Privacy Policy outlines how we collect, use, protect, and handle your sensitive information when you use our web and mobile platforms.
          </p>
          <h3 className="font-serif font-bold text-base text-[#d91b5c] pt-2">1. Information We Collect</h3>
          <p>
            We collect personal data necessary for matchmaking services, including your full name, mobile number, email address, gender, date of birth, education, profession, family background, and photographs uploaded voluntarily.
          </p>
          <h3 className="font-serif font-bold text-base text-[#d91b5c] pt-2">2. How We Use Your Data</h3>
          <p>
            Your information is exclusively used to match compatible profiles, facilitate secure communication between members, and send essential service updates via OTP or notifications. We never sell or rent your data to third-party advertisers.
          </p>
          <h3 className="font-serif font-bold text-base text-[#d91b5c] pt-2">3. Data Security</h3>
          <p>
            We implement high-level encryption standards and secure server protocols to ensure your photos and contact details remain protected against unauthorized access.
          </p>
        </div>
      </div>
    </div>
  );
}
