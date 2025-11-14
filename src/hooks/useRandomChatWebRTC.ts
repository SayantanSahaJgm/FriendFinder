"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRandomChat } from '@/context/RandomChatContext';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { verifyFace } from '@/ai/flows/verify-face';

interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  connectionState: RTCPeerConnectionState;
  isConnecting: boolean;
  callError: string | null;
}

export function useRandomChatWebRTC() {
  const { activeSession, endSession } = useRandomChat();
  const { socket, isConnected } = useSocket();
  
  const [webrtcState, setWebrtcState] = useState<WebRTCState>({
    localStream: null,
    remoteStream: null,
    isAudioEnabled: true,
    isVideoEnabled: true,
    connectionState: 'new',
    isConnecting: false,
    callError: null,
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pendingICECandidates = useRef<RTCIceCandidate[]>([]);
  const verificationCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Verification state about partner (received via socket)
  const [partnerVerified, setPartnerVerified] = useState<boolean | null>(null);
  const [partnerVerificationConfidence, setPartnerVerificationConfidence] = useState<number | null>(null);
  const [partnerVerificationAt, setPartnerVerificationAt] = useState<number | null>(null);

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      // In production, add TURN servers for better connectivity
    ]
  };

  // Initialize WebRTC for voice/video calls
  const initializeWebRTC = useCallback(async (chatType: 'voice' | 'video' | 'text') => {
    if (!activeSession || chatType === 'text') return;

    try {
      // Clean up any existing connection first
      if (peerConnectionRef.current) {
        console.log('Cleaning up existing peer connection before creating new one');
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Stop any existing local stream
      if (webrtcState.localStream) {
        webrtcState.localStream.getTracks().forEach(track => track.stop());
      }

      setWebrtcState(prev => ({ ...prev, isConnecting: true, callError: null }));

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('WebRTC is not supported in this browser');
      }

      // Get user media with fallback constraints
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: chatType === 'video' ? {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            frameRate: { ideal: 15, max: 30 }
          } : false
        });
      } catch (error) {
        // Fallback to basic constraints if high-quality fails
        console.warn('High-quality media failed, trying basic constraints:', error);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: chatType === 'video' ? true : false
          });
        } catch (fallbackError) {
          const errorMsg = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
          throw new Error(`Camera/microphone access denied or not available. Please check browser permissions. Details: ${errorMsg}`);
        }
      }

      setWebrtcState(prev => ({ 
        ...prev, 
        localStream: stream,
        isVideoEnabled: chatType === 'video',
      }));

      // Set local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const pc = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = pc;

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle incoming stream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setWebrtcState(prev => ({ ...prev, remoteStream }));
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        setWebrtcState(prev => ({ 
          ...prev, 
          connectionState: pc.connectionState,
          isConnecting: pc.connectionState === 'connecting'
        }));

        if (pc.connectionState === 'connected') {
          toast.success('Voice/video call connected');
        } else if (pc.connectionState === 'failed') {
          setWebrtcState(prev => ({ 
            ...prev, 
            callError: 'Connection failed. Please try again.' 
          }));
          toast.error('Call connection failed');
        } else if (pc.connectionState === 'disconnected') {
          cleanup();
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket && activeSession) {
          socket.emit('random-chat:webrtc-ice-candidate', {
            sessionId: activeSession.sessionId,
            candidate: event.candidate
          });
        }
      };

      // Add any pending ICE candidates
      for (const candidate of pendingICECandidates.current) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (error) {
          console.warn('Failed to add ICE candidate:', error);
        }
      }
      pendingICECandidates.current = [];

    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      let errorMessage = 'Failed to access camera/microphone';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera/microphone access denied. Please allow permissions and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera/microphone found. Please check your devices.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera/microphone is being used by another application.';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = 'Camera/microphone constraints not supported.';
        }
      }
      
      setWebrtcState(prev => ({ 
        ...prev, 
        callError: errorMessage,
        isConnecting: false
      }));
      toast.error(errorMessage);
    }
  }, [activeSession, socket]);

  // Helper: capture a frame from the local video and return dataURI (or null)
  const captureLocalFrame = useCallback((): string | null => {
    try {
      const vid = localVideoRef.current;
      if (!vid) return null;
      let canvas = verificationCanvasRef.current;
      if (!canvas) {
        canvas = document.createElement('canvas');
        verificationCanvasRef.current = canvas;
      }

      const w = vid.videoWidth || 640;
      const h = vid.videoHeight || 480;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(vid, 0, 0, w, h);
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (err) {
      console.warn('captureLocalFrame failed', err);
      return null;
    }
  }, []);

  // Run verification on local frame and emit to server when connected
  const runAndEmitVerification = useCallback(async () => {
    if (!socket || !activeSession) return;
    if (!localVideoRef.current) return;

    const dataUri = captureLocalFrame();
    if (!dataUri) return;

    try {
      const result = await verifyFace({ photoDataUri: dataUri });
      const ok = !!result && !!result.isFaceDetected && (typeof result.confidence !== 'number' || result.confidence >= 0.5);

      const payload = {
        sessionId: activeSession.sessionId,
        userAnonymousId: activeSession.userAnonymousId,
        isVerified: ok,
        confidence: result?.confidence ?? null,
        timestamp: Date.now(),
      } as any;

      socket.emit('random-chat:verification', payload);
    } catch (err) {
      console.warn('runAndEmitVerification failed', err);
    }
  }, [socket, activeSession, captureLocalFrame]);

  // Create WebRTC offer (for initiator)
  const createOffer = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !activeSession || !socket) return;

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('random-chat:webrtc-offer', {
        sessionId: activeSession.sessionId,
        offer
      });
    } catch (error) {
      console.error('Failed to create offer:', error);
      setWebrtcState(prev => ({ 
        ...prev, 
        callError: 'Failed to create call offer' 
      }));
    }
  }, [activeSession, socket]);

  // Handle WebRTC offer (for receiver)
  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    const pc = peerConnectionRef.current;
    if (!pc || !activeSession || !socket) return;

    try {
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('random-chat:webrtc-answer', {
        sessionId: activeSession.sessionId,
        answer
      });
    } catch (error) {
      console.error('Failed to handle offer:', error);
      setWebrtcState(prev => ({ 
        ...prev, 
        callError: 'Failed to handle call offer' 
      }));
    }
  }, [activeSession, socket]);

  // Handle WebRTC answer
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      await pc.setRemoteDescription(answer);
    } catch (error) {
      console.error('Failed to handle answer:', error);
      setWebrtcState(prev => ({ 
        ...prev, 
        callError: 'Failed to handle call answer' 
      }));
    }
  }, []);

  // Handle ICE candidate
  const handleICECandidate = useCallback(async (candidate: RTCIceCandidate) => {
    const pc = peerConnectionRef.current;
    
    if (pc && pc.remoteDescription) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (error) {
        console.warn('Failed to add ICE candidate:', error);
      }
    } else {
      // Store candidate for later if remote description is not set yet
      pendingICECandidates.current.push(candidate);
    }
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    const { localStream } = webrtcState;
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setWebrtcState(prev => ({ 
          ...prev, 
          isAudioEnabled: audioTrack.enabled 
        }));
        return audioTrack.enabled;
      }
    }
    return webrtcState.isAudioEnabled;
  }, [webrtcState.localStream, webrtcState.isAudioEnabled]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    const { localStream } = webrtcState;
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setWebrtcState(prev => ({ 
          ...prev, 
          isVideoEnabled: videoTrack.enabled 
        }));
        return videoTrack.enabled;
      }
    }
    return webrtcState.isVideoEnabled;
  }, [webrtcState.localStream, webrtcState.isVideoEnabled]);

  // Cleanup WebRTC resources
  const cleanup = useCallback(() => {
    // Stop local stream - use functional update to get current state
    setWebrtcState(prev => {
      if (prev.localStream) {
        prev.localStream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped track:', track.kind);
        });
      }
      return prev;
    });

    // Close peer connection
    if (peerConnectionRef.current) {
      console.log('Closing peer connection, state:', peerConnectionRef.current.connectionState);
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Clear pending ICE candidates
    pendingICECandidates.current = [];

    // Reset state
    setWebrtcState({
      localStream: null,
      remoteStream: null,
      isAudioEnabled: true,
      isVideoEnabled: true,
      connectionState: 'new',
      isConnecting: false,
      callError: null,
    });
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleWebRTCOffer = (data: { 
      sessionId: string; 
      offer: RTCSessionDescriptionInit 
    }) => {
      if (activeSession?.sessionId === data.sessionId) {
        // Initialize WebRTC if not already done
        if (!peerConnectionRef.current && activeSession.chatType !== 'text') {
          initializeWebRTC(activeSession.chatType).then(() => {
            handleOffer(data.offer);
          });
        } else {
          handleOffer(data.offer);
        }
      }
    };

    const handleWebRTCAnswer = (data: { 
      sessionId: string; 
      answer: RTCSessionDescriptionInit 
    }) => {
      if (activeSession?.sessionId === data.sessionId) {
        handleAnswer(data.answer);
      }
    };

    const handleWebRTCICE = (data: { 
      sessionId: string; 
      candidate: RTCIceCandidate 
    }) => {
      if (activeSession?.sessionId === data.sessionId) {
        handleICECandidate(data.candidate);
      }
    };

    socket.on('random-chat:webrtc-offer-received', handleWebRTCOffer);
    socket.on('random-chat:webrtc-answer-received', handleWebRTCAnswer);
    socket.on('random-chat:webrtc-ice-candidate-received', handleWebRTCICE);

    // Partner verification events
    const handlePartnerVerified = (data: { sessionId: string; userAnonymousId?: string; isVerified: boolean; confidence?: number; timestamp?: number }) => {
      if (activeSession?.sessionId !== data.sessionId) return;
      // data.userAnonymousId refers to the user who reported verification; only update partner state if it came from partner
      const partnerAnonymousId = activeSession.partner?.anonymousId;
      if (!partnerAnonymousId) return;

      // For simplicity we trust the server-forwarded event and treat it as partner verification
      setPartnerVerified(!!data.isVerified);
      setPartnerVerificationConfidence(typeof data.confidence === 'number' ? data.confidence : null);
      setPartnerVerificationAt(typeof data.timestamp === 'number' ? data.timestamp : Date.now());
    };

    socket.on('random-chat:partner-verified', handlePartnerVerified as any);

    return () => {
      socket.off('random-chat:webrtc-offer-received', handleWebRTCOffer);
      socket.off('random-chat:webrtc-answer-received', handleWebRTCAnswer);
      socket.off('random-chat:webrtc-ice-candidate-received', handleWebRTCICE);
      socket.off('random-chat:partner-verified', handlePartnerVerified as any);
    };
  }, [socket, isConnected, activeSession, handleOffer, handleAnswer, handleICECandidate]);

  // Initialize WebRTC when session starts with voice/video
  useEffect(() => {
    if (activeSession && (activeSession.chatType === 'voice' || activeSession.chatType === 'video')) {
      initializeWebRTC(activeSession.chatType);
    }

    // Cleanup when session ends
    return () => {
      if (!activeSession) {
        cleanup();
      }
    };
  }, [activeSession, initializeWebRTC, cleanup]);

  // Periodic verification emitter: when connected and video enabled, periodically capture and emit verification
  useEffect(() => {
    if (!socket || !activeSession) return;

    const freqSeconds = Number(process.env.NEXT_PUBLIC_VERIF_FREQ_SEC) || 10
    const intervalMs = Math.max(2000, freqSeconds * 1000)

    let intervalId: number | null = null;

    if (webrtcState.connectionState === 'connected' && activeSession.chatType === 'video') {
      // Run once immediately
      runAndEmitVerification();

      // then at configured interval
      intervalId = window.setInterval(() => {
        runAndEmitVerification();
      }, intervalMs);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [webrtcState.connectionState, activeSession, socket, runAndEmitVerification]);

  // Cleanup on unmount or when session ends
  useEffect(() => {
    return () => {
      console.log('useRandomChatWebRTC unmounting, cleaning up resources');
      cleanup();
    };
  }, [cleanup]);

  // Cleanup when active session changes
  useEffect(() => {
    if (!activeSession) {
      console.log('No active session, cleaning up WebRTC');
      cleanup();
    }
  }, [activeSession, cleanup]);

  // Start WebRTC connection (for initiator)
  const startWebRTCConnection = useCallback(async () => {
    if (activeSession && (activeSession.chatType === 'voice' || activeSession.chatType === 'video')) {
      await initializeWebRTC(activeSession.chatType);
      await createOffer();
    }
  }, [activeSession, initializeWebRTC, createOffer]);

  return {
    // State
    ...webrtcState,
    
    // Refs for video elements
    localVideoRef,
    remoteVideoRef,
    
    // Actions
    startWebRTCConnection,
    toggleAudio,
    toggleVideo,
    cleanup,
    
    // Helper properties
    isWebRTCSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    isCallActive: !!(webrtcState.localStream || webrtcState.remoteStream),
    hasVideo: activeSession?.chatType === 'video',
    hasAudio: activeSession?.chatType === 'voice' || activeSession?.chatType === 'video',
    // Verification props
    partnerVerified,
    partnerVerificationConfidence,
    partnerVerificationAt,
  };
}