// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const { Expo } = require('expo-server-sdk');
const expo = new Expo();

/**
 * Send daily devotional notification at 6 AM
 * 
 * Improvements:
 * - Respects user notification preferences
 * - Handles invalid tokens and cleans them up
 * - Better error handling and logging
 * - Pagination support for large user bases
 */
exports.sendDailyDevotional = functions.pubsub
  .schedule('0 6 * * *') // 6 AM every day
  .timeZone('Africa/Accra') // Adjust to your timezone
  .onRun(async (context) => {
    try {
      const db = admin.firestore();
      
      // Get today's date in the function's timezone
      const today = new Date();
      const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Get today's devotional from Firestore
      const devotionalQuery = await db.collection('devotionals')
        .where('date', '==', dateString)
        .limit(1)
        .get();
      
      if (devotionalQuery.empty) {
        console.log(`No devotional found for ${dateString}`);
        return null;
      }
      
      const devotional = devotionalQuery.docs[0].data();
      const devotionalId = devotionalQuery.docs[0].id;
      console.log(`Found devotional: ${devotional.title || devotionalId}`);
      
      // Get all user push tokens with pagination support
      const tokens = [];
      const userTokenMap = new Map(); // Map token to userId for cleanup
      let lastDoc = null;
      let hasMore = true;
      
      while (hasMore) {
        let usersQuery = db.collection('users').limit(500);
        if (lastDoc) {
          usersQuery = usersQuery.startAfter(lastDoc);
        }
        
        const usersSnapshot = await usersQuery.get();
        
        if (usersSnapshot.empty) {
          hasMore = false;
          break;
        }
        
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          const userId = doc.id;
          
          // Check if user has devotional notifications enabled
          const notificationsEnabled = shouldSendNotification(userData, 'devotionals'); // Default to true
          
          if (notificationsEnabled && userData.pushTokens && Array.isArray(userData.pushTokens)) {
            userData.pushTokens.forEach(token => {
              if (Expo.isExpoPushToken(token)) {
                tokens.push(token);
                userTokenMap.set(token, userId);
              }
            });
          }
        });
        
        // Check if we have more users to process
        if (usersSnapshot.size < 500) {
          hasMore = false;
        } else {
          lastDoc = usersSnapshot.docs[usersSnapshot.docs.length - 1];
        }
      }
      
      if (tokens.length === 0) {
        console.log('No push tokens found or all users have notifications disabled');
        return null;
      }
      
      console.log(`Preparing to send notifications to ${tokens.length} tokens`);
      
      // Create notification messages
      const messages = tokens.map(token => ({
        to: token,
        sound: 'default',
        title: '📖 Daily Devotional',
        body: devotional.title || 'Your daily word of encouragement',
        data: {
          type: 'devotional',
          devotionalId: devotionalId,
          screen: 'Devotional',
        },
        priority: 'high',
      }));
      
      // Send notifications in chunks (Expo allows 100 per request)
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];
      const invalidTokens = [];
      
      for (let i = 0; i < chunks.length; i++) {
        try {
          const chunk = chunks[i];
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
          
          // Check for invalid tokens in this chunk
          ticketChunk.forEach((ticket, index) => {
            if (ticket.status === 'error') {
              const error = ticket.details?.error;
              if (error === 'DeviceNotRegistered' || error === 'InvalidCredentials') {
                const token = chunk[index].to;
                invalidTokens.push({ token, userId: userTokenMap.get(token) });
              }
            }
          });
          
          console.log(`Sent chunk ${i + 1}/${chunks.length}`);
        } catch (error) {
          console.error(`Error sending notification chunk ${i + 1}:`, error);
        }
      }
      
      // Clean up invalid tokens
      if (invalidTokens.length > 0) {
        console.log(`Found ${invalidTokens.length} invalid tokens, cleaning up...`);
        const cleanupPromises = [];
        const tokensByUser = new Map();
        
        // Group tokens by user
        invalidTokens.forEach(({ token, userId }) => {
          if (userId) {
            if (!tokensByUser.has(userId)) {
              tokensByUser.set(userId, []);
            }
            tokensByUser.get(userId).push(token);
          }
        });
        
        // Remove invalid tokens from each user's document
        tokensByUser.forEach((tokensToRemove, userId) => {
          const userRef = db.collection('users').doc(userId);
          cleanupPromises.push(
            userRef.get().then(userDoc => {
              if (userDoc.exists()) {
                const userData = userDoc.data();
                const currentTokens = userData.pushTokens || [];
                const updatedTokens = currentTokens.filter(t => !tokensToRemove.includes(t));
                return userRef.update({ pushTokens: updatedTokens });
              }
            }).catch(err => {
              console.error(`Error cleaning up tokens for user ${userId}:`, err);
            })
          );
        });
        
        await Promise.all(cleanupPromises);
        console.log(`Cleaned up invalid tokens for ${tokensByUser.size} users`);
      }
      
      const successCount = tickets.filter(t => t.status === 'ok').length;
      const errorCount = tickets.filter(t => t.status === 'error').length;
      
      console.log(`Devotional notification complete: ${successCount} sent, ${errorCount} errors, ${invalidTokens.length} invalid tokens removed`);
      return null;
    } catch (error) {
      console.error('Error in sendDailyDevotional:', error);
      // Re-throw to mark function as failed in Firebase
      throw error;
    }
  });

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if user should receive a notification based on their preferences
 * Supports both notificationSettings (app) and notificationPreferences (functions) for compatibility
 * @param {Object} userData - User document data
 * @param {string} notificationType - Type of notification (devotionals, events, announcements, sermons)
 * @returns {boolean} - True if user should receive notification
 */
