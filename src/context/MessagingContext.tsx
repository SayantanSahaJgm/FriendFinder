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
import io from "socket.io-client";

type SocketType = ReturnType<typeof io>;

interface ChatMessage {
  _id: string;
  chatId: string;
  senderId: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  receiverId: string;
  content: string;
  type: "text" | "image" | "file" | "system";
  status: "sent" | "delivered" | "read";
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
  deliveredAt?: Date;
}

interface Chat {
  chatId: string;
  friend: {
    id: string;
    username: string;
    email: string;
    profilePicture?: string;
  };
  lastMessage: {
    _id: string;
    content: string;
    type: string;
    senderId: string;
    isFromCurrentUser: boolean;
    createdAt: Date;
    status: string;
  };
  unreadCount: number;
  updatedAt: Date;
}

interface TypingUser {
  userId: string;
  username: string;
  chatId: string;
}

interface MessagingContextType {
  // Connection
  socket: SocketType | null;
  isConnected: boolean;

  // Chats
  chats: Chat[];
  chatsLoading: boolean;
  chatsError: string | null;

  // Current chat
  currentChatId: string | null;
  currentFriendId: string | null;
  messages: ChatMessage[];
  messagesLoading: boolean;
  messagesError: string | null;

  // Typing indicators
  typingUsers: TypingUser[];
  isTyping: boolean;

  // Actions
  connectSocket: () => Promise<void>;
  disconnectSocket: () => void;
  openChat: (friendId: string) => Promise<void>;
  closeChat: () => void;
  sendMessage: (
    content: string,
    type?: "text" | "image" | "file"
  ) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  markAsRead: (messageId?: string) => void;
  startTyping: () => void;
  stopTyping: () => void;
  refreshChats: () => Promise<void>;
}

export const MessagingContext = createContext<MessagingContextType | undefined>(
  undefined
);

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error("useMessaging must be used within a MessagingProvider");
  }
  return context;
}

interface MessagingProviderProps {
  children: ReactNode;
}

