import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

/**
 * POST /api/bluetooth/heartbeat
 * Update Bluetooth presence timestamp to keep user visible in discovery
 * Should be called every 30-60 seconds while Bluetooth scanning is active
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Only update if Bluetooth is enabled and has a bluetoothId
    if (!user.bluetoothId || !user.isDiscoveryEnabled) {
      return NextResponse.json(
        { error: 'Bluetooth is not enabled for discovery' },
        { status: 400 }
      );
    }

    // Update heartbeat timestamp
    user.bluetoothIdUpdatedAt = new Date();
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Bluetooth heartbeat updated',
      updatedAt: user.bluetoothIdUpdatedAt,
    });

  } catch (error) {
    console.error('[Bluetooth Heartbeat] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
