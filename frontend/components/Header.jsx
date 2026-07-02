import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function Header({ 
  title, 
  showBack = false, 
  showMenu = false,
  showNotification = false,
  rightComponent = null,
  onMenuPress,
  onNotificationPress,
  transparent = false,
}) {
  const navigation = useNavigation();

  return (
    <>
      <StatusBar barStyle={transparent ? 'light-content' : 'dark-content'} />
      <View style={[
        styles.container,
        transparent ? styles.transparent : styles.solid,
      ]}>
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={transparent ? '#FFF' : '#333'} 
              />
            </TouchableOpacity>
          )}
          {showMenu && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onMenuPress}
            >
              <Ionicons 
                name="menu" 
                size={24} 
                color={transparent ? '#FFF' : '#333'} 
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.centerContainer}>
          {title ? (
            <Text style={[
              styles.title,
              transparent && styles.titleLight,
            ]}>
              {title}
            </Text>
          ) : (
            <View style={styles.logoContainer}>
              <Ionicons name="newspaper" size={24} color="#FF6B6B" />
              <Text style={[
                styles.logoText,
                transparent && styles.logoTextLight,
              ]}>
                BartaOne
              </Text>
            </View>
          )}
        </View>

        <View style={styles.rightContainer}>
          {showNotification && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onNotificationPress || (() => {})}
            >
              <Ionicons 
                name="notifications-outline" 
                size={24} 
                color={transparent ? '#FFF' : '#333'} 
              />
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
          )}
          {rightComponent && rightComponent}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 60,
  },
  solid: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transparent: {
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
  },
  iconButton: {
    padding: 4,
    position: 'relative',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  titleLight: {
    color: '#FFF',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logoTextLight: {
    color: '#FFF',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});