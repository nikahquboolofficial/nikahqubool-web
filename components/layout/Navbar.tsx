"use client";

import React from 'react';
import Link from 'next/link';
import { useAuthModal } from '@/context/AuthModalContext';
import { LogIn, UserPlus } from 'lucide-react';

export default function Navbar() {
  const { openLoginModal, openRegisterModal } = useAuthModal();

  return (
    <nav className="fixed top-0 left-0 w-full h-18 sm:h-24 bg-white/95 backdrop-blur-xl flex items-center justify-between px-3 sm:px-6 lg:px-[6%] z-[1000] border-b border-slate-200 shadow-xs">
      
      {/* 👑 BRAND LOGO IMAGE */}
      <div className="flex items-center h-full py-1 shrink-0">
        <Link href="/" className="flex items-center gap-2 group">
          <img
            src="/nikah-qubool-logo.png"
            alt="Nikah Qubool Logo"
            className="h-11 sm:h-13 md:h-15 w-auto max-w-[210px] sm:max-w-[270px] object-contain object-left transition-transform duration-200 group-hover:scale-105"
          />
        </Link>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* HIDE REGISTER BUTTON ON MOBILE TO PREVENT OVERLAP (ONLY SHOW ON TABLET/DESKTOP) */}
        <button
          onClick={openRegisterModal}
          className="hidden sm:flex bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 text-[#d91b5c] px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-xs active:scale-95 transition-all cursor-pointer items-center gap-1.5"
        >
          <UserPlus size={15} className="hidden sm:inline-block" />
          <span>Register</span>
        </button>

        {/* LOGIN BUTTON ACTIVE ON BOTH MOBILE & DESKTOP */}
        <button
          onClick={openLoginModal}
          className="bg-[#d91b5c] hover:bg-rose-600 text-white font-extrabold px-4 sm:px-7 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs uppercase tracking-wider shadow-md shadow-rose-900/20 active:scale-95 transition-all cursor-pointer border border-rose-300/30 flex items-center gap-1.5"
        >
          <LogIn size={14} className="hidden sm:inline-block" />
          <span>Login</span>
        </button>
      </div>

    </nav>
  );
}