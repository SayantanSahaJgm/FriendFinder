import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useState } from 'react';

const MapView = ({ center, nearbyUsers = [] }) => {
  const [map, setMap] = useState(null);

  const containerStyle = {
    width: '100%',
    height: '400px',
  };

  const defaultCenter = center || {
    lat: 40.7128,
    lng: -74.0060,
  };

  const onLoad = (map) => {
    setMap(map);
  };

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Map View</h2>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Google Maps API key is not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Map View</h2>
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={12}
          onLoad={onLoad}
        >
          {/* Current user marker */}
          {center && (
            <Marker
              position={center}
              label="You"
              icon={{
                path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 8,
              }}
            />
          )}

          {/* Nearby users markers */}
          {nearbyUsers.map((user) => (
            <Marker
              key={user._id}
              position={{
                lat: user.location.coordinates[1],
                lng: user.location.coordinates[0],
              }}
              title={user.name}
            />
          ))}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default MapView;
