import { NextRequest, NextResponse } from 'next/server';
import { JalanService } from '@/lib/services/jalanService';

export async function GET(request: NextRequest) {
  try {
    const geojson = await JalanService.getJalanGeoJSON();
    return NextResponse.json(geojson);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
