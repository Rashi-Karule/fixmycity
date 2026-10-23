import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/dbService';

export async function GET() {
  try {
    const escalations = await dbService.getEscalations();
    return NextResponse.json({ success: true, count: escalations.length, data: escalations });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch escalations';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { escalationId, followUpStatus, followUpNotes, actionedBy } = body;

    if (!escalationId || !followUpStatus) {
      return NextResponse.json(
        { success: false, error: 'escalationId and followUpStatus are required' },
        { status: 400 }
      );
    }

    const updated = await dbService.updateEscalationStatus(
      escalationId,
      followUpStatus,
      followUpNotes || '',
      actionedBy || 'PMC Administrator'
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update escalation';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
