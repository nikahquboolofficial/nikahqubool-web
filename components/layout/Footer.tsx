"use client";

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, Lock, Heart, Phone, Mail, MapPin, 
  Clock, CheckCircle2, ArrowUpRight
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#fcf1f3] text-slate-700 border-t border-rose-200 font-sans">
      
      {/* 🌸 SUBTLE TOP ACCENT LINE */}
      <div className="w-full h-1 bg-gradient-to-r from-[#d91b5c] via-rose-300 to-[#d91b5c]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        
        {/* MAIN 4-COLUMN FOOTER GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* COLUMN 1: BRAND & MISSION (LG: 4 COLS) */}
          <div className="lg:col-span-4 space-y-4 text-left">
            <Link href="/" className="inline-block">
              <img
                src="/nikah-qubool-logo.png"
                alt="Nikah Qubool Matrimony"
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </Link>

            <p className="text-xs text-slate-600 leading-relaxed font-normal max-w-sm">
              Nikah Qubool is India&apos;s most trusted Halal Muslim matrimony platform. We are dedicated to connecting pious singles and respected families with honor, Islamic etiquette, and 100% verified identities.
            </p>

            {/* Helpline & Support Card */}
            <div className="p-4 rounded-2xl bg-white/95 border border-rose-200/90 shadow-xs space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Phone size={14} className="text-[#d91b5c]" />
                <span>Helpline: +91 84452 20256</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <Mail size={14} className="text-[#d91b5c]" />
                <span>support@nikahqubool.in</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <Clock size={13} className="text-slate-400" />
                <span>Mon – Sat, 10:00 AM – 7:00 PM IST</span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="pt-1 flex flex-wrap gap-2 text-[11px] font-bold text-slate-700">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-rose-200/90 shadow-2xs">
                <ShieldCheck size={12} className="text-emerald-600" />
                <span>100% Verified Profiles</span>
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-rose-200/90 shadow-2xs">
                <Lock size={12} className="text-[#d91b5c]" />
                <span>Photo Privacy Control</span>
              </span>
            </div>
          </div>

          {/* COLUMN 2: QUICK LINKS (LG: 2 COLS) */}
          <div className="lg:col-span-2 space-y-3 text-left">
            <h4 className="font-serif font-bold text-sm text-slate-900 border-b border-rose-200/70 pb-2">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/login" className="text-slate-600 hover:text-[#d91b5c] transition-colors flex items-center justify-between group font-medium">
                  <span>Register Free</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#d91b5c]" />
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-slate-600 hover:text-[#d91b5c] transition-colors flex items-center justify-between group font-medium">
                  <span>Login with Mobile</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#d91b5c]" />
                </Link>
              </li>
              <li>
                <Link href="/dashboard/find-match" className="text-slate-600 hover:text-[#d91b5c] transition-colors font-medium">
                  Find Compatible Matches
                </Link>
              </li>
              <li>
                <Link href="/dashboard/membership" className="text-slate-600 hover:text-[#d91b5c] transition-colors font-medium">
                  VIP Membership Plans
                </Link>
              </li>
              <li>
                <Link href="/about-us" className="text-slate-600 hover:text-[#d91b5c] transition-colors font-medium">
                  Our Mission & Values
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-slate-600 hover:text-[#d91b5c] transition-colors font-medium">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: BROWSE BY CITIES & SECTS (LG: 3 COLS) */}
          <div className="lg:col-span-3 space-y-3 text-left">
            <h4 className="font-serif font-bold text-sm text-slate-900 border-b border-rose-200/70 pb-2">
              Explore Proposals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/matrimony/sunni-rishte-in-delhi" className="text-slate-600 hover:text-[#d91b5c] transition-colors font-medium">
                  Sunni Rishte in Delhi NCR
                </Link>
              </li>
              <li>
                <Link href="/matrimony/syed-rishte-in-lucknow" className="text-slate-600 hover:text-[#d91b5c] transition-colors font-medium">
                  Syed Matrimony in Lucknow
                </Link>
              </li>
              <li>
                <Link href="/matrimony/bareilly-muslim-matrimony" className="text-slate-600 hover:text-[#d91b5c] transition-colors font-medium">
                  Muslim Rishte in Bareilly & UP
                </Link>
              </li>
              <li>
                <Link href="/matrimony/muslim-matrimony-in-mumbai" className="text-slate-600 hover:text-[#d91b5c] transition-colors font-medium">
                  Muslim Proposals in Mumbai
                </Link>
              </li>
              <li>
                <Link href="/matrimony/deobandi-matrimony-in-hyderabad" className="text-slate-600 hover:text-[#d91b5c] transition-colors font-medium">
                  Deobandi & Hanafi Hyderabad
                </Link>
              </li>
              <li>
                <Link href="/matrimony/muslim-doctor-rishte" className="text-slate-600 hover:text-[#d91b5c] transition-colors font-medium">
                  Muslim Doctors & Engineers
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 4: TRUST, SAFETY & LEGAL POLICIES (LG: 3 COLS) */}
          <div className="lg:col-span-3 space-y-3 text-left">
            <h4 className="font-serif font-bold text-sm text-slate-900 border-b border-rose-200/70 pb-2">
              Trust & Legal Policies
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy-policy" className="text-slate-600 hover:text-[#d91b5c] transition-colors font-medium">
                  Privacy Policy (Data & Photo)
                </Link>
              </li>
              <li>
                <Link href="/terms-conditions" className="text-slate-600 hover:text-[#d91b5c] transition-colors font-medium">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/safety-tips" className="text-slate-600 hover:text-[#d91b5c] transition-colors font-medium">
                  Safe Matrimony Guidelines
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-slate-600 hover:text-[#d91b5c] transition-colors font-medium">
                  Refund & Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/pricing-policy" className="text-slate-600 hover:text-[#d91b5c] transition-colors font-medium">
                  Pricing & Service Terms
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="text-slate-600 hover:text-[#d91b5c] transition-colors font-medium">
                  Contact Support Team
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* 🕌 ISLAMIC QUOTE ACCENT STRIP */}
        <div className="mt-10 pt-6 border-t border-rose-200/70 text-center">
          <p className="font-serif italic text-xs sm:text-sm text-slate-700 max-w-xl mx-auto leading-relaxed">
            &ldquo;And of His signs is that He created for you spouses from among yourselves, that you may find tranquility in them; and He placed between you love and mercy.&rdquo;
          </p>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#d91b5c] mt-1 block">
            — Surah Ar-Rum (30:21)
          </span>
        </div>

        {/* BOTTOM COPYRIGHT & COMPLIANCE BAR */}
        <div className="mt-8 pt-6 border-t border-rose-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[11px] text-slate-600">
          <p>
            © 2026 Nikah Qubool Matrimony. All Rights Reserved. A Trusted Platform for the Ummah.
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-700 font-bold">
              <CheckCircle2 size={12} className="text-emerald-600" /> 256-Bit SSL Encrypted
            </span>
            <span>•</span>
            <span className="text-slate-700 font-bold">100% Halal Certified</span>
          </div>
        </div>

      </div>

    </footer>
  );
}
