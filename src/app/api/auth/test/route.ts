import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { testEmailConfig } from '@/lib/email';

// Mark as dynamic to prevent build-time execution
export const dynamic = 'force-dynamic';

/**
 * Test endpoint for NextAuth and Email configuration
 * GET /api/auth/test
 * 
 * Returns current session information, auth configuration, and email service status
 */
export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasEmailUser: !!process.env.EMAIL_USER,
      hasEmailPassword: !!process.env.EMAIL_PASSWORD,
      emailHost: process.env.EMAIL_HOST || 'not configured',
      emailPort: process.env.EMAIL_PORT || 'not configured',
      nodeEnv: process.env.NODE_ENV,
    };

    // Test email configuration
    console.log('🧪 Testing email configuration...');
    const emailTest = await testEmailConfig();

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
      emailServiceReady: emailTest.success,
      emailError: emailTest.error || null,
      session: session || null,
      configError: authConfigError,
      providers: ['credentials', 'google'],
    };

    return NextResponse.json({
      success: true,
      message: 'NextAuth & Email configuration test',
      data: {
        authStatus,
        envCheck,
        emailTest: {
          configured: emailTest.success,
          error: emailTest.error || null,
          recommendation: !emailTest.success 
            ? 'Please configure EMAIL_USER and EMAIL_PASSWORD in .env file. See EMAIL_SETUP_FIX.md for details.'
            : 'Email service is properly configured! ✅',
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Auth test endpoint error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Configuration test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
