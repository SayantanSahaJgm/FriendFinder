'use client'

import { useEffect, useRef, useState } from 'react'
import { Wrapper, Status } from '@googlemaps/react-wrapper'
import type { ReactElement } from 'react'

interface GoogleMapProps {
  center: google.maps.LatLngLiteral
  zoom: number
  onMapLoad?: (map: google.maps.Map) => void
  children?: React.ReactNode
  mapStyle?: google.maps.MapTypeStyle[]
}

interface MapComponentProps {
  center: google.maps.LatLngLiteral
  zoom: number
  onMapLoad?: (map: google.maps.Map) => void
  children?: React.ReactNode
}

// Main Map component that renders the actual Google Map
function MapComponent({ center, zoom, onMapLoad, children, mapStyle }: MapComponentProps & { mapStyle?: google.maps.MapTypeStyle[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)

  useEffect(() => {
    if (mapRef.current && !map) {
      const newMap = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
        styles: (mapStyle && mapStyle.length > 0) ? mapStyle : [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      })
      setMap(newMap)
      onMapLoad?.(newMap)
    }
  }, [mapRef, map, center, zoom, onMapLoad])

  // Update center when it changes
  useEffect(() => {
    if (map) {
      map.setCenter(center)
    }
  }, [map, center])

  // Update zoom when it changes
  useEffect(() => {
    if (map) {
      map.setZoom(zoom)
    }
  }, [map, zoom])

  return (
    <>
      <div ref={mapRef} className="w-full h-full" />
      {children}
    </>
  )
}

// Render callback for different loading states
function MapRender(status: Status): ReactElement {
  switch (status) {
    case Status.LOADING:
      return (
        <div className="flex items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-900 dark:text-white font-medium">Loading map...</p>
          </div>
        </div>
      )
    case Status.FAILURE:
      return (
        <div className="flex items-center justify-center w-full h-full bg-red-50 dark:bg-red-950">
          <div className="text-center max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-red-200 dark:border-red-800">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="font-bold text-xl text-red-600 dark:text-red-400 mb-2">Failed to load Google Maps</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              The Google Maps API key may be invalid or restricted.
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                <strong className="text-red-600 dark:text-red-400">Common fixes:</strong>
              </p>
              <ul className="text-xs text-left text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Check if the API key is valid</li>
                <li>• Enable Maps JavaScript API in Google Cloud Console</li>
                <li>• Verify API restrictions and billing</li>
              </ul>
            </div>
          </div>
        </div>
      )
    case Status.SUCCESS:
      return <></>
  }
}

// Main exported component with Wrapper
export default function GoogleMap({ center, zoom, onMapLoad, children, mapStyle }: GoogleMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-yellow-50 dark:bg-yellow-950">
        <div className="text-center max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-yellow-200 dark:border-yellow-800">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="font-bold text-xl text-yellow-600 dark:text-yellow-400 mb-2">Google Maps API Key Missing</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Please configure your Google Maps API key to use the map feature.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              <strong className="text-gray-900 dark:text-white">Add to .env.local:</strong>
            </p>
            <code className="block bg-gray-800 text-green-400 px-4 py-3 rounded text-xs font-mono break-all">
              NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
            </code>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Wrapper apiKey={apiKey} render={MapRender} libraries={['places']}>
      <MapComponent center={center} zoom={zoom} onMapLoad={onMapLoad} mapStyle={mapStyle}>
        {children}
      </MapComponent>
    </Wrapper>
  )
}
