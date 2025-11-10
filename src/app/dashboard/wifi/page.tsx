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
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-2xl opacity-30 animate-pulse-slow"></div>
              <div className="relative w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
                <div className="text-center">
                  <Avatar className="w-16 h-16 border-4 border-white mx-auto">
                    <AvatarImage src={session?.user?.image || ''} alt="You" />
                    <AvatarFallback className="bg-white text-purple-600 font-bold">
                      {session?.user?.name?.charAt(0) || 'Y'}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs text-white font-medium mt-2">You</p>
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
                    className="absolute animate-float"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                      transform: 'translate(-50%, -50%)',
                      animationDelay: `${index * 0.2}s`,
                    }}
                  >
                    <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                      <AvatarImage src={user.profilePicture} alt={user.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white text-xs">
                        {user.name?.charAt(0) || user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                );
              })}
            </div>
            
            <p className="text-gray-600 text-sm mb-4">
              {isScanning ? 'Scanning WiFi networks...' : `Found ${nearbyUsers.length} people on nearby devices`}
            </p>
            
            <Button
              onClick={() => setIsScanning(!isScanning)}
              className={`rounded-full px-8 py-6 shadow-xl transition-all ${
                isScanning 
                  ? 'bg-gray-400 hover:bg-gray-500' 
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
              }`}
              disabled={isScanning}
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
