import React, { useState, useRef } from 'react';
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
import { uploadVideo } from '../../services/videoService';
import Loader from '../../components/Loader';

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

export default function UploadVideo({ navigation }) {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'news',
    language: 'en',
    isAdultContent: false,
  });
  const [video, setVideo] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [errors, setErrors] = useState({});
  const [focusedInput, setFocusedInput] = useState(null);

  // Refs for focus management
  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  const categories = [
    { label: 'News', value: 'news', icon: 'newspaper-outline' },
    { label: 'Entertainment', value: 'entertainment', icon: 'film-outline' },
    { label: 'Sports', value: 'sports', icon: 'basketball-outline' },
    { label: 'Business', value: 'business', icon: 'business-outline' },
    { label: 'Technology', value: 'technology', icon: 'hardware-chip-outline' },
    { label: 'Lifestyle', value: 'lifestyle', icon: 'leaf-outline' },
    { label: 'Other', value: 'other', icon: 'ellipsis-horizontal-outline' },
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
      setErrors({ ...errors, video: null });
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
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
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
      setFormData({
        title: '',
        description: '',
        category: 'news',
        language: 'en',
        isAdultContent: false,
      });
      setVideo(null);
      setThumbnail(null);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to upload video');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextInput = (nextRef) => {
    nextRef.current?.focus();
  };

  const toggleAdultContent = () => {
    setFormData({ ...formData, isAdultContent: !formData.isAdultContent });
  };

  const styles = makeStyles(C);

  if (isLoading) {
    return <Loader message="Uploading video..." />;
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.topStripe} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <View style={styles.headerLeft} />
        <Text style={[styles.headerTitle, { color: C.primary }]}>Upload Video</Text>
        <TouchableOpacity 
          style={[styles.uploadBtn, { backgroundColor: C.accent }]}
          onPress={handleSubmit}
        >
          <Text style={styles.uploadText}>Upload</Text>
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
                {video ? (
                  <View style={styles.videoPreview}>
                    <View style={[styles.videoIconWrap, { backgroundColor: C.accentBg }]}>
                      <Ionicons name="videocam" size={scale(32)} color={C.accent} />
                    </View>
                    <Text style={[styles.videoName, { color: C.primary }]} numberOfLines={1}>
                      {video.fileName || 'Video selected'}
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

            {/* Thumbnail Upload */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: C.secondary }]}>Thumbnail (Optional)</Text>
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
                ) : (
                  <View style={styles.thumbnailPlaceholder}>
                    <Ionicons name="image-outline" size={scale(24)} color={C.muted} />
                    <Text style={[styles.thumbnailText, { color: C.muted }]}>Add Thumbnail</Text>
                    <Text style={[styles.thumbnailSubtext, { color: C.faint }]}>16:9 image recommended</Text>
                  </View>
                )}
                {thumbnail && (
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

            {/* Description - Now Mandatory */}
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

            {/* 18+ Content Toggle */}
            <View style={styles.inputGroup}>
              <View style={styles.toggleContainer}>
                <View style={styles.toggleLeft}>
                  <View style={[styles.toggleIconWrap, { backgroundColor: formData.isAdultContent ? C.accentBg : C.iconBlueBg }]}>
                    <Ionicons 
                      name={formData.isAdultContent ? 'warning-outline' : 'people-outline'} 
                      size={scale(20)} 
                      color={formData.isAdultContent ? C.accent : C.iconBlue} 
                    />
                  </View>
                  <View>
                    <Text style={[styles.toggleTitle, { color: C.primary }]}>
                      {formData.isAdultContent ? '18+ Content' : 'Child Friendly'}
                    </Text>
                    <Text style={[styles.toggleSubtext, { color: C.muted }]}>
                      {formData.isAdultContent 
                        ? 'This video contains mature content' 
                        : 'This video is suitable for all ages'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleSwitch,
                    { 
                      backgroundColor: formData.isAdultContent ? C.accent : C.iconBlue,
                    }
                  ]}
                  onPress={toggleAdultContent}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.toggleThumb,
                    { 
                      transform: [{ translateX: formData.isAdultContent ? scale(18) : 0 }],
                      backgroundColor: '#FFFFFF',
                    }
                  ]} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Video Info Stats */}
            {video && (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="videocam-outline" size={scale(16)} color={C.muted} />
                  <Text style={[styles.statText, { color: C.muted }]}>
                    {video.fileName || 'Video ready'}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={scale(16)} color={C.muted} />
                  <Text style={[styles.statText, { color: C.muted }]}>
                    {video.duration ? `${Math.round(video.duration)}s` : 'Ready'}
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
    headerLeft: {
      width: scale(38),
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

    // 18+ Toggle
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