"use client";

import React, { useState, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
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
}

export default function CustomSelect({
  label, options = [], value, onChange, fieldName, errors, disabled = false, isPlainString = false, openUpward = false
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const hasError = errors.includes(fieldName);
  const filtered = (options || []).filter((o: MasterOption) => o.value?.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => { if (!isOpen) setSearch(""); }, [isOpen]);

  return (
    <div className={`flex flex-col gap-1.5 relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <label className={`text-[11px] font-extrabold uppercase tracking-wider ml-1 ${hasError ? 'text-rose-600' : 'text-slate-700'}`}>
        {label}
      </label>

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-3.5 bg-slate-50/80 hover:bg-white border-2 rounded-2xl text-xs font-semibold flex justify-between items-center cursor-pointer transition-all shadow-xs ${
          hasError 
            ? 'border-rose-500 bg-rose-50/40 text-rose-700' 
            : 'border-slate-300 focus:border-[#d91b5c] focus:ring-4 focus:ring-[#d91b5c]/10 text-slate-800'
        }`}
      >
        <span className={value ? 'text-slate-900 font-bold truncate' : 'text-slate-400 font-medium'}>
          {value || `Select ${label}...`}
        </span>
        <ChevronDown size={16} className={`text-slate-400 shrink-0 ml-2 transition-transform ${isOpen ? 'rotate-180 text-[#d91b5c]' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: openUpward ? -5 : 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: openUpward ? -5 : 5 }}
            className={`absolute z-[200] left-0 w-full bg-white rounded-2xl shadow-2xl border-2 border-rose-100 overflow-hidden ${
              openUpward ? 'bottom-[105%] top-auto' : 'top-[105%]'
            }`}
          >
            <div className="relative border-b-2 border-slate-100 bg-slate-50 p-2.5">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d91b5c]" />
              <input 
                className="w-full pl-9 pr-3 py-2 text-xs font-bold outline-none bg-white rounded-xl border border-slate-200 text-slate-800 focus:border-[#d91b5c]" 
                placeholder="Search options..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                onClick={(e) => e.stopPropagation()} 
              />
            </div>

            <div className="max-h-48 overflow-y-auto p-1">
              {filtered.length > 0 ? filtered.map((opt: MasterOption) => (
                <div
                  key={opt.id}
                  onClick={() => {
                    if (isPlainString) onChange(fieldName, opt.value);
                    else onChange(fieldName, opt.id, fieldName.replace('Id', 'Text'), opt.value);
                    setIsOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl hover:bg-rose-50 hover:text-[#d91b5c] text-xs font-bold cursor-pointer text-slate-700 transition-all"
                >
                  {opt.value}
                </div>
              )) : <div className="p-3 text-[11px] text-slate-400 text-center font-semibold">No options found</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
