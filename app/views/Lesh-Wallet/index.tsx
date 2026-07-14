import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import SubscriptionQRCode from './SubscriptionQRCode';
import SubscriptionRedeem from './SubscriptionRedeem';

import { useAppData } from '../../../lib/useAppData';

import { transferMoney } from '../../../services/walletService';

interface WalletViewProps {
  walletBalance: number;
  setShowTopUpModal: (show: boolean) => void;
  activeSubscription: string | null;
  subscriptionBalance: number;
  handleBuySubscription: (name: string, price: number, drinks: number, subscriptionId?: number) => void;
  showAlert: (title: string, message: string) => void;
  userSubscriptionId?: number;
  onOrderGenerated?: (order: any) => void;
}

const tierConfig = {
  Bronze: {
    baseColor: '#2C2118',
    borderColor: '#CD7F32',
    accent1: '#8B4513',
    accent2: '#CD7F32',
    textColor: '#FAF9F5',
    typeName: 'BRONZE DEBIT',
    levelName: 'BRONZE MEMBER',
  },

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
  handleBuySubscription,
  showAlert,
  userSubscriptionId = 0,
  onOrderGenerated,
}: WalletViewProps) {
  const { data: dummyData } = useAppData();

  const selectedTier = (dummyData?.user?.memberLevel as 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond') || 'Bronze';

  // Override tier color from stamp_quota_categories.color (server-driven)
  const serverTierColor = dummyData?.stampQuota?.tier?.color;
  const activeTierConfig = serverTierColor
    ? {
        ...tierConfig[selectedTier],
        borderColor: serverTierColor,
        accent2: serverTierColor,
      }
    : tierConfig[selectedTier];

  const [showTierSelector, setShowTierSelector] = useState(false);
  const [activeWalletTab, setActiveWalletTab] = useState<WalletTab>('subscription');
  const [walletTxExpanded, setWalletTxExpanded] = useState(false);
  const [loyaltyTxExpanded, setLoyaltyTxExpanded] = useState(false);

  // Send Money state
  const [showSendMoney, setShowSendMoney] = useState(false);

  // QR Code Redemption state
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrPlanId, setQrPlanId] = useState<number>(0);
  const [qrPlanName, setQrPlanName] = useState<string>('');

  const handleUseGiftCard = (planId: number, planName: string) => {
    // Use the actual active_subscription_id from user data (DB truth), fallback to card planId
    const actualPlanId = dummyData?.user?.activeSubscriptionId || planId;
    setQrPlanId(Number(actualPlanId));
    setQrPlanName(planName);
    setShowQRCode(true);
  };

  const [sendPhone, setSendPhone] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendNote, setSendNote] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMoney = async () => {
    const amount = parseFloat(sendAmount);
    const cleanPhone = sendPhone.replace(/[^0-9]/g, '');

    if (!cleanPhone || cleanPhone.length < 10) {
      showAlert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (isNaN(amount) || amount < 1) {
      showAlert('Invalid Amount', 'Please enter a valid amount (minimum ₱1).');
      return;
    }
    if (amount > walletBalance) {
      showAlert('Insufficient Balance', 'You don\'t have enough balance to send this amount.');
      return;
    }

    setIsSending(true);
    const fullPhone = `+63${cleanPhone}`;
    const result = await transferMoney(fullPhone, amount, sendNote.trim() || undefined);
    setIsSending(false);

    if (result.success) {
      setShowSendMoney(false);
      setSendPhone('');
      setSendAmount('');
      setSendNote('');
      showAlert('Money Sent! 💸', result.message);
    } else {
      showAlert('Transfer Failed', result.message);
    }
  };

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity 
              style={styles.cardSelectIconBtn}
              onPress={() => setShowSendMoney(true)}
            >
              <Ionicons name="send-outline" size={22} color={Colors.primary.default} />
            </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cardSelectIconBtn}
            onPress={() => setShowTierSelector(true)}
          >
            <Ionicons name="card-outline" size={26} color={Colors.primary.default} />
          </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollPadding}
      >
        {/* Flippable ATM Card — slides from LEFT to RIGHT */}
        <Animated.View entering={SlideInLeft.delay(300).duration(400)}>
          <LoyalCard
            selectedTier={selectedTier}
            tierConfig={{ ...tierConfig, [selectedTier]: activeTierConfig }}
            leshAcc={dummyData?.user?.leshAcc}
            leshExp={dummyData?.user?.leshExp}
            userName={dummyData?.user?.name}
          />
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
              onUseGiftCard={handleUseGiftCard}
              plans={dummyData?.subscriptions || []}
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
        leshAcc={dummyData?.user?.leshAcc}
        leshExp={dummyData?.user?.leshExp}
        userName={dummyData?.user?.name}
      />

      {/* Subscription QR Code Redemption Overlay */}
      <SubscriptionRedeem
        visible={showQRCode}
        onClose={() => setShowQRCode(false)}
        onOrderGenerated={(order) => {
          setShowQRCode(false);
          onOrderGenerated?.(order);
        }}
        userId={dummyData?.user?.id || ''}
        planId={qrPlanId}
        planName={qrPlanName}
        itemsAvailable={subscriptionBalance}
        subscriptionBalance={subscriptionBalance}
      />

      {/* Send Lesh Money Modal */}
      <Modal visible={showSendMoney} animationType="slide" transparent={true}>
        <View style={styles.sendMoneyOverlay}>
          <View style={styles.sendMoneyContainer}>
            <View style={styles.sendMoneyHeader}>
              <Ionicons name="send" size={32} color={Colors.secondary.default} />
              <Text style={styles.sendMoneyTitle}>Send Lesh Money</Text>
              <Text style={styles.sendMoneySubtitle}>
                Transfer funds to a friend's Lesh Digital Wallet
              </Text>
            </View>

            <View style={styles.sendMoneyBody}>
              <Text style={styles.sendMoneyLabel}>Recipient Mobile Number</Text>
              <View style={styles.sendMoneyInputRow}>
                <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14, color: Colors.primary.default, marginRight: 4 }}>+63</Text>
                <View style={{ width: 1, height: 20, backgroundColor: Colors.neutral.gray300, marginRight: 8 }} />
                <TextInput
                  style={styles.sendMoneyInput}
                  placeholder="9171234567"
                  placeholderTextColor={Colors.neutral.gray400}
                  value={sendPhone}
                  onChangeText={(text) => setSendPhone(text.replace(/[^0-9]/g, ''))}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              <Text style={styles.sendMoneyLabel}>Amount (₱)</Text>
              <View style={styles.sendMoneyInputRow}>
                <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: Colors.primary.default, marginRight: 4 }}>₱</Text>
                <TextInput
                  style={styles.sendMoneyInput}
                  placeholder="0.00"
                  placeholderTextColor={Colors.neutral.gray400}
                  value={sendAmount}
                  onChangeText={setSendAmount}
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.sendMoneyBalance}>
                Available Balance: ₱{walletBalance.toFixed(2)}
              </Text>

              <Text style={styles.sendMoneyLabel}>Note (Optional)</Text>
              <View style={styles.sendMoneyInputRow}>
                <Ionicons name="chatbubble-outline" size={16} color={Colors.neutral.gray400} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.sendMoneyInput}
                  placeholder="e.g. Coffee treat! ☕"
                  placeholderTextColor={Colors.neutral.gray400}
                  value={sendNote}
                  onChangeText={setSendNote}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.sendMoneyBtn, isSending && { opacity: 0.6 }]}
              onPress={handleSendMoney}
              activeOpacity={0.85}
              disabled={isSending}
            >
              {isSending
                ? <Text style={styles.sendMoneyBtnText}>Sending...</Text>
                : <><Ionicons name="paper-plane" size={16} color="#FFF" style={{ marginRight: 6 }} /><Text style={styles.sendMoneyBtnText}>Send Money</Text></>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sendMoneyCancelBtn}
              onPress={() => setShowSendMoney(false)}
            >
              <Text style={styles.sendMoneyCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

  // ─── Send Money Modal ──────────────────────────────────────────────────────────
  sendMoneyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sendMoneyContainer: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  sendMoneyHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sendMoneyTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.primary.default,
    marginTop: 8,
  },
  sendMoneySubtitle: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: Colors.neutral.gray600,
    textAlign: 'center',
    marginTop: 4,
  },
  sendMoneyBody: {
    marginBottom: 16,
  },
  sendMoneyLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: Colors.neutral.gray700,
    marginBottom: 6,
    marginTop: 12,
  },
  sendMoneyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7F3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendMoneyInput: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 14,
    color: Colors.primary.default,
    padding: 0,
  },
  sendMoneyBalance: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: Colors.neutral.gray500,
    marginTop: 4,
  },
  sendMoneyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary.default,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  sendMoneyBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFF',
  },
  sendMoneyCancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  sendMoneyCancelText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: Colors.neutral.gray500,
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
