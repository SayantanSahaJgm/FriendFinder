import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

/**
 * GET /api/users/discovery-status
 * Returns detailed discovery status for debugging
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate time thresholds
    const now = new Date();
    const wifiThreshold = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    const bluetoothThreshold = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago

    // Check WiFi status
    const hasWiFi = !!currentUser.hashedBSSID;
    const wifiRecent = currentUser.lastSeenWiFi 
      ? currentUser.lastSeenWiFi >= wifiThreshold 
      : false;
    const wifiMinutesAgo = currentUser.lastSeenWiFi
      ? Math.floor((now.getTime() - currentUser.lastSeenWiFi.getTime()) / 1000 / 60)
      : null;

    // Check Bluetooth status
    const hasBluetooth = !!currentUser.bluetoothId;
    const bluetoothRecent = currentUser.bluetoothIdUpdatedAt
      ? currentUser.bluetoothIdUpdatedAt >= bluetoothThreshold
      : false;
    const bluetoothMinutesAgo = currentUser.bluetoothIdUpdatedAt
      ? Math.floor((now.getTime() - currentUser.bluetoothIdUpdatedAt.getTime()) / 1000 / 60)
      : null;

    // Count potential matches
    const wifiUsersCount = hasWiFi && wifiRecent
      ? await User.countDocuments({
          hashedBSSID: currentUser.hashedBSSID,
          isDiscoveryEnabled: true,
          lastSeenWiFi: { $gte: wifiThreshold },
          _id: { $ne: currentUser._id }
        })
      : 0;

    const bluetoothUsersCount = hasBluetooth && bluetoothRecent
      ? await User.countDocuments({
          bluetoothId: { $exists: true, $ne: null },
          isDiscoveryEnabled: true,
          bluetoothIdUpdatedAt: { $gte: bluetoothThreshold },
          _id: { $ne: currentUser._id }
        })
      : 0;

    const status = {
      user: {
        id: currentUser._id,
        username: currentUser.username,
        email: currentUser.email,
      },
      discovery: {
        enabled: currentUser.isDiscoveryEnabled,
        range: currentUser.discoveryRange,
      },
      wifi: {
        configured: hasWiFi,
        hashedBSSID: hasWiFi ? currentUser.hashedBSSID?.substring(0, 10) + '...' : null,
        lastSeen: currentUser.lastSeenWiFi,
        minutesAgo: wifiMinutesAgo,
        isRecent: wifiRecent,
        isExpired: hasWiFi && !wifiRecent,
        threshold: wifiThreshold,
        potentialMatches: wifiUsersCount,
        status: !hasWiFi 
          ? '❌ Not configured - Go to settings and enable WiFi discovery'
          : !wifiRecent
          ? `⚠️ Expired (${wifiMinutesAgo} minutes ago) - Please refresh your WiFi connection`
          : wifiUsersCount === 0
          ? '⚠️ Active but no other users on same network'
          : `✅ Active (${wifiUsersCount} users nearby)`,
      },
      bluetooth: {
        configured: hasBluetooth,
        bluetoothId: hasBluetooth ? currentUser.bluetoothId?.substring(0, 10) + '...' : null,
        bluetoothName: currentUser.bluetoothName,
        lastUpdated: currentUser.bluetoothIdUpdatedAt,
        minutesAgo: bluetoothMinutesAgo,
        isRecent: bluetoothRecent,
        isExpired: hasBluetooth && !bluetoothRecent,
        threshold: bluetoothThreshold,
        potentialMatches: bluetoothUsersCount,
        status: !hasBluetooth
          ? '❌ Not configured - Go to settings and enable Bluetooth discovery'
          : !bluetoothRecent
          ? `⚠️ Expired (${bluetoothMinutesAgo} minutes ago) - Please refresh your Bluetooth connection`
          : bluetoothUsersCount === 0
          ? '⚠️ Active but no other users nearby'
          : `✅ Active (${bluetoothUsersCount} users nearby)`,
      },
      recommendations: []
    };

    // Generate recommendations
    const recommendations: string[] = [];

    if (!currentUser.isDiscoveryEnabled) {
      recommendations.push('🔴 CRITICAL: Enable "Discovery Mode" in Settings');
    }

    if (!hasWiFi && !hasBluetooth) {
      recommendations.push('🔴 Enable at least one discovery method (WiFi or Bluetooth)');
    }

    if (hasWiFi && !wifiRecent) {
      recommendations.push(`⚠️ WiFi expired ${wifiMinutesAgo} minutes ago - Refresh your WiFi connection`);
    }

    if (hasBluetooth && !bluetoothRecent) {
      recommendations.push(`⚠️ Bluetooth expired ${bluetoothMinutesAgo} minutes ago - Refresh your Bluetooth connection`);
    }

    if (wifiUsersCount === 0 && hasWiFi && wifiRecent) {
      recommendations.push('💡 No other users on your WiFi network - Try Bluetooth or GPS');
    }

    if (bluetoothUsersCount === 0 && hasBluetooth && bluetoothRecent) {
      recommendations.push('💡 No other users detected via Bluetooth - Make sure they have Bluetooth enabled too');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Everything looks good! You should be able to discover nearby users.');
    }

    (status as any).recommendations = recommendations;

    return NextResponse.json(status);

  } catch (error) {
    console.error('Error getting discovery status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