function shouldSendNotification(userData, notificationType = null) {
  // Get settings from either field name (app uses notificationSettings, functions use notificationPreferences)
  const settings = userData.notificationSettings || userData.notificationPreferences || {};
  
  // Master switch - if push notifications are disabled, don't send anything
  if (settings.pushNotifications === false) {
    return false;
  }
  
  // If no specific type, check master switch only
  if (!notificationType) {
    return settings.pushNotifications !== false;
  }
  
  // Map notification types to app field names
  const fieldMap = {
    'devotionals': 'devotionals', // May not exist in app, defaults to true
    'events': 'eventReminders',
    'announcements': 'announcementNotifications',
    'sermons': 'sermonNotifications',
    'message': 'messageNotifications', // For direct messages
    'messages': 'messageNotifications', // Alias for message
  };
  
  const appFieldName = fieldMap[notificationType] || notificationType;
  const funcFieldName = notificationType;
  
  // Check app field name first, then function field name, default to true
  const appValue = settings[appFieldName];
  const funcValue = userData.notificationPreferences?.[funcFieldName];
  
  // If explicitly false in either, disable. Otherwise default to true
  if (appValue === false || funcValue === false) {
    return false;
  }
  
  // Default to enabled if not explicitly disabled
  return true;
}

/**
 * Get all user push tokens with pagination and preference checking
 * @param {Firestore} db - Firestore database instance
 * @param {string} notificationType - Type of notification (devotionals, events, announcements, sermons)
 * @returns {Promise<{tokens: Array, userTokenMap: Map}>}
 */
async function getAllUserTokens(db, notificationType = null) {
  const tokens = [];
  const userTokenMap = new Map();
  let lastDoc = null;
  let hasMore = true;

  while (hasMore) {
    let usersQuery = db.collection('users').limit(500);
    if (lastDoc) {
      usersQuery = usersQuery.startAfter(lastDoc);
    }

    const usersSnapshot = await usersQuery.get();

    if (usersSnapshot.empty) {
      hasMore = false;
      break;
    }

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      const userId = doc.id;

      // Check notification preferences if type is specified
      const notificationsEnabled = shouldSendNotification(userData, notificationType);

      if (notificationsEnabled && userData.pushTokens && Array.isArray(userData.pushTokens)) {
        userData.pushTokens.forEach(token => {
          if (Expo.isExpoPushToken(token)) {
            tokens.push(token);
            userTokenMap.set(token, userId);
          }
        });
      }
    });

    if (usersSnapshot.size < 500) {
      hasMore = false;
    } else {
      lastDoc = usersSnapshot.docs[usersSnapshot.docs.length - 1];
    }
  }

  return { tokens, userTokenMap };
}

/**
 * Clean up invalid tokens from user documents
 * @param {Firestore} db - Firestore database instance
 * @param {Array} invalidTokens - Array of {token, userId} objects
 */
