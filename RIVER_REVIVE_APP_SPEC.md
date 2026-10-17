# PROJECT SPECIFICATION PROMPT: RIVERREVIVE AI
> **Role for the AI Agent:** You are an expert Full-Stack Engineer, Geospatial Specialist, and UI/UX Designer. Build a complete, production-grade, and responsive web application based on the following comprehensive specifications.

---

## 1. PROBLEM STATEMENT & BACKGROUND

### The Problem
Water bodies (rivers, lakes, wetlands, urban canals) are under catastrophic threat from plastic dumping, untreated sewage inflows, and unmonitored infrastructure leakages. Areas near high-density tourist hotspots are particularly vulnerable, experiencing massive seasonal surges in single-use plastic waste and litter that leach directly into freshwater systems.

While local citizens, NGOs, and student eco-clubs want to take initiative, they face critical roadblocks:
1. **Lack of Hyper-Local Visibility:** Activists don't know which specific stretches or riverbanks have the highest concentration of trash or active leakages within a 5–20 km radius.
2. **Uncoordinated Efforts:** Isolated citizen complaints go unnoticed, and cleanup efforts are scattered rather than focused on clustered, high-impact zones.
3. **Safety & Planning Friction:** Organizing a river cleanup requires risk assessments (river currents, weather, hazardous waste) and logistics (tools, permissions, volunteer mobilization) that overwhelm community organizers.

### The Solution: RiverRevive AI
**RiverRevive AI** is a community-driven geospatial platform that:
- Ask user for location and once it adds its location then look for nearby water bodies, waterways, and tourist attractions.
- Clusters citizen-reported pollution and leakage incidents using spatial proximity algorithms (DBSCAN / Haversine clustering).
- Computes an **Impact & Urgency Score** to highlight which riverbank or tourist waterfront needs immediate intervention.
- Leverages **Google Gemini API** to analyze pollution causes, assess ecological risks, and generate turnkey **Cleanup Action Plans** (with safety protocols, checklists, and social media flyers).
- Integrates zero-cost live weather data to safeguard volunteers against hazardous river/rain conditions.

---

## 2. TECH STACK & SYSTEM ARCHITECTURE

- **Frontend & Fullstack Framework:** Next.js (App Router, TypeScript) or React + Vite (TypeScript) with a lightweight backend (Next.js Route Handlers or Express/FastAPI).
- **Styling & UI:** Tailwind CSS, Lucide React icons, Framer Motion (subtle transitions), Glassmorphism-inspired eco-modern dark/light interface (Deep Slate, Emerald Green, Electric Cyan).
- **Mapping & Geospatial:** Leaflet.js with `react-leaflet` and OpenStreetMap raster tiles (Zero billing / No Google Maps API key required).
- **Clustering Algorithm:** Haversine distance matrix with DBSCAN (Density-Based Spatial Clustering of Applications with Noise) or density grid clustering implemented in TypeScript/Python.
- **AI Intelligence:** Google Gemini API (`@google/genai` or `@google/generative-ai` SDK) using `gemini-1.5-flash` or `gemini-2.0-flash`.
- **Weather & Safety:** Open-Meteo API (100% free, no key required).
- **Geocoding & POI Data:** OpenStreetMap Overpass API and Nominatim (100% free, no key required).

---

## 3. FREE APIS & ENVIRONMENT VARIABLES

Create a `.env.example` and load variables via `.env.local` or `.env`:

```env
# =================================================================
# 1. GOOGLE GEMINI API (MANDATORY)
# Free Tier from Google AI Studio: https://aistudio.google.com/
# =================================================================
GEMINI_API_KEY=your_gemini_api_key_here

# =================================================================
# 2. FREE PUBLIC APIS (NO KEYS REQUIRED)
# =================================================================
# OpenStreetMap Overpass API (Waterbodies & Tourist POIs)
OVERPASS_API_URL=https://overpass-api.de/api/interpreter

# Nominatim Reverse & Forward Geocoding
NOMINATIM_API_URL=https://nominatim.openstreetmap.org

# Open-Meteo Weather & Flood Risk
OPEN_METEO_API_URL=https://api.open-meteo.com/v1/forecast

# =================================================================
# 3. OPTIONAL FREE APIS
# =================================================================
# OpenAQ API (Free key from https://openaq.org/ if ambient AQI is displayed)
# OPENAQ_API_KEY=your_free_key_here

PORT=3000
```

---

## 4. MATHEMATICAL & ALGORITHMIC SPECIFICATIONS

### A. Haversine Distance Formula
Calculate the great-circle distance $d$ between user coordinates $(\phi_1, \lambda_1)$ and target report/waterway coordinates $(\phi_2, \lambda_2)$:
$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
$$d = R \cdot c \quad (\text{where } R = 6371 \text{ km})$$

### B. Spatial Incident Clustering (DBSCAN)
- **Epsilon ($\epsilon$):** 0.5 km (500 meters search radius).
- **MinPts:** 2 incidents.
- Any incident with $\ge 2$ neighboring reports within 500m forms a **Priority Cleanup Zone Cluster**.
- Outliers remain as individual incident markers.

