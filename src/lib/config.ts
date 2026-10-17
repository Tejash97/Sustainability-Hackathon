/**
 * Helper to get environment variables across both server and client environments.
 */
function cleanValue(val: string): string {
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

function getEnvVariable(key: string, defaultValue: string = ''): string {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return cleanValue(process.env[key] as string);
  }
  return defaultValue;
}

export const ENV = {
  get GEMINI_API_KEY() {
    return (
      getEnvVariable('NEXT_PUBLIC_GEMINI_API_KEY', '') ||
      getEnvVariable('GEMINI_API_KEY', '')
    );
  },
  get GOOGLE_MAPS_API_KEY() {
    return getEnvVariable('GOOGLE_MAPS_API_KEY', getEnvVariable('GEMINI_API_KEY', ''));
  },
  get GOOGLE_GEOCODING_API_URL() {
    return getEnvVariable('GOOGLE_GEOCODING_API_URL', 'https://maps.googleapis.com/maps/api/geocode/json');
  },
  get GOOGLE_PLACES_API_URL() {
    return getEnvVariable('GOOGLE_PLACES_API_URL', 'https://maps.googleapis.com/maps/api/place/nearbysearch/json');
  },
  get GOOGLE_DIRECTIONS_API_URL() {
    return getEnvVariable('GOOGLE_DIRECTIONS_API_URL', 'https://maps.googleapis.com/maps/api/directions/json');
  },
  get OVERPASS_API_URL() {
    return getEnvVariable('OVERPASS_API_URL', 'https://overpass-api.de/api/interpreter');
  },
  get NOMINATIM_API_URL() {
    return getEnvVariable('NOMINATIM_API_URL', 'https://nominatim.openstreetmap.org');
  },
  get OPEN_METEO_API_URL() {
    return getEnvVariable('OPEN_METEO_API_URL', 'https://api.open-meteo.com/v1/forecast');
  },
  get PORT() {
    return parseInt(getEnvVariable('PORT', '3000'), 10);
  },
  // Google Cloud Storage / Firebase Storage (Freemium Spark Tier - 5GB Free)
  get FIREBASE_API_KEY() {
    return getEnvVariable('NEXT_PUBLIC_FIREBASE_API_KEY', getEnvVariable('FIREBASE_API_KEY', ''));
  },
  get FIREBASE_AUTH_DOMAIN() {
    return getEnvVariable('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', getEnvVariable('FIREBASE_AUTH_DOMAIN', ''));
  },
  get FIREBASE_PROJECT_ID() {
    return getEnvVariable('NEXT_PUBLIC_FIREBASE_PROJECT_ID', getEnvVariable('FIREBASE_PROJECT_ID', ''));
  },
  get FIREBASE_STORAGE_BUCKET() {
    return getEnvVariable('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', getEnvVariable('FIREBASE_STORAGE_BUCKET', getEnvVariable('GOOGLE_CLOUD_STORAGE_BUCKET', '')));
  },
  get FIREBASE_APP_ID() {
    return getEnvVariable('NEXT_PUBLIC_FIREBASE_APP_ID', getEnvVariable('FIREBASE_APP_ID', ''));
  },
  get FIREBASE_MESSAGING_SENDER_ID() {
    return getEnvVariable('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', getEnvVariable('FIREBASE_MESSAGING_SENDER_ID', ''));
  },
  get FIREBASE_MEASUREMENT_ID() {
    return getEnvVariable('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID', getEnvVariable('FIREBASE_MEASUREMENT_ID', ''));
  }
};
