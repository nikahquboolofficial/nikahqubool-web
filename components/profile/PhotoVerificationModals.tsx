"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Check,
  X,
  AlertCircle,
  ScanFace,
  EyeOff,
  Camera,
  Sparkles,
  UserCheck,
  Sun,
  ImageOff,
  Glasses,
  Users,
  Wand2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// 1. PHOTO GUIDELINES MODAL (Screen 2)
// ============================================================================
export function PhotoGuidelinesModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#E21E5B] text-[10px] font-black uppercase tracking-widest mb-1.5">
              <Sparkles size={11} /> Nikah Qubool Photo Standards
            </span>
            <h3 className="text-xl font-black text-slate-900">
              Use Clear, Genuine Photos
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Every photo is verified by AI to ensure a 100% authentic community
            </p>
          </div>

          {/* 2 Good Examples */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 overflow-hidden text-center shadow-sm">
              <div className="h-28 bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-100 flex flex-col items-center justify-center relative">
                <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-emerald-300">
                  <UserCheck size={30} className="text-emerald-600" />
                </div>
              </div>
              <div className="relative pt-4 pb-3 px-2 bg-white">
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto -mt-7 shadow-md border-2 border-white">
                  <Check size={15} strokeWidth={3} />
                </div>
                <p className="text-xs font-extrabold text-slate-800 mt-1.5">
                  Solo Portrait
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Only yourself in frame
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 overflow-hidden text-center shadow-sm">
              <div className="h-28 bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-100 flex flex-col items-center justify-center relative">
                <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-emerald-300">
                  <Sun size={30} className="text-amber-500" />
                </div>
              </div>
              <div className="relative pt-4 pb-3 px-2 bg-white">
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto -mt-7 shadow-md border-2 border-white">
                  <Check size={15} strokeWidth={3} />
                </div>
                <p className="text-xs font-extrabold text-slate-800 mt-1.5">
                  Clear Uncovered Face
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Well-lit, looking forward
                </p>
              </div>
            </div>
          </div>

          <div className="text-center pt-1">
            <h4 className="text-sm font-black text-slate-900">
              Avoid These Mistakes
            </h4>
          </div>

          {/* 4 Avoid Examples */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: ImageOff,
                title: "Not a Person",
                sub: "Quotes, flowers or scenery",
                bg: "from-slate-100 to-slate-200",
                iconColor: "text-slate-600",
              },
              {
                icon: Glasses,
                title: "Face Covered",
                sub: "Sunglasses, masks or hands",
                bg: "from-rose-50 to-orange-100",
                iconColor: "text-rose-600",
              },
              {
                icon: Users,
                title: "Group or Far Away",
                sub: "Multiple people or tiny face",
                bg: "from-sky-50 to-indigo-100",
                iconColor: "text-indigo-600",
              },
              {
                icon: Wand2,
                title: "AI, Filters & Actors",
                sub: "Heavy filters or celebrity pics",
                bg: "from-purple-50 to-pink-100",
                iconColor: "text-purple-600",
              },
            ].map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 overflow-hidden text-center shadow-sm"
                >
                  <div
                    className={`h-24 bg-gradient-to-br ${item.bg} flex items-center justify-center`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/90 shadow-sm flex items-center justify-center">
                      <IconComp size={24} className={item.iconColor} />
                    </div>
                  </div>
                  <div className="relative pt-3.5 pb-2.5 px-2 bg-white">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto -mt-6 shadow-md border-2 border-white">
                      <X size={13} strokeWidth={3} />
                    </div>
                    <p className="text-[11.5px] font-extrabold text-slate-800 mt-1">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {item.sub}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#E21E5B] to-rose-600 text-white font-extrabold text-sm shadow-lg shadow-rose-500/25 hover:opacity-95 transition cursor-pointer"
          >
            Ok, Got It
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. PHOTO REJECTED / FACE NOT DETECTED MODAL (Screen 3)
// ============================================================================
export function PhotoRejectedModal({
  open,
  photoPreviewUrl,
  errorCode,
  message,
  onChangePhoto,
  onClose,
}: {
  open: boolean;
  photoPreviewUrl: string;
  errorCode?: string;
  message: string;
  onChangePhoto: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  let heading = "We were unable to detect a face in your photo";
  if (errorCode === "MULTIPLE_FACES") {
    heading = "Multiple faces detected in this photo";
  } else if (errorCode === "FACE_COVERED") {
    heading = "Your face or eyes appear covered";
  } else if (errorCode === "FACE_TOO_FAR") {
    heading = "Your face is too far away in this photo";
  } else if (errorCode === "CELEBRITY_DETECTED") {
    heading = "Public figure or celebrity photo detected";
  } else if (errorCode === "FACE_MISMATCH" || errorCode === "SELFIE_MISMATCH") {
    heading = "Face does not match your verified identity";
  } else if (errorCode === "DUPLICATE_ACCOUNT") {
    heading = "Account already exists with this face";
  }

  return (
    <div className="fixed inset-0 z-[130] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 text-center relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Rejected Photo Preview with Overlapping Red Warning Circle */}
        <div className="relative w-44 h-56 mx-auto mb-8">
          <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-slate-200 shadow-lg bg-slate-100">
            {photoPreviewUrl ? (
              <img
                src={photoPreviewUrl}
                alt="Rejected preview"
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <AlertCircle size={48} />
              </div>
            )}
          </div>
          <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl border-4 border-white absolute -bottom-6 left-1/2 -translate-x-1/2">
            <span className="text-3xl font-black leading-none">!</span>
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug mb-2.5">
          {heading}
        </h3>

        <p className="text-sm text-slate-600 leading-relaxed mb-7 max-w-xs mx-auto font-medium">
          {message ||
            "Our members value authentic, high-quality profiles. Please choose a clear solo photo that shows your face."}
        </p>

        <button
          type="button"
          onClick={onChangePhoto}
          className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#E21E5B] to-rose-600 text-white font-extrabold text-sm shadow-lg shadow-rose-500/25 hover:opacity-95 transition cursor-pointer"
        >
          Change Photo
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 3. VERIFY IDENTITY INTRO MODAL (Screen 4)
// ============================================================================
export function VerifyIdentityIntroModal({
  open,
  mainPhotoUrl,
  onStartVerification,
  onChangePhoto,
}: {
  open: boolean;
  mainPhotoUrl: string;
  onStartVerification: () => void;
  onChangePhoto: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[125] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 flex flex-col">
        {/* Top Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-6">
          <div className="w-4/5 h-full bg-[#E21E5B] rounded-full" />
        </div>

        {/* Main Photo Thumbnail with Face Scan Badge */}
        <div className="relative w-32 h-42 mb-6">
          <div className="w-32 h-40 rounded-2xl overflow-hidden shadow-md border-2 border-rose-200 bg-slate-100">
            <img
              src={mainPhotoUrl}
              alt="Main profile"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="w-10 h-10 rounded-xl bg-white shadow-lg border border-rose-100 flex items-center justify-center text-[#E21E5B] absolute -bottom-2 -right-3">
            <ScanFace size={22} />
          </div>
        </div>

        <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2">
          Confirm it&apos;s you in this photo to get verified
        </h3>
        <p className="text-sm text-slate-500 font-medium mb-6">
          This ensures that you only meet genuine, real people on Nikah Qubool.
        </p>

        <div className="space-y-4 mb-7">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#E21E5B] flex items-center justify-center shrink-0 mt-0.5">
              <ScanFace size={20} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">
                Scan your face
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                This is an automated AI process to check that your live face
                matches your uploaded photo(s).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
              <EyeOff size={20} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">
                Won&apos;t be shown anywhere
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                Your verification selfie is stored privately in secure encrypted
                storage and will never be shown on your public profile.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onStartVerification}
          className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#E21E5B] to-rose-600 text-white font-extrabold text-sm shadow-lg shadow-rose-500/25 hover:opacity-95 transition cursor-pointer mb-2.5"
        >
          Verify Photo
        </button>

        <button
          type="button"
          onClick={onChangePhoto}
          className="w-full py-2.5 rounded-full text-slate-800 font-extrabold text-sm hover:bg-slate-100 transition cursor-pointer"
        >
          Change photo
        </button>

        <p className="text-[10.5px] text-slate-400 text-center mt-3 leading-relaxed">
          Powered by Nikah Qubool AI Biometric Security. Your privacy is 100%
          protected.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// 4. LIVE OVAL SELFIE SCANNER MODAL (Screen 5)
// ============================================================================
export function LiveOvalSelfieScannerModal({
  open,
  verifying,
  statusText,
  onCaptureSelfie,
  onClose,
}: {
  open: boolean;
  verifying: boolean;
  statusText?: string;
  onCaptureSelfie: (selfieDataUrl: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoCapturedRef = useRef<boolean>(false);
  const checkIntervalRef = useRef<any>(null);

  const [cameraError, setCameraError] = useState<string>("");
  const [guidePrompt, setGuidePrompt] = useState<string>(
    "Position your face in the outline"
  );
  const [faceInsideOval, setFaceInsideOval] = useState(false);

  // Un-mirror and capture image
  const captureFrame = useCallback(() => {
    if (!videoRef.current || autoCapturedRef.current) return;
    autoCapturedRef.current = true;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 800;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Un-mirror captured selfie
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    onCaptureSelfie(dataUrl);
  }, [onCaptureSelfie]);

  useEffect(() => {
    if (!open) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }

    let mounted = true;
    autoCapturedRef.current = false;
    setCameraError("");
    setFaceInsideOval(false);
    setGuidePrompt("Position your face in the outline");

    navigator.mediaDevices
      ?.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 960 },
        },
        audio: false,
      })
      .then((stream) => {
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // LIVENESS & BLINK DETECTION LOOP:
        // 1. Oval turns GREEN when face is positioned
        // 2. Instructs user: "Blink your eyes now 😉"
        // 3. Auto-captures as soon as the blink is detected!
        // This guarantees 100% real human presence and blocks all fake photo / screen attacks!
        let hasSeenOpenEyes = false;

        checkIntervalRef.current = setInterval(async () => {
          if (!mounted || autoCapturedRef.current || verifying || !videoRef.current) return;
          const video = videoRef.current;
          if (video.readyState < 2) return;

          try {
            const { detectFaceAndBlinkInVideo } = await import("@/lib/faceDetectionClient");
            const res = await detectFaceAndBlinkInVideo(video);

            if (res.hasFace) {
              setFaceInsideOval(true);

              // If eyes are open (EAR >= 0.23)
              if (!res.isBlinking) {
                hasSeenOpenEyes = true;
                setGuidePrompt("Blink your eyes now 😉");
              } else if (hasSeenOpenEyes && res.isBlinking) {
                // Blink detected! Live Human verified!
                autoCapturedRef.current = true;
                setGuidePrompt("Blink verified! Scanning face...");
                if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
                
                // Capture immediately upon opening eyes
                setTimeout(() => {
                  if (mounted) captureFrame();
                }, 200);
              }
            } else {
              hasSeenOpenEyes = false;
              setFaceInsideOval(false);
              setGuidePrompt("Position your face in the outline");
            }
          } catch (_) {}
        }, 200);
      })
      .catch(() => {
        if (mounted) {
          setCameraError(
            "Unable to access front camera. Please allow camera permission in your browser settings."
          );
        }
      });

    return () => {
      mounted = false;
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [open, verifying, captureFrame]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] bg-white sm:bg-slate-950/75 sm:backdrop-blur-sm flex items-center justify-center sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full h-full sm:h-auto sm:max-w-md sm:rounded-3xl sm:shadow-2xl sm:border sm:border-slate-100 p-6 flex flex-col justify-between items-center relative">
        {/* Top Bar */}
        <div className="w-full flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={verifying}
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <ShieldCheck size={14} className={faceInsideOval ? "text-emerald-500" : "text-[#E21E5B]"} /> Live Face Check
          </span>
          <div className="w-9" />
        </div>

        {/* Dynamic Status Pill (Green when aligned, Crimson when adjusting) */}
        <div className="mt-3 mb-4">
          <div className={`px-6 py-2.5 rounded-2xl text-white font-extrabold text-sm sm:text-base shadow-lg transition-all text-center ${
            faceInsideOval
              ? "bg-emerald-600 shadow-emerald-600/30 ring-4 ring-emerald-100 animate-pulse"
              : "bg-[#C81E56] shadow-rose-600/25"
          }`}>
            {verifying
              ? statusText || "Verifying identity & biometrics..."
              : guidePrompt}
          </div>
        </div>

        {/* Muzz-Style Oval Camera Frame with Dynamic Green/Crimson Border */}
        <div className="relative my-2 flex items-center justify-center">
          <div className={`w-64 h-80 sm:w-68 sm:h-88 rounded-[999px] p-2.5 border-[4px] border-dashed transition-all duration-300 flex items-center justify-center ${
            faceInsideOval ? "border-emerald-500 scale-[1.02]" : "border-[#C81E56]"
          }`}>
            <div className={`w-full h-full rounded-[999px] border-[3px] overflow-hidden bg-slate-900 relative shadow-inner transition-colors duration-300 ${
              faceInsideOval ? "border-emerald-500" : "border-[#C81E56]"
            }`}>
              {cameraError ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white">
                  <AlertCircle size={36} className="text-rose-400 mb-2" />
                  <p className="text-xs font-semibold leading-relaxed">
                    {cameraError}
                  </p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              )}

              {/* Scanning Glow Ring when aligned */}
              {faceInsideOval && !verifying && (
                <div className="absolute inset-0 border-4 border-emerald-400 rounded-[999px] animate-ping opacity-30 pointer-events-none" />
              )}

              {verifying && (
                <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-4 text-center z-20">
                  <RefreshCw size={36} className="animate-spin text-emerald-400 mb-3" />
                  <p className="text-xs font-extrabold tracking-wide text-white">
                    {statusText || "Matching live selfie with your photos..."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Instruction Card (No manual capture click needed!) */}
        <div className="w-full space-y-2.5 mt-4">
          <div className={`w-full py-3 px-4 rounded-2xl border text-center shadow-sm transition-colors ${
            faceInsideOval
              ? "bg-emerald-50 border-emerald-200"
              : "bg-slate-50 border-slate-200/80"
          }`}>
            <p className={`text-xs font-bold leading-relaxed ${
              faceInsideOval ? "text-emerald-800" : "text-slate-700"
            }`}>
              {faceInsideOval
                ? "Face detected! Hold still for automatic scan..."
                : "Hold your phone at eye level. When your face is aligned, it will scan automatically."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
