// frontend/services/channelService.js

import api, { newspaperAPI } from './api';

// ─── Channel APIs ────────────────────────────────────────────────────────────

export const getChannelByOwner = async () => {
  try {
    console.log('📡 Fetching channel by owner...');
    const response = await api.get('/channels/owner');
    console.log('📡 Channel response status:', response.status);
    
    if (response.data?.success && response.data?.data) {
      console.log('✅ Channel found:', response.data.data.channelName || response.data.data._id);
      return response.data.data;
    }
    console.log('⚠️ No channel found');
    return null;
  } catch (error) {
    console.error('❌ Error fetching channel by owner:', error);
    throw error;
  }
};

export const getChannelStats = async (channelId) => {
  try {
    console.log('📡 Fetching channel stats for:', channelId);
    
    // Get existing stats (articles, videos, followers)
    const response = await api.get(`/channels/${channelId}/stats`);
    const stats = response.data?.data || {};
    console.log('📊 Base stats:', stats);
    
    // ✅ Get newspaper count - use direct API call
    let newspaperCount = 0;
    try {
      console.log('📤 Calling newspaper stats API...');
      const newspaperResponse = await api.get(`/newspapers/stats/${channelId}`);
      console.log('📊 Newspaper API response:', JSON.stringify(newspaperResponse.data, null, 2));
      
      // Extract the active count
      if (newspaperResponse.data?.success && newspaperResponse.data?.data) {
        newspaperCount = newspaperResponse.data.data.active || 0;
      }
      console.log('📊 Newspaper count:', newspaperCount);
    } catch (err) {
      console.warn('⚠️ Newspaper stats not available:', err.message);
    }
    
    // Combine stats
    const combinedStats = {
      articles: stats.articles || 0,
      videos: stats.videos || 0,
      newspapers: newspaperCount || 0,
      followers: stats.followers || 0,
    };
    
    console.log('📊 Combined stats:', combinedStats);
    return combinedStats;
  } catch (error) {
    console.error('❌ Error fetching channel stats:', error);
    // Return default stats if error
    return { 
      articles: 0, 
      videos: 0, 
      newspapers: 0, 
      followers: 0 
    };
  }
};

// ─── Get Subscribers ────────────────────────────────────────────────────────
// Backend route: GET /channels/subscribers/list
export const getSubscribers = async () => {
  try {
    console.log('📡 Fetching subscribers list...');
    const response = await api.get('/channels/subscribers/list');
    
    if (response.data?.success && response.data?.data) {
      console.log(`✅ Found ${response.data.data.length || 0} subscribers`);
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('❌ Error fetching subscribers:', error);
    return [];
  }
};

// ─── Get Subscribers count only ────────────────────────────────────────────
export const getSubscribersCount = async () => {
  try {
    console.log('📡 Fetching subscribers count...');
    const response = await api.get('/channels/subscribers/list');
    
    if (response.data?.success && response.data?.data) {
      return response.data.data.length || 0;
    }
    return 0;
  } catch (error) {
    console.error('❌ Error fetching subscribers count:', error);
    return 0;
  }
};

// Full channel service object
export const channelService = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/channels', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching channels:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/channels/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching channel:', error);
      throw error;
    }
  },

  getByOwner: getChannelByOwner,

  create: async (data) => {
    try {
      console.log('📤 Creating channel with data:', JSON.stringify(data, null, 2));
      
      const payload = {
        channelName: data.channelName,
        description: data.description,
        language: data.language || 'en',
        category: data.category || 'news',
        location: {
          state: data.location?.state || data.state || '',
          district: data.location?.district || data.district || '',
          city: data.location?.city || data.city || '',
          area: data.location?.area || data.area || '',
        },
      };
      
      console.log('📤 Final payload:', JSON.stringify(payload, null, 2));
      
      const response = await api.post('/channels', payload);
      console.log('✅ Channel created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating channel:', error);
      throw error;
    }
  },

  update: async (id, data, config = {}) => {
    try {
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
      const response = await api.put(
        `/channels/${id}`,
        data,
        isFormData ? { headers: { 'Content-Type': 'multipart/form-data' }, ...config } : config
      );
      return response.data;
    } catch (error) {
      console.error('Error updating channel:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/channels/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting channel:', error);
      throw error;
    }
  },

  subscribe: async (id) => {
    try {
      const response = await api.post(`/channels/${id}/subscribe`);
      return response.data;
    } catch (error) {
      console.error('Error subscribing to channel:', error);
      throw error;
    }
  },

  unsubscribe: async (id) => {
    try {
      const response = await api.delete(`/channels/${id}/subscribe`);
      return response.data;
    } catch (error) {
      console.error('Error unsubscribing from channel:', error);
      throw error;
    }
  },

  // Updated: Backend route is /channels/subscribers/list
  getSubscribers: async () => {
    return getSubscribers();
  },

  // Get subscribers count
  getSubscribersCount: async () => {
    return getSubscribersCount();
  },

  getStats: getChannelStats,

  search: async (query) => {
    try {
      const response = await api.get(`/channels/search?q=${query}`);
      return response.data;
    } catch (error) {
      console.error('Error searching channels:', error);
      throw error;
    }
  },
};

// ─── Exports ────────────────────────────────────────────────────────────────
export default channelService;