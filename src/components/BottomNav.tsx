"use client";

import { useRouter, usePathname } from "next/navigation";
import { MapPin, Bluetooth, Wifi, Search, Plus } from "lucide-react";
import VideoCameraIcon from "@/components/icons/VideoCameraIcon";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { path: '/dashboard/map', icon: MapPin, label: 'Map', color: 'from-blue-500 to-blue-600' },
    { path: '/dashboard/bluetooth', icon: Bluetooth, label: 'Bluetooth', color: 'from-indigo-500 to-indigo-600' },
    { path: '/dashboard/wifi', icon: Wifi, label: 'WiFi', color: 'from-purple-500 to-purple-600' },
    { path: '/dashboard/search', icon: Search, label: 'Search', color: 'from-pink-500 to-pink-600' },
    { path: '/dashboard/random-chat', icon: VideoCameraIcon, label: 'Random', color: 'from-violet-500 to-violet-600' },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200/40 dark:border-gray-700/40 z-50 shadow-[0_-6px_18px_rgba(0,0,0,0.06)]"
      role="navigation" 
      aria-label="Main mobile navigation"
    >
      <div className="max-w-sm mx-auto px-2 py-2 flex items-center justify-around relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`relative flex flex-col items-center p-2 rounded-2xl transition-all duration-300 min-w-[52px] group ${
                active ? 'scale-105' : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/80'
              }`}
            >
              <div className={`relative ${active ? 'mb-0.5' : 'mb-1'}`}>
                <div
                  className={`relative p-2 rounded-lg transition-all duration-200 ${
                    active
                      ? `bg-gradient-to-br ${item.color} shadow-md`
                      : 'bg-gray-100/60 dark:bg-gray-800/60 group-hover:bg-gray-200/70 dark:group-hover:bg-gray-700/70'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-colors ${active ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                </div>
              </div>
              <span
                className={`text-[10px] font-medium transition-all ${
                  active ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {item.label}
              </span>
              {active && (
                <div className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r ${item.color} rounded-full`} />
              )}
            </button>
          );
        })}

        {/* Center elevated FAB button */}
        <button 
          onClick={() => router.push('/dashboard/create')}
          className="absolute left-1/2 -translate-x-1/2 -top-4 flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 group"
          aria-label="Create"
        >
          <div className="absolute inset-0 rounded-full opacity-80"></div>
          <Plus className="w-6 h-6 text-white relative z-10" strokeWidth={2.2} />
        </button>
      </div>
    </nav>
  );
}

