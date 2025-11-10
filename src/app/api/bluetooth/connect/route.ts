import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import mongoose from 'mongoose';

/**
 * POST /api/bluetooth/connect
 * Connect two users via Bluetooth - add each other as friends
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

    const senderId = session.user.id;

    // Parse request body
    const body = await req.json();
    const { receiverId } = body;

    if (!receiverId) {
      return NextResponse.json(
        { error: 'receiverId is required' },
        { status: 400 }
      );
    }

    // Validate receiverId format
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return NextResponse.json(
        { error: 'Invalid receiverId format' },
        { status: 400 }
      );
    }

    // Prevent self-connection
    if (senderId === receiverId) {
      return NextResponse.json(
        { error: 'Cannot connect to yourself' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find both users
    const [senderUser, receiverUser] = await Promise.all([
      User.findById(senderId).select('-password'),
      User.findById(receiverId).select('-password'),
    ]);

    if (!senderUser) {
      return NextResponse.json(
        { error: 'Sender user not found' },
        { status: 404 }
      );
    }

    if (!receiverUser) {
      return NextResponse.json(
        { error: 'Receiver user not found' },
        { status: 404 }
      );
    }

    // Verify both users have Bluetooth enabled
    if (!senderUser.bluetoothEnabled) {
      return NextResponse.json(
        { error: 'Your Bluetooth is not enabled' },
        { status: 403 }
      );
    }

    if (!receiverUser.bluetoothEnabled) {
      return NextResponse.json(
        { error: 'Receiver\'s Bluetooth is not enabled' },
        { status: 403 }
      );
    }

    // Check if users are in each other's nearbyUsers list
    const senderNearbyIds = senderUser.nearbyUsers?.map(id => id.toString()) || [];
    const receiverNearbyIds = receiverUser.nearbyUsers?.map(id => id.toString()) || [];
    
    if (!senderNearbyIds.includes(receiverId)) {
      return NextResponse.json(
        { error: 'User is not in your nearby users list. Please detect them first.' },
        { status: 400 }
      );
    }

    // Check if already friends
    const senderFriendIds = senderUser.friends?.map(id => id.toString()) || [];
    if (senderFriendIds.includes(receiverId)) {
      return NextResponse.json(
        { error: 'You are already friends with this user' },
        { status: 400 }
      );
    }

    // Add each other to friends list using $addToSet to avoid duplicates
    await Promise.all([
      User.findByIdAndUpdate(
        senderId,
        {
          $addToSet: { friends: receiverId },
          lastSeen: new Date(),
        }
      ),
      User.findByIdAndUpdate(
        receiverId,
        {
          $addToSet: { friends: senderId },
          lastSeen: new Date(),
        }
      ),
    ]);

    // Prepare user info for socket events
    const senderInfo = {
      id: senderUser._id,
      username: senderUser.username,
      name: senderUser.name || senderUser.username,
      profilePicture: senderUser.profilePicture,
      bluetoothName: senderUser.bluetoothName,
    };

    const receiverInfo = {
      id: receiverUser._id,
      username: receiverUser.username,
      name: receiverUser.name || receiverUser.username,
      profilePicture: receiverUser.profilePicture,
      bluetoothName: receiverUser.bluetoothName,
    };

    // Emit Socket.IO event to both users
    try {
      const io = (global as any).socketIO;
      if (io) {
        // Notify sender
        io.to(`user-${senderId}`).emit('bluetoothConnected', {
          connectedUser: receiverInfo,
          timestamp: new Date().toISOString(),
          message: `You are now connected with ${receiverInfo.name}!`,
        });

        // Notify receiver
        io.to(`user-${receiverId}`).emit('bluetoothConnected', {
          connectedUser: senderInfo,
          timestamp: new Date().toISOString(),
          message: `You are now connected with ${senderInfo.name}!`,
        });
      }
    } catch (socketError) {
      console.error('Socket.IO emit error:', socketError);
      // Don't fail the API call if socket event fails
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully connected via Bluetooth',
      connectedUser: receiverInfo,
    });

  } catch (error) {
    console.error('Bluetooth connect API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
