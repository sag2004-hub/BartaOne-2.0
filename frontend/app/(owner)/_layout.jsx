import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useColorScheme, TouchableOpacity, View, Text,
  StyleSheet, Modal, Dimensions, PixelRatio,
} from 'react-native';
import {
  SafeAreaView, SafeAreaProvider, useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

// ─── Responsive helpers ───────────────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get('window');
const scaleW = SW / 390;
const scaleH = SH / 844;
const r  = (n) => Math.round(n * scaleW);
const rv = (n) => Math.round(n * scaleH);
const rf = (n) => Math.round((n * scaleW) / PixelRatio.getFontScale());
const TAB_INNER_H = rv(56);

// ─── Colour tokens ────────────────────────────────────────────────────────────
const LIGHT = {
  surface: '#FFFFFF', surfaceAlt: '#FAFAF8', border: '#E4E0D8',
  accent: '#C8001A', accentBg: '#FFF0F2',
  primary: '#1A2733', secondary: '#4A5A6B', muted: '#8A97A5',
  iconBlue: '#1A6DC8', iconBlueBg: '#EFF5FF',
  iconGreen: '#0E8A5A', iconGreenBg: '#EDFAF3',
  iconAmber: '#B87500', iconAmberBg: '#FFF7E8',
};
const DARK = {
  surface: '#161B22', surfaceAlt: '#1C2330', border: '#2A3340',
  accent: '#E8192C', accentBg: 'rgba(232,25,44,0.12)',
  primary: '#EDF2F7', secondary: '#8B9BAB', muted: '#5C6E80',
  iconBlue: '#60A5FA', iconBlueBg: 'rgba(96,165,250,0.12)',
  iconGreen: '#34D399', iconGreenBg: 'rgba(52,211,153,0.12)',
  iconAmber: '#FBBF24', iconAmberBg: 'rgba(251,191,36,0.12)',
};

// ─── Modal sheet (shared) ─────────────────────────────────────────────────────
function ModalSheet({ visible, onClose, title, closeBg, closeColor, children }) {
  const C = useColorScheme() === 'dark' ? DARK : LIGHT;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[s.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <SafeAreaView
          edges={['bottom']}
          style={{ backgroundColor: C.surface, borderTopLeftRadius: r(24), borderTopRightRadius: r(24) }}
        >
          <View style={s.sheet}>
            <View style={[s.handle, { backgroundColor: C.border }]} />
            <View style={[s.header, { borderBottomColor: C.border }]}>
              <Text style={[s.title, { color: C.primary }]}>{title}</Text>
              <TouchableOpacity style={[s.closeBtn, { backgroundColor: closeBg }]} onPress={onClose}>
                <Ionicons name="close" size={r(22)} color={closeColor} />
              </TouchableOpacity>
            </View>
            <View style={s.body}>{children}</View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ─── Shared card row ──────────────────────────────────────────────────────────
function SheetCard({ iconName, iconColor, iconBg, title, sub, onPress }) {
  const C = useColorScheme() === 'dark' ? DARK : LIGHT;
  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[s.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={r(26)} color={iconColor} />
      </View>
      <View style={s.cardText}>
        <Text style={[s.cardTitle, { color: C.primary }]}>{title}</Text>
        <Text style={[s.cardSub, { color: C.muted }]}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={r(18)} color={C.muted} />
    </TouchableOpacity>
  );
}

function CancelBtn({ onPress }) {
  const C = useColorScheme() === 'dark' ? DARK : LIGHT;
  return (
    <TouchableOpacity style={[s.cancelBtn, { borderColor: C.border }]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[s.cancelText, { color: C.secondary }]}>Cancel</Text>
    </TouchableOpacity>
  );
}

// ─── Upload modal ─────────────────────────────────────────────────────────────
function UploadModal({ visible, onClose }) {
  const router = useRouter();
  const C = useColorScheme() === 'dark' ? DARK : LIGHT;
  const go = (route) => { onClose(); router.push(route); };
  return (
    <ModalSheet visible={visible} onClose={onClose} title="Choose Upload Type" closeBg={C.accentBg} closeColor={C.accent}>
      <SheetCard iconName="create-outline"   iconColor={C.accent}   iconBg={C.accentBg}   title="Upload Article" sub="Write and publish a news article"  onPress={() => go('/(owner)/UploadArticle')} />
      <SheetCard iconName="videocam-outline" iconColor={C.iconBlue} iconBg={C.iconBlueBg} title="Upload Video"   sub="Upload and share video content"      onPress={() => go('/(owner)/UploadVideo')} />
      <CancelBtn onPress={onClose} />
    </ModalSheet>
  );
}

// ─── Go Live modal ────────────────────────────────────────────────────────────
function GoLiveModal({ visible, onClose }) {
  const router = useRouter();
  const C = useColorScheme() === 'dark' ? DARK : LIGHT;
  const go = (route) => { onClose(); router.push(route); };
  return (
    <ModalSheet visible={visible} onClose={onClose} title="Go Live" closeBg={C.iconGreenBg} closeColor={C.iconGreen}>
      <SheetCard iconName="radio-outline"    iconColor={C.iconGreen} iconBg={C.iconGreenBg} title="Start Live Stream" sub="Go live and broadcast to your audience" onPress={() => go('/(owner)/GoLive')} />
      <SheetCard iconName="calendar-outline" iconColor={C.iconAmber} iconBg={C.iconAmberBg} title="Schedule Live"     sub="Schedule a live stream for later"        onPress={() => go('/(owner)/GoLive?mode=schedule')} />
      <CancelBtn onPress={onClose} />
    </ModalSheet>
  );
}

// ─── Custom tab button for modal-only tabs ────────────────────────────────────
function ModalTabButton({ children, onPress, style }) {
  return (
    <TouchableOpacity onPress={onPress} style={[style, { opacity: 1 }]} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  );
}

// ─── Derive which real tab owns the current pathname ─────────────────────────
// Hidden screens (UploadArticle, UploadVideo, GoLive, etc.) belong to
// the modal tab that launched them, not to Dashboard or Profile.
const UPLOAD_SCREENS = ['UploadArticle', 'UploadVideo'];
const LIVE_SCREENS   = ['GoLive'];

function resolveActiveTab(pathname) {
  if (UPLOAD_SCREENS.some((s) => pathname.includes(s))) return 'upload';
  if (LIVE_SCREENS.some((s)   => pathname.includes(s))) return 'live';
  if (pathname.includes('Profile'))                      return 'profile';
  return 'dashboard'; // Dashboard is the default / fallback
}

// ─── Main tab layout ──────────────────────────────────────────────────────────
function OwnerTabs() {
  const [uploadVisible, setUploadVisible] = useState(false);
  const [liveVisible,   setLiveVisible]   = useState(false);
  const C        = useColorScheme() === 'dark' ? DARK : LIGHT;
  const insets   = useSafeAreaInsets();
  const pathname = usePathname();

  // ── Persist the active tab across sub-screen navigations ──────────────────
  // resolveActiveTab maps every pathname (including hidden screens) to the
  // correct owning tab, so the highlight never drops when navigating deeper.
  const [activeTab, setActiveTab] = useState(() => resolveActiveTab(pathname));

  useEffect(() => {
    // Only update activeTab from pathname when no modal is open.
    // While a modal is open the tab highlight is controlled by the modal state.
    if (!uploadVisible && !liveVisible) {
      setActiveTab(resolveActiveTab(pathname));
    }
  }, [pathname, uploadVisible, liveVisible]);

  const bottomPad    = insets.bottom > 0 ? insets.bottom + rv(6) : rv(12);
  const tabBarHeight = TAB_INNER_H + bottomPad;
  const iconSize     = Math.min(30, Math.max(22, r(24)));

  // ── Active booleans (single source of truth) ──────────────────────────────
  const isDashboard = activeTab === 'dashboard' && !uploadVisible && !liveVisible;
  const isUpload    = activeTab === 'upload'    || uploadVisible;
  const isLive      = activeTab === 'live'      || liveVisible;
  const isProfile   = activeTab === 'profile'   && !uploadVisible && !liveVisible;

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor:   C.accent,
          tabBarInactiveTintColor: C.muted,
          tabBarStyle: {
            backgroundColor: C.surface,
            borderTopColor:  C.border,
            borderTopWidth:  StyleSheet.hairlineWidth,
            height:          tabBarHeight,
            paddingTop:      rv(8),
            paddingBottom:   bottomPad,
            shadowColor:     '#000',
            shadowOffset:    { width: 0, height: -2 },
            shadowOpacity:   0.06,
            shadowRadius:    8,
            elevation:       8,
          },
          tabBarLabelStyle: {
            fontSize:   rf(10),
            fontWeight: '500',
            marginTop:  rv(2),
          },
        }}
      >
        {/* ── Dashboard ── */}
        <Tabs.Screen
          name="Dashboard"
          options={{
            tabBarLabel: 'Dashboard',
            tabBarIcon: () => (
              <Ionicons
                name={isDashboard ? 'grid' : 'grid-outline'}
                size={iconSize}
                color={isDashboard ? C.accent : C.muted}
              />
            ),
            tabBarLabelStyle: {
              fontSize:   rf(10),
              fontWeight: '500',
              marginTop:  rv(2),
              color: isDashboard ? C.accent : C.muted,
            },
          }}
        />

        {/* ── Upload (modal only — never navigates) ── */}
        <Tabs.Screen
          name="upload-placeholder"
          options={{
            tabBarLabel: 'Upload',
            tabBarIcon: () => (
              <Ionicons
                name={isUpload ? 'cloud-upload' : 'cloud-upload-outline'}
                size={iconSize}
                color={isUpload ? C.accent : C.muted}
              />
            ),
            tabBarLabelStyle: {
              fontSize:   rf(10),
              fontWeight: '500',
              marginTop:  rv(2),
              color: isUpload ? C.accent : C.muted,
            },
            tabBarButton: (props) => (
              <ModalTabButton
                {...props}
                onPress={() => {
                  setActiveTab('upload');
                  setUploadVisible(true);
                }}
              />
            ),
          }}
        />

        {/* ── Go Live (modal only — never navigates) ── */}
        <Tabs.Screen
          name="live-placeholder"
          options={{
            tabBarLabel: 'Go Live',
            tabBarIcon: () => (
              <Ionicons
                name={isLive ? 'radio' : 'radio-outline'}
                size={iconSize}
                color={isLive ? C.accent : C.muted}
              />
            ),
            tabBarLabelStyle: {
              fontSize:   rf(10),
              fontWeight: '500',
              marginTop:  rv(2),
              color: isLive ? C.accent : C.muted,
            },
            tabBarButton: (props) => (
              <ModalTabButton
                {...props}
                onPress={() => {
                  setActiveTab('live');
                  setLiveVisible(true);
                }}
              />
            ),
          }}
        />

        {/* ── Profile ── */}
        <Tabs.Screen
          name="Profile"
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: () => (
              <Ionicons
                name={isProfile ? 'person' : 'person-outline'}
                size={iconSize}
                color={isProfile ? C.accent : C.muted}
              />
            ),
            tabBarLabelStyle: {
              fontSize:   rf(10),
              fontWeight: '500',
              marginTop:  rv(2),
              color: isProfile ? C.accent : C.muted,
            },
          }}
        />

        {/* Hidden screens */}
        <Tabs.Screen name="CreateChannel" options={{ href: null }} />
        <Tabs.Screen name="UploadArticle" options={{ href: null }} />
        <Tabs.Screen name="UploadVideo"   options={{ href: null }} />
        <Tabs.Screen name="GoLive"        options={{ href: null }} />
        <Tabs.Screen name="ManagePosts"   options={{ href: null }} />
        <Tabs.Screen name="Subscribers"   options={{ href: null }} />
      </Tabs>

      <UploadModal visible={uploadVisible} onClose={() => setUploadVisible(false)} />
      <GoLiveModal visible={liveVisible}   onClose={() => setLiveVisible(false)} />
    </>
  );
}

