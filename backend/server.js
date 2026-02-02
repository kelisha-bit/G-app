/**
 * Push Notifications Backend Service
 * 
 * This Express server handles sending push notifications via Expo Push Notification Service.
 * It receives notification requests from the mobile app and sends them to user devices.
 * 
 * Environment Variables:
 * - PORT: Server port (default: 3001)
 * - NODE_ENV: Environment (development/production)
 */

const express = require('express');
const cors = require('cors');
const { Expo } = require('expo-server-sdk');
require('dotenv').config();

const app = express();
const expo = new Expo();

// Middleware
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

/**
 * Validate if a token is a valid Expo push token
 */
function isValidExpoPushToken(token) {
  return (
    typeof token === 'string' &&
    (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['))
  );
}

/**
 * Send push notifications to multiple tokens
 * @param {Array<string>} tokens - Array of Expo push tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data to send with notification
 * @param {Object} options - Additional notification options (sound, priority, etc.)
 */
async function sendPushNotifications(tokens, title, body, data = {}, options = {}) {
  // Filter out invalid tokens
  const validTokens = tokens.filter(token => isValidExpoPushToken(token));
  
  if (validTokens.length === 0) {
    return {
      success: false,
      error: 'No valid push tokens provided',
      results: []
    };
  }

  // Create messages for each token
  const messages = validTokens.map(token => ({
    to: token,
    sound: options.sound || 'default',
    title: title,
    body: body,
    data: data,
    priority: options.priority || 'default',
    channelId: options.channelId || 'default',
    badge: options.badge,
    ...options
  }));

  // Split messages into chunks (Expo allows up to 100 messages per request)
  const chunks = expo.chunkPushNotifications(messages);
  const results = [];

  // Send each chunk
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      results.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending push notification chunk:', error);
      results.push({
        status: 'error',
        error: error.message
      });
    }
  }

  // Process results
  const successCount = results.filter(r => r.status === 'ok').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const invalidTokens = [];

  // Check for invalid tokens
  results.forEach((result, index) => {
    if (result.status === 'error' && result.details && result.details.error === 'DeviceNotRegistered') {
      invalidTokens.push(validTokens[index]);
    }
  });

  return {
    success: successCount > 0,
    sent: successCount,
    errors: errorCount,
    invalidTokens: invalidTokens,
    results: results
  };
}

/**
 * POST /api/notifications/send
 * Send push notifications to specified tokens
 * 
 * Body:
 * {
 *   "tokens": ["ExpoPushToken[...]", ...],
 *   "title": "Notification Title",
 *   "body": "Notification Body",
 *   "data": { ... },
 *   "options": { ... }
 * }
 */
app.post('/api/notifications/send', async (req, res) => {
  try {
    const { tokens, title, body, data, options } = req.body;

    // Validation
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'tokens array is required and must not be empty'
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: 'title and body are required'
      });
    }

    // Send notifications
    const result = await sendPushNotifications(tokens, title, body, data || {}, options || {});

    if (result.success) {
      res.status(200).json({
        success: true,
        message: `Sent ${result.sent} notification(s)`,
        ...result
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send notifications',
        ...result
      });
    }
  } catch (error) {
    console.error('Error in /api/notifications/send:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/notifications/broadcast
 * Send push notifications to all tokens provided (convenience endpoint)
 * 
 * Body:
 * {
 *   "tokens": ["ExpoPushToken[...]", ...],
 *   "title": "Notification Title",
 *   "body": "Notification Body",
 *   "data": { ... },
 *   "options": { ... }
 * }
 */
app.post('/api/notifications/broadcast', async (req, res) => {
  try {
    const { tokens, title, body, data, options } = req.body;

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'tokens array is required and must not be empty'
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: 'title and body are required'
      });
    }

    const result = await sendPushNotifications(tokens, title, body, data || {}, options || {});

    res.status(200).json({
      success: result.success,
      message: `Broadcast sent to ${result.sent} device(s)`,
      ...result
    });
  } catch (error) {
    console.error('Error in /api/notifications/broadcast:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'push-notifications',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    service: 'Push Notifications Backend',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      send: 'POST /api/notifications/send',
      broadcast: 'POST /api/notifications/broadcast'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Push Notifications Backend running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;

