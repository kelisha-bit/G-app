# 🔥 Firebase Functions Implementation Examples

**Practical code examples for when you're ready to add Firebase Functions to your church app.**

---

## 📋 Prerequisites

Before implementing Functions, you'll need:

1. **Firebase CLI installed:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase project upgraded to Blaze plan** (pay-as-you-go)

3. **Initialize Functions in your project:**
   ```bash
   firebase init functions
   ```

---

## 📅 1. Automated Scheduled Notifications

### Daily Devotional Notification

**What it does:** Sends a notification every morning at 6 AM with the day's devotional.

```javascript
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
          // Default to true if preference not set (backward compatibility)
          const notificationsEnabled = userData.notificationPreferences?.devotionals !== false;
          
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
```

### Event Reminder (24 Hours Before)

**What it does:** Sends reminder notifications 24 hours before events.

```javascript
/**
 * Check for events happening in 24 hours and send reminders
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
        console.log('No events tomorrow');
        return null;
      }
      
      // Get all user push tokens
      const usersSnapshot = await db.collection('users').get();
      const tokens = [];
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.pushTokens && Array.isArray(userData.pushTokens)) {
          userData.pushTokens.forEach(token => {
            if (Expo.isExpoPushToken(token)) {
              tokens.push(token);
            }
          });
        }
      });
      
      // Send reminder for each event
      for (const eventDoc of eventsQuery.docs) {
        const event = eventDoc.data();
        
        const messages = tokens.map(token => ({
          to: token,
          sound: 'default',
          title: `📅 Reminder: ${event.title}`,
          body: `Don't forget! ${event.title} is tomorrow at ${event.time || 'TBA'}`,
          data: {
            type: 'event',
            eventId: eventDoc.id,
            screen: 'EventDetails',
          },
          priority: 'high',
        }));
        
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
          await expo.sendPushNotificationsAsync(chunk);
        }
      }
      
      console.log(`Sent reminders for ${eventsQuery.size} events`);
      return null;
    } catch (error) {
      console.error('Error in sendEventReminders:', error);
      return null;
    }
  });
```

---

## 🔔 2. Auto-Notifications on Content Creation

### Auto-Send Notification When Announcement is Created

**What it does:** Automatically sends notification to all users when admin creates an announcement.

```javascript
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
      
      // Get all user push tokens
      const usersSnapshot = await db.collection('users').get();
      const tokens = [];
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.pushTokens && Array.isArray(userData.pushTokens)) {
          userData.pushTokens.forEach(token => {
            if (Expo.isExpoPushToken(token)) {
              tokens.push(token);
            }
          });
        }
      });
      
      if (tokens.length === 0) {
        console.log('No push tokens found');
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
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk);
      }
      
      // Mark notification as sent
      await snap.ref.update({ notificationSent: true, notificationSentAt: admin.firestore.FieldValue.serverTimestamp() });
      
      console.log(`Sent notification for announcement: ${announcement.title}`);
      return null;
    } catch (error) {
      console.error('Error in onAnnouncementCreated:', error);
      return null;
    }
  });
```

### Auto-Send Notification When New Sermon is Added

```javascript
/**
 * Auto-send notification when new sermon is published
 */
exports.onSermonCreated = functions.firestore
  .document('sermons/{sermonId}')
  .onCreate(async (snap, context) => {
    try {
      const sermon = snap.data();
      
      // Only send if sermon is published
      if (sermon.status !== 'published' && sermon.status !== undefined) {
        return null;
      }
      
      const db = admin.firestore();
      const usersSnapshot = await db.collection('users').get();
      const tokens = [];
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.pushTokens && Array.isArray(userData.pushTokens)) {
          userData.pushTokens.forEach(token => {
            if (Expo.isExpoPushToken(token)) {
              tokens.push(token);
            }
          });
        }
      });
      
      const messages = tokens.map(token => ({
        to: token,
        sound: 'default',
        title: `🎧 New Sermon: ${sermon.title}`,
        body: `By ${sermon.speaker || sermon.pastor || 'Pastor'}`,
        data: {
          type: 'sermon',
          sermonId: context.params.sermonId,
          screen: 'Sermons',
        },
        priority: 'default',
      }));
      
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk);
      }
      
      console.log(`Sent notification for sermon: ${sermon.title}`);
      return null;
    } catch (error) {
      console.error('Error in onSermonCreated:', error);
      return null;
    }
  });
```

---

## 💳 3. Payment Processing Webhook

### Secure Payment Webhook Handler

**What it does:** Securely handles payment webhooks from payment providers (e.g., Stripe, PayPal).

```javascript
/**
 * Handle payment webhook securely
 */
