"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Clock, Bluetooth, MapPin, Shield, ExternalLink, Signal, X } from "lucide-react";

export interface ProfileUser {
  id: string;
  username: string;
  profilePicture?: string | null;
  bio?: string | null;
  lastSeen?: string | Date;
  lastSeenBluetooth?: string | Date;
  lastSeenWiFi?: string | Date;
  rssi?: number;
  isFriend?: boolean;
  hasPendingRequestTo?: boolean;
  hasPendingRequestFrom?: boolean;
}

interface Props {
  user: ProfileUser;
  onClose: () => void;
  onConnect: (id: string) => void;
}

export default function UserProfileModal({ user, onClose, onConnect }: Props) {
  const [userData, setUserData] = useState<ProfileUser>(user);

  useEffect(() => {
    // If incoming user has no profilePicture (nearby payloads may be minimal),
    // fetch the full profile so we can show the photo for everyone when available.
    const loadFullProfile = async () => {
      try {
        if (!user || !user.id) return;
        // only fetch if we don't already have a profilePicture
        if (user.profilePicture) return;

        const res = await fetch(`/api/users/${user.id}`);
        if (!res.ok) return;
        const full = await res.json();
        // merge and set
        setUserData((prev) => ({ ...prev, ...full }));
      } catch (err) {
        // ignore — keep showing fallback
        console.error('Failed to load full profile for user', user.id, err);
      }
    };

    loadFullProfile();
  }, [user]);

  const formatTimeAgo = (date?: string | Date) => {
    if (!date) return "";
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
  };

  const getRssiDistance = (rssi?: number) => {
    if (rssi === undefined || rssi === null) return "Near";
    if (rssi >= -50) return "< 1m";
    if (rssi >= -60) return "1-2m";
    if (rssi >= -70) return "2-5m";
    if (rssi >= -80) return "5-10m";
    if (rssi >= -90) return "10-20m";
    return "> 20m";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <Card className="w-full max-w-2xl z-10 border-0 shadow-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Profile</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <CardContent className="p-0">
          <div className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 pt-8 pb-20">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse-slow"></div>
            </div>

            <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-green-500/90 text-white border-0 backdrop-blur-sm px-3 py-1.5 flex items-center gap-1.5">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <Signal className="w-3 h-3" />
                <span className="text-xs font-medium">Nearby</span>
              </Badge>
            </div>

            <div className="relative flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-full blur-2xl scale-110"></div>
                <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-2xl ring-4 ring-white/50 backdrop-blur-sm">
                  {userData?.profilePicture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={userData.profilePicture} alt={userData.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/90 to-white/70 text-indigo-600 text-4xl font-bold">
                      {userData?.username?.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 -mt-12 relative z-10">
            <div className="bg-white dark:bg-gray-800 shadow-xl border-0 mb-6 p-5 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{userData.username}</h2>
              {userData.lastSeen && <div className="flex items-center justify-center gap-1.5 text-sm text-gray-600 dark:text-gray-400"><Clock className="w-4 h-4" /> <span>Active {formatTimeAgo(userData.lastSeen)}</span></div>}
            </div>

            {userData.bio && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">About</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{userData.bio}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                <div className="flex items-center gap-2 mb-2"><div className="p-1.5 bg-indigo-500 rounded-lg"><Bluetooth className="w-3.5 h-3.5 text-white" /></div><span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Connection</span></div>
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">Bluetooth</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{userData.rssi ? `${userData.rssi} dBm` : 'Active'}</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-100 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2"><div className="p-1.5 bg-green-500 rounded-lg"><MapPin className="w-3.5 h-3.5 text-white" /></div><span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Distance</span></div>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{getRssiDistance(userData.rssi)}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Approximate</p>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {userData.isFriend && (<Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-3 py-1.5">✓ Friend</Badge>)}
              {userData.hasPendingRequestTo && (<Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 px-3 py-1.5">Request Sent</Badge>)}
              {userData.hasPendingRequestFrom && (<Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 px-3 py-1.5">Wants to Connect</Badge>)}
            </div>

            <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-purple-500 rounded-lg flex-shrink-0"><Shield className="w-4 h-4 text-white" /></div>
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-purple-900 dark:text-purple-200 mb-1">Privacy Protected</h4>
                  <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">Only proximity is shared. Your exact location remains private.</p>
                </div>
              </div>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-3">
              {!userData.isFriend && !userData.hasPendingRequestTo && (
                <Button className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 h-12 text-base font-semibold shadow-lg" onClick={() => { onConnect(userData.id); onClose(); }}>
                  <User className="w-5 h-5 mr-2" />
                  Send Friend Request
                </Button>
              )}

              <Button variant="outline" className="flex-1 h-12 text-base font-semibold border-2 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => window.open(`/dashboard/profile/${userData.id}`, "_blank") }>
                <ExternalLink className="w-5 h-5 mr-2" />
                View Full Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
