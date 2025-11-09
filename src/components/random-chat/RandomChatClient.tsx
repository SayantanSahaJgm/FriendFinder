'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MessageCircle, 
  Phone, 
  Video as VideoIcon, 
  Users, 
  Sparkles, 
  Bot, 
  AlertTriangle,
  Loader2,
  UserX,
  Shield,
  CheckCircle2,
  SkipForward,
  XCircle
} from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import SelfieCapture from './selficapture';
import VideoChat from './videochat';
import TextChat from './textchat';
import AudioChat from './audiochat';
import type { ChatMode, ConnectionStatus, RandomChatSession, ChatMessage } from '@/types/random-chat';
import aiBotService from '@/services/ai-bot-service';

export default function RandomChatClient() {
  const { data: session } = useSession();
  const { socket, isConnected, connect } = useSocket();
  
  const [selectedMode, setSelectedMode] = useState<ChatMode>('text');
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [currentSession, setCurrentSession] = useState<RandomChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchProgress, setSearchProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [verifiedSelfie, setVerifiedSelfie] = useState<string | null>(null);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Refs to prevent rapid re-queueing / duplicate events
  const lastMatchAtRef = useRef<number | null>(null);
  const actionCooldownRef = useRef<number | null>(null);
  const isSearchingRef = useRef(false);

  const REQUEUE_COOLDOWN_MS = 1500; // minimum wait before auto re-searching
  const MATCH_DEBOUNCE_MS = 1000; // ignore duplicate match events within 1s

  // Auto-connect on mount for Omegle-style experience (no login required)
  useEffect(() => {
    if (!isConnected && !socket) {
      console.log('Auto-connecting for guest random chat...');
      connect();
    }
  }, [isConnected, socket, connect]);

  // Log connection status for debugging
  useEffect(() => {
    console.log('RandomChatClient - Socket status:', { isConnected, socketId: socket?.id });
  }, [isConnected, socket]);

  // Start searching for a partner
  const startSearch = useCallback(() => {
    if (!socket || !isConnected) {
      toast.error('Not connected to server');
      return;
    }

    // respect cooldown (prevent immediate re-search after leaving session)
    const now = Date.now();
    if (actionCooldownRef.current && now - actionCooldownRef.current < REQUEUE_COOLDOWN_MS) {
      console.log('startSearch prevented by cooldown');
      return;
    }

    if (isSearchingRef.current) {
      console.log('already searching, ignoring startSearch');
      return;
    }

    isSearchingRef.current = true;

    setStatus('searching');
    setSearchProgress(0);
    setError(null);
    setMessages([]);

    // Emit search request to server
    socket.emit('random-chat:search', {
      mode: selectedMode,
      userId: session?.user?.id,
    });

    // Progress animation
    let progress = 0;
    progressIntervalRef.current = setInterval(() => {
      progress += 5;
      setSearchProgress(Math.min(progress, 90));
    }, 500);

    // Fallback to AI bot after 15 seconds
    searchTimeoutRef.current = setTimeout(() => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      toast.info('No users available. Connecting to AI bot...');
      connectToAIBot();
    }, 15000);
  }, [socket, isConnected, selectedMode, session]);

  // Connect to AI bot (fallback)
  const connectToAIBot = useCallback(() => {
    setSearchProgress(100);
    setStatus('ai-fallback');
    
    const botSession: RandomChatSession = {
      sessionId: `ai-${Date.now()}`,
      mode: selectedMode,
      partner: {
        userId: 'ai-bot',
        anonymousId: 'ai-bot',
        username: 'FriendBot',
        mode: selectedMode,
        isActive: true,
        joinedAt: new Date(),
      },
      userAnonymousId: session?.user?.id || 'anonymous',
      status: 'active',
      startTime: new Date(),
      messages: [],
      isAIBot: true,
    };

    setCurrentSession(botSession);
    
    // AI bot greeting
    setTimeout(() => {
      const greeting = aiBotService.generateResponse('');
      addBotMessage(greeting.message);
    }, 1000);
  }, [selectedMode, session]);

  // Add bot message
  const addBotMessage = useCallback((content: string) => {
    const botMessage: ChatMessage = {
      id: `bot-${Date.now()}`,
      sessionId: currentSession?.sessionId || '',
      senderId: 'ai-bot',
      content,
      type: 'ai',
      timestamp: new Date(),
      isOwn: false,
    };

    setMessages((prev) => [...prev, botMessage]);
  }, [currentSession]);

  // Handle user sending message
  const handleSendMessage = useCallback(async (content: string) => {
    if (!currentSession) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sessionId: currentSession.sessionId,
      senderId: session?.user?.id || 'anonymous',
      content,
      type: 'text',
      timestamp: new Date(),
      isOwn: true,
    };

    setMessages((prev) => [...prev, userMessage]);

    // If AI bot, generate response
    if (currentSession.isAIBot) {
      const typingDelay = aiBotService.getTypingDelay(content);
      
      setTimeout(() => {
        const response = aiBotService.generateResponse(content);
        addBotMessage(response.message);
        
        // For audio mode, also play TTS
        if (selectedMode === 'audio') {
          aiBotService.generateAudioResponse(response.message);
        }
      }, typingDelay);
    } else {
      // Send to real user via socket
      socket?.emit('random-chat:message', {
        sessionId: currentSession.sessionId,
        content,
      });
    }
  }, [currentSession, session, selectedMode, socket, addBotMessage]);

  // Handle selfie capture (for video mode)
  const handleSelfieCaptured = useCallback((dataUri: string) => {
    console.log('Selfie captured successfully, dataUri length:', dataUri.length);
    setVerifiedSelfie(dataUri);
    setStatus('idle');
    toast.success('Face verified! Ready to start video chat.');
    
    // Auto-start search after brief delay
    setTimeout(() => {
      startSearch();
    }, 1000);
  }, [startSearch]);

  // Start chat based on mode
  const handleStart = useCallback(() => {
    if (selectedMode === 'video' && !verifiedSelfie) {
      setStatus('verifying-face');
      return;
    }

    startSearch();
  }, [selectedMode, verifiedSelfie, startSearch]);

  // Skip to next chat
  const handleNext = useCallback(() => {
    // Disconnect current session
    if (currentSession && socket) {
      socket.emit('random-chat:disconnect', {
        sessionId: currentSession.sessionId,
      });
    }

    // Reset and return to idle - user must manually start next search
    aiBotService.reset();
    setCurrentSession(null);
    setMessages([]);
    setStatus('idle');
    actionCooldownRef.current = Date.now();

    // mark searching ref false so startSearch may run when user clicks Start
    isSearchingRef.current = false;

    // No automatic re-search - user must click Start button to search again
    toast.info('Click "Start" to find another person');
  }, [currentSession, socket]);

  // Stop chat and return to idle
  const handleStop = useCallback(() => {
    if (currentSession && socket) {
      socket.emit('random-chat:disconnect', {
        sessionId: currentSession.sessionId,
      });
    }

    // Clear intervals
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    aiBotService.reset();
    setCurrentSession(null);
    setMessages([]);
    setStatus('idle');
    setSearchProgress(0);
  }, [currentSession, socket]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Match found — accept multiple possible event names emitted by server
    const onMatch = (data: any) => {
      // Log full payload to help diagnose malformed payloads (partner missing, wrong shape, etc.)
      // This will appear in the browser console where the client is running.
      try {
        console.log('🔔 [random-chat:matched] payload received:', data);
      } catch (err) {
        console.warn('🔔 [random-chat:matched] failed to serialize payload for logging', err);
      }

      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

      setSearchProgress(100);

      // debounce duplicate match events
      const now = Date.now();
      if (lastMatchAtRef.current && now - lastMatchAtRef.current < MATCH_DEBOUNCE_MS) {
        console.log('Ignoring duplicate match-found event');
        return;
      }
      lastMatchAtRef.current = now;

      // Defensive: normalize partner info. Some older/alternate payloads may include partnerAnonymousId
      let partner = data?.partner;
      if (!partner && data?.partnerAnonymousId) {
        partner = {
          anonymousId: data.partnerAnonymousId,
          username: data.partnerAnonymousId,
          isActive: true,
        };
      }

      if (!partner) {
        console.error('❌ [random-chat:match-found] missing partner in payload:', data);
        toast.error('Received malformed match from server. Please try again.');
        setStatus('idle');
        return;
      }

      const newSession: RandomChatSession = {
        sessionId: data.sessionId || `session-${Date.now()}`,
        mode: data.chatType || data.mode || selectedMode,
        partner,
        userAnonymousId: data.userAnonymousId || session?.user?.id || partner?.anonymousId || 'anonymous',
        status: 'active',
        startTime: data.startTime ? new Date(data.startTime) : new Date(),
        messages: [],
        isAIBot: false,
      };

      setCurrentSession(newSession);
      setStatus('connected');
      // searching is complete
      isSearchingRef.current = false;

      toast.success('Connected to a stranger!');
    };

    // Register same handler for historically different event names
    socket.on('random-chat:match-found', onMatch);
    socket.on('random-chat:matched', onMatch);
    socket.on('random-chat:session-matched', onMatch);

    // Receive message
    socket.on('random-chat:message', (data: any) => {
      const message: ChatMessage = {
        id: data.messageId,
        sessionId: data.sessionId,
        senderId: data.senderId,
        content: data.content,
        type: 'text',
        timestamp: new Date(data.timestamp),
        isOwn: false,
      };

      setMessages((prev) => [...prev, message]);
    });

    // Partner disconnected
    socket.on('random-chat:partner-disconnected', () => {
      // Notify user but don't automatically re-search - let them decide
      toast.info('Stranger disconnected. Click "Next" or "Start" to find another person.');
      actionCooldownRef.current = Date.now();
      isSearchingRef.current = false;
      
      // Return to idle state - user must manually initiate next search
      setCurrentSession(null);
      setMessages([]);
      setStatus('idle');
    });

    return () => {
      // ensure we remove the exact event names we registered
  socket.off('random-chat:match-found', onMatch);
  socket.off('random-chat:matched', onMatch);
  socket.off('random-chat:session-matched', onMatch);
      socket.off('random-chat:message');
      socket.off('random-chat:partner-disconnected');
    };
  }, [socket, selectedMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      handleStop();
    };
  }, [handleStop]);

  // Render based on status
  const renderContent = () => {
    // Face verification for video mode
    if (status === 'verifying-face') {
      return (
        <SelfieCapture
          onSelfieCaptured={handleSelfieCaptured}
          onCancel={() => setStatus('idle')}
        />
      );
    }

    // Searching for partner
    if (status === 'searching') {
      return (
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              Searching for {selectedMode} partner...
            </CardTitle>
            <CardDescription>
              Finding someone to chat with
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={searchProgress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              {searchProgress < 50 ? 'Looking for available users...' :
               searchProgress < 80 ? 'Checking compatibility...' :
               'Almost there...'}
            </p>
            <Button variant="outline" onClick={handleStop}>
              Cancel Search
            </Button>
          </CardContent>
        </Card>
      );
    }

    // Connected to someone (real user or AI bot)
    if (status === 'connected' || status === 'ai-fallback') {
      return (
        <div className="w-full h-full flex flex-col">
          {/* Header */}
          <div className="bg-background border-b p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentSession?.isAIBot ? (
                <Bot className="h-6 w-6 text-primary" />
              ) : (
                <Users className="h-6 w-6 text-primary" />
              )}
              <div>
                <h3 className="font-semibold">
                  {currentSession?.partner?.username || 'Stranger'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {currentSession?.isAIBot ? 'AI Bot' : 'Anonymous User'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={currentSession?.isAIBot ? 'secondary' : 'default'}>
                {selectedMode.toUpperCase()}
              </Badge>
              <Button size="sm" variant="outline" onClick={handleNext}>
                <SkipForward className="h-4 w-4 mr-1" />
                Next
              </Button>
              <Button size="sm" variant="destructive" onClick={handleStop}>
                <XCircle className="h-4 w-4 mr-1" />
                Stop
              </Button>
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-hidden">
            {selectedMode === 'text' && (
              <TextChat
                messages={messages}
                onSendMessage={handleSendMessage}
                isAIBot={currentSession?.isAIBot || false}
              />
            )}
            {selectedMode === 'audio' && (
              <AudioChat
                session={currentSession}
                onNext={handleNext}
                onStop={handleStop}
              />
            )}
            {selectedMode === 'video' && (
              <VideoChat
                session={currentSession}
                onNext={handleNext}
                onStop={handleStop}
              />
            )}
          </div>
        </div>
      );
    }

    // Idle - Mode selection
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Random Chat
              </CardTitle>
              <CardDescription>
                Connect with strangers instantly via text, audio, or video
              </CardDescription>
            </div>
            {isConnected ? (
              <Badge variant="outline" className="flex items-center gap-1 border-green-500 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300 dark:border-green-700">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Online
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1 border-orange-500 text-orange-700 bg-orange-50 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700">
                <Loader2 className="h-3 w-3 animate-spin" />
                Connecting...
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={selectedMode} onValueChange={(v) => setSelectedMode(v as ChatMode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Text
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Audio
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2">
                <VideoIcon className="h-4 w-4" />
                Video
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4">
              <div className="p-6 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Text Chat</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Chat with random strangers via text messages, just like Omegle. 
                  If no one is available, you'll chat with our friendly AI bot.
                </p>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Anonymous & instant
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    AI fallback available
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Skip to next anytime
                  </li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="audio" className="space-y-4">
              <div className="p-6 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Voice Call</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Have voice conversations with strangers. Talk naturally without video.
                  AI bot provides voice responses if no users available.
                </p>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Real-time voice chat
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    AI voice responses
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-500" />
                    Microphone required
                  </li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="video" className="space-y-4">
              <div className="p-6 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  Video Chat <Shield className="h-5 w-5 text-yellow-500" />
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Face-to-face conversations with continuous face verification for safety.
                  Your face must be visible throughout the chat.
                </p>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Live video & audio
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-yellow-500" />
                    Continuous face verification
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Auto-disconnect if face hidden
                  </li>
                  <li className="flex items-center gap-2">
                    <VideoIcon className="h-4 w-4 text-blue-500" />
                    Camera required
                  </li>
                </ul>
                {verifiedSelfie && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Face verified! Ready to start video chat.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {!isConnected && status === 'idle' && (
            <Alert variant="default" className="border-blue-500 bg-blue-50">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <AlertTitle className="text-blue-800">Connecting...</AlertTitle>
              <AlertDescription className="text-blue-700">
                Connecting to chat servers. This should only take a moment...
              </AlertDescription>
            </Alert>
          )}

          {!isConnected && status !== 'idle' && (
            <Alert variant="default" className="border-yellow-500 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">Connection Issue</AlertTitle>
              <AlertDescription className="text-yellow-700">
                Having trouble connecting. Make sure the Socket.IO server is running on port 3004.
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleStart} 
            className="w-full"
            size="lg"
            disabled={!isConnected && status === 'idle'}
          >
            {selectedMode === 'video' && !verifiedSelfie ? (
              <>
                <Shield className="h-5 w-5 mr-2" />
                Verify Face & Start
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Start {selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)} Chat
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      {renderContent()}
    </div>
  );
}
