import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../UI/Button';
import { Colors } from '../UI/Colors';
import { Input } from '../UI/Input';

interface StepContactProps {
  email: string;
  setEmail: (text: string) => void;
  password: string;
  setPassword: (text: string) => void;
  confirmPassword: string;
  setConfirmPassword: (text: string) => void;
  phone: string;
  setPhone: (text: string) => void;
  errors: { [key: string]: string };
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  onNext: () => void;
  onBack: () => void;
}

export const StepContact: React.FC<StepContactProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  phone,
  setPhone,
  errors,
  setErrors,
  onNext,
  onBack,
}) => {
  return (
    <View style={styles.container}>
      <Input
        label="Email Address"
        placeholder="yourname@example.com"
        required
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
        }}
        error={errors.email}
        leftIcon={<Ionicons name="mail-outline" size={20} color={Colors.primary.default} />}
      />

      <Input
        label="Password"
        placeholder="Create a password"
        required
        secureTextEntry
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
        }}
        error={errors.password}
        leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Colors.primary.default} />}
      />

      <Input
        label="Confirm Password"
        placeholder="Re-enter your password"
        required
        secureTextEntry
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
        }}
        error={errors.confirmPassword}
        leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Colors.primary.default} />}
      />

      <Input
        label="Phone Number"
        placeholder="9171234567"
        required
        keyboardType="phone-pad"
        maxLength={10}
        value={phone}
        onChangeText={(text) => {
          const cleanText = text.replace(/[^0-9]/g, '');
          setPhone(cleanText);
          if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
        }}
        error={errors.phone}
        leftIcon={
          <View style={styles.countryCodeContainer}>
            <Ionicons name="call-outline" size={20} color={Colors.primary.default} style={{ marginRight: 6 }} />
            <Text style={styles.countryCodeText}>+63</Text>
            <View style={styles.verticalDivider} />
          </View>
        }
      />

      <View style={styles.rowButtons}>
        <Button
          title="Back"
          variant="secondary"
          onPress={onBack}
          style={styles.halfBtn}
        />
        <Button
          title="Next"
          variant="primary"
          onPress={onNext}
          style={styles.halfBtn}
          rightIcon={<Ionicons name="arrow-forward" size={20} color="#fff" />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: Colors.primary.default,
  },
  verticalDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.neutral.gray300,
    marginLeft: 8,
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
});
