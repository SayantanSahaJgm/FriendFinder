'use client'

import { useState, useEffect } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  watch?: boolean // If true, continuously watch position
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    watch = false,
  } = options

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
  })

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setState({
        latitude: null,
        longitude: null,
        accuracy: null,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      })
      return
    }

    const geoOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    }

    const onSuccess = (position: GeolocationPosition) => {
      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        error: null,
        loading: false,
      })
    }

    const onError = (error: GeolocationPositionError) => {
      let errorMessage = 'Unknown error occurred'

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location permission denied. Please enable location access in your browser.'
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable.'
          break
        case error.TIMEOUT:
          errorMessage = 'Location request timed out.'
          break
      }

      setState({
        latitude: null,
        longitude: null,
        accuracy: null,
        error: errorMessage,
        loading: false,
      })
    }

    let watchId: number | undefined

    if (watch) {
      // Continuously watch position
      watchId = navigator.geolocation.watchPosition(onSuccess, onError, geoOptions)
    } else {
      // Get position once
      navigator.geolocation.getCurrentPosition(onSuccess, onError, geoOptions)
    }

    // Cleanup
    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [enableHighAccuracy, timeout, maximumAge, watch])

  return state
}

// Helper function to request location permission
export async function requestLocationPermission(): Promise<boolean> {
  if (!navigator.permissions) {
    return false
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return result.state === 'granted'
  } catch (error) {
    console.error('Error checking location permission:', error)
    return false
  }
}

// Helper function to calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in kilometers
  return distance
}

// Format distance for display
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`
  } else if (km < 10) {
    return `${km.toFixed(1)}km`
  } else {
    return `${Math.round(km)}km`
  }
}
