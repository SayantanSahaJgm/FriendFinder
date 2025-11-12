import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

/**
 * Verify OTP for email verification
 * POST /api/auth/verify-otp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and OTP are required',
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user by email
    const user = await User.findOne({ email }).select('+verificationOTP +verificationOTPExpires');

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return NextResponse.json(
        {
          success: true,
          message: 'Email already verified',
          alreadyVerified: true,
        },
        { status: 200 }
      );
    }

    // Check if OTP exists
    if (!user.verificationOTP || !user.verificationOTPExpires) {
      return NextResponse.json(
        {
          success: false,
          error: 'No OTP found. Please request a new one.',
        },
        { status: 400 }
      );
    }

    // Check if OTP expired
    if (user.verificationOTPExpires < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'OTP has expired. Please request a new one.',
          expired: true,
        },
        { status: 400 }
      );
    }

    // Verify OTP
    if (user.verificationOTP !== otp.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid OTP. Please check and try again.',
        },
        { status: 400 }
      );
    }

    // Mark email as verified and clear OTP
    user.isEmailVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpires = undefined;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify OTP',
        message: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : 'Unknown error')
          : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
