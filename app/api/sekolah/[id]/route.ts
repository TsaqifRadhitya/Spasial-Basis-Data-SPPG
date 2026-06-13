import { NextRequest, NextResponse } from 'next/server';
import { SekolahService } from '@/lib/services/sekolahService';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await SekolahService.delete(id);
    return NextResponse.json({ success: true, message: 'Sekolah deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
