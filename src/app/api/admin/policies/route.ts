import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/dbService';
import { PriorityLevel } from '@/types';

export async function GET() {
  try {
    const policies = await dbService.getPriorityPolicies();
    return NextResponse.json({ success: true, data: policies });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch priority policies';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { priority_level, duration_hours } = body;

    if (!priority_level || typeof duration_hours !== 'number' || duration_hours <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid priority_level and positive duration_hours are required' },
        { status: 400 }
      );
    }

    const updated = await dbService.updatePriorityPolicy(priority_level as PriorityLevel, duration_hours);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update priority policy';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
