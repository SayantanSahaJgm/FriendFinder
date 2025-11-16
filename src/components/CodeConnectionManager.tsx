"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Hash, RefreshCw, Copy, Clock, UserPlus, Check } from "lucide-react";
import KeyGlyph from '@/components/icons/KeyGlyph';
import KeyIcon from '@/components/icons/KeyIcon';
import { toast } from "sonner";

interface Props {
  onUpdated?: () => void;
}

interface DiscoveredUser {
  id: string;
  name: string;
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  isFriend: boolean;
  hasPendingRequest: boolean;
}

export default function CodeConnectionManager({ onUpdated }: Props = {}) {
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [codeExpires, setCodeExpires] = useState<Date | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lookupCode, setLookupCode] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [discoveredUser, setDiscoveredUser] = useState<DiscoveredUser | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  useEffect(() => {
    if (!codeExpires) {
      setTimeRemaining("");
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(codeExpires).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining("Expired");
        setGeneratedCode(null);
        setCodeExpires(null);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [codeExpires]);

  const handleGenerateCode = async () => {
    try {
      setIsGenerating(true);
      const response = await fetch('/api/discover/code', {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setGeneratedCode(result.code);
        setCodeExpires(new Date(result.expiresAt));
        toast.success("Discovery code generated!");
        onUpdated?.();
      } else {
        toast.error(result.error || "Failed to generate code");
      }
    } catch (error: any) {
      console.error("Code generation error:", error);
      toast.error(error?.message || "Failed to generate code");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast.success("Code copied to clipboard!");
    }
  };

  const handleLookupCode = async () => {
    if (!lookupCode.trim() || lookupCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    try {
      setIsLookingUp(true);
      const response = await fetch(`/api/discover/code?code=${lookupCode.trim()}`);
      const result = await response.json();

      if (result.success && result.user) {
        // Normalize user object to ensure required display fields exist
        const user = {
          id: result.user.id,
          name: result.user.name || result.user.username || 'Unknown',
          username: result.user.username || '',
          email: result.user.email || '',
          profilePicture: result.user.profilePicture,
          bio: result.user.bio,
          isFriend: Boolean(result.user.isFriend),
          hasPendingRequest: Boolean(result.user.hasPendingRequest),
        } as DiscoveredUser;

        setDiscoveredUser(user);
        toast.success(`Found ${user.name}!`);
      } else {
        toast.error(result.error || "Invalid or expired code");
        setDiscoveredUser(null);
      }
    } catch (error: any) {
      console.error("Lookup error:", error);
      toast.error(error?.message || "Failed to lookup code");
      setDiscoveredUser(null);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!discoveredUser) return;

    try {
      setIsSendingRequest(true);
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: discoveredUser.id }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Friend request sent to ${discoveredUser.name}!`);
        setDiscoveredUser({
          ...discoveredUser,
          hasPendingRequest: true,
        });
        onUpdated?.();
      } else {
        toast.error(result.error || "Failed to send friend request");
      }
    } catch (error: any) {
      console.error("Friend request error:", error);
      toast.error(error?.message || "Failed to send friend request");
    } finally {
      setIsSendingRequest(false);
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
          <KeyGlyph className="h-5 w-5 text-indigo-600" />
          <span>Code Connection</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-2">
            <KeyGlyph className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Share Your Code</h3>
          </div>

          {!generatedCode ? (
            <div className="space-y-3">
              <Button
                onClick={handleGenerateCode}
                disabled={isGenerating}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700"
              >
                    {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <KeyIcon className="h-4 w-4 mr-2" />
                    Generate Discovery Code
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
                  <KeyGlyph className="h-4 w-4 mr-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Your Discovery Code</p>
                  <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 tracking-wider mb-3 font-mono">
                    {generatedCode}
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>
                      {timeRemaining === "Expired" ? (
                        <span className="text-red-600 font-medium">Expired</span>
                      ) : (
                        <span>Expires in {timeRemaining}</span>
                      )}
                    </span>
                  </div>
                </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleCopyCode}
                  variant="outline"
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
                <Button
                  onClick={() => {
                    setGeneratedCode(null);
                    setCodeExpires(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  New Code
                </Button>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Share this 6-digit code with someone nearby to let them discover you
          </p>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700" />

        <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-2">
            <KeyGlyph className="h-4 w-4 text-green-600" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Enter Someone's Code</h3>
          </div>

          <Input
            value={lookupCode}
            onChange={(e) => setLookupCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code"
            disabled={isLookingUp}
            className="w-full h-11 text-center text-2xl tracking-wider font-mono"
            maxLength={6}
          />

          <Button
            onClick={handleLookupCode}
            disabled={isLookingUp || lookupCode.length !== 6}
            className="w-full h-11 bg-green-600 hover:bg-green-700"
          >
                {isLookingUp ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Looking up...
              </>
            ) : (
              <>
                    <KeyIcon className="h-4 w-4 mr-2" />
                Discover User
              </>
            )}
          </Button>

          {discoveredUser && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <KeyGlyph className="h-4 w-4 mr-2" />
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={discoveredUser.profilePicture} alt={discoveredUser.name} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                    {(discoveredUser.name && discoveredUser.name.charAt(0))
                      ? discoveredUser.name.charAt(0).toUpperCase()
                      : (discoveredUser.username && discoveredUser.username.charAt(0))
                        ? discoveredUser.username.charAt(0).toUpperCase()
                        : '?'}
                  </AvatarFallback>
                  </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                    {discoveredUser.name || discoveredUser.username || 'Unknown'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    @{discoveredUser.username}
                  </p>
                </div>
              </div>

              {discoveredUser.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {discoveredUser.bio}
                </p>
              )}

              {discoveredUser.isFriend ? (
                <Button
                  disabled
                  variant="outline"
                  className="w-full"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Already Friends
                </Button>
              ) : discoveredUser.hasPendingRequest ? (
                <Button
                  disabled
                  variant="outline"
                  className="w-full"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Request Pending
                </Button>
              ) : (
                <Button
                  onClick={handleSendFriendRequest}
                  disabled={isSendingRequest}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {isSendingRequest ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Send Friend Request
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Enter someone's code to see who they are and connect with them
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
