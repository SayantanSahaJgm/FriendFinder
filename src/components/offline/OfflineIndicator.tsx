'use client';

import { useEffect, useState } from 'react';
import { networkStatusService } from '@/services/offlineSync/NetworkStatusService';
import { WifiOff, Wifi, Cloud, CloudOff, AlertCircle } from 'lucide-react';

interface OfflineIndicatorProps {
  queueLength?: number;
  showDetails?: boolean;
}

export default function OfflineIndicator({ queueLength = 0, showDetails = false }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [effectiveType, setEffectiveType] = useState<string | undefined>();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Subscribe to network status changes
    const unsubscribe = networkStatusService.subscribe((status) => {
      setIsOnline(status.isOnline);
      setEffectiveType(status.effectiveType);
      
      // Show banner when going offline
      if (!status.isOnline) {
        setShowBanner(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-hide banner after 5 seconds when coming back online
  useEffect(() => {
    if (isOnline && showBanner) {
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, showBanner]);

  // Don't show anything if online and no banner to display
  if (isOnline && !showBanner) {
    return null;
  }

  const getConnectionQuality = () => {
    if (!isOnline) return 'offline';
    if (!effectiveType) return 'online';
    
    switch (effectiveType) {
      case '4g':
        return 'excellent';
      case '3g':
        return 'good';
      case '2g':
      case 'slow-2g':
        return 'poor';
      default:
        return 'online';
    }
  };

  const quality = getConnectionQuality();

  const getIcon = () => {
    if (!isOnline) {
      return <WifiOff className="w-5 h-5" />;
    }
    
    if (quality === 'poor') {
      return <AlertCircle className="w-5 h-5" />;
    }
    
    return <Wifi className="w-5 h-5" />;
  };

  const getMessage = () => {
    if (!isOnline) {
      return queueLength > 0
        ? `You're offline. ${queueLength} message${queueLength > 1 ? 's' : ''} will be sent when you reconnect.`
        : "You're offline. Some features may be unavailable.";
    }

    if (quality === 'poor') {
      return 'Slow connection detected. Some features may be limited.';
    }

    return queueLength > 0
      ? `Connection restored! Syncing ${queueLength} pending message${queueLength > 1 ? 's' : ''}...`
      : 'Connection restored!';
  };

  const getBackgroundColor = () => {
    if (!isOnline) {
      return 'bg-red-500/90 dark:bg-red-600/90';
    }
    
    if (quality === 'poor') {
      return 'bg-yellow-500/90 dark:bg-yellow-600/90';
    }
    
    return 'bg-green-500/90 dark:bg-green-600/90';
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 ${getBackgroundColor()} text-white px-4 py-3 shadow-lg transition-all duration-300 ${
        showBanner ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <p className="text-sm font-medium">{getMessage()}</p>
            {showDetails && !isOnline && (
              <p className="text-xs mt-1 opacity-90">
                Messages and actions will be queued and sent automatically when you reconnect.
              </p>
            )}
          </div>
        </div>

        {isOnline && (
          <button
            onClick={() => setShowBanner(false)}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
