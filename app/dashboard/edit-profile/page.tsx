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

    // Section 1: Intro
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

    // Section 6: Address
    CurrentStateId: 0,
    StateName: '',
    CurrentCityId: 0,
    CityName: '',

    // Section 7: Family Details
    FamilyType: 1,
    FamilyStatus: 1,
    FatherOccupation: 'Business Owner',
    MotherOccupation: 'Homemaker',
    TotalBrothers: 0,
    MarriedBrothers: 0,
    TotalSisters: 0,
    MarriedSisters: 0
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
        'OCCUPATIONS', 'STATES', 'FAMILY_TYPES', 'FAMILY_STATUS', 'Complexion'
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

  // Cities for Address Section (Fetches dynamically on state change)
  useEffect(() => {
    if (formData.CurrentStateId > 0) {
      fetchCitiesApi(formData.CurrentStateId).then(cities => setMasterData(prev => ({ ...prev, CITIES: cities })));
    } else {
      setMasterData(prev => ({ ...prev, CITIES: [] }));
    }
  }, [formData.CurrentStateId]);

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
        MobileNumber: getValidText(p.mobileNumber || p.MobileNumber, '+919876543210'),
        Email: getValidText(p.email || p.Email, 'user@pakizarishte.com'),
        ProfileCreatedFor: getValidId(p.profileCreatedForId ?? p.ProfileCreatedForId, p.profileCreatedFor, currentMasters.PROFILE_CREATED_FOR, 1),
        ProfileCreatedForText: getValidText(p.profileCreatedFor || p.ProfileCreatedFor, 'Self'),
        Age: p.age || 24,
        Gender: getValidText(p.gender || p.Gender, 'Female'),
        DateOfBirth: parsedDob,
        DateOfBirthFormatted: p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A',
        PhotoUrl: getOptimizedImageUrl(p.mainPhotoUrl || p.photoUrl),

        FamilyAbout: p.familyAbout || p.aboutFamily || '',
        Height: getValidText(p.height || p.Height, '5 ft 6 in'),
        Weight: getValidText(p.weight || p.Weight, '60 kg'),
        Complexion: getValidId(p.complexionId ?? p.ComplexionId, p.complexion, currentMasters.COMPLEXIONS, 1),
        MaritalStatus: getValidId(p.maritalStatusId ?? p.MaritalStatusId, p.maritalStatus, currentMasters.MARITAL_STATUS, 1),
        MaritalStatusText: getValidText(p.maritalStatus || p.MaritalStatus, 'Never Married'),
        Sect: getValidId(p.sectId ?? p.SectId, p.sect, currentMasters.SECTS, 1),
        SectText: getValidText(p.sect || p.Sect, 'Sunni'),
        Caste: getValidId(p.casteId ?? p.CasteId, p.caste, currentMasters.CASTES, 1),
        CasteText: getValidText(p.caste || p.Caste, 'General'),
        MotherTongue: getValidId(p.motherTongueId ?? p.MotherTongueId, p.motherTongue, currentMasters.MOTHER_TONGUES, 1),
        MotherTongueText: getValidText(p.motherTongue || p.MotherTongue, 'Hindi'),

        HighestDegree: getValidId(p.highestDegreeId ?? p.HighestDegreeId, p.highestDegree, currentMasters.EDUCATIONS, 1),
        HighestDegreeText: getValidText(p.highestDegree || p.HighestDegree, 'Graduate'),
        CollegeName: p.collegeName || p.CollegeName || '',
        EmploymentSector: getValidId(p.employmentSectorId ?? p.EmploymentSectorId, p.employmentSector, currentMasters.EMPLOYMENT_SECTORS, 1),
        Designation: getValidId(p.designationId ?? p.DesignationId, p.designation, currentMasters.OCCUPATIONS, 1),
        DesignationText: getValidText(p.designation || p.Designation, 'Professional'),
        OccupationDetails: p.occupationDetails || p.OccupationDetails || '',
        AnnualIncome: getValidText(p.annualIncome || p.AnnualIncome, '5 - 10 LPA'),

        DietType: getValidText(p.dietType || p.DietType, 'Halal Only'),
        SmokeHabit: getValidText(p.smokeHabit || p.SmokeHabit, 'No'),
        DrinkHabit: getValidText(p.drinkHabit || p.DrinkHabit, 'No'),

        CurrentStateId: Number(p.currentStateId ?? p.CurrentStateId ?? 0),
        StateName: getValidText(p.currentStateName || p.stateName, 'State N/A'),
        CurrentCityId: Number(p.currentCityId ?? p.CurrentCityId ?? 0),
        CityName: getValidText(p.currentCityName || p.cityName, 'City N/A'),

        FamilyType: getValidId(p.familyTypeId ?? p.FamilyTypeId, p.familyType, currentMasters.FAMILY_TYPES, 1),
        FamilyStatus: getValidId(p.familyStatusId ?? p.FamilyStatusId, p.familyStatus, currentMasters.FAMILY_STATUS, 1),
        FatherOccupation: getValidText(p.fatherOccupation || p.FatherOccupation, 'Business Owner'),
        MotherOccupation: getValidText(p.motherOccupation || p.MotherOccupation, 'Homemaker'),
        TotalBrothers: Number(p.totalBrothers || 0),
        MarriedBrothers: Number(p.marriedBrothers || 0),
        TotalSisters: Number(p.totalSisters || 0),
        MarriedSisters: Number(p.marriedSisters || 0)
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
      if (res.success) {
        toast.success("Partner preferences saved successfully!");
        await loadUserData();
        setMobileSubScreenOpen(false);
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
      HighestDegree: masterData.EDUCATIONS,
      EmploymentSector: masterData.EMPLOYMENT_SECTORS,
      Designation: masterData.OCCUPATIONS,
      CurrentStateId: masterData.STATES,
      CurrentCityId: masterData.CITIES,
      FamilyType: masterData.FAMILY_TYPES,
      FamilyStatus: masterData.FAMILY_STATUS,
      Complexion: masterData.COMPLEXIONS,
      ProfileCreatedFor: masterData.PROFILE_CREATED_FOR
    };

    const uiOnlyKeys = [
      'DateOfBirthFormatted', 'MaritalStatusText', 'SectText', 'CasteText', 
      'MotherTongueText', 'HighestDegreeText', 'DesignationText', 'StateName', 
      'CityName', 'NamazHabit', 'HijabOrBeard', 'Age', 'MobileNumber', 'ProfileCreatedForText', 'PhotoUrl'
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
      setMobileSubScreenOpen(false);
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-[#870c3f] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 space-y-0 md:space-y-6 md:pt-4">
        
        {/* RESPONSIVE CONTAINER */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-6 items-start">
          
          {/* SIDEBAR OVERVIEW */}
          <div className={`md:col-span-4 lg:col-span-4 bg-white md:rounded-3xl p-0 md:p-5 border-0 md:border-2 md:border-rose-100 shadow-none md:shadow-xl space-y-0 md:space-y-4 ${mobileSubScreenOpen ? 'hidden md:block' : 'block'}`}>
            
            <div className="bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] p-4 text-white flex items-center justify-between shadow-md md:hidden sticky top-0 z-30">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => router.push('/dashboard/my-profile')} className="p-1.5 hover:bg-white/20 rounded-full cursor-pointer">
                  <ArrowLeft size={20} />
                </button>
                <h1 className="font-serif font-black text-base uppercase tracking-wider text-white">Edit My Profile</h1>
              </div>
              <button type="button" onClick={() => router.push('/dashboard/my-profile')} className="p-1.5 hover:bg-white/20 rounded-full cursor-pointer">
                <Eye size={18} className="text-amber-300" />
              </button>
            </div>

            {/* AVATAR CARD */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white flex items-center gap-4 shadow-lg border-b md:border border-rose-300/30 md:rounded-2xl">
              <div className="relative flex-shrink-0">
                <img 
                  src={formData.PhotoUrl} 
                  alt="Avatar" 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover object-top border-2 border-white shadow-md"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                />
                <button 
                  type="button" 
                  onClick={() => router.push('/dashboard/gallery')} 
                  className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-xl bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-tight shadow-md hover:scale-105 transition-transform cursor-pointer flex items-center gap-1 border border-amber-300"
                >
                  <Plus size={12} className="stroke-[3]" /> Add Photos
                </button>
              </div>

              <div className="space-y-0.5 min-w-0">
                <h3 className="font-serif font-extrabold text-base sm:text-lg truncate uppercase tracking-tight text-white">{formData.FullName}</h3>
                <p className="text-[11px] font-bold text-rose-100 truncate">{formData.Age} yrs | {formData.MaritalStatusText} | {formData.StateName}</p>
              </div>
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
                        ? 'bg-rose-50/80 border-[#870c3f] text-[#870c3f] shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`p-2.5 rounded-xl border ${isActive ? 'bg-[#870c3f] text-white border-[#870c3f]' : 'bg-rose-50 text-[#870c3f] border-rose-100'}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <span className="font-black text-xs block uppercase tracking-tight">{item.label}</span>
                        <span className="text-[10px] font-semibold text-slate-500 block truncate">{item.desc}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className={`transition-transform ${isActive ? 'translate-x-1 text-[#870c3f]' : 'text-slate-400 group-hover:translate-x-1'}`} />
                  </div>
                );
              })}
            </div>

          </div>

          {/* FORM CONTAINER WITH EXTRA BOTTOM PADDING (pb-48 TO PREVENT DROPDOWN CLIPPING) */}
          <div className={`fixed inset-0 z-[500] bg-white flex flex-col md:relative md:inset-auto md:z-auto md:col-span-8 lg:col-span-8 md:bg-white md:rounded-3xl md:border-2 md:border-rose-100 md:shadow-xl md:overflow-hidden md:max-h-[85vh] ${!mobileSubScreenOpen ? 'hidden md:flex' : 'flex'}`}>
            
            {/* FIXED TOP HEADER */}
            <div className="sticky top-0 z-30 p-4 bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white flex items-center justify-between shadow-md flex-shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => setMobileSubScreenOpen(false)} 
                  className="p-1.5 hover:bg-white/20 rounded-full cursor-pointer md:hidden text-white"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className="font-serif font-black text-base uppercase tracking-wider text-white">
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
                  className="px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-xl hover:bg-amber-500 cursor-pointer shadow-xs flex items-center gap-1 uppercase"
                >
                  <RotateCcw size={12} /> Reset
                </button>
              )}
            </div>

            {/* MIDDLE SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 pb-48 space-y-6">
              
              {loading ? (
                <div className="py-20 text-center text-[#870c3f]">
                  <Loader2 size={42} className="animate-spin mx-auto mb-2 text-[#870c3f]" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">Loading Section Data...</span>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 bg-rose-50 border-2 border-rose-200 text-[#870c3f] rounded-full flex items-center justify-center mx-auto shadow-md">
                    <Edit3 size={24} />
                  </div>

                  {/* 1. INTRODUCTION SECTION */}
                  {currentSection === 'intro' && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-extrabold uppercase text-slate-700">About My Family</label>
                        <textarea 
                          rows={5} 
                          value={formData.FamilyAbout} 
                          onChange={(e) => setFormData({ ...formData, FamilyAbout: e.target.value })} 
                          placeholder="Share background about your family values, culture..." 
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:border-[#870c3f]"
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. BASIC DETAILS SECTION */}
                  {currentSection === 'basic' && (
                    <div className="space-y-5">
                      <div className="bg-slate-50 rounded-3xl p-6 border-2 border-slate-200 shadow-xs space-y-4 text-xs font-extrabold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#870c3f]" />
                          <span className="text-slate-500 font-bold">Full Name :</span>
                          <span className="text-slate-900">{formData.FullName}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#870c3f]" />
                          <span className="text-slate-500 font-bold">Mobile Number :</span>
                          <span className="text-slate-900">{formData.MobileNumber}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#870c3f]" />
                          <span className="text-slate-500 font-bold">Email Address :</span>
                          <span className="text-slate-900">{formData.Email}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#870c3f]" />
                          <span className="text-slate-500 font-bold">Profile Created For :</span>
                          <span className="text-slate-900">{formData.ProfileCreatedForText}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#870c3f]" />
                          <span className="text-slate-500 font-bold">Age :</span>
                          <span className="text-slate-900">{formData.Age} Years</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#870c3f]" />
                          <span className="text-slate-500 font-bold">Gender :</span>
                          <span className="text-slate-900">{formData.Gender}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#870c3f]" />
                          <span className="text-slate-500 font-bold">Marital Status :</span>
                          <span className="text-slate-900">{formData.MaritalStatusText}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#870c3f]" />
                          <span className="text-slate-500 font-bold">Date of Birth :</span>
                          <span className="text-slate-900">{formData.DateOfBirthFormatted || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-center">
                        <p className="text-xs font-black text-rose-700 leading-relaxed">
                          This section can not be edited! If you want to update basic details please contact support@pakizarishte.com
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

                      <CompactSelect 
                        label="Sect" 
                        options={masterData.SECTS || []} 
                        value={formData.Sect} 
                        onChange={(val) => setFormData({ ...formData, Sect: val })} 
                      />

                      <CompactSelect 
                        label="Caste" 
                        options={masterData.CASTES || []} 
                        value={formData.Caste} 
                        onChange={(val) => setFormData({ ...formData, Caste: val })} 
                      />

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
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 outline-none focus:border-[#870c3f]"
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
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-900 outline-none focus:border-[#870c3f]"
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
                        openUpward={true}
                      />
                    </div>
                  )}

                  {/* 6. ADDRESS SECTION (DYNAMIC STATE-CITY SELECTION) */}
                  {currentSection === 'address' && (
                    <div className="space-y-4">
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
                        onChange={(val) => setFormData({ ...formData, CurrentCityId: val })} 
                        openUpward={true}
                      />
                    </div>
                  )}

                  {/* 7. FAMILY DETAILS SECTION (WITH OPEN-UPWARD DROPDOWNS) */}
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

                      <CompactSelect 
                        label="Father's Occupation" 
                        options={masterData.OCCUPATIONS || []} 
                        value={formData.FatherOccupation} 
                        onChange={(val) => setFormData({ ...formData, FatherOccupation: String(val) })} 
                      />

                      <CompactSelect 
                        label="Mother's Occupation" 
                        options={masterData.OCCUPATIONS || []} 
                        value={formData.MotherOccupation} 
                        onChange={(val) => setFormData({ ...formData, MotherOccupation: String(val) })} 
                        openUpward={true}
                      />

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

                  {/* 8. PARTNER PREFERENCES SECTION (MULTI-SELECT STATE & CITY) */}
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
                        openUpward={true}
                      />

                      <MultiSelectDropdown 
                        label="Preferred Cities (Multi-Select)" 
                        options={masterData.PREF_CITIES || []} 
                        selectedIds={partnerPref.cityIds || []} 
                        onChange={(ids) => setPartnerPref({ ...partnerPref, cityIds: ids })} 
                        openUpward={true}
                      />
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
                  className="w-full py-4 rounded-2xl bg-[#870c3f] hover:bg-[#9e0f4a] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2 cursor-pointer transition-all border border-rose-300/30 active:scale-98"
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