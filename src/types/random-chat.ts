// Random Chat Types and Interfaces

export type ChatMode = 'text' | 'audio' | 'video';

export type ConnectionStatus = 
  | 'idle'
  | 'searching'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'ai-fallback'
  | 'verifying-face';

export interface FaceVerificationStatus {
  isVerified: boolean;
  lastCheckTime: Date;
  warningCount: number;
  maxWarnings: number;
  checkInterval: number; // milliseconds
  confidence?: number;
  reason?: string;
}

export interface RandomChatUser {
  userId: string;
  anonymousId: string;
  username: string;
  mode: ChatMode;
  isActive: boolean;
  faceVerified?: boolean;
  joinedAt: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  type: 'text' | 'system' | 'ai';
  timestamp: Date;
  isOwn: boolean;
}

export interface RandomChatSession {
  sessionId: string;
  mode: ChatMode;
  partner: RandomChatUser;
  userAnonymousId: string;
  status: 'active' | 'ended';
  startTime: Date;
  messages: ChatMessage[];
  faceVerification?: FaceVerificationStatus;
  webrtcConnected?: boolean;
  isAIBot?: boolean;
}

export interface QueueEntry {
  queueId: string;
  userId: string;
  anonymousId: string;
  mode: ChatMode;
  preferences?: {
    language?: string;
    interests?: string[];
  };
  joinedAt: Date;
  position: number;
  estimatedWaitTime: number;
}

export interface MatchRequest {
  mode: ChatMode;
  userId: string;
  anonymousId: string;
  preferences?: {
    language?: string;
    interests?: string[];
  };
}

export interface MatchResponse {
  success: boolean;
  sessionId?: string;
  partner?: RandomChatUser;
  isAIBot?: boolean;
  error?: string;
}

export interface FaceVerificationResult {
  faceDetected: boolean;
  confidence: number;
  timestamp: Date;
  reason?: string;
  warning?: boolean;
}

// WebRTC Signaling Types
export interface RTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  sessionId: string;
  from: string;
  to: string;
  data: any;
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

// AI Bot Types
export interface AIBotMessage {
  content: string;
  type: 'text' | 'audio';
  delay?: number; // typing/speaking simulation delay
}

export interface AIBotResponse {
  message: string;
  emotion?: 'neutral' | 'happy' | 'curious' | 'empathetic';
  audioData?: string; // base64 TTS audio for audio mode
}
