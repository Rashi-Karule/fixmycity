import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/dbService';

export async function GET() {
  try {
    // Return all employee and admin profiles
    const staff = db.profiles.filter((p) => p.role === 'EMPLOYEE' || p.role === 'ADMIN');
    return NextResponse.json({ success: true, count: staff.length, data: staff });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch municipal staff';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
