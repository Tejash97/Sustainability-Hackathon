'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Incident,
  HotspotCluster,
  OverpassElement,
} from '@/types';
import {
  Layers,
  Clock,
  Users,
  Compass,
  Check,
  CalendarCheck,
  Bot,
  MapPin,
  Sparkles,
  Info,
  Navigation,
  Globe
} from 'lucide-react';

// Custom Map center updater component with smooth flyTo animation
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (
      center &&
      Array.isArray(center) &&
      typeof center[0] === 'number' &&
      !isNaN(center[0]) &&
      typeof center[1] === 'number' &&
      !isNaN(center[1])
    ) {
      map.flyTo([center[0], center[1]], zoom, { duration: 1.2 });
    }
  }, [center[0], center[1], zoom, map]);
  return null;
}

// Map Click Listener to pick coordinates
function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: L.LeafletMouseEvent) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

interface RiverMapInnerProps {
  center: [number, number];
  zoom: number;
  incidents: Incident[];
  clusters: HotspotCluster[];
  overpassElements: OverpassElement[];
  selectedCluster: HotspotCluster | null;
  onSelectCluster: (cluster: HotspotCluster) => void;
  onDiagnoseIncident: (incident: Incident) => void;
  onOrganizeCleanup: (cluster: HotspotCluster) => void;
  onMapClick?: (lat: number, lng: number) => void;
  activeFilter?: 'all' | 'high' | 'moderate' | 'waterway';
  onFilterChange?: (filter: 'all' | 'high' | 'moderate' | 'waterway') => void;
  onAnalyzeImage?: (incident: Incident) => void;
}

