"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Building2, Mosque, Briefcase, Heart, Search, 
  ChevronRight, Compass, Grid
} from 'lucide-react';

interface DirectoryItem {
  name: string;
  slug: string;
  category: 'city' | 'sect' | 'profession' | 'status';
  icon: string;
}

function DirectoryContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'all' | 'city' | 'sect' | 'profession' | 'status') || 'all';

  const [activeTab, setActiveTab] = useState<'all' | 'city' | 'sect' | 'profession' | 'status'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  // Default Master Lists
  const defaultItems: DirectoryItem[] = [
    // Cities
    { name: 'Delhi NCR', slug: 'sunni-rishte-in-delhi', category: 'city', icon: '📍' },
    { name: 'Bareilly', slug: 'sunni-rishte-in-bareilly', category: 'city', icon: '📍' },
    { name: 'Lucknow', slug: 'syed-rishte-in-lucknow', category: 'city', icon: '📍' },
    { name: 'Mumbai', slug: 'muslim-matrimony-in-mumbai', category: 'city', icon: '📍' },
    { name: 'Hyderabad', slug: 'deobandi-matrimony-in-hyderabad', category: 'city', icon: '📍' },
    { name: 'Noida', slug: 'muslim-matrimony-in-noida', category: 'city', icon: '📍' },
    { name: 'Kanpur', slug: 'muslim-matrimony-in-kanpur', category: 'city', icon: '📍' },
    { name: 'Aligarh', slug: 'muslim-matrimony-in-aligarh', category: 'city', icon: '📍' },
    { name: 'Moradabad', slug: 'muslim-matrimony-in-moradabad', category: 'city', icon: '📍' },
    { name: 'Agra', slug: 'muslim-matrimony-in-agra', category: 'city', icon: '📍' },
    { name: 'Patna', slug: 'muslim-matrimony-in-patna', category: 'city', icon: '📍' },
    { name: 'Bhopal', slug: 'muslim-matrimony-in-bhopal', category: 'city', icon: '📍' },
    
    // Sects
    { name: 'Sunni Hanafi', slug: 'sunni-rishte-in-delhi', category: 'sect', icon: '🕌' },
    { name: 'Syed Proposals', slug: 'syed-rishte-in-lucknow', category: 'sect', icon: '👑' },
    { name: 'Shia Matrimony', slug: 'shia-rishte-in-mumbai', category: 'sect', icon: '🕌' },
    { name: 'Deobandi Community', slug: 'deobandi-matrimony-in-hyderabad', category: 'sect', icon: '🕌' },
    { name: 'Barelvi Rishte', slug: 'barelvi-rishte-in-bareilly', category: 'sect', icon: '🕌' },
    { name: 'Pathan Proposals', slug: 'pathan-rishte-in-noida', category: 'sect', icon: '✨' },
    { name: 'Ansari Rishte', slug: 'ansari-rishte-in-kanpur', category: 'sect', icon: '✨' },
    { name: 'Siddiqui Proposals', slug: 'siddiqui-rishte-in-delhi', category: 'sect', icon: '✨' },

    // Professions
    { name: 'Muslim Doctor Rishte', slug: 'muslim-doctor-rishte', category: 'profession', icon: '🩺' },
    { name: 'Muslim Engineers', slug: 'muslim-engineer-rishte', category: 'profession', icon: '💻' },
    { name: 'Software Developers', slug: 'muslim-software-engineer-rishte', category: 'profession', icon: '⚡' },
    { name: 'Chartered Accountants (CA)', slug: 'muslim-ca-rishte', category: 'profession', icon: '📊' },
    { name: 'Advocates & Legal Pros', slug: 'muslim-advocate-rishte', category: 'profession', icon: '⚖️' },
    { name: 'Professors & Teachers', slug: 'muslim-teacher-rishte', category: 'profession', icon: '🎓' },
    { name: 'Business Owners', slug: 'muslim-business-rishte', category: 'profession', icon: '💼' },

    // Status
    { name: 'Never Married', slug: 'sunni-rishte-in-delhi', category: 'status', icon: '💍' },
    { name: 'Divorced / Second Nikah', slug: 'muslim-matrimony-in-mumbai', category: 'status', icon: '🤝' },
    { name: 'Widowed Proposals', slug: 'syed-rishte-in-lucknow', category: 'status', icon: '🕊️' },
  ];

  const [allItems, setAllItems] = useState<DirectoryItem[]>(defaultItems);

  useEffect(() => {
    async function fetchMasterData() {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.nikahqubool.in/api';
      try {
        const [cityRes, sectRes, profRes] = await Promise.allSettled([
          fetch(`${apiUrl}/Master/CITIES`),
          fetch(`${apiUrl}/Master/SECT`),
          fetch(`${apiUrl}/Master/PROFESSION`),
        ]);

        const combined: DirectoryItem[] = [];

        if (cityRes.status === 'fulfilled' && cityRes.value.ok) {
          const data = await cityRes.value.json();
          const raw = data?.data || data?.Data || [];
          if (Array.isArray(raw) && raw.length > 0) {
            raw.forEach((item: any) => {
              const val = item.value || item.Value || item.cityName || item.CityName || '';
              if (val) {
                const slugStr = val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                combined.push({
                  name: val,
                  slug: `muslim-matrimony-in-${slugStr}`,
                  category: 'city',
                  icon: '📍',
                });
              }
            });
          }
        }

        if (sectRes.status === 'fulfilled' && sectRes.value.ok) {
          const data = await sectRes.value.json();
          const raw = data?.data || data?.Data || [];
          if (Array.isArray(raw) && raw.length > 0) {
            raw.forEach((item: any) => {
              const val = item.value || item.Value || '';
              if (val) {
                const slugStr = val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                combined.push({
                  name: val.toLowerCase().includes('rishte') || val.toLowerCase().includes('matrimony') ? val : `${val} Community`,
                  slug: `${slugStr}-rishte-in-delhi`,
                  category: 'sect',
                  icon: '🕌',
                });
              }
            });
          }
        }

        if (profRes.status === 'fulfilled' && profRes.value.ok) {
          const data = await profRes.value.json();
          const raw = data?.data || data?.Data || [];
          if (Array.isArray(raw) && raw.length > 0) {
            raw.forEach((item: any) => {
              const val = item.value || item.Value || '';
              if (val) {
                const slugStr = val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                combined.push({
                  name: val.toLowerCase().startsWith('muslim') ? val : `Muslim ${val} Proposals`,
                  slug: `muslim-${slugStr}-rishte`,
                  category: 'profession',
                  icon: '💼',
                });
              }
            });
          }
        }

        if (combined.length > 0) {
          const defaultStatus: DirectoryItem[] = [
            { name: 'Never Married', slug: 'sunni-rishte-in-delhi', category: 'status', icon: '💍' },
            { name: 'Divorced / Second Nikah', slug: 'muslim-matrimony-in-mumbai', category: 'status', icon: '🤝' },
            { name: 'Widowed Proposals', slug: 'syed-rishte-in-lucknow', category: 'status', icon: '🕊️' },
          ];
          setAllItems([...combined, ...defaultStatus]);
        }
      } catch (e) {
        // Fallback
      }
    }

    fetchMasterData();
  }, []);

  const filteredItems = allItems.filter((item) => {
    const matchesTab = activeTab === 'all' || item.category === activeTab;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-[#d91b5c] selection:text-white">
      
      {/* HERO BANNER */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950 text-white py-14 md:py-20 px-4 sm:px-6 lg:px-[8%] relative overflow-hidden text-center border-b-4 border-[#d91b5c]">
        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-500/20 text-rose-300 font-extrabold text-xs uppercase tracking-widest border border-rose-500/30">
            <Compass size={14} className="text-amber-400" /> Complete Matrimonial Index
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-white">
            Nikah Qubool <span className="text-amber-300 italic font-normal">All Categories Directory</span>
          </h1>
          <p className="text-slate-300 text-xs sm:text-base max-w-2xl mx-auto font-medium leading-relaxed">
            Browse all cities, sects, and professions across India. Click any link to view 100% verified proposals.
          </p>
        </div>
      </div>

      {/* SEARCH & CATEGORY FILTER BAR */}
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-[8%] space-y-8">
        
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
          
          {/* SEARCH INPUT */}
          <div className="relative max-w-2xl mx-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any city, sect (Sunni/Shia/Syed), or profession (Doctor/Engineer)..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 outline-none focus:border-[#d91b5c] focus:ring-4 focus:ring-rose-100 transition-all shadow-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold bg-slate-200 hover:bg-slate-300 px-2.5 py-1 rounded-full cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* TAB BUTTONS */}
          <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
            {[
              { id: 'all', label: `All Categories (${allItems.length})`, icon: Grid },
              { id: 'city', label: 'Cities / Locations', icon: Building2 },
              { id: 'sect', label: 'Sects / Maslaks', icon: Mosque },
              { id: 'profession', label: 'Professions', icon: Briefcase },
              { id: 'status', label: 'Marital Status', icon: Heart },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#d91b5c] text-white shadow-md shadow-rose-900/20 scale-105'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-amber-300' : 'text-slate-500'} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

        </div>

        {/* ITEMS GRID (PLAIN NATIVE HTML LINKS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => (
              <a
                key={idx}
                href={`/matrimony/${item.slug}`}
                className="group bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-200/80 hover:border-[#d91b5c] shadow-xs hover:shadow-lg transition-all duration-300 flex items-center justify-between gap-3 transform hover:-translate-y-1 cursor-pointer block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-serif font-extrabold text-sm text-slate-900 group-hover:text-[#d91b5c] transition-colors line-clamp-1 capitalize">
                      {item.name}
                    </h4>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500 mt-0.5">
                      {item.category} matrimony
                    </p>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-[#d91b5c] group-hover:text-white text-slate-500 flex items-center justify-center transition-colors shrink-0">
                  <ChevronRight size={16} />
                </div>
              </a>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-slate-200 space-y-3">
              <p className="text-base font-extrabold text-slate-700">No categories found matching "{searchQuery}"</p>
              <button 
                onClick={() => { setSearchQuery(''); setActiveTab('all'); }}
                className="px-5 py-2 rounded-full bg-[#d91b5c] text-[#ffffff] font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

export default function MatrimonyDirectoryIndexPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 py-20 text-center font-bold text-slate-500">Loading Directory...</div>}>
      <DirectoryContent />
    </Suspense>
  );
}
