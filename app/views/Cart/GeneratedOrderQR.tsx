import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Button } from '../../../components/UI/Button';
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
    v: QR_VERSION, // version for future-proofing format validation
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
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={Colors.primary.default} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Ticket QR</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Ticket Container */}
        <View style={styles.ticketCard}>
          {/* Top Notch Cutout design */}
          <View style={styles.notchLeft} />
          <View style={styles.notchRight} />

          {/* Ticket Header */}
          <View style={styles.ticketHeader}>
            <Ionicons name="cafe" size={28} color={Colors.secondary.default} />
            <Text style={styles.storeName}>Lesh Kaffe × Pasalubong</Text>
            <Text style={styles.tagline}>A Taste of Home & Heritage</Text>
          </View>

          {/* Table Badge */}
          {normalizedOrder.ref_no && <View style={styles.tableBadge}>
            <Text style={styles.tableBadgeText}>TABLE NO. {normalizedOrder.ref_no}</Text>
          </View>
          }

          {/* QR Code Graphic Section */}
          <View style={styles.qrSection}>
            {/* Styled QR frame */}
            <View style={styles.qrBorder}>
              <QRCode
                value={qrPayload}
                size={140}
                color={Colors.primary.default}
                backgroundColor="#FAF9F5"
              />
            </View>
            <Text style={styles.ticketId}>{normalizedOrder.order_number}</Text>
            
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={14} color={Colors.danger.default} />
              <Text style={styles.timerText}>QR expires in: <Text style={styles.boldTimer}>{formatTime(timeLeft)}</Text></Text>
            </View>
          </View>

          {/* Line Separator */}
          <View style={styles.dashedSeparator} />

          {/* Order Summary list inside Ticket */}
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            {normalizedOrder.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemQty}>{item.quantity}x</Text>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemPrice}>₱{(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}

            {normalizedOrder.subtotal > 0 && (
              <View style={[styles.summaryMetaRow, { marginTop: 12, borderTopWidth: 1, borderTopColor: Colors.neutral.gray200, paddingTop: 8 }]}>
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
                <Text style={[styles.summaryMetaVal, { color: '#4CAF50' }]}>-₱{normalizedOrder.subscriptionDiscount.toFixed(2)}</Text>
              </View>
            )}

            {normalizedOrder.voucherCode && normalizedOrder.voucherDiscount !== undefined && normalizedOrder.voucherDiscount > 0 && (
              <View style={styles.summaryMetaRow}>
                <Text style={styles.summaryMetaLabel}>Voucher ({normalizedOrder.voucherCode})</Text>
                <Text style={[styles.summaryMetaVal, { color: '#4CAF50' }]}>-₱{normalizedOrder.voucherDiscount.toFixed(2)}</Text>
              </View>
            )}

            {(normalizedOrder as any).perkDiscount > 0 && (
              <View style={styles.summaryMetaRow}>
                <Text style={styles.summaryMetaLabel}>Subscriber Perk</Text>
                <Text style={[styles.summaryMetaVal, { color: '#4CAF50' }]}>-₱{(normalizedOrder as any).perkDiscount.toFixed(2)}</Text>
              </View>
            )}

            {/* Show discount line — when discount exists */}
            {normalizedOrder.discount > 0 &&
              !(normalizedOrder.subscriptionDiscount > 0) && !(normalizedOrder.voucherDiscount > 0) && (
              <View style={styles.summaryMetaRow}>
                <Text style={styles.summaryMetaLabel}>Discount</Text>
                <Text style={[styles.summaryMetaVal, { color: '#4CAF50' }]}>-₱{normalizedOrder.discount.toFixed(2)}</Text>
              </View>
            )}

            <View style={[styles.totalRow, normalizedOrder.subtotal === undefined && { borderTopWidth: 1 }]}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={[styles.totalVal, normalizedOrder.total === 0 && { color: '#4CAF50' }]}>
                {normalizedOrder.total === 0 && normalizedOrder.payment_method === 'subscription'
                  ? 'FREE ☕'
                  : `₱${normalizedOrder.total.toFixed(2)}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Prompt description */}
        <View style={styles.instructionCard}>
          <Ionicons name="information-circle" size={20} color={Colors.primary.default} />
          <Text style={styles.instructionText}>
            Pakita lamang ang QR code na ito sa cashier o barista upang i-scan at simulan ang paggawa ng iyong order. Maaari kang magbayad doon via Cash o Card.
          </Text>
        </View>

        {/* Action Button */}
        <Button
          title="Done & Back to Home"
          variant="primary"
          onPress={onBack}
          style={styles.doneBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray200,
    backgroundColor: '#FAF9F5',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F0E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.primary.default,
  },
  scrollBody: {
    padding: 24,
    paddingBottom: 48,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
    padding: 24,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  notchLeft: {
    position: 'absolute',
    left: -11,
    top: '68%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
  },
  notchRight: {
    position: 'absolute',
    right: -11,
    top: '68%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
  },
  ticketHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  storeName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.primary.default,
    marginTop: 6,
  },
  tagline: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: Colors.neutral.gray500,
  },
  tableBadge: {
    backgroundColor: Colors.primary.default,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
 tableBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#FAF9F5',
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrBorder: {
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary.default,
    borderRadius: 20,
    backgroundColor: '#FAF9F5',
    marginBottom: 12,
  },
  qrImage: {
    width: 260,
    height: 260,
  },
  ticketId: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: Colors.neutral.gray800,
    letterSpacing: 2,
    marginBottom: 6,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: Colors.neutral.gray600,
  },
  boldTimer: {
    fontFamily: 'Poppins-Bold',
    color: Colors.danger.default,
  },
  dashedSeparator: {
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
    borderStyle: 'dashed',
    borderRadius: 1,
    marginVertical: 18,
  },
  summarySection: {
    paddingTop: 4,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: Colors.primary.default,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  itemQty: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: Colors.secondary.default,
    marginRight: 6,
    width: 24,
  },
  itemName: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: Colors.neutral.gray700,
    flex: 1,
  },
  itemPrice: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: Colors.neutral.gray800,
  },
  summaryMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryMetaLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: Colors.neutral.gray600,
  },
  summaryMetaVal: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: Colors.neutral.gray800,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.gray200,
  },
  totalLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: Colors.primary.default,
  },
  totalVal: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: Colors.secondary.default,
  },
  instructionCard: {
    flexDirection: 'row',
    backgroundColor: '#F3F0E6',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
  },
  instructionText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 11,
    color: Colors.neutral.gray700,
    lineHeight: 16,
  },
  doneBtn: {
    height: 50,
  },
});
