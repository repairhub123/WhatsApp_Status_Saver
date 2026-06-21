import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, RefreshControl, Dimensions, ActivityIndicator, Animated, Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Trash2, Share2, Play, Heart, AlertCircle, FileImage, FileVideo, Check } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - (SPACING.lg * 2) - SPACING.md) / 2;

// Staggered entrance animation for grid items
function AnimatedGalleryCard({ children, index }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
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

// Pulsating skeleton item loader
function SkeletonGalleryCard() {
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

export default function SavedGalleryScreen({ active, onSelectMedia }) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [assets, setAssets] = useState([]);
  const [hasPermission, setHasPermission] = useState(null);
  
  // Local notification state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [deletingId, setDeletingId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type }), 2500);
  };

  const checkPermissionsAndLoad = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status !== 'granted') {
        setAssets([]);
        return;
      }

      const album = await MediaLibrary.getAlbumAsync('StatusSaver');
      
      if (!album) {
        setAssets([]);
        return;
      }

      const mediaAssets = await MediaLibrary.getAssetsAsync({
        albumId: album.id,
        first: 100,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]]
      });

      const mapped = mediaAssets.assets.map(asset => ({
        id: asset.id,
        uri: asset.uri,
        name: asset.filename,
        type: asset.mediaType === 'video' ? 'video' : 'photo',
        duration: asset.duration
      }));

      setAssets(mapped);
    } catch (error) {
      console.error('Error fetching saved gallery assets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (active) {
      checkPermissionsAndLoad();
    }
  }, [active, checkPermissionsAndLoad]);

  // Direct delete from gallery card
  const handleDirectDelete = async (item) => {
    Alert.alert(
      'Delete Media',
      'Are you sure you want to delete this status from your gallery?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setDeletingId(item.id);
            try {
              const { status } = await MediaLibrary.requestPermissionsAsync();
              if (status !== 'granted') {
                showToast('Storage permission denied.', 'error');
                return;
              }

              await MediaLibrary.deleteAssetsAsync([item.id]);
              showToast('Deleted successfully!');
              
              // Instantly update the local list state
              setAssets(prev => prev.filter(asset => asset.id !== item.id));
            } catch (error) {
              console.error('Error deleting saved status:', error);
              showToast('Failed to delete asset.', 'error');
            } finally {
              setDeletingId(null);
            }
          }
        }
      ]
    );
  };

  // Direct share from gallery card
  const handleDirectShare = async (item) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(item.uri, {
          mimeType: item.type === 'video' ? 'video/mp4' : 'image/jpeg',
          dialogTitle: 'Share Status',
        });
      } else {
        showToast('Sharing is not available on this device.', 'error');
      }
    } catch (error) {
      console.error('Error sharing status:', error);
      showToast('Failed to share file.', 'error');
    }
  };

  const renderItem = ({ item, index }) => {
    const isVideo = item.type === 'video';
    const isCurrentlyDeleting = deletingId === item.id;

    return (
      <AnimatedGalleryCard index={index}>
        <TouchableOpacity 
          style={styles.card} 
          activeOpacity={0.9}
          onPress={() => onSelectMedia(item, true)}
        >
          <Image source={{ uri: item.uri }} style={styles.thumbnail} />

          {isVideo && (
            <View style={styles.videoPlayBadge}>
              <Play size={12} color={COLORS.white} fill={COLORS.white} />
            </View>
          )}

          {/* Quick Info bar */}
          <View style={styles.quickInfoBar}>
            {isVideo ? (
              <FileVideo size={11} color={COLORS.textSecondary} />
            ) : (
              <FileImage size={11} color={COLORS.textSecondary} />
            )}
            <Text style={styles.mediaTypeText}>{isVideo ? 'Video' : 'Photo'}</Text>
          </View>

          {/* Floating Actions Overlaid on Card */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.floatingActionBtn, styles.shareBtn]} 
              onPress={() => handleDirectShare(item)}
              activeOpacity={0.8}
              title="Share saved status"
            >
              <Share2 size={15} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.floatingActionBtn, styles.deleteBtn]} 
              onPress={() => handleDirectDelete(item)}
              activeOpacity={0.8}
              disabled={isCurrentlyDeleting}
              title="Delete saved status"
            >
              {isCurrentlyDeleting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Trash2 size={15} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </AnimatedGalleryCard>
    );
  };

  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.illustrationWrapper}>
          <AlertCircle size={44} color={COLORS.error} />
        </View>
        <Text style={styles.errorText}>Gallery Access Required</Text>
        <Text style={styles.errorDesc}>
          Please grant storage permissions in your device settings to view saved statuses.
        </Text>
        <TouchableOpacity 
          style={styles.retryBtn} 
          onPress={() => checkPermissionsAndLoad()}
          activeOpacity={0.8}
        >
          <Text style={styles.retryBtnText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    // Skeleton cards for gallery loader
    return (
      <View style={styles.centerContainer}>
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonGalleryCard key={`sk-g-${i}`} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={assets}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => checkPermissionsAndLoad(true)}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
            progressBackgroundColor={COLORS.card}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.illustrationWrapper}>
              <Heart size={44} color={COLORS.textMuted} />
              <View style={styles.illustrationPulse} />
            </View>
            <Text style={styles.emptyTitle}>Your gallery is empty</Text>
            <Text style={styles.emptySubtitle}>
              Statuses you save will appear here. Go to the WhatsApp tabs, open a status, and tap "Save to Gallery"!
            </Text>
          </View>
        }
      />

      {/* Action Toast indicator */}
      {toast.visible && (
        <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
          <Check size={16} color={COLORS.white} />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
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
  videoPlayBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(37, 211, 102, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  quickInfoBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  mediaTypeText: {
    color: COLORS.textSecondary,
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
  deleteBtn: {
    backgroundColor: COLORS.error,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
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
  },
  errorText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  errorDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  retryBtnText: {
    color: COLORS.background, // Dark slate contrast
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
