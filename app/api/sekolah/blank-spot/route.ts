import { NextRequest, NextResponse } from 'next/server';
import { SekolahService } from '@/lib/services/sekolahService';

export async function GET(request: NextRequest) {
  try {
    const data = await SekolahService.getBlankSpots();
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
