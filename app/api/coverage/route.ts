import { NextRequest, NextResponse } from 'next/server';
import { CoverageService } from '@/lib/services/coverageService';

export async function GET(request: NextRequest) {
  try {
    const panjangJalan = await CoverageService.getPanjangJalan();
    const drivingDistances = await CoverageService.getDrivingDistances();

    return NextResponse.json({
      panjangJalan,
      drivingDistances,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
