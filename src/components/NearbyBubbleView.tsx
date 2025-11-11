"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bluetooth, ExternalLink } from "lucide-react";

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

      {/* Selected user modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <Card className="w-full max-w-3xl z-10">
            <CardContent className="flex flex-col md:flex-row items-center gap-6 p-6">
              <div className="flex-shrink-0">
                <div className="w-36 h-36 rounded-full overflow-hidden shadow-xl ring-4 ring-white">
                  {selected.profilePicture ? (
                    <img src={selected.profilePicture} alt={selected.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl font-semibold">{selected.username.substring(0,2).toUpperCase()}</div>
                  )}
                </div>
              </div>

              <div className="flex-1 w-full">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{selected.username}</div>
                    {selected.lastSeenBluetooth && (
                      <div className="text-xs text-muted-foreground">Last seen: {new Date(selected.lastSeenBluetooth).toLocaleString()}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => window.open(`/dashboard/profile/${selected.id}`, "_blank")}
                      title="Open profile in new tab"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-sm">View Profile</span>
                    </Button>
                  </div>
                </div>

                {selected.bio ? (
                  <p className="mt-2 text-sm text-muted-foreground">{selected.bio}</p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">This user hasn't added a bio yet.</p>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  <Button className="px-6 py-2" onClick={() => { onConnect(selected.id); setSelected(null); }}>
                    Connect
                  </Button>
                  <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
