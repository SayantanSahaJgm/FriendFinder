import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bluetoothId, deviceName } = body

    // Accept either a provided bluetoothId (legacy) or a deviceName to generate an id + pairing code
    if (!deviceName && (typeof bluetoothId !== 'string' || bluetoothId.length === 0)) {
      return NextResponse.json(
        { error: 'Invalid Bluetooth ID or device name' },
        { status: 400 }
      )
    }

    await dbConnect()

    // Find current user
    const currentUser = await User.findOne({ email: session.user.email })
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // If deviceName is provided, generate bluetoothId and a short pairing code
    if (deviceName) {
      const generatedId = `bt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2,8)}`
      // 6-digit numeric pairing code
      const pairingCode = Math.floor(100000 + Math.random() * 900000).toString()
      const expires = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

      const updatedUser = await User.findByIdAndUpdate(
        currentUser._id,
        {
          bluetoothId: generatedId,
          bluetoothName: deviceName,
          pairingCode,
          pairingCodeExpires: expires,
          bluetoothIdUpdatedAt: new Date(),
          lastSeen: new Date()
        },
        { new: true }
      )

      console.log('✅ [Bluetooth Generate] Code created:', pairingCode, 'Expires:', expires.toISOString(), 'User:', updatedUser?.username)

      // Try to notify Socket.IO server directly via simple /emit endpoint if available,
      // otherwise fall back to the in-app socket proxy.
      try {
        const socketPort = process.env.SOCKET_PORT || 3004
        const emitUrl = `http://localhost:${socketPort}/emit`
        await fetch(emitUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'bluetooth_update',
            data: {
              userId: updatedUser?._id?.toString(),
              bluetoothId: updatedUser?.bluetoothId,
              bluetoothName: updatedUser?.bluetoothName,
              lastSeen: updatedUser?.bluetoothIdUpdatedAt
            }
          })
        })
      } catch (socketErr) {
        try {
          await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3003'}/api/socket.io`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'bluetooth_update',
              data: {
                userId: updatedUser?._id?.toString(),
                bluetoothId: updatedUser?.bluetoothId,
                bluetoothName: updatedUser?.bluetoothName,
                lastSeen: updatedUser?.bluetoothIdUpdatedAt
              }
            })
          })
        } catch (fallbackErr) {
          console.error('Failed to notify Socket.IO about bluetooth update (both direct and proxy):', fallbackErr)
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Bluetooth device registered',
        bluetoothId: updatedUser?.bluetoothId,
        pairingCode: pairingCode,
        pairingCodeExpires: expires
      })
    }

    // Legacy path: update bluetoothId only
    const updatedUser = await User.findByIdAndUpdate(
      currentUser._id,
      {
        bluetoothId,
        bluetoothIdUpdatedAt: new Date(),
        lastSeen: new Date()
      },
      { new: true }
    )

    // Notify socket server (direct emit endpoint preferred)
    try {
      const socketPort = process.env.SOCKET_PORT || 3004
      const emitUrl = `http://localhost:${socketPort}/emit`
      await fetch(emitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bluetooth_update',
          data: {
            userId: updatedUser?._id?.toString(),
            bluetoothId: updatedUser?.bluetoothId,
            lastSeen: updatedUser?.bluetoothIdUpdatedAt
          }
        })
      })
    } catch (socketErr) {
      try {
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3003'}/api/socket.io`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'bluetooth_update',
            data: {
              userId: updatedUser?._id?.toString(),
              bluetoothId: updatedUser?.bluetoothId,
              lastSeen: updatedUser?.bluetoothIdUpdatedAt
            }
          })
        })
      } catch (fallbackErr) {
        console.error('Failed to notify Socket.IO about bluetooth update (both direct and proxy):', fallbackErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bluetooth ID updated successfully',
      bluetoothId: updatedUser?.bluetoothId,
      lastSeenBluetooth: updatedUser?.bluetoothIdUpdatedAt
    })

  } catch (error) {
    console.error('Error updating Bluetooth ID:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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
      hasBluetooth: !!currentUser.bluetoothId,
      lastSeenBluetooth: currentUser.bluetoothIdUpdatedAt,
    });

  } catch (error) {
    console.error("Bluetooth status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
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

    // Clear Bluetooth ID and timestamp
    await User.findByIdAndUpdate(
      currentUser._id,
      {
        $unset: {
          bluetoothId: "",
          bluetoothIdUpdatedAt: ""
        },
        lastSeen: new Date()
      }
    );

    // Notify Socket.IO listeners that the user cleared Bluetooth (try direct emit first)
    try {
      const socketPort = process.env.SOCKET_PORT || 3004
      const emitUrl = `http://localhost:${socketPort}/emit`
      await fetch(emitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bluetooth_cleared',
          data: {
            userId: currentUser._id?.toString(),
            timestamp: new Date().toISOString()
          }
        })
      })
    } catch (socketErr) {
      try {
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3003'}/api/socket.io`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'bluetooth_cleared',
            data: {
              userId: currentUser._id?.toString(),
              timestamp: new Date().toISOString()
            }
          })
        })
      } catch (fallbackErr) {
        console.error('Failed to notify Socket.IO about bluetooth clear (both direct and proxy):', fallbackErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bluetooth device cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing Bluetooth ID:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
