import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useColorScheme, TouchableOpacity, View, Text,
  StyleSheet, Modal, Dimensions, PixelRatio,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';

// ─── Responsive helpers ───────────────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get('window');
const r = (n) => Math.round((SW / 390) * n);
const rv = (n) => Math.round((SH / 844) * n);

// ─── Colour tokens ────────────────────────────────────────────────────────────
const LIGHT = {
  surface: '#FFFFFF', border: '#E4E0D8',
  accent: '#C8001A',
  primary: '#1A2733', muted: '#8A97A5',
};
const DARK = {
  surface: '#161B22', border: '#2A3340',
  accent: '#E8192C',
  primary: '#EDF2F7', muted: '#5C6E80',
};

// ─── Modal Sheet ──────────────────────────────────────────────────────────────
function SimpleModal({ visible, onClose, title, children }) {
  const C = useColorScheme() === 'dark' ? DARK : LIGHT;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: C.surface }]}>
          <View style={[styles.modalHandle, { backgroundColor: C.border }]} />
          <Text style={[styles.modalTitle, { color: C.primary }]}>{title}</Text>
          {children}
          <TouchableOpacity style={[styles.cancelBtn, { borderColor: C.border }]} onPress={onClose}>
            <Text style={[styles.cancelText, { color: C.muted }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Modal Option ─────────────────────────────────────────────────────────────
function ModalOption({ icon, title, sub, color, onPress }) {
  const C = useColorScheme() === 'dark' ? DARK : LIGHT;
  return (
    <TouchableOpacity style={[styles.option, { backgroundColor: C.surface, borderColor: C.border }]} onPress={onPress}>
      <View style={[styles.optionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.optionText}>
        <Text style={[styles.optionTitle, { color: C.primary }]}>{title}</Text>
        <Text style={[styles.optionSub, { color: C.muted }]}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.muted} />
    </TouchableOpacity>
  );
}

// ─── Tab Button ──────────────────────────────────────────────────────────────
function TabButton({ children, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </TouchableOpacity>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function OwnerLayout() {
  const router = useRouter();
  const C = useColorScheme() === 'dark' ? DARK : LIGHT;
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const [uploadVisible, setUploadVisible] = useState(false);
  const [newsVisible, setNewsVisible] = useState(false);

  const bottomPad = insets.bottom > 0 ? insets.bottom + 12 : 12;
  const iconSize = 24;

  // Check if we're on a newspaper screen to highlight the tab
  const isNewspaperActive = pathname.includes('CreateNewspaper') || pathname.includes('NewspaperHistory');

  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: C.accent,
          tabBarInactiveTintColor: C.muted,
          tabBarStyle: {
            backgroundColor: C.surface,
            borderTopColor: C.border,
            borderTopWidth: 1,
            height: 56 + bottomPad,
            paddingBottom: bottomPad,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
            marginTop: 2,
          },
        }}
      >
        {/* ─── Dashboard Tab ─── */}
        <Tabs.Screen
          name="Dashboard"
          options={{
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({ focused }) => (
              <Ionicons 
                name={focused ? 'grid' : 'grid-outline'} 
                size={iconSize} 
                color={focused ? C.accent : C.muted} 
              />
            ),
          }}
        />

        {/* ─── Upload Tab (Modal) ─── */}
        <Tabs.Screen
          name="upload-placeholder"
          options={{
            tabBarLabel: 'Upload',
            tabBarIcon: ({ focused }) => (
              <Ionicons 
                name={focused ? 'cloud-upload' : 'cloud-upload-outline'} 
                size={iconSize} 
                color={focused ? C.accent : C.muted} 
              />
            ),
            tabBarButton: (props) => (
              <TabButton 
                {...props} 
                onPress={() => setUploadVisible(true)} 
              />
            ),
          }}
        />

        {/* ─── Newspaper Tab (Modal) ─── */}
        <Tabs.Screen
          name="newspaper-placeholder"
          options={{
            tabBarLabel: 'Newspaper',
            tabBarIcon: ({ focused }) => (
              <Ionicons 
                name={focused || isNewspaperActive ? 'newspaper' : 'newspaper-outline'} 
                size={iconSize} 
                color={focused || isNewspaperActive ? C.accent : C.muted} 
              />
            ),
            tabBarButton: (props) => (
              <TabButton 
                {...props} 
                onPress={() => setNewsVisible(true)} 
              />
            ),
          }}
        />

        {/* ─── Profile Tab ─── */}
        <Tabs.Screen
          name="Profile"
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ focused }) => (
              <Ionicons 
                name={focused ? 'person' : 'person-outline'} 
                size={iconSize} 
                color={focused ? C.accent : C.muted} 
              />
            ),
          }}
        />

        {/* ─── Hidden Screens ─── */}
        <Tabs.Screen name="CreateChannel" options={{ href: null }} />
        <Tabs.Screen name="UploadArticle" options={{ href: null }} />
        <Tabs.Screen name="UploadVideo" options={{ href: null }} />
        <Tabs.Screen name="CreateNewspaper" options={{ href: null }} />
        <Tabs.Screen name="NewspaperHistory" options={{ href: null }} />
        <Tabs.Screen name="ManagePosts" options={{ href: null }} />
        <Tabs.Screen name="Subscribers" options={{ href: null }} />
      </Tabs>

      {/* ─── Upload Modal ─── */}
      <SimpleModal visible={uploadVisible} onClose={() => setUploadVisible(false)} title="Choose Upload Type">
        <ModalOption 
          icon="create-outline" 
          title="Upload Article" 
          sub="Write and publish a news article" 
          color={C.accent}
          onPress={() => { 
            setUploadVisible(false); 
            router.push('/(owner)/UploadArticle'); 
          }}
        />
        <ModalOption 
          icon="videocam-outline" 
          title="Upload Video" 
          sub="Upload and share video content" 
          color="#1A6DC8"
          onPress={() => { 
            setUploadVisible(false); 
            router.push('/(owner)/UploadVideo'); 
          }}
        />
      </SimpleModal>

      {/* ─── Newspaper Modal ─── */}
      <SimpleModal visible={newsVisible} onClose={() => setNewsVisible(false)} title="Newspaper">
        <ModalOption 
          icon="newspaper-outline" 
          title="Create Newspaper" 
          sub="Create a daily newspaper with multiple pages" 
          color="#0E8A5A"
          onPress={() => { 
            setNewsVisible(false); 
            router.push('/(owner)/CreateNewspaper'); 
          }}
        />
        <ModalOption 
          icon="time-outline" 
          title="Newspaper History" 
          sub="View your published newspapers" 
          color="#B87500"
          onPress={() => { 
            setNewsVisible(false); 
            router.push('/(owner)/NewspaperHistory'); 
          }}
        />
      </SimpleModal>
    </SafeAreaProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
    maxHeight: SH * 0.6,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionSub: {
    fontSize: 12,
    marginTop: 2,
  },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 6,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
});