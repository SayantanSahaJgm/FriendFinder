import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

export async function POST(request: NextRequest) {
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

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if account is marked for deletion
    if (!user.isDeleted) {
      return NextResponse.json(
        { success: false, error: 'Account is not scheduled for deletion' },
        { status: 400 }
      );
    }

    // Check if deletion date has passed
    if (user.scheduledDeletionDate && new Date() > user.scheduledDeletionDate) {
      return NextResponse.json(
        { success: false, error: 'Account deletion period has expired. Your data has been permanently removed.' },
        { status: 410 }
      );
    }

    // Restore the account
    user.isDeleted = false;
    user.deletedAt = undefined;
    user.scheduledDeletionDate = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Account successfully restored!',
    });
  } catch (error) {
    console.error('Error restoring account:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to restore account' },
      { status: 500 }
    );
  }
}
