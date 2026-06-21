import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Share, Alert, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Smartphone, ShieldAlert, Share2, Trash2, Shield, Info, Database, ChevronRight } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';

export default function SettingsScreen({ 
  whatsappType, 
  onSwitchWhatsappType, 
  onResetPermissions, 
  directoryUri 
}) {
  const [clearingCache, setClearingCache] = useState(false);

  const handleShareApp = async () => {
    try {
      await Share.share({
        title: 'WhatsApp Status Saver',
        message: 'Hey! Check out this premium WhatsApp Status Saver app. It lets you download, preview, and share cached WhatsApp statuses offline instantly: https://github.com/repairhub123/WhatsApp_Status_Saver',
      });
    } catch (error) {
      console.error('Error sharing app:', error);
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const files = await FileSystem.readDirectoryAsync(cacheDir);
        let deletedCount = 0;
        for (const file of files) {
          // Only clear temporary media cache, don't delete system files
          if (file.match(/\.(jpg|jpeg|png|mp4|3gp|mkv)$/i) || file.startsWith('Statuses')) {
            await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
            deletedCount++;
          }
        }
        Alert.alert('Success', `Cleared ${deletedCount} cached temporary files.`);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      Alert.alert('Error', 'Failed to clear cache.');
    } finally {
      setClearingCache(false);
    }
  };

  const handleShowPrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'Offline Protection: This app works 100% offline. We do not collect, store, or transmit any of your personal data, media files, or WhatsApp details. All cached files remain stored securely on your local device storage.',
      [{ text: 'Close', style: 'cancel' }]
    );
  };

  const getDecodedUri = () => {
    if (!directoryUri) return 'No directory selected';
    try {
      const decoded = decodeURIComponent(directoryUri);
      return decoded.split('primary:').pop() || decoded;
    } catch (e) {
      return 'Active Directory';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* section: WhatsApp configuration */}
      <Text style={styles.sectionHeader}>WhatsApp Settings</Text>
      
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.settingItem} 
          onPress={onSwitchWhatsappType}
          activeOpacity={0.7}
        >
          <View style={styles.settingItemLeft}>
            <View style={[styles.iconWrapper, { backgroundColor: COLORS.primaryLight }]}>
              <Smartphone size={20} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.settingLabel}>WhatsApp Source</Text>
              <Text style={styles.settingSublabel}>
                Currently: {whatsappType === 'business' ? 'WhatsApp Business' : 'Standard WhatsApp'}
              </Text>
            </View>
          </View>
          <View style={styles.settingItemRight}>
            <Text style={styles.badgeText}>Switch</Text>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity 
          style={styles.settingItem} 
          onPress={() => {
            Alert.alert(
              'Reset Access Permissions',
              'This will reset your folder selection access. You will be prompted to select your WhatsApp status folder again.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: onResetPermissions }
              ]
            );
          }}
          activeOpacity={0.7}
        >
          <View style={styles.settingItemLeft}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <ShieldAlert size={20} color={COLORS.error} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Reset Folder Access</Text>
              <Text style={styles.settingSublabel}>Revoke current storage permission</Text>
            </View>
          </View>
          <ChevronRight size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* section: storage stats */}
      <Text style={styles.sectionHeader}>Storage & Cache</Text>
      
      <View style={styles.card}>
        <View style={styles.settingInfoItem}>
          <View style={styles.settingItemLeft}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Database size={20} color={COLORS.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Storage Location</Text>
              <Text style={styles.settingSublabel} numberOfLines={2}>
                {getDecodedUri()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity 
          style={styles.settingItem} 
          onPress={handleClearCache}
          disabled={clearingCache}
          activeOpacity={0.7}
        >
          <View style={styles.settingItemLeft}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
              {clearingCache ? (
                <ActivityIndicator size="small" color={COLORS.textSecondary} />
              ) : (
                <Trash2 size={20} color={COLORS.textSecondary} />
              )}
            </View>
            <View>
              <Text style={styles.settingLabel}>Clear Temporary Cache</Text>
              <Text style={styles.settingSublabel}>Delete cached preview files to free space</Text>
            </View>
          </View>
          <ChevronRight size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* section: general app settings */}
      <Text style={styles.sectionHeader}>App & Community</Text>
      
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.settingItem} 
          onPress={handleShareApp}
          activeOpacity={0.7}
        >
          <View style={styles.settingItemLeft}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
              <Share2 size={20} color={COLORS.textPrimary} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Share App</Text>
              <Text style={styles.settingSublabel}>Share status saver with friends</Text>
            </View>
          </View>
          <ChevronRight size={16} color={COLORS.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity 
          style={styles.settingItem} 
          onPress={handleShowPrivacyPolicy}
          activeOpacity={0.7}
        >
          <View style={styles.settingItemLeft}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
              <Shield size={20} color={COLORS.textPrimary} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
              <Text style={styles.settingSublabel}>Offline privacy guarantee</Text>
            </View>
          </View>
          <ChevronRight size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* app details footer */}
      <View style={styles.footerContainer}>
        <View style={styles.logoRow}>
          <Info size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={styles.footerLogoText}>STATUS SAVER PRO</Text>
        </View>
        <Text style={styles.footerVersionText}>Version 1.0.0</Text>
        <Text style={styles.footerCopyrightText}>Open Source. Fully Offline.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: 90, // Leave room for banner ad
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    paddingLeft: SPACING.xs,
  },
  card: {
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
    marginBottom: SPACING.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
  },
  settingInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  settingSublabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: SPACING.lg,
  },
  footerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xxl,
    marginBottom: SPACING.lg,
    opacity: 0.7,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  footerLogoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  footerVersionText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  footerCopyrightText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
