import { useState, useEffect } from 'react';
import { friendAPI } from '../services/api';

const FriendRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await friendAPI.getPendingRequests();
      setRequests(response.data.requests);
    } catch (err) {
      console.error('Failed to fetch friend requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await friendAPI.acceptRequest(requestId);
      setRequests(requests.filter((req) => req._id !== requestId));
    } catch (err) {
      alert('Failed to accept friend request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await friendAPI.rejectRequest(requestId);
      setRequests(requests.filter((req) => req._id !== requestId));
    } catch (err) {
      alert('Failed to reject friend request');
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Friend Requests ({requests.length})
      </h2>
      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request._id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {request.sender.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">
                  {request.sender.name}
                </h3>
                <p className="text-sm text-gray-500">{request.sender.email}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleAccept(request._id)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
              >
                Accept
              </button>
              <button
                onClick={() => handleReject(request._id)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendRequests;
