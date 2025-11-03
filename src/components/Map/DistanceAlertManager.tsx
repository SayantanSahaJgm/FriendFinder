'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, X } from 'lucide-react'

interface DistanceAlert {
  id: string
  friendName: string
  friendId: string
  distance: number
  timestamp: Date
}

interface DistanceAlertManagerProps {
  friends: Array<{
    userId: string
    username: string
    location: { lat: number; lng: number }
  }>
  userLocation: { lat: number; lng: number } | null
  alertRadius?: number // in meters, default 500m
}

export default function DistanceAlertManager({
  friends,
  userLocation,
  alertRadius = 500,
}: DistanceAlertManagerProps) {
  const [alerts, setAlerts] = useState<DistanceAlert[]>([])
  const [showAlertsList, setShowAlertsList] = useState(false)
  const previousDistancesRef = useRef<Map<string, number>>(new Map())
  const notifiedFriendsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!userLocation || friends.length === 0) return

    friends.forEach((friend) => {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        friend.location.lat,
        friend.location.lng
      )

      const previousDistance = previousDistancesRef.current.get(friend.userId)
      const wasOutsideRadius = !previousDistance || previousDistance > alertRadius
      const isNowInsideRadius = distance <= alertRadius

      // Alert if friend just entered the radius
      if (
        wasOutsideRadius &&
        isNowInsideRadius &&
        !notifiedFriendsRef.current.has(friend.userId)
      ) {
        // Create notification
        const alert: DistanceAlert = {
          id: `${friend.userId}-${Date.now()}`,
          friendName: friend.username,
          friendId: friend.userId,
          distance,
          timestamp: new Date(),
        }

        setAlerts((prev) => [alert, ...prev])
        notifiedFriendsRef.current.add(friend.userId)

        // Show browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`${friend.username} is nearby!`, {
            body: `${friend.username} is within ${Math.round(distance)}m of you`,
            icon: '/images/logo.png',
            tag: friend.userId,
          })
        }

        // Auto-dismiss alert after 10 seconds
        setTimeout(() => {
          setAlerts((prev) => prev.filter((a) => a.id !== alert.id))
        }, 10000)
      }

      // Reset notification flag if friend moves far away
      if (distance > alertRadius * 1.5) {
        notifiedFriendsRef.current.delete(friend.userId)
      }

      previousDistancesRef.current.set(friend.userId, distance)
    })
  }, [friends, userLocation, alertRadius])

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId))
  }

  const dismissAll = () => {
    setAlerts([])
  }

  if (alerts.length === 0) return null

  return (
    <>
      {/* Alert Badge */}
      <button
        onClick={() => setShowAlertsList(!showAlertsList)}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all"
      >
        <Bell className="w-4 h-4" />
        <span className="font-medium">{alerts.length} nearby</span>
      </button>

      {/* Alerts List */}
      {showAlertsList && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Proximity Alerts
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={dismissAll}
                className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Clear all
              </button>
              <button
                onClick={() => setShowAlertsList(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {alert.friendName} is nearby!
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Within {Math.round(alert.distance)}m of you
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {getTimeAgo(alert.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2">
        {alerts.slice(0, 3).map((alert) => (
          <div
            key={alert.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-80 border border-gray-200 dark:border-gray-700 animate-slide-in"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {alert.friendName} is nearby!
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Within {Math.round(alert.distance)}m of you
                </p>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}
