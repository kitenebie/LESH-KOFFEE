import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useState, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as db from '../../../../lib/database';
import Animated, { FadeIn, SlideInDown, SlideInUp } from 'react-native-reanimated';
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
  const scannedSetRef = useRef<Set<string>>(new Set()); // in-memory dedup for current session

  const handleBarCodeScanned = useCallback((result: BarcodeScanningResult) => {
    if (scanned || processing) return;
    setScanned(true);
    processQRData(result.data);
  }, [scanned, processing]);

  /**
   * Validate QR format matches what GeneratedOrderQR produces.
   * Required fields: v, order_number, user_id, items (array with product_id, name, quantity, price), subtotal, total
   */
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

  /**
   * Check if order_number was already scanned (local SQLite dedup).
   */
  const isAlreadyScannedLocally = async (orderNumber: string): Promise<boolean> => {
    // Fast in-memory check first
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

  /**
   * Persist scanned order_number to SQLite for cross-session dedup.
   */
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
    } catch (e) {
      // Non-critical — server still enforces uniqueness
    }
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

      // Route based on QR type
      if (parsed.type === 'subscription_redeem') {
        await handleSubscriptionRedeem(parsed);
      } else if (parsed.v === 1 && parsed.order_number) {
        // New order QR format (v1) — validate & auto-save
        await handleOrderQRScan(parsed);
      } else if (parsed.type === 'order_code' || parsed.order_number) {
        // Legacy: plain order code verification
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

  /**
   * Handle new-format order QR (v:1).
   * 1. Validate format
   * 2. Check local duplicate
   * 3. Send to server (server also checks duplicate)
   * 4. Show result
   */
  const handleOrderQRScan = async (data: any) => {
    // Step 1: Validate QR format
    const validation = validateQRFormat(data);
    if (!validation.valid) {
      Alert.alert('Invalid QR Code', validation.error!, [{ text: 'OK', onPress: resetScanner }]);
      return;
    }

    // Step 2: Check local duplicate
    const alreadyScanned = await isAlreadyScannedLocally(data.order_number);
    if (alreadyScanned) {
      Alert.alert(
        'Duplicate Scan',
        `Order ${data.order_number} has already been scanned and processed.`,
        [{ text: 'OK', onPress: resetScanner }]
      );
      return;
    }

    // Step 3: Send to server for order creation (server also validates duplicate)
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
        // Step 4: Mark locally as scanned & show success
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

  // ─── Permission Screen ───────────────────────────────────────────────────────
  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.permissionContainer}>
          <View style={styles.permissionIconCircle}>
            <Ionicons name="camera-outline" size={56} color={Colors.primary.default} />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Allow camera access to scan customer QR codes for order verification and subscription redemptions.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission} activeOpacity={0.85}>
            <Ionicons name="shield-checkmark" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.permissionBtnText}>Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.permissionBackBtn}>
            <Text style={styles.permissionBackText}>Go Back</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ─── Main Scanner View ───────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Scan Frame Overlay */}
      <View style={styles.scanOverlay}>
        {/* Top area */}
        <View style={styles.overlaySection}>
          <Animated.View entering={SlideInDown.duration(400)} style={styles.topBar}>
            <TouchableOpacity>
              
            </TouchableOpacity>
            <Text style={styles.topTitle}>QR Scanner</Text>
            <TouchableOpacity onPress={() => setTorch(!torch)} style={styles.iconBtn}>
              <Ionicons name={torch ? 'flash' : 'flash-outline'} size={22} color={torch ? '#FFD700' : '#FFF'} />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Middle: scan frame */}
        <View style={styles.middleRow}>
          <View style={styles.overlayDarkSide} />
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cTL]} />
            <View style={[styles.corner, styles.cTR]} />
            <View style={[styles.corner, styles.cBL]} />
            <View style={[styles.corner, styles.cBR]} />
            {processing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color={Colors.secondary.default} />
                <Text style={styles.processingText}>Processing...</Text>
              </View>
            )}
          </View>
          <View style={styles.overlayDarkSide} />
        </View>

        {/* Bottom area */}
        <View style={[styles.overlaySection, { justifyContent: 'flex-start', paddingTop: 30 }]}>
          <Text style={styles.hintText}>
            {scanned ? 'QR Code detected!' : 'Align QR code within the frame'}
          </Text>
        </View>
      </View>

      {/* Result Card (slides up when scan completes) */}
      {lastResult && (
        <Animated.View entering={SlideInUp.duration(400)} style={styles.resultCard}>
          <View style={styles.resultIconRow}>
            <View style={[styles.resultIcon, { backgroundColor: lastResult.type === 'subscription' ? '#dcfce7' : '#dbeafe' }]}>
              <Ionicons
                name={lastResult.type === 'subscription' ? 'cafe' : 'receipt'}
                size={28}
                color={lastResult.type === 'subscription' ? '#16a34a' : '#2563eb'}
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
                  <Text style={[styles.resultValue, { color: '#16a34a' }]}>{lastResult.details.drinks_remaining} drinks</Text>
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

const FRAME_SIZE = 270;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },

  // ─── Overlay ─────────────────────────────────────────────────────────────────
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  overlaySection: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  middleRow: {
    flexDirection: 'row',
    height: FRAME_SIZE,
  },
  overlayDarkSide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
  },

  // ─── Corners ─────────────────────────────────────────────────────────────────
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: Colors.secondary.default,
  },
  cTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  cTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  cBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  cBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },

  // ─── Top Bar ─────────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FFF',
  },

  // ─── Hint ────────────────────────────────────────────────────────────────────
  hintText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },

  // ─── Processing ──────────────────────────────────────────────────────────────
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  processingText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: '#FFF',
    marginTop: 10,
  },

  // ─── Permission ──────────────────────────────────────────────────────────────
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#FAF9F5',
  },
  permissionIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F0E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: Colors.primary.default,
    textAlign: 'center',
  },
  permissionText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: Colors.neutral.gray600,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  permissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: Colors.secondary.default,
    borderRadius: 16,
  },
  permissionBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFF',
  },
  permissionBackBtn: {
    marginTop: 16,
    paddingVertical: 10,
  },
  permissionBackText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: Colors.neutral.gray500,
  },

  // ─── Result Card ─────────────────────────────────────────────────────────────
  resultCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
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
    color: Colors.primary.default,
    textAlign: 'center',
  },
  resultMessage: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: Colors.neutral.gray600,
    textAlign: 'center',
    marginTop: 4,
  },
  resultDetails: {
    marginTop: 16,
    backgroundColor: '#F8F7F3',
    borderRadius: 14,
    padding: 14,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE6',
  },
  resultLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: Colors.neutral.gray500,
  },
  resultValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: Colors.primary.default,
  },
  scanAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary.default,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
  },
  scanAgainText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: '#FFF',
  },
});
