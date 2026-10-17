export type IncidentCategory =
  | 'Plastic & Solid Waste'
  | 'Sewage / Chemical Inflow'
  | 'Pipe / Infrastructure Leakage'
  | 'Dead Fish / Algae Bloom'
  | 'Oil / Industrial Slick';

export interface Incident {
  id: string;
  title: string;
  category: IncidentCategory;
  severity: number; // 1 to 5
  description: string;
  lat: number;
  lng: number;
  reportedAt: string;
  reporterName: string;
  waterbodyName?: string;
  photoUrl?: string;
  status: 'Unresolved' | 'Drive Scheduled' | 'Resolved';
  clusterId?: string;
  distanceKm?: number;
  cleanTimeHours?: number;
  volunteersNeeded?: number;
  gearNeeded?: string[];
  howToClean?: string;
}

export interface OverpassElement {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat: number;
  lon: number;
  lng?: number;
  name?: string;
  kind: 'waterway' | 'tourism';
  waterwayType?: string;
  tourismType?: string;
  rawTags?: Record<string, string>;
}

export interface HotspotCluster {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  incidents: Incident[];
  totalSeverity: number;
  touristAttractionsNear: OverpassElement[];
  waterbodyType: 'river' | 'lake' | 'canal' | 'wetland';
  urgencyScore: number; // 0 to 100
  urgencyLevel: 'critical' | 'moderate' | 'low';
  distanceKm: number;
  estimatedTimeHours?: number;
  volunteersRecommended?: number;
  primaryAction?: string;
  howToCleanSummary?: string;
  gearNeededSummary?: string[];
}

export interface WeatherData {
  temperature: number; // °C
  precipitation: number; // mm
  windSpeed: number; // km/h
  weatherCode: number;
  isSafe: boolean;
  alertReason?: string;
  timestamp: string;
}

export interface GeminiDiagnosisResponse {
  cause_hypothesis: string;
  ecological_risk: string;
  remediation_tier: 'Community-Friendly' | 'Municipal Hazmat';
  immediate_precaution: string;
  confidence?: string;
  simulated?: boolean;
  apiKeyConfigured?: boolean;
}

export interface CleanupDrivePlan {
  drive_title: string;
  tagline: string;
  target_zone: string;
  logistics: {
    meeting_point: string;
    recommended_time: string;
    waste_disposal_drop_off: string;
    expected_duration: string;
  };
  safety_guidelines: string[];
  tool_checklist: string[];
  social_media_copy: {
    instagram: string;
    whatsapp: string;
    x_twitter: string;
  };
  simulated?: boolean;
  apiKeyConfigured?: boolean;
}

export interface CommunityStats {
  totalTrashKg: number;
  activeCleanupZones: number;
  volunteerHours: number;
  communityBadges: {
    id: string;
    title: string;
    description: string;
    unlocked: boolean;
    icon: string;
  }[];
}
