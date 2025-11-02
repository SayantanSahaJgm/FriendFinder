import { useState, useEffect } from 'react';
import { userAPI, friendAPI } from '../services/api';

const NearbyUsers = () => {
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchNearbyUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await userAPI.findNearby();
      setNearbyUsers(response.data.users);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch nearby users');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      await friendAPI.sendRequest(userId);
      alert('Friend request sent!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send friend request');
    }
  };

  useEffect(() => {
    fetchNearbyUsers();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Nearby Users</h2>
        <button
          onClick={fetchNearbyUsers}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : nearbyUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No nearby users found. Update your location to find people nearby.
        </div>
      ) : (
        <div className="space-y-3">
          {nearbyUsers.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{user.name}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  {user.isOnline && (
                    <span className="text-xs text-green-500">● Online</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => sendFriendRequest(user._id)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
              >
                Add Friend
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NearbyUsers;
