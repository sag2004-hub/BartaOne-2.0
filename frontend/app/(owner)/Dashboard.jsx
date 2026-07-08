import React, { useState, useEffect, useCallback } from 'react';
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

const { width: SW, height: SH } = Dimensions.get('window');
const BASE_W = 390;
const scale = (n) => Math.round((SW / BASE_W) * n);
const vs = (n) => Math.round((SH / 844) * n);
const sp = (n) => n / PixelRatio.getFontScale();

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

export default function Dashboard() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { isLoading: authLoading } = useAuth();
  const [channel, setChannel] = useState(null);
  const [stats, setStats] = useState({ articles: 0, videos: 0, live: 0, followers: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [goLiveModalVisible, setGoLiveModalVisible] = useState(false);
  const [subscribersModalVisible, setSubscribersModalVisible] = useState(false);

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

  // ─── Go Live Modal Handlers ─────────────────────────────────────────────
  const handleGoLivePress = () => {
    if (!channel) {
      Alert.alert('No Channel', 'Create a channel first');
      return;
    }
    setGoLiveModalVisible(true);
  };

  const handleGoLiveOption = (route) => {
    setGoLiveModalVisible(false);
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
      icon: 'radio-outline', 
      title: 'Go Live', 
      color: C.iconGreen, 
      onPress: handleGoLivePress 
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
    { id: '3', label: 'Live', value: stats.live || 0, icon: 'radio-outline', color: C.iconGreen, bg: C.iconGreenBg },
    { id: '4', label: 'Followers', value: stats.followers || 0, icon: 'people-outline', color: C.iconPurple, bg: C.iconPurpleBg },
  ];

  const styles = makeStyles(C);

  if (authLoading) return <Loader message="Loading…" />;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={[styles.loadingText, { color: C.secondary }]}>Loading dashboard…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!channel) {
    return (
      <SafeAreaView style={styles.root}>
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

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.topStripe} />

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
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: C.muted }]}>Welcome back</Text>
            <Text style={[styles.channelName, { color: C.primary }]} numberOfLines={1}>
              {channel.channelName || 'My Channel'}
            </Text>
            {channel.isVerified && (
              <View style={styles.verifiedRow}>
                <Ionicons name="checkmark-circle" size={14} color="#0E8A5A" />
                <Text style={styles.verifiedText}>Verified Channel</Text>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={[styles.profileBtn, { backgroundColor: C.bg }]} 
            onPress={() => router.push('Profile')}
          >
            <Ionicons name="person-outline" size={scale(22)} color={C.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statCards.map((s) => (
            <View key={s.id} style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              <View style={[styles.statIconBg, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon} size={scale(22)} color={s.color} />
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
                <Ionicons name={a.icon} size={scale(26)} color={a.color} />
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
                  <Ionicons name={activity.icon} size={scale(16)} color={activity.color || C.accent} />
                </View>
                <View style={styles.recentContent}>
                  <Text style={[styles.recentTitle, { color: C.primary }]} numberOfLines={1}>
                    {activity.title}
                  </Text>
                  <Text style={[styles.recentSub, { color: C.muted }]}>
                    {activity.type === 'article' ? '📄 Article' : '🎬 Video'} • {timeAgo(activity.createdAt)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={scale(18)} color={C.muted} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.recentEmpty}>
              <Ionicons name="time-outline" size={scale(32)} color={C.muted} />
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
              <Ionicons name="folder-open-outline" size={scale(24)} color={C.accent} />
            </View>
            <View style={styles.manageTextWrap}>
              <Text style={[styles.manageTitle, { color: C.primary }]}>Manage Articles & Videos</Text>
              <Text style={[styles.manageSubtext, { color: C.muted }]}>
                View, edit, and manage all your published content
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={scale(20)} color={C.muted} />
          </View>
        </TouchableOpacity>

        {/* Tip Card */}
        <View style={[styles.tipCard, { backgroundColor: C.accentBg, borderColor: C.accentBorder }]}>
          <View style={[styles.tipIconWrap, { backgroundColor: C.accent + '18' }]}>
            <Ionicons name="bulb-outline" size={scale(22)} color={C.accent} />
          </View>
          <View style={styles.tipContent}>
            <Text style={[styles.tipTitle, { color: C.primary }]}>Pro Tip</Text>
            <Text style={[styles.tipText, { color: C.secondary }]}>
              Regular posting helps grow your audience. Try to publish at least 3 articles per week!
            </Text>
          </View>
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
                <View style={styles.modalHandle} />
                <View style={[styles.modalHeader, { borderBottomColor: C.border }]}>
                  <Text style={[styles.modalTitle, { color: C.primary }]}>Choose Upload Type</Text>
                  <TouchableOpacity
                    style={[styles.modalCloseBtn, { backgroundColor: C.accentBg }]}
                    onPress={() => setUploadModalVisible(false)}
                  >
                    <Ionicons name="close" size={scale(22)} color={C.accent} />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalContent}>
                  <TouchableOpacity
                    style={[styles.uploadOption, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}
                    onPress={() => handleUploadOption('UploadArticle')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optionIconWrap, { backgroundColor: C.accentBg }]}>
                      <Ionicons name="create-outline" size={scale(32)} color={C.accent} />
                    </View>
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionTitle, { color: C.primary }]}>Upload Article</Text>
                      <Text style={[styles.optionSubtext, { color: C.muted }]}>
                        Write and publish a news article
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={scale(20)} color={C.muted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.uploadOption, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}
                    onPress={() => handleUploadOption('UploadVideo')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optionIconWrap, { backgroundColor: C.iconBlueBg }]}>
                      <Ionicons name="videocam-outline" size={scale(32)} color={C.iconBlue} />
                    </View>
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionTitle, { color: C.primary }]}>Upload Video</Text>
                      <Text style={[styles.optionSubtext, { color: C.muted }]}>
                        Upload and share video content
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={scale(20)} color={C.muted} />
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

      {/* ─── Go Live Selection Modal ────────────────────────────────────── */}
      <Modal
        visible={goLiveModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setGoLiveModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setGoLiveModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContainer, { backgroundColor: C.surface }]}>
                <View style={styles.modalHandle} />
                <View style={[styles.modalHeader, { borderBottomColor: C.border }]}>
                  <Text style={[styles.modalTitle, { color: C.primary }]}>Go Live</Text>
                  <TouchableOpacity
                    style={[styles.modalCloseBtn, { backgroundColor: C.iconGreenBg }]}
                    onPress={() => setGoLiveModalVisible(false)}
                  >
                    <Ionicons name="close" size={scale(22)} color={C.iconGreen} />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalContent}>
                  <TouchableOpacity
                    style={[styles.uploadOption, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}
                    onPress={() => handleGoLiveOption('GoLive')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optionIconWrap, { backgroundColor: C.iconGreenBg }]}>
                      <Ionicons name="radio-outline" size={scale(32)} color={C.iconGreen} />
                    </View>
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionTitle, { color: C.primary }]}>Start Live Stream</Text>
                      <Text style={[styles.optionSubtext, { color: C.muted }]}>
                        Go live and broadcast to your audience
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={scale(20)} color={C.muted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.uploadOption, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}
                    onPress={() => handleGoLiveOption('GoLive')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optionIconWrap, { backgroundColor: C.iconAmberBg }]}>
                      <Ionicons name="calendar-outline" size={scale(32)} color={C.iconAmber} />
                    </View>
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionTitle, { color: C.primary }]}>Schedule Live</Text>
                      <Text style={[styles.optionSubtext, { color: C.muted }]}>
                        Schedule a live stream for later
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={scale(20)} color={C.muted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cancelBtn, { borderColor: C.border }]}
                    onPress={() => setGoLiveModalVisible(false)}
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
                <View style={styles.modalHandle} />
                <View style={[styles.modalHeader, { borderBottomColor: C.border }]}>
                  <Text style={[styles.modalTitle, { color: C.primary }]}>Subscribers</Text>
                  <TouchableOpacity
                    style={[styles.modalCloseBtn, { backgroundColor: C.iconPurpleBg }]}
                    onPress={() => setSubscribersModalVisible(false)}
                  >
                    <Ionicons name="close" size={scale(22)} color={C.iconPurple} />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalContent}>
                  <TouchableOpacity
                    style={[styles.uploadOption, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}
                    onPress={() => handleSubscribersOption('Subscribers')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optionIconWrap, { backgroundColor: C.iconPurpleBg }]}>
                      <Ionicons name="people-outline" size={scale(32)} color={C.iconPurple} />
                    </View>
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionTitle, { color: C.primary }]}>View Subscribers</Text>
                      <Text style={[styles.optionSubtext, { color: C.muted }]}>
                        See all your channel subscribers
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={scale(20)} color={C.muted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.uploadOption, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}
                    onPress={() => handleSubscribersOption('Subscribers')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optionIconWrap, { backgroundColor: C.iconAmberBg }]}>
                      <Ionicons name="analytics-outline" size={scale(32)} color={C.iconAmber} />
                    </View>
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionTitle, { color: C.primary }]}>Analytics</Text>
                      <Text style={[styles.optionSubtext, { color: C.muted }]}>
                        View subscriber growth and engagement
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={scale(20)} color={C.muted} />
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
      height: 3,
      backgroundColor: C.accent,
    },
    content: {
      flexGrow: 1,
      paddingBottom: vs(20),
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: vs(12),
    },
    loadingText: {
      fontSize: sp(14),
      fontWeight: '500',
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: scale(20),
      paddingTop: vs(16),
      paddingBottom: vs(14),
      backgroundColor: C.surface,
    },
    headerLeft: {
      flex: 1,
    },
    greeting: {
      fontSize: sp(12),
      fontWeight: '500',
      letterSpacing: 0.2,
    },
    channelName: {
      fontSize: sp(22),
      fontWeight: '800',
      letterSpacing: -0.5,
      marginTop: vs(2),
    },
    verifiedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(4),
      marginTop: vs(3),
    },
    verifiedText: {
      fontSize: sp(12),
      color: '#0E8A5A',
      fontWeight: '600',
    },
    profileBtn: {
      width: scale(42),
      height: scale(42),
      borderRadius: scale(21),
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: C.border,
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
      minWidth: (SW - scale(52)) / 2,
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
      marginBottom: vs(8),
    },
    statValue: {
      fontSize: sp(26),
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    statLabel: {
      fontSize: sp(12),
      fontWeight: '500',
      marginTop: vs(2),
    },

    // Section Header
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: scale(20),
      marginBottom: vs(10),
      marginTop: vs(4),
    },
    sectionTitle: {
      fontSize: sp(16),
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    seeAll: {
      fontSize: sp(13),
      fontWeight: '600',
    },

    // Actions Grid
    actionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: scale(14),
      gap: scale(12),
      marginBottom: vs(12),
    },
    actionCard: {
      flex: 1,
      minWidth: (SW - scale(52)) / 2,
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
      marginBottom: vs(8),
    },
    actionTitle: {
      fontSize: sp(13),
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
      marginBottom: vs(8),
    },
    recentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: vs(10),
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
      fontSize: sp(14),
      fontWeight: '600',
    },
    recentSub: {
      fontSize: sp(12),
      marginTop: vs(2),
    },
    recentEmpty: {
      alignItems: 'center',
      paddingVertical: vs(20),
      gap: vs(6),
    },
    recentEmptyTitle: {
      fontSize: sp(15),
      fontWeight: '600',
    },
    recentEmptySub: {
      fontSize: sp(13),
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
      marginBottom: vs(16),
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
      fontSize: sp(15),
      fontWeight: '600',
    },
    manageSubtext: {
      fontSize: sp(12),
      marginTop: vs(2),
    },

    // Tip Card
    tipCard: {
      flexDirection: 'row',
      marginHorizontal: scale(20),
      padding: scale(16),
      borderRadius: scale(14),
      gap: scale(12),
      borderWidth: 1,
      marginBottom: vs(8),
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
      fontSize: sp(13),
      fontWeight: '700',
      marginBottom: vs(2),
    },
    tipText: {
      fontSize: sp(13),
      lineHeight: sp(19),
    },

    bottomSpacer: {
      height: vs(20),
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
      paddingBottom: vs(20),
      maxHeight: SH * 0.6,
    },
    modalHandle: {
      width: scale(40),
      height: scale(4),
      borderRadius: scale(2),
      backgroundColor: C.border,
      alignSelf: 'center',
      marginTop: vs(10),
      marginBottom: vs(6),
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: scale(20),
      paddingVertical: vs(12),
      borderBottomWidth: 1,
    },
    modalTitle: {
      fontSize: sp(18),
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
      gap: vs(12),
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
      fontSize: sp(16),
      fontWeight: '600',
    },
    optionSubtext: {
      fontSize: sp(13),
      marginTop: vs(2),
    },
    cancelBtn: {
      paddingVertical: vs(14),
      borderRadius: scale(12),
      alignItems: 'center',
      borderWidth: 1,
      marginTop: vs(4),
    },
    cancelBtnText: {
      fontSize: sp(15),
      fontWeight: '600',
    },
  });
}