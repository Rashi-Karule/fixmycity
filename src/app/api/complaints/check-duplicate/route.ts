import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/dbService';
import { findDuplicateCandidates } from '@/features/duplicate-detection/duplicateDetector';
import { CivicCategory } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { latitude, longitude, category, title, description, radiusMeters } = body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number' || !category) {
      return NextResponse.json(
        { success: false, error: 'Latitude, longitude, and category are required' },
        { status: 400 }
      );
    }

    const complaints = await dbService.getComplaints();
    const candidates = findDuplicateCandidates(
      {
        latitude,
        longitude,
        category: category as CivicCategory,
        title: title || '',
        description: description || '',
      },
      complaints,
      { radiusMeters: radiusMeters || 150 }
    );

    return NextResponse.json({
      success: true,
      count: candidates.length,
      candidates,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error checking duplicates';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
