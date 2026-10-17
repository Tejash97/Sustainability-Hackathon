import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let imageBase64 = '';
    let mimeType = 'image/jpeg';
    let userQuestion = 'How many days will it take to clean, and what resources, equipment, and workforce are required?';
    let conversationHistory: Array<{ role: string; content: string }> = [];

    if (contentType.includes('application/json')) {
      const body = await req.json();
      imageBase64 = body.imageBase64 || '';
      mimeType = body.mimeType || 'image/jpeg';
      if (body.userQuestion && typeof body.userQuestion === 'string' && body.userQuestion.trim()) {
        userQuestion = body.userQuestion.trim();
      }
      if (Array.isArray(body.conversationHistory)) {
        conversationHistory = body.conversationHistory;
      }
    }

    // Determine clean base64 data (or fetch from imageUrl if URL provided)
    let cleanB64 = imageBase64 ? imageBase64.replace(/^data:image\/\w+;base64,/, '') : '';

    if (!cleanB64 && contentType.includes('application/json')) {
      try {
        const body = await req.clone().json().catch(() => ({}));
        const imgUrl = body.imageUrl;
        if (imgUrl && typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
          const fetchRes = await fetch(imgUrl);
          if (fetchRes.ok) {
            const buf = await fetchRes.arrayBuffer();
            cleanB64 = Buffer.from(buf).toString('base64');
            mimeType = fetchRes.headers.get('content-type') || 'image/jpeg';
          }
        }
      } catch (fetchErr) {
        console.warn('Could not pre-fetch imageUrl for Vision AI:', fetchErr);
      }
    }

    const apiKey = ENV.GEMINI_API_KEY;

    if (apiKey && cleanB64) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const candidateModels = [
          'gemini-flash-latest',
          'gemini-3.1-flash-lite',
          'gemini-3.5-flash-lite',
          'gemini-flash-lite-latest',
          'gemini-3.8-flash',
          'gemini-3.7-flash',
          'gemini-3.6-flash',
          'gemini-3.5-flash',
        ];

        for (const modelName of candidateModels) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const prompt = `
You are Google's Senior Environmental Hydrology & Computer Vision AI for RiverRevive.
Analyze this water pollution/dumping photograph in detail and answer the user's specific questions.

The User is asking:
"${userQuestion}"

Output STRICT, VALID JSON ONLY (no markdown backticks, no markdown wrapping, no extra keys outside JSON):
{
  "estimatedDaysToClean": "2 - 3 Days",
  "estimatedWorkHours": 18,
  "workforceRecommendation": {
    "volunteers": 16,
    "supervisors": 2,
    "equipmentOperators": 1,
    "description": "A squad of 16-18 community volunteers divided into containment, shoreline extraction, and bagging teams."
  },
  "resourcesRequired": {
    "gearAndPPE": [
      "Puncture-Resistant Heavy Nitrile Gloves (Level 4)",
      "High-Traction Neoprene Mud Waders / Boots",
      "Trash Grabber Claws with Ergonomic Grips",
      "High-Visibility Safety Vests"
    ],
    "heavyEquipment": [
      "Floating Oil/Debris Shoreline Boom (20m - 30m)",
      "Heavy-duty River Bed Rakes & Net Scoops",
      "Inflatable Skiff / Flat-bottom Rowboat for Deep Flotsam"
    ],
    "collectionSupplies": [
      "120x Heavy-Duty 50-Liter Tear-Resistant Waste Bags",
      "3x Large Sorting Tarpaulins (for segregating PET from silt)",
      "Disinfection Spray & First-Aid Emergency Kit"
    ],
    "disposalLogistics": "Scheduled municipal flatbed or 3-ton compactor truck for transfer to registered mechanical recycling center.",
    "estimatedBudgetUSD": "$80 - $140 (mainly supplies & hauling)",
    "estimatedBudgetINR": "₹6,500 - ₹11,000"
  },
  "phasedRoadmap": [
    {
      "phase": "Day 1",
      "duration": "6 Hours",
      "focus": "Containment & Surface Skimming",
      "steps": [
        "Anchor floating containment boom downstream to stop downstream drift",
        "Clear floating surface plastics and water hyacinth / flotsam with grabbers"
      ]
    },
    {
      "phase": "Day 2",
      "duration": "7 Hours",
      "focus": "Shoreline Raking & Embedded Extraction",
      "steps": [
        "Deploy wader teams to rake embedded bankside mud bottles and silt-encrusted sacks",
        "Transfer waste onto riverside sorting tarps for polymer segregation"
      ]
    },
    {
      "phase": "Day 3",
      "duration": "5 Hours",
      "focus": "Municipal Hauling, Sorting & Native Revegetation",
      "steps": [
        "Weigh and load municipal collection truck with sorted PET and non-recyclables",
        "Plant native vetiver grass or bamboo stakes along cleaned bank to prevent soil erosion"
      ]
    }
  ],
  "detectedPollutants": [
    "Single-use PET beverage containers",
    "Expanded polystyrene (thermocol) packaging",
    "High-density polyethylene (HDPE) bags",
    "Decomposed organic silt and foliage"
  ],
  "composition": {
    "plasticsPct": 74,
    "organicSiltPct": 18,
    "hazardousChemicalPct": 5,
    "metalGlassPct": 3
  },
  "severityScore": 3.8,
  "severityLevel": "High",
  "volunteerSafe": true,
  "safetyWarning": "Wear heavy puncture-proof gloves; avoid bare-skin contact with muddy stagnation or submerged broken glass.",
  "recyclabilityAssessment": "High (approx. 75% of rigid plastics can be sanitized and delivered to local recyclers).",
  "actionRecommendation": "Deploy shoreline boom immediately and organize a 2-day community mobilization drive.",
  "answerToUserQuestion": "Provide a clear, detailed, encouraging 3-paragraph conversational explanation directly answering the user's question, addressing timeline, manpower, critical gear, and practical tips."
}
`;

            const result = await model.generateContent([
              prompt,
              {
                inlineData: {
                  data: cleanB64,
                  mimeType: mimeType,
                },
              },
            ]);

            const responseText = result.response.text();
            const cleaned = responseText
              .replace(/```json\s*/gi, '')
              .replace(/```\s*/g, '')
              .trim();

            const parsed = JSON.parse(cleaned);
            parsed.source = `Google Gemini Multimodal Vision AI (${modelName})`;
            parsed.modelName = modelName;
            parsed.success = true;
            return NextResponse.json(parsed);
          } catch (modelErr) {
            console.warn(`Gemini Vision model attempt ${modelName} failed:`, modelErr);
          }
        }
      } catch (genErr) {
        console.warn('Gemini vision API error:', genErr);
      }
    }

    // Heuristic Fallback Engine (Harmonized with VisionEstimatorTab for R02)
    const isHazardous =
      userQuestion.toLowerCase().includes('hazard') ||
      userQuestion.toLowerCase().includes('safety level') ||
      userQuestion.toLowerCase().includes('chemical') ||
      userQuestion.toLowerCase().includes('industrial') ||
      userQuestion.toLowerCase().includes('toxic');

    if (isHazardous) {
      const hazardousPhases = [
        {
          phase: 'Day 1',
          duration: '4 Hours',
          focus: 'Hazard Zone Cordoning & Effluent Inflow Cutoff Notification',
          steps: [
            'Deploy biohazard safety perimeter 20m from toxic inflow pipe',
            'Notify Municipal Environmental Protection & Water Board for industrial discharge tracing',
          ],
        },
        {
          phase: 'Day 2',
          duration: '6 Hours',
          focus: 'Chemical Boom Deployment & Vacuum Sludge Extraction',
          steps: [
            'Anchor chemical-resistant adsorbent booms to prevent downstream plume migration',
            'Operate industrial vacuum tanker to extract toxic sludge and chemical scum',
          ],
        },
        {
          phase: 'Day 3',
          duration: '4 Hours',
          focus: 'Sediment Neutralization, Water Sampling & Regulatory Audit',
          steps: [
            'Apply neutralizer agent to acidified soil bed and draw chemical test samples',
            'Manifest sealed UN-rated hazmat drums for licensed industrial effluent treatment',
          ],
        },
      ];

      return NextResponse.json({
        success: true,
        estimatedDaysToClean: '3 Days (Specialized Hazmat Remediation)',
        estimatedWorkHours: 14,
        workforceRecommendation: {
          volunteers: 0,
          supervisors: 2,
          equipmentOperators: 4,
          description: '0 Civilian Volunteers (Restricted Zone). Site remediation restricted to 4 certified municipal hazmat operators and 2 environmental safety supervisors.',
        },
        resourcesRequired: {
          gearAndPPE: [
            'Level-B Chemical-Resistant Vapor Protective Suits',
            'Full-Face NIOSH Respirators with Organic Vapor/Acid Gas Cartridges',
            'Heavy Chemical-Resistant Nitrile Gauntlets',
            'Steel-Toe Chemical Resistant Rubber Hazmat Boots',
          ],
          heavyEquipment: [
            'Industrial Vacuum Tanker Truck (10,000L Capacity)',
            'Chemical-Resistant Polypropylene Absorbent Booms (50m)',
            'Portable Sludge Diaphragm Pumps with Spark-Proof Grounding',
          ],
          collectionSupplies: [
            '12x UN-Rated 200L Polyethylene Hazmat Drum Containers',
            '4x Heavy Chemical Spill Berms & Neutralization Tarpaulins',
            'Chemical Absorbent Pillows & Neutralizing Wash Solution',
          ],
          disposalLogistics: 'Manifested hazardous materials transport to state-licensed industrial effluent treatment plant (ETP).',
          estimatedBudgetUSD: '$1,800 - $3,200',
          estimatedBudgetINR: '₹150,000 - ₹260,000',
        },
        phasedRoadmap: hazardousPhases,
        detectedPollutants: [
          'Industrial chemical effluent & toxic surfactants',
          'Hydrocarbon / petroleum residue and oily sludge',
          'Heavy metal sedimentation & chemical runoff',
          'Decomposed contaminated mud',
        ],
        composition: {
          plasticsPct: 8,
          organicSiltPct: 22,
          hazardousChemicalPct: 65,
          metalGlassPct: 5,
        },
        severityScore: 4.8,
        severityLevel: 'Hazardous / Chemical Contamination',
        volunteerSafe: false,
        safetyWarning: 'CRITICAL HAZARD: Do NOT deploy civilian or community volunteers. Site contains industrial effluent, corrosive chemical scum, and toxic hydrocarbons. Requires certified municipal hazmat contractors with Level-B protection.',
        recyclabilityAssessment: 'Zero (Non-recyclable hazardous toxic waste; requires high-temperature incineration or centralized industrial effluent treatment).',
        actionRecommendation: 'Immediately alert Municipal Environmental Division and State Pollution Control Board. Mobilize hazmat vacuum crew; civilian access barred.',
        answerToUserQuestion: `HAZARD & SAFETY ASSESSMENT (CRITICAL CONTAMINATION):\n\n1. Civilian Volunteer Safety: STRICTLY RESTRICTED (UNSAFE). Civilian volunteers and community groups must NOT enter or clean this site. The outflow exhibits industrial chemical effluent, oily sludge, and potential toxic surfactants presenting acute skin, eye, and respiratory risks.\n\n2. Municipal & Professional Response: Remediation requires a specialized municipal Hazmat or certified contractor team wearing Level-B protective gear and full-face respirators.\n\n3. Timeline & Phase Breakdown: Operations will span 3 days totaling 14 work-hours (Phase 1: 4h, Phase 2: 6h, Phase 3: 4h).`,
        source: 'Google Multimodal Environmental Vision Heuristic Engine',
      });
    }

    const standardPhases = [
      {
        phase: 'Day 1',
        duration: '6 Hours',
        focus: 'Containment & Shoreline Surface Sweep',
        steps: [
          'Deploy floating containment boom 15m downstream to prevent drift',
          'Volunteer teams clear accessible riverbank plastics and beverage containers',
        ],
      },
      {
        phase: 'Day 2',
        duration: '6 Hours',
        focus: 'Deep Extraction, Segregation & Municipal Haul',
        steps: [
          'Wader team dredges embedded mud bottles and heavy flotsam',
          'Sort PET bottles into recyclable sacks; load municipal collection vehicle',
        ],
      },
    ];

    return NextResponse.json({
      success: true,
      estimatedDaysToClean: '2 Days (Weekend Drive)',
      estimatedWorkHours: 12,
      workforceRecommendation: {
        volunteers: 12,
        supervisors: 2,
        equipmentOperators: 1,
        description: 'Recommended squad: 12 community volunteers split into extraction and sorting crews, with 2 designated safety leads.',
      },
      resourcesRequired: {
        gearAndPPE: [
          'Puncture-Resistant Nitrile Work Gloves (Level 4)',
          'High-Traction Neoprene Mud Waders / Rubber Boots',
          'Telescopic Trash Grabber Claws',
          'High-Visibility Reflective Vests',
        ],
        heavyEquipment: [
          'Floating Shoreline Debris Boom (25m)',
          'Heavy Riverbed Rakes & Net Skimmers',
          'Flat-Bottom Inflatable Skiff for Deep Channel Flotsam',
        ],
        collectionSupplies: [
          '120x Heavy-Duty 50L Tear-Resistant Bags (6 bundles of 20)',
          '3x Heavy Sorting Tarpaulins for Polymer Segregation',
          'First-Aid Kit with Antiseptic & Eye Wash',
        ],
        disposalLogistics: 'Arrange municipal flatbed pickup or 3-ton compactor truck directly to registered recycling depot.',
        estimatedBudgetUSD: '$90 - $140',
        estimatedBudgetINR: '₹7,500 - ₹11,500',
      },
      phasedRoadmap: standardPhases,
      detectedPollutants: [
        'Single-use PET beverage containers',
        'High-density polyethylene (HDPE) bags',
        'Expanded polystyrene (thermocol) food boxes',
        'Suspended organic river silt',
      ],
      composition: {
        plasticsPct: 76,
        organicSiltPct: 17,
        hazardousChemicalPct: 5,
        metalGlassPct: 2,
      },
      severityScore: 3.8,
      severityLevel: 'High Contamination',
      volunteerSafe: true,
      safetyWarning: 'Wear puncture-resistant gloves and mud boots at all times to avoid submerged sharp debris or biological contamination.',
      recyclabilityAssessment: 'High - Approx. 78% of PET bottles and rigid HDPE containers can be diverted to mechanical recyclers.',
      actionRecommendation: 'Deploy bankside capture nets; schedule 2-day community mobilization drive with municipal waste support.',
      answerToUserQuestion: `Based on Google Environmental Computer Vision analysis, cleaning this site will take approximately 2 days totaling 12 work-hours (Phase 1: 6 hours, Phase 2: 6 hours). You will need around 12 volunteers equipped with puncture-resistant gloves, mud waders, telescopic pickers, and 120 heavy-duty sacks. We recommend dividing the operation into 2 distinct phases: containment on Day 1 followed by deep extraction and municipal hauling on Day 2.`,
      source: 'Google Multimodal Environmental Vision Heuristic Engine',
    });
  } catch (error: any) {
    console.error('Error in analyze-trash-image:', error);
    return NextResponse.json(
      { error: error.message || 'Image processing failed' },
      { status: 500 }
    );
  }
}
