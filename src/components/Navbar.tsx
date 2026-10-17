'use client';

import React, { useState, useEffect } from 'react';
import {
  Waves,
  MapPin,
  Crosshair,
  Search,
  PlusCircle,
  Trophy,
  Sliders,
  ChevronDown,
  Camera,
  Cloud,
  Sparkles,
  Map,
  ShieldCheck,
  ClipboardList,
  LogOut,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export type NavTab = 'map' | 'vision' | 'reported';

interface NavbarProps {
  currentLocationName: string;
  currentCoords: [number, number];
  onSelectCoordinates: (lat: number, lng: number, name: string) => void;
  radiusKm: number;
  onRadiusChange: (radius: number) => void;
  onOpenReportModal: () => void;
  onOpenStatsModal: () => void;
  onOpenStorageModal?: () => void;
  isLocating: boolean;
  onUseGps: () => void;
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  reportedSpotsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLocationName,
  currentCoords,
  onSelectCoordinates,
  radiusKm,
  onRadiusChange,
  onOpenReportModal,
  onOpenStatsModal,
  onOpenStorageModal,
  isLocating,
  onUseGps,
  activeTab = 'map',
  onTabChange,
  reportedSpotsCount = 0,
}) => {
  const { user, userEmail, userName, userPhoto, openAuthModal, signOut, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showRadiusMenu, setShowRadiusMenu] = useState(false);
  const [recentLocations, setRecentLocations] = useState<Array<{ name: string; lat: number; lng: number }>>([
    { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
    { name: 'Varanasi', lat: 25.3176, lng: 82.9739 },
    { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
  ]);

  // Load recent locations from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('riverrevive_recent_searches');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentLocations(parsed);
        }
      }
    } catch {}
  }, []);

  const saveRecentLocation = (item: { name: string; lat: number; lng: number }) => {
    setRecentLocations((prev) => {
      const filtered = prev.filter((p) => p.name.toLowerCase() !== item.name.toLowerCase());
      const updated = [item, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('riverrevive_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Search places worldwide using Free Nominatim API
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&limit=6&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'RiverReviveAI-Search/1.0',
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.warn('Geocoding search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectPlace = (place: any) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    const shortName = place.display_name.split(',')[0].trim();
    const displayName = place.display_name.split(',').slice(0, 3).join(',');
    saveRecentLocation({ name: shortName, lat, lng });
    onSelectCoordinates(lat, lng, displayName);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      handleSelectPlace(suggestions[0]);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 py-2.5 space-y-2.5">
        
        {/* ROW 1: Brand Logo + Primary Nav Tabs + Action CTAs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Brand Logo & Tag */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#134e3a] to-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-900/20">
                <Waves className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight text-slate-900">
                    RiverRevive<span className="text-emerald-600">.ai</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  AI Waterway Cleanup & Response
                </p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-1.5 md:hidden">
              {user ? (
                <button
                  onClick={() => signOut()}
                  className="p-1 rounded-full border border-emerald-500 overflow-hidden"
                  title={`Signed in as ${userEmail}. Click to sign out.`}
                >
                  {userPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={userPhoto} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {userName?.[0] || 'G'}
                    </div>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => openAuthModal()}
                  className="p-1.5 rounded-xl bg-white border border-slate-300 text-slate-700"
                  title="Sign in with Google"
                >
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                </button>
              )}

              <button
                onClick={() => onOpenStorageModal?.()}
                className="p-2 rounded-xl bg-slate-100 text-blue-600 hover:bg-slate-200"
                title="Google Cloud Storage Status"
              >
                <Cloud className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenReportModal}
                className="p-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                title="Report Spot"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Core Feature Tabs */}
          <nav className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => onTabChange?.('map')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'map'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Map className="w-3.5 h-3.5 text-emerald-600" />
              <span>Map</span>
            </button>

            <button
              onClick={() => onTabChange?.('vision')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'vision'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI Estimator</span>
            </button>

            <button
              onClick={() => onTabChange?.('reported')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all relative ${
                activeTab === 'reported'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
              <span>Reported Spots</span>
              {reportedSpotsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-600 text-white font-bold">
                  {reportedSpotsCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Header CTAs: Google Sign-In + Google Cloud Storage Status + Report Button */}
          <div className="hidden md:flex items-center space-x-2">
            
            {/* Google Authentication (Google Accounts Only) */}
            {user ? (
              <div className="relative group">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-400 hover:bg-white transition-all cursor-pointer">
                  {userPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={userPhoto}
                      alt={userName || 'Google Account'}
                      className="w-6 h-6 rounded-full border border-emerald-500 shadow-2xs"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                      {userName?.[0]?.toUpperCase() || 'G'}
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-800 max-w-[90px] truncate">
                    {userName}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400 group-hover:rotate-180 transition-transform" />
                </div>

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-2xl p-2.5 shadow-xl border border-slate-200 hidden group-hover:block z-50">
                  <div className="px-2 py-1.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{userEmail}</p>
                  </div>
                  <div className="p-1 space-y-1">
                    <div className="text-[10px] text-emerald-800 font-semibold px-2 py-1 bg-emerald-50 rounded-lg flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      <span>Google Calendar & Gmail Active</span>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal()}
                disabled={authLoading}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-all shadow-xs cursor-pointer"
                title="Sign in with your Google Account for Google Calendar & Gmail scheduling"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                <span>Google Sign In</span>
              </button>
            )}

            {/* Cloud Storage Chip */}
            <button
              onClick={() => onOpenStorageModal?.()}
              title="Cloud Storage Status"
              className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all shadow-xs"
            >
              <Cloud className="w-3.5 h-3.5 text-blue-600" />
              <span>Storage</span>
            </button>

            <button
              onClick={onOpenStatsModal}
              title="View community volunteer impact & rankings"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 transition-all shadow-xs"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>Impact</span>
            </button>

            <button
              onClick={onOpenReportModal}
              title="Report an uncleaned waterbody spot or illegal dumping"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-emerald-200" />
              <span>Report Spot</span>
            </button>
          </div>
        </div>

        {/* ROW 2: Geospatial Search + Location Switcher Chips */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
          
          {/* Search Bar */}
          <div className="flex-1 max-w-xl flex items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all shadow-inner">
                <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
                  placeholder="Search city, river, ghat, or canal (e.g. Kolkata, Varanasi, London)..."
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
                />
                {isSearching && (
                  <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin ml-2" />
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showSearchDropdown && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl overflow-hidden z-50 divide-y divide-slate-100 border border-slate-200 shadow-xl">
                  {suggestions.map((place) => (
                    <button
                      key={place.place_id}
                      type="button"
                      onClick={() => handleSelectPlace(place)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition-colors flex items-start gap-2.5"
                    >
                      <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-slate-900 line-clamp-1">
                          {place.display_name.split(',')[0]}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {place.display_name}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* GPS Button */}
            <button
              type="button"
              onClick={onUseGps}
              disabled={isLocating}
              title="Detect your device GPS coordinates"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-emerald-800 hover:border-emerald-300 hover:bg-slate-50 transition-all shadow-xs"
            >
              <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-emerald-600' : 'text-emerald-700'}`} />
              <span className="hidden md:inline">{isLocating ? 'Locating...' : 'GPS'}</span>
            </button>

            {/* Radius Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRadiusMenu(!showRadiusMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-emerald-800 hover:border-emerald-300 transition-all shadow-xs"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                <span>{radiusKm} km</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRadiusMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl p-3 z-50 shadow-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">Scan Radius</span>
                    <span className="text-xs font-mono font-bold text-emerald-700">{radiusKm} km</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    step="1"
                    value={radiusKm}
                    onChange={(e) => onRadiusChange(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1 km</span>
                    <span>10 km</span>
                    <span>25 km</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick-Location Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono mr-1 hidden lg:inline">
              Recent:
            </span>
            {recentLocations.map((loc) => {
              const isCurrent = currentLocationName.toLowerCase().includes(loc.name.toLowerCase());
              return (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => onSelectCoordinates(loc.lat, loc.lng, loc.name)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    isCurrent
                      ? 'bg-emerald-800 text-white font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/60'
                  }`}
                >
                  <MapPin className={`w-3 h-3 ${isCurrent ? 'text-white' : 'text-emerald-700'}`} />
                  <span>{loc.name}</span>
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </header>
  );
};
