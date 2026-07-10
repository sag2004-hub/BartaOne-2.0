// app/(viewer)/Profile.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  FlatList,
  RefreshControl,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { 
  signOut, 
  updateEmail, 
  updateProfile, 
  EmailAuthProvider, 
  reauthenticateWithCredential,
  getAuth,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '../../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { channelService } from '../../services/channelService';
import { userAPI } from '../../services/api';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'ur', name: 'اردو', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
  { code: 'or', name: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'as', name: 'অসমীয়া', flag: '🇮🇳' },
];

export default function Profile({ navigation }) {
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [savedArticles, setSavedArticles] = useState([]);
  const [readingHistory, setReadingHistory] = useState([]);
  const [subscribedChannels, setSubscribedChannels] = useState([]);
  const [activeTab, setActiveTab] = useState('saved');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // ─── Auto-refresh when screen comes into focus ──────────────────────────
  useFocusEffect(
    useCallback(() => {
      refreshAllData();
    }, [])
  );

  useEffect(() => {
    refreshAllData();
  }, []);

  const refreshAllData = async () => {
    setRefreshing(true);
    await Promise.all([
      loadUserData(),
      loadSavedArticles(),
      loadReadingHistory(),
      loadSubscribedChannels(),
      loadLanguagePreference(),
    ]);
    setRefreshing(false);
  };

  const loadUserData = async () => {
    try {
      const currentUser = getAuth().currentUser;
      if (currentUser) {
        const displayName = currentUser.displayName || user?.displayName || 'User';
        const email = currentUser.email || user?.email || '';
        setUserDisplayName(displayName);
        setUserEmail(email);
        setEditName(displayName);
        setEditEmail(email);
        
        // ─── Load user data from MongoDB via API ──────────────────────────
        try {
          const response = await userAPI.getProfile();
          console.log('📊 User profile from MongoDB:', response.data);
          
          if (response.data?.data) {
            const userData = response.data.data;
            const name = userData.name || userData.displayName || displayName;
            const emailData = userData.email || email;
            
            setUserDisplayName(name);
            setUserEmail(emailData);
            setEditName(name);
            setEditEmail(emailData);
          }
        } catch (apiError) {
          console.log('Could not fetch user profile from MongoDB, using Auth data:', apiError);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadSavedArticles = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedArticles');
      if (saved) {
        setSavedArticles(JSON.parse(saved));
      } else {
        setSavedArticles([]);
      }
    } catch (error) {
      console.error('Error loading saved articles:', error);
      setSavedArticles([]);
    }
  };

  const loadReadingHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('readingHistory');
      if (history) {
        const parsed = JSON.parse(history);
        const sorted = parsed.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
        setReadingHistory(sorted);
      } else {
        setReadingHistory([]);
      }
    } catch (error) {
      console.error('Error loading reading history:', error);
      setReadingHistory([]);
    }
  };

  const loadSubscribedChannels = async () => {
    try {
      const subscribed = await AsyncStorage.getItem('subscribedChannels');
      if (subscribed) {
        setSubscribedChannels(JSON.parse(subscribed));
      } else {
        setSubscribedChannels([]);
      }
    } catch (error) {
      console.error('Error loading subscribed channels:', error);
      setSubscribedChannels([]);
    }
  };

  const loadLanguagePreference = async () => {
    try {
      const lang = await AsyncStorage.getItem('appLanguage');
      if (lang) {
        setSelectedLanguage(lang);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  };

  // ─── Save Article to History ──────────────────────────────────────────────
  const addToReadingHistory = async (item) => {
    try {
      const existing = await AsyncStorage.getItem('readingHistory');
      let history = existing ? JSON.parse(existing) : [];
      
      history = history.filter(h => h.id !== item.id);
      
      history.unshift({
        ...item,
        timestamp: Date.now(),
      });
      
      if (history.length > 50) {
        history = history.slice(0, 50);
      }
      
      await AsyncStorage.setItem('readingHistory', JSON.stringify(history));
      setReadingHistory(history);
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  };

  // ─── Save Article ──────────────────────────────────────────────────────────
  const saveArticle = async (article) => {
    try {
      const existing = await AsyncStorage.getItem('savedArticles');
      let saved = existing ? JSON.parse(existing) : [];
      
      if (!saved.some(item => item.id === article.id)) {
        saved.push(article);
        await AsyncStorage.setItem('savedArticles', JSON.stringify(saved));
        setSavedArticles(saved);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving article:', error);
      return false;
    }
  };

  // ─── Save Channel Subscription ─────────────────────────────────────────────
  const saveChannelSubscription = async (channel) => {
    try {
      const existing = await AsyncStorage.getItem('subscribedChannels');
      let channels = existing ? JSON.parse(existing) : [];
      
      if (!channels.some(c => c.id === channel.id)) {
        channels.push(channel);
        await AsyncStorage.setItem('subscribedChannels', JSON.stringify(channels));
        setSubscribedChannels(channels);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving channel subscription:', error);
      return false;
    }
  };

  // ─── Save Profile to MongoDB ─────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    if (!editEmail.trim()) {
      Alert.alert('Error', 'Email cannot be empty');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (editEmail.trim() !== userEmail && !editPassword.trim()) {
      Alert.alert('Password Required', 'Please enter your current password to change email');
      setShowPasswordField(true);
      return;
    }

    setIsLoading(true);
    try {
      const currentUser = getAuth().currentUser;
      
      if (!currentUser) {
        Alert.alert('Error', 'No user logged in');
        setIsLoading(false);
        return;
      }

      // ─── Update Email in Firebase Auth ──────────────────────────────────
      if (editEmail.trim() !== userEmail) {
        try {
          if (editPassword.trim()) {
            const credential = EmailAuthProvider.credential(
              currentUser.email,
              editPassword.trim()
            );
            await reauthenticateWithCredential(currentUser, credential);
          }
          
          await updateEmail(currentUser, editEmail.trim());
          setUserEmail(editEmail.trim());
          setShowPasswordField(false);
          setEditPassword('');
          
          await sendEmailVerification(currentUser);
          console.log('✅ Email updated in Firebase Auth');
        } catch (emailError) {
          console.error('Error updating email:', emailError);
          if (emailError.code === 'auth/wrong-password') {
            Alert.alert('Error', 'Incorrect password. Please try again.');
            setShowPasswordField(true);
            setIsLoading(false);
            return;
          } else if (emailError.code === 'auth/requires-recent-login') {
            Alert.alert('Error', 'Please re-authenticate. Try logging out and back in.');
            setIsLoading(false);
            return;
          } else {
            Alert.alert('Error', emailError.message || 'Failed to update email');
            setIsLoading(false);
            return;
          }
        }
      }

      // ─── Update Display Name in Firebase Auth ──────────────────────────
      if (editName.trim() !== userDisplayName) {
        await updateProfile(currentUser, {
          displayName: editName.trim(),
        });
        setUserDisplayName(editName.trim());
        console.log('✅ Display name updated in Firebase Auth');
      }

      // ─── Update MongoDB via API ─────────────────────────────────────────
      try {
        const updateData = {
          name: editName.trim(),
          email: editEmail.trim(),
        };
        
        console.log('📤 Updating MongoDB user profile:', updateData);
        const response = await userAPI.updateProfile(updateData);
        console.log('✅ MongoDB user profile updated:', response.data);
        
        Alert.alert('Success', 'Profile updated successfully in database!');
      } catch (apiError) {
        console.error('Error updating MongoDB:', apiError);
        Alert.alert(
          'Warning',
          'Profile updated locally but database sync failed. Please try again.',
          [{ text: 'OK' }]
        );
      }

      setIsEditing(false);
      await refreshAllData();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = async (langCode) => {
    try {
      setSelectedLanguage(langCode);
      await AsyncStorage.setItem('appLanguage', langCode);
      setShowLanguageModal(false);
      
      // ─── Also update language in MongoDB ──────────────────────────────
      try {
        await userAPI.updateProfile({ preferredLanguage: langCode });
        console.log('✅ Language preference saved to MongoDB');
      } catch (error) {
        console.error('Error saving language to MongoDB:', error);
      }
      
      Alert.alert('Success', 'Language updated! App will restart to apply changes.');
    } catch (error) {
      console.error('Error saving language:', error);
      Alert.alert('Error', 'Failed to update language');
    }
  };

  const handleRemoveSaved = async (articleId) => {
    try {
      const updated = savedArticles.filter(item => item.id !== articleId);
      setSavedArticles(updated);
      await AsyncStorage.setItem('savedArticles', JSON.stringify(updated));
    } catch (error) {
      console.error('Error removing saved article:', error);
    }
  };

  const handleClearHistory = async () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear your reading history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('readingHistory');
            setReadingHistory([]);
          },
        },
      ]
    );
  };

  // ─── Unsubscribe from Channel (Updates Database) ─────────────────────────
  const handleUnsubscribe = async (channelId) => {
    Alert.alert(
      'Unsubscribe',
      'Are you sure you want to unsubscribe from this channel?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unsubscribe',
          style: 'destructive',
          onPress: async () => {
            try {
              await channelService.unsubscribe(channelId);
              console.log('✅ Unsubscribed from backend');
              
              const updated = subscribedChannels.filter(ch => ch.id !== channelId);
              setSubscribedChannels(updated);
              await AsyncStorage.setItem('subscribedChannels', JSON.stringify(updated));
              
              await loadSubscribedChannels();
              Alert.alert('Success', 'Unsubscribed from channel');
            } catch (error) {
              console.error('Error unsubscribing:', error);
              const updated = subscribedChannels.filter(ch => ch.id !== channelId);
              setSubscribedChannels(updated);
              await AsyncStorage.setItem('subscribedChannels', JSON.stringify(updated));
              await loadSubscribedChannels();
              Alert.alert('Error', 'Failed to unsubscribe from backend. Removed from local list.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await AsyncStorage.removeItem('savedArticles');
              await AsyncStorage.removeItem('readingHistory');
              await AsyncStorage.removeItem('subscribedChannels');
              await AsyncStorage.removeItem('appLanguage');
              
              await signOut(auth);
              navigation.replace('Welcome');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAllData();
    setRefreshing(false);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderSavedItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.historyItem, isDarkMode && styles.historyItemDark]}
      onPress={() => {
        addToReadingHistory({ id: item.id, title: item.title, image: item.image, channelName: item.channelName, type: 'article' });
        navigation.navigate('ArticleDetails', { id: item.id });
      }}
    >
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.historyImage} />
      )}
      <View style={styles.historyContent}>
        <Text style={[styles.historyTitle, isDarkMode && styles.textDark]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.historyMeta, isDarkMode && styles.textMuted]}>
          {item.channelName || 'Unknown'} • {new Date(item.timestamp || Date.now()).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveSaved(item.id)}
      >
        <Ionicons name="close-circle" size={22} color="#C8001A" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.historyItem, isDarkMode && styles.historyItemDark]}
      onPress={() => {
        navigation.navigate(
          item.type === 'video' ? 'VideoPlayer' : 'ArticleDetails',
          { id: item.id }
        );
      }}
    >
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.historyImage} />
      )}
      <View style={styles.historyContent}>
        <View style={styles.historyTypeBadge}>
          <Text style={styles.historyTypeText}>
            {item.type === 'video' ? '🎬 Video' : '📰 Article'}
          </Text>
        </View>
        <Text style={[styles.historyTitle, isDarkMode && styles.textDark]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.historyMeta, isDarkMode && styles.textMuted]}>
          {item.channelName || 'Unknown'} • {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderChannelItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.channelItem, isDarkMode && styles.channelItemDark]}
      onPress={() => {
        navigation.navigate('ChannelDetails', { id: item.id });
      }}
    >
      <Image source={{ uri: item.logo || 'https://via.placeholder.com/50' }} style={styles.channelLogo} />
      <Text style={[styles.channelName, isDarkMode && styles.textDark]} numberOfLines={1}>
        {item.name}
      </Text>
      <TouchableOpacity
        style={styles.unsubscribeButton}
        onPress={() => handleUnsubscribe(item.id)}
      >
        <Ionicons name="close-circle" size={20} color="#C8001A" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const menuItems = [
    {
      id: 'edit',
      icon: 'create-outline',
      title: 'Edit Profile',
      onPress: () => {
        setEditName(userDisplayName);
        setEditEmail(userEmail);
        setEditPassword('');
        setShowPasswordField(false);
        setIsEditing(true);
      },
    },
    {
      id: 'language',
      icon: 'language-outline',
      title: 'Language Preferences',
      onPress: () => setShowLanguageModal(true),
    },
    {
      id: 'darkmode',
      icon: 'moon-outline',
      title: 'Dark Mode',
      isSwitch: true,
      value: isDarkMode,
      onToggle: () => setIsDarkMode(!isDarkMode),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={isDarkMode ? '#FFF' : '#C8001A'}
            colors={[isDarkMode ? '#FFF' : '#C8001A']}
          />
        }
      >
        {/* Profile Header */}
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
          <View style={styles.profileInitialsLarge}>
            <Text style={[styles.initialsTextLarge, isDarkMode && styles.textDark]}>
              {getInitials(userDisplayName || user?.displayName)}
            </Text>
          </View>
          <Text style={[styles.userName, isDarkMode && styles.textDark]}>
            {userDisplayName || user?.displayName || 'User'}
          </Text>
          <Text style={[styles.userEmail, isDarkMode && styles.textMuted]}>
            {userEmail || user?.email}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Viewer</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsContainer, isDarkMode && styles.statsContainerDark]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, isDarkMode && styles.textDark]}>
              {subscribedChannels.length}
            </Text>
            <Text style={[styles.statLabel, isDarkMode && styles.textMuted]}>Subscriptions</Text>
          </View>
          <View style={[styles.statDivider, isDarkMode && styles.dividerDark]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, isDarkMode && styles.textDark]}>
              {savedArticles.length}
            </Text>
            <Text style={[styles.statLabel, isDarkMode && styles.textMuted]}>Saved</Text>
          </View>
          <View style={[styles.statDivider, isDarkMode && styles.dividerDark]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, isDarkMode && styles.textDark]}>
              {readingHistory.length}
            </Text>
            <Text style={[styles.statLabel, isDarkMode && styles.textMuted]}>History</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={[styles.menuContainer, isDarkMode && styles.menuContainerDark]}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, isDarkMode && styles.menuItemDark]}
              onPress={item.onPress}
              disabled={item.isSwitch}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon} size={22} color={isDarkMode ? '#8B9BAB' : '#666'} />
                <Text style={[styles.menuTitle, isDarkMode && styles.textDark]}>
                  {item.title}
                </Text>
              </View>
              {item.isSwitch ? (
                <Switch
                  value={item.value}
                  onValueChange={item.onToggle}
                  trackColor={{ false: '#767577', true: '#C8001A' }}
                  thumbColor={item.value ? '#FFF' : '#f4f3f4'}
                />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#3A4A58' : '#CCC'} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tabs */}
        <View style={[styles.tabContainer, isDarkMode && styles.tabContainerDark]}>
          {['saved', 'history', 'subscriptions'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
                isDarkMode && styles.textDark,
              ]}>
                {tab === 'saved' ? 'Saved' : tab === 'history' ? 'History' : 'Subscriptions'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'saved' && (
            savedArticles.length > 0 ? (
              <FlatList
                data={savedArticles}
                renderItem={renderSavedItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="bookmark-outline" size={50} color={isDarkMode ? '#3A4A58' : '#CCC'} />
                <Text style={[styles.emptyText, isDarkMode && styles.textMuted]}>
                  No saved articles yet
                </Text>
                <Text style={[styles.emptySubText, isDarkMode && styles.textMuted]}>
                  Save articles by tapping the bookmark icon
                </Text>
              </View>
            )
          )}

          {activeTab === 'history' && (
            readingHistory.length > 0 ? (
              <>
                <TouchableOpacity style={styles.clearHistoryBtn} onPress={handleClearHistory}>
                  <Text style={styles.clearHistoryText}>Clear All</Text>
                </TouchableOpacity>
                <FlatList
                  data={readingHistory}
                  renderItem={renderHistoryItem}
                  keyExtractor={(item) => `${item.id}-${item.timestamp}`}
                  scrollEnabled={false}
                />
              </>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={50} color={isDarkMode ? '#3A4A58' : '#CCC'} />
                <Text style={[styles.emptyText, isDarkMode && styles.textMuted]}>
                  No reading history yet
                </Text>
                <Text style={[styles.emptySubText, isDarkMode && styles.textMuted]}>
                  Articles and videos you view will appear here
                </Text>
              </View>
            )
          )}

          {activeTab === 'subscriptions' && (
            subscribedChannels.length > 0 ? (
              <FlatList
                data={subscribedChannels}
                renderItem={renderChannelItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                numColumns={2}
                columnWrapperStyle={styles.channelGrid}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={50} color={isDarkMode ? '#3A4A58' : '#CCC'} />
                <Text style={[styles.emptyText, isDarkMode && styles.textMuted]}>
                  No subscriptions yet
                </Text>
                <Text style={[styles.emptySubText, isDarkMode && styles.textMuted]}>
                  Subscribe to channels to see them here
                </Text>
              </View>
            )
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, isDarkMode && styles.logoutButtonDark]}
          onPress={handleLogout}
          disabled={isLoading}
        >
          <Ionicons name="log-out-outline" size={22} color="#C8001A" />
          <Text style={[styles.logoutText, isDarkMode && styles.logoutTextDark]}>
            {isLoading ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, isDarkMode && styles.textMuted]}>
          BartaOne v1.0.0
        </Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditing}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, isDarkMode && styles.modalContainerDark]}>
            <View style={[styles.modalHeader, isDarkMode && styles.modalHeaderDark]}>
              <Text style={[styles.modalTitle, isDarkMode && styles.textDark]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#EDF2F7' : '#333'} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, isDarkMode && styles.textDark]}>Display Name</Text>
              <TextInput
                style={[styles.input, isDarkMode && styles.inputDark]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor={isDarkMode ? '#5C6E80' : '#999'}
              />

              <Text style={[styles.inputLabel, isDarkMode && styles.textDark, { marginTop: 16 }]}>Email Address</Text>
              <TextInput
                style={[styles.input, isDarkMode && styles.inputDark]}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Enter your email"
                placeholderTextColor={isDarkMode ? '#5C6E80' : '#999'}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {(showPasswordField || editEmail !== userEmail) && (
                <>
                  <Text style={[styles.inputLabel, isDarkMode && styles.textDark, { marginTop: 16 }]}>
                    Current Password
                  </Text>
                  <TextInput
                    style={[styles.input, isDarkMode && styles.inputDark]}
                    value={editPassword}
                    onChangeText={setEditPassword}
                    placeholder="Enter current password"
                    placeholderTextColor={isDarkMode ? '#5C6E80' : '#999'}
                    secureTextEntry
                  />
                  <Text style={[styles.passwordHint, isDarkMode && styles.textMuted]}>
                    Password required to change email address
                  </Text>
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, isDarkMode && styles.cancelButtonDark]}
                  onPress={() => {
                    setIsEditing(false);
                    setShowPasswordField(false);
                    setEditPassword('');
                  }}
                >
                  <Text style={[styles.cancelButtonText, isDarkMode && styles.textDark]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                  onPress={handleSaveProfile}
                  disabled={isLoading}
                >
                  <Text style={styles.saveButtonText}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, isDarkMode && styles.modalContainerDark]}>
            <View style={[styles.modalHeader, isDarkMode && styles.modalHeaderDark]}>
              <Text style={[styles.modalTitle, isDarkMode && styles.textDark]}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#EDF2F7' : '#333'} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    selectedLanguage === item.code && styles.languageItemSelected,
                    isDarkMode && styles.languageItemDark,
                  ]}
                  onPress={() => handleLanguageChange(item.code)}
                >
                  <Text style={styles.languageFlag}>{item.flag}</Text>
                  <Text style={[styles.languageName, isDarkMode && styles.textDark]}>
                    {item.name}
                  </Text>
                  {selectedLanguage === item.code && (
                    <Ionicons name="checkmark-circle" size={22} color="#C8001A" />
                  )}
                </TouchableOpacity>
              )}
              style={styles.languageList}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  containerDark: {
    backgroundColor: '#0D1117',
  },
  header: {
    backgroundColor: '#FFF',
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerDark: {
    backgroundColor: '#161B22',
    borderBottomColor: '#2A3340',
  },
  profileInitialsLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C8001A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  initialsTextLarge: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#FFF0F2',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  roleText: {
    color: '#C8001A',
    fontSize: 12,
    fontWeight: '600',
  },
  textDark: {
    color: '#EDF2F7',
  },
  textMuted: {
    color: '#8B9BAB',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsContainerDark: {
    backgroundColor: '#161B22',
    shadowOpacity: 0.35,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
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
  dividerDark: {
    backgroundColor: '#2A3340',
  },
  menuContainer: {
    backgroundColor: '#FFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuContainerDark: {
    backgroundColor: '#161B22',
    shadowOpacity: 0.35,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemDark: {
    borderBottomColor: '#2A3340',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuTitle: {
    fontSize: 16,
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabContainerDark: {
    backgroundColor: '#161B22',
    shadowOpacity: 0.35,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#C8001A',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
  },
  tabTextActive: {
    color: '#C8001A',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyItemDark: {
    backgroundColor: '#161B22',
  },
  historyImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
    justifyContent: 'center',
  },
  historyTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#FFF0F2',
    marginBottom: 4,
  },
  historyTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#C8001A',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  historyMeta: {
    fontSize: 11,
    color: '#888',
  },
  removeButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 13,
    color: '#AAA',
    marginTop: 4,
    textAlign: 'center',
  },
  channelGrid: {
    justifyContent: 'space-between',
  },
  channelItem: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  channelItemDark: {
    backgroundColor: '#161B22',
  },
  channelLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  channelName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  unsubscribeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  clearHistoryBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  clearHistoryText: {
    color: '#C8001A',
    fontSize: 13,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    marginTop: 16,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#C8001A',
  },
  logoutButtonDark: {
    backgroundColor: '#161B22',
    borderColor: '#E8192C',
  },
  logoutText: {
    color: '#C8001A',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutTextDark: {
    color: '#E8192C',
  },
  versionText: {
    textAlign: 'center',
    color: '#CCC',
    fontSize: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 300,
    maxHeight: '80%',
  },
  modalContainerDark: {
    backgroundColor: '#161B22',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalHeaderDark: {
    borderBottomColor: '#2A3340',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  inputDark: {
    borderColor: '#2A3340',
    backgroundColor: '#0D1117',
    color: '#EDF2F7',
  },
  saveButton: {
    backgroundColor: '#C8001A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 10,
  },
  cancelButtonDark: {
    borderColor: '#2A3340',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  passwordHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    marginLeft: 4,
  },
  languageList: {
    paddingHorizontal: 20,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingHorizontal: 4,
  },
  languageItemDark: {
    borderBottomColor: '#2A3340',
  },
  languageItemSelected: {
    backgroundColor: '#FFF0F2',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
});