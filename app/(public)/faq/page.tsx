"use client";

import React, { useState } from 'react';

const faqs = [
  { q: "Is registration on Pakiza Rishte free?", a: "Yes, basic registration and profile creation on Pakiza Rishte are completely free." },
  { q: "How are profiles verified?", a: "All profiles undergo mobile number verification via secure OTP, alongside optional manual checks to ensure authenticity." },
  { q: "Can I hide my photos from public view?", a: "Yes, you can manage your privacy settings to restrict photo visibility only to accepted connections." },
  { q: "How do I reset my account or update details?", a: "You can log into your dashboard anytime to edit your personal preferences, family details, and contact info." }
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#ffe0e9]/20 py-8 px-4 sm:px-6 lg:px-[8%]">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md rounded-[32px] p-6 sm:p-10 shadow-xl border border-[#870c3f]/20">
        <div className="text-center mb-8">
          <span className="bg-[#870c3f]/10 text-[#870c3f] text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Help Center</span>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#870c3f] mt-2">Frequently Asked Questions</h1>
          <p className="text-xs sm:text-sm text-[#870c3f]/80 mt-2">Find quick answers to common queries about our matchmaking platform.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-[#870c3f]/20 rounded-2xl overflow-hidden bg-white">
              <button 
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full px-5 py-4 text-left font-bold text-xs sm:text-sm text-[#870c3f] flex justify-between items-center bg-[#ffe0e9]/20 hover:bg-[#ffe0e9]/40 transition-all cursor-pointer"
              >
                <span>{faq.q}</span>
                <span className="text-base font-black">{openIndex === idx ? '−' : '+'}</span>
              </button>
              {openIndex === idx && (
                <div className="px-5 py-4 text-xs sm:text-sm text-[#870c3f]/80 border-t border-[#870c3f]/10 bg-white leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}