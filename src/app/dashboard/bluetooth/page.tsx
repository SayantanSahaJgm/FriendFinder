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
    <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Bluetooth className="h-8 w-8 text-blue-600" />
          Bluetooth Discovery
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Connect with nearby FriendFinder users through Bluetooth. Enable discovery to find and send friend requests to people around you.
        </p>
      </div>

      {/* Bluetooth Status Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {bluetoothEnabled ? (
              <Bluetooth className="h-5 w-5 text-blue-600 animate-pulse" />
            ) : (
              <BluetoothOff className="h-5 w-5 text-gray-400" />
            )}
            Bluetooth Status
          </CardTitle>
          <CardDescription>
            {bluetoothEnabled 
              ? "You are visible to nearby FriendFinder users" 
              : "Enable Bluetooth to discover nearby users"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className={`p-2 rounded-full ${isAvailable ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                <Shield className={`h-4 w-4 ${isAvailable ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Device</p>
                <p className="text-sm font-medium">
                  {isAvailable ? "Compatible" : "Not Available"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className={`p-2 rounded-full ${hasPermission ? 'bg-green-100 dark:bg-green-900' : 'bg-yellow-100 dark:bg-yellow-900'}`}>
                <CheckCircle2 className={`h-4 w-4 ${hasPermission ? 'text-green-600' : 'text-yellow-600'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Permission</p>
                <p className="text-sm font-medium">
                  {hasPermission ? "Granted" : "Required"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className={`p-2 rounded-full ${bluetoothEnabled ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <Waves className={`h-4 w-4 ${bluetoothEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Discovery</p>
                <p className="text-sm font-medium">
                  {bluetoothEnabled ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
          </div>

          {/* Pairing Code Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <p className="text-sm font-medium mb-2">Create local pairing code</p>
              <p className="text-xs text-muted-foreground mb-3">Enter a Bluetooth name for your device to generate a short 6-digit pairing code other users can enter to connect.</p>
              <div className="flex gap-2">
                <input
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="Your device name (e.g. John's Phone)"
                  className="flex-1 input input-bordered"
                />
                <Button onClick={async () => {
                  // Generate pairing code
                  if (!deviceName.trim()) { toast.error('Please enter a device name'); return; }
                  try {
                    setGeneratingCode(true);
                    const res = await bluetoothService.generatePairingCode(deviceName.trim());
                    if (res.success) {
                      setGeneratedCode(res.pairingCode || null);
                      setCodeExpires(res.pairingCodeExpires || null);
                      toast.success('Pairing code generated');
                      // Ensure Bluetooth presence is updated in UI
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
                }} disabled={generatingCode}>
                  {generatingCode ? 'Generating...' : 'Get Code'}
                </Button>
              </div>

              {generatedCode && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                  <p className="text-xs text-muted-foreground">Your pairing code (expires soon)</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="text-2xl font-mono tracking-widest bg-white p-2 rounded shadow">
                      {generatedCode}
                    </div>
                    {codeExpires && (
                      <div className="text-sm text-muted-foreground">Expires: {new Date(codeExpires).toLocaleTimeString()}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <p className="text-sm font-medium mb-2">Enter someone else's code</p>
              <p className="text-xs text-muted-foreground mb-3">If you see a user's pairing code, enter it here to send a friend request and connect.</p>
              <div className="flex gap-2">
                <input
                  value={pairingCodeInput}
                  onChange={(e) => setPairingCodeInput(e.target.value)}
                  placeholder="6-digit code"
                  className="flex-1 input input-bordered"
                />
                <Button onClick={async () => {
                  if (!pairingCodeInput.trim()) { toast.error('Please enter a pairing code'); return; }
                  try {
                    setPairingSubmitting(true);
                    const res = await bluetoothService.pairWithCode(pairingCodeInput.trim());
                    if (res.success) {
                      toast.success(res.message || 'Connected! Friend request sent');
                      setPairingCodeInput('');
                      // Refresh nearby users
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
                }} disabled={pairingSubmitting}>
                  {pairingSubmitting ? 'Checking...' : 'Enter Code'}
                </Button>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3">
            {!bluetoothEnabled ? (
              <Button 
                onClick={handleEnableBluetooth}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
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
                  className="flex-1"
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
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
          <div className="flex items-start gap-3 p-4 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">How it works</p>
              <ul className="space-y-1 text-xs">
                <li>• Enable Bluetooth discovery to make yourself visible to nearby users</li>
                <li>• Scan to find other FriendFinder users with Bluetooth enabled</li>
                <li>• Send friend requests to connect with people around you</li>
                <li>• Your location is never shared - only Bluetooth proximity</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nearby Users */}
      {bluetoothEnabled && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Nearby Users
                  {nearbyUsers.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {nearbyUsers.length}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  FriendFinder users detected nearby via Bluetooth
                </CardDescription>
              </div>
              {isScanning && (
                <Badge variant="outline" className="gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Scanning
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingUsers && nearbyUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                <p className="text-muted-foreground">Scanning for nearby users...</p>
              </div>
            ) : nearbyUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BluetoothOff className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                  No nearby FriendFinder users detected. Make sure other users have Bluetooth enabled in the app.
                </p>
                <Button 
                  onClick={handleScanNearby} 
                  variant="outline"
                  disabled={isLoadingUsers}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Scan Again
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {nearbyUsers.map((user, index) => (
                  <div key={user.id}>
                    {index > 0 && <Separator className="my-3" />}
                    <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-accent/50 transition-colors">
                      <Avatar className="h-14 w-14 border-2 border-blue-200">
                        <AvatarImage src={user.profilePicture} alt={user.username} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                          {user.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-base">{user.username}</h4>
                            {user.bio && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {user.bio}
                              </p>
                            )}
                          </div>
                          
                          {user.isFriend ? (
                            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Friends
                            </Badge>
                          ) : user.hasPendingRequestTo ? (
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          ) : user.hasPendingRequestFrom ? (
                            <Badge variant="outline" className="border-blue-500 text-blue-600">
                              Wants to Connect
                            </Badge>
                          ) : null}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Bluetooth className="h-3 w-3 text-blue-600" />
                            <span>{formatLastSeen(user.lastSeenBluetooth)}</span>
                          </div>
                          
                          {!user.isFriend && !user.hasPendingRequestTo && !user.hasPendingRequestFrom && (
                            <Button
                              onClick={() => handleSendFriendRequest(user.id, user.username)}
                              disabled={sendingRequestTo === user.id}
                              size="sm"
                              className="ml-auto"
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
      <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
            <Shield className="h-5 w-5" />
            Privacy & Safety
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Your exact location is never shared - only Bluetooth proximity</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Only users with the FriendFinder app can discover you</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>You can disable Bluetooth discovery anytime</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Your Bluetooth data is encrypted and secure</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
