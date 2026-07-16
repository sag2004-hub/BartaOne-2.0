import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  Animated,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import channelService from '../../services/channelService';
import api from '../../services/api';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';

// ─── Responsive helpers ──────────────────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

const scale = (size) => {
  const scaleFactor = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scaleFactor;
  return Math.round(newSize);
};

const verticalScale = (size) => {
  const scaleFactor = SCREEN_HEIGHT / BASE_HEIGHT;
  const newSize = size * scaleFactor;
  return Math.round(newSize);
};

const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

const fontScale = (size) => {
  const scaleFactor = Math.min(
    SCREEN_WIDTH / BASE_WIDTH,
    SCREEN_HEIGHT / BASE_HEIGHT
  );
  const newSize = size * scaleFactor;
  return Math.round(newSize);
};

// ─── Theme ───────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: '#F2F0EB',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFAF8',
  border: '#E4E0D8',
  accent: '#C8001A',
  accentBg: '#FFF0F2',
  accentBorder: 'rgba(200,0,26,0.18)',
  primary: '#1A2733',
  secondary: '#4A5A6B',
  muted: '#8A97A5',
  faint: '#B8C0C8',
  white: '#FFFFFF',
  statusBar: 'dark-content',
  cardShadowOpacity: 0.06,
};

const DARK = {
  bg: '#0D1117',
  surface: '#161B22',
  surfaceAlt: '#1C2330',
  border: '#2A3340',
  accent: '#E8192C',
  accentBg: 'rgba(232,25,44,0.12)',
  accentBorder: 'rgba(232,25,44,0.25)',
  primary: '#EDF2F7',
  secondary: '#8B9BAB',
  muted: '#5C6E80',
  faint: '#3A4A58',
  white: '#FFFFFF',
  statusBar: 'light-content',
  cardShadowOpacity: 0.35,
};

