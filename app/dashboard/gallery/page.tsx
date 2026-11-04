"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Eye, Lock, ChevronDown, Check, Trash2, Loader2, Sparkles, Star, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { fetchProfileDetailsApi, uploadGalleryPhotoApi, setMainPhotoApi, deleteGalleryPhotoApi, updatePhotoPrivacyApi } from '@/lib/api';
import { CompactSelect } from '@/components/profile/CompactSelect';
import { getOptimizedImageUrl, DEFAULT_FEMALE_AVATAR } from '@/lib/imageUtils';
import { syncUserProfilePhoto } from '@/lib/auth';

export default function GalleryManagementPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("cached_profile_details") || localStorage.getItem("user_details");
        if (cached) {
          const parsed = JSON.parse(cached);
          const p = parsed.profile || parsed.Profile || parsed;
          const g = parsed.gallery || parsed.Gallery || p?.userPhotos || p?.UserPhotos || [];
          if (Array.isArray(g) && g.length > 0) return g;
          if (p?.mainPhotoUrl || p?.photoUrl) return [{ photoId: 1, photoUrl: p.mainPhotoUrl || p.photoUrl, isMain: true }];
        }
      } catch (e) {}
    }
    return [];
  });
  const [privacy, setPrivacy] = useState<string>('All Members');
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      return !(localStorage.getItem("cached_profile_details") || localStorage.getItem("user_details"));
    }
    return false;
  });
  const [uploading, setUploading] = useState(false);

  // Modal State for Photo Action
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

  // ⚡ 0ms INSTANT HYDRATION FROM LOCAL CACHE (Zero Spinner Delays)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("cached_profile_details") || localStorage.getItem("user_details");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const p = parsed.profile || parsed.Profile || parsed;
          const g = parsed.gallery || parsed.Gallery || p.userPhotos || p.UserPhotos || [];
          if (Array.isArray(g) && g.length > 0) {
            setPhotos(g);
            setLoading(false);
          } else if (p.mainPhotoUrl || p.photoUrl) {
            setPhotos([{ photoId: 1, photoUrl: p.mainPhotoUrl || p.photoUrl, isMain: true }]);
            setLoading(false);
          }
        } catch (e) {}
      }
    }
  }, []);

  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop()?.split(';').shift() : null;
  };

  const getToken = useCallback(() => getCookie("user_token"), []);

  const updateSessionPhoto = (mainPhotoUrl: string) => {
    if (!mainPhotoUrl) return;
    syncUserProfilePhoto(mainPhotoUrl);
  };

  const loadGalleryData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push('/');
      return;
    }

    let userId = 0;
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user_details") || localStorage.getItem("user_session");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          userId = parsed.userId || parsed.UserId || parsed.id || parsed.user?.userId || parsed.user?.id || 0;
        } catch (e) {}
      }
    }

    if (photos.length === 0 && !localStorage.getItem("cached_profile_details")) {
      setLoading(true);
    }
    const res = await fetchProfileDetailsApi(userId, token);
    if (res.success && res.data) {
      const p = res.data.profile || res.data.Profile || res.data;
      const g = res.data.gallery || res.data.Gallery || [];
      setPrivacy(p.photoPrivacy || p.PhotoPrivacy || 'All Members');
      
      let list = Array.isArray(g) ? g : [];
      if (list.length === 0 && (p.mainPhotoUrl || p.photoUrl)) {
        list = [{ photoId: 1, photoUrl: p.mainPhotoUrl || p.photoUrl, isMain: true }];
      }

      list.sort((a: any, b: any) => {
        const aMain = Boolean(a.isMain ?? a.IsMain);
        const bMain = Boolean(b.isMain ?? b.IsMain);
        if (aMain && !bMain) return -1;
        if (!aMain && bMain) return 1;
        return 0;
      });

      setPhotos(list);

      const mainPhoto = list.find((item: any) => Boolean(item.isMain ?? item.IsMain));
      if (mainPhoto?.photoUrl) {
        updateSessionPhoto(mainPhoto.photoUrl);
      }

      if (typeof window !== "undefined") {
        try { localStorage.setItem("cached_profile_details", JSON.stringify(res.data)); } catch (e) {}
      }
    }
    setLoading(false);
  }, [getToken, router]);

  useEffect(() => {
    loadGalleryData();
  }, [loadGalleryData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    // 🛡️ STRICT FORMAT VALIDATION (REJECT PDF, DOC, TXT)
    if (!file.type || !allowedTypes.includes(file.type.toLowerCase())) {
      toast.error("Invalid file format. Please upload JPG, PNG, or WEBP image files only.");
      return;
    }

    // 🛡️ FILE SIZE VALIDATION (MAX 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size is too large. Maximum allowed photo size is 5MB.");
      return;
    }

    const token = getToken();
    const oldPhotoId = selectedPhoto ? (selectedPhoto.photoId || selectedPhoto.PhotoId) : null;
    const isReplacing = Boolean(selectedPhoto && oldPhotoId);

    if (photos.length >= 3 && !isReplacing) {
      toast.error("You can upload a maximum of 3 photos (1 Main Profile Photo + 2 Additional Photos).");
      return;
    }

    const formData = new FormData();
    formData.append("Photo", file);
    formData.append("PhotoPrivacy", privacy);
    if (isReplacing && oldPhotoId) {
      formData.append("ReplacePhotoId", String(oldPhotoId));
    }

    setUploading(true);
    const res = await uploadGalleryPhotoApi(formData, token);

    if (res.success) {
      const resAny = res as any;
      const returnedPhotoUrl = resAny.data?.photoUrl || resAny.photoUrl;
      const isMain = Boolean(resAny.isMain ?? resAny.data?.isMain ?? selectedPhoto?.isMain ?? false);

      if ((photos.length === 0 || isMain) && returnedPhotoUrl) {
        updateSessionPhoto(returnedPhotoUrl);
      }

      toast.success(isReplacing ? "Photo replaced successfully!" : (res.message || "Photo uploaded successfully!"));
      setSelectedPhoto(null);
      await loadGalleryData();
    } else {
      toast.error(res.message || "Failed to upload photo.");
    }
    setUploading(false);
  };

  const handlePrivacyChange = async (newPrivacy: string) => {
    const textPrivacy = (newPrivacy === '1' || newPrivacy.includes('All')) ? 'All Members' : (newPrivacy === '2' || newPrivacy.includes('Premium')) ? 'Premium Only' : (newPrivacy === '3' || newPrivacy.includes('Approved')) ? 'Only Approved' : newPrivacy;
    setPrivacy(textPrivacy);
    const token = getToken();
    const res = await updatePhotoPrivacyApi(textPrivacy, token);
    if (res.success) {
      toast.success("Photo privacy updated!");
    } else {
      toast.error(res.message || "Failed to update privacy.");
    }
  };

  const handleSetPrimary = async (photo: any) => {
    const token = getToken();
    const photoId = photo.photoId || photo.PhotoId;
    if (!photoId) return;

    setUploading(true);
    const res = await setMainPhotoApi(photoId, token);
    setUploading(false);

    if (res.success) {
      toast.success("Selected as Main Profile Photo!");
      updateSessionPhoto(photo.photoUrl);
      setSelectedPhoto(null);
      await loadGalleryData();
    } else {
      toast.error(res.message || "Failed to set main photo.");
    }
  };

  const handleDeletePhoto = async (photo: any) => {
    if (!photo) return;
    
    const token = getToken();
    const photoId = photo.photoId || photo.PhotoId;
    if (!photoId) return;

    setUploading(true);
    const res = await deleteGalleryPhotoApi(photoId, token);
    setUploading(false);

    if (res.success) {
      toast.success("Photo deleted successfully.");
      setSelectedPhoto(null);
      await loadGalleryData();
      
      const remaining = photos.filter((p: any) => (p.photoId || p.PhotoId) !== photoId);
      if (remaining.length > 0) {
        const nextMain = remaining.find((p: any) => Boolean(p.isMain ?? p.IsMain)) || remaining[0];
        if (nextMain?.photoUrl) {
          updateSessionPhoto(nextMain.photoUrl);
        }
      } else {
        updateSessionPhoto('');
        setPrivacy('All Members');
        updatePhotoPrivacyApi('All Members', token).catch(() => {});
      }
    } else {
      toast.error(res.message || "Failed to delete photo.");
    }
  };

  const privacyOptions = [
    { id: "All Members", value: "All Members" },
    { id: "Premium Only", value: "Premium Only" },
    { id: "Only Approved", value: "Only Approved" }
  ];

  const isMainSelected = selectedPhoto ? Boolean(selectedPhoto.isMain ?? selectedPhoto.IsMain) : false;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F5] via-white to-[#FAF8F5] font-sans text-slate-900 pb-28 pt-4 selection:bg-[#d91b5c] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center gap-3 py-2 border-b border-rose-100">
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="flex p-2 hover:bg-rose-50 text-[#d91b5c] rounded-full transition-colors cursor-pointer"
            aria-label="Back"
            title="Go Back"
          >
            <ArrowLeft size={22} className="stroke-[2.5]" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-extrabold tracking-tight text-slate-900">
              Gallery & Photo Privacy
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              Manage your personal pictures & choose who can view them
            </p>
          </div>
        </div>

        {/* TITLE BANNER */}
        <div className="bg-white p-6 rounded-3xl border border-rose-100/80 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[#d91b5c] text-[10px] font-black uppercase tracking-wider">
              <Sparkles size={12} />
              <span>Verified Photo Protection</span>
            </div>
            <h2 className="text-lg sm:text-xl font-serif font-black text-slate-900">
              Manage Profile Photos
            </h2>
            <p className="text-xs font-semibold text-slate-500 max-w-md">
              Upload up to 3 photos (1 Main Profile Picture + 2 Gallery photos). Profiles with photos get 10x more responses.
            </p>
          </div>
          <div className="px-4 py-2 bg-[#FAF8F5] rounded-2xl border border-rose-100 text-center shrink-0">
            <span className="text-xs font-bold text-slate-500 block">Photos Added</span>
            <span className="text-xl font-black text-[#d91b5c]">{photos.length} / 3</span>
          </div>
        </div>

        {/* 📸 3-SLOT DYNAMIC GALLERY GRID (RESPONSIVE 3-COLUMN LAYOUT) */}
        {loading ? (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-5 pt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl sm:rounded-3xl shimmer-luxury shadow-sm border border-rose-100/50" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-5 pt-2">
            
            {photos.map((photo, idx) => {
              const isMain = Boolean(photo.isMain ?? photo.IsMain);
              const imageUrl = getOptimizedImageUrl(photo.photoUrl || photo.PhotoUrl);
              return (
                <div 
                  key={idx} 
                  onClick={() => setSelectedPhoto({ ...photo, resolvedUrl: imageUrl })}
                  className="relative aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 shadow-md border-2 border-rose-100/80 cursor-pointer group hover:border-[#d91b5c] hover:shadow-xl transition-all"
                >
                  <img 
                    src={imageUrl} 
                    alt={`Photo ${idx + 1}`} 
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" 
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_FEMALE_AVATAR; }} 
                  />
                  
                  {isMain ? (
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] text-white text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-md tracking-wider flex items-center gap-1 border border-white/20">
                      <Star size={10} className="fill-amber-300 text-amber-300 sm:w-3 sm:h-3" />
                      <span className="hidden xs:inline">Main</span>
                      <span className="xs:hidden">Main</span>
                    </div>
                  ) : (
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-black/60 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold uppercase px-2 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-md tracking-wider">
                      #{idx + 1}
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 p-2 sm:p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-[10px] sm:text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-md px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-white/30 text-center">
                      Manage
                    </span>
                  </div>
                </div>
              );
            })}

            {/* UPLOAD SLOTS FOR REMAINING (UP TO 3 MAX PHOTOS) */}
            {Array.from({ length: Math.max(0, 3 - photos.length) }).map((_, idx) => (
              <label 
                key={idx} 
                className="relative aspect-[3/4] rounded-2xl sm:rounded-3xl border-2 border-dashed border-rose-300/80 bg-rose-50/40 hover:bg-rose-100/50 flex flex-col items-center justify-center cursor-pointer transition-all shadow-xs group p-2 sm:p-6 text-center"
              >
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  disabled={uploading} 
                  className="hidden" 
                />
                
                {uploading ? (
                  <Loader2 size={24} className="animate-spin text-[#d91b5c]" />
                ) : (
                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[#d91b5c] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Plus size={18} className="stroke-[3] sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-xs font-black text-[#d91b5c] uppercase block">Add</span>
                      <span className="text-[8px] sm:text-[10px] font-semibold text-slate-500 hidden sm:block mt-0.5">JPG, PNG, WEBP</span>
                    </div>
                  </div>
                )}
              </label>
            ))}

          </div>
        )}

        {/* 🔒 PRIVACY DROPDOWN SELECTION */}
        {photos.length > 0 ? (
          <div className="bg-white p-6 rounded-3xl border border-rose-100/80 shadow-md space-y-2">
            <CompactSelect 
              label="Photo Privacy Controls" 
              options={privacyOptions} 
              value={privacy} 
              onChange={(val: any) => handlePrivacyChange(String(val))} 
            />
            <p className="text-[11px] text-slate-500 font-medium pl-1">
              Choose who is permitted to view your uploaded profile and gallery photos.
            </p>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-[#e21e5b] shrink-0 border border-rose-100">
              <Lock size={18} />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-slate-800">Photo Privacy Inactive</h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Upload at least one photo above to configure and activate photo privacy controls.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* 🖼️ PHOTO ACTION MODAL (VIEW / MAKE PROFILE PICTURE / REPLACE / DELETE) */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-rose-100 text-slate-800 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-serif font-black text-sm uppercase text-slate-900 flex items-center gap-2">
                  Photo Actions {isMainSelected && <span className="text-[10px] bg-rose-100 text-[#d91b5c] px-2 py-0.5 rounded-full font-sans font-bold">Main Profile</span>}
                </h3>
                <button type="button" onClick={() => setSelectedPhoto(null)} className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200">
                  <X size={18} />
                </button>
              </div>

              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-950">
                <img 
                  src={selectedPhoto.resolvedUrl || getOptimizedImageUrl(selectedPhoto.photoUrl)} 
                  alt="Preview" 
                  className="w-full h-full object-cover object-top" 
                  onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_FEMALE_AVATAR; }}
                />
              </div>

              <div className="space-y-2 pt-1">
                <div className={`grid ${!isMainSelected ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                  {!isMainSelected && (
                    <button 
                      type="button" 
                      onClick={() => handleSetPrimary(selectedPhoto)} 
                      disabled={uploading}
                      className="p-3 bg-rose-50 hover:bg-rose-100 text-[#d91b5c] font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer transition-all"
                    >
                      {uploading ? <Loader2 size={15} className="animate-spin" /> : <Star size={15} />} 
                      Make Main
                    </button>
                  )}

                  <label className="p-3 bg-[#d91b5c] hover:bg-[#b01449] text-white font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm">
                    <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                    {uploading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} 
                    Replace Photo
                  </label>
                </div>

                <button 
                  type="button" 
                  onClick={() => handleDeletePhoto(selectedPhoto)} 
                  disabled={uploading}
                  className="w-full p-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 hover:border-rose-300 font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs"
                >
                  {uploading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} 
                  Delete Photo
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

