// app/(owner)/CreateChannel.jsx - Fixed version
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
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { channelService } from '../../services/channelService';
import { auth } from '../../services/firebase';
import Loader from '../../components/Loader';
import { useRouter } from 'expo-router'; // Import useRouter

// ─── Responsive helpers ──────────────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get('window');
const BASE_W = 390;
const scale = (n) => Math.round((SW / BASE_W) * n);
const vs = (n) => Math.round((SH / 844) * n);
const sp = (n) => n / PixelRatio.getFontScale();

// ─── Theme ──────────────────────────────────────────────────────────────────
const LIGHT = {
  bg:                '#F2F0EB',
  surface:           '#FFFFFF',
  surfaceAlt:        '#FAFAF8',
  border:            '#E4E0D8',
  accent:            '#C8001A',
  accentBg:          '#FFF0F2',
  accentBorder:      'rgba(200,0,26,0.18)',
  navy:              '#0F1923',
  primary:           '#1A2733',
  secondary:         '#4A5A6B',
  muted:             '#8A97A5',
  faint:             '#B8C0B8',
  white:             '#FFFFFF',
  statusBar:         'dark-content',
  iconBlue:          '#1A6DC8',
  iconBlueBg:        '#EFF5FF',
  iconGreen:         '#0E8A5A',
  iconGreenBg:       '#EDFAF3',
  iconPurple:        '#7C3AED',
  iconPurpleBg:      '#F5F0FF',
  iconAmber:         '#B87500',
  iconAmberBg:       '#FFF7E8',
  cardShadowOpacity: 0.06,
  chipBg:            '#FFFFFF',
  inputBg:           '#FFFFFF',
  errorBg:           '#FFF5F5',
};

const DARK = {
  bg:                '#0D1117',
  surface:           '#161B22',
  surfaceAlt:        '#1C2330',
  border:            '#2A3340',
  accent:            '#E8192C',
  accentBg:          'rgba(232,25,44,0.12)',
  accentBorder:      'rgba(232,25,44,0.25)',
  navy:              '#E8EDF2',
  primary:           '#EDF2F7',
  secondary:         '#8B9BAB',
  muted:             '#5C6E80',
  faint:             '#3A4A58',
  white:             '#FFFFFF',
  statusBar:         'light-content',
  iconBlue:          '#60A5FA',
  iconBlueBg:        'rgba(96,165,250,0.12)',
  iconGreen:         '#34D399',
  iconGreenBg:       'rgba(52,211,153,0.12)',
  iconPurple:        '#A78BFA',
  iconPurpleBg:      'rgba(167,139,250,0.12)',
  iconAmber:         '#FBBF24',
  iconAmberBg:       'rgba(251,191,36,0.12)',
  cardShadowOpacity: 0.35,
  chipBg:            '#1C2330',
  inputBg:           '#161B22',
  errorBg:           'rgba(232,25,44,0.08)',
};

// ─── Static data ──────────────────────────────────────────────────────────────
const LANGUAGES = [
  { label: 'English',    value: 'en' },
  { label: 'हिन्दी',     value: 'hi' },
  { label: 'বাংলা',      value: 'bn' },
  { label: 'తెలుగు',    value: 'te' },
  { label: 'मराठी',     value: 'mr' },
  { label: 'தமிழ்',     value: 'ta' },
  { label: 'ગુજરાતી',   value: 'gu' },
  { label: 'ಕನ್ನಡ',     value: 'kn' },
  { label: 'മലയാളം',    value: 'ml' },
  { label: 'ଓଡ଼ିଆ',     value: 'or' },
  { label: 'ਪੰਜਾਬੀ',    value: 'pa' },
  { label: 'অসমীয়া',   value: 'as' },
];

const CATEGORIES = [
  { label: 'News',          value: 'news',          icon: 'newspaper-outline' },
  { label: 'Entertainment', value: 'entertainment', icon: 'film-outline' },
  { label: 'Sports',        value: 'sports',        icon: 'trophy-outline' },
  { label: 'Business',      value: 'business',      icon: 'briefcase-outline' },
  { label: 'Technology',    value: 'technology',    icon: 'hardware-chip-outline' },
  { label: 'Lifestyle',     value: 'lifestyle',     icon: 'heart-outline' },
  { label: 'Other',         value: 'other',         icon: 'ellipsis-horizontal-outline' },
];

