import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
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
            toValue: 1.2,
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

  const isDone = status === 'done';
  const isActive = status === 'active';
  const isPending = status === 'pending';

  const badgeBg = isDone
    ? '#22C55E'
    : isActive
    ? '#1D4ED8'
    : '#EFF6FF';

  const badgeIconColor = isDone || isActive ? '#FFFFFF' : '#94A3B8';
  
  const iconName = isDone
    ? 'checkmark'
    : step.key === 'queue'
    ? 'hourglass-outline'
    : step.key === 'preparing'
    ? 'cafe'
    : step.key === 'ready'
    ? 'bag-handle-outline'
    : step.key === 'delivery'
    ? 'bicycle-outline'
    : step.key === 'received'
    ? 'location-outline'
    : 'star-outline';

  const timestamp = isDone ? '9:55 AM' : isActive ? '9:58 AM' : '';

  return (
    <ReAnimated.View
      entering={
        index % 2 === 0
          ? SlideInLeft.delay(500 + index * 80).duration(350)
          : SlideInRight.delay(500 + index * 80).duration(350)
      }
      style={styles.stepRow}
    >
      {/* Left: connector line + node */}
      <View style={styles.stepLeftCol}>
        {/* Pulse ring for active */}
        {isActive && (
          <Animated.View
            style={[
              styles.pulseRing,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />
        )}

        {/* Node circle badge */}
        <View
          style={[
            styles.stepCircle,
            { backgroundColor: badgeBg, borderColor: badgeBg },
          ]}
        >
          <Ionicons
            name={iconName as any}
            size={15}
            color={badgeIconColor}
          />
        </View>

        {/* Connector line */}
        {!isLast && (
          <View style={[styles.connectorLine, isDone && { backgroundColor: '#86EFAC' }]} />
        )}
      </View>

      {/* Right: Step Card Container */}
      <View
        style={[
          styles.stepCard,
          isDone && styles.stepCardDone,
          isActive && styles.stepCardActive,
          isPending && styles.stepCardPending,
        ]}
      >
        <View style={styles.stepCardHeader}>
          <Text
            style={[
              styles.stepLabel,
              isDone && styles.stepLabelDone,
              isActive && styles.stepLabelActive,
              isPending && styles.stepLabelPending,
            ]}
          >
            {step.label}
          </Text>
          {timestamp ? <Text style={styles.stepTime}>{timestamp}</Text> : null}
        </View>
        
        <Text
          style={[
            styles.stepDesc,
            isPending && styles.stepDescPending,
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

class MapErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.warn('MapView failed to load:', error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function DeliveryMap({ orderId, orderItems, orderTotal }: { orderId: string; orderItems: string; orderTotal: number }) {
  const { data } = useAppData();
  const deliveryTracking = data?.deliveryTracking || { riderName: 'Rider Alex', riderPhone: '0912 345 6789', estimatedMinutes: 0 };
  const { riderName } = deliveryTracking;

  // Real user location state (default fallback Manila)
  const [userLoc, setUserLoc] = useState<{ latitude: number; longitude: number }>({
    latitude: 14.308983,
    longitude: 121.048883,
  });

  // Dummy rider location ~500m radius away (0.0035 deg offset)
  const [riderLoc, setRiderLoc] = useState<{ latitude: number; longitude: number }>({
    latitude: 14.308983 + 0.0035,
    longitude: 121.048883 + 0.0035,
  });

  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [etaMins, setEtaMins] = useState<number>(3);

  useEffect(() => {
    (async () => {
      let uLat = 14.308983;
      let uLng = 121.048883;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (loc?.coords) {
            uLat = loc.coords.latitude;
            uLng = loc.coords.longitude;
          }
        }
      } catch (err) {
        console.warn('Location permission error:', err);
      }

      const rLat = uLat + 0.0035;
      const rLng = uLng + 0.0035;

      const userC = { latitude: uLat, longitude: uLng };
      const riderC = { latitude: rLat, longitude: rLng };

      setUserLoc(userC);
      setRiderLoc(riderC);

      // Fetch real road route from OpenRouteService
      try {
        const coords = await fetchRoute(riderC, userC);
        if (coords && coords.length > 0) {
          setRouteCoords(coords);
        } else {
          setRouteCoords([
            riderC,
            { latitude: (rLat + uLat) / 2 + 0.0005, longitude: (rLng + uLng) / 2 - 0.0005 },
            userC,
          ]);
        }
      } catch (err) {
        setRouteCoords([
          riderC,
          { latitude: (rLat + uLat) / 2 + 0.0005, longitude: (rLng + uLng) / 2 - 0.0005 },
          userC,
        ]);
      }
    })();
  }, []);

  const polylineJson = routeCoords.length > 0
    ? JSON.stringify(routeCoords.map(c => [c.latitude, c.longitude]))
    : JSON.stringify([[riderLoc.latitude, riderLoc.longitude], [userLoc.latitude, userLoc.longitude]]);

  const riderMarkerImg = Image.resolveAssetSource(require('../../../assets/app/rider-marker.png'))?.uri || '';
  const userMarkerImg = Image.resolveAssetSource(require('../../../assets/app/user-marker.png'))?.uri || '';

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #F8FAFC; }
        .leaflet-control-attribution { display: none !important; }
        .speech-bubble {
          position: absolute; top: -38px; left: 50%; transform: translateX(-50%);
          background: #FFFFFF; color: #2563EB; font-family: -apple-system, Roboto, sans-serif; font-weight: bold;
          font-size: 11px; padding: 4px 10px; border-radius: 12px; border: 1px solid #DBEAFE;
          white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.08); z-index: 999;
        }
        .marker-img {
          width: 44px; height: 44px; object-fit: contain;
          filter: drop-shadow(0px 4px 6px rgba(37,99,235,0.3));
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false, dragging: true, touchZoom: true }).setView([${userLoc.latitude}, ${userLoc.longitude}], 15);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd'
        }).addTo(map);

        var riderIcon = L.divIcon({ 
          className: '', 
          html: '<div class="speech-bubble">On the way!</div><img src="${riderMarkerImg}" class="marker-img" />', 
          iconSize: [44, 44], 
          iconAnchor: [22, 22] 
        });

        var userIcon = L.divIcon({ 
          className: '', 
          html: '<img src="${userMarkerImg}" class="marker-img" />', 
          iconSize: [44, 44], 
          iconAnchor: [22, 22] 
        });

        L.marker([${riderLoc.latitude}, ${riderLoc.longitude}], { icon: riderIcon }).addTo(map);
        L.marker([${userLoc.latitude}, ${userLoc.longitude}], { icon: userIcon }).addTo(map);

        var latlngs = ${polylineJson};
        var polyline = L.polyline(latlngs, { color: '#2563EB', weight: 4, opacity: 0.9 }).addTo(map);
        map.fitBounds(polyline.getBounds(), { padding: [35, 35] });
      </script>
    </body>
    </html>
  `;

  const itemName = orderItems ? orderItems.replace(/^\d+x\s*/, '') : 'Classic Cappuccino';

  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <View style={styles.liveDeliveryCard}>
      {/* Top Header: Live Delivery icon title & ETA pill */}
      <View style={styles.liveDeliveryHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.liveDeliveryIconBadge}>
            <Ionicons name="bicycle" size={16} color="#2563EB" />
          </View>
          <Text style={styles.liveDeliveryTitle}>Live Delivery</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.liveDeliveryEtaPill}>
            <Ionicons name="time-outline" size={14} color="#2563EB" style={{ marginRight: 4 }} />
            <Text style={styles.liveDeliveryEtaText}>{etaMins} mins away</Text>
          </View>

          {/* Fullscreen Trigger Icon */}
          <TouchableOpacity
            style={styles.expandHeaderBtnCircle}
            activeOpacity={0.8}
            onPress={() => setIsFullscreen(true)}
          >
            <Ionicons name="expand" size={16} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Middle Map Section */}
      <View style={styles.liveDeliveryMapWrapper}>
        <WebView
          originWhitelist={['*']}
          source={{ html: mapHtml }}
          style={styles.liveMapStyle}
          scrollEnabled={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />

        {/* Floating Expand Map Button */}
        <TouchableOpacity
          style={styles.floatingExpandMapBtn}
          activeOpacity={0.85}
          onPress={() => setIsFullscreen(true)}
        >
          <Ionicons name="scan-outline" size={18} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Bottom Info Bar: Order ID, Item, Total */}
      <View style={styles.liveDeliveryFooterRow}>
        <View style={styles.liveDeliveryCol}>
          <Text style={styles.liveDeliveryMetaLabel}>Order ID</Text>
          <Text style={styles.liveDeliveryMetaValBlue}>#{orderId}</Text>
        </View>

        <View style={styles.liveDeliveryDivider} />

        <View style={styles.liveDeliveryCol}>
          <Text style={styles.liveDeliveryMetaLabel}>1 Item</Text>
          <Text style={styles.liveDeliveryMetaValDark} numberOfLines={1}>
            {itemName}
          </Text>
        </View>

        <View style={styles.liveDeliveryDivider} />

        <View style={styles.liveDeliveryCol}>
          <Text style={styles.liveDeliveryMetaLabel}>Total</Text>
          <Text style={styles.liveDeliveryMetaValBlue}>₱{orderTotal.toFixed(2)}</Text>
        </View>
      </View>

      {/* ── Animated Fullscreen Drawer Modal (Bottom to Top) ── */}
      <Modal
        visible={isFullscreen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsFullscreen(false)}
      >
        <View style={styles.fullscreenDrawerContainer}>
          {/* Header Bar */}
          <View style={styles.fullscreenDrawerHeader}>
            <TouchableOpacity
              onPress={() => setIsFullscreen(false)}
              style={styles.fullscreenCloseCircleBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-down" size={22} color="#2563EB" />
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <Text style={styles.fullscreenDrawerTitle}>Live Tracking Map</Text>
              <Text style={styles.fullscreenDrawerSub}>{riderName} • {etaMins} mins away</Text>
            </View>

            <View style={{ width: 40 }} />
          </View>

          {/* Fullscreen Map View */}
          <View style={styles.fullscreenMapFlex}>
            <WebView
              originWhitelist={['*']}
              source={{ html: mapHtml }}
              style={{ flex: 1 }}
              scrollEnabled={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          </View>

          {/* Floating Bottom Drawer Card */}
          <View style={styles.fullscreenFloatingDrawerBar}>
            <View style={styles.fullscreenFloatingDrawerInner}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={styles.liveDeliveryIconBadge}>
                  <Ionicons name="bicycle" size={18} color="#2563EB" />
                </View>
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: '#1E293B' }}>#{orderId}</Text>
                  <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 12, color: '#64748B' }} numberOfLines={1}>
                    {itemName}
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: '#2563EB' }}>
                  ₱{orderTotal.toFixed(2)}
                </Text>
                <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 11, color: '#16A34A' }}>
                  On the way 🛵
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OrderStatusView({
  orderId = 'LK-DEL-16165',
  currentStep = 'preparing',
  fulfillmentMode = 'Delivery',
  orderItems = '1x Classic Cappuccino',
  orderTotal = 175.0,
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
          <TouchableOpacity onPress={onBack} style={styles.backBtnCircle}>
            <Ionicons name="chevron-back" size={22} color="#2563EB" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
        <Text style={styles.headerTitle}>Order Status</Text>

        {/* Mascot Emblem Top-Right */}
        <View style={styles.headerMascotWrapper}>
          <Image
            source={require('../../../assets/app/logo.png')}
            style={styles.headerMascotImg}
            resizeMode="contain"
          />
          <Ionicons name="sparkles" size={10} color="#93C5FD" style={styles.headerSparkleLeft} />
          <Ionicons name="sparkles" size={8} color="#93C5FD" style={styles.headerSparkleRight} />
        </View>
      </ReAnimated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Delivery Map (replaces order card when on delivery step) ── */}
        {currentStep === 'delivery' ? (
          <ReAnimated.View entering={SlideInLeft.delay(300).duration(400)}>
            <DeliveryMap orderId={orderId} orderItems={orderItems} orderTotal={orderTotal} />
          </ReAnimated.View>
        ) : (
          <ReAnimated.View entering={SlideInLeft.delay(300).duration(400)} style={styles.orderCardHero}>
            {/* Top Row: Order ID & Fulfillment Badge */}
            <View style={styles.orderCardHeroTop}>
              <View>
                <Text style={styles.orderIdLabel}>ORDER ID</Text>
                <Text style={styles.orderIdText}>#{orderId}</Text>
              </View>

              <View style={styles.fulfillmentBadgePill}>
                <Ionicons
                  name={fulfillmentMode === 'Delivery' ? 'bicycle' : 'restaurant'}
                  size={14}
                  color="#2563EB"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.fulfillmentBadgeText}>
                  {fulfillmentMode === 'Delivery' ? 'Delivery' : 'Dine In'}
                </Text>
              </View>
            </View>

            {/* Middle Row: Item preview */}
            <View style={styles.itemPreviewRow}>
              <Image
                source={require('../../../assets/app/latte-art.jpg')}
                style={styles.itemPreviewImg}
                resizeMode="cover"
              />
              <Text style={styles.itemPreviewText} numberOfLines={1}>
                {orderItems || '1x Classic Cappuccino'}
              </Text>
            </View>

            {/* Bottom Row: Total & Delivery Rider graphic */}
            <View style={styles.orderCardHeroBottom}>
              <View>
                <Text style={styles.orderTotalLabel}>TOTAL</Text>
                <Text style={styles.orderTotalValue}>₱{orderTotal.toFixed(2)}</Text>
              </View>

              <Image
                source={require('../../../assets/app/rider.png')}
                style={styles.riderGraphicImg}
                resizeMode="contain"
              />
            </View>
          </ReAnimated.View>
        )}

        {/* ── Timeline ── */}
        <ReAnimated.View entering={SlideInRight.delay(500).duration(400)} style={styles.timelineSection}>
          <View style={styles.timelineHeaderRow}>
            <Text style={styles.timelineTitle}>Order Timeline</Text>
            <View style={styles.timelineActiveBar} />
          </View>

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
                <Ionicons name="sparkles" size={28} color="#2563EB" style={{ marginBottom: 8 }} />
                <Text style={styles.rateTitle}>How was your experience?</Text>
                <Text style={styles.rateSubtitle}>
                  Tap a star to rate your order. Your feedback helps us serve you better!
                </Text>
                <StarRating rating={rating} setRating={setRating} />

                {/* Comment input */}
                <TextInput
                  style={styles.commentInput}
                  placeholder="Leave a comment (optional)"
                  placeholderTextColor="#94A3B8"
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  maxLength={500}
                />

                {ratingMessage !== '' && (
                  <Text style={[styles.rateSubtitle, { color: '#EF4444', marginBottom: 8 }]}>{ratingMessage}</Text>
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
          <ReAnimated.View entering={SlideInDown.delay(700).duration(400)} style={styles.etaCardContainer}>
            <Image
              source={
                fulfillmentMode === 'Delivery'
                  ? require('../../../assets/app/coffewithclock.png')
                  : require('../../../assets/app/foodwithclock.png')
              }
              style={styles.etaGraphicImgLeft}
              resizeMode="contain"
            />

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.etaLabelText}>Estimated wait time</Text>
              <Text style={styles.etaTimeText}>
                {fulfillmentMode === 'Delivery' ? '25–35 mins' : '5–10 mins'}
              </Text>
              <Text style={styles.etaSubtitleText}>We'll notify you once your order is on the way.</Text>
            </View>
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
    backgroundColor: '#F8FAFC',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 38,
    paddingBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  backBtnCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#1D5FA7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#1E293B',
  },
  headerMascotWrapper: {
    width: 44,
    height: 44,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMascotImg: {
    width: 36,
    height: 36,
  },
  headerSparkleLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  headerSparkleRight: {
    position: 'absolute',
    top: 4,
    right: -2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 48,
  },

  // ── Delivery Map ──
  mapCard: {
    height: 340,
    overflow: 'hidden',
    marginBottom: 28,
    marginHorizontal: 0,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
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
    color: '#1E293B',
  },
  riderPhone: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: '#64748B',
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 4,
  },
  etaBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#2563EB',
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

  // ── Hero Order Card ──
  orderCardHero: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  orderCardHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  orderIdLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  orderIdText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#2563EB',
    marginTop: 2,
  },
  fulfillmentBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  fulfillmentBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#2563EB',
  },
  itemPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  itemPreviewImg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 10,
  },
  itemPreviewText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#1E293B',
    flex: 1,
  },
  orderCardHeroBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  orderTotalLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  orderTotalValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#2563EB',
    marginTop: 2,
  },
  riderGraphicImg: {
    width: 110,
    height: 80,
    marginBottom: -10,
    marginRight: -6,
  },

  // ── Timeline ──
  timelineSection: {
    marginBottom: 24,
  },
  timelineHeaderRow: {
    marginBottom: 16,
    position: 'relative',
  },
  timelineTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
    color: '#1E293B',
  },
  timelineActiveBar: {
    width: 24,
    height: 3,
    backgroundColor: '#2563EB',
    borderRadius: 1.5,
    marginTop: 4,
  },
  timelineBody: {
    paddingLeft: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepLeftCol: {
    width: 44,
    alignItems: 'center',
    paddingTop: 12,
  },
  pulseRing: {
    position: 'absolute',
    top: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    zIndex: 0,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  connectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
    minHeight: 24,
    borderStyle: 'dashed',
  },
  stepCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginLeft: 8,
    shadowColor: '#1D5FA7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  stepCardDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  stepCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowOpacity: 0.05,
    elevation: 2,
  },
  stepCardPending: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F8FAFC',
    opacity: 0.65,
  },
  stepCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#1E293B',
  },
  stepLabelDone: {
    color: '#16A34A',
  },
  stepLabelActive: {
    color: '#1E293B',
  },
  stepLabelPending: {
    color: '#64748B',
  },
  stepTime: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: '#94A3B8',
  },
  stepDesc: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  stepDescPending: {
    color: '#94A3B8',
  },

  // ── Rate Section ──
  rateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rateTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 6,
    textAlign: 'center',
  },
  rateSubtitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#64748B',
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
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#1E293B',
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitRateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    shadowColor: '#2563EB',
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

  // ── Live Delivery Card Styles ──
  liveDeliveryCard: {
    marginHorizontal: -20,
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  liveDeliveryHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  liveDeliveryIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  liveDeliveryTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#2563EB',
  },
  liveDeliveryEtaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  liveDeliveryEtaText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#2563EB',
  },
  expandHeaderBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingExpandMapBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  liveDeliveryMapWrapper: {
    height: 200,
    width: '100%',
    backgroundColor: '#F8FAFC',
  },
  liveMapStyle: {
    width: '100%',
    height: '100%',
    flex: 1,
  },

  // ── Fullscreen Drawer Modal ──
  fullscreenDrawerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  fullscreenDrawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  fullscreenCloseCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenDrawerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#1E293B',
  },
  fullscreenDrawerSub: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#2563EB',
  },
  fullscreenMapFlex: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  fullscreenFloatingDrawerBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  fullscreenFloatingDrawerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  liveDeliveryFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  liveDeliveryCol: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  liveDeliveryDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },
  liveDeliveryMetaLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  liveDeliveryMetaValBlue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#2563EB',
  },
  liveDeliveryMetaValDark: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#1E293B',
  },

  // ── ETA Card ──
  etaCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  etaGraphicImgLeft: {
    width: 60,
    height: 60,
    borderRadius: 14,
  },
  etaLabelText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#64748B',
  },
  etaTimeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#2563EB',
    marginVertical: 2,
  },
  etaSubtitleText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: '#94A3B8',
  },
});
