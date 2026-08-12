"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Eye, Lock, ChevronDown, Check, Trash2, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { fetchProfileDetailsApi, updateProfileApi } from '@/lib/api';

export default function GalleryManagementPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<any[]>([]);
  const [privacy, setPrivacy] = useState<string>('Premium Members');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop()?.split(';').shift() : null;
  };

  const getToken = useCallback(() => getCookie("user_token"), []);

  const loadGalleryData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push('/');
      return;
    }

    let userId = 0;
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user_details");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          userId = parsed.userId || parsed.UserId || parsed.id;
        } catch (e) {}
      }
    }

    setLoading(true);
    const res = await fetchProfileDetailsApi(userId > 0 ? userId : 0, token);
    if (res.success && res.data) {
      const p = res.data.profile || res.data.Profile || res.data;
      const g = res.data.gallery || res.data.Gallery || [];
      setPrivacy(p.photoPrivacy || p.PhotoPrivacy || 'Premium Members');
      
      let list = Array.isArray(g) ? g : [];
      
      // If gallery array is empty, fallback to main photo from profile
      if (list.length === 0 && (p.mainPhotoUrl || p.photoUrl)) {
        list = [{ photoUrl: p.mainPhotoUrl || p.photoUrl, isMain: true }];
      }

      // Sort photos so IsMain = 1 is always Slot 1
      list.sort((a: any, b: any) => {
        const aMain = Boolean(a.isMain ?? a.IsMain ?? (a.photoUrl === p.mainPhotoUrl));
        const bMain = Boolean(b.isMain ?? b.IsMain ?? (b.photoUrl === p.mainPhotoUrl));
        if (aMain && !bMain) return -1;
        if (!aMain && bMain) return 1;
        return 0;
      });

      setPhotos(list);
    }
    setLoading(false);
  }, [getToken, router]);

  useEffect(() => {
    loadGalleryData();
  }, [loadGalleryData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length >= 3) {
      toast.error("You can upload a maximum of 3 photos.");
      return;
    }

    const token = getToken();
    const file = files[0];
    const formData = new FormData();
    formData.append("Photo", file);
    formData.append("PhotoPrivacy", privacy);

    setUploading(true);
    const res = await updateProfileApi(formData, token);
    setUploading(false);

    if (res.success) {
      toast.success("Photo uploaded to database!");
      loadGalleryData();
    } else {
      toast.error(res.message || "Failed to upload photo.");
    }
  };

  const handlePrivacyChange = async (newPrivacy: string) => {
    setPrivacy(newPrivacy);
    const token = getToken();
    const formData = new FormData();
    formData.append("PhotoPrivacy", newPrivacy);

    const res = await updateProfileApi(formData, token);
    if (res.success) {
      toast.success("Photo privacy updated in database!");
    } else {
      toast.error(res.message || "Failed to update privacy.");
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-28 pt-4 selection:bg-[#870c3f] selection:text-white">
      <Toaster position="top-center" richColors duration={2000} />

      <div className="max-w-md mx-auto px-5 space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center gap-3 py-2">
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            Gallery
          </h1>
        </div>

        {/* TITLE BANNER */}
        <div className="space-y-1">
          <h2 className="text-2xl font-serif font-black text-slate-900 leading-tight">
            Add your photos to get 10x more matches
          </h2>
        </div>

        {/* 📸 3-SLOT DYNAMIC GALLERY GRID (MATCHING SCREENSHOT 2) */}
        {loading ? (
          <div className="min-h-[220px] flex items-center justify-center text-[#870c3f]">
            <Loader2 size={36} className="animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 pt-2">
            
            {/* DYNAMIC PHOTOS (IsMain=1 in Slot 1, IsMain=0 in Slot 2 & 3) */}
            {photos.map((photo, idx) => {
              const isMain = idx === 0 || Boolean(photo.isMain ?? photo.IsMain);
              return (
                <div 
                  key={idx} 
                  className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-950 shadow-md border-2 border-slate-100 group"
                >
                  <img 
                    src={photo.photoUrl} 
                    alt={`Photo ${idx + 1}`} 
                    className="w-full h-full object-cover object-top" 
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} 
                  />
                  
                  {/* PROFILE PHOTO LABEL FOR SLOT 1 (IsMain = 1) */}
                  {isMain && (
                    <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 text-white text-[9px] font-black uppercase text-center py-1 tracking-wider">
                      PROFILE PHOTO
                    </div>
                  )}
                </div>
              );
            })}

            {/* UPLOAD SLOTS FOR REMAINING (UP TO 3 MAX PHOTOS) */}
            {Array.from({ length: Math.max(0, 3 - photos.length) }).map((_, idx) => (
              <label 
                key={idx} 
                className="relative aspect-[3/4] rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/40 hover:bg-rose-100/60 flex flex-col items-center justify-center cursor-pointer transition-all shadow-xs group"
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
                  <div className="w-9 h-9 rounded-full bg-[#870c3f] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Plus size={20} className="stroke-[3]" />
                  </div>
                )}
              </label>
            ))}

          </div>
        )}

        {/* 🔒 PRIVACY DROPDOWN BOX */}
        <div className="pt-4 space-y-2">
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                <Eye size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Who can see my photo</span>
                <select 
                  value={privacy}
                  onChange={(e) => handlePrivacyChange(e.target.value)}
                  className="text-xs font-black text-slate-900 bg-transparent outline-none cursor-pointer mt-0.5"
                >
                  <option value="All Members">All Members</option>
                  <option value="Premium Members">Premium Members</option>
                  <option value="Only Approved Members">Only Approved Members</option>
                </select>
              </div>
            </div>
            <ChevronDown size={18} className="text-slate-400 pointer-events-none" />
          </div>

          <p className="text-[11px] font-semibold text-slate-400 px-1">
            You can change this later in your privacy settings
          </p>
        </div>

      </div>
    </div>
  );
}
