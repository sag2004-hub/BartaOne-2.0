// services/videoService.js
import api from './api';

// Video Service
export const videoService = {
  // Get all videos with filters
  getAll: async (params = {}) => {
    try {
      const response = await api.video.getAll(params);
      return response.data;
    } catch (error) {
      console.error('Error fetching videos:', error);
      throw error;
    }
  },

  // Get video by ID
  getById: async (id) => {
    try {
      const response = await api.video.getById(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching video:', error);
      throw error;
    }
  },

  // Get videos by channel
  getByChannel: async (channelId) => {
    try {
      const response = await api.video.getByChannel(channelId);
      return response.data;
    } catch (error) {
      console.error('Error fetching channel videos:', error);
      throw error;
    }
  },

  // Get videos by category
  getByCategory: async (category) => {
    try {
      const response = await api.video.getByCategory(category);
      return response.data;
    } catch (error) {
      console.error('Error fetching videos by category:', error);
      throw error;
    }
  },

  // Get videos by owner (channel) - ADD THIS FUNCTION
  getOwnerVideos: async (channelId) => {
    try {
      // Use getByChannel which fetches videos by channel ID
      const response = await api.video.getByChannel(channelId);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching owner videos:', error);
      return [];
    }
  },

  // Upload video
  upload: async (videoData) => {
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.keys(videoData).forEach(key => {
        if (key !== 'video' && key !== 'thumbnail') {
          formData.append(key, videoData[key]);
        }
      });

      // Add video file
      if (videoData.video) {
        const videoFile = {
          uri: videoData.video.uri,
          type: videoData.video.type || 'video/mp4',
          name: videoData.video.fileName || 'video.mp4',
        };
        formData.append('video', videoFile);
      }

      // Add thumbnail if exists
      if (videoData.thumbnail) {
        const thumbnailData = {
          uri: videoData.thumbnail.uri,
          type: videoData.thumbnail.type || 'image/jpeg',
          name: videoData.thumbnail.fileName || 'thumbnail.jpg',
        };
        formData.append('thumbnail', thumbnailData);
      }

      const response = await api.video.create(formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  },

  // Update video
  update: async (id, videoData) => {
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.keys(videoData).forEach(key => {
        if (key !== 'video' && key !== 'thumbnail') {
          formData.append(key, videoData[key]);
        }
      });

      // Add thumbnail if exists
      if (videoData.thumbnail) {
        const thumbnailData = {
          uri: videoData.thumbnail.uri,
          type: videoData.thumbnail.type || 'image/jpeg',
          name: videoData.thumbnail.fileName || 'thumbnail.jpg',
        };
        formData.append('thumbnail', thumbnailData);
      }

      const response = await api.video.update(id, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating video:', error);
      throw error;
    }
  },

  // Delete video
  delete: async (id) => {
    try {
      const response = await api.video.delete(id);
      return response.data;
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  },

  // Like video
  like: async (id) => {
    try {
      const response = await api.video.like(id);
      return response.data;
    } catch (error) {
      console.error('Error liking video:', error);
      throw error;
    }
  },

  // Unlike video
  unlike: async (id) => {
    try {
      const response = await api.video.unlike(id);
      return response.data;
    } catch (error) {
      console.error('Error unliking video:', error);
      throw error;
    }
  },

  // Add comment
  comment: async (id, commentData) => {
    try {
      const response = await api.video.comment(id, commentData);
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Get comments
  getComments: async (id) => {
    try {
      const response = await api.video.getComments(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  // Get trending videos
  getTrending: async () => {
    try {
      const response = await api.video.getAll({ sort: 'views', limit: 10 });
      return response.data;
    } catch (error) {
      console.error('Error fetching trending videos:', error);
      throw error;
    }
  },
};

// Export individual functions for convenience
export const {
  getAll: getVideos,
  getById: getVideoById,
  getByChannel: getChannelVideos,
  getByCategory: getVideosByCategory,
  getOwnerVideos, // ADD THIS EXPORT
  upload: uploadVideo,
  update: updateVideo,
  delete: deleteVideo,
  like: likeVideo,
  unlike: unlikeVideo,
  comment: commentOnVideo,
  getComments: getVideoComments,
  getTrending: getTrendingVideos,
} = videoService;

export default videoService;