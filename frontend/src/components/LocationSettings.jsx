import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';

const LocationSettings = () => {
  const [maxDistance, setMaxDistance] = useState(5000);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLatitude(lat.toFixed(6));
          setLongitude(lng.toFixed(6));
        },
        (error) => {
          setError('Failed to get current location');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser');
    }
  };

  const updateLocation = async () => {
    if (!latitude || !longitude) {
      setError('Please enter or get your location');
      return;
    }

    try {
      await userAPI.updateLocation(parseFloat(latitude), parseFloat(longitude));
      setMessage('Location updated successfully!');
      setError('');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update location');
    }
  };

  const updateDistance = async () => {
    try {
      await userAPI.updateMaxDistance(maxDistance);
      setMessage('Distance filter updated successfully!');
      setError('');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update distance');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Location Settings</h2>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Your Location</h3>
          <div className="flex space-x-2 mb-2">
            <input
              type="number"
              step="0.000001"
              placeholder="Latitude"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              step="0.000001"
              placeholder="Longitude"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={getCurrentLocation}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Use Current Location
            </button>
            <button
              onClick={updateLocation}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Update Location
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">
            Search Radius: {(maxDistance / 1000).toFixed(1)} km
          </h3>
          <input
            type="range"
            min="1000"
            max="50000"
            step="1000"
            value={maxDistance}
            onChange={(e) => setMaxDistance(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>1 km</span>
            <span>50 km</span>
          </div>
          <button
            onClick={updateDistance}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Update Distance Filter
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationSettings;
