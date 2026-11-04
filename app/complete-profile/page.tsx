"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, ChevronRight, Loader2, ArrowLeft, Check, Search, 
  Camera, Lock, CheckCircle2, Calendar, Shield, ChevronDown,
  User, Mail, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { fetchMasterDataApi, fetchCitiesApi, updateProfileApi, fetchProfileDetailsApi, checkEmailAvailabilityApi, MasterOption } from '@/lib/api';
import { getAuthToken, syncUserProfilePhoto } from '@/lib/auth';

// MASTER FALLBACK DATA
const PROFILE_CREATED_FOR_OPTIONS = [
  { id: 1, value: "Self" },
  { id: 2, value: "Son", gender: "male" },
  { id: 3, value: "Daughter", gender: "female" },
  { id: 4, value: "Brother", gender: "male" },
  { id: 5, value: "Sister", gender: "female" },
  { id: 6, value: "Friend / Relative" }
];

const FALLBACK_MASTERS: { [key: string]: MasterOption[] } = {
  MARITAL_STATUS: [
    { id: 1, value: "Never Married" },
    { id: 2, value: "Divorced" },
    { id: 3, value: "Widowed" },
    { id: 4, value: "Awaiting Divorce" },
    { id: 5, value: "Annulled" }
  ],
  RELIGIONS: [
    { id: 1, value: "Islam" }
  ],
  SECTS: [
    { id: 1, value: "Sunni" },
    { id: 2, value: "Shia" },
    { id: 3, value: "Other" }
  ],
  MASLAKS: [
    { id: 1, value: "Deobandi" },
    { id: 2, value: "Barelvi" },
    { id: 3, value: "Ahle Hadith" },
    { id: 4, value: "Salafi" },
    { id: 5, value: "Jamaat-e-Islami" },
    { id: 6, value: "Other" }
  ],
  CASTES: [
    { id: 1, value: "Ansari / Momin" },
    { id: 2, value: "Shaikh / Sheikh" },
    { id: 3, value: "Syed" },
    { id: 4, value: "Pathan / Khan" },
    { id: 5, value: "Qureshi / Baig" },
    { id: 6, value: "Rayeen / Kunjra" },
    { id: 7, value: "Malik" },
    { id: 8, value: "Siddiqui" },
    { id: 9, value: "Farooqui" },
    { id: 10, value: "Chaudhary" },
    { id: 11, value: "Mughal" },
    { id: 12, value: "Mansoori / Dhunia" },
    { id: 13, value: "Idrisi / Darzi" },
    { id: 14, value: "Saifi / Lohar" },
    { id: 15, value: "Other" }
  ],
  MOTHER_TONGUES: [
    { id: 1, value: "Urdu" },
    { id: 2, value: "Hindi" },
    { id: 3, value: "English" },
    { id: 4, value: "Bengali" },
    { id: 5, value: "Punjabi" },
    { id: 6, value: "Gujarati" },
    { id: 7, value: "Marathi" },
    { id: 8, value: "Tamil" },
    { id: 9, value: "Telugu" },
    { id: 10, value: "Malayalam" }
  ],
  EDUCATIONS: [
    { id: 1, value: "B.Tech / B.E." },
    { id: 2, value: "B.Sc" },
    { id: 3, value: "B.Com" },
    { id: 4, value: "B.A." },
    { id: 5, value: "BCA" },
    { id: 6, value: "M.Tech / M.E." },
    { id: 7, value: "M.Sc" },
    { id: 8, value: "M.Com" },
    { id: 9, value: "M.A." },
    { id: 10, value: "MCA" },
    { id: 11, value: "MBA" },
    { id: 12, value: "MBBS / MD" },
    { id: 13, value: "BDS" },
    { id: 14, value: "LL.B / LL.M" },
    { id: 15, value: "High School / Diploma" }
  ],
  EMPLOYMENT_SECTORS: [
    { id: 1, value: "Private Sector" },
    { id: 2, value: "Government / Public Sector" },
    { id: 3, value: "Business / Self Employed" },
    { id: 4, value: "Defense / Civil Services" },
    { id: 5, value: "Not Working" }
  ],
  OCCUPATIONS: [
    { id: 1, value: "Software Engineer / IT Professional" },
    { id: 2, value: "Doctor / Healthcare Professional" },
    { id: 3, value: "Teacher / Professor" },
    { id: 4, value: "Chartered Accountant / Finance" },
    { id: 5, value: "Businessperson / Entrepreneur" },
    { id: 6, value: "Civil / Mechanical Engineer" },
    { id: 7, value: "Government Employee" },
    { id: 8, value: "Designer / Creative Professional" },
    { id: 9, value: "Homemaker" },
    { id: 10, value: "Other Professional" }
  ],
  STATES: [
    { id: 1, value: "Delhi" },
    { id: 2, value: "Uttar Pradesh" },
    { id: 3, value: "Maharashtra" },
    { id: 4, value: "Karnataka" },
    { id: 5, value: "Telangana" },
    { id: 6, value: "Bihar" },
    { id: 7, value: "West Bengal" },
    { id: 8, value: "Madhya Pradesh" },
    { id: 9, value: "Rajasthan" },
    { id: 10, value: "Gujarat" },
    { id: 11, value: "Haryana" },
    { id: 12, value: "Punjab" }
  ],
  FAMILY_TYPES: [
    { id: 1, value: "Nuclear Family" },
    { id: 2, value: "Joint Family" },
    { id: 3, value: "Extended Family" }
  ],
  FAMILY_STATUS: [
    { id: 1, value: "Middle Class" },
    { id: 2, value: "Upper Middle Class" },
    { id: 3, value: "High Class / Affluent" }
  ],
  COMPLEXIONS: [
    { id: 1, value: "Very Fair" },
    { id: 2, value: "Fair" },
    { id: 3, value: "Wheatish" },
    { id: 4, value: "Dark" }
  ],
  INCOME_RANGES: [
    { id: 1, value: "Below ₹2 Lakh" },
    { id: 2, value: "₹2 - 4 Lakhs" },
    { id: 3, value: "₹5 - 7 Lakhs" },
    { id: 4, value: "₹8 - 10 Lakhs" },
    { id: 5, value: "₹10 - 15 Lakhs" },
    { id: 6, value: "₹15 - 25 Lakhs" },
    { id: 7, value: "₹25 Lakhs+" }
  ]
};

