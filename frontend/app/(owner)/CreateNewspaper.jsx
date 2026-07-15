import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Dimensions,
  PixelRatio,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import Loader from '../../components/Loader';
import useNewspaper from '../../hooks/useNewspaper';
import useAuth from '../../hooks/useAuth';

// ─── Responsive helpers ──────────────────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

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
const COLORS = {
  primary: '#C8001A',
  secondary: '#1A2733',
  background: '#F2F0EB',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#8A97A5',
  lightGray: '#E4E0D8',
  text: '#1A2733',
  error: '#DC3545',
  success: '#28A745',
  warning: '#FFC107',
  lightPrimary: '#FFF0F2',
  border: '#E4E0D8',
  surface: '#FFFFFF',
  muted: '#8A97A5',
  faint: '#B8C0C8',
  gold: '#D4AF37',
};

const SIZES = {
  h1: fontScale(28),
  h2: fontScale(24),
  h3: fontScale(20),
  h4: fontScale(18),
  body1: fontScale(16),
  body2: fontScale(14),
  body3: fontScale(12),
  body4: fontScale(10),
  padding: scale(16),
  margin: scale(16),
  radius: scale(8),
  icon: scale(24),
  iconSmall: scale(16),
  iconLarge: scale(32),
};

const CreateNewspaper = () => {
  const router = useRouter();
  const { edit: editId } = useLocalSearchParams();
  const isEditMode = !!editId;
  const { user } = useAuth();
  const { createNewspaper, updateNewspaper, getNewspaperById, loading } = useNewspaper();
  const scrollViewRef = useRef(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [loadingEdit, setLoadingEdit] = useState(false);
  
  // ─── Blank form factory ───────────────────────────────────────────────────
  const blankForm = () => ({
    title: '',
    subtitle: '',
    edition: `Vol. 1, No. ${new Date().toLocaleDateString()}`,
    date: new Date().toISOString().split('T')[0],
    description: '',
    pages: [{ pageNumber: 1, content: '', images: [], layout: 'full' }],
    language: 'en',
    region: 'global',
  });

  const [formData, setFormData] = useState(blankForm);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [imageDataCache, setImageDataCache] = useState({});

  // ─── On every focus: reset to blank (create) OR load from DB (edit) ───────
  useFocusEffect(
    useCallback(() => {
      if (!isEditMode) {
        // CREATE mode: always start with a fresh blank form on focus
        setFormData(blankForm());
        setCurrentPageIndex(0);
        setImageDataCache({});
        setShowPreview(false);
        return;
      }

      // EDIT mode: fetch existing newspaper and pre-fill
      let cancelled = false;

      const loadForEdit = async () => {
        setLoadingEdit(true);
        try {
          const newspaper = await getNewspaperById(editId);
          if (cancelled || !newspaper) return;

          const pages = (newspaper.pages || []).map((p) => ({
            pageNumber: p.pageNumber || 1,
            content: p.content || '',
            // Existing images are plain Cloudinary URLs — getImageUri() returns
            // them as-is for display; getImageBase64() passes them through for
            // submission so your backend only re-uploads newly picked images.
            images: p.images || [],
            layout: p.layout || 'full',
          }));

          setFormData({
            title: newspaper.title || '',
            subtitle: newspaper.subtitle || '',
            edition: newspaper.edition || `Vol. 1, No. ${new Date().toLocaleDateString()}`,
            date: newspaper.date
              ? new Date(newspaper.date).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            description: newspaper.description || '',
            pages: pages.length > 0 ? pages : [{ pageNumber: 1, content: '', images: [], layout: 'full' }],
            language: newspaper.language || 'en',
            region: newspaper.region || 'global',
          });
          setCurrentPageIndex(0);
          setImageDataCache({});
          setShowPreview(false);
        } catch (err) {
          if (!cancelled) {
            console.error('Error pre-filling edit form:', err);
            Alert.alert('Error', 'Failed to load newspaper for editing');
          }
        } finally {
          if (!cancelled) setLoadingEdit(false);
        }
      };

      loadForEdit();

      // If screen loses focus before fetch finishes, ignore the stale result
      return () => { cancelled = true; };
    }, [editId])
  );

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handlePageContentChange = (field, value, index) => {
    const updatedPages = [...formData.pages];
    updatedPages[index] = { ...updatedPages[index], [field]: value };
    setFormData({ ...formData, pages: updatedPages });
  };

  const addPage = () => {
    if (formData.pages.length >= 20) {
      Alert.alert('Error', 'Maximum 20 pages allowed');
      return;
    }
    setFormData({
      ...formData,
      pages: [
        ...formData.pages,
        {
          pageNumber: formData.pages.length + 1,
          content: '',
          images: [],
          layout: 'full',
        },
      ],
    });
    setCurrentPageIndex(formData.pages.length);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const removePage = (index) => {
    if (formData.pages.length <= 1) {
      Alert.alert('Error', 'Newspaper must have at least 1 page');
      return;
    }
    const updatedPages = formData.pages.filter((_, i) => i !== index);
    setFormData({ ...formData, pages: updatedPages });
    if (currentPageIndex >= updatedPages.length) {
      setCurrentPageIndex(updatedPages.length - 1);
    }
  };

  // ─── Pick image with base64 ──────────────────────────────────────────────
  const pickImage = async (pageIndex) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please grant camera roll permissions to upload images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      let imageUri = asset.uri;
      let base64Data = asset.base64;

      // If base64 not returned, read the file
      if (!base64Data) {
        try {
          base64Data = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (error) {
          console.error('Error reading image:', error);
        }
      }

      // Store image data in cache
      const imageKey = `img_${Date.now()}_${pageIndex}`;
      setImageDataCache({
        ...imageDataCache,
        [imageKey]: {
          uri: imageUri,
          base64: base64Data,
          fileName: asset.fileName || `newspaper_${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
        },
      });

      // ✅ Store only the URI as a string in formData (for display)
      const updatedPages = [...formData.pages];
      updatedPages[pageIndex].images = [
        ...updatedPages[pageIndex].images,
        imageKey, // Store the key to retrieve base64 later
      ];
      setFormData({ ...formData, pages: updatedPages });
    }
  };

  const removeImage = (pageIndex, imageIndex) => {
    const updatedPages = [...formData.pages];
    const imageKey = updatedPages[pageIndex].images[imageIndex];
    updatedPages[pageIndex].images.splice(imageIndex, 1);
    setFormData({ ...formData, pages: updatedPages });
    
    // Remove from cache
    if (imageKey) {
      const newCache = { ...imageDataCache };
      delete newCache[imageKey];
      setImageDataCache(newCache);
    }
  };

  // ─── Get image URI for display ────────────────────────────────────────────
  const getImageUri = (imageKey) => {
    if (typeof imageKey === 'string' && imageKey.startsWith('img_')) {
      return imageDataCache[imageKey]?.uri || '';
    }
    return typeof imageKey === 'string' ? imageKey : '';
  };

  // ─── Get base64 data for submission ──────────────────────────────────────
  const getImageBase64 = (imageKey) => {
    if (typeof imageKey === 'string' && imageKey.startsWith('img_')) {
      const cached = imageDataCache[imageKey];
      if (cached) {
        return `data:${cached.mimeType};base64,${cached.base64}`;
      }
    }
    return imageKey;
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a newspaper title');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a newspaper description');
      return false;
    }
    for (let i = 0; i < formData.pages.length; i++) {
      if (!formData.pages[i].content.trim()) {
        Alert.alert('Error', `Page ${i + 1} content is empty`);
        return false;
      }
    }
    return true;
  };

  const clearForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      edition: `Vol. 1, No. ${new Date().toLocaleDateString()}`,
      date: new Date().toISOString().split('T')[0],
      description: '',
      pages: [
        {
          pageNumber: 1,
          content: '',
          images: [],
          layout: 'full',
        },
      ],
      language: 'en',
      region: 'global',
    });
    setCurrentPageIndex(0);
    setShowPreview(false);
    setImageDataCache({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setUploadingImages(true);
      setImageUploadProgress(0);
      
      console.log('📰 Processing newspaper with images...');
      
      // ─── Process images - convert to base64 strings ──────────────────────
      const totalImages = formData.pages.reduce((sum, page) => sum + page.images.length, 0);
      let processedCount = 0;
      
      const processedPages = formData.pages.map((page) => {
        const processedImages = page.images.map((imageKey) => {
          processedCount++;
          const progress = Math.round((processedCount / (totalImages || 1)) * 100);
          setImageUploadProgress(progress);
          
          // Convert image key to base64 data URL
          const base64Data = getImageBase64(imageKey);
          return base64Data;
        });
        
        return {
          ...page,
          images: processedImages,
        };
      });
      
      const finalData = {
        ...formData,
        pages: processedPages,
      };
      
      console.log(`📤 Submitting newspaper with ${totalImages} images...`);
      
      // ─── Submit the newspaper (create or update) ──────────────────────
      const result = isEditMode
        ? await updateNewspaper(editId, finalData)
        : await createNewspaper(finalData);

      if (result.success) {
        Alert.alert(
          isEditMode ? '✅ Updated!' : '🎉 Published!',
          isEditMode
            ? 'Your newspaper has been updated successfully.'
            : 'Your newspaper has been published!\n\n📰 Available for 24 hours\n🌍 Visible to all readers',
          [
            {
              text: 'OK',
              onPress: () => {
                clearForm();
                router.push('/(owner)/Dashboard');
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || (isEditMode ? 'Failed to update newspaper' : 'Failed to create newspaper'));
      }
    } catch (error) {
      console.error('❌ Error creating newspaper:', error);
      Alert.alert('Error', error.message || 'Failed to create newspaper');
    } finally {
      setUploadingImages(false);
    }
  };

  const renderPagePreview = () => {
    const page = formData.pages[currentPageIndex];
    return (
      <View style={styles.pagePreview}>
        <Text style={styles.pagePreviewTitle}>
          📄 Page {currentPageIndex + 1}
        </Text>
        
        <View style={styles.pagePreviewContent}>
          <Text style={styles.pagePreviewLabel}>Layout Style:</Text>
          <View style={styles.layoutButtons}>
            {['full', 'split', 'grid'].map((layout) => (
              <TouchableOpacity
                key={layout}
                style={[
                  styles.layoutButton,
                  page.layout === layout && styles.layoutButtonActive,
                ]}
                onPress={() => handlePageContentChange('layout', layout, currentPageIndex)}
              >
                <Text style={[
                  styles.layoutButtonText,
                  page.layout === layout && styles.layoutButtonTextActive,
                ]}>
                  {layout.charAt(0).toUpperCase() + layout.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.pagePreviewContent}>
          <Text style={styles.pagePreviewLabel}>Page Content:</Text>
          <TextInput
            style={styles.contentInput}
            multiline
            numberOfLines={10}
            placeholder="Write your newspaper page content here..."
            placeholderTextColor={COLORS.muted}
            value={page.content}
            onChangeText={(text) => handlePageContentChange('content', text, currentPageIndex)}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.pagePreviewContent}>
          <Text style={styles.pagePreviewLabel}>Images ({page.images.length}):</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
            <TouchableOpacity style={styles.addImageButton} onPress={() => pickImage(currentPageIndex)}>
              <Ionicons name="add-circle-outline" size={moderateScale(40)} color={COLORS.primary} />
              <Text style={styles.addImageText}>Add Image</Text>
            </TouchableOpacity>
            {page.images.map((imageKey, imgIndex) => {
              const imageUri = getImageUri(imageKey);
              return (
                <View key={imgIndex} style={styles.imageContainer}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  ) : (
                    <View style={[styles.imagePreview, styles.imagePlaceholder]}>
                      <Ionicons name="image-outline" size={moderateScale(24)} color={COLORS.muted} />
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(currentPageIndex, imgIndex)}
                  >
                    <Ionicons name="close-circle" size={moderateScale(20)} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.pageActions}>
          <TouchableOpacity
            style={[styles.pageActionButton, styles.deleteButton]}
            onPress={() => removePage(currentPageIndex)}
          >
            <Ionicons name="trash-outline" size={moderateScale(20)} color={COLORS.white} />
            <Text style={styles.pageActionButtonText}>Delete Page</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderInstructions = () => (
    <View style={styles.instructionsContainer}>
      <Text style={styles.instructionsTitle}>📰 How to Create Your Newspaper</Text>
      
      <View style={styles.instructionItem}>
        <View style={styles.instructionNumber}>
          <Text style={styles.instructionNumberText}>1</Text>
        </View>
        <View style={styles.instructionContent}>
          <Text style={styles.instructionHeading}>Add Basic Details</Text>
          <Text style={styles.instructionText}>
            Enter a catchy title, description, and select language/region for your newspaper.
          </Text>
        </View>
      </View>

      <View style={styles.instructionItem}>
        <View style={styles.instructionNumber}>
          <Text style={styles.instructionNumberText}>2</Text>
        </View>
        <View style={styles.instructionContent}>
          <Text style={styles.instructionHeading}>Create Pages</Text>
          <Text style={styles.instructionText}>
            Add multiple pages for your newspaper. Each page can have different layout styles:
            • Full: One column full width
            • Split: Two columns
            • Grid: Grid layout with images
          </Text>
        </View>
      </View>

      <View style={styles.instructionItem}>
        <View style={styles.instructionNumber}>
          <Text style={styles.instructionNumberText}>3</Text>
        </View>
        <View style={styles.instructionContent}>
          <Text style={styles.instructionHeading}>Add Images</Text>
          <Text style={styles.instructionText}>
            Images are uploaded with your newspaper. Available for 24 hours!
          </Text>
        </View>
      </View>

      <View style={styles.instructionItem}>
        <View style={styles.instructionNumber}>
          <Text style={styles.instructionNumberText}>4</Text>
        </View>
        <View style={styles.instructionContent}>
          <Text style={styles.instructionHeading}>Review & Publish</Text>
          <Text style={styles.instructionText}>
            Preview your newspaper, then publish for 24 hours of global visibility!
          </Text>
        </View>
      </View>

      <View style={styles.instructionNote}>
        <Ionicons name="information-circle-outline" size={moderateScale(20)} color={COLORS.primary} />
        <Text style={styles.instructionNoteText}>
          ⏰ Your newspaper will be available for 24 hours. Readers anywhere in the world can view it!
        </Text>
      </View>
    </View>
  );

  const renderNewspaperPreview = () => {
    if (!showPreview) return null;
    
    return (
      <View style={styles.previewContainer}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>📰 Newspaper Preview</Text>
          <TouchableOpacity onPress={() => setShowPreview(false)} style={styles.previewClose}>
            <Ionicons name="close" size={moderateScale(24)} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.previewContent}>
          <Text style={styles.previewNewspaperTitle}>{formData.title || 'Untitled Newspaper'}</Text>
          <Text style={styles.previewEdition}>{formData.edition}</Text>
          <Text style={styles.previewDate}>{formData.date}</Text>
          <Text style={styles.previewDescription}>{formData.description || 'No description'}</Text>
          
          <View style={styles.previewDivider} />
          
          <Text style={styles.previewPagesTitle}>📄 {formData.pages.length} Pages</Text>
          
          {formData.pages.map((page, index) => (
            <View key={index} style={styles.previewPageItem}>
              <Text style={styles.previewPageNumber}>Page {index + 1}</Text>
              <Text style={styles.previewPageLayout}>Layout: {page.layout.charAt(0).toUpperCase() + page.layout.slice(1)}</Text>
              <Text style={styles.previewPageContent} numberOfLines={2}>
                {page.content || 'No content yet'}
              </Text>
              {page.images.length > 0 && (
                <Text style={styles.previewPageImages}>📷 {page.images.length} image(s)</Text>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const styles = createStyles();

  if (loadingEdit) {
    return <Loader message="Loading newspaper for editing..." />;
  }

  if (uploadingImages) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.uploadTitle}>Processing Images...</Text>
            <Text style={styles.uploadSubtitle}>
              Preparing your newspaper for publication
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${imageUploadProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{imageUploadProgress}%</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={moderateScale(24)} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit Newspaper' : 'Create Newspaper'}</Text>
        <TouchableOpacity onPress={() => setShowPreview(!showPreview)} style={styles.previewButton}>
          <Ionicons name="eye-outline" size={moderateScale(24)} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {renderNewspaperPreview()}

          <View style={styles.formContainer}>
            {/* Basic Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📰 Newspaper Details</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter newspaper title"
                  placeholderTextColor={COLORS.muted}
                  value={formData.title}
                  onChangeText={(text) => handleInputChange('title', text)}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Subtitle</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter subtitle (optional)"
                  placeholderTextColor={COLORS.muted}
                  value={formData.subtitle}
                  onChangeText={(text) => handleInputChange('subtitle', text)}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Edition</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Vol. 1, No. 1"
                  placeholderTextColor={COLORS.muted}
                  value={formData.edition}
                  onChangeText={(text) => handleInputChange('edition', text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.muted}
                  value={formData.date}
                  onChangeText={(text) => handleInputChange('date', text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={4}
                  placeholder="Enter newspaper description"
                  placeholderTextColor={COLORS.muted}
                  value={formData.description}
                  onChangeText={(text) => handleInputChange('description', text)}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Language</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="en"
                    placeholderTextColor={COLORS.muted}
                    value={formData.language}
                    onChangeText={(text) => handleInputChange('language', text)}
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Region</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="global"
                    placeholderTextColor={COLORS.muted}
                    value={formData.region}
                    onChangeText={(text) => handleInputChange('region', text)}
                  />
                </View>
              </View>
            </View>

            {/* Pages Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📄 Pages ({formData.pages.length})</Text>
                <TouchableOpacity style={styles.addPageButton} onPress={addPage}>
                  <Ionicons name="add" size={moderateScale(24)} color={COLORS.white} />
                  <Text style={styles.addPageButtonText}>Add Page</Text>
                </TouchableOpacity>
              </View>

              {formData.pages.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pageNav}>
                  {formData.pages.map((_, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.pageNavButton,
                        currentPageIndex === index && styles.pageNavButtonActive,
                      ]}
                      onPress={() => setCurrentPageIndex(index)}
                    >
                      <Text style={[
                        styles.pageNavText,
                        currentPageIndex === index && styles.pageNavTextActive,
                      ]}>
                        Page {index + 1}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {renderPagePreview()}
            </View>

            {renderInstructions()}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading || uploadingImages}
            >
              {loading ? (
                <Loader size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name={isEditMode ? 'save-outline' : 'send-outline'} size={moderateScale(24)} color={COLORS.white} />
                  <Text style={styles.submitButtonText}>{isEditMode ? 'Save Changes' : 'Publish Newspaper'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = () => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: scale(16),
      paddingVertical: verticalScale(12),
      backgroundColor: COLORS.white,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.lightGray,
      minHeight: verticalScale(56),
    },
    backButton: {
      padding: scale(8),
    },
    headerTitle: {
      fontSize: SIZES.h3,
      fontWeight: 'bold',
      color: COLORS.primary,
    },
    previewButton: {
      padding: scale(8),
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: verticalScale(40),
    },
    formContainer: {
      padding: SIZES.padding,
    },
    section: {
      backgroundColor: COLORS.white,
      borderRadius: scale(12),
      padding: SIZES.padding,
      marginBottom: SIZES.padding,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(2) },
      shadowOpacity: 0.1,
      shadowRadius: scale(8),
      elevation: 3,
    },
    sectionTitle: {
      fontSize: SIZES.h3,
      fontWeight: 'bold',
      color: COLORS.text,
      marginBottom: verticalScale(16),
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: verticalScale(16),
    },
    inputGroup: {
      marginBottom: verticalScale(16),
    },
    label: {
      fontSize: SIZES.body2,
      fontWeight: '600',
      color: COLORS.text,
      marginBottom: verticalScale(8),
    },
    input: {
      borderWidth: 1,
      borderColor: COLORS.lightGray,
      borderRadius: scale(8),
      padding: scale(12),
      fontSize: SIZES.body2,
      backgroundColor: COLORS.white,
      color: COLORS.text,
    },
    textArea: {
      minHeight: verticalScale(100),
    },
    rowInputs: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    halfWidth: {
      width: '48%',
    },
    addPageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.primary,
      paddingHorizontal: scale(16),
      paddingVertical: verticalScale(8),
      borderRadius: scale(8),
    },
    addPageButtonText: {
      color: COLORS.white,
      fontWeight: 'bold',
      marginLeft: scale(4),
      fontSize: SIZES.body3,
    },
    pageNav: {
      marginBottom: verticalScale(16),
    },
    pageNavButton: {
      paddingHorizontal: scale(16),
      paddingVertical: verticalScale(8),
      marginRight: scale(8),
      borderRadius: scale(8),
      backgroundColor: COLORS.lightGray,
    },
    pageNavButtonActive: {
      backgroundColor: COLORS.primary,
    },
    pageNavText: {
      color: COLORS.text,
      fontSize: SIZES.body3,
    },
    pageNavTextActive: {
      color: COLORS.white,
    },
    pagePreview: {
      backgroundColor: COLORS.background,
      borderRadius: scale(8),
      padding: scale(12),
    },
    pagePreviewTitle: {
      fontSize: SIZES.h3,
      fontWeight: 'bold',
      color: COLORS.text,
      marginBottom: verticalScale(12),
    },
    pagePreviewContent: {
      marginBottom: verticalScale(12),
    },
    pagePreviewLabel: {
      fontSize: SIZES.body2,
      fontWeight: '600',
      color: COLORS.text,
      marginBottom: verticalScale(8),
    },
    layoutButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    layoutButton: {
      paddingHorizontal: scale(16),
      paddingVertical: verticalScale(8),
      marginRight: scale(8),
      borderRadius: scale(8),
      backgroundColor: COLORS.lightGray,
    },
    layoutButtonActive: {
      backgroundColor: COLORS.primary,
    },
    layoutButtonText: {
      color: COLORS.text,
      fontSize: SIZES.body3,
    },
    layoutButtonTextActive: {
      color: COLORS.white,
    },
    contentInput: {
      borderWidth: 1,
      borderColor: COLORS.lightGray,
      borderRadius: scale(8),
      padding: scale(12),
      fontSize: SIZES.body2,
      minHeight: verticalScale(150),
      backgroundColor: COLORS.white,
      color: COLORS.text,
    },
    imageScroll: {
      flexDirection: 'row',
    },
    addImageButton: {
      width: scale(80),
      height: scale(80),
      borderRadius: scale(8),
      borderWidth: 2,
      borderColor: COLORS.primary,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: scale(8),
    },
    addImageText: {
      fontSize: SIZES.body4,
      color: COLORS.primary,
      marginTop: scale(2),
    },
    imageContainer: {
      position: 'relative',
      marginRight: scale(8),
    },
    imagePreview: {
      width: scale(80),
      height: scale(80),
      borderRadius: scale(8),
    },
    imagePlaceholder: {
      backgroundColor: COLORS.lightGray,
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeImageButton: {
      position: 'absolute',
      top: -scale(8),
      right: -scale(8),
      backgroundColor: COLORS.white,
      borderRadius: scale(12),
    },
    pageActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: verticalScale(8),
    },
    pageActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: scale(16),
      paddingVertical: verticalScale(8),
      borderRadius: scale(8),
    },
    deleteButton: {
      backgroundColor: COLORS.error,
    },
    pageActionButtonText: {
      color: COLORS.white,
      marginLeft: scale(4),
      fontSize: SIZES.body3,
      fontWeight: '600',
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.primary,
      padding: scale(16),
      borderRadius: scale(12),
      marginTop: SIZES.padding,
      marginBottom: verticalScale(32),
      minHeight: verticalScale(54),
    },
    submitButtonText: {
      color: COLORS.white,
      fontSize: SIZES.h3,
      fontWeight: 'bold',
      marginLeft: scale(8),
    },
    instructionsContainer: {
      backgroundColor: COLORS.white,
      borderRadius: scale(12),
      padding: SIZES.padding,
      marginBottom: SIZES.padding,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(2) },
      shadowOpacity: 0.1,
      shadowRadius: scale(8),
      elevation: 3,
    },
    instructionsTitle: {
      fontSize: SIZES.h3,
      fontWeight: 'bold',
      color: COLORS.primary,
      marginBottom: verticalScale(16),
    },
    instructionItem: {
      flexDirection: 'row',
      marginBottom: verticalScale(14),
      alignItems: 'flex-start',
    },
    instructionNumber: {
      width: scale(28),
      height: scale(28),
      borderRadius: scale(14),
      backgroundColor: COLORS.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: scale(12),
      marginTop: verticalScale(2),
    },
    instructionNumberText: {
      color: COLORS.white,
      fontSize: SIZES.body3,
      fontWeight: 'bold',
    },
    instructionContent: {
      flex: 1,
    },
    instructionHeading: {
      fontSize: SIZES.body2,
      fontWeight: '600',
      color: COLORS.text,
      marginBottom: verticalScale(2),
    },
    instructionText: {
      fontSize: SIZES.body3,
      color: COLORS.muted,
      lineHeight: verticalScale(18),
    },
    instructionNote: {
      flexDirection: 'row',
      backgroundColor: COLORS.lightPrimary,
      padding: scale(12),
      borderRadius: scale(8),
      marginTop: verticalScale(8),
      alignItems: 'center',
    },
    instructionNoteText: {
      fontSize: SIZES.body3,
      color: COLORS.primary,
      marginLeft: scale(8),
      flex: 1,
    },
    previewContainer: {
      backgroundColor: COLORS.white,
      margin: SIZES.padding,
      borderRadius: scale(12),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(2) },
      shadowOpacity: 0.1,
      shadowRadius: scale(8),
      elevation: 3,
      overflow: 'hidden',
    },
    previewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: SIZES.padding,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.lightGray,
    },
    previewTitle: {
      fontSize: SIZES.h3,
      fontWeight: 'bold',
      color: COLORS.primary,
    },
    previewClose: {
      padding: scale(4),
    },
    previewContent: {
      padding: SIZES.padding,
    },
    previewNewspaperTitle: {
      fontSize: SIZES.h2,
      fontWeight: 'bold',
      color: COLORS.text,
      textAlign: 'center',
    },
    previewEdition: {
      fontSize: SIZES.body2,
      color: COLORS.muted,
      textAlign: 'center',
      marginTop: verticalScale(4),
    },
    previewDate: {
      fontSize: SIZES.body3,
      color: COLORS.muted,
      textAlign: 'center',
      marginBottom: verticalScale(8),
    },
    previewDescription: {
      fontSize: SIZES.body2,
      color: COLORS.secondary,
      textAlign: 'center',
      marginVertical: verticalScale(8),
    },
    previewDivider: {
      height: 1,
      backgroundColor: COLORS.lightGray,
      marginVertical: verticalScale(12),
    },
    previewPagesTitle: {
      fontSize: SIZES.h4,
      fontWeight: '600',
      color: COLORS.text,
      marginBottom: verticalScale(8),
    },
    previewPageItem: {
      backgroundColor: COLORS.background,
      padding: scale(12),
      borderRadius: scale(8),
      marginBottom: verticalScale(8),
    },
    previewPageNumber: {
      fontSize: SIZES.body2,
      fontWeight: '600',
      color: COLORS.primary,
    },
    previewPageLayout: {
      fontSize: SIZES.body3,
      color: COLORS.muted,
      marginTop: verticalScale(2),
    },
    previewPageContent: {
      fontSize: SIZES.body3,
      color: COLORS.text,
      marginTop: verticalScale(4),
    },
    previewPageImages: {
      fontSize: SIZES.body3,
      color: COLORS.muted,
      marginTop: verticalScale(2),
    },
    uploadOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    uploadCard: {
      backgroundColor: COLORS.white,
      borderRadius: scale(16),
      padding: scale(24),
      width: '85%',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(4) },
      shadowOpacity: 0.3,
      shadowRadius: scale(12),
      elevation: 8,
    },
    uploadTitle: {
      fontSize: SIZES.h3,
      fontWeight: 'bold',
      color: COLORS.primary,
      marginTop: verticalScale(16),
    },
    uploadSubtitle: {
      fontSize: SIZES.body2,
      color: COLORS.muted,
      textAlign: 'center',
      marginTop: verticalScale(8),
      marginBottom: verticalScale(16),
    },
    progressBarContainer: {
      width: '100%',
      height: scale(8),
      backgroundColor: COLORS.lightGray,
      borderRadius: scale(4),
      overflow: 'hidden',
      marginVertical: verticalScale(8),
    },
    progressBar: {
      height: '100%',
      backgroundColor: COLORS.primary,
      borderRadius: scale(4),
    },
    progressText: {
      fontSize: SIZES.body2,
      fontWeight: '600',
      color: COLORS.primary,
      marginTop: verticalScale(4),
    },
  });
};

export default CreateNewspaper;