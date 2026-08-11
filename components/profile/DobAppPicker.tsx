"use client";

import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface DobAppPickerProps {
  value: string;
  onChange: (dateStr: string) => void;
  hasError: boolean;
}

export default function DobAppPicker({ value, onChange, hasError }: DobAppPickerProps) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        setYear(parts[0]);
        setMonth(parts[1]);
        setDay(parts[2]);
      }
    }
  }, [value]);

  const months = [
    { id: '01', name: 'Jan' }, { id: '02', name: 'Feb' }, { id: '03', name: 'Mar' },
    { id: '04', name: 'Apr' }, { id: '05', name: 'May' }, { id: '06', name: 'Jun' },
    { id: '07', name: 'Jul' }, { id: '08', name: 'Aug' }, { id: '09', name: 'Sep' },
    { id: '10', name: 'Oct' }, { id: '11', name: 'Nov' }, { id: '12', name: 'Dec' }
  ];

  const days = Array.from({ length: 31 }, (_, i) => (i + 1 < 10 ? `0${i + 1}` : `${i + 1}`));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => `${currentYear - 18 - i}`);

  const handleSelect = (d: string, m: string, y: string) => {
    setDay(d);
    setMonth(m);
    setYear(y);
    if (d && m && y) onChange(`${y}-${m}-${d}`);
  };

  return (
    <div className="flex flex-col gap-1.5 md:col-span-2">
      <label className={`text-[11px] font-extrabold uppercase tracking-wider ml-1 flex items-center gap-1.5 ${hasError ? 'text-rose-600' : 'text-slate-700'}`}>
        <Calendar size={15} className="text-[#870c3f]" /> Birth Date (Age Verification)
      </label>

      <div className="grid grid-cols-3 gap-3">
        <select
          value={day}
          onChange={(e) => handleSelect(e.target.value, month, year)}
          className={`px-4 py-3.5 bg-slate-50/80 border-2 rounded-2xl text-xs font-bold text-slate-800 outline-none cursor-pointer transition-all shadow-xs ${
            hasError ? 'border-rose-500 bg-rose-50/40 text-rose-700' : 'border-slate-300 focus:border-[#870c3f] focus:bg-white'
          }`}
        >
          <option value="">Day</option>
          {days.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select
          value={month}
          onChange={(e) => handleSelect(day, e.target.value, year)}
          className={`px-4 py-3.5 bg-slate-50/80 border-2 rounded-2xl text-xs font-bold text-slate-800 outline-none cursor-pointer transition-all shadow-xs ${
            hasError ? 'border-rose-500 bg-rose-50/40 text-rose-700' : 'border-slate-300 focus:border-[#870c3f] focus:bg-white'
          }`}
        >
          <option value="">Month</option>
          {months.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>

        <select
          value={year}
          onChange={(e) => handleSelect(day, month, e.target.value)}
          className={`px-4 py-3.5 bg-slate-50/80 border-2 rounded-2xl text-xs font-bold text-slate-800 outline-none cursor-pointer transition-all shadow-xs ${
            hasError ? 'border-rose-500 bg-rose-50/40 text-rose-700' : 'border-slate-300 focus:border-[#870c3f] focus:bg-white'
          }`}
        >
          <option value="">Year</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  );
}