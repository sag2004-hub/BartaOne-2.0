import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useColorScheme,
  Dimensions,
  PixelRatio,
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  SafeAreaView,
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useState } from 'react';

const { width: SW, height: SH } = Dimensions.get('window');
const scale = (n) => Math.round((SW / 390) * n);
const vs = (n) => Math.round((SH / 844) * n);
const sp = (n) => n / PixelRatio.getFontScale();

const LIGHT = {
  surface: '#FFFFFF',
  surfaceAlt: '#FAFAF8',
  border: '#E4E0D8',
  accent: '#C8001A',
  accentBg: '#FFF0F2',
  primary: '#1A2733',
  secondary: '#4A5A6B',
  muted: '#8A97A5',
  faint: '#B8C0C8',
  cardShadowOpacity: 0.06,
};

const DARK = {
  surface: '#161B22',
  surfaceAlt: '#1C2330',
  border: '#2A3340',
  accent: '#E8192C',
  accentBg: 'rgba(232,25,44,0.12)',
  primary: '#EDF2F7',
  secondary: '#8B9BAB',
  muted: '#5C6E80',
  faint: '#3A4A58',
  cardShadowOpacity: 0.35,
};

// ─── Main Component ──────────────────────────────────────────────────────
function ViewerTabs() {
  const C = useColorScheme() === 'dark' ? DARK : LIGHT;
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState(() => {
    if (pathname.includes('Search')) return 'search';
    if (pathname.includes('NewspaperViewer')) return 'newspaper'; // ✅ Changed from LiveTV
    if (pathname.includes('Profile')) return 'profile';
    return 'home';
  });

  const bottomPad = insets.bottom > 0 ? insets.bottom + vs(6) : vs(12);
  const tabBarHeight = vs(56) + bottomPad;
  const iconSize = Math.min(28, Math.max(22, scale(24)));

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.surface }]} edges={['top']}>
      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: C.accent,
          tabBarInactiveTintColor: C.muted,
          tabBarStyle: {
            backgroundColor: C.surface,
            borderTopColor: C.border,
            borderTopWidth: StyleSheet.hairlineWidth,
            height: tabBarHeight,
            paddingTop: vs(6),
            paddingBottom: bottomPad,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 8,
          },
          tabBarLabelStyle: {
            fontSize: sp(10),
            fontWeight: '500',
            marginTop: vs(2),
          },
        }}
        screenListeners={{
          state: (e) => {
            const route = e.data.state.routes[e.data.state.index];
            if (route.state) {
              const nestedRoute = route.state.routes[route.state.index];
              if (nestedRoute) {
                const name = nestedRoute.name;
                if (name.includes('Search')) setActiveTab('search');
                else if (name.includes('NewspaperViewer')) setActiveTab('newspaper'); // ✅ Changed
                else if (name.includes('Profile')) setActiveTab('profile');
                else setActiveTab('home');
              }
            } else {
              const name = route.name;
              if (name.includes('Search')) setActiveTab('search');
              else if (name.includes('NewspaperViewer')) setActiveTab('newspaper'); // ✅ Changed
              else if (name.includes('Profile')) setActiveTab('profile');
              else setActiveTab('home');
            }
          },
        }}
      >
        {/* ─── Home Tab ── */}
        <Tabs.Screen
          name="Home"
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ focused, color }) => (
              <View style={styles.tabIconWrapper}>
                <Ionicons
                  name={focused ? 'home' : 'home-outline'}
                  size={iconSize}
                  color={color}
                />
                {focused && <View style={[styles.tabIndicator, { backgroundColor: C.accent }]} />}
              </View>
            ),
          }}
        />

        {/* ─── Search Tab ── */}
        <Tabs.Screen
          name="Search"
          options={{
            tabBarLabel: 'Search',
            tabBarIcon: ({ focused, color }) => (
              <View style={styles.tabIconWrapper}>
                <Ionicons
                  name={focused ? 'search' : 'search-outline'}
                  size={iconSize}
                  color={color}
                />
                {focused && <View style={[styles.tabIndicator, { backgroundColor: C.accent }]} />}
              </View>
            ),
          }}
        />

        {/* ─── Newspaper Tab ── */}
        <Tabs.Screen
          name="NewspaperViewer"
          options={{
            tabBarLabel: 'Newspaper',
            tabBarIcon: ({ focused, color }) => (
              <View style={styles.tabIconWrapper}>
                <Ionicons
                  name={focused ? 'newspaper' : 'newspaper-outline'}
                  size={iconSize}
                  color={color}
                />
                {focused && <View style={[styles.tabIndicator, { backgroundColor: C.accent }]} />}
              </View>
            ),
          }}
        />

        {/* ─── Profile Tab ── */}
        <Tabs.Screen
          name="Profile"
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ focused, color }) => (
              <View style={styles.tabIconWrapper}>
                <Ionicons
                  name={focused ? 'person' : 'person-outline'}
                  size={iconSize}
                  color={color}
                />
                {focused && <View style={[styles.tabIndicator, { backgroundColor: C.accent }]} />}
              </View>
            ),
          }}
        />

        {/* ─── Hidden Screens ── */}
        <Tabs.Screen name="ChannelDetails" options={{ href: null }} />
        <Tabs.Screen name="ArticleDetails" options={{ href: null }} />
        <Tabs.Screen name="VideoPlayer" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="NewspaperDetails" options={{ href: null }} /> {/* ✅ Added */}
        <Tabs.Screen name="Settings" options={{ href: null }} />
        <Tabs.Screen name="Notifications" options={{ href: null }} />
      </Tabs>
    </SafeAreaView>
  );
}

// ─── Export ──────────────────────────────────────────────────────────────
export default function ViewerLayout() {
  return (
    <SafeAreaProvider>
      <ViewerTabs />
    </SafeAreaProvider>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  tabIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -vs(6),
    width: scale(16),
    height: scale(3),
    borderRadius: scale(1.5),
  },
});