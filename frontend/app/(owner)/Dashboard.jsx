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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../services/firebase';
import { getChannelByOwner, getChannelStats } from '../../services/channelService';
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

export default function Dashboard({ navigation }) {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { isLoading: authLoading } = useAuth();
  const [channel, setChannel] = useState(null);
  const [stats, setStats] = useState({ articles: 0, videos: 0, live: 0, followers: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!auth.currentUser) return;
    loadDashboardData();
  }, [authLoading]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('📊 Loading dashboard data...');

      const channelData = await getChannelByOwner();
      console.log('📊 Channel data:', channelData);

      if (channelData) {
        setChannel(channelData);
        try {
          const statsData = await getChannelStats(channelData._id || channelData.id);
          console.log('📊 Stats data:', statsData);
          setStats(statsData);
        } catch (statsErr) {
          console.warn('⚠️ Stats load failed:', statsErr.message);
        }
      } else {
        setChannel(null);
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

  const quickActions = [
    { id: '1', icon: 'create-outline', title: 'Write Article', color: C.accent, route: 'UploadArticle' },
    { id: '2', icon: 'videocam-outline', title: 'Upload Video', color: C.iconBlue, route: 'UploadVideo' },
    { id: '3', icon: 'radio-outline', title: 'Go Live', color: C.iconGreen, route: 'GoLive' },
    { id: '4', icon: 'people-outline', title: 'Subscribers', color: C.iconPurple, route: 'Subscribers' },
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
          onPress={() => navigation.navigate('CreateChannel')}
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
            onPress={() => navigation.navigate('OwnerProfile')}
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
              onPress={() => {
                if (!channel) { Alert.alert('No Channel', 'Create a channel first'); return; }
                navigation.navigate(a.route);
              }}
            >
              <View style={[styles.actionIconBg, { backgroundColor: a.color + '18' }]}>
                <Ionicons name={a.icon} size={scale(26)} color={a.color} />
              </View>
              <Text style={[styles.actionTitle, { color: C.primary }]}>{a.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: C.primary }]}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ManagePosts')}>
            <Text style={[styles.seeAll, { color: C.accent }]}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.recentCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={styles.recentRow}>
            <View style={[styles.recentDot, { backgroundColor: C.faint }]} />
            <View>
              <Text style={[styles.recentTitle, { color: C.secondary }]}>No recent activity</Text>
              <Text style={[styles.recentSub, { color: C.muted }]}>Start publishing to see activity here</Text>
            </View>
          </View>
        </View>

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
      marginBottom: vs(16),
    },
    recentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(12),
    },
    recentDot: {
      width: scale(8),
      height: scale(8),
      borderRadius: scale(4),
    },
    recentTitle: {
      fontSize: sp(14),
      fontWeight: '500',
    },
    recentSub: {
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
  });
}