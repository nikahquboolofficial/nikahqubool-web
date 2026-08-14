"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, Mail, MessageSquare, HelpCircle, Send, CheckCircle2, Shield, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'sonner';

export default function HelpAndSupportPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter your message or query.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Support ticket submitted! Our team will contact you within 2 hours.");
      setSubject('');
      setMessage('');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-28 pt-4 selection:bg-[#870c3f] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      <div className="max-w-2xl mx-auto px-4 space-y-6">
        
        {/* HEADER BAR */}
        <div className="flex items-center gap-3 py-2 border-b border-slate-200">
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="flex p-2 hover:bg-rose-50 text-[#870c3f] rounded-full transition-colors cursor-pointer"
            aria-label="Back"
            title="Go Back"
          >
            <ArrowLeft size={22} className="stroke-[2.5]" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Help & Customer Support
            </h1>
          </div>
        </div>

        {/* 📞 DIRECT CONTACT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <a 
            href="tel:+918055990011" 
            className="bg-white rounded-3xl p-5 border-2 border-rose-100 shadow-md hover:border-[#870c3f] transition-all flex flex-col items-center text-center space-y-2 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#870c3f] flex items-center justify-center border border-rose-200 group-hover:scale-110 transition-transform">
              <Phone size={22} />
            </div>
            <span className="text-xs font-black uppercase text-slate-900">Phone Support</span>
            <span className="text-[11px] font-bold text-[#870c3f]">+91 805 599 0011</span>
          </a>

          <a 
            href="https://wa.me/918055990011" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="bg-white rounded-3xl p-5 border-2 border-emerald-100 shadow-md hover:border-emerald-500 transition-all flex flex-col items-center text-center space-y-2 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 group-hover:scale-110 transition-transform">
              <MessageSquare size={22} />
            </div>
            <span className="text-xs font-black uppercase text-slate-900">WhatsApp Help</span>
            <span className="text-[11px] font-bold text-emerald-700">Instant Chat</span>
          </a>

          <a 
            href="mailto:support@pakizarishte.com" 
            className="bg-white rounded-3xl p-5 border-2 border-rose-100 shadow-md hover:border-[#870c3f] transition-all flex flex-col items-center text-center space-y-2 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#870c3f] flex items-center justify-center border border-rose-200 group-hover:scale-110 transition-transform">
              <Mail size={22} />
            </div>
            <span className="text-xs font-black uppercase text-slate-900">Email Query</span>
            <span className="text-[11px] font-bold text-[#870c3f]">support@pakizarishte.com</span>
          </a>
        </div>

        {/* 📝 SUBMIT SUPPORT TICKET FORM */}
        <div className="bg-white rounded-3xl p-6 border-2 border-rose-100 shadow-xl space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <HelpCircle size={20} className="text-[#870c3f]" />
            <h3 className="font-serif font-extrabold text-sm uppercase text-slate-900">Send Us a Direct Message</h3>
          </div>

          <form onSubmit={handleSubmitTicket} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Query Category</label>
              <select 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-[#870c3f]"
              >
                <option value="General Query">General Query</option>
                <option value="Membership & VIP Plan">Membership & VIP Plan Query</option>
                <option value="Photo Access & Privacy">Photo Access & Privacy Issue</option>
                <option value="Report User / Security">Report User / Security Issue</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">How can we help you?</label>
              <textarea 
                rows={4} 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                placeholder="Write your issue or question here in detail..." 
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:border-[#870c3f]" 
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting} 
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-900/20 hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer border border-rose-300/30"
            >
              <Send size={16} />
              <span>Submit Ticket</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
