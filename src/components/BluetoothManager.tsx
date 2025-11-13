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
          <span>Bluetooth Settings</span>
          {isLoading && (
            <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
          )}
        </CardTitle>
        <p className="text-xs text-gray-500 mt-2">
          Bluetooth pairing has moved to Code Connection.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Set your device name for discovery.</p>
          <Input
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="Enter device name (e.g., My iPhone)"
            className="w-full h-11"
          />
        </div>
      </CardContent>
    </Card>
  );
}