// ─── Section header ──────────────────────────────────────────────────────────
function SectionLabel({ label, C }) {
  return (
    <Text style={{
      fontSize:      sp(10),
      fontWeight:    '700',
      color:         C.faint,
      letterSpacing: 1.3,
      textTransform: 'uppercase',
      marginBottom:  vs(10),
    }}>
      {label}
    </Text>
  );
}

// ─── Animated card wrapper ──────────────────────────────────────────────────
function AnimCard({ opacity, translateY, scale: scaleVal, children, style, C }) {
  return (
    <Animated.View style={[{
      opacity,
      transform: [
        { translateY: translateY ?? 0 },
        { scale: scaleVal ?? 1 },
      ],
      backgroundColor:  C.surface,
      borderRadius:     scale(18),
      borderWidth:      StyleSheet.hairlineWidth,
      borderColor:      C.border,
      shadowColor:      '#000',
      shadowOffset:     { width: 0, height: scale(4) },
      shadowOpacity:    C.cardShadowOpacity,
      shadowRadius:     scale(16),
      elevation:        4,
      marginBottom:     vs(14),
      overflow:         'hidden',
    }, style]}>
      {children}
    </Animated.View>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CreateChannel({ navigation }) {
  const router = useRouter(); // Add this
  const scheme = useColorScheme();
  const C      = scheme === 'dark' ? DARK : LIGHT;
  const { user, loading: authLoading } = useAuth();

  const [isLoading, setIsLoading]       = useState(false);
  const [loadingMsg, setLoadingMsg]     = useState('Creating your channel…');
  const [formData, setFormData] = useState({
    channelName: '',
    description: '',
    language:    'en',
    state:       '',
    district:    '',
    city:        '',
    area:        '',
    category:    'news',
  });
  const [logo,   setLogo]   = useState(null);
  const [banner, setBanner] = useState(null);
  const [errors, setErrors] = useState({});

  // ── Animated values ──
  const headerAnim  = useRef(new Animated.Value(0)).current;
  const mediaAnim   = useRef(new Animated.Value(0)).current;
  const mediaY      = useRef(new Animated.Value(vs(24))).current;
  const mediaScale  = useRef(new Animated.Value(0.96)).current;
  const infoAnim    = useRef(new Animated.Value(0)).current;
  const infoY       = useRef(new Animated.Value(vs(24))).current;
  const langAnim    = useRef(new Animated.Value(0)).current;
  const langY       = useRef(new Animated.Value(vs(24))).current;
  const catAnim     = useRef(new Animated.Value(0)).current;
  const catY        = useRef(new Animated.Value(vs(24))).current;
  const locAnim     = useRef(new Animated.Value(0)).current;
  const locY        = useRef(new Animated.Value(vs(24))).current;
  const btnAnim     = useRef(new Animated.Value(0)).current;
  const btnY        = useRef(new Animated.Value(vs(18))).current;
  const btnPulse    = useRef(new Animated.Value(1)).current;
  const logoPickerScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(mediaAnim,  { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(mediaY,     { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
        Animated.spring(mediaScale, { toValue: 1, friction: 8, tension: 55, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(infoAnim, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(infoY,    { toValue: 0, friction: 8, tension: 62, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(langAnim, { toValue: 1, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(langY,    { toValue: 0, friction: 8, tension: 62, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(catAnim, { toValue: 1, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(catY,    { toValue: 0, friction: 8, tension: 62, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(locAnim, { toValue: 1, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(locY,    { toValue: 0, friction: 8, tension: 62, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(btnAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(btnY,    { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(btnPulse, { toValue: 1.022, duration: 850, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(btnPulse, { toValue: 1,     duration: 850, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Image picker ──
  const pickImage = async (type) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant access to your photo library.');
      return;
    }

    if (type === 'logo') {
      Animated.sequence([
        Animated.spring(logoPickerScale, { toValue: 0.92, friction: 6, tension: 120, useNativeDriver: true }),
        Animated.spring(logoPickerScale, { toValue: 1,    friction: 6, tension: 80,  useNativeDriver: true }),
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

  // ── Validation ──
  const validateForm = () => {
    const e = {};
    if (!formData.channelName.trim()) e.channelName = 'Channel name is required';
    if (!formData.description.trim()) e.description  = 'Description is required';
    if (!formData.state.trim())       e.state        = 'State is required';
    if (!formData.district.trim())    e.district     = 'District is required';
    if (!formData.city.trim())        e.city         = 'City is required';
    if (!logo)                        e.logo         = 'Channel logo is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Navigate to dashboard ──
  const goToDashboard = () => {
    try {
      // Try different navigation methods
      if (navigation && navigation.replace) {
        // Try replace first
        navigation.replace('OwnerDashboard');
      } else if (router) {
        // Use Expo Router
        router.replace('/(owner)/OwnerDashboard');
      } else {
        // Fallback to push
        navigation?.navigate('OwnerDashboard');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Last resort - try to navigate to the index of owner group
      try {
        router?.replace('/(owner)');
      } catch (e) {
        console.error('Failed to navigate:', e);
        // Show error but don't crash
        Alert.alert('Navigation Error', 'Could not navigate to dashboard. Please restart the app.');
      }
    }
  };

  const handleSubmit = async () => {
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

      // Step 1: Create channel with JSON payload
      const jsonPayload = {
        channelName: formData.channelName.trim(),
        description: formData.description.trim(),
        language:    formData.language,
        category:    formData.category,
        location: {
          state:    formData.state.trim(),
          district: formData.district.trim(),
          city:     formData.city.trim(),
          area:     formData.area.trim(),
        },
      };

      console.log('📤 Sending channel payload:', jsonPayload);
      
      const response = await channelService.create(jsonPayload);
      console.log('📝 Raw response:', JSON.stringify(response, null, 2));

      // ── IMPORTANT: Safely extract channel ID ──
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

      if (!channelId && typeof response === 'string') {
        channelId = response;
      }

      console.log('✅ Extracted channelId:', channelId);

      if (!channelId) {
        console.error('❌ Could not extract channel ID from response:', response);
        throw new Error('Channel created but no ID was returned. Please contact support.');
      }

      // Step 2: Upload images if we have any
      if (logo || banner) {
        setLoadingMsg('Uploading images…');
        
        try {
          const imgPayload = new FormData();
          
          if (logo) {
            const logoFile = {
              uri: logo.uri,
              name: logo.fileName || `logo-${Date.now()}.jpg`,
              type: logo.mimeType || 'image/jpeg',
            };
            imgPayload.append('logo', logoFile);
            console.log('📤 Logo file:', logoFile.name);
          }
          
          if (banner) {
            const bannerFile = {
              uri: banner.uri,
              name: banner.fileName || `banner-${Date.now()}.jpg`,
              type: banner.mimeType || 'image/jpeg',
            };
            imgPayload.append('banner', bannerFile);
            console.log('📤 Banner file:', bannerFile.name);
          }

          console.log('📤 Uploading images for channel:', channelId);
          await channelService.update(channelId, imgPayload);
          console.log('✅ Images uploaded successfully');
          
        } catch (imgErr) {
          console.warn('⚠️ Image upload failed but channel was created:', imgErr.message);
          Alert.alert(
            'Channel Created',
            'Your channel was created but there was an issue uploading images. You can add them later from the dashboard.',
            [
              { 
                text: 'Go to Dashboard', 
                onPress: () => goToDashboard() // Use the new function
              }
            ]
          );
          setIsLoading(false);
          return;
        }
      }

      // ── Success ──
      setIsLoading(false);
      Alert.alert(
        '🎉 Channel Created!',
        'Your channel has been created successfully and is ready to publish.',
        [
          { 
            text: 'Go to Dashboard', 
            onPress: () => goToDashboard() // Use the new function
          }
        ]
      );

    } catch (err) {
      console.error('❌ CreateChannel Error:');
      console.error('Message:', err.message);
      console.error('Stack:', err.stack);
      
      let errorMessage = 'Failed to create channel. Please try again.';
      
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        console.error('Status:', status);
        console.error('Data:', data);
        
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

  const update = (key, val) =>
    setFormData((f) => ({ ...f, [key]: val }));
  const clearErr = (key) =>
    setErrors((e) => ({ ...e, [key]: null }));

  if (authLoading) return <Loader message="Loading…" />;
  if (isLoading) return <Loader message={loadingMsg} />;

  const s = makeStyles(C);

  const headerTranslateY = headerAnim.interpolate({ 
    inputRange: [0, 1], 
    outputRange: [-vs(60), 0] 
  });

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} />

      {/* ── Header ── */}
      <Animated.View style={[s.header, {
        opacity:   headerAnim,
        transform: [{ translateY: headerTranslateY }],
      }]}>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Create Channel</Text>
        </View>
      </Animated.View>

      <KeyboardAwareScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={Platform.OS === 'android' ? 120 : 40}
        extraHeight={Platform.OS === 'android' ? 120 : 40}
        bounces={true}
      >
        <Text style={s.pageSubtitle}>
          Set up your news channel to start publishing to your community
        </Text>

        {/* ══ Media Card ════════════════════════════════════════════════════ */}
        <AnimCard opacity={mediaAnim} translateY={mediaY} scale={mediaScale} C={C}>
          <View style={s.cardPad}>
            <SectionLabel label="Channel Identity" C={C} />

            {/* Logo picker */}
            <View style={s.logoRow}>
              <TouchableOpacity onPress={() => pickImage('logo')} activeOpacity={0.8}>
                <Animated.View style={[s.logoCircle, {
                  borderColor: errors.logo ? C.accent : C.border,
                  transform:   [{ scale: logoPickerScale }],
                }]}>
                  {logo ? (
                    <Image source={{ uri: logo.uri }} style={s.logoImg} />
                  ) : (
                    <View style={s.logoPlaceholder}>
                      <View style={[s.logoIconBg, { backgroundColor: C.accentBg }]}>
                        <Ionicons name="camera" size={scale(22)} color={C.accent} />
                      </View>
                    </View>
                  )}

                  <View style={[s.logoBadge, { backgroundColor: C.accent }]}>
                    <Ionicons name="pencil" size={scale(9)} color="#FFF" />
                  </View>
                </Animated.View>
              </TouchableOpacity>

              <View style={s.logoInfo}>
                <Text style={s.logoInfoTitle}>Channel Logo</Text>
                <Text style={s.logoInfoSub}>Square image · PNG or JPG{'\n'}Shown beside every story you publish</Text>
                {errors.logo && (
                  <View style={[s.inlineError, { backgroundColor: C.errorBg }]}>
                    <Ionicons name="alert-circle" size={scale(12)} color={C.accent} />
                    <Text style={[s.inlineErrorText, { color: C.accent }]}>{errors.logo}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={[s.divider, { backgroundColor: C.border }]} />

            {/* Banner picker */}
            <View style={s.bannerLabel}>
              <Text style={s.fieldLabel}>Channel Banner <Text style={s.optionalTag}>(optional)</Text></Text>
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
                    <Ionicons name="image" size={scale(24)} color={C.iconBlue} />
                  </View>
                  <Text style={[s.bannerHint, { color: C.muted }]}>Tap to upload · 16 : 9 recommended</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </AnimCard>

        {/* ══ Channel Info Card ════════════════════════════════════════════ */}
        <AnimCard opacity={infoAnim} translateY={infoY} C={C}>
          <View style={s.cardPad}>
            <SectionLabel label="Channel Info" C={C} />

            {/* Channel Name */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Channel Name <Text style={s.required}>*</Text></Text>
              <View style={[s.inputWrap, {
                borderColor: errors.channelName ? C.accent : C.border,
                backgroundColor: C.inputBg,
              }]}>
                <Ionicons name="tv-outline" size={scale(16)} color={errors.channelName ? C.accent : C.muted} style={s.inputIcon} />
                <TextInput
                  style={[s.input, { color: C.primary }]}
                  placeholder="e.g. Kolkata Evening Post"
                  placeholderTextColor={C.muted}
                  value={formData.channelName}
                  onChangeText={(t) => { update('channelName', t); clearErr('channelName'); }}
                  returnKeyType="next"
                />
              </View>
              {errors.channelName && <FieldError msg={errors.channelName} C={C} />}
            </View>

            {/* Description */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Description <Text style={s.required}>*</Text></Text>
              <View style={[s.inputWrap, s.textAreaWrap, {
                borderColor: errors.description ? C.accent : C.border,
                backgroundColor: C.inputBg,
              }]}>
                <TextInput
                  style={[s.input, s.textArea, { color: C.primary }]}
                  placeholder="Tell viewers what your channel covers and why it matters…"
                  placeholderTextColor={C.muted}
                  value={formData.description}
                  onChangeText={(t) => { update('description', t); clearErr('description'); }}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              {errors.description && <FieldError msg={errors.description} C={C} />}
            </View>
          </View>
        </AnimCard>

        {/* ══ Language Card ════════════════════════════════════════════════ */}
        <AnimCard opacity={langAnim} translateY={langY} C={C}>
          <View style={s.cardPad}>
            <SectionLabel label="Language" C={C} />
            <View style={s.chipRow}>
              {LANGUAGES.map((lang) => {
                const active = formData.language === lang.value;
                return (
                  <TouchableOpacity
                    key={lang.value}
                    style={[s.chip, {
                      backgroundColor: active ? C.accent : C.chipBg,
                      borderColor:     active ? C.accent : C.border,
                    }]}
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

        {/* ══ Category Card ════════════════════════════════════════════════ */}
        <AnimCard opacity={catAnim} translateY={catY} C={C}>
          <View style={s.cardPad}>
            <SectionLabel label="Category" C={C} />
            <View style={s.catGrid}>
              {CATEGORIES.map((cat) => {
                const active = formData.category === cat.value;
                return (
                  <TouchableOpacity
                    key={cat.value}
                    style={[s.catCard, {
                      backgroundColor: active ? C.accentBg : C.surfaceAlt,
                      borderColor:     active ? C.accent   : C.border,
                    }]}
                    onPress={() => update('category', cat.value)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={scale(18)}
                      color={active ? C.accent : C.muted}
                    />
                    <Text style={[s.catLabel, { color: active ? C.accent : C.secondary, fontWeight: active ? '700' : '400' }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </AnimCard>

        {/* ══ Location Card ════════════════════════════════════════════════ */}
        <AnimCard opacity={locAnim} translateY={locY} C={C}>
          <View style={s.cardPad}>
            <SectionLabel label="Location" C={C} />
            <Text style={[s.locationHint, { color: C.muted }]}>
              Helps viewers discover hyper-local stories from your area
            </Text>

            {[
              { key: 'state',    label: 'State',    icon: 'map-outline',         placeholder: 'e.g. West Bengal', required: true },
              { key: 'district', label: 'District', icon: 'location-outline',    placeholder: 'e.g. Kolkata',     required: true },
              { key: 'city',     label: 'City',     icon: 'business-outline',    placeholder: 'e.g. Kolkata',     required: true },
              { key: 'area',     label: 'Area',     icon: 'navigate-circle-outline', placeholder: 'e.g. Park Street (optional)', required: false },
            ].map(({ key, label, icon, placeholder, required }) => (
              <View key={key} style={s.fieldGroup}>
                <Text style={s.fieldLabel}>
                  {label}{required && <Text style={s.required}> *</Text>}
                </Text>
                <View style={[s.inputWrap, {
                  borderColor:     errors[key] ? C.accent : C.border,
                  backgroundColor: C.inputBg,
                }]}>
                  <Ionicons name={icon} size={scale(16)} color={errors[key] ? C.accent : C.muted} style={s.inputIcon} />
                  <TextInput
                    style={[s.input, { color: C.primary }]}
                    placeholder={placeholder}
                    placeholderTextColor={C.muted}
                    value={formData[key]}
                    onChangeText={(t) => { update(key, t); clearErr(key); }}
                    returnKeyType="next"
                  />
                </View>
                {errors[key] && <FieldError msg={errors[key]} C={C} />}
              </View>
            ))}
          </View>
        </AnimCard>

        {/* ══ Submit CTA ═══════════════════════════════════════════════════ */}
        <Animated.View style={{
          opacity:   btnAnim,
          transform: [{ translateY: btnY }, { scale: btnPulse }],
          marginBottom: vs(10),
        }}>
          <TouchableOpacity
            style={[s.submitBtn, { backgroundColor: C.accent, shadowColor: C.accent }]}
            onPress={handleSubmit}
            activeOpacity={0.88}
          >
            <Ionicons name="add-circle-outline" size={scale(20)} color="#FFF" />
            <Text style={s.submitBtnText}>Create Channel</Text>
            <Ionicons name="arrow-forward" size={scale(17)} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.Text style={[s.footerNote, { opacity: btnAnim, color: C.faint }]}>
          Your channel will be reviewed before going live · BartaOne Publisher Agreement applies
        </Animated.Text>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

// ─── Inline field error ───────────────────────────────────────────────────────
function FieldError({ msg, C }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: vs(5), gap: scale(4) }}>
      <Ionicons name="alert-circle" size={scale(12)} color={C.accent} />
      <Text style={{ fontSize: sp(11.5), color: C.accent, fontWeight: '500' }}>{msg}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
function makeStyles(C) {
  return StyleSheet.create({
    root: {
      flex:            1,
      backgroundColor: C.bg,
    },
    header: {
      alignItems:        'center',
      justifyContent:    'center',
      paddingHorizontal: scale(20),
      paddingTop:        vs(18),
      paddingBottom:     vs(16),
      backgroundColor:   C.surface,
      borderBottomWidth: scale(3),
      borderBottomColor: C.accent,
    },
    headerCenter: {
      alignItems: 'center',
    },
    headerTitle: {
      fontSize:      sp(26),
      fontWeight:    '800',
      color:         C.primary,
      letterSpacing: -0.8,
      fontStyle:     'italic',
    },
    scroll: { flex: 1, backgroundColor: "transparent" },
    scrollContent: {
      flexGrow:          1,
      paddingHorizontal: scale(16),
      paddingTop:        vs(6),
      paddingBottom:     vs(40),
    },
    pageSubtitle: {
      fontSize:     sp(13),
      color:        C.muted,
      lineHeight:   sp(19),
      marginBottom: vs(8),
    },
    cardPad: {
      paddingHorizontal: scale(18),
      paddingTop:        vs(14),
      paddingBottom:     vs(12),
    },
    divider: {
      height:       StyleSheet.hairlineWidth,
      marginVertical: vs(14),
    },
    logoRow: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           scale(16),
      marginBottom:  vs(4),
    },
    logoCircle: {
      width:        scale(78),
      height:       scale(78),
      borderRadius: scale(39),
      borderWidth:  2,
      borderStyle:  'dashed',
      overflow:     'visible',
    },
    logoImg: {
      width:        scale(78),
      height:       scale(78),
      borderRadius: scale(39),
      resizeMode:   'cover',
    },
    logoPlaceholder: {
      width:          scale(78),
      height:         scale(78),
      borderRadius:   scale(39),
      justifyContent: 'center',
      alignItems:     'center',
      backgroundColor: C.surfaceAlt,
    },
    logoIconBg: {
      width:          scale(44),
      height:         scale(44),
      borderRadius:   scale(22),
      justifyContent: 'center',
      alignItems:     'center',
    },
    logoBadge: {
      position:       'absolute',
      bottom:         0,
      right:          0,
      width:          scale(22),
      height:         scale(22),
      borderRadius:   scale(11),
      justifyContent: 'center',
      alignItems:     'center',
      borderWidth:    2,
      borderColor:    C.surface,
    },
    logoInfo: { flex: 1 },
    logoInfoTitle: {
      fontSize:   sp(14),
      fontWeight: '600',
      color:      C.primary,
    },
    logoInfoSub: {
      fontSize:   sp(11.5),
      color:      C.muted,
      marginTop:  vs(4),
      lineHeight: sp(17),
    },
    inlineError: {
      flexDirection:  'row',
      alignItems:     'center',
      gap:            scale(4),
      marginTop:      vs(6),
      paddingHorizontal: scale(8),
      paddingVertical:   vs(4),
      borderRadius:   scale(6),
    },
    inlineErrorText: {
      fontSize:   sp(11),
      fontWeight: '600',
    },
    bannerLabel: { marginBottom: vs(8) },
    bannerArea: {
      width:         '100%',
      height:        vs(120),
      borderRadius:  scale(12),
      borderWidth:   1.5,
      borderStyle:   'dashed',
      overflow:      'hidden',
    },
    bannerImg: {
      width:      '100%',
      height:     '100%',
      resizeMode: 'cover',
    },
    bannerPlaceholder: {
      flex:           1,
      justifyContent: 'center',
      alignItems:     'center',
      gap:            vs(8),
    },
    bannerIconBg: {
      width:          scale(48),
      height:         scale(48),
      borderRadius:   scale(14),
      justifyContent: 'center',
      alignItems:     'center',
    },
    bannerHint: {
      fontSize:  sp(12),
      textAlign: 'center',
    },
    fieldGroup: { marginBottom: vs(14) },
    fieldLabel: {
      fontSize:     sp(13),
      fontWeight:   '600',
      color:        C.secondary,
      marginBottom: vs(7),
      letterSpacing: 0.1,
    },
    required: { color: C.accent },
    optionalTag: {
      fontSize:   sp(11),
      fontWeight: '400',
      color:      C.muted,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems:    'center',
      borderWidth:   1,
      borderRadius:  scale(10),
      paddingHorizontal: scale(12),
    },
    inputIcon: { marginRight: scale(8) },
    input: {
      flex:        1,
      fontSize:    sp(15),
      paddingVertical: vs(13),
      fontWeight:  '400',
    },
    textAreaWrap: { alignItems: 'flex-start', paddingTop: vs(4) },
    textArea: {
      height:    vs(96),
      paddingTop: vs(9),
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap:      'wrap',
      gap:           scale(8),
    },
    chip: {
      paddingHorizontal: scale(16),
      paddingVertical:   vs(9),
      borderRadius:      scale(20),
      borderWidth:       1,
    },
    chipText: {
      fontSize:   sp(13.5),
      fontWeight: '600',
    },
    catGrid: {
      flexDirection: 'row',
      flexWrap:      'wrap',
      gap:           scale(8),
    },
    catCard: {
      flexDirection:  'row',
      alignItems:     'center',
      gap:            scale(6),
      paddingHorizontal: scale(12),
      paddingVertical:   vs(9),
      borderRadius:   scale(10),
      borderWidth:    1,
      minWidth:       '30%',
    },
    catLabel: {
      fontSize:   sp(12.5),
    },
    locationHint: {
      fontSize:     sp(12),
      lineHeight:   sp(17),
      marginBottom: vs(14),
    },
    submitBtn: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            scale(9),
      paddingVertical: vs(16),
      borderRadius:   scale(14),
      shadowOffset:   { width: 0, height: scale(6) },
      shadowOpacity:  0.3,
      shadowRadius:   scale(14),
      elevation:      6,
    },
    submitBtnText: {
      fontSize:      sp(17),
      fontWeight:    '700',
      color:         '#FFFFFF',
      letterSpacing: 0.2,
    },
    footerNote: {
      fontSize:   sp(11),
      textAlign:  'center',
      lineHeight: sp(16),
      marginTop:  vs(12),
    },
  });
}