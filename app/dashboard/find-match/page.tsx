"use client";

import React, { useState } from 'react';
import { 
  Search, SlidersHorizontal, X, ChevronDown, ChevronUp,
  MapPin, Briefcase, GraduationCap, Users2, Ruler, Star, Check, UserPlus, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface Profile {
  id: number; name: string; age: number; height: string; city: string;
  job: string; education: string; sect: string; salary: string;
  img: string; verified: boolean; premium: boolean;
}

const MOCK_PROFILES: Profile[] = [
  { id: 1, name: "Saba Khan", age: 24, height: "5'4\"", city: "Bareilly", job: "Software Engineer", education: "B.Tech", sect: "Sunni", salary: "12 LPA", verified: true, premium: true, img: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&q=80&w=400" },
  { id: 2, name: "Zoya Ahmed", age: 26, height: "5'2\"", city: "Lucknow", job: "Doctor", education: "MBBS", sect: "Shia", salary: "18 LPA", verified: true, premium: false, img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400" },
  { id: 3, name: "Iqra Shaikh", age: 23, height: "5'5\"", city: "Delhi", job: "Designer", education: "B.Des", sect: "Sunni", salary: "8 LPA", verified: false, premium: true, img: "https://images.unsplash.com/photo-1494790108377-be9ce29b2933?auto=format&fit=crop&q=80&w=400" },
  { id: 4, name: "Mehak Fatima", age: 25, height: "5'3\"", city: "Bareilly", job: "Teacher", education: "M.A", sect: "Sunni", salary: "6 LPA", verified: true, premium: false, img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=400" },
];

export default function SearchPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>("AgeHeight");
  const [sentInterests, setSentInterests] = useState<number[]>([]);

  const [filters, setFilters] = useState({
    ageMin: 18, ageMax: 45,
    heightMin: 4.5, heightMax: 6.5,
    salaryMin: 0, salaryMax: 50,
    maritalStatus: [] as string[],
    sect: [] as string[],
    caste: [] as string[],
    states: [] as string[],
    cities: [] as string[],
    education: [] as string[],
    employedIn: [] as string[],
  });

  const toggleFilter = (val: string, cat: keyof typeof filters) => {
    setFilters(prev => {
      const list = prev[cat] as string[];
      return { ...prev, [cat]: list.includes(val) ? list.filter(i => i !== val) : [...list, val] };
    });
  };

  return (
    <div className="min-h-screen bg-[#FDF2F5] text-[#4D0628]">
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        input[type='range'] { pointer-events: none; position: absolute; width: 100%; appearance: none; background: none; z-index: 10; }
        input[type='range']::-webkit-slider-thumb { pointer-events: auto; width: 18px; height: 18px; border-radius: 50%; background: #D2136E; appearance: none; border: 2px solid white; box-shadow: 0 4px 10px rgba(210, 19, 110, 0.3); cursor: pointer; }
      `}</style>

      {/* --- Sticky Header --- */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-pink-100 px-4 py-3 flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
          <input type="text" placeholder="Find your match..." className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-10 text-sm outline-none focus:border-pink-300 transition-all" />
        </div>
        <button onClick={() => setShowFilters(true)} className="flex items-center gap-2 px-5 py-3 bg-[#D2136E] text-white rounded-2xl shadow-lg shadow-pink-200 font-bold uppercase text-[10px] tracking-wider active:scale-95 transition-all">
          <SlidersHorizontal size={16} /> <span>Filter</span>
        </button>
      </div>

      {/* --- Profile Grid --- */}
      <main className="max-w-[1600px] mx-auto px-4 py-8 pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {MOCK_PROFILES.map((user) => (
            <motion.div key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[40px] overflow-hidden border border-pink-50 shadow-xl shadow-pink-900/5 group">
              <div className="relative h-[280px] overflow-hidden">
                <img src={user.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={user.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                {user.premium && <div className="absolute top-4 left-4 bg-amber-400 text-black text-[8px] font-black px-2 py-1 rounded-full flex items-center gap-1 shadow-md"><Star size={8} fill="black" /> VIP</div>}
                <div className="absolute bottom-4 left-6 text-white">
                  <div className="flex items-center gap-1.5 font-bold"><h3 className="text-lg italic">{user.name}, {user.age}</h3><CheckCircle2 size={14} className="text-blue-400" /></div>
                  <p className="text-white/70 text-[9px] uppercase tracking-widest flex items-center gap-1"><MapPin size={10} /> {user.city}</p>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                   <MiniDetail icon={<Briefcase size={12}/>} label={user.job} />
                   <MiniDetail icon={<Ruler size={12}/>} label={user.height} />
                   <MiniDetail icon={<GraduationCap size={12}/>} label={user.education} />
                   <MiniDetail icon={<Users2 size={12}/>} label={user.sect} />
                </div>
                <div className="flex gap-2">
                   <button className="px-4 py-3 bg-gray-50 text-[#D2136E] font-black text-[9px] uppercase rounded-xl hover:bg-pink-50 transition-colors">View</button>
                   <button onClick={() => setSentInterests([...sentInterests, user.id])} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-1.5 font-black text-[9px] uppercase transition-all ${sentInterests.includes(user.id) ? 'bg-green-50 text-green-600' : 'bg-[#D2136E] text-white shadow-md shadow-pink-100'}`}>
                     {sentInterests.includes(user.id) ? "Sent" : <><UserPlus size={14}/> Connect Now</>}
                   </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* --- Filter Drawer (Fix applied for Mobile Bottom Bar) --- */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFilters(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] flex flex-col shadow-2xl">
              
              {/* Header */}
              <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                <h3 className="text-xl font-black italic text-[#D2136E]">Refine Search</h3>
                <button onClick={() => setShowFilters(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-[#D2136E] transition-all"><X size={20}/></button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar pb-40">
                <AccordionWrapper title="Basic Info" isOpen={openAccordion === "AgeHeight"} onToggle={() => setOpenAccordion(openAccordion === "AgeHeight" ? null : "AgeHeight")}>
                  <div className="space-y-6 pt-2">
                    <DualRange min={18} max={60} valMin={filters.ageMin} valMax={filters.ageMax} onChangeMin={(v)=>setFilters({...filters, ageMin:v})} onChangeMax={(v)=>setFilters({...filters, ageMax:v})} title="Age Range" label="Yrs" />
                    <DualRange min={4.0} max={7.0} valMin={filters.heightMin} valMax={filters.heightMax} onChangeMin={(v)=>setFilters({...filters, heightMin:v})} onChangeMax={(v)=>setFilters({...filters, heightMax:v})} title="Height" label="Ft" step={0.1} />
                  </div>
                </AccordionWrapper>

                <AccordionWrapper title="Status & Sect" isOpen={openAccordion === "Comm"} onToggle={() => setOpenAccordion(openAccordion === "Comm" ? null : "Comm")}>
                  <div className="space-y-4 pt-2">
                    <SearchableSelect label="Sect" options={["Sunni", "Shia", "Wahabi"]} selected={filters.sect} onSelect={(v)=>toggleFilter(v, 'sect')} />
                    <SearchableSelect label="Caste" options={["Sheikh", "Sayyed", "Pathan"]} selected={filters.caste} onSelect={(v)=>toggleFilter(v, 'caste')} />
                    <div className="flex flex-wrap gap-2">
                        {["Never Married", "Divorced"].map(o => (
                          <button key={o} onClick={()=>toggleFilter(o, 'maritalStatus')} className={`px-4 py-2 rounded-xl text-[9px] font-black border uppercase transition-all ${filters.maritalStatus.includes(o) ? 'bg-[#D2136E] text-white border-[#D2136E]' : 'bg-white text-gray-400 border-gray-100'}`}>{o}</button>
                        ))}
                    </div>
                  </div>
                </AccordionWrapper>

                <AccordionWrapper title="Career & Income" isOpen={openAccordion === "Edu"} onToggle={() => setOpenAccordion(openAccordion === "Edu" ? null : "Edu")}>
                  <div className="space-y-4 pt-2">
                    <SearchableSelect label="Education" options={["B.Tech", "MBA", "MBBS"]} selected={filters.education} onSelect={(v)=>toggleFilter(v, 'education')} />
                    <DualRange min={0} max={100} valMin={filters.salaryMin} valMax={filters.salaryMax} onChangeMin={(v)=>setFilters({...filters, salaryMin:v})} onChangeMax={(v)=>setFilters({...filters, salaryMax:v})} title="Annual Income (LPA)" label="L" />
                  </div>
                </AccordionWrapper>

                <AccordionWrapper title="Location" isOpen={openAccordion === "Loc"} onToggle={() => setOpenAccordion(openAccordion === "Loc" ? null : "Loc")}>
                  <div className="space-y-4 pt-2">
                    <SearchableSelect label="State" options={["Uttar Pradesh", "Delhi", "Punjab"]} selected={filters.states} onSelect={(v)=>toggleFilter(v, 'states')} />
                    <SearchableSelect label="City" options={["Bareilly", "Lucknow", "Noida"]} selected={filters.cities} onSelect={(v)=>toggleFilter(v, 'cities')} />
                  </div>
                </AccordionWrapper>
              </div>

              {/* Action Buttons - Fixed for Mobile Navigation Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-md border-t flex gap-3 z-50 pb-20 sm:pb-6">
                <button onClick={() => setShowFilters(false)} className="flex-1 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Close</button>
                <button onClick={() => setShowFilters(false)} className="flex-[2] py-4 bg-[#D2136E] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-pink-200 active:scale-95 transition-all">Apply Filter</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Component Helpers ---
function MiniDetail({ icon, label }: any) {
  return (
    <div className="flex items-center gap-1.5 text-gray-400 overflow-hidden">
      <div className="text-[#D2136E] shrink-0">{icon}</div>
      <span className="text-[9px] font-black uppercase truncate tracking-tight">{label}</span>
    </div>
  );
}

function DualRange({ min, max, valMin, valMax, onChangeMin, onChangeMax, label, title, step = 1 }: any) {
  const minPos = ((valMin - min) / (max - min)) * 100;
  const maxPos = ((valMax - min) / (max - min)) * 100;
  return (
    <div className="py-2">
      <div className="flex justify-between items-center mb-4"><label className="text-[9px] font-black uppercase text-gray-400">{title}</label><span className="text-[9px] font-black text-[#D2136E] bg-pink-50 px-2 py-0.5 rounded">{valMin}-{valMax} {label}</span></div>
      <div className="relative h-1.5 bg-gray-100 rounded-full mx-1">
        <div className="absolute h-full bg-[#D2136E] rounded-full" style={{ left: `${minPos}%`, right: `${100 - maxPos}%` }} />
        <input type="range" min={min} max={max} step={step} value={valMin} onChange={(e) => onChangeMin(Math.min(Number(e.target.value), valMax - step))} />
        <input type="range" min={min} max={max} step={step} value={valMax} onChange={(e) => onChangeMax(Math.max(Number(e.target.value), valMin + step))} />
      </div>
    </div>
  );
}

function SearchableSelect({ label, options, selected, onSelect }: any) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = options.filter(o => o.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-1.5 relative">
      <label className="text-[9px] font-black uppercase text-gray-400 ml-1">{label}</label>
      <div onClick={() => setOpen(true)} className="min-h-[48px] bg-gray-50 border border-gray-100 rounded-xl p-2.5 flex flex-wrap gap-1.5 items-center cursor-pointer hover:border-pink-200">
        {selected.length === 0 ? <span className="text-[11px] text-gray-300 font-bold px-1 italic">Select...</span> : 
          selected.map((s: any) => <span key={s} className="bg-[#D2136E] text-white text-[8px] font-black uppercase px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">{s} <X size={10} onClick={(e) => { e.stopPropagation(); onSelect(s); }} /></span>)
        }
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute z-[100] top-0 left-0 w-full bg-white border shadow-2xl rounded-2xl overflow-hidden flex flex-col">
            <div className="p-3 border-b flex items-center gap-2 bg-gray-50/50"><Search size={14} className="text-gray-300" /><input autoFocus placeholder="Type to search..." className="flex-1 text-xs font-bold outline-none bg-transparent" onChange={e => setQ(e.target.value)} /><X size={14} className="cursor-pointer text-gray-400 hover:text-red-500" onClick={()=>setOpen(false)} /></div>
            <div className="max-h-44 overflow-y-auto p-1">{filtered.map(opt => (<div key={opt} onClick={() => onSelect(opt)} className="px-4 py-2.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-pink-50 flex justify-between items-center transition-colors">{opt} {selected.includes(opt) && <Check size={14} className="text-[#D2136E]" />}</div>))}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AccordionWrapper({ title, children, isOpen, onToggle }: any) {
  return (
    <div className={`border rounded-[30px] overflow-hidden transition-all duration-300 ${isOpen ? 'border-[#D2136E]/20 bg-white shadow-sm' : 'border-gray-50 bg-white'}`}>
      <button onClick={onToggle} className="w-full p-5 flex justify-between items-center text-left"><span className="text-[11px] font-black uppercase tracking-widest text-gray-600">{title}</span>{isOpen ? <ChevronUp size={16} className="text-[#D2136E]"/> : <ChevronDown size={16} className="text-gray-300"/>}</button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-5 pb-5">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}