export default function Subscribers() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { user } = useAuth();
  
  const [subscribers, setSubscribers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('subscribers');
  const [channelId, setChannelId] = useState(null);
  
  // ─── Analytics State ──────────────────────────────────────────────────────
  const [analytics, setAnalytics] = useState({
    totalArticles: 0,
    totalVideos: 0,
    totalNewspapers: 0,
    totalLikes: 0,
    totalComments: 0,
    totalSubscribers: 0,
    totalViews: 0,
    totalShares: 0,
    articleStats: [],
    videoStats: [],
    newspaperStats: [],
    engagementStats: [],
    weeklyStats: [],
    monthlyStats: [],
    articleLabels: [],
    videoLabels: [],
    newspaperLabels: [],
    weeklyLabels: [],
    engagementLabels: [],
  });
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  // ─── Animation ────────────────────────────────────────────────────────────
  const tabAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const styles = makeStyles(C);

  // ─── Bar Chart Component ──────────────────────────────────────────────────
  const BarChart = ({ data, labels, color, title, maxValue }) => {
    // Ensure data is an array
    const safeData = Array.isArray(data) ? data : [];
    const safeLabels = Array.isArray(labels) ? labels : [];
    
    if (safeData.length === 0 || safeData.every(v => v === 0)) {
      return (
        <View style={[styles.chartCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.chartTitle, { color: C.primary }]}>{title}</Text>
          <Text style={[styles.chartEmptyText, { color: C.muted }]}>No data available</Text>
        </View>
      );
    }

    const maxVal = maxValue || Math.max(...safeData, 1);
    
    return (
      <View style={[styles.chartCard, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={[styles.chartTitle, { color: C.primary }]}>{title}</Text>
        <View style={styles.chartContainer}>
          {safeData.map((value, index) => {
            const height = value > 0 ? (value / maxVal) * 120 : 4;
            return (
              <View key={index} style={styles.barWrapper}>
                <Text style={[styles.barValue, { color: C.muted }]}>{value}</Text>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: Math.max(4, height), backgroundColor: color || C.accent }]} />
                </View>
                <Text style={[styles.barLabel, { color: C.muted }]}>{safeLabels[index] || ''}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // ─── Helper to safely get array from response ─────────────────────────────
  const safeGetArray = (response, path) => {
    try {
      const data = response?.data?.data || response?.data || [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('⚠️ Error getting array:', error);
      return [];
    }
  };

  // ─── Get Channel ID ──────────────────────────────────────────────────────
  const getChannelId = async () => {
    try {
      if (user?.channelId) {
        return user.channelId;
      }
      
      console.log('📡 Fetching channel ID...');
      const channel = await channelService.getByOwner();
      if (channel && channel._id) {
        console.log('✅ Channel ID found:', channel._id);
        return channel._id;
      }
      
      console.warn('⚠️ No channel found for user');
      return null;
    } catch (error) {
      console.error('❌ Error fetching channel ID:', error);
      return null;
    }
  };

  useEffect(() => {
    initializeChannel();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const initializeChannel = async () => {
    setIsLoading(true);
    try {
      const id = await getChannelId();
      setChannelId(id);
      
      await loadSubscribers();
      
      if (id) {
        await loadAnalytics(id);
      }
    } catch (error) {
      console.error('Error initializing channel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubscribers = async () => {
    try {
      console.log('📡 Fetching subscribers...');
      const data = await channelService.getSubscribers();
      setSubscribers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading subscribers:', error);
      setSubscribers([]);
    }
  };

  const loadAnalytics = async (id) => {
    setIsAnalyticsLoading(true);
    try {
      const channelIdToUse = id || channelId;
      if (!channelIdToUse) {
        console.warn('No channel ID available for analytics');
        setIsAnalyticsLoading(false);
        return;
      }

      console.log('📡 Fetching analytics for channel:', channelIdToUse);
      
      // Get real stats from API
      const stats = await channelService.getStats(channelIdToUse);
      console.log('📊 Stats received:', stats);
      
      let likes = 0;
      let comments = 0;
      let views = 0;
      let shares = 0;
      
      // ─── Process Articles ────────────────────────────────────────────────
      let articleMonthMap = {};
      let articleWeekMap = {};
      let articleList = [];
      
      try {
        const articlesResponse = await api.get(`/articles/channel/${channelIdToUse}`);
        articleList = safeGetArray(articlesResponse);
        
        articleList.forEach(article => {
          likes += article.likes || 0;
          comments += article.comments?.length || 0;
          views += article.views || 0;
          shares += article.shares || 0;
          
          if (article.createdAt) {
            const date = new Date(article.createdAt);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
            articleMonthMap[monthKey] = (articleMonthMap[monthKey] || 0) + 1;
            
            const weekKey = `W${Math.ceil(date.getDate() / 7)}`;
            articleWeekMap[weekKey] = (articleWeekMap[weekKey] || 0) + 1;
          }
        });
        
        console.log('📊 Article months:', articleMonthMap);
        console.log('📊 Article weeks:', articleWeekMap);
        
      } catch (err) {
        console.warn('⚠️ Could not fetch article stats:', err.message);
      }
      
      // ─── Process Videos ──────────────────────────────────────────────────
      let videoMonthMap = {};
      let videoList = [];
      
      try {
        const videosResponse = await api.get(`/videos/channel/${channelIdToUse}`);
        videoList = safeGetArray(videosResponse);
        
        videoList.forEach(video => {
          likes += video.likes || 0;
          comments += video.comments?.length || 0;
          views += video.views || 0;
          shares += video.shares || 0;
          
          if (video.createdAt) {
            const date = new Date(video.createdAt);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
            videoMonthMap[monthKey] = (videoMonthMap[monthKey] || 0) + 1;
          }
        });
        
        console.log('📊 Video months:', videoMonthMap);
        
      } catch (err) {
        console.warn('⚠️ Could not fetch video stats:', err.message);
      }
      
      // ─── Process Newspapers ──────────────────────────────────────────────
      let newspaperMonthMap = {};
      let newspapers = 0;
      let newspaperList = [];
      
      try {
        const newspaperResponse = await api.get(`/newspapers/stats/${channelIdToUse}`);
        if (newspaperResponse.data?.success && newspaperResponse.data?.data) {
          newspapers = newspaperResponse.data.data.total || 0;
        }
        
        // Get newspaper list for monthly stats
        try {
          const newspapersList = await api.get(`/newspapers/channel/${channelIdToUse}`);
          newspaperList = safeGetArray(newspapersList);
          
          newspaperList.forEach(np => {
            if (np.createdAt) {
              const date = new Date(np.createdAt);
              const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
              newspaperMonthMap[monthKey] = (newspaperMonthMap[monthKey] || 0) + 1;
            }
          });
        } catch (err) {
          console.warn('⚠️ Could not fetch newspaper list:', err.message);
        }
        
        console.log('📊 Newspaper months:', newspaperMonthMap);
        
      } catch (err) {
        console.warn('⚠️ Could not fetch newspaper stats:', err.message);
      }
      
      // ─── Build Chart Data ────────────────────────────────────────────────
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      
      // Get last 6 months
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const idx = (currentMonth - i + 12) % 12;
        last6Months.push(months[idx]);
      }
      
      // Article Stats (last 6 months)
      const articleStats = last6Months.map(m => articleMonthMap[m] || 0);
      const articleLabels = last6Months;
      
      // Video Stats (last 6 months)
      const videoStats = last6Months.map(m => videoMonthMap[m] || 0);
      const videoLabels = last6Months;
      
      // Newspaper Stats (last 6 months)
      const newspaperStats = last6Months.map(m => newspaperMonthMap[m] || 0);
      const newspaperLabels = last6Months;
      
      // Weekly Stats (last 7 days)
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyStats = weekDays.map(day => {
        let count = 0;
        // Combine articleList and videoList safely
        const combined = [...(Array.isArray(articleList) ? articleList : []), ...(Array.isArray(videoList) ? videoList : [])];
        combined.forEach(item => {
          if (item && item.createdAt) {
            const date = new Date(item.createdAt);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            if (dayName === day) count++;
          }
        });
        return count;
      });
      const weeklyLabels = weekDays;
      
      // Engagement Stats (likes + comments per month)
      const engagementStats = last6Months.map(m => {
        let total = 0;
        const combined = [...(Array.isArray(articleList) ? articleList : []), ...(Array.isArray(videoList) ? videoList : [])];
        combined.forEach(item => {
          if (item && item.createdAt) {
            const date = new Date(item.createdAt);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
            if (monthKey === m) {
              total += (item.likes || 0) + (item.comments?.length || 0);
            }
          }
        });
        return total;
      });
      const engagementLabels = last6Months;

      // ─── Set Analytics State ─────────────────────────────────────────────
      setAnalytics({
        totalArticles: stats.articles || articleList.length || 0,
        totalVideos: stats.videos || videoList.length || 0,
        totalNewspapers: newspapers || 0,
        totalLikes: likes,
        totalComments: comments,
        totalSubscribers: subscribers.length || 0,
        totalViews: views,
        totalShares: shares,
        articleStats,
        videoStats,
        newspaperStats,
        engagementStats,
        weeklyStats,
        monthlyStats: last6Months.map((m, i) => ({
          label: m,
          value: articleStats[i] + videoStats[i] + newspaperStats[i]
        })),
        articleLabels,
        videoLabels,
        newspaperLabels,
        weeklyLabels,
        engagementLabels,
      });
      
      console.log('📊 Final Analytics:', {
        articleStats,
        videoStats,
        newspaperStats,
        engagementStats,
        weeklyStats,
      });
      
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSubscribers();
    if (channelId) {
      await loadAnalytics(channelId);
    }
    setRefreshing(false);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    Animated.timing(tabAnim, {
      toValue: tab === 'subscribers' ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const indicatorLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '50%'],
  });

  const formatDate = (date) => {
    if (!date) return 'Recently';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // ─── Render Subscribers Tab ──────────────────────────────────────────────
  const renderSubscribers = () => (
    <>
      <View style={[styles.statsCard, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={[styles.statsNumber, { color: C.accent }]}>{subscribers.length}</Text>
        <Text style={[styles.statsLabel, { color: C.muted }]}>Total Subscribers</Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} colors={[C.accent]} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {subscribers.length > 0 ? (
          subscribers.map((subscriber) => (
            <View key={subscriber._id || subscriber.id} style={[styles.subscriberCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              {subscriber.profilePicture || subscriber.avatar ? (
                <Image
                  source={{ uri: subscriber.profilePicture || subscriber.avatar }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: C.accent }]}>
                  <Text style={styles.avatarText}>
                    {(subscriber.name || subscriber.username || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.subscriberInfo}>
                <Text style={[styles.subscriberName, { color: C.primary }]}>{subscriber.name || subscriber.username || 'User'}</Text>
                <Text style={[styles.subscriberEmail, { color: C.muted }]}>{subscriber.email}</Text>
                <Text style={[styles.subscriberDate, { color: C.faint }]}>
                  Subscribed since {formatDate(subscriber.subscribedAt || subscriber.createdAt)}
                </Text>
              </View>
              <TouchableOpacity style={styles.messageButton} activeOpacity={0.7}>
                <Ionicons name="chatbubble-outline" size={20} color={C.accent} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <EmptyState
            icon="people-outline"
            title="No Subscribers"
            message="Your channel has no subscribers yet"
          />
        )}
      </ScrollView>
    </>
  );

  // ─── Render Analytics Tab ────────────────────────────────────────────────
  const renderAnalytics = () => (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} colors={[C.accent]} />
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.analyticsContent}
    >
      {/* Total Stats Cards */}
      <View style={styles.analyticsGrid}>
        <View style={[styles.analyticsCard, { backgroundColor: '#FF6B6B' }]}>
          <Ionicons name="newspaper-outline" size={24} color="#FFF" />
          <Text style={styles.analyticsCardNumber}>{analytics.totalArticles}</Text>
          <Text style={styles.analyticsCardLabel}>Articles</Text>
        </View>
        <View style={[styles.analyticsCard, { backgroundColor: '#4ECDC4' }]}>
          <Ionicons name="videocam-outline" size={24} color="#FFF" />
          <Text style={styles.analyticsCardNumber}>{analytics.totalVideos}</Text>
          <Text style={styles.analyticsCardLabel}>Videos</Text>
        </View>
      </View>

      <View style={styles.analyticsGrid}>
        <View style={[styles.analyticsCard, { backgroundColor: '#45B7D1' }]}>
          <Ionicons name="document-text-outline" size={24} color="#FFF" />
          <Text style={styles.analyticsCardNumber}>{analytics.totalNewspapers}</Text>
          <Text style={styles.analyticsCardLabel}>Newspapers</Text>
        </View>
        <View style={[styles.analyticsCard, { backgroundColor: '#F9CA24' }]}>
          <Ionicons name="people" size={24} color="#FFF" />
          <Text style={styles.analyticsCardNumber}>{analytics.totalSubscribers}</Text>
          <Text style={styles.analyticsCardLabel}>Subscribers</Text>
        </View>
      </View>

      <View style={styles.analyticsGrid}>
        <View style={[styles.analyticsCard, { backgroundColor: '#A29BFE' }]}>
          <Ionicons name="heart-outline" size={24} color="#FFF" />
          <Text style={styles.analyticsCardNumber}>{analytics.totalLikes}</Text>
          <Text style={styles.analyticsCardLabel}>Total Likes</Text>
        </View>
        <View style={[styles.analyticsCard, { backgroundColor: '#FD79A8' }]}>
          <Ionicons name="chatbubbles-outline" size={24} color="#FFF" />
          <Text style={styles.analyticsCardNumber}>{analytics.totalComments}</Text>
          <Text style={styles.analyticsCardLabel}>Total Comments</Text>
        </View>
      </View>

      <View style={styles.analyticsGrid}>
        <View style={[styles.analyticsCard, { backgroundColor: '#00CEC9' }]}>
          <Ionicons name="eye-outline" size={24} color="#FFF" />
          <Text style={styles.analyticsCardNumber}>{analytics.totalViews}</Text>
          <Text style={styles.analyticsCardLabel}>Total Views</Text>
        </View>
        <View style={[styles.analyticsCard, { backgroundColor: '#E17055' }]}>
          <Ionicons name="share-outline" size={24} color="#FFF" />
          <Text style={styles.analyticsCardNumber}>{analytics.totalShares}</Text>
          <Text style={styles.analyticsCardLabel}>Total Shares</Text>
        </View>
      </View>

      {/* ─── Graphs Section ──────────────────────────────────────────────── */}
      
      {/* Article Growth Chart */}
      <BarChart
        data={analytics.articleStats}
        labels={analytics.articleLabels}
        color="#FF6B6B"
        title="📈 Article Growth"
      />

      {/* Video Growth Chart */}
      <BarChart
        data={analytics.videoStats}
        labels={analytics.videoLabels}
        color="#4ECDC4"
        title="📈 Video Growth"
      />

      {/* Newspaper Growth Chart */}
      <BarChart
        data={analytics.newspaperStats}
        labels={analytics.newspaperLabels}
        color="#45B7D1"
        title="📈 Newspaper Growth"
      />

      {/* Weekly Growth Chart */}
      <BarChart
        data={analytics.weeklyStats}
        labels={analytics.weeklyLabels}
        color="#A29BFE"
        title="📊 Weekly Activity"
      />

      {/* Engagement Chart */}
      <BarChart
        data={analytics.engagementStats}
        labels={analytics.engagementLabels}
        color="#FD79A8"
        title="💬 Engagement Trends"
      />

      {/* Engagement Summary */}
      <View style={[styles.engagementCard, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={[styles.engagementTitle, { color: C.primary }]}>📊 Engagement Summary</Text>
        <View style={styles.engagementRow}>
          <View style={styles.engagementItem}>
            <Text style={[styles.engagementValue, { color: C.accent }]}>
              {analytics.totalLikes + analytics.totalComments}
            </Text>
            <Text style={[styles.engagementLabel, { color: C.muted }]}>Total Engagement</Text>
          </View>
          <View style={[styles.engagementDivider, { backgroundColor: C.border }]} />
          <View style={styles.engagementItem}>
            <Text style={[styles.engagementValue, { color: C.accent }]}>
              {analytics.totalSubscribers > 0 ? Math.round(((analytics.totalLikes + analytics.totalComments) / analytics.totalSubscribers) * 100) : 0}%
            </Text>
            <Text style={[styles.engagementLabel, { color: C.muted }]}>Engagement Rate</Text>
          </View>
          <View style={[styles.engagementDivider, { backgroundColor: C.border }]} />
          <View style={styles.engagementItem}>
            <Text style={[styles.engagementValue, { color: C.accent }]}>
              {analytics.totalViews}
            </Text>
            <Text style={[styles.engagementLabel, { color: C.muted }]}>Total Views</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  if (isLoading) {
    return <Loader message="Loading channel data..." />;
  }

  if (!channelId) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top', 'bottom']}>
        <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} translucent={false} />
        <View style={[styles.topStripe, { backgroundColor: C.accent }]} />
        <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={C.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.primary }]}>Channel Insights</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.noChannelContainer}>
          <View style={[styles.noChannelIconWrap, { backgroundColor: C.accentBg }]}>
            <Ionicons name="alert-circle-outline" size={60} color={C.accent} />
          </View>
          <Text style={[styles.noChannelTitle, { color: C.primary }]}>No Channel Found</Text>
          <Text style={[styles.noChannelSubtitle, { color: C.muted }]}>
            You need to create a channel first to view subscribers and analytics.
          </Text>
          <TouchableOpacity 
            style={[styles.createChannelButton, { backgroundColor: C.accent }]}
            onPress={() => router.push('/(owner)/CreateChannel')}
            activeOpacity={0.8}
          >
            <Text style={styles.createChannelButtonText}>Create Channel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} translucent={false} />
      
      {/* ─── Top Stripe ─────────────────────────────────────────────────────── */}
      <View style={[styles.topStripe, { backgroundColor: C.accent }]} />

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={C.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.primary }]}>Channel Insights</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton} activeOpacity={0.7}>
          <Ionicons name="refresh-outline" size={24} color={C.primary} />
        </TouchableOpacity>
      </View>

      {/* ─── Tab Switcher ───────────────────────────────────────────────── */}
      <View style={[styles.tabContainer, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <Animated.View style={[
          styles.tabIndicator,
          { left: indicatorLeft, width: '50%', backgroundColor: C.accent }
        ]} />
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'subscribers' && styles.tabButtonActive]}
          onPress={() => switchTab('subscribers')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="people-outline" 
            size={20} 
            color={activeTab === 'subscribers' ? C.accent : C.muted} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'subscribers' ? { color: C.accent, fontWeight: '700' } : { color: C.muted }
          ]}>
            Subscribers
          </Text>
          <View style={[styles.tabBadge, { backgroundColor: C.accent }]}>
            <Text style={styles.tabBadgeText}>{subscribers.length}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'analytics' && styles.tabButtonActive]}
          onPress={() => switchTab('analytics')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="analytics-outline" 
            size={20} 
            color={activeTab === 'analytics' ? C.accent : C.muted} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'analytics' ? { color: C.accent, fontWeight: '700' } : { color: C.muted }
          ]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── Content ────────────────────────────────────────────────────── */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {activeTab === 'subscribers' ? renderSubscribers() : renderAnalytics()}
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Dynamic Styles ──────────────────────────────────────────────────────────
const makeStyles = (C) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  topStripe: {
    height: verticalScale(3),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: verticalScale(56),
  },
  backButton: {
    padding: scale(4),
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    padding: scale(4),
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontScale(18),
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  // ─── Tabs ──────────────────────────────────────────────────────────────
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(4),
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderRadius: 2,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    gap: scale(6),
  },
  tabText: {
    fontSize: fontScale(14),
    fontWeight: '500',
  },
  tabBadge: {
    borderRadius: scale(10),
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(1),
    minWidth: scale(18),
    alignItems: 'center',
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: fontScale(10),
    fontWeight: '700',
  },

  // ─── Subscribers Tab ──────────────────────────────────────────────────
  statsCard: {
    margin: scale(16),
    padding: scale(20),
    borderRadius: scale(12),
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: C.cardShadowOpacity,
    shadowRadius: scale(8),
    elevation: 2,
  },
  statsNumber: {
    fontSize: fontScale(36),
    fontWeight: 'bold',
  },
  statsLabel: {
    fontSize: fontScale(14),
    marginTop: verticalScale(4),
  },
  content: {
    padding: scale(16),
    paddingTop: 0,
  },
  subscriberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
    borderRadius: scale(12),
    marginBottom: scale(12),
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: C.cardShadowOpacity,
    shadowRadius: scale(4),
    elevation: 2,
  },
  avatar: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
  },
  avatarPlaceholder: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: fontScale(20),
    fontWeight: 'bold',
  },
  subscriberInfo: {
    flex: 1,
    marginLeft: scale(12),
  },
  subscriberName: {
    fontSize: fontScale(16),
    fontWeight: '600',
  },
  subscriberEmail: {
    fontSize: fontScale(14),
  },
  subscriberDate: {
    fontSize: fontScale(12),
    marginTop: verticalScale(2),
  },
  messageButton: {
    padding: scale(8),
  },

  // ─── No Channel State ──────────────────────────────────────────────────
  noChannelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(40),
    paddingVertical: verticalScale(40),
  },
  noChannelIconWrap: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  noChannelTitle: {
    fontSize: fontScale(22),
    fontWeight: '700',
    marginTop: verticalScale(16),
  },
  noChannelSubtitle: {
    fontSize: fontScale(14),
    textAlign: 'center',
    marginTop: verticalScale(8),
    lineHeight: fontScale(20),
  },
  createChannelButton: {
    marginTop: verticalScale(24),
    paddingHorizontal: scale(32),
    paddingVertical: verticalScale(14),
    borderRadius: scale(12),
  },
  createChannelButtonText: {
    color: '#FFFFFF',
    fontSize: fontScale(16),
    fontWeight: '600',
  },

  // ─── Analytics Tab ────────────────────────────────────────────────────
  analyticsContent: {
    padding: scale(16),
    paddingBottom: verticalScale(40),
  },
  analyticsGrid: {
    flexDirection: 'row',
    gap: scale(12),
    marginBottom: scale(12),
  },
  analyticsCard: {
    flex: 1,
    padding: scale(16),
    borderRadius: scale(12),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 2,
  },
  analyticsCardNumber: {
    color: '#FFF',
    fontSize: fontScale(28),
    fontWeight: 'bold',
    marginTop: verticalScale(4),
  },
  analyticsCardLabel: {
    color: '#FFF',
    fontSize: fontScale(12),
    fontWeight: '500',
    opacity: 0.9,
  },

  // ─── Chart Styles ────────────────────────────────────────────────────
  chartCard: {
    padding: scale(16),
    borderRadius: scale(12),
    marginBottom: scale(12),
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: C.cardShadowOpacity,
    shadowRadius: scale(4),
    elevation: 2,
  },
  chartTitle: {
    fontSize: fontScale(15),
    fontWeight: '600',
    marginBottom: scale(12),
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: scale(150),
    paddingVertical: verticalScale(4),
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  barValue: {
    fontSize: fontScale(9),
    marginBottom: verticalScale(3),
  },
  barContainer: {
    height: scale(120),
    justifyContent: 'flex-end',
  },
  bar: {
    width: scale(22),
    borderRadius: scale(4),
    minHeight: scale(4),
  },
  barLabel: {
    fontSize: fontScale(9),
    marginTop: verticalScale(4),
  },
  chartEmptyText: {
    fontSize: fontScale(13),
    textAlign: 'center',
    paddingVertical: verticalScale(20),
  },

  // ─── Engagement Summary ──────────────────────────────────────────────
  engagementCard: {
    padding: scale(16),
    borderRadius: scale(12),
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: C.cardShadowOpacity,
    shadowRadius: scale(4),
    elevation: 2,
    marginTop: scale(4),
  },
  engagementTitle: {
    fontSize: fontScale(16),
    fontWeight: '600',
    marginBottom: scale(12),
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  engagementItem: {
    alignItems: 'center',
    flex: 1,
  },
  engagementValue: {
    fontSize: fontScale(24),
    fontWeight: 'bold',
  },
  engagementLabel: {
    fontSize: fontScale(12),
    marginTop: verticalScale(4),
  },
  engagementDivider: {
    width: StyleSheet.hairlineWidth,
    height: scale(40),
  },
});