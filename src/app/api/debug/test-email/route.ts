import { NextRequest, NextResponse } from 'next/server'
import { sendOTPEmail } from '@/lib/email'

/**
 * Admin-only test email endpoint.
 * Protect with header `x-debug-key: <DEBUG_ADMIN_KEY>`.
 * POST body: { email: string, username?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const debugKey = req.headers.get('x-debug-key')
    if (!process.env.DEBUG_ADMIN_KEY) {
      return NextResponse.json({ success: false, error: 'Debug endpoint not enabled (no DEBUG_ADMIN_KEY set)' }, { status: 403 })
    }

    if (!debugKey || debugKey !== process.env.DEBUG_ADMIN_KEY) {
      return NextResponse.json({ success: false, error: 'Invalid debug key' }, { status: 401 })
    }

    const body = await req.json()
    const email = body?.email
    const username = body?.username || 'Test User'

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required in body' }, { status: 400 })
    }

    // Generate a short test OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    const result = await sendOTPEmail(email, username, otp)

    if (!result.success) {
      return NextResponse.json({ success: false, error: 'Failed to send test email', details: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Test email sent', otp }, { status: 200 })
  } catch (err) {
    console.error('debug/test-email error:', err)
    return NextResponse.json({ success: false, error: 'Internal error', details: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
