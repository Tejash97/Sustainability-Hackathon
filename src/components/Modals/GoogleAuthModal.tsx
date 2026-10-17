'use client';

import React, { useState } from 'react';
import {
  X,
  Mail,
  ExternalLink,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const GoogleAuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    signInWithGoogle,
    loginWithGoogleEmail,
    authError,
    clearAuthError,
  } = useAuth();

  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleFirebasePopup = async () => {
    try {
      setIsSubmitting(true);
      setLocalError(null);
      clearAuthError();
      await signInWithGoogle();
      closeAuthModal();
    } catch (err: any) {
      if (
        err.code === 'auth/configuration-not-found' ||
        err.message?.includes('configuration-not-found')
      ) {
        setLocalError(
          'Google Provider is not enabled in your Firebase Console yet for project "sustainability-hackathon-1a68e". You can enable it with 2 clicks in the console, or simply enter your Google account below to proceed immediately!'
        );
      } else {
        setLocalError(err.message || 'Google Sign-In failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setLocalError('Please enter your Google/Gmail account email address.');
      return;
    }
    if (!emailInput.includes('@')) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    loginWithGoogleEmail(emailInput, nameInput);
    setEmailInput('');
    setNameInput('');
    closeAuthModal();
  };

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto min-h-screen"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div className="relative w-full max-w-md my-auto bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 text-slate-800 space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Sign in with Google
              </h2>
              <p className="text-xs text-slate-500">
                Google Calendar & Gmail Integrations
              </p>
            </div>
          </div>

          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Benefits bullets */}
        <div className="space-y-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>1-click schedule cleanup drives to your Google Calendar</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Pre-fill and share AI plans to volunteers via Gmail</span>
          </div>
        </div>

        {/* Option A: Firebase One-Click Google Popup */}
        <button
          onClick={handleFirebasePopup}
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 font-bold text-xs sm:text-sm text-slate-800 flex items-center justify-center gap-2.5 shadow-xs transition-all active:scale-[0.99] disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Firebase Config Guide Box if configuration error occurs */}
        {(localError || authError) && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Firebase Google Setup Required:</span>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Google provider is not yet enabled in Firebase Console for project <code className="bg-amber-100 px-1 rounded font-mono">sustainability-hackathon-1a68e</code>.
                </p>
                <a
                  href="https://console.firebase.google.com/project/sustainability-hackathon-1a68e/authentication/providers"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 underline hover:text-amber-950 mt-1"
                >
                  <span>Enable Google in Firebase Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">
            Or enter your Gmail
          </span>
        </div>

        {/* Option B: Direct Google Email input */}
        <form onSubmit={handleManualEmailSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Your Google / Gmail Account:
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="e.g. yourname@gmail.com"
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-xs sm:text-sm text-slate-800 font-medium bg-slate-50/60"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 block">
              Display Name (Optional):
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g. Rajesh Mishra"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-xs text-slate-800 bg-slate-50/60"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <span>Connect Google Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <p className="text-[10px] text-slate-400 text-center leading-tight">
          Your Gmail is used strictly to pre-fill calendar invites and email templates.
        </p>

      </div>
    </div>
  );
};
