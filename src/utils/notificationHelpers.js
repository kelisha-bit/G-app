/**
 * Helper functions for sending notifications from admin screens
 * These functions integrate with Firebase Cloud Messaging via Expo Push Notification Service
 * 
 * IMPORTANT: All notification functions check user preferences before sending
 * Users must have both pushNotifications enabled AND the specific notification type enabled
 */

import { db } from '../../firebase.config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import notificationService from './notificationService';

// Backend API URL - can be configured via environment variable
// For development: http://localhost:3001
// For production: Set EXPO_PUBLIC_NOTIFICATION_BACKEND_URL in .env
const BACKEND_URL = process.env.EXPO_PUBLIC_NOTIFICATION_BACKEND_URL || 'http://localhost:3001';

/**
 * Check if user has notifications enabled for a specific type
 * @param {Object} userData - User document data from Firestore
 * @param {string} notificationType - Type of notification (e.g., 'announcement', 'event', 'sermon')
 * @returns {boolean} - True if user should receive this notification
 */
function shouldSendNotification(userData, notificationType) {
  // Default settings if not specified
  const defaultSettings = {
    pushNotifications: true,
    announcementNotifications: true,
    sermonNotifications: true,
    eventNotifications: true,
    messageNotifications: true,
    prayerRequestUpdates: true,
  };

  const settings = userData.notificationSettings || defaultSettings;

  // Master switch - if push notifications are disabled, don't send anything
  if (!settings.pushNotifications) {
    return false;
  }

  // Check specific notification type
  switch (notificationType) {
    case 'announcement':
      return settings.announcementNotifications !== false; // Default to true
    case 'sermon':
      return settings.sermonNotifications !== false;
    case 'event':
      return settings.eventNotifications !== false;
    case 'message':
      return settings.messageNotifications !== false;
    case 'prayer':
      return settings.prayerRequestUpdates !== false;
    case 'liveStream':
      return settings.pushNotifications !== false; // Live streams use master switch
    default:
      return settings.pushNotifications !== false; // Default to master switch
  }
}

/**
 * Send push notification via backend API with retry logic and error handling
 * @private
 * @param {Array<string>} tokens - Array of Expo push tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Notification data payload
 * @param {Object} options - Additional options (channelId, priority, etc.)
 * @param {number} retries - Number of retry attempts (default: 2)
 * @returns {Promise<Object>} - Result object with success status and details
 */
