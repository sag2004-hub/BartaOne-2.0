import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import Loader from '../../components/Loader';
import { getArticleById } from '../../services/articleService';
import { formatTimeAgo } from '../../utils/helpers';
import { useTranslation } from '../../hooks/useTranslation';

export default function ArticleDetails({ navigation }) {
  const route = useRoute();
  const { articleId } = route.params;
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const { translateText } = useTranslation();

  useEffect(() => {
    loadArticle();
  }, [articleId]);

  const loadArticle = async () => {
    setIsLoading(true);
    try {
      const data = await getArticleById(articleId);
      setArticle(data);
      setLikesCount(data.likes || 0);
    } catch (error) {
      console.error('Error loading article:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: article.title,
        message: `${article.title}\n\nRead more on BartaOne`,
        url: article.image,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    // API call to like/unlike
  };

  const handleBookmark = () => {
    Alert.alert('Bookmarked', 'Article saved for later reading!');
  };

  if (isLoading) {
    return <Loader message="Loading article..." />;
  }

  if (!article) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Article not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleBookmark} style={styles.headerButton}>
              <Ionicons name="bookmark-outline" size={22} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
              <Ionicons name="share-outline" size={22} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured Image */}
        {article.image && (
          <Image source={{ uri: article.image }} style={styles.featuredImage} />
        )}

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.metaContainer}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ChannelDetails', {
                  channelId: article.channelId?._id || article.channelId,
                })
              }
            >
              <Text style={styles.channelName}>
                {article.channelId?.channelName || 'Unknown Channel'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.timeAgo}>
              {formatTimeAgo(article.createdAt)}
            </Text>
          </View>

          <Text style={styles.title}>{article.title}</Text>

          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{article.category}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.body}>{article.body}</Text>

          <View style={styles.divider} />

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLike}
            >
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={24}
                color={isLiked ? '#FF6B6B' : '#666'}
              />
              <Text style={styles.actionText}>{likesCount} Likes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={24} color="#666" />
              <Text style={styles.actionText}>{article.comments || 0} Comments</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="eye-outline" size={24} color="#666" />
              <Text style={styles.actionText}>{article.views || 0} Views</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  featuredImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  channelName: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
  },
  timeAgo: {
    color: '#888',
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  categoryText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
    color: '#444',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
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