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

export default function ChannelCard({ channel, onPress, variant = 'horizontal' }) {
  const getInitials = (name) => {
    if (!name) return 'C';
    return name.charAt(0).toUpperCase();
  };

  if (variant === 'vertical') {
    return (
      <TouchableOpacity style={styles.verticalCard} onPress={onPress}>
        {channel.logo ? (
          <Image source={{ uri: channel.logo }} style={styles.verticalLogo} />
        ) : (
          <View style={[styles.verticalLogo, styles.logoPlaceholder]}>
            <Text style={styles.initialsText}>{getInitials(channel.channelName)}</Text>
          </View>
        )}
        <Text style={styles.verticalName} numberOfLines={1}>
          {channel.channelName}
        </Text>
        <View style={styles.verticalStats}>
          <Ionicons name="people-outline" size={12} color="#888" />
          <Text style={styles.verticalStatText}>
            {channel.followers || 0} followers
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.horizontalCard} onPress={onPress}>
      {channel.logo ? (
        <Image source={{ uri: channel.logo }} style={styles.horizontalLogo} />
      ) : (
        <View style={[styles.horizontalLogo, styles.logoPlaceholder]}>
          <Text style={styles.initialsText}>{getInitials(channel.channelName)}</Text>
        </View>
      )}
      <View style={styles.horizontalContent}>
        <View style={styles.horizontalHeader}>
          <Text style={styles.horizontalName} numberOfLines={1}>
            {channel.channelName}
          </Text>
          {channel.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color="#4ECDC4" />
          )}
        </View>
        <Text style={styles.horizontalDescription} numberOfLines={2}>
          {channel.description}
        </Text>
        <View style={styles.horizontalFooter}>
          <View style={styles.horizontalStat}>
            <Ionicons name="people-outline" size={14} color="#888" />
            <Text style={styles.horizontalStatText}>
              {channel.followers || 0}
            </Text>
          </View>
          <View style={styles.horizontalStat}>
            <Ionicons name="location-outline" size={14} color="#888" />
            <Text style={styles.horizontalStatText}>
              {channel.location?.city || 'N/A'}
            </Text>
          </View>
          <View style={styles.horizontalStat}>
            <Ionicons name="language-outline" size={14} color="#888" />
            <Text style={styles.horizontalStatText}>
              {channel.language || 'EN'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Horizontal Card Styles
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
  },
  horizontalLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  logoPlaceholder: {
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  horizontalContent: {
    flex: 1,
  },
  horizontalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  horizontalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  horizontalDescription: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  horizontalFooter: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 12,
  },
  horizontalStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  horizontalStatText: {
    fontSize: 12,
    color: '#888',
  },

  // Vertical Card Styles
  verticalCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    width: width * 0.28,
  },
  verticalLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  verticalName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
  },
  verticalStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  verticalStatText: {
    fontSize: 11,
    color: '#888',
  },
});