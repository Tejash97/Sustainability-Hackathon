import { GoogleGenerativeAI } from '@google/generative-ai';
import { Incident, HotspotCluster, GeminiDiagnosisResponse, CleanupDrivePlan } from '@/types';
import { ENV } from './config';
import { getDefaultCleanupDate, formatCanonicalScheduleString } from './googleIntegrations';

/**
 * Gets the Google Generative AI client instance if key is configured.
 */
function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey =
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    ENV.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_gemini_api_key')) {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

/**
 * Diagnoses an incident using Google Gemini API with multi-model fallback
 * and hydrological heuristics if offline or quota exceeded.
 */
export async function diagnoseIncident(incident: Incident): Promise<GeminiDiagnosisResponse> {
  const client = getGeminiClient();

  if (client) {
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = client.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.2,
          },
        });

        const prompt = `You are an environmental hydrologist and river conservation expert.
Analyze the provided water pollution or leakage incident report.
Provide a strictly valid JSON response containing:
1. "cause_hypothesis": Likely primary source of the pollution (e.g., untreated tourist hospitality runoff, municipal supply pipe burst, illegal dumping).
2. "ecological_risk": Potential impact on aquatic biodiversity, potable water, and downstream communities.
3. "remediation_tier": "Community-Friendly" (can be cleaned by volunteers) or "Municipal Hazmat" (requires heavy machinery/authorities).
4. "immediate_precaution": Critical safety warning for nearby citizens.

Incident Details:
Title: ${incident.title}
Category: ${incident.category}
Severity Rating: ${incident.severity} / 5
Description: ${incident.description}
Location Coordinates: Latitude ${incident.lat}, Longitude ${incident.lng}
Waterbody Reference: ${incident.waterbodyName || 'Urban waterway'}

Respond ONLY with valid JSON. No markdown backticks.`;

        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        // Strip markdown backticks if present
        text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(text);

        return {
          cause_hypothesis: parsed.cause_hypothesis || 'Untreated urban and tourist litter discharge.',
          ecological_risk: parsed.ecological_risk || 'Oxygen depletion and biological toxicity threatening native aquatic fauna.',
          remediation_tier: parsed.remediation_tier === 'Municipal Hazmat' ? 'Municipal Hazmat' : 'Community-Friendly',
          immediate_precaution: parsed.immediate_precaution || 'Avoid direct contact with water without nitrile gloves and protective footwear.',
          confidence: `Google ${modelName} Hydrology Intelligence`,
          simulated: false,
          apiKeyConfigured: true,
        };
      } catch (err) {
        // Try next candidate model
        continue;
      }
    }
  }

  // Fallback Hydrology Heuristic Engine
  const fallback = generateFallbackDiagnosis(incident);
  fallback.apiKeyConfigured = !!client;
  return fallback;
}

/**
 * Generates an end-to-end Cleanup Drive Plan using Gemini API or intelligent eco-planning fallback.
 */
