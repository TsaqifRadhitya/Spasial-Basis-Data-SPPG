import { NextRequest, NextResponse } from 'next/server';
import { SppgService } from '@/lib/services/sppgService';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const geojson = await SppgService.getSppgRoutesGeoJSON(id);
    return NextResponse.json(geojson);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
