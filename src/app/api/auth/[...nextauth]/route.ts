import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Next-Auth API route handler
 * Handles all authentication-related requests
 * 
 * Routes:
 * - GET/POST /api/auth/signin
 * - GET/POST /api/auth/signout
 * - GET/POST /api/auth/callback/:provider
 * - GET /api/auth/session
 * - GET /api/auth/csrf
 * - GET /api/auth/providers
 */

// Validate environment variables at route initialization
if (!process.env.NEXTAUTH_SECRET && !process.env.AUTH_SECRET) {
  console.error(
    '\n❌ FATAL ERROR: NEXTAUTH_SECRET is not defined!\n' +
    'Please ensure your .env.local file exists and contains:\n' +
    'NEXTAUTH_SECRET=your-secret-key\n' +
    '\nGenerate a secret with: openssl rand -base64 32\n'
  );
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
