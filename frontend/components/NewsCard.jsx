import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function NewsCard({ article, onPress }) {
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {article.image && (
        <Image source={{ uri: article.image }} style={styles.image} />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.category}>{article.category || 'News'}</Text>
          <Text style={styles.time}>{formatTimeAgo(article.createdAt)}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {article.title}
        </Text>
        {article.summary && (
          <Text style={styles.summary} numberOfLines={2}>
            {article.summary}
          </Text>
        )}
        <View style={styles.footer}>
          <View style={styles.channelInfo}>
            {article.channelId?.logo ? (
              <Image 
                source={{ uri: article.channelId.logo }} 
                style={styles.channelLogo} 
              />
            ) : (
              <View style={[styles.channelLogo, styles.logoPlaceholder]}>
                <Text style={styles.logoText}>
                  {article.channelId?.channelName?.charAt(0) || 'C'}
                </Text>
              </View>
            )}
            <Text style={styles.channelName}>
              {article.channelId?.channelName || 'Unknown'}
            </Text>
          </View>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons name="eye-outline" size={14} color="#888" />
              <Text style={styles.statText}>{article.views || 0}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="heart-outline" size={14} color="#888" />
              <Text style={styles.statText}>{article.likes || 0}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  time: {
    fontSize: 12,
    color: '#888',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    lineHeight: 24,
  },
  summary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  channelLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  logoPlaceholder: {
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  channelName: {
    fontSize: 13,
    color: '#666',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
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
});