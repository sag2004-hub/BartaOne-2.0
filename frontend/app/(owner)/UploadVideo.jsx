// app/(owner)/UploadVideo.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Image,
  useColorScheme,
  Dimensions,
  PixelRatio,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { createVideo, updateVideo, getVideoById } from '../../services/videoService';
import { getChannelByOwner } from '../../services/channelService';
import Loader from '../../components/Loader';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width: SW, height: SH } = Dimensions.get('window');
const BASE_W = 390;
const scale = (n) => Math.round((SW / BASE_W) * n);
const vs = (n) => Math.round((SH / 844) * n);
const sp = (n) => n / PixelRatio.getFontScale();

// ─── Theme ───────────────────────────────────────────────────────────────────
const LIGHT = {
  bg:               '#F2F0EB',
  surface:          '#FFFFFF',
  surfaceAlt:       '#FAFAF8',
  border:           '#E4E0D8',
  accent:           '#C8001A',
  accentBg:         '#FFF0F2',
  accentBorder:     'rgba(200,0,26,0.18)',
  navy:             '#0F1923',
  primary:          '#1A2733',
  secondary:        '#4A5A6B',
  muted:            '#8A97A5',
  faint:            '#B8C0B8',
  white:            '#FFFFFF',
  statusBar:        'dark-content',
  inputBg:          '#FAFAF8',
  inputBorder:      '#E4E0D8',
  inputFocusBorder: '#C8001A',
  cardShadowOpacity: 0.06,
  placeholder:      '#B8C0C8',
  iconBlue:         '#1A6DC8',
  iconBlueBg:       '#EFF5FF',
  iconGreen:        '#0E8A5A',
  iconGreenBg:      '#EDFAF3',
  iconPurple:       '#7C3AED',
  iconPurpleBg:     '#F5F0FF',
  iconAmber:        '#B87500',
  iconAmberBg:      '#FFF7E8',
};

const DARK = {
  bg:               '#0D1117',
  surface:          '#161B22',
  surfaceAlt:       '#1C2330',
  border:           '#2A3340',
  accent:           '#E8192C',
  accentBg:         'rgba(232,25,44,0.12)',
  accentBorder:     'rgba(232,25,44,0.25)',
  navy:             '#E8EDF2',
  primary:          '#EDF2F7',
  secondary:        '#8B9BAB',
  muted:            '#5C6E80',
  faint:            '#3A4A58',
  white:            '#FFFFFF',
  statusBar:        'light-content',
  inputBg:          '#1C2330',
  inputBorder:      '#2A3340',
  inputFocusBorder: '#E8192C',
  cardShadowOpacity: 0.35,
  placeholder:      '#5C6E80',
  iconBlue:         '#60A5FA',
  iconBlueBg:       'rgba(96,165,250,0.12)',
  iconGreen:        '#34D399',
  iconGreenBg:      'rgba(52,211,153,0.12)',
  iconPurple:       '#A78BFA',
  iconPurpleBg:     'rgba(167,139,250,0.12)',
  iconAmber:        '#FBBF24',
  iconAmberBg:      'rgba(251,191,36,0.12)',
};

