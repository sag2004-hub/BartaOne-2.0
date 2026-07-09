// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';
import { auth } from './firebase';
import { Platform } from 'react-native';

// ─── Determine Base URL ──────────────────────────────────────────────────────
const getBaseURL = () => {
  if (API_URL) {
    console.log('🔗 Using API_URL from env:', API_URL);
    return API_URL;
  }

  if (__DEV__) {
    const DEV_IP = '192.168.29.16';
    const PORT = '5000';
    
    if (Platform.OS === 'android') {
      return `http://10.0.2.2:${PORT}/api`;
    }
    return `http://${DEV_IP}:${PORT}/api`;
  }

  return 'https://your-production-url.com/api';
};

const BASE_URL = getBaseURL();
console.log('🌐 [api.js] Base URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 120000,
});

// ─── Request Interceptor ────────────────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    try {
      console.log(`📤 ${config.method?.toUpperCase() || 'GET'} ${config.url}`);
      
      let token = null;

      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
        await AsyncStorage.setItem('authToken', token);
        console.log('🔑 [api.js] token from Firebase currentUser ✅');
      } else {
        token = await AsyncStorage.getItem('authToken');
        console.log('🔑 [api.js] token from AsyncStorage:', token ? 'EXISTS ✅' : 'NULL ❌');
      }

      console.log('🌐 [api.js] Full URL:', config.baseURL + config.url);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('⚠️ [api.js] No token available for request');
      }
      
      // ─── IMPORTANT: Don't override Content-Type for FormData ──────────────
      // If the config already has a Content-Type header, keep it
      // For FormData, axios will set the correct Content-Type with boundary
      if (!config.headers['Content-Type'] && !config.headers['content-type']) {
        config.headers['Content-Type'] = 'application/json';
      }
      
      return config;
    } catch (error) {
      console.error('❌ Error adding auth token:', error);
      return config;
    }
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ─── Response Interceptor ───────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    if (error.response) {
      console.error(`❌ [api.js] API Error ${error.response.status}:`, {
        url: error.config?.url,
        data: error.response.data,
        headers: error.response.headers,
      });

      const { status, data } = error.response;

      if (status === 401) {
        await AsyncStorage.removeItem('authToken');
        console.log('🔑 [api.js] Token removed due to 401');
      }

      const apiError = new Error(data?.message || 'An error occurred');
      apiError.status = status;
      apiError.data = data;
      return Promise.reject(apiError);
    } 
    else if (error.request) {
      console.error('❌ [api.js] No response received. Server may be unreachable.');
      console.error('   URL:', error.config?.baseURL + error.config?.url);
      console.error('   Method:', error.config?.method);
      console.error('   Timeout:', error.config?.timeout);
      
      const networkError = new Error('Network error. Please check your connection.');
      networkError.status = 0;
      networkError.details = {
        url: error.config?.baseURL + error.config?.url,
        method: error.config?.method,
      };
      return Promise.reject(networkError);
    } 
    else {
      console.error('❌ [api.js] Unexpected error:', error.message);
      return Promise.reject(error);
    }
  }
);

// ─── Export ──────────────────────────────────────────────────────────────────
export { api };

// ─── API Methods ──────────────────────────────────────────────────────────────

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
// services/api.js - Channel APIs section

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
  search: (query) => api.get(`/channels/search?q=${query}`),
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

// ─── Live Service Functions ──────────────────────────────────────────────────
export const startLiveStream = async (data) => {
  try {
    console.log('📡 Starting live stream...', data);
    const response = await liveAPI.start(data);
    console.log('✅ Live stream started:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error starting live stream:', error);
    throw error;
  }
};

export const scheduleLiveStream = async (data) => {
  try {
    console.log('📡 Scheduling live stream...', data);
    const response = await api.post('/live/schedule', data);
    console.log('✅ Live stream scheduled:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error scheduling live stream:', error);
    throw error;
  }
};

export const endLiveStream = async (streamId) => {
  try {
    console.log('📡 Ending live stream...', streamId);
    const response = await liveAPI.end(streamId);
    console.log('✅ Live stream ended:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error ending live stream:', error);
    throw error;
  }
};

// ─── Default Export ──────────────────────────────────────────────────────────
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