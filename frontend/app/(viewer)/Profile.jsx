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
  Dimensions,
  PixelRatio,
  Platform,
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
import { useRouter, useFocusEffect } from 'expo-router';
import { channelService } from '../../services/channelService';
import { userAPI } from '../../services/api';

// ─── Responsive helpers ──────────────────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base design dimensions (iPhone 14 Pro)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

// Responsive scaling functions
const scale = (size) => {
  const scaleFactor = SCREEN_WIDTH / BASE_WIDTH;
  const clamped = Math.min(Math.max(scaleFactor, 0.7), 1.3);
  return Math.round(clamped * size);
};

const verticalScale = (size) => {
  const scaleFactor = SCREEN_HEIGHT / BASE_HEIGHT;
  const clamped = Math.min(Math.max(scaleFactor, 0.7), 1.3);
  return Math.round(clamped * size);
};

const moderateScale = (size, factor = 0.5) => {
  return Math.round(size + (scale(size) - size) * factor);
};

const fontScale = (size) => {
  const scaleFactor = Math.min(
    SCREEN_WIDTH / BASE_WIDTH,
    SCREEN_HEIGHT / BASE_HEIGHT
  );
  const clamped = Math.min(Math.max(scaleFactor, 0.7), 1.3);
  return Math.round(size * clamped / PixelRatio.getFontScale());
};

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

