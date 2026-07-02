import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { startLiveStream } from '../../services/liveService';
import Loader from '../../components/Loader';

export default function GoLive({ navigation }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: 'en',
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [errors, setErrors] = useState({});

  const pickThumbnail = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setThumbnail(result.assets[0]);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Stream title is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartLive = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const liveData = {
        ...formData,
        channelId: user.uid,
        thumbnail: thumbnail,
      };
      await startLiveStream(liveData);
      setIsLive(true);
      Alert.alert(
        'Live!',
        'Your stream has started successfully!',
        [
          {
            text: 'End Stream',
            style: 'destructive',
            onPress: () => {
              setIsLive(false);
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to start live stream');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndLive = () => {
    Alert.alert(
      'End Live Stream',
      'Are you sure you want to end the live stream?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Stream',
          style: 'destructive',
          onPress: () => {
            setIsLive(false);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <Loader message="Starting live stream..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Go Live</Text>
          {isLive ? (
            <TouchableOpacity onPress={handleEndLive}>
              <Text style={styles.endLiveText}>End Stream</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleStartLive}>
              <Text style={styles.goLiveText}>Go Live</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {isLive ? (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
              <Text style={styles.liveStatus}>You are currently live</Text>
            </View>
          ) : (
            <>
              {/* Thumbnail */}
              <TouchableOpacity style={styles.thumbnailUpload} onPress={pickThumbnail}>
                {thumbnail ? (
                  <Image source={{ uri: thumbnail.uri }} style={styles.thumbnailPreview} />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="image-outline" size={40} color="#888" />
                    <Text style={styles.uploadText}>Add Stream Thumbnail</Text>
                    <Text style={styles.uploadSubtext}>16:9 image recommended</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Title */}
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.titleInput, errors.title && styles.inputError]}
                  placeholder="Stream Title"
                  value={formData.title}
                  onChangeText={(text) => {
                    setFormData({ ...formData, title: text });
                    setErrors({ ...errors, title: null });
                  }}
                  placeholderTextColor="#999"
                />
                {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Stream Description"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Info Cards */}
              <View style={styles.infoCards}>
                <View style={styles.infoCard}>
                  <Ionicons name="people-outline" size={24} color="#4ECDC4" />
                  <View>
                    <Text style={styles.infoCardTitle}>Viewers</Text>
                    <Text style={styles.infoCardValue}>0</Text>
                  </View>
                </View>
                <View style={styles.infoCard}>
                  <Ionicons name="time-outline" size={24} color="#FF6B6B" />
                  <View>
                    <Text style={styles.infoCardTitle}>Duration</Text>
                    <Text style={styles.infoCardValue}>00:00</Text>
                  </View>
                </View>
              </View>

              <View style={styles.tipsContainer}>
                <Ionicons name="bulb-outline" size={20} color="#FF6B6B" />
                <Text style={styles.tipsText}>
                  Tip: Make sure you have a stable internet connection before going live
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  keyboardView: {
    flex: 1,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  goLiveText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  endLiveText: {
    color: '#FF0000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  liveIndicator: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  liveDot: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF0000',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  liveText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  liveStatus: {
    fontSize: 16,
    color: '#888',
  },
  thumbnailUpload: {
    width: '100%',
    height: 200,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  thumbnailPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#CCC',
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 8,
  },
  descriptionInput: {
    fontSize: 15,
    color: '#666',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 8,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginBottom: 8,
  },
  infoCards: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoCardTitle: {
    fontSize: 12,
    color: '#888',
  },
  infoCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tipsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F5',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  tipsText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});