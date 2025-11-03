'use client'

import { useEffect, useRef, useState } from 'react'
import { Wrapper, Status } from '@googlemaps/react-wrapper'

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
function MapRender(status: Status): JSX.Element {
  switch (status) {
    case Status.LOADING:
      return (
        <div className="flex items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
          </div>
        </div>
      )
    case Status.FAILURE:
      return (
        <div className="flex items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-800">
          <div className="text-center text-red-500">
            <svg
              className="w-12 h-12 mx-auto mb-4"
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
            <p className="font-semibold mb-2">Failed to load map</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please check your API key configuration
            </p>
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
      <div className="flex items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-800">
        <div className="text-center text-yellow-600">
          <svg
            className="w-12 h-12 mx-auto mb-4"
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
          <p className="font-semibold mb-2">Google Maps API Key Missing</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
            Please add <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your .env.local file
          </p>
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
