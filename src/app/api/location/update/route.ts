import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'

/**
 * POST /api/location/update
 * Update user's current location
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const { latitude, longitude, accuracy } = await req.json()

    // Validate coordinates
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      )
    }

    // Connect to database
    await dbConnect()

    // Update user location
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          location: {
            type: 'Point',
            coordinates: [longitude, latitude], // GeoJSON: [lng, lat]
            accuracy: accuracy || null,
            lastUpdated: new Date(),
          },
          lastSeen: new Date(),
        },
      },
      { new: true, select: 'username location lastSeen' }
    )

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Emit Socket.IO event to notify friends
    try {
      const io = (global as any).socketIO
      if (io && user.location) {
        // Emit to user's friends
        io.to(`user:${user._id.toString()}`).emit('location:updated', {
          userId: user._id.toString(),
          username: user.username,
          location: {
            lat: latitude,
            lng: longitude,
            accuracy: accuracy || null,
          },
          timestamp: new Date().toISOString(),
        })

        console.log(`Location updated for user ${user.username}`)
      }
    } catch (socketError) {
      console.error('Error emitting location update:', socketError)
      // Don't fail the request if Socket.IO fails
    }

    return NextResponse.json({
      success: true,
      location: {
        lat: latitude,
        lng: longitude,
        accuracy: accuracy || null,
        lastUpdated: user.location?.lastUpdated,
      },
    })
  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/location/update
 * Get user's current location
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

    // Connect to database
    await dbConnect()

    // Get user location
    const user = await User.findOne(
      { email: session.user.email },
      'location lastSeen'
    )

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.location) {
      return NextResponse.json({
        success: true,
        location: null,
      })
    }

    return NextResponse.json({
      success: true,
      location: {
        lat: user.location.coordinates[1],
        lng: user.location.coordinates[0],
        accuracy: user.location.accuracy || null,
        lastUpdated: user.location.lastUpdated,
      },
    })
  } catch (error) {
    console.error('Error getting location:', error)
    return NextResponse.json(
      { error: 'Failed to get location' },
      { status: 500 }
    )
  }
}
