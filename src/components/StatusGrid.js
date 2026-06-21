import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, RefreshControl, Dimensions, ActivityIndicator, Animated } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Play, FileVideo, Eye, RefreshCw, AlertCircle, Download, Share2, Check } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { MockNativeAdCard, MockInterstitialAd } from '../utils/AdManager';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - (SPACING.lg * 2) - SPACING.md) / 2;

// High-performance Animated Card wrapper for entrance animations
function AnimatedGridCard({ children, index }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    // Staggered entrance animation based on grid index
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: Math.min(index * 40, 400),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: Math.min(index * 40, 400),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], width: COLUMN_WIDTH }}>
      {children}
    </Animated.View>
  );
}

// Pulsating Skeleton card loader
function SkeletonGridCard() {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity: pulseAnim }]} />
  );
}

export default function StatusGrid({ directoryUri, mediaType, onSelectMedia }) {
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Save / Share States
  const [savingUri, setSavingUri] = useState(null);
  const [adVisible, setAdVisible] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type });
    }, 2500);
  };

  const loadStatuses = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMsg('');

    try {
      if (!directoryUri) {
        setErrorMsg('No folder selected');
        setStatuses([]);
        return;
      }

      const fileUris = await FileSystem.StorageAccessFramework.readDirectoryAsync(directoryUri);
      
      const loadedMedia = fileUris
        .map(uri => {
          const decoded = decodeURIComponent(uri);
          const name = decoded.split('/').pop();
          
          let type = null;
          if (decoded.match(/\.(jpg|jpeg|png)$/i)) {
            type = 'photo';
          } else if (decoded.match(/\.(mp4|3gp|mkv)$/i)) {
            type = 'video';
          }

          return { uri, name, type };
        })
        .filter(item => item.type === mediaType);

      // Show latest cached items first
      loadedMedia.reverse();
      setStatuses(loadedMedia);
    } catch (err) {
      console.error('Error loading statuses:', err);
      setErrorMsg('Failed to read WhatsApp directory. Try re-granting access.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [directoryUri, mediaType]);

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  // Direct Save from grid card
  const handleDirectSave = async (item) => {
    setSavingUri(item.uri);
    try {
      const tempLocalUri = `${FileSystem.cacheDirectory}${item.name}`;
      await FileSystem.copyAsync({
        from: item.uri,
        to: tempLocalUri,
      });

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showToast('Storage permission denied. Please allow gallery access.', 'error');
        setSavingUri(null);
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(tempLocalUri);
      const albumName = 'StatusSaver';
      const album = await MediaLibrary.getAlbumAsync(albumName);
      if (album === null) {
        await MediaLibrary.createAlbumAsync(albumName, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      await FileSystem.deleteAsync(tempLocalUri, { idempotent: true });
      
      // Trigger Interstitial Ad
      setAdVisible(true);
    } catch (error) {
      console.error('Error saving status directly:', error);
      showToast('Failed to save status. Try again.', 'error');
    } finally {
      setSavingUri(null);
    }
  };

  // Direct Share from grid card
  const handleDirectShare = async (item) => {
    try {
      const tempLocalUri = `${FileSystem.cacheDirectory}${item.name}`;
      await FileSystem.copyAsync({
        from: item.uri,
        to: tempLocalUri,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(tempLocalUri, {
          mimeType: item.type === 'video' ? 'video/mp4' : 'image/jpeg',
          dialogTitle: 'Share Status',
        });
      } else {
        showToast('Sharing is not available on this device.', 'error');
      }

      await FileSystem.deleteAsync(tempLocalUri, { idempotent: true });
    } catch (error) {
      console.error('Error sharing status directly:', error);
      showToast('Failed to share file.', 'error');
    }
  };

  // Insert mock native ads into the grid list
  const getGridData = () => {
    const listData = [];
    statuses.forEach((item, index) => {
      listData.push({ id: `media-${index}`, index, ...item });
      if ((index + 1) % 5 === 0) {
        listData.push({ id: `ad-${index}`, isAd: true });
      }
    });
    return listData;
  };

  const renderItem = ({ item }) => {
    if (item.isAd) {
      return (
        <View style={styles.cardContainer}>
          <MockNativeAdCard />
        </View>
      );
    }

    const isVideo = item.type === 'video';
    const isCurrentlySaving = savingUri === item.uri;

    return (
      <AnimatedGridCard index={item.index}>
        <TouchableOpacity 
          style={styles.card} 
          activeOpacity={0.9}
          onPress={() => onSelectMedia(item)}
        >
          {isVideo ? (
            <View style={styles.videoThumbnailContainer}>
              <View style={styles.videoInfoWrapper}>
                <FileVideo size={36} color={COLORS.secondary} style={styles.videoIcon} />
                <Text style={styles.videoNameText} numberOfLines={1}>
                  {item.name || 'WhatsApp Video'}
                </Text>
              </View>
              <View style={styles.videoPlayBadge}>
                <Play size={12} color={COLORS.white} fill={COLORS.white} />
              </View>
            </View>
          ) : (
            <Image source={{ uri: item.uri }} style={styles.thumbnail} />
          )}

          {/* Quick Info bar / Preview hover */}
          <View style={styles.infoOverlay}>
            <Eye size={12} color={COLORS.textPrimary} />
            <Text style={styles.overlayText}>Preview</Text>
          </View>

          {/* Floating Actions Overlaid on Card */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.floatingActionBtn, styles.shareBtn]} 
              onPress={() => handleDirectShare(item)}
              activeOpacity={0.8}
              title="Share status"
            >
              <Share2 size={15} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.floatingActionBtn, styles.saveBtn]} 
              onPress={() => handleDirectSave(item)}
              activeOpacity={0.8}
              disabled={isCurrentlySaving}
              title="Save status"
            >
              {isCurrentlySaving ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Download size={15} color={COLORS.background} />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </AnimatedGridCard>
    );
  };

  if (loading) {
    // Modern Skeleton grid cards
    return (
      <View style={styles.centerContainer}>
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonGridCard key={`sk-${i}`} />
          ))}
        </View>
      </View>
    );
  }

  const gridData = getGridData();

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={gridData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadStatuses(true)}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
            progressBackgroundColor={COLORS.card}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.illustrationWrapper}>
              <AlertCircle size={44} color={COLORS.textMuted} />
              <View style={styles.illustrationPulse} />
            </View>
            <Text style={styles.emptyTitle}>No cached {mediaType}s found</Text>
            <Text style={styles.emptySubtitle}>
              To see statuses here, you must first view them inside the official WhatsApp app, then pull down to refresh.
            </Text>
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={() => loadStatuses(true)}
              activeOpacity={0.8}
            >
              <RefreshCw size={15} color={COLORS.background} />
              <Text style={styles.refreshButtonText}>Refresh Now</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Direct actions toast indicator */}
      {toast.visible && (
        <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
          <Check size={16} color={COLORS.white} />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* Simulated Interstitial Ad Overlay */}
      <MockInterstitialAd 
        visible={adVisible} 
        onClose={() => {
          setAdVisible(false);
          showToast('Saved to StatusSaver album!');
        }} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  skeletonCard: {
    width: COLUMN_WIDTH,
    height: 220,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  listContainer: {
    padding: SPACING.lg,
    paddingBottom: 90, // Room for banner ad
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  cardContainer: {
    width: COLUMN_WIDTH,
  },
  card: {
    width: COLUMN_WIDTH,
    height: 220,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoThumbnailContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0F162A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  videoInfoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  videoIcon: {
    marginBottom: SPACING.xs,
    opacity: 0.8,
  },
  videoPlayBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(37, 211, 102, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  videoNameText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  overlayText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  actionsContainer: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    gap: SPACING.xs,
    alignItems: 'center',
  },
  floatingActionBtn: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  shareBtn: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: SPACING.xl,
  },
  illustrationWrapper: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  illustrationPulse: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.xl,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  refreshButtonText: {
    color: COLORS.background, // Dark slate text for green button contrast
    fontSize: 14,
    fontWeight: '800',
  },
  toast: {
    position: 'absolute',
    bottom: 80,
    left: SPACING.xl,
    right: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    shadowColor: COLORS.black,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 100,
  },
  toastSuccess: {
    backgroundColor: COLORS.success,
  },
  toastError: {
    backgroundColor: COLORS.error,
  },
  toastText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