### C. Hotspot Urgency & Impact Score Formula (0 to 100)
For each detected water body or incident cluster:
$$\text{Score} = \min\left(100, \, \left(w_r \cdot \sum S_i\right) + \left(w_t \cdot T_{\text{footfall}}\right) + \left(w_w \cdot W_{\text{type}}\right) - \left(w_d \cdot \text{Distance}\right)\right)$$
Where:
- $\sum S_i$: Sum of reported severity levels ($1 \le S_i \le 5$) in the cluster ($w_r = 8$).
- $T_{\text{footfall}}$: Tourist attraction weight within 1 km ($w_t = 15$ if high-density attraction, $10$ if moderate, $0$ if none).
- $W_{\text{type}}$: Waterbody vulnerability index ($20$ for major river, $15$ for lake/reservoir, $10$ for canal/drainage).
- $\text{Distance}$: Distance from user in km ($w_d = 1.5$ per km decay).
- Scores:
  - **70–100:** 🔴 Critical Hotspot (Immediate Action Recommended)
  - **40–69:** 🟡 Moderate Accumulation
  - **0–39:** 🟢 Low / Monitored Area

---

## 5. DETAILED FEATURE SPECIFICATIONS

### Feature 1: Location Discovery & Overpass POI Ingestion
1. **User Location:** Supports one-click browser geolocation (`navigator.geolocation`) OR search input with auto-suggest via free Nominatim API.
2. **Radius Filter:** Interactive slider allowing selection from 1 km to 25 km (default: 5 km).
3. **Overpass Query:** Fetches nearby waterways and tourist hotspots within bounding box:
   ```overpass
   [out:json][timeout:25];
   (
     way["waterway"~"river|stream|canal"](around:{RADIUS},{LAT},{LNG});
     relation["waterway"~"river|stream|canal"](around:{RADIUS},{LAT},{LNG});
     node["tourism"~"attraction|viewpoint|hotel"](around:{RADIUS},{LAT},{LNG});
     way["natural"~"water"](around:{RADIUS},{LAT},{LNG});
   );
   out center 40;
   ```

### Feature 2: Interactive Map View (Leaflet)
- Responsive full-height or 60% split map interface.
- Layer toggles:
  - Waterways & Rivers (Teal lines / polygons)
  - Tourist Footprint Points (Purple badges)
  - Citizen Incident Markers (Yellow / Red circles based on severity)
  - Clustered Cleanup Zones (Pulsing glowing radial rings indicating top urgency)
- Clicking a marker opens a summary popup with "View Diagnosis" and "Organize Cleanup" buttons.

### Feature 3: Citizen Incident & Leakage Reporting Modal
- Form fields:
  - Water Issue Category: `Plastic & Solid Waste`, `Sewage / Chemical Inflow`, `Pipe / Infrastructure Leakage`, `Dead Fish / Algae Bloom`, `Oil / Industrial Slick`.
  - Severity Slider: 1 (Mild Litter) to 5 (Heavy Toxic / Blockage).
  - Description / Notes.
  - Latitude & Longitude (auto-populated by clicking on map or current GPS).
  - Photo attachment (file upload or simulated image preview).

### Feature 4: Google Gemini AI Diagnosis & Cause Analysis
When an incident is reported or viewed, send the report data to the Gemini API (`gemini-1.5-flash` or `gemini-2.0-flash`):
- **System Prompt:**
  ```text
  You are an environmental hydrologist and river conservation expert.
  Analyze the provided water pollution or leakage incident report.
  Provide a concise JSON response containing:
  1. "cause_hypothesis": Likely primary source of the pollution (e.g., untreated tourist hospitality runoff, municipal supply pipe burst, illegal dumping).
  2. "ecological_risk": Potential impact on aquatic biodiversity, potable water, and downstream communities.
  3. "remediation_tier": "Community-Friendly" (can be cleaned by volunteers) or "Municipal Hazmat" (requires heavy machinery/authorities).
  4. "immediate_precaution": Critical safety warning for nearby citizens.
  ```

### Feature 5: AI-Powered Cleanup Drive Organizer
For any selected cluster or hotspot, users can click **"Generate Cleanup Drive Plan"**:
- Calls Gemini API to generate:
  - **Drive Title & Tagline** (e.g., "Clean Yamuna Stretch #4: Tourist Plastic Elimination Drive")
  - **Target Zone & Logistics:** Recommended meeting point, dumpster/waste disposal drop-off coordinates.
  - **Safety Guidelines:** Riverbank stability precautions, required gloves/gumboot ratings, water contamination warnings.
  - **Tool & Supply Checklist:** Gunny bags, litter pickers, first-aid kits, disinfectant.
  - **Ready-to-Post Campaign Copy:** Formatted for Instagram, WhatsApp community groups, and X (Twitter) with hashtags and rallying call.
  - One-click "Export Drive as Markdown" or "Copy Invite Link".

