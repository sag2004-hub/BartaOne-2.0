import api from './api';

const newspaperService = {
  // Get all newspapers with filters
  getNewspapers: async (filters = {}) => {
    try {
      const response = await api.get('/newspapers', { params: filters });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error in getNewspapers:', error);
      throw error;
    }
  },

  // Get single newspaper by ID
  getNewspaperById: async (id) => {
    try {
      const response = await api.get(`/newspapers/${id}`);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error in getNewspaperById:', error);
      throw error;
    }
  },

  // Create a new newspaper
  createNewspaper: async (data) => {
    try {
      const response = await api.post('/newspapers', data);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error in createNewspaper:', error);
      throw error;
    }
  },

  // Get newspapers for current user's channel
  getUserNewspapers: async () => {
    try {
      const response = await api.get('/newspapers/user');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error in getUserNewspapers:', error);
      throw error;
    }
  },

  // Delete a newspaper
  deleteNewspaper: async (id) => {
    try {
      const response = await api.delete(`/newspapers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error in deleteNewspaper:', error);
      throw error;
    }
  },

  // Get active newspapers (not expired)
  getActiveNewspapers: async () => {
    try {
      const response = await api.get('/newspapers/active');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error in getActiveNewspapers:', error);
      throw error;
    }
  },

  // ✅ NEW: Get newspaper stats for a channel
  getNewspaperStats: async (channelId) => {
    try {
      const response = await api.get(`/newspapers/stats/${channelId}`);
      return response.data?.data || { total: 0, active: 0, expired: 0, today: 0 };
    } catch (error) {
      console.error('Error in getNewspaperStats:', error);
      return { total: 0, active: 0, expired: 0, today: 0 };
    }
  },
};

export default newspaperService;