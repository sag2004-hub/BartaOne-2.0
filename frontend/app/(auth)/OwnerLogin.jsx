// screens/OwnerLogin.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Constants ──────────────────────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// ─── Responsive Helpers ────────────────────────────────────────────────────
const scale = (size) => Math.round((SW / BASE_WIDTH) * size);
const verticalScale = (size) => Math.round((SH / BASE_HEIGHT) * size);
const moderateScale = (size, factor = 0.5) =>
  Math.round(size + (scale(size) - size) * factor);

// ─── Theme Configuration ──────────────────────────────────────────────────
const THEMES = {
  light: {
    colors: {
      background: '#F2F0EB',
      surface: '#FFFFFF',
      border: '#E4E0D8',
      accent: '#C8001A',
      accentBg: '#FFF0F2',
      accentBorder: 'rgba(200,0,26,0.18)',
      primary: '#1A2733',
      secondary: '#4A5A6B',
      muted: '#8A97A5',
      faint: '#B8C0C8',
      placeholder: '#B8C0C8',
      divider: '#EAE6DE',
      inputBackground: '#FFFFFF',
      inputBorder: '#E4E0D8',
      inputFocusBorder: '#C8001A',
    },
    statusBarStyle: 'dark-content',
  },
  dark: {
    colors: {
      background: '#0D1117',
      surface: '#161B22',
      border: '#2A3340',
      accent: '#E8192C',
      accentBg: 'rgba(232,25,44,0.12)',
      accentBorder: 'rgba(232,25,44,0.25)',
      primary: '#EDF2F7',
      secondary: '#8B9BAB',
      muted: '#5C6E80',
      faint: '#3A4A58',
      placeholder: '#5C6E80',
      divider: '#1E2A36',
      inputBackground: '#1C2330',
      inputBorder: '#2A3340',
      inputFocusBorder: '#E8192C',
    },
    statusBarStyle: 'light-content',
  },
};

