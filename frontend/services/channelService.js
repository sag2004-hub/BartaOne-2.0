// services/channelService.js
import { channelAPI } from './api';

// Export individual functions
export const getChannelByOwner = async () => {
  try {
    console.log('📡 Fetching channel by owner...');
    const response = await channelAPI.getByOwner(); // must call GET /channels/owner/my-channel
    console.log('📡 Channel response status:', response.status);
    console.log('📡 Channel response data:', response.data);
    
    // Handle different response structures
    if (response.data?.data) {
      return response.data.data;
    }
    if (response.data?.channel) {
      return response.data.channel;
    }
    return response.data || null;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('📡 No channel found for this owner (404)');
      return null;
    }
    console.error('❌ Error fetching channel by owner:', error);
    throw error;
  }
};

export const getChannelStats = async (channelId) => {
  try {
    console.log('📡 Fetching channel stats for:', channelId);
    const response = await channelAPI.getStats(channelId);
    console.log('📡 Stats response:', response.data);
    
    // Handle different response structures
    if (response.data?.data) {
      return response.data.data;
    }
    if (response.data?.stats) {
      return response.data.stats;
    }
    return response.data || {
      articles: 0,
      videos: 0,
      live: 0,
      followers: 0,
      views: 0,
    };
  } catch (error) {
    console.error('❌ Error fetching channel stats:', error);
    return {
      articles: 0,
      videos: 0,
      live: 0,
      followers: 0,
      views: 0,
    };
  }
};

// Full channel service object
export const channelService = {
  getAll: async (params = {}) => {
    try {
      const response = await channelAPI.getAll(params);
      return response.data;
    } catch (error) {
      console.error('Error fetching channels:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await channelAPI.getById(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching channel:', error);
      throw error;
    }
  },

  getByOwner: getChannelByOwner,

  create: async (data) => {
    try {
      // Always plain JSON — multipart corrupts JWT in Authorization header
      const response = await channelAPI.create(data);
      return response.data;
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
      const response = await channelAPI.update(
        id,
        data,
        isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}
      );
      return response.data;
    } catch (error) {
      console.error('Error updating channel:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await channelAPI.delete(id);
      return response.data;
    } catch (error) {
      console.error('Error deleting channel:', error);
      throw error;
    }
  },

  subscribe: async (id) => {
    try {
      const response = await channelAPI.subscribe(id);
      return response.data;
    } catch (error) {
      console.error('Error subscribing to channel:', error);
      throw error;
    }
  },

  unsubscribe: async (id) => {
    try {
      const response = await channelAPI.unsubscribe(id);
      return response.data;
    } catch (error) {
      console.error('Error unsubscribing from channel:', error);
      throw error;
    }
  },

  getSubscribers: async () => {
    try {
      const response = await channelAPI.getSubscribers();
      return response.data;
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      throw error;
    }
  },

  getStats: getChannelStats,

  search: async (query) => {
    try {
      const response = await channelAPI.search(query);
      return response.data;
    } catch (error) {
      console.error('Error searching channels:', error);
      throw error;
    }
  },
};

export default channelService;