"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function CallPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  const userId = searchParams?.get("userId") ?? "";
  const userName = searchParams?.get("userName") ?? "";
  const callType = searchParams?.get("type") ?? "video"; // 'voice' or 'video'

  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === "video");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!userId || !userName) {
      toast.error("Invalid call parameters");
      router.push("/dashboard/messages");
      return;
    }

    // Initialize media stream
    const initCall = async () => {
      try {
        const constraints = {
          audio: true,
          video: callType === "video",
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Simulate connection (in real app, this would use WebRTC/Socket.IO)
        setTimeout(() => {
          setIsConnecting(false);
          setIsConnected(true);
          toast.success(`Connected to ${userName}`);
        }, 2000);
      } catch (error) {
        console.error("Error accessing media devices:", error);
        toast.error("Failed to access camera/microphone");
        setIsConnecting(false);
      }
    };

    initCall();

    // Cleanup
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [userId, userName, callType, router]);

  // Call duration timer
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    toast.success("Call ended");
    router.push("/dashboard/messages");
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        // In real app, replace video track with screen track
        setIsScreenSharing(true);
        toast.success("Screen sharing started");

        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          toast.info("Screen sharing stopped");
        };
      } else {
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error("Error sharing screen:", error);
      toast.error("Failed to share screen");
    }
  };

  if (isConnecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-blue-950">
        <Loader2 className="h-16 w-16 animate-spin text-white mb-4" />
        <p className="text-white text-xl mb-2">Connecting to {userName}...</p>
        <p className="text-gray-300 text-sm">Please wait</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen bg-gray-900">
      {/* Remote Video (full screen) */}
      <div className="absolute inset-0">
        {callType === "video" ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-blue-900 to-blue-950">
            <Avatar className="h-32 w-32 mb-6">
              <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                {userName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-white text-2xl font-semibold mb-2">{userName}</h2>
            <p className="text-gray-300 text-lg">{formatDuration(callDuration)}</p>
          </div>
        )}
      </div>

      {/* Local Video (Picture-in-Picture) */}
      {callType === "video" && isVideoEnabled && (
        <div className="absolute top-4 right-4 w-32 h-44 rounded-lg overflow-hidden border-2 border-white shadow-lg z-10">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/50 to-transparent z-20">
        <div className="flex items-center justify-between text-white">
          <div>
            <h3 className="text-lg font-semibold">{userName}</h3>
            <p className="text-sm text-gray-300">{isConnected ? formatDuration(callDuration) : "Connecting..."}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/70 to-transparent z-20">
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="secondary"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={toggleMute}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          {callType === "video" && (
            <Button
              variant="secondary"
              size="icon"
              className="h-14 w-14 rounded-full"
              onClick={toggleVideo}
            >
              {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
            </Button>
          )}

          <Button
            variant="destructive"
            size="icon"
            className="h-16 w-16 rounded-full"
            onClick={handleEndCall}
          >
            <PhoneOff className="h-7 w-7" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={toggleScreenShare}
          >
            {isScreenSharing ? (
              <MonitorOff className="h-6 w-6" />
            ) : (
              <Monitor className="h-6 w-6" />
            )}
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
          >
            {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
