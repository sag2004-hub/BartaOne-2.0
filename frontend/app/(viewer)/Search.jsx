// app/(viewer)/Search.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, Keyboard, ActivityIndicator, ScrollView,
  Animated, Easing, useColorScheme, PixelRatio, Dimensions, StatusBar,
  KeyboardAvoidingView, Platform, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import ChannelCard from '../../components/ChannelCard';
import { searchContent } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// ─── Theme tokens ──────────────────────────────────────────────────────────────
const LIGHT = {
  bg: '#F8F9FA', surface: '#FFFFFF', surfaceAlt: '#FAFAF8', border: '#F0F0F0',
  accent: '#C8001A', accentBg: '#FFF0F2', accentBorder: 'rgba(200,0,26,0.18)',
  navy: '#0F1923', primary: '#333333', secondary: '#4A5A6B', muted: '#888888', faint: '#B8C0B8',
  white: '#FFFFFF', statusBar: 'dark-content',
  iconBlue: '#1A6DC8', iconBlueBg: '#EFF5FF',
  iconGreen: '#0E8A5A', iconGreenBg: '#EDFAF3',
  iconAmber: '#B87500', iconAmberBg: '#FFF7E8',
  cardShadowOpacity: 0.06, chipBg: '#F0F0F0', inputBg: '#F0F0F0',
  fallbackBg: '#FFF8F0', fallbackBorder: '#F4A261', fallbackText: '#C07A3A',
  tabActiveBg: '#FFF0F2', categoryBg: '#F0F0F0', categoryActive: '#C8001A',
  categoryText: '#666666', categoryTextActive: '#FFFFFF',
};
const DARK = {
  bg: '#0D1117', surface: '#161B22', surfaceAlt: '#1C2330', border: '#2A3340',
  accent: '#E8192C', accentBg: 'rgba(232,25,44,0.12)', accentBorder: 'rgba(232,25,44,0.25)',
  navy: '#E8EDF2', primary: '#EDF2F7', secondary: '#8B9BAB', muted: '#5C6E80', faint: '#3A4A58',
  white: '#FFFFFF', statusBar: 'light-content',
  iconBlue: '#60A5FA', iconBlueBg: 'rgba(96,165,250,0.12)',
  iconGreen: '#34D399', iconGreenBg: 'rgba(52,211,153,0.12)',
  iconAmber: '#FBBF24', iconAmberBg: 'rgba(251,191,36,0.12)',
  cardShadowOpacity: 0.35, chipBg: '#1C2330', inputBg: '#1C2330',
  fallbackBg: 'rgba(244,162,97,0.10)', fallbackBorder: '#F4A261', fallbackText: '#F4A261',
  tabActiveBg: 'rgba(232,25,44,0.12)', categoryBg: '#1C2330', categoryActive: '#E8192C',
  categoryText: '#8B9BAB', categoryTextActive: '#FFFFFF',
};

// ─── Data constants ────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',           label: 'All',           icon: 'apps-outline' },
  { id: 'news',          label: 'News',          icon: 'newspaper-outline' },
  { id: 'entertainment', label: 'Entertainment', icon: 'film-outline' },
  { id: 'sports',        label: 'Sports',        icon: 'basketball-outline' },
  { id: 'business',      label: 'Business',      icon: 'business-outline' },
  { id: 'technology',    label: 'Tech',          icon: 'hardware-chip-outline' },
  { id: 'lifestyle',     label: 'Lifestyle',     icon: 'leaf-outline' },
];

// ─── Normalize a channel object so `name` is always populated ─────────────────
const normalizeChannel = (channel) => ({
  ...channel,
  name: channel.name || channel.channelName || channel.title || 'Unknown Channel',
});

