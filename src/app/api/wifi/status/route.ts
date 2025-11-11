import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'

/**
 * GET /api/wifi/status
 * Get current user's WiFi registration status
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isRegistered = !!(user.hashedBSSID && user.lastSeenWiFi);
    const isActive = isRegistered && user.lastSeenWiFi 
      ? (Date.now() - new Date(user.lastSeenWiFi).getTime()) < 60 * 60 * 1000 // Active within last hour
      : false;

    return NextResponse.json({
      success: true,
      status: {
        isRegistered,
        isActive,
        isDiscoveryEnabled: user.isDiscoveryEnabled,
        networkName: user.wifiName,
        lastSeenWiFi: user.lastSeenWiFi,
      },
    });
  } catch (error) {
    console.error('[WiFi Status] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
