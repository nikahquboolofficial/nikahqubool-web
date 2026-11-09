"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, ChevronRight, Loader2, ArrowLeft, Check, Search, 
  Camera, Lock, CheckCircle2, Calendar, Shield, ChevronDown,
  User, Mail, Users, Plus, Info, X, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { fetchMasterDataApi, fetchCitiesApi, updateProfileApi, uploadGalleryPhotoApi, fetchProfileDetailsApi, checkEmailAvailabilityApi, MasterOption } from '@/lib/api';
import { getAuthToken, syncUserProfilePhoto } from '@/lib/auth';
import {
  fileToDataUrl,
  PhotoGuidelinesModal,
  PhotoRejectedModal,
} from '@/components/profile/PhotoVerificationModals';
import {
  clientValidateSingleFace,
  compareFaceDescriptors,
  loadFaceApiModels,
} from '@/lib/faceDetectionClient';

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
    { id: 3, value: "Ahl-e-Hadith" },
    { id: 4, value: "Other" }
  ],
  MASLAKS: [
    { id: 1, value: "Deobandi" },
    { id: 2, value: "Barelvi" },
    { id: 3, value: "Salafi / Ahle Hadith" },
    { id: 4, value: "Jamaat-e-Islami" },
    { id: 5, value: "Just Muslim / Non-sectarian" },
    { id: 6, value: "Tablighi Jamaat" },
    { id: 7, value: "Other" }
  ],
  CASTES: [
    { id: 1, value: "Ansari" },
    { id: 2, value: "Qureshi" },
    { id: 3, value: "Syed" },
    { id: 4, value: "Shaikh" },
    { id: 5, value: "Khan / Pathan" },
    { id: 6, value: "Siddiqui" },
    { id: 7, value: "Malik" },
    { id: 8, value: "Choudhary" },
    { id: 9, value: "Mansoori" },
    { id: 10, value: "Saifi" },
    { id: 11, value: "Abbasi" },
    { id: 12, value: "Farooqui" },
    { id: 13, value: "Usmani" },
    { id: 14, value: "Alvi" },
    { id: 15, value: "Memon" },
    { id: 16, value: "Bohra" },
    { id: 17, value: "Khoja" },
    { id: 18, value: "Rayeen" },
    { id: 19, value: "Idrisi" },
    { id: 20, value: "Shah" },
    { id: 21, value: "Mirza / Mughal" },
    { id: 22, value: "Other" }
  ],
  STATES: [
    { id: 1, value: "Andhra Pradesh" },
    { id: 2, value: "Bihar" },
    { id: 3, value: "Delhi" },
    { id: 4, value: "Gujarat" },
    { id: 5, value: "Haryana" },
    { id: 6, value: "Karnataka" },
    { id: 7, value: "Kerala" },
    { id: 8, value: "Madhya Pradesh" },
    { id: 9, value: "Maharashtra" },
    { id: 10, value: "Punjab" },
    { id: 11, value: "Rajasthan" },
    { id: 12, value: "Tamil Nadu" },
    { id: 13, value: "Telangana" },
    { id: 14, value: "Uttar Pradesh" },
    { id: 15, value: "West Bengal" }
  ],
  EDUCATIONS: [
    { id: 1, value: "High School" },
    { id: 2, value: "Intermediate / 12th" },
    { id: 3, value: "Diploma" },
    { id: 4, value: "Bachelor of Arts (B.A.)" },
    { id: 5, value: "Bachelor of Commerce (B.Com)" },
    { id: 6, value: "Bachelor of Science (B.Sc)" },
    { id: 7, value: "B.Tech / B.E." },
    { id: 8, value: "BBA / BBM" },
    { id: 9, value: "BCA" },
    { id: 10, value: "MBBS / BDS / Medical" },
    { id: 11, value: "LLB / Law" },
    { id: 12, value: "Master of Arts (M.A.)" },
    { id: 13, value: "Master of Commerce (M.Com)" },
    { id: 14, value: "Master of Science (M.Sc)" },
    { id: 15, value: "M.Tech / M.E." },
    { id: 16, value: "MBA / PGDM" },
    { id: 17, value: "MCA" },
    { id: 18, value: "MD / MS / Super Specialty" },
    { id: 19, value: "LLM" },
    { id: 20, value: "CA / CS / ICWA" },
    { id: 21, value: "Ph.D / Doctorate" },
    { id: 22, value: "Islamic Education (Aalim / Mufti / Hafiz)" },
    { id: 23, value: "Other" }
  ],
  EMPLOYMENT_SECTORS: [
    { id: 1, value: "Private Sector" },
    { id: 2, value: "Government / Public Sector" },
    { id: 3, value: "Business / Self Employed" },
    { id: 4, value: "Civil Services (IAS / IPS / State PSC)" },
    { id: 5, value: "Defense / Police" },
    { id: 6, value: "Not Working / Homemaker" }
  ],
  OCCUPATIONS: [
    { id: 1, value: "Software Engineer / IT Professional" },
    { id: 2, value: "Doctor / Surgeon / Healthcare" },
    { id: 3, value: "Chartered Accountant / Finance" },
    { id: 4, value: "Business Owner / Entrepreneur" },
    { id: 5, value: "Government Officer / Employee" },
    { id: 6, value: "Teacher / Professor / Academic" },
    { id: 7, value: "Lawyer / Legal Professional" },
    { id: 8, value: "Architect / Interior Designer" },
    { id: 9, value: "Mechanical / Civil Engineer" },
    { id: 10, value: "Banking / Insurance Professional" },
    { id: 11, value: "Marketing / Sales Executive" },
    { id: 12, value: "HR Professional" },
    { id: 13, value: "Graphic / UI-UX Designer" },
    { id: 14, value: "Islamic Scholar / Teacher" },
    { id: 15, value: "Consultant" },
    { id: 16, value: "Pharmacist" },
    { id: 17, value: "Research Scientist" },
    { id: 18, value: "Student" },
    { id: 19, value: "Homemaker" },
    { id: 20, value: "Other" }
  ],
  INCOME_RANGES: [
    { id: 1, value: "No Income / Dependent" },
    { id: 2, value: "Below ₹2 Lakhs" },
    { id: 3, value: "₹2 - 3 Lakhs" },
    { id: 4, value: "₹3 - 5 Lakhs" },
    { id: 5, value: "₹5 - 7 Lakhs" },
    { id: 6, value: "₹7 - 10 Lakhs" },
    { id: 7, value: "₹10 - 15 Lakhs" },
    { id: 8, value: "₹15 - 20 Lakhs" },
    { id: 9, value: "₹20 - 30 Lakhs" },
    { id: 10, value: "₹30 - 50 Lakhs" },
    { id: 11, value: "₹50 Lakhs - 1 Crore" },
    { id: 12, value: "Above ₹1 Crore" }
  ]
};

