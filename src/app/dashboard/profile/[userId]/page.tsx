"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  User, 
  MessageCircle, 
  Phone, 
  UserPlus, 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock,
  Mail,
  Shield,
  CheckCircle2,
  Loader2
} from 'lucide-react'

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
  const [sendingRequest, setSendingRequest] = useState(false);

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

  const handleSendFriendRequest = async () => {
    if (!user) return;
    try {
      setSendingRequest(true);
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: user.id })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Friend request sent!');
        setUser({ ...user, isFriend: false }); // Update to show pending state
      } else {
        toast.error(data.error || 'Failed to send friend request');
      }
    } catch (err) {
      toast.error('Failed to send friend request');
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Unable to load profile</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{errorMsg}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => fetchProfile()} className="flex-1">
                Try again
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')} className="flex-1">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Profile not found</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">This user profile is not available.</p>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-24">
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Profile Header with Gradient Background */}
      <div className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 pt-12 pb-32">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-white rounded-full blur-3xl animate-pulse-slow"></div>
        </div>
        
        {/* Profile Picture */}
        <div className="relative max-w-4xl mx-auto px-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/10 rounded-full blur-3xl scale-110"></div>
              <Avatar className="relative h-40 w-40 ring-8 ring-white/50 shadow-2xl">
                {user.profilePicture ? (
                  <AvatarImage src={user.profilePicture} alt={user.username} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-white/90 to-white/70 text-indigo-600 text-5xl font-bold">
                    {user.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              {/* Online Status Badge */}
              <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
        {/* Name and Bio Card */}
        <Card className="bg-white dark:bg-gray-800 shadow-2xl border-0 mb-6">
          <CardContent className="p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {user.username}
            </h1>
            {user.bio ? (
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
                {user.bio}
              </p>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 italic">
                No bio provided
              </p>
            )}
            
            {/* Status Badges */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {user.isFriend && (
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-4 py-1.5">
                  <CheckCircle2 className="w-3 h-3 mr-1.5" />
                  Friend
                </Badge>
              )}
              {user.createdAt && (
                <Badge variant="outline" className="px-4 py-1.5 border-2">
                  <Calendar className="w-3 h-3 mr-1.5" />
                  Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - About */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Card */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  About {user.username}
                </h2>
              </div>
              <CardContent className="p-6">
                {user.bio ? (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {user.bio}
                  </p>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-400 dark:text-gray-500">
                      This user hasn't added a bio yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Privacy Notice */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg flex-shrink-0">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-1">
                      Privacy Protected
                    </h3>
                    <p className="text-sm text-purple-700 dark:text-purple-300 leading-relaxed">
                      Only information the user chooses to share is visible. Your interactions are secure and private.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4">
                <h2 className="text-lg font-bold text-white">Quick Actions</h2>
              </div>
              <CardContent className="p-4 space-y-3">
                {!user.isFriend && (
                  <Button 
                    onClick={handleSendFriendRequest} 
                    disabled={sendingRequest}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 h-12 font-semibold shadow-lg"
                  >
                    {sendingRequest ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5 mr-2" />
                        Add Friend
                      </>
                    )}
                  </Button>
                )}
                
                <Button 
                  onClick={() => router.push(`/dashboard/chat?userId=${user.id}`)} 
                  className="w-full h-12 font-semibold bg-green-600 hover:bg-green-700 text-white"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Send Message
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/dashboard/call?userId=${user.id}&userName=${encodeURIComponent(user.username)}`)} 
                  className="w-full h-12 font-semibold border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Start Call
                </Button>
              </CardContent>
            </Card>

            {/* Profile Stats Card */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Profile Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Status</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {user.isFriend ? 'Friend' : 'Not Connected'}
                    </p>
                  </div>
                </div>
                
                {user.createdAt && (
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Member Since</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
