import { useState, useEffect, useCallback } from 'react';
import { articleService } from '../services/articleService';
import { useTranslation } from './useTranslation';

// Hook to fetch and manage articles
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
      const response = await articleService.getAll(mergedParams);
      setArticles(response.data || response || []);
      setTotalCount(response.total || response.length || 0);
      setHasMore(response.hasMore || false);
      return response;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching articles:', err);
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
      setArticles(prev => [...prev, ...(response.data || response || [])]);
      setHasMore(response.hasMore || false);
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
      const result = await articleService.unlike(id);
      // Update local state
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

  // Create article
  const createArticle = useCallback(async (articleData) => {
    try {
      const newArticle = await articleService.create(articleData);
      setArticles(prev => [newArticle, ...prev]);
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
      setArticles(prev => 
        prev.map(article => 
          article._id === id ? updated : article
        )
      );
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
      setArticles(prev => prev.filter(article => article._id !== id));
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
      setArticles(results);
      return results;
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
      setArticles(results);
      return results;
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
      setArticles(results);
      return results;
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
      const shouldTranslate = userLanguage !== 'en' && data.language !== userLanguage;
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