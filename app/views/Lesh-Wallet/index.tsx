import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  FadeIn,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated';
import { Colors } from '../../../components/UI/Colors';
import LeshWalletDigitalCard from './LeshWalletDigitalCard';
import ListOfCard from './ListOfCard';
import LoyalCard from './loyalCard';
import Subscription from './Subscription';

import { useAppData } from '../../../lib/useAppData';

interface WalletViewProps {
  walletBalance: number;
  setShowTopUpModal: (show: boolean) => void;
  activeSubscription: string | null;
  subscriptionBalance: number;
  handleBuySubscription: (name: string, price: number, drinks: number, subscriptionId?: number) => void;
}

const tierConfig = {
  Silver: {
    baseColor: '#3A3A3C',
    borderColor: '#C0C0C0',
    accent1: '#7A7A7C',
    accent2: '#A5A5A7',
    textColor: '#FAF9F5',
    typeName: 'SILVER DEBIT',
    levelName: 'SILVER MEMBER',
  },
  Gold: {
    baseColor: '#3F2F23',
    borderColor: '#D4AF37',
    accent1: '#B36534',
    accent2: '#D4AF37',
    textColor: '#FAF9F5',
    typeName: 'GOLD DEBIT',
    levelName: 'GOLD MEMBER',
  },
  Platinum: {
    baseColor: '#1C2E3D',
    borderColor: '#A3B8CC',
    accent1: '#4F759B',
    accent2: '#A3B8CC',
    textColor: '#FAF9F5',
    typeName: 'PLATINUM DEBIT',
    levelName: 'PLATINUM MEMBER',
  },
  Diamond: {
    baseColor: '#241835',
    borderColor: '#E0AAFF',
    accent1: '#7B2CBF',
    accent2: '#E0AAFF',
    textColor: '#FAF9F5',
    typeName: 'DIAMOND DEBIT',
    levelName: 'DIAMOND MEMBER',
  },
};

type WalletTab = 'subscription' | 'transactions';

