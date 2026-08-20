"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-slate-950 text-white border-t-2 border-[#d91b5c] relative overflow-hidden">
      {/* GRADIENT TOP BAR */}
      <div className="w-full h-1.5 bg-gradient-to-r from-[#d91b5c] via-amber-400 via-rose-500 to-[#d91b5c]" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-14 md:py-18 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          
          {/* BRAND COLUMN */}
          <div className="lg:col-span-5 space-y-4 text-center lg:text-left">
            <div className="flex flex-col items-center lg:items-start">
              <Link href="/">
                <img
                  src="/logo.png"
                  alt="Nikah Qubool Logo"
                  className="h-16 sm:h-20 w-auto object-contain brightness-125 filter drop-shadow-md origin-center lg:origin-left"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/logo.jpg'; }}
                />
              </Link>
              <p className="text-xs font-bold text-amber-300 uppercase tracking-widest mt-1">
                Halal & Trusted Matrimony Platform
              </p>
            </div>
            
            <p className="text-slate-300 font-serif italic text-sm leading-relaxed max-w-sm mx-auto lg:mx-0">
              "And We created you in pairs." <br />
              <span className="not-italic font-sans text-[11px] text-rose-300 font-bold uppercase tracking-wider block mt-1">
                Most Trusted Halal Matchmaking Platform
              </span>
            </p>

            <div className="pt-2 flex items-center justify-center lg:justify-start gap-2.5 flex-wrap">
              <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 shadow-xs space-y-1.5">
                <p className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <span>📍</span> UP, India
                </p>
                <p className="text-[10px] font-bold text-amber-300 flex items-center gap-1.5">
                  <span>📞</span> Official Support Active
                </p>
              </div>
            </div>
          </div>

          {/* LINKS COLUMN */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-widest text-xs text-amber-300 flex items-center gap-1.5">
                <span>✨</span> Explore
              </h4>
              <ul className="space-y-2.5">
                {['About Us', 'Safety Tips', 'Contact Us'].map((item, i) => (
                  <li key={i}>
                    <a 
                      href={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-xs font-medium text-slate-300 hover:text-rose-400 hover:translate-x-1 transition-all block py-1"
                    >
                      › {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-widest text-xs text-amber-300 flex items-center gap-1.5">
                <span>🛡️</span> Trust & Legal
              </h4>
              <ul className="space-y-2.5">
                {['Terms Conditions', 'Privacy Policy'].map((item, i) => (
                  <li key={i}>
                    <a 
                      href={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-xs font-medium text-slate-300 hover:text-rose-400 hover:translate-x-1 transition-all block py-1"
                    >
                      › {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 col-span-2 sm:col-span-1">
              <h4 className="font-bold uppercase tracking-widest text-xs text-amber-300 flex items-center gap-1.5">
                <span>💌</span> Support
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <a href="/faq" className="text-xs font-medium text-slate-300 hover:text-rose-400 hover:translate-x-1 transition-all block py-1">
                    › FAQs
                  </a>
                </li>
              </ul>

              <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 shadow-xs space-y-1.5">
                <p className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <span>📍</span> Bareilly, UP, India
                </p>
                <p className="text-[10px] font-bold text-amber-300 flex items-center gap-1.5">
                  <span>📞</span> Official Support Active
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* COPYRIGHT BAR */}
        <div className="mt-14 pt-6 border-t border-slate-800 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            © 2026 Nikah Qubool • A PROUD DIGITAL PROPERTY OF IT CREATIVE SOLUTION
          </p>
        </div>
      </div>
    </footer>
  );
}
