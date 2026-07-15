import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ScrollView,
  Dimensions,
  PixelRatio,
  useColorScheme,
  Modal,
  Pressable,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import NewspaperCard from '../../components/NewspaperCard';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import useNewspaper from '../../hooks/useNewspaper';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Responsive helpers ──────────────────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

const scale = (size) => {
  const s = Math.min(Math.max(SCREEN_WIDTH / BASE_WIDTH, 0.7), 1.3);
  return Math.round(s * size);
};
const verticalScale = (size) => {
  const s = Math.min(Math.max(SCREEN_HEIGHT / BASE_HEIGHT, 0.7), 1.3);
  return Math.round(s * size);
};
const moderateScale = (size, factor = 0.5) =>
  Math.round(size + (scale(size) - size) * factor);
const fontScale = (size) => {
  const s = Math.min(
    Math.min(Math.max(SCREEN_WIDTH / BASE_WIDTH, 0.7), 1.3),
    Math.min(Math.max(SCREEN_HEIGHT / BASE_HEIGHT, 0.7), 1.3),
  );
  return Math.round((size * s) / PixelRatio.getFontScale());
};

// ─── Theme ───────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: '#F2F0EB',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFAF8',
  border: '#E4E0D8',
  accent: '#C8001A',
  accentBg: '#FFF0F2',
  accentBorder: 'rgba(200,0,26,0.18)',
  primary: '#1A2733',
  secondary: '#4A5A6B',
  muted: '#8A97A5',
  faint: '#B8C0B8',
  white: '#FFFFFF',
  cardShadowOpacity: 0.06,
  inputBg: '#F2F0EB',
  categoryBg: '#EFEFEF',
  categoryActive: '#C8001A',
  categoryText: '#555555',
  categoryTextActive: '#FFFFFF',
  dropdownBg: '#FFFFFF',
  dropdownItem: '#F7F7F7',
  dropdownItemActive: '#FFF0F2',
  dropdownItemActiveText: '#C8001A',
  tagBg: '#FFF0F2',
  tagText: '#C8001A',
  tagBorder: '#F5C0C8',
  fallbackBg: '#FFF8F0',
  fallbackBorder: '#F4A261',
  fallbackText: '#C07A3A',
  statusBar: 'dark-content',
};

const DARK = {
  bg: '#0D1117',
  surface: '#161B22',
  surfaceAlt: '#1C2330',
  border: '#2A3340',
  accent: '#E8192C',
  accentBg: 'rgba(232,25,44,0.12)',
  accentBorder: 'rgba(232,25,44,0.25)',
  primary: '#EDF2F7',
  secondary: '#8B9BAB',
  muted: '#5C6E80',
  faint: '#3A4A58',
  white: '#FFFFFF',
  cardShadowOpacity: 0.35,
  inputBg: '#1C2330',
  categoryBg: '#1C2330',
  categoryActive: '#E8192C',
  categoryText: '#8B9BAB',
  categoryTextActive: '#FFFFFF',
  dropdownBg: '#1C2330',
  dropdownItem: '#222B38',
  dropdownItemActive: 'rgba(232,25,44,0.15)',
  dropdownItemActiveText: '#E8192C',
  tagBg: 'rgba(232,25,44,0.15)',
  tagText: '#E8192C',
  tagBorder: 'rgba(232,25,44,0.3)',
  fallbackBg: 'rgba(244,162,97,0.10)',
  fallbackBorder: '#F4A261',
  fallbackText: '#F4A261',
  statusBar: 'light-content',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const isToday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
};

// ─── Field Component ──────────────────────────────────────────────────────────
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
        padding: 0,
      }}
      placeholder={placeholder}
      placeholderTextColor={C.faint || C.muted}
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
        <Ionicons name="close-circle" size={moderateScale(16)} color={C.faint || C.muted} />
      </TouchableOpacity>
    )}
  </View>
));

