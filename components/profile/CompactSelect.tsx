"use client";

import React, { useState, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Option {
  id: number | string;
  value: string;
}

interface CompactSelectProps {
  label?: string;
  options: Option[];
  value: number | string;
  onChange: (val: number | string) => void;
  placeholder?: string;
  openUpward?: boolean;
  hasError?: boolean;
}

export function CompactSelect({ 
  label, 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select Option...", 
  hasError = false
}: CompactSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOpt = options.find(o => 
    String(o.id) === String(value) || 
    (o.value && String(o.value).toLowerCase().trim() === String(value).toLowerCase().trim())
  );

  const filteredOptions = options.filter(o => 
    o?.value && o.value.toLowerCase().includes(search.toLowerCase())
  );

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setSearch("");
  }, [isOpen]);

  return (
    <div className="space-y-1.5 text-left relative">
      {label && (
        <label className={`text-[11px] font-extrabold uppercase tracking-wider block ${hasError ? 'text-rose-600' : 'text-slate-700'}`}>
          {label}
        </label>
      )}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full border-2 rounded-2xl px-4 py-3.5 text-xs font-bold flex items-center justify-between outline-none transition-all cursor-pointer shadow-xs ${
          hasError 
            ? 'border-rose-500 bg-rose-50/40 text-rose-700' 
            : 'bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-slate-300 text-slate-800'
        }`}
      >
        <span className={selectedOpt ? "text-slate-900 font-extrabold truncate" : "text-slate-400 font-medium"}>
          {selectedOpt ? selectedOpt.value : placeholder}
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
              
              {/* Sheet Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-serif font-extrabold uppercase text-[#e21e5b]">
                    {label ? `Select ${label.replace(/\s*\*$/, '')}` : 'Select Option'}
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

              {/* Search Bar for > 4 items */}
              {options.length > 4 && (
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Search options...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-bold outline-none bg-slate-50 rounded-xl border border-slate-200 text-slate-800 focus:border-[#e21e5b] transition-colors"
                  />
                </div>
              )}

              {/* Options List */}
              <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-1 custom-scrollbar max-h-[55vh]">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt) => {
                    const isSelected = selectedOpt 
                      ? String(selectedOpt.id) === String(opt.id) 
                      : String(opt.id) === String(value);

                    return (
                      <div 
                        key={opt.id} 
                        onClick={() => {
                          onChange(opt.id);
                          setIsOpen(false);
                        }}
                        className={`p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${
                          isSelected 
                            ? 'border-[#e21e5b] bg-rose-50/70 text-[#e21e5b] font-black shadow-xs' 
                            : 'border-slate-200/90 hover:bg-slate-50 text-slate-700 font-semibold'
                        }`}
                      >
                        <span className="text-xs uppercase">{opt.value}</span>
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

// MULTI-SELECT DROPDOWN WITH BOTTOM SHEET & CHIPS
export function MultiSelectDropdown({ 
  label, 
  options = [], 
  selectedIds = [], 
  onChange, 
  placeholder = "Select Multiple..."
}: { 
  label?: string; 
  options: Option[]; 
  selectedIds: (number | string)[]; 
  onChange: (ids: (number | string)[]) => void; 
  placeholder?: string; 
  openUpward?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOptions = options.filter(o => selectedIds.some(id => String(id) === String(o.id)));
  const filteredOptions = options.filter(o => o.value.toLowerCase().includes(search.toLowerCase()));

  const toggleOption = (id: number | string) => {
    const exists = selectedIds.some(i => String(i) === String(id));
    if (exists) {
      onChange(selectedIds.filter(i => String(i) !== String(id)));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeChip = (id: number | string) => {
    onChange(selectedIds.filter(i => String(i) !== String(id)));
  };

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setSearch("");
  }, [isOpen]);

  return (
    <div className="space-y-2 text-left relative">
      {label && <label className="text-[11px] font-extrabold uppercase text-slate-700 block">{label}</label>}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full bg-white hover:bg-slate-50/80 border-2 border-slate-200/90 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-900 flex items-center justify-between outline-none focus:border-[#e21e5b] transition-all cursor-pointer shadow-xs"
      >
        <span className={selectedOptions.length > 0 ? "text-slate-900 font-extrabold" : "text-slate-400 font-medium"}>
          {selectedOptions.length > 0 ? `${selectedOptions.length} Selected` : placeholder}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-[#e21e5b]' : ''}`} />
      </button>

      {/* Selected Chips */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedOptions.map(opt => (
            <span
              key={opt.id}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-[#e21e5b] border border-rose-200 rounded-xl text-xs font-black shadow-2xs"
            >
              <span>{opt.value}</span>
              <button
                type="button"
                onClick={() => removeChip(opt.id)}
                className="hover:bg-rose-200 p-0.5 rounded-md cursor-pointer transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 📱 NATIVE APP-STYLE MULTI-SELECT BOTTOM SHEET (MOBILE) / CENTERED DIALOG (DESKTOP) */}
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
                    {label ? `Select ${label.replace(/\s*\*$/, '')}` : 'Select Options'}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    {selectedOptions.length > 0 ? `${selectedOptions.length} Selected (Multi-select allowed)` : 'Multi-select allowed'}
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

              {/* Search Bar for > 4 items */}
              {options.length > 4 && (
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Search items...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-bold outline-none bg-slate-50 rounded-xl border border-slate-200 text-slate-800 focus:border-[#e21e5b] transition-colors"
                  />
                </div>
              )}

              {/* Options List */}
              <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-1 custom-scrollbar max-h-[48vh]">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt) => {
                    const isSelected = selectedIds.some(i => String(i) === String(opt.id));

                    return (
                      <div 
                        key={opt.id} 
                        onClick={() => toggleOption(opt.id)}
                        className={`p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-[#e21e5b] bg-rose-50/70 text-[#e21e5b] font-black shadow-xs' 
                            : 'border-slate-200/90 hover:bg-slate-50 text-slate-700 font-semibold'
                        }`}
                      >
                        <span className="text-xs uppercase">{opt.value}</span>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'bg-[#e21e5b] border-[#e21e5b] text-white shadow-xs' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                    No items match your search.
                  </div>
                )}
              </div>

              {/* Done Button (Required for Multi-Select to confirm multiple choices) */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-3.5 bg-gradient-to-r from-slate-950 via-[#0f0f0f] to-slate-950 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer text-center flex items-center justify-center gap-2"
              >
                <span>Done</span>
                {selectedOptions.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#e21e5b] text-white text-[10px] font-black">
                    {selectedOptions.length} Selected
                  </span>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CompactSelect;
