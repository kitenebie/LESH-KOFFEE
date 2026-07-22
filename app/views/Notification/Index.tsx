import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
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
import { useAppData } from '../../../lib/useAppData';

interface NotificationViewProps {
  onBack?: () => void;
}

export default function NotificationView({ onBack }: NotificationViewProps) {
  const { data: dummyData } = useAppData();

  return (
    <Animated.View
      entering={SlideInDown.duration(400)}
      style={styles.tabViewContainer}
    >
      <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.headerRow}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={Colors.primary.default} />
          </TouchableOpacity>
        )}
        <Text style={styles.tabTitle}>Notifications</Text>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {dummyData.notifications.map((notif, index) => (
          <Animated.View
            key={notif.id}
            entering={
              index % 2 === 0
                ? SlideInLeft.delay(300 + index * 80).duration(400)
                : SlideInRight.delay(300 + index * 80).duration(400)
            }
            style={[
              styles.notifCard,
              notif.unread && { borderLeftWidth: 3, borderLeftColor: Colors.primary.default }
            ]}
          >
            <View style={styles.notifIconBg}>
              <Ionicons name={notif.icon as any} size={20} color={Colors.primary.default} />
            </View>
            <View style={styles.notifContent}>
              <Text style={styles.notifTitle}>{notif.title}</Text>
              <Text style={styles.notifDesc}>{notif.message}</Text>
              <Text style={styles.notifTime}>{notif.time}</Text>
            </View>
          </Animated.View>
        ))}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    marginRight: 8,
    marginLeft: -6,
  },
  tabTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    color: Colors.primary.default,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: Colors.primary.default,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  notifIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E1EEFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: Colors.primary.default,
    marginBottom: 2,
  },
  notifDesc: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: Colors.neutral.gray600,
    lineHeight: 15,
    marginBottom: 4,
  },
  notifTime: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 9,
    color: Colors.neutral.gray400,
  },
});