export const RiverMapInner: React.FC<RiverMapInnerProps> = ({
  center,
  zoom,
  incidents,
  clusters,
  overpassElements,
  selectedCluster,
  onSelectCluster,
  onDiagnoseIncident,
  onOrganizeCleanup,
  onMapClick,
  activeFilter = 'all',
  onFilterChange,
  onAnalyzeImage,
}) => {
  // Google Maps Layer Type
  const [googleMapType, setGoogleMapType] = useState<'roadmap' | 'satellite' | 'terrain' | 'hybrid'>('roadmap');

  // Layer toggles
  const [showWaterways, setShowWaterways] = useState(true);
  const [showTourism, setShowTourism] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showClusters, setShowClusters] = useState(true);
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  const isClusterUrgent = (c: HotspotCluster) =>
    c.urgencyLevel === 'critical' || c.urgencyScore >= 70 || c.incidents.some((i) => (i.severity || 1) >= 4);

  // Filtered clusters based on active bottom pill filter
  const displayedClusters = useMemo(() => {
    if (activeFilter === 'high') {
      return clusters.filter(isClusterUrgent);
    }
    if (activeFilter === 'moderate') {
      return clusters.filter((c) => !isClusterUrgent(c));
    }
    if (activeFilter === 'waterway') {
      return clusters.filter((c) => c.waterbodyType === 'river');
    }
    return clusters;
  }, [clusters, activeFilter]);

  // Filtered incidents based on active filter
  const displayedIncidents = useMemo(() => {
    if (activeFilter === 'high') {
      return incidents.filter((i) => i.severity >= 4);
    }
    if (activeFilter === 'moderate') {
      return incidents.filter((i) => i.severity < 4);
    }
    return incidents;
  }, [incidents, activeFilter]);

  // Group Overpass elements
  const waterways = useMemo(
    () => overpassElements.filter((el) => el.kind === 'waterway'),
    [overpassElements]
  );
  const touristSpots = useMemo(
    () => overpassElements.filter((el) => el.kind === 'tourism'),
    [overpassElements]
  );

  // Google Maps Tile URL mapping
  const getGoogleTileUrl = (type: 'roadmap' | 'satellite' | 'terrain' | 'hybrid') => {
    switch (type) {
      case 'satellite':
        return 'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
      case 'hybrid':
        return 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      case 'terrain':
        return 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
      case 'roadmap':
      default:
        return 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    }
  };

  // Friendly, high-contrast map icons
  const createTouristIcon = (name?: string) =>
    L.divIcon({
      className: 'custom-poi-marker',
      html: `
        <div style="
          background: #7c3aed;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.45);
          border: 2px solid white;
          font-size: 15px;
          cursor: pointer;
        " title="${name || 'Tourist Spot'}">
          🏛️
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });

  const createIncidentIcon = (severity: number) => {
    let bg = '#eab308'; // yellow/amber
    let icon = '🟡';
    if (severity >= 4) {
      bg = '#ef4444'; // red
      icon = '🚨';
    } else if (severity <= 2) {
      bg = '#10b981'; // green
      icon = '🟢';
    }

    return L.divIcon({
      className: 'custom-incident-marker',
      html: `
        <div style="
          background: ${bg};
          color: white;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
          border: 2.5px solid white;
          font-size: 16px;
          cursor: pointer;
        ">
          ${icon}
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -17],
    });
  };

  const createReportedSpotIcon = (severity: number, hasPhoto: boolean) =>
    L.divIcon({
      className: 'custom-reported-spot-marker',
      html: `
        <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            inset: 0px;
            border-radius: 50%;
            background: rgba(16, 185, 129, 0.4);
            animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
            color: white;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 18px rgba(5, 150, 105, 0.6);
            border: 3px solid white;
            font-size: 16px;
            cursor: pointer;
            position: relative;
            z-index: 2;
          ">
            ${hasPhoto ? '📸' : '📌'}
          </div>
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
      popupAnchor: [0, -21],
    });

  const createWaterwayIcon = (name?: string) =>
    L.divIcon({
      className: 'custom-waterway-marker',
      html: `
        <div style="
          background: #0284c7;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 10px rgba(2, 132, 199, 0.4);
          border: 2px solid white;
          font-size: 13px;
        " title="${name || 'Waterway Inflow'}">
          🌊
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });

  return (
    <div className="relative isolate w-full h-full min-h-[460px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl bg-[#f8faf8]">
      
      {/* Google Maps Style Quick Selector - Top Left (z-20, scoped inside map) with hover tooltips */}
      <div className="absolute top-3 left-3 z-20 flex items-center bg-white/95 backdrop-blur-md rounded-2xl p-1 border border-slate-200/90 shadow-md text-[11px] font-bold">
        <button
          onClick={() => setGoogleMapType('roadmap')}
          title="Switch to standard Google Roadmap view"
          className={`px-2.5 py-1 rounded-xl transition-all ${
            googleMapType === 'roadmap'
              ? 'bg-[#134e3a] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Google Map
        </button>
        <button
          onClick={() => setGoogleMapType('satellite')}
          title="Switch to high-resolution Google Satellite view"
          className={`px-2.5 py-1 rounded-xl transition-all ${
            googleMapType === 'satellite'
              ? 'bg-[#134e3a] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Satellite
        </button>
        <button
          onClick={() => setGoogleMapType('terrain')}
          title="Switch to Google Topographical terrain view"
          className={`px-2.5 py-1 rounded-xl transition-all ${
            googleMapType === 'terrain'
              ? 'bg-[#134e3a] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Terrain
        </button>
      </div>

      {/* Floating Controls Top Right (z-20 scoped) */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            title="Toggle visible map data layers"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 text-slate-800 hover:bg-slate-50 text-xs font-bold border border-slate-200/90 shadow-md backdrop-blur-md transition-all"
          >
            <Layers className="w-4 h-4 text-emerald-700" />
            <span>Map Layers</span>
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white/98 rounded-2xl p-3 shadow-2xl border border-slate-200 backdrop-blur-xl flex flex-col gap-1.5 z-30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Show on Map
              </span>

              <button
                onClick={() => setShowClusters(!showClusters)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  showClusters ? 'bg-rose-50 text-rose-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Polluted Hotspots ({clusters.length})
                </span>
                {showClusters && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setShowIncidents(!showIncidents)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  showIncidents ? 'bg-amber-50 text-amber-800 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Citizen Reports ({incidents.length})
                </span>
                {showIncidents && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setShowWaterways(!showWaterways)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  showWaterways ? 'bg-sky-50 text-sky-800 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  Waterways & Ghats ({waterways.length})
                </span>
                {showWaterways && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setShowTourism(!showTourism)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  showTourism ? 'bg-purple-50 text-purple-800 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  Tourist Spots ({touristSpots.length})
                </span>
                {showTourism && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3 Clickable Filters Toolbar at Bottom Left as per user image & request */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-1 text-[11px] text-slate-700 border border-slate-200/90 shadow-xl flex items-center gap-1">
        <button
          onClick={() => onFilterChange?.('all')}
          title="Show all locations and reports"
          className={`px-2.5 py-1.5 rounded-xl font-semibold transition-all ${
            activeFilter === 'all'
              ? 'bg-[#134e3a] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          All
        </button>

        <button
          onClick={() => onFilterChange?.(activeFilter === 'high' ? 'all' : 'high')}
          title="Filter to High Priority critical cleanup hotspots"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
            activeFilter === 'high'
              ? 'bg-rose-50 text-rose-700 border border-rose-300 ring-2 ring-rose-200 shadow-sm font-bold'
              : 'text-slate-700 hover:bg-rose-50/60'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white"></span>
          <span>🚨 High Priority</span>
        </button>

        <button
          onClick={() => onFilterChange?.(activeFilter === 'moderate' ? 'all' : 'moderate')}
          title="Filter to Moderate attention hotspots"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
            activeFilter === 'moderate'
              ? 'bg-amber-50 text-amber-800 border border-amber-300 ring-2 ring-amber-200 shadow-sm font-bold'
              : 'text-slate-700 hover:bg-amber-50/60'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white"></span>
          <span>🟡 Moderate</span>
        </button>

        <button
          onClick={() => onFilterChange?.(activeFilter === 'waterway' ? 'all' : 'waterway')}
          title="Filter to River Channels and Ghats"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
            activeFilter === 'waterway'
              ? 'bg-sky-50 text-sky-800 border border-sky-300 ring-2 ring-sky-200 shadow-sm font-bold'
              : 'text-slate-700 hover:bg-sky-50/60'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 border border-white"></span>
          <span>🌊 River/Ghat</span>
        </button>
      </div>

      {/* Official Google Maps Watermark Badge at Bottom Right */}
      <div
        className="absolute bottom-2 right-2 z-20 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl shadow-md border border-slate-200/80 text-[10px] font-bold text-slate-800 flex items-center gap-1 pointer-events-none"
        title="Powered by Google Maps Platform"
      >
        <span className="text-blue-600 font-extrabold">G</span>
        <span className="text-red-500 font-extrabold">o</span>
        <span className="text-amber-500 font-extrabold">o</span>
        <span className="text-blue-600 font-extrabold">g</span>
        <span className="text-green-600 font-extrabold">l</span>
        <span className="text-red-500 font-extrabold">e</span>
        <span className="text-slate-600 font-medium ml-0.5">Maps</span>
      </div>

      <MapContainer
        center={center && Array.isArray(center) && !isNaN(center[0]) && !isNaN(center[1]) ? center : [22.5726, 88.3639]}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <ChangeView center={center} zoom={zoom} />
        <MapClickHandler onMapClick={onMapClick} />

        {/* 100% GOOGLE MAPS PLATFORM TILES */}
        <TileLayer
          key={googleMapType}
          attribution='&copy; <a href="https://maps.google.com" target="_blank">Google Maps Platform</a>'
          url={getGoogleTileUrl(googleMapType)}
          subdomains={['0', '1', '2', '3']}
          maxZoom={20}
        />

        {/* 1. Clustered Cleanup Zones (Friendly colored circles) */}
        {showClusters &&
          displayedClusters
            .filter(
              (cluster) =>
                cluster?.center &&
                typeof cluster.center.lat === 'number' &&
                !isNaN(cluster.center.lat) &&
                typeof cluster.center.lng === 'number' &&
                !isNaN(cluster.center.lng)
            )
            .map((cluster) => {
            const isCritical = isClusterUrgent(cluster);
            const circleColor = isCritical ? '#ef4444' : '#f59e0b';
            const fillColor = isCritical ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.22)';
            const radiusMeters = Math.max(300, Math.min(600, cluster.incidents.length * 180));

            return (
              <React.Fragment key={cluster.id}>
                <Circle
                  center={[cluster.center.lat, cluster.center.lng]}
                  radius={radiusMeters}
                  pathOptions={{
                    color: circleColor,
                    fillColor: fillColor,
                    fillOpacity: 0.5,
                    weight: 2,
                  }}
                  eventHandlers={{
                    click: () => onSelectCluster(cluster),
                  }}
                >
                  <Popup>
                    <div className="p-1.5 space-y-2 max-w-xs text-slate-900">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                        <span className="font-bold text-xs text-slate-900 line-clamp-1">
                          {cluster.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCritical
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isCritical ? '🚨 Urgent' : '🟡 Moderate'}
                        </span>
                      </div>

                      {/* Friendly Quick Estimates */}
                      <div className="bg-slate-100 p-2 rounded-xl grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                        <div className="flex items-center gap-1 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>~{cluster.estimatedTimeHours || 2}h Cleanup</span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{cluster.volunteersRecommended || 12} People</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-snug">
                        💡 <strong>How to clean:</strong> {cluster.howToCleanSummary}
                      </p>

                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          onClick={() => onOrganizeCleanup(cluster)}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-colors"
                        >
                          <CalendarCheck className="w-3.5 h-3.5" />
                          Plan & Schedule
                        </button>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${cluster.center.lat},${cluster.center.lng}&travelmode=driving`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                          title="Navigate using Google Maps"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>Google Nav</span>
                        </a>
                      </div>
                    </div>
                  </Popup>
                </Circle>
              </React.Fragment>
            );
          })}

        {/* 2. Waterway Inflow / River Markers */}
        {showWaterways &&
          waterways
            .filter((w) => {
              const lon = w.lon ?? (w as any).lng ?? (w as any).center?.lon;
              return (
                typeof w.lat === 'number' &&
                !isNaN(w.lat) &&
                typeof lon === 'number' &&
                !isNaN(lon)
              );
            })
            .map((w) => {
              const lon = (w.lon ?? (w as any).lng ?? (w as any).center?.lon) as number;
              return (
                <Marker
                  key={`waterway-${w.id}`}
                  position={[w.lat, lon]}
                  icon={createWaterwayIcon(w.name)}
                >
                  <Popup>
                    <div className="p-1 space-y-1 text-slate-900">
                      <div className="text-xs font-bold text-sky-700 flex items-center gap-1">
                        <span>🌊</span> {w.name || 'Identified Waterway'}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Waterbody: {w.waterwayType || 'River Channel / Canal'}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

        {/* 3. Tourist Footprint Points */}
        {showTourism &&
          touristSpots
            .filter((t) => {
              const lon = t.lon ?? (t as any).lng ?? (t as any).center?.lon;
              return (
                typeof t.lat === 'number' &&
                !isNaN(t.lat) &&
                typeof lon === 'number' &&
                !isNaN(lon)
              );
            })
            .map((t) => {
              const lon = (t.lon ?? (t as any).lng ?? (t as any).center?.lon) as number;
              return (
                <Marker
                  key={`tourism-${t.id}`}
                  position={[t.lat, lon]}
                  icon={createTouristIcon(t.name)}
                >
                  <Popup>
                    <div className="p-1 space-y-1 text-slate-900">
                      <div className="text-xs font-bold text-purple-700 flex items-center gap-1">
                        <span>🏛️</span> {t.name || 'Tourist Attraction'}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        High visitor footfall area near waterbody.
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

        {/* 4. Citizen Incident & Reported Spot Markers */}
        {showIncidents &&
          displayedIncidents
            .filter(
              (incident) =>
                typeof incident.lat === 'number' &&
                !isNaN(incident.lat) &&
                typeof incident.lng === 'number' &&
                !isNaN(incident.lng)
            )
            .map((incident) => {
            const isUserReport = incident.id.startsWith('inc-user') || Boolean(incident.photoUrl);
            const icon = isUserReport
              ? createReportedSpotIcon(incident.severity, Boolean(incident.photoUrl))
              : createIncidentIcon(incident.severity);

            return (
              <Marker
                key={incident.id}
                position={[incident.lat, incident.lng]}
                icon={icon}
              >
                <Popup>
                  <div className="p-1 space-y-2 max-w-xs text-slate-900">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-1 border-b border-slate-200 pb-1">
                      <div className="flex items-center gap-1 min-w-0">
                        {isUserReport && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0"></span>
                        )}
                        <span className="font-bold text-xs text-slate-900 line-clamp-1">
                          {incident.title}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          incident.severity >= 4
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Sev {incident.severity}/5
                      </span>
                    </div>

                    {/* Citizen Reported Spot Badge */}
                    {isUserReport && (
                      <div className="flex items-center justify-between text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
                        <span>📌 Citizen Reported Spot</span>
                        <span className="text-[9px] text-slate-500">By {incident.reporterName || 'Citizen'}</span>
                      </div>
                    )}

                    {/* Photo Evidence if uploaded */}
                    {incident.photoUrl && (
                      <div className="relative w-full h-24 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={incident.photoUrl}
                          alt={incident.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {incident.description}
                    </p>

                    {incident.howToClean && (
                      <div className="bg-emerald-50 text-emerald-900 p-1.5 rounded-lg text-[10px] leading-snug">
                        💡 <strong>Action:</strong> {incident.howToClean}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        onClick={() => onDiagnoseIncident(incident)}
                        className="px-2 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow-xs transition-all"
                      >
                        <Bot className="w-3 h-3" />
                        <span>AI Diagnosis</span>
                      </button>

                      {incident.photoUrl && onAnalyzeImage ? (
                        <button
                          onClick={() => onAnalyzeImage(incident)}
                          className="px-2 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow-xs transition-all"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Vision Days</span>
                        </button>
                      ) : (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${incident.lat},${incident.lng}&travelmode=driving`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow-xs transition-all"
                        >
                          <Compass className="w-3 h-3" />
                          <span>Google Nav</span>
                        </a>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
};
