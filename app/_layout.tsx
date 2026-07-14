import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts
} from '@expo-google-fonts/poppins';
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from "react";
import { StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { prefetchPublicData } from '../lib/prefetch';
import { initDatabase } from '../lib/database';
import { AppDataProvider } from '../lib/useAppData';
import { getAuthToken } from '../lib/authSession';
import { resumeSession } from '../services/authService';
import {
  registerForPushNotifications,
  onNotificationReceived,
  onNotificationTapped,
  NotificationListener,
} from '../lib/notifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const notifReceivedRef = useRef<NotificationListener | null>(null);
  const notifTappedRef = useRef<NotificationListener | null>(null);

  const [loaded, error] = useFonts({
    'Poppins': Poppins_400Regular,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  // Initialize database, prefetch data, and register notifications
  useEffect(() => {
    const bootstrap = async () => {
      try {
        await initDatabase();
        prefetchPublicData();

        // Auto-resume: If a stored token exists, validate it with the server
        try {
          const token = await getAuthToken();
          if (token) {
            const result = await resumeSession();
            if (result.success) {
              console.log('[Layout] Session resumed successfully');
            } else {
              console.log('[Layout] Token expired, user needs to re-login');
            }
          } else {
            console.log('[Layout] No stored token, user not logged in');
          }
        } catch (authErr) {
          console.warn('[Layout] Session resume failed:', authErr);
        }

        // Register for push notifications (FCM) — silently fails in Expo Go
        try {
          const pushToken = await registerForPushNotifications();
          if (pushToken) {
            console.log('[Layout] Push token registered:', pushToken);
          }
        } catch (notifErr) {
          // Push notifications not available in Expo Go — ignore silently
          console.log('[Layout] Push notifications unavailable (Expo Go)');
        }
      } catch (err) {
        console.warn('[Layout] Bootstrap error:', err);
      }
    };
    bootstrap();

    // Listen for notifications — wrapped in try/catch for Expo Go compatibility
    try {
      notifReceivedRef.current = onNotificationReceived((notification) => {
        console.log('[Notification Received]', notification.request.content);
      });

      notifTappedRef.current = onNotificationTapped((response) => {
        const data = response.notification.request.content.data;
        console.log('[Notification Tapped]', data);

        if (data?.screen === 'orders') {
          router.push('/views/Home/Index');
        } else if (data?.screen === 'wallet') {
          router.push('/views/Home/Index');
        }
      });
    } catch (e) {
      // Listeners not available in Expo Go — ignore
    }

    return () => {
      notifReceivedRef.current?.remove();
      notifTappedRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <AppDataProvider>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" hidden={false} backgroundColor="#B36534" />
        <SafeAreaView style={{ flex: 1, backgroundColor: '#975328ff' }}>
          <Stack screenOptions={{ animation: 'slide_from_bottom', headerShown: false }} />
        </SafeAreaView>
      </SafeAreaProvider>
    </AppDataProvider>
  );
}
