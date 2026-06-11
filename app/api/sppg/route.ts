import { NextRequest, NextResponse } from 'next/server';
import { SppgService } from '@/lib/services/sppgService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    if (format === 'geojson') {
      const geojson = await SppgService.getAsGeoJSON();
      return NextResponse.json(geojson);
    }

    const data = await SppgService.getAllSppg();
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama_sppg, alamat, longitude, latitude } = body;

    if (!nama_sppg || !alamat || longitude === undefined || latitude === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const data = await SppgService.createSppg({
      nama_sppg,
      alamat,
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude),
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
