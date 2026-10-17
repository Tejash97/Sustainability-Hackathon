'use client';

import React, { useState, useEffect } from 'react';
import { Incident, GeminiDiagnosisResponse } from '@/types';
import {
  X,
  Stethoscope,
  Sparkles,
  AlertOctagon,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  CalendarCheck,
  Calendar,
  ExternalLink,
  Bot
} from 'lucide-react';
import { GoogleShareModal, PlanSharePayload } from './GoogleShareModal';
import { diagnoseIncident } from '@/lib/gemini';

interface DiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: Incident | null;
  onOrganizeCleanup?: () => void;
}

export const DiagnosisModal: React.FC<DiagnosisModalProps> = ({
  isOpen,
  onClose,
  incident,
  onOrganizeCleanup,
}) => {
  const [diagnosis, setDiagnosis] = useState<GeminiDiagnosisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  useEffect(() => {
    if (!isOpen || !incident) {
      setDiagnosis(null);
      setError(null);
      return;
    }

    const fetchDiagnosis = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Try local API route
        try {
          const res = await fetch('/api/gemini-diagnose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ incident }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.diagnosis) {
              setDiagnosis(data.diagnosis);
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // Fallback to client-side Gemini engine
        }

        // 2. Direct client-side Gemini / heuristic engine
        const clientDiag = await diagnoseIncident(incident);
        setDiagnosis(clientDiag);
      } catch (err: any) {
        setError(err.message || 'Error generating AI diagnosis');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiagnosis();
  }, [isOpen, incident]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !incident) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 my-6 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#134e3a] text-white font-bold shadow-sm">
              <Stethoscope className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">AI Pollution Diagnosis</h2>
              <p className="text-xs text-slate-500">
                Cause hypothesis, ecological risk & safety precautions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Incident Summary Banner */}
        <div className="my-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase font-mono">
              ANALYZED INCIDENT:
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">{incident.title}</h3>
            <p className="text-xs text-slate-600 mt-1">{incident.description}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                incident.severity >= 4
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              Severity {incident.severity}/5
            </span>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              {incident.category}
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-eco-cyan animate-spin" />
            <p className="text-xs text-slate-300 font-mono tracking-wider">
              RUNNING GEMINI ENVIRONMENTAL HYDROLOGY REASONING...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="my-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Diagnosis Results */}
        {diagnosis && !isLoading && (
          <div className="space-y-4 my-2">
            {/* Remediation Tier Badge */}
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between ${
                diagnosis.remediation_tier === 'Municipal Hazmat'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {diagnosis.remediation_tier === 'Municipal Hazmat' ? (
                  <AlertOctagon className="w-5 h-5 text-rose-600" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                )}
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                    REMEDIATION ACTION CLASSIFICATION
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">
                    {diagnosis.remediation_tier === 'Municipal Hazmat'
                      ? '⚠️ MUNICIPAL HAZMAT INTERVENTION REQUIRED'
                      : '✅ COMMUNITY-FRIENDLY CLEANUP OPERATION'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
                {diagnosis.remediation_tier}
              </span>
            </div>

            {/* Cause Hypothesis */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-1">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase font-mono">
                <Bot className="w-4 h-4 text-emerald-700" />
                <span>Primary Cause Hypothesis</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {diagnosis.cause_hypothesis}
              </p>
            </div>

            {/* Ecological Risk */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-1">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase font-mono">
                <AlertOctagon className="w-4 h-4 text-amber-700" />
                <span>Ecological Risk Assessment</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {diagnosis.ecological_risk}
              </p>
            </div>

            {/* Immediate Precaution */}
            <div className="rounded-2xl p-4 bg-rose-50 border border-rose-200 space-y-1">
              <div className="flex items-center gap-2 text-rose-800 text-xs font-bold uppercase font-mono">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Immediate Safety Precaution for Citizens</span>
              </div>
              <p className="text-xs sm:text-sm text-rose-900 font-medium leading-relaxed">
                {diagnosis.immediate_precaution}
              </p>
            </div>

            {/* Model info banner */}
            <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <span className="font-mono text-emerald-800 flex items-center gap-1.5 font-medium">
                {!diagnosis.simulated ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span>✨ {diagnosis.confidence || 'Google Gemini Live AI Active'}</span>
                  </>
                ) : diagnosis.apiKeyConfigured ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span>🟢 Gemini Key Connected • Running Backup Environmental Engine</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>⚡ Offline Hydrology Engine</span>
                  </>
                )}
              </span>
              {!diagnosis.simulated && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-mono">
                  LIVE AI RESPONSE
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              title="Schedule this remediation to Google Calendar and share via Gmail"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Google Calendar & Gmail</span>
            </button>

            {onOrganizeCleanup && (
              <button
                onClick={() => {
                  onClose();
                  onOrganizeCleanup();
                }}
                className="px-4 py-2 rounded-xl bg-[#134e3a] hover:bg-[#0e3a2b] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <CalendarCheck className="w-4 h-4 text-emerald-300" />
                <span>Cleanup Plan</span>
              </button>
            )}
          </div>
        </div>

        {/* Google Calendar & Gmail Scheduling Modal */}
        {showGoogleModal && incident && (
          <GoogleShareModal
            isOpen={showGoogleModal}
            onClose={() => setShowGoogleModal(false)}
            planData={{
              title: `River Pollution Remediation: ${incident.title}`,
              tagline: `${diagnosis?.remediation_tier || 'Cleanup Action'} • ${incident.waterbodyName || 'Local Waterway'}`,
              locationName: incident.waterbodyName || 'Designated Waterbody Riverbank',
              meetingPoint: 'Riverbank Main Ghat Access Steps',
              durationHours: 2.5,
              volunteersNeeded: incident.volunteersNeeded ?? 15,
              gearNeeded: incident.gearNeeded || ['Puncture-resistant Gloves', 'Rubber Boots', 'Collection Sacks'],
              safetyGuidelines: [
                diagnosis?.immediate_precaution || 'Wear PPE and avoid direct contact with contaminated water.',
                'Follow municipal safety regulations and do not enter deep water.',
              ],
              actionSummary: diagnosis?.cause_hypothesis || incident.description,
            }}
          />
        )}
      </div>
    </div>
  );
};
