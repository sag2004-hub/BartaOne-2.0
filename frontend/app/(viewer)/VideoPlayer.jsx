// app/(viewer)/VideoPlayer.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
  Share,
  Alert,
  Platform,
  StatusBar,
  useColorScheme,
  PixelRatio,
  Animated,
  Easing,
  TextInput,
  FlatList,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loader from '../../components/Loader';
import {
  getVideoById,
  likeVideo,
  unlikeVideo,
  commentOnVideo,
  getVideoComments,
} from '../../services/videoService';
import { timeAgo } from '../../utils/helpers';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../services/firebase';   // ← direct fallback
import { userAPI } from '../../services/api';      // ← MongoDB profile

// ─── Responsive helpers ──────────────────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

const scale = (size) => {
  const f = Math.min(Math.max(SCREEN_WIDTH / BASE_WIDTH, 0.7), 1.3);
  return Math.round(f * size);
};
const verticalScale = (size) => {
  const f = Math.min(Math.max(SCREEN_HEIGHT / BASE_HEIGHT, 0.7), 1.3);
  return Math.round(f * size);
};
const moderateScale = (size, factor = 0.5) =>
  Math.round(size + (scale(size) - size) * factor);
const fontScale = (size) => {
  const f = Math.min(
    Math.min(Math.max(SCREEN_WIDTH / BASE_WIDTH, 0.7), 1.3),
    Math.min(Math.max(SCREEN_HEIGHT / BASE_HEIGHT, 0.7), 1.3)
  );
  return Math.round((size * f) / PixelRatio.getFontScale());
};

// ─── Theme ───────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFAF8',
  border: '#E4E0D8',
  accent: '#C8001A',
  accentBg: '#FFF0F2',
  primary: '#1A2733',
  secondary: '#4A5A6B',
  muted: '#8A97A5',
  faint: '#B8C0B8',
  white: '#FFFFFF',
  statusBar: 'dark-content',
  shadowOpacity: 0.06,
};
const DARK = {
  bg: '#0D1117',
  surface: '#161B22',
  surfaceAlt: '#1C2330',
  border: '#2A3340',
  accent: '#E8192C',
  accentBg: 'rgba(232,25,44,0.12)',
  primary: '#EDF2F7',
  secondary: '#8B9BAB',
  muted: '#5C6E80',
  faint: '#3A4A58',
  white: '#FFFFFF',
  statusBar: 'light-content',
  shadowOpacity: 0.35,
};

