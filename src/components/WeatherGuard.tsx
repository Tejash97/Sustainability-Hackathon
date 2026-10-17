'use client';

import React from 'react';
import { WeatherData } from '@/types';
import { CloudRain, Wind, Thermometer, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface WeatherGuardProps {
  weather: WeatherData | null;
  isLoading: boolean;
  locationName: string;
}

export const WeatherGuard: React.FC<WeatherGuardProps> = ({
  weather,
  isLoading,
  locationName,
}) => {
  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-3 flex items-center justify-between animate-pulse">
        <div className="h-4 w-40 bg-slate-700/50 rounded"></div>
        <div className="flex gap-2">
          <div className="h-4 w-16 bg-slate-700/50 rounded"></div>
          <div className="h-4 w-16 bg-slate-700/50 rounded"></div>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 p-3.5 ${
        !weather.isSafe
          ? 'bg-rose-50 border-rose-200 text-rose-950 shadow-sm'
          : 'bg-white border-emerald-200/80 shadow-sm'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left Status & Alert */}
        <div className="flex items-start sm:items-center gap-2.5">
          <div
            className={`p-2 rounded-xl flex-shrink-0 ${
              !weather.isSafe
                ? 'bg-rose-100 text-rose-600'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {!weather.isSafe ? (
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-700" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold tracking-wide uppercase font-mono text-emerald-900">
                {!weather.isSafe ? 'RIVER SAFETY WARNING' : 'VOLUNTEER SAFETY ADVISORY'}
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  !weather.isSafe
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {!weather.isSafe ? 'HAZARDOUS RIVER CONDITIONS' : 'OPTIMAL CONDITIONS FOR SWEEP'}
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-0.5">
              {!weather.isSafe ? (
                <span className="text-rose-800 font-medium">
                  ⚠️ {weather.alertReason || 'High precipitation/river swell risk today. Reschedule riverbank operations.'}
                </span>
              ) : (
                <span>
                  Hydrological conditions are optimal along <strong className="text-slate-900">{locationName}</strong>. Riverbanks firm and safe for volunteer mobilization.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right Real-time Meteorological telemetry with hover tooltips */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 text-xs text-slate-700 font-mono">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 shadow-sm"
            title="Ambient Temperature"
          >
            <Thermometer className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-bold">{Math.round(weather.temperature)}°C</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shadow-sm ${
              weather.precipitation > 5
                ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                : 'bg-slate-50 border-slate-200'
            }`}
            title="Precipitation Rainfall"
          >
            <CloudRain className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-bold">{weather.precipitation.toFixed(1)} mm</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shadow-sm ${
              weather.windSpeed > 35
                ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                : 'bg-slate-50 border-slate-200'
            }`}
            title="Wind Speed"
          >
            <Wind className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-bold">{Math.round(weather.windSpeed)} km/h</span>
          </div>
        </div>
      </div>
    </div>
  );
};
