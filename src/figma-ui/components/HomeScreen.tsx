"use client";
import Link from "next/link";
import TopHeader from "./TopHeader";
import StoriesBar from "./StoriesBar";
import BottomNavigation from "./BottomNavigation";

export default function HomeScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      <TopHeader />

  <StoriesBar />

  <main className="container mx-auto px-4 py-12">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
            Connect with
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {' '}
              Friends
            </span>
            {' '}Around You
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover and connect with people nearby using GPS, WiFi, and
            Bluetooth. Chat, make calls, and build meaningful relationships in
            your area.
          </p>

          <div className="flex justify-center space-x-4">
            <Link href="/register" className="inline-block">
              <button className="rounded-full px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white ff-white font-medium">
                Start Connecting
              </button>
            </Link>

            <Link href="/login" className="inline-block">
              <button className="rounded-full px-8 py-3 border border-gray-300 text-gray-700 font-medium bg-white">
                Sign In
              </button>
            </Link>
          </div>
        </div>

        <section className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Feature title="Location-Based Discovery" desc="Find friends using GPS, WiFi, and Bluetooth proximity detection." />
          <Feature title="Real-time Messaging" desc="Chat instantly with friends and groups with live notifications." />
          <Feature title="Video & Voice Calls" desc="Make high-quality calls with built-in WebRTC technology." />
          <Feature title="Smart Matching" desc="Connect with people who share your interests and hobbies." />
        </section>
      </main>

      <footer className="border-t bg-white mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
          © 2025 FriendFinder. All rights reserved.
        </div>
      </footer>

      <BottomNavigation />
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-4">
        <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-indigo-500 rounded" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">{title}</h3>
      <p className="text-gray-600 text-center">{desc}</p>
    </div>
  );
}

