// app/(owner)/Dashboard.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Alert,
  useColorScheme,
  PixelRatio,
  Modal,
  TouchableWithoutFeedback,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../services/firebase';
import { getChannelByOwner, getChannelStats } from '../../services/channelService';
import { getOwnerArticles } from '../../services/articleService';
import { getOwnerVideos } from '../../services/videoService';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';

// ─── Responsive helpers ──────────────────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base design dimensions (iPhone 14 Pro)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

// Responsive scaling functions
const scale = (size) => {
  const scaleFactor = SCREEN_WIDTH / BASE_WIDTH;
  const clamped = Math.min(Math.max(scaleFactor, 0.7), 1.3);
  return Math.round(clamped * size);
};

const verticalScale = (size) => {
  const scaleFactor = SCREEN_HEIGHT / BASE_HEIGHT;
  const clamped = Math.min(Math.max(scaleFactor, 0.7), 1.3);
  return Math.round(clamped * size);
};

const moderateScale = (size, factor = 0.5) => {
  return Math.round(size + (scale(size) - size) * factor);
};

const fontScale = (size) => {
  const scaleFactor = Math.min(
    SCREEN_WIDTH / BASE_WIDTH,
    SCREEN_HEIGHT / BASE_HEIGHT
  );
  const clamped = Math.min(Math.max(scaleFactor, 0.7), 1.3);
  return Math.round(size * clamped / PixelRatio.getFontScale());
};

// ─── Theme ───────────────────────────────────────────────────────────────────
const LIGHT = {
  bg:               '#F2F0EB',
  surface:          '#FFFFFF',
  surfaceAlt:       '#FAFAF8',
  border:           '#E4E0D8',
  accent:           '#C8001A',
  accentBg:         '#FFF0F2',
  accentBorder:     'rgba(200,0,26,0.18)',
  navy:             '#0F1923',
  primary:          '#1A2733',
  secondary:        '#4A5A6B',
  muted:            '#8A97A5',
  faint:            '#B8C0B8',
  white:            '#FFFFFF',
  statusBar:        'dark-content',
  cardShadowOpacity: 0.06,
  iconBlue:         '#1A6DC8',
  iconBlueBg:       '#EFF5FF',
  iconGreen:        '#0E8A5A',
  iconGreenBg:      '#EDFAF3',
  iconPurple:       '#7C3AED',
  iconPurpleBg:     '#F5F0FF',
  iconAmber:        '#B87500',
  iconAmberBg:      '#FFF7E8',
};

const DARK = {
  bg:               '#0D1117',
  surface:          '#161B22',
  surfaceAlt:       '#1C2330',
  border:           '#2A3340',
  accent:           '#E8192C',
  accentBg:         'rgba(232,25,44,0.12)',
  accentBorder:     'rgba(232,25,44,0.25)',
  navy:             '#E8EDF2',
  primary:          '#EDF2F7',
  secondary:        '#8B9BAB',
  muted:            '#5C6E80',
  faint:            '#3A4A58',
  white:            '#FFFFFF',
  statusBar:        'light-content',
  cardShadowOpacity: 0.35,
  iconBlue:         '#60A5FA',
  iconBlueBg:       'rgba(96,165,250,0.12)',
  iconGreen:        '#34D399',
  iconGreenBg:      'rgba(52,211,153,0.12)',
  iconPurple:       '#A78BFA',
  iconPurpleBg:     'rgba(167,139,250,0.12)',
  iconAmber:        '#FBBF24',
  iconAmberBg:      'rgba(251,191,36,0.12)',
};

// ─── Pro Tips Data ──────────────────────────────────────────────────────────
const PRO_TIPS = [
  {
    id: 1,
    title: '🚀 Grow Your Audience',
    text: 'Regular posting helps grow your audience. Try to publish at least 3 articles per week!',
    icon: 'rocket-outline',
  },
  {
    id: 2,
    title: '📸 Visual Content',
    text: 'Posts with images get 94% more views. Always add a cover image to your articles!',
    icon: 'image-outline',
  },
  {
    id: 3,
    title: '📱 Mobile First',
    text: '80% of users access news on mobile. Optimize your content for mobile viewing!',
    icon: 'phone-portrait-outline',
  },
  {
    id: 4,
    title: '⏰ Best Time to Post',
    text: 'Post between 7-9 AM and 6-8 PM for maximum engagement with your audience.',
    icon: 'time-outline',
  },
  {
    id: 5,
    title: '🎯 Know Your Audience',
    text: 'Use analytics to understand what content resonates most with your followers.',
    icon: 'analytics-outline',
  },
  {
    id: 6,
    title: '📝 Engaging Headlines',
    text: 'Strong headlines increase click-through rates by up to 500%. Make them count!',
    icon: 'megaphone-outline',
  },
];

