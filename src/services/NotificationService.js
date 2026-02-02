import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// This controls how notifications appear when app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,    // Show popup
    shouldPlaySound: true,    // Play sound
    shouldSetBadge: true,     // Show badge on app icon
  }),
});

const NotificationService = {

  // Ask user for permission and get their unique token
  async registerForPushNotifications() {
    let token;

    // Check if this is a real device (not emulator)
    if (!Device.isDevice) {
      console.log('Push notifications only work on real devices');
      return null;
    }

    // Check current permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If no permission yet, ask for it
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If still no permission, stop here
    if (finalStatus !== 'granted') {
      console.log('User denied notification permission');
      return null;
    }

    // Get the unique push token for this device
    token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    console.log('Push token:', token.data);

    // Android needs a notification channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token.data;
  },

  // Listen for notifications when app is in foreground
  addNotificationReceivedListener(callback) {
    return Notifications.addNotificationReceivedListener(callback);
  },

  // Listen for when user taps on notification
  addNotificationResponseListener(callback) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },
};

export default NotificationService;