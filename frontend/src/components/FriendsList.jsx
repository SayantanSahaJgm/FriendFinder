import { useState, useEffect } from 'react';
import { friendAPI } from '../services/api';

const FriendsList = ({ onSelectFriend }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const response = await friendAPI.getFriends();
      setFriends(response.data.friends);
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Friends ({friends.length})
      </h2>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : friends.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No friends yet. Start by adding nearby users!
        </div>
      ) : (
        <div className="space-y-2">
          {friends.map((friend) => (
            <div
              key={friend._id}
              onClick={() => onSelectFriend && onSelectFriend(friend)}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {friend.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{friend.name}</h3>
                <div className="flex items-center space-x-2">
                  {friend.isOnline ? (
                    <span className="text-xs text-green-500">● Online</span>
                  ) : (
                    <span className="text-xs text-gray-400">○ Offline</span>
                  )}
                </div>
              </div>
              <button className="text-blue-500 hover:text-blue-700 text-sm">
                Chat
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendsList;
