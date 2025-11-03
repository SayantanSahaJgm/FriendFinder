'use client';

/**
 * Connection Status Indicator
 * Shows WebSocket connection status with visual feedback
 */

import { useWebSocket } from '@/hooks/useWebSocket';
import { Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';

export interface ConnectionStatusProps {
  showLabel?: boolean;
  compact?: boolean;
  className?: string;
}

export default function ConnectionStatus({
  showLabel = true,
  compact = false,
  className = '',
}: ConnectionStatusProps) {
  const { status, isConnected, connect, disconnect, stats } = useWebSocket();

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          label: 'Connected',
          color: 'text-green-500',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/50',
          pulseColor: 'bg-green-500',
        };
      case 'connecting':
        return {
          icon: RefreshCw,
          label: 'Connecting...',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/50',
          pulseColor: 'bg-yellow-500',
        };
      case 'error':
        return {
          icon: AlertCircle,
          label: 'Connection Error',
          color: 'text-red-500',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/50',
          pulseColor: 'bg-red-500',
        };
      default:
        return {
          icon: WifiOff,
          label: 'Disconnected',
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/20',
          borderColor: 'border-gray-500/50',
          pulseColor: 'bg-gray-500',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`relative flex items-center ${className}`}>
        <div
          className={`w-2 h-2 rounded-full ${config.pulseColor} ${
            status === 'connected' ? 'animate-pulse' : ''
          }`}
        />
        {status === 'connecting' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-3 h-3 border-2 ${config.borderColor} rounded-full animate-spin`} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bgColor} ${config.borderColor}`}
      >
        <Icon
          className={`w-4 h-4 ${config.color} ${
            status === 'connecting' ? 'animate-spin' : ''
          }`}
        />
        {showLabel && <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>}

        {/* Pulse animation for connected state */}
        {status === 'connected' && (
          <div className="absolute -right-1 -top-1">
            <div className={`w-2 h-2 rounded-full ${config.pulseColor} animate-pulse`} />
          </div>
        )}
      </div>

      {/* Reconnect button on error */}
      {status === 'error' && (
        <button
          onClick={connect}
          className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
        >
          Retry
        </button>
      )}

      {/* Manual disconnect button when connected */}
      {status === 'connected' && (
        <button
          onClick={disconnect}
          className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
        >
          Disconnect
        </button>
      )}

      {/* Reconnect attempts indicator */}
      {status === 'connecting' && stats.reconnectAttempt > 0 && (
        <span className="text-xs text-gray-400">
          Attempt {stats.reconnectAttempt}/{stats.maxReconnectAttempts}
        </span>
      )}
    </div>
  );
}
