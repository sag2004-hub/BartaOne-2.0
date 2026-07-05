/**
 * BartaOne — SelectRole Screen
 * Professional, clean design matching Welcome.jsx
 * - useColorScheme for auto dark/light
 * - scale() / vs() / sp() responsive helpers
 * - SafeAreaView from react-native-safe-area-context
 * - Minimal, purposeful animations only
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// ─── Responsive helpers ─────────────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get('window');
const BASE_W = 390;
const scale = (n) => Math.round((SW / BASE_W) * n);
const vs = (n) => Math.round((SH / 844) * n);
const sp = (n) => n / PixelRatio.getFontScale();

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
  },
];

// ─── Role Card Component ──────────────────────────────────────────────────
function RoleCard({ role, isSelected, onSelect, C }) {
  const styles = makeStyles(C);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onSelect}
      style={[
        styles.roleCard,
        {
          borderColor: isSelected ? role.color : C.border,
          borderWidth: isSelected ? 2 : 1,
          backgroundColor: isSelected ? role.bg : C.surface,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isSelected ? 0.1 : 0.05,
          shadowRadius: 8,
          elevation: isSelected ? 4 : 2,
        },
      ]}
    >
      {/* Tag badge */}
      {role.tag && (
        <View style={[styles.tagBadge, { backgroundColor: role.bg, borderColor: role.border }]}>
          <Text style={[styles.tagText, { color: role.color }]}>{role.tag}</Text>
        </View>
      )}

      {/* Checkmark */}
      {isSelected && (
        <View style={styles.checkmark}>
          <Ionicons name="checkmark-circle" size={scale(22)} color={role.color} />
        </View>
      )}

      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: isSelected ? role.color : role.bg }]}>
        <Ionicons
          name={isSelected ? role.iconFilled : role.icon}
          size={scale(26)}
          color={isSelected ? '#FFFFFF' : role.color}
        />
      </View>

      {/* Text */}
      <Text style={[styles.roleTitle, { color: C.primary }]}>{role.title}</Text>
      <Text style={[styles.roleDesc, { color: C.secondary }]}>{role.description}</Text>
      <Text style={[styles.roleSub, { color: C.muted }]}>{role.subtext}</Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────
export default function SelectRole() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const ROLES = getRoles(C);

  const [selectedRole, setSelectedRole] = useState(null);

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
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

  const styles = makeStyles(C);

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} />

      {/* Header - Centered without back arrow */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideUp }],
          },
        ]}
      >
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Choose Your Role</Text>
        </View>
      </Animated.View>

      {/* Red Underline - Below Header */}
      <Animated.View
        style={[
          styles.underlineContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideUp }],
          },
        ]}
      >
        <View style={styles.underline} />
      </Animated.View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideUp }],
          },
        ]}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>
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
      </Animated.View>

      {/* Footer with Continue Button */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideUp }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.continueBtn,
            {
              backgroundColor: selectedRole ? C.accent : C.faint,
              opacity: selectedRole ? 1 : 0.6,
            },
          ]}
          onPress={handleContinue}
          disabled={!selectedRole}
          activeOpacity={0.8}
        >
          <Text style={styles.continueBtnText}>
            {selectedRole
              ? `Continue as ${selectedRole === 'viewer' ? 'Viewer' : 'Owner'}`
              : 'Select a role to continue'}
          </Text>
          {selectedRole && (
            <Ionicons name="arrow-forward" size={scale(18)} color="#FFFFFF" />
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

    // Header - Centered
    header: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: scale(20),
  paddingTop: vs(25),
  paddingBottom: vs(2),
},
    headerCenter: {
  alignItems: 'center',
  marginTop: vs(-8),
},
    headerLabel: {
      fontSize: sp(6),
      fontWeight: '800',
      color: C.muted,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      marginBottom: vs(1),
    },
    headerTitle: {
      fontSize: sp(23),
      fontWeight: '800',
      color: C.primary,
      letterSpacing: -0.3,
      
    },

    // Full-width Red Underline - Below Header
    underlineContainer: {
  paddingHorizontal: 0,
  marginHorizontal: 0,
  width: '100%',
  marginBottom: vs(12),
  marginTop: vs(6),   // ← was vs(12)
},
    underline: {
      height: 3,
      backgroundColor: C.accent,
      width: '100%',
    },

    // Content
    content: {
      flex: 1,
    },

    // Title
    titleSection: {
      paddingHorizontal: scale(22),
      paddingTop: vs(8),
      paddingBottom: vs(12),
    },
    title: {
      fontSize: sp(26),
      fontWeight: '800',
      color: C.primary,
      letterSpacing: -0.5,
      lineHeight: sp(33),
      marginBottom: vs(8),
    },
    subtitle: {
      fontSize: sp(13),
      lineHeight: sp(19),
      fontWeight: '400',
    },

    // Cards
    cardsContainer: {
      paddingHorizontal: scale(20),
      gap: scale(14),
    },
    roleCard: {
      borderRadius: scale(16),
      padding: scale(18),
      paddingTop: scale(20),
      position: 'relative',
    },
    tagBadge: {
      position: 'absolute',
      top: scale(14),
      right: scale(44),
      paddingHorizontal: scale(8),
      paddingVertical: scale(3),
      borderRadius: scale(6),
      borderWidth: 1,
    },
    tagText: {
      fontSize: sp(9),
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    checkmark: {
      position: 'absolute',
      top: scale(14),
      right: scale(14),
    },
    iconWrap: {
      width: scale(48),
      height: scale(48),
      borderRadius: scale(14),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: vs(10),
    },
    roleTitle: {
      fontSize: sp(17),
      fontWeight: '700',
      letterSpacing: -0.2,
      marginBottom: vs(4),
    },
    roleDesc: {
      fontSize: sp(13),
      fontWeight: '500',
      lineHeight: sp(18),
      marginBottom: vs(3),
    },
    roleSub: {
      fontSize: sp(11.5),
      lineHeight: sp(16),
      fontWeight: '400',
    },

    // Footer
    footer: {
      paddingHorizontal: scale(20),
      paddingBottom: vs(12),
      paddingTop: vs(8),
      borderTopWidth: 1,
      borderTopColor: C.border,
      backgroundColor: C.bg,
    },
    continueBtn: {
      borderRadius: scale(14),
      paddingVertical: vs(14),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: scale(9),
      marginBottom: vs(12),
    },
    continueBtnText: {
      fontSize: sp(15),
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.1,
    },
    footerLinks: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    footerText: {
      fontSize: sp(13),
    },
    loginLink: {
      fontSize: sp(13),
      fontWeight: '700',
    },
  });