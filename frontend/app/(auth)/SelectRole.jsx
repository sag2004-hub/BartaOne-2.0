/**
 * BartaOne — SelectRole Screen
 * Professional, scrollable design with smooth left-to-right animation
 * Fully responsive for all screen sizes
 */

import React, { useState, useEffect, useRef } from 'react';
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
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// ─── Responsive helpers ─────────────────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base design dimensions (iPhone 14 Pro)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

// Responsive scaling functions
const scale = (size) => {
  const scaleFactor = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scaleFactor;
  return Math.round(newSize);
};

const verticalScale = (size) => {
  const scaleFactor = SCREEN_HEIGHT / BASE_HEIGHT;
  const newSize = size * scaleFactor;
  return Math.round(newSize);
};

const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

const fontScale = (size) => {
  const scaleFactor = Math.min(
    SCREEN_WIDTH / BASE_WIDTH,
    SCREEN_HEIGHT / BASE_HEIGHT
  );
  const newSize = size * scaleFactor;
  return Math.round(newSize / PixelRatio.getFontScale());
};

// ─── Theme ──────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: '#F2F0EB',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFAF8',
  border: '#E4E0D8',
  accent: '#C8001A',
  accentBg: '#FFF0F2',
  navy: '#0F1923',
  primary: '#1A2733',
  secondary: '#4A5A6B',
  muted: '#8A97A5',
  faint: '#B8C0C8',
  white: '#FFFFFF',
  statusBar: 'dark-content',
  viewerColor: '#1A6DC8',
  viewerBg: '#EFF5FF',
  viewerBorder: 'rgba(26,109,200,0.25)',
  ownerColor: '#C8001A',
  ownerBg: '#FFF0F2',
  ownerBorder: 'rgba(200,0,26,0.25)',
  divider: '#EAE6DE',
  loginLink: '#C8001A',
  cardShadowOpacity: 0.06,
};

const DARK = {
  bg: '#0D1117',
  surface: '#161B22',
  surfaceAlt: '#1C2330',
  border: '#2A3340',
  accent: '#E8192C',
  accentBg: 'rgba(232,25,44,0.12)',
  navy: '#E8EDF2',
  primary: '#EDF2F7',
  secondary: '#8B9BAB',
  muted: '#5C6E80',
  faint: '#3A4A58',
  white: '#FFFFFF',
  statusBar: 'light-content',
  viewerColor: '#60A5FA',
  viewerBg: 'rgba(96,165,250,0.12)',
  viewerBorder: 'rgba(96,165,250,0.3)',
  ownerColor: '#E8192C',
  ownerBg: 'rgba(232,25,44,0.12)',
  ownerBorder: 'rgba(232,25,44,0.3)',
  divider: '#1E2A36',
  loginLink: '#E8192C',
  cardShadowOpacity: 0.35,
};

// ─── Role definitions ──────────────────────────────────────────────────────
const getRoles = (C) => [
  {
    id: 'viewer',
    title: 'Viewer',
    description: 'Read news, watch videos & stay informed',
    subtext: 'Perfect for daily readers and news followers',
    icon: 'eye-outline',
    iconFilled: 'eye',
    color: C.viewerColor,
    bg: C.viewerBg,
    border: C.viewerBorder,
    tag: 'Viewer',
    features: ['Read Articles', 'Watch Videos', 'Live Streams', 'Comment & Engage'],
  },
  {
    id: 'owner',
    title: 'Channel Owner',
    description: 'Publish news, upload videos & go live',
    subtext: 'For journalists, reporters & media houses',
    icon: 'mic-outline',
    iconFilled: 'mic',
    color: C.ownerColor,
    bg: C.ownerBg,
    border: C.ownerBorder,
    tag: 'Creator',
    features: ['Publish Articles', 'Upload Videos', 'Go Live', 'View Analytics'],
  },
];

