import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
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
import { useAppData } from '../../../lib/useAppData';

interface PersonalDetailsProps {
  onBack: () => void;
  showAlert: (title: string, message: string) => void;
}

export default function PersonalDetailsView({ onBack, showAlert }: PersonalDetailsProps) {
  const { data: dummyData } = useAppData();

  const [name, setName] = useState(dummyData?.user?.name || '');
  const [email, setEmail] = useState(dummyData?.user?.email || '');
  const [phone, setPhone] = useState(dummyData?.user?.phone || '');

  // Sync state when data updates from API/SQLite
  useEffect(() => {
    if (dummyData?.user?.name) setName(dummyData.user.name);
    if (dummyData?.user?.email) setEmail(dummyData.user.email);
    if (dummyData?.user?.phone) setPhone(dummyData.user.phone);
  }, [dummyData?.user?.name, dummyData?.user?.email, dummyData?.user?.phone]);

  const handleSave = () => {
    showAlert('Profile Updated', 'Your personal details have been saved successfully.');
    onBack();
  };

  return (
    <Animated.View entering={SlideInDown.duration(400)} style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary.default} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Details</Text>
        <View style={{ width: 44 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Avatar section */}
        <Animated.View entering={SlideInDown.delay(300).duration(400)} style={styles.avatarSection}>
          <Image source={{ uri: dummyData.user.avatar }} style={styles.avatar} />
          <TouchableOpacity style={styles.changePicBtn} activeOpacity={0.85}>
            <Ionicons name="camera" size={16} color="#FAF9F5" />
          </TouchableOpacity>
        </Animated.View>

        {/* Input Form */}
        <View style={styles.form}>
          <Animated.View entering={SlideInLeft.delay(400).duration(400)} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color={Colors.primary.default} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter full name"
                placeholderTextColor={Colors.neutral.gray400}
              />
            </View>
          </Animated.View>

          <Animated.View entering={SlideInRight.delay(500).duration(400)} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={Colors.primary.default} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter email address"
                placeholderTextColor={Colors.neutral.gray400}
              />
            </View>
          </Animated.View>

          <Animated.View entering={SlideInLeft.delay(600).duration(400)} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={18} color={Colors.primary.default} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="Enter phone number"
                placeholderTextColor={Colors.neutral.gray400}
              />
            </View>
          </Animated.View>

          <Animated.View entering={SlideInRight.delay(700).duration(400)} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Joined Date</Text>
            <View style={[styles.inputWrapper, styles.disabledInput]}>
              <Ionicons name="calendar-outline" size={18} color={Colors.neutral.gray400} style={styles.inputIcon} />
              <Text style={styles.readOnlyText}>{dummyData.user.joinedDate}</Text>
            </View>
          </Animated.View>
        </View>

        {/* Save button */}
        <Animated.View entering={SlideInDown.delay(800).duration(400)}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
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
    backgroundColor: '#F3F0E6',
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
    alignSelf: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.secondary.default,
  },
  changePicBtn: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    backgroundColor: Colors.secondary.default,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FAF9F5',
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: Colors.neutral.gray600,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
  },
  disabledInput: {
    backgroundColor: Colors.neutral.gray100,
    borderColor: Colors.neutral.gray200,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 14,
    color: Colors.neutral.gray900,
    height: '100%',
  },
  readOnlyText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: Colors.neutral.gray500,
  },
  saveBtn: {
    backgroundColor: Colors.secondary.default,
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.secondary.default,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: '#FAF9F5',
  },
});
