import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
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
      style={[styles.achCard, { borderColor: ach.accentColor }]}
    >
      {/* Card Header */}
      <View style={[styles.achHeader, { backgroundColor: ach.color }]}>
        <View style={styles.achHeaderLeft}>
          <View style={[styles.achIconBg, { backgroundColor: ach.accentColor }]}>
            <Ionicons name={ach.icon as any} size={20} color="#FAF9F5" />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.achCategory}>{ach.category}</Text>
            <Text style={styles.achLabel}>{ach.label}</Text>
          </View>
        </View>
        {isComplete ? (
          <View style={styles.completeBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#FFD700" style={{ marginRight: 4 }} />
            <Text style={styles.completeBadgeText}>Complete!</Text>
          </View>
        ) : (
          <Text style={styles.achCountText}>{ach.collected}/{ach.required}</Text>
        )}
      </View>

      {/* Stamp Grid */}
      <View style={styles.achBody}>
        <Text style={styles.achDesc}>{ach.description}</Text>

        <View style={styles.stampGrid}>
          {Array.from({ length: ach.required }).map((_, i) => {
            const isStamped = i < ach.collected;
            return (
              <View
                key={i}
                style={[
                  styles.stampSlot,
                  isStamped
                    ? [styles.stampSlotActive, { backgroundColor: ach.accentColor, borderColor: ach.color }]
                    : styles.stampSlotInactive,
                ]}
              >
                {isStamped ? (
                  <>
                    <Ionicons name={ach.icon.replace('-outline', '') as any} size={18} color="#FAF9F5" />
                    <View style={styles.stampCheck}>
                      <Ionicons name="checkmark" size={8} color="#FAF9F5" />
                    </View>
                  </>
                ) : (
                  <Ionicons name={ach.icon as any} size={18} color={Colors.neutral.gray300} />
                )}
              </View>
            );
          })}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: ach.accentColor }]} />
        </View>

        {/* Reward Row */}
        <View style={styles.rewardRow}>
          <Ionicons name="gift-outline" size={13} color={ach.accentColor} style={{ marginRight: 6 }} />
          <Text style={[styles.rewardText, { color: ach.accentColor }]}>Reward: {ach.reward}</Text>
        </View>

        {/* Claim Voucher Button (when complete) */}
        {isComplete && (
          <TouchableOpacity
            style={[styles.claimBtn, { backgroundColor: ach.accentColor }]}
            onPress={() => onClaimVoucher(ach)}
            activeOpacity={0.8}
          >
            <Ionicons name="gift" size={16} color="#FAF9F5" style={{ marginRight: 6 }} />
            <Text style={styles.claimBtnText}>Claim Voucher</Text>
          </TouchableOpacity>
        )}

        {/* History Toggle */}
        {ach.history.length > 0 && (
          <TouchableOpacity style={styles.historyToggle} onPress={() => setExpanded(!expanded)}>
            <Text style={[styles.historyToggleText, { color: ach.color }]}>
              {expanded ? 'Hide History' : `View History (${ach.history.length})`}
            </Text>
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={ach.color} />
          </TouchableOpacity>
        )}

        {expanded && ach.history.map((item) => (
          <View key={item.id} style={styles.historyItem}>
            <View style={styles.historyLeft}>
              <Ionicons name={ach.icon.replace('-outline', '') as any} size={16} color={ach.accentColor} style={{ marginRight: 8 }} />
              <View>
                <Text style={styles.historyName}>{item.product}</Text>
                <Text style={styles.historyDate}>{item.date} • {item.time}</Text>
              </View>
            </View>
            <Text style={[styles.historyStatus, { color: ach.accentColor }]}>Stamped</Text>
          </View>
        ))}
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
  const { data: dummyData } = useAppData();
  const achievements = dummyData.stamps.achievements;
  const earnedVouchers = dummyData.stamps.vouchers;
  const availableVouchers = dummyData.vouchers;

  const totalCollected = achievements.reduce((s, a) => s + a.collected, 0);
  const totalRequired = achievements.reduce((s, a) => s + a.required, 0);
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
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary.default} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lesh Stamp Card</Text>
        <View style={{ width: 32 }} />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Overall Summary - slide from bottom */}
        <Animated.View entering={SlideInDown.delay(100).springify().damping(18).stiffness(120)} style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryTitle}>Total Achievements</Text>
            <Text style={styles.summaryCount}>{totalCollected} <Text style={styles.summaryOf}>/ {totalRequired} stamps</Text></Text>
            <Text style={styles.summaryHint}>Collect across all categories to unlock rewards!</Text>
          </View>
          <Ionicons name="trophy" size={40} color="#FFD700" />
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
            {earnedVouchers.map((v) => (
              <View key={v.id} style={styles.voucherItem}>
                <View style={styles.historyLeft}>
                  <Ionicons name="pricetag" size={20} color="#FFD700" style={{ marginRight: 10 }} />
                  <View>
                    <Text style={styles.historyName}>{v.description}</Text>
                    <Text style={styles.historyDate}>Code: {v.code} • Expires {v.expiresAt}</Text>
                  </View>
                </View>
                <Text style={[styles.historyStatus, { color: v.used ? Colors.neutral.gray400 : '#2E7D32' }]}>
                  {v.used ? 'Used' : 'Active'}
                </Text>
              </View>
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

  // Summary
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary.default,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  summaryLeft: { flex: 1 },
  summaryTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: '#FAF9F5',
    opacity: 0.8,
  },
  summaryCount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#FAF9F5',
    marginVertical: 2,
  },
  summaryOf: {
    fontFamily: 'Poppins',
    fontSize: 16,
    opacity: 0.7,
  },
  summaryHint: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: '#FAF9F5',
    opacity: 0.65,
    marginTop: 4,
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
});
