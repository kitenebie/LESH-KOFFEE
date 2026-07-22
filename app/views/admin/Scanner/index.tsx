import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as db from '../../../../lib/database';
import Animated, { 
  FadeIn, 
  SlideInDown, 
  SlideInUp, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import { Colors } from '../../../../components/UI/Colors';
import AdminGuard from '../../../../components/UI/AdminGuard';
import api from '../../../../lib/axios';

export function ScannerPageContent() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const scannedSetRef = useRef<Set<string>>(new Set());

  // Animated laser scan line
  const laserAnim = useSharedValue(0);

  useEffect(() => {
    laserAnim.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, []);

  const animatedLaserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: laserAnim.value * 235 }],
  }));

  const handleBarCodeScanned = useCallback((result: BarcodeScanningResult) => {
    if (scanned || processing) return;
    setScanned(true);
    processQRData(result.data);
  }, [scanned, processing]);

  const validateQRFormat = (data: any): { valid: boolean; error?: string } => {
    if (!data || typeof data !== 'object') return { valid: false, error: 'Invalid QR data format.' };
    if (data.v !== 1) return { valid: false, error: `Unsupported QR version: ${data.v ?? 'none'}` };
    if (!data.order_number || typeof data.order_number !== 'string') return { valid: false, error: 'Missing order_number.' };
    if (!data.user_id || typeof data.user_id !== 'number') return { valid: false, error: 'Missing user_id.' };
    if (!Array.isArray(data.items) || data.items.length === 0) return { valid: false, error: 'No items in order.' };

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!item.product_id || !item.name || !item.quantity || item.price === undefined) {
        return { valid: false, error: `Invalid item at index ${i}: missing product_id, name, quantity, or price.` };
      }
    }

    if (typeof data.subtotal !== 'number' || typeof data.total !== 'number') {
      return { valid: false, error: 'Missing subtotal or total.' };
    }

    return { valid: true };
  };

  const isAlreadyScannedLocally = async (orderNumber: string): Promise<boolean> => {
    if (scannedSetRef.current.has(orderNumber)) return true;
    try {
      const database = await db.getDatabase();
      await database.runAsync(
        `CREATE TABLE IF NOT EXISTS scanned_orders (order_number TEXT PRIMARY KEY, scanned_at TEXT)`
      );
      const row = await database.getFirstAsync<any>(
        `SELECT order_number FROM scanned_orders WHERE order_number = ?`,
        [orderNumber]
      );
      return !!row;
    } catch {
      return false;
    }
  };

  const markAsScannedLocally = async (orderNumber: string) => {
    scannedSetRef.current.add(orderNumber);
    try {
      const database = await db.getDatabase();
      await database.runAsync(
        `CREATE TABLE IF NOT EXISTS scanned_orders (order_number TEXT PRIMARY KEY, scanned_at TEXT)`
      );
      await database.runAsync(
        `INSERT OR IGNORE INTO scanned_orders (order_number, scanned_at) VALUES (?, ?)`,
        [orderNumber, new Date().toISOString()]
      );
    } catch (e) {}
  };

  const processQRData = async (data: string) => {
    setProcessing(true);
    try {
      let parsed: any;
      try {
        parsed = JSON.parse(data);
      } catch {
        parsed = { type: 'order_code', code: data };
      }

      if (parsed.type === 'subscription_redeem') {
        await handleSubscriptionRedeem(parsed);
      } else if (parsed.v === 1 && parsed.order_number) {
        await handleOrderQRScan(parsed);
      } else if (parsed.type === 'order_code' || parsed.order_number) {
        await handleOrderVerify(parsed);
      } else {
        Alert.alert('Unknown QR', `Scanned: ${data.substring(0, 100)}`, [
          { text: 'OK', onPress: resetScanner }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to process QR code.', [
        { text: 'OK', onPress: resetScanner }
      ]);
    } finally {
      setProcessing(false);
    }
  };

  const handleOrderQRScan = async (data: any) => {
    const validation = validateQRFormat(data);
    if (!validation.valid) {
      Alert.alert('Invalid QR Code', validation.error!, [{ text: 'OK', onPress: resetScanner }]);
      return;
    }

    const alreadyScanned = await isAlreadyScannedLocally(data.order_number);
    if (alreadyScanned) {
      Alert.alert(
        'Duplicate Scan',
        `Order ${data.order_number} has already been scanned and processed.`,
        [{ text: 'OK', onPress: resetScanner }]
      );
      return;
    }

    try {
      const response = await api.post('/admin/scan/process-order-qr', {
        order_number: data.order_number,
        user_id: data.user_id,
        fulfillment: data.fulfillment,
        ref_no: data.ref_no,
        payment_method: data.payment_method,
        items: data.items,
        subtotal: data.subtotal,
        delivery_fee: data.delivery_fee ?? 0,
        discount: data.discount ?? 0,
        subscription_discount: data.subscriptionDiscount ?? data.subscription_discount ?? 0,
        voucher_discount: data.voucherDiscount ?? data.voucher_discount ?? 0,
        perk_discount: data.perkDiscount ?? data.perk_discount ?? 0,
        voucherCode: data.voucherCode ?? null,
        subscription_items_used: data.subscription_items_used ?? 0,
        total: data.total,
      });

      if (response.data.success) {
        await markAsScannedLocally(data.order_number);
        setLastResult({
          type: 'order_created',
          message: response.data.message || 'Order saved successfully!',
          details: response.data.data,
        });
      } else {
        Alert.alert('Order Failed', response.data.message || 'Failed to process order.', [
          { text: 'OK', onPress: resetScanner }
        ]);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to save order from QR.';
      Alert.alert('Error', msg, [{ text: 'OK', onPress: resetScanner }]);
    }
  };

  const handleSubscriptionRedeem = async (data: any) => {
    try {
      const response = await api.post('/admin/scan/subscription-redeem', data);
      if (response.data.success) {
        setLastResult({
          type: 'subscription',
          message: response.data.message,
          details: response.data.data,
        });
      } else {
        Alert.alert('Redemption Failed', response.data.message, [
          { text: 'OK', onPress: resetScanner }
        ]);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to redeem subscription.';
      Alert.alert('Error', msg, [{ text: 'OK', onPress: resetScanner }]);
    }
  };

  const handleOrderVerify = async (data: any) => {
    const orderCode = data.order_number || data.code || '';
    try {
      const response = await api.post('/admin/scan/verify-order', { order_number: orderCode });
      if (response.data.success) {
        setLastResult({
          type: 'order',
          message: response.data.message,
          details: response.data.data,
        });
      } else {
        Alert.alert('Order Not Found', response.data.message, [
          { text: 'OK', onPress: resetScanner }
        ]);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to verify order.';
      Alert.alert('Error', msg, [{ text: 'OK', onPress: resetScanner }]);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setLastResult(null);
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.permissionContainer}>
          <View style={styles.permissionIconCircle}>
            <Ionicons name="camera-outline" size={56} color="#3B82F6" />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Allow camera access to scan customer QR codes for order verification and subscription redemptions.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission} activeOpacity={0.85}>
            <Ionicons name="shield-checkmark" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.permissionBtnText}>Allow Camera</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera Background */}
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Dark Navy Overlay Content */}
      <View style={styles.scanOverlay}>
        {/* Top Section */}
        <View style={styles.topSection}>
          {/* Flash Button Top-Right */}
          <TouchableOpacity 
            onPress={() => setTorch(!torch)} 
            style={styles.flashBtn}
            activeOpacity={0.8}
          >
            <View style={[styles.flashIconCircle, torch && styles.flashIconCircleActive]}>
              <Ionicons name={torch ? 'flash' : 'flash-outline'} size={20} color={torch ? '#FFD700' : '#FFFFFF'} />
            </View>
            <Text style={styles.flashText}>Flash</Text>
          </TouchableOpacity>

          {/* Center Mascot & Header */}
          <View style={styles.headerCenter}>
            <View style={styles.mascotContainer}>
              <Image 
                source={require('../../../../assets/app/logo.png')} 
                style={styles.mascotImg} 
                resizeMode="contain" 
              />
              <Ionicons name="sparkles" size={14} color="#FFFFFF" style={styles.sparkleLeft} />
              <Ionicons name="sparkles" size={10} color="#FFFFFF" style={styles.sparkleRight} />
            </View>

            <Text style={styles.topTitle}>QR Scanner</Text>
            <Text style={styles.topSubtitle}>Scan a QR code to continue</Text>
          </View>
        </View>

        {/* Middle Viewfinder Frame Section (Dark Sides + Transparent Center) */}
        <View style={styles.middleRow}>
          <View style={styles.sideMask} />
          <View style={styles.scanFrame}>
            {/* Glowing Corner Brackets */}
            <View style={[styles.corner, styles.cTL]} />
            <View style={[styles.corner, styles.cTR]} />
            <View style={[styles.corner, styles.cBL]} />
            <View style={[styles.corner, styles.cBR]} />

            {/* Animated Scanning Laser */}
            {!processing && (
              <Animated.View style={[styles.scanLaserLine, animatedLaserStyle]} />
            )}

            {/* Processing Spinner */}
            {processing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color="#60A5FA" />
                <Text style={styles.processingText}>Processing...</Text>
              </View>
            )}
          </View>
          <View style={styles.sideMask} />
        </View>

        {/* Bottom Instruction Card Section */}
        <View style={styles.bottomSection}>
          <View style={styles.instructionCard}>
            <View style={styles.instructionIconCircle}>
              <Ionicons name="qr-code" size={20} color="#60A5FA" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.instructionTitle}>
                {scanned ? 'QR Code detected!' : 'Align QR code within the frame'}
              </Text>
              <Text style={styles.instructionSubtitle}>
                Make sure the code is clear and visible.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Result Card (slides up when scan completes) */}
      {lastResult && (
        <Animated.View entering={SlideInUp.duration(400)} style={styles.resultCard}>
          <View style={styles.resultIconRow}>
            <View style={[styles.resultIcon, { backgroundColor: lastResult.type === 'subscription' ? '#DCFCE7' : '#DBEAFE' }]}>
              <Ionicons
                name={lastResult.type === 'subscription' ? 'cafe' : 'receipt'}
                size={28}
                color={lastResult.type === 'subscription' ? '#16A34A' : '#2563EB'}
              />
            </View>
          </View>

          <Text style={styles.resultTitle}>
            {lastResult.type === 'subscription' ? '✅ Drink Redeemed!' : lastResult.type === 'order_created' ? '✅ Order Saved!' : '✅ Order Verified!'}
          </Text>
          <Text style={styles.resultMessage}>{lastResult.message}</Text>

          {lastResult.details && (
            <View style={styles.resultDetails}>
              {lastResult.details.order_number && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Order</Text>
                  <Text style={styles.resultValue}>{lastResult.details.order_number}</Text>
                </View>
              )}
              {lastResult.details.fulfillment && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Type</Text>
                  <Text style={styles.resultValue}>{lastResult.details.fulfillment}</Text>
                </View>
              )}
              {lastResult.details.ref_no && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Table</Text>
                  <Text style={styles.resultValue}>{lastResult.details.ref_no}</Text>
                </View>
              )}
              {lastResult.details.subscription_name && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Plan</Text>
                  <Text style={styles.resultValue}>{lastResult.details.subscription_name}</Text>
                </View>
              )}
              {lastResult.details.drinks_remaining !== undefined && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Remaining</Text>
                  <Text style={[styles.resultValue, { color: '#16A34A' }]}>{lastResult.details.drinks_remaining} drinks</Text>
                </View>
              )}
              {lastResult.details.customer_name && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Customer</Text>
                  <Text style={styles.resultValue}>{lastResult.details.customer_name}</Text>
                </View>
              )}
              {lastResult.details.total && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Total</Text>
                  <Text style={styles.resultValue}>₱{Number(lastResult.details.total).toFixed(2)}</Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.scanAgainBtn} onPress={resetScanner} activeOpacity={0.85}>
            <Ionicons name="scan" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.scanAgainText}>Scan Next</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

