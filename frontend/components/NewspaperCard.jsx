import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../utils/constants';

const NewspaperCard = ({ newspaper, onPress }) => {
  const { title, description, pages, publishedAt, expiresAt, channelId } = newspaper;
  
  const getTimeRemaining = () => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const getPageCount = () => pages?.length || 0;
  
  const getThumbnail = () => {
    if (pages && pages.length > 0 && pages[0].images && pages[0].images.length > 0) {
      return pages[0].images[0];
    }
    return null;
  };

  const isExpired = () => {
    const now = new Date();
    return new Date(expiresAt) <= now;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {getThumbnail() && (
        <Image source={{ uri: getThumbnail() }} style={styles.thumbnail} />
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {isExpired() && (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredText}>Expired</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
        
        <View style={styles.footer}>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons name="book-outline" size={16} color={COLORS.gray} />
              <Text style={styles.statText}>{getPageCount()} pages</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.gray} />
              <Text style={styles.statText}>
                {new Date(publishedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
          
          {!isExpired() && (
            <View style={styles.timeRemaining}>
              <Ionicons name="time-outline" size={14} color={COLORS.primary} />
              <Text style={styles.timeText}>{getTimeRemaining()}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: SIZES.padding,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 8,
  },
  expiredBadge: {
    backgroundColor: COLORS.error || 'red',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  expiredText: {
    color: COLORS.white,
    fontSize: SIZES.body4,
    fontWeight: 'bold',
  },
  description: {
    fontSize: SIZES.body2,
    color: COLORS.gray,
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 12,
  },
  stats: {
    flexDirection: 'row',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: SIZES.body4,
    color: COLORS.gray,
    marginLeft: 4,
  },
  timeRemaining: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  timeText: {
    fontSize: SIZES.body4,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default NewspaperCard;