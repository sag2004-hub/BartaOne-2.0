import api from './api';

// Article Service
export const articleService = {
  // Get all articles with filters
  getAll: async (params = {}) => {
    try {
      const response = await api.article.getAll(params);
      return response.data;
    } catch (error) {
      console.error('Error fetching articles:', error);
      throw error;
    }
  },

  // Get article by ID
  getById: async (id) => {
    try {
      const response = await api.article.getById(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching article:', error);
      throw error;
    }
  },

  // Get articles by channel
  getByChannel: async (channelId) => {
    try {
      const response = await api.article.getByChannel(channelId);
      return response.data;
    } catch (error) {
      console.error('Error fetching channel articles:', error);
      throw error;
    }
  },

  // Get articles by category
  getByCategory: async (category) => {
    try {
      const response = await api.article.getByCategory(category);
      return response.data;
    } catch (error) {
      console.error('Error fetching articles by category:', error);
      throw error;
    }
  },

  // Get trending articles
  getTrending: async () => {
    try {
      const response = await api.article.getTrending();
      return response.data;
    } catch (error) {
      console.error('Error fetching trending articles:', error);
      throw error;
    }
  },

  // Get latest articles
  getLatest: async (limit = 10) => {
    try {
      const response = await api.article.getLatest();
      return response.data.slice(0, limit);
    } catch (error) {
      console.error('Error fetching latest articles:', error);
      throw error;
    }
  },

  // Create article
  create: async (articleData) => {
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.keys(articleData).forEach(key => {
        if (key !== 'image') {
          formData.append(key, articleData[key]);
        }
      });

      // Add image if exists
      if (articleData.image) {
        const imageData = {
          uri: articleData.image.uri,
          type: articleData.image.type || 'image/jpeg',
          name: articleData.image.fileName || 'image.jpg',
        };
        formData.append('image', imageData);
      }

      const response = await api.article.create(formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating article:', error);
      throw error;
    }
  },

  // Update article
  update: async (id, articleData) => {
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.keys(articleData).forEach(key => {
        if (key !== 'image') {
          formData.append(key, articleData[key]);
        }
      });

      // Add image if exists
      if (articleData.image) {
        const imageData = {
          uri: articleData.image.uri,
          type: articleData.image.type || 'image/jpeg',
          name: articleData.image.fileName || 'image.jpg',
        };
        formData.append('image', imageData);
      }

      const response = await api.article.update(id, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating article:', error);
      throw error;
    }
  },

  // Delete article
  delete: async (id) => {
    try {
      const response = await api.article.delete(id);
      return response.data;
    } catch (error) {
      console.error('Error deleting article:', error);
      throw error;
    }
  },

  // Like article
  like: async (id) => {
    try {
      const response = await api.article.like(id);
      return response.data;
    } catch (error) {
      console.error('Error liking article:', error);
      throw error;
    }
  },

  // Unlike article
  unlike: async (id) => {
    try {
      const response = await api.article.unlike(id);
      return response.data;
    } catch (error) {
      console.error('Error unliking article:', error);
      throw error;
    }
  },

  // Add comment
  comment: async (id, commentData) => {
    try {
      const response = await api.article.comment(id, commentData);
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Get comments
  getComments: async (id) => {
    try {
      const response = await api.article.getComments(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  // Search articles
  search: async (query) => {
    try {
      const response = await api.article.search(query);
      return response.data;
    } catch (error) {
      console.error('Error searching articles:', error);
      throw error;
    }
  },
};

// Export individual functions for convenience
export const {
  getAll: getArticles,
  getById: getArticleById,
  getByChannel: getChannelArticles,
  getByCategory: getArticlesByCategory,
  getTrending: getTrendingArticles,
  getLatest: getLatestArticles,
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