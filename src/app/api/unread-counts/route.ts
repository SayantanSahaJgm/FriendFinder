import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Message from '@/models/Message';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get user from database to get their _id
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Count unread messages using the static method
    const unreadMessages = await Message.getUnreadCount(user._id.toString());

    // For notifications, we'll count friend requests (a simple proxy for now)
    // In the future, create a proper Notification model
    const friendRequests = user.friendRequests?.length || 0;

    return NextResponse.json({
      success: true,
      messages: unreadMessages,
      notifications: friendRequests, // Using friend requests as proxy for notifications
    });
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread counts' },
      { status: 500 }
    );
  }
}
