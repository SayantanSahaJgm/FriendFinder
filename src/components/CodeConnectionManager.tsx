"use client";

import { useState, useEffect } from "react";
import { wifiService } from "@/services/wifiService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, RefreshCw, Copy, Clock, Network, Hash } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onUpdated?: () => void;
}

export default function CodeConnectionManager({ onUpdated }: Props = {}) {
  const [networkName, setNetworkName] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [codeExpires, setCodeExpires] = useState<Date | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pairingCode, setPairingCode] = useState("");
  const [isPairing, setIsPairing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

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
      // Generate code without network name - just use empty string
      const result = await wifiService.generatePairingCode('');
      setGeneratedCode(result.pairingCode);
      setCodeExpires(new Date(result.expiresAt));
      toast.success("Pairing code generated!");
      window.dispatchEvent(new CustomEvent("wifiUpdated"));
      onUpdated?.();
    } catch (error: any) {
      console.error("Code generation error:", error);
      toast.error(error?.message || "Failed to generate pairing code");
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

  const handleSubmitPairingCode = async () => {
    if (!pairingCode.trim()) {
      toast.error("Please enter a pairing code");
      return;
    }

    try {
      setIsPairing(true);
      const result = await wifiService.pairWithCode(pairingCode.trim());
      if (result.success) {
        toast.success(result.message || "Pairing successful! Friend request sent.");
        setPairingCode("");
        window.dispatchEvent(new CustomEvent("wifiUpdated"));
        onUpdated?.();
      }
    } catch (error: any) {
      console.error("Pairing error:", error);
      toast.error(error?.message || "Failed to pair with code");
    } finally {
      setIsPairing(false);
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
          <Key className="h-5 w-5 text-blue-600" />
          <span>Code Connection</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center space-x-2 mb-2">
            <Network className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-700">Share Your Code</h3>
          </div>

          {!generatedCode ? (
            <div className="space-y-3">
              <Button
                onClick={handleGenerateCode}
                disabled={isGenerating}
                className="w-full h-11"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Generate Pairing Code
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-2">Your Pairing Code</p>
                  <p className="text-3xl font-bold text-blue-600 tracking-wider mb-3 font-mono">
                    {generatedCode}
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
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

          <p className="text-xs text-gray-500 leading-relaxed">
            Share this 6-digit code with someone nearby to connect
          </p>
        </div>

        <div className="border-t border-gray-200" />

        <div className="space-y-3">
          <div className="flex items-center space-x-2 mb-2">
            <Network className="h-4 w-4 text-green-600" />
            <h3 className="text-sm font-semibold text-gray-700">Enter Someone's Code</h3>
          </div>

          <Input
            value={pairingCode}
            onChange={(e) => setPairingCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code"
            disabled={isPairing}
            className="w-full h-11 text-center text-2xl tracking-wider font-mono"
            maxLength={6}
          />

          <Button
            onClick={handleSubmitPairingCode}
            disabled={isPairing || pairingCode.length !== 6}
            className="w-full h-11"
          >
            {isPairing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Connect with Code
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 leading-relaxed">
            Enter the code from someone to send a friend request
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
