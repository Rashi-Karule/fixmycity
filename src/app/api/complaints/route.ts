import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/dbService';
import { CreateComplaintSchema } from '@/lib/validation/schemas';
import { routeComplaint } from '@/features/routing/router';
import { findDuplicateCandidates } from '@/features/duplicate-detection/duplicateDetector';
import { CivicCategory, ComplaintStatus } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId') || undefined;
    const category = (searchParams.get('category') as CivicCategory) || undefined;
    const status = (searchParams.get('status') as ComplaintStatus) || undefined;
    const citizenId = searchParams.get('citizenId') || undefined;

    const complaints = await dbService.getComplaints({
      departmentId,
      category,
      status,
      citizenId,
    });

    return NextResponse.json({ success: true, count: complaints.length, data: complaints });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch complaints';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = CreateComplaintSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          issues: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const data = validation.data;
    const departments = await dbService.getDepartments();
    const offices = await dbService.getDepartmentOffices();
    const existingComplaints = await dbService.getComplaints();

    // Run duplicate check
    const duplicates = findDuplicateCandidates(
      {
        latitude: data.latitude,
        longitude: data.longitude,
        category: data.category,
        title: data.title,
        description: data.description,
      },
      existingComplaints
    );

    // If checkOnly parameter is passed, just return duplicates without creating
    const isCheckOnly = body.check_duplicate_only === true;
    if (isCheckOnly) {
      return NextResponse.json({
        success: true,
        duplicatesFound: duplicates.length > 0,
        duplicates,
      });
    }

    // Run Smart Department Routing with Jurisdiction-awareness
    const routingDecision = routeComplaint(
      data.category,
      data.department_id,
      data.latitude,
      data.longitude,
      departments,
      offices,
      {
        state: data.state,
        district: data.district,
        localBodyName: data.local_body_name,
        preferVerified: true,
      }
    );

    const createdComplaint = await dbService.createComplaint({
      title: data.title,
      description: data.description,
      category: data.category,
      suggested_category: data.suggested_category,
      classification_confidence: data.classification_confidence,
      department_id: routingDecision.selectedDepartmentId,
      department_name: routingDecision.selectedDepartmentName,
      department_office_id: routingDecision.selectedOfficeId || undefined,
      department_office_name: routingDecision.selectedOfficeName || undefined,
      citizen_id: body.citizen_id || 'u1000000-0000-0000-0000-000000000001',
      citizen_name: body.citizen_name || 'Aarav Sharma',
      citizen_phone: body.citizen_phone || '+91 98765 43210',
      latitude: data.latitude,
      longitude: data.longitude,
      landmark: data.landmark,
      address: data.address,
      state: data.state,
      district: data.district,
      jurisdiction_type: data.jurisdiction_type,
      local_body_name: data.local_body_name,
      lgd_code: data.lgd_code,
      ward_or_village: data.ward_or_village,
      priority: data.priority,
      image_urls: data.image_urls,
    });

    if (routingDecision.flaggedForAdminReview) {
      createdComplaint.status = 'UNDER_ADMIN_REVIEW';
    }

    return NextResponse.json(
      {
        success: true,
        data: createdComplaint,
        routing: routingDecision,
        duplicatesFound: duplicates.length > 0,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error creating complaint';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
