'use client';

import { useEffect } from 'react';

/**
 * CacheBuster component for development
 * Forces browser to reload when code changes
 */
export function CacheBuster() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Add version timestamp to prevent caching
      const version = Date.now();
      
      // Store version in sessionStorage
      const storedVersion = sessionStorage.getItem('app_version');
      
      if (storedVersion && parseInt(storedVersion) < version - 5000) {
        // If stored version is older than 5 seconds, force reload
        console.log('🔄 Detecting new code version, reloading...');
        sessionStorage.setItem('app_version', version.toString());
        window.location.reload();
      } else {
        sessionStorage.setItem('app_version', version.toString());
      }
    }
  }, []);

  return null;
}
