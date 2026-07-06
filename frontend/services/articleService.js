// services/articleService.js
import { api } from './api';

// Article Service
export const articleService = {
  // Get all articles with filters
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/articles', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching articles:', error);
      throw error;
    }
  },

  // Get article by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/articles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching article:', error);
      throw error;
    }
  },

  // Get articles by channel
  getByChannel: async (channelId) => {
    try {
      console.log('📡 Fetching articles for channel:', channelId);
      const response = await api.get(`/articles/channel/${channelId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching channel articles:', error);
      throw error;
    }
  },

  // Get articles by category
  getByCategory: async (category) => {
    try {
      const response = await api.get(`/articles/category/${category}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching articles by category:', error);
      throw error;
    }
  },

  // Get trending articles
  getTrending: async () => {
    try {
      const response = await api.get('/articles/trending');
      return response.data;
    } catch (error) {
      console.error('Error fetching trending articles:', error);
      throw error;
    }
  },

  // Get latest articles
  getLatest: async () => {
    try {
      const response = await api.get('/articles/latest');
      return response.data;
    } catch (error) {
      console.error('Error fetching latest articles:', error);
      throw error;
    }
  },

  // ─── Get owner articles ─────────────────────────────────────────────────────
  getOwnerArticles: async (channelId) => {
    try {
      console.log('📡 [getOwnerArticles] Fetching articles for channel:', channelId);
      
      if (!channelId) {
        console.warn('⚠️ [getOwnerArticles] No channelId provided');
        return [];
      }

      const response = await api.get(`/articles/channel/${channelId}`);
      
      if (response.data && response.data.data) {
        if (response.data.data.articles) {
          return response.data.data.articles;
        }
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
      }
      
      if (response.data && response.data.articles) {
        return response.data.articles;
      }
      
      if (Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('❌ [getOwnerArticles] Error fetching owner articles:', error);
      return [];
    }
  },

  // ─── FIXED: Create article with image upload ───────────────────────────────
  create: async (articleData) => {
    try {
      console.log('📤 Creating article with data:', articleData);
      
      // Use FormData for image upload
      const formData = new FormData();
      
      // Add all text fields
      formData.append('title', articleData.title);
      formData.append('summary', articleData.summary);
      formData.append('body', articleData.body);
      formData.append('category', articleData.category);
      formData.append('language', articleData.language);
      formData.append('channelId', articleData.channelId);
      
      // Add image if present
      if (articleData.image && articleData.image.base64) {
        // For React Native, we need to create a file object
        const imageFile = {
          uri: articleData.image.uri || `data:image/jpeg;base64,${articleData.image.base64}`,
          name: articleData.image.name || `article-${Date.now()}.jpg`,
          type: articleData.image.type || 'image/jpeg',
        };
        formData.append('image', imageFile);
      }

      const response = await api.post('/articles', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Article created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating article:', error);
      throw error;
    }
  },

  // ─── Update article ─────────────────────────────────────────────────────────
  update: async (id, articleData) => {
    try {
      console.log('📤 Updating article:', id);
      
      const formData = new FormData();
      
      // Add all text fields
      if (articleData.title) formData.append('title', articleData.title);
      if (articleData.summary) formData.append('summary', articleData.summary);
      if (articleData.body) formData.append('body', articleData.body);
      if (articleData.category) formData.append('category', articleData.category);
      if (articleData.language) formData.append('language', articleData.language);
      if (articleData.isPublished !== undefined) formData.append('isPublished', String(articleData.isPublished));
      
      // Add image if present
      if (articleData.image && articleData.image.base64) {
        const imageFile = {
          uri: articleData.image.uri || `data:image/jpeg;base64,${articleData.image.base64}`,
          name: articleData.image.name || `article-${Date.now()}.jpg`,
          type: articleData.image.type || 'image/jpeg',
        };
        formData.append('image', imageFile);
      }

      const response = await api.put(`/articles/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Article updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating article:', error);
      throw error;
    }
  },

  // ─── Delete article ─────────────────────────────────────────────────────────
  delete: async (id) => {
    try {
      console.log('📤 Deleting article:', id);
      const response = await api.delete(`/articles/${id}`);
      console.log('✅ Article deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting article:', error);
      throw error;
    }
  },

  // Like article
  like: async (id) => {
    try {
      const response = await api.post(`/articles/${id}/like`);
      return response.data;
    } catch (error) {
      console.error('Error liking article:', error);
      throw error;
    }
  },

  // Unlike article
  unlike: async (id) => {
    try {
      const response = await api.delete(`/articles/${id}/like`);
      return response.data;
    } catch (error) {
      console.error('Error unliking article:', error);
      throw error;
    }
  },

  // Add comment
  comment: async (id, commentData) => {
    try {
      const response = await api.post(`/articles/${id}/comments`, commentData);
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Get comments
  getComments: async (id) => {
    try {
      const response = await api.get(`/articles/${id}/comments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  // Search articles
  search: async (query) => {
    try {
      const response = await api.get(`/articles/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching articles:', error);
      throw error;
    }
  },
};

// ─── Export individual functions ────────────────────────────────────────────
export const {
  getAll: getArticles,
  getById: getArticleById,
  getByChannel: getChannelArticles,
  getByCategory: getArticlesByCategory,
  getTrending: getTrendingArticles,
  getLatest: getLatestArticles,
  getOwnerArticles,
  create: createArticle,
  update: updateArticle,
  delete: deleteArticle,
  like: likeArticle,
  unlike: unlikeArticle,
  comment: commentOnArticle,
  getComments: getArticleComments,
  search: searchArticles,
} = articleService;

export default articleService;