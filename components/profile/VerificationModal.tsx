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
  // Only 2 options: 'selfie' or 'document'
  const [activeTab, setActiveTab] = useState<'selfie' | 'document'>('selfie');
  
  // Document Upload State
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Live Camera Selfie State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [verifyingSelfie, setVerifyingSelfie] = useState(false);
  const [isDesktopPrompt, setIsDesktopPrompt] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsDesktopPrompt(!isMobile);
    }
  }, [isOpen]);

  // Start Camera
  const startCamera = async () => {
    // Check if main photo is present
    if (!mainPhotoUrl || mainPhotoUrl.includes('placeholder') || mainPhotoUrl.includes('default')) {
      toast.error("Please upload your main profile photo in Gallery first before verifying with selfie.");
      return;
    }

    setCapturedSelfie(null);
    setBlinkDetected(false);
    setIsDesktopPrompt(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);

        setTimeout(() => {
          setBlinkDetected(true);
        }, 1800);
      }
    } catch (err) {
      toast.error("Camera access not available or blocked. Please verify on mobile or upload a Govt ID document.");
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedSelfie(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Capture Canvas Snapshot
  const captureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedSelfie(dataUrl);
        stopCamera();
      }
    }
  };

  // Submit Selfie Match with captured selfie
  const handleVerifySelfieMatch = async () => {
    if (!capturedSelfie) {
      toast.error("Please capture your live selfie first.");
      return;
    }
    setVerifyingSelfie(true);
    toast.info("Analyzing face match against your profile photo...");

    const res = await verifySelfieFaceMatchApi(capturedSelfie, token);
    setVerifyingSelfie(false);

    if (res.success) {
      toast.success(res.message || "Live selfie verified successfully! Profile is now verified.");
      onVerificationSuccess();
      onClose();
    } else {
      toast.error(res.message || "Face match verification failed. Please take a clear photo in good light.");
    }
  };

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
              <h2 className="text-xl font-bold tracking-tight text-white">Profile Verification</h2>
            </div>
            <p className="text-xs text-rose-100 font-medium">Verify your profile with Live Selfie or Govt ID Document</p>
          </div>

          {/* STRICTLY 2 TABS: SELFIE & GOVT ID */}
          <div className="grid grid-cols-2 gap-2 p-2 bg-rose-50/70 border-b border-rose-100">
            <button
              onClick={() => { setActiveTab('selfie'); stopCamera(); }}
              className={`py-2.5 px-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'selfie' 
                  ? 'bg-[#d91b5c] text-white shadow-sm' 
                  : 'text-slate-600 hover:text-[#d91b5c] bg-white/50'
              }`}
            >
              <Camera size={16} />
              <span>1. Live Selfie</span>
            </button>

            <button
              onClick={() => { setActiveTab('document'); stopCamera(); }}
              className={`py-2.5 px-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'document' 
                  ? 'bg-[#d91b5c] text-white shadow-sm' 
                  : 'text-slate-600 hover:text-[#d91b5c] bg-white/50'
              }`}
            >
              <FileText size={16} />
              <span>2. Govt ID Document</span>
            </button>
          </div>

          {/* TAB BODY */}
          <div className="p-5 sm:p-6">

            {/* 📸 TAB 1: AI CAMERA SELFIE FACE MATCH */}
            {activeTab === 'selfie' && (
              <div className="space-y-4 text-center">
                
                {/* DESKTOP NOTICE IF USER IS ON PC/LAPTOP */}
                {isDesktopPrompt && !isCameraActive && !capturedSelfie ? (
                  <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                      <Smartphone size={24} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900">Mobile Camera Recommended</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Live Selfie AI face verification front smartphone camera se sabse behtar kaam karta hai.
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Mobile phone se login karke selfie verify karein, ya yahan desktop par apna Govt ID Document (Aadhaar / Passport) upload karein.
                    </p>
                    <div className="flex flex-col gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab('document')}
                        className="w-full py-2.5 rounded-xl bg-[#d91b5c] text-white text-xs font-black shadow-sm hover:brightness-110 cursor-pointer"
                      >
                        Upload Govt ID on Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => startCamera()}
                        className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        Try with Web Camera
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-sm">Live Face Match Verification</h3>
                      <p className="text-xs text-slate-500">Live front selfie match against your main profile picture.</p>
                    </div>

                    {/* CAMERA CONTAINER */}
                    <div className="relative w-60 h-60 mx-auto rounded-3xl overflow-hidden bg-slate-950 border-4 border-rose-200 shadow-inner flex items-center justify-center">
                      {!isCameraActive && !capturedSelfie && (
                        <div className="p-6 text-center space-y-3">
                          <div className="w-14 h-14 rounded-full bg-rose-900/40 text-amber-300 flex items-center justify-center mx-auto border border-amber-300/30">
                            <Camera size={28} />
                          </div>
                          <button
                            onClick={startCamera}
                            className="px-6 py-2.5 bg-gradient-to-r from-[#d91b5c] to-[#e11d48] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:brightness-110 cursor-pointer"
                          >
                            Start Front Camera
                          </button>
                        </div>
                      )}

                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${isCameraActive && !capturedSelfie ? 'block' : 'hidden'}`}
                      />

                      {capturedSelfie && (
                        <img src={capturedSelfie} alt="Selfie" className="w-full h-full object-cover" />
                      )}

                      <canvas ref={canvasRef} className="hidden" />

                      {/* FACE OVAL OVERLAY */}
                      {isCameraActive && !capturedSelfie && (
                        <div className="absolute inset-0 pointer-events-none border-[28px] border-black/50 rounded-full flex flex-col items-center justify-center text-center p-2">
                          <div className="w-36 h-48 border-2 border-dashed border-emerald-400 rounded-[50%] flex items-center justify-center">
                            <span className="text-[10px] font-black text-emerald-300 bg-slate-950/80 px-2 py-0.5 rounded-full uppercase tracking-widest">
                              {blinkDetected ? "✓ Face Aligned" : "Align Face"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CAMERA ACTIONS */}
                    {isCameraActive && !capturedSelfie && (
                      <div className="pt-2">
                        <button
                          onClick={captureSnapshot}
                          className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-lg cursor-pointer flex items-center gap-2 mx-auto"
                        >
                          <Camera size={16} />
                          <span>Take Photo</span>
                        </button>
                      </div>
                    )}

                    {capturedSelfie && (
                      <div className="flex justify-center gap-3 pt-2">
                        <button
                          onClick={startCamera}
                          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase rounded-xl cursor-pointer flex items-center gap-1.5"
                        >
                          <RefreshCw size={14} /> Retake
                        </button>
                        <button
                          onClick={handleVerifySelfieMatch}
                          disabled={verifyingSelfie}
                          className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {verifyingSelfie ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                          <span>Verify Face Now</span>
                        </button>
                      </div>
                    )}
                  </>
                )}

              </div>
            )}

            {/* 📄 TAB 2: GOVT ID DOCUMENT UPLOAD */}
            {activeTab === 'document' && (
              <div className="space-y-4 text-center">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm">Upload Govt Issued ID Document</h3>
                  <p className="text-xs text-slate-500">Aadhaar Card, Passport, or Driving License for fast Admin review.</p>
                </div>

                <div className="border-2 border-dashed border-rose-200 rounded-3xl p-6 bg-rose-50/40 space-y-3">
                  <input
                    type="file"
                    id="govt-doc-input"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f && f.size > 5 * 1024 * 1024) {
                        toast.error("Document file size cannot exceed 5 MB.");
                        e.target.value = '';
                        return;
                      }
                      setDocFile(f || null);
                    }}
                    className="hidden"
                  />

                  <label 
                    htmlFor="govt-doc-input"
                    className="cursor-pointer block space-y-2"
                  >
                    <div className="w-14 h-14 rounded-full bg-rose-100 text-[#d91b5c] flex items-center justify-center mx-auto shadow-xs">
                      <Upload size={24} />
                    </div>
                    <span className="text-xs font-black text-[#d91b5c] uppercase block">
                      {docFile ? docFile.name : "Choose Govt ID File"}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Supports JPG, PNG, WEBP, PDF (Max 5MB)</span>
                  </label>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[11px] text-amber-800 flex items-start gap-2 text-left">
                  <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Documents are securely stored on encrypted Cloudflare R2 storage and reviewed by our trust & safety team within 2-4 hours.</span>
                </div>

                <button
                  onClick={handleDocSubmit}
                  disabled={uploadingDoc || !docFile}
                  className="w-full py-3 bg-[#d91b5c] hover:bg-[#b01448] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {uploadingDoc ? <Loader2 size={16} className="animate-spin text-amber-300" /> : <Upload size={16} />}
                  <span>Submit for Admin Approval</span>
                </button>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
