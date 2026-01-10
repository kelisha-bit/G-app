/**
 * Helper functions for sending notifications from admin screens
 * These functions integrate with Firebase Cloud Messaging via Expo Push Notification Service
 */

import { db } from '../../firebase.config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import notificationService from './notificationService';

/**
 * Send notification to all users (for announcements, etc.)
 * Note: This requires a backend service to send push notifications via Expo Push API
 * For now, this function prepares the notification data
 */
export async function sendNotificationToAllUsers(title, body, data = {}) {
  try {
    // Get all users with push tokens
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const tokens = [];
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.pushTokens && Array.isArray(userData.pushTokens)) {
        tokens.push(...userData.pushTokens);
      }
    });

    // Remove duplicates
    const uniqueTokens = [...new Set(tokens)];

    // In a production app, you would send these to your backend
    // which would then use Expo Push API to send notifications
    console.log(`Would send notification to ${uniqueTokens.length} devices`);
    console.log('Title:', title);
    console.log('Body:', body);
    console.log('Data:', data);

    // For local testing, you can send a test notification
    if (__DEV__) {
      await notificationService.sendImmediateNotification(title, body, data);
    }

    return {
      success: true,
      tokenCount: uniqueTokens.length,
      tokens: uniqueTokens,
    };
  } catch (error) {
    console.error('Error sending notification to all users:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send notification to specific users by their user IDs
 */
export async function sendNotificationToUsers(userIds, title, body, data = {}) {
  try {
    const tokens = [];
    
    for (const userId of userIds) {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.pushTokens && Array.isArray(userData.pushTokens)) {
          tokens.push(...userData.pushTokens);
        }
      }
    }

    const uniqueTokens = [...new Set(tokens)];

    console.log(`Would send notification to ${uniqueTokens.length} devices`);
    console.log('Title:', title);
    console.log('Body:', body);
    console.log('Data:', data);

    if (__DEV__) {
      await notificationService.sendImmediateNotification(title, body, data);
    }

    return {
      success: true,
      tokenCount: uniqueTokens.length,
      tokens: uniqueTokens,
    };
  } catch (error) {
    console.error('Error sending notification to users:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send announcement notification
 */
export async function sendAnnouncementNotification(announcement) {
  const data = {
    type: 'announcement',
    announcementId: announcement.id,
    screen: 'Messages',
    tab: 'Announcements',
  };

  return await sendNotificationToAllUsers(
    'New Announcement',
    announcement.title || 'New church announcement',
    data
  );
}

/**
 * Send sermon notification
 */
export async function sendSermonNotification(sermon) {
  const data = {
    type: 'sermon',
    sermonId: sermon.id,
    screen: 'Sermons',
  };

  return await sendNotificationToAllUsers(
    'New Sermon Available',
    sermon.title || 'A new sermon has been uploaded',
    data
  );
}

/**
 * Send event notification
 */
export async function sendEventNotification(event) {
  const data = {
    type: 'event',
    eventId: event.id,
    screen: 'EventDetails',
  };

  return await sendNotificationToAllUsers(
    'New Event',
    event.title || 'A new event has been added',
    data
  );
}

/**
 * Send prayer request update notification
 */
export async function sendPrayerUpdateNotification(prayerRequest, userId) {
  const data = {
    type: 'prayer',
    prayerRequestId: prayerRequest.id,
    screen: 'Prayer',
  };

  return await sendNotificationToUsers(
    [userId],
    'Prayer Request Update',
    'Someone has prayed for your request',
    data
  );
}

/**
 * Send message notification
 */
export async function sendMessageNotification(message, recipientId) {
  const data = {
    type: 'message',
    messageId: message.id,
    screen: 'Messages',
    tab: 'Inbox',
  };

  return await sendNotificationToUsers(
    [recipientId],
    'New Message',
    message.subject || 'You have a new message',
    data
  );
}

