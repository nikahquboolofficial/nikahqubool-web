"use client";

import React from 'react';
import Link from 'next/link';
import { useAuthModal } from '@/context/AuthModalContext';
import { LogIn, UserPlus } from 'lucide-react';

export default function Navbar() {
  const { openLoginModal, openRegisterModal } = useAuthModal();

  return (
    <nav className="fixed top-0 left-0 w-full h-20 sm:h-24 bg-white/95 backdrop-blur-xl flex items-center justify-between px-3 sm:px-6 lg:px-[6%] z-[1000] border-b border-slate-200 shadow-xs">
      
      {/* 👑 STYLISH NIKAH QUBOOL TEXT BRAND LOGO */}
      <div className="flex items-center h-full">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif font-black text-2xl sm:text-3xl tracking-tight text-[#d91b5c]">
            Nikah Qubool
          </span>
        </Link>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={openRegisterModal}
          className="bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 text-[#d91b5c] px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <UserPlus size={14} className="hidden sm:inline-block" />
          <span>Register</span>
        </button>

        <button
          onClick={openLoginModal}
          className="bg-gradient-to-r from-[#d91b5c] to-rose-600 hover:brightness-110 text-white font-bold px-4 sm:px-7 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs uppercase tracking-wider shadow-md shadow-rose-900/20 active:scale-95 transition-all cursor-pointer border border-rose-300/30 flex items-center gap-1.5"
        >
          <LogIn size={14} className="hidden sm:inline-block" />
          <span>Login</span>
        </button>
      </div>
    </nav>
  );
}