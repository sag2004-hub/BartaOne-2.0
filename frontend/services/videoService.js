// services/videoService.js
import { api } from './api'; // ← Using named import

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
      console.log('📡 Full response:', JSON.stringify(response.data, null, 2));
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

  // ─── FIXED: Get owner videos ──────────────────────────────────────────────
  getOwnerVideos: async (channelId) => {
    try {
      console.log('📡 [getOwnerVideos] Fetching videos for channel:', channelId);
      
      if (!channelId) {
        console.warn('⚠️ [getOwnerVideos] No channelId provided');
        return [];
      }

      const response = await api.get(`/videos/channel/${channelId}`);
      console.log('📡 [getOwnerVideos] Response status:', response.status);
      console.log('📡 [getOwnerVideos] Response data:', JSON.stringify(response.data, null, 2));

      // The API returns { success, message, data: { videos: [...], total, page, pages } }
      if (response.data && response.data.data) {
        if (response.data.data.videos) {
          const videos = response.data.data.videos;
          console.log(`✅ [getOwnerVideos] Found ${videos.length} videos`);
          return videos;
        }
        if (Array.isArray(response.data.data)) {
          console.log(`✅ [getOwnerVideos] Found ${response.data.data.length} videos (data is array)`);
          return response.data.data;
        }
      }
      
      if (response.data && response.data.videos) {
        const videos = response.data.videos;
        console.log(`✅ [getOwnerVideos] Found ${videos.length} videos in data.videos`);
        return videos;
      }
      
      if (Array.isArray(response.data)) {
        console.log(`✅ [getOwnerVideos] Found ${response.data.length} videos (response is array)`);
        return response.data;
      }

      console.warn('⚠️ [getOwnerVideos] No videos found in response');
      return [];
    } catch (error) {
      console.error('❌ [getOwnerVideos] Error fetching owner videos:', error);
      return [];
    }
  },

  // Create video
  create: async (videoData) => {
    try {
      console.log('📤 Creating video with data:', videoData);
      const response = await api.post('/videos', videoData);
      console.log('✅ Video created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating video:', error);
      throw error;
    }
  },

  // Update video
  update: async (id, videoData) => {
    try {
      console.log('📤 Updating video:', id);
      const response = await api.put(`/videos/${id}`, videoData);
      console.log('✅ Video updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating video:', error);
      throw error;
    }
  },

  // Delete video
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