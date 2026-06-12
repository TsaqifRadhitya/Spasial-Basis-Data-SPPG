import { NextRequest, NextResponse } from 'next/server';
import { SekolahService } from '@/lib/services/sekolahService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const geojson = await SekolahService.getSchoolRouteGeoJSON(id);
    return NextResponse.json(geojson);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
