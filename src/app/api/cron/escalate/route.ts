import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/dbService';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const cronSecretHeader = req.headers.get('x-cron-secret') || '';
    const configuredSecret = process.env.CRON_SECRET || 'prototype-cron-secret-2026';

    const isAuthorized =
      authHeader === `Bearer ${configuredSecret}` ||
      cronSecretHeader === configuredSecret ||
      process.env.NODE_ENV !== 'production'; // Allow local dev testing

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid cron job authorization token' },
        { status: 401 }
      );
    }

    const result = await dbService.runEscalationScan();
    const allEscalations = await dbService.getEscalations();

    return NextResponse.json({
      success: true,
      message: `Escalation scan completed. ${result.newEscalations.length} new complaint(s) escalated to Senior Administration.`,
      newlyEscalatedCount: result.newEscalations.length,
      newEscalations: result.newEscalations,
      totalActiveEscalations: allEscalations.length,
      executedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Escalation job execution failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// Support GET for safe browser/manual testing in local prototype mode
export async function GET(req: NextRequest) {
  return POST(req);
}
