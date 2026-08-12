"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, User, GraduationCap, Users, 
  Moon, Heart, Save, Loader2
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { fetchProfileDetailsApi, updateProfileApi } from '@/lib/api';

export default function DynamicEditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'education' | 'family' | 'religious' | 'partner'>('basic');

  // Form Fields State
  const [formData, setFormData] = useState<any>({
    fullName: '',
    email: '',
    gender: 'Female',
    age: 24,
    height: '5ft 4in',
    highestDegree: '',
    collegeName: '',
    employmentSector: '',
    designation: '',
    annualIncome: '',
    fatherOccupation: '',
    motherOccupation: '',
    totalBrothers: 0,
    totalSisters: 0,
    namazHabit: 'Regular',
    partnerExpectations: '',
    minAge: 20,
    maxAge: 35,
    preferredEducation: 'Graduate'
  });

  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop()?.split(';').shift() : null;
  };

  const getToken = useCallback(() => getCookie("user_token"), []);

  const loadUserData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push('/');
      return;
    }

    setLoading(true);
    let userId = 0;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user_details");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          userId = parsed.userId || parsed.UserId || parsed.id;
        } catch (e) {}
      }
    }

    const res = await fetchProfileDetailsApi(userId > 0 ? userId : 0, token);
    if (res.success && res.data) {
      const p = res.data.profile || res.data.Profile || res.data;
      const pref = res.data.preferences || res.data.Preferences || {};

      setFormData((prev: any) => ({
        ...prev,
        fullName: p.fullName || p.FullName || '',
        email: p.email || p.Email || '',
        gender: p.gender || p.Gender || 'Female',
        age: p.age || p.Age || 24,
        height: p.height || p.Height || '5ft 4in',
        highestDegree: p.highestDegree || p.education || '',
        collegeName: p.collegeName || '',
        employmentSector: p.employmentSector || '',
        designation: p.designation || p.profession || '',
        annualIncome: p.annualIncome || '',
        fatherOccupation: p.fatherOccupation || '',
        motherOccupation: p.motherOccupation || '',
        totalBrothers: p.totalBrothers || 0,
        totalSisters: p.totalSisters || 0,
        namazHabit: p.namazHabit || 'Regular',
        partnerExpectations: p.partnerExpectations || pref.partnerExpectations || '',
        minAge: pref.minAge || 20,
        maxAge: pref.maxAge || 35,
        preferredEducation: pref.preferredEducation || 'Graduate'
      }));
    }

    setLoading(false);
  }, [getToken, router]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    setSaving(true);
    const fd = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== undefined) {
        fd.append(key, String(formData[key]));
      }
    });

    const res = await updateProfileApi(fd, token);
    setSaving(false);

    if (res.success) {
      toast.success("Profile updated successfully!");
      router.push('/dashboard/my-profile');
    } else {
      toast.error(res.message || "Failed to update profile.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-28 pt-4 selection:bg-[#870c3f] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      <div className="max-w-2xl mx-auto px-4 space-y-5">
        
        {/* HEADER BAR */}
        <div className="bg-white rounded-3xl p-4 border-2 border-rose-100 shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => router.back()} className="p-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-[#870c3f] border-2 border-rose-200 transition-colors cursor-pointer">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-base font-serif font-extrabold uppercase tracking-tight text-slate-900">
                Edit My Profile
              </h1>
              <p className="text-[10px] font-semibold text-slate-500">Update your details selectively</p>
            </div>
          </div>

          <button 
            type="submit" 
            form="edit-profile-form" 
            disabled={saving} 
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white font-black text-xs uppercase tracking-wider shadow-md hover:brightness-110 flex items-center gap-1.5 cursor-pointer border border-rose-300/30"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>Save</span>
          </button>
        </div>

        {/* 🌟 COMPACT PLAIN BLACK TABS FOR MOBILE FIX */}
        <div className="bg-white rounded-2xl p-1.5 border-2 border-rose-100 shadow-xs grid grid-cols-5 gap-1 text-[11px] font-black uppercase text-center">
          {[
            { id: 'basic', label: 'Basic' },
            { id: 'education', label: 'Edu/Career' },
            { id: 'family', label: 'Family' },
            { id: 'religious', label: 'Religion' },
            { id: 'partner', label: 'Partner' },
          ].map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id as any)}
              className={`py-2 rounded-xl transition-all cursor-pointer truncate ${
                activeSection === sec.id
                  ? 'bg-slate-950 text-white font-black shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* EDIT FORM CONTAINER */}
        <form id="edit-profile-form" onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-5 border-2 border-rose-100 shadow-xl space-y-4">
          
          {loading ? (
            <div className="py-14 text-center text-[#870c3f]">
              <Loader2 size={36} className="animate-spin mx-auto mb-2" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">Loading Profile Details...</span>
            </div>
          ) : (
            <>
              {/* 1. BASIC INFO */}
              {activeSection === 'basic' && (
                <div className="space-y-3.5">
                  <h3 className="text-xs font-black uppercase text-[#870c3f] tracking-wider border-b pb-1.5">Basic Details</h3>
                  
                  <InputField label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} />
                  <InputField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} />
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    <InputField label="Age (Years)" name="age" type="number" value={formData.age} onChange={handleChange} />
                    <InputField label="Height" name="height" value={formData.height} onChange={handleChange} placeholder="e.g. 5ft 5in" />
                  </div>
                </div>
              )}

              {/* 2. EDUCATION & CAREER */}
              {activeSection === 'education' && (
                <div className="space-y-3.5">
                  <h3 className="text-xs font-black uppercase text-[#870c3f] tracking-wider border-b pb-1.5">Education & Career</h3>
                  
                  <InputField label="Highest Qualification" name="highestDegree" value={formData.highestDegree} onChange={handleChange} placeholder="e.g. B.Tech / MBA" />
                  <InputField label="College / University" name="collegeName" value={formData.collegeName} onChange={handleChange} />
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    <InputField label="Profession / Designation" name="designation" value={formData.designation} onChange={handleChange} />
                    <InputField label="Annual Income" name="annualIncome" value={formData.annualIncome} onChange={handleChange} placeholder="e.g. 8 LPA" />
                  </div>
                </div>
              )}

              {/* 3. FAMILY DETAILS */}
              {activeSection === 'family' && (
                <div className="space-y-3.5">
                  <h3 className="text-xs font-black uppercase text-[#870c3f] tracking-wider border-b pb-1.5">Family Details</h3>
                  
                  <InputField label="Father's Work" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} />
                  <InputField label="Mother's Work" name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} />
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    <InputField label="Total Brothers" name="totalBrothers" type="number" value={formData.totalBrothers} onChange={handleChange} />
                    <InputField label="Total Sisters" name="totalSisters" type="number" value={formData.totalSisters} onChange={handleChange} />
                  </div>
                </div>
              )}

              {/* 4. RELIGIOUS HABITS */}
              {activeSection === 'religious' && (
                <div className="space-y-3.5">
                  <h3 className="text-xs font-black uppercase text-[#870c3f] tracking-wider border-b pb-1.5">Religion & Lifestyle</h3>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Namaz Habit</label>
                    <select name="namazHabit" value={formData.namazHabit} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold outline-none focus:border-[#870c3f]">
                      <option value="Regular">Regular 5 Times</option>
                      <option value="Jummah Only">Jummah Only</option>
                      <option value="Occasionally">Occasionally</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 5. PARTNER PREFERENCE */}
              {activeSection === 'partner' && (
                <div className="space-y-3.5">
                  <h3 className="text-xs font-black uppercase text-[#870c3f] tracking-wider border-b pb-1.5">Partner Preferences</h3>
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    <InputField label="Min Age" name="minAge" type="number" value={formData.minAge} onChange={handleChange} />
                    <InputField label="Max Age" name="maxAge" type="number" value={formData.maxAge} onChange={handleChange} />
                  </div>

                  <InputField label="Preferred Education" name="preferredEducation" value={formData.preferredEducation} onChange={handleChange} />

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Partner Expectations</label>
                    <textarea 
                      name="partnerExpectations" 
                      rows={3} 
                      value={formData.partnerExpectations} 
                      onChange={handleChange} 
                      placeholder="Describe what kind of partner you want..." 
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-3.5 text-xs font-bold outline-none focus:border-[#870c3f]"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-900/20 hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer border border-rose-300/30"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Save Changes</span>
                </button>
              </div>
            </>
          )}

        </form>

      </div>
    </div>
  );
}

function InputField({ label, name, value, onChange, type = "text", placeholder }: any) {
  return (
    <div className="space-y-1 text-left">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
      <input 
        type={type} 
        name={name} 
        value={value || ''} 
        onChange={onChange} 
        placeholder={placeholder} 
        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-[#870c3f]" 
      />
    </div>
  );
}