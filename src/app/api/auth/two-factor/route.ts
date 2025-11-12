import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import crypto from "crypto";

// Generate a random 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST - Enable/Disable 2FA or verify code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    const { action, code } = body; // action: 'enable', 'disable', 'verify'

    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    switch (action) {
      case "enable":
        // Generate and send verification code
        const verificationCode = generateCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store code temporarily
        if (!user.settings) {
          user.settings = {};
        }
        user.settings.twoFactorCode = verificationCode;
        user.settings.twoFactorCodeExpires = expiresAt;
        
        await user.save();

        // In production, send this via email/SMS
        console.log(`2FA Code for ${user.email}: ${verificationCode}`);

        return NextResponse.json({
          success: true,
          message: "Verification code sent to your email",
          // For development only - remove in production
          code: process.env.NODE_ENV === "development" ? verificationCode : undefined,
        });

      case "verify":
        // Verify the code and enable 2FA
        if (!code) {
          return NextResponse.json(
            { success: false, error: "Code is required" },
            { status: 400 }
          );
        }

        if (!user.settings?.twoFactorCode || !user.settings?.twoFactorCodeExpires) {
          return NextResponse.json(
            { success: false, error: "No verification code found. Please request a new one." },
            { status: 400 }
          );
        }

        // Check if code expired
        if (new Date() > new Date(user.settings.twoFactorCodeExpires)) {
          return NextResponse.json(
            { success: false, error: "Verification code has expired. Please request a new one." },
            { status: 400 }
          );
        }

        // Check if code matches
        if (user.settings.twoFactorCode !== code) {
          return NextResponse.json(
            { success: false, error: "Invalid verification code" },
            { status: 400 }
          );
        }

        // Enable 2FA
        user.settings.twoFactorAuth = true;
        // Clear the temporary code
        delete user.settings.twoFactorCode;
        delete user.settings.twoFactorCodeExpires;
        
        await user.save();

        return NextResponse.json({
          success: true,
          message: "Two-factor authentication enabled successfully!",
        });

      case "disable":
        // Disable 2FA
        if (user.settings) {
          user.settings.twoFactorAuth = false;
          // Clear any temporary codes
          delete user.settings.twoFactorCode;
          delete user.settings.twoFactorCodeExpires;
        }
        
        await user.save();

        return NextResponse.json({
          success: true,
          message: "Two-factor authentication disabled",
        });

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in 2FA:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process 2FA request" },
      { status: 500 }
    );
  }
}

// GET - Check 2FA status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const user = await User.findOne({ email: session.user.email }).select('settings');
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      enabled: user.settings?.twoFactorAuth || false,
    });
  } catch (error) {
    console.error("Error checking 2FA status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check 2FA status" },
      { status: 500 }
    );
  }
}
