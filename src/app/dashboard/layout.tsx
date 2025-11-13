"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationCenter from "@/components/NotificationCenter";
import WifiManager from "@/components/WifiManager";
import BottomNav from "@/components/BottomNav";
import {
  Users,
  MessageCircle,
  Compass,
  Settings,
  User,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  Home,
  Phone,
  MapPin,
  Shuffle,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Friends", href: "/dashboard/friends", icon: Users },
  { name: "Messages", href: "/dashboard/messages", icon: MessageCircle },
  { name: "Random Chat", href: "/dashboard/random-chat", icon: Shuffle },
  { name: "Discover", href: "/dashboard/discover", icon: Compass },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const { user, logout } = useAuth();
  const router = useRouter();

  // Hydration fix: ensure client-side rendering matches server-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get user display name safely
  const displayName = user?.username || session?.user?.name || "User";
  const userEmail = user?.email || session?.user?.email;
  const userImage = session?.user?.image;

  // Safe avatar initials calculation
  const getInitials = (name: string | undefined | null): string => {
    if (!name || typeof name !== 'string') return "U";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "U";
    return parts.map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/dashboard/friends?tab=search&q=${encodeURIComponent(
          searchQuery.trim()
        )}`
      );
      setSearchQuery("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-black dark:bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-gray-950 shadow-xl border-r border-gray-200 dark:border-gray-800">
            <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white ff-white text-sm font-bold">FF</span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  FriendFinder
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
                className="h-10 w-10 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 px-4 py-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const baseClasses = "group flex items-center px-3 py-3 text-base font-medium rounded-md transition-colors touch-target-44";
                const activeClasses = isActive
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-r-2 border-blue-700 dark:border-blue-400"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white";
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${baseClasses} ${activeClasses}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {item.name === "Random Chat" ? (
                      <img src="/random-logo.png" alt="Random Chat" className={`mr-3 h-5 w-5`} />
                    ) : (
                      <item.icon
                        className={`mr-3 h-5 w-5 ${
                          isActive
                            ? "text-blue-700 dark:text-blue-400"
                            : "text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                        }`}
                      />
                    )}
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* WiFi Manager in Sidebar */}
            <div className="px-4 pb-4">
              <WifiManager />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-800">
          <button
            type="button"
            className="px-4 border-r border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden touch-target-44"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Header Content */}
          <div className="flex-1 flex items-center justify-between px-4">
            {/* Left: FF Logo */}
            <Link href="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white ff-white text-lg font-bold">FF</span>
              </div>
            </Link>

            {/* Center: Navigation Menu (hidden on mobile) */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {item.name === "Random Chat" ? (
                      <img src="/random-logo.png" alt="Random Chat" className="w-5 h-5 object-contain rounded" />
                    ) : (
                      <item.icon className="w-5 h-5" />
                    )}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right: Messages, Notifications, Profile */}
            <div className="flex items-center space-x-3">
              {/* Messages Icon with Badge */}
              <Link
                href="/dashboard/messages"
                className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <MessageCircle className="w-6 h-6" />
                {/* Badge - replace with actual unread count */}
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  2
                </span>
              </Link>

              {/* Notifications */}
              <NotificationCenter />

              {/* Profile Avatar */}
              <Link href="/dashboard/profile" className="flex items-center">
                <Avatar className="h-10 w-10 ring-2 ring-blue-500 hover:ring-blue-600 transition-all cursor-pointer">
                  <AvatarImage src={userImage || undefined} alt={displayName} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white ff-white font-semibold">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 bg-gray-50 dark:bg-black pb-20">
          <div className="max-w-7xl mx-auto bg-gray-50 dark:bg-black">
            {children}
          </div>
        </main>

        {/* Bottom Navigation - Always visible on all pages */}
        <BottomNav />
      </div>
    </div>
  );
}

