/**
 * Push Notification Diagnostics Tool
 * Use this to diagnose why push notifications aren't working on physical devices
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { auth, db } from '../../firebase.config';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Comprehensive diagnostics for push notification issues
 * Returns a detailed report of all potential issues
 */
export async function runPushNotificationDiagnostics() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    issues: [],
    warnings: [],
    info: [],
    recommendations: [],
  };

  try {
    // 1. Check if running on a physical device
    diagnostics.info.push({
      check: 'Physical Device',
      status: Device.isDevice ? '✅ Running on physical device' : '❌ Running on simulator/emulator',
      details: Device.isDevice 
        ? 'Push notifications require a physical device' 
        : 'Push notifications do NOT work on simulators/emulators. Use a physical device.',
    });

    if (!Device.isDevice) {
      diagnostics.issues.push({
        severity: 'error',
        message: 'Not running on a physical device',
        fix: 'Install the app on a physical Android/iOS device to test push notifications',
      });
    }

    // 2. Check if running in Expo Go (Android limitation)
    const isExpoGo = Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';
    diagnostics.info.push({
      check: 'Expo Go Detection',
      status: isExpoGo ? '⚠️ Running in Expo Go' : '✅ Running in development/production build',
      details: isExpoGo 
        ? 'Android push notifications DO NOT work in Expo Go (SDK 53+). You need a development or production build.' 
        : 'Using a custom build (development or production)',
    });

    if (isExpoGo && Platform.OS === 'android') {
      diagnostics.issues.push({
        severity: 'error',
        message: 'Android push notifications do not work in Expo Go',
        fix: 'Build a development build: eas build --platform android --profile development',
      });
    }

    // 3. Check notification permissions
    try {
      const { status } = await Notifications.getPermissionsAsync();
      diagnostics.info.push({
        check: 'Notification Permissions',
        status: status === 'granted' ? '✅ Permissions granted' : `❌ Permissions: ${status}`,
        details: status === 'granted' 
          ? 'User has granted notification permissions' 
          : `Permission status: ${status}. User needs to enable notifications in device settings.`,
      });

      if (status !== 'granted') {
        diagnostics.issues.push({
          severity: 'error',
          message: 'Notification permissions not granted',
          fix: 'User must enable notifications in Settings → Apps → Greater Works City Church → Notifications',
        });
      }
    } catch (error) {
      diagnostics.issues.push({
        severity: 'error',
        message: 'Failed to check notification permissions',
        details: error.message,
      });
    }

    // 4. Try to get Expo push token (this will reveal FCM/configuration issues)
    try {
      const tokenResult = await Notifications.getExpoPushTokenAsync({
        projectId: '518717a0-b81e-4a06-a54e-b599f4155c88',
      });

      if (tokenResult && tokenResult.data) {
        diagnostics.info.push({
          check: 'Expo Push Token',
          status: '✅ Token retrieved successfully',
          details: `Token: ${tokenResult.data.substring(0, 20)}...`,
        });
      } else {
        diagnostics.issues.push({
          severity: 'error',
          message: 'Expo push token is null or invalid',
          fix: 'Check Expo project configuration and ensure you have a valid EAS project ID',
        });
      }
    } catch (tokenError) {
      const errorMessage = tokenError.message || tokenError.toString();
      diagnostics.info.push({
        check: 'Expo Push Token',
        status: '❌ Failed to get token',
        details: errorMessage,
      });

      // Check for specific error types
      if (errorMessage.includes('FCM') || errorMessage.includes('FirebaseApp') || errorMessage.includes('fcm-credentials')) {
        diagnostics.issues.push({
          severity: 'error',
          message: 'FCM credentials not configured for Android',
          details: errorMessage,
          fix: `1. Go to: https://expo.dev/accounts/elishak/projects/greater-works-city-church/credentials
2. Upload FCM Service Account JSON file
3. Rebuild the app: eas build --platform android --profile preview`,
        });
      } else if (errorMessage.includes('Expo Go')) {
        diagnostics.issues.push({
          severity: 'error',
          message: 'Push notifications not supported in Expo Go',
          fix: 'Build a development build: eas build --platform android --profile development',
        });
      } else {
        diagnostics.issues.push({
          severity: 'error',
          message: 'Failed to get Expo push token',
          details: errorMessage,
          fix: 'Check Expo project configuration, network connection, and ensure you\'re using a development/production build',
        });
      }
    }

    // 5. Check if token is saved in Firebase
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const tokens = userData.pushTokens || [];
          diagnostics.info.push({
            check: 'Firebase Token Storage',
            status: tokens.length > 0 ? `✅ ${tokens.length} token(s) stored` : '⚠️ No tokens stored',
            details: tokens.length > 0 
              ? `User has ${tokens.length} push token(s) saved in Firebase` 
              : 'Push token not saved to Firebase. Registration may have failed.',
          });

          if (tokens.length === 0) {
            diagnostics.warnings.push({
              message: 'No push tokens found in Firebase',
              fix: 'Token registration may have failed. Try enabling notifications in Settings → Notifications',
            });
          }

          // Check notification settings
          const settings = userData.notificationSettings || {};
          diagnostics.info.push({
            check: 'User Notification Settings',
            status: settings.pushNotifications !== false ? '✅ Push notifications enabled' : '❌ Push notifications disabled',
            details: `Master switch: ${settings.pushNotifications !== false ? 'ON' : 'OFF'}`,
          });

          if (settings.pushNotifications === false) {
            diagnostics.warnings.push({
              message: 'User has disabled push notifications in app settings',
              fix: 'Enable push notifications in Settings → Notifications',
            });
          }
        } else {
          diagnostics.warnings.push({
            message: 'User document not found in Firebase',
            fix: 'User profile may not be created yet. Try logging out and back in.',
          });
        }
      } else {
        diagnostics.warnings.push({
          message: 'User not logged in',
          fix: 'Log in to enable push notifications',
        });
      }
    } catch (firebaseError) {
      diagnostics.warnings.push({
        message: 'Failed to check Firebase token storage',
        details: firebaseError.message,
      });
    }

    // 6. Check Android notification channels (Android only)
    if (Platform.OS === 'android') {
      try {
        const channels = await Notifications.getNotificationChannelsAsync();
        diagnostics.info.push({
          check: 'Android Notification Channels',
          status: channels.length > 0 ? `✅ ${channels.length} channel(s) configured` : '⚠️ No channels configured',
          details: channels.length > 0 
            ? `Channels: ${channels.map(c => c.id).join(', ')}` 
            : 'Notification channels need to be initialized',
        });

        if (channels.length === 0) {
          diagnostics.warnings.push({
            message: 'No Android notification channels found',
            fix: 'Channels should be initialized on app start. Check App.js initialization.',
          });
        }
      } catch (channelError) {
        diagnostics.warnings.push({
          message: 'Failed to check notification channels',
          details: channelError.message,
        });
      }
    }

    // 7. Check backend service configuration
    const backendUrl = process.env.EXPO_PUBLIC_NOTIFICATION_BACKEND_URL || 'http://localhost:3001';
    diagnostics.info.push({
      check: 'Backend Service URL',
      status: backendUrl ? '✅ Configured' : '⚠️ Not configured',
      details: `Backend URL: ${backendUrl}`,
    });

    if (backendUrl === 'http://localhost:3001') {
      diagnostics.warnings.push({
        message: 'Using default localhost backend URL',
        fix: 'For production, set EXPO_PUBLIC_NOTIFICATION_BACKEND_URL to your deployed backend URL',
      });
    }

    // Generate recommendations
    if (diagnostics.issues.length > 0) {
      diagnostics.recommendations.push('Fix the critical issues listed above');
    }

    if (diagnostics.issues.length === 0 && diagnostics.warnings.length === 0) {
      diagnostics.recommendations.push('All checks passed! If notifications still don\'t work, check:');
      diagnostics.recommendations.push('1. Backend service is running and accessible');
      diagnostics.recommendations.push('2. Network connection is stable');
      diagnostics.recommendations.push('3. App is not in battery saver mode');
      diagnostics.recommendations.push('4. Try sending a test notification from the admin panel');
    }

    return diagnostics;
  } catch (error) {
    diagnostics.issues.push({
      severity: 'error',
      message: 'Diagnostic tool error',
      details: error.message,
    });
    return diagnostics;
  }
}

