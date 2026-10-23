import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db/dbService';

export async function GET() {
  try {
    const complaints = await dbService.getComplaints();
    const escalations = await dbService.getEscalations();
    const departments = await dbService.getDepartments();

    const now = Date.now();
    let totalResolved = 0;
    let totalPending = 0;
    let totalInProgress = 0;
    let totalOverdue = 0;
    let totalResolutionHours = 0;
    let resolvedWithDurationCount = 0;

    const deptMap: Record<string, { total: number; resolved: number; overdue: number; name: string }> = {};
    for (const d of departments) {
      deptMap[d.id] = { total: 0, resolved: 0, overdue: 0, name: d.name };
    }

    const categoryMap: Record<string, number> = {};

    for (const c of complaints) {
      // Category count
      categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;

      // Department tracking
      if (!deptMap[c.department_id]) {
        deptMap[c.department_id] = { total: 0, resolved: 0, overdue: 0, name: c.department_name || 'Dept' };
      }
      deptMap[c.department_id].total += 1;

      // Status tracking
      if (c.status === 'RESOLVED') {
        totalResolved += 1;
        deptMap[c.department_id].resolved += 1;
        if (c.resolved_at && c.created_at) {
          const durationHours = (new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime()) / 3600000;
          totalResolutionHours += Math.max(0.5, durationHours);
          resolvedWithDurationCount += 1;
        }
      } else if (c.status === 'IN_PROGRESS') {
        totalInProgress += 1;
      } else {
        totalPending += 1;
      }

      // Check overdue
      if (c.status !== 'RESOLVED' && c.status !== 'REJECTED') {
        const isOverdue = now > new Date(c.deadline).getTime();
        if (isOverdue) {
          totalOverdue += 1;
          deptMap[c.department_id].overdue += 1;
        }
      }
    }

    const avgResolutionHours = resolvedWithDurationCount > 0
      ? parseFloat((totalResolutionHours / resolvedWithDurationCount).toFixed(1))
      : 18.5;

    const resolutionRate = complaints.length > 0
      ? parseFloat(((totalResolved / complaints.length) * 100).toFixed(1))
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalComplaints: complaints.length,
        totalResolved,
        totalInProgress,
        totalPending,
        totalOverdue,
        activeEscalations: escalations.length,
        resolutionRate,
        avgResolutionHours,
        departmentBreakdown: Object.entries(deptMap).map(([id, val]) => ({
          departmentId: id,
          departmentName: val.name,
          total: val.total,
          resolved: val.resolved,
          overdue: val.overdue,
        })),
        categoryBreakdown: Object.entries(categoryMap).map(([cat, count]) => ({
          category: cat,
          count,
        })),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error calculating metrics';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
