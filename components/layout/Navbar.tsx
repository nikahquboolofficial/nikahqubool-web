"use client";

import React from 'react';
import Link from 'next/link';
import { LogIn, UserPlus } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full h-16 sm:h-20 md:h-22 bg-white/95 backdrop-blur-xl flex items-center justify-between px-3 sm:px-6 lg:px-[6%] z-[1000] border-b border-slate-200 shadow-xs">
      
      {/* 👑 BRAND LOGO IMAGE (COMPACT ON MOBILE SO BUTTONS HAVE MARGIN) */}
      <div className="flex items-center h-full py-1 shrink-0">
        <Link href="/" className="flex items-center gap-2 group">
          <img
            src="/nikah-qubool-logo.png"
            alt="Nikah Qubool Logo"
            className="h-8 sm:h-11 md:h-13 w-auto max-w-[140px] sm:max-w-[220px] md:max-w-[260px] object-contain object-left transition-transform duration-200 group-hover:scale-102"
          />
        </Link>
      </div>

      {/* ACTION BUTTONS: BOTH VISIBLE ON MOBILE & DESKTOP (CLEAN & COMPACT) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* REGISTER BUTTON */}
        <Link
          href="/login"
          className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[#d91b5c] px-2.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          <UserPlus size={13} className="shrink-0" />
          <span>Register</span>
        </Link>

        {/* LOGIN BUTTON */}
        <Link
          href="/login"
          className="flex items-center gap-1 bg-[#d91b5c] hover:bg-[#c21450] text-white font-bold px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs uppercase tracking-wider shadow-sm shadow-rose-900/20 active:scale-95 transition-all cursor-pointer border border-rose-300/30"
        >
          <LogIn size={13} className="shrink-0" />
          <span>Login</span>
        </Link>
      </div>

    </nav>
  );
}
