import { NextRequest, NextResponse } from 'next/server';
import { RekomendasiService } from '@/lib/services/rekomendasiService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    if (format === 'geojson') {
      const geojson = await RekomendasiService.getAsGeoJSON();
      return NextResponse.json(geojson);
    }

    const data = await RekomendasiService.getRekomendasi();
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
