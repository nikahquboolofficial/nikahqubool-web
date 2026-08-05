"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { 
  User, Briefcase, Heart, Camera, ChevronRight, 
  CheckCircle2, Search, Crown, Globe, ShieldCheck, Trophy, Loader2, Lock, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Master Data Interface
interface MasterItem {
  id: number;
  value: string;
}

export default function PakizaRishteFinal() {
  const router = useRouter();
  const [section, setSection] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  // API Master Data States
  const [masterData, setMasterData] = useState<{ [key: string]: MasterItem[] }>({
    MARITAL_STATUS: [],
    RELIGIONS: [],
    SECTS: [],
    MASLAKS: [],
    CASTES: [],
    MOTHER_TONGUES: [],
    COMPLEXIONS: [],
    EDUCATIONS: [],
    EMPLOYMENT_SECTORS: [],
    OCCUPATIONS: [],
    STATES: [],
    CITIES: [],
    FAMILY_TYPES: [],
    FAMILY_STATUS: [],
    FATHER_OCCUPATIONS: [],
    MOTHER_OCCUPATIONS: []
  });

  const [formData, setFormData] = useState({
    dob: '', height: '', weight: '', 
    complexionId: 0, complexionText: '',
    maritalStatusId: 0, maritalStatusText: '',
    religionId: 0, religionText: '',
    sectId: 0, sectText: '',
    maslakId: 0, maslakText: '',
    casteId: 0, casteText: '',
    motherTongueId: 0, motherTongueText: '',
    stateId: 0, stateText: '', 
    cityId: 0, cityText: '', 
    educationId: 0, educationText: '',
    employmentSectorId: 0, employmentSectorText: '',
    occupationId: 0, occupationText: '', 
    income: '',
    familyTypeId: 0, familyTypeText: '',
    familyStatusId: 0, familyStatusText: '',
    fatherOccupationId: 0, fatherOccupationText: '',
    motherOccupationId: 0, motherOccupationText: '',
    photo: null as File | null, photoUrl: '', photoPrivacy: 'All Members'
  });

  // Fetch Master Data on mount
  useEffect(() => {
    setIsMounted(true);
    const fetchMasterList = async (type: string, targetKey?: string) => {
      try {
        const res = await fetch(`https://crm.altawafumrah.com/api/Master/${type}`);
        const json = await res.json();
        const listData = Array.isArray(json) ? json : (json.data || json.Data || json.result || []);
        const stateKey = targetKey || type;
        setMasterData(prev => ({ ...prev, [stateKey]: listData }));
      } catch (err) { 
        console.error(`${type} fetch error`, err); 
      }
    };

    const masterTypesToLoad = [
      { endpoint: 'MARITAL_STATUS' },
      { endpoint: 'RELIGIONS' },
      { endpoint: 'SECTS' },
      { endpoint: 'MASLAKS' },
      { endpoint: 'CASTES' },
      { endpoint: 'MOTHER_TONGUES' },
      { endpoint: 'Complexion', stateKey: 'COMPLEXIONS' },
      { endpoint: 'EDUCATIONS' },
      { endpoint: 'EMPLOYMENT_SECTORS' },
      { endpoint: 'OCCUPATIONS' },
      { endpoint: 'STATES' },
      { endpoint: 'FAMILY_TYPES' },
      { endpoint: 'FAMILY_STATUS' },
      { endpoint: 'OCCUPATIONS', stateKey: 'FATHER_OCCUPATIONS' },
      { endpoint: 'OCCUPATIONS', stateKey: 'MOTHER_OCCUPATIONS' }
    ];

    masterTypesToLoad.forEach(item => fetchMasterList(item.endpoint, item.stateKey));
  }, []);

  // Fetch Cities dynamically when State changes
  useEffect(() => {
    if (formData.stateId > 0) {
      fetch(`https://crm.altawafumrah.com/api/Master/CITIES?parentId=${formData.stateId}`)
        .then(res => res.json())
        .then(json => { 
          const listData = Array.isArray(json) ? json : (json.data || json.Data || json.result || []);
          setMasterData(prev => ({ ...prev, CITIES: listData }));
        })
        .catch(err => console.error("Cities fetch error", err));
    } else {
      setMasterData(prev => ({ ...prev, CITIES: [] }));
    }
  }, [formData.stateId]);

  if (!isMounted) return null;

  const update = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors.includes(field)) setErrors(errors.filter(e => e !== field));
  };

  const handleFinalSubmit = async () => {
    setLoading(true);

    const session = localStorage.getItem("user_session");
    const userData = session ? JSON.parse(session) : null;
    const userId = userData?.userId;

    if (!userId) {
      alert("User ID not found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      const fd = new FormData();

      fd.append("UserId", String(userId));
      fd.append("FullName", userData?.fullName || "User");

      if (formData.dob) {
        fd.append("DateOfBirth", formData.dob);
      }

      fd.append("Height", formData.height);
      fd.append("Weight", formData.weight);
      fd.append("Complexion", String(formData.complexionId));
      
      fd.append("MaritalStatus", String(formData.maritalStatusId));
      fd.append("Religion", String(formData.religionId));
      fd.append("Sect", String(formData.sectId));
      fd.append("Maslak", String(formData.maslakId));
      fd.append("Caste", String(formData.casteId));
      fd.append("MotherTongue", String(formData.motherTongueId));

      fd.append("CurrentStateId", String(formData.stateId));
      fd.append("CurrentCityId", String(formData.cityId));

      fd.append("HighestDegree", String(formData.educationId));
      fd.append("EmploymentSector", String(formData.employmentSectorId));
      fd.append("Designation", String(formData.occupationId)); 
      fd.append("AnnualIncome", String(formData.income)); 

      fd.append("FamilyType", String(formData.familyTypeId));
      fd.append("FamilyStatus", String(formData.familyStatusId));
      fd.append("FatherOccupation", String(formData.fatherOccupationId));
      fd.append("MotherOccupation", String(formData.motherOccupationId));

      fd.append("PhotoPrivacy", formData.photoPrivacy);

      if (formData.photo) {
        fd.append("Photo", formData.photo);
      }

      const response = await fetch(
        "https://crm.altawafumrah.com/api/User/update-profile",
        {
          method: "POST",
          body: fd,
        }
      );

      const responseText = await response.text();
      let result: any = {};

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error("Non-JSON Response received:", responseText);
        throw new Error(`Server Error (${response.status}): ${responseText || "Unknown error"}`);
      }

      if (!response.ok) {
        throw new Error(result.message || result.Message || result.title || "Failed to update profile.");
      }

      const isSuccess = result.success === 1 || result.success === true || result.Success === 1 || result.Success === true;

      // Redirect directly on success without alert
      if (isSuccess) {
        if (session) {
          const sessionData = JSON.parse(session);
          sessionData.isProfileCompleted = true;
          localStorage.setItem('user_session', JSON.stringify(sessionData));
        }

        const days = 7;
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `is_profile_completed=1; expires=${expires}; path=/; SameSite=Lax`;

        window.location.href = "/dashboard";
      } else {
        alert(result.message || result.Message || "Update failed. Please try again.");
        setLoading(false);
      }
    } catch (error: any) {
      console.error("API Error caught:", error);
      alert(error.message || "API Error occurred");
      setLoading(false);
    }
  };

  const validateAndNext = () => {
    let currentFields: string[] = [];
    if (section === 1) currentFields = ['dob', 'height', 'weight'];
    if (section === 2) currentFields = ['complexionId', 'maritalStatusId'];
    if (section === 3) currentFields = ['religionId', 'sectId', 'maslakId', 'casteId', 'motherTongueId'];
    if (section === 4) currentFields = ['stateId', 'cityId'];
    if (section === 5) currentFields = ['educationId', 'employmentSectorId', 'occupationId', 'income'];
    if (section === 6) currentFields = ['familyTypeId', 'familyStatusId', 'fatherOccupationId', 'motherOccupationId'];
    
    if (section === 7) {
      if (!formData.photo) {
        setErrors(['photo']);
        alert("Profile photo is mandatory. Please select an image.");
        return;
      }
    }

    const missing = currentFields.filter(f => !formData[f as keyof typeof formData] || formData[f as keyof typeof formData] === 0);

    if (missing.length > 0) {
      setErrors(missing);
      return;
    } 

    if (section === 7) {
      handleFinalSubmit();
    } else {
      setSection(section + 1);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert("Only image files are allowed!");
        return;
      }
      update('photo', file);
      update('photoUrl', URL.createObjectURL(file));
      if (errors.includes('photo')) setErrors(errors.filter(e => e !== 'photo'));
    }
  };

  const percentage = Math.round((section / 7) * 100);

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-slate-800 flex flex-col">
      <nav className="fixed top-0 w-full z-[100] bg-white border-b border-slate-200 px-6 md:px-12 py-3 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-2">
          <div className="bg-rose-600 p-1.5 rounded-lg"><Heart fill="white" className="text-white" size={16} /></div>
          <span className="text-lg font-black tracking-tighter uppercase italic">PAKIZA <span className="text-rose-600 font-bold">RISHTE</span></span>
        </div>
        <div className="px-3 py-1 bg-rose-50 rounded-full border border-rose-100 flex items-center gap-1.5">
            <Crown size={12} className="text-rose-500" />
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Step {section} of 7</span>
        </div>
      </nav>

      {/* Added pb-28 on mobile to ensure content isn't hidden behind the fixed bottom buttons */}
      <div className="flex flex-1 pt-20 pb-28 md:pb-16">
        <div className="w-full lg:w-[60%] px-5 md:px-16 xl:px-24">
          <div className="max-w-xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div key={section} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
                        {getSectionIcon(section)} {getSectionTitle(section)}
                    </h1>
                    <p className="text-slate-400 text-[10px] font-bold mt-0.5 uppercase tracking-widest italic">All fields are mandatory</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                    {section === 1 && (
                      <>
                        <Input label="Date of Birth" type="date" value={formData.dob} fieldName="dob" onChange={(f:string, v:any)=>update(f, v)} errors={errors} />
                        <Select 
                          label="Height" 
                          value={formData.height} 
                          fieldName="height" 
                          isPlainString={true} 
                          onChange={(f:string, v:any)=>update(f, v)} 
                          options={["5 ft 0 in", "5 ft 1 in", "5 ft 2 in", "5 ft 3 in", "5 ft 4 in", "5 ft 5 in", "5 ft 6 in", "5 ft 7 in", "5 ft 8 in", "5 ft 9 in", "5 ft 10 in", "5 ft 11 in", "6 ft 0 in", "6 ft 1 in"].map(h => ({ id: h as any, value: h }))} 
                          errors={errors} 
                        />
                        <div className="md:col-span-2">
                          <Select 
                            label="Weight" 
                            value={formData.weight} 
                            fieldName="weight" 
                            isPlainString={true} 
                            onChange={(f:string, v:any)=>update(f, v)} 
                            options={["45 kg", "50 kg", "55 kg", "60 kg", "65 kg", "70 kg", "75 kg", "80 kg", "85 kg", "90 kg", "95 kg", "100 kg"].map(w => ({ id: w as any, value: w }))} 
                            errors={errors} 
                          />
                        </div>
                      </>
                    )}

                    {section === 2 && (
                      <>
                        <Select 
                          label="Complexion" 
                          value={formData.complexionText} 
                          fieldName="complexionId" 
                          onChange={(idKey: string, idVal: any, textKey: string, textVal: any) => { 
                            update(idKey, idVal); 
                            update(textKey, textVal); 
                          }} 
                          options={masterData.COMPLEXIONS} 
                          errors={errors} 
                        />
                        <Select 
                          label="Marital Status" 
                          value={formData.maritalStatusText} 
                          fieldName="maritalStatusId" 
                          onChange={(idKey: string, idVal: any, textKey: string, textVal: any) => { 
                            update(idKey, idVal); 
                            update(textKey, textVal); 
                          }} 
                          options={masterData.MARITAL_STATUS} 
                          errors={errors} 
                        />
                      </>
                    )}

                    {section === 3 && (
                      <>
                        <Select 
                          label="Religion" 
                          value={formData.religionText} 
                          fieldName="religionId" 
                          onChange={(idKey: string, idVal: any, textKey: string, textVal: any) => { 
                            update(idKey, idVal); 
                            update(textKey, textVal); 
                          }} 
                          options={masterData.RELIGIONS} 
                          errors={errors} 
                        />
                        <Select 
                          label="Sect" 
                          value={formData.sectText} 
                          fieldName="sectId" 
                          onChange={(idKey: string, idVal: any, textKey: string, textVal: any) => { 
                            update(idKey, idVal); 
                            update(textKey, textVal); 
                          }} 
                          options={masterData.SECTS} 
                          errors={errors} 
                        />
                        <Select 
                          label="Maslak" 
                          value={formData.maslakText} 
                          fieldName="maslakId" 
                          onChange={(idKey: string, idVal: any, textKey: string, textVal: any) => { 
                            update(idKey, idVal); 
                            update(textKey, textVal); 
                          }} 
                          options={masterData.MASLAKS} 
                          errors={errors} 
                        />
                        <Select 
                          label="Caste" 
                          value={formData.casteText} 
                          fieldName="casteId" 
                          onChange={(idKey: string, idVal: any, textKey: string, textVal: any) => { 
                            update(idKey, idVal); 
                            update(textKey, textVal); 
                          }} 
                          options={masterData.CASTES} 
                          errors={errors} 
                        />
                        <div className="md:col-span-2">
                          <Select 
                            label="Mother Tongue" 
                            value={formData.motherTongueText} 
                            fieldName="motherTongueId" 
                            onChange={(idKey: string, idVal: any, textKey: string, textVal: any) => { 
                              update(idKey, idVal); 
                              update(textKey, textVal); 
                            }} 
                            options={masterData.MOTHER_TONGUES} 
                            errors={errors} 
                          />
                        </div>
                      </>
                    )}

                    {section === 4 && (
                      <>
                        <Select 
                          label="State" 
                          value={formData.stateText} 
                          fieldName="stateId" 
                          onChange={(idKey: string, idVal: any, textKey: string, textVal: any) => { 
                            update(idKey, idVal); 
                            update(textKey, textVal); 
                            update('cityId', 0); 
                            update('cityText', ''); 
                          }} 
                          options={masterData.STATES} 
                          errors={errors} 
                        />
                        <Select 
                          label="City" 
                          value={formData.cityText} 
                          fieldName="cityId" 
                          onChange={(idKey: string, idVal: any, textKey: string, textVal: any) => { 
                            update(idKey, idVal); 
                            update(textKey, textVal); 
                          }} 
                          options={masterData.CITIES} 
                          errors={!formData.stateId ? [...errors, 'cityId'] : errors} 
                          disabled={!formData.stateId} 
                        />
                      </>
                    )}

                    {section === 5 && (
                      <>
                        <Select 
                          label="Highest Qualification" 
                          value={formData.educationText} 
                          fieldName="educationId" 
                          onChange={(idKey: string, idVal: any, textKey: string, textVal: any) => { 
                            update(idKey, idVal); 
                            update(textKey, textVal); 
                          }} 
                          options={masterData.EDUCATIONS} 
                          errors={errors} 
                        />
                        <Select 
                          label="Work Sector" 
                          value={formData.employmentSectorText} 
                          fieldName="employmentSectorId" 
                          onChange={(idKey: string, idVal: any, textKey: string, textVal: any) => { 
                            update(idKey, idVal); 
                            update(textKey, textVal); 
                          }} 
                          options={masterData.EMPLOYMENT_SECTORS} 
                          errors={errors} 
                        />
                        <Select 
                          label="Designation (Profession)" 
                          value={formData.occupationText} 
                          fieldName="occupationId" 
                          onChange={(idKey: string, idVal: any, textKey: string, textVal: any) => { 
                            update(idKey, idVal); 
                            update(textKey, textVal); 
                          }} 
                          options={masterData.OCCUPATIONS} 
                          errors={errors} 
                        />
                        <div className="md:col-span-2">
                          <Select 
                            label="Annual Income" 
                            value={formData.income} 
                            fieldName="income" 
                            isPlainString={true} 
                            onChange={(f:string, v:any)=>update(f, v)} 
                            options={["2-5 LPA", "5-10 LPA", "10-20 LPA", "20-50 LPA", "50 LPA+"].map(i => ({ id: i as any, value: i }))} 
                            errors={errors} 
                          />
                        </div>
                      </>
                    )}

                    {section === 6 && (
                      <>
                        <Select 
                          label="Family Type" 
                          value={formData.familyTypeText} 
                          fieldName="familyTypeId" 
                          onChange={(idKey: string, idVal: any, textKey: string, textVal: any) => { 
                            update(idKey, idVal); 
                            update(textKey, textVal); 
                          }} 
                          options={masterData.FAMILY_TYPES} 
                          errors={errors} 
                        />
                        <Select 
                          label="Family Status" 
                          value={formData.familyStatusText} 
                          fieldName="familyStatusId" 
                          onChange={(idKey: string, idVal: any, textKey: string, textVal: any) => { 
                            update(idKey, idVal); 
                            update(textKey, textVal); 
                          }} 
                          options={masterData.FAMILY_STATUS} 
                          errors={errors} 
                        />
                        <Select 
                          label="Father's Occupation" 
                          value={formData.fatherOccupationText} 
                          fieldName="fatherOccupationId" 
                          onChange={(idKey: string, idVal: any, textKey: string, textVal: any) => { 
                            update(idKey, idVal); 
                            update(textKey, textVal); 
                          }} 
                          options={masterData.FATHER_OCCUPATIONS} 
                          errors={errors} 
                        />
                        <Select 
                          label="Mother's Occupation" 
                          value={formData.motherOccupationText} 
                          fieldName="motherOccupationId" 
                          onChange={(idKey: string, idVal: any, textKey: string, textVal: any) => { 
                            update(idKey, idVal); 
                            update(textKey, textVal); 
                          }} 
                          options={masterData.MOTHER_OCCUPATIONS} 
                          errors={errors} 
                        />
                      </>
                    )}

                    {section === 7 && (
                      <div className="md:col-span-2 space-y-5 pt-1">
                        <input type="file" id="photo-v" hidden accept="image/*" onChange={handleImageChange} />
                        
                        <div 
                          onClick={() => document.getElementById('photo-v')?.click()} 
                          className={`relative p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                            errors.includes('photo') ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-rose-400'
                          }`}
                        >
                          {formData.photoUrl ? (
                            <div className="flex flex-col items-center gap-3">
                              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-rose-500 shadow-md">
                                <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                <CheckCircle2 size={12} /> Change Photo
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center py-2">
                              <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-2 shadow-xs">
                                <Camera size={24} />
                              </div>
                              <p className="text-xs font-black uppercase text-slate-700 tracking-wider">Upload Profile Photo</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5">Mandatory for verification</p>
                            </div>
                          )}
                        </div>

                        <PrivacyDropdown 
                          value={formData.photoPrivacy} 
                          onChange={(val: string) => update('photoPrivacy', val)} 
                        />
                      </div>
                    )}
                </div>

                {/* Desktop view navigation buttons (hidden on mobile) */}
                <div className="hidden md:flex pt-6 items-center gap-3 border-t border-slate-100">
                  <button 
                    onClick={() => section > 1 && setSection(section - 1)} 
                    className={`px-6 py-2.5 rounded-xl border border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 ${section === 1 ? 'invisible' : ''}`}
                  >
                    Back
                  </button>
                  <button 
                    onClick={validateAndNext} 
                    disabled={loading} 
                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[11px] tracking-[0.2em] shadow-lg hover:bg-rose-600 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : section === 7 ? "Complete Profile" : "Save & Continue"}
                    {!loading && <ChevronRight size={14} />}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-[40%] bg-slate-50/50 border-l border-slate-200 p-10 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto">
            <div className="space-y-8">
                <div className="px-8 py-8 bg-rose-600 rounded-3xl text-white shadow-xl relative overflow-hidden">
                    <Trophy className="absolute top-4 right-6 opacity-20" size={50} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1.5 text-rose-200">Match Readiness</p>
                    <div className="flex items-end gap-2 mb-3">
                        <h2 className="text-5xl font-black italic leading-none">{percentage}%</h2>
                        <span className="text-xs font-bold mb-1 opacity-70 tracking-widest uppercase">Score</span>
                    </div>
                    <div className="h-1.5 w-full bg-rose-800/50 rounded-full mt-3 overflow-hidden">
                        <motion.div animate={{ width: `${percentage}%` }} className="h-full bg-white rounded-full" />
                    </div>
                </div>
                <div className="flex items-start gap-3 p-5 bg-green-50 border border-green-100 rounded-2xl">
                    <ShieldCheck className="text-green-600 shrink-0" size={20} />
                    <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic">Your data is secured using enterprise-level encryption. Privacy is our #1 priority.</p>
                </div>
            </div>
        </div>
      </div>

      {/* Fixed Sticky Navigation Footer specifically optimized for Mobile view */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 px-5 py-3 z-[110] shadow-xl flex items-center gap-3">
        <button 
          onClick={() => section > 1 && setSection(section - 1)} 
          className={`px-5 py-3 rounded-xl border border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest bg-slate-50 active:scale-95 ${section === 1 ? 'invisible' : ''}`}
        >
          Back
        </button>
        <button 
          onClick={validateAndNext} 
          disabled={loading} 
          className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-[0.2em] shadow-lg hover:bg-rose-600 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : section === 7 ? "Complete Profile" : "Save & Continue"}
          {!loading && <ChevronRight size={14} />}
        </button>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", fieldName, errors, maxLength }: any) {
    const hasError = errors.includes(fieldName);
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center px-1">
                <label className={`text-[10px] font-black uppercase tracking-widest transition-colors ${hasError ? 'text-red-500' : 'text-slate-500'}`}>{label}</label>
                {maxLength && <span className="text-[9px] font-bold text-slate-300">{value?.length || 0}/{maxLength}</span>}
            </div>
            <input type={type} value={value} onChange={(e) => onChange(fieldName, e.target.value)} placeholder={placeholder} maxLength={maxLength} className={`px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none transition-all ${hasError ? 'border-red-500 bg-red-50' : 'focus:border-rose-500 shadow-2xs'}`} />
        </div>
    );
}

