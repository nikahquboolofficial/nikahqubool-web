"use client";

import React, { useState, useEffect } from 'react';
import { 
  Building2, Mosque, Briefcase, Heart, Search, 
  ChevronRight, Sparkles, Compass, ArrowRight
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
  count: string;
}

export default function BrowseProfilesSection() {
  const [activeTab, setActiveTab] = useState<'city' | 'sect' | 'profession' | 'status'>('city');
  const [searchQuery, setSearchQuery] = useState('');

  // Default Top Featured Items
  const defaultCities: CategoryItem[] = [
    { id: '1', name: 'Delhi NCR', slug: 'sunni-rishte-in-delhi', icon: '📍', count: '1,420+ Proposals' },
    { id: '2', name: 'Bareilly', slug: 'sunni-rishte-in-bareilly', icon: '📍', count: '980+ Proposals' },
    { id: '3', name: 'Lucknow', slug: 'syed-rishte-in-lucknow', icon: '📍', count: '1,150+ Proposals' },
    { id: '4', name: 'Mumbai', slug: 'muslim-matrimony-in-mumbai', icon: '📍', count: '1,650+ Proposals' },
    { id: '5', name: 'Hyderabad', slug: 'deobandi-matrimony-in-hyderabad', icon: '📍', count: '1,890+ Proposals' },
    { id: '6', name: 'Noida', slug: 'muslim-matrimony-in-noida', icon: '📍', count: '740+ Proposals' },
    { id: '7', name: 'Kanpur', slug: 'muslim-matrimony-in-kanpur', icon: '📍', count: '620+ Proposals' },
    { id: '8', name: 'Aligarh', slug: 'muslim-matrimony-in-aligarh', icon: '📍', count: '890+ Proposals' },
    { id: '9', name: 'Moradabad', slug: 'muslim-matrimony-in-moradabad', icon: '📍', count: '550+ Proposals' },
    { id: '10', name: 'Agra', slug: 'muslim-matrimony-in-agra', icon: '📍', count: '480+ Proposals' },
    { id: '11', name: 'Patna', slug: 'muslim-matrimony-in-patna', icon: '📍', count: '510+ Proposals' },
    { id: '12', name: 'Bhopal', slug: 'muslim-matrimony-in-bhopal', icon: '📍', count: '630+ Proposals' },
  ];

  const defaultSects: CategoryItem[] = [
    { id: '1', name: 'Sunni Hanafi', slug: 'sunni-rishte-in-delhi', icon: '🕌', count: '3,800+ Proposals' },
    { id: '2', name: 'Syed Proposals', slug: 'syed-rishte-in-lucknow', icon: '👑', count: '2,100+ Proposals' },
    { id: '3', name: 'Shia Matrimony', slug: 'shia-rishte-in-mumbai', icon: '🕌', count: '1,250+ Proposals' },
    { id: '4', name: 'Deobandi Community', slug: 'deobandi-matrimony-in-hyderabad', icon: '🕌', count: '1,950+ Proposals' },
    { id: '5', name: 'Barelvi Rishte', slug: 'barelvi-rishte-in-bareilly', icon: '🕌', count: '1,720+ Proposals' },
    { id: '6', name: 'Pathan Proposals', slug: 'pathan-rishte-in-noida', icon: '✨', count: '1,100+ Proposals' },
    { id: '7', name: 'Ansari Rishte', slug: 'ansari-rishte-in-kanpur', icon: '✨', count: '980+ Proposals' },
    { id: '8', name: 'Siddiqui Proposals', slug: 'siddiqui-rishte-in-delhi', icon: '✨', count: '1,340+ Proposals' },
  ];

  const defaultProfessions: CategoryItem[] = [
    { id: '1', name: 'Muslim Doctor Rishte', slug: 'muslim-doctor-rishte', icon: '🩺', count: '850+ Doctors' },
    { id: '2', name: 'Muslim Engineers', slug: 'muslim-engineer-rishte', icon: '💻', count: '1,620+ Engineers' },
    { id: '3', name: 'Software Developers', slug: 'muslim-software-engineer-rishte', icon: '⚡', count: '1,240+ IT Pros' },
    { id: '4', name: 'Chartered Accountants (CA)', slug: 'muslim-ca-rishte', icon: '📊', count: '430+ CAs' },
    { id: '5', name: 'Advocates & Legal Pros', slug: 'muslim-advocate-rishte', icon: '⚖️', count: '310+ Lawyers' },
    { id: '6', name: 'Professors & Teachers', slug: 'muslim-teacher-rishte', icon: '🎓', count: '760+ Teachers' },
    { id: '7', name: 'Business Owners', slug: 'muslim-business-rishte', icon: '💼', count: '1,490+ Business' },
  ];

  const defaultStatus: CategoryItem[] = [
    { id: '1', name: 'Never Married', slug: 'sunni-rishte-in-delhi', icon: '💍', count: '8,500+ Proposals' },
    { id: '2', name: 'Divorced / Second Nikah', slug: 'muslim-matrimony-in-mumbai', icon: '🤝', count: '1,120+ Proposals' },
    { id: '3', name: 'Widowed Proposals', slug: 'syed-rishte-in-lucknow', icon: '🕊️', count: '480+ Proposals' },
  ];

  const [citiesList, setCitiesList] = useState<CategoryItem[]>(defaultCities);
  const [sectsList, setSectsList] = useState<CategoryItem[]>(defaultSects);
  const [professionsList, setProfessionsList] = useState<CategoryItem[]>(defaultProfessions);
  const [statusList] = useState<CategoryItem[]>(defaultStatus);

  // FETCH DYNAMIC MASTER DATA FROM BACKEND API
  useEffect(() => {
    async function fetchMasterData() {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.nikahqubool.in/api';
      try {
        const [cityRes, sectRes, profRes] = await Promise.allSettled([
          fetch(`${apiUrl}/Master/CITIES`),
          fetch(`${apiUrl}/Master/SECT`),
          fetch(`${apiUrl}/Master/PROFESSION`),
        ]);

        if (cityRes.status === 'fulfilled' && cityRes.value.ok) {
          const data = await cityRes.value.json();
          const raw = data?.data || data?.Data || [];
          if (Array.isArray(raw) && raw.length > 0) {
            const formatted = raw.map((item: any, i: number) => {
              const val = item.value || item.Value || item.cityName || item.CityName || '';
              const slugStr = val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              return {
                id: `c-${i}`,
                name: val,
                slug: `muslim-matrimony-in-${slugStr}`,
                icon: '📍',
                count: 'Verified Proposals',
              };
            });
            setCitiesList(formatted);
          }
        }

        if (sectRes.status === 'fulfilled' && sectRes.value.ok) {
          const data = await sectRes.value.json();
          const raw = data?.data || data?.Data || [];
          if (Array.isArray(raw) && raw.length > 0) {
            const formatted = raw.map((item: any, i: number) => {
              const val = item.value || item.Value || '';
              const slugStr = val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              return {
                id: `s-${i}`,
                name: val.toLowerCase().includes('rishte') || val.toLowerCase().includes('matrimony') ? val : `${val} Community`,
                slug: `${slugStr}-rishte-in-delhi`,
                icon: '🕌',
                count: 'Active Proposals',
              };
            });
            setSectsList(formatted);
          }
        }

        if (profRes.status === 'fulfilled' && profRes.value.ok) {
          const data = await profRes.value.json();
          const raw = data?.data || data?.Data || [];
          if (Array.isArray(raw) && raw.length > 0) {
            const formatted = raw.map((item: any, i: number) => {
              const val = item.value || item.Value || '';
              const slugStr = val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              return {
                id: `p-${i}`,
                name: val.toLowerCase().startsWith('muslim') ? val : `Muslim ${val} Proposals`,
                slug: `muslim-${slugStr}-rishte`,
                icon: '💼',
                count: 'Verified Professionals',
              };
            });
            setProfessionsList(formatted);
          }
        }
      } catch (e) {
        // Fallback
      }
    }

    fetchMasterData();
  }, []);

  const categoryMap = {
    city: citiesList,
    sect: sectsList,
    profession: professionsList,
    status: statusList,
  };

  const tabs = [
    { id: 'city', label: 'By City / Location', icon: Building2 },
    { id: 'sect', label: 'By Sect / Maslak', icon: Mosque },
    { id: 'profession', label: 'By Profession', icon: Briefcase },
    { id: 'status', label: 'By Marital Status', icon: Heart },
  ] as const;

  const currentTabItems = categoryMap[activeTab];
  const filteredItems = currentTabItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const MAX_HOMEPAGE_ITEMS = 12;
  const displayedItems = searchQuery ? filteredItems : filteredItems.slice(0, MAX_HOMEPAGE_ITEMS);
  const hasMoreItems = currentTabItems.length > MAX_HOMEPAGE_ITEMS;

  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-[8%] bg-gradient-to-b from-slate-50 via-white to-rose-50/40 text-slate-900 border-t border-slate-200">
      
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-100/80 text-[#d91b5c] font-black text-xs uppercase tracking-widest border border-rose-200 shadow-xs">
            <Compass size={14} className="text-[#d91b5c]" /> Explore Matchmaking Directory
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-slate-900">
            Browse Matrimonial Profiles <span className="text-[#d91b5c] italic font-normal">by Category</span>
          </h2>
          <p className="text-slate-600 font-semibold text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Discover verified Muslim brides and grooms categorized by preferred cities, maslaks, professions, and marital status across India.
          </p>
        </div>

        {/* TABS & SEARCH BAR */}
        <div className="space-y-6">
          
          {/* TABS CONTAINER */}
          <div className="flex items-center justify-center gap-2 flex-wrap bg-white/80 p-2 rounded-2xl md:rounded-full border border-slate-200 shadow-sm max-w-4xl mx-auto backdrop-blur-md">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => { setActiveTab(t.id); setSearchQuery(''); }}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#d91b5c] to-rose-600 text-white shadow-md shadow-rose-900/20 scale-105' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-amber-300' : 'text-[#d91b5c]'} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* SEARCH FILTER INPUT */}
          <div className="max-w-md mx-auto relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Filter ${activeTab} categories...`}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-[#d91b5c] focus:ring-4 focus:ring-rose-100 shadow-xs transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded-full cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

        </div>

        {/* TOP 12 CARDS DISPLAY GRID (PLAIN NATIVE HTML LINKS FOR GUARANTEED NAVIGATION) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayedItems.length > 0 ? (
            displayedItems.map((item) => (
              <a
                key={item.id}
                href={`/matrimony/${item.slug}`}
                className="group bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-200/80 hover:border-[#d91b5c] shadow-xs hover:shadow-lg transition-all duration-300 flex items-center justify-between gap-3 transform hover:-translate-y-1 cursor-pointer block"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-serif font-extrabold text-sm text-slate-900 group-hover:text-[#d91b5c] transition-colors line-clamp-1 capitalize">
                      {item.name}
                    </h4>
                    <p className="text-[11px] font-bold text-slate-500 mt-0.5 flex items-center gap-1">
                      <Sparkles size={11} className="text-amber-500" />
                      <span>{item.count}</span>
                    </p>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-[#d91b5c] group-hover:text-white text-slate-500 flex items-center justify-center transition-colors shrink-0">
                  <ChevronRight size={16} />
                </div>
              </a>
            ))
          ) : (
            <div className="col-span-full text-center py-10 bg-white rounded-3xl border border-slate-200 space-y-2">
              <p className="text-sm font-extrabold text-slate-500">No matching categories found for "{searchQuery}"</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="text-xs text-[#d91b5c] font-black underline cursor-pointer"
              >
                Reset Filter Search
              </button>
            </div>
          )}
        </div>

        {/* SMART VIEW ALL BUTTON (NATIVE HTML LINK) */}
        {!searchQuery && hasMoreItems && (
          <div className="text-center pt-6">
            <a
              href={`/matrimony?tab=${activeTab}`}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 hover:from-[#d91b5c] hover:to-rose-600 text-white font-black text-xs uppercase tracking-widest shadow-xl transition-all cursor-pointer group hover:scale-105 border border-slate-800"
            >
              <span>View All {currentTabItems.length}+ {activeTab.toUpperCase()} Categories</span>
              <ArrowRight size={16} className="text-amber-300 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        )}

      </div>
    </section>
  );
}
