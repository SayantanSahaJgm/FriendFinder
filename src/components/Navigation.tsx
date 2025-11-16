"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Home, 
  Users, 
  MessageCircle, 
  Shuffle, 
  Search, 
  User, 
  Settings, 
  Menu, 
  X, 
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  Bluetooth,
  MapPin,
  Bell,
  Mail
} from "lucide-react";
import { ThemeToggleCompact, ThemeToggleSwitch } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export default function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(pathname ?? "");

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update active tab when pathname changes
  useEffect(() => {
    setActiveTab(pathname ?? "");
  }, [pathname]);

  // Close sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(path) ?? false;
  };

  if (status === "loading") {
    return (
      <div className="h-16 bg-surface-primary border-b animate-pulse" />
    );
  }

  if (!session) {
    return null;
  }

  const navigationItems: NavigationItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/friends", label: "Friends", icon: Users, badge: 2 },
    { href: "/dashboard/messages", label: "Messages", icon: MessageCircle, badge: 5 },
    { href: "/dashboard/random-chat", label: "Random Chat", icon: Shuffle },
    { href: "/dashboard/map", label: "Map", icon: MapPin },
    { href: "/dashboard/bluetooth", label: "Bluetooth", icon: Bluetooth },
    { href: "/dashboard/discover", label: "Discover", icon: Search },
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Enhanced Header Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        isScrolled 
          ? "glass-strong shadow-enhanced-lg border-b border-white/20" 
          : "bg-surface-primary/80 backdrop-blur-sm border-b"
      )}>
        <div className="max-w-6xl mx-auto mobile-padding">
          <div className="flex justify-between items-center h-16">
            {/* Circular Logo Only */}
            <Link
              href="/dashboard"
              className="flex items-center hover:scale-105 transition-all duration-200"
            >
              <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center text-white ff-white text-base font-bold shadow-enhanced-sm hover:shadow-enhanced-md transition-all duration-200">
                FF
              </div>
            </Link>

            {/* Center Navigation Pills (desktop) */}
            <div className="hidden lg:flex items-center justify-center flex-1">
              <div className="flex items-center gap-2 bg-transparent">
                {navigationItems.slice(0, 8).map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "px-3.5 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-200",
                        active
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                          : "bg-black/10 text-gray-900 dark:bg-white/5 dark:text-white hover:bg-black/20"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", active ? "text-white" : "text-gray-700 dark:text-gray-200")} />
                      <span className="hidden xl:inline-block">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-4">
              {/* Messages Icon */}
              <Link
                href="/dashboard/messages"
                className="relative hover:scale-110 transition-transform"
                title="Messages"
              >
                <Mail className="h-6 w-6 text-gray-900 dark:text-white" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-toast-error text-white ff-white text-xs rounded-full flex items-center justify-center text-[10px]">
                  5
                </span>
              </Link>

              {/* Notifications Icon */}
              <Link
                href="/dashboard/notifications"
                className="relative hover:scale-110 transition-transform"
                title="Notifications"
              >
                <Bell className="h-6 w-6 text-gray-900 dark:text-white" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-toast-error text-white ff-white text-xs rounded-full flex items-center justify-center text-[10px]">
                  3
                </span>
              </Link>

              {/* Profile Avatar */}
              <Link
                href="/dashboard/profile"
                className="hover:scale-110 transition-transform"
                title="Profile"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white ff-white font-semibold shadow-sm">
                  {session.user?.name?.charAt(0).toUpperCase() || session.user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
              </Link>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden"
                aria-label="Toggle menu"
              >
                {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed navigation */}
      <div className="h-16" />

      {/* Enhanced Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Enhanced Mobile Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-80 glass-strong shadow-enhanced-2xl transform transition-all duration-300 ease-out z-50 lg:hidden",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-6">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/dashboard"
              className="flex items-center text-xl font-bold text-brand-primary hover:text-brand-secondary transition-colors group"
            >
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white ff-white font-bold mr-3 shadow-enhanced-md group-hover:shadow-enhanced-lg transition-all duration-200">
                FF
              </div>
              FriendFinder
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
              className="hover:bg-surface-tertiary"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                    active
                      ? "text-brand-primary dark:text-blue-400 bg-brand-accent/20 dark:bg-blue-500/20 shadow-enhanced-sm border-l-4 border-brand-primary dark:border-blue-400"
                      : "text-gray-700 dark:text-gray-200 hover:text-foreground dark:hover:text-white hover:bg-surface-secondary dark:hover:bg-gray-700 hover:shadow-enhanced-xs"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-all duration-200",
                    active ? "text-brand-primary dark:text-blue-400" : "group-hover:scale-110"
                  )} />
                  <span className="dark:text-gray-100">{item.label}</span>
                  {item.badge && (
                      <span className="ml-auto h-6 w-6 bg-toast-error text-white ff-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Theme Toggle in Sidebar */}
          <div className="border-t border-white/10 dark:border-gray-700 pt-4 mb-4">
            <div className="flex items-center justify-between px-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Theme</span>
              <ThemeToggleSwitch />
            </div>
          </div>

          {/* Sidebar User Menu */}
          <div className="border-t border-white/10 dark:border-gray-700 pt-4">
            <div className="flex items-center gap-3 mb-3 px-4">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate text-gray-900 dark:text-white">
                  {session.user?.name || "User"}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {session.user?.email}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full gap-2 hover:bg-toast-error hover:text-white hover:border-toast-error transition-all duration-200 mx-4 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
              style={{ width: 'calc(100% - 2rem)' }}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="glass-strong border-t border-white/20 px-4 py-2">
          <div className="flex items-center justify-around">
            {[
              navigationItems[0], // Dashboard
              navigationItems[1], // Friends
              navigationItems[3], // Random Chat
              navigationItems[4], // Map
              navigationItems[6], // Discover
            ].map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 min-w-0 flex-1",
                    active
                      ? "text-brand-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-all duration-200",
                    active && "text-brand-primary scale-110"
                  )} />
                  <span className="text-xs font-medium truncate max-w-full">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-toast-error text-white ff-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                  {active && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
        {/* Safe area padding for devices with home indicator */}
        <div className="h-safe-bottom bg-surface-primary/80 backdrop-blur-sm" />
      </div>

      {/* Bottom spacer for mobile navigation */}
      <div className="h-20 lg:hidden" />
    </>
  );
}

