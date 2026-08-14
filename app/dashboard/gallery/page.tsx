"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Eye, Lock, ChevronDown, Check, Trash2, Loader2, Sparkles, Star, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { fetchProfileDetailsApi, uploadGalleryPhotoApi, setMainPhotoApi, deleteGalleryPhotoApi, updatePhotoPrivacyApi } from '@/lib/api';
import { CompactSelect } from '@/components/profile/CompactSelect';
import { getOptimizedImageUrl } from '@/lib/imageUtils';

export default function GalleryManagementPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<any[]>([]);
  const [privacy, setPrivacy] = useState<string>('All Members');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Modal State for Photo Action
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop()?.split(';').shift() : null;
  };

  const getToken = useCallback(() => getCookie("user_token"), []);

  const updateSessionPhoto = (mainPhotoUrl: string) => {
    if (typeof window !== "undefined") {
      ['user_details', 'user_session'].forEach(key => {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.mainPhotoUrl = mainPhotoUrl;
            parsed.photoUrl = mainPhotoUrl;
            parsed.PhotoUrl = mainPhotoUrl;
            localStorage.setItem(key, JSON.stringify(parsed));
          } catch (e) {}
        }
      });
    }
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

    setLoading(true);
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

    // 🛡️ FILE SIZE VALIDATION (MAX 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size is too large. Maximum allowed photo size is 10MB.");
      return;
    }

    if (photos.length >= 3 && !selectedPhoto) {
      toast.error("You can upload a maximum of 3 photos (1 Main Profile Photo + 2 Additional Photos).");
      return;
    }

    const token = getToken();
    const isReplacingMain = selectedPhoto ? Boolean(selectedPhoto.isMain ?? selectedPhoto.IsMain) : false;
    const oldPhotoId = selectedPhoto ? (selectedPhoto.photoId || selectedPhoto.PhotoId) : null;

    const formData = new FormData();
    formData.append("Photo", file);
    formData.append("PhotoPrivacy", privacy);

    setUploading(true);
    const res = await uploadGalleryPhotoApi(formData, token);

    if (res.success) {
      // 🔄 IF REPLACING AN EXISTING PHOTO
      if (selectedPhoto && oldPhotoId) {
        const newPhotoId = res.data?.photoId || res.data?.PhotoId || res.photoId || res.PhotoId;
        
        if (isReplacingMain && newPhotoId) {
          await setMainPhotoApi(newPhotoId, token);
          if (res.data?.photoUrl || res.photoUrl) {
            updateSessionPhoto(res.data?.photoUrl || res.photoUrl);
          }
        } else if (oldPhotoId && !isReplacingMain) {
          await deleteGalleryPhotoApi(oldPhotoId, token);
        }
        toast.success("Photo replaced successfully!");
      } else {
        toast.success(res.message || "Photo uploaded successfully!");
      }

      setSelectedPhoto(null);
      await loadGalleryData();
    } else {
      toast.error(res.message || "Failed to upload photo.");
    }
    setUploading(false);
  };

  const handlePrivacyChange = async (newPrivacy: string) => {
    setPrivacy(newPrivacy);
    const token = getToken();
    const res = await updatePhotoPrivacyApi(newPrivacy, token);
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
    const isMain = Boolean(photo.isMain ?? photo.IsMain);
    if (isMain) {
      toast.error("The main profile photo is mandatory and cannot be deleted. You can replace or change it with another photo.");
      return;
    }
    
    const token = getToken();
    const photoId = photo.photoId || photo.PhotoId;
    if (!photoId) return;

    setUploading(true);
    const res = await deleteGalleryPhotoApi(photoId, token);
    setUploading(false);

    if (res.success) {
      toast.success("Photo deleted from gallery.");
      setSelectedPhoto(null);
      await loadGalleryData();
    } else {
      toast.error(res.message || "Failed to delete photo.");
    }
  };

  const privacyOptions = [
    { id: 1, value: "All Members" },
    { id: 2, value: "Premium Only" },
    { id: 3, value: "Only Approved" }
  ];

  const isMainSelected = selectedPhoto ? Boolean(selectedPhoto.isMain ?? selectedPhoto.IsMain) : false;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-28 pt-4 selection:bg-[#870c3f] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      <div className="max-w-xl mx-auto px-4 md:px-6 space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center gap-3 py-2 border-b border-slate-200">
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="flex p-2 hover:bg-rose-50 text-[#870c3f] rounded-full transition-colors cursor-pointer"
            aria-label="Back"
            title="Go Back"
          >
            <ArrowLeft size={22} className="stroke-[2.5]" />
          </button>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            Gallery & Photo Privacy
          </h1>
        </div>

        {/* TITLE BANNER */}
        <div className="space-y-1 bg-white p-5 rounded-3xl border-2 border-rose-100 shadow-md">
          <h2 className="text-xl sm:text-2xl font-serif font-black text-slate-900 leading-tight">
            Manage Profile Photos
          </h2>
          <p className="text-xs font-semibold text-slate-500">
            Max 3 photos allowed (1 Main Profile Picture mandatory + 2 Gallery photos)
          </p>
        </div>

        {/* 📸 3-SLOT DYNAMIC GALLERY GRID */}
        {loading ? (
          <div className="min-h-[220px] flex items-center justify-center text-[#870c3f]">
            <Loader2 size={36} className="animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3.5 pt-2">
            
            {photos.map((photo, idx) => {
              const isMain = Boolean(photo.isMain ?? photo.IsMain);
              const imageUrl = getOptimizedImageUrl(photo.photoUrl || photo.PhotoUrl);
              return (
                <div 
                  key={idx} 
                  onClick={() => setSelectedPhoto({ ...photo, resolvedUrl: imageUrl })}
                  className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-950 shadow-md border-2 border-slate-200 cursor-pointer group hover:border-[#870c3f] transition-all"
                >
                  <img 
                    src={imageUrl} 
                    alt={`Photo ${idx + 1}`} 
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" 
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} 
                  />
                  
                  {isMain && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white text-[9px] font-black uppercase text-center py-1 tracking-wider">
                      MAIN PROFILE
                    </div>
                  )}
                </div>
              );
            })}

            {/* UPLOAD SLOTS FOR REMAINING (UP TO 3 MAX PHOTOS) */}
            {Array.from({ length: Math.max(0, 3 - photos.length) }).map((_, idx) => (
              <label 
                key={idx} 
                className="relative aspect-[3/4] rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/50 hover:bg-rose-100/60 flex flex-col items-center justify-center cursor-pointer transition-all shadow-xs group"
              >
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  disabled={uploading} 
                  className="hidden" 
                />
                
                {uploading ? (
                  <Loader2 size={24} className="animate-spin text-[#870c3f]" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-[#870c3f] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Plus size={22} className="stroke-[3]" />
                    </div>
                    <span className="text-[10px] font-black text-[#870c3f] uppercase mt-1">Add Photo</span>
                  </div>
                )}
              </label>
            ))}

          </div>
        )}

        {/* 🔒 PRIVACY DROPDOWN SELECTION */}
        <div className="pt-2 bg-white p-5 rounded-3xl border-2 border-rose-100 shadow-md space-y-2">
          <CompactSelect 
            label="Photo Privacy Settings" 
            options={privacyOptions} 
            value={privacy} 
            onChange={(val: any) => handlePrivacyChange(String(val))} 
          />
        </div>

      </div>

      {/* 🖼️ PHOTO ACTION MODAL (VIEW / MAKE PROFILE PICTURE / REPLACE / DELETE) */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-rose-100 text-slate-800 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-serif font-black text-sm uppercase text-slate-900 flex items-center gap-2">
                  Photo Actions {isMainSelected && <span className="text-[10px] bg-rose-100 text-[#870c3f] px-2 py-0.5 rounded-full font-sans font-bold">Main Profile</span>}
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
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                />
              </div>

              {isMainSelected ? (
                <div className="space-y-3 pt-1">
                  <label className="w-full p-3.5 bg-[#870c3f] hover:bg-[#6e0a33] text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all">
                    <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} 
                    Replace Main Profile Photo
                  </label>
                  <p className="text-[11px] font-bold text-slate-500 text-center flex items-center justify-center gap-1.5 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                    <ShieldAlert size={15} className="text-amber-600 shrink-0" />
                    <span>The main profile photo cannot be deleted. You can replace it directly or select another photo as main.</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button" 
                      onClick={() => handleSetPrimary(selectedPhoto)} 
                      disabled={uploading}
                      className="p-3 bg-rose-50 hover:bg-rose-100 text-[#870c3f] font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer transition-all"
                    >
                      {uploading ? <Loader2 size={15} className="animate-spin" /> : <Star size={15} />} 
                      Make Main
                    </button>

                    <label className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer transition-all">
                      <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                      <RefreshCw size={15} /> Replace
                    </label>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => handleDeletePhoto(selectedPhoto)} 
                    disabled={uploading}
                    className="w-full p-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md"
                  >
                    {uploading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} 
                    Delete Photo
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