export default function VideoPlayer() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { user } = useAuth();

  // ── State ──
  const [userProfile,          setUserProfile]          = useState(null);
  const [video,                setVideo]                = useState(null);
  const [comments,             setComments]             = useState([]);
  const [isLoading,            setIsLoading]            = useState(true);
  const [isPlaying,            setIsPlaying]            = useState(false);
  const [isBuffering,          setIsBuffering]          = useState(false);
  const [duration,             setDuration]             = useState(0);
  const [position,             setPosition]             = useState(0);
  const [isMuted,              setIsMuted]              = useState(false);
  const [isLiked,              setIsLiked]              = useState(false);
  const [likesCount,           setLikesCount]           = useState(0);
  const [isBookmarked,         setIsBookmarked]         = useState(false);
  const [isFullscreen,         setIsFullscreen]         = useState(false);
  const [showControls,         setShowControls]         = useState(true);
  const [videoHeight,          setVideoHeight]          = useState(verticalScale(240));
  const [isSeeking,            setIsSeeking]            = useState(false);
  const [seekPosition,         setSeekPosition]         = useState(0);
  const [didJustFinish,        setDidJustFinish]        = useState(false);
  const [commentText,          setCommentText]          = useState('');
  const [isSubmittingComment,  setIsSubmittingComment]  = useState(false);
  const [showComments,         setShowComments]         = useState(false);
  const [isLoadingComments,    setIsLoadingComments]    = useState(false);
  const [replyTo,              setReplyTo]              = useState(null);

  // ── Refs ──
  const videoRef          = useRef(null);
  const controlsTimer     = useRef(null);
  const progressBarWidth  = useRef(0);
  const isMutingRef       = useRef(false);
  const isSeekingRef      = useRef(false);
  const isLikingRef       = useRef(false);

  // ── Animations ──
  const fadeAnim         = useRef(new Animated.Value(0)).current;
  const slideUpAnim      = useRef(new Animated.Value(verticalScale(30))).current;
  const headerAnim       = useRef(new Animated.Value(0)).current;
  const contentAnim      = useRef(new Animated.Value(0)).current;
  const likeAnim         = useRef(new Animated.Value(1)).current;
  const commentInputAnim = useRef(new Animated.Value(0)).current;

  // ─── Bootstrap ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (id) {
      loadVideo();
      loadUserProfile();
    } else {
      Alert.alert('Error', 'Video ID is missing');
      router.back();
    }
    return () => {
      if (videoRef.current) videoRef.current.stopAsync();
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, [id]);

  // ─── Load MongoDB profile (for comment display name) ────────────────────
  const loadUserProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      const profile =
        response?.data?.data?.user ||
        response?.data?.user ||
        response?.data?.data ||
        response?.data ||
        null;
      if (profile) {
        console.log('✅ MongoDB profile loaded:', profile.name || profile.fullName);
        setUserProfile(profile);
      }
    } catch (e) {
      console.warn('⚠️ Could not load MongoDB profile:', e.message);
    }
  };

  // ─── Load Bookmark Status ────────────────────────────────────────────────
  const loadBookmarkStatus = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedArticles');
      if (saved) {
        const savedItems = JSON.parse(saved);
        setIsBookmarked(savedItems.some((item) => item.id === id));
      }
    } catch (e) {
      console.error('Error loading bookmark status:', e);
    }
  };

  // ─── Reading History ─────────────────────────────────────────────────────
  const addToReadingHistory = async (videoData) => {
    try {
      const existing = await AsyncStorage.getItem('readingHistory');
      let history = existing ? JSON.parse(existing) : [];
      history = history.filter((item) => item.id !== videoData._id);
      history.unshift({
        id: videoData._id,
        title: videoData.title,
        image: videoData.thumbnail || videoData.image,
        channelName: videoData.channelId?.channelName || videoData.channelName || 'Unknown',
        type: 'video',
        timestamp: Date.now(),
      });
      if (history.length > 50) history = history.slice(0, 50);
      await AsyncStorage.setItem('readingHistory', JSON.stringify(history));
    } catch (e) {
      console.error('Error adding video to history:', e);
    }
  };

  // ─── Load Video ──────────────────────────────────────────────────────────
  const loadVideo = async () => {
    setIsLoading(true);
    try {
      const data = await getVideoById(id);
      let videoData = data;
      if (data?.data?.data) videoData = data.data.data;
      else if (data?.data) videoData = data.data;
      else if (data?.video) videoData = data.video;

      setVideo(videoData);
      setLikesCount(Math.max(videoData.likes || 0, 0));
      setIsLiked(videoData.isLiked === true);

      await loadBookmarkStatus();
      await addToReadingHistory(videoData);
      await loadComments();

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.timing(slideUpAnim, {
          toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.timing(headerAnim, {
          toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.timing(contentAnim, {
          toValue: 1, duration: 400, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('❌ Error loading video:', error);
      Alert.alert(
        'Error',
        'Failed to load video. Please try again.',
        [
          { text: 'Retry', onPress: loadVideo },
          { text: 'Go Back', onPress: () => router.back() },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Load Comments ───────────────────────────────────────────────────────
  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const response = await getVideoComments(id);
      let commentsData = [];
      if (response?.data?.comments) commentsData = response.data.comments;
      else if (response?.comments) commentsData = response.comments;
      else if (Array.isArray(response)) commentsData = response;
      else if (response?.data && Array.isArray(response.data)) commentsData = response.data;
      setComments(commentsData || []);
    } catch (e) {
      console.error('❌ Error loading comments:', e);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // ─── Submit Comment ──────────────────────────────────────────────────────
  // FIX: use auth.currentUser as the authoritative fallback so the "login to
  // comment" gate does NOT fire when the user IS logged in but useAuth()'s
  // state hasn't resolved yet (race condition on cold start).
  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    // ✅ Prefer useAuth user; fall back to auth.currentUser for race-condition safety
    const currentUser = user || auth.currentUser;

    if (!currentUser) {
      Alert.alert(
        'Login Required',
        'Please log in to comment.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log In', onPress: () => router.push('/(auth)/Login') },
        ]
      );
      return;
    }

    // ✅ Name priority:
    //   1. MongoDB profile name  (most reliable — set at signup)
    //   2. Firebase displayName  (set if using Google OAuth)
    //   3. Email prefix          (e.g. "sagnik" from sagnik@gmail.com)
    const resolvedName =
      userProfile?.name ||
      userProfile?.fullName ||
      userProfile?.displayName ||
      currentUser.displayName ||
      currentUser.email?.split('@')[0] ||
      'User';

    const resolvedAvatar =
      userProfile?.avatar ||
      userProfile?.profilePicture ||
      userProfile?.photo ||
      currentUser.photoURL ||
      null;

    setIsSubmittingComment(true);
    try {
      const commentData = {
        content: commentText.trim(),
        userId: currentUser.uid,
        userName: resolvedName,
        userAvatar: resolvedAvatar,
        parentId: replyTo?.id || replyTo?._id || null,
      };

      console.log('📤 Submitting comment:', commentData);
      const response = await commentOnVideo(id, commentData);
      console.log('✅ Comment submitted:', response);

      const newComment = response?.data ||
        response?.comment || {
          id: Date.now().toString(),
          _id: Date.now().toString(),
          content: commentData.content,
          text: commentData.content,
          userName: resolvedName,
          userAvatar: resolvedAvatar,
          userId: commentData.userId,
          createdAt: new Date().toISOString(),
          likes: 0,
          isLiked: false,
        };

      setComments((prev) => [newComment, ...prev]);
      setCommentText('');
      setReplyTo(null);
      Animated.timing(commentInputAnim, {
        toValue: 0, duration: 200, useNativeDriver: true,
      }).start();
    } catch (e) {
      console.error('❌ Error submitting comment:', e);
      Alert.alert('Error', e.message || 'Failed to submit comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // ─── Like Comment ────────────────────────────────────────────────────────
  const handleLikeComment = (commentId) => {
    setComments((prev) =>
      prev.map((c) => {
        const cId = c.id || c._id;
        if (cId === commentId) {
          const liked = !c.isLiked;
          return { ...c, isLiked: liked, likes: Math.max((c.likes || 0) + (liked ? 1 : -1), 0) };
        }
        return c;
      })
    );
  };

  // ─── Reply ───────────────────────────────────────────────────────────────
  const handleReply = (comment) => {
    setReplyTo(comment);
    setCommentText(`@${comment.userName || 'user'} `);
    Animated.timing(commentInputAnim, {
      toValue: 1, duration: 300, useNativeDriver: true,
    }).start();
  };

  const handleCancelReply = () => {
    setReplyTo(null);
    setCommentText('');
    Animated.timing(commentInputAnim, {
      toValue: 0, duration: 200, useNativeDriver: true,
    }).start();
  };

  // ─── Video playback helpers ──────────────────────────────────────────────
  const togglePlayback = async () => {
    if (!videoRef.current) return;
    try {
      if (didJustFinish) {
        await videoRef.current.replayAsync();
        setIsPlaying(true);
        setDidJustFinish(false);
        resetControlsTimer();
        return;
      }
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
      resetControlsTimer();
    } catch (e) {
      console.error('Error toggling playback:', e);
    }
  };

  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setIsBuffering(status.isBuffering);
      setDuration(status.durationMillis || 0);
      if (!isSeekingRef.current) setPosition(status.positionMillis || 0);
      if (!isMutingRef.current) setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setDidJustFinish(true);
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const formatTime = (millis) => {
    if (!millis || millis < 0) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const resetControlsTimer = () => {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    setShowControls(true);
    controlsTimer.current = setTimeout(() => {
      if (!isSeekingRef.current) setShowControls(false);
    }, 3000);
  };

  const toggleFullscreen = async () => {
    try {
      if (videoRef.current) {
        if (!isFullscreen) {
          await videoRef.current.presentFullscreenPlayer();
          setIsFullscreen(true);
          setVideoHeight(SCREEN_HEIGHT);
          StatusBar.setHidden(true);
        } else {
          await videoRef.current.dismissFullscreenPlayer();
          setIsFullscreen(false);
          setVideoHeight(verticalScale(240));
          StatusBar.setHidden(false);
        }
      }
    } catch (e) {
      Alert.alert('Info', 'Fullscreen mode not available on this device');
    }
  };

  const handleFullscreenUpdate = (event) => {
    const { fullscreenUpdate } = event;
    if (fullscreenUpdate === 0) {
      setIsFullscreen(true);
      setVideoHeight(SCREEN_HEIGHT);
      StatusBar.setHidden(true);
    } else if (fullscreenUpdate === 1) {
      setIsFullscreen(false);
      setVideoHeight(verticalScale(240));
      StatusBar.setHidden(false);
    }
  };

  const toggleMute = async () => {
    if (!videoRef.current || isMutingRef.current) return;
    try {
      isMutingRef.current = true;
      const status = await videoRef.current.getStatusAsync();
      const wasPlaying = status.isPlaying;
      const newMuteState = !isMuted;
      await videoRef.current.setIsMutedAsync(newMuteState);
      setIsMuted(newMuteState);
      if (wasPlaying) {
        await new Promise((res) => setTimeout(res, 50));
        const newStatus = await videoRef.current.getStatusAsync();
        if (!newStatus.isPlaying) {
          await videoRef.current.playAsync();
          setIsPlaying(true);
        }
      }
      resetControlsTimer();
    } catch (e) {
      console.error('Error toggling mute:', e);
    } finally {
      isMutingRef.current = false;
    }
  };

  const handleSeekStart = () => {
    isSeekingRef.current = true;
    setIsSeeking(true);
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
  };

  const handleSeekMove = (event) => {
    const { locationX } = event.nativeEvent;
    const progress = Math.max(0, Math.min(locationX / progressBarWidth.current, 1));
    const newPosition = progress * duration;
    setSeekPosition(newPosition);
    setPosition(newPosition);
  };

  const handleSeekEnd = async () => {
    if (videoRef.current && duration > 0) {
      try {
        await videoRef.current.setPositionAsync(seekPosition);
        setPosition(seekPosition);
        setDidJustFinish(false);
      } catch (e) {
        console.error('Error seeking:', e);
      } finally {
        isSeekingRef.current = false;
        setIsSeeking(false);
        resetControlsTimer();
      }
    } else {
      isSeekingRef.current = false;
      setIsSeeking(false);
      resetControlsTimer();
    }
  };

  // ─── Like Video ──────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (isLikingRef.current) return;
    const shouldLike = !isLiked;
    isLikingRef.current = true;
    setIsLiked(shouldLike);
    setLikesCount((prev) => Math.max(shouldLike ? prev + 1 : prev - 1, 0));

    Animated.sequence([
      Animated.spring(likeAnim, { toValue: 0.7, friction: 3, tension: 40, useNativeDriver: true }),
      Animated.spring(likeAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();

    try {
      const response = shouldLike ? await likeVideo(id) : await unlikeVideo(id);
      if (response?.data) {
        setIsLiked(response.data.liked === true);
        setLikesCount(Math.max(response.data.likes || 0, 0));
      }
    } catch (e) {
      console.error('❌ handleLike error:', e);
      setIsLiked(!shouldLike);
      setLikesCount((prev) => Math.max(shouldLike ? prev - 1 : prev + 1, 0));
      Alert.alert('Error', 'Failed to update like');
    } finally {
      isLikingRef.current = false;
    }
  };

  // ─── Bookmark ────────────────────────────────────────────────────────────
  const handleBookmark = async () => {
    try {
      const newState = !isBookmarked;
      setIsBookmarked(newState);
      const existing = await AsyncStorage.getItem('savedArticles');
      let savedItems = existing ? JSON.parse(existing) : [];

      if (newState) {
        const toSave = {
          id: video._id || video.id,
          title: video.title,
          image: video.thumbnail || video.image,
          channelName: video.channelId?.channelName || video.channelName || 'Unknown',
          type: 'video',
          timestamp: Date.now(),
        };
        if (!savedItems.some((item) => item.id === toSave.id)) {
          savedItems.push(toSave);
          await AsyncStorage.setItem('savedArticles', JSON.stringify(savedItems));
          Alert.alert('Saved', 'Video saved to bookmarks!');
        } else {
          Alert.alert('Info', 'Video already saved');
        }
      } else {
        savedItems = savedItems.filter((item) => item.id !== (video._id || video.id));
        await AsyncStorage.setItem('savedArticles', JSON.stringify(savedItems));
        Alert.alert('Removed', 'Video removed from bookmarks');
      }
    } catch (e) {
      console.error('Error toggling bookmark:', e);
      setIsBookmarked(!isBookmarked);
      Alert.alert('Error', 'Failed to save video');
    }
  };

  // ─── Share ───────────────────────────────────────────────────────────────
  const handleShare = async () => {
    try {
      await Share.share({
        title: video?.title || 'Video on BartaOne',
        message: `📹 ${video?.title || 'Video'} on BartaOne\n\n${
          video?.description || 'Check out this video on BartaOne'
        }\n\n📱 Download BartaOne: https://bartaone.com/download`,
        url: `https://bartaone.com/video/${video?._id || id}`,
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to share video');
    }
  };

  const handleChannelPress = () => {
    const channelId = video?.channelId?._id || video?.channelId;
    if (channelId) router.push(`/(viewer)/ChannelDetails?id=${channelId}`);
  };

  const handleVideoTap = () => {
    setShowControls(!showControls);
    resetControlsTimer();
  };

  // ─── Render Comment ──────────────────────────────────────────────────────
  const renderComment = ({ item }) => {
    if (!item) return null;
    return (
      <View style={[styles.commentItem, { borderBottomColor: C.border }]}>
        <View style={styles.commentHeader}>
          <View style={styles.commentAvatar}>
            {item.userAvatar ? (
              <Image source={{ uri: item.userAvatar }} style={styles.commentAvatarImage} />
            ) : (
              <View style={[styles.commentAvatarPlaceholder, { backgroundColor: C.accentBg }]}>
                <Text style={[styles.commentAvatarText, { color: C.accent }]}>
                  {(item.userName || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.commentInfo}>
            <Text style={[styles.commentUserName, { color: C.primary }]}>
              {item.userName || 'Anonymous'}
            </Text>
            <Text style={[styles.commentTime, { color: C.muted }]}>
              {timeAgo(item.createdAt || item.timestamp)}
            </Text>
          </View>
          {/* Per-comment like button */}
          <TouchableOpacity
            onPress={() => handleLikeComment(item.id || item._id)}
            style={styles.commentLikeBtn}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={moderateScale(16)}
              color={item.isLiked ? C.accent : C.muted}
            />
            <Text style={[styles.commentLikeCount, { color: C.muted }]}>
              {Math.max(item.likes || 0, 0)}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.commentText, { color: C.secondary }]}>
          {item.content || item.text || item.comment || 'No content'}
        </Text>

        <TouchableOpacity
          onPress={() => handleReply(item)}
          style={styles.commentReplyBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={moderateScale(14)} color={C.muted} />
          <Text style={[styles.commentReplyText, { color: C.muted }]}>Reply</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) return <Loader message="Loading video..." />;

  const styles = makeStyles(C);
  const currentPosition = isSeeking ? seekPosition : position;

  if (!video) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top', 'bottom']}>
        <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} />
        <View style={styles.errorContainer}>
          <View style={[styles.errorIconWrap, { backgroundColor: C.accentBg }]}>
            <Ionicons name="alert-circle-outline" size={moderateScale(40)} color={C.accent} />
          </View>
          <Text style={[styles.errorTitle, { color: C.primary }]}>Video not found</Text>
          <Text style={[styles.errorSub, { color: C.muted }]}>
            This video may have been removed or the link is invalid.
          </Text>
          <TouchableOpacity
            style={[styles.errorBtn, { backgroundColor: C.accent }]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={moderateScale(16)} color="#FFF" />
            <Text style={styles.errorBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, isFullscreen && styles.fullscreen]} edges={['top', 'bottom']}>
      <StatusBar
        barStyle={isFullscreen ? 'light-content' : C.statusBar}
        backgroundColor="transparent"
        translucent
      />

      {!isFullscreen && <View style={[styles.topStripe, { backgroundColor: C.accent }]} />}

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/*
          KeyboardAwareScrollView — same as ArticleDetails.
          Keeps the comment input visible when the keyboard opens,
          especially on Android where KeyboardAvoidingView often fails.
        */}
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={!isFullscreen}
          scrollEnabled={!isFullscreen}
          enableOnAndroid
          extraScrollHeight={verticalScale(80)}
          keyboardShouldPersistTaps="handled"
          enableResetScrollToCoords={false}
          scrollEventThrottle={16}
        >
          {/* ── Video Player ── */}
          <View
            style={[
              styles.videoContainer,
              isFullscreen && styles.videoFullscreen,
              { height: videoHeight },
            ]}
          >
            {/* Back Button */}
            {!isFullscreen && (
              <TouchableOpacity
                style={[styles.backButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                onPress={() => {
                  if (videoRef.current) videoRef.current.stopAsync();
                  router.back();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={moderateScale(22)} color="#FFF" />
              </TouchableOpacity>
            )}

            {/* Bookmark Button */}
            {!isFullscreen && (
              <TouchableOpacity
                style={[styles.bookmarkButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                onPress={handleBookmark}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={moderateScale(22)}
                  color={isBookmarked ? '#FFD93D' : '#FFF'}
                />
              </TouchableOpacity>
            )}

            {/* Share Button */}
            {!isFullscreen && (
              <TouchableOpacity
                style={[styles.shareButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Ionicons name="share-social-outline" size={moderateScale(20)} color="#FFF" />
              </TouchableOpacity>
            )}

            {/* Video */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleVideoTap}
              style={styles.videoTouchable}
            >
              <Video
                ref={videoRef}
                source={{ uri: video.videoUrl || video.url }}
                style={styles.video}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={false}
                isLooping={false}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                onFullscreenUpdate={handleFullscreenUpdate}
                useNativeControls={false}
                isMuted={isMuted}
              />
            </TouchableOpacity>

            {isBuffering && (
              <View style={styles.bufferOverlay}>
                <ActivityIndicator size="large" color="#FFF" />
              </View>
            )}

            {/* Controls overlay */}
            {showControls && (
              <>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={togglePlayback}
                  activeOpacity={0.8}
                >
                  <View style={styles.playButtonBackground}>
                    <Ionicons
                      name={didJustFinish ? 'refresh' : isPlaying ? 'pause' : 'play'}
                      size={moderateScale(40)}
                      color="#FFF"
                    />
                  </View>
                </TouchableOpacity>

                <View style={styles.controls}>
                  <TouchableOpacity
                    style={[styles.controlButton, isMutingRef.current && styles.controlButtonDisabled]}
                    onPress={toggleMute}
                    activeOpacity={0.7}
                    disabled={isMutingRef.current}
                  >
                    <Ionicons
                      name={isMuted ? 'volume-mute' : 'volume-high'}
                      size={moderateScale(22)}
                      color="#FFF"
                    />
                  </TouchableOpacity>

                  <View
                    style={styles.progressContainer}
                    onLayout={(e) => { progressBarWidth.current = e.nativeEvent.layout.width; }}
                  >
                    <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
                    <View style={styles.progressBarWrapper}>
                      <View
                        style={styles.progressBar}
                        onTouchStart={handleSeekStart}
                        onTouchMove={handleSeekMove}
                        onTouchEnd={handleSeekEnd}
                      >
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${duration > 0 ? (currentPosition / duration) * 100 : 0}%` },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={toggleFullscreen}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isFullscreen ? 'contract' : 'expand'}
                      size={moderateScale(24)}
                      color="#FFF"
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* ── Content ── */}
          {!isFullscreen && (
            <Animated.View
              style={[
                styles.contentWrapper,
                {
                  backgroundColor: C.surface,
                  transform: [{ translateY: slideUpAnim }],
                },
              ]}
            >
              {/* Category Badge */}
              {video.category && (
                <View style={[styles.categoryBadge, { backgroundColor: C.accentBg }]}>
                  <Text style={[styles.categoryText, { color: C.accent }]}>
                    {video.category}
                  </Text>
                </View>
              )}

              {/* Title */}
              <Text style={[styles.title, { color: C.primary }]}>
                {video.title || 'Untitled Video'}
              </Text>

              {/* Channel Meta */}
              <View style={styles.metaContainer}>
                <TouchableOpacity
                  style={styles.channelTouch}
                  onPress={handleChannelPress}
                  disabled={!video.channelId}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: video.channelId?.logo || 'https://via.placeholder.com/40' }}
                    style={styles.channelAvatar}
                  />
                  <View style={styles.channelInfo}>
                    <Text style={[styles.channelName, { color: C.primary }]}>
                      {video.channelId?.channelName || 'Unknown Channel'}
                    </Text>
                    <Text style={[styles.timeAgoText, { color: C.muted }]}>
                      {timeAgo(video.createdAt)} · {video.views || 0} views
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={[styles.divider, { backgroundColor: C.border }]} />

              {/* Description */}
              {video.description && (
                <Text style={[styles.description, { color: C.secondary }]}>
                  {video.description}
                </Text>
              )}

              {/* Tags */}
              {video.tags && video.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {video.tags.map((tag, index) => (
                    <View key={index} style={[styles.tag, { backgroundColor: C.accentBg }]}>
                      <Text style={[styles.tagText, { color: C.accent }]}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={[styles.divider, { backgroundColor: C.border }]} />

              {/* ── Actions ── */}
              <Animated.View
                style={[
                  styles.actionsContainer,
                  {
                    opacity: contentAnim,
                    transform: [{
                      translateY: contentAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [verticalScale(15), 0],
                      }),
                    }],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleLike}
                  activeOpacity={0.6}
                  disabled={isLikingRef.current}
                >
                  <Animated.View style={{ transform: [{ scale: likeAnim }] }}>
                    <Ionicons
                      name={isLiked ? 'heart' : 'heart-outline'}
                      size={moderateScale(24)}
                      color={isLiked ? C.accent : C.muted}
                    />
                  </Animated.View>
                  <Text style={[styles.actionText, { color: C.muted }]}>
                    {Math.max(likesCount, 0)} Likes
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowComments((v) => !v)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chatbubble-outline" size={moderateScale(22)} color={C.muted} />
                  <Text style={[styles.actionText, { color: C.muted }]}>
                    {comments.length} Comments
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleShare} activeOpacity={0.7}>
                  <Ionicons name="share-social-outline" size={moderateScale(22)} color={C.muted} />
                  <Text style={[styles.actionText, { color: C.muted }]}>Share</Text>
                </TouchableOpacity>
              </Animated.View>

              {/* ── Comments Section ── */}
              {showComments && (
                <View style={styles.commentsSection}>
                  <Text style={[styles.commentsTitle, { color: C.primary }]}>
                    Comments ({comments.length})
                  </Text>

                  {/* Comment Input */}
                  <View style={styles.commentInputContainer}>
                    {/* Reply indicator */}
                    {replyTo && (
                      <Animated.View
                        style={[
                          styles.replyIndicator,
                          {
                            backgroundColor: C.accentBg,
                            opacity: commentInputAnim,
                            transform: [{
                              scaleY: commentInputAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 1],
                              }),
                            }],
                          },
                        ]}
                      >
                        <Text style={[styles.replyIndicatorText, { color: C.accent }]}>
                          Replying to @{replyTo.userName || 'user'}
                        </Text>
                        <TouchableOpacity onPress={handleCancelReply} activeOpacity={0.7}>
                          <Ionicons name="close-circle" size={moderateScale(18)} color={C.muted} />
                        </TouchableOpacity>
                      </Animated.View>
                    )}

                    <View
                      style={[
                        styles.commentInputWrapper,
                        { borderColor: C.border, backgroundColor: C.surfaceAlt },
                      ]}
                    >
                      <TextInput
                        style={[styles.commentInput, { color: C.primary }]}
                        placeholder="Write a comment…"
                        placeholderTextColor={C.muted}
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline
                        maxLength={500}
                      />
                      <TouchableOpacity
                        style={[
                          styles.commentSendBtn,
                          { backgroundColor: commentText.trim() ? C.accent : C.faint },
                        ]}
                        onPress={handleSubmitComment}
                        disabled={isSubmittingComment || !commentText.trim()}
                        activeOpacity={0.7}
                      >
                        {isSubmittingComment ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <Ionicons name="send" size={moderateScale(16)} color="#FFF" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Comments List */}
                  {isLoadingComments ? (
                    <View style={styles.loadingComments}>
                      <ActivityIndicator size="small" color={C.accent} />
                      <Text style={[styles.loadingCommentsText, { color: C.muted }]}>
                        Loading comments…
                      </Text>
                    </View>
                  ) : comments.length > 0 ? (
                    <FlatList
                      data={comments}
                      keyExtractor={(item, index) =>
                        String(item?.id || item?._id || `comment-${index}`)
                      }
                      renderItem={renderComment}
                      scrollEnabled={false}
                      style={styles.commentsList}
                      ListEmptyComponent={null}
                    />
                  ) : (
                    <View style={styles.noComments}>
                      <Ionicons name="chatbubble-outline" size={moderateScale(40)} color={C.faint} />
                      <Text style={[styles.noCommentsText, { color: C.muted }]}>
                        No comments yet. Be the first!
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </Animated.View>
          )}
        </KeyboardAwareScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const makeStyles = (C) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: C.bg,
    },
    fullscreen: {
      backgroundColor: '#000',
    },
    topStripe: {
      height: verticalScale(3),
      zIndex: 10,
    },
    scrollContent: {
      paddingBottom: verticalScale(40),
    },

    // ── Video ──
    videoContainer: {
      width: '100%',
      height: verticalScale(240),
      backgroundColor: '#000',
      position: 'relative',
    },
    videoFullscreen: {
      height: SCREEN_HEIGHT,
      width: '100%',
    },
    videoTouchable: { flex: 1 },
    video: { width: '100%', height: '100%' },
    backButton: {
      position: 'absolute',
      top: verticalScale(16),
      left: scale(16),
      zIndex: 20,
      width: scale(42),
      height: scale(42),
      borderRadius: scale(21),
      justifyContent: 'center',
      alignItems: 'center',
    },
    bookmarkButton: {
      position: 'absolute',
      top: verticalScale(16),
      right: scale(72),
      zIndex: 20,
      width: scale(42),
      height: scale(42),
      borderRadius: scale(21),
      justifyContent: 'center',
      alignItems: 'center',
    },
    shareButton: {
      position: 'absolute',
      top: verticalScale(16),
      right: scale(16),
      zIndex: 20,
      width: scale(42),
      height: scale(42),
      borderRadius: scale(21),
      justifyContent: 'center',
      alignItems: 'center',
    },
    playButton: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -scale(30) }, { translateY: -scale(30) }],
      zIndex: 15,
    },
    playButtonBackground: {
      width: scale(60),
      height: scale(60),
      borderRadius: scale(30),
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    bufferOverlay: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 5,
    },
    controls: {
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      paddingVertical: verticalScale(12),
      paddingHorizontal: scale(16),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(0,0,0,0.7)',
      zIndex: 15,
      gap: scale(8),
    },
    controlButton: {
      padding: scale(4),
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: scale(36),
      justifyContent: 'center',
      minHeight: verticalScale(36),
    },
    controlButtonDisabled: { opacity: 0.5 },
    progressContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(8),
    },
    progressBarWrapper: {
      flex: 1,
      height: verticalScale(30),
      justifyContent: 'center',
    },
    progressBar: {
      height: scale(4),
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderRadius: scale(2),
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: C.accent || '#FF6B6B',
      borderRadius: scale(2),
    },
    timeText: {
      color: '#FFF',
      fontSize: fontScale(11),
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      minWidth: scale(40),
    },

    // ── Content ──
    contentWrapper: {
      marginTop: -verticalScale(20),
      borderTopLeftRadius: scale(24),
      borderTopRightRadius: scale(24),
      paddingHorizontal: scale(20),
      paddingTop: verticalScale(24),
      paddingBottom: verticalScale(24),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(-4) },
      shadowOpacity: 0.06,
      shadowRadius: scale(12),
      elevation: 8,
    },
    categoryBadge: {
      paddingHorizontal: scale(12),
      paddingVertical: verticalScale(4),
      borderRadius: scale(12),
      alignSelf: 'flex-start',
      marginBottom: verticalScale(12),
    },
    categoryText: {
      fontSize: fontScale(12),
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    title: {
      fontSize: fontScale(22),
      fontWeight: '800',
      lineHeight: fontScale(30),
      marginBottom: verticalScale(12),
      letterSpacing: -0.3,
    },
    metaContainer: { marginBottom: verticalScale(16) },
    channelTouch: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(12),
    },
    channelInfo: { flex: 1 },
    channelAvatar: {
      width: scale(40),
      height: scale(40),
      borderRadius: scale(20),
    },
    channelName: {
      fontSize: fontScale(15),
      fontWeight: '600',
    },
    timeAgoText: {
      fontSize: fontScale(12),
      marginTop: verticalScale(2),
    },
    divider: {
      height: 1,
      marginVertical: verticalScale(16),
    },
    description: {
      fontSize: fontScale(15),
      lineHeight: fontScale(24),
      letterSpacing: 0.2,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: scale(8),
      marginTop: verticalScale(12),
    },
    tag: {
      paddingHorizontal: scale(12),
      paddingVertical: verticalScale(4),
      borderRadius: scale(8),
    },
    tagText: {
      fontSize: fontScale(12),
      fontWeight: '500',
    },

    // ── Actions ──
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: verticalScale(8),
      marginTop: verticalScale(4),
      flexWrap: 'wrap',
      gap: scale(8),
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(8),
      padding: scale(8),
      minHeight: verticalScale(40),
    },
    actionText: {
      fontSize: fontScale(13),
      fontWeight: '500',
    },

    // ── Comments ──
    commentsSection: { marginTop: verticalScale(16) },
    commentsTitle: {
      fontSize: fontScale(18),
      fontWeight: '700',
      marginBottom: verticalScale(14),
    },
    commentInputContainer: { marginBottom: verticalScale(16) },
    replyIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: scale(12),
      paddingVertical: verticalScale(6),
      borderRadius: scale(8),
      marginBottom: verticalScale(8),
    },
    replyIndicatorText: {
      fontSize: fontScale(12),
      fontWeight: '500',
    },
    commentInputWrapper: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      borderWidth: 1,
      borderRadius: scale(12),
      paddingHorizontal: scale(12),
      paddingVertical: verticalScale(4),
    },
    commentInput: {
      flex: 1,
      fontSize: fontScale(14),
      minHeight: verticalScale(40),
      maxHeight: verticalScale(100),
      paddingVertical: verticalScale(8),
      padding: 0,
    },
    commentSendBtn: {
      width: scale(36),
      height: scale(36),
      borderRadius: scale(18),
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: scale(8),
      marginBottom: verticalScale(4),
    },
    commentsList: { marginTop: verticalScale(8) },
    commentItem: {
      paddingVertical: verticalScale(12),
      borderBottomWidth: 1,
    },
    commentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: verticalScale(6),
    },
    commentAvatar: {
      width: scale(32),
      height: scale(32),
      borderRadius: scale(16),
      marginRight: scale(10),
      overflow: 'hidden',
      flexShrink: 0,
    },
    commentAvatarImage: { width: '100%', height: '100%' },
    commentAvatarPlaceholder: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    commentAvatarText: {
      fontSize: fontScale(14),
      fontWeight: '600',
    },
    commentInfo: { flex: 1 },
    commentUserName: {
      fontSize: fontScale(13),
      fontWeight: '600',
    },
    commentTime: { fontSize: fontScale(11) },
    commentLikeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(4),
      padding: scale(4),
    },
    commentLikeCount: { fontSize: fontScale(12) },
    commentText: {
      fontSize: fontScale(14),
      lineHeight: fontScale(20),
      marginBottom: verticalScale(4),
    },
    commentReplyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(4),
      marginTop: verticalScale(4),
      alignSelf: 'flex-start',
    },
    commentReplyText: {
      fontSize: fontScale(12),
      fontWeight: '500',
    },
    loadingComments: {
      padding: verticalScale(20),
      alignItems: 'center',
    },
    loadingCommentsText: {
      fontSize: fontScale(14),
      marginTop: verticalScale(8),
    },
    noComments: {
      padding: verticalScale(30),
      alignItems: 'center',
    },
    noCommentsText: {
      fontSize: fontScale(14),
      marginTop: verticalScale(8),
      textAlign: 'center',
    },

    // ── Error ──
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
      color: '#FFFFFF',
      fontSize: fontScale(15),
      fontWeight: '700',
    },
  });