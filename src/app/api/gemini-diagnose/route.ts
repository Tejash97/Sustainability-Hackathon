import { NextRequest, NextResponse } from 'next/server';
import { diagnoseIncident } from '@/lib/gemini';
import { Incident } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const incident: Incident = body.incident;

    if (!incident || !incident.title) {
      return NextResponse.json(
        { error: 'Valid incident object is required.' },
        { status: 400 }
      );
    }

    // 1. Try Python FastAPI backend first
    try {
      const pyResp = await fetch('http://127.0.0.1:8000/api/gemini-diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clusterId: incident.id,
          riverName: incident.title,
          severity: incident.severity,
          incidentCount: 1,
          location: { lat: incident.lat, lng: incident.lng },
        }),
        signal: AbortSignal.timeout(2500),
      });
      if (pyResp.ok) {
        const pyData = await pyResp.json();
        const formatted = {
          incident_id: incident.id,
          primary_cause: pyData.primaryCause,
          ecological_risk: pyData.ecologicalRisk,
          remediation_tier: pyData.remediationTier || 'Community-Friendly',
          safety_precautions: pyData.precautions || [],
          simulated: false,
          source: pyData.source || 'Google Gemini Python Backend',
        };
        return NextResponse.json({ success: true, diagnosis: formatted });
      }
    } catch {}

    const diagnosis = await diagnoseIncident(incident);
    return NextResponse.json({ success: true, diagnosis });
  } catch (err: any) {
    console.error('Error in /api/gemini-diagnose:', err);
    return NextResponse.json(
      { error: err.message || 'Diagnosis generation failed' },
      { status: 500 }
    );
  }
}
