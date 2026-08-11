"use client";

import React, { useState } from 'react';
import { Camera, Lock, ChevronRight, CheckCircle2, Sparkles, ShieldAlert, Image as ImageIcon } from 'lucide-react';
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
    <div className="md:col-span-2 space-y-6 pb-20 md:pb-4">
      <input type="file" id="photo-file-picker" hidden accept="image/*" onChange={onRawSelect} />

      {/* ULTRA LUXURY PHOTO CONTAINER */}
      <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-b from-rose-50/40 via-white to-slate-50 border-2 border-dashed border-rose-200 shadow-md relative overflow-hidden">
        
        {/* GOLD DECORATIVE BADGE */}
        <div className="absolute top-3 right-3 px-3 py-1 bg-amber-400/15 border border-amber-400/30 rounded-full flex items-center gap-1.5">
          <Sparkles size={12} className="text-amber-600" />
          <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">HD Original Aspect</span>
        </div>

        {/* FULL PHOTO PREVIEW FRAME */}
        <div
          onClick={() => document.getElementById('photo-file-picker')?.click()}
          className={`relative w-44 sm:w-52 h-56 sm:h-64 rounded-3xl overflow-hidden border-4 shadow-xl cursor-pointer group flex items-center justify-center bg-slate-100 transition-all ${
            photoUrl ? 'border-[#870c3f] ring-4 ring-[#870c3f]/10' : 'border-slate-300'
          }`}
        >
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt="Profile Preview" 
              className="w-full h-full object-contain bg-slate-900 group-hover:scale-105 transition-transform duration-300" 
            />
          ) : (
            <div className="flex flex-col items-center text-slate-400 p-4 text-center">
              <div className="w-14 h-14 rounded-full bg-rose-50 border-2 border-rose-200 flex items-center justify-center text-[#870c3f] mb-2 shadow-xs group-hover:scale-110 transition-transform">
                <Camera size={26} />
              </div>
              <span className="text-xs font-black uppercase text-[#870c3f] tracking-wider mt-1">Upload Full Photo</span>
              <span className="text-[10px] font-medium text-slate-400 mt-1">Preserves full head-to-waist photo without cropping body</span>
            </div>
          )}

          {/* OVERLAY ON HOVER */}
          <div className="absolute inset-0 bg-[#870c3f]/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white font-bold text-xs gap-1.5 p-4 text-center">
            <ImageIcon size={24} className="text-amber-300" />
            <span>{photoUrl ? "Change / Re-upload Photo" : "Select Photo from Device"}</span>
          </div>
        </div>

        {/* ACTION BUTTON */}
        <button
          type="button"
          onClick={() => document.getElementById('photo-file-picker')?.click()}
          className="mt-5 px-7 py-3 rounded-full bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white text-xs font-black uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer border border-rose-300/30 flex items-center gap-2"
        >
          <Camera size={15} className="text-amber-300" />
          <span>{photoUrl ? "Change Photo" : "Choose Profile Photo"}</span>
        </button>

        {hasError && (
          <p className="text-xs font-bold text-rose-600 mt-3 flex items-center gap-1.5 bg-rose-50 px-4 py-2 rounded-xl border border-rose-200">
            <ShieldAlert size={15} />
            <span>Profile photo is mandatory for account verification.</span>
          </p>
        )}
      </div>

      {/* PRIVACY SETTING */}
      <div className="flex flex-col gap-1.5 relative">
        <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 ml-1">
          Photo Privacy Setting
        </label>
        
        <div 
          onClick={() => setIsOpen(!isOpen)} 
          className="px-5 py-4 bg-slate-50/80 border-2 border-slate-300 hover:bg-white rounded-2xl text-xs font-bold flex justify-between items-center cursor-pointer shadow-xs transition-all"
        >
          <div className="flex items-center gap-2.5">
            <Lock size={16} className="text-[#870c3f]" />
            <span className="text-slate-800">{privacyValue}</span>
          </div>
          <ChevronRight size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-90 text-[#870c3f]' : ''}`} />
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -5 }} 
              className="absolute z-[300] bottom-[105%] left-0 w-full bg-white rounded-2xl shadow-2xl border-2 border-rose-100 overflow-hidden p-1.5"
            >
              {privacyOptions.map((opt) => (
                <div 
                  key={opt} 
                  onClick={() => { onPrivacyChange(opt); setIsOpen(false); }} 
                  className={`px-4 py-3 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-between transition-all ${
                    privacyValue === opt 
                      ? 'bg-rose-50 text-[#870c3f] border border-rose-200' 
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>{opt}</span>
                  {privacyValue === opt && <CheckCircle2 size={16} className="text-[#870c3f]" />}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}