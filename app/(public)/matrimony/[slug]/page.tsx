"use client";

import React, { useState, use } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, MapPin, Search, ArrowLeft, Heart, Lock, UserCheck, 
  Sparkles, CheckCircle2, ChevronRight, Filter, Users, Phone, ArrowRight, UserPlus
} from 'lucide-react';
import { useAuthModal } from '@/context/AuthModalContext';

interface Proposal {
  id: string;
  code: string;
  age: number;
  height: string;
  education: string;
  profession: string;
  city: string;
  sect: string;
  maritalStatus: string;
  gender: 'Bride' | 'Groom';
  isVerified: boolean;
  photoBlur: boolean;
  verifiedBadge: string;
}

export default function DynamicMatrimonyPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const { openRegisterModal, openLoginModal } = useAuthModal();
  const slug = resolvedParams.slug || '';

  // Format title from slug
  const title = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const [activeTab, setActiveTab] = useState<'all' | 'grooms' | 'brides'>('all');

  const dummyProposals: Proposal[] = [
    {
      id: '1',
      code: 'NQ-84920',
      age: 26,
      height: "5ft 8in",
      education: 'M.B.B.S, M.D.',
      profession: 'Doctor (Senior Resident)',
      city: 'Bareilly',
      sect: 'Sunni Hanafi',
      maritalStatus: 'Never Married',
      gender: 'Groom',
      isVerified: true,
      photoBlur: true,
      verifiedBadge: 'ID & Selfie Verified'
    },
    {
      id: '2',
      code: 'NQ-73104',
      age: 24,
      height: "5ft 4in",
      education: 'B.Tech (Computer Science)',
      profession: 'Software Engineer',
      city: 'Delhi NCR',
      sect: 'Sunni Hanafi',
      maritalStatus: 'Never Married',
      gender: 'Bride',
      isVerified: true,
      photoBlur: true,
      verifiedBadge: '100% Mobile Verified'
    },
    {
      id: '3',
      code: 'NQ-91024',
      age: 28,
      height: "5ft 10in",
      education: 'Chartered Accountant (FCA)',
      profession: 'CA Practice',
      city: 'Lucknow',
      sect: 'Sunni Siddique',
      maritalStatus: 'Never Married',
      gender: 'Groom',
      isVerified: true,
      photoBlur: true,
      verifiedBadge: 'Government ID Verified'
    },
    {
      id: '4',
      code: 'NQ-62810',
      age: 25,
      height: "5ft 3in",
      education: 'M.Sc Biotechnology',
      profession: 'Research Specialist',
      city: 'Mumbai',
      sect: 'Sunni Hanafi',
      maritalStatus: 'Never Married',
      gender: 'Bride',
      isVerified: true,
      photoBlur: true,
      verifiedBadge: 'Selfie Verified'
    },
    {
      id: '5',
      code: 'NQ-54192',
      age: 29,
      height: "5ft 9in",
      education: 'LL.B, Advocate',
      profession: 'High Court Advocate',
      city: 'Agra',
      sect: 'Sunni Hanafi',
      maritalStatus: 'Never Married',
      gender: 'Groom',
      isVerified: true,
      photoBlur: true,
      verifiedBadge: 'ID Verified'
    },
    {
      id: '6',
      code: 'NQ-38104',
      age: 23,
      height: "5ft 2in",
      education: 'B.Pharm',
      profession: 'Pharmacist',
      city: 'Aligarh',
      sect: 'Sunni Hanafi',
      maritalStatus: 'Never Married',
      gender: 'Bride',
      isVerified: true,
      photoBlur: true,
      verifiedBadge: 'Verified Proposal'
    }
  ];

  const filteredProposals = dummyProposals.filter(p => {
    if (activeTab === 'grooms') return p.gender === 'Groom';
    if (activeTab === 'brides') return p.gender === 'Bride';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 selection:bg-[#d91b5c] selection:text-white">
      
      {/* 🌟 ELEGANT HERO BANNER HEADER */}
      <section className="relative bg-gradient-to-r from-slate-950 via-[#3b091a] to-[#700d2b] text-white py-16 px-4 sm:px-6 lg:px-[6%] overflow-hidden border-b border-rose-950">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3.5 py-1 rounded-full text-[11px] font-black tracking-widest uppercase backdrop-blur-sm">
            <Sparkles size={13} /> 100% Verified Matchmaking
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif tracking-tight leading-tight text-white">
            {title}
          </h1>
          <p className="text-amber-300 font-serif italic text-lg sm:text-2xl font-bold">
            Verified Proposals & Rishte
          </p>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed pt-1">
            Discover educated Muslim brides and grooms for <strong className="text-white font-bold">{title}</strong>. All profiles feature 100% selfie & OTP verification with complete photo privacy controls.
          </p>

          <div className="pt-3 flex justify-center">
            <button
              onClick={openRegisterModal}
              className="bg-gradient-to-r from-[#d91b5c] to-rose-600 hover:brightness-110 text-white font-extrabold px-8 py-3.5 rounded-full text-xs uppercase tracking-wider shadow-lg shadow-rose-900/40 active:scale-95 transition-all cursor-pointer flex items-center gap-2 border border-rose-400/30"
            >
              <span>Create Free Profile to View All Matches</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* 📊 TRUST HIGHLIGHT STATS BAR */}
      <div className="bg-white border-b border-slate-200 py-6 px-4 sm:px-6 lg:px-[6%] shadow-xs">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-2 border-r border-slate-100 last:border-0">
            <p className="text-xl sm:text-2xl font-black text-[#d91b5c]">1,850+</p>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">Active Proposals</p>
          </div>
          <div className="p-2 border-r border-slate-100 last:border-0">
            <p className="text-xl sm:text-2xl font-black text-[#d91b5c]">100%</p>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">Mobile Verified</p>
          </div>
          <div className="p-2 border-r border-slate-100 last:border-0">
            <p className="text-xl sm:text-2xl font-black text-[#d91b5c]">Photo Privacy</p>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">Full Password Protection</p>
          </div>
          <div className="p-2">
            <p className="text-xl sm:text-2xl font-black text-[#d91b5c]">Direct Connect</p>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">Verified Contact Details</p>
          </div>
        </div>
      </div>

      {/* 🔍 PROPOSALS SECTION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-[6%] mt-10 space-y-6">
        
        {/* TAB CONTROLS & HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Matching Proposals for <span className="text-[#d91b5c]">{title}</span>
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Showing recent active verified profiles matching your criteria.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'all' ? 'bg-white text-[#d91b5c] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All Matches
            </button>
            <button
              onClick={() => setActiveTab('grooms')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'grooms' ? 'bg-white text-[#d91b5c] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Grooms Only
            </button>
            <button
              onClick={() => setActiveTab('brides')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'brides' ? 'bg-white text-[#d91b5c] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Brides Only
            </button>
          </div>
        </div>

        {/* PROPOSALS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProposals.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border-2 border-slate-200 hover:border-[#d91b5c]/40 p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between group"
            >
              <div className="space-y-3.5">
                
                {/* PHOTO & VERIFICATION HEADER */}
                <div className="flex items-start gap-3.5">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden shrink-0">
                    <Lock size={20} className="text-slate-400 mb-0.5" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Protected</span>
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-slate-900 text-sm">{item.code}</span>
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={11} /> Verified
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#d91b5c]">{item.gender} • {item.age} yrs, {item.height}</p>
                    <p className="text-[11px] font-semibold text-slate-500 truncate">{item.education}</p>
                  </div>
                </div>

                {/* DETAILS CHIPS */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-medium text-slate-700">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Profession:</span>
                    <span className="font-bold text-slate-900">{item.profession}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Location:</span>
                    <span className="font-bold text-slate-900">{item.city}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Sect:</span>
                    <span className="font-bold text-slate-900">{item.sect}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-bold text-slate-900">{item.maritalStatus}</span>
                  </div>
                </div>

              </div>

              {/* ACTION BUTTON */}
              <button
                onClick={openRegisterModal}
                className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-[#d91b5c] text-[#d91b5c] hover:text-white border border-rose-200 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-95 mt-2"
              >
                <span>Register to View Full Details</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
