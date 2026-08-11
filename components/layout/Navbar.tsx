"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthModal } from '@/context/AuthModalContext';
import { LogIn, UserPlus } from 'lucide-react';

export default function Navbar() {
  const { openLoginModal, openRegisterModal } = useAuthModal();

  return (
    <nav className="fixed top-0 left-0 w-full h-22 sm:h-24 bg-white/95 backdrop-blur-xl flex items-center justify-between px-3 sm:px-6 lg:px-[6%] z-[1000] border-b-2 border-rose-100 shadow-md shadow-rose-950/5">
      
      {/* BRAND LOGO - PROMINENT & BOLD FOR MOBILE AND DESKTOP */}
      <div className="flex items-center h-full">
        <Link href="/" className="flex items-center h-full py-1">
          <Image
            src="/pakiza-rishte-website-logo-removebg-preview.png"
            alt="Pakiza Rishte Logo"
            width={280}
            height={90}
            priority
            className="h-16 sm:h-20 md:h-22 lg:h-24 w-auto object-contain scale-110 sm:scale-115 origin-left transition-transform filter drop-shadow-sm"
          />
        </Link>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={openRegisterModal}
          className="bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 text-[#870c3f] px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <UserPlus size={14} className="hidden sm:inline-block" />
          <span>Register</span>
        </button>

        <button
          onClick={openLoginModal}
          className="bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] hover:brightness-110 text-white font-black px-4 sm:px-7 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs uppercase tracking-wider shadow-md shadow-rose-900/20 active:scale-95 transition-all cursor-pointer border border-rose-300/30 flex items-center gap-1.5"
        >
          <LogIn size={14} className="hidden sm:inline-block" />
          <span>Login</span>
        </button>
      </div>
    </nav>
  );
}