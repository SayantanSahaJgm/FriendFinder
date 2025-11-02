'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Video, VideoOff, RefreshCw, X, Camera, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFaceVerification } from '@/hooks/useFaceVerification';
import type { RandomChatSession } from '@/types/random-chat';
import { cn } from '@/lib/utils';

interface VideoChatProps {
    session: RandomChatSession | null;
    onNext: () => void;
    onStop: () => void;
}

export default function VideoChat({ session, onNext, onStop }: VideoChatProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const [callDuration, setCallDuration] = useState(0);
  
  // Face verification hook with continuous monitoring
  const {
    verificationStatus,
    isChecking,
  } = useFaceVerification({
    enabled: hasCameraPermission === true,
    checkInterval: 10000, // Check every 10 seconds
    maxWarnings: 3,
    videoElement: myVideoRef.current,
    onWarning: (status) => {
      const remainingWarnings = status.maxWarnings - status.warningCount;
      toast({
        variant: 'destructive',
        title: 'Face Verification Warning',
        description: `Please show your face clearly. ${remainingWarnings} warning(s) remaining before disconnect.`,
      });
    },
    onDisconnect: () => {
      toast({
        variant: 'destructive',
        title: 'Disconnected',
        description: 'You were disconnected due to face verification failure.',
      });
      onStop();
    },
  });

  useEffect(() => {
    if (!session) return;

    let stream: MediaStream | null = null;
    let durationInterval: NodeJS.Timeout | null = null;

    const getCameraPermission = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }, 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          }
        });
        
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);

        // Start call duration timer
        durationInterval = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();

    return () => {
        // Stop all tracks on cleanup
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (durationInterval) {
            clearInterval(durationInterval);
        }
    }
  }, [session, toast]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full h-full flex flex-col relative overflow-hidden">
      {/* Face Verification Status Bar */}
      {hasCameraPermission && (
        <div className={cn(
          "absolute top-0 left-0 right-0 z-10 p-3 backdrop-blur-sm border-b transition-colors",
          verificationStatus.isVerified 
            ? "bg-green-500/20 border-green-500/30" 
            : verificationStatus.warningCount > 0
            ? "bg-red-500/20 border-red-500/30"
            : "bg-yellow-500/20 border-yellow-500/30"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className={cn(
                "h-5 w-5",
                verificationStatus.isVerified ? "text-green-500" : "text-yellow-500"
              )} />
              <span className="text-sm font-medium">
                {isChecking ? (
                  'Verifying face...'
                ) : verificationStatus.isVerified ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Face Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Please show your face
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {verificationStatus.warningCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {verificationStatus.warningCount}/{verificationStatus.maxWarnings} Warnings
                </Badge>
              )}
              <Badge variant="outline">
                {formatDuration(callDuration)}
              </Badge>
            </div>
          </div>
          
          {/* Verification Progress */}
          {isChecking && (
            <Progress value={50} className="h-1 mt-2" />
          )}
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 md:grid-cols-2 gap-2 p-2 pt-16">
        {/* Remote Video */}
        <div className="relative bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
          <video ref={remoteVideoRef} className="w-full h-full object-cover" autoPlay playsInline />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
              <VideoOff className="h-12 w-12 mb-4" />
              <p className="font-semibold">{session?.partner?.username || 'Stranger'}</p>
              <p className="text-sm text-center">Waiting for video connection...</p>
          </div>
          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-sm flex items-center gap-2">
            {session?.isAIBot && <span>🤖</span>}
            {session?.partner?.username || 'Stranger'}
          </div>
        </div>
        
        {/* Local Video */}
        <div className="relative bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
          {hasCameraPermission === null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-secondary-foreground">
                <Camera className="h-12 w-12 mb-4 animate-pulse" />
                <p>Starting your camera...</p>
            </div>
          )}
          <video ref={myVideoRef} className={`w-full h-full object-cover transition-opacity ${hasCameraPermission ? 'opacity-100' : 'opacity-0'}`} autoPlay muted playsInline />
          {hasCameraPermission === false && (
            <Alert variant="destructive" className="absolute m-4 max-w-sm">
              <Video className="h-4 w-4" />
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Please allow camera access to use this feature.
              </AlertDescription>
            </Alert>
          )}
          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-sm">You (Mirror)</div>
          
          {/* Face Verification Overlay */}
          {hasCameraPermission && !verificationStatus.isVerified && verificationStatus.warningCount > 0 && (
            <div className="absolute inset-0 border-4 border-red-500 animate-pulse" />
          )}
        </div>
      </div>
      
      <div className="flex justify-center items-center p-4 gap-4 bg-background border-t">
        <Button onClick={onStop} variant="destructive" size="lg" className="rounded-full h-14 w-28 text-base">
            <X className="h-5 w-5 mr-2" /> Stop
        </Button>
        <Button onClick={onNext} size="lg" className="rounded-full h-14 w-28 text-base">
            <RefreshCw className="h-5 w-5 mr-2" /> Next
        </Button>
      </div>
    </Card>
  );
}
