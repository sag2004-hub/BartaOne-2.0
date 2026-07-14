// app/(owner)/CreateChannel.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  PixelRatio,
  useColorScheme,
  Platform,
  StatusBar,
  Alert,
  Image,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { channelService } from '../../services/channelService';
import { auth } from '../../services/firebase';
import Loader from '../../components/Loader';
import { useRouter } from 'expo-router';

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
  return Math.round((size * clamped) / PixelRatio.getFontScale());
};

// ─── Theme ──────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: '#F2F0EB',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFAF8',
  border: '#E4E0D8',
  accent: '#C8001A',
  accentBg: '#FFF0F2',
  accentBorder: 'rgba(200,0,26,0.18)',
  navy: '#0F1923',
  primary: '#1A2733',
  secondary: '#4A5A6B',
  muted: '#8A97A5',
  faint: '#B8C0B8',
  white: '#FFFFFF',
  statusBar: 'dark-content',
  iconBlue: '#1A6DC8',
  iconBlueBg: '#EFF5FF',
  iconGreen: '#0E8A5A',
  iconGreenBg: '#EDFAF3',
  iconPurple: '#7C3AED',
  iconPurpleBg: '#F5F0FF',
  iconAmber: '#B87500',
  iconAmberBg: '#FFF7E8',
  cardShadowOpacity: 0.06,
  chipBg: '#FFFFFF',
  inputBg: '#FFFFFF',
  errorBg: '#FFF5F5',
};

const DARK = {
  bg: '#0D1117',
  surface: '#161B22',
  surfaceAlt: '#1C2330',
  border: '#2A3340',
  accent: '#E8192C',
  accentBg: 'rgba(232,25,44,0.12)',
  accentBorder: 'rgba(232,25,44,0.25)',
  navy: '#E8EDF2',
  primary: '#EDF2F7',
  secondary: '#8B9BAB',
  muted: '#5C6E80',
  faint: '#3A4A58',
  white: '#FFFFFF',
  statusBar: 'light-content',
  iconBlue: '#60A5FA',
  iconBlueBg: 'rgba(96,165,250,0.12)',
  iconGreen: '#34D399',
  iconGreenBg: 'rgba(52,211,153,0.12)',
  iconPurple: '#A78BFA',
  iconPurpleBg: 'rgba(167,139,250,0.12)',
  iconAmber: '#FBBF24',
  iconAmberBg: 'rgba(251,191,36,0.12)',
  cardShadowOpacity: 0.35,
  chipBg: '#1C2330',
  inputBg: '#161B22',
  errorBg: 'rgba(232,25,44,0.08)',
};

// ─── Static data ─────────────────────────────────────────────────────────────
const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'हिन्दी', value: 'hi' },
  { label: 'বাংলা', value: 'bn' },
  { label: 'తెలుగు', value: 'te' },
  { label: 'मराठी', value: 'mr' },
  { label: 'தமிழ்', value: 'ta' },
  { label: 'ગુજરાતી', value: 'gu' },
  { label: 'ಕನ್ನಡ', value: 'kn' },
  { label: 'മലയാളം', value: 'ml' },
  { label: 'ଓଡ଼ିଆ', value: 'or' },
  { label: 'ਪੰਜਾਬੀ', value: 'pa' },
  { label: 'অসমীয়া', value: 'as' },
];

const CATEGORIES = [
  { label: 'News', value: 'news', icon: 'newspaper-outline' },
  { label: 'Entertainment', value: 'entertainment', icon: 'film-outline' },
  { label: 'Sports', value: 'sports', icon: 'trophy-outline' },
  { label: 'Business', value: 'business', icon: 'briefcase-outline' },
  { label: 'Technology', value: 'technology', icon: 'hardware-chip-outline' },
  { label: 'Lifestyle', value: 'lifestyle', icon: 'heart-outline' },
  { label: 'Other', value: 'other', icon: 'ellipsis-horizontal-outline' },
];

// ─── Section header ───────────────────────────────────────────────────────────
function SectionLabel({ label, C }) {
  return (
    <Text
      style={{
        fontSize: fontScale(10),
        fontWeight: '700',
        color: C.faint,
        letterSpacing: 1.3,
        textTransform: 'uppercase',
        marginBottom: verticalScale(10),
      }}
    >
      {label}
    </Text>
  );
}

