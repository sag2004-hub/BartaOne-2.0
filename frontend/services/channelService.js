import api from './api';

// Channel Service
export const channelService = {
  // Get all channels with filters
  getAll: async (params = {}) => {
    try {
      const response = await api.channel.getAll(params);
      return response.data;
    } catch (error) {
      console.error('Error fetching channels:', error);
      throw error;
    }
  },

  // Get channel by ID
  getById: async (id) => {
    try {
      const response = await api.channel.getById(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching channel:', error);
      throw error;
    }
  },

  // Get channel by owner
  getByOwner: async () => {
    try {
      const response = await api.channel.getByOwner();
      return response.data;
    } catch (error) {
      console.error('Error fetching owner channel:', error);
      throw error;
    }
  },

  // Create channel
  create: async (channelData) => {
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.keys(channelData).forEach(key => {
        if (key !== 'logo' && key !== 'banner') {
          formData.append(key, channelData[key]);
        }
      });

      // Add logo if exists
      if (channelData.logo) {
        const logoData = {
          uri: channelData.logo.uri,
          type: channelData.logo.type || 'image/jpeg',
          name: channelData.logo.fileName || 'logo.jpg',
        };
        formData.append('logo', logoData);
      }

      // Add banner if exists
      if (channelData.banner) {
        const bannerData = {
          uri: channelData.banner.uri,
          type: channelData.banner.type || 'image/jpeg',
          name: channelData.banner.fileName || 'banner.jpg',
        };
        formData.append('banner', bannerData);
      }

      const response = await api.channel.create(formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  },

  // Update channel
  update: async (id, channelData) => {
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.keys(channelData).forEach(key => {
        if (key !== 'logo' && key !== 'banner') {
          formData.append(key, channelData[key]);
        }
      });

      // Add logo if exists
      if (channelData.logo) {
        const logoData = {
          uri: channelData.logo.uri,
          type: channelData.logo.type || 'image/jpeg',
          name: channelData.logo.fileName || 'logo.jpg',
        };
        formData.append('logo', logoData);
      }

      // Add banner if exists
      if (channelData.banner) {
        const bannerData = {
          uri: channelData.banner.uri,
          type: channelData.banner.type || 'image/jpeg',
          name: channelData.banner.fileName || 'banner.jpg',
        };
        formData.append('banner', bannerData);
      }

      const response = await api.channel.update(id, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating channel:', error);
      throw error;
    }
  },

  // Delete channel
  delete: async (id) => {
    try {
      const response = await api.channel.delete(id);
      return response.data;
    } catch (error) {
      console.error('Error deleting channel:', error);
      throw error;
    }
  },

  // Subscribe to channel
  subscribe: async (id) => {
    try {
      const response = await api.channel.subscribe(id);
      return response.data;
    } catch (error) {
      console.error('Error subscribing to channel:', error);
      throw error;
    }
  },

  // Unsubscribe from channel
  unsubscribe: async (id) => {
    try {
      const response = await api.channel.unsubscribe(id);
      return response.data;
    } catch (error) {
      console.error('Error unsubscribing from channel:', error);
      throw error;
    }
  },

  // Get subscribers
  getSubscribers: async () => {
    try {
      const response = await api.channel.getSubscribers();
      return response.data;
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      throw error;
    }
  },

  // Get channel stats
  getStats: async (id) => {
    try {
      const response = await api.channel.getStats(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching channel stats:', error);
      throw error;
    }
  },

  // Get nearby channels
  getNearby: async (latitude, longitude, radius = 10) => {
    try {
      const response = await api.channel.getAll({
        latitude,
        longitude,
        radius,
        nearby: true,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching nearby channels:', error);
      throw error;
    }
  },
};

// Export individual functions for convenience
export const {
  getAll: getChannels,
  getById: getChannelById,
  getByOwner: getOwnerChannel,
  create: createChannel,
  update: updateChannel,
  delete: deleteChannel,
  subscribe: subscribeChannel,
  unsubscribe: unsubscribeChannel,
  getSubscribers: getChannelSubscribers,
  getStats: getChannelStats,
  getNearby: getNearbyChannels,
} = channelService;

export default channelService;