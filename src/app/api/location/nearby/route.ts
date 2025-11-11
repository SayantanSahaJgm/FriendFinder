import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'

/**
 * GET /api/location/nearby
 * Get nearby users who have enabled public location sharing (not friends yet)
 * Similar to Bluetooth discovery
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const maxDistance = parseInt(searchParams.get('maxDistance') || '5000') // Default 5km

    await dbConnect()

    // Find current user
    const currentUser = await User.findOne(
      { email: session.user.email },
      'friends location _id'
    )

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has location
    if (!currentUser.location || !currentUser.location.coordinates) {
      return NextResponse.json({
        success: true,
        nearby: [],
        message: 'Your location is not available',
      })
    }

    const [userLng, userLat] = currentUser.location.coordinates

    // Get friend IDs to exclude
    const friendIds = currentUser.friends.map((id: any) => id.toString())
    const currentUserId = (currentUser._id as any).toString()

    // Find nearby users with public location sharing enabled
    // locationSharing = true or undefined (default to true)
    // locationVisibleTo = [] or undefined (empty array means visible to everyone)
    const nearbyUsers = await User.find({
      _id: { $ne: currentUser._id, $nin: currentUser.friends }, // Not self, not already friends
      'location.coordinates': { $exists: true, $ne: null },
      isDiscoveryEnabled: true,
      $and: [
        {
          $or: [
            { 'settings.locationSharing': { $ne: false } }, // Not explicitly disabled
            { 'settings.locationSharing': { $exists: false } }, // No setting = enabled by default
          ],
        },
        {
          $or: [
            { 'settings.locationVisibleTo': { $exists: false } }, // No restriction
            { 'settings.locationVisibleTo': { $size: 0 } }, // Empty array = public
          ],
        },
      ],
    }).select('username name profilePicture bio location lastSeen isOnline status interests')

    // Filter by distance and format response
    const nearbyWithDistance = nearbyUsers
      .map((user: any) => {
        const [lng, lat] = user.location.coordinates
        const distance = calculateDistance(userLat, userLng, lat, lng)
        
        return {
          userId: user._id.toString(),
          username: user.username,
          name: user.name || user.username,
          bio: user.bio,
          profilePicture: user.profilePicture || null,
          location: {
            lat,
            lng,
            accuracy: user.location.accuracy || null,
            lastUpdated: user.location.lastUpdated,
          },
          distance, // in meters
          isOnline: user.isOnline || false,
          status: user.status || 'offline',
          lastSeen: user.lastSeen,
          interests: user.interests || [],
          // Check if there's a pending request
          isFriend: false,
          hasPendingRequestTo: false,
          hasPendingRequestFrom: false,
        }
      })
      .filter(user => user.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance) // Sort by distance

    console.log(`[Nearby Discovery] Found ${nearbyWithDistance.length} nearby users for ${currentUser.username}`)

    return NextResponse.json({
      success: true,
      nearby: nearbyWithDistance,
      total: nearbyWithDistance.length,
      maxDistance,
    })
  } catch (error) {
    console.error('[Nearby Discovery] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get nearby users' },
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
