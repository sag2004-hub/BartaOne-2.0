// app/(viewer)/ChannelDetails.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Share,
  Animated,
  Easing,
  useColorScheme,
  PixelRatio,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NewsCard from '../../components/NewsCard';
import VideoCard from '../../components/VideoCard';
import Loader from '../../components/Loader';
import { channelService } from '../../services/channelService';
import { getChannelArticles } from '../../services/articleService';
import { getChannelVideos } from '../../services/videoService';

// ─── Responsive helpers ──────────────────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

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
const moderateScale = (size, factor = 0.5) =>
  Math.round(size + (scale(size) - size) * factor);
const fontScale = (size) => {
  const scaleFactor = Math.min(SCREEN_WIDTH / BASE_WIDTH, SCREEN_HEIGHT / BASE_HEIGHT);
  const clamped = Math.min(Math.max(scaleFactor, 0.7), 1.3);
  return Math.round((size * clamped) / PixelRatio.getFontScale());
};

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const LIGHT = {
  bg:                '#F2F0EB',
  surface:           '#FFFFFF',
  surfaceAlt:        '#FAFAF8',
  border:            '#E4E0D8',
  accent:            '#C8001A',
  accentBg:          '#FFF0F2',
  primary:           '#1A2733',
  secondary:         '#4A5A6B',
  muted:             '#8A97A5',
  faint:             '#B8C0B8',
  white:             '#FFFFFF',
  statusBar:         'dark-content',
  teal:              '#4ECDC4',
  cardShadowOpacity: 0.06,
};
const DARK = {
  bg:                '#0D1117',
  surface:           '#161B22',
  surfaceAlt:        '#1C2330',
  border:            '#2A3340',
  accent:            '#E8192C',
  accentBg:          'rgba(232,25,44,0.12)',
  primary:           '#EDF2F7',
  secondary:         '#8B9BAB',
  muted:             '#5C6E80',
  faint:             '#3A4A58',
  white:             '#FFFFFF',
  statusBar:         'light-content',
  teal:              '#4ECDC4',
  cardShadowOpacity: 0.35,
};

