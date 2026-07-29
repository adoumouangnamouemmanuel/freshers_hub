import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { queryClient } from '@/lib/queryClient';

/* 
 * ============================================================================
 * TODO: EXPO GO DEV BUILD TOGGLE
 * ============================================================================
 * If you are running this app in "Expo Go" (the standard app from App Store),
 * push notifications will NOT work correctly and might throw an error.
 * 
 * To run in Expo Go without crashing:
 * 1. Comment out the body of this hook
 * 2. Return the stubbed values:
 *    return { isEnabled: false, isLoading: false, enablePush: () => {}, disablePush: () => {}, expoPushToken: undefined };
 * ============================================================================
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications(accessToken: string | undefined) {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  const registerForPushNotificationsAsync = async () => {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    return token;
  };

  const enablePush = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setExpoPushToken(token);
        setIsEnabled(true);
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
        if (accessToken) {
          try {
            await fetch(`${API_URL}/notifications/push-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
              },
              body: JSON.stringify({ pushToken: token })
            });
          } catch (e) {
            console.error("Failed to sync push token with backend", e);
          }
        }
      }
    } catch (error) {
      console.error("Error enabling push:", error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const disablePush = useCallback(async () => {
    setIsLoading(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
      if (accessToken && expoPushToken) {
        try {
          await fetch(`${API_URL}/notifications/push-token`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ pushToken: expoPushToken })
          });
        } catch (e) {
          console.error("Failed to remove push token from backend", e);
        }
      }
      setIsEnabled(false);
      setExpoPushToken(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Notification tapped!", response);
      const data = response.notification.request.content.data;
      if (data && data.relatedEntity) {
        const [type, id] = (data.relatedEntity as string).split(':');
        if (type === 'post') router.push(`/post/${id}`);
        else if (type === 'event') router.push(`/event/${id}`);
        else router.push('/notifications');
      } else {
        router.push('/notifications');
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return { isEnabled, isLoading, enablePush, disablePush, expoPushToken, notification };
}
