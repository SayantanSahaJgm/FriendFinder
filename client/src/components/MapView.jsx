import { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useAuth } from '../contexts/AuthContext';
import { findNearbyUsers } from '../services/api';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const MapView = () => {
  const { user } = useAuth();
  const [center, setCenter] = useState({ lat: 0, lng: 0 });
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.location?.coordinates) {
      setCenter({
        lng: user.location.coordinates[0],
        lat: user.location.coordinates[1],
      });
      loadNearbyUsers();
    }
  }, [user]);

  const loadNearbyUsers = async () => {
    try {
      const res = await findNearbyUsers();
      setNearbyUsers(res.data);
    } catch (err) {
      console.error('Failed to load nearby users:', err);
    } finally {
      setLoading(false);
    }
  };

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Map View</h2>
          <p className="text-gray-600">
            Please set VITE_GOOGLE_MAPS_API_KEY in your .env file
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Your location: {user?.address || 'Not set'}
          </p>
          {nearbyUsers.length > 0 && (
            <p className="text-sm text-gray-500">
              {nearbyUsers.length} nearby users found
            </p>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-600">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
          {/* Current user marker */}
          {user?.location?.coordinates && (
            <Marker
              position={{
                lng: user.location.coordinates[0],
                lat: user.location.coordinates[1],
              }}
              label="You"
              icon={{
                url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              }}
            />
          )}

          {/* Nearby users markers */}
          {nearbyUsers.map((nearbyUser) => (
            <Marker
              key={nearbyUser._id}
              position={{
                lng: nearbyUser.location.coordinates[0],
                lat: nearbyUser.location.coordinates[1],
              }}
              title={nearbyUser.name}
              icon={{
                url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
              }}
            />
          ))}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default MapView;
