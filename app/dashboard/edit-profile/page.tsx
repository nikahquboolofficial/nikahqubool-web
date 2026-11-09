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
  fetchCitiesApi,
  deleteGalleryPhotoApi,
  uploadGalleryPhotoApi,
  setMainPhotoApi,
  updatePhotoPrivacyApi,
  uploadGovtDocumentApi,
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

// 🌟 COMPLETE FALLBACK MASTER DATA (0ms Instant Guarantee)
const FALLBACK_MASTERS: { [key: string]: MasterOption[] } = {
  PROFILE_CREATED_FOR: [
    { id: 1, value: "Self" },
    { id: 2, value: "Son" },
    { id: 3, value: "Daughter" },
    { id: 4, value: "Brother" },
    { id: 5, value: "Sister" },
    { id: 6, value: "Friend / Relative" }
  ],
  MARITAL_STATUS: [
    { id: 1, value: "Never Married" },
    { id: 2, value: "Divorced" },
    { id: 3, value: "Widowed" },
    { id: 4, value: "Awaiting Divorce" },
    { id: 5, value: "Annulled" }
  ],
  SECTS: [
    { id: 1, value: "Sunni" },
    { id: 2, value: "Shia" },
    { id: 3, value: "Ahl-e-Hadith" },
    { id: 4, value: "Other" }
  ],
  MASLAKS: [
    { id: 1, value: "Sunni (Hanafi)" },
    { id: 2, value: "Deobandi" },
    { id: 3, value: "Barelvi" },
    { id: 4, value: "Salafi / Ahle Hadith" },
    { id: 5, value: "Jamaat-e-Islami" },
    { id: 6, value: "Just Muslim / Non-sectarian" },
    { id: 7, value: "Tablighi Jamaat" },
    { id: 8, value: "Other" }
  ],
  CASTES: [
    { id: 1, value: "Ansari" },
    { id: 2, value: "Qureshi" },
    { id: 3, value: "Syed" },
    { id: 4, value: "Sheikh or Shaikh" },
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
  MOTHER_TONGUES: [
    { id: 1, value: "Urdu" },
    { id: 2, value: "Hindi" },
    { id: 3, value: "English" },
    { id: 4, value: "Bengali" },
    { id: 5, value: "Telugu" },
    { id: 6, value: "Marathi" },
    { id: 7, value: "Tamil" },
    { id: 8, value: "Gujarati" },
    { id: 9, value: "Malayalam" },
    { id: 10, value: "Kannada" },
    { id: 11, value: "Odia" },
    { id: 12, value: "Punjabi" },
    { id: 13, value: "Assamese" },
    { id: 14, value: "Kashmiri" },
    { id: 15, value: "Other" }
  ],
  EDUCATIONS: [
    { id: 1, value: "High School" },
    { id: 2, value: "Intermediate / 12th" },
    { id: 3, value: "Diploma" },
    { id: 4, value: "Bachelor of Arts (B.A.)" },
    { id: 5, value: "Bachelor of Commerce (B.Com.)" },
    { id: 6, value: "Bachelor of Science (B.Sc.)" },
    { id: 7, value: "B.Tech / B.E." },
    { id: 8, value: "BBA / BBM" },
    { id: 9, value: "BCA" },
    { id: 10, value: "MBBS / BDS / Medical" },
    { id: 11, value: "LLB / Law" },
    { id: 12, value: "Master of Arts (M.A.)" },
    { id: 13, value: "Master of Commerce (M.Com.)" },
    { id: 14, value: "Master of Science (M.Sc.)" },
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
    { id: 18, value: "Homemaker / Housewife" },
    { id: 19, value: "Retired" },
    { id: 20, value: "Passed Away" },
    { id: 21, value: "Student" },
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
  FAMILY_TYPES: [
    { id: 1, value: "Joint Family" },
    { id: 2, value: "Nuclear Family" },
    { id: 3, value: "Other" }
  ],
  FAMILY_STATUS: [
    { id: 1, value: "Middle Class" },
    { id: 2, value: "Upper Middle Class" },
    { id: 3, value: "High Class / Rich" },
    { id: 4, value: "Affluent / Elite" }
  ],
  COMPLEXION: [
    { id: 1, value: "Very Fair" },
    { id: 2, value: "Fair" },
    { id: 3, value: "Wheatish" },
    { id: 4, value: "Wheatish Medium" },
    { id: 5, value: "Dark / Olive" }
  ],
  HOBBIES: [
    { id: 1, value: "Reading" },
    { id: 2, value: "Photography" },
    { id: 3, value: "Travelling" },
    { id: 4, value: "Cooking & Baking" },
    { id: 5, value: "Music" },
    { id: 6, value: "Gaming" },
    { id: 7, value: "Fitness & Gym" },
    { id: 8, value: "Gardening" },
    { id: 9, value: "Sports" },
    { id: 10, value: "Painting & Sketching" },
    { id: 11, value: "Writing" },
    { id: 12, value: "Watching Movies" },
    { id: 13, value: "Trekking & Hiking" },
    { id: 14, value: "Cycling" },
    { id: 15, value: "Swimming" }
  ],
  INTERESTS: [
    { id: 1, value: "Sufi & Islamic Nasheeds" },
    { id: 2, value: "Classic Ghazals" },
    { id: 3, value: "Instrumental & Acoustic" },
    { id: 4, value: "Bollywood Classics" },
    { id: 5, value: "Poetry & Shayari" },
    { id: 6, value: "Coding & Tech" },
    { id: 7, value: "Entrepreneurship" },
    { id: 8, value: "Social Work & Charity" },
    { id: 9, value: "Fashion & Styling" },
    { id: 10, value: "Interior Design" },
    { id: 11, value: "Nature & Wildlife" },
    { id: 12, value: "Astronomy & Science" },
    { id: 13, value: "History & Culture" },
    { id: 14, value: "Content Creation" },
    { id: 15, value: "Finance & Investing" }
  ],
  SPORTS: [
    { id: 1, value: "Cricket" },
    { id: 2, value: "Football / Soccer" },
    { id: 3, value: "Badminton" },
    { id: 4, value: "Swimming" },
    { id: 5, value: "Fitness / Gym" },
    { id: 6, value: "Running / Jogging" },
    { id: 7, value: "Cycling" },
    { id: 8, value: "Table Tennis" },
    { id: 9, value: "Lawn Tennis" },
    { id: 10, value: "Basketball" },
    { id: 11, value: "Volleyball" },
    { id: 12, value: "Martial Arts / Boxing" },
    { id: 13, value: "Snooker / Pool" },
    { id: 14, value: "Chess" },
    { id: 15, value: "Yoga & Calisthenics" }
  ],
  LANGUAGES: [
    { id: 1, value: "Urdu" },
    { id: 2, value: "English" },
    { id: 3, value: "Hindi" },
    { id: 4, value: "Arabic" },
    { id: 5, value: "Bengali" },
    { id: 6, value: "Telugu" },
    { id: 7, value: "Marathi" },
    { id: 8, value: "Tamil" },
    { id: 9, value: "Gujarati" },
    { id: 10, value: "Malayalam" },
    { id: 11, value: "Punjabi" },
    { id: 12, value: "Kashmiri" },
    { id: 13, value: "Persian / Farsi" },
    { id: 14, value: "Turkish" },
    { id: 15, value: "French" },
    { id: 16, value: "German" }
  ]
};

export default function EditMyProfilePage() {
  const router = useRouter();

  // Loading & Saving States
  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState<string | null>(null);

  // Dynamic Master Data Cache initialized with FALLBACK_MASTERS so options ALWAYS bind instantly!
  const [masterData, setMasterData] = useState<{ [key: string]: MasterOption[] }>(FALLBACK_MASTERS);
  const [stateCities, setStateCities] = useState<MasterOption[]>([]);

  // 🌟 GUARANTEED TEXT RESOLVER: NEVER SHOW A NUMERIC ID ON SCREEN!
  const getMasterLabel = useCallback((type: string, val: any): string => {
    if (val === null || val === undefined || val === '') return '';
    const strVal = String(val).trim();
    const list = masterData[type] || FALLBACK_MASTERS[type] || [];
    
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

  // Profile Data State
  const [formData, setFormData] = useState<any>({
    UserId: 0,
    FullName: '',
    ProfileCreatedFor: 1,
    Age: 25,
    Gender: 'Female',
    DateOfBirth: '',
    MaritalStatus: 1,
    Sect: 1,
    Height: `5ft 7in (170 cm)`,
    Weight: '60 kg',
    Complexion: 2,
    Caste: 4,
    Maslak: 1,
    MotherTongue: 1,
    Location: 'Bareilly, Uttar Pradesh, India',
    CurrentStateId: 14,
    CurrentCityId: 1,
    StateName: 'Uttar Pradesh',
    CityName: 'Bareilly',
    Disability: 'No',

    // Education & Career
    Education: 5,
    CollegeName: 'Regional College Of Professional Studies & Research',
    EmployedIn: 1,
    Occupation: 1,
    OccupationDetails: '',
    AnnualIncome: '₹5 - 7 Lakhs',

    // Family Details
    FamilyLocation: 'Bareilly, Uttar Pradesh, India',
    FamilyType: 1,
    FamilyStatus: 2,
    NativeLocation: 'Bareilly, Uttar Pradesh, India',
    NativePlaceStateId: 14,
    NativePlaceCityId: 1,
    FatherName: '',
    FatherOccupation: 4,
    MotherName: '',
    MotherOccupation: 18,
    TotalBrothers: 1,
    MarriedBrothers: 0,
    TotalSisters: 2,
    MarriedSisters: 1,
    FamilyAbout: '',

    // Contact Details
    MobileNumber: '',
    Email: '',
    WhatsAppNumber: '',

    // Religious Details
    NamazHabit: 'Always (5 Times Daily)',
    QuranReading: 'Daily Recitation',
    RozaHabit: 'All 30 Days in Ramadan',
    HijabOrBeard: 'Hijab',
    ZakatHabit: 'Pay Regularly Every Year',
    HajjUmrah: 'Planning Soon Insha\'Allah',

    // Lifestyle & Interest
    DietType: 'Halal Only',
    SmokeHabit: 'Never',
    DrinkHabit: 'Never',
    LanguagesKnown: 'Urdu, English, Hindi',
    CanCook: 'Yes',
    Sports: 'Badminton, Swimming',
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
          'LANGUAGES'
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
          ...FALLBACK_MASTERS,
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
          const incStr = p.annualIncome || p.AnnualIncome || '₹5 - 7 Lakhs';
          const matchedIncIdx = INCOME_BRACKETS.findIndex(b => b.toLowerCase().replace(/[^a-z0-9]/g, '') === incStr.toLowerCase().replace(/[^a-z0-9]/g, ''));
          if (matchedIncIdx >= 0) {
            setIncomeIndex(matchedIncIdx);
          }

          setFormData((prev: any) => ({
            ...prev,
            UserId: p.userId || p.UserId || 0,
            FullName: resolvedName,
            ProfileCreatedFor: p.profileCreatedForId || p.profileCreatedFor || prev.ProfileCreatedFor,
            Age: p.age || prev.Age,
            Gender: p.gender || p.Gender || prev.Gender,
            DateOfBirth: p.dateOfBirth || prev.DateOfBirth,
            MaritalStatus: p.maritalStatusId || p.maritalStatus || prev.MaritalStatus,
            Sect: p.sectId || p.sect || prev.Sect,
            Height: p.height || p.Height || prev.Height,
            Weight: p.weight || p.Weight || prev.Weight,
            Complexion: p.complexionId || p.complexion || prev.Complexion,
            Caste: p.casteId || p.caste || prev.Caste,
            Maslak: p.maslakId || p.maslak || prev.Maslak,
            MotherTongue: p.motherTongueId || p.motherTongue || prev.MotherTongue,
            Location: `${p.currentCityName || p.cityName || 'Bareilly'}, ${p.currentStateName || p.stateName || 'Uttar Pradesh'}, India`,
            CurrentStateId: p.currentStateId || prev.CurrentStateId,
            CurrentCityId: p.currentCityId || prev.CurrentCityId,
            StateName: p.currentStateName || p.stateName || prev.StateName,
            CityName: p.currentCityName || p.cityName || prev.CityName,
            Disability: p.disability || prev.Disability || 'No',

            // Education & Career
            Education: p.highestDegreeId || p.highestDegree || prev.Education,
            CollegeName: p.collegeName || prev.CollegeName,
            EmployedIn: p.employmentSectorId || p.employmentSector || prev.EmployedIn,
            Occupation: p.designationId || p.designation || prev.Occupation,
            OccupationDetails: p.occupationDetails || prev.OccupationDetails,
            AnnualIncome: incStr,

            // Family
            FamilyLocation: p.familyCityName ? `${p.familyCityName}, ${p.familyStateName || ''}, India` : prev.FamilyLocation,
            FamilyType: p.familyTypeId || p.familyType || prev.FamilyType,
            FamilyStatus: p.familyStatusId || p.familyStatus || prev.FamilyStatus,
            NativeLocation: p.nativeCityName ? `${p.nativeCityName}, ${p.nativeStateName || ''}, India` : (p.familyCityName ? `${p.familyCityName}, ${p.familyStateName || ''}, India` : prev.NativeLocation),
            NativePlaceStateId: p.nativePlaceStateId || prev.NativePlaceStateId,
            NativePlaceCityId: p.nativePlaceCityId || prev.NativePlaceCityId,
            FatherName: p.fatherName || p.FatherName || prev.FatherName,
            FatherOccupation: p.fatherOccupationId || p.fatherOccupation || prev.FatherOccupation,
            MotherName: p.motherName || p.MotherName || prev.MotherName,
            MotherOccupation: p.motherOccupationId || p.motherOccupation || prev.MotherOccupation,
            TotalBrothers: p.totalBrothers !== undefined ? Number(p.totalBrothers) : prev.TotalBrothers,
            MarriedBrothers: p.marriedBrothers !== undefined ? Number(p.marriedBrothers) : prev.MarriedBrothers,
            TotalSisters: p.totalSisters !== undefined ? Number(p.totalSisters) : prev.TotalSisters,
            MarriedSisters: p.marriedSisters !== undefined ? Number(p.marriedSisters) : prev.MarriedSisters,
            FamilyAbout: p.familyAbout || prev.FamilyAbout,

            // Contact Details
            MobileNumber: p.mobileNumber || p.MobileNumber || prev.MobileNumber || '',
            Email: p.email || p.Email || prev.Email || '',
            WhatsAppNumber: p.whatsAppNumber || p.WhatsAppNumber || p.waliContactNumber || p.WaliContactNumber || prev.WhatsAppNumber || '',

            // Religious Details
            NamazHabit: p.namazHabit || p.NamazHabit || prev.NamazHabit,
            QuranReading: p.quranReading || p.QuranReading || prev.QuranReading,
            RozaHabit: p.rozaHabit || p.RozaHabit || prev.RozaHabit,
            HijabOrBeard: p.hijabOrBeard || p.HijabOrBeard || prev.HijabOrBeard,
            ZakatHabit: p.zakatHabit || p.ZakatHabit || prev.ZakatHabit,
            HajjUmrah: p.hajjUmrah || p.HajjUmrah || prev.HajjUmrah,

            // Lifestyle & Interest
            DietType: p.dietType || prev.DietType,
            SmokeHabit: p.smokeHabit || prev.SmokeHabit,
            DrinkHabit: p.drinkHabit || prev.DrinkHabit,
            LanguagesKnown: p.languagesKnown || p.LanguagesKnown || prev.LanguagesKnown,
            CanCook: p.canCook ? 'Yes' : (p.canCook === false ? 'No' : prev.CanCook),
            Sports: p.sports || p.Sports || prev.Sports,
            Hobbies: p.hobbies || prev.Hobbies,
            Interests: p.interests || prev.Interests,

            // Bio & Trust
            AboutMe: p.aboutMe || p.bio || '',
            PartnerExpectations: p.partnerExpectations || prev.PartnerExpectations,
            IsGovtIdVerified: Boolean(p.isGovtIdVerified || p.isVerified),
            GovtIdDocUrl: p.govtIdDocUrl || '',
            PhotoPrivacy: p.photoPrivacy || 'All Members',
          }));

          // Photos
          if (Array.isArray(g) && g.length > 0) {
            setPhotos(g.map((item: any, idx: number) => ({
              photoId: item.photoId || item.PhotoId || idx + 1,
              photoUrl: item.photoUrl || item.PhotoUrl,
              isMain: Boolean(item.isMain ?? item.IsMain ?? (idx === 0)),
              privacy: item.privacy || item.Privacy || 'All Members',
            })));
          } else if (p.photoUrl || p.mainPhotoUrl) {
            setPhotos([{
              photoId: 1,
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
          setSelectedCityId(list[0].id);
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
      if (res.success || res.Success === 1) {
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
    let available: MasterOption[] = masterData.HOBBIES || FALLBACK_MASTERS.HOBBIES;

    if (key === 'Interests') {
      title = 'Select Music & Interests';
      subtitle = 'Pick genres, melodies, and personal passions';
      available = masterData.INTERESTS || FALLBACK_MASTERS.INTERESTS;
    } else if (key === 'Sports') {
      title = 'Select Sports & Fitness';
      subtitle = 'Choose sports and physical activities you participate in';
      available = masterData.SPORTS || FALLBACK_MASTERS.SPORTS;
    } else if (key === 'LanguagesKnown') {
      title = 'Languages You Know';
      subtitle = 'Select all languages you speak or understand fluently';
      available = masterData.LANGUAGES || FALLBACK_MASTERS.LANGUAGES;
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
      if (res.success || res.Success === 1) {
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
      const res = await uploadGalleryPhotoApi(file, isMainSlot, token);

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
        if (index === 0 && remaining.length > 0) {
          const nextPhotoId = Number(remaining[0].photoId || remaining[0].PhotoId || 0);
          if (nextPhotoId > 0) {
            await setMainPhotoApi(nextPhotoId, token);
          }
        }
        const delRes = await deleteGalleryPhotoApi(photoId, token);
        if (!delRes.success && remaining.length === 0) {
          const fd = new FormData();
          fd.append("UserId", String(formData.UserId || 0));
          fd.append("PhotoUrl", "");
          await updateProfileApi(fd, token);
        }
      } else {
        if (remaining.length === 0) {
          const fd = new FormData();
          fd.append("UserId", String(formData.UserId || 0));
          fd.append("PhotoUrl", "");
          await updateProfileApi(fd, token);
        }
      }

      setPhotos(remaining);

      // Sync user session photo: first photo (slot 1) is always the main/avatar photo!
      if (remaining.length > 0) {
        const firstPhotoUrl = remaining[0].photoUrl || remaining[0].PhotoUrl || '';
        if (firstPhotoUrl) {
          syncUserProfilePhoto(firstPhotoUrl);
          setFormData(prev => ({ ...prev, PhotoUrl: firstPhotoUrl }));
        }
      } else {
        syncUserProfilePhoto('');
        setFormData(prev => ({ ...prev, PhotoUrl: '' }));
      }
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
      const res = await uploadGovtDocumentApi(govtDocFile, token);
      if (res.success || res.Success === 1) {
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
  const educationOpts = masterData.EDUCATIONS || FALLBACK_MASTERS.EDUCATIONS;
  const casteOpts = masterData.CASTES || FALLBACK_MASTERS.CASTES;
  const maslakOpts = masterData.MASLAKS || FALLBACK_MASTERS.MASLAKS;
  const languageOpts = masterData.MOTHER_TONGUES || FALLBACK_MASTERS.MOTHER_TONGUES;
  const occupationOpts = masterData.OCCUPATIONS || FALLBACK_MASTERS.OCCUPATIONS;
  const employedInOpts = masterData.EMPLOYMENT_SECTORS || FALLBACK_MASTERS.EMPLOYMENT_SECTORS;
  const familyTypeOpts = masterData.FAMILY_TYPES || FALLBACK_MASTERS.FAMILY_TYPES;
  const familyStatusOpts = masterData.FAMILY_STATUS || FALLBACK_MASTERS.FAMILY_STATUS;
  const profileCreatedForOpts = masterData.PROFILE_CREATED_FOR || FALLBACK_MASTERS.PROFILE_CREATED_FOR;
  const maritalStatusOpts = masterData.MARITAL_STATUS || FALLBACK_MASTERS.MARITAL_STATUS;
  const sectOpts = masterData.SECTS || FALLBACK_MASTERS.SECTS;

  const disabilityOpts = [
    { id: 'No', value: 'No' },
    { id: 'Yes', value: 'Yes' },
    { id: 'Physically Challenged', value: 'Physically Challenged' }
  ];

  const namazOpts = [
    { id: 'Always (5 Times Daily)', value: 'Always (5 Times Daily)' },
    { id: 'During Ramadan / Friday Only', value: 'During Ramadan / Friday Only' },
    { id: 'Sometimes', value: 'Sometimes' },
    { id: 'Trying to be Regular', value: 'Trying to be Regular' }
  ];

  const quranOpts = [
    { id: 'Daily Recitation', value: 'Daily Recitation' },
    { id: 'Learning / Reciting with Translation', value: 'Learning / Reciting with Translation' },
    { id: 'Frequently', value: 'Frequently' },
    { id: 'During Ramadan', value: 'During Ramadan' },
    { id: 'Completed Hafiz / Qari', value: 'Completed Hafiz / Qari' }
  ];

  const rozaOpts = [
    { id: 'All 30 Days in Ramadan', value: 'All 30 Days in Ramadan' },
    { id: 'Most Days in Ramadan', value: 'Most Days in Ramadan' },
    { id: 'Only Fridays / Special Days', value: 'Only Fridays / Special Days' },
    { id: 'Medical Exemption', value: 'Medical Exemption' }
  ];

  const hijabOpts = [
    { id: 'Hijab', value: 'Hijab' },
    { id: 'Niqab', value: 'Niqab' },
    { id: 'Sunnah Beard', value: 'Sunnah Beard' },
    { id: 'Modest Dress / Clean Shaved', value: 'Modest Dress / Clean Shaved' }
  ];

  const zakatOpts = [
    { id: 'Pay Regularly Every Year', value: 'Pay Regularly Every Year' },
    { id: 'Not Eligible / Dependent', value: 'Not Eligible / Dependent' },
    { id: 'Pay Voluntarily / Charity', value: 'Pay Voluntarily / Charity' }
  ];

  const hajjOpts = [
    { id: 'Performed Hajj & Umrah', value: 'Performed Hajj & Umrah' },
    { id: 'Performed Umrah', value: 'Performed Umrah' },
    { id: 'Planning Soon Insha\'Allah', value: 'Planning Soon Insha\'Allah' },
    { id: 'Not Yet Performed', value: 'Not Yet Performed' }
  ];

  const dietOpts = [
    { id: 'Halal Only', value: 'Halal Only' },
    { id: 'Non-Vegetarian', value: 'Non-Vegetarian' },
    { id: 'Vegetarian', value: 'Vegetarian' },
    { id: 'Eggetarian', value: 'Eggetarian' }
  ];

  const habitOpts = [
    { id: 'Never', value: 'Never' },
    { id: 'Occasionally', value: 'Occasionally' },
    { id: 'No', value: 'No' }
  ];

  const cookOpts = [
    { id: 'Yes', value: 'Yes' },
    { id: 'No', value: 'No' },
    { id: 'Learning', value: 'Learning' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center space-y-3">
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
    <div className="min-h-screen bg-[#FBF9F7] text-slate-900 pb-28 font-sans selection:bg-[#d91b5c] selection:text-white">
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
        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-[#FFF9F2] border border-amber-200/60 shadow-xs">
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
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFF3D6] text-[#8C6000]">
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
              className="pt-2 border-t border-slate-100 flex items-center justify-between cursor-pointer hover:opacity-85 transition-opacity"
            >
              <div>
                <span className="text-xs font-semibold text-slate-700 block">Control who sees your photo</span>
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
            <p className="text-xs text-slate-700 leading-relaxed font-normal line-clamp-3">
              {formData.AboutMe || "Alhamdulillah, we are a well-established and educated family rooted in strong moral values. We prefer a simple, meaningful, and dignified Nikah ceremony built on mutual understanding and respect, rather than customary demands. We seek a compatible and understanding partner from a similar cultural background."}
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
            {/* 1. Name */}
            <div 
              onClick={() => openTextInputSheet(
                "Name", 
                "Update your full name", 
                "FullName", 
                formData.FullName, 
                "Enter full name",
                80
              )}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Name</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.FullName || "Add Name"}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 2. Profile Created For */}
            <div 
              onClick={() => openOptionSheet('Profile Created for', 'ProfileCreatedFor', formData.ProfileCreatedFor, profileCreatedForOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Profile Created for</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{getMasterLabel('PROFILE_CREATED_FOR', formData.ProfileCreatedFor)}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 3. Age and Gender */}
            <div 
              onClick={openDobPickerSheet}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Age and Gender</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.Age}, {formData.Gender}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 4. Date of Birth */}
            <div 
              onClick={openDobPickerSheet}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Date of Birth</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                  {formData.DateOfBirth ? new Date(formData.DateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : `${formData.Age} Years`}
                </span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 5. Marital Status */}
            <div 
              onClick={() => openOptionSheet('Marital Status', 'MaritalStatus', formData.MaritalStatus, maritalStatusOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Marital Status</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{getMasterLabel('MARITAL_STATUS', formData.MaritalStatus)}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 6. Sect */}
            <div 
              onClick={() => openOptionSheet('Sect', 'Sect', formData.Sect, sectOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Sect</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{getMasterLabel('SECTS', formData.Sect)}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 7. Caste */}
            <div 
              onClick={() => openOptionSheet('Select caste', 'Caste', formData.Caste, casteOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Caste</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{getMasterLabel('CASTES', formData.Caste)}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 8. Height */}
            <div 
              onClick={openHeightSheet}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Height</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.Height}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 9. Maslak */}
            <div 
              onClick={() => openOptionSheet('Select Maslak', 'Maslak', formData.Maslak, maslakOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Maslak</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{getMasterLabel('MASLAKS', formData.Maslak)}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 10. Mother Tongue */}
            <div 
              onClick={() => openOptionSheet('Select Mother Tongue', 'MotherTongue', formData.MotherTongue, languageOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Mother Tongue</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{getMasterLabel('MOTHER_TONGUES', formData.MotherTongue)}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 11. Location */}
            <div 
              onClick={() => openLocationSheet('Location')}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Location</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.Location}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 12. Disability */}
            <div 
              onClick={() => openOptionSheet('Disability', 'Disability', formData.Disability, disabilityOpts)}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Disability</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.Disability}</span>
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{getMasterLabel('EDUCATIONS', formData.Education)}</span>
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.CollegeName || "Add College Name"}</span>
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{getMasterLabel('EMPLOYMENT_SECTORS', formData.EmployedIn)}</span>
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{getMasterLabel('OCCUPATIONS', formData.Occupation)}</span>
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.AnnualIncome}</span>
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.FamilyLocation}</span>
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{getMasterLabel('FAMILY_TYPES', formData.FamilyType)}</span>
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{getMasterLabel('FAMILY_STATUS', formData.FamilyStatus)}</span>
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.NativeLocation}</span>
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{getMasterLabel('OCCUPATIONS', formData.FatherOccupation) || "Select Occupation"}</span>
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{getMasterLabel('OCCUPATIONS', formData.MotherOccupation) || "Select Occupation"}</span>
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
            {/* 1. Phone Number */}
            <div 
              onClick={() => openTextInputSheet(
                "Phone Number",
                "Enter registered mobile contact number",
                "MobileNumber",
                formData.MobileNumber,
                "e.g. +91 9876543210",
                20,
                false,
                "tel"
              )}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Phone Number</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.MobileNumber || "Add Mobile Number"}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 2. Email */}
            <div 
              onClick={() => openTextInputSheet(
                "Email Address",
                "Enter valid contact email address",
                "Email",
                formData.Email,
                "e.g. candidate@example.com",
                80,
                false,
                "email"
              )}
              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-900 block">Email</span>
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.Email || "Add Email Address"}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.NamazHabit}</span>
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.QuranReading || "Select Reading Routine"}</span>
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.RozaHabit || "Select Fasting Routine"}</span>
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.HijabOrBeard}</span>
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.ZakatHabit || "Select Zakat Practice"}</span>
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.HajjUmrah || "Select Pilgrimage Status"}</span>
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.DietType}</span>
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.SmokeHabit}</span>
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.DrinkHabit}</span>
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block truncate">
                  {formData.LanguagesKnown || "Select languages"}
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block">{formData.CanCook}</span>
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block truncate">
                  {formData.Sports || "Select sports"}
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block truncate">
                  {formData.Hobbies || "Select hobbies"}
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
                <span className="text-xs text-slate-500 font-medium mt-0.5 block truncate">
                  {formData.Interests || "Select music & interests"}
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
                      {Array.from({ length: 48 }, (_, i) => 2008 - i).map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
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
                  {[
                    { id: 'All Members', title: 'All Members', desc: 'Visible to everyone' },
                    { id: 'Premium Members', title: 'Premium Members', desc: 'Blurred for free users' },
                    { id: 'Members I Approve', title: 'Members I Approve', desc: 'Blurred until you approve' },
                  ].map((item) => {
                    const isSelected = formData.PhotoPrivacy === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedSheetValue(item.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected ? 'border-[#d91b5c]' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-black text-slate-900">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-[#d91b5c]' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#d91b5c]" />}
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
