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
      
      // Step 1: Request Browser Bluetooth Permission FIRST
      toast.info("Requesting Bluetooth permission...", {
        description: "Please allow Bluetooth access when prompted"
      });
      
      let bluetoothPermissionGranted = false;
      
      // Try to request browser Bluetooth permission
      if (isAvailable) {
        try {
          bluetoothPermissionGranted = await requestPermission();
          
          if (bluetoothPermissionGranted) {
            toast.success("Bluetooth permission granted!");
            
            // Start advertising to make device discoverable
            await startAdvertising().catch(err => {
              console.log("Advertising optional:", err);
            });
          } else {
            toast.warning("Bluetooth permission denied by browser", {
              description: "You can still use database-based discovery"
            });
          }
        } catch (err: any) {
          console.log("Browser Bluetooth not available:", err);
          toast.info("Using database-based Bluetooth discovery", {
            description: "Browser Bluetooth API not supported"
          });
        }
      }
      
      // Step 2: Generate a unique Bluetooth ID for this device
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 8);
      const bluetoothId = `bt_${timestamp}_${random}`;
      
      // Step 3: Save Bluetooth ID to database
      const result = await bluetoothService.updateBluetooth(bluetoothId);
      
      if (result.success) {
        setBluetoothEnabled(true);
        toast.success("Bluetooth discovery enabled! Scanning for nearby users...");
        
        // Refresh status to confirm
        await checkBluetoothStatus();
        
        // Step 4: Automatically scan for nearby users
        setTimeout(() => handleScanNearby(), 500);
      } else {
        toast.error("Failed to enable Bluetooth discovery");
      }
    } catch (error: any) {
      console.error("Failed to enable Bluetooth:", error);
      toast.error(error.message || "Failed to enable Bluetooth");
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
        toast.error("Please enable Bluetooth discovery first");
        return;
      }
    } catch (error) {
      toast.error("Failed to check Bluetooth status");
      return;
    }

    try {
      setIsLoadingUsers(true);
      
      toast.info("Scanning for nearby Bluetooth devices...", {
        description: "Searching for FriendFinder users"
      });
      
      // Step 1: Try browser Bluetooth scanning if available
      if (isAvailable && hasPermission) {
        try {
          if (!isScanning) {
            await startScanning();
          }
          toast.success("Browser Bluetooth scan started");
        } catch (err) {
          console.log("Browser Bluetooth scanning not available:", err);
        }
      }

      // Step 2: Fetch nearby users from database API (primary method)
      const response = await bluetoothService.getNearbyUsers();
      setNearbyUsers(response.users);
      
      if (response.users.length === 0) {
        toast.info("No nearby FriendFinder users found", {
          description: "Make sure other users have Bluetooth enabled in the app"
        });
      } else {
        toast.success(`Found ${response.users.length} nearby user${response.users.length > 1 ? 's' : ''}!`, {
          description: `${response.users.length} FriendFinder user${response.users.length > 1 ? 's' : ''} detected`
        });
      }
    } catch (error: any) {
      console.error("Failed to scan for nearby users:", error);
      
      // Show more helpful error message
      if (error.message?.includes("No Bluetooth device set")) {
        toast.error("Please enable Bluetooth discovery first");
      } else {
        toast.error(error.message || "Failed to scan for nearby users");
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 fade-in">
      {/* Modern Gradient Header */}
      <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white px-6 pt-8 pb-24 rounded-b-[32px] shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl">
              <Bluetooth className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Bluetooth Discovery</h1>
              <p className="text-indigo-100 text-sm mt-1">
                Connect with people nearby
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-16 pb-24 space-y-6">

      {/* Bluetooth Status Card */}
      <Card className="glass border-0 shadow-soft">
        <CardContent className="pt-6 space-y-6">
          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {bluetoothEnabled ? (
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-glow">
                  <Bluetooth className="h-6 w-6 text-white animate-pulse-slow" />
                </div>
              ) : (
                <div className="p-3 bg-gray-100 rounded-2xl">
                  <BluetoothOff className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg">
                  {bluetoothEnabled ? "Discovery Active" : "Discovery Inactive"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {bluetoothEnabled 
                    ? "You're visible to nearby users" 
                    : "Enable to discover nearby users"}
                </p>
              </div>
            </div>
          </div>
          {/* Status Indicators */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm">
              <div className={`p-2.5 rounded-xl ${isAvailable ? 'bg-gradient-to-br from-green-400 to-green-500' : 'bg-gradient-to-br from-red-400 to-red-500'}`}>
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Device</p>
                <p className="text-sm font-semibold mt-0.5">
                  {isAvailable ? "Compatible" : "Not Available"}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm">
              <div className={`p-2.5 rounded-xl ${hasPermission ? 'bg-gradient-to-br from-green-400 to-green-500' : 'bg-gradient-to-br from-yellow-400 to-yellow-500'}`}>
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Permission</p>
                <p className="text-sm font-semibold mt-0.5">
                  {hasPermission ? "Granted" : "Required"}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm">
              <div className={`p-2.5 rounded-xl ${bluetoothEnabled ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-gray-300 to-gray-400'}`}>
                <Waves className="h-5 w-5 text-white" />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Discovery</p>
                <p className="text-sm font-semibold mt-0.5">
                  {bluetoothEnabled ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
          </div>

          {/* Pairing Code Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 glass-dark rounded-2xl">
              <p className="text-sm font-semibold mb-2">Create Pairing Code</p>
              <p className="text-xs text-muted-foreground mb-3">Generate a 6-digit code for others to connect with you</p>
              <div className="flex gap-2">
                <input
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="Your device name"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <Button onClick={async () => {
                  if (!deviceName.trim()) { toast.error('Please enter a device name'); return; }
                  try {
                    setGeneratingCode(true);
                    const res = await bluetoothService.generatePairingCode(deviceName.trim());
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
                }} disabled={generatingCode} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                  {generatingCode ? 'Generating...' : 'Get Code'}
                </Button>
              </div>

              {generatedCode && (
                <div className="mt-3 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                  <p className="text-xs text-muted-foreground mb-2">Your pairing code</p>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-mono font-bold tracking-widest bg-white px-4 py-2 rounded-lg shadow-sm text-indigo-600">
                      {generatedCode}
                    </div>
                    {codeExpires && (
                      <div className="text-xs text-muted-foreground">
                        Expires: {new Date(codeExpires).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 glass-dark rounded-2xl">
              <p className="text-sm font-semibold mb-2">Enter Pairing Code</p>
              <p className="text-xs text-muted-foreground mb-3">Have someone's code? Enter it to connect instantly</p>
              <div className="flex gap-2">
                <input
                  value={pairingCodeInput}
                  onChange={(e) => setPairingCodeInput(e.target.value)}
                  placeholder="6-digit code"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
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
                }} disabled={pairingSubmitting} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                  {pairingSubmitting ? 'Checking...' : 'Connect'}
                </Button>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3">
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
          <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <AlertCircle className="h-4 w-4 text-white" />
            </div>
            <div className="text-sm text-gray-700">
              <p className="font-semibold mb-1.5">How it works</p>
              <ul className="space-y-1 text-xs">
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
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-indigo-600" />
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
              <div className="space-y-3">
                {nearbyUsers.map((user, index) => (
                  <div key={user.id} className="group">
                    {index > 0 && <div className="h-px bg-gray-100 my-3" />}
                    <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 transition-all duration-300">
                      <div className="relative">
                        <Avatar className="h-14 w-14 border-2 border-white shadow-md ring-2 ring-indigo-100">
                          <AvatarImage src={user.profilePicture} alt={user.username} />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                            {user.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="font-semibold text-base">{user.username}</h4>
                            {user.bio && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                                {user.bio}
                              </p>
                            )}
                          </div>
                          
                          {user.isFriend ? (
                            <Badge className="bg-gradient-to-r from-green-400 to-green-500 text-white border-0 shadow-sm">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Friends
                            </Badge>
                          ) : user.hasPendingRequestTo ? (
                            <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white border-0 shadow-sm">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          ) : user.hasPendingRequestFrom ? (
                            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-sm">
                              Wants to Connect
                            </Badge>
                          ) : null}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Bluetooth className="h-3.5 w-3.5 text-indigo-600" />
                            <span>{formatLastSeen(user.lastSeenBluetooth)}</span>
                          </div>
                          
                          {!user.isFriend && !user.hasPendingRequestTo && !user.hasPendingRequestFrom && (
                            <Button
                              onClick={() => handleSendFriendRequest(user.id, user.username)}
                              disabled={sendingRequestTo === user.id}
                              size="sm"
                              className="ml-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-sm"
                            >
                              {sendingRequestTo === user.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Add Friend
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Privacy & Safety */}
      <Card className="glass-dark border-0 shadow-soft overflow-hidden">
        <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-lg text-gray-900">Privacy & Safety</h3>
          </div>
          <ul className="space-y-2.5 text-sm text-gray-700">
            <li className="flex items-start gap-2.5">
              <div className="p-1 bg-gradient-to-br from-green-400 to-green-500 rounded-full mt-0.5">
                <CheckCircle2 className="h-3 w-3 text-white" />
              </div>
              <span>Your exact location is never shared - only proximity</span>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="p-1 bg-gradient-to-br from-green-400 to-green-500 rounded-full mt-0.5">
                <CheckCircle2 className="h-3 w-3 text-white" />
              </div>
              <span>Only FriendFinder app users can discover you</span>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="p-1 bg-gradient-to-br from-green-400 to-green-500 rounded-full mt-0.5">
                <CheckCircle2 className="h-3 w-3 text-white" />
              </div>
              <span>Disable Bluetooth discovery anytime</span>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="p-1 bg-gradient-to-br from-green-400 to-green-500 rounded-full mt-0.5">
                <CheckCircle2 className="h-3 w-3 text-white" />
              </div>
              <span>Your Bluetooth data is encrypted and secure</span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

