import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db/dbService';

export async function GET() {
  try {
    const departments = await dbService.getDepartments();
    const offices = await dbService.getDepartmentOffices();
    const policies = await dbService.getPriorityPolicies();

    return NextResponse.json({
      success: true,
      departments,
      offices,
      policies,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch department directory';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
