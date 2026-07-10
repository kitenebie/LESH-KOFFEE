import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from './Colors';

interface LoginRequiredModalProps {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

export function LoginRequiredModal({ visible, onClose, onLogin, onRegister }: LoginRequiredModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={48} color={Colors.primary.default} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Login Required</Text>

          {/* Description */}
          <Text style={styles.description}>
            You need to login in to access this feature. Login or create an account to continue.
          </Text>

          {/* Login In Button */}
          <TouchableOpacity style={styles.primaryBtn} onPress={onLogin} activeOpacity={0.85}>
            <Ionicons name="log-in-outline" size={18} color="#FAF9F5" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Login In</Text>
          </TouchableOpacity>

          {/* Create Account Button */}
          <TouchableOpacity style={styles.secondaryBtn} onPress={onRegister} activeOpacity={0.85}>
            <Ionicons name="person-add-outline" size={18} color={Colors.primary.default} style={{ marginRight: 8 }} />
            <Text style={styles.secondaryBtnText}>Create Account</Text>
          </TouchableOpacity>

          {/* Maybe Later */}
          <TouchableOpacity style={styles.laterBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.laterBtnText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F0E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: Colors.primary.default,
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: Colors.neutral.gray600,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.default,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  primaryBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: '#FAF9F5',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF9F5',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary.default,
    marginBottom: 16,
  },
  secondaryBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: Colors.primary.default,
  },
  laterBtn: {
    paddingVertical: 8,
  },
  laterBtnText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: Colors.neutral.gray500,
  },
});
