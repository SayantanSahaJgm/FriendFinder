import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { generateOTP, sendOTPEmail } from '@/lib/email';

/**
 * Send OTP for email verification
 * POST /api/auth/send-otp
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
          success: false,
          error: 'Email already verified',
        },
        { status: 400 }
      );
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with OTP
    user.verificationOTP = otp;
    user.verificationOTPExpires = otpExpires;
    await user.save();

    // Log a non-secret summary of email env so we can diagnose deploy issues
    try {
      const envSummary = {
        EMAIL_HOST: process.env.EMAIL_HOST || null,
        EMAIL_PORT: process.env.EMAIL_PORT || null,
        // mask local-part of the user for safety in logs
        EMAIL_USER_MASKED: process.env.EMAIL_USER
          ? process.env.EMAIL_USER.replace(/(^.).+(@.*$)/, '$1***$2')
          : null,
        EMAIL_FROM: process.env.EMAIL_FROM || null,
      }
      console.log('Email env summary (masked):', envSummary)
    } catch (e) {
      console.warn('Failed to summarize email env for debug:', e)
    }

    // Send OTP email
    const emailResult = await sendOTPEmail(email, user.username, otp);

    if (!emailResult.success) {
      console.error('send-otp: sendOTPEmail returned error:', emailResult.error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send OTP email',
          // return the error message string (non-secret) to help debugging
          details: typeof emailResult.error === 'string' ? emailResult.error : String(emailResult.error),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'OTP sent successfully',
        expiresIn: 10 * 60, // seconds
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send OTP',
        message: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : 'Unknown error')
          : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
