"use client";

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';

export default function ContactUsPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-[8%] font-sans text-slate-800 selection:bg-[#d91b5c] selection:text-white">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl p-6 sm:p-12 shadow-xl border border-slate-200">
        
        {/* HEADER */}
        <div className="text-center mb-10 pb-6 border-b border-slate-100">
          <span className="bg-rose-50 text-[#d91b5c] border border-rose-200 text-[11px] font-black uppercase px-3.5 py-1 rounded-full tracking-widest inline-flex items-center gap-1.5">
            <Mail size={13} /> Official Support
          </span>
          <h1 className="text-2xl sm:text-4xl font-serif font-black text-slate-900 mt-3">
            Contact Us & Customer Support
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-2">
            We are here to assist you with profiles, memberships, billing, or queries.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: COMPANY CONTACT DETAILS */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-rose-50/50 rounded-2xl p-6 border border-rose-100 space-y-5">
              
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#d91b5c] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Headquarters / Registered Address</h4>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium leading-relaxed">
                    IT Creative Solution / Nikah Qubool<br />
                    Civil Lines, Bareilly, Uttar Pradesh - 243001, India
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pt-3 border-t border-rose-100">
                <div className="w-10 h-10 rounded-xl bg-[#d91b5c] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Mail size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Support & Billing Emails</h4>
                  <p className="text-xs text-slate-600 mt-0.5 font-semibold">
                    General Enquiries: <span className="text-[#d91b5c]">support@nikahqubool.in</span><br />
                    Billing & Refunds: <span className="text-[#d91b5c]">support@nikahqubool.com</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pt-3 border-t border-rose-100">
                <div className="w-10 h-10 rounded-xl bg-[#d91b5c] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Phone size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Helpline Phone Support</h4>
                  <p className="text-xs text-slate-600 mt-0.5 font-bold text-[#d91b5c]">
                    +91 (Mon - Sat, 10:00 AM - 7:00 PM IST)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pt-3 border-t border-rose-100">
                <div className="w-10 h-10 rounded-xl bg-[#d91b5c] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Working Hours</h4>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    Monday to Saturday: 10:00 AM – 7:00 PM IST<br />
                    Sunday: Email Support Active
                  </p>
                </div>
              </div>

            </div>

            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-2">
              <h4 className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                <ShieldCheck size={16} /> Fast Resolution Guarantee
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Our dedicated support desk responds to all billing, account verification, and profile inquiries within 24 business hours.
              </p>
            </div>

          </div>

          {/* RIGHT: INTERACTIVE CONTACT FORM */}
          <div className="lg:col-span-7 bg-slate-50/80 p-6 sm:p-8 rounded-3xl border border-slate-200">
            {submitted ? (
              <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-900 p-8 rounded-2xl text-center space-y-3 my-auto">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="font-serif font-bold text-xl text-emerald-900">Message Received!</h3>
                <p className="text-xs font-semibold text-emerald-700 max-w-md mx-auto">
                  Thank you for reaching out to Nikah Qubool. Our official support representative will review your message and get back to you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-serif font-bold text-lg text-slate-900 mb-2">Send us a direct message</h3>
                
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 outline-none focus:border-[#d91b5c] focus:ring-4 focus:ring-rose-100 font-semibold"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 outline-none focus:border-[#d91b5c] focus:ring-4 focus:ring-rose-100 font-semibold"
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 outline-none focus:border-[#d91b5c] focus:ring-4 focus:ring-rose-100 font-semibold"
                    placeholder="name@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Message / Query <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 outline-none focus:border-[#d91b5c] focus:ring-4 focus:ring-rose-100 font-semibold"
                    placeholder="How can we assist you with profile or membership?"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Submit Inquiry</span>
                  <Send size={15} />
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
