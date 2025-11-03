import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'

/**
 * GET /api/settings/location
 * Return current user's location sharing settings and friend list (for selection)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const user = await User.findOne({ email: session.user.email })
      .select('settings friends')
      .populate({ path: 'friends', select: 'username profilePicture' })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({
      success: true,
      settings: user.settings || { locationSharing: true, locationVisibleTo: [] },
      friends: (user.friends || []).map((f: any) => ({
        userId: f._id.toString(),
        username: f.username,
        profilePicture: f.profilePicture || null,
      })),
    })
  } catch (error) {
    console.error('Error getting location settings:', error)
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 })
  }
}

/**
 * POST /api/settings/location
 * Update current user's location sharing settings
 * Body: { locationSharing?: boolean, locationVisibleTo?: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { locationSharing, locationVisibleTo } = body

    await dbConnect()

    const update: any = {}
    if (typeof locationSharing === 'boolean') update['settings.locationSharing'] = locationSharing
    if (Array.isArray(locationVisibleTo)) update['settings.locationVisibleTo'] = locationVisibleTo

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: update },
      { new: true, select: 'settings' }
    )

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({ success: true, settings: user.settings })
  } catch (error) {
    console.error('Error updating location settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
