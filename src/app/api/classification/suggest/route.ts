import { NextRequest, NextResponse } from 'next/server';
import { classifyIssue } from '@/features/classification/classifier';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, filename, mimeType } = body;

    const result = await classifyIssue(text || '', { filename, mimeType });
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Classification failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
