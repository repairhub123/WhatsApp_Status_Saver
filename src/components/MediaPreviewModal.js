import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, Modal, Image, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { X, Download, Share2, Check, AlertCircle, Trash2 } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { MockInterstitialAd } from '../utils/AdManager';

const { width, height } = Dimensions.get('window');

export default function MediaPreviewModal({ visible, media, onClose, onSaveComplete, isSavedAsset, onDeleteAsset }) {
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [adVisible, setAdVisible] = useState(false);
  const videoRef = useRef(null);

  if (!media) return null;

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type });
    }, 2500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Copy the file from SAF content URI to local cache directory
      const tempLocalUri = `${FileSystem.cacheDirectory}${media.name}`;
      await FileSystem.copyAsync({
        from: media.uri,
        to: tempLocalUri,
      });

      // 2. Request Media Library Permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showToast('Storage permission denied. Please allow gallery access.', 'error');
        setSaving(false);
        return;
      }

      // 3. Save to phone gallery
      const asset = await MediaLibrary.createAssetAsync(tempLocalUri);
      
      // Try to create/add to a custom StatusSaver folder
      const albumName = 'StatusSaver';
      const album = await MediaLibrary.getAlbumAsync(albumName);
      if (album === null) {
        await MediaLibrary.createAlbumAsync(albumName, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      // 4. Delete temp file from cache
      await FileSystem.deleteAsync(tempLocalUri, { idempotent: true });

      // 5. Trigger Interstitial Ad before final success
      setAdVisible(true);
      
      if (onSaveComplete) {
        onSaveComplete(media.uri);
      }
    } catch (error) {
      console.error('Error saving status:', error);
      showToast('Failed to save status. Try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      const tempLocalUri = `${FileSystem.cacheDirectory}${media.name}`;
      
      // Copy to local cache so sharing utility can access the file path
      await FileSystem.copyAsync({
        from: media.uri,
        to: tempLocalUri,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(tempLocalUri, {
          mimeType: media.type === 'video' ? 'video/mp4' : 'image/jpeg',
          dialogTitle: 'Share Status',
        });
      } else {
        showToast('Sharing is not available on this device.', 'error');
      }

      // Clean up cache
      await FileSystem.deleteAsync(tempLocalUri, { idempotent: true });
    } catch (error) {
      console.error('Error sharing status:', error);
      showToast('Failed to share file.', 'error');
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showToast('Storage permission denied.', 'error');
        setSaving(false);
        return;
      }

      // Delete the file using its asset ID from MediaLibrary
      await MediaLibrary.deleteAssetsAsync([media.id]);
      showToast('Deleted successfully!');
      
      if (onDeleteAsset) {
        setTimeout(() => {
          onDeleteAsset(media.id);
          onClose();
        }, 800);
      } else {
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (error) {
      console.error('Error deleting saved status:', error);
      showToast('Failed to delete asset.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isVideo = media.type === 'video';

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Control Bar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose} disabled={saving}>
            <X size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{media.name || 'Preview'}</Text>
          <View style={{ width: 40 }} /> {/* Spacer */}
        </View>

        {/* Media Preview Area */}
        <View style={styles.mediaContainer}>
          {isVideo ? (
            <Video
              ref={videoRef}
              source={{ uri: media.uri }}
              rate={1.0}
              volume={1.0}
              isMuted={false}
              resizeMode="contain"
              shouldPlay={true}
              useNativeControls
              style={styles.videoPlayer}
            />
          ) : (
            <ScrollView
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.imageScrollContainer}
            >
              <Image source={{ uri: media.uri }} style={styles.image} resizeMode="contain" />
            </ScrollView>
          )}
        </View>

        {/* Floating Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.shareBtn]} 
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Share2 size={20} color={COLORS.textPrimary} />
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>

          {isSavedAsset ? (
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteBtn]} 
              onPress={handleDelete}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Trash2 size={20} color={COLORS.white} />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.saveBtn]} 
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <>
                  <Download size={20} color={COLORS.background} />
                  <Text style={styles.saveBtnText}>Save to Gallery</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Beautiful Toast Notification */}
        {toast.visible && (
          <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
            {toast.type === 'error' ? (
              <AlertCircle size={18} color={COLORS.white} />
            ) : (
              <Check size={18} color={COLORS.white} />
            )}
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    maxWidth: width - 100,
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageScrollContainer: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height - 160,
  },
  videoPlayer: {
    width: width,
    height: height - 160,
  },
  footer: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: SPACING.xl,
    right: SPACING.xl,
    flexDirection: 'row',
    gap: SPACING.md,
    zIndex: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    shadowColor: COLORS.black,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  shareBtn: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
  },
  deleteBtn: {
    backgroundColor: COLORS.error,
    shadowColor: COLORS.error,
    shadowOpacity: 0.2,
  },
  actionBtnText: {
    color: COLORS.textPrimary,
    fontSize: 14.5,
    fontWeight: '700',
  },
  saveBtnText: {
    color: COLORS.background, // Slate-900 contrast color
    fontSize: 14.5,
    fontWeight: '800',
  },
  deleteBtnText: {
    color: COLORS.white,
    fontSize: 14.5,
    fontWeight: '700',
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: SPACING.xl,
    right: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    shadowColor: COLORS.black,
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    fontSize: 13.5,
    fontWeight: '600',
  },
});
