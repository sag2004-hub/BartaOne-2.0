import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  Share,
  ActivityIndicator,
  Dimensions,
  useColorScheme,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Loader from '../../components/Loader';
import useNewspaper from '../../hooks/useNewspaper';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Responsive helpers ──────────────────────────────────────────────────────
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

const scale = (size) => {
  const s = Math.min(Math.max(SCREEN_WIDTH / BASE_WIDTH, 0.7), 1.3);
  return Math.round(s * size);
};
const verticalScale = (size) => {
  const s = Math.min(Math.max(SCREEN_HEIGHT / BASE_HEIGHT, 0.7), 1.3);
  return Math.round(s * size);
};
const moderateScale = (size, factor = 0.5) =>
  Math.round(size + (scale(size) - size) * factor);
const fontScale = (size) => {
  const s = Math.min(
    Math.min(Math.max(SCREEN_WIDTH / BASE_WIDTH, 0.7), 1.3),
    Math.min(Math.max(SCREEN_HEIGHT / BASE_HEIGHT, 0.7), 1.3),
  );
  return Math.round((size * s));
};

// ─── Vintage newspaper palette ───────────────────────────────────────────────
const VINTAGE = {
  paper:       '#F5EDD6',
  paperDark:   '#EDE0C0',
  paperDeep:   '#E0D0A8',
  ink:         '#1C1209',
  inkBody:     '#2E2010',
  inkMuted:    '#7A6A50',
  rule:        '#3A2A14',
  accent:      '#8B1A1A',
  accentLight: '#C8001A',
  border:      '#B09060',
  shadow:      'rgba(28,18,9,0.18)',
};

// ─── Page Flip Component ────────────────────────────────────────────────────
const PageFlipView = ({ pages, currentPageIndex, onPageChange }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState('next');
  const [displayIndex, setDisplayIndex] = useState(currentPageIndex);

  const flipFront = useRef(new Animated.Value(0)).current;
  const flipBack = useRef(new Animated.Value(1)).current;

  const totalPages = pages.length;

  const flipToPage = (newIndex) => {
    if (isAnimating || newIndex === displayIndex || newIndex < 0 || newIndex >= totalPages) return;
    const dir = newIndex > displayIndex ? 'next' : 'prev';
    setDirection(dir);
    setIsAnimating(true);

    flipFront.setValue(0);
    flipBack.setValue(1);

    Animated.sequence([
      Animated.timing(flipFront, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
      Animated.timing(flipBack, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start(() => {
      setDisplayIndex(newIndex);
      setIsAnimating(false);
      flipFront.setValue(0);
      flipBack.setValue(1);
      if (onPageChange) onPageChange(newIndex);
    });
  };

  useEffect(() => {
    if (currentPageIndex !== displayIndex && !isAnimating) {
      flipToPage(currentPageIndex);
    }
  }, [currentPageIndex]);

  const frontRotate = flipFront.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', direction === 'next' ? '-90deg' : '90deg'],
  });
  const frontOpacity = flipFront.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.6, 0],
  });

  const backRotate = flipBack.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', direction === 'next' ? '90deg' : '-90deg'],
  });
  const backOpacity = flipBack.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.6, 0],
  });

  const currentPage = pages[displayIndex] || {};
  const nextPageIndex = displayIndex + (direction === 'next' ? 1 : -1);
  const nextPage = pages[nextPageIndex] || {};

  const renderPageContent = (page) => (
    <ScrollView 
      style={fpvStyles.pageScroll} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={fpvStyles.pageContentContainer}
    >
      {page.images && page.images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={fpvStyles.imageRow}>
          {page.images.map((img, i) => (
            <View key={i} style={fpvStyles.imageFrame}>
              <Image source={{ uri: img }} style={fpvStyles.pageImage} resizeMode="cover" />
              <View style={fpvStyles.imageCaption}>
                <Text style={fpvStyles.imageCaptionTxt}>Fig. {i + 1}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
      <View style={fpvStyles.columnRule} />
      <Text style={fpvStyles.bodyText}>{page.content || 'No content for this page.'}</Text>
      <View style={[fpvStyles.columnRule, { marginTop: verticalScale(12) }]} />
    </ScrollView>
  );

  return (
    <View style={fpvStyles.container}>
      <Animated.View
        style={[
          fpvStyles.pagePanel,
          {
            opacity: frontOpacity,
            transform: [{ perspective: 1200 }, { rotateY: frontRotate }],
          },
          isAnimating && fpvStyles.pagePanelAbsolute,
        ]}
      >
        {renderPageContent(currentPage)}
      </Animated.View>

      {isAnimating && (
        <Animated.View
          style={[
            fpvStyles.pagePanel,
            fpvStyles.pagePanelAbsolute,
            {
              opacity: backOpacity,
              transform: [{ perspective: 1200 }, { rotateY: backRotate }],
            },
          ]}
        >
          {renderPageContent(nextPage)}
        </Animated.View>
      )}
    </View>
  );
};

const fpvStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VINTAGE.paper,
    overflow: 'hidden',
  },
  pageScroll: {
    flex: 1,
    backgroundColor: VINTAGE.paper,
  },
  pageContentContainer: {
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(12),
    paddingBottom: verticalScale(30),
  },
  pagePanel: {
    flex: 1,
    backgroundColor: VINTAGE.paper,
  },
  pagePanelAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  columnRule: {
    height: 1,
    backgroundColor: VINTAGE.rule,
    opacity: 0.4,
    marginVertical: verticalScale(6),
  },
  bodyText: {
    fontSize: fontScale(13),
    lineHeight: fontScale(21),
    color: VINTAGE.inkBody,
    textAlign: 'justify',
    letterSpacing: 0.1,
  },
  imageRow: {
    marginBottom: verticalScale(8),
  },
  imageFrame: {
    marginRight: scale(8),
    borderWidth: 1,
    borderColor: VINTAGE.border,
    borderRadius: scale(2),
    overflow: 'hidden',
  },
  pageImage: {
    width: scale(140),
    height: scale(100),
  },
  imageCaption: {
    backgroundColor: VINTAGE.paperDark,
    paddingHorizontal: scale(4),
    paddingVertical: verticalScale(2),
    alignItems: 'center',
  },
  imageCaptionTxt: {
    fontSize: fontScale(8),
    color: VINTAGE.inkMuted,
    fontStyle: 'italic',
  },
});

