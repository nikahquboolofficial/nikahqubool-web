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
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md rounded-[32px] p-6 sm:p-10 shadow-xl border border-[#870c3f]/20">
        <div className="text-center mb-8">
          <span className="bg-[#870c3f]/10 text-[#870c3f] text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Get in Touch</span>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#870c3f] mt-2">Contact Us</h1>
          <p className="text-xs sm:text-sm text-[#870c3f]/80 mt-2">We are here to help you through your partner search journey.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 text-xs sm:text-sm text-[#870c3f]">
            <div className="bg-[#ffe0e9]/40 p-5 rounded-2xl border border-[#870c3f]/10">
              <h4 className="font-bold text-sm mb-1">Support Desk</h4>
              <p className="text-[#870c3f]/80">For assistance regarding profiles, membership, or technical issues.</p>
              <p className="mt-3 font-semibold">Email: support@pakizarishte.com</p>
            </div>
            <div className="bg-[#ffe0e9]/40 p-5 rounded-2xl border border-[#870c3f]/10">
              <h4 className="font-bold text-sm mb-1">Headquarters</h4>
              <p className="text-[#870c3f]/80">Bareilly, Uttar Pradesh, India</p>
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
                  <label className="block text-xs font-bold text-[#870c3f] mb-1">Your Name</label>
                  <input type="text" required className="w-full px-3 py-2.5 rounded-xl border border-[#870c3f]/30 bg-white text-xs text-[#870c3f] outline-none focus:border-[#870c3f]" placeholder="Enter your name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#870c3f] mb-1">Mobile Number</label>
                  <input type="tel" required className="w-full px-3 py-2.5 rounded-xl border border-[#870c3f]/30 bg-white text-xs text-[#870c3f] outline-none focus:border-[#870c3f]" placeholder="10-digit mobile number" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#870c3f] mb-1">Message</label>
                  <textarea rows={4} required className="w-full px-3 py-2.5 rounded-xl border border-[#870c3f]/30 bg-white text-xs text-[#870c3f] outline-none focus:border-[#870c3f]" placeholder="How can we help you?"></textarea>
                </div>
                <button type="submit" className="w-full py-3 bg-[#870c3f] text-[#ffe0e9] rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:bg-[#680930] transition-all cursor-pointer">
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