function Select({ label, options = [], value, onChange, fieldName, errors, disabled, isPlainString = false }: any) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const hasError = errors.includes(fieldName);
    
    const filtered = options.filter((o: MasterItem) => o.value?.toLowerCase().includes(search.toLowerCase()));

    // Reset search query when dropdown closes so full list is available next time
    useEffect(() => {
      if (!isOpen) {
        setSearch("");
      }
    }, [isOpen]);

    return (
        <div className={`flex flex-col gap-1.5 relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${hasError ? 'text-red-500' : 'text-slate-500'}`}>{label}</label>
            <div onClick={() => setIsOpen(!isOpen)} className={`px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold flex justify-between items-center cursor-pointer transition-all ${hasError ? 'border-red-500 bg-red-50' : 'focus:border-rose-500 shadow-2xs'}`}>
                <span className={value ? 'text-slate-800 truncate' : 'text-slate-300'}>{value || `Choose...`}</span>
                <Search size={14} className="text-slate-300 shrink-0 ml-2" />
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} className="absolute z-[150] top-[105%] left-0 w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                        <input className="w-full p-2.5 border-b border-slate-100 text-xs font-bold outline-none bg-slate-50" placeholder="Filter..." value={search} onChange={(e) => setSearch(e.target.value)} onClick={(e) => e.stopPropagation()}/>
                        <div className="max-h-40 overflow-y-auto">
                            {filtered.length > 0 ? filtered.map((opt: MasterItem) => (
                                <div key={opt.id} onClick={() => { 
                                    if (isPlainString) {
                                        onChange(fieldName, opt.value);
                                    } else {
                                        const idKey = fieldName;
                                        const textKey = fieldName.replace('Id', 'Text');
                                        onChange(idKey, opt.id, textKey, opt.value);
                                    }
                                    setIsOpen(false); 
                                }} className="px-4 py-2.5 hover:bg-rose-50 hover:text-rose-600 text-xs font-bold cursor-pointer transition-colors border-b border-slate-50 last:border-0">{opt.value}</div>
                            )) : <div className="p-3 text-[11px] text-slate-400">No results found</div>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function PrivacyDropdown({ value, onChange }: any) {
    const [isOpen, setIsOpen] = React.useState(false);
    const options = ["All Members", "Premium Only", "Only Approved"];

    return (
        <div className="flex flex-col gap-1.5 relative">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Photo Privacy Setting</label>
            <div onClick={() => setIsOpen(!isOpen)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold flex justify-between items-center cursor-pointer transition-all focus:border-rose-500 shadow-2xs">
                <div className="flex items-center gap-2">
                    <Lock size={14} className="text-rose-500" />
                    <span className="text-slate-800">{value}</span>
                </div>
                <ChevronRight size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 3 }} className="absolute z-[150] top-[105%] left-0 w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="p-1">
                            {options.map((opt) => (
                                <div key={opt} onClick={() => { onChange(opt); setIsOpen(false); }} className={`px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center justify-between ${value === opt ? 'bg-rose-50 text-rose-600' : 'hover:bg-slate-50 text-slate-700'}`}>
                                    <span>{opt}</span>
                                    {value === opt && <CheckCircle2 size={14} className="text-rose-600" />}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function getSectionTitle(step: number) {
    return ["Physical Attributes", "Personal Details", "Community & Roots", "Location", "Career & Professional", "Family Details", "Profile Photo"][step - 1];
}

function getSectionIcon(step: number) {
    const props = { size: 20, className: "text-rose-600 shrink-0" };
    const icons = [
      <User key="1" {...props}/>, 
      <Heart key="2" {...props}/>, 
      <Globe key="3" {...props}/>, 
      <Globe key="4" {...props}/>, 
      <Briefcase key="5" {...props}/>, 
      <Users key="6" {...props}/>, 
      <Camera key="7" {...props}/>
    ];
    return icons[step - 1];
}