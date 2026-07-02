import { useState, useEffect, useCallback } from 'react';
import { channelService } from '../services/channelService';

// Hook to fetch and manage channels
export function useChannels(initialParams = {}) {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [params, setParams] = useState(initialParams);

  const fetchChannels = useCallback(async (newParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const mergedParams = { ...params, ...newParams };
      setParams(mergedParams);
      const response = await channelService.getAll(mergedParams);
      setChannels(response.data || response || []);
      setTotalCount(response.total || response.length || 0);
      setHasMore(response.hasMore || false);
      return response;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching channels:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [params]);

  // Load more channels (pagination)
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    const nextPage = (params.page || 1) + 1;
    setLoading(true);
    try {
      const response = await channelService.getAll({
        ...params,
        page: nextPage,
      });
      setChannels(prev => [...prev, ...(response.data || response || [])]);
      setHasMore(response.hasMore || false);
      setParams(prev => ({ ...prev, page: nextPage }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params, loading, hasMore]);

  // Refresh channels
  const refresh = useCallback(() => {
    return fetchChannels({ ...params, page: 1 });
  }, [fetchChannels, params]);

  // Get single channel by ID
  const getChannel = useCallback(async (id) => {
    try {
      const channel = await channelService.getById(id);
      return channel;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Get channel by owner
  const getOwnerChannel = useCallback(async () => {
    setLoading(true);
    try {
      const channel = await channelService.getByOwner();
      return channel;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create channel
  const createChannel = useCallback(async (channelData) => {
    try {
      const newChannel = await channelService.create(channelData);
      setChannels(prev => [newChannel, ...prev]);
      setTotalCount(prev => prev + 1);
      return newChannel;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Update channel
  const updateChannel = useCallback(async (id, channelData) => {
    try {
      const updated = await channelService.update(id, channelData);
      setChannels(prev => 
        prev.map(channel => 
          channel._id === id ? updated : channel
        )
      );
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Delete channel
  const deleteChannel = useCallback(async (id) => {
    try {
      await channelService.delete(id);
      setChannels(prev => prev.filter(channel => channel._id !== id));
      setTotalCount(prev => Math.max(prev - 1, 0));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Subscribe to channel
  const subscribeChannel = useCallback(async (id) => {
    try {
      const result = await channelService.subscribe(id);
      // Update local state
      setChannels(prev => 
        prev.map(channel => 
          channel._id === id 
            ? { ...channel, followers: (channel.followers || 0) + 1, isSubscribed: true }
            : channel
        )
      );
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Unsubscribe from channel
  const unsubscribeChannel = useCallback(async (id) => {
    try {
      const result = await channelService.unsubscribe(id);
      // Update local state
      setChannels(prev => 
        prev.map(channel => 
          channel._id === id 
            ? { ...channel, followers: Math.max((channel.followers || 0) - 1, 0), isSubscribed: false }
            : channel
        )
      );
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Get nearby channels
  const getNearby = useCallback(async (latitude, longitude, radius = 10) => {
    setLoading(true);
    try {
      const results = await channelService.getNearby(latitude, longitude, radius);
      setChannels(results);
      return results;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get channel subscribers
  const getSubscribers = useCallback(async () => {
    try {
      const subscribers = await channelService.getSubscribers();
      return subscribers;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Get channel stats
  const getStats = useCallback(async (id) => {
    try {
      const stats = await channelService.getStats(id);
      return stats;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    channels,
    loading,
    error,
    totalCount,
    hasMore,
    params,
    fetchChannels,
    loadMore,
    refresh,
    getChannel,
    getOwnerChannel,
    createChannel,
    updateChannel,
    deleteChannel,
    subscribeChannel,
    unsubscribeChannel,
    getNearby,
    getSubscribers,
    getStats,
  };
}

// Hook for a single channel with its content
export function useChannel(channelId) {
  const [channel, setChannel] = useState(null);
  const [articles, setArticles] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (channelId) {
      loadChannel();
    }
  }, [channelId]);

  const loadChannel = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load channel details
      const channelData = await channelService.getById(channelId);
      setChannel(channelData);
      setIsSubscribed(channelData.isSubscribed || false);

      // Load channel content
      const [articlesData, videosData] = await Promise.all([
        articleService.getByChannel(channelId),
        videoService.getByChannel(channelId),
      ]);
      setArticles(articlesData);
      setVideos(videosData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => loadChannel();

  const toggleSubscribe = async () => {
    try {
      if (isSubscribed) {
        await channelService.unsubscribe(channelId);
        setIsSubscribed(false);
        setChannel(prev => ({ 
          ...prev, 
          followers: Math.max((prev?.followers || 0) - 1, 0) 
        }));
      } else {
        await channelService.subscribe(channelId);
        setIsSubscribed(true);
        setChannel(prev => ({ 
          ...prev, 
          followers: (prev?.followers || 0) + 1 
        }));
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    channel,
    articles,
    videos,
    loading,
    error,
    isSubscribed,
    refresh,
    toggleSubscribe,
  };
}

export default useChannels;