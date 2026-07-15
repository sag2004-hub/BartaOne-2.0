// screens/ViewerSignup.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { authAPI } from '../../services/api';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';

// ─── Constants ──────────────────────────────────────────────────────────────
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;
const MAX_CONTENT_WIDTH = 480;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_OUT_SOFT = Easing.bezier(0.16, 1, 0.3, 1);

// ─── Responsive Helpers ────────────────────────────────────────────────────
const createScalers = (windowWidth, windowHeight) => {
  const widthScale = windowWidth / BASE_WIDTH;
  const heightScale = windowHeight / BASE_HEIGHT;
  
  const clampedWidth = Math.min(Math.max(widthScale, 0.7), 1.3);
  const clampedHeight = Math.min(Math.max(heightScale, 0.7), 1.3);

  const scale = (size) => Math.round(clampedWidth * size);
  const verticalScale = (size) => Math.round(clampedHeight * size);
  const moderateScale = (size, factor = 0.5) => {
    return Math.round(size + (scale(size) - size) * factor);
  };
  const fontScale = (size) => {
    const baseScale = Math.min(clampedWidth, clampedHeight);
    return Math.round(size * baseScale);
  };

  return { scale, verticalScale, moderateScale, fontScale };
};

// ─── Theme Configuration ──────────────────────────────────────────────────
const THEMES = {
  light: {
    colors: {
      background: '#F2F0EB',
      surface: '#FFFFFF',
      surfaceAlt: '#FAFAF8',
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
      modalOverlay: 'rgba(0,0,0,0.5)',
      chipBg: '#FFFFFF',
      cardShadowOpacity: 0.06,
    },
    statusBarStyle: 'dark-content',
  },
  dark: {
    colors: {
      background: '#0D1117',
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
      placeholder: '#5C6E80',
      divider: '#1E2A36',
      inputBackground: '#1C2330',
      inputBorder: '#2A3340',
      inputFocusBorder: '#E8192C',
      modalOverlay: 'rgba(0,0,0,0.7)',
      chipBg: '#1C2330',
      cardShadowOpacity: 0.35,
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
  S,
  onSubmitEditing,
  returnKeyType,
  inputRef,
  error,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const slideAnim = useRef(new Animated.Value(16)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [borderColor, setBorderColor] = useState(colors.inputBorder);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 360,
        delay,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 360,
        delay,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, slideAnim, fadeAnim]);

  useEffect(() => {
    setBorderColor(error ? colors.accent : (isFocused ? colors.inputFocusBorder : colors.inputBorder));
  }, [isFocused, colors.inputFocusBorder, colors.inputBorder, error]);

  const styles = createStyles(colors, S);

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
        size={S.moderateScale(19)}
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
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType || 'next'}
      />
      {rightElement}
    </Animated.View>
  );
};

