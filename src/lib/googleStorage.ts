import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, uploadString, getDownloadURL, FirebaseStorage } from 'firebase/storage';

export interface StorageUploadResult {
  url: string;
  filename: string;
  storageProvider: string;
  bucket: string;
  sizeBytes?: number;
  isFreemiumGoogleStorage: boolean;
  uploadedAt: string;
  isLiveVerified?: boolean;
}

export interface StorageConfigStatus {
  isConfigured: boolean;
  provider: string;
  bucketName: string;
  freeTierQuota: string;
  planName: string;
  setupInstructions: string[];
}

/**
 * Retrieves the current Firebase / Google Cloud Storage configuration from client or server environment.
 */
function getFirebaseConfig() {
  const apiKey =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    '';
  const authDomain =
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    process.env.FIREBASE_AUTH_DOMAIN ||
    '';
  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    '';
  const storageBucket =
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.GOOGLE_CLOUD_STORAGE_BUCKET ||
    '';
  const appId =
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    process.env.FIREBASE_APP_ID ||
    '';

  const isConfigured = Boolean(storageBucket && (apiKey || projectId));

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    appId,
    isConfigured,
  };
}

let firebaseAppInstance: FirebaseApp | null = null;
let storageInstance: FirebaseStorage | null = null;

function getStorageInstance(): FirebaseStorage | null {
  const config = getFirebaseConfig();
  if (!config.isConfigured) return null;

  try {
    if (!firebaseAppInstance) {
      if (getApps().length > 0) {
        firebaseAppInstance = getApp();
      } else {
        firebaseAppInstance = initializeApp({
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          projectId: config.projectId,
          storageBucket: config.storageBucket,
          appId: config.appId,
        });
      }
    }

    if (!storageInstance && firebaseAppInstance) {
      storageInstance = getStorage(firebaseAppInstance);
    }

    return storageInstance;
  } catch (err) {
    console.warn('Could not initialize Google Cloud / Firebase Storage client:', err);
    return null;
  }
}

/**
 * Returns diagnostic and quota information regarding the Google Cloud Storage / Firebase Freemium setup.
 */
export function getGoogleStorageStatus(): StorageConfigStatus {
  const config = getFirebaseConfig();

  return {
    isConfigured: config.isConfigured,
    provider: 'Google Cloud Storage (via Firebase Spark Freemium)',
    bucketName: config.storageBucket || 'sustainability-hackathon-1a68e.firebasestorage.app',
    freeTierQuota: '5.0 GB Free Storage • 1 GB/day Download Bandwidth • 20,000 Free Uploads/day',
    planName: 'Google Firebase Spark (100% Free / No Credit Card Required)',
    setupInstructions: [
      '1. Open Google Firebase Console (https://console.firebase.google.com/) with any Google Account.',
      '2. Create a free project (e.g. "RiverRevive-AI").',
      '3. In Build menu, click "Storage" -> "Get Started" (Free Spark Plan). This provisions a genuine Google Cloud Storage bucket.',
      '4. Copy your storage bucket name (e.g. your-project.appspot.com) into NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in .env.',
      '5. Add NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID.',
    ],
  };
}

/**
 * Uploads a file (or base64 string) to Google Cloud Storage / Firebase Storage.
 * In the browser, routes via /api/storage/upload to completely bypass browser CORS preflight restrictions.
 * Server-side uses direct Firebase Storage with safety timeouts.
 * Always resolves swiftly with valid metadata so the UI never hangs.
 */
export async function uploadToGoogleStorage(
  input: File | Blob | string,
  folder: string = 'evidence',
  customFilename?: string
): Promise<StorageUploadResult> {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = typeof input === 'object' && input instanceof File ? input.name.split('.').pop() || 'jpg' : 'jpg';
  const filename = customFilename || `${folder}_${timestamp}_${randomStr}.${ext}`;
  const filePath = `${folder}/${filename}`;

  const config = getFirebaseConfig();

  // 1. Client-side browser handling: Call Next.js /api/storage/upload to avoid browser CORS errors
  if (typeof window !== 'undefined') {
    try {
      let b64 = '';
      if (typeof input === 'string') {
        b64 = input;
      } else {
        b64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(input);
        });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: b64,
          folder,
          filename,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.result) {
          return {
            ...data.result,
            isLiveVerified: true,
          };
        }
      }
    } catch {
      // Quiet fallback for static hosting / offline
    }
  }

  // 2. Server-side handling: Attempt direct Firebase Storage upload with a safety timeout
  if (typeof window === 'undefined') {
    const storage = getStorageInstance();
    if (storage && config.isConfigured) {
      try {
        const storageRef = ref(storage, filePath);

        const uploadTask = (async () => {
          if (typeof input === 'string') {
            const cleanB64 = input.includes('base64,') ? input : `data:image/jpeg;base64,${input}`;
            const snapshot = await uploadString(storageRef, cleanB64, 'data_url');
            const downloadUrl = await getDownloadURL(snapshot.ref);
            return {
              url: downloadUrl,
              filename,
              storageProvider: 'Google Cloud Storage (Firebase Spark Freemium)',
              bucket: config.storageBucket,
              sizeBytes: snapshot.metadata.size,
              isFreemiumGoogleStorage: true,
              isLiveVerified: true,
              uploadedAt: new Date().toISOString(),
            };
          } else {
            const snapshot = await uploadBytes(storageRef, input);
            const downloadUrl = await getDownloadURL(snapshot.ref);
            return {
              url: downloadUrl,
              filename,
              storageProvider: 'Google Cloud Storage (Firebase Spark Freemium)',
              bucket: config.storageBucket,
              sizeBytes: snapshot.metadata.size,
              isFreemiumGoogleStorage: true,
              isLiveVerified: true,
              uploadedAt: new Date().toISOString(),
            };
          }
        })();

        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Storage timeout')), 2500)
        );

        const result = await Promise.race([uploadTask, timeoutPromise]);
        if (result) return result;
      } catch (gcsError) {
        console.warn('Google Cloud Storage direct upload notice (using fallback):', gcsError);
      }
    }
  }

  // 3. Resilient Fallback Cache (Explicit Demo Mode)
  let dataUrl = '';
  let sizeBytes = 0;

  if (typeof input === 'string') {
    dataUrl = input.startsWith('data:') ? input : `data:image/jpeg;base64,${input}`;
    sizeBytes = Math.round(dataUrl.length * 0.75);
  } else if (typeof window !== 'undefined') {
    dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(input);
    });
    sizeBytes = input.size;
  }

  return {
    url: dataUrl,
    filename,
    storageProvider: 'Browser Local Storage (Demo Mode)',
    bucket: 'Offline Cache (Demo Mode)',
    sizeBytes,
    isFreemiumGoogleStorage: false,
    isLiveVerified: false,
    uploadedAt: new Date().toISOString(),
  };
}
