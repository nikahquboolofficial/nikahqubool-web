"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Crown, Sparkles, ChevronRight, Loader2, User, Heart, Globe, Briefcase, Users, Camera, ArrowLeft, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchMasterDataApi, fetchCitiesApi, updateProfileApi, fetchProfileDetailsApi, MasterOption } from '@/lib/api';
import DobAppPicker from '@/components/profile/DobAppPicker';
import CustomSelect from '@/components/profile/CustomSelect';
import CircularPhotoUpload from '@/components/profile/CircularPhotoUpload';
import ImageCropModal from '@/components/profile/ImageCropModal';
import MobileBottomNav from '@/components/profile/MobileBottomNav';
import { CompactSelect } from '@/components/profile/CompactSelect';

export default function CompleteProfilePage() {
  const router = useRouter();
  const [section, setSection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState('');

  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [masterData, setMasterData] = useState<{ [key: string]: MasterOption[] }>({});

  const [formData, setFormData] = useState({
    dob: '', 
    height: '', 
    weight: '', 
    complexionId: 0, 
    complexionText: '',
    maritalStatusId: 0, 
    maritalStatusText: '', 
    religionId: 0, 
    religionText: '',
    sectId: 0, 
    sectText: '', 
    maslakId: 0, 
    maslakText: '', 
    casteId: 0, 
    casteText: '',
    motherTongueId: 0, 
    motherTongueText: '', 
    stateId: 0, 
    stateText: '', 
    cityId: 0, 
    cityText: '',
    educationId: 0, 
    educationText: '', 
    employmentSectorId: 0, 
    employmentSectorText: '', 
    occupationId: 0, 
    occupationText: '', 
    income: '', 
    familyTypeId: 0, 
    familyTypeText: '',
    familyStatusId: 0, 
    familyStatusText: '', 
    fatherOccupation: '',
    motherOccupation: '', 
    totalBrothers: 0, 
    marriedBrothers: 0, 
    totalSisters: 0, 
    marriedSisters: 0,
    namazHabit: 'Regular 5 Times', 
    hijabOrBeard: 'Hijab',
    photo: null as File | null, 
    photoUrl: '', 
    photoPrivacy: 'All Members'
  });

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop()?.split(';').shift() : null;
  };

  const handleSessionExpired = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("user_session");
      localStorage.removeItem("user_token");
      document.cookie = "user_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    router.push('/login');
  };

  useEffect(() => {
    const session = typeof window !== 'undefined' ? localStorage.getItem("user_session") : null;
    const userData = session ? JSON.parse(session) : null;
    const token = userData?.token || getCookie('user_token');

    if (!token) {
      handleSessionExpired();
      return;
    }

    const loadAllMasters = async () => {
      const types = ['MARITAL_STATUS', 'RELIGIONS', 'SECTS', 'MASLAKS', 'CASTES', 'MOTHER_TONGUES', 'EDUCATIONS', 'EMPLOYMENT_SECTORS', 'OCCUPATIONS', 'STATES', 'FAMILY_TYPES', 'FAMILY_STATUS', 'Complexion'];
      try {
        const results = await Promise.all(
          types.map(async (t) => {
            const data = await fetchMasterDataApi(t);
            return { key: t === 'Complexion' ? 'COMPLEXIONS' : t, data };
          })
        );
        const masterObj: { [key: string]: MasterOption[] } = {};
        results.forEach(item => {
          masterObj[item.key] = item.data;
        });
        setMasterData(prev => ({ ...prev, ...masterObj }));
      } catch (err) {
        console.error("Master data load error", err);
      }
    };
    loadAllMasters();
  }, []);

  useEffect(() => {
    if (formData.stateId > 0) {
      fetchCitiesApi(formData.stateId).then(cities => setMasterData(prev => ({ ...prev, CITIES: cities })));
    }
  }, [formData.stateId]);

  const update = (field: string, val: any) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    if (errors.includes(field)) setErrors(errors.filter(e => e !== field));
    setApiError('');
  };

  const handleRawPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setApiError("Only JPG, PNG and WEBP images are allowed.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setRawImageSrc(reader.result as string);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = (croppedBlob: Blob, croppedUrl: string) => {
    const croppedFile = new File([croppedBlob], "profile_photo.jpg", { type: "image/jpeg" });
    update('photo', croppedFile);
    update('photoUrl', croppedUrl);
    setShowCropModal(false);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setApiError('');
    const session = typeof window !== 'undefined' ? localStorage.getItem("user_session") : null;
    const userData = session ? JSON.parse(session) : null;
    const token = userData?.token || getCookie('user_token');

    if (!token) {
      handleSessionExpired();
      return;
    }

    const fd = new FormData();
    fd.append("UserId", String(userData?.userId || 0));
    if (userData?.fullName && userData.fullName !== "User") {
      fd.append("FullName", userData.fullName);
    }
    if (formData.dob) fd.append("DateOfBirth", formData.dob);
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
    fd.append("FatherOccupation", formData.fatherOccupation);
    fd.append("MotherOccupation", formData.motherOccupation);
    fd.append("TotalBrothers", String(formData.totalBrothers));
    fd.append("MarriedBrothers", String(formData.marriedBrothers));
    fd.append("TotalSisters", String(formData.totalSisters));
    fd.append("MarriedSisters", String(formData.marriedSisters));
    fd.append("NamazHabit", formData.namazHabit);
    fd.append("HijabOrBeard", formData.hijabOrBeard);
    fd.append("PhotoPrivacy", formData.photoPrivacy);
    if (formData.photo) fd.append("Photo", formData.photo);

    try {
      const res = await updateProfileApi(fd, token);

      if (res.success) {
        if (session) {
          try {
            const sessionData = JSON.parse(session);
            sessionData.isProfileCompleted = true;
            localStorage.setItem('user_session', JSON.stringify(sessionData));
          } catch (e) {}
        }
        const expires = new Date(Date.now() + 7 * 864e5).toUTCString();
        const isSecure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `is_profile_completed=1; expires=${expires}; path=/; SameSite=Lax${isSecure}`;

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("user_photo_updated"));
          window.location.href = "/dashboard";
        }
      } else {
        // SAFE TYPE CHECK FOR ISUNAUTHORIZED
        if ((res as any)?.isUnauthorized) {
          handleSessionExpired();
          return;
        }
        setApiError(res.message || "Failed to update profile. Please try again.");
        setLoading(false);
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.response?.status === 401) {
        handleSessionExpired();
        return;
      }
      setApiError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const validateAndNext = () => {
    let currentFields: string[] = [];
    if (section === 1) currentFields = ['dob', 'height', 'weight', 'complexionId'];
    if (section === 2) currentFields = ['maritalStatusId', 'religionId', 'sectId', 'maslakId', 'casteId', 'motherTongueId'];
    if (section === 3) currentFields = ['stateId', 'cityId'];
    if (section === 4) currentFields = ['educationId', 'employmentSectorId', 'occupationId', 'income'];
    if (section === 5) currentFields = ['familyTypeId', 'familyStatusId', 'fatherOccupation', 'motherOccupation'];

    if (section === 6) {
      if (!formData.photo && !formData.photoUrl) {
        setErrors(['photo']);
        setApiError("Profile photo is mandatory to complete verification.");
        return;
      }
      handleFinalSubmit();
      return;
    }

    const missing = currentFields.filter(f => {
      const val = formData[f as keyof typeof formData];
      return val === undefined || val === null || val === '' || val === 0;
    });

    if (missing.length > 0) {
      setErrors(missing);
      setApiError("Please select all mandatory fields highlighted in red before proceeding.");
      return;
    }

    setErrors([]);
    setApiError('');
    setSection(section + 1);
  };

  const percentage = Math.round((section / 6) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 via-white to-slate-50 text-slate-800 font-sans pb-16 md:pb-0">
      
      {/* HEADER */}
      <header className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md border-b border-rose-100 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#d91b5c] to-rose-400 flex items-center justify-center text-white shadow-md shadow-rose-900/20">
              <Crown size={22} className="text-amber-300" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                Nikah<span className="text-[#d91b5c]">Qubool</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-2.5 py-0.5 rounded-full bg-rose-100 text-[#d91b5c] text-[10px] font-black uppercase tracking-wider">
                Step {section} of 6
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-600">Completion Status</span>
              <span className="text-sm font-black text-[#d91b5c]">{percentage}% Complete</span>
            </div>
            <div className="w-24 sm:w-32 bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <motion.div 
                className="bg-gradient-to-r from-[#d91b5c] to-amber-400 h-full rounded-full"
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* API / VALIDATION ERROR BANNER */}
        {apiError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-700 text-xs font-extrabold flex items-center gap-3 shadow-md"
          >
            <ShieldAlert size={18} className="shrink-0 text-rose-600" />
            <span>{apiError}</span>
          </motion.div>
        )}

        {/* STEP HEADER CARD */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-rose-950/5 border border-rose-100 relative overflow-hidden mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 shadow-xs">
              {getSectionIcon(section)}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#d91b5c] bg-rose-100 px-3 py-1 rounded-full">
                MANDATORY STEP {section} OF 6
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                {getSectionTitle(section)}
              </h1>
            </div>
          </div>

          {/* STEP CONTENT FORM */}
          <div className="pt-6 border-t border-slate-100">
            <AnimatePresence mode="wait">
              <motion.div
                key={section}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {section === 1 && (
                    <>
                      <div className="md:col-span-2">
                        <DobAppPicker 
                          value={formData.dob} 
                          onChange={(d) => update('dob', d)} 
                          hasError={errors.includes('dob')}
                        />
                      </div>
                      <CustomSelect label="Height *" value={formData.height} fieldName="height" isPlainString={true} onChange={(f: string, v: any) => update(f, v)} options={heightOptions} errors={errors} />
                      <CustomSelect label="Weight *" value={formData.weight} fieldName="weight" isPlainString={true} onChange={(f: string, v: any) => update(f, v)} options={weightOptions} errors={errors} />
                      <CustomSelect label="Complexion *" value={formData.complexionText} fieldName="complexionId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.COMPLEXIONS} errors={errors} openUpward={true} />
                    </>
                  )}

                  {section === 2 && (
                    <>
                      <CustomSelect label="Marital Status *" value={formData.maritalStatusText} fieldName="maritalStatusId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.MARITAL_STATUS} errors={errors} />
                      <CustomSelect label="Religion *" value={formData.religionText} fieldName="religionId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.RELIGIONS} errors={errors} />
                      <CustomSelect label="Sect *" value={formData.sectText} fieldName="sectId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.SECTS} errors={errors} />
                      <CustomSelect label="Maslak *" value={formData.maslakText} fieldName="maslakId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.MASLAKS} errors={errors} />
                      <CustomSelect label="Caste / Community *" value={formData.casteText} fieldName="casteId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.CASTES} errors={errors} openUpward={true} />
                      <CustomSelect label="Mother Tongue *" value={formData.motherTongueText} fieldName="motherTongueId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.MOTHER_TONGUES} errors={errors} openUpward={true} />
                    </>
                  )}

                  {section === 3 && (
                    <>
                      <CustomSelect label="State *" value={formData.stateText} fieldName="stateId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); update('cityId', 0); update('cityText', ''); }} options={masterData.STATES} errors={errors} />
                      <CustomSelect label="City *" value={formData.cityText} fieldName="cityId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.CITIES} errors={errors} disabled={!formData.stateId} openUpward={true} />
                    </>
                  )}

                  {section === 4 && (
                    <>
                      <CustomSelect label="Highest Qualification *" value={formData.educationText} fieldName="educationId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.EDUCATIONS} errors={errors} />
                      <CustomSelect label="Employment Sector *" value={formData.employmentSectorText} fieldName="employmentSectorId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.EMPLOYMENT_SECTORS} errors={errors} />
                      <CustomSelect label="Occupation *" value={formData.occupationText} fieldName="occupationId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.OCCUPATIONS} errors={errors} openUpward={true} />
                      <CustomSelect label="Annual Income Range *" value={formData.income} fieldName="income" isPlainString={true} onChange={(f: string, v: any) => update(f, v)} options={incomeOptions} errors={errors} openUpward={true} />
                    </>
                  )}

                  {section === 5 && (
                    <>
                      <CustomSelect label="Family Type *" value={formData.familyTypeText} fieldName="familyTypeId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.FAMILY_TYPES} errors={errors} />
                      <CustomSelect label="Family Status *" value={formData.familyStatusText} fieldName="familyStatusId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.FAMILY_STATUS} errors={errors} />
                      <CompactSelect label="Father's Occupation *" options={masterData.OCCUPATIONS || []} value={formData.fatherOccupation} onChange={(val) => update('fatherOccupation', (masterData.OCCUPATIONS || []).find(o => String(o.id) === String(val))?.value || val)} hasError={errors.includes('fatherOccupation')} />
                      <CompactSelect label="Mother's Occupation *" options={masterData.OCCUPATIONS || []} value={formData.motherOccupation} onChange={(val) => update('motherOccupation', (masterData.OCCUPATIONS || []).find(o => String(o.id) === String(val))?.value || val)} hasError={errors.includes('motherOccupation')} />
                    </>
                  )}

                  {section === 6 && (
                    <CircularPhotoUpload 
                      photoUrl={formData.photoUrl} 
                      privacyValue={formData.photoPrivacy} 
                      hasError={errors.includes('photo')} 
                      onRawSelect={handleRawPhotoSelect} 
                      onPrivacyChange={(v) => update('photoPrivacy', v)} 
                    />
                  )}
                </div>

                {/* DESKTOP FOOTER ACTION BUTTONS */}
                <div className="hidden md:flex pt-8 items-center gap-4 border-t-2 border-slate-100">
                  <button
                    onClick={() => section > 1 && setSection(section - 1)}
                    className={`px-7 py-3.5 rounded-2xl border-2 border-slate-300 text-slate-700 font-extrabold text-xs uppercase hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer ${
                      section === 1 ? 'invisible' : ''
                    }`}
                  >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </button>

                  <button
                    onClick={validateAndNext}
                    disabled={loading}
                    className="flex-1 py-4 bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] hover:brightness-110 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer border border-rose-300/30"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin text-amber-300" size={18} />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>{section === 6 ? "Complete Profile & Submit" : "Save & Continue"}</span>
                        <ChevronRight size={16} className="text-amber-300" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <MobileBottomNav currentSection={section} totalSections={6} loading={loading} onBack={() => section > 1 && setSection(section - 1)} onNext={validateAndNext} />

      {showCropModal && rawImageSrc && (
        <ImageCropModal imageSrc={rawImageSrc} onCropComplete={handleCropSave} onClose={() => setShowCropModal(false)} />
      )}
    </div>
  );
}

