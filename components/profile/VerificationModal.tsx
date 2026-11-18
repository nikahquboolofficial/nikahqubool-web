"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Camera, FileText, Upload, 
  CheckCircle2, Loader2, RefreshCw, X, AlertCircle, Smartphone
} from 'lucide-react';
import { uploadGovtDocumentApi, verifySelfieFaceMatchApi } from '@/lib/api';
import { toast } from 'sonner';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  token: string | null;
  mainPhotoUrl?: string;
  onVerificationSuccess: () => void;
}

export default function VerificationModal({
  isOpen,
  onClose,
  userId,
  token,
  mainPhotoUrl,
  onVerificationSuccess
}: VerificationModalProps) {
  // Document Upload State (Govt ID Document only)
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  if (!isOpen) return null;

  // Handle Govt Document Upload
  const handleDocSubmit = async () => {
    if (!docFile) {
      toast.error("Please select a Govt ID document file (Aadhaar, Passport, or DL).");
      return;
    }

    if (docFile.size > 5 * 1024 * 1024) {
      toast.error("Document file size cannot exceed 5 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("document", docFile);

    setUploadingDoc(true);
    const res = await uploadGovtDocumentApi(formData, token);
    setUploadingDoc(false);

    if (res.success) {
      toast.success(res.message || "Document uploaded successfully! Sent for Admin review.");
      onVerificationSuccess();
      onClose();
    } else {
      toast.error(res.message || "Failed to upload document.");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden my-auto text-slate-800"
        >
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#d91b5c] via-[#e11d48] to-[#d91b5c] p-5 text-white text-center relative shadow-md">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white text-white hover:text-slate-900 flex items-center justify-center font-bold text-xs transition-all cursor-pointer"
            >
              ✕
            </button>
            <div className="flex items-center justify-center gap-2 mb-1">
              <ShieldCheck size={24} className="text-emerald-400" />
              <h2 className="text-xl font-bold tracking-tight text-white">Govt ID Verification</h2>
            </div>
            <p className="text-xs text-rose-100 font-medium">Upload your Aadhaar, Passport or Driving License to get a Verified Badge</p>
          </div>

          {/* DOCUMENT BODY */}
          <div className="p-5 sm:p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-[#d91b5c] flex items-center justify-center mx-auto">
                <FileText size={24} />
              </div>
              <h4 className="text-sm font-black text-slate-800">Upload Government ID Document</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Accepted: Aadhaar Card, Passport, Driving License, or Voter ID.
                <br />
                <span className="text-emerald-600 font-semibold">Your document remains 100% confidential and is never shared publicly.</span>
              </p>
            </div>

            <label className="block border-2 border-dashed border-rose-200 hover:border-[#d91b5c] rounded-2xl p-5 text-center cursor-pointer transition-all bg-white hover:bg-rose-50/20">
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setDocFile(e.target.files[0]);
                  }
                }}
              />
              <Upload size={28} className="mx-auto text-[#d91b5c] mb-2" />
              {docFile ? (
                <div className="space-y-1">
                  <p className="text-xs font-black text-emerald-600 truncate max-w-xs mx-auto">
                    ✓ {docFile.name}
                  </p>
                  <p className="text-[11px] text-slate-400">Click to change file</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-700">Choose file to upload</p>
                  <p className="text-[11px] text-slate-400">JPG, PNG, WEBP or PDF (Max 5 MB)</p>
                </div>
              )}
            </label>

            <button
              onClick={handleDocSubmit}
              disabled={!docFile || uploadingDoc}
              className="w-full py-3.5 rounded-2xl bg-[#d91b5c] hover:bg-[#c2144f] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {uploadingDoc ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting Document...</span>
                </>
              ) : (
                <span>Submit for Verification</span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}