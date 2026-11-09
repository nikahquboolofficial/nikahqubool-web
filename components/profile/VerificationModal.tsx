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
