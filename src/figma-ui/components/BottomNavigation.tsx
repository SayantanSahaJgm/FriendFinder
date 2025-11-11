"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { MapPin, Bluetooth, Wifi, PlusCircle, Search, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNavigation() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const getNavLink = (path: string) => {
    // If user is logged in, return dashboard path, otherwise redirect to login
    if (session?.user) {
      return path.startsWith('/dashboard') ? path : `/dashboard${path}`;
    }
    return '/login';
  };

  const isActive = (path: string) => {
    if (path === '/dashboard' || path === '/') {
      return pathname === path || pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  const navItems = [
    { 
      href: "/dashboard/map", 
      label: "Map", 
      icon: MapPin,
      color: "from-blue-500 to-blue-600"
    },
    { 
      href: "/dashboard/bluetooth", 
      label: "Bluetooth", 
      icon: Bluetooth,
      color: "from-indigo-500 to-indigo-600"
    },
    { 
      href: "/dashboard/wifi", 
      label: "WiFi", 
      icon: Wifi,
      color: "from-purple-500 to-purple-600"
    },
    { 
      href: "/dashboard/search", 
      label: "Search", 
      icon: Search,
      color: "from-pink-500 to-pink-600"
    },
    { 
      href: "/dashboard/random-chat", 
      label: "Random", 
      icon: Shuffle,
      color: "from-violet-500 to-violet-600"
    },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-md rounded-full shadow-2xl px-3 py-2 sm:px-6 sm:py-3 flex items-center space-x-4 sm:space-x-8 max-w-[95vw] sm:max-w-none z-50 border border-gray-200">
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        const isMiddle = index === 2; // Center position for the create button

        return (
          <div key={item.href} className="relative">
            <Link
              href={getNavLink(item.href)}
              className={cn(
                "flex flex-col items-center text-sm transition-all relative group",
                active ? "text-blue-600" : "text-gray-700 hover:text-blue-500"
              )}
            >
              <div className={cn(
                "relative p-2 rounded-full transition-all",
                active && "bg-blue-50"
              )}>
                {active && (
                  <div className={cn(
                    "absolute inset-0 rounded-full blur-md opacity-60 animate-pulse",
                    `bg-gradient-to-br ${item.color}`
                  )} />
                )}
                <Icon className={cn(
                  "w-5 h-5 sm:w-6 sm:h-6 relative z-10 transition-transform group-hover:scale-110",
                  active && "text-blue-600"
                )} />
              </div>
              <span className={cn(
                "text-[10px] sm:text-xs mt-0.5 sm:mt-1 font-medium hidden sm:inline",
                active && "text-blue-600 font-semibold"
              )}>
                {item.label}
              </span>
              {active && (
                <div className={cn(
                  "absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full",
                  `bg-gradient-to-r ${item.color}`
                )} />
              )}
            </Link>

            {/* Insert center FAB button after WiFi */}
            {isMiddle && (
              <Link
                href={getNavLink("/create")}
                className="absolute left-full ml-4 sm:ml-8 flex items-center justify-center bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full p-3 sm:p-4 shadow-2xl transform -translate-y-2 hover:scale-110 active:scale-95 transition-all group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
                <PlusCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white ff-white relative z-10" strokeWidth={2.5} />
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

