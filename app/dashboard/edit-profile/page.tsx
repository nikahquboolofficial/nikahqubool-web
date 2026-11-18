"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Eye, Shield, CheckCircle2, ChevronRight, Search, 
  Camera, Plus, Trash2, Lock, Sparkles, AlertCircle, 
  ArrowLeft, Upload, FileText, Check, Loader2, Star,
  GraduationCap, Briefcase, Heart, Home, Moon, User,
  Minus, Award, ShieldCheck, MapPin, Activity, Utensils,
  BookOpen, Smile, Phone, Mail, MessageCircle, Calendar,
  Dumbbell, Music, Languages, DollarSign, Users, Info
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { 
  fetchProfileDetailsApi, 
  updateProfileApi, 
  fetchMasterDataApi, 
  getCachedMasterOptions,
  fetchCitiesApi,
  deleteGalleryPhotoApi,
  uploadGalleryPhotoApi,
  setMainPhotoApi,
  updatePhotoPrivacyApi,
  uploadGovtDocumentApi,
  sendOtpApi,
  changeMobileApi,
  MasterOption 
} from '@/lib/api';
import { getAuthToken, syncUserProfilePhoto } from '@/lib/auth';
import { clientValidateSingleFace } from '@/lib/faceDetectionClient';

// Helper for Height conversions
function cmToFtIn(cm: number): string {
  const totalInches = Math.round(cm / 2.54);
  const ft = Math.floor(totalInches / 12);
  const inch = totalInches % 12;
  return `${ft}ft ${inch}in (${cm} cm)`;
}

