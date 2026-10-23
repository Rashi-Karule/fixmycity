import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file format (${file.type}). Only JPG, PNG, and WebP images are permitted.`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB uploaded).`,
        },
        { status: 400 }
      );
    }

    // In a live environment with Supabase Storage:
    // const { data, error } = await supabase.storage.from('complaints').upload(...);
    // For universal local prototype resilience, convert to a valid base64/data-url or simulated CDN URL:
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString('base64');
    const secureUrl = `data:${file.type};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      url: secureUrl,
      filename: file.name,
      sizeBytes: file.size,
      mimeType: file.type,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