const HEIGHT_OPTIONS = [
  "4'5\" (135 cm)", "4'6\" (137 cm)", "4'7\" (140 cm)", "4'8\" (142 cm)", "4'9\" (145 cm)",
  "4'10\" (147 cm)", "4'11\" (150 cm)", "5'0\" (152 cm)", "5'1\" (155 cm)", "5'2\" (157 cm)",
  "5'3\" (160 cm)", "5'4\" (163 cm)", "5'5\" (165 cm)", "5'6\" (168 cm)", "5'7\" (170 cm)",
  "5'8\" (173 cm)", "5'9\" (175 cm)", "5'10\" (178 cm)", "5'11\" (180 cm)", "6'0\" (183 cm)",
  "6'1\" (185 cm)", "6'2\" (188 cm)", "6'3\" (191 cm)", "6'4\" (193 cm)", "6'5\" (196 cm)"
];

const MONTHS = [
  { id: '01', name: 'Jan' },
  { id: '02', name: 'Feb' },
  { id: '03', name: 'Mar' },
  { id: '04', name: 'Apr' },
  { id: '05', name: 'May' },
  { id: '06', name: 'Jun' },
  { id: '07', name: 'Jul' },
  { id: '08', name: 'Aug' },
  { id: '09', name: 'Sep' },
  { id: '10', name: 'Oct' },
  { id: '11', name: 'Nov' },
  { id: '12', name: 'Dec' },
];

const YEARS = Array.from({ length: 45 }, (_, i) => String(2006 - i));

// Client-side image compression supporting all image types safely
const compressPhoto = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const img = new Image();
          img.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              const MAX_WIDTH = 1400;
              const MAX_HEIGHT = 1400;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height = Math.round((height * MAX_WIDTH) / width);
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width = Math.round((width * MAX_HEIGHT) / height);
                  height = MAX_HEIGHT;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              ctx?.drawImage(img, 0, 0, width, height);

              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                      type: "image/jpeg",
                      lastModified: Date.now(),
                    });
                    resolve(compressedFile);
                  } else {
                    resolve(file);
                  }
                },
                "image/jpeg",
                0.88
              );
            } catch (_) {
              resolve(file);
            }
          };
          img.onerror = () => resolve(file);
          img.src = event.target?.result as string;
        } catch (_) {
          resolve(file);
        }
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    } catch (_) {
      resolve(file);
    }
  });
};

