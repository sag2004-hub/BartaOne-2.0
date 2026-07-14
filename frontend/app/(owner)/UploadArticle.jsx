// app/(owner)/UploadArticle.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
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
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../../hooks/useAuth';
import { createArticle, getArticleById, updateArticle } from '../../services/articleService';
import { getChannelByOwner } from '../../services/channelService';
import Loader from '../../components/Loader';
import { useRouter, useLocalSearchParams } from 'expo-router';

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
};

export default function UploadArticle() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { user } = useAuth();
  
  // States
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChannel, setIsLoadingChannel] = useState(true);
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [articleId, setArticleId] = useState(null);
  const [channelId, setChannelId] = useState(null);
  const [channelData, setChannelData] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    body: '',
    category: 'news',
    language: 'en',
  });
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [focusedInput, setFocusedInput] = useState(null);

  // Refs for focus management
  const titleInputRef = useRef(null);
  const summaryInputRef = useRef(null);
  const bodyInputRef = useRef(null);

  const categories = [
    { label: 'News', value: 'news', icon: 'newspaper-outline' },
    { label: 'Entertainment', value: 'entertainment', icon: 'film-outline' },
    { label: 'Sports', value: 'sports', icon: 'basketball-outline' },
    { label: 'Business', value: 'business', icon: 'business-outline' },
    { label: 'Technology', value: 'technology', icon: 'hardware-chip-outline' },
    { label: 'Lifestyle', value: 'lifestyle', icon: 'leaf-outline' },
    { label: 'Other', value: 'other', icon: 'ellipsis-horizontal-outline' },
  ];

  // ─── Check if editing ──────────────────────────────────────────────────────
  useEffect(() => {
    if (params.edit) {
      setIsEditing(true);
      setArticleId(params.edit);
      loadArticleData(params.edit);
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
          'Please create a channel before publishing articles.',
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

  // ─── Load Article Data for Editing ──────────────────────────────────────
  const loadArticleData = async (id) => {
    try {
      setIsLoadingArticle(true);
      console.log('📡 Loading article for editing:', id);
      
      const response = await getArticleById(id);
      console.log('📡 Article response:', response);
      
      let article = response;
      if (response && response.data) {
        article = response.data;
      }
      
      if (article) {
        setFormData({
          title: article.title || '',
          summary: article.summary || '',
          body: article.body || '',
          category: article.category || 'news',
          language: article.language || 'en',
        });
        
        if (article.image) {
          setExistingImage(article.image);
        }
        
        console.log('✅ Article loaded successfully');
      } else {
        console.error('❌ No article data found');
        Alert.alert('Error', 'Failed to load article data');
      }
    } catch (error) {
      console.error('❌ Error loading article:', error);
      Alert.alert('Error', 'Failed to load article data. Please try again.');
    } finally {
      setIsLoadingArticle(false);
    }
  };

  // ─── Image Picker ──────────────────────────────────────────────────────────
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
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setImage(asset);
      setExistingImage(null);
      if (asset.base64) {
        setImageBase64(asset.base64);
      } else {
        try {
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setImageBase64(base64);
        } catch (error) {
          console.error('Error reading image:', error);
        }
      }
    }
  };

  // ─── Reset Form ──────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({
      title: '',
      summary: '',
      body: '',
      category: 'news',
      language: 'en',
    });
    setImage(null);
    setImageBase64(null);
    setExistingImage(null);
    setErrors({});
    setFocusedInput(null);
  };

  // ─── Validation ────────────────────────────────────────────────────────────
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
    if (!image && !existingImage && !isEditing) {
      newErrors.image = 'Cover image is required';
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
      const articleData = {
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        body: formData.body.trim(),
        category: formData.category,
        language: formData.language,
        channelId: channelId,
      };

      console.log('📤 Publishing article with data:', {
        ...articleData,
        hasImage: !!image,
        hasExistingImage: !!existingImage,
        isEditing: isEditing,
      });

      if (image) {
        const imageFile = {
          uri: image.uri,
          name: image.fileName || `article-${Date.now()}.jpg`,
          type: image.mimeType || 'image/jpeg',
          base64: imageBase64,
        };
        articleData.image = imageFile;
        console.log('📤 New image selected:', imageFile.name);
      } else if (existingImage && isEditing) {
        articleData.image = { keepExisting: true };
        console.log('📤 Keeping existing image');
      }

      let response;
      if (isEditing && articleId) {
        console.log('📤 Updating article:', articleId);
        response = await updateArticle(articleId, articleData);
      } else {
        console.log('📤 Creating new article');
        response = await createArticle(articleData);
      }
      
      console.log('✅ Article saved successfully:', response);

      Alert.alert(
        '🎉 Success!',
        `Your article has been ${isEditing ? 'updated' : 'published'} successfully!`,
        [
          {
            text: 'View Articles',
            onPress: () => {
              resetForm();
              goToManagePosts();
            },
          },
          {
            text: isEditing ? 'Continue Editing' : 'Write Another',
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
      console.error('❌ Error publishing article:');
      console.error('  Message:', error.message);
      console.error('  Status:', error.status);
      console.error('  Data:', error.data);
      
      let errorMessage = `Failed to ${isEditing ? 'update' : 'publish'} article. Please try again.`;
      
      if (error.status === 400) {
        errorMessage = error.data?.message || 'Invalid article data. Please check your inputs.';
      } else if (error.status === 401) {
        errorMessage = 'Session expired. Please login again.';
      } else if (error.status === 403) {
        errorMessage = 'You don\'t have permission to publish articles.';
      } else if (error.status === 404) {
        errorMessage = 'Channel not found. Please create a channel first.';
      } else if (error.status === 409) {
        errorMessage = 'An article with this title already exists.';
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

  const styles = makeStyles(C);

  // ─── Loading State ────────────────────────────────────────────────────────
  if (isLoadingChannel || isLoadingArticle || isLoading) {
    let message = 'Loading...';
    if (isLoadingChannel) message = 'Loading channel...';
    else if (isLoadingArticle) message = 'Loading article...';
    else if (isLoading) message = isEditing ? 'Updating article...' : 'Publishing article...';
    return <Loader message={message} />;
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={[styles.topStripe, { backgroundColor: C.accent }]} />

      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: C.bg }]}
          onPress={goBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={moderateScale(24)} color={C.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.primary }]}>
          {isEditing ? 'Edit Article' : 'Write Article'}
        </Text>
        <TouchableOpacity 
          style={[styles.publishBtn, { backgroundColor: C.accent }]}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={styles.publishText}>{isEditing ? 'Update' : 'Publish'}</Text>
          <Ionicons name="send-outline" size={moderateScale(16)} color="#FFFFFF" />
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
        bounces={true}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            {/* Title Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Text style={[styles.inputLabel, { color: C.secondary }]}>Title</Text>
                {errors.title && (
                  <Text style={styles.errorText}>{errors.title}</Text>
                )}
              </View>
              <View style={[
                styles.inputWrap,
                { 
                  borderColor: errors.title ? C.accent : (focusedInput === 'title' ? C.inputFocusBorder : C.inputBorder),
                  backgroundColor: C.inputBg,
                }
              ]}>
                <TextInput
                  ref={titleInputRef}
                  style={[styles.titleInput, { color: C.primary }]}
                  placeholder="Write a compelling title..."
                  placeholderTextColor={C.placeholder}
                  value={formData.title}
                  onChangeText={(text) => {
                    setFormData({ ...formData, title: text });
                    setErrors({ ...errors, title: null });
                  }}
                  onFocus={() => setFocusedInput('title')}
                  onBlur={() => setFocusedInput(null)}
                  returnKeyType="next"
                  onSubmitEditing={() => handleNextInput(summaryInputRef)}
                  multiline
                />
              </View>
            </View>

            {/* Image Upload */}
            <TouchableOpacity 
              style={[
                styles.imageUpload, 
                { 
                  borderColor: errors.image ? C.accent : C.border,
                  backgroundColor: C.surfaceAlt,
                }
              ]} 
              onPress={pickImage}
              activeOpacity={0.8}
            >
              {image ? (
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
              ) : existingImage ? (
                <Image source={{ uri: existingImage }} style={styles.imagePreview} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <View style={[styles.uploadIconWrap, { backgroundColor: C.accentBg }]}>
                    <Ionicons name="image-outline" size={moderateScale(32)} color={C.accent} />
                  </View>
                  <Text style={[styles.uploadText, { color: C.secondary }]}>Add Cover Image</Text>
                  <Text style={[styles.uploadSubtext, { color: C.muted }]}>16:9 image recommended</Text>
                </View>
              )}
              {(image || existingImage) && (
                <View style={styles.imageOverlay}>
                  <View style={[styles.imageBadge, { backgroundColor: C.accent }]}>
                    <Ionicons name="camera-outline" size={moderateScale(14)} color="#FFF" />
                    <Text style={styles.imageBadgeText}>Change</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
            {errors.image && (
              <Text style={[styles.errorText, { marginTop: verticalScale(-8), marginBottom: verticalScale(8) }]}>{errors.image}</Text>
            )}

            {/* Summary Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Text style={[styles.inputLabel, { color: C.secondary }]}>Summary</Text>
                {errors.summary && (
                  <Text style={styles.errorText}>{errors.summary}</Text>
                )}
              </View>
              <View style={[
                styles.inputWrap,
                { 
                  borderColor: errors.summary ? C.accent : (focusedInput === 'summary' ? C.inputFocusBorder : C.inputBorder),
                  backgroundColor: C.inputBg,
                }
              ]}>
                <TextInput
                  ref={summaryInputRef}
                  style={[styles.summaryInput, { color: C.primary }]}
                  placeholder="Write a brief summary..."
                  placeholderTextColor={C.placeholder}
                  value={formData.summary}
                  onChangeText={(text) => {
                    setFormData({ ...formData, summary: text });
                    setErrors({ ...errors, summary: null });
                  }}
                  onFocus={() => setFocusedInput('summary')}
                  onBlur={() => setFocusedInput(null)}
                  returnKeyType="next"
                  onSubmitEditing={() => handleNextInput(bodyInputRef)}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>

            {/* Body Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Text style={[styles.inputLabel, { color: C.secondary }]}>Content</Text>
                {errors.body && (
                  <Text style={styles.errorText}>{errors.body}</Text>
                )}
              </View>
              <View style={[
                styles.inputWrap,
                styles.bodyWrap,
                { 
                  borderColor: errors.body ? C.accent : (focusedInput === 'body' ? C.inputFocusBorder : C.inputBorder),
                  backgroundColor: C.inputBg,
                }
              ]}>
                <TextInput
                  ref={bodyInputRef}
                  style={[styles.bodyInput, { color: C.primary }]}
                  placeholder="Write your article content here..."
                  placeholderTextColor={C.placeholder}
                  value={formData.body}
                  onChangeText={(text) => {
                    setFormData({ ...formData, body: text });
                    setErrors({ ...errors, body: null });
                  }}
                  onFocus={() => setFocusedInput('body')}
                  onBlur={() => setFocusedInput(null)}
                  multiline
                  numberOfLines={12}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Category Selection */}
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
                      size={moderateScale(18)} 
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

            {/* Word Count & Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="text-outline" size={moderateScale(16)} color={C.muted} />
                <Text style={[styles.statText, { color: C.muted }]}>
                  {formData.body.split(/\s+/).filter(Boolean).length} words
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={moderateScale(16)} color={C.muted} />
                <Text style={[styles.statText, { color: C.muted }]}>
                  {Math.ceil(formData.body.split(/\s+/).filter(Boolean).length / 200)} min read
                </Text>
              </View>
            </View>

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
      height: verticalScale(3),
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: scale(20),
      paddingBottom: verticalScale(30),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: scale(16),
      paddingVertical: verticalScale(12),
      borderBottomWidth: StyleSheet.hairlineWidth,
      minHeight: verticalScale(56),
    },
    backBtn: {
      width: scale(38),
      height: scale(38),
      borderRadius: scale(10),
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: fontScale(18),
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    publishBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(6),
      paddingHorizontal: scale(16),
      paddingVertical: verticalScale(8),
      borderRadius: scale(10),
      shadowColor: C.accent,
      shadowOffset: { width: 0, height: scale(3) },
      shadowOpacity: 0.25,
      shadowRadius: scale(8),
      elevation: 3,
      minHeight: verticalScale(40),
    },
    publishText: {
      color: '#FFFFFF',
      fontSize: fontScale(14),
      fontWeight: '700',
    },
    inputGroup: {
      marginBottom: verticalScale(16),
    },
    inputLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: verticalScale(6),
      flexWrap: 'wrap',
      gap: scale(4),
    },
    inputLabel: {
      fontSize: fontScale(13),
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    inputWrap: {
      borderWidth: 1.5,
      borderRadius: scale(12),
      paddingHorizontal: scale(14),
      minHeight: verticalScale(48),
    },
    titleInput: {
      fontSize: fontScale(20),
      fontWeight: '700',
      paddingVertical: verticalScale(12),
      minHeight: verticalScale(50),
      letterSpacing: -0.3,
      padding: 0, // Remove default padding on Android
    },
    summaryInput: {
      fontSize: fontScale(15),
      paddingVertical: verticalScale(12),
      minHeight: verticalScale(60),
      lineHeight: fontScale(22),
      padding: 0,
    },
    bodyWrap: {
      minHeight: verticalScale(200),
    },
    bodyInput: {
      fontSize: fontScale(15),
      paddingVertical: verticalScale(12),
      minHeight: verticalScale(200),
      lineHeight: fontScale(24),
      textAlignVertical: 'top',
      padding: 0,
    },
    errorText: {
      color: C.accent,
      fontSize: fontScale(12),
      fontWeight: '500',
    },
    imageUpload: {
      width: '100%',
      height: verticalScale(180),
      borderRadius: scale(14),
      borderWidth: 2,
      borderStyle: 'dashed',
      overflow: 'hidden',
      marginBottom: verticalScale(16),
      position: 'relative',
    },
    imagePreview: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    imageOverlay: {
      position: 'absolute',
      top: scale(10),
      right: scale(10),
    },
    imageBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(4),
      paddingHorizontal: scale(10),
      paddingVertical: verticalScale(4),
      borderRadius: scale(8),
    },
    imageBadgeText: {
      color: '#FFFFFF',
      fontSize: fontScale(12),
      fontWeight: '600',
    },
    uploadPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: verticalScale(6),
    },
    uploadIconWrap: {
      width: scale(56),
      height: scale(56),
      borderRadius: scale(28),
      justifyContent: 'center',
      alignItems: 'center',
    },
    uploadText: {
      fontSize: fontScale(14),
      fontWeight: '600',
      marginTop: verticalScale(4),
    },
    uploadSubtext: {
      fontSize: fontScale(12),
    },
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
      paddingVertical: verticalScale(8),
      borderRadius: scale(10),
      borderWidth: 1.5,
      minHeight: verticalScale(40),
    },
    categoryText: {
      fontSize: fontScale(13),
      fontWeight: '600',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: verticalScale(8),
      marginTop: verticalScale(4),
      flexWrap: 'wrap',
      gap: scale(8),
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(6),
    },
    statText: {
      fontSize: fontScale(12),
      fontWeight: '500',
    },
    bottomSpacer: {
      height: verticalScale(20),
    },
  });
}