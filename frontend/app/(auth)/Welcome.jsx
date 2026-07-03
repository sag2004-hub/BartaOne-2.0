/**
 * BartaOne — Welcome Screen
 * - Responds to system dark/light mode (useColorScheme)
 * - Fully responsive: all spacing/sizes derived from screen dimensions
 * - SafeAreaView via react-native-safe-area-context (edges prop)
 * - All animations via native driver (60 fps)
 * - Terms & Conditions modal with professional content
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
  useColorScheme,
  PixelRatio,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ─── Responsive helpers ───────────────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get('window');
const BASE_W = 390;
const scale  = (n) => Math.round((SW / BASE_W) * n);
const vs     = (n) => Math.round((SH / 844) * n);
const sp     = (n) => n / PixelRatio.getFontScale();

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
  iconBlue:         '#1A6DC8',
  iconBlueBg:       '#EFF5FF',
  iconGreen:        '#0E8A5A',
  iconGreenBg:      '#EDFAF3',
  iconPurple:       '#7C3AED',
  iconPurpleBg:     '#F5F0FF',
  iconAmber:        '#B87500',
  iconAmberBg:      '#FFF7E8',
  logoBorder:       'transparent',
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
  iconBlue:         '#60A5FA',
  iconBlueBg:       'rgba(96,165,250,0.12)',
  iconGreen:        '#34D399',
  iconGreenBg:      'rgba(52,211,153,0.12)',
  iconPurple:       '#A78BFA',
  iconPurpleBg:     'rgba(167,139,250,0.12)',
  iconAmber:        '#FBBF24',
  iconAmberBg:      'rgba(251,191,36,0.12)',
  logoBorder:       'rgba(255,255,255,0.08)',
  cardShadowOpacity: 0.35,
  modalOverlay:     'rgba(0,0,0,0.7)',
  chipBg:           '#1C2330',
};

// ─── Feature data ─────────────────────────────────────────────────────────────
const getFeatures = (C) => [
  {
    icon:  'location',
    color: C.accent,
    bg:    C.accentBg,
    title: 'Your neighbourhood, covered',
    sub:   'Hyper-local stories from your pincode',
  },
  {
    icon:  'language',
    color: C.iconBlue,
    bg:    C.iconBlueBg,
    title: 'Read in your language',
    sub:   'Bengali, Hindi, English and more',
  },
  {
    icon:  'videocam',
    color: C.iconGreen,
    bg:    C.iconGreenBg,
    title: 'Live broadcasts & video',
    sub:   'Ground reporters, real-time coverage',
  },
  {
    icon:  'notifications',
    color: C.iconPurple,
    bg:    C.iconPurpleBg,
    title: 'Breaking news alerts',
    sub:   'Instant push notifications that matter',
  },
  {
    icon:  'shield-checkmark',
    color: C.iconAmber,
    bg:    C.iconAmberBg,
    title: 'Verified journalism',
    sub:   'Fact-checked by our editorial team',
  },
];

const LANGUAGES = [
  'English',     // English (Associate official)
  'हिन्दी',     // Hindi (Official language)
  'বাংলা',      // Bengali
  'తెలుగు',    // Telugu
  'मराठी',     // Marathi
  'தமிழ்',     // Tamil
  'ગુજરાતી',   // Gujarati
  'ಕನ್ನಡ',     // Kannada
  'മലയാളം',    // Malayalam
  'ଓଡ଼ିଆ',     // Odia
  'ਪੰਜਾਬੀ',    // Punjabi
  'অসমীয়া',   // Assamese
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Welcome({ navigation }) {
  const scheme   = useColorScheme();
  const C        = scheme === 'dark' ? DARK : LIGHT;
  const FEATURES = getFeatures(C);
  const [termsModalVisible, setTermsModalVisible] = useState(false);

  // ── Animated refs ──
  const headerAnim  = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(0.75)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const ruleScaleX  = useRef(new Animated.Value(0)).current;
  const cardAnim    = useRef(new Animated.Value(0)).current;
  const cardScale   = useRef(new Animated.Value(0.96)).current;
  const featOpacity = FEATURES.map(() => useRef(new Animated.Value(0)).current);
  const featY       = FEATURES.map(() => useRef(new Animated.Value(scale(22))).current);
  const langAnim    = useRef(new Animated.Value(0)).current;
  const btnAnim     = useRef(new Animated.Value(0)).current;
  const btnY        = useRef(new Animated.Value(scale(18))).current;
  const btnPulse    = useRef(new Animated.Value(1)).current;
  const footerAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, friction: 7, tension: 58, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(taglineAnim, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(ruleScaleX,  { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardAnim,  { toValue: 1, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, friction: 8, tension: 55, useNativeDriver: true }),
      ]),
      Animated.stagger(80, FEATURES.map((_, i) =>
        Animated.parallel([
          Animated.timing(featOpacity[i], { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.spring(featY[i],       { toValue: 0, friction: 8, tension: 65, useNativeDriver: true }),
        ])
      )),
      Animated.timing(langAnim, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(btnAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(btnY,    { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(footerAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(btnPulse, { toValue: 1.022, duration: 850, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(btnPulse, { toValue: 1,     duration: 850, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const styles = makeStyles(C);

  // ─── Terms Content ────────────────────────────────────────────────────────
  const TermsContent = () => (
    <View>
      <Text style={[styles.termsSectionTitle, { color: C.primary }]}>1. Acceptance of Terms</Text>
      <Text style={[styles.termsText, { color: C.secondary }]}>
        By using BartaOne, you agree to these terms and conditions. If you do not agree, please do not use our services.
      </Text>

      <Text style={[styles.termsSectionTitle, { color: C.primary }]}>2. User Accounts</Text>
      <Text style={[styles.termsText, { color: C.secondary }]}>
        • You must be at least 13 years old to create an account{'\n'}
        • You are responsible for maintaining the confidentiality of your account{'\n'}
        • You agree to provide accurate and complete information{'\n'}
        • You are solely responsible for all activities under your account
      </Text>

      <Text style={[styles.termsSectionTitle, { color: C.primary }]}>3. Content Guidelines</Text>
      <Text style={[styles.termsText, { color: C.secondary }]}>
        • Users may post news, comments, and other content{'\n'}
        • Content must be accurate and not misleading{'\n'}
        • No hate speech, harassment, or discriminatory content{'\n'}
        • No spam, fraudulent, or misleading information{'\n'}
        • We reserve the right to remove any content at our discretion
      </Text>

      <Text style={[styles.termsSectionTitle, { color: C.primary }]}>4. Intellectual Property</Text>
      <Text style={[styles.termsText, { color: C.secondary }]}>
        • All content on BartaOne is protected by copyright{'\n'}
        • You retain ownership of content you post{'\n'}
        • You grant us a license to use your content on our platform{'\n'}
        • Do not reproduce, distribute, or modify content without permission
      </Text>

      <Text style={[styles.termsSectionTitle, { color: C.primary }]}>5. Privacy and Data</Text>
      <Text style={[styles.termsText, { color: C.secondary }]}>
        • We collect and process personal data as described in our Privacy Policy{'\n'}
        • You consent to our collection and use of your data{'\n'}
        • We use cookies and similar technologies{'\n'}
        • You have rights to access, modify, or delete your data
      </Text>

      <Text style={[styles.termsSectionTitle, { color: C.primary }]}>6. Community Guidelines</Text>
      <Text style={[styles.termsText, { color: C.secondary }]}>
        • Be respectful and constructive in discussions{'\n'}
        • Fact-check information before sharing{'\n'}
        • Report inappropriate content to our team{'\n'}
        • Help us maintain a positive community environment
      </Text>

      <Text style={[styles.termsSectionTitle, { color: C.primary }]}>7. Termination</Text>
      <Text style={[styles.termsText, { color: C.secondary }]}>
        • We may terminate or suspend your account without notice{'\n'}
        • You can delete your account at any time{'\n'}
        • Certain obligations survive termination
      </Text>

      <Text style={[styles.termsSectionTitle, { color: C.primary }]}>8. Limitation of Liability</Text>
      <Text style={[styles.termsText, { color: C.secondary }]}>
        • BartaOne is provided "as is" without warranties{'\n'}
        • We are not liable for any damages arising from use{'\n'}
        • We do not guarantee accuracy of user-generated content{'\n'}
        • Your use of the platform is at your own risk
      </Text>

      <Text style={[styles.termsSectionTitle, { color: C.primary }]}>9. Changes to Terms</Text>
      <Text style={[styles.termsText, { color: C.secondary }]}>
        • We may update these terms periodically{'\n'}
        • Continued use constitutes acceptance of changes{'\n'}
        • We will notify you of significant changes
      </Text>

      <Text style={[styles.termsSectionTitle, { color: C.primary }]}>10. Contact Information</Text>
      <Text style={[styles.termsText, { color: C.secondary }]}>
        For questions about these terms, contact us at:{'\n'}
        support@bartaone.com{'\n'}
        +91 98765 43210
      </Text>

      <View style={[styles.termsFooter, { borderTopColor: C.border }]}>
        <Text style={[styles.termsFooterText, { color: C.muted }]}>Last Updated: January 2026</Text>
        <Text style={[styles.termsFooterText, { color: C.muted }]}>Version 2.0</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} translucent={false} />

      {/* ── Top accent stripe ── */}
      <View style={styles.topStripe} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Header ── */}
        <Animated.View style={[styles.header, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-vs(20), 0] }) }],
        }]}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </Text>
        </Animated.View>

        {/* ── Logo ── */}
        <Animated.View style={[styles.logoArea, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoIconWrap}>
            <Ionicons name="newspaper" size={scale(30)} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.appName}>
              Barta<Text style={styles.appNameAccent}>One</Text>
            </Text>
            <Animated.Text style={[styles.tagline, { opacity: taglineAnim }]}>
              Hyperlocal News Platform
            </Animated.Text>
          </View>
        </Animated.View>

        {/* ── Animated rule ── */}
        <Animated.View style={[styles.rule, { transform: [{ scaleX: ruleScaleX }] }]} />

        {/* ── Why BartaOne features card ── */}
        <Animated.View style={[styles.featuresCard, { opacity: cardAnim, transform: [{ scale: cardScale }] }]}>
          <Text style={styles.featuresLabel}>Why BartaOne</Text>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={f.title}
              style={[
                styles.featureRow,
                i < FEATURES.length - 1 && styles.featureRowBorder,
                { opacity: featOpacity[i], transform: [{ translateY: featY[i] }] },
              ]}
            >
              <View style={[styles.featureIconWrap, { backgroundColor: f.bg }]}>
                <Ionicons name={f.icon} size={scale(19)} color={f.color} />
              </View>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureSub}>{f.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={scale(14)} color={C.faint} />
            </Animated.View>
          ))}
        </Animated.View>

        {/* ── Available Languages ── */}
        <Animated.View style={[styles.langCard, { opacity: langAnim }]}>
          <View style={styles.langHeader}>
            <Ionicons name="globe-outline" size={scale(15)} color={C.secondary} />
            <Text style={styles.langLabel}>Available in your language</Text>
          </View>
          <View style={styles.langChipRow}>
            {LANGUAGES.map((l) => (
              <View key={l} style={styles.langChip}>
                <Text style={styles.langChipText}>{l}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Spacer ── */}
        <View style={{ flex: 1, minHeight: vs(16) }} />

        {/* ── Buttons ── */}
        <Animated.View style={[styles.btnGroup, { opacity: btnAnim, transform: [{ translateY: btnY }] }]}>
          <Animated.View style={{ transform: [{ scale: btnPulse }] }}>
            <TouchableOpacity
              style={styles.btnPrimary}
              activeOpacity={0.86}
              onPress={() => navigation.navigate('SelectRole')}
            >
              <Text style={styles.btnPrimaryText}>Get started</Text>
              <Ionicons name="arrow-forward" size={scale(18)} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* ── Footer ── */}
        <Animated.Text style={[styles.footer, { opacity: footerAnim }]}>
          By continuing you agree to our{' '}
          <Text style={styles.footerLink} onPress={() => setTermsModalVisible(true)}>
            Terms & Conditions
          </Text>
        </Animated.Text>
      </ScrollView>

      {/* ─── Terms & Conditions Modal ─────────────────────────────────────── */}
      <Modal
        visible={termsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: C.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: C.border }]}>
              <Text style={[styles.modalTitle, { color: C.primary }]}>Terms & Conditions</Text>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: C.accentBg }]}
                onPress={() => setTermsModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={scale(22)} color={C.accent} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={true}
            >
              <TermsContent />
              <TouchableOpacity
                style={[styles.acceptBtn, { backgroundColor: C.accent }]}
                onPress={() => setTermsModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.acceptBtnText}>I Accept</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Dynamic styles ───────────────────────────────────────────────────────────
const makeStyles = (C) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: scale(24),
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: vs(10),
  },

  topStripe: {
    height: 3,
    backgroundColor: C.accent,
    marginHorizontal: -scale(24),
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: vs(14),
    paddingBottom: vs(6),
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
    backgroundColor: C.accentBg,
    borderRadius: scale(20),
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  liveDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: C.accent,
  },
  liveText: {
    fontSize: sp(10),
    fontWeight: '700',
    color: C.accent,
    letterSpacing: 0.9,
  },
  headerDate: {
    fontSize: sp(12),
    color: C.muted,
    fontWeight: '400',
    letterSpacing: 0.2,
  },

  // Logo
  logoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(14),
    marginTop: vs(28),
    marginBottom: vs(10),
  },
  logoIconWrap: {
    width: scale(58),
    height: scale(58),
    borderRadius: scale(15),
    backgroundColor: C.navy,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.logoBorder,
  },
  appName: {
    fontSize: sp(32),
    fontWeight: '800',
    color: C.primary,
    letterSpacing: -0.5,
    lineHeight: sp(38),
  },
  appNameAccent: {
    color: C.accent,
  },
  tagline: {
    fontSize: sp(11),
    color: C.muted,
    fontWeight: '400',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: vs(3),
  },

  // Rule
  rule: {
    height: 1.5,
    backgroundColor: C.accent,
    marginBottom: vs(22),
    width: '100%',
    transformOrigin: 'left center',
    opacity: 0.7,
  },

  // Features card
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
    color: C.faint,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: vs(8),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: sp(13.5),
    fontWeight: '600',
    color: C.primary,
    letterSpacing: -0.1,
    lineHeight: sp(19),
  },
  featureSub: {
    fontSize: sp(11.5),
    color: C.secondary,
    marginTop: vs(2),
    lineHeight: sp(16),
  },

  // Language card
  langCard: {
    backgroundColor: C.surfaceAlt,
    borderRadius: scale(16),
    paddingHorizontal: scale(16),
    paddingVertical: vs(14),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    marginBottom: vs(8),
  },
  langHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginBottom: vs(10),
  },
  langLabel: {
    fontSize: sp(11.5),
    fontWeight: '600',
    color: C.secondary,
    letterSpacing: 0.1,
  },
  langChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
  },
  langChip: {
    backgroundColor: C.chipBg,
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: vs(6),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  langChipText: {
    fontSize: sp(12),
    fontWeight: '600',
    color: C.primary,
  },

  // Buttons
  btnGroup: {
    gap: scale(10),
  },
  btnPrimary: {
    backgroundColor: C.accent,
    borderRadius: scale(13),
    paddingVertical: vs(15),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(9),
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: scale(5) },
    shadowOpacity: 0.32,
    shadowRadius: scale(12),
    elevation: 6,
  },
  btnPrimaryText: {
    fontSize: sp(16),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  btnSkip: {
    paddingVertical: vs(13),
    alignItems: 'center',
    borderRadius: scale(13),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    backgroundColor: C.surfaceAlt,
  },
  btnSkipText: {
    fontSize: sp(14),
    color: C.muted,
    fontWeight: '400',
    letterSpacing: 0.1,
  },

  // Footer
  footer: {
    fontSize: sp(11),
    color: C.faint,
    textAlign: 'center',
    marginTop: vs(12),
    marginBottom: vs(6),
    lineHeight: sp(16),
  },
  footerLink: {
    color: C.accent,
    textDecorationLine: 'underline',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: C.modalOverlay,
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