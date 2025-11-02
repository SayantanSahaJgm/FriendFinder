"use client";

import { useState, useEffect } from "react";
import { bluetoothService, BluetoothStatus } from "@/services/bluetoothService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bluetooth,
  BluetoothOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Copy,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface BluetoothManagerProps {
  onBluetoothUpdated?: () => void;
}

export default function BluetoothManager({
  onBluetoothUpdated,
}: BluetoothManagerProps = {}) {
  const [deviceName, setDeviceName] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [codeExpires, setCodeExpires] = useState<Date | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pairingCode, setPairingCode] = useState("");
  const [isPairing, setIsPairing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Countdown timer for code expiry
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
    if (!deviceName.trim()) {
      toast.error("Please enter a device name");
      return;
    }

    try {
      setIsGenerating(true);
      const result = await bluetoothService.generatePairingCode(deviceName.trim());
      
      console.log('🔵 [Bluetooth UI] Received response:', result);
      console.log('🔵 [Bluetooth UI] Code:', result.pairingCode, 'Expires:', result.pairingCodeExpires, 'Type:', typeof result.pairingCodeExpires);
      
      if (result.success && result.pairingCode) {
        setGeneratedCode(result.pairingCode);
        setCodeExpires(result.pairingCodeExpires ? new Date(result.pairingCodeExpires) : null);
        toast.success("Pairing code generated!");
        
        // Notify parent
        window.dispatchEvent(new CustomEvent("bluetoothUpdated"));
        if (onBluetoothUpdated) {
          onBluetoothUpdated();
        }
      }
    } catch (error: any) {
      console.error("Code generation error:", error);
      toast.error(error.message || "Failed to generate pairing code");
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
      console.log('🔵 [Bluetooth UI] Attempting to pair with code:', pairingCode);
      const result = await bluetoothService.pairWithCode(pairingCode.trim());
      
      console.log('🔵 [Bluetooth UI] Pair result:', result);
      if (result.success) {
        toast.success(result.message || "Pairing successful! Friend request sent.");
        setPairingCode("");
        
        // Notify parent
        window.dispatchEvent(new CustomEvent("bluetoothUpdated"));
        if (onBluetoothUpdated) {
          onBluetoothUpdated();
        }
      }
    } catch (error: any) {
      console.error("🔴 [Bluetooth UI] Pairing error:", error);
      toast.error(error.message || "Failed to pair with code");
    } finally {
      setIsPairing(false);
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Bluetooth className="h-5 w-5 text-purple-600" />
          <span>Manual Pairing</span>
          {isLoading && (
            <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
          )}
        </CardTitle>
        <p className="text-xs text-gray-500 mt-2">
          Generate a pairing code to connect with someone manually
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Section 1: Generate Pairing Code */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Generate Your Pairing Code</h3>
          <div className="space-y-2">
            <Input
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="Enter device name (e.g., My iPhone)"
              disabled={isGenerating || !!generatedCode}
              className="w-full"
            />
          </div>
          
          <Button
            onClick={handleGenerateCode}
            disabled={isGenerating || !deviceName.trim() || !!generatedCode}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Bluetooth className="h-4 w-4 mr-2" />
                Generate Code
              </>
            )}
          </Button>
        </div>

        {/* Generated Code Display */}
        {generatedCode && (
          <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-purple-900">Your Pairing Code:</span>
              {timeRemaining && (
                <Badge variant="secondary" className="bg-purple-200 text-purple-800">
                  <Clock className="h-3 w-3 mr-1" />
                  {timeRemaining}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white border-2 border-purple-200 rounded-lg p-3 text-center">
                <span className="text-3xl font-bold text-purple-600 tracking-widest">
                  {generatedCode}
                </span>
              </div>
              <Button
                onClick={handleCopyCode}
                variant="outline"
                size="icon"
                className="border-purple-300 hover:bg-purple-100"
              >
                <Copy className="h-4 w-4 text-purple-600" />
              </Button>
            </div>
            
            <p className="text-xs text-purple-700 text-center">
              Share this code with someone to connect with them
            </p>
            
            <Button
              onClick={() => {
                setGeneratedCode(null);
                setCodeExpires(null);
                setDeviceName("");
              }}
              variant="ghost"
              size="sm"
              className="w-full text-purple-600 hover:bg-purple-100"
            >
              Generate New Code
            </Button>
          </div>
        )}

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or</span>
          </div>
        </div>

        {/* Section 2: Enter Pairing Code */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Have a Pairing Code?</h3>
          <div className="space-y-2">
            <Input
              value={pairingCode}
              onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code"
              maxLength={6}
              disabled={isPairing}
              className="w-full text-center text-2xl tracking-widest font-semibold"
            />
            <p className="text-xs text-gray-500">
              Enter the code someone shared with you
            </p>
          </div>
          
          <Button
            onClick={handleSubmitPairingCode}
            disabled={isPairing || pairingCode.length !== 6}
            variant="outline"
            className="w-full border-purple-300 text-purple-600 hover:bg-purple-50"
          >
            {isPairing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Connect with Code
              </>
            )}
          </Button>
        </div>

        {/* Info Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Manual Pairing</p>
              <p>
                Generate a code and share it with someone to connect. For automatic nearby discovery, use the right panel.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
