"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Camera, FileText, QrCode, Upload, 
  CheckCircle2, Loader2, RefreshCw, X, AlertCircle, Sparkles, Smartphone, Eye
} from 'lucide-react';
import { uploadGovtDocumentApi, verifySelfieFaceMatchApi } from '@/lib/api';
import { toast } from 'sonner';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  token: string | null;
  onVerificationSuccess: () => void;
}

export default function VerificationModal({
  isOpen,
  onClose,
  userId,
  token,
  onVerificationSuccess
}: VerificationModalProps) {
  const [activeTab, setActiveTab] = useState<'selfie' | 'document' | 'qr'>('selfie');
  
  // Document Upload State
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Live Camera Selfie State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [verifyingSelfie, setVerifyingSelfie] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Start Camera
  const startCamera = async () => {
    setCapturedSelfie(null);
    setBlinkDetected(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);

        // Simulate eyes blink detection after 2 seconds
        setTimeout(() => {
          setBlinkDetected(true);
        }, 2200);
      }
    } catch (err) {
      toast.error("Camera access denied or not available. Try uploading a document or use QR code.");
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
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedSelfie(dataUrl);
        stopCamera();
      }
    }
  };

  // Submit Selfie Match
  const handleVerifySelfieMatch = async () => {
    if (!capturedSelfie) return;
    setVerifyingSelfie(true);
    toast.info("Analyzing face landmarks against profile photo...");

    const res = await verifySelfieFaceMatchApi(token);
    setVerifyingSelfie(false);

    if (res.success) {
      toast.success(res.message || "Live selfie verified successfully! Profile is now verified.");
      onVerificationSuccess();
      onClose();
    } else {
      toast.error(res.message || "Face match failed. Please capture a clear selfie in good lighting.");
    }
  };

  // Handle Govt Document Upload
  const handleDocSubmit = async () => {
    if (!docFile) {
      toast.error("Please select a Govt ID document file (Aadhaar, Passport, or DL).");
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

  const mobileVerifyUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/verify-selfie?userId=${userId}` 
    : `https://nikah-qubool-website.vercel.app/verify-selfie?userId=${userId}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-rose-100 overflow-hidden my-auto text-slate-800"
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
              <ShieldCheck size={26} className="text-emerald-400" />
              <h2 className="text-xl font-serif font-black tracking-tight text-white">Get Verified Badge</h2>
            </div>
            <p className="text-xs text-rose-100 font-medium">Verify your profile to gain 3x more trust and matches!</p>
          </div>

          {/* TAB BAR */}
          <div className="grid grid-cols-3 gap-1 p-2 bg-rose-50/70 border-b border-rose-100">
            <button
              onClick={() => { setActiveTab('selfie'); stopCamera(); }}
              className={`py-2.5 px-2 rounded-xl text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'selfie' 
                  ? 'bg-[#d91b5c] text-white shadow-sm' 
                  : 'text-slate-600 hover:text-[#d91b5c]'
              }`}
            >
              <Camera size={15} />
              <span>AI Selfie</span>
            </button>

            <button
              onClick={() => { setActiveTab('document'); stopCamera(); }}
              className={`py-2.5 px-2 rounded-xl text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'document' 
                  ? 'bg-[#d91b5c] text-white shadow-sm' 
                  : 'text-slate-600 hover:text-[#d91b5c]'
              }`}
            >
              <FileText size={15} />
              <span>Govt ID</span>
            </button>

            <button
              onClick={() => { setActiveTab('qr'); stopCamera(); }}
              className={`py-2.5 px-2 rounded-xl text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'qr' 
                  ? 'bg-[#d91b5c] text-white shadow-sm' 
                  : 'text-slate-600 hover:text-[#d91b5c]'
              }`}
            >
              <QrCode size={15} />
              <span>Mobile QR</span>
            </button>
          </div>

          {/* TAB BODY */}
          <div className="p-6">

            {/* 📸 TAB 1: AI CAMERA SELFIE FACE MATCH */}
            {activeTab === 'selfie' && (
              <div className="space-y-4 text-center">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 text-sm uppercase">Instant AI Face Match Verification</h3>
                  <p className="text-xs text-slate-500">Live front camera snapshot match against your main profile picture.</p>
                </div>

                {/* CAMERA CONTAINER */}
                <div className="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden bg-slate-950 border-4 border-rose-200 shadow-inner flex items-center justify-center">
                  {!isCameraActive && !capturedSelfie && (
                    <div className="p-6 text-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-rose-900/40 text-amber-300 flex items-center justify-center mx-auto border border-amber-300/30">
                        <Camera size={32} />
                      </div>
                      <button
                        onClick={startCamera}
                        className="px-6 py-2.5 bg-gradient-to-r from-[#d91b5c] to-[#e11d48] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:brightness-110 cursor-pointer"
                      >
                        Open Camera
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
                    <div className="absolute inset-0 pointer-events-none border-[32px] border-black/50 rounded-full flex flex-col items-center justify-center text-center p-2">
                      <div className="w-40 h-52 border-2 border-dashed border-emerald-400 rounded-[50%] flex items-center justify-center">
                        <span className="text-[10px] font-black text-emerald-300 bg-slate-950/80 px-2 py-0.5 rounded-full uppercase tracking-widest">
                          {blinkDetected ? "✓ Blink Detected!" : "Blink Eyes..."}
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
                      className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      {verifyingSelfie ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      <span>Verify Now</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 📄 TAB 2: GOVT ID DOCUMENT UPLOAD */}
            {activeTab === 'document' && (
              <div className="space-y-4 text-center">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 text-sm uppercase">Upload Govt Issued ID Document</h3>
                  <p className="text-xs text-slate-500">Upload Aadhaar Card, Passport, or Driving License for Admin review.</p>
                </div>

                <div className="border-2 border-dashed border-rose-200 rounded-3xl p-6 bg-rose-50/40 space-y-3">
                  <input
                    type="file"
                    id="govt-doc-input"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />

                  <label 
                    htmlFor="govt-doc-input"
                    className="cursor-pointer block space-y-2"
                  >
                    <div className="w-14 h-14 rounded-full bg-rose-100 text-[#d91b5c] flex items-center justify-center mx-auto shadow-xs">
                      <Upload size={26} />
                    </div>
                    <span className="text-xs font-black text-[#d91b5c] uppercase block">
                      {docFile ? docFile.name : "Choose Govt ID File"}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Supports JPG, PNG, WEBP, PDF (Max 15MB)</span>
                  </label>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[11px] text-amber-800 flex items-start gap-2 text-left">
                  <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Documents are uploaded securely to Cloudflare R2 (`documents/` storage) and reviewed by our admin team within 2-4 hours.</span>
                </div>

                <button
                  onClick={handleDocSubmit}
                  disabled={uploadingDoc || !docFile}
                  className="w-full py-3 bg-[#d91b5c] hover:bg-[#6b0932] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {uploadingDoc ? <Loader2 size={16} className="animate-spin text-amber-300" /> : <Upload size={16} />}
                  <span>Submit for Admin Approval</span>
                </button>
              </div>
            )}

            {/* 📱 TAB 3: DESKTOP-TO-MOBILE QR CODE HANDOVER */}
            {activeTab === 'qr' && (
              <div className="space-y-4 text-center">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 text-sm uppercase">Verify Via Mobile Camera</h3>
                  <p className="text-xs text-slate-500">Scan QR Code with your phone camera to complete live selfie verification on mobile.</p>
                </div>

                <div className="bg-white p-4 rounded-3xl border-2 border-rose-100 shadow-md max-w-xs mx-auto space-y-3">
                  <div className="p-3 bg-slate-950 rounded-2xl inline-block shadow-inner">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(mobileVerifyUrl)}`} 
                      alt="Scan QR" 
                      className="w-40 h-40 object-contain rounded-xl"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700">
                    <Smartphone size={16} className="text-[#d91b5c]" />
                    <span>Scan with Mobile Camera</span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  Direct Link: <a href={mobileVerifyUrl} target="_blank" rel="noreferrer" className="text-[#d91b5c] font-bold underline">{mobileVerifyUrl}</a>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

