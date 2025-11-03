"use client"

import { useEffect, useRef } from 'react'
import { MarkerClusterer } from '@googlemaps/markerclusterer'

interface FriendLocation {
  userId: string
  username: string
  profilePicture?: string
  location: { lat: number; lng: number; accuracy?: number | null; lastUpdated?: Date }
  isOnline?: boolean
}

interface MarkerManagerProps {
  map: google.maps.Map
  friends: FriendLocation[]
  userLocation?: { lat: number; lng: number }
  clustering?: boolean
  showOffline?: boolean
  maxDistance?: number // in meters
  onMarkerClick?: (friendId: string) => void
}

export default function MarkerManager({
  map,
  friends,
  userLocation,
  clustering = true,
  showOffline = true,
  maxDistance = 100000,
  onMarkerClick,
}: MarkerManagerProps) {
  const markersRef = useRef<google.maps.Marker[]>([])
  const clusterRef = useRef<any>(null)

  useEffect(() => {
    // Clean up previous markers
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []
    if (clusterRef.current) {
      clusterRef.current.clearMarkers()
      clusterRef.current = null
    }

    const filtered = friends.filter((f) => {
      if (!showOffline && !f.isOnline) return false
      if (userLocation && maxDistance) {
        const R = 6371000 // meters
        const toRad = (v: number) => (v * Math.PI) / 180
        const dLat = toRad(f.location.lat - userLocation.lat)
        const dLon = toRad(f.location.lng - userLocation.lng)
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(userLocation.lat)) * Math.cos(toRad(f.location.lat)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const dist = R * c
        if (dist > (maxDistance || 0)) return false
      }
      return true
    })

    const newMarkers: google.maps.Marker[] = filtered.map((friend) => {
      const marker = new google.maps.Marker({
        position: { lat: friend.location.lat, lng: friend.location.lng },
        map,
        title: friend.username,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: friend.isOnline ? '#34A853' : '#9CA3AF',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
          scale: friend.isOnline ? 8 : 6,
        },
      })

      marker.addListener('click', () => {
        onMarkerClick?.(friend.userId)
      })

      return marker
    })

    markersRef.current = newMarkers

    if (clustering && newMarkers.length > 0) {
      clusterRef.current = new MarkerClusterer({ markers: newMarkers, map })
    }

    return () => {
      newMarkers.forEach((m) => m.setMap(null))
      if (clusterRef.current) {
        clusterRef.current.clearMarkers()
        clusterRef.current = null
      }
    }
  }, [map, friends, userLocation, clustering, showOffline, maxDistance, onMarkerClick])

  return null
}
