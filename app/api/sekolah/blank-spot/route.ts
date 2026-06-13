import { NextResponse } from 'next/server';
import { SekolahService } from '@/lib/services/sekolahService';

export async function GET() {
  try {
    const data = await SekolahService.getBlankSpots();
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
