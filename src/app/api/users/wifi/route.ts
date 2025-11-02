import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { hashSSID } from "@/lib/hash";
import dbConnect from "@/lib/mongoose";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // New pairing code generation flow
    if (body.networkName) {
      const { networkName } = body;
      
      if (typeof networkName !== 'string' || networkName.trim().length === 0) {
        return NextResponse.json({ 
          error: "Valid network name required" 
        }, { status: 400 });
      }

      if (networkName.trim().length > 50) {
        return NextResponse.json({ 
          error: "Network name too long (max 50 characters)" 
        }, { status: 400 });
      }

      await dbConnect();

      // Generate 6-digit pairing code
      const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      const updatedUser = await User.findOneAndUpdate(
        { email: session.user.email },
        {
          wifiName: networkName.trim(),
          wifiPairingCode: pairingCode,
          wifiPairingCodeExpires: expiresAt,
          lastSeen: new Date(),
        },
        { new: true }
      );

      if (!updatedUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      console.log('✅ [WiFi Generate] Code created:', pairingCode, 'Expires:', expiresAt.toISOString(), 'User:', updatedUser.username)

      return NextResponse.json({ 
        pairingCode,
        expiresAt,
        message: "WiFi pairing code generated successfully"
      });
    }

    // Legacy SSID update flow (for backward compatibility)
    const { ssid } = body;
    
    if (!ssid || typeof ssid !== 'string' || ssid.trim().length === 0) {
      return NextResponse.json({ 
        error: "Valid SSID or network name required" 
      }, { status: 400 });
    }

    if (ssid.trim().length > 32) {
      return NextResponse.json({ 
        error: "SSID too long (max 32 characters)" 
      }, { status: 400 });
    }

    await dbConnect();

    const hashedSSID = hashSSID(ssid);

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        hashedBSSID: hashedSSID,
        lastSeenWiFi: new Date(),
        lastSeen: new Date(),
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: "WiFi network updated successfully",
      lastSeenWiFi: updatedUser.lastSeenWiFi
    });

  } catch (error) {
    console.error("WiFi update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      hasWiFi: !!currentUser.hashedBSSID,
      lastSeenWiFi: currentUser.lastSeenWiFi,
    });

  } catch (error) {
    console.error("WiFi status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