export default function ScannerPage() {
  return (
    <AdminGuard>
      <ScannerPageContent />
    </AdminGuard>
  );
}

const FRAME_SIZE = 260;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#091426',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  topSection: {
    flex: 1,
    backgroundColor: 'rgba(9, 20, 38, 0.88)',
    paddingTop: 40,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  flashBtn: {
    position: 'absolute',
    top: 40,
    right: 24,
    alignItems: 'center',
    zIndex: 10,
  },
  flashIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#172A46',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#263F66',
  },
  flashIconCircleActive: {
    backgroundColor: '#2563EB',
    borderColor: '#60A5FA',
  },
  flashText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    color: '#8A99AD',
    marginTop: 4,
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotContainer: {
    width: 58,
    height: 58,
    position: 'relative',
    marginBottom: 6,
  },
  mascotImg: {
    width: '100%',
    height: '100%',
  },
  sparkleLeft: {
    position: 'absolute',
    top: 0,
    left: -4,
  },
  sparkleRight: {
    position: 'absolute',
    top: 12,
    right: -6,
  },
  topTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#FFFFFF',
    lineHeight: 26,
    textAlign: 'center',
  },
  topSubtitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: '#8A99AD',
    marginTop: 2,
    textAlign: 'center',
  },
  middleRow: {
    width: '100%',
    flexDirection: 'row',
    height: FRAME_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideMask: {
    flex: 1,
    width: 0,
    height: '100%',
    backgroundColor: 'rgba(9, 20, 38, 0.88)',
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderColor: '#3B82F6',
  },
  cTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 18 },
  cTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 18 },
  cBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 18 },
  cBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 18 },
  scanLaserLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 10,
    height: 3,
    backgroundColor: '#60A5FA',
    borderRadius: 2,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 5,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: 'rgba(9, 20, 38, 0.88)',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 72,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  instructionCard: {
    width: '100%',
    maxWidth: 340,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#132238',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E3A5F',
  },
  instructionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E3454',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  instructionSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9,20,38,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  processingText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: '#60A5FA',
    marginTop: 10,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#091426',
  },
  permissionIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#132238',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1E3A5F',
  },
  permissionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  permissionText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  permissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: '#2563EB',
    borderRadius: 16,
  },
  permissionBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  resultCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  resultIconRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  resultIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#1E293B',
    textAlign: 'center',
  },
  resultMessage: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  resultDetails: {
    marginTop: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  resultLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#64748B',
  },
  resultValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#1E293B',
  },
  scanAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
  },
  scanAgainText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
