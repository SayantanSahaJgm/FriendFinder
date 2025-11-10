'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Video, VideoOff, RefreshCw, X, Camera, Shield, AlertTriangle, CheckCircle2, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFaceVerification } from '@/hooks/useFaceVerification';
import { useSocket } from '@/hooks/useSocket';
import type { RandomChatSession } from '@/types/random-chat';
import { cn } from '@/lib/utils';

interface VideoChatProps {
    session: RandomChatSession | null;
    onNext: () => void;
    onStop: () => void;
}

// WebRTC configuration with STUN servers for NAT traversal
const rtcConfiguration: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export default function VideoChat({ session, onNext, onStop }: VideoChatProps) {
  const { socket } = useSocket();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [remoteStreamConnected, setRemoteStreamConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const [callDuration, setCallDuration] = useState(0);
  const isInitiatorRef = useRef(false);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  
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

  // Create and manage peer connection
  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const pc = new RTCPeerConnection(rtcConfiguration);
    peerConnectionRef.current = pc;

    // Add local stream tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setRemoteStreamConnected(true);
        toast({
          title: 'Connected!',
          description: 'Video connection established with stranger.',
        });
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && session) {
        console.log('[WebRTC] Sending ICE candidate');
        socket.emit('random-chat:webrtc-ice-candidate', {
          sessionId: session.sessionId,
          candidate: event.candidate,
        });
      }
    };

    // Monitor connection state
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      setConnectionState(pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        toast({
          title: 'Video Connected',
          description: 'You are now in a video call with a stranger.',
        });
      } else if (pc.connectionState === 'failed') {
        toast({
          variant: 'destructive',
          title: 'Connection Failed',
          description: 'Failed to establish video connection. Trying to reconnect...',
        });
        // Attempt ICE restart
        createOffer(true);
      } else if (pc.connectionState === 'disconnected') {
        setRemoteStreamConnected(false);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
    };

    return pc;
  }, [socket, session, toast]);

  // Create and send offer (perfect negotiation pattern)
  const createOffer = useCallback(async (iceRestart = false) => {
    if (!peerConnectionRef.current || !socket || !session) return;

    try {
      makingOfferRef.current = true;
      await peerConnectionRef.current.setLocalDescription(
        await peerConnectionRef.current.createOffer({ iceRestart })
      );
      
      console.log('[WebRTC] Sending offer');
      socket.emit('random-chat:webrtc-offer', {
        sessionId: session.sessionId,
        offer: peerConnectionRef.current.localDescription,
      });
    } catch (err) {
      console.error('[WebRTC] Error creating offer:', err);
    } finally {
      makingOfferRef.current = false;
    }
  }, [socket, session]);

  // Handle incoming offer
  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;
    const pc = peerConnectionRef.current;

    try {
      const offerCollision = makingOfferRef.current || pc.signalingState !== 'stable';
      ignoreOfferRef.current = !isInitiatorRef.current && offerCollision;

      if (ignoreOfferRef.current) {
        console.log('[WebRTC] Ignoring offer due to collision');
        return;
      }

      console.log('[WebRTC] Received offer, creating answer');
      await pc.setRemoteDescription(offer);
      await pc.setLocalDescription(await pc.createAnswer());

      if (socket && session) {
        socket.emit('random-chat:webrtc-answer', {
          sessionId: session.sessionId,
          answer: pc.localDescription,
        });
      }
    } catch (err) {
      console.error('[WebRTC] Error handling offer:', err);
    }
  }, [socket, session]);

  // Handle incoming answer
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;

    try {
      console.log('[WebRTC] Received answer');
      await peerConnectionRef.current.setRemoteDescription(answer);
    } catch (err) {
      console.error('[WebRTC] Error handling answer:', err);
    }
  }, []);

  // Handle incoming ICE candidate
  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) return;

    try {
      console.log('[WebRTC] Adding ICE candidate');
      await peerConnectionRef.current.addIceCandidate(candidate);
    } catch (err) {
      console.error('[WebRTC] Error adding ICE candidate:', err);
    }
  }, []);

  useEffect(() => {
    if (!session || !socket) return;

    let durationInterval: NodeJS.Timeout | null = null;

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }, 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
        
        localStreamRef.current = stream;
        
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);

        // Start call duration timer
        durationInterval = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);

        // Create peer connection after getting local stream
        createPeerConnection();

        // Determine if we should initiate (based on session IDs or random)
        // Lower ID initiates to avoid both sides waiting
        isInitiatorRef.current = (session.userAnonymousId || '') < (session.partner?.anonymousId || '');
        
        if (isInitiatorRef.current) {
          console.log('[WebRTC] I am the initiator, creating offer...');
          setTimeout(() => createOffer(), 1000); // Small delay to ensure both peers are ready
        }
        
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to use video chat.',
        });
      }
    };

    getCameraPermission();

    // Socket event listeners for WebRTC signaling
    socket.on('random-chat:webrtc-offer-received', (data: any) => {
      console.log('[WebRTC] Offer received from peer');
      handleOffer(data.offer);
    });

    socket.on('random-chat:webrtc-answer-received', (data: any) => {
      console.log('[WebRTC] Answer received from peer');
      handleAnswer(data.answer);
    });

    socket.on('random-chat:webrtc-ice-candidate-received', (data: any) => {
      console.log('[WebRTC] ICE candidate received from peer');
      handleIceCandidate(data.candidate);
    });

    return () => {
      // Cleanup: stop tracks and close peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      if (durationInterval) {
        clearInterval(durationInterval);
      }

      // Remove socket listeners
      socket.off('random-chat:webrtc-offer-received');
      socket.off('random-chat:webrtc-answer-received');
      socket.off('random-chat:webrtc-ice-candidate-received');

      setRemoteStreamConnected(false);
      setConnectionState('closed');
    };
  }, [session, socket, toast, createPeerConnection, createOffer, handleOffer, handleAnswer, handleIceCandidate]);

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
        {/* Remote Video (Stranger) */}
        <div className="relative bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
          <video 
            ref={remoteVideoRef} 
            className={cn(
              "w-full h-full object-cover transition-opacity",
              remoteStreamConnected ? "opacity-100" : "opacity-0"
            )} 
            autoPlay 
            playsInline 
          />
          {!remoteStreamConnected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/20 to-blue-900/20 text-white p-4">
              {connectionState === 'connecting' ? (
                <>
                  <div className="relative">
                    <VideoOff className="h-16 w-16 mb-4 animate-pulse" />
                    <div className="absolute -inset-2 border-4 border-purple-500 rounded-full animate-ping" />
                  </div>
                  <p className="font-semibold text-lg mb-2">Connecting to stranger...</p>
                  <p className="text-sm text-center opacity-75">Establishing peer-to-peer connection</p>
                  <Progress value={50} className="w-48 mt-4" />
                </>
              ) : connectionState === 'failed' ? (
                <>
                  <WifiOff className="h-16 w-16 mb-4 text-red-400" />
                  <p className="font-semibold text-lg mb-2 text-red-400">Connection Failed</p>
                  <p className="text-sm text-center opacity-75">Unable to establish connection</p>
                </>
              ) : (
                <>
                  <VideoOff className="h-16 w-16 mb-4" />
                  <p className="font-semibold text-lg">{session?.partner?.username || 'Stranger'}</p>
                  <p className="text-sm text-center">Waiting for video...</p>
                  <Badge variant="secondary" className="mt-3">
                    {connectionState === 'new' ? 'Initializing' : connectionState}
                  </Badge>
                </>
              )}
            </div>
          )}
          <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 shadow-lg">
            {session?.isAIBot && <span>🤖</span>}
            <span className="font-medium">{session?.partner?.username || 'Stranger'}</span>
            {remoteStreamConnected && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            )}
          </div>
        </div>
        
        {/* Local Video (You) */}
        <div className="relative bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
          {hasCameraPermission === null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-secondary-foreground bg-gradient-to-br from-indigo-900/20 to-purple-900/20">
                <Camera className="h-16 w-16 mb-4 animate-pulse" />
                <p className="font-semibold">Starting your camera...</p>
                <Progress value={30} className="w-48 mt-4" />
            </div>
          )}
          <video 
            ref={myVideoRef} 
            className={cn(
              "w-full h-full object-cover transition-opacity scale-x-[-1]",
              hasCameraPermission ? 'opacity-100' : 'opacity-0'
            )} 
            autoPlay 
            muted 
            playsInline 
          />
          {hasCameraPermission === false && (
            <Alert variant="destructive" className="absolute m-4 max-w-sm">
              <Video className="h-4 w-4" />
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Please allow camera access to use video chat.
              </AlertDescription>
            </Alert>
          )}
          <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
            You (Mirror View)
          </div>
          
          {/* Face Verification Overlay */}
          {hasCameraPermission && !verificationStatus.isVerified && verificationStatus.warningCount > 0 && (
            <div className="absolute inset-0 border-4 border-red-500 animate-pulse rounded-lg">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg">
                ⚠️ Show your face!
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Omegle-style Control Bar */}
      <div className="flex justify-center items-center p-4 gap-4 bg-gradient-to-r from-background via-muted/20 to-background border-t">
        <Button 
          onClick={onStop} 
          variant="destructive" 
          size="lg" 
          className="rounded-full h-14 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          <X className="h-5 w-5 mr-2" /> Stop
        </Button>
        <Button 
          onClick={onNext} 
          size="lg" 
          className="rounded-full h-14 px-8 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
        >
          <RefreshCw className="h-5 w-5 mr-2" /> Next
        </Button>
      </div>
    </Card>
  );
}
