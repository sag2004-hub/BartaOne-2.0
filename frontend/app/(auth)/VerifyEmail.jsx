import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../../services/firebase';

export default function VerifyEmail({ navigation, route }) {
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const user = auth.currentUser;

  useEffect(() => {
    // Check if email is verified
    const checkVerification = setInterval(() => {
      if (user) {
        user.reload();
        if (user.emailVerified) {
          clearInterval(checkVerification);
          Alert.alert(
            'Email Verified!',
            'Your email has been verified successfully.',
            [
              {
                text: 'Continue',
                onPress: () => {
                  if (route.params?.role === 'owner') {
                    navigation.replace('OwnerDashboard');
                  } else {
                    navigation.replace('ViewerHome');
                  }
                },
              },
            ]
          );
        }
      }
    }, 3000);

    return () => clearInterval(checkVerification);
  }, []);

  const handleResendEmail = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    try {
      await sendEmailVerification(user);
      setCountdown(60);
      Alert.alert('Email Sent', 'Verification email has been sent again.');
      
      // Countdown timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Email</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconWrapper}>
            <Ionicons name="mail-open-outline" size={64} color="#4ECDC4" />
          </View>
        </View>

        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a verification link to:
        </Text>
        <Text style={styles.emailText}>{user?.email}</Text>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#FF6B6B" />
          <Text style={styles.infoText}>
            Please check your inbox and click the verification link to activate your account
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendEmail}
            disabled={isLoading || countdown > 0}
          >
            <Text style={styles.resendButtonText}>
              {countdown > 0
                ? `Resend in ${countdown}s`
                : isLoading
                ? 'Sending...'
                : 'Resend Verification Email'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              if (user) {
                user.reload();
                if (user.emailVerified) {
                  Alert.alert('Verified!', 'Your email is verified.');
                  if (route.params?.role === 'owner') {
                    navigation.replace('OwnerDashboard');
                  } else {
                    navigation.replace('ViewerHome');
                  }
                } else {
                  Alert.alert('Not Verified', 'Please verify your email first.');
                }
              }
            }}
          >
            <Ionicons name="refresh-outline" size={20} color="#FFF" />
            <Text style={styles.refreshButtonText}>Check Verification</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Wrong email? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.changeEmailText}>Change Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 30,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0FFF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  resendButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF',
  },
  resendButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  refreshButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 24,
  },
  footerText: {
    color: '#888',
    fontSize: 14,
  },
  changeEmailText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: 'bold',
  },
});