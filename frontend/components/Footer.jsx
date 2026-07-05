import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  useColorScheme,
  Dimensions,
  PixelRatio,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SW, height: SH } = Dimensions.get('window');
const BASE_W = 390;
const scale = (n) => Math.round((SW / BASE_W) * n);
const vs = (n) => Math.round((SH / 844) * n);
const sp = (n) => n / PixelRatio.getFontScale();

// ─── Theme ───────────────────────────────────────────────────────────────────
const LIGHT = {
  bg:               '#F2F0EB',
  surface:          '#FFFFFF',
  surfaceAlt:       '#FAFAF8',
  border:           '#E4E0D8',
  accent:           '#C8001A',
  accentBg:         '#FFF0F2',
  primary:          '#1A2733',
  secondary:        '#4A5A6B',
  muted:            '#8A97A5',
  faint:            '#B8C0B8',
  cardShadowOpacity: 0.06,
};

const DARK = {
  bg:               '#0D1117',
  surface:          '#161B22',
  surfaceAlt:       '#1C2330',
  border:           '#2A3340',
  accent:           '#E8192C',
  accentBg:         'rgba(232,25,44,0.12)',
  primary:          '#EDF2F7',
  secondary:        '#8B9BAB',
  muted:            '#5C6E80',
  faint:            '#3A4A58',
  cardShadowOpacity: 0.35,
};

export default function Footer({ 
  showSocial = true,
  showLinks = true,
  showCopyright = true,
}) {
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: 'logo-facebook', url: 'https://facebook.com', color: '#1877F2' },
    { icon: 'logo-twitter', url: 'https://twitter.com', color: '#1DA1F2' },
    { icon: 'logo-instagram', url: 'https://instagram.com', color: '#E4405F' },
    { icon: 'logo-youtube', url: 'https://youtube.com', color: '#FF0000' },
    { icon: 'logo-linkedin', url: 'https://linkedin.com', color: '#0A66C2' },
  ];

  const handleSocialPress = (url) => {
    Linking.openURL(url).catch(() => {
      console.log('Could not open URL');
    });
  };

  const handleLinkPress = (type) => {
    // Handle navigation or open modal
    console.log(`Navigate to ${type}`);
  };

  const styles = makeStyles(C);

  return (
    <View style={styles.container}>
      {/* Accent Line */}
      <View style={styles.accentLine} />

      {showSocial && (
        <View style={styles.socialContainer}>
          {socialLinks.map((social, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.socialIcon, { backgroundColor: C.surface }]}
              onPress={() => handleSocialPress(social.url)}
              activeOpacity={0.7}
            >
              <Ionicons name={social.icon} size={scale(20)} color={social.color} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showLinks && (
        <View style={styles.linksContainer}>
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => handleLinkPress('about')}
          >
            <Text style={[styles.linkText, { color: C.muted }]}>About</Text>
          </TouchableOpacity>
          <View style={[styles.linkDivider, { backgroundColor: C.border }]} />
          
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => handleLinkPress('privacy')}
          >
            <Text style={[styles.linkText, { color: C.muted }]}>Privacy</Text>
          </TouchableOpacity>
          <View style={[styles.linkDivider, { backgroundColor: C.border }]} />
          
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => handleLinkPress('terms')}
          >
            <Text style={[styles.linkText, { color: C.muted }]}>Terms</Text>
          </TouchableOpacity>
          <View style={[styles.linkDivider, { backgroundColor: C.border }]} />
          
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => handleLinkPress('contact')}
          >
            <Text style={[styles.linkText, { color: C.muted }]}>Contact</Text>
          </TouchableOpacity>
        </View>
      )}

      {showCopyright && (
        <View style={styles.copyrightContainer}>
          <Text style={[styles.copyrightText, { color: C.faint }]}>
            © {currentYear} BartaOne. All rights reserved.
          </Text>
          <View style={styles.versionBadge}>
            <Text style={[styles.versionText, { color: C.muted }]}>v1.0.0</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    container: {
      paddingVertical: vs(16),
      paddingHorizontal: scale(20),
      backgroundColor: C.surfaceAlt,
      borderTopWidth: 1,
      borderTopColor: C.border,
    },
    accentLine: {
      height: 2,
      width: scale(60),
      backgroundColor: C.accent,
      alignSelf: 'center',
      marginBottom: vs(16),
      borderRadius: scale(1),
    },

    // Social Icons
    socialContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: scale(12),
      marginBottom: vs(16),
      flexWrap: 'wrap',
    },
    socialIcon: {
      width: scale(42),
      height: scale(42),
      borderRadius: scale(12),
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: C.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(2) },
      shadowOpacity: C.cardShadowOpacity,
      shadowRadius: scale(4),
      elevation: 2,
    },

    // Links
    linksContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: scale(8),
      marginBottom: vs(14),
      paddingHorizontal: scale(8),
    },
    linkItem: {
      paddingVertical: vs(4),
      paddingHorizontal: scale(4),
    },
    linkText: {
      fontSize: sp(13),
      fontWeight: '500',
      letterSpacing: 0.2,
    },
    linkDivider: {
      width: 1,
      height: scale(14),
      alignSelf: 'center',
    },

    // Copyright
    copyrightContainer: {
      alignItems: 'center',
      gap: vs(4),
    },
    copyrightText: {
      fontSize: sp(11),
      fontWeight: '400',
      letterSpacing: 0.2,
    },
    versionBadge: {
      paddingHorizontal: scale(10),
      paddingVertical: vs(2),
      borderRadius: scale(6),
      backgroundColor: C.bg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: C.border,
    },
    versionText: {
      fontSize: sp(9),
      fontWeight: '600',
      letterSpacing: 0.5,
    },
  });
}