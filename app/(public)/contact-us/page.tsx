"use client";

import React, { useState } from 'react';

export default function ContactUsPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#ffe0e9]/20 py-8 px-4 sm:px-6 lg:px-[8%]">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md rounded-[32px] p-6 sm:p-10 shadow-xl border border-[#d91b5c]/20">
        <div className="text-center mb-8">
          <span className="bg-[#d91b5c]/10 text-[#d91b5c] text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Get in Touch</span>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#d91b5c] mt-2">Contact Us</h1>
          <p className="text-xs sm:text-sm text-[#d91b5c]/80 mt-2">We are here to help you through your partner search journey.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 text-xs sm:text-sm text-[#d91b5c]">
            <div className="bg-[#ffe0e9]/40 p-5 rounded-2xl border border-[#d91b5c]/10">
              <h4 className="font-bold text-sm mb-1">Support Desk</h4>
              <p className="text-[#d91b5c]/80">For assistance regarding profiles, membership, or technical issues.</p>
              <p className="mt-3 font-semibold">Email: support@nikahqubool.com</p>
            </div>
            <div className="bg-[#ffe0e9]/40 p-5 rounded-2xl border border-[#d91b5c]/10">
              <h4 className="font-bold text-sm mb-1">Headquarters</h4>
              <p className="text-[#d91b5c]/80">Bareilly, Uttar Pradesh, India</p>
              <p className="mt-3 font-semibold">Helpline: +91 (Mon - Sat, 10 AM - 7 PM)</p>
            </div>
          </div>

          <div>
            {submitted ? (
              <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-2xl text-center">
                <h4 className="font-bold text-base mb-1">Message Sent!</h4>
                <p className="text-xs">Thank you for reaching out. Our support team will get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#d91b5c] mb-1">Your Name</label>
                  <input type="text" required className="w-full px-3 py-2.5 rounded-xl border border-[#d91b5c]/30 bg-white text-xs text-[#d91b5c] outline-none focus:border-[#d91b5c]" placeholder="Enter your name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#d91b5c] mb-1">Mobile Number</label>
                  <input type="tel" required className="w-full px-3 py-2.5 rounded-xl border border-[#d91b5c]/30 bg-white text-xs text-[#d91b5c] outline-none focus:border-[#d91b5c]" placeholder="10-digit mobile number" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#d91b5c] mb-1">Message</label>
                  <textarea rows={4} required className="w-full px-3 py-2.5 rounded-xl border border-[#d91b5c]/30 bg-white text-xs text-[#d91b5c] outline-none focus:border-[#d91b5c]" placeholder="How can we help you?"></textarea>
                </div>
                <button type="submit" className="w-full py-3 bg-[#d91b5c] text-[#ffe0e9] rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:bg-[#680930] transition-all cursor-pointer">
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
