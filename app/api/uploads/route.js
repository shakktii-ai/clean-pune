import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

// Allowed MIME types and max sizes
const ALLOWED_MIME_TYPES = {
  'image/jpeg': { type: 'image', ext: 'jpg', maxSize: 5 * 1024 * 1024 }, // 5 MB
  'image/png': { type: 'image', ext: 'png', maxSize: 5 * 1024 * 1024 },
  'image/webp': { type: 'image', ext: 'webp', maxSize: 5 * 1024 * 1024 },
  'video/mp4': { type: 'video', ext: 'mp4', maxSize: 25 * 1024 * 1024 }, // 25 MB
  'video/quicktime': { type: 'video', ext: 'mov', maxSize: 25 * 1024 * 1024 },
  'video/webm': { type: 'video', ext: 'webm', maxSize: 25 * 1024 * 1024 },
};

const MAX_TOTAL_FILES = 5; // Max 4 photos + 1 video

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`upload_${ip}`, 20, 60000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many upload requests. Please wait a minute.' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided for upload.' }, { status: 400 });
    }

    if (files.length > MAX_TOTAL_FILES) {
      return NextResponse.json(
        { error: `Too many files. Maximum ${MAX_TOTAL_FILES} files allowed per complaint.` },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const uploadedResults = [];
    let videoCount = 0;
    let imageCount = 0;

    for (const file of files) {
      if (typeof file === 'string' || !file.name) {
        continue;
      }

      const mimeType = file.type || '';
      const config = ALLOWED_MIME_TYPES[mimeType];

      if (!config) {
        return NextResponse.json(
          {
            error: `Unsupported file type "${mimeType}". Only JPG, PNG, WebP images and MP4, WebM, MOV videos are accepted.`,
          },
          { status: 400 }
        );
      }

      if (file.size > config.maxSize) {
        const mbLimit = Math.round(config.maxSize / (1024 * 1024));
        return NextResponse.json(
          {
            error: `File "${file.name}" exceeds the ${mbLimit}MB limit for ${config.type}s.`,
          },
          { status: 400 }
        );
      }

      if (config.type === 'video') {
        videoCount += 1;
        if (videoCount > 1) {
          return NextResponse.json(
            { error: 'Only 1 video evidence clip can be attached per complaint.' },
            { status: 400 }
          );
        }
      } else {
        imageCount += 1;
        if (imageCount > 4) {
          return NextResponse.json(
            { error: 'Maximum 4 photograph evidence files can be attached.' },
            { status: 400 }
          );
        }
      }

      // Generate safe unguessable random filename
      const randomId = crypto.randomBytes(12).toString('hex');
      const safeFilename = `evidence_${Date.now()}_${randomId}.${config.ext}`;
      const filePath = path.join(uploadDir, safeFilename);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await writeFile(filePath, buffer);

      uploadedResults.push({
        url: `/uploads/${safeFilename}`,
        fileType: config.type,
        mimeType: mimeType,
        sizeBytes: file.size,
        originalName: path.basename(file.name).replace(/[^a-zA-Z0-9.-]/g, '_'),
        uploadedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedResults,
      count: uploadedResults.length,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process file upload. Please check format and size.' },
      { status: 500 }
    );
  }
}