export function MessagingProvider({ children }: MessagingProviderProps) {
  const { data: session, status } = useSession();

  // Socket connection
  const [socket, setSocket] = useState<SocketType | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Chats
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);

  // Current chat
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentFriendId, setCurrentFriendId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  // Typing indicators
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to Socket.IO
  const connectSocket = async () => {
    if (!session?.user) return;

    try {
      // Prefer explicit env var, otherwise default to current page origin (so hosted frontends
      // connect back to their own host) and finally fall back to localhost:3004 for dev.
      const socketPort = process.env.NEXT_PUBLIC_SOCKET_PORT || "3004";
      const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
      const pageOrigin = typeof window !== "undefined" ? window.location.origin : undefined;
      const socketUrl = envUrl || pageOrigin || `http://localhost:${socketPort}`;

      console.log("Connecting to Socket.IO server:", socketUrl);

      const newSocket = io(socketUrl, {
        path: "/socket.io/",
        transports: ["websocket", "polling"],
        timeout: 20000,
        autoConnect: true,
        // Ensure we include credentials when connecting across origins if needed
        withCredentials: true,
      });

      newSocket.on("connect", () => {
        console.log("Connected to messaging server");
        setIsConnected(true);
        
        // Register user with the socket
        if (session?.user) {
          newSocket.emit('user-register', {
            userId: session.user.id || session.user.email,
            username: session.user.name || session.user.email?.split('@')[0],
            email: session.user.email
          });
        }
        
        newSocket.emit("user:join");
      });

      newSocket.on("disconnect", () => {
        console.log("Disconnected from messaging server");
        setIsConnected(false);
      });

      newSocket.on("message:received", (message: ChatMessage) => {
        setMessages((prev) => [...prev, message]);

        // Update chat list
        refreshChats();
      });

      // Support both legacy string payloads and new object payloads with timestamps
      newSocket.on(
        "message:delivered",
        (payload: string | { messageId: string; deliveredAt?: string; chatId?: string }) => {
          const messageId = typeof payload === "string" ? payload : payload.messageId;
          const deliveredAt = typeof payload === "string" ? undefined : payload.deliveredAt;

          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === messageId
                ? {
                    ...msg,
                    status: "delivered" as const,
                    deliveredAt: deliveredAt ? new Date(deliveredAt) : msg.deliveredAt,
                  }
                : msg
            )
          );

          // Refresh chats so conversation preview reflects delivery status
          refreshChats();
        }
      );

      newSocket.on(
        "message:read",
        (payload: string | { messageId: string; readAt?: string; chatId?: string }) => {
          const messageId = typeof payload === "string" ? payload : payload.messageId;
          const readAt = typeof payload === "string" ? undefined : payload.readAt;

          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === messageId
                ? {
                    ...msg,
                    status: "read" as const,
                    readAt: readAt ? new Date(readAt) : msg.readAt,
                  }
                : msg
            )
          );

          // Update chats list to reflect read and clear unread counts
          refreshChats();
        }
      );

      newSocket.on(
        "typing:start",
        (data: { chatId: string; userId: string; username: string }) => {
          if (data.chatId === currentChatId) {
            setTypingUsers((prev) => {
              const existing = prev.find(
                (u) => u.userId === data.userId && u.chatId === data.chatId
              );
              if (existing) return prev;
              return [...prev, data];
            });
          }
        }
      );

      newSocket.on(
        "typing:stop",
        (data: { chatId: string; userId: string }) => {
          setTypingUsers((prev) =>
            prev.filter(
              (u) => !(u.userId === data.userId && u.chatId === data.chatId)
            )
          );
        }
      );

      newSocket.on("error", (error: string) => {
        console.error("Socket error:", error);
      });

      setSocket(newSocket);
    } catch (error) {
      console.error("Failed to connect to messaging server:", error);
    }
  };

  // Disconnect socket
  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  };

  // Load chat list
  const refreshChats = async () => {
    if (!session?.user) return;

    setChatsLoading(true);
    setChatsError(null);

    try {
      const response = await fetch("/api/messages/chats");

      if (!response.ok) {
        throw new Error("Failed to load chats");
      }

      const data = await response.json();
      setChats(data.chats || []);
    } catch (error) {
      setChatsError("Failed to load chats");
    } finally {
      setChatsLoading(false);
    }
  };

  // Open a chat with a friend
  const openChat = async (friendId: string) => {
    if (!session?.user) return;

    setCurrentFriendId(friendId);
    setMessagesLoading(true);
    setMessagesError(null);

    // Create chat ID
    const sortedIds = [session.user.email!, friendId].sort();
    const chatId = `${sortedIds[0]}_${sortedIds[1]}`;
    setCurrentChatId(chatId);

    try {
      const response = await fetch(
        `/api/messages?friendId=${friendId}&limit=50`
      );

      if (!response.ok) {
        throw new Error("Failed to load messages");
      }

      const data = await response.json();
      setMessages(data.messages || []);

      // Mark messages as read
      if (data.messages.length > 0) {
        markAsRead();
      }
    } catch (error) {
      setMessagesError("Failed to load messages");
    } finally {
      setMessagesLoading(false);
    }
  };

  // Close current chat
  const closeChat = () => {
    setCurrentChatId(null);
    setCurrentFriendId(null);
    setMessages([]);
    setTypingUsers([]);
  };

  // Send a message
  const sendMessage = async (
    content: string,
    type: "text" | "image" | "file" = "text"
  ) => {
    if (!currentFriendId || !currentChatId || !content.trim()) return;

    // Create optimistic local message so UI updates immediately
    const optimisticId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const optimisticMsg = {
      _id: optimisticId,
      chatId: currentChatId,
      senderId: {
        _id: session?.user?.id || session?.user?.email || "me",
        username: session?.user?.name || session?.user?.email?.split("@")[0] || "me",
      },
      receiverId: currentFriendId,
      content: content.trim(),
      type,
      status: "sent" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ChatMessage;

    setMessages((prev) => [...prev, optimisticMsg]);

    // Stop typing indicator
    stopTyping();

    // Prefer socket if connected
    if (socket && isConnected) {
      try {
        socket.emit("message:send", {
          chatId: currentChatId,
          receiverId: currentFriendId,
          content: content.trim(),
          type,
        });
        return;
      } catch (err) {
        console.error("Socket send failed, falling back to HTTP:", err);
      }
    }

    // Fallback: send via HTTP API so message still reaches server
    try {
      const resp = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: currentChatId, receiverId: currentFriendId, content: content.trim(), type }),
      });

      if (!resp.ok) {
        throw new Error("HTTP send failed");
      }

      const data = await resp.json();

      // Replace optimistic message with server message if provided
      if (data && data.message) {
        setMessages((prev) => prev.map((m) => (m._id === optimisticId ? data.message : m)));
      }
    } catch (err) {
      console.error("Failed to send message via API:", err);
      // leave optimistic message as-is; UI could show failed status later
    }
  };

  // Load more messages (pagination)
  const loadMoreMessages = async () => {
    if (!currentFriendId || messagesLoading || messages.length === 0) return;

    setMessagesLoading(true);

    try {
      const oldestMessage = messages[0];
      const response = await fetch(
        `/api/messages?friendId=${currentFriendId}&limit=50&before=${oldestMessage.createdAt}`
      );

      if (!response.ok) {
        throw new Error("Failed to load more messages");
      }

      const data = await response.json();
      if (data.messages.length > 0) {
        setMessages((prev) => [...data.messages, ...prev]);
      }
    } catch (error) {
      console.error("Failed to load more messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Mark messages as read
  const markAsRead = (messageId?: string) => {
    if (!socket || !currentChatId) return;

    // Optimistically update local state so UI reflects reads immediately
    setMessages((prev) =>
      prev.map((msg) => {
        if (messageId) {
          if (msg._id === messageId) {
            return { ...msg, status: "read" as const, readAt: new Date() };
          }
          return msg;
        }

        // If no messageId provided, mark all messages in current chat as read
        if (msg.chatId === currentChatId) {
          return { ...msg, status: "read" as const, readAt: new Date() };
        }
        return msg;
      })
    );

    // Emit to server to persist and notify sender(s)
    socket.emit("message:read", {
      chatId: currentChatId,
      messageId,
    });
  };

  // Start typing indicator
  const startTyping = () => {
    if (!socket || !currentChatId || !currentFriendId || isTyping) return;

    setIsTyping(true);
    socket.emit("typing:start", {
      chatId: currentChatId,
      receiverId: currentFriendId,
    });

    // Auto-stop typing after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  // Stop typing indicator
  const stopTyping = () => {
    if (!socket || !currentChatId || !currentFriendId || !isTyping) return;

    setIsTyping(false);
    socket.emit("typing:stop", {
      chatId: currentChatId,
      receiverId: currentFriendId,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // Auto-connect when authenticated
  useEffect(() => {
    if (status === "authenticated" && session?.user && !socket) {
      connectSocket();
      refreshChats();
    }
  }, [session, status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const value: MessagingContextType = {
    socket,
    isConnected,
    chats,
    chatsLoading,
    chatsError,
    currentChatId,
    currentFriendId,
    messages,
    messagesLoading,
    messagesError,
    typingUsers,
    isTyping,
    connectSocket,
    disconnectSocket,
    openChat,
    closeChat,
    sendMessage,
    loadMoreMessages,
    markAsRead,
    startTyping,
    stopTyping,
    refreshChats,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}
