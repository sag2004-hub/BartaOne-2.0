import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';

export default function Settings({ navigation }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    autoPlay: true,
    saveData: false,
    language: 'English',
    location: 'All',
  });

  const toggleSetting = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const settingsSections = [
    {
      title: 'Preferences',
      items: [
        {
          id: 'darkMode',
          label: 'Dark Mode',
          icon: 'moon-outline',
          type: 'switch',
          value: settings.darkMode,
        },
        {
          id: 'notifications',
          label: 'Push Notifications',
          icon: 'notifications-outline',
          type: 'switch',
          value: settings.notifications,
        },
        {
          id: 'autoPlay',
          label: 'Auto-Play Videos',
          icon: 'play-outline',
          type: 'switch',
          value: settings.autoPlay,
        },
        {
          id: 'saveData',
          label: 'Save Data Mode',
          icon: 'save-outline',
          type: 'switch',
          value: settings.saveData,
        },
      ],
    },
    {
      title: 'Content',
      items: [
        {
          id: 'language',
          label: 'Language',
          icon: 'language-outline',
          type: 'select',
          value: settings.language,
          onPress: () => Alert.alert('Coming Soon', 'Language selection coming soon!'),
        },
        {
          id: 'location',
          label: 'Location',
          icon: 'location-outline',
          type: 'select',
          value: settings.location,
          onPress: () => Alert.alert('Coming Soon', 'Location selection coming soon!'),
        },
        {
          id: 'region',
          label: 'Region',
          icon: 'map-outline',
          type: 'select',
          value: 'Global',
          onPress: () => Alert.alert('Coming Soon', 'Region selection coming soon!'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          label: 'Help Center',
          icon: 'help-circle-outline',
          type: 'link',
          onPress: () => Alert.alert('Coming Soon', 'Help Center coming soon!'),
        },
        {
          id: 'feedback',
          label: 'Send Feedback',
          icon: 'chatbubble-outline',
          type: 'link',
          onPress: () => Alert.alert('Coming Soon', 'Feedback feature coming soon!'),
        },
        {
          id: 'privacy',
          label: 'Privacy Policy',
          icon: 'shield-outline',
          type: 'link',
          onPress: () => Alert.alert('Privacy Policy', 'View our privacy policy here.'),
        },
        {
          id: 'terms',
          label: 'Terms of Service',
          icon: 'document-outline',
          type: 'link',
          onPress: () => Alert.alert('Terms of Service', 'View our terms of service here.'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Summary */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View>
              <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => Alert.alert('Coming Soon', 'Edit profile coming soon!')}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item) => (
                <View key={item.id}>
                  <TouchableOpacity
                    style={styles.settingItem}
                    onPress={item.onPress || (() => toggleSetting(item.id))}
                    disabled={item.type === 'switch'}
                  >
                    <View style={styles.settingLeft}>
                      <Ionicons name={item.icon} size={22} color="#666" />
                      <Text style={styles.settingLabel}>{item.label}</Text>
                    </View>
                    {item.type === 'switch' ? (
                      <Switch
                        value={item.value}
                        onValueChange={() => toggleSetting(item.id)}
                        trackColor={{ false: '#E0E0E0', true: '#FF6B6B' }}
                        thumbColor={item.value ? '#FFF' : '#FFF'}
                      />
                    ) : item.type === 'select' ? (
                      <View style={styles.selectValue}>
                        <Text style={styles.selectText}>{item.value}</Text>
                        <Ionicons name="chevron-forward" size={18} color="#CCC" />
                      </View>
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.clearCacheButton}
          onPress={() => Alert.alert('Success', 'Cache cleared successfully!')}
        >
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
          <Text style={styles.clearCacheText}>Clear Cache</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>BartaOne v1.0.0</Text>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  profileCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  profileEmail: {
    fontSize: 12,
    color: '#888',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  editButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    marginLeft: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  selectValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectText: {
    fontSize: 14,
    color: '#888',
  },
  clearCacheButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    marginTop: 8,
  },
  clearCacheText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '500',
  },
  versionText: {
    textAlign: 'center',
    color: '#CCC',
    fontSize: 12,
    marginTop: 20,
    marginBottom: 30,
  },
});