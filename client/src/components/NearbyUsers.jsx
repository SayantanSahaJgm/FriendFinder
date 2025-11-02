import { useState, useEffect } from 'react';
import { findNearbyUsers, sendFriendRequest } from '../services/api';

const NearbyUsers = ({ onChatOpen }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNearbyUsers();
  }, []);

  const loadNearbyUsers = async () => {
    try {
      setLoading(true);
      const res = await findNearbyUsers();
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load nearby users');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await sendFriendRequest(userId);
      alert('Friend request sent!');
      loadNearbyUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send request');
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-600">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">{error}</div>;
  }

  if (users.length === 0) {
    return (
      <div className="p-4 text-center text-gray-600">
        No nearby users found. Try adjusting your distance filter.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {users.map((user) => (
        <div key={user._id} className="p-4 hover:bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{user.name}</h3>
                <p className="text-sm text-gray-600">{user.bio || 'No bio'}</p>
                {user.address && (
                  <p className="text-xs text-gray-500">📍 {user.address}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => handleSendRequest(user._id)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              Add Friend
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NearbyUsers;
