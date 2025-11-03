/**
 * Loading States Components
 * Reusable loading indicators for different contexts
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ==================== Spinner ====================

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const spinnerSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin text-blue-600', spinnerSizes[size], className)}
    />
  );
}

// ==================== Full Page Loading ====================

interface PageLoadingProps {
  message?: string;
  className?: string;
}

export function PageLoading({ message = 'Loading...', className }: PageLoadingProps) {
  return (
    <div className={cn('min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900', className)}>
      <div className="text-center space-y-4">
        <Spinner size="xl" />
        <p className="text-lg text-gray-600 dark:text-gray-300">{message}</p>
      </div>
    </div>
  );
}

// ==================== Card Loading ====================

interface CardLoadingProps {
  message?: string;
  className?: string;
}

export function CardLoading({ message = 'Loading...', className }: CardLoadingProps) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="text-center space-y-3">
        <Spinner size="lg" />
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

// ==================== Inline Loading ====================

interface InlineLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function InlineLoading({ message, size = 'sm', className }: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Spinner size={size} />
      {message && (
        <span className="text-sm text-gray-600 dark:text-gray-400">{message}</span>
      )}
    </div>
  );
}

// ==================== Skeleton ====================

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-gray-700',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded h-4',
        variant === 'rectangular' && 'rounded-md',
        className
      )}
      style={{ width, height }}
    />
  );
}

// ==================== Skeleton Group ====================

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
      <Skeleton variant="rectangular" height={200} />
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="40%" />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="60%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="space-y-6">
      {/* Avatar and name */}
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={80} height={80} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="50%" height={24} />
          <Skeleton variant="text" width="30%" />
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="70%" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="rectangular" height={60} />
      </div>
    </div>
  );
}

// ==================== Button Loading ====================

interface ButtonLoadingProps {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
  [key: string]: any;
}

export function ButtonWithLoading({
  children,
  isLoading = false,
  loadingText,
  disabled,
  className,
  ...props
}: ButtonLoadingProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'relative',
        (disabled || isLoading) && 'opacity-60 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {isLoading && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Spinner size="sm" />
        </span>
      )}
      <span className={cn(isLoading && 'invisible')}>
        {isLoading && loadingText ? loadingText : children}
      </span>
    </button>
  );
}

// ==================== Progress Bar ====================

interface ProgressBarProps {
  progress: number; // 0-100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const progressSizes = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export function ProgressBar({
  progress,
  showLabel = false,
  size = 'md',
  className,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={cn('space-y-1', className)}>
      <div className={cn('w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden', progressSizes[size])}>
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-xs text-gray-600 dark:text-gray-400 text-right">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  );
}

// ==================== Dots Loading ====================

interface DotsLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const dotSizes = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-3 h-3',
};

export function DotsLoading({ size = 'md', className }: DotsLoadingProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full bg-blue-600 animate-bounce',
            dotSizes[size]
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  );
}

// ==================== Pulse Loading ====================

interface PulseLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const pulseSizes = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

export function PulseLoading({ size = 'md', className }: PulseLoadingProps) {
  return (
    <div className={cn('relative', pulseSizes[size], className)}>
      <div className={cn('absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-75', pulseSizes[size])} />
      <div className={cn('relative rounded-full bg-blue-600', pulseSizes[size])} />
    </div>
  );
}

export default {
  Spinner,
  PageLoading,
  CardLoading,
  InlineLoading,
  Skeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonProfile,
  ButtonWithLoading,
  ProgressBar,
  DotsLoading,
  PulseLoading,
};
