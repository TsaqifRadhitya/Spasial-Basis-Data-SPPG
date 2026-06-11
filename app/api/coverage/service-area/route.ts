import { NextRequest, NextResponse } from 'next/server';
import { CoverageService } from '@/lib/services/coverageService';

export async function GET(request: NextRequest) {
  try {
    const geojson = await CoverageService.getServiceAreaGeoJSON();
    return NextResponse.json(geojson);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
