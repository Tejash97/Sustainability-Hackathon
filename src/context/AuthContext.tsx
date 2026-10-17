'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOutGoogleUser,
} from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<AppUser | null>;
  loginWithGoogleEmail: (email: string, name?: string) => AppUser;
  signOut: () => Promise<void>;
  userEmail: string | null;
  userName: string | null;
  userPhoto: string | null;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => null,
  loginWithGoogleEmail: () => ({ uid: '', email: '', displayName: '', photoURL: null }),
  signOut: async () => {},
  userEmail: null,
  userName: null,
  userPhoto: null,
  isAuthModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  authError: null,
  clearAuthError: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Restore local session if previously signed in
    try {
      const stored = localStorage.getItem('riverrevive_google_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Error reading stored google user:', e);
    }

    // 2. Listen to Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, (currentUser: FirebaseUser | null) => {
      if (currentUser) {
        const appUser: AppUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        };
        setUser(appUser);
        try {
          localStorage.setItem('riverrevive_google_user', JSON.stringify(appUser));
        } catch {}
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<AppUser | null> => {
    try {
      setAuthError(null);
      const loggedUser = await firebaseSignInWithGoogle();
      const appUser: AppUser = {
        uid: loggedUser.uid,
        email: loggedUser.email,
        displayName: loggedUser.displayName,
        photoURL: loggedUser.photoURL,
      };
      setUser(appUser);
      try {
        localStorage.setItem('riverrevive_google_user', JSON.stringify(appUser));
      } catch {}
      setIsAuthModalOpen(false);
      return appUser;
    } catch (err: any) {
      console.warn('Sign in with Google error:', err);
      if (
        err.code === 'auth/configuration-not-found' ||
        err.message?.includes('configuration-not-found')
      ) {
        setAuthError(
          'Google Provider is not enabled in your Firebase Console yet for project "sustainability-hackathon-1a68e". You can enable it in the console, or simply connect your Google account below!'
        );
        setIsAuthModalOpen(true);
      } else {
        setAuthError(err.message || 'Google Sign-in failed');
      }
      throw err;
    }
  };

  const loginWithGoogleEmail = (email: string, name?: string): AppUser => {
    const trimmedEmail = email.trim().toLowerCase();
    const derivedName =
      name?.trim() || trimmedEmail.split('@')[0].replace(/[._]/g, ' ');
    const formattedName = derivedName
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const appUser: AppUser = {
      uid: `google-${Date.now()}`,
      email: trimmedEmail,
      displayName: formattedName,
      photoURL: `https://lh3.googleusercontent.com/a/default-user`,
    };

    setUser(appUser);
    setAuthError(null);
    setIsAuthModalOpen(false);

    try {
      localStorage.setItem('riverrevive_google_user', JSON.stringify(appUser));
    } catch {}

    return appUser;
  };

  const signOut = async (): Promise<void> => {
    try {
      await signOutGoogleUser();
    } catch {}
    try {
      localStorage.removeItem('riverrevive_google_user');
    } catch {}
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        loginWithGoogleEmail,
        signOut,
        userEmail: user?.email || null,
        userName: user?.displayName || (user?.email ? user.email.split('@')[0] : null),
        userPhoto: user?.photoURL || null,
        isAuthModalOpen,
        openAuthModal: () => {
          setAuthError(null);
          setIsAuthModalOpen(true);
        },
        closeAuthModal: () => setIsAuthModalOpen(false),
        authError,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
