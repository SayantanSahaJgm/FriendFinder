import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import crypto from 'crypto';

/**
 * POST /api/wifi/register
 * Register user's current WiFi network for discovery
 * 
 * Request body:
 * - networkSSID: string (WiFi network name)
 * - networkBSSID: string (Router MAC address - will be hashed)
 * 
 * Security: BSSID is hashed before storage to protect network privacy
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await req.json();
    const { networkSSID, networkBSSID } = body;

    if (!networkSSID || !networkBSSID) {
      return NextResponse.json(
        { error: 'Network SSID and BSSID are required' },
        { status: 400 }
      );
    }

    // Hash the BSSID for privacy (don't store raw MAC addresses)
    const hashedBSSID = crypto
      .createHash('sha256')
      .update(networkBSSID.toLowerCase().trim())
      .digest('hex');

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user's WiFi presence
    user.hashedBSSID = hashedBSSID;
    user.wifiName = networkSSID;
    user.lastSeenWiFi = new Date();
    user.isDiscoveryEnabled = true;

    await user.save();

    console.log(`[WiFi] User ${user.username} registered on network: ${networkSSID}`);

    return NextResponse.json({
      success: true,
      message: 'WiFi network registered successfully',
      network: {
        ssid: networkSSID,
        registeredAt: user.lastSeenWiFi,
      },
    });
  } catch (error) {
    console.error('[WiFi Register] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/wifi/register
 * Unregister from WiFi discovery (clear WiFi presence)
 */
export async function DELETE(req: NextRequest) {
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

    // Clear WiFi presence
    user.hashedBSSID = undefined;
    user.wifiName = undefined;
    user.lastSeenWiFi = undefined;

    await user.save();

    console.log(`[WiFi] User ${user.username} unregistered from WiFi discovery`);

    return NextResponse.json({
      success: true,
      message: 'WiFi discovery disabled',
    });
  } catch (error) {
    console.error('[WiFi Unregister] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
