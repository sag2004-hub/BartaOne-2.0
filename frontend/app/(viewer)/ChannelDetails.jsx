import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import NewsCard from '../../components/NewsCard';
import VideoCard from '../../components/VideoCard';
import Loader from '../../components/Loader';
import { getChannelById } from '../../services/channelService';
import { getChannelArticles } from '../../services/articleService';
import { getChannelVideos } from '../../services/videoService';

const { width } = Dimensions.get('window');

export default function ChannelDetails({ navigation }) {
  const route = useRoute();
  const { channelId } = route.params;
  const [channel, setChannel] = useState(null);
  const [articles, setArticles] = useState([]);
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('articles');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    loadChannelData();
  }, [channelId]);

  const loadChannelData = async () => {
    setIsLoading(true);
    try {
      const [channelData, articlesData, videosData] = await Promise.all([
        getChannelById(channelId),
        getChannelArticles(channelId),
        getChannelVideos(channelId),
      ]);
      setChannel(channelData);
      setArticles(articlesData);
      setVideos(videosData);
    } catch (error) {
      console.error('Error loading channel data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = () => {
    setIsSubscribed(!isSubscribed);
    // API call to subscribe/unsubscribe
  };

  if (isLoading) {
    return <Loader message="Loading channel..." />;
  }

  if (!channel) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Channel not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Channel Banner */}
        <Image
          source={{ uri: channel.banner || 'https://via.placeholder.com/800x200' }}
          style={styles.banner}
        />

        {/* Channel Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Image
              source={{ uri: channel.logo || 'https://via.placeholder.com/100' }}
              style={styles.logo}
            />
            <View style={styles.nameContainer}>
              <Text style={styles.channelName}>{channel.channelName}</Text>
              <View style={styles.verifiedContainer}>
                {channel.isVerified && (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color="#4ECDC4" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </>
                )}
              </View>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{channel.followers || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{articles.length + videos.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{channel.location?.city || 'N/A'}</Text>
              <Text style={styles.statLabel}>Location</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.subscribeButton,
              isSubscribed && styles.subscribedButton,
            ]}
            onPress={handleSubscribe}
          >
            <Ionicons
              name={isSubscribed ? 'checkmark' : 'add'}
              size={20}
              color={isSubscribed ? '#FF6B6B' : '#FFF'}
            />
            <Text
              style={[
                styles.subscribeText,
                isSubscribed && styles.subscribedText,
              ]}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.description}>{channel.description}</Text>
          <Text style={styles.language}>
            <Ionicons name="language-outline" size={16} color="#888" />{' '}
            {channel.language || 'English'}
          </Text>
        </View>

        {/* Tabs */}
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

        {/* Content */}
        {activeTab === 'articles' ? (
          articles.length > 0 ? (
            articles.map((article) => (
              <NewsCard
                key={article._id}
                article={article}
                onPress={() =>
                  navigation.navigate('ArticleDetails', { articleId: article._id })
                }
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No articles yet</Text>
            </View>
          )
        ) : videos.length > 0 ? (
          videos.map((video) => (
            <VideoCard
              key={video._id}
              video={video}
              onPress={() =>
                navigation.navigate('VideoPlayer', { videoId: video._id })
              }
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No videos yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  banner: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  infoSection: {
    backgroundColor: '#FFF',
    padding: 20,
    marginTop: -30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFF',
    marginRight: 16,
  },
  nameContainer: {
    flex: 1,
  },
  channelName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  verifiedText: {
    color: '#4ECDC4',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 16,
  },
  subscribedButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  subscribeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subscribedText: {
    color: '#FF6B6B',
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  language: {
    fontSize: 14,
    color: '#888',
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#888',
  },
});