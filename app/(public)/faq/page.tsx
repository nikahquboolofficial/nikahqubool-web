"use client";

import React, { useState } from 'react';

const faqs = [
  { q: "Is registration on Nikah Qubool free?", a: "Yes, basic registration and profile creation on Nikah Qubool are completely free." },
  { q: "How are profiles verified?", a: "All profiles undergo mobile number verification via secure OTP, alongside optional manual checks to ensure authenticity." },
  { q: "Can I hide my photos from public view?", a: "Yes, you can manage your privacy settings to restrict photo visibility only to accepted connections." },
  { q: "How do I reset my account or update details?", a: "You can log into your dashboard anytime to edit your personal preferences, family details, and contact info." }
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#ffe0e9]/20 py-8 px-4 sm:px-6 lg:px-[8%]">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md rounded-[32px] p-6 sm:p-10 shadow-xl border border-[#d91b5c]/20">
        <div className="text-center mb-8">
          <span className="bg-[#d91b5c]/10 text-[#d91b5c] text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Help Center</span>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#d91b5c] mt-2">Frequently Asked Questions</h1>
          <p className="text-xs sm:text-sm text-[#d91b5c]/80 mt-2">Find quick answers to common queries about our matchmaking platform.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-[#d91b5c]/20 rounded-2xl overflow-hidden bg-white">
              <button 
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full px-5 py-4 text-left font-bold text-xs sm:text-sm text-[#d91b5c] flex justify-between items-center bg-[#ffe0e9]/20 hover:bg-[#ffe0e9]/40 transition-all cursor-pointer"
              >
                <span>{faq.q}</span>
                <span className="text-base font-black">{openIndex === idx ? '−' : '+'}</span>
              </button>
              {openIndex === idx && (
                <div className="px-5 py-4 text-xs sm:text-sm text-[#d91b5c]/80 border-t border-[#d91b5c]/10 bg-white leading-relaxed">
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
