import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Colors } from '../../../components/UI/Colors';
import LoyalCard from './loyalCard';

const { height } = Dimensions.get('window');

interface ListOfCardProps {
  visible: boolean;
  onClose: () => void;
  selectedTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  tierConfig: any;
  leshAcc?: string | null;
  leshExp?: string | null;
  userName?: string;
}

export default function ListOfCard({
  visible,
  onClose,
  selectedTier,
  tierConfig,
  leshAcc,
  leshExp,
  userName,
}: ListOfCardProps) {
  const translateY = useRef(new Animated.Value(height)).current;

  // Determine tier rank for locked/unlocked/current status
  const tierRanks: Record<string, number> = { Bronze: 1, Silver: 2, Gold: 3, Platinum: 4, Diamond: 5 };
  const currentRank = tierRanks[selectedTier] || 1;

  const getStatusText = (tier: string): string => {
    const rank = tierRanks[tier] || 1;
    if (rank === currentRank) return `${tier} Tier - Active (Current Tier)`;
    if (rank < currentRank) return `${tier} Tier - Unlocked`;
    return `${tier} Tier - Locked`;
  };

  const isLocked = (tier: string): boolean => (tierRanks[tier] || 1) > currentRank;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : height,
      tension: 38,
      friction: 8.5,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  return (
    <Animated.View 
      style={[
        StyleSheet.absoluteFillObject,
        styles.fullScreenContainer,
        { transform: [{ translateY }] }
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {/* Page Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary.default} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Membership Portfolio</Text>
        <View style={{ width: 32 }} />{/* Balancer */}
      </View>

      {/* Scrollable Gallery Content */}
      <ScrollView 
        style={styles.scrollBody} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.introText}>
          Tap any virtual membership card below to flip and inspect credentials. Tiers unlock automatically based on your order activity and loyalty status.
        </Text>

        {/* Bronze Card (Default) */}
        <LoyalCard 
          selectedTier="Bronze" 
          tierConfig={tierConfig} 
          isLocked={isLocked('Bronze')} 
          statusText={getStatusText('Bronze')}
          leshAcc={leshAcc}
          leshExp={leshExp}
          userName={userName}
        />

        {/* Silver Card */}
        <LoyalCard 
          selectedTier="Silver" 
          tierConfig={tierConfig} 
          isLocked={isLocked('Silver')} 
          statusText={getStatusText('Silver')}
          leshAcc={leshAcc}
          leshExp={leshExp}
          userName={userName}
        />

        {/* Gold Card */}
        <LoyalCard 
          selectedTier="Gold" 
          tierConfig={tierConfig} 
          isLocked={isLocked('Gold')} 
          statusText={getStatusText('Gold')}
          leshAcc={leshAcc}
          leshExp={leshExp}
          userName={userName}
        />

        {/* Platinum Card */}
        <LoyalCard 
          selectedTier="Platinum" 
          tierConfig={tierConfig} 
          isLocked={isLocked('Platinum')} 
          statusText={getStatusText('Platinum')}
          leshAcc={leshAcc}
          leshExp={leshExp}
          userName={userName}
        />

        {/* Diamond Card */}
        <LoyalCard 
          selectedTier="Diamond" 
          tierConfig={tierConfig} 
          isLocked={isLocked('Diamond')} 
          statusText={getStatusText('Diamond')}
          leshAcc={leshAcc}
          leshExp={leshExp}
          userName={userName}
        />
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAF9F5',
    zIndex: 999, // Ensure it overlaps other tabs completely
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray200,
    marginBottom: 16,
  },
  backBtn: {
    padding: 4,
    marginLeft: -6,
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.primary.default,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  introText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: Colors.neutral.gray600,
    lineHeight: 18,
    marginBottom: 24,
  },
});
