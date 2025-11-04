 'use client'

import { MessageCircle, Phone, Navigation, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDistance } from '@/hooks/useGeolocation'

interface FriendInfoWindowProps {
  friendId: string
  friendName: string
  distance: number | null
  lastUpdated: Date
  isOnline: boolean
  onChat: () => void
  onCall: () => void
  onClose: () => void
}

export default function FriendInfoWindow({
  friendId,
  friendName,
  distance,
  lastUpdated,
  isOnline,
  onChat,
  onCall,
  onClose,
}: FriendInfoWindowProps) {
  const router = useRouter()
  const getLastUpdatedText = () => {
    const now = new Date()
    const diffMs = now.getTime() - lastUpdated.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    
    if (diffSec < 60) return 'Just now'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    return `${Math.floor(diffHr / 24)}d ago`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 min-w-[280px] max-w-[320px] border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg">
              {friendName.charAt(0).toUpperCase()}
            </div>
            {isOnline && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {friendName}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Info */}
      <div className="space-y-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Distance:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {distance ? formatDistance(distance) : 'Unknown'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Last updated:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {getLastUpdatedText()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onChat}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium text-sm"
        >
          <MessageCircle className="w-4 h-4" />
          Chat
        </button>
        <button
          onClick={onCall}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium text-sm"
        >
          <Phone className="w-4 h-4" />
          Call
        </button>
      </div>

      {/* Get Directions */}
      {/* View Profile */}
      <button
        onClick={() => {
          if (!friendId) {
            console.error('Attempted to view profile but friendId is missing')
            return
          }

          // Use client-side navigation for a smoother transition and fewer runtime edge-cases
          try {
            router.push(`/dashboard/profile/${friendId}`)
          } catch (e) {
            // Fallback to opening in a new tab if router navigation fails
            window.open(`/dashboard/profile/${friendId}`, '_blank')
          }
        }}
        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-medium text-sm"
      >
        View Profile
      </button>

      <button
        onClick={() => {
          // This will open in Google Maps
          const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(friendName)}`
          window.open(url, '_blank')
        }}
        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium text-sm"
      >
        <Navigation className="w-4 h-4" />
        Get Directions
      </button>
    </div>
  )
}
