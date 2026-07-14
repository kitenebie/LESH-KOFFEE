import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../UI/Button';
import { Colors } from '../UI/Colors';

interface StepOtpProps {
  otp: string[];
  setOtp: React.Dispatch<React.SetStateAction<string[]>>;
  phone: string;
  isLoading: boolean;
  otpError?: string;
  onBack: () => void;
  onSubmit: () => void;
  onResend: () => void;
  resendCooldown: number; // seconds remaining
}

export const StepOtp: React.FC<StepOtpProps> = ({
  otp,
  setOtp,
  phone,
  isLoading,
  otpError,
  onBack,
  onSubmit,
  onResend,
  resendCooldown,
}) => {
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanText.slice(-1);
    setOtp(newOtp);

    // Auto-focus next digit slot
    if (cleanText && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const formatTimer = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* OTP Digits Entry Container */}
      <View style={styles.otpGrid}>
        {otp.map((digit, idx) => (
          <TextInput
            key={idx}
            ref={(el) => { otpRefs.current[idx] = el; }}
            style={[
              styles.otpInputBox,
              digit !== '' && styles.otpInputBoxFilled,
              otpError ? styles.otpInputBoxError : null,
            ]}
            maxLength={1}
            keyboardType="number-pad"
            value={digit}
            onChangeText={(text) => handleOtpChange(text, idx)}
            onKeyPress={(e) => handleOtpKeyPress(e, idx)}
            textAlign="center"
            selectTextOnFocus
          />
        ))}
      </View>

      {/* Error message */}
      {otpError ? (
        <Text style={styles.errorText}>{otpError}</Text>
      ) : null}

      {/* Resend / Timer */}
      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>{"Didn't receive code?"}</Text>
        {resendCooldown > 0 ? (
          <Text style={styles.resendTimer}>Resend in {formatTimer(resendCooldown)}</Text>
        ) : (
          <TouchableOpacity onPress={onResend}>
            <Text style={styles.resendLink}>Resend OTP</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.rowButtons}>
        <Button
          title="Back"
          variant="secondary"
          onPress={onBack}
          style={styles.halfBtn}
        />
        <Button
          title="Verify & Register"
          variant="primary"
          loading={isLoading}
          onPress={onSubmit}
          style={styles.halfBtn}
          rightIcon={<Ionicons name="checkmark-circle-outline" size={20} color="#fff" />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  rowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
  },
  halfBtn: {
    width: '48%',
    borderRadius: 28,
    height: 56,
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 20,
  },
  otpInputBox: {
    width: 44,
    height: 54,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1.5,
    borderColor: Colors.neutral.gray300,
    borderRadius: 12,
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: Colors.primary.default,
    shadowColor: Colors.neutral.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  otpInputBoxFilled: {
    borderColor: Colors.primary.default,
    backgroundColor: '#F8F7F2',
  },
  otpInputBoxError: {
    borderColor: '#E53935',
  },
  errorText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#E53935',
    textAlign: 'center',
    marginBottom: 8,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  resendText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: Colors.neutral.gray600,
    marginRight: 6,
  },
  resendLink: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: Colors.primary.default,
    textDecorationLine: 'underline',
  },
  resendTimer: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: Colors.neutral.gray500,
  },
});
