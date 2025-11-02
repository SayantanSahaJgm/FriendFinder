import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// User endpoints
export const userAPI = {
  updateLocation: (latitude, longitude) => 
    api.put('/users/location', { latitude, longitude }),
  updateMaxDistance: (maxDistance) => 
    api.put('/users/max-distance', { maxDistance }),
  findNearby: () => api.get('/users/nearby'),
  getUserById: (userId) => api.get(`/users/${userId}`),
};

// Friend endpoints
export const friendAPI = {
  sendRequest: (receiverId) => api.post('/friends/request', { receiverId }),
  getPendingRequests: () => api.get('/friends/requests/pending'),
  acceptRequest: (requestId) => api.put(`/friends/request/${requestId}/accept`),
  rejectRequest: (requestId) => api.put(`/friends/request/${requestId}/reject`),
  getFriends: () => api.get('/friends'),
};

// Message endpoints
export const messageAPI = {
  sendMessage: (receiverId, content) => 
    api.post('/messages', { receiverId, content }),
  getChatHistory: (userId, limit = 50, skip = 0) => 
    api.get(`/messages/chat/${userId}`, { params: { limit, skip } }),
  markAsRead: (senderId) => api.put(`/messages/read/${senderId}`),
};

export default api;
