import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const AWS_ACCESS_KEY = process.env.AWS_REKOGNITION_ACCESS_KEY || "";
const AWS_SECRET_KEY = process.env.AWS_REKOGNITION_SECRET_KEY || "";
const AWS_REGION = process.env.AWS_REKOGNITION_REGION || "ap-south-1";
const AWS_COLLECTION_ID = process.env.AWS_REKOGNITION_COLLECTION_ID || "nikahqubool-verified-faces";

const R2_ACCOUNT_URL = process.env.R2_ACCOUNT_URL || "https://582206580028aa92b54dbf6ec950184e.r2.cloudflarestorage.com";
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY || "";
const R2_SECRET_KEY = process.env.R2_SECRET_KEY || "";
const R2_BUCKET = process.env.R2_BUCKET || "nikah-qubool-media";
const R2_CDN_URL = process.env.R2_CDN_URL || "https://cdn.nikahqubool.in";

function sha256Hex(data: Buffer | string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function getSignatureKey(secretKey: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmacSha256("AWS4" + secretKey, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  return hmacSha256(kService, "aws4_request");
}

async function callRekognition(targetAction: string, payloadObj: Record<string, unknown>) {
  const host = `rekognition.${AWS_REGION}.amazonaws.com`;
  const endpoint = `https://${host}/`;
  const amzTarget = `RekognitionService.${targetAction}`;
  const payloadStr = JSON.stringify(payloadObj);
  const payloadBuf = Buffer.from(payloadStr, "utf8");

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const contentType = "application/x-amz-json-1.1";
  const payloadHash = sha256Hex(payloadBuf);

  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:${amzTarget}\n`;

  const signedHeaders = "content-type;host;x-amz-date;x-amz-target";
  const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credentialScope = `${dateStamp}/${AWS_REGION}/rekognition/aws4_request`;
  const stringToSign =
    `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${sha256Hex(canonicalRequest)}`;

  const signingKey = getSignatureKey(AWS_SECRET_KEY, dateStamp, AWS_REGION, "rekognition");
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");
  const authorizationHeader =
    `AWS4-HMAC-SHA256 Credential=${AWS_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": contentType,
      "X-Amz-Date": amzDate,
      "X-Amz-Target": amzTarget,
      Authorization: authorizationHeader,
    },
    body: payloadBuf,
  });

  const text = await res.text();
  let json: any = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, data: json };
}

async function uploadBufferToR2(buffer: Buffer, folder: string, fileName: string, contentType = "image/jpeg"): Promise<string> {
  const objectKey = `${folder}/${fileName}`;
  const urlObj = new URL(`${R2_ACCOUNT_URL}/${R2_BUCKET}/${objectKey}`);
  const host = urlObj.host;
  const canonicalUri = urlObj.pathname;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const region = "auto";
  const service = "s3";
  const payloadHash = sha256Hex(buffer);

  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;

  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = `PUT\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign =
    `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${sha256Hex(canonicalRequest)}`;

  const signingKey = getSignatureKey(R2_SECRET_KEY, dateStamp, region, service);
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");
  const authorizationHeader =
    `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(urlObj.toString(), {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "X-Amz-Content-Sha256": payloadHash,
      "X-Amz-Date": amzDate,
      Authorization: authorizationHeader,
    },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    throw new Error(`R2 upload failed with status ${res.status}`);
  }
  return objectKey;
}

function stripBase64Prefix(b64: string): string {
  const idx = b64.indexOf(",");
  return idx >= 0 ? b64.slice(idx + 1).trim() : b64.trim();
}

