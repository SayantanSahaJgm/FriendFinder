"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { MapPin, Bluetooth, Wifi, PlusCircle, Search, Shuffle } from "lucide-react";

export default function BottomNavigation() {
  const { data: session } = useSession();

  return (
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900 rounded-full shadow-2xl px-3 py-2 sm:px-6 sm:py-3 flex items-center space-x-4 sm:space-x-8 max-w-[95vw] sm:max-w-none z-50">
      {/* Order: Map, Bluetooth, WiFi, Post (center), Search, Random */}
      <Link href={session?.user ? "/dashboard/discover" : "/login"} className="flex flex-col items-center text-sm text-white hover:text-blue-400 transition-colors">
        <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 hidden sm:inline">Map</span>
      </Link>

      <Link href={session?.user ? "/dashboard/discover?method=bluetooth" : "/login"} className="flex flex-col items-center text-sm text-white hover:text-blue-400 transition-colors">
        <Bluetooth className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 hidden sm:inline">Bluetooth</span>
      </Link>

      <Link href={session?.user ? "/dashboard/discover?method=wifi" : "/login"} className="flex flex-col items-center text-sm text-white hover:text-blue-400 transition-colors">
        <Wifi className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 hidden sm:inline">WiFi</span>
      </Link>

      {/* Center Post button - always show */}
      <Link href={session?.user ? "/dashboard/create" : "/login"} className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full p-2 sm:p-3 shadow-lg transform scale-110 hover:scale-115 transition-all">
        <PlusCircle className="w-6 h-6 sm:w-7 sm:h-7" />
      </Link>

      <Link href={session?.user ? "/dashboard/search" : "/login"} className="flex flex-col items-center text-sm text-white hover:text-blue-400 transition-colors">
        <Search className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 hidden sm:inline">Search</span>
      </Link>

      <Link href={session?.user ? "/dashboard/random-chat" : "/login"} className="flex flex-col items-center text-sm text-white hover:text-blue-400 transition-colors">
        <Shuffle className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 hidden sm:inline">Random</span>
      </Link>
    </nav>
  );
}
