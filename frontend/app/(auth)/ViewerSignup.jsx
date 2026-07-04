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
  PixelRatio,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';   // ← ADD
import { useUser } from '../../context/UserContext';   // ← ADD

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
    const color = isFocused ? colors.inputFocusBorder : colors.inputBorder;
    setBorderColor(color);
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
          borderColor: borderColor,
          opacity: fadeAnim, 
          transform: [{ translateY: slideAnim }] 
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

// ─── Terms Content Component ─────────────────────────────────────────────
const TermsContent = ({ colors }) => {
  const styles = createStyles(colors);
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
export default function ViewerSignup({ navigation }) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? THEMES.dark : THEMES.light;
  const { colors } = theme;

  // ── Context hooks ──────────────────────────────────────────────────────
  const { setSigningUp } = useAuth();                                      // ← ADD
  const { suppressNextProfileLoad, resumeProfileLoad } = useUser();        // ← ADD

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);

  // Refs for input focus management
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);
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

  const scrollToInput = (ref) => {
    setTimeout(() => {
      ref.current?.measureLayout(scrollViewRef.current, (x, y) => {
        scrollViewRef.current?.scrollTo({ y: y - 80, animated: true });
      });
    }, 300);
  };

  const handleSignup = async () => {
    // ── Validation ──────────────────────────────────────────────────────
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

    setIsLoading(true);

    // 🔒 Block both contexts BEFORE Firebase creates the user.
    // This prevents onAuthStateChanged (AuthContext) and the user useEffect
    // (UserContext) from firing a GET /profile while the user doesn't yet
    // exist in MongoDB.
    setSigningUp(true);
    suppressNextProfileLoad();

    try {
      console.log('📝 ===== STARTING VIEWER SIGNUP =====');
      console.log('📧 Email:', email);
      console.log('👤 Name:', name);

      // 1. Create user in Firebase Auth
      console.log('1️⃣ Creating Firebase user...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase user created. UID:', userCredential.user.uid);

      // 2. Update display name
      console.log('2️⃣ Updating profile...');
      await updateProfile(userCredential.user, { displayName: name });
      console.log('✅ Profile updated');

      // 3. Get fresh Firebase token
      console.log('3️⃣ Getting Firebase token...');
      const idToken = await userCredential.user.getIdToken(true);
      console.log('✅ Token obtained.');

      // 4. Persist token
      console.log('4️⃣ Saving token to AsyncStorage...');
      await AsyncStorage.setItem('authToken', idToken);
      console.log('✅ Token saved');

      // 5. Register user in MongoDB via backend
      console.log('5️⃣ Registering in backend...');
      const response = await authAPI.register(
        { name, email, role: 'viewer' },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      console.log('✅ Backend response:', response.data);

      // ✅ User now exists in MongoDB — safe to unblock both contexts
      setSigningUp(false);
      resumeProfileLoad();

      console.log('7️⃣ Navigating to home...');
      Alert.alert(
        'Success',
        'Account created successfully!',
        [
          {
            text: 'Continue',
            onPress: () => navigation.replace('ViewerHome'),
          },
        ]
      );

    } catch (error) {
      // 🔓 Always unblock on error so normal auth flow resumes
      setSigningUp(false);
      resumeProfileLoad();

      console.error('❌ ===== SIGNUP ERROR =====');
      console.error('❌ Error message:', error.message);

      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response data:', error.response.data);
      }

      let errorMessage = 'Something went wrong. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Signup Failed', errorMessage);
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
          automaticallyAdjustContentInsets={true}
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
                <Text style={styles.headerLabel}>Viewer Signup</Text>
                <Text style={styles.headerTitle}>Create Account</Text>
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
                  <Text style={styles.welcomeText}>
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
                  delay={340}
                  colors={colors}
                  returnKeyType="next"
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                    }, 100);
                  }}
                />

                {/* Email Input */}
                <AnimatedInput
                  inputRef={emailInputRef}
                  icon="mail-outline"
                  placeholder="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  delay={400}
                  colors={colors}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  onFocus={() => scrollToInput(emailInputRef)}
                />

                {/* Password Input */}
                <AnimatedInput
                  inputRef={passwordInputRef}
                  icon="lock-closed-outline"
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  delay={460}
                  colors={colors}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                  onFocus={() => scrollToInput(passwordInputRef)}
                  rightElement={
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
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

                {/* Confirm Password Input */}
                <AnimatedInput
                  inputRef={confirmPasswordInputRef}
                  icon="lock-closed-outline"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  delay={520}
                  colors={colors}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                  onFocus={() => scrollToInput(confirmPasswordInputRef)}
                  rightElement={
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={scale(19)}
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
                        <Ionicons name="checkmark" size={scale(16)} color="#FFFFFF" />
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
                  style={[
                    { opacity: btnFade, transform: [{ translateY: btnSlide }, { scale: btnScale }] },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.signupButton,
                      { backgroundColor: colors.accent, opacity: isLoading ? 0.75 : 1 },
                    ]}
                    onPress={handleSignup}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={isLoading}
                    activeOpacity={1}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.signupButtonText}>Create Account</Text>
                        <Ionicons name="arrow-forward" size={scale(18)} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* Footer */}
                <Animated.View
                  style={[styles.footerInScroll, { opacity: footerFade }]}
                >
                  <Text style={[styles.footerText, { color: colors.muted }]}>
                    Already have an account?{' '}
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('ViewerLogin')}>
                    <Text style={[styles.loginText, { color: colors.accent }]}>Log In</Text>
                  </TouchableOpacity>
                </Animated.View>

                <View style={styles.extraBottomPadding} />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Terms & Conditions Modal ───────────────────────────────────── */}
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
                <Ionicons name="close" size={scale(22)} color={colors.accent} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={true}
            >
              <TermsContent colors={colors} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────
const createStyles = (colors) => StyleSheet.create({
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
    fontSize: moderateScale(13),
    fontWeight: '400',
    flex: 1,
  },
  checkboxLink: {
    fontWeight: '700',
  },
  signupButton: {
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
    marginTop: verticalScale(8),
  },
  signupButtonText: {
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
  loginText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
  extraBottomPadding: {
    height: verticalScale(60),
  },
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
  },
  modalTitle: {
    fontSize: moderateScale(18),
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
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(30),
  },
  termsSectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    marginTop: verticalScale(18),
    marginBottom: verticalScale(8),
    letterSpacing: -0.2,
  },
  termsText: {
    fontSize: moderateScale(13.5),
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(4),
    fontWeight: '400',
  },
  termsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: verticalScale(24),
    paddingTop: verticalScale(16),
    borderTopWidth: 1,
  },
  termsFooterText: {
    fontSize: moderateScale(11),
    fontWeight: '400',
  },
});