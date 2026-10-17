import { NextRequest, NextResponse } from 'next/server';
import { fetchWaterfrontWeather } from '@/lib/weather';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: 'Latitude and Longitude query params are required.' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    const weather = await fetchWaterfrontWeather(lat, lng);
    return NextResponse.json({ success: true, weather });
  } catch (err: any) {
    console.error('Error in /api/weather:', err);
    return NextResponse.json(
      { error: err.message || 'Weather lookup failed' },
      { status: 500 }
    );
  }
}
