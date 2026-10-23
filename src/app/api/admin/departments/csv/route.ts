import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/dbService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { csvContent } = body;

    if (!csvContent || typeof csvContent !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid csvContent string is required' },
        { status: 400 }
      );
    }

    const result = await dbService.importDepartmentOfficesCsv(csvContent);
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to import department offices CSV';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
