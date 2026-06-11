import { NextRequest, NextResponse } from 'next/server';
import { KelurahanService } from '@/lib/services/kelurahanService';

export async function GET(request: NextRequest) {
  try {
    const geojson = await KelurahanService.getAsGeoJSON();
    return NextResponse.json(geojson);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
