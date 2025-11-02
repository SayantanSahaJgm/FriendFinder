"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { detectFace } from '@/ai/flows/face-detection-flow';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ContinuousFaceMonitorProps {
  videoStream: MediaStream | null;
  isActive: boolean;
  onFaceLost: () => void;
  onFaceRestored: () => void;
  minPresenceDuration?: number; // Minimum seconds user must stay (default: 30)
}

export default function ContinuousFaceMonitor({
  videoStream,
  isActive,
  onFaceLost,
  onFaceRestored,
  minPresenceDuration = 30
}: ContinuousFaceMonitorProps) {
  const [facePresent, setFacePresent] = useState(true);
  const [warnings, setWarnings] = useState(0);
  const [timePresent, setTimePresent] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const presenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check face presence every 3 seconds
  const checkFacePresence = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !videoStream || !isActive) {
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Capture current frame
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const dataUri = canvas.toDataURL('image/jpeg', 0.8);
      const result = await detectFace({ photoDataUri: dataUri });

      if (result.faceDetected && result.confidence > 0.6) {
        // Face is present
        if (!facePresent) {
          setFacePresent(true);
          setWarnings(0);
          toast.success('Face detected - welcome back!', {
            icon: <CheckCircle2 className="h-5 w-5" />
          });
          onFaceRestored();
        }
      } else {
        // Face is missing
        if (facePresent) {
          setFacePresent(false);
          const newWarnings = warnings + 1;
          setWarnings(newWarnings);

          if (newWarnings === 1) {
            toast.warning('Please stay in front of the camera', {
              icon: <AlertTriangle className="h-5 w-5" />
            });
            
            // Give 10 seconds to return before kicking
            warningTimeoutRef.current = setTimeout(() => {
              if (warnings >= 1) {
                toast.error('Face not detected - you will be removed from the call');
                onFaceLost();
              }
            }, 10000);
          } else if (newWarnings >= 2) {
            toast.error('Removing you from call - face not detected');
            onFaceLost();
          }
        }
      }
    } catch (error) {
      console.error('Face monitoring error:', error);
    }
  }, [videoStream, isActive, facePresent, warnings, onFaceLost, onFaceRestored]);

  // Track time present
  useEffect(() => {
    if (!isActive) return;

    presenceTimerRef.current = setInterval(() => {
      setTimePresent(prev => {
        const newTime = prev + 1;
        if (newTime >= minPresenceDuration && !canSkip) {
          setCanSkip(true);
          toast.success('You can now skip to next person', {
            duration: 3000
          });
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (presenceTimerRef.current) {
        clearInterval(presenceTimerRef.current);
      }
    };
  }, [isActive, minPresenceDuration, canSkip]);

  // Start monitoring
  useEffect(() => {
    if (!isActive || !videoStream) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      return;
    }

    // Setup video element
    if (videoRef.current) {
      videoRef.current.srcObject = videoStream;
      videoRef.current.play().catch(console.error);
    }

    // Start checking every 3 seconds
    checkIntervalRef.current = setInterval(checkFacePresence, 3000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [isActive, videoStream, checkFacePresence]);

  if (!isActive) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Hidden video and canvas for monitoring */}
      <video
        ref={videoRef}
        className="hidden"
        autoPlay
        muted
        playsInline
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Status indicator */}
      <div className="bg-background border rounded-lg shadow-lg p-3 space-y-2">
        <div className="flex items-center gap-2">
          {facePresent ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium">Face Detected</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-destructive">
                Face Not Detected ({warnings} warnings)
              </span>
            </>
          )}
        </div>

        {/* Time present counter */}
        <div className="text-xs text-muted-foreground">
          Time: {Math.floor(timePresent / 60)}:{(timePresent % 60).toString().padStart(2, '0')}
          {!canSkip && ` (${minPresenceDuration - timePresent}s until skip)`}
        </div>

        {/* Skip availability */}
        {canSkip && (
          <div className="text-xs text-green-600 dark:text-green-400 font-medium">
            ✓ Can skip to next
          </div>
        )}
      </div>
    </div>
  );
}
