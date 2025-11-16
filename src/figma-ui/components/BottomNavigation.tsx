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
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-card rounded-full shadow-lg px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-center gap-5 max-w-[520px] w-full z-50 border border-border">
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
        <Link href={createHref} className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full z-20">
          <div className="relative bg-card border border-border rounded-full w-full h-full flex items-center justify-center shadow-md hover:shadow-lg transition-transform transform hover:scale-105">
            <PlusCircle className="w-5 h-5 text-foreground" />
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