export default function CompleteProfilePage() {
  const router = useRouter();

  // Guard against already completed profiles
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDoneCookie = document.cookie
        .split('; ')
        .some(row => row.startsWith('is_profile_completed=1'));
      const isDoneLocal = localStorage.getItem('is_profile_completed') === '1';
      
      let isDoneStored = false;
      try {
        const stored = localStorage.getItem('user_details') || localStorage.getItem('user_session');
        if (stored) {
          const parsed = JSON.parse(stored);
          const pRaw = parsed?.isProfileCompleted ?? parsed?.IsProfileCompleted ?? parsed?.data?.isProfileCompleted;
          isDoneStored = (pRaw === true || pRaw === 1 || pRaw === "1" || pRaw === "true");
        }
      } catch (e) {}

      if (isDoneCookie || isDoneLocal || isDoneStored) {
        router.replace('/dashboard');
      }
    }
  }, [router]);

  // Wizard state: 1 to 14 (1 field per slide!)
  const [step, setStep] = useState<number>(1);
  const totalSteps = 14;
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [privacySheetOpen, setPrivacySheetOpen] = useState(false);

  // Transition & Debounce Locks (Prevents skipping slides on rapid clicks)
  const isAdvancingRef = useRef(false);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    height: "5'5\" (165 cm)",
    weight: '60 kg',
    complexionId: 0,
    complexionText: '',
    religionId: 1,
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

  // Modern DOB Picker Sub-states (Matching Mobile App UX)
  const [dobDay, setDobDay] = useState<string>('15');
  const [dobMonth, setDobMonth] = useState<string>('06');
  const [dobYear, setDobYear] = useState<string>('1998');

  // Days count dynamically based on selected Month & Year
  const daysInMonth = React.useMemo(() => {
    const yr = Number(dobYear) || 1998;
    const mo = Number(dobMonth) || 6;
    return new Date(yr, mo, 0).getDate();
  }, [dobYear, dobMonth]);

  // Adjust day if selected day exceeds month's total days
  useEffect(() => {
    if (Number(dobDay) > daysInMonth) {
      setDobDay(String(daysInMonth).padStart(2, '0'));
    }
  }, [daysInMonth, dobDay]);

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

  // 🛡️ STRICT VALIDATION PER STEP: Every field is strictly mandatory!
  const validateCurrentStep = (s: number): { valid: boolean; error?: string } => {
    switch (s) {
      case 1:
        if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
          return { valid: false, error: 'Please enter your Full Name.' };
        }
        if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
          return { valid: false, error: 'Please enter a valid Email address.' };
        }
        if (emailStatus.available === false) {
          return { valid: false, error: emailStatus.message || 'This email is already in use.' };
        }
        if (!formData.gender) {
          return { valid: false, error: 'Please select your Gender.' };
        }
        return { valid: true };

      case 2:
        if (!formData.maritalStatusId) {
          return { valid: false, error: 'Please select your Marital Status.' };
        }
        return { valid: true };

      case 3:
        if (!dobYear || !dobMonth || !dobDay) {
          return { valid: false, error: 'Please select your Date of Birth.' };
        }
        if (calculatedAge === null || calculatedAge < 18) {
          return { valid: false, error: 'You must be at least 18 years old to create a profile.' };
        }
        return { valid: true };

      case 4:
        if (!formData.height) {
          return { valid: false, error: 'Please select your Height.' };
        }
        return { valid: true };

      case 5:
        if (!formData.sectId) {
          return { valid: false, error: 'Please select your Sect.' };
        }
        return { valid: true };

      case 6:
        if (!formData.maslakId) {
          return { valid: false, error: 'Please select your Maslak.' };
        }
        return { valid: true };

      case 7:
        if (!formData.casteId) {
          return { valid: false, error: 'Please select your Caste / Biradari.' };
        }
        return { valid: true };

      case 8:
        if (!formData.stateId) {
          return { valid: false, error: 'Please select your State.' };
        }
        return { valid: true };

      case 9:
        if (!formData.cityId) {
          return { valid: false, error: 'Please select your City.' };
        }
        return { valid: true };

      case 10:
        if (!formData.educationId) {
          return { valid: false, error: 'Please select your Highest Qualification.' };
        }
        return { valid: true };

      case 11:
        if (!formData.employmentSectorId) {
          return { valid: false, error: 'Please select your Employment Sector.' };
        }
        return { valid: true };

      case 12:
        if (!formData.occupationId) {
          return { valid: false, error: 'Please select your Occupation.' };
        }
        return { valid: true };

      case 13:
        if (!formData.income) {
          return { valid: false, error: 'Please select your Annual Income.' };
        }
        return { valid: true };

      case 14:
        if (!photoSlots[0]) {
          return { valid: false, error: 'Please upload at least your Main profile photo.' };
        }
        return { valid: true };

      default:
        return { valid: true };
    }
  };

  // 🚀 NEXT STEP (Guarded against rapid clicking & skips)
  const nextStep = () => {
    const check = validateCurrentStep(step);
    if (!check.valid) {
      if (check.error) toast.error(check.error);
      return;
    }

    if (isAdvancingRef.current) return;
    isAdvancingRef.current = true;

    setSlideDirection('forward');
    setSearchQuery('');
    setStep(prev => Math.min(totalSteps, prev + 1));

    setTimeout(() => {
      isAdvancingRef.current = false;
    }, 350);
  };

  // ⬅️ PREV STEP
  const prevStep = () => {
    if (isAdvancingRef.current) return;
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    isAdvancingRef.current = true;

    setSlideDirection('backward');
    setSearchQuery('');
    setStep(prev => Math.max(1, prev - 1));

    setTimeout(() => {
      isAdvancingRef.current = false;
    }, 350);
  };

  // 🚀 INSTANT AUTO-ADVANCE: Exactly 1 step, locked against multiple clicks!
  const handleAutoAdvance = (fieldIdName: string, id: number | string, fieldTextName: string, text: string) => {
    if (isAdvancingRef.current) return;

    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    setFormData(prev => ({
      ...prev,
      [fieldIdName]: Number(id),
      [fieldTextName]: text
    }));

    isAdvancingRef.current = true;

    autoAdvanceTimerRef.current = setTimeout(() => {
      setSlideDirection('forward');
      setSearchQuery('');
      setStep(prev => Math.min(totalSteps, prev + 1));
      setTimeout(() => {
        isAdvancingRef.current = false;
      }, 350);
    }, 180);
  };

  const handleSimpleAdvance = (fieldName: string, val: any) => {
    if (isAdvancingRef.current) return;

    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    setFormData(prev => ({ ...prev, [fieldName]: val }));
    isAdvancingRef.current = true;

    autoAdvanceTimerRef.current = setTimeout(() => {
      setSlideDirection('forward');
      setSearchQuery('');
      setStep(prev => Math.min(totalSteps, prev + 1));
      setTimeout(() => {
        isAdvancingRef.current = false;
      }, 350);
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

    // Load master options
    const masterTypes = [
      'MARITAL_STATUS', 'RELIGIONS', 'SECTS', 'MASLAKS', 'CASTES',
      'STATES', 'EDUCATIONS', 'EMPLOYMENT_SECTORS', 'OCCUPATIONS', 'INCOME_RANGES'
    ];

    Promise.all(masterTypes.map(t => fetchMasterDataApi(t).then(res => ({ type: t, data: res }))))
      .then(results => {
        const newMasters: { [key: string]: MasterOption[] } = {};
        results.forEach(r => {
          if (r.data && r.data.length > 0) {
            newMasters[r.type] = r.data;
          }
        });
        setMasterData(prev => ({ ...prev, ...newMasters }));
      })
      .catch(() => {});
  }, [router]);

  // Load cities whenever stateId changes
  useEffect(() => {
    if (formData.stateId !== '' && formData.stateId !== null && formData.stateId !== undefined && Number(formData.stateId) > 0) {
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

  // Multi-Photo (Max 4) State with Client AI Face Detection (NO SELFIE)
  const [photoSlots, setPhotoSlots] = useState<Array<{ file: File; previewUrl: string; dataUrl: string; descriptor?: number[] } | null>>([null, null, null, null]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const [validatingSlotIndex, setValidatingSlotIndex] = useState<number | null>(null);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [rejectedModal, setRejectedModal] = useState<{ open: boolean; previewUrl: string; errorCode: string; message: string; slotIndex: number }>({
    open: false,
    previewUrl: '',
    errorCode: '',
    message: '',
    slotIndex: 0,
  });

  // Pre-load face-api models on component mount for instant scanning
  useEffect(() => {
    loadFaceApiModels().catch(() => {});
  }, []);

  const activePhotosList = React.useMemo(
    () => photoSlots.filter((p): p is { file: File; previewUrl: string; dataUrl: string; descriptor?: number[] } => p !== null),
    [photoSlots]
  );

  const triggerSlotPicker = (slotIdx: number) => {
    setActiveSlotIndex(slotIdx);
    const input = document.getElementById('final-photo-picker') as HTMLInputElement | null;
    if (input) {
      input.value = '';
      input.click();
    }
  };

  const handleRemoveSlotPhoto = (slotIdx: number) => {
    setPhotoSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = null;
      // Compact non-null photos so Slot 0 is always Main Photo
      const compacted = next.filter((p) => p !== null);
      while (compacted.length < 4) compacted.push(null);
      const first = compacted[0];
      setFormData((f) => ({
        ...f,
        photo: first ? first.file : null,
        photoUrl: first ? first.previewUrl : '',
      }));
      return compacted;
    });
  };

  // Handle Photo Selection with instant Client-Side AI Face Check
  // Blocks non-images, screenshots, scenery, animals, fruits, cars, group photos
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Block non-image documents, archives, and executables
    const fileName = (file.name || '').toLowerCase();
    const forbiddenExts = [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt',
      '.zip', '.rar', '.7z', '.tar', '.gz', '.iso', '.exe', '.apk', '.bat',
      '.cmd', '.bin', '.msi', '.dmg'
    ];
    if (forbiddenExts.some(ext => fileName.endsWith(ext))) {
      toast.error('Documents (PDF, Word, etc.) and archive files are not allowed. Please choose a photo.');
      return;
    }

    const isImageMime = file.type ? file.type.startsWith('image/') : false;
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.heic', '.heif', '.jfif', '.bmp', '.gif', '.tiff'];
    const isImageExt = allowedExts.some(ext => fileName.endsWith(ext));

    if (!isImageMime && !isImageExt) {
      toast.error('Please choose a valid photo file (JPG, PNG, WEBP, etc.)');
      return;
    }

    const slotIdx = activeSlotIndex;
    setValidatingSlotIndex(slotIdx);
    toast.loading('AI scanning face...', { id: 'compress-toast' });

    try {
      const compressed = await compressPhoto(file);
      const previewUrl = URL.createObjectURL(compressed);
      const dataUrl = await fileToDataUrl(compressed);

      // 1. Run Client-Side Face Verification (supports blur, zoom, far away, side pose)
      const faceResult = await clientValidateSingleFace(dataUrl);

      if (!faceResult.isValid) {
        toast.dismiss('compress-toast');
        setValidatingSlotIndex(null);
        setRejectedModal({
          open: true,
          previewUrl,
          errorCode: faceResult.errorCode || 'NO_FACE',
          message: faceResult.message || 'No human face detected! Screenshots, animals, objects, and scenery photos are strictly not allowed.',
          slotIndex: slotIdx,
        });
        return;
      }

      toast.dismiss('compress-toast');
      setValidatingSlotIndex(null);

      setPhotoSlots((prev) => {
        const next = [...prev];
        next[slotIdx] = { file: compressed, previewUrl, dataUrl };
        // Ensure compact ordering so Slot 0 is always Main
        const compacted = next.filter((p) => p !== null);
        while (compacted.length < 4) compacted.push(null);
        const first = compacted[0];
        setFormData((f) => ({
          ...f,
          photo: first ? first.file : null,
          photoUrl: first ? first.previewUrl : '',
        }));
        return compacted;
      });

      toast.success(slotIdx === 0 ? 'Main photo face verified!' : `Photo #${slotIdx + 1} verified!`);
    } catch (err) {
      toast.dismiss('compress-toast');
      setValidatingSlotIndex(null);
      toast.error('Unable to verify photo. Please try another image.');
    }
  };

  // Final Profile Submit (Direct Save - NO SELFIE VERIFICATION)
  const handleFinalSubmit = async () => {
    if (!photoSlots[0]) {
      toast.error("Please upload at least your Main profile photo to complete your profile.");
      return;
    }
    await executeFinalProfileSave();
  };

  const executeFinalProfileSave = async () => {
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

    const selectedPhotos = photoSlots.filter((p): p is { file: File; previewUrl: string; dataUrl: string } => p !== null);
    let uploadedMainPhotoUrl = "";

    if (selectedPhotos.length > 0) {
      setSubmitStatus("Uploading profile photo...");
      try {
        const file = selectedPhotos[0].file;
        const ext = file.name.split('.').pop() || 'jpg';
        const upRes = await fetch("/api/face-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "upload-photo-r2",
            photoBase64: selectedPhotos[0].dataUrl,
            userId: Number(userData?.userId || userData?.UserId || 0),
            ext,
            mimeType: file.type || "image/jpeg",
          }),
        });
        const upJson = await upRes.json();
        if (upJson?.success && upJson?.photoUrl) {
          uploadedMainPhotoUrl = upJson.photoUrl;
          fd.append("PhotoUrl", upJson.photoUrl);
        } else {
          fd.append("Photo", selectedPhotos[0].file);
        }
      } catch (upErr) {
        console.warn("Direct R2 upload fallback:", upErr);
        fd.append("Photo", selectedPhotos[0].file);
      }
    }

    try {
      setSubmitStatus("Saving profile details...");
      const res = await updateProfileApi(fd, token);

      if (res.success) {
        // Upload any additional gallery photos (Slots 2, 3, 4)
        for (let i = 1; i < selectedPhotos.length; i++) {
          try {
            setSubmitStatus(`Uploading gallery photo ${i + 1} of ${selectedPhotos.length}...`);
            const gfd = new FormData();
            gfd.append("Photo", selectedPhotos[i].file);
            gfd.append("Privacy", formData.photoPrivacy || "All Members");
            await uploadGalleryPhotoApi(gfd, token);
          } catch (gErr) {
            console.warn("Gallery photo upload skipped:", gErr);
          }
        }

        let updatedSessionData: any = session ? JSON.parse(session) : {};
        updatedSessionData.isProfileCompleted = true;
        if (finalFullName) { updatedSessionData.fullName = finalFullName; updatedSessionData.FullName = finalFullName; }
        if (formData.email) { updatedSessionData.email = formData.email; updatedSessionData.Email = formData.email; }
        if (formData.gender) { updatedSessionData.gender = formData.gender; updatedSessionData.Gender = formData.gender; }
        if (formData.profileCreatedFor) { updatedSessionData.profileCreatedFor = formData.profileCreatedFor; }

        // Fetch fresh profile details from API to get the canonical URL
        try {
          const freshProfile = await fetchProfileDetailsApi(token);
          if (freshProfile?.data) {
            const freshPhoto = freshProfile.data.photoUrl || freshProfile.data.PhotoUrl;
            if (freshPhoto) {
              updatedSessionData.photoUrl = freshPhoto;
              updatedSessionData.PhotoUrl = freshPhoto;
              syncUserProfilePhoto(freshPhoto);
            }
          }
        } catch (_) {
          const mainPhoto = uploadedMainPhotoUrl || selectedPhotos[0]?.previewUrl;
          if (mainPhoto) {
            updatedSessionData.photoUrl = mainPhoto;
            syncUserProfilePhoto(mainPhoto);
          }
        }

        if (!updatedSessionData.photoUrl && uploadedMainPhotoUrl) {
          updatedSessionData.photoUrl = uploadedMainPhotoUrl;
          updatedSessionData.PhotoUrl = uploadedMainPhotoUrl;
          syncUserProfilePhoto(uploadedMainPhotoUrl);
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

  // Filtered lists for search slides
  const filteredStates = (masterData.STATES || []).filter(s =>
    s.value.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const filteredCities = (cities || []).filter(c =>
    c.value.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const filteredCastes = (masterData.CASTES || []).filter(c =>
    c.value.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

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

        {/* Spacer */}
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

      {/* 🌟 MAIN CONTAINER (TOP-ALIGNED) */}
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

                {/* 1. Profile Created For Pills */}
                <div className="grid grid-cols-3 gap-2">
                  {PROFILE_CREATED_FOR_OPTIONS.map((opt) => {
                    const isSelected = formData.profileCreatedFor === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            profileCreatedFor: opt.id,
                            profileCreatedForText: opt.value,
                            gender: opt.gender ? opt.gender : prev.gender
                          }));
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                          isSelected 
                            ? 'border-[#e21e5b] bg-[#e21e5b] text-white shadow-2xs' 
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {opt.value}
                      </button>
                    );
                  })}
                </div>

                {/* 2. Full Name Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Mohammad Tariq"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#e21e5b]"
                    />
                  </div>
                </div>

                {/* 3. Email Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      placeholder="e.g. tariq@gmail.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, email: e.target.value }));
                        setEmailStatus({ available: null, message: '' });
                      }}
                      onBlur={handleEmailBlur}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#e21e5b]"
                    />
                    {emailChecking && (
                      <Loader2 size={13} className="animate-spin text-[#e21e5b] absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  {emailStatus.message && (
                    <p className={`text-[10px] font-bold ${emailStatus.available ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {emailStatus.message}
                    </p>
                  )}
                </div>

                {/* 4. Gender Pills */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Gender *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'male', label: 'Male (Groom)' },
                      { id: 'female', label: 'Female (Bride)' }
                    ].map((g) => {
                      const isSelected = formData.gender === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, gender: g.id }))}
                          className={`py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            isSelected
                              ? 'border-[#e21e5b] bg-[#e21e5b] text-white shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {g.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Continue Button */}
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
                SLIDE 2: MARITAL STATUS (AUTO-ADVANCE)
                ========================================================= */}
            {step === 2 && (
              <div className="space-y-3">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e21e5b]">Personal Background</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    What is your marital status?
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">Select your current marital status</p>
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
                SLIDE 3: DATE OF BIRTH (APP-STYLE ELEGANT DESIGN)
                ========================================================= */}
            {step === 3 && (
              <div className="space-y-3.5">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e21e5b]">Age Verification</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    What is your date of birth?
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">Choose your birth year, month & day</p>
                </div>

                {/* App-Style Modern DOB Card */}
                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                  
                  {/* Live Age & Birthday Banner */}
                  {calculatedAge !== null && (
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 border border-rose-200/80">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">🎉</span>
                        <div>
                          <span className="text-xs font-black text-[#e21e5b] block">
                            {calculatedAge} Years Old
                          </span>
                          <span className="text-[11px] text-slate-600 font-semibold">
                            Born {dobDay} {MONTHS.find(m => m.id === dobMonth)?.name} {dobYear}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border shadow-2xs ${
                        calculatedAge >= 18 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-rose-100 text-[#e21e5b] border-rose-300'
                      }`}>
                        {calculatedAge >= 18 ? 'Eligible' : 'Must be 18+'}
                      </span>
                    </div>
                  )}

                  {/* 1. Birth Year (Horizontal Scrollable Pills) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10.5px] font-black uppercase tracking-wider text-slate-500">
                        Birth Year
                      </label>
                      <span className="text-xs font-black text-[#e21e5b]">{dobYear}</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
                      {YEARS.map(yr => {
                        const isYearActive = dobYear === yr;
                        return (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => setDobYear(yr)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                              isYearActive 
                                ? 'bg-[#e21e5b] text-white shadow-sm shadow-rose-500/25 scale-105' 
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {yr}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Birth Month (4x3 Grid) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10.5px] font-black uppercase tracking-wider text-slate-500">
                        Birth Month
                      </label>
                      <span className="text-xs font-black text-[#e21e5b]">
                        {MONTHS.find(m => m.id === dobMonth)?.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {MONTHS.map(m => {
                        const isMonthActive = dobMonth === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setDobMonth(m.id)}
                            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                              isMonthActive 
                                ? 'bg-[#e21e5b] text-white shadow-sm shadow-rose-500/20' 
                                : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {m.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Birth Day (7-Column Grid, dynamic days in month) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10.5px] font-black uppercase tracking-wider text-slate-500">
                        Birth Day ({dobDay})
                      </label>
                      <span className="text-xs font-black text-[#e21e5b]">Day {Number(dobDay)}</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const dStr = String(i + 1).padStart(2, '0');
                        const isDayActive = dobDay === dStr;
                        return (
                          <button
                            key={dStr}
                            type="button"
                            onClick={() => setDobDay(dStr)}
                            className={`h-9 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                              isDayActive 
                                ? 'bg-[#e21e5b] text-white shadow-sm shadow-rose-500/25 scale-105' 
                                : 'bg-slate-50 border border-slate-200/70 text-slate-700 hover:bg-slate-100'
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
                  disabled={calculatedAge === null || calculatedAge < 18}
                  className="w-full py-3.5 bg-[#e21e5b] hover:bg-[#ce1b53] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5"
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
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e21e5b]">Physical Attributes</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    What is your height?
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">Select your approximate height</p>
                </div>

                <div className="max-h-[56vh] overflow-y-auto space-y-1.5 pr-1 no-scrollbar pt-1">
                  {HEIGHT_OPTIONS.map((hStr) => {
                    const isSelected = formData.height === hStr;
                    return (
                      <button
                        key={hStr}
                        type="button"
                        onClick={() => handleSimpleAdvance('height', hStr)}
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer ${
                          isSelected 
                            ? 'border-[#e21e5b] bg-rose-50/70 text-[#e21e5b] font-bold shadow-2xs' 
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-medium'
                        }`}
                      >
                        <span className="text-xs font-semibold">{hStr}</span>
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

                <div className="max-h-[56vh] overflow-y-auto space-y-1.5 pr-1 no-scrollbar pt-1">
                  {(masterData.MASLAKS || []).map((opt) => {
                    const isSelected = formData.maslakId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleAutoAdvance('maslakId', opt.id, 'maslakText', opt.value)}
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
                SLIDE 7: CASTE / BIRADARI (AUTO-ADVANCE WITH SEARCH)
                ========================================================= */}
            {step === 7 && (
              <div className="space-y-3">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e21e5b]">Roots & Heritage</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    What is your caste / biradari?
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">Search or select your biradari</p>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search caste / biradari..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#e21e5b]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="max-h-[50vh] overflow-y-auto space-y-1.5 pr-1 no-scrollbar pt-1">
                  {filteredCastes.map((opt) => {
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
                SLIDE 8: STATE (SEPARATE PAGE WITH SEARCH & AUTO-ADVANCE)
                ========================================================= */}
            {step === 8 && (
              <div className="space-y-3">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e21e5b]">Location Details</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    Which state do you live in?
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">Search or select your residential state</p>
                </div>

                {/* State Search Bar */}
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search state..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#e21e5b]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="max-h-[52vh] overflow-y-auto space-y-1.5 pr-1 no-scrollbar pt-1">
                  {filteredStates.map((st) => {
                    const isSelected = String(formData.stateId) === String(st.id);
                    return (
                      <button
                        key={String(st.id)}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, cityId: '', cityText: '' }));
                          handleAutoAdvance('stateId', st.id, 'stateText', st.value);
                        }}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer ${
                          isSelected 
                            ? 'border-[#e21e5b] bg-rose-50/70 text-[#e21e5b] font-bold shadow-2xs' 
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin size={15} className={isSelected ? 'text-[#e21e5b]' : 'text-slate-400'} />
                          <span className="text-xs uppercase tracking-wide">{st.value}</span>
                        </div>
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
                SLIDE 9: CITY (SEPARATE PAGE WITH SEARCH & AUTO-ADVANCE)
                ========================================================= */}
            {step === 9 && (
              <div className="space-y-3">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e21e5b]">Location Details</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    Which city in {formData.stateText || 'your state'}?
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">Select your current residential city</p>
                </div>

                {/* City Search Bar */}
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#e21e5b]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="max-h-[52vh] overflow-y-auto space-y-1.5 pr-1 no-scrollbar pt-1">
                  {loadingCities ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Loader2 size={24} className="animate-spin text-[#e21e5b]" />
                      <p className="text-xs font-bold">Loading cities...</p>
                    </div>
                  ) : filteredCities.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-1">
                      <p className="text-xs font-bold">No cities found.</p>
                      <p className="text-[11px] text-slate-400">Try searching or go back to re-select state.</p>
                    </div>
                  ) : (
                    filteredCities.map((ct) => {
                      const isSelected = String(formData.cityId) === String(ct.id);
                      return (
                        <button
                          key={String(ct.id)}
                          type="button"
                          onClick={() => handleAutoAdvance('cityId', ct.id, 'cityText', ct.value)}
                          className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer ${
                            isSelected 
                              ? 'border-[#e21e5b] bg-rose-50/70 text-[#e21e5b] font-bold shadow-2xs' 
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <MapPin size={15} className={isSelected ? 'text-[#e21e5b]' : 'text-slate-400'} />
                            <span className="text-xs uppercase tracking-wide">{ct.value}</span>
                          </div>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            isSelected ? 'bg-[#e21e5b] text-white shadow-2xs' : 'border border-slate-300'
                          }`}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* =========================================================
                SLIDE 10: EDUCATION LEVEL (AUTO-ADVANCE)
                ========================================================= */}
            {step === 10 && (
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
                SLIDE 11: EMPLOYMENT SECTOR (AUTO-ADVANCE)
                ========================================================= */}
            {step === 11 && (
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
                SLIDE 12: PROFESSION / OCCUPATION (AUTO-ADVANCE)
                ========================================================= */}
            {step === 12 && (
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
                SLIDE 13: ANNUAL INCOME (AUTO-ADVANCE)
                ========================================================= */}
            {step === 13 && (
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
                SLIDE 14: 4-SLOT PHOTO GRID, GUIDELINES, PRIVACY & SUBMIT
                ========================================================= */}
            {step === 14 && (
              <div className="space-y-4">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#e21e5b]">Final Step • Profile Photos</span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    Add your profile photos
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Upload up to 4 clear solo photos ({activePhotosList.length} / 4 added). Only genuine photos of yourself are permitted.
                  </p>
                </div>

                {/* HIDDEN FILE PICKER */}
                <input 
                  type="file" 
                  id="final-photo-picker" 
                  hidden 
                  accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.heic,.heif,.jfif,.bmp,.gif,.tiff" 
                  onChange={handlePhotoSelect} 
                />

                {/* SLEEK 4-SLOT PHOTO UPLOAD CARD */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3.5 text-center">

                  {/* 3-Column Grid: 4 Photo Slots + 1 Photo Guidelines Tile */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {[0, 1, 2, 3].map((slotIdx) => {
                      const slotItem = photoSlots[slotIdx];
                      const isValidating = validatingSlotIndex === slotIdx;
                      return (
                        <div
                          key={slotIdx}
                          onClick={() => !isValidating && triggerSlotPicker(slotIdx)}
                          className={`relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transition-all group flex flex-col items-center justify-center ${
                            slotItem
                              ? 'border-2 border-[#e21e5b] bg-slate-900 shadow-md'
                              : 'border-2 border-dashed border-slate-300 hover:border-[#e21e5b] bg-slate-50/60 hover:bg-rose-50/40'
                          }`}
                        >
                          {isValidating ? (
                            <div className="flex flex-col items-center justify-center p-2 text-center space-y-1.5">
                              <Loader2 size={22} className="animate-spin text-[#e21e5b]" />
                              <span className="text-[10px] font-extrabold text-[#e21e5b]">Scanning Face...</span>
                            </div>
                          ) : slotItem ? (
                            <>
                              <img
                                src={slotItem.previewUrl}
                                alt={`Slot ${slotIdx + 1}`}
                                className="w-full h-full object-cover object-top"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveSlotPhoto(slotIdx);
                                }}
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white hover:bg-rose-600 flex items-center justify-center shadow cursor-pointer"
                                title="Remove photo"
                              >
                                <X size={13} />
                              </button>
                              {slotIdx === 0 ? (
                                <div className="absolute bottom-1.5 left-1.5 px-2.5 py-0.5 rounded-lg bg-black/80 text-white text-[10px] font-extrabold tracking-wide">
                                  Main
                                </div>
                              ) : (
                                <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-emerald-600/90 text-white text-[9px] font-bold flex items-center gap-0.5">
                                  <Check size={10} strokeWidth={3} /> #{slotIdx + 1}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-500 group-hover:text-[#e21e5b] transition-colors">
                              <Plus size={24} strokeWidth={2.2} />
                              {slotIdx === 0 && (
                                <span className="text-[10px] font-extrabold mt-1 text-[#e21e5b]">Main Photo *</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Tile 5: Photo Guidelines Button */}
                    <button
                      type="button"
                      onClick={() => setGuidelinesOpen(true)}
                      className="aspect-[3/4] rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-rose-50/50 hover:border-rose-200 transition-all flex flex-col items-center justify-center p-2 text-center cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-full border-2 border-slate-700 group-hover:border-[#e21e5b] flex items-center justify-center mb-1.5 text-slate-800 group-hover:text-[#e21e5b]">
                        <Info size={16} strokeWidth={2.5} />
                      </div>
                      <span className="text-[11px] font-extrabold text-slate-800 group-hover:text-[#e21e5b] leading-tight">
                        Photo<br />guidelines
                      </span>
                    </button>
                  </div>

                  {/* Photo Privacy Trigger */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setPrivacySheetOpen(true)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Lock size={13} className="text-[#e21e5b]" />
                        <span>Photo Privacy:</span>
                        <span className="font-bold text-slate-900">{formData.photoPrivacy}</span>
                      </div>
                      <ChevronDown size={14} className="text-slate-400" />
                    </button>
                  </div>

                  {/* About Me Bio */}
                  <div className="pt-1 text-left space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      About Me (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Write a few lines about your values, personality, and partner preferences..."
                      value={formData.aboutMe}
                      onChange={(e) => setFormData(prev => ({ ...prev, aboutMe: e.target.value }))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#e21e5b] resize-none"
                    />
                  </div>

                  {/* Final Submit Button */}
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={loading || activePhotosList.length === 0}
                    className="w-full py-3.5 bg-[#e21e5b] hover:bg-[#ce1b53] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-white" />
                        <span>{submitStatus || "Saving..."}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} className="text-amber-300" />
                        <span>Complete Profile</span>
                      </>
                    )}
                  </button>

                  <span className="text-[10px] text-slate-400 font-medium block">
                    🔒 100% Genuine & Verified Matrimony Network
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
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-2xl p-5 space-y-3.5 shadow-2xl text-left"
            >
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-800">Who can see your photos?</h3>
                <button
                  type="button"
                  onClick={() => setPrivacySheetOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { value: 'All Members', title: 'All Members', desc: 'Visible to all registered profiles' },
                  { value: 'Protected', title: 'Photo Blur / Protected', desc: 'Photos blurred; visible only upon your request approval' },
                  { value: 'Premium Only', title: 'Premium Only', desc: 'Visible only to verified paid VIP subscribers' }
                ].map((opt) => {
                  const isSel = formData.photoPrivacy === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setFormData(p => ({ ...p, photoPrivacy: opt.value }));
                        setPrivacySheetOpen(false);
                      }}
                      className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between ${
                        isSel ? 'border-[#e21e5b] bg-rose-50/60' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className={`text-xs font-bold ${isSel ? 'text-[#e21e5b]' : 'text-slate-800'}`}>
                          {opt.title}
                        </div>
                        <div className="text-[11px] text-slate-500 leading-snug">
                          {opt.desc}
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center ${
                        isSel ? 'border-[#e21e5b] bg-[#e21e5b]' : 'border-slate-300'
                      }`}>
                        {isSel && <Check size={10} className="text-white stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🌟 AI PHOTO GUIDELINES & REJECTION MODALS */}
      <PhotoGuidelinesModal
        open={guidelinesOpen}
        onClose={() => setGuidelinesOpen(false)}
      />

      <PhotoRejectedModal
        open={rejectedModal.open}
        photoPreviewUrl={rejectedModal.previewUrl}
        errorCode={rejectedModal.errorCode}
        message={rejectedModal.message}
        onClose={() => setRejectedModal((p) => ({ ...p, open: false }))}
        onChangePhoto={() => {
          const slotToPick = rejectedModal.slotIndex;
          setRejectedModal((p) => ({ ...p, open: false }));
          setTimeout(() => triggerSlotPicker(slotToPick), 150);
        }}
      />

      <footer className="h-4" />
    </div>
  );
}
