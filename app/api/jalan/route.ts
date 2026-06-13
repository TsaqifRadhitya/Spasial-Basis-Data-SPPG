import { NextResponse } from 'next/server';
import { JalanService } from '@/lib/services/jalanService';

export async function GET() {
  try {
    const geojson = await JalanService.getJalanGeoJSON();
    return NextResponse.json(geojson);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