// ─── Terms Content Component ─────────────────────────────────────────────
const TermsContent = ({ colors, S }) => {
  const styles = createStyles(colors, S);
  return (
    <View>
      <Text style={[styles.termsSectionTitle, { color: colors.primary }]}>1. Acceptance of Terms</Text>
      <Text style={[styles.termsText, { color: colors.secondary }]}>
        By using BartaOne, you agree to these terms and conditions. If you do not agree, please do not use our services.
      </Text>

      <Text style={[styles.termsSectionTitle, { color: colors.primary }]}>2. User Accounts</Text>
      <Text style={[styles.termsText, { color: colors.secondary }]}>
        • You must be at least 13 years old to create an account{'\n'}
        • You are responsible for maintaining the confidentiality of your account{'\n'}
        • You agree to provide accurate and complete information{'\n'}
        • You are solely responsible for all activities under your account
      </Text>

      <Text style={[styles.termsSectionTitle, { color: colors.primary }]}>3. Content Guidelines</Text>
      <Text style={[styles.termsText, { color: colors.secondary }]}>
        • Users may post news, comments, and other content{'\n'}
        • Content must be accurate and not misleading{'\n'}
        • No hate speech, harassment, or discriminatory content{'\n'}
        • No spam, fraudulent, or misleading information{'\n'}
        • We reserve the right to remove any content at our discretion
      </Text>

      <Text style={[styles.termsSectionTitle, { color: colors.primary }]}>4. Intellectual Property</Text>
      <Text style={[styles.termsText, { color: colors.secondary }]}>
        • All content on BartaOne is protected by copyright{'\n'}
        • You retain ownership of content you post{'\n'}
        • You grant us a license to use your content on our platform{'\n'}
        • Do not reproduce, distribute, or modify content without permission
      </Text>

      <Text style={[styles.termsSectionTitle, { color: colors.primary }]}>5. Privacy and Data</Text>
      <Text style={[styles.termsText, { color: colors.secondary }]}>
        • We collect and process personal data as described in our Privacy Policy{'\n'}
        • You consent to our collection and use of your data{'\n'}
        • We use cookies and similar technologies{'\n'}
        • You have rights to access, modify, or delete your data
      </Text>

      <Text style={[styles.termsSectionTitle, { color: colors.primary }]}>6. Community Guidelines</Text>
      <Text style={[styles.termsText, { color: colors.secondary }]}>
        • Be respectful and constructive in discussions{'\n'}
        • Fact-check information before sharing{'\n'}
        • Report inappropriate content to our team{'\n'}
        • Help us maintain a positive community environment
      </Text>

      <Text style={[styles.termsSectionTitle, { color: colors.primary }]}>7. Termination</Text>
      <Text style={[styles.termsText, { color: colors.secondary }]}>
        • We may terminate or suspend your account without notice{'\n'}
        • You can delete your account at any time{'\n'}
        • Certain obligations survive termination
      </Text>

      <Text style={[styles.termsSectionTitle, { color: colors.primary }]}>8. Limitation of Liability</Text>
      <Text style={[styles.termsText, { color: colors.secondary }]}>
        • BartaOne is provided "as is" without warranties{'\n'}
        • We are not liable for any damages arising from use{'\n'}
        • We do not guarantee accuracy of user-generated content{'\n'}
        • Your use of the platform is at your own risk
      </Text>

      <Text style={[styles.termsSectionTitle, { color: colors.primary }]}>9. Changes to Terms</Text>
      <Text style={[styles.termsText, { color: colors.secondary }]}>
        • We may update these terms periodically{'\n'}
        • Continued use constitutes acceptance of changes{'\n'}
        • We will notify you of significant changes
      </Text>

      <Text style={[styles.termsSectionTitle, { color: colors.primary }]}>10. Contact Information</Text>
      <Text style={[styles.termsText, { color: colors.secondary }]}>
        For questions about these terms, contact us at:{'\n'}
        support@bartaone.com{'\n'}
        +91 98765 43210
      </Text>

      <View style={[styles.termsFooter, { borderTopColor: colors.border }]}>
        <Text style={[styles.termsFooterText, { color: colors.muted }]}>Last Updated: January 2026</Text>
        <Text style={[styles.termsFooterText, { color: colors.muted }]}>Version 2.0</Text>
      </View>
    </View>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────
export default function ViewerSignup() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? THEMES.dark : THEMES.light;
  const { colors } = theme;

  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const S = useMemo(
    () => createScalers(winWidth, winHeight),
    [winWidth, winHeight]
  );
  const { scale, verticalScale, moderateScale, fontScale } = S;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  
  // ── Email validation states ──
  const [emailError, setEmailError] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const emailCheckTimeout = useRef(null);

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);
  const scrollViewRef = useRef(null);

  // ── Animation Refs ──
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-16)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(14)).current;
  const btnFade = useRef(new Animated.Value(0)).current;
  const btnSlide = useRef(new Animated.Value(14)).current;
  const footerFade = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const underlineScale = useRef(new Animated.Value(0)).current;

  const { setSigningUp } = useAuth();
  const { suppressNextProfileLoad, resumeProfileLoad } = useUser();

  // ── Email Validation Function ──
  const checkEmailOwnership = async (email) => {
    if (!email || email.length < 5 || !email.includes('@')) {
      setEmailError('');
      return;
    }

    setIsCheckingEmail(true);
    try {
      const response = await authAPI.checkEmail(email);
      if (response.data?.data?.isOwner) {
        setEmailError('⚠️ This email is already registered as a channel owner. Please login to your owner account.');
      } else {
        setEmailError('');
      }
    } catch (error) {
      console.log('Email check error:', error);
      // Don't show error for failed check - we'll validate on submit
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // ── Email Change Handler with Debounce ──
  const handleEmailChange = (text) => {
    setEmail(text);
    
    // Debounce the email check
    if (emailCheckTimeout.current) {
      clearTimeout(emailCheckTimeout.current);
    }
    
    emailCheckTimeout.current = setTimeout(() => {
      checkEmailOwnership(text);
    }, 500);
  };

  // ── Animation Effects ──
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 340,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 340,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(140),
      Animated.parallel([
        Animated.timing(titleFade, {
          toValue: 1,
          duration: 360,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(titleSlide, {
          toValue: 0,
          duration: 360,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(underlineScale, {
          toValue: 1,
          duration: 400,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(440),
      Animated.parallel([
        Animated.timing(btnFade, {
          toValue: 1,
          duration: 320,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(btnSlide, {
          toValue: 0,
          duration: 320,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(540),
      Animated.timing(footerFade, {
        toValue: 1,
        duration: 280,
        easing: EASE_OUT_SOFT,
        useNativeDriver: true,
      }),
    ]).start();

    // Cleanup timeout on unmount
    return () => {
      if (emailCheckTimeout.current) {
        clearTimeout(emailCheckTimeout.current);
      }
    };
  }, []);

  // ── Handlers ──
  const handlePressIn = () => {
    Animated.spring(btnScale, {
      toValue: 0.965,
      useNativeDriver: true,
      friction: 7,
      tension: 140,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(btnScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 120,
    }).start();
  };

  const goBack = () => {
    router.replace('/(auth)/SelectRole');
  };

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (!termsAccepted) {
      Alert.alert('Error', 'Please accept the Terms & Conditions');
      return;
    }

    // ✅ Check if email is an owner before proceeding
    if (emailError) {
      Alert.alert('Error', emailError);
      return;
    }

    // Double-check with the server
    setIsLoading(true);
    try {
      const checkResponse = await authAPI.checkEmail(email);
      if (checkResponse.data?.data?.isOwner) {
        Alert.alert(
          'Email Already Registered',
          'This email is already registered as a channel owner. Please login to your owner account.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login as Owner', onPress: () => router.push('/(auth)/OwnerLogin') }
          ]
        );
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.log('Email check failed, proceeding with signup:', error);
    }

    setSigningUp(true);
    suppressNextProfileLoad();

    try {
      console.log('📝 ===== STARTING VIEWER SIGNUP =====');

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase user created. UID:', userCredential.user.uid);

      await updateProfile(userCredential.user, { displayName: name });
      console.log('✅ Profile updated');

      const idToken = await userCredential.user.getIdToken(true);
      console.log('✅ Token obtained');

      const response = await authAPI.register(
        { name, email, role: 'viewer' },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      console.log('✅ Backend response:', JSON.stringify(response.data, null, 2));

      setSigningUp(false);
      resumeProfileLoad();

      Alert.alert(
        'Success',
        'Account created successfully!',
        [{ text: 'Continue', onPress: () => router.replace('/(viewer)/Home') }]
      );
    } catch (error) {
      console.error('❌ Viewer signup error:', error.message);

      setSigningUp(false);
      resumeProfileLoad();

      let errorMessage = 'Something went wrong. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = typeof error.response.data.message === 'string' 
          ? error.response.data.message 
          : error.response.data.message?.message || 'Something went wrong';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Check if it's the owner error from backend
      if (errorMessage.includes('owner') || errorMessage.includes('channel owner')) {
        Alert.alert(
          'Email Already Registered',
          errorMessage,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login as Owner', onPress: () => router.push('/(auth)/OwnerLogin') }
          ]
        );
      } else {
        Alert.alert('Signup Failed', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(colors, S);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={colors.background}
        translucent={false}
      />

      {/* ─── Top Stripe ────────────────────────────────────────────────── */}
      <View style={[styles.topStripe, { backgroundColor: colors.accent }]} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={true}
          keyboardDismissMode="interactive"
          bounces={true}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.responsiveWrap}>
              {/* Header */}
              <Animated.View
                style={[
                  styles.header,
                  { opacity: headerFade, transform: [{ translateY: headerSlide }] },
                ]}
              >
                <TouchableOpacity
                  style={[styles.backBtn, { backgroundColor: colors.background }]}
                  onPress={goBack}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={moderateScale(20)} color={colors.primary} />
                </TouchableOpacity>

                <View style={styles.headerTextBlock}>
                  <Text style={[styles.headerLabel, { color: colors.muted }]}>Viewer Signup</Text>
                  <Text style={[styles.headerTitle, { color: colors.primary }]}>Create Account</Text>
                </View>

                <View style={styles.headerRight} />
              </Animated.View>

              {/* ─── Full Width Red Underline ─────────────────────────────── */}
              <Animated.View
                style={[
                  styles.underlineWrapper,
                  {
                    opacity: titleFade,
                    transform: [{ scaleX: underlineScale }],
                  },
                ]}
              >
                <View style={[styles.underline, { backgroundColor: colors.accent }]} />
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
                  <Text style={[styles.welcomeText, { color: colors.primary }]}>
                    Join <Text style={{ color: colors.accent }}>BartaOne!</Text>
                  </Text>
                  <Text style={[styles.subtitle, { color: colors.secondary }]}>
                    Create your account to start reading news
                  </Text>
                </Animated.View>

                {/* Name Input */}
                <AnimatedInput
                  icon="person-outline"
                  placeholder="Full Name"
                  value={name}
                  onChangeText={setName}
                  delay={260}
                  colors={colors}
                  S={S}
                  returnKeyType="next"
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                />

                {/* Email Input */}
                <AnimatedInput
                  inputRef={emailInputRef}
                  icon="mail-outline"
                  placeholder="Email Address"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  delay={320}
                  colors={colors}
                  S={S}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  error={!!emailError}
                />

                {/* Email Error Message */}
                {emailError ? (
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    marginBottom: verticalScale(10),
                    marginTop: -verticalScale(6),
                    paddingHorizontal: scale(6),
                  }}>
                    <Ionicons name="warning-outline" size={moderateScale(14)} color={colors.accent} />
                    <Text style={{ 
                      fontSize: fontScale(12), 
                      color: colors.accent, 
                      marginLeft: scale(6),
                      flex: 1,
                    }}>
                      {emailError}
                    </Text>
                  </View>
                ) : null}

                {/* Password Input */}
                <AnimatedInput
                  inputRef={passwordInputRef}
                  icon="lock-closed-outline"
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  delay={380}
                  colors={colors}
                  S={S}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                  rightElement={
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={moderateScale(19)}
                        color={colors.muted}
                      />
                    </TouchableOpacity>
                  }
                />

                {/* Confirm Password Input */}
                <AnimatedInput
                  inputRef={confirmPasswordInputRef}
                  icon="lock-closed-outline"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  delay={440}
                  colors={colors}
                  S={S}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                  rightElement={
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={moderateScale(19)}
                        color={colors.muted}
                      />
                    </TouchableOpacity>
                  }
                />

                {/* Terms & Conditions Checkbox */}
                <Animated.View
                  style={{ opacity: btnFade, transform: [{ translateY: btnSlide }] }}
                >
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setTermsAccepted(!termsAccepted)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.checkbox,
                      {
                        borderColor: termsAccepted ? colors.accent : colors.border,
                        backgroundColor: termsAccepted ? colors.accent : 'transparent',
                      },
                    ]}>
                      {termsAccepted && (
                        <Ionicons name="checkmark" size={moderateScale(16)} color="#FFFFFF" />
                      )}
                    </View>
                    <Text style={[styles.checkboxText, { color: colors.secondary }]}>
                      I agree to the{' '}
                      <Text
                        style={[styles.checkboxLink, { color: colors.accent }]}
                        onPress={() => setTermsModalVisible(true)}
                      >
                        Terms & Conditions
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* Signup Button */}
                <Animated.View
                  style={{
                    opacity: btnFade,
                    transform: [{ translateY: btnSlide }, { scale: btnScale }],
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.signupButton,
                      { 
                        backgroundColor: colors.accent, 
                        opacity: isLoading ? 0.75 : 1,
                        shadowColor: colors.accent,
                      },
                    ]}
                    onPress={handleSignup}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={isLoading}
                    activeOpacity={1}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Text style={styles.signupButtonText}>Create Account</Text>
                        <Ionicons name="arrow-forward" size={moderateScale(18)} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* Footer */}
                <Animated.View style={[styles.footerInScroll, { opacity: footerFade }]}>
                  <Text style={[styles.footerText, { color: colors.muted }]}>
                    Already have an account?{' '}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => router.push('/(auth)/ViewerLogin')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.loginText, { color: colors.accent }]}>
                      Log In
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                <View style={styles.extraBottomPadding} />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Terms & Conditions Modal ─────────────────────────────────────── */}
      <Modal
        visible={termsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.primary }]}>Terms & Conditions</Text>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: colors.accentBg }]}
                onPress={() => setTermsModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={moderateScale(22)} color={colors.accent} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={true}
            >
              <TermsContent colors={colors} S={S} />
              <TouchableOpacity
                style={[styles.acceptBtn, { backgroundColor: colors.accent }]}
                onPress={() => {
                  setTermsAccepted(true);
                  setTermsModalVisible(false);
                }}
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

// ─── Styles ──────────────────────────────────────────────────────────────
const createStyles = (colors, S) => {
  const { scale, verticalScale, moderateScale, fontScale } = S;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topStripe: {
      height: verticalScale(3),
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
    responsiveWrap: {
      width: '100%',
      maxWidth: MAX_CONTENT_WIDTH,
      alignSelf: 'center',
      paddingHorizontal: scale(16),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: verticalScale(20),
      paddingBottom: verticalScale(10),
      paddingHorizontal: scale(4),
    },
    backBtn: {
      width: scale(40),
      height: scale(40),
      borderRadius: scale(10),
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    headerTextBlock: {
      flex: 1,
      alignItems: 'center',
    },
    headerRight: {
      width: scale(40),
    },
    headerLabel: {
      fontSize: fontScale(9),
      fontWeight: '700',
      color: colors.muted,
      letterSpacing: 1.8,
      textTransform: 'uppercase',
      marginBottom: verticalScale(3),
    },
    headerTitle: {
      fontSize: fontScale(24),
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: -0.4,
    },

    // ─── Full Width Red Underline ──────────────────────────────────────────
    underlineWrapper: {
      width: '100%',
      paddingHorizontal: scale(4),
      marginBottom: verticalScale(6),
    },
    underline: {
      height: verticalScale(2.5),
      width: '100%',
    },

    content: {
      flex: 1,
      paddingHorizontal: scale(6),
      paddingTop: verticalScale(18),
    },
    welcomeSection: {
      marginBottom: verticalScale(22),
      alignItems: 'center',
    },
    welcomeText: {
      fontSize: fontScale(26),
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: -0.5,
      lineHeight: fontScale(34),
      marginBottom: verticalScale(8),
      textAlign: 'center',
    },
    subtitle: {
      fontSize: fontScale(13.5),
      lineHeight: fontScale(19.5),
      fontWeight: '400',
      color: colors.secondary,
      textAlign: 'center',
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
      shadowOffset: { width: 0, height: verticalScale(2) },
      shadowOpacity: colors.cardShadowOpacity || 0.06,
      shadowRadius: scale(6),
      elevation: 2,
      minHeight: verticalScale(52),
    },
    inputIcon: {
      marginRight: scale(11),
    },
    input: {
      flex: 1,
      paddingVertical: verticalScale(14),
      fontSize: fontScale(15),
      fontWeight: '400',
      padding: 0,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: verticalScale(14),
      paddingVertical: verticalScale(4),
    },
    checkbox: {
      width: scale(22),
      height: scale(22),
      borderRadius: scale(6),
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: scale(12),
    },
    checkboxText: {
      fontSize: fontScale(13),
      fontWeight: '400',
      flex: 1,
      color: colors.secondary,
    },
    checkboxLink: {
      fontWeight: '700',
      color: colors.accent,
    },
    signupButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: verticalScale(16),
      borderRadius: scale(14),
      gap: scale(9),
      shadowOffset: { width: 0, height: verticalScale(5) },
      shadowOpacity: 0.28,
      shadowRadius: scale(14),
      elevation: 5,
      marginTop: verticalScale(8),
      minHeight: verticalScale(54),
    },
    signupButtonText: {
      color: '#FFFFFF',
      fontSize: fontScale(16),
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    footerInScroll: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: verticalScale(28),
      paddingVertical: verticalScale(12),
      flexWrap: 'wrap',
    },
    footerText: {
      fontSize: fontScale(13.5),
      color: colors.muted,
    },
    loginText: {
      fontSize: fontScale(13.5),
      fontWeight: '700',
      color: colors.accent,
    },
    extraBottomPadding: {
      height: verticalScale(40),
    },

    // Modal Styles
    modalOverlay: {
      flex: 1,
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
      paddingVertical: verticalScale(16),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: fontScale(18),
      fontWeight: '700',
      letterSpacing: -0.3,
      color: colors.primary,
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
      paddingTop: verticalScale(20),
      paddingBottom: verticalScale(30),
    },

    // Terms
    termsSectionTitle: {
      fontSize: fontScale(16),
      fontWeight: '700',
      marginTop: verticalScale(18),
      marginBottom: verticalScale(8),
      letterSpacing: -0.2,
      color: colors.primary,
    },
    termsText: {
      fontSize: fontScale(13.5),
      lineHeight: fontScale(22),
      marginBottom: verticalScale(4),
      fontWeight: '400',
      color: colors.secondary,
    },
    termsFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: verticalScale(24),
      paddingTop: verticalScale(16),
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    termsFooterText: {
      fontSize: fontScale(11),
      fontWeight: '400',
      color: colors.muted,
    },
    acceptBtn: {
      paddingVertical: verticalScale(14),
      borderRadius: scale(12),
      alignItems: 'center',
      marginTop: verticalScale(20),
      minHeight: verticalScale(50),
    },
    acceptBtnText: {
      color: '#FFFFFF',
      fontSize: fontScale(16),
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });
};