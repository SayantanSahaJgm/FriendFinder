import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import mongoose from 'mongoose';

/**
 * POST /api/bluetooth/sync
 * Sync offline Bluetooth connections after internet reconnects
 * Processes pending connections and adds them to friends list
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
    const { pendingConnections } = body;

    if (!pendingConnections || !Array.isArray(pendingConnections)) {
      return NextResponse.json(
        { error: 'pendingConnections must be an array of user IDs' },
        { status: 400 }
      );
    }

    if (pendingConnections.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending connections to sync',
        syncedConnections: [],
      });
    }

    // Validate all receiver IDs
    const validReceiverIds = pendingConnections.filter(id => 
      mongoose.Types.ObjectId.isValid(id) && id !== userId
    );

    if (validReceiverIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid receiver IDs provided' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Find the user
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find all valid receivers
    const receivers = await User.find({
      _id: { $in: validReceiverIds },
    }).select('-password');

    if (receivers.length === 0) {
      return NextResponse.json(
        { error: 'No valid receivers found' },
        { status: 404 }
      );
    }

    // Process each pending connection
    const syncedConnections = [];
    const failedConnections = [];

    for (const receiver of receivers) {
      try {
        const receiverId = receiver._id.toString();
        
        // Check if already friends
        const userFriendIds = user.friends?.map(id => id.toString()) || [];
        if (userFriendIds.includes(receiverId)) {
          syncedConnections.push({
            userId: receiverId,
            username: receiver.username,
            status: 'already_friends',
            message: 'Already friends',
          });
          continue;
        }

        // Add to friends list
        await Promise.all([
          User.findByIdAndUpdate(
            userId,
            {
              $addToSet: { friends: receiverId },
              lastSeen: new Date(),
            }
          ),
          User.findByIdAndUpdate(
            receiverId,
            {
              $addToSet: { friends: userId },
              lastSeen: new Date(),
            }
          ),
        ]);

        syncedConnections.push({
          userId: receiverId,
          username: receiver.username,
          name: receiver.name || receiver.username,
          profilePicture: receiver.profilePicture,
          status: 'synced',
          message: 'Connection synced successfully',
        });

        // Emit Socket.IO event to receiver
        try {
          const io = (global as any).socketIO;
          if (io) {
            io.to(`user-${receiverId}`).emit('bluetoothConnected', {
              connectedUser: {
                id: user._id,
                username: user.username,
                name: user.name || user.username,
                profilePicture: user.profilePicture,
                bluetoothName: user.bluetoothName,
              },
              timestamp: new Date().toISOString(),
              message: `${user.name || user.username} connected via Bluetooth (synced)`,
              synced: true,
            });
          }
        } catch (socketError) {
          console.error('Socket.IO emit error for receiver:', receiverId, socketError);
        }

      } catch (connectionError) {
        console.error('Error syncing connection:', connectionError);
        failedConnections.push({
          userId: receiver._id.toString(),
          username: receiver.username,
          status: 'failed',
          error: connectionError instanceof Error ? connectionError.message : 'Unknown error',
        });
      }
    }

    // Emit sync completed event to user
    try {
      const io = (global as any).socketIO;
      if (io) {
        io.to(`user-${userId}`).emit('bluetoothSyncCompleted', {
          timestamp: new Date().toISOString(),
          syncedCount: syncedConnections.length,
          failedCount: failedConnections.length,
          syncedConnections,
          failedConnections,
        });
      }
    } catch (socketError) {
      console.error('Socket.IO emit error:', socketError);
    }

    return NextResponse.json({
      success: true,
      message: 'Bluetooth connections synced',
      totalRequested: pendingConnections.length,
      synced: syncedConnections.length,
      failed: failedConnections.length,
      syncedConnections,
      failedConnections,
    });

  } catch (error) {
    console.error('Bluetooth sync API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
