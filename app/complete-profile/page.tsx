"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Crown, Sparkles, ChevronRight, Loader2, User, Heart, Globe, Briefcase, Users, Camera, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchMasterDataApi, fetchCitiesApi, updateProfileApi, MasterOption } from '@/lib/api';
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
    dob: '', height: '5 ft 6 in', weight: '60 kg', complexionId: 1, complexionText: '',
    maritalStatusId: 1, maritalStatusText: '', religionId: 1, religionText: '',
    sectId: 1, sectText: '', maslakId: 1, maslakText: '', casteId: 1, casteText: '',
    motherTongueId: 1, motherTongueText: '', stateId: 0, stateText: '', cityId: 0, cityText: '',
    educationId: 1, educationText: '', employmentSectorId: 1, employmentSectorText: '',
    occupationId: 1, occupationText: '', income: '5 - 10 LPA', familyTypeId: 1, familyTypeText: '',
    familyStatusId: 1, familyStatusText: '', fatherOccupation: 'Business Owner',
    motherOccupation: 'Homemaker', totalBrothers: 0, marriedBrothers: 0, totalSisters: 0, marriedSisters: 0,
    namazHabit: 'Regular 5 Times', hijabOrBeard: 'Hijab',
    photo: null as File | null, photoUrl: '', photoPrivacy: 'All Members'
  });

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop()?.split(';').shift() : null;
  };

  useEffect(() => {
    const loadAllMasters = async () => {
      const types = ['MARITAL_STATUS', 'RELIGIONS', 'SECTS', 'MASLAKS', 'CASTES', 'MOTHER_TONGUES', 'EDUCATIONS', 'EMPLOYMENT_SECTORS', 'OCCUPATIONS', 'STATES', 'FAMILY_TYPES', 'FAMILY_STATUS', 'Complexion'];
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
    const token = getCookie('user_token') || userData?.token;

    if (!token) {
      setApiError("Authentication token missing. Please login again.");
      setLoading(false);
      return;
    }

    const fd = new FormData();
    fd.append("UserId", String(userData?.userId || 0));
    fd.append("FullName", userData?.fullName || "User");
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

    const res = await updateProfileApi(fd, token);

    if (res.success) {
      if (session) {
        const sessionData = JSON.parse(session);
        sessionData.isProfileCompleted = true;
        localStorage.setItem('user_session', JSON.stringify(sessionData));
      }
      document.cookie = `is_profile_completed=1; path=/; SameSite=Lax; Secure`;
      router.push("/dashboard");
    } else {
      setApiError(res.message);
      setLoading(false);
    }
  };

  const validateAndNext = () => {
    let currentFields: string[] = [];
    if (section === 1) currentFields = ['dob', 'height', 'weight', 'complexionId'];
    if (section === 2) currentFields = ['maritalStatusId', 'religionId', 'sectId', 'maslakId', 'casteId', 'motherTongueId'];
    if (section === 3) currentFields = ['stateId', 'cityId'];
    if (section === 4) currentFields = ['educationId', 'employmentSectorId', 'occupationId', 'income'];
    if (section === 5) currentFields = ['familyTypeId', 'familyStatusId'];

    if (section === 6 && !formData.photo) {
      setErrors(['photo']);
      setApiError("Profile photo is mandatory.");
      return;
    }

    const missing = currentFields.filter(f => !formData[f as keyof typeof formData] || formData[f as keyof typeof formData] === 0);
    if (missing.length > 0) {
      setErrors(missing);
      setApiError("Please fill all mandatory fields.");
      return;
    }

    if (section === 6) handleFinalSubmit();
    else setSection(section + 1);
  };

  const percentage = Math.round((section / 6) * 100);
  const countOptions = Array.from({ length: 11 }, (_, i) => ({ id: i, value: String(i) }));
  const incomeOptions = ["2-5 LPA", "5-10 LPA", "10-20 LPA", "20-50 LPA", "50 LPA+"].map(i => ({ id: i, value: i }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-[#d91b5c] selection:text-white">
      {/* HEADER NAV */}
      <nav className="fixed top-0 w-full z-[100] bg-white/95 backdrop-blur-xl border-b-2 border-rose-100 px-4 sm:px-8 py-3.5 sm:py-4 flex justify-between items-center shadow-md shadow-rose-950/5">
        <img src="/logo.png" alt="Nikah Qubool Logo" className="h-10 sm:h-14 md:h-16 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).src = '/logo.jpg'; }} />
        <div className="px-4 py-2 bg-rose-50 rounded-full border-2 border-rose-200 flex items-center gap-2 shadow-xs">
          <Crown size={16} className="text-amber-500" />
          <span className="text-xs sm:text-sm font-black text-[#d91b5c] uppercase tracking-wider">Step {section} of 6</span>
        </div>
      </nav>

      {/* PROGRESS BAR */}
      <div className="fixed top-[68px] sm:top-[82px] left-0 w-full h-2 bg-slate-200/70 z-[101]">
        <motion.div animate={{ width: `${percentage}%` }} transition={{ duration: 0.4 }} className="h-full bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-amber-400 shadow-sm" />
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex flex-1 pt-28 sm:pt-34 pb-32 md:pb-16 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full lg:w-[70%] mx-auto px-2 sm:px-6">
          <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl border-2 border-rose-100">
            <AnimatePresence mode="wait">
              <motion.div key={section} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-rose-50 rounded-full text-[#d91b5c] border border-rose-200 text-[10px] font-black uppercase mb-2 shadow-xs">
                    <Sparkles size={12} className="text-amber-500" /> Mandatory Step
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-serif font-extrabold text-slate-900 flex items-center gap-3">
                    {getSectionIcon(section)} {getSectionTitle(section)}
                  </h1>
                </div>

                {apiError && (
                  <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl text-center text-xs font-bold text-rose-600 shadow-xs">
                    ⚠️ {apiError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 pt-2">
                  {section === 1 && (
                    <>
                      <DobAppPicker value={formData.dob} onChange={(val) => update('dob', val)} hasError={errors.includes('dob')} />
                      <CustomSelect label="Height" value={formData.height} fieldName="height" isPlainString={true} onChange={(f: string, v: any) => update(f, v)} options={["5 ft 0 in", "5 ft 1 in", "5 ft 2 in", "5 ft 3 in", "5 ft 4 in", "5 ft 5 in", "5 ft 6 in", "5 ft 7 in", "5 ft 8 in", "5 ft 9 in", "5 ft 10 in", "5 ft 11 in", "6 ft 0 in", "6 ft 1 in"].map(h => ({ id: h as any, value: h }))} errors={errors} />
                      <CustomSelect label="Weight" value={formData.weight} fieldName="weight" isPlainString={true} onChange={(f: string, v: any) => update(f, v)} options={["45 kg", "50 kg", "55 kg", "60 kg", "65 kg", "70 kg", "75 kg", "80 kg", "85 kg", "90 kg", "95 kg", "100 kg"].map(w => ({ id: w as any, value: w }))} errors={errors} />
                      <CustomSelect label="Complexion" value={formData.complexionText} fieldName="complexionId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.COMPLEXIONS} errors={errors} openUpward={true} />
                    </>
                  )}

                  {section === 2 && (
                    <>
                      <CustomSelect label="Marital Status" value={formData.maritalStatusText} fieldName="maritalStatusId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.MARITAL_STATUS} errors={errors} />
                      <CustomSelect label="Religion" value={formData.religionText} fieldName="religionId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.RELIGIONS} errors={errors} />
                      <CustomSelect label="Sect" value={formData.sectText} fieldName="sectId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.SECTS} errors={errors} />
                      <CustomSelect label="Maslak" value={formData.maslakText} fieldName="maslakId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.MASLAKS} errors={errors} />
                      <CustomSelect label="Caste / Community" value={formData.casteText} fieldName="casteId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.CASTES} errors={errors} openUpward={true} />
                      <CustomSelect label="Mother Tongue" value={formData.motherTongueText} fieldName="motherTongueId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.MOTHER_TONGUES} errors={errors} openUpward={true} />
                    </>
                  )}

                  {section === 3 && (
                    <>
                      <CustomSelect label="State" value={formData.stateText} fieldName="stateId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); update('cityId', 0); update('cityText', ''); }} options={masterData.STATES} errors={errors} />
                      <CustomSelect label="City" value={formData.cityText} fieldName="cityId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.CITIES} errors={errors} disabled={!formData.stateId} openUpward={true} />
                    </>
                  )}

                  {section === 4 && (
                    <>
                      <CustomSelect label="Highest Qualification" value={formData.educationText} fieldName="educationId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.EDUCATIONS} errors={errors} />
                      <CustomSelect label="Employment Sector" value={formData.employmentSectorText} fieldName="employmentSectorId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.EMPLOYMENT_SECTORS} errors={errors} />
                      <CustomSelect label="Occupation" value={formData.occupationText} fieldName="occupationId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.OCCUPATIONS} errors={errors} openUpward={true} />
                      <CustomSelect label="Annual Income Range" value={formData.income} fieldName="income" isPlainString={true} onChange={(f: string, v: any) => update(f, v)} options={incomeOptions} errors={errors} openUpward={true} />
                    </>
                  )}

                  {section === 5 && (
                    <>
                      <CustomSelect label="Family Type" value={formData.familyTypeText} fieldName="familyTypeId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.FAMILY_TYPES} errors={errors} />
                      <CustomSelect label="Family Status" value={formData.familyStatusText} fieldName="familyStatusId" onChange={(idK: string, idV: any, tK: string, tV: any) => { update(idK, idV); update(tK, tV); }} options={masterData.FAMILY_STATUS} errors={errors} />
                      <CompactSelect label="Father's Occupation" options={masterData.OCCUPATIONS || []} value={formData.fatherOccupation} onChange={(val) => update('fatherOccupation', (masterData.OCCUPATIONS || []).find(o => String(o.id) === String(val))?.value || val)} />
                      <CompactSelect label="Mother's Occupation" options={masterData.OCCUPATIONS || []} value={formData.motherOccupation} onChange={(val) => update('motherOccupation', (masterData.OCCUPATIONS || []).find(o => String(o.id) === String(val))?.value || val)} />
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
                        <span>{section === 6 ? "Complete Profile" : "Save & Continue"}</span>
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

function getSectionTitle(step: number) { return ["Birth & Attributes", "Religion & Community", "Location Details", "Career & Profession", "Family Details", "Profile Photo"][step - 1]; }
function getSectionIcon(step: number) { const props = { size: 22, className: "text-[#d91b5c] shrink-0" }; return [<User key="1" {...props}/>, <Heart key="2" {...props}/>, <Globe key="3" {...props}/>, <Briefcase key="4" {...props}/>, <Users key="5" {...props}/>, <Camera key="6" {...props}/>][step - 1]; }