async function sendPushNotificationToBackend(tokens, title, body, data = {}, options = {}, retries = 2) {
  try {
    // If no tokens, return early
    if (!tokens || tokens.length === 0) {
      return {
        success: false,
        error: 'No push tokens provided',
        tokenCount: 0,
        sent: 0,
        errors: 0,
      };
    }

    // Validate tokens - filter out invalid ones
    const validTokens = tokens.filter(token => {
      return token && 
             typeof token === 'string' && 
             (token.startsWith('ExponentPushToken') || token.startsWith('Expo'));
    });

    if (validTokens.length === 0) {
      return {
        success: false,
        error: 'No valid push tokens provided',
        tokenCount: tokens.length,
        validTokenCount: 0,
        sent: 0,
        errors: 0,
      };
    }

    // Try to send via backend API with retry logic
    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(`${BACKEND_URL}/api/notifications/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokens: validTokens,
            title,
            body,
            data,
            options: {
              ...options,
              // Set Android channel ID based on notification type
              channelId: options.channelId || (data.type === 'announcement' ? 'announcements' : 
                                               data.type === 'event' ? 'events' : 'default'),
            },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle network errors
        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || `HTTP ${response.status}` };
          }
          
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        return {
          success: result.success !== false,
          tokenCount: validTokens.length,
          sent: result.sent || validTokens.length,
          errors: result.errors || 0,
          invalidTokens: result.invalidTokens || [],
          ...result,
        };
      } catch (backendError) {
        lastError = backendError;
        
        // Detect network errors and provide helpful messages
        const errorMessage = backendError.message || backendError.toString();
        const isNetworkError = errorMessage.includes('Network request failed') || 
                              errorMessage.includes('Failed to fetch') ||
                              errorMessage.includes('NetworkError') ||
                              errorMessage.includes('aborted');
        
        if (isNetworkError && __DEV__) {
          const isLocalhost = BACKEND_URL.includes('localhost') || BACKEND_URL.includes('127.0.0.1');
          console.warn(`⚠️ Network error connecting to backend (${BACKEND_URL}):`, errorMessage);
          if (isLocalhost) {
            console.warn('💡 TIP: If testing on a physical device, replace "localhost" with your computer\'s IP address (e.g., http://192.168.1.XXX:3001)');
            console.warn('💡 Or make sure your backend server is running: cd backend && npm start');
          }
        }
        
        // Don't retry on certain errors (400, 401, 403, 404)
        if (backendError.message.includes('400') || 
            backendError.message.includes('401') || 
            backendError.message.includes('403') ||
            backendError.message.includes('404')) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
          if (__DEV__) {
            console.log(`Retrying notification send (attempt ${attempt + 1}/${retries})...`);
          }
        }
      }
    }

    // If all retries failed and we're in dev mode, fall back to local notification
    if (__DEV__ && lastError) {
      console.warn('Backend unavailable after retries, falling back to local notification:', lastError.message);
      
      // In development, send a local notification as fallback
      await notificationService.sendImmediateNotification(title, body, data);
      return {
        success: true,
        tokenCount: validTokens.length,
        sent: 1, // Local notification sent
        fallback: true,
        warning: `Backend unavailable: ${lastError.message}. Sent local notification only.`,
      };
    }

    throw lastError || new Error('Failed to send notification after retries');
  } catch (error) {
    if (__DEV__) console.error('Error sending push notification:', error);
    
    // Provide more helpful error messages
    const errorMessage = error.message || 'Unknown error';
    let userFriendlyError = errorMessage;
    
    if (errorMessage.includes('Network request failed') || errorMessage.includes('Failed to fetch')) {
      const isLocalhost = BACKEND_URL.includes('localhost') || BACKEND_URL.includes('127.0.0.1');
      if (isLocalhost) {
        userFriendlyError = `Cannot connect to backend server at ${BACKEND_URL}. Make sure:\n1. Backend server is running (cd backend && npm start)\n2. If testing on a physical device, use your computer's IP address instead of localhost`;
      } else {
        userFriendlyError = `Cannot connect to backend server at ${BACKEND_URL}. Please check your network connection and ensure the server is running.`;
      }
    }
    
    return {
      success: false,
      error: userFriendlyError,
      tokenCount: tokens ? tokens.length : 0,
      sent: 0,
      errors: tokens ? tokens.length : 0,
    };
  }
}

/**
 * Send notification to all users (for announcements, etc.)
 * Gets all user push tokens from Firebase and sends via backend API
 * RESPECTS USER PREFERENCES - only sends to users who have the specific notification type enabled
 * 
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Notification data payload
 * @param {string} notificationType - Type of notification ('announcement', 'sermon', 'event', etc.)
 * @returns {Promise<Object>} - Result object with success status and details
 */
