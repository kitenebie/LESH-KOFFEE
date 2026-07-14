import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../../../components/UI/Colors';

const { height } = Dimensions.get('window');

interface SubscriptionQRCodeProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  planId: number;
  planName: string;
  userSubscriptionId: number;
  drinksRemaining: number;
}

export default function SubscriptionQRCode({
  visible,
  onClose,
  userId,
  planId,
  planName,
  userSubscriptionId,
  drinksRemaining,
}: SubscriptionQRCodeProps) {
  const translateY = useRef(new Animated.Value(height)).current;

  // QR payload — JSON string that the Filament scanner will parse
  const qrPayload = useMemo(() => {
    return JSON.stringify({
      type: 'subscription_redeem',
      user_id: userId,
      subscription_id: planId,
      user_subscription_id: userSubscriptionId,
      timestamp: new Date().toISOString(),
    });
  }, [userId, planId, userSubscriptionId]);

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
        { transform: [{ translateY }] },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary.default} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Redeem Drink</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Subscription Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconRow}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="cafe" size={24} color="#FFF" />
            </View>
          </View>
          <Text style={styles.planName}>{planName}</Text>
          <Text style={styles.drinksInfo}>
            {drinksRemaining} drink{drinksRemaining !== 1 ? 's' : ''} remaining
          </Text>
          <View style={styles.divider} />
          <Text style={styles.instructionText}>
            Show this QR code to the barista to redeem one drink from your subscription.
          </Text>
        </View>

        {/* QR Code Card */}
        <View style={styles.qrCard}>
          <QRCode
            value={qrPayload}
            size={200}
            color="#1A1A1A"
            backgroundColor="#FFFFFF"
            ecl="M"
          />
          <Text style={styles.qrLabel}>Scan to redeem</Text>
        </View>

        {/* Info footer */}
        <View style={styles.payloadInfo}>
          <Ionicons name="information-circle-outline" size={14} color={Colors.neutral.gray500} />
          <Text style={styles.payloadText} numberOfLines={2}>
            ID: {userSubscriptionId} • Plan: {planName}
          </Text>
        </View>
      </View>
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
    zIndex: 999,
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  infoIconRow: {
    marginBottom: 12,
  },
  infoIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.primary.default,
    marginBottom: 4,
  },
  drinksInfo: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 12,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: Colors.neutral.gray200,
    marginBottom: 12,
  },
  instructionText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: Colors.neutral.gray600,
    textAlign: 'center',
    lineHeight: 18,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  qrLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: Colors.neutral.gray600,
    marginTop: 14,
  },
  payloadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  payloadText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: Colors.neutral.gray500,
  },
});
