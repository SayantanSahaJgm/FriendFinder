import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { generateOTP, sendPasswordResetEmail } from '@/lib/email';

/**
 * Request password reset - sends OTP to email
 * POST /api/auth/forgot-password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email is required',
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Don't reveal if user exists for security
    if (!user) {
      // Return success anyway to prevent email enumeration
      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists with this email, you will receive a password reset code.',
        },
        { status: 200 }
      );
    }

    // Generate OTP for password reset (15 minutes expiry)
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update user with password reset OTP
    user.passwordResetOTP = otp;
    user.passwordResetOTPExpires = otpExpires;
    await user.save();

    // Send password reset email (don't wait for it to complete)
    sendPasswordResetEmail(user.email, user.username, otp).catch(err => {
      console.error('Failed to send password reset email:', err);
    });

    return NextResponse.json(
      {
        success: true,
        message: 'If an account exists with this email, you will receive a password reset code.',
        expiresIn: 15 * 60, // seconds
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process password reset request',
        message: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : 'Unknown error')
          : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
