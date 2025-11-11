"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Wifi, WifiOff, Users, Zap, MapPin, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NearbyUser {
  id: string;
  username: string;
  name?: string;
  profilePicture?: string;
  network: string;
  signal: number;
  distance?: string;
  interests?: string[];
}

export default function WiFiPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [currentNetwork, setCurrentNetwork] = useState<string | null>(null);

  useEffect(() => {
    // Simulate WiFi scanning
    if (isScanning) {
      const timer = setTimeout(() => {
        setNearbyUsers([
          {
            id: '1',
            username: 'sophie',
            name: 'Sophie',
            network: 'Starbucks - Market St',
            signal: 95,
            distance: '5m',
            interests: ['Design', 'Startup'],
          },
          {
            id: '2',
            username: 'mike',
            name: 'Mike',
            network: 'WeWork - SOMA',
            signal: 88,
            distance: '12m',
            interests: ['Coding', 'AI'],
          },
          {
            id: '3',
            username: 'anna',
            name: 'Anna',
            network: 'Public Library',
            signal: 72,
            distance: '8m',
            interests: ['Books', 'Writing'],
          },
        ]);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isScanning]);

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
              onClick={() => setIsScanning(!isScanning)}
              className={`rounded-full px-8 py-6 shadow-xl transition-all ${
                isScanning 
                  ? 'bg-gray-400 hover:bg-gray-500' 
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
              }`}
            >
              {isScanning ? (
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
                className="p-4 bg-white/80 backdrop-blur-xl border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={user.profilePicture} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white font-bold">
                          {user.name?.charAt(0) || user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{user.name || user.username}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {user.network}
                      </p>
                      {user.interests && (
                        <div className="flex gap-1.5 mt-2">
                          {user.interests.map((interest) => (
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
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full shadow-lg"
                  >
                    Connect
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
