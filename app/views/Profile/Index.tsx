import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useRouter } from 'expo-router';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
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
import PersonalDetailsView from './PersonalDetails';
import DeliveryAddressesView from './DeliveryAddresses';
import SecurityPrivacyView from './SecurityPrivacy';

import { useAppData } from '../../../lib/useAppData';
import { logout } from '../../../services/authService';
import { saveCartItems } from '../../../lib/database';

interface ProfileViewProps {
  showAlert: (title: string, message: string, onConfirm?: () => void, hideButton?: boolean, showCancel?: boolean) => void;
  onNavigateToStamps: () => void;
  initialSubView?: 'Main' | 'Personal' | 'Addresses' | 'Security';
  onClearInitialSubView?: () => void;
}

const menuItems = [
  { icon: 'person-outline', label: 'Personal Details', danger: false },
  { icon: 'location-outline', label: 'Delivery Addresses', danger: false },
  { icon: 'cafe-outline', label: 'Loyalty Stamp Card', danger: false, hasStampBadge: true },
  { icon: 'shield-checkmark-outline', label: 'Security & Privacy', danger: false },
  { icon: 'log-out-outline', label: 'Sign Out', danger: true },
];

export default function ProfileView({
  showAlert,
  onNavigateToStamps,
  initialSubView = 'Main',
  onClearInitialSubView,
}: ProfileViewProps) {
  const { data: dummyData } = useAppData();

  const [activeSubView, setActiveSubView] = React.useState<'Main' | 'Personal' | 'Addresses' | 'Security'>('Main');
  const router = useRouter();

  React.useEffect(() => {
    if (initialSubView && initialSubView !== 'Main') {
      setActiveSubView(initialSubView);
      if (onClearInitialSubView) {
        onClearInitialSubView();
      }
    }
  }, [initialSubView, onClearInitialSubView]);

  if (activeSubView === 'Personal') {
    return (
      <PersonalDetailsView
        onBack={() => setActiveSubView('Main')}
        showAlert={(title, message) => showAlert(title, message)}
      />
    );
  }

  if (activeSubView === 'Addresses') {
    return (
      <DeliveryAddressesView
        onBack={() => setActiveSubView('Main')}
        showAlert={(title, message) => showAlert(title, message)}
      />
    );
  }

  if (activeSubView === 'Security') {
    return (
      <SecurityPrivacyView
        onBack={() => setActiveSubView('Main')}
        showAlert={(title, message) => showAlert(title, message)}
      />
    );
  }

  return (
    <Animated.View
      entering={SlideInDown.duration(400)}
      style={styles.tabViewContainer}
    >
      <Animated.View entering={FadeIn.delay(200).duration(400)}>
        <Text style={styles.tabTitle}>My Profile</Text>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card Header */}
        <Animated.View entering={SlideInLeft.delay(300).duration(400)} style={styles.profileHeaderCard}>
          {dummyData?.user?.avatar ? (
            <Image
              source={{ uri: dummyData.user.avatar }}
              style={styles.profileAvatar}
            />
          ) : null}
          <Text style={styles.profileName}>{dummyData?.user?.name || 'User'}</Text>
          <Text style={styles.profileLevel}>{dummyData?.user?.memberLevelLabel || 'Lesh Kaffe Member'}</Text>
        </Animated.View>

        {/* Settings Group — each item alternates left/right */}
        <View style={styles.profileMenu}>
          {menuItems.map((item, index) => {
            const isLast = index === menuItems.length - 1;
            const enterAnim = index % 2 === 0
              ? SlideInLeft.delay(400 + index * 80).duration(400)
              : SlideInRight.delay(400 + index * 80).duration(400);

            return (
              <Animated.View key={item.label} entering={enterAnim}>
                <TouchableOpacity
                  style={[styles.profileMenuItem, isLast && { borderBottomWidth: 0 }]}
                  onPress={() => {
                    if (item.label === 'Personal Details') {
                      setActiveSubView('Personal');
                    } else if (item.label === 'Delivery Addresses') {
                      setActiveSubView('Addresses');
                    } else if (item.label === 'Security & Privacy') {
                      setActiveSubView('Security');
                    } else if (item.label === 'Loyalty Stamp Card') {
                      onNavigateToStamps();
                    } else if (item.label === 'Sign Out') {
                      showAlert('Sign Out', 'Are you sure you want to sign out?', async () => {
                        try {
                          await logout();
                          await saveCartItems([]);
                          router.replace('/');
                        } catch (e) {}
                      }, undefined, true);
                    }
                  }}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={item.danger ? Colors.danger.default : Colors.primary.default}
                  />
                  <Text style={[styles.profileMenuText, item.danger && { color: Colors.danger.default }]}>
                    {item.label}
                  </Text>
                  {item.hasStampBadge && (
                    <Text style={styles.stampBadgeText}>
                      {(dummyData.stamps?.achievements?.[0]?.collected || 0)}/{(dummyData.stamps?.achievements?.[0]?.required || 8)} ☕
                    </Text>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={Colors.neutral.gray500} />
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tabViewContainer: {
    flex: 1,
    padding: 28,
    paddingTop: 24,
  },
  tabTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    color: Colors.primary.default,
    marginBottom: 20,
  },
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  profileName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.neutral.gray900,
    marginBottom: 4,
  },
  profileLevel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: Colors.primary.default,
    opacity: 0.8,
  },
  stampBadgeText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: Colors.primary.default,
    marginRight: 6,
  },
  profileMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray200,
  },
  profileMenuText: {
    flex: 1,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: Colors.neutral.gray800,
    marginLeft: 12,
  },
});
