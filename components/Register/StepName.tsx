import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '../UI/Button';
import { Colors } from '../UI/Colors';
import { Input } from '../UI/Input';

interface StepNameProps {
  firstName: string;
  setFirstName: (text: string) => void;
  middleName: string;
  setMiddleName: (text: string) => void;
  lastName: string;
  setLastName: (text: string) => void;
  errors: { [key: string]: string };
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  onNext: () => void;
}

export const StepName: React.FC<StepNameProps> = ({
  firstName,
  setFirstName,
  middleName,
  setMiddleName,
  lastName,
  setLastName,
  errors,
  setErrors,
  onNext,
}) => {
  return (
    <View style={styles.container}>
      <Input
        label="First Name"
        placeholder="Enter first name"
        required
        value={firstName}
        onChangeText={(text) => {
          setFirstName(text);
          if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: '' }));
        }}
        error={errors.firstName}
        leftIcon={<Ionicons name="person-outline" size={20} color={Colors.primary.default} />}
      />

      <Input
        label="Middle Name"
        placeholder="Enter middle name (optional)"
        value={middleName}
        onChangeText={setMiddleName}
        leftIcon={<Ionicons name="person-outline" size={20} color={Colors.primary.default} />}
      />

      <Input
        label="Last Name"
        placeholder="Enter last name"
        required
        value={lastName}
        onChangeText={(text) => {
          setLastName(text);
          if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: '' }));
        }}
        error={errors.lastName}
        leftIcon={<Ionicons name="person-outline" size={20} color={Colors.primary.default} />}
      />

      <Button
        title="Next"
        variant="primary"
        onPress={onNext}
        style={styles.actionBtn}
        rightIcon={<Ionicons name="arrow-forward" size={20} color="#fff" />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  actionBtn: {
    marginTop: 24,
    shadowColor: Colors.primary.default,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
});
