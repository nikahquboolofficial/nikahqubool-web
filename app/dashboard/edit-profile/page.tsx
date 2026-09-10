"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Eye, Edit3, User, GraduationCap, Users, 
  Moon, Heart, Save, Loader2, MapPin, ChevronRight, RotateCcw, Plus
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { 
  fetchProfileDetailsApi, 
  updateProfileApi, 
  savePartnerPreferencesApi, 
  fetchMasterDataApi, 
  fetchCitiesApi, 
  MasterOption 
} from '@/lib/api';
import { CompactSelect, MultiSelectDropdown } from '@/components/profile/CompactSelect';
import { getOptimizedImageUrl } from '@/lib/imageUtils';

type SectionKey = 'intro' | 'basic' | 'personal' | 'education' | 'religious' | 'address' | 'family' | 'partner';

export default function EditMyProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentSection, setCurrentSection] = useState<SectionKey>('intro');
  const [mobileSubScreenOpen, setMobileSubScreenOpen] = useState(false);

  // Master Data Cache
  const [masterData, setMasterData] = useState<{ [key: string]: MasterOption[] }>({});

  // Form State
  const [formData, setFormData] = useState<any>({
    UserId: 0,
    FullName: '',
    MobileNumber: '',
    Email: '',
    ProfileCreatedFor: 1,
    ProfileCreatedForText: '',
    Age: 25,
    Gender: 'Female',
    DateOfBirth: '',
    PhotoUrl: '/placeholder.png',

    // Section 1: Intro / Bio
    AboutMe: '',
    FamilyAbout: '',

    // Section 3: Personal Details
    Height: '5 ft 6 in',
    Weight: '60 kg',
    Complexion: 1,
    MaritalStatus: 1,
    MaritalStatusText: '',
    Sect: 1,
    SectText: '',
    Caste: 1,
    CasteText: '',
    Maslak: 1,
    MaslakText: '',
    MotherTongue: 1,
    MotherTongueText: '',
    Disability: 'No',

    // Section 4: Education & Career
    HighestDegree: 1,
    HighestDegreeText: '',
    CollegeName: '',
    EmploymentSector: 1,
    EmploymentSectorText: '',
    Designation: 1,
    DesignationText: '',
    OccupationDetails: '', // ✅ Job / Profession Details Textbox
    AnnualIncome: '5 - 10 LPA',

    // Section 5: Religious & Lifestyle
    DietType: 'Halal Only',
    SmokeHabit: 'No',
    DrinkHabit: 'No',
    Hobbies: '',
    Interests: '',

    // Section 6: Address
    CurrentStateId: 0,
    StateName: '',
    CurrentCityId: 0,
    CityName: '',
    NativePlaceStateId: 0,
    NativeStateName: '',
    NativePlaceCityId: 0,
    NativeCityName: '',

    // Section 7: Family Details
    FamilyType: 1,
    FamilyStatus: 1,
    FatherName: '',
    MotherName: '',
    FatherOccupationId: 1,
    FatherOccupation: '',
    MotherOccupationId: 1,
    MotherOccupation: '',
    TotalBrothers: 0,
    MarriedBrothers: 0,
    TotalSisters: 0,
    MarriedSisters: 0,

    // Partner Expectations
    PartnerExpectations: ''
  });

  // Partner Preferences State (Multi-select State & City)
  const [partnerPref, setPartnerPref] = useState<any>({
    maritalStatusList: [1],
    annualIncome: 'Any Income',
    minAge: 20,
    maxAge: 35,
    minHeight: '5.0',
    maxHeight: '6.2',
    sectId: 1,
    casteIds: [1],
    educationIds: [1],
    occupationIds: [1],
    languageIds: [1],
    stateIds: [], // ✅ Multi-select States
    cityIds: []   // ✅ Multi-select Cities
  });

  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop()?.split(';').shift() : null;
  };

  const getToken = useCallback(() => getCookie("user_token"), []);

  const handleLogout = useCallback(() => {
    document.cookie = "user_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "is_profile_completed=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }
    router.push('/');
  }, [router]);

  // Master Data Ref to keep loadUserData stable without infinite loops
  const masterDataRef = React.useRef(masterData);
  useEffect(() => {
    masterDataRef.current = masterData;
  }, [masterData]);

  // Helper to convert Master Text values to Numeric IDs
  const resolveMasterId = useCallback((options: MasterOption[] | undefined, value: any, defaultId = 1): number => {
    if (value === null || value === undefined || value === '') return defaultId;
    if (typeof value === 'number' && value > 0) return value;
    const num = Number(value);
    if (!isNaN(num) && num > 0) return num;
    
    if (options && options.length > 0) {
      const match = options.find(o => String(o.value).toLowerCase().trim() === String(value).toLowerCase().trim());
      if (match) return Number(match.id);
    }
    return defaultId;
  }, []);

  // Load Master Tables (Parallel Concurrent Fetch)
  useEffect(() => {
    const loadAllMasters = async () => {
      const types = [
        'MARITAL_STATUS', 'RELIGIONS', 'SECTS', 'MASLAKS', 
        'CASTES', 'MOTHER_TONGUES', 'EDUCATIONS', 'EMPLOYMENT_SECTORS', 
        'OCCUPATIONS', 'STATES', 'FAMILY_TYPES', 'FAMILY_STATUS', 'Complexion',
        'HOBBIES', 'INTERESTS', 'PROFILE_CREATED_FOR'
      ];
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
      // Re-trigger loadUserData once master options are available
      setTimeout(() => {
        loadUserData();
      }, 50);
    };
    loadAllMasters();
  }, []);

  // Cities for Address Section (Current State)
  useEffect(() => {
    if (formData.CurrentStateId > 0) {
      fetchCitiesApi(formData.CurrentStateId).then(cities => setMasterData(prev => ({ ...prev, CITIES: cities })));
    } else {
      setMasterData(prev => ({ ...prev, CITIES: [] }));
    }
  }, [formData.CurrentStateId]);

  // Cities for Native Place Section
  useEffect(() => {
    if (formData.NativePlaceStateId > 0) {
      fetchCitiesApi(formData.NativePlaceStateId).then(cities => setMasterData(prev => ({ ...prev, NATIVE_CITIES: cities })));
    } else {
      setMasterData(prev => ({ ...prev, NATIVE_CITIES: [] }));
    }
  }, [formData.NativePlaceStateId]);

  // Cities for Partner Preferences (Fetches based on first selected state)
  useEffect(() => {
    const firstStateId = partnerPref.stateIds && partnerPref.stateIds.length > 0 ? Number(partnerPref.stateIds[0]) : 0;
    if (firstStateId > 0) {
      fetchCitiesApi(firstStateId).then(cities => setMasterData(prev => ({ ...prev, PREF_CITIES: cities })));
    } else {
      setMasterData(prev => ({ ...prev, PREF_CITIES: [] }));
    }
  }, [partnerPref.stateIds]);

  // Load Existing Profile Data
  const loadUserData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      handleLogout();
      return;
    }

    setLoading(true);
    let userId = 0;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user_details") || localStorage.getItem("user_session");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          userId = parsed.userId || parsed.UserId || parsed.id || parsed.user?.userId || parsed.user?.id || 0;
        } catch (e) {}
      }
    }

    const res = await fetchProfileDetailsApi(userId > 0 ? userId : 0, token);
    if (res.isUnauthorized || (!res.success && res.message?.toLowerCase().includes("unauthorized"))) {
      toast.error("Session expired. Please login again.");
      handleLogout();
      return;
    }
    if (res.success && res.data) {
      const p = res.data.profile || res.data.Profile || res.data;
      const pref = res.data.preferences || res.data.Preferences || {};
      const currentMasters = masterDataRef.current;

      const getValidId = (idVal: any, textVal: any, masterOptions?: MasterOption[], fallback = 1) => {
        const num = Number(idVal);
        if (!isNaN(num) && num > 0) return num;
        return resolveMasterId(masterOptions, textVal, fallback);
      };

      const getValidText = (val: any, fallback: string) => {
        if (val !== null && val !== undefined && String(val).trim() !== '') return String(val).trim();
        return fallback;
      };

      let parsedDob = '';
      if (p.dateOfBirth) {
        try {
          const d = new Date(p.dateOfBirth);
          if (!isNaN(d.getTime())) parsedDob = d.toISOString().split('T')[0];
        } catch (e) {}
      }

      setFormData((prev: any) => ({
        ...prev,
        UserId: p.userId || p.UserId || userId,
        FullName: getValidText(p.fullName || p.FullName, 'Member'),
        MobileNumber: getValidText(p.mobileNumber || p.MobileNumber, ''),
        Email: getValidText(p.email || p.Email, ''),
        ProfileCreatedFor: getValidId(p.profileCreatedForId ?? p.ProfileCreatedForId, p.profileCreatedFor, currentMasters.PROFILE_CREATED_FOR, 1),
        ProfileCreatedForText: getValidText(p.profileCreatedForName || p.profileCreatedFor || p.ProfileCreatedFor, 'Self'),
        Age: p.age || 24,
        Gender: getValidText(p.gender || p.Gender, 'Female'),
        DateOfBirth: parsedDob,
        DateOfBirthFormatted: p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A',
        PhotoUrl: getOptimizedImageUrl(p.mainPhotoUrl || p.photoUrl),

        AboutMe: p.aboutMe || p.AboutMe || '',
        FamilyAbout: p.familyAbout || p.aboutFamily || '',
        Height: getValidText(p.height || p.Height, '5 ft 6 in'),
        Weight: getValidText(p.weight || p.Weight, '60 kg'),
        Complexion: getValidId(p.complexionId ?? p.ComplexionId, p.complexion, currentMasters.COMPLEXIONS, 1),
        MaritalStatus: getValidId(p.maritalStatusId ?? p.MaritalStatusId, p.maritalStatus, currentMasters.MARITAL_STATUS, 1),
        MaritalStatusText: getValidText(p.maritalStatusName || p.maritalStatus || p.MaritalStatus, 'Never Married'),
        Sect: getValidId(p.sectId ?? p.SectId, p.sect, currentMasters.SECTS, 1),
        SectText: getValidText(p.sectName || p.sect || p.Sect, 'Sunni'),
        Caste: getValidId(p.casteId ?? p.CasteId, p.caste, currentMasters.CASTES, 1),
        CasteText: getValidText(p.casteName || p.caste || p.Caste, 'General'),
        Maslak: getValidId(p.maslakId ?? p.MaslakId, p.maslak, currentMasters.MASLAKS, 1),
        MaslakText: getValidText(p.maslakName || p.maslak || p.Maslak, ''),
        MotherTongue: getValidId(p.motherTongueId ?? p.MotherTongueId, p.motherTongue, currentMasters.MOTHER_TONGUES, 1),
        MotherTongueText: getValidText(p.motherTongueName || p.motherTongue || p.MotherTongue, 'Hindi'),

        HighestDegree: getValidId(p.highestDegreeId ?? p.HighestDegreeId, p.highestDegree, currentMasters.EDUCATIONS, 1),
        HighestDegreeText: getValidText(p.highestDegreeName || p.highestDegree || p.HighestDegree, 'Graduate'),
        CollegeName: p.collegeName || p.CollegeName || '',
        EmploymentSector: getValidId(p.employmentSectorId ?? p.EmploymentSectorId, p.employmentSector, currentMasters.EMPLOYMENT_SECTORS, 1),
        Designation: getValidId(p.designationId ?? p.DesignationId, p.designation, currentMasters.OCCUPATIONS, 1),
        DesignationText: getValidText(p.designationName || p.designation || p.Designation, 'Professional'),
        OccupationDetails: p.occupationDetails || p.OccupationDetails || '',
        AnnualIncome: getValidText(p.annualIncome || p.AnnualIncome, '5 - 10 LPA'),

        DietType: getValidText(p.dietType || p.DietType, 'Halal Only'),
        SmokeHabit: getValidText(p.smokeHabit || p.SmokeHabit, 'No'),
        DrinkHabit: getValidText(p.drinkHabit || p.DrinkHabit, 'No'),
        Hobbies: p.hobbies || p.Hobbies || '',
        Interests: p.interests || p.Interests || '',

        CurrentStateId: Number(p.currentStateId ?? p.CurrentStateId ?? 0),
        StateName: getValidText(p.currentStateName || p.stateName, 'State N/A'),
        CurrentCityId: Number(p.currentCityId ?? p.CurrentCityId ?? 0),
        CityName: getValidText(p.currentCityName || p.cityName, 'City N/A'),
        NativePlaceStateId: Number(p.nativePlaceStateId ?? p.NativePlaceStateId ?? 0),
        NativeStateName: getValidText(p.nativeStateName || p.NativeStateName, ''),
        NativePlaceCityId: Number(p.nativePlaceCityId ?? p.NativePlaceCityId ?? 0),
        NativeCityName: getValidText(p.nativeCityName || p.NativeCityName, ''),

        FamilyType: getValidId(p.familyTypeId ?? p.FamilyTypeId, p.familyType, currentMasters.FAMILY_TYPES, 1),
        FamilyStatus: getValidId(p.familyStatusId ?? p.FamilyStatusId, p.familyStatus, currentMasters.FAMILY_STATUS, 1),
        FatherName: p.fatherName || p.FatherName || '',
        MotherName: p.motherName || p.MotherName || '',
        FatherOccupationId: getValidId(p.fatherOccupationId ?? p.FatherOccupationId, p.fatherOccupationName || p.fatherOccupation || p.FatherOccupation, currentMasters.OCCUPATIONS, 1),
        MotherOccupationId: getValidId(p.motherOccupationId ?? p.MotherOccupationId, p.motherOccupationName || p.motherOccupation || p.MotherOccupation, currentMasters.OCCUPATIONS, 1),
        FatherOccupation: getValidText(p.fatherOccupationName || p.fatherOccupation || p.FatherOccupation, ''),
        MotherOccupation: getValidText(p.motherOccupationName || p.motherOccupation || p.MotherOccupation, ''),
        TotalBrothers: Number(p.totalBrothers || 0),
        MarriedBrothers: Number(p.marriedBrothers || 0),
        TotalSisters: Number(p.totalSisters || 0),
        MarriedSisters: Number(p.marriedSisters || 0),

        PartnerExpectations: p.partnerExpectations || p.PartnerExpectations || ''
      }));

      if (pref && Object.keys(pref).length > 0) {
        const parseArray = (val: any) => {
          if (!val) return [];
          if (Array.isArray(val)) return val;
          return String(val).split(',').map(s => s.trim()).filter(Boolean);
        };

        setPartnerPref((prev: any) => ({
          ...prev,
          minAge: pref.minAge || 20,
          maxAge: pref.maxAge || 35,
          minHeight: pref.minHeight || '5.0',
          maxHeight: pref.maxHeight || '6.2',
          sectId: pref.preferredSect || 1,
          stateIds: parseArray(pref.preferredStateID || pref.preferredState),
          cityIds: parseArray(pref.preferredCityID || pref.preferredCity),
          maritalStatusList: parseArray(pref.preferredMaritalStatus),
          educationIds: parseArray(pref.preferredEducation),
          occupationIds: parseArray(pref.preferredOccupation),
          casteIds: parseArray(pref.preferredCaste),
          languageIds: parseArray(pref.preferredMotherTongue)
        }));
      }
    }

    setLoading(false);
  }, [getToken, router, resolveMasterId, handleLogout]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Save Profile Handler
  const handleSaveProfileSection = async () => {
    const token = getToken();
    if (!token) return;

    setSaving(true);

    // Save Partner Preferences Section
    if (currentSection === 'partner') {
      const currentMasters = masterDataRef.current;

      const cleanIds = (val: any, masterOptions?: MasterOption[], fallback = '1') => {
        if (!val) return fallback;
        const arr = Array.isArray(val) ? val : String(val).split(',');
        const cleaned = arr.map(item => {
          const trimmed = String(item).trim();
          if (!trimmed) return null;
          if (!isNaN(Number(trimmed)) && Number(trimmed) > 0) return String(trimmed);
          if (masterOptions && masterOptions.length > 0) {
            const match = masterOptions.find(o => String(o.value).toLowerCase().trim() === trimmed.toLowerCase());
            if (match) return String(match.id);
          }
          return null;
        }).filter(Boolean);

        return cleaned.length > 0 ? cleaned.join(',') : fallback;
      };

      const prefPayload = {
        userId: formData.UserId,
        minAge: Number(partnerPref.minAge || 18),
        maxAge: Number(partnerPref.maxAge || 70),
        minHeight: parseFloat(partnerPref.minHeight || '4.0'),
        maxHeight: parseFloat(partnerPref.maxHeight || '7.0'),
        preferredSect: cleanIds(partnerPref.sectId, currentMasters.SECTS, '1'),
        preferredStateID: cleanIds(partnerPref.stateIds, currentMasters.STATES, '0'),
        preferredCityID: cleanIds(partnerPref.cityIds, currentMasters.PREF_CITIES, '0'),
        preferredEducation: cleanIds(partnerPref.educationIds, currentMasters.EDUCATIONS, '1'),
        preferredOccupation: cleanIds(partnerPref.occupationIds, currentMasters.OCCUPATIONS, '1'),
        minAnnualIncome: 0,
        preferredMaritalStatus: cleanIds(partnerPref.maritalStatusList, currentMasters.MARITAL_STATUS, '1'),
        preferredMotherTongue: cleanIds(partnerPref.languageIds, currentMasters.MOTHER_TONGUES, '1'),
        preferredCaste: cleanIds(partnerPref.casteIds, currentMasters.CASTES, '1')
      };

      const res = await savePartnerPreferencesApi(prefPayload, token);

      if (formData.PartnerExpectations) {
        const prefFd = new FormData();
        prefFd.append("UserId", String(formData.UserId));
        prefFd.append("PartnerExpectations", formData.PartnerExpectations);
        await updateProfileApi(prefFd, token);
      }

      if (res.success) {
        toast.success("Partner preferences saved successfully!");
        await loadUserData();
      } else {
        toast.error(res.message || "Failed to update partner preferences.");
      }
      setSaving(false);
      return;
    }

    // Save Standard Profile Section
    const fd = new FormData();
    
    const numericMasterKeys: { [key: string]: MasterOption[] } = {
      MaritalStatus: masterData.MARITAL_STATUS,
      MotherTongue: masterData.MOTHER_TONGUES,
      Sect: masterData.SECTS,
      Caste: masterData.CASTES,
      Maslak: masterData.MASLAKS,
      HighestDegree: masterData.EDUCATIONS,
      EmploymentSector: masterData.EMPLOYMENT_SECTORS,
      Designation: masterData.OCCUPATIONS,
      CurrentStateId: masterData.STATES,
      CurrentCityId: masterData.CITIES,
      NativePlaceStateId: masterData.STATES,
      NativePlaceCityId: masterData.NATIVE_CITIES,
      FamilyType: masterData.FAMILY_TYPES,
      FamilyStatus: masterData.FAMILY_STATUS,
      FatherOccupationId: masterData.OCCUPATIONS,
      MotherOccupationId: masterData.OCCUPATIONS,
      Complexion: masterData.COMPLEXIONS,
      ProfileCreatedFor: masterData.PROFILE_CREATED_FOR
    };

    const uiOnlyKeys = [
      'DateOfBirthFormatted', 'MaritalStatusText', 'SectText', 'CasteText', 'MaslakText',
      'MotherTongueText', 'HighestDegreeText', 'DesignationText', 'StateName', 
      'CityName', 'NativeStateName', 'NativeCityName', 'FatherOccupation', 'MotherOccupation',
      'NamazHabit', 'HijabOrBeard', 'Age', 'MobileNumber', 'ProfileCreatedForText', 'PhotoUrl'
    ];

    Object.keys(formData).forEach((key) => {
      if (uiOnlyKeys.includes(key)) return;
      if (key === 'DateOfBirth' && !formData[key]) return;

      let val = formData[key];

      if (numericMasterKeys[key]) {
        val = resolveMasterId(numericMasterKeys[key], val, 0);
        if (val <= 0) return;
      }

      if (val !== null && val !== undefined && val !== '') {
        fd.append(key, String(val));
      }
    });

    const res = await updateProfileApi(fd, token);
    
    if (res.success) {
      toast.success("Profile section saved successfully!");
      await loadUserData();
    } else {
      toast.error(res.message || "Failed to update profile.");
    }
    setSaving(false);
  };

  const sectionMenuItems = [
    { id: 'intro', label: 'Introduction', icon: User, desc: 'Family Details & Background' },
    { id: 'basic', label: 'Basic Details', icon: User, desc: 'Read-only profile identity summary' },
    { id: 'personal', label: 'Personal Details', icon: User, desc: 'Height, Weight, Caste & Sect' },
    { id: 'education', label: 'Education And Career', icon: GraduationCap, desc: 'Degree, Profession & Job Details' },
    { id: 'religious', label: 'Religious And Lifestyle', icon: Moon, desc: 'Diet & Lifestyle Habits' },
    { id: 'address', label: 'Address', icon: MapPin, desc: 'State & City location' },
    { id: 'family', label: 'Family Details', icon: Users, desc: 'Family Type, Status & Parents' },
    { id: 'partner', label: 'Partner Preferences', icon: Heart, desc: 'Multi-select ideal match criteria' },
  ];

  const heightOptions = [
    "4 ft 6 in", "4 ft 7 in", "4 ft 8 in", "4 ft 9 in", "4 ft 10 in", "4 ft 11 in",
    "5 ft 0 in", "5 ft 1 in", "5 ft 2 in", "5 ft 3 in", "5 ft 4 in", "5 ft 5 in", 
    "5 ft 6 in", "5 ft 7 in", "5 ft 8 in", "5 ft 9 in", "5 ft 10 in", "5 ft 11 in", 
    "6 ft 0 in", "6 ft 1 in", "6 ft 2 in", "6 ft 3 in", "6 ft 4 in", "6 ft 5 in"
  ].map(h => ({ id: h, value: h }));

  const weightOptions = Array.from({ length: 81 }, (_, i) => ({ id: `${40 + i} kg`, value: `${40 + i} kg` }));

  const incomeOptions = [
    { id: 'Below 3 LPA', value: 'Below 3 LPA' },
    { id: '3 - 5 LPA', value: '3 - 5 LPA' },
    { id: '5 - 10 LPA', value: '5 - 10 LPA' },
    { id: '10 - 15 LPA', value: '10 - 15 LPA' },
    { id: '15 - 20 LPA', value: '15 - 20 LPA' },
    { id: '20 - 35 LPA', value: '20 - 35 LPA' },
    { id: '35 - 50 LPA', value: '35 - 50 LPA' },
    { id: '50 LPA+', value: '50 LPA+' }
  ];

  const countOptions = Array.from({ length: 11 }, (_, i) => ({ id: i, value: String(i) }));

  const hijabOptions = [
    { id: 'Hijab', value: 'Hijab' },
    { id: 'Niqab', value: 'Niqab' },
    { id: 'Beard', value: 'Beard' },
    { id: 'No Hijab/Beard', value: 'No Hijab/Beard' }
  ];

  const namazOptions = [
    { id: 'Regular 5 Times', value: 'Regular 5 Times' },
    { id: 'Jummah Only', value: 'Jummah Only' },
    { id: 'Occasionally', value: 'Occasionally' },
    { id: 'Only During Ramadan', value: 'Only During Ramadan' }
  ];

  const dietOptions = [
    { id: 'Halal Only', value: 'Halal Only' },
    { id: 'Vegetarian', value: 'Vegetarian' },
    { id: 'Non-Vegetarian', value: 'Non-Vegetarian' },
    { id: 'Eggetarian', value: 'Eggetarian' }
  ];

  const smokeOptions = [
    { id: 'No', value: 'No' },
    { id: 'Occasional', value: 'Occasional' },
    { id: 'Regularly', value: 'Regularly' },
    { id: 'Trying to Quit', value: 'Trying to Quit' }
  ];

  const drinkOptions = [
    { id: 'No', value: 'No' },
    { id: 'Socially', value: 'Socially' },
    { id: 'Never', value: 'Never' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-[#d91b5c] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 space-y-0 md:space-y-6 md:pt-4">
        
        {/* RESPONSIVE CONTAINER */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-6 items-start">
          
          {/* SIDEBAR OVERVIEW */}
          <div className={`md:col-span-4 lg:col-span-4 bg-white md:rounded-3xl p-0 md:p-5 border-0 md:border-2 md:border-rose-100 shadow-none md:shadow-xl space-y-0 md:space-y-4 ${mobileSubScreenOpen ? 'hidden md:block' : 'block'}`}>
            
            <div className="bg-white border-b border-slate-200 p-4 text-slate-900 flex items-center justify-between shadow-xs md:hidden sticky top-0 z-30">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => router.push('/dashboard/my-profile')} className="p-1.5 hover:bg-rose-50 rounded-full cursor-pointer text-[#d91b5c]">
                  <ArrowLeft size={20} />
                </button>
                <h1 className="font-serif font-extrabold text-base uppercase tracking-wider text-slate-900">Edit My Profile</h1>
              </div>
              <button type="button" onClick={() => router.push('/dashboard/my-profile')} className="p-1.5 hover:bg-rose-50 rounded-full cursor-pointer text-[#d91b5c]">
                <Eye size={18} />
              </button>
            </div>

            {/* AVATAR CARD (CLEAN & SOBRE WHITE THEME - NO YELLOW BADGE OVER IMAGE) */}
            <div className="p-4 sm:p-5 bg-white text-slate-900 flex items-center justify-between gap-4 shadow-xs border border-slate-200 md:rounded-2xl">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="shrink-0">
                  <img 
                    src={formData.PhotoUrl} 
                    alt="Avatar" 
                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover object-top border-2 border-rose-100 shadow-xs"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                  />
                </div>

                <div className="space-y-0.5 min-w-0">
                  <h3 className="font-serif font-extrabold text-base truncate uppercase tracking-tight text-slate-900">{formData.FullName}</h3>
                  <p className="text-[11px] font-bold text-slate-500 truncate">{formData.Age} yrs | {formData.MaritalStatusText} | {formData.StateName}</p>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => router.push('/dashboard/gallery')} 
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#d91b5c] font-black text-[11px] uppercase tracking-wider shadow-xs transition-colors cursor-pointer flex items-center gap-1 shrink-0 border border-rose-200"
              >
                <Plus size={13} className="stroke-[2.5]" />
                <span>Photos</span>
              </button>
            </div>

            {/* SECTIONS LIST */}
            <div className="p-4 md:p-0 space-y-2.5">
              {sectionMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setCurrentSection(item.id as SectionKey);
                      setMobileSubScreenOpen(true);
                    }}
                    className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer group ${
                      isActive
                        ? 'bg-rose-50/80 border-[#d91b5c] text-[#d91b5c] shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`p-2.5 rounded-xl border ${isActive ? 'bg-[#d91b5c] text-white border-[#d91b5c]' : 'bg-rose-50 text-[#d91b5c] border-rose-100'}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <span className="font-black text-xs block uppercase tracking-tight">{item.label}</span>
                        <span className="text-[10px] font-semibold text-slate-500 block truncate">{item.desc}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className={`transition-transform ${isActive ? 'translate-x-1 text-[#d91b5c]' : 'text-slate-400 group-hover:translate-x-1'}`} />
                  </div>
                );
              })}
            </div>

          </div>

          {/* FORM CONTAINER WITH EXTRA BOTTOM PADDING (pb-48 TO PREVENT DROPDOWN CLIPPING) */}
          <div className={`fixed inset-0 z-[500] bg-white flex flex-col md:relative md:inset-auto md:z-auto md:col-span-8 lg:col-span-8 md:bg-white md:rounded-3xl md:border-2 md:border-rose-100 md:shadow-xl md:overflow-hidden md:max-h-[85vh] ${!mobileSubScreenOpen ? 'hidden md:flex' : 'flex'}`}>
            
            {/* FIXED TOP HEADER (SOBER WHITE THEME) */}
            <div className="sticky top-0 z-30 p-4 bg-white text-slate-900 border-b border-slate-200 flex items-center justify-between shadow-xs flex-shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => setMobileSubScreenOpen(false)} 
                  className="p-1.5 hover:bg-rose-50 rounded-full cursor-pointer md:hidden text-[#d91b5c]"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className="font-serif font-extrabold text-base uppercase tracking-wider text-slate-900">
                  {sectionMenuItems.find(s => s.id === currentSection)?.label}
                </h2>
              </div>

              {currentSection === 'partner' && (
                <button 
                  type="button" 
                  onClick={() => setPartnerPref({
                    maritalStatusList: [1], annualIncome: 'Any Income', minAge: 20, maxAge: 35,
                    minHeight: '5.0', maxHeight: '6.2', sectId: 1, casteIds: [1],
                    educationIds: [1], occupationIds: [1], languageIds: [1], stateIds: [], cityIds: []
                  })}
                  className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-[#d91b5c] font-black text-xs rounded-xl cursor-pointer shadow-xs flex items-center gap-1 uppercase border border-rose-200"
                >
                  <RotateCcw size={12} /> Reset
                </button>
              )}
            </div>

            {/* MIDDLE SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 pb-48 space-y-6">
              
              {loading ? (
                <div className="space-y-6 animate-pulse py-4">
                  <div className="w-14 h-14 bg-slate-200 rounded-full mx-auto" />
                  <div className="space-y-4 pt-2">
                    <div className="w-32 h-4 bg-slate-300 rounded-md" />
                    <div className="w-full h-11 bg-slate-200 rounded-2xl" />
                  </div>
                  <div className="space-y-4 pt-2">
                    <div className="w-40 h-4 bg-slate-300 rounded-md" />
                    <div className="w-full h-11 bg-slate-200 rounded-2xl" />
                  </div>
                  <div className="space-y-4 pt-2">
                    <div className="w-36 h-4 bg-slate-300 rounded-md" />
                    <div className="w-full h-24 bg-slate-200 rounded-2xl" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 bg-rose-50 border-2 border-rose-200 text-[#d91b5c] rounded-full flex items-center justify-center mx-auto shadow-md">
                    <Edit3 size={24} />
                  </div>

                  {/* 1. INTRODUCTION SECTION */}
                  {currentSection === 'intro' && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-extrabold uppercase text-slate-700">About Me / Bio</label>
                        <textarea 
                          rows={4} 
                          value={formData.AboutMe || ''} 
                          onChange={(e) => setFormData({ ...formData, AboutMe: e.target.value })} 
                          placeholder="Write a brief introduction about yourself, personality, interests..." 
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:border-[#d91b5c]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-extrabold uppercase text-slate-700">About My Family</label>
                        <textarea 
                          rows={4} 
                          value={formData.FamilyAbout || ''} 
                          onChange={(e) => setFormData({ ...formData, FamilyAbout: e.target.value })} 
                          placeholder="Share background about your family values, culture..." 
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:border-[#d91b5c]"
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. BASIC DETAILS SECTION */}
                  {currentSection === 'basic' && (
                    <div className="space-y-5">
                      <div className="bg-slate-50 rounded-3xl p-6 border-2 border-slate-200 shadow-xs space-y-4 text-xs font-extrabold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#d91b5c]" />
                          <span className="text-slate-500 font-bold">Full Name :</span>
                          <span className="text-slate-900">{formData.FullName}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#d91b5c]" />
                          <span className="text-slate-500 font-bold">Mobile Number :</span>
                          <span className="text-slate-900">{formData.MobileNumber}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#d91b5c]" />
                          <span className="text-slate-500 font-bold">Email Address :</span>
                          <span className="text-slate-900">{formData.Email}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#d91b5c]" />
                          <span className="text-slate-500 font-bold">Profile Created For :</span>
                          <span className="text-slate-900">{formData.ProfileCreatedForText}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#d91b5c]" />
                          <span className="text-slate-500 font-bold">Age :</span>
                          <span className="text-slate-900">{formData.Age} Years</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#d91b5c]" />
                          <span className="text-slate-500 font-bold">Gender :</span>
                          <span className="text-slate-900">{formData.Gender}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#d91b5c]" />
                          <span className="text-slate-500 font-bold">Marital Status :</span>
                          <span className="text-slate-900">{formData.MaritalStatusText}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#d91b5c]" />
                          <span className="text-slate-500 font-bold">Date of Birth :</span>
                          <span className="text-slate-900">{formData.DateOfBirthFormatted || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-center">
                        <p className="text-xs font-black text-rose-700 leading-relaxed">
                          This section can not be edited! If you want to update basic details please contact support@nikahqubool.com
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 3. PERSONAL DETAILS SECTION */}
                  {currentSection === 'personal' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <CompactSelect 
                          label="Height" 
                          options={heightOptions} 
                          value={formData.Height} 
                          onChange={(val) => setFormData({ ...formData, Height: String(val) })} 
                        />

                        <CompactSelect 
                          label="Weight" 
                          options={weightOptions} 
                          value={formData.Weight} 
                          onChange={(val) => setFormData({ ...formData, Weight: String(val) })} 
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <CompactSelect 
                          label="Sect" 
                          options={masterData.SECTS || []} 
                          value={formData.Sect} 
                          onChange={(val) => setFormData({ ...formData, Sect: val })} 
                        />

                        <CompactSelect 
                          label="Maslak" 
                          options={masterData.MASLAKS || []} 
                          value={formData.Maslak} 
                          onChange={(val) => setFormData({ ...formData, Maslak: val })} 
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <CompactSelect 
                          label="Caste" 
                          options={masterData.CASTES || []} 
                          value={formData.Caste} 
                          onChange={(val) => setFormData({ ...formData, Caste: val })} 
                        />

                        <CompactSelect 
                          label="Complexion" 
                          options={masterData.COMPLEXIONS || []} 
                          value={formData.Complexion} 
                          onChange={(val) => setFormData({ ...formData, Complexion: val })} 
                        />
                      </div>

                      <CompactSelect 
                        label="Mother Tongue" 
                        options={masterData.MOTHER_TONGUES || []} 
                        value={formData.MotherTongue} 
                        onChange={(val) => setFormData({ ...formData, MotherTongue: val })} 
                        openUpward={true}
                      />
                    </div>
                  )}

                  {/* 4. EDUCATION AND CAREER SECTION (WITH JOB DETAILS TEXTAREA) */}
                  {currentSection === 'education' && (
                    <div className="space-y-4">
                      <CompactSelect 
                        label="Highest Qualification" 
                        options={masterData.EDUCATIONS || []} 
                        value={formData.HighestDegree} 
                        onChange={(val) => setFormData({ ...formData, HighestDegree: val })} 
                      />

                      {/* ✅ College / University Name Input Field (Max 150 chars) */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-extrabold uppercase text-slate-700">College / University Name</label>
                        <input 
                          type="text"
                          maxLength={150}
                          value={formData.CollegeName || ''} 
                          onChange={(e) => setFormData({ ...formData, CollegeName: e.target.value })} 
                          placeholder="e.g. Delhi University / AMU / Jamia Millia (Max 150 chars)..." 
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 outline-none focus:border-[#d91b5c]"
                        />
                      </div>

                      <CompactSelect 
                        label="Employment Sector" 
                        options={masterData.EMPLOYMENT_SECTORS || []} 
                        value={formData.EmploymentSector} 
                        onChange={(val) => setFormData({ ...formData, EmploymentSector: val })} 
                      />

                      <CompactSelect 
                        label="Profession / Designation" 
                        options={masterData.OCCUPATIONS || []} 
                        value={formData.Designation} 
                        onChange={(val) => setFormData({ ...formData, Designation: val })} 
                      />

                      {/* ✅ Job / Occupation Details Text Area */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-extrabold uppercase text-slate-700">Job / Occupation Details</label>
                        <textarea 
                          rows={2} 
                          value={formData.OccupationDetails || ''} 
                          onChange={(e) => setFormData({ ...formData, OccupationDetails: e.target.value })} 
                          placeholder="e.g. Working as Senior Software Engineer at MNC in Delhi..." 
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:border-[#d91b5c]"
                        />
                      </div>

                      <CompactSelect 
                        label="Annual Income" 
                        options={incomeOptions} 
                        value={formData.AnnualIncome} 
                        onChange={(val) => setFormData({ ...formData, AnnualIncome: String(val) })} 
                        openUpward={true}
                      />
                    </div>
                  )}

                  {/* 5. RELIGIOUS AND LIFESTYLE SECTION */}
                  {currentSection === 'religious' && (
                    <div className="space-y-4">
                      <CompactSelect 
                        label="Diet Type" 
                        options={dietOptions} 
                        value={formData.DietType} 
                        onChange={(val) => setFormData({ ...formData, DietType: String(val) })} 
                      />

                      <CompactSelect 
                        label="Smoke Habit" 
                        options={smokeOptions} 
                        value={formData.SmokeHabit} 
                        onChange={(val) => setFormData({ ...formData, SmokeHabit: String(val) })} 
                      />

                      <CompactSelect 
                        label="Drink Habit" 
                        options={drinkOptions} 
                        value={formData.DrinkHabit} 
                        onChange={(val) => setFormData({ ...formData, DrinkHabit: String(val) })} 
                      />

                      {/* ✅ HOBBIES & INTERESTS */}
                      {masterData.HOBBIES && masterData.HOBBIES.length > 0 ? (
                        <MultiSelectDropdown 
                          label="Hobbies (Multi-Select)"
                          options={masterData.HOBBIES}
                          selectedIds={formData.Hobbies ? formData.Hobbies.split(',').map((s: string) => s.trim()).filter(Boolean) : []}
                          onChange={(ids) => setFormData({ ...formData, Hobbies: ids.join(',') })}
                        />
                      ) : (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-extrabold uppercase text-slate-700">Hobbies</label>
                          <input 
                            type="text"
                            value={formData.Hobbies || ''} 
                            onChange={(e) => setFormData({ ...formData, Hobbies: e.target.value })} 
                            placeholder="e.g. Reading, Cooking, Traveling, Photography..." 
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 outline-none focus:border-[#d91b5c]"
                          />
                        </div>
                      )}

                      {masterData.INTERESTS && masterData.INTERESTS.length > 0 ? (
                        <MultiSelectDropdown 
                          label="Interests (Multi-Select)"
                          options={masterData.INTERESTS}
                          selectedIds={formData.Interests ? formData.Interests.split(',').map((s: string) => s.trim()).filter(Boolean) : []}
                          onChange={(ids) => setFormData({ ...formData, Interests: ids.join(',') })}
                          openUpward={true}
                        />
                      ) : (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-extrabold uppercase text-slate-700">Interests</label>
                          <input 
                            type="text"
                            value={formData.Interests || ''} 
                            onChange={(e) => setFormData({ ...formData, Interests: e.target.value })} 
                            placeholder="e.g. Technology, Art, Sports, Nature..." 
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 outline-none focus:border-[#d91b5c]"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6. ADDRESS SECTION (CURRENT & NATIVE LOCATION) */}
                  {currentSection === 'address' && (
                    <div className="space-y-5">
                      <div className="p-4 bg-[#d91b5c]/5 rounded-2xl border border-[#d91b5c]/20 font-bold text-xs text-[#d91b5c] uppercase tracking-wider">
                        Current Location
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <CompactSelect 
                          label="Current State" 
                          options={masterData.STATES || []} 
                          value={formData.CurrentStateId} 
                          onChange={(val) => {
                            const newStateId = Number(val);
                            setFormData((prev: any) => ({ ...prev, CurrentStateId: newStateId, CurrentCityId: 0, CityName: '' }));
                          }} 
                        />

                        <CompactSelect 
                          label="Current City" 
                          options={masterData.CITIES || []} 
                          value={formData.CurrentCityId} 
                          onChange={(val) => setFormData({ ...formData, CurrentCityId: Number(val) })} 
                        />
                      </div>

                      <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
                        Native Place / Hometown Location
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <CompactSelect 
                          label="Native State" 
                          options={masterData.STATES || []} 
                          value={formData.NativePlaceStateId} 
                          onChange={(val) => {
                            const newStateId = Number(val);
                            setFormData((prev: any) => ({ ...prev, NativePlaceStateId: newStateId, NativePlaceCityId: 0, NativeCityName: '' }));
                          }} 
                          openUpward={true}
                        />

                        <CompactSelect 
                          label="Native City" 
                          options={masterData.NATIVE_CITIES || []} 
                          value={formData.NativePlaceCityId} 
                          onChange={(val) => setFormData({ ...formData, NativePlaceCityId: Number(val) })} 
                          openUpward={true}
                        />
                      </div>
                    </div>
                  )}

                  {/* 7. FAMILY DETAILS SECTION */}
                  {currentSection === 'family' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <CompactSelect 
                          label="Family Type" 
                          options={masterData.FAMILY_TYPES || []} 
                          value={formData.FamilyType} 
                          onChange={(val) => setFormData({ ...formData, FamilyType: val })} 
                        />

                        <CompactSelect 
                          label="Family Status" 
                          options={masterData.FAMILY_STATUS || []} 
                          value={formData.FamilyStatus} 
                          onChange={(val) => setFormData({ ...formData, FamilyStatus: val })} 
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-tight mb-1">Father's Name</label>
                          <input
                            type="text"
                            placeholder="Enter Father's Name"
                            value={formData.FatherName || ''}
                            onChange={(e) => setFormData({ ...formData, FatherName: e.target.value })}
                            className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl focus:border-[#d91b5c] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-tight mb-1">Mother's Name</label>
                          <input
                            type="text"
                            placeholder="Enter Mother's Name"
                            value={formData.MotherName || ''}
                            onChange={(e) => setFormData({ ...formData, MotherName: e.target.value })}
                            className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl focus:border-[#d91b5c] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <CompactSelect 
                          label="Father's Occupation" 
                          options={masterData.OCCUPATIONS || []} 
                          value={formData.FatherOccupationId || formData.FatherOccupation} 
                          onChange={(val) => setFormData({ ...formData, FatherOccupationId: Number(val), FatherOccupation: String(val) })} 
                        />

                        <CompactSelect 
                          label="Mother's Occupation" 
                          options={masterData.OCCUPATIONS || []} 
                          value={formData.MotherOccupationId || formData.MotherOccupation} 
                          onChange={(val) => setFormData({ ...formData, MotherOccupationId: Number(val), MotherOccupation: String(val) })} 
                          openUpward={true}
                        />
                      </div>

                      {/* BROTHER / SISTER COUNT DROPDOWNS WITH AUTO-UPWARD POSITIONING */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <CompactSelect 
                          label="Total Brothers" 
                          options={countOptions} 
                          value={formData.TotalBrothers} 
                          onChange={(val) => setFormData({ ...formData, TotalBrothers: Number(val) })} 
                          openUpward={true}
                        />
                        <CompactSelect 
                          label="Married Brothers" 
                          options={countOptions} 
                          value={formData.MarriedBrothers} 
                          onChange={(val) => setFormData({ ...formData, MarriedBrothers: Number(val) })} 
                          openUpward={true}
                        />
                        <CompactSelect 
                          label="Total Sisters" 
                          options={countOptions} 
                          value={formData.TotalSisters} 
                          onChange={(val) => setFormData({ ...formData, TotalSisters: Number(val) })} 
                          openUpward={true}
                        />
                        <CompactSelect 
                          label="Married Sisters" 
                          options={countOptions} 
                          value={formData.MarriedSisters} 
                          onChange={(val) => setFormData({ ...formData, MarriedSisters: Number(val) })} 
                          openUpward={true}
                        />
                      </div>
                    </div>
                  )}

                  {/* 8. PARTNER PREFERENCES SECTION */}
                  {currentSection === 'partner' && (
                    <div className="space-y-5">
                      <MultiSelectDropdown 
                        label="Preferred Marital Status (Multi-Select)" 
                        options={masterData.MARITAL_STATUS || []} 
                        selectedIds={partnerPref.maritalStatusList} 
                        onChange={(ids) => setPartnerPref({ ...partnerPref, maritalStatusList: ids })} 
                      />

                      <MultiSelectDropdown 
                        label="Preferred Education (Multi-Select)" 
                        options={masterData.EDUCATIONS || []} 
                        selectedIds={partnerPref.educationIds} 
                        onChange={(ids) => setPartnerPref({ ...partnerPref, educationIds: ids })} 
                      />

                      <MultiSelectDropdown 
                        label="Preferred Occupation (Multi-Select)" 
                        options={masterData.OCCUPATIONS || []} 
                        selectedIds={partnerPref.occupationIds} 
                        onChange={(ids) => setPartnerPref({ ...partnerPref, occupationIds: ids })} 
                      />

                      <MultiSelectDropdown 
                        label="Preferred Caste (Multi-Select)" 
                        options={masterData.CASTES || []} 
                        selectedIds={partnerPref.casteIds} 
                        onChange={(ids) => setPartnerPref({ ...partnerPref, casteIds: ids })} 
                      />

                      <MultiSelectDropdown 
                        label="Preferred Mother Tongue (Multi-Select)" 
                        options={masterData.MOTHER_TONGUES || []} 
                        selectedIds={partnerPref.languageIds} 
                        onChange={(ids) => setPartnerPref({ ...partnerPref, languageIds: ids })} 
                      />

                      {/* ✅ MULTI-SELECT STATE AND CITY */}
                      <MultiSelectDropdown 
                        label="Preferred States (Multi-Select)" 
                        options={masterData.STATES || []} 
                        selectedIds={partnerPref.stateIds || []} 
                        onChange={(ids) => setPartnerPref({ ...partnerPref, stateIds: ids, cityIds: [] })} 
                      />

                      <MultiSelectDropdown 
                        label="Preferred Cities (Multi-Select)" 
                        options={masterData.PREF_CITIES || []} 
                        selectedIds={partnerPref.cityIds || []} 
                        onChange={(ids) => setPartnerPref({ ...partnerPref, cityIds: ids })} 
                      />

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-extrabold uppercase text-slate-700">Partner Expectations & Requirements</label>
                        <textarea 
                          rows={4} 
                          value={formData.PartnerExpectations || ''} 
                          onChange={(e) => setFormData({ ...formData, PartnerExpectations: e.target.value })} 
                          placeholder="Describe specific qualities, values, or family expectations you are looking for in a partner..." 
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:border-[#d91b5c]"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>

            {/* FIXED BOTTOM SAVE BUTTON */}
            {currentSection !== 'basic' && (
              <div className="sticky bottom-0 z-30 p-4 bg-white border-t border-rose-100 flex-shrink-0 shadow-lg">
                <button 
                  type="button" 
                  onClick={handleSaveProfileSection} 
                  disabled={saving} 
                  className="w-full py-4 rounded-2xl bg-[#d91b5c] hover:bg-[#e11d48] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2 cursor-pointer transition-all border border-rose-300/30 active:scale-98"
                >
                  {saving ? <Loader2 size={16} className="animate-spin text-amber-300" /> : <Save size={16} className="text-amber-300" />}
                  <span>Save</span>
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
