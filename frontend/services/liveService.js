// frontend/services/liveService.js
import { api } from './api';

// Live Service
export const liveService = {
  // Get all live streams
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/live', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching live streams:', error);
      throw error;
    }
  },

  // Get live stream by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/live/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching live stream:', error);
      throw error;
    }
  },

  // Get live streams by channel
  getByChannel: async (channelId) => {
    try {
      const response = await api.get(`/live/channel/${channelId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching channel live streams:', error);
      throw error;
    }
  },

  // Start live stream
  start: async (liveData) => {
    try {
      const response = await api.post('/live/start', liveData);
      return response.data;
    } catch (error) {
      console.error('Error starting live stream:', error);
      throw error;
    }
  },

  // Schedule live stream
  schedule: async (liveData) => {
    try {
      const response = await api.post('/live/schedule', liveData);
      return response.data;
    } catch (error) {
      console.error('Error scheduling live stream:', error);
      throw error;
    }
  },

  // End live stream
  end: async (id) => {
    try {
      const response = await api.post(`/live/${id}/end`);
      return response.data;
    } catch (error) {
      console.error('Error ending live stream:', error);
      throw error;
    }
  },

  // Update live stream
  update: async (id, liveData) => {
    try {
      const response = await api.put(`/live/${id}`, liveData);
      return response.data;
    } catch (error) {
      console.error('Error updating live stream:', error);
      throw error;
    }
  },

  // Get viewer count
  getViewers: async (id) => {
    try {
      const response = await api.get(`/live/${id}/viewers`);
      return response.data;
    } catch (error) {
      console.error('Error fetching viewers:', error);
      throw error;
    }
  },

  // Get active live streams
  getActive: async () => {
    try {
      const response = await api.get('/live', { params: { status: 'live' } });
      return response.data;
    } catch (error) {
      console.error('Error fetching active live streams:', error);
      throw error;
    }
  },

  // Upload thumbnail
  uploadThumbnail: async (data) => {
    try {
      const response = await api.post('/live/upload/thumbnail', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      throw error;
    }
  },
};

// Export individual functions for convenience
export const {
  getAll: getLiveStreams,
  getById: getLiveStreamById,
  getByChannel: getChannelLiveStreams,
  start: startLiveStream,
  schedule: scheduleLiveStream,
  end: endLiveStream,
  update: updateLiveStream,
  getViewers: getLiveViewers,
  getActive: getActiveLiveStreams,
  uploadThumbnail,
} = liveService;

export default liveService;