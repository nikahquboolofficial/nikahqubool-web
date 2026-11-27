"use client";

import React, { useState, useEffect } from "react";
import { getStoredUserPhoto } from "@/lib/auth";

interface ProfileAvatarLoaderProps {
  photoUrl?: string;
  message?: string;
  subMessage?: string;
}

export default function ProfileAvatarLoader({
  photoUrl,
  message = "Finding Best Matches For You",
  subMessage = "Connecting with verified halal matrimonial profiles...",
}: ProfileAvatarLoaderProps) {
  const [avatar, setAvatar] = useState<string>(() => {
    if (photoUrl && photoUrl.trim().length > 0 && !photoUrl.includes('placeholder') && !photoUrl.includes('default')) {
      return photoUrl;
    }
    if (typeof window !== "undefined") {
      try {
        const stored = getStoredUserPhoto();
        if (stored && stored.trim().length > 0 && !stored.includes('placeholder') && !stored.includes('default')) {
          return stored;
        }
      } catch (e) {}
    }
    return "";
  });

  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    if (!avatar && typeof window !== "undefined") {
      try {
        const stored = getStoredUserPhoto();
        if (stored && stored.trim().length > 0 && !stored.includes('placeholder') && !stored.includes('default')) {
          setAvatar(stored);
        }
      } catch (e) {}
    }
  }, [avatar]);

  const hasValidPhoto = Boolean(avatar && !imgFailed && !avatar.includes('placeholder') && !avatar.includes('default'));

  return (
    <div className="w-full flex items-center justify-center p-2" suppressHydrationWarning>
      {/* 🌟 3D ELEVATED LUXURY CARD */}
      <div className="w-full max-w-sm bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-[0_20px_50px_rgba(217,27,92,0.14)] flex flex-col items-center text-center relative overflow-hidden">
        {/* Subtle top rose shimmer accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#d91b5c] to-transparent opacity-80" />

        {/* 🌟 LUXURY AVATAR PULSE & SPIN RING */}
        <div className="relative flex items-center justify-center mt-2">
          {/* Outer Breathing Aura */}
          <div className="absolute w-26 h-26 rounded-full bg-rose-500/10 animate-ping pointer-events-none" />
          
          {/* Mid Soft Glow */}
          <div className="absolute w-22 h-22 rounded-full bg-rose-50 border border-rose-200/60 animate-pulse pointer-events-none" />

          {/* Spinning Gradient Ring */}
          <div className="absolute w-[82px] h-[82px] rounded-full border-2 border-transparent border-t-[#d91b5c] border-r-[#d91b5c]/70 animate-spin pointer-events-none" />

          {/* Inner Avatar or Brand Logo */}
          <div className="relative w-19 h-19 rounded-full overflow-hidden bg-white border-2 border-white shadow-md z-10 flex items-center justify-center" suppressHydrationWarning>
            {hasValidPhoto ? (
              <img
                src={avatar}
                alt="Profile loading"
                className="w-full h-full object-cover object-top"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <div className="w-full h-full bg-white flex items-center justify-center p-2.5">
                <img
                  src="/nikah-qubool-favicon.png"
                  alt="Nikah Qubool Logo"
                  className="w-11 h-11 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/nikah-qubool-logo.png";
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Brand & Loading Text */}
        <div className="mt-4 text-center space-y-1.5 z-10 max-w-xs">
          <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
            <span>{message}</span>
          </h4>
          {subMessage && (
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-relaxed">
              {subMessage}
            </p>
          )}
        </div>

        {/* Subtle animated dots */}
        <div className="flex items-center gap-1.5 mt-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[#d91b5c] animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#d91b5c] animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#d91b5c] animate-bounce" />
        </div>
      </div>
    </div>
  );
}
