'use client';

import React, { useState, useEffect } from 'react';
import { Award, Trash2, Users, Waves, CheckCircle2, Trophy, Sparkles, X } from 'lucide-react';
import { CommunityStats } from '@/types';

interface ImpactStatsProps {
  isOpen: boolean;
  onClose: () => void;
  activeHotspotsCount: number;
}

const DEFAULT_STATS: CommunityStats = {
  totalTrashKg: 14280,
  activeCleanupZones: 12,
  volunteerHours: 3650,
  communityBadges: [
    {
      id: 'badge-1',
      title: 'River Guardian',
      description: 'Logged or cleaned more than 50kg of plastic waste from riparian ecosystems.',
      unlocked: true,
      icon: '🛡️',
    },
    {
      id: 'badge-2',
      title: 'Zero-Waste Scout',
      description: 'Organized community segregation and diverted recyclables to municipal depots.',
      unlocked: true,
      icon: '♻️',
    },
    {
      id: 'badge-3',
      title: 'Leak Detective',
      description: 'Reported verified municipal water pipeline breaches saving precious clean water.',
      unlocked: true,
      icon: '🔍',
    },
    {
      id: 'badge-4',
      title: 'Wetland Sentinel',
      description: 'Monitored tourist hotspot runoffs across 5 distinct seasonal cycles.',
      unlocked: false,
      icon: '🦅',
    },
  ],
};

export const ImpactStats: React.FC<ImpactStatsProps> = ({
  isOpen,
  onClose,
  activeHotspotsCount,
}) => {
  const [stats, setStats] = useState<CommunityStats>(DEFAULT_STATS);

  useEffect(() => {
    // Load from localStorage if available
    try {
      const stored = localStorage.getItem('riverrevive_impact_stats');
      if (stored) {
        setStats(JSON.parse(stored));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-sm">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Community Ecological Impact</h2>
              <p className="text-xs text-slate-500">
                Grassroots citizen action restoring water health across river basins
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Counter Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-6">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center justify-between text-emerald-800 mb-2">
              <Trash2 className="w-5 h-5 text-emerald-700" />
              <span className="text-[10px] font-mono uppercase bg-emerald-50 px-2 py-0.5 rounded text-emerald-800 font-bold border border-emerald-200">
                Recovered
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {stats.totalTrashKg.toLocaleString()} <span className="text-sm font-normal text-slate-500">kg</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Single-use plastic & debris diverted</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center justify-between text-blue-800 mb-2">
              <Waves className="w-5 h-5 text-blue-700" />
              <span className="text-[10px] font-mono uppercase bg-blue-50 px-2 py-0.5 rounded text-blue-800 font-bold border border-blue-200">
                Live Zones
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {activeHotspotsCount > 0 ? activeHotspotsCount : stats.activeCleanupZones}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Waterbody clusters actively tracked</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center justify-between text-amber-800 mb-2">
              <Users className="w-5 h-5 text-amber-700" />
              <span className="text-[10px] font-mono uppercase bg-amber-50 px-2 py-0.5 rounded text-amber-800 font-bold border border-amber-200">
                Mobilized
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {stats.volunteerHours.toLocaleString()}{' '}
              <span className="text-sm font-normal text-slate-500">hrs</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Citizen & student volunteer labor</p>
          </div>
        </div>

        {/* Badges Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-800">Revival Guardian Badges</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.communityBadges.map((badge) => (
              <div
                key={badge.id}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
                  badge.unlocked
                    ? 'bg-slate-50 border-slate-200 shadow-sm'
                    : 'bg-slate-100/60 border-slate-200/60 opacity-60'
                }`}
              >
                <div className="text-2xl flex-shrink-0 p-1.5 rounded-xl bg-white border border-slate-200">
                  {badge.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{badge.title}</h4>
                    {badge.unlocked && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        <CheckCircle2 className="w-2.5 h-2.5" /> UNLOCKED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {badge.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 inline" /> Open Verification via Google Tools & Spatial Clustering
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#134e3a] text-white font-bold hover:bg-[#0e3a2b] transition-colors shadow-sm"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

