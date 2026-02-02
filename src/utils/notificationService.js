import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
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
    this.channelsInitialized = false;
  }

  /**
   * Initialize Android notification channels
   * This MUST be called early in app lifecycle, before any notifications are sent
   * Uses retry logic to handle race conditions and ensures channels are created properly
   */
  async initializeAndroidChannels(retries = 3) {
    if (Platform.OS !== 'android') {
      return;
    }

    // If already initialized, don't re-initialize unless forced
    if (this.channelsInitialized) {
      if (__DEV__) {
        console.log('Android channels already initialized, skipping');
      }
      return;
    }

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // Create default channel (required for all notifications)
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          description: 'General notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366f1',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });

        // Create events channel
        await Notifications.setNotificationChannelAsync('events', {
          name: 'Event Reminders',
          description: 'Notifications for upcoming events',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366f1',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });

        // Create announcements channel (highest priority)
        await Notifications.setNotificationChannelAsync('announcements', {
          name: 'Announcements',
          description: 'Church announcements and important updates',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#ef4444',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });

        this.channelsInitialized = true;
        
        if (__DEV__) {
          console.log('✅ Android notification channels initialized successfully');
        }
        return; // Success, exit the retry loop
      } catch (error) {
        const errorMessage = error.message || error.toString();
        
        // If channels already exist, that's okay - mark as initialized
        if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
          this.channelsInitialized = true;
          if (__DEV__) {
            console.log('✅ Android notification channels already exist');
          }
          return;
        }

        // On last attempt, log error and mark as initialized to prevent retry loops
        if (attempt === retries - 1) {
          if (__DEV__) {
            console.error('❌ Error initializing Android notification channels after retries:', error);
            console.warn('⚠️ App will continue but notifications may not work properly');
          }
          // Mark as initialized anyway to prevent infinite retry loops
          // Channels might still work if they were created in a previous session
          this.channelsInitialized = true;
          return;
        }

        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 100; // 100ms, 200ms, 400ms
        if (__DEV__) {
          console.warn(`Retrying channel initialization (attempt ${attempt + 1}/${retries})...`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
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
   * Check if running in Expo Go (where Android push notifications don't work)
   */
  isRunningInExpoGo() {
    try {
      // Expo Go has a different execution environment
      return Constants.executionEnvironment === 'storeClient';
    } catch (error) {
      // If Constants is not available, try checking the app ownership
      try {
        return Constants.appOwnership === 'expo';
      } catch {
        return false;
      }
    }
  }

  /**
   * Register device for push notifications and save token to Firebase
   * Returns { success: boolean, token: string | null, error: string | null }
   */
  async registerForPushNotifications() {
    // Push notifications are not supported on web
    if (Platform.OS === 'web') {
      if (__DEV__) {
        console.log('Push notifications are not supported on web platform');
      }
      return { success: false, token: null, error: 'Web platform not supported' };
    }

    // Check if running in Expo Go on Android (SDK 53+ limitation)
    if (Platform.OS === 'android' && this.isRunningInExpoGo()) {
      const errorMsg = 'Android push notifications do not work in Expo Go (SDK 53+). You must use a development build or production build. See ANDROID_SDK_SETUP.md for instructions.';
      if (__DEV__) {
        console.error('Push notification registration failed:', errorMsg);
      }
      return { success: false, token: null, error: errorMsg };
    }

    try {
      // CRITICAL: Initialize Android channels FIRST, before getting token
      // This ensures channels exist before any notifications are sent
      if (Platform.OS === 'android') {
        await this.initializeAndroidChannels();
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        const errorMsg = 'Notification permission not granted. Please enable notifications in your device settings.';
        if (__DEV__) {
          console.warn('Push notification registration failed:', errorMsg);
        }
        return { success: false, token: null, error: errorMsg };
      }

      // Get the Expo push token
      let token;
      try {
        token = await Notifications.getExpoPushTokenAsync({
          projectId: '518717a0-b81e-4a06-a54e-b599f4155c88', // From app.json
        });
      } catch (tokenError) {
        // Check if this is the FCM credentials error
        const errorMessage = tokenError.message || tokenError.toString();
        const isFCMError = errorMessage.includes('FirebaseApp is not initialized') || 
                          errorMessage.includes('FCM') ||
                          errorMessage.includes('fcm-credentials') ||
                          errorMessage.includes('Default FirebaseApp is not initialized');
        
        let errorMsg;
        if (isFCMError && Platform.OS === 'android') {
          errorMsg = `FCM credentials not configured. To fix this:\n\n1. Go to: https://expo.dev/accounts/elishak/projects/greater-works-city-church/credentials\n2. Upload FCM Service Account JSON (see FCM_CREDENTIALS_SETUP.md)\n3. Rebuild app: eas build --platform android --profile preview\n\nSee FCM_CREDENTIALS_SETUP.md for detailed instructions.`;
        } else {
          errorMsg = `Failed to get Expo push token: ${errorMessage}. Make sure you're using a development build or production build (not Expo Go on Android).`;
        }
        
        if (__DEV__) {
          console.error('Expo push token error:', tokenError);
          console.error('Full error details:', JSON.stringify(tokenError, null, 2));
          if (isFCMError) {
            console.error('💡 FCM Setup Required:');
            console.error('   1. Upload FCM Service Account JSON to Expo dashboard');
            console.error('   2. Rebuild app: eas build --platform android --profile preview');
            console.error('   See FCM_CREDENTIALS_SETUP.md for detailed instructions');
            console.error('   Dashboard: https://expo.dev/accounts/elishak/projects/greater-works-city-church/credentials');
          }
        }
        return { success: false, token: null, error: errorMsg };
      }

      if (!token || !token.data) {
        const errorMsg = 'Expo push token is null or invalid. Please ensure you have a valid Expo project configuration.';
        if (__DEV__) {
          console.error('Push notification registration failed: Invalid token response', token);
        }
        return { success: false, token: null, error: errorMsg };
      }

      const newToken = token.data;
      
      // Only log and update if token has changed
      if (this.expoPushToken !== newToken) {
        this.expoPushToken = newToken;
        if (__DEV__) {
          console.log('Expo Push Token:', this.expoPushToken);
        }

        // Save token to Firebase
        const user = auth.currentUser;
        if (user) {
          try {
            await this.saveTokenToFirebase(this.expoPushToken);
          } catch (firebaseError) {
            if (__DEV__) {
              console.warn('Failed to save token to Firebase, but token registration succeeded:', firebaseError);
            }
            // Don't fail registration if Firebase save fails - token is still valid
          }
        }
      } else if (__DEV__) {
        // Token already registered, skip duplicate registration
        console.log('Push token already registered, skipping duplicate registration');
      }

      return { success: true, token: this.expoPushToken, error: null };
    } catch (error) {
      const errorMsg = `Unexpected error registering for push notifications: ${error.message || error.toString()}`;
      if (__DEV__) {
        console.error('Error registering for push notifications:', error);
        console.error('Error stack:', error.stack);
      }
      return { success: false, token: null, error: errorMsg };
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
   * Also validates and cleans up invalid tokens
   */
  async removeTokenFromFirebase(token) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const tokens = (userData.pushTokens || [])
          .filter(t => {
            // Remove the specific token and any invalid tokens
            if (t === token) return false;
            // Remove invalid tokens (null, empty, or not starting with ExponentPushToken/Expo)
            if (!t || typeof t !== 'string') return false;
            if (!t.startsWith('ExponentPushToken') && !t.startsWith('Expo')) return false;
            return true;
          });
        
        await updateDoc(userRef, {
          pushTokens: tokens,
          lastTokenUpdate: new Date().toISOString(),
        });

        if (__DEV__) {
          console.log(`Removed token and cleaned up invalid tokens. Remaining: ${tokens.length}`);
        }
      }
    } catch (error) {
      console.error('Error removing token from Firebase:', error);
    }
  }

  /**
   * Clean up invalid tokens from Firebase for all users
   * This should be called periodically or during maintenance
   */
  async cleanupInvalidTokens() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const tokens = (userData.pushTokens || []).filter(token => {
          // Keep only valid tokens
          return token && 
                 typeof token === 'string' && 
                 (token.startsWith('ExponentPushToken') || token.startsWith('Expo'));
        });
        
        if (tokens.length !== (userData.pushTokens || []).length) {
          await updateDoc(userRef, {
            pushTokens: tokens,
            lastTokenUpdate: new Date().toISOString(),
          });
          
          if (__DEV__) {
            console.log(`Cleaned up invalid tokens. Removed ${(userData.pushTokens || []).length - tokens.length} invalid tokens`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up invalid tokens:', error);
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

      // Ensure Android channels are initialized before sending notification
      if (Platform.OS === 'android' && !this.channelsInitialized) {
        await this.initializeAndroidChannels();
      }

      // Determine the appropriate channel ID based on notification type
      let channelId = 'default';
      if (Platform.OS === 'android') {
        if (data.type === 'event') {
          channelId = 'events';
        } else if (data.type === 'announcement') {
          channelId = 'announcements';
        } else if (data.type === 'prayerJournal') {
          channelId = 'default'; // Use default channel for prayer journal reminders
        } else {
          channelId = 'default';
        }
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          ...(Platform.OS === 'android' && { channelId }), // Only set channelId on Android
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
   * Schedule prayer journal reminder notification
   * @param {Object} prayer - Prayer entry object with id, title, and reminderDate
   * @returns {Promise<string|null>} - Notification ID or null if not scheduled
   */
  async schedulePrayerJournalReminder(prayer) {
    try {
      if (!prayer || !prayer.reminderDate || !prayer.id || !prayer.title) {
        return null;
      }

      // Cancel any existing notification for this prayer first
      await this.cancelPrayerJournalReminder(prayer.id);

      const reminderDate = new Date(prayer.reminderDate);
      const now = new Date();

      // Don't schedule if reminder is in the past
      if (reminderDate <= now) {
        if (__DEV__) {
          console.log('Prayer reminder date is in the past, not scheduling');
        }
        return null;
      }

      // Calculate seconds from now until reminder time
      const secondsUntilReminder = Math.floor((reminderDate.getTime() - now.getTime()) / 1000);

      const notificationId = await this.scheduleLocalNotification(
        `🙏 Prayer Reminder: ${prayer.title}`,
        `Time to pray for: ${prayer.title}`,
        {
          type: 'prayerJournal',
          prayerId: prayer.id,
          screen: 'PrayerEntryDetails',
        },
        { seconds: secondsUntilReminder }
      );

      if (__DEV__ && notificationId) {
        console.log(`Prayer journal reminder scheduled for ${reminderDate.toLocaleString()}`);
      }

      return notificationId;
    } catch (error) {
      console.error('Error scheduling prayer journal reminder:', error);
      return null;
    }
  }

  /**
   * Cancel prayer journal reminder notification
   * @param {string} prayerId - Prayer entry ID
   */
  async cancelPrayerJournalReminder(prayerId) {
    try {
      // Get all scheduled notifications
      const scheduled = await this.getScheduledNotifications();
      
      // Find and cancel notifications for this prayer
      for (const notification of scheduled) {
        if (
          notification.content?.data?.type === 'prayerJournal' &&
          notification.content?.data?.prayerId === prayerId
        ) {
          await this.cancelNotification(notification.identifier);
          if (__DEV__) {
            console.log(`Cancelled prayer journal reminder for prayer ${prayerId}`);
          }
        }
      }
    } catch (error) {
      console.error('Error canceling prayer journal reminder:', error);
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
   * Setup notification listeners with improved error handling and navigation
   */
  setupNotificationListeners(navigation) {
    // Notification listeners are not supported on web
    if (Platform.OS === 'web') {
      return;
    }

    // Clean up existing listeners before setting up new ones
    this.removeNotificationListeners();

    try {
      // Listener for notifications received while app is foregrounded
      this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
        if (__DEV__) {
          console.log('Notification received (foreground):', notification);
        }
        // You can handle foreground notifications here (e.g., show in-app banner)
        // The notification is already shown by the handler, but you can add custom logic
      });

      // Listener for when user taps on notification
      this.responseListener = Notifications.addNotificationResponseReceivedListener(async response => {
        try {
          const data = response.notification.request.content.data;
          if (__DEV__) {
            console.log('Notification tapped:', data);
          }

          // Wait a bit for navigation to be ready
          await new Promise(resolve => setTimeout(resolve, 100));

          // Navigate based on notification data
          if (!navigation || !navigation.navigate) {
            if (__DEV__) {
              console.warn('Navigation not available when notification was tapped');
            }
            return;
          }

          // Navigate based on notification type and data
          if (data.screen) {
            try {
              // Handle different notification types with specific navigation logic
              if (data.eventId) {
                navigation.navigate('EventDetails', { eventId: data.eventId });
              } else if (data.type === 'liveStream' && data.streamId) {
                navigation.navigate('LiveStreaming', { streamId: data.streamId });
              } else if (data.type === 'announcement' && data.announcementId) {
                // Navigate to messages/announcements tab
                if (navigation.navigate) {
                  navigation.navigate('Messages', { 
                    initialRouteName: 'Announcements',
                    announcementId: data.announcementId 
                  });
                }
              } else if (data.screen && data.tab) {
                // Navigate to specific screen with tab
                navigation.navigate(data.screen, { initialRouteName: data.tab });
              } else if (data.screen) {
                // Navigate to screen with any additional params
                const params = { ...data };
                delete params.screen;
                delete params.type;
                navigation.navigate(data.screen, Object.keys(params).length > 0 ? params : undefined);
              }
            } catch (navError) {
              console.error('Error navigating from notification:', navError);
              // Fallback: try to navigate to the main screen
              try {
                if (data.screen) {
                  navigation.navigate('MainTabs');
                  // Then try to navigate to the target screen
                  setTimeout(() => {
                    try {
                      navigation.navigate(data.screen);
                    } catch (e) {
                      console.warn('Could not navigate to target screen:', e);
                    }
                  }, 500);
                }
              } catch (fallbackError) {
                console.error('Error in fallback navigation:', fallbackError);
              }
            }
          }
        } catch (error) {
          console.error('Error handling notification tap:', error);
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