// ─── Share helper ─────────────────────────────────────────────────────────────
const handleShare = async (channel) => {
  try {
    const channelName = channel?.channelName ?? 'this channel';
    const description = channel?.description
      ? channel.description.slice(0, 120) + (channel.description.length > 120 ? '…' : '')
      : 'Check out the latest news on BartaOne.';
    await Share.share({
      title:   `${channelName} on BartaOne`,
      message: `📰 Follow *${channelName}* on BartaOne!\n\n${description}\n\nDownload BartaOne for hyper-local news: https://bartaone.app`,
      url:     `https://bartaone.app/channel/${channel?._id ?? ''}`,
    });
  } catch (error) {
    if (error?.message && !error.message.includes('cancel')) {
      Alert.alert('Share failed', error.message);
    }
  }
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function ChannelDetails() {
  const router  = useRouter();
  const params  = useLocalSearchParams();
  const { id }  = params;
  const scheme  = useColorScheme();
  const C       = scheme === 'dark' ? DARK : LIGHT;

  const [channel,      setChannel]      = useState(null);
  const [articles,     setArticles]     = useState([]);
  const [videos,       setVideos]       = useState([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // ← pull-to-refresh state
  const [activeTab,    setActiveTab]    = useState('articles');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing,  setSubscribing]  = useState(false);

  // ── Animation refs ──
  const headerAnim    = useRef(new Animated.Value(0)).current;
  const bannerAnim    = useRef(new Animated.Value(0)).current;
  const bannerScale   = useRef(new Animated.Value(1.06)).current;
  const infoAnim      = useRef(new Animated.Value(0)).current;
  const infoY         = useRef(new Animated.Value(verticalScale(24))).current;
  const statsAnim     = useRef(new Animated.Value(0)).current;
  const btnAnim       = useRef(new Animated.Value(0)).current;
  const btnPulse      = useRef(new Animated.Value(1)).current;
  const tabAnim       = useRef(new Animated.Value(0)).current;
  const contentAnim   = useRef(new Animated.Value(0)).current;
  const shareIconAnim = useRef(new Animated.Value(1)).current;

  // ── Entry animation (only runs on first load, not on pull-to-refresh) ──
  const runEntryAnim = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerAnim, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(bannerAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad),  useNativeDriver: true }),
        Animated.spring(bannerScale, { toValue: 1, friction: 8, tension: 45, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(infoAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(infoY, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      ]),
      Animated.timing(statsAnim, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(btnAnim,  { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(tabAnim,  { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.timing(contentAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(btnPulse, { toValue: 1.022, duration: 850, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(btnPulse, { toValue: 1,     duration: 850, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  };

  const animateSharePress = () => {
    Animated.sequence([
      Animated.timing(shareIconAnim, { toValue: 0.75, duration: 100, useNativeDriver: true }),
      Animated.spring(shareIconAnim, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
    ]).start();
  };

  // ─── Save to recently viewed ─────────────────────────────────────────────
  const saveToRecentlyViewed = async (channelData) => {
    try {
      if (!channelData || !channelData._id) return;
      const channelToSave = {
        _id:         channelData._id,
        name:        channelData.channelName || channelData.name || 'Unknown Channel',
        logo:        channelData.logo || null,
        category:    channelData.category || null,
        city:        channelData.location?.city     || channelData.city     || null,
        district:    channelData.location?.district || channelData.district || null,
        state:       channelData.location?.state    || channelData.state    || null,
        followers:   channelData.followers || 0,
        isFollowed:  isSubscribed || false,
        channelName: channelData.channelName || channelData.name || 'Unknown Channel',
      };
      const stored = await AsyncStorage.getItem('recentlyViewedChannels');
      let recent = stored ? JSON.parse(stored) : [];
      recent = recent.filter((ch) => ch._id !== channelData._id);
      recent = [channelToSave, ...recent].slice(0, 10);
      await AsyncStorage.setItem('recentlyViewedChannels', JSON.stringify(recent));
    } catch (e) {
      console.error('Failed to save recent channel:', e);
    }
  };

  // ─── Subscriptions ───────────────────────────────────────────────────────
  const loadSubscriptions = async () => {
    try {
      const subscribed = await AsyncStorage.getItem('subscribedChannels');
      if (subscribed) {
        const channels = JSON.parse(subscribed);
        const isSubbed = channels.some((ch) => ch.id === id);
        setIsSubscribed(isSubbed);
        return isSubbed;
      }
      setIsSubscribed(false);
      return false;
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      setIsSubscribed(false);
      return false;
    }
  };

  const saveSubscription = async (channelData, subscribed) => {
    try {
      const existing = await AsyncStorage.getItem('subscribedChannels');
      let channels = existing ? JSON.parse(existing) : [];
      if (subscribed) {
        if (!channels.some((ch) => ch.id === (channelData._id || channelData.id))) {
          channels.push({
            id:   channelData._id || channelData.id,
            name: channelData.channelName,
            logo: channelData.logo,
          });
        }
      } else {
        channels = channels.filter((ch) => ch.id !== (channelData._id || channelData.id));
      }
      await AsyncStorage.setItem('subscribedChannels', JSON.stringify(channels));
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  };

  // ─── Auto-refresh on screen focus ───────────────────────────────────────
  useFocusEffect(
    React.useCallback(() => {
      if (id) {
        console.log('🔄 ChannelDetails refreshed on focus');
        loadSubscriptions();
      }
    }, [id])
  );

  useEffect(() => {
    if (id) {
      loadChannelData();
    } else {
      Alert.alert('Error', 'Channel ID is missing');
      router.back();
    }
  }, [id]);

  // ─── Load data ───────────────────────────────────────────────────────────
  // `silent` = true during pull-to-refresh so we skip the full-screen loader
  // and entry animation (content is already visible).
  const loadChannelData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const channelData = await channelService.getById(id);
      const channelObj  = channelData?.data?.data || channelData?.data || channelData;
      setChannel(channelObj);

      const isSubbed = await loadSubscriptions();
      await saveToRecentlyViewed({ ...channelObj, isFollowed: isSubbed });

      const [articlesData, videosData] = await Promise.all([
        getChannelArticles(id),
        getChannelVideos(id),
      ]);

      const articleList = articlesData?.data?.articles || articlesData?.data || articlesData || [];
      const videoList   = videosData?.data?.videos     || videosData?.data  || videosData   || [];

      setArticles(Array.isArray(articleList) ? articleList : []);
      setVideos(Array.isArray(videoList)     ? videoList   : []);
    } catch (error) {
      console.error('Load error:', error);
      // Only show the error alert on the initial load, not on a silent refresh
      if (!silent) {
        Alert.alert(
          'Error',
          error.message || 'Failed to load channel data. Please try again.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Refresh failed', error.message || 'Could not refresh. Please try again.');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
        runEntryAnim();
      } else {
        setIsRefreshing(false);
      }
    }
  };

  // ─── Pull-to-refresh handler ─────────────────────────────────────────────
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadChannelData(true); // silent = true: no full-screen loader, no entry anim
  };

  // ─── Subscribe ───────────────────────────────────────────────────────────
  const handleSubscribe = async () => {
    if (subscribing) return;
    setSubscribing(true);
    try {
      if (isSubscribed) {
        await channelService.unsubscribe(id);
        setIsSubscribed(false);
        await saveSubscription(channel, false);
        await saveToRecentlyViewed({ ...channel, isFollowed: false });
        Alert.alert('Success', 'Unsubscribed from channel');
      } else {
        await channelService.subscribe(id);
        setIsSubscribed(true);
        await saveSubscription(channel, true);
        await saveToRecentlyViewed({ ...channel, isFollowed: true });
        Alert.alert('Success', 'Subscribed to channel');
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      if (error.message?.includes('Already subscribed')) {
        setIsSubscribed(true);
        await saveSubscription(channel, true);
        await saveToRecentlyViewed({ ...channel, isFollowed: true });
        Alert.alert('Info', 'You are already subscribed to this channel');
        return;
      }
      Alert.alert(
        'Subscription Error',
        error.message || 'Failed to update subscription. Please try again.',
        [
          { text: 'Try Again', onPress: () => handleSubscribe() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } finally {
      setSubscribing(false);
    }
  };

  const handleArticlePress = (articleId) =>
    router.push(`/(viewer)/ArticleDetails?id=${articleId}`);
  const handleVideoPress = (videoId) =>
    router.push(`/(viewer)/VideoPlayer?id=${videoId}`);

  if (isLoading) return <Loader message="Loading channel…" />;

  if (!channel) {
    return (
      <SafeAreaView style={[staticStyles.root, { backgroundColor: C.bg }]} edges={['top', 'bottom']}>
        <View style={staticStyles.errorContainer}>
          <View style={[staticStyles.errorIconWrap, { backgroundColor: C.accentBg }]}>
            <Ionicons name="alert-circle-outline" size={moderateScale(40)} color={C.accent} />
          </View>
          <Text style={[staticStyles.errorTitle, { color: C.primary }]}>Channel not found</Text>
          <Text style={[staticStyles.errorSub,   { color: C.muted   }]}>
            This channel may have been removed or the link is invalid.
          </Text>
          <TouchableOpacity
            style={[staticStyles.errorBtn, { backgroundColor: C.accent }]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={moderateScale(16)} color="#FFF" />
            <Text style={staticStyles.errorBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const styles = makeStyles(C);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle={C.statusBar} backgroundColor="transparent" translucent />

      <View style={[styles.topStripe, { backgroundColor: C.accent }]} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={C.accent}        // iOS spinner colour
            colors={[C.accent]}         // Android spinner colour
            progressBackgroundColor={C.surface} // Android pill background
          />
        }
      >
        {/* ── Floating header ── */}
        <Animated.View
          style={[
            styles.floatingHeader,
            {
              opacity: headerAnim,
              transform: [{
                translateY: headerAnim.interpolate({
                  inputRange:  [0, 1],
                  outputRange: [-verticalScale(20), 0],
                }),
              }],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.circleBtn, { backgroundColor: 'rgba(15,25,35,0.55)' }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={moderateScale(20)} color="#FFF" />
          </TouchableOpacity>

          <Animated.View style={{ transform: [{ scale: shareIconAnim }] }}>
            <TouchableOpacity
              style={[styles.circleBtn, { backgroundColor: 'rgba(15,25,35,0.55)' }]}
              onPress={() => { animateSharePress(); handleShare(channel); }}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={moderateScale(20)} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* ── Banner ── */}
        <Animated.View style={{ opacity: bannerAnim, transform: [{ scale: bannerScale }] }}>
          <Image
            source={{ uri: channel.banner || 'https://via.placeholder.com/800x200/0F1923/FFFFFF?text=BartaOne' }}
            style={styles.banner}
          />
          <View style={styles.bannerOverlay} />
        </Animated.View>

        {/* ── Info card ── */}
        <Animated.View
          style={[
            styles.infoCard,
            {
              backgroundColor: C.surface,
              borderColor:     C.border,
              opacity:         infoAnim,
              transform:       [{ translateY: infoY }],
            },
          ]}
        >
          {/* Logo + name */}
          <View style={styles.infoRow}>
            <View style={[styles.logoRing, { borderColor: C.accent }]}>
              <Image
                source={{ uri: channel.logo || 'https://via.placeholder.com/100/0F1923/FFFFFF?text=B' }}
                style={styles.logo}
              />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={[styles.channelName, { color: C.primary }]} numberOfLines={2}>
                {channel.channelName}
              </Text>
              {channel.isVerified && (
                <View style={styles.verifiedRow}>
                  <Ionicons name="checkmark-circle" size={moderateScale(14)} color={C.teal} />
                  <Text style={[styles.verifiedText, { color: C.teal }]}>Verified</Text>
                </View>
              )}
              {channel.language && (
                <View style={styles.langRow}>
                  <Ionicons name="language-outline" size={moderateScale(13)} color={C.muted} />
                  <Text style={[styles.langText, { color: C.muted }]}>{channel.language}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {channel.description ? (
            <Text style={[styles.description, { color: C.secondary }]} numberOfLines={3}>
              {channel.description}
            </Text>
          ) : null}

          <View style={[styles.rule, { backgroundColor: C.accent }]} />

          {/* Stats */}
          <Animated.View style={[styles.statsRow, { opacity: statsAnim }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: C.primary }]}>
                {channel.followers?.toLocaleString('en-IN') || '0'}
              </Text>
              <Text style={[styles.statLabel, { color: C.muted }]}>Followers</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: C.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: C.primary }]}>
                {(articles.length + videos.length).toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.statLabel, { color: C.muted }]}>Posts</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: C.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: C.primary }]} numberOfLines={1}>
                {channel.location?.city || 'N/A'}
              </Text>
              <Text style={[styles.statLabel, { color: C.muted }]}>Location</Text>
            </View>
          </Animated.View>

          {/* Subscribe button */}
          <Animated.View style={{ transform: [{ scale: btnPulse }], marginTop: verticalScale(14) }}>
            <TouchableOpacity
              style={[
                styles.subscribeBtn,
                isSubscribed
                  ? [styles.subscribedBtn, { borderColor: C.accent }]
                  : { backgroundColor: C.accent, shadowColor: C.accent },
                subscribing && { opacity: 0.6 },
              ]}
              onPress={handleSubscribe}
              disabled={subscribing}
              activeOpacity={0.86}
            >
              {subscribing ? (
                <Text style={[styles.subscribeBtnText, { color: isSubscribed ? C.accent : '#FFF' }]}>
                  Please wait...
                </Text>
              ) : (
                <>
                  <Ionicons
                    name={isSubscribed ? 'checkmark-circle' : 'add-circle-outline'}
                    size={moderateScale(18)}
                    color={isSubscribed ? C.accent : '#FFF'}
                  />
                  <Text style={[styles.subscribeBtnText, { color: isSubscribed ? C.accent : '#FFF' }]}>
                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* ── Tab bar ── */}
        <Animated.View
          style={[
            styles.tabBar,
            { backgroundColor: C.surface, borderBottomColor: C.border, opacity: tabAnim },
          ]}
        >
          {['articles', 'videos'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && { borderBottomColor: C.accent, borderBottomWidth: verticalScale(3) },
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab === 'articles' ? 'newspaper-outline' : 'videocam-outline'}
                size={moderateScale(15)}
                color={activeTab === tab ? C.accent : C.muted}
                style={{ marginRight: scale(5) }}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === tab ? C.accent : C.muted },
                  activeTab === tab && { fontWeight: '700' },
                ]}
              >
                {tab === 'articles'
                  ? `Articles (${articles.length})`
                  : `Videos (${videos.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* ── Content ── */}
        <Animated.View style={{ opacity: contentAnim, paddingBottom: verticalScale(20) }}>
          {activeTab === 'articles'
            ? articles.length > 0
              ? articles.map((article) => (
                  <NewsCard
                    key={article._id || article.id}
                    article={article}
                    onPress={() => handleArticlePress(article._id || article.id)}
                  />
                ))
              : <EmptyState icon="newspaper-outline" label="No articles yet" C={C} />
            : videos.length > 0
              ? videos.map((video) => (
                  <VideoCard
                    key={video._id || video.id}
                    video={video}
                    onPress={() => handleVideoPress(video._id || video.id)}
                  />
                ))
              : <EmptyState icon="videocam-outline" label="No videos yet" C={C} />}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ icon, label, C }) {
  return (
    <View style={[emptyStyles.wrap, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
      <View style={[emptyStyles.iconWrap, { backgroundColor: C.accentBg }]}>
        <Ionicons name={icon} size={moderateScale(28)} color={C.accent} />
      </View>
      <Text style={[emptyStyles.label, { color: C.muted }]}>{label}</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: {
    margin: scale(20),
    padding: scale(32),
    borderRadius: scale(18),
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  label: {
    fontSize: fontScale(14),
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});

// ─── Static styles (used before theme is known, e.g. error screen) ────────────
const staticStyles = StyleSheet.create({
  root: { flex: 1 },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(32),
  },
  errorIconWrap: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  errorTitle: {
    fontSize: fontScale(20),
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: verticalScale(8),
  },
  errorSub: {
    fontSize: fontScale(14),
    textAlign: 'center',
    lineHeight: fontScale(22),
    marginBottom: verticalScale(24),
  },
  errorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    paddingVertical: verticalScale(13),
    paddingHorizontal: scale(28),
    borderRadius: scale(12),
    minHeight: verticalScale(48),
  },
  errorBtnText: {
    color: '#FFF',
    fontSize: fontScale(15),
    fontWeight: '700',
  },
});

// ─── Dynamic styles ───────────────────────────────────────────────────────────
const makeStyles = (C) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: C.bg,
    },
    topStripe: {
      height: verticalScale(3),
    },
    floatingHeader: {
      position: 'absolute',
      top: verticalScale(14),
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: scale(16),
      zIndex: 10,
    },
    circleBtn: {
      width: scale(42),
      height: scale(42),
      borderRadius: scale(21),
      justifyContent: 'center',
      alignItems: 'center',
    },
    banner: {
      width: '100%',
      height: verticalScale(220),
      resizeMode: 'cover',
    },
    bannerOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: verticalScale(60),
      backgroundColor: 'rgba(15,25,35,0.35)',
    },
    infoCard: {
      marginTop: -verticalScale(32),
      marginHorizontal: scale(12),
      borderRadius: scale(20),
      padding: scale(18),
      borderWidth: StyleSheet.hairlineWidth,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(6) },
      shadowOpacity: C.cardShadowOpacity,
      shadowRadius: scale(18),
      elevation: 6,
      marginBottom: verticalScale(10),
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: scale(14),
      marginBottom: verticalScale(12),
    },
    infoTextContainer: { flex: 1 },
    logoRing: {
      borderRadius: scale(30),
      borderWidth: 2.5,
      padding: 2,
    },
    logo: {
      width: scale(62),
      height: scale(62),
      borderRadius: scale(28),
    },
    channelName: {
      fontSize: fontScale(20),
      fontWeight: '800',
      letterSpacing: -0.4,
      lineHeight: fontScale(26),
      marginBottom: verticalScale(4),
    },
    verifiedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(4),
      marginBottom: verticalScale(2),
    },
    verifiedText: {
      fontSize: fontScale(12),
      fontWeight: '600',
    },
    langRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(4),
    },
    langText: { fontSize: fontScale(12) },
    description: {
      fontSize: fontScale(13.5),
      lineHeight: fontScale(21),
      marginBottom: verticalScale(14),
      letterSpacing: 0.1,
    },
    rule: {
      height: verticalScale(1.5),
      opacity: 0.7,
      marginBottom: verticalScale(14),
      borderRadius: 1,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: verticalScale(4),
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statNumber: {
      fontSize: fontScale(17),
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    statLabel: {
      fontSize: fontScale(11),
      marginTop: verticalScale(2),
      fontWeight: '500',
    },
    statDivider: {
      width: 1,
      height: verticalScale(36),
      alignSelf: 'center',
      borderRadius: 1,
    },
    subscribeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: scale(13),
      paddingVertical: verticalScale(14),
      gap: scale(8),
      shadowOffset: { width: 0, height: scale(5) },
      shadowOpacity: 0.32,
      shadowRadius: scale(12),
      elevation: 6,
      minHeight: verticalScale(50),
    },
    subscribedBtn: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      shadowOpacity: 0,
      elevation: 0,
    },
    subscribeBtnText: {
      fontSize: fontScale(15),
      fontWeight: '700',
      letterSpacing: 0.1,
    },
    tabBar: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      marginBottom: verticalScale(6),
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: verticalScale(13),
      minHeight: verticalScale(44),
    },
    tabText: {
      fontSize: fontScale(14),
      fontWeight: '500',
      letterSpacing: 0.1,
    },
  });