import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/dbService';
import { UpdateStatusSchema } from '@/lib/validation/schemas';
import { UserRole } from '@/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const validation = UpdateStatusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', issues: validation.error.format() },
        { status: 400 }
      );
    }

    const { status, notes, resolution_image_url } = validation.data;

    // Requirement: When marking RESOLVED, must require meaningful resolution notes or photo evidence
    if (status === 'RESOLVED') {
      if (!notes || notes.trim().length < 5) {
        return NextResponse.json(
          {
            success: false,
            error: 'Detailed resolution notes (minimum 5 characters) are required before marking an issue resolved.',
          },
          { status: 400 }
        );
      }
    }

    const user = {
      id: body.user_id || 'u2000000-0000-0000-0000-000000000002',
      name: body.user_name || 'Er. Sunita Kulkarni (PWD Officer)',
      role: (body.user_role as UserRole) || 'EMPLOYEE',
      department_id: body.department_id || 'd1000000-0000-0000-0000-000000000001',
    };

    // Verify complaint exists
    const complaint = await dbService.getComplaintById(id);
    if (!complaint) {
      return NextResponse.json({ success: false, error: 'Complaint not found' }, { status: 404 });
    }

    // Role-based authorization: Employees can only update complaints within their department!
    if (user.role === 'EMPLOYEE' && user.department_id !== complaint.department_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access Denied: You are only authorized to update complaints assigned to your specific municipal department.',
        },
        { status: 403 }
      );
    }

    const updated = await dbService.updateComplaintStatus(
      complaint.id,
      status,
      user,
      notes,
      resolution_image_url
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error updating complaint status';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
