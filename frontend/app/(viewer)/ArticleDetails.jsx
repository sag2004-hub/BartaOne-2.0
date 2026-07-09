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
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Loader from '../../components/Loader';
import { 
  getArticleById, 
  commentOnArticle, 
  getArticleComments,
  likeArticle,
  unlikeArticle 
} from '../../services/articleService';
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

export default function ArticleDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { user } = useAuth();

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
  const slideUpAnim = useRef(new Animated.Value(vs(30))).current;
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
  }, [id]);

  const loadArticle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('📡 Fetching article with ID:', id);
      
      const data = await getArticleById(id);
      console.log('📡 Article data received:', JSON.stringify(data, null, 2));
      
      let articleData = data;
      if (data?.data?.data) {
        articleData = data.data.data;
      } else if (data?.data) {
        articleData = data.data;
      } else if (data?.article) {
        articleData = data.article;
      }
      
      console.log('📡 Parsed article data:', articleData);
      
      if (!articleData || Object.keys(articleData).length === 0) {
        throw new Error('No article data received');
      }
      
      setArticle(articleData);
      setLikesCount(Math.max(articleData.likes || articleData.likeCount || 0, 0));
      setIsLiked(articleData.isLiked || false);
      setIsBookmarked(articleData.isBookmarked || false);

      // Load comments
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
      
    } catch (error) {
      console.error('❌ Error loading article:', error);
      setError(error.message || 'Failed to load article');
      Alert.alert(
        'Error',
        error.message || 'Failed to load article. Please try again.',
        [
          { text: 'Retry', onPress: loadArticle },
          { text: 'Go Back', onPress: () => router.back() }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Load Comments ──────────────────────────────────────────────────────
  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      console.log('📡 Fetching comments for article:', id);
      const response = await getArticleComments(id);
      console.log('📡 Comments response:', response);
      
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
      
      setComments(commentsData);
      console.log('📡 Comments loaded:', commentsData.length);
    } catch (error) {
      console.error('❌ Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // ─── Submit Comment ─────────────────────────────────────────────────────
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
        parentId: replyTo?.id || null,
      };

      console.log('📤 Submitting comment with data:', commentData);
      
      const response = await commentOnArticle(id, commentData);
      console.log('✅ Comment submitted successfully:', response);

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
      setReplyTo(null);
      
      Animated.timing(commentInputAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

      Alert.alert('Success', 'Comment added successfully');
    } catch (error) {
      console.error('❌ Error submitting comment:', error);
      
      let errorMessage = 'Failed to submit comment. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // ─── Like Comment ──────────────────────────────────────────────────────
  const handleLikeComment = (commentId) => {
    setComments(prev => prev.map(comment => {
      const id = comment.id || comment._id;
      if (id === commentId) {
        const isLiked = !comment.isLiked;
        return {
          ...comment,
          isLiked,
          likes: Math.max((comment.likes || 0) + (isLiked ? 1 : -1), 0)
        };
      }
      return comment;
    }));
  };

  // ─── Reply to Comment ──────────────────────────────────────────────────
  const handleReply = (comment) => {
    setReplyTo(comment);
    setCommentText(`@${comment.userName || 'user'} `);
    
    Animated.timing(commentInputAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // ─── Cancel Reply ──────────────────────────────────────────────────────
  const handleCancelReply = () => {
    setReplyTo(null);
    setCommentText('');
    Animated.timing(commentInputAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // ─── Share ──────────────────────────────────────────────────────────────
  const handleShare = async () => {
    try {
      const shareMessage = `
📰 ${article?.title || 'Article'} on BartaOne

${article?.summary || article?.body?.slice(0, 150) || 'Read more on BartaOne'}

📱 Download BartaOne: https://bartaone.com/download
      `;

      await Share.share({
        title: article?.title || 'Article on BartaOne',
        message: shareMessage,
        url: `https://bartaone.com/article/${article?._id || id}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share article');
    }
  };

  // ─── Like Article ───────────────────────────────────────────────────────
  const handleLike = async () => {
    // Optimistic update
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount(prev => Math.max(newIsLiked ? prev + 1 : prev - 1, 0));
    
    // Animate like button
    Animated.sequence([
      Animated.spring(likeAnim, { toValue: 0.7, friction: 3, tension: 40, useNativeDriver: true }),
      Animated.spring(likeAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();
    
    try {
      let response;
      if (newIsLiked) {
        response = await likeArticle(id);
      } else {
        response = await unlikeArticle(id);
      }
      
      // Update with actual values from server
      if (response?.data) {
        const { liked, likes } = response.data;
        setIsLiked(liked);
        setLikesCount(Math.max(likes || 0, 0));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      setIsLiked(!newIsLiked);
      setLikesCount(prev => Math.max(newIsLiked ? prev - 1 : prev + 1, 0));
      Alert.alert('Error', 'Failed to update like status');
    }
  };

  // ─── Bookmark ────────────────────────────────────────────────────────────
  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    Alert.alert(
      isBookmarked ? 'Removed from Bookmarks' : 'Bookmarked',
      isBookmarked ? 'Article removed from your saved list' : 'Article saved for later reading!'
    );
  };

  // ─── Open Channel ────────────────────────────────────────────────────────
  const handleChannelPress = () => {
    const channelId = article?.channelId?._id || article?.channelId || article?.channel?._id;
    if (channelId) {
      router.push(`/(viewer)/ChannelDetails?id=${channelId}`);
    }
  };

  // ─── Render Body ────────────────────────────────────────────────────────
  const renderBody = () => {
    if (!article?.body) return null;
    let bodyText = article.body;
    if (typeof bodyText === 'string') {
      bodyText = bodyText.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    }
    return bodyText;
  };

  // ─── Render Single Comment ─────────────────────────────────────────────
  const renderComment = ({ item }) => (
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
        <TouchableOpacity 
          onPress={() => handleLikeComment(item.id || item._id)}
          style={styles.commentLikeBtn}
        >
          <Ionicons 
            name={item.isLiked ? 'heart' : 'heart-outline'} 
            size={scale(16)} 
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
      >
        <Ionicons name="chatbubble-outline" size={scale(14)} color={C.muted} />
        <Text style={[styles.commentReplyText, { color: C.muted }]}>Reply</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return <Loader message="Loading article..." />;
  }

  if (error || !article) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
        <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} />
        <View style={styles.errorContainer}>
          <View style={[styles.errorIconWrap, { backgroundColor: C.accentBg }]}>
            <Ionicons name="alert-circle-outline" size={scale(40)} color={C.accent} />
          </View>
          <Text style={[styles.errorTitle, { color: C.primary }]}>Article not found</Text>
          <Text style={[styles.errorSub, { color: C.muted }]}>
            {error || 'This article may have been removed or the link is invalid.'}
          </Text>
          <TouchableOpacity
            style={[styles.errorBtn, { backgroundColor: C.accent }]}
            onPress={loadArticle}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh-outline" size={scale(16)} color="#FFF" />
            <Text style={styles.errorBtnText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.errorBtn, { backgroundColor: 'transparent', marginTop: vs(8) }]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={scale(16)} color={C.muted} />
            <Text style={[styles.errorBtnText, { color: C.muted }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const styles = makeStyles(C);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle={C.statusBar} backgroundColor="transparent" translucent />

      <View style={styles.topStripe} />

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={true}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Floating Header ── */}
            <Animated.View style={[
              styles.floatingHeader,
              {
                opacity: headerAnim,
                transform: [{
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-vs(20), 0]
                  })
                }]
              }
            ]}>
              <TouchableOpacity
                style={[styles.headerBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={scale(22)} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={[styles.headerBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                  onPress={handleBookmark}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                    size={scale(20)}
                    color={isBookmarked ? C.accent : '#FFF'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.headerBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                  onPress={handleShare}
                  activeOpacity={0.8}
                >
                  <Ionicons name="share-social-outline" size={scale(20)} color="#FFF" />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* ── Featured Image ── */}
            {article.image && (
              <Image
                source={{ uri: article.image }}
                style={styles.featuredImage}
                resizeMode="cover"
              />
            )}

            {/* ── Content ── */}
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
              {article.category && (
                <View style={[styles.categoryBadge, { backgroundColor: C.accentBg }]}>
                  <Text style={[styles.categoryText, { color: C.accent }]}>
                    {article.category}
                  </Text>
                </View>
              )}

              {/* Title */}
              <Text style={[styles.title, { color: C.primary }]}>
                {article.title || 'Untitled Article'}
              </Text>

              {/* Meta Info */}
              <View style={styles.metaContainer}>
                <TouchableOpacity
                  style={styles.channelTouch}
                  onPress={handleChannelPress}
                  disabled={!article.channelId}
                >
                  <Image
                    source={{ uri: article.channelId?.logo || 'https://via.placeholder.com/40' }}
                    style={styles.channelAvatar}
                  />
                  <View>
                    <Text style={[styles.channelName, { color: C.primary }]}>
                      {article.channelId?.channelName || article.channelName || 'Unknown Channel'}
                    </Text>
                    <Text style={[styles.timeAgoText, { color: C.muted }]}>
                      {timeAgo(article.createdAt || article.publishedAt)} · {article.readTime || '3 min read'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={[styles.divider, { backgroundColor: C.border }]} />

              {/* Body Content */}
              <Text style={[styles.body, { color: C.secondary }]}>
                {renderBody() || 'No content available'}
              </Text>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {article.tags.map((tag, index) => (
                    <View key={index} style={[styles.tag, { backgroundColor: C.accentBg }]}>
                      <Text style={[styles.tagText, { color: C.accent }]}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={[styles.divider, { backgroundColor: C.border }]} />

              {/* ── Actions ── */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleLike}
                  activeOpacity={0.6}
                >
                  <Animated.View style={{ transform: [{ scale: likeAnim }] }}>
                    <Ionicons
                      name={isLiked ? 'heart' : 'heart-outline'}
                      size={scale(24)}
                      color={isLiked ? C.accent : C.muted}
                    />
                  </Animated.View>
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

                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="eye-outline" size={scale(22)} color={C.muted} />
                  <Text style={[styles.actionText, { color: C.muted }]}>
                    {article.views || article.viewCount || 0} Views
                  </Text>
                </TouchableOpacity>
              </View>

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
                    {replyTo && (
                      <Animated.View style={[
                        styles.replyIndicator, 
                        { 
                          backgroundColor: C.accentBg,
                          opacity: commentInputAnim,
                          transform: [{
                            scaleY: commentInputAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 1]
                            })
                          }]
                        }
                      ]}>
                        <Text style={[styles.replyIndicatorText, { color: C.accent }]}>
                          Replying to @{replyTo.userName || 'user'}
                        </Text>
                        <TouchableOpacity onPress={handleCancelReply}>
                          <Ionicons name="close-circle" size={scale(18)} color={C.muted} />
                        </TouchableOpacity>
                      </Animated.View>
                    )}
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
                      keyExtractor={(item) => item.id || item._id || Math.random().toString()}
                      renderItem={renderComment}
                      scrollEnabled={false}
                      style={styles.commentsList}
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
  topStripe: {
    height: 3,
    backgroundColor: C.accent,
    zIndex: 10,
  },
  scrollContent: {
    paddingBottom: vs(30),
  },
  floatingHeader: {
    position: 'absolute',
    top: vs(14),
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
    height: vs(280),
  },
  contentWrapper: {
    marginTop: -vs(30),
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    paddingHorizontal: scale(20),
    paddingTop: vs(20),
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
    fontSize: sp(24),
    fontWeight: '800',
    lineHeight: sp(32),
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
  body: {
    fontSize: sp(16),
    lineHeight: sp(28),
    letterSpacing: 0.2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
    marginTop: vs(16),
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
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(12),
    paddingVertical: vs(6),
    borderRadius: scale(8),
    marginBottom: vs(8),
  },
  replyIndicatorText: {
    fontSize: sp(12),
    fontWeight: '500',
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
  commentLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    padding: scale(4),
  },
  commentLikeCount: {
    fontSize: sp(12),
    fontWeight: '500',
  },
  commentText: {
    fontSize: sp(14),
    lineHeight: sp(20),
    marginBottom: vs(4),
  },
  commentReplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    paddingVertical: vs(4),
  },
  commentReplyText: {
    fontSize: sp(12),
    fontWeight: '500',
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
  container: {
    flex: 1,
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
});