import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Message from "@/models/Message";
import Conversation from "@/models/Conversation";
import Post from "@/models/Post";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email })
      .populate("friends", "name username email profilePicture")
      .populate("friendRequests.from", "name username email profilePicture")
      .populate("friendRequests.to", "name username email profilePicture")
      .lean();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get user's conversations
    const conversations = await Conversation.find({
      participants: user._id,
    })
      .populate("participants", "name username email")
      .lean();

    // Get user's messages
    const messages = await Message.find({
      $or: [{ sender: user._id }, { recipient: user._id }],
    })
      .populate("sender", "name username")
      .populate("recipient", "name username")
      .lean();

    // Get user's posts
    const posts = await Post.find({ author: user._id })
      .populate("likes", "name username")
      .populate("comments.user", "name username")
      .lean();

    // Compile all data
    const userData = {
      profile: {
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profilePicture: user.profilePicture,
        coverPicture: user.coverPicture,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        location: user.location,
        interests: user.interests,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      friends: user.friends,
      friendRequests: user.friendRequests,
      conversations: conversations,
      messages: messages,
      posts: posts,
      settings: {
        isDiscoveryEnabled: user.isDiscoveryEnabled,
        discoveryRange: user.discoveryRange,
        hasBluetooth: user.hasBluetooth,
        hasWifi: user.hasWifi,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      statistics: {
        totalFriends: user.friends?.length || 0,
        totalMessages: messages.length,
        totalPosts: posts.length,
        totalConversations: conversations.length,
      },
      exportedAt: new Date().toISOString(),
    };

    // Create filename
    const filename = `friendfinder-data-${user.username}-${Date.now()}.json`;

    // Return as JSON download
    return new NextResponse(JSON.stringify(userData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Error downloading data:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to download data" },
      { status: 500 }
    );
  }
}
