import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Footer({ 
  showSocial = true,
  showLinks = true,
  showCopyright = true,
}) {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: 'logo-facebook', url: 'https://facebook.com' },
    { icon: 'logo-twitter', url: 'https://twitter.com' },
    { icon: 'logo-instagram', url: 'https://instagram.com' },
    { icon: 'logo-youtube', url: 'https://youtube.com' },
  ];

  const handleSocialPress = (url) => {
    Linking.openURL(url).catch(() => {
      console.log('Could not open URL');
    });
  };

  return (
    <View style={styles.container}>
      {showSocial && (
        <View style={styles.socialContainer}>
          {socialLinks.map((social, index) => (
            <TouchableOpacity
              key={index}
              style={styles.socialIcon}
              onPress={() => handleSocialPress(social.url)}
            >
              <Ionicons name={social.icon} size={24} color="#888" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showLinks && (
        <View style={styles.linksContainer}>
          <TouchableOpacity>
            <Text style={styles.linkText}>About</Text>
          </TouchableOpacity>
          <View style={styles.linkDivider} />
          <TouchableOpacity>
            <Text style={styles.linkText}>Privacy</Text>
          </TouchableOpacity>
          <View style={styles.linkDivider} />
          <TouchableOpacity>
            <Text style={styles.linkText}>Terms</Text>
          </TouchableOpacity>
          <View style={styles.linkDivider} />
          <TouchableOpacity>
            <Text style={styles.linkText}>Contact</Text>
          </TouchableOpacity>
        </View>
      )}

      {showCopyright && (
        <View style={styles.copyrightContainer}>
          <Text style={styles.copyrightText}>
            © {currentYear} BartaOne. All rights reserved.
          </Text>
          <Text style={styles.versionText}>v1.0.0</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  linkText: {
    fontSize: 14,
    color: '#888',
  },
  linkDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
  },
  copyrightContainer: {
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: 12,
    color: '#CCC',
  },
  versionText: {
    fontSize: 10,
    color: '#DDD',
    marginTop: 2,
  },
});