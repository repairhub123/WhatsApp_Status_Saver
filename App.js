import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar, Platform, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Home as HomeIcon, FolderHeart, Settings as SettingsIcon, RefreshCw, Smartphone } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from './src/theme';
import StoragePermissionScreen from './src/components/StoragePermissionScreen';
import StatusGrid from './src/components/StatusGrid';
import SavedGalleryScreen from './src/components/SavedGalleryScreen';
import SettingsScreen from './src/components/SettingsScreen';
import MediaPreviewModal from './src/components/MediaPreviewModal';
import { MockBannerAd } from './src/utils/AdManager';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'saved' | 'settings'
  const [homeSubTab, setHomeSubTab] = useState('photos'); // 'photos' | 'videos' (sub-tabs under Home)
  const [whatsappType, setWhatsappType] = useState('standard'); // 'standard' | 'business'
  const [directoryUri, setDirectoryUri] = useState(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusCount, setStatusCount] = useState(0);
  
  // Fullscreen Preview state
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isSavedAsset, setIsSavedAsset] = useState(false);
  
  // Refresh key to force re-render components on actions (like saving/deleting)
  const [refreshKey, setRefreshKey] = useState(0);

  // Animations
  const refreshSpinValue = useRef(new Animated.Value(0)).current;

  // Helper to fetch status file count
  const updateStatusCount = async (uri = directoryUri) => {
    if (!uri) {
      setStatusCount(0);
      return;
    }
    try {
      const fileUris = await FileSystem.StorageAccessFramework.readDirectoryAsync(uri);
      const count = fileUris.filter(fileUri => {
        const decoded = decodeURIComponent(fileUri);
        return decoded.match(/\.(jpg|jpeg|png|mp4|3gp|mkv)$/i);
      }).length;
      setStatusCount(count);
    } catch (e) {
      console.log('Error counting statuses:', e);
      setStatusCount(0);
    }
  };

  // Check stored folder permissions on launch
  useEffect(() => {
    const checkSavedPermissions = async () => {
      try {
        const storedType = await AsyncStorage.getItem('@active_whatsapp_type') || 'standard';
        setWhatsappType(storedType);
        
        const storageKey = storedType === 'business' ? '@whatsapp_business_uri' : '@whatsapp_standard_uri';
        const storedUri = await AsyncStorage.getItem(storageKey);
        
        if (storedUri) {
          try {
            await FileSystem.StorageAccessFramework.readDirectoryAsync(storedUri);
            setDirectoryUri(storedUri);
            setPermissionsGranted(true);
            updateStatusCount(storedUri);
          } catch (e) {
            console.log('Revoked SAF permission or directory not accessible:', e);
            await AsyncStorage.removeItem(storageKey);
            setPermissionsGranted(false);
          }
        }
      } catch (error) {
        console.error('Error reading stored permissions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkSavedPermissions();
  }, [refreshKey]);

  const handlePermissionGranted = (uri, type) => {
    setDirectoryUri(uri);
    setWhatsappType(type);
    setPermissionsGranted(true);
    updateStatusCount(uri);
  };

  const handleSwitchWhatsappType = async () => {
    const nextType = whatsappType === 'standard' ? 'business' : 'standard';
    setLoading(true);
    
    try {
      const storageKey = nextType === 'business' ? '@whatsapp_business_uri' : '@whatsapp_standard_uri';
      const storedUri = await AsyncStorage.getItem(storageKey);
      
      await AsyncStorage.setItem('@active_whatsapp_type', nextType);
      setWhatsappType(nextType);
      
      if (storedUri) {
        try {
          await FileSystem.StorageAccessFramework.readDirectoryAsync(storedUri);
          setDirectoryUri(storedUri);
          setPermissionsGranted(true);
          updateStatusCount(storedUri);
        } catch (e) {
          setDirectoryUri(null);
          setPermissionsGranted(false);
          setStatusCount(0);
        }
      } else {
        setDirectoryUri(null);
        setPermissionsGranted(false);
        setStatusCount(0);
      }
    } catch (error) {
      console.error('Error switching WhatsApp type:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPermissions = async () => {
    try {
      await AsyncStorage.removeItem('@whatsapp_standard_uri');
      await AsyncStorage.removeItem('@whatsapp_business_uri');
      await AsyncStorage.removeItem('@active_whatsapp_type');
      setDirectoryUri(null);
      setPermissionsGranted(false);
      setWhatsappType('standard');
      setStatusCount(0);
      setActiveTab('home');
    } catch (e) {
      console.error('Error resetting permissions:', e);
    }
  };

  const handleSelectMedia = (media, isSaved = false) => {
    setSelectedMedia(media);
    setIsSavedAsset(isSaved);
  };

  const handleMediaActionComplete = () => {
    // Force refresh components
    setRefreshKey(prev => prev + 1);
  };

  const handleManualRefresh = () => {
    // Spin animation
    refreshSpinValue.setValue(0);
    Animated.timing(refreshSpinValue, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();

    // Trigger state refresh
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <Text style={styles.splashLogo}>STATUS<Text style={{ color: COLORS.primary }}>SAVER</Text></Text>
        <Text style={styles.splashSublogo}>PRO EDITION</Text>
      </View>
    );
  }

  // Interpolation for refresh spin animation
  const refreshSpin = refreshSpinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.card} />
      
      {/* Premium Header bar */}
      <View style={styles.header}>
        <View>
          <View style={styles.logoRow}>
            <Text style={styles.appTitle}>STATUS</Text>
            <Text style={[styles.appTitle, { color: COLORS.primary }]}>SAVER</Text>
          </View>
          <Text style={styles.appSub}>
            {whatsappType === 'business' ? 'WhatsApp Business' : 'Standard WhatsApp'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {permissionsGranted && activeTab === 'home' && (
            <>
              {/* Dynamic status count badge */}
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{statusCount} cached</Text>
              </View>

              <TouchableOpacity 
                style={styles.headerIconBtn} 
                onPress={handleManualRefresh}
                title="Refresh Statuses"
                activeOpacity={0.8}
              >
                <Animated.View style={{ transform: [{ rotate: refreshSpin }] }}>
                  <RefreshCw size={18} color={COLORS.textPrimary} />
                </Animated.View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {!permissionsGranted ? (
          <StoragePermissionScreen onPermissionGranted={handlePermissionGranted} />
        ) : (
          <>
            {/* HOME Tab (with nested sub-tabs) */}
            {activeTab === 'home' && (
              <View style={{ flex: 1 }}>
                {/* Segmented Top selector tabs */}
                <View style={styles.topTabBar}>
                  <TouchableOpacity 
                    style={[styles.topTabItem, homeSubTab === 'photos' && styles.topTabItemActive]} 
                    onPress={() => setHomeSubTab('photos')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.topTabLabel, homeSubTab === 'photos' && styles.topTabLabelActive]}>Photos</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.topTabItem, homeSubTab === 'videos' && styles.topTabItemActive]} 
                    onPress={() => setHomeSubTab('videos')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.topTabLabel, homeSubTab === 'videos' && styles.topTabLabelActive]}>Videos</Text>
                  </TouchableOpacity>
                </View>

                {homeSubTab === 'photos' ? (
                  <StatusGrid 
                    key={`photos-${whatsappType}-${refreshKey}`}
                    directoryUri={directoryUri} 
                    mediaType="photo" 
                    onSelectMedia={handleSelectMedia}
                  />
                ) : (
                  <StatusGrid 
                    key={`videos-${whatsappType}-${refreshKey}`}
                    directoryUri={directoryUri} 
                    mediaType="video" 
                    onSelectMedia={handleSelectMedia}
                  />
                )}
              </View>
            )}
            
            {/* SAVED GALLERY Tab */}
            {activeTab === 'saved' && (
              <SavedGalleryScreen 
                key={`saved-${refreshKey}`}
                active={activeTab === 'saved'} 
                onSelectMedia={handleSelectMedia}
              />
            )}

            {/* SETTINGS Tab */}
            {activeTab === 'settings' && (
              <SettingsScreen
                whatsappType={whatsappType}
                onSwitchWhatsappType={handleSwitchWhatsappType}
                onResetPermissions={handleResetPermissions}
                directoryUri={directoryUri}
              />
            )}
          </>
        )}
      </View>

      {/* Modern bottom navigation tabs */}
      {permissionsGranted && (
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'home' && styles.tabItemActive]}
            onPress={() => setActiveTab('home')}
            activeOpacity={0.8}
          >
            <View style={styles.tabIconWrapper}>
              <HomeIcon size={20} color={activeTab === 'home' ? COLORS.primary : COLORS.textSecondary} />
              {activeTab === 'home' && <View style={styles.activeTabDot} />}
            </View>
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'saved' && styles.tabItemActive]}
            onPress={() => setActiveTab('saved')}
            activeOpacity={0.8}
          >
            <View style={styles.tabIconWrapper}>
              <FolderHeart size={20} color={activeTab === 'saved' ? COLORS.primary : COLORS.textSecondary} />
              {activeTab === 'saved' && <View style={styles.activeTabDot} />}
            </View>
            <Text style={[styles.tabLabel, activeTab === 'saved' && styles.tabLabelActive]}>Saved</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'settings' && styles.tabItemActive]}
            onPress={() => setActiveTab('settings')}
            activeOpacity={0.8}
          >
            <View style={styles.tabIconWrapper}>
              <SettingsIcon size={20} color={activeTab === 'settings' ? COLORS.primary : COLORS.textSecondary} />
              {activeTab === 'settings' && <View style={styles.activeTabDot} />}
            </View>
            <Text style={[styles.tabLabel, activeTab === 'settings' && styles.tabLabelActive]}>Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Inline Bottom Mock Banner Ad */}
      {permissionsGranted && <MockBannerAd />}

      {/* Fullscreen Lightbox Media Preview */}
      <MediaPreviewModal 
        visible={!!selectedMedia}
        media={selectedMedia}
        isSavedAsset={isSavedAsset}
        onClose={() => setSelectedMedia(null)}
        onSaveComplete={handleMediaActionComplete}
        onDeleteAsset={handleMediaActionComplete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 4,
  },
  splashSublogo: {
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 6,
    marginTop: SPACING.xs,
    fontWeight: 'bold',
    opacity: 0.8,
  },
  header: {
    height: 68,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  appSub: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  countBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.2)',
  },
  countBadgeText: {
    fontSize: 10.5,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  content: {
    flex: 1,
  },
  topTabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    padding: 4,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  topTabItem: {
    flex: 1,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  topTabItemActive: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  topTabLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  topTabLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  tabBar: {
    height: 64,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 2,
    position: 'absolute',
    bottom: 60, // Sits above banner ad
    left: 0,
    right: 0,
    zIndex: 90,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
  },
  tabItemActive: {
    opacity: 1,
  },
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  activeTabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    bottom: -6,
  },
  tabLabel: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});
