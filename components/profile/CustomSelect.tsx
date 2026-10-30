"use client";

import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MasterOption } from '@/lib/api';

interface CustomSelectProps {
  label: string;
  options: MasterOption[];
  value: string;
  onChange: any;
  fieldName: string;
  errors: string[];
  disabled?: boolean;
  isPlainString?: boolean;
  openUpward?: boolean;
  placeholder?: string;
}

export default function CustomSelect({
  label, 
  options = [], 
  value, 
  onChange, 
  fieldName, 
  errors, 
  disabled = false, 
  isPlainString = false, 
  placeholder
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const hasError = errors.includes(fieldName);
  const filtered = (options || []).filter((o: MasterOption) => 
    o?.value && String(o.value).toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => { 
    if (!isOpen) setSearch(""); 
  }, [isOpen]);

  // Lock body scroll when bottom sheet is open
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  const handleSelect = (opt: MasterOption) => {
    if (isPlainString) {
      onChange(fieldName, opt.value);
    } else {
      onChange(fieldName, opt.id, fieldName.replace('Id', 'Text'), opt.value);
    }
    setIsOpen(false);
  };

  return (
    <div className={`flex flex-col gap-1.5 relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <label className={`text-[11px] font-extrabold uppercase tracking-wider ml-0.5 ${hasError ? 'text-rose-600' : 'text-slate-700'}`}>
        {label}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className={`w-full px-4 py-3.5 bg-white hover:bg-slate-50/80 border-2 rounded-2xl text-xs font-bold flex justify-between items-center cursor-pointer transition-all outline-none ${
          hasError 
            ? 'border-rose-500 bg-rose-50/30 text-rose-700 shadow-sm' 
            : isOpen 
              ? 'border-[#e21e5b] ring-4 ring-[#e21e5b]/10 bg-white text-slate-900 shadow-md' 
              : 'border-slate-200/90 hover:border-slate-300 text-slate-800 shadow-xs'
        }`}
      >
        <span className={value ? 'text-slate-900 font-extrabold truncate' : 'text-slate-400 font-medium'}>
          {value || placeholder || `Select ${label.replace(/\s*\*$/, '')}...`}
        </span>
        <ChevronDown size={16} className={`text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#e21e5b]' : ''}`} />
      </button>

      {/* 📱 NATIVE APP-STYLE BOTTOM SHEET (MOBILE) / CENTERED DIALOG (DESKTOP) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
            
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsOpen(false)} 
              className="absolute inset-0 bg-black/60 backdrop-blur-xs" 
            />

            {/* Bottom Sheet Drawer on Mobile / Centered Modal on Desktop */}
            <motion.div 
              initial={{ y: '100%', opacity: 0.9 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: '100%', opacity: 0.9 }} 
              transition={{ type: 'spring', damping: 26, stiffness: 280 }} 
              className="relative bg-white rounded-t-[32px] sm:rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-3.5 z-10 max-h-[82vh] flex flex-col shadow-2xl border-t-2 sm:border border-rose-100 text-slate-800"
            >
              
              {/* Pull Bar (Mobile only) */}
              <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto sm:hidden cursor-pointer" onClick={() => setIsOpen(false)} />
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-serif font-extrabold uppercase text-[#e21e5b]">
                    Select {label.replace(/\s*\*$/, '')}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    Choose one option
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)} 
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Bar for > 4 options */}
              {(options || []).length > 4 && (
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Search ${label.replace(/\s*\*$/, '')}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-bold outline-none bg-slate-50 rounded-xl border border-slate-200 text-slate-800 focus:border-[#e21e5b] transition-colors"
                  />
                </div>
              )}

              {/* Options List */}
              <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-1 custom-scrollbar max-h-[55vh]">
                {filtered.length > 0 ? (
                  filtered.map((opt: MasterOption) => {
                    const isSelected = String(value).toLowerCase().trim() === String(opt.value).toLowerCase().trim();

                    return (
                      <div 
                        key={opt.id} 
                        onClick={() => handleSelect(opt)}
                        className={`p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${
                          isSelected 
                            ? 'border-[#e21e5b] bg-rose-50/70 text-[#e21e5b] font-black shadow-xs' 
                            : 'border-slate-200/90 hover:bg-slate-50 text-slate-700 font-semibold'
                        }`}
                      >
                        <span className="text-xs uppercase font-bold">{opt.value}</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? 'bg-[#e21e5b] text-white shadow-xs' : 'border-2 border-slate-300'
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                    No options match your search.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
