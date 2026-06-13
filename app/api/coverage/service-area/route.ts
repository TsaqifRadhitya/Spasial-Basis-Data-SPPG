import { NextResponse } from 'next/server';
import { CoverageService } from '@/lib/services/coverageService';

export async function GET() {
  try {
    const geojson = await CoverageService.getServiceAreaGeoJSON();
    return NextResponse.json(geojson);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
