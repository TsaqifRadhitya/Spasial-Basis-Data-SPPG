import { NextRequest, NextResponse } from 'next/server';
import { SekolahService } from '@/lib/services/sekolahService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kelurahan = searchParams.get('kelurahan') || undefined;
    const format = searchParams.get('format');

    if (format === 'geojson') {
      const geojson = await SekolahService.getAsGeoJSON(kelurahan);
      return NextResponse.json(geojson);
    }

    const data = await SekolahService.getAll(kelurahan);
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama_sekolah, jenjang, alamat, nama_kelurahan, longitude, latitude } = body;

    if (!nama_sekolah || !jenjang || !alamat || !nama_kelurahan || longitude === undefined || latitude === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const data = await SekolahService.create({
      nama_sekolah,
      jenjang,
      alamat,
      nama_kelurahan,
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude),
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
