import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/dbService';
import { UpdatePrioritySchema } from '@/lib/validation/schemas';
import { UserRole } from '@/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const validation = UpdatePrioritySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', issues: validation.error.format() },
        { status: 400 }
      );
    }

    const user = {
      id: body.user_id || 'u2000000-0000-0000-0000-000000000002',
      name: body.user_name || 'Municipal Officer',
      role: (body.user_role as UserRole) || 'EMPLOYEE',
    };

    if (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only authorized employees or administrators can adjust priority' },
        { status: 403 }
      );
    }

    const updated = await dbService.updateComplaintPriority(
      id,
      validation.data.priority,
      {
        id: user.id,
        name: user.name,
        role: user.role as 'EMPLOYEE' | 'ADMIN',
      },
      validation.data.reason
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error updating priority';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
