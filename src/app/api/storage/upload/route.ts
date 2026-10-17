import { NextRequest, NextResponse } from 'next/server';
import { uploadToGoogleStorage, getGoogleStorageStatus } from '@/lib/googleStorage';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = getGoogleStorageStatus();
  return NextResponse.json({ success: true, storage: status });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let fileOrB64: string = '';
    let folder = 'evidence';
    let customFilename: string | undefined = undefined;

    if (contentType.includes('application/json')) {
      const body = await req.json();
      fileOrB64 = body.imageBase64 || body.image || '';
      folder = body.folder || 'evidence';
      customFilename = body.filename;
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');
      folder = (formData.get('folder') as string) || 'evidence';
      
      if (file && typeof file === 'object' && 'arrayBuffer' in file) {
        const buffer = await (file as Blob).arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const mimeType = (file as Blob).type || 'image/jpeg';
        fileOrB64 = `data:${mimeType};base64,${base64}`;
        customFilename = (file as File).name;
      }
    }

    if (!fileOrB64) {
      return NextResponse.json(
        { error: 'No image or file provided for Google Cloud Storage upload.' },
        { status: 400 }
      );
    }

    const uploadResult = await uploadToGoogleStorage(fileOrB64, folder, customFilename);

    return NextResponse.json({
      success: true,
      result: uploadResult,
    });
  } catch (err: any) {
    console.error('Error in /api/storage/upload:', err);
    return NextResponse.json(
      { error: err.message || 'Google Cloud Storage upload failed' },
      { status: 500 }
    );
  }
}
