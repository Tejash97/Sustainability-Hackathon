# 🌊 RiverRevive AI: Geospatial River & Waterway Pollution Response Platform

RiverRevive AI is an open, community-driven geospatial web application designed to restore water bodies (rivers, lakes, canals, wetlands) threatened by plastic dumping, untreated sewage, and unmonitored infrastructure leakages.

---

## 🚀 Key Features

1. **Location Discovery & Geocoding:**
   - One-click browser GPS positioning + search autocomplete powered by **OpenStreetMap Nominatim** (100% free, no key required).
   - Dynamic scan radius slider (1 km to 25 km).

2. **Geospatial Waterway & Tourist Ingestion:**
   - Ingests rivers, canals, wetlands, and high-footfall tourist landmarks via **OpenStreetMap Overpass API** (100% free, no key required).

3. **Spatial DBSCAN Clustering & Impact Scoring:**
   - **Haversine Distance Matrix:** Computes great-circle distances.
   - **DBSCAN Clustering:** Groups pollution incidents within a 500m radius ($\epsilon = 0.5$ km, $\text{minPts} = 2$) into actionable cleanup zones.
   - **Impact & Urgency Score (0 to 100):** Prioritizes riverbanks based on cumulative severity ($\sum S_i$), tourist visitor weight ($w_t$), waterbody vulnerability ($w_w$), and distance decay ($w_d$).

4. **Google Gemini AI Environmental Diagnosis:**
   - Analyzes reported pollution incidents to hypothesize primary causes (industrial effluent, tourist litter, pipe breaches).
   - Assesses ecological risks to aquatic biodiversity and downstream communities.
   - Categorizes remediation tier into **"Community-Friendly"** vs **"Municipal Hazmat"**.
   - Prescribes immediate safety precautions for volunteers and citizens.

5. **Turnkey AI Cleanup Drive Organizer:**
   - Generates turnkey community drive blueprints: assembly points, schedules, waste segregation drop-off depots, mandatory safety protocols, and supply checklists.
   - Produces ready-to-post campaign copy for **WhatsApp**, **Instagram**, and **X (Twitter)**.
   - One-click **"Export as Markdown"** and clipboard copy.

6. **Real-time Weather & Flood Guard:**
   - Powered by **Open-Meteo API** (100% free, no key required).
   - Live precipitation, wind speed, and temperature.
   - Alerts organizers if rain $> 5$ mm or wind $> 35$ km/h to prevent hazardous riverbank operations.

7. **Citizen Reporting & Eco Leaderboard:**
   - Geo-tagged incident submission modal with severity slider (1–5) and photo upload.
   - Persistent community impact counter (kg of trash recovered, active zones, volunteer hours) and unlockable Guardian badges.

---

## 🔑 100% Free API Configuration (`.enc` / `.env`)

As requested, all APIs are 100% free. You can add your API key in either [.enc](file:///c:/Users/Rajesh%20Mishra/Downloads/Sustainability%20Hack/.enc) or [.env](file:///c:/Users/Rajesh%20Mishra/Downloads/Sustainability%20Hack/.env):

```env
# 1. GOOGLE GEMINI API (100% Free tier from Google AI Studio)
# Get your free key in 30 seconds: https://aistudio.google.com/
GEMINI_API_KEY=your_free_gemini_api_key_here

# 2. FREE PUBLIC APIS (NO API KEYS REQUIRED)
OVERPASS_API_URL=https://overpass-api.de/api/interpreter
NOMINATIM_API_URL=https://nominatim.openstreetmap.org
OPEN_METEO_API_URL=https://api.open-meteo.com/v1/forecast

PORT=3000
```

> **Note:** The platform includes an intelligent built-in Environmental Hydrology Engine so the app runs out-of-the-box with full offline fallbacks even before adding your Gemini API key!

---

## 🛠️ Google-Oriented Hackathon Architecture

RiverRevive AI is engineered specifically for the **Google Solution Challenge 2026** and Google AI Hackathons:

- **AI Brain:** **Google Gemini 2.0 / 1.5 Flash** (Free Tier via Google AI Studio)
  - Deep Hydrological & Ecological Diagnosis
  - Turnkey Community Action Blueprint Generator
  - Multimodal Riverbank Trash Inspector (Computer Vision)
- **Geospatial & Navigation:** **Google Maps Platform**
  - Direct Turn-by-Turn GPS Directions (`google.com/maps/dir`)
  - Google Street View 360° riverfront verification (`google.com/maps/@?map_action=pano`)
  - Dynamic Geocoding & Worldwide Discovery
- **Backend Architecture:**
  - **Python FastAPI (3.11):** High-performance Python backend with Google Generative AI SDK, ready for **Google Cloud Run** deployment.
  - **Next.js 14 (App Router):** Modern React frontend with serverless API resilience and TypeScript.
- **Meteorological & Safety Shield:**
  - Dynamic hourly weather forecast matched to the user's customized cleanup date/time.

---

## 🏃‍♂️ How to Run

### 1. Start Frontend (Next.js):
```bash
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 2. Start Python AI Backend (Optional / Recommended for Hackathon Demos):
```bash
pip install -r backend/requirements.txt
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive Swagger API documentation will be available at **[http://localhost:8000/docs](http://localhost:8000/docs)**.
