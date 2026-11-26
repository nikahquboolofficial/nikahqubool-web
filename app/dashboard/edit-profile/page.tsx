"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Eye, Shield, CheckCircle2, ChevronLeft, ChevronRight, Search, 
  Camera, Plus, Trash2, Lock, Sparkles, AlertCircle, 
  ArrowLeft, Upload, FileText, Check, Loader2, Star,
  GraduationCap, Briefcase, Heart, Home, Moon, User,
  Minus, Award, ShieldCheck, MapPin, Activity, Utensils,
  BookOpen, Smile, Phone, Mail, MessageCircle, Calendar,
  Dumbbell, Music, Languages, DollarSign, Users, Info, Edit3
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
import ProfileAvatarLoader from '@/components/ProfileAvatarLoader';
import { resolveMasterText } from '@/lib/masterResolver';

// Helper for Height conversions
function cmToFtIn(cm: number): string {
  const totalInches = Math.round(cm / 2.54);
  const ft = Math.floor(totalInches / 12);
  const inch = totalInches % 12;
  return `${ft}ft ${inch}in (${cm} cm)`;
}

function formatHeightShort(cm: number): string {
  const totalInches = Math.round(cm / 2.54);
  const ft = Math.floor(totalInches / 12);
  const inch = totalInches % 12;
  return `${ft}ft ${inch}in`;
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

const FALLBACK_MUSIC_OPTIONS: MasterOption[] = [
  { id: 1, value: "Nasheeds & Naats" },
  { id: 2, value: "Sufi & Qawwali" },
  { id: 3, value: "Ghazals & Classical" },
  { id: 4, value: "Instrumental & Ambient" },
  { id: 5, value: "Folk & Traditional" },
  { id: 6, value: "Bollywood & Pop" },
  { id: 7, value: "Acoustic & Melody" },
  { id: 8, value: "No Music / Nasheeds Only" },
  { id: 9, value: "Other" }
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
    PARENT_OCCUPATIONS: getCachedMasterOptions('PARENT_OCCUPATIONS'),
    STATES: getCachedMasterOptions('STATES'),
    FAMILY_TYPES: getCachedMasterOptions('FAMILY_TYPES'),
    FAMILY_STATUS: getCachedMasterOptions('FAMILY_STATUS'),
    COMPLEXION: getCachedMasterOptions('COMPLEXION'),
    HOBBIES: getCachedMasterOptions('HOBBIES'),
    INTERESTS: getCachedMasterOptions('INTERESTS'),
    MUSIC: getCachedMasterOptions('MUSIC').length > 0 ? getCachedMasterOptions('MUSIC') : FALLBACK_MUSIC_OPTIONS,
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
    const list = masterData[type] || [];
    return resolveMasterText(type, val, list);
  }, [masterData]);

  // Helper to get cached Full Name from localStorage
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
      const cleanVal = String(val).replace(/^[?â‚¹]\s*/, '₹ ');
      return <span className="text-slate-700 font-semibold">{cleanVal}</span>;
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
    FatherOccupation: '',
    FatherOccupationId: 0,
    MotherName: '',
    MotherOccupation: '',
    MotherOccupationId: 0,
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
    Music: '',

    // Bio & Trust
    AboutMe: '',
    PartnerExpectations: '',
    IsGovtIdVerified: false,
    GovtIdDocUrl: '',
    PhotoPrivacy: 'All Members',
  });

  // Track completed sections from database
  const [completedSections, setCompletedSections] = useState<string[]>([]);

  // Celebration Modal state (Screenshot 1)
  const [celebrationModal, setCelebrationModal] = useState<{
    isOpen: boolean;
    title: string;
    scoreAdded: number;
    remainingScore: number;
    nextSection?: string;
  } | null>(null);

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

  // Weight Slider Substate
  const [weightKg, setWeightKg] = useState(60);

  // Income Slider Substate
  const [incomeIndex, setIncomeIndex] = useState(4);

  // Date of Birth 3-Column Picker Substate
  const [dobDay, setDobDay] = useState<number>(15);
  const [dobMonth, setDobMonth] = useState<number>(8);
  const [dobYear, setDobYear] = useState<number>(1998);

  // Bio Substate
  const [bioDraft, setBioDraft] = useState('');

  // Location Substate
  const [selectedStateId, setSelectedStateId] = useState<number>(14);
  const [selectedCityId, setSelectedCityId] = useState<number>(1);
  const [locationTargetField, setLocationTargetField] = useState<'Location' | 'FamilyLocation' | 'NativeLocation'>('Location');
  const [locationStep, setLocationStep] = useState<'state' | 'city'>('state');
  const [locationSearch, setLocationSearch] = useState<string>('');
  const [openedFromWizard, setOpenedFromWizard] = useState<string | null>(null);

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
  const [multiSelectKey, setMultiSelectKey] = useState<'Hobbies' | 'Interests' | 'Sports' | 'LanguagesKnown' | 'Music'>('Hobbies');
  const [multiSelectTitle, setMultiSelectTitle] = useState('');
  const [multiSelectSubtitle, setMultiSelectSubtitle] = useState('');
  const [multiSelectItems, setMultiSelectItems] = useState<string[]>([]);
  const [multiSelectAvailable, setMultiSelectAvailable] = useState<MasterOption[]>([]);
  const [multiSelectSearch, setMultiSelectSearch] = useState('');

  // 🌟 MODAL / SHEET MANAGEMENT: Guaranteed Clean Close without leaks
  const closeSheet = useCallback(() => {
    setActiveSheet(null);
    setOpenedFromWizard(null);
  }, []);

  const backToWizardOrClose = useCallback(() => {
    if (openedFromWizard) {
      const parent = openedFromWizard;
      setOpenedFromWizard(null);
      setActiveSheet(parent);
    } else {
      closeSheet();
    }
  }, [openedFromWizard, closeSheet]);

  // 🌟 DEDICATED WIZARD SUBSTATES (Screenshot 3, 5, 7, 8)
  const [familyWizardData, setFamilyWizardData] = useState({
    familyType: 0,
    familyStatus: 0,
    nativeStateId: 0,
    nativeCityId: 0,
    nativeLocation: '',
    fatherOccupation: '',
    motherOccupation: '',
    totalBrothers: 0,
    marriedBrothers: 0,
    totalSisters: 0,
    marriedSisters: 0,
  });

  const [religiousWizardData, setReligiousWizardData] = useState({
    namazHabit: '',
    quranReading: '',
    rozaHabit: '',
    zakatHabit: '',
    hajjUmrah: '',
  });

  const [lifestyleWizardData, setLifestyleWizardData] = useState({
    dietType: '',
    smokeHabit: '',
    drinkHabit: '',
    sports: [] as string[],
    languages: [] as string[],
    hobbies: [] as string[],
    interests: [] as string[],
    music: [] as string[],
  });

  const [otherWizardData, setOtherWizardData] = useState({
    collegeName: '',
    aboutMe: '',
    partnerExpectations: '',
    disability: 'None',
    whatsAppNumber: '',
  });

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
          'PARENT_OCCUPATIONS',
          'STATES',
          'FAMILY_TYPES',
          'FAMILY_STATUS',
          'COMPLEXION',
          'HOBBIES',
          'INTERESTS',
          'MUSIC',
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
          const completedFromApi = profileRes.data.completedSections || profileRes.data.CompletedSections || [];
          if (Array.isArray(completedFromApi)) {
            setCompletedSections(completedFromApi.map(s => String(s).toLowerCase().trim()));
          }

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
          const rawIncStr = p.annualIncome || p.AnnualIncome || '';
          const incStr = rawIncStr ? rawIncStr.replace(/^[?â‚¹\s]+/, '₹ ').trim() : '';
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
            FatherOccupation: p.fatherOccupation || p.fatherOccupationName || '',
            FatherOccupationId: p.fatherOccupationId || 0,
            MotherName: p.motherName || p.MotherName || '',
            MotherOccupation: p.motherOccupation || p.motherOccupationName || '',
            MotherOccupationId: p.motherOccupationId || 0,
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
            DrinkHabit: p.drinkHabit || p.drinkHabitName || '',
            LanguagesKnown: p.languagesKnown || p.LanguagesKnown || '',
            CanCook: p.canCook === true ? 'Yes' : (p.canCook === false ? 'No' : (p.canCook || '')),
            Sports: p.sports || p.Sports || '',
            Hobbies: p.hobbies || '',
            Interests: p.interests || '',
            Music: p.music || p.Music || '',

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

  // 🌟 SECTION COMPLETION STATUS COMPUTATION (Robust checks with database completedSections + field fallbacks)
  const isPhotosCompleted = useMemo(() => {
    return (photos.length > 0 && photos.some(p => p && p.photoUrl && p.photoUrl.trim().length > 0)) ||
           Boolean(formData.MainPhotoUrl && formData.MainPhotoUrl.trim().length > 0 && !formData.MainPhotoUrl.includes('placeholder'));
  }, [photos, formData.MainPhotoUrl]);

  const isFamilyCompleted = useMemo(() => {
    return completedSections.includes('family') || 
           Boolean(Number(formData.FamilyType) > 0 && 
                   Number(formData.FamilyStatus) > 0 && 
                   (formData.NativeLocation || Number(formData.NativePlaceCityId) > 0) && 
                   (formData.FatherOccupation && formData.FatherOccupation !== 'None') && 
                   (formData.MotherOccupation && formData.MotherOccupation !== 'None') && 
                   formData.TotalBrothers !== undefined && formData.TotalBrothers !== null &&
                   formData.TotalSisters !== undefined && formData.TotalSisters !== null);
  }, [completedSections, formData.FamilyType, formData.FamilyStatus, formData.FatherOccupation, formData.MotherOccupation, formData.NativeLocation, formData.NativePlaceCityId, formData.TotalBrothers, formData.TotalSisters]);

  const hasAnyFamilyField = useMemo(() => {
    return Boolean(Number(formData.FamilyType) > 0 || 
                   Number(formData.FamilyStatus) > 0 || 
                   (formData.NativeLocation || Number(formData.NativePlaceCityId) > 0) || 
                   (formData.FatherOccupation && formData.FatherOccupation !== 'None') || 
                   (formData.MotherOccupation && formData.MotherOccupation !== 'None') || 
                   (formData.TotalBrothers !== undefined && formData.TotalBrothers !== null && formData.TotalBrothers > 0) || 
                   (formData.TotalSisters !== undefined && formData.TotalSisters !== null && formData.TotalSisters > 0));
  }, [formData.FamilyType, formData.FamilyStatus, formData.FatherOccupation, formData.MotherOccupation, formData.NativeLocation, formData.NativePlaceCityId, formData.TotalBrothers, formData.TotalSisters]);

  const isReligiousCompleted = useMemo(() => {
    return completedSections.includes('religious') || 
           Boolean(formData.NamazHabit && formData.QuranReading && formData.RozaHabit && formData.ZakatHabit && formData.HajjUmrah);
  }, [completedSections, formData.NamazHabit, formData.QuranReading, formData.RozaHabit, formData.ZakatHabit, formData.HajjUmrah]);

  const hasAnyReligiousField = useMemo(() => {
    return Boolean(formData.NamazHabit || formData.QuranReading || formData.RozaHabit || formData.ZakatHabit || formData.HajjUmrah);
  }, [formData.NamazHabit, formData.QuranReading, formData.RozaHabit, formData.ZakatHabit, formData.HajjUmrah]);

  const isLifestyleCompleted = useMemo(() => {
    return completedSections.includes('lifestyle') || 
           Boolean(formData.DietType && formData.SmokeHabit && formData.DrinkHabit && formData.Sports && formData.LanguagesKnown && formData.Hobbies && formData.Music);
  }, [completedSections, formData.DietType, formData.SmokeHabit, formData.DrinkHabit, formData.Sports, formData.LanguagesKnown, formData.Hobbies, formData.Music]);

  const hasAnyLifestyleField = useMemo(() => {
    return Boolean(formData.DietType || formData.SmokeHabit || formData.DrinkHabit || formData.Sports || formData.LanguagesKnown || formData.Hobbies || formData.Music);
  }, [formData.DietType, formData.SmokeHabit, formData.DrinkHabit, formData.Sports, formData.LanguagesKnown, formData.Hobbies, formData.Music]);

  const isOtherCompleted = useMemo(() => {
    return completedSections.includes('other') || 
           Boolean(formData.CollegeName && formData.Disability && formData.PartnerExpectations);
  }, [completedSections, formData.CollegeName, formData.Disability, formData.PartnerExpectations]);

  const hasAnyOtherField = useMemo(() => {
    return Boolean(formData.CollegeName || (formData.Disability && formData.Disability !== 'None') || formData.PartnerExpectations);
  }, [formData.CollegeName, formData.Disability, formData.PartnerExpectations]);

  const isVerifiedCompleted = useMemo(() => {
    return Boolean(formData.IsGovtIdVerified);
  }, [formData.IsGovtIdVerified]);

  // 🌟 DYNAMIC PROFILE COMPLETION SCORE (50 Base + 20 Photos + 10 Family + 5 Religious + 10 Lifestyle + 5 Other = 100)
  const profileCompletionScore = useMemo(() => {
    let score = 50;
    if (isPhotosCompleted) score += 20;
    if (isFamilyCompleted) score += 10;
    if (isReligiousCompleted) score += 5;
    if (isLifestyleCompleted) score += 10;
    if (isOtherCompleted) score += 5;
    return Math.min(100, score);
  }, [isPhotosCompleted, isFamilyCompleted, isReligiousCompleted, isLifestyleCompleted, isOtherCompleted]);

  // 🌟 UNCOMPLETED TRAY CARDS (Screenshot 6)
  const incompleteCards = useMemo(() => {
    const list: Array<{
      key: string;
      title: string;
      scoreBadge: string;
      scoreVal: number;
      actionLabel: string;
      onAction: () => void;
    }> = [];

    if (!isPhotosCompleted) {
      list.push({
        key: 'photos',
        title: 'Photos',
        scoreBadge: '+20% Score',
        scoreVal: 20,
        actionLabel: 'Add Details',
        onAction: () => {
          if (typeof window !== "undefined") {
            sessionStorage.setItem('gallery_return_url', '/dashboard/edit-profile');
          }
          router.push('/dashboard/gallery?returnUrl=/dashboard/edit-profile');
        }
      });
    }

    if (!isFamilyCompleted) {
      list.push({
        key: 'family',
        title: 'Family Details',
        scoreBadge: '+10% Score',
        scoreVal: 10,
        actionLabel: 'Add Details',
        onAction: () => openFamilyWizard()
      });
    }

    if (!isReligiousCompleted) {
      list.push({
        key: 'religious',
        title: 'Religious Details',
        scoreBadge: '+5% Score',
        scoreVal: 5,
        actionLabel: 'Add Details',
        onAction: () => openReligiousWizard()
      });
    }

    if (!isLifestyleCompleted) {
      list.push({
        key: 'lifestyle',
        title: 'Lifestyle & Interest',
        scoreBadge: '+10% Score',
        scoreVal: 10,
        actionLabel: 'Add Details',
        onAction: () => openLifestyleWizard()
      });
    }

    if (!isOtherCompleted) {
      list.push({
        key: 'other',
        title: 'Other Details',
        scoreBadge: '+5% Score',
        scoreVal: 5,
        actionLabel: 'Add Details',
        onAction: () => openOtherWizard()
      });
    }

    if (!isVerifiedCompleted) {
      list.push({
        key: 'verify',
        title: 'Verify Your Profile',
        scoreBadge: '',
        scoreVal: 0,
        actionLabel: formData.GovtIdDocUrl ? 'Under Review ⏳' : 'Verify Profile',
        onAction: () => setActiveSheet('trustBadge')
      });
    }

    return list;
  }, [isPhotosCompleted, isFamilyCompleted, isReligiousCompleted, isLifestyleCompleted, isOtherCompleted, isVerifiedCompleted, formData.GovtIdDocUrl]);

  // Open Family Wizard
  const openFamilyWizard = () => {
    setFamilyWizardData({
      familyType: formData.FamilyType || 0,
      familyStatus: formData.FamilyStatus || 0,
      nativeStateId: formData.NativePlaceStateId || 0,
      nativeCityId: formData.NativePlaceCityId || 0,
      nativeLocation: formData.NativeLocation || '',
      fatherOccupation: formData.FatherOccupation || '',
      motherOccupation: formData.MotherOccupation || '',
      totalBrothers: formData.TotalBrothers !== undefined && formData.TotalBrothers !== null ? Number(formData.TotalBrothers) : 0,
      marriedBrothers: formData.MarriedBrothers !== undefined && formData.MarriedBrothers !== null ? Number(formData.MarriedBrothers) : 0,
      totalSisters: formData.TotalSisters !== undefined && formData.TotalSisters !== null ? Number(formData.TotalSisters) : 0,
      marriedSisters: formData.MarriedSisters !== undefined && formData.MarriedSisters !== null ? Number(formData.MarriedSisters) : 0,
    });
    setActiveSheet('familyWizard');
  };

  // Open Religious Wizard
  const openReligiousWizard = () => {
    setReligiousWizardData({
      namazHabit: formData.NamazHabit || '',
      quranReading: formData.QuranReading || '',
      rozaHabit: formData.RozaHabit || '',
      zakatHabit: formData.ZakatHabit || '',
      hajjUmrah: formData.HajjUmrah || '',
    });
    setActiveSheet('religiousWizard');
  };

  // Open Lifestyle Wizard
  const openLifestyleWizard = () => {
    setLifestyleWizardData({
      dietType: formData.DietType || '',
      smokeHabit: formData.SmokeHabit || '',
      drinkHabit: formData.DrinkHabit || '',
      sports: formData.Sports ? formData.Sports.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      languages: formData.LanguagesKnown ? formData.LanguagesKnown.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      hobbies: formData.Hobbies ? formData.Hobbies.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      interests: formData.Interests ? formData.Interests.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      music: formData.Music ? formData.Music.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
    });
    setActiveSheet('lifestyleWizard');
  };

  // Open Other Wizard
  const openOtherWizard = () => {
    setOtherWizardData({
      collegeName: formData.CollegeName || '',
      aboutMe: formData.AboutMe || '',
      partnerExpectations: formData.PartnerExpectations || '',
      disability: formData.Disability || '',
      whatsAppNumber: formData.WhatsAppNumber || '',
    });
    setActiveSheet('otherWizard');
  };

  // 🌟 Save specific field via API
  const saveFieldValue = async (field: string, value: any, extraData: any = {}) => {
    const token = getAuthToken();
    if (!token) return;

    setSavingField(field);

    try {
      const fd = new FormData();
      fd.append("UserId", String(formData.UserId || 0));
      fd.append(field, String(value));

      if (extraData && typeof extraData === 'object') {
        Object.keys(extraData).forEach(k => {
          if (extraData[k] !== undefined && extraData[k] !== null) {
            fd.append(k, String(extraData[k]));
          }
        });
      }

      const res = await updateProfileApi(fd, token);
      if (res.success || (res as any).Success === 1) {
        setFormData((prev: any) => ({
          ...prev,
          [field]: value,
          ...extraData,
        }));

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

        closeSheet();
      } else {
        toast.error(res.message || "Failed to update detail.");
      }
    } catch {
      toast.error("Failed to connect to server.");
    } finally {
      setSavingField(null);
    }
  };

  // 🌟 SAVE FAMILY WIZARD HANDLER
  const handleSaveFamilyWizard = async () => {
    const token = getAuthToken();
    if (!token) return;

    if (!familyWizardData.familyType) {
      toast.error("Please select Family Type.");
      return;
    }
    if (!familyWizardData.familyStatus) {
      toast.error("Please select Family Status.");
      return;
    }
    if (!familyWizardData.nativeLocation && !familyWizardData.nativeStateId) {
      toast.error("Please select Native Location.");
      return;
    }
    if (!familyWizardData.fatherOccupation) {
      toast.error("Please select Father's Occupation.");
      return;
    }
    if (!familyWizardData.motherOccupation) {
      toast.error("Please select Mother's Occupation.");
      return;
    }
    if (familyWizardData.totalBrothers === undefined || familyWizardData.totalBrothers === null) {
      toast.error("Please select number of Brothers.");
      return;
    }
    if (familyWizardData.totalSisters === undefined || familyWizardData.totalSisters === null) {
      toast.error("Please select number of Sisters.");
      return;
    }

    setSavingField('familyWizard');
    try {
      const fd = new FormData();
      fd.append("UserId", String(formData.UserId || 0));
      fd.append("FamilyType", String(familyWizardData.familyType));
      fd.append("FamilyStatus", String(familyWizardData.familyStatus));
      fd.append("FatherOccupation", familyWizardData.fatherOccupation);
      fd.append("MotherOccupation", familyWizardData.motherOccupation);
      const fOpt = parentOccupationOpts.find(o => o.value.toLowerCase() === (familyWizardData.fatherOccupation || '').toLowerCase());
      const mOpt = parentOccupationOpts.find(o => o.value.toLowerCase() === (familyWizardData.motherOccupation || '').toLowerCase());
      if (fOpt?.id) fd.append("FatherOccupationId", String(fOpt.id));
      if (mOpt?.id) fd.append("MotherOccupationId", String(mOpt.id));
      fd.append("TotalBrothers", String(familyWizardData.totalBrothers));
      fd.append("MarriedBrothers", String(familyWizardData.marriedBrothers || 0));
      fd.append("TotalSisters", String(familyWizardData.totalSisters));
      fd.append("MarriedSisters", String(familyWizardData.marriedSisters || 0));
      if (familyWizardData.nativeStateId) {
        fd.append("NativePlaceStateId", String(familyWizardData.nativeStateId));
      }
      if (familyWizardData.nativeCityId) {
        fd.append("NativePlaceCityId", String(familyWizardData.nativeCityId));
      }
      if (familyWizardData.nativeLocation) {
        fd.append("NativeLocation", familyWizardData.nativeLocation);
      }
      fd.append("CompletedSection", "family");

      const res = await updateProfileApi(fd, token);
      if (res.success || (res as any).Success === 1) {
        setFormData((prev: any) => ({
          ...prev,
          FamilyType: familyWizardData.familyType,
          FamilyStatus: familyWizardData.familyStatus,
          FatherOccupation: familyWizardData.fatherOccupation,
          FatherOccupationId: fOpt?.id || prev.FatherOccupationId,
          MotherOccupation: familyWizardData.motherOccupation,
          MotherOccupationId: mOpt?.id || prev.MotherOccupationId,
          TotalBrothers: familyWizardData.totalBrothers,
          MarriedBrothers: familyWizardData.marriedBrothers || 0,
          TotalSisters: familyWizardData.totalSisters,
          MarriedSisters: familyWizardData.marriedSisters || 0,
          NativePlaceStateId: familyWizardData.nativeStateId,
          NativePlaceCityId: familyWizardData.nativeCityId,
          NativeLocation: familyWizardData.nativeLocation || prev.NativeLocation,
        }));

        const nextCompleted = Array.from(new Set([...completedSections, 'family']));
        setCompletedSections(nextCompleted);
        closeSheet();

        const newScore = Math.min(100, profileCompletionScore + 10);
        setCelebrationModal({
          isOpen: true,
          title: "Family Details",
          scoreAdded: 10,
          remainingScore: 100 - newScore,
          nextSection: !isReligiousCompleted ? 'religious' : (!isLifestyleCompleted ? 'lifestyle' : (!isOtherCompleted ? 'other' : undefined))
        });
      } else {
        toast.error(res.message || "Failed to save family details");
      }
    } catch {
      toast.error("Network error saving family details");
    } finally {
      setSavingField(null);
    }
  };

  // 🌟 SAVE RELIGIOUS WIZARD HANDLER
  const handleSaveReligiousWizard = async () => {
    const token = getAuthToken();
    if (!token) return;

    if (!religiousWizardData.namazHabit) {
      toast.error("Please select Namaz Habit.");
      return;
    }
    if (!religiousWizardData.quranReading) {
      toast.error("Please select Quran Recitation habit.");
      return;
    }
    if (!religiousWizardData.rozaHabit) {
      toast.error("Please select Roza (Fasting) habit.");
      return;
    }
    if (!religiousWizardData.zakatHabit) {
      toast.error("Please select Zakat Habit.");
      return;
    }
    if (!religiousWizardData.hajjUmrah) {
      toast.error("Please select Hajj or Umrah status.");
      return;
    }

    setSavingField('religiousWizard');
    try {
      const fd = new FormData();
      fd.append("UserId", String(formData.UserId || 0));
      fd.append("NamazHabit", religiousWizardData.namazHabit);
      const nOpt = namazOpts.find(o => o.value.toLowerCase() === religiousWizardData.namazHabit.toLowerCase());
      if (nOpt?.id) fd.append("NamazHabitId", String(nOpt.id));

      fd.append("QuranReading", religiousWizardData.quranReading);
      const qOpt = quranOpts.find(o => o.value.toLowerCase() === religiousWizardData.quranReading.toLowerCase());
      if (qOpt?.id) fd.append("QuranReadingId", String(qOpt.id));

      fd.append("RozaHabit", religiousWizardData.rozaHabit);
      const rOpt = rozaOpts.find(o => o.value.toLowerCase() === religiousWizardData.rozaHabit.toLowerCase());
      if (rOpt?.id) fd.append("RozaHabitId", String(rOpt.id));

      fd.append("ZakatHabit", religiousWizardData.zakatHabit);
      const zOpt = zakatOpts.find(o => o.value.toLowerCase() === religiousWizardData.zakatHabit.toLowerCase());
      if (zOpt?.id) fd.append("ZakatHabitId", String(zOpt.id));

      fd.append("HajjUmrah", religiousWizardData.hajjUmrah);
      const hOpt = hajjOpts.find(o => o.value.toLowerCase() === religiousWizardData.hajjUmrah.toLowerCase());
      if (hOpt?.id) fd.append("HajjUmrahId", String(hOpt.id));

      fd.append("CompletedSection", "religious");

      const res = await updateProfileApi(fd, token);
      if (res.success || (res as any).Success === 1) {
        setFormData((prev: any) => ({
          ...prev,
          NamazHabit: religiousWizardData.namazHabit,
          QuranReading: religiousWizardData.quranReading,
          RozaHabit: religiousWizardData.rozaHabit,
          ZakatHabit: religiousWizardData.zakatHabit,
          HajjUmrah: religiousWizardData.hajjUmrah,
        }));

        const nextCompleted = Array.from(new Set([...completedSections, 'religious']));
        setCompletedSections(nextCompleted);
        closeSheet();

        const newScore = Math.min(100, profileCompletionScore + 5);
        setCelebrationModal({
          isOpen: true,
          title: "Religious Details",
          scoreAdded: 5,
          remainingScore: 100 - newScore,
          nextSection: !isLifestyleCompleted ? 'lifestyle' : (!isOtherCompleted ? 'other' : undefined)
        });
      } else {
        toast.error(res.message || "Failed to save religious details");
      }
    } catch {
      toast.error("Network error saving religious details");
    } finally {
      setSavingField(null);
    }
  };

  // 🌟 SAVE LIFESTYLE WIZARD HANDLER
  const handleSaveLifestyleWizard = async () => {
    const token = getAuthToken();
    if (!token) return;

    if (!lifestyleWizardData.dietType) {
      toast.error("Please select Diet Type.");
      return;
    }
    if (!lifestyleWizardData.smokeHabit) {
      toast.error("Please select Smoking Habit.");
      return;
    }
    if (!lifestyleWizardData.drinkHabit) {
      toast.error("Please select Drinking Habit.");
      return;
    }
    if (lifestyleWizardData.sports.length === 0) {
      toast.error("Please select at least one Sport or Fitness activity.");
      return;
    }
    if (lifestyleWizardData.languages.length === 0) {
      toast.error("Please select at least one Language.");
      return;
    }
    if (lifestyleWizardData.hobbies.length === 0) {
      toast.error("Please select at least one Hobby.");
      return;
    }
    if (lifestyleWizardData.music.length === 0) {
      toast.error("Please select at least one Music preference.");
      return;
    }

    setSavingField('lifestyleWizard');
    try {
      const fd = new FormData();
      fd.append("UserId", String(formData.UserId || 0));
      fd.append("DietType", lifestyleWizardData.dietType);
      const dtOpt = dietOpts.find(o => o.value.toLowerCase() === lifestyleWizardData.dietType.toLowerCase());
      if (dtOpt?.id) fd.append("DietTypeId", String(dtOpt.id));

      fd.append("SmokeHabit", lifestyleWizardData.smokeHabit);
      const smOpt = smokeOpts.find(o => o.value.toLowerCase() === lifestyleWizardData.smokeHabit.toLowerCase());
      if (smOpt?.id) fd.append("SmokeHabitId", String(smOpt.id));

      fd.append("DrinkHabit", lifestyleWizardData.drinkHabit);
      const drOpt = drinkOpts.find(o => o.value.toLowerCase() === lifestyleWizardData.drinkHabit.toLowerCase());
      if (drOpt?.id) fd.append("DrinkHabitId", String(drOpt.id));

      fd.append("Sports", lifestyleWizardData.sports.join(', '));
      fd.append("LanguagesKnown", lifestyleWizardData.languages.join(', '));
      fd.append("Hobbies", lifestyleWizardData.hobbies.join(', '));
      fd.append("Music", lifestyleWizardData.music.join(', '));
      fd.append("CompletedSection", "lifestyle");

      const res = await updateProfileApi(fd, token);
      if (res.success || (res as any).Success === 1) {
        setFormData((prev: any) => ({
          ...prev,
          DietType: lifestyleWizardData.dietType,
          SmokeHabit: lifestyleWizardData.smokeHabit,
          DrinkHabit: lifestyleWizardData.drinkHabit,
          Sports: lifestyleWizardData.sports.join(', '),
          LanguagesKnown: lifestyleWizardData.languages.join(', '),
          Hobbies: lifestyleWizardData.hobbies.join(', '),
          Interests: lifestyleWizardData.interests.join(', '),
          Music: lifestyleWizardData.music.join(', '),
        }));

        const nextCompleted = Array.from(new Set([...completedSections, 'lifestyle']));
        setCompletedSections(nextCompleted);
        closeSheet();

        const newScore = Math.min(100, profileCompletionScore + 10);
        setCelebrationModal({
          isOpen: true,
          title: "Lifestyle & Interest",
          scoreAdded: 10,
          remainingScore: 100 - newScore,
          nextSection: !isOtherCompleted ? 'other' : undefined
        });
      } else {
        toast.error(res.message || "Failed to save lifestyle details");
      }
    } catch {
      toast.error("Network error saving lifestyle details");
    } finally {
      setSavingField(null);
    }
  };

  // 🌟 SAVE OTHER WIZARD HANDLER
  const handleSaveOtherWizard = async () => {
    const token = getAuthToken();
    if (!token) return;

    if (!otherWizardData.collegeName.trim()) {
      toast.error("Please enter College / University Name.");
      return;
    }
    if (!otherWizardData.disability) {
      toast.error("Please select Disability status.");
      return;
    }
    if (!otherWizardData.partnerExpectations.trim()) {
      toast.error("Please enter Partner Expectations.");
      return;
    }

    setSavingField('otherWizard');
    try {
      const fd = new FormData();
      fd.append("UserId", String(formData.UserId || 0));
      fd.append("CollegeName", otherWizardData.collegeName.trim());
      fd.append("Disability", otherWizardData.disability);
      const dOpt = disabilityOpts.find(o => o.value.toLowerCase() === otherWizardData.disability.toLowerCase());
      if (dOpt?.id) fd.append("DisabilityId", String(dOpt.id));
      fd.append("PartnerExpectations", otherWizardData.partnerExpectations.trim());
      if (otherWizardData.aboutMe) {
        fd.append("AboutMe", otherWizardData.aboutMe.trim());
      }
      fd.append("CompletedSection", "other");

      const res = await updateProfileApi(fd, token);
      if (res.success || (res as any).Success === 1) {
        setFormData((prev: any) => ({
          ...prev,
          CollegeName: otherWizardData.collegeName.trim(),
          Disability: otherWizardData.disability,
          PartnerExpectations: otherWizardData.partnerExpectations.trim(),
          ...(otherWizardData.aboutMe ? { AboutMe: otherWizardData.aboutMe.trim() } : {}),
        }));

        const nextCompleted = Array.from(new Set([...completedSections, 'other']));
        setCompletedSections(nextCompleted);
        closeSheet();

        const newScore = Math.min(100, profileCompletionScore + 5);
        setCelebrationModal({
          isOpen: true,
          title: "Other Details",
          scoreAdded: 5,
          remainingScore: 100 - newScore,
        });
      } else {
        toast.error(res.message || "Failed to save details");
      }
    } catch {
      toast.error("Network error saving details");
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
    const cleanVal = textInputData.value.trim();
    if (!cleanVal) {
      toast.error(`Please enter a valid ${textInputData.title || 'value'}. It cannot be empty.`);
      return;
    }
    saveFieldValue(textInputData.fieldKey, cleanVal);
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
      closeSheet();
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
    const formatted = formatHeightShort(heightCm);
    saveFieldValue('Height', formatted);
  };

  // Open Weight Sheet
  const openWeightSheet = () => {
    const match = String(formData.Weight || '').match(/(\d+)/);
    setWeightKg(match ? Number(match[1]) : 60);
    setActiveSheet('weight');
  };

  const handleSaveWeight = () => {
    saveFieldValue('Weight', `${weightKg} kg`);
  };

  // Open Income Sheet
  const openIncomeSheet = () => {
    const raw = formData.AnnualIncome || '₹5 - 7 Lakhs';
    const current = raw.replace(/^[?â‚¹\s]+/, '₹ ').trim();
    const idx = INCOME_BRACKETS.findIndex(b => b.toLowerCase().replace(/[^a-z0-9]/g, '') === current.toLowerCase().replace(/[^a-z0-9]/g, ''));
    setIncomeIndex(idx >= 0 ? idx : 4);
    setActiveSheet('income');
  };

  const handleSaveIncome = () => {
    const selectedIncome = INCOME_BRACKETS[incomeIndex] || '₹5 - 7 Lakhs';
    const cleanIncome = selectedIncome.replace(/^[?â‚¹\s]+/, '₹ ').trim();
    const matched = (masterData.INCOME_RANGES || []).find(r => 
      r.value.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanIncome.toLowerCase().replace(/[^a-z0-9]/g, '')
    );
    const incId = matched ? matched.id : (incomeIndex + 1);
    saveFieldValue('AnnualIncome', cleanIncome, { AnnualIncomeId: incId });
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

  const daysInCurrentMonth = useMemo(() => {
    return new Date(dobYear, dobMonth, 0).getDate();
  }, [dobYear, dobMonth]);

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

  // Open Location Sheet (State & City)
  const openLocationSheet = (target: 'Location' | 'FamilyLocation' | 'NativeLocation', fromWizard: string | null = null) => {
    setLocationTargetField(target);
    setOpenedFromWizard(fromWizard);
    setLocationStep('state');
    setLocationSearch('');
    if (target === 'FamilyLocation' || target === 'NativeLocation') {
      const stId = (fromWizard === 'familyWizard' && familyWizardData.nativeStateId) ? familyWizardData.nativeStateId : (formData.NativePlaceStateId || 14);
      const ctId = (fromWizard === 'familyWizard' && familyWizardData.nativeCityId) ? familyWizardData.nativeCityId : (formData.NativePlaceCityId || 1);
      setSelectedStateId(stId);
      setSelectedCityId(ctId);
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

  // Open Multi-Select Sheet
  const openMultiSelectSheet = (key: 'Hobbies' | 'Interests' | 'Sports' | 'LanguagesKnown' | 'Music', fromWizard: boolean = false) => {
    setMultiSelectKey(key);
    setOpenedFromWizard(fromWizard ? 'lifestyleWizard' : null);
    let title = 'Select Hobbies';
    let subtitle = 'Choose all pastimes you enjoy';
    let available: MasterOption[] = masterData.HOBBIES || [];

    if (key === 'Interests') {
      title = 'Select Interests';
      subtitle = 'Pick personal passions, topics and interests';
      available = masterData.INTERESTS || [];
    } else if (key === 'Music') {
      title = 'Select Music Preferences';
      subtitle = 'Choose musical genres, melodies and styles you enjoy';
      available = (masterData.MUSIC && masterData.MUSIC.length > 0) ? masterData.MUSIC : FALLBACK_MUSIC_OPTIONS;
    } else if (key === 'Sports') {
      title = 'Select Sports & Fitness';
      subtitle = 'Choose sports and physical activities you participate in';
      available = masterData.SPORTS || [];
    } else if (key === 'LanguagesKnown') {
      title = 'Languages You Know';
      subtitle = 'Select all languages you speak or understand fluently';
      available = masterData.LANGUAGES || [];
    }

    const catKey = key === 'LanguagesKnown' ? 'LANGUAGES' : key.toUpperCase();
    if (!available || available.length === 0) {
      fetchMasterDataApi(catKey).then(res => {
        if (res && res.length > 0) {
          setMasterData(prev => ({ ...prev, [catKey]: res }));
          setMultiSelectAvailable(res);
        }
      });
    }

    let currentList: string[] = [];
    if (fromWizard) {
      if (key === 'LanguagesKnown') currentList = [...lifestyleWizardData.languages];
      else if (key === 'Hobbies') currentList = [...lifestyleWizardData.hobbies];
      else if (key === 'Interests') currentList = [...lifestyleWizardData.interests];
      else if (key === 'Music') currentList = [...lifestyleWizardData.music];
      else if (key === 'Sports') currentList = [...lifestyleWizardData.sports];
    } else {
      const currentVal = formData[key] || '';
      currentList = currentVal.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

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
    if (multiSelectItems.length === 0) {
      toast.error(`Please select at least 1 ${multiSelectTitle || 'item'}. You cannot leave it empty.`);
      return;
    }

    if (openedFromWizard === 'lifestyleWizard') {
      if (multiSelectKey === 'LanguagesKnown') {
        setLifestyleWizardData(prev => ({ ...prev, languages: multiSelectItems }));
      } else if (multiSelectKey === 'Hobbies') {
        setLifestyleWizardData(prev => ({ ...prev, hobbies: multiSelectItems }));
      } else if (multiSelectKey === 'Interests') {
        setLifestyleWizardData(prev => ({ ...prev, interests: multiSelectItems }));
      } else if (multiSelectKey === 'Music') {
        setLifestyleWizardData(prev => ({ ...prev, music: multiSelectItems }));
      } else if (multiSelectKey === 'Sports') {
        setLifestyleWizardData(prev => ({ ...prev, sports: multiSelectItems }));
      }
      setOpenedFromWizard(null);
      setActiveSheet('lifestyleWizard');
      return;
    }
    const joined = multiSelectItems.join(', ');
    saveFieldValue(multiSelectKey, joined);
  };

  const handleSaveBio = () => {
    const cleanBio = bioDraft.trim();
    if (!cleanBio) {
      toast.error("Please enter something about yourself. It cannot be empty.");
      return;
    }
    saveFieldValue('AboutMe', cleanBio);
  };

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

  const handleSaveOption = () => {
    const selectedObj = sheetOptions.find(o => String(o.id) === String(selectedSheetValue) || o.value === selectedSheetValue);
    if (!selectedObj) {
      toast.error("Please select an option.");
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

  const handleSavePhotoPrivacy = async (privacyValue: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await updatePhotoPrivacyApi(privacyValue, token);
      if (res.success || (res as any).Success === 1) {
        setFormData((prev: any) => ({ ...prev, PhotoPrivacy: privacyValue }));
        closeSheet();
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

      const faceResult = await clientValidateSingleFace(dataUrl);
      toast.dismiss("face-scan");

      if (!faceResult.isValid) {
        toast.error(faceResult.message || "Please upload a clear solo photo of yourself. Screenshots and scenery are not allowed.");
        return;
      }

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
          setFormData((prev: any) => ({ ...prev, PhotoUrl: newPhotoUrl, mainPhotoUrl: newPhotoUrl }));
        }

        if (!isPhotosCompleted) {
          const nextCompleted = Array.from(new Set([...completedSections, 'photos']));
          setCompletedSections(nextCompleted);
          const newScore = Math.min(100, profileCompletionScore + 20);
          setCelebrationModal({
            isOpen: true,
            title: "Profile Photos",
            scoreAdded: 20,
            remainingScore: 100 - newScore,
            nextSection: !isFamilyCompleted ? 'family' : (!isReligiousCompleted ? 'religious' : undefined)
          });
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

  // Delete Photo - Wipes from DB and sets main photo cleanly
  const handleDeletePhoto = async (photoId: number, index: number) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const remaining = photos.filter((_, i) => i !== index);

      // Delete from ProfilePhotos table
      await deleteGalleryPhotoApi(photoId > 0 ? photoId : 0, token);

      if (remaining.length === 0) {
        const fd = new FormData();
        fd.append("UserId", String(formData.UserId || 0));
        fd.append("PhotoUrl", "");
        await updateProfileApi(fd, token);
        syncUserProfilePhoto('');
        setFormData((prev: any) => ({ ...prev, PhotoUrl: '', mainPhotoUrl: '' }));
      } else {
        if (index === 0) {
          const nextPhotoId = Number(remaining[0].photoId || (remaining[0] as any).PhotoId || 0);
          if (nextPhotoId > 0) {
            await setMainPhotoApi(nextPhotoId, token);
          }
        }
        const firstPhotoUrl = remaining[0].photoUrl || (remaining[0] as any).PhotoUrl || '';
        syncUserProfilePhoto(firstPhotoUrl);
        setFormData((prev: any) => ({ ...prev, PhotoUrl: firstPhotoUrl, mainPhotoUrl: firstPhotoUrl }));
      }

      setPhotos(remaining);
      toast.success("Photo removed successfully.");
    } catch {
      toast.error("Failed to remove photo.");
    }
  };

  // Submit Govt ID Document
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
      fd.append("DocumentType", "Aadhaar");
      const res = await uploadGovtDocumentApi(fd, token) as any;
      if (res?.success || res?.Success === 1) {
        toast.success("Document uploaded successfully! It is under verification.");
        setFormData((prev: any) => ({
          ...prev,
          GovtIdDocUrl: res?.data?.documentUrl || res?.data?.url || 'uploaded',
        }));
        closeSheet();
      } else {
        toast.error(res?.message || "Failed to upload document.");
      }
    } catch {
      toast.error("Network error uploading document.");
    } finally {
      setUploadingGovtDoc(false);
    }
  };

  // Master option arrays
  const casteOpts = masterData.CASTES || [];
  const maslakOpts = masterData.MASLAKS || [];
  const languageOpts = masterData.MOTHER_TONGUES || [];
  const educationOpts = masterData.EDUCATIONS || [];
  const sectorOpts = masterData.EMPLOYMENT_SECTORS || [];
  const occupationOpts = masterData.OCCUPATIONS || [];
  const parentOccupationOpts = (masterData.PARENT_OCCUPATIONS && masterData.PARENT_OCCUPATIONS.length > 0)
    ? masterData.PARENT_OCCUPATIONS
    : [
        { id: 1, value: 'Homemaker/Housewife' },
        { id: 2, value: 'Business/Self Employed' },
        { id: 3, value: 'Private Sector' },
        { id: 4, value: 'Government/PSU Sector' },
        { id: 5, value: 'Defence' },
        { id: 6, value: 'Civil Services' },
        { id: 7, value: 'Politician' },
        { id: 8, value: 'Social Workers' },
        { id: 9, value: 'Not Working' },
        { id: 10, value: 'Retired' },
        { id: 11, value: 'Passed Away' },
      ];
  const familyTypeOpts = masterData.FAMILY_TYPES || [{ id: 1, value: 'Nuclear Family' }, { id: 2, value: 'Joint Family' }];
  const familyStatusOpts = masterData.FAMILY_STATUS || [{ id: 1, value: 'Rich/ Affluent' }, { id: 2, value: 'Upper Middle Class' }, { id: 3, value: 'Middle Class' }];
  const namazOpts = (masterData.NAMAZ_HABITS && masterData.NAMAZ_HABITS.length > 0)
    ? masterData.NAMAZ_HABITS
    : [
        { id: 1, value: 'Regularly / 5 Times Daily' },
        { id: 2, value: 'Only Friday / Jummah Only' },
        { id: 3, value: 'During Ramadan Only' },
        { id: 4, value: 'Sometimes' },
        { id: 5, value: 'Planning to Start' },
        { id: 6, value: 'Never' }
      ];
  const quranOpts = (masterData.QURAN_READING && masterData.QURAN_READING.length > 0)
    ? masterData.QURAN_READING
    : [
        { id: 1, value: 'Daily / Regularly' },
        { id: 2, value: 'Only during Ramadan' },
        { id: 3, value: 'Only on Fridays' },
        { id: 4, value: 'Sometimes' },
        { id: 5, value: 'Learning to Read' },
        { id: 6, value: 'Never' }
      ];
  const rozaOpts = (masterData.ROZA_HABITS && masterData.ROZA_HABITS.length > 0)
    ? masterData.ROZA_HABITS
    : [
        { id: 1, value: 'Regularly / All 30 Days' },
        { id: 2, value: 'A Few Days When Possible' },
        { id: 3, value: 'Only during Ramadan' },
        { id: 4, value: 'Planning Soon (Insha\'Allah)' },
        { id: 5, value: 'Not Keeping' }
      ];
  const zakatOpts = (masterData.ZAKAT_HABITS && masterData.ZAKAT_HABITS.length > 0)
    ? masterData.ZAKAT_HABITS
    : [
        { id: 1, value: 'Yes, Regularly' },
        { id: 2, value: 'Planning to Start' },
        { id: 3, value: 'Not Applicable' }
      ];
  const hajjOpts = (masterData.HAJJ_UMRAH && masterData.HAJJ_UMRAH.length > 0)
    ? masterData.HAJJ_UMRAH
    : [
        { id: 1, value: 'Hajj & Umrah Done' },
        { id: 2, value: 'Umrah Done' },
        { id: 3, value: 'Planning Soon (Insha\'Allah)' },
        { id: 4, value: 'Not Yet' }
      ];
  const dietOpts = (masterData.DIET_TYPES && masterData.DIET_TYPES.length > 0)
    ? masterData.DIET_TYPES
    : [
        { id: 1, value: 'Strictly Halal Always' },
        { id: 2, value: 'Halal Non-Veg & Veg' },
        { id: 3, value: 'Halal at Home, Vegetarian Outside' },
        { id: 4, value: 'Vegetarian Only' },
        { id: 5, value: 'Vegan' }
      ];
  const smokeOpts = (masterData.SMOKE_HABITS && masterData.SMOKE_HABITS.length > 0)
    ? masterData.SMOKE_HABITS
    : [
        { id: 1, value: 'Non-Smoker / Never' },
        { id: 2, value: 'Occasionally / Socially' },
        { id: 3, value: 'Regular Smoker' }
      ];
  const drinkOpts = (masterData.DRINK_HABITS && masterData.DRINK_HABITS.length > 0)
    ? masterData.DRINK_HABITS
    : [
        { id: 1, value: 'Never / Non-Drinker' },
        { id: 2, value: 'Occasionally / Socially' },
        { id: 3, value: 'Planning to Quit' }
      ];
  const disabilityOpts = (masterData.DISABILITIES && masterData.DISABILITIES.length > 0)
    ? masterData.DISABILITIES
    : [
        { id: 1, value: 'None' },
        { id: 2, value: 'Physically Challenged (Mobility)' },
        { id: 3, value: 'Visually Impaired' },
        { id: 4, value: 'Hearing / Speech Impaired' },
        { id: 5, value: 'Other' }
      ];

  const filteredSheetOptions = useMemo(() => {
    if (!sheetSearch.trim()) return sheetOptions;
    return sheetOptions.filter(o => o.value.toLowerCase().includes(sheetSearch.toLowerCase()));
  }, [sheetOptions, sheetSearch]);

  const filteredMultiSelectOptions = useMemo(() => {
    if (!multiSelectSearch.trim()) return multiSelectAvailable;
    return multiSelectAvailable.filter(o => o.value.toLowerCase().includes(multiSelectSearch.toLowerCase()));
  }, [multiSelectAvailable, multiSelectSearch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <ProfileAvatarLoader 
          message="Loading your profile details..." 
          subMessage="Fetching verified matrimonial data"
        />
      </div>
    );
  }

  const activePhotosCount = photos.filter(p => p && p.photoUrl).length;

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-28 font-sans selection:bg-[#d91b5c] selection:text-white">
      <Toaster position="top-center" richColors />

      {/* 🌟 1. 100% FIXED APP BAR AT TOP */}
      <header className="fixed top-0 inset-x-0 z-40 bg-white border-b border-slate-100 px-4 py-3 shadow-2xs">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <button 
              type="button" 
              onClick={() => {
                if (typeof window !== "undefined") {
                  const last = sessionStorage.getItem('last_browse_page');
                  if (last && last !== '/dashboard/edit-profile') {
                    router.push(last);
                    return;
                  }
                  if (window.history.length > 1) {
                    router.back();
                    return;
                  }
                }
                router.push('/dashboard/my-profile');
              }}
              className="w-9 h-9 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
              aria-label="Back to profile"
            >
              <ChevronLeft size={20} className="stroke-[2.5]" />
            </button>
            <h1 className="text-base font-bold tracking-tight text-slate-900 truncate">
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
      <main className="max-w-lg mx-auto px-4 pt-16 pb-28 space-y-4">

        {/* 🌟 100% COMPLETE PROFILE BADGE PROMPT (Matching Screenshot 6) */}
        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-white border border-amber-200/60 shadow-xs">
          <div className="w-6 h-6 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
            <Star size={13} className="fill-amber-400" />
          </div>
          <span className="text-xs font-bold text-slate-800">
            Earn the badge on 100% complete profile. ({profileCompletionScore}%)
          </span>
        </div>

        {/* ============================================================== */}
        {/* 🌟 TOP COMPLETION CARDS TRAY (Screenshot 6)                    */}
        {/* ============================================================== */}
        {incompleteCards.length > 0 && (
          <div className="space-y-2.5">
            {incompleteCards.map((card) => (
              <div 
                key={card.key}
                onClick={card.onAction}
                className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#FFF5F8] to-[#FFF0F4] border border-[#f5b8cc] hover:border-[#d91b5c]/60 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-bold text-slate-900">
                      {card.title}
                    </span>
                    {card.key === 'verify' && (
                      <CheckCircle2 size={15} className="text-sky-500 fill-sky-100 shrink-0" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-[#d91b5c] block group-hover:underline">
                    {card.actionLabel}
                  </span>
                </div>

                {card.scoreBadge && (
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white text-[#d91b5c] border border-rose-200 shadow-2xs shrink-0">
                    {card.scoreBadge}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ============================================================== */}
        {/* 🌟 ABOUT ME SECTION                                            */}
        {/* ============================================================== */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-2">
            <User size={18} className="text-slate-800" />
            <h2 className="text-sm font-black text-slate-900">About Me</h2>
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
        {/* 🌟 1. PERSONAL DETAILS SECTION (Screenshot 2)                  */}
        {/* ============================================================== */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <User size={18} className="text-slate-800" />
            <h2 className="text-sm font-black text-slate-900">Personal Details</h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {/* 1. Name (Editable with text sheet) */}
            <div 
              onClick={() => openTextInputSheet("Your Name", "Enter full legal name", "FullName", formData.FullName, "Full Name", 60)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Name</span>
                <span className="text-xs text-slate-600 font-medium mt-0.5 block">{formData.FullName || "User"}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 2. Profile Created For (Locked - Screenshot 2) */}
            <div 
              className="p-3.5 sm:p-4 flex items-center justify-between bg-slate-50/30 cursor-default select-none"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Profile Created for</span>
                <span className="text-xs text-slate-600 font-medium mt-0.5 block">{getMasterLabel('PROFILE_CREATED_FOR', formData.ProfileCreatedFor)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                <Info size={12} className="text-slate-400" />
                <span>You can not edit this</span>
              </div>
            </div>

            {/* 3. Age and Gender (Locked - Screenshot 2) */}
            <div 
              className="p-3.5 sm:p-4 flex items-center justify-between bg-slate-50/30 cursor-default select-none"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Age and Gender</span>
                <span className="text-xs text-slate-600 font-medium mt-0.5 block">{formData.Age || '25'}, {formData.Gender || 'Male'}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                <Info size={12} className="text-slate-400" />
                <span>You can not edit this</span>
              </div>
            </div>

            {/* 4. Marital Status (Locked - Screenshot 2) */}
            <div 
              className="p-3.5 sm:p-4 flex items-center justify-between bg-slate-50/30 cursor-default select-none"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Marital Status</span>
                <span className="text-xs text-slate-600 font-medium mt-0.5 block">{getMasterLabel('MARITAL_STATUS', formData.MaritalStatus)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                <Info size={12} className="text-slate-400" />
                <span>You can not edit this</span>
              </div>
            </div>

            {/* 5. Sect (Locked - Screenshot 2) */}
            <div 
              className="p-3.5 sm:p-4 flex items-center justify-between bg-slate-50/30 cursor-default select-none"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Sect</span>
                <span className="text-xs text-slate-600 font-medium mt-0.5 block">{getMasterLabel('SECTS', formData.Sect)}</span>
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

            {/* Weight (Editable with Slider Sheet) */}
            <div 
              onClick={openWeightSheet}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Weight</span>
                <span className="text-xs mt-0.5 block">{renderLabel(formData.Weight, "Select Weight")}</span>
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
                <span className="text-[13px] font-bold text-slate-900 block">Highest Education</span>
                <span className="text-xs mt-0.5 block">{renderLabel(getMasterLabel('EDUCATIONS', formData.Education), "Select Education")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 2. College Name */}
            <div 
              onClick={() => openTextInputSheet("College / University", "Enter your college or university name", "CollegeName", formData.CollegeName, "e.g. Aligarh Muslim University", 100)}
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
              onClick={() => openOptionSheet('Employed In', 'EmployedIn', formData.EmployedIn, sectorOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Employed In</span>
                <span className="text-xs mt-0.5 block">{renderLabel(getMasterLabel('EMPLOYMENT_SECTORS', formData.EmployedIn), "Select Sector")}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 4. Occupation */}
            <div 
              onClick={() => openOptionSheet('Select Profession', 'Occupation', formData.Occupation, occupationOpts)}
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
        {/* 🌟 3. FAMILY DETAILS SECTION (Shows when any field is filled)  */}
        {/* ============================================================== */}
        {hasAnyFamilyField && (
          <section className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Users size={18} className="text-slate-800" />
              <h2 className="text-sm font-black text-slate-900">Family Details</h2>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {/* Family Type */}
              {Boolean(formData.FamilyType) && (
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
              )}

              {/* Family Status */}
              {Boolean(formData.FamilyStatus) && (
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
              )}

              {/* Native Location */}
              {Boolean(formData.NativeLocation) && (
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
              )}

              {/* Father's Occupation */}
              {Boolean(formData.FatherOccupation && formData.FatherOccupation !== 'None') && (
                <div 
                  onClick={() => openOptionSheet("Select Father's Profession", "FatherOccupation", formData.FatherOccupation, parentOccupationOpts)}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="text-[13px] font-bold text-slate-900 block">Father's Occupation</span>
                    <span className="text-xs mt-0.5 block">{renderLabel(getMasterLabel('PARENT_OCCUPATIONS', formData.FatherOccupation) || formData.FatherOccupation, "Select Occupation")}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              )}

              {/* Mother's Occupation */}
              {Boolean(formData.MotherOccupation && formData.MotherOccupation !== 'None') && (
                <div 
                  onClick={() => openOptionSheet("Select Mother's Profession", "MotherOccupation", formData.MotherOccupation, parentOccupationOpts)}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="text-[13px] font-bold text-slate-900 block">Mother's Occupation</span>
                    <span className="text-xs mt-0.5 block">{renderLabel(getMasterLabel('PARENT_OCCUPATIONS', formData.MotherOccupation) || formData.MotherOccupation, "Select Occupation")}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              )}

              {/* Brothers */}
              {(formData.TotalBrothers !== undefined && formData.TotalBrothers !== null) && (
                <div 
                  onClick={openCountersSheet}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="text-[13px] font-bold text-slate-900 block">Brother</span>
                    <span className="text-xs text-slate-600 font-medium mt-0.5 block">
                      {Number(formData.TotalBrothers) > 0 
                        ? `${formData.TotalBrothers} Brother (${formData.MarriedBrothers || 0} Married)` 
                        : '0 Brother'}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              )}

              {/* Sisters */}
              {(formData.TotalSisters !== undefined && formData.TotalSisters !== null) && (
                <div 
                  onClick={openCountersSheet}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="text-[13px] font-bold text-slate-900 block">Sister</span>
                    <span className="text-xs text-slate-600 font-medium mt-0.5 block">
                      {Number(formData.TotalSisters) > 0 
                        ? `${formData.TotalSisters} Sister (${formData.MarriedSisters || 0} Married)` 
                        : '0 Sister'}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              )}
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* 🌟 4. RELIGIOUS DETAILS SECTION (Shows when any field is filled)*/}
        {/* ============================================================== */}
        {hasAnyReligiousField && (
          <section className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Moon size={18} className="text-slate-800" />
              <h2 className="text-sm font-black text-slate-900">Religious Details</h2>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {Boolean(formData.NamazHabit) && (
                <div 
                  onClick={() => openOptionSheet('Offer Namaz', 'NamazHabit', formData.NamazHabit, namazOpts)}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="text-[13px] font-bold text-slate-900 block">Namaz Habit</span>
                    <span className="text-xs mt-0.5 block">{renderLabel(formData.NamazHabit, "Select Namaz Frequency")}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              )}

              {Boolean(formData.QuranReading) && (
                <div 
                  onClick={() => openOptionSheet('Recite Quran', 'QuranReading', formData.QuranReading, quranOpts)}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="text-[13px] font-bold text-slate-900 block">Quran Recitation</span>
                    <span className="text-xs mt-0.5 block">{renderLabel(formData.QuranReading, "Select Quran Frequency")}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              )}

              {Boolean(formData.RozaHabit) && (
                <div 
                  onClick={() => openOptionSheet('Keep Roza', 'RozaHabit', formData.RozaHabit, rozaOpts)}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="text-[13px] font-bold text-slate-900 block">Keep Roza (Fasts)</span>
                    <span className="text-xs mt-0.5 block">{renderLabel(formData.RozaHabit, "Select Roza Status")}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              )}

              {Boolean(formData.ZakatHabit) && (
                <div 
                  onClick={() => openOptionSheet('Zakat Habit', 'ZakatHabit', formData.ZakatHabit, zakatOpts)}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="text-[13px] font-bold text-slate-900 block">Zakat Habit</span>
                    <span className="text-xs mt-0.5 block">{renderLabel(formData.ZakatHabit, "Select Zakat Frequency")}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              )}

              {Boolean(formData.HajjUmrah) && (
                <div 
                  onClick={() => openOptionSheet('Hajj / Umrah', 'HajjUmrah', formData.HajjUmrah, hajjOpts)}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="text-[13px] font-bold text-slate-900 block">Hajj or Umrah</span>
                    <span className="text-xs mt-0.5 block">{renderLabel(formData.HajjUmrah, "Select Status")}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              )}
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* 🌟 5. LIFESTYLE & INTERESTS (Shows when any field is filled)   */}
        {/* ============================================================== */}
        {hasAnyLifestyleField && (
          <section className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Activity size={18} className="text-slate-800" />
              <h2 className="text-sm font-black text-slate-900">Lifestyle & Interests</h2>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {Boolean(formData.DietType) && (
                <div 
                  onClick={() => openOptionSheet('Diet Type', 'DietType', formData.DietType, dietOpts)}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="text-[13px] font-bold text-slate-900 block">Diet Type</span>
                    <span className="text-xs mt-0.5 block">{renderLabel(formData.DietType, "Select Diet")}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              )}

              {Boolean(formData.SmokeHabit) && (
                <div 
                  onClick={() => openOptionSheet('Smoking Habit', 'SmokeHabit', formData.SmokeHabit, smokeOpts)}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="text-[13px] font-bold text-slate-900 block">Smoking Habit</span>
                    <span className="text-xs mt-0.5 block">{renderLabel(formData.SmokeHabit, "Select Smoke Status")}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              )}

              {Boolean(formData.DrinkHabit) && (
                <div 
                  onClick={() => openOptionSheet('Drinking Habit', 'DrinkHabit', formData.DrinkHabit, drinkOpts)}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="text-[13px] font-bold text-slate-900 block">Drinking Habit</span>
                    <span className="text-xs mt-0.5 block">{renderLabel(formData.DrinkHabit, "Select Drink Status")}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              )}

              {Boolean(formData.Sports) && (
                <div 
                  onClick={() => openMultiSelectSheet('Sports')}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="text-[13px] font-bold text-slate-900 block">Sports & Fitness</span>
                    <span className="text-xs mt-0.5 block">{renderLabel(formData.Sports, "Choose Sports")}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              )}

              {Boolean(formData.LanguagesKnown) && (
                <div 
                  onClick={() => openMultiSelectSheet('LanguagesKnown')}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="text-[13px] font-bold text-slate-900 block">Languages Known</span>
                    <span className="text-xs mt-0.5 block">{renderLabel(formData.LanguagesKnown, "Choose Languages")}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              )}

              {Boolean(formData.Hobbies) && (
                <div 
                  onClick={() => openMultiSelectSheet('Hobbies')}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="text-[13px] font-bold text-slate-900 block">Hobbies</span>
                    <span className="text-xs mt-0.5 block">{renderLabel(formData.Hobbies, "Choose Hobbies")}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              )}

              {Boolean(formData.Music) && (
                <div 
                  onClick={() => openMultiSelectSheet('Music')}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="text-[13px] font-bold text-slate-900 block">Music</span>
                    <span className="text-xs mt-0.5 block">{renderLabel(formData.Music, "Choose Music")}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              )}
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* 🌟 6. OTHER DETAILS SECTION (Shows when any field is filled)   */}
        {/* ============================================================== */}
        {hasAnyOtherField && (
          <section className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <FileText size={18} className="text-slate-800" />
              <h2 className="text-sm font-black text-slate-900">Other Details</h2>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {Boolean(formData.CollegeName) && (
                <div 
                  onClick={() => openTextInputSheet("College / University", "Enter your college or university name", "CollegeName", formData.CollegeName, "e.g. Jamia Millia Islamia", 100)}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="text-[13px] font-bold text-slate-900 block">College / University</span>
                    <span className="text-xs mt-0.5 block">{renderLabel(formData.CollegeName, "Add College Name")}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              )}

              {Boolean(formData.Disability && formData.Disability !== 'None') && (
                <div 
                  onClick={() => openOptionSheet("Do you have any disability?", "Disability", formData.Disability, disabilityOpts)}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="text-[13px] font-bold text-slate-900 block">Disability</span>
                    <span className="text-xs mt-0.5 block">{renderLabel(formData.Disability || "None", "Select Disability")}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              )}

              {Boolean(formData.PartnerExpectations) && (
                <div 
                  onClick={() => openTextInputSheet("Partner Expectations", "Describe what qualities and values you are looking for in a partner", "PartnerExpectations", formData.PartnerExpectations, "e.g. Looking for a religious, understanding partner...", 1000, true)}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="text-[13px] font-bold text-slate-900 block">Partner Expectations</span>
                    <span className="text-xs mt-0.5 block line-clamp-1">{renderLabel(formData.PartnerExpectations, "Add Partner Expectations")}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              )}
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* 🌟 7. CONTACT DETAILS SECTION                                  */}
        {/* ============================================================== */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Phone size={18} className="text-slate-800" />
            <h2 className="text-sm font-black text-slate-900">Contact Details</h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
            <div 
              onClick={openChangeMobileSheet}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Phone Number</span>
                <span className="text-xs text-slate-600 font-medium mt-0.5 block">{formData.MobileNumber ? `+91 ${formData.MobileNumber}` : "Add Mobile Number"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#d91b5c]">Change via OTP</span>
                <ChevronRight size={16} className="text-slate-400" />
              </div>
            </div>

            <div 
              className="p-3.5 sm:p-4 flex items-center justify-between bg-slate-50/30 cursor-default select-none"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Email</span>
                <span className="text-xs text-slate-600 font-medium mt-0.5 block">{formData.Email || "Not Provided"}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                <Info size={12} className="text-slate-400" />
                <span>You can not edit this</span>
              </div>
            </div>

            <div 
              onClick={() => openTextInputSheet("WhatsApp Number", "Enter WhatsApp number for quick matchmaking contact", "WhatsAppNumber", formData.WhatsAppNumber, "e.g. +91 9876543210", 20, false, "tel")}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">WhatsApp Number</span>
                <span className="text-xs text-slate-600 font-medium mt-0.5 block">{formData.WhatsAppNumber || "Add WhatsApp Number"}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>
        </section>



      </main>

      {/* ============================================================== */}
      {/* 🌟 CELEBRATION MODAL (Screenshot 1)                            */}
      {/* ============================================================== */}
      <AnimatePresence>
        {celebrationModal && celebrationModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute -top-24 inset-x-0 h-48 bg-gradient-to-b from-rose-100/60 to-transparent pointer-events-none rounded-t-3xl" />

              {/* Vector Illustration matching Screenshot 1 */}
              <div className="relative mx-auto w-36 h-36 mb-4 flex items-center justify-center">
                <div className="absolute inset-0 bg-rose-50 rounded-full scale-110" />
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="flex items-center justify-center -mb-2 z-20">
                    <div className="w-8 h-8 rounded-full border-4 border-[#d91b5c] -mr-1 rotate-[-25deg]" />
                    <div className="w-8 h-8 rounded-full border-4 border-[#d91b5c] -ml-1 rotate-[25deg]" />
                  </div>
                  <div className="w-24 h-20 bg-emerald-600 rounded-xl relative shadow-md flex items-center justify-center overflow-hidden border-2 border-emerald-700">
                    <div className="absolute top-0 inset-x-0 h-4 bg-emerald-700 border-b border-emerald-800" />
                    <div className="absolute inset-y-0 w-5 bg-[#d91b5c]" />
                    <div className="absolute inset-x-0 h-5 bg-[#d91b5c]" />
                    
                    <div className="relative z-30 px-3 py-1 rounded-full bg-white text-[#d91b5c] font-black text-sm shadow-md border border-rose-200">
                      +{celebrationModal.scoreAdded}%
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-black text-slate-900 leading-snug">
                MashaAllah, {celebrationModal.title} are completed!
              </h3>

              <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed px-2">
                {celebrationModal.remainingScore > 0 
                  ? `Complete ${celebrationModal.remainingScore}% more of your profile for 100% score and benefits.`
                  : `Alhamdulillah! Your profile is now 100% complete and verified for maximum matches!`
                }
              </p>

              <button
                type="button"
                onClick={() => {
                  setCelebrationModal(null);
                }}
                className="w-full mt-6 py-3.5 rounded-2xl bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-lg shadow-rose-500/25 transition-all cursor-pointer active:scale-98"
              >
                {celebrationModal.remainingScore > 0 ? "Got it, Continue" : "Close"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* 🌟 BOTTOM SHEETS SYSTEM                                        */}
      {/* ============================================================== */}
      <AnimatePresence>
        {activeSheet && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSheet}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs cursor-pointer"
            />

            {/* 🌟 FAMILY DETAILS WIZARD (Screenshot 8 & 7) */}
            {activeSheet === 'familyWizard' && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={closeSheet} className="p-1 text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer">
                      <X size={18} />
                    </button>
                    <h3 className="text-base font-black text-slate-900">Family Details</h3>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-slate-900">
                  {/* Family Type Chips */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 block">What is your family type?</label>
                    <div className="flex flex-wrap gap-2">
                      {familyTypeOpts.map(opt => {
                        const isSel = String(familyWizardData.familyType) === String(opt.id) || String(familyWizardData.familyType) === opt.value;
                        return (
                          <button
                            key={String(opt.id)}
                            type="button"
                            onClick={() => setFamilyWizardData(prev => ({ ...prev, familyType: Number(opt.id) || 1 }))}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                              isSel ? 'bg-[#d91b5c] text-white border-[#d91b5c]' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Family Status Chips */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 block">What is your family status?</label>
                    <div className="flex flex-wrap gap-2">
                      {familyStatusOpts.map(opt => {
                        const isSel = String(familyWizardData.familyStatus) === String(opt.id) || String(familyWizardData.familyStatus) === opt.value;
                        return (
                          <button
                            key={String(opt.id)}
                            type="button"
                            onClick={() => setFamilyWizardData(prev => ({ ...prev, familyStatus: Number(opt.id) || 2 }))}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                              isSel ? 'bg-[#d91b5c] text-white border-[#d91b5c]' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Native Location Link (Screenshot 3) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900 block">What is your native location?</label>
                    <button
                      type="button"
                      onClick={() => openLocationSheet('NativeLocation', 'familyWizard')}
                      className="text-xs font-bold text-[#d91b5c] hover:underline block"
                    >
                      {familyWizardData.nativeLocation || formData.NativeLocation ? `${familyWizardData.nativeLocation || formData.NativeLocation} (Tap to change)` : "+ Add native location"}
                    </button>
                  </div>

                  {/* Father's Occupation Chips */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 block">What is your father's occupation?</label>
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                      {parentOccupationOpts.map(opt => {
                        const isSel = familyWizardData.fatherOccupation.toLowerCase() === opt.value.toLowerCase();
                        return (
                          <button
                            key={String(opt.id || opt.value)}
                            type="button"
                            onClick={() => setFamilyWizardData(prev => ({ ...prev, fatherOccupation: opt.value }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                              isSel ? 'bg-[#d91b5c] text-white border-[#d91b5c]' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mother's Occupation Chips */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 block">What is your mother's occupation?</label>
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                      {parentOccupationOpts.map(opt => {
                        const isSel = familyWizardData.motherOccupation.toLowerCase() === opt.value.toLowerCase();
                        return (
                          <button
                            key={String(opt.id || opt.value)}
                            type="button"
                            onClick={() => setFamilyWizardData(prev => ({ ...prev, motherOccupation: opt.value }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                              isSel ? 'bg-[#d91b5c] text-white border-[#d91b5c]' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sibling Circle Counter Chips (0, 1, 2, 3, 4+) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 block">No. of Brothers</label>
                    <div className="flex items-center gap-2">
                      {[0, 1, 2, 3, 4].map(num => {
                        const isSel = familyWizardData.totalBrothers === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setFamilyWizardData(prev => ({ ...prev, totalBrothers: num, marriedBrothers: num === 0 ? 0 : Math.min(prev.marriedBrothers, num) }))}
                            className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center border transition-all ${
                              isSel ? 'bg-[#d91b5c] text-white border-[#d91b5c]' : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            {num === 4 ? '4+' : num}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Married Brothers (Only if Brothers > 0) */}
                  {familyWizardData.totalBrothers > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-900 block">Married Brothers</label>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: familyWizardData.totalBrothers + 1 }, (_, i) => i).map(num => {
                          const isSel = familyWizardData.marriedBrothers === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setFamilyWizardData(prev => ({ ...prev, marriedBrothers: num }))}
                              className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center border transition-all ${
                                isSel ? 'bg-[#d91b5c] text-white border-[#d91b5c]' : 'bg-white text-slate-700 border-slate-200'
                              }`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 block">No. of Sisters</label>
                    <div className="flex items-center gap-2">
                      {[0, 1, 2, 3, 4].map(num => {
                        const isSel = familyWizardData.totalSisters === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setFamilyWizardData(prev => ({ ...prev, totalSisters: num, marriedSisters: num === 0 ? 0 : Math.min(prev.marriedSisters, num) }))}
                            className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center border transition-all ${
                              isSel ? 'bg-[#d91b5c] text-white border-[#d91b5c]' : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            {num === 4 ? '4+' : num}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Married Sisters (Only if Sisters > 0) */}
                  {familyWizardData.totalSisters > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-900 block">Married Sisters</label>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: familyWizardData.totalSisters + 1 }, (_, i) => i).map(num => {
                          const isSel = familyWizardData.marriedSisters === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setFamilyWizardData(prev => ({ ...prev, marriedSisters: num }))}
                              className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center border transition-all ${
                                isSel ? 'bg-[#d91b5c] text-white border-[#d91b5c]' : 'bg-white text-slate-700 border-slate-200'
                              }`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveFamilyWizard}
                  disabled={Boolean(savingField)}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : "Save Family Details"}
                </button>
              </motion.div>
            )}

            {/* 🌟 RELIGIOUS DETAILS WIZARD (Screenshot 5) */}
            {activeSheet === 'religiousWizard' && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={closeSheet} className="p-1 text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer">
                      <X size={18} />
                    </button>
                    <h3 className="text-base font-black text-slate-900">Religious Details</h3>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-slate-900">
                  {/* Namaz Habit */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-900 block">How often do you offer Namaz (Prayers)?</label>
                    <div className="flex flex-wrap gap-1.5">
                      {namazOpts.map(opt => {
                        const isSel = religiousWizardData.namazHabit.toLowerCase() === opt.value.toLowerCase();
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setReligiousWizardData(prev => ({ ...prev, namazHabit: opt.value }))}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                              isSel ? 'bg-[#d91b5c] text-white border-[#d91b5c]' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quran Reading */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <label className="text-xs font-bold text-slate-900 block">How often do you recite the Quran?</label>
                    <div className="flex flex-wrap gap-1.5">
                      {quranOpts.map(opt => {
                        const isSel = religiousWizardData.quranReading.toLowerCase() === opt.value.toLowerCase();
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setReligiousWizardData(prev => ({ ...prev, quranReading: opt.value }))}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                              isSel ? 'bg-[#d91b5c] text-white border-[#d91b5c]' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Roza */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <label className="text-xs font-bold text-slate-900 block">Do you keep Roza (fasts)?</label>
                    <div className="flex flex-wrap gap-1.5">
                      {rozaOpts.map(opt => {
                        const isSel = religiousWizardData.rozaHabit.toLowerCase() === opt.value.toLowerCase();
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setReligiousWizardData(prev => ({ ...prev, rozaHabit: opt.value }))}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                              isSel ? 'bg-[#d91b5c] text-white border-[#d91b5c]' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Zakat */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <label className="text-xs font-bold text-slate-900 block">When do you give Zakat?</label>
                    <div className="flex flex-wrap gap-1.5">
                      {zakatOpts.map(opt => {
                        const isSel = religiousWizardData.zakatHabit.toLowerCase() === opt.value.toLowerCase();
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setReligiousWizardData(prev => ({ ...prev, zakatHabit: opt.value }))}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                              isSel ? 'bg-[#d91b5c] text-white border-[#d91b5c]' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hajj / Umrah */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <label className="text-xs font-bold text-slate-900 block">Have you performed Hajj or Umrah?</label>
                    <div className="flex flex-wrap gap-1.5">
                      {hajjOpts.map(opt => {
                        const isSel = religiousWizardData.hajjUmrah.toLowerCase() === opt.value.toLowerCase();
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setReligiousWizardData(prev => ({ ...prev, hajjUmrah: opt.value }))}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                              isSel ? 'bg-[#d91b5c] text-white border-[#d91b5c]' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveReligiousWizard}
                  disabled={Boolean(savingField)}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : "Save Religious Details"}
                </button>
              </motion.div>
            )}

            {/* 🌟 LIFESTYLE & INTEREST WIZARD */}
            {activeSheet === 'lifestyleWizard' && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={closeSheet} className="p-1 text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer">
                      <X size={18} />
                    </button>
                    <h3 className="text-base font-black text-slate-900">Lifestyle & Interests</h3>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-slate-900">
                  {/* 1. Diet Preference Chips */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-900 block">What is your diet preference?</label>
                    <div className="flex flex-wrap gap-1.5">
                      {dietOpts.map(opt => {
                        const isSel = lifestyleWizardData.dietType.toLowerCase() === opt.value.toLowerCase();
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setLifestyleWizardData(prev => ({ ...prev, dietType: opt.value }))}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                              isSel ? 'bg-[#d91b5c] text-white border-[#d91b5c]' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Smoking Habit */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <label className="text-xs font-bold text-slate-900 block">Smoking Habit</label>
                    <div className="flex flex-wrap gap-1.5">
                      {smokeOpts.map(opt => {
                        const isSel = lifestyleWizardData.smokeHabit.toLowerCase() === opt.value.toLowerCase();
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setLifestyleWizardData(prev => ({ ...prev, smokeHabit: opt.value }))}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                              isSel ? 'bg-[#d91b5c] text-white border-[#d91b5c]' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Drinking Habit */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <label className="text-xs font-bold text-slate-900 block">Drinking Habit</label>
                    <div className="flex flex-wrap gap-1.5">
                      {drinkOpts.map(opt => {
                        const isSel = lifestyleWizardData.drinkHabit.toLowerCase() === opt.value.toLowerCase();
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setLifestyleWizardData(prev => ({ ...prev, drinkHabit: opt.value }))}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                              isSel ? 'bg-[#d91b5c] text-white border-[#d91b5c]' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Sports & Fitness */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900">Sports & Fitness</label>
                      {lifestyleWizardData.sports.length > 0 && (
                        <button 
                          type="button" 
                          onClick={() => openMultiSelectSheet('Sports', true)}
                          className="text-[#d91b5c] text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                      )}
                    </div>
                    {lifestyleWizardData.sports.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => openMultiSelectSheet('Sports', true)}
                        className="w-full py-2 px-3 rounded-xl border border-dashed border-[#d91b5c] text-[#d91b5c] font-bold text-xs bg-rose-50/40 hover:bg-rose-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus size={14} /> Add Sports & Fitness
                      </button>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {lifestyleWizardData.sports.map(sp => (
                          <span key={sp} className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-[11px] font-semibold border border-slate-200">
                            {sp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 5. Languages Known */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900">Which languages do you know?</label>
                      {lifestyleWizardData.languages.length > 0 && (
                        <button 
                          type="button" 
                          onClick={() => openMultiSelectSheet('LanguagesKnown', true)}
                          className="text-[#d91b5c] text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                      )}
                    </div>
                    {lifestyleWizardData.languages.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => openMultiSelectSheet('LanguagesKnown', true)}
                        className="w-full py-2 px-3 rounded-xl border border-dashed border-[#d91b5c] text-[#d91b5c] font-bold text-xs bg-rose-50/40 hover:bg-rose-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus size={14} /> Add Languages
                      </button>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {lifestyleWizardData.languages.map(lang => (
                          <span key={lang} className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-[11px] font-semibold border border-slate-200">
                            {lang}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 6. Hobbies */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900">Hobbies</label>
                      {lifestyleWizardData.hobbies.length > 0 && (
                        <button 
                          type="button" 
                          onClick={() => openMultiSelectSheet('Hobbies', true)}
                          className="text-[#d91b5c] text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                      )}
                    </div>
                    {lifestyleWizardData.hobbies.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => openMultiSelectSheet('Hobbies', true)}
                        className="w-full py-2 px-3 rounded-xl border border-dashed border-[#d91b5c] text-[#d91b5c] font-bold text-xs bg-rose-50/40 hover:bg-rose-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus size={14} /> Add Hobbies
                      </button>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {lifestyleWizardData.hobbies.map(hob => (
                          <span key={hob} className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-[11px] font-semibold border border-slate-200">
                            {hob}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 7. Music Preferences */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900">Music</label>
                      {lifestyleWizardData.music.length > 0 && (
                        <button 
                          type="button" 
                          onClick={() => openMultiSelectSheet('Music', true)}
                          className="text-[#d91b5c] text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                      )}
                    </div>
                    {lifestyleWizardData.music.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => openMultiSelectSheet('Music', true)}
                        className="w-full py-2 px-3 rounded-xl border border-dashed border-[#d91b5c] text-[#d91b5c] font-bold text-xs bg-rose-50/40 hover:bg-rose-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus size={14} /> Add Music
                      </button>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {lifestyleWizardData.music.map(item => (
                          <span key={item} className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-[11px] font-semibold border border-slate-200">
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveLifestyleWizard}
                  disabled={Boolean(savingField)}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : "Save Lifestyle Details"}
                </button>
              </motion.div>
            )}

            {/* 🌟 OTHER DETAILS WIZARD */}
            {activeSheet === 'otherWizard' && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={closeSheet} className="p-1 text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer">
                      <X size={18} />
                    </button>
                    <h3 className="text-base font-black text-slate-900">Other Details</h3>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-slate-900">
                  {/* 1. College Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-900 block">College / University Name</label>
                    <input
                      type="text"
                      value={otherWizardData.collegeName}
                      onChange={(e) => setOtherWizardData(prev => ({ ...prev, collegeName: e.target.value }))}
                      placeholder="e.g. Aligarh Muslim University, Jamia Millia Islamia..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#d91b5c]/20 bg-slate-50/50"
                    />
                  </div>

                  {/* 2. Physical Disability */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <label className="text-xs font-bold text-slate-900 block">Do you have any disability?</label>
                    <div className="flex flex-wrap gap-1.5">
                      {disabilityOpts.map(opt => {
                        const isSel = otherWizardData.disability.toLowerCase() === opt.value.toLowerCase();
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setOtherWizardData(prev => ({ ...prev, disability: opt.value }))}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                              isSel ? 'bg-[#d91b5c] text-white border-[#d91b5c]' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Partner Expectations */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <label className="text-xs font-bold text-slate-900 block">Partner Expectations</label>
                    <textarea
                      rows={3}
                      value={otherWizardData.partnerExpectations}
                      onChange={(e) => setOtherWizardData(prev => ({ ...prev, partnerExpectations: e.target.value }))}
                      placeholder="Describe what qualities, deen, values, and education you are looking for in a partner..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#d91b5c]/20 bg-slate-50/50 resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveOtherWizard}
                  disabled={Boolean(savingField)}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : "Save Other Details"}
                </button>
              </motion.div>
            )}

            {/* 🌟 NATIVE / LOCATION SHEET (Screenshot 3) */}
            {activeSheet === 'location' && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    {locationStep === 'city' ? (
                      <button 
                        type="button" 
                        onClick={() => { setLocationStep('state'); setLocationSearch(''); }} 
                        className="p-1 text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
                        title="Back to States"
                      >
                        <ArrowLeft size={18} />
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        onClick={backToWizardOrClose} 
                        className="p-1 text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    )}
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        {locationStep === 'state' 
                          ? (locationTargetField === 'NativeLocation' ? "Select Native State" : "Select State")
                          : (locationTargetField === 'NativeLocation' ? "Select Native City" : "Select City")}
                      </h3>
                      {locationStep === 'city' && (
                        <p className="text-[11px] font-bold text-[#d91b5c]">
                          State: {(masterData.STATES || []).find(s => s.id === selectedStateId)?.value || 'Selected State'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 🔍 Search Input */}
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder={locationStep === 'state' ? "Search state (e.g. Uttar Pradesh, Delhi)..." : "Search city (e.g. Lucknow, Bareilly)..."}
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d91b5c]/20"
                  />
                </div>

                {/* STEP 1: STATES LIST */}
                {locationStep === 'state' && (
                  <div className="flex-1 overflow-y-auto space-y-1 divide-y divide-slate-100 pr-1">
                    {(masterData.STATES || [])
                      .filter(s => s.value.toLowerCase().includes(locationSearch.toLowerCase()))
                      .map(s => {
                        const isSelected = selectedStateId === Number(s.id);
                        return (
                          <div
                            key={s.id}
                            onClick={() => {
                              setSelectedStateId(Number(s.id));
                              setLocationStep('city');
                              setLocationSearch('');
                            }}
                            className="py-3 px-2 flex items-center justify-between cursor-pointer hover:bg-rose-50/60 rounded-xl transition-colors"
                          >
                            <span className={`text-xs ${isSelected ? 'font-black text-[#d91b5c]' : 'font-medium text-slate-800'}`}>
                              {s.value}
                            </span>
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <span className="text-[10px] text-slate-400 font-bold">Select City</span>
                              <ChevronRight size={15} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* STEP 2: CITIES LIST */}
                {locationStep === 'city' && (
                  <div className="flex-1 overflow-y-auto space-y-1 divide-y divide-slate-100 pr-1">
                    {stateCities
                      .filter(c => c.value.toLowerCase().includes(locationSearch.toLowerCase()))
                      .map(c => {
                        const isSelected = selectedCityId === Number(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => setSelectedCityId(Number(c.id))}
                            className="py-3 px-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 rounded-xl transition-colors"
                          >
                            <span className={`text-xs ${isSelected ? 'font-black text-[#d91b5c]' : 'font-medium text-slate-800'}`}>
                              {c.value}
                            </span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-[#d91b5c]' : 'border-slate-300'
                            }`}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#d91b5c]" />}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {locationStep === 'city' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (openedFromWizard === 'familyWizard') {
                        const stateObj = (masterData.STATES || []).find(s => s.id === selectedStateId);
                        const cityObj = stateCities.find(c => c.id === selectedCityId) || stateCities[0];
                        const sName = stateObj?.value || '';
                        const cName = cityObj?.value || '';
                        setFamilyWizardData(prev => ({
                          ...prev,
                          nativeStateId: selectedStateId,
                          nativeCityId: selectedCityId,
                          nativeLocation: `${cName}, ${sName}`
                        }));
                        setOpenedFromWizard(null);
                        setActiveSheet('familyWizard');
                      } else {
                        handleSaveLocation();
                      }
                    }}
                    disabled={Boolean(savingField) || !selectedCityId}
                    className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#d91b5c]"
                  >
                    {savingField ? <Loader2 size={18} className="animate-spin" /> : (!selectedCityId ? "Please select a city" : (locationTargetField === 'NativeLocation' ? "Update Native Location" : "Update Location"))}
                  </button>
                )}
              </motion.div>
            )}

            {/* 🌟 GENERIC OPTION RADIO SHEET */}
            {activeSheet === 'option' && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-5 shadow-2xl max-h-[80vh] flex flex-col space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={closeSheet} className="p-1 text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer">
                      <X size={18} />
                    </button>
                    <h3 className="text-base font-black text-slate-900">{sheetTitle}</h3>
                  </div>
                </div>

                {sheetOptions.length > 5 && (
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Search option..."
                      value={sheetSearch}
                      onChange={(e) => setSheetSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d91b5c]/20"
                    />
                  </div>
                )}

                <div className="flex-1 overflow-y-auto space-y-1 divide-y divide-slate-100 pr-1">
                  {filteredSheetOptions.map((opt) => {
                    const isSelected = String(opt.id) === String(selectedSheetValue) || opt.value === selectedSheetValue;
                    return (
                      <div
                        key={String(opt.id || opt.value)}
                        onClick={() => setSelectedSheetValue(opt.id)}
                        className="py-3 px-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 rounded-xl"
                      >
                        <div className="space-y-0.5">
                          <span className={`text-xs block ${isSelected ? 'font-black text-[#d91b5c]' : 'font-semibold text-slate-800'}`}>
                            {opt.value}
                          </span>
                          {opt.desc && (
                            <span className="text-[11px] text-slate-400 block">{opt.desc}</span>
                          )}
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-[#d91b5c]' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#d91b5c]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleSaveOption}
                  disabled={Boolean(savingField) || !selectedSheetValue}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#d91b5c]"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : (!selectedSheetValue ? "Select an option" : "Update")}
                </button>
              </motion.div>
            )}

            {/* 🌟 HEIGHT SLIDER SHEET */}
            {activeSheet === 'height' && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-6 shadow-2xl flex flex-col space-y-5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={closeSheet} className="p-1 text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer">
                      <X size={18} />
                    </button>
                    <h3 className="text-base font-black text-slate-900">Select Height</h3>
                  </div>
                </div>

                <div className="py-4 text-center space-y-2">
                  <span className="text-2xl font-black text-[#d91b5c] block">
                    {cmToFtIn(heightCm)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium block">
                    Slide to adjust height accurately
                  </span>
                </div>

                <input 
                  type="range"
                  min={120}
                  max={220}
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#d91b5c]"
                />

                <div className="flex justify-between text-[11px] font-bold text-slate-400 px-1">
                  <span>4ft (120 cm)</span>
                  <span>5ft 7in (170 cm)</span>
                  <span>7ft 2in (220 cm)</span>
                </div>

                <button
                  type="button"
                  onClick={handleSaveHeight}
                  disabled={Boolean(savingField)}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center shrink-0"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : "Save Height"}
                </button>
              </motion.div>
            )}

            {/* 🌟 WEIGHT SLIDER SHEET */}
            {activeSheet === 'weight' && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-6 shadow-2xl flex flex-col space-y-5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={closeSheet} className="p-1 text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer">
                      <X size={18} />
                    </button>
                    <h3 className="text-base font-black text-slate-900">Select Weight</h3>
                  </div>
                </div>

                <div className="py-4 text-center space-y-2">
                  <span className="text-2xl font-black text-[#d91b5c] block">
                    {weightKg} kg
                  </span>
                  <span className="text-xs text-slate-400 font-medium block">
                    Slide to adjust your weight
                  </span>
                </div>

                <input 
                  type="range"
                  min={40}
                  max={140}
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#d91b5c]"
                />

                <div className="flex justify-between text-[11px] font-bold text-slate-400 px-1">
                  <span>40 kg</span>
                  <span>65 kg</span>
                  <span>140 kg</span>
                </div>

                <button
                  type="button"
                  onClick={handleSaveWeight}
                  disabled={Boolean(savingField)}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center shrink-0"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : "Save Weight"}
                </button>
              </motion.div>
            )}

            {/* 🌟 INCOME SLIDER SHEET */}
            {activeSheet === 'income' && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-6 shadow-2xl flex flex-col space-y-5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={closeSheet} className="p-1 text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer">
                      <X size={18} />
                    </button>
                    <h3 className="text-base font-black text-slate-900">Select Annual Income</h3>
                  </div>
                </div>

                <div className="py-4 text-center space-y-2">
                  <span className="text-2xl font-black text-[#d91b5c] block">
                    {INCOME_BRACKETS[incomeIndex]}
                  </span>
                  <span className="text-xs text-slate-400 font-medium block">
                    Select your current approximate annual bracket
                  </span>
                </div>

                <input 
                  type="range"
                  min={0}
                  max={INCOME_BRACKETS.length - 1}
                  value={incomeIndex}
                  onChange={(e) => setIncomeIndex(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#d91b5c]"
                />

                <button
                  type="button"
                  onClick={handleSaveIncome}
                  disabled={Boolean(savingField)}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center shrink-0"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : "Save Income"}
                </button>
              </motion.div>
            )}

            {/* 🌟 TEXT INPUT SHEET */}
            {activeSheet === 'textInput' && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-6 shadow-2xl flex flex-col space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={closeSheet} className="p-1 text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer">
                      <X size={18} />
                    </button>
                    <h3 className="text-base font-black text-slate-900">{textInputData.title}</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-medium">{textInputData.subtitle}</p>

                {textInputData.multiline ? (
                  <textarea
                    rows={4}
                    value={textInputData.value}
                    onChange={(e) => setTextInputData(prev => ({ ...prev, value: e.target.value }))}
                    placeholder={textInputData.placeholder}
                    maxLength={textInputData.maxLength}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#d91b5c]/20"
                  />
                ) : (
                  <input
                    type={textInputData.inputType || 'text'}
                    value={textInputData.value}
                    onChange={(e) => setTextInputData(prev => ({ ...prev, value: e.target.value }))}
                    placeholder={textInputData.placeholder}
                    maxLength={textInputData.maxLength}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#d91b5c]/20"
                  />
                )}

                <button
                  type="button"
                  onClick={handleSaveTextInput}
                  disabled={Boolean(savingField) || !textInputData.value.trim()}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#d91b5c]"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : (!textInputData.value.trim() ? "Cannot be empty" : "Save")}
                </button>
              </motion.div>
            )}

            {/* 🌟 BIO SHEET */}
            {activeSheet === 'bio' && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-6 shadow-2xl flex flex-col space-y-4 max-h-[85vh]"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={closeSheet} className="p-1 text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer">
                      <X size={18} />
                    </button>
                    <h3 className="text-base font-black text-slate-900">About Yourself</h3>
                  </div>
                </div>

                <textarea
                  rows={6}
                  value={bioDraft}
                  onChange={(e) => setBioDraft(e.target.value)}
                  placeholder="Express your values, Islamic lifestyle, interests, career ambitions, and family expectations..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#d91b5c]/20 leading-relaxed"
                />

                <button
                  type="button"
                  onClick={handleSaveBio}
                  disabled={Boolean(savingField) || !bioDraft.trim()}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#d91b5c]"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : (!bioDraft.trim() ? "Bio cannot be empty" : "Update Bio")}
                </button>
              </motion.div>
            )}

            {/* 🌟 MULTI-SELECT SHEET */}
            {activeSheet === 'multiSelect' && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={backToWizardOrClose} className="p-1 text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer">
                      <X size={18} />
                    </button>
                    <div>
                      <h3 className="text-base font-black text-slate-900">{multiSelectTitle}</h3>
                      <p className="text-[11px] text-slate-500 font-medium">{multiSelectSubtitle}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#d91b5c] bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                    {multiSelectItems.length} Selected
                  </span>
                </div>

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

                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search options..."
                    value={multiSelectSearch}
                    onChange={(e) => setMultiSelectSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d91b5c]/20"
                  />
                </div>

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
                </div>

                {multiSelectItems.length === 0 && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200/70">
                    <AlertCircle size={15} className="shrink-0 text-amber-600" />
                    <span>Please select at least 1 option to update.</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSaveMultiSelect}
                  disabled={Boolean(savingField) || multiSelectItems.length === 0}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#d91b5c]"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : (multiSelectItems.length === 0 ? "Select at least 1 item" : "Update")}
                </button>
              </motion.div>
            )}

            {/* 🌟 TRUST BADGE / GOVT ID UPLOAD SHEET */}
            {activeSheet === 'trustBadge' && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-6 shadow-2xl flex flex-col space-y-4 max-h-[85vh]"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={closeSheet} className="p-1 text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer">
                      <X size={18} />
                    </button>
                    <h3 className="text-base font-black text-slate-900">Verify Your Profile</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-medium">
                  Upload an official document (Aadhaar Card, Passport, Driving License) to earn the blue verification trust badge on your profile.
                </p>

                <label className="border-2 border-dashed border-slate-200 hover:border-[#d91b5c] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 flex flex-col items-center justify-center gap-2">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setGovtDocFile(file);
                        setGovtDocPreview(file.name);
                      }
                    }}
                  />
                  <Upload size={28} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">
                    {govtDocPreview ? govtDocPreview : "Click to choose Document File (Max 5MB)"}
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleSubmitGovtDoc}
                  disabled={uploadingGovtDoc || !govtDocFile}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center shrink-0 disabled:opacity-50"
                >
                  {uploadingGovtDoc ? <Loader2 size={18} className="animate-spin" /> : "Submit for Verification"}
                </button>
              </motion.div>
            )}

            {/* 🌟 CHANGE MOBILE VIA OTP SHEET */}
            {activeSheet === 'changeMobile' && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-6 shadow-2xl flex flex-col space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={closeSheet} className="p-1 text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer">
                      <X size={18} />
                    </button>
                    <h3 className="text-base font-black text-slate-900">Change Mobile Number</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">New 10-Digit Mobile Number</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="tel"
                        value={newMobileNumber}
                        onChange={(e) => setNewMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="e.g. 9876543210"
                        className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#d91b5c]/20"
                      />
                      <button
                        type="button"
                        onClick={handleSendMobileOtp}
                        disabled={sendingMobileOtp || newMobileNumber.length !== 10}
                        className="px-4 py-3 bg-[#d91b5c] text-white rounded-xl text-xs font-bold hover:bg-[#b8144b] transition-all disabled:opacity-50 shrink-0"
                      >
                        {sendingMobileOtp ? <Loader2 size={14} className="animate-spin" /> : (mobileOtpSent ? "Resend" : "Send OTP")}
                      </button>
                    </div>
                  </div>

                  {mobileOtpSent && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Enter Verification Code</label>
                      <input
                        type="text"
                        value={mobileOtpCode}
                        onChange={(e) => setMobileOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6-digit OTP"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#d91b5c]/20"
                      />
                    </div>
                  )}
                </div>

                {mobileOtpSent && (
                  <button
                    type="button"
                    onClick={handleVerifyAndUpdateMobile}
                    disabled={verifyingMobileOtp}
                    className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center shrink-0"
                  >
                    {verifyingMobileOtp ? <Loader2 size={18} className="animate-spin" /> : "Verify & Update Number"}
                  </button>
                )}
              </motion.div>
            )}

            {/* 🌟 SIBLINGS COUNTERS SHEET */}
            {activeSheet === 'counters' && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl p-6 shadow-2xl flex flex-col space-y-5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={closeSheet} className="p-1 text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer">
                      <X size={18} />
                    </button>
                    <h3 className="text-base font-black text-slate-900">Siblings Details</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                    <span className="text-xs font-bold text-slate-800">Total Brothers</span>
                    <div className="flex items-center gap-3">
                      <button 
                        type="button" 
                        onClick={() => setCountersState(prev => {
                          const next = Math.max(0, prev.totalBrothers - 1);
                          return { ...prev, totalBrothers: next, marriedBrothers: next === 0 ? 0 : Math.min(prev.marriedBrothers, next) };
                        })}
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-800 font-bold flex items-center justify-center hover:bg-slate-100"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold w-4 text-center">{countersState.totalBrothers}</span>
                      <button 
                        type="button" 
                        onClick={() => setCountersState(prev => ({ ...prev, totalBrothers: prev.totalBrothers + 1 }))}
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-800 font-bold flex items-center justify-center hover:bg-slate-100"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {countersState.totalBrothers > 0 && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                      <span className="text-xs font-bold text-slate-800">Married Brothers</span>
                      <div className="flex items-center gap-3">
                        <button 
                          type="button" 
                          onClick={() => setCountersState(prev => ({ ...prev, marriedBrothers: Math.max(0, prev.marriedBrothers - 1) }))}
                          className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-800 font-bold flex items-center justify-center hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="text-sm font-bold w-4 text-center">{countersState.marriedBrothers}</span>
                        <button 
                          type="button" 
                          onClick={() => setCountersState(prev => ({ ...prev, marriedBrothers: Math.min(prev.totalBrothers, prev.marriedBrothers + 1) }))}
                          className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-800 font-bold flex items-center justify-center hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                    <span className="text-xs font-bold text-slate-800">Total Sisters</span>
                    <div className="flex items-center gap-3">
                      <button 
                        type="button" 
                        onClick={() => setCountersState(prev => {
                          const next = Math.max(0, prev.totalSisters - 1);
                          return { ...prev, totalSisters: next, marriedSisters: next === 0 ? 0 : Math.min(prev.marriedSisters, next) };
                        })}
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-800 font-bold flex items-center justify-center hover:bg-slate-100"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold w-4 text-center">{countersState.totalSisters}</span>
                      <button 
                        type="button" 
                        onClick={() => setCountersState(prev => ({ ...prev, totalSisters: prev.totalSisters + 1 }))}
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-800 font-bold flex items-center justify-center hover:bg-slate-100"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {countersState.totalSisters > 0 && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                      <span className="text-xs font-bold text-slate-800">Married Sisters</span>
                      <div className="flex items-center gap-3">
                        <button 
                          type="button" 
                          onClick={() => setCountersState(prev => ({ ...prev, marriedSisters: Math.max(0, prev.marriedSisters - 1) }))}
                          className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-800 font-bold flex items-center justify-center hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="text-sm font-bold w-4 text-center">{countersState.marriedSisters}</span>
                        <button 
                          type="button" 
                          onClick={() => setCountersState(prev => ({ ...prev, marriedSisters: Math.min(prev.totalSisters, prev.marriedSisters + 1) }))}
                          className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-800 font-bold flex items-center justify-center hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveCounters}
                  disabled={Boolean(savingField)}
                  className="w-full py-3.5 rounded-full bg-[#d91b5c] hover:bg-[#b8144b] text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center shrink-0"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : "Save Siblings"}
                </button>
              </motion.div>
            )}

          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
