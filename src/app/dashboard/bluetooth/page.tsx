"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Bluetooth, 
  BluetoothOff, 
  RefreshCw, 
  UserPlus, 
  MapPin, 
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Waves,
  Shield,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { bluetoothService, BluetoothUser } from "@/services/bluetoothService";
import { useBluetooth } from "@/hooks/useBluetooth";
import NearbyBubbleView from "@/components/NearbyBubbleView";

export default function BluetoothPage() {
  const {
    isAvailable,
    hasPermission,
    isScanning,
    isAdvertising,
    requestPermission,
    startScanning,
    stopScanning,
    startAdvertising,
    stopAdvertising,
    findNearbyUsers,
    updateBluetoothPresence,
  } = useBluetooth();

  const [nearbyUsers, setNearbyUsers] = useState<BluetoothUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [codeExpires, setCodeExpires] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [pairingCodeInput, setPairingCodeInput] = useState('');
  const [pairingSubmitting, setPairingSubmitting] = useState(false);

  // Check if user has Bluetooth enabled
  useEffect(() => {
    checkBluetoothStatus();
  }, []);

  const checkBluetoothStatus = async () => {
    try {
      const status = await bluetoothService.getBluetoothStatus();
      setBluetoothEnabled(status.hasBluetooth);
      
      // If Bluetooth is enabled, automatically fetch nearby users
      if (status.hasBluetooth && nearbyUsers.length === 0) {
        setTimeout(() => handleScanNearby(), 500);
      }
    } catch (error) {
      console.error("Failed to check Bluetooth status:", error);
    }
  };

  const handleEnableBluetooth = async () => {
    try {
      setIsLoadingUsers(true);
      
      toast.info("Enabling Bluetooth discovery...", {
        description: "Setting up your device for nearby detection"
      });
      
      // Step 1: Check if Web Bluetooth API is available
      let browserBluetoothSupported = false;
      if ('bluetooth' in navigator) {
        browserBluetoothSupported = true;
        toast.info("Browser Bluetooth API detected", {
          description: "Attempting to request Bluetooth access..."
        });
        
        // Try to request browser Bluetooth permission
        try {
          if (isAvailable && !hasPermission) {
            const granted = await requestPermission();
            
            if (granted) {
              toast.success("✅ Browser Bluetooth access granted!");
              
              // Start advertising to make device discoverable
              try {
                const advSuccess = await startAdvertising();
                if (advSuccess) {
                  toast.success("📡 Device is now broadcasting");
                }
              } catch (err) {
                console.log("Advertising failed:", err);
              }
              
              // Start scanning for other devices
              try {
                await startScanning();
                toast.success("🔍 Scanning for nearby devices");
              } catch (err) {
                console.log("Scanning failed:", err);
              }
            } else {
              toast.warning("Browser Bluetooth permission denied", {
                description: "Using database-based discovery instead"
              });
            }
          }
        } catch (err: any) {
          console.error("Browser Bluetooth error:", err);
          toast.warning("Browser Bluetooth not available", {
            description: "Using database-based discovery"
          });
        }
      } else {
        toast.info("Using database-based Bluetooth discovery", {
          description: "Browser Bluetooth API not supported on this device"
        });
      }
      
      // Step 2: Always use database-based Bluetooth (fallback & primary method)
      // Generate a unique Bluetooth ID for this device
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 8);
      const bluetoothId = `bt_${timestamp}_${random}`;
      
      toast.info("Registering with server...", {
        description: "Saving Bluetooth ID to database"
      });
      
      // Step 3: Save Bluetooth ID to database
      const result = await bluetoothService.updateBluetooth(bluetoothId);
      
      if (result.success) {
        setBluetoothEnabled(true);
        toast.success("✅ Bluetooth discovery enabled!", {
          description: "You are now visible to nearby users"
        });
        
        // Refresh status to confirm
        await checkBluetoothStatus();
        
        // Step 4: Automatically scan for nearby users
        toast.info("🔍 Scanning for nearby users...", {
          description: "Looking for other FriendFinder users"
        });
        setTimeout(() => handleScanNearby(), 1000);
      } else {
        toast.error("Failed to enable Bluetooth discovery", {
          description: result.message || "Could not connect to server"
        });
      }
    } catch (error: any) {
      console.error("Failed to enable Bluetooth:", error);
      toast.error("Failed to enable Bluetooth", {
        description: error.message || "Please try again"
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleDisableBluetooth = async () => {
    try {
      setIsLoadingUsers(true);
      
      // Clear Bluetooth ID from database
      await bluetoothService.clearBluetooth();
      
      // Stop browser Bluetooth features if active
      if (isAdvertising) {
        await stopAdvertising().catch(err => console.log("Stop advertising:", err));
      }
      if (isScanning) {
        await stopScanning().catch(err => console.log("Stop scanning:", err));
      }
      
      setBluetoothEnabled(false);
      setNearbyUsers([]);
      toast.success("Bluetooth discovery disabled");
    } catch (error) {
      console.error("Failed to disable Bluetooth:", error);
      toast.error("Failed to disable Bluetooth");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleScanNearby = async () => {
    // Check if Bluetooth is enabled first
    try {
      const status = await bluetoothService.getBluetoothStatus();
      if (!status.hasBluetooth) {
        toast.error("Please enable Bluetooth discovery first", {
          description: "Click 'Enable Bluetooth Discovery' button above"
        });
        return;
      }
    } catch (error) {
      toast.error("Failed to check Bluetooth status", {
        description: "Please try enabling Bluetooth first"
      });
      return;
    }

    try {
      setIsLoadingUsers(true);
      
      toast.info("🔍 Scanning for nearby Bluetooth devices...", {
        description: "This may take a few seconds"
      });
      
      // Step 1: Try browser Bluetooth scanning if available
      if (isAvailable && hasPermission) {
        try {
          if (!isScanning) {
            await startScanning();
            toast.success("📡 Browser Bluetooth scan started");
          }
        } catch (err) {
          console.log("Browser Bluetooth scanning not available:", err);
        }
      }

      // Step 2: Fetch nearby users from database API (primary method)
      toast.info("📡 Checking database for nearby users...", {
        description: "Looking for users with Bluetooth enabled"
      });
      
      const response = await bluetoothService.getNearbyUsers();
      
      console.log("🔍 Bluetooth scan result:", {
        usersFound: response.users.length,
        users: response.users
      });
      
      setNearbyUsers(response.users);
      
      if (response.users.length === 0) {
        toast.warning("No nearby users found", {
          description: "Make sure your friends have Bluetooth enabled in the app"
        });
      } else {
        toast.success(`✅ Found ${response.users.length} nearby user${response.users.length > 1 ? 's' : ''}!`, {
          description: `${response.users.length} FriendFinder user${response.users.length > 1 ? 's' : ''} detected nearby`
        });
      }
    } catch (error: any) {
      console.error("Failed to scan for nearby users:", error);
      
      // Show more helpful error message
      if (error.message?.includes("No Bluetooth device set")) {
        toast.error("Please enable Bluetooth discovery first", {
          description: "Click the 'Enable Bluetooth Discovery' button"
        });
      } else if (error.message?.includes("Network")) {
        toast.error("Network error", {
          description: "Please check your internet connection"
        });
      } else {
        toast.error("Scan failed", {
          description: error.message || "Failed to scan for nearby users"
        });
      }
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleSendFriendRequest = async (userId: string, username: string) => {
    try {
      setSendingRequestTo(userId);
      
      const result = await bluetoothService.sendFriendRequest(userId);
      
      if (result.success) {
        toast.success(`Friend request sent to ${username}!`);
        
        // Update the user in the list
        setNearbyUsers(prev => 
          prev.map(user => 
            user.id === userId 
              ? { ...user, hasPendingRequestTo: true }
              : user
          )
        );
      }
    } catch (error: any) {
      console.error("Failed to send friend request:", error);
      toast.error(error.message || "Failed to send friend request");
    } finally {
      setSendingRequestTo(null);
    }
  };

  const formatLastSeen = (date: Date | string) => {
    const lastSeen = new Date(date);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Active now";
    if (diffInMinutes < 5) return "Active recently";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return lastSeen.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 fade-in pb-24">
      {/* Modern Gradient Header */}
      <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white px-4 sm:px-6 pt-6 sm:pt-8 pb-10 sm:pb-12 rounded-b-[28px] shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 sm:p-3 bg-white/20 backdrop-blur-xl rounded-2xl">
              <Bluetooth className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Bluetooth Discovery</h1>
              <p className="text-indigo-100 text-xs sm:text-sm mt-1">
                Connect with people nearby
              </p>
            </div>
          </div>
        </div>
      </div>

  <div className="max-w-4xl mx-auto px-3 sm:px-4 -mt-8 pb-16 space-y-4 sm:space-y-6">

      {/* Bluetooth Status Card */}
      <Card className="glass border-0 shadow-soft">
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              {bluetoothEnabled ? (
                <div className="p-2 sm:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-glow">
                  <Bluetooth className="h-5 w-5 sm:h-6 sm:w-6 text-white animate-pulse-slow" />
                </div>
              ) : (
                <div className="p-2 sm:p-3 bg-gray-100 rounded-2xl">
                  <BluetoothOff className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-base sm:text-lg">
                  {bluetoothEnabled ? "Discovery Active" : "Discovery Inactive"}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {bluetoothEnabled 
                    ? "You're visible to nearby users" 
                    : "Enable to discover nearby users"}
                </p>
              </div>
            </div>
          </div>
          {/* Status Indicators */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-4 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm">
              <div className={`p-1.5 sm:p-2.5 rounded-xl ${isAvailable ? 'bg-gradient-to-br from-green-400 to-green-500' : 'bg-gradient-to-br from-red-400 to-red-500'}`}>
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="text-center">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Device</p>
                <p className="text-xs sm:text-sm font-semibold mt-0.5">
                  {isAvailable ? "Compatible" : "Not Available"}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-4 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm">
              <div className={`p-1.5 sm:p-2.5 rounded-xl ${hasPermission ? 'bg-gradient-to-br from-green-400 to-green-500' : 'bg-gradient-to-br from-yellow-400 to-yellow-500'}`}>
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="text-center">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Permission</p>
                <p className="text-xs sm:text-sm font-semibold mt-0.5">
                  {hasPermission ? "Granted" : "Required"}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-4 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm">
              <div className={`p-1.5 sm:p-2.5 rounded-xl ${bluetoothEnabled ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-gray-300 to-gray-400'}`}>
                <Waves className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="text-center">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Discovery</p>
                <p className="text-xs sm:text-sm font-semibold mt-0.5">
                  {bluetoothEnabled ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
          </div>

          {/* Pairing Code Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 glass-dark rounded-2xl">
              <p className="text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">Create Pairing Code</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">Generate a 6-digit code for others to connect with you</p>
              <div className="flex gap-2">
                <input
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="Device name"
                  className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 border border-input bg-background text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-ring text-xs sm:text-sm placeholder:text-muted-foreground dark:bg-input/30"
                />
                <Button onClick={async () => {
                  try {
                    setGeneratingCode(true);
                    const nameToUse = deviceName.trim() || 'device';
                    const res = await bluetoothService.generatePairingCode(nameToUse);
                    if (res.success) {
                      setGeneratedCode(res.pairingCode || null);
                      setCodeExpires(res.pairingCodeExpires || null);
                      toast.success('Pairing code generated');
                      await checkBluetoothStatus();
                    } else {
                      toast.error(res.message || 'Failed to generate pairing code');
                    }
                  } catch (err: any) {
                    console.error('Generate code error', err);
                    toast.error(err.message || 'Failed to generate pairing code');
                  } finally {
                    setGeneratingCode(false);
                  }
                }} disabled={generatingCode} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-xs sm:text-sm px-2 sm:px-4">
                  {generatingCode ? 'Generating...' : 'Generate'}
                </Button>
              </div>

              {generatedCode && (
                <div className="mt-2 sm:mt-3 p-3 sm:p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2">Your pairing code</p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <div className="text-2xl sm:text-3xl font-mono font-bold tracking-widest bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-sm text-indigo-600">
                      {generatedCode}
                    </div>
                    {codeExpires && (
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        Expires: {new Date(codeExpires).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 sm:p-4 glass-dark rounded-2xl">
              <p className="text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">Enter Pairing Code</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">Have someone's code? Enter it to connect instantly</p>
              <div className="flex gap-2">
                <input
                  value={pairingCodeInput}
                  onChange={(e) => setPairingCodeInput(e.target.value)}
                  placeholder="6-digit code"
                  className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 border border-input bg-background text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-ring text-xs sm:text-sm placeholder:text-muted-foreground dark:bg-input/30"
                />
                <Button onClick={async () => {
                  if (!pairingCodeInput.trim()) { toast.error('Please enter a pairing code'); return; }
                  try {
                    setPairingSubmitting(true);
                    const res = await bluetoothService.pairWithCode(pairingCodeInput.trim());
                    if (res.success) {
                      toast.success(res.message || 'Connected! Friend request sent');
                      setPairingCodeInput('');
                      await handleScanNearby();
                    } else {
                      toast.error(res.message || 'Failed to pair using code');
                    }
                  } catch (err: any) {
                    console.error('Pairing submit error', err);
                    toast.error(err.message || 'Failed to pair using code');
                  } finally {
                    setPairingSubmitting(false);
                  }
                }} disabled={pairingSubmitting} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-xs sm:text-sm px-2 sm:px-4">
                  {pairingSubmitting ? 'Checking...' : 'Connect'}
                </Button>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {!bluetoothEnabled ? (
              <Button 
                onClick={handleEnableBluetooth}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-glow text-white border-0"
                size="lg"
                disabled={isLoadingUsers}
              >
                {isLoadingUsers ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Enabling...
                  </>
                ) : (
                  <>
                    <Bluetooth className="h-5 w-5 mr-2" />
                    Enable Bluetooth Discovery
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleDisableBluetooth}
                  variant="outline"
                  className="flex-1 border-2 hover:bg-gray-50"
                  size="lg"
                  disabled={isLoadingUsers}
                >
                  {isLoadingUsers ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Disabling...
                    </>
                  ) : (
                    <>
                      <BluetoothOff className="h-5 w-5 mr-2" />
                      Disable
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleScanNearby}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-glow text-white border-0"
                  size="lg"
                  disabled={isLoadingUsers}
                >
                  {isLoadingUsers ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2" />
                      Scan for Nearby Users
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex-shrink-0">
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
            <div className="text-xs sm:text-sm text-gray-700 min-w-0">
              <p className="font-semibold mb-1 sm:mb-1.5">How it works</p>
              <ul className="space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs">
                <li>• Enable discovery to be visible to nearby users</li>
                <li>• Scan to find other FriendFinder users around you</li>
                <li>• Send friend requests to connect instantly</li>
                <li>• Your location is never shared - only proximity</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nearby Users */}
      {bluetoothEnabled && (
        <Card className="glass border-0 shadow-soft overflow-hidden">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                  Nearby Users
                  {nearbyUsers.length > 0 && (
                    <Badge className="ml-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
                      {nearbyUsers.length}
                    </Badge>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Users detected via Bluetooth
                </p>
              </div>
              {isScanning && (
                <Badge variant="outline" className="gap-2 border-indigo-200 text-indigo-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Scanning
                </Badge>
              )}
            </div>
            {isLoadingUsers && nearbyUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4 animate-pulse-slow">
                  <Loader2 className="h-12 w-12 text-white animate-spin" />
                </div>
                <p className="text-muted-foreground font-medium">Scanning for nearby users...</p>
              </div>
            ) : nearbyUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <BluetoothOff className="h-12 w-12 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                  No nearby users detected. Make sure others have Bluetooth enabled.
                </p>
                <Button 
                  onClick={handleScanNearby} 
                  variant="outline"
                  disabled={isLoadingUsers}
                  className="border-2"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Scan Again
                </Button>
              </div>
            ) : (
              <div>
                <NearbyBubbleView
                  users={nearbyUsers as any}
                  onConnect={(id: string) => handleSendFriendRequest(id, nearbyUsers.find(u => u.id === id)?.username || '')}
                  onRescan={() => handleScanNearby()}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Privacy & Safety */}
      <Card className="glass-dark border-0 shadow-soft overflow-hidden">
        <div className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-indigo-50">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <h3 className="font-semibold text-base sm:text-lg text-gray-900">Privacy & Safety</h3>
          </div>
          <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-gray-700">
            <li className="flex items-start gap-2 sm:gap-2.5">
              <div className="p-0.5 sm:p-1 bg-gradient-to-br from-green-400 to-green-500 rounded-full mt-0.5 flex-shrink-0">
                <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
              </div>
              <span className="min-w-0">Your exact location is never shared - only proximity</span>
            </li>
            <li className="flex items-start gap-2 sm:gap-2.5">
              <div className="p-0.5 sm:p-1 bg-gradient-to-br from-green-400 to-green-500 rounded-full mt-0.5 flex-shrink-0">
                <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
              </div>
              <span className="min-w-0">Only FriendFinder app users can discover you</span>
            </li>
            <li className="flex items-start gap-2 sm:gap-2.5">
              <div className="p-0.5 sm:p-1 bg-gradient-to-br from-green-400 to-green-500 rounded-full mt-0.5 flex-shrink-0">
                <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
              </div>
              <span className="min-w-0">Disable Bluetooth discovery anytime</span>
            </li>
            <li className="flex items-start gap-2 sm:gap-2.5">
              <div className="p-0.5 sm:p-1 bg-gradient-to-br from-green-400 to-green-500 rounded-full mt-0.5 flex-shrink-0">
                <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
              </div>
              <span className="min-w-0">Your Bluetooth data is encrypted and secure</span>
            </li>
          </ul>
        </div>
      </Card>
      </div>
    </div>
  );
}

