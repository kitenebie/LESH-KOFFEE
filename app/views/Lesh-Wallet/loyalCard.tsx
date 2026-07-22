import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Colors } from '../../../components/UI/Colors';
import { useAppData } from '../../../lib/useAppData';

interface LoyalCardProps {
  selectedTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  tierConfig: any;
  isLocked?: boolean;
  statusText?: string;
  leshAcc?: string | null;
  leshExp?: string | null;
  userName?: string;
}

export default function LoyalCard({
  selectedTier,
  tierConfig,
  isLocked = false,
  statusText,
  leshAcc,
  leshExp,
  userName,
}: LoyalCardProps) {
  const { data: dummyData } = useAppData();
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  // Security Toggles
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [showAccountNo, setShowAccountNo] = useState(false);

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

  const currentTier = tierConfig[selectedTier] || tierConfig.Bronze;

  // Dynamic balance reading from context (fallback to 500)
  const balance = Number(dummyData?.wallet?.balance) || 500;

  // Format card number for display
  const lastFour = leshAcc ? leshAcc.slice(-6) : '000001';
  const displayCardNo = showCardNumber ? (leshAcc || 'FC-2024-000001') : `FC-2024-••••${lastFour.slice(-2)}`;

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
          {/* FRONT FACE (Accurate image clone layout) */}
          <Animated.View 
            style={[
              styles.atmCardFront, 
              { 
                transform: [{ rotateY: frontInterpolate }], 
                opacity: frontOpacity,
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.cardContentTouchable} 
              activeOpacity={0.95} 
              onPress={handleFlipCard}
            >
              <View style={styles.cardInnerContent}>
                {/* Top Right Wave Wave graphic */}
                <View style={styles.topRightWave} pointerEvents="none">
                  <View style={styles.topRightIconContainer}>
                    <Ionicons name="cafe-outline" size={110} color="rgba(255, 255, 255, 0.18)" />
                  </View>
                </View>

                {/* Bottom double layer wave shapes */}
                <View style={styles.bottomWaveBack} pointerEvents="none" />
                <View style={styles.bottomWaveFront} pointerEvents="none" />

                {/* Top Left: Logo area (Cloud logo, divider, fōam coffee text) */}
                <View style={styles.giftCardLogoBlock} pointerEvents="none">
                  <Image 
                    source={require('../../../assets/app/logo.png')} 
                    style={styles.giftCardLogoImg} 
                    resizeMode="contain" 
                  />
                  <View style={styles.giftCardLogoDivider} />
                  <View style={styles.giftCardLogoTextContainer}>
                    <Text style={styles.giftCardLogoTitle}>fōam</Text>
                    <Text style={styles.giftCardLogoSubtitle}>coffee</Text>
                  </View>
                </View>

                {/* Center Right: Mascot large image logo peeking out */}
                <Image 
                  source={require('../../../assets/app/logo.png')} 
                  style={styles.giftCardMascotImg} 
                  resizeMode="cover" 
                  pointerEvents="none"
                />

                {/* Center Left: GIFT CARD title text & custom quote */}
                <View style={styles.giftCardTitleContainer} pointerEvents="none">
                  <Text style={styles.giftCardTitle}>GIFT CARD</Text>
                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Ionicons name="heart" size={8} color="#82C1F9" style={{ marginHorizontal: 6 }} />
                    <View style={styles.dividerLine} />
                  </View>
                  <Text style={styles.giftCardQuote}>GOOD COFFEE. GOOD MOOD.</Text>
                </View>

                {/* Bottom Row content */}
                <View style={styles.giftCardBottomRow}>
                  {/* Bottom Left Support */}
                  <View style={styles.supportContainer} pointerEvents="none">
                    <Ionicons name="cafe" size={14} color="#3D2B1F" style={{ marginRight: 6 }} />
                    <View>
                      <Text style={styles.supportText}>THANK YOU</Text>
                      <Text style={styles.supportText}>FOR YOUR SUPPORT!</Text>
                    </View>
                  </View>
                  
                  {/* Bottom Right Card No */}
                  <View style={styles.cardNoContainer}>
                    <Text style={styles.cardNoLabel}>CARD NO.</Text>
                    <View style={styles.cardNoRow}>
                      <Text style={styles.cardNoValue}>{displayCardNo}</Text>
                      <TouchableOpacity 
                        onPress={() => setShowCardNumber(!showCardNumber)} 
                        style={styles.eyeBtnMiniFront}
                        activeOpacity={0.7}
                      >
                        <Ionicons name={showCardNumber ? 'eye-outline' : 'eye-off-outline'} size={11} color="#3D2B1F" style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* BACK FACE (Accurate theme matching) */}
          <Animated.View 
            style={[
              styles.atmCardBack, 
              { 
                transform: [{ rotateY: backInterpolate }], 
                opacity: backOpacity,
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.cardContentTouchable} 
              activeOpacity={0.95} 
              onPress={handleFlipCard}
            >
              <View style={styles.cardInnerContent}>
                {/* Replicated Waves at the top-right & bottom */}
                <View style={styles.topRightWave} pointerEvents="none" />
                <View style={styles.bottomWaveBack} pointerEvents="none" />
                <View style={styles.bottomWaveFront} pointerEvents="none" />

                {/* Back Header */}
                <View style={styles.backHeader} pointerEvents="none">
                  <View style={styles.backLogoBlock}>
                    <Image 
                      source={require('../../../assets/app/logo.png')} 
                      style={styles.backLogoImg} 
                      resizeMode="contain" 
                    />
                    <Text style={styles.backBrandText}>FOAM COFFEE</Text>
                  </View>
                  <Text style={styles.backCardType}>GIFT CARD BACK</Text>
                </View>

                {/* Center Barcode Box */}
                <View style={styles.backCenterBox}>
                  <View style={styles.backBarcodeLines} pointerEvents="none">
                    {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3, 2, 1, 2, 4, 1, 2, 1, 3, 2].map((w, idx) => (
                      <View 
                        key={idx} 
                        style={{
                          width: w,
                          height: 34,
                          backgroundColor: '#3D2B1F', // Espresso brown barcode lines
                          marginRight: idx % 3 === 0 ? 2 : 1,
                          opacity: 0.95
                        }} 
                      />
                    ))}
                  </View>
                  
                  {/* Card Code + Visibility toggler in row */}
                  <View style={styles.backCardCodeRow}>
                    <Text style={styles.backCardCodeText}>
                      {showAccountNo ? (leshAcc || 'FC-2024-000001') : `FC-2024-••••${lastFour.slice(-2)}`}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => setShowAccountNo(!showAccountNo)} 
                      style={styles.eyeBtnMiniBack}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={showAccountNo ? 'eye-outline' : 'eye-off-outline'} size={12} color="#3D2B1F" style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Terms and usage instructions */}
                <View style={styles.backTermsBlock} pointerEvents="none">
                  <Text style={styles.backTermsText}>
                    Redeemable for any menu item at any Foam Coffee branch. This card is non-refundable and cannot be exchanged for cash.
                  </Text>
                </View>

                {/* Replicated Footer details to match front */}
                <View style={styles.giftCardBottomRow}>
                  <View style={styles.supportContainer} pointerEvents="none">
                    <Ionicons name="cafe" size={14} color="#3D2B1F" style={{ marginRight: 6 }} />
                    <View>
                      <Text style={styles.supportText}>THANK YOU</Text>
                      <Text style={styles.supportText}>FOR YOUR SUPPORT!</Text>
                    </View>
                  </View>
                  
                  <View style={styles.backScanContainer} pointerEvents="none">
                    <Ionicons name="scan-outline" size={10} color="#3D2B1F" style={{ marginRight: 4 }} />
                    <Text style={styles.backScanText}>SCAN BARCODE</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
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
  cardContentTouchable: {
    width: '100%',
    height: '100%',
  },
  cardInnerContent: {
    width: '100%',
    height: '100%',
    padding: 20,
    justifyContent: 'space-between',
    position: 'relative',
  },
  atmCardFront: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8E5DF',
    backgroundColor: '#FDFBF7', // Premium cream color from logo image
    backfaceVisibility: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  atmCardBack: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8E5DF',
    backgroundColor: '#FDFBF7', // Matching cream background
    backfaceVisibility: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  topRightWave: {
    position: 'absolute',
    top: -55,
    right: -25,
    width: 155,
    height: 155,
    borderRadius: 77.5,
    backgroundColor: '#82C1F9', // Primary logo sky blue wave
    zIndex: 0,
  },
  topRightIconContainer: {
    position: 'absolute',
    bottom: -15,
    left: -15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRightValueContainer: {
    position: 'absolute',
    bottom: 24,
    left: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRightValueText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#FFFFFF',
    lineHeight: 25,
  },
  topRightValueLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 8,
    color: '#FFFFFF',
    letterSpacing: 2,
    marginTop: -2,
  },
  bottomWaveBack: {
    position: 'absolute',
    bottom: -45,
    left: -20,
    right: -20,
    height: 85,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 70,
    backgroundColor: '#A9D6FD', // Lighter soft blue wave
    opacity: 0.65,
    zIndex: 0,
  },
  bottomWaveFront: {
    position: 'absolute',
    bottom: -65,
    left: -35,
    right: -35,
    height: 100,
    borderTopLeftRadius: 120,
    borderTopRightRadius: 100,
    backgroundColor: '#82C1F9', // Sky blue bottom wave
    zIndex: 0,
  },
  giftCardLogoBlock: {
    position: 'absolute',
    top: 15,
    left: 15,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 5,
  },
  giftCardLogoImg: {
    width: 52,
    height: 52,
  },
  giftCardLogoDivider: {
    width: 1.2,
    height: 20,
    backgroundColor: '#3D2B1F', // Logo espresso brown color
    marginHorizontal: 8,
    opacity: 0.35,
  },
  giftCardLogoTextContainer: {
    justifyContent: 'center',
  },
  giftCardLogoTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12.5,
    color: '#3D2B1F',
    lineHeight: 14,
    letterSpacing: 0.2,
  },
  giftCardLogoSubtitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 9,
    color: '#3D2B1F',
    lineHeight: 10,
    marginTop: -1,
  },
  giftCardMascotImg: {
    position: 'absolute',
    bottom: 46,
    right: -5,
    width: 145,
    height: 110,
    zIndex: 2,
  },
  giftCardTitleContainer: {
    position: 'absolute',
    top: 56,
    left: 16,
    zIndex: 5,
  },
  giftCardTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 23,
    color: '#3D2B1F', // Espresso brown text
    letterSpacing: 1.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
    width: 125,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#82C1F9', // Underline blue
  },
  giftCardQuote: {
    fontFamily: 'Poppins-Bold',
    fontSize: 7,
    color: '#3D2B1F', // Espresso brown
    letterSpacing: 1,
  },
  giftCardBottomRow: {
    position: 'absolute',
    bottom: 6,
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 5,
  },
  supportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 6.5,
    color: '#3D2B1F',
    letterSpacing: 0.2,
    lineHeight: 8,
  },
  cardNoContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  cardNoLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 6.5,
    color: '#3D2B1F',
    opacity: 0.8,
  },
  cardNoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardNoValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 9,
    color: '#3D2B1F',
    letterSpacing: 0.5,
  },
  eyeBtnMiniFront: {
    padding: 2,
  },
  eyeBtnMiniBack: {
    padding: 2,
  },
  backHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 5,
    width: '100%',
  },
  backLogoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backLogoImg: {
    width: 20,
    height: 20,
  },
  backBrandText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: '#3D2B1F',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  backCardType: {
    fontFamily: 'Poppins-Bold',
    fontSize: 8,
    color: '#3D2B1F',
    opacity: 0.6,
    letterSpacing: 1,
  },
  backCenterBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginVertical: 4,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    zIndex: 5,
  },
  backBarcodeLines: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  backCardCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backCardCodeText: {
    fontFamily: 'Courier New',
    fontWeight: 'bold',
    fontSize: 11,
    color: '#3D2B1F',
    letterSpacing: 1.5,
  },
  backTermsBlock: {
    paddingHorizontal: 16,
    alignItems: 'center',
    marginVertical: 4,
    zIndex: 5,
    width: '100%',
  },
  backTermsText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 6.5,
    color: '#3D2B1F',
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 9,
  },
  backScanContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backScanText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 6.5,
    color: '#3D2B1F',
    letterSpacing: 0.5,
  },
});