async function cleanupInvalidTokens(db, invalidTokens) {
  if (invalidTokens.length === 0) return;

  console.log(`Cleaning up ${invalidTokens.length} invalid tokens...`);
  const cleanupPromises = [];
  const tokensByUser = new Map();

  // Group tokens by user
  invalidTokens.forEach(({ token, userId }) => {
    if (userId) {
      if (!tokensByUser.has(userId)) {
        tokensByUser.set(userId, []);
      }
      tokensByUser.get(userId).push(token);
    }
  });

  // Remove invalid tokens from each user's document
  tokensByUser.forEach((tokensToRemove, userId) => {
    const userRef = db.collection('users').doc(userId);
    cleanupPromises.push(
      userRef.get().then(userDoc => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentTokens = userData.pushTokens || [];
          const updatedTokens = currentTokens.filter(t => !tokensToRemove.includes(t));
          return userRef.update({ pushTokens: updatedTokens });
        }
      }).catch(err => {
        console.error(`Error cleaning up tokens for user ${userId}:`, err);
      })
    );
  });

  await Promise.all(cleanupPromises);
  console.log(`Cleaned up invalid tokens for ${tokensByUser.size} users`);
}

/**
 * Send notifications and handle invalid tokens
 * @param {Array} messages - Array of notification messages
 * @param {Map} userTokenMap - Map of token to userId
 * @returns {Promise<{successCount: number, errorCount: number, invalidTokens: Array}>}
 */
async function sendNotificationsWithCleanup(messages, userTokenMap) {
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];
  const invalidTokens = [];

  for (let i = 0; i < chunks.length; i++) {
    try {
      const chunk = chunks[i];
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);

      // Check for invalid tokens
      ticketChunk.forEach((ticket, index) => {
        if (ticket.status === 'error') {
          const error = ticket.details?.error;
          if (error === 'DeviceNotRegistered' || error === 'InvalidCredentials') {
            const token = chunk[index].to;
            invalidTokens.push({ token, userId: userTokenMap.get(token) });
          }
        }
      });

      console.log(`Sent chunk ${i + 1}/${chunks.length}`);
    } catch (error) {
      console.error(`Error sending notification chunk ${i + 1}:`, error);
    }
  }

  const successCount = tickets.filter(t => t.status === 'ok').length;
  const errorCount = tickets.filter(t => t.status === 'error').length;

  return { successCount, errorCount, invalidTokens };
}

// ============================================
// SCHEDULED NOTIFICATIONS
// ============================================

/**
 * Send event reminder notifications 24 hours before events
 */
exports.sendEventReminders = functions.pubsub
  .schedule('0 8 * * *') // Run daily at 8 AM
  .timeZone('Africa/Accra')
  .onRun(async (context) => {
    try {
      const db = admin.firestore();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split('T')[0];

      // Find events happening tomorrow
      const eventsQuery = await db.collection('events')
        .where('date', '==', tomorrowDate)
        .get();

      if (eventsQuery.empty) {
        console.log(`No events found for ${tomorrowDate}`);
        return null;
      }

      console.log(`Found ${eventsQuery.size} event(s) for tomorrow`);

      // Get all user tokens with event reminder preferences
      const { tokens, userTokenMap } = await getAllUserTokens(db, 'events');

      if (tokens.length === 0) {
        console.log('No push tokens found or all users have event reminders disabled');
        return null;
      }

      // Send reminder for each event
      for (const eventDoc of eventsQuery.docs) {
        const event = eventDoc.data();
        const eventId = eventDoc.id;

        const messages = tokens.map(token => ({
          to: token,
          sound: 'default',
          title: `📅 Reminder: ${event.title}`,
          body: `Don't forget! ${event.title} is tomorrow at ${event.time || 'TBA'}`,
          data: {
            type: 'event',
            eventId: eventId,
            screen: 'EventDetails',
          },
          priority: 'high',
        }));

        const { successCount, errorCount, invalidTokens } = await sendNotificationsWithCleanup(messages, userTokenMap);
        
        // Clean up invalid tokens
        if (invalidTokens.length > 0) {
          await cleanupInvalidTokens(db, invalidTokens);
        }

        console.log(`Event reminder sent: ${event.title} - ${successCount} sent, ${errorCount} errors`);
      }

      console.log(`Event reminders complete for ${eventsQuery.size} event(s)`);
      return null;
    } catch (error) {
      console.error('Error in sendEventReminders:', error);
      throw error;
    }
  });

// ============================================
// AUTO-NOTIFICATIONS ON CONTENT CREATION
// ============================================

/**
 * Auto-send notification when announcement is created
 */
