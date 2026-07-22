import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppData } from '../../lib/useAppData'; 
import { useAuth } from '../../lib/useAuth';
import { Colors } from './Colors';

interface AdminGuardProps {
  children: React.ReactNode;
}

/**
 * Wrap admin pages with this component.
 * Only renders children if user role is 'super_admin'.
 * Otherwise shows an access denied screen.
 */
export default function AdminGuard({ children }: AdminGuardProps) {
  const { data } = useAppData();
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  const role = data?.user?.role || 'user';
  const isAdmin = isLoggedIn && role === 'super_admin';

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-outline" size={56} color={Colors.neutral.gray400} />
        </View>
        <Text style={styles.title}>Access Denied</Text>
        <Text style={styles.subtitle}>
          This section is restricted to authorized personnel only.
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={18} color="#FFF" style={{ marginRight: 6 }} />
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#E1EEFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: Colors.primary.default,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: Colors.neutral.gray600,
    textAlign: 'center',
    lineHeight: 22,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: Colors.primary.default,
    borderRadius: 14,
  },
  backBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: '#FFF',
  },
});
