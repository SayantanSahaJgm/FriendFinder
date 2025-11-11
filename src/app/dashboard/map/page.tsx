'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/context/ToastContext'
import { io, Socket } from 'socket.io-client'
import GoogleMap from '@/components/Map/GoogleMap'
import { UserMarker } from '@/components/Map/MapMarker'
import MapControls from '@/components/Map/MapControls'
import MarkerManager from '@/components/Map/MarkerManager'
import { useGeolocation, formatDistance, calculateDistance } from '@/hooks/useGeolocation'
import FriendInfoWindow from '@/components/Map/FriendInfoWindow'
import DistanceAlertManager from '@/components/Map/DistanceAlertManager'
import LocationPrivacySettings from '@/components/LocationPrivacySettings'

interface FriendLocation {
  userId: string
  username: string
  name?: string
  bio?: string
  profilePicture?: string
  location: {
    lat: number
    lng: number
    accuracy: number | null
    lastUpdated?: Date
  }
  distance?: number
  isOnline: boolean
  status: string
  lastSeen?: Date
  interests?: string[]
  isFriend: boolean
  hasPendingRequestTo?: boolean
  hasPendingRequestFrom?: boolean
}

export default function MapPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const toast = useToast()
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [friends, setFriends] = useState<FriendLocation[]>([])
  const [nearbyUsers, setNearbyUsers] = useState<FriendLocation[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isLoadingFriends, setIsLoadingFriends] = useState(true)
  const [isLoadingNearby, setIsLoadingNearby] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const lastUpdateRef = useRef<number>(0)
  const [selectedFriend, setSelectedFriend] = useState<FriendLocation | null>(null)
  const [showInfoWindow, setShowInfoWindow] = useState(false)
  const [maxDistance, setMaxDistance] = useState<number>(50000) // meters
  const [showOffline, setShowOffline] = useState<boolean>(true)
  const [clusteringEnabled, setClusteringEnabled] = useState<boolean>(true)
  const [darkStyle, setDarkStyle] = useState<boolean>(false)

  // Get user's current location
  const { latitude, longitude, accuracy, error, loading } = useGeolocation({
    enableHighAccuracy: true,
    watch: true, // Continuously update position
  })

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  // Default center (will be updated when location is available)
  const defaultCenter = { lat: 22.3149, lng: 87.3105 } // IIT Kharagpur

  // Use user's location if available, otherwise use default
  const center =
    latitude && longitude
      ? { lat: latitude, lng: longitude }
      : defaultCenter

  const handleMapLoad = useCallback((loadedMap: google.maps.Map) => {
    setMap(loadedMap)
    console.log('Map loaded successfully')
  }, [])

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!session?.user) return

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'
    const newSocket = io(socketUrl, {
      path: '/api/socket.io',
      auth: {
        token: (session as any).accessToken,
      },
    })

    newSocket.on('connect', () => {
      console.log('Socket.IO connected for location updates')
    })

    // Listen for friend location updates
    newSocket.on('location:changed', (data: {
      userId: string
      username: string
      location: { lat: number; lng: number; accuracy: number | null }
      timestamp: string
    }) => {
      console.log('Friend location updated:', data)
      setFriends(prev => {
        const existing = prev.find(f => f.userId === data.userId)
        if (existing) {
          // Update existing friend
          return prev.map(f =>
            f.userId === data.userId
              ? {
                  ...f,
                  location: {
                    ...data.location,
                    lastUpdated: new Date(data.timestamp),
                  },
                }
              : f
          )
        } else {
          // Add new friend location
          return [
            ...prev,
            {
              userId: data.userId,
              username: data.username,
              location: {
                ...data.location,
                lastUpdated: new Date(data.timestamp),
              },
              isOnline: true,
              status: 'online',
              isFriend: true,
            },
          ]
        }
      })
    })

    newSocket.on('disconnect', () => {
      console.log('Socket.IO disconnected')
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [session])

  // Fetch friends' locations (extracted so it can be re-used after settings change)
  const fetchFriendsLocations = useCallback(async () => {
    if (!session?.user) return
    try {
      setIsLoadingFriends(true)
      const response = await fetch('/api/location/friends')
      if (response.ok) {
        const data = await response.json()
        setFriends(data.friends || [])
        console.log(`Loaded ${data.friends?.length || 0} friend locations`)
      }
    } catch (error) {
      console.error('Error fetching friends locations:', error)
    } finally {
      setIsLoadingFriends(false)
    }
  }, [session])

  const fetchNearbyUsers = useCallback(async () => {
    if (!session?.user || !latitude || !longitude) return
    try {
      setIsLoadingNearby(true)
      const distanceKm = maxDistance / 1000
      const response = await fetch(`/api/location/nearby?maxDistance=${distanceKm}`)
      if (response.ok) {
        const data = await response.json()
        setNearbyUsers(data.nearby || [])
        console.log(`Loaded ${data.nearby?.length || 0} nearby discoverable users`)
      }
    } catch (error) {
      console.error('Error fetching nearby users:', error)
    } finally {
      setIsLoadingNearby(false)
    }
  }, [session, latitude, longitude, maxDistance])

  useEffect(() => {
    fetchFriendsLocations()
    fetchNearbyUsers()
  }, [fetchFriendsLocations, fetchNearbyUsers])

  // Send location updates to server
  useEffect(() => {
    if (!latitude || !longitude || !session?.user) return

    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdateRef.current

    // Update every 10 seconds minimum to avoid spamming
    if (timeSinceLastUpdate < 10000) return

    lastUpdateRef.current = now

    // Send to REST API
    const updateLocation = async () => {
      try {
        await fetch('/api/location/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude, longitude, accuracy }),
        })
        console.log('Location updated via API')
      } catch (error) {
        console.error('Error updating location:', error)
      }
    }

    // Send via Socket.IO for real-time updates
    if (socket?.connected) {
      socket.emit('location:update', { latitude, longitude, accuracy })
      console.log('Location broadcast via Socket.IO')
    }

    updateLocation()
  }, [latitude, longitude, accuracy, socket, session])

  // Handle chat action
  const handleChat = useCallback((friendId: string) => {
    router.push(`/dashboard/chat?userId=${friendId}`)
    setShowInfoWindow(false)
  }, [router])

  // Handle call action
  const handleCall = useCallback((friendId: string, friendName: string) => {
    router.push(`/dashboard/call?userId=${friendId}&userName=${encodeURIComponent(friendName)}`)
    setShowInfoWindow(false)
  }, [router])

  // Handle send friend request
  const handleSendFriendRequest = useCallback(async (userId: string) => {
    try {
      const response = await fetch('/api/friends/requests/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: userId }),
      })

      if (response.ok) {
        toast.success('Friend request sent!', 'Your request has been sent successfully')
        // Update the nearbyUsers state to reflect pending request
        setNearbyUsers(prev => prev.map(user => 
          user.userId === userId 
            ? { ...user, hasPendingRequestTo: true }
            : user
        ))
        // Update selected friend if it's the current one
        if (selectedFriend?.userId === userId) {
          setSelectedFriend(prev => prev ? { ...prev, hasPendingRequestTo: true } : null)
        }
      } else {
        const data = await response.json()
        toast.error('Failed to send request', data.error || 'Unable to send friend request')
      }
    } catch (error) {
      console.error('Error sending friend request:', error)
      toast.error('Network error', 'Failed to send friend request. Please check your connection.')
    }
  }, [selectedFriend, toast])

  // Handle friend marker click
  const handleFriendClick = useCallback((friend: FriendLocation) => {
    setSelectedFriend(friend)
    setShowInfoWindow(true)
    // Center map on friend
    if (map) {
      map.panTo({ lat: friend.location.lat, lng: friend.location.lng })
      map.setZoom(16)
    }
  }, [map])

  // Simple dark map style (used when toggled)
  const darkMapStyle: google.maps.MapTypeStyle[] = [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
  ]

  return (
  <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Distance Alert Manager */}
      {latitude && longitude && (
        <DistanceAlertManager
          friends={friends}
          userLocation={{ lat: latitude, lng: longitude }}
          alertRadius={500} // 500 meters = ~0.3 miles
        />
      )}

      {/* Header */}
  <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Friends Map
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              See where your friends are in real-time
            </p>
          </div>

          {/* Location Status */}
          <div className="flex items-center gap-3">
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 font-medium">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                Getting location...
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 font-medium">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            {latitude && longitude && (
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800 font-medium">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                Location active
                {accuracy && (
                  <span className="text-xs font-semibold">
                    (±{Math.round(accuracy)}m)
                  </span>
                )}
              </div>
            )}

            {/* Settings button */}
            <button
              className="ml-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg shadow-sm transition-colors"
              onClick={() => setShowSettings(true)}
            >
              Sharing settings
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <GoogleMap center={center} zoom={15} onMapLoad={handleMapLoad} mapStyle={darkStyle ? darkMapStyle : undefined}>
          {/* Show user marker if location is available */}
          {map && latitude && longitude && (
            <UserMarker map={map} position={{ lat: latitude, lng: longitude }} />
          )}

          {/* Marker manager handles friend and nearby user markers (with clustering and filtering) */}
          {map && (
            <MarkerManager
              map={map}
              friends={[...friends, ...nearbyUsers]}
              userLocation={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
              clustering={clusteringEnabled}
              showOffline={showOffline}
              maxDistance={maxDistance}
              onMarkerClick={(friendId: string) => {
                const f = friends.find(x => x.userId === friendId)
                const n = nearbyUsers.find(x => x.userId === friendId)
                const selectedUser = f || n
                if (selectedUser) handleFriendClick(selectedUser)
              }}
            />
          )}
        </GoogleMap>

        {/* Map Controls */}
        <MapControls
          maxDistance={maxDistance}
          onDistanceChange={(m) => setMaxDistance(m)}
          showOffline={showOffline}
          onToggleOffline={(v) => setShowOffline(v)}
          clusteringEnabled={clusteringEnabled}
          onToggleClustering={(v) => setClusteringEnabled(v)}
          darkStyle={darkStyle}
          onToggleStyle={(v) => setDarkStyle(v)}
        />

        {/* Info Window Popup */}
        {showInfoWindow && selectedFriend && map && (
          <div
            className="absolute z-50"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <FriendInfoWindow
              friendId={selectedFriend.userId}
              friendName={selectedFriend.username}
              distance={
                latitude && longitude
                  ? calculateDistance(
                      latitude,
                      longitude,
                      selectedFriend.location.lat,
                      selectedFriend.location.lng
                    )
                  : null
              }
              lastUpdated={selectedFriend.location.lastUpdated || new Date()}
              isOnline={selectedFriend.isOnline}
              isFriend={selectedFriend.isFriend !== false}
              hasPendingRequest={selectedFriend.hasPendingRequestTo || false}
              onChat={() => handleChat(selectedFriend.userId)}
              onCall={() => handleCall(selectedFriend.userId, selectedFriend.username)}
              onSendFriendRequest={() => handleSendFriendRequest(selectedFriend.userId)}
              onClose={() => setShowInfoWindow(false)}
            />
          </div>
        )}

    {/* Friends List Panel */}
    <div className="absolute top-6 right-6 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border-2 border-gray-200 dark:border-gray-700 p-4 max-w-xs max-h-96 overflow-y-auto backdrop-blur-sm">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3 flex items-center justify-between">
            <span>Friends Nearby</span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50 px-2 py-1 rounded-full">
              {friends.length}
            </span>
          </h3>

          {isLoadingFriends ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : friends.length === 0 ? (
            <p className="text-sm text-gray-700 dark:text-gray-300 text-center py-8 font-medium">
              No friends sharing location yet
            </p>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => {
                const distance = latitude && longitude
                  ? calculateDistance(latitude, longitude, friend.location.lat, friend.location.lng)
                  : null

                return (
                  <div
                    key={friend.userId}
                    className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors border border-gray-200 dark:border-gray-700"
                    onClick={() => handleFriendClick(friend)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold shadow-md">
                          {friend.username?.charAt(0).toUpperCase() || "?"}
                        </div>
                        {friend.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {friend.username}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                          {distance ? formatDistance(distance) : 'Unknown distance'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Nearby Discoverable Users Section */}
          {nearbyUsers.length > 0 && (
            <>
              <div className="my-4 border-t-2 border-gray-200 dark:border-gray-700"></div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                  Discoverable Nearby
                </span>
                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/50 px-2 py-1 rounded-full">
                  {nearbyUsers.length}
                </span>
              </h3>
              <div className="space-y-2">
                {nearbyUsers.map((user) => {
                  const distance = latitude && longitude
                    ? calculateDistance(latitude, longitude, user.location.lat, user.location.lng)
                    : null

                  return (
                    <div
                      key={user.userId}
                      className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/40 cursor-pointer transition-colors border-2 border-orange-200 dark:border-orange-800"
                      onClick={() => handleFriendClick(user)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold shadow-md">
                            {user.username?.charAt(0).toUpperCase() || "?"}
                          </div>
                          {user.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {user.username}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                            {distance ? formatDistance(distance) : 'Unknown distance'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

    {/* Info Panel - Improved visibility */}
    <div className="absolute bottom-6 right-6 bg-black/60 dark:bg-black/60 backdrop-blur-sm rounded-lg shadow-2xl border-2 border-gray-800 p-4 max-w-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <h3 className="font-bold text-lg text-white">
              Your Location
            </h3>
          </div>
          {latitude && longitude ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-transparent rounded">
                <span className="text-white font-medium">Latitude:</span>
                <span className="font-semibold text-white">{latitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-transparent rounded">
                <span className="text-white font-medium">Longitude:</span>
                <span className="font-semibold text-white">{longitude.toFixed(6)}</span>
              </div>
              {accuracy && (
                <div className="flex justify-between items-center p-2 bg-transparent rounded">
                  <span className="text-white font-medium">Accuracy:</span>
                  <span className="font-semibold text-white">±{Math.round(accuracy)}m</span>
                </div>
              )}
              <div className="flex justify-between items-center p-2 bg-transparent rounded mt-3">
                <span className="text-white font-semibold">Friends visible:</span>
                <span className="font-bold text-white">{friends.length}</span>
              </div>
              {nearbyUsers.length > 0 && (
                <div className="flex justify-between items-center p-2 bg-transparent rounded">
                  <span className="text-white font-semibold">Discoverable:</span>
                  <span className="font-bold text-white">{nearbyUsers.length}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-white font-medium">
              {loading ? 'Detecting your location...' : 'Location not available'}
            </p>
          )}
        </div>
        {showSettings && (
          <LocationPrivacySettings
            onClose={() => setShowSettings(false)}
            onSaved={() => {
              // refresh friends after settings change
              fetchFriendsLocations()
            }}
          />
        )}
      </div>
    </div>
  )
}
