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
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      modelsLoaded = true;
      return true;
    } catch (err) {
      console.error("Failed to load face-api models from /models:", err);
      // Fallback to CDN if local models fail
      try {
        if (!faceapi) {
          faceapi = await import("@vladmandic/face-api");
        }
        const CDN_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(CDN_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(CDN_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(CDN_URL),
        ]);
        modelsLoaded = true;
        return true;
      } catch (cdnErr) {
        console.error("Failed to load face-api models from CDN:", cdnErr);
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

// Helper to convert base64 or URL to HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unable to load image for scanning"));
    img.src = src;
  });
}

/**
 * 1. Validate a single selected photo:
 * - Detects human face
 * - Rejects non-human (screenshots, flowers, cars, memes)
 * - Rejects group photos (multiple people)
 * - Returns 128-point Face Descriptor vector for comparison
 */
export async function clientValidateSingleFace(
  imageSrc: string
): Promise<ClientFaceCheckResult> {
  const ready = await loadFaceApiModels();
  if (!ready) {
    return {
      isValid: false,
      errorCode: "MODEL_ERROR",
      message: "Face detection engine is initializing. Please try again in a moment.",
    };
  }

  try {
    const img = await loadImage(imageSrc);

    // Run SSD MobileNet detection with full landmarks and descriptors
    const detections = await faceapi
      .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (!detections || detections.length === 0) {
      return {
        isValid: false,
        errorCode: "NO_FACE",
        message:
          "We were unable to detect a human face in your photo. Please upload a clear solo photo that clearly shows your face.",
      };
    }

    if (detections.length > 1) {
      return {
        isValid: false,
        errorCode: "MULTIPLE_FACES",
        message: `Multiple faces (${detections.length}) detected in this photo. Group photos are not allowed — please upload a solo photo of yourself.`,
      };
    }

    const singleDetection = detections[0];
    const score = singleDetection.detection.score;
    const box = singleDetection.detection.box;
    const imgArea = img.width * img.height;
    const faceArea = box.width * box.height;
    const faceRatio = imgArea > 0 ? faceArea / imgArea : 0;

    // Face too small / far away in background
    if (faceRatio < 0.005) {
      return {
        isValid: false,
        errorCode: "FACE_TOO_FAR",
        message:
          "Your face appears too far away in this photo. Please upload a closer portrait where your face is visible.",
      };
    }

    const descriptorArray = Array.from(singleDetection.descriptor);

    return {
      isValid: true,
      errorCode: "OK",
      message: "Clear human face verified successfully.",
      descriptor: descriptorArray,
    };
  } catch (err: any) {
    console.error("clientValidateSingleFace error:", err);
    return {
      isValid: false,
      errorCode: "SCAN_ERROR",
      message: "Unable to scan this photo. Please choose a standard JPG, PNG or WEBP image.",
    };
  }
}

/**
 * 2. Compare two face descriptors using Euclidean distance:
 * - Distance <= 0.6 means same person (Euclidean standard for Face-API)
 * - Returns similarity percentage and match boolean
 */
export function compareFaceDescriptors(
  descriptorA: number[] | Float32Array,
  descriptorB: number[] | Float32Array,
  threshold = 0.68
): { isMatch: boolean; distance: number; similarity: number } {
  const dA = descriptorA instanceof Float32Array ? descriptorA : new Float32Array(descriptorA);
  const dB = descriptorB instanceof Float32Array ? descriptorB : new Float32Array(descriptorB);

  // 1. Euclidean distance
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

  // 2. Cosine similarity for robust angle tolerance (side-pose vs front selfie)
  const cosineSim = (magA > 0 && magB > 0) ? (dot / (Math.sqrt(magA) * Math.sqrt(magB))) : 0;

  // Realistic matching: Matches if Euclidean distance <= 0.68 OR Cosine similarity >= 0.70
  const isMatch = distance <= threshold || cosineSim >= 0.70;
  const similarity = Math.max(0, Math.min(100, Math.round(cosineSim * 100)));

  return { isMatch, distance, similarity };
}
