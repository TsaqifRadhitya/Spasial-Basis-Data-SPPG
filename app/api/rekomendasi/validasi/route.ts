import { NextRequest, NextResponse } from 'next/server';
import { RekomendasiService } from '@/lib/services/rekomendasiService';

export async function GET(request: NextRequest) {
  try {
    const data = await RekomendasiService.getValidasi();
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
