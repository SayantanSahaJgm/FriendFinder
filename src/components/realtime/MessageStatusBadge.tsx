'use client';

/**
 * Message Status Badge
 * Shows message delivery status
 */

import { Check, CheckCheck, Clock, AlertCircle, Send } from 'lucide-react';
import type { MessageStatus } from '@/services/realtime/RealtimeMessagingService';

interface MessageStatusBadgeProps {
  status: MessageStatus;
  showLabel?: boolean;
  className?: string;
}

export default function MessageStatusBadge({
  status,
  showLabel = false,
  className = '',
}: MessageStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'sending':
        return {
          icon: Clock,
          label: 'Sending',
          color: 'text-gray-400',
          animation: 'animate-pulse',
        };
      case 'sent':
        return {
          icon: Check,
          label: 'Sent',
          color: 'text-gray-400',
          animation: '',
        };
      case 'delivered':
        return {
          icon: CheckCheck,
          label: 'Delivered',
          color: 'text-gray-400',
          animation: '',
        };
      case 'read':
        return {
          icon: CheckCheck,
          label: 'Read',
          color: 'text-blue-500',
          animation: '',
        };
      case 'failed':
        return {
          icon: AlertCircle,
          label: 'Failed',
          color: 'text-red-500',
          animation: '',
        };
      default:
        return {
          icon: Send,
          label: 'Unknown',
          color: 'text-gray-400',
          animation: '',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Icon className={`w-3 h-3 ${config.color} ${config.animation}`} />
      {showLabel && (
        <span className={`text-xs ${config.color}`}>{config.label}</span>
      )}
    </div>
  );
}
