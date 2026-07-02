import api from './api';

// Live Service
export const liveService = {
  // Get all live streams
  getAll: async (params = {}) => {
    try {
      const response = await api.live.getAll(params);
      return response.data;
    } catch (error) {
      console.error('Error fetching live streams:', error);
      throw error;
    }
  },

  // Get live stream by ID
  getById: async (id) => {
    try {
      const response = await api.live.getById(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching live stream:', error);
      throw error;
    }
  },

  // Get live streams by channel
  getByChannel: async (channelId) => {
    try {
      const response = await api.live.getByChannel(channelId);
      return response.data;
    } catch (error) {
      console.error('Error fetching channel live streams:', error);
      throw error;
    }
  },

  // Start live stream
  start: async (liveData) => {
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.keys(liveData).forEach(key => {
        if (key !== 'thumbnail') {
          formData.append(key, liveData[key]);
        }
      });

      // Add thumbnail if exists
      if (liveData.thumbnail) {
        const thumbnailData = {
          uri: liveData.thumbnail.uri,
          type: liveData.thumbnail.type || 'image/jpeg',
          name: liveData.thumbnail.fileName || 'thumbnail.jpg',
        };
        formData.append('thumbnail', thumbnailData);
      }

      const response = await api.live.start(formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error starting live stream:', error);
      throw error;
    }
  },

  // End live stream
  end: async (id) => {
    try {
      const response = await api.live.end(id);
      return response.data;
    } catch (error) {
      console.error('Error ending live stream:', error);
      throw error;
    }
  },

  // Update live stream
  update: async (id, liveData) => {
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.keys(liveData).forEach(key => {
        if (key !== 'thumbnail') {
          formData.append(key, liveData[key]);
        }
      });

      // Add thumbnail if exists
      if (liveData.thumbnail) {
        const thumbnailData = {
          uri: liveData.thumbnail.uri,
          type: liveData.thumbnail.type || 'image/jpeg',
          name: liveData.thumbnail.fileName || 'thumbnail.jpg',
        };
        formData.append('thumbnail', thumbnailData);
      }

      const response = await api.live.update(id, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating live stream:', error);
      throw error;
    }
  },

  // Get viewer count
  getViewers: async (id) => {
    try {
      const response = await api.live.getViewers(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching viewers:', error);
      throw error;
    }
  },

  // Get active live streams
  getActive: async () => {
    try {
      const response = await api.live.getAll({ isLive: true });
      return response.data;
    } catch (error) {
      console.error('Error fetching active live streams:', error);
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
  end: endLiveStream,
  update: updateLiveStream,
  getViewers: getLiveViewers,
  getActive: getActiveLiveStreams,
} = liveService;

export default liveService;