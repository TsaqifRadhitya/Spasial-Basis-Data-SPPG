import { NextResponse } from 'next/server';
import { KelurahanService } from '@/lib/services/kelurahanService';

export async function GET() {
  try {
    const data = await KelurahanService.getKelurahanSummary();
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
