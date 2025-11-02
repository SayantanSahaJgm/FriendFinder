import { useAuth } from '../contexts/AuthContext';

const FriendsList = ({ onChatOpen, onCallStart }) => {
  const { user } = useAuth();

  if (!user?.friends || user.friends.length === 0) {
    return (
      <div className="p-4 text-center text-gray-600">
        No friends yet. Add some friends to start chatting!
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {user.friends.map((friend) => (
        <div key={friend._id} className="p-4 hover:bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                  {friend.name.charAt(0).toUpperCase()}
                </div>
                {friend.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{friend.name}</h3>
                <p className="text-sm text-gray-600">
                  {friend.isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onChatOpen(friend)}
                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
                title="Chat"
              >
                💬
              </button>
              <button
                onClick={() => onCallStart(friend)}
                className="bg-green-500 hover:bg-green-600 text-white p-2 rounded"
                title="Call"
              >
                📞
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FriendsList;