// ─── Role Card Component ──────────────────────────────────────────────────
function RoleCard({ role, isSelected, onSelect, C }) {
  const styles = makeStyles(C);
  const cardAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(cardAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 6,
      tension: 120,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(cardAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start();
    onSelect();
  };

  return (
    <Animated.View style={{ transform: [{ scale: cardAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.roleCard,
          {
            borderColor: isSelected ? role.color : C.border,
            borderWidth: isSelected ? 2.5 : 1,
            backgroundColor: isSelected ? role.bg : C.surface,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: verticalScale(3) },
            shadowOpacity: isSelected ? 0.1 : C.cardShadowOpacity,
            shadowRadius: scale(14),
            elevation: isSelected ? 5 : 2,
          },
        ]}
      >
        {/* Tag badge */}
        {role.tag && (
          <View style={[styles.tagBadge, { backgroundColor: role.color + '18', borderColor: role.border }]}>
            <Text style={[styles.tagText, { color: role.color }]}>{role.tag}</Text>
          </View>
        )}

        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: isSelected ? role.color : role.bg }]}>
          <Ionicons
            name={isSelected ? role.iconFilled : role.icon}
            size={moderateScale(25)}
            color={isSelected ? '#FFFFFF' : role.color}
          />
        </View>

        {/* Title & Description */}
        <Text style={[styles.roleTitle, { color: C.primary }]}>{role.title}</Text>
        <Text style={[styles.roleDesc, { color: C.secondary }]}>{role.description}</Text>
        <Text style={[styles.roleSub, { color: C.muted }]}>{role.subtext}</Text>

        {/* Features */}
        <View style={[styles.divider, { backgroundColor: C.border }]} />
        <View style={styles.featuresContainer}>
          {role.features.map((feature, index) => (
            <View key={index} style={[styles.featureItem, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
              <Text style={[styles.featureText, { color: isSelected ? role.color : C.secondary }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────
export default function SelectRole() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const ROLES = getRoles(C);

  const [selectedRole, setSelectedRole] = useState(null);

  // ─── Left-to-Right Slide Animation ──────────────────────────────────────
  const slideAnim = useRef(new Animated.Value(-30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset animation values when component mounts
    slideAnim.setValue(-30);
    fadeAnim.setValue(0);

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    if (selectedRole === 'viewer') {
      router.push('/(auth)/ViewerLogin');
    } else if (selectedRole === 'owner') {
      router.push('/(auth)/OwnerLogin');
    }
  };

  const goBack = () => {
    router.replace('/(auth)/Welcome');
  };

  const styles = makeStyles(C);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} translucent={false} />

      {/* ─── Top Stripe ─────────────────────────────────────────────────────── */}
      <View style={[styles.topStripe, { backgroundColor: C.accent }]} />

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: C.bg }]} 
          onPress={goBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={moderateScale(20)} color={C.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.primary }]}>Select Role</Text>
        <View style={styles.headerRight} />
      </View>

      {/* ─── Scrollable Content ───────────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: C.primary }]}>
              How will you use{'\n'}
              <Text style={{ color: C.accent }}>BartaOne?</Text>
            </Text>
            <Text style={[styles.subtitle, { color: C.secondary }]}>
              Your role shapes your entire experience — pick the one that fits you.
            </Text>
          </View>

          {/* Role Cards */}
          <View style={styles.cardsContainer}>
            {ROLES.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                isSelected={selectedRole === role.id}
                onSelect={() => setSelectedRole(role.id)}
                C={C}
              />
            ))}
          </View>

          {/* Bottom Spacer */}
          <View style={styles.bottomSpacer} />
        </Animated.View>
      </ScrollView>

      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.continueBtn,
            {
              backgroundColor: selectedRole ? C.accent : C.faint,
              shadowColor: selectedRole ? C.accent : 'transparent',
            },
          ]}
          onPress={handleContinue}
          disabled={!selectedRole}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>
            {selectedRole
              ? `Continue as ${selectedRole === 'viewer' ? 'Viewer' : 'Owner'}`
              : 'Select a role to continue'}
          </Text>
          {selectedRole && (
            <Ionicons name="arrow-forward" size={moderateScale(20)} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const makeStyles = (C) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: C.bg,
    },

    // ─── Top Stripe ─────────────────────────────────────────────────────────
    topStripe: {
      height: verticalScale(3),
    },

    // ─── Header ─────────────────────────────────────────────────────────────
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: scale(16),
      paddingVertical: verticalScale(12),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border,
      minHeight: verticalScale(56),
    },
    backBtn: {
      width: scale(38),
      height: scale(38),
      borderRadius: scale(10),
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: fontScale(18),
      fontWeight: '700',
      letterSpacing: -0.3,
      color: C.primary,
    },
    headerRight: {
      width: scale(38),
    },

    // ─── ScrollView ─────────────────────────────────────────────────────────
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: verticalScale(8),
      paddingTop: verticalScale(4),
    },

    // ─── Content ────────────────────────────────────────────────────────────
    content: {
      flex: 1,
    },

    // Title Section
    titleSection: {
      paddingHorizontal: scale(22),
      paddingTop: verticalScale(12),
      paddingBottom: verticalScale(8),
    },
    title: {
      fontSize: fontScale(25),
      fontWeight: '800',
      letterSpacing: -0.5,
      lineHeight: fontScale(32),
      marginBottom: verticalScale(5),
      color: C.primary,
    },
    subtitle: {
      fontSize: fontScale(13.5),
      lineHeight: fontScale(19.5),
      fontWeight: '400',
      color: C.secondary,
    },

    // Cards
    cardsContainer: {
      paddingHorizontal: scale(18),
      gap: scale(13),
    },
    roleCard: {
      borderRadius: scale(15),
      padding: scale(18),
      paddingTop: scale(20),
      position: 'relative',
      borderWidth: 1,
      minHeight: verticalScale(180),
    },
    tagBadge: {
      position: 'absolute',
      top: scale(12),
      right: scale(13),
      paddingHorizontal: scale(9),
      paddingVertical: verticalScale(3),
      borderRadius: scale(7),
      borderWidth: 1,
    },
    tagText: {
      fontSize: fontScale(8.5),
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    iconWrap: {
      width: scale(50),
      height: scale(50),
      borderRadius: scale(14),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: verticalScale(8),
    },
    roleTitle: {
      fontSize: fontScale(17.5),
      fontWeight: '700',
      letterSpacing: -0.2,
      marginBottom: verticalScale(3),
      color: C.primary,
    },
    roleDesc: {
      fontSize: fontScale(12.5),
      fontWeight: '500',
      lineHeight: fontScale(17),
      marginBottom: verticalScale(2.5),
      color: C.secondary,
    },
    roleSub: {
      fontSize: fontScale(11),
      lineHeight: fontScale(15),
      fontWeight: '400',
      color: C.muted,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      marginVertical: verticalScale(8),
      backgroundColor: C.border,
    },
    featuresContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: scale(5),
    },
    featureItem: {
      paddingHorizontal: scale(9),
      paddingVertical: verticalScale(3.5),
      borderRadius: scale(5.5),
      borderWidth: StyleSheet.hairlineWidth,
      backgroundColor: C.surfaceAlt,
      borderColor: C.border,
    },
    featureText: {
      fontSize: fontScale(10),
      fontWeight: '500',
      color: C.secondary,
    },

    bottomSpacer: {
      height: verticalScale(14),
    },

    // ─── Footer ─────────────────────────────────────────────────────────────
    footer: {
      paddingHorizontal: scale(20),
      paddingBottom: verticalScale(12),
      paddingTop: verticalScale(10),
      borderTopWidth: 1,
      borderTopColor: C.border,
      backgroundColor: C.bg,
    },
    continueBtn: {
      borderRadius: scale(14),
      paddingVertical: verticalScale(14.5),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: scale(10),
      shadowOffset: { width: 0, height: verticalScale(6) },
      shadowOpacity: 0.3,
      shadowRadius: scale(14),
      elevation: 6,
      minHeight: verticalScale(54),
    },
    continueBtnText: {
      fontSize: fontScale(15.5),
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.2,
    },
  });