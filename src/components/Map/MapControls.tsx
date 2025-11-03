"use client"

import React from 'react'

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
  return (
    <div className="absolute top-6 left-6 z-50 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg w-72">
      <h4 className="font-semibold mb-2 text-sm text-gray-900 dark:text-white">Map Filters</h4>

      <div className="mb-3">
        <label className="text-xs text-gray-600 dark:text-gray-400">Distance radius: {Math.round(maxDistance)}m</label>
        <input
          type="range"
          min={100}
          max={100000}
          step={100}
          value={maxDistance}
          onChange={(e) => onDistanceChange(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-700 dark:text-gray-300">Show offline friends</span>
        <input type="checkbox" checked={showOffline} onChange={(e) => onToggleOffline(e.target.checked)} />
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-700 dark:text-gray-300">Cluster markers</span>
        <input type="checkbox" checked={clusteringEnabled} onChange={(e) => onToggleClustering(e.target.checked)} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700 dark:text-gray-300">Dark map style</span>
        <input type="checkbox" checked={darkStyle} onChange={(e) => onToggleStyle(e.target.checked)} />
      </div>
    </div>
  )
}
