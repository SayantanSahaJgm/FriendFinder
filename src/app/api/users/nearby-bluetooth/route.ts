import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import dbConnect from "@/lib/mongoose";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!currentUser.bluetoothId) {
      return NextResponse.json({ 
        error: "No Bluetooth device set. Please update your Bluetooth device first." 
      }, { status: 400 });
    }

    console.log('🔍 Searching for nearby Bluetooth users:', {
      currentUser: currentUser.username,
      bluetoothId: currentUser.bluetoothId,
      bluetoothIdUpdatedAt: currentUser.bluetoothIdUpdatedAt,
    });

    // Find users with Bluetooth enabled who are nearby
    // This finds ALL users with Bluetooth enabled (not same bluetoothId)
    const nearbyUsers = await User.findNearbyByBluetooth(
      currentUser.bluetoothId,
      currentUser._id as mongoose.Types.ObjectId
    );

    console.log('✅ Found nearby users:', {
      count: nearbyUsers.length,
      users: nearbyUsers.map(u => ({
        username: u.username,
        bluetoothId: u.bluetoothId?.substring(0, 10),
        updatedAt: u.bluetoothIdUpdatedAt,
      })),
    });

    // Format the response with additional user info
    const formattedUsers = nearbyUsers.map(user => ({
      id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      lastSeenBluetooth: user.bluetoothIdUpdatedAt,
      lastSeen: user.lastSeen,
      // Check relationship status
      isFriend: currentUser.isFriendWith(user._id as mongoose.Types.ObjectId),
      hasPendingRequestFrom: currentUser.hasPendingRequestFrom(user._id as mongoose.Types.ObjectId),
      hasPendingRequestTo: currentUser.hasPendingRequestTo(user._id as mongoose.Types.ObjectId),
    }));

    return NextResponse.json({
      users: formattedUsers,
      count: formattedUsers.length,
      deviceId: currentUser.bluetoothId.substring(0, 8) + "...", // Show partial device ID for debugging
    });

  } catch (error) {
    console.error("Nearby Bluetooth users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}