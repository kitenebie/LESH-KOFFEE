import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  FadeIn,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated';
import { Colors } from '../../../components/UI/Colors';

interface SecurityPrivacyProps {
  onBack: () => void;
  showAlert: (title: string, message: string, onConfirm?: () => void) => void;
}

export default function SecurityPrivacyView({ onBack, showAlert }: SecurityPrivacyProps) {
  const [biometrics, setBiometrics] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailMarketing, setEmailMarketing] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert('Error', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('Error', 'New password and confirm password do not match.');
      return;
    }
    showAlert('Success', 'Your password has been changed successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleDeleteAccount = () => {
    showAlert(
      'Delete Account ⚠️',
      'Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.'
    );
  };

  return (
    <Animated.View entering={SlideInDown.duration(400)} style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary.default} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security & Privacy</Text>
        <View style={{ width: 44 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Toggle Preferences Card */}
        <Animated.View entering={SlideInLeft.delay(300).duration(400)} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleLabel}>Biometric Sign-In</Text>
              <Text style={styles.toggleDesc}>Use FaceID or Fingerprint to unlock wallet</Text>
            </View>
            <Switch
              value={biometrics}
              onValueChange={setBiometrics}
              trackColor={{ false: Colors.neutral.gray300, true: Colors.secondary.default }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleLabel}>Push Notifications</Text>
              <Text style={styles.toggleDesc}>Get real-time updates on order tracking</Text>
            </View>
            <Switch
              value={pushNotifs}
              onValueChange={setPushNotifs}
              trackColor={{ false: Colors.neutral.gray300, true: Colors.secondary.default }}
              thumbColor="#FFF"
            />
          </View>

          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleLabel}>Email Marketing</Text>
              <Text style={styles.toggleDesc}>Receive exclusive discount vouchers via email</Text>
            </View>
            <Switch
              value={emailMarketing}
              onValueChange={setEmailMarketing}
              trackColor={{ false: Colors.neutral.gray300, true: Colors.secondary.default }}
              thumbColor="#FFF"
            />
          </View>
        </Animated.View>

        {/* Change Password Form */}
        <Animated.View entering={SlideInRight.delay(500).duration(400)} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Change Password</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={Colors.neutral.gray400}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={Colors.neutral.gray400}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={Colors.neutral.gray400}
            />
          </View>

          <TouchableOpacity style={styles.changePassBtn} onPress={handleChangePassword} activeOpacity={0.85}>
            <Text style={styles.changePassBtnText}>Update Password</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Danger zone */}
        <Animated.View entering={SlideInDown.delay(700).duration(400)} style={[styles.sectionCard, styles.dangerCard]}>
          <Text style={[styles.sectionTitle, { color: Colors.danger.default }]}>Danger Zone</Text>
          <Text style={styles.dangerDesc}>Once you delete your account, there is no going back. Please be certain.</Text>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.85}>
            <Text style={styles.deleteBtnText}>Delete Account</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </Animated.View>
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
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E1EEFA',
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
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: Colors.primary.default,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray100,
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: 16,
  },
  toggleLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: Colors.neutral.gray800,
    marginBottom: 2,
  },
  toggleDesc: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    color: Colors.neutral.gray500,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: Colors.neutral.gray500,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    fontFamily: 'Poppins',
    fontSize: 13,
    color: Colors.neutral.gray900,
  },
  changePassBtn: {
    backgroundColor: Colors.primary.default,
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  changePassBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#FAF9F5',
  },
  dangerCard: {
    borderColor: 'rgba(211, 47, 47, 0.2)',
    backgroundColor: '#FFF5F5',
  },
  dangerDesc: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: Colors.neutral.gray600,
    lineHeight: 18,
    marginBottom: 16,
  },
  deleteBtn: {
    backgroundColor: Colors.danger.default,
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#FAF9F5',
  },
});
