import { NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/mongoose';
import Post from '@/models/Post';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// helper to upload buffer to Cloudinary
function uploadToCloudinary(buffer: Buffer, filename: string, mimeType?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder: 'friendfinder/posts' },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export async function POST(request: Request) {
  try {
    // Check if Cloudinary is configured
    const hasCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
    
    if (hasCloudinary) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    }

    await dbConnect();

    const form = await request.formData();
    const type = form.get('type')?.toString() ?? 'post';
    const text = form.get('text')?.toString() ?? null;
    const authorId = form.get('authorId')?.toString() ?? null;
    const file = form.get('media') as any;

    const mediaDocs: any[] = [];

    // validation rules
    const ALLOWED_MIME = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/heic',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ]);
    const IMAGE_MAX = 10 * 1024 * 1024; // 10 MB
    const VIDEO_MAX = 50 * 1024 * 1024; // 50 MB

    if (file) {
      const mimeType = (file.type as string) || '';

      // If size is exposed by the runtime, check before reading ArrayBuffer
      const sizeProp = (file as any).size ?? null;

      // if mime is known and not in allowlist, reject
      if (mimeType && !ALLOWED_MIME.has(mimeType)) {
        return NextResponse.json({ ok: false, message: 'Unsupported media type' }, { status: 415 });
      }

      // If size is known, quick reject on large files
      if (sizeProp && typeof sizeProp === 'number') {
        if (mimeType.startsWith('image/') && sizeProp > IMAGE_MAX) {
          return NextResponse.json({ ok: false, message: 'Image too large (max 10 MB)' }, { status: 413 });
        }
        if (mimeType.startsWith('video/') && sizeProp > VIDEO_MAX) {
          return NextResponse.json({ ok: false, message: 'Video too large (max 50 MB)' }, { status: 413 });
        }
      }

      // If size not available, read the buffer and then check
      const buffer = Buffer.from(await file.arrayBuffer());
      const detectedSize = buffer.length;
      const filename = (file.name as string) || `upload-${Date.now()}`;
      const detectedMime = mimeType || (file.type as string) || '';

      if (detectedMime && !ALLOWED_MIME.has(detectedMime)) {
        return NextResponse.json({ ok: false, message: 'Unsupported media type' }, { status: 415 });
      }

      if (detectedMime.startsWith('image/') && detectedSize > IMAGE_MAX) {
        return NextResponse.json({ ok: false, message: 'Image too large (max 10 MB)' }, { status: 413 });
      }
      if (detectedMime.startsWith('video/') && detectedSize > VIDEO_MAX) {
        return NextResponse.json({ ok: false, message: 'Video too large (max 50 MB)' }, { status: 413 });
      }

      // Upload to Cloudinary if configured, otherwise store as base64 (demo mode)
      if (hasCloudinary) {
        const uploadResult: any = await uploadToCloudinary(buffer, filename, detectedMime || undefined);
        mediaDocs.push({ url: uploadResult.secure_url, filename: filename, size: detectedSize, mimeType: detectedMime, publicId: uploadResult.public_id });
      } else {
        // Demo mode: store as base64 data URL
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${detectedMime};base64,${base64}`;
        mediaDocs.push({ url: dataUrl, filename: filename, size: detectedSize, mimeType: detectedMime });
      }
    }

    const isStory = type === 'story';
    let expiresAt = null;
    if (isStory) {
      // default story lifetime 24h
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const post = await Post.create({
      author: authorId || undefined,
      text: text || undefined,
      media: mediaDocs,
      isStory,
      expiresAt,
    });

    return NextResponse.json({ ok: true, post });
  } catch (err) {
    console.error('/api/posts error:', err);
    return NextResponse.json({ ok: false, message: 'failed' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const storiesOnly = url.searchParams.get('stories');

    if (storiesOnly) {
      // return active stories (not expired), most recent first, populated author
      const now = new Date();
      const stories = await Post.find({ isStory: true, $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] })
        .sort({ createdAt: -1 })
        .limit(100)
        .populate('author', 'username name profilePicture')
        .lean();

      return NextResponse.json({ ok: true, results: stories });
    }

    // return most recent non-story posts with populated author info
    const posts = await Post.find({ isStory: false })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('author', 'username name profilePicture')
      .lean();

    return NextResponse.json({ ok: true, results: posts });
  } catch (err) {
    console.error('/api/posts GET error:', err);
    return NextResponse.json({ ok: false, results: [] }, { status: 500 });
  }
}
