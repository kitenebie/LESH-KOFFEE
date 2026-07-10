import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface LoyalCardProps {
  selectedTier: 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  tierConfig: any;
  isLocked?: boolean;
  statusText?: string;
}

export default function LoyalCard({
  selectedTier,
  tierConfig,
  isLocked = false,
  statusText
}: LoyalCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  // Security Toggles
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [showAccountNo, setShowAccountNo] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [showAtmPin, setShowAtmPin] = useState(false);

  const handleFlipCard = () => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 180,
      friction: 8,
      tension: 15,
      useNativeDriver: true,
    }).start(() => {
      setIsFlipped(!isFlipped);
    });
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 89, 90, 180],
    outputRange: [1, 1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 89, 90, 180],
    outputRange: [0, 0, 1, 1],
  });

  const currentTier = tierConfig[selectedTier];

  return (
    <View style={styles.outerWrapper}>
      {/* Status Header above the card */}
      {statusText && (
        <View style={styles.statusHeaderRow}>
          <Text style={[styles.statusText, isLocked && styles.statusTextLocked]}>
            {statusText}
          </Text>
          {isLocked && <Ionicons name="lock-closed" size={12} color="#8E8E93" style={{ marginLeft: 4 }} />}
        </View>
      )}

      <View style={[styles.cardContainer, isLocked && styles.cardContainerLocked]}>
        <View style={styles.cardWrapper}>
          {/* ATM Front Face */}
          <Animated.View 
            style={[
              styles.atmCardFront, 
              { 
                transform: [{ rotateY: frontInterpolate }], 
                opacity: frontOpacity,
                backgroundColor: currentTier.baseColor,
                borderColor: currentTier.borderColor
              }
            ]}
            pointerEvents="box-none"
          >
            {/* Background Flip Target (fills card behind buttons) */}
            <TouchableOpacity 
              style={styles.cardBgClickTarget} 
              activeOpacity={0.95} 
              onPress={handleFlipCard} 
            />

            {/* 3-Color Combination Background Ornaments */}
            <View style={[styles.cardAccentCircle1, { backgroundColor: currentTier.accent1 }]} pointerEvents="none" />
            <View style={[styles.cardAccentCircle2, { backgroundColor: currentTier.accent2 }]} pointerEvents="none" />

            {/* Header branding */}
            <View style={styles.atmHeader} pointerEvents="none">
              <View style={styles.atmLogoBlock}>
                <Ionicons name="cafe" size={20} color={currentTier.borderColor} />
                <Text style={styles.atmBrandName}>LESH KAFFE</Text>
              </View>
              <Text style={[styles.atmCardType, { color: currentTier.borderColor }]}>{currentTier.typeName}</Text>
            </View>

            {/* EMV Microchip & Contactless Wireless Signal */}
            <View style={styles.chipAndWifiRow} pointerEvents="none">
              {/* EMV Microchip */}
              <View style={[styles.emvChip, { backgroundColor: currentTier.borderColor, borderColor: currentTier.accent1 }]}>
                <View style={styles.chipLineHorizontal} />
                <View style={styles.chipLineVertical} />
                <View style={styles.chipCenterCore} />
              </View>
              {/* Contactless symbol */}
              <Ionicons name="cellular" size={18} color="rgba(250, 249, 245, 0.7)" style={styles.contactlessIcon} />
            </View>

            {/* 16-Digit ATM Card Number */}
            <View style={styles.cardNumberRow}>
              <Text style={styles.atmCardNumber}>
                {showCardNumber ? '5482  1935  8824  0012' : '••••  ••••  ••••  0012'}
              </Text>
              <TouchableOpacity onPress={() => setShowCardNumber(!showCardNumber)} style={styles.eyeBtnFront}>
                <Ionicons name={showCardNumber ? 'eye-outline' : 'eye-off-outline'} size={16} color={currentTier.borderColor} />
              </TouchableOpacity>
            </View>

            {/* Footer labels, Name, Validity & Overlapping Union circles */}
            <View style={styles.atmFooter} pointerEvents="none">
              <View>
                <Text style={styles.atmLabel}>CARDHOLDER</Text>
                <Text style={styles.atmValueName}>KEN NARANJO</Text>
              </View>
              <View style={styles.atmExpiryBlock}>
                <Text style={styles.atmLabel}>GOOD THRU</Text>
                <Text style={styles.atmValueDate}>12/31</Text>
              </View>
              {/* Overlapping 2-Circle Union Design */}
              <View style={styles.atmUnionBadge}>
                <View style={[styles.unionCircle, { backgroundColor: '#EB001B' }]} />
                <View style={[styles.unionCircle, { backgroundColor: '#F79E1B', marginLeft: -8 }]} />
              </View>
            </View>
          </Animated.View>

          {/* ATM Back Face */}
          <Animated.View 
            style={[
              styles.atmCardBack, 
              { 
                transform: [{ rotateY: backInterpolate }], 
                opacity: backOpacity,
                backgroundColor: currentTier.baseColor,
                borderColor: `${currentTier.borderColor}50`
              }
            ]}
            pointerEvents="box-none"
          >
            {/* Background Flip Target (fills card behind buttons) */}
            <TouchableOpacity 
              style={styles.cardBgClickTarget} 
              activeOpacity={0.95} 
              onPress={handleFlipCard} 
            />

            {/* 3-Color Combination Background Ornaments */}
            <View style={[styles.cardAccentCircle1, { backgroundColor: currentTier.accent1 }]} pointerEvents="none" />
            <View style={[styles.cardAccentCircle2, { backgroundColor: currentTier.accent2 }]} pointerEvents="none" />

            {/* Black Magnetic Stripe */}
            <View style={styles.magneticStripe} pointerEvents="none" />

            {/* Authorised Signature Strip & 3-digit CVV */}
            <View style={styles.signatureRow}>
              <View style={styles.signatureStrip} pointerEvents="none">
                <Text style={styles.signatureSampleText}>Ken Naranjo</Text>
              </View>
              <View style={styles.cvvStrip}>
                <Text style={styles.cvvLabel}>CVV</Text>
                <View style={styles.cvvValueRow}>
                  <Text style={styles.cvvValue}>{showCvv ? '843' : '•••'}</Text>
                  <TouchableOpacity onPress={() => setShowCvv(!showCvv)} style={styles.eyeBtnMini}>
                    <Ionicons name={showCvv ? 'eye-outline' : 'eye-off-outline'} size={12} color={currentTier.borderColor} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Secure Credentials list & Terms */}
            <View style={styles.backCredentialsContainer}>
              <View style={styles.backCredentialItem}>
                <Text style={styles.backLabel}>ACCOUNT NO.</Text>
                <View style={styles.secureValueRow}>
                  <Text style={styles.backVal}>{showAccountNo ? '1200 4821 9358' : '1200 •••• ••••'}</Text>
                  <TouchableOpacity onPress={() => setShowAccountNo(!showAccountNo)} style={styles.eyeBtnMini}>
                    <Ionicons name={showAccountNo ? 'eye-outline' : 'eye-off-outline'} size={14} color={currentTier.borderColor} style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.backCredentialItem}>
                <Text style={styles.backLabel}>ATM PIN</Text>
                <View style={styles.secureValueRow}>
                  <Text style={styles.backVal}>{showAtmPin ? '8543' : '••••'}</Text>
                  <TouchableOpacity onPress={() => setShowAtmPin(!showAtmPin)} style={styles.eyeBtnMini}>
                    <Ionicons name={showAtmPin ? 'eye-outline' : 'eye-off-outline'} size={14} color={currentTier.borderColor} style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Back Footer details */}
            <View style={styles.backAtmFooter} pointerEvents="none">
              <Text style={styles.backTermsText}>Issued by Lesh Kaffe Inc. Under membership authority.</Text>
              <View style={styles.backFlipBadge}>
                <Ionicons name="sync" size={10} color="rgba(250, 249, 245, 0.4)" style={{ marginRight: 4 }} />
                <Text style={styles.backFlipText}>Flip</Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
    marginBottom: 24,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  statusText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#2E7D32', // Unlocked/Active green
    textTransform: 'uppercase',
  },
  statusTextLocked: {
    color: '#8E8E93', // Locked grey
  },
  cardContainer: {
    width: '100%',
    height: 190,
  },
  cardContainerLocked: {
    opacity: 0.75, // Dim locked cards slightly
  },
  cardWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cardBgClickTarget: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  atmCardFront: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    backfaceVisibility: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  atmCardBack: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    backfaceVisibility: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  cardAccentCircle1: {
    position: 'absolute',
    right: -60,
    bottom: -70,
    width: 230,
    height: 230,
    borderRadius: 115,
    opacity: 0.45,
    zIndex: -1,
  },
  cardAccentCircle2: {
    position: 'absolute',
    right: -10,
    bottom: -100,
    width: 190,
    height: 190,
    borderRadius: 95,
    opacity: 0.35,
    zIndex: -1,
  },
  atmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  atmLogoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  atmBrandName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#FAF9F5',
    marginLeft: 6,
    letterSpacing: 1,
  },
  atmCardType: {
    fontFamily: 'Poppins-Bold',
    fontSize: 9,
    letterSpacing: 1.5,
  },
  chipAndWifiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  emvChip: {
    width: 38,
    height: 28,
    borderRadius: 6,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
  },
  chipLineHorizontal: {
    position: 'absolute',
    top: 13,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#5C4A1A',
  },
  chipLineVertical: {
    position: 'absolute',
    left: 18,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#5C4A1A',
  },
  chipCenterCore: {
    position: 'absolute',
    width: 10,
    height: 8,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#5C4A1A',
    backgroundColor: '#FAF9F5',
    top: 9,
    left: 13,
  },
  contactlessIcon: {
    marginLeft: 10,
    transform: [{ rotate: '90deg' }],
  },
  cardNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    zIndex: 5,
  },
  atmCardNumber: {
    fontFamily: 'Courier New',
    fontWeight: 'bold',
    fontSize: 20,
    color: '#FAF9F5',
    letterSpacing: 1.5,
  },
  eyeBtnFront: {
    marginLeft: 12,
    padding: 4,
  },
  atmFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  atmLabel: {
    fontFamily: 'Poppins',
    fontSize: 8,
    color: 'rgba(250, 249, 245, 0.4)',
    letterSpacing: 0.5,
  },
  atmValueName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#FAF9F5',
    marginTop: 1,
  },
  atmExpiryBlock: {
    marginLeft: 10,
  },
  atmValueDate: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#FAF9F5',
    marginTop: 1,
  },
  atmUnionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  unionCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    opacity: 0.9,
  },
  magneticStripe: {
    width: '100%',
    height: 38,
    backgroundColor: '#111111',
    marginTop: 2,
  },
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    zIndex: 5,
  },
  signatureStrip: {
    flex: 3,
    height: 28,
    backgroundColor: '#EAE6DB',
    justifyContent: 'center',
    paddingLeft: 12,
    borderWidth: 1,
    borderColor: '#CCC2B0',
  },
  signatureSampleText: {
    fontFamily: 'Courier New',
    fontStyle: 'italic',
    fontWeight: 'bold',
    fontSize: 13,
    color: '#1C3144',
  },
  cvvStrip: {
    flex: 1.5,
    marginLeft: 8,
    alignItems: 'flex-end',
  },
  cvvLabel: {
    fontFamily: 'Poppins',
    fontSize: 7,
    color: 'rgba(250, 249, 245, 0.5)',
    marginRight: 6,
  },
  cvvValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(250, 249, 245, 0.15)',
    paddingHorizontal: 6,
    height: 24,
  },
  cvvValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#FAF9F5',
  },
  eyeBtnMini: {
    marginLeft: 6,
    padding: 2,
  },
  backCredentialsContainer: {
    paddingHorizontal: 20,
    marginTop: 6,
    zIndex: 5,
  },
  backCredentialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(250, 249, 245, 0.05)',
  },
  backLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 9,
    color: 'rgba(250, 249, 245, 0.5)',
    letterSpacing: 0.5,
  },
  backVal: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#FAF9F5',
  },
  secureValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backAtmFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  backTermsText: {
    fontFamily: 'Poppins',
    fontSize: 7,
    color: 'rgba(250, 249, 245, 0.35)',
    flex: 1,
    paddingRight: 10,
  },
  backFlipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250, 249, 245, 0.08)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  backFlipText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 8,
    color: 'rgba(250, 249, 245, 0.6)',
  },
});
