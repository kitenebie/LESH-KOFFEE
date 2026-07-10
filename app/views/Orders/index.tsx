import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated';
import { Colors } from '../../../components/UI/Colors';
import OrderStatusView from './orderStatus';

import { useAppData } from '../../../lib/useAppData';

type FulfillmentMode = 'DineIn' | 'Delivery';
type StepKey = 'queue' | 'preparing' | 'ready' | 'delivery' | 'received' | 'rate';

interface OrderLineItem {
  name: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  date: string;
  time: string;
  status: string;
  currentStep: StepKey;
  lineItems: OrderLineItem[];
  fulfillment: FulfillmentMode;
  subtotal: number;
  deliveryFee?: number;
  discount?: number;
  total: number;
  cashier?: string;
  tableNo?: string;
}

// ─── Dashed separator component ──────────────────────────────────────────────
function DashedLine() {
  return (
    <View style={styles.dashedRow}>
      {Array.from({ length: 28 }).map((_, i) => (
        <View key={i} style={styles.dashSegment} />
      ))}
    </View>
  );
}

// ─── Torn-edge scallop row ────────────────────────────────────────────────────
function TornEdge({ inverted = false }: { inverted?: boolean }) {
  const circles = Array.from({ length: 10 });
  return (
    <View style={[styles.tornEdgeRow, inverted && styles.tornEdgeRowInverted]}>
      {/* Left notch */}
      <View style={[styles.notchCircle, styles.notchLeft, inverted && styles.notchInverted]} />
      {/* Dashes across */}
      {circles.map((_, i) => (
        <View key={i} style={styles.tornDash} />
      ))}
      {/* Right notch */}
      <View style={[styles.notchCircle, styles.notchRight, inverted && styles.notchInverted]} />
    </View>
  );
}

