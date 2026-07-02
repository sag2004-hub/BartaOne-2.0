import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function Loader({
  message = 'Loading...',
  size = 'large',
  fullScreen = true,
  overlay = false,
}) {
  const Component = (
    <View style={[styles.container, fullScreen && styles.fullScreen, overlay && styles.overlay]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons name="newspaper" size={40} color="#FF6B6B" />
        </View>
        <ActivityIndicator size={size} color="#FF6B6B" style={styles.spinner} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );

  if (overlay) {
    return Component;
  }

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      {Component}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  overlay: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  spinner: {
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
});