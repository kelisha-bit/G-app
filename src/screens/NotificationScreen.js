import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebase.config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import notificationService from '../utils/notificationService';

export default function NotificationScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    eventReminders: true,
    prayerRequestUpdates: true,
    messageNotifications: true,
    sermonNotifications: true,
    announcementNotifications: true,
    weeklyDigest: false,
  });
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    loadNotificationSettings();
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = async () => {
    const permission = await notificationService.checkPermissions();
    setHasPermission(permission);
  };

  const loadNotificationSettings = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.notificationSettings) {
          setSettings({
            ...settings,
            ...userData.notificationSettings,
          });
        }
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key) => {
    // Special handling for push notifications
    if (key === 'pushNotifications' && !settings[key]) {
      // User is enabling push notifications - request permission
      const permission = await notificationService.requestPermissions();
      if (!permission) {
        Alert.alert(
          'Permission Required',
          'Push notifications require permission. Please enable notifications in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Register for push notifications
      const token = await notificationService.registerForPushNotifications();
      if (token) {
        setHasPermission(true);
      } else {
        Alert.alert(
          'Error',
          'Failed to register for push notifications. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(newSettings);

    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          notificationSettings: newSettings,
        });
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      Alert.alert('Error', 'Failed to update notification settings');
      // Revert on error
      setSettings(settings);
    }
  };

  const notificationCategories = [
    {
      title: 'Push Notifications',
      description: 'Receive push notifications on your device',
      key: 'pushNotifications',
      icon: 'notifications',
    },
    {
      title: 'Email Notifications',
      description: 'Receive notifications via email',
      key: 'emailNotifications',
      icon: 'mail',
    },
    {
      title: 'Event Reminders',
      description: 'Get reminded about upcoming events',
      key: 'eventReminders',
      icon: 'calendar',
    },
    {
      title: 'Prayer Request Updates',
      description: 'Notifications when someone prays for your requests',
      key: 'prayerRequestUpdates',
      icon: 'hand-left',
    },
    {
      title: 'Message Notifications',
      description: 'Notifications for new messages',
      key: 'messageNotifications',
      icon: 'chatbubbles',
    },
    {
      title: 'Sermon Notifications',
      description: 'Get notified when new sermons are available',
      key: 'sermonNotifications',
      icon: 'play-circle',
    },
    {
      title: 'Announcement Notifications',
      description: 'Notifications for church announcements',
      key: 'announcementNotifications',
      icon: 'megaphone',
    },
    {
      title: 'Weekly Digest',
      description: 'Receive a weekly summary of activities',
      key: 'weeklyDigest',
      icon: 'newspaper',
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="notifications-outline" size={32} color="#8b5cf6" />
          <Text style={styles.infoTitle}>Manage Your Notifications</Text>
          <Text style={styles.infoText}>
            Choose what notifications you want to receive and how you want to receive them
          </Text>
          {!hasPermission && (
            <View style={styles.permissionWarning}>
              <Ionicons name="warning-outline" size={20} color="#ef4444" />
              <Text style={styles.permissionText}>
                Push notifications are disabled. Enable them to receive important updates.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          {notificationCategories.map((category, index) => (
            <View key={category.key} style={styles.settingCard}>
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name={category.icon} size={22} color="#6366f1" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>{category.title}</Text>
                  <Text style={styles.settingDescription}>
                    {category.description}
                  </Text>
                </View>
              </View>
              <Switch
                value={settings[category.key]}
                onValueChange={() => handleToggle(category.key)}
                trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={24} color="#f59e0b" />
          <Text style={styles.tipText}>
            You can always change these settings later. Disabling notifications won't affect important account-related messages.
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 10,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
    marginLeft: 12,
  },
  permissionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  permissionText: {
    flex: 1,
    fontSize: 12,
    color: '#dc2626',
    marginLeft: 8,
    lineHeight: 16,
  },
});


