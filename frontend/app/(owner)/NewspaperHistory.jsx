import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  RefreshControl,
  Animated,
  Dimensions,
  PixelRatio,
  useColorScheme,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
  ActivityIndicator,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import NewspaperCard from '../../components/NewspaperCard';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import useNewspaper from '../../hooks/useNewspaper';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

const scale = (size) => {
  const scaleFactor = SCREEN_WIDTH / BASE_WIDTH;
  const clamped = Math.min(Math.max(scaleFactor, 0.7), 1.3);
  return Math.round(clamped * size);
};
const verticalScale = (size) => {
  const scaleFactor = SCREEN_HEIGHT / BASE_HEIGHT;
  const clamped = Math.min(Math.max(scaleFactor, 0.7), 1.3);
  return Math.round(clamped * size);
};
const moderateScale = (size, factor = 0.5) =>
  Math.round(size + (scale(size) - size) * factor);
const fontScale = (size) => {
  const scaleFactor = Math.min(SCREEN_WIDTH / BASE_WIDTH, SCREEN_HEIGHT / BASE_HEIGHT);
  const clamped = Math.min(Math.max(scaleFactor, 0.7), 1.3);
  return Math.round((size * clamped) / PixelRatio.getFontScale());
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

// ─── UI theme ─────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: '#F2F0EB', surface: '#FFFFFF', surfaceAlt: '#FAFAF8',
  border: '#E4E0D8', accent: '#C8001A', accentBg: '#FFF0F2',
  primary: '#1A2733', secondary: '#4A5A6B', muted: '#8A97A5',
  white: '#FFFFFF', cardShadowOpacity: 0.06,
  statusActive: '#0E8A5A', statusExpired: '#DC3545',
  statusActiveBg: '#EDFAF3', statusExpiredBg: '#FFF0F2',
};
const DARK = {
  bg: '#0D1117', surface: '#161B22', surfaceAlt: '#1C2330',
  border: '#2A3340', accent: '#E8192C', accentBg: 'rgba(232,25,44,0.12)',
  primary: '#EDF2F7', secondary: '#8B9BAB', muted: '#5C6E80',
  white: '#FFFFFF', cardShadowOpacity: 0.35,
  statusActive: '#34D399', statusExpired: '#E8192C',
  statusActiveBg: 'rgba(52,211,153,0.12)', statusExpiredBg: 'rgba(232,25,44,0.12)',
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

  // Update when prop changes externally
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
      {/* Front Page */}
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

      {/* Back Page (incoming) */}
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
    fontFamily: 'serif',
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
    fontFamily: 'serif',
    fontSize: fontScale(8),
    color: VINTAGE.inkMuted,
    fontStyle: 'italic',
  },
});

// ─── VintageNewspaperModal ────────────────────────────────────────────────────
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
    fontFamily: 'serif',
    fontSize: fontScale(9),
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    color: VINTAGE.inkMuted,
    textAlign: 'center',
    marginVertical: verticalScale(2),
  },
  mastheadTitle: {
    fontFamily: 'serif',
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
    fontFamily: 'serif',
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
    fontFamily: 'serif',
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
    fontFamily: 'serif',
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
    fontFamily: 'serif',
    fontSize: fontScale(9),
    color: VINTAGE.inkMuted,
    letterSpacing: 2.5,
    fontStyle: 'italic',
  },
});

