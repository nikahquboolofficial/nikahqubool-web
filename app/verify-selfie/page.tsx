"use client";

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, Camera, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { verifySelfieFaceMatchApi } from '@/lib/api';
import { toast, Toaster } from 'sonner';

function VerifySelfieContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop()?.split(';').shift() : null;
  };

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

        setTimeout(() => {
          setBlinkDetected(true);
        }, 2000);
      }
    } catch (err) {
      toast.error("Camera access denied or not available on this device.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const captureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setCapturedSelfie(canvas.toDataURL('image/jpeg'));
        stopCamera();
      }
    }
  };

  const handleVerify = async () => {
    const token = getCookie("user_token");
    if (!token) {
      toast.error("Please login to verify your profile.");
      router.push('/');
      return;
    }

    setVerifying(true);
    const res = await verifySelfieFaceMatchApi(token);
    setVerifying(false);

    if (res.success) {
      toast.success(res.message || "Selfie face match verified successfully!");
      setTimeout(() => router.push('/dashboard/my-profile'), 1500);
    } else {
      toast.error(res.message || "Face verification failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <Toaster position="top-center" richColors />
      
      <div className="w-full max-w-md bg-slate-900 rounded-3xl p-6 border border-rose-900/40 shadow-2xl text-center space-y-5">
        <div className="flex items-center justify-center gap-2 text-emerald-400">
          <ShieldCheck size={28} />
          <h1 className="text-xl font-serif font-black tracking-tight text-white">Mobile Selfie Verification</h1>
        </div>

        <p className="text-xs text-slate-400">
          Capture a clear front camera selfie to auto-verify your profile badge.
        </p>

        <div className="relative w-72 h-72 mx-auto rounded-3xl overflow-hidden bg-black border-4 border-rose-500/40 shadow-inner flex items-center justify-center">
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

          {isCameraActive && !capturedSelfie && (
            <div className="absolute inset-0 border-[32px] border-black/60 rounded-full flex flex-col items-center justify-center text-center">
              <div className="w-44 h-56 border-2 border-dashed border-emerald-400 rounded-[50%] flex items-center justify-center">
                <span className="text-[10px] font-black text-emerald-300 bg-black/80 px-2 py-0.5 rounded-full uppercase tracking-widest">
                  {blinkDetected ? "✓ Eyes Blinked" : "Blink Eyes..."}
                </span>
              </div>
            </div>
          )}
        </div>

        {isCameraActive && !capturedSelfie && (
          <button
            onClick={captureSnapshot}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-lg cursor-pointer"
          >
            Capture Selfie
          </button>
        )}

        {capturedSelfie && (
          <div className="flex justify-center gap-3">
            <button
              onClick={startCamera}
              className="px-5 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs uppercase rounded-xl cursor-pointer flex items-center gap-1"
            >
              <RefreshCw size={14} /> Retake
            </button>
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase rounded-xl shadow-md cursor-pointer flex items-center gap-1"
            >
              {verifying ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              <span>Submit & Verify</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifySelfiePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading Camera...</div>}>
      <VerifySelfieContent />
    </Suspense>
  );
}
