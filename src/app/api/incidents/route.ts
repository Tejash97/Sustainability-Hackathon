import { NextRequest, NextResponse } from 'next/server';
import { searchDynamicPollutedSpots } from '@/lib/dynamicPollutionEngine';
import { INITIAL_LAT, INITIAL_LNG, INITIAL_CITY } from '@/data/seedIncidents';
import { Incident } from '@/types';

export const dynamic = 'force-dynamic';

// Storage for custom user-submitted reports
let customReports: Incident[] = [];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const city = searchParams.get('city') || INITIAL_CITY;
    const waterwaysParam = searchParams.get('waterways') || '';
    const detectedWaterways = waterwaysParam ? waterwaysParam.split(',').map((w) => w.trim()).filter(Boolean) : [];

    const lat = latStr ? parseFloat(latStr) : INITIAL_LAT;
    const lng = lngStr ? parseFloat(lngStr) : INITIAL_LNG;

    const radiusStr = searchParams.get('radius');
    const radiusKm = radiusStr ? parseFloat(radiusStr) : 5;
    const maxDist = Math.max(radiusKm * 1.15, radiusKm + 0.5);

    // Dynamically search real environmental news & geospatial waterbodies for ANY location worldwide
    const baseIncidents = await searchDynamicPollutedSpots(lat, lng, city, detectedWaterways);

    const calcHaversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // Combine any user-submitted citizen reports near this coordinate within radius
    const relevantCustom = customReports.filter((rep) => {
      return calcHaversine(lat, lng, rep.lat, rep.lng) <= maxDist;
    });

    const relevantBase = baseIncidents.filter((rep) => {
      return calcHaversine(lat, lng, rep.lat, rep.lng) <= maxDist;
    });

    const allIncidents = [...relevantCustom, ...relevantBase];

    return NextResponse.json({
      success: true,
      incidents: allIncidents,
      total: allIncidents.length,
      city,
      center: { lat, lng },
      radiusKm,
    });
  } catch (err: any) {
    console.error('Error in GET /api/incidents:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch dynamic incidents' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.title || !body.category || !body.lat || !body.lng) {
      return NextResponse.json(
        { error: 'Missing required incident fields: title, category, lat, lng' },
        { status: 400 }
      );
    }

    const newIncident: Incident = {
      id: `inc-user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: body.title,
      category: body.category,
      severity: Number(body.severity) || 3,
      description: body.description || '',
      lat: Number(body.lat),
      lng: Number(body.lng),
      reportedAt: new Date().toISOString(),
      reporterName: body.reporterName || 'Citizen Eco Guardian',
      waterbodyName: body.waterbodyName || 'Local Waterway',
      photoUrl: body.photoUrl,
      status: 'Unresolved',
      cleanTimeHours: 2.0,
      volunteersNeeded: 10,
      gearNeeded: ['Gloves', 'Pickers', 'Collection bags'],
      howToClean: 'Volunteer bank sweep. Pick solid waste into bags and notify municipal truck.',
    };

    customReports.unshift(newIncident);

    return NextResponse.json(
      {
        success: true,
        incident: newIncident,
        total: customReports.length,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error in POST /api/incidents:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to submit incident report' },
      { status: 500 }
    );
  }
}
