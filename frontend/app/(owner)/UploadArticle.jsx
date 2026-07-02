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
import { createArticle } from '../../services/articleService';
import Loader from '../../components/Loader';

export default function UploadArticle({ navigation }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    body: '',
    category: 'news',
    language: 'en',
  });
  const [image, setImage] = useState(null);
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

  const pickImage = async () => {
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
      setImage(result.assets[0]);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.body.trim()) {
      newErrors.body = 'Content is required';
    }
    if (!formData.summary.trim()) {
      newErrors.summary = 'Summary is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const articleData = {
        ...formData,
        channelId: user.uid, // Will be replaced with actual channel ID
        image: image,
      };
      await createArticle(articleData);
      Alert.alert(
        'Success!',
        'Your article has been published successfully!',
        [
          {
            text: 'View Article',
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
        summary: '',
        body: '',
        category: 'news',
        language: 'en',
      });
      setImage(null);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to publish article');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loader message="Publishing article..." />;
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
          <Text style={styles.headerTitle}>Write Article</Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text style={styles.publishText}>Publish</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {/* Title */}
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.titleInput, errors.title && styles.inputError]}
              placeholder="Article Title"
              value={formData.title}
              onChangeText={(text) => {
                setFormData({ ...formData, title: text });
                setErrors({ ...errors, title: null });
              }}
              placeholderTextColor="#999"
              multiline
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          {/* Image Upload */}
          <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.imagePreview} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="image-outline" size={40} color="#888" />
                <Text style={styles.uploadText}>Add Cover Image</Text>
                <Text style={styles.uploadSubtext}>16:9 image recommended</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Summary */}
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.summaryInput, errors.summary && styles.inputError]}
              placeholder="Article Summary"
              value={formData.summary}
              onChangeText={(text) => {
                setFormData({ ...formData, summary: text });
                setErrors({ ...errors, summary: null });
              }}
              placeholderTextColor="#999"
              multiline
              numberOfLines={2}
            />
            {errors.summary && <Text style={styles.errorText}>{errors.summary}</Text>}
          </View>

          {/* Body */}
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.bodyInput, errors.body && styles.inputError]}
              placeholder="Write your article content here..."
              value={formData.body}
              onChangeText={(text) => {
                setFormData({ ...formData, body: text });
                setErrors({ ...errors, body: null });
              }}
              placeholderTextColor="#999"
              multiline
              numberOfLines={12}
            />
            {errors.body && <Text style={styles.errorText}>{errors.body}</Text>}
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

          {/* Word Count */}
          <View style={styles.wordCount}>
            <Text style={styles.wordCountText}>
              {formData.body.split(/\s+/).filter(Boolean).length} words
            </Text>
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
  publishText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    paddingVertical: 8,
  },
  summaryInput: {
    fontSize: 16,
    color: '#666',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  bodyInput: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
    lineHeight: 24,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
  },
  imageUpload: {
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
  imagePreview: {
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
  wordCount: {
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 20,
  },
  wordCountText: {
    color: '#888',
    fontSize: 12,
  },
});