export async function generateCleanupDrivePlan(
  cluster: HotspotCluster,
  userNotes?: string
): Promise<CleanupDrivePlan> {
  const client = getGeminiClient();

  if (client) {
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = client.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.3,
          },
        });

        const prompt = `You are Google's Lead Environmental Hydrologist and Community Mobilization Director for RiverRevive.
Generate a HYPER-REALISTIC, CUSTOM Community Cleanup Action Blueprint for this specific waterbody:

Waterway: "${cluster.name}" (${cluster.waterbodyType})
Coordinates: Lat ${cluster.center.lat.toFixed(4)}, Lng ${cluster.center.lng.toFixed(4)}
Urgency Score: ${cluster.urgencyScore}/100
Active Citizen Reports (${cluster.incidents.length}):
${cluster.incidents.map((i, idx) => `${idx + 1}. [${i.category}] ${i.title}: ${i.description}`).join('\n')}
Additional Notes: ${userNotes || 'None'}

CRITICAL INSTRUCTIONS FOR DYNAMIC ACCURACY:
1. NEVER output generic placeholders. Derive real local municipal bodies and realistic local access landmarks near these coordinates.
2. DYNAMIC SCHEDULE: Pick an exact upcoming calendar day and time window (e.g., "Saturday, Oct 11 • 6:15 AM – 9:00 AM") with a specific 1-sentence hydrological/meteorological reason (e.g., "Dawn low-tide window avoids peak solar heat and midday canal surface evaporation").
3. RECOVERY DEPOT: Specify a realistic municipal waste recovery facility or segregation compactor station appropriate for this city and river basin.
4. SPECIFIC TOOLS: Tailor the equipment checklist specifically to the reported pollutants (e.g. chemical gloves, trash grabbers, floating booms, biohazard puncture sacks).
5. SOCIAL MEDIA COPY: Write punchy, inspiring, hyper-local messages for WhatsApp, Instagram, and X that name "${cluster.name}" and rally local citizens.

Format response strictly as valid JSON with keys:
{
  "drive_title": "Inspiring Title",
  "tagline": "Memorable slogan",
  "target_zone": "Specific stretch description",
  "logistics": {
    "meeting_point": "Exact local landmark or access promenade",
    "recommended_time": "Exact Day, Date, Time Window (Hydrological Rationale)",
    "waste_disposal_drop_off": "Realistic Municipal Waste Segregation Facility",
    "expected_duration": "${cluster.estimatedTimeHours || 2.5} Hours (${cluster.volunteersRecommended || 15} volunteers needed)"
  },
  "safety_guidelines": ["Safety point 1", "Safety point 2", "Safety point 3", "Safety point 4"],
  "tool_checklist": ["Tool 1", "Tool 2", "Tool 3", "Tool 4", "Tool 5", "Tool 6"],
  "social_media_copy": {
    "instagram": "Instagram post with hashtags",
    "whatsapp": "*WhatsApp invite with emojis*",
    "x_twitter": "X post under 280 characters"
  }
}

Respond ONLY with valid JSON. No markdown code blocks.`;

        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(text);

        return {
          ...parsed,
          simulated: false,
          apiKeyConfigured: true,
        };
      } catch (err) {
        continue;
      }
    }
  }

  // Fallback intelligent drive plan generator
  const fallbackPlan = generateFallbackCleanupPlan(cluster);
  fallbackPlan.apiKeyConfigured = !!client;
  return fallbackPlan;
}

/**
 * Intelligent environmental heuristics for diagnosis when API key is missing or offline.
 */
function generateFallbackDiagnosis(incident: Incident): GeminiDiagnosisResponse {
  const isHighSeverity = incident.severity >= 4;
  const isChemicalOrOil =
    incident.category === 'Sewage / Chemical Inflow' ||
    incident.category === 'Oil / Industrial Slick' ||
    incident.category === 'Dead Fish / Algae Bloom';

  if (isChemicalOrOil && isHighSeverity) {
    return {
      cause_hypothesis:
        'Point-source industrial effluent bypass or unmonitored municipal sewage interceptor breach during peak load hours.',
      ecological_risk:
        'Severe Biochemical Oxygen Demand (BOD) spike leading to immediate anoxia in local micro-aquifers, bioaccumulation of surfactants, and toxic threat to benthic organisms.',
      remediation_tier: 'Municipal Hazmat',
      immediate_precaution:
        'DANGER: Do not come into dermal contact with water. Maintain a minimum 10-meter perimeter buffer. Avoid inhalation of sulfurous vapors. Notify municipal pollution control board.',
      confidence: 'Heuristic Hydrology Model',
      simulated: true,
    };
  }

  if (incident.category === 'Pipe / Infrastructure Leakage') {
    return {
      cause_hypothesis:
        'High-pressure water distribution joint shear or corroded valve packing exacerbated by seasonal soil subsidence near the river embankment.',
      ecological_risk:
        'Localized soil scour and embankment liquefaction leading to destabilization of riparian flora and wasting potable treated water.',
      remediation_tier: 'Municipal Hazmat',
      immediate_precaution:
        'Avoid walking directly below the saturated embankment slope due to potential mud collapse. Report urgent GPS coordinates to city water board.',
      confidence: 'Heuristic Hydrology Model',
      simulated: true,
    };
  }

  return {
    cause_hypothesis:
      'Non-point-source urban storm runoff and heavy tourist visitor footfall littering single-use packaging and devotional plastic items along the riparian zone.',
    ecological_risk:
      'Microplastic degradation, entrapment of wading birds, water surface insolation blocking, and stagnation harboring disease vectors.',
    remediation_tier: 'Community-Friendly',
    immediate_precaution:
      'Wear puncture-resistant nitrile-dipped gloves and sturdy rubber boots. Handle glass or sharps only with grabber tools into puncture-safe receptacles.',
    confidence: 'Heuristic Hydrology Model',
    simulated: true,
  };
}

/**
 * Fallback turnkey drive generator ensuring immediate complete functionality.
 */