/**
 * Print diagnostics report to console in a readable format
 */
export function printDiagnosticsReport(diagnostics) {
  console.log('\n🔍 ===== PUSH NOTIFICATION DIAGNOSTICS REPORT =====\n');
  console.log(`Platform: ${diagnostics.platform}`);
  console.log(`Timestamp: ${diagnostics.timestamp}\n`);

  if (diagnostics.info.length > 0) {
    console.log('📋 INFO:');
    diagnostics.info.forEach((info, index) => {
      console.log(`  ${index + 1}. ${info.check}: ${info.status}`);
      if (info.details) {
        console.log(`     ${info.details}`);
      }
    });
    console.log('');
  }

  if (diagnostics.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    diagnostics.warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning.message}`);
      if (warning.details) {
        console.log(`     Details: ${warning.details}`);
      }
      if (warning.fix) {
        console.log(`     Fix: ${warning.fix}`);
      }
    });
    console.log('');
  }

  if (diagnostics.issues.length > 0) {
    console.log('❌ CRITICAL ISSUES:');
    diagnostics.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
      if (issue.details) {
        console.log(`     Details: ${issue.details}`);
      }
      if (issue.fix) {
        console.log(`     Fix: ${issue.fix}`);
      }
    });
    console.log('');
  }

  if (diagnostics.recommendations.length > 0) {
    console.log('💡 RECOMMENDATIONS:');
    diagnostics.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    console.log('');
  }

  console.log('==================================================\n');
}

/**
 * Quick check - returns true if push notifications should work
 */
export async function quickCheck() {
  const diagnostics = await runPushNotificationDiagnostics();
  const hasCriticalIssues = diagnostics.issues.some(i => i.severity === 'error');
  return !hasCriticalIssues;
}

