"use client";

import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { MasterOption } from '@/lib/api';

interface RadioGroupSelectProps {
  label: string;
  options: MasterOption[];
  selectedValue: string | number;
  onChange: (id: number | string, textVal: string) => void;
  fieldName: string;
  errors?: string[];
  disabled?: boolean;
  isPlainString?: boolean;
}

export default function RadioGroupSelect({
  label,
  options = [],
  selectedValue,
  onChange,
  fieldName,
  errors = [],
  disabled = false,
  isPlainString = false
}: RadioGroupSelectProps) {
  const hasError = errors.includes(fieldName);

  return (
    <div className={`flex flex-col gap-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <label className={`text-[11px] font-extrabold uppercase tracking-wider ml-1 ${hasError ? 'text-rose-600' : 'text-slate-700'}`}>
        {label}
      </label>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((opt) => {
          const isSelected = isPlainString
            ? String(selectedValue) === String(opt.value)
            : Number(selectedValue) === Number(opt.id) || String(selectedValue) === String(opt.value);

          return (
            <motion.div
              key={opt.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                if (isPlainString) {
                  onChange(opt.value, opt.value);
                } else {
                  onChange(opt.id, opt.value);
                }
              }}
              className={`p-3 rounded-2xl border-2 text-xs font-black flex items-center justify-between cursor-pointer transition-all duration-200 select-none ${
                isSelected
                  ? 'bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] text-white border-rose-400 shadow-md shadow-rose-950/10'
                  : 'bg-slate-50/90 hover:bg-white text-slate-800 border-slate-200 hover:border-rose-300'
              }`}
            >
              <span className="truncate uppercase tracking-tight">{opt.value}</span>
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected ? 'bg-amber-400 border-amber-300 text-slate-950' : 'border-slate-300 bg-white'
                }`}
              >
                {isSelected && <Check size={11} className="stroke-[3]" />}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

