import { NextRequest, NextResponse } from 'next/server';
import { generateCleanupDrivePlan } from '@/lib/gemini';
import { HotspotCluster } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cluster: HotspotCluster = body.cluster;
    const userNotes: string = body.userNotes || '';

    if (!cluster || !cluster.id) {
      return NextResponse.json(
        { error: 'Valid hotspot cluster is required.' },
        { status: 400 }
      );
    }

    // 1. Try Python FastAPI backend first
    try {
      const pyResp = await fetch('http://127.0.0.1:8000/api/gemini-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clusterId: cluster.id,
          riverName: cluster.name,
          severity: cluster.totalSeverity / Math.max(1, cluster.incidents.length),
          center: cluster.center,
        }),
        signal: AbortSignal.timeout(2500),
      });
      if (pyResp.ok) {
        const pyData = await pyResp.json();
        const formattedPlan = {
          drive_title: pyData.title,
          tagline: pyData.tagline,
          target_zone: cluster.name,
          logistics: {
            meeting_point: pyData.assemblyPoint,
            recommended_time: pyData.schedule,
            expected_duration: '3 hours',
            waste_disposal_drop_off: pyData.depot,
          },
          safety_guidelines: [
            pyData.safetyBriefing || 'Wear puncture-resistant gloves and boots at all times.',
            'Maintain buddy system; keep emergency hydration ready.',
            'Segregate broken glass and biohazard debris into yellow bins.'
          ],
          tool_checklist: pyData.supplies || [
            'Heavy-duty puncture-proof gloves',
            'Biodegradable waste collection bags',
            'Trash tongs and claw pickers',
            'First aid kit'
          ],
          social_media_copy: {
            whatsapp: pyData.whatsappCopy,
            instagram: pyData.instagramCopy,
            x_twitter: pyData.twitterCopy,
          },
          simulated: false,
          source: pyData.source || 'Google Gemini Python Backend',
        };
        return NextResponse.json({ success: true, plan: formattedPlan });
      }
    } catch {}

    const plan = await generateCleanupDrivePlan(cluster, userNotes);
    return NextResponse.json({ success: true, plan });
  } catch (err: any) {
    console.error('Error in /api/gemini-drive:', err);
    return NextResponse.json(
      { error: err.message || 'Cleanup plan generation failed' },
      { status: 500 }
    );
  }
}
