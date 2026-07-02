import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LiveCard from '../../components/LiveCard';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import { getLiveStreams } from '../../services/liveService';

export default function LiveTV({ navigation }) {
  const [liveStreams, setLiveStreams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLiveStreams();
  }, []);

  const loadLiveStreams = async () => {
    setIsLoading(true);
    try {
      const data = await getLiveStreams();
      setLiveStreams(data);
    } catch (error) {
      console.error('Error loading live streams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLiveStreams();
    setRefreshing(false);
  };

  const handleStreamPress = (liveId) => {
    navigation.navigate('VideoPlayer', { videoId: liveId });
  };

  if (isLoading) {
    return <Loader message="Loading live streams..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live TV</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.liveBanner}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
          <Text style={styles.bannerTitle}>
            {liveStreams.length > 0 ? 'Watch Live News Now' : 'No Live Streams Available'}
          </Text>
        </View>

        {liveStreams.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Live Now</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {liveStreams.map((stream) => (
              <LiveCard
                key={stream._id}
                stream={stream}
                onPress={() => handleStreamPress(stream._id)}
              />
            ))}

            <View style={styles.upcomingSection}>
              <Text style={styles.sectionTitle}>Upcoming Streams</Text>
              <Text style={styles.upcomingText}>
                No upcoming streams scheduled
              </Text>
            </View>
          </>
        ) : (
          <EmptyState
            icon="tv-outline"
            title="No Live Streams"
            message="There are currently no live streams. Check back later!"
          />
        )}

        <View style={styles.featuresContainer}>
          <TouchableOpacity style={styles.featureCard}>
            <Ionicons name="calendar-outline" size={32} color="#FF6B6B" />
            <Text style={styles.featureTitle}>Schedule</Text>
            <Text style={styles.featureDesc}>View upcoming broadcasts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureCard}>
            <Ionicons name="time-outline" size={32} color="#4ECDC4" />
            <Text style={styles.featureTitle}>Replay</Text>
            <Text style={styles.featureDesc}>Watch past broadcasts</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationButton: {
    padding: 8,
  },
  liveBanner: {
    backgroundColor: '#FF6B6B',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    animation: 'pulse 1s infinite',
  },
  liveBadgeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bannerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
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
  upcomingSection: {
    padding: 20,
  },
  upcomingText: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
  featuresContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  featureDesc: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
  },
});