// ─── Active Order Receipt Card ────────────────────────────────────────────────
function ReceiptCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const fulfillmentLabel = order.fulfillment === 'DineIn' ? 'Dine In' : 'Delivery';

  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={styles.receiptWrapper}>
      {/* ── Header band ── */}
      <View style={styles.receiptHeader}>
        <View style={styles.receiptHeaderLeft}>
          <Text style={styles.receiptBrand}>Lesh Kaffe × Pasalubong</Text>
          <Text style={styles.receiptBrandSub}>Official Order Receipt</Text>
        </View>
        <View style={styles.receiptLogoCircle}>
          <Ionicons name="cafe" size={22} color="#FAF9F5" />
        </View>
      </View>

      {/* ── Top body ── */}
      <View style={styles.receiptBody}>
        {/* Order meta */}
        <View style={styles.receiptMetaRow}>
          <View style={styles.receiptMetaCol}>
            <Text style={styles.receiptMetaLabel}>ORDER NO.</Text>
            <Text style={styles.receiptMetaValue}>#{order.id}</Text>
          </View>
          <View style={styles.receiptMetaCol}>
            <Text style={styles.receiptMetaLabel}>DATE</Text>
            <Text style={styles.receiptMetaValue}>{order.date}</Text>
          </View>
          <View style={styles.receiptMetaCol}>
            <Text style={styles.receiptMetaLabel}>TIME</Text>
            <Text style={styles.receiptMetaValue}>{order.time}</Text>
          </View>
        </View>

        <View style={styles.receiptMetaRow}>
          <View style={styles.receiptMetaCol}>
            <Text style={styles.receiptMetaLabel}>TYPE</Text>
            <Text style={styles.receiptMetaValue}>{fulfillmentLabel}</Text>
          </View>
          {order.tableNo && (
            <View style={styles.receiptMetaCol}>
              <Text style={styles.receiptMetaLabel}>TABLE</Text>
              <Text style={styles.receiptMetaValue}>{order.tableNo}</Text>
            </View>
          )}
          {order.cashier && (
            <View style={styles.receiptMetaCol}>
              <Text style={styles.receiptMetaLabel}>SERVED BY</Text>
              <Text style={styles.receiptMetaValue}>{order.cashier}</Text>
            </View>
          )}
        </View>

        <DashedLine />

        {/* Column headers */}
        <View style={styles.receiptItemHeader}>
          <Text style={[styles.receiptItemHeaderText, { flex: 3 }]}>ITEM</Text>
          <Text style={[styles.receiptItemHeaderText, { width: 30, textAlign: 'center' }]}>QTY</Text>
          <Text style={[styles.receiptItemHeaderText, { width: 70, textAlign: 'right' }]}>PRICE</Text>
        </View>

        {/* Line items */}
        {order.lineItems.map((item, i) => (
          <View key={i} style={styles.receiptLineItem}>
            <Text style={[styles.receiptItemName, { flex: 3 }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.receiptItemQty, { width: 30 }]}>x{item.qty}</Text>
            <Text style={[styles.receiptItemPrice, { width: 70 }]}>
              ₱{(item.price * item.qty).toFixed(2)}
            </Text>
          </View>
        ))}

        <DashedLine />

        {/* Totals */}
        <View style={styles.receiptTotalRow}>
          <Text style={styles.receiptTotalLabel}>Subtotal</Text>
          <Text style={styles.receiptTotalVal}>₱{order.subtotal.toFixed(2)}</Text>
        </View>
        {order.deliveryFee !== undefined && order.deliveryFee > 0 && (
          <View style={styles.receiptTotalRow}>
            <Text style={styles.receiptTotalLabel}>Delivery Fee</Text>
            <Text style={styles.receiptTotalVal}>₱{order.deliveryFee.toFixed(2)}</Text>
          </View>
        )}
        {order.discount !== undefined && order.discount > 0 && (
          <View style={styles.receiptTotalRow}>
            <Text style={styles.receiptTotalLabel}>Discount</Text>
            <Text style={[styles.receiptTotalVal, { color: '#4CAF50' }]}>
              -₱{order.discount.toFixed(2)}
            </Text>
          </View>
        )}

        <DashedLine />

        <View style={[styles.receiptTotalRow, { marginTop: 6 }]}>
          <Text style={styles.receiptGrandLabel}>TOTAL</Text>
          <Text style={styles.receiptGrandVal}>₱{order.total.toFixed(2)}</Text>
        </View>
      </View>

      {/* ── Tear strip ── */}
      <TornEdge />

      {/* ── Status footer ── */}
      <View style={styles.receiptFooter}>
        <View style={styles.receiptStatusPill}>
          <View style={styles.receiptStatusDot} />
          <Text style={styles.receiptStatusText}>{order.status}</Text>
        </View>
        <View style={styles.receiptTapHint}>
          <Text style={styles.receiptTapHintText}>Tap to track</Text>
          <Ionicons name="arrow-forward" size={12} color={Colors.secondary.default} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────
