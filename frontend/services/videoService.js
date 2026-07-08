// services/videoService.js
import { api } from './api';

// Video Service
export const videoService = {
  // Get all videos
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/videos', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching videos:', error);
      throw error;
    }
  },

  // Get video by ID
  getById: async (id) => {
    try {
      console.log('📡 Fetching video by ID:', id);
      const response = await api.get(`/videos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching video:', error);
      throw error;
    }
  },

  // Get videos by channel
  getByChannel: async (channelId) => {
    try {
      console.log('📡 Fetching videos for channel:', channelId);
      const response = await api.get(`/videos/channel/${channelId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching channel videos:', error);
      throw error;
    }
  },

  // Get videos by category
  getByCategory: async (category) => {
    try {
      const response = await api.get(`/videos/category/${category}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching videos by category:', error);
      throw error;
    }
  },

  // ─── Get owner videos ──────────────────────────────────────────────────────
  getOwnerVideos: async (channelId) => {
    try {
      console.log('📡 [getOwnerVideos] Fetching videos for channel:', channelId);
      
      if (!channelId) {
        console.warn('⚠️ [getOwnerVideos] No channelId provided');
        return [];
      }

      const response = await api.get(`/videos/channel/${channelId}`);
      
      if (response.data && response.data.data) {
        if (response.data.data.videos) {
          return response.data.data.videos;
        }
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
      }
      
      if (response.data && response.data.videos) {
        return response.data.videos;
      }
      
      if (Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('❌ [getOwnerVideos] Error fetching owner videos:', error);
      return [];
    }
  },

  // ─── CREATE VIDEO ──────────────────────────────────────────────────────────
  create: async (videoData) => {
    try {
      console.log('📤 Creating video with data:', videoData);
      
      // If videoData is already FormData, use it directly
      let formData = videoData;
      
      // If not FormData, create FormData from the object
      if (!(videoData instanceof FormData)) {
        formData = new FormData();
        Object.keys(videoData).forEach(key => {
          formData.append(key, videoData[key]);
        });
      }
      
      const response = await api.post('/videos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Video created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating video:', error);
      throw error;
    }
  },

  // ─── UPDATE VIDEO ──────────────────────────────────────────────────────────
  update: async (id, videoData) => {
    try {
      console.log('📤 Updating video:', id);
      
      let formData = videoData;
      
      if (!(videoData instanceof FormData)) {
        formData = new FormData();
        Object.keys(videoData).forEach(key => {
          formData.append(key, videoData[key]);
        });
      }
      
      const response = await api.put(`/videos/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Video updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating video:', error);
      throw error;
    }
  },

  // ─── DELETE VIDEO ──────────────────────────────────────────────────────────
  delete: async (id) => {
    try {
      console.log('📤 Deleting video:', id);
      const response = await api.delete(`/videos/${id}`);
      console.log('✅ Video deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting video:', error);
      throw error;
    }
  },

  // Like video
  like: async (id) => {
    try {
      const response = await api.post(`/videos/${id}/like`);
      return response.data;
    } catch (error) {
      console.error('Error liking video:', error);
      throw error;
    }
  },

  // Unlike video
  unlike: async (id) => {
    try {
      const response = await api.delete(`/videos/${id}/like`);
      return response.data;
    } catch (error) {
      console.error('Error unliking video:', error);
      throw error;
    }
  },

  // Add comment
  comment: async (id, commentData) => {
    try {
      const response = await api.post(`/videos/${id}/comments`, commentData);
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Get comments
  getComments: async (id) => {
    try {
      const response = await api.get(`/videos/${id}/comments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },
};

// ─── Export individual functions ────────────────────────────────────────────
export const {
  getAll: getVideos,
  getById: getVideoById,
  getByChannel: getChannelVideos,
  getByCategory: getVideosByCategory,
  getOwnerVideos,
  create: createVideo,
  update: updateVideo,
  delete: deleteVideo,
  like: likeVideo,
  unlike: unlikeVideo,
  comment: commentOnVideo,
  getComments: getVideoComments,
} = videoService;

export default videoService;