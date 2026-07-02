import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { getChannelByOwner, updateChannel } from '../../services/channelService';
import Loader from '../../components/Loader';

export default function OwnerProfile({ navigation }) {
  const { user } = useAuth();
  const [channel, setChannel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedChannel, setEditedChannel] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadChannel();
  }, []);

  const loadChannel = async () => {
    setIsLoading(true);
    try {
      const data = await getChannelByOwner(user.uid);
      setChannel(data);
      setEditedChannel(data || {});
    } catch (error) {
      console.error('Error loading channel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateChannel(channel._id, editedChannel);
      setChannel(editedChannel);
      setIsEditing(false);
      Alert.alert('Success', 'Channel updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update channel');
    } finally {
      setIsSaving(false);
    }
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
            try {
              await signOut(auth);
              navigation.replace('Welcome');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <Loader message="Loading profile..." />;
  }

  if (!channel) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Channel not found</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateChannel')}
          >
            <Text style={styles.createButtonText}>Create Channel</Text>
          </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Channel Profile</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Text style={styles.editText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        {/* Channel Banner */}
        <Image
          source={{ uri: channel.banner || 'https://via.placeholder.com/800x200' }}
          style={styles.banner}
        />

        {/* Channel Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: channel.logo || 'https://via.placeholder.com/100' }}
            style={styles.logo}
          />
          {isEditing && (
            <TouchableOpacity style={styles.changePhotoButton}>
              <Ionicons name="camera" size={20} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Channel Info */}
        <View style={styles.infoContainer}>
          {isEditing ? (
            // Edit Mode
            <View>
              <View style={styles.editField}>
                <Text style={styles.editLabel}>Channel Name</Text>
                <TextInput
                  style={styles.editInput}
                  value={editedChannel.channelName}
                  onChangeText={(text) =>
                    setEditedChannel({ ...editedChannel, channelName: text })
                  }
                />
              </View>
              <View style={styles.editField}>
                <Text style={styles.editLabel}>Description</Text>
                <TextInput
                  style={[styles.editInput, styles.editTextArea]}
                  value={editedChannel.description}
                  onChangeText={(text) =>
                    setEditedChannel({ ...editedChannel, description: text })
                  }
                  multiline
                  numberOfLines={3}
                />
              </View>
              <View style={styles.editField}>
                <Text style={styles.editLabel}>Language</Text>
                <TextInput
                  style={styles.editInput}
                  value={editedChannel.language}
                  onChangeText={(text) =>
                    setEditedChannel({ ...editedChannel, language: text })
                  }
                />
              </View>
              <View style={styles.editField}>
                <Text style={styles.editLabel}>Location</Text>
                <TextInput
                  style={styles.editInput}
                  value={`${editedChannel.location?.city || ''}, ${editedChannel.location?.district || ''}, ${editedChannel.location?.state || ''}`}
                  onChangeText={(text) => {
                    const parts = text.split(',').map(s => s.trim());
                    setEditedChannel({
                      ...editedChannel,
                      location: {
                        city: parts[0] || '',
                        district: parts[1] || '',
                        state: parts[2] || '',
                        area: parts[3] || '',
                      },
                    });
                  }}
                />
              </View>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={isSaving}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            // View Mode
            <>
              <Text style={styles.channelName}>{channel.channelName}</Text>
              <View style={styles.verifiedContainer}>
                {channel.isVerified && (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color="#4ECDC4" />
                    <Text style={styles.verifiedText}>Verified Channel</Text>
                  </>
                )}
              </View>
              <Text style={styles.description}>{channel.description}</Text>
              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <Ionicons name="language-outline" size={20} color="#888" />
                  <Text style={styles.detailText}>
                    {channel.language || 'English'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={20} color="#888" />
                  <Text style={styles.detailText}>
                    {channel.location?.city || 'N/A'}, {channel.location?.district || ''}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="people-outline" size={20} color="#888" />
                  <Text style={styles.detailText}>
                    {channel.followers || 0} followers
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={22} color="#FF6B6B" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </>
          )}
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  editText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '500',
  },
  banner: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B6B',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  infoContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  channelName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  verifiedContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  verifiedText: {
    color: '#4ECDC4',
    fontSize: 14,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginTop: 12,
    textAlign: 'center',
  },
  detailsContainer: {
    marginTop: 16,
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  editField: {
    marginBottom: 16,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  editTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 16,
  },
  logoutText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#888',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});