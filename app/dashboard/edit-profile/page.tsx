"use client";
import React, { useState } from 'react';
import { 
  User, MapPin, Briefcase, GraduationCap, Heart, 
  Users, Moon, PenLine, X, Save, ShieldCheck, 
  Camera, Check, Utensils, Calendar, Gem, 
  ChevronDown as LucideChevronDown 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Sub-Components ---

// 1. Photo Edit Module
const ProfilePhotoModule = ({ img, isVerified }: { img: string, isVerified: boolean }) => (
  <div className="relative shrink-0 group">
    <div className="w-36 h-36 md:w-48 md:h-48 rounded-[48px] overflow-hidden border-[8px] border-pink-50 shadow-inner">
      <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Profile" />
    </div>
    <div className="absolute inset-4 rounded-[32px] bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer z-10">
       <Camera size={24} className="text-white mb-1"/>
       <span className="text-[10px] font-black text-white uppercase tracking-tighter">Edit Photo</span>
    </div>
    {isVerified && (
      <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-3 rounded-2xl border-4 border-white shadow-lg">
        <ShieldCheck size={20} />
      </div>
    )}
  </div>
);

// 2. Input Field Component
const EditInputField = ({ label, value, type = "text", placeholder = "", isMAX = false }: any) => (
  <div className={`space-y-1.5 flex-1 ${isMAX ? 'md:col-span-2 lg:col-span-3' : 'min-w-[200px]'}`}>
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    {type === 'textarea' ? (
        <textarea defaultValue={value} placeholder={placeholder} rows={isMAX ? 4 : 3} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:bg-white focus:border-[#D2136E] outline-none transition-all resize-none"/>
    ) : (
        <input type={type} defaultValue={value} placeholder={placeholder} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:bg-white focus:border-[#D2136E] focus:ring-4 focus:ring-pink-50 outline-none transition-all" />
    )}
  </div>
);

// 3. Select Field Component
const EditSelectField = ({ label, value, options }: any) => (
  <div className="space-y-1.5 flex-1 min-w-[200px]">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      <select defaultValue={value} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 appearance-none focus:bg-white focus:border-[#D2136E] outline-none cursor-pointer transition-all">
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <LucideChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

// 4. Info View Row
const InfoRow = ({ label, value, isMAX = false }: { label: string, value: any, isMAX?: boolean }) => (
  <div className={`flex flex-col gap-1 ${isMAX ? 'col-span-2 md:col-span-3' : ''}`}>
    <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">{label}</span>
    <span className={`font-extrabold text-slate-600 ${isMAX ? 'text-xs leading-relaxed' : 'text-sm'}`}>{value || "Not filled"}</span>
  </div>
);

export default function CompleteEditProfilePage() {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = (sectionId: string) => setEditingSection(sectionId);
  const stopEditing = () => setEditingSection(null);

  const handleSave = (sectionId: string) => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setEditingSection(null);
    }, 1200);
  };

  const EditableSectionCard = ({ id, title, icon: Icon, children }: any) => {
    const isEditing = editingSection === id;
    return (
      <motion.div layout className="bg-white rounded-[35px] border border-pink-50 shadow-2xl shadow-pink-100/10 overflow-hidden transition-all">
        <div className="p-6 md:p-10">
          <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-50 rounded-2xl text-[#D2136E]">
                <Icon size={22} />
              </div>
              <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">{title}</h2>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button onClick={stopEditing} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all">
                    <X size={18} />
                  </button>
                  <button onClick={() => handleSave(id)} disabled={isSaving} className="p-3 bg-green-500 text-white rounded-2xl shadow-lg shadow-green-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                    {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <Save size={18} />}
                  </button>
                </>
              ) : (
                <button onClick={() => startEditing(id)} className="p-3 bg-white text-slate-400 rounded-2xl border border-pink-100 hover:text-[#D2136E] hover:bg-pink-50 transition-all shadow-sm">
                  <PenLine size={18} />
                </button>
              )}
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div 
              key={isEditing ? 'edit' : 'view'}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={isEditing ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-8 gap-x-6"}
            >
              {children(isEditing)}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDF2F5] pb-24">
      <div className="max-w-[1500px] mx-auto px-4 py-8 md:py-12 space-y-8">
        
        {/* HERO HEADER */}
        <div className="bg-white rounded-[40px] md:rounded-[50px] p-8 md:p-12 border border-pink-50 shadow-2xl shadow-pink-100/50 flex flex-col md:flex-row gap-10 items-center overflow-hidden relative">
          <div className="absolute -top-10 -right-10 opacity-[0.03] pointer-events-none">
             <Gem size={250} className="text-[#D2136E]" />
          </div>
          <ProfilePhotoModule img="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400" isVerified={true} />
          <div className="flex-1 text-center md:text-left space-y-5 z-10">
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                 <h1 className="text-3xl md:text-4xl font-black text-slate-800 italic uppercase tracking-tighter leading-none">Maazni Sheikh</h1>
                 <span className="bg-[#D2136E] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase italic">Member ID: PR-992834</span>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-500 font-bold text-sm">
                 <span className="flex items-center gap-1.5"><MapPin size={16} className="text-[#D2136E]" /> Bareilly, Uttar Pradesh</span>
                 <span className="flex items-center gap-1.5"><Calendar size={16} className="text-orange-400" /> Account Created: 12 Aug 2025</span>
              </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* BASIC DETAILS */}
          <EditableSectionCard id="basic" title="Basic Information" icon={User}>
            {(isEdit: boolean) => isEdit ? (
              <>
                <EditSelectField label="Profile Created For" value="Self" options={['Self', 'Son', 'Daughter', 'Brother', 'Sister', 'Friend']} />
                <EditInputField label="Date of Birth" type="date" value="1998-05-15" />
                <EditSelectField label="Height" value="5ft 6in" options={['5ft 5in', '5ft 6in', '5ft 7in']} />
                <EditInputField label="Weight" value="65kg" />
                <EditSelectField label="Complexion" value="Fair" options={['Very Fair', 'Fair', 'Wheatish', 'Dark']} />
                <EditSelectField label="Marital Status" value="Never Married" options={['Never Married', 'Divorced', 'Widowed']} />
                <EditInputField label="Mother Tongue" value="Urdu" />
                <EditInputField label="Sect" value="Sunni" />
                <EditInputField label="Caste" value="Sheikh" />
                <EditInputField label="Maslak" value="Deobandi" />
              </>
            ) : (
              <>
                <InfoRow label="Created For" value="Self" />
                <InfoRow label="DOB" value="15 May 1998" />
                <InfoRow label="Height / Weight" value="5ft 6in, 65kg" />
                <InfoRow label="Complexion" value="Fair" />
                <InfoRow label="Marital Status" value="Never Married" />
                <InfoRow label="Language" value="Urdu" />
                <InfoRow label="Sect / Caste" value="Sunni, Sheikh" />
                <InfoRow label="Maslak" value="Deobandi" />
              </>
            )}
          </EditableSectionCard>

          {/* LOCATION DETAILS */}
          <EditableSectionCard id="location" title="Location" icon={MapPin}>
            {(isEdit: boolean) => isEdit ? (
              <>
                <EditSelectField label="Current State" value="Uttar Pradesh" options={['Delhi', 'Uttar Pradesh']} />
                <EditInputField label="Current City" value="Bareilly" />
                <EditSelectField label="Native State" value="Bihar" options={['Delhi', 'Bihar']} />
                <EditInputField label="Native City" value="Patna" />
              </>
            ) : (
              <>
                <InfoRow label="Current Location" value="Bareilly, Uttar Pradesh" />
                <InfoRow label="Native Place" value="Patna, Bihar" />
              </>
            )}
          </EditableSectionCard>

          {/* CAREER */}
          <EditableSectionCard id="career" title="Education & Career" icon={GraduationCap}>
            {(isEdit: boolean) => isEdit ? (
              <>
                <EditInputField label="Highest Degree" value="M.Tech" />
                <EditInputField label="College Name" value="IIT" />
                <EditSelectField label="Sector" value="Private" options={['Private', 'Government', 'Business']} />
                <EditInputField label="Designation" value="Senior Developer" />
                <EditInputField label="Annual Income" value="12L - 15L" />
                <EditInputField label="Occupation Details" type="textarea" value="I work as a Lead Web Developer..." isMAX={true} />
              </>
            ) : (
              <>
                <InfoRow label="Degree" value="M.Tech" />
                <InfoRow label="College" value="IIT" />
                <InfoRow label="Sector" value="Private Sector" />
                <InfoRow label="Designation" value="Senior Developer" />
                <InfoRow label="Income" value="12L - 15L" />
                <InfoRow label="Work Details" value="I work as a Lead Web Developer at solutions Inc." isMAX={true} />
              </>
            )}
          </EditableSectionCard>

          {/* FAMILY */}
          <EditableSectionCard id="family" title="Family Background" icon={Users}>
            {(isEdit: boolean) => isEdit ? (
              <>
                <EditSelectField label="Family Type" value="Nuclear" options={['Nuclear', 'Joint']} />
                <EditSelectField label="Family Values" value="Moderate" options={['Traditional', 'Moderate', 'Liberal']} />
                <EditSelectField label="Family Status" value="Middle Class" options={['Middle Class', 'Upper Middle']} />
                <EditInputField label="Father's Job" value="Retired" />
                <EditInputField label="Mother's Job" value="Homemaker" />
                <EditInputField label="Total Brothers" type="number" value="2" />
                <EditInputField label="Married Brothers" type="number" value="1" />
                <EditInputField label="Total Sisters" type="number" value="1" />
                <EditInputField label="Married Sisters" type="number" value="0" />
                <EditInputField label="About Family" type="textarea" value="Simple family, respectful." isMAX={true} />
              </>
            ) : (
              <>
                <InfoRow label="Family Type" value="Nuclear, Moderate" />
                <InfoRow label="Family Status" value="Middle Class" />
                <InfoRow label="Parents" value="F: Retired, M: Homemaker" />
                <InfoRow label="Siblings" value="Brothers: 2 (1 Married), Sisters: 1 (0 Married)" />
                <InfoRow label="Family Summary" value="Simple family with religious values and respectful environment." isMAX={true} />
              </>
            )}
          </EditableSectionCard>

          {/* LIFESTYLE & PREFERENCES */}
          <EditableSectionCard id="lifestyle" title="Lifestyle & Preferences" icon={Utensils}>
            {(isEdit: boolean) => isEdit ? (
              <>
                <EditSelectField label="Diet Type" value="Non-Veg" options={['Veg', 'Non-Veg', 'Eggetarian']} />
                <EditSelectField label="Smoke Habit" value="No" options={['No', 'Occasional', 'Yes']} />
                <EditSelectField label="Drink Habit" value="No" options={['No']} />
                <EditSelectField label="Can Cook?" value="Yes" options={['Yes', 'No']} />
                <EditInputField label="Hobbies" type="textarea" value="Coding, Traveling" />
                <EditInputField label="Interests" type="textarea" value="New Tech" />
                <EditInputField label="Partner Expectations" type="textarea" value="Looking for someone kind..." isMAX={true} />
                <EditSelectField label="Photo Privacy" value="All Members" options={['All Members', 'Verified Members', 'Only Matches']} />
              </>
            ) : (
              <>
                <InfoRow label="Diet & Cooking" value="Non-Veg, Can Cook: Yes" />
                <InfoRow label="Habits" value="Smoke: No, Drink: No" />
                <InfoRow label="Hobbies / Interests" value="Coding, Traveling, Tech Trends" />
                <InfoRow label="Photo Privacy" value="All Registered Members" />
                <InfoRow label="Partner Expectations" value="Looking for someone who is educated, understanding, and kind-hearted." isMAX={true} />
              </>
            )}
          </EditableSectionCard>
        </div>
      </div>
    </div>
  );
}