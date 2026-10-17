'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  UploadCloud,
  Loader2,
  HardDrive,
  ShieldCheck,
  Server
} from 'lucide-react';
import { getGoogleStorageStatus, StorageConfigStatus, uploadToGoogleStorage } from '@/lib/googleStorage';

interface GoogleStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleStorageModal: React.FC<GoogleStorageModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<StorageConfigStatus | null>(null);
  const [testResult, setTestResult] = useState<{ isLive: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [copiedEnv, setCopiedEnv] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setStatus(getGoogleStorageStatus());
      setTestResult(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTestUpload = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);
      // Create a lightweight sample blob for testing
      const testContent = 'RiverRevive AI Google Cloud Storage Test ' + new Date().toISOString();
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      const res = await uploadToGoogleStorage(testBlob, 'diagnostics', `test_${Date.now()}.txt`);
      if (res.isLiveVerified) {
        setTestResult({
          isLive: true,
          message: `Verified Cloud Write: Stored to live bucket ${res.bucket} via ${res.storageProvider}`,
        });
      } else {
        setTestResult({
          isLive: false,
          message: `Demo Mode: Staged in browser offline cache (${res.storageProvider}). Live cloud write requires GCP service credentials.`,
        });
      }
    } catch (err: any) {
      setTestResult({
        isLive: false,
        message: `Demo Mode: ${err.message || 'Operation completed with local fallback.'}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const sampleEnvConfig = `# Google Cloud Storage via Firebase (100% Free Spark Freemium Package)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=river-revive-ai
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=river-revive-ai.appspot.com
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=river-revive-ai.firebaseapp.com
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id_here`;

  const copyEnvToClipboard = () => {
    navigator.clipboard.writeText(sampleEnvConfig);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 my-6 text-slate-800 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Google Cloud Storage Setup
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                  100% GOOGLE TOOL
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official Google Cloud & Firebase Storage integration with Freemium Spark tier
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Freemium Package Details Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-cyan-50 to-emerald-50 border border-blue-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Google Firebase Storage Spark Plan (Freemium)</span>
            </span>
            <span className="text-[11px] font-bold bg-white px-2.5 py-0.5 rounded-full text-emerald-700 border border-emerald-200 shadow-xs">
              0 Cost / No Credit Card Required
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-center text-xs">
            <div className="p-2 rounded-xl bg-white/80 border border-blue-100">
              <span className="font-extrabold text-blue-900 text-sm block">5.0 GB</span>
              <span className="text-[10px] text-slate-500">Free Storage Lifetime</span>
            </div>
            <div className="p-2 rounded-xl bg-white/80 border border-blue-100">
              <span className="font-extrabold text-blue-900 text-sm block">1 GB / day</span>
              <span className="text-[10px] text-slate-500">Free Download Bandwidth</span>
            </div>
            <div className="p-2 rounded-xl bg-white/80 border border-blue-100 col-span-2 sm:col-span-1">
              <span className="font-extrabold text-blue-900 text-sm block">20,000 / day</span>
              <span className="text-[10px] text-slate-500">Free Upload Operations</span>
            </div>
          </div>
        </div>

        {/* Current Configuration Status */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700">Storage Status:</span>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-slate-500" />
              <div>
                <span className="font-bold text-slate-800 block">
                  {status?.isConfigured ? 'Connected to Google Cloud Storage' : 'Freemium Local Storage Mode Ready'}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Bucket: {status?.bucketName || 'gs://river-revive.appspot.com'}
                </span>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
              status?.isConfigured
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {status?.isConfigured ? '● Live Cloud Bucket' : '● Emulator Ready'}
            </span>
          </div>
        </div>

        {/* Step-by-Step Setup Instructions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              How to Connect Your Free Google Cloud Storage Bucket (30 Seconds):
            </span>
            <a
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              <span>Open Firebase Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <p>1. Go to <strong className="text-slate-800">console.firebase.google.com</strong> with your Google Account.</p>
            <p>2. Click <strong>"Create a project"</strong> (e.g. <em>RiverRevive-AI</em>).</p>
            <p>3. Under <strong>Build</strong> in the sidebar, click <strong>Storage</strong> → <strong>Get Started</strong> (Select Free Spark Plan). This creates an authentic Google Cloud Storage bucket.</p>
            <p>4. Add your bucket name into <strong className="text-slate-800 font-mono">NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</strong> in your <code className="bg-white px-1.5 py-0.5 rounded border text-emerald-700">.env</code> file.</p>
          </div>
        </div>

        {/* Sample Env Snippet */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Required Environment Variables in <code className="text-emerald-700">.env</code>:
            </span>
            <button
              onClick={copyEnvToClipboard}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
            >
              {copiedEnv ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedEnv ? 'Copied' : 'Copy Template'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-2xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto leading-relaxed">
            {sampleEnvConfig}
          </pre>
        </div>

        {/* Diagnostic Test Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <div className="text-xs">
            {testResult && (
              <div className={`p-2 rounded-xl flex items-center gap-1.5 font-medium ${
                testResult.isLive
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border border-amber-200'
              }`}>
                <span>{testResult.isLive ? '✅' : 'ℹ️'}</span>
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleTestUpload}
              disabled={isTesting}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Storage...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Test Storage Upload</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
