import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
});

// User services
export const updateLocation = (latitude, longitude, address) => {
  return api.put('/api/users/location', { latitude, longitude, address });
};

export const updateProfile = (data) => {
  return api.put('/api/users/profile', data);
};

export const findNearbyUsers = () => {
  return api.get('/api/users/nearby');
};

export const getUserById = (id) => {
  return api.get(`/api/users/${id}`);
};

// Friend services
export const sendFriendRequest = (receiverId) => {
  return api.post('/api/friends/request', { receiverId });
};

export const getReceivedRequests = () => {
  return api.get('/api/friends/requests/received');
};

export const getSentRequests = () => {
  return api.get('/api/friends/requests/sent');
};

export const acceptFriendRequest = (requestId) => {
  return api.put(`/api/friends/request/${requestId}/accept`);
};

export const rejectFriendRequest = (requestId) => {
  return api.put(`/api/friends/request/${requestId}/reject`);
};

export const removeFriend = (friendId) => {
  return api.delete(`/api/friends/${friendId}`);
};

// Message services
export const getMessages = (userId) => {
  return api.get(`/api/messages/${userId}`);
};

export const sendMessage = (receiverId, content) => {
  return api.post('/api/messages', { receiverId, content });
};

export const markAsRead = (userId) => {
  return api.put(`/api/messages/${userId}/read`);
};

export default api;