const HEIGHT_OPTIONS: string[] = [
  "4'8\"", "4'9\"", "4'10\"", "4'11\"", "5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", 
  "5'5\"", "5'6\"", "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"", "6'0\"", "6'1\"", "6'2\"", "6'3\"", "6'4\""
];

const WEIGHT_OPTIONS: string[] = [
  "45 kg", "50 kg", "55 kg", "60 kg", "65 kg", "70 kg", "75 kg", "80 kg", "85 kg", "90+ kg"
];

const PRIVACY_OPTIONS = [
  { 
    id: "All Members", 
    title: "All Members (Public)", 
    desc: "Visible to all genuine verified members for 3x faster proposals", 
    icon: "🌐" 
  },
  { 
    id: "Only Approved", 
    title: "Only Approved Members", 
    desc: "Photo is protected; visible only after you accept their photo request", 
    icon: "🔒" 
  },
  { 
    id: "Premium Only", 
    title: "Premium Members Only", 
    desc: "Visible only to verified VIP / Paid subscribers", 
    icon: "👑" 
  }
];

// ⚡ LIGHTNING-FAST CLIENT-SIDE IMAGE COMPRESSOR (<50ms, reduces 5MB to ~150KB)
const compressPhoto = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

export default function CompleteProfilePage() {
  const router = useRouter();

  // Slide state: 1 to 17 (1 field per slide, except State & City together)
  const [step, setStep] = useState<number>(1);
  const totalSteps = 13;
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [privacySheetOpen, setPrivacySheetOpen] = useState(false);

  const [masterData, setMasterData] = useState<{ [key: string]: MasterOption[] }>(FALLBACK_MASTERS);
  const [cities, setCities] = useState<MasterOption[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    profileCreatedFor: 1,
    profileCreatedForText: 'Self',
    gender: 'male',
    fullName: '',
    email: '',
    maritalStatusId: 0,
    maritalStatusText: '',
    dob: '',
    height: "5'5\"",
    weight: '60 kg',
    complexionId: 0,
    complexionText: '',
    religionId: 1, // Default Islam (no user selection needed)
    religionText: 'Islam',
    sectId: 0,
    sectText: '',
    maslakId: 0,
    maslakText: '',
    casteId: 0,
    casteText: '',
    motherTongueId: 0,
    motherTongueText: '',
    stateId: '' as string | number,
    stateText: '',
    cityId: '' as string | number,
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
    aboutMe: '',
    photo: null as File | null,
    photoUrl: '',
    photoPrivacy: 'All Members'
  });

  // Modern DOB Picker Sub-states
  const [dobDay, setDobDay] = useState<string>('15');
  const [dobMonth, setDobMonth] = useState<string>('06');
  const [dobYear, setDobYear] = useState<string>('1998');

  // Compute live Age from selected DOB
  const calculatedAge = React.useMemo(() => {
    if (!dobDay || !dobMonth || !dobYear) return null;
    const birthDate = new Date(Number(dobYear), Number(dobMonth) - 1, Number(dobDay));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age : null;
  }, [dobDay, dobMonth, dobYear]);

  
  // Email check & validation state
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ available: boolean | null; message: string }>({ available: null, message: '' });

  const handleEmailBlur = async () => {
    const trimmed = formData.email.trim();
    if (!trimmed) {
      setEmailStatus({ available: null, message: '' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailStatus({ available: false, message: 'Please enter a valid email address.' });
      return;
    }
    setEmailChecking(true);
    let uId = undefined;
    try {
      const stored = localStorage.getItem('user_details') || localStorage.getItem('user_session');
      if (stored) uId = Number(JSON.parse(stored)?.userId);
    } catch (e) {}
    const res = await checkEmailAvailabilityApi(trimmed, uId);
    setEmailChecking(false);
    if (res?.available === false) {
      setEmailStatus({ available: false, message: res.message || 'This email is already in use by another account.' });
    } else {
      setEmailStatus({ available: true, message: 'Email is available.' });
    }
  };

  // Sync initial DOB
  useEffect(() => {
    if (dobYear && dobMonth && dobDay) {
      setFormData(prev => ({ ...prev, dob: `${dobYear}-${dobMonth}-${dobDay}` }));
    }
  }, [dobYear, dobMonth, dobDay]);

  const nextStep = () => {
    setSlideDirection('forward');
    setSearchQuery('');
    setStep(prev => Math.min(totalSteps, prev + 1));
  };

  const prevStep = () => {
    setSlideDirection('backward');
    setSearchQuery('');
    setStep(prev => Math.max(1, prev - 1));
  };

  // 🚀 INSTANT AUTO-ADVANCE: Selects, sets state, and moves smoothly to next slide
  const handleAutoAdvance = (fieldIdName: string, id: number | string, fieldTextName: string, text: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldIdName]: Number(id),
      [fieldTextName]: text
    }));

    // Quick 180ms visual feedback then advance
    setTimeout(() => {
      nextStep();
    }, 180);
  };

  const handleSimpleAdvance = (fieldName: string, val: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: val }));
    setTimeout(() => {
      nextStep();
    }, 180);
  };

  // Load masters on mount
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/');
      return;
    }

    
    // Prepopulate name, email, gender from stored user session
    try {
      const sessionRaw = localStorage.getItem('user_session') || localStorage.getItem('user_details');
      if (sessionRaw) {
        const u = JSON.parse(sessionRaw);
        const name = u.fullName || u.FullName || '';
        const em = u.email || u.Email || '';
        const gen = u.gender || u.Gender || '';
        const pFor = u.profileCreatedFor || u.ProfileCreatedFor || 0;
        setFormData(prev => ({
          ...prev,
          fullName: name && name !== 'User' && name !== 'New Member' ? name : prev.fullName,
          email: em && em !== 'null' ? em : prev.email,
          gender: gen ? gen.toLowerCase() : prev.gender,
          profileCreatedFor: pFor > 0 ? Number(pFor) : prev.profileCreatedFor
        }));
      }
    } catch (e) {}

    const loadAllMasters = async () => {
      const types = ['MARITAL_STATUS', 'SECTS', 'MASLAKS', 'CASTES', 'MOTHER_TONGUES', 'EDUCATIONS', 'EMPLOYMENT_SECTORS', 'OCCUPATIONS', 'STATES', 'FAMILY_TYPES', 'FAMILY_STATUS', 'Complexion'];
      try {
        const results = await Promise.all(
          types.map(async (t) => {
            const data = await fetchMasterDataApi(t);
            const masterKey = t === 'Complexion' ? 'COMPLEXIONS' : t;
            return { 
              key: masterKey, 
              data: (data && data.length > 0) ? data : (FALLBACK_MASTERS[masterKey] || []) 
            };
          })
        );
        const masterObj: { [key: string]: MasterOption[] } = {};
        results.forEach(item => { masterObj[item.key] = item.data; });
        setMasterData(prev => ({ ...FALLBACK_MASTERS, ...prev, ...masterObj }));
      } catch (err) {
        console.error("Master data load error", err);
      }
    };
    loadAllMasters();
  }, [router]);

  // Load cities when state changes
  useEffect(() => {
    if (formData.stateId !== '' && formData.stateId !== null && formData.stateId !== undefined) {
      setLoadingCities(true);
      fetchCitiesApi(formData.stateId)
        .then(res => {
          setCities(res || []);
          setLoadingCities(false);
        })
        .catch(() => {
          setCities([]);
          setLoadingCities(false);
        });
    } else {
      setCities([]);
    }
  }, [formData.stateId]);

  // Handle Photo Selection with instant compression
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file (JPEG, PNG, WEBP)');
      return;
    }

    toast.loading('Optimizing photo quality...', { id: 'compress-toast' });
    try {
      const compressed = await compressPhoto(file);
      const previewUrl = URL.createObjectURL(compressed);
      setFormData(prev => ({
        ...prev,
        photo: compressed,
        photoUrl: previewUrl
      }));
      toast.success('Photo ready!', { id: 'compress-toast' });
    } catch (err) {
      toast.dismiss('compress-toast');
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        photo: file,
        photoUrl: previewUrl
      }));
    }
  };

  // Final Profile Submit
  const handleFinalSubmit = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Session expired. Please login again.");
      router.push('/');
      return;
    }

    setLoading(true);
    setSubmitStatus("Saving your profile...");

    let userData: any = null;
    const session = typeof window !== 'undefined' ? localStorage.getItem('user_session') || localStorage.getItem('user_details') : null;
    if (session) {
      try { userData = JSON.parse(session); } catch (e) {}
    }

    const fd = new FormData();
    fd.append("UserId", String(userData?.userId || 0));
    const finalFullName = formData.fullName || userData?.fullName || "";
    if (finalFullName && finalFullName !== "User" && finalFullName !== "New Member") {
      fd.append("FullName", finalFullName);
    }
    if (formData.email) fd.append("Email", formData.email);
    if (formData.gender) fd.append("Gender", formData.gender);
    if (formData.profileCreatedFor) fd.append("ProfileCreatedFor", String(formData.profileCreatedFor));
    if (formData.dob) fd.append("DateOfBirth", formData.dob);
    fd.append("Height", formData.height);
    fd.append("Weight", formData.weight);
    fd.append("Complexion", String(formData.complexionId || 2));
    fd.append("MaritalStatus", String(formData.maritalStatusId || 1));
    fd.append("Religion", String(formData.religionId || 1));
    fd.append("Sect", String(formData.sectId || 1));
    fd.append("Maslak", String(formData.maslakId || 1));
    fd.append("Caste", String(formData.casteId || 1));
    fd.append("MotherTongue", String(formData.motherTongueId || 1));
    fd.append("CurrentStateId", String(formData.stateId || 2));
    fd.append("CurrentCityId", String(formData.cityId || 1));
    fd.append("HighestDegree", String(formData.educationId || 1));
    fd.append("EmploymentSector", String(formData.employmentSectorId || 1));
    fd.append("Designation", String(formData.occupationId || 1));
    fd.append("AnnualIncome", formData.income || "₹5 - 7 Lakhs");
    fd.append("FamilyType", String(formData.familyTypeId || 1));
    fd.append("FamilyStatus", String(formData.familyStatusId || 1));
    fd.append("FatherOccupation", formData.fatherOccupation || "Businessman");
    fd.append("MotherOccupation", formData.motherOccupation || "Homemaker");
    fd.append("TotalBrothers", String(formData.totalBrothers || 0));
    fd.append("MarriedBrothers", String(formData.marriedBrothers || 0));
    fd.append("TotalSisters", String(formData.totalSisters || 0));
    fd.append("MarriedSisters", String(formData.marriedSisters || 0));
    fd.append("NamazHabit", formData.namazHabit || "Regular 5 Times");
    fd.append("HijabOrBeard", formData.hijabOrBeard || "Hijab");
    fd.append("PhotoPrivacy", formData.photoPrivacy || "All Members");
    if (formData.aboutMe) fd.append("AboutMe", formData.aboutMe);

    if (formData.photo) {
      setSubmitStatus("Uploading optimized photo to Cloudflare R2...");
      fd.append("Photo", formData.photo);
    }

    try {
      setSubmitStatus("Finalizing verification & saving...");
      const res = await updateProfileApi(fd, token);

      if (res.success) {
        let updatedSessionData: any = session ? JSON.parse(session) : {};
        updatedSessionData.isProfileCompleted = true;
        if (finalFullName) { updatedSessionData.fullName = finalFullName; updatedSessionData.FullName = finalFullName; }
        if (formData.email) { updatedSessionData.email = formData.email; updatedSessionData.Email = formData.email; }
        if (formData.gender) { updatedSessionData.gender = formData.gender; updatedSessionData.Gender = formData.gender; }
        if (formData.profileCreatedFor) { updatedSessionData.profileCreatedFor = formData.profileCreatedFor; }

        // 1. Fetch fresh profile details from API to get the canonical Cloudflare URL
        try {
          const freshDetails = await fetchProfileDetailsApi(userData?.userId || 0, token);
          if (freshDetails.success && freshDetails.data) {
            const p = freshDetails.data.profile || freshDetails.data.Profile || freshDetails.data;
            const canonicalPhoto = p.mainPhotoUrl || p.photoUrl || p.PhotoUrl || p.mainPhoto || p.photo;
            if (canonicalPhoto) {
              updatedSessionData.mainPhotoUrl = canonicalPhoto;
              updatedSessionData.photoUrl = canonicalPhoto;
              updatedSessionData.PhotoUrl = canonicalPhoto;
              updatedSessionData.photo = canonicalPhoto;
              updatedSessionData.mainPhoto = canonicalPhoto;
              syncUserProfilePhoto(canonicalPhoto);
              if (typeof window !== "undefined") {
                localStorage.setItem('cached_profile_details', JSON.stringify(p));
              }
            }
          }
        } catch (fetchErr) {
          const mainPhoto = (res as any)?.photoUrl || (res as any)?.PhotoUrl || (res as any)?.data?.photoUrl || formData.photoUrl || '';
          if (mainPhoto) {
            updatedSessionData.mainPhotoUrl = mainPhoto;
            updatedSessionData.photoUrl = mainPhoto;
            updatedSessionData.photo = mainPhoto;
            updatedSessionData.mainPhoto = mainPhoto;
            syncUserProfilePhoto(mainPhoto);
          }
        }

        if (typeof window !== "undefined") {
          localStorage.setItem('user_session', JSON.stringify(updatedSessionData));
          localStorage.setItem('user_details', JSON.stringify(updatedSessionData));
          localStorage.setItem('is_profile_completed', '1');
        }

        const expires = new Date(Date.now() + 14 * 864e5).toUTCString();
        const isSecure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `is_profile_completed=1; expires=${expires}; path=/; SameSite=Lax${isSecure}`;

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("user_photo_updated"));
        }

        toast.success("Profile completed successfully! Welcome to your Dashboard.");
        setTimeout(() => {
          router.push('/dashboard');
        }, 300);
      } else {
        toast.error(res.message || "Unable to save profile. Please try again.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
      setSubmitStatus("");
    }
  };

  const progressPercent = Math.round((step / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 flex flex-col justify-between selection:bg-[#e21e5b] selection:text-white">
      <Toaster position="top-center" richColors />

      {/* 🌟 TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100 px-4 py-2.5 sm:py-3 flex items-center justify-between max-w-md mx-auto w-full">
        {step > 1 ? (
          <button 
            type="button"
            onClick={prevStep}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer active:scale-90"
            aria-label="Previous step"
          >
            <ArrowLeft size={16} className="stroke-[2.5]" />
          </button>
        ) : (
          <div className="w-9" />
        )}

        {/* STEP BADGE */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#e21e5b]">
            Step {step} of {totalSteps}
          </span>
          <span className="text-[10px] text-slate-400 font-bold">
            {progressPercent}% Completed
          </span>
        </div>

        {/* Spacer to keep center alignment (NO SKIP BUTTON per user rule) */}
        <div className="w-9" />
      </header>

      {/* PROGRESS BAR */}
      <div className="w-full bg-slate-200 h-1 max-w-md mx-auto">
        <motion.div 
          className="bg-gradient-to-r from-[#e21e5b] via-[#ce1b53] to-[#e21e5b] h-full"
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.25 }}
        />
      </div>

      {/* 🌟 MAIN CONTAINER (TOP-ALIGNED, NOT CENTERED) */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-3 pb-8 flex flex-col justify-start">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: slideDirection === 'forward' ? 25 : -25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slideDirection === 'forward' ? -25 : 25 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full space-y-4"
          >

            {/* =========================================================
                SLIDE 1: BASIC IDENTITY (PROFILE FOR, NAME, EMAIL, GENDER)
                ========================================================= */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e21e5b]">Basic Identity</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    Who are you creating this profile for?
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">Select relationship and basic profile details</p>
                </div>

                {/* 1. Relationship Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Profile Created For
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PROFILE_CREATED_FOR_OPTIONS.map((opt) => {
                      const isSelected = formData.profileCreatedFor === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            const newGender = opt.gender ? opt.gender : formData.gender;
                            setFormData(prev => ({
                              ...prev,
                              profileCreatedFor: opt.id,
                              profileCreatedForText: opt.value,
                              gender: newGender
                            }));
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                            isSelected
                              ? 'border-[#e21e5b] bg-rose-50 text-[#e21e5b] shadow-2xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {opt.value}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Gender Selection (Only if Self or Friend / Relative) */}
                {(formData.profileCreatedFor === 1 || formData.profileCreatedFor === 6) && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Gender
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { val: 'male', label: 'Groom (Male)' },
                        { val: 'female', label: 'Bride (Female)' }
                      ].map(g => (
                        <button
                          key={g.val}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, gender: g.val }))}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                            formData.gender === g.val
                              ? 'border-[#e21e5b] bg-rose-50 text-[#e21e5b] shadow-2xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Full Name <span className="text-[#e21e5b]">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="e.g. Farhan Ali / Ayesha Khan"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#e21e5b] focus:ring-2 focus:ring-[#e21e5b]/10 text-xs font-bold text-slate-800 outline-none transition-all placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* 4. Email Address with Duplicate Verification */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Email Address <span className="text-[#e21e5b]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, email: val }));
                        if (emailStatus.message) setEmailStatus({ available: null, message: '' });
                      }}
                      onBlur={handleEmailBlur}
                      placeholder="e.g. name@gmail.com"
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs font-bold text-slate-800 outline-none transition-all placeholder-slate-400 ${
                        emailStatus.available === false 
                          ? 'border-rose-400 bg-rose-50/30' 
                          : emailStatus.available === true 
                            ? 'border-emerald-400 bg-emerald-50/20' 
                            : 'border-slate-200 focus:border-[#e21e5b] focus:ring-2 focus:ring-[#e21e5b]/10'
                      }`}
                    />
                    {emailChecking && (
                      <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" size={15} />
                    )}
                    {!emailChecking && emailStatus.available === true && (
                      <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500" size={15} />
                    )}
                  </div>
                  {emailStatus.message && (
                    <p className={`text-[11px] font-bold px-1 ${emailStatus.available === false ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {emailStatus.message}
                    </p>
                  )}
                </div>

                {/* Continue Button for Step 1 */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={
                      !formData.fullName.trim() || 
                      formData.fullName.trim().length < 2 || 
                      !formData.email.trim() || 
                      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()) ||
                      emailStatus.available === false ||
                      emailChecking
                    }
                    onClick={() => {
                      if (emailStatus.available === null) {
                        handleEmailBlur().then(() => nextStep());
                      } else {
                        nextStep();
                      }
                    }}
                    className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                      formData.fullName.trim().length >= 2 && 
                      formData.email.trim() && 
                      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()) &&
                      emailStatus.available !== false &&
                      !emailChecking
                        ? 'bg-gradient-to-r from-[#e21e5b] to-[#ce1b53] text-white shadow-md cursor-pointer hover:brightness-105 active:scale-[0.99]'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span>Continue</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* =========================================================
                SLIDE 2: MARITAL STATUS (AUTO-ADVANCE)
                ========================================================= */}
            {step === 2 && (
              <div className="space-y-3">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e21e5b]">Basic Details</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    What is your marital status?
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">Select an option to proceed</p>
                </div>

                <div className="space-y-2 pt-1">
                  {(masterData.MARITAL_STATUS || []).map((opt) => {
                    const isSelected = formData.maritalStatusId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleAutoAdvance('maritalStatusId', opt.id, 'maritalStatusText', opt.value)}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer ${
                          isSelected 
                            ? 'border-[#e21e5b] bg-rose-50/70 text-[#e21e5b] font-bold shadow-2xs' 
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-medium'
                        }`}
                      >
                        <span className="text-xs uppercase tracking-wide">{opt.value}</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? 'bg-[#e21e5b] text-white shadow-2xs' : 'border border-slate-300'
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =========================================================
                SLIDE 3: MODERN UNIQUE DATE OF BIRTH PICKER (CONTINUE)
                ========================================================= */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e21e5b]">Age Verification</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    What is your date of birth?
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">Choose your birth year, month & day</p>
                </div>

                {/* Unique Modern DOB Selector */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  
                  {/* Live Age Badge */}
                  {calculatedAge && (
                    <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full bg-rose-50 text-[#e21e5b] font-black text-xs border border-rose-200">
                      <span>🎉</span>
                      <span>{calculatedAge} Years Old</span>
                    </div>
                  )}

                  {/* 1. Year Selector (Sleek Horizontal Pills) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Birth Year
                    </label>
                    <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
                      {Array.from({ length: 36 }, (_, i) => `${2006 - i}`).map(yr => {
                        const isYearActive = dobYear === yr;
                        return (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => setDobYear(yr)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                              isYearActive 
                                ? 'bg-[#e21e5b] text-white shadow-xs' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {yr}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Month Selector (12 Compact Pills in 4x3 Grid) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Birth Month
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: '01', name: 'Jan' }, { id: '02', name: 'Feb' }, { id: '03', name: 'Mar' }, { id: '04', name: 'Apr' },
                        { id: '05', name: 'May' }, { id: '06', name: 'Jun' }, { id: '07', name: 'Jul' }, { id: '08', name: 'Aug' },
                        { id: '09', name: 'Sep' }, { id: '10', name: 'Oct' }, { id: '11', name: 'Nov' }, { id: '12', name: 'Dec' }
                      ].map(m => {
                        const isMonthActive = dobMonth === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setDobMonth(m.id)}
                            className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isMonthActive 
                                ? 'bg-[#e21e5b] text-white shadow-xs' 
                                : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {m.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Day Selector (Horizontal / 7-col grid) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Birth Day ({dobDay || 'Select'})
                    </label>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 31 }, (_, i) => {
                        const dStr = i + 1 < 10 ? `0${i + 1}` : `${i + 1}`;
                        const isDayActive = dobDay === dStr;
                        return (
                          <button
                            key={dStr}
                            type="button"
                            onClick={() => setDobDay(dStr)}
                            className={`py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                              isDayActive 
                                ? 'bg-[#e21e5b] text-white shadow-xs' 
                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {i + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full py-3 bg-[#e21e5b] hover:bg-[#ce1b53] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Continue</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            )}

            {/* =========================================================
                SLIDE 4: HEIGHT (AUTO-ADVANCE)
                ========================================================= */}
            {step === 4 && (
              <div className="space-y-3">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e21e5b]">Physical Profile</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    What is your height?
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">Select your height in feet and inches</p>
                </div>

                <div className="max-h-[56vh] overflow-y-auto space-y-1.5 pr-1 no-scrollbar pt-1">
                  {HEIGHT_OPTIONS.map((h) => {
                    const isSelected = formData.height === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => handleSimpleAdvance('height', h)}
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer ${
                          isSelected 
                            ? 'border-[#e21e5b] bg-rose-50/70 text-[#e21e5b] font-bold shadow-2xs' 
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-medium'
                        }`}
                      >
                        <span className="text-xs uppercase tracking-wide">{h}</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? 'bg-[#e21e5b] text-white shadow-2xs' : 'border border-slate-300'
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =========================================================
                SLIDE 5: SECT (AUTO-ADVANCE)
                ========================================================= */}
            {step === 5 && (
              <div className="space-y-3">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e21e5b]">Community</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    Which sect do you follow?
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">Tap your sect to continue</p>
                </div>

                <div className="space-y-2 pt-1">
                  {(masterData.SECTS || []).map((opt) => {
                    const isSelected = formData.sectId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleAutoAdvance('sectId', opt.id, 'sectText', opt.value)}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer ${
                          isSelected 
                            ? 'border-[#e21e5b] bg-rose-50/70 text-[#e21e5b] font-bold shadow-2xs' 
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-medium'
                        }`}
                      >
                        <span className="text-xs uppercase tracking-wide">{opt.value}</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? 'bg-[#e21e5b] text-white shadow-2xs' : 'border border-slate-300'
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =========================================================
                SLIDE 6: MASLAK (AUTO-ADVANCE)
                ========================================================= */}
            {step === 6 && (
              <div className="space-y-3">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e21e5b]">Community</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    Which maslak do you follow?
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">Select your school of thought</p>
                </div>

                <div className="space-y-2 pt-1">
                  {(masterData.MASLAKS || []).map((opt) => {
                    const isSelected = formData.maslakId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleAutoAdvance('maslakId', opt.id, 'maslakText', opt.value)}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer ${
                          isSelected 
                            ? 'border-[#e21e5b] bg-rose-50/70 text-[#e21e5b] font-bold shadow-2xs' 
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-medium'
                        }`}
                      >
                        <span className="text-xs uppercase tracking-wide">{opt.value}</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? 'bg-[#e21e5b] text-white shadow-2xs' : 'border border-slate-300'
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =========================================================
                SLIDE 9: CASTE / BIRADARI (AUTO-ADVANCE WITH SEARCH)
                ========================================================= */}
            {step === 7 && (
              <div className="space-y-3">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e21e5b]">Roots & Heritage</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    What is your caste / biradari?
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">Select your biradari to match compatible proposals</p>
                </div>

                {/* Quick Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search caste / biradari..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#e21e5b]"
                  />
                </div>

                <div className="max-h-[50vh] overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                  {(masterData.CASTES || [])
                    .filter(c => c.value.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((opt) => {
                      const isSelected = formData.casteId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleAutoAdvance('casteId', opt.id, 'casteText', opt.value)}
                          className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer ${
                            isSelected 
                              ? 'border-[#e21e5b] bg-rose-50/70 text-[#e21e5b] font-bold shadow-2xs' 
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-medium'
                          }`}
                        >
                          <span className="text-xs uppercase tracking-wide">{opt.value}</span>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            isSelected ? 'bg-[#e21e5b] text-white shadow-2xs' : 'border border-slate-300'
                          }`}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* =========================================================
                SLIDE 8: STATE & CITY TOGETHER
                ========================================================= */}
            {step === 8 && (
              <div className="space-y-4">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e21e5b]">Location</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    Where do you live?
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">Select your current state & city</p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">State *</label>
                    <select
                      value={formData.stateId !== '' ? String(formData.stateId) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setFormData(p => ({ ...p, stateId: '', stateText: '', cityId: '', cityText: '' }));
                          setCities([]);
                          return;
                        }
                        const sId = Number(val);
                        const sObj = (masterData.STATES || []).find(s => Number(s.id) === sId);
                        setFormData(p => ({ ...p, stateId: sId, stateText: sObj?.value || '', cityId: '', cityText: '' }));
                      }}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#e21e5b] cursor-pointer"
                    >
                      <option value="">-- Choose State --</option>
                      {(masterData.STATES || []).map(s => (
                        <option key={String(s.id)} value={String(s.id)}>{s.value}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">City *</label>
                    <select
                      disabled={formData.stateId === '' || loadingCities}
                      value={formData.cityId !== '' ? String(formData.cityId) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setFormData(p => ({ ...p, cityId: '', cityText: '' }));
                          return;
                        }
                        const cId = Number(val);
                        const cObj = cities.find(c => Number(c.id) === cId);
                        setFormData(p => ({ ...p, cityId: cId, cityText: cObj?.value || '' }));
                      }}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#e21e5b] cursor-pointer disabled:opacity-50"
                    >
                      <option value="">
                        {loadingCities 
                          ? "Loading cities..." 
                          : formData.stateId === '' 
                            ? "Please select state first" 
                            : cities.length === 0 
                              ? "No cities available" 
                              : "-- Choose City --"}
                      </option>
                      {cities.map(c => (
                        <option key={String(c.id)} value={String(c.id)}>{c.value}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (formData.stateId === '' || formData.stateId === null || formData.stateId === undefined) {
                      toast.error("Please select your State.");
                      return;
                    }
                    if (formData.cityId === '' || formData.cityId === null || formData.cityId === undefined) {
                      toast.error("Please select your City.");
                      return;
                    }
                    nextStep();
                  }}
                  className={`w-full py-3 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5 ${
                    formData.stateId !== '' && formData.cityId !== ''
                      ? 'bg-[#e21e5b] hover:bg-[#ce1b53]'
                      : 'bg-slate-400 hover:bg-slate-500'
                  }`}
                >
                  <span>Continue</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            )}

            {/* =========================================================
                SLIDE 12: EDUCATION LEVEL (AUTO-ADVANCE)
                ========================================================= */}
            {step === 9 && (
              <div className="space-y-3">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e21e5b]">Education</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    What is your highest qualification?
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">Select your highest degree</p>
                </div>

                <div className="max-h-[56vh] overflow-y-auto space-y-1.5 pr-1 no-scrollbar pt-1">
                  {(masterData.EDUCATIONS || []).map((opt) => {
                    const isSelected = formData.educationId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleAutoAdvance('educationId', opt.id, 'educationText', opt.value)}
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer ${
                          isSelected 
                            ? 'border-[#e21e5b] bg-rose-50/70 text-[#e21e5b] font-bold shadow-2xs' 
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-medium'
                        }`}
                      >
                        <span className="text-xs uppercase tracking-wide">{opt.value}</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? 'bg-[#e21e5b] text-white shadow-2xs' : 'border border-slate-300'
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =========================================================
                SLIDE 13: EMPLOYMENT SECTOR (AUTO-ADVANCE)
                ========================================================= */}
            {step === 10 && (
              <div className="space-y-3">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e21e5b]">Career</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    Where do you work?
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">Select your employment sector</p>
                </div>

                <div className="space-y-2 pt-1">
                  {(masterData.EMPLOYMENT_SECTORS || []).map((opt) => {
                    const isSelected = formData.employmentSectorId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleAutoAdvance('employmentSectorId', opt.id, 'employmentSectorText', opt.value)}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer ${
                          isSelected 
                            ? 'border-[#e21e5b] bg-rose-50/70 text-[#e21e5b] font-bold shadow-2xs' 
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-medium'
                        }`}
                      >
                        <span className="text-xs uppercase tracking-wide">{opt.value}</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? 'bg-[#e21e5b] text-white shadow-2xs' : 'border border-slate-300'
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =========================================================
                SLIDE 14: PROFESSION / OCCUPATION (AUTO-ADVANCE)
                ========================================================= */}
            {step === 11 && (
              <div className="space-y-3">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e21e5b]">Career</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    What is your profession?
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">Select your job role / occupation</p>
                </div>

                <div className="max-h-[56vh] overflow-y-auto space-y-1.5 pr-1 no-scrollbar pt-1">
                  {(masterData.OCCUPATIONS || []).map((opt) => {
                    const isSelected = formData.occupationId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleAutoAdvance('occupationId', opt.id, 'occupationText', opt.value)}
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer ${
                          isSelected 
                            ? 'border-[#e21e5b] bg-rose-50/70 text-[#e21e5b] font-bold shadow-2xs' 
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-medium'
                        }`}
                      >
                        <span className="text-xs uppercase tracking-wide">{opt.value}</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? 'bg-[#e21e5b] text-white shadow-2xs' : 'border border-slate-300'
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =========================================================
                SLIDE 15: ANNUAL INCOME (AUTO-ADVANCE)
                ========================================================= */}
            {step === 12 && (
              <div className="space-y-3">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e21e5b]">Financials</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    What is your annual income?
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">Select your approximate income range</p>
                </div>

                <div className="space-y-2 pt-1">
                  {(masterData.INCOME_RANGES || []).map((opt) => {
                    const isSelected = formData.income === opt.value;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSimpleAdvance('income', opt.value)}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer ${
                          isSelected 
                            ? 'border-[#e21e5b] bg-rose-50/70 text-[#e21e5b] font-bold shadow-2xs' 
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-medium'
                        }`}
                      >
                        <span className="text-xs uppercase tracking-wide">{opt.value}</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? 'bg-[#e21e5b] text-white shadow-2xs' : 'border border-slate-300'
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =========================================================
                SLIDE 13: PHOTO, SLEEK PRIVACY DROPDOWN & FINAL SUBMIT
                ========================================================= */}
            {step === 13 && (
              <div className="space-y-4">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e21e5b]">Final Step</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    Upload profile photo
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">Profiles with photo get 10X more genuine proposals</p>
                </div>

                {/* HIDDEN FILE PICKER */}
                <input 
                  type="file" 
                  id="final-photo-picker" 
                  hidden 
                  accept="image/jpeg,image/png,image/webp" 
                  onChange={handlePhotoSelect} 
                />

                {/* SLEEK PHOTO UPLOAD CARD */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3.5 text-center">
                  
                  {/* Photo Preview Frame */}
                  <div 
                    onClick={() => document.getElementById('final-photo-picker')?.click()}
                    className={`relative w-40 h-52 mx-auto rounded-2xl overflow-hidden cursor-pointer group border-2 transition-all transform hover:scale-[1.01] shadow-md flex items-center justify-center ${
                      formData.photoUrl 
                        ? 'border-[#e21e5b] bg-black' 
                        : 'border-dashed border-rose-300 bg-rose-50/40 hover:border-[#e21e5b]'
                    }`}
                  >
                    {formData.photoUrl ? (
                      <>
                        <img 
                          src={formData.photoUrl} 
                          alt="Preview" 
                          className="w-full h-full object-cover object-top" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white space-y-1">
                          <Camera size={22} />
                          <span className="text-[11px] font-bold">Change Photo</span>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 py-1 px-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold flex items-center justify-center gap-1">
                          <CheckCircle2 size={11} className="text-emerald-400" />
                          <span>Photo Added</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 space-y-2 text-slate-500">
                        <div className="w-12 h-12 rounded-full bg-rose-100 text-[#e21e5b] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                          <Camera size={22} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#e21e5b] block">Tap to Upload Photo</span>
                          <span className="text-[10px] text-slate-400 block">Optional &bull; JPEG, PNG, WEBP</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Remove photo option if uploaded */}
                  {formData.photoUrl && (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData(p => ({ ...p, photo: null, photoUrl: '', photoPrivacy: 'All Members' }));
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                      >
                        Remove photo (Continue without photo)
                      </button>
                    </div>
                  )}

                  {/* 🔒 SLEEK PHOTO PRIVACY TRIGGER DROPDOWN (ONLY VISIBLE WHEN PHOTO IS PRESENT) */}
                  {formData.photoUrl ? (
                    <div className="text-left space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500 block">Photo Privacy Setting</label>
                      <div 
                        onClick={() => setPrivacySheetOpen(true)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Lock size={14} className="text-[#e21e5b]" />
                          <span className="text-xs font-bold text-slate-800">{formData.photoPrivacy}</span>
                        </div>
                        <ChevronDown size={14} className="text-slate-400" />
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Control who can view your photo across matches.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-left">
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        Photo is optional. You can also upload photos and set privacy controls later from your dashboard gallery.
                      </p>
                    </div>
                  )}

                  {/* QUICK ABOUT ME / BIO */}
                  <div className="text-left space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500 block">About Yourself (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Write a brief sentence about your personality, values or background..."
                      value={formData.aboutMe}
                      onChange={(e) => setFormData(p => ({ ...p, aboutMe: e.target.value }))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#e21e5b] resize-none"
                    />
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleFinalSubmit}
                    className="w-full py-3.5 bg-gradient-to-r from-[#e21e5b] via-[#ce1b53] to-[#e21e5b] hover:brightness-105 disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-white" />
                        <span>{submitStatus || "Saving..."}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} className="text-amber-300" />
                        <span>{formData.photoUrl ? "Complete Profile" : "Skip Photo & Complete Profile"}</span>
                      </>
                    )}
                  </button>

                  <span className="text-[10px] text-slate-400 font-medium block">
                    🔒 100% Secure & Verified Muslim Matrimony Network
                  </span>

                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* 🌟 PRIVACY BOTTOM SHEET / MODAL */}
      <AnimatePresence>
        {privacySheetOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPrivacySheetOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Bottom Sheet Modal */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-[#e21e5b]" />
                  <h3 className="text-sm font-bold text-slate-800">Photo Privacy Setting</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPrivacySheetOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-700 font-bold"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2">
                {PRIVACY_OPTIONS.map((opt) => {
                  const isSelected = formData.photoPrivacy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setFormData(p => ({ ...p, photoPrivacy: opt.id }));
                        setPrivacySheetOpen(false);
                      }}
                      className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected 
                          ? 'border-[#e21e5b] bg-rose-50/80 shadow-2xs' 
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg shrink-0 mt-0.5">{opt.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-[#e21e5b]' : 'text-slate-800'}`}>
                            {opt.title}
                          </span>
                          {isSelected && <Check size={14} className="text-[#e21e5b]" />}
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">
                          {opt.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="h-4" />
    </div>
  );
}
