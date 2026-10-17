import { NextRequest, NextResponse } from 'next/server';
import { fetchOverpassData } from '@/lib/overpass';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const radiusStr = searchParams.get('radius');

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: 'Latitude and Longitude query params are required.' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const radius = radiusStr ? parseFloat(radiusStr) : 5;

    const result = await fetchOverpassData(lat, lng, radius);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Error in /api/overpass:', err);
    return NextResponse.json(
      { error: err.message || 'Overpass query failed' },
      { status: 500 }
    );
  }
}
