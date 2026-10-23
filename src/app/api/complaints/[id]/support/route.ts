import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/dbService';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const userId = body.user_id || 'u1000000-0000-0000-0000-000000000001';

    const result = await dbService.toggleSupport(id, userId);
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error toggling support';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
