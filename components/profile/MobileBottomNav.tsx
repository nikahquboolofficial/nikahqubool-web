"use client";

import React from 'react';
import { ChevronRight, Loader2, ArrowLeft } from 'lucide-react';

interface MobileBottomNavProps {
  currentSection: number;
  totalSections: number;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
}

export default function MobileBottomNav({ currentSection, totalSections, loading, onBack, onNext }: MobileBottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t-2 border-rose-100 px-5 py-4 z-[9999] shadow-2xl flex items-center gap-3">
      {currentSection > 1 && (
        <button 
          type="button" 
          onClick={onBack} 
          className="px-5 py-3.5 rounded-xl border-2 border-slate-300 text-slate-700 font-extrabold text-xs uppercase tracking-widest bg-slate-50 active:scale-95 transition-all shrink-0 cursor-pointer flex items-center gap-1"
        >
          <ArrowLeft size={15} />
          <span>Back</span>
        </button>
      )}
      <button 
        type="button" 
        onClick={onNext} 
        disabled={loading} 
        className="flex-1 py-3.5 bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-rose-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer border border-rose-300/30"
      >
        {loading ? (
          <Loader2 className="animate-spin text-amber-300" size={16} />
        ) : (
          <span>{currentSection === totalSections ? "Complete Profile" : "Save & Continue"}</span>
        )}
        {!loading && <ChevronRight size={16} className="text-amber-300" />}
      </button>
    </div>
  );
}