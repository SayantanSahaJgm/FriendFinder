import { NextRequest, NextResponse } from 'next/server';

// This is a placeholder route to indicate Socket.IO is available
// The actual Socket.IO server runs in server.js
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'Socket.IO server should be running',
    message: 'Socket.IO is served from the standalone server.js',
    path: '/socket.io/',
    note: 'This is a status endpoint only. Connect to /socket.io/ for real-time features.'
  });
}
