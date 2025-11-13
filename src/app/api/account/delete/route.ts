import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Message from '@/models/Message';
import Post from '@/models/Post';
import Report from '@/models/Report';
import mongoose from 'mongoose';
import { signOut } from 'next-auth/react';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const userId = session.user.id;

    // Get confirmation from request body
    const body = await request.json();
    const { confirmation } = body;

    if (confirmation !== 'DELETE') {
      return NextResponse.json(
        { success: false, error: 'Invalid confirmation' },
        { status: 400 }
      );
    }

    // Convert to ObjectId for queries
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Find the user
    const user = await User.findById(userObjectId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Set soft delete flags
    const deletionDate = new Date();
    const scheduledDeletion = new Date(deletionDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    user.isDeleted = true;
    user.deletedAt = deletionDate;
    user.scheduledDeletionDate = scheduledDeletion;
    await user.save();

    // Invalidate all sessions for this user
    try {
      const conn = mongoose.connection;
      if (conn && conn.collection) {
        await conn.collection('sessions').deleteMany({ userId: userId.toString() });
      }
    } catch (err) {
      console.warn('Could not remove next-auth sessions from DB:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Account scheduled for deletion. You have 30 days to recover your account.',
      scheduledDeletionDate: scheduledDeletion.toISOString(),
      daysRemaining: 30,
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
