'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Phone, 
  PhoneOff,
  Radio,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RandomChatSession } from '@/types/random-chat';
import { useToast } from '@/hooks/use-toast';

interface AudioChatProps {
  session: RandomChatSession | null;
  onNext: () => void;
  onStop: () => void;
}

export default function AudioChat({ session, onNext, onStop }: AudioChatProps) {
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [callDuration, setCallDuration] = useState(0);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio stream
  useEffect(() => {
    if (!session) return;

    const initAudio = async () => {
      try {
        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        localStreamRef.current = stream;
        setIsConnecting(false);

        // For AI bot, simulate connection
        if (session.isAIBot) {
          toast({
            title: 'Voice Chat Ready',
            description: 'You can speak to the AI bot',
          });
        }

        // Start call duration timer
        durationIntervalRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      } catch (error) {
        console.error('Failed to access microphone:', error);
        toast({
          variant: 'destructive',
          title: 'Microphone Error',
          description: 'Unable to access your microphone. Please check permissions.',
        });
      }
    };

    initAudio();

    return () => {
      // Cleanup
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [session, toast]);

  // Monitor audio level
  useEffect(() => {
    if (!localStreamRef.current) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(localStreamRef.current);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    microphone.connect(analyser);
    analyser.fftSize = 256;

    const checkAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average);
      requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();

    return () => {
      audioContext.close();
    };
  }, [localStreamRef.current]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !isSpeakerOn;
      setIsSpeakerOn(!isSpeakerOn);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 space-y-6">
          {/* Call Status */}
          <div className="text-center space-y-2">
            <div className="relative inline-block">
              <div
                className={cn(
                  'w-32 h-32 rounded-full flex items-center justify-center transition-all',
                  isConnecting
                    ? 'bg-muted animate-pulse'
                    : 'bg-gradient-to-br from-primary to-primary/60'
                )}
              >
                {session?.isAIBot ? (
                  <Bot className="h-16 w-16 text-primary-foreground" />
                ) : (
                  <Phone className="h-16 w-16 text-primary-foreground" />
                )}
              </div>

              {/* Audio Level Indicator */}
              {!isMuted && audioLevel > 20 && (
                <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping" />
              )}
            </div>

            <h3 className="text-xl font-semibold">
              {session?.partner?.username || 'Connecting...'}
            </h3>

            <div className="flex items-center justify-center gap-2">
              <Badge variant={session?.isAIBot ? 'secondary' : 'default'}>
                {session?.isAIBot ? 'AI Bot' : 'Stranger'}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Radio className="h-3 w-3" />
                {formatDuration(callDuration)}
              </Badge>
            </div>
          </div>

          {/* Connection Status */}
          {isConnecting && (
            <Alert>
              <Radio className="h-4 w-4 animate-pulse" />
              <AlertDescription>
                Connecting your audio...
              </AlertDescription>
            </Alert>
          )}

          {/* Audio Controls */}
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              variant={isMuted ? 'destructive' : 'outline'}
              className="rounded-full h-16 w-16"
              onClick={toggleMute}
            >
              {isMuted ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>

            <Button
              size="lg"
              variant="destructive"
              className="rounded-full h-16 w-16"
              onClick={onStop}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>

            <Button
              size="lg"
              variant={!isSpeakerOn ? 'destructive' : 'outline'}
              className="rounded-full h-16 w-16"
              onClick={toggleSpeaker}
            >
              {isSpeakerOn ? (
                <Volume2 className="h-6 w-6" />
              ) : (
                <VolumeX className="h-6 w-6" />
              )}
            </Button>
          </div>

          {/* Control Labels */}
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <span className="w-16 text-center">
              {isMuted ? 'Unmute' : 'Mute'}
            </span>
            <span className="w-16 text-center">End Call</span>
            <span className="w-16 text-center">
              {isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
            </span>
          </div>

          {/* Next Button */}
          <Button variant="outline" className="w-full" onClick={onNext}>
            Skip to Next Call
          </Button>
        </CardContent>
      </Card>

      {/* Hidden audio element for remote stream */}
      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
}
