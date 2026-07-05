/**
 * BartaOne — Go Live Screen
 * Complete live streaming with video/audio support
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Dimensions,
  PixelRatio,
  StatusBar,
  Animated,
  Easing,
  useColorScheme,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { 
  startLiveStream, 
  scheduleLiveStream, 
  uploadThumbnail 
} from '../../services/liveService';

const { width: SW, height: SH } = Dimensions.get('window');
const BASE_W = 390;
const scale  = (n) => Math.round((SW / BASE_W) * n);
const vs     = (n) => Math.round((SH / 844) * n);
const sp     = (n) => n / PixelRatio.getFontScale();

// ─── Theme tokens ────────────────────────────────────────────────────────────
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
  logoBorder: 'transparent',
  cardShadowOpacity: 0.06,
  modalOverlay: 'rgba(0,0,0,0.5)',
  chipBg: '#FFFFFF',
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
  logoBorder: 'rgba(255,255,255,0.08)',
  cardShadowOpacity: 0.35,
  modalOverlay: 'rgba(0,0,0,0.7)',
  chipBg: '#1C2330',
};

const LANGUAGE_CODES = [
  { label: 'English', value: 'en' },
  { label: 'हिन्दी', value: 'hi' },
  { label: 'বাংলা', value: 'bn' },
  { label: 'తెలుగు', value: 'te' },
  { label: 'मराठी', value: 'mr' },
  { label: 'தமிழ்', value: 'ta' },
];

// ─── Schedule Modal ──────────────────────────────────────────────────────────
function ScheduleModal({ visible, onClose, onSchedule, C }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      const hour = i % 12 || 12;
      const ampm = i < 12 ? 'AM' : 'PM';
      slots.push(`${hour}:00 ${ampm}`);
      slots.push(`${hour}:30 ${ampm}`);
    }
    return slots;
  };

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      dates.push({
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[date.getDay()],
        date: date.getDate(),
        month: date.toLocaleString('default', { month: 'short' }),
        full: date.toISOString().split('T')[0],
      });
    }
    return dates;
  };

  const timeSlots = generateTimeSlots();
  const dateOptions = generateDates();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: C.modalOverlay }]}>
        <View style={[styles.scheduleSheet, { backgroundColor: C.surface }]}>
          <View style={[styles.modalHandle, { backgroundColor: C.border }]} />
          
          <View style={[styles.modalHeader, { borderBottomColor: C.border }]}>
            <Text style={[styles.modalTitle, { color: C.primary }]}>Schedule Live Stream</Text>
            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: C.iconAmberBg }]}
              onPress={onClose}
            >
              <Ionicons name="close" size={scale(22)} color={C.iconAmber} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.scheduleBody}>
              <View style={styles.scheduleSection}>
                <Text style={[styles.scheduleLabel, { color: C.secondary }]}>Select Date</Text>
                <View style={styles.dateGrid}>
                  {dateOptions.map((date) => (
                    <TouchableOpacity
                      key={date.full}
                      style={[
                        styles.dateOption,
                        {
                          backgroundColor: selectedDate === date.full ? C.accent : C.surfaceAlt,
                          borderColor: selectedDate === date.full ? C.accent : C.border,
                        },
                      ]}
                      onPress={() => setSelectedDate(date.full)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.dateDay, { color: selectedDate === date.full ? '#FFFFFF' : C.muted }]}>
                        {date.label}
                      </Text>
                      <Text style={[styles.dateNumber, { color: selectedDate === date.full ? '#FFFFFF' : C.primary }]}>
                        {date.date}
                      </Text>
                      <Text style={[styles.dateMonth, { color: selectedDate === date.full ? '#FFFFFF' : C.muted }]}>
                        {date.month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.scheduleSection}>
                <Text style={[styles.scheduleLabel, { color: C.secondary }]}>Select Time</Text>
                <View style={styles.timeGrid}>
                  {timeSlots.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeOption,
                        {
                          backgroundColor: selectedTime === time ? C.accent : C.surfaceAlt,
                          borderColor: selectedTime === time ? C.accent : C.border,
                        },
                      ]}
                      onPress={() => setSelectedTime(time)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.timeText, { color: selectedTime === time ? '#FFFFFF' : C.primary }]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.scheduleBtn,
                  {
                    backgroundColor: C.accent,
                    opacity: (!selectedDate || !selectedTime) ? 0.5 : 1,
                  },
                ]}
                onPress={() => {
                  if (!selectedDate || !selectedTime) {
                    Alert.alert('Error', 'Please select both date and time');
                    return;
                  }
                  onSchedule(selectedDate, selectedTime);
                }}
                disabled={!selectedDate || !selectedTime}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={scale(20)} color="#FFFFFF" />
                <Text style={styles.scheduleBtnText}>Schedule Stream</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: C.border }]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelText, { color: C.secondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function GoLive() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailUri, setThumbnailUri] = useState(null);
  const [errors, setErrors] = useState({});
  const [selectedLang, setSelectedLang] = useState('en');
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [scheduledData, setScheduledData] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [streamKey, setStreamKey] = useState(null);

  // ── Animation refs ──────────────────────────────────────────────────────────
  const headerAnim = useRef(new Animated.Value(0)).current;
  const thumbAnim = useRef(new Animated.Value(0)).current;
  const thumbScale = useRef(new Animated.Value(0.96)).current;
  const ruleScaleX = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const langAnim = useRef(new Animated.Value(0)).current;
  const tipAnim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;
  const btnY = useRef(new Animated.Value(scale(18))).current;
  const btnPulse = useRef(new Animated.Value(1)).current;
  const liveDotAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(thumbAnim, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(thumbScale, { toValue: 1, friction: 8, tension: 55, useNativeDriver: true }),
      ]),
      Animated.timing(ruleScaleX, {
        toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(cardAnim, { toValue: 1, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, friction: 8, tension: 55, useNativeDriver: true }),
      ]),
      Animated.timing(langAnim, { toValue: 1, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(tipAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(btnAnim, { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(btnY, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(btnPulse, { toValue: 1.022, duration: 850, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(btnPulse, { toValue: 1, duration: 850, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!isLive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(liveDotAnim, { toValue: 1.35, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(liveDotAnim, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isLive]);

  // ─── Pick Thumbnail ──────────────────────────────────────────────────────
  const pickThumbnail = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) {
      setThumbnailUri(result.assets[0].uri);
      setThumbnail(result.assets[0]);
      setErrors({ ...errors, thumbnail: null });
    }
  };

  // ─── Upload Thumbnail to Cloudinary ──────────────────────────────────────
  const uploadThumbnailToCloudinary = async (uri) => {
    try {
      setUploadProgress(10);
      
      // Create FormData
      const formData = new FormData();
      
      // Get file extension from URI
      const fileExtension = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
      };
      const mimeType = mimeTypes[fileExtension] || 'image/jpeg';
      
      // Append the file to FormData
      formData.append('thumbnail', {
        uri: uri,
        type: mimeType,
        name: `thumbnail.${fileExtension}`,
      });
      
      setUploadProgress(40);
      
      // Upload using the service
      const result = await uploadThumbnail(formData);
      
      if (!result?.data?.url) {
        throw new Error('No URL returned from upload');
      }
      
      setUploadProgress(100);
      return result.data.url;
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      setUploadProgress(0);
      throw new Error(error.message || 'Failed to upload thumbnail');
    }
  };

  // ─── Validation ──────────────────────────────────────────────────────────
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Stream title is required';
    if (!thumbnail) newErrors.thumbnail = 'Please add a thumbnail image';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Start Live Stream ──────────────────────────────────────────────────
  const handleStartLive = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setUploadProgress(0);
    
    try {
      const thumbnailUrl = await uploadThumbnailToCloudinary(thumbnailUri);
      
      const response = await startLiveStream({
        title: formData.title,
        description: formData.description,
        language: selectedLang,
        thumbnail: thumbnailUrl,
      });
      
      setStreamKey(response.data.streamKey);
      setIsLive(true);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to start live stream');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  // ─── Schedule Live Stream ──────────────────────────────────────────────
  const handleScheduleLive = async (date, time) => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setUploadProgress(0);
    
    try {
      const scheduledDateTime = new Date(`${date} ${time}`);
      const thumbnailUrl = await uploadThumbnailToCloudinary(thumbnailUri);
      
      const response = await scheduleLiveStream({
        title: formData.title,
        description: formData.description,
        language: selectedLang,
        thumbnail: thumbnailUrl,
        scheduledFor: scheduledDateTime.toISOString(),
      });
      
      setIsScheduled(true);
      setScheduledData({ date, time });
      setScheduleModalVisible(false);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to schedule live stream');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  // ─── End Live Stream ─────────────────────────────────────────────────────
  const handleEndLive = () => {
    Alert.alert(
      'End Live Stream',
      'Are you sure you want to end the live stream?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Stream',
          style: 'destructive',
          onPress: () => { setIsLive(false); router.back(); },
        },
      ]
    );
  };

  const styles = makeStyles(C);

  // ─── Loading State ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={[styles.loadingText, { color: C.secondary, marginTop: vs(12) }]}>
          {uploadProgress > 0 ? `Uploading thumbnail ${uploadProgress}%` : 'Starting live stream...'}
        </Text>
        {uploadProgress > 0 && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${uploadProgress}%`, backgroundColor: C.accent }]} />
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ─── SCHEDULED STATE ──────────────────────────────────────────────────────
  if (isScheduled) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} translucent={false} />
        <View style={styles.topStripe} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.featuresCard, { alignItems: 'center', paddingVertical: vs(32) }]}>
            <View style={[styles.scheduledIconWrap, { backgroundColor: C.iconAmberBg }]}>
              <Ionicons name="calendar-check-outline" size={scale(48)} color={C.iconAmber} />
            </View>
            <Text style={[styles.liveStateTitle, { color: C.primary }]}>Stream Scheduled!</Text>
            <Text style={[styles.liveStateSub, { color: C.muted }]}>{formData.title}</Text>
            <View style={[styles.scheduledInfo, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
              <View style={styles.scheduledInfoRow}>
                <Ionicons name="calendar-outline" size={scale(16)} color={C.muted} />
                <Text style={[styles.scheduledInfoText, { color: C.secondary }]}>{scheduledData?.date}</Text>
              </View>
              <View style={styles.scheduledInfoRow}>
                <Ionicons name="time-outline" size={scale(16)} color={C.muted} />
                <Text style={[styles.scheduledInfoText, { color: C.secondary }]}>{scheduledData?.time}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.btnPrimary, { backgroundColor: C.accent, marginTop: vs(16) }]}
              onPress={() => router.back()}
              activeOpacity={0.86}
            >
              <Text style={styles.btnPrimaryText}>Done</Text>
              <Ionicons name="checkmark" size={scale(18)} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── LIVE STATE ──────────────────────────────────────────────────────────
  if (isLive) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} translucent={false} />
        <View style={styles.topStripe} />

        <View style={styles.header}>
          <View style={styles.livePill}>
            <View style={styles.liveDotSmall} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <TouchableOpacity
            style={[styles.endBtn, { backgroundColor: C.accentBg, borderColor: C.accentBorder }]}
            onPress={handleEndLive}
            activeOpacity={0.8}
          >
            <Ionicons name="stop-circle-outline" size={scale(16)} color={C.accent} />
            <Text style={[styles.endBtnText, { color: C.accent }]}>End Stream</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.rule, { width: '100%' }]} />

          <View style={[styles.featuresCard, { alignItems: 'center', paddingVertical: vs(32) }]}>
            <Animated.View style={[
              styles.livePulseRing,
              { borderColor: C.accentBorder, transform: [{ scale: liveDotAnim }] }
            ]}>
              <View style={[styles.livePulseDot, { backgroundColor: C.accent }]}>
                <Ionicons name="radio" size={scale(28)} color="#FFFFFF" />
              </View>
            </Animated.View>
            
            {thumbnailUri && (
              <Image source={{ uri: thumbnailUri }} style={styles.liveThumbnail} />
            )}
            
            <Text style={[styles.liveStateTitle, { color: C.primary }]}>You are live</Text>
            <Text style={[styles.liveStateSub, { color: C.muted }]}>{formData.title}</Text>
            
            {streamKey && (
              <View style={[styles.streamKeyContainer, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
                <Text style={[styles.streamKeyLabel, { color: C.muted }]}>Stream Key</Text>
                <Text style={[styles.streamKeyValue, { color: C.primary }]}>{streamKey}</Text>
                <TouchableOpacity
                  style={[styles.copyBtn, { backgroundColor: C.accentBg }]}
                  onPress={() => {
                    Alert.alert('Stream Key', `Your stream key: ${streamKey}`);
                  }}
                >
                  <Text style={[styles.copyBtnText, { color: C.accent }]}>Copy Key</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={[styles.langCard, { flexDirection: 'row', gap: scale(12) }]}>
            {[
              { icon: 'people-outline', color: C.iconBlue, bg: C.iconBlueBg, label: 'Viewers', value: '0' },
              { icon: 'time-outline', color: C.iconGreen, bg: C.iconGreenBg, label: 'Duration', value: '00:00' },
              { icon: 'heart-outline', color: C.accent, bg: C.accentBg, label: 'Reactions', value: '0' },
            ].map((stat) => (
              <View key={stat.label} style={[styles.statCard, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
                <View style={[styles.statIconWrap, { backgroundColor: stat.bg }]}>
                  <Ionicons name={stat.icon} size={scale(18)} color={stat.color} />
                </View>
                <Text style={[styles.statValue, { color: C.primary }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: C.muted }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── SETUP STATE ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} translucent={false} />
      <View style={styles.topStripe} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.header, {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-vs(16), 0] }) }],
          }]}>
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={scale(18)} color={C.primary} />
            </TouchableOpacity>
            <View style={styles.logoArea}>
              <View style={[styles.logoIconWrap, { backgroundColor: C.navy }]}>
                <Ionicons name="radio" size={scale(20)} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.appName}>
                  Go<Text style={[styles.appNameAccent, { color: C.accent }]}>Live</Text>
                </Text>
                <Text style={[styles.tagline, { color: C.muted }]}>Broadcast to your audience</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.rule, { transform: [{ scaleX: ruleScaleX }] }]} />

          {/* Thumbnail Picker */}
          <Animated.View style={[styles.featuresCard, { opacity: thumbAnim, transform: [{ scale: thumbScale }] }]}>
            <Text style={[styles.featuresLabel, { color: C.faint }]}>STREAM THUMBNAIL</Text>
            <TouchableOpacity
              style={[
                styles.thumbArea,
                {
                  backgroundColor: C.surfaceAlt,
                  borderColor: errors.thumbnail ? C.accent : (thumbnail ? 'transparent' : C.border),
                }
              ]}
              onPress={pickThumbnail}
              activeOpacity={0.8}
            >
              {thumbnailUri ? (
                <>
                  <Image source={{ uri: thumbnailUri }} style={styles.thumbImage} />
                  <View style={[styles.thumbOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                    <Ionicons name="camera-outline" size={scale(22)} color="#FFFFFF" />
                    <Text style={styles.thumbOverlayText}>Change photo</Text>
                  </View>
                </>
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <View style={[styles.featureIconWrap, { backgroundColor: C.accentBg }]}>
                    <Ionicons name="image-outline" size={scale(22)} color={C.accent} />
                  </View>
                  <Text style={[styles.thumbPlaceholderTitle, { color: C.primary }]}>Add thumbnail</Text>
                  <Text style={[styles.thumbPlaceholderSub, { color: C.muted }]}>16:9 recommended</Text>
                </View>
              )}
            </TouchableOpacity>
            {errors.thumbnail && (
              <Text style={[styles.errorText, { color: C.accent }]}>{errors.thumbnail}</Text>
            )}
          </Animated.View>

          {/* Stream Details */}
          <Animated.View style={[styles.featuresCard, { opacity: cardAnim, transform: [{ scale: cardScale }] }]}>
            <Text style={[styles.featuresLabel, { color: C.faint }]}>STREAM DETAILS</Text>

            <View style={[styles.featureRow, styles.featureRowBorder]}>
              <View style={[styles.featureIconWrap, { backgroundColor: C.accentBg }]}>
                <Ionicons name="radio" size={scale(19)} color={C.accent} />
              </View>
              <View style={styles.featureTextCol}>
                <Text style={[styles.featureTitle, { color: C.primary }]}>Stream title *</Text>
                <TextInput
                  style={[styles.inlineInput, { color: C.secondary, borderBottomColor: errors.title ? C.accent : C.border }]}
                  placeholder="What are you streaming about?"
                  placeholderTextColor={C.faint}
                  value={formData.title}
                  onChangeText={(t) => { setFormData({ ...formData, title: t }); setErrors({ ...errors, title: null }); }}
                />
                {errors.title && (
                  <Text style={[styles.errorText, { color: C.accent }]}>{errors.title}</Text>
                )}
              </View>
            </View>

            <View style={styles.featureRow}>
              <View style={[styles.featureIconWrap, { backgroundColor: C.iconBlueBg }]}>
                <Ionicons name="document-text-outline" size={scale(19)} color={C.iconBlue} />
              </View>
              <View style={styles.featureTextCol}>
                <Text style={[styles.featureTitle, { color: C.primary }]}>Description</Text>
                <TextInput
                  style={[styles.inlineInput, styles.multilineInput, { color: C.secondary, borderBottomColor: C.border }]}
                  placeholder="Tell your audience more (optional)"
                  placeholderTextColor={C.faint}
                  value={formData.description}
                  onChangeText={(t) => setFormData({ ...formData, description: t })}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>
          </Animated.View>

          {/* Language Picker */}
          <Animated.View style={[styles.langCard, { opacity: langAnim }]}>
            <View style={styles.langHeader}>
              <Ionicons name="globe-outline" size={scale(15)} color={C.secondary} />
              <Text style={[styles.langLabel, { color: C.secondary }]}>Stream language</Text>
            </View>
            <View style={styles.langChipRow}>
              {LANGUAGE_CODES.map((l) => {
                const active = selectedLang === l.value;
                return (
                  <TouchableOpacity
                    key={l.value}
                    style={[
                      styles.langChip,
                      {
                        backgroundColor: active ? C.accent : C.chipBg,
                        borderColor: active ? C.accent : C.border,
                      },
                    ]}
                    onPress={() => setSelectedLang(l.value)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.langChipText, { color: active ? '#FFFFFF' : C.primary }]}>
                      {l.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* Tip Card */}
          <Animated.View style={[styles.tipCard, { opacity: tipAnim, backgroundColor: C.iconAmberBg, borderColor: C.iconAmberBg }]}>
            <View style={[styles.featureIconWrap, { backgroundColor: C.iconAmberBg, width: scale(34), height: scale(34) }]}>
              <Ionicons name="bulb-outline" size={scale(17)} color={C.iconAmber} />
            </View>
            <Text style={[styles.tipText, { color: C.secondary }]}>
              Make sure you have a stable internet connection before going live
            </Text>
          </Animated.View>

          <View style={{ minHeight: vs(14) }} />

          {/* Action Buttons */}
          <Animated.View style={[styles.btnGroup, { opacity: btnAnim, transform: [{ translateY: btnY }] }]}>
            <Animated.View style={{ transform: [{ scale: btnPulse }] }}>
              <TouchableOpacity
                style={[styles.btnPrimary, { backgroundColor: C.accent, shadowColor: C.accent }]}
                onPress={handleStartLive}
                activeOpacity={0.86}
              >
                <View style={styles.liveDotSmall} />
                <Text style={styles.btnPrimaryText}>Start Live Stream</Text>
                <Ionicons name="arrow-forward" size={scale(18)} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={[styles.btnSchedule, { borderColor: C.iconAmber, backgroundColor: C.iconAmberBg }]}
              onPress={() => setScheduleModalVisible(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="calendar-outline" size={scale(18)} color={C.iconAmber} />
              <Text style={[styles.btnScheduleText, { color: C.iconAmber }]}>Schedule for later</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnSkip, { borderColor: C.border, backgroundColor: C.surfaceAlt }]}
              onPress={() => router.back()}
              activeOpacity={0.75}
            >
              <Text style={[styles.btnSkipText, { color: C.muted }]}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={[styles.footer, { color: C.faint }]}>
            Your stream will be visible to all BartaOne subscribers
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <ScheduleModal
        visible={scheduleModalVisible}
        onClose={() => setScheduleModalVisible(false)}
        onSchedule={handleScheduleLive}
        C={C}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  scheduleSheet: {
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    paddingBottom: vs(20),
    maxHeight: SH * 0.85,
  },
  modalHandle: {
    width: scale(40),
    height: scale(4),
    borderRadius: scale(2),
    alignSelf: 'center',
    marginTop: vs(10),
    marginBottom: vs(6),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: vs(12),
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: sp(18), fontWeight: '700', letterSpacing: -0.3 },
  modalCloseBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleBody: { padding: scale(20), gap: vs(16) },
  scheduleSection: { gap: vs(10) },
  scheduleLabel: { fontSize: sp(13), fontWeight: '600', letterSpacing: 0.2 },
  dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(8) },
  dateOption: {
    flex: 1,
    minWidth: (SW - scale(64)) / 4,
    alignItems: 'center',
    paddingVertical: vs(10),
    borderRadius: scale(10),
    borderWidth: 1,
    gap: vs(2),
  },
  dateDay: { fontSize: sp(10), fontWeight: '600', textTransform: 'uppercase' },
  dateNumber: { fontSize: sp(20), fontWeight: '800' },
  dateMonth: { fontSize: sp(9), fontWeight: '500', textTransform: 'uppercase' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(6) },
  timeOption: {
    paddingHorizontal: scale(14),
    paddingVertical: vs(8),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  timeText: { fontSize: sp(12), fontWeight: '500' },
  scheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(14),
    borderRadius: scale(12),
    gap: scale(8),
    marginTop: vs(4),
  },
  scheduleBtnText: { color: '#FFFFFF', fontSize: sp(16), fontWeight: '700' },
  cancelBtn: {
    paddingVertical: vs(14),
    borderRadius: scale(12),
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelText: { fontSize: sp(15), fontWeight: '600' },
  scheduledIconWrap: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(12),
  },
  scheduledInfo: {
    flexDirection: 'row',
    gap: scale(20),
    padding: scale(14),
    borderRadius: scale(12),
    borderWidth: 1,
    marginTop: vs(12),
    marginBottom: vs(4),
  },
  scheduledInfoRow: { flexDirection: 'row', alignItems: 'center', gap: scale(6) },
  scheduledInfoText: { fontSize: sp(13), fontWeight: '500' },
  btnSchedule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(13),
    borderRadius: scale(13),
    borderWidth: 1.5,
    gap: scale(8),
  },
  btnScheduleText: { fontSize: sp(14), fontWeight: '600', letterSpacing: 0.1 },
  progressBar: {
    width: '80%',
    height: vs(4),
    backgroundColor: '#E0E0E0',
    borderRadius: scale(2),
    overflow: 'hidden',
    marginTop: vs(8),
  },
  progressFill: { height: '100%', borderRadius: scale(2) },
  liveThumbnail: {
    width: scale(200),
    height: scale(112),
    borderRadius: scale(12),
    marginBottom: vs(12),
  },
  streamKeyContainer: {
    marginTop: vs(12),
    padding: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    alignItems: 'center',
    width: '100%',
  },
  streamKeyLabel: {
    fontSize: sp(10),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: vs(4),
  },
  streamKeyValue: {
    fontSize: sp(14),
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyBtn: {
    marginTop: vs(6),
    paddingHorizontal: scale(12),
    paddingVertical: vs(4),
    borderRadius: scale(6),
  },
  copyBtnText: { fontSize: sp(11), fontWeight: '600' },
});

// ─── makeStyles function ────────────────────────────────────────────────────
function makeStyles(C) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg, paddingHorizontal: scale(24) },
    scrollContent: { flexGrow: 1, paddingBottom: vs(10) },
    topStripe: { height: 3, backgroundColor: C.accent, marginHorizontal: -scale(24) },
    loadingText: { fontSize: sp(14), fontWeight: '500' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(14),
      paddingTop: vs(14),
      paddingBottom: vs(6),
    },
    backBtn: {
      width: scale(38),
      height: scale(38),
      borderRadius: scale(11),
      borderWidth: StyleSheet.hairlineWidth,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    logoArea: { flexDirection: 'row', alignItems: 'center', gap: scale(12) },
    logoIconWrap: {
      width: scale(42),
      height: scale(42),
      borderRadius: scale(11),
      justifyContent: 'center',
      alignItems: 'center',
    },
    appName: {
      fontSize: sp(24),
      fontWeight: '800',
      color: C.primary,
      letterSpacing: -0.4,
      lineHeight: sp(28),
    },
    appNameAccent: { color: C.accent },
    tagline: {
      fontSize: sp(11),
      fontWeight: '400',
      letterSpacing: 0.4,
      marginTop: vs(1),
    },
    rule: {
      height: 1.5,
      backgroundColor: C.accent,
      marginBottom: vs(18),
      transformOrigin: 'left center',
      opacity: 0.7,
    },
    featuresCard: {
      backgroundColor: C.surface,
      borderRadius: scale(18),
      paddingHorizontal: scale(18),
      paddingTop: vs(12),
      paddingBottom: vs(4),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: C.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(4) },
      shadowOpacity: C.cardShadowOpacity,
      shadowRadius: scale(16),
      elevation: 4,
      marginBottom: vs(14),
    },
    featuresLabel: {
      fontSize: sp(10),
      fontWeight: '700',
      letterSpacing: 1.3,
      textTransform: 'uppercase',
      marginBottom: vs(8),
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: scale(13),
      paddingVertical: vs(12),
    },
    featureRowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border,
    },
    featureIconWrap: {
      width: scale(40),
      height: scale(40),
      borderRadius: scale(11),
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
      marginTop: vs(2),
    },
    featureTextCol: { flex: 1 },
    featureTitle: {
      fontSize: sp(13),
      fontWeight: '600',
      letterSpacing: -0.1,
      lineHeight: sp(18),
      marginBottom: vs(4),
    },
    inlineInput: {
      fontSize: sp(13.5),
      fontWeight: '400',
      borderBottomWidth: 1,
      paddingVertical: vs(4),
      paddingHorizontal: 0,
    },
    multilineInput: {
      minHeight: vs(48),
      textAlignVertical: 'top',
    },
    errorText: { fontSize: sp(11), marginTop: vs(3) },
    thumbArea: {
      width: '100%',
      height: vs(160),
      borderRadius: scale(13),
      borderWidth: 1.5,
      borderStyle: 'dashed',
      overflow: 'hidden',
      marginBottom: vs(8),
    },
    thumbImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    thumbOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      gap: vs(4),
    },
    thumbOverlayText: { color: '#FFFFFF', fontSize: sp(12), fontWeight: '600' },
    thumbPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: vs(6) },
    thumbPlaceholderTitle: { fontSize: sp(14), fontWeight: '600' },
    thumbPlaceholderSub: { fontSize: sp(11.5) },
    langCard: {
      backgroundColor: C.surfaceAlt,
      borderRadius: scale(16),
      paddingHorizontal: scale(16),
      paddingVertical: vs(14),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: C.border,
      marginBottom: vs(12),
    },
    langHeader: { flexDirection: 'row', alignItems: 'center', gap: scale(6), marginBottom: vs(10) },
    langLabel: { fontSize: sp(11.5), fontWeight: '600', letterSpacing: 0.1 },
    langChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(8) },
    langChip: {
      borderRadius: scale(10),
      paddingHorizontal: scale(12),
      paddingVertical: vs(6),
      borderWidth: StyleSheet.hairlineWidth,
    },
    langChipText: { fontSize: sp(12), fontWeight: '600' },
    tipCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: scale(14),
      paddingHorizontal: scale(14),
      paddingVertical: vs(12),
      borderWidth: StyleSheet.hairlineWidth,
      gap: scale(12),
      marginBottom: vs(6),
    },
    tipText: { flex: 1, fontSize: sp(12.5), lineHeight: sp(18) },
    btnGroup: { gap: scale(10) },
    btnPrimary: {
      borderRadius: scale(13),
      paddingVertical: vs(15),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: scale(9),
      shadowOffset: { width: 0, height: scale(5) },
      shadowOpacity: 0.32,
      shadowRadius: scale(12),
      elevation: 6,
    },
    btnPrimaryText: { fontSize: sp(16), fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.1 },
    btnSkip: {
      paddingVertical: vs(13),
      alignItems: 'center',
      borderRadius: scale(13),
      borderWidth: StyleSheet.hairlineWidth,
    },
    btnSkipText: { fontSize: sp(14), fontWeight: '400', letterSpacing: 0.1 },
    footer: {
      fontSize: sp(11),
      textAlign: 'center',
      marginTop: vs(12),
      marginBottom: vs(6),
      lineHeight: sp(16),
    },
    livePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(5),
      backgroundColor: C.accentBg,
      borderRadius: scale(20),
      paddingHorizontal: scale(10),
      paddingVertical: scale(5),
      borderWidth: 1,
      borderColor: C.accentBorder,
    },
    liveDotSmall: {
      width: scale(7),
      height: scale(7),
      borderRadius: scale(4),
      backgroundColor: '#FFFFFF',
    },
    liveText: { fontSize: sp(10), fontWeight: '700', color: C.accent, letterSpacing: 0.9 },
    endBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(5),
      borderRadius: scale(20),
      paddingHorizontal: scale(12),
      paddingVertical: scale(6),
      borderWidth: 1,
      marginLeft: 'auto',
    },
    endBtnText: { fontSize: sp(13), fontWeight: '700' },
    livePulseRing: {
      width: scale(100),
      height: scale(100),
      borderRadius: scale(50),
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: vs(16),
    },
    livePulseDot: {
      width: scale(76),
      height: scale(76),
      borderRadius: scale(38),
      justifyContent: 'center',
      alignItems: 'center',
    },
    liveStateTitle: { fontSize: sp(22), fontWeight: '800', letterSpacing: -0.3, marginBottom: vs(4) },
    liveStateSub: { fontSize: sp(13.5), fontWeight: '400' },
    statCard: {
      flex: 1,
      alignItems: 'center',
      borderRadius: scale(14),
      paddingVertical: vs(14),
      borderWidth: StyleSheet.hairlineWidth,
      gap: vs(6),
    },
    statIconWrap: {
      width: scale(36),
      height: scale(36),
      borderRadius: scale(10),
      justifyContent: 'center',
      alignItems: 'center',
    },
    statValue: { fontSize: sp(18), fontWeight: '700', letterSpacing: -0.2 },
    statLabel: { fontSize: sp(10.5), fontWeight: '500', letterSpacing: 0.1 },
  });
}