import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Message from '@/models/Message';
import Notification from '@/models/Notification';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get user ID from session
    const userEmail = session.user.email;

    // Count unread messages
    const unreadMessages = await Message.countDocuments({
      recipientEmail: userEmail,
      read: false,
    });

    // Count unread notifications
    const unreadNotifications = await Notification.countDocuments({
      userId: userEmail,
      read: false,
    });

    return NextResponse.json({
      success: true,
      messages: unreadMessages,
      notifications: unreadNotifications,
    });
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread counts' },
      { status: 500 }
    );
  }
}
