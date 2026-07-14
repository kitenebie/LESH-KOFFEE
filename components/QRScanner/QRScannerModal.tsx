import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import React, { useState, useCallback } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Colors } from '../UI/Colors';

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanned: (data: string) => void;
  title?: string;
  subtitle?: string;
}

export default function QRScannerModal({
  visible,
  onClose,
  onScanned,
  title = 'Scan QR Code',
  subtitle = 'Point your camera at a QR code to scan',
}: QRScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);

  const handleBarCodeScanned = useCallback((result: BarcodeScanningResult) => {
    if (scanned) return; // Prevent multiple fires
    setScanned(true);

    // Pass data to parent
    onScanned(result.data);

    // Reset after delay so it can scan again if modal stays open
    setTimeout(() => setScanned(false), 2000);
  }, [scanned, onScanned]);

  const handleClose = () => {
    setScanned(false);
    setTorch(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
          <TouchableOpacity onPress={() => setTorch(!torch)} style={styles.torchBtn}>
            <Ionicons name={torch ? 'flash' : 'flash-outline'} size={24} color={torch ? '#FFD700' : '#FFF'} />
          </TouchableOpacity>
        </Animated.View>

        {/* Camera or Permission View */}
        {!permission?.granted ? (
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={64} color={Colors.neutral.gray400} />
            <Text style={styles.permissionTitle}>Camera Access Needed</Text>
            <Text style={styles.permissionText}>
              We need camera access to scan QR codes.
            </Text>
            <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
              <Text style={styles.permissionBtnText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              enableTorch={torch}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />

            {/* Scan Overlay */}
            <View style={styles.scanOverlay}>
              {/* Top dark */}
              <View style={styles.overlayDark} />

              {/* Middle row with corners */}
              <View style={styles.overlayMiddle}>
                <View style={styles.overlayDark} />
                <View style={styles.scanFrame}>
                  {/* Corner markers */}
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />

                  {/* Scan line animation */}
                  {!scanned && (
                    <Animated.View
                      entering={FadeIn.duration(500)}
                      style={styles.scanLine}
                    />
                  )}
                </View>
                <View style={styles.overlayDark} />
              </View>

              {/* Bottom dark */}
              <View style={styles.overlayDark} />
            </View>

            {/* Scanned indicator */}
            {scanned && (
              <Animated.View entering={SlideInDown.duration(300)} style={styles.scannedBanner}>
                <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                <Text style={styles.scannedText}>QR Code Scanned!</Text>
              </Animated.View>
            )}
          </View>
        )}

        {/* Bottom hint */}
        <View style={styles.bottomHint}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.neutral.gray400} />
          <Text style={styles.bottomHintText}>
            Position the QR code within the frame to scan
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const SCAN_FRAME_SIZE = 260;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 10,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 17,
    color: '#FFF',
  },
  headerSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  torchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Permission
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#FFF',
    marginTop: 16,
  },
  permissionText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 8,
  },
  permissionBtn: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: Colors.secondary.default,
    borderRadius: 14,
  },
  permissionBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: '#FFF',
  },

  // Camera
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },

  // Scan overlay
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayDark: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: SCAN_FRAME_SIZE,
  },
  scanFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    position: 'relative',
  },

  // Corner markers
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: Colors.secondary.default,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },

  // Scan line
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: Colors.secondary.default,
    borderRadius: 1,
    opacity: 0.8,
  },

  // Scanned banner
  scannedBanner: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingVertical: 14,
    borderRadius: 14,
  },
  scannedText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: '#FFF',
  },

  // Bottom hint
  bottomHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  bottomHintText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: Colors.neutral.gray400,
  },
});
