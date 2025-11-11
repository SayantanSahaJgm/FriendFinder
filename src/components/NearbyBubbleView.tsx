"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bluetooth } from "lucide-react";

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
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow text-white">
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
              className="absolute transform-gpu transition-transform hover:scale-105"
              style={{ left: `calc(50% + ${u.x}px)`, top: `calc(50% + ${u.y}px)`, width: size, height: size, borderRadius: '999px' }}
              title={u.username}
            >
              <div className="w-full h-full rounded-full bg-white/90 flex items-center justify-center shadow-md overflow-hidden">
                {u.profilePicture ? (
                  <img src={u.profilePicture} alt={u.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">{u.username.substring(0,2).toUpperCase()}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="w-full mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Found {users.length} nearby</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRescan}>Rescan</Button>
        </div>
      </div>

      {/* Selected user modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <Card className="w-full max-w-md z-10">
            <CardContent className="flex flex-col items-center gap-4">
              <Avatar className="w-20 h-20 ring-2 ring-gray-100">
                {selected.profilePicture ? (
                  <AvatarImage src={selected.profilePicture} alt={selected.username} />
                ) : (
                  <AvatarFallback>{selected.username.substring(0,2).toUpperCase()}</AvatarFallback>
                )}
              </Avatar>
              <div className="text-lg font-semibold">{selected.username}</div>
              {selected.bio && <div className="text-sm text-muted-foreground text-center">{selected.bio}</div>}
              <div className="w-full flex gap-3">
                <Button className="flex-1" onClick={() => { onConnect(selected.id); setSelected(null); }}>
                  Connect
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setSelected(null)}>Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
