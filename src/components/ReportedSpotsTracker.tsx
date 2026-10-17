'use client';

import React, { useState } from 'react';
import {
  MapPin,
  AlertTriangle,
  Clock,
  Users,
  Camera,
  Bot,
  CalendarCheck,
  CheckCircle2,
  Trash2,
  ExternalLink,
  PlusCircle,
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Incident } from '@/types';

interface ReportedSpotsTrackerProps {
  reportedIncidents: Incident[];
  onOpenReportModal: () => void;
  onSelectIncidentOnMap: (incident: Incident) => void;
  onDiagnoseIncident: (incident: Incident) => void;
  onOrganizeCleanupForIncident: (incident: Incident) => void;
  onAnalyzeImageForIncident: (incident: Incident) => void;
  onDeleteIncident?: (id: string) => void;
}

export const ReportedSpotsTracker: React.FC<ReportedSpotsTrackerProps> = ({
  reportedIncidents,
  onOpenReportModal,
  onSelectIncidentOnMap,
  onDiagnoseIncident,
  onOrganizeCleanupForIncident,
  onAnalyzeImageForIncident,
  onDeleteIncident,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  const handleCopyCoords = (incident: Incident) => {
    navigator.clipboard.writeText(`${incident.lat.toFixed(6)}, ${incident.lng.toFixed(6)}`);
    setCopiedId(incident.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSeverityBadge = (level: number) => {
    if (level >= 5) {
      return {
        text: 'Level 5: Hazardous / Chemical Contamination',
        color: 'bg-rose-50 text-rose-700 border-rose-300 ring-rose-200',
        dot: 'bg-rose-600',
      };
    }
    if (level === 4) {
      return {
        text: 'Level 4: Severe Accumulation',
        color: 'bg-orange-50 text-orange-700 border-orange-300 ring-orange-200',
        dot: 'bg-orange-500',
      };
    }
    if (level === 3) {
      return {
        text: 'Level 3: Moderate Contamination',
        color: 'bg-amber-50 text-amber-800 border-amber-300 ring-amber-200',
        dot: 'bg-amber-500',
      };
    }
    if (level === 2) {
      return {
        text: 'Level 2: Light Plastic Debris',
        color: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-emerald-200',
        dot: 'bg-emerald-500',
      };
    }
    return {
      text: 'Level 1: Mild Shoreline Litter',
      color: 'bg-slate-50 text-slate-700 border-slate-300 ring-slate-200',
      dot: 'bg-slate-400',
    };
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 space-y-6">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Citizen Incident Registry</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono">{reportedIncidents.length} Spots Active</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Reported Waterway Spots
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Every citizen-reported water pollution incident is registered here with geo-coordinates,
            evidence photos, and one-click AI cleanup mobilization.
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Spot</span>
        </button>
      </div>

      {/* 2. Empty State when no spots reported yet */}
      {reportedIncidents.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center space-y-5 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
            <MapPin className="w-10 h-10 animate-bounce" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-slate-900">
              No Reported Spots Yet
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              When community members report pollution incidents or you upload analyzed photos,
              they will be pinned here with coordinates, evidence photos, and cleanup roadmaps.
            </p>
          </div>

          <button
            onClick={onOpenReportModal}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Your First Spot</span>
          </button>
        </div>
      ) : (
        /* 3. Populated Grid of Persistent Reported Spot Placeholders */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing <strong>{reportedIncidents.length}</strong> persistent citizen reported spots:
            </span>
            <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium">
              Saved in local persistent cache & backend registry
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reportedIncidents.map((spot) => {
              const severityMeta = getSeverityBadge(spot.severity);

              return (
                <div
                  key={spot.id}
                  className="group relative flex flex-col justify-between bg-white rounded-3xl p-5 border border-slate-200 hover:border-emerald-500/80 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  {/* Top Badge & Delete Button */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        <span>📌 REPORTED SPOT</span>
                      </span>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-medium text-slate-400">
                          {spot.reportedAt ? new Date(spot.reportedAt).toLocaleDateString() : 'Active'}
                        </span>
                        {onDeleteIncident && (
                          <button
                            onClick={() => onDeleteIncident(spot.id)}
                            title="Remove this report"
                            className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Photo Evidence if uploaded */}
                    {spot.photoUrl && (
                      <div
                        onClick={() => setSelectedPreviewImage(spot.photoUrl || null)}
                        className="relative w-full h-36 rounded-2xl overflow-hidden bg-slate-100 cursor-pointer border border-slate-200/80"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={spot.photoUrl}
                          alt={spot.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          <span>Field Evidence</span>
                        </div>
                      </div>
                    )}

                    {/* Spot Title & Category */}
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {spot.title}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <span>🌊</span>
                        <span>{spot.waterbodyName || 'Local Waterway'}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-medium text-slate-600">{spot.category}</span>
                      </p>
                    </div>

                    {/* Severity Badge */}
                    <div className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-2 ${severityMeta.color}`}>
                      <span className={`w-2 h-2 rounded-full ${severityMeta.dot}`}></span>
                      <span className="line-clamp-1">{severityMeta.text}</span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {spot.description || 'Citizen reported pollution accumulation requiring cleanup mobilization.'}
                    </p>

                    {/* Coordinates & Reporter */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => handleCopyCoords(spot)}
                        className="flex items-center gap-1 font-mono text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 transition-colors"
                        title="Copy GPS coordinates"
                      >
                        {copiedId === spot.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>
                              {spot.lat.toFixed(4)}, {spot.lng.toFixed(4)}
                            </span>
                          </>
                        )}
                      </button>

                      <span className="truncate max-w-[140px] text-slate-500 font-medium">
                        By: {spot.reporterName || 'Citizen Guardian'}
                      </span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-4 mt-3 border-t border-slate-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onSelectIncidentOnMap(spot)}
                        className="w-full py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Locate Map</span>
                      </button>

                      <button
                        onClick={() => onDiagnoseIncident(spot)}
                        className="w-full py-2 px-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Bot className="w-3.5 h-3.5 text-sky-600" />
                        <span>AI Diagnosis</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {spot.photoUrl ? (
                        <button
                          onClick={() => onAnalyzeImageForIncident(spot)}
                          className="w-full py-2 px-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                          title="Run Image Processing Estimator on this spot's photo"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                          <span>Vision Days</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectIncidentOnMap(spot)}
                          className="w-full py-2 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                        >
                          <span>Track GPS</span>
                        </button>
                      )}

                      <button
                        onClick={() => onOrganizeCleanupForIncident(spot)}
                        className="w-full py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-sm"
                      >
                        <CalendarCheck className="w-3.5 h-3.5" />
                        <span>Plan Drive</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Photo Zoom Modal */}
      {selectedPreviewImage && (
        <div
          onClick={() => setSelectedPreviewImage(null)}
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-3xl bg-slate-900 border border-white/20 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPreviewImage}
              alt="Field evidence enlarged"
              className="w-full h-full max-h-[80vh] object-contain rounded-2xl"
            />
            <div className="text-center text-xs text-slate-300 py-2">
              Click anywhere to close preview
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