function parseHeightToCm(hStr: string): number {
  if (!hStr) return 170;
  const cmMatch = hStr.match(/(\d{3})\s*cm/i);
  if (cmMatch) return Number(cmMatch[1]);
  const ftMatch = hStr.match(/(\d+)\s*(?:ft|')(?:\s*(\d+)\s*(?:in|"))?/i);
  if (ftMatch) {
    const ft = Number(ftMatch[1]);
    const inch = Number(ftMatch[2] || 0);
    return Math.round((ft * 12 + inch) * 2.54);
  }
  return 170;
}

// Comprehensive Income Brackets
const INCOME_BRACKETS = [
  "No Income / Dependent",
  "Below ₹2 Lakhs",
  "₹2 - 3 Lakhs",
  "₹3 - 5 Lakhs",
  "₹5 - 7 Lakhs",
  "₹7 - 10 Lakhs",
  "₹10 - 15 Lakhs",
  "₹15 - 20 Lakhs",
  "₹20 - 30 Lakhs",
  "₹30 - 50 Lakhs",
  "₹50 - 75 Lakhs",
  "₹75 Lakhs - ₹1 Crore",
  "Above ₹1 Crore"
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function EditMyProfilePage() {
  const router = useRouter();

  // Loading & Saving States
  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState<string | null>(null);

  // Dynamic Master Data Cache initialized with FALLBACK_MASTERS so options ALWAYS bind instantly!
  const [masterData, setMasterData] = useState<{ [key: string]: MasterOption[] }>(() => ({
    PROFILE_CREATED_FOR: getCachedMasterOptions('PROFILE_CREATED_FOR'),
    MARITAL_STATUS: getCachedMasterOptions('MARITAL_STATUS'),
    RELIGIONS: getCachedMasterOptions('RELIGIONS'),
    SECTS: getCachedMasterOptions('SECTS'),
    MASLAKS: getCachedMasterOptions('MASLAKS'),
    CASTES: getCachedMasterOptions('CASTES'),
    MOTHER_TONGUES: getCachedMasterOptions('MOTHER_TONGUES'),
    EDUCATIONS: getCachedMasterOptions('EDUCATIONS'),
    EMPLOYMENT_SECTORS: getCachedMasterOptions('EMPLOYMENT_SECTORS'),
    OCCUPATIONS: getCachedMasterOptions('OCCUPATIONS'),
    STATES: getCachedMasterOptions('STATES'),
    FAMILY_TYPES: getCachedMasterOptions('FAMILY_TYPES'),
    FAMILY_STATUS: getCachedMasterOptions('FAMILY_STATUS'),
    COMPLEXION: getCachedMasterOptions('COMPLEXION'),
    HOBBIES: getCachedMasterOptions('HOBBIES'),
    INTERESTS: getCachedMasterOptions('INTERESTS'),
    SPORTS: getCachedMasterOptions('SPORTS'),
    LANGUAGES: getCachedMasterOptions('LANGUAGES'),
    NAMAZ_HABITS: getCachedMasterOptions('NAMAZ_HABITS'),
    QURAN_READING: getCachedMasterOptions('QURAN_READING'),
    ROZA_HABITS: getCachedMasterOptions('ROZA_HABITS'),
    HIJAB_BEARD: getCachedMasterOptions('HIJAB_BEARD'),
    ZAKAT_HABITS: getCachedMasterOptions('ZAKAT_HABITS'),
    HAJJ_UMRAH: getCachedMasterOptions('HAJJ_UMRAH'),
    DIET_TYPES: getCachedMasterOptions('DIET_TYPES'),
    SMOKE_HABITS: getCachedMasterOptions('SMOKE_HABITS'),
    COOKING_SKILLS: getCachedMasterOptions('COOKING_SKILLS'),
    DISABILITIES: getCachedMasterOptions('DISABILITIES'),
    INCOME_RANGES: getCachedMasterOptions('INCOME_RANGES'),
    DRINK_HABITS: getCachedMasterOptions('DRINK_HABITS'),
    PROFILE_SECTIONS: getCachedMasterOptions('PROFILE_SECTIONS')
  }));
  const [stateCities, setStateCities] = useState<MasterOption[]>([]);

  // 🌟 GUARANTEED TEXT RESOLVER: NEVER SHOW A NUMERIC ID ON SCREEN!
  const getMasterLabel = useCallback((type: string, val: any): string => {
    if (val === null || val === undefined || val === '') return '';
    const strVal = String(val).trim();
    const list = masterData[type] || [] || [];
    
    // 1. Try finding by numeric id
    const byId = list.find(item => String(item.id) === strVal);
    if (byId) return byId.value;

    // 2. Try finding by case-insensitive value
    const byVal = list.find(item => item.value.toLowerCase() === strVal.toLowerCase());
    if (byVal) return byVal.value;

    // 3. Fallback: if it's a numeric string that didn't match, avoid showing raw number if possible
    if (/^\d+$/.test(strVal)) {
      const idx = Number(strVal) - 1;
      if (idx >= 0 && idx < list.length) {
        return list[idx].value;
      }
    }
    return strVal;
  }, [masterData]);

  // Helper to get cached Full Name from localStorage so it never starts empty
  const getInitialFullName = (): string => {
    if (typeof window === "undefined") return '';
    try {
      for (const key of ['user_details', 'user_session', 'cached_profile_details']) {
        const uStr = localStorage.getItem(key);
        if (uStr) {
          const parsed = JSON.parse(uStr);
          const name = parsed.fullName || parsed.FullName || parsed.name || parsed.Name || parsed.user?.fullName || parsed.user?.name || parsed.profile?.fullName;
          if (name && name !== 'User' && String(name).trim().length > 0) {
            return String(name).trim();
          }
        }
      }
    } catch {}
    return '';
  };

  // Helper to render label or clean placeholder
  const renderLabel = (val: any, placeholder: string = "Not specified") => {
    if (val !== null && val !== undefined && val !== '' && val !== 0 && val !== '0') {
      return <span className="text-slate-500 font-medium">{String(val)}</span>;
    }
    return <span className="text-slate-400 italic font-normal">{placeholder}</span>;
  };

  // Profile Data State
  const [formData, setFormData] = useState<any>({
    UserId: 0,
    FullName: '',
    ProfileCreatedFor: 0,
    Age: null,
    Gender: '',
    DateOfBirth: '',
    MaritalStatus: 0,
    Sect: 0,
    Height: '',
    Weight: '',
    Complexion: 0,
    Caste: 0,
    Maslak: 0,
    MotherTongue: 0,
    Location: '',
    CurrentStateId: 0,
    CurrentCityId: 0,
    StateName: '',
    CityName: '',
    Disability: '',

    // Education & Career
    Education: 0,
    CollegeName: '',
    EmployedIn: 0,
    Occupation: 0,
    OccupationDetails: '',
    AnnualIncome: '',

    // Family Details
    FamilyLocation: '',
    FamilyType: 0,
    FamilyStatus: 0,
    NativeLocation: '',
    NativePlaceStateId: 0,
    NativePlaceCityId: 0,
    FatherName: '',
    FatherOccupation: 0,
    MotherName: '',
    MotherOccupation: 0,
    TotalBrothers: 0,
    MarriedBrothers: 0,
    TotalSisters: 0,
    MarriedSisters: 0,
    FamilyAbout: '',

    // Contact Details
    MobileNumber: '',
    Email: '',
    WhatsAppNumber: '',

    // Religious Details
    NamazHabit: '',
    QuranReading: '',
    RozaHabit: '',
    HijabOrBeard: '',
    ZakatHabit: '',
    HajjUmrah: '',

    // Lifestyle & Interest
    DietType: '',
    SmokeHabit: '',
    DrinkHabit: '',
    LanguagesKnown: '',
    CanCook: '',
    Sports: '',
    Hobbies: '',
    Interests: '',

    // Bio & Trust
    AboutMe: '',
    PartnerExpectations: '',
    IsGovtIdVerified: false,
    GovtIdDocUrl: '',
    PhotoPrivacy: 'All Members',
  });

  // Photos State: 4 slots max
  const [photos, setPhotos] = useState<Array<{ photoId: number; photoUrl: string; isMain: boolean; privacy?: string }>>([]);
  const [uploadingPhotoSlot, setUploadingPhotoSlot] = useState<number | null>(null);

  // Active Bottom Sheet
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [sheetTitle, setSheetTitle] = useState('');
  const [sheetSearch, setSheetSearch] = useState('');
  const [sheetOptions, setSheetOptions] = useState<Array<{ id: any; value: string; desc?: string }>>([]);
  const [selectedSheetValue, setSelectedSheetValue] = useState<any>('');
  const [sheetFieldKey, setSheetFieldKey] = useState<string>('');

  // Text Input Sheet Substate
  const [textInputData, setTextInputData] = useState<{
    title: string;
    subtitle: string;
    fieldKey: string;
    value: string;
    placeholder: string;
    maxLength?: number;
    multiline?: boolean;
    inputType?: 'text' | 'tel' | 'email';
  }>({
    title: '',
    subtitle: '',
    fieldKey: '',
    value: '',
    placeholder: '',
    maxLength: 120,
    multiline: false,
    inputType: 'text',
  });

  // Counters Sheet Substate
  const [countersState, setCountersState] = useState({
    totalBrothers: 1,
    marriedBrothers: 0,
    totalSisters: 1,
    marriedSisters: 0,
  });

  // Height Slider Substate
  const [heightCm, setHeightCm] = useState(170);

  // Income Slider Substate (index 0 to 12)
  const [incomeIndex, setIncomeIndex] = useState(4);

  // Date of Birth 3-Column Picker Substate
  const [dobDay, setDobDay] = useState<number>(15);
  const [dobMonth, setDobMonth] = useState<number>(8); // 1-12
  const [dobYear, setDobYear] = useState<number>(1998);

  // Bio Substate
  const [bioDraft, setBioDraft] = useState('');

  // Location Substate
  const [selectedStateId, setSelectedStateId] = useState<number>(14);
  const [selectedCityId, setSelectedCityId] = useState<number>(1);
  const [locationTargetField, setLocationTargetField] = useState<'Location' | 'FamilyLocation' | 'NativeLocation'>('Location');

  // Mobile Change with OTP Substate
  const [newMobileNumber, setNewMobileNumber] = useState('');
  const [mobileOtpCode, setMobileOtpCode] = useState('');
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [sendingMobileOtp, setSendingMobileOtp] = useState(false);
  const [verifyingMobileOtp, setVerifyingMobileOtp] = useState(false);

  // Trust Badge Substate
  const [govtDocFile, setGovtDocFile] = useState<File | null>(null);
  const [govtDocPreview, setGovtDocPreview] = useState<string>('');
  const [uploadingGovtDoc, setUploadingGovtDoc] = useState(false);

  // Multi-Select Substate
  const [multiSelectKey, setMultiSelectKey] = useState<'Hobbies' | 'Interests' | 'Sports' | 'LanguagesKnown'>('Hobbies');
  const [multiSelectTitle, setMultiSelectTitle] = useState('');
  const [multiSelectSubtitle, setMultiSelectSubtitle] = useState('');
  const [multiSelectItems, setMultiSelectItems] = useState<string[]>([]);
  const [multiSelectAvailable, setMultiSelectAvailable] = useState<MasterOption[]>([]);
  const [multiSelectSearch, setMultiSelectSearch] = useState('');

  // 🌟 PARALLEL DYNAMIC MASTER & PROFILE INITIALIZATION
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const loadAllData = async () => {
      try {
        const masterTypes = [
          'PROFILE_CREATED_FOR',
          'MARITAL_STATUS',
          'RELIGIONS',
          'SECTS',
          'MASLAKS',
          'CASTES',
          'MOTHER_TONGUES',
          'EDUCATIONS',
          'EMPLOYMENT_SECTORS',
          'OCCUPATIONS',
          'STATES',
          'FAMILY_TYPES',
          'FAMILY_STATUS',
          'COMPLEXION',
          'HOBBIES',
          'INTERESTS',
          'SPORTS',
          'LANGUAGES',
          'NAMAZ_HABITS',
          'QURAN_READING',
          'ROZA_HABITS',
          'HIJAB_BEARD',
          'ZAKAT_HABITS',
          'HAJJ_UMRAH',
          'DIET_TYPES',
          'SMOKE_HABITS',
          'COOKING_SKILLS',
          'DISABILITIES',
          'INCOME_RANGES',
          'PHOTO_PRIVACY',
          'DRINK_HABITS',
          'PROFILE_SECTIONS'
        ];

        // Fetch all master data in parallel with profile details
        const masterPromises = masterTypes.map(t => 
          fetchMasterDataApi(t)
            .then(res => ({ type: t, data: res }))
            .catch(() => ({ type: t, data: [] }))
        );

        const [profileRes, ...masterResults] = await Promise.all([
          fetchProfileDetailsApi(0, token),
          ...masterPromises
        ]);

        // Merge loaded master data over fallback masters
        const newMasters: { [key: string]: MasterOption[] } = {};
        masterResults.forEach((r: any) => {
          if (r.data && Array.isArray(r.data) && r.data.length > 0) {
            newMasters[r.type] = r.data;
          }
        });

        setMasterData(prev => ({
          
          ...prev,
          ...newMasters
        }));

        // Hydrate Profile Details
        if (profileRes?.success && profileRes?.data) {
          const p = profileRes.data.profile || profileRes.data.Profile || profileRes.data;
          const g = profileRes.data.gallery || profileRes.data.Gallery || [];

          // Robust Name resolver
          let resolvedName = p.fullName || p.FullName || p.name || p.Name;
          if (!resolvedName || String(resolvedName).trim() === '' || resolvedName === 'User') {
            resolvedName = getInitialFullName() || 'Candidate Profile';
          }

          // Parse Date of Birth into picker state
          if (p.dateOfBirth) {
            const dob = new Date(p.dateOfBirth);
            if (!isNaN(dob.getTime())) {
              setDobDay(dob.getDate());
              setDobMonth(dob.getMonth() + 1);
              setDobYear(dob.getFullYear());
            }
          }

          // Income Index resolver
          const incStr = p.annualIncome || p.AnnualIncome || '';
          if (incStr) {
            const matchedIncIdx = INCOME_BRACKETS.findIndex(b => b.toLowerCase().replace(/[^a-z0-9]/g, '') === incStr.toLowerCase().replace(/[^a-z0-9]/g, ''));
            if (matchedIncIdx >= 0) {
              setIncomeIndex(matchedIncIdx);
            }
          }

          setFormData((prev: any) => ({
            ...prev,
            UserId: p.userId || p.UserId || 0,
            FullName: resolvedName,
            ProfileCreatedFor: p.profileCreatedForId || p.profileCreatedFor || 0,
            Age: p.age || null,
            Gender: p.gender || p.Gender || '',
            DateOfBirth: p.dateOfBirth || '',
            MaritalStatus: p.maritalStatusId || p.maritalStatus || 0,
            Sect: p.sectId || p.sect || 0,
            Height: p.height || p.Height || '',
            Weight: p.weight || p.Weight || '',
            Complexion: p.complexionId || p.complexion || 0,
            Caste: p.casteId || p.caste || 0,
            Maslak: p.maslakId || p.maslak || 0,
            MotherTongue: p.motherTongueId || p.motherTongue || 0,
            Location: (p.currentCityName || p.cityName) ? `${p.currentCityName || p.cityName}, ${p.currentStateName || p.stateName || ''}, India` : '',
            CurrentStateId: p.currentStateId || 0,
            CurrentCityId: p.currentCityId || 0,
            StateName: p.currentStateName || p.stateName || '',
            CityName: p.currentCityName || p.cityName || '',
            Disability: p.disability || '',

            // Education & Career
            Education: p.highestDegreeId || p.highestDegree || 0,
            CollegeName: p.collegeName || '',
            EmployedIn: p.employmentSectorId || p.employmentSector || 0,
            Occupation: p.designationId || p.designation || 0,
            OccupationDetails: p.occupationDetails || '',
            AnnualIncome: incStr,

            // Family
            FamilyLocation: p.familyCityName ? `${p.familyCityName}, ${p.familyStateName || ''}, India` : '',
            FamilyType: p.familyTypeId || p.familyType || 0,
            FamilyStatus: p.familyStatusId || p.familyStatus || 0,
            NativeLocation: p.nativeCityName ? `${p.nativeCityName}, ${p.nativeStateName || ''}, India` : (p.familyCityName ? `${p.familyCityName}, ${p.familyStateName || ''}, India` : ''),
            NativePlaceStateId: p.nativePlaceStateId || 0,
            NativePlaceCityId: p.nativePlaceCityId || 0,
            FatherName: p.fatherName || p.FatherName || '',
            FatherOccupation: p.fatherOccupationId || p.fatherOccupation || '',
            MotherName: p.motherName || p.MotherName || '',
            MotherOccupation: p.motherOccupationId || p.motherOccupation || '',
            TotalBrothers: p.totalBrothers !== undefined && p.totalBrothers !== null ? Number(p.totalBrothers) : 0,
            MarriedBrothers: p.marriedBrothers !== undefined && p.marriedBrothers !== null ? Number(p.marriedBrothers) : 0,
            TotalSisters: p.totalSisters !== undefined && p.totalSisters !== null ? Number(p.totalSisters) : 0,
            MarriedSisters: p.marriedSisters !== undefined && p.marriedSisters !== null ? Number(p.marriedSisters) : 0,
            FamilyAbout: p.familyAbout || '',

            // Contact Details
            MobileNumber: p.mobileNumber || p.MobileNumber || '',
            Email: p.email || p.Email || '',
            WhatsAppNumber: p.whatsAppNumber || p.WhatsAppNumber || p.waliContactNumber || p.WaliContactNumber || '',

            // Religious Details
            NamazHabit: p.namazHabit || p.NamazHabit || '',
            QuranReading: p.quranReading || p.QuranReading || '',
            RozaHabit: p.rozaHabit || p.RozaHabit || '',
            HijabOrBeard: p.hijabOrBeard || p.HijabOrBeard || '',
            ZakatHabit: p.zakatHabit || p.ZakatHabit || '',
            HajjUmrah: p.hajjUmrah || p.HajjUmrah || '',

            // Lifestyle & Interest
            DietType: p.dietType || '',
            SmokeHabit: p.smokeHabit || '',
            DrinkHabit: p.drinkHabit || '',
            LanguagesKnown: p.languagesKnown || p.LanguagesKnown || '',
            CanCook: p.canCook === true ? 'Yes' : (p.canCook === false ? 'No' : (p.canCook || '')),
            Sports: p.sports || p.Sports || '',
            Hobbies: p.hobbies || '',
            Interests: p.interests || '',

            // Bio & Trust
            AboutMe: p.aboutMe || p.bio || '',
            PartnerExpectations: p.partnerExpectations || '',
            IsGovtIdVerified: Boolean(p.isGovtIdVerified || p.isVerified),
            GovtIdDocUrl: p.govtIdDocUrl || '',
            PhotoPrivacy: p.photoPrivacy || 'All Members',
          }));

          // Photos
          if (Array.isArray(g) && g.length > 0) {
            setPhotos(g.map((item: any, idx: number) => ({
              photoId: Number(item.photoId || item.PhotoId || 0),
              photoUrl: item.photoUrl || item.PhotoUrl,
              isMain: Boolean(item.isMain ?? item.IsMain ?? (idx === 0)),
              privacy: item.privacy || item.Privacy || 'All Members',
            })));
          } else if (p.photoUrl || p.mainPhotoUrl) {
            setPhotos([{
              photoId: 0,
              photoUrl: p.photoUrl || p.mainPhotoUrl,
              isMain: true,
              privacy: 'All Members',
            }]);
          }
        }
      } catch (err) {
        console.error("Error loading edit profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [router]);

  // Load cities whenever selectedStateId changes
  useEffect(() => {
    if (selectedStateId) {
      fetchCitiesApi(selectedStateId).then(list => {
        setStateCities(list);
        if (list.length > 0 && !list.some(c => c.id === selectedCityId)) {
          setSelectedCityId(Number(list[0].id));
        }
      });
    }
  }, [selectedStateId]);

  // 🌟 Save specific field via API (Silent on success, no intrusive toasts!)
  const saveFieldValue = async (field: string, value: any, extraData: any = {}) => {
    const token = getAuthToken();
    if (!token) return;

    setSavingField(field);

    try {
      const fd = new FormData();
      fd.append("UserId", String(formData.UserId || 0));
      fd.append(field, String(value));

      // Append companion text names if saving occupation IDs
      if (extraData.FatherOccupation && field === 'FatherOccupationId') {
        fd.append('FatherOccupation', String(extraData.FatherOccupation));
      }
      if (extraData.MotherOccupation && field === 'MotherOccupationId') {
        fd.append('MotherOccupation', String(extraData.MotherOccupation));
      }
      if (extraData.CurrentCityId && field === 'CurrentStateId') {
        fd.append('CurrentCityId', String(extraData.CurrentCityId));
      }
      if (extraData.NativePlaceCityId && (field === 'NativePlaceStateId' || field === 'NativeLocation' || field === 'FamilyLocation')) {
        fd.append('NativePlaceCityId', String(extraData.NativePlaceCityId));
      }

      const res = await updateProfileApi(fd, token);
      if (res.success || (res as any).Success === 1) {
        setFormData((prev: any) => ({
          ...prev,
          [field]: value,
          ...extraData,
        }));

        // Sync FullName with localStorage if Name is updated
        if (field === 'FullName' && typeof window !== "undefined") {
          ['user_details', 'user_session', 'cached_profile_details'].forEach(k => {
            const stored = localStorage.getItem(k);
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                parsed.fullName = value;
                parsed.FullName = value;
                localStorage.setItem(k, JSON.stringify(parsed));
              } catch {}
            }
          });
        }

        // Silent close of sheets without intrusive toasts!
        setActiveSheet(null);
      } else {
        toast.error(res.message || "Failed to update detail.");
      }
    } catch {
      toast.error("Failed to connect to server.");
    } finally {
      setSavingField(null);
    }
  };

  // Open Options Sheet
  const openOptionSheet = (
    title: string, 
    fieldKey: string, 
    currentValue: any, 
    options: Array<{ id: any; value: string; desc?: string }>
  ) => {
    setSheetTitle(title);
    setSheetFieldKey(fieldKey);
    setSelectedSheetValue(currentValue);
    setSheetOptions(options);
    setSheetSearch('');
    setActiveSheet('option');
  };

  // Open Text Input Sheet
  const openTextInputSheet = (
    title: string,
    subtitle: string,
    fieldKey: string,
    currentValue: string,
    placeholder: string,
    maxLength: number = 120,
    multiline: boolean = false,
    inputType: 'text' | 'tel' | 'email' = 'text'
  ) => {
    setTextInputData({
      title,
      subtitle,
      fieldKey,
      value: currentValue || '',
      placeholder,
      maxLength,
      multiline,
      inputType,
    });
    setActiveSheet('textInput');
  };

  // Save Text Input
  const handleSaveTextInput = () => {
    saveFieldValue(textInputData.fieldKey, textInputData.value.trim());
  };

  // Open Mobile Change Sheet with OTP
  const openChangeMobileSheet = () => {
    setNewMobileNumber('');
    setMobileOtpCode('');
    setMobileOtpSent(false);
    setActiveSheet('changeMobile');
  };

  const handleSendMobileOtp = async () => {
    const cleanNum = newMobileNumber.replace(/\D/g, '');
    if (cleanNum.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (cleanNum === String(formData.MobileNumber || '').replace(/\D/g, '')) {
      toast.error("New number cannot be the same as your current registered number.");
      return;
    }

    setSendingMobileOtp(true);
    const res = await sendOtpApi(cleanNum, "null", "ChangeMobile");
    setSendingMobileOtp(false);

    if (res.success || res.Success === 1) {
      setMobileOtpSent(true);
      toast.success(`Verification code sent to +91 ${cleanNum}`);
    } else {
      toast.error(res.message || res.Message || "Failed to send OTP to new number.");
    }
  };

  const handleVerifyAndUpdateMobile = async () => {
    const cleanNum = newMobileNumber.replace(/\D/g, '');
    if (!mobileOtpCode || mobileOtpCode.trim().length < 4) {
      toast.error("Please enter the 6-digit verification code.");
      return;
    }

    const token = getAuthToken();
    setVerifyingMobileOtp(true);
    const res = await changeMobileApi(cleanNum, mobileOtpCode.trim(), token);
    setVerifyingMobileOtp(false);

    if (res.success === 1 || res.Success === 1 || res.success === true) {
      setFormData((prev: any) => ({ ...prev, MobileNumber: cleanNum }));
      if (typeof window !== "undefined") {
        ['user_details', 'user_session', 'cached_profile_details'].forEach(k => {
          const stored = localStorage.getItem(k);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              parsed.mobileNumber = cleanNum;
              parsed.MobileNumber = cleanNum;
              localStorage.setItem(k, JSON.stringify(parsed));
            } catch {}
          }
        });
      }
      setActiveSheet(null);
      toast.success("Mobile number updated successfully!");
    } else {
      toast.error(res.message || res.Message || "Invalid OTP code. Please try again.");
    }
  };

  // Open Height Sheet
  const openHeightSheet = () => {
    setHeightCm(parseHeightToCm(formData.Height));
    setActiveSheet('height');
  };

  const handleSaveHeight = () => {
    const formatted = cmToFtIn(heightCm);
    saveFieldValue('Height', formatted);
  };

  // Open Income Sheet
  const openIncomeSheet = () => {
    const current = formData.AnnualIncome || '₹5 - 7 Lakhs';
    const idx = INCOME_BRACKETS.findIndex(b => b.toLowerCase().replace(/[^a-z0-9]/g, '') === current.toLowerCase().replace(/[^a-z0-9]/g, ''));
    setIncomeIndex(idx >= 0 ? idx : 4);
    setActiveSheet('income');
  };

  const handleSaveIncome = () => {
    const selectedIncome = INCOME_BRACKETS[incomeIndex] || '₹5 - 7 Lakhs';
    saveFieldValue('AnnualIncome', selectedIncome);
  };

  // Open Date of Birth 3-Column Picker
  const openDobPickerSheet = () => {
    if (formData.DateOfBirth) {
      const dob = new Date(formData.DateOfBirth);
      if (!isNaN(dob.getTime())) {
        setDobDay(dob.getDate());
        setDobMonth(dob.getMonth() + 1);
        setDobYear(dob.getFullYear());
      }
    }
    setActiveSheet('dobPicker');
  };

  // Dynamic days in selected month & year
  const daysInCurrentMonth = useMemo(() => {
    return new Date(dobYear, dobMonth, 0).getDate();
  }, [dobYear, dobMonth]);

  // Calculated Age live from selected DOB
  const calculatedLiveAge = useMemo(() => {
    const birthDate = new Date(dobYear, dobMonth - 1, Math.min(dobDay, daysInCurrentMonth));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return Math.max(18, age);
  }, [dobYear, dobMonth, dobDay, daysInCurrentMonth]);

  const handleSaveDob = () => {
    const validDay = Math.min(dobDay, daysInCurrentMonth);
    const isoDate = `${dobYear}-${String(dobMonth).padStart(2, '0')}-${String(validDay).padStart(2, '0')}`;
    saveFieldValue('DateOfBirth', isoDate, {
      Age: calculatedLiveAge,
    });
  };

  // Open Sibling Counters
  const openCountersSheet = () => {
    setCountersState({
      totalBrothers: formData.TotalBrothers || 0,
      marriedBrothers: formData.MarriedBrothers || 0,
      totalSisters: formData.TotalSisters || 0,
      marriedSisters: formData.MarriedSisters || 0,
    });
    setActiveSheet('counters');
  };

  const handleSaveCounters = () => {
    saveFieldValue('TotalBrothers', countersState.totalBrothers, {
      MarriedBrothers: countersState.marriedBrothers,
      TotalSisters: countersState.totalSisters,
      MarriedSisters: countersState.marriedSisters,
    });
  };

  // Open Location Sheet
  const openLocationSheet = (target: 'Location' | 'FamilyLocation' | 'NativeLocation') => {
    setLocationTargetField(target);
    if (target === 'FamilyLocation' || target === 'NativeLocation') {
      setSelectedStateId(formData.NativePlaceStateId || 14);
      setSelectedCityId(formData.NativePlaceCityId || 1);
    } else {
      setSelectedStateId(formData.CurrentStateId || 14);
      setSelectedCityId(formData.CurrentCityId || 1);
    }
    setActiveSheet('location');
  };

  // Open Bio Full Sheet
  const openBioSheet = () => {
    setBioDraft(formData.AboutMe || '');
    setActiveSheet('bio');
  };

  // Open Multi-Select Sheet (Hobbies, Interests, Sports, LanguagesKnown)
  const openMultiSelectSheet = (key: 'Hobbies' | 'Interests' | 'Sports' | 'LanguagesKnown') => {
    setMultiSelectKey(key);
    let title = 'Select Hobbies';
    let subtitle = 'Choose all pastimes you enjoy';
    let available: MasterOption[] = masterData.HOBBIES || [];

    if (key === 'Interests') {
      title = 'Select Music & Interests';
      subtitle = 'Pick genres, melodies, and personal passions';
      available = masterData.INTERESTS || [];
    } else if (key === 'Sports') {
      title = 'Select Sports & Fitness';
      subtitle = 'Choose sports and physical activities you participate in';
      available = masterData.SPORTS || [];
    } else if (key === 'LanguagesKnown') {
      title = 'Languages You Know';
      subtitle = 'Select all languages you speak or understand fluently';
      available = masterData.LANGUAGES || [];
    }

    const currentVal = formData[key] || '';
    const currentList = currentVal.split(',').map((s: string) => s.trim()).filter(Boolean);

    setMultiSelectTitle(title);
    setMultiSelectSubtitle(subtitle);
    setMultiSelectItems(currentList);
    setMultiSelectAvailable(available);
    setMultiSelectSearch('');
    setActiveSheet('multiSelect');
  };

  const toggleMultiSelectItem = (val: string) => {
    setMultiSelectItems(prev => {
      if (prev.includes(val)) {
        return prev.filter(item => item !== val);
      } else {
        return [...prev, val];
      }
    });
  };

  const handleSaveMultiSelect = () => {
    const joined = multiSelectItems.join(', ');
    saveFieldValue(multiSelectKey, joined);
  };

  // Save Bio
  const handleSaveBio = () => {
    saveFieldValue('AboutMe', bioDraft.trim());
  };

  // Save Location
  const handleSaveLocation = () => {
    const stateObj = (masterData.STATES || []).find(s => s.id === selectedStateId);
    const cityObj = stateCities.find(c => c.id === selectedCityId);
    const sName = stateObj?.value || formData.StateName;
    const cName = cityObj?.value || formData.CityName;
    const locText = `${cName}, ${sName}, India`;

    if (locationTargetField === 'FamilyLocation') {
      saveFieldValue('FamilyLocation', locText, {
        NativePlaceStateId: selectedStateId,
        NativePlaceCityId: selectedCityId,
      });
    } else if (locationTargetField === 'NativeLocation') {
      saveFieldValue('NativePlaceStateId', selectedStateId, {
        NativePlaceCityId: selectedCityId,
        NativeLocation: locText,
      });
    } else {
      saveFieldValue('CurrentStateId', selectedStateId, {
        CurrentCityId: selectedCityId,
        Location: locText,
        StateName: sName,
        CityName: cName,
      });
    }
  };

  // Save Option Selection with Dynamic Master IDs
  const handleSaveOption = () => {
    const selectedObj = sheetOptions.find(o => String(o.id) === String(selectedSheetValue) || o.value === selectedSheetValue);
    if (!selectedObj) {
      setActiveSheet(null);
      return;
    }

    if (sheetFieldKey === 'ProfileCreatedFor') {
      saveFieldValue('ProfileCreatedFor', selectedObj.id, { ProfileCreatedFor: selectedObj.id, ProfileCreatedForName: selectedObj.value });
    } else if (sheetFieldKey === 'MaritalStatus') {
      saveFieldValue('MaritalStatus', selectedObj.id, { MaritalStatus: selectedObj.id, MaritalStatusName: selectedObj.value });
    } else if (sheetFieldKey === 'Sect') {
      saveFieldValue('Sect', selectedObj.id, { Sect: selectedObj.id, SectName: selectedObj.value });
    } else if (sheetFieldKey === 'Caste') {
      saveFieldValue('Caste', selectedObj.id, { Caste: selectedObj.id, CasteName: selectedObj.value });
    } else if (sheetFieldKey === 'Maslak') {
      saveFieldValue('Maslak', selectedObj.id, { Maslak: selectedObj.id, MaslakName: selectedObj.value });
    } else if (sheetFieldKey === 'MotherTongue') {
      saveFieldValue('MotherTongue', selectedObj.id, { MotherTongue: selectedObj.id, MotherTongueName: selectedObj.value });
    } else if (sheetFieldKey === 'Education') {
      saveFieldValue('HighestDegree', selectedObj.id, { Education: selectedObj.id, HighestDegree: selectedObj.id, HighestDegreeName: selectedObj.value });
    } else if (sheetFieldKey === 'EmployedIn') {
      saveFieldValue('EmploymentSector', selectedObj.id, { EmployedIn: selectedObj.id, EmploymentSector: selectedObj.id, EmploymentSectorName: selectedObj.value });
    } else if (sheetFieldKey === 'Occupation') {
      saveFieldValue('Designation', selectedObj.id, { Occupation: selectedObj.id, Designation: selectedObj.id, DesignationName: selectedObj.value });
    } else if (sheetFieldKey === 'FatherOccupation') {
      saveFieldValue('FatherOccupationId', selectedObj.id, { FatherOccupation: selectedObj.value, FatherOccupationId: selectedObj.id, FatherOccupationName: selectedObj.value });
    } else if (sheetFieldKey === 'MotherOccupation') {
      saveFieldValue('MotherOccupationId', selectedObj.id, { MotherOccupation: selectedObj.value, MotherOccupationId: selectedObj.id, MotherOccupationName: selectedObj.value });
    } else if (sheetFieldKey === 'FamilyType') {
      saveFieldValue('FamilyType', selectedObj.id, { FamilyType: selectedObj.id, FamilyTypeName: selectedObj.value });
    } else if (sheetFieldKey === 'FamilyStatus') {
      saveFieldValue('FamilyStatus', selectedObj.id, { FamilyStatus: selectedObj.id, FamilyStatusName: selectedObj.value });
    } else if (sheetFieldKey === 'Disability') {
      saveFieldValue('Disability', selectedObj.value);
    } else if (sheetFieldKey === 'NamazHabit') {
      saveFieldValue('NamazHabit', selectedObj.value);
    } else if (sheetFieldKey === 'QuranReading') {
      saveFieldValue('QuranReading', selectedObj.value);
    } else if (sheetFieldKey === 'RozaHabit') {
      saveFieldValue('RozaHabit', selectedObj.value);
    } else if (sheetFieldKey === 'HijabOrBeard') {
      saveFieldValue('HijabOrBeard', selectedObj.value);
    } else if (sheetFieldKey === 'ZakatHabit') {
      saveFieldValue('ZakatHabit', selectedObj.value);
    } else if (sheetFieldKey === 'HajjUmrah') {
      saveFieldValue('HajjUmrah', selectedObj.value);
    } else if (sheetFieldKey === 'DietType') {
      saveFieldValue('DietType', selectedObj.value);
    } else if (sheetFieldKey === 'SmokeHabit') {
      saveFieldValue('SmokeHabit', selectedObj.value);
    } else if (sheetFieldKey === 'DrinkHabit') {
      saveFieldValue('DrinkHabit', selectedObj.value);
    } else if (sheetFieldKey === 'CanCook') {
      saveFieldValue('CanCook', selectedObj.value === 'Yes');
    } else {
      saveFieldValue(sheetFieldKey, selectedObj.value);
    }
  };

  // Save Photo Privacy
  const handleSavePhotoPrivacy = async (privacyValue: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await updatePhotoPrivacyApi(privacyValue, token);
      if (res.success || (res as any).Success === 1) {
        setFormData((prev: any) => ({ ...prev, PhotoPrivacy: privacyValue }));
        setActiveSheet(null);
      } else {
        toast.error("Failed to update photo privacy.");
      }
    } catch {
      toast.error("Network error.");
    }
  };

  // Upload Photo to Slot (0-3)
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>, slotIdx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const invalidExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.iso', '.zip', '.rar', '.exe', '.tar', '.gz'];
    const nameLower = file.name.toLowerCase();
    if (invalidExts.some(ext => nameLower.endsWith(ext))) {
      toast.error("Please choose a valid photo file (JPG, PNG, WEBP, etc.)");
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    setUploadingPhotoSlot(slotIdx);
    toast.loading("Verifying human face...", { id: "face-scan" });

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Solo Human Face Check
      const faceResult = await clientValidateSingleFace(dataUrl);
      toast.dismiss("face-scan");

      if (!faceResult.isValid) {
        toast.error(faceResult.message || "Please upload a clear solo photo of yourself. Screenshots and scenery are not allowed.");
        return;
      }

      // Slot 0 is Main Profile Photo
      const isMainSlot = slotIdx === 0;
      const gfd = new FormData();
      gfd.append("Photo", file);
      gfd.append("IsMain", String(isMainSlot));
      const res = await uploadGalleryPhotoApi(gfd, token);

      if (res.success) {
        const newPhotoUrl = res.data?.photoUrl || res.data?.url || dataUrl;
        const newPhotoId = res.data?.photoId || Date.now();

        setPhotos(prev => {
          const next = [...prev];
          next[slotIdx] = {
            photoId: newPhotoId,
            photoUrl: newPhotoUrl,
            isMain: isMainSlot,
          };
          return next;
        });

        if (isMainSlot) {
          syncUserProfilePhoto(newPhotoUrl);
          setFormData((prev: any) => ({ ...prev, PhotoUrl: newPhotoUrl }));
        }
      } else {
        toast.error(res.message || "Failed to upload photo.");
      }
    } catch {
      toast.dismiss("face-scan");
      toast.error("Photo verification failed. Please try another image.");
    } finally {
      setUploadingPhotoSlot(null);
      e.target.value = '';
    }
  };

  // Delete Photo - allows deleting any photo, even all photos, auto-promotes slot 1 if main deleted
  const handleDeletePhoto = async (photoId: number, index: number) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const remaining = photos.filter((_, i) => i !== index);

      if (photoId > 0) {
        await deleteGalleryPhotoApi(photoId, token);
      }

      if (remaining.length === 0) {
        // 🔒 Complete removal: user removed their only/last photo
        const fd = new FormData();
        fd.append("UserId", String(formData.UserId || 0));
        fd.append("PhotoUrl", "");
        await updateProfileApi(fd, token);
        syncUserProfilePhoto('');
        setFormData((prev: any) => ({ ...prev, PhotoUrl: '' }));
      } else {
        // More photos remain: auto promote first photo if slot 0 was deleted
        if (index === 0) {
          const nextPhotoId = Number(remaining[0].photoId || (remaining[0] as any).PhotoId || 0);
          if (nextPhotoId > 0) {
            await setMainPhotoApi(nextPhotoId, token);
          }
        }
        const firstPhotoUrl = remaining[0].photoUrl || (remaining[0] as any).PhotoUrl || '';
        syncUserProfilePhoto(firstPhotoUrl);
        setFormData((prev: any) => ({ ...prev, PhotoUrl: firstPhotoUrl }));
      }

      setPhotos(remaining);
      toast.success("Photo removed successfully.");
    } catch {
      toast.error("Failed to remove photo.");
    }
  };

  // Submit Govt ID Document for Admin Approval
  const handleSubmitGovtDoc = async () => {
    if (!govtDocFile) {
      toast.error("Please choose a document image or PDF first.");
      return;
    }
    const token = getAuthToken();
    if (!token) return;

    setUploadingGovtDoc(true);
    try {
      const fd = new FormData();
      fd.append("Document", govtDocFile);
      const res = await uploadGovtDocumentApi(fd, token);
      if (res.success || (res as any).Success === 1) {
        toast.success("Identity document submitted! Our team will verify it.");
        setFormData((prev: any) => ({ ...prev, GovtIdDocUrl: govtDocPreview, IsGovtIdVerified: false }));
        setActiveSheet(null);
      } else {
        toast.error(res.message || "Failed to upload document.");
      }
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploadingGovtDoc(false);
    }
  };

  // Search Filter for Options Sheet
  const filteredSheetOptions = useMemo(() => {
    if (!sheetSearch.trim()) return sheetOptions;
    return sheetOptions.filter(o => o.value.toLowerCase().includes(sheetSearch.toLowerCase()));
  }, [sheetOptions, sheetSearch]);

  // Search Filter for Multi-Select Sheet
  const filteredMultiSelectOptions = useMemo(() => {
    if (!multiSelectSearch.trim()) return multiSelectAvailable;
    return multiSelectAvailable.filter(o => o.value.toLowerCase().includes(multiSelectSearch.toLowerCase()));
  }, [multiSelectAvailable, multiSelectSearch]);

  // Master Options Mappers
  const educationOpts = masterData.EDUCATIONS || [];
  const casteOpts = masterData.CASTES || [];
  const maslakOpts = masterData.MASLAKS || [];
  const languageOpts = masterData.MOTHER_TONGUES || [];
  const occupationOpts = masterData.OCCUPATIONS || [];
  const employedInOpts = masterData.EMPLOYMENT_SECTORS || [];
  const familyTypeOpts = masterData.FAMILY_TYPES || [];
  const familyStatusOpts = masterData.FAMILY_STATUS || [];
  const profileCreatedForOpts = masterData.PROFILE_CREATED_FOR || [];
  const maritalStatusOpts = masterData.MARITAL_STATUS || [];
  const sectOpts = masterData.SECTS || [];

  const disabilityOpts = masterData.DISABILITIES && masterData.DISABILITIES.length > 0 ? masterData.DISABILITIES : [{ id: 'Normal / None', value: 'Normal / None' }, { id: 'Physically Challenged', value: 'Physically Challenged' }];
  const namazOpts = masterData.NAMAZ_HABITS && masterData.NAMAZ_HABITS.length > 0 ? masterData.NAMAZ_HABITS : [{ id: 'Always (5 Times Daily)', value: 'Always (5 Times Daily)' }, { id: 'Regularly (Most Times)', value: 'Regularly (Most Times)' }];
  const quranOpts = masterData.QURAN_READING && masterData.QURAN_READING.length > 0 ? masterData.QURAN_READING : [{ id: 'Daily Recitation', value: 'Daily Recitation' }, { id: 'Daily with Translation / Tafseer', value: 'Daily with Translation / Tafseer' }];
  const rozaOpts = masterData.ROZA_HABITS && masterData.ROZA_HABITS.length > 0 ? masterData.ROZA_HABITS : [{ id: 'All 30 Days of Ramadan', value: 'All 30 Days of Ramadan' }, { id: 'Most Days of Ramadan', value: 'Most Days of Ramadan' }];
  const hijabOpts = masterData.HIJAB_BEARD && masterData.HIJAB_BEARD.length > 0 ? masterData.HIJAB_BEARD : [{ id: 'Always Hijab / Niqab', value: 'Always Hijab / Niqab' }, { id: 'Full Sunnah Beard', value: 'Full Sunnah Beard' }];
  const zakatOpts = masterData.ZAKAT_HABITS && masterData.ZAKAT_HABITS.length > 0 ? masterData.ZAKAT_HABITS : [{ id: 'Pay Regularly Every Year', value: 'Pay Regularly Every Year' }, { id: 'Pay Voluntarily / Generous Charity', value: 'Pay Voluntarily / Generous Charity' }];
  const hajjOpts = masterData.HAJJ_UMRAH && masterData.HAJJ_UMRAH.length > 0 ? masterData.HAJJ_UMRAH : [{ id: 'Performed Both Hajj & Umrah', value: 'Performed Both Hajj & Umrah' }, { id: 'Planning Soon (Insha\'Allah)', value: 'Planning Soon (Insha\'Allah)' }];
  const dietOpts = masterData.DIET_TYPES && masterData.DIET_TYPES.length > 0 ? masterData.DIET_TYPES : [{ id: 'Strictly Halal Always', value: 'Strictly Halal Always' }, { id: 'Halal Non-Veg & Veg', value: 'Halal Non-Veg & Veg' }];
  const habitOpts = masterData.SMOKE_HABITS && masterData.SMOKE_HABITS.length > 0 ? masterData.SMOKE_HABITS : [{ id: 'Non-Smoker / Never', value: 'Non-Smoker / Never' }, { id: 'Occasionally / Socially', value: 'Occasionally / Socially' }];
  const cookOpts = masterData.COOKING_SKILLS && masterData.COOKING_SKILLS.length > 0 ? masterData.COOKING_SKILLS : [{ id: 'Can Cook Daily / Basic Meals', value: 'Can Cook Daily / Basic Meals' }, { id: 'Expert / Passionate Cook', value: 'Expert / Passionate Cook' }];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="text-[#d91b5c] animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading your profile portfolio...</p>
      </div>
    );
  }

  const activePhotosCount = photos.filter(p => p && p.photoUrl).length;
  const hasHobbies = Boolean(formData.Hobbies && formData.Hobbies.trim().length > 0);
  const hasMusicInterests = Boolean(formData.Interests && formData.Interests.trim().length > 0);
  const showTopLifestylePrompt = !(hasHobbies && hasMusicInterests);

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-28 font-sans selection:bg-[#d91b5c] selection:text-white">
      <Toaster position="top-center" richColors />

      {/* 🌟 1. ELEVATED FLOATING APP BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 shadow-xs">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => router.push('/dashboard/my-profile')}
              className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Back to profile"
            >
              <X size={20} className="stroke-[2.2]" />
            </button>
            <h1 className="text-base font-black tracking-tight text-slate-900">
              Edit Profile
            </h1>
          </div>

          <button 
            type="button"
            onClick={() => router.push('/dashboard/my-profile')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#d91b5c] hover:opacity-80 transition-all cursor-pointer"
          >
            <Eye size={16} className="text-[#d91b5c]" />
            <span>Preview</span>
          </button>
        </div>
      </header>

      {/* 🌟 MAIN CONTAINER */}
      <main className="max-w-lg mx-auto px-4 pt-3 space-y-4">

        {/* 🌟 100% COMPLETE PROFILE BADGE PROMPT (Matching Screenshot) */}
        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-white border border-amber-200/60 shadow-xs">
          <div className="w-6 h-6 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
            <Star size={13} className="fill-amber-400" />
          </div>
          <span className="text-xs font-bold text-slate-800">
            Earn the badge on 100% complete profile.
          </span>
        </div>

        {/* 🌟 TOP QUICK ACTION CARDS */}
        <div className={`grid ${showTopLifestylePrompt ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
          {/* Card 1: Lifestyle & Interest Prompt Card */}
          {showTopLifestylePrompt && (
            <div 
              onClick={() => setActiveSheet('lifestyleHub')}
              className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-rose-300 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Lifestyle & Interest
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-[#8C6000]">
                  +10% Score
                </span>
              </div>
              <div className="mt-3">
                <span className="text-xs font-bold text-[#d91b5c] block">
                  Add Details
                </span>
              </div>
            </div>
          )}

          {/* Card 2: Official Govt ID Trust Verification */}
          <div 
            onClick={() => setActiveSheet('trustBadge')}
            className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-rose-300 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">
                  Verify Your Profile
                </span>
                <CheckCircle2 size={14} className="text-sky-500 fill-sky-100 shrink-0" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xs font-bold text-[#d91b5c] block">
                {formData.IsGovtIdVerified ? "Verified ✓" : (formData.GovtIdDocUrl ? "Under Review ⏳" : "Verify Profile")}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 🌟 PHOTOS GALLERY SECTION (COMPACT SQUARE THUMBNAILS!)          */}
        {/* ============================================================== */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Camera size={18} className="text-slate-800" />
              <h2 className="text-sm font-black text-slate-900">Photos</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {activePhotosCount}/4 Uploaded
            </span>
          </div>

          {/* Compact Photo Thumbnails Row */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 pt-1">
            {[0, 1, 2, 3].map((slotIdx) => {
              const photo = photos[slotIdx];
              const isUploading = uploadingPhotoSlot === slotIdx;

              if (photo && photo.photoUrl) {
                return (
                  <div 
                    key={slotIdx} 
                    className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden border border-slate-200 shadow-xs group bg-slate-100 shrink-0"
                  >
                    <img 
                      src={photo.photoUrl} 
                      alt={`Photo ${slotIdx + 1}`}
                      className="w-full h-full object-cover" 
                    />
                    
                    {/* Primary Avatar Badge on First Photo */}
                    {slotIdx === 0 && (
                      <div className="absolute bottom-0 inset-x-0 bg-black/80 py-0.5 text-center">
                        <span className="text-[8px] font-black tracking-wider text-white uppercase block">
                          PROFILE PHOTO
                        </span>
                      </div>
                    )}

                    {/* Delete Photo Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(photo.photoId, slotIdx);
                      }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                      title="Delete photo"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                );
              }

              return (
                <label 
                  key={slotIdx} 
                  className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl border-2 border-dashed border-rose-300/80 hover:border-[#d91b5c] bg-white flex flex-col items-center justify-center cursor-pointer transition-all shrink-0 relative group"
                >
                  <input 
                    type="file"
                    accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.heic,.heif,.jfif,.bmp,.gif,.tiff"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => handlePhotoSelect(e, slotIdx)}
                  />
                  {isUploading ? (
                    <Loader2 size={18} className="text-[#d91b5c] animate-spin" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#d91b5c] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      <Plus size={15} className="stroke-[3]" />
                    </div>
                  )}
                </label>
              );
            })}
          </div>

          {/* Photo privacy option: ONLY appears when at least 1 photo is uploaded */}
          {activePhotosCount > 0 && (
            <div 
              onClick={() => setActiveSheet('photoPrivacy')}
              className="mt-3 p-3 rounded-2xl bg-rose-50/40 border border-rose-100 flex items-center justify-between cursor-pointer hover:bg-rose-50/70 transition-all"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 block">Control who sees your photo</span>
                <span className="text-xs font-bold text-[#d91b5c] mt-0.5 flex items-center gap-1">
                  {formData.PhotoPrivacy} <ChevronRight size={13} className="inline rotate-90" />
                </span>
              </div>
            </div>
          )}
        </section>

        {/* ============================================================== */}
        {/* 🌟 BIO / ABOUT ME SECTION                                      */}
        {/* ============================================================== */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-2">
            <User size={18} className="text-slate-800" />
            <h2 className="text-sm font-black text-slate-900">Bio</h2>
          </div>

          <div 
            onClick={openBioSheet}
            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-rose-300 transition-all cursor-pointer relative"
          >
            <p className={`text-xs leading-relaxed ${formData.AboutMe ? 'text-slate-700 font-normal line-clamp-3' : 'text-slate-400 italic'}`}>
              {formData.AboutMe || "Write a brief description about yourself, your values, and background... (Click to add bio)"}
            </p>
            <div className="mt-2 text-right">
              <span className="text-xs font-bold text-slate-900 hover:text-[#d91b5c] transition-colors">
                ... Edit
              </span>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 🌟 1. PERSONAL DETAILS SECTION                                 */}
        {/* ============================================================== */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <User size={18} className="text-slate-800" />
            <h2 className="text-sm font-black text-slate-900">Personal Details</h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {/* 1. Name (Locked - Cannot be edited) */}
            <div 
              onClick={() => toast.info("Name is verified during registration and cannot be edited.", { icon: "🔒" })}
              className="p-3.5 sm:p-4 flex items-center justify-between bg-slate-50/40 cursor-default"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Name</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.FullName || "User"}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                <Info size={12} className="text-slate-400" />
                <span>You can not edit this</span>
              </div>
            </div>

            {/* 2. Profile Created For (Locked - Screenshot 9) */}
            <div 
              onClick={() => toast.info("Profile created for is locked for security.", { icon: "🔒" })}
              className="p-3.5 sm:p-4 flex items-center justify-between bg-slate-50/40 cursor-default"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Profile Created for</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{getMasterLabel('PROFILE_CREATED_FOR', formData.ProfileCreatedFor)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                <Info size={12} className="text-slate-400" />
                <span>You can not edit this</span>
              </div>
            </div>

            {/* 3. Age and Gender (Locked - Screenshot 9) */}
            <div 
              onClick={() => toast.info("Age and gender are verified during registration and locked.", { icon: "🔒" })}
              className="p-3.5 sm:p-4 flex items-center justify-between bg-slate-50/40 cursor-default"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Age and Gender</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.Age}, {formData.Gender}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                <Info size={12} className="text-slate-400" />
                <span>You can not edit this</span>
              </div>
            </div>

            {/* 4. Marital Status (Locked - Screenshot 9) */}
            <div 
              onClick={() => toast.info("Marital status is locked. Contact support if needed.", { icon: "🔒" })}
              className="p-3.5 sm:p-4 flex items-center justify-between bg-slate-50/40 cursor-default"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Marital Status</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{getMasterLabel('MARITAL_STATUS', formData.MaritalStatus)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                <Info size={12} className="text-slate-400" />
                <span>You can not edit this</span>
              </div>
            </div>

            {/* 5. Sect (Locked - Screenshot 6 & 9) */}
            <div 
              onClick={() => toast.info("Sect cannot be edited directly.", { icon: "🔒" })}
              className="p-3.5 sm:p-4 flex items-center justify-between bg-slate-50/40 cursor-default"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Sect</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{getMasterLabel('SECTS', formData.Sect)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                <Info size={12} className="text-slate-400" />
                <span>You can not edit this</span>
              </div>
            </div>

            {/* 6. Height (Editable with Slider Sheet) */}
            <div 
              onClick={openHeightSheet}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Height</span>
                <span className="text-xs mt-0.5 block">{renderLabel(formData.Height, "Select Height")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 7. Caste (Editable with Searchable Radio Sheet) */}
            <div 
              onClick={() => openOptionSheet('Select caste', 'Caste', formData.Caste, casteOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Caste</span>
                <span className="text-xs mt-0.5 block">{renderLabel(getMasterLabel('CASTES', formData.Caste), "Select Caste")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 8. Maslak (Editable with Searchable Radio Sheet) */}
            <div 
              onClick={() => openOptionSheet('Select Maslak', 'Maslak', formData.Maslak, maslakOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Maslak</span>
                <span className="text-xs mt-0.5 block">{renderLabel(getMasterLabel('MASLAKS', formData.Maslak), "Select Maslak")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 9. Mother Tongue */}
            <div 
              onClick={() => openOptionSheet('Select Mother Tongue', 'MotherTongue', formData.MotherTongue, languageOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Mother Tongue</span>
                <span className="text-xs mt-0.5 block">{renderLabel(getMasterLabel('MOTHER_TONGUES', formData.MotherTongue), "Select Mother Tongue")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 10. Location (State & City Selector) */}
            <div 
              onClick={() => openLocationSheet('Location')}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Location</span>
                <span className="text-xs mt-0.5 block">{renderLabel(formData.Location, "Select Location")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 11. Disability */}
            <div 
              onClick={() => openOptionSheet('Disability', 'Disability', formData.Disability, disabilityOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Disability</span>
                <span className="text-xs mt-0.5 block">{renderLabel(formData.Disability, "Select Disability Status")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 🌟 2. EDUCATION & CAREER SECTION                               */}
        {/* ============================================================== */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <GraduationCap size={18} className="text-slate-800" />
            <h2 className="text-sm font-black text-slate-900">Education & Career</h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {/* 1. Education */}
            <div 
              onClick={() => openOptionSheet('Select education', 'Education', formData.Education, educationOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Education</span>
                <span className="text-xs mt-0.5 block">{renderLabel(getMasterLabel('EDUCATIONS', formData.Education), "Select Education")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 2. College Name */}
            <div 
              onClick={() => openTextInputSheet(
                "College Name",
                "Enter your college or institute name",
                "CollegeName",
                formData.CollegeName,
                "e.g. Regional College Of Professional Studies...",
                140
              )}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">College Name</span>
                <span className="text-xs mt-0.5 block">{renderLabel(formData.CollegeName, "Add College Name")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 3. Employed In */}
            <div 
              onClick={() => openOptionSheet('Select Employed In', 'EmployedIn', formData.EmployedIn, employedInOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Employed In</span>
                <span className="text-xs mt-0.5 block">{renderLabel(getMasterLabel('EMPLOYMENT_SECTORS', formData.EmployedIn), "Select Employed In")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 4. Occupation */}
            <div 
              onClick={() => openOptionSheet('Select Occupation', 'Occupation', formData.Occupation, occupationOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Occupation</span>
                <span className="text-xs mt-0.5 block">{renderLabel(getMasterLabel('OCCUPATIONS', formData.Occupation), "Select Occupation")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 5. Annual Income */}
            <div 
              onClick={openIncomeSheet}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Annual Income</span>
                <span className="text-xs mt-0.5 block">{renderLabel(formData.AnnualIncome, "Select Annual Income")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 🌟 3. FAMILY DETAILS SECTION                                   */}
        {/* ============================================================== */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Users size={18} className="text-slate-800" />
            <h2 className="text-sm font-black text-slate-900">Family Details</h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {/* 1. Family Location */}
            <div 
              onClick={() => openLocationSheet('FamilyLocation')}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Family Location</span>
                <span className="text-xs mt-0.5 block">{renderLabel(formData.FamilyLocation, "Select Family Location")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 2. Family Type */}
            <div 
              onClick={() => openOptionSheet('Family Type', 'FamilyType', formData.FamilyType, familyTypeOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Family Type</span>
                <span className="text-xs mt-0.5 block">{renderLabel(getMasterLabel('FAMILY_TYPES', formData.FamilyType), "Select Family Type")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 3. Family Status */}
            <div 
              onClick={() => openOptionSheet('Family Status', 'FamilyStatus', formData.FamilyStatus, familyStatusOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Family Status</span>
                <span className="text-xs mt-0.5 block">{renderLabel(getMasterLabel('FAMILY_STATUS', formData.FamilyStatus), "Select Family Status")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 4. Native Location */}
            <div 
              onClick={() => openLocationSheet('NativeLocation')}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Native Location</span>
                <span className="text-xs mt-0.5 block">{renderLabel(formData.NativeLocation, "Select Native Location")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 5. Father's Occupation (100% Dynamic Master, NO text box!) */}
            <div 
              onClick={() => openOptionSheet("Select Father's Profession", "FatherOccupation", formData.FatherOccupation, occupationOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Father's Occupation</span>
                <span className="text-xs mt-0.5 block">{renderLabel(getMasterLabel('OCCUPATIONS', formData.FatherOccupation) || formData.FatherOccupation, "Select Occupation")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 6. Mother's Occupation (100% Dynamic Master, NO text box!) */}
            <div 
              onClick={() => openOptionSheet("Select Mother's Profession", "MotherOccupation", formData.MotherOccupation, occupationOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Mother's Occupation</span>
                <span className="text-xs mt-0.5 block">{renderLabel(getMasterLabel('OCCUPATIONS', formData.MotherOccupation) || formData.MotherOccupation, "Select Occupation")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 7. Brothers */}
            <div 
              onClick={openCountersSheet}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Brother</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                  {formData.TotalBrothers} Brother ({formData.MarriedBrothers} Married)
                </span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 8. Sisters */}
            <div 
              onClick={openCountersSheet}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Sister</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                  {formData.TotalSisters} Sister ({formData.MarriedSisters} Married)
                </span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 🌟 4. CONTACT DETAILS SECTION                                  */}
        {/* ============================================================== */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Phone size={18} className="text-slate-800" />
            <h2 className="text-sm font-black text-slate-900">Contact Details</h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {/* 1. Phone Number (Change via OTP Verification) */}
            <div 
              onClick={openChangeMobileSheet}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Phone Number</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.MobileNumber ? `+91 ${formData.MobileNumber}` : "Add Mobile Number"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#d91b5c]">Change via OTP</span>
                <ChevronRight size={16} className="text-slate-400" />
              </div>
            </div>

            {/* 2. Email (Locked - Cannot be edited) */}
            <div 
              onClick={() => toast.info("Email address is locked for account security and cannot be edited.", { icon: "🔒" })}
              className="p-3.5 sm:p-4 flex items-center justify-between bg-slate-50/40 cursor-default"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Email</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.Email || "Not Provided"}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                <Info size={12} className="text-slate-400" />
                <span>You can not edit this</span>
              </div>
            </div>

            {/* 3. WhatsApp Number */}
            <div 
              onClick={() => openTextInputSheet(
                "WhatsApp Number",
                "Enter direct or Wali's WhatsApp number",
                "WhatsAppNumber",
                formData.WhatsAppNumber,
                "e.g. +91 9876543210",
                20,
                false,
                "tel"
              )}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">WhatsApp Number</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.WhatsAppNumber || "Add WhatsApp Number"}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 🌟 5. RELIGIOUS DETAILS SECTION                                */}
        {/* ============================================================== */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Moon size={18} className="text-slate-800" />
            <h2 className="text-sm font-black text-slate-900">Religious Details</h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {/* 1. Namaz */}
            <div 
              onClick={() => openOptionSheet('Daily Salah (Namaz)', 'NamazHabit', formData.NamazHabit, namazOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Namaz</span>
                <span className="text-xs mt-0.5 block">{renderLabel(formData.NamazHabit, "Select Namaz Habit")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 2. Quran Reading */}
            <div 
              onClick={() => openOptionSheet('Quran Reading & Recitation', 'QuranReading', formData.QuranReading, quranOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Quran Reading</span>
                <span className="text-xs mt-0.5 block">{renderLabel(formData.QuranReading, "Select Reading Routine")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 3. Do you keep Roza (Fasting) */}
            <div 
              onClick={() => openOptionSheet('Do You Keep Roza (Fasting)?', 'RozaHabit', formData.RozaHabit, rozaOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Do you keep Roza (Fasting)</span>
                <span className="text-xs mt-0.5 block">{renderLabel(formData.RozaHabit, "Select Fasting Routine")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 4. Hijab / Beard */}
            <div 
              onClick={() => openOptionSheet('Islamic Attire (Hijab / Beard)', 'HijabOrBeard', formData.HijabOrBeard, hijabOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Hijab / Beard</span>
                <span className="text-xs mt-0.5 block">{renderLabel(formData.HijabOrBeard, "Select Hijab / Beard Routine")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 5. Zakat */}
            <div 
              onClick={() => openOptionSheet('Zakat Practice', 'ZakatHabit', formData.ZakatHabit, zakatOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Zakat</span>
                <span className="text-xs mt-0.5 block">{renderLabel(formData.ZakatHabit, "Select Zakat Practice")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 6. Hajj / Umrah */}
            <div 
              onClick={() => openOptionSheet('Hajj / Umrah Pilgrimage', 'HajjUmrah', formData.HajjUmrah, hajjOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Hajj / Umrah</span>
                <span className="text-xs mt-0.5 block">{renderLabel(formData.HajjUmrah, "Select Pilgrimage Status")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 🌟 6. LIFESTYLE & INTEREST SECTION                             */}
        {/* ============================================================== */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Sparkles size={18} className="text-slate-800" />
            <h2 className="text-sm font-black text-slate-900">Lifestyle & Interest</h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {/* 1. Diet Preference */}
            <div 
              onClick={() => openOptionSheet('Diet Preference', 'DietType', formData.DietType, dietOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Diet Preference</span>
                <span className="text-xs mt-0.5 block">{renderLabel(formData.DietType, "Select Diet Preference")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 2. Smoke */}
            <div 
              onClick={() => openOptionSheet('Smoking Habits', 'SmokeHabit', formData.SmokeHabit, habitOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Smoke</span>
                <span className="text-xs mt-0.5 block">{renderLabel(formData.SmokeHabit, "Select Smoking Habit")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 3. Drink */}
            <div 
              onClick={() => openOptionSheet('Alcohol / Drinking Habits', 'DrinkHabit', formData.DrinkHabit, habitOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Drink</span>
                <span className="text-xs mt-0.5 block">{renderLabel(formData.DrinkHabit, "Select Drinking Habit")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 4. Languages You Know (Multi-select) */}
            <div 
              onClick={() => openMultiSelectSheet('LanguagesKnown')}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div className="min-w-0 pr-3">
                <span className="text-[13px] font-bold text-slate-900 block">Languages you know</span>
                <span className="text-xs mt-0.5 block truncate">
                  {renderLabel(formData.LanguagesKnown, "Select languages")}
                </span>
              </div>
              <ChevronRight size={16} className="text-slate-400 shrink-0" />
            </div>

            {/* 5. Cook Food */}
            <div 
              onClick={() => openOptionSheet('Can You Cook Food?', 'CanCook', formData.CanCook, cookOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Cook Food</span>
                <span className="text-xs mt-0.5 block">{renderLabel(formData.CanCook, "Select Cooking Skill")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 6. Sports (Multi-select) */}
            <div 
              onClick={() => openMultiSelectSheet('Sports')}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div className="min-w-0 pr-3">
                <span className="text-[13px] font-bold text-slate-900 block">Sports</span>
                <span className="text-xs mt-0.5 block truncate">
                  {renderLabel(formData.Sports, "Select sports")}
                </span>
              </div>
              <ChevronRight size={16} className="text-slate-400 shrink-0" />
            </div>

            {/* 7. Hobbies (Multi-select) */}
            <div 
              onClick={() => openMultiSelectSheet('Hobbies')}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div className="min-w-0 pr-3">
                <span className="text-[13px] font-bold text-slate-900 block">Hobbies</span>
                <span className="text-xs mt-0.5 block truncate">
                  {renderLabel(formData.Hobbies, "Select hobbies")}
                </span>
              </div>
              <ChevronRight size={16} className="text-slate-400 shrink-0" />
            </div>

            {/* 8. Musics (Multi-select) */}
            <div 
              onClick={() => openMultiSelectSheet('Interests')}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div className="min-w-0 pr-3">
                <span className="text-[13px] font-bold text-slate-900 block">Musics</span>
                <span className="text-xs mt-0.5 block truncate">
                  {renderLabel(formData.Interests, "Select music & interests")}
                </span>
              </div>
              <ChevronRight size={16} className="text-slate-400 shrink-0" />
            </div>
          </div>
        </section>

      </main>

      {/* ============================================================== */}
      {/* 🌟 10. LUXURY BOTTOM SHEETS & DRAWERS                          */}
      {/* ============================================================== */}
      <AnimatePresence>
        {activeSheet && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveSheet(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* 🌟 SHEET A: HEIGHT SLIDER BOTTOM SHEET (Matches Screenshot Exactly) */}
            {activeSheet === 'height' && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 pt-5 space-y-5 shadow-2xl text-left"
              >
                <div className="flex justify-center -mt-10 mb-1">
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-xl hover:bg-black transition-colors cursor-pointer border-2 border-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="text-left">
                  <h3 className="text-lg font-black text-slate-900">Add Height</h3>
                </div>

                {/* Selected Height Pill */}
                <div className="flex justify-start">
                  <div className="px-5 py-2 rounded-full border border-[#d91b5c] text-[#d91b5c] font-black text-xs bg-rose-50/30">
                    {cmToFtIn(heightCm)}
                  </div>
                </div>

                {/* Slider */}
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-white">
                  <input 
                    type="range"
                    min={135}
                    max={213}
                    step={1}
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#d91b5c]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveHeight}
                  disabled={savingField === 'Height'}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center"
                >
                  {savingField === 'Height' ? <Loader2 size={18} className="animate-spin" /> : "Update"}
                </button>
              </motion.div>
            )}

            {/* 🌟 SHEET B: ANNUAL INCOME SLIDER BOTTOM SHEET */}
            {activeSheet === 'income' && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 pt-5 space-y-5 shadow-2xl text-left"
              >
                <div className="flex justify-center -mt-10 mb-1">
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-xl hover:bg-black transition-colors cursor-pointer border-2 border-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="text-left">
                  <h3 className="text-lg font-black text-slate-900">Annual Income</h3>
                  <p className="text-xs text-slate-500 font-medium">Select or slide your estimated annual remuneration</p>
                </div>

                {/* Selected Income Pill */}
                <div className="flex justify-start">
                  <div className="px-5 py-2 rounded-full border border-[#d91b5c] text-[#d91b5c] font-black text-xs bg-rose-50/30">
                    {INCOME_BRACKETS[incomeIndex]}
                  </div>
                </div>

                {/* Slider */}
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-2">
                  <input 
                    type="range"
                    min={0}
                    max={INCOME_BRACKETS.length - 1}
                    step={1}
                    value={incomeIndex}
                    onChange={(e) => setIncomeIndex(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#d91b5c]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>No Income</span>
                    <span>₹10 - 15L</span>
                    <span>₹1 Cr+</span>
                  </div>
                </div>

                {/* Quick Chips */}
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {INCOME_BRACKETS.map((bracket, idx) => (
                    <button
                      key={bracket}
                      type="button"
                      onClick={() => setIncomeIndex(idx)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        incomeIndex === idx 
                          ? 'bg-[#d91b5c] text-white shadow-xs' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {bracket}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleSaveIncome}
                  disabled={savingField === 'AnnualIncome'}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center"
                >
                  {savingField === 'AnnualIncome' ? <Loader2 size={18} className="animate-spin" /> : "Update"}
                </button>
              </motion.div>
            )}

            {/* 🌟 SHEET C: DATE OF BIRTH 3-COLUMN WHEEL / SCROLL PICKER */}
            {activeSheet === 'dobPicker' && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 pt-5 space-y-5 shadow-2xl text-left"
              >
                <div className="flex justify-center -mt-10 mb-1">
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-xl hover:bg-black transition-colors cursor-pointer border-2 border-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">Select Date of Birth</h3>
                  <p className="text-xs text-slate-500 font-medium">Scroll and select Day, Month, and Year</p>
                </div>

                {/* Live Preview Pill */}
                <div className="flex justify-center">
                  <div className="px-6 py-2 rounded-full border border-[#d91b5c] text-[#d91b5c] font-black text-sm bg-rose-50/40">
                    {Math.min(dobDay, daysInCurrentMonth)} {MONTH_NAMES[dobMonth - 1]} {dobYear} &bull; ({calculatedLiveAge} Years)
                  </div>
                </div>

                {/* 3-Column Selectors */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  {/* Day Column */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1 text-center">Day</label>
                    <select
                      value={Math.min(dobDay, daysInCurrentMonth)}
                      onChange={(e) => setDobDay(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white text-center focus:outline-none focus:border-[#d91b5c]"
                    >
                      {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Month Column */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1 text-center">Month</label>
                    <select
                      value={dobMonth}
                      onChange={(e) => setDobMonth(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white text-center focus:outline-none focus:border-[#d91b5c]"
                    >
                      {MONTH_NAMES.map((name, idx) => (
                        <option key={name} value={idx + 1}>{name.slice(0, 3)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Year Column */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1 text-center">Year</label>
                    <select
                      value={dobYear}
                      onChange={(e) => setDobYear(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white text-center focus:outline-none focus:border-[#d91b5c]"
                    >
                      {(() => {
                        const minLegalAge = String(formData.Gender || '').toLowerCase() === 'female' ? 18 : 21;
                        const currentYr = new Date().getFullYear();
                        const latestBirthYear = currentYr - minLegalAge;
                        const earliestBirthYear = currentYr - 75;
                        return Array.from({ length: latestBirthYear - earliestBirthYear + 1 }, (_, i) => latestBirthYear - i).map(yr => (
                          <option key={yr} value={yr}>{yr}</option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveDob}
                  disabled={savingField === 'DateOfBirth'}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center"
                >
                  {savingField === 'DateOfBirth' ? <Loader2 size={18} className="animate-spin" /> : "Update Date of Birth"}
                </button>
              </motion.div>
            )}

            {/* 🌟 SHEET D: SEARCHABLE RADIO OPTIONS (Matches Screenshot: Search bar + Radios + Pink Update Button) */}
            {activeSheet === 'option' && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-lg mx-auto bg-white rounded-t-3xl p-5 pt-4 space-y-4 shadow-2xl text-left max-h-[85vh] flex flex-col"
              >
                <div className="flex justify-center -mt-9 mb-1">
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-xl hover:bg-black transition-colors cursor-pointer border-2 border-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900">{sheetTitle}</h3>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder={`Search ${sheetTitle.toLowerCase().replace('select', '').trim()}...`}
                    value={sheetSearch}
                    onChange={(e) => setSheetSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-100/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d91b5c]/20"
                  />
                </div>

                {/* Radio List */}
                <div className="flex-1 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100">
                  {filteredSheetOptions.map((opt) => {
                    const isSelected = String(selectedSheetValue) === String(opt.id) || String(selectedSheetValue) === String(opt.value);
                    return (
                      <div 
                        key={String(opt.id || opt.value)}
                        onClick={() => setSelectedSheetValue(opt.id !== undefined ? opt.id : opt.value)}
                        className="py-3 px-1 flex items-center justify-between cursor-pointer hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        <span className={`text-xs ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-800 font-medium'}`}>
                          {opt.value}
                        </span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'border-[#d91b5c]' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#d91b5c]" />}
                        </div>
                      </div>
                    );
                  })}
                  {filteredSheetOptions.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                      No matching options found.
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveOption}
                  disabled={Boolean(savingField)}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center shrink-0"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : "Update"}
                </button>
              </motion.div>
            )}

            {/* 🌟 SHEET E: IN-APP TEXT / EMAIL / PHONE INPUT SHEET */}
            {activeSheet === 'textInput' && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 pt-5 space-y-4 shadow-2xl text-left"
              >
                <div className="flex justify-center -mt-10 mb-1">
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-xl hover:bg-black transition-colors cursor-pointer border-2 border-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">{textInputData.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">{textInputData.subtitle}</p>
                </div>

                <div className="space-y-1">
                  {textInputData.multiline ? (
                    <textarea
                      rows={5}
                      maxLength={textInputData.maxLength || 500}
                      value={textInputData.value}
                      onChange={(e) => setTextInputData(prev => ({ ...prev, value: e.target.value }))}
                      placeholder={textInputData.placeholder}
                      className="w-full p-3.5 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#d91b5c] focus:ring-2 focus:ring-[#d91b5c]/20 leading-relaxed resize-none"
                      autoFocus
                    />
                  ) : (
                    <input
                      type={textInputData.inputType || 'text'}
                      maxLength={textInputData.maxLength || 120}
                      value={textInputData.value}
                      onChange={(e) => setTextInputData(prev => ({ ...prev, value: e.target.value }))}
                      placeholder={textInputData.placeholder}
                      className="w-full p-3.5 rounded-2xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#d91b5c] focus:ring-2 focus:ring-[#d91b5c]/20"
                      autoFocus
                    />
                  )}
                  <div className="text-right text-[11px] text-slate-400 font-bold">
                    {textInputData.value.length}/{textInputData.maxLength || 120}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveTextInput}
                  disabled={Boolean(savingField)}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : "Update"}
                </button>
              </motion.div>
            )}

            {/* 🌟 SHEET M: CHANGE MOBILE NUMBER WITH OTP SHEET */}
            {activeSheet === 'changeMobile' && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 pt-5 space-y-4 shadow-2xl text-left"
              >
                <div className="flex justify-center -mt-10 mb-1">
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-xl hover:bg-black transition-colors cursor-pointer border-2 border-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900">Change Mobile Number</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Enter your new mobile number. We will send a 6-digit OTP to verify ownership.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-extrabold uppercase text-slate-600 block mb-1">New Mobile Number</label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700">
                        +91
                      </div>
                      <input 
                        type="tel"
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        disabled={mobileOtpSent}
                        value={newMobileNumber}
                        onChange={(e) => setNewMobileNumber(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 px-4 py-3 bg-slate-50 rounded-2xl border-2 border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#d91b5c]"
                      />
                    </div>
                  </div>

                  {!mobileOtpSent ? (
                    <button
                      type="button"
                      disabled={sendingMobileOtp || newMobileNumber.length !== 10}
                      onClick={handleSendMobileOtp}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-900/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {sendingMobileOtp ? <Loader2 size={16} className="animate-spin" /> : <Phone size={16} />}
                      <span>Send Verification Code</span>
                    </button>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-[11px] font-bold text-emerald-800 flex items-center justify-between">
                        <span>OTP sent to +91 {newMobileNumber}</span>
                        <button 
                          type="button" 
                          onClick={() => setMobileOtpSent(false)} 
                          className="text-[#d91b5c] underline cursor-pointer"
                        >
                          Change
                        </button>
                      </div>

                      <div>
                        <label className="text-[11px] font-extrabold uppercase text-slate-600 block mb-1">Enter 6-Digit OTP</label>
                        <input 
                          type="text"
                          maxLength={6}
                          placeholder="e.g. 123456"
                          value={mobileOtpCode}
                          onChange={(e) => setMobileOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-2 border-slate-200 text-center tracking-widest text-lg font-black text-slate-900 focus:outline-none focus:border-[#d91b5c]"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={verifyingMobileOtp || mobileOtpCode.length < 4}
                        onClick={handleVerifyAndUpdateMobile}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {verifyingMobileOtp ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        <span>Verify & Update Number</span>
                      </button>

                      <div className="text-center">
                        <button
                          type="button"
                          disabled={sendingMobileOtp}
                          onClick={handleSendMobileOtp}
                          className="text-xs font-bold text-[#d91b5c] hover:underline cursor-pointer"
                        >
                          Didn't receive code? Resend OTP
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 🌟 SHEET F: SIBLING COUNTERS SHEET */}
            {activeSheet === 'counters' && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 pt-5 space-y-5 shadow-2xl text-left"
              >
                <div className="flex justify-center -mt-10 mb-1">
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-xl hover:bg-black transition-colors cursor-pointer border-2 border-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">Siblings Details</h3>
                  <p className="text-xs text-slate-500 font-medium">Specify your brothers and sisters overview</p>
                </div>

                <div className="space-y-4">
                  {/* Brothers */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                    <span className="text-xs font-black text-slate-800 block">Brothers</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Total Brothers</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCountersState(prev => ({ 
                              ...prev, 
                              totalBrothers: Math.max(0, prev.totalBrothers - 1),
                              marriedBrothers: Math.min(prev.marriedBrothers, Math.max(0, prev.totalBrothers - 1))
                            }))}
                            className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-700 font-bold active:scale-95"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-black text-slate-900 w-6 text-center">{countersState.totalBrothers}</span>
                          <button
                            type="button"
                            onClick={() => setCountersState(prev => ({ ...prev, totalBrothers: prev.totalBrothers + 1 }))}
                            className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-700 font-bold active:scale-95"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Married Brothers</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCountersState(prev => ({ ...prev, marriedBrothers: Math.max(0, prev.marriedBrothers - 1) }))}
                            className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-700 font-bold active:scale-95"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-black text-slate-900 w-6 text-center">{countersState.marriedBrothers}</span>
                          <button
                            type="button"
                            onClick={() => setCountersState(prev => ({ 
                              ...prev, 
                              marriedBrothers: Math.min(prev.totalBrothers, prev.marriedBrothers + 1) 
                            }))}
                            className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-700 font-bold active:scale-95"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sisters */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                    <span className="text-xs font-black text-slate-800 block">Sisters</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Total Sisters</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCountersState(prev => ({ 
                              ...prev, 
                              totalSisters: Math.max(0, prev.totalSisters - 1),
                              marriedSisters: Math.min(prev.marriedSisters, Math.max(0, prev.totalSisters - 1))
                            }))}
                            className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-700 font-bold active:scale-95"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-black text-slate-900 w-6 text-center">{countersState.totalSisters}</span>
                          <button
                            type="button"
                            onClick={() => setCountersState(prev => ({ ...prev, totalSisters: prev.totalSisters + 1 }))}
                            className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-700 font-bold active:scale-95"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Married Sisters</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCountersState(prev => ({ ...prev, marriedSisters: Math.max(0, prev.marriedSisters - 1) }))}
                            className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-700 font-bold active:scale-95"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-black text-slate-900 w-6 text-center">{countersState.marriedSisters}</span>
                          <button
                            type="button"
                            onClick={() => setCountersState(prev => ({ 
                              ...prev, 
                              marriedSisters: Math.min(prev.totalSisters, prev.marriedSisters + 1) 
                            }))}
                            className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-700 font-bold active:scale-95"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveCounters}
                  disabled={Boolean(savingField)}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : "Update"}
                </button>
              </motion.div>
            )}

            {/* 🌟 SHEET G: BIO FULL SLIDE SHEET (Matches Screenshot Exactly: ✕ Bio + Tell us about yourself + Save) */}
            {activeSheet === 'bio' && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 pt-5 space-y-4 shadow-2xl text-left"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-800 cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                  <span className="text-base font-black text-slate-900">Bio</span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">Tell us about yourself</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Tell them more about your principles, partner expectations, family and hobbies.
                  </p>
                </div>

                <div className="relative">
                  <textarea 
                    rows={6}
                    maxLength={1000}
                    value={bioDraft}
                    onChange={(e) => setBioDraft(e.target.value)}
                    placeholder="values. We prefer a simple, meaningful, and dignified Nikah ceremony..."
                    className="w-full p-4 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#d91b5c] focus:ring-2 focus:ring-[#d91b5c]/20 leading-relaxed resize-none shadow-2xs"
                  />
                  <div className="text-right text-[11px] text-slate-400 font-bold mt-1">
                    {bioDraft.length}/1000
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveBio}
                  disabled={savingField === 'AboutMe'}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center"
                >
                  {savingField === 'AboutMe' ? <Loader2 size={18} className="animate-spin" /> : "Save"}
                </button>
              </motion.div>
            )}

            {/* 🌟 SHEET H: LOCATION SELECTOR (STATE & CITY) */}
            {activeSheet === 'location' && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 pt-5 space-y-4 shadow-2xl text-left max-h-[85vh] flex flex-col"
              >
                <div className="flex justify-center -mt-10 mb-1">
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-xl hover:bg-black transition-colors cursor-pointer border-2 border-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {locationTargetField === 'FamilyLocation' ? "Family Location" : (locationTargetField === 'NativeLocation' ? "Native Location" : "Current Location")}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Select state and city in India</p>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      State / Province
                    </label>
                    <select
                      value={selectedStateId}
                      onChange={(e) => setSelectedStateId(Number(e.target.value))}
                      className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-[#d91b5c]"
                    >
                      {(masterData.STATES || []).map(s => (
                        <option key={s.id} value={s.id}>{s.value}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      City / District
                    </label>
                    <select
                      value={selectedCityId}
                      onChange={(e) => setSelectedCityId(Number(e.target.value))}
                      className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-[#d91b5c]"
                    >
                      {stateCities.map(c => (
                        <option key={c.id} value={c.id}>{c.value}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveLocation}
                  disabled={Boolean(savingField)}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center shrink-0"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : "Update"}
                </button>
              </motion.div>
            )}

            {/* 🌟 SHEET I: PHOTO PRIVACY BOTTOM SHEET (Matches Screenshot Exactly: Who can see my photo + Save) */}
            {activeSheet === 'photoPrivacy' && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 pt-5 space-y-4 shadow-2xl text-left"
              >
                <div className="flex justify-center -mt-10 mb-1">
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-xl hover:bg-black transition-colors cursor-pointer border-2 border-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="text-left">
                  <h3 className="text-base font-black text-slate-900">Who can see my photo</h3>
                </div>

                <div className="space-y-3 pt-1">
                  {(masterData.PHOTO_PRIVACY && masterData.PHOTO_PRIVACY.length > 0 ? masterData.PHOTO_PRIVACY : [
                    { id: 1, value: 'All Members', displayName: 'All Members', description: 'Visible to everyone' },
                    { id: 2, value: 'Premium Only', displayName: 'Premium Members', description: 'Blurred for free users' },
                    { id: 3, value: 'Only Approved', displayName: 'Members I Approve', description: 'Blurred until you approve' },
                  ]).map((item: any) => {
                    const itemVal = item.value || item.Value || item.displayName || item.DisplayName;
                    const itemTitle = item.displayName || item.DisplayName || item.title || itemVal;
                    const itemDesc = item.description || item.Description || item.desc || 'Photo privacy option';
                    const isSelected = (selectedSheetValue || formData.PhotoPrivacy) === itemVal || (selectedSheetValue || formData.PhotoPrivacy) === itemTitle;
                    return (
                      <div
                        key={item.id || itemVal}
                        onClick={() => setSelectedSheetValue(itemVal)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected ? 'border-[#d91b5c] bg-rose-50/40' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className={`text-xs font-black ${isSelected ? 'text-[#d91b5c]' : 'text-slate-900'}`}>
                            {itemTitle}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{itemDesc}</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-[#d91b5c] bg-[#d91b5c]' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[11px] text-slate-400 text-center font-medium">
                  You can change this later in your privacy settings
                </p>

                <button
                  type="button"
                  onClick={() => handleSavePhotoPrivacy(selectedSheetValue || formData.PhotoPrivacy)}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center"
                >
                  Save
                </button>
              </motion.div>
            )}

            {/* 🌟 SHEET J: TRUST BADGE (Matches Screenshot Exactly: Add Trust Badge + Continue) */}
            {activeSheet === 'trustBadge' && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 pt-5 space-y-4 shadow-2xl text-left max-h-[90vh] flex flex-col"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-800 cursor-pointer"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <span className="text-base font-black text-slate-900 flex items-center gap-1.5">
                    Add Trust Badge <CheckCircle2 size={16} className="text-sky-500 fill-sky-100" />
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {/* Upload Box */}
                  <label className="border-2 border-dashed border-[#d91b5c] rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-rose-50/20 transition-all bg-white">
                    <input 
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setGovtDocFile(f);
                          if (f.type.startsWith('image/')) {
                            setGovtDocPreview(URL.createObjectURL(f));
                          } else {
                            setGovtDocPreview('');
                          }
                        }
                      }}
                    />

                    {govtDocPreview ? (
                      <div className="space-y-2">
                        <img 
                          src={govtDocPreview} 
                          alt="ID Preview" 
                          className="max-h-36 rounded-xl object-contain border border-slate-200 mx-auto"
                        />
                        <span className="text-xs font-bold text-[#d91b5c] block">Tap to change document</span>
                      </div>
                    ) : (
                      <>
                        <div className="relative mb-3">
                          <div className="w-14 h-14 rounded-2xl border-2 border-slate-300 flex items-center justify-center text-slate-400">
                            <Upload size={24} />
                          </div>
                          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#d91b5c] text-white flex items-center justify-center text-xs font-black shadow-xs">
                            +
                          </div>
                        </div>
                        <span className="text-sm font-black text-slate-900 block">Upload Govt ID</span>
                        <span className="text-xs text-slate-400 font-medium block mt-0.5">
                          (Adhaar, PAN, Passport etc)
                        </span>
                      </>
                    )}
                  </label>

                  {/* Benefits Card */}
                  <div className="p-4 rounded-2xl border border-slate-200/80 space-y-2 bg-white">
                    <span className="text-xs font-black text-slate-900 block">Benefits</span>
                    <ul className="text-xs text-slate-600 space-y-2 font-medium">
                      <li className="flex items-start gap-2">
                        <span className="text-slate-400 mt-0.5">&bull;</span>
                        <span>Upload a Valid Government ID to get the Trust badge.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-slate-400 mt-0.5">&bull;</span>
                        <span>Verified member get a Trust Badge for more visibility and trust.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSubmitGovtDoc}
                  disabled={uploadingGovtDoc || !govtDocFile}
                  className="w-full py-3.5 rounded-full bg-slate-200 disabled:opacity-50 enabled:bg-[#d91b5c] enabled:hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center shrink-0"
                >
                  {uploadingGovtDoc ? <Loader2 size={18} className="animate-spin" /> : "Continue"}
                </button>
              </motion.div>
            )}

            {/* 🌟 SHEET K: LIFESTYLE & INTEREST PROMPT HUB */}
            {activeSheet === 'lifestyleHub' && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 pt-5 space-y-4 shadow-2xl text-left"
              >
                <div className="flex justify-center -mt-10 mb-1">
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-xl hover:bg-black transition-colors cursor-pointer border-2 border-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">Lifestyle & Interests</h3>
                  <p className="text-xs text-slate-500 font-medium">Add your hobbies and music tastes to complete your profile</p>
                </div>

                <div className="space-y-3 pt-1">
                  {/* Option 1: Hobbies */}
                  <div
                    onClick={() => openMultiSelectSheet('Hobbies')}
                    className="p-4 rounded-2xl border-2 border-rose-100 hover:border-[#d91b5c] bg-rose-50/20 hover:bg-rose-50/50 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 text-[#d91b5c] flex items-center justify-center shrink-0">
                        <Smile size={20} />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 group-hover:text-[#d91b5c] transition-colors">
                          Hobbies
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {formData.Hobbies ? `${formData.Hobbies.split(',').filter(Boolean).length} Selected: ${formData.Hobbies}` : "Reading, Travelling, Cooking..."}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-[#d91b5c] shrink-0" />
                  </div>

                  {/* Option 2: Musics */}
                  <div
                    onClick={() => openMultiSelectSheet('Interests')}
                    className="p-4 rounded-2xl border-2 border-violet-100 hover:border-violet-600 bg-violet-50/20 hover:bg-violet-50/50 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                        <Music size={20} />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 group-hover:text-violet-700 transition-colors">
                          Musics
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {formData.Interests ? `${formData.Interests.split(',').filter(Boolean).length} Selected: ${formData.Interests}` : "Sufi, Classical Ghazals, Poetry..."}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-violet-700 shrink-0" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* 🌟 SHEET L: APP-LIKE MULTI-SELECT BOTTOM SHEET (For Languages, Sports, Hobbies, Musics) */}
            {activeSheet === 'multiSelect' && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-lg mx-auto bg-white rounded-t-3xl p-5 pt-4 space-y-4 shadow-2xl text-left max-h-[85vh] flex flex-col"
              >
                <div className="flex justify-center -mt-9 mb-1">
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-xl hover:bg-black transition-colors cursor-pointer border-2 border-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900">{multiSelectTitle}</h3>
                    <p className="text-xs text-slate-500 font-medium">{multiSelectSubtitle}</p>
                  </div>
                  <span className="text-xs font-bold text-[#d91b5c] bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                    {multiSelectItems.length} Selected
                  </span>
                </div>

                {/* Selected Removable Chips at Top */}
                {multiSelectItems.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-100 max-h-20 overflow-y-auto">
                    {multiSelectItems.map((item) => (
                      <span 
                        key={item}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#d91b5c] text-white text-[11px] font-bold shadow-2xs"
                      >
                        <span>{item}</span>
                        <X 
                          size={12} 
                          className="cursor-pointer hover:opacity-80" 
                          onClick={() => toggleMultiSelectItem(item)}
                        />
                      </span>
                    ))}
                  </div>
                )}

                {/* Search */}
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search options..."
                    value={multiSelectSearch}
                    onChange={(e) => setMultiSelectSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-100 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d91b5c]/20"
                  />
                </div>

                {/* App-Style Options List with Checkboxes */}
                <div className="flex-1 overflow-y-auto pr-1 divide-y divide-slate-100">
                  {filteredMultiSelectOptions.map((opt) => {
                    const isSelected = multiSelectItems.includes(opt.value);
                    return (
                      <div
                        key={String(opt.id || opt.value)}
                        onClick={() => toggleMultiSelectItem(opt.value)}
                        className="py-3 px-1.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        <span className={`text-xs ${isSelected ? 'text-[#d91b5c] font-black' : 'text-slate-800 font-medium'}`}>
                          {opt.value}
                        </span>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          isSelected ? 'border-[#d91b5c] bg-[#d91b5c]' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check size={13} className="text-white stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                  {filteredMultiSelectOptions.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                      No matching options found.
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveMultiSelect}
                  disabled={Boolean(savingField)}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center shrink-0"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : "Update"}
                </button>
              </motion.div>
            )}

          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
