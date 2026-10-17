'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Navbar, NavTab } from '@/components/Navbar';
import { WeatherGuard } from '@/components/WeatherGuard';
import { RiverMap } from '@/components/Map/RiverMap';
import { HotspotList } from '@/components/Feed/HotspotList';
import { ReportIncidentModal } from '@/components/Modals/ReportIncidentModal';
import { DiagnosisModal } from '@/components/Modals/DiagnosisModal';
import { CleanupDriveModal } from '@/components/Modals/CleanupDriveModal';
import { GoogleStorageModal } from '@/components/Modals/GoogleStorageModal';
import { ImpactStats } from '@/components/ImpactStats';
import { VisionEstimatorTab } from '@/components/VisionEstimatorTab';
import { ReportedSpotsTracker } from '@/components/ReportedSpotsTracker';
import {
  Incident,
  HotspotCluster,
  OverpassElement,
  WeatherData,
} from '@/types';
import { INITIAL_LAT, INITIAL_LNG, INITIAL_CITY, SEED_INCIDENTS } from '@/data/seedIncidents';
import { searchDynamicPollutedSpots, generateGeospatialFallback } from '@/lib/dynamicPollutionEngine';
import { generateFallbackPOIs } from '@/lib/overpass';
import { clusterIncidents, calculateHaversineDistance } from '@/lib/clustering';
import {
  MapPin,
  RefreshCw,
  Sparkles,
  Droplets,
  CalendarCheck,
  Compass,
  ClipboardList,
  Camera,
  PlusCircle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export default function Home() {
  // Navigation Tab ('map' | 'vision' | 'reported')
  const [activeMainTab, setActiveMainTab] = useState<NavTab>('map');

  // Location state - defaults to Kolkata or saved user selection
  const [currentCoords, setCurrentCoords] = useState<[number, number]>([
    22.5726,
    88.3639,
  ]);
  const [locationName, setLocationName] = useState<string>('Kolkata, West Bengal');
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Data state
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [userReportedSpots, setUserReportedSpots] = useState<Incident[]>([]);
  const [overpassElements, setOverpassElements] = useState<OverpassElement[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoadingOverpass, setIsLoadingOverpass] = useState<boolean>(false);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState<boolean>(true);

  // Selected state for modals & focus
  const [selectedCluster, setSelectedCluster] = useState<HotspotCluster | null>(null);
  const [diagnosingIncident, setDiagnosingIncident] = useState<Incident | null>(null);
  const [drivePlanningCluster, setDrivePlanningCluster] = useState<HotspotCluster | null>(null);

  // Modal visibility
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState<boolean>(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState<boolean>(false);

  // Pre-fill state when opening report modal from Vision tab
  const [reportModalInitialData, setReportModalInitialData] = useState<Partial<Incident> | undefined>(undefined);

  // Active view tab on mobile in map mode (Map vs Hotspots)
  const [mobileTab, setMobileTab] = useState<'hotspots' | 'map'>('map');

  // Load saved location & user reported spots on startup
  useEffect(() => {
    try {
      const savedLocation = localStorage.getItem('riverrevive_saved_location');
      if (savedLocation) {
        const parsed = JSON.parse(savedLocation);
        if (parsed.lat && parsed.lng) {
          setCurrentCoords([parsed.lat, parsed.lng]);
          setLocationName(parsed.name || 'Selected City');
        }
      }

      const storedReports = localStorage.getItem('riverrevive_user_reported_spots');
      if (storedReports) {
        const parsed = JSON.parse(storedReports);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUserReportedSpots(parsed);
        }
      }
    } catch (err) {
      console.warn('Error loading localStorage items:', err);
    }
  }, []);

  // Active query tracking refs to prevent async race conditions (R01)
  const activeIncidentQueryRef = useRef<number>(0);
  const activeOverpassQueryRef = useRef<number>(0);
  const activeWeatherQueryRef = useRef<number>(0);

  // 1. Fetch Incidents for the selected coordinates & city (Guarded against location races)
  const fetchIncidents = useCallback(async (lat: number, lng: number, city: string, radius: number) => {
    const queryId = ++activeIncidentQueryRef.current;
    try {
      setIsLoadingIncidents(true);
      const res = await fetch(
        `/api/incidents?lat=${lat}&lng=${lng}&city=${encodeURIComponent(city)}&radius=${radius}`
      );
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (activeIncidentQueryRef.current !== queryId) return;
        if (data.incidents && Array.isArray(data.incidents) && data.incidents.length > 0) {
          const validSpots = data.incidents.filter(
            (i: any) => typeof i.lat === 'number' && !isNaN(i.lat) && typeof i.lng === 'number' && !isNaN(i.lng)
          );
          if (validSpots.length > 0) {
            setIncidents(validSpots);
            setIsLoadingIncidents(false);
            return;
          }
        }
      }
    } catch {
      // Quiet fallback for static hosting
    }

    if (activeIncidentQueryRef.current !== queryId) return;

    // Dynamic Client-side Engine (Google Gemini with 24hr persistent caching + regional hydrology profiles)
    try {
      const dynamicSpots = await searchDynamicPollutedSpots(lat, lng, city, []);
      if (activeIncidentQueryRef.current !== queryId) return;
      const validSpots = dynamicSpots.filter(
        (i) => typeof i.lat === 'number' && !isNaN(i.lat) && typeof i.lng === 'number' && !isNaN(i.lng)
      );
      if (validSpots.length > 0) {
        setIncidents(validSpots);
        setIsLoadingIncidents(false);
        return;
      }
    } catch {
      if (activeIncidentQueryRef.current !== queryId) return;
      const fallbackSpots = generateGeospatialFallback(lat, lng, city, []);
      setIncidents(fallbackSpots);
    } finally {
      if (activeIncidentQueryRef.current === queryId) {
        setIsLoadingIncidents(false);
      }
    }
  }, []);

  // 2. Fetch Overpass Elements (Waterways & Tourist POIs)
  const fetchOverpass = useCallback(async (lat: number, lng: number, radius: number) => {
    const queryId = ++activeOverpassQueryRef.current;
    try {
      setIsLoadingOverpass(true);
      const res = await fetch(`/api/overpass?lat=${lat}&lng=${lng}&radius=${radius}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (activeOverpassQueryRef.current !== queryId) return;
        if (data.elements && Array.isArray(data.elements) && data.elements.length > 0) {
          const validElems = data.elements
            .map((el: any) => {
              const itemLat = Number(el.lat ?? el.center?.lat ?? lat);
              const itemLon = Number(el.lon ?? el.lng ?? el.center?.lon ?? lng);
              return {
                ...el,
                lat: itemLat,
                lon: itemLon,
                lng: itemLon,
              };
            })
            .filter((el: any) => typeof el.lat === 'number' && !isNaN(el.lat) && typeof el.lon === 'number' && !isNaN(el.lon));
          if (validElems.length > 0) {
            setOverpassElements(validElems);
            setIsLoadingOverpass(false);
            return;
          }
        }
      }
    } catch {
      // Quiet fallback for static hosting
    }

    if (activeOverpassQueryRef.current !== queryId) return;
    setOverpassElements(generateFallbackPOIs(lat, lng));
    setIsLoadingOverpass(false);
  }, []);

  // 3. Fetch Weather from Open-Meteo
  const fetchWeather = useCallback(async (lat: number, lng: number) => {
    const queryId = ++activeWeatherQueryRef.current;
    try {
      setIsLoadingWeather(true);
      const res = await fetch(`/api/weather?lat=${lat}&lng=${lng}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (activeWeatherQueryRef.current !== queryId) return;
        if (data.weather) {
          setWeather(data.weather);
          setIsLoadingWeather(false);
          return;
        }
      }
    } catch {
      // Quiet fallback for static hosting
    }

    if (activeWeatherQueryRef.current !== queryId) return;

    // Direct browser fetch from Open-Meteo (open CORS, no key required)
    try {
      const omRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=precipitation_sum,precipitation_probability_max&timezone=auto`
      );
      if (omRes.ok) {
        if (activeWeatherQueryRef.current !== queryId) return;
        const d = await omRes.json();
        const cur = d.current;
        const precip = cur?.precipitation ?? 0;
        setWeather({
          temperature: Math.round(cur?.temperature_2m ?? 28),
          precipitation: precip,
          windSpeed: Math.round(cur?.wind_speed_10m ?? 8),
          weatherCode: cur?.weather_code ?? 0,
          isSafe: precip < 5,
          alertReason: precip >= 5 ? 'High precipitation detected near riverbank' : undefined,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (omErr) {
      console.warn('Weather direct fallback note:', omErr);
    } finally {
      if (activeWeatherQueryRef.current === queryId) {
        setIsLoadingWeather(false);
      }
    }
  }, []);

  // Refresh all data whenever location coordinates or radius changes
  useEffect(() => {
    fetchIncidents(currentCoords[0], currentCoords[1], locationName, radiusKm);
    fetchOverpass(currentCoords[0], currentCoords[1], radiusKm);
    fetchWeather(currentCoords[0], currentCoords[1]);
  }, [fetchIncidents, fetchOverpass, fetchWeather, currentCoords, radiusKm, locationName]);

  // Handle location selection and save in state & localStorage (with instant race invalidation)
  const handleSelectCoordinates = (lat: number, lng: number, name: string) => {
    // Invalidate any in-flight requests from the previous location immediately
    activeIncidentQueryRef.current++;
    activeOverpassQueryRef.current++;
    activeWeatherQueryRef.current++;

    // Clear previous city incidents immediately to prevent visual race leakage
    setIncidents([]);
    setIsLoadingIncidents(true);

    setCurrentCoords([lat, lng]);
    setLocationName(name);
    try {
      localStorage.setItem(
        'riverrevive_saved_location',
        JSON.stringify({ lat, lng, name })
      );
    } catch {}
  };

  // Handle GPS location click
  const handleUseGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        activeIncidentQueryRef.current++;
        activeOverpassQueryRef.current++;
        activeWeatherQueryRef.current++;
        setIncidents([]);
        setIsLoadingIncidents(true);

        setCurrentCoords([lat, lng]);

        try {
          const revRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            {
              headers: { 'User-Agent': 'RiverReviveAI-ReverseGeocode/1.0' },
            }
          );
          if (revRes.ok) {
            const revData = await revRes.json();
            const displayName =
              revData.display_name?.split(',').slice(0, 3).join(',') ||
              'Your GPS Location';
            setLocationName(displayName);
            try {
              localStorage.setItem(
                'riverrevive_saved_location',
                JSON.stringify({ lat, lng, name: displayName })
              );
            } catch {}
          } else {
            const fallbackName = `GPS (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
            setLocationName(fallbackName);
          }
        } catch {
          setLocationName(`GPS (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.warn('Geolocation error:', error);
        alert('Could not retrieve GPS location. Please allow location permissions or search an address.');
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Combine user-reported spots with dynamically loaded incidents (preserving citizen reports)
  // AND enforce strict display-time distance filtering based on chosen radiusKm (R01 fix)
  const combinedIncidents = useMemo(() => {
    const userIds = new Set(userReportedSpots.map((r) => r.id));
    const nonDuplicates = incidents.filter((i) => !userIds.has(i.id));
    const all = [...userReportedSpots, ...nonDuplicates];

    // Allowed radius buffer (+15% or min 0.3km) to respect the exact UI radius chosen by the user
    const maxAllowedDistKm = Math.max(radiusKm * 1.15, radiusKm + 0.3);

    const withinRadius = all.filter((spot) => {
      if (typeof spot.lat !== 'number' || typeof spot.lng !== 'number') return false;
      const dist = calculateHaversineDistance(currentCoords[0], currentCoords[1], spot.lat, spot.lng);
      return dist <= maxAllowedDistKm;
    });

    // If active query has settled but yielded zero spots within radius, dynamically provide close fallback spots
    if (withinRadius.length === 0 && !isLoadingIncidents) {
      const localFallbacks = generateGeospatialFallback(currentCoords[0], currentCoords[1], locationName);
      return localFallbacks.filter((s) => {
        const dist = calculateHaversineDistance(currentCoords[0], currentCoords[1], s.lat, s.lng);
        return dist <= maxAllowedDistKm;
      });
    }

    return withinRadius;
  }, [userReportedSpots, incidents, currentCoords, radiusKm, locationName, isLoadingIncidents]);

  // Dynamically compute DBSCAN Clusters strictly bounded to the selected radiusKm
  const clusters = useMemo(() => {
    const rawClusters = clusterIncidents(
      combinedIncidents,
      currentCoords[0],
      currentCoords[1],
      overpassElements,
      0.6, // 600m epsilon
      2    // minPts = 2
    );

    const maxAllowedDistKm = Math.max(radiusKm * 1.15, radiusKm + 0.3);
    return rawClusters.filter((c) => c.distanceKm <= maxAllowedDistKm);
  }, [combinedIncidents, currentCoords, overpassElements, radiusKm]);

  // Handle incident diagnosis trigger
  const handleDiagnoseIncident = (incident: Incident) => {
    setDiagnosingIncident(incident);
    setIsDiagnosisModalOpen(true);
  };

  // Handle cleanup drive trigger
  const handleOrganizeCleanup = (cluster: HotspotCluster) => {
    setDrivePlanningCluster(cluster);
    setIsDriveModalOpen(true);
  };

  // Active priority filter state ('all' | 'high' | 'moderate' | 'waterway')
  const [activePriorityFilter, setActivePriorityFilter] = useState<'all' | 'high' | 'moderate' | 'waterway'>('all');

  // Callback when user adds new incident report
  const handleReportSubmitted = (newIncident: Incident) => {
    setUserReportedSpots((prev) => {
      const updated = [newIncident, ...prev.filter((i) => i.id !== newIncident.id)];
      try {
        localStorage.setItem('riverrevive_user_reported_spots', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setIncidents((prev) => [newIncident, ...prev]);
  };

  // Delete reported spot handler
  const handleDeleteReportedSpot = (id: string) => {
    setUserReportedSpots((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      try {
        localStorage.setItem('riverrevive_user_reported_spots', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setIncidents((prev) => prev.filter((i) => i.id !== id));
  };

  // Open report modal with data from Vision tab
  const handleOpenReportFromVision = (data: {
    photoUrl: string;
    title: string;
    severity: number;
    description: string;
    howToClean: string;
    gearNeeded: string[];
    volunteersNeeded: number;
    cleanTimeHours: number;
  }) => {
    setReportModalInitialData({
      title: data.title,
      severity: data.severity,
      description: data.description,
      photoUrl: data.photoUrl,
      howToClean: data.howToClean,
      gearNeeded: data.gearNeeded,
      volunteersNeeded: data.volunteersNeeded,
      cleanTimeHours: data.cleanTimeHours,
      lat: currentCoords[0],
      lng: currentCoords[1],
      waterbodyName: locationName.split(',')[0],
      category: 'Plastic & Solid Waste',
    });
    setIsReportModalOpen(true);
  };

  // Jump from reported spot to map
  const handleLocateSpotOnMap = (spot: Incident) => {
    setCurrentCoords([spot.lat, spot.lng]);
    setActiveMainTab('map');
    setMobileTab('map');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8f6] text-slate-800 selection:bg-emerald-200 selection:text-emerald-950 font-sans">
      
      {/* 1. TOP NAVIGATION WITH LOCATION SELECTOR, TABS & GOOGLE CLOUD STORAGE BADGE */}
      <Navbar
        currentLocationName={locationName}
        currentCoords={currentCoords}
        onSelectCoordinates={handleSelectCoordinates}
        radiusKm={radiusKm}
        onRadiusChange={setRadiusKm}
        onOpenReportModal={() => {
          setReportModalInitialData(undefined);
          setIsReportModalOpen(true);
        }}
        onOpenStatsModal={() => setIsStatsModalOpen(true)}
        onOpenStorageModal={() => setIsStorageModalOpen(true)}
        isLocating={isLocating}
        onUseGps={handleUseGps}
        activeTab={activeMainTab}
        onTabChange={setActiveMainTab}
        reportedSpotsCount={userReportedSpots.length}
      />

      {/* 2. REAL-TIME RIVER SAFETY & WEATHER ADVISORY */}
      <div className="max-w-7xl mx-auto w-full px-4 pt-3 pb-2">
        <WeatherGuard
          weather={weather}
          isLoading={isLoadingWeather}
          locationName={locationName.split(',')[0]}
        />
      </div>

      {/* 3. CONDITIONAL MAIN VIEW BASED ON ACTIVE TAB */}
      
      {/* TAB A: 📸 AI VISION CLEANUP ESTIMATOR (Requirement 2) */}
      {activeMainTab === 'vision' && (
        <main className="flex-1">
          <VisionEstimatorTab
            onOpenReportModalWithData={handleOpenReportFromVision}
            currentCoords={currentCoords}
          />
        </main>
      )}

      {/* TAB B: 📍 PERMANENT REPORTED SPOTS TRACKER (Requirement 3) */}
      {activeMainTab === 'reported' && (
        <main className="flex-1">
          <ReportedSpotsTracker
            reportedIncidents={userReportedSpots}
            onOpenReportModal={() => {
              setReportModalInitialData(undefined);
              setIsReportModalOpen(true);
            }}
            onSelectIncidentOnMap={handleLocateSpotOnMap}
            onDiagnoseIncident={handleDiagnoseIncident}
            onOrganizeCleanupForIncident={(spot) => {
              const cluster: HotspotCluster = {
                id: `cluster-user-${spot.id}`,
                name: spot.title,
                center: { lat: spot.lat, lng: spot.lng },
                incidents: [spot],
                totalSeverity: spot.severity,
                touristAttractionsNear: [],
                waterbodyType: 'river',
                urgencyScore: spot.severity * 18,
                urgencyLevel: spot.severity >= 4 ? 'critical' : 'moderate',
                distanceKm: 0.2,
                estimatedTimeHours: spot.cleanTimeHours || 2.0,
                volunteersRecommended: spot.volunteersNeeded || 12,
                primaryAction: 'Citizen Pinned Cleanup Sweep',
                howToCleanSummary: spot.howToClean || 'Collect plastic flotsam and notify local municipality.',
                gearNeededSummary: spot.gearNeeded || ['Gloves', 'Pickers', 'Heavy Sacks'],
              };
              handleOrganizeCleanup(cluster);
            }}
            onAnalyzeImageForIncident={() => {
              setActiveMainTab('vision');
            }}
            onDeleteIncident={handleDeleteReportedSpot}
          />
        </main>
      )}

      {/* TAB C: 🗺️ WATERWAY MAP & NEAREST POLLUTED SPOTS */}
      {activeMainTab === 'map' && (
        <div className="flex-1 flex flex-col">
          {/* Mobile Tab Switcher */}
          <div className="flex md:hidden px-4 mb-2">
            <div className="w-full flex rounded-2xl bg-white p-1 border border-slate-200 text-xs font-bold shadow-xs">
              <button
                onClick={() => setMobileTab('map')}
                className={`flex-1 py-2 rounded-xl transition-all ${
                  mobileTab === 'map'
                    ? 'bg-[#134e3a] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🗺️ Waterway Map
              </button>
              <button
                onClick={() => setMobileTab('hotspots')}
                className={`flex-1 py-2 rounded-xl transition-all ${
                  mobileTab === 'hotspots'
                    ? 'bg-[#134e3a] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📋 Nearest Spots ({clusters.length})
              </button>
            </div>
          </div>

          <main className="max-w-7xl mx-auto w-full px-4 pb-6 flex-1 flex flex-col md:flex-row gap-4">
            
            {/* LEFT COLUMN: Map View (7/12 desktop) */}
            <section
              className={`w-full md:w-1/2 lg:w-7/12 h-[520px] md:h-[calc(100vh-210px)] flex flex-col ${
                mobileTab === 'map' ? 'flex' : 'hidden md:flex'
              }`}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Map: {locationName}</span>
                  </span>
                  {isLoadingOverpass && (
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin text-emerald-600" /> Updating
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 w-full h-full">
                <RiverMap
                  center={currentCoords}
                  zoom={14}
                  incidents={combinedIncidents}
                  clusters={clusters}
                  overpassElements={overpassElements}
                  selectedCluster={selectedCluster}
                  activeFilter={activePriorityFilter}
                  onFilterChange={setActivePriorityFilter}
                  onSelectCluster={(cl) => {
                    setSelectedCluster(cl);
                  }}
                  onDiagnoseIncident={handleDiagnoseIncident}
                  onOrganizeCleanup={handleOrganizeCleanup}
                  onAnalyzeImage={() => {
                    setActiveMainTab('vision');
                  }}
                  onMapClick={(lat, lng) => {
                    setCurrentCoords([lat, lng]);
                  }}
                />
              </div>
            </section>

            {/* RIGHT COLUMN: Feed & Persistent Citizen Reports Placeholder (5/12 desktop) */}
            <section
              className={`w-full md:w-1/2 lg:w-5/12 h-[520px] md:h-[calc(100vh-210px)] ${
                mobileTab === 'hotspots' ? 'flex' : 'hidden md:flex'
              } flex-col bg-white/95 rounded-3xl p-4 border border-slate-200/90 shadow-xl backdrop-blur-md space-y-3 overflow-hidden`}
            >
              {/* Citizen Reported Spots Widget */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/40 to-slate-50 border border-emerald-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    <h3 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wide">
                      Reported Waterway Spots
                    </h3>
                  </div>

                  <span className="text-[10px] font-mono font-bold bg-white text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                    {userReportedSpots.length} Pinned
                  </span>
                </div>

                {userReportedSpots.length === 0 ? (
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-600 bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                    <p className="text-[11px] text-slate-500">
                      No citizen spots reported here yet. Report an incident to pin it to the map.
                    </p>
                    <button
                      onClick={() => {
                        setReportModalInitialData(undefined);
                        setIsReportModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shrink-0 transition-colors shadow-2xs"
                    >
                      + Report Spot
                    </button>
                  </div>
                ) : (
                  <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200/60 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        📌 {userReportedSpots[0].title}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {userReportedSpots[0].waterbodyName || 'Local Waterway'} • Sev {userReportedSpots[0].severity}/5
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleLocateSpotOnMap(userReportedSpots[0])}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold transition-colors"
                      >
                        Track Map
                      </button>
                      <button
                        onClick={() => setActiveMainTab('reported')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors shadow-2xs flex items-center gap-1"
                      >
                        <span>View All ({userReportedSpots.length})</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Main Hotspot List */}
              <div className="flex-1 overflow-hidden">
                <HotspotList
                  clusters={clusters}
                  selectedCluster={selectedCluster}
                  activeFilter={activePriorityFilter}
                  onFilterChange={setActivePriorityFilter}
                  onSelectCluster={(c) => {
                    setSelectedCluster(c);
                    setCurrentCoords([c.center.lat, c.center.lng]);
                  }}
                  onOrganizeCleanup={handleOrganizeCleanup}
                  onDiagnoseIncident={handleDiagnoseIncident}
                  locationName={locationName}
                  isLoading={isLoadingIncidents}
                />
              </div>
            </section>

          </main>
        </div>
      )}

      {/* 4. MODAL DIALOGS */}
      
      {/* Citizen Report Modal (Requirement 1, 3 & 4) */}
      <ReportIncidentModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setReportModalInitialData(undefined);
        }}
        defaultLat={currentCoords[0]}
        defaultLng={currentCoords[1]}
        onReportSubmitted={handleReportSubmitted}
        initialData={reportModalInitialData}
      />

      {/* Google Cloud Storage Setup & Freemium Info Modal (Requirement 1) */}
      <GoogleStorageModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
      />

      {/* AI Hydrological Diagnosis Modal */}
      <DiagnosisModal
        isOpen={isDiagnosisModalOpen}
        onClose={() => setIsDiagnosisModalOpen(false)}
        incident={diagnosingIncident}
        onOrganizeCleanup={() => {
          if (diagnosingIncident) {
            const cluster = clusters.find((c) =>
              c.incidents.some((i) => i.id === diagnosingIncident.id)
            ) || {
              id: 'cluster-temp',
              name: diagnosingIncident.title,
              center: { lat: diagnosingIncident.lat, lng: diagnosingIncident.lng },
              incidents: [diagnosingIncident],
              totalSeverity: diagnosingIncident.severity,
              touristAttractionsNear: [],
              waterbodyType: 'river',
              urgencyScore: 75,
              urgencyLevel: 'critical',
              distanceKm: 0.5,
              estimatedTimeHours: 2.0,
              volunteersRecommended: 12,
              primaryAction: 'Volunteer Riverbank Sweep',
              howToCleanSummary: 'Sweep plastic bottles and food wrappers into heavy collection sacks.',
              gearNeededSummary: ['Gloves', 'Pickers', 'Bags'],
            };
            handleOrganizeCleanup(cluster);
          }
        }}
      />

      {/* AI Turnkey Cleanup Drive Plan Modal with Customization & Weather */}
      <CleanupDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        cluster={drivePlanningCluster}
      />

      {/* Community Leaderboard & Impact Counter Modal */}
      <ImpactStats
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        activeHotspotsCount={clusters.length}
      />
    </div>
  );
}
