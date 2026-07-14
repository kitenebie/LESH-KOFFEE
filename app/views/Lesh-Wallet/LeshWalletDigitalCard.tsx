import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Colors } from '../../../components/UI/Colors';
import { useAppData } from '../../../lib/useAppData';

interface LeshWalletDigitalCardProps {
  walletBalance: number;
  onTopUpPress: () => void;
}

export default function LeshWalletDigitalCard({
  walletBalance,
  onTopUpPress
}: LeshWalletDigitalCardProps) {
  const { data: dummyData } = useAppData();

  return (
    <View style={styles.walletSectionCard}>
      <View style={styles.columnsRow}>
        {/* Left: Digital Wallet */}
        <View style={styles.column}>
          <Text style={styles.colLabel}>Lesh Digital Wallet</Text>
          <Text style={styles.walletCardVal}>₱{(Number(dummyData?.wallet?.balance) || walletBalance || 0).toFixed(2)}</Text>
          <TouchableOpacity style={styles.topUpBtn} onPress={onTopUpPress}>
            <Ionicons name="add-circle" size={14} color="#FAF9F5" style={{ marginRight: 4 }} />
            <Text style={styles.topUpBtnText}>Top Up</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Right: Loyalty Points */}
        <View style={[styles.column, { alignItems: 'flex-end' }]}>
          <Text style={styles.colLabel}>Lesh Loyalty Points</Text>
          <Text style={styles.walletCardVal}>{(Number(dummyData?.user?.loyaltyPoints) || 0).toLocaleString()}</Text>
          <View style={styles.pointsBadge}>
            <Ionicons name="star" size={12} color="#FFD700" style={{ marginRight: 4 }} />
            <Text style={styles.pointsBadgeText}>points</Text>
          </View>
        </View>
      </View>

      <Text style={styles.walletTipText}>Load cash to check out with 1 click & earn double points!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  walletSectionCard: {
    backgroundColor: Colors.primary.default,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  columnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flex: 1,
  },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(250,249,245,0.2)',
    marginHorizontal: 16,
  },
  colLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: '#FAF9F5',
    opacity: 0.8,
    marginBottom: 2,
  },
  walletCardVal: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#FAF9F5',
    marginBottom: 8,
  },
  topUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.secondary.default,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  topUpBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#FAF9F5',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250,249,245,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  pointsBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#FAF9F5',
  },
  walletTipText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: '#FAF9F5',
    opacity: 0.75,
    marginTop: 14,
  },
});
