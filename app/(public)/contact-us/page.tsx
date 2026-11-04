"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Phone, Mail, MapPin, Clock, MessageSquare, 
  CheckCircle2, Send, ShieldCheck 
} from 'lucide-react';

export default function ContactUsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.mobile || !form.message) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white py-12 sm:py-16 px-4 sm:px-6 lg:px-[8%] font-sans text-slate-800">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="bg-rose-50 text-[#d91b5c] border border-rose-200 text-[11px] font-black uppercase px-3.5 py-1 rounded-full tracking-widest inline-flex items-center gap-1.5">
            <MessageSquare size={13} /> Here For You
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-black text-slate-900 tracking-tight">
            Contact Our Support Team
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Have questions about registration, profile verification, or membership plans? Our dedicated matrimonial advisors are ready to assist you.
          </p>
        </div>

        {/* 2-COLUMN CONTACT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
          
          {/* LEFT COLUMN: CONTACT DETAILS & HELPLINES */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="p-6 rounded-3xl bg-[#faf7f5] border border-rose-100 shadow-xs space-y-5">
              <h3 className="text-lg font-serif font-bold text-slate-900 border-b border-rose-100 pb-3">
                Official Helpdesk
              </h3>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100/70 flex items-center justify-center text-[#d91b5c] shrink-0">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Phone & WhatsApp Support</p>
                    <p className="text-slate-600 mt-0.5">+91 84452 20256</p>
                    <p className="text-[11px] text-slate-400">Available Mon – Sat, 10 AM to 7 PM IST</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100/70 flex items-center justify-center text-[#d91b5c] shrink-0">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Email Inquiries</p>
                    <p className="text-slate-600 mt-0.5">support@nikahqubool.in</p>
                    <p className="text-[11px] text-slate-400">Response within 4–6 business hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100/70 flex items-center justify-center text-[#d91b5c] shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Registered Corporate Office</p>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      Nikah Qubool Matrimony (IT Creative Solutions), <br />
                      Civil Lines / Stadium Road, Bareilly, UP 243001, India
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-600" /> Need Immediate Profile Assistance?
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                If you are an active member facing any verification or technical issues, mention your registered mobile number in your message for expedited resolution.
              </p>
            </div>

          </div>

          {/* RIGHT COLUMN: CONTACT FORM */}
          <div className="lg:col-span-7 bg-[#faf7f5] p-6 sm:p-10 rounded-3xl border border-rose-100 shadow-xs">
            {submitted ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-900">
                  Message Sent Successfully
                </h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  JazakAllah Khair for reaching out. One of our matrimonial coordinators will get back to you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-2 text-xs font-bold text-[#d91b5c] underline hover:text-rose-700 cursor-pointer"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-serif font-bold text-slate-900 border-b border-rose-100 pb-3">
                  Leave Us a Message
                </h3>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 outline-none focus:border-[#d91b5c]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 outline-none focus:border-[#d91b5c]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="your.email@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 outline-none focus:border-[#d91b5c]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Your Message / Query *</label>
                  <textarea
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Describe how we can help you..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 outline-none focus:border-[#d91b5c] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#d91b5c] hover:bg-[#c21450] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send size={14} />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
