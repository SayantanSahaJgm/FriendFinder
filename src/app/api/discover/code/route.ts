import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import crypto from "crypto";

// Generate a unique 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST - Generate a new discovery code
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Generate a unique discovery code
    let discoveryCode = generateCode();
    let codeExists = true;
    
    // Ensure uniqueness
    while (codeExists) {
      const existing = await User.findOne({ discoveryCode, discoveryCodeExpires: { $gt: new Date() } });
      if (!existing) {
        codeExists = false;
      } else {
        discoveryCode = generateCode();
      }
    }

    // Set expiration to 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Save to user
    user.discoveryCode = discoveryCode;
    user.discoveryCodeExpires = expiresAt;
    await user.save();

    return NextResponse.json({
      success: true,
      code: discoveryCode,
      expiresAt: expiresAt.toISOString(),
      message: "Discovery code generated successfully",
    });
  } catch (error: any) {
    console.error("Error generating discovery code:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate code" },
      { status: 500 }
    );
  }
}

// GET - Lookup user by discovery code
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Code is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user with this code that hasn't expired
    const user = await User.findOne({
      discoveryCode: code,
      discoveryCodeExpires: { $gt: new Date() },
    }).select('name username email profilePicture bio');

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired code" },
        { status: 404 }
      );
    }

    // Check if already friends
    const currentUser = await User.findOne({ email: session.user.email });
    const userId = (user as any)._id;
    const isFriend = currentUser?.friends?.some((friendId: any) => 
      friendId.toString() === userId.toString()
    );
    
    const hasPendingRequest = currentUser?.sentRequests?.some((req: any) =>
      req.to?.toString() === userId.toString() && req.status === 'pending'
    );

    return NextResponse.json({
      success: true,
      user: {
        id: userId.toString(),
        name: user.name,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        isFriend,
        hasPendingRequest,
      },
    });
  } catch (error: any) {
    console.error("Error looking up discovery code:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to lookup code" },
      { status: 500 }
    );
  }
}
