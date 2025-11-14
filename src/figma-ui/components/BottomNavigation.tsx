"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { MapPin, Bluetooth, Wifi, PlusCircle, Search, Shuffle } from "lucide-react";

export default function BottomNavigation() {
  const { data: session } = useSession();
  const mapHref = session?.user ? "/dashboard/map" : "/register";
  const btHref = session?.user ? "/dashboard/bluetooth" : "/register";
  const wifiHref = session?.user ? "/dashboard/wifi" : "/register";
  const createHref = session?.user ? "/dashboard/create" : "/register";
  const searchHref = session?.user ? "/dashboard/search" : "/register";
  const randomHref = session?.user ? "/dashboard/random-chat" : "/register";

  return (
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-md rounded-full shadow-2xl px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-center gap-6 max-w-[95vw] sm:max-w-none z-50 border border-gray-200">
      {/* Left group */}
      <div className="flex items-center gap-6 px-2">
        <Link href={mapHref} className="flex flex-col items-center text-sm text-gray-700 hover:text-blue-500 transition-colors">
          <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 hidden sm:inline">Map</span>
        </Link>

        <Link href={btHref} className="flex flex-col items-center text-sm text-gray-700 hover:text-blue-500 transition-colors">
          <Bluetooth className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 hidden sm:inline">Bluetooth</span>
        </Link>

        <Link href={wifiHref} className="flex flex-col items-center text-sm text-gray-700 hover:text-blue-500 transition-colors">
          <Wifi className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 hidden sm:inline">WiFi</span>
        </Link>
      </div>

      {/* Center FAB */}
      <div className="relative">
        <Link href={createHref} className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full z-20">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 via-indigo-500 to-blue-500 blur-xl opacity-60" />
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full w-full h-full flex items-center justify-center shadow-2xl transform scale-110 hover:scale-105 transition-transform">
            <PlusCircle className="w-7 h-7 text-white" />
          </div>
        </Link>
      </div>

      {/* Right group */}
      <div className="flex items-center gap-6 px-2">
        <Link href={searchHref} className="flex flex-col items-center text-sm text-gray-700 hover:text-blue-500 transition-colors">
          <Search className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 hidden sm:inline">Search</span>
        </Link>

        <Link href={randomHref} className="flex flex-col items-center text-sm text-gray-700 hover:text-blue-500 transition-colors">
          <Shuffle className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 hidden sm:inline">Random</span>
        </Link>
      </div>
    </nav>
  );
}

