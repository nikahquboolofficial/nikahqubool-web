"use client";

import React from 'react';

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-[#ffe0e9]/20 py-8 px-4 sm:px-6 lg:px-[8%]">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md rounded-[32px] p-6 sm:p-10 shadow-xl border border-[#870c3f]/20">
        <div className="text-center mb-8">
          <span className="bg-[#870c3f]/10 text-[#870c3f] text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Our Story</span>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#870c3f] mt-2">About Pakiza Rishte</h1>
          <p className="text-xs sm:text-sm text-[#870c3f]/80 mt-2">Redefining trusted matchmaking with elegance, privacy, and authenticity.</p>
        </div>

        <div className="space-y-6 text-[#870c3f]/90 text-xs sm:text-sm leading-relaxed">
          <p>
            Welcome to <strong className="text-[#870c3f]">Pakiza Rishte</strong>, your most trusted destination for meaningful and verified life partnerships. In a world where digital connections often lack sincerity, we built a platform rooted in traditional values combined with modern, high-level security algorithms.
          </p>
          <h3 className="font-serif font-bold text-base text-[#870c3f] pt-2">Our Mission</h3>
          <p>
            Our core mission is to simplify the journey of finding a soulmate by providing a secure, dignified, and user-friendly environment. Every profile on Pakiza Rishte goes through strict validation checks to ensure genuine intentions and absolute peace of mind for families.
          </p>
          <h3 className="font-serif font-bold text-base text-[#870c3f] pt-2">Why Choose Us?</h3>
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