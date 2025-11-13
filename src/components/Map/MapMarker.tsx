'use client'

import { useEffect, useState } from 'react'

interface MapMarkerProps {
  map: google.maps.Map
  position: google.maps.LatLngLiteral
  title?: string
  icon?: string | google.maps.Icon | google.maps.Symbol
  onClick?: () => void
}

export default function MapMarker({ map, position, title, icon, onClick }: MapMarkerProps) {
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)

  useEffect(() => {
    if (!marker) {
      const newMarker = new google.maps.Marker({
        position,
        map,
        title,
        icon,
        animation: google.maps.Animation.DROP,
      })

      if (onClick) {
        newMarker.addListener('click', onClick)
      }

      setMarker(newMarker)
    }

    return () => {
      if (marker) {
        marker.setMap(null)
      }
    }
  }, [map, marker, onClick])

  // Update position when it changes
  useEffect(() => {
    if (marker) {
      marker.setPosition(position)
    }
  }, [marker, position])

  // Update title when it changes
  useEffect(() => {
    if (marker && title) {
      marker.setTitle(title)
    }
  }, [marker, title])

  // Update icon when it changes
  useEffect(() => {
    if (marker && icon) {
      marker.setIcon(icon)
    }
  }, [marker, icon])

  return null
}

// Custom marker for the current user
export function UserMarker({ map, position }: { map: google.maps.Map; position: google.maps.LatLngLiteral }) {
  return (
    <MapMarker
      map={map}
      position={position}
      title="Your Location"
      icon={{
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#00C2FF',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 4,
        scale: 14,
      }}
    />
  )
}

// Custom marker for friends
export function FriendMarker({
  map,
  position,
  friendName,
  onClick,
}: {
  map: google.maps.Map
  position: google.maps.LatLngLiteral
  friendName: string
  onClick?: () => void
}) {
  return (
    <MapMarker
      map={map}
      position={position}
      title={friendName}
      icon={{
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#34A853',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
        scale: 8,
      }}
      onClick={onClick}
    />
  )
}
