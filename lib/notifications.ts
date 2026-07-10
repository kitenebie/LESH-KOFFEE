import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ─── Configure notification behavior ────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Register for push notifications ────────────────────────────────────────

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[Notifications] Must use physical device for push notifications');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permission not granted');
    return null;
  }

  // Get the Expo push token (uses FCM under the hood for Android)
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    console.log('[Notifications] Push token:', token.data);

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#B36534',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Order Updates',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Notifications for order status updates',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('promos', {
        name: 'Promos & Offers',
        importance: Notifications.AndroidImportance.DEFAULT,
        description: 'Promotional offers and discounts',
      });
    }

    return token.data;
  } catch (error) {
    console.error('[Notifications] Error getting push token:', error);
    return null;
  }
}

// ─── Get FCM device token (native Firebase token) ───────────────────────────

export async function getDevicePushToken(): Promise<string | null> {
  try {
    const token = await Notifications.getDevicePushTokenAsync();
    console.log('[Notifications] FCM Token:', token.data);
    return token.data as string;
  } catch (error) {
    console.error('[Notifications] Error getting FCM token:', error);
    return null;
  }
}

// ─── Notification listeners ─────────────────────────────────────────────────

export type NotificationListener = Notifications.Subscription;

/**
 * Listen for notifications received while app is in foreground
 */
export function onNotificationReceived(
  callback: (notification: Notifications.Notification) => void
): NotificationListener {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Listen for when user taps on a notification
 */
export function onNotificationTapped(
  callback: (response: Notifications.NotificationResponse) => void
): NotificationListener {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// ─── Send local notification (for testing) ──────────────────────────────────

export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
  channelId: string = 'default'
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      channelId,
    },
  });
}

// ─── Get badge count ────────────────────────────────────────────────────────

export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}