export default function Dashboard() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { isLoading: authLoading } = useAuth();
  const [channel, setChannel] = useState(null);
  const [stats, setStats] = useState({ articles: 0, videos: 0, newspapers: 0, followers: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [newspaperModalVisible, setNewspaperModalVisible] = useState(false);
  const [subscribersModalVisible, setSubscribersModalVisible] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  
  // ─── Animation Refs ──────────────────────────────────────────────────────
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // ─── Get channel logo from channel data ──────────────────────────────────
  const channelLogo = channel?.logo || null;
  const channelName = channel?.channelName || 'My Channel';

  useEffect(() => {
    if (authLoading) return;
    if (!auth.currentUser) return;
    loadDashboardData();
  }, [authLoading]);

  // ─── Auto-refresh when screen comes into focus ──────────────────────────
  useFocusEffect(
    useCallback(() => {
      console.log('📱 Dashboard focused - refreshing data...');
      if (!authLoading && auth.currentUser) {
        loadDashboardData();
      }
      return () => {};
    }, [authLoading])
  );

  // ─── Pro Tip Carousel Animation ──────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Change tip
        setCurrentTipIndex((prev) => (prev + 1) % PRO_TIPS.length);
        // Reset animation
        slideAnim.setValue(20);
        // Fade in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('📊 Loading dashboard data...');

      const channelData = await getChannelByOwner();
      console.log('📊 Channel data:', channelData);

      if (channelData) {
        setChannel(channelData);
        
        // Get stats
        try {
          const statsData = await getChannelStats(channelData._id || channelData.id);
          console.log('📊 Stats data:', statsData);
          setStats(statsData);
        } catch (statsErr) {
          console.warn('⚠️ Stats load failed:', statsErr.message);
        }

        // ─── Load recent activities ──────────────────────────────────────
        try {
          const [articles, videos] = await Promise.all([
            getOwnerArticles(channelData._id),
            getOwnerVideos(channelData._id)
          ]);
          
          console.log('📊 Articles for recent:', articles?.length || 0);
          console.log('📊 Videos for recent:', videos?.length || 0);
          
          // Combine and sort by date
          const activities = [];
          
          // Add articles
          if (articles && articles.length > 0) {
            articles.forEach(article => {
              activities.push({
                id: article._id,
                type: 'article',
                title: article.title || 'Untitled Article',
                createdAt: article.createdAt || article.publishedAt || new Date().toISOString(),
                icon: 'newspaper-outline',
                color: C.accent,
                bgColor: C.accentBg,
                route: 'ManagePosts',
              });
            });
          }
          
          // Add videos
          if (videos && videos.length > 0) {
            videos.forEach(video => {
              activities.push({
                id: video._id,
                type: 'video',
                title: video.title || 'Untitled Video',
                createdAt: video.createdAt || video.publishedAt || new Date().toISOString(),
                icon: 'videocam-outline',
                color: C.iconBlue,
                bgColor: C.iconBlueBg,
                route: 'ManagePosts',
              });
            });
          }
          
          // Sort by date (newest first)
          activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          // Take only the 5 most recent
          setRecentActivities(activities.slice(0, 5));
          console.log('📊 Recent activities:', activities.length);
          
        } catch (activityErr) {
          console.warn('⚠️ Recent activities load failed:', activityErr.message);
          setRecentActivities([]);
        }
        
      } else {
        setChannel(null);
        setRecentActivities([]);
      }
    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
      if (!error.message?.includes('404') && !error.message?.includes('not found')) {
        Alert.alert('Error', 'Failed to load dashboard data');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // ─── Upload Modal Handlers ──────────────────────────────────────────────
  const handleUploadPress = () => {
    if (!channel) {
      Alert.alert('No Channel', 'Create a channel first');
      return;
    }
    setUploadModalVisible(true);
  };

  const handleUploadOption = (route) => {
    setUploadModalVisible(false);
    router.push(route);
  };

  // ─── Newspaper Modal Handlers ─────────────────────────────────────────────
  const handleNewspaperPress = () => {
    if (!channel) {
      Alert.alert('No Channel', 'Create a channel first');
      return;
    }
    setNewspaperModalVisible(true);
  };

  const handleNewspaperOption = (route) => {
    setNewspaperModalVisible(false);
    router.push(route);
  };

  // ─── Subscribers Modal Handlers ─────────────────────────────────────────
  const handleSubscribersPress = () => {
    if (!channel) {
      Alert.alert('No Channel', 'Create a channel first');
      return;
    }
    setSubscribersModalVisible(true);
  };

  const handleSubscribersOption = (route) => {
    setSubscribersModalVisible(false);
    router.push(route);
  };

  const handleRecentActivityPress = (activity) => {
    if (activity.route) {
      router.push(activity.route);
    }
  };

  // ─── Format time ago ──────────────────────────────────────────────────────
  const timeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };

  const quickActions = [
    { 
      id: '1', 
      icon: 'cloud-upload-outline', 
      title: 'Upload', 
      color: C.accent, 
      onPress: handleUploadPress 
    },
    { 
      id: '2', 
      icon: 'newspaper-outline', // ✅ Changed from radio-outline
      title: 'Newspaper', // ✅ Changed from Go Live
      color: C.iconGreen, 
      onPress: handleNewspaperPress 
    },
    { 
      id: '3', 
      icon: 'people-outline', 
      title: 'Subscribers', 
      color: C.iconPurple, 
      onPress: handleSubscribersPress 
    },
  ];

  const statCards = [
    { id: '1', label: 'Articles', value: stats.articles || 0, icon: 'newspaper-outline', color: C.accent, bg: C.accentBg },
    { id: '2', label: 'Videos', value: stats.videos || 0, icon: 'videocam-outline', color: C.iconBlue, bg: C.iconBlueBg },
    { id: '3', label: 'Newspapers', value: stats.newspapers || 0, icon: 'newspaper-outline', color: C.iconGreen, bg: C.iconGreenBg }, // ✅ Changed from Live
    { id: '4', label: 'Followers', value: stats.followers || 0, icon: 'people-outline', color: C.iconPurple, bg: C.iconPurpleBg },
  ];

  const styles = makeStyles(C);

  if (authLoading) return <Loader message="Loading…" />;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={[styles.loadingText, { color: C.secondary }]}>Loading dashboard…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!channel) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <EmptyState
          icon="mic-outline"
          title="No Channel Found"
          message="You haven't created a channel yet. Create your news channel to start publishing!"
          buttonText="Create Channel"
          onPress={() => router.push('CreateChannel')}
        />
      </SafeAreaView>
    );
  }

  const currentTip = PRO_TIPS[currentTipIndex];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={[styles.topStripe, { backgroundColor: C.accent }]} />

      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={C.accent}
            colors={[C.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        bounces={true}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: C.muted }]}>Welcome back</Text>
            <Text style={[styles.channelName, { color: C.primary }]} numberOfLines={1}>
              {channelName}
            </Text>
            {channel.isVerified && (
              <View style={styles.verifiedRow}>
                <Ionicons name="checkmark-circle" size={moderateScale(14)} color="#0E8A5A" />
                <Text style={[styles.verifiedText, { color: '#0E8A5A' }]}>Verified Channel</Text>
              </View>
            )}
          </View>
          
          {/* ─── Channel Logo Button ─────────────────────────────────────────── */}
          <TouchableOpacity 
            style={[styles.profileBtn, { backgroundColor: C.bg, borderColor: C.border }]} 
            onPress={() => router.push('Profile')}
            activeOpacity={0.7}
          >
            {channelLogo ? (
              <Image 
                source={{ uri: channelLogo }} 
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: C.accentBg }]}>
                <Text style={[styles.logoPlaceholderText, { color: C.accent }]}>
                  {channelName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statCards.map((s) => (
            <View key={s.id} style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              <View style={[styles.statIconBg, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon} size={moderateScale(22)} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: C.primary }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: C.muted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: C.primary }]}>Quick Actions</Text>
        </View>
        <View style={styles.actionsGrid}>
          {quickActions.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={[styles.actionCard, { backgroundColor: C.surface, borderColor: C.border }]}
              activeOpacity={0.8}
              onPress={a.onPress}
            >
              <View style={[styles.actionIconBg, { backgroundColor: a.color + '18' }]}>
                <Ionicons name={a.icon} size={moderateScale(26)} color={a.color} />
              </View>
              <Text style={[styles.actionTitle, { color: C.primary }]}>{a.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Recent Activity ─────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: C.primary }]}>Recent Activity</Text>
        </View>
        <View style={[styles.recentCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => (
              <TouchableOpacity
                key={activity.id}
                style={[
                  styles.recentRow,
                  index < recentActivities.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border }
                ]}
                onPress={() => handleRecentActivityPress(activity)}
                activeOpacity={0.7}
              >
                <View style={[styles.recentIcon, { backgroundColor: activity.bgColor || C.accentBg }]}>
                  <Ionicons name={activity.icon} size={moderateScale(16)} color={activity.color || C.accent} />
                </View>
                <View style={styles.recentContent}>
                  <Text style={[styles.recentTitle, { color: C.primary }]} numberOfLines={1}>
                    {activity.title}
                  </Text>
                  <Text style={[styles.recentSub, { color: C.muted }]}>
                    {activity.type === 'article' ? '📄 Article' : '🎬 Video'} • {timeAgo(activity.createdAt)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={moderateScale(18)} color={C.muted} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.recentEmpty}>
              <Ionicons name="time-outline" size={moderateScale(32)} color={C.muted} />
              <Text style={[styles.recentEmptyTitle, { color: C.secondary }]}>No recent activity</Text>
              <Text style={[styles.recentEmptySub, { color: C.muted }]}>Start publishing to see activity here</Text>
            </View>
          )}
        </View>

        {/* ─── Manage Articles & Videos ────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.manageCard, { backgroundColor: C.surface, borderColor: C.border }]}
          onPress={() => router.push('ManagePosts')}
          activeOpacity={0.7}
        >
          <View style={styles.manageContent}>
            <View style={[styles.manageIconWrap, { backgroundColor: C.accentBg }]}>
              <Ionicons name="folder-open-outline" size={moderateScale(24)} color={C.accent} />
            </View>
            <View style={styles.manageTextWrap}>
              <Text style={[styles.manageTitle, { color: C.primary }]}>Manage Articles & Videos</Text>
              <Text style={[styles.manageSubtext, { color: C.muted }]}>
                View, edit, and manage all your published content
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={moderateScale(20)} color={C.muted} />
          </View>
        </TouchableOpacity>

        {/* ─── Pro Tip Carousel ────────────────────────────────────────────── */}
        <Animated.View 
          style={[
            styles.tipCard, 
            { 
              backgroundColor: C.accentBg, 
              borderColor: C.accentBorder,
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            }
          ]}
        >
          <View style={[styles.tipIconWrap, { backgroundColor: C.accent + '18' }]}>
            <Ionicons name={currentTip.icon} size={moderateScale(22)} color={C.accent} />
          </View>
          <View style={styles.tipContent}>
            <Text style={[styles.tipTitle, { color: C.primary }]}>{currentTip.title}</Text>
            <Text style={[styles.tipText, { color: C.secondary }]}>{currentTip.text}</Text>
          </View>
        </Animated.View>

        {/* ─── Dots Indicator ────────────────────────────────────────────────── */}
        <View style={styles.dotsContainer}>
          {PRO_TIPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentTipIndex ? C.accent : C.border,
                  width: index === currentTipIndex ? scale(16) : scale(6),
                },
              ]}
            />
          ))}
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ─── Upload Selection Modal ─────────────────────────────────────── */}
      <Modal
        visible={uploadModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setUploadModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContainer, { backgroundColor: C.surface }]}>
                <View style={[styles.modalHandle, { backgroundColor: C.border }]} />
                <View style={[styles.modalHeader, { borderBottomColor: C.border }]}>
                  <Text style={[styles.modalTitle, { color: C.primary }]}>Choose Upload Type</Text>
                  <TouchableOpacity
                    style={[styles.modalCloseBtn, { backgroundColor: C.accentBg }]}
                    onPress={() => setUploadModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={moderateScale(22)} color={C.accent} />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalContent}>
                  <TouchableOpacity
                    style={[styles.uploadOption, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}
                    onPress={() => handleUploadOption('UploadArticle')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optionIconWrap, { backgroundColor: C.accentBg }]}>
                      <Ionicons name="create-outline" size={moderateScale(32)} color={C.accent} />
                    </View>
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionTitle, { color: C.primary }]}>Upload Article</Text>
                      <Text style={[styles.optionSubtext, { color: C.muted }]}>
                        Write and publish a news article
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={moderateScale(20)} color={C.muted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.uploadOption, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}
                    onPress={() => handleUploadOption('UploadVideo')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optionIconWrap, { backgroundColor: C.iconBlueBg }]}>
                      <Ionicons name="videocam-outline" size={moderateScale(32)} color={C.iconBlue} />
                    </View>
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionTitle, { color: C.primary }]}>Upload Video</Text>
                      <Text style={[styles.optionSubtext, { color: C.muted }]}>
                        Upload and share video content
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={moderateScale(20)} color={C.muted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cancelBtn, { borderColor: C.border }]}
                    onPress={() => setUploadModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.cancelBtnText, { color: C.secondary }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Newspaper Selection Modal ────────────────────────────────────── */}
      <Modal
        visible={newspaperModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setNewspaperModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setNewspaperModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContainer, { backgroundColor: C.surface }]}>
                <View style={[styles.modalHandle, { backgroundColor: C.border }]} />
                <View style={[styles.modalHeader, { borderBottomColor: C.border }]}>
                  <Text style={[styles.modalTitle, { color: C.primary }]}>Newspaper</Text>
                  <TouchableOpacity
                    style={[styles.modalCloseBtn, { backgroundColor: C.iconGreenBg }]}
                    onPress={() => setNewspaperModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={moderateScale(22)} color={C.iconGreen} />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalContent}>
                  <TouchableOpacity
                    style={[styles.uploadOption, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}
                    onPress={() => handleNewspaperOption('CreateNewspaper')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optionIconWrap, { backgroundColor: C.iconGreenBg }]}>
                      <Ionicons name="newspaper-outline" size={moderateScale(32)} color={C.iconGreen} />
                    </View>
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionTitle, { color: C.primary }]}>Create Newspaper</Text>
                      <Text style={[styles.optionSubtext, { color: C.muted }]}>
                        Create a daily newspaper with multiple pages
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={moderateScale(20)} color={C.muted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.uploadOption, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}
                    onPress={() => handleNewspaperOption('NewspaperHistory')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optionIconWrap, { backgroundColor: C.iconAmberBg }]}>
                      <Ionicons name="time-outline" size={moderateScale(32)} color={C.iconAmber} />
                    </View>
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionTitle, { color: C.primary }]}>Newspaper History</Text>
                      <Text style={[styles.optionSubtext, { color: C.muted }]}>
                        View your published newspapers
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={moderateScale(20)} color={C.muted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cancelBtn, { borderColor: C.border }]}
                    onPress={() => setNewspaperModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.cancelBtnText, { color: C.secondary }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Subscribers Selection Modal ────────────────────────────────── */}
      <Modal
        visible={subscribersModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSubscribersModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setSubscribersModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContainer, { backgroundColor: C.surface }]}>
                <View style={[styles.modalHandle, { backgroundColor: C.border }]} />
                <View style={[styles.modalHeader, { borderBottomColor: C.border }]}>
                  <Text style={[styles.modalTitle, { color: C.primary }]}>Subscribers</Text>
                  <TouchableOpacity
                    style={[styles.modalCloseBtn, { backgroundColor: C.iconPurpleBg }]}
                    onPress={() => setSubscribersModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={moderateScale(22)} color={C.iconPurple} />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalContent}>
                  <TouchableOpacity
                    style={[styles.uploadOption, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}
                    onPress={() => handleSubscribersOption('Subscribers')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optionIconWrap, { backgroundColor: C.iconPurpleBg }]}>
                      <Ionicons name="people-outline" size={moderateScale(32)} color={C.iconPurple} />
                    </View>
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionTitle, { color: C.primary }]}>View Subscribers</Text>
                      <Text style={[styles.optionSubtext, { color: C.muted }]}>
                        See all your channel subscribers
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={moderateScale(20)} color={C.muted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.uploadOption, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}
                    onPress={() => handleSubscribersOption('Subscribers')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optionIconWrap, { backgroundColor: C.iconAmberBg }]}>
                      <Ionicons name="analytics-outline" size={moderateScale(32)} color={C.iconAmber} />
                    </View>
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionTitle, { color: C.primary }]}>Analytics</Text>
                      <Text style={[styles.optionSubtext, { color: C.muted }]}>
                        View subscriber growth and engagement
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={moderateScale(20)} color={C.muted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cancelBtn, { borderColor: C.border }]}
                    onPress={() => setSubscribersModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.cancelBtnText, { color: C.secondary }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: C.bg,
    },
    topStripe: {
      height: verticalScale(3),
    },
    content: {
      flexGrow: 1,
      paddingBottom: verticalScale(20),
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: verticalScale(12),
    },
    loadingText: {
      fontSize: fontScale(14),
      fontWeight: '500',
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: scale(20),
      paddingTop: verticalScale(16),
      paddingBottom: verticalScale(14),
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerLeft: {
      flex: 1,
    },
    greeting: {
      fontSize: fontScale(12),
      fontWeight: '500',
      letterSpacing: 0.2,
    },
    channelName: {
      fontSize: fontScale(22),
      fontWeight: '800',
      letterSpacing: -0.5,
      marginTop: verticalScale(2),
    },
    verifiedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(4),
      marginTop: verticalScale(3),
    },
    verifiedText: {
      fontSize: fontScale(12),
      fontWeight: '600',
    },
    profileBtn: {
      width: scale(44),
      height: scale(44),
      borderRadius: scale(22),
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      overflow: 'hidden',
    },
    profileImage: {
      width: scale(44),
      height: scale(44),
      borderRadius: scale(22),
    },
    logoPlaceholder: {
      width: scale(44),
      height: scale(44),
      borderRadius: scale(22),
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoPlaceholderText: {
      fontSize: fontScale(20),
      fontWeight: '700',
    },

    // Stats Grid
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: scale(14),
      gap: scale(12),
    },
    statCard: {
      flex: 1,
      minWidth: (SCREEN_WIDTH - scale(52)) / 2,
      padding: scale(16),
      borderRadius: scale(14),
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(2) },
      shadowOpacity: C.cardShadowOpacity,
      shadowRadius: scale(8),
      elevation: 2,
    },
    statIconBg: {
      width: scale(48),
      height: scale(48),
      borderRadius: scale(24),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: verticalScale(8),
    },
    statValue: {
      fontSize: fontScale(26),
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    statLabel: {
      fontSize: fontScale(12),
      fontWeight: '500',
      marginTop: verticalScale(2),
    },

    // Section Header
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: scale(20),
      marginBottom: verticalScale(10),
      marginTop: verticalScale(4),
    },
    sectionTitle: {
      fontSize: fontScale(16),
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    seeAll: {
      fontSize: fontScale(13),
      fontWeight: '600',
    },

    // Actions Grid
    actionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: scale(14),
      gap: scale(12),
      marginBottom: verticalScale(12),
    },
    actionCard: {
      flex: 1,
      minWidth: (SCREEN_WIDTH - scale(52)) / 2,
      padding: scale(16),
      borderRadius: scale(14),
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(2) },
      shadowOpacity: C.cardShadowOpacity,
      shadowRadius: scale(8),
      elevation: 2,
    },
    actionIconBg: {
      width: scale(56),
      height: scale(56),
      borderRadius: scale(28),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: verticalScale(8),
    },
    actionTitle: {
      fontSize: fontScale(13),
      fontWeight: '600',
      textAlign: 'center',
    },

    // Recent Activity
    recentCard: {
      marginHorizontal: scale(20),
      padding: scale(16),
      borderRadius: scale(14),
      borderWidth: StyleSheet.hairlineWidth,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(2) },
      shadowOpacity: C.cardShadowOpacity,
      shadowRadius: scale(8),
      elevation: 2,
      marginBottom: verticalScale(8),
    },
    recentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: verticalScale(10),
      gap: scale(12),
    },
    recentIcon: {
      width: scale(36),
      height: scale(36),
      borderRadius: scale(10),
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    recentContent: {
      flex: 1,
    },
    recentTitle: {
      fontSize: fontScale(14),
      fontWeight: '600',
    },
    recentSub: {
      fontSize: fontScale(12),
      marginTop: verticalScale(2),
    },
    recentEmpty: {
      alignItems: 'center',
      paddingVertical: verticalScale(20),
      gap: verticalScale(6),
    },
    recentEmptyTitle: {
      fontSize: fontScale(15),
      fontWeight: '600',
    },
    recentEmptySub: {
      fontSize: fontScale(13),
    },

    // Manage Card
    manageCard: {
      marginHorizontal: scale(20),
      padding: scale(16),
      borderRadius: scale(14),
      borderWidth: StyleSheet.hairlineWidth,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(2) },
      shadowOpacity: C.cardShadowOpacity,
      shadowRadius: scale(8),
      elevation: 2,
      marginBottom: verticalScale(16),
    },
    manageContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(14),
    },
    manageIconWrap: {
      width: scale(48),
      height: scale(48),
      borderRadius: scale(12),
      justifyContent: 'center',
      alignItems: 'center',
    },
    manageTextWrap: {
      flex: 1,
    },
    manageTitle: {
      fontSize: fontScale(15),
      fontWeight: '600',
    },
    manageSubtext: {
      fontSize: fontScale(12),
      marginTop: verticalScale(2),
    },

    // Pro Tip Card
    tipCard: {
      flexDirection: 'row',
      marginHorizontal: scale(20),
      padding: scale(16),
      borderRadius: scale(14),
      gap: scale(12),
      borderWidth: 1,
      marginBottom: verticalScale(4),
    },
    tipIconWrap: {
      width: scale(44),
      height: scale(44),
      borderRadius: scale(22),
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    tipContent: {
      flex: 1,
    },
    tipTitle: {
      fontSize: fontScale(13),
      fontWeight: '700',
      marginBottom: verticalScale(2),
    },
    tipText: {
      fontSize: fontScale(13),
      lineHeight: fontScale(19),
    },

    // Dots Indicator
    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: verticalScale(8),
      marginBottom: verticalScale(8),
      gap: scale(6),
    },
    dot: {
      height: scale(4),
      borderRadius: scale(2),
      marginHorizontal: scale(2),
    },

    bottomSpacer: {
      height: verticalScale(20),
    },

    // ─── Modal Styles ──────────────────────────────────────────────────────
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      borderTopLeftRadius: scale(24),
      borderTopRightRadius: scale(24),
      paddingBottom: verticalScale(20),
      maxHeight: SCREEN_HEIGHT * 0.6,
    },
    modalHandle: {
      width: scale(40),
      height: scale(4),
      borderRadius: scale(2),
      alignSelf: 'center',
      marginTop: verticalScale(10),
      marginBottom: verticalScale(6),
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: scale(20),
      paddingVertical: verticalScale(12),
      borderBottomWidth: 1,
    },
    modalTitle: {
      fontSize: fontScale(18),
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    modalCloseBtn: {
      width: scale(36),
      height: scale(36),
      borderRadius: scale(18),
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      padding: scale(20),
      gap: verticalScale(12),
    },
    uploadOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: scale(16),
      borderRadius: scale(14),
      borderWidth: 1,
      gap: scale(14),
    },
    optionIconWrap: {
      width: scale(56),
      height: scale(56),
      borderRadius: scale(14),
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionTextWrap: {
      flex: 1,
    },
    optionTitle: {
      fontSize: fontScale(16),
      fontWeight: '600',
    },
    optionSubtext: {
      fontSize: fontScale(13),
      marginTop: verticalScale(2),
    },
    cancelBtn: {
      paddingVertical: verticalScale(14),
      borderRadius: scale(12),
      alignItems: 'center',
      borderWidth: 1,
      marginTop: verticalScale(4),
    },
    cancelBtnText: {
      fontSize: fontScale(15),
      fontWeight: '600',
    },
  });
}