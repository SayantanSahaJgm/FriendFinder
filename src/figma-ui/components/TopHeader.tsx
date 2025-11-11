"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Bell, 
  MessageCircle, 
  Home, 
  Users, 
  Mail, 
  Shuffle, 
  MapPin, 
  Settings, 
  User, 
  Search,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function TopHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isActive = (path: string) => {
    if (path === '/dashboard' || path === '/') {
      return pathname === path || pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  const getNavLink = (path: string) => {
    // If user is logged in, return dashboard path, otherwise redirect to login
    if (session?.user) {
      return path.startsWith('/dashboard') ? path : `/dashboard${path}`;
    }
    return '/login';
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/friends", label: "Friends", icon: Users },
    { href: "/dashboard/messages", label: "Messages", icon: Mail },
    { href: "/dashboard/random-chat", label: "Random Chat", icon: Shuffle },
    { href: "/dashboard/discover", label: "Discover", icon: MapPin },
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      <header className="w-full bg-white/95 backdrop-blur-sm text-gray-900 border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          {/* Top bar with logo and icons */}
          <div className="flex items-center justify-between mb-2">
            {/* Logo */}
            <Link 
              href={session?.user ? "/dashboard" : "/"} 
              className="flex items-center space-x-2 hover:opacity-90 transition group"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                <span className="text-white ff-white font-bold text-lg">FF</span>
              </div>
              <span className="text-xl font-bold hidden sm:inline bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                FriendFinder
              </span>
            </Link>

            {/* Right icons */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Notifications */}
              <Link 
                href={getNavLink("/notifications")} 
                className="relative hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                {session?.user && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white ff-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs animate-pulse">
                    2
                  </span>
                )}
              </Link>

              {/* Search - hidden on small screens */}
              <Link 
                href={getNavLink("/search")} 
                className="hidden sm:inline-block hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              </Link>

              {/* Messages */}
              <Link 
                href={getNavLink("/messages")} 
                className="hover:bg-gray-100 p-2 rounded-full transition-colors relative"
              >
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                {session?.user && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white ff-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs">
                    5
                  </span>
                )}
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Profile Avatar */}
              <Link 
                href={getNavLink("/profile")} 
                className="hover:ring-2 hover:ring-blue-300 rounded-full transition-all"
              >
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-gray-200">
                  <AvatarImage src={session?.user?.image || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white ff-white text-sm font-semibold">
                    {session?.user?.name?.charAt(0) ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>

              {/* Sign Out Button (Desktop Only, when logged in) */}
              {session?.user && (
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="hidden lg:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all border border-gray-200 hover:border-red-300"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>

          {/* Desktop Navigation tabs */}
          <nav className="hidden lg:flex w-full justify-center items-center space-x-6 border-t border-gray-200 pt-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={getNavLink(item.href)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-blue-50 text-blue-600 shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="fixed top-[72px] left-0 right-0 bg-white border-b border-gray-200 shadow-xl z-40 lg:hidden max-h-[70vh] overflow-y-auto">
            <nav className="container mx-auto px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link
                    key={item.href}
                    href={getNavLink(item.href)}
                    onClick={() => setShowMobileMenu(false)}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      active
                        ? "bg-blue-50 text-blue-600 shadow-sm"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Mobile Sign Out */}
              {session?.user && (
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all w-full border-t border-gray-200 mt-4 pt-4"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              )}
            </nav>
          </div>
        </>
      )}
    </>
  );
}

