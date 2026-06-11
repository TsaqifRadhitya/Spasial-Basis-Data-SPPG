import { NextRequest, NextResponse } from 'next/server';
import { RekomendasiService } from '@/lib/services/rekomendasiService';

export async function POST(request: NextRequest) {
  try {
    const geojson = await RekomendasiService.generateRekomendasi();
    return NextResponse.json(geojson);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
