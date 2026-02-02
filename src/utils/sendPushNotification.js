import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase.config';

/**
 * Send push notification to multiple Expo push tokens
 * Uses Expo's push notification service
 */
async function sendToExpoPushService(messages) {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    
    if (__DEV__) {
      console.log('Push notification response:', result);
    }
    
    return result;
  } catch (error) {
    if (__DEV__) console.error('Error sending to Expo push service:', error);
    throw error;
  }
}

/**
 * Get all push tokens from all users
 */
async function getAllPushTokens() {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    const tokens = [];
    
    snapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.pushTokens && Array.isArray(userData.pushTokens)) {
        userData.pushTokens.forEach((token) => {
          if (token && token.startsWith('ExponentPushToken')) {
            tokens.push({
              token: token,
              userId: doc.id,
            });
          }
        });
      }
    });

    return tokens;
  } catch (error) {
    if (__DEV__) console.error('Error getting push tokens:', error);
    return [];
  }
}

/**
 * Send notification to ALL users
 */
export async function sendNotificationToAll(title, body, data = {}) {
  try {
    const tokenData = await getAllPushTokens();
    
    if (tokenData.length === 0) {
      return { 
        success: false, 
        error: 'No push tokens found',
        sentCount: 0 
      };
    }

    // Create messages array
    const messages = tokenData.map(({ token }) => ({
      to: token,
      sound: 'default',
      title: title,
      body: body,
      data: data,
      priority: 'high',
      channelId: data.channelId || 'default',
    }));

    // Expo allows max 100 notifications per request
    const chunks = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    let successCount = 0;
    let failCount = 0;

    for (const chunk of chunks) {
      const result = await sendToExpoPushService(chunk);
      
      if (result.data) {
        result.data.forEach((item) => {
          if (item.status === 'ok') {
            successCount++;
          } else {
            failCount++;
          }
        });
      }
    }

    return {
      success: true,
      sent: successCount,
      sentCount: successCount, // Keep for backwards compatibility
      errors: failCount,
      failedCount: failCount, // Keep for backwards compatibility
      tokenCount: tokenData.length,
      totalTokens: tokenData.length, // Keep for backwards compatibility
    };

  } catch (error) {
    if (__DEV__) console.error('Error sending notification to all:', error);
    return { 
      success: false, 
      error: error.message,
      sent: 0,
      sentCount: 0, // Keep for backwards compatibility
      tokenCount: 0,
      totalTokens: 0, // Keep for backwards compatibility
      errors: 0,
      failedCount: 0 // Keep for backwards compatibility
    };
  }
}

/**
 * Send notification to a specific user
 */
export async function sendNotificationToUser(userId, title, body, data = {}) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const tokens = userData.pushTokens || [];

    if (tokens.length === 0) {
      return { success: false, error: 'User has no push tokens' };
    }

    const messages = tokens.map((token) => ({
      to: token,
      sound: 'default',
      title: title,
      body: body,
      data: data,
      priority: 'high',
    }));

    await sendToExpoPushService(messages);

    return { success: true };

  } catch (error) {
    if (__DEV__) console.error('Error sending notification to user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification for new event
 */
export async function sendEventNotification(event) {
  return await sendNotificationToAll(
    `📅 New Event: ${event.title}`,
    event.description || 'Check out our new event!',
    {
      type: 'event',
      eventId: event.id,
      screen: 'EventDetails',
      channelId: 'events',
    }
  );
}

/**
 * Send notification for new sermon
 */
export async function sendSermonNotification(sermon) {
  return await sendNotificationToAll(
    `🎧 New Sermon: ${sermon.title}`,
    `By ${sermon.speaker || 'Pastor'}`,
    {
      type: 'sermon',
      sermonId: sermon.id,
      screen: 'Sermons',
      channelId: 'default',
    }
  );
}

/**
 * Send notification for announcement
 */
export async function sendAnnouncementNotification(announcement) {
  return await sendNotificationToAll(
    `📢 ${announcement.title}`,
    announcement.message || announcement.content,
    {
      type: 'announcement',
      announcementId: announcement.id,
      screen: 'Home',
      channelId: 'announcements',
    }
  );
}

/**
 * Send notification for live stream starting
 */
export async function sendLiveStreamNotification(streamTitle) {
  return await sendNotificationToAll(
    '🔴 We Are Live!',
    streamTitle || 'Join us for our live service now!',
    {
      type: 'liveStream',
      screen: 'LiveStreaming',
      channelId: 'default',
    }
  );
}

/**
 * Send notification for new devotional
 */
export async function sendDevotionalNotification(devotional) {
  return await sendNotificationToAll(
    `📖 Daily Devotional`,
    devotional.title || 'Your daily word of encouragement',
    {
      type: 'devotional',
      devotionalId: devotional.id,
      screen: 'Devotional',
      channelId: 'default',
    }
  );
}

/**
 * Send prayer request notification
 */
export async function sendPrayerNotification(prayerRequest) {
  return await sendNotificationToAll(
    '🙏 New Prayer Request',
    'A member needs your prayers',
    {
      type: 'prayer',
      prayerId: prayerRequest.id,
      screen: 'Prayer',
      channelId: 'default',
    }
  );
}