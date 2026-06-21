import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { X, ExternalLink, Sparkles, Megaphone } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';

// Set this to false when building your production APK with real AdMob/Start.io SDKs
export const USE_MOCK_ADS = true;

// Mock ads database for variety
const MOCK_AD_CREATIVES = [
  {
    title: 'Speed Booster Pro',
    desc: 'Clean cache, boost memory & cool down CPU instantly!',
    cta: 'Install Now',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60', // Abstract premium art
    tagline: 'Boost your phone speed by 40%'
  },
  {
    title: 'Antigravity Code Studio',
    desc: 'Write code 10x faster with our AI coding companion.',
    cta: 'Learn More',
    image: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=150&auto=format&fit=crop&q=60', // Code visual
    tagline: 'Next-Gen AI Pair Programming'
  },
  {
    title: 'Express VPN Security',
    desc: 'Protect your online privacy with ultra-fast servers worldwide.',
    cta: 'Secure Now',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=150&auto=format&fit=crop&q=60', // Security visualization
    tagline: 'Get 3 months free plan'
  }
];

// 1. Mock Banner Ad Component (Renders at the bottom of screens)
export function MockBannerAd() {
  const [ad, setAd] = useState(MOCK_AD_CREATIVES[0]);

  useEffect(() => {
    // Select a random ad creative
    const randomIndex = Math.floor(Math.random() * MOCK_AD_CREATIVES.length);
    setAd(MOCK_AD_CREATIVES[randomIndex]);
  }, []);

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.bannerBadge}>
        <Text style={styles.bannerBadgeText}>AD</Text>
      </View>
      
      <Image source={{ uri: ad.image }} style={styles.bannerImage} />
      
      <View style={styles.bannerContent}>
        <Text style={styles.bannerTitle} numberOfLines={1}>{ad.title}</Text>
        <Text style={styles.bannerDesc} numberOfLines={1}>{ad.desc}</Text>
      </View>

      <TouchableOpacity style={styles.bannerCta}>
        <Text style={styles.bannerCtaText}>{ad.cta}</Text>
      </TouchableOpacity>
    </View>
  );
}

// 2. Mock Native Ad Card Component (Fits inside grids, e.g., grid item)
export function MockNativeAdCard() {
  const [ad, setAd] = useState(MOCK_AD_CREATIVES[1]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * MOCK_AD_CREATIVES.length);
    setAd(MOCK_AD_CREATIVES[randomIndex]);
  }, []);

  return (
    <View style={styles.nativeCard}>
      <View style={styles.nativeCardBadge}>
        <Megaphone size={10} color={COLORS.white} style={{ marginRight: 2 }} />
        <Text style={styles.nativeCardBadgeText}>Sponsored</Text>
      </View>

      <Image source={{ uri: ad.image }} style={styles.nativeCardImage} />
      
      <View style={styles.nativeCardInfo}>
        <Text style={styles.nativeCardTitle} numberOfLines={1}>{ad.title}</Text>
        <Text style={styles.nativeCardDesc} numberOfLines={2}>{ad.desc}</Text>
      </View>

      <TouchableOpacity style={styles.nativeCardCta}>
        <Text style={styles.nativeCardCtaText}>{ad.cta}</Text>
        <ExternalLink size={12} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

// 3. Mock Interstitial Ad Modal component (Fullscreen Ad popup)
export function MockInterstitialAd({ visible, onClose }) {
  const [ad, setAd] = useState(MOCK_AD_CREATIVES[2]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(3); // 3 seconds close delay

  useEffect(() => {
    if (visible) {
      setLoading(true);
      setTimeLeft(3);
      const randomIndex = Math.floor(Math.random() * MOCK_AD_CREATIVES.length);
      setAd(MOCK_AD_CREATIVES[randomIndex]);

      // Simulate loading network delay
      const loadTimer = setTimeout(() => {
        setLoading(false);
      }, 800);

      return () => clearTimeout(loadTimer);
    }
  }, [visible]);

  useEffect(() => {
    if (visible && !loading && timeLeft > 0) {
      const countdown = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, [visible, loading, timeLeft]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.interstitialOverlay}>
        {loading ? (
          <View style={styles.interstitialLoadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.interstitialLoadingText}>Caching sponsor video...</Text>
          </View>
        ) : (
          <View style={styles.interstitialContainer}>
            {/* Top Close Bar */}
            <View style={styles.interstitialCloseBar}>
              <View style={styles.adLabelContainer}>
                <Sparkles size={12} color={COLORS.primary} />
                <Text style={styles.adLabelText}>Sponsor Ad</Text>
              </View>
              
              {timeLeft > 0 ? (
                <View style={styles.countdownContainer}>
                  <Text style={styles.countdownText}>Close in {timeLeft}s</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <X size={20} color={COLORS.white} />
                </TouchableOpacity>
              )}
            </View>

            {/* Ad Content */}
            <Image source={{ uri: ad.image }} style={styles.interstitialImage} />

            <View style={styles.interstitialBody}>
              <Text style={styles.interstitialTagline}>{ad.tagline}</Text>
              <Text style={styles.interstitialTitle}>{ad.title}</Text>
              <Text style={styles.interstitialDesc}>{ad.desc}</Text>
            </View>

            {/* Ad Action */}
            <TouchableOpacity style={styles.interstitialCta} onPress={onClose}>
              <Text style={styles.interstitialCtaText}>{ad.cta}</Text>
              <ExternalLink size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Banner Styles
  bannerContainer: {
    width: '100%',
    height: 64,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  bannerBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: BORDER_RADIUS.xs,
  },
  bannerBadgeText: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  bannerImage: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  bannerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  bannerDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  bannerCta: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm - 2,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  bannerCtaText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: COLORS.black, // Dark text on light green background for readability
  },

  // Native Card Styles (For inside grid list)
  nativeCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    padding: SPACING.sm,
    height: 220,
    justifyContent: 'space-between',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nativeCardBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    zIndex: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  nativeCardBadgeText: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  nativeCardImage: {
    width: '100%',
    height: 100,
    borderRadius: BORDER_RADIUS.md,
  },
  nativeCardInfo: {
    marginTop: SPACING.sm,
    paddingHorizontal: 2,
  },
  nativeCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  nativeCardDesc: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 13,
  },
  nativeCardCta: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
    gap: 4,
  },
  nativeCardCtaText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: COLORS.black,
  },

  // Interstitial Overlay Styles
  interstitialOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  interstitialLoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  interstitialLoadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  interstitialContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  interstitialCloseBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  adLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adLabelText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countdownContainer: {
    backgroundColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  countdownText: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interstitialImage: {
    width: '100%',
    height: 170,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  interstitialBody: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: 4,
  },
  interstitialTagline: {
    fontSize: 10.5,
    color: COLORS.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  interstitialTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: 2,
  },
  interstitialDesc: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: SPACING.xs,
  },
  interstitialCta: {
    width: '100%',
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  interstitialCtaText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.black,
  },
});


