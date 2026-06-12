import { NextRequest, NextResponse } from 'next/server';
import { SppgService } from '@/lib/services/sppgService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const geojson = await SppgService.getSppgRoutesGeoJSON(id);
    return NextResponse.json(geojson);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