// ─── Live dot ──────────────────────────────────────────────────────────────────
function LiveDot({ C }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.5, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,   duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Animated.View style={{
      width: scale(7), height: scale(7), borderRadius: scale(4),
      backgroundColor: C.accent, transform: [{ scale: pulse }],
    }} />
  );
}

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ icon, color, title, count, C }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8), marginBottom: verticalScale(10), marginTop: verticalScale(4) }}>
      <View style={{ width: scale(26), height: scale(26), borderRadius: scale(7), backgroundColor: `${color}22`, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name={`${icon}-outline`} size={moderateScale(14)} color={color} />
      </View>
      <Text style={{ flex: 1, fontSize: fontScale(13.5), fontWeight: '700', color: C.primary, letterSpacing: -0.1 }}>{title}</Text>
      <View style={{ paddingHorizontal: scale(8), paddingVertical: verticalScale(2), borderRadius: scale(20), backgroundColor: `${color}22` }}>
        <Text style={{ fontSize: fontScale(11), fontWeight: '700', color }}>{count}</Text>
      </View>
    </View>
  );
}

// ─── Fallback banner ───────────────────────────────────────────────────────────
function FallbackBanner({ message, C }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'flex-start', gap: scale(8),
      backgroundColor: C.fallbackBg, borderLeftWidth: 3, borderLeftColor: C.fallbackBorder,
      borderRadius: scale(10), padding: scale(12), marginBottom: verticalScale(12),
    }}>
      <Ionicons name="information-circle-outline" size={moderateScale(17)} color={C.fallbackBorder} />
      <Text style={{ flex: 1, fontSize: fontScale(12.5), lineHeight: fontScale(18), color: C.fallbackText }}>{message}</Text>
    </View>
  );
}

// ─── Field component ───────────────────────────────────────────────────────────
const Field = React.memo(({ C, ionicon, placeholder, value, onChange, nextRef, isLast, inputRef, onSubmit }) => (
  <View style={{
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    minHeight: verticalScale(50),
    backgroundColor: C.surface,
  }}>
    <Ionicons name={ionicon} size={moderateScale(16)} color={C.muted} style={{ marginRight: scale(10) }} />
    <TextInput
      ref={inputRef}
      style={{
        flex: 1,
        fontSize: fontScale(14),
        color: C.primary,
        paddingVertical: verticalScale(8),
        backgroundColor: 'transparent',
        padding: 0, // Remove default padding on Android
      }}
      placeholder={placeholder}
      placeholderTextColor={C.faint}
      value={value}
      onChangeText={onChange}
      returnKeyType={isLast ? 'search' : 'next'}
      onSubmitEditing={isLast ? onSubmit : () => nextRef?.current?.focus()}
      blurOnSubmit={false}
      keyboardType="default"
      autoCorrect={false}
      autoCapitalize="words"
    />
    {value.length > 0 && (
      <TouchableOpacity
        onPress={() => onChange('')}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <Ionicons name="close-circle" size={moderateScale(16)} color={C.faint} />
      </TouchableOpacity>
    )}
  </View>
));