exports.paymentWebhook = functions.https.onRequest(async (req, res) => {
  try {
    // Verify webhook signature (example for Stripe)
    const stripe = require('stripe')(functions.config().stripe.secret_key);
    const sig = req.headers['stripe-signature'];
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        functions.config().stripe.webhook_secret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handleSuccessfulPayment(paymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await handleFailedPayment(failedPayment);
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Webhook processing failed');
  }
});

/**
 * Handle successful payment
 */
async function handleSuccessfulPayment(paymentIntent) {
  const db = admin.firestore();
  
  // Extract user ID and amount from payment metadata
  const userId = paymentIntent.metadata.userId;
  const amount = paymentIntent.amount / 100; // Convert from cents
  const category = paymentIntent.metadata.category || 'General';
  
  // Record donation in Firestore
  await db.collection('donations').add({
    userId: userId,
    amount: amount,
    category: category,
    paymentIntentId: paymentIntent.id,
    status: 'completed',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  // Update user's giving total
  const userRef = db.collection('users').doc(userId);
  await userRef.update({
    totalGiven: admin.firestore.FieldValue.increment(amount),
    lastDonationDate: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  // Send confirmation notification
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  
  if (userData.pushTokens && userData.pushTokens.length > 0) {
    const messages = userData.pushTokens
      .filter(token => Expo.isExpoPushToken(token))
      .map(token => ({
        to: token,
        sound: 'default',
        title: '✅ Donation Received',
        body: `Thank you for your donation of $${amount.toFixed(2)}`,
        data: {
          type: 'donation',
          amount: amount,
          screen: 'GivingHistory',
        },
      }));
    
    if (messages.length > 0) {
      await expo.sendPushNotificationsAsync(messages);
    }
  }
  
  console.log(`Processed payment: $${amount} from user ${userId}`);
}
```

---

## 📧 4. Email Notifications

### Welcome Email on User Registration

**What it does:** Sends welcome email when new user registers.

```javascript
const nodemailer = require('nodemailer');

// Configure email transporter (using Gmail as example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password,
  },
});

/**
 * Send welcome email when user registers
 */
exports.sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  try {
    const userEmail = user.email;
    const displayName = user.displayName || 'Member';
    
    const mailOptions = {
      from: 'Greater Works City Church <noreply@greaterworkscitychurch.org>',
      to: userEmail,
      subject: 'Welcome to Greater Works City Church!',
      html: `
        <h2>Welcome, ${displayName}!</h2>
        <p>We're excited to have you join our church community.</p>
        <p>Download our mobile app to stay connected:</p>
        <ul>
          <li>View upcoming events</li>
          <li>Watch sermons</li>
          <li>Join ministries</li>
          <li>Give online</li>
          <li>And much more!</li>
        </ul>
        <p>Blessings,<br>The Greater Works City Church Team</p>
      `,
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${userEmail}`);
    return null;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return null;
  }
});
```

### Password Reset Email

```javascript
/**
 * Send password reset email
 */
exports.sendPasswordResetEmail = functions.https.onCall(async (data, context) => {
  try {
    // Verify user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    const userEmail = context.auth.token.email;
    
    // Generate password reset link
    const resetLink = await admin.auth().generatePasswordResetLink(userEmail);
    
    const mailOptions = {
      from: 'Greater Works City Church <noreply@greaterworkscitychurch.org>',
      to: userEmail,
      subject: 'Reset Your Password',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };
    
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Password reset email sent' };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send email');
  }
});
```

---

## 📊 5. Server-Side Data Processing

### Calculate Monthly Statistics

**What it does:** Calculates monthly statistics and stores them for quick access.

```javascript
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
      
      console.log(`Calculated stats for ${monthKey}`);
      return null;
    } catch (error) {
      console.error('Error calculating monthly stats:', error);
      return null;
    }
  });
```

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd functions
npm install firebase-functions firebase-admin expo-server-sdk
npm install --save-dev firebase-functions-test
```

### 2. Configure Environment Variables

```bash
firebase functions:config:set stripe.secret_key="sk_live_..."
firebase functions:config:set stripe.webhook_secret="whsec_..."
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.password="your-app-password"
```

### 3. Deploy Functions

```bash
firebase deploy --only functions
```

### 4. Test Functions

```bash
# Test scheduled function manually
firebase functions:shell

# In the shell:
sendDailyDevotional()
```

---

## 📝 Notes

- **Cost:** Functions are charged per invocation and compute time
- **Free Tier:** 2 million invocations/month free
- **Timeout:** Functions have a maximum execution time (9 minutes for HTTP, 60 seconds for scheduled)
- **Security:** Keep API keys in Firebase config, not in code
- **Testing:** Use Firebase emulator for local testing

---

## ✅ Next Steps

1. Choose which functions you want to implement
2. Set up Firebase Functions in your project
3. Install required dependencies
4. Deploy and test
5. Monitor usage in Firebase Console

---

**Last Updated:** January 2026  
**Status:** Ready to implement when needed!

