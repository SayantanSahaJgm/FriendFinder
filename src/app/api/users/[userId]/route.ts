import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'
import { Types } from 'mongoose'

/**
 * GET /api/users/[userId]
 * Returns a public view of the requested user's profile if the caller is
 * authorized (self or friend). Mirrors privacy rules used in status endpoint.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await params

    if (!Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    await dbConnect()

    const currentUser = await User.findOne({ email: session.user.email })
    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 })
    }

    const targetUser = await User.findById(userId)
      .select('username bio profilePicture location createdAt lastSeen isDiscoveryEnabled')
      .lean()

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isFriend = currentUser.friends.some(fid => fid.toString() === userId)

    // Only show sensitive fields (like precise location) to self or friends.
    // However, allow a minimal public view (username + profilePicture) to everyone so
    // user avatars are visible in the UI even when discovery is disabled.
    const isSelf = currentUser._id?.toString() === userId

    const publicUser = {
      id: targetUser._id?.toString(),
      username: targetUser.username,
      profilePicture: targetUser.profilePicture || null,
      bio: targetUser.bio || null,
      isDiscoveryEnabled: !!targetUser.isDiscoveryEnabled,
      isFriend: !!isFriend,
    }

    // If requester is self or friend, include non-public fields
    if (isSelf || isFriend) {
      return NextResponse.json({
        success: true,
        user: {
          ...publicUser,
          location: (targetUser.location || null),
          createdAt: targetUser.createdAt ? new Date(targetUser.createdAt).toISOString() : null,
          lastSeen: targetUser.lastSeen ? new Date(targetUser.lastSeen).toISOString() : null,
        },
      })
    }

    // Otherwise return the limited public view so avatars are visible in the UI
    return NextResponse.json({ success: true, user: publicUser })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
