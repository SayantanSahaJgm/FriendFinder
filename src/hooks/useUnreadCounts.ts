"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useUnreadCounts() {
  const { data: session } = useSession();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.email) {
      setIsLoading(false);
      return;
    }

    const fetchCounts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/unread-counts');
        if (response.ok) {
          const data = await response.json();
          setUnreadMessages(data.messages || 0);
          setUnreadNotifications(data.notifications || 0);
        }
      } catch (error) {
        console.error('Failed to fetch unread counts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts();

    // Poll for updates every 60 seconds (reduced from 30 to save API calls)
    const interval = setInterval(fetchCounts, 60000);

    return () => clearInterval(interval);
  }, [session?.user?.email]);

  const markMessagesAsRead = () => {
    setUnreadMessages(0);
  };

  const markNotificationsAsRead = () => {
    setUnreadNotifications(0);
  };

  const incrementMessages = () => {
    setUnreadMessages(prev => prev + 1);
  };

  const incrementNotifications = () => {
    setUnreadNotifications(prev => prev + 1);
  };

  return {
    unreadMessages,
    unreadNotifications,
    isLoading,
    markMessagesAsRead,
    markNotificationsAsRead,
    incrementMessages,
    incrementNotifications,
  };
}
