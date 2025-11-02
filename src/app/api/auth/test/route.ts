import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

// Mark as dynamic to prevent build-time execution
export const dynamic = 'force-dynamic';

/**
 * Test endpoint for NextAuth configuration
 * GET /api/auth/test
 * 
 * Returns current session information and auth configuration status
 */
export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      nodeEnv: process.env.NODE_ENV,
    };

    // Only import authOptions at runtime to avoid build-time errors
    let session = null;
    let authConfigError = null;
    
    try {
      const { authOptions } = await import('@/lib/auth');
      session = await getServerSession(authOptions);
    } catch (err) {
      authConfigError = err instanceof Error ? err.message : 'Failed to load auth configuration';
      console.error('Error loading auth config:', authConfigError);
    }

    const authStatus = {
      isConfigured: envCheck.hasNextAuthSecret && envCheck.hasNextAuthUrl,
      googleOAuthReady: envCheck.hasGoogleClientId && envCheck.hasGoogleClientSecret,
      session: session || null,
      configError: authConfigError,
      providers: ['credentials', 'google'],
    };

    return NextResponse.json({
      success: true,
      message: 'NextAuth configuration test',
      data: {
        authStatus,
        envCheck,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Auth test endpoint error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Auth configuration test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
