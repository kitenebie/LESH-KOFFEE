import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Colors } from '../../../components/UI/Colors';

interface SubscriptionProps {
  activeSubscription: string | null;
  subscriptionBalance: number;
  onBuySubscription: (name: string, price: number, drinks: number, subscriptionId?: number) => void;
}

export default function Subscription({
  activeSubscription,
  subscriptionBalance,
  onBuySubscription
}: SubscriptionProps) {
  return (
    <View style={styles.subSectionCard}>
      <Text style={styles.subSectionTitle}>Prepaid Subscriptions</Text>
      <Text style={styles.subSectionDesc}>Buy monthly packages upfront to lock in discounts!</Text>
      
      {activeSubscription && (
        <View style={styles.activeSubIndicator}>
          <Ionicons name="checkmark-circle" size={18} color="#FAF9F5" style={{ marginRight: 6 }} />
          <Text style={styles.activeSubIndicatorText}>
            Active Package: {activeSubscription} ({subscriptionBalance} drinks left)
          </Text>
        </View>
      )}

      <View style={styles.subPackageList}>
        <View style={styles.subPackageRow}>
          <View style={styles.subPackageInfo}>
            <Text style={styles.subPackageName}>Daily Grind</Text>
            <Text style={styles.subPackageDetail}>10 Hot Drinks (Save ₱350)</Text>
          </View>
          <TouchableOpacity 
            style={styles.buySubBtn}
            onPress={() => onBuySubscription('Daily Grind', 750, 10, 1)}
          >
            <Text style={styles.buySubBtnText}>₱750</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.subPackageRow}>
          <View style={styles.subPackageInfo}>
            <Text style={styles.subPackageName}>Barista Choice</Text>
            <Text style={styles.subPackageDetail}>15 Coffee Drinks (Save ₱600)</Text>
          </View>
          <TouchableOpacity 
            style={styles.buySubBtn}
            onPress={() => onBuySubscription('Barista Choice', 1200, 15, 2)}
          >
            <Text style={styles.buySubBtnText}>₱1,200</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.subPackageRow}>
          <View style={styles.subPackageInfo}>
            <Text style={styles.subPackageName}>Lesh Connoisseur</Text>
            <Text style={styles.subPackageDetail}>30 Coffee Drinks (Save ₱1,500)</Text>
          </View>
          <TouchableOpacity 
            style={styles.buySubBtn}
            onPress={() => onBuySubscription('Lesh Connoisseur', 2000, 30, 3)}
          >
            <Text style={styles.buySubBtnText}>₱2,000</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  subSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
  },
  subSectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.primary.default,
  },
  subSectionDesc: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: Colors.neutral.gray600,
    marginBottom: 14,
  },
  activeSubIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary.default,
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  activeSubIndicatorText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#FAF9F5',
  },
  subPackageList: {
    width: '100%',
  },
  subPackageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray200,
  },
  subPackageInfo: {
    flex: 1,
    paddingRight: 10,
  },
  subPackageName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: Colors.primary.default,
  },
  subPackageDetail: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: Colors.neutral.gray600,
    marginTop: 2,
  },
  buySubBtn: {
    backgroundColor: Colors.primary.default,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  buySubBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#FFF',
  },
});
