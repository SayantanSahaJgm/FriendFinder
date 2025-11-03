'use client';

/**
 * Typing Indicator Component
 * Shows when a user is typing
 */

interface TypingIndicatorProps {
  isTyping: boolean;
  userName?: string;
  compact?: boolean;
  className?: string;
}

export default function TypingIndicator({
  isTyping,
  userName,
  compact = false,
  className = '',
}: TypingIndicatorProps) {
  if (!isTyping) return null;

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-sm text-slate-400 ${className}`}>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{userName ? `${userName} is typing...` : 'Typing...'}</span>
    </div>
  );
}
