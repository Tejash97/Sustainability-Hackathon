'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { ENV } from './config';

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    ENV.FIREBASE_API_KEY ||
    '',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    'sustainability-hackathon-1a68e.firebaseapp.com',
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'sustainability-hackathon-1a68e',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'sustainability-hackathon-1a68e.firebasestorage.app',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    '134840237045',
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    '1:134840237045:web:395baeebfe7b66791dfebc',
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
    'G-C812BB4LK9',
};

// Singleton App Instance
export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Auth instance (Google accounts only)
export const auth: Auth = getAuth(app);

// Storage instance
export const storage: FirebaseStorage = getStorage(
  app,
  `gs://${firebaseConfig.storageBucket.replace(/^gs:\/\//, '')}`
);

// Google Auth Provider configured for Google Accounts
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Sign in with Google Account popup.
 * Returns the authenticated user object.
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (
      error.code === 'auth/configuration-not-found' ||
      error.code === 'auth/operation-not-allowed'
    ) {
      const err = new Error(
        'Google Authentication is not enabled yet in your Firebase Console for project "sustainability-hackathon-1a68e". Please enable the Google provider in Firebase Console -> Authentication -> Sign-in method.'
      );
      (err as any).code = 'auth/configuration-not-found';
      throw err;
    }
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error(
        'This domain is not authorized in Firebase Console yet. Please add "localhost" under Firebase Console -> Authentication -> Settings -> Authorized Domains.'
      );
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by browser. Please allow popups for this site.');
    }
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed before completing login.');
    }
    throw error;
  }
}

/**
 * Sign out the currently authenticated user.
 */
export async function signOutGoogleUser(): Promise<void> {
  await signOut(auth);
}

export type { User };
