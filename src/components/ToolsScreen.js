import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Linking, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { MessageSquare, Share2, Scissors, Lock, Image, Sparkles, AlertCircle } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';

const COUNTRIES = [
  { code: '+91', name: 'India' },
  { code: '+1', name: 'USA' },
  { code: '+44', name: 'UK' },
  { code: '+61', name: 'Australia' },
  { code: '+971', name: 'UAE' },
  { code: '+92', name: 'Pakistan' },
];

export default function ToolsScreen() {
  const [code, setCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');

  const handleOpenChat = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 6) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number with at least 6 digits.');
      return;
    }
    const full = `${code.replace('+', '')}${cleaned}`;
    const text = encodeURIComponent(msg.trim());
    const url = text
      ? `whatsapp://send?phone=${full}&text=${text}`
      : `whatsapp://send?phone=${full}`;
      
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://wa.me/${full}${text ? `?text=${text}` : ''}`);
      }
    } catch (error) {
      console.error('Error opening WhatsApp chat:', error);
      Alert.alert('Error', 'Could not open WhatsApp on this device.');
    }
  };

  const handleClear = () => {
    setPhone('');
    setMsg('');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionHeader}>WhatsApp Quick Tools</Text>

        {/* Direct Chat Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrapper, { backgroundColor: COLORS.primaryLight }]}>
              <MessageSquare size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Direct Chat</Text>
              <Text style={styles.cardSub}>Message any WhatsApp number without saving it to your contacts.</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Country code chips */}
          <View style={styles.chipsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {COUNTRIES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  onPress={() => setCode(c.code)}
                  style={[styles.chip, code === c.code && styles.chipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, code === c.code && styles.chipTextActive]}>
                    {c.code} ({c.name})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Inputs */}
          <View style={styles.formContainer}>
            <View style={styles.inputRow}>
              <View style={styles.codeBox}>
                <Text style={styles.codeBoxText}>{code}</Text>
              </View>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="Phone number"
                placeholderTextColor={COLORS.textSecondary}
                style={styles.input}
              />
            </View>

            <TextInput
              value={msg}
              onChangeText={setMsg}
              placeholder="Message (optional)"
              placeholderTextColor={COLORS.textSecondary}
              style={[styles.input, styles.msgInput]}
              multiline
              numberOfLines={3}
            />

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={handleOpenChat}
                activeOpacity={0.8}
              >
                <Text style={styles.btnPrimaryText}>Open Chat</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={handleClear}
                activeOpacity={0.8}
              >
                <Text style={styles.btnSecondaryText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* More Tools Grid */}
        <Text style={styles.sectionHeader}>More Features</Text>
        <View style={styles.grid}>
          <TouchableOpacity 
            style={styles.tile} 
            activeOpacity={0.7}
            onPress={() => Alert.alert('Repost status', 'Open statuses list from Home tab, click on any image/video status, and use the Share button to post it directly on your WhatsApp Status.')}
          >
            <View style={[styles.tileIcon, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
              <Share2 size={20} color={COLORS.secondary} />
            </View>
            <Text style={styles.tileTitle}>Quick Repost</Text>
            <Text style={styles.tileSub}>Post status updates directly to your own status</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.tile} 
            activeOpacity={0.7}
            onPress={() => Alert.alert('HD Photos', 'Go to settings and select Standard or Business WhatsApp as source to fetch full high-definition status photos.')}
          >
            <View style={[styles.tileIcon, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
              <Sparkles size={20} color="#A855F7" />
            </View>
            <Text style={styles.tileTitle}>HD Photos</Text>
            <Text style={styles.tileSub}>Save full high-resolution pictures to gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tile, styles.tileDisabled]} 
            activeOpacity={0.9}
            onPress={() => Alert.alert('Coming Soon', 'Video Trimmer feature is in active development and will be released in the next update.')}
          >
            <View style={[styles.tileIcon, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
              <Scissors size={20} color={COLORS.textMuted} />
            </View>
            <Text style={[styles.tileTitle, styles.tileTitleDisabled]}>Video Trimmer</Text>
            <Text style={styles.tileSub}>Split long status videos into 30s clips</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Soon</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tile, styles.tileDisabled]} 
            activeOpacity={0.9}
            onPress={() => Alert.alert('Coming Soon', 'Locker feature is coming in the next build to password-protect your saved statuses.')}
          >
            <View style={[styles.tileIcon, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
              <Lock size={20} color={COLORS.textMuted} />
            </View>
            <Text style={[styles.tileTitle, styles.tileTitleDisabled]}>Locker</Text>
            <Text style={styles.tileSub}>Secure and hide your saved media files</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Soon</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: 100, // Leave room for banner ad
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
    padding: SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.md,
  },
  chipsContainer: {
    marginBottom: SPACING.md,
  },
  chipsRow: {
    gap: SPACING.xs,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.background,
    fontWeight: '700',
  },
  formContainer: {
    gap: SPACING.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  codeBox: {
    paddingHorizontal: SPACING.md,
    height: 48,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  codeBoxText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    height: 48,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
    fontWeight: '600',
  },
  msgInput: {
    height: 80,
    paddingTop: 10,
    paddingBottom: 10,
    textAlignVertical: 'top',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  btnRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  btn: {
    height: 46,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    flex: 2,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  btnPrimaryText: {
    color: COLORS.background,
    fontWeight: '800',
    fontSize: 14,
  },
  btnSecondary: {
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    flex: 1,
    backgroundColor: 'transparent',
  },
  btnSecondaryText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  tile: {
    width: '47.5%',
    backgroundColor: COLORS.card,
    borderColor: COLORS.cardBorder,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
    position: 'relative',
  },
  tileDisabled: {
    opacity: 0.6,
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tileTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  tileTitleDisabled: {
    color: COLORS.textSecondary,
  },
  tileSub: {
    color: COLORS.textMuted,
    fontSize: 10.5,
    lineHeight: 14,
  },
  badge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 0.5,
    borderColor: COLORS.cardBorder,
  },
  badgeText: {
    color: COLORS.textSecondary,
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});