export default function WalletView({
  walletBalance,
  setShowTopUpModal,
  activeSubscription,
  subscriptionBalance,
  handleBuySubscription
}: WalletViewProps) {
  const { data: dummyData } = useAppData();

  const selectedTier = 'Gold';
  const [showTierSelector, setShowTierSelector] = useState(false);
  const [activeWalletTab, setActiveWalletTab] = useState<WalletTab>('subscription');
  const [walletTxExpanded, setWalletTxExpanded] = useState(false);
  const [loyaltyTxExpanded, setLoyaltyTxExpanded] = useState(false);

  const walletTransactions = dummyData?.wallet?.transactions || [];
  const loyaltyTransactions = dummyData?.loyaltyTransactions || [];

  return (
    <Animated.View
      entering={SlideInDown.duration(400)}
      style={styles.rootContainer}
    >
      {/* Wallet Header Row with Cards Selector Icon */}
      <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.paddedHeader}>
        <View style={styles.pageHeaderRow}>
          <Text style={styles.tabTitle}>Lesh Wallet</Text>
          <TouchableOpacity 
            style={styles.cardSelectIconBtn}
            onPress={() => setShowTierSelector(true)}
          >
            <Ionicons name="card-outline" size={26} color={Colors.primary.default} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollPadding}
      >
        {/* Flippable ATM Card — slides from LEFT to RIGHT */}
        <Animated.View entering={SlideInLeft.delay(300).duration(400)}>
          <LoyalCard selectedTier={selectedTier} tierConfig={tierConfig} />
        </Animated.View>

        {/* Digital Wallet & Loyalty Points Card — slides from RIGHT to LEFT */}
        <Animated.View entering={SlideInRight.delay(500).duration(400)}>
          <LeshWalletDigitalCard 
            walletBalance={walletBalance} 
            onTopUpPress={() => setShowTopUpModal(true)} 
          />
        </Animated.View>

        {/* Tab Selector */}
        <Animated.View entering={SlideInDown.delay(600).duration(400)} style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeWalletTab === 'subscription' && styles.tabBtnActive]}
            onPress={() => setActiveWalletTab('subscription')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="card-outline" 
              size={16} 
              color={activeWalletTab === 'subscription' ? '#FAF9F5' : Colors.neutral.gray600} 
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabBtnText, activeWalletTab === 'subscription' && styles.tabBtnTextActive]}>
              Prepaid Subscription
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeWalletTab === 'transactions' && styles.tabBtnActive]}
            onPress={() => setActiveWalletTab('transactions')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="receipt-outline" 
              size={16} 
              color={activeWalletTab === 'transactions' ? '#FAF9F5' : Colors.neutral.gray600} 
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabBtnText, activeWalletTab === 'transactions' && styles.tabBtnTextActive]}>
              Transactions
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Tab Content */}
        {activeWalletTab === 'subscription' && (
          <Animated.View entering={SlideInLeft.duration(350)}>
            <Subscription 
              activeSubscription={activeSubscription}
              subscriptionBalance={subscriptionBalance}
              onBuySubscription={handleBuySubscription}
            />
          </Animated.View>
        )}

        {activeWalletTab === 'transactions' && (
          <Animated.View entering={SlideInRight.duration(350)}>
            {/* Digital Wallet Transactions */}
            <View style={styles.transactionSection}>
              <TouchableOpacity
                style={styles.transactionSectionHeader}
                onPress={() => setWalletTxExpanded(!walletTxExpanded)}
                activeOpacity={0.7}
              >
                <Ionicons name="wallet-outline" size={18} color={Colors.primary.default} style={{ marginRight: 8 }} />
                <Text style={styles.transactionSectionTitle}>Lesh Digital Wallet</Text>
                <View style={styles.txHeaderRight}>
                  <Text style={styles.txCountBadge}>{walletTransactions.length}</Text>
                  <Ionicons name={walletTxExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.neutral.gray500} />
                </View>
              </TouchableOpacity>
              {walletTxExpanded && walletTransactions.map((tx, index) => (
                <Animated.View
                  key={tx.id}
                  entering={index % 2 === 0 ? SlideInLeft.delay(60 + index * 60).duration(350) : SlideInRight.delay(60 + index * 60).duration(350)}
                  style={styles.transactionItem}
                >
                  <View style={[styles.txIconBg, { backgroundColor: tx.type === 'credit' ? '#E8F5E9' : '#FFEBEE' }]}>
                    <Ionicons 
                      name={tx.type === 'credit' ? 'arrow-down' : 'arrow-up'} 
                      size={16} 
                      color={tx.type === 'credit' ? '#2E7D32' : '#C62828'} 
                    />
                  </View>
                  <View style={styles.txContent}>
                    <Text style={styles.txDescription}>{tx.description}</Text>
                    <Text style={styles.txDate}>{tx.date}</Text>
                  </View>
                  <Text style={[styles.txAmount, { color: tx.type === 'credit' ? '#2E7D32' : '#C62828' }]}>
                    {tx.type === 'credit' ? '+' : '-'}₱{tx.amount.toFixed(2)}
                  </Text>
                </Animated.View>
              ))}
            </View>

            {/* Loyalty Points Transactions */}
            <View style={styles.transactionSection}>
              <TouchableOpacity
                style={styles.transactionSectionHeader}
                onPress={() => setLoyaltyTxExpanded(!loyaltyTxExpanded)}
                activeOpacity={0.7}
              >
                <Ionicons name="star-outline" size={18} color="#FFD700" style={{ marginRight: 8 }} />
                <Text style={styles.transactionSectionTitle}>Lesh Loyalty Points</Text>
                <View style={styles.txHeaderRight}>
                  <Text style={styles.txCountBadge}>{loyaltyTransactions.length}</Text>
                  <Ionicons name={loyaltyTxExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.neutral.gray500} />
                </View>
              </TouchableOpacity>
              {loyaltyTxExpanded && loyaltyTransactions.map((tx, index) => {
                const isPositive = tx.type === 'earned' || tx.type === 'bonus';
                return (
                  <Animated.View
                    key={tx.id}
                    entering={index % 2 === 0 ? SlideInRight.delay(60 + index * 60).duration(350) : SlideInLeft.delay(60 + index * 60).duration(350)}
                    style={styles.transactionItem}
                  >
                    <View style={[styles.txIconBg, { backgroundColor: isPositive ? '#FFF8E1' : '#F3E5F5' }]}>
                      <Ionicons 
                        name={tx.type === 'bonus' ? 'gift' : isPositive ? 'star' : 'pricetag'} 
                        size={16} 
                        color={isPositive ? '#F9A825' : '#7B1FA2'} 
                      />
                    </View>
                    <View style={styles.txContent}>
                      <Text style={styles.txDescription}>{tx.description}</Text>
                      <Text style={styles.txDate}>{tx.date} • {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: isPositive ? '#F9A825' : '#7B1FA2' }]}>
                      {isPositive ? '+' : '-'}{tx.points} pts
                    </Text>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <ListOfCard 
        visible={showTierSelector}
        onClose={() => setShowTierSelector(false)}
        selectedTier={selectedTier}
        tierConfig={tierConfig}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  paddedHeader: {
    paddingHorizontal: 28,
    paddingTop: 24,
  },
  scrollPadding: {
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  pageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tabTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    color: Colors.primary.default,
  },
  cardSelectIconBtn: {
    padding: 6,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: Colors.primary.default,
  },
  tabBtnText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: Colors.neutral.gray600,
  },
  tabBtnTextActive: {
    color: '#FAF9F5',
  },

  // Transactions
  transactionSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
  },
  transactionSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  transactionSectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: Colors.primary.default,
    flex: 1,
  },
  txHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txCountBadge: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: '#FAF9F5',
    backgroundColor: Colors.neutral.gray400,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray100,
  },
  txIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txContent: {
    flex: 1,
  },
  txDescription: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: Colors.neutral.gray800,
  },
  txDate: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: Colors.neutral.gray500,
    marginTop: 2,
  },
  txAmount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
  },
});
