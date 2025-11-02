import { useState, useEffect } from 'react';
import {
  getReceivedRequests,
  getSentRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from '../services/api';

const FriendRequests = () => {
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('received');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const [received, sent] = await Promise.all([
        getReceivedRequests(),
        getSentRequests(),
      ]);
      setReceivedRequests(received.data);
      setSentRequests(sent.data);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      alert('Friend request accepted! Please refresh to see your updated friends list.');
      loadRequests();
    } catch (err) {
      alert('Failed to accept request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectFriendRequest(requestId);
      alert('Friend request rejected');
      loadRequests();
    } catch (err) {
      alert('Failed to reject request');
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-600">Loading...</div>;
  }

  return (
    <div>
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('received')}
          className={`flex-1 py-2 px-4 text-sm ${
            activeTab === 'received'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          Received ({receivedRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`flex-1 py-2 px-4 text-sm ${
            activeTab === 'sent'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          Sent ({sentRequests.length})
        </button>
      </div>

      <div className="divide-y divide-gray-200">
        {activeTab === 'received' ? (
          receivedRequests.length === 0 ? (
            <div className="p-4 text-center text-gray-600">
              No pending requests
            </div>
          ) : (
            receivedRequests.map((request) => (
              <div key={request._id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                      {request.sender.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {request.sender.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        wants to be your friend
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(request._id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(request._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )
        ) : sentRequests.length === 0 ? (
          <div className="p-4 text-center text-gray-600">
            No pending requests
          </div>
        ) : (
          sentRequests.map((request) => (
            <div key={request._id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                  {request.receiver.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {request.receiver.name}
                  </h3>
                  <p className="text-sm text-gray-600">Request pending...</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FriendRequests;
