"use client";

import Link from "next/link";
import React from "react";
import { Bell } from "lucide-react";
import { useFriends } from "@/context/FriendsContext";

export default function NotificationButton() {
  const { receivedRequests } = useFriends();
  const unreadCount = receivedRequests ? receivedRequests.length : 0;

  return (
    <Link
      href="/dashboard/notifications"
      target="_blank"
      rel="noopener noreferrer"
      className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
      title="Open notifications in new tab"
    >
      <Bell className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white ff-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[1.25rem]">
          {unreadCount}
        </span>
      )}
    </Link>
  );
}
