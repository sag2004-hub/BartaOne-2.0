import { useState, useContext, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import { channelAPI } from '../services/api';

const useNewspaper = () => {
  // ✅ Get auth context
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;

  const [loading, setLoading] = useState(false);
  const [newspapers, setNewspapers] = useState([]);
  const channelCache = useRef({});

  // ✅ Helper to get channel ID
  const getChannelId = async () => {
    try {
      // Try to get from user object first
      if (user?.channelId) {
        return user.channelId;
      }
      
      // If not, fetch from API
      console.log('📡 Fetching channel from API...');
      const response = await channelAPI.getByOwner();
      if (response.data?.data) {
        const channel = response.data.data;
        const channelId = channel._id || channel.id;
        console.log('✅ Channel found:', channelId);
        return channelId;
      }
      
      console.warn('⚠️ No channel found for user');
      return null;
    } catch (error) {
      console.error('❌ Error fetching channel:', error);
      return null;
    }
  };

  // ✅ Helper to fetch a single channel
  const fetchChannel = async (channelId) => {
    try {
      // Check cache first
      if (channelCache.current[channelId]) {
        console.log(`📦 Channel ${channelId} found in cache`);
        return channelCache.current[channelId];
      }

      console.log(`📡 Fetching channel ${channelId}...`);
      const response = await channelAPI.getById(channelId);
      
      // Handle different response structures
      let channel = response.data?.data?.channel || 
                    response.data?.data || 
                    response.data?.channel ||
                    response.data;

      console.log(`✅ Channel ${channelId} fetched:`, channel ? 'SUCCESS' : 'FAILED');
      
      if (channel) {
        // Cache the channel
        const id = channel._id || channel.id || channel.$oid;
        if (id) {
          channelCache.current[id] = channel;
        }
        return channel;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error fetching channel ${channelId}:`, error.message);
      return null;
    }
  };

  // ✅ Fetch newspapers with channel data populated
  const fetchNewspapers = async (filters = {}) => {
    try {
      setLoading(true);
      console.log('📡 Fetching newspapers...');
      
      const response = await api.get('/newspapers', { params: filters });
      let newspapersData = response.data?.data || [];
      
      console.log(`📰 Found ${newspapersData.length} newspapers`);

      // If we have newspapers, fetch channel data for each
      if (newspapersData.length > 0) {
        console.log('📡 Fetching channel data for newspapers...');
        
        // Log the first newspaper to see structure
        console.log('📰 Sample newspaper:', JSON.stringify(newspapersData[0], null, 2));
        
        // Get unique channel IDs
        const channelIds = [...new Set(
          newspapersData
            .map(np => {
              // Handle different formats of channelId
              if (typeof np.channelId === 'string') {
                console.log(`🔑 Channel ID as string: ${np.channelId}`);
                return np.channelId;
              }
              if (np.channelId && typeof np.channelId === 'object') {
                const id = np.channelId._id || np.channelId.$oid || np.channelId;
                console.log(`🔑 Channel ID from object: ${id}`);
                return id;
              }
              console.log(`⚠️ No channel ID found for newspaper:`, np._id);
              return null;
            })
            .filter(Boolean)
        )];

        console.log(`📡 Found ${channelIds.length} unique channels to fetch:`, channelIds);

        // Fetch all channels in parallel
        const channelPromises = channelIds.map(id => fetchChannel(id));
        const channelResults = await Promise.all(channelPromises);
        
        // Create a map of channel ID to channel data
        const channelMap = {};
        channelResults.forEach(channel => {
          if (channel) {
            const id = channel._id || channel.id || channel.$oid;
            if (id) {
              channelMap[id] = channel;
              console.log(`✅ Channel ${id} mapped:`, channel.channelName || channel.name || 'Unknown');
            }
          }
        });

        console.log(`✅ Fetched ${Object.keys(channelMap).length} channels`);

        // Populate channel data in newspapers
        newspapersData = newspapersData.map(np => {
          let channelId = null;
          
          // Extract channel ID
          if (typeof np.channelId === 'string') {
            channelId = np.channelId;
          } else if (np.channelId && typeof np.channelId === 'object') {
            channelId = np.channelId._id || np.channelId.$oid || np.channelId;
          }

          // If we have channel data, attach it
          if (channelId && channelMap[channelId]) {
            const populatedChannel = channelMap[channelId];
            console.log(`✅ Populated newspaper ${np._id} with channel ${populatedChannel.channelName || populatedChannel.name}`);
            return {
              ...np,
              channelId: populatedChannel // Replace string ID with full channel object
            };
          } else if (channelId) {
            console.log(`⚠️ No channel data found for ID ${channelId}`);
          }
          
          return np;
        });

        const populatedCount = newspapersData.filter(np => typeof np.channelId === 'object').length;
        console.log(`✅ Populated channel data for ${populatedCount}/${newspapersData.length} newspapers`);
      }

      setNewspapers(newspapersData);
      return newspapersData;
    } catch (error) {
      console.error('❌ Error fetching newspapers:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch newspapers');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getNewspaperById = async (id) => {
    try {
      setLoading(true);
      console.log(`📡 Fetching newspaper ${id}...`);
      const response = await api.get(`/newspapers/${id}`);
      let newspaper = response.data?.data || null;
      
      console.log('📰 Newspaper fetched:', newspaper ? 'SUCCESS' : 'FAILED');
      
      // If newspaper has a channelId as string, fetch the channel data
      if (newspaper && newspaper.channelId) {
        let channelId = null;
        if (typeof newspaper.channelId === 'string') {
          channelId = newspaper.channelId;
        } else if (typeof newspaper.channelId === 'object') {
          channelId = newspaper.channelId._id || newspaper.channelId.$oid || newspaper.channelId;
        }
        
        if (channelId && typeof channelId === 'string') {
          console.log(`📡 Fetching channel ${channelId} for newspaper...`);
          const channel = await fetchChannel(channelId);
          if (channel) {
            newspaper.channelId = channel;
            console.log(`✅ Newspaper populated with channel: ${channel.channelName || channel.name}`);
          }
        }
      }
      
      return newspaper;
    } catch (error) {
      console.error('❌ Error fetching newspaper:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch newspaper details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createNewspaper = async (data) => {
    try {
      setLoading(true);
      
      console.log('📰 Creating newspaper with data:', data);
      console.log('👤 User object:', user);
      
      // ✅ Get channel ID - try multiple sources
      let channelId = data?.channelId || user?.channelId;
      
      // If still no channelId, fetch from API
      if (!channelId) {
        console.log('📡 No channelId in user or data, fetching from API...');
        const fetchedChannelId = await getChannelId();
        if (fetchedChannelId) {
          channelId = fetchedChannelId;
        }
      }
      
      // If still no channelId, show error
      if (!channelId) {
        console.error('❌ No channelId found!');
        Alert.alert('Error', 'No channel found. Please create a channel first.');
        return { 
          success: false, 
          error: 'No channel found. Please create a channel first.' 
        };
      }
      
      console.log('📡 Using channelId:', channelId);
      
      const response = await api.post('/newspapers', {
        ...data,
        channelId: channelId,
      });
      
      console.log('✅ Newspaper created:', response.data);
      return { success: true, data: response.data?.data };
    } catch (error) {
      console.error('❌ Error creating newspaper:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to create newspaper' 
      };
    } finally {
      setLoading(false);
    }
  };

  const getUserNewspapers = async () => {
    try {
      setLoading(true);
      console.log('📡 Fetching user newspapers...');
      const response = await api.get('/newspapers/user');
      let newspapersData = response.data?.data || [];
      
      console.log(`📰 Found ${newspapersData.length} user newspapers`);
      
      // Populate channel data for user's newspapers
      if (newspapersData.length > 0) {
        const channelIds = [...new Set(
          newspapersData
            .map(np => {
              if (typeof np.channelId === 'string') return np.channelId;
              if (np.channelId && typeof np.channelId === 'object') {
                return np.channelId._id || np.channelId.$oid || np.channelId;
              }
              return null;
            })
            .filter(Boolean)
        )];

        const channelPromises = channelIds.map(id => fetchChannel(id));
        const channelResults = await Promise.all(channelPromises);
        
        const channelMap = {};
        channelResults.forEach(channel => {
          if (channel) {
            const id = channel._id || channel.id || channel.$oid;
            if (id) channelMap[id] = channel;
          }
        });

        newspapersData = newspapersData.map(np => {
          let channelId = null;
          if (typeof np.channelId === 'string') {
            channelId = np.channelId;
          } else if (np.channelId && typeof np.channelId === 'object') {
            channelId = np.channelId._id || np.channelId.$oid || np.channelId;
          }
          if (channelId && channelMap[channelId]) {
            return { ...np, channelId: channelMap[channelId] };
          }
          return np;
        });
      }
      
      return newspapersData;
    } catch (error) {
      console.error('❌ Error fetching user newspapers:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch your newspapers');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const updateNewspaper = async (id, data) => {
    try {
      setLoading(true);
      console.log('📰 Updating newspaper:', id);
      const response = await api.put(`/newspapers/${id}`, data);
      console.log('✅ Newspaper updated:', response.data);
      return { success: true, data: response.data?.data };
    } catch (error) {
      console.error('❌ Error updating newspaper:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update newspaper',
      };
    } finally {
      setLoading(false);
    }
  };

  const deleteNewspaper = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/newspapers/${id}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting newspaper:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete newspaper');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const filterNewspapers = (newspapersData, filterType, searchQuery) => {
    let filtered = newspapersData || newspapers;

    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (np) =>
          np.title?.toLowerCase().includes(query) ||
          np.description?.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (filterType === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter((np) => new Date(np.publishedAt) >= today);
    } else if (filterType === 'expiring') {
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      filtered = filtered.filter(
        (np) => new Date(np.expiresAt) <= twoHoursFromNow && new Date(np.expiresAt) > now
      );
    } else if (filterType === 'channels') {
      filtered = filtered.filter((np) => np.channelId?._id === user?.channelId?._id);
    }

    // Sort by published date (newest first)
    filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    return filtered;
  };

  return {
    newspapers,
    loading,
    fetchNewspapers,
    getNewspaperById,
    createNewspaper,
    updateNewspaper,
    getUserNewspapers,
    deleteNewspaper,
    filterNewspapers,
  };
};

export default useNewspaper;