'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { detectFace } from '@/ai/flows/face-detection-flow';
import type { FaceVerificationStatus, FaceVerificationResult } from '@/types/random-chat';

interface UseFaceVerificationOptions {
  enabled: boolean;
  checkInterval?: number; // milliseconds, default 10000 (10 seconds)
  maxWarnings?: number; // default 3
  onWarning?: (status: FaceVerificationStatus) => void;
  onDisconnect?: () => void;
  videoElement?: HTMLVideoElement | null;
}

export function useFaceVerification({
  enabled,
  checkInterval = 10000,
  maxWarnings = 3,
  onWarning,
  onDisconnect,
  videoElement,
}: UseFaceVerificationOptions) {
  const [verificationStatus, setVerificationStatus] = useState<FaceVerificationStatus>({
    isVerified: false,
    lastCheckTime: new Date(),
    warningCount: 0,
    maxWarnings,
    checkInterval,
  });

  const [isChecking, setIsChecking] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const captureFrame = useCallback((): string | null => {
    if (!videoElement || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoElement;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) return null;

    // Draw current frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    return canvas.toDataURL('image/jpeg', 0.8);
  }, [videoElement]);

  const verifyFace = useCallback(async (): Promise<FaceVerificationResult> => {
    setIsChecking(true);

    try {
      const photoDataUri = captureFrame();
      
      if (!photoDataUri) {
        return {
          faceDetected: false,
          confidence: 0,
          timestamp: new Date(),
          reason: 'Unable to capture video frame',
          warning: true,
        };
      }

      // Call face detection AI
      const result = await detectFace({ photoDataUri });

      return {
        faceDetected: result.faceDetected,
        confidence: result.confidence || 0,
        timestamp: new Date(),
        reason: result.faceDetected ? 'Face detected successfully' : 'No face detected',
        warning: !result.faceDetected,
      };
    } catch (error) {
      console.error('Face verification failed:', error);
      return {
        faceDetected: false,
        confidence: 0,
        timestamp: new Date(),
        reason: 'Verification service error',
        warning: true,
      };
    } finally {
      setIsChecking(false);
    }
  }, [captureFrame]);

  const performCheck = useCallback(async () => {
    if (!enabled || isChecking || !videoElement) return;

    const result = await verifyFace();

    setVerificationStatus((prev) => {
      const newWarningCount = result.warning
        ? prev.warningCount + 1
        : 0; // Reset warnings on successful verification

      const newStatus: FaceVerificationStatus = {
        isVerified: result.faceDetected,
        lastCheckTime: result.timestamp,
        warningCount: newWarningCount,
        maxWarnings,
        checkInterval,
        confidence: result.confidence,
        reason: result.reason,
      };

      // Trigger warning callback
      if (result.warning && onWarning) {
        onWarning(newStatus);
      }

      // Trigger disconnect if max warnings reached
      if (newWarningCount >= maxWarnings && onDisconnect) {
        console.warn('Max face verification warnings reached. Disconnecting...');
        onDisconnect();
      }

      return newStatus;
    });
  }, [enabled, isChecking, videoElement, verifyFace, maxWarnings, checkInterval, onWarning, onDisconnect]);

  // Start/stop continuous monitoring
  useEffect(() => {
    if (!enabled || !videoElement) {
      // Clear interval if disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial check
    performCheck();

    // Set up interval for continuous monitoring
    intervalRef.current = setInterval(() => {
      performCheck();
    }, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, videoElement, checkInterval, performCheck]);

  // Create canvas element for frame capture
  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
  }, []);

  const manualCheck = useCallback(async () => {
    return await verifyFace();
  }, [verifyFace]);

  const resetWarnings = useCallback(() => {
    setVerificationStatus((prev) => ({
      ...prev,
      warningCount: 0,
    }));
  }, []);

  return {
    verificationStatus,
    isChecking,
    manualCheck,
    resetWarnings,
  };
}