const heightOptions = [
  { id: '4 ft 10 in', value: '4 ft 10 in' }, { id: '5 ft 0 in', value: '5 ft 0 in' },
  { id: '5 ft 2 in', value: '5 ft 2 in' }, { id: '5 ft 4 in', value: '5 ft 4 in' },
  { id: '5 ft 6 in', value: '5 ft 6 in' }, { id: '5 ft 8 in', value: '5 ft 8 in' },
  { id: '5 ft 10 in', value: '5 ft 10 in' }, { id: '6 ft 0 in', value: '6 ft 0 in' },
  { id: '6 ft 2 in', value: '6 ft 2 in' }
];

const weightOptions = Array.from({ length: 50 }, (_, i) => {
  const kg = 45 + i;
  return { id: `${kg} kg`, value: `${kg} kg` };
});

const incomeOptions = [
  { id: 'Below 3 LPA', value: 'Below 3 LPA' },
  { id: '3 - 5 LPA', value: '3 - 5 LPA' },
  { id: '5 - 10 LPA', value: '5 - 10 LPA' },
  { id: '10 - 15 LPA', value: '10 - 15 LPA' },
  { id: '15 - 25 LPA', value: '15 - 25 LPA' },
  { id: '25+ LPA', value: '25+ LPA' }
];

function getSectionTitle(step: number) { return ["Birth & Personal Details", "Religion & Community", "Location Details", "Education & Profession", "Family Details", "Profile Photo"][step - 1]; }
function getSectionIcon(step: number) { const props = { size: 22, className: "text-[#d91b5c] shrink-0" }; return [<User key="1" {...props}/>, <Heart key="2" {...props}/>, <Globe key="3" {...props}/>, <Briefcase key="4" {...props}/>, <Users key="5" {...props}/>, <Camera key="6" {...props}/>][step - 1]; }