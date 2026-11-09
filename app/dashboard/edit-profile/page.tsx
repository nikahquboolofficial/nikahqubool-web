"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Eye, Shield, CheckCircle2, ChevronRight, Search, 
  Camera, Plus, Trash2, Lock, Sparkles, AlertCircle, 
  ArrowLeft, Upload, FileText, Check, Loader2, Star
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

export default function EditMyProfilePage() {
  const router = useRouter();

  // Loading & Saving States
  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState<string | null>(null);

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
    Height: '5ft 7in (170 cm)',
    Weight: '60 kg',
    Caste: 'Sheikh or Shaikh',
    CasteId: 1,
    Maslak: 'Sunni Hanfi',
    MaslakId: 1,
    MotherTongue: 'Urdu',
    MotherTongueId: 1,
    Location: 'Bareilly, Uttar Pradesh, India',
    CurrentStateId: 2,
    CurrentCityId: 1,
    StateName: 'Uttar Pradesh',
    CityName: 'Bareilly',
    Disability: 'No',

    // Education & Career
    Education: 'B.Com.',
    EducationId: 1,
    CollegeName: 'Regional college Of Professional Studies & Research Bareilly',
    EmployedIn: 'Not Working',
    EmployedInId: 1,
    Occupation: 'Not working',
    OccupationId: 1,
    AnnualIncome: 'No Income',

    // Family
    FamilyLocation: 'Bareilly, Uttar Pradesh, India',
    FamilyType: 'Joint Family',
    FamilyTypeId: 1,
    FamilyValues: 'Moderate',
    FamilyValuesId: 1,
    FatherOccupation: 'Businessman',
    MotherOccupation: 'Homemaker',
    TotalBrothers: 1,
    MarriedBrothers: 0,
    TotalSisters: 1,
    MarriedSisters: 1,

    // Religious & Lifestyle
    NamazHabit: 'Regular 5 Times',
    HijabOrBeard: 'Hijab',
    DietType: 'Halal Only',
    SmokeHabit: 'No',
    DrinkHabit: 'No',

    // Bio
    AboutMe: 'Alhamdulillah, we are a well-established and educated family rooted in strong moral values. We prefer a simple, meaningful, and dignified Nikah ceremony built on mutual understanding and respect, rather than customary demands.',

    // Privacy & Verification
    PhotoPrivacy: 'Premium Members',
    GovtIdDocUrl: '',
    IsGovtIdVerified: false,
  });

  // Photos List (Max 4 slots)
  const [photos, setPhotos] = useState<Array<{ photoId: number; photoUrl: string; isMain: boolean; privacy?: string }>>([]);
  const [uploadingPhotoSlot, setUploadingPhotoSlot] = useState<number | null>(null);

  // Master Data Cache
  const [masterData, setMasterData] = useState<{ [key: string]: MasterOption[] }>({});
  const [cities, setCities] = useState<MasterOption[]>([]);

  // Active Bottom Sheet / Subscreen
  // 'bio' | 'height' | 'option' | 'location' | 'text' | 'counters' | 'photoPrivacy' | 'trustBadge' | null
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [sheetTitle, setSheetTitle] = useState('');
  const [sheetSearch, setSheetSearch] = useState('');
  const [sheetOptions, setSheetOptions] = useState<Array<{ id: any; value: string; desc?: string }>>([]);
  const [selectedSheetValue, setSelectedSheetValue] = useState<any>('');
  const [sheetFieldKey, setSheetFieldKey] = useState<string>('');

  // Height Slider Substate
  const [heightCm, setHeightCm] = useState(170);

  // Bio Substate
  const [bioDraft, setBioDraft] = useState('');

  // Location Substate
  const [selectedStateId, setSelectedStateId] = useState<number>(2);
  const [selectedCityId, setSelectedCityId] = useState<number>(1);
  const [stateCities, setStateCities] = useState<MasterOption[]>([]);
  const [locationSearch, setLocationSearch] = useState('');

  // Trust Badge Substate
  const [govtDocFile, setGovtDocFile] = useState<File | null>(null);
  const [govtDocPreview, setGovtDocPreview] = useState<string>('');
  const [uploadingGovtDoc, setUploadingGovtDoc] = useState(false);

  // Initial Load & Hydration
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        const [profileRes, mastersRes] = await Promise.all([
          fetchProfileDetailsApi(0, token),
          fetchMasterDataApi()
        ]);

        if (mastersRes) {
          setMasterData(mastersRes);
        }

        if (profileRes?.success && profileRes?.data) {
          const p = profileRes.data.profile || profileRes.data.Profile || profileRes.data;
          const g = profileRes.data.gallery || profileRes.data.Gallery || [];

          setFormData((prev: any) => ({
            ...prev,
            UserId: p.userId || p.UserId || 0,
            FullName: p.fullName || p.FullName || prev.FullName,
            ProfileCreatedFor: p.profileCreatedForName || p.profileCreatedFor || prev.ProfileCreatedFor,
            Age: p.age || prev.Age,
            Gender: p.gender || p.Gender || prev.Gender,
            DateOfBirth: p.dateOfBirth || prev.DateOfBirth,
            MaritalStatus: p.maritalStatusName || p.maritalStatus || prev.MaritalStatus,
            Sect: p.sectName || p.sect || prev.Sect,
            Height: p.height || p.Height || prev.Height,
            Weight: p.weight || p.Weight || prev.Weight,
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
            Education: p.highestDegreeName || p.highestDegree || prev.Education,
            EducationId: p.highestDegreeId || prev.EducationId,
            CollegeName: p.collegeName || p.CollegeName || prev.CollegeName,
            EmployedIn: p.employmentSectorName || p.employmentSector || prev.EmployedIn,
            EmployedInId: p.employmentSectorId || prev.EmployedInId,
            Occupation: p.designationName || p.designation || prev.Occupation,
            OccupationId: p.designationId || prev.OccupationId,
            AnnualIncome: p.annualIncome || p.AnnualIncome || prev.AnnualIncome,

            // Family
            FamilyLocation: `${p.nativeCityName || p.currentCityName || 'Bareilly'}, ${p.nativeStateName || p.currentStateName || 'Uttar Pradesh'}, India`,
            FamilyType: p.familyTypeName || (p.familyType === 1 ? 'Joint Family' : 'Nuclear Family') || prev.FamilyType,
            FamilyTypeId: p.familyType || prev.FamilyTypeId,
            FamilyValues: p.familyValuesName || (p.familyValues === 1 ? 'Traditional' : 'Moderate') || prev.FamilyValues,
            FamilyValuesId: p.familyValues || prev.FamilyValuesId,
            FatherOccupation: p.fatherOccupation || prev.FatherOccupation,
            MotherOccupation: p.motherOccupation || prev.MotherOccupation,
            TotalBrothers: p.totalBrothers ?? prev.TotalBrothers,
            MarriedBrothers: p.marriedBrothers ?? prev.MarriedBrothers,
            TotalSisters: p.totalSisters ?? prev.TotalSisters,
            MarriedSisters: p.marriedSisters ?? prev.MarriedSisters,

            // Religious & Lifestyle
            NamazHabit: p.namazHabit || prev.NamazHabit,
            HijabOrBeard: p.hijabOrBeard || prev.HijabOrBeard,
            DietType: p.dietType || prev.DietType,
            SmokeHabit: p.smokeHabit || prev.SmokeHabit,
            DrinkHabit: p.drinkHabit || prev.DrinkHabit,

            // Bio
            AboutMe: p.aboutMe || prev.AboutMe,

            // Privacy & Doc
            PhotoPrivacy: p.photoPrivacy || p.PhotoPrivacy || 'Premium Members',
            GovtIdDocUrl: p.govtIdDocUrl || p.GovtIdDocUrl || '',
            IsGovtIdVerified: Boolean(p.isGovtIdVerified || p.IsGovtIdVerified),
          }));

          // Set photos
          const rawPhotos: any[] = [];
          if (p.photoUrl || p.PhotoUrl) {
            rawPhotos.push({
              photoId: 1,
              photoUrl: p.photoUrl || p.PhotoUrl,
              isMain: true,
              privacy: p.photoPrivacy || 'Premium Members'
            });
          }
          if (Array.isArray(g)) {
            g.forEach((gp: any) => {
              const url = gp.photoUrl || gp.PhotoUrl;
              if (url && !rawPhotos.some(rp => rp.photoUrl === url)) {
                rawPhotos.push({
                  photoId: gp.photoId || gp.PhotoId || Date.now(),
                  photoUrl: url,
                  isMain: Boolean(gp.isMain || gp.IsMain),
                  privacy: gp.visibilityPermission || 'Premium Members'
                });
              }
            });
          }
          setPhotos(rawPhotos);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  // Load cities whenever state changes
  useEffect(() => {
    if (selectedStateId > 0) {
      fetchCitiesApi(selectedStateId).then(res => {
        if (Array.isArray(res)) setStateCities(res);
      });
    }
  }, [selectedStateId]);

  // Update Field Handler (Universal & Instant)
  const saveFieldValue = async (field: string, value: any, extraFields: Record<string, any> = {}) => {
    const token = getAuthToken();
    if (!token) return;

    setSavingField(field);
    try {
      const fd = new FormData();
      fd.append("UserId", String(formData.UserId || 0));
      fd.append(field, String(value));
      Object.entries(extraFields).forEach(([k, v]) => fd.append(k, String(v)));

      const res = await updateProfileApi(fd, token);
      if (res.success) {
        setFormData((prev: any) => ({
          ...prev,
          [field]: value,
          ...extraFields
        }));
        toast.success("Updated successfully!");
        setActiveSheet(null);
      } else {
        toast.error(res.message || "Failed to update.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSavingField(null);
    }
  };

  // Open Standard Option Bottom Sheet
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
  const openLocationSheet = () => {
    setSelectedStateId(formData.CurrentStateId || 2);
    setSelectedCityId(formData.CurrentCityId || 1);
    setLocationSearch('');
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

    saveFieldValue('CurrentStateId', selectedStateId, {
      CurrentCityId: selectedCityId,
      Location: locText,
      StateName: sName,
      CityName: cName
    });
  };

  // Save Option Selection
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
    } else if (sheetFieldKey === 'AnnualIncome') {
      saveFieldValue('AnnualIncome', selectedObj.value);
    } else if (sheetFieldKey === 'Caste') {
      saveFieldValue('Caste', selectedObj.id, { CasteText: selectedObj.value });
    } else if (sheetFieldKey === 'Maslak') {
      saveFieldValue('Maslak', selectedObj.id, { MaslakText: selectedObj.value });
    } else if (sheetFieldKey === 'MotherTongue') {
      saveFieldValue('MotherTongue', selectedObj.id, { MotherTongueText: selectedObj.value });
    } else if (sheetFieldKey === 'Disability') {
      saveFieldValue('Disability', selectedObj.value);
    } else if (sheetFieldKey === 'FamilyType') {
      saveFieldValue('FamilyType', selectedObj.id, { FamilyType: selectedObj.value });
    } else if (sheetFieldKey === 'FamilyValues') {
      saveFieldValue('FamilyValues', selectedObj.id, { FamilyValues: selectedObj.value });
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
      if (res.success) {
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

    // Check non-image extensions
    const invalidExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.iso', '.zip', '.rar', '.exe', '.tar', '.gz'];
    const nameLower = file.name.toLowerCase();
    if (invalidExts.some(ext => nameLower.endsWith(ext))) {
      toast.error("Invalid file format. Please select an image (JPG, PNG, WEBP, AVIF, HEIC, etc.). Documents or ISO files cannot be uploaded as photos.");
      return;
    }

    setUploadingPhotoSlot(slotIdx);
    const token = getAuthToken();

    try {
      // 1. Convert to dataUrl and validate client-side face
      const dataUrl: string = await new Promise((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.readAsDataURL(file);
      });

      const faceCheck = await clientValidateSingleFace(dataUrl);
      if (!faceCheck.isValid) {
        toast.error(faceCheck.errorMessage || "Please select a clear photo showing a human face.");
        return;
      }

      // 2. Upload to Cloudflare R2
      const ext = file.name.split('.').pop() || 'jpg';
      const upRes = await fetch("/api/face-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload-photo-r2",
          photoBase64: dataUrl,
          userId: formData.UserId || 0,
          ext,
          mimeType: file.type || "image/jpeg"
        })
      });
      const upJson = await upRes.json();

      if (!upJson?.success || !upJson?.photoUrl) {
        toast.error("Failed to upload photo to storage. Please try again.");
        return;
      }

      const uploadedCdnUrl = upJson.photoUrl;

      // 3. Save to backend
      if (slotIdx === 0) {
        const fd = new FormData();
        fd.append("UserId", String(formData.UserId || 0));
        fd.append("PhotoUrl", uploadedCdnUrl);
        fd.append("PhotoPrivacy", formData.PhotoPrivacy || 'All Members');
        const res = await updateProfileApi(fd, token);

        if (res.success) {
          setPhotos(prev => {
            const next = [...prev];
            const mainObj = { photoId: 1, photoUrl: uploadedCdnUrl, isMain: true, privacy: formData.PhotoPrivacy };
            if (next.length > 0) next[0] = mainObj;
            else next.push(mainObj);
            return next;
          });
          toast.success("Profile photo updated successfully!");
        } else {
          toast.error(res.message || "Failed to update profile photo.");
        }
      } else {
        const gfd = new FormData();
        gfd.append("Photo", file);
        gfd.append("Privacy", formData.PhotoPrivacy || 'All Members');
        const res = await uploadGalleryPhotoApi(gfd, token);

        if (res.success) {
          setPhotos(prev => [
            ...prev,
            { photoId: res.data?.photoId || Date.now(), photoUrl: uploadedCdnUrl, isMain: false, privacy: formData.PhotoPrivacy }
          ]);
          toast.success("Gallery photo uploaded successfully!");
        } else {
          toast.error(res.message || "Failed to upload gallery photo.");
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to process photo.");
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

      // If photo has photoId in DB, delete it
      if (photoId > 0) {
        if (index === 0 && remaining.length > 0) {
          // Promote new first photo (slot 1) to main
          const nextPhotoId = Number(remaining[0].photoId || remaining[0].PhotoId || 0);
          if (nextPhotoId > 0) {
            await setMainPhotoApi(nextPhotoId, token);
          }
        }
        const delRes = await deleteGalleryPhotoApi(photoId, token);
        if (!delRes.success && remaining.length === 0) {
          // Fallback if backend SP blocks deleting only main photo
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
      const fd = new FormData();
      fd.append("document", govtDocFile);
      const res = await uploadGovtDocumentApi(fd, token);
      if (res.success) {
        setFormData((prev: any) => ({
          ...prev,
          GovtIdDocUrl: govtDocPreview,
          IsGovtIdVerified: false // sent for approval
        }));
        toast.success("Govt ID uploaded! Sent to Admin for Trust Badge verification.");
        setActiveSheet(null);
      } else {
        toast.error(res.message || "Failed to upload document.");
      }
    } catch {
      toast.error("Network error while uploading document.");
    } finally {
      setUploadingGovtDoc(false);
    }
  };

  // Filtered options for standard option sheet
  const filteredSheetOptions = useMemo(() => {
    if (!sheetSearch.trim()) return sheetOptions;
    const q = sheetSearch.toLowerCase().trim();
    return sheetOptions.filter(o => o.value.toLowerCase().includes(q));
  }, [sheetOptions, sheetSearch]);

  // Master options map
  const educationOpts = useMemo(() => (masterData.EDUCATIONS || []).map(e => ({ id: e.id, value: e.value })), [masterData]);
  const occupationOpts = useMemo(() => (masterData.OCCUPATIONS || []).map(o => ({ id: o.id, value: o.value })), [masterData]);
  const casteOpts = useMemo(() => (masterData.CASTES || []).map(c => ({ id: c.id, value: c.value })), [masterData]);
  const maslakOpts = useMemo(() => (masterData.MASLAKS || []).map(m => ({ id: m.id, value: m.value })), [masterData]);
  const languageOpts = useMemo(() => (masterData.MOTHER_TONGUES || []).map(l => ({ id: l.id, value: l.value })), [masterData]);

  const employedInOpts = [
    { id: 1, value: 'Private Company' },
    { id: 2, value: 'Government / Public Sector' },
    { id: 3, value: 'Business / Self Employed' },
    { id: 4, value: 'Not Working' },
    { id: 5, value: 'Student' }
  ];

  const incomeOpts = [
    { id: 'No Income', value: 'No Income' },
    { id: 'Below ₹3 Lakhs', value: 'Below ₹3 Lakhs' },
    { id: '₹3 - 5 Lakhs', value: '₹3 - 5 Lakhs' },
    { id: '₹5 - 7 Lakhs', value: '₹5 - 7 Lakhs' },
    { id: '₹7 - 10 Lakhs', value: '₹7 - 10 Lakhs' },
    { id: '₹10 - 15 Lakhs', value: '₹10 - 15 Lakhs' },
    { id: '₹15 - 25 Lakhs', value: '₹15 - 25 Lakhs' },
    { id: '₹25 - 50 Lakhs', value: '₹25 - 50 Lakhs' },
    { id: '₹50 Lakhs & Above', value: '₹50 Lakhs & Above' }
  ];

  const familyTypeOpts = [
    { id: 1, value: 'Joint Family' },
    { id: 2, value: 'Nuclear Family' }
  ];

  const familyValuesOpts = [
    { id: 1, value: 'Traditional' },
    { id: 2, value: 'Moderate' },
    { id: 3, value: 'Liberal' },
    { id: 4, value: 'Religious' }
  ];

  const disabilityOpts = [
    { id: 'No', value: 'No' },
    { id: 'Physical Disability', value: 'Physical Disability' },
    { id: 'Other', value: 'Other' }
  ];

  const namazOpts = [
    { id: 'Regular 5 Times', value: 'Regular 5 Times' },
    { id: 'Only Jummah', value: 'Only Jummah' },
    { id: 'Occasionally', value: 'Occasionally' },
    { id: 'Only in Ramadan', value: 'Only in Ramadan' }
  ];

  const hijabOpts = [
    { id: 'Hijab', value: 'Hijab' },
    { id: 'Niqab', value: 'Niqab' },
    { id: 'Beard', value: 'Beard' },
    { id: 'No Hijab / Clean Shaved', value: 'No Hijab / Clean Shaved' }
  ];

  const dietOpts = [
    { id: 'Halal Only', value: 'Halal Only' },
    { id: 'Non-Vegetarian', value: 'Non-Vegetarian' },
    { id: 'Vegetarian', value: 'Vegetarian' },
    { id: 'Eggetarian', value: 'Eggetarian' }
  ];

  const habitOpts = [
    { id: 'No', value: 'No' },
    { id: 'Occasionally', value: 'Occasionally' },
    { id: 'Yes', value: 'Yes' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="text-[#e21e5b] animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading your profile details...</p>
      </div>
    );
  }

  // Count active uploaded photos
  const activePhotosCount = photos.filter(p => p && p.photoUrl).length;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 pb-16 font-sans">
      <Toaster position="top-center" richColors />

      {/* 🌟 TOP APP BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => router.push('/dashboard/my-profile')}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-800 transition-colors cursor-pointer"
              aria-label="Back to profile"
            >
              <X size={22} className="stroke-[2.2]" />
            </button>
            <h1 className="text-lg font-black tracking-tight text-slate-900">Edit Profile</h1>
          </div>
          <button 
            type="button"
            onClick={() => router.push('/dashboard/my-profile')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#e21e5b] hover:text-[#c9184e] bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full transition-all cursor-pointer"
          >
            <Eye size={15} />
            <span>Preview</span>
          </button>
        </div>
      </header>

      {/* 🌟 MAIN CONTENT CONTAINER */}
      <main className="max-w-md mx-auto px-4 pt-3.5 space-y-3.5">

        {/* 🌟 1. 100% COMPLETE INCENTIVE CARD */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/80 border border-amber-200/80 flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Star size={16} className="fill-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-950">
              Earn the badge on 100% complete profile.
            </p>
            <div className="w-full bg-amber-200/60 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '85%' }} />
            </div>
          </div>
        </div>

        {/* 🌟 2. LIFESTYLE & INTEREST CARD */}
        <div 
          onClick={() => openOptionSheet('Select Namaz Habit', 'NamazHabit', formData.NamazHabit, namazOpts)}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-between shadow-xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <div>
            <h2 className="text-sm font-bold text-slate-900">Lifestyle & Interest</h2>
            <span className="text-xs font-semibold text-[#e21e5b] mt-0.5 inline-block">Add Details</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-100/90 text-amber-900 text-[11px] font-bold">
            +10% Score
          </span>
        </div>

        {/* 🌟 3. TRUST BADGE / VERIFY YOUR PROFILE CARD */}
        <div 
          onClick={() => setActiveSheet('trustBadge')}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-between shadow-xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-slate-900">Verify Your Profile</h2>
                <CheckCircle2 size={16} className="text-sky-500 fill-sky-500 text-white" />
              </div>
              <span className="text-xs font-semibold text-[#e21e5b] mt-0.5 inline-block">
                {formData.IsGovtIdVerified ? "Verified with Trust Badge" : (formData.GovtIdDocUrl ? "Under Admin Review ⏳" : "Verify Profile")}
              </span>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </div>

        {/* 🌟 4. PHOTOS SECTION */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Camera size={18} className="text-slate-700" />
            <h2 className="text-sm font-black text-slate-900">Photos</h2>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs space-y-4">
            {/* 4-Slots Grid */}
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2, 3].map((slotIdx) => {
                const photo = photos[slotIdx];
                const isUploading = uploadingPhotoSlot === slotIdx;

                if (photo && photo.photoUrl) {
                  return (
                    <div 
                      key={slotIdx} 
                      className="relative aspect-3/4 rounded-2xl overflow-hidden border border-slate-200 shadow-xs group bg-slate-100"
                    >
                      <img 
                        src={photo.photoUrl} 
                        alt={`Photo ${slotIdx + 1}`}
                        className="w-full h-full object-cover" 
                      />
                      {slotIdx === 0 && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/75 backdrop-blur-xs py-1 text-center">
                          <span className="text-[9px] font-black tracking-wider text-white uppercase">
                            PROFILE PHOTO
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(photo.photoId, slotIdx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all cursor-pointer"
                        title="Delete photo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                }

                return (
                  <label 
                    key={slotIdx} 
                    className="aspect-3/4 rounded-2xl border-2 border-dashed border-rose-300 hover:border-[#e21e5b] bg-rose-50/20 hover:bg-rose-50/50 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all relative group"
                  >
                    <input 
                      type="file"
                      accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.heic,.heif,.jfif,.bmp,.gif,.tiff"
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => handlePhotoSelect(e, slotIdx)}
                    />
                    {isUploading ? (
                      <Loader2 size={20} className="text-[#e21e5b] animate-spin" />
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full bg-[#e21e5b] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                          <Plus size={18} className="stroke-[2.5]" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">Add Photo</span>
                      </>
                    )}
                  </label>
                );
              })}
            </div>

            {/* 🌟 PHOTO PRIVACY ROW:
                CRITICAL USER RULE:
                If 0 photos are uploaded, this row is COMPLETELY HIDDEN!
                If >= 1 photo is uploaded, this row appears!
                If photo removed to 0, it disappears!
            */}
            {activePhotosCount > 0 && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Control who sees your photo</span>
                <button
                  type="button"
                  onClick={() => setActiveSheet('photoPrivacy')}
                  className="flex items-center gap-1 text-xs font-bold text-[#e21e5b] hover:text-[#c9184e] cursor-pointer"
                >
                  <span>{formData.PhotoPrivacy}</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 🌟 5. BIO SECTION */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-base">👤</span>
            <h2 className="text-sm font-black text-slate-900">Bio</h2>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs text-left relative">
            <p className="text-xs text-slate-700 leading-relaxed pr-12 line-clamp-3">
              {formData.AboutMe || "Tell them more about your principles, partner expectations, family and hobbies."}
            </p>
            <button
              type="button"
              onClick={openBioSheet}
              className="absolute right-4 bottom-4 text-xs font-bold text-[#e21e5b] hover:text-[#c9184e] cursor-pointer"
            >
              Edit
            </button>
          </div>
        </section>

        {/* 🌟 6. PERSONAL DETAILS SECTION */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <FileText size={18} className="text-slate-700" />
            <h2 className="text-sm font-black text-slate-900">Personal Details</h2>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs divide-y divide-slate-100">
            {/* Name */}
            <div 
              onClick={() => {
                const newName = prompt("Edit your full name:", formData.FullName);
                if (newName && newName.trim()) saveFieldValue('FullName', newName.trim());
              }}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Name</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.FullName}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Profile Created for - Locked */}
            <div className="p-4 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="text-xs font-bold text-slate-900">Profile Created for</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.ProfileCreatedFor}</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1">
                <AlertCircle size={11} /> You can not edit this
              </span>
            </div>

            {/* Age and Gender - Locked */}
            <div className="p-4 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="text-xs font-bold text-slate-900">Age and Gender</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.Age} Yrs, {formData.Gender}</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1">
                <AlertCircle size={11} /> You can not edit this
              </span>
            </div>

            {/* Marital Status - Locked */}
            <div className="p-4 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="text-xs font-bold text-slate-900">Marital Status</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.MaritalStatus}</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1">
                <AlertCircle size={11} /> You can not edit this
              </span>
            </div>

            {/* Sect - Locked */}
            <div className="p-4 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="text-xs font-bold text-slate-900">Sect</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.Sect}</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1">
                <AlertCircle size={11} /> You can not edit this
              </span>
            </div>

            {/* Height - Slider Bottom Sheet */}
            <div 
              onClick={openHeightSheet}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Height</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.Height}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Caste */}
            <div 
              onClick={() => openOptionSheet('Select caste', 'Caste', formData.Caste, casteOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Caste</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.Caste}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Maslak */}
            <div 
              onClick={() => openOptionSheet('Select maslak', 'Maslak', formData.Maslak, maslakOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Maslak</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.Maslak}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Mother Tongue */}
            <div 
              onClick={() => openOptionSheet('Select mother tongue', 'MotherTongue', formData.MotherTongue, languageOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Mother Tongue</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.MotherTongue}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Location (City & State) */}
            <div 
              onClick={openLocationSheet}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Location</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.Location}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Disability */}
            <div 
              onClick={() => openOptionSheet('Physical Disability?', 'Disability', formData.Disability, disabilityOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Disability</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.Disability}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>
        </section>

        {/* 🌟 7. EDUCATION & CAREER SECTION */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-base">🎓</span>
            <h2 className="text-sm font-black text-slate-900">Education & Career</h2>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs divide-y divide-slate-100">
            {/* Education */}
            <div 
              onClick={() => openOptionSheet('Select education', 'Education', formData.Education, educationOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Education</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.Education}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* College Name */}
            <div 
              onClick={() => {
                const c = prompt("Enter your College / University name:", formData.CollegeName);
                if (c !== null) saveFieldValue('CollegeName', c.trim());
              }}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">College Name</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.CollegeName || "Add College Name"}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Employed In */}
            <div 
              onClick={() => openOptionSheet('Select employment sector', 'EmployedIn', formData.EmployedIn, employedInOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Employed In</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.EmployedIn}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Occupation */}
            <div 
              onClick={() => openOptionSheet('Select occupation', 'Occupation', formData.Occupation, occupationOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Occupation</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.Occupation}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Annual Income */}
            <div 
              onClick={() => openOptionSheet('Select annual income', 'AnnualIncome', formData.AnnualIncome, incomeOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Annual Income</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.AnnualIncome}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>
        </section>

        {/* 🌟 8. FAMILY DETAILS SECTION */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-base">👥</span>
            <h2 className="text-sm font-black text-slate-900">Family Details</h2>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs divide-y divide-slate-100">
            {/* Family Location */}
            <div 
              onClick={openLocationSheet}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Family Location</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.FamilyLocation}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Family Type */}
            <div 
              onClick={() => openOptionSheet('Select family type', 'FamilyType', formData.FamilyType, familyTypeOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Family Type</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.FamilyType}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Family Values */}
            <div 
              onClick={() => openOptionSheet('Select family values', 'FamilyValues', formData.FamilyValues, familyValuesOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Family Values</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.FamilyValues}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Father Occupation */}
            <div 
              onClick={() => {
                const f = prompt("Enter Father's occupation:", formData.FatherOccupation);
                if (f !== null) saveFieldValue('FatherOccupation', f.trim());
              }}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Father Occupation</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.FatherOccupation}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Mother Occupation */}
            <div 
              onClick={() => {
                const m = prompt("Enter Mother's occupation:", formData.MotherOccupation);
                if (m !== null) saveFieldValue('MotherOccupation', m.trim());
              }}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Mother Occupation</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.MotherOccupation}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Brothers Count */}
            <div 
              onClick={() => {
                const tot = prompt("Total Brothers count:", String(formData.TotalBrothers));
                const mar = prompt("Married Brothers count:", String(formData.MarriedBrothers));
                if (tot !== null && mar !== null) {
                  saveFieldValue('TotalBrothers', Number(tot) || 0, { MarriedBrothers: Number(mar) || 0 });
                }
              }}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Brothers</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.TotalBrothers} Brother ({formData.MarriedBrothers} Married)</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Sisters Count */}
            <div 
              onClick={() => {
                const tot = prompt("Total Sisters count:", String(formData.TotalSisters));
                const mar = prompt("Married Sisters count:", String(formData.MarriedSisters));
                if (tot !== null && mar !== null) {
                  saveFieldValue('TotalSisters', Number(tot) || 0, { MarriedSisters: Number(mar) || 0 });
                }
              }}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Sisters</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.TotalSisters} Sister ({formData.MarriedSisters} Married)</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>
        </section>

        {/* 🌟 9. RELIGIOUS & LIFESTYLE DETAILS */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-base">🌙</span>
            <h2 className="text-sm font-black text-slate-900">Religious & Lifestyle</h2>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs divide-y divide-slate-100">
            {/* Namaz Habit */}
            <div 
              onClick={() => openOptionSheet('Select namaz habit', 'NamazHabit', formData.NamazHabit, namazOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Namaz Habit</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.NamazHabit}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Hijab / Beard */}
            <div 
              onClick={() => openOptionSheet('Select Hijab / Beard', 'HijabOrBeard', formData.HijabOrBeard, hijabOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Hijab / Beard</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.HijabOrBeard}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Diet Type */}
            <div 
              onClick={() => openOptionSheet('Select diet type', 'DietType', formData.DietType, dietOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Diet Type</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.DietType}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Smoke Habit */}
            <div 
              onClick={() => openOptionSheet('Do you smoke?', 'SmokeHabit', formData.SmokeHabit, habitOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Smoke Habit</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.SmokeHabit}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Drink Habit */}
            <div 
              onClick={() => openOptionSheet('Do you drink?', 'DrinkHabit', formData.DrinkHabit, habitOpts)}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">Drink Habit</div>
                <div className="text-xs text-slate-600 mt-0.5">{formData.DrinkHabit}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>
        </section>
      </main>

      {/* 🌟 10. MODALS & BOTTOM SHEETS (MATCHING USER SCREENSHOTS) */}
      <AnimatePresence>
        {activeSheet && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveSheet(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />

            {/* 🌟 SHEET A: HEIGHT SLIDER BOTTOM SHEET */}
            {activeSheet === 'height' && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-md mx-auto bg-white rounded-t-3xl p-5 pt-4 space-y-5 shadow-2xl text-left"
              >
                {/* Floating circular close button */}
                <div className="flex justify-center -mt-9 mb-1">
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-lg hover:bg-black transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <h3 className="text-lg font-black text-slate-900 text-center">Add Height</h3>

                {/* Selected Height Pill */}
                <div className="flex justify-center">
                  <div className="px-5 py-2 rounded-full border-2 border-[#e21e5b] text-[#e21e5b] font-bold text-sm bg-rose-50/40">
                    {cmToFtIn(heightCm)}
                  </div>
                </div>

                {/* Height Slider */}
                <div className="px-2 pt-2">
                  <input 
                    type="range"
                    min={135}
                    max={213}
                    step={1}
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#e21e5b]"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-semibold mt-2">
                    <span>4ft 5in (135 cm)</span>
                    <span>7ft 0in (213 cm)</span>
                  </div>
                </div>

                {/* Pink Update Button */}
                <button
                  type="button"
                  onClick={handleSaveHeight}
                  disabled={savingField === 'Height'}
                  className="w-full py-3.5 rounded-full bg-[#e21e5b] hover:bg-[#c9184e] text-white font-bold text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center"
                >
                  {savingField === 'Height' ? <Loader2 size={18} className="animate-spin" /> : "Update"}
                </button>
              </motion.div>
            )}

            {/* 🌟 SHEET B: SEARCHABLE OPTIONS BOTTOM SHEET */}
            {activeSheet === 'option' && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-md mx-auto bg-white rounded-t-3xl p-5 pt-4 space-y-4 shadow-2xl text-left max-h-[82vh] flex flex-col"
              >
                {/* Floating circular close button */}
                <div className="flex justify-center -mt-9 mb-1">
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-lg hover:bg-black transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <h3 className="text-lg font-black text-slate-900 capitalize">{sheetTitle}</h3>

                {/* Search Bar */}
                {sheetOptions.length > 5 && (
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input 
                      type="text"
                      placeholder={`Search...`}
                      value={sheetSearch}
                      onChange={(e) => setSheetSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-100 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e21e5b]/20"
                    />
                  </div>
                )}

                {/* Scrollable Radio List */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                  {filteredSheetOptions.map((opt) => {
                    const isSelected = selectedSheetValue === opt.id || selectedSheetValue === opt.value;
                    return (
                      <div 
                        key={String(opt.id || opt.value)}
                        onClick={() => setSelectedSheetValue(opt.id !== undefined ? opt.id : opt.value)}
                        className="py-3 px-1 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <span className={`text-xs font-semibold ${isSelected ? 'text-[#e21e5b] font-bold' : 'text-slate-800'}`}>
                          {opt.value}
                        </span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'border-[#e21e5b] bg-[#e21e5b]' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                  {filteredSheetOptions.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No matching options found.
                    </div>
                  )}
                </div>

                {/* Pink Update Button */}
                <button
                  type="button"
                  onClick={handleSaveOption}
                  disabled={Boolean(savingField)}
                  className="w-full py-3.5 rounded-full bg-[#e21e5b] hover:bg-[#c9184e] text-white font-bold text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center shrink-0"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : "Update"}
                </button>
              </motion.div>
            )}

            {/* 🌟 SHEET C: BIO FULL SCREEN SLIDE */}
            {activeSheet === 'bio' && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-md mx-auto bg-white rounded-t-3xl p-5 pt-4 space-y-4 shadow-2xl text-left"
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
                    <span className="text-sm font-bold text-slate-900">Bio</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900">Tell us about yourself</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Tell them more about your principles, partner expectations, family and hobbies.
                  </p>
                </div>

                <div className="relative">
                  <textarea 
                    rows={6}
                    maxLength={1000}
                    value={bioDraft}
                    onChange={(e) => setBioDraft(e.target.value)}
                    placeholder="Write a few lines about your values, personality, and partner expectations..."
                    className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#e21e5b] focus:ring-1 focus:ring-[#e21e5b] leading-relaxed resize-none"
                  />
                  <div className="text-right text-[11px] text-slate-400 mt-1">
                    {bioDraft.length}/1000
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveBio}
                  disabled={savingField === 'AboutMe'}
                  className="w-full py-3.5 rounded-full bg-[#e21e5b] hover:bg-[#c9184e] text-white font-bold text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center"
                >
                  {savingField === 'AboutMe' ? <Loader2 size={18} className="animate-spin" /> : "Save"}
                </button>
              </motion.div>
            )}

            {/* 🌟 SHEET D: LOCATION SELECTOR (STATE & CITY) */}
            {activeSheet === 'location' && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-md mx-auto bg-white rounded-t-3xl p-5 pt-4 space-y-4 shadow-2xl text-left max-h-[82vh] flex flex-col"
              >
                <div className="flex justify-center -mt-9 mb-1">
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-lg hover:bg-black transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <h3 className="text-lg font-black text-slate-900">Select Location</h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Select State
                    </label>
                    <select
                      value={selectedStateId}
                      onChange={(e) => setSelectedStateId(Number(e.target.value))}
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                    >
                      {(masterData.STATES || []).map(s => (
                        <option key={s.id} value={s.id}>{s.value}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Select City
                    </label>
                    <select
                      value={selectedCityId}
                      onChange={(e) => setSelectedCityId(Number(e.target.value))}
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
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
                  className="w-full py-3.5 rounded-full bg-[#e21e5b] hover:bg-[#c9184e] text-white font-bold text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center mt-2"
                >
                  {savingField ? <Loader2 size={18} className="animate-spin" /> : "Update"}
                </button>
              </motion.div>
            )}

            {/* 🌟 SHEET E: PHOTO PRIVACY BOTTOM SHEET */}
            {activeSheet === 'photoPrivacy' && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-md mx-auto bg-white rounded-t-3xl p-5 pt-4 space-y-4 shadow-2xl text-left"
              >
                <div className="flex justify-center -mt-9 mb-1">
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-lg hover:bg-black transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <h3 className="text-lg font-black text-slate-900">Who can see my photo</h3>

                <div className="space-y-2.5">
                  {[
                    { value: 'All Members', title: 'All Members', desc: 'Visible to everyone' },
                    { value: 'Premium Members', title: 'Premium Members', desc: 'Blurred for free users' },
                    { value: 'Members I Approve', title: 'Members I Approve', desc: 'Blurred until you approve' }
                  ].map((opt) => {
                    const isSel = formData.PhotoPrivacy === opt.value;
                    return (
                      <div
                        key={opt.value}
                        onClick={() => handleSavePhotoPrivacy(opt.value)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSel ? 'border-[#e21e5b] bg-rose-50/50 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className={`text-xs font-bold ${isSel ? 'text-[#e21e5b]' : 'text-slate-800'}`}>
                            {opt.title}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {opt.desc}
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSel ? 'border-[#e21e5b] bg-[#e21e5b]' : 'border-slate-300'
                        }`}>
                          {isSel && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[11px] text-slate-400 text-center">
                  You can change this later in your privacy settings
                </p>

                <button
                  type="button"
                  onClick={() => setActiveSheet(null)}
                  className="w-full py-3.5 rounded-full bg-[#e21e5b] hover:bg-[#c9184e] text-white font-bold text-sm shadow-md transition-all cursor-pointer active:scale-98"
                >
                  Save
                </button>
              </motion.div>
            )}

            {/* 🌟 SHEET F: ADD TRUST BADGE (GOVT ID VERIFICATION) */}
            {activeSheet === 'trustBadge' && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-md mx-auto bg-white rounded-t-3xl p-5 pt-4 space-y-4 shadow-2xl text-left max-h-[85vh] flex flex-col overflow-y-auto"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-black text-slate-900">Add Trust Badge</h3>
                    <CheckCircle2 size={16} className="text-sky-500 fill-sky-500 text-white" />
                  </div>
                </div>

                {/* Upload Box */}
                <label className="aspect-4/3 rounded-3xl border-2 border-dashed border-rose-300 hover:border-[#e21e5b] bg-rose-50/20 hover:bg-rose-50/50 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all relative overflow-hidden group">
                  <input 
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setGovtDocFile(f);
                        if (f.type.startsWith("image/")) {
                          setGovtDocPreview(URL.createObjectURL(f));
                        } else {
                          setGovtDocPreview("");
                        }
                      }
                    }}
                  />
                  {govtDocPreview ? (
                    <img src={govtDocPreview} alt="Doc preview" className="w-full h-full object-contain" />
                  ) : formData.GovtIdDocUrl ? (
                    <div className="space-y-1">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                        <Check size={24} />
                      </div>
                      <p className="text-xs font-bold text-slate-900">Document Submitted</p>
                      <p className="text-[11px] text-slate-500">Sent for Admin Approval</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 mx-auto flex items-center justify-center relative">
                        <Camera size={24} />
                        <div className="w-5 h-5 rounded-full bg-[#e21e5b] text-white flex items-center justify-center absolute -top-1 -right-1">
                          <Plus size={14} className="stroke-[3]" />
                        </div>
                      </div>
                      <div className="text-sm font-black text-slate-900">Upload Govt ID</div>
                      <div className="text-xs text-slate-400 font-medium">
                        (Aadhaar, PAN, Passport etc)
                      </div>
                    </div>
                  )}
                </label>

                {/* Benefits Card */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <h4 className="text-xs font-black text-slate-900">Benefits</h4>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                    <li>Upload a Valid Government ID to get the Trust badge.</li>
                    <li>Verified member get a Trust Badge for more visibility and trust.</li>
                  </ul>
                </div>

                {/* Continue Button */}
                <button
                  type="button"
                  onClick={handleSubmitGovtDoc}
                  disabled={uploadingGovtDoc || (!govtDocFile && !formData.GovtIdDocUrl)}
                  className="w-full py-3.5 rounded-full bg-[#e21e5b] hover:bg-[#c9184e] text-white font-bold text-sm shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center disabled:opacity-50"
                >
                  {uploadingGovtDoc ? <Loader2 size={18} className="animate-spin" /> : "Continue"}
                </button>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
