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
  BookOpen, Smile
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
  ]
};

export default function EditMyProfilePage() {
  const router = useRouter();

  // Loading & Saving States
  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState<string | null>(null);

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
    ProfileCreatedFor: 'Self',
    Age: 25,
    Gender: 'Female',
    DateOfBirth: '',
    MaritalStatus: 'Never Married',
    Sect: 'Sunni',
    Height: `5ft 7in (170 cm)`,
    Weight: '60 kg',
    Complexion: 'Fair',
    ComplexionId: 2,
    Caste: 'Sheikh or Shaikh',
    CasteId: 4,
    Maslak: 'Sunni (Hanafi)',
    MaslakId: 1,
    MotherTongue: 'Urdu',
    MotherTongueId: 1,
    Location: 'Bareilly, Uttar Pradesh, India',
    CurrentStateId: 14,
    CurrentCityId: 1,
    StateName: 'Uttar Pradesh',
    CityName: 'Bareilly',
    Disability: 'No',

    // Education & Career
    Education: 'B.Com.',
    EducationId: 5,
    CollegeName: 'Regional College Of Professional Studies & Research',
    EmployedIn: 'Private Sector',
    EmployedInId: 1,
    Occupation: 'Software Professional',
    OccupationId: 1,
    OccupationDetails: '',
    AnnualIncome: '5 - 7 Lakh',

    // Family Details
    FamilyLocation: 'Bareilly, Uttar Pradesh, India',
    FamilyType: 'Joint Family',
    FamilyValues: 'Traditional & Religious',
    FamilyStatus: 'Upper Middle Class',
    FatherOccupation: 'Business Owner / Entrepreneur',
    FatherOccupationId: 4,
    MotherOccupation: 'Homemaker / Housewife',
    MotherOccupationId: 18,
    TotalBrothers: 1,
    MarriedBrothers: 0,
    TotalSisters: 2,
    MarriedSisters: 1,
    FamilyAbout: '',

    // Religious & Lifestyle
    NamazHabit: 'Always (5 Times Daily)',
    HijabOrBeard: 'Hijab',
    DietType: 'Halal Only',
    SmokeHabit: 'Never',
    DrinkHabit: 'Never',
    CanCook: 'Yes',
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

  // Dynamic Master Data Cache initialized with FALLBACK_MASTERS so options ALWAYS bind instantly!
  const [masterData, setMasterData] = useState<{ [key: string]: MasterOption[] }>(FALLBACK_MASTERS);
  const [stateCities, setStateCities] = useState<MasterOption[]>([]);

  // Active Bottom Sheet / Subscreen
  // 'bio' | 'height' | 'option' | 'location' | 'textInput' | 'counters' | 'photoPrivacy' | 'trustBadge' | null
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
  }>({
    title: '',
    subtitle: '',
    fieldKey: '',
    value: '',
    placeholder: '',
    maxLength: 120,
    multiline: false,
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

  // Bio Substate
  const [bioDraft, setBioDraft] = useState('');

  // Location Substate
  const [selectedStateId, setSelectedStateId] = useState<number>(14);
  const [selectedCityId, setSelectedCityId] = useState<number>(1);
  const [locationTargetField, setLocationTargetField] = useState<'Location' | 'FamilyLocation'>('Location');

  // Trust Badge Substate
  const [govtDocFile, setGovtDocFile] = useState<File | null>(null);
  const [govtDocPreview, setGovtDocPreview] = useState<string>('');
  const [uploadingGovtDoc, setUploadingGovtDoc] = useState(false);

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
          'COMPLEXION'
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

          // Robust Name resolver: Never allow blank!
          let resolvedName = p.fullName || p.FullName || p.name || p.Name;
          if (!resolvedName || String(resolvedName).trim() === '' || resolvedName === 'User') {
            resolvedName = getInitialFullName() || 'Candidate Profile';
          }

          setFormData((prev: any) => ({
            ...prev,
            UserId: p.userId || p.UserId || 0,
            FullName: resolvedName,
            ProfileCreatedFor: p.profileCreatedForName || p.profileCreatedFor || prev.ProfileCreatedFor,
            Age: p.age || prev.Age,
            Gender: p.gender || p.Gender || prev.Gender,
            DateOfBirth: p.dateOfBirth || prev.DateOfBirth,
            MaritalStatus: p.maritalStatusName || p.maritalStatus || prev.MaritalStatus,
            Sect: p.sectName || p.sect || prev.Sect,
            Height: p.height || p.Height || prev.Height,
            Weight: p.weight || p.Weight || prev.Weight,
            Complexion: p.complexionName || p.complexion || prev.Complexion,
            ComplexionId: p.complexionId || prev.ComplexionId,
            Caste: p.casteName || p.caste || prev.Caste,
            CasteId: p.casteId || prev.CasteId,
            Maslak: p.maslakName || p.maslak || prev.Maslak,
            MaslakId: p.maslakId || prev.MaslakId,
            MotherTongue: p.motherTongueName || p.motherTongue || prev.MotherTongue,
            MotherTongueId: p.motherTongueId || prev.MotherTongueId,
            Location: `${p.currentCityName || p.cityName || 'Bareilly'}, ${p.currentStateName || p.stateName || 'Uttar Pradesh'}, India`,
            CurrentStateId: p.currentStateId || prev.CurrentStateId,
            CurrentCityId: p.currentCityId || prev.CurrentCityId,
            StateName: p.currentStateName || p.stateName || prev.StateName,
            CityName: p.currentCityName || p.cityName || prev.CityName,
            Disability: p.disability || prev.Disability,

            // Education & Career
            Education: p.highestDegreeName || p.highestDegree || p.education || prev.Education,
            EducationId: p.highestDegree || prev.EducationId,
            CollegeName: p.collegeName || prev.CollegeName,
            EmployedIn: p.employmentSectorName || p.employmentSector || p.employedIn || prev.EmployedIn,
            EmployedInId: p.employmentSector || prev.EmployedInId,
            Occupation: p.designationName || p.designation || p.occupation || prev.Occupation,
            OccupationId: p.designation || prev.OccupationId,
            OccupationDetails: p.occupationDetails || prev.OccupationDetails,
            AnnualIncome: p.annualIncome || prev.AnnualIncome,

            // Family
            FamilyLocation: p.familyCityName ? `${p.familyCityName}, ${p.familyStateName || ''}, India` : prev.FamilyLocation,
            FamilyType: p.familyTypeName || p.familyType || prev.FamilyType,
            FamilyValues: p.familyValuesName || p.familyValues || prev.FamilyValues,
            FamilyStatus: p.familyStatusName || p.familyStatus || prev.FamilyStatus,
            FatherOccupation: p.fatherOccupationName || p.fatherOccupation || prev.FatherOccupation,
            FatherOccupationId: p.fatherOccupationId || prev.FatherOccupationId,
            MotherOccupation: p.motherOccupationName || p.motherOccupation || prev.MotherOccupation,
            MotherOccupationId: p.motherOccupationId || prev.MotherOccupationId,
            TotalBrothers: p.totalBrothers !== undefined ? Number(p.totalBrothers) : prev.TotalBrothers,
            MarriedBrothers: p.marriedBrothers !== undefined ? Number(p.marriedBrothers) : prev.MarriedBrothers,
            TotalSisters: p.totalSisters !== undefined ? Number(p.totalSisters) : prev.TotalSisters,
            MarriedSisters: p.marriedSisters !== undefined ? Number(p.marriedSisters) : prev.MarriedSisters,
            FamilyAbout: p.familyAbout || prev.FamilyAbout,

            // Religious & Lifestyle
            NamazHabit: p.namazHabit || prev.NamazHabit,
            HijabOrBeard: p.hijabOrBeard || prev.HijabOrBeard,
            DietType: p.dietType || prev.DietType,
            SmokeHabit: p.smokeHabit || prev.SmokeHabit,
            DrinkHabit: p.drinkHabit || prev.DrinkHabit,
            CanCook: p.canCook ? 'Yes' : (p.canCook === false ? 'No' : prev.CanCook),
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

  // Save specific field via API
  const saveFieldValue = async (field: string, value: any, extraData: any = {}) => {
    const token = getAuthToken();
    if (!token) return;

    setSavingField(field);

    try {
      const fd = new FormData();
      fd.append("UserId", String(formData.UserId || 0));
      fd.append(field, String(value));

      Object.entries(extraData).forEach(([k, v]) => {
        fd.append(k, String(v));
      });

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

        toast.success("Updated successfully!");
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
    currentVal: any, 
    options: Array<{ id: any; value: string; desc?: string }>
  ) => {
    setSheetTitle(title);
    setSheetFieldKey(fieldKey);
    setSelectedSheetValue(currentVal);
    setSheetOptions(options);
    setSheetSearch('');
    setActiveSheet('option');
  };

  // Open In-App Text Input Sheet
  const openTextInputSheet = (
    title: string,
    subtitle: string,
    fieldKey: string,
    currentVal: string,
    placeholder: string,
    maxLength: number = 120,
    multiline: boolean = false
  ) => {
    setTextInputData({
      title,
      subtitle,
      fieldKey,
      value: currentVal || '',
      placeholder,
      maxLength,
      multiline,
    });
    setActiveSheet('textInput');
  };

  // Save Text Input Sheet
  const handleSaveTextInput = () => {
    const trimmed = textInputData.value.trim();
    if (textInputData.fieldKey === 'FullName' && !trimmed) {
      toast.error("Full Name cannot be empty.");
      return;
    }
    saveFieldValue(textInputData.fieldKey, trimmed);
  };

  // Open Sibling Counters Sheet
  const openCountersSheet = () => {
    setCountersState({
      totalBrothers: Number(formData.TotalBrothers) || 0,
      marriedBrothers: Number(formData.MarriedBrothers) || 0,
      totalSisters: Number(formData.TotalSisters) || 0,
      marriedSisters: Number(formData.MarriedSisters) || 0,
    });
    setActiveSheet('counters');
  };

  // Save Sibling Counters
  const handleSaveCounters = () => {
    saveFieldValue('TotalBrothers', countersState.totalBrothers, {
      MarriedBrothers: countersState.marriedBrothers,
      TotalSisters: countersState.totalSisters,
      MarriedSisters: countersState.marriedSisters,
    });
  };

  // Open Height Slider Sheet
  const openHeightSheet = () => {
    setHeightCm(parseHeightToCm(formData.Height));
    setActiveSheet('height');
  };

  // Open Bio Edit Sheet
  const openBioSheet = () => {
    setBioDraft(formData.AboutMe || '');
    setActiveSheet('bio');
  };

  // Open Location Sheet
  const openLocationSheet = (target: 'Location' | 'FamilyLocation' = 'Location') => {
    setLocationTargetField(target);
    setSelectedStateId(formData.CurrentStateId || 14);
    setSelectedCityId(formData.CurrentCityId || 1);
    setActiveSheet('location');
  };

  // Save Height
  const handleSaveHeight = () => {
    const formatted = cmToFtIn(heightCm);
    saveFieldValue('Height', formatted);
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
    const selectedObj = sheetOptions.find(o => o.id === selectedSheetValue || o.value === selectedSheetValue);
    if (!selectedObj) {
      setActiveSheet(null);
      return;
    }

    if (sheetFieldKey === 'Education') {
      saveFieldValue('HighestDegree', selectedObj.id, { Education: selectedObj.value, EducationId: selectedObj.id });
    } else if (sheetFieldKey === 'EmployedIn') {
      saveFieldValue('EmploymentSector', selectedObj.id, { EmployedIn: selectedObj.value, EmployedInId: selectedObj.id });
    } else if (sheetFieldKey === 'Occupation') {
      saveFieldValue('Designation', selectedObj.id, { Occupation: selectedObj.value, OccupationId: selectedObj.id });
    } else if (sheetFieldKey === 'FatherOccupation') {
      saveFieldValue('FatherOccupationId', selectedObj.id, { FatherOccupation: selectedObj.value, FatherOccupationId: selectedObj.id });
    } else if (sheetFieldKey === 'MotherOccupation') {
      saveFieldValue('MotherOccupationId', selectedObj.id, { MotherOccupation: selectedObj.value, MotherOccupationId: selectedObj.id });
    } else if (sheetFieldKey === 'AnnualIncome') {
      saveFieldValue('AnnualIncome', selectedObj.value);
    } else if (sheetFieldKey === 'Caste') {
      saveFieldValue('Caste', selectedObj.id, { CasteText: selectedObj.value });
    } else if (sheetFieldKey === 'Maslak') {
      saveFieldValue('Maslak', selectedObj.id, { MaslakText: selectedObj.value });
    } else if (sheetFieldKey === 'MotherTongue') {
      saveFieldValue('MotherTongue', selectedObj.id, { MotherTongueText: selectedObj.value });
    } else if (sheetFieldKey === 'Complexion') {
      saveFieldValue('Complexion', selectedObj.id, { Complexion: selectedObj.value });
    } else if (sheetFieldKey === 'Disability') {
      saveFieldValue('Disability', selectedObj.value);
    } else if (sheetFieldKey === 'FamilyType') {
      saveFieldValue('FamilyType', selectedObj.id, { FamilyType: selectedObj.value });
    } else if (sheetFieldKey === 'FamilyValues') {
      saveFieldValue('FamilyValues', selectedObj.id, { FamilyValues: selectedObj.value });
    } else if (sheetFieldKey === 'FamilyStatus') {
      saveFieldValue('FamilyStatus', selectedObj.id, { FamilyStatus: selectedObj.value });
    } else if (sheetFieldKey === 'NamazHabit') {
      saveFieldValue('NamazHabit', selectedObj.value);
    } else if (sheetFieldKey === 'HijabOrBeard') {
      saveFieldValue('HijabOrBeard', selectedObj.value);
    } else if (sheetFieldKey === 'DietType') {
      saveFieldValue('DietType', selectedObj.value);
    } else if (sheetFieldKey === 'SmokeHabit') {
      saveFieldValue('SmokeHabit', selectedObj.value);
    } else if (sheetFieldKey === 'DrinkHabit') {
      saveFieldValue('DrinkHabit', selectedObj.value);
    } else if (sheetFieldKey === 'CanCook') {
      saveFieldValue('CanCook', selectedObj.value === 'Yes');
    } else if (sheetFieldKey === 'Weight') {
      saveFieldValue('Weight', selectedObj.value);
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
        toast.success(`Photo privacy set to ${privacyValue}`);
        setActiveSheet(null);
      } else {
        toast.error("Failed to update photo privacy.");
      }
    } catch {
      toast.error("Network error.");
    }
  };

  // Upload Photo to Slot (1-4)
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

        toast.success(isMainSlot ? "Main profile avatar updated!" : "Photo added to portfolio!");
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
      const res = await uploadGovtDocumentApi(govtDocFile, token);
      if (res.success || res.Success === 1) {
        toast.success("Identity document submitted! Our trust team will verify it within 24 hours.");
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

  // Master Options Mappers (Live Dynamic from DB + 0ms Fallback)
  const educationOpts = masterData.EDUCATIONS || FALLBACK_MASTERS.EDUCATIONS;
  const casteOpts = masterData.CASTES || FALLBACK_MASTERS.CASTES;
  const maslakOpts = masterData.MASLAKS || FALLBACK_MASTERS.MASLAKS;
  const languageOpts = masterData.MOTHER_TONGUES || FALLBACK_MASTERS.MOTHER_TONGUES;
  const occupationOpts = masterData.OCCUPATIONS || FALLBACK_MASTERS.OCCUPATIONS;
  const employedInOpts = masterData.EMPLOYMENT_SECTORS || FALLBACK_MASTERS.EMPLOYMENT_SECTORS;
  const familyTypeOpts = masterData.FAMILY_TYPES || FALLBACK_MASTERS.FAMILY_TYPES;
  const familyStatusOpts = masterData.FAMILY_STATUS || FALLBACK_MASTERS.FAMILY_STATUS;
  const complexionOpts = masterData.COMPLEXION || FALLBACK_MASTERS.COMPLEXION;

  const familyValuesOpts = [
    { id: 1, value: "Traditional & Religious" },
    { id: 2, value: "Moderate & Practicing" },
    { id: 3, value: "Liberal & Open Minded" },
    { id: 4, value: "Strict Islamic Values" }
  ];

  const weightOpts = Array.from({ length: 41 }, (_, i) => {
    const val = `${45 + i} kg`;
    return { id: val, value: val };
  });

  const incomeOpts = [
    { id: 'No Income / Dependent', value: 'No Income / Dependent' },
    { id: 'Below ₹2 Lakhs', value: 'Below ₹2 Lakhs' },
    { id: '₹2 - 3 Lakhs', value: '₹2 - 3 Lakhs' },
    { id: '₹3 - 5 Lakhs', value: '₹3 - 5 Lakhs' },
    { id: '₹5 - 7 Lakhs', value: '₹5 - 7 Lakhs' },
    { id: '₹7 - 10 Lakhs', value: '₹7 - 10 Lakhs' },
    { id: '₹10 - 15 Lakhs', value: '₹10 - 15 Lakhs' },
    { id: '₹15 - 20 Lakhs', value: '₹15 - 20 Lakhs' },
    { id: '₹20 - 30 Lakhs', value: '₹20 - 30 Lakhs' },
    { id: '₹30 - 50 Lakhs', value: '₹30 - 50 Lakhs' },
    { id: 'Above ₹50 Lakhs', value: 'Above ₹50 Lakhs' }
  ];

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

  const hijabOpts = [
    { id: 'Hijab', value: 'Hijab' },
    { id: 'Niqab', value: 'Niqab' },
    { id: 'Sunnah Beard', value: 'Sunnah Beard' },
    { id: 'Modest Dress / Clean Shaved', value: 'Modest Dress / Clean Shaved' }
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

  return (
    <div className="min-h-screen bg-[#FBF9F7] text-slate-900 pb-24 font-sans selection:bg-[#d91b5c] selection:text-white">
      <Toaster position="top-center" richColors />

      {/* 🌟 1. ELEVATED FLOATING APP BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100/80 px-4 py-3 shadow-xs">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => router.push('/dashboard/my-profile')}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-800 hover:text-[#d91b5c] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Back to profile"
              title="Close and return"
            >
              <X size={20} className="stroke-[2.2]" />
            </button>
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                Edit Matrimonial Profile
              </h1>
              <p className="text-[11px] font-semibold text-slate-500">Nikah Qubool Identity</p>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => router.push('/dashboard/my-profile')}
            className="flex items-center gap-1.5 text-xs font-black text-[#d91b5c] hover:text-[#b8144b] bg-rose-50 hover:bg-rose-100/80 px-3.5 py-1.5 rounded-full border border-rose-200/60 transition-all cursor-pointer shadow-xs active:scale-96"
          >
            <Eye size={14} className="stroke-[2.5]" />
            <span>Preview</span>
          </button>
        </div>
      </header>

      {/* 🌟 MAIN CONTAINER */}
      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">

        {/* 🌟 TOP HERO BANNER: NIKAH PROFILE STRENGTH */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#800020] via-[#9B1138] to-[#D91B5C] p-4 text-white shadow-lg">
          <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-amber-300">
                <Star size={15} className="fill-amber-300" />
              </span>
              <span className="text-xs font-black tracking-wider uppercase text-rose-100">
                Match Readiness
              </span>
            </div>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white">
              85% Completed
            </span>
          </div>

          <p className="text-xs font-medium text-rose-100/90 leading-snug">
            Profiles with complete information and verified photos receive up to 5x more proposal responses from serious families.
          </p>

          <div className="w-full bg-black/25 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-300 to-amber-400 h-full rounded-full transition-all duration-700" style={{ width: '85%' }} />
          </div>
        </div>

        {/* 🌟 QUICK ACTION CARDS (LIFESTYLE SCORE + TRUST BADGE) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Lifestyle & Faith Boost */}
          <div 
            onClick={() => openOptionSheet('Daily Salah (Namaz) Routine', 'NamazHabit', formData.NamazHabit, namazOpts)}
            className="p-3.5 rounded-2xl bg-white border border-rose-100 shadow-xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                +15% Score
              </span>
            </div>
            <div className="mt-3">
              <h2 className="text-xs font-black text-slate-900 group-hover:text-[#d91b5c] transition-colors">
                Islamic Lifestyle
              </h2>
              <span className="text-[11px] font-bold text-[#d91b5c] inline-block mt-0.5">
                Update Values &rarr;
              </span>
            </div>
          </div>

          {/* Card 2: Official Trust Verification */}
          <div 
            onClick={() => setActiveSheet('trustBadge')}
            className="p-3.5 rounded-2xl bg-white border border-rose-100 shadow-xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <ShieldCheck size={17} />
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                Trust Badge
              </span>
            </div>
            <div className="mt-3">
              <h2 className="text-xs font-black text-slate-900 group-hover:text-sky-600 transition-colors">
                Govt ID Verification
              </h2>
              <span className="text-[11px] font-bold text-sky-600 inline-block mt-0.5">
                {formData.IsGovtIdVerified ? "Verified ✓" : (formData.GovtIdDocUrl ? "Under Review ⏳" : "Upload ID &rarr;")}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 🌟 SECTION 1: PHOTO GALLERY & VISIBILITY PRIVACY              */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#d91b5c] flex items-center justify-center">
                <Camera size={18} />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">Visual Portfolio & Privacy</h2>
                <p className="text-[11px] text-slate-500 font-medium">Slot #1 is your primary display photo</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {activePhotosCount}/4 Uploaded
            </span>
          </div>

          {/* 4-Slots Photo Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((slotIdx) => {
              const photo = photos[slotIdx];
              const isUploading = uploadingPhotoSlot === slotIdx;

              if (photo && photo.photoUrl) {
                return (
                  <div 
                    key={slotIdx} 
                    className="relative aspect-3/4 rounded-2xl overflow-hidden border-2 border-rose-200/80 shadow-xs group bg-slate-100"
                  >
                    <img 
                      src={photo.photoUrl} 
                      alt={`Photo ${slotIdx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    
                    {slotIdx === 0 && (
                      <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-xs px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                        <Award size={10} className="text-amber-400" />
                        <span className="text-[9px] font-black tracking-wider text-white uppercase">
                          PRIMARY
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo.photoId, slotIdx)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-110 active:scale-95"
                      title="Delete this photo"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              }

              return (
                <label 
                  key={slotIdx} 
                  className="aspect-3/4 rounded-2xl border-2 border-dashed border-rose-200 hover:border-[#d91b5c] bg-rose-50/20 hover:bg-rose-50/60 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all relative group"
                >
                  <input 
                    type="file"
                    accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.heic,.heif,.jfif,.bmp,.gif,.tiff"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => handlePhotoSelect(e, slotIdx)}
                  />
                  {isUploading ? (
                    <Loader2 size={22} className="text-[#d91b5c] animate-spin" />
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-full bg-rose-100 text-[#d91b5c] flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                        <Plus size={18} className="stroke-[3]" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600">
                        {slotIdx === 0 ? "Main Avatar" : `Add Photo ${slotIdx + 1}`}
                      </span>
                    </>
                  )}
                </label>
              );
            })}
          </div>

          {/* Strict Rule: Photo privacy option ONLY appears when at least 1 photo is uploaded */}
          {activePhotosCount > 0 && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between bg-rose-50/40 p-3 rounded-2xl">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Who Can View Photos</span>
                <span className="text-[11px] text-slate-500 font-medium">Configure visibility for your pictures</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveSheet('photoPrivacy')}
                className="flex items-center gap-1.5 text-xs font-black text-[#d91b5c] hover:text-[#b8144b] bg-white px-3 py-1.5 rounded-full border border-rose-200 shadow-2xs transition-all cursor-pointer"
              >
                <span>{formData.PhotoPrivacy}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </section>

        {/* ============================================================== */}
        {/* 🌟 SECTION 2: PERSONAL STORY & PARTNER OUTLOOK                */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center">
                <Heart size={18} />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">Personal Story & Partner Outlook</h2>
                <p className="text-[11px] text-slate-500 font-medium">In your own words: temperament & aspirations</p>
              </div>
            </div>
            <button
              type="button"
              onClick={openBioSheet}
              className="text-xs font-black text-[#d91b5c] hover:text-[#b8144b] bg-rose-50 px-3 py-1 rounded-full cursor-pointer transition-colors"
            >
              Edit Story
            </button>
          </div>

          <div 
            onClick={openBioSheet}
            className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 hover:border-rose-200 hover:bg-rose-50/20 transition-all cursor-pointer relative group"
          >
            <p className="text-xs text-slate-700 leading-relaxed font-normal line-clamp-3 italic">
              &ldquo;{formData.AboutMe || "Alhamdulillah, we seek a pious, respectful, and understanding partner with strong moral character and family values. Click here to describe yourself..."}&rdquo;
            </p>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/50 text-[10px] font-bold text-slate-400">
              <span>{formData.AboutMe ? `${formData.AboutMe.length}/1000 characters` : "Write up to 1000 characters"}</span>
              <span className="text-[#d91b5c] font-black group-hover:underline">Tap to update &rarr;</span>
            </div>
          </div>

          {/* Partner Expectations */}
          <div 
            onClick={() => openTextInputSheet(
              "Partner Expectations",
              "Describe the qualities, values, and qualifications you look for in a spouse",
              "PartnerExpectations",
              formData.PartnerExpectations,
              "e.g. Educated, practicing Muslim, caring nature, family-oriented...",
              500,
              true
            )}
            className="p-3.5 rounded-2xl border border-slate-200/70 hover:border-rose-200 hover:bg-rose-50/10 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="min-w-0 pr-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Partner Expectations</span>
              <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                {formData.PartnerExpectations || "Add partner expectations..."}
              </p>
            </div>
            <ChevronRight size={16} className="text-slate-400 shrink-0" />
          </div>
        </section>

        {/* ============================================================== */}
        {/* 🌟 SECTION 3: CORE IDENTITY & RESIDENTIAL BACKGROUND          */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <User size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Core Identity & Residential Roots</h2>
              <p className="text-[11px] text-slate-500 font-medium">Personal attributes, community heritage & living</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-left">
            {/* Full Name */}
            <div 
              onClick={() => openTextInputSheet(
                "Full Name", 
                "Update your official display name", 
                "FullName", 
                formData.FullName, 
                "Enter your full name",
                80
              )}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Candidate Name</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.FullName || "Add Name"}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Profile Created For - Locked */}
            <div className="p-4 flex items-center justify-between bg-slate-50/40">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Profile Managed By</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block">{formData.ProfileCreatedFor}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-black flex items-center gap-1">
                <Lock size={10} /> Verified & Locked
              </span>
            </div>

            {/* Age & Gender - Locked */}
            <div className="p-4 flex items-center justify-between bg-slate-50/40">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Age & Gender</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block">{formData.Age} Years, {formData.Gender}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-black flex items-center gap-1">
                <Lock size={10} /> Verified & Locked
              </span>
            </div>

            {/* Marital Status - Locked */}
            <div className="p-4 flex items-center justify-between bg-slate-50/40">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Marital Status</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block">{formData.MaritalStatus}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-black flex items-center gap-1">
                <Lock size={10} /> Verified & Locked
              </span>
            </div>

            {/* Sect - Locked */}
            <div className="p-4 flex items-center justify-between bg-slate-50/40">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Islamic Sect</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block">{formData.Sect}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-black flex items-center gap-1">
                <Lock size={10} /> Verified & Locked
              </span>
            </div>

            {/* Height - Slider Sheet */}
            <div 
              onClick={openHeightSheet}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Physical Height</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.Height}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Weight */}
            <div 
              onClick={() => openOptionSheet('Select Weight', 'Weight', formData.Weight, weightOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Physical Weight</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.Weight}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Complexion */}
            <div 
              onClick={() => openOptionSheet('Select Complexion / Skin Tone', 'Complexion', formData.Complexion, complexionOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Complexion / Skin Tone</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.Complexion}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Caste / Community */}
            <div 
              onClick={() => openOptionSheet('Select Caste / Biradari', 'Caste', formData.Caste, casteOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Caste / Community</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.Caste}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Maslak */}
            <div 
              onClick={() => openOptionSheet('Select Maslak / School of Thought', 'Maslak', formData.Maslak, maslakOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Maslak / School of Thought</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.Maslak}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Mother Tongue */}
            <div 
              onClick={() => openOptionSheet('Select Mother Tongue', 'MotherTongue', formData.MotherTongue, languageOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Mother Tongue</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.MotherTongue}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Location (Current Living In) */}
            <div 
              onClick={() => openLocationSheet('Location')}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Current Residence Location</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.Location}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Physical Disability */}
            <div 
              onClick={() => openOptionSheet('Physical Disability Assessment', 'Disability', formData.Disability, disabilityOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Physical Disability</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.Disability}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 🌟 SECTION 4: ACADEMICS & PROFESSIONAL CREDENTIALS           */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <GraduationCap size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Academics & Professional Career</h2>
              <p className="text-[11px] text-slate-500 font-medium">Educational degrees, employment sector & annual remuneration</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-left">
            {/* Highest Degree */}
            <div 
              onClick={() => openOptionSheet('Select Highest Education Qualification', 'Education', formData.Education, educationOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Highest Qualification</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.Education}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* College Name */}
            <div 
              onClick={() => openTextInputSheet(
                "College / University Name",
                "Specify your educational institute",
                "CollegeName",
                formData.CollegeName,
                "e.g. Aligarh Muslim University, Delhi University...",
                140
              )}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">College / University Attended</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.CollegeName || "Add College Name"}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Employed In */}
            <div 
              onClick={() => openOptionSheet('Employment Working Sector', 'EmployedIn', formData.EmployedIn, employedInOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Working With / Sector</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.EmployedIn}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Occupation */}
            <div 
              onClick={() => openOptionSheet('Professional Role / Occupation', 'Occupation', formData.Occupation, occupationOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Job Title / Profession</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.Occupation}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Occupation Details */}
            <div 
              onClick={() => openTextInputSheet(
                "Workplace & Job Description",
                "Mention your company name, designation, or role responsibilities",
                "OccupationDetails",
                formData.OccupationDetails,
                "e.g. Senior Developer at MNC, Clinic owner in Bareilly...",
                250
              )}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Occupation Details</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.OccupationDetails || "Add details..."}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Annual Income */}
            <div 
              onClick={() => openOptionSheet('Annual Income Bracket', 'AnnualIncome', formData.AnnualIncome, incomeOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Annual Income Bracket</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.AnnualIncome}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 🌟 SECTION 5: FAMILY ROOTS & SIBLINGS                         */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Home size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Family Roots & Household Details</h2>
              <p className="text-[11px] text-slate-500 font-medium">Ancestral native origins, household values & siblings</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-left">
            {/* Family Location */}
            <div 
              onClick={() => openLocationSheet('FamilyLocation')}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Family Native Location</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.FamilyLocation}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Family Type */}
            <div 
              onClick={() => openOptionSheet('Family Structure', 'FamilyType', formData.FamilyType, familyTypeOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Family Structure</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.FamilyType}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Family Values */}
            <div 
              onClick={() => openOptionSheet('Cultural & Family Ethics', 'FamilyValues', formData.FamilyValues, familyValuesOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Family Culture & Values</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.FamilyValues}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Family Status */}
            <div 
              onClick={() => openOptionSheet('Family Social Status', 'FamilyStatus', formData.FamilyStatus, familyStatusOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Family Social Status</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.FamilyStatus}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 🌟 Father's Occupation: 100% Dynamic Master Occupations List */}
            <div 
              onClick={() => openOptionSheet("Select Father's Profession", "FatherOccupation", formData.FatherOccupation, occupationOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Father's Profession</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.FatherOccupation || "Select Occupation"}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* 🌟 Mother's Occupation: 100% Dynamic Master Occupations List (No Text Box!) */}
            <div 
              onClick={() => openOptionSheet("Select Mother's Profession", "MotherOccupation", formData.MotherOccupation, occupationOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Mother's Profession</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.MotherOccupation || "Select Occupation"}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Siblings (Brothers & Sisters) */}
            <div 
              onClick={openCountersSheet}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Siblings Overview</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">
                  {formData.TotalBrothers} Brother ({formData.MarriedBrothers} Married) &bull; {formData.TotalSisters} Sister ({formData.MarriedSisters} Married)
                </span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Family Background Note */}
            <div 
              onClick={() => openTextInputSheet(
                "About Family Background",
                "Share information about your family origin, values, and relatives",
                "FamilyAbout",
                formData.FamilyAbout,
                "e.g. Well-settled family in Bareilly with high moral values...",
                500,
                true
              )}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Family Background Summary</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block truncate max-w-[280px]">
                  {formData.FamilyAbout || "Add summary..."}
                </span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 🌟 SECTION 6: DEEN, SUNNAH & DAILY LIFESTYLE HABITS           */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Moon size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Deen, Sunnah & Lifestyle Habits</h2>
              <p className="text-[11px] text-slate-500 font-medium">Daily Salah adherence, Islamic appearance & personal discipline</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-left">
            {/* Namaz Habit */}
            <div 
              onClick={() => openOptionSheet('Daily Salah (Namaz) Routine', 'NamazHabit', formData.NamazHabit, namazOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Daily Salah Observance</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.NamazHabit}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Hijab or Beard */}
            <div 
              onClick={() => openOptionSheet('Islamic Appearance / Attire', 'HijabOrBeard', formData.HijabOrBeard, hijabOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Islamic Attire & Appearance</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.HijabOrBeard}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Diet Type */}
            <div 
              onClick={() => openOptionSheet('Dietary & Food Habits', 'DietType', formData.DietType, dietOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Dietary Preferences</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.DietType}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Culinary / Can Cook */}
            <div 
              onClick={() => openOptionSheet('Can Cook Food?', 'CanCook', formData.CanCook, cookOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Cooking / Culinary Skills</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.CanCook}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Smoking */}
            <div 
              onClick={() => openOptionSheet('Smoking Habits', 'SmokeHabit', formData.SmokeHabit, habitOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Smoking Habits</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.SmokeHabit}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Drinking */}
            <div 
              onClick={() => openOptionSheet('Alcohol / Drinking Habits', 'DrinkHabit', formData.DrinkHabit, habitOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Alcohol / Drinking</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{formData.DrinkHabit}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Hobbies & Interests */}
            <div 
              onClick={() => openTextInputSheet(
                "Hobbies & Interests",
                "Share activities and passions you enjoy in your leisure time",
                "Hobbies",
                formData.Hobbies,
                "e.g. Reading Islamic literature, Traveling, Cooking, Gardening...",
                250
              )}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Hobbies & Pastimes</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block truncate max-w-[280px]">
                  {formData.Hobbies || "Add hobbies..."}
                </span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>
        </section>

      </main>

      {/* ============================================================== */}
      {/* 🌟 10. ULTRA-LUXURY BOTTOM SHEETS & DRAWERS                   */}
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

            {/* 🌟 SHEET A: HEIGHT SLIDER BOTTOM SHEET */}
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
                    className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xl hover:bg-black transition-colors cursor-pointer border-2 border-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-black text-slate-900">Physical Height</h3>
                  <p className="text-xs text-slate-500 font-medium">Slide to accurately set your height</p>
                </div>

                {/* Selected Height Pill */}
                <div className="flex justify-center">
                  <div className="px-6 py-2.5 rounded-full border-2 border-[#d91b5c] text-[#d91b5c] font-black text-base bg-rose-50/50 shadow-2xs">
                    {cmToFtIn(heightCm)}
                  </div>
                </div>

                {/* Slider */}
                <div className="px-3 pt-2">
                  <input 
                    type="range"
                    min={135}
                    max={213}
                    step={1}
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#d91b5c]"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-bold mt-2">
                    <span>4ft 5in (135 cm)</span>
                    <span>7ft 0in (213 cm)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveHeight}
                  disabled={savingField === 'Height'}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#9B1138] to-[#D91B5C] hover:opacity-95 text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center"
                >
                  {savingField === 'Height' ? <Loader2 size={18} className="animate-spin" /> : "Confirm Height"}
                </button>
              </motion.div>
            )}

            {/* 🌟 SHEET B: SEARCHABLE OPTIONS BOTTOM SHEET (DYNAMIC MASTER BOUND) */}
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
                    className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xl hover:bg-black transition-colors cursor-pointer border-2 border-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">{sheetTitle}</h3>
                  <p className="text-xs text-slate-500 font-medium">Choose from verified master list</p>
                </div>

                {/* Search Bar */}
                {sheetOptions.length > 5 && (
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input 
                      type="text"
                      placeholder={`Search in ${sheetTitle}...`}
                      value={sheetSearch}
                      onChange={(e) => setSheetSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-100 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d91b5c]/20"
                    />
                  </div>
                )}

                {/* Radio List */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                  {filteredSheetOptions.map((opt) => {
                    const isSelected = selectedSheetValue === opt.id || selectedSheetValue === opt.value;
                    return (
                      <div 
                        key={String(opt.id || opt.value)}
                        onClick={() => setSelectedSheetValue(opt.id !== undefined ? opt.id : opt.value)}
                        className="py-3 px-1.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        <span className={`text-xs font-semibold ${isSelected ? 'text-[#d91b5c] font-black' : 'text-slate-800'}`}>
                          {opt.value}
                        </span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'border-[#d91b5c] bg-[#d91b5c]' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
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
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#9B1138] to-[#D91B5C] hover:opacity-95 text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center shrink-0"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : "Save Choice"}
                </button>
              </motion.div>
            )}

            {/* 🌟 SHEET C: IN-APP TEXT / TEXTAREA INPUT SHEET (REPLACES PROMPT) */}
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
                    className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xl hover:bg-black transition-colors cursor-pointer border-2 border-white"
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
                      type="text"
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
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#9B1138] to-[#D91B5C] hover:opacity-95 text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : "Save Detail"}
                </button>
              </motion.div>
            )}

            {/* 🌟 SHEET D: SIBLING COUNTERS SHEET (REPLACES PROMPT) */}
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
                    className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xl hover:bg-black transition-colors cursor-pointer border-2 border-white"
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
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#9B1138] to-[#D91B5C] hover:opacity-95 text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : "Save Siblings Overview"}
                </button>
              </motion.div>
            )}

            {/* 🌟 SHEET E: BIO FULL SLIDE SHEET */}
            {activeSheet === 'bio' && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 pt-5 space-y-4 shadow-2xl text-left"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveSheet(null)}
                      className="p-1 rounded-full hover:bg-slate-100 text-slate-700 cursor-pointer"
                    >
                      <X size={20} />
                    </button>
                    <span className="text-sm font-black text-slate-900">Personal Story & Partner Outlook</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">Tell Us About Yourself</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Share your deen, daily interests, household background, and what qualities you look for in a spouse.
                  </p>
                </div>

                <div className="relative">
                  <textarea 
                    rows={7}
                    maxLength={1000}
                    value={bioDraft}
                    onChange={(e) => setBioDraft(e.target.value)}
                    placeholder="Write a few paragraphs about your personality, principles, and partner expectations..."
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
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#9B1138] to-[#D91B5C] hover:opacity-95 text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center"
                >
                  {savingField === 'AboutMe' ? <Loader2 size={18} className="animate-spin" /> : "Save Story"}
                </button>
              </motion.div>
            )}

            {/* 🌟 SHEET F: LOCATION SELECTOR (STATE & CITY) */}
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
                    className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xl hover:bg-black transition-colors cursor-pointer border-2 border-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {locationTargetField === 'FamilyLocation' ? "Family Native Origin" : "Current Residence"}
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
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#9B1138] to-[#D91B5C] hover:opacity-95 text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center shrink-0"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : "Confirm Location"}
                </button>
              </motion.div>
            )}

            {/* 🌟 SHEET G: PHOTO PRIVACY BOTTOM SHEET */}
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
                    className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xl hover:bg-black transition-colors cursor-pointer border-2 border-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-black text-slate-900">Photo Visibility Privacy</h3>
                  <p className="text-xs text-slate-500 font-medium">Control who can view your photo portfolio</p>
                </div>

                <div className="space-y-2.5 pt-2">
                  {[
                    { id: 'All Members', title: 'All Registered Members', desc: 'Visible to all authenticated rishta seekers' },
                    { id: 'Premium Members', title: 'Premium Verified Members', desc: 'Blurred for free users until upgraded' },
                    { id: 'Members I Approve', title: 'Members I Explicitly Approve', desc: 'Blurred until you accept their photo request' },
                  ].map((item) => {
                    const isSelected = formData.PhotoPrivacy === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSavePhotoPrivacy(item.id)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          isSelected ? 'border-[#d91b5c] bg-rose-50/40 shadow-xs' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className={`text-xs font-black ${isSelected ? 'text-[#d91b5c]' : 'text-slate-900'}`}>
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-[#d91b5c] bg-[#d91b5c]' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* 🌟 SHEET H: TRUST BADGE (GOVT ID VERIFICATION) */}
            {activeSheet === 'trustBadge' && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 pt-5 space-y-4 shadow-2xl text-left max-h-[90vh] flex flex-col"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveSheet(null)}
                      className="p-1 rounded-full hover:bg-slate-100 text-slate-700 cursor-pointer"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <span className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      Add Trust Badge <ShieldCheck size={16} className="text-sky-500" />
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {/* Upload Box */}
                  <label className="border-2 border-dashed border-rose-300 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-rose-50/30 transition-all bg-rose-50/10">
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
                        <span className="text-xs font-bold text-[#d91b5c] block">Tap to choose another file</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-[#d91b5c] flex items-center justify-center mb-2 shadow-xs">
                          <Upload size={22} />
                        </div>
                        <span className="text-sm font-black text-slate-900 block">Upload Official Govt ID</span>
                        <span className="text-xs text-slate-500 font-medium block mt-0.5">
                          Aadhaar Card, Passport, Driving License or PAN Card
                        </span>
                        <span className="text-[10px] text-slate-400 mt-2 block font-semibold">
                          Supported: JPG, PNG, PDF (Max 10MB)
                        </span>
                      </>
                    )}
                  </label>

                  {/* Benefits Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                    <span className="text-xs font-black text-slate-900 block">Trust & Privacy Guarantee</span>
                    <ul className="text-[11px] text-slate-600 space-y-1.5 font-medium">
                      <li className="flex items-start gap-1.5">
                        <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span>Your identity document is 100% confidential and never visible to other users.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span>Earns the blue <strong>Verified Trust Badge</strong> on your profile card.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span>Builds immediate trust with respectable parents and proposal seekers.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSubmitGovtDoc}
                  disabled={uploadingGovtDoc || !govtDocFile}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#9B1138] to-[#D91B5C] disabled:opacity-50 hover:opacity-95 text-white font-black text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center shrink-0"
                >
                  {uploadingGovtDoc ? <Loader2 size={18} className="animate-spin" /> : "Submit for Admin Verification"}
                </button>
              </motion.div>
            )}

          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
