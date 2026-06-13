import { NextResponse } from 'next/server';
import { CoverageService } from '@/lib/services/coverageService';

export async function GET() {
  try {
    const panjangJalan = await CoverageService.getPanjangJalan();
    const drivingDistances = await CoverageService.getDrivingDistances();

    return NextResponse.json({
      panjangJalan,
      drivingDistances,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
