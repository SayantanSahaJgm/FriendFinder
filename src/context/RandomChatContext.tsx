"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/hooks/useSocket";
import io from 'socket.io-client'
import { toast } from "sonner";

// Types
export interface ChatPreferences {
  chatType: "text" | "voice" | "video";
  language?: string;
  interests?: string[];
  ageRange?: {
    min: number;
    max: number;
  };
}

export interface RandomChatMessage {
  messageId: string;
  sessionId: string;
  anonymousId: string;
  content: string;
  timestamp: Date;
  type: "text" | "image" | "system";
  isOwn: boolean;
}

export interface RandomChatSession {
  sessionId: string;
  partner: {
    anonymousId: string;
    username: string;
    isActive: boolean;
  };
  userAnonymousId: string;
  status: "waiting" | "active" | "ended" | "reported";
  chatType: "text" | "voice" | "video";
  startTime: Date;
  messagesCount: number;
  messages: RandomChatMessage[];
}

export interface QueueStatus {
  inQueue: boolean;
  queueId?: string;
  anonymousId?: string;
  position: number;
  estimatedWaitTime: number;
  chatType?: "text" | "voice" | "video";
  joinedAt?: Date;
}

export interface RandomChatContextType {
  // Queue state
  queueStatus: QueueStatus;
  isJoiningQueue: boolean;
  isLeavingQueue: boolean;

  // Session state
  activeSession: RandomChatSession | null;
  messages: RandomChatMessage[];
  isTyping: boolean;
  partnerTyping: boolean;
  isLoadingSession: boolean;

  // Connection state
  isConnected: boolean;
  connectionError: string | null;
  // Expose raw connection state for debugging/diagnostics
  connectionState?: any;
  // Reconnect action exposed from socket hook
  reconnect: () => void;

  // Actions
  joinQueue: (
    preferences: ChatPreferences
  ) => Promise<{ success: boolean; error?: string }>;
  leaveQueue: () => Promise<{ success: boolean; error?: string }>;
  sendMessage: (
    content: string
  ) => Promise<{ success: boolean; error?: string }>;
  startTyping: () => void;
  stopTyping: () => void;
  endSession: () => Promise<{ success: boolean; error?: string }>;
  reportUser: (
    reason: string,
    description?: string,
    messageIds?: string[]
  ) => Promise<{ success: boolean; error?: string }>;
  nextChat: () => Promise<void>;

  // Session management
  refreshSession: () => Promise<void>;
  joinActiveSession: (sessionId: string) => void;
  // Allow UI to set a guest display name for anonymous users
  setAnonName?: (name: string) => void;
}

const RandomChatContext = createContext<RandomChatContextType | undefined>(
  undefined
);

