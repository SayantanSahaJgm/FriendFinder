"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, MessageCircle, Home, Users, Mail, Shuffle, MapPin, Settings, User, Search } from "lucide-react";

export default function TopHeader() {
  const { data: session } = useSession();

  return (
  <header className="w-full bg-white text-gray-900">
      <div className="container mx-auto px-4 py-3">
        {/* Top bar with logo and icons */}
        <div className="flex items-center justify-between mb-2">
          {/* Logo - redirects to dashboard */}
          <Link href={session?.user ? "/dashboard" : "/register"} className="flex items-center space-x-2 hover:opacity-90 transition">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">FF</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:inline">FriendFinder</span>
          </Link>

          {/* Right icons: messages, notifications, search, profile */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Messages icon - redirects to messages page */}
            <Link href={session?.user ? "/dashboard/messages" : "/register"} className="relative hover:text-blue-600 transition-colors" title="Messages">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            </Link>

            {/* Notifications icon - redirects to notifications page */}
            <Link href={session?.user ? "/dashboard/notifications" : "/register"} className="relative hover:text-blue-600 transition-colors" title="Notifications">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs">2</span>
            </Link>

            <Link href={session?.user ? "/dashboard/search" : "/register"} className="hidden sm:inline-block hover:text-blue-600 transition-colors" title="Search">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            </Link>

            {/* Profile avatar - redirects to profile page */}
            <Link href={session?.user ? "/dashboard/profile" : "/register"} title="Profile">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 hover:ring-2 hover:ring-blue-400 transition-all">
                <AvatarFallback className="bg-blue-500 text-white text-sm">
                  {session?.user?.name?.charAt(0) ?? "S"}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>

        {/* Desktop Navigation tabs (hidden on mobile) */}
  <nav className="hidden lg:flex w-full justify-center items-center space-x-6 border-t border-gray-200 pt-2">
          <Link href={session?.user ? "/dashboard" : "/register"} className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
            <Home className="w-5 h-5" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <Link href={session?.user ? "/dashboard/friends" : "/register"} className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">Friends</span>
          </Link>
          <Link href={session?.user ? "/dashboard/messages" : "/register"} className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
            <Mail className="w-5 h-5" />
            <span className="text-sm font-medium">Messages</span>
          </Link>
          <Link href={session?.user ? "/dashboard/random-chat" : "/register"} className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
            <Shuffle className="w-5 h-5" />
            <span className="text-sm font-medium">Random Chat</span>
          </Link>
          <Link href={session?.user ? "/dashboard/discover" : "/register"} className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
            <MapPin className="w-5 h-5" />
            <span className="text-sm font-medium">Discover</span>
          </Link>
          <Link href={session?.user ? "/dashboard/profile" : "/register"} className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
            <User className="w-5 h-5" />
            <span className="text-sm font-medium">Profile</span>
          </Link>
          <Link href={session?.user ? "/dashboard/settings" : "/register"} className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

