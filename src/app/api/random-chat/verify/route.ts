import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'
import RandomChatSession from '@/models/RandomChatSession'
import { verifyFace } from '@/ai/flows/verify-face'
import crypto from 'crypto'

const VERIFICATION_SECRET = process.env.VERIFICATION_SECRET || process.env.NEXTAUTH_SECRET || 'dev-verif-secret'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, anonymousId, photoDataUri } = body

    if (!sessionId || !photoDataUri) {
      return NextResponse.json({ success: false, error: 'sessionId and photoDataUri required' }, { status: 400 })
    }

    // Run DB connect and verification
    await dbConnect()

    const result = await verifyFace({ photoDataUri })

    const isVerified = !!result?.isFaceDetected && (typeof result.confidence !== 'number' || result.confidence >= 0.5)

    // Create a compact HMAC-SHA256 signed token (header.payload.signature)
    const header = { alg: 'HS256', typ: 'JWT' }
    const payload = {
      sessionId,
      anonymousId: anonymousId || null,
      isVerified,
      confidence: result?.confidence ?? null,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30, // 30s expiry
    }

    const base64url = (obj: any) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const headerB = base64url(header)
    const payloadB = base64url(payload)
    const toSign = `${headerB}.${payloadB}`
    const signature = crypto.createHmac('sha256', VERIFICATION_SECRET).update(toSign).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const signedToken = `${toSign}.${signature}`

    // Persist verification event in session
    try {
      const session = await RandomChatSession.findOne({ sessionId })
      if (session) {
        const eventId = new (require('mongoose')).Types.ObjectId().toString()
        session.verifications = session.verifications || []
        session.verifications.push({
          eventId,
          anonymousId: anonymousId || null,
          isVerified,
          confidence: result?.confidence ?? null,
          timestamp: new Date(),
          signedToken,
        })
        await session.save()
      }
    } catch (persistErr) {
      console.error('Failed to persist verification event', persistErr)
    }

    // Broadcast to session via global socketIO if available
    try {
      const io = (global as any).socketIO
      const payload = {
        sessionId,
        anonymousId: anonymousId || null,
        isVerified,
        confidence: result?.confidence ?? null,
        timestamp: Date.now(),
        signedToken,
      }
      if (io) {
        io.to(`random-chat:${sessionId}`).emit('random-chat:partner-verified', payload)
      }
    } catch (bErr) {
      console.error('Broadcast error', bErr)
    }

    return NextResponse.json({ success: true, data: { isVerified, confidence: result?.confidence ?? null, signedToken } })
  } catch (err) {
    console.error('Verification API error', err)
    return NextResponse.json({ success: false, error: 'internal_error' }, { status: 500 })
  }
}

