import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { registerSchema } from '@/lib/validations';
import { z } from 'zod';
import { generateOTP, sendOTPEmail } from '@/lib/email';

/**
 * User Registration API
 * POST /api/users/register
 * 
 * Creates a new user account with email/password credentials
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input data
    const validatedData = registerSchema.parse(body);

    // Connect to database
    await dbConnect();

    // Check if user already exists (excluding soft-deleted accounts)
    const existingUser = await User.findOne({
      $and: [
        {
          $or: [
            { email: validatedData.email },
            { username: validatedData.username },
          ],
        },
        {
          $or: [
            { isDeleted: { $exists: false } },
            { isDeleted: false },
          ],
        },
      ],
    });

    if (existingUser) {
      if (existingUser.email === validatedData.email) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email already registered',
            field: 'email',
          },
          { status: 409 }
        );
      }

      if (existingUser.username === validatedData.username) {
        return NextResponse.json(
          {
            success: false,
            error: 'Username already taken',
            field: 'username',
          },
          { status: 409 }
        );
      }
    }

    // Create new user
    const newUser = await User.create({
      username: validatedData.username,
      email: validatedData.email,
      password: validatedData.password,
      isDiscoveryEnabled: true,
      discoveryRange: 1000, // 1km default
      friends: [],
      friendRequests: [],
      lastSeen: new Date(),
      isEmailVerified: true, // TEMPORARILY AUTO-VERIFIED - bypassing email verification
    });

    // TEMPORARILY DISABLED: Email verification
    // Users are auto-verified on registration
    // const otp = generateOTP();
    // const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    // newUser.verificationOTP = otp;
    // newUser.verificationOTPExpires = otpExpires;
    // await newUser.save();
    // const emailResult = await sendOTPEmail(newUser.email, newUser.username, otp);
    
    console.log('Email verification temporarily disabled - user auto-verified');

    // Return success response (password automatically excluded by schema)
    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully. You can now sign in.',
        requiresVerification: false, // TEMPORARILY DISABLED
        data: {
          user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            isEmailVerified: newUser.isEmailVerified,
            isDiscoveryEnabled: newUser.isDiscoveryEnabled,
            discoveryRange: newUser.discoveryRange,
            createdAt: newUser.createdAt,
          },
        },
        emailSent: false, // Email verification disabled
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const fieldErrors = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    // Handle MongoDB duplicate key errors
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      const duplicateField = Object.keys((error as any).keyValue)[0];
      return NextResponse.json(
        {
          success: false,
          error: `${duplicateField} already exists`,
          field: duplicateField,
        },
        { status: 409 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: 'Registration failed',
        message: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
