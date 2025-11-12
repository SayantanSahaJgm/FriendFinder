"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Send,
  Bot,
  User,
  HelpCircle,
  Book,
  Shield,
  MapPin,
  Users,
  Settings,
  ChevronRight,
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const FAQ_CATEGORIES = [
  {
    icon: Users,
    title: "Friends & Connections",
    questions: [
      "How do I add friends?",
      "How does friend discovery work?",
      "Can I remove friends?",
    ],
  },
  {
    icon: MapPin,
    title: "Location & Discovery",
    questions: [
      "How does GPS discovery work?",
      "What is WiFi discovery?",
      "How to use Bluetooth discovery?",
    ],
  },
  {
    icon: Shield,
    title: "Privacy & Security",
    questions: [
      "Who can see my location?",
      "How to make my profile private?",
      "Is my data secure?",
    ],
  },
  {
    icon: Settings,
    title: "Settings & Features",
    questions: [
      "How to enable dark mode?",
      "How to change language?",
      "How to manage notifications?",
    ],
  },
];

export default function HelpCenter() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your FriendFinder assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAIResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();

    // Friends & Connections
    if (msg.includes("add friend") || msg.includes("how do i add")) {
      return "To add friends:\n1. Go to the 'Discover' tab\n2. Enable location, WiFi, or Bluetooth discovery\n3. Find nearby users and send friend requests\n4. Or search by username in the Friends tab";
    }
    if (msg.includes("friend discovery") || msg.includes("how does discovery")) {
      return "FriendFinder offers 3 discovery methods:\n• GPS Discovery: Find friends within your location range\n• WiFi Discovery: Connect with people on the same WiFi network\n• Bluetooth Discovery: Discover nearby users via Bluetooth\nEnable any method in Settings → Discovery";
    }
    if (msg.includes("remove friend") || msg.includes("unfriend")) {
      return "To remove a friend:\n1. Go to Friends tab\n2. Find the friend you want to remove\n3. Click on their profile\n4. Select 'Remove Friend'\nThey won't be notified.";
    }

    // Location & Discovery
    if (msg.includes("gps") || msg.includes("location discovery")) {
      return "GPS Discovery uses your device's location to find friends within your set discovery range (default 100 meters). Enable it in Settings → Discovery → GPS Discovery.";
    }
    if (msg.includes("wifi") || msg.includes("wifi discovery")) {
      return "WiFi Discovery connects you with people on the same WiFi network. It's great for finding friends at cafes, offices, or events. Enable in Settings → Discovery → WiFi Discovery.";
    }
    if (msg.includes("bluetooth") || msg.includes("bluetooth discovery")) {
      return "Bluetooth Discovery finds nearby users without needing GPS. It's perfect for indoor locations. Enable in Settings → Discovery → Bluetooth Discovery.";
    }

    // Privacy & Security
    if (msg.includes("who can see") || msg.includes("location privacy")) {
      return "Only your accepted friends can see your location, and only if you have location sharing enabled. You can control this in Settings → Privacy → Location Sharing.";
    }
    if (msg.includes("private") || msg.includes("profile privacy")) {
      return "Make your profile private in Settings → Privacy → Profile Visibility. Set it to 'Private' so only friends can see your full profile.";
    }
    if (msg.includes("secure") || msg.includes("data safe")) {
      return "Your data is encrypted and stored securely. We never share your information with third parties. Location data is only shared with your accepted friends when you enable location sharing.";
    }

    // Settings & Features
    if (msg.includes("dark mode") || msg.includes("theme")) {
      return "Enable dark mode:\n1. Go to Settings\n2. Find 'Quick Settings'\n3. Click the Theme toggle (Sun/Moon icon)\nYour preference is saved automatically!";
    }
    if (msg.includes("language") || msg.includes("change language")) {
      return "Change language:\n1. Go to Settings → Quick Settings\n2. Click 'Edit' next to Language\n3. Choose from 17 languages including Hindi, Bengali, Telugu, Tamil, and more\n4. Click 'Save'";
    }
    if (msg.includes("notification")) {
      return "Manage notifications in Settings → Notifications. You can control:\n• Push notifications\n• Email notifications\n• Friend requests alerts\n• New message alerts\n• Nearby friends alerts";
    }

    // Account & Authentication
    if (msg.includes("forgot password") || msg.includes("reset password")) {
      return "To reset your password:\n1. Go to Login page\n2. Click 'Forgot Password?'\n3. Enter your email\n4. Check your email for reset code\n5. Enter the code and set new password";
    }
    if (msg.includes("delete account") || msg.includes("close account")) {
      return "To delete your account:\n1. Go to Settings → Account\n2. Scroll to 'Danger Zone'\n3. Click 'Delete Account'\n4. Confirm your decision\nWarning: This action is permanent and cannot be undone!";
    }

    // Stories & Posts
    if (msg.includes("story") || msg.includes("post")) {
      return "Create stories and posts:\n1. Go to Dashboard\n2. Click the '+' button\n3. Choose 'Story' (expires in 24 hours) or 'Post'\n4. Upload photo/video and add text\n5. Share with friends!";
    }

    // Random Chat
    if (msg.includes("random chat") || msg.includes("video chat")) {
      return "Random Chat feature:\n1. Go to Random Chat tab\n2. Set your interests for better matching\n3. Click 'Start Chat' to connect with someone random\n4. Enable video for face-to-face chat\nAlways be respectful to others!";
    }

    // Default responses
    if (msg.includes("hello") || msg.includes("hi")) {
      return "Hello! How can I assist you today? You can ask about friends, discovery, privacy, settings, or any other feature!";
    }
    if (msg.includes("thank")) {
      return "You're welcome! Is there anything else I can help you with?";
    }
    if (msg.includes("help")) {
      return "I can help you with:\n• Adding and managing friends\n• Location discovery features\n• Privacy and security settings\n• App settings and customization\n• Stories and posts\n• Account management\n\nWhat would you like to know?";
    }

    // Default fallback
    return "I'm here to help! You can ask me about:\n• Friends & Connections\n• Location Discovery (GPS, WiFi, Bluetooth)\n• Privacy & Security\n• Settings & Features\n• Account Management\n• Stories & Posts\n\nOr contact our support team for personalized assistance.";
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate bot typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(inputMessage),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Help Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Get instant answers from our AI assistant or browse FAQs
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FAQ Categories */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Book className="h-5 w-5" />
                  <span>Quick Topics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {FAQ_CATEGORIES.map((category) => (
                  <div key={category.title} className="space-y-2">
                    <div className="flex items-center space-x-2 font-medium text-sm text-gray-700 dark:text-gray-300">
                      <category.icon className="h-4 w-4" />
                      <span>{category.title}</span>
                    </div>
                    <div className="space-y-1 pl-6">
                      {category.questions.map((question) => (
                        <button
                          key={question}
                          onClick={() => handleQuickQuestion(question)}
                          className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:underline w-full text-left"
                        >
                          <ChevronRight className="h-3 w-3" />
                          <span>{question}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Need More Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-sm"
                  onClick={() => (window.location.href = "/dashboard/settings")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Go to Settings
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-sm"
                  onClick={() =>
                    (window.location.href = "tel:+1-800-FRIEND-1")
                  }
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Call Support
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* AI Chatbot */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>AI Assistant</span>
                <Badge variant="secondary" className="ml-auto">
                  Online
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Chat Messages */}
              <div className="h-[500px] overflow-y-auto mb-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-2 ${
                      message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full ${
                        message.sender === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white"
                      }`}
                    >
                      {message.sender === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={`flex-1 max-w-[80%] ${
                        message.sender === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-lg whitespace-pre-line ${
                          message.sender === "user"
                            ? "bg-blue-600 text-white ml-auto"
                            : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        }`}
                      >
                        {message.text}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-start space-x-2">
                    <div className="p-2 rounded-full bg-gray-300 dark:bg-gray-700">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask me anything about FriendFinder..."
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!inputMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
