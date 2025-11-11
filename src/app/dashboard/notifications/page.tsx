"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, UserPlus, Heart, MessageCircle, ArrowLeft } from 'lucide-react';

interface Notification {
  id: string;
  type: 'friend_request' | 'like' | 'comment' | 'mention';
  from: {
    id: string;
    name: string;
    image?: string;
  };
  message: string;
  timestamp: string;
  read: boolean;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'friend_request',
      from: { id: 'u1', name: 'Alex Johnson' },
      message: 'sent you a friend request',
      timestamp: '2 hours ago',
      read: false,
    },
    {
      id: '2',
      type: 'like',
      from: { id: 'u2', name: 'Maya Patel' },
      message: 'liked your post',
      timestamp: '5 hours ago',
      read: false,
    },
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus className="w-5 h-5 text-blue-600" />;
      case 'like':
        return <Heart className="w-5 h-5 text-red-600" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center space-x-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Notifications</h1>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white ff-white mb-2">No notifications yet</h3>
            <p className="text-gray-600 dark:text-gray-400">When you get notifications, they'll show up here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div 
                key={notif.id}
                className={`flex items-start space-x-3 p-4 rounded-lg transition ${
                  notif.read 
                    ? 'bg-white dark:bg-gray-800' 
                    : 'bg-blue-50 dark:bg-blue-900/20'
                } hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer`}
              >
                <Avatar className="w-12 h-12 ring-2 ring-gray-200 dark:ring-gray-600">
                  <AvatarImage src={notif.from.image} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white ff-white">
                    {notif.from?.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold text-gray-900 dark:text-white ff-white">{notif.from.name}</span>
                        {' '}
                        <span className="text-gray-600 dark:text-gray-400">{notif.message}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notif.timestamp}</p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      {getIcon(notif.type)}
                    </div>
                  </div>
                  
                  {notif.type === 'friend_request' && (
                    <div className="flex space-x-2 mt-3">
                      <button className="px-4 py-1.5 bg-blue-600 text-white ff-white text-sm font-medium rounded-md hover:bg-blue-700 transition">
                        Accept
                      </button>
                      <button className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white ff-white text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

