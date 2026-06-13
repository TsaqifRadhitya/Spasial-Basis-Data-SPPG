import { NextResponse } from 'next/server';
import { RekomendasiService } from '@/lib/services/rekomendasiService';

export async function POST() {
  try {
    const geojson = await RekomendasiService.generateRekomendasi();
    return NextResponse.json(geojson);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
