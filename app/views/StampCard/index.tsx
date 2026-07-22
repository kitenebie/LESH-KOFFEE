import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../../components/UI/Colors';
import { useAppData } from '../../../lib/useAppData';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Achievement {
  id: string;
  category: string;
  icon: string;
  color: string;
  accentColor: string;
  label: string;
  description: string;
  collected: number;
  required: number;
  reward: string;
  history: { id: string; product: string; date: string; time: string }[];
}

function AchievementCard({ ach, index, onClaimVoucher }: { ach: Achievement; index: number; onClaimVoucher: (ach: Achievement) => void }) {
  const [expanded, setExpanded] = useState(false);
  const progress = ach.collected / ach.required;
  const isComplete = ach.collected >= ach.required;

  return (
    <Animated.View
      entering={SlideInDown.delay(200 + index * 100).springify().damping(18).stiffness(120)}
      style={[styles.heroCard, { height: undefined, minHeight: 200, paddingBottom: 16 }]}
    >
      {/* Top Section */}
      <View style={styles.heroTopRow}>
        <View style={styles.heroTopLeft}>
          <View style={styles.brandLogoRow}>
            <View style={[styles.achIconBg, { backgroundColor: ach.accentColor, width: 32, height: 32, borderRadius: 16 }]}>
              <Ionicons name={ach.icon as any} size={16} color="#FAF9F5" />
            </View>
            <View style={styles.brandDivider} />
            <View style={styles.brandTextContainer}>
              <Text style={[styles.brandTitle, { color: ach.accentColor, fontSize: 13, lineHeight: 14 }]} numberOfLines={1}>{ach.label}</Text>
              <Text style={[styles.brandSubtitle, { color: ach.color }]} numberOfLines={1}>{ach.category}</Text>
            </View>
          </View>
          <View style={styles.brandHeartDividerRow}>
            <View style={styles.brandHeartLine} />
            <Ionicons name="heart" size={8} color="#82C1F9" style={{ marginHorizontal: 6 }} />
            <View style={styles.brandHeartLine} />
          </View>
          <Text style={[styles.brandQuote, { color: ach.accentColor }]} numberOfLines={2}>{ach.description.toUpperCase()}</Text>
        </View>

        {/* Right Top Header (Wavy Blue container) */}
        <View style={[styles.heroTopRight, { backgroundColor: ach.color + '20' }]}>
          <Text style={[styles.pointsCardLabel, { color: ach.accentColor }]}>PROGRESS</Text>
          <View style={styles.pointsCardDividerRow}>
            <View style={[styles.pointsCardLine, { backgroundColor: ach.accentColor }]} />
          </View>
          <View style={[styles.earnPanelCapsule, { backgroundColor: ach.accentColor, paddingVertical: 6 }]}>
            <Text style={[styles.earnPanelText, { fontSize: 11, textAlign: 'center', lineHeight: 12 }]}>
              {ach.collected} / {ach.required}
            </Text>
          </View>
        </View>
      </View>

      {/* Middle Section (Stamps Area) */}
      <View style={[styles.stampsContainer, { backgroundColor: ach.color + '15', marginHorizontal: 16, borderRadius: 16, paddingVertical: 16, flex: undefined }]}>
        <View style={[styles.stampsGrid, { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, flex: undefined }]}>
          {Array.from({ length: ach.required }).map((_, i) => {
            const isStamped = i < ach.collected;
            return (
              <View key={i} style={[styles.stampCircleSlot, { borderColor: ach.color, width: 34, height: 34, borderRadius: 17 }]}>
                <View style={[styles.stampCircleInner, isStamped && styles.stampCircleInnerActive]}>
                  {isStamped ? (
                    <Ionicons name={ach.icon.replace('-outline', '') as any} size={18} color={ach.accentColor} />
                  ) : (
                    <Text style={[styles.stampCircleNumber, { color: ach.color }]}>{i + 1}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <View style={styles.rewardRow}>
          <Ionicons name="gift-outline" size={14} color={ach.accentColor} style={{ marginRight: 6 }} />
          <Text style={[styles.rewardText, { color: ach.accentColor, fontSize: 11 }]}>Reward: {ach.reward}</Text>
        </View>

        {isComplete && (
          <TouchableOpacity
            style={[styles.claimBtn, { backgroundColor: ach.accentColor, marginTop: 10 }]}
            onPress={() => onClaimVoucher(ach)}
            activeOpacity={0.8}
          >
            <Ionicons name="gift" size={16} color="#FAF9F5" style={{ marginRight: 6 }} />
            <Text style={styles.claimBtnText}>Claim Voucher</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

// Claim Voucher Pop-up Component
function ClaimVoucherModal({
  visible,
  onClose,
  achievement,
  earnedVouchers,
  availableVouchers,
}: {
  visible: boolean;
  onClose: () => void;
  achievement: Achievement | null;
  earnedVouchers: any[];
  availableVouchers: any[];
}) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 150 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
    }
  }, [visible, backdropOpacity, translateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!achievement) return null;

  // Get the matching voucher
  const matchingVoucher = earnedVouchers.find(
    (v) => v.description === achievement.reward
  );

  // Get a relevant promo voucher as bonus suggestion
  const bonusVoucher = availableVouchers[0];

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <TouchableOpacity style={styles.backdropTouch} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        {/* Bottom Sheet */}
        <Animated.View style={[styles.bottomSheet, sheetStyle]}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {/* Confetti-style icon */}
          <View style={[styles.celebrationIcon, { backgroundColor: achievement.accentColor + '20' }]}>
            <Ionicons name="gift" size={40} color={achievement.accentColor} />
          </View>

          <Text style={styles.modalTitle}>🎉 Claim Your Reward!</Text>
          <Text style={styles.modalSubtitle}>
            Congratulations! You completed the{' '}
            <Text style={{ fontFamily: 'Poppins-Bold', color: achievement.color }}>
              {achievement.label}
            </Text>{' '}
            challenge!
          </Text>

          {/* Voucher Card */}
          <View style={[styles.voucherCard, { borderColor: achievement.accentColor }]}>
            <View style={[styles.voucherCardLeft, { backgroundColor: achievement.color }]}>
              <Ionicons name={achievement.icon as any} size={24} color="#FAF9F5" />
            </View>
            <View style={styles.voucherCardContent}>
              <Text style={styles.voucherCardTitle}>{achievement.reward}</Text>
              {matchingVoucher && (
                <>
                  <Text style={styles.voucherCardCode}>Code: {matchingVoucher.code}</Text>
                  <Text style={styles.voucherCardExpiry}>
                    Valid until {matchingVoucher.expiresAt}
                  </Text>
                </>
              )}
              {!matchingVoucher && (
                <Text style={styles.voucherCardCode}>
                  Voucher will be added to your wallet
                </Text>
              )}
            </View>
          </View>

          {/* Bonus voucher suggestion from availableVouchers */}
          {bonusVoucher && (
            <View style={styles.bonusSection}>
              <Text style={styles.bonusLabel}>💡 You also have an active voucher:</Text>
              <View style={styles.bonusVoucherRow}>
                <Ionicons name="pricetag" size={16} color="#FFD700" style={{ marginRight: 8 }} />
                <Text style={styles.bonusVoucherText}>
                  {bonusVoucher.label} (Code: {bonusVoucher.code})
                </Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <TouchableOpacity
            style={[styles.claimActionBtn, { backgroundColor: achievement.accentColor }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={18} color="#FAF9F5" style={{ marginRight: 8 }} />
            <Text style={styles.claimActionBtnText}>Claim & Save to Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.laterBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.laterBtnText}>Maybe Later</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function StampCardView({ onBack }: { onBack?: () => void }) {
  const router = useRouter();
  const { data: dummyData } = useAppData();
  const achievements = (dummyData.stamps.achievements || []).map((ach: Achievement) => {
    return { 
      ...ach, 
      color: '#2D78CD', // Primary Brand Cloud Blue
      accentColor: '#1D5FA7', // Deepened Primary Accent Blue
    };
  });
  const earnedVouchers = dummyData.stamps.vouchers;
  const availableVouchers = dummyData.vouchers;

  const totalCollected = achievements.reduce((s, a) => s + a.collected, 0);
  const totalRequired = achievements.reduce((s, a) => s + a.required, 0);
  const currentCardStamps = totalCollected === 0 ? 0 : (totalCollected % 10 === 0 ? 10 : totalCollected % 10);
  
  const [claimModalVisible, setClaimModalVisible] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const handleClaimVoucher = (ach: Achievement) => {
    setSelectedAchievement(ach);
    setClaimModalVisible(true);
  };

  const handleCloseModal = () => {
    setClaimModalVisible(false);
    setTimeout(() => setSelectedAchievement(null), 300);
  };

  return (
    <View style={styles.container}>
      {/* Header with fade in */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.headerRow}>
        <TouchableOpacity onPress={() => onBack ? onBack() : router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary.default} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Foam Stamp Card</Text>
        <View style={{ width: 32 }} />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* HERO FOAM LOYALTY STAMP CARD */}
        <Animated.View 
          entering={SlideInDown.delay(100).springify().damping(18).stiffness(120)} 
          style={styles.heroCard}
        >
          {/* Top Section */}
          <View style={styles.heroTopRow}>
            {/* Left Top Brand Block */}
            <View style={styles.heroTopLeft}>
              <View style={styles.brandLogoRow}>
                <Image 
                  source={require('../../../assets/app/logo.png')} 
                  style={styles.brandMascotLogo} 
                  resizeMode="contain" 
                />
                <View style={styles.brandDivider} />
                <View style={styles.brandTextContainer}>
                  <Text style={styles.brandTitle}>fōam</Text>
                  <Text style={styles.brandSubtitle}>coffee</Text>
                </View>
              </View>
              <View style={styles.brandHeartDividerRow}>
                <View style={styles.brandHeartLine} />
                <Ionicons name="heart" size={8} color="#82C1F9" style={{ marginHorizontal: 6 }} />
                <View style={styles.brandHeartLine} />
              </View>
              <Text style={styles.brandQuote}>GOOD COFFEE. GOOD MOOD.</Text>
            </View>

            {/* Right Top Header (Wavy Blue container) */}
            <View style={styles.heroTopRight}>
              <Text style={styles.pointsCardLabel}>LOYALTY</Text>
              <Text style={styles.pointsCardSublabel}>POINTS CARD</Text>
              <View style={styles.pointsCardDividerRow}>
                <View style={styles.pointsCardLine} />
                <Ionicons name="heart" size={6} color="#3D2B1F" style={{ marginHorizontal: 4 }} />
                <View style={styles.pointsCardLine} />
              </View>
              {/* Earn Panel Capsule */}
              <View style={styles.earnPanelCapsule}>
                <View style={styles.earnPanelStarBg}>
                  <Ionicons name="star" size={8} color="#82C1F9" />
                </View>
                <Text style={styles.earnPanelText}>
                  EARN 1 POINT FOR EVERY PURCHASE OF ANY DRINK.
                </Text>
              </View>
            </View>
          </View>

          {/* Middle Section (Split Body) */}
          <View style={styles.heroBodyRow}>
            {/* Left Stamps Area (Sky blue base) */}
            <View style={styles.stampsContainer}>
              <View style={styles.stampsGrid}>
                {/* Slots 1-5 */}
                <View style={styles.stampsGridRow}>
                  {[1, 2, 3, 4, 5].map((num) => {
                    const isStamped = num <= currentCardStamps;
                    return (
                      <View key={num} style={styles.stampCircleSlot}>
                        <View style={[styles.stampCircleInner, isStamped && styles.stampCircleInnerActive]}>
                          {isStamped ? (
                            <Image 
                              source={require('../../../assets/app/logo.png')} 
                              style={styles.stampMascotActive} 
                              resizeMode="contain" 
                            />
                          ) : (
                            <Text style={styles.stampCircleNumber}>{num}</Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
                {/* Slots 6-9 + 10 (Free Drink) */}
                <View style={styles.stampsGridRow}>
                  {[6, 7, 8, 9].map((num) => {
                    const isStamped = num <= currentCardStamps;
                    return (
                      <View key={num} style={styles.stampCircleSlot}>
                        <View style={[styles.stampCircleInner, isStamped && styles.stampCircleInnerActive]}>
                          {isStamped ? (
                            <Image 
                              source={require('../../../assets/app/logo.png')} 
                              style={styles.stampMascotActive} 
                              resizeMode="contain" 
                            />
                          ) : (
                            <Text style={styles.stampCircleNumber}>{num}</Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                  {/* Slot 10 (Free Drink) */}
                  <TouchableOpacity
                    style={styles.freeDrinkSlot}
                    activeOpacity={currentCardStamps >= 10 ? 0.8 : 1}
                    onPress={() => {
                      if (currentCardStamps >= 10) {
                        const mainCategoryAch = achievements[0];
                        if (mainCategoryAch) handleClaimVoucher(mainCategoryAch);
                      }
                    }}
                  >
                    <View style={[styles.freeDrinkInner, currentCardStamps >= 10 && styles.freeDrinkInnerActive]}>
                      {currentCardStamps >= 10 ? (
                        <Image 
                          source={require('../../../assets/app/logo.png')} 
                          style={{ width: 28, height: 28 }} 
                          resizeMode="contain" 
                        />
                      ) : (
                        <>
                          <Ionicons name="heart" size={10} color="#2D78CD" />
                          <Text style={styles.freeDrinkTextTitle}>FREE</Text>
                          <Text style={styles.freeDrinkTextSub}>DRINK!</Text>
                        </>
                      )}
                    </View>
                    <Text style={styles.freeDrinkCurvedText}>ON YOUR 10TH POINT</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Right Instructions Area */}
            <View style={styles.instructionsContainer}>
              {/* Item 1 */}
              <View style={styles.instructionItem}>
                <View style={styles.instructionIconBg}>
                  <Ionicons name="cafe-outline" size={12} color="#FFFFFF" />
                </View>
                <Text style={styles.instructionText}>COLLECT POINTS</Text>
              </View>
              <View style={styles.instructionLineDivider} />
              
              {/* Item 2 */}
              <View style={styles.instructionItem}>
                <View style={styles.instructionIconBg}>
                  <Ionicons name="gift-outline" size={12} color="#FFFFFF" />
                </View>
                <Text style={styles.instructionText}>GET REWARDS & FREE DRINKS</Text>
              </View>
              <View style={styles.instructionLineDivider} />

              {/* Item 3 */}
              <View style={styles.instructionItem}>
                <View style={styles.instructionIconBg}>
                  <Ionicons name="star-outline" size={12} color="#FFFFFF" />
                </View>
                <Text style={styles.instructionText}>MORE POINTS. MORE TREATS!</Text>
              </View>

              {/* Thank you footer */}
              <View style={styles.instructionFooter}>
                <Text style={styles.thankYouLabel}>Thank you</Text>
                <Text style={styles.thankYouSublabel}>FOR BEING AWESOME!</Text>
              </View>
            </View>
          </View>

          {/* Bottom Ribbon Bar */}
          <View style={styles.heroRibbonRow}>
            <View style={styles.ribbonLeft}>
              <Ionicons name="heart" size={10} color="#FFFFFF" />
              <Text style={styles.ribbonLeftText}>ONE CARD. MANY CUPS OF HAPPINESS.</Text>
              <Ionicons name="heart" size={10} color="#FFFFFF" />
            </View>
            <View style={styles.ribbonRight}>
              <Text style={styles.cardNoLabel}>CARD NO.</Text>
              <View style={styles.cardNoPill}>
                <Text style={styles.cardNoText}>FC-2024-00001</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Achievement Cards - staggered slide from bottom */}
        {achievements.map((ach, index) => (
          <AchievementCard
            key={ach.id}
            ach={ach}
            index={index}
            onClaimVoucher={handleClaimVoucher}
          />
        ))}

        {/* Vouchers section - slide from bottom */}
        {earnedVouchers.length > 0 && (
          <Animated.View
            entering={SlideInDown.delay(200 + achievements.length * 100).springify().damping(18).stiffness(120)}
            style={styles.voucherSection}
          >
            <Text style={styles.sectionTitle}>My Vouchers</Text>
            {earnedVouchers.map((v, idx) => (
              <Animated.View
                key={`voucher-${v.id || v.code}-${idx}`}
                entering={SlideInDown.delay(300 + idx * 100).duration(400)}
              >
                <View style={styles.ticketWrapper}>
                  {/* Physical Ticket Edge Cutouts (Punched Holes) */}
                  <View style={styles.topCenterCutout} />
                  <View style={styles.bottomCenterCutout} />
                  <View style={styles.leftEdgeCutout} />
                  <View style={styles.rightEdgeCutout} />

                  {/* LEFT TICKET (Main Body - Cream base) */}
                  <View style={styles.leftTicket}>
                    {/* Top Left Brand Logo */}
                    <View style={styles.logoBlock}>
                      <Image 
                        source={require('../../../assets/app/logo.png')} 
                        style={styles.logoImg} 
                        resizeMode="contain" 
                      />
                      <View style={styles.logoDivider} />
                      <View style={styles.logoTextContainer}>
                        <Text style={styles.logoTitle}>fōam</Text>
                        <Text style={styles.logoSubtitle}>coffee</Text>
                      </View>
                    </View>

                    {/* Sparkle details */}
                    <Ionicons name="sparkles" size={12} color="#82C1F9" style={styles.sparkleDecoration} />

                    {/* Center Content */}
                    <View style={styles.centerTextContainer}>
                      <Text style={styles.voucherMainTitle} numberOfLines={1}>
                        {v.description ? v.description.toUpperCase() : "VOUCHER"}
                      </Text>
                      
                      <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Ionicons name="heart" size={8} color="#82C1F9" style={{ marginHorizontal: 6 }} />
                        <View style={styles.dividerLine} />
                      </View>
                      
                      <Text style={styles.voucherSubtitle} numberOfLines={1}>
                        EXPIRES {v.expiresAt}
                      </Text>
                    </View>

                    {/* Bottom Row Details */}
                    <View style={styles.bottomDetailsRow}>
                      <View style={styles.valueRow}>
                        <View style={styles.valueTag}>
                          <Text style={styles.valueTagText}>STATUS</Text>
                        </View>
                        <Text style={styles.valueAmountText}>{v.used ? "USED" : "ACTIVE"}</Text>
                      </View>

                      <View style={styles.bottomRowDivider} />

                      {/* Support message */}
                      <View style={styles.supportContainer}>
                        <Ionicons name="cafe" size={14} color="#3D2B1F" style={{ marginRight: 6 }} />
                        <View>
                          <Text style={styles.supportText}>THANK YOU</Text>
                          <Text style={styles.supportText}>FOR CHOOSING FOAM COFFEE!</Text>
                        </View>
                      </View>
                    </View>

                    {/* Bottom Ribbon */}
                    <View style={styles.bottomRibbon}>
                      <Text style={styles.bottomRibbonText}>❤ MADE WITH PASSION ❤</Text>
                    </View>
                  </View>

                  {/* Perforated vertical line */}
                  <View style={styles.perforatedDivider} />

                  {/* RIGHT STUB (Tear-off Ticket - Sky Blue) */}
                  <View style={[styles.rightTicketStub, v.used && { backgroundColor: Colors.neutral.gray400 }]}>
                    {/* Stub Header */}
                    <View style={styles.stubHeader}>
                      <Text style={styles.stubHeaderLabel}>★ ENJOY ★</Text>
                      <Text style={styles.stubHeaderSubtitle}>Your Coffee!</Text>
                    </View>

                    {/* Circular Mascot Emblem with dashed border */}
                    <View style={styles.stubMascotEmblem}>
                      <View style={styles.stubMascotCircle}>
                        <Image 
                          source={require('../../../assets/app/logo.png')} 
                          style={styles.stubMascotImg} 
                          resizeMode="contain" 
                        />
                      </View>
                    </View>

                    {/* Expiry Details */}
                    <View style={styles.stubExpiryBlock}>
                      <Text style={styles.stubExpiryLabel}>VALID UNTIL</Text>
                      <Text style={styles.stubExpiryValue}>{v.expiresAt}</Text>
                    </View>

                    {/* Voucher Code Action button */}
                    <View style={styles.stubActionBlock}>
                      <Text style={styles.stubCodeLabel}>VOUCHER NO.</Text>
                      <TouchableOpacity 
                        style={styles.stubCodePill} 
                        activeOpacity={0.8}
                      >
                        <Text style={styles.stubCodePillText} numberOfLines={1}>{v.code}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* Claim Voucher Modal */}
      <ClaimVoucherModal
        visible={claimModalVisible}
        onClose={handleCloseModal}
        achievement={selectedAchievement}
        earnedVouchers={earnedVouchers}
        availableVouchers={availableVouchers}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray200,
    marginBottom: 4,
  },
  backBtn: { padding: 4, marginLeft: -6 },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.primary.default,
  },
  scrollContent: { paddingBottom: 40, paddingTop: 16 },

  // Hero Loyalty Card Styles
  heroCard: {
    width: '100%',
    height: 275,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E8E5DF',
    backgroundColor: '#FDFBF7',
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#2D78CD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  heroTopRow: {
    height: 85,
    flexDirection: 'row',
    position: 'relative',
  },
  heroTopLeft: {
    flex: 1.9,
    paddingTop: 12,
    paddingLeft: 16,
    justifyContent: 'center',
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandMascotLogo: {
    width: 32,
    height: 32,
  },
  brandDivider: {
    width: 1.5,
    height: 22,
    backgroundColor: '#3D2B1F',
    marginHorizontal: 10,
    opacity: 0.25,
  },
  brandTextContainer: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#3D2B1F',
    lineHeight: 18,
  },
  brandSubtitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#3D2B1F',
    lineHeight: 12,
    marginTop: -2,
  },
  brandHeartDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '75%',
    marginVertical: 4,
  },
  brandHeartLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#82C1F9',
  },
  brandQuote: {
    fontFamily: 'Poppins-Bold',
    fontSize: 8,
    color: '#82C1F9',
    letterSpacing: 1.2,
  },
  heroTopRight: {
    flex: 1.1,
    backgroundColor: '#C5E3FF', // Sky blue curved top-right section
    borderBottomLeftRadius: 36, // Cloud curved look
    padding: 10,
    justifyContent: 'center',
    marginBottom: 8,
  },
  pointsCardLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10.5,
    color: '#3D2B1F',
    textAlign: 'center',
    lineHeight: 11,
  },
  pointsCardSublabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10.5,
    color: '#3D2B1F',
    textAlign: 'center',
    lineHeight: 11,
  },
  pointsCardDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  pointsCardLine: {
    width: 25,
    height: 0.8,
    backgroundColor: '#3D2B1F',
    opacity: 0.3,
  },
  earnPanelCapsule: {
    backgroundColor: '#3D2B1F',
    borderRadius: 8,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  earnPanelStarBg: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FAF9F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  earnPanelText: {
    flex: 1,
    fontFamily: 'Poppins-Bold',
    fontSize: 5.2,
    color: '#FAF9F5',
    lineHeight: 6.5,
  },
  heroBodyRow: {
    flex: 1,
    flexDirection: 'row',
  },
  stampsContainer: {
    flex: 1.9,
    backgroundColor: '#E6F3FF', // Lighter blue area
    padding: 12,
    justifyContent: 'center',
  },
  stampsGrid: {
    flex: 1,
    justifyContent: 'center',
  },
  stampsGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  stampCircleSlot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#82C1F9',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampCircleInner: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampCircleInnerActive: {
    backgroundColor: '#FFFFFF',
  },
  stampMascotActive: {
    width: 24,
    height: 24,
  },
  stampCircleNumber: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#BDD9FB',
  },
  freeDrinkSlot: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: -4,
  },
  freeDrinkInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#82C1F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  freeDrinkInnerActive: {
    backgroundColor: '#E1EEFA',
    borderColor: '#2D78CD',
  },
  freeDrinkTextTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 7.5,
    color: '#2D78CD',
    lineHeight: 8.5,
  },
  freeDrinkTextSub: {
    fontFamily: 'Poppins-Bold',
    fontSize: 7.5,
    color: '#2D78CD',
    lineHeight: 8.5,
  },
  freeDrinkCurvedText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 4.8,
    color: '#82C1F9',
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  instructionsContainer: {
    flex: 1.1,
    backgroundColor: '#FDFBF7',
    padding: 8,
    justifyContent: 'space-between',
    borderLeftWidth: 1,
    borderLeftColor: '#E8E5DF',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionIconBg: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#82C1F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  instructionText: {
    flex: 1,
    fontFamily: 'Poppins-Bold',
    fontSize: 5.5,
    color: '#3D2B1F',
    lineHeight: 7,
  },
  instructionLineDivider: {
    height: 0.8,
    backgroundColor: '#3D2B1F',
    opacity: 0.1,
    marginVertical: 1,
  },
  instructionFooter: {
    alignItems: 'center',
    marginTop: 4,
  },
  thankYouLabel: {
    fontFamily: 'Poppins-Bold',
    fontStyle: 'italic',
    fontSize: 7.5,
    color: '#3D2B1F',
  },
  thankYouSublabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 5,
    color: '#82C1F9',
    letterSpacing: 0.5,
  },
  heroRibbonRow: {
    height: 25,
    backgroundColor: '#82C1F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  ribbonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ribbonLeftText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 6.5,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  ribbonRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardNoLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 6,
    color: '#FFFFFF',
    marginRight: 4,
  },
  cardNoPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  cardNoText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 6.5,
    color: '#3D2B1F',
    letterSpacing: 0.2,
  },

  // Achievement Card
  achCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  achHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  achHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  achIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achCategory: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 10,
    color: '#FAF9F5',
    opacity: 0.75,
  },
  achLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: '#FAF9F5',
  },
  achCountText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FAF9F5',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  completeBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#FFD700',
  },
  achBody: { padding: 14 },
  achDesc: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: Colors.neutral.gray600,
    marginBottom: 12,
  },

  // Stamp Grid
  stampGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  stampSlot: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  stampSlotInactive: {
    backgroundColor: Colors.neutral.gray100,
    borderWidth: 1.5,
    borderColor: Colors.neutral.gray200,
    borderStyle: 'dashed',
  },
  stampSlotActive: {
    borderWidth: 1.5,
  },
  stampCheck: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#4CAF50',
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },

  // Progress Bar
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.neutral.gray100,
    borderRadius: 3,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Reward
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rewardText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
  },

  // Claim Button
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
  },
  claimBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#FAF9F5',
  },

  // History
  historyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  historyToggleText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF9F5',
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center' },
  historyName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: Colors.neutral.gray800,
  },
  historyDate: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: Colors.neutral.gray500,
    marginTop: 1,
  },
  historyStatus: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
  },

  // Vouchers
  voucherSection: { marginTop: 4 },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.primary.default,
    marginBottom: 12,
  },
  voucherItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },

  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdropTouch: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    paddingTop: 12,
    minHeight: 380,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.neutral.gray300,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  celebrationIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.primary.default,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: Colors.neutral.gray600,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  voucherCard: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  voucherCardLeft: {
    width: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voucherCardContent: {
    flex: 1,
    padding: 14,
  },
  voucherCardTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: Colors.neutral.gray800,
    marginBottom: 4,
  },
  voucherCardCode: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: Colors.neutral.gray600,
  },
  voucherCardExpiry: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: Colors.neutral.gray500,
    marginTop: 2,
  },
  bonusSection: {
    backgroundColor: '#FFFBF0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  bonusLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: Colors.neutral.gray700,
    marginBottom: 6,
  },
  bonusVoucherRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bonusVoucherText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: Colors.neutral.gray600,
  },
  claimActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  claimActionBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FAF9F5',
  },
  laterBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  laterBtnText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: Colors.neutral.gray500,
  },
  voucherSectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.primary.default,
    marginBottom: 14,
    marginTop: 6,
  },
  ticketWrapper: {
    flexDirection: 'row',
    width: '100%',
    height: 190,
    borderRadius: 16,
    overflow: 'visible', // Visible overflow so punch holes aren't clipped!
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#E8E5DF',
    backgroundColor: '#FDFBF7',
    position: 'relative',
    shadowColor: Colors.primary.default,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  // Punched circular hole styles to simulate physical ticket perforated scallops
  topCenterCutout: {
    position: 'absolute',
    top: -8,
    left: '67.5%',
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FAF9F5', // Match StampCard background color
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: '#E8E5DF',
  },
  bottomCenterCutout: {
    position: 'absolute',
    bottom: -8,
    left: '67.5%',
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FAF9F5',
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: '#E8E5DF',
  },
  leftEdgeCutout: {
    position: 'absolute',
    top: '50%',
    left: -8,
    marginTop: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FAF9F5',
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: '#E8E5DF',
  },
  rightEdgeCutout: {
    position: 'absolute',
    top: '50%',
    right: -8,
    marginTop: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FAF9F5',
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: '#E8E5DF',
  },
  leftTicket: {
    flex: 2.1,
    backgroundColor: '#FDFBF7', // Cream base color
    padding: 14,
    justifyContent: 'space-between',
    position: 'relative',
    borderTopLeftRadius: 16, // Match parent corner radius
    borderBottomLeftRadius: 16,
  },
  perforatedDivider: {
    width: 0.5,
    height: '100%',
    borderColor: 'rgba(61, 43, 31, 0.2)',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  rightTicketStub: {
    flex: 1,
    backgroundColor: '#82C1F9', // Solid sky blue
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopRightRadius: 16, // Match parent corner radius
    borderBottomRightRadius: 16,
  },
  logoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImg: {
    width: 24,
    height: 24,
  },
  logoDivider: {
    width: 1.2,
    height: 18,
    backgroundColor: '#3D2B1F',
    marginHorizontal: 8,
    opacity: 0.25,
  },
  logoTextContainer: {
    justifyContent: 'center',
  },
  logoTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11.5,
    color: '#3D2B1F',
    lineHeight: 12,
    letterSpacing: 0.2,
  },
  logoSubtitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 8,
    color: '#3D2B1F',
    lineHeight: 9,
    marginTop: -1,
  },
  sparkleDecoration: {
    position: 'absolute',
    top: 24,
    right: 20,
  },
  centerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  voucherMainTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#3D2B1F', // Espresso brown text
    letterSpacing: 2,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
    width: '80%',
    justifyContent: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#82C1F9',
  },
  voucherSubtitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 8,
    color: '#3D2B1F',
    letterSpacing: 1.2,
  },
  bottomDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueTag: {
    backgroundColor: '#82C1F9', // Sky blue tag
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 4,
    marginRight: 6,
  },
  valueTagText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 6.5,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  valueAmountText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#82C1F9',
    lineHeight: 18,
  },
  bottomRowDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#3D2B1F',
    marginHorizontal: 10,
    opacity: 0.2,
  },
  supportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  supportText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 6,
    color: '#3D2B1F',
    letterSpacing: 0.2,
    lineHeight: 7,
  },
  bottomRibbon: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: '#E6F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 14,
  },
  bottomRibbonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 6,
    color: '#82C1F9',
    letterSpacing: 1.5,
  },
  stubHeader: {
    alignItems: 'center',
  },
  stubHeaderLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 7.5,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  stubHeaderSubtitle: {
    fontFamily: 'Poppins-Bold',
    fontStyle: 'italic',
    fontSize: 9.5,
    color: '#FFFFFF',
  },
  stubMascotEmblem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stubMascotCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
    borderStyle: 'dashed', // Dashed border around circular avatar
  },
  stubMascotImg: {
    width: 32,
    height: 32,
  },
  stubExpiryBlock: {
    alignItems: 'center',
  },
  stubExpiryLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 6.5,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  stubExpiryValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 8,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginTop: -1,
  },
  stubActionBlock: {
    alignItems: 'center',
    width: '100%',
  },
  stubCodeLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 6.5,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 2,
  },
  stubCodePill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  stubCodePillText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 9,
    color: '#82C1F9',
    letterSpacing: 0.5,
  },
});