### Feature 6: Weather & River Safety Guard (Open-Meteo)
- Fetches real-time weather at the hotspot's coordinates:
  - Precipitation (mm), Wind speed (km/h), Temperature (°C).
- If precipitation $> 5\text{ mm}$ or wind speed $> 35\text{ km/h}$, displays a prominent warning badge:
  `⚠️ High Water / Rain Alert: Riverbank operations unsafe today. Reschedule cleanup to a dry day.`

### Feature 7: Community Leaderboard & Impact Counter
- Persistent counter (using localStorage or backend DB):
  - Total Kilograms of Trash Collected
  - Active Waterbody Cleanup Zones Monitored
  - Total Volunteer Hours Mobilized
- Badges for contributors: "River Guardian", "Zero-Waste Scout", "Leak Detective".

---

## 6. PROJECT DIRECTORY STRUCTURE

```text
river-revive-ai/
├── .env.example
├── README.md
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── public/
│   └── icons/
├── src/
│   ├── app/ (or pages/)
│   │   ├── layout.tsx
│   │   ├── page.tsx                       # Main Dashboard (Map + Feed + Analytics)
│   │   └── api/
│   │       ├── gemini-diagnose/route.ts   # Gemini API diagnosis endpoint
│   │       ├── gemini-drive/route.ts      # Gemini cleanup drive generator
│   │       ├── overpass/route.ts          # Proxy for OSM Overpass queries
│   │       └── incidents/route.ts         # In-memory or SQLite/JSON incident CRUD
│   ├── components/
│   │   ├── Map/
│   │   │   ├── RiverMap.tsx               # Leaflet map with markers & clusters
│   │   │   └── MapClusterLayer.tsx
│   │   ├── Feed/
│   │   │   ├── HotspotList.tsx            # Ranked urgency feed
│   │   │   └── HotspotCard.tsx
│   │   ├── Modals/
│   │   │   ├── ReportIncidentModal.tsx    # Citizen report submission
│   │   │   ├── CleanupDriveModal.tsx      # Gemini-generated cleanup plan
│   │   │   └── DiagnosisModal.tsx         # AI cause & risk breakdown
│   │   ├── WeatherGuard.tsx               # Open-Meteo safety warning
│   │   ├── Navbar.tsx
│   │   └── ImpactStats.tsx
│   ├── lib/
│   │   ├── gemini.ts                      # Google Gen AI client helper
│   │   ├── clustering.ts                  # Haversine & DBSCAN clustering logic
│   │   ├── overpass.ts                    # Overpass query builder & parser
│   │   └── weather.ts                     # Open-Meteo weather client
│   └── data/
│       └── seedIncidents.ts               # Pre-populated realistic mock reports
```

---

## 7. REALISTIC SEED DATA (FOR OUT-OF-THE-BOX OPERATION)

Include 6–8 pre-loaded realistic sample incidents in `src/data/seedIncidents.ts` so the dashboard immediately functions with full visualization:
1. **Riverfront Ghat / Promenade:** High tourist density, floating plastic bottles, severity 4.
2. **Canal Inflow Pipe:** Chemical/sewage discoloration, severity 5.
3. **Lakeside Walking Trail:** Picnic waste, beverage cans, severity 2.
4. **Municipal Supply Main:** Continuous clean water pipe leakage onto embankment, severity 3.
5. **Bridge Underpass:** Debris accumulation blocking water flow, severity 4.

---

## 8. STEP-BY-STEP BUILD & EXECUTION GUIDE FOR THE AGENT

1. **Scaffold Project:** Initialize the framework with Tailwind CSS and Lucide icons.
2. **Install Dependencies:**
   - Map: `leaflet`, `react-leaflet`, `@types/leaflet`
   - AI: `@google/genai` (or `@google/generative-ai`)
   - Utilities: `axios` / native `fetch`, `clsx`, `tailwind-merge`
3. **Implement Core Geospatial Logic:**
   - Create `src/lib/clustering.ts` with Haversine distance and cluster grouping.
   - Implement `src/lib/overpass.ts` with resilient timeout handling and fallback mock rivers if Overpass is temporarily rate-limited.
4. **Implement Gemini Integration:**
   - Wire up `gemini-1.5-flash` or `gemini-2.0-flash`.
   - Provide a simulated/fallback mode if `GEMINI_API_KEY` is not yet entered so the app does not crash.
5. **Assemble the UI:**
   - Side-by-side or tabbed layout: Map View (with interactive pins) and Hotspot Feed (sorted by Urgency Score).
   - Filter bar: Radius slider, issue category dropdown, urgency status filter.
6. **Polish UI/UX:**
   - Ensure clean Leaflet CSS styling (no broken tile icons).
   - Add tooltips, loading spinners, and toast notifications on report submission.
7. **Verify & Run:**
   - Ensure `npm run dev` starts cleanly on port 3000.