exports.onAnnouncementCreated = functions.firestore
  .document('announcements/{announcementId}')
  .onCreate(async (snap, context) => {
    try {
      const announcement = snap.data();
      const announcementId = context.params.announcementId;

      // Skip if notification already sent (optional flag)
      if (announcement.notificationSent) {
        console.log('Notification already sent for this announcement');
        return null;
      }

      const db = admin.firestore();

      // Get all user tokens with announcement preferences
      const { tokens, userTokenMap } = await getAllUserTokens(db, 'announcements');

      if (tokens.length === 0) {
        console.log('No push tokens found or all users have announcements disabled');
        // Still mark as sent even if no tokens
        await snap.ref.update({ 
          notificationSent: true, 
          notificationSentAt: admin.firestore.FieldValue.serverTimestamp() 
        });
        return null;
      }

      // Create notification messages
      const messages = tokens.map(token => ({
        to: token,
        sound: 'default',
        title: `📢 ${announcement.title}`,
        body: announcement.message || announcement.content || 'New announcement',
        data: {
          type: 'announcement',
          announcementId: announcementId,
          screen: 'Home',
          tab: 'Announcements',
        },
        priority: announcement.priority === 'High' ? 'high' : 'default',
        channelId: 'announcements',
      }));

      // Send notifications
      const { successCount, errorCount, invalidTokens } = await sendNotificationsWithCleanup(messages, userTokenMap);

      // Clean up invalid tokens
      if (invalidTokens.length > 0) {
        await cleanupInvalidTokens(db, invalidTokens);
      }

      // Mark notification as sent
      await snap.ref.update({ 
        notificationSent: true, 
        notificationSentAt: admin.firestore.FieldValue.serverTimestamp() 
      });

      console.log(`Announcement notification: ${announcement.title} - ${successCount} sent, ${errorCount} errors`);
      return null;
    } catch (error) {
      console.error('Error in onAnnouncementCreated:', error);
      throw error;
    }
  });

/**
 * Auto-send notification when new message is created
 * Sends notification to the specific recipient
 */
exports.onMessageCreated = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snap, context) => {
    try {
      const message = snap.data();
      const messageId = context.params.messageId;
      const recipientId = message.toUserId;

      if (!recipientId) {
        console.log(`Message ${messageId} has no recipient, skipping notification`);
        return null;
      }

      // Skip if notification already sent (optional flag)
      if (message.notificationSent) {
        console.log('Notification already sent for this message');
        return null;
      }

      const db = admin.firestore();

      // Get recipient user data
      const recipientDoc = await db.collection('users').doc(recipientId).get();
      
      if (!recipientDoc.exists) {
        console.log(`Recipient ${recipientId} not found, skipping notification`);
        return null;
      }

      const recipientData = recipientDoc.data();

      // Check if recipient has message notifications enabled
      const notificationsEnabled = shouldSendNotification(recipientData, 'message');
      
      if (!notificationsEnabled) {
        console.log(`Recipient ${recipientId} has message notifications disabled`);
        // Mark as sent even if disabled
        await snap.ref.update({ 
          notificationSent: true, 
          notificationSentAt: admin.firestore.FieldValue.serverTimestamp() 
        });
        return null;
      }

      // Get recipient's push tokens
      const tokens = [];
      const userTokenMap = new Map();
      
      if (recipientData.pushTokens && Array.isArray(recipientData.pushTokens)) {
        recipientData.pushTokens.forEach(token => {
          if (Expo.isExpoPushToken(token)) {
            tokens.push(token);
            userTokenMap.set(token, recipientId);
          }
        });
      }

      if (tokens.length === 0) {
        console.log(`Recipient ${recipientId} has no push tokens`);
        // Mark as sent even if no tokens
        await snap.ref.update({ 
          notificationSent: true, 
          notificationSentAt: admin.firestore.FieldValue.serverTimestamp() 
        });
        return null;
      }

      // Create notification messages
      const senderName = message.fromUserName || 'Someone';
      const subject = message.subject || 'New message';
      
      const messages = tokens.map(token => ({
        to: token,
        sound: 'default',
        title: '💬 New Message',
        body: `${senderName}: ${subject}`,
        data: {
          type: 'message',
          messageId: messageId,
          screen: 'Messages',
          tab: 'Inbox',
        },
        priority: 'high',
        channelId: 'messages',
      }));

      // Send notifications
      const { successCount, errorCount, invalidTokens } = await sendNotificationsWithCleanup(messages, userTokenMap);

      // Clean up invalid tokens
      if (invalidTokens.length > 0) {
        await cleanupInvalidTokens(db, invalidTokens);
      }

      // Mark notification as sent
      await snap.ref.update({ 
        notificationSent: true, 
        notificationSentAt: admin.firestore.FieldValue.serverTimestamp() 
      });

      console.log(`Message notification: ${messageId} to ${recipientId} - ${successCount} sent, ${errorCount} errors`);
      return null;
    } catch (error) {
      console.error('Error in onMessageCreated:', error);
      // Don't throw - we don't want to fail message creation if notification fails
      return null;
    }
  });

