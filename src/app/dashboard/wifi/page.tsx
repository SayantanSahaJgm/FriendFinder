"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Wifi, WifiOff, Users, Zap, MapPin, Plus, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import wifiService, { NearbyWiFiUser } from '@/services/wifi/wifiService';

interface NearbyUser extends NearbyWiFiUser {
  signal?: number;
  distance?: string;
}

export default function WiFiPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [currentNetwork, setCurrentNetwork] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Start WiFi scanning
  const handleStartScan = async () => {
    try {
      setIsScanning(true);
      setLoading(true);
      toast.info('Registering WiFi network...');

      // Register current network (uses IP-based detection for web)
      await wifiService.registerCurrentNetwork();
      
      // Small delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get nearby users
      const users = await wifiService.getNearbyUsers();
      setNearbyUsers(users);

      // Get status to show current network
      const status = await wifiService.getStatus();
      setCurrentNetwork(status.networkName || 'Unknown Network');

      toast.success(`Found ${users.length} ${users.length === 1 ? 'user' : 'users'} nearby!`);
    } catch (error: any) {
      console.error('[WiFi] Scan error:', error);
      toast.error(error.message || 'Failed to scan for nearby users');
      setIsScanning(false);
    } finally {
      setLoading(false);
    }
  };

  // Stop scanning
  const handleStopScan = async () => {
    try {
      setLoading(true);
      await wifiService.unregister();
      setIsScanning(false);
      setNearbyUsers([]);
      setCurrentNetwork(null);
      toast.success('WiFi discovery stopped');
    } catch (error: any) {
      console.error('[WiFi] Stop scan error:', error);
      toast.error('Failed to stop scanning');
    } finally {
      setLoading(false);
    }
  };

  // Send friend request
  const handleConnect = async (userId: string, username: string) => {
    try {
      await wifiService.sendFriendRequest(userId);
      toast.success(`Friend request sent to ${username}!`);
      
      // Refresh the list to update status
      const users = await wifiService.getNearbyUsers();
      setNearbyUsers(users);
    } catch (error: any) {
      console.error('[WiFi] Connect error:', error);
      toast.error(error.message || 'Failed to send friend request');
    }
  };

  // View profile in new tab
  const handleViewProfile = (userId: string) => {
    window.open(`/dashboard/profile/${userId}`, '_blank');
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 text-white p-6 rounded-b-[32px] shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <Wifi className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold mb-2">WiFi Nearby</h1>
        <p className="text-white/90 text-sm">Connect with people on same networks</p>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Network Visualization */}
        <Card className="p-6 bg-white/80 backdrop-blur-xl border-0 shadow-xl rounded-3xl">
          <div className="flex flex-col items-center">
            {nearbyUsers.length > 0 ? (
              <div className="relative mb-6 w-full h-[320px] flex items-center justify-center">
                {/* Center user - only shown when peers found */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-2xl opacity-20 animate-pulse-slow"></div>
                <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
                  <div className="text-center">
                    <Wifi className="w-10 h-10 text-white mx-auto" />
                    <p className="text-xs text-white font-medium mt-1">You</p>
                  </div>
                </div>
                
                {/* Orbiting users */}
                {nearbyUsers.slice(0, 5).map((user, index) => {
                  const angle = (index * 72 * Math.PI) / 180;
                  const radius = 100;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  
                  return (
                    <div
                      key={user.id}
                      className="absolute animate-float cursor-pointer hover:scale-110 transition-transform"
                      style={{
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                        transform: 'translate(-50%, -50%)',
                        animationDelay: `${index * 0.2}s`,
                      }}
                      onClick={() => {
                        // TODO: Open profile modal or navigate to profile
                      }}
                    >
                      <Avatar className="w-14 h-14 border-2 border-white shadow-lg ring-2 ring-purple-200">
                        <AvatarImage src={user.profilePicture} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white text-sm font-bold">
                          {user.name?.charAt(0) || user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wifi className="w-10 h-10 text-purple-500" />
                </div>
                <p className="text-gray-500 text-sm">
                  {isScanning ? 'Scanning for nearby WiFi networks...' : 'Start scanning to discover nearby users'}
                </p>
              </div>
            )}
            
            {nearbyUsers.length > 0 && (
              <p className="text-gray-600 text-sm mb-4">
                Found {nearbyUsers.length} {nearbyUsers.length === 1 ? 'person' : 'people'} on nearby networks
              </p>
            )}
            
            <Button
              onClick={() => isScanning ? handleStopScan() : handleStartScan()}
              disabled={loading}
              className={`rounded-full px-8 py-6 shadow-xl transition-all ${
                isScanning 
                  ? 'bg-gray-400 hover:bg-gray-500' 
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isScanning ? 'Stopping...' : 'Scanning...'}
                </>
              ) : isScanning ? (
                <>
                  <WifiOff className="w-5 h-5 mr-2" />
                  Stop Scanning
                </>
              ) : (
                <>
                  <Wifi className="w-5 h-5 mr-2" />
                  Start Scanning
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Nearby Users List */}
        {nearbyUsers.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">People on Nearby Networks</h2>
            {nearbyUsers.map((user) => (
              <Card 
                key={user.id}
                className="p-4 bg-white/80 backdrop-blur-xl border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="relative">
                      <Avatar className="w-14 h-14 cursor-pointer" onClick={() => handleViewProfile(user.id)}>
                        <AvatarImage src={user.profilePicture} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white font-bold">
                          {user.name?.charAt(0) || user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{user.name || user.username}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewProfile(user.id)}
                          className="h-6 w-6 p-0"
                          title="View profile"
                        >
                          <ExternalLink className="w-3 h-3 text-gray-500" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {user.network} • {user.lastSeenAgo}
                      </p>
                      {user.bio && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{user.bio}</p>
                      )}
                      {user.interests && user.interests.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {user.interests.slice(0, 3).map((interest) => (
                            <Badge 
                              key={interest}
                              variant="secondary" 
                              className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200"
                            >
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    {user.isFriend ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Friends
                      </Badge>
                    ) : user.hasPendingRequestTo ? (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                        Pending
                      </Badge>
                    ) : user.hasPendingRequestFrom ? (
                      <Button 
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg"
                        onClick={() => router.push('/dashboard/friends?tab=requests')}
                      >
                        Accept
                      </Button>
                    ) : (
                      <Button 
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full shadow-lg"
                        onClick={() => handleConnect(user.id, user.username)}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