export default function UploadVideo() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { user } = useAuth();
  
  // States
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChannel, setIsLoadingChannel] = useState(true);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [videoId, setVideoId] = useState(null);
  const [channelId, setChannelId] = useState(null);
  const [channelData, setChannelData] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'sports',
    language: 'en',
    isChildFriendly: true,
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [existingThumbnail, setExistingThumbnail] = useState(null);
  const [errors, setErrors] = useState({});
  const [focusedInput, setFocusedInput] = useState(null);

  // Refs for focus management
  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  const categories = [
    { label: 'Sports', value: 'sports', icon: 'basketball-outline' },
    { label: 'News', value: 'news', icon: 'newspaper-outline' },
    { label: 'Entertainment', value: 'entertainment', icon: 'film-outline' },
    { label: 'Business', value: 'business', icon: 'business-outline' },
    { label: 'Technology', value: 'technology', icon: 'hardware-chip-outline' },
    { label: 'Lifestyle', value: 'lifestyle', icon: 'leaf-outline' },
    { label: 'Other', value: 'other', icon: 'ellipsis-horizontal-outline' },
  ];

  // ─── Check if editing ──────────────────────────────────────────────────────
  useEffect(() => {
    if (params.edit) {
      setIsEditing(true);
      setVideoId(params.edit);
      loadVideoData(params.edit);
    }
  }, [params.edit]);

  // ─── Load Channel ID ──────────────────────────────────────────────────────
  useEffect(() => {
    loadChannelId();
  }, []);

  const loadChannelId = async () => {
    setIsLoadingChannel(true);
    try {
      console.log('📡 Loading channel for owner...');
      const channel = await getChannelByOwner();
      console.log('📡 Channel response:', channel);
      
      if (channel && channel._id) {
        setChannelId(channel._id);
        setChannelData(channel);
        console.log('✅ Channel ID loaded:', channel._id);
        console.log('✅ Channel name:', channel.channelName);
      } else {
        console.error('❌ No channel found or missing _id');
        Alert.alert(
          'No Channel Found',
          'Please create a channel before uploading videos.',
          [
            {
              text: 'Create Channel',
              onPress: () => router.push('/(owner)/CreateChannel'),
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error loading channel:', error);
      Alert.alert('Error', 'Failed to load channel information. Please try again.');
    } finally {
      setIsLoadingChannel(false);
    }
  };

  // ─── Load Video Data for Editing ──────────────────────────────────────────
  const loadVideoData = async (id) => {
    try {
      setIsLoadingVideo(true);
      console.log('📡 Loading video for editing:', id);
      
      const response = await getVideoById(id);
      console.log('📡 Video response:', response);
      
      let video = response;
      if (response && response.data) {
        video = response.data;
      }
      
      if (video) {
        setFormData({
          title: video.title || '',
          description: video.description || '',
          category: video.category || 'sports',
          language: video.language || 'en',
          isChildFriendly: video.isChildFriendly !== undefined ? video.isChildFriendly : true,
        });
        
        if (video.thumbnail) {
          setExistingThumbnail(video.thumbnail);
        }
        
        console.log('✅ Video loaded successfully');
      } else {
        console.error('❌ No video data found');
        Alert.alert('Error', 'Failed to load video data');
      }
    } catch (error) {
      console.error('❌ Error loading video:', error);
      Alert.alert('Error', 'Failed to load video data. Please try again.');
    } finally {
      setIsLoadingVideo(false);
    }
  };

  // ─── Reset Form ──────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'sports',
      language: 'en',
      isChildFriendly: true,
    });
    setVideoFile(null);
    setThumbnail(null);
    setExistingThumbnail(null);
    setErrors({});
  };

  // ─── Pick Video ────────────────────────────────────────────────────────────
  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your videos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setVideoFile(asset);
      setErrors({ ...errors, video: null });
      console.log('📤 Video selected:', asset.fileName, 'Size:', asset.fileSize);
    }
  };

  // ─── Pick Thumbnail ────────────────────────────────────────────────────────
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
      const asset = result.assets[0];
      setThumbnail(asset);
      setExistingThumbnail(null);
      console.log('📤 Thumbnail selected:', asset.fileName);
    }
  };

  // ─── Validation ────────────────────────────────────────────────────────────
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!videoFile && !isEditing) {
      newErrors.video = 'Please select a video';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Navigation Helpers ──────────────────────────────────────────────────
  const goToManagePosts = () => {
    try {
      router.push('/(owner)/ManagePosts');
    } catch (error) {
      console.error('Navigation to ManagePosts failed:', error);
      try {
        router.push('/(owner)');
      } catch (e) {
        console.error('Fallback navigation failed:', e);
      }
    }
  };

  const goBack = () => {
    try {
      router.back();
    } catch (error) {
      console.error('Navigation back failed:', error);
      try {
        router.push('/(owner)');
      } catch (e) {
        console.error('Fallback navigation failed:', e);
      }
    }
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!channelId) {
      Alert.alert('Error', 'Channel not found. Please create a channel first.');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare form data for multipart upload
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('category', formData.category);
      formDataToSend.append('language', formData.language);
      formDataToSend.append('isChildFriendly', String(formData.isChildFriendly));
      formDataToSend.append('channelId', channelId);

      // ─── FIXED: Add video file ─────────────────────────────────────────────
      if (videoFile) {
        // Get the file name from the URI
        const uriParts = videoFile.uri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        
        // Create a proper file object for FormData
        const videoFileObj = {
          uri: videoFile.uri,
          name: videoFile.fileName || fileName || `video-${Date.now()}.mp4`,
          type: videoFile.mimeType || 'video/mp4',
        };
        
        formDataToSend.append('video', videoFileObj);
        console.log('📤 Video file attached:', videoFileObj.name);
        console.log('📤 Video URI:', videoFileObj.uri);
        console.log('📤 Video type:', videoFileObj.type);
      }

      // ─── Add thumbnail if present ──────────────────────────────────────────
      if (thumbnail) {
        const uriParts = thumbnail.uri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        
        const thumbnailFileObj = {
          uri: thumbnail.uri,
          name: thumbnail.fileName || fileName || `thumbnail-${Date.now()}.jpg`,
          type: thumbnail.mimeType || 'image/jpeg',
        };
        formDataToSend.append('thumbnail', thumbnailFileObj);
        console.log('📤 Thumbnail attached:', thumbnailFileObj.name);
      } else if (existingThumbnail && isEditing) {
        // Keep existing thumbnail
        formDataToSend.append('keepExistingThumbnail', 'true');
        console.log('📤 Keeping existing thumbnail');
      }

      console.log('📤 FormData prepared for upload');

      let response;
      if (isEditing && videoId) {
        console.log('📤 Updating video:', videoId);
        response = await updateVideo(videoId, formDataToSend);
      } else {
        console.log('📤 Creating new video');
        response = await createVideo(formDataToSend);
      }
      
      console.log('✅ Video saved successfully:', response);

      Alert.alert(
        '🎉 Success!',
        `Your video has been ${isEditing ? 'updated' : 'uploaded'} successfully!`,
        [
          {
            text: 'View Videos',
            onPress: () => {
              resetForm();
              goToManagePosts();
            },
          },
          {
            text: isEditing ? 'Continue Editing' : 'Upload Another',
            style: 'cancel',
            onPress: () => {
              if (!isEditing) {
                resetForm();
              }
            },
          },
        ]
      );

    } catch (error) {
      console.error('❌ Error uploading video:');
      console.error('  Message:', error.message);
      console.error('  Status:', error.status);
      console.error('  Data:', error.data);
      
      let errorMessage = `Failed to ${isEditing ? 'update' : 'upload'} video. Please try again.`;
      
      if (error.status === 400) {
        errorMessage = error.data?.message || 'Invalid video data. Please check your inputs.';
      } else if (error.status === 401) {
        errorMessage = 'Session expired. Please login again.';
      } else if (error.status === 403) {
        errorMessage = 'You don\'t have permission to upload videos.';
      } else if (error.status === 404) {
        errorMessage = 'Channel not found. Please create a channel first.';
      } else if (error.status === 409) {
        errorMessage = 'A video with this title already exists.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.status === 0) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextInput = (nextRef) => {
    nextRef.current?.focus();
  };

  const toggleChildFriendly = () => {
    setFormData({ ...formData, isChildFriendly: !formData.isChildFriendly });
  };

  const styles = makeStyles(C);

  // ─── Loading State ────────────────────────────────────────────────────────
  if (isLoadingChannel || isLoadingVideo || isLoading) {
    let message = 'Loading...';
    if (isLoadingChannel) message = 'Loading channel...';
    else if (isLoadingVideo) message = 'Loading video...';
    else if (isLoading) message = isEditing ? 'Updating video...' : 'Uploading video...';
    return <Loader message={message} />;
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.topStripe} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={goBack}
        >
          <Ionicons name="arrow-back" size={scale(24)} color={C.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.primary }]}>
          {isEditing ? 'Edit Video' : 'Upload Video'}
        </Text>
        <TouchableOpacity 
          style={[styles.uploadBtn, { backgroundColor: C.accent }]}
          onPress={handleSubmit}
        >
          <Text style={styles.uploadText}>{isEditing ? 'Update' : 'Upload'}</Text>
          <Ionicons name="cloud-upload-outline" size={scale(16)} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        style={styles.keyboardView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraHeight={Platform.OS === 'ios' ? 120 : 80}
        extraScrollHeight={Platform.OS === 'ios' ? 40 : 20}
        enableResetScrollToCoords={false}
        keyboardOpeningTime={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            {/* Video Upload */}
            {!isEditing && (
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Text style={[styles.inputLabel, { color: C.secondary }]}>Video File *</Text>
                  {errors.video && (
                    <Text style={styles.errorText}>{errors.video}</Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={[
                    styles.videoUpload, 
                    { 
                      borderColor: errors.video ? C.accent : C.border,
                      backgroundColor: C.surfaceAlt,
                    }
                  ]} 
                  onPress={pickVideo}
                  activeOpacity={0.8}
                >
                  {videoFile ? (
                    <View style={styles.videoPreview}>
                      <View style={[styles.videoIconWrap, { backgroundColor: C.accentBg }]}>
                        <Ionicons name="videocam" size={scale(32)} color={C.accent} />
                      </View>
                      <Text style={[styles.videoName, { color: C.primary }]} numberOfLines={1}>
                        {videoFile.fileName || 'Video selected'}
                      </Text>
                      <View style={[styles.videoBadge, { backgroundColor: C.accent }]}>
                        <Ionicons name="checkmark" size={scale(12)} color="#FFF" />
                        <Text style={styles.videoBadgeText}>Selected</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.uploadPlaceholder}>
                      <View style={[styles.uploadIconWrap, { backgroundColor: C.accentBg }]}>
                        <Ionicons name="cloud-upload-outline" size={scale(32)} color={C.accent} />
                      </View>
                      <Text style={[styles.uploadTitle, { color: C.secondary }]}>Select Video</Text>
                      <Text style={[styles.uploadSubtext, { color: C.muted }]}>MP4, MOV, AVI supported</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Thumbnail Upload */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: C.secondary }]}>Thumbnail</Text>
              <TouchableOpacity 
                style={[
                  styles.thumbnailUpload, 
                  { 
                    borderColor: C.border,
                    backgroundColor: C.surfaceAlt,
                  }
                ]} 
                onPress={pickThumbnail}
                activeOpacity={0.8}
              >
                {thumbnail ? (
                  <Image source={{ uri: thumbnail.uri }} style={styles.thumbnailPreview} />
                ) : existingThumbnail ? (
                  <Image source={{ uri: existingThumbnail }} style={styles.thumbnailPreview} />
                ) : (
                  <View style={styles.thumbnailPlaceholder}>
                    <Ionicons name="image-outline" size={scale(24)} color={C.muted} />
                    <Text style={[styles.thumbnailText, { color: C.muted }]}>Add Thumbnail</Text>
                    <Text style={[styles.thumbnailSubtext, { color: C.faint }]}>16:9 image recommended</Text>
                  </View>
                )}
                {(thumbnail || existingThumbnail) && (
                  <View style={styles.thumbnailOverlay}>
                    <View style={[styles.thumbnailBadge, { backgroundColor: C.accent }]}>
                      <Ionicons name="camera-outline" size={scale(12)} color="#FFF" />
                      <Text style={styles.thumbnailBadgeText}>Change</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Title */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Text style={[styles.inputLabel, { color: C.secondary }]}>Title *</Text>
                {errors.title && (
                  <Text style={styles.errorText}>{errors.title}</Text>
                )}
              </View>
              <View style={[
                styles.inputWrap,
                { 
                  borderColor: errors.title ? C.accent : (focusedInput === 'title' ? C.accent : C.inputBorder),
                  backgroundColor: C.inputBg,
                }
              ]}>
                <TextInput
                  ref={titleInputRef}
                  style={[styles.titleInput, { color: C.primary }]}
                  placeholder="Enter video title..."
                  placeholderTextColor={C.placeholder}
                  value={formData.title}
                  onChangeText={(text) => {
                    setFormData({ ...formData, title: text });
                    setErrors({ ...errors, title: null });
                  }}
                  onFocus={() => setFocusedInput('title')}
                  onBlur={() => setFocusedInput(null)}
                  returnKeyType="next"
                  onSubmitEditing={() => handleNextInput(descriptionInputRef)}
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Text style={[styles.inputLabel, { color: C.secondary }]}>Description *</Text>
                {errors.description && (
                  <Text style={styles.errorText}>{errors.description}</Text>
                )}
              </View>
              <View style={[
                styles.inputWrap,
                styles.descriptionWrap,
                { 
                  borderColor: errors.description ? C.accent : (focusedInput === 'description' ? C.accent : C.inputBorder),
                  backgroundColor: C.inputBg,
                }
              ]}>
                <TextInput
                  ref={descriptionInputRef}
                  style={[styles.descriptionInput, { color: C.primary }]}
                  placeholder="Describe your video..."
                  placeholderTextColor={C.placeholder}
                  value={formData.description}
                  onChangeText={(text) => {
                    setFormData({ ...formData, description: text });
                    setErrors({ ...errors, description: null });
                  }}
                  onFocus={() => setFocusedInput('description')}
                  onBlur={() => setFocusedInput(null)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: C.secondary }]}>Category</Text>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryOption,
                      { 
                        backgroundColor: formData.category === cat.value ? C.accent : C.surfaceAlt,
                        borderColor: formData.category === cat.value ? C.accent : C.border,
                      },
                    ]}
                    onPress={() => setFormData({ ...formData, category: cat.value })}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={cat.icon} 
                      size={scale(18)} 
                      color={formData.category === cat.value ? '#FFFFFF' : C.muted} 
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        { 
                          color: formData.category === cat.value ? '#FFFFFF' : C.secondary,
                        },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Child Friendly Toggle */}
            <View style={styles.inputGroup}>
              <View style={styles.toggleContainer}>
                <View style={styles.toggleLeft}>
                  <View style={[styles.toggleIconWrap, { backgroundColor: formData.isChildFriendly ? C.iconGreenBg : C.accentBg }]}>
                    <Ionicons 
                      name={formData.isChildFriendly ? 'people-outline' : 'warning-outline'} 
                      size={scale(20)} 
                      color={formData.isChildFriendly ? C.iconGreen : C.accent} 
                    />
                  </View>
                  <View>
                    <Text style={[styles.toggleTitle, { color: C.primary }]}>
                      {formData.isChildFriendly ? 'Child Friendly' : '18+ Content'}
                    </Text>
                    <Text style={[styles.toggleSubtext, { color: C.muted }]}>
                      {formData.isChildFriendly 
                        ? 'This video is suitable for all ages' 
                        : 'This video contains mature content'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleSwitch,
                    { 
                      backgroundColor: formData.isChildFriendly ? C.iconGreen : C.accent,
                    }
                  ]}
                  onPress={toggleChildFriendly}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.toggleThumb,
                    { 
                      transform: [{ translateX: formData.isChildFriendly ? 0 : scale(18) }],
                      backgroundColor: '#FFFFFF',
                    }
                  ]} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Video Info Stats */}
            {videoFile && (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="videocam-outline" size={scale(16)} color={C.muted} />
                  <Text style={[styles.statText, { color: C.muted }]}>
                    {videoFile.fileName || 'Video ready'}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={scale(16)} color={C.muted} />
                  <Text style={[styles.statText, { color: C.muted }]}>
                    {videoFile.duration ? `${Math.round(videoFile.duration)}s` : 'Ready'}
                  </Text>
                </View>
              </View>
            )}

            {/* Bottom Spacer */}
            <View style={styles.bottomSpacer} />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: C.bg,
    },
    topStripe: {
      height: 3,
      backgroundColor: C.accent,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: scale(20),
      paddingBottom: vs(30),
    },

    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: scale(16),
      paddingVertical: vs(12),
      borderBottomWidth: 1,
    },
    backBtn: {
      width: scale(38),
      height: scale(38),
      borderRadius: scale(10),
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: sp(18),
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    uploadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(6),
      paddingHorizontal: scale(16),
      paddingVertical: vs(8),
      borderRadius: scale(10),
      shadowColor: C.accent,
      shadowOffset: { width: 0, height: scale(3) },
      shadowOpacity: 0.25,
      shadowRadius: scale(8),
      elevation: 3,
    },
    uploadText: {
      color: '#FFFFFF',
      fontSize: sp(14),
      fontWeight: '700',
    },

    // Inputs
    inputGroup: {
      marginBottom: vs(16),
    },
    inputLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: vs(6),
    },
    inputLabel: {
      fontSize: sp(13),
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    inputWrap: {
      borderWidth: 1.5,
      borderRadius: scale(12),
      paddingHorizontal: scale(14),
    },
    titleInput: {
      fontSize: sp(16),
      fontWeight: '600',
      paddingVertical: vs(12),
      minHeight: vs(50),
    },
    descriptionWrap: {
      minHeight: vs(100),
    },
    descriptionInput: {
      fontSize: sp(15),
      paddingVertical: vs(12),
      minHeight: vs(100),
      lineHeight: sp(22),
      textAlignVertical: 'top',
    },
    errorText: {
      color: C.accent,
      fontSize: sp(12),
      fontWeight: '500',
    },

    // Video Upload
    videoUpload: {
      width: '100%',
      height: vs(180),
      borderRadius: scale(14),
      borderWidth: 2,
      borderStyle: 'dashed',
      overflow: 'hidden',
    },
    videoPreview: {
      flex: 1,
      backgroundColor: C.surface,
      justifyContent: 'center',
      alignItems: 'center',
      padding: scale(20),
      gap: vs(8),
    },
    videoIconWrap: {
      width: scale(56),
      height: scale(56),
      borderRadius: scale(28),
      justifyContent: 'center',
      alignItems: 'center',
    },
    videoName: {
      fontSize: sp(14),
      fontWeight: '500',
      textAlign: 'center',
    },
    videoBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(4),
      paddingHorizontal: scale(12),
      paddingVertical: vs(4),
      borderRadius: scale(8),
      marginTop: vs(4),
    },
    videoBadgeText: {
      color: '#FFFFFF',
      fontSize: sp(12),
      fontWeight: '600',
    },
    uploadPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: vs(4),
    },
    uploadIconWrap: {
      width: scale(56),
      height: scale(56),
      borderRadius: scale(28),
      justifyContent: 'center',
      alignItems: 'center',
    },
    uploadTitle: {
      fontSize: sp(16),
      fontWeight: '600',
      marginTop: vs(4),
    },
    uploadSubtext: {
      fontSize: sp(12),
    },

    // Thumbnail
    thumbnailUpload: {
      width: '100%',
      height: vs(120),
      borderRadius: scale(12),
      borderWidth: 1.5,
      borderStyle: 'dashed',
      overflow: 'hidden',
      position: 'relative',
    },
    thumbnailPreview: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    thumbnailOverlay: {
      position: 'absolute',
      top: scale(8),
      right: scale(8),
    },
    thumbnailBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(4),
      paddingHorizontal: scale(10),
      paddingVertical: vs(4),
      borderRadius: scale(8),
    },
    thumbnailBadgeText: {
      color: '#FFFFFF',
      fontSize: sp(11),
      fontWeight: '600',
    },
    thumbnailPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: vs(4),
    },
    thumbnailText: {
      fontSize: sp(14),
      fontWeight: '500',
    },
    thumbnailSubtext: {
      fontSize: sp(11),
    },

    // Category
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: scale(8),
    },
    categoryOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(6),
      paddingHorizontal: scale(14),
      paddingVertical: vs(8),
      borderRadius: scale(10),
      borderWidth: 1.5,
    },
    categoryText: {
      fontSize: sp(13),
      fontWeight: '600',
    },

    // Toggle
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: scale(14),
      borderRadius: scale(12),
      borderWidth: 1.5,
      borderColor: C.border,
      backgroundColor: C.surface,
    },
    toggleLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(12),
      flex: 1,
    },
    toggleIconWrap: {
      width: scale(40),
      height: scale(40),
      borderRadius: scale(10),
      justifyContent: 'center',
      alignItems: 'center',
    },
    toggleTitle: {
      fontSize: sp(14),
      fontWeight: '600',
    },
    toggleSubtext: {
      fontSize: sp(12),
      marginTop: vs(2),
    },
    toggleSwitch: {
      width: scale(48),
      height: scale(28),
      borderRadius: scale(14),
      justifyContent: 'center',
      paddingHorizontal: scale(4),
    },
    toggleThumb: {
      width: scale(20),
      height: scale(20),
      borderRadius: scale(10),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },

    // Stats
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: vs(8),
      marginTop: vs(4),
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(6),
    },
    statText: {
      fontSize: sp(12),
      fontWeight: '500',
    },

    bottomSpacer: {
      height: vs(20),
    },
  });
}