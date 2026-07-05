import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, Dimensions, PixelRatio } from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');
const scale = (n) => Math.round((SW / 390) * n);
const vs    = (n) => Math.round((SH / 844) * n);
const sp    = (n) => n / PixelRatio.getFontScale();

const LIGHT = { surface: '#FFFFFF', border: '#E4E0D8', accent: '#C8001A', muted: '#8A97A5' };
const DARK  = { surface: '#161B22', border: '#2A3340', accent: '#E8192C', muted: '#5C6E80' };

export default function ViewerLayout() {
  const C = useColorScheme() === 'dark' ? DARK : LIGHT;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   C.accent,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor:  C.border,
          borderTopWidth:  1,
          paddingBottom:   vs(8),
          paddingTop:      vs(8),
          height:          vs(60),
        },
        tabBarLabelStyle: { fontSize: sp(10), fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color, size }) =>
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Search"
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ focused, color, size }) =>
            <Ionicons name={focused ? 'search' : 'search-outline'} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="LiveTV"
        options={{
          tabBarLabel: 'Live',
          tabBarIcon: ({ focused, color, size }) =>
            <Ionicons name={focused ? 'tv' : 'tv-outline'} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color, size }) =>
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />,
        }}
      />
      {/* Hide screens that aren't tab buttons */}
      <Tabs.Screen name="ChannelDetails" options={{ href: null }} />
      <Tabs.Screen name="ArticleDetails" options={{ href: null }} />
      <Tabs.Screen name="VideoPlayer"    options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="Settings"       options={{ href: null }} />
    </Tabs>
  );
}