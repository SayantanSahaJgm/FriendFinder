import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'

/**
 * GET /api/wifi/nearby
 * Find users on the same WiFi network
 * 
 * Returns users who:
 * - Are on the same hashed WiFi network (BSSID)
 * - Have discovery enabled
 * - Have been active in the last hour
 * - Are not the current user
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

    const currentUser = await User.findOne({ email: session.user.email });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has registered a WiFi network
    if (!currentUser.hashedBSSID) {
      return NextResponse.json({
        success: true,
        users: [],
        message: 'No WiFi network registered. Please scan first.',
      });
    }

    console.log(`[WiFi Nearby] Finding users on same network as ${currentUser.username}`);

    // Find nearby users using the static method
    const nearbyUsers = await (User as any).findNearbyByWiFi(
      currentUser.hashedBSSID,
      currentUser._id
    );

    console.log(`[WiFi Nearby] Found ${nearbyUsers.length} nearby users`);

    // Format the response
    const formattedUsers = nearbyUsers.map((user: any) => ({
      id: user._id.toString(),
      username: user.username,
      name: user.name || user.username,
      bio: user.bio,
      profilePicture: user.profilePicture,
      network: user.wifiName || 'Unknown Network',
      lastSeenWiFi: user.lastSeenWiFi,
      // Calculate time ago
      lastSeenAgo: user.lastSeenWiFi
        ? getTimeAgo(new Date(user.lastSeenWiFi))
        : 'Unknown',
      // Friend relationship status
      isFriend: currentUser.isFriendWith(user._id),
      hasPendingRequestTo: currentUser.hasPendingRequestTo(user._id),
      hasPendingRequestFrom: currentUser.hasPendingRequestFrom(user._id),
      // Add interests if available
      interests: user.interests || [],
    }));

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      currentNetwork: {
        ssid: currentUser.wifiName || 'Unknown',
        registeredAt: currentUser.lastSeenWiFi,
      },
    });
  } catch (error) {
    console.error('[WiFi Nearby] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to calculate time ago
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