// ─── Vintage Newspaper Modal ────────────────────────────────────────────────────
const VintageNewspaperModal = ({ visible, newspaper, onClose }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const totalPages = newspaper?.pages?.length || 0;
  const [paperAnim] = useState(new Animated.Value(0));
  const modalAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setPageIndex(0);
      modalAnim.setValue(0);
      Animated.spring(modalAnim, {
        toValue: 1,
        tension: 60,
        friction: 12,
        useNativeDriver: true,
      }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(paperAnim, { toValue: 1, duration: 4000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
          Animated.timing(paperAnim, { toValue: 0, duration: 4000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        ])
      ).start();
    } else {
      paperAnim.stopAnimation();
      paperAnim.setValue(0);
    }
  }, [visible]);

  if (!newspaper) return null;

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch { return d || ''; }
  };

  const modalScale = modalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });
  const modalOpacity = modalAnim;

  const paperScale = paperAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.002],
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={vnmStyles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[vnmStyles.backdrop, { opacity: modalOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[
          vnmStyles.sheet,
          {
            opacity: modalOpacity,
            transform: [{ scale: modalScale }],
          },
        ]}>
          <Animated.View style={{ flex: 1, transform: [{ scale: paperScale }] }}>
            {/* ─── Masthead ──────────────────────────────────────────────────── */}
            <View style={vnmStyles.masthead}>
              <View style={vnmStyles.mastheadRule} />
              <Text style={vnmStyles.mastheadEyebrow}>BartaOne · Est. 2024</Text>
              <View style={vnmStyles.mastheadRule} />
              <Text style={vnmStyles.mastheadTitle} numberOfLines={2}>
                {newspaper.title}
              </Text>
              <View style={vnmStyles.mastheadRule} />
              <View style={vnmStyles.mastheadMeta}>
                <Text style={vnmStyles.mastheadMetaText}>{newspaper.edition}</Text>
                <View style={vnmStyles.mastheadDot} />
                <Text style={vnmStyles.mastheadMetaText}>{formatDate(newspaper.date)}</Text>
                <View style={vnmStyles.mastheadDot} />
                <Text style={vnmStyles.mastheadMetaText}>Page {pageIndex + 1} of {totalPages}</Text>
              </View>
              <View style={vnmStyles.mastheadRule} />
            </View>

            {newspaper.subtitle && (
              <Text style={vnmStyles.subtitle}>{newspaper.subtitle}</Text>
            )}

            {/* ─── Page Viewer ────────────────────────────────────────────── */}
            <View style={vnmStyles.pageWrapper}>
              <PageFlipView
                pages={newspaper.pages || []}
                currentPageIndex={pageIndex}
                onPageChange={setPageIndex}
              />
            </View>

            {/* ─── Page Navigation ────────────────────────────────────────── */}
            {totalPages > 1 && (
              <View style={vnmStyles.pageNav}>
                <TouchableOpacity
                  style={[vnmStyles.pageNavBtn, pageIndex === 0 && vnmStyles.pageNavBtnDisabled]}
                  onPress={() => setPageIndex(Math.max(0, pageIndex - 1))}
                  disabled={pageIndex === 0}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={moderateScale(18)} color={pageIndex === 0 ? VINTAGE.border : VINTAGE.ink} />
                  <Text style={[vnmStyles.pageNavTxt, pageIndex === 0 && vnmStyles.pageNavTxtDisabled]}>
                    Previous
                  </Text>
                </TouchableOpacity>

                <View style={vnmStyles.pageDots}>
                  {newspaper.pages.map((_, i) => (
                    <TouchableOpacity key={i} onPress={() => setPageIndex(i)} activeOpacity={0.7}>
                      <View style={[vnmStyles.dot, i === pageIndex && vnmStyles.dotActive]} />
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[vnmStyles.pageNavBtn, pageIndex === totalPages - 1 && vnmStyles.pageNavBtnDisabled]}
                  onPress={() => setPageIndex(Math.min(totalPages - 1, pageIndex + 1))}
                  disabled={pageIndex === totalPages - 1}
                  activeOpacity={0.7}
                >
                  <Text style={[vnmStyles.pageNavTxt, pageIndex === totalPages - 1 && vnmStyles.pageNavTxtDisabled]}>
                    Next
                  </Text>
                  <Ionicons name="chevron-forward" size={moderateScale(18)} color={pageIndex === totalPages - 1 ? VINTAGE.border : VINTAGE.ink} />
                </TouchableOpacity>
              </View>
            )}

            {/* ─── Close Button ───────────────────────────────────────────── */}
            <TouchableOpacity style={vnmStyles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={moderateScale(24)} color={VINTAGE.ink} />
            </TouchableOpacity>

            {/* ─── Footer ──────────────────────────────────────────────────── */}
            <View style={vnmStyles.footer}>
              <Text style={vnmStyles.footerText}>— End of Edition —</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const vnmStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10,6,2,0.75)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    width: SCREEN_WIDTH * 0.94,
    height: SCREEN_HEIGHT * 0.92,
    maxWidth: 550,
    backgroundColor: VINTAGE.paper,
    borderRadius: scale(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(8) },
    shadowOpacity: 0.6,
    shadowRadius: scale(24),
    elevation: 24,
    borderWidth: 1,
    borderColor: VINTAGE.border,
    overflow: 'hidden',
  },
  masthead: {
    backgroundColor: VINTAGE.paper,
    paddingHorizontal: scale(18),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(6),
    zIndex: 2,
  },
  mastheadRule: {
    height: 1.5,
    backgroundColor: VINTAGE.rule,
    marginVertical: verticalScale(3),
  },
  mastheadEyebrow: {
    fontSize: fontScale(9),
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    color: VINTAGE.inkMuted,
    textAlign: 'center',
    marginVertical: verticalScale(2),
  },
  mastheadTitle: {
    fontSize: fontScale(24),
    fontWeight: '900',
    color: VINTAGE.ink,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: fontScale(28),
    paddingVertical: verticalScale(4),
    textTransform: 'uppercase',
  },
  mastheadMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(3),
    flexWrap: 'wrap',
    gap: scale(6),
  },
  mastheadMetaText: {
    fontSize: fontScale(9),
    color: VINTAGE.inkMuted,
    letterSpacing: 0.5,
  },
  mastheadDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: VINTAGE.inkMuted,
  },
  subtitle: {
    fontSize: fontScale(12),
    fontStyle: 'italic',
    color: VINTAGE.inkBody,
    textAlign: 'center',
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(6),
    letterSpacing: 0.3,
  },
  pageWrapper: {
    flex: 1,
    backgroundColor: VINTAGE.paper,
    minHeight: verticalScale(200),
  },
  pageNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    backgroundColor: VINTAGE.paperDark,
    borderTopWidth: 1,
    borderTopColor: VINTAGE.border,
    zIndex: 2,
  },
  pageNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderWidth: 1,
    borderColor: VINTAGE.border,
    backgroundColor: VINTAGE.paper,
    borderRadius: scale(4),
  },
  pageNavBtnDisabled: {
    opacity: 0.35,
  },
  pageNavTxt: {
    fontSize: fontScale(11),
    color: VINTAGE.ink,
    letterSpacing: 0.5,
  },
  pageNavTxtDisabled: {
    color: VINTAGE.border,
  },
  pageDots: {
    flexDirection: 'row',
    gap: scale(5),
    alignItems: 'center',
  },
  dot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: VINTAGE.border,
  },
  dotActive: {
    backgroundColor: VINTAGE.accent,
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
  },
  closeBtn: {
    position: 'absolute',
    top: verticalScale(12),
    right: scale(12),
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: VINTAGE.paperDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: VINTAGE.border,
    zIndex: 10,
  },
  footer: {
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(16),
    backgroundColor: VINTAGE.paperDeep,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: VINTAGE.border,
  },
  footerText: {
    fontSize: fontScale(9),
    color: VINTAGE.inkMuted,
    letterSpacing: 2.5,
    fontStyle: 'italic',
  },
});