async function validateSingleFaceBase64(base64Clean: string) {
  const detectRes = await callRekognition("DetectFaces", {
    Image: { Bytes: base64Clean },
    Attributes: ["ALL"],
  });

  if (detectRes.status !== 200) {
    return {
      isValid: false,
      errorCode: "INVALID_IMAGE",
      message: "We could not read this image format. Please choose a clear JPG or PNG portrait.",
    };
  }

  const faces = Array.isArray(detectRes.data?.FaceDetails) ? detectRes.data.FaceDetails : [];
  if (faces.length === 0) {
    return {
      isValid: false,
      errorCode: "NO_FACE",
      message: "We were unable to detect a clear face in your photo. Please upload a solo photo that clearly shows your face.",
    };
  }

  if (faces.length > 1) {
    return {
      isValid: false,
      errorCode: "MULTIPLE_FACES",
      message: `Multiple faces (${faces.length}) detected in this photo. Group photos are not allowed — please upload a solo photo of yourself.`,
    };
  }

  const face = faces[0];
  const confidence = Number(face?.Confidence || 0);
  const width = Number(face?.BoundingBox?.Width || 0);
  const height = Number(face?.BoundingBox?.Height || 0);
  const area = width * height;

  // 1. Only reject if extremely low confidence (not even a face)
  if (confidence < 60) {
    return {
      isValid: false,
      errorCode: "NO_FACE",
      message: "We were unable to detect a clear face in your photo. Please upload a clear photo that shows your face.",
    };
  }

  // 2. Reject only if face is super tiny dot in background (area < 0.005)
  if (area < 0.005) {
    return {
      isValid: false,
      errorCode: "FACE_TOO_FAR",
      message: "Your face appears too far away in this photo. Please upload a closer portrait where your face is visible.",
    };
  }

  // 3. Sunglasses check - only if dark sunglasses are detected with high confidence
  if (face?.Sunglasses?.Value === true && Number(face?.Sunglasses?.Confidence || 0) >= 90) {
    return {
      isValid: false,
      errorCode: "FACE_COVERED",
      message: "Sunglasses detected! Please upload a photo where your eyes and face are clearly visible.",
    };
  }

  // Note: We deliberately do NOT reject normal occlusions (e.g. beard, hijab, side hair, or dupatta)
  // to ensure genuine Muslim matrimony photos are seamlessly accepted!

  return {
    isValid: true,
    errorCode: "OK",
    message: "Clear human face verified.",
    confidence,
    area,
  };
}

async function compareTwoFacesBase64(sourceB64: string, targetB64: string, threshold = 70) {
  const cmpRes = await callRekognition("CompareFaces", {
    SourceImage: { Bytes: sourceB64 },
    TargetImage: { Bytes: targetB64 },
    SimilarityThreshold: 60,
  });

  if (cmpRes.status !== 200) {
    return {
      isMatch: false,
      similarity: 0,
      message: "Could not compare faces in the provided photos. Please make sure your face is clearly visible.",
    };
  }

  const matches = Array.isArray(cmpRes.data?.FaceMatches) ? cmpRes.data.FaceMatches : [];
  let maxSim = 0;
  for (const m of matches) {
    const sim = Number(m?.Similarity || 0);
    if (sim > maxSim) maxSim = sim;
  }

  if (maxSim >= threshold) {
    return {
      isMatch: true,
      similarity: maxSim,
      message: `Face matched (${maxSim.toFixed(1)}% similarity).`,
    };
  }

  return {
    isMatch: false,
    similarity: maxSim,
    message: "Face mismatch! The person in this photo does not match your verified face. Please upload only your own photos.",
  };
}

