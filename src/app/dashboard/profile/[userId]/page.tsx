"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

type ProfileUser = {
  id: string;
  username: string;
  bio?: string | null;
  profilePicture?: string | null;
  isFriend?: boolean;
  createdAt?: string;
}

export default function OtherProfilePage() {
  const params = useParams() as { userId?: string };
  const router = useRouter();
  const userId = params?.userId;
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch profile function (exposed so the UI can retry on error)
  const fetchProfile = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Log details and show a helpful message rather than throwing which may trigger the global error overlay
        console.error('Profile API error', res.status, json)
        setErrorMsg(json?.error || `Failed to load profile (status ${res.status})`)
        setUser(null)
        return
      }

      // Accept and set user when present
      setUser(json.user || null);
      setErrorMsg(null);
    } catch (err: any) {
      console.error('Error loading profile:', err);
      // Show a non-blocking toast and preserve the user on the page so they can retry
      toast.error(err?.message || 'Failed to load profile');
      setErrorMsg(err?.message || 'Failed to load profile')
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  if (loading) {
    return <div className="p-6">Loading profile...</div>;
  }

  if (errorMsg) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Unable to load profile</h2>
          <p className="text-sm text-muted-foreground mb-4">{errorMsg}</p>
          <div className="flex gap-2">
            <Button onClick={() => fetchProfile()}>Try again</Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <div className="p-6">Profile not available</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-6">
        <Avatar className="h-24 w-24">
          {user.profilePicture ? (
            <AvatarImage src={user.profilePicture} alt={user.username} />
          ) : (
            <AvatarFallback className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white ff-white text-2xl">
              {user.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{user.username}</h1>
          <p className="text-sm text-gray-600 mt-1">{user.bio || 'No bio provided'}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">{user.bio || 'No additional information.'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={() => router.push(`/dashboard/chat?userId=${user.id}`)} className="w-full">Message</Button>
              <Button variant="outline" onClick={() => router.push(`/dashboard/call?userId=${user.id}&userName=${encodeURIComponent(user.username)}`)} className="w-full">Call</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
