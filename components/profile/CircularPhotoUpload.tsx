"use client";

import React, { useState } from 'react';
import { Camera, Lock, ChevronRight, CheckCircle2, Sparkles, ShieldAlert, Image as ImageIcon, UploadCloud, X } from 'lucide-react';
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

      {/* LUXURY WARM ROSE / IVORY PHOTO CONTAINER */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-rose-50/90 via-white to-[#FAF8F5] border-2 border-dashed border-rose-300 shadow-lg relative overflow-hidden transition-all hover:border-[#d91b5c]">
        
        {/* GOLD DECORATIVE BADGE */}
        <div className="sm:absolute sm:top-4 sm:right-4 mb-4 sm:mb-0 px-3.5 py-1.5 bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-400/40 rounded-full flex items-center gap-1.5 shadow-xs">
          <Sparkles size={13} className="text-amber-600 animate-pulse" />
          <span className="text-[11px] font-black text-amber-800 uppercase tracking-wider">HD Photo Verified</span>
        </div>

        {/* PHOTO PREVIEW FRAME */}
        <div
          onClick={() => document.getElementById('photo-file-picker')?.click()}
          className={`relative w-48 sm:w-56 h-60 sm:h-72 rounded-3xl overflow-hidden border-3 shadow-xl cursor-pointer group flex items-center justify-center bg-white transition-all transform hover:scale-[1.02] ${
            photoUrl ? 'border-[#d91b5c] ring-4 ring-[#d91b5c]/15' : 'border-rose-200 hover:border-[#d91b5c]'
          }`}
        >
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt="Profile Preview" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            />
          ) : (
            <div className="flex flex-col items-center text-slate-700 p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-50 border-2 border-rose-200 flex items-center justify-center text-[#d91b5c] mb-3 shadow-inner group-hover:scale-110 transition-transform">
                <Camera size={30} className="text-[#d91b5c]" />
              </div>
              <span className="text-xs font-black uppercase text-[#d91b5c] tracking-wider mt-1">Tap to Choose Photo</span>
              <span className="text-[11px] font-semibold text-slate-500 mt-1.5 leading-relaxed">
                Clear portrait or face photo (JPG, PNG, WEBP)
              </span>
            </div>
          )}

          {/* OVERLAY ON HOVER */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-[#d91b5c]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white font-black text-xs gap-2 p-4 text-center">
            <ImageIcon size={26} className="text-amber-300" />
            <span>{photoUrl ? "Change / Re-crop Photo" : "Browse from Gallery"}</span>
          </div>
        </div>

        {/* ACTION BUTTON */}
        <button
          type="button"
          onClick={() => document.getElementById('photo-file-picker')?.click()}
          className="mt-6 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] text-white text-xs font-black uppercase tracking-widest shadow-md shadow-rose-900/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer border border-rose-300/30 flex items-center gap-2.5"
        >
          <Camera size={16} className="text-amber-300" />
          <span>{photoUrl ? "Change Photo" : "Upload Profile Photo"}</span>
        </button>

        {hasError && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-bold text-rose-600 mt-4 flex items-center gap-2 bg-rose-50 px-5 py-3 rounded-2xl border border-rose-200 shadow-sm text-center"
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

        {/* Mobile Bottom Sheet Drawer */}
        <div className="sm:hidden">
          <AnimatePresence>
            {isOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[998] bg-black/60 backdrop-blur-xs"
                  onClick={() => setIsOpen(false)}
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 320 }}
                  className="fixed inset-x-0 bottom-0 z-[999] bg-white rounded-t-3xl max-h-[70vh] flex flex-col shadow-2xl border-t border-rose-100 overflow-hidden"
                >
                  <div className="pt-3 pb-1 flex justify-center cursor-pointer" onClick={() => setIsOpen(false)}>
                    <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
                  </div>
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#d91b5c]">Privacy</span>
                      <h3 className="text-base font-extrabold text-slate-900">Photo Visibility</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="p-3 space-y-2">
                    {privacyOptions.map((opt) => (
                      <div
                        key={opt}
                        onClick={() => { onPrivacyChange(opt); setIsOpen(false); }}
                        className={`px-4 py-3.5 rounded-2xl text-xs font-bold cursor-pointer flex items-center justify-between border ${
                          privacyValue === opt 
                            ? 'bg-rose-50 border-rose-300 text-[#d91b5c] font-black shadow-xs' 
                            : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="text-sm font-semibold">{opt}</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          privacyValue === opt ? 'border-[#d91b5c] bg-[#d91b5c]' : 'border-slate-300 bg-white'
                        }`}>
                          {privacyValue === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Dropdown */}
        <div className="hidden sm:block">
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
    </div>
  );
}
