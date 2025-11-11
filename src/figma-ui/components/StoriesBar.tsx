"use client";
import React, { useState } from "react";
import Link from "next/link";
import StoryComposer from "./StoryComposer";

const demoStories = [
  { id: "1", name: "Alex", color: "bg-indigo-400", src: null },
  { id: "2", name: "Maya", color: "bg-pink-400", src: null },
  { id: "3", name: "Sam", color: "bg-green-400", src: null },
];

export default function StoriesBar() {
  const [openComposer, setOpenComposer] = useState(false);

  return (
    <div className="w-full bg-transparent py-3">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center overflow-x-auto space-x-3">
          {/* Add story button */}
          <div className="flex-shrink-0">
            <button onClick={() => setOpenComposer(true)} className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white ff-white text-xl font-bold">+
              </div>
              <span className="text-xs mt-1">Your Story</span>
            </button>
          </div>

          {demoStories.map((s) => {
            // Defensive: ensure name is a string before calling charAt
            const displayName = s?.name || "?";
            const initial = typeof displayName === 'string' && displayName.length > 0 
              ? displayName.charAt(0).toUpperCase() 
              : "?";
            
            return (
              <div key={s.id} className="flex-shrink-0">
                <Link href={`/dashboard/stories/${s.id}`} className="flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-full ${s.color} flex items-center justify-center text-white ff-white text-xl font-bold`}>
                    {initial}
                  </div>
                  <span className="text-xs mt-1">{displayName}</span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* composer drawer/modal (simple inline) */}
      {openComposer && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="w-full sm:max-w-md">
            <StoryComposer onClose={() => setOpenComposer(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

