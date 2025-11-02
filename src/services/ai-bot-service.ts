import type { AIBotMessage, AIBotResponse } from '@/types/random-chat';

/**
 * AI Bot Service for Random Chat
 * Provides fallback conversational responses when no real users are available
 */

const greetings = [
  "Hey there! 👋 How's your day going?",
  "Hi! Nice to meet you! What brings you here today?",
  "Hello! 😊 I'm here to chat. What's on your mind?",
  "Hey! How are you doing today?",
];

const questions = [
  "What are your hobbies or interests?",
  "Have you watched any good movies or shows lately?",
  "What kind of music do you like?",
  "Do you have any fun plans coming up?",
  "What's something that made you smile recently?",
  "Are you more of a morning person or night owl?",
  "What's your favorite way to spend a weekend?",
];

const responses = {
  positive: [
    "That's awesome! Tell me more about it.",
    "Sounds great! I'd love to hear more.",
    "That's really interesting! 😊",
    "Cool! What do you like most about that?",
  ],
  negative: [
    "I'm sorry to hear that. Want to talk about it?",
    "That sounds tough. How are you coping?",
    "I understand. Is there anything that might help?",
  ],
  neutral: [
    "I see. What else is on your mind?",
    "Interesting perspective! What made you think that way?",
    "Got it! Anything else you'd like to chat about?",
  ],
  goodbye: [
    "It was nice chatting with you! Take care! 👋",
    "Thanks for the conversation! Have a great day!",
    "Goodbye! Hope to chat again sometime! 😊",
  ],
};

class AIBotService {
  private conversationHistory: string[] = [];
  private messageCount: number = 0;
  private hasGreeted: boolean = false;

  /**
   * Generate a response to user message
   */
  generateResponse(userMessage: string): AIBotResponse {
    this.conversationHistory.push(userMessage);
    this.messageCount++;

    const lowerMessage = userMessage.toLowerCase();

    // Greeting
    if (!this.hasGreeted) {
      this.hasGreeted = true;
      return {
        message: this.getRandomItem(greetings),
        emotion: 'happy',
      };
    }

    // Farewell
    if (this.isFarewell(lowerMessage)) {
      return {
        message: this.getRandomItem(responses.goodbye),
        emotion: 'neutral',
      };
    }

    // Detect sentiment
    const sentiment = this.detectSentiment(lowerMessage);

    // Generate contextual response
    let message: string;

    if (this.messageCount % 3 === 0) {
      // Every 3rd message, ask a question
      message = this.getRandomItem(questions);
    } else if (sentiment === 'positive') {
      message = this.getRandomItem(responses.positive);
    } else if (sentiment === 'negative') {
      message = this.getRandomItem(responses.negative);
    } else {
      message = this.getRandomItem(responses.neutral);
    }

    return {
      message,
      emotion: sentiment as any,
    };
  }

  /**
   * Generate typing simulation delay
   */
  getTypingDelay(message: string): number {
    // Simulate realistic typing speed: ~50 chars per second
    const baseDelay = 1000;
    const charDelay = message.length * 20;
    return Math.min(baseDelay + charDelay, 3000);
  }

  /**
   * Detect sentiment from message
   */
  private detectSentiment(message: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'awesome', 'love', 'happy', 'excited', 'wonderful', 'fantastic', 'yes', 'nice', 'cool', 'amazing'];
    const negativeWords = ['bad', 'sad', 'terrible', 'hate', 'angry', 'upset', 'no', 'dont', "don't", 'never', 'awful', 'horrible'];

    const words = message.split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach((word) => {
      const cleanWord = word.replace(/[^a-z]/g, '');
      if (positiveWords.includes(cleanWord)) positiveCount++;
      if (negativeWords.includes(cleanWord)) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Check if message is a farewell
   */
  private isFarewell(message: string): boolean {
    const farewells = ['bye', 'goodbye', 'see you', 'gotta go', 'gtg', 'later', 'cya'];
    return farewells.some((word) => message.includes(word));
  }

  /**
   * Get random item from array
   */
  private getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Reset conversation
   */
  reset(): void {
    this.conversationHistory = [];
    this.messageCount = 0;
    this.hasGreeted = false;
  }

  /**
   * Generate audio response (Text-to-Speech simulation)
   * In production, this would call a real TTS API
   */
  async generateAudioResponse(text: string): Promise<string | null> {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return null;
    }

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        resolve(text); // In real implementation, return audio blob/base64
      };

      utterance.onerror = () => {
        resolve(null);
      };

      window.speechSynthesis.speak(utterance);
    });
  }
}

// Singleton instance
const aiBotService = new AIBotService();

export default aiBotService;

// Export methods for easy import
export const { generateResponse, getTypingDelay, reset, generateAudioResponse } = aiBotService;
