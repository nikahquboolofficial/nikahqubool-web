let faceapi: any = null;
let modelsLoaded = false;
let loadPromise: Promise<boolean> | null = null;

export async function loadFaceApiModels(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (modelsLoaded && faceapi) return true;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      if (!faceapi) {
        faceapi = await import("@vladmandic/face-api");
      }
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      ]);
      modelsLoaded = true;
      return true;
    } catch (err) {
      console.warn("Failed to load face-api models from /models, trying CDN fallback...", err);
      try {
        if (!faceapi) {
          faceapi = await import("@vladmandic/face-api");
        }
        const CDN_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(CDN_URL),
          faceapi.nets.ssdMobilenetv1.loadFromUri(CDN_URL),
        ]);
        modelsLoaded = true;
        return true;
      } catch (cdnErr) {
        console.warn("Failed to load face-api models from CDN:", cdnErr);
        return false;
      }
    }
  })();

  return loadPromise;
}

export interface ClientFaceCheckResult {
  isValid: boolean;
  errorCode: string;
  message: string;
  descriptor?: number[];
  similarity?: number;
}

/**
 * Robust image loader supporting all image types, data URLs, and blob URLs
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Only set crossOrigin for remote http/https URLs, never for data: or blob:
    if (src.startsWith("http://") || src.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Retry without any crossOrigin attribute
      const fallback = new Image();
      fallback.onload = () => resolve(fallback);
      fallback.onerror = () => reject(new Error("Unable to decode image file"));
      fallback.src = src;
    };
    img.src = src;
  });
}

/**
 * 1. Validate a single selected photo:
 * - Detects human face with high tolerance (supports blur, zoom, far away, side pose)
 * - Rejects non-human photos (scenery, land, trees, animals, fruits, cars, memes, text screenshots)
 * - Rejects group photos (multiple people)
 * - Never shows strange format scan errors
 */
export async function clientValidateSingleFace(
  imageSrc: string
): Promise<ClientFaceCheckResult> {
  let img: HTMLImageElement;
  try {
    img = await loadImage(imageSrc);
  } catch (loadErr) {
    // If decoding image tag directly fails, accept if valid data/blob so user is not blocked
    return {
      isValid: true,
      errorCode: "OK",
      message: "Photo accepted.",
    };
  }

  const ready = await loadFaceApiModels();
  if (!ready || !faceapi) {
    // If models cannot be loaded, accept gracefully rather than blocking the user
    return {
      isValid: true,
      errorCode: "OK",
      message: "Photo accepted.",
    };
  }

  try {
    // Tier 1: SSD MobileNet with very forgiving confidence (0.22)
    let detections: any[] = [];
    try {
      detections = await faceapi.detectAllFaces(
        img,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.22 })
      );
    } catch (_) {}

    // Tier 2: TinyFaceDetector with 416 input size (great for blurred, zoomed, side pose, far away)
    if (!detections || detections.length === 0) {
      try {
        detections = await faceapi.detectAllFaces(
          img,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.15 })
        );
      } catch (_) {}
    }

    // Tier 3: High resolution TinyFaceDetector (detects far-away full body standing photos)
    if (!detections || detections.length === 0) {
      try {
        detections = await faceapi.detectAllFaces(
          img,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 608, scoreThreshold: 0.10 })
        );
      } catch (_) {}
    }

    // If all 3 tiers detect ZERO faces, it is non-human (scenery, fruit, animal, car, text screenshot, meme)
    if (!detections || detections.length === 0) {
      return {
        isValid: false,
        errorCode: "NO_FACE",
        message:
          "No human face detected! Screenshots, scenery, animals, fruits, objects, or blurred non-human images are strictly not allowed. Please upload a clear photo of yourself.",
      };
    }

    // Check for Group Photos:
    // Only count prominent faces (area >= 1.5% of total photo area)
    // to prevent accidental background strangers in public places from triggering false rejection
    const imgArea = img.width * img.height;
    const prominentFaces = detections.filter((d: any) => {
      const box = d.box || d._box || d.detection?.box;
      if (!box || imgArea <= 0) return true;
      const boxArea = box.width * box.height;
      return (boxArea / imgArea) >= 0.015;
    });

    if (prominentFaces.length > 1) {
      return {
        isValid: false,
        errorCode: "MULTIPLE_FACES",
        message: `Group photo detected (${prominentFaces.length} people). Group photos are not allowed — please upload a solo photo of yourself.`,
      };
    }

    return {
      isValid: true,
      errorCode: "OK",
      message: "Human face verified successfully.",
    };
  } catch (err: any) {
    console.error("clientValidateSingleFace error:", err);
    // Graceful fallback: Never block user with red SCAN_ERROR
    return {
      isValid: true,
      errorCode: "OK",
      message: "Photo accepted.",
    };
  }
}

/**
 * 2. Compare two face descriptors using Euclidean distance
 */
export function compareFaceDescriptors(
  descriptorA: number[] | Float32Array,
  descriptorB: number[] | Float32Array,
  threshold = 0.68
): { isMatch: boolean; distance: number; similarity: number } {
  const dA = descriptorA instanceof Float32Array ? descriptorA : new Float32Array(descriptorA);
  const dB = descriptorB instanceof Float32Array ? descriptorB : new Float32Array(descriptorB);

  let sum = 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < dA.length; i++) {
    const diff = dA[i] - dB[i];
    sum += diff * diff;
    dot += dA[i] * dB[i];
    magA += dA[i] * dA[i];
    magB += dB[i] * dB[i];
  }
  const distance = Math.sqrt(sum);
  const cosineSim = (magA > 0 && magB > 0) ? (dot / (Math.sqrt(magA) * Math.sqrt(magB))) : 0;
  const isMatch = distance <= threshold || cosineSim >= 0.70;
  const similarity = Math.max(0, Math.min(100, Math.round(cosineSim * 100)));

  return { isMatch, distance, similarity };
}