export default function OwnerLayout() {
  return (
    <SafeAreaProvider>
      <OwnerTabs />
    </SafeAreaProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  overlay:    { flex: 1, justifyContent: 'flex-end' },
  sheet:      { maxHeight: SH * 0.65 },
  handle:     { width: r(40), height: r(4), borderRadius: r(2), alignSelf: 'center', marginTop: rv(10), marginBottom: rv(6) },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: r(20), paddingVertical: rv(12), borderBottomWidth: StyleSheet.hairlineWidth },
  title:      { fontSize: rf(18), fontWeight: '700', letterSpacing: -0.3 },
  closeBtn:   { width: r(36), height: r(36), borderRadius: r(18), justifyContent: 'center', alignItems: 'center' },
  body:       { padding: r(20), gap: rv(10) },
  card:       { flexDirection: 'row', alignItems: 'center', padding: r(14), borderRadius: r(14), borderWidth: StyleSheet.hairlineWidth, gap: r(12) },
  iconWrap:   { width: r(48), height: r(48), borderRadius: r(12), justifyContent: 'center', alignItems: 'center' },
  cardText:   { flex: 1 },
  cardTitle:  { fontSize: rf(15), fontWeight: '600' },
  cardSub:    { fontSize: rf(12), marginTop: rv(2), lineHeight: rf(17) },
  cancelBtn:  { paddingVertical: rv(13), borderRadius: r(12), alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, marginTop: rv(2) },
  cancelText: { fontSize: rf(15), fontWeight: '600' },
});