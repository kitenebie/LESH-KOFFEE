import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '../../../components/UI/Colors';

interface CheckoutPageProps {
  checkoutUrl: string;
  orderId: string;
  amount: number;
  onClose: () => void;
  onPaymentSuccess: () => void;
  onPaymentFailed?: () => void;
}

export default function CheckoutPage({
  checkoutUrl,
  orderId,
  amount,
  onClose,
  onPaymentSuccess,
  onPaymentFailed,
}: CheckoutPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Detect when payment is completed via URL redirect
  const handleNavigationChange = (navState: any) => {
    const { url } = navState;

    // Check if redirected to success URL
    if (url.includes('/payments/success') || url.includes('status=paid') || url.includes('status=completed')) {
      onPaymentSuccess();
    }

    // Check if payment failed/cancelled
    if (url.includes('status=failed') || url.includes('status=cancelled') || url.includes('error')) {
      onPaymentFailed?.();
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={Colors.primary.default} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={56} color={Colors.neutral.gray400} />
          <Text style={styles.errorTitle}>Payment Page Unavailable</Text>
          <Text style={styles.errorDesc}>Unable to load the payment page. Please try again.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => setError(false)}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={Colors.primary.default} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Secure Payment</Text>
          <Text style={styles.headerSub}>Order {orderId} • ₱{amount.toFixed(2)}</Text>
        </View>
        <Ionicons name="lock-closed" size={18} color="#4CAF50" />
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary.default} />
          <Text style={styles.loadingText}>Loading payment page...</Text>
        </View>
      )}

      {/* WebView */}
      <WebView
        source={{ uri: checkoutUrl }}
        style={styles.webview}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => setError(true)}
        onNavigationStateChange={handleNavigationChange}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={true}
        allowsBackForwardNavigationGestures={true}
      />

      {/* Footer Security Badge */}
      <View style={styles.footer}>
        <Ionicons name="shield-checkmark" size={14} color="#4CAF50" style={{ marginRight: 6 }} />
        <Text style={styles.footerText}>Secured by BUX.ph Payment Gateway</Text>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray200,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F0E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: Colors.primary.default,
  },
  headerSub: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: Colors.neutral.gray500,
    marginTop: 1,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FAF9F5',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: Colors.neutral.gray600,
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.gray200,
    backgroundColor: '#FFFFFF',
  },
  footerText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: Colors.neutral.gray500,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.primary.default,
    marginTop: 16,
    marginBottom: 8,
  },
  errorDesc: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: Colors.neutral.gray600,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: Colors.primary.default,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  retryBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FAF9F5',
  },
});
