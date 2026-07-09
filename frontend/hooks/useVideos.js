// hooks/useVideos.js
import { useState, useCallback } from 'react';
import { videoAPI } from '../services/api';

export function useVideos(initialParams = {}) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [params, setParams] = useState(initialParams);

  const fetchVideos = useCallback(async (newParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const mergedParams = { ...params, ...newParams };
      setParams(mergedParams);
      const response = await videoAPI.getAll(mergedParams);
      
      console.log('📦 useVideos response:', response);
      
      let videosData = [];
      let total = 0;
      
      if (response?.data?.data?.videos) {
        videosData = response.data.data.videos;
        total = response.data.data.total || 0;
        console.log('✅ Found videos in response.data.data.videos');
      }
      else if (response?.data?.videos) {
        videosData = response.data.videos;
        total = response.data.total || 0;
        console.log('✅ Found videos in response.data.videos');
      }
      else if (Array.isArray(response?.data)) {
        videosData = response.data;
        total = videosData.length;
        console.log('✅ Found videos in response.data (array)');
      }
      else if (Array.isArray(response)) {
        videosData = response;
        total = videosData.length;
        console.log('✅ Found videos in response (array)');
      }
      
      videosData = Array.isArray(videosData) ? videosData : [];
      
      console.log(`📦 Videos found: ${videosData.length}`);
      
      setVideos(videosData);
      setTotalCount(total || videosData.length);
      setHasMore(videosData.length < total);
      
      return { data: videosData, total };
      
    } catch (err) {
      console.error('❌ Error fetching videos:', err);
      setError(err.message || 'Failed to fetch videos');
      setVideos([]);
      setTotalCount(0);
      setHasMore(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [params]);

  const refresh = useCallback(() => {
    return fetchVideos({ ...params, page: 1 });
  }, [fetchVideos, params]);

  const getVideo = useCallback(async (id) => {
    try {
      const video = await videoAPI.getById(id);
      return video?.data || video;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const likeVideo = useCallback(async (id) => {
    try {
      const result = await videoAPI.like(id);
      setVideos(prev => 
        prev.map(video => 
          video._id === id 
            ? { ...video, likes: (video.likes || 0) + 1, isLiked: true }
            : video
        )
      );
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const unlikeVideo = useCallback(async (id) => {
    try {
      const result = await videoAPI.unlike(id);
      setVideos(prev => 
        prev.map(video => 
          video._id === id 
            ? { ...video, likes: Math.max((video.likes || 0) - 1, 0), isLiked: false }
            : video
        )
      );
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    videos,
    loading,
    error,
    totalCount,
    hasMore,
    params,
    fetchVideos,
    refresh,
    getVideo,
    likeVideo,
    unlikeVideo,
  };
}

export default useVideos;