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

  useEffect(() => {
    if (!userId) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to load profile');
        }
        const json = await res.json();
        setUser(json.user || null);
      } catch (err: any) {
        console.error('Error loading profile:', err);
        toast.error(err?.message || 'Failed to load profile');
        // Navigate back to dashboard to avoid stuck screen
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId, router]);

  if (loading) {
    return <div className="p-6">Loading profile...</div>;
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