export function RandomChatProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const {
    socket,
    isConnected,
    connectionState,
    connectionError: socketConnectionError,
    reconnect: socketReconnect,
  } = useSocket();

  // Local anonymous socket for unauthenticated users
  const [anonSocket, setAnonSocket] = useState<any>(null)
  const [anonConnected, setAnonConnected] = useState(false)
  const [anonId, setAnonId] = useState<string | null>(null)
  const [anonName, setAnonNameState] = useState<string | null>(null)

  // State
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    inQueue: false,
    position: 0,
    estimatedWaitTime: 0,
  });
  const [activeSession, setActiveSession] = useState<RandomChatSession | null>(
    null
  );
  const [messages, setMessages] = useState<RandomChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [isJoiningQueue, setIsJoiningQueue] = useState(false);
  const [isLeavingQueue, setIsLeavingQueue] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(
    socketConnectionError
  );

  // Refs for timers
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const partnerTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update connection error when socket connection changes
  useEffect(() => {
    setConnectionError(socketConnectionError);
  }, [socketConnectionError]);

  // Determine which socket to use for random chat events: prefer authenticated socket
  const commSocket = socket || anonSocket
  const commConnected = isConnected || anonConnected

  // Socket URL config (same defaults as useSocket)
  const socketPort = process.env.NEXT_PUBLIC_SOCKET_PORT || '3004'
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || `http://localhost:${socketPort}`

  // Ensure we have a persistent anonymous id per client
  const ensureAnonId = () => {
    try {
      const key = 'randomChatAnonId'
      let id = localStorage.getItem(key)
      if (!id) {
        id = `anon_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`
        localStorage.setItem(key, id)
      }
      setAnonId(id)
      return id
    } catch (e) {
      const fallback = `anon_${Math.random().toString(36).substr(2, 9)}`
      setAnonId(fallback)
      return fallback
    }
  }

  // Ensure guest display name is present in localStorage and state
  const ensureAnonName = () => {
    try {
      const key = 'randomChatAnonName'
      let name = localStorage.getItem(key)
      if (!name) return null
      setAnonNameState(name)
      return name
    } catch (e) {
      return null
    }
  }

  const connectAnon = async () => {
    if (anonSocket) return
    const id = anonId || ensureAnonId()
    const guestName = anonName || ensureAnonName() || id
    try {
      const s = io(socketUrl, {
        path: '/socket.io/',
        // Allow both transports; Render and Railway support WebSocket natively
        transports: ['polling', 'websocket'],
        upgrade: true,
        timeout: 20000,
        autoConnect: true,
        forceNew: true,
        withCredentials: true,
        auth: { anonymous: true, anonymousId: id, username: guestName }
      })

      s.on('connect', () => {
        console.log('Anonymous socket connected', s.id)
        setAnonConnected(true)
        // register anonymous user for convenience; include friendly guest name if available
        s.emit('user-register', {
          userId: `anon:${id}`,
          username: guestName,
        })
      })

      s.on('disconnect', () => {
        console.log('Anonymous socket disconnected')
        setAnonConnected(false)
      })

      s.on('connect_error', (err: any) => {
        console.warn('Anonymous socket connect error', err)
      })

      setAnonSocket(s)
    } catch (err) {
      console.error('Failed to connect anonymous socket', err)
    }
  }

  const disconnectAnon = () => {
    if (anonSocket) {
      try {
        anonSocket.disconnect()
      } catch (e) {}
      setAnonSocket(null)
      setAnonConnected(false)
    }
  }

  // If socket is not available, use polling for updates
  useEffect(() => {
    if (!commConnected && (queueStatus.inQueue || activeSession)) {
      // Start polling for updates when socket is not available
      pollingIntervalRef.current = setInterval(() => {
        if (queueStatus.inQueue) {
          checkQueueStatus();
        }
        if (activeSession) {
          checkSessionMessages();
        }
      }, 3000); // Poll every 3 seconds

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [commConnected, queueStatus.inQueue, activeSession]);

  // Function to check queue status via HTTP
  const checkQueueStatus = async () => {
    try {
      const response = await fetch("/api/random-chat/queue");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.inQueue) {
          setQueueStatus(data.data);
        } else if (data.success && data.data.hasMatch) {
          // Found a match!
          const newSession: RandomChatSession = {
            sessionId: data.data.sessionId,
            partner: data.data.partner,
            userAnonymousId: data.data.anonymousId,
            status: "active",
            chatType: data.data.chatType,
            startTime: new Date(),
            messagesCount: 0,
            messages: [],
          };

          setActiveSession(newSession);
          setMessages([]);
          setQueueStatus({
            inQueue: false,
            position: 0,
            estimatedWaitTime: 0,
          });

          toast.success(
            `Match found! You're now chatting with ${data.data.partner.anonymousId}`
          );
        }
      }
    } catch (error) {
      console.error("Error checking queue status:", error);
    }
  };

  // Function to check for new messages via HTTP
  const checkSessionMessages = async () => {
    if (!activeSession) return;

    try {
      const response = await fetch(
        `/api/random-chat/session?sessionId=${activeSession.sessionId}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.messages) {
          const newMessages = data.data.messages.filter(
            (msg: any) =>
              !messages.find((existing) => existing.messageId === msg.messageId)
          );

          if (newMessages.length > 0) {
            setMessages((prev) => [...prev, ...newMessages]);
          }
        }
      }
    } catch (error) {
      console.error("Error checking session messages:", error);
    }
  };

  // Load initial state on mount
  useEffect(() => {
    if (session?.user) {
      loadInitialState();
      // Load persisted session and messages
      loadPersistedState();
    }
  }, [session]);

  // Also load persisted state when socket connects
  useEffect(() => {
    if (commSocket && commConnected && session?.user && !activeSession) {
      loadPersistedState();
    }
  }, [commSocket, commConnected, session]);

  // Function to load persisted state from localStorage and server
  const loadPersistedState = async () => {
    try {
      const savedSession = localStorage.getItem('randomChatSession');
      
      console.log('Loading persisted state - savedSession:', savedSession);
      
      if (savedSession) {
        const parsedSession = JSON.parse(savedSession);
        // Only restore if session is recent (within last hour)
        const sessionAge = Date.now() - new Date(parsedSession.startTime).getTime();
        if (sessionAge < 3600000) { // 1 hour
          console.log('Restoring session:', parsedSession);
          
          // Don't overwrite existing active session unless it's different
          if (!activeSession || activeSession.sessionId !== parsedSession.sessionId) {
            setActiveSession(parsedSession);
          }
          
          // First try to load messages from server (most up-to-date)
          try {
            const response = await fetch(`/api/random-chat/session?sessionId=${parsedSession.sessionId}`);
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data.messages) {
                console.log('Loaded messages from server:', data.data.messages);
                setMessages(data.data.messages);
                
                // Update localStorage with server messages
                const sessionStorageKey = `randomChatMessages_${parsedSession.sessionId}`;
                localStorage.setItem(sessionStorageKey, JSON.stringify(data.data.messages));
              } else {
                // Fallback to localStorage if server doesn't have messages
                loadMessagesFromLocalStorage(parsedSession.sessionId);
              }
            } else {
              // Fallback to localStorage if server request fails
              loadMessagesFromLocalStorage(parsedSession.sessionId);
            }
          } catch (serverError) {
            console.error('Error loading messages from server:', serverError);
            // Fallback to localStorage if server request fails
            loadMessagesFromLocalStorage(parsedSession.sessionId);
          }
          
          // Rejoin the session room if socket is connected
          if (commSocket && commConnected) {
            commSocket.emit("random-chat:join-session", parsedSession.sessionId);
          }
        } else {
          // Clear old session and its messages
          localStorage.removeItem('randomChatSession');
          // Clear all session-specific message storage
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('randomChatMessages_')) {
              localStorage.removeItem(key);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error loading persisted state:', error);
      localStorage.removeItem('randomChatSession');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('randomChatMessages_')) {
          localStorage.removeItem(key);
        }
      });
    }
  };

  // Helper function to load messages from localStorage
  const loadMessagesFromLocalStorage = (sessionId: string) => {
    const sessionStorageKey = `randomChatMessages_${sessionId}`;
    const savedSessionMessages = localStorage.getItem(sessionStorageKey);
    
    console.log('Loading messages from localStorage with key:', sessionStorageKey, 'found:', !!savedSessionMessages);
    
    if (savedSessionMessages) {
      const parsedMessages = JSON.parse(savedSessionMessages);
      console.log('Parsed messages from localStorage:', parsedMessages);
      setMessages(parsedMessages);
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (!commSocket || !commConnected) return;

    const handleMatchFound = (data: any) => {
      console.log("Random chat match found:", data);

      // Clear queue status
      setQueueStatus({
        inQueue: false,
        position: 0,
        estimatedWaitTime: 0,
      });

      // Set active session
      const newSession: RandomChatSession = {
        sessionId: data.sessionId,
        partner: data.partner,
        userAnonymousId: data.userAnonymousId || `User${Math.random().toString(36).substr(2, 4)}`,
        status: "active",
        chatType: data.chatType,
        startTime: new Date(data.startTime),
        messagesCount: data.messagesCount || 0,
        messages: [],
      };

      setActiveSession(newSession);
      setMessages([]);

      // Store session in localStorage for persistence
      localStorage.setItem('randomChatSession', JSON.stringify(newSession));

  // Join session room
  if (commSocket) commSocket.emit("random-chat:join-session", data.sessionId);

      toast.success(
        `Match found! You're now chatting with ${data.partner.anonymousId}`
      );
    };

    const handleMessageReceived = (message: any) => {
      console.log("Random chat message received:", message);

      const newMessage: RandomChatMessage = {
        messageId: message.messageId,
        sessionId: message.sessionId,
        anonymousId: message.anonymousId,
        content: message.content,
        timestamp: new Date(message.timestamp),
        type: message.type,
        isOwn: message.isOwn,
      };

      setMessages((prev) => {
        // Check for duplicate messages
        const isDuplicate = prev.some(msg => msg.messageId === newMessage.messageId);
        if (isDuplicate) {
          return prev;
        }
        
        const updatedMessages = [...prev, newMessage];
        // Store messages in localStorage for persistence with session ID key
        const storageKey = `randomChatMessages_${newMessage.sessionId}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
        console.log('Stored messages to localStorage:', storageKey, updatedMessages);
        return updatedMessages;
      });

      // Update session message count
      setActiveSession((prev) => {
        if (prev) {
          const updatedSession = {
            ...prev,
            messagesCount: prev.messagesCount + 1,
          };
          // Update session in localStorage
          localStorage.setItem('randomChatSession', JSON.stringify(updatedSession));
          return updatedSession;
        }
        return null;
      });
    };

    const handlePartnerTyping = () => {
      setPartnerTyping(true);

      // Clear existing timeout
      if (partnerTypingTimeoutRef.current) {
        clearTimeout(partnerTypingTimeoutRef.current);
      }

      // Set timeout to hide typing indicator
      partnerTypingTimeoutRef.current = setTimeout(() => {
        setPartnerTyping(false);
      }, 3000);
    };

    const handlePartnerStoppedTyping = () => {
      setPartnerTyping(false);
      if (partnerTypingTimeoutRef.current) {
        clearTimeout(partnerTypingTimeoutRef.current);
      }
    };

    const handlePartnerLeft = () => {
      toast.info("Your chat partner has left the conversation");
      setPartnerTyping(false);
    };

    const handleSessionEnded = (data: any) => {
      console.log("Random chat session ended:", data);
      const reason = data?.reason || data || "unknown";

      // Store current session before clearing
      const currentSession = activeSession;

      // Clear session
      setActiveSession(null);
      setMessages([]);
      setPartnerTyping(false);
      setIsTyping(false);

      // Clear localStorage for this session
      localStorage.removeItem('randomChatSession');
      if (currentSession) {
        const storageKey = `randomChatMessages_${currentSession.sessionId}`;
        localStorage.removeItem(storageKey);
      }
      localStorage.removeItem('randomChatMessages');

      // Show appropriate message
      const reasons: Record<string, string> = {
        user_left: "You left the conversation",
        partner_left: "Your partner left the conversation",
        reported: "The conversation was ended due to a report",
        timeout: "The conversation timed out due to inactivity",
        system_ended: "The conversation was ended by the system",
      };

      toast.info(reasons[reason] || "The conversation has ended");
    };

    const handleQueuePosition = (data: {
      position: number;
      estimatedWait: number;
    }) => {
      setQueueStatus((prev) => ({
        ...prev,
        position: data.position,
        estimatedWaitTime: data.estimatedWait,
      }));
    };

    const handleError = (message: string) => {
      console.error("Random chat error:", message);
      setConnectionError(message);
      toast.error(message);
    };

  // Register event listeners
  commSocket.on("random-chat:match-found", handleMatchFound);
  commSocket.on("random-chat:message-received", handleMessageReceived);
  commSocket.on("random-chat:partner-typing", handlePartnerTyping);
  commSocket.on("random-chat:partner-stopped-typing", handlePartnerStoppedTyping);
  commSocket.on("random-chat:partner-left", handlePartnerLeft);
  commSocket.on("random-chat:session-ended", handleSessionEnded);
  commSocket.on("random-chat:queue-position", handleQueuePosition);
  commSocket.on("error", handleError);

    return () => {
      // Cleanup event listeners
      commSocket.off("random-chat:match-found", handleMatchFound);
      commSocket.off("random-chat:message-received", handleMessageReceived);
      commSocket.off("random-chat:partner-typing", handlePartnerTyping);
      commSocket.off(
        "random-chat:partner-stopped-typing",
        handlePartnerStoppedTyping
      );
      commSocket.off("random-chat:partner-left", handlePartnerLeft);
      commSocket.off("random-chat:session-ended", handleSessionEnded);
      commSocket.off("random-chat:queue-position", handleQueuePosition);
      commSocket.off("error", handleError);
    };
  }, [commSocket, commConnected]);

  // Load initial state (queue status and active session)
  const loadInitialState = async () => {
    try {
      setIsLoadingSession(true);

      // Check queue status
      const queueResponse = await fetch("/api/random-chat/queue");
      if (queueResponse.ok) {
        const queueData = await queueResponse.json();
        if (queueData.success && queueData.data.inQueue) {
          setQueueStatus(queueData.data);
        }
      }

      // Check active session
      const sessionResponse = await fetch("/api/random-chat/session");
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        if (sessionData.success && sessionData.data.hasActiveSession) {
          const data = sessionData.data;
          setActiveSession({
            sessionId: data.sessionId,
            partner: data.partner,
            userAnonymousId: data.userAnonymousId,
            status: data.status,
            chatType: data.chatType,
            startTime: new Date(data.startTime),
            messagesCount: data.messagesCount,
            messages: data.messages || [],
          });
          setMessages(data.messages || []);

          // Join session room
          if (commSocket) {
            commSocket.emit("random-chat:join-session", data.sessionId);
          }
        }
      }
    } catch (error) {
      console.error("Error loading initial state:", error);
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Join queue
  const joinQueue = async (
    preferences: ChatPreferences
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsJoiningQueue(true);
      setConnectionError(null);
      // If user is authenticated, use the existing HTTP queue endpoint (server-backed)
      if (session?.user) {
        const response = await fetch("/api/random-chat/queue", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chatType: preferences.chatType,
            preferences,
          }),
        });

        const data = await response.json();

        if (data.success) {
          if (data.data.type === "match_found") {
            // Immediate match
            const newSession: RandomChatSession = {
              sessionId: data.data.sessionId,
              partner: data.data.partner,
              userAnonymousId: data.data.anonymousId,
              status: "active",
              chatType: data.data.chatType,
              startTime: new Date(),
              messagesCount: 0,
              messages: [],
            };

            setActiveSession(newSession);
            setMessages([]);

            if (socket) {
              socket.emit("random-chat:join-session", data.data.sessionId);
            }

            toast.success(
              `Match found! You're now chatting with ${data.data.partner.anonymousId}`
            );
          } else {
            // Added to queue
            setQueueStatus({
              inQueue: true,
              queueId: data.data.queueId,
              anonymousId: data.data.anonymousId,
              position: data.data.position,
              estimatedWaitTime: data.data.estimatedWaitTime,
              chatType: preferences.chatType,
              joinedAt: new Date(),
            });

            toast.info(`Added to queue. Position: ${data.data.position}`);
          }

          return { success: true };
        } else {
          return { success: false, error: data.error };
        }
      }

      // Anonymous/unauthed path: use anonymous socket queue
      await connectAnon()
      // wait briefly for connect to settle
      await new Promise((r) => setTimeout(r, 200))

      if (!anonSocket) {
        return { success: false, error: 'Failed to establish anonymous connection' }
      }

      // Emit join-queue on the anonymous socket
      anonSocket.emit('random-chat:join-queue', {
        chatType: preferences.chatType,
        preferences,
      })

      // Update UI queue state optimistically; server will emit precise queue-position
      setQueueStatus(prev => ({
        ...prev,
        inQueue: true,
        anonymousId: anonId || localStorage.getItem('randomChatAnonId') || undefined,
        chatType: preferences.chatType,
        joinedAt: new Date(),
      }))

      toast.info('Searching for a random chat partner...')

      return { success: true }
    } catch (error) {
      console.error("Error joining queue:", error);
      return { success: false, error: "Failed to join queue" };
    } finally {
      setIsJoiningQueue(false);
    }
  };

  // Leave queue
  const leaveQueue = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      setIsLeavingQueue(true);
      if (session?.user) {
        const response = await fetch("/api/random-chat/queue", {
          method: "DELETE",
        });

        const data = await response.json();

        if (data.success) {
          setQueueStatus({
            inQueue: false,
            position: 0,
            estimatedWaitTime: 0,
          });

          toast.success("Left the queue");
          return { success: true };
        } else {
          return { success: false, error: data.error };
        }
      }

      // Anonymous path: emit leave-queue on anonSocket
      if (anonSocket) {
        anonSocket.emit('random-chat:leave-queue')
      }

      setQueueStatus({
        inQueue: false,
        position: 0,
        estimatedWaitTime: 0,
      })

      toast.success('Left the queue')
      return { success: true }
    } catch (error) {
      console.error("Error leaving queue:", error);
      return { success: false, error: "Failed to leave queue" };
    } finally {
      setIsLeavingQueue(false);
    }
  };

  // Send message
  const sendMessage = async (
    content: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!activeSession) {
      return { success: false, error: "No active session" };
    }

    if (!content.trim()) {
      return { success: false, error: "Message cannot be empty" };
    }

    try {
      // Try socket first, fallback to HTTP
      if (commSocket && commConnected) {
        commSocket.emit("random-chat:message-send", {
          sessionId: activeSession.sessionId,
          content: content.trim(),
          type: "text",
        });

        // Add message to local state immediately for better UX
        const newMessage: RandomChatMessage = {
          messageId: `temp-${Date.now()}`,
          sessionId: activeSession.sessionId,
          anonymousId: activeSession.userAnonymousId,
          content: content.trim(),
          timestamp: new Date(),
          type: "text",
          isOwn: true,
        };

        setMessages((prev) => {
          // Check for duplicate messages
          const isDuplicate = prev.some(msg => msg.messageId === newMessage.messageId);
          if (isDuplicate) {
            return prev;
          }
          
          const updatedMessages = [...prev, newMessage];
          // Store messages in localStorage for persistence with session ID key
          const storageKey = `randomChatMessages_${activeSession.sessionId}`;
          localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
          console.log('Stored sent message to localStorage:', storageKey, updatedMessages);
          return updatedMessages;
        });
      } else {
        // Fallback to HTTP API
        const response = await fetch("/api/random-chat/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "send-message",
            sessionId: activeSession.sessionId,
            content: content.trim(),
            type: "text",
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Add message to local state
          const newMessage: RandomChatMessage = {
            messageId: data.data.messageId,
            sessionId: activeSession.sessionId,
            anonymousId: activeSession.userAnonymousId,
            content: content.trim(),
            timestamp: new Date(data.data.timestamp),
            type: "text",
            isOwn: true,
          };

          setMessages((prev) => {
            // Check for duplicate messages
            const isDuplicate = prev.some(msg => msg.messageId === newMessage.messageId);
            if (isDuplicate) {
              return prev;
            }
            
            const updatedMessages = [...prev, newMessage];
            // Store messages in localStorage for persistence with session ID key
            const storageKey = `randomChatMessages_${activeSession.sessionId}`;
            localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
            console.log('Stored API sent message to localStorage:', storageKey, updatedMessages);
            return updatedMessages;
          });
        } else {
          return { success: false, error: data.error };
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Error sending message:", error);
      return { success: false, error: "Failed to send message" };
    }
  };

  // Start typing
  const startTyping = () => {
    if (!activeSession || !commSocket || isTyping) return;

    setIsTyping(true);
    commSocket.emit("random-chat:typing-start", activeSession.sessionId);

    // Auto-stop typing after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  // Stop typing
  const stopTyping = () => {
    if (!activeSession || !commSocket || !isTyping) return;

    setIsTyping(false);
    commSocket.emit("random-chat:typing-stop", activeSession.sessionId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  // End session
  const endSession = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!activeSession) {
      return { success: false, error: "No active session" };
    }

    try {
      // End via socket first if available
      if (commSocket && commConnected) {
        commSocket.emit("random-chat:end-session", activeSession.sessionId);
      }

      // Clear local state immediately for better UX
      const sessionToEnd = activeSession;
      setActiveSession(null);
      setMessages([]);
      setPartnerTyping(false);
      setIsTyping(false);

      // Clear localStorage for this session
      localStorage.removeItem('randomChatSession');
      const storageKey = `randomChatMessages_${sessionToEnd.sessionId}`;
      localStorage.removeItem(storageKey);

      // Try API as fallback
      try {
        const response = await fetch("/api/random-chat/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "end",
            sessionId: sessionToEnd.sessionId,
            reason: "user_left",
          }),
        });

        const data = await response.json();
        if (!data.success) {
          console.warn("API end session failed:", data.error);
        }
      } catch (apiError) {
        console.warn("API end session request failed:", apiError);
      }

      toast.success("Session ended");
      return { success: true };
    } catch (error) {
      console.error("Error ending session:", error);
      return { success: false, error: "Failed to end session" };
    }
  };

  // Report user
  const reportUser = async (
    reason: string,
    description?: string,
    messageIds?: string[]
  ): Promise<{ success: boolean; error?: string }> => {
    if (!activeSession) {
      return { success: false, error: "No active session" };
    }

    try {
      const response = await fetch("/api/random-chat/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: activeSession.sessionId,
          reason,
          description,
          messageIds,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Clear session as it will be ended
        setActiveSession(null);
        setMessages([]);
        setPartnerTyping(false);
        setIsTyping(false);

        toast.success("Report submitted successfully");
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Error reporting user:", error);
      return { success: false, error: "Failed to submit report" };
    }
  };

  // Refresh session
  const refreshSession = async () => {
    await loadInitialState();
  };

  // Join active session (for reconnection)
  const joinActiveSession = (sessionId: string) => {
    if (commSocket) {
      commSocket.emit("random-chat:join-session", sessionId);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (partnerTypingTimeoutRef.current) {
        clearTimeout(partnerTypingTimeoutRef.current);
      }
    };
  }, []);

  const contextValue: RandomChatContextType = {
    // Queue state
    queueStatus,
    isJoiningQueue,
    isLeavingQueue,

    // Session state
    activeSession,
    messages,
    isTyping,
    partnerTyping,
    isLoadingSession,

  // Connection state (includes anonymous fallback)
  isConnected: commConnected,
  connectionError,
  connectionState,
  // expose reconnect so UI can programmatically attempt reconnects
  reconnect: socketReconnect,

    // Actions
    joinQueue,
    leaveQueue,
    sendMessage,
    startTyping,
    stopTyping,
    endSession,
    reportUser,
    refreshSession,
    joinActiveSession,
    // expose anon name setter for UI components
    setAnonName: (name: string) => {
      try {
        localStorage.setItem('randomChatAnonName', name)
        setAnonNameState(name)
      } catch (e) {
        console.error('Failed to set anon name', e)
      }
    }
  };

  return (
    <RandomChatContext.Provider value={contextValue}>
      {children}
    </RandomChatContext.Provider>
  );
}

export function useRandomChat(): RandomChatContextType {
  const context = useContext(RandomChatContext);
  if (context === undefined) {
    throw new Error("useRandomChat must be used within a RandomChatProvider");
  }
  return context;
}
