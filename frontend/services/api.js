import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';
import { auth } from './firebase';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      let token = null;

      // Priority 1: get a fresh token directly from Firebase currentUser.
      // This works even when isSigningUp blocks onAuthStateChanged and the
      // token hasn't been written to AsyncStorage yet.
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
        // Keep AsyncStorage in sync so other parts of the app have it too
        await AsyncStorage.setItem('authToken', token);
        console.log('🔑 [api.js] token from Firebase currentUser ✅');
      } else {
        // Fallback: try AsyncStorage (covers already-logged-in sessions)
        token = await AsyncStorage.getItem('authToken');
        console.log('🔑 [api.js] token from AsyncStorage:', token ? 'EXISTS ✅' : 'NULL ❌');
      }

      console.log('🌐 [api.js] request URL:', config.baseURL + config.url);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Error adding auth token:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response) {
      const { status, data } = error.response;
      console.error('❌ [api.js] response error:', status, data);

      if (status === 401) {
        await AsyncStorage.removeItem('authToken');
      }

      throw new Error(data?.message || 'An error occurred');
    } else if (error.request) {
      console.error('❌ [api.js] no response received. Is the server reachable?');
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

// Auth APIs
export const authAPI = {
  login: (userData, config = {}) =>
  api.post('/auth/login', userData, config),
  register: (userData, config = {}) =>
  api.post('/auth/register', userData, config),
  logout: () => api.post('/auth/logout'),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resetPassword: (email) => api.post('/auth/reset-password', { email }),
  googleLogin: (idToken) => api.post('/auth/google', { idToken }),
};

// User APIs
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  updatePreferences: (preferences) => api.put('/users/preferences', preferences),
  getSavedArticles: () => api.get('/users/saved-articles'),
  saveArticle: (articleId) => api.post(`/users/save-article/${articleId}`),
  unsaveArticle: (articleId) => api.delete(`/users/save-article/${articleId}`),
  getReadingHistory: () => api.get('/users/reading-history'),
  clearHistory: () => api.delete('/users/reading-history'),
};

// Channel APIs
export const channelAPI = {
  getAll: (params) => api.get('/channels', { params }),
  getById: (id) => api.get(`/channels/${id}`),
  getByOwner: () => api.get('/channels/owner'),
  create: (data) => api.post('/channels', data),
  update: (id, data, config = {}) => api.put(`/channels/${id}`, data, config),
  delete: (id) => api.delete(`/channels/${id}`),
  subscribe: (id) => api.post(`/channels/${id}/subscribe`),
  unsubscribe: (id) => api.delete(`/channels/${id}/subscribe`),
  getSubscribers: () => api.get('/channels/subscribers'),
  getStats: (id) => api.get(`/channels/${id}/stats`),
};

// Article APIs
export const articleAPI = {
  getAll: (params) => api.get('/articles', { params }),
  getById: (id) => api.get(`/articles/${id}`),
  getByChannel: (channelId) => api.get(`/articles/channel/${channelId}`),
  getByCategory: (category) => api.get(`/articles/category/${category}`),
  getTrending: () => api.get('/articles/trending'),
  getLatest: () => api.get('/articles/latest'),
  create: (data) => api.post('/articles', data),
  update: (id, data) => api.put(`/articles/${id}`, data),
  delete: (id) => api.delete(`/articles/${id}`),
  like: (id) => api.post(`/articles/${id}/like`),
  unlike: (id) => api.delete(`/articles/${id}/like`),
  comment: (id, data) => api.post(`/articles/${id}/comments`, data),
  getComments: (id) => api.get(`/articles/${id}/comments`),
  search: (query) => api.get(`/articles/search?q=${query}`),
};

// Video APIs
export const videoAPI = {
  getAll: (params) => api.get('/videos', { params }),
  getById: (id) => api.get(`/videos/${id}`),
  getByChannel: (channelId) => api.get(`/videos/channel/${channelId}`),
  getByCategory: (category) => api.get(`/videos/category/${category}`),
  create: (data) => api.post('/videos', data),
  update: (id, data) => api.put(`/videos/${id}`, data),
  delete: (id) => api.delete(`/videos/${id}`),
  like: (id) => api.post(`/videos/${id}/like`),
  unlike: (id) => api.delete(`/videos/${id}/like`),
  comment: (id, data) => api.post(`/videos/${id}/comments`, data),
  getComments: (id) => api.get(`/videos/${id}/comments`),
};

// Live APIs
export const liveAPI = {
  getAll: (params) => api.get('/live', { params }),
  getById: (id) => api.get(`/live/${id}`),
  getByChannel: (channelId) => api.get(`/live/channel/${channelId}`),
  start: (data) => api.post('/live/start', data),
  end: (id) => api.post(`/live/${id}/end`),
  update: (id, data) => api.put(`/live/${id}`, data),
  getViewers: (id) => api.get(`/live/${id}/viewers`),
};

// Translation APIs
export const translateAPI = {
  translate: (text, targetLang, sourceLang) =>
    api.post('/translate', { text, targetLang, sourceLang }),
  translateBatch: (texts, targetLang) =>
    api.post('/translate/batch', { texts, targetLang }),
  translateArticle: (article, targetLang) =>
    api.post('/translate/article', { article, targetLang }),
  detectLanguage: (text) =>
    api.post('/translate/detect', { text }),
  getStatus: (text, targetLang) =>
    api.get('/translate/status', { params: { text, targetLang } }),
};

// Location APIs
export const locationAPI = {
  getStates: () => api.get('/locations/states'),
  getDistricts: (stateId) => api.get(`/locations/${stateId}/districts`),
  getCities: (districtId) => api.get(`/locations/${districtId}/cities`),
  getAreas: (cityId) => api.get(`/locations/${cityId}/areas`),
};

// Notification APIs
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  getUnread: () => api.get('/notifications/unread'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  registerToken: (token) => api.post('/notifications/register', { token }),
};

// Search API
export const searchAPI = {
  search: (query, type = 'all') =>
    api.get(`/search?q=${query}&type=${type}`),
  getSuggestions: (query) =>
    api.get(`/search/suggestions?q=${query}`),
};

// File Upload API
export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadVideo: (file) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post('/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadMultiple: (files) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`file${index}`, file);
    });
    return api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default {
  auth: authAPI,
  user: userAPI,
  channel: channelAPI,
  article: articleAPI,
  video: videoAPI,
  live: liveAPI,
  translate: translateAPI,
  location: locationAPI,
  notification: notificationAPI,
  search: searchAPI,
  upload: uploadAPI,
};