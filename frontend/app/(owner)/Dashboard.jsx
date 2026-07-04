// screens/Dashboard.jsx - Update the imports
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { getChannelByOwner, getChannelStats } from '../../services/channelService';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';

// ... rest of the component remains the same

const { width } = Dimensions.get('window');

export default function Dashboard({ navigation }) {
  const { user } = useAuth();
  const [channel, setChannel] = useState(null);
  const [stats, setStats] = useState({
    articles: 0,
    videos: 0,
    live: 0,
    followers: 0,
    views: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('📊 Loading dashboard data...');
      
      // Get channel by owner
      const channelData = await getChannelByOwner();
      console.log('📊 Channel data:', channelData);
      
      if (channelData) {
        setChannel(channelData);
        
        // Get stats
        try {
          const statsData = await getChannelStats(channelData._id || channelData.id);
          console.log('📊 Stats data:', statsData);
          setStats(statsData);
        } catch (statsError) {
          console.log('⚠️ Error loading stats:', statsError);
          // Keep default stats
        }
      } else {
        setChannel(null);
      }
    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  const quickActions = [
    {
      id: '1',
      icon: 'create-outline',
      title: 'Write Article',
      color: '#FF6B6B',
      onPress: () => {
        if (!channel) {
          Alert.alert('No Channel', 'Please create a channel first');
          return;
        }
        navigation.navigate('UploadArticle');
      },
    },
    {
      id: '2',
      icon: 'videocam-outline',
      title: 'Upload Video',
      color: '#4ECDC4',
      onPress: () => {
        if (!channel) {
          Alert.alert('No Channel', 'Please create a channel first');
          return;
        }
        navigation.navigate('UploadVideo');
      },
    },
    {
      id: '3',
      icon: 'radio-outline',
      title: 'Go Live',
      color: '#45B7D1',
      onPress: () => {
        if (!channel) {
          Alert.alert('No Channel', 'Please create a channel first');
          return;
        }
        navigation.navigate('GoLive');
      },
    },
    {
      id: '4',
      icon: 'people-outline',
      title: 'Subscribers',
      color: '#96CEB4',
      onPress: () => {
        if (!channel) {
          Alert.alert('No Channel', 'Please create a channel first');
          return;
        }
        navigation.navigate('Subscribers');
      },
    },
  ];

  const statCards = [
    {
      id: '1',
      label: 'Articles',
      value: stats.articles || 0,
      icon: 'newspaper-outline',
      color: '#FF6B6B',
    },
    {
      id: '2',
      label: 'Videos',
      value: stats.videos || 0,
      icon: 'videocam-outline',
      color: '#4ECDC4',
    },
    {
      id: '3',
      label: 'Live Streams',
      value: stats.live || 0,
      icon: 'radio-outline',
      color: '#45B7D1',
    },
    {
      id: '4',
      label: 'Followers',
      value: stats.followers || 0,
      icon: 'people-outline',
      color: '#96CEB4',
    },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C8001A" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!channel) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="mic-outline"
          title="No Channel Found"
          message="You haven't created a channel yet. Create your news channel to start publishing!"
          buttonText="Create Channel"
          onPress={() => navigation.navigate('CreateChannel')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.channelName}>{channel.channelName || channel.name || 'My Channel'}</Text>
            <View style={styles.verifiedContainer}>
              {channel.isVerified && (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#4ECDC4" />
                  <Text style={styles.verifiedText}>Verified Channel</Text>
                </>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('OwnerProfile')}
          >
            <Ionicons name="person-circle-outline" size={40} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          {statCards.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.color + '20' }]}>
                <Ionicons name={stat.icon} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={action.onPress}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon} size={28} color={action.color} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ManagePosts')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.recentCard}>
            <View style={styles.recentItem}>
              <View style={styles.recentDot} />
              <View style={styles.recentContent}>
                <Text style={styles.recentTitle}>No recent activity</Text>
                <Text style={styles.recentTime}>Start publishing to see activity here</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <View style={styles.tipsCard}>
            <Ionicons name="bulb-outline" size={24} color="#FF6B6B" />
            <View style={styles.tipsContent}>
              <Text style={styles.tipsTitle}>Pro Tip</Text>
              <Text style={styles.tipsText}>
                Regular posting helps grow your audience. Try to publish at least 3 articles per week!
              </Text>
            </View>
          </View>
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
  content: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  greeting: {
    fontSize: 14,
    color: '#888',
  },
  channelName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  verifiedText: {
    color: '#4ECDC4',
    fontSize: 14,
  },
  profileButton: {
    padding: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 44) / 2,
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
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  quickActionsSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: (width - 52) / 2,
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
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  recentSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
  },
  recentCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 14,
    color: '#888',
  },
  recentTime: {
    fontSize: 12,
    color: '#CCC',
    marginTop: 2,
  },
  tipsSection: {
    paddingHorizontal: 20,
    marginVertical: 24,
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F5',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  tipsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    lineHeight: 20,
  },
});