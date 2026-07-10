// app/(viewer)/Home.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  FlatList,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useArticles } from '../../hooks/useArticles';
import { useChannels } from '../../hooks/useChannels';
import { useVideos } from '../../hooks/useVideos';
import NewsCard from '../../components/NewsCard';
import ChannelCard from '../../components/ChannelCard';
import VideoCard from '../../components/VideoCard';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import { useRouter, useFocusEffect } from 'expo-router';

const { width, height } = Dimensions.get('window');

// ─── Theme Colors ──────────────────────────────────────────────────────────
const COLORS = {
  light: {
    background: '#F8F9FA',
    surface: '#FFFFFF',
    border: '#F0F0F0',
    text: '#333333',
    textSecondary: '#888888',
    textLight: '#666666',
    accent: '#C8001A',
    accentLight: '#FFF0F2',
    shadow: 'rgba(0,0,0,0.1)',
    categoryBg: '#F0F0F0',
    categoryActive: '#C8001A',
    categoryText: '#666666',
    categoryTextActive: '#FFFFFF',
    notificationDot: '#FF4444',
  },
  dark: {
    background: '#0D1117',
    surface: '#161B22',
    border: '#2A3340',
    text: '#EDF2F7',
    textSecondary: '#8B9BAB',
    textLight: '#5C6E80',
    accent: '#E8192C',
    accentLight: 'rgba(232,25,44,0.12)',
    shadow: 'rgba(0,0,0,0.3)',
    categoryBg: '#1C2330',
    categoryActive: '#E8192C',
    categoryText: '#8B9BAB',
    categoryTextActive: '#FFFFFF',
    notificationDot: '#FF4444',
  },
};

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { articles = [], loading: articlesLoading, fetchArticles } = useArticles();
  const { channels = [], loading: channelsLoading, fetchChannels } = useChannels();
  const { videos = [], loading: videosLoading, fetchVideos } = useVideos();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const categories = [
    { id: 'all', label: 'All', icon: 'apps-outline' },
    { id: 'news', label: 'News', icon: 'newspaper-outline' },
    { id: 'entertainment', label: 'Entertainment', icon: 'film-outline' },
    { id: 'sports', label: 'Sports', icon: 'basketball-outline' },
    { id: 'business', label: 'Business', icon: 'business-outline' },
    { id: 'technology', label: 'Tech', icon: 'hardware-chip-outline' },
    { id: 'lifestyle', label: 'Lifestyle', icon: 'leaf-outline' },
  ];

  const COL = COLORS.light;

  // ─── Navigation Handlers ────────────────────────────────────────────────
  const handleArticlePress = (articleId) => {
    if (!articleId) {
      console.error('Article ID is required');
      return;
    }
    router.push(`/(viewer)/ArticleDetails?id=${articleId}`);
  };

  const handleChannelPress = (channelId) => {
    if (!channelId) {
      console.error('Channel ID is required');
      return;
    }
    router.push(`/(viewer)/ChannelDetails?id=${channelId}`);
  };

  const handleVideoPress = (videoId) => {
    if (!videoId) {
      console.error('Video ID is required');
      return;
    }
    router.push(`/(viewer)/VideoPlayer?id=${videoId}`);
  };

  // ─── Load Data ──────────────────────────────────────────────────────────
  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchArticles({ 
          limit: 50, 
          sort: '-createdAt',
          isPublished: true,
        }),
        fetchChannels({ 
          limit: 50,
          isActive: true,
        }),
        fetchVideos({ 
          limit: 50, 
          sort: '-createdAt',
          isPublished: true,
        }),
      ]);
      
      console.log('✅ Articles loaded:', articles.length);
      console.log('✅ Channels loaded:', channels.length);
      console.log('✅ Videos loaded:', videos.length);

    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Refresh on focus (only when user navigates back) ──────────────────
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Home screen focused - refreshing data');
      loadData();
      return () => {};
    }, [])
  );

  // ─── Load on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: COL.surface, borderBottomColor: COL.border }]}>
      <View style={styles.headerTop}>
        <View style={styles.greetingContainer}>
          <Text style={[styles.greeting, { color: COL.text }]}>
            Hello, {user?.displayName || 'User'}! 👋
          </Text>
          <Text style={[styles.subGreeting, { color: COL.textSecondary }]}>
            Discover news from across the world
          </Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push('/(viewer)/Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={COL.text} />
          {notificationCount > 0 && (
            <View style={[styles.notificationBadge, { backgroundColor: COL.notificationDot }]}>
              <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              { backgroundColor: COL.categoryBg },
              selectedCategory === category.id && { backgroundColor: COL.categoryActive },
            ]}
            onPress={() => {
              setSelectedCategory(category.id);
              loadDataWithCategory(category.id);
            }}
          >
            <Ionicons
              name={category.icon}
              size={18}
              color={selectedCategory === category.id ? COL.categoryTextActive : COL.categoryText}
            />
            <Text
              style={[
                styles.categoryText,
                { color: selectedCategory === category.id ? COL.categoryTextActive : COL.categoryText },
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const loadDataWithCategory = async (category) => {
    setIsLoading(true);
    try {
      const params = {
        limit: 50,
        sort: '-createdAt',
        isPublished: true,
      };
      if (category !== 'all') {
        params.category = category;
      }
      
      await Promise.all([
        fetchArticles(params),
        fetchChannels({ limit: 50, isActive: true }),
        fetchVideos(params),
      ]);
    } catch (error) {
      console.error('Error loading filtered data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFeatured = () => {
    const featuredArticles = (articles || []).filter(a => a?.isFeatured).slice(0, 3);
    if (featuredArticles.length === 0) return null;

    return (
      <View style={styles.featuredSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: COL.text }]}>Featured News</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAllText, { color: COL.accent }]}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredContainer}
          nestedScrollEnabled={true}
        >
          {featuredArticles.map((article) => (
            <TouchableOpacity
              key={article._id || article.id}
              style={[styles.featuredCard, { backgroundColor: COL.surface }]}
              onPress={() => handleArticlePress(article._id || article.id)}
            >
              <Image
                source={{ uri: article.image || 'https://via.placeholder.com/300x200' }}
                style={styles.featuredImage}
              />
              <View style={[styles.featuredOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <View style={[styles.featuredBadge, { backgroundColor: COL.accent }]}>
                  <Text style={styles.featuredBadgeText}>Featured</Text>
                </View>
                <Text style={styles.featuredTitle} numberOfLines={2}>
                  {article.title || 'Untitled'}
                </Text>
                <Text style={styles.featuredSource}>
                  {article.channel?.channelName || article.channel?.name || 'Unknown Channel'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderChannels = () => {
    if (!channels || channels.length === 0) return null;
    
    // Sort channels by followers count (most popular first)
    const sortedChannels = [...channels].sort((a, b) => (b.followers || 0) - (a.followers || 0));
    
    return (
      <View style={styles.channelsSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: COL.text }]}>Popular Channels</Text>
          <TouchableOpacity onPress={() => router.push('/(viewer)/Search')}>
            <Text style={[styles.seeAllText, { color: COL.accent }]}>View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.channelsContainer}
          nestedScrollEnabled={true}
          decelerationRate="fast"
          snapToAlignment="start"
        >
          {sortedChannels.slice(0, 10).map((channel) => (
            <View key={channel._id || channel.id} style={styles.channelItemWrapper}>
              <ChannelCard
                channel={channel}
                onPress={() => handleChannelPress(channel._id || channel.id)}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // ─── Combine Articles and Videos for Feed ──────────────────────────────
  const getCombinedFeed = () => {
    const feed = [];
    const articlesList = (articles || []).filter(article => 
      selectedCategory === 'all' || article?.category === selectedCategory
    );
    const videosList = (videos || []).filter(video => 
      selectedCategory === 'all' || video?.category === selectedCategory
    );
    
    articlesList.forEach(article => {
      feed.push({
        type: 'article',
        data: article,
        id: article._id || article.id,
        createdAt: article.createdAt || article.publishedAt,
      });
    });
    
    videosList.forEach(video => {
      feed.push({
        type: 'video',
        data: video,
        id: video._id || video.id,
        createdAt: video.createdAt || video.publishedAt,
      });
    });
    
    feed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return feed;
  };

  const renderFeedItem = ({ item }) => {
    if (item.type === 'article') {
      return (
        <NewsCard
          article={item.data}
          onPress={() => handleArticlePress(item.data._id || item.data.id)}
        />
      );
    } else {
      return (
        <VideoCard
          video={item.data}
          onPress={() => handleVideoPress(item.data._id || item.data.id)}
        />
      );
    }
  };

  const feedData = getCombinedFeed();

  // Loading state
  if (isLoading) {
    return <Loader message="Loading news..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COL.background }]} edges={['top']}>
      <FlatList
        data={feedData}
        keyExtractor={(item) => item.id || `${item.type}-${Math.random()}`}
        renderItem={renderFeedItem}
        ListHeaderComponent={
          <>
            {renderHeader()}
            {renderFeatured()}
            {renderChannels()}
            <View style={styles.latestSection}>
              <Text style={[styles.sectionTitle, { color: COL.text }]}>Latest News</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="newspaper-outline"
            title="No Content Found"
            message="No articles or videos available. Check back later!"
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COL.accent} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        nestedScrollEnabled={true}
        scrollEnabled={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 30,
    paddingTop: Platform.OS === 'android' ? 0 : 0,
  },
  header: {
    paddingHorizontal: width * 0.05,
    paddingTop: Platform.OS === 'ios' ? 10 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  greetingContainer: {
    flex: 1,
    marginRight: 10,
  },
  greeting: {
    fontSize: width * 0.055,
    fontWeight: 'bold',
  },
  subGreeting: {
    fontSize: width * 0.035,
    marginTop: 2,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryContainer: {
    paddingVertical: 4,
    gap: 10,
    paddingRight: width * 0.05,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  featuredSection: {
    marginTop: 20,
    paddingLeft: width * 0.05,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: width * 0.05,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: width * 0.035,
    fontWeight: '500',
  },
  featuredContainer: {
    paddingRight: width * 0.05,
    gap: 12,
  },
  featuredCard: {
    width: width * 0.7,
    height: width * 0.5,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  featuredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  featuredBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  featuredTitle: {
    color: '#FFF',
    fontSize: width * 0.04,
    fontWeight: 'bold',
  },
  featuredSource: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: width * 0.03,
    marginTop: 4,
  },
  channelsSection: {
    marginTop: 24,
    paddingLeft: width * 0.05,
  },
  channelsContainer: {
    paddingRight: width * 0.05,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelItemWrapper: {
    marginRight: 12,
  },
  latestSection: {
    paddingHorizontal: width * 0.05,
    marginTop: 20,
    marginBottom: 12,
  },
});