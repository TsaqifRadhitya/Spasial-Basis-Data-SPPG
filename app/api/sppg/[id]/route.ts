import { NextRequest, NextResponse } from 'next/server';
import { SppgService } from '@/lib/services/sppgService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await params).id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const data = await SppgService.getSppgById(id);
    if (!data) {
      return NextResponse.json({ error: 'SPPG not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
