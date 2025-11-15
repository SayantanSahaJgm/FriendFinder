"use client"

import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface MapControlsProps {
  maxDistance: number
  onDistanceChange: (m: number) => void
  showOffline: boolean
  onToggleOffline: (v: boolean) => void
  clusteringEnabled: boolean
  onToggleClustering: (v: boolean) => void
  darkStyle: boolean
  onToggleStyle: (v: boolean) => void
}

export default function MapControls({
  maxDistance,
  onDistanceChange,
  showOffline,
  onToggleOffline,
  clusteringEnabled,
  onToggleClustering,
  darkStyle,
  onToggleStyle,
}: MapControlsProps) {
  // Start collapsed by default and allow user to expand
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      className={`absolute top-6 left-6 z-50 transition-all duration-300 ${isExpanded ? 'bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden' : ''}`}
      role="region"
      aria-label="Map filters"
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between cursor-pointer transition-all ${isExpanded ? 'px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600' : 'px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-md'}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 className="font-bold text-base text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span className={`${isExpanded ? '' : 'text-sm'}`}>Map Filters</span>
        </h4>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-white" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-5 space-y-4 w-80">
          {/* Distance Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Distance radius
              </label>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                {maxDistance >= 1000 ? `${(maxDistance / 1000).toFixed(1)}km` : `${Math.round(maxDistance)}m`}
              </span>
            </div>
            <input
              type="range"
              min={100}
              max={100000}
              step={100}
              value={maxDistance}
              onChange={(e) => onDistanceChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider-thumb"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(maxDistance / 100000) * 100}%, #e5e7eb ${(maxDistance / 100000) * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>100m</span>
              <span>50km</span>
              <span>100km</span>
            </div>
          </div>

          {/* Toggle Options */}
          <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            {/* Show Offline */}
            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Show offline friends</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Display inactive friends</span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showOffline}
                  onChange={(e) => onToggleOffline(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${showOffline ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${showOffline ? 'translate-x-5' : ''}`}></div>
              </div>
            </label>

            {/* Cluster Markers */}
            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40 transition-colors">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Cluster markers</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Group nearby friends</span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={clusteringEnabled}
                  onChange={(e) => onToggleClustering(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${clusteringEnabled ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${clusteringEnabled ? 'translate-x-5' : ''}`}></div>
              </div>
            </label>

            {/* Dark Map Style */}
            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-800 dark:bg-gray-600 flex items-center justify-center group-hover:bg-gray-900 dark:group-hover:bg-gray-500 transition-colors">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Dark map style</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Night mode theme</span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={darkStyle}
                  onChange={(e) => onToggleStyle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${darkStyle ? 'bg-gray-700' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${darkStyle ? 'translate-x-5' : ''}`}></div>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
