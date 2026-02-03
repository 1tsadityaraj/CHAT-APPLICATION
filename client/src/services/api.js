import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Chat APIs
export const chatAPI = {
  getChats: () => api.get('/chats'),
  createChat: (userId) => api.post('/chats', { userId }),
  createGroupChat: (data) => api.post('/chats/group', data),
  getChat: (chatId) => api.get(`/chats/${chatId}`),
};

// Message APIs
export const messageAPI = {
  getMessages: (chatId) => api.get(`/messages/${chatId}`),
  createMessage: (data) => api.post('/messages', data),
};

// User APIs
export const userAPI = {
  searchUsers: (query) => api.get(`/users?search=${encodeURIComponent(query)}`),
};

export default api;

