import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/dbService';
import { AddCommentSchema } from '@/lib/validation/schemas';
import { UserRole } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comments = await dbService.getComments(id);
    return NextResponse.json({ success: true, count: comments.length, data: comments });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error fetching comments';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const validation = AddCommentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', issues: validation.error.format() },
        { status: 400 }
      );
    }

    const user = {
      id: body.user_id || 'u1000000-0000-0000-0000-000000000001',
      name: body.user_name || 'Citizen User',
      role: (body.user_role as UserRole) || 'CITIZEN',
    };

    const newComment = await dbService.addComment(id, user, validation.data.comment_text);
    return NextResponse.json({ success: true, data: newComment }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error adding comment';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