// ─── NewspaperHistory ─────────────────────────────────────────────────────────
const NewspaperHistory = () => {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { getUserNewspapers, deleteNewspaper, getNewspaperById } = useNewspaper();
  const [newspapers, setNewspapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedNewspaper, setSelectedNewspaper] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadNewspapers = async () => {
    try {
      setIsLoading(true);
      const data = await getUserNewspapers();
      setNewspapers(data);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch (error) {
      console.error('Error loading newspapers:', error);
      Alert.alert('Error', 'Failed to load newspaper history');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadNewspapers(); return () => {}; }, []));

  const onRefresh = () => { setRefreshing(true); loadNewspapers(); };

  const handleView = async (id) => {
    setPreviewLoading(true);
    setPreviewVisible(true);
    try {
      const newspaper = await getNewspaperById(id);
      setSelectedNewspaper(newspaper);
    } catch (error) {
      Alert.alert('Error', 'Failed to load newspaper details');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleEdit = (id) => {
    setPreviewVisible(false);
    setSelectedNewspaper(null);
    router.push(`/(owner)/CreateNewspaper?edit=${id}`);
  };

  const handleDelete = (id, title) => {
    Alert.alert('Delete Newspaper', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const result = await deleteNewspaper(id);
          if (result.success) { loadNewspapers(); setPreviewVisible(false); setSelectedNewspaper(null); }
        },
      },
    ]);
  };

  const renderItem = ({ item, index }) => {
    const isExpired = item.status === 'expired' || new Date(item.expiresAt) <= new Date();
    return (
      <Animated.View style={[styles.itemWrapper, {
        opacity: fadeAnim,
        transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20 * (index + 1), 0] }) }],
      }]}>
        <View style={[styles.itemContainer, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={[styles.statusBadge, {
            backgroundColor: isExpired ? C.statusExpiredBg : C.statusActiveBg,
            borderColor: isExpired ? C.statusExpired : C.statusActive,
          }]}>
            <Text style={[styles.statusBadgeText, { color: isExpired ? C.statusExpired : C.statusActive }]}>
              {isExpired ? 'Expired' : 'Active'}
            </Text>
          </View>
          <NewspaperCard newspaper={item} onPress={() => handleView(item._id)} />
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={[styles.actionButton, styles.viewButton]} onPress={() => handleView(item._id)} activeOpacity={0.7}>
              <Ionicons name="eye-outline" size={moderateScale(18)} color={C.accent} />
              <Text style={[styles.actionText, { color: C.accent }]}>View</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.editActionBtn]} onPress={() => handleEdit(item._id)} activeOpacity={0.7}>
              <Ionicons name="create-outline" size={moderateScale(18)} color={C.primary} />
              <Text style={[styles.actionText, { color: C.primary }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.deleteActionBtn]} onPress={() => handleDelete(item._id, item.title)} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={moderateScale(18)} color={C.white} />
              <Text style={[styles.actionText, { color: C.white }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyWrapper}>
      <EmptyState title="No Newspapers Published" message="Start publishing your first newspaper now!"
        icon="newspaper-outline" buttonText="Create Newspaper" onPress={() => router.push('/(owner)/CreateNewspaper')} />
    </View>
  );

  const styles = makeStyles(C);

  if (isLoading) return <Loader message="Loading your newspapers..." />;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={[styles.topStripe, { backgroundColor: C.accent }]} />
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={moderateScale(24)} color={C.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.primary }]}>Newspaper History</Text>
        <TouchableOpacity onPress={loadNewspapers} style={styles.refreshButton} activeOpacity={0.7}>
          <Ionicons name="refresh-outline" size={moderateScale(24)} color={C.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.statsBar, { backgroundColor: C.surfaceAlt, borderBottomColor: C.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: C.primary }]}>{newspapers.length}</Text>
          <Text style={[styles.statLabel, { color: C.muted }]}>Total Published</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: C.accent }]}>{newspapers.filter(n => n.status === 'active').length}</Text>
          <Text style={[styles.statLabel, { color: C.muted }]}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: C.muted }]}>{newspapers.filter(n => n.status === 'expired').length}</Text>
          <Text style={[styles.statLabel, { color: C.muted }]}>Expired</Text>
        </View>
      </View>

      <FlatList
        data={newspapers}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} colors={[C.accent]} />}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
      />

      <Modal visible={previewLoading} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(10,6,2,0.6)' }}>
          <View style={{ backgroundColor: VINTAGE.paper, padding: scale(24), borderRadius: scale(4), alignItems: 'center', gap: verticalScale(10) }}>
            <ActivityIndicator size="large" color={VINTAGE.accent} />
            <Text style={{ fontFamily: 'serif', fontSize: fontScale(13), color: VINTAGE.ink, letterSpacing: 1 }}>Loading edition…</Text>
          </View>
        </View>
      </Modal>

      <VintageNewspaperModal
        visible={previewVisible && !previewLoading && !!selectedNewspaper}
        newspaper={selectedNewspaper}
        onClose={() => { setPreviewVisible(false); setSelectedNewspaper(null); }}
      />
    </SafeAreaView>
  );
};

const makeStyles = (C) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  topStripe: { height: verticalScale(3) },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(16), paddingVertical: verticalScale(12), borderBottomWidth: 1, minHeight: verticalScale(56) },
  backButton: { padding: scale(6) },
  headerTitle: { fontSize: fontScale(18), fontWeight: '700', letterSpacing: -0.3, flex: 1, textAlign: 'center' },
  refreshButton: { padding: scale(6) },
  statsBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: verticalScale(12), paddingHorizontal: scale(16), borderBottomWidth: 1 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: fontScale(20), fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: fontScale(11), fontWeight: '500', marginTop: verticalScale(2) },
  statDivider: { width: 1, backgroundColor: C.border },
  listContent: { padding: scale(16), paddingBottom: verticalScale(30), flexGrow: 1 },
  itemWrapper: { marginBottom: verticalScale(16) },
  itemContainer: { borderRadius: scale(14), borderWidth: 1, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: scale(2) }, shadowOpacity: C.cardShadowOpacity, shadowRadius: scale(8), elevation: 2 },
  statusBadge: { position: 'absolute', top: scale(12), right: scale(12), paddingHorizontal: scale(10), paddingVertical: verticalScale(4), borderRadius: scale(6), borderWidth: 1, zIndex: 10 },
  statusBadgeText: { fontSize: fontScale(10), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  actionsContainer: { flexDirection: 'row', justifyContent: 'flex-end', padding: scale(12), paddingTop: 0, gap: scale(8) },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(12), paddingVertical: verticalScale(6), borderRadius: scale(8), gap: scale(4) },
  viewButton: { backgroundColor: C.accentBg, borderWidth: 1, borderColor: C.accent + '40' },
  editActionBtn: { backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border },
  deleteActionBtn: { backgroundColor: C.accent },
  actionText: { fontSize: fontScale(11), fontWeight: '600' },
  emptyWrapper: { flex: 1, justifyContent: 'center', paddingTop: verticalScale(40) },
});

export default NewspaperHistory;