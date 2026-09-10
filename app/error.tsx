"use client";

import React, { useEffect } from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled App Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-[#d91b5c] selection:text-white font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#d91b5c]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-[#d91b5c] flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert size={32} />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-serif font-black text-white tracking-tight">
            Something Went Wrong
          </h2>
          <p className="text-xs font-semibold text-slate-400 leading-relaxed max-w-xs mx-auto">
            We encountered an unexpected issue while loading this page. Don't worry, your account data is completely safe.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <RefreshCw size={15} />
            <span>Try Again</span>
          </button>

          <button
            type="button"
            onClick={() => window.location.href = '/dashboard'}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Home size={15} />
            <span>Dashboard</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
