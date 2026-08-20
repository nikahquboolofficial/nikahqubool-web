"use client";

import React from 'react';

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-[#ffe0e9]/20 py-8 px-4 sm:px-6 lg:px-[8%]">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md rounded-[32px] p-6 sm:p-10 shadow-xl border border-[#d91b5c]/20">
        <div className="text-center mb-8">
          <span className="bg-[#d91b5c]/10 text-[#d91b5c] text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Our Story</span>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#d91b5c] mt-2">About Nikah Qubool</h1>
          <p className="text-xs sm:text-sm text-[#d91b5c]/80 mt-2">Redefining trusted matchmaking with elegance, privacy, and authenticity.</p>
        </div>

        <div className="space-y-6 text-[#d91b5c]/90 text-xs sm:text-sm leading-relaxed">
          <p>
            Welcome to <strong className="text-[#d91b5c]">Nikah Qubool</strong>, your most trusted destination for meaningful and verified life partnerships. In a world where digital connections often lack sincerity, we built a platform rooted in traditional values combined with modern, high-level security algorithms.
          </p>
          <h3 className="font-serif font-bold text-base text-[#d91b5c] pt-2">Our Mission</h3>
          <p>
            Our core mission is to simplify the journey of finding a soulmate by providing a secure, dignified, and user-friendly environment. Every profile on Nikah Qubool goes through strict validation checks to ensure genuine intentions and absolute peace of mind for families.
          </p>
          <h3 className="font-serif font-bold text-base text-[#d91b5c] pt-2">Why Choose Us?</h3>
          <ul className="list-disc pl-5 space-y-2 font-medium">
            <li><strong>100% Mobile Optimized:</strong> Seamless web-to-app native feel across all devices.</li>
            <li><strong>Privacy First:</strong> Advanced controls to protect your personal photos and contact details.</li>
            <li><strong>Verified Profiles:</strong> Manual and OTP-based verification systems to eliminate fake accounts.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
