import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'

/**
 * GET /api/location/friends
 * Get locations of user's friends
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const maxDistance = searchParams.get('maxDistance') // in meters
    const onlyOnline = searchParams.get('onlyOnline') === 'true'

    // Connect to database
    await dbConnect()

    // Find current user with friends
    const user = await User.findOne(
      { email: session.user.email },
      'friends location'
    ).populate({
      path: 'friends',
      // include settings so we can honor friends' privacy preferences
      select: 'username profilePicture location lastSeen isOnline status settings',
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get friends with locations
    const currentUserId = user._id.toString()

    const friendsWithLocations = user.friends
      .filter((friend: any) => {
        // Filter out friends without location
        if (!friend.location || !friend.location.coordinates) {
          return false
        }

        // Honor friend's privacy settings: if they disabled location sharing, skip
        if (friend.settings && typeof friend.settings.locationSharing !== 'undefined' && friend.settings.locationSharing === false) {
          return false
        }

        // If friend specified an allow-list, only include if current user is in it
        if (friend.settings && Array.isArray(friend.settings.locationVisibleTo) && friend.settings.locationVisibleTo.length > 0) {
          const allowed = friend.settings.locationVisibleTo.map((id: any) => id.toString())
          if (!allowed.includes(currentUserId)) return false
        }

        // Filter by online status if requested
        if (onlyOnline && !friend.isOnline) {
          return false
        }

        // Filter by distance if user has location and maxDistance is specified
        if (maxDistance && user.location && user.location.coordinates) {
          const distance = calculateDistance(
            user.location.coordinates[1], // user lat
            user.location.coordinates[0], // user lng
            friend.location.coordinates[1], // friend lat
            friend.location.coordinates[0] // friend lng
          )
          return distance <= parseInt(maxDistance)
        }

        return true
      })
      .map((friend: any) => ({
        userId: friend._id.toString(),
        username: friend.username,
        profilePicture: friend.profilePicture || null,
        location: {
          lat: friend.location.coordinates[1],
          lng: friend.location.coordinates[0],
          accuracy: friend.location.accuracy || null,
          lastUpdated: friend.location.lastUpdated,
        },
        isOnline: friend.isOnline || false,
        status: friend.status || 'offline',
        lastSeen: friend.lastSeen,
      }))

    return NextResponse.json({
      success: true,
      friends: friendsWithLocations,
      total: friendsWithLocations.length,
    })
  } catch (error) {
    console.error('Error getting friends locations:', error)
    return NextResponse.json(
      { error: 'Failed to get friends locations' },
      { status: 500 }
    )
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Radius of Earth in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}