export default function OrdersView() {
  const { data: dummyData } = useAppData();

  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);

  const activeOrders: Order[] = dummyData.orders.active as Order[];
  const pastOrders: Order[] = dummyData.orders.past as Order[];

  const openStatus = (order: Order) => setSelectedOrder(order);
  const closeStatus = () => setSelectedOrder(null);

  // Map Order to the props OrderStatusView expects
  const selectedItems = selectedOrder
    ? selectedOrder.lineItems.map((li) => `${li.qty}x ${li.name}`).join(', ')
    : '';

  return (
    <Animated.View
      entering={SlideInDown.duration(400)}
      style={styles.tabViewContainer}
    >
      <Animated.View entering={FadeIn.delay(200).duration(400)}>
        <Text style={styles.tabTitle}>My Orders</Text>
      </Animated.View>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Active orders (receipt style) ── */}
        {activeOrders.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Active Orders</Text>
            {activeOrders.map((order, index) => (
              <Animated.View key={order.id} entering={index % 2 === 0 ? SlideInLeft.delay(300 + index * 100).duration(400) : SlideInRight.delay(300 + index * 100).duration(400)}>
                <ReceiptCard order={order} onPress={() => openStatus(order)} />
              </Animated.View>
            ))}
          </View>
        )}

        {/* ── Past orders ── */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Past Orders</Text>
          {pastOrders.map((order, index) => (
            <Animated.View
              key={order.id}
              entering={index % 2 === 0 ? SlideInRight.delay(400 + index * 100).duration(400) : SlideInLeft.delay(400 + index * 100).duration(400)}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => openStatus(order)}
                style={styles.pastOrderCard}
              >
                <View style={styles.orderHeader}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.pastOrderId}>Order #{order.id}</Text>
                    <Text style={styles.orderTime}>
                      {order.date} {order.time} • {order.fulfillment === 'DineIn' ? 'Dine In' : 'Delivery'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, styles.statusBadgeCompleted]}>
                    <Text style={styles.statusTextCompleted}>{order.status}</Text>
                  </View>
                </View>
                <Text style={styles.pastOrderItemsText}>
                  {order.lineItems.map((li) => `${li.qty}x ${li.name}`).join(', ')}
                </Text>
                <View style={styles.divider} />
                <View style={styles.orderFooter}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.pastTotalPrice}>₱{order.total.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

      </ScrollView>

      {/* Full-screen Modal for Order Status */}
      <Modal
        visible={!!selectedOrder}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeStatus}
      >
        {selectedOrder && (
          <OrderStatusView
            orderId={selectedOrder.id}
            currentStep={selectedOrder.currentStep}
            fulfillmentMode={selectedOrder.fulfillment}
            orderItems={selectedItems}
            orderTotal={selectedOrder.total}
            onBack={closeStatus}
          />
        )}
      </Modal>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabViewContainer: {
    flex: 1,
    padding: 28,
    paddingTop: 24,
  },
  tabTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    color: Colors.primary.default,
    marginBottom: 20,
  },
  sectionBlock: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.primary.default,
    marginBottom: 12,
  },

  // ── Receipt card ──
  receiptWrapper: {
    backgroundColor: '#FFFDF8',
    borderRadius: 4,
    marginBottom: 16,
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 6,
    overflow: 'hidden',
  },
  receiptHeader: {
    backgroundColor: Colors.primary.default,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptHeaderLeft: {},
  receiptBrand: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#FAF9F5',
    letterSpacing: 0.3,
  },
  receiptBrandSub: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: 'rgba(250,249,245,0.7)',
    marginTop: 1,
  },
  receiptLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  receiptMetaRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  receiptMetaCol: {
    flex: 1,
  },
  receiptMetaLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 8,
    color: Colors.neutral.gray400,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  receiptMetaValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: Colors.primary.default,
  },
  dashedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    overflow: 'hidden',
  },
  dashSegment: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral.gray300,
    marginHorizontal: 1,
  },
  receiptItemHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  receiptItemHeaderText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 8,
    color: Colors.neutral.gray400,
    letterSpacing: 1.2,
  },
  receiptLineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  receiptItemName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: Colors.neutral.gray800,
  },
  receiptItemQty: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: Colors.neutral.gray500,
    textAlign: 'center',
  },
  receiptItemPrice: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: Colors.primary.default,
    textAlign: 'right',
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  receiptTotalLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: Colors.neutral.gray600,
  },
  receiptTotalVal: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: Colors.primary.default,
  },
  receiptGrandLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: Colors.primary.default,
    letterSpacing: 1,
  },
  receiptGrandVal: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.secondary.default,
  },

  // torn edge
  tornEdgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF8',
    height: 20,
    overflow: 'visible',
  },
  tornEdgeRowInverted: {
    backgroundColor: Colors.primary.default,
  },
  notchCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FAF9F5',
    position: 'absolute',
    zIndex: 2,
  },
  notchInverted: {
    backgroundColor: '#FAF9F5',
  },
  notchLeft: {
    left: -10,
  },
  notchRight: {
    right: -10,
  },
  tornDash: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral.gray200,
    marginHorizontal: 2,
  },

  // receipt footer
  receiptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF8F2',
  },
  receiptStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(179,101,52,0.1)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  receiptStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary.default,
    marginRight: 6,
  },
  receiptStatusText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: Colors.secondary.default,
  },
  receiptTapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  receiptTapHintText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: Colors.secondary.default,
  },

  // ── Past order card ──
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pastOrderId: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: Colors.neutral.gray800,
  },
  orderTime: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: Colors.neutral.gray500,
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  statusBadgeCompleted: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  statusTextCompleted: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: '#4CAF50',
  },
  pastOrderItemsText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: Colors.neutral.gray700,
    lineHeight: 18,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.neutral.gray200,
    marginBottom: 10,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: Colors.neutral.gray500,
  },
  pastTotalPrice: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: Colors.primary.default,
  },
  pastOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
    padding: 16,
    marginBottom: 12,
  },
});
