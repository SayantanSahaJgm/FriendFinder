import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

/**
 * Verify password reset OTP
 * POST /api/auth/verify-reset-otp
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
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    }).select('+passwordResetOTP +passwordResetOTPExpires');

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired reset code',
        },
        { status: 400 }
      );
    }

    // Check if OTP exists
    if (!user.passwordResetOTP || !user.passwordResetOTPExpires) {
      return NextResponse.json(
        {
          success: false,
          error: 'No reset code found. Please request a new one.',
        },
        { status: 400 }
      );
    }

    // Check if OTP expired
    if (user.passwordResetOTPExpires < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reset code has expired. Please request a new one.',
          expired: true,
        },
        { status: 400 }
      );
    }

    // Verify OTP
    if (user.passwordResetOTP !== otp.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid reset code. Please check and try again.',
        },
        { status: 400 }
      );
    }

    // OTP is valid - return success (don't clear OTP yet, wait for password reset)
    return NextResponse.json(
      {
        success: true,
        message: 'Reset code verified successfully',
        email: user.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify reset code',
        message: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : 'Unknown error')
          : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
