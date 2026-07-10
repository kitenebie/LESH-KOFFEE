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
    id: string;
    tableNo: string;
    lineItems: { name: string; qty: number; price: number }[];
    total: number;
    subtotal?: number;
    deliveryFee?: number;
    discount?: number;
    voucherCode?: string | null;
    voucherDiscount?: number;
    subscriptionDiscount?: number;
  };
  onBack: () => void;
}

export default function GeneratedOrderQR({ order, onBack }: GeneratedOrderQRProps) {
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins in seconds

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
          <View style={styles.tableBadge}>
            <Text style={styles.tableBadgeText}>TABLE NO. {order.tableNo}</Text>
          </View>

          {/* QR Code Graphic Section */}
          <View style={styles.qrSection}>
            {/* Styled QR frame */}
            <View style={styles.qrBorder}>
              <QRCode
                value={JSON.stringify({
                  id: order.id,
                  tableNo: order.tableNo,
                  items: order.lineItems.map((item) => ({
                    name: item.name,
                    qty: item.qty,
                    price: item.price,
                  })),
                  subtotal: order.subtotal,
                  deliveryFee: order.deliveryFee,
                  subscriptionDiscount: order.subscriptionDiscount,
                  voucherDiscount: order.voucherDiscount,
                  voucherCode: order.voucherCode,
                  total: order.total,
                })}
                size={140}
                color={Colors.primary.default}
                backgroundColor="#FAF9F5"
              />
            </View>
            <Text style={styles.ticketId}>{order.id}</Text>
            
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
            {order.lineItems.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemQty}>{item.qty}x</Text>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemPrice}>₱{(item.price * item.qty).toFixed(2)}</Text>
              </View>
            ))}

            {order.subtotal !== undefined && (
              <View style={[styles.summaryMetaRow, { marginTop: 12, borderTopWidth: 1, borderTopColor: Colors.neutral.gray200, paddingTop: 8 }]}>
                <Text style={styles.summaryMetaLabel}>Subtotal</Text>
                <Text style={styles.summaryMetaVal}>₱{order.subtotal.toFixed(2)}</Text>
              </View>
            )}

            {order.deliveryFee !== undefined && order.deliveryFee > 0 && (
              <View style={styles.summaryMetaRow}>
                <Text style={styles.summaryMetaLabel}>Delivery Fee</Text>
                <Text style={styles.summaryMetaVal}>₱{order.deliveryFee.toFixed(2)}</Text>
              </View>
            )}

            {order.subscriptionDiscount !== undefined && order.subscriptionDiscount > 0 && (
              <View style={styles.summaryMetaRow}>
                <Text style={styles.summaryMetaLabel}>Subscription Discount</Text>
                <Text style={[styles.summaryMetaVal, { color: '#4CAF50' }]}>-₱{order.subscriptionDiscount.toFixed(2)}</Text>
              </View>
            )}

            {order.voucherCode && order.voucherDiscount !== undefined && order.voucherDiscount > 0 && (
              <View style={styles.summaryMetaRow}>
                <Text style={styles.summaryMetaLabel}>Voucher ({order.voucherCode})</Text>
                <Text style={[styles.summaryMetaVal, { color: '#4CAF50' }]}>-₱{order.voucherDiscount.toFixed(2)}</Text>
              </View>
            )}

            <View style={[styles.totalRow, order.subtotal === undefined && { borderTopWidth: 1 }]}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalVal}>₱{order.total.toFixed(2)}</Text>
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