// ─── Location Search Form ────────────────────────────────────────────────────
function LocationSearchForm({ C, onSearch, isLoading, onClear }) {
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');

  const stateRef = useRef(null);
  const distRef = useRef(null);
  const cityRef = useRef(null);

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
      borderWidth: StyleSheet.hairlineWidth || 1,
      borderColor: C.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(4) },
      shadowOpacity: C.cardShadowOpacity || 0.06,
      shadowRadius: scale(16),
      elevation: 4,
      overflow: 'hidden',
    }}>
      <Text style={{
        fontSize: fontScale(9.5), fontWeight: '700', letterSpacing: 1.4,
        textTransform: 'uppercase', color: C.faint || C.muted,
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

      <View style={{ height: StyleSheet.hairlineWidth || 1, backgroundColor: C.border, marginHorizontal: scale(16) }} />

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

      <View style={{ height: StyleSheet.hairlineWidth || 1, backgroundColor: C.border, marginHorizontal: scale(16) }} />

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
        borderTopWidth: StyleSheet.hairlineWidth || 1, borderTopColor: C.border,
        marginTop: verticalScale(4),
      }}>
        <TouchableOpacity
          style={{
            paddingHorizontal: scale(16), paddingVertical: verticalScale(11),
            borderRadius: scale(10), borderWidth: StyleSheet.hairlineWidth || 1, borderColor: C.border,
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
                  Find Newspapers
                </Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────
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

// ─── Fallback Banner ──────────────────────────────────────────────────────────
function FallbackBanner({ message, C }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'flex-start', gap: scale(8),
      backgroundColor: C.fallbackBg || C.accentBg, borderLeftWidth: 3, borderLeftColor: C.fallbackBorder || C.accent,
      borderRadius: scale(10), padding: scale(12), marginBottom: verticalScale(12),
    }}>
      <Ionicons name="information-circle-outline" size={moderateScale(17)} color={C.fallbackBorder || C.accent} />
      <Text style={{ flex: 1, fontSize: fontScale(12.5), lineHeight: fontScale(18), color: C.fallbackText || C.muted }}>{message}</Text>
    </View>
  );
}

// ─── Location Results ────────────────────────────────────────────────────────
function LocationResults({ results, router, C, locationQuery, selectedFilter, filteredResults }) {
  if (!results) return null;

  const getFilterLabel = (filter) => {
    switch(filter) {
      case 'today': return ' (Today)';
      case 'expiring': return ' (Expiring Soon)';
      case 'mychannels': return ' (My Channels)';
      default: return '';
    }
  };

  const hasExact = results.exactCity?.length > 0;
  const hasDist = results.districtFallback?.length > 0;
  const hasState = results.stateFallback?.length > 0;

  const handleNewspaperPress = async (newspaper) => {
    router.push(`/NewspaperDetails?id=${newspaper._id}`);
  };

  const renderNewspaper = (np) => (
    <NewspaperCard
      key={np._id}
      newspaper={np}
      onPress={() => handleNewspaperPress(np)}
    />
  );

  // Use filtered results if provided, otherwise use the original results
  const displayResults = filteredResults || results;

  if (!hasExact && !hasDist && !hasState) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: scale(40), gap: verticalScale(12), minHeight: 200 }}>
        <View style={{ width: scale(72), height: scale(72), borderRadius: scale(20), backgroundColor: C.accentBg, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="newspaper-outline" size={moderateScale(32)} color={C.accent} />
        </View>
        <Text style={{ fontSize: fontScale(17), fontWeight: '700', color: C.primary, textAlign: 'center' }}>No Newspapers Found</Text>
        <Text style={{ fontSize: fontScale(13), lineHeight: fontScale(20), color: C.muted, textAlign: 'center' }}>
          We couldn't find any newspapers in {locationQuery || 'this location'}.
          {'\n'}Try a broader area.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={displayResults}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <NewspaperCard
          newspaper={item}
          onPress={() => handleNewspaperPress(item)}
        />
      )}
      contentContainerStyle={{ paddingHorizontal: scale(16), paddingTop: verticalScale(8), paddingBottom: verticalScale(30), flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  );
}

