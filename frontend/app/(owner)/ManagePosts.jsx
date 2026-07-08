// app/(owner)/ManagePosts.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  useColorScheme,
  Dimensions,
  PixelRatio,
  ActivityIndicator,
  Image,
  SafeAreaView as SafeAreaViewRN,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useAuth } from '../../hooks/useAuth';
import { getChannelByOwner } from '../../services/channelService';
import { getOwnerArticles, deleteArticle } from '../../services/articleService';
import { getOwnerVideos, deleteVideo } from '../../services/videoService';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';

const { width: SW, height: SH } = Dimensions.get('window');
const BASE_W = 390;
const scale = (n) => Math.round((SW / BASE_W) * n);
const vs = (n) => Math.round((SH / 844) * n);
const sp = (n) => n / PixelRatio.getFontScale();

// ─── Theme ───────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: '#F2F0EB',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFAF8',
  border: '#E4E0D8',
  accent: '#C8001A',
  accentBg: '#FFF0F2',
  accentBorder: 'rgba(200,0,26,0.18)',
  navy: '#0F1923',
  primary: '#1A2733',
  secondary: '#4A5A6B',
  muted: '#8A97A5',
  faint: '#B8C0B8',
  white: '#FFFFFF',
  statusBar: 'dark-content',
  cardShadowOpacity: 0.06,
  iconBlue: '#1A6DC8',
  iconBlueBg: '#EFF5FF',
  iconGreen: '#0E8A5A',
  iconGreenBg: '#EDFAF3',
  iconPurple: '#7C3AED',
  iconPurpleBg: '#F5F0FF',
  iconAmber: '#B87500',
  iconAmberBg: '#FFF7E8',
};

const DARK = {
  bg: '#0D1117',
  surface: '#161B22',
  surfaceAlt: '#1C2330',
  border: '#2A3340',
  accent: '#E8192C',
  accentBg: 'rgba(232,25,44,0.12)',
  accentBorder: 'rgba(232,25,44,0.25)',
  navy: '#E8EDF2',
  primary: '#EDF2F7',
  secondary: '#8B9BAB',
  muted: '#5C6E80',
  faint: '#3A4A58',
  white: '#FFFFFF',
  statusBar: 'light-content',
  cardShadowOpacity: 0.35,
  iconBlue: '#60A5FA',
  iconBlueBg: 'rgba(96,165,250,0.12)',
  iconGreen: '#34D399',
  iconGreenBg: 'rgba(52,211,153,0.12)',
  iconPurple: '#A78BFA',
  iconPurpleBg: 'rgba(167,139,250,0.12)',
  iconAmber: '#FBBF24',
  iconAmberBg: 'rgba(251,191,36,0.12)',
};