/**
 * Auto-send notification when new sermon is published
 */
exports.onSermonCreated = functions.firestore
  .document('sermons/{sermonId}')
  .onCreate(async (snap, context) => {
    try {
      const sermon = snap.data();
      const sermonId = context.params.sermonId;

      // Only send if sermon is published
      if (sermon.status !== 'published' && sermon.status !== undefined) {
        console.log(`Sermon ${sermonId} is not published, skipping notification`);
        return null;
      }

      const db = admin.firestore();

      // Get all user tokens with sermon preferences
      const { tokens, userTokenMap } = await getAllUserTokens(db, 'sermons');

      if (tokens.length === 0) {
        console.log('No push tokens found or all users have sermon notifications disabled');
        return null;
      }

      const messages = tokens.map(token => ({
        to: token,
        sound: 'default',
        title: `🎧 New Sermon: ${sermon.title}`,
        body: `By ${sermon.speaker || sermon.pastor || 'Pastor'}`,
        data: {
          type: 'sermon',
          sermonId: sermonId,
          screen: 'Sermons',
        },
        priority: 'default',
      }));

      const { successCount, errorCount, invalidTokens } = await sendNotificationsWithCleanup(messages, userTokenMap);

      // Clean up invalid tokens
      if (invalidTokens.length > 0) {
        await cleanupInvalidTokens(db, invalidTokens);
      }

      console.log(`Sermon notification: ${sermon.title} - ${successCount} sent, ${errorCount} errors`);
      return null;
    } catch (error) {
      console.error('Error in onSermonCreated:', error);
      throw error;
    }
  });

// ============================================
// SERVER-SIDE DATA PROCESSING
// ============================================

/**
 * Calculate monthly statistics on the first day of each month
 */
exports.calculateMonthlyStats = functions.pubsub
  .schedule('0 0 1 * *') // First day of month at midnight
  .timeZone('Africa/Accra')
  .onRun(async (context) => {
    try {
      const db = admin.firestore();
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const monthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

      console.log(`Calculating monthly stats for ${monthKey}`);

      // Calculate giving statistics
      const donationsSnapshot = await db.collection('donations')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(lastMonth))
        .where('createdAt', '<', admin.firestore.Timestamp.fromDate(now))
        .get();

      let totalGiving = 0;
      let donationCount = 0;
      const givingByCategory = {};

      donationsSnapshot.forEach((doc) => {
        const donation = doc.data();
        totalGiving += donation.amount || 0;
        donationCount++;

        const category = donation.category || 'General';
        givingByCategory[category] = (givingByCategory[category] || 0) + (donation.amount || 0);
      });

      // Calculate attendance statistics
      const checkInsSnapshot = await db.collection('checkIns')
        .where('checkedInAt', '>=', admin.firestore.Timestamp.fromDate(lastMonth))
        .where('checkedInAt', '<', admin.firestore.Timestamp.fromDate(now))
        .get();

      const uniqueAttendees = new Set();
      checkInsSnapshot.forEach((doc) => {
        uniqueAttendees.add(doc.data().userId);
      });

      // Calculate new members
      const newMembersSnapshot = await db.collection('users')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(lastMonth))
        .where('createdAt', '<', admin.firestore.Timestamp.fromDate(now))
        .get();

      // Store statistics
      await db.collection('monthlyStats').doc(monthKey).set({
        month: monthKey,
        totalGiving: totalGiving,
        donationCount: donationCount,
        averageDonation: donationCount > 0 ? totalGiving / donationCount : 0,
        givingByCategory: givingByCategory,
        totalAttendance: checkInsSnapshot.size,
        uniqueAttendees: uniqueAttendees.size,
        newMembers: newMembersSnapshot.size,
        calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Calculated stats for ${monthKey}: $${totalGiving.toFixed(2)} in ${donationCount} donations, ${uniqueAttendees.size} unique attendees, ${newMembersSnapshot.size} new members`);
      return null;
    } catch (error) {
      console.error('Error calculating monthly stats:', error);
      throw error;
    }
  });