// ─── Animated Input Component ─────────────────────────────────────────────
const AnimatedInput = ({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  rightElement,
  delay = 0,
  colors,
  onSubmitEditing,
  returnKeyType,
  inputRef,
  onFocus,
  onBlur,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const slideAnim = useRef(new Animated.Value(24)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [borderColor, setBorderColor] = useState(colors.inputBorder);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 420,
        delay,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        delay,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, slideAnim, fadeAnim]);

  useEffect(() => {
    setBorderColor(isFocused ? colors.inputFocusBorder : colors.inputBorder);
  }, [isFocused, colors.inputFocusBorder, colors.inputBorder]);

  const styles = createStyles(colors);

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) onBlur();
  };

  return (
    <Animated.View
      style={[
        styles.inputWrapper,
        {
          borderColor,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={scale(19)}
        color={isFocused ? colors.accent : colors.muted}
        style={styles.inputIcon}
      />
      <TextInput
        ref={inputRef}
        style={[styles.input, { color: colors.primary }]}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType || 'next'}
      />
      {rightElement}
    </Animated.View>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────
export default function OwnerLogin() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? THEMES.dark : THEMES.light;
  const { colors } = theme;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [channelName, setChannelName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordInputRef = useRef(null);
  const channelInputRef = useRef(null);
  const scrollViewRef = useRef(null);

  // ── Animation Refs ──
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const lineFade = useRef(new Animated.Value(0)).current;
  const lineScale = useRef(new Animated.Value(0)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(20)).current;
  const btnFade = useRef(new Animated.Value(0)).current;
  const btnSlide = useRef(new Animated.Value(20)).current;
  const footerFade = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  // ── Animation Effects ──
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(180),
      Animated.parallel([
        Animated.timing(lineFade, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(lineScale, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(260),
      Animated.parallel([
        Animated.timing(titleFade, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(titleSlide, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(btnFade, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(btnSlide, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(600),
      Animated.timing(footerFade, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Handlers ──
  const handlePressIn = () => {
    Animated.spring(btnScale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(btnScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  // Scroll to input when focused
  const scrollToInput = (ref, offset = 80) => {
    setTimeout(() => {
      ref.current?.measureLayout(scrollViewRef.current, (x, y) => {
        scrollViewRef.current?.scrollTo({ y: y - offset, animated: true });
      });
    }, 300);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // 2. Get ID token and read role from custom claims
      const tokenResult = await userCredential.user.getIdTokenResult(true);
      const role = tokenResult.claims?.role;

      // 3. Guard: only owners may proceed through this screen
      if (role && role !== 'owner') {
        await auth.signOut();
        Alert.alert(
          'Access Denied',
          'This login is for channel owners only. Please use the viewer login.'
        );
        return;
      }

      // 4. Persist role locally
      await AsyncStorage.setItem('userRole', role || 'owner');

      // 5. If channel name is provided, store it for verification
      if (channelName.trim()) {
        await AsyncStorage.setItem('channelName', channelName.trim());
      }

      router.replace('/(owner)/Dashboard');
    } catch (error) {
      console.error('❌ OwnerLogin error:', error.message);

      let message = error.message;
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        message = 'Incorrect email or password. Please try again.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
      }

      Alert.alert('Login Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(colors);

  // ── Render ──
  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={colors.background}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={true}
          keyboardDismissMode="interactive"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              {/* Header */}
              <Animated.View
                style={[
                  styles.header,
                  { opacity: headerFade, transform: [{ translateY: headerSlide }] },
                ]}
              >
                <Text style={styles.headerLabel}>Owner Login</Text>
                <Text style={styles.headerTitle}>Welcome Back</Text>
              </Animated.View>

              {/* Red Underline */}
              <Animated.View
                style={[
                  styles.underlineContainer,
                  { opacity: lineFade, transform: [{ scaleX: lineScale }] },
                ]}
              >
                <View style={styles.underline} />
              </Animated.View>

              {/* Content */}
              <View style={styles.content}>
                {/* Welcome Section */}
                <Animated.View
                  style={[
                    styles.welcomeSection,
                    { opacity: titleFade, transform: [{ translateY: titleSlide }] },
                  ]}
                >
                  <View style={styles.badgeContainer}>
                    <View style={[styles.badge, { backgroundColor: colors.accentBg }]}>
                      <Ionicons name="mic" size={scale(14)} color={colors.accent} />
                      <Text style={[styles.badgeText, { color: colors.accent }]}>
                        Channel Owner
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.welcomeText}>
                    Manage your{'\n'}
                    <Text style={{ color: colors.accent }}>News Channel</Text>
                  </Text>
                  <Text style={[styles.subtitle, { color: colors.secondary }]}>
                    Login to manage your news channel and content
                  </Text>
                </Animated.View>

                {/* Email Input */}
                <AnimatedInput
                  icon="mail-outline"
                  placeholder="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  delay={340}
                  colors={colors}
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    passwordInputRef.current?.focus();
                  }}
                  onFocus={() => scrollToInput(passwordInputRef)}
                />

                {/* Password Input */}
                <AnimatedInput
                  inputRef={passwordInputRef}
                  icon="lock-closed-outline"
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  delay={420}
                  colors={colors}
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    channelInputRef.current?.focus();
                  }}
                  onFocus={() => scrollToInput(passwordInputRef)}
                  rightElement={
                    <TouchableOpacity
                      onPress={() => setShowPassword((prev) => !prev)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={scale(19)}
                        color={colors.muted}
                      />
                    </TouchableOpacity>
                  }
                />

                {/* Channel Name Input (for verification) */}
                <AnimatedInput
                  inputRef={channelInputRef}
                  icon="business-outline"
                  placeholder="Channel Name (Optional)"
                  value={channelName}
                  onChangeText={setChannelName}
                  delay={480}
                  colors={colors}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  onFocus={() => scrollToInput(channelInputRef)}
                />

                {/* Forgot Password */}
                <Animated.View
                  style={{ opacity: btnFade, transform: [{ translateY: btnSlide }] }}
                >
                  <TouchableOpacity
                    style={styles.forgotPassword}
                    onPress={() => router.push('/(auth)/ForgotPassword')}
                  >
                    <Text style={[styles.forgotPasswordText, { color: colors.accent }]}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* Login Button */}
                <Animated.View
                  style={{
                    opacity: btnFade,
                    transform: [{ translateY: btnSlide }, { scale: btnScale }],
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.loginButton,
                      { backgroundColor: colors.accent, opacity: isLoading ? 0.75 : 1 },
                    ]}
                    onPress={handleLogin}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={isLoading}
                    activeOpacity={1}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.loginButtonText}>Login as Owner</Text>
                        <Ionicons name="arrow-forward" size={scale(18)} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* Footer */}
                <Animated.View style={[styles.footerInScroll, { opacity: footerFade }]}>
                  <Text style={[styles.footerText, { color: colors.muted }]}>
                    Don't have a channel?{' '}
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/(auth)/OwnerSignup')}>
                    <Text style={[styles.signupText, { color: colors.accent }]}>
                      Create Channel
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                <View style={styles.extraBottomPadding} />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────
const createStyles = (colors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: verticalScale(20),
    },
    header: {
      alignItems: 'center',
      paddingTop: verticalScale(28),
      paddingBottom: verticalScale(10),
      paddingHorizontal: scale(20),
    },
    headerLabel: {
      fontSize: moderateScale(9),
      fontWeight: '700',
      color: colors.muted,
      letterSpacing: 1.8,
      textTransform: 'uppercase',
      marginBottom: verticalScale(3),
    },
    headerTitle: {
      fontSize: moderateScale(24),
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: -0.4,
    },
    underlineContainer: {
      width: '100%',
      marginBottom: verticalScale(10),
    },
    underline: {
      height: 3,
      backgroundColor: colors.accent,
      width: '100%',
    },
    content: {
      flex: 1,
      paddingHorizontal: scale(22),
      paddingTop: verticalScale(22),
    },
    welcomeSection: {
      marginBottom: verticalScale(26),
    },
    badgeContainer: {
      marginBottom: verticalScale(8),
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: scale(12),
      paddingVertical: verticalScale(4),
      borderRadius: scale(20),
      alignSelf: 'flex-start',
      gap: scale(6),
    },
    badgeText: {
      fontSize: moderateScale(11),
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    welcomeText: {
      fontSize: moderateScale(26),
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: -0.5,
      lineHeight: moderateScale(34),
      marginBottom: verticalScale(8),
    },
    subtitle: {
      fontSize: moderateScale(13),
      lineHeight: moderateScale(19),
      fontWeight: '400',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderRadius: scale(13),
      paddingHorizontal: scale(16),
      marginBottom: verticalScale(14),
      backgroundColor: colors.inputBackground,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 1,
    },
    inputIcon: {
      marginRight: scale(11),
    },
    input: {
      flex: 1,
      paddingVertical: verticalScale(14),
      fontSize: moderateScale(15),
      fontWeight: '400',
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginBottom: verticalScale(22),
    },
    forgotPasswordText: {
      fontSize: moderateScale(13),
      fontWeight: '600',
    },
    loginButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: verticalScale(15),
      borderRadius: scale(14),
      gap: scale(9),
      shadowColor: '#C8001A',
      shadowOffset: { width: 0, height: scale(5) },
      shadowOpacity: 0.28,
      shadowRadius: scale(14),
      elevation: 5,
    },
    loginButtonText: {
      color: '#FFFFFF',
      fontSize: moderateScale(16),
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    footerInScroll: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: verticalScale(30),
      paddingVertical: verticalScale(12),
    },
    footerText: {
      fontSize: moderateScale(13),
    },
    signupText: {
      fontSize: moderateScale(13),
      fontWeight: '700',
    },
    extraBottomPadding: {
      height: verticalScale(60),
    },
  });