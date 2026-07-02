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
import * as VideoPicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { uploadVideo } from '../../services/videoService';
import Loader from '../../components/Loader';

export default function UploadVideo({ navigation }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'news',
    language: 'en',
  });
  const [video, setVideo] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [errors, setErrors] = useState({});

  const categories = [
    { label: 'News', value: 'news' },
    { label: 'Entertainment', value: 'entertainment' },
    { label: 'Sports', value: 'sports' },
    { label: 'Business', value: 'business' },
    { label: 'Technology', value: 'technology' },
    { label: 'Lifestyle', value: 'lifestyle' },
    { label: 'Other', value: 'other' },
  ];

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your videos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setVideo(result.assets[0]);
    }
  };

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
      newErrors.title = 'Title is required';
    }
    if (!video) {
      newErrors.video = 'Please select a video';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const videoData = {
        ...formData,
        channelId: user.uid,
        video: video,
        thumbnail: thumbnail,
      };
      await uploadVideo(videoData);
      Alert.alert(
        'Success!',
        'Your video has been uploaded successfully!',
        [
          {
            text: 'View Videos',
            onPress: () => navigation.navigate('ManagePosts'),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'news',
        language: 'en',
      });
      setVideo(null);
      setThumbnail(null);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to upload video');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loader message="Uploading video..." />;
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
          <Text style={styles.headerTitle}>Upload Video</Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text style={styles.uploadText}>Upload</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {/* Video Upload */}
          <TouchableOpacity style={styles.videoUpload} onPress={pickVideo}>
            {video ? (
              <View style={styles.videoPreview}>
                <Ionicons name="videocam" size={48} color="#FFF" />
                <Text style={styles.videoName}>{video.fileName || 'Video selected'}</Text>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="cloud-upload-outline" size={48} color="#888" />
                <Text style={styles.uploadTitle}>Select Video</Text>
                <Text style={styles.uploadSubtext}>MP4, MOV, AVI supported</Text>
              </View>
            )}
          </TouchableOpacity>
          {errors.video && <Text style={styles.errorText}>{errors.video}</Text>}

          {/* Thumbnail Upload */}
          <TouchableOpacity style={styles.thumbnailUpload} onPress={pickThumbnail}>
            {thumbnail ? (
              <Image source={{ uri: thumbnail.uri }} style={styles.thumbnailPreview} />
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <Ionicons name="image-outline" size={24} color="#888" />
                <Text style={styles.thumbnailText}>Add Thumbnail</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Title */}
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.titleInput, errors.title && styles.inputError]}
              placeholder="Video Title"
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
              placeholder="Video Description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.pickerOption,
                    formData.category === cat.value && styles.pickerOptionSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, category: cat.value })}
                >
                  <Text
                    style={[
                      styles.pickerText,
                      formData.category === cat.value && styles.pickerTextSelected,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
  uploadText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  videoUpload: {
    width: '100%',
    height: 200,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  videoPreview: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  videoName: {
    color: '#FFF',
    fontSize: 14,
    marginTop: 8,
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#CCC',
    marginTop: 4,
  },
  thumbnailUpload: {
    width: '100%',
    height: 120,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  thumbnailPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailText: {
    fontSize: 14,
    color: '#888',
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  pickerOptionSelected: {
    backgroundColor: '#FF6B6B',
  },
  pickerText: {
    fontSize: 14,
    color: '#666',
  },
  pickerTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
});