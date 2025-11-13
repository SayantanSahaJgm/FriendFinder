"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function TopHeader() {
  const { data: session } = useSession();

  return (
    <header className="w-full bg-white text-gray-900 border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        {/* Simple header with just logo */}
        <div className="flex items-center justify-center">
          {/* Logo */}
          <Link href={session?.user ? "/dashboard" : "/"} className="flex items-center space-x-2 hover:opacity-90 transition">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">FF</span>
            </div>
            <span className="text-xl font-bold text-gray-900">FriendFinder</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

