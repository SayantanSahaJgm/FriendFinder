import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { decryptBluetoothDeviceId } from '@/lib/bluetooth-utils';
import mongoose from 'mongoose';

/**
 * POST /api/bluetooth/detect
 * Detect nearby user via Bluetooth and update both users' nearbyUsers arrays
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

    const detectorId = session.user.id;

    // Parse request body
    const body = await req.json();
    const { detectedDeviceId } = body;

    if (!detectedDeviceId) {
      return NextResponse.json(
        { error: 'detectedDeviceId is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find the detector user
    const detectorUser = await User.findById(detectorId).select('-password');
    
    if (!detectorUser) {
      return NextResponse.json(
        { error: 'Detector user not found' },
        { status: 404 }
      );
    }

    if (!detectorUser.bluetoothEnabled) {
      return NextResponse.json(
        { error: 'Bluetooth is not enabled for your account' },
        { status: 403 }
      );
    }

    // Find all users with Bluetooth enabled
    const potentialUsers = await User.find({
      bluetoothEnabled: true,
      bluetoothDeviceId: { $exists: true, $ne: null },
      _id: { $ne: detectorId }, // Exclude self
    }).select('-password');

    // Find the detected user by matching encrypted device ID
    let detectedUser = null;
    
    for (const user of potentialUsers) {
      try {
        if (user.bluetoothDeviceId) {
          const decryptedId = decryptBluetoothDeviceId(user.bluetoothDeviceId);
          if (decryptedId === detectedDeviceId) {
            detectedUser = user;
            break;
          }
        }
      } catch (decryptError) {
        console.error('Error decrypting device ID:', decryptError);
        // Continue checking other users
      }
    }

    if (!detectedUser) {
      return NextResponse.json(
        { error: 'No user found with that Bluetooth device ID', detectedDeviceId },
        { status: 404 }
      );
    }

    // Update both users' nearbyUsers arrays (avoid duplicates with $addToSet)
    await User.findByIdAndUpdate(
      detectorId,
      {
        $addToSet: { nearbyUsers: detectedUser._id },
        lastSeen: new Date(),
      }
    );

    await User.findByIdAndUpdate(
      detectedUser._id,
      {
        $addToSet: { nearbyUsers: detectorId },
        lastSeen: new Date(),
      }
    );

    // Prepare user info for response (exclude sensitive data)
    const detectedUserInfo = {
      id: detectedUser._id,
      username: detectedUser.username,
      name: detectedUser.name || detectedUser.username,
      profilePicture: detectedUser.profilePicture,
      bluetoothName: detectedUser.bluetoothName,
      bio: detectedUser.bio,
    };

    // Emit Socket.IO event to both users
    try {
      const io = (global as any).socketIO;
      if (io) {
        // Notify detector
        io.to(`user-${detectorId}`).emit('bluetoothNearby', {
          detectedUser: detectedUserInfo,
          timestamp: new Date().toISOString(),
          message: `${detectedUserInfo.name} is nearby!`,
        });

        // Notify detected user
        io.to(`user-${detectedUser._id}`).emit('bluetoothNearby', {
          detectedUser: {
            id: detectorUser._id,
            username: detectorUser.username,
            name: detectorUser.name || detectorUser.username,
            profilePicture: detectorUser.profilePicture,
            bluetoothName: detectorUser.bluetoothName,
            bio: detectorUser.bio,
          },
          timestamp: new Date().toISOString(),
          message: `${detectorUser.name || detectorUser.username} is nearby!`,
        });
      }
    } catch (socketError) {
      console.error('Socket.IO emit error:', socketError);
      // Don't fail the API call if socket event fails
    }

    return NextResponse.json({
      success: true,
      message: 'User detected successfully',
      detectedUser: detectedUserInfo,
    });

  } catch (error) {
    console.error('Bluetooth detect API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