// ─── Location form card ────────────────────────────────────────────────────────
function LocationForm({ C, onSearch, isLoading, onClear }) {
  const [state,    setState]    = useState('');
  const [district, setDistrict] = useState('');
  const [city,     setCity]     = useState('');

  const stateRef = useRef(null);
  const distRef  = useRef(null);
  const cityRef  = useRef(null);

  const canSearch = !!(state.trim() || district.trim() || city.trim());

  const submit = useCallback(() => {
    if (!canSearch) return;
    Keyboard.dismiss();
    onSearch({ state: state.trim(), district: district.trim(), city: city.trim() });
  }, [canSearch, state, district, city, onSearch]);

  const handleClear = useCallback(() => {
    setState('');
    setDistrict('');
    setCity('');
    if (onClear) onClear();
    stateRef.current?.focus();
  }, [onClear]);

  return (
    <View style={{
      marginHorizontal: scale(20),
      marginTop: verticalScale(14),
      marginBottom: verticalScale(10),
      backgroundColor: C.surface,
      borderRadius: scale(18),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: C.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(4) },
      shadowOpacity: C.cardShadowOpacity,
      shadowRadius: scale(16),
      elevation: 4,
      overflow: 'hidden',
    }}>
      <Text style={{
        fontSize: fontScale(9.5), fontWeight: '700', letterSpacing: 1.4,
        textTransform: 'uppercase', color: C.faint,
        paddingHorizontal: scale(16), paddingTop: verticalScale(14), paddingBottom: verticalScale(6),
      }}>
        SEARCH BY LOCATION
      </Text>

      <Field
        C={C}
        ionicon="business-outline"
        placeholder="State (e.g. West Bengal)"
        value={state}
        onChange={setState}
        nextRef={distRef}
        inputRef={stateRef}
        onSubmit={submit}
      />

      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginHorizontal: scale(16) }} />

      <Field
        C={C}
        ionicon="map-outline"
        placeholder="District (e.g. Paschim Medinipur)"
        value={district}
        onChange={setDistrict}
        nextRef={cityRef}
        inputRef={distRef}
        onSubmit={submit}
      />

      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginHorizontal: scale(16) }} />

      <Field
        C={C}
        ionicon="location-outline"
        placeholder="City / Area (e.g. Belda)"
        value={city}
        onChange={setCity}
        isLast
        inputRef={cityRef}
        onSubmit={submit}
      />

      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: scale(10),
        padding: scale(14),
        borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border,
        marginTop: verticalScale(4),
      }}>
        <TouchableOpacity
          style={{
            paddingHorizontal: scale(16), paddingVertical: verticalScale(11),
            borderRadius: scale(10), borderWidth: StyleSheet.hairlineWidth, borderColor: C.border,
            minHeight: verticalScale(42),
          }}
          onPress={handleClear}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: fontScale(13.5), color: C.muted, fontWeight: '500' }}>Clear All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: scale(6), paddingVertical: verticalScale(11), borderRadius: scale(10),
            backgroundColor: canSearch ? C.accent : C.inputBg,
            opacity: isLoading ? 0.7 : 1,
            minHeight: verticalScale(42),
          }}
          onPress={submit}
          disabled={!canSearch || isLoading}
          activeOpacity={0.82}
        >
          {isLoading
            ? <ActivityIndicator size="small" color={canSearch ? '#FFF' : C.muted} />
            : <>
                <Ionicons name="search" size={moderateScale(15)} color={canSearch ? '#FFF' : C.muted} />
                <Text style={{ fontSize: fontScale(14), fontWeight: '700', color: canSearch ? '#FFF' : C.muted }}>
                  Find Channels
                </Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Location results ─────────────────────────────────────────────────────────
function LocationResults({ results, router, C, category }) {
  if (!results) return null;

  const filterByCategory = (channels) => {
    if (category === 'all' || !category) return channels;
    return channels.filter(ch => ch.category?.toLowerCase() === category.toLowerCase());
  };

  const exactCity        = filterByCategory(results.exactCity        || []);
  const districtFallback = filterByCategory(results.districtFallback || []);
  const stateFallback    = filterByCategory(results.stateFallback    || []);

  const hasExact = exactCity.length > 0;
  const hasDist  = districtFallback.length > 0;
  const hasState = stateFallback.length > 0;
  const label    = results.searchedCity || results.searchedDistrict || results.searchedState || 'your location';

  const handleChannelPress = async (channel) => {
    try {
      const stored = await AsyncStorage.getItem('recentlyViewedChannels');
      let recent = stored ? JSON.parse(stored) : [];
      recent = recent.filter(ch => ch._id !== channel._id);
      const normalized = normalizeChannel(channel);
      recent = [normalized, ...recent].slice(0, 10);
      await AsyncStorage.setItem('recentlyViewedChannels', JSON.stringify(recent));
    } catch (e) {
      console.error('Failed to save recent channel:', e);
    }
    router.push(`/(viewer)/ChannelDetails?id=${channel._id}`);
  };

  const renderCh = (ch) => (
    <ChannelCard
      key={ch._id}
      channel={ch}
      onPress={() => handleChannelPress(ch)}
    />
  );

  if (!hasExact && !hasDist && !hasState) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: scale(40), gap: verticalScale(12), minHeight: 200 }}>
        <View style={{ width: scale(72), height: scale(72), borderRadius: scale(20), backgroundColor: C.accentBg, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="location-outline" size={moderateScale(32)} color={C.accent} />
        </View>
        <Text style={{ fontSize: fontScale(17), fontWeight: '700', color: C.primary, textAlign: 'center' }}>No Channels Found</Text>
        <Text style={{ fontSize: fontScale(13), lineHeight: fontScale(20), color: C.muted, textAlign: 'center' }}>
          {category !== 'all'
            ? `No ${category} channels found in ${label}.`
            : `We couldn't find any channels in ${label}.`}
          {'\n'}Try a broader area.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: scale(20), paddingTop: verticalScale(14), paddingBottom: verticalScale(40) }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {hasExact && (
        <>
          <SectionHeader icon="location" color={C.accent}    title={`Channels in ${results.searchedCity || label}`}            count={exactCity.length}        C={C} />
          {exactCity.map(renderCh)}
        </>
      )}
      {!hasExact && results.searchedCity && hasDist && (
        <>
          <FallbackBanner message={`No channels in ${results.searchedCity} — showing channels across ${results.searchedDistrict} district`} C={C} />
          <SectionHeader icon="map"      color={C.iconAmber} title={`${results.searchedDistrict} District`}                       count={districtFallback.length} C={C} />
          {districtFallback.map(renderCh)}
        </>
      )}
      {!hasExact && !hasDist && results.searchedDistrict && hasState && (
        <>
          <FallbackBanner message={`No channels in ${results.searchedDistrict} — showing channels across ${results.searchedState}`} C={C} />
          <SectionHeader icon="business" color={C.iconGreen} title={results.searchedState}                                        count={stateFallback.length}    C={C} />
          {stateFallback.map(renderCh)}
        </>
      )}
      {hasExact && hasDist && (
        <>
          <View style={{ height: verticalScale(24) }} />
          <SectionHeader icon="map"      color={C.iconAmber} title={`More in ${results.searchedDistrict} District`}               count={districtFallback.length} C={C} />
          {districtFallback.map(renderCh)}
        </>
      )}
    </ScrollView>
  );
}

