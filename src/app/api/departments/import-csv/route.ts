import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/dbService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const csvContent = body.csv_content;

    if (!csvContent || typeof csvContent !== 'string') {
      return NextResponse.json(
        { success: false, error: 'CSV text content is required' },
        { status: 400 }
      );
    }

    const result = await dbService.importDepartmentOfficesCsv(csvContent);
    return NextResponse.json({
      success: true,
      addedCount: result.addedCount,
      errors: result.errors,
      message: `Successfully imported ${result.addedCount} municipal offices.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'CSV import failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
