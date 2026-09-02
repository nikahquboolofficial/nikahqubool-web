"use client";

import React, { useState } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

interface Option {
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
  openUpward = false,
  hasError = false
}: CompactSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOpt = options.find(o => 
    String(o.id) === String(value) || 
    o.value.toLowerCase().trim() === String(value).toLowerCase().trim()
  );

  const filteredOptions = options.filter(o => o.value.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-1.5 text-left relative">
      {label && (
        <label className={`text-[11px] font-extrabold uppercase tracking-wider block ${hasError ? 'text-rose-600' : 'text-slate-700'}`}>
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border-2 rounded-2xl px-4 py-3.5 text-xs font-bold flex items-center justify-between outline-none transition-all cursor-pointer shadow-xs ${
          hasError 
            ? 'border-rose-500 bg-rose-50/40 text-rose-700' 
            : 'bg-slate-50 border-slate-300 focus:border-[#d91b5c] text-slate-900'
        }`}
      >
        <span className={selectedOpt ? "text-slate-900 font-extrabold" : "text-slate-400"}>
          {selectedOpt ? selectedOpt.value : placeholder}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-[#d91b5c]' : ''}`} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[600] bg-transparent" onClick={() => setIsOpen(false)} />
      )}

      {isOpen && (
        <div className={`absolute z-[650] left-0 right-0 ${openUpward ? 'bottom-full mb-2' : 'top-full mt-2'} bg-white border-2 border-rose-100 rounded-2xl shadow-2xl p-2.5 space-y-2 border-rose-200`}>
          {options.length > 5 && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#d91b5c]"
              />
            </div>
          )}

          <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs font-bold text-slate-400">No options found</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedOpt ? String(selectedOpt.id) === String(opt.id) : String(opt.id) === String(value);
                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-rose-50 text-[#d91b5c]' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{opt.value}</span>
                    {isSelected && <Check size={14} className="text-[#d91b5c]" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// MULTI-SELECT DROPDOWN WITH HIGH Z-INDEX & CHIPS
export function MultiSelectDropdown({ 
  label, 
  options = [], 
  selectedIds = [], 
  onChange, 
  placeholder = "Select Multiple...",
  openUpward = false
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

  return (
    <div className="space-y-2 text-left relative">
      {label && <label className="text-[11px] font-extrabold uppercase text-slate-700 block">{label}</label>}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 flex items-center justify-between outline-none focus:border-[#d91b5c] transition-all cursor-pointer"
      >
        <span className={selectedOptions.length > 0 ? "text-slate-900 font-extrabold" : "text-slate-400"}>
          {selectedOptions.length > 0 ? `${selectedOptions.length} Selected` : placeholder}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-[#d91b5c]' : ''}`} />
      </button>

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedOptions.map(opt => (
            <span
              key={opt.id}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-[#d91b5c] border border-rose-200 rounded-xl text-xs font-black shadow-2xs"
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

      {isOpen && (
        <div className="fixed inset-0 z-[600] bg-transparent" onClick={() => setIsOpen(false)} />
      )}

      {isOpen && (
        <div className={`absolute z-[650] left-0 right-0 ${openUpward ? 'bottom-full mb-2' : 'top-full mt-2'} bg-white border-2 border-rose-100 rounded-2xl shadow-2xl p-2.5 space-y-2 border-rose-200`}>
          {options.length > 5 && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#d91b5c]"
              />
            </div>
          )}

          <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs font-bold text-slate-400">No items found</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedIds.some(i => String(i) === String(opt.id));
                return (
                  <div
                    key={opt.id}
                    onClick={() => toggleOption(opt.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-rose-50 text-[#d91b5c]' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{opt.value}</span>
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${isSelected ? 'bg-[#d91b5c] border-[#d91b5c] text-white' : 'border-slate-300'}`}>
                      {isSelected && <Check size={10} className="stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CompactSelect;
