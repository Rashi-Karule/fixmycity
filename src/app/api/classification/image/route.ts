import { NextRequest, NextResponse } from 'next/server';
import { analyzeCivicImage } from '@/features/classification/imageAnalyzer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType, filename, userHint } = body;

    if (!imageBase64 && !filename) {
      return NextResponse.json(
        { success: false, error: 'Photo evidence (image data or file name) is required for analysis.' },
        { status: 400 }
      );
    }

    // Validate mime type if provided
    if (mimeType && !['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(mimeType.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Invalid file format. Please upload JPG, PNG, or WebP photographs.' },
        { status: 400 }
      );
    }

    // Size limit check (approx 5MB base64)
    if (imageBase64 && imageBase64.length > 7 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Image size exceeds maximum limit of 5MB.' },
        { status: 400 }
      );
    }

    const result = await analyzeCivicImage({
      imageBase64,
      mimeType,
      filename,
      userHint,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Image analysis failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
