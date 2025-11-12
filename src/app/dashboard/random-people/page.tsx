"use client";

import RandomPeopleClient from '@/components/random-chat/RandomPeopleClient';
import { Shuffle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import GuestNamePrompt from '@/components/random-chat/GuestNamePrompt';
import { useRandomChat } from '@/context/RandomChatContext';

export default function RandomPeoplePage() {
  const { isConnected } = useRandomChat();

  return (
    <div className="space-y-4 sm:space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Shuffle className="h-5 w-5 sm:h-6 sm:w-6" />
            Random People
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Omegle-style anonymous video chat — start when ready.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? 'default' : 'destructive'}>{isConnected ? 'Online' : 'Offline'}</Badge>
        </div>
      </div>

  <GuestNamePrompt />

  <RandomPeopleClient />
    </div>
  );
}
