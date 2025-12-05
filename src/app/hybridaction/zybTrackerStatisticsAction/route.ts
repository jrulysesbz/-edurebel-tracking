// src/app/hybridaction/zybTrackerStatisticsAction/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // Pretend everything is fine so the tracker stops complaining
  return NextResponse.json({ ok: true }, { status: 200 });
} 
