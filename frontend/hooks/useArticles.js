// hooks/useArticles.js
import { useState, useCallback } from 'react';
import { articleAPI } from '../services/api';

export function useArticles(initialParams = {}) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [params, setParams] = useState(initialParams);

  const fetchArticles = useCallback(async (newParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const mergedParams = { ...params, ...newParams };
      setParams(mergedParams);
      const response = await articleAPI.getAll(mergedParams);
      
      console.log('📦 useArticles response:', response);
      
      // ─── FIXED: Extract articles from response ──────────────────────────
      let articlesData = [];
      let total = 0;
      
      // The API returns: { success: true, data: { articles: [...], total: 0 } }
      if (response?.data?.data?.articles) {
        articlesData = response.data.data.articles;
        total = response.data.data.total || 0;
        console.log('✅ Found articles in response.data.data.articles');
      }
      else if (response?.data?.articles) {
        articlesData = response.data.articles;
        total = response.data.total || 0;
        console.log('✅ Found articles in response.data.articles');
      }
      else if (Array.isArray(response?.data)) {
        articlesData = response.data;
        total = articlesData.length;
        console.log('✅ Found articles in response.data (array)');
      }
      else if (Array.isArray(response)) {
        articlesData = response;
        total = articlesData.length;
        console.log('✅ Found articles in response (array)');
      }
      
      articlesData = Array.isArray(articlesData) ? articlesData : [];
      
      console.log(`📦 Articles found: ${articlesData.length}`);
      
      setArticles(articlesData);
      setTotalCount(total || articlesData.length);
      setHasMore(articlesData.length < total);
      
      return { data: articlesData, total };
      
    } catch (err) {
      console.error('❌ Error fetching articles:', err);
      setError(err.message || 'Failed to fetch articles');
      setArticles([]);
      setTotalCount(0);
      setHasMore(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [params]);

  // Refresh articles
  const refresh = useCallback(() => {
    return fetchArticles({ ...params, page: 1 });
  }, [fetchArticles, params]);

  // Get single article by ID
  const getArticle = useCallback(async (id) => {
    try {
      const article = await articleAPI.getById(id);
      return article?.data || article;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Like article
  const likeArticle = useCallback(async (id) => {
    try {
      const result = await articleAPI.like(id);
      setArticles(prev => 
        prev.map(article => 
          article._id === id 
            ? { ...article, likes: (article.likes || 0) + 1, isLiked: true }
            : article
        )
      );
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Unlike article
  const unlikeArticle = useCallback(async (id) => {
    try {
      const result = await articleAPI.unlike(id);
      setArticles(prev => 
        prev.map(article => 
          article._id === id 
            ? { ...article, likes: Math.max((article.likes || 0) - 1, 0), isLiked: false }
            : article
        )
      );
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Get articles by category
  const getByCategory = useCallback(async (category) => {
    setLoading(true);
    try {
      const response = await articleAPI.getByCategory(category);
      let categoryResults = [];
      if (response?.data?.data?.articles) {
        categoryResults = response.data.data.articles;
      } else if (response?.data?.articles) {
        categoryResults = response.data.articles;
      } else if (Array.isArray(response?.data)) {
        categoryResults = response.data;
      } else if (Array.isArray(response)) {
        categoryResults = response;
      }
      setArticles(Array.isArray(categoryResults) ? categoryResults : []);
      return categoryResults;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get trending articles
  const getTrending = useCallback(async () => {
    setLoading(true);
    try {
      const response = await articleAPI.getTrending();
      let trendingResults = [];
      if (response?.data?.data?.articles) {
        trendingResults = response.data.data.articles;
      } else if (response?.data?.articles) {
        trendingResults = response.data.articles;
      } else if (Array.isArray(response?.data)) {
        trendingResults = response.data;
      } else if (Array.isArray(response)) {
        trendingResults = response;
      }
      setArticles(Array.isArray(trendingResults) ? trendingResults : []);
      return trendingResults;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search articles
  const searchArticles = useCallback(async (query) => {
    setLoading(true);
    try {
      const response = await articleAPI.search(query);
      let searchResults = [];
      if (response?.data?.data?.articles) {
        searchResults = response.data.data.articles;
      } else if (response?.data?.articles) {
        searchResults = response.data.articles;
      } else if (Array.isArray(response?.data)) {
        searchResults = response.data;
      } else if (Array.isArray(response)) {
        searchResults = response;
      }
      setArticles(Array.isArray(searchResults) ? searchResults : []);
      return searchResults;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    articles,
    loading,
    error,
    totalCount,
    hasMore,
    params,
    fetchArticles,
    refresh,
    getArticle,
    likeArticle,
    unlikeArticle,
    getByCategory,
    getTrending,
    searchArticles,
  };
}

export default useArticles;