// ─── Recent Section ────────────────────────────────────────────────────────────
function RecentSection({ C, onSelectLocation, router, refreshTrigger, category }) {
  const [activeTab,       setActiveTab]       = useState('locations');
  const [recentLocations, setRecentLocations] = useState([]);
  const [recentChannels,  setRecentChannels]  = useState([]);
  const tabAnim = useRef(new Animated.Value(0)).current;

  const loadRecents = useCallback(async () => {
    try {
      const [locStored, chStored] = await Promise.all([
        AsyncStorage.getItem('recentLocations'),
        AsyncStorage.getItem('recentlyViewedChannels'),
      ]);
      if (locStored) {
        const parsed = JSON.parse(locStored);
        setRecentLocations(Array.isArray(parsed) ? parsed : []);
      }
      if (chStored) {
        const parsed = JSON.parse(chStored);
        setRecentChannels(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      console.error('Failed to load recents:', e);
      setRecentLocations([]);
      setRecentChannels([]);
    }
  }, []);

  useEffect(() => {
    loadRecents();
  }, [loadRecents, refreshTrigger]);

  useFocusEffect(
    useCallback(() => {
      loadRecents();
    }, [loadRecents])
  );

  const clearLocations = async () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all recent location searches?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('recentLocations');
            setRecentLocations([]);
          },
        },
      ]
    );
  };

  const clearChannels = async () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all recently viewed channels?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('recentlyViewedChannels');
            setRecentChannels([]);
          },
        },
      ]
    );
  };

  const clearAllHistory = async () => {
    Alert.alert(
      'Clear All History',
      'Are you sure you want to clear all search history and recently viewed channels?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('recentLocations');
            await AsyncStorage.removeItem('recentlyViewedChannels');
            setRecentLocations([]);
            setRecentChannels([]);
          },
        },
      ]
    );
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    Animated.timing(tabAnim, {
      toValue: tab === 'locations' ? 0 : 1,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const indicatorLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '50%'],
  });

  const filteredChannels = category === 'all' || !category
    ? recentChannels
    : recentChannels.filter(ch => ch.category?.toLowerCase() === category.toLowerCase());

  const handleChannelPress = async (channel) => {
    try {
      const stored = await AsyncStorage.getItem('recentlyViewedChannels');
      let recent = stored ? JSON.parse(stored) : [];
      recent = recent.filter(ch => ch._id !== channel._id);
      const normalized = normalizeChannel(channel);
      recent = [normalized, ...recent].slice(0, 10);
      await AsyncStorage.setItem('recentlyViewedChannels', JSON.stringify(recent));
      loadRecents();
    } catch (e) {
      console.error('Failed to save recent channel:', e);
    }
    router.push(`/(viewer)/ChannelDetails?id=${channel._id}`);
  };

  const getLocationDisplay = (item) => {
    const parts = [];
    if (item.city)     parts.push(item.city);
    if (item.district) parts.push(item.district);
    if (item.state)    parts.push(item.state);
    return parts.join(', ') || 'Unknown location';
  };

  return (
    <View style={{ paddingHorizontal: scale(20), paddingTop: verticalScale(14), paddingBottom: verticalScale(30) }}>

      {/* ── Tab switcher ── */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: C.inputBg,
        borderRadius: scale(12),
        padding: scale(3),
        marginBottom: verticalScale(16),
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Animated.View style={{
          position: 'absolute',
          top: scale(3), bottom: scale(3),
          left: indicatorLeft,
          width: '50%',
          backgroundColor: C.surface,
          borderRadius: scale(10),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: C.cardShadowOpacity * 1.5,
          shadowRadius: 4,
          elevation: 2,
        }} />

        <TouchableOpacity
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(5), paddingVertical: verticalScale(9), zIndex: 1 }}
          onPress={() => switchTab('locations')}
          activeOpacity={0.8}
        >
          <Ionicons name="time-outline" size={moderateScale(14)} color={activeTab === 'locations' ? C.accent : C.muted} />
          <Text style={{
            fontSize: fontScale(13),
            fontWeight: activeTab === 'locations' ? '700' : '500',
            color: activeTab === 'locations' ? C.accent : C.muted,
          }}>Locations</Text>
          {recentLocations.length > 0 && (
            <View style={{
              minWidth: scale(16), height: scale(16), borderRadius: scale(8),
              backgroundColor: activeTab === 'locations' ? C.accentBg : C.border,
              justifyContent: 'center', alignItems: 'center', paddingHorizontal: scale(4),
            }}>
              <Text style={{ fontSize: fontScale(10), fontWeight: '700', color: activeTab === 'locations' ? C.accent : C.muted }}>
                {recentLocations.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(5), paddingVertical: verticalScale(9), zIndex: 1 }}
          onPress={() => switchTab('channels')}
          activeOpacity={0.8}
        >
          <Ionicons name="tv-outline" size={moderateScale(14)} color={activeTab === 'channels' ? C.accent : C.muted} />
          <Text style={{
            fontSize: fontScale(13),
            fontWeight: activeTab === 'channels' ? '700' : '500',
            color: activeTab === 'channels' ? C.accent : C.muted,
          }}>Channels</Text>
          {filteredChannels.length > 0 && (
            <View style={{
              minWidth: scale(16), height: scale(16), borderRadius: scale(8),
              backgroundColor: activeTab === 'channels' ? C.accentBg : C.border,
              justifyContent: 'center', alignItems: 'center', paddingHorizontal: scale(4),
            }}>
              <Text style={{ fontSize: fontScale(10), fontWeight: '700', color: activeTab === 'channels' ? C.accent : C.muted }}>
                {filteredChannels.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Clear all button ── */}
      {(recentLocations.length > 0 || recentChannels.length > 0) && (
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: scale(6),
            paddingVertical: verticalScale(8),
            marginBottom: verticalScale(12),
            backgroundColor: C.accentBg,
            borderRadius: scale(8),
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: C.accentBorder,
            minHeight: verticalScale(38),
          }}
          onPress={clearAllHistory}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={moderateScale(14)} color={C.accent} />
          <Text style={{ fontSize: fontScale(12), color: C.accent, fontWeight: '600' }}>
            Clear All History
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Locations tab ── */}
      {activeTab === 'locations' && (
        recentLocations.length === 0
          ? <EmptyTabState icon="location-outline" message="Your recent location searches will appear here" C={C} />
          : (
            <>
              <Text style={[styles.recentHeading, { color: C.faint }]}>RECENT LOCATIONS</Text>
              {recentLocations.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.recentRow,
                    { borderBottomColor: C.border },
                    idx === recentLocations.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => onSelectLocation(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.recentIconWrap, { backgroundColor: C.inputBg }]}>
                    <Ionicons name="location-outline" size={moderateScale(15)} color={C.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.recentText, { color: C.primary }]}>
                      {getLocationDisplay(item)}
                    </Text>
                    <Text style={{ fontSize: fontScale(11), color: C.muted, marginTop: verticalScale(2) }}>
                      {item.city ? 'City search' : item.district ? 'District search' : 'State search'}
                    </Text>
                  </View>
                  <View style={{ padding: scale(6), borderRadius: scale(8), backgroundColor: C.inputBg }}>
                    <Ionicons name="arrow-redo-outline" size={moderateScale(13)} color={C.muted} />
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={{ marginTop: verticalScale(14), alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: scale(4) }}
                onPress={clearLocations}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={moderateScale(13)} color={C.muted} />
                <Text style={{ fontSize: fontScale(12), color: C.muted }}>Clear locations</Text>
              </TouchableOpacity>
            </>
          )
      )}

      {/* ── Channels tab ── */}
      {activeTab === 'channels' && (
        filteredChannels.length === 0
          ? <EmptyTabState
              icon="tv-outline"
              message={category !== 'all' ? `No ${category} channels viewed recently` : 'Channels you visit will show up here for quick access'}
              C={C}
            />
          : (
            <>
              <Text style={[styles.recentHeading, { color: C.faint }]}>
                {category !== 'all' ? `${category.toUpperCase()} CHANNELS` : 'RECENTLY VIEWED'}
              </Text>
              {filteredChannels.map((ch, idx) => (
                <TouchableOpacity
                  key={ch._id || idx}
                  style={[
                    styles.recentRow,
                    { borderBottomColor: C.border },
                    idx === filteredChannels.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => handleChannelPress(ch)}
                  activeOpacity={0.7}
                >
                  {/* Logo */}
                  <View style={{
                    width: scale(38), height: scale(38), borderRadius: scale(10),
                    backgroundColor: C.inputBg, overflow: 'hidden',
                    justifyContent: 'center', alignItems: 'center',
                    borderWidth: StyleSheet.hairlineWidth, borderColor: C.border,
                  }}>
                    {ch.logo
                      ? <Image source={{ uri: ch.logo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      : <Ionicons name="tv-outline" size={moderateScale(18)} color={C.muted} />
                    }
                  </View>

                  {/* Name + location */}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.recentText, { color: C.primary }]} numberOfLines={1}>
                      {ch.name || ch.channelName || ch.title || 'Unknown Channel'}
                    </Text>
                    <Text style={{ fontSize: fontScale(11), color: C.muted, marginTop: verticalScale(2) }} numberOfLines={1}>
                      {[ch.city, ch.district, ch.state].filter(Boolean).join(', ') || ch.category || ''}
                    </Text>
                  </View>

                  {/* Category badge + chevron */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6) }}>
                    {ch.category && (
                      <View style={{ paddingHorizontal: scale(7), paddingVertical: verticalScale(3), borderRadius: scale(6), backgroundColor: C.inputBg }}>
                        <Text style={{ fontSize: fontScale(10), color: C.secondary, fontWeight: '500' }}>{ch.category}</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={moderateScale(13)} color={C.faint} />
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={{ marginTop: verticalScale(14), alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: scale(4) }}
                onPress={clearChannels}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={moderateScale(13)} color={C.muted} />
                <Text style={{ fontSize: fontScale(12), color: C.muted }}>Clear channels</Text>
              </TouchableOpacity>
            </>
          )
      )}
    </View>
  );
}

// ─── Empty tab state ───────────────────────────────────────────────────────────
function EmptyTabState({ icon, message, C }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: verticalScale(28), gap: verticalScale(10) }}>
      <View style={{ width: scale(52), height: scale(52), borderRadius: scale(14), backgroundColor: C.inputBg, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name={icon} size={moderateScale(24)} color={C.faint} />
      </View>
      <Text style={{ fontSize: fontScale(13), color: C.muted, textAlign: 'center', lineHeight: fontScale(20), maxWidth: scale(240) }}>
        {message}
      </Text>
    </View>
  );
}

// ─── Loading view ──────────────────────────────────────────────────────────────
function LoadingView({ C }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: verticalScale(12), minHeight: 200 }}>
      <ActivityIndicator size="large" color={C.accent} />
      <Text style={{ fontSize: fontScale(14), color: C.muted }}>Searching locations…</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function Search() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;

  const [category,        setCategory]        = useState('all');
  const [locationResults, setLocationResults] = useState(null);
  const [isLoading,       setIsLoading]       = useState(false);
  const [hasSearched,     setHasSearched]     = useState(false);
  const [refreshTrigger,  setRefreshTrigger]  = useState(0);

  // Entrance animations
  const headerAnim  = useRef(new Animated.Value(0)).current;
  const chipAnim    = useRef(new Animated.Value(0)).current;
  const barAnim     = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(55, [
      Animated.timing(headerAnim,  { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(chipAnim,    { toValue: 1, duration: 260, easing: Easing.out(Easing.quad),  useNativeDriver: true }),
      Animated.timing(barAnim,     { toValue: 1, duration: 260, easing: Easing.out(Easing.quad),  useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad),  useNativeDriver: true }),
    ]).start();
  }, []);

  const slideUp = (anim, dy = verticalScale(14)) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [dy, 0] }) }],
  });

  // ─── Clear all search results ────────────────────────────────────────────────
  const handleClearAll = useCallback(() => {
    setLocationResults(null);
    setHasSearched(false);
    setRefreshTrigger(prev => prev + 1);
    Keyboard.dismiss();
  }, []);

  // ─── Search handler ──────────────────────────────────────────────────────────
  const handleLocationSearch = useCallback(async ({ state, district, city }) => {
    setIsLoading(true);
    setHasSearched(true);
    setLocationResults(null);

    try {
      const locationQuery = city || district || state || '';
      if (!locationQuery) { setIsLoading(false); return; }

      const res = await searchContent(locationQuery, 'location', category, { state, district, city, mode: 'location' });

      setLocationResults({
        exactCity:        res.exactCity        || [],
        districtFallback: res.districtFallback || [],
        stateFallback:    res.stateFallback    || [],
        searchedCity:     city     || district || state,
        searchedDistrict: district || state,
        searchedState:    state,
      });

      // Save to recent locations
      const stored = await AsyncStorage.getItem('recentLocations');
      let recent = stored ? JSON.parse(stored) : [];
      const newEntry = { state, district, city };
      recent = [newEntry, ...recent.filter(r =>
        r.state !== state || r.district !== district || r.city !== city
      )].slice(0, 5);
      await AsyncStorage.setItem('recentLocations', JSON.stringify(recent));
      setRefreshTrigger(prev => prev + 1);

    } catch (e) {
      console.error('Location search error:', e);
      setLocationResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  // ─── Handle category change ──────────────────────────────────────────────────
  const handleCategoryChange = useCallback((key) => {
    setCategory(key);
    if (locationResults) {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [locationResults]);

  // ─── Render body ─────────────────────────────────────────────────────────────
  const renderContent = () => {
    if (isLoading && !locationResults) return <LoadingView C={C} />;

    if (locationResults) {
      return <LocationResults results={locationResults} router={router} C={C} category={category} />;
    }

    if (hasSearched && !locationResults) {
      return (
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIconWrap, { backgroundColor: C.accentBg }]}>
            <Ionicons name="location-outline" size={moderateScale(32)} color={C.accent} />
          </View>
          <Text style={[styles.emptyTitle, { color: C.primary }]}>No Results</Text>
          <Text style={[styles.emptySub, { color: C.muted }]}>
            {category !== 'all'
              ? `No ${category} channels found for this location.`
              : 'No channels found for this location.'}
            {'\n'}Try a broader area.
          </Text>
          <TouchableOpacity
            style={{
              marginTop: verticalScale(16),
              paddingHorizontal: scale(20),
              paddingVertical: verticalScale(10),
              borderRadius: scale(10),
              backgroundColor: C.accent,
              minHeight: verticalScale(42),
            }}
            onPress={handleClearAll}
            activeOpacity={0.7}
          >
            <Text style={{ color: '#FFF', fontWeight: '600', fontSize: fontScale(14) }}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <RecentSection
        C={C}
        onSelectLocation={handleLocationSearch}
        router={router}
        refreshTrigger={refreshTrigger}
        category={category}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} translucent={false} />

      <View style={[styles.topStripe, { backgroundColor: C.accent }]} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: verticalScale(20) }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={true}
        >
          {/* ── Header ── */}
          <Animated.View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }, slideUp(headerAnim, verticalScale(18))]}>
            <View>
              <Text style={[styles.headerTitle, { color: C.primary }]}>Search</Text>
              <Text style={[styles.headerSub,   { color: C.muted  }]}>Find channels by location</Text>
            </View>
            <View style={[styles.livePill, { backgroundColor: C.accentBg, borderColor: C.accentBorder }]}>
              <LiveDot C={C} />
              <Text style={[styles.liveText, { color: C.accent }]}>LIVE</Text>
            </View>
          </Animated.View>

          {/* ── Category chips ── */}
          <Animated.View style={slideUp(chipAnim, verticalScale(10))}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
              keyboardShouldPersistTaps="handled"
            >
              {CATEGORIES.map(({ id, label, icon }) => {
                const active = category === id;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? C.categoryActive : C.categoryBg,
                        borderColor:     active ? C.categoryActive : C.border,
                      },
                    ]}
                    onPress={() => handleCategoryChange(id)}
                    activeOpacity={0.78}
                  >
                    <Ionicons name={icon} size={moderateScale(18)} color={active ? C.categoryTextActive : C.categoryText} />
                    <Text style={[
                      styles.chipLabel,
                      {
                        color:      active ? C.categoryTextActive : C.categoryText,
                        fontWeight: active ? '700' : '500',
                      },
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* ── Location form + results ── */}
          <Animated.View style={slideUp(barAnim)}>
            <LocationForm
              C={C}
              onSearch={handleLocationSearch}
              isLoading={isLoading}
              onClear={handleClearAll}
            />

            <Animated.View style={{ opacity: contentAnim }}>
              {renderContent()}
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Static styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:          { flex: 1 },
  topStripe:     { height: verticalScale(3) },

  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(20), paddingVertical: verticalScale(12), borderBottomWidth: StyleSheet.hairlineWidth, minHeight: verticalScale(60) },
  headerTitle:   { fontSize: fontScale(22), fontWeight: '800', letterSpacing: -0.4 },
  headerSub:     { fontSize: fontScale(11), marginTop: verticalScale(2), letterSpacing: 0.1 },
  livePill:      { flexDirection: 'row', alignItems: 'center', gap: scale(5), paddingHorizontal: scale(10), paddingVertical: verticalScale(5), borderRadius: scale(20), borderWidth: 1, minHeight: verticalScale(30) },
  liveText:      { fontSize: fontScale(10), fontWeight: '700', letterSpacing: 0.9 },

  chipsRow:      { paddingHorizontal: scale(16), paddingVertical: verticalScale(10), gap: scale(10) },
  chip:          { flexDirection: 'row', alignItems: 'center', gap: scale(6), paddingHorizontal: scale(14), paddingVertical: verticalScale(7), borderRadius: scale(20), borderWidth: StyleSheet.hairlineWidth, minHeight: verticalScale(36) },
  chipLabel:     { fontSize: fontScale(13) },

  recentHeading: { fontSize: fontScale(9.5), fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: verticalScale(10) },
  recentRow:     { flexDirection: 'row', alignItems: 'center', gap: scale(12), paddingVertical: verticalScale(13), borderBottomWidth: StyleSheet.hairlineWidth, minHeight: verticalScale(50) },
  recentIconWrap:{ width: scale(32), height: scale(32), borderRadius: scale(9), justifyContent: 'center', alignItems: 'center' },
  recentText:    { fontSize: fontScale(14), fontWeight: '500' },

  emptyWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: scale(40), gap: verticalScale(10), minHeight: 200 },
  emptyIconWrap: { width: scale(72), height: scale(72), borderRadius: scale(20), justifyContent: 'center', alignItems: 'center', marginBottom: verticalScale(4) },
  emptyTitle:    { fontSize: fontScale(17), fontWeight: '700', letterSpacing: -0.2, textAlign: 'center' },
  emptySub:      { fontSize: fontScale(13), lineHeight: fontScale(20), textAlign: 'center' },
});