"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bluetooth, ExternalLink, X, MapPin, Clock, Mail, User, Shield, Signal } from "lucide-react";
import UserProfileModal from "@/components/UserProfileModal";

export interface NearbyUser {
  id: string;
  username: string;
  profilePicture?: string;
  bio?: string;
  lastSeenBluetooth?: string | Date;
  rssi?: number; // optional, may be provided by native scanner
  isFriend?: boolean;
  hasPendingRequestTo?: boolean;
  hasPendingRequestFrom?: boolean;
}

interface Props {
  users: NearbyUser[];
  onConnect: (userId: string) => void;
  onRescan?: () => void;
}

// Map RSSI (-100..0) to bubble size (48..140)
const rssiToSize = (rssi?: number) => {
  if (typeof rssi !== "number") return 72;
  const clamped = Math.max(-100, Math.min(-30, rssi));
  const t = (clamped - -100) / (70); // 0..1
  return Math.round(48 + t * (140 - 48));
};

export default function NearbyBubbleView({ users, onConnect, onRescan }: Props) {
  const [selected, setSelected] = useState<NearbyUser | null>(null);

  const arranged = useMemo(() => {
    const count = users.length;
    return users.map((u, i) => {
      const angle = (i / Math.max(1, count)) * Math.PI * 2;
      // radius depends on index and RSSI
      const radius = 80 + (i * 30) + (u.rssi ? Math.max(0, ( -u.rssi - 30)) : 0);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      return { ...u, x, y };
    });
  }, [users]);

  useEffect(() => {
    // close modal when users update
    if (selected && !users.find(u => u.id === selected.id)) {
      setSelected(null);
    }
  }, [users, selected]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full h-[320px] flex items-center justify-center">
        {/* center user */}
        <div className="z-20 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow text-white animate-pulse-slow">
            <Bluetooth className="w-8 h-8" />
          </div>
          <div className="mt-2 text-sm font-semibold">You</div>
        </div>

        {/* bubbles */}
        {arranged.map((u, idx) => {
          const size = rssiToSize(u.rssi);
          return (
            <button
              key={u.id}
              onClick={() => setSelected(u)}
              className="absolute transform-gpu transition-transform hover:scale-105 animate-float"
              style={{ left: `calc(50% + ${u.x}px)`, top: `calc(50% + ${u.y}px)`, width: size, height: size, borderRadius: '999px' }}
              title={u.username}
            >
              <div className="relative w-full h-full">
                {/* pulse ring */}
                <div className="absolute inset-0 rounded-full bg-indigo-200/20 animate-pulse-slow" />
                <div className="relative w-full h-full rounded-full bg-white/90 flex items-center justify-center shadow-md overflow-hidden">
                  {u.profilePicture ? (
                    <img src={u.profilePicture} alt={u.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">{u.username.substring(0,2).toUpperCase()}</div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="w-full mt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Found {users.length} nearby</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onRescan}>Rescan</Button>
          </div>
        </div>

        {/* RSSI legend */}
        <div className="w-full flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500/80" />
            <div>-30 dBm (very near &lt;0.5m)</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-400/80" />
            <div>-50 dBm (~1-2m)</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-300/80" />
            <div>-70 dBm (~5m)</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-200/80" />
            <div>-90 dBm (far &gt;20m)</div>
          </div>
        </div>
      </div>

      {/* Selected user modal - Enhanced Profile View */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelected(null)} />
          
          <Card className="w-full max-w-2xl z-10 border-0 shadow-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Header with Close Button */}
            <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Profile</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelected(null)}
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <CardContent className="p-0">
              {/* Profile Header Section */}
              <div className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 pt-8 pb-20">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse-slow"></div>
                </div>
                
                {/* Connection Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-green-500/90 text-white border-0 backdrop-blur-sm px-3 py-1 flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <Signal className="w-3 h-3" />
                    <span className="text-xs font-medium">Nearby</span>
                  </Badge>
                </div>

                {/* Profile Picture */}
                <div className="relative flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-full blur-2xl scale-110"></div>
                    <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-2xl ring-4 ring-white/50 backdrop-blur-sm">
                      {selected.profilePicture ? (
                        <img src={selected.profilePicture} alt={selected.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/90 to-white/70 text-indigo-600 text-4xl font-bold">
                          {selected.username.substring(0,2).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Info Section */}
              <div className="px-6 -mt-12 relative z-10">
                {/* Name Card */}
                <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 mb-6">
                  <CardContent className="p-5 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {selected.username}
                    </h2>
                    {selected.lastSeenBluetooth && (
                      <div className="flex items-center justify-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>Active {formatTimeAgo(selected.lastSeenBluetooth)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Bio Section */}
                {selected.bio && (
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">About</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {selected.bio}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Connection Info */}
                <div className="mb-6 grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-indigo-500 rounded-lg">
                        <Bluetooth className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Connection</span>
                    </div>
                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">Bluetooth</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {selected.rssi ? `${selected.rssi} dBm` : 'Active'}
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-100 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-green-500 rounded-lg">
                        <MapPin className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Distance</span>
                    </div>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {selected.rssi ? getRssiDistance(selected.rssi) : 'Near'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Approximate</p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="mb-6 flex flex-wrap gap-2">
                  {selected.isFriend && (
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-3 py-1.5">
                      ✓ Friend
                    </Badge>
                  )}
                  {selected.hasPendingRequestTo && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 px-3 py-1.5">
                      Request Sent
                    </Badge>
                  )}
                  {selected.hasPendingRequestFrom && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 px-3 py-1.5">
                      Wants to Connect
                    </Badge>
                  )}
                </div>

                {/* Privacy Note */}
                <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-200 dark:border-purple-800">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-purple-500 rounded-lg flex-shrink-0">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-semibold text-purple-900 dark:text-purple-200 mb-1">Privacy Protected</h4>
                      <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                        Only proximity is shared. Your exact location remains private.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mb-6 flex flex-col sm:flex-row gap-3">
                  {!selected.isFriend && !selected.hasPendingRequestTo && (
                    <Button 
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 h-12 text-base font-semibold shadow-lg" 
                      onClick={() => { 
                        onConnect(selected.id); 
                        setSelected(null); 
                      }}
                    >
                      <User className="w-5 h-5 mr-2" />
                      Send Friend Request
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    className="flex-1 h-12 text-base font-semibold border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => window.open(`/dashboard/profile/${selected.id}`, "_blank")}
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    View Full Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Helper function to format time ago
function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// Helper function to estimate distance from RSSI
function getRssiDistance(rssi: number): string {
  if (rssi >= -50) return "< 1m";
  if (rssi >= -60) return "1-2m";
  if (rssi >= -70) return "2-5m";
  if (rssi >= -80) return "5-10m";
  if (rssi >= -90) return "10-20m";
  return "> 20m";
}
