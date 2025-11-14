'use client';

import { useEffect } from 'react';

/**
 * CacheBuster component - DISABLED
 * Previously forced browser reload in development
 * Disabled to prevent interrupting user sessions
 */
export function CacheBuster() {
  useEffect(() => {
    // Disabled to prevent auto-reload during active sessions
    // This was causing interruptions in video calls and chat sessions
  }, []);

  return null;
}
