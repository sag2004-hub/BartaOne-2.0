// hooks/useArticles.js
import { useState, useEffect, useCallback } from 'react';
import { articleService } from '../services/articleService';
import { useTranslation } from './useTranslation';

// Hook to fetch and manage articles
export function useArticles(initialParams = {}) {
  const [articles, setArticles] = useState([]); // ✅ Always initialize as empty array
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
      const response = await articleService.getAll(mergedParams);
      
      console.log('📦 useArticles response:', response);
      
      // ✅ Handle different response structures
      let articlesData = [];
      let total = 0;
      let hasMoreData = false;
      
      // Check if response is an array directly
      if (Array.isArray(response)) {
        articlesData = response;
        total = response.length;
        hasMoreData = false;
      } 
      // Check if response has a data property that is an array
      else if (response && typeof response === 'object') {
        if (Array.isArray(response.data)) {
          articlesData = response.data;
          total = response.total || response.data.length;
          hasMoreData = response.hasMore || false;
        } else if (Array.isArray(response.articles)) {
          articlesData = response.articles;
          total = response.total || response.articles.length;
          hasMoreData = response.hasMore || false;
        } else if (Array.isArray(response.results)) {
          articlesData = response.results;
          total = response.total || response.results.length;
          hasMoreData = response.hasMore || false;
        } else {
          // If it's an object but no array found, try to extract
          const values = Object.values(response);
          const arrayValue = values.find(v => Array.isArray(v));
          if (arrayValue) {
            articlesData = arrayValue;
            total = arrayValue.length;
          }
        }
      }
      
      // ✅ Ensure articlesData is always an array
      articlesData = Array.isArray(articlesData) ? articlesData : [];
      
      console.log('📦 Articles data length:', articlesData.length);
      
      setArticles(articlesData);
      setTotalCount(total || articlesData.length);
      setHasMore(hasMoreData || false);
      
      return { data: articlesData, total, hasMore: hasMoreData };
      
    } catch (err) {
      console.error('❌ Error fetching articles:', err);
      setError(err.message || 'Failed to fetch articles');
      setArticles([]); // ✅ Set to empty array on error
      setTotalCount(0);
      setHasMore(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [params]);

  // Load more articles (pagination)
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    const nextPage = (params.page || 1) + 1;
    setLoading(true);
    try {
      const response = await articleService.getAll({
        ...params,
        page: nextPage,
      });
      
      // ✅ Handle response similarly
      let newArticles = [];
      if (Array.isArray(response)) {
        newArticles = response;
      } else if (response?.data && Array.isArray(response.data)) {
        newArticles = response.data;
      } else if (response?.articles && Array.isArray(response.articles)) {
        newArticles = response.articles;
      } else if (response?.results && Array.isArray(response.results)) {
        newArticles = response.results;
      }
      
      newArticles = Array.isArray(newArticles) ? newArticles : [];
      
      setArticles(prev => [...(Array.isArray(prev) ? prev : []), ...newArticles]);
      setHasMore(response?.hasMore || false);
      setParams(prev => ({ ...prev, page: nextPage }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params, loading, hasMore]);

  // Refresh articles
  const refresh = useCallback(() => {
    return fetchArticles({ ...params, page: 1 });
  }, [fetchArticles, params]);

  // Get single article by ID
  const getArticle = useCallback(async (id) => {
    try {
      const article = await articleService.getById(id);
      return article;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Like article
  const likeArticle = useCallback(async (id) => {
    try {
      const result = await articleService.like(id);
      // Update local state
      setArticles(prev => {
        const currentArticles = Array.isArray(prev) ? prev : [];
        return currentArticles.map(article => 
          article._id === id 
            ? { ...article, likes: (article.likes || 0) + 1, isLiked: true }
            : article
        );
      });
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Unlike article
  const unlikeArticle = useCallback(async (id) => {
    try {
      const result = await articleService.unlike(id);
      // Update local state
      setArticles(prev => {
        const currentArticles = Array.isArray(prev) ? prev : [];
        return currentArticles.map(article => 
          article._id === id 
            ? { ...article, likes: Math.max((article.likes || 0) - 1, 0), isLiked: false }
            : article
        );
      });
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Create article
  const createArticle = useCallback(async (articleData) => {
    try {
      const newArticle = await articleService.create(articleData);
      setArticles(prev => {
        const currentArticles = Array.isArray(prev) ? prev : [];
        return [newArticle, ...currentArticles];
      });
      setTotalCount(prev => prev + 1);
      return newArticle;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Update article
  const updateArticle = useCallback(async (id, articleData) => {
    try {
      const updated = await articleService.update(id, articleData);
      setArticles(prev => {
        const currentArticles = Array.isArray(prev) ? prev : [];
        return currentArticles.map(article => 
          article._id === id ? updated : article
        );
      });
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Delete article
  const deleteArticle = useCallback(async (id) => {
    try {
      await articleService.delete(id);
      setArticles(prev => {
        const currentArticles = Array.isArray(prev) ? prev : [];
        return currentArticles.filter(article => article._id !== id);
      });
      setTotalCount(prev => Math.max(prev - 1, 0));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Search articles
  const searchArticles = useCallback(async (query) => {
    setLoading(true);
    try {
      const results = await articleService.search(query);
      // ✅ Handle response
      let searchResults = [];
      if (Array.isArray(results)) {
        searchResults = results;
      } else if (results?.data && Array.isArray(results.data)) {
        searchResults = results.data;
      } else if (results?.articles && Array.isArray(results.articles)) {
        searchResults = results.articles;
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

  // Get articles by category
  const getByCategory = useCallback(async (category) => {
    setLoading(true);
    try {
      const results = await articleService.getByCategory(category);
      // ✅ Handle response
      let categoryResults = [];
      if (Array.isArray(results)) {
        categoryResults = results;
      } else if (results?.data && Array.isArray(results.data)) {
        categoryResults = results.data;
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
      const results = await articleService.getTrending();
      // ✅ Handle response
      let trendingResults = [];
      if (Array.isArray(results)) {
        trendingResults = results;
      } else if (results?.data && Array.isArray(results.data)) {
        trendingResults = results.data;
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

  return {
    articles,      // ✅ Always returns an array
    loading,
    error,
    totalCount,
    hasMore,
    params,
    fetchArticles,
    loadMore,
    refresh,
    getArticle,
    likeArticle,
    unlikeArticle,
    createArticle,
    updateArticle,
    deleteArticle,
    searchArticles,
    getByCategory,
    getTrending,
  };
}

// Hook for a single article
export function useArticle(articleId) {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { translateArticle } = useTranslation();
  const [userLanguage, setUserLanguage] = useState('en');

  useEffect(() => {
    if (articleId) {
      loadArticle();
    }
  }, [articleId]);

  const loadArticle = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await articleService.getById(articleId);
      
      // Check if translation is needed
      const shouldTranslate = userLanguage !== 'en' && data?.language !== userLanguage;
      if (shouldTranslate) {
        const translated = await translateArticle(data, userLanguage);
        setArticle(translated);
      } else {
        setArticle(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => loadArticle();

  const like = async () => {
    try {
      const result = await articleService.like(articleId);
      setArticle(prev => ({ 
        ...prev, 
        likes: (prev?.likes || 0) + 1, 
        isLiked: true 
      }));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const unlike = async () => {
    try {
      const result = await articleService.unlike(articleId);
      setArticle(prev => ({ 
        ...prev, 
        likes: Math.max((prev?.likes || 0) - 1, 0), 
        isLiked: false 
      }));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const comment = async (commentData) => {
    try {
      const result = await articleService.comment(articleId, commentData);
      setArticle(prev => ({
        ...prev,
        comments: (prev?.comments || 0) + 1,
      }));
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const translate = async (targetLang) => {
    if (!article) return;
    try {
      setLoading(true);
      const translated = await translateArticle(article, targetLang);
      setArticle(translated);
      setUserLanguage(targetLang);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    article,
    loading,
    error,
    refresh,
    like,
    unlike,
    comment,
    translate,
    userLanguage,
  };
}

export default useArticles;