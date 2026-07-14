// app/(viewer)/ArticleDetails.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  Alert,
  Dimensions,
  Animated,
  Easing,
  useColorScheme,
  PixelRatio,
  StatusBar,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loader from '../../components/Loader';
import {
  getArticleById,
  commentOnArticle,
  getArticleComments,
  likeArticle,
  unlikeArticle,
} from '../../services/articleService';
import { timeAgo } from '../../utils/helpers';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../services/firebase'; // ← direct fallback
import { userAPI } from '../../services/api';   // ← MongoDB profile

// ─── Responsive helpers ───────────────────────────────────────────────────────
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

// ─── Theme ────────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: '#F2F0EB',
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

export default function ArticleDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { user } = useAuth(); // may lag behind on cold start

  const [userProfile, setUserProfile] = useState(null); // MongoDB profile
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  // ── Animations ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(verticalScale(30))).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const likeAnim = useRef(new Animated.Value(1)).current;
  const commentInputAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (id) {
      loadArticle();
    } else {
      Alert.alert('Error', 'Article ID is missing');
      router.back();
    }
    // Fetch MongoDB profile so we always have the real name
    loadUserProfile();
  }, [id]);

  const loadUserProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      // Handle both { data: { user } } and { data: { data: { user } } } shapes
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
      // Non-fatal — comment will fall back to Firebase displayName or email prefix
      console.warn('⚠️ Could not load MongoDB profile:', e.message);
    }
  };

  // ─── Load Bookmark Status ─────────────────────────────────────────────────
  const loadBookmarkStatus = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedArticles');
      if (saved) {
        const savedArticles = JSON.parse(saved);
        setIsBookmarked(savedArticles.some((item) => item.id === id));
      }
    } catch (e) {
      console.error('Error loading bookmark status:', e);
    }
  };

  // ─── Add to Reading History ───────────────────────────────────────────────
  const addToReadingHistory = async (articleData) => {
    try {
      const existing = await AsyncStorage.getItem('readingHistory');
      let history = existing ? JSON.parse(existing) : [];
      history = history.filter((item) => item.id !== articleData._id);
      history.unshift({
        id: articleData._id,
        title: articleData.title,
        image: articleData.image,
        channelName:
          articleData.channelId?.channelName || articleData.channelName || 'Unknown',
        type: 'article',
        timestamp: Date.now(),
      });
      if (history.length > 50) history = history.slice(0, 50);
      await AsyncStorage.setItem('readingHistory', JSON.stringify(history));
    } catch (e) {
      console.error('Error adding to history:', e);
    }
  };

  // ─── Load Article ─────────────────────────────────────────────────────────
  const loadArticle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getArticleById(id);

      let articleData = data;
      if (data?.data?.data) articleData = data.data.data;
      else if (data?.data) articleData = data.data;
      else if (data?.article) articleData = data.article;

      if (!articleData || Object.keys(articleData).length === 0) {
        throw new Error('No article data received');
      }

      setArticle(articleData);
      setLikesCount(Math.max(articleData.likes || articleData.likeCount || 0, 0));
      setIsLiked(articleData.isLiked || false);

      await loadBookmarkStatus();
      await addToReadingHistory(articleData);
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
      ]).start();
    } catch (e) {
      console.error('❌ Error loading article:', e);
      setError(e.message || 'Failed to load article');
      Alert.alert(
        'Error',
        e.message || 'Failed to load article. Please try again.',
        [
          { text: 'Retry', onPress: loadArticle },
          { text: 'Go Back', onPress: () => router.back() },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Load Comments ────────────────────────────────────────────────────────
  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const response = await getArticleComments(id);
      let commentsData = [];
      if (response?.data?.comments) commentsData = response.data.comments;
      else if (response?.comments) commentsData = response.comments;
      else if (Array.isArray(response)) commentsData = response;
      else if (response?.data && Array.isArray(response.data)) commentsData = response.data;
      setComments(commentsData);
    } catch (e) {
      console.error('❌ Error loading comments:', e);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // ─── Submit Comment ───────────────────────────────────────────────────────
  // FIX: use auth.currentUser as the authoritative fallback.
  // useAuth()'s `user` can be null during the brief window between app start
  // and Firebase resolving onAuthStateChanged, even when the user IS logged in.
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
        parentId: replyTo?.id || null,
      };

      console.log('📤 Submitting comment:', commentData);
      const response = await commentOnArticle(id, commentData);
      console.log('✅ Comment submitted:', response);

      const newComment = response?.data ||
        response?.comment || {
          id: Date.now().toString(),
          _id: Date.now().toString(),
          content: commentData.content,
          text: commentData.content,
          userName: resolvedName,       // ← always the real name
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
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } catch (e) {
      console.error('❌ Error submitting comment:', e);
      Alert.alert('Error', e.message || 'Failed to submit comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // ─── Like Comment ─────────────────────────────────────────────────────────
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

  // ─── Reply ────────────────────────────────────────────────────────────────
  const handleReply = (comment) => {
    setReplyTo(comment);
    setCommentText(`@${comment.userName || 'user'} `);
    Animated.timing(commentInputAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCancelReply = () => {
    setReplyTo(null);
    setCommentText('');
    Animated.timing(commentInputAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // ─── Share ────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    try {
      await Share.share({
        title: article?.title || 'Article on BartaOne',
        message: `📰 ${article?.title || 'Article'} on BartaOne\n\n${
          article?.summary || article?.body?.slice(0, 150) || ''
        }\n\n📱 https://bartaone.com/article/${article?._id || id}`,
        url: `https://bartaone.com/article/${article?._id || id}`,
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to share article');
    }
  };

  // ─── Like Article ─────────────────────────────────────────────────────────
  const handleLike = async () => {
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount((prev) => Math.max(newIsLiked ? prev + 1 : prev - 1, 0));

    Animated.sequence([
      Animated.spring(likeAnim, { toValue: 0.7, friction: 3, tension: 40, useNativeDriver: true }),
      Animated.spring(likeAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();

    try {
      const response = newIsLiked ? await likeArticle(id) : await unlikeArticle(id);
      if (response?.data) {
        setIsLiked(response.data.liked);
        setLikesCount(Math.max(response.data.likes || 0, 0));
      }
    } catch (e) {
      console.error('Error toggling like:', e);
      setIsLiked(!newIsLiked);
      setLikesCount((prev) => Math.max(newIsLiked ? prev - 1 : prev + 1, 0));
    }
  };

  // ─── Bookmark ─────────────────────────────────────────────────────────────
  const handleBookmark = async () => {
    try {
      const newState = !isBookmarked;
      setIsBookmarked(newState);
      const existing = await AsyncStorage.getItem('savedArticles');
      let savedArticles = existing ? JSON.parse(existing) : [];

      if (newState) {
        const toSave = {
          id: article._id || article.id,
          title: article.title,
          image: article.image,
          channelName: article.channelId?.channelName || article.channelName || 'Unknown',
          timestamp: Date.now(),
        };
        if (!savedArticles.some((item) => item.id === toSave.id)) {
          savedArticles.push(toSave);
          await AsyncStorage.setItem('savedArticles', JSON.stringify(savedArticles));
          Alert.alert('Saved', 'Article saved to bookmarks!');
        }
      } else {
        savedArticles = savedArticles.filter(
          (item) => item.id !== (article._id || article.id)
        );
        await AsyncStorage.setItem('savedArticles', JSON.stringify(savedArticles));
        Alert.alert('Removed', 'Article removed from bookmarks');
      }
    } catch (e) {
      console.error('Error toggling bookmark:', e);
      setIsBookmarked(!isBookmarked);
    }
  };

  // ─── Channel Press ────────────────────────────────────────────────────────
  const handleChannelPress = () => {
    const channelId =
      article?.channelId?._id || article?.channelId || article?.channel?._id;
    if (channelId) router.push(`/(viewer)/ChannelDetails?id=${channelId}`);
  };

  // ─── Render Body ──────────────────────────────────────────────────────────
  const renderBody = () => {
    if (!article?.body) return null;
    let body = article.body;
    if (typeof body === 'string') {
      body = body.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    }
    return body;
  };

  // ─── Render Comment ───────────────────────────────────────────────────────
  const renderComment = ({ item }) => (
    <View style={[s.commentItem, { borderBottomColor: C.border }]}>
      <View style={s.commentHeader}>
        <View style={s.commentAvatar}>
          {item.userAvatar ? (
            <Image source={{ uri: item.userAvatar }} style={s.commentAvatarImage} />
          ) : (
            <View style={[s.commentAvatarPlaceholder, { backgroundColor: C.accentBg }]}>
              <Text style={[s.commentAvatarText, { color: C.accent }]}>
                {(item.userName || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={s.commentInfo}>
          <Text style={[s.commentUserName, { color: C.primary }]}>
            {item.userName || 'Anonymous'}
          </Text>
          <Text style={[s.commentTime, { color: C.muted }]}>
            {timeAgo(item.createdAt || item.timestamp)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleLikeComment(item.id || item._id)}
          style={s.commentLikeBtn}
          activeOpacity={0.7}
        >
          <Ionicons
            name={item.isLiked ? 'heart' : 'heart-outline'}
            size={moderateScale(16)}
            color={item.isLiked ? C.accent : C.muted}
          />
          <Text style={[s.commentLikeCount, { color: C.muted }]}>
            {Math.max(item.likes || 0, 0)}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[s.commentText, { color: C.secondary }]}>
        {item.content || item.text || item.comment || 'No content'}
      </Text>

      <TouchableOpacity
        onPress={() => handleReply(item)}
        style={s.commentReplyBtn}
        activeOpacity={0.7}
      >
        <Ionicons name="chatbubble-outline" size={moderateScale(14)} color={C.muted} />
        <Text style={[s.commentReplyText, { color: C.muted }]}>Reply</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) return <Loader message="Loading article…" />;

  const s = makeStyles(C);

  if (error || !article) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: C.bg }]} edges={['top', 'bottom']}>
        <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} />
        <View style={s.errorContainer}>
          <View style={[s.errorIconWrap, { backgroundColor: C.accentBg }]}>
            <Ionicons name="alert-circle-outline" size={moderateScale(40)} color={C.accent} />
          </View>
          <Text style={[s.errorTitle, { color: C.primary }]}>Article not found</Text>
          <Text style={[s.errorSub, { color: C.muted }]}>
            {error || 'This article may have been removed or the link is invalid.'}
          </Text>
          <TouchableOpacity
            style={[s.errorBtn, { backgroundColor: C.accent }]}
            onPress={loadArticle}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh-outline" size={moderateScale(16)} color="#FFF" />
            <Text style={s.errorBtnText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.errorBtn, { backgroundColor: 'transparent', marginTop: verticalScale(8) }]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={moderateScale(16)} color={C.muted} />
            <Text style={[s.errorBtnText, { color: C.muted }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar barStyle={C.statusBar} backgroundColor="transparent" translucent />

      {/* Accent stripe matching CreateChannel header */}
      <View style={[s.topStripe, { backgroundColor: C.accent }]} />

      {/*
        ── KEY FIX ──────────────────────────────────────────────────────────
        Replace KeyboardAvoidingView + ScrollView with KeyboardAwareScrollView.
        The comment input at the bottom of the page is exactly the kind of
        thing that gets hidden behind the keyboard on Android with the old
        approach.
        ─────────────────────────────────────────────────────────────────── */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces
          enableOnAndroid
          extraScrollHeight={verticalScale(80)}
          keyboardShouldPersistTaps="handled"
          enableResetScrollToCoords={false}
          scrollEventThrottle={16}
        >
          {/* ── Floating Header ── */}
          <Animated.View
            style={[
              s.floatingHeader,
              {
                opacity: headerAnim,
                transform: [
                  {
                    translateY: headerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-verticalScale(20), 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={[s.headerBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={moderateScale(22)} color="#FFF" />
            </TouchableOpacity>

            <View style={s.headerRight}>
              <TouchableOpacity
                style={[s.headerBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                onPress={handleBookmark}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={moderateScale(20)}
                  color={isBookmarked ? C.accent : '#FFF'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.headerBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Ionicons name="share-social-outline" size={moderateScale(20)} color="#FFF" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ── Featured Image ── */}
          {article.image && (
            <Image
              source={{ uri: article.image }}
              style={s.featuredImage}
              resizeMode="cover"
            />
          )}

          {/* ── Content Card ── */}
          <Animated.View
            style={[
              s.contentWrapper,
              {
                backgroundColor: C.surface,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            {/* Category Badge */}
            {article.category && (
              <View style={[s.categoryBadge, { backgroundColor: C.accentBg }]}>
                <Text style={[s.categoryText, { color: C.accent }]}>
                  {article.category}
                </Text>
              </View>
            )}

            {/* Title */}
            <Text style={[s.title, { color: C.primary }]}>
              {article.title || 'Untitled Article'}
            </Text>

            {/* Channel Meta */}
            <View style={s.metaContainer}>
              <TouchableOpacity
                style={s.channelTouch}
                onPress={handleChannelPress}
                disabled={!article.channelId}
                activeOpacity={0.7}
              >
                <Image
                  source={{
                    uri: article.channelId?.logo || 'https://via.placeholder.com/40',
                  }}
                  style={s.channelAvatar}
                />
                <View style={s.channelInfo}>
                  <Text style={[s.channelName, { color: C.primary }]}>
                    {article.channelId?.channelName ||
                      article.channelName ||
                      'Unknown Channel'}
                  </Text>
                  <Text style={[s.timeAgoText, { color: C.muted }]}>
                    {timeAgo(article.createdAt || article.publishedAt)} ·{' '}
                    {article.readTime || '3 min read'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={[s.divider, { backgroundColor: C.border }]} />

            {/* Body */}
            <Text style={[s.body, { color: C.secondary }]}>
              {renderBody() || 'No content available'}
            </Text>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <View style={s.tagsContainer}>
                {article.tags.map((tag, i) => (
                  <View key={i} style={[s.tag, { backgroundColor: C.accentBg }]}>
                    <Text style={[s.tagText, { color: C.accent }]}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={[s.divider, { backgroundColor: C.border }]} />

            {/* ── Actions ── */}
            <View style={s.actionsContainer}>
              <TouchableOpacity
                style={s.actionButton}
                onPress={handleLike}
                activeOpacity={0.6}
              >
                <Animated.View style={{ transform: [{ scale: likeAnim }] }}>
                  <Ionicons
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={moderateScale(24)}
                    color={isLiked ? C.accent : C.muted}
                  />
                </Animated.View>
                <Text style={[s.actionText, { color: C.muted }]}>
                  {Math.max(likesCount, 0)} Likes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.actionButton}
                onPress={() => setShowComments((v) => !v)}
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubble-outline" size={moderateScale(22)} color={C.muted} />
                <Text style={[s.actionText, { color: C.muted }]}>
                  {comments.length} Comments
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.actionButton} activeOpacity={0.7}>
                <Ionicons name="eye-outline" size={moderateScale(22)} color={C.muted} />
                <Text style={[s.actionText, { color: C.muted }]}>
                  {article.views || article.viewCount || 0} Views
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Comments Section ── */}
            {showComments && (
              <View style={s.commentsSection}>
                <Text style={[s.commentsTitle, { color: C.primary }]}>
                  Comments ({comments.length})
                </Text>

                {/* Comment Input */}
                <View style={s.commentInputContainer}>
                  {replyTo && (
                    <Animated.View
                      style={[
                        s.replyIndicator,
                        {
                          backgroundColor: C.accentBg,
                          opacity: commentInputAnim,
                          transform: [
                            {
                              scaleY: commentInputAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 1],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <Text style={[s.replyIndicatorText, { color: C.accent }]}>
                        Replying to @{replyTo.userName || 'user'}
                      </Text>
                      <TouchableOpacity onPress={handleCancelReply} activeOpacity={0.7}>
                        <Ionicons
                          name="close-circle"
                          size={moderateScale(18)}
                          color={C.muted}
                        />
                      </TouchableOpacity>
                    </Animated.View>
                  )}

                  <View
                    style={[
                      s.commentInputWrapper,
                      { borderColor: C.border, backgroundColor: C.surfaceAlt },
                    ]}
                  >
                    <TextInput
                      style={[s.commentInput, { color: C.primary }]}
                      placeholder="Write a comment…"
                      placeholderTextColor={C.muted}
                      value={commentText}
                      onChangeText={setCommentText}
                      multiline
                      maxLength={500}
                    />
                    <TouchableOpacity
                      style={[
                        s.commentSendBtn,
                        {
                          backgroundColor:
                            commentText.trim() ? C.accent : C.faint,
                        },
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
                  <View style={s.loadingComments}>
                    <ActivityIndicator size="small" color={C.accent} />
                    <Text style={[s.loadingCommentsText, { color: C.muted }]}>
                      Loading comments…
                    </Text>
                  </View>
                ) : comments.length > 0 ? (
                  <FlatList
                    data={comments}
                    keyExtractor={(item) =>
                      item.id || item._id || Math.random().toString()
                    }
                    renderItem={renderComment}
                    scrollEnabled={false}
                    style={s.commentsList}
                  />
                ) : (
                  <View style={s.noComments}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={moderateScale(40)}
                      color={C.faint}
                    />
                    <Text style={[s.noCommentsText, { color: C.muted }]}>
                      No comments yet. Be the first!
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Animated.View>
        </KeyboardAwareScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const makeStyles = (C) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: C.bg,
    },
    topStripe: {
      height: scale(3),
      zIndex: 10,
    },
    scrollContent: {
      paddingBottom: verticalScale(40),
    },
    floatingHeader: {
      position: 'absolute',
      top: verticalScale(14),
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: scale(16),
      zIndex: 20,
    },
    headerBtn: {
      width: scale(42),
      height: scale(42),
      borderRadius: scale(21),
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerRight: {
      flexDirection: 'row',
      gap: scale(10),
    },
    featuredImage: {
      width: '100%',
      height: verticalScale(280),
    },
    contentWrapper: {
      marginTop: -verticalScale(30),
      borderTopLeftRadius: scale(24),
      borderTopRightRadius: scale(24),
      paddingHorizontal: scale(20),
      paddingTop: verticalScale(20),
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
      fontSize: fontScale(24),
      fontWeight: '800',
      lineHeight: fontScale(32),
      marginBottom: verticalScale(12),
      letterSpacing: -0.3,
    },
    metaContainer: {
      marginBottom: verticalScale(16),
    },
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
    body: {
      fontSize: fontScale(16),
      lineHeight: fontScale(28),
      letterSpacing: 0.2,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: scale(8),
      marginTop: verticalScale(16),
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
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: verticalScale(8),
      flexWrap: 'wrap',
      gap: scale(8),
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(8),
      padding: scale(8),
    },
    actionText: {
      fontSize: fontScale(13),
      fontWeight: '500',
    },
    commentsSection: {
      marginTop: verticalScale(16),
    },
    commentsTitle: {
      fontSize: fontScale(18),
      fontWeight: '700',
      marginBottom: verticalScale(14),
    },
    commentInputContainer: {
      marginBottom: verticalScale(16),
    },
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
    commentsList: {
      marginTop: verticalScale(8),
    },
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
      fontSize: fontScale(14),
      fontWeight: '600',
    },
    commentInfo: { flex: 1 },
    commentUserName: {
      fontSize: fontScale(13),
      fontWeight: '600',
    },
    commentTime: {
      fontSize: fontScale(11),
    },
    commentLikeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(4),
      padding: scale(4),
    },
    commentLikeCount: {
      fontSize: fontScale(12),
      fontWeight: '500',
    },
    commentText: {
      fontSize: fontScale(14),
      lineHeight: fontScale(20),
      marginBottom: verticalScale(4),
    },
    commentReplyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(4),
      paddingVertical: verticalScale(4),
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