export async function sendNotificationToAllUsers(title, body, data = {}, notificationType = 'default') {
  try {
    // Get all users with push tokens
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const tokens = [];
    let totalUsers = 0;
    let skippedUsers = 0;

    usersSnapshot.forEach((doc) => {
      totalUsers++;
      const userData = doc.data();
      
      // Check if user should receive this notification type
      if (!shouldSendNotification(userData, notificationType)) {
        skippedUsers++;
        return;
      }

      // Get valid push tokens for this user
      if (userData.pushTokens && Array.isArray(userData.pushTokens)) {
        const userTokens = userData.pushTokens.filter(token => 
          token && typeof token === 'string' && 
          (token.startsWith('ExponentPushToken') || token.startsWith('Expo'))
        );
        tokens.push(...userTokens);
      }
    });

    // Remove duplicates
    const uniqueTokens = [...new Set(tokens)];

    if (uniqueTokens.length === 0) {
      if (__DEV__) {
        console.log(`No valid push tokens found. Total users: ${totalUsers}, Skipped: ${skippedUsers}, Tokens: ${tokens.length}`);
      }
      return {
        success: false,
        error: skippedUsers > 0 
          ? `No users have this notification type enabled (${skippedUsers} users skipped)`
          : 'No push tokens found',
        tokenCount: 0,
        totalUsers,
        skippedUsers,
      };
    }

    if (__DEV__) {
      console.log(`Sending notification to ${uniqueTokens.length} devices (${skippedUsers} users skipped due to preferences)`);
      console.log('Title:', title);
      console.log('Body:', body);
      console.log('Type:', notificationType);
    }

    // Send via backend API
    const result = await sendPushNotificationToBackend(uniqueTokens, title, body, data, {
      channelId: notificationType === 'announcement' ? 'announcements' : 
                 notificationType === 'event' ? 'events' : 'default',
    });

    return {
      ...result,
      totalUsers,
      skippedUsers,
    };
  } catch (error) {
    console.error('Error sending notification to all users:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      tokenCount: 0,
      sent: 0,
      errors: 0,
    };
  }
}

/**
 * Send notification to specific users by their user IDs
 * RESPECTS USER PREFERENCES - only sends to users who have the specific notification type enabled
 * 
 * @param {Array<string>} userIds - Array of user IDs to send to
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Notification data payload
 * @param {string} notificationType - Type of notification ('message', 'prayer', etc.)
 * @returns {Promise<Object>} - Result object with success status and details
 */
export async function sendNotificationToUsers(userIds, title, body, data = {}, notificationType = 'default') {
  try {
    if (!userIds || userIds.length === 0) {
      return {
        success: false,
        error: 'No user IDs provided',
        tokenCount: 0,
        sent: 0,
      };
    }

    const tokens = [];
    let skippedUsers = 0;
    
    for (const userId of userIds) {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Check if user should receive this notification type
          if (!shouldSendNotification(userData, notificationType)) {
            skippedUsers++;
            if (__DEV__) {
              console.log(`Skipping notification to user ${userId} - preference disabled`);
            }
            continue;
          }

          // Get valid push tokens for this user
          if (userData.pushTokens && Array.isArray(userData.pushTokens)) {
            const userTokens = userData.pushTokens.filter(token => 
              token && typeof token === 'string' && 
              (token.startsWith('ExponentPushToken') || token.startsWith('Expo'))
            );
            tokens.push(...userTokens);
          }
        }
      } catch (userError) {
        console.warn(`Error fetching user ${userId}:`, userError);
        // Continue with other users
      }
    }

    const uniqueTokens = [...new Set(tokens)];

    if (uniqueTokens.length === 0) {
      if (__DEV__) {
        console.log(`No valid push tokens found for specified users. Requested: ${userIds.length}, Skipped: ${skippedUsers}`);
      }
      return {
        success: false,
        error: skippedUsers > 0
          ? `No users have this notification type enabled (${skippedUsers} users skipped)`
          : 'No push tokens found for specified users',
        tokenCount: 0,
        requestedUsers: userIds.length,
        skippedUsers,
      };
    }

    if (__DEV__) {
      console.log(`Sending notification to ${uniqueTokens.length} devices (${skippedUsers} users skipped due to preferences)`);
      console.log('Title:', title);
      console.log('Body:', body);
    }

    // Send via backend API
    const result = await sendPushNotificationToBackend(uniqueTokens, title, body, data, {
      channelId: notificationType === 'announcement' ? 'announcements' : 
                 notificationType === 'event' ? 'events' : 'default',
    });

    return {
      ...result,
      requestedUsers: userIds.length,
      skippedUsers,
    };
  } catch (error) {
    console.error('Error sending notification to users:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      tokenCount: 0,
      sent: 0,
      errors: 0,
    };
  }
}

