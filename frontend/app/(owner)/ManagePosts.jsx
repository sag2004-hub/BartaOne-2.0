import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { getOwnerArticles, deleteArticle } from '../../services/articleService';
import { getOwnerVideos, deleteVideo } from '../../services/videoService';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';

export default function ManagePosts({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('articles');
  const [articles, setArticles] = useState([]);
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [articlesData, videosData] = await Promise.all([
        getOwnerArticles(user.uid),
        getOwnerVideos(user.uid),
      ]);
      setArticles(articlesData);
      setVideos(videosData);
    } catch (error) {
      console.error('Error loading posts:', error);
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
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const renderArticleItem = (article) => (
    <TouchableOpacity
      key={article._id}
      style={styles.postCard}
      onPress={() => navigation.navigate('ArticleDetails', { articleId: article._id })}
    >
      <View style={styles.postHeader}>
        <Text style={styles.postTitle} numberOfLines={1}>
          {article.title}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setSelectedItem(article);
            setModalVisible(true);
          }}
        >
          <Ionicons name="more-vertical" size={20} color="#888" />
        </TouchableOpacity>
      </View>
      <View style={styles.postMeta}>
        <Text style={styles.postCategory}>{article.category}</Text>
        <Text style={styles.postDate}>
          {new Date(article.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.postStats}>
        <View style={styles.stat}>
          <Ionicons name="eye-outline" size={16} color="#888" />
          <Text style={styles.statText}>{article.views || 0}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="heart-outline" size={16} color="#888" />
          <Text style={styles.statText}>{article.likes || 0}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="chatbubble-outline" size={16} color="#888" />
          <Text style={styles.statText}>{article.comments || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderVideoItem = (video) => (
    <TouchableOpacity
      key={video._id}
      style={styles.postCard}
      onPress={() => navigation.navigate('VideoPlayer', { videoId: video._id })}
    >
      <View style={styles.postHeader}>
        <Text style={styles.postTitle} numberOfLines={1}>
          {video.title}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setSelectedItem(video);
            setModalVisible(true);
          }}
        >
          <Ionicons name="more-vertical" size={20} color="#888" />
        </TouchableOpacity>
      </View>
      <View style={styles.postMeta}>
        <Text style={styles.postCategory}>{video.category}</Text>
        <Text style={styles.postDate}>
          {new Date(video.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.postStats}>
        <View style={styles.stat}>
          <Ionicons name="eye-outline" size={16} color="#888" />
          <Text style={styles.statText}>{video.views || 0}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="heart-outline" size={16} color="#888" />
          <Text style={styles.statText}>{video.likes || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return <Loader message="Loading posts..." />;
  }

  const currentData = activeTab === 'articles' ? articles : videos;
  const hasData = currentData.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Posts</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'articles' && styles.tabActive]}
          onPress={() => setActiveTab('articles')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'articles' && styles.tabTextActive,
            ]}
          >
            Articles ({articles.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'videos' && styles.tabActive]}
          onPress={() => setActiveTab('videos')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'videos' && styles.tabTextActive,
            ]}
          >
            Videos ({videos.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {hasData ? (
          activeTab === 'articles'
            ? articles.map(renderArticleItem)
            : videos.map(renderVideoItem)
        ) : (
          <EmptyState
            icon={activeTab === 'articles' ? 'newspaper-outline' : 'videocam-outline'}
            title={`No ${activeTab} yet`}
            message={`Start publishing ${activeTab} to see them here`}
            buttonText={`Create ${activeTab === 'articles' ? 'Article' : 'Video'}`}
            onPress={() =>
              navigation.navigate(activeTab === 'articles' ? 'UploadArticle' : 'UploadVideo')
            }
          />
        )}
      </ScrollView>

      {/* Action Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setModalVisible(false);
                navigation.navigate(
                  activeTab === 'articles' ? 'UploadArticle' : 'UploadVideo',
                  { edit: selectedItem }
                );
              }}
            >
              <Ionicons name="create-outline" size={22} color="#4ECDC4" />
              <Text style={styles.modalOptionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, styles.modalOptionDelete]}
              onPress={() => {
                setModalVisible(false);
                handleDelete(selectedItem, activeTab.slice(0, -1));
              }}
            >
              <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
              <Text style={[styles.modalOptionText, styles.modalOptionDeleteText]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FF6B6B',
  },
  content: {
    padding: 16,
  },
  postCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  postCategory: {
    fontSize: 12,
    color: '#FF6B6B',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  postDate: {
    fontSize: 12,
    color: '#888',
  },
  postStats: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#888',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  modalOptionDelete: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalOptionDeleteText: {
    color: '#FF6B6B',
  },
});