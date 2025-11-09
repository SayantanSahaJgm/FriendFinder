'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, RefreshCw, Send, Sparkles, Video, XCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { detectFace } from '@/ai/flows/face-detection-flow';
import { detectLiveness } from '@/ai/flows/liveness-detection-flow';
import type { FaceDetectionOutput } from '@/ai/flows/face-detection-types';
import { Progress } from '@/components/ui/progress';

interface SelfieCaptureProps {
    onSelfieCaptured: (dataUri: string) => void;
    onCancel: () => void;
}

type CaptureStatus = 'initializing' | 'previewing' | 'collectingFrames' | 'checkingLiveness' | 'verifying' | 'failed';

export default function SelfieCapture({ onSelfieCaptured, onCancel }: SelfieCaptureProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [status, setStatus] = useState<CaptureStatus>('initializing');
  const [verificationResult, setVerificationResult] = useState<FaceDetectionOutput | null>(null);
  const [progress, setProgress] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [frameCount, setFrameCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
        setStatus('previewing');
            } catch (error) {
                console.error('Error accessing camera:', error);
                setHasCameraPermission(false);
                setStatus('failed');
                toast({
                    variant: 'destructive',
                    title: 'Camera Access Denied',
                    description: 'Please enable camera permissions in your browser settings to use this feature.',
                });
            }
    };

    getCameraPermission();

        return () => {
                if (stream) {
                        stream.getTracks().forEach(track => track.stop());
                }
        }
    }, [toast]);

  const captureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setStatus('collectingFrames');
    setProgress(10);
    setCapturedFrames([]);
    setFrameCount(0);
    
    // Collect 5 frames over 2 seconds for liveness detection
    const frames: string[] = [];
    const totalFrames = 5;
    
    for (let i = 0; i < totalFrames; i++) {
      await new Promise(resolve => setTimeout(resolve, 400)); // 400ms between frames
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) return;

      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUri = canvas.toDataURL('image/jpeg');
      frames.push(dataUri);
      setFrameCount(i + 1);
      setProgress(10 + (i + 1) * 15); // Progress from 10% to 85%
    }
    
    setCapturedFrames(frames);
    
    // Check liveness first
    setStatus('checkingLiveness');
    setProgress(85);

    try {
        console.log('Checking liveness with', frames.length, 'frames...');
        const livenessResult = await detectLiveness({ 
          frames, 
          timestamp: Date.now() 
        });
        console.log('Liveness result:', livenessResult);
        
        if (!livenessResult.isLive || livenessResult.confidence < 0.5) {
          setStatus('failed');
          toast({
            variant: 'destructive',
            title: 'Liveness Check Failed',
            description: livenessResult.reason || 'Please use a live camera, not a photo or video. Move your head slightly and blink.',
          });
          return;
        }
        
        // Liveness passed, now verify face
        setStatus('verifying');
        setProgress(90);
        
        const lastFrame = frames[frames.length - 1];
        console.log('Starting face detection on last frame...');
        const result = await detectFace({ photoDataUri: lastFrame });
        console.log('Face detection result:', result);
        
        setVerificationResult(result);
        setProgress(100);
        
        if (result.faceDetected && result.confidence > 0.6) {
            toast({
                title: 'Live Face Verified!',
                description: `Liveness: ${(livenessResult.confidence * 100).toFixed(0)}% | Face: ${(result.confidence * 100).toFixed(0)}% - Connecting to chat...`,
            });
            // Reduced delay for faster transition
            setTimeout(() => {
                console.log('Calling onSelfieCaptured with last frame');
                onSelfieCaptured(lastFrame);
            }, 300); // Faster callback
        } else {
            setStatus('failed');
            toast({
                variant: 'destructive',
                title: 'Face Verification Failed',
                description: result.reason || 'Please ensure your face is clearly visible and well-lit.',
            });
        }
    } catch (error) {
        console.error('Verification failed:', error);
        setStatus('failed');
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast({
            variant: 'destructive',
            title: 'Verification Error',
            description: errorMessage,
        });
    }
  };

  const renderStatus = () => {
    switch (status) {
        case 'initializing':
            return <p className='flex items-center gap-2'><RefreshCw className="h-4 w-4 animate-spin"/> Initializing camera...</p>;
        case 'previewing':
            return <p>Center your face in the frame and click Capture.</p>;
        case 'collectingFrames':
        case 'verifying':
            return (
                <div className='w-full'>
                    <Progress value={progress} className="w-full mb-2" />
                    <p>{status === 'collectingFrames' ? 'Capturing...' : 'Verifying with AI...'}</p>
                </div>
            );
        case 'failed':
            return (
                <Alert variant="destructive">
                    <XCircle className="h-4 w-4"/>
                    <AlertTitle>Verification Failed</AlertTitle>
                    <AlertDescription>{verificationResult?.reason || 'Please try again.'}</AlertDescription>
                </Alert>
            );
        default:
            return null;
    }
  }

  return (
    <Card className="w-full max-w-md">
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <Camera className='h-6 w-6' />
                Video Chat Verification
            </CardTitle>
            <CardDescription>
                To ensure a safe community, we need to quickly verify your face before connecting.
            </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
            <div className="w-full aspect-video bg-secondary rounded-md overflow-hidden relative flex items-center justify-center">
                 <video ref={videoRef} className={`w-full aspect-video rounded-md transition-opacity duration-300 ${status === 'previewing' ? 'opacity-100' : 'opacity-60'}`} autoPlay muted playsInline />
                 {status !== 'previewing' && <div className="absolute inset-0 bg-black/20" />}
                 {hasCameraPermission === false && <p className='text-destructive-foreground'>Camera not available.</p>}
            </div>
            
            <canvas ref={canvasRef} className="hidden" />

            <div className='w-full text-center p-2 bg-muted/50 rounded-md min-h-[4rem] flex items-center justify-center'>
               {renderStatus()}
            </div>

            <div className='w-full flex flex-col gap-2'>
                {status === 'failed' ? (
                     <Button onClick={() => setStatus('previewing')} className="w-full" size="lg">
                        <RefreshCw className="mr-2 h-5 w-5" /> Try Again
                    </Button>
                ) : (
                    <Button onClick={captureAndVerify} disabled={status !== 'previewing'} className="w-full" size="lg">
                        {status === 'verifying' ? <RefreshCw className="animate-spin mr-2 h-5 w-5"/> : <Send className="mr-2 h-5 w-5" />}
                        Capture & Connect
                    </Button>
                )}
                <Button variant="outline" onClick={onCancel} className="w-full" size="lg">Cancel</Button>
            </div>
        </CardContent>
    </Card>
  );
}
