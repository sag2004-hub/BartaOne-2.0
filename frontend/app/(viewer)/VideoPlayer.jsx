// app/(viewer)/VideoPlayer.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
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
  KeyboardAvoidingView,
  FlatList,
} from 'react-native';
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
  getVideoComments 
} from '../../services/videoService';
import { timeAgo } from '../../utils/helpers';
import { useAuth } from '../../hooks/useAuth';

const { width, height } = Dimensions.get('window');
const BASE_W = 390;
const scale = (n) => Math.round((width / BASE_W) * n);
const vs = (n) => Math.round((height / 844) * n);
const sp = (n) => n / PixelRatio.getFontScale();

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

  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [videoHeight, setVideoHeight] = useState(vs(240));
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const [didJustFinish, setDidJustFinish] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  
  const videoRef = useRef(null);
  const controlsTimer = useRef(null);
  const progressBarWidth = useRef(0);
  const isMutingRef = useRef(false);
  const isSeekingRef = useRef(false);
  const isLikingRef = useRef(false);

  // ── Animations ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(vs(30))).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (id) {
      loadVideo();
    } else {
      Alert.alert('Error', 'Video ID is missing');
      router.back();
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.stopAsync();
      }
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
    };
  }, [id]);

  // ─── Load Bookmark Status ──────────────────────────────────────────────
  const loadBookmarkStatus = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedArticles');
      if (saved) {
        const savedItems = JSON.parse(saved);
        const isSaved = savedItems.some(item => item.id === id);
        setIsBookmarked(isSaved);
      }
    } catch (error) {
      console.error('Error loading bookmark status:', error);
    }
  };

  // ─── Add to Reading History ────────────────────────────────────────────
  const addToReadingHistory = async () => {
    try {
      if (!video) return;
      
      const existing = await AsyncStorage.getItem('readingHistory');
      let history = existing ? JSON.parse(existing) : [];
      
      history = history.filter(item => item.id !== video._id);
      
      history.unshift({
        id: video._id,
        title: video.title,
        image: video.thumbnail || video.image,
        channelName: video.channelId?.channelName || video.channelName || 'Unknown',
        type: 'video',
        timestamp: Date.now(),
      });
      
      if (history.length > 50) {
        history = history.slice(0, 50);
      }
      
      await AsyncStorage.setItem('readingHistory', JSON.stringify(history));
      console.log('✅ Added video to reading history:', video.title);
    } catch (error) {
      console.error('Error adding video to history:', error);
    }
  };

  const loadVideo = async () => {
    setIsLoading(true);
    try {
      console.log('📡 [loadVideo] Fetching video with ID:', id);
      const data = await getVideoById(id);
      console.log('📡 [loadVideo] Video data received:', JSON.stringify(data, null, 2));
      
      let videoData = data;
      if (data?.data?.data) {
        videoData = data.data.data;
      } else if (data?.data) {
        videoData = data.data;
      } else if (data?.video) {
        videoData = data.video;
      }
      
      console.log('📊 [loadVideo] Video data parsed:');
      console.log('  - Likes:', videoData.likes);
      console.log('  - isLiked:', videoData.isLiked);
      
      setVideo(videoData);
      setLikesCount(Math.max(videoData.likes || 0, 0));
      setIsLiked(videoData.isLiked === true);
      
      await loadBookmarkStatus();
      await addToReadingHistory();
      await loadComments();

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideUpAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(contentAnim, {
          toValue: 1,
          duration: 400,
          delay: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

    } catch (error) {
      console.error('❌ [loadVideo] Error loading video:', error);
      Alert.alert(
        'Error',
        'Failed to load video. Please try again.',
        [
          { text: 'Retry', onPress: loadVideo },
          { text: 'Go Back', onPress: () => router.back() }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      console.log('📡 [loadComments] Fetching comments for video:', id);
      const response = await getVideoComments(id);
      console.log('📡 [loadComments] Comments response:', response);
      
      let commentsData = [];
      if (response?.data?.comments) {
        commentsData = response.data.comments;
      } else if (response?.comments) {
        commentsData = response.comments;
      } else if (Array.isArray(response)) {
        commentsData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        commentsData = response.data;
      }
      
      setComments(commentsData || []);
      console.log('📡 [loadComments] Comments loaded:', commentsData?.length || 0);
    } catch (error) {
      console.error('❌ [loadComments] Error loading comments:', error);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    if (!user) {
      Alert.alert('Login Required', 'Please login to comment');
      return;
    }

    setIsSubmittingComment(true);
    try {
      const commentData = {
        content: commentText.trim(),
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userAvatar: user.photoURL || null,
      };

      console.log('📤 [handleSubmitComment] Submitting comment with data:', commentData);
      
      const response = await commentOnVideo(id, commentData);
      console.log('✅ [handleSubmitComment] Comment submitted successfully:', response);

      const newComment = response?.data || response?.comment || {
        id: Date.now().toString(),
        _id: Date.now().toString(),
        content: commentData.content,
        text: commentData.content,
        userName: commentData.userName,
        userAvatar: commentData.userAvatar,
        userId: commentData.userId,
        createdAt: new Date().toISOString(),
        likes: 0,
        isLiked: false,
      };
      
      setComments([newComment, ...comments]);
      setCommentText('');
      Alert.alert('Success', 'Comment added successfully');
    } catch (error) {
      console.error('❌ [handleSubmitComment] Error submitting comment:', error);
      Alert.alert('Error', error.message || 'Failed to submit comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const togglePlayback = async () => {
    if (videoRef.current) {
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
      } catch (error) {
        console.error('Error toggling playback:', error);
      }
    }
  };

  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setIsBuffering(status.isBuffering);
      setDuration(status.durationMillis || 0);
      
      if (!isSeekingRef.current) {
        setPosition(status.positionMillis || 0);
      }
      
      if (!isMutingRef.current) {
        setIsPlaying(status.isPlaying);
      }
      
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
    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
    }
    setShowControls(true);
    controlsTimer.current = setTimeout(() => {
      if (!isSeekingRef.current) {
        setShowControls(false);
      }
    }, 3000);
  };

  const toggleFullscreen = async () => {
    try {
      if (videoRef.current) {
        if (!isFullscreen) {
          await videoRef.current.presentFullscreenPlayer();
          setIsFullscreen(true);
          setVideoHeight(height);
          StatusBar.setHidden(true);
        } else {
          await videoRef.current.dismissFullscreenPlayer();
          setIsFullscreen(false);
          setVideoHeight(vs(240));
          StatusBar.setHidden(false);
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      Alert.alert('Info', 'Fullscreen mode not available on this device');
    }
  };

  const handleFullscreenUpdate = (event) => {
    const { fullscreenUpdate } = event;
    if (fullscreenUpdate === 0) {
      setIsFullscreen(true);
      setVideoHeight(height);
      StatusBar.setHidden(true);
    } else if (fullscreenUpdate === 1) {
      setIsFullscreen(false);
      setVideoHeight(vs(240));
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
        await new Promise(resolve => setTimeout(resolve, 50));
        const newStatus = await videoRef.current.getStatusAsync();
        if (!newStatus.isPlaying) {
          await videoRef.current.playAsync();
          setIsPlaying(true);
        }
      }
      
      resetControlsTimer();
    } catch (error) {
      console.error('Error toggling mute:', error);
    } finally {
      isMutingRef.current = false;
    }
  };

  const handleSeekStart = (event) => {
    isSeekingRef.current = true;
    setIsSeeking(true);
    setShowControls(true);
    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
    }
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
        const seekTo = seekPosition;
        await videoRef.current.setPositionAsync(seekTo);
        setPosition(seekTo);
        setDidJustFinish(false);
      } catch (error) {
        console.error('Error seeking:', error);
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

  const handleProgressTouchStart = (event) => {
    handleSeekStart(event);
  };

  const handleProgressTouchMove = (event) => {
    handleSeekMove(event);
  };

  const handleProgressTouchEnd = () => {
    handleSeekEnd();
  };

  // ─── Like Video ──────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (isLikingRef.current) return;

    const shouldLike = !isLiked;
    isLikingRef.current = true;

    const newLikesCount = shouldLike ? likesCount + 1 : Math.max(likesCount - 1, 0);
    setIsLiked(shouldLike);
    setLikesCount(newLikesCount);

    try {
      let response;
      if (shouldLike) {
        response = await likeVideo(id);
      } else {
        response = await unlikeVideo(id);
      }
      
      if (response?.data) {
        const { liked, likes } = response.data;
        setIsLiked(liked === true);
        setLikesCount(Math.max(likes || 0, 0));
      }
    } catch (error) {
      console.error('❌ [handleLike] Error:', error);
      setIsLiked(!shouldLike);
      setLikesCount(prev => Math.max(shouldLike ? prev - 1 : prev + 1, 0));
      Alert.alert('Error', 'Failed to update like');
    } finally {
      isLikingRef.current = false;
    }
  };

  // ─── Bookmark / Save Video ─────────────────────────────────────────────
  const handleBookmark = async () => {
    try {
      const newBookmarkState = !isBookmarked;
      setIsBookmarked(newBookmarkState);
      
      const existing = await AsyncStorage.getItem('savedArticles');
      let savedItems = existing ? JSON.parse(existing) : [];
      
      if (newBookmarkState) {
        const videoToSave = {
          id: video._id || video.id,
          title: video.title,
          image: video.thumbnail || video.image,
          channelName: video.channelId?.channelName || video.channelName || 'Unknown',
          type: 'video',
          timestamp: Date.now(),
        };
        
        if (!savedItems.some(item => item.id === videoToSave.id)) {
          savedItems.push(videoToSave);
          await AsyncStorage.setItem('savedArticles', JSON.stringify(savedItems));
          Alert.alert('Success', 'Video saved to bookmarks!');
        } else {
          Alert.alert('Info', 'Video already saved');
        }
      } else {
        savedItems = savedItems.filter(item => item.id !== (video._id || video.id));
        await AsyncStorage.setItem('savedArticles', JSON.stringify(savedItems));
        Alert.alert('Removed', 'Video removed from bookmarks');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      setIsBookmarked(!isBookmarked);
      Alert.alert('Error', 'Failed to save video');
    }
  };

  const handleShare = async () => {
    try {
      const shareMessage = `
📹 ${video?.title || 'Video'} on BartaOne

${video?.description || 'Check out this video on BartaOne'}

📱 Download BartaOne: https://bartaone.com/download
      `;

      await Share.share({
        title: video?.title || 'Video on BartaOne',
        message: shareMessage,
        url: `https://bartaone.com/video/${video?._id || id}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share video');
    }
  };

  const handleChannelPress = () => {
    const channelId = video?.channelId?._id || video?.channelId;
    if (channelId) {
      router.push(`/(viewer)/ChannelDetails?id=${channelId}`);
    }
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
        </View>
        
        <Text style={[styles.commentText, { color: C.secondary }]}>
          {item.content || item.text || item.comment || 'No content'}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return <Loader message="Loading video..." />;
  }

  if (!video) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
        <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} />
        <View style={styles.errorContainer}>
          <View style={[styles.errorIconWrap, { backgroundColor: C.accentBg }]}>
            <Ionicons name="alert-circle-outline" size={scale(40)} color={C.accent} />
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
            <Ionicons name="arrow-back" size={scale(16)} color="#FFF" />
            <Text style={styles.errorBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const styles = makeStyles(C);
  const currentPosition = isSeeking ? seekPosition : position;

  return (
    <SafeAreaView style={[styles.root, isFullscreen && styles.fullscreen]} edges={['top']}>
      <StatusBar barStyle={isFullscreen ? 'light-content' : C.statusBar} backgroundColor="transparent" translucent />

      {!isFullscreen && (
        <View style={[styles.topStripe, { backgroundColor: C.accent }]} />
      )}

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={!isFullscreen}
            scrollEnabled={!isFullscreen}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Video Player ── */}
            <View style={[
              styles.videoContainer,
              isFullscreen && styles.videoFullscreen,
              { height: videoHeight }
            ]}>
              {/* Back Button */}
              {!isFullscreen && (
                <TouchableOpacity
                  style={[styles.backButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                  onPress={() => {
                    if (videoRef.current) {
                      videoRef.current.stopAsync();
                    }
                    router.back();
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={scale(22)} color="#FFF" />
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
                    size={scale(22)}
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
                  <Ionicons name="share-social-outline" size={scale(20)} color="#FFF" />
                </TouchableOpacity>
              )}

              {/* Video Player */}
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

              {/* ── Video Controls Overlay ── */}
              {showControls && (
                <>
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={togglePlayback}
                    activeOpacity={0.8}
                  >
                    <View style={styles.playButtonBackground}>
                      <Ionicons
                        name={didJustFinish ? 'refresh' : (isPlaying ? 'pause' : 'play')}
                        size={scale(40)}
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
                        size={scale(22)}
                        color="#FFF"
                      />
                    </TouchableOpacity>
                    
                    <View 
                      style={styles.progressContainer}
                      onLayout={(event) => {
                        progressBarWidth.current = event.nativeEvent.layout.width;
                      }}
                    >
                      <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
                      
                      <View style={styles.progressBarWrapper}>
                        <View 
                          style={styles.progressBar}
                          onTouchStart={handleProgressTouchStart}
                          onTouchMove={handleProgressTouchMove}
                          onTouchEnd={handleProgressTouchEnd}
                        >
                          <View 
                            style={[
                              styles.progressFill, 
                              { 
                                width: `${duration > 0 ? (currentPosition / duration) * 100 : 0}%` 
                              }
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
                        size={scale(24)}
                        color="#FFF"
                      />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            {/* ── Content ── */}
            {!isFullscreen && (
              <Animated.View style={[
                styles.contentWrapper,
                {
                  backgroundColor: C.surface,
                  transform: [{
                    translateY: slideUpAnim
                  }]
                }
              ]}>
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

                {/* Meta Info */}
                <View style={styles.metaContainer}>
                  <TouchableOpacity
                    style={styles.channelTouch}
                    onPress={handleChannelPress}
                    disabled={!video.channelId}
                  >
                    <Image
                      source={{ uri: video.channelId?.logo || 'https://via.placeholder.com/40' }}
                      style={styles.channelAvatar}
                    />
                    <View>
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
                  <View style={styles.descriptionContainer}>
                    <Text style={[styles.description, { color: C.secondary }]}>
                      {video.description}
                    </Text>
                  </View>
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
                <Animated.View style={[
                  styles.actionsContainer,
                  {
                    opacity: contentAnim,
                    transform: [{
                      translateY: contentAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [vs(15), 0]
                      })
                    }]
                  }
                ]}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleLike}
                    activeOpacity={0.6}
                    disabled={isLikingRef.current}
                  >
                    <Ionicons
                      name={isLiked ? 'heart' : 'heart-outline'}
                      size={scale(24)}
                      color={isLiked ? C.accent : C.muted}
                    />
                    <Text style={[styles.actionText, { color: C.muted }]}>
                      {Math.max(likesCount, 0)} Likes
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setShowComments(!showComments)}
                  >
                    <Ionicons name="chatbubble-outline" size={scale(22)} color={C.muted} />
                    <Text style={[styles.actionText, { color: C.muted }]}>
                      {comments.length} Comments
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                    <Ionicons name="share-social-outline" size={scale(22)} color={C.muted} />
                    <Text style={[styles.actionText, { color: C.muted }]}>Share</Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* ── Comments Section ── */}
                {showComments && (
                  <View style={styles.commentsSection}>
                    <View style={styles.commentsHeader}>
                      <Text style={[styles.commentsTitle, { color: C.primary }]}>
                        Comments ({comments.length})
                      </Text>
                    </View>

                    {/* Comment Input */}
                    <View style={styles.commentInputContainer}>
                      <View style={[styles.commentInputWrapper, { borderColor: C.border }]}>
                        <TextInput
                          style={[styles.commentInput, { color: C.primary }]}
                          placeholder="Write a comment..."
                          placeholderTextColor={C.muted}
                          value={commentText}
                          onChangeText={setCommentText}
                          multiline
                          maxLength={500}
                        />
                        <TouchableOpacity
                          style={[styles.commentSendBtn, { backgroundColor: C.accent }]}
                          onPress={handleSubmitComment}
                          disabled={isSubmittingComment || !commentText.trim()}
                        >
                          {isSubmittingComment ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <Ionicons name="send" size={scale(18)} color="#FFF" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Comments List */}
                    {isLoadingComments ? (
                      <View style={styles.loadingComments}>
                        <ActivityIndicator size="small" color={C.accent} />
                        <Text style={[styles.loadingCommentsText, { color: C.muted }]}>
                          Loading comments...
                        </Text>
                      </View>
                    ) : comments.length > 0 ? (
                      <FlatList
                        data={comments}
                        keyExtractor={(item, index) => String(item?.id || item?._id || `comment-${index}`)}
                        renderItem={renderComment}
                        scrollEnabled={false}
                        style={styles.commentsList}
                        ListEmptyComponent={null}
                      />
                    ) : (
                      <View style={styles.noComments}>
                        <Ionicons name="chatbubble-outline" size={scale(40)} color={C.faint} />
                        <Text style={[styles.noCommentsText, { color: C.muted }]}>
                          No comments yet. Be the first to comment!
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </Animated.View>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────
const makeStyles = (C) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  fullscreen: {
    backgroundColor: '#000',
  },
  topStripe: {
    height: 3,
    backgroundColor: C.accent,
    zIndex: 10,
  },
  scrollContent: {
    paddingBottom: vs(30),
  },
  videoContainer: {
    width: '100%',
    height: vs(240),
    backgroundColor: '#000',
    position: 'relative',
  },
  videoFullscreen: {
    height: height,
    width: '100%',
  },
  videoTouchable: {
    flex: 1,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: vs(16),
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
    top: vs(16),
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
    top: vs(16),
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: vs(12),
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
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  progressBarWrapper: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.accent || '#FF6B6B',
    borderRadius: 2,
  },
  timeText: {
    color: '#FFF',
    fontSize: sp(11),
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    minWidth: scale(40),
  },
  contentWrapper: {
    marginTop: -vs(20),
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    paddingHorizontal: scale(20),
    paddingTop: vs(24),
    paddingBottom: vs(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(-4) },
    shadowOpacity: 0.06,
    shadowRadius: scale(12),
    elevation: 8,
  },
  categoryBadge: {
    paddingHorizontal: scale(12),
    paddingVertical: vs(4),
    borderRadius: scale(12),
    alignSelf: 'flex-start',
    marginBottom: vs(12),
  },
  categoryText: {
    fontSize: sp(12),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: sp(22),
    fontWeight: '800',
    lineHeight: sp(30),
    marginBottom: vs(12),
    letterSpacing: -0.3,
  },
  metaContainer: {
    marginBottom: vs(16),
  },
  channelTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  channelAvatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
  },
  channelName: {
    fontSize: sp(15),
    fontWeight: '600',
  },
  timeAgoText: {
    fontSize: sp(12),
    marginTop: vs(2),
  },
  divider: {
    height: 1,
    marginVertical: vs(16),
  },
  descriptionContainer: {
    marginTop: vs(4),
    marginBottom: vs(4),
  },
  description: {
    fontSize: sp(15),
    lineHeight: sp(24),
    letterSpacing: 0.2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
    marginTop: vs(12),
  },
  tag: {
    paddingHorizontal: scale(12),
    paddingVertical: vs(4),
    borderRadius: scale(8),
  },
  tagText: {
    fontSize: sp(12),
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: vs(8),
    marginTop: vs(4),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    padding: scale(8),
  },
  actionText: {
    fontSize: sp(13),
    fontWeight: '500',
  },
  commentsSection: {
    marginTop: vs(16),
  },
  commentsHeader: {
    marginBottom: vs(12),
  },
  commentsTitle: {
    fontSize: sp(18),
    fontWeight: '700',
  },
  commentInputContainer: {
    marginBottom: vs(16),
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    paddingVertical: vs(4),
  },
  commentInput: {
    flex: 1,
    fontSize: sp(14),
    minHeight: vs(40),
    maxHeight: vs(100),
    paddingVertical: vs(8),
  },
  commentSendBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(8),
    marginBottom: vs(4),
  },
  commentsList: {
    marginTop: vs(8),
  },
  commentItem: {
    paddingVertical: vs(12),
    borderBottomWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(6),
  },
  commentAvatar: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    marginRight: scale(10),
    overflow: 'hidden',
  },
  commentAvatarImage: {
    width: '100%',
    height: '100%',
  },
  commentAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    fontSize: sp(14),
    fontWeight: '600',
  },
  commentInfo: {
    flex: 1,
  },
  commentUserName: {
    fontSize: sp(13),
    fontWeight: '600',
  },
  commentTime: {
    fontSize: sp(11),
  },
  commentText: {
    fontSize: sp(14),
    lineHeight: sp(20),
    marginBottom: vs(4),
  },
  loadingComments: {
    padding: vs(20),
    alignItems: 'center',
  },
  loadingCommentsText: {
    fontSize: sp(14),
    marginTop: vs(8),
  },
  noComments: {
    padding: vs(30),
    alignItems: 'center',
  },
  noCommentsText: {
    fontSize: sp(14),
    marginTop: vs(8),
    textAlign: 'center',
  },
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
    marginBottom: vs(16),
  },
  errorTitle: {
    fontSize: sp(20),
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: vs(8),
  },
  errorSub: {
    fontSize: sp(14),
    textAlign: 'center',
    lineHeight: sp(22),
    marginBottom: vs(24),
  },
  errorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    paddingVertical: vs(13),
    paddingHorizontal: scale(28),
    borderRadius: scale(12),
  },
  errorBtnText: {
    color: '#FFFFFF',
    fontSize: sp(15),
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
});