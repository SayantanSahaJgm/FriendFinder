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
          {/* Logo */}
          <Link href={session?.user ? "/dashboard" : "/"} className="flex items-center space-x-2 hover:opacity-90 transition">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">FF</span>
            </div>
            <span className="text-xl font-bold hidden sm:inline">FriendFinder</span>
          </Link>

          {/* Right icons: notifications, search, messages, profile */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link href={session?.user ? "/dashboard/notifications" : "/login"} className="relative">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white ff-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs">2</span>
            </Link>

            <Link href={session?.user ? "/dashboard/search" : "/login"} className="hidden sm:inline-block">
              <Search className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>

            <Link href={session?.user ? "/dashboard/messages" : "/login"}>
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>

            <Link href={session?.user ? "/dashboard/profile" : "/login"}>
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                <AvatarFallback className="bg-blue-500 text-white text-sm">
                  {session?.user?.name?.charAt(0) ?? "S"}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>

        {/* Desktop Navigation tabs (hidden on mobile) */}
  <nav className="hidden lg:flex items-center space-x-6 border-t border-gray-200 pt-2">
          <Link href={session?.user ? "/dashboard" : "/login"} className="flex items-center space-x-2 hover:text-blue-400 transition-colors text-gray-700">
            <Home className="w-5 h-5" />
            <span className="text-sm">Dashboard</span>
          </Link>
          <Link href={session?.user ? "/dashboard/friends" : "/login"} className="flex items-center space-x-2 hover:text-blue-400 transition-colors">
            <Users className="w-5 h-5" />
            <span className="text-sm">Friends</span>
          </Link>
          <Link href={session?.user ? "/dashboard/messages" : "/login"} className="flex items-center space-x-2 hover:text-blue-400 transition-colors">
            <Mail className="w-5 h-5" />
            <span className="text-sm">Messages</span>
          </Link>
          <Link href={session?.user ? "/dashboard/random-chat" : "/login"} className="flex items-center space-x-2 hover:text-blue-400 transition-colors">
            <Shuffle className="w-5 h-5" />
            <span className="text-sm">Random Chat</span>
          </Link>
          <Link href={session?.user ? "/dashboard/discover" : "/login"} className="flex items-center space-x-2 hover:text-blue-400 transition-colors">
            <MapPin className="w-5 h-5" />
            <span className="text-sm">Discover</span>
          </Link>
          <Link href={session?.user ? "/dashboard/profile" : "/login"} className="flex items-center space-x-2 hover:text-blue-400 transition-colors">
            <User className="w-5 h-5" />
            <span className="text-sm">Profile</span>
          </Link>
          <Link href={session?.user ? "/dashboard/settings" : "/login"} className="flex items-center space-x-2 hover:text-blue-400 transition-colors">
            <Settings className="w-5 h-5" />
            <span className="text-sm">Settings</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

