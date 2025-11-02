import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/mongoose';
import Post from '@/models/Post';

export const runtime = 'node';

export async function POST(request: Request) {
  try {
    const secret = request.headers.get('x-admin-secret');
    if (!process.env.CLEANUP_SECRET || secret !== process.env.CLEANUP_SECRET) {
      return NextResponse.json({ ok: false, message: 'unauthorized' }, { status: 401 });
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    await dbConnect();

    const now = new Date();
    const expired = await Post.find({ isStory: true, expiresAt: { $lte: now } }).lean();

    let deletedCount = 0;
    for (const p of expired) {
      if (Array.isArray(p.media)) {
        for (const m of p.media) {
          try {
            if (m.publicId) {
              const resourceType = (m.mimeType || '').startsWith('video') ? 'video' : 'image';
              await cloudinary.uploader.destroy(m.publicId, { resource_type: resourceType });
            }
          } catch (err) {
            console.error('cloudinary delete error for', m.publicId, err);
          }
        }
      }

      try {
        await Post.deleteOne({ _id: p._id });
        deletedCount++;
      } catch (err) {
        console.error('failed to delete post doc', p._id, err);
      }
    }

    return NextResponse.json({ ok: true, deleted: deletedCount });
  } catch (err) {
    console.error('/api/maintenance/cleanup-stories error', err);
    return NextResponse.json({ ok: false, message: 'error' }, { status: 500 });
  }
}
