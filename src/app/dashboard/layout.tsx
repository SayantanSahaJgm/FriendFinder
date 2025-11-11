"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuth } from "@/context/AuthContext";
import TopHeader from "@/figma-ui/components/TopHeader";
import BottomNavigation from "@/figma-ui/components/BottomNavigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const { user } = useAuth();

  // Hydration fix: ensure client-side rendering matches server-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Unified Top Header - same for logged in and logged out */}
      <TopHeader />

      {/* Page content */}
      <main className="flex-1 pb-24 pt-4">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Unified Bottom Navigation - same for logged in and logged out */}
      <BottomNavigation />
    </div>
  );
}

