"use client";

import React, { useState, useEffect } from "react";
import { HeartHandshake } from "lucide-react";
import { getStoredUserPhoto } from "@/lib/auth";

interface ProfileAvatarLoaderProps {
  photoUrl?: string;
  message?: string;
  subMessage?: string;
}

export default function ProfileAvatarLoader({
  photoUrl,
  message = "Loading your profile...",
  subMessage = "Please wait a moment",
}: ProfileAvatarLoaderProps) {
  const [mounted, setMounted] = useState(false);
  const [avatar, setAvatar] = useState<string>(photoUrl && photoUrl.trim().length > 0 ? photoUrl : "");

  useEffect(() => {
    setMounted(true);
    if (!avatar) {
      const stored = getStoredUserPhoto();
      if (stored) setAvatar(stored);
    }
  }, [avatar]);

  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center p-6 bg-white selection:bg-[#d91b5c] selection:text-white" suppressHydrationWarning>
      {/* 🌟 LUXURY AVATAR PULSE & SPIN RING */}
      <div className="relative flex items-center justify-center">
        {/* Outer Breathing Aura */}
        <div className="absolute w-28 h-28 rounded-full bg-rose-500/10 animate-ping pointer-events-none" />
        
        {/* Mid Soft Glow */}
        <div className="absolute w-24 h-24 rounded-full bg-rose-50 border border-rose-200/60 animate-pulse pointer-events-none" />

        {/* Spinning Gradient Ring */}
        <div className="absolute w-[86px] h-[86px] rounded-full border-2 border-transparent border-t-[#d91b5c] border-r-[#d91b5c]/70 animate-spin pointer-events-none" />

        {/* Inner Avatar Image */}
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-md z-10 flex items-center justify-center" suppressHydrationWarning>
          {mounted && avatar && !avatar.includes('placeholder') && !avatar.includes('default') ? (
            <img
              src={avatar}
              alt="Profile loading"
              className="w-full h-full object-cover object-top"
              onError={() => setAvatar("")}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-rose-50 via-white to-rose-100 flex flex-col items-center justify-center p-2 text-[#d91b5c]">
              <HeartHandshake size={30} className="stroke-[2] text-[#d91b5c] animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-wider text-[#d91b5c] mt-0.5">Nikah Qubool</span>
            </div>
          )}
        </div>
      </div>

      {/* Brand & Loading Text */}
      <div className="mt-5 text-center space-y-1 z-10">
        <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
          <span>{message}</span>
        </h4>
        {subMessage && (
          <p className="text-xs text-slate-500 font-medium">
            {subMessage}
          </p>
        )}
      </div>

      {/* Subtle bottom dots */}
      <div className="flex items-center gap-1.5 mt-3">
        <div className="w-1.5 h-1.5 rounded-full bg-[#d91b5c] animate-bounce [animation-delay:-0.3s]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#d91b5c] animate-bounce [animation-delay:-0.15s]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#d91b5c] animate-bounce" />
      </div>
    </div>
  );
}
