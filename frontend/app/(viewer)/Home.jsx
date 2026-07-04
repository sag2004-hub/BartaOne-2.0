import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useArticles } from '../../hooks/useArticles';
import { useChannels } from '../../hooks/useChannels';
import NewsCard from '../../components/NewsCard';
import ChannelCard from '../../components/ChannelCard';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';

const { width } = Dimensions.get('window');

export default function Home({ navigation }) {
  const { user } = useAuth();
  const { articles = [], loading: articlesLoading, fetchArticles } = useArticles();
  const { channels = [], loading: channelsLoading, fetchChannels } = useChannels();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All', icon: 'apps-outline' },
    { id: 'news', label: 'News', icon: 'newspaper-outline' },
    { id: 'entertainment', label: 'Entertainment', icon: 'film-outline' },
    { id: 'sports', label: 'Sports', icon: 'basketball-outline' },
    { id: 'business', label: 'Business', icon: 'business-outline' },
    { id: 'technology', label: 'Tech', icon: 'hardware-chip-outline' },
    { id: 'lifestyle', label: 'Lifestyle', icon: 'leaf-outline' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        fetchArticles({ category: selectedCategory }),
        fetchChannels(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ✅ FIX: Safe filter with null check
  const filteredArticles = selectedCategory === 'all'
    ? (articles || [])
    : (articles || []).filter(article => article?.category === selectedCategory);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.displayName || 'User'}! 👋</Text>
          <Text style={styles.subGreeting}>Stay updated with local news</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="notifications-outline" size={24} color="#333" />
          <View style={styles.notificationBadge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons
              name={category.icon}
              size={20}
              color={selectedCategory === category.id ? '#FFF' : '#666'}
            />
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderFeatured = () => {
    // ✅ FIX: Safe filter with null check
    const featuredArticles = (articles || []).filter(a => a?.isFeatured).slice(0, 3);
    if (featuredArticles.length === 0) return null;

    return (
      <View style={styles.featuredSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured News</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredContainer}
        >
          {featuredArticles.map((article) => (
            <TouchableOpacity
              key={article._id || article.id}
              style={styles.featuredCard}
              onPress={() => navigation.navigate('ArticleDetails', { articleId: article._id || article.id })}
            >
              <Image
                source={{ uri: article.image || 'https://via.placeholder.com/300x200' }}
                style={styles.featuredImage}
              />
              <View style={styles.featuredOverlay}>
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>Featured</Text>
                </View>
                <Text style={styles.featuredTitle} numberOfLines={2}>
                  {article.title || 'Untitled'}
                </Text>
                <Text style={styles.featuredSource}>
                  {article.channel?.channelName || article.channel?.name || 'Unknown Channel'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderChannels = () => {
    // ✅ FIX: Safe check for channels
    if (!channels || channels.length === 0) return null;
    
    return (
      <View style={styles.channelsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Local Channels</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Search')}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.channelsContainer}
        >
          {channels.slice(0, 5).map((channel) => (
            <ChannelCard
              key={channel._id || channel.id}
              channel={channel}
              onPress={() => navigation.navigate('ChannelDetails', { channelId: channel._id || channel.id })}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Loading state
  if (articlesLoading && (!articles || articles.length === 0)) {
    return <Loader message="Loading news..." />;
  }

  // Ensure filteredArticles is always an array
  const safeFilteredArticles = filteredArticles || [];

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={safeFilteredArticles}
        keyExtractor={(item, index) => item?._id || item?.id || `article-${index}`}
        renderItem={({ item }) => (
          <NewsCard
            article={item}
            onPress={() => navigation.navigate('ArticleDetails', { articleId: item?._id || item?.id })}
          />
        )}
        ListHeaderComponent={
          <>
            {renderHeader()}
            {renderFeatured()}
            {renderChannels()}
            <View style={styles.latestSection}>
              <Text style={styles.sectionTitle}>Latest News</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="newspaper-outline"
            title="No News Found"
            message="There are no articles in this category yet. Check back later!"
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  subGreeting: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryContainer: {
    paddingVertical: 4,
    gap: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFF',
  },
  featuredSection: {
    marginTop: 20,
    paddingLeft: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
  },
  featuredContainer: {
    paddingRight: 20,
    gap: 12,
  },
  featuredCard: {
    width: width * 0.7,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  featuredBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  featuredBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  featuredTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  featuredSource: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  channelsSection: {
    marginTop: 24,
    paddingLeft: 20,
  },
  channelsContainer: {
    paddingRight: 20,
    gap: 12,
  },
  latestSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
});