/**
 * Send announcement notification
 * Only sends to users who have announcementNotifications enabled
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
    announcement.title || announcement.message || 'New church announcement',
    data,
    'announcement'
  );
}

/**
 * Send sermon notification
 * Only sends to users who have sermonNotifications enabled
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
    data,
    'sermon'
  );
}

/**
 * Send event notification
 * Only sends to users who have eventNotifications enabled
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
    data,
    'event'
  );
}

/**
 * Send prayer request update notification
 * Only sends to users who have prayerRequestUpdates enabled
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
    data,
    'prayer'
  );
}

/**
 * Send message notification
 * Only sends to users who have messageNotifications enabled
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
    data,
    'message'
  );
}

/**
 * Send notification when someone comments on a community feed post
 * Only sends to users who have messageNotifications or pushNotifications enabled
 * @param {Object} post - The post object with id, userId, userName
 * @param {string} commenterName - Name of the user who commented
 * @param {string} commenterId - ID of the user who commented
 */
export async function sendCommunityFeedCommentNotification(post, commenterName, commenterId) {
  // Don't notify if commenter is the post author
  if (post.userId === commenterId) {
    return { 
      success: false, 
      error: 'User commented on their own post',
      tokenCount: 0,
    };
  }

  const data = {
    type: 'communityFeed',
    postId: post.id,
    screen: 'CommunityFeed',
    action: 'viewComments',
  };

  // Get post author's name for notification
  const notificationBody = commenterName 
    ? `${commenterName} commented on your post`
    : 'Someone commented on your post';

  // Community feed uses message notifications preference (or master switch)
  return await sendNotificationToUsers(
    [post.userId],
    'New Comment',
    notificationBody,
    data,
    'message' // Use message notification preference
  );
}

/**
 * Send notification when someone likes a community feed post
 * Only sends notification for the first like to avoid spam
 * Only sends to users who have messageNotifications enabled
 * @param {Object} post - The post object with id, userId, userName, likesCount
 * @param {string} likerName - Name of the user who liked
 * @param {string} likerId - ID of the user who liked
 */
export async function sendCommunityFeedLikeNotification(post, likerName, likerId) {
  // Don't notify if liker is the post author
  if (post.userId === likerId) {
    return { 
      success: false, 
      error: 'User liked their own post',
      tokenCount: 0,
    };
  }

  // Only send notification for first like (when likesCount === 1)
  // This prevents notification spam when many people like a post
  if (post.likesCount !== 1) {
    return { 
      success: false, 
      error: 'Not the first like - notification skipped to avoid spam',
      tokenCount: 0,
    };
  }

  const data = {
    type: 'communityFeed',
    postId: post.id,
    screen: 'CommunityFeed',
  };

  const notificationBody = likerName 
    ? `${likerName} liked your post`
    : 'Someone liked your post';

  // Community feed uses message notifications preference (or master switch)
  return await sendNotificationToUsers(
    [post.userId],
    'New Like',
    notificationBody,
    data,
    'message' // Use message notification preference
  );
}

/**
 * Send notification when a live stream goes live
 * Only sends to users who have pushNotifications enabled (uses master switch)
 * @param {Object} stream - The stream object with id, title, description
 */
export async function sendLiveStreamNotification(stream) {
  const data = {
    type: 'liveStream',
    streamId: stream.id,
    screen: 'LiveStreaming',
  };

  const notificationBody = stream.description 
    ? stream.description.substring(0, 100) + (stream.description.length > 100 ? '...' : '')
    : 'Join us for live service';

  return await sendNotificationToAllUsers(
    stream.title || 'Live Service Starting',
    notificationBody,
    data,
    'liveStream' // Uses master push notification switch
  );
}