export default function ManagePosts() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('articles');
  const [articles, setArticles] = useState([]);
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [previewType, setPreviewType] = useState('article');
  const [channelId, setChannelId] = useState(null);
  
  // Video player states
  const [videoPlayerVisible, setVideoPlayerVisible] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoStatus, setVideoStatus] = useState(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const videoRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      console.log('📱 ManagePosts screen focused - refreshing data...');
      loadData();
      return () => {};
    }, [])
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const channelData = await getChannelByOwner();
      console.log('📊 Channel data:', channelData);
      
      if (channelData && channelData._id) {
        const channelMongoId = channelData._id;
        setChannelId(channelMongoId);
        console.log('📊 Channel MongoDB ID:', channelMongoId);
        
        const articlesData = await getOwnerArticles(channelMongoId);
        const videosData = await getOwnerVideos(channelMongoId);
        
        console.log('📊 Articles fetched:', articlesData);
        console.log('📊 Videos fetched:', videosData);
        
        setArticles(Array.isArray(articlesData) ? articlesData : []);
        setVideos(Array.isArray(videosData) ? videosData : []);
      } else {
        console.warn('No channel found for this user');
        setArticles([]);
        setVideos([]);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Error', 'Failed to load posts');
      setArticles([]);
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDelete = async (item, type) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (type === 'article') {
                await deleteArticle(item._id);
                setArticles(articles.filter((a) => a._id !== item._id));
              } else {
                await deleteVideo(item._id);
                setVideos(videos.filter((v) => v._id !== item._id));
              }
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (item, type) => {
    setPreviewModalVisible(false);
    setVideoPlayerVisible(false);
    if (type === 'article') {
      router.push({
        pathname: '/(owner)/UploadArticle',
        params: { edit: item._id }
      });
    } else {
      router.push({
        pathname: '/(owner)/UploadVideo',
        params: { edit: item._id }
      });
    }
  };

  const handleSeeMore = (item, type) => {
    setPreviewItem(item);
    setPreviewType(type);
    setPreviewModalVisible(true);
  };

  // ─── Video Player Functions ────────────────────────────────────────────────
  const openVideoPlayer = (url, title) => {
    setVideoUrl(url);
    setVideoTitle(title || 'Video');
    setVideoPlayerVisible(true);
    setIsVideoLoading(true);
  };

  const closeVideoPlayer = async () => {
    if (videoRef.current) {
      await videoRef.current.stopAsync();
      await videoRef.current.unloadAsync();
    }
    setVideoPlayerVisible(false);
    setVideoUrl(null);
    setVideoStatus(null);
    setIsVideoLoading(false);
  };

  const onPlaybackStatusUpdate = (status) => {
    setVideoStatus(status);
    if (status.isLoaded) {
      setIsVideoLoading(false);
    }
    if (status.didJustFinish) {
      // Video finished playing
      console.log('Video finished playing');
    }
  };

  const onVideoLoadStart = () => {
    setIsVideoLoading(true);
  };

  const onVideoError = (error) => {
    console.error('Video Error:', error);
    setIsVideoLoading(false);
    Alert.alert(
      'Playback Error',
      'Unable to play this video. Please try again later.',
      [{ text: 'OK' }]
    );
  };

  // ─── Render Article Card ──────────────────────────────────────────────────
  const renderArticleItem = (article) => (
    <View
      key={article._id}
      style={[styles.postCard, { backgroundColor: C.surface, borderColor: C.border }]}
    >
      {article.image && (
        <Image 
          source={{ uri: article.image }} 
          style={styles.thumbnailImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.postContent}>
        <View style={styles.postHeader}>
          <View style={styles.postIconWrap}>
            <View style={[styles.postIconBg, { backgroundColor: C.accentBg }]}>
              <Ionicons name="newspaper-outline" size={scale(18)} color={C.accent} />
            </View>
            <View style={styles.postTitleWrap}>
              <Text style={[styles.postTitle, { color: C.primary }]} numberOfLines={2}>
                {article.title}
              </Text>
              <View style={styles.postMeta}>
                <View style={[styles.statusBadge, { backgroundColor: C.iconGreenBg }]}>
                  <Text style={[styles.statusText, { color: C.iconGreen }]}>
                    {article.isPublished ? 'Published' : 'Draft'}
                  </Text>
                </View>
                <Text style={[styles.postDate, { color: C.muted }]}>
                  {new Date(article.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.postStats}>
          <View style={styles.stat}>
            <Ionicons name="eye-outline" size={scale(14)} color={C.muted} />
            <Text style={[styles.statText, { color: C.muted }]}>{article.views || 0}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="heart-outline" size={scale(14)} color={C.muted} />
            <Text style={[styles.statText, { color: C.muted }]}>{article.likes || 0}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="chatbubble-outline" size={scale(14)} color={C.muted} />
            <Text style={[styles.statText, { color: C.muted }]}>{article.comments || 0}</Text>
          </View>
          <View style={[styles.stat, styles.statCategory]}>
            <Text style={[styles.categoryText, { color: C.accent, backgroundColor: C.accentBg }]}>
              {article.category || 'News'}
            </Text>
          </View>
        </View>

        <View style={[styles.actionRow, { borderTopColor: C.border }]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.seeMoreBtn, { backgroundColor: C.accentBg }]}
            onPress={() => handleSeeMore(article, 'article')}
          >
            <Ionicons name="eye-outline" size={scale(16)} color={C.accent} />
            <Text style={[styles.actionBtnText, { color: C.accent }]}>See More</Text>
          </TouchableOpacity>
          
          <View style={styles.actionRight}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.editBtn, { backgroundColor: C.iconBlueBg }]}
              onPress={() => handleEdit(article, 'article')}
            >
              <Ionicons name="create-outline" size={scale(16)} color={C.iconBlue} />
              <Text style={[styles.actionBtnText, { color: C.iconBlue }]}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn, { backgroundColor: C.accentBg }]}
              onPress={() => handleDelete(article, 'article')}
            >
              <Ionicons name="trash-outline" size={scale(16)} color={C.accent} />
              <Text style={[styles.actionBtnText, { color: C.accent }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  // ─── Render Video Card ────────────────────────────────────────────────────
  const renderVideoItem = (video) => (
    <View
      key={video._id}
      style={[styles.postCard, { backgroundColor: C.surface, borderColor: C.border }]}
    >
      {video.thumbnail ? (
        <Image 
          source={{ uri: video.thumbnail }} 
          style={styles.thumbnailImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.thumbnailPlaceholder, { backgroundColor: C.bg }]}>
          <Ionicons name="videocam" size={scale(40)} color={C.muted} />
        </View>
      )}
      
      <View style={styles.postContent}>
        <View style={styles.postHeader}>
          <View style={styles.postIconWrap}>
            <View style={[styles.postIconBg, { backgroundColor: C.iconBlueBg }]}>
              <Ionicons name="videocam-outline" size={scale(18)} color={C.iconBlue} />
            </View>
            <View style={styles.postTitleWrap}>
              <Text style={[styles.postTitle, { color: C.primary }]} numberOfLines={2}>
                {video.title}
              </Text>
              <View style={styles.postMeta}>
                <View style={[styles.statusBadge, { backgroundColor: C.iconGreenBg }]}>
                  <Text style={[styles.statusText, { color: C.iconGreen }]}>
                    {video.isPublished ? 'Published' : 'Draft'}
                  </Text>
                </View>
                <Text style={[styles.postDate, { color: C.muted }]}>
                  {new Date(video.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.postStats}>
          <View style={styles.stat}>
            <Ionicons name="eye-outline" size={scale(14)} color={C.muted} />
            <Text style={[styles.statText, { color: C.muted }]}>{video.views || 0}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="heart-outline" size={scale(14)} color={C.muted} />
            <Text style={[styles.statText, { color: C.muted }]}>{video.likes || 0}</Text>
          </View>
          <View style={[styles.stat, styles.statCategory]}>
            <Text style={[styles.categoryText, { color: C.accent, backgroundColor: C.accentBg }]}>
              {video.category || 'Video'}
            </Text>
          </View>
        </View>

        <View style={[styles.actionRow, { borderTopColor: C.border }]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.seeMoreBtn, { backgroundColor: C.accentBg }]}
            onPress={() => handleSeeMore(video, 'video')}
          >
            <Ionicons name="eye-outline" size={scale(16)} color={C.accent} />
            <Text style={[styles.actionBtnText, { color: C.accent }]}>See More</Text>
          </TouchableOpacity>
          
          <View style={styles.actionRight}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.editBtn, { backgroundColor: C.iconBlueBg }]}
              onPress={() => handleEdit(video, 'video')}
            >
              <Ionicons name="create-outline" size={scale(16)} color={C.iconBlue} />
              <Text style={[styles.actionBtnText, { color: C.iconBlue }]}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn, { backgroundColor: C.accentBg }]}
              onPress={() => handleDelete(video, 'video')}
            >
              <Ionicons name="trash-outline" size={scale(16)} color={C.accent} />
              <Text style={[styles.actionBtnText, { color: C.accent }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  // ─── Preview Modal ─────────────────────────────────────────────────────────
  const renderArticlePreview = (article) => {
    const wordCount = article.body ? article.body.split(/\s+/).length : 0;
    const readingTime = Math.ceil(wordCount / 200) || 1;

    return (
      <View style={[styles.previewContent, { backgroundColor: C.surface }]}>
        <View style={[styles.previewHeader, { borderBottomColor: C.border }]}>
          <Text style={[styles.previewBadge, { color: C.accent, backgroundColor: C.accentBg }]}>
            Preview
          </Text>
          <Text style={[styles.previewChannel, { color: C.secondary }]}>
            {article.channelId?.channelName || 'Your Channel'}
          </Text>
        </View>

        <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
          {article.image && (
            <Image 
              source={{ uri: article.image }} 
              style={styles.previewImage}
              resizeMode="cover"
            />
          )}
          
          <View style={styles.previewBody}>
            <View style={styles.previewCategoryRow}>
              <Text style={[styles.previewCategory, { color: C.accent, backgroundColor: C.accentBg }]}>
                {article.category || 'News'}
              </Text>
              <Text style={[styles.previewDate, { color: C.muted }]}>
                {new Date(article.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>

            <Text style={[styles.previewTitle, { color: C.primary }]}>
              {article.title}
            </Text>

            {article.summary && (
              <Text style={[styles.previewSummary, { color: C.secondary }]}>
                {article.summary}
              </Text>
            )}

            <View style={[styles.previewDivider, { backgroundColor: C.border }]} />

            <Text style={[styles.previewBodyText, { color: C.primary }]}>
              {article.body}
            </Text>

            <View style={[styles.previewFooter, { borderTopColor: C.border }]}>
              <View style={styles.previewStats}>
                <View style={styles.previewStat}>
                  <Ionicons name="eye-outline" size={scale(14)} color={C.muted} />
                  <Text style={[styles.previewStatText, { color: C.muted }]}>
                    {article.views || 0}
                  </Text>
                </View>
                <View style={styles.previewStat}>
                  <Ionicons name="heart-outline" size={scale(14)} color={C.muted} />
                  <Text style={[styles.previewStatText, { color: C.muted }]}>
                    {article.likes || 0}
                  </Text>
                </View>
                <View style={styles.previewStat}>
                  <Ionicons name="chatbubble-outline" size={scale(14)} color={C.muted} />
                  <Text style={[styles.previewStatText, { color: C.muted }]}>
                    {article.comments || 0}
                  </Text>
                </View>
              </View>
              <Text style={[styles.previewReadingTime, { color: C.muted }]}>
                {readingTime} min read
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderVideoPreview = (video) => {
    return (
      <View style={[styles.previewContent, { backgroundColor: C.surface }]}>
        <View style={[styles.previewHeader, { borderBottomColor: C.border }]}>
          <Text style={[styles.previewBadge, { color: C.accent, backgroundColor: C.accentBg }]}>
            Preview
          </Text>
          <Text style={[styles.previewChannel, { color: C.secondary }]}>
            {video.channelId?.channelName || 'Your Channel'}
          </Text>
        </View>

        <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.previewVideoContainer}
            activeOpacity={0.9}
            onPress={() => {
              if (video.videoUrl) {
                setPreviewModalVisible(false);
                openVideoPlayer(video.videoUrl, video.title);
              }
            }}
          >
            {video.thumbnail ? (
              <Image 
                source={{ uri: video.thumbnail }} 
                style={styles.previewVideoThumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.previewVideoPlaceholder, { backgroundColor: C.bg }]}>
                <Ionicons name="videocam" size={scale(48)} color={C.muted} />
              </View>
            )}
            <View style={styles.previewPlayButton}>
              <Ionicons name="play-circle" size={scale(64)} color={C.accent} />
            </View>
          </TouchableOpacity>

          <View style={styles.previewBody}>
            <View style={styles.previewCategoryRow}>
              <Text style={[styles.previewCategory, { color: C.accent, backgroundColor: C.accentBg }]}>
                {video.category || 'Video'}
              </Text>
              <Text style={[styles.previewDate, { color: C.muted }]}>
                {new Date(video.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>

            <Text style={[styles.previewTitle, { color: C.primary }]}>
              {video.title}
            </Text>

            {video.description && (
              <Text style={[styles.previewSummary, { color: C.secondary }]}>
                {video.description}
              </Text>
            )}

            <View style={[styles.previewDivider, { backgroundColor: C.border }]} />

            <TouchableOpacity
              style={[styles.watchVideoBtn, { backgroundColor: C.accent }]}
              onPress={() => {
                if (video.videoUrl) {
                  setPreviewModalVisible(false);
                  openVideoPlayer(video.videoUrl, video.title);
                }
              }}
            >
              <Ionicons name="play-circle" size={scale(24)} color="#FFF" />
              <Text style={styles.watchVideoText}>Play Video</Text>
            </TouchableOpacity>

            <View style={[styles.previewFooter, { borderTopColor: C.border }]}>
              <View style={styles.previewStats}>
                <View style={styles.previewStat}>
                  <Ionicons name="eye-outline" size={scale(14)} color={C.muted} />
                  <Text style={[styles.previewStatText, { color: C.muted }]}>
                    {video.views || 0}
                  </Text>
                </View>
                <View style={styles.previewStat}>
                  <Ionicons name="heart-outline" size={scale(14)} color={C.muted} />
                  <Text style={[styles.previewStatText, { color: C.muted }]}>
                    {video.likes || 0}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  const styles = makeStyles(C);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={[styles.loadingText, { color: C.secondary }]}>Loading posts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentData = activeTab === 'articles' ? articles : videos;
  const hasData = currentData && currentData.length > 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.topStripe} />

      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: C.bg }]} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={scale(20)} color={C.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.primary }]}>Manage Posts</Text>
        <TouchableOpacity 
          style={[styles.createBtn, { backgroundColor: C.accent }]}
          onPress={() => router.push(activeTab === 'articles' ? '/(owner)/UploadArticle' : '/(owner)/UploadVideo')}
        >
          <Ionicons name="add" size={scale(22)} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'articles' && styles.tabActive]}
          onPress={() => setActiveTab('articles')}
        >
          <View style={styles.tabContent}>
            <Ionicons name="newspaper-outline" size={scale(16)} color={activeTab === 'articles' ? C.accent : C.muted} />
            <Text
              style={[
                styles.tabText,
                activeTab === 'articles' && styles.tabTextActive,
                { color: activeTab === 'articles' ? C.accent : C.muted }
              ]}
            >
              Articles ({articles ? articles.length : 0})
            </Text>
          </View>
          {activeTab === 'articles' && <View style={[styles.tabIndicator, { backgroundColor: C.accent }]} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'videos' && styles.tabActive]}
          onPress={() => setActiveTab('videos')}
        >
          <View style={styles.tabContent}>
            <Ionicons name="videocam-outline" size={scale(16)} color={activeTab === 'videos' ? C.accent : C.muted} />
            <Text
              style={[
                styles.tabText,
                activeTab === 'videos' && styles.tabTextActive,
                { color: activeTab === 'videos' ? C.accent : C.muted }
              ]}
            >
              Videos ({videos ? videos.length : 0})
            </Text>
          </View>
          {activeTab === 'videos' && <View style={[styles.tabIndicator, { backgroundColor: C.accent }]} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={C.accent}
            colors={[C.accent]}
          />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {hasData ? (
          activeTab === 'articles'
            ? articles.map(renderArticleItem)
            : videos.map(renderVideoItem)
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={activeTab === 'articles' ? 'newspaper-outline' : 'videocam-outline'}
              title={`No ${activeTab} yet`}
              message={`Start publishing ${activeTab} to see them here`}
              buttonText={`Create ${activeTab === 'articles' ? 'Article' : 'Video'}`}
              onPress={() => router.push(activeTab === 'articles' ? '/(owner)/UploadArticle' : '/(owner)/UploadVideo')}
            />
          </View>
        )}
      </ScrollView>

      {/* ─── Preview Modal ────────────────────────────────────────────────────── */}
      <Modal
        animationType="slide"
        visible={previewModalVisible}
        onRequestClose={() => setPreviewModalVisible(false)}
        presentationStyle="fullScreen"
      >
        <SafeAreaViewRN style={[styles.previewModalContainer, { backgroundColor: C.bg }]}>
          <View style={[styles.previewModalHeader, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
            <TouchableOpacity 
              onPress={() => setPreviewModalVisible(false)}
              style={styles.previewCloseBtn}
            >
              <Ionicons name="close" size={scale(24)} color={C.primary} />
            </TouchableOpacity>
            <Text style={[styles.previewModalTitle, { color: C.primary }]}>Preview</Text>
            <TouchableOpacity 
              onPress={() => handleEdit(previewItem, previewType)}
              style={[styles.previewEditBtn, { backgroundColor: C.accent }]}
            >
              <Ionicons name="create-outline" size={scale(18)} color="#FFF" />
              <Text style={styles.previewEditBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.previewScrollContainer} showsVerticalScrollIndicator={false}>
            {previewItem && (
              previewType === 'article' 
                ? renderArticlePreview(previewItem)
                : renderVideoPreview(previewItem)
            )}
          </ScrollView>
        </SafeAreaViewRN>
      </Modal>

      {/* ─── Video Player Modal ──────────────────────────────────────────────── */}
      <Modal
        visible={videoPlayerVisible}
        onRequestClose={closeVideoPlayer}
        presentationStyle="fullScreen"
        animationType="slide"
      >
        <SafeAreaViewRN style={[styles.videoPlayerContainer, { backgroundColor: '#000' }]}>
          {/* Video Player Header */}
          <View style={styles.videoPlayerHeader}>
            <TouchableOpacity onPress={closeVideoPlayer} style={styles.videoPlayerCloseBtn}>
              <Ionicons name="arrow-back" size={scale(28)} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.videoPlayerTitle} numberOfLines={1}>
              {videoTitle || 'Video'}
            </Text>
            <View style={{ width: scale(40) }} />
          </View>

          {/* Video Player */}
          <View style={styles.videoPlayerWrapper}>
            {videoUrl ? (
              <Video
                ref={videoRef}
                source={{ uri: videoUrl }}
                style={styles.videoPlayer}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping={false}
                onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                onLoadStart={onVideoLoadStart}
                onError={onVideoError}
                shouldPlay
                rate={1.0}
                volume={1.0}
                isMuted={false}
              />
            ) : (
              <View style={styles.videoPlayerLoading}>
                <ActivityIndicator size="large" color={C.accent} />
                <Text style={styles.videoPlayerLoadingText}>Loading video...</Text>
              </View>
            )}
            
            {isVideoLoading && (
              <View style={styles.videoPlayerLoadingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.videoPlayerLoadingText}>Buffering...</Text>
              </View>
            )}
          </View>
        </SafeAreaViewRN>
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
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: scale(16),
      paddingVertical: vs(12),
      borderBottomWidth: 1,
    },
    backBtn: {
      width: scale(38),
      height: scale(38),
      borderRadius: scale(10),
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: sp(18),
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    createBtn: {
      width: scale(38),
      height: scale(38),
      borderRadius: scale(10),
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: C.accent,
      shadowOffset: { width: 0, height: scale(3) },
      shadowOpacity: 0.25,
      shadowRadius: scale(8),
      elevation: 3,
    },
    tabContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      paddingHorizontal: scale(16),
    },
    tab: {
      flex: 1,
      paddingVertical: vs(12),
      alignItems: 'center',
      position: 'relative',
    },
    tabContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(6),
    },
    tabText: {
      fontSize: sp(13),
      fontWeight: '600',
    },
    tabTextActive: {
      fontWeight: '700',
    },
    tabIndicator: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 2.5,
      borderRadius: scale(2),
    },
    content: {
      padding: scale(14),
      flexGrow: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      paddingTop: vs(40),
    },
    postCard: {
      borderRadius: scale(14),
      marginBottom: vs(12),
      borderWidth: StyleSheet.hairlineWidth,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(2) },
      shadowOpacity: C.cardShadowOpacity,
      shadowRadius: scale(8),
      elevation: 2,
      overflow: 'hidden',
    },
    thumbnailImage: {
      width: '100%',
      height: vs(180),
      backgroundColor: C.bg,
    },
    thumbnailPlaceholder: {
      width: '100%',
      height: vs(180),
      justifyContent: 'center',
      alignItems: 'center',
    },
    postContent: {
      padding: scale(14),
    },
    postHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    postIconWrap: {
      flexDirection: 'row',
      flex: 1,
      gap: scale(10),
    },
    postIconBg: {
      width: scale(38),
      height: scale(38),
      borderRadius: scale(10),
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    postTitleWrap: {
      flex: 1,
    },
    postTitle: {
      fontSize: sp(16),
      fontWeight: '600',
      marginBottom: vs(4),
      lineHeight: sp(22),
    },
    postMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(8),
    },
    statusBadge: {
      paddingHorizontal: scale(8),
      paddingVertical: vs(2),
      borderRadius: scale(6),
    },
    statusText: {
      fontSize: sp(10),
      fontWeight: '600',
    },
    postDate: {
      fontSize: sp(11),
    },
    postStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(14),
      marginTop: vs(6),
    },
    stat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(4),
    },
    statCategory: {
      marginLeft: 'auto',
    },
    statText: {
      fontSize: sp(11),
      fontWeight: '500',
    },
    categoryText: {
      fontSize: sp(10),
      fontWeight: '600',
      paddingHorizontal: scale(8),
      paddingVertical: vs(2),
      borderRadius: scale(6),
      overflow: 'hidden',
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: vs(10),
      marginTop: vs(8),
      borderTopWidth: 1,
    },
    actionRight: {
      flexDirection: 'row',
      gap: scale(8),
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(4),
      paddingHorizontal: scale(12),
      paddingVertical: vs(6),
      borderRadius: scale(8),
    },
    actionBtnText: {
      fontSize: sp(12),
      fontWeight: '600',
    },
    seeMoreBtn: {
      flex: 1,
      justifyContent: 'center',
    },
    editBtn: {},
    deleteBtn: {},
    previewModalContainer: {
      flex: 1,
    },
    previewModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: scale(16),
      paddingVertical: vs(12),
      borderBottomWidth: 1,
    },
    previewCloseBtn: {
      width: scale(38),
      height: scale(38),
      borderRadius: scale(10),
      justifyContent: 'center',
      alignItems: 'center',
    },
    previewModalTitle: {
      fontSize: sp(17),
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    previewEditBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(4),
      paddingHorizontal: scale(12),
      paddingVertical: vs(6),
      borderRadius: scale(8),
    },
    previewEditBtnText: {
      color: '#FFF',
      fontSize: sp(12),
      fontWeight: '600',
    },
    previewScrollContainer: {
      flex: 1,
    },
    previewContent: {
      flex: 1,
      margin: scale(16),
      borderRadius: scale(16),
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(4) },
      shadowOpacity: 0.1,
      shadowRadius: scale(12),
      elevation: 4,
    },
    previewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: scale(16),
      paddingVertical: vs(12),
      borderBottomWidth: 1,
    },
    previewBadge: {
      fontSize: sp(10),
      fontWeight: '700',
      paddingHorizontal: scale(8),
      paddingVertical: vs(2),
      borderRadius: scale(4),
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    previewChannel: {
      fontSize: sp(12),
      fontWeight: '500',
    },
    previewScroll: {
      flex: 1,
    },
    previewImage: {
      width: '100%',
      height: vs(220),
    },
    previewVideoContainer: {
      width: '100%',
      height: vs(220),
      position: 'relative',
      backgroundColor: '#000',
      borderRadius: scale(8),
      overflow: 'hidden',
    },
    previewVideoThumbnail: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    previewVideoPlaceholder: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    previewPlayButton: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    previewBody: {
      padding: scale(16),
    },
    previewCategoryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: vs(8),
    },
    previewCategory: {
      fontSize: sp(11),
      fontWeight: '600',
      paddingHorizontal: scale(8),
      paddingVertical: vs(2),
      borderRadius: scale(4),
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    previewDate: {
      fontSize: sp(12),
    },
    previewTitle: {
      fontSize: sp(22),
      fontWeight: '800',
      lineHeight: sp(28),
      marginBottom: vs(8),
      letterSpacing: -0.3,
    },
    previewSummary: {
      fontSize: sp(15),
      lineHeight: sp(22),
      marginBottom: vs(12),
      fontStyle: 'italic',
    },
    previewDivider: {
      height: 1,
      marginVertical: vs(12),
    },
    previewBodyText: {
      fontSize: sp(15),
      lineHeight: sp(24),
    },
    watchVideoBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: scale(8),
      paddingVertical: vs(14),
      borderRadius: scale(10),
      marginVertical: vs(12),
    },
    watchVideoText: {
      color: '#FFFFFF',
      fontSize: sp(16),
      fontWeight: '700',
    },
    previewFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: vs(12),
      marginTop: vs(12),
      borderTopWidth: 1,
    },
    previewStats: {
      flexDirection: 'row',
      gap: scale(14),
    },
    previewStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(4),
    },
    previewStatText: {
      fontSize: sp(12),
    },
    previewReadingTime: {
      fontSize: sp(12),
    },

    // ─── Video Player Styles ──────────────────────────────────────────────────
    videoPlayerContainer: {
      flex: 1,
      backgroundColor: '#000',
    },
    videoPlayerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: scale(16),
      paddingTop: Platform.OS === 'ios' ? vs(10) : vs(16),
      paddingBottom: vs(12),
      backgroundColor: 'rgba(0,0,0,0.8)',
      zIndex: 10,
    },
    videoPlayerCloseBtn: {
      width: scale(40),
      height: scale(40),
      justifyContent: 'center',
      alignItems: 'center',
    },
    videoPlayerTitle: {
      flex: 1,
      fontSize: sp(16),
      fontWeight: '600',
      color: '#FFFFFF',
      marginHorizontal: scale(12),
      textAlign: 'center',
    },
    videoPlayerWrapper: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
    },
    videoPlayer: {
      width: SW,
      height: SW * 0.5625,
      backgroundColor: '#000',
    },
    videoPlayerLoading: {
      justifyContent: 'center',
      alignItems: 'center',
      gap: vs(12),
    },
    videoPlayerLoadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
      gap: vs(12),
    },
    videoPlayerLoadingText: {
      color: '#FFFFFF',
      fontSize: sp(14),
      fontWeight: '500',
    },
  });
}