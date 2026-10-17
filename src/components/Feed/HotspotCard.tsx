'use client';

import React from 'react';
import { HotspotCluster, Incident } from '@/types';
import {
  Clock,
  Users,
  MapPin,
  CalendarCheck,
  Bot,
  Sparkles,
  ChevronRight,
  Navigation,
  Eye,
  ExternalLink
} from 'lucide-react';

interface HotspotCardProps {
  cluster: HotspotCluster;
  isSelected: boolean;
  onSelect: () => void;
  onOrganizeCleanup: () => void;
  onDiagnoseMainIncident: (incident: Incident) => void;
}

export const HotspotCard: React.FC<HotspotCardProps> = ({
  cluster,
  isSelected,
  onSelect,
  onOrganizeCleanup,
  onDiagnoseMainIncident,
}) => {
  const isCritical =
    cluster.urgencyLevel === 'critical' ||
    cluster.urgencyScore >= 70 ||
    cluster.incidents.some((i) => (i.severity || 1) >= 4);
  const timeEst = cluster.estimatedTimeHours || 2.0;
  const teamEst = cluster.volunteersRecommended || 12;

  const lat = cluster.center.lat;
  const lng = cluster.center.lng;
  const googleMapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  const googleStreetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;

  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-2xl p-4 cursor-pointer transition-all duration-200 border ${
        isSelected
          ? 'bg-emerald-50/50 border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
          : 'bg-white border-slate-200/90 hover:border-emerald-600/40 hover:shadow-md'
      }`}
    >
      {/* 1. Header: Spot Name & Distance */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                isCritical
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {isCritical ? '🚨 Urgent Action' : '🟡 Moderate Attention'}
            </span>

            <span className="text-xs font-mono font-medium text-emerald-800 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              {cluster.distanceKm < 1
                ? `${Math.round(cluster.distanceKm * 1000)} m away`
                : `${cluster.distanceKm} km away`}
            </span>
          </div>

          <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-900 transition-colors leading-snug">
            {cluster.name}
          </h3>
        </div>

        <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded-md flex-shrink-0 border border-slate-200">
          {cluster.incidents.length} {cluster.incidents.length === 1 ? 'report' : 'reports'}
        </span>
      </div>

      {/* 2. Simple Cleaning Estimates: Time & Volunteers Needed */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-emerald-100/70 flex items-center justify-center text-emerald-800">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium">Est. Cleanup Time</div>
            <div className="text-xs font-bold text-slate-900">~{timeEst} Hours</div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-emerald-100/70 flex items-center justify-center text-emerald-800">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium">Team Needed</div>
            <div className="text-xs font-bold text-slate-900">{teamEst} Volunteers</div>
          </div>
        </div>
      </div>

      {/* 3. "How Can Be Cleaned" - Simple & Friendly Highlight Box */}
      <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/50 text-xs">
        <div className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5 mb-0.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          <span>How this can be cleaned:</span>
        </div>
        <p className="text-slate-700 text-xs leading-relaxed">
          {cluster.howToCleanSummary}
        </p>
      </div>

      {/* 4. Action Buttons */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <a
          href={googleMapsNavUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="Open turn-by-turn driving directions in Google Maps"
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors"
        >
          <Navigation className="w-3.5 h-3.5 text-emerald-700" />
          <span>Google Nav</span>
        </a>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOrganizeCleanup();
          }}
          title="Generate customized Google Gemini Cleanup Action Blueprint"
          className="flex-1 px-3.5 py-1.5 rounded-xl bg-[#134e3a] hover:bg-[#0e3a2b] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Plan & Schedule</span>
          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    </div>
  );
};
