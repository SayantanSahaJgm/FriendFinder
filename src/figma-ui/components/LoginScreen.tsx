"use client";
import Link from "next/link";
import TopHeader from "./TopHeader";

export default function LoginScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      <TopHeader />
      <main className="container mx-auto px-4 py-12 max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Sign in to FriendFinder</h2>
        <form className="space-y-4 bg-white p-6 rounded shadow-sm">
          <label className="block">
            <div className="text-sm text-gray-600">Email</div>
            <input type="email" className="mt-1 w-full border rounded px-3 py-2" placeholder="you@example.com" />
          </label>

          <label className="block">
            <div className="text-sm text-gray-600">Password</div>
            <input type="password" className="mt-1 w-full border rounded px-3 py-2" placeholder="••••••••" />
          </label>

          <div className="flex items-center justify-between">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Sign in</button>
            <Link href="/register" className="text-sm text-blue-600">Create account</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