async function fetchImageUrlAsBase64(url: string): Promise<string | null> {
  try {
    const fullUrl = url.startsWith("http") ? url : `${R2_CDN_URL}/${url.replace(/^\/+/, "")}`;
    const res = await fetch(fullUrl);
    if (!res.ok) return null;
    const arr = await res.arrayBuffer();
    return Buffer.from(arr).toString("base64");
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body?.action || "validate-photo");

    // 1. VALIDATE A SINGLE SELECTED PHOTO (+ optional reference photo or saved selfie URL)
    if (action === "validate-photo") {
      const photoBase64 = stripBase64Prefix(String(body?.photoBase64 || ""));
      if (!photoBase64) {
        return NextResponse.json({ success: false, errorCode: "EMPTY", message: "No photo provided." }, { status: 400 });
      }

      const singleCheck = await validateSingleFaceBase64(photoBase64);
      if (!singleCheck.isValid) {
        return NextResponse.json({
          success: false,
          errorCode: singleCheck.errorCode,
          message: singleCheck.message,
        });
      }

      // Check against referencePhotoBase64 (e.g. Slot 1 Main photo) OR referencePhotoUrl (e.g. saved VerifiedSelfieUrl)
      let refB64 = body?.referencePhotoBase64 ? stripBase64Prefix(String(body.referencePhotoBase64)) : "";
      if (!refB64 && body?.referencePhotoUrl) {
        refB64 = (await fetchImageUrlAsBase64(String(body.referencePhotoUrl))) || "";
      }

      if (refB64) {
        const cmp = await compareTwoFacesBase64(refB64, photoBase64, 70);
        if (!cmp.isMatch) {
          return NextResponse.json({
            success: false,
            errorCode: "FACE_MISMATCH",
            similarity: cmp.similarity,
            message: body?.referencePhotoUrl
              ? "Face mismatch! This photo does not match your verified selfie. Your existing photo was kept safe."
              : "Face mismatch! This photo does not show the same person as your Main photo. All uploaded photos must be of yourself.",
          });
        }
      }

      return NextResponse.json({
        success: true,
        errorCode: "OK",
        message: "Clear solo face verified!",
      });
    }

    // 2. VERIFY LIVE SELFIE AGAINST ALL UPLOADED PHOTOS + UPLOAD SELFIE TO R2 `user-selfies`
    if (action === "verify-selfie") {
      const userId = Number(body?.userId || 0);
      const selfieBase64 = stripBase64Prefix(String(body?.selfieBase64 || ""));
      const rawPhotos: string[] = Array.isArray(body?.photosBase64) ? body.photosBase64 : [];
      const rawPhotoUrls: string[] = Array.isArray(body?.photoUrls) ? body.photoUrls : [];

      if (!selfieBase64) {
        return NextResponse.json({
          success: false,
          errorCode: "NO_SELFIE",
          message: "Live selfie was not captured properly. Please position your face in the oval frame.",
        });
      }

      // Step A: Validate live selfie has 1 clear uncovered face
      const selfieCheck = await validateSingleFaceBase64(selfieBase64);
      if (!selfieCheck.isValid) {
        return NextResponse.json({
          success: false,
          errorCode: selfieCheck.errorCode,
          message: `Live selfie check: ${selfieCheck.message}`,
        });
      }

      // Step B: Ensure collection exists & check if this face belongs to another existing account
      await callRekognition("CreateCollection", { CollectionId: AWS_COLLECTION_ID });
      const searchRes = await callRekognition("SearchFacesByImage", {
        CollectionId: AWS_COLLECTION_ID,
        Image: { Bytes: selfieBase64 },
        FaceMatchThreshold: 92,
        MaxFaces: 5,
      });

      if (searchRes.status === 200 && Array.isArray(searchRes.data?.FaceMatches)) {
        for (const m of searchRes.data.FaceMatches) {
          const extId = Number(m?.Face?.ExternalImageId || 0);
          const sim = Number(m?.Similarity || 0);
          if (extId > 0 && userId > 0 && extId !== userId && sim >= 92) {
            return NextResponse.json({
              success: false,
              errorCode: "DUPLICATE_ACCOUNT",
              matchedUserId: extId,
              message: `Identity match found: Your face is already registered with an existing Nikah Qubool account (Member ID #NQ${String(extId).padStart(7, "0")}). Duplicate accounts are not permitted.`,
            });
          }
        }
      }

      // Step C: Gather all target photos (base64 or URLs) and match selfie against every single photo
      const targetB64List: string[] = [];
      for (const b of rawPhotos) {
        if (b) targetB64List.push(stripBase64Prefix(b));
      }
      for (const u of rawPhotoUrls) {
        if (u) {
          const fetched = await fetchImageUrlAsBase64(u);
          if (fetched) targetB64List.push(fetched);
        }
      }

      if (targetB64List.length === 0) {
        return NextResponse.json({
          success: false,
          errorCode: "NO_TARGET_PHOTOS",
          message: "Please select at least one profile photo before starting face verification.",
        });
      }

      for (let i = 0; i < targetB64List.length; i++) {
        const cmp = await compareTwoFacesBase64(selfieBase64, targetB64List[i], 70);
        if (!cmp.isMatch) {
          const label = i === 0 ? "Main Photo" : `Photo #${i + 1}`;
          return NextResponse.json({
            success: false,
            errorCode: "SELFIE_MISMATCH",
            failedPhotoIndex: i,
            similarity: cmp.similarity,
            message: `Face verification failed! Your live selfie did not match your ${label}. Please make sure all uploaded photos are of yourself.`,
          });
        }
      }

      // Step D: Upload verified selfie to Cloudflare R2 in the new `user-selfies` folder!
      const selfieBuffer = Buffer.from(selfieBase64, "base64");
      const fileName = `selfie_${userId || "user"}_${crypto.randomUUID()}.jpg`;
      const selfieRelativeKey = await uploadBufferToR2(selfieBuffer, "user-selfies", fileName, "image/jpeg");
      const fullSelfieCdnUrl = `${R2_CDN_URL}/${selfieRelativeKey}`;

      // Step E: Index face in AWS Rekognition collection for future duplicate prevention
      if (userId > 0) {
        await callRekognition("IndexFaces", {
          CollectionId: AWS_COLLECTION_ID,
          Image: { Bytes: selfieBase64 },
          ExternalImageId: String(userId),
          MaxFaces: 1,
          QualityFilter: "AUTO",
        });
      }

      return NextResponse.json({
        success: true,
        errorCode: "OK",
        selfieRelativeKey,
        selfieUrl: fullSelfieCdnUrl,
        message: "AI Face Verification successful! Your live selfie matched your profile photos.",
      });
    }

    return NextResponse.json({ success: false, message: "Unsupported action" }, { status: 400 });
  } catch (err: any) {
    console.error("Face verification route error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Face verification service error." },
      { status: 500 }
    );
  }
}
