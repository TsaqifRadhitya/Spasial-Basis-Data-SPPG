import { NextResponse } from 'next/server';
import { KelurahanService } from '@/lib/services/kelurahanService';

export async function GET() {
  try {
    const geojson = await KelurahanService.getAsGeoJSON();
    return NextResponse.json(geojson);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
