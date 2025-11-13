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

    // PERMANENT DELETION - Remove all user data from MongoDB
    console.log(`Permanently deleting user: ${userId}`);

    // 1. Delete all messages sent by this user
    await Message.deleteMany({ senderId: userObjectId });

    // 2. Delete all messages received by this user
    await Message.deleteMany({ receiverId: userObjectId });

    // 3. Delete all posts created by this user
    await Post.deleteMany({ userId: userObjectId });

    // 4. Remove likes from this user on other posts
    await Post.updateMany(
      { likes: userObjectId },
      { $pull: { likes: userObjectId } }
    );

    // 5. Delete comments by this user
    await Post.updateMany(
      { 'comments.userId': userObjectId },
      { $pull: { comments: { userId: userObjectId } } }
    );

    // 6. Delete all reports by this user
    await Report.deleteMany({ reporterId: userObjectId });

    // 7. Delete all reports about this user
    await Report.deleteMany({ reportedUserId: userObjectId });

    // 8. Remove this user from all friend lists
    await User.updateMany(
      { friends: userObjectId },
      { $pull: { friends: userObjectId } }
    );

    // 9. Remove this user from all friend requests
    await User.updateMany(
      { friendRequests: userObjectId },
      { $pull: { friendRequests: userObjectId } }
    );

    // 10. Remove this user from all sent requests
    await User.updateMany(
      { sentRequests: userObjectId },
      { $pull: { sentRequests: userObjectId } }
    );

    // 11. Delete the user account permanently
    await User.findByIdAndDelete(userObjectId);

    // 12. Invalidate all sessions for this user
    try {
      const conn = mongoose.connection;
      if (conn && conn.collection) {
        await conn.collection('sessions').deleteMany({ userId: userId.toString() });
      }
    } catch (err) {
      console.warn('Could not remove next-auth sessions from DB:', err);
    }

    console.log(`Successfully deleted user ${userId} and all associated data`);

    return NextResponse.json({
      success: true,
      message: 'Account and all associated data have been permanently deleted.',
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
