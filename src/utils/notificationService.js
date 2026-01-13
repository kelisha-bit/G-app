import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { auth, db } from '../../firebase.config';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  /**
   * Request notification permissions from the user
   */
  async requestPermissions() {
    // Push notifications are not supported on web
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        if (__DEV__) {
          console.warn('Failed to get push token for push notification! Permission not granted.');
        }
        return false;
      }

      return true;
    } catch (error) {
      if (__DEV__) {
        console.warn('Error requesting notification permissions:', error);
      }
      return false;
    }
  }

  /**
   * Register device for push notifications and save token to Firebase
   */
  async registerForPushNotifications() {
    // Push notifications are not supported on web
    if (Platform.OS === 'web') {
      if (__DEV__) {
        console.log('Push notifications are not supported on web platform');
      }
      return null;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Get the Expo push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '518717a0-b81e-4a06-a54e-b599f4155c88', // From app.json
      });

      this.expoPushToken = token.data;
      if (__DEV__) {
        console.log('Expo Push Token:', this.expoPushToken);
      }

      // Save token to Firebase
      const user = auth.currentUser;
      if (user) {
        await this.saveTokenToFirebase(this.expoPushToken);
      }

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366f1',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('events', {
          name: 'Event Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366f1',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('announcements', {
          name: 'Announcements',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#ef4444',
          sound: 'default',
        });
      }

      return this.expoPushToken;
    } catch (error) {
      if (__DEV__) {
        console.error('Error registering for push notifications:', error);
      }
      return null;
    }
  }

  /**
   * Save push token to Firebase user document
   */
  async saveTokenToFirebase(token) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const tokens = userData.pushTokens || [];
        
        // Add token if not already present
        if (!tokens.includes(token)) {
          tokens.push(token);
          await updateDoc(userRef, {
            pushTokens: tokens,
            lastTokenUpdate: new Date().toISOString(),
          });
        }
      } else {
        // Create user document if it doesn't exist
        await setDoc(userRef, {
          pushTokens: [token],
          lastTokenUpdate: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error saving token to Firebase:', error);
    }
  }

  /**
   * Remove token from Firebase when user logs out
   */
  async removeTokenFromFirebase(token) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const tokens = (userData.pushTokens || []).filter(t => t !== token);
        
        await updateDoc(userRef, {
          pushTokens: tokens,
        });
      }
    } catch (error) {
      console.error('Error removing token from Firebase:', error);
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(title, body, data = {}, trigger = null) {
    // Local notifications are not fully supported on web
    if (Platform.OS === 'web') {
      if (__DEV__) {
        console.log('Local notifications are not supported on web platform');
      }
      return null;
    }

    try {
      // Format trigger properly for Expo Notifications
      // Expo requires trigger to have a 'type' property
      let formattedTrigger = null;
      
      if (trigger) {
        if (trigger instanceof Date) {
          // Use date trigger type
          formattedTrigger = {
            type: 'date',
            date: trigger,
          };
        } else if (typeof trigger === 'object' && trigger.seconds !== undefined) {
          // Use timeInterval trigger type for seconds-based triggers
          formattedTrigger = {
            type: 'timeInterval',
            seconds: trigger.seconds,
          };
        } else if (typeof trigger === 'object' && trigger.date) {
          // Date trigger with date property
          formattedTrigger = {
            type: 'date',
            date: trigger.date,
          };
        } else if (typeof trigger === 'object' && trigger.type) {
          // Already has type, use as-is
          formattedTrigger = trigger;
        } else {
          // Invalid trigger format, show immediately
          formattedTrigger = null;
        }
      }
      // If trigger is null, notification shows immediately

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          channelId: 'events', // Use events channel for event reminders
        },
        trigger: formattedTrigger, // null means show immediately
      });

      return notificationId;
    } catch (error) {
      if (__DEV__) {
        console.error('Error scheduling notification:', error);
      }
      return null;
    }
  }

  /**
   * Schedule event reminder notifications
   */
  async scheduleEventReminder(event) {
    try {
      const eventDate = new Date(event.date);
      const now = new Date();

      // Don't schedule if event is in the past
      if (eventDate <= now) {
        return null;
      }

      const notificationIds = [];

      // Schedule 24-hour reminder
      const reminder24h = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
      if (reminder24h > now) {
        // Calculate seconds from now until reminder time
        const secondsUntil24h = Math.floor((reminder24h.getTime() - now.getTime()) / 1000);
        
        const id = await this.scheduleLocalNotification(
          `Event Reminder: ${event.title}`,
          `Don't forget about ${event.title} tomorrow!`,
          {
            type: 'event',
            eventId: event.id,
            screen: 'EventDetails',
          },
          { seconds: secondsUntil24h }
        );
        if (id) notificationIds.push(id);
      }

      // Schedule 1-hour reminder
      const reminder1h = new Date(eventDate.getTime() - 60 * 60 * 1000);
      if (reminder1h > now) {
        // Calculate seconds from now until reminder time
        const secondsUntil1h = Math.floor((reminder1h.getTime() - now.getTime()) / 1000);
        
        const id = await this.scheduleLocalNotification(
          `Event Starting Soon: ${event.title}`,
          `${event.title} starts in 1 hour!`,
          {
            type: 'event',
            eventId: event.id,
            screen: 'EventDetails',
          },
          { seconds: secondsUntil1h }
        );
        if (id) notificationIds.push(id);
      }

      return notificationIds;
    } catch (error) {
      console.error('Error scheduling event reminder:', error);
      return null;
    }
  }

  /**
   * Cancel scheduled notifications
   */
  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Send immediate notification (for testing or urgent messages)
   */
  async sendImmediateNotification(title, body, data = {}) {
    return await this.scheduleLocalNotification(title, body, data, null);
  }

  /**
   * Setup notification listeners
   */
  setupNotificationListeners(navigation) {
    // Notification listeners are not supported on web
    if (Platform.OS === 'web') {
      return;
    }

    try {
      // Listener for notifications received while app is foregrounded
      this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
        if (__DEV__) {
          console.log('Notification received:', notification);
        }
        // You can handle foreground notifications here
      });

      // Listener for when user taps on notification
      this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        if (__DEV__) {
          console.log('Notification tapped:', data);
        }

        // Navigate based on notification data
        if (data.screen && navigation) {
          if (data.eventId) {
            navigation.navigate(data.screen, { eventId: data.eventId });
          } else {
            navigation.navigate(data.screen);
          }
        }
      });
    } catch (error) {
      if (__DEV__) {
        console.warn('Error setting up notification listeners:', error);
      }
    }
  }

  /**
   * Remove notification listeners
   */
  removeNotificationListeners() {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
  }

  /**
   * Check if user has notification permissions enabled
   */
  async checkPermissions() {
    // Push notifications are not supported on web
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      if (__DEV__) {
        console.warn('Error checking notification permissions:', error);
      }
      return false;
    }
  }

  /**
   * Get badge count
   */
  async getBadgeCount() {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count) {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge count
   */
  async clearBadge() {
    await Notifications.setBadgeCountAsync(0);
  }
}

// Export singleton instance
export default new NotificationService();

