"use client";

import React, { useRef } from 'react';
import { Check, X, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface ImageCropModalProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob, croppedUrl: string) => void;
  onClose: () => void;
}

export default function ImageCropModal({ imageSrc, onCropComplete, onClose }: ImageCropModalProps) {
  const imageRef = useRef<HTMLImageElement>(null);

  const handleCropSave = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    
    // CANVAS PRESERVES FULL ORIGINAL ASPECT RATIO WITHOUT CUTTING BODY
    const canvas = document.createElement('canvas');
    const maxWidth = 800;
    const scale = Math.min(1, maxWidth / img.naturalWidth);
    
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) onCropComplete(blob, URL.createObjectURL(blob));
      }, 'image/jpeg', 0.90);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="relative w-full max-w-[440px] bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-rose-100 text-slate-800"
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] px-6 py-4 flex items-center justify-between text-white font-serif font-bold text-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-amber-300" />
            <span>Confirm Profile Photo</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-all cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* IMAGE DISPLAY CONTAINER */}
        <div className="p-6 flex flex-col items-center space-y-4">
          <p className="text-xs font-semibold text-slate-500 text-center">
            Your full uploaded photo will be saved without cutting off head or body!
          </p>

          <div className="relative w-full max-h-[360px] rounded-2xl overflow-hidden border-2 border-slate-300 bg-slate-950 flex items-center justify-center p-2 shadow-inner">
            <img
              ref={imageRef} 
              src={imageSrc} 
              alt="Upload Preview" 
              className="max-h-[340px] w-auto object-contain rounded-xl"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3 w-full pt-2">
            <button 
              onClick={onClose} 
              className="px-5 py-3.5 border-2 border-slate-300 text-slate-700 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={handleCropSave} 
              className="flex-1 py-3.5 bg-gradient-to-r from-[#870c3f] via-[#9e0f4a] to-[#870c3f] text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:brightness-110 flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 active:scale-95 transition-all cursor-pointer border border-rose-300/30"
            >
              <Check size={18} className="text-amber-300" /> 
              <span>Use Full Photo</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}