function generateFallbackCleanupPlan(cluster: HotspotCluster): CleanupDrivePlan {
  const isHazmat = cluster.incidents.some(
    (i) => i.severity === 5 || i.category === 'Sewage / Chemical Inflow'
  );

  const title = `Operation Revive: ${cluster.name.replace(/Cluster.*/, '').trim() || 'Riparian Stretch'}`;
  const tagline = 'Empowering Citizens, Restoring Living Waters – One Kilogram at a Time';
  const defaultDate = getDefaultCleanupDate();
  const canonicalTime = formatCanonicalScheduleString(defaultDate, 2.5);

  return {
    drive_title: title,
    tagline,
    target_zone: `Waterway Sector at Lat ${cluster.center.lat.toFixed(4)}, Lng ${cluster.center.lng.toFixed(4)} (${cluster.waterbodyType.toUpperCase()})`,
    logistics: {
      meeting_point:
        cluster.touristAttractionsNear[0]?.name
          ? `Main Entrance at ${cluster.touristAttractionsNear[0].name}`
          : `Embankment Access Steps at Lat ${cluster.center.lat.toFixed(4)}, Lng ${cluster.center.lng.toFixed(4)}`,
      recommended_time: canonicalTime,
      waste_disposal_drop_off:
        'Designated Municipal Segregation Depot / Green Waste Skip',
      expected_duration: `${cluster.estimatedTimeHours || 2.5} Hours (${cluster.volunteersRecommended || 15} volunteers needed)`,
    },
    safety_guidelines: [
      'Strictly prohibit volunteers from wading deeper than ankle level into moving water.',
      'All participants must wear puncture-resistant gloves and sturdy gumboots.',
      isHazmat
        ? 'Chemical & toxic inflow section is quarantined as Hazmat: Volunteers must ONLY collect dry shore litter at least 15m away.'
        : 'Maintain a 2-person buddy system along steep riparian slopes to prevent slipping.',
      'Hydration checkpoint: Drink safe bottled water every 30 minutes; do not touch face or mouth while handling waste.',
      'Emergency first-aid station with antiseptic wipes, eyewash, and bandage tape on site.',
    ],
    tool_checklist: cluster.gearNeededSummary || [
      'Heavy-duty biodegradable gunny / woven polypropylene sacks (30+ bags)',
      'Ergonomic stainless-steel litter picker grabbers (10-15 pairs)',
      'Double-coated puncture-proof work gloves (25 pairs)',
      'High-visibility volunteer safety vests',
      'Luggage hanging spring scales for impact weigh-in',
      'Sharp containers for safe disposal of broken glass and metallic cans',
      'Field medical kit and antiseptic hand wash station',
    ],
    social_media_copy: {
      instagram: `🌊 RALLY FOR OUR RIVERS! Join us for ${title}! 🌿\n\nOur waterfront is choking under plastic and unmonitored waste. Together, we can restore its breath!\n\n📍 Where: Lat ${cluster.center.lat.toFixed(4)}, Lng ${cluster.center.lng.toFixed(4)}\n⏰ When: ${canonicalTime}\n🧤 Safety: Gloves, grabbers & refreshments provided!\n\nTag a friend who cares about our planet! Every bag makes a ripple. 💧💚\n\n#RiverRevive #CleanWaterways #PlasticFreeRivers #EcoWarriors #CommunityAction`,
      whatsapp: `*📢 CALL TO ACTION: ${title.toUpperCase()}* 🌊\n\nDear Friends & Nature Guardians,\n\nOur local waterbody needs urgent community intervention. Join us for a safe morning cleanup drive:\n\n📅 *When:* ${canonicalTime}\n📍 *Meeting Point:* Embankment access steps (Lat: ${cluster.center.lat.toFixed(4)}, Lng: ${cluster.center.lng.toFixed(4)})\n🎯 *Target:* Clearing ${cluster.incidents.length} verified pollution hotspots.\n🛡️ *Safety:* Complete PPE & sanitization provided.\n\n👉 *Please RSVP by replying to this message! Bring a reusable water bottle.* Let's protect our lifeline together! 🌿`,
      x_twitter: `🚨 Rivers can't speak, but we can! Join ${title} this weekend at ${cluster.center.lat.toFixed(3)}, ${cluster.center.lng.toFixed(3)}. Urgent cleanup for ${cluster.incidents.length} choke points. PPE provided. Let's revive our waters! 💧 #RiverRevive #ActOnClimate`,
    },
    simulated: true,
  };
}
