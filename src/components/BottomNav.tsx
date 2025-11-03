"use client";

import { useRouter, usePathname } from "next/navigation";
import { MapPin, Bluetooth, Wifi, Search, Film, Plus } from "lucide-react";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-2xl" 
      role="navigation" 
      aria-label="Main mobile navigation"
    >
      <div className="max-w-md mx-auto px-3 py-2 flex items-center justify-around">
        <button 
          onClick={() => router.push('/dashboard/discover')}
          className={`flex flex-col items-center p-2 rounded-lg transition min-w-[60px] ${
            isActive('/dashboard/discover') 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          aria-label="Discover nearby friends"
        >
          <MapPin className="w-6 h-6" />
          <span className="text-xs mt-1 font-medium">Map</span>
        </button>
        
        <button 
          onClick={() => router.push('/dashboard/discover?method=bluetooth')}
          className={`flex flex-col items-center p-2 rounded-lg transition min-w-[60px] ${
            pathname.includes('bluetooth') 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          aria-label="Bluetooth discovery"
        >
          <Bluetooth className="w-6 h-6" />
          <span className="text-xs mt-1 font-medium">Bluetooth</span>
        </button>
        
        <button 
          onClick={() => router.push('/dashboard/discover?method=wifi')}
          className={`flex flex-col items-center p-2 rounded-lg transition min-w-[60px] ${
            pathname.includes('wifi') 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          aria-label="WiFi discovery"
        >
          <Wifi className="w-6 h-6" />
          <span className="text-xs mt-1 font-medium">WiFi</span>
        </button>
        
        {/* Center elevated button - Create Post */}
        <button 
          onClick={() => router.push('/dashboard/create')}
          className="flex flex-col items-center justify-center w-14 h-14 rounded-full shadow-xl transition transform hover:scale-110 -mt-8 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          aria-label="Create post"
        >
          <Plus className="w-7 h-7 text-white ff-white" />
        </button>
        
        <button 
          onClick={() => router.push('/dashboard/search')}
          className={`flex flex-col items-center p-2 rounded-lg transition min-w-[60px] ${
            isActive('/dashboard/search') 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          aria-label="Search users"
        >
          <Search className="w-6 h-6" />
          <span className="text-xs mt-1 font-medium">Search</span>
        </button>
        
        <button 
          onClick={() => router.push('/dashboard/random-chat')}
          className={`flex flex-col items-center p-2 rounded-lg transition min-w-[60px] ${
            isActive('/dashboard/random-chat') 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          aria-label="Random chat"
        >
          <Film className="w-6 h-6" />
          <span className="text-xs mt-1 font-medium">Random</span>
        </button>
      </div>
    </nav>
  );
}