// ─── Animated card wrapper ────────────────────────────────────────────────────
function AnimCard({ opacity, translateY, scale: scaleVal, children, style, C }) {
  return (
    <Animated.View
      style={[
        {
          opacity,
          transform: [{ translateY: translateY ?? 0 }, { scale: scaleVal ?? 1 }],
          backgroundColor: C.surface,
          borderRadius: scale(18),
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: C.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: scale(4) },
          shadowOpacity: C.cardShadowOpacity,
          shadowRadius: scale(16),
          elevation: 4,
          marginBottom: verticalScale(14),
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ─── Inline field error ───────────────────────────────────────────────────────
function FieldError({ msg, C }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: verticalScale(5),
        gap: scale(4),
      }}
    >
      <Ionicons name="alert-circle" size={moderateScale(12)} color={C.accent} />
      <Text style={{ fontSize: fontScale(11.5), color: C.accent, fontWeight: '500' }}>
        {msg}
      </Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CreateChannel() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { user, loading: authLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Creating your channel…');
  const [formData, setFormData] = useState({
    channelName: '',
    description: '',
    language: 'en',
    state: '',
    district: '',
    city: '',
    area: '',
    category: 'news',
  });
  const [logo, setLogo] = useState(null);
  const [banner, setBanner] = useState(null);
  const [errors, setErrors] = useState({});

  // ── Refs ──
  // KeyboardAwareScrollView ref for manual scroll if needed
  const scrollRef = useRef(null);

  // ── Animated values ──
  const headerAnim = useRef(new Animated.Value(0)).current;
  const mediaAnim = useRef(new Animated.Value(0)).current;
  const mediaY = useRef(new Animated.Value(verticalScale(24))).current;
  const mediaScale = useRef(new Animated.Value(0.96)).current;
  const infoAnim = useRef(new Animated.Value(0)).current;
  const infoY = useRef(new Animated.Value(verticalScale(24))).current;
  const langAnim = useRef(new Animated.Value(0)).current;
  const langY = useRef(new Animated.Value(verticalScale(24))).current;
  const catAnim = useRef(new Animated.Value(0)).current;
  const catY = useRef(new Animated.Value(verticalScale(24))).current;
  const locAnim = useRef(new Animated.Value(0)).current;
  const locY = useRef(new Animated.Value(verticalScale(24))).current;
  const btnAnim = useRef(new Animated.Value(0)).current;
  const btnY = useRef(new Animated.Value(verticalScale(18))).current;
  const btnPulse = useRef(new Animated.Value(1)).current;
  const logoPickerScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(mediaAnim, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(mediaY, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
        Animated.spring(mediaScale, {
          toValue: 1,
          friction: 8,
          tension: 55,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(infoAnim, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(infoY, { toValue: 0, friction: 8, tension: 62, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(langAnim, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(langY, { toValue: 0, friction: 8, tension: 62, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(catAnim, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(catY, { toValue: 0, friction: 8, tension: 62, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(locAnim, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(locY, { toValue: 0, friction: 8, tension: 62, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(btnAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(btnY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(btnPulse, {
          toValue: 1.022,
          duration: 850,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(btnPulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // ─── Image picker ────────────────────────────────────────────────────────────
  const pickImage = async (type) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant access to your photo library.');
      return;
    }

    if (type === 'logo') {
      Animated.sequence([
        Animated.spring(logoPickerScale, {
          toValue: 0.92,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.spring(logoPickerScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.85,
    });

    if (!result.canceled) {
      if (type === 'logo') {
        setLogo(result.assets[0]);
        setErrors((e) => ({ ...e, logo: null }));
      } else {
        setBanner(result.assets[0]);
      }
    }
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateForm = () => {
    const e = {};
    if (!formData.channelName.trim()) e.channelName = 'Channel name is required';
    if (!formData.description.trim()) e.description = 'Description is required';
    if (!formData.state.trim()) e.state = 'State is required';
    if (!formData.district.trim()) e.district = 'District is required';
    if (!formData.city.trim()) e.city = 'City is required';
    if (!logo) e.logo = 'Channel logo is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Navigate to dashboard ────────────────────────────────────────────────────
  const goToDashboard = () => {
    try {
      router.replace('/(owner)/Dashboard');
    } catch (error) {
      console.error('Navigation error:', error);
      try {
        router?.replace('/(owner)');
      } catch (e) {
        console.error('Failed to navigate:', e);
        Alert.alert(
          'Navigation Error',
          'Could not navigate to dashboard. Please restart the app.'
        );
      }
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validateForm()) return;

    setIsLoading(true);
    setLoadingMsg('Creating your channel…');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Session expired', 'Please sign in again.');
        setIsLoading(false);
        return;
      }

      console.log('✅ Creating channel for user:', currentUser.uid);

      const jsonPayload = {
        channelName: formData.channelName.trim(),
        description: formData.description.trim(),
        language: formData.language,
        category: formData.category,
        location: {
          state: formData.state.trim(),
          district: formData.district.trim(),
          city: formData.city.trim(),
          area: formData.area.trim() || '',
        },
      };

      console.log('📤 Sending channel payload:', JSON.stringify(jsonPayload, null, 2));

      const response = await channelService.create(jsonPayload);
      console.log('📝 Response:', JSON.stringify(response, null, 2));

      let channelId = null;

      if (response) {
        if (response.data) {
          channelId = response.data._id || response.data.id || response.data.channelId;
          if (!channelId && response.data.data) {
            channelId = response.data.data._id || response.data.data.id;
          }
        } else {
          channelId = response._id || response.id || response.channelId;
        }
      }

      if (!channelId && typeof response === 'string') channelId = response;

      console.log('✅ Extracted channelId:', channelId);

      if (!channelId) {
        console.error('❌ Could not extract channel ID from response:', response);
        throw new Error('Channel created but no ID was returned. Please contact support.');
      }

      if (logo || banner) {
        setLoadingMsg('Uploading images…');

        try {
          const uploadData = new FormData();

          if (logo) {
            uploadData.append('logo', {
              uri: logo.uri,
              name: logo.fileName || `logo-${Date.now()}.jpg`,
              type: logo.mimeType || 'image/jpeg',
            });
          }

          if (banner) {
            uploadData.append('banner', {
              uri: banner.uri,
              name: banner.fileName || `banner-${Date.now()}.jpg`,
              type: banner.mimeType || 'image/jpeg',
            });
          }

          await channelService.update(channelId, uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          console.log('✅ Images uploaded successfully');
        } catch (imgErr) {
          console.warn('⚠️ Image upload failed but channel was created:', imgErr.message);
          Alert.alert(
            'Channel Created',
            'Your channel was created but there was an issue uploading images. You can add them later from the dashboard.',
            [{ text: 'Go to Dashboard', onPress: () => goToDashboard() }]
          );
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(false);
      Alert.alert(
        '🎉 Channel Created!',
        'Your channel has been created successfully and is ready to publish.',
        [{ text: 'Go to Dashboard', onPress: () => goToDashboard() }]
      );
    } catch (err) {
      console.error('❌ CreateChannel Error:', err.message);

      let errorMessage = 'Failed to create channel. Please try again.';

      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        if (status === 400) {
          if (data.message?.includes('already exists')) {
            errorMessage = 'A channel with this name already exists. Please choose a different name.';
          } else if (data.message?.includes('owner')) {
            errorMessage = 'You already have a channel. Only one channel per owner is allowed.';
          } else {
            errorMessage = data.message || 'Invalid channel data. Please check your inputs.';
          }
        } else if (status === 401 || status === 403) {
          errorMessage = 'You are not authorized to create a channel. Please login again.';
        } else if (status === 409) {
          errorMessage = 'A channel with this name already exists.';
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = data.message || `Error ${status}: Failed to create channel.`;
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setIsLoading(false);
      Alert.alert('Creation Failed', errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingMsg('Creating your channel…');
    }
  };

  const update = (key, val) => setFormData((f) => ({ ...f, [key]: val }));
  const clearErr = (key) => setErrors((e) => ({ ...e, [key]: null }));

  if (authLoading) return <Loader message="Loading…" />;
  if (isLoading) return <Loader message={loadingMsg} />;

  const s = makeStyles(C);

  const headerTranslateY = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-verticalScale(60), 0],
  });

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} translucent={false} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          s.header,
          {
            opacity: headerAnim,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Create Channel</Text>
        </View>
      </Animated.View>

      {/*
        ── KEY FIX ─────────────────────────────────────────────────────────────
        Replace KeyboardAvoidingView + TouchableWithoutFeedback + ScrollView
        with a single KeyboardAwareScrollView.

        Props explained:
          • enableOnAndroid={true}          → opt-in for Android (off by default)
          • extraScrollHeight={verticalScale(100)}
                                            → extra breathing room above the
                                              focused input so the keyboard
                                              doesn't sit right against the field
          • keyboardShouldPersistTaps="handled"
                                            → taps on non-input elements still
                                              dismiss the keyboard; taps on
                                              buttons/chips work correctly
          • enableResetScrollToCoords={false}
                                            → don't snap back to top on blur
          • showsVerticalScrollIndicator={false}
          • bounces={true}
      ──────────────────────────────────────────────────────────────────────── */}
      <KeyboardAwareScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        enableOnAndroid
        extraScrollHeight={verticalScale(100)}
        keyboardShouldPersistTaps="handled"
        enableResetScrollToCoords={false}
        showsVerticalScrollIndicator={false}
        bounces
        scrollEventThrottle={16}
      >
        <View style={s.contentWrapper}>
          <Text style={s.pageSubtitle}>
            Set up your news channel to start publishing to your community
          </Text>

          {/* ══ Media Card ══════════════════════════════════════════════════════ */}
          <AnimCard opacity={mediaAnim} translateY={mediaY} scale={mediaScale} C={C}>
            <View style={s.cardPad}>
              <SectionLabel label="Channel Identity" C={C} />

              <View style={s.logoRow}>
                <TouchableOpacity
                  onPress={() => pickImage('logo')}
                  activeOpacity={0.8}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Animated.View
                    style={[
                      s.logoCircle,
                      {
                        borderColor: errors.logo ? C.accent : C.border,
                        transform: [{ scale: logoPickerScale }],
                      },
                    ]}
                  >
                    {logo ? (
                      <Image source={{ uri: logo.uri }} style={s.logoImg} />
                    ) : (
                      <View style={s.logoPlaceholder}>
                        <View style={[s.logoIconBg, { backgroundColor: C.accentBg }]}>
                          <Ionicons name="camera" size={moderateScale(22)} color={C.accent} />
                        </View>
                      </View>
                    )}
                    <View style={[s.logoBadge, { backgroundColor: C.accent }]}>
                      <Ionicons name="pencil" size={moderateScale(9)} color="#FFF" />
                    </View>
                  </Animated.View>
                </TouchableOpacity>

                <View style={s.logoInfo}>
                  <Text style={s.logoInfoTitle}>Channel Logo</Text>
                  <Text style={s.logoInfoSub}>
                    Square image · PNG or JPG{'\n'}Shown beside every story you publish
                  </Text>
                  {errors.logo && (
                    <View style={[s.inlineError, { backgroundColor: C.errorBg }]}>
                      <Ionicons name="alert-circle" size={moderateScale(12)} color={C.accent} />
                      <Text style={[s.inlineErrorText, { color: C.accent }]}>{errors.logo}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={[s.divider, { backgroundColor: C.border }]} />

              <View style={s.bannerLabel}>
                <Text style={s.fieldLabel}>
                  Channel Banner <Text style={s.optionalTag}>(optional)</Text>
                </Text>
              </View>
              <TouchableOpacity
                style={[s.bannerArea, { borderColor: C.border, backgroundColor: C.surfaceAlt }]}
                onPress={() => pickImage('banner')}
                activeOpacity={0.8}
              >
                {banner ? (
                  <Image source={{ uri: banner.uri }} style={s.bannerImg} />
                ) : (
                  <View style={s.bannerPlaceholder}>
                    <View style={[s.bannerIconBg, { backgroundColor: C.iconBlueBg }]}>
                      <Ionicons name="image" size={moderateScale(24)} color={C.iconBlue} />
                    </View>
                    <Text style={[s.bannerHint, { color: C.muted }]}>
                      Tap to upload · 16 : 9 recommended
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </AnimCard>

          {/* ══ Channel Info Card ════════════════════════════════════════════════ */}
          <AnimCard opacity={infoAnim} translateY={infoY} C={C}>
            <View style={s.cardPad}>
              <SectionLabel label="Channel Info" C={C} />

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>
                  Channel Name <Text style={s.required}>*</Text>
                </Text>
                <View
                  style={[
                    s.inputWrap,
                    {
                      borderColor: errors.channelName ? C.accent : C.border,
                      backgroundColor: C.inputBg,
                    },
                  ]}
                >
                  <Ionicons
                    name="tv-outline"
                    size={moderateScale(16)}
                    color={errors.channelName ? C.accent : C.muted}
                    style={s.inputIcon}
                  />
                  <TextInput
                    style={[s.input, { color: C.primary }]}
                    placeholder="e.g. Kolkata Evening Post"
                    placeholderTextColor={C.muted}
                    value={formData.channelName}
                    onChangeText={(t) => {
                      update('channelName', t);
                      clearErr('channelName');
                    }}
                    returnKeyType="next"
                  />
                </View>
                {errors.channelName && <FieldError msg={errors.channelName} C={C} />}
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>
                  Description <Text style={s.required}>*</Text>
                </Text>
                <View
                  style={[
                    s.inputWrap,
                    s.textAreaWrap,
                    {
                      borderColor: errors.description ? C.accent : C.border,
                      backgroundColor: C.inputBg,
                    },
                  ]}
                >
                  <TextInput
                    style={[s.input, s.textArea, { color: C.primary }]}
                    placeholder="Tell viewers what your channel covers and why it matters…"
                    placeholderTextColor={C.muted}
                    value={formData.description}
                    onChangeText={(t) => {
                      update('description', t);
                      clearErr('description');
                    }}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
                {errors.description && <FieldError msg={errors.description} C={C} />}
              </View>
            </View>
          </AnimCard>

          {/* ══ Language Card ════════════════════════════════════════════════════ */}
          <AnimCard opacity={langAnim} translateY={langY} C={C}>
            <View style={s.cardPad}>
              <SectionLabel label="Language" C={C} />
              <View style={s.chipRow}>
                {LANGUAGES.map((lang) => {
                  const active = formData.language === lang.value;
                  return (
                    <TouchableOpacity
                      key={lang.value}
                      style={[
                        s.chip,
                        {
                          backgroundColor: active ? C.accent : C.chipBg,
                          borderColor: active ? C.accent : C.border,
                        },
                      ]}
                      onPress={() => update('language', lang.value)}
                      activeOpacity={0.75}
                    >
                      <Text style={[s.chipText, { color: active ? '#FFF' : C.primary }]}>
                        {lang.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </AnimCard>

          {/* ══ Category Card ════════════════════════════════════════════════════ */}
          <AnimCard opacity={catAnim} translateY={catY} C={C}>
            <View style={s.cardPad}>
              <SectionLabel label="Category" C={C} />
              <View style={s.catGrid}>
                {CATEGORIES.map((cat) => {
                  const active = formData.category === cat.value;
                  return (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        s.catCard,
                        {
                          backgroundColor: active ? C.accentBg : C.surfaceAlt,
                          borderColor: active ? C.accent : C.border,
                        },
                      ]}
                      onPress={() => update('category', cat.value)}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={moderateScale(18)}
                        color={active ? C.accent : C.muted}
                      />
                      <Text
                        style={[
                          s.catLabel,
                          {
                            color: active ? C.accent : C.secondary,
                            fontWeight: active ? '700' : '400',
                          },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </AnimCard>

          {/* ══ Location Card ════════════════════════════════════════════════════ */}
          <AnimCard opacity={locAnim} translateY={locY} C={C}>
            <View style={s.cardPad}>
              <SectionLabel label="Location" C={C} />
              <Text style={[s.locationHint, { color: C.muted }]}>
                Helps viewers discover hyper-local stories from your area
              </Text>

              {[
                {
                  key: 'state',
                  label: 'State',
                  icon: 'map-outline',
                  placeholder: 'e.g. West Bengal',
                  required: true,
                },
                {
                  key: 'district',
                  label: 'District',
                  icon: 'location-outline',
                  placeholder: 'e.g. Kolkata',
                  required: true,
                },
                {
                  key: 'city',
                  label: 'City',
                  icon: 'business-outline',
                  placeholder: 'e.g. Kolkata',
                  required: true,
                },
                {
                  key: 'area',
                  label: 'Area',
                  icon: 'navigate-circle-outline',
                  placeholder: 'e.g. Park Street (optional)',
                  required: false,
                },
              ].map(({ key, label, icon, placeholder, required }) => (
                <View key={key} style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>
                    {label}
                    {required && <Text style={s.required}> *</Text>}
                  </Text>
                  <View
                    style={[
                      s.inputWrap,
                      {
                        borderColor: errors[key] ? C.accent : C.border,
                        backgroundColor: C.inputBg,
                      },
                    ]}
                  >
                    <Ionicons
                      name={icon}
                      size={moderateScale(16)}
                      color={errors[key] ? C.accent : C.muted}
                      style={s.inputIcon}
                    />
                    <TextInput
                      style={[s.input, { color: C.primary }]}
                      placeholder={placeholder}
                      placeholderTextColor={C.muted}
                      value={formData[key]}
                      onChangeText={(t) => {
                        update(key, t);
                        clearErr(key);
                      }}
                      returnKeyType={key === 'area' ? 'done' : 'next'}
                      onSubmitEditing={key === 'area' ? handleSubmit : undefined}
                    />
                  </View>
                  {errors[key] && <FieldError msg={errors[key]} C={C} />}
                </View>
              ))}
            </View>
          </AnimCard>

          {/* ══ Submit CTA ═══════════════════════════════════════════════════════ */}
          <Animated.View
            style={{
              opacity: btnAnim,
              transform: [{ translateY: btnY }, { scale: btnPulse }],
              marginBottom: verticalScale(10),
            }}
          >
            <TouchableOpacity
              style={[s.submitBtn, { backgroundColor: C.accent, shadowColor: C.accent }]}
              onPress={handleSubmit}
              activeOpacity={0.88}
            >
              <Ionicons name="add-circle-outline" size={moderateScale(20)} color="#FFF" />
              <Text style={s.submitBtnText}>Create Channel</Text>
              <Ionicons
                name="arrow-forward"
                size={moderateScale(17)}
                color="rgba(255,255,255,0.7)"
              />
            </TouchableOpacity>
          </Animated.View>

          <Animated.Text style={[s.footerNote, { opacity: btnAnim, color: C.faint }]}>
            Your channel will be reviewed before going live · BartaOne Publisher Agreement applies
          </Animated.Text>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
function makeStyles(C) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: C.bg,
    },
    header: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: scale(20),
      paddingTop: verticalScale(18),
      paddingBottom: verticalScale(16),
      backgroundColor: C.surface,
      borderBottomWidth: scale(3),
      borderBottomColor: C.accent,
    },
    headerCenter: {
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: fontScale(26),
      fontWeight: '800',
      color: C.primary,
      letterSpacing: -0.8,
      fontStyle: 'italic',
    },
    scroll: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    scrollContent: {
      flexGrow: 1,
    },
    contentWrapper: {
      paddingHorizontal: scale(16),
      paddingTop: verticalScale(6),
      paddingBottom: verticalScale(60),
    },
    pageSubtitle: {
      fontSize: fontScale(13),
      color: C.muted,
      lineHeight: fontScale(19),
      marginBottom: verticalScale(8),
      paddingHorizontal: scale(4),
    },
    cardPad: {
      paddingHorizontal: scale(18),
      paddingTop: verticalScale(14),
      paddingBottom: verticalScale(12),
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      marginVertical: verticalScale(14),
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(16),
      marginBottom: verticalScale(4),
    },
    logoCircle: {
      width: scale(78),
      height: scale(78),
      borderRadius: scale(39),
      borderWidth: 2,
      borderStyle: 'dashed',
      overflow: 'visible',
    },
    logoImg: {
      width: scale(78),
      height: scale(78),
      borderRadius: scale(39),
      resizeMode: 'cover',
    },
    logoPlaceholder: {
      width: scale(78),
      height: scale(78),
      borderRadius: scale(39),
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: C.surfaceAlt,
    },
    logoIconBg: {
      width: scale(44),
      height: scale(44),
      borderRadius: scale(22),
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: scale(22),
      height: scale(22),
      borderRadius: scale(11),
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: C.surface,
    },
    logoInfo: { flex: 1 },
    logoInfoTitle: {
      fontSize: fontScale(14),
      fontWeight: '600',
      color: C.primary,
    },
    logoInfoSub: {
      fontSize: fontScale(11.5),
      color: C.muted,
      marginTop: verticalScale(4),
      lineHeight: fontScale(17),
    },
    inlineError: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(4),
      marginTop: verticalScale(6),
      paddingHorizontal: scale(8),
      paddingVertical: verticalScale(4),
      borderRadius: scale(6),
    },
    inlineErrorText: {
      fontSize: fontScale(11),
      fontWeight: '600',
    },
    bannerLabel: { marginBottom: verticalScale(8) },
    bannerArea: {
      width: '100%',
      height: verticalScale(120),
      borderRadius: scale(12),
      borderWidth: 1.5,
      borderStyle: 'dashed',
      overflow: 'hidden',
    },
    bannerImg: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    bannerPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: verticalScale(8),
    },
    bannerIconBg: {
      width: scale(48),
      height: scale(48),
      borderRadius: scale(14),
      justifyContent: 'center',
      alignItems: 'center',
    },
    bannerHint: {
      fontSize: fontScale(12),
      textAlign: 'center',
    },
    fieldGroup: { marginBottom: verticalScale(14) },
    fieldLabel: {
      fontSize: fontScale(13),
      fontWeight: '600',
      color: C.secondary,
      marginBottom: verticalScale(7),
      letterSpacing: 0.1,
    },
    required: { color: C.accent },
    optionalTag: {
      fontSize: fontScale(11),
      fontWeight: '400',
      color: C.muted,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: scale(10),
      paddingHorizontal: scale(12),
      minHeight: verticalScale(48),
    },
    inputIcon: { marginRight: scale(8) },
    input: {
      flex: 1,
      fontSize: fontScale(15),
      paddingVertical: verticalScale(13),
      fontWeight: '400',
      padding: 0,
    },
    textAreaWrap: { alignItems: 'flex-start', paddingTop: verticalScale(4) },
    textArea: {
      height: verticalScale(96),
      paddingTop: verticalScale(9),
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: scale(8),
    },
    chip: {
      paddingHorizontal: scale(16),
      paddingVertical: verticalScale(9),
      borderRadius: scale(20),
      borderWidth: 1,
    },
    chipText: {
      fontSize: fontScale(13.5),
      fontWeight: '600',
    },
    catGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: scale(8),
    },
    catCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(6),
      paddingHorizontal: scale(12),
      paddingVertical: verticalScale(9),
      borderRadius: scale(10),
      borderWidth: 1,
      minWidth: '30%',
    },
    catLabel: {
      fontSize: fontScale(12.5),
    },
    locationHint: {
      fontSize: fontScale(12),
      lineHeight: fontScale(17),
      marginBottom: verticalScale(14),
    },
    submitBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: scale(9),
      paddingVertical: verticalScale(16),
      borderRadius: scale(14),
      shadowOffset: { width: 0, height: verticalScale(6) },
      shadowOpacity: 0.3,
      shadowRadius: scale(14),
      elevation: 6,
      minHeight: verticalScale(56),
    },
    submitBtnText: {
      fontSize: fontScale(17),
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.2,
    },
    footerNote: {
      fontSize: fontScale(11),
      textAlign: 'center',
      lineHeight: fontScale(16),
      marginTop: verticalScale(12),
      paddingHorizontal: scale(4),
    },
  });
}