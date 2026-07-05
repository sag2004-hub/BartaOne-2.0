import React, { useState, useRef } from 'react';
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
import { useAuth } from '../../hooks/useAuth';
import { createArticle } from '../../services/articleService';
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

export default function UploadArticle({ navigation }) {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
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
        channelId: user.uid,
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

  const handleNextInput = (nextRef) => {
    nextRef.current?.focus();
  };

  const styles = makeStyles(C);

  if (isLoading) {
    return <Loader message="Publishing article..." />;
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.topStripe} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <View style={styles.headerLeft} />
        <Text style={[styles.headerTitle, { color: C.primary }]}>Write Article</Text>
        <TouchableOpacity 
          style={[styles.publishBtn, { backgroundColor: C.accent }]}
          onPress={handleSubmit}
        >
          <Text style={styles.publishText}>Publish</Text>
          <Ionicons name="send-outline" size={scale(16)} color="#FFFFFF" />
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
                  borderColor: errors.title ? C.accent : (focusedInput === 'title' ? C.accent : C.inputBorder),
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
              style={[styles.imageUpload, { 
                borderColor: C.border,
                backgroundColor: C.surfaceAlt,
              }]} 
              onPress={pickImage}
              activeOpacity={0.8}
            >
              {image ? (
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <View style={[styles.uploadIconWrap, { backgroundColor: C.accentBg }]}>
                    <Ionicons name="image-outline" size={scale(32)} color={C.accent} />
                  </View>
                  <Text style={[styles.uploadText, { color: C.secondary }]}>Add Cover Image</Text>
                  <Text style={[styles.uploadSubtext, { color: C.muted }]}>16:9 image recommended</Text>
                </View>
              )}
              {image && (
                <View style={styles.imageOverlay}>
                  <View style={[styles.imageBadge, { backgroundColor: C.accent }]}>
                    <Ionicons name="camera-outline" size={scale(14)} color="#FFF" />
                    <Text style={styles.imageBadgeText}>Change</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>

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
                  borderColor: errors.summary ? C.accent : (focusedInput === 'summary' ? C.accent : C.inputBorder),
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
                  borderColor: errors.body ? C.accent : (focusedInput === 'body' ? C.accent : C.inputBorder),
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

            {/* Word Count & Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="text-outline" size={scale(16)} color={C.muted} />
                <Text style={[styles.statText, { color: C.muted }]}>
                  {formData.body.split(/\s+/).filter(Boolean).length} words
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={scale(16)} color={C.muted} />
                <Text style={[styles.statText, { color: C.muted }]}>
                  {Math.ceil(formData.body.split(/\s+/).filter(Boolean).length / 200)} min read
                </Text>
              </View>
            </View>

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
    publishBtn: {
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
    publishText: {
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
      fontSize: sp(20),
      fontWeight: '700',
      paddingVertical: vs(12),
      minHeight: vs(50),
      letterSpacing: -0.3,
    },
    summaryInput: {
      fontSize: sp(15),
      paddingVertical: vs(12),
      minHeight: vs(60),
      lineHeight: sp(22),
    },
    bodyWrap: {
      minHeight: vs(200),
    },
    bodyInput: {
      fontSize: sp(15),
      paddingVertical: vs(12),
      minHeight: vs(200),
      lineHeight: sp(24),
      textAlignVertical: 'top',
    },
    errorText: {
      color: C.accent,
      fontSize: sp(12),
      fontWeight: '500',
    },

    // Image Upload
    imageUpload: {
      width: '100%',
      height: vs(180),
      borderRadius: scale(14),
      borderWidth: 2,
      borderStyle: 'dashed',
      overflow: 'hidden',
      marginBottom: vs(16),
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
      paddingVertical: vs(4),
      borderRadius: scale(8),
    },
    imageBadgeText: {
      color: '#FFFFFF',
      fontSize: sp(12),
      fontWeight: '600',
    },
    uploadPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: vs(6),
    },
    uploadIconWrap: {
      width: scale(56),
      height: scale(56),
      borderRadius: scale(28),
      justifyContent: 'center',
      alignItems: 'center',
    },
    uploadText: {
      fontSize: sp(14),
      fontWeight: '600',
      marginTop: vs(4),
    },
    uploadSubtext: {
      fontSize: sp(12),
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