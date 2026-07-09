// hooks/useChannels.js
import { useState, useCallback } from 'react';
import { channelAPI } from '../services/api';

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
      const response = await channelAPI.getAll(mergedParams);
      
      console.log('📦 useChannels response:', response);
      
      // ─── FIXED: Extract channels from response ──────────────────────────
      let channelsData = [];
      let total = 0;
      
      // The API returns: { success: true, data: { channels: [...], total: 0 } }
      if (response?.data?.data?.channels) {
        channelsData = response.data.data.channels;
        total = response.data.data.total || 0;
        console.log('✅ Found channels in response.data.data.channels');
      }
      else if (response?.data?.channels) {
        channelsData = response.data.channels;
        total = response.data.total || 0;
        console.log('✅ Found channels in response.data.channels');
      }
      else if (Array.isArray(response?.data)) {
        channelsData = response.data;
        total = channelsData.length;
        console.log('✅ Found channels in response.data (array)');
      }
      else if (Array.isArray(response)) {
        channelsData = response;
        total = channelsData.length;
        console.log('✅ Found channels in response (array)');
      }
      
      channelsData = Array.isArray(channelsData) ? channelsData : [];
      
      console.log(`📦 Channels found: ${channelsData.length}`);
      
      setChannels(channelsData);
      setTotalCount(total || channelsData.length);
      setHasMore(channelsData.length < total);
      
      return { data: channelsData, total };
      
    } catch (err) {
      console.error('❌ Error fetching channels:', err);
      setError(err.message || 'Failed to fetch channels');
      setChannels([]);
      setTotalCount(0);
      setHasMore(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [params]);

  // Refresh channels
  const refresh = useCallback(() => {
    return fetchChannels({ ...params, page: 1 });
  }, [fetchChannels, params]);

  // Get single channel by ID
  const getChannel = useCallback(async (id) => {
    try {
      const channel = await channelAPI.getById(id);
      return channel?.data || channel;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Subscribe to channel
  const subscribe = useCallback(async (id) => {
    try {
      const result = await channelAPI.subscribe(id);
      setChannels(prev => 
        prev.map(channel => 
          channel._id === id 
            ? { ...channel, isSubscribed: true, followers: (channel.followers || 0) + 1 }
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
  const unsubscribe = useCallback(async (id) => {
    try {
      const result = await channelAPI.unsubscribe(id);
      setChannels(prev => 
        prev.map(channel => 
          channel._id === id 
            ? { ...channel, isSubscribed: false, followers: Math.max((channel.followers || 0) - 1, 0) }
            : channel
        )
      );
      return result;
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
    refresh,
    getChannel,
    subscribe,
    unsubscribe,
  };
}

export default useChannels;