import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

/**
 * POST /api/bluetooth/disconnect
 * Disconnect Bluetooth - disable Bluetooth and clear nearby users
 */
export async function POST(req: NextRequest) {
  try {
    // Verify JWT token via session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Connect to database
    await dbConnect();

    // Update user: disable Bluetooth and clear nearby users
    const user = await User.findByIdAndUpdate(
      userId,
      {
        bluetoothEnabled: false,
        nearbyUsers: [],
        lastSeen: new Date(),
      },
      { new: true, select: '-password' }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Emit Socket.IO event
    try {
      const io = (global as any).socketIO;
      if (io) {
        io.to(`user-${userId}`).emit('bluetoothDisconnected', {
          userId,
          timestamp: new Date().toISOString(),
          message: 'Bluetooth disconnected successfully',
        });
      }
    } catch (socketError) {
      console.error('Socket.IO emit error:', socketError);
      // Don't fail the API call if socket event fails
    }

    return NextResponse.json({
      success: true,
      message: 'Bluetooth disconnected successfully',
      user: {
        id: user._id,
        username: user.username,
        bluetoothEnabled: user.bluetoothEnabled,
        nearbyUsers: user.nearbyUsers,
      },
    });

  } catch (error) {
    console.error('Bluetooth disconnect API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
