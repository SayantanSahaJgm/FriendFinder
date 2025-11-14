"use client";

import { useRouter, usePathname } from "next/navigation";
import { MapPin, Bluetooth, Wifi, Search, Users, Plus } from "lucide-react";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { path: '/dashboard/map', icon: MapPin, label: 'Map', color: 'from-blue-500 to-blue-600' },
    { path: '/dashboard/bluetooth', icon: Bluetooth, label: 'Bluetooth', color: 'from-indigo-500 to-indigo-600' },
    { path: '/dashboard/wifi', icon: Wifi, label: 'WiFi', color: 'from-purple-500 to-purple-600' },
    { path: '/dashboard/search', icon: Search, label: 'Search', color: 'from-pink-500 to-pink-600' },
    { path: '/dashboard/random-chat', icon: Users, label: 'Random', color: 'from-violet-500 to-violet-600' },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]" 
      role="navigation" 
      aria-label="Main mobile navigation"
    >
      <div className="max-w-md mx-auto px-2 py-2.5 flex items-center justify-around relative">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`relative flex flex-col items-center p-2.5 rounded-2xl transition-all duration-300 min-w-[64px] group ${
                active 
                  ? 'scale-105' 
                  : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/80'
              }`}
              aria-label={item.label}
            >
              <div className={`relative ${active ? 'mb-1' : 'mb-1.5'}`}>
                {active && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-xl blur-md opacity-60 animate-pulse`}></div>
                )}
                <div className={`relative p-2.5 rounded-xl transition-all duration-300 ${
                  active 
                    ? `bg-gradient-to-br ${item.color} shadow-lg` 
                    : 'bg-gray-100/50 dark:bg-gray-800/50 group-hover:bg-gray-200/70 dark:group-hover:bg-gray-700/70'
                }`}>
                  <Icon className={`w-5 h-5 transition-colors ${active ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                </div>
              </div>
              <span className={`text-[10px] font-medium transition-all ${
                active ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {item.label}
              </span>
              {active && (
                <div className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r ${item.color} rounded-full`}></div>
              )}
            </button>
          );
        })}
        
        {/* Center elevated FAB button */}
        <button 
          onClick={() => router.push('/dashboard/create')}
          className="absolute left-1/2 -translate-x-1/2 -top-6 flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 group"
          aria-label="Create post"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity"></div>
          <Plus className="w-8 h-8 text-white relative z-10" strokeWidth={2.5} />
        </button>
      </div>
    </nav>
  );
}

