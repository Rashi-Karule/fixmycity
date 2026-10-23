import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/dbService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const complaint =
      (await dbService.getComplaintByTrackingId(id)) ||
      (await dbService.getComplaintById(id));

    if (!complaint) {
      return NextResponse.json(
        { success: false, error: 'Complaint not found with provided ID or tracking reference' },
        { status: 404 }
      );
    }

    const history = await dbService.getStatusHistory(complaint.id);
    const comments = await dbService.getComments(complaint.id);

    return NextResponse.json({
      success: true,
      data: {
        ...complaint,
        history,
        comments,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error fetching complaint';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
