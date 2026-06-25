import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Animated, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shield, FolderOpen, AlertCircle, ArrowRight } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';

// Android SAF folder constants
const WHATSAPP_SAF_URI = 'content://com.android.externalstorage.documents/tree/primary%3AAndroid%2Fmedia%2Fcom.whatsapp%2FWhatsApp%2FMedia%2F.Statuses';
const WHATSAPP_BUSINESS_SAF_URI = 'content://com.android.externalstorage.documents/tree/primary%3AAndroid%2Fmedia%2Fcom.whatsapp.w4b%2FWhatsApp%20Business%2FMedia%2F.Statuses';

export default function StoragePermissionScreen({ onPermissionGranted }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);
  
  const handleRequestPermission = async (isBusiness = false) => {
    try {
      const initialUri = isBusiness ? WHATSAPP_BUSINESS_SAF_URI : WHATSAPP_SAF_URI;
      console.log('Requesting SAF permission for initial URI:', initialUri);
      
      let response;
      try {
        response = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(initialUri);
      } catch (innerError) {
        console.warn('Failed to open SAF picker with initial location, falling back to general folder picker:', innerError);
        // Fall back to opening the general folder picker at root
        response = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      }
      
      if (response && response.directoryUri && response.success) {
        const storageKey = isBusiness ? '@whatsapp_business_uri' : '@whatsapp_standard_uri';
        await AsyncStorage.setItem(storageKey, response.directoryUri);
        await AsyncStorage.setItem('@active_whatsapp_type', isBusiness ? 'business' : 'standard');
        onPermissionGranted(response.directoryUri, isBusiness ? 'business' : 'standard');
      } else {
        Alert.alert(
          'Permission Required',
          'You must select the folder and grant permission for the app to read statuses. Please click the button again and click "Use this folder".'
        );
      }
    } catch (error) {
      console.error('Fatal error requesting SAF directory permission:', error);
      Alert.alert(
        'System Picker Error',
        'Could not launch the Android folder picker. Please ensure your device has a files manager app installed.'
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <FolderOpen size={44} color={COLORS.primary} />
        </Animated.View>
        <Text style={styles.title}>Access Required</Text>
        <Text style={styles.subtitle}>
          To load WhatsApp statuses, Android requires permission to read the hidden folder where WhatsApp caches them.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AlertCircle size={18} color={COLORS.secondary} />
          <Text style={styles.cardTitle}>How to grant access</Text>
        </View>
        
        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View style={styles.stepNumber}><Text style={styles.stepNumText}>1</Text></View>
            <Text style={styles.stepText}>Choose WhatsApp or WhatsApp Business below.</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}><Text style={styles.stepNumText}>2</Text></View>
            <Text style={styles.stepText}>A system folder screen will open automatically.</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}><Text style={styles.stepNumText}>3</Text></View>
            <Text style={styles.stepText}>
              Click <Text style={styles.highlight}>"USE THIS FOLDER"</Text> at the bottom. Do not navigate to other folders.
            </Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}><Text style={styles.stepNumText}>4</Text></View>
            <Text style={styles.stepText}>
              Tap <Text style={styles.highlight}>"Allow"</Text> when prompted.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => handleRequestPermission(false)}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryButtonText}>Use Standard WhatsApp</Text>
          <ArrowRight size={18} color={COLORS.background} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => handleRequestPermission(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Use WhatsApp Business</Text>
          <ArrowRight size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Shield size={14} color={COLORS.textMuted} />
        <Text style={styles.footerText}>
          Your data is 100% safe. This app works fully offline and never uploads your files anywhere.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 84,
    height: 84,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.25)',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.sm,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    paddingBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  stepsContainer: {
    gap: SPACING.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    marginTop: 1,
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  stepText: {
    flex: 1,
    fontSize: 13.5,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  highlight: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  buttonsContainer: {
    width: '100%',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.background, // Slate-900 contrast color
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  footerText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 15,
  },
});
