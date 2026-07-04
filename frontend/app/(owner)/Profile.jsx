import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  useColorScheme,
  Dimensions,
  PixelRatio,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { getChannelByOwner, channelService } from '../../services/channelService';
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
  modalOverlay:     'rgba(0,0,0,0.5)',
  chipBg:           '#FFFFFF',
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
  modalOverlay:     'rgba(0,0,0,0.7)',
  chipBg:           '#1C2330',
};

export default function OwnerProfile({ navigation }) {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { isLoading: authLoading } = useAuth();

  const [channel, setChannel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedChannel, setEditedChannel] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Image upload states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [tempLogo, setTempLogo] = useState(null);
  const [tempBanner, setTempBanner] = useState(null);

  // State for individual edit fields
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLanguage, setEditLanguage] = useState('');
  const [editLocation, setEditLocation] = useState({
    city: '',
    district: '',
    state: '',
    area: '',
  });
  const [editCategory, setEditCategory] = useState('');

  // Terms modal
  const [termsModalVisible, setTermsModalVisible] = useState(false);

  // Refs for input focus management
  const nameInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  const languageInputRef = useRef(null);
  const categoryInputRef = useRef(null);
  const cityInputRef = useRef(null);
  const districtInputRef = useRef(null);
  const stateInputRef = useRef(null);
  const areaInputRef = useRef(null);

  useEffect(() => {
    if (authLoading) return;
    if (!auth.currentUser) return;
    loadChannel();
  }, [authLoading]);

  const loadChannel = async () => {
    setIsLoading(true);
    try {
      const data = await getChannelByOwner();
      setChannel(data);
      setEditedChannel(data || {});

      // Initialize edit fields with current data
      if (data) {
        setEditName(data.channelName || '');
        setEditDescription(data.description || '');
        setEditLanguage(data.language || '');
        setEditLocation({
          city: data.location?.city || '',
          district: data.location?.district || '',
          state: data.location?.state || '',
          area: data.location?.area || '',
        });
        setEditCategory(data.category || '');
        setTempLogo(data.logo || null);
        setTempBanner(data.banner || null);
      }
    } catch (error) {
      console.error('Error loading channel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Image Picker Functions ─────────────────────────────────────────────

  const pickImage = async (type) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;

      if (type === 'logo') {
        setTempLogo(imageUri);
        await uploadImage(imageUri, 'logo');
      } else {
        setTempBanner(imageUri);
        await uploadImage(imageUri, 'banner');
      }
    }
  };

  const uploadImage = async (imageUri, type) => {
    if (type === 'logo') {
      setUploadingLogo(true);
    } else {
      setUploadingBanner(true);
    }

    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const updateData = {
        [type]: `data:image/jpeg;base64,${base64}`,
      };

      await channelService.update(channel._id, updateData);

      setChannel({
        ...channel,
        ...updateData,
      });

      Alert.alert('Success', `${type === 'logo' ? 'Logo' : 'Banner'} updated successfully!`);
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      Alert.alert('Error', `Failed to update ${type}`);
      if (type === 'logo') {
        setTempLogo(channel.logo || null);
      } else {
        setTempBanner(channel.banner || null);
      }
    } finally {
      if (type === 'logo') {
        setUploadingLogo(false);
      } else {
        setUploadingBanner(false);
      }
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Channel name is required');
      nameInputRef.current?.focus();
      return;
    }

    setIsSaving(true);
    try {
      const updateData = {
        channelName: editName.trim(),
        description: editDescription.trim(),
        language: editLanguage.trim(),
        location: {
          city: editLocation.city.trim(),
          district: editLocation.district.trim(),
          state: editLocation.state.trim(),
          area: editLocation.area.trim(),
        },
        category: editCategory.trim(),
      };

      await channelService.update(channel._id, updateData);

      setChannel({
        ...channel,
        ...updateData,
      });
      setEditedChannel({
        ...editedChannel,
        ...updateData,
      });

      setIsEditing(false);
      Alert.alert('Success', 'Channel updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update channel');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            navigation.replace('Welcome');
          } catch {
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  const handleCancelEdit = () => {
    if (channel) {
      setEditName(channel.channelName || '');
      setEditDescription(channel.description || '');
      setEditLanguage(channel.language || '');
      setEditLocation({
        city: channel.location?.city || '',
        district: channel.location?.district || '',
        state: channel.location?.state || '',
        area: channel.location?.area || '',
      });
      setEditCategory(channel.category || '');
      setTempLogo(channel.logo || null);
      setTempBanner(channel.banner || null);
    }
    setIsEditing(false);
    Keyboard.dismiss();
  };

  const handleEditPress = () => {
    if (isEditing) {
      handleCancelEdit();
    } else {
      setIsEditing(true);
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 300);
    }
  };

  const handleNextInput = (nextRef) => {
    nextRef.current?.focus();
  };

  // ─── Terms Content ────────────────────────────────────────────────────────
  const TermsContent = () => (
    <View>
      <Text style={[s.termsSectionTitle, { color: C.primary }]}>1. Acceptance of Terms</Text>
      <Text style={[s.termsText, { color: C.secondary }]}>
        By using BartaOne, you agree to these terms and conditions. If you do not agree, please do not use our services.
      </Text>

      <Text style={[s.termsSectionTitle, { color: C.primary }]}>2. User Accounts</Text>
      <Text style={[s.termsText, { color: C.secondary }]}>
        • You must be at least 13 years old to create an account{'\n'}
        • You are responsible for maintaining the confidentiality of your account{'\n'}
        • You agree to provide accurate and complete information{'\n'}
        • You are solely responsible for all activities under your account
      </Text>

      <Text style={[s.termsSectionTitle, { color: C.primary }]}>3. Content Guidelines</Text>
      <Text style={[s.termsText, { color: C.secondary }]}>
        • Users may post news, comments, and other content{'\n'}
        • Content must be accurate and not misleading{'\n'}
        • No hate speech, harassment, or discriminatory content{'\n'}
        • No spam, fraudulent, or misleading information{'\n'}
        • We reserve the right to remove any content at our discretion
      </Text>

      <Text style={[s.termsSectionTitle, { color: C.primary }]}>4. Intellectual Property</Text>
      <Text style={[s.termsText, { color: C.secondary }]}>
        • All content on BartaOne is protected by copyright{'\n'}
        • You retain ownership of content you post{'\n'}
        • You grant us a license to use your content on our platform{'\n'}
        • Do not reproduce, distribute, or modify content without permission
      </Text>

      <Text style={[s.termsSectionTitle, { color: C.primary }]}>5. Privacy and Data</Text>
      <Text style={[s.termsText, { color: C.secondary }]}>
        • We collect and process personal data as described in our Privacy Policy{'\n'}
        • You consent to our collection and use of your data{'\n'}
        • We use cookies and similar technologies{'\n'}
        • You have rights to access, modify, or delete your data
      </Text>

      <Text style={[s.termsSectionTitle, { color: C.primary }]}>6. Community Guidelines</Text>
      <Text style={[s.termsText, { color: C.secondary }]}>
        • Be respectful and constructive in discussions{'\n'}
        • Fact-check information before sharing{'\n'}
        • Report inappropriate content to our team{'\n'}
        • Help us maintain a positive community environment
      </Text>

      <Text style={[s.termsSectionTitle, { color: C.primary }]}>7. Termination</Text>
      <Text style={[s.termsText, { color: C.secondary }]}>
        • We may terminate or suspend your account without notice{'\n'}
        • You can delete your account at any time{'\n'}
        • Certain obligations survive termination
      </Text>

      <Text style={[s.termsSectionTitle, { color: C.primary }]}>8. Limitation of Liability</Text>
      <Text style={[s.termsText, { color: C.secondary }]}>
        • BartaOne is provided "as is" without warranties{'\n'}
        • We are not liable for any damages arising from use{'\n'}
        • We do not guarantee accuracy of user-generated content{'\n'}
        • Your use of the platform is at your own risk
      </Text>

      <Text style={[s.termsSectionTitle, { color: C.primary }]}>9. Changes to Terms</Text>
      <Text style={[s.termsText, { color: C.secondary }]}>
        • We may update these terms periodically{'\n'}
        • Continued use constitutes acceptance of changes{'\n'}
        • We will notify you of significant changes
      </Text>

      <Text style={[s.termsSectionTitle, { color: C.primary }]}>10. Contact Information</Text>
      <Text style={[s.termsText, { color: C.secondary }]}>
        For questions about these terms, contact us at:{'\n'}
        support@bartaone.com{'\n'}
        +91 98765 43210
      </Text>

      <View style={[s.termsFooter, { borderTopColor: C.border }]}>
        <Text style={[s.termsFooterText, { color: C.muted }]}>Last Updated: January 2026</Text>
        <Text style={[s.termsFooterText, { color: C.muted }]}>Version 2.0</Text>
      </View>
    </View>
  );

  if (authLoading || isLoading) return <Loader message="Loading profile…" />;

  if (!channel) {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: C.bg }]}>
        <View style={s.errorBox}>
          <View style={s.errorIconWrap}>
            <Ionicons name="newspaper-outline" size={scale(48)} color={C.muted} />
          </View>
          <Text style={[s.errorTitle, { color: C.primary }]}>No Channel Found</Text>
          <Text style={[s.errorSub, { color: C.muted }]}>Create a channel to get started</Text>
          <TouchableOpacity
            style={[s.createBtn, { backgroundColor: C.accent }]}
            onPress={() => navigation.navigate('CreateChannel')}
          >
            <Text style={s.createBtnText}>Create Channel</Text>
            <Ionicons name="arrow-forward" size={scale(18)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.topStripe} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={scale(20)} color={C.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Channel Profile</Text>
        <TouchableOpacity onPress={handleEditPress}>
          <Text style={[s.editBtn, { color: C.accent }]}>
            {isEditing ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        style={s.keyboardAwareScrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraHeight={Platform.OS === 'ios' ? 150 : 100}
        extraScrollHeight={Platform.OS === 'ios' ? 50 : 30}
        enableResetScrollToCoords={false}
        keyboardOpeningTime={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            {/* Banner with upload button */}
            <TouchableOpacity
              style={s.bannerContainer}
              onPress={() => {
                if (isEditing) {
                  pickImage('banner');
                }
              }}
              activeOpacity={isEditing ? 0.7 : 1}
            >
              <Image
                source={{ uri: tempBanner || channel.banner || 'https://via.placeholder.com/800x200' }}
                style={s.banner}
              />
              {isEditing && (
                <View style={[s.bannerOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                  {uploadingBanner ? (
                    <ActivityIndicator color="#FFF" size="large" />
                  ) : (
                    <View style={s.bannerUploadBtn}>
                      <Ionicons name="camera-outline" size={scale(28)} color="#FFF" />
                      <Text style={s.bannerUploadText}>Update Banner</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>

            {/* Logo with upload button */}
            <View style={s.logoWrap}>
              <TouchableOpacity
                style={s.logoContainer}
                onPress={() => {
                  if (isEditing) {
                    pickImage('logo');
                  }
                }}
                activeOpacity={isEditing ? 0.7 : 1}
                disabled={!isEditing}
              >
                <Image
                  source={{ uri: tempLogo || channel.logo || 'https://via.placeholder.com/100' }}
                  style={s.logo}
                />
                {isEditing && (
                  <View style={[s.logoOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    {uploadingLogo ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Ionicons name="camera" size={scale(20)} color="#FFF" />
                    )}
                  </View>
                )}
              </TouchableOpacity>
              {isEditing && (
                <Text style={[s.logoHint, { color: C.muted }]}>Tap to change logo</Text>
              )}
            </View>

            {/* Info Card */}
            <View style={[s.card, { backgroundColor: C.surface, borderColor: C.border }]}>
              {isEditing ? (
                // ─── EDIT MODE ────────────────────────────────────────────────
                <>
                  <View style={s.cardHeader}>
                    <Ionicons name="create-outline" size={scale(18)} color={C.accent} />
                    <Text style={[s.cardHeaderText, { color: C.primary }]}>Edit Channel Details</Text>
                  </View>

                  <View style={s.cardDivider} />

                  {/* Channel Name */}
                  <View style={s.fieldGroup}>
                    <Text style={[s.fieldLabel, { color: C.secondary }]}>
                      Channel Name <Text style={{ color: C.accent }}>*</Text>
                    </Text>
                    <View style={[s.inputWrap, { borderColor: C.inputBorder }]}>
                      <Ionicons name="pencil-outline" size={scale(18)} color={C.muted} style={s.inputIcon} />
                      <TextInput
                        ref={nameInputRef}
                        style={[s.input, { color: C.primary }]}
                        value={editName}
                        onChangeText={setEditName}
                        placeholder="Enter channel name"
                        placeholderTextColor={C.muted}
                        returnKeyType="next"
                        onSubmitEditing={() => handleNextInput(descriptionInputRef)}
                      />
                    </View>
                  </View>

                  {/* Description */}
                  <View style={s.fieldGroup}>
                    <Text style={[s.fieldLabel, { color: C.secondary }]}>Description</Text>
                    <View style={[s.inputWrap, s.textAreaWrap, { borderColor: C.inputBorder }]}>
                      <TextInput
                        ref={descriptionInputRef}
                        style={[s.input, s.textAreaInput, { color: C.primary }]}
                        value={editDescription}
                        onChangeText={setEditDescription}
                        placeholder="Describe your channel"
                        placeholderTextColor={C.muted}
                        multiline={true}
                        numberOfLines={4}
                        textAlignVertical="top"
                        returnKeyType="next"
                        onSubmitEditing={() => handleNextInput(languageInputRef)}
                      />
                    </View>
                  </View>

                  {/* Language */}
                  <View style={s.fieldGroup}>
                    <Text style={[s.fieldLabel, { color: C.secondary }]}>Language</Text>
                    <View style={[s.inputWrap, { borderColor: C.inputBorder }]}>
                      <Ionicons name="language-outline" size={scale(18)} color={C.muted} style={s.inputIcon} />
                      <TextInput
                        ref={languageInputRef}
                        style={[s.input, { color: C.primary }]}
                        value={editLanguage}
                        onChangeText={setEditLanguage}
                        placeholder="e.g., English, Hindi, Bengali"
                        placeholderTextColor={C.muted}
                        returnKeyType="next"
                        onSubmitEditing={() => handleNextInput(categoryInputRef)}
                      />
                    </View>
                  </View>

                  {/* Category */}
                  <View style={s.fieldGroup}>
                    <Text style={[s.fieldLabel, { color: C.secondary }]}>Category</Text>
                    <View style={[s.inputWrap, { borderColor: C.inputBorder }]}>
                      <Ionicons name="pricetag-outline" size={scale(18)} color={C.muted} style={s.inputIcon} />
                      <TextInput
                        ref={categoryInputRef}
                        style={[s.input, { color: C.primary }]}
                        value={editCategory}
                        onChangeText={setEditCategory}
                        placeholder="e.g., News, Sports, Entertainment"
                        placeholderTextColor={C.muted}
                        returnKeyType="next"
                        onSubmitEditing={() => handleNextInput(cityInputRef)}
                      />
                    </View>
                  </View>

                  {/* Location Section */}
                  <Text style={[s.sectionLabel, { color: C.secondary }]}>Location Details</Text>

                  {/* City */}
                  <View style={s.fieldGroup}>
                    <Text style={[s.fieldLabel, { color: C.secondary }]}>City</Text>
                    <View style={[s.inputWrap, { borderColor: C.inputBorder }]}>
                      <Ionicons name="location-outline" size={scale(18)} color={C.muted} style={s.inputIcon} />
                      <TextInput
                        ref={cityInputRef}
                        style={[s.input, { color: C.primary }]}
                        value={editLocation.city}
                        onChangeText={(text) => setEditLocation({ ...editLocation, city: text })}
                        placeholder="Enter city"
                        placeholderTextColor={C.muted}
                        returnKeyType="next"
                        onSubmitEditing={() => handleNextInput(districtInputRef)}
                      />
                    </View>
                  </View>

                  {/* District */}
                  <View style={s.fieldGroup}>
                    <Text style={[s.fieldLabel, { color: C.secondary }]}>District</Text>
                    <View style={[s.inputWrap, { borderColor: C.inputBorder }]}>
                      <Ionicons name="map-outline" size={scale(18)} color={C.muted} style={s.inputIcon} />
                      <TextInput
                        ref={districtInputRef}
                        style={[s.input, { color: C.primary }]}
                        value={editLocation.district}
                        onChangeText={(text) => setEditLocation({ ...editLocation, district: text })}
                        placeholder="Enter district"
                        placeholderTextColor={C.muted}
                        returnKeyType="next"
                        onSubmitEditing={() => handleNextInput(stateInputRef)}
                      />
                    </View>
                  </View>

                  {/* State */}
                  <View style={s.fieldGroup}>
                    <Text style={[s.fieldLabel, { color: C.secondary }]}>State</Text>
                    <View style={[s.inputWrap, { borderColor: C.inputBorder }]}>
                      <Ionicons name="flag-outline" size={scale(18)} color={C.muted} style={s.inputIcon} />
                      <TextInput
                        ref={stateInputRef}
                        style={[s.input, { color: C.primary }]}
                        value={editLocation.state}
                        onChangeText={(text) => setEditLocation({ ...editLocation, state: text })}
                        placeholder="Enter state"
                        placeholderTextColor={C.muted}
                        returnKeyType="next"
                        onSubmitEditing={() => handleNextInput(areaInputRef)}
                      />
                    </View>
                  </View>

                  {/* Area */}
                  <View style={s.fieldGroup}>
                    <Text style={[s.fieldLabel, { color: C.secondary }]}>Area (Optional)</Text>
                    <View style={[s.inputWrap, { borderColor: C.inputBorder }]}>
                      <Ionicons name="home-outline" size={scale(18)} color={C.muted} style={s.inputIcon} />
                      <TextInput
                        ref={areaInputRef}
                        style={[s.input, { color: C.primary }]}
                        value={editLocation.area}
                        onChangeText={(text) => setEditLocation({ ...editLocation, area: text })}
                        placeholder="Enter specific area"
                        placeholderTextColor={C.muted}
                        returnKeyType="done"
                        onSubmitEditing={handleSave}
                      />
                    </View>
                  </View>

                  {/* Save Button */}
                  <TouchableOpacity
                    style={[s.saveBtn, { backgroundColor: C.accent, opacity: isSaving ? 0.7 : 1 }]}
                    onPress={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={s.saveBtnText}>Save Changes</Text>
                        <Ionicons name="checkmark-circle" size={scale(20)} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                // ─── VIEW MODE ────────────────────────────────────────────────
                <>
                  <Text style={[s.channelName, { color: C.primary }]}>{channel.channelName}</Text>

                  {channel.isVerified && (
                    <View style={s.verifiedRow}>
                      <Ionicons name="checkmark-circle" size={14} color="#0E8A5A" />
                      <Text style={s.verifiedText}>Verified Channel</Text>
                    </View>
                  )}

                  <Text style={[s.description, { color: C.secondary }]}>
                    {channel.description || 'No description provided'}
                  </Text>

                  <View style={[s.divider, { backgroundColor: C.border }]} />

                  <View style={s.detailsGrid}>
                    {[
                      { icon: 'language-outline', text: channel.language || 'Not specified' },
                      { icon: 'location-outline', text: getFullLocation(channel.location) || 'No location specified' },
                      { icon: 'pricetag-outline', text: channel.category || 'News' },
                      { icon: 'people-outline', text: `${channel.followers || 0} followers` },
                    ].map(({ icon, text }, index) => (
                      <View key={icon} style={[
                        s.detailRow,
                        index < 3 && s.detailRowBorder
                      ]}>
                        <View style={[s.detailIconWrap, { backgroundColor: C.accentBg }]}>
                          <Ionicons name={icon} size={scale(16)} color={C.accent} />
                        </View>
                        <Text style={[s.detailText, { color: C.secondary }]}>{text}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={[s.divider, { backgroundColor: C.border }]} />

                  {/* Logout Button */}
                  <TouchableOpacity style={[s.logoutBtn, { borderColor: C.accent }]} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={scale(20)} color={C.accent} />
                    <Text style={[s.logoutText, { color: C.accent }]}>Logout</Text>
                  </TouchableOpacity>

                  {/* Terms Link */}
                  <TouchableOpacity
                    style={s.termsLink}
                    onPress={() => setTermsModalVisible(true)}
                  >
                    <Text style={[s.termsLinkText, { color: C.muted }]}>
                      Terms & Conditions
                    </Text>
                    <Ionicons name="chevron-forward" size={scale(14)} color={C.muted} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAwareScrollView>

      {/* ─── Terms & Conditions Modal ─────────────────────────────────────── */}
      <Modal
        visible={termsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={[s.modalOverlay, { backgroundColor: C.modalOverlay }]}>
          <View style={[s.modalContainer, { backgroundColor: C.surface }]}>
            <View style={[s.modalHeader, { borderBottomColor: C.border }]}>
              <Text style={[s.modalTitle, { color: C.primary }]}>Terms & Conditions</Text>
              <TouchableOpacity
                style={[s.modalCloseBtn, { backgroundColor: C.accentBg }]}
                onPress={() => setTermsModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={scale(22)} color={C.accent} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={s.modalScrollView}
              contentContainerStyle={s.modalContent}
              showsVerticalScrollIndicator={true}
            >
              <TermsContent />
              <TouchableOpacity
                style={[s.acceptBtn, { backgroundColor: C.accent }]}
                onPress={() => setTermsModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={s.acceptBtnText}>I Understand</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Helper function to format full location
function getFullLocation(location) {
  if (!location) return null;
  const parts = [];
  if (location.city) parts.push(location.city);
  if (location.district) parts.push(location.district);
  if (location.state) parts.push(location.state);
  if (location.area) parts.push(location.area);
  return parts.join(', ') || null;
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
    keyboardAwareScrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: vs(20),
    },

    // Error State
    errorBox: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: scale(32),
      gap: vs(12),
    },
    errorIconWrap: {
      width: scale(80),
      height: scale(80),
      borderRadius: scale(40),
      backgroundColor: C.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: C.border,
    },
    errorTitle: {
      fontSize: sp(20),
      fontWeight: '700',
    },
    errorSub: {
      fontSize: sp(14),
      textAlign: 'center',
    },
    createBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(8),
      paddingHorizontal: scale(24),
      paddingVertical: vs(14),
      borderRadius: scale(12),
      marginTop: vs(8),
      shadowColor: C.accent,
      shadowOffset: { width: 0, height: scale(4) },
      shadowOpacity: 0.3,
      shadowRadius: scale(12),
      elevation: 4,
    },
    createBtnText: {
      color: '#FFF',
      fontSize: sp(16),
      fontWeight: '700',
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: scale(20),
      paddingVertical: vs(14),
      backgroundColor: C.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border,
    },
    backBtn: {
      width: scale(36),
      height: scale(36),
      borderRadius: scale(10),
      backgroundColor: C.bg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: sp(17),
      fontWeight: '700',
      color: C.primary,
    },
    editBtn: {
      fontSize: sp(15),
      fontWeight: '600',
    },

    // Banner
    bannerContainer: {
      width: '100%',
      height: vs(160),
      position: 'relative',
    },
    banner: {
      width: '100%',
      height: vs(160),
      resizeMode: 'cover',
    },
    bannerOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bannerUploadBtn: {
      alignItems: 'center',
      gap: vs(8),
    },
    bannerUploadText: {
      color: '#FFF',
      fontSize: sp(14),
      fontWeight: '600',
    },

    // Logo
    logoWrap: {
      alignItems: 'center',
      marginTop: -vs(50),
      marginBottom: vs(8),
    },
    logoContainer: {
      position: 'relative',
      width: scale(100),
      height: scale(100),
    },
    logo: {
      width: scale(100),
      height: scale(100),
      borderRadius: scale(50),
      borderWidth: 4,
      borderColor: C.surface,
    },
    logoOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: scale(50),
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoHint: {
      fontSize: sp(11),
      marginTop: vs(4),
    },

    // Card
    card: {
      marginHorizontal: scale(16),
      marginTop: vs(4),
      padding: scale(20),
      borderRadius: scale(16),
      borderWidth: StyleSheet.hairlineWidth,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(4) },
      shadowOpacity: C.cardShadowOpacity,
      shadowRadius: scale(16),
      elevation: 4,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(8),
    },
    cardHeaderText: {
      fontSize: sp(16),
      fontWeight: '700',
    },
    cardDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: C.border,
      marginVertical: vs(14),
    },

    // View Mode
    channelName: {
      fontSize: sp(24),
      fontWeight: '800',
      textAlign: 'center',
      letterSpacing: -0.4,
    },
    verifiedRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: scale(4),
      marginTop: vs(4),
    },
    verifiedText: {
      fontSize: sp(12),
      color: '#0E8A5A',
      fontWeight: '600',
    },
    description: {
      fontSize: sp(14),
      lineHeight: sp(21),
      marginTop: vs(10),
      textAlign: 'center',
    },
    detailsGrid: {
      marginTop: vs(4),
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(12),
      paddingVertical: vs(10),
    },
    detailRowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border,
    },
    detailIconWrap: {
      width: scale(32),
      height: scale(32),
      borderRadius: scale(8),
      justifyContent: 'center',
      alignItems: 'center',
    },
    detailText: {
      fontSize: sp(14),
      fontWeight: '500',
      flex: 1,
    },

    divider: {
      height: StyleSheet.hairlineWidth,
      marginVertical: vs(14),
    },

    // Logout
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      paddingVertical: vs(12),
      borderRadius: scale(12),
      gap: scale(8),
    },
    logoutText: {
      fontSize: sp(15),
      fontWeight: '600',
    },

    // Terms Link
    termsLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: scale(4),
      marginTop: vs(12),
      paddingVertical: vs(8),
    },
    termsLinkText: {
      fontSize: sp(12),
      fontWeight: '500',
    },

    // Edit Mode - Inputs
    fieldGroup: {
      marginBottom: vs(14),
    },
    fieldLabel: {
      fontSize: sp(12),
      fontWeight: '600',
      marginBottom: vs(6),
      letterSpacing: 0.2,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderRadius: scale(11),
      paddingHorizontal: scale(14),
      backgroundColor: C.inputBg,
    },
    inputIcon: {
      marginRight: scale(10),
    },
    input: {
      flex: 1,
      paddingVertical: vs(12),
      fontSize: sp(14),
      fontWeight: '400',
    },
    textAreaWrap: {
      alignItems: 'flex-start',
      paddingTop: vs(10),
    },
    textAreaInput: {
      minHeight: vs(80),
      paddingVertical: vs(4),
    },
    sectionLabel: {
      fontSize: sp(13),
      fontWeight: '700',
      marginBottom: vs(10),
      marginTop: vs(4),
      letterSpacing: 0.2,
    },

    // Save Button
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: vs(14),
      borderRadius: scale(12),
      gap: scale(8),
      marginTop: vs(8),
      shadowColor: C.accent,
      shadowOffset: { width: 0, height: scale(4) },
      shadowOpacity: 0.3,
      shadowRadius: scale(12),
      elevation: 4,
    },
    saveBtnText: {
      color: '#FFFFFF',
      fontSize: sp(16),
      fontWeight: '700',
    },

    // Modal
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalContainer: {
      flex: 0.92,
      borderTopLeftRadius: scale(24),
      borderTopRightRadius: scale(24),
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: scale(20),
      paddingVertical: vs(16),
      borderBottomWidth: 1,
    },
    modalTitle: {
      fontSize: sp(18),
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    modalCloseBtn: {
      width: scale(38),
      height: scale(38),
      borderRadius: scale(19),
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalScrollView: {
      flex: 1,
    },
    modalContent: {
      paddingHorizontal: scale(20),
      paddingTop: vs(20),
      paddingBottom: vs(30),
    },

    // Terms
    termsSectionTitle: {
      fontSize: sp(16),
      fontWeight: '700',
      marginTop: vs(18),
      marginBottom: vs(8),
      letterSpacing: -0.2,
    },
    termsText: {
      fontSize: sp(13.5),
      lineHeight: sp(22),
      marginBottom: vs(4),
      fontWeight: '400',
    },
    termsFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: vs(24),
      paddingTop: vs(16),
      borderTopWidth: 1,
    },
    termsFooterText: {
      fontSize: sp(11),
      fontWeight: '400',
    },
    acceptBtn: {
      paddingVertical: vs(14),
      borderRadius: scale(12),
      alignItems: 'center',
      marginTop: vs(20),
    },
    acceptBtnText: {
      color: '#FFFFFF',
      fontSize: sp(16),
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });
}