export default function Profile() {
  const router = useRouter();
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

      if (editName.trim() !== userDisplayName) {
        await updateProfile(currentUser, {
          displayName: editName.trim(),
        });
        setUserDisplayName(editName.trim());
        console.log('✅ Display name updated in Firebase Auth');
      }

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
              router.replace('/(auth)/Welcome');
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
      style={styles.historyItem}
      onPress={() => {
        addToReadingHistory({ id: item.id, title: item.title, image: item.image, channelName: item.channelName, type: 'article' });
        router.push(`/(viewer)/ArticleDetails?id=${item.id}`);
      }}
      activeOpacity={0.7}
    >
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.historyImage} />
      )}
      <View style={styles.historyContent}>
        <Text style={styles.historyTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.historyMeta}>
          {item.channelName || 'Unknown'} • {new Date(item.timestamp || Date.now()).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveSaved(item.id)}
        activeOpacity={0.7}
      >
        <Ionicons name="close-circle" size={moderateScale(22)} color="#C8001A" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => {
        router.push(
          item.type === 'video' ? `/(viewer)/VideoPlayer?id=${item.id}` : `/(viewer)/ArticleDetails?id=${item.id}`
        );
      }}
      activeOpacity={0.7}
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
        <Text style={styles.historyTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.historyMeta}>
          {item.channelName || 'Unknown'} • {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderChannelItem = ({ item }) => (
    <TouchableOpacity
      style={styles.channelItem}
      onPress={() => {
        router.push(`/(viewer)/ChannelDetails?id=${item.id}`);
      }}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.logo || 'https://via.placeholder.com/50' }} style={styles.channelLogo} />
      <Text style={styles.channelName} numberOfLines={1}>
        {item.name}
      </Text>
      <TouchableOpacity
        style={styles.unsubscribeButton}
        onPress={() => handleUnsubscribe(item.id)}
        activeOpacity={0.7}
      >
        <Ionicons name="close-circle" size={moderateScale(20)} color="#C8001A" />
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
  ];

  const styles = createStyles();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#C8001A"
            colors={["#C8001A"]}
          />
        }
        bounces={true}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.profileInitialsLarge}>
            <Text style={styles.initialsTextLarge}>
              {getInitials(userDisplayName || user?.displayName)}
            </Text>
          </View>
          <Text style={styles.userName}>
            {userDisplayName || user?.displayName || 'User'}
          </Text>
          <Text style={styles.userEmail}>
            {userEmail || user?.email}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Viewer</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {subscribedChannels.length}
            </Text>
            <Text style={styles.statLabel}>Subscriptions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {savedArticles.length}
            </Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {readingHistory.length}
            </Text>
            <Text style={styles.statLabel}>History</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon} size={moderateScale(22)} color="#666" />
                <Text style={styles.menuTitle}>
                  {item.title}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={moderateScale(20)} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {['saved', 'history', 'subscriptions'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
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
                <Ionicons name="bookmark-outline" size={moderateScale(50)} color="#CCC" />
                <Text style={styles.emptyText}>
                  No saved articles yet
                </Text>
                <Text style={styles.emptySubText}>
                  Save articles by tapping the bookmark icon
                </Text>
              </View>
            )
          )}

          {activeTab === 'history' && (
            readingHistory.length > 0 ? (
              <>
                <TouchableOpacity style={styles.clearHistoryBtn} onPress={handleClearHistory} activeOpacity={0.7}>
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
                <Ionicons name="time-outline" size={moderateScale(50)} color="#CCC" />
                <Text style={styles.emptyText}>
                  No reading history yet
                </Text>
                <Text style={styles.emptySubText}>
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
                <Ionicons name="people-outline" size={moderateScale(50)} color="#CCC" />
                <Text style={styles.emptyText}>
                  No subscriptions yet
                </Text>
                <Text style={styles.emptySubText}>
                  Subscribe to channels to see them here
                </Text>
              </View>
            )
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={moderateScale(22)} color="#C8001A" />
          <Text style={styles.logoutText}>
            {isLoading ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>
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
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsEditing(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={moderateScale(24)} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor="#999"
              />

              <Text style={[styles.inputLabel, { marginTop: verticalScale(16) }]}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {(showPasswordField || editEmail !== userEmail) && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: verticalScale(16) }]}>
                    Current Password
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={editPassword}
                    onChangeText={setEditPassword}
                    placeholder="Enter current password"
                    placeholderTextColor="#999"
                    secureTextEntry
                  />
                  <Text style={styles.passwordHint}>
                    Password required to change email address
                  </Text>
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsEditing(false);
                    setShowPasswordField(false);
                    setEditPassword('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                  onPress={handleSaveProfile}
                  disabled={isLoading}
                  activeOpacity={0.8}
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
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={moderateScale(24)} color="#333" />
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
                  ]}
                  onPress={() => handleLanguageChange(item.code)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.languageFlag}>{item.flag}</Text>
                  <Text style={styles.languageName}>
                    {item.name}
                  </Text>
                  {selectedLanguage === item.code && (
                    <Ionicons name="checkmark-circle" size={moderateScale(22)} color="#C8001A" />
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFF',
    alignItems: 'center',
    paddingVertical: verticalScale(24),
    paddingHorizontal: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  profileInitialsLarge: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: '#C8001A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  initialsTextLarge: {
    color: '#FFF',
    fontSize: fontScale(28),
    fontWeight: 'bold',
  },
  userName: {
    fontSize: fontScale(22),
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: fontScale(14),
    color: '#888',
    marginTop: verticalScale(2),
  },
  roleBadge: {
    backgroundColor: '#FFF0F2',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(4),
    borderRadius: scale(12),
    marginTop: verticalScale(8),
  },
  roleText: {
    color: '#C8001A',
    fontSize: fontScale(12),
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: verticalScale(16),
    marginTop: verticalScale(12),
    marginHorizontal: scale(16),
    borderRadius: scale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.05,
    shadowRadius: scale(4),
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: fontScale(20),
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: fontScale(12),
    color: '#888',
    marginTop: verticalScale(2),
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  menuContainer: {
    backgroundColor: '#FFF',
    marginTop: verticalScale(16),
    marginHorizontal: scale(16),
    borderRadius: scale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.05,
    shadowRadius: scale(4),
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: verticalScale(50),
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  menuTitle: {
    fontSize: fontScale(16),
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginTop: verticalScale(16),
    marginHorizontal: scale(16),
    borderRadius: scale(12),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.05,
    shadowRadius: scale(4),
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    minHeight: verticalScale(44),
  },
  tabActive: {
    borderBottomWidth: verticalScale(3),
    borderBottomColor: '#C8001A',
  },
  tabText: {
    fontSize: fontScale(14),
    fontWeight: '500',
    color: '#888',
  },
  tabTextActive: {
    color: '#C8001A',
  },
  tabContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(20),
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: scale(10),
    marginBottom: verticalScale(10),
    padding: scale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(1) },
    shadowOpacity: 0.05,
    shadowRadius: scale(2),
    elevation: 1,
  },
  historyImage: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(8),
    marginRight: scale(12),
  },
  historyContent: {
    flex: 1,
    justifyContent: 'center',
  },
  historyTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: scale(4),
    backgroundColor: '#FFF0F2',
    marginBottom: verticalScale(4),
  },
  historyTypeText: {
    fontSize: fontScale(10),
    fontWeight: '600',
    color: '#C8001A',
  },
  historyTitle: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: verticalScale(2),
  },
  historyMeta: {
    fontSize: fontScale(11),
    color: '#888',
  },
  removeButton: {
    padding: scale(4),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(40),
    paddingHorizontal: scale(16),
  },
  emptyText: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: '#888',
    marginTop: verticalScale(12),
  },
  emptySubText: {
    fontSize: fontScale(13),
    color: '#AAA',
    marginTop: verticalScale(4),
    textAlign: 'center',
  },
  channelGrid: {
    justifyContent: 'space-between',
  },
  channelItem: {
    backgroundColor: '#FFF',
    borderRadius: scale(10),
    padding: scale(12),
    alignItems: 'center',
    width: '48%',
    marginBottom: verticalScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(1) },
    shadowOpacity: 0.05,
    shadowRadius: scale(2),
    elevation: 1,
    position: 'relative',
  },
  channelLogo: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    marginBottom: verticalScale(8),
  },
  channelName: {
    fontSize: fontScale(12),
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  unsubscribeButton: {
    position: 'absolute',
    top: scale(4),
    right: scale(4),
  },
  clearHistoryBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    marginBottom: verticalScale(8),
  },
  clearHistoryText: {
    color: '#C8001A',
    fontSize: fontScale(13),
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    marginTop: verticalScale(16),
    marginHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    borderRadius: scale(12),
    gap: scale(8),
    borderWidth: 1,
    borderColor: '#C8001A',
    minHeight: verticalScale(50),
  },
  logoutText: {
    color: '#C8001A',
    fontSize: fontScale(16),
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    color: '#CCC',
    fontSize: fontScale(12),
    marginTop: verticalScale(20),
    marginBottom: verticalScale(30),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    minHeight: verticalScale(300),
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: verticalScale(56),
  },
  modalTitle: {
    fontSize: fontScale(18),
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: scale(20),
  },
  inputLabel: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: verticalScale(8),
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scale(10),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    fontSize: fontScale(16),
    color: '#333',
    minHeight: verticalScale(48),
  },
  saveButton: {
    backgroundColor: '#C8001A',
    paddingVertical: verticalScale(14),
    borderRadius: scale(10),
    alignItems: 'center',
    flex: 1,
    marginLeft: scale(10),
    minHeight: verticalScale(48),
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: fontScale(16),
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: verticalScale(20),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: verticalScale(14),
    borderRadius: scale(10),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: scale(10),
    minHeight: verticalScale(48),
  },
  cancelButtonText: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: '#666',
  },
  passwordHint: {
    fontSize: fontScale(12),
    color: '#888',
    marginTop: verticalScale(4),
    marginLeft: scale(4),
  },
  languageList: {
    paddingHorizontal: scale(20),
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(14),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingHorizontal: scale(4),
    minHeight: verticalScale(50),
  },
  languageItemSelected: {
    backgroundColor: '#FFF0F2',
  },
  languageFlag: {
    fontSize: fontScale(24),
    marginRight: scale(12),
  },
  languageName: {
    flex: 1,
    fontSize: fontScale(16),
    color: '#333',
  },
});