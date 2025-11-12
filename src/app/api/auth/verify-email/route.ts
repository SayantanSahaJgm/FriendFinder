import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

/**
 * Verify email via verification link/token
 * GET /api/auth/verify-email?token=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verification token is required',
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user by verification token
    const user = await User.findOne({
      emailVerificationToken: token,
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid verification token',
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

    // Check if token expired
    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verification link has expired',
          expired: true,
        },
        { status: 400 }
      );
    }

    // Mark email as verified and clear token
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Redirect to success page
    return NextResponse.redirect(new URL('/verify-email?success=true', request.url));
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify email',
        message: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : 'Unknown error')
          : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
