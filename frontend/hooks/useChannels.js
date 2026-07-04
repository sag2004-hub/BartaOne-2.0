// hooks/useChannels.js
import { useState, useEffect, useCallback } from 'react';
import { channelAPI } from '../services/api';

export function useChannels(initialParams = {}) {
  const [channels, setChannels] = useState([]); // ✅ Always initialize as empty array
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
      const response = await channelAPI.getAll(mergedParams);
      
      console.log('📦 useChannels response:', response);
      
      // ✅ Handle different response structures
      let channelsData = [];
      let total = 0;
      let hasMoreData = false;
      
      // Check if response is an array directly
      if (Array.isArray(response)) {
        channelsData = response;
        total = response.length;
        hasMoreData = false;
      } 
      // Check if response has a data property that is an array
      else if (response && typeof response === 'object') {
        if (Array.isArray(response.data)) {
          channelsData = response.data;
          total = response.total || response.data.length;
          hasMoreData = response.hasMore || false;
        } else if (Array.isArray(response.channels)) {
          channelsData = response.channels;
          total = response.total || response.channels.length;
          hasMoreData = response.hasMore || false;
        } else if (Array.isArray(response.results)) {
          channelsData = response.results;
          total = response.total || response.results.length;
          hasMoreData = response.hasMore || false;
        } else {
          // If it's an object but no array found, try to extract
          const values = Object.values(response);
          const arrayValue = values.find(v => Array.isArray(v));
          if (arrayValue) {
            channelsData = arrayValue;
            total = arrayValue.length;
          }
        }
      }
      
      // ✅ Ensure channelsData is always an array
      channelsData = Array.isArray(channelsData) ? channelsData : [];
      
      console.log('📦 Channels data length:', channelsData.length);
      
      setChannels(channelsData);
      setTotalCount(total || channelsData.length);
      setHasMore(hasMoreData || false);
      
      return { data: channelsData, total, hasMore: hasMoreData };
      
    } catch (err) {
      console.error('❌ Error fetching channels:', err);
      setError(err.message || 'Failed to fetch channels');
      setChannels([]); // ✅ Set to empty array on error
      setTotalCount(0);
      setHasMore(false);
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
      const response = await channelAPI.getAll({
        ...params,
        page: nextPage,
      });
      
      // ✅ Handle response similarly
      let newChannels = [];
      if (Array.isArray(response)) {
        newChannels = response;
      } else if (response?.data && Array.isArray(response.data)) {
        newChannels = response.data;
      } else if (response?.channels && Array.isArray(response.channels)) {
        newChannels = response.channels;
      } else if (response?.results && Array.isArray(response.results)) {
        newChannels = response.results;
      }
      
      newChannels = Array.isArray(newChannels) ? newChannels : [];
      
      setChannels(prev => [...(Array.isArray(prev) ? prev : []), ...newChannels]);
      setHasMore(response?.hasMore || false);
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
      const channel = await channelAPI.getById(id);
      return channel;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Get channels by category
  const getByCategory = useCallback(async (category) => {
    setLoading(true);
    try {
      const results = await channelAPI.getByCategory(category);
      let categoryResults = [];
      if (Array.isArray(results)) {
        categoryResults = results;
      } else if (results?.data && Array.isArray(results.data)) {
        categoryResults = results.data;
      }
      setChannels(Array.isArray(categoryResults) ? categoryResults : []);
      return categoryResults;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search channels
  const searchChannels = useCallback(async (query) => {
    setLoading(true);
    try {
      const results = await channelAPI.search(query);
      let searchResults = [];
      if (Array.isArray(results)) {
        searchResults = results;
      } else if (results?.data && Array.isArray(results.data)) {
        searchResults = results.data;
      }
      setChannels(Array.isArray(searchResults) ? searchResults : []);
      return searchResults;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to channel
  const subscribe = useCallback(async (id) => {
    try {
      const result = await channelAPI.subscribe(id);
      // Update local state
      setChannels(prev => {
        const currentChannels = Array.isArray(prev) ? prev : [];
        return currentChannels.map(channel => 
          channel._id === id 
            ? { ...channel, isSubscribed: true, subscribers: (channel.subscribers || 0) + 1 }
            : channel
        );
      });
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Unsubscribe from channel
  const unsubscribe = useCallback(async (id) => {
    try {
      const result = await channelAPI.unsubscribe(id);
      // Update local state
      setChannels(prev => {
        const currentChannels = Array.isArray(prev) ? prev : [];
        return currentChannels.map(channel => 
          channel._id === id 
            ? { ...channel, isSubscribed: false, subscribers: Math.max((channel.subscribers || 0) - 1, 0) }
            : channel
        );
      });
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    channels,      // ✅ Always returns an array
    loading,
    error,
    totalCount,
    hasMore,
    params,
    fetchChannels,
    loadMore,
    refresh,
    getChannel,
    getByCategory,
    searchChannels,
    subscribe,
    unsubscribe,
  };
}

export default useChannels;