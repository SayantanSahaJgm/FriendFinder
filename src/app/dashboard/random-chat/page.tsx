"use client";

import { useState, useEffect, useRef } from "react";
import { useRandomChat } from "@/context/RandomChatContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Shuffle,
  Users,
  MessageCircle,
  Video,
  Mic,
  Send,
  Settings,
  LogOut,
  Clock,
  AlertTriangle,
  Flag,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import PreferencesSelector from "@/components/random-chat/PreferencesSelector";
import QueueStatus from "@/components/random-chat/QueueStatus";
import ChatInterface from "@/components/random-chat/ChatInterface";
import WebRTCInterface from "@/components/random-chat/WebRTCInterface";
import ReportModal from "@/components/random-chat/ReportModal";
import type { ChatPreferences } from "@/context/RandomChatContext";
import RandomChatClient from "@/components/random-chat/RandomChatClient";
import GuestNamePrompt from '@/components/random-chat/GuestNamePrompt'
import { useSession } from 'next-auth/react'

export default function RandomChatPage() {
  const {
    queueStatus,
    activeSession,
    messages,
    isConnected,
    connectionError,
    connectionState,
    reconnect,
    isJoiningQueue,
    isLeavingQueue,
    isLoadingSession,
    joinQueue,
    leaveQueue,
    endSession,
  } = useRandomChat();

  const [showPreferences, setShowPreferences] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentChatType, setCurrentChatType] = useState<
    "text" | "voice" | "video"
  >("text");

  // Hide preferences when user is in queue or has active session
  useEffect(() => {
    if (queueStatus.inQueue || activeSession) {
      setShowPreferences(false);
    } else {
      setShowPreferences(true);
    }
  }, [queueStatus.inQueue, activeSession]);

  const handleJoinQueue = async (preferences: ChatPreferences) => {
    setCurrentChatType(preferences.chatType);
    const result = await joinQueue(preferences);

    if (!result.success) {
      toast.error(result.error || "Failed to join queue");
    }
  };

  const handleLeaveQueue = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    const result = await leaveQueue();

    if (!result.success) {
      toast.error(result.error || "Failed to leave queue");
    }

    return result;
  };

  const handleEndSession = async () => {
    const result = await endSession();

    if (!result.success) {
      toast.error(result.error || "Failed to end session");
    }
  };

  const handleReportUser = () => {
    setShowReportModal(true);
  };

  // Show loading state
  if (isLoadingSession) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading random chat...</p>
        </div>
      </div>
    );
  }

  // Show connection error or offline notice
  if (connectionError || !isConnected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Random Chat</h1>
            <p className="text-muted-foreground">
              Connect with strangers from around the world
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Online" : "Offline"}
            </Badge>
            {/* Show feedback when reconnecting */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => reconnect()}
              disabled={connectionState?.status === 'reconnecting'}
            >
              {connectionState?.status === 'reconnecting' ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Reconnecting...
                </span>
              ) : (
                'Retry'
              )}
            </Button>
          </div>
        </div>

        {connectionError ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <AlertTitle className="text-yellow-900 dark:text-yellow-100">Offline</AlertTitle>
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Unable to reach real-time chat servers. You can still use the app, but real-time features will be degraded. Try retrying the connection.
            </AlertDescription>
          </Alert>
        )}
        {/* Debug: show socket connectionState for troubleshooting */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm">
          <div className="font-medium mb-2 text-gray-900 dark:text-gray-100">Connection diagnostics</div>
          <pre className="whitespace-pre-wrap text-xs text-gray-800 dark:text-gray-200">{JSON.stringify({
            isConnected,
            connectionError,
            connectionState: (connectionState as any) || null
          }, null, 2)}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Show guest name prompt for unauthenticated users without a saved guest name */}
      <GuestNamePrompt />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Shuffle className="h-5 w-5 sm:h-6 sm:w-6" />
            Random Chat
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Connect with strangers from around the world
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Online" : "Offline"}
          </Badge>
          {/* Dev/demo: open standalone client (uses local camera & demo verification) */}
          <Button variant="outline" size="sm" onClick={() => setShowReportModal(false)}>
            Demo Client
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Main Chat Area - Full Width */}
        <div className="w-full">
          {/* Active Session Info - Only show when chatting */}
          {activeSession && (
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  {currentChatType === "text" && (
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                  {currentChatType === "voice" && (
                    <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                  {currentChatType === "video" && (
                    <Video className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                  Active Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                    <AvatarFallback>
                      {activeSession.partner?.anonymousId?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {activeSession.partner.anonymousId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activeSession.partner.isActive ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    Chat Type:{" "}
                    <span className="capitalize">{activeSession.chatType}</span>
                  </p>
                  <p>
                    Started:{" "}
                    {new Date(activeSession.startTime).toLocaleTimeString()}
                  </p>
                  <p>Messages: {activeSession.messagesCount}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReportUser}
                    className="flex items-center gap-1 h-9"
                  >
                    <Flag className="h-4 w-4" />
                    Report
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleEndSession}
                    className="flex items-center gap-1 h-9"
                  >
                    <LogOut className="h-4 w-4" />
                    End Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Main Chat Interface - Full Width */}
        <div className="w-full">
          {/* If demo client enabled, render the standalone RandomChatClient for testing video verification */}
          {true ? (
            <RandomChatClient />
          ) : activeSession ? (
            activeSession!.chatType === "text" ? (
              <ChatInterface session={activeSession!} />
            ) : (
              <WebRTCInterface
                session={activeSession!}
                onEndCall={handleEndSession}
              />
            )
          ) : queueStatus.inQueue ? (
            <Card className="h-[500px] sm:h-[600px] flex items-center justify-center">
              <div className="text-center space-y-4 p-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <div>
                  <h3 className="text-lg font-medium">
                    Looking for a chat partner...
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Position in queue: {queueStatus.position}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Estimated wait:{" "}
                    {Math.ceil(queueStatus.estimatedWaitTime / 60)} minutes
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-[500px] sm:h-[600px] flex items-center justify-center">
              <div className="text-center space-y-4 p-6">
                <Shuffle className="h-16 w-16 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-medium">
                    Ready to start chatting?
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Select your preferences and join the queue to be matched
                    with someone new.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {activeSession && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          session={activeSession}
          messages={messages}
        />
      )}
    </div>
  );
}
