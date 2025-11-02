import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongoose";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pairingCode } = await req.json();

    if (!pairingCode || typeof pairingCode !== 'string') {
      return NextResponse.json(
        { error: "Pairing code is required" },
        { status: 400 }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(pairingCode)) {
      return NextResponse.json(
        { error: "Invalid pairing code format" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find user with this pairing code
    const now = new Date()
    console.log('🔍 [WiFi Pair] Searching for code:', pairingCode, 'Current time:', now.toISOString())
    
    const targetUser = await User.findOne({
      wifiPairingCode: pairingCode,
      wifiPairingCodeExpires: { $gt: now }, // Code not expired
    });

    if (!targetUser) {
      // Debug: check if code exists at all
      const userWithCode = await User.findOne({ wifiPairingCode: pairingCode })
      if (userWithCode) {
        console.log('❌ [WiFi Pair] Code found but expired. Code expiry:', userWithCode.wifiPairingCodeExpires?.toISOString(), 'Current time:', now.toISOString())
        if (userWithCode.wifiPairingCodeExpires) {
          console.log('❌ [WiFi Pair] Time difference (ms):', userWithCode.wifiPairingCodeExpires.getTime() - now.getTime())
        } else {
          console.log('❌ [WiFi Pair] wifiPairingCodeExpires is not set')
        }
      } else {
        console.log('❌ [WiFi Pair] Code not found in database:', pairingCode)
      }
      return NextResponse.json(
        { error: "Invalid or expired pairing code" },
        { status: 404 }
      );
    }
    
    console.log('✅ [WiFi Pair] Found target user:', targetUser.username, 'Code expires:', targetUser.wifiPairingCodeExpires?.toISOString())

    // Prevent self-pairing
    if ((currentUser._id as mongoose.Types.ObjectId).equals(targetUser._id as mongoose.Types.ObjectId)) {
      return NextResponse.json(
        { error: "Cannot pair with yourself" },
        { status: 400 }
      );
    }

    // Check if already friends
    if (currentUser.isFriendWith(targetUser._id as mongoose.Types.ObjectId)) {
      return NextResponse.json(
        { error: "Already friends with this user" },
        { status: 400 }
      );
    }

    // Check if there's already a pending request
    if (currentUser.hasPendingRequestTo(targetUser._id as mongoose.Types.ObjectId)) {
      return NextResponse.json(
        { error: "Friend request already pending" },
        { status: 400 }
      );
    }

    // Create friend request (embedded in User model)
    const newRequestId = new mongoose.Types.ObjectId();
    const newFriendRequest = {
      _id: newRequestId,
      from: currentUser._id as mongoose.Types.ObjectId,
      fromName: currentUser.username,
      fromAvatar: currentUser.profilePicture,
      to: targetUser._id as mongoose.Types.ObjectId,
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    targetUser.friendRequests.push(newFriendRequest as any);
    await targetUser.save();

    const sentRequest = {
      _id: newRequestId,
      from: currentUser._id as mongoose.Types.ObjectId,
      fromName: currentUser.username,
      fromAvatar: currentUser.profilePicture,
      to: targetUser._id as mongoose.Types.ObjectId,
      toName: targetUser.username,
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    currentUser.sentRequests.push(sentRequest as any);
    await currentUser.save();

    // Clear the pairing code after successful use
    targetUser.wifiPairingCode = undefined;
    targetUser.wifiPairingCodeExpires = undefined;
    await targetUser.save();

    // Send real-time notification via Socket.IO
    try {
      await fetch(`${process.env.SOCKET_SERVER_URL || 'http://localhost:3004'}/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'friend_request_received',
          targetUserId: (targetUser._id as mongoose.Types.ObjectId).toString(),
          data: {
            requestId: newRequestId.toString(),
            from: {
              id: (currentUser._id as mongoose.Types.ObjectId).toString(),
              username: currentUser.username,
              profilePicture: currentUser.profilePicture,
            },
            message: `${currentUser.username} wants to connect via WiFi`,
            timestamp: new Date().toISOString(),
          },
        }),
      });
    } catch (socketError) {
      console.error('Socket.IO notification error:', socketError);
      // Don't fail the pairing if socket notification fails
    }

    return NextResponse.json({
      success: true,
      message: `Friend request sent to ${targetUser.username}`,
      recipientUsername: targetUser.username,
    });

  } catch (error) {
    console.error("WiFi pairing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
