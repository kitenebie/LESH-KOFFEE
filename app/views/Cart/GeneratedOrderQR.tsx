import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../../../components/UI/Colors';

interface GeneratedOrderQRProps {
  order: {
    order_number: string;
    user_id: number;
    createdAt?: string; // ISO timestamp for timer persistence
    fulfillment: 'DineIn' | 'Delivery';
    ref_no: string | null; // table number
    payment_method: string;
    items: {
      product_id: number;
      name: string;
      quantity: number;
      price: number;
      customization?: any;
    }[];
    subtotal: number;
    delivery_fee: number;
    discount: number;
    total: number;
    voucherCode?: string | null; // for server-side re-validation
    voucherDiscount?: number;
    subscriptionDiscount?: number;
  };
  onBack: () => void;
}

export default function GeneratedOrderQR({ order, onBack }: GeneratedOrderQRProps) {
  // QR version for format validation on scanner side
  const QR_VERSION = 1;

  // Normalize legacy orders that may still be stored in SQLite with old field names
  const normalizedOrder = {
    ...order,
    order_number: order.order_number || (order as any).id || '',
    user_id: order.user_id ?? (order as any).user_id ?? 0,
    ref_no: order.ref_no ?? (order as any).tableNo ?? null,
    payment_method: order.payment_method || (order as any).payment_method || 'cash',
    items: order.items || ((order as any).lineItems || []).map((li: any) => ({
      product_id: li.product_id || 0,
      name: li.name,
      quantity: li.quantity ?? li.qty ?? 1,
      price: li.price,
      customization: li.customization ?? null,
    })),
    delivery_fee: order.delivery_fee ?? (order as any).deliveryFee ?? 0,
  };

  // Calculate time left based on creation time (persists through app restarts)
  const getInitialTimeLeft = () => {
    if (normalizedOrder.createdAt) {
      const elapsed = Math.floor((Date.now() - new Date(normalizedOrder.createdAt).getTime()) / 1000);
      const remaining = 3600 - elapsed; // 1 hour = 3600 sec
      return remaining > 0 ? remaining : 0;
    }
    return 3600;
  };

  const [timeLeft, setTimeLeft] = useState(getInitialTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // QR payload — matches Order model fields in LeshServer exactly
  const qrPayload = JSON.stringify({
    v: QR_VERSION,
    order_number: normalizedOrder.order_number,
    user_id: normalizedOrder.user_id,
    fulfillment: normalizedOrder.fulfillment,
    ref_no: normalizedOrder.ref_no,
    payment_method: normalizedOrder.payment_method,
    items: normalizedOrder.items.map((item) => ({
      product_id: item.product_id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      customization: item.customization ?? null,
    })),
    subtotal: normalizedOrder.subtotal,
    delivery_fee: normalizedOrder.delivery_fee,
    discount: normalizedOrder.discount,
    voucherCode: normalizedOrder.voucherCode ?? null,
    total: normalizedOrder.total,
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="close" size={20} color="#1D5FA7" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Ticket QR</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Ticket Container */}
        <View style={styles.ticketContainer}>
          {/* Main Top Section */}
          <View style={styles.ticketTopBody}>
            {/* Soft Wavy Header Decor */}
            <View style={styles.cloudWaveBg} pointerEvents="none" />
            
            {/* Top Mascot Emblem */}
            <View style={styles.mascotCircle}>
              <Image 
                source={require('../../../assets/app/logo.png')} 
                style={styles.mascotImg} 
                resizeMode="contain" 
              />
            </View>

            {/* Brand Title & Subtitle */}
            <Text style={styles.storeName}>Foam Coffee</Text>
            <Text style={styles.tagline}>Elevating Coffee Excellence</Text>

            <View style={styles.brandDividerRow}>
              <View style={styles.brandLine} />
              <Ionicons name="heart" size={10} color="#82C1F9" style={{ marginHorizontal: 6 }} />
              <View style={styles.brandLine} />
            </View>

            {/* Table Badge */}
            <View style={styles.tableBadge}>
              <Text style={styles.tableBadgeText}>
                {normalizedOrder.ref_no ? `TABLE NO. ${normalizedOrder.ref_no}` : (normalizedOrder.fulfillment === 'Delivery' ? 'DELIVERY ORDER' : 'DINE-IN ORDER')}
              </Text>
            </View>

            {/* QR Code Graphic Frame */}
            <View style={styles.qrFrame}>
              <QRCode
                value={qrPayload}
                size={175}
                color="#1D5FA7"
                backgroundColor="#FFFFFF"
              />
            </View>

            {/* Ticket Code Pill */}
            <View style={styles.ticketIdPill}>
              <View style={styles.ticketIdIconCircle}>
                <Ionicons name="receipt" size={12} color="#FFFFFF" />
              </View>
              <Text style={styles.ticketIdText}>{normalizedOrder.order_number}</Text>
            </View>

            {/* Timer */}
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={14} color="#E11D48" />
              <Text style={styles.timerText}>QR expires in: <Text style={styles.boldTimer}>{formatTime(timeLeft)}</Text></Text>
            </View>
          </View>

          {/* Perforated Cutout Separator */}
          <View style={styles.perforationWrapper}>
            <View style={styles.notchLeft} />
            <View style={styles.dashedSeparator} />
            <View style={styles.notchRight} />
          </View>

          {/* Order Summary Stub (Bottom Section) */}
          <View style={styles.summarySection}>
            <View style={styles.summaryTitleRow}>
              <View style={styles.summaryTitleIconBox}>
                <Ionicons name="clipboard" size={14} color="#1D5FA7" />
              </View>
              <Text style={styles.sectionTitle}>Order Summary</Text>
            </View>

            {/* Items */}
            {normalizedOrder.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemQty}>{item.quantity}x</Text>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemPrice}>₱{(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}

            <View style={styles.summaryDottedDivider} />

            {/* Breakdown */}
            {normalizedOrder.subtotal > 0 && (
              <View style={styles.summaryMetaRow}>
                <Text style={styles.summaryMetaLabel}>Subtotal</Text>
                <Text style={styles.summaryMetaVal}>₱{normalizedOrder.subtotal.toFixed(2)}</Text>
              </View>
            )}

            {normalizedOrder.delivery_fee > 0 && (
              <View style={styles.summaryMetaRow}>
                <Text style={styles.summaryMetaLabel}>Delivery Fee</Text>
                <Text style={styles.summaryMetaVal}>₱{normalizedOrder.delivery_fee.toFixed(2)}</Text>
              </View>
            )}

            {normalizedOrder.subscriptionDiscount !== undefined && normalizedOrder.subscriptionDiscount > 0 && (
              <View style={styles.summaryMetaRow}>
                <Text style={styles.summaryMetaLabel}>Subscription Discount</Text>
                <Text style={[styles.summaryMetaVal, { color: '#16A34A', fontFamily: 'Poppins-Bold' }]}>-₱{normalizedOrder.subscriptionDiscount.toFixed(2)}</Text>
              </View>
            )}

            {normalizedOrder.voucherCode && normalizedOrder.voucherDiscount !== undefined && normalizedOrder.voucherDiscount > 0 && (
              <View style={styles.summaryMetaRow}>
                <Text style={styles.summaryMetaLabel}>Voucher ({normalizedOrder.voucherCode})</Text>
                <Text style={[styles.summaryMetaVal, { color: '#16A34A', fontFamily: 'Poppins-Bold' }]}>-₱{normalizedOrder.voucherDiscount.toFixed(2)}</Text>
              </View>
            )}

            {(normalizedOrder as any).perkDiscount > 0 && (
              <View style={styles.summaryMetaRow}>
                <Text style={styles.summaryMetaLabel}>Subscriber Perk</Text>
                <Text style={[styles.summaryMetaVal, { color: '#16A34A', fontFamily: 'Poppins-Bold' }]}>-₱{(normalizedOrder as any).perkDiscount.toFixed(2)}</Text>
              </View>
            )}

            {/* Grand Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalVal}>
                {normalizedOrder.total === 0 && (normalizedOrder.payment_method === 'subscription' || (normalizedOrder.subscriptionDiscount ?? 0) > 0)
                  ? '₱0.00'
                  : `₱${normalizedOrder.total.toFixed(2)}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Instruction Card */}
        <View style={styles.instructionCard}>
          <View style={styles.instructionIconBox}>
            <Ionicons name="bulb" size={18} color="#1D5FA7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.instructionTitle}>Show this QR code to our staff</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Text style={styles.instructionSubtitle}>Thank you and enjoy your coffee! ☕</Text>
              <Ionicons name="heart" size={10} color="#93C5FD" style={{ marginLeft: 4 }} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FAFD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#F6FAFD',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#1D5FA7',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  ticketContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    shadowColor: '#1D5FA7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    overflow: 'hidden',
  },
  ticketTopBody: {
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  cloudWaveBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    backgroundColor: '#EEF6FE',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  mascotCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#1D5FA7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  mascotImg: {
    width: 52,
    height: 52,
  },
  storeName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#1D5FA7',
    lineHeight: 26,
  },
  tagline: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  brandDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    width: 140,
    justifyContent: 'center',
  },
  brandLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
  },
  tableBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    marginVertical: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  tableBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  qrFrame: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    marginVertical: 12,
    shadowColor: '#1D5FA7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  ticketIdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ticketIdIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  ticketIdText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#1E293B',
    letterSpacing: 0.8,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  timerText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: '#64748B',
  },
  boldTimer: {
    fontFamily: 'Poppins-Bold',
    color: '#DC2626',
  },
  perforationWrapper: {
    position: 'relative',
    height: 24,
    justifyContent: 'center',
  },
  notchLeft: {
    position: 'absolute',
    left: -12,
    top: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F6FAFD',
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 2,
  },
  notchRight: {
    position: 'absolute',
    right: -12,
    top: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F6FAFD',
    borderLeftWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 2,
  },
  dashedSeparator: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 1,
    marginHorizontal: 16,
  },
  summarySection: {
    padding: 24,
    paddingTop: 16,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryTitleIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#1D5FA7',
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  itemQty: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#2563EB',
    marginRight: 6,
    width: 24,
  },
  itemName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#334155',
    flex: 1,
  },
  itemPrice: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#1E293B',
  },
  summaryDottedDivider: {
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  summaryMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryMetaLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#64748B',
  },
  summaryMetaVal: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: '#1E293B',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#1D5FA7',
  },
  totalVal: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#16A34A',
  },
  instructionCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  instructionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  instructionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#1E3A8A',
  },
  instructionSubtitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: '#3B82F6',
  },
});
