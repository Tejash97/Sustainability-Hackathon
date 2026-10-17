'use client';

import React, { useState, useMemo } from 'react';
import { HotspotCluster, Incident } from '@/types';
import { HotspotCard } from './HotspotCard';
import {
  Flame,
  ArrowUpDown,
  Filter,
  MapPin,
  MapPinOff,
  Sparkles,
  Info
} from 'lucide-react';

interface HotspotListProps {
  clusters: HotspotCluster[];
  selectedCluster: HotspotCluster | null;
  onSelectCluster: (cluster: HotspotCluster) => void;
  onOrganizeCleanup: (cluster: HotspotCluster) => void;
  onDiagnoseIncident: (incident: Incident) => void;
  locationName: string;
  isLoading?: boolean;
  activeFilter?: 'all' | 'high' | 'moderate' | 'waterway';
  onFilterChange?: (filter: 'all' | 'high' | 'moderate' | 'waterway') => void;
}

export const HotspotList: React.FC<HotspotListProps> = ({
  clusters,
  selectedCluster,
  onSelectCluster,
  onOrganizeCleanup,
  onDiagnoseIncident,
  locationName,
  isLoading,
  activeFilter = 'all',
  onFilterChange,
}) => {
  const [sortBy, setSortBy] = useState<'distance' | 'urgency'>('distance');

  const isClusterUrgent = (c: HotspotCluster) =>
    c.urgencyLevel === 'critical' || c.urgencyScore >= 70 || c.incidents.some((i) => (i.severity || 1) >= 4);

  // Filtered and sorted clusters synchronized with the active filter
  const filteredClusters = useMemo(() => {
    return clusters
      .filter((cluster) => {
        if (activeFilter === 'high') {
          return isClusterUrgent(cluster);
        }
        if (activeFilter === 'moderate') {
          return !isClusterUrgent(cluster);
        }
        if (activeFilter === 'waterway') {
          return cluster.waterbodyType === 'river';
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'distance') return a.distanceKm - b.distanceKm;
        return b.urgencyScore - a.urgencyScore;
      });
  }, [clusters, activeFilter, sortBy]);

  const criticalCount = clusters.filter(isClusterUrgent).length;

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Friendly Header */}
      <div className="pb-2.5 border-b border-slate-200/80">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <span>Nearest Polluted Places</span>
              <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-mono font-bold">
                {isLoading ? 'Scanning...' : `${filteredClusters.length} Spots`}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Near <strong className="text-slate-800 font-semibold">{locationName.split(',')[0]}</strong>
            </p>
          </div>

          {/* Simple Sort Dropdown with hover tooltip */}
          <div
            className="flex items-center gap-1.5 text-xs text-slate-500"
            title="Sort results by proximity or pollution severity"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-700" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-emerald-600 font-medium"
            >
              <option value="distance">Nearest First</option>
              <option value="urgency">Most Urgent</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pills with tooltips */}
        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={() => onFilterChange?.('all')}
            title="Show all detected spots"
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'all'
                ? 'bg-[#134e3a] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Spots ({clusters.length})
          </button>

          <button
            onClick={() => onFilterChange?.(activeFilter === 'high' ? 'all' : 'high')}
            title="Filter to high priority urgent riverbanks"
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
              activeFilter === 'high'
                ? 'bg-rose-50 text-rose-700 border border-rose-300 font-bold shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            <Flame className="w-3 h-3 text-rose-500" />
            <span>Urgent ({criticalCount})</span>
          </button>
        </div>
      </div>

      {/* Spots List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[620px]">
        {isLoading ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3 shadow-sm">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">Scanning Environmental Records...</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Searching river features and community reports for <strong className="text-emerald-800">{locationName.split(',')[0]}</strong>
            </p>
          </div>
        ) : filteredClusters.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2 shadow-sm">
            <MapPinOff className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No Hotspots Found</h4>
            <p className="text-xs text-slate-500">
              Try increasing scan radius or switching filter to "All Spots".
            </p>
          </div>
        ) : (
          filteredClusters.map((cluster) => (
            <HotspotCard
              key={cluster.id}
              cluster={cluster}
              isSelected={selectedCluster?.id === cluster.id}
              onSelect={() => onSelectCluster(cluster)}
              onOrganizeCleanup={() => onOrganizeCleanup(cluster)}
              onDiagnoseMainIncident={onDiagnoseIncident}
            />
          ))
        )}
      </div>
    </div>
  );
};
