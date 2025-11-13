import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Message from '@/models/Message';
import Post from '@/models/Post';
import Report from '@/models/Report';
import mongoose from 'mongoose';

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

    // Delete user's messages
    await Message.deleteMany({
      $or: [{ sender: userObjectId }, { recipient: userObjectId }],
    });

    // Delete user's posts
    await Post.deleteMany({ userId: userObjectId });

    // Delete reports made by or about the user
    await Report.deleteMany({
      $or: [
        { reportedBy: userObjectId },
        { reportedUser: userObjectId },
      ],
    });

    // Remove user from friends lists
    await User.updateMany(
      { friends: userObjectId },
      { $pull: { friends: userObjectId } }
    );

    // Remove user from friend requests
    await User.updateMany(
      { 'friendRequests.from': userObjectId },
      { $pull: { friendRequests: { from: userObjectId } } }
    );

    // Remove NextAuth sessions and accounts for this user (if adapter used collections)
    try {
      const conn = mongoose.connection;
      if (conn && conn.collection) {
        await conn.collection('sessions').deleteMany({ userId: userId.toString() });
        await conn.collection('accounts').deleteMany({ userId: userId.toString() });
      }
    } catch (err) {
      console.warn('Could not remove next-auth sessions/accounts from DB:', err);
    }

    // Finally, delete the user account
    await User.findByIdAndDelete(userObjectId);

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
