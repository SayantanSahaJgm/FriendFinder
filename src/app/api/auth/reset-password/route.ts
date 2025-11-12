import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

/**
 * Reset password with verified OTP
 * POST /api/auth/reset-password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email, OTP, and new password are required',
        },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password must be at least 8 characters long',
        },
        { status: 400 }
      );
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user and verify OTP one more time
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    }).select('+passwordResetOTP +passwordResetOTPExpires +password');

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
        },
        { status: 400 }
      );
    }

    // Verify OTP is still valid
    if (!user.passwordResetOTP || !user.passwordResetOTPExpires) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid reset code found',
        },
        { status: 400 }
      );
    }

    if (user.passwordResetOTPExpires < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reset code has expired',
          expired: true,
        },
        { status: 400 }
      );
    }

    if (user.passwordResetOTP !== otp.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid reset code',
        },
        { status: 400 }
      );
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    
    // Clear password reset fields
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Password reset successfully. You can now login with your new password.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset password',
        message: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : 'Unknown error')
          : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
