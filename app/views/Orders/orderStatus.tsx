import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import ReAnimated, {
  FadeIn,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated';
import { Colors } from '../../../components/UI/Colors';
import { useAppData } from '../../../lib/useAppData';
import { rateOrder } from '../../../services/ratingsService';

// ─── Types ────────────────────────────────────────────────────────────────────
type FulfillmentMode = 'DineIn' | 'Delivery';

type StepKey =
  | 'queue'
  | 'preparing'
  | 'ready'
  | 'delivery'
  | 'received'
  | 'rate';

type StepStatus = 'done' | 'active' | 'pending';

interface Step {
  key: StepKey;
  label: string;
  description: string;
  icon: string;
  deliveryOnly?: boolean;
}

interface OrderStatusProps {
  orderId?: string;
  currentStep?: StepKey;
  fulfillmentMode?: FulfillmentMode;
  orderItems?: string;
  orderTotal?: number;
  onBack?: () => void;
  onRate?: () => void;
}

// ─── Step Definitions ─────────────────────────────────────────────────────────
const ALL_STEPS: Step[] = [
  {
    key: 'queue',
    label: 'Order Queued',
    description: 'Your order has been received and is in the queue.',
    icon: 'hourglass-outline',
  },
  {
    key: 'preparing',
    label: 'Preparing',
    description: 'Our barista is crafting your order with care.',
    icon: 'cafe-outline',
  },
  {
    key: 'ready',
    label: 'Ready for Pick-up',
    description: 'Your order is ready! Head to the counter to claim it.',
    icon: 'bag-check-outline',
  },
  {
    key: 'delivery',
    label: 'Out for Delivery',
    description: 'Your order is on its way. Hang tight!',
    icon: 'bicycle-outline',
    deliveryOnly: true,
  },
  {
    key: 'received',
    label: 'Received',
    description: 'Enjoy your order! We hope it hits the spot ☕',
    icon: 'checkmark-circle-outline',
  },
  {
    key: 'rate',
    label: 'Rate Your Order',
    description: 'How was your experience? Share your feedback!',
    icon: 'star-outline',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStepStatus(
  stepKey: StepKey,
  currentStep: StepKey,
  steps: Step[]
): StepStatus {
  const stepIdx = steps.findIndex((s) => s.key === stepKey);
  const currentIdx = steps.findIndex((s) => s.key === currentStep);
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

// ─── Animated Step Node ───────────────────────────────────────────────────────
interface StepNodeProps {
  step: Step;
  status: StepStatus;
  isLast: boolean;
  index: number;
}

function StepNode({ step, status, isLast, index }: StepNodeProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for active step
  useEffect(() => {
    if (status === 'active') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [status, pulseAnim]);

  const nodeColor =
    status === 'done'
      ? '#4CAF50'
      : status === 'active'
      ? Colors.secondary.default
      : Colors.neutral.gray300;

  const lineColor = status === 'done' ? '#4CAF50' : Colors.neutral.gray200;

  return (
    <ReAnimated.View
      entering={
        index % 2 === 0
          ? SlideInLeft.delay(600 + index * 100).duration(400)
          : SlideInRight.delay(600 + index * 100).duration(400)
      }
      style={styles.stepRow}
    >
      {/* Left: connector line + node */}
      <View style={styles.stepLeftCol}>
        {/* Pulse ring for active */}
        {status === 'active' && (
          <Animated.View
            style={[
              styles.pulseRing,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />
        )}

        {/* Node circle */}
        <View
          style={[
            styles.stepCircle,
            { backgroundColor: nodeColor, borderColor: nodeColor },
          ]}
        >
          {status === 'done' ? (
            <Ionicons name="checkmark" size={14} color="#FFF" />
          ) : (
            <Ionicons
              name={step.icon as any}
              size={14}
              color={status === 'active' ? '#FFF' : Colors.neutral.gray400}
            />
          )}
        </View>

        {/* Connector line (not for last step) */}
        {!isLast && (
          <View style={[styles.connectorLine, { backgroundColor: lineColor }]} />
        )}
      </View>

      {/* Right: label & description */}
      <View style={styles.stepContent}>
        <Text
          style={[
            styles.stepLabel,
            status === 'done' && styles.stepLabelDone,
            status === 'active' && styles.stepLabelActive,
            status === 'pending' && styles.stepLabelPending,
          ]}
        >
          {step.label}
        </Text>
        <Text
          style={[
            styles.stepDesc,
            status === 'pending' && styles.stepDescPending,
          ]}
        >
          {step.description}
        </Text>
      </View>
    </ReAnimated.View>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
interface StarRatingProps {
  rating: number;
  setRating: (r: number) => void;
}
function StarRating({ rating, setRating }: StarRatingProps) {
  return (
    <View style={styles.ratingRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          activeOpacity={0.7}
          onPress={() => setRating(star)}
          style={styles.starBtn}
        >
          <Ionicons
            name={rating >= star ? 'star' : 'star-outline'}
            size={32}
            color={rating >= star ? '#F4A261' : Colors.neutral.gray300}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Delivery Map ────────────────────────────────────────────────────────────
const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImZkYWU1M2QxZGMzYzRjMmZhYTk0NjFhN2Y5NzZhNDdlIiwiaCI6Im11cm11cjY0In0=';

async function fetchRoute(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): Promise<{ latitude: number; longitude: number }[]> {
  const res = await fetch('https://api.openrouteservice.org/v2/directions/cycling-regular/geojson', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: ORS_API_KEY },
    body: JSON.stringify({
      coordinates: [
        [from.longitude, from.latitude],
        [to.longitude, to.latitude],
      ],
    }),
  });
  const json = await res.json();
  const coords: [number, number][] = json?.features?.[0]?.geometry?.coordinates ?? [];
  return coords.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
}

const RiderPin = React.memo(() => (
  <View collapsable={false} style={styles.pinWrapper}>
    <View collapsable={false} style={[styles.pinHead, { backgroundColor: Colors.secondary.default }]}>
      <Ionicons name="bicycle" size={16} color="#FFF" />
    </View>
    <View collapsable={false} style={[styles.pinTail, { borderTopColor: Colors.secondary.default }]} />
  </View>
));
RiderPin.displayName = 'RiderPin';

const UserPin = React.memo(() => (
  <View collapsable={false} style={styles.pinWrapper}>
    <View collapsable={false} style={[styles.pinHead, { backgroundColor: '#131313ff' }]}>
      <Ionicons name="person" size={16} color="#FFF" />
    </View>
    <View collapsable={false} style={[styles.pinTail, { borderTopColor: '#131313ff' }]} />
  </View>
));
UserPin.displayName = 'UserPin';

function DeliveryMap() {
  const { data } = useAppData();
  const deliveryTracking = data?.deliveryTracking || { riderName: '', riderPhone: '', riderAvatar: '', riderLocation: { latitude: 14.309855, longitude: 121.050009 }, userLocation: { latitude: 14.308983, longitude: 121.048883 }, estimatedMinutes: 0 };
  const { riderLocation, userLocation, riderName, riderPhone, estimatedMinutes } = deliveryTracking;

  const riderCoords = { latitude: riderLocation.latitude, longitude: riderLocation.longitude };
  const userCoords  = { latitude: userLocation.latitude,  longitude: userLocation.longitude  };

  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);

  useEffect(() => {
    fetchRoute(riderCoords, userCoords)
      .then((coords) => {
        if (coords && coords.length > 0) {
          setRouteCoords(coords);
        } else {
          // Fallback to a styled road-aligned grid route
          setRouteCoords([
            riderCoords,
            { latitude: riderCoords.latitude, longitude: 121.0225 },
            { latitude: 14.5560, longitude: 121.0225 },
            { latitude: 14.5560, longitude: userCoords.longitude },
            userCoords,
          ]);
        }
      })
      .catch(() => {
        // Fallback to a styled road-aligned grid route
        setRouteCoords([
          riderCoords,
          { latitude: riderCoords.latitude, longitude: 121.0225 },
          { latitude: 14.5560, longitude: 121.0225 },
          { latitude: 14.5560, longitude: userCoords.longitude },
          userCoords,
        ]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const region = {
    latitude:      (riderCoords.latitude  + userCoords.latitude)  / 2,
    longitude:     (riderCoords.longitude + userCoords.longitude) / 2,
    latitudeDelta:  0.012,
    longitudeDelta: 0.012,
  };

  return (
    <View style={styles.mapCard}>
      {/* Rider info bar */}
      <View style={styles.riderBar}>
        <View style={styles.riderInfo}>
          <Ionicons name="bicycle" size={18} color={Colors.secondary.default} />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.riderName}>{riderName}</Text>
            <Text style={styles.riderPhone}>{riderPhone}</Text>
          </View>
        </View>
        <View style={styles.etaBadge}>
          <Ionicons name="time-outline" size={13} color={Colors.secondary.default} />
          <Text style={styles.etaBadgeText}>{estimatedMinutes} mins</Text>
        </View>
      </View>

      <MapView
        style={styles.map}
        initialRegion={region}
        mapType="standard"
      >
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={Colors.secondary.default}
            strokeWidth={4}
          />
        )}
        <Marker coordinate={riderCoords} title={riderName} anchor={{ x: 0.5, y: 1 }} zIndex={3}>
          <RiderPin />
        </Marker>
        <Marker coordinate={userCoords} title="You" anchor={{ x: 0.5, y: 1 }} zIndex={3}>
          <UserPin />
        </Marker>
      </MapView>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OrderStatusView({
  orderId = 'LK-90214',
  currentStep = 'preparing',
  fulfillmentMode = 'DineIn',
  orderItems = '1x Gold Espresso Macchiato, 1x Classic Waffle',
  orderTotal = 290.0,
  onBack,
}: OrderStatusProps) {
  const { data: dummyData } = useAppData();

  // Rating state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [ratingMessage, setRatingMessage] = useState('');

  const handleSubmitRating = useCallback(async () => {
    if (rating === 0 || !orderId) return;

    setIsSubmitting(true);
    try {
      const result = await rateOrder({
        order_id: orderId,
        rating,
        comment: comment.trim() || undefined,
      });
      setRatingMessage(result.message);
      if (result.success) {
        setHasRated(true);
      }
    } catch (err) {
      setRatingMessage('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [rating, comment, orderId]);

  const steps = ALL_STEPS.filter(
    (s) => !s.deliveryOnly || fulfillmentMode === 'Delivery'
  );

  const isRateStep = currentStep === 'rate';
  const isReceivedOrAfter =
    currentStep === 'received' || currentStep === 'rate';

  return (
    <ReAnimated.View
      entering={SlideInDown.duration(400)}
      style={styles.container}
    >
      {/* ── Header ── */}
      <ReAnimated.View entering={FadeIn.delay(200).duration(400)} style={styles.headerRow}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color={Colors.primary.default} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
        <Text style={styles.headerTitle}>Order Status</Text>
        <View style={{ width: 44 }} />
      </ReAnimated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Delivery Map (replaces order card when on delivery step) ── */}
        {currentStep === 'delivery' ? (
          <ReAnimated.View entering={SlideInLeft.delay(300).duration(400)}>
            <DeliveryMap />
          </ReAnimated.View>
        ) : (
        <ReAnimated.View entering={SlideInLeft.delay(300).duration(400)} style={styles.orderCard}>
          <View style={styles.orderCardTop}>
            <View>
              <Text style={styles.orderIdLabel}>Order</Text>
              <Text style={styles.orderId}>#{orderId}</Text>
            </View>
            <View
              style={[
                styles.fulfillmentBadge,
                fulfillmentMode === 'Delivery'
                  ? styles.fulfillmentDelivery
                  : styles.fulfillmentDineIn,
              ]}
            >
              <Ionicons
                name={
                  fulfillmentMode === 'Delivery'
                    ? 'bicycle-outline'
                    : 'restaurant-outline'
                }
                size={12}
                color={
                  fulfillmentMode === 'Delivery' ? '#1565C0' : Colors.secondary.default
                }
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.fulfillmentText,
                  fulfillmentMode === 'Delivery'
                    ? styles.fulfillmentTextDelivery
                    : styles.fulfillmentTextDineIn,
                ]}
              >
                {fulfillmentMode === 'Delivery' ? 'Delivery' : 'Dine In'}
              </Text>
            </View>
          </View>

          <Text style={styles.orderItemsText}>{orderItems}</Text>

          <View style={styles.orderCardDivider} />

          <View style={styles.orderCardFooter}>
            <Text style={styles.orderTotalLabel}>Total</Text>
            <Text style={styles.orderTotalValue}>₱{orderTotal.toFixed(2)}</Text>
          </View>
        </ReAnimated.View>
        )}

        {/* ── Timeline ── */}
        <ReAnimated.View entering={SlideInRight.delay(500).duration(400)} style={styles.timelineSection}>
          <Text style={styles.timelineTitle}>Order Timeline</Text>

          <View style={styles.timelineBody}>
            {steps.map((step, index) => (
              <StepNode
                key={step.key}
                step={step}
                status={getStepStatus(step.key, currentStep, steps)}
                isLast={index === steps.length - 1}
                index={index}
            />
            ))}
          </View>
        </ReAnimated.View>

        {/* ── Rate Section (shown when on 'rate' step or received) ── */}
        {isReceivedOrAfter && (
          <ReAnimated.View entering={SlideInDown.delay(700).duration(400)} style={styles.rateCard}>
            {hasRated ? (
              <>
                <Ionicons name="checkmark-circle" size={48} color="#4CAF50" style={{ marginBottom: 8 }} />
                <Text style={styles.rateTitle}>Thank you for your feedback!</Text>
                <Text style={styles.rateSubtitle}>{ratingMessage}</Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={28} color={Colors.secondary.default} style={{ marginBottom: 8 }} />
                <Text style={styles.rateTitle}>How was your experience?</Text>
                <Text style={styles.rateSubtitle}>
                  Tap a star to rate your order. Your feedback helps us serve you better!
                </Text>
                <StarRating rating={rating} setRating={setRating} />

                {/* Comment input */}
                <TextInput
                  style={styles.commentInput}
                  placeholder="Leave a comment (optional)"
                  placeholderTextColor={Colors.neutral.gray400}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  maxLength={500}
                />

                {ratingMessage !== '' && (
                  <Text style={[styles.rateSubtitle, { color: '#E53935', marginBottom: 8 }]}>{ratingMessage}</Text>
                )}

                {rating > 0 && (
                  <TouchableOpacity
                    style={[styles.submitRateBtn, isSubmitting && { opacity: 0.6 }]}
                    activeOpacity={0.85}
                    onPress={handleSubmitRating}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.submitRateBtnText}>
                      {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </Text>
                    {!isSubmitting && (
                      <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 6 }} />
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </ReAnimated.View>
        )}

        {/* ── ETA notice ── */}
        {!isReceivedOrAfter && (
          <ReAnimated.View entering={SlideInDown.delay(700).duration(400)} style={styles.etaCard}>
            <Ionicons name="time-outline" size={18} color={Colors.primary.default} style={{ marginRight: 8 }} />
            <Text style={styles.etaText}>
              Estimated wait:{' '}
              <Text style={styles.etaBold}>
                {fulfillmentMode === 'Delivery' ? '25–35 mins' : '5–10 mins'}
              </Text>
            </Text>
          </ReAnimated.View>
        )}
      </ScrollView>
    </ReAnimated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    paddingBottom: 12,
    backgroundColor: '#FAF9F5',
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray200,
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
  scrollContent: {
    paddingBottom: 48,
  },

  // ── Delivery Map ──
  mapCard: {
    height: 340,
    overflow: 'hidden',
    marginBottom: 28,
    marginHorizontal: 0,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.secondary.default,
  },
  riderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFF',
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: Colors.primary.default,
  },
  riderPhone: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: Colors.neutral.gray500,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(179,101,52,0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 4,
  },
  etaBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: Colors.secondary.default,
  },
  map: {
    flex: 1,
  },
  pinWrapper: {
    width: 38,
    height: 50,
    alignItems: 'center',
  },
  pinHead: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },

  // ── Order Card ──
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1.5,
    borderColor: Colors.secondary.default,
    shadowColor: Colors.secondary.default,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderIdLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: Colors.neutral.gray500,
  },
  orderId: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.primary.default,
    letterSpacing: 0.5,
  },
  fulfillmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  fulfillmentDineIn: {
    backgroundColor: 'rgba(179,101,52,0.1)',
  },
  fulfillmentDelivery: {
    backgroundColor: 'rgba(21,101,192,0.08)',
  },
  fulfillmentText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
  },
  fulfillmentTextDineIn: {
    color: Colors.secondary.default,
  },
  fulfillmentTextDelivery: {
    color: '#1565C0',
  },
  orderItemsText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: Colors.neutral.gray800,
    lineHeight: 20,
    marginBottom: 14,
  },
  orderCardDivider: {
    height: 1,
    backgroundColor: Colors.neutral.gray100,
    marginBottom: 14,
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotalLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: Colors.neutral.gray500,
  },
  orderTotalValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.secondary.default,
  },

  // ── Timeline ──
  timelineSection: {
    marginBottom: 28,
  },
  timelineTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.primary.default,
    marginBottom: 20,
  },
  timelineBody: {
    paddingLeft: 4,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 64,
    marginBottom: 0,
  },
  stepLeftCol: {
    width: 40,
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    top: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(179,101,52,0.15)',
    zIndex: 0,
  },
  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  connectorLine: {
    flex: 1,
    width: 2,
    borderRadius: 1,
    marginVertical: 4,
    minHeight: 30,
  },
  stepContent: {
    flex: 1,
    paddingLeft: 14,
    paddingBottom: 20,
  },
  stepLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    marginBottom: 2,
  },
  stepLabelDone: {
    color: '#4CAF50',
  },
  stepLabelActive: {
    color: Colors.secondary.default,
  },
  stepLabelPending: {
    color: Colors.neutral.gray400,
  },
  stepDesc: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: Colors.neutral.gray600,
    lineHeight: 18,
  },
  stepDescPending: {
    color: Colors.neutral.gray300,
  },

  // ── Rate Card ──
  rateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rateTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: Colors.primary.default,
    marginBottom: 6,
    textAlign: 'center',
  },
  rateSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: Colors.neutral.gray500,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  starBtn: {
    padding: 4,
  },
  commentInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
    borderRadius: 12,
    padding: 12,
    fontFamily: 'Poppins',
    fontSize: 13,
    color: Colors.primary.default,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitRateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary.default,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    shadowColor: Colors.secondary.default,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitRateBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFF',
  },

  // ── ETA Card ──
  etaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F3',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(179,101,52,0.15)',
  },
  etaText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: Colors.neutral.gray700,
    flex: 1,
  },
  etaBold: {
    fontFamily: 'Poppins-Bold',
    color: Colors.secondary.default,
  },
});
