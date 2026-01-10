import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.config';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { useNavigationContainerRef } from '@react-navigation/native';
import ErrorBoundary from './src/components/ErrorBoundary';
import notificationService from './src/utils/notificationService';

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Main Screens
import HomeScreen from './src/screens/HomeScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import EventsScreen from './src/screens/EventsScreen';
import EventDetailsScreen from './src/screens/EventDetailsScreen';
import SermonsScreen from './src/screens/SermonsScreen';
import DevotionalScreen from './src/screens/DevotionalScreen';
import GivingScreen from './src/screens/GivingScreen';
import GivingHistoryScreen from './src/screens/GivingHistoryScreen';
import DepartmentsScreen from './src/screens/DepartmentsScreen';
import DepartmentDetailsScreen from './src/screens/DepartmentDetailsScreen';
import MinistriesScreen from './src/screens/MinistriesScreen';
import VolunteerScreen from './src/screens/VolunteerScreen';
import DirectoryScreen from './src/screens/DirectoryScreen';
import PrayerScreen from './src/screens/PrayerScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BibleScreen from './src/screens/BibleScreen';
import SmallGroupsScreen from './src/screens/SmallGroupsScreen';
import SermonNotesScreen from './src/screens/SermonNotesScreen';
import MediaGalleryScreen from './src/screens/MediaGalleryScreen';
import ChurchCalendarScreen from './src/screens/ChurchCalendarScreen';
import FamilyMinistryScreen from './src/screens/FamilyMinistryScreen';
import MyActivityScreen from './src/screens/MyActivityScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import AboutScreen from './src/screens/AboutScreen';
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';
import ManageMembersScreen from './src/screens/admin/ManageMembersScreen';
import ManageEventsScreen from './src/screens/admin/ManageEventsScreen';
import ManageSermonsScreen from './src/screens/admin/ManageSermonsScreen';
import ManageAnnouncementsScreen from './src/screens/admin/ManageAnnouncementsScreen';
import ManageDevotionalsScreen from './src/screens/admin/ManageDevotionalsScreen';
import ManageVolunteersScreen from './src/screens/admin/ManageVolunteersScreen';
import MemberActivityScreen from './src/screens/admin/MemberActivityScreen';
import ReportsScreen from './src/screens/admin/ReportsScreen';
import ManageBannerScreen from './src/screens/admin/ManageBannerScreen';
import AdminSettingsScreen from './src/screens/admin/AdminSettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();
  
  // Calculate safe bottom padding - add extra padding for device navigation bars
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 0 : 8);
  const tabBarHeight = 60 + bottomPadding;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Events') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Sermons') {
            iconName = focused ? 'play-circle' : 'play-circle-outline';
          } else if (route.name === 'More') {
            iconName = focused ? 'menu' : 'menu-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: bottomPadding + 5,
          paddingTop: 5,
          height: tabBarHeight,
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          backgroundColor: '#ffffff',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Sermons" component={SermonsScreen} />
      <Tab.Screen name="More" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      
      // Register for push notifications when user logs in
      if (user) {
        try {
          await notificationService.registerForPushNotifications();
        } catch (error) {
          console.error('Error setting up notifications:', error);
        }
      } else {
        // Clean up when user logs out
        notificationService.removeNotificationListeners();
        if (notificationService.expoPushToken) {
          await notificationService.removeTokenFromFirebase(notificationService.expoPushToken);
        }
      }
    });

    return () => {
      unsubscribe();
      notificationService.removeNotificationListeners();
    };
  }, []);

  // Setup notification listeners after navigation is ready
  useEffect(() => {
    if (user && navigationRef.isReady()) {
      notificationService.setupNotificationListeners(navigationRef);
    }

    return () => {
      if (navigationRef.isReady()) {
        notificationService.removeNotificationListeners();
      }
    };
  }, [user, navigationRef]);

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <StatusBar style="auto" />
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
              <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
              </>
            ) : (
              <>
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen name="CheckIn" component={CheckInScreen} />
                <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
                <Stack.Screen name="Devotional" component={DevotionalScreen} />
                <Stack.Screen name="Giving" component={GivingScreen} />
                <Stack.Screen name="GivingHistory" component={GivingHistoryScreen} />
                <Stack.Screen name="Departments" component={DepartmentsScreen} />
                <Stack.Screen name="DepartmentDetails" component={DepartmentDetailsScreen} />
                <Stack.Screen name="Ministries" component={MinistriesScreen} />
                <Stack.Screen name="Volunteer" component={VolunteerScreen} />
                <Stack.Screen name="Directory" component={DirectoryScreen} />
                <Stack.Screen name="Prayer" component={PrayerScreen} />
                <Stack.Screen name="Messages" component={MessagesScreen} />
                <Stack.Screen name="Bible" component={BibleScreen} />
                <Stack.Screen name="SmallGroups" component={SmallGroupsScreen} />
                <Stack.Screen name="SermonNotes" component={SermonNotesScreen} />
                <Stack.Screen name="MediaGallery" component={MediaGalleryScreen} />
                <Stack.Screen name="ChurchCalendar" component={ChurchCalendarScreen} />
                <Stack.Screen name="FamilyMinistry" component={FamilyMinistryScreen} />
                <Stack.Screen name="MyActivity" component={MyActivityScreen} />
                <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                <Stack.Screen name="Notifications" component={NotificationScreen} />
                <Stack.Screen name="Privacy" component={PrivacyScreen} />
                <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
                <Stack.Screen name="About" component={AboutScreen} />
                <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                <Stack.Screen name="ManageMembers" component={ManageMembersScreen} />
                <Stack.Screen name="ManageEvents" component={ManageEventsScreen} />
                <Stack.Screen name="ManageSermons" component={ManageSermonsScreen} />
                <Stack.Screen name="ManageAnnouncements" component={ManageAnnouncementsScreen} />
                <Stack.Screen name="ManageDevotionals" component={ManageDevotionalsScreen} />
                <Stack.Screen name="ManageVolunteers" component={ManageVolunteersScreen} />
                <Stack.Screen name="MemberActivity" component={MemberActivityScreen} />
                <Stack.Screen name="Reports" component={ReportsScreen} />
                <Stack.Screen name="ManageBanner" component={ManageBannerScreen} />
                <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