// ─── NewspaperDetails ─────────────────────────────────────────────────────────
const NewspaperDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getNewspaperById, loading } = useNewspaper();
  const [newspaper, setNewspaper] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedNewspaper, setSelectedNewspaper] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    loadNewspaper();
  }, [id]);

  const loadNewspaper = async () => {
    setIsLoading(true);
    const data = await getNewspaperById(id);
    setNewspaper(data);
    setIsLoading(false);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${newspaper.title}" on NewsHub!\n${newspaper.description}`,
        title: newspaper.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleViewFull = async () => {
    setPreviewLoading(true);
    setPreviewVisible(true);
    try {
      const data = await getNewspaperById(id);
      setSelectedNewspaper(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load newspaper details');
    } finally {
      setPreviewLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Today';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return <Loader message="Loading newspaper..." />;
  }

  if (!newspaper) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="newspaper-outline" size={60} color={VINTAGE.inkMuted} />
        <Text style={styles.errorText}>Newspaper Not Found</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={VINTAGE.paper} translucent={false} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={VINTAGE.ink} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {newspaper.title || 'Newspaper'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={24} color={VINTAGE.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Edition Badge */}
          {newspaper.edition && (
            <View style={styles.editionBadge}>
              <Text style={styles.editionText}>{newspaper.edition}</Text>
            </View>
          )}

          {/* Title */}
          <Text style={styles.title}>{newspaper.title}</Text>
          
          {/* Subtitle */}
          {newspaper.subtitle && (
            <Text style={styles.subtitle}>{newspaper.subtitle}</Text>
          )}
          
          {/* Description */}
          {newspaper.description && (
            <Text style={styles.description}>{newspaper.description}</Text>
          )}

          {/* Info Row */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={16} color={VINTAGE.inkMuted} />
              <Text style={styles.infoText}>{formatDate(newspaper.publishedAt)}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Ionicons name="book-outline" size={16} color={VINTAGE.inkMuted} />
              <Text style={styles.infoText}>{newspaper.pages?.length || 0} Pages</Text>
            </View>
          </View>

          {/* View Full Button */}
          <TouchableOpacity style={styles.viewFullButton} onPress={handleViewFull} activeOpacity={0.7}>
            <Ionicons name="eye-outline" size={20} color={VINTAGE.paper} />
            <Text style={styles.viewFullText}>Read Full Newspaper</Text>
          </TouchableOpacity>

          {/* Page Preview */}
          {newspaper.pages && newspaper.pages.length > 0 && (
            <View style={styles.previewSection}>
              <Text style={styles.previewTitle}>Preview</Text>
              <View style={styles.previewRule} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
                {newspaper.pages.map((page, index) => (
                  <TouchableOpacity key={index} style={styles.previewCard} onPress={handleViewFull}>
                    {page.images && page.images.length > 0 ? (
                      <Image source={{ uri: page.images[0] }} style={styles.previewImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.previewPlaceholder}>
                        <Ionicons name="document-text-outline" size={32} color={VINTAGE.inkMuted} />
                      </View>
                    )}
                    <Text style={styles.previewPageNum}>Page {index + 1}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Loading Modal */}
      <Modal visible={previewLoading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={VINTAGE.accent} />
            <Text style={styles.loadingText}>Loading edition…</Text>
          </View>
        </View>
      </Modal>

      {/* Vintage Newspaper Modal */}
      <VintageNewspaperModal
        visible={previewVisible && !previewLoading && !!selectedNewspaper}
        newspaper={selectedNewspaper}
        onClose={() => { setPreviewVisible(false); setSelectedNewspaper(null); }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VINTAGE.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    backgroundColor: VINTAGE.paper,
    borderBottomWidth: 1,
    borderBottomColor: VINTAGE.border,
  },
  backButton: {
    padding: scale(4),
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: scale(8),
  },
  headerTitle: {
    fontSize: fontScale(16),
    fontWeight: '700',
    color: VINTAGE.ink,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  shareButton: {
    padding: scale(4),
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: scale(20),
    paddingBottom: verticalScale(30),
  },
  editionBadge: {
    alignSelf: 'center',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(4),
    backgroundColor: VINTAGE.paperDark,
    borderWidth: 1,
    borderColor: VINTAGE.border,
    borderRadius: scale(2),
    marginBottom: verticalScale(12),
  },
  editionText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    color: VINTAGE.inkMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: fontScale(24),
    fontWeight: '900',
    color: VINTAGE.ink,
    textAlign: 'center',
    marginBottom: verticalScale(6),
    letterSpacing: -0.5,
    lineHeight: fontScale(30),
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: fontScale(14),
    fontStyle: 'italic',
    color: VINTAGE.inkBody,
    textAlign: 'center',
    marginBottom: verticalScale(8),
    letterSpacing: 0.2,
  },
  description: {
    fontSize: fontScale(13),
    color: VINTAGE.inkMuted,
    textAlign: 'center',
    marginBottom: verticalScale(16),
    lineHeight: fontScale(20),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: VINTAGE.border,
    marginBottom: verticalScale(16),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    paddingHorizontal: scale(12),
  },
  infoText: {
    fontSize: fontScale(12),
    color: VINTAGE.inkMuted,
  },
  infoDivider: {
    width: 1,
    height: verticalScale(16),
    backgroundColor: VINTAGE.border,
  },
  viewFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VINTAGE.accent,
    paddingVertical: verticalScale(12),
    borderRadius: scale(4),
    marginBottom: verticalScale(16),
    gap: scale(8),
  },
  viewFullText: {
    fontSize: fontScale(14),
    fontWeight: '700',
    color: VINTAGE.paper,
    letterSpacing: 0.5,
  },
  previewSection: {
    marginTop: verticalScale(4),
  },
  previewTitle: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: VINTAGE.inkMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: verticalScale(6),
  },
  previewRule: {
    height: 1,
    backgroundColor: VINTAGE.border,
    marginBottom: verticalScale(10),
  },
  previewScroll: {
    marginHorizontal: -scale(4),
  },
  previewCard: {
    width: scale(120),
    marginHorizontal: scale(4),
    backgroundColor: VINTAGE.paperDark,
    borderWidth: 1,
    borderColor: VINTAGE.border,
    borderRadius: scale(2),
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: scale(80),
    backgroundColor: VINTAGE.paperDeep,
  },
  previewPlaceholder: {
    width: '100%',
    height: scale(80),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: VINTAGE.paperDeep,
  },
  previewPageNum: {
    fontSize: fontScale(10),
    color: VINTAGE.inkMuted,
    textAlign: 'center',
    paddingVertical: verticalScale(4),
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(32),
    backgroundColor: VINTAGE.paper,
  },
  errorText: {
    fontSize: fontScale(18),
    fontWeight: '700',
    color: VINTAGE.ink,
    marginTop: verticalScale(12),
  },
  errorButton: {
    marginTop: verticalScale(16),
    backgroundColor: VINTAGE.accent,
    paddingHorizontal: scale(32),
    paddingVertical: verticalScale(10),
    borderRadius: scale(4),
  },
  errorButtonText: {
    color: VINTAGE.paper,
    fontSize: fontScale(14),
    fontWeight: '700',
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10,6,2,0.6)',
  },
  loadingBox: {
    backgroundColor: VINTAGE.paper,
    padding: scale(24),
    borderRadius: scale(4),
    alignItems: 'center',
    gap: verticalScale(10),
    borderWidth: 1,
    borderColor: VINTAGE.border,
  },
  loadingText: {
    fontSize: fontScale(13),
    color: VINTAGE.ink,
    letterSpacing: 1,
  },
});

export default NewspaperDetails;