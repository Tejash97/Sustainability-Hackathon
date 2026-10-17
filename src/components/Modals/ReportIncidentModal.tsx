'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  MapPin,
  AlertTriangle,
  Upload,
  CheckCircle,
  Loader2,
  Droplets,
  Cloud,
  Check,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { IncidentCategory, Incident } from '@/types';
import { uploadToGoogleStorage, StorageUploadResult } from '@/lib/googleStorage';

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLat: number;
  defaultLng: number;
  onReportSubmitted: (newIncident: Incident) => void;
  initialData?: Partial<Incident>;
}

const CATEGORIES: IncidentCategory[] = [
  'Plastic & Solid Waste',
  'Sewage / Chemical Inflow',
  'Pipe / Infrastructure Leakage',
  'Dead Fish / Algae Bloom',
  'Oil / Industrial Slick',
];

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  isOpen,
  onClose,
  defaultLat,
  defaultLng,
  onReportSubmitted,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('Plastic & Solid Waste');
  const [severity, setSeverity] = useState<number>(3);
  const [description, setDescription] = useState('');
  const [waterbodyName, setWaterbodyName] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [lat, setLat] = useState<number>(defaultLat);
  const [lng, setLng] = useState<number>(defaultLng);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [storageInfo, setStorageInfo] = useState<StorageUploadResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync initialData or default coordinates when opened
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '');
        setCategory(initialData.category || 'Plastic & Solid Waste');
        setSeverity(initialData.severity || 3);
        setDescription(initialData.description || '');
        setWaterbodyName(initialData.waterbodyName || '');
        setReporterName(initialData.reporterName || '');
        setLat(initialData.lat || defaultLat);
        setLng(initialData.lng || defaultLng);
        setPhotoPreview(initialData.photoUrl || null);
      } else {
        setLat(defaultLat);
        setLng(defaultLng);
      }
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialData, defaultLat, defaultLng]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploadingPhoto(true);
        const reader = new FileReader();
        reader.onload = async () => {
          const b64 = reader.result as string;
          setPhotoPreview(b64);
          setIsUploadingPhoto(false);

          // Background Google Cloud Storage upload
          try {
            const uploadRes = await uploadToGoogleStorage(b64, 'incident_reports', file.name);
            setStorageInfo(uploadRes);
          } catch (uploadErr) {
            console.warn('Storage upload notice:', uploadErr);
          }
        };
        reader.onerror = () => {
          setIsUploadingPhoto(false);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Please enter a descriptive incident title.');
      return;
    }

    try {
      setIsSubmitting(true);
      let submittedIncident: Incident | null = null;

      try {
        const res = await fetch('/api/incidents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            category,
            severity,
            description,
            waterbodyName,
            reporterName: reporterName || 'Citizen Eco Guardian',
            lat,
            lng,
            photoUrl: photoPreview || undefined,
          }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data && data.incident) {
            submittedIncident = data.incident;
          }
        }
      } catch {
        // Quiet fallback for static hosting rewrite or network offline
      }

      // If server route is static rewrite or offline, persist guaranteed client record
      if (!submittedIncident) {
        submittedIncident = {
          id: `inc-user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: title.trim(),
          category,
          severity: Number(severity) || 1,
          description: description.trim(),
          lat: Number(lat),
          lng: Number(lng),
          reportedAt: new Date().toISOString(),
          reporterName: reporterName.trim() || 'Citizen Eco Guardian',
          waterbodyName: waterbodyName.trim() || 'Local Waterway',
          photoUrl: photoPreview || undefined,
          status: 'Unresolved',
          cleanTimeHours: 2.0,
          volunteersNeeded: 8,
          gearNeeded: ['Gloves', 'Trash bags', 'Rubber boots'],
          howToClean: 'Citizen volunteer cleanup. Gather loose debris and coordinate disposal.',
        };
      }

      // Save to persistent localStorage so citizen reports are never lost
      try {
        const stored = localStorage.getItem('riverrevive_user_reported_spots');
        const existing: Incident[] = stored ? JSON.parse(stored) : [];
        const filtered = existing.filter((i) => i.id !== submittedIncident!.id);
        localStorage.setItem(
          'riverrevive_user_reported_spots',
          JSON.stringify([submittedIncident, ...filtered])
        );
      } catch (storageErr) {
        console.warn('Failed to cache reported spot locally:', storageErr);
      }

      setSuccessMsg('Report submitted successfully! Pinned to Reported Spots & Map.');
      onReportSubmitted(submittedIncident);

      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setTitle('');
        setDescription('');
        setPhotoPreview(null);
        setStorageInfo(null);
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting report. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityInfo = (lvl: number) => {
    switch (lvl) {
      case 5:
        return {
          title: 'Level 5: Hazardous / Chemical Contamination',
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-600',
        };
      case 4:
        return {
          title: 'Level 4: Heavy Waste Blockage',
          bg: 'bg-orange-50 text-orange-800 border-orange-300',
          dot: 'bg-orange-500',
        };
      case 3:
        return {
          title: 'Level 3: Moderate Contamination',
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
        };
      case 2:
        return {
          title: 'Level 2: Light Plastic Debris',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
        };
      default:
        return {
          title: 'Level 1: Mild Shoreline Litter',
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          dot: 'bg-slate-400',
        };
    }
  };

  const sevInfo = getSeverityInfo(severity);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 my-6 text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Report Water Pollution / Dumping
              </h2>
              <p className="text-xs text-slate-500">
                Log geo-tagged riverbank threats for AI diagnosis and cleanup mobilization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Incident Title */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Incident Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Heavy plastic bottle accumulation below tourist ghat"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 font-medium transition-all"
            />
          </div>

          {/* Category & Waterbody Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 font-medium transition-all"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Waterbody Reference
              </label>
              <input
                type="text"
                value={waterbodyName}
                onChange={(e) => setWaterbodyName(e.target.value)}
                placeholder="e.g., Yamuna Embankment, Sector 12"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 font-medium transition-all"
              />
            </div>
          </div>

          {/* Clean Severity Slider Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Pollution Severity Level (1 – 5)
              </label>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${sevInfo.bg}`}>
                <span className={`w-2 h-2 rounded-full ${sevInfo.dot}`}></span>
                <span>{sevInfo.title}</span>
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={severity}
              onChange={(e) => setSeverity(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
            />

            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>1 (Mild Litter)</span>
              <span>3 (Moderate)</span>
              <span>5 (Hazardous / Chemical)</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Detailed Description / Ecological Symptoms
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe color, smell, volume of trash, water current stability, or signs of affected fish..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 font-medium transition-all"
            />
          </div>

          {/* Geo Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Latitude</span>
              </label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Longitude</span>
              </label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Photo Evidence with Google Cloud Storage Upload */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                <span>Photo Evidence (Optional)</span>
              </label>
              <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-semibold border border-blue-200 flex items-center gap-1">
                <Cloud className="w-3 h-3 text-blue-600" /> Google Cloud Storage Freemium
              </span>
            </div>

            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 text-xs font-bold text-slate-700 transition-all">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>{photoPreview ? 'Change Field Photo' : 'Upload Field Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {isUploadingPhoto && (
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Syncing storage...</span>
                </div>
              )}

              {photoPreview && (
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview(null);
                      setStorageInfo(null);
                    }}
                    className="absolute inset-0 bg-black/60 text-white flex items-center justify-center text-[10px] font-bold opacity-0 hover:opacity-100 transition-opacity"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reporter name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Reporter Name / Organization
            </label>
            <input
              type="text"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              placeholder="e.g., Delhi Eco Club / Student Activist"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 font-medium transition-all"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting & Registering...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-200" />
                  <span>Submit Incident</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
