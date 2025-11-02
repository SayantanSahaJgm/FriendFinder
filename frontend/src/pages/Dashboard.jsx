import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NearbyUsers from '../components/NearbyUsers';
import FriendRequests from '../components/FriendRequests';
import FriendsList from '../components/FriendsList';
import Chat from '../components/Chat';
import LocationSettings from '../components/LocationSettings';
import MapView from '../components/MapView';
import VideoCall from '../components/VideoCall';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [activeTab, setActiveTab] = useState('nearby');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSelectFriend = (friend) => {
    setSelectedFriend(friend);
    setShowChat(true);
  };

  const handleStartCall = (friend) => {
    setSelectedFriend(friend);
    setShowVideoCall(true);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">FriendFinder</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.name}!</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="mb-6 flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('nearby')}
            className={`pb-2 px-4 ${
              activeTab === 'nearby'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600'
            }`}
          >
            Nearby Users
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`pb-2 px-4 ${
              activeTab === 'friends'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600'
            }`}
          >
            Friends
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`pb-2 px-4 ${
              activeTab === 'map'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600'
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2 px-4 ${
              activeTab === 'settings'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600'
            }`}
          >
            Settings
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            <FriendRequests />

            {activeTab === 'nearby' && <NearbyUsers />}
            
            {activeTab === 'friends' && (
              <FriendsList onSelectFriend={handleSelectFriend} />
            )}

            {activeTab === 'map' && (
              <MapView
                center={
                  user?.location?.coordinates[0] && user?.location?.coordinates[1]
                    ? {
                        lat: user.location.coordinates[1],
                        lng: user.location.coordinates[0],
                      }
                    : null
                }
              />
            )}

            {activeTab === 'settings' && <LocationSettings />}
          </div>

          {/* Chat Sidebar */}
          <div className="lg:col-span-1">
            {showChat ? (
              <Chat
                selectedFriend={selectedFriend}
                onClose={() => {
                  setShowChat(false);
                  setSelectedFriend(null);
                }}
              />
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('nearby')}
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                  >
                    Find Nearby Users
                  </button>
                  <button
                    onClick={() => setActiveTab('friends')}
                    className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
                  >
                    View Friends
                  </button>
                  <button
                    onClick={() => setActiveTab('map')}
                    className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600"
                  >
                    View Map
                  </button>
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    💡 <strong>Tip:</strong> Update your location in Settings to find people nearby!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Video Call Modal */}
      {showVideoCall && (
        <VideoCall
          friend={selectedFriend}
          onClose={() => {
            setShowVideoCall(false);
            setSelectedFriend(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
