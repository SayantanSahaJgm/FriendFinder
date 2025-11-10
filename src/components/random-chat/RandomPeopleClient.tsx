"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Users, Sparkles, SkipForward, XCircle, Video as VideoIcon } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import VideoChat from './videochat';
import TextChat from './textchat';
import type { ChatMode, ConnectionStatus, RandomChatSession, ChatMessage } from '@/types/random-chat';
import aiBotService from '@/services/ai-bot-service';

// A focused, anonymous-first client for the /random-people (Omegle-like) flow.
export default function RandomPeopleClient() {
  const { socket, isConnected } = useSocket();

  // Default to video mode for a more Omegle-like experience
  const [selectedMode, setSelectedMode] = useState<ChatMode>('video');
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [currentSession, setCurrentSession] = useState<RandomChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchProgress, setSearchProgress] = useState(0);
  const [debug, setDebug] = useState<{ queueSize: number; activeSessions: number } | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSearchingRef = useRef(false);
  const actionCooldownRef = useRef<number | null>(null);
  const MATCH_DEBOUNCE_MS = 1000;

  useEffect(() => {
    console.log('RandomPeopleClient - socket status', { isConnected, socketId: socket?.id });
  }, [isConnected, socket]);

  const startSearch = useCallback(() => {
    if (!socket || !isConnected) {
      toast.error('Not connected to real-time server');
      return;
    }

    if (isSearchingRef.current) return;
    isSearchingRef.current = true;

    setStatus('searching');
    setSearchProgress(0);
    setMessages([]);

    // IMPORTANT: For Omegle-like anonymous matching we intentionally do NOT send a userId.
    socket.emit('random-chat:search', {
      mode: selectedMode,
      // no userId -> server will use socket.anonymousId
    });

    // visual progress
    let progress = 0;
    progressIntervalRef.current = setInterval(() => {
      progress += 7;
      setSearchProgress(Math.min(progress, 90));
    }, 400);

    // fallback to AI after 20s
    searchTimeoutRef.current = setTimeout(() => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      toast.info('No users available, connecting to AI bot...');
      const botSession: RandomChatSession = {
        sessionId: `ai-${Date.now()}`,
        mode: selectedMode,
        partner: { userId: 'ai-bot', anonymousId: 'ai-bot', username: 'FriendBot', isActive: true, mode: selectedMode, joinedAt: new Date() },
        userAnonymousId: 'anonymous',
        status: 'active',
        startTime: new Date(),
        messages: [],
        isAIBot: true
      };
      setCurrentSession(botSession);
      setStatus('ai-fallback');
      setSearchProgress(100);
      setTimeout(() => {
        const greeting = aiBotService.generateResponse('');
        setMessages(prev => [...prev, { id: `bot-${Date.now()}`, sessionId: botSession.sessionId, senderId: 'ai-bot', content: greeting.message, type: 'ai', timestamp: new Date(), isOwn: false }]);
      }, 800);
    }, 20000);
  }, [socket, isConnected, selectedMode]);

  const handleNext = useCallback(() => {
    if (currentSession && socket) {
      socket.emit('random-chat:disconnect', { sessionId: currentSession.sessionId });
    }
    setCurrentSession(null);
    setMessages([]);
    setStatus('idle');
    isSearchingRef.current = false;
    actionCooldownRef.current = Date.now();
  }, [currentSession, socket]);

  const handleStop = useCallback(() => {
    if (currentSession && socket) {
      socket.emit('random-chat:disconnect', { sessionId: currentSession.sessionId });
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setCurrentSession(null);
    setMessages([]);
    setStatus('idle');
    setSearchProgress(0);
    isSearchingRef.current = false;
  }, [currentSession, socket]);

  // Diagnostics: request queue/session sizes from server
  const requestDebug = useCallback(() => {
    if (!socket) return;
    socket.emit('random-chat:debug');
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const onMatched = (data: any) => {
      console.log('[random-chat:session-matched]', data);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setSearchProgress(100);

      // Debounce
      const now = Date.now();
      // Build session
      const session: RandomChatSession = {
        sessionId: data.sessionId || `session-${Date.now()}`,
        mode: data.mode || data.chatType || selectedMode,
        partner: data.partner || { anonymousId: data.partnerAnonymousId || 'unknown', username: (data.partner && data.partner.username) || 'Stranger', isActive: true },
        userAnonymousId: data.userAnonymousId || 'anonymous',
        status: 'active',
        startTime: data.startTime ? new Date(data.startTime) : new Date(),
        messages: [],
        isAIBot: false
      };

      setCurrentSession(session);
      setStatus('connected');
      isSearchingRef.current = false;
      toast.success('Connected to a stranger');
    };

    const onMessage = (data: any) => {
      setMessages(prev => [...prev, { id: data.messageId || `msg-${Date.now()}`, sessionId: data.sessionId, senderId: data.sender || data.senderId || 'stranger', content: data.content || data.text, type: 'text', timestamp: new Date(data.timestamp || Date.now()), isOwn: false }]);
    };

    const onPartnerDisconnected = () => {
      toast.info('Stranger disconnected');
      setCurrentSession(null);
      setMessages([]);
      setStatus('idle');
      isSearchingRef.current = false;
    };

    const onDebug = (payload: any) => {
      setDebug({ queueSize: payload.queueSize || 0, activeSessions: payload.activeSessions || 0 });
    };

    socket.on('random-chat:session-matched', onMatched);
    socket.on('random-chat:message', onMessage);
    socket.on('random-chat:partner-disconnected', onPartnerDisconnected);
    socket.on('random-chat:debug-response', onDebug);

    return () => {
      socket.off('random-chat:session-matched', onMatched);
      socket.off('random-chat:message', onMessage);
      socket.off('random-chat:partner-disconnected', onPartnerDisconnected);
      socket.off('random-chat:debug-response', onDebug);
    };
  }, [socket, selectedMode]);

  // send message
  const sendMessage = useCallback((content: string) => {
    if (!currentSession) return;
    if (currentSession.isAIBot) {
      setMessages(prev => [...prev, { id: `msg-${Date.now()}`, sessionId: currentSession.sessionId, senderId: 'me', content, type: 'text', timestamp: new Date(), isOwn: true }]);
      const response = aiBotService.generateResponse(content);
      setTimeout(() => setMessages(prev => [...prev, { id: `bot-${Date.now()}`, sessionId: currentSession.sessionId, senderId: 'ai-bot', content: response.message, type: 'ai', timestamp: new Date(), isOwn: false }]), aiBotService.getTypingDelay(content));
    } else {
      socket?.emit('random-chat:message', { sessionId: currentSession.sessionId, content });
      setMessages(prev => [...prev, { id: `msg-${Date.now()}`, sessionId: currentSession.sessionId, senderId: 'me', content, type: 'text', timestamp: new Date(), isOwn: true }]);
    }
  }, [currentSession, socket]);

  // Render
  if (status === 'searching') {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2"><Loader2 className="h-6 w-6 animate-spin" /> Searching for {selectedMode} partner...</CardTitle>
          <CardDescription>Finding someone to chat with</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={searchProgress} className="w-full" />
          <Button variant="outline" onClick={handleStop}>Cancel</Button>
        </CardContent>
      </Card>
    );
  }

  if (status === 'connected' || status === 'ai-fallback') {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="bg-background border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-semibold">{currentSession?.partner?.username || 'Stranger'}</h3>
              <p className="text-xs text-muted-foreground">{currentSession?.isAIBot ? 'AI Bot' : 'Anonymous User'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge>{selectedMode.toUpperCase()}</Badge>
            <Button size="sm" variant="outline" onClick={handleNext}><SkipForward className="h-4 w-4 mr-1" />Next</Button>
            <Button size="sm" variant="destructive" onClick={handleStop}><XCircle className="h-4 w-4 mr-1" />Stop</Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {selectedMode === 'text' && (
            <TextChat messages={messages} onSendMessage={sendMessage} isAIBot={currentSession?.isAIBot || false} />
          )}
          {selectedMode === 'video' && (
            <VideoChat session={currentSession} onNext={handleNext} onStop={handleStop} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2"><VideoIcon className="h-6 w-6 text-primary" />Random People</CardTitle>
              <CardDescription>Anonymous, Omegle-like video & text chat. No account required.</CardDescription>
            </div>
            <Badge variant={isConnected ? 'default' : 'destructive'}>{isConnected ? 'Online' : 'Offline'}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => setSelectedMode('video')} variant={selectedMode === 'video' ? 'default' : 'outline'}>Video</Button>
            <Button onClick={() => setSelectedMode('text')} variant={selectedMode === 'text' ? 'default' : 'outline'}>Text</Button>
          </div>

          <Button onClick={startSearch} className="w-full" size="lg" disabled={!isConnected}>Start {selectedMode === 'video' ? 'Video' : 'Text'} Chat</Button>

          <div className="flex items-center justify-between">
            <Button size="sm" variant="ghost" onClick={requestDebug}>Request Debug Info</Button>
            {debug && <div className="text-sm text-muted-foreground">Queue: {debug.queueSize} • Sessions: {debug.activeSessions}</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
