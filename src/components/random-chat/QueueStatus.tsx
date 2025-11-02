"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  Users, 
  Loader2, 
  X,
} from "lucide-react";
import type { QueueStatus as QueueStatusType } from "@/context/RandomChatContext";

interface QueueStatusProps {
  queueStatus: QueueStatusType;
  onLeaveQueue: () => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
}

export default function QueueStatus({ 
  queueStatus, 
  onLeaveQueue, 
  isLoading 
}: QueueStatusProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progress, setProgress] = useState(0);

  // Calculate elapsed time since joining queue
  useEffect(() => {
    if (!queueStatus.joinedAt) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(queueStatus.joinedAt!).getTime()) / 1000);
      setElapsedTime(elapsed);
      
      // Calculate progress (assuming max wait time of 5 minutes)
      const maxWaitTime = 300; // 5 minutes
      const progressPercent = Math.min((elapsed / maxWaitTime) * 100, 100);
      setProgress(progressPercent);
    }, 1000);

    return () => clearInterval(interval);
  }, [queueStatus.joinedAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatEstimatedWait = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className="space-y-4">
      {/* Status Messages - Centered */}
      <div className="space-y-4 text-center">
        {elapsedTime < 30 && (
          <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
            <span>Looking for the perfect match...</span>
          </div>
        )}
        
        {elapsedTime >= 30 && elapsedTime < 120 && (
          <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
            <span>Expanding search criteria to find you a match...</span>
          </div>
        )}
        
        {elapsedTime >= 120 && (
          <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
            <span>Still searching... Thanks for your patience!</span>
          </div>
        )}
      </div>
    </div>
  );
}