import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await request.json()
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    await dbConnect()

    const currentUser = await User.findOne({ email: session.user.email })
    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 })
    }

    // Find target user with matching pairing code and not expired
    const now = new Date()
    console.log('🔍 [Bluetooth Pair] Searching for code:', code, 'Current time:', now.toISOString())
    
    const targetUser = await User.findOne({ pairingCode: code, pairingCodeExpires: { $gt: now } })
    
    if (!targetUser) {
      // Debug: check if code exists at all
      const userWithCode = await User.findOne({ pairingCode: code })
      if (userWithCode) {
        console.log('❌ [Bluetooth Pair] Code found but expired. Code expiry:', userWithCode.pairingCodeExpires?.toISOString(), 'Current time:', now.toISOString())
        if (userWithCode.pairingCodeExpires) {
          console.log('❌ [Bluetooth Pair] Time difference (ms):', userWithCode.pairingCodeExpires.getTime() - now.getTime())
        } else {
          console.log('❌ [Bluetooth Pair] pairingCodeExpires is not set')
        }
      } else {
        console.log('❌ [Bluetooth Pair] Code not found in database:', code)
      }
      return NextResponse.json({ error: 'Pairing code not found or expired' }, { status: 404 })
    }
    
    console.log('✅ [Bluetooth Pair] Found target user:', targetUser.username, 'Code expires:', targetUser.pairingCodeExpires?.toISOString())

    // Prevent sending to self
    if ((currentUser._id as mongoose.Types.ObjectId).equals(targetUser._id as mongoose.Types.ObjectId)) {
      return NextResponse.json({ error: 'Cannot pair with yourself' }, { status: 400 })
    }

    // Check existing friendship or pending requests
    if (currentUser.isFriendWith(targetUser._id as mongoose.Types.ObjectId)) {
      return NextResponse.json({ error: 'Already friends' }, { status: 400 })
    }
    if (currentUser.hasPendingRequestTo(targetUser._id as mongoose.Types.ObjectId)) {
      return NextResponse.json({ error: 'Friend request already sent' }, { status: 400 })
    }

    // Create friend request (reuse logic similar to /api/friends/request)
    const newRequestId = new mongoose.Types.ObjectId()
    const newFriendRequest = {
      _id: newRequestId,
      from: currentUser._id as mongoose.Types.ObjectId,
      fromName: currentUser.username,
      fromAvatar: currentUser.profilePicture,
      to: targetUser._id as mongoose.Types.ObjectId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    targetUser.friendRequests.push(newFriendRequest as any)
    await targetUser.save()

    const sentRequest = {
      _id: newRequestId,
      from: currentUser._id as mongoose.Types.ObjectId,
      fromName: currentUser.username,
      fromAvatar: currentUser.profilePicture,
      to: targetUser._id as mongoose.Types.ObjectId,
      toName: targetUser.username,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    currentUser.sentRequests.push(sentRequest as any)
    await currentUser.save()

    // Clear target user's pairing code to avoid reuse
    targetUser.pairingCode = undefined
    targetUser.pairingCodeExpires = undefined
    await targetUser.save()

    // Emit a realtime notification to the target user (if socket server available)
    try {
      const socketPort = process.env.SOCKET_PORT || 3004
      const emitUrl = `http://localhost:${socketPort}/emit`
      const payload = {
        type: 'friend_request_received',
        targetUserId: targetUser._id?.toString(),
        data: {
          requestId: newRequestId.toString(),
          from: currentUser._id?.toString(),
          fromName: currentUser.username,
          fromAvatar: currentUser.profilePicture,
          message: `${currentUser.username} sent you a friend request`,
          timestamp: new Date().toISOString()
        }
      }

      await fetch(emitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (emitErr) {
      // Fallback: try proxying via Next.js socket API
      try {
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3003'}/api/socket.io`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'friend_request_received',
            data: {
              requestId: newRequestId.toString(),
              from: currentUser._id?.toString(),
              fromName: currentUser.username,
              fromAvatar: currentUser.profilePicture,
              message: `${currentUser.username} sent you a friend request`,
              timestamp: new Date().toISOString()
            }
          })
        })
      } catch (proxyErr) {
        console.error('Failed to emit friend_request notification (direct and proxy):', proxyErr)
      }
    }

    return NextResponse.json({ success: true, message: 'Friend request sent via pairing code', requestId: newRequestId.toString() })
  } catch (error) {
    console.error('Pairing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
