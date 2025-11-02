import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import NearbyUsers from '../components/NearbyUsers';
import FriendsList from '../components/FriendsList';
import ChatWindow from '../components/ChatWindow';
import FriendRequests from '../components/FriendRequests';
import VideoCall from '../components/VideoCall';
import MapView from '../components/MapView';
import { getCurrentPosition } from '../utils/geolocation';
import { updateLocation } from '../services/api';

const Dashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState('nearby');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [callUser, setCallUser] = useState(null);
  const [locationSet, setLocationSet] = useState(false);

  useEffect(() => {
    // Request location on mount
    const requestLocation = async () => {
      try {
        const position = await getCurrentPosition();
        await updateLocation(position.latitude, position.longitude);
        setLocationSet(true);
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    requestLocation();
  }, []);

  const handleChatOpen = (friend) => {
    setSelectedFriend(friend);
    setShowChat(true);
  };

  const handleCallStart = (friend) => {
    setCallUser(friend);
    setInCall(true);
  };

  const handleCallEnd = () => {
    setInCall(false);
    setCallUser(null);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">FriendFinder</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Welcome, {user?.name}</span>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('nearby')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'nearby'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Nearby
            </button>
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'friends'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Friends
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'requests'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Requests
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {!locationSet && (
              <div className="p-4 bg-yellow-50 border-b border-yellow-200">
                <p className="text-sm text-yellow-800">
                  📍 Please enable location to find nearby users
                </p>
              </div>
            )}

            {activeTab === 'nearby' && <NearbyUsers onChatOpen={handleChatOpen} />}
            {activeTab === 'friends' && (
              <FriendsList
                onChatOpen={handleChatOpen}
                onCallStart={handleCallStart}
              />
            )}
            {activeTab === 'requests' && <FriendRequests />}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {showChat && selectedFriend ? (
            <ChatWindow
              friend={selectedFriend}
              onClose={() => setShowChat(false)}
              onCallStart={() => handleCallStart(selectedFriend)}
            />
          ) : (
            <MapView />
          )}
        </div>
      </div>

      {/* Video Call Modal */}
      {inCall && callUser && (
        <VideoCall
          friend={callUser}
          onEnd={handleCallEnd}
        />
      )}
    </div>
  );
};

export default Dashboard;
