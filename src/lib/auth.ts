import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import dbConnect from './mongoose';
import User from '@/models/User';
import { loginSchema } from './validations';

/**
 * Next-Auth configuration options
 */
export const authOptions: NextAuthOptions = {
  providers: [
    // Credentials provider for email/password login
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'your-email@example.com',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        try {
          // Validate input
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email and password are required');
          }

          // Validate with schema
          const validatedData = loginSchema.parse({
            email: credentials.email,
            password: credentials.password,
          });

          // Connect to database
          await dbConnect();

          // Find user by email
          const user = await User.findOne({ email: validatedData.email }).select('+password');
          
          if (!user) {
            throw new Error('Invalid email or password');
          }

          // Check if account is marked for deletion
          if (user.isDeleted) {
            if (user.scheduledDeletionDate && new Date() > user.scheduledDeletionDate) {
              throw new Error('Your account has been permanently deleted. Please sign up again.');
            }
            throw new Error('Your account is scheduled for deletion. Please restore your account first.');
          }

          // TEMPORARILY DISABLED: Email verification check
          // if (!user.isEmailVerified) {
          //   throw new Error('Please verify your email before logging in');
          // }

          // Check password
          const isPasswordValid = await user.comparePassword(validatedData.password);
          
          if (!isPasswordValid) {
            throw new Error('Invalid email or password');
          }

          // Return user object (password will be excluded by default)
          return {
            id: (user._id as string).toString(),
            email: user.email,
            name: user.username,
            image: user.profilePicture,
            username: user.username,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),

    // Google OAuth provider - only include if credentials are provided
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: 'consent',
                access_type: 'offline',
                response_type: 'code',
              },
            },
          }),
        ]
      : []),
  ],

  callbacks: {
    /**
     * JWT callback - runs whenever a JWT is created
     */
    async jwt({ token, user, account }) {
      // If this is a new sign-in, add user info to token
      if (user) {
        token.userId = user.id;
        token.username = (user as any).username || user.name;
        token.email = user.email;
        token.picture = user.image;
      }

      // Handle Google OAuth sign-in
      if (account?.provider === 'google' && user) {
        try {
          await dbConnect();
          
          // Check if user exists (excluding soft-deleted accounts)
          let existingUser = await User.findOne({ 
            email: user.email,
            $and: [
              {
                $or: [
                  { isDeleted: { $exists: false } },
                  { isDeleted: false },
                ],
              },
            ],
          });
          
          if (!existingUser) {
            // Create new user from Google account
            const username = user.email?.split('@')[0] || 'user';
            existingUser = await User.create({
              email: user.email,
              username: `${username}_${Date.now()}`, // Ensure uniqueness
              password: 'google_oauth_user', // Placeholder password for OAuth users
              profilePicture: user.image,
              isDiscoveryEnabled: true,
              discoveryRange: 1000, // 1km default
              friends: [],
              friendRequests: [],
              sentRequests: [],
              isEmailVerified: true, // Google accounts are pre-verified
            });
          }
          // If user exists and is not deleted, proceed with sign-in

          token.userId = (existingUser._id as string).toString();
          token.username = existingUser.username;
        } catch (error) {
          console.error('Error handling Google OAuth:', error);
        }
      }

      return token;
    },

    /**
     * Session callback - runs whenever a session is checked
     */
    async session({ session, token }) {
      console.log('NextAuth session callback:', {
        hasSession: !!session,
        hasToken: !!token,
        tokenKeys: token ? Object.keys(token) : [],
        sessionUserEmail: session?.user?.email
      });
      
      if (token) {
        session.user.id = token.userId as string;
        session.user.username = token.username as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
        
        console.log('Session populated with token data:', {
          userId: session.user.id,
          email: session.user.email,
          username: session.user.username
        });
      } else {
        console.log('⚠️ No token found in session callback');
      }

      return session;
    },

    /**
     * Sign-in callback - controls whether user is allowed to sign in
     */
    async signIn({ user, account, profile }) {
      try {
        // Always allow credentials provider
        if (account?.provider === 'credentials') {
          return true;
        }

        // For OAuth providers, ensure we have required fields
        if (account?.provider === 'google') {
          return !!(user.email && profile);
        }

        return true;
      } catch (error) {
        console.error('Sign-in callback error:', error);
        return false;
      }
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // NextAuth secret - required for JWT encryption
  // In production, this MUST be set via environment variable
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || (() => {
    // Only use fallback in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Using fallback secret in development. Set NEXTAUTH_SECRET in .env.local');
      return 'development-secret-change-in-production-' + Date.now();
    }
    return undefined;
  })(),

  debug: process.env.NODE_ENV === 'development',
};
