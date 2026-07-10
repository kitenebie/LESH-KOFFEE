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
  selectedTier: 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  tierConfig: any;
}

export default function ListOfCard({
  visible,
  onClose,
  selectedTier,
  tierConfig
}: ListOfCardProps) {
  const translateY = useRef(new Animated.Value(height)).current;

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

        {/* Silver Card */}
        <LoyalCard 
          selectedTier="Silver" 
          tierConfig={tierConfig} 
          isLocked={false} 
          statusText="Silver Tier - Unlocked"
        />

        {/* Gold Card */}
        <LoyalCard 
          selectedTier="Gold" 
          tierConfig={tierConfig} 
          isLocked={false} 
          statusText="Gold Tier - Active (Current Tier)"
        />

        {/* Platinum Card */}
        <LoyalCard 
          selectedTier="Platinum" 
          tierConfig={tierConfig} 
          isLocked={true} 
          statusText="Platinum Tier - Locked (Earn at 20 stamps)"
        />

        {/* Diamond Card */}
        <LoyalCard 
          selectedTier="Diamond" 
          tierConfig={tierConfig} 
          isLocked={true} 
          statusText="Diamond Tier - Locked (Earn at 50 stamps)"
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
