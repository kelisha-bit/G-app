import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../../../firebase.config';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { clearAllCache, CACHE_KEYS } from '../../utils/cacheService';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

const ADMIN_SETTINGS_KEY = '@admin:settings';

export default function AdminSettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  // Dashboard Settings
  const [dashboardSettings, setDashboardSettings] = useState({
    defaultPeriod: 'Week',
    autoRefresh: true,
    autoRefreshInterval: 5, // minutes
    showTrends: true,
    showRecentActivity: true,
    showUpcomingEvents: true,
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    adminNotifications: true,
    memberActivityAlerts: true,
    givingAlerts: true,
    eventRegistrationAlerts: true,
    prayerRequestAlerts: true,
    weeklySummary: true,
    emailReports: false,
  });

  // Data Management
  const [cacheSize, setCacheSize] = useState('Calculating...');
  const [systemInfo, setSystemInfo] = useState({
    appVersion: Constants?.expoConfig?.version || Constants?.manifest?.version || '1.0.0',
    platform: Platform.OS,
    deviceModel: Platform.select({
      ios: Constants?.deviceName || 'iOS Device',
      android: Constants?.deviceName || 'Android Device',
    }) || 'Unknown Device',
    firebaseProject: Constants?.expoConfig?.extra?.firebaseProjectId || Constants?.manifest?.extra?.firebaseProjectId || 'N/A',
  });

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
    { id: 'data', label: 'Data', icon: 'server-outline' },
    { id: 'system', label: 'System', icon: 'information-circle-outline' },
  ];

  useEffect(() => {
    loadSettings();
    calculateCacheSize();
    
    // Animate on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Animate tab indicator
    const tabIndex = tabs.findIndex(tab => tab.id === activeTab);
    Animated.spring(tabIndicatorAnim, {
      toValue: tabIndex,
      tension: 100,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [activeTab]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load from AsyncStorage
      const savedSettings = await AsyncStorage.getItem(ADMIN_SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.dashboard) setDashboardSettings(parsed.dashboard);
        if (parsed.notifications) setNotificationSettings(parsed.notifications);
      }

      // Also load from Firestore user document
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.adminSettings) {
            if (userData.adminSettings.dashboard) {
              setDashboardSettings({ ...dashboardSettings, ...userData.adminSettings.dashboard });
            }
            if (userData.adminSettings.notifications) {
              setNotificationSettings({ ...notificationSettings, ...userData.adminSettings.notifications });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading admin settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const settingsToSave = {
        dashboard: dashboardSettings,
        notifications: notificationSettings,
        lastUpdated: new Date().toISOString(),
      };

      // Save to AsyncStorage for quick access
      await AsyncStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settingsToSave));

      // Save to Firestore for sync across devices
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          adminSettings: settingsToSave,
        });
      }

      // Success animation
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      Alert.alert('✅ Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving admin settings:', error);
      Alert.alert('❌ Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const calculateCacheSize = async () => {
    try {
      let totalSize = 0;
      const keys = Object.values(CACHE_KEYS);
      
      for (const key of keys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      }

      // Convert to readable format
      if (totalSize < 1024) {
        setCacheSize(`${totalSize} B`);
      } else if (totalSize < 1024 * 1024) {
        setCacheSize(`${(totalSize / 1024).toFixed(2)} KB`);
      } else {
        setCacheSize(`${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
      }
    } catch (error) {
      setCacheSize('Unable to calculate');
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. The app will need to reload data from the server. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllCache();
              await calculateCacheSize();
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      Alert.alert('Export Data', 'Preparing data export...');
      
      const collections = ['users', 'events', 'sermons', 'announcements', 'departments', 'ministries', 'giving', 'checkIns', 'prayerRequests'];
      const exportData = {};

      for (const coll of collections) {
        try {
          const snapshot = await getDocs(collection(db, coll));
          exportData[coll] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
          console.error(`Error exporting ${coll}:`, error);
          exportData[coll] = [];
        }
      }

      const dataString = JSON.stringify(exportData, null, 2);
      Alert.alert(
        'Data Exported',
        `Exported ${Object.keys(exportData).length} collections. Data ready for copy.`,
        [
          {
            text: 'Copy to Clipboard',
            onPress: () => {
              // Note: You might want to use a clipboard library like @react-native-clipboard/clipboard
              Alert.alert('Info', 'Data export complete. Consider using a proper export mechanism for production.');
            },
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Reset all admin settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setDashboardSettings({
              defaultPeriod: 'Week',
              autoRefresh: true,
              autoRefreshInterval: 5,
              showTrends: true,
              showRecentActivity: true,
              showUpcomingEvents: true,
            });
            setNotificationSettings({
              adminNotifications: true,
              memberActivityAlerts: true,
              givingAlerts: true,
              eventRegistrationAlerts: true,
              prayerRequestAlerts: true,
              weeklySummary: true,
              emailReports: false,
            });
            Alert.alert('Success', 'Settings reset to defaults');
          },
        },
      ]
    );
  };

  const handleViewLogs = () => {
    Alert.alert(
      'View Logs',
      'Log viewer feature coming soon. This will show admin activity logs, errors, and system events.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  const tabWidth = width / tabs.length;
  const indicatorPosition = tabIndicatorAnim.interpolate({
    inputRange: tabs.map((_, i) => i),
    outputRange: tabs.map((_, i) => i * tabWidth),
  });

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#6366f1', '#8b5cf6', '#a855f7']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Admin Settings</Text>
            <Text style={styles.headerSubtitle}>Manage your preferences</Text>
          </View>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={saveSettings}
            disabled={saving}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.saveButtonText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Enhanced Tab Selector */}
      <View style={styles.tabContainer}>
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              transform: [{ translateX: indicatorPosition }],
              width: tabWidth - 20,
            },
          ]}
        />
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === tab.id ? tab.icon.replace('-outline', '') : tab.icon}
              size={22}
              color={activeTab === tab.id ? '#6366f1' : '#9ca3af'}
              style={styles.tabIcon}
            />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Dashboard Settings */}
          {activeTab === 'dashboard' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="grid" size={24} color="#6366f1" />
                </View>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>Dashboard Preferences</Text>
                  <Text style={styles.sectionSubtitle}>Customize your dashboard experience</Text>
                </View>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingCardHeader}>
                  <View style={styles.settingIconWrapper}>
                    <Ionicons name="time-outline" size={20} color="#6366f1" />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Default Period</Text>
                    <Text style={styles.settingDescription}>Default time period for statistics</Text>
                  </View>
                </View>
                <View style={styles.periodSelector}>
                  {['Day', 'Week', 'Month', 'Year'].map((period) => (
                    <TouchableOpacity
                      key={period}
                      style={[
                        styles.periodButton,
                        dashboardSettings.defaultPeriod === period && styles.periodButtonSelected,
                      ]}
                      onPress={() => setDashboardSettings({ ...dashboardSettings, defaultPeriod: period })}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.periodButtonText,
                          dashboardSettings.defaultPeriod === period && styles.periodButtonTextSelected,
                        ]}
                      >
                        {period}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingCardHeader}>
                  <View style={styles.settingIconWrapper}>
                    <Ionicons name="refresh-circle-outline" size={20} color="#10b981" />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Auto Refresh</Text>
                    <Text style={styles.settingDescription}>Automatically refresh dashboard data</Text>
                  </View>
                  <Switch
                    value={dashboardSettings.autoRefresh}
                    onValueChange={(value) => setDashboardSettings({ ...dashboardSettings, autoRefresh: value })}
                    trackColor={{ false: '#d1d5db', true: '#10b981' }}
                    thumbColor="#fff"
                    ios_backgroundColor="#d1d5db"
                  />
                </View>
              </View>

              {dashboardSettings.autoRefresh && (
                <View style={styles.settingCard}>
                  <View style={styles.settingCardHeader}>
                    <View style={styles.settingIconWrapper}>
                      <Ionicons name="timer-outline" size={20} color="#f59e0b" />
                    </View>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingLabel}>Refresh Interval</Text>
                      <Text style={styles.settingDescription}>Minutes between auto refresh</Text>
                    </View>
                  </View>
                  <View style={styles.intervalSelector}>
                    {[1, 5, 10, 15, 30].map((interval) => (
                      <TouchableOpacity
                        key={interval}
                        style={[
                          styles.intervalButton,
                          dashboardSettings.autoRefreshInterval === interval && styles.intervalButtonSelected,
                        ]}
                        onPress={() => setDashboardSettings({ ...dashboardSettings, autoRefreshInterval: interval })}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.intervalButtonText,
                            dashboardSettings.autoRefreshInterval === interval && styles.intervalButtonTextSelected,
                          ]}
                        >
                          {interval}m
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.settingCard}>
                <View style={styles.settingCardHeader}>
                  <View style={styles.settingIconWrapper}>
                    <Ionicons name="trending-up-outline" size={20} color="#8b5cf6" />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Show Trends</Text>
                    <Text style={styles.settingDescription}>Display trend indicators on stats</Text>
                  </View>
                  <Switch
                    value={dashboardSettings.showTrends}
                    onValueChange={(value) => setDashboardSettings({ ...dashboardSettings, showTrends: value })}
                    trackColor={{ false: '#d1d5db', true: '#8b5cf6' }}
                    thumbColor="#fff"
                    ios_backgroundColor="#d1d5db"
                  />
                </View>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingCardHeader}>
                  <View style={styles.settingIconWrapper}>
                    <Ionicons name="pulse-outline" size={20} color="#ef4444" />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Show Recent Activity</Text>
                    <Text style={styles.settingDescription}>Display recent activity feed</Text>
                  </View>
                  <Switch
                    value={dashboardSettings.showRecentActivity}
                    onValueChange={(value) => setDashboardSettings({ ...dashboardSettings, showRecentActivity: value })}
                    trackColor={{ false: '#d1d5db', true: '#ef4444' }}
                    thumbColor="#fff"
                    ios_backgroundColor="#d1d5db"
                  />
                </View>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingCardHeader}>
                  <View style={styles.settingIconWrapper}>
                    <Ionicons name="calendar-outline" size={20} color="#06b6d4" />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Show Upcoming Events</Text>
                    <Text style={styles.settingDescription}>Display upcoming events section</Text>
                  </View>
                  <Switch
                    value={dashboardSettings.showUpcomingEvents}
                    onValueChange={(value) => setDashboardSettings({ ...dashboardSettings, showUpcomingEvents: value })}
                    trackColor={{ false: '#d1d5db', true: '#06b6d4' }}
                    thumbColor="#fff"
                    ios_backgroundColor="#d1d5db"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="notifications" size={24} color="#f59e0b" />
                </View>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>Notification Preferences</Text>
                  <Text style={styles.sectionSubtitle}>Control your notification settings</Text>
                </View>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingCardHeader}>
                  <View style={styles.settingIconWrapper}>
                    <Ionicons name="notifications-outline" size={20} color="#6366f1" />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Admin Notifications</Text>
                    <Text style={styles.settingDescription}>Receive general admin notifications</Text>
                  </View>
                  <Switch
                    value={notificationSettings.adminNotifications}
                    onValueChange={(value) => setNotificationSettings({ ...notificationSettings, adminNotifications: value })}
                    trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                    thumbColor="#fff"
                    ios_backgroundColor="#d1d5db"
                  />
                </View>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingCardHeader}>
                  <View style={styles.settingIconWrapper}>
                    <Ionicons name="people-outline" size={20} color="#10b981" />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Member Activity Alerts</Text>
                    <Text style={styles.settingDescription}>Notifications for member activities</Text>
                  </View>
                  <Switch
                    value={notificationSettings.memberActivityAlerts}
                    onValueChange={(value) => setNotificationSettings({ ...notificationSettings, memberActivityAlerts: value })}
                    trackColor={{ false: '#d1d5db', true: '#10b981' }}
                    thumbColor="#fff"
                    ios_backgroundColor="#d1d5db"
                  />
                </View>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingCardHeader}>
                  <View style={styles.settingIconWrapper}>
                    <Ionicons name="heart-outline" size={20} color="#ef4444" />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Giving Alerts</Text>
                    <Text style={styles.settingDescription}>Notifications for new giving</Text>
                  </View>
                  <Switch
                    value={notificationSettings.givingAlerts}
                    onValueChange={(value) => setNotificationSettings({ ...notificationSettings, givingAlerts: value })}
                    trackColor={{ false: '#d1d5db', true: '#ef4444' }}
                    thumbColor="#fff"
                    ios_backgroundColor="#d1d5db"
                  />
                </View>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingCardHeader}>
                  <View style={styles.settingIconWrapper}>
                    <Ionicons name="calendar-outline" size={20} color="#8b5cf6" />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Event Registration Alerts</Text>
                    <Text style={styles.settingDescription}>Notifications for event registrations</Text>
                  </View>
                  <Switch
                    value={notificationSettings.eventRegistrationAlerts}
                    onValueChange={(value) => setNotificationSettings({ ...notificationSettings, eventRegistrationAlerts: value })}
                    trackColor={{ false: '#d1d5db', true: '#8b5cf6' }}
                    thumbColor="#fff"
                    ios_backgroundColor="#d1d5db"
                  />
                </View>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingCardHeader}>
                  <View style={styles.settingIconWrapper}>
                    <Ionicons name="hand-left-outline" size={20} color="#06b6d4" />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Prayer Request Alerts</Text>
                    <Text style={styles.settingDescription}>Notifications for new prayer requests</Text>
                  </View>
                  <Switch
                    value={notificationSettings.prayerRequestAlerts}
                    onValueChange={(value) => setNotificationSettings({ ...notificationSettings, prayerRequestAlerts: value })}
                    trackColor={{ false: '#d1d5db', true: '#06b6d4' }}
                    thumbColor="#fff"
                    ios_backgroundColor="#d1d5db"
                  />
                </View>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingCardHeader}>
                  <View style={styles.settingIconWrapper}>
                    <Ionicons name="stats-chart-outline" size={20} color="#14b8a6" />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Weekly Summary</Text>
                    <Text style={styles.settingDescription}>Receive weekly summary reports</Text>
                  </View>
                  <Switch
                    value={notificationSettings.weeklySummary}
                    onValueChange={(value) => setNotificationSettings({ ...notificationSettings, weeklySummary: value })}
                    trackColor={{ false: '#d1d5db', true: '#14b8a6' }}
                    thumbColor="#fff"
                    ios_backgroundColor="#d1d5db"
                  />
                </View>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingCardHeader}>
                  <View style={styles.settingIconWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#ec4899" />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Email Reports</Text>
                    <Text style={styles.settingDescription}>Send reports via email</Text>
                  </View>
                  <Switch
                    value={notificationSettings.emailReports}
                    onValueChange={(value) => setNotificationSettings({ ...notificationSettings, emailReports: value })}
                    trackColor={{ false: '#d1d5db', true: '#ec4899' }}
                    thumbColor="#fff"
                    ios_backgroundColor="#d1d5db"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Data Management */}
          {activeTab === 'data' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="server" size={24} color="#10b981" />
                </View>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>Data Management</Text>
                  <Text style={styles.sectionSubtitle}>Manage your app data and cache</Text>
                </View>
              </View>

              <LinearGradient
                colors={['#ede9fe', '#f3e8ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.infoCardGradient}
              >
                <View style={styles.infoCardIconWrapper}>
                  <Ionicons name="information-circle" size={28} color="#6366f1" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Cache Information</Text>
                  <View style={styles.cacheSizeContainer}>
                    <Text style={styles.cacheSizeLabel}>Current cache size:</Text>
                    <Text style={styles.cacheSizeValue}>{cacheSize}</Text>
                  </View>
                </View>
              </LinearGradient>

              <TouchableOpacity style={styles.actionButtonEnhanced} onPress={handleClearCache} activeOpacity={0.7}>
                <LinearGradient
                  colors={['#fff', '#fef2f2']}
                  style={styles.actionButtonGradient}
                >
                  <View style={styles.actionButtonIconWrapper}>
                    <Ionicons name="trash" size={26} color="#ef4444" />
                  </View>
                  <View style={styles.actionButtonText}>
                    <Text style={styles.actionButtonTitle}>Clear Cache</Text>
                    <Text style={styles.actionButtonDescription}>Remove all cached data</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButtonEnhanced} onPress={calculateCacheSize} activeOpacity={0.7}>
                <LinearGradient
                  colors={['#fff', '#eff6ff']}
                  style={styles.actionButtonGradient}
                >
                  <View style={styles.actionButtonIconWrapper}>
                    <Ionicons name="refresh" size={26} color="#6366f1" />
                  </View>
                  <View style={styles.actionButtonText}>
                    <Text style={styles.actionButtonTitle}>Recalculate Cache Size</Text>
                    <Text style={styles.actionButtonDescription}>Update cache size information</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButtonEnhanced} onPress={handleExportData} activeOpacity={0.7}>
                <LinearGradient
                  colors={['#fff', '#ecfdf5']}
                  style={styles.actionButtonGradient}
                >
                  <View style={styles.actionButtonIconWrapper}>
                    <Ionicons name="download" size={26} color="#10b981" />
                  </View>
                  <View style={styles.actionButtonText}>
                    <Text style={styles.actionButtonTitle}>Export Data</Text>
                    <Text style={styles.actionButtonDescription}>Export all app data (JSON format)</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButtonEnhanced} onPress={handleViewLogs} activeOpacity={0.7}>
                <LinearGradient
                  colors={['#fff', '#faf5ff']}
                  style={styles.actionButtonGradient}
                >
                  <View style={styles.actionButtonIconWrapper}>
                    <Ionicons name="document-text" size={26} color="#8b5cf6" />
                  </View>
                  <View style={styles.actionButtonText}>
                    <Text style={styles.actionButtonTitle}>View Logs</Text>
                    <Text style={styles.actionButtonDescription}>View system and activity logs</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* System Info */}
          {activeTab === 'system' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="information-circle" size={24} color="#06b6d4" />
                </View>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>System Information</Text>
                  <Text style={styles.sectionSubtitle}>App and device details</Text>
                </View>
              </View>

              <View style={styles.systemInfoGrid}>
                <LinearGradient
                  colors={['#eff6ff', '#dbeafe']}
                  style={styles.systemInfoCard}
                >
                  <View style={styles.systemInfoIconWrapper}>
                    <Ionicons name="apps" size={28} color="#3b82f6" />
                  </View>
                  <Text style={styles.systemInfoLabel}>App Version</Text>
                  <Text style={styles.systemInfoValue}>{systemInfo.appVersion}</Text>
                </LinearGradient>

                <LinearGradient
                  colors={['#f0fdf4', '#dcfce7']}
                  style={styles.systemInfoCard}
                >
                  <View style={styles.systemInfoIconWrapper}>
                    <Ionicons name="phone-portrait" size={28} color="#10b981" />
                  </View>
                  <Text style={styles.systemInfoLabel}>Platform</Text>
                  <Text style={styles.systemInfoValue}>{systemInfo.platform.toUpperCase()}</Text>
                </LinearGradient>

                <LinearGradient
                  colors={['#fef3c7', '#fde68a']}
                  style={styles.systemInfoCard}
                >
                  <View style={styles.systemInfoIconWrapper}>
                    <Ionicons name="hardware-chip" size={28} color="#f59e0b" />
                  </View>
                  <Text style={styles.systemInfoLabel}>Device</Text>
                  <Text style={styles.systemInfoValue} numberOfLines={1}>{systemInfo.deviceModel}</Text>
                </LinearGradient>

                <LinearGradient
                  colors={['#f3e8ff', '#e9d5ff']}
                  style={styles.systemInfoCard}
                >
                  <View style={styles.systemInfoIconWrapper}>
                    <Ionicons name="cloud" size={28} color="#8b5cf6" />
                  </View>
                  <Text style={styles.systemInfoLabel}>Firebase</Text>
                  <Text style={styles.systemInfoValue} numberOfLines={1}>{systemInfo.firebaseProject}</Text>
                </LinearGradient>
              </View>

              <View style={styles.quickActionsSection}>
                <Text style={styles.quickActionsTitle}>Quick Actions</Text>
                
                <TouchableOpacity style={styles.actionButtonEnhanced} onPress={handleResetSettings} activeOpacity={0.7}>
                  <LinearGradient
                    colors={['#fff', '#fffbeb']}
                    style={styles.actionButtonGradient}
                  >
                    <View style={styles.actionButtonIconWrapper}>
                      <Ionicons name="refresh-circle" size={26} color="#f59e0b" />
                    </View>
                    <View style={styles.actionButtonText}>
                      <Text style={styles.actionButtonTitle}>Reset Settings</Text>
                      <Text style={styles.actionButtonDescription}>Reset all settings to defaults</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  header: {
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    height: 3,
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 2,
    gap: 4,
  },
  tabIcon: {
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    textAlign: 'center',
  },
  tabLabelActive: {
    color: '#6366f1',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  settingCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  settingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonSelected: {
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  periodButtonText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  periodButtonTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  intervalSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    flexWrap: 'wrap',
  },
  intervalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  intervalButtonSelected: {
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  intervalButtonText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  intervalButtonTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  infoCardGradient: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  infoCardIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  cacheSizeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  cacheSizeLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  cacheSizeValue: {
    fontSize: 18,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  actionButtonEnhanced: {
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  actionButtonIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  actionButtonDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  systemInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  systemInfoCard: {
    width: (width - 52) / 2,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  systemInfoIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  systemInfoLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  systemInfoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '700',
    textAlign: 'center',
  },
  quickActionsSection: {
    marginTop: 8,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
});

