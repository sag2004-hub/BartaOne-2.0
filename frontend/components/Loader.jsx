// components/Loader.jsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  PixelRatio,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Responsive helpers (mirrors CreateChannel) ───────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

const scale = (size) => {
  const f = Math.min(Math.max(SCREEN_WIDTH / BASE_WIDTH, 0.7), 1.3);
  return Math.round(f * size);
};

const verticalScale = (size) => {
  const f = Math.min(Math.max(SCREEN_HEIGHT / BASE_HEIGHT, 0.7), 1.3);
  return Math.round(f * size);
};

const moderateScale = (size, factor = 0.5) =>
  Math.round(size + (scale(size) - size) * factor);

const fontScale = (size) => {
  const f = Math.min(
    Math.min(Math.max(SCREEN_WIDTH / BASE_WIDTH, 0.7), 1.3),
    Math.min(Math.max(SCREEN_HEIGHT / BASE_HEIGHT, 0.7), 1.3)
  );
  return Math.round((size * f) / PixelRatio.getFontScale());
};

// ─── Theme (exact tokens from CreateChannel) ─────────────────────────────────
const LIGHT = {
  bg:           '#F2F0EB',
  surface:      '#FFFFFF',
  surfaceAlt:   '#FAFAF8',
  border:       '#E4E0D8',
  accent:       '#C8001A',
  accentBg:     '#FFF0F2',
  primary:      '#1A2733',
  secondary:    '#4A5A6B',
  muted:        '#8A97A5',
  faint:        '#B8C0B8',
  cardShadow:   0.07,
  overlay:      'rgba(242,240,235,0.94)',
};

const DARK = {
  bg:           '#0D1117',
  surface:      '#161B22',
  surfaceAlt:   '#1C2330',
  border:       '#2A3340',
  accent:       '#E8192C',
  accentBg:     'rgba(232,25,44,0.12)',
  primary:      '#EDF2F7',
  secondary:    '#8B9BAB',
  muted:        '#5C6E80',
  faint:        '#3A4A58',
  cardShadow:   0.4,
  overlay:      'rgba(13,17,23,0.94)',
};

// ─── Dot ─────────────────────────────────────────────────────────────────────
// Three dots that pulse in staggered sequence — more editorial than a spinner
function PulsingDots({ color }) {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animations = dots.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(anim, {
            toValue: 1,
            duration: 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 380,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.delay((3 - i) * 160 + 100),
        ])
      )
    );
    Animated.parallel(animations).start();
  }, []);

  return (
    <View style={dotStyles.row}>
      {dots.map((anim, i) => {
        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -scale(7)],
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [0.3, 1, 0.3],
        });
        return (
          <Animated.View
            key={i}
            style={[
              dotStyles.dot,
              {
                backgroundColor: color,
                transform: [{ translateY }],
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(7),
    marginVertical: verticalScale(18),
  },
  dot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
  },
});

// ─── Animated progress bar ────────────────────────────────────────────────────
function ProgressBar({ color, bgColor }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Indeterminate shimmer: slide from 0→0.85, reset, repeat
    const run = () => {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 1600,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) run();
      });
    };
    run();
  }, []);

  const barWidth = progress.interpolate({
    inputRange: [0, 0.5, 0.85, 1],
    outputRange: ['0%', '60%', '85%', '100%'],
  });

  return (
    <View
      style={[
        barStyles.track,
        { backgroundColor: bgColor },
      ]}
    >
      <Animated.View
        style={[
          barStyles.fill,
          {
            width: barWidth,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: {
    width: scale(140),
    height: scale(3),
    borderRadius: scale(2),
    overflow: 'hidden',
    marginTop: verticalScale(4),
  },
  fill: {
    height: '100%',
    borderRadius: scale(2),
  },
});

// ─── Main Loader ──────────────────────────────────────────────────────────────
export default function Loader({
  message = 'Loading…',
  fullScreen = true,
  overlay = false,
}) {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;

  // Entry animation
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.88)).current;
  // Card icon subtle breathe
  const iconPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleIn, {
        toValue: 1,
        friction: 7,
        tension: 55,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(iconPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const bgColor = overlay ? C.overlay : C.bg;

  return (
    <View
      style={[
        styles.root,
        fullScreen && styles.fullScreen,
        { backgroundColor: bgColor },
      ]}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: C.surface,
            borderColor: C.border,
            shadowOpacity: C.cardShadow,
            opacity: fadeIn,
            transform: [{ scale: scaleIn }],
          },
        ]}
      >
        {/* ── Top accent bar matching CreateChannel header ── */}
        <View style={[styles.accentBar, { backgroundColor: C.accent }]} />

        <View style={styles.body}>
          {/* ── Icon badge ── */}
          <Animated.View
            style={[
              styles.iconBadge,
              {
                backgroundColor: C.accentBg,
                borderColor: C.border,
                transform: [{ scale: iconPulse }],
              },
            ]}
          >
            <Ionicons
              name="newspaper"
              size={moderateScale(28)}
              color={C.accent}
            />
          </Animated.View>

          {/* ── Brand wordmark ── */}
          <Text style={[styles.brand, { color: C.primary }]}>
            Barta<Text style={{ color: C.accent }}>One</Text>
          </Text>

          {/* ── Staggered dots ── */}
          <PulsingDots color={C.accent} />

          {/* ── Message ── */}
          <Text style={[styles.message, { color: C.secondary }]}>
            {message}
          </Text>

          {/* ── Indeterminate progress bar ── */}
          <ProgressBar color={C.accent} bgColor={C.accentBg} />
        </View>
      </Animated.View>

      {/* ── Corner watermark – subtle, non-intrusive ── */}
      <Text style={[styles.watermark, { color: C.faint }]}>
        BartaOne · Publisher
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  card: {
    width: scale(240),
    borderRadius: scale(20),
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(6) },
    shadowRadius: scale(20),
    elevation: 8,
    overflow: 'hidden',
  },
  accentBar: {
    height: scale(4),
    width: '100%',
  },
  body: {
    alignItems: 'center',
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(24),
    paddingBottom: verticalScale(22),
  },
  iconBadge: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(18),
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(14),
  },
  brand: {
    fontSize: fontScale(22),
    fontWeight: '800',
    letterSpacing: -0.6,
    fontStyle: 'italic',
  },
  message: {
    fontSize: fontScale(13),
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: fontScale(19),
  },
  watermark: {
    position: 'absolute',
    bottom: verticalScale(20),
    fontSize: fontScale(10),
    fontWeight: '600',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
});