"use client";

import { useState, useEffect } from "react";
import { wifiService } from "@/services/wifiService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wifi,
  RefreshCw,
  AlertCircle,
  Copy,
  Clock,
  Network,
} from "lucide-react";
import { toast } from "sonner";

interface WifiManagerProps {
  onWifiUpdated?: () => void;
}

export default function WifiManager({ onWifiUpdated }: WifiManagerProps = {}) {
  const [networkName, setNetworkName] = useState("");

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
          <Wifi className="h-5 w-5 text-blue-600" />
          <span>WiFi Settings</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Set your WiFi network name for discovery (pairing moved to Code Connection).</p>
          <Input
            value={networkName}
            onChange={(e) => setNetworkName(e.target.value)}
            placeholder="Enter WiFi network name"
            className="w-full h-11"
          />
        </div>
      </CardContent>
    </Card>
  );
}
