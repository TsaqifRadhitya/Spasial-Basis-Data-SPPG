import { NextRequest, NextResponse } from 'next/server';
import { KelurahanService } from '@/lib/services/kelurahanService';

export async function GET(request: NextRequest) {
  try {
    const data = await KelurahanService.getKelurahanSummary();
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
