import { OverpassElement } from '@/types';
import { ENV } from './config';

/**
 * Builds the Overpass QL query string for waterbodies and tourist hotspots.
 */
export function buildOverpassQuery(lat: number, lng: number, radiusMeters: number): string {
  return `[out:json][timeout:20];
(
  way["waterway"~"river|stream|canal"](around:${radiusMeters},${lat},${lng});
  relation["waterway"~"river|stream|canal"](around:${radiusMeters},${lat},${lng});
  node["tourism"~"attraction|viewpoint|hotel"](around:${radiusMeters},${lat},${lng});
  way["natural"~"water"](around:${radiusMeters},${lat},${lng});
);
out center 50;`;
}

/**
 * Fetches waterways and tourist POIs using OpenStreetMap Overpass API (100% free).
 * Falls back to high-fidelity synthesized local POIs if Overpass times out or fails.
 */
export async function fetchOverpassData(
  lat: number,
  lng: number,
  radiusKm: number = 5
): Promise<{ elements: OverpassElement[]; isFallback?: boolean }> {
  const radiusMeters = Math.round(radiusKm * 1000);
  const query = buildOverpassQuery(lat, lng, radiusMeters);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const response = await fetch(ENV.OVERPASS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'RiverReviveAI-EcoPlatform/1.0',
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Overpass API responded with HTTP status ${response.status}`);
    }

    const data = await response.json();

    const elements: OverpassElement[] = (data.elements || [])
      .map((el: any) => {
        const itemLat = el.lat ?? el.center?.lat;
        const itemLon = el.lon ?? el.center?.lon;
        if (!itemLat || !itemLon) return null;

        const isWater = !!(el.tags?.waterway || el.tags?.natural === 'water');
        const isTourism = !!el.tags?.tourism;

        return {
          id: el.id,
          type: el.type,
          lat: itemLat,
          lon: itemLon,
          name: el.tags?.name || (isWater ? 'Unidentified Waterway' : 'Local Tourist Spot'),
          kind: isWater ? 'waterway' : 'tourism',
          waterwayType: el.tags?.waterway || el.tags?.water || 'water',
          tourismType: el.tags?.tourism,
          rawTags: el.tags || {},
        };
      })
      .filter((el: OverpassElement | null): el is OverpassElement => el !== null);

    if (elements.length > 0) {
      return { elements, isFallback: false };
    }

    // If query returned 0 items, generate proximate landmarks based on coordinates
    return { elements: generateFallbackPOIs(lat, lng), isFallback: true };
  } catch (error) {
    console.warn('Overpass API fetch failed or timed out. Using resilient fallback data:', error);
    return { elements: generateFallbackPOIs(lat, lng), isFallback: true };
  }
}

/**
 * Provides guaranteed POI landmarks relative to the selected coordinates
 * so the application always has rich waterbody lines and tourist locations.
 */
export function generateFallbackPOIs(centerLat: number, centerLng: number): OverpassElement[] {
  return [
    {
      id: 9001,
      type: 'way',
      lat: centerLat + 0.004,
      lon: centerLng + 0.003,
      lng: centerLng + 0.003,
      name: 'Central River Channel & Embankment',
      kind: 'waterway',
      waterwayType: 'river',
      rawTags: { waterway: 'river', name: 'Main River Channel' },
    },
    {
      id: 9002,
      type: 'way',
      lat: centerLat - 0.003,
      lon: centerLng - 0.002,
      lng: centerLng - 0.002,
      name: 'Urban Inflow Canal & Floodway',
      kind: 'waterway',
      waterwayType: 'canal',
      rawTags: { waterway: 'canal', name: 'Municipal Feeder Canal' },
    },
    {
      id: 9003,
      type: 'way',
      lat: centerLat + 0.008,
      lon: centerLng - 0.006,
      lng: centerLng - 0.006,
      name: 'Wetland Sanctuary & Eco-Lagoon',
      kind: 'waterway',
      waterwayType: 'natural-water',
      rawTags: { natural: 'water', name: 'Wetland Lagoon' },
    },
    {
      id: 9004,
      type: 'node',
      lat: centerLat + 0.002,
      lon: centerLng + 0.004,
      lng: centerLng + 0.004,
      name: 'Historical Riverfront Promenade & Ghat',
      kind: 'tourism',
      tourismType: 'attraction',
      rawTags: { tourism: 'attraction', name: 'Heritage Ghat' },
    },
    {
      id: 9005,
      type: 'node',
      lat: centerLat + 0.006,
      lon: centerLng + 0.002,
      lng: centerLng + 0.002,
      name: 'Riverside Viewpoint & Eco Park',
      kind: 'tourism',
      tourismType: 'viewpoint',
      rawTags: { tourism: 'viewpoint', name: 'River Viewpoint' },
    },
    {
      id: 9006,
      type: 'node',
      lat: centerLat - 0.005,
      lon: centerLng + 0.005,
      lng: centerLng + 0.005,
      name: 'Waterfront Heritage Pavilion',
      kind: 'tourism',
      tourismType: 'hotel',
      rawTags: { tourism: 'attraction', name: 'Waterfront Pavilion' },
    },
  ];
}
