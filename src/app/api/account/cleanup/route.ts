import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Message from '@/models/Message';
import Post from '@/models/Post';
import Report from '@/models/Report';
import mongoose from 'mongoose';

// This endpoint permanently deletes accounts that have exceeded their 30-day grace period
// Should be called by a cron job or manually by an admin
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check for admin or cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Find all users scheduled for deletion whose date has passed
    const now = new Date();
    const usersToDelete = await User.find({
      isDeleted: true,
      scheduledDeletionDate: { $lt: now },
    });

    if (usersToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No accounts to permanently delete',
        deletedCount: 0,
      });
    }

    const deletedUserIds: string[] = [];
    const errors: string[] = [];

    // Permanently delete each user and their data
    for (const user of usersToDelete) {
      try {
        const userObjectId = new mongoose.Types.ObjectId(user._id);

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

        // Remove NextAuth sessions and accounts
        try {
          const conn = mongoose.connection;
          if (conn && conn.collection) {
            await conn.collection('sessions').deleteMany({ userId: user._id.toString() });
            await conn.collection('accounts').deleteMany({ userId: user._id.toString() });
          }
        } catch (err) {
          console.warn(`Could not remove next-auth data for user ${user._id}:`, err);
        }

        // Finally, delete the user account
        await User.findByIdAndDelete(userObjectId);

        deletedUserIds.push(user._id.toString());
        console.log(`Permanently deleted user: ${user._id} (${user.email})`);
      } catch (error) {
        const errorMsg = `Failed to delete user ${user._id}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Permanently deleted ${deletedUserIds.length} accounts`,
      deletedCount: deletedUserIds.length,
      deletedUserIds,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in cleanup job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to run cleanup job' },
      { status: 500 }
    );
  }
}
