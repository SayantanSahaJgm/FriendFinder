import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { encryptBluetoothDeviceId, isValidBluetoothDeviceId, sanitizeBluetoothName } from '@/lib/bluetooth-utils';

/**
 * POST /api/bluetooth/status
 * Update user's Bluetooth status and device ID
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

    // Parse request body
    const body = await req.json();
    const { bluetoothEnabled, bluetoothDeviceId, bluetoothName } = body;

    // Validate input
    if (typeof bluetoothEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'bluetoothEnabled must be a boolean value' },
        { status: 400 }
      );
    }

    // If Bluetooth is being enabled, validate device ID
    if (bluetoothEnabled) {
      if (!bluetoothDeviceId || !isValidBluetoothDeviceId(bluetoothDeviceId)) {
        return NextResponse.json(
          { error: 'Invalid Bluetooth device ID format' },
          { status: 400 }
        );
      }
    }

    // Connect to database
    await dbConnect();

    // Prepare update data
    const updateData: any = {
      bluetoothEnabled,
      lastSeen: new Date(),
    };

    // If enabling Bluetooth, encrypt and store device ID
    if (bluetoothEnabled && bluetoothDeviceId) {
      const encryptedDeviceId = encryptBluetoothDeviceId(bluetoothDeviceId);
      updateData.bluetoothDeviceId = encryptedDeviceId;
      updateData.bluetoothIdUpdatedAt = new Date();
      
      if (bluetoothName) {
        updateData.bluetoothName = sanitizeBluetoothName(bluetoothName);
      }
    } else if (!bluetoothEnabled) {
      // If disabling Bluetooth, clear nearby users
      updateData.nearbyUsers = [];
    }

    // Update user in database
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password' }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Emit socket event if Bluetooth was disabled
    if (!bluetoothEnabled) {
      try {
        // Get socket.io instance
        const io = (global as any).socketIO;
        if (io) {
          io.to(`user-${userId}`).emit('bluetoothDisconnected', {
            userId,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (socketError) {
        console.error('Socket.IO emit error:', socketError);
        // Don't fail the API call if socket event fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bluetooth ${bluetoothEnabled ? 'enabled' : 'disabled'} successfully`,
      user: {
        id: user._id,
        username: user.username,
        bluetoothEnabled: user.bluetoothEnabled,
        bluetoothName: user.bluetoothName,
        nearbyUsers: user.nearbyUsers,
      },
    });

  } catch (error) {
    console.error('Bluetooth status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