// ─── Loading View ─────────────────────────────────────────────────────────────
function LoadingView({ C }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: verticalScale(12), minHeight: 200 }}>
      <ActivityIndicator size="large" color={C.accent} />
      <Text style={{ fontSize: fontScale(14), color: C.muted }}>Searching newspapers…</Text>
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
const NewspaperViewer = () => {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { user } = useAuth();
  const { newspapers, loading, fetchNewspapers } = useNewspaper();

  const [refreshing, setRefreshing] = useState(false);
  const [locationResults, setLocationResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const hasFetched = useRef(false);

  // ─── Filter options ───────────────────────────────────────────────────────
  const filterOptions = [
    { id: 'all', label: 'All', icon: 'grid' },
    { id: 'today', label: 'Today', icon: 'newspaper-outline' },
    { id: 'expiring', label: 'Expiring', icon: 'film-outline' },
    { id: 'mychannels', label: 'My Channels', icon: 'basketball-outline' },
  ];

  // ─── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    // Only fetch once on mount
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchNewspapers();
    }
    
    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [fetchNewspapers]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNewspapers();
    setRefreshing(false);
  };

  const handleNewspaperPress = (newspaper) => {
    router.push(`/NewspaperDetails?id=${newspaper._id}`);
  };

  // ─── Get channel ID from newspaper ──────────────────────────────────────────
  const getChannelId = (newspaper) => {
    if (newspaper.channelId && typeof newspaper.channelId === 'object') {
      return newspaper.channelId._id || newspaper.channelId.$oid;
    }
    if (typeof newspaper.channelId === 'string') {
      return newspaper.channelId;
    }
    return null;
  };

  // ─── Search handler ──────────────────────────────────────────────────────────
  const handleLocationSearch = useCallback(async ({ state, district, city }) => {
    setIsLoading(true);
    setHasSearched(true);
    setLocationResults(null);

    try {
      console.log('🔍 Searching for:', { state, district, city });
      console.log('📰 Total newspapers:', newspapers.length);

      // Find newspapers that match the location criteria
      let exactCity = [];
      let districtFallback = [];
      let stateFallback = [];

      // Filter newspapers by location
      newspapers.forEach(np => {
        // Get location from channelId
        const location = np.channelId?.location;
        
        if (!location) {
          return;
        }

        if (city) {
          const cityMatch = location.city?.toLowerCase() === city.toLowerCase();
          const districtMatch = location.district?.toLowerCase() === district?.toLowerCase();
          const stateMatch = location.state?.toLowerCase() === state?.toLowerCase();

          if (cityMatch) {
            exactCity.push(np);
          } else if (district && districtMatch && exactCity.length === 0) {
            districtFallback.push(np);
          } else if (state && stateMatch && exactCity.length === 0 && districtFallback.length === 0) {
            stateFallback.push(np);
          }
        } else if (district) {
          if (location.district?.toLowerCase() === district.toLowerCase()) {
            districtFallback.push(np);
          } else if (state && location.state?.toLowerCase() === state.toLowerCase() && districtFallback.length === 0) {
            stateFallback.push(np);
          }
        } else if (state) {
          if (location.state?.toLowerCase() === state.toLowerCase()) {
            stateFallback.push(np);
          }
        }
      });

      console.log('📊 Results:', {
        exactCity: exactCity.length,
        districtFallback: districtFallback.length,
        stateFallback: stateFallback.length
      });

      const results = {
        exactCity: exactCity || [],
        districtFallback: districtFallback || [],
        stateFallback: stateFallback || [],
        searchedCity: city || district || state,
        searchedDistrict: district || state,
        searchedState: state,
      };

      setLocationResults(results);

      // Save to recent locations
      const stored = await AsyncStorage.getItem('recentLocations');
      let recent = stored ? JSON.parse(stored) : [];
      const newEntry = { state, district, city };
      recent = [newEntry, ...recent.filter(r =>
        r.state !== state || r.district !== district || r.city !== city
      )].slice(0, 5);
      await AsyncStorage.setItem('recentLocations', JSON.stringify(recent));

    } catch (e) {
      console.error('❌ Location search error:', e);
      setLocationResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [newspapers]);

  // ─── Clear search ────────────────────────────────────────────────────────────
  const handleClearAll = useCallback(() => {
    setLocationResults(null);
    setHasSearched(false);
    Keyboard.dismiss();
  }, []);

  // ─── Get filtered newspapers ─────────────────────────────────────────────────
  const getFilteredResults = useCallback(() => {
    if (!locationResults) return [];

    let results = [];
    if (locationResults.exactCity?.length > 0) {
      results = [...locationResults.exactCity];
    } else if (locationResults.districtFallback?.length > 0) {
      results = [...locationResults.districtFallback];
    } else if (locationResults.stateFallback?.length > 0) {
      results = [...locationResults.stateFallback];
    }

    // Apply filter
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (selectedFilter === 'today') {
      results = results.filter((np) => {
        const pubDate = new Date(np.publishedAt);
        return pubDate >= todayStart;
      });
    } else if (selectedFilter === 'expiring') {
      const twoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      results = results.filter((np) => {
        const expiresAt = new Date(np.expiresAt);
        return expiresAt <= twoHours && expiresAt > now;
      });
    } else if (selectedFilter === 'mychannels') {
      const ids = user?.subscriptions?.map((s) => s.channelId) || [];
      results = results.filter((np) => ids.includes(getChannelId(np)));
    }

    results.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    return results;
  }, [locationResults, selectedFilter, user]);

  const filteredNewspapers = useMemo(() => {
    // If we have location results, use the filtered results
    if (locationResults) {
      return getFilteredResults();
    }
    
    // No location search - show all newspapers with filters
    let filtered = [...newspapers];

    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (selectedFilter === 'today') {
      filtered = filtered.filter((np) => {
        const pubDate = new Date(np.publishedAt);
        return pubDate >= todayStart;
      });
    } else if (selectedFilter === 'expiring') {
      const twoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      filtered = filtered.filter((np) => {
        const expiresAt = new Date(np.expiresAt);
        return expiresAt <= twoHours && expiresAt > now;
      });
    } else if (selectedFilter === 'mychannels') {
      const ids = user?.subscriptions?.map((s) => s.channelId) || [];
      filtered = filtered.filter((np) => ids.includes(getChannelId(np)));
    }

    filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    return filtered;
  }, [locationResults, selectedFilter, newspapers, user, getFilteredResults]);

  // ─── Render body ─────────────────────────────────────────────────────────────
  const renderContent = () => {
    // Show loading state
    if (isLoading && !locationResults) {
      return <LoadingView C={C} />;
    }

    // Show location results with filters applied
    if (locationResults) {
      const locationQuery = locationResults.searchedCity || locationResults.searchedDistrict || locationResults.searchedState || '';
      
      // If no results found
      if (filteredNewspapers.length === 0) {
        return (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIconWrap, { backgroundColor: C.accentBg }]}>
              <Ionicons name="newspaper-outline" size={moderateScale(32)} color={C.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: C.primary }]}>No Newspapers Found</Text>
            <Text style={[styles.emptySub, { color: C.muted }]}>
              No newspapers found in {locationQuery || 'this location'}.
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

      // Show filtered results
      return (
        <>
          <View style={{ paddingHorizontal: scale(16), paddingTop: verticalScale(8), paddingBottom: verticalScale(4) }}>
            <Text style={{ fontSize: fontScale(14), fontWeight: '600', color: C.primary }}>
              Found {filteredNewspapers.length} newspaper{filteredNewspapers.length > 1 ? 's' : ''} in {locationQuery}
            </Text>
          </View>
          <FlatList
            data={filteredNewspapers}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <NewspaperCard
                newspaper={item}
                onPress={() => handleNewspaperPress(item)}
              />
            )}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        </>
      );
    }

    // No search performed - show nothing (will render default view below)
    return null;
  };

  // ─── Styles ───────────────────────────────────────────────────────────────
  const styles = {
    root: { 
      flex: 1, 
      backgroundColor: C.bg 
    },
    topStripe: { 
      height: verticalScale(3), 
      backgroundColor: C.accent 
    },

    header: {
      paddingHorizontal: scale(16),
      paddingTop: verticalScale(12),
      paddingBottom: verticalScale(8),
      backgroundColor: C.surface,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: fontScale(20),
      fontWeight: '800',
      color: C.primary,
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: fontScale(12),
      color: C.muted,
      marginTop: verticalScale(2),
    },

    filterScroll: {
      backgroundColor: C.surface,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    filterContent: {
      alignItems: 'center',
      paddingHorizontal: scale(12),
      paddingVertical: verticalScale(10),
      gap: scale(8),
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: scale(18),
      paddingVertical: verticalScale(10),
      borderRadius: scale(50),
      backgroundColor: C.categoryBg,
      marginRight: scale(8),
      gap: scale(7),
      minHeight: verticalScale(44),
    },
    filterButtonActive: { 
      backgroundColor: C.categoryActive 
    },
    filterButtonContent: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: scale(7) 
    },
    filterText: {
      fontSize: fontScale(14),
      fontWeight: '600',
      color: C.categoryText,
      letterSpacing: 0.1,
    },
    filterTextActive: { 
      color: C.categoryTextActive, 
      fontWeight: '700' 
    },

    listContent: {
      paddingHorizontal: scale(16),
      paddingBottom: verticalScale(30),
      flexGrow: 1,
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: scale(40),
      gap: verticalScale(10),
      minHeight: 200,
      paddingTop: verticalScale(40),
    },
    emptyIconWrap: {
      width: scale(72),
      height: scale(72),
      borderRadius: scale(20),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: verticalScale(4),
    },
    emptyTitle: {
      fontSize: fontScale(17),
      fontWeight: '700',
      letterSpacing: -0.2,
      textAlign: 'center',
    },
    emptySub: {
      fontSize: fontScale(13),
      lineHeight: fontScale(20),
      textAlign: 'center',
    },
    scrollContainer: {
      flex: 1,
    },
    contentContainer: {
      flexGrow: 1,
      paddingBottom: verticalScale(20),
    },
  };

  if (loading && newspapers.length === 0) {
    return <Loader message="Loading newspapers..." />;
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} translucent={false} />

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.accent}
              colors={[C.accent]}
            />
          }
        >
          <View style={styles.topStripe} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerTitle}>Daily Newspapers</Text>
                <Text style={styles.headerSubtitle}>{newspapers.length} newspapers available</Text>
              </View>
            </View>
          </View>

          {/* Location Search Form */}
          <LocationSearchForm
            C={C}
            onSearch={handleLocationSearch}
            isLoading={isLoading}
            onClear={handleClearAll}
          />

          {/* Render search results or default view */}
          {renderContent()}

          {/* Filter options and newspaper list (only when no location results are showing) */}
          {!locationResults && !isLoading && !hasSearched && (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
                contentContainerStyle={styles.filterContent}
              >
                {filterOptions.map((filter) => {
                  const isActive = selectedFilter === filter.id;
                  return (
                    <TouchableOpacity
                      key={filter.id}
                      style={[styles.filterButton, isActive && styles.filterButtonActive]}
                      onPress={() => setSelectedFilter(filter.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.filterButtonContent}>
                        <Ionicons
                          name={filter.icon}
                          size={moderateScale(20)}
                          color={isActive ? C.categoryTextActive : C.categoryText}
                        />
                        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                          {filter.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {filteredNewspapers.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <EmptyState
                    title="No Newspapers Found"
                    message="Check back later for today's newspapers"
                    icon="newspaper-outline"
                  />
                </View>
              ) : (
                <FlatList
                  data={filteredNewspapers}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <NewspaperCard
                      newspaper={item}
                      onPress={() => handleNewspaperPress(item)}
                    />
                  )}
                  scrollEnabled={false}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  initialNumToRender={10}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                />
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default NewspaperViewer;