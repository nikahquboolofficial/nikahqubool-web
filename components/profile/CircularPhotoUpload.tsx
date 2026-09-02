"use client";

import React, { useState } from 'react';
import { Camera, Lock, ChevronRight, CheckCircle2, Sparkles, ShieldAlert, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CircularPhotoUploadProps {
  photoUrl: string;
  privacyValue: string;
  hasError: boolean;
  onRawSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPrivacyChange: (val: string) => void;
}

export default function CircularPhotoUpload({ photoUrl, privacyValue, hasError, onRawSelect, onPrivacyChange }: CircularPhotoUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const privacyOptions = ["All Members", "Premium Only", "Only Approved"];

  return (
    <div className="md:col-span-2 space-y-6 pb-12 md:pb-4">
      <input type="file" id="photo-file-picker" hidden accept="image/*" onChange={onRawSelect} />

      {/* LUXURY HIGH-CONVERTING PHOTO CONTAINER */}
      <div className="flex flex-col items-center justify-center p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-rose-50/80 via-white to-amber-50/40 border-2 border-dashed border-rose-300/80 shadow-xl relative overflow-hidden transition-all hover:border-rose-400">
        
        {/* GOLD DECORATIVE BADGE */}
        <div className="absolute top-4 right-4 px-3.5 py-1.5 bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-400/40 rounded-full flex items-center gap-1.5 shadow-xs">
          <Sparkles size={13} className="text-amber-600 animate-pulse" />
          <span className="text-[11px] font-black text-amber-800 uppercase tracking-wider">HD WebP Fast Upload</span>
        </div>

        {/* FULL PHOTO PREVIEW FRAME */}
        <div
          onClick={() => document.getElementById('photo-file-picker')?.click()}
          className={`relative w-48 sm:w-56 h-60 sm:h-72 rounded-3xl overflow-hidden border-4 shadow-2xl cursor-pointer group flex items-center justify-center bg-slate-900 transition-all transform hover:scale-[1.02] ${
            photoUrl ? 'border-[#d91b5c] ring-4 ring-[#d91b5c]/20' : 'border-slate-300/80'
          }`}
        >
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt="Profile Preview" 
              className="w-full h-full object-contain bg-slate-950 group-hover:scale-105 transition-transform duration-300" 
            />
          ) : (
            <div className="flex flex-col items-center text-slate-300 p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border-2 border-rose-400/40 flex items-center justify-center text-[#d91b5c] mb-3 shadow-inner group-hover:scale-110 transition-transform">
                <UploadCloud size={32} />
              </div>
              <span className="text-xs font-black uppercase text-[#d91b5c] tracking-wider mt-1">Click to Select Photo</span>
              <span className="text-[11px] font-medium text-slate-400 mt-1.5 leading-relaxed">
                Upload clear full-face or head-to-waist photo (JPG, PNG, WEBP)
              </span>
            </div>
          )}

          {/* OVERLAY ON HOVER */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-[#d91b5c]/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white font-black text-xs gap-2 p-4 text-center">
            <ImageIcon size={28} className="text-amber-300 animate-bounce" />
            <span>{photoUrl ? "Click to Change / Re-crop Photo" : "Browse from Device"}</span>
          </div>
        </div>

        {/* ACTION BUTTON */}
        <button
          type="button"
          onClick={() => document.getElementById('photo-file-picker')?.click()}
          className="mt-6 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-900/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer border border-rose-300/30 flex items-center gap-2.5"
        >
          <Camera size={16} className="text-amber-300" />
          <span>{photoUrl ? "Change Selected Photo" : "Upload Profile Photo"}</span>
        </button>

        {hasError && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-bold text-rose-600 mt-4 flex items-center gap-2 bg-rose-50 px-5 py-3 rounded-2xl border border-rose-200 shadow-sm"
          >
            <ShieldAlert size={16} className="shrink-0 text-rose-600" />
            <span>Profile photo is mandatory to complete verification and receive marriage matches.</span>
          </motion.div>
        )}
      </div>

      {/* PRIVACY SETTING SELECTOR */}
      <div className="flex flex-col gap-2 relative">
        <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 ml-1 flex items-center gap-1.5">
          <Lock size={13} className="text-[#d91b5c]" />
          <span>Photo Privacy Setting</span>
        </label>
        
        <div 
          onClick={() => setIsOpen(!isOpen)} 
          className="px-5 py-4 bg-white border-2 border-slate-200 hover:border-rose-300 rounded-2xl text-xs font-bold flex justify-between items-center cursor-pointer shadow-sm transition-all"
        >
          <div className="flex items-center gap-2.5">
            <Lock size={16} className="text-[#d91b5c]" />
            <span className="text-slate-800">{privacyValue}</span>
          </div>
          <ChevronRight size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-90 text-[#d91b5c]' : ''}`} />
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -5 }} 
              className="absolute z-[300] bottom-[105%] left-0 w-full bg-white rounded-2xl shadow-2xl border-2 border-rose-100 overflow-hidden p-2"
            >
              {privacyOptions.map((opt) => (
                <div 
                  key={opt} 
                  onClick={() => { onPrivacyChange(opt); setIsOpen(false); }} 
                  className={`px-4 py-3 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-between transition-all ${
                    privacyValue === opt 
                      ? 'bg-rose-50 text-[#d91b5c] border border-rose-200' 
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>{opt}</span>
                  {privacyValue === opt && <CheckCircle2 size={16} className="text-[#d91b5c]" />}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
