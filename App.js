import 'react-native-gesture-handler';
import React, { useState, useEffect, Suspense } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.config';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, View, ActivityIndicator } from 'react-native';
import { useNavigationContainerRef } from '@react-navigation/native';
import ErrorBoundary from './src/components/ErrorBoundary';
import notificationService from './src/utils/notificationService';

// Loading component for lazy-loaded screens
const ScreenLoader = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#6366f1" />
  </View>
);

// Critical screens - loaded immediately (auth and main tabs)
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import EventsScreen from './src/screens/EventsScreen';
import SermonsScreen from './src/screens/SermonsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Lazy load non-critical screens for better code splitting
const CheckInScreen = React.lazy(() => import('./src/screens/CheckInScreen'));
const EventDetailsScreen = React.lazy(() => import('./src/screens/EventDetailsScreen'));
const DevotionalScreen = React.lazy(() => import('./src/screens/DevotionalScreen'));
const GivingScreen = React.lazy(() => import('./src/screens/GivingScreen'));
const GivingHistoryScreen = React.lazy(() => import('./src/screens/GivingHistoryScreen'));
const DepartmentsScreen = React.lazy(() => import('./src/screens/DepartmentsScreen'));
const DepartmentDetailsScreen = React.lazy(() => import('./src/screens/DepartmentDetailsScreen'));
const MinistriesScreen = React.lazy(() => import('./src/screens/MinistriesScreen'));
const VolunteerScreen = React.lazy(() => import('./src/screens/VolunteerScreen'));
const DirectoryScreen = React.lazy(() => import('./src/screens/DirectoryScreen'));
const PrayerScreen = React.lazy(() => import('./src/screens/PrayerScreen'));
const MessagesScreen = React.lazy(() => import('./src/screens/MessagesScreen'));
const BibleScreen = React.lazy(() => import('./src/screens/BibleScreen'));
const SmallGroupsScreen = React.lazy(() => import('./src/screens/SmallGroupsScreen'));
const SermonNotesScreen = React.lazy(() => import('./src/screens/SermonNotesScreen'));
const SermonPlayerScreen = React.lazy(() => import('./src/screens/SermonPlayerScreen'));
const MediaGalleryScreen = React.lazy(() => import('./src/screens/MediaGalleryScreen'));
const ChurchCalendarScreen = React.lazy(() => import('./src/screens/ChurchCalendarScreen'));
const FamilyMinistryScreen = React.lazy(() => import('./src/screens/FamilyMinistryScreen'));
const MyActivityScreen = React.lazy(() => import('./src/screens/MyActivityScreen'));
const EditProfileScreen = React.lazy(() => import('./src/screens/EditProfileScreen'));
const NotificationScreen = React.lazy(() => import('./src/screens/NotificationScreen'));
const PrivacyScreen = React.lazy(() => import('./src/screens/PrivacyScreen'));
const HelpSupportScreen = React.lazy(() => import('./src/screens/HelpSupportScreen'));
const AboutScreen = React.lazy(() => import('./src/screens/AboutScreen'));
const ChatBotScreen = React.lazy(() => import('./src/screens/ChatBotScreen'));
const ResourcesScreen = React.lazy(() => import('./src/screens/ResourcesScreen'));
const DiscipleshipTrainingScreen = React.lazy(() => import('./src/screens/DiscipleshipTrainingScreen'));
const LiveStreamingScreen = React.lazy(() => import('./src/screens/LiveStreamingScreen'));
const CommunityFeedScreen = React.lazy(() => import('./src/screens/CommunityFeedScreen'));
const TestimoniesScreen = React.lazy(() => import('./src/screens/TestimoniesScreen'));
const NewsScreen = React.lazy(() => import('./src/screens/NewsScreen'));
const ArticleDetailsScreen = React.lazy(() => import('./src/screens/ArticleDetailsScreen'));
const PrayerJournalScreen = React.lazy(() => import('./src/screens/PrayerJournalScreen'));
const AddPrayerEntryScreen = React.lazy(() => import('./src/screens/AddPrayerEntryScreen'));
const PrayerEntryDetailsScreen = React.lazy(() => import('./src/screens/PrayerEntryDetailsScreen'));
const GoalsChallengesScreen = React.lazy(() => import('./src/screens/GoalsChallengesScreen'));
const AdminDashboardScreen = React.lazy(() => import('./src/screens/admin/AdminDashboardScreen'));
const ManageMembersScreen = React.lazy(() => import('./src/screens/admin/ManageMembersScreen'));
const ManageEventsScreen = React.lazy(() => import('./src/screens/admin/ManageEventsScreen'));
const ManageSermonsScreen = React.lazy(() => import('./src/screens/admin/ManageSermonsScreen'));
const ManageAnnouncementsScreen = React.lazy(() => import('./src/screens/admin/ManageAnnouncementsScreen'));
const ManageDevotionalsScreen = React.lazy(() => import('./src/screens/admin/ManageDevotionalsScreen'));
const ManageVolunteersScreen = React.lazy(() => import('./src/screens/admin/ManageVolunteersScreen'));
const MemberActivityScreen = React.lazy(() => import('./src/screens/admin/MemberActivityScreen'));
const ReportsScreen = React.lazy(() => import('./src/screens/admin/ReportsScreen'));
const ManageBannerScreen = React.lazy(() => import('./src/screens/admin/ManageBannerScreen'));
const ManageResourcesScreen = React.lazy(() => import('./src/screens/admin/ManageResourcesScreen'));
const ManageLiveStreamsScreen = React.lazy(() => import('./src/screens/admin/ManageLiveStreamsScreen'));
const ManageNewsScreen = React.lazy(() => import('./src/screens/admin/ManageNewsScreen'));
const AdminSettingsScreen = React.lazy(() => import('./src/screens/admin/AdminSettingsScreen'));
const ChurchStaffScreen = React.lazy(() => import('./src/screens/ChurchStaffScreen'));
const ManageChurchStaffScreen = React.lazy(() => import('./src/screens/admin/ManageChurchStaffScreen'));
const ManageServiceLeadersScreen = React.lazy(() => import('./src/screens/admin/ManageServiceLeadersScreen'));
const ServiceLeadersScreen = React.lazy(() => import('./src/screens/ServiceLeadersScreen'));
const ManageCourseEnrollmentsScreen = React.lazy(() => import('./src/screens/admin/ManageCourseEnrollmentsScreen'));

// Helper to create lazy screen components for React Navigation
const createLazyScreen = (lazyComponent) => {
  return (props) => (
    <Suspense fallback={<ScreenLoader />}>
      {React.createElement(lazyComponent, props)}
    </Suspense>
  );
};

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
  const [navigationReady, setNavigationReady] = useState(false);

  // Initialize Android notification channels immediately on app start
  // This MUST happen before any notifications are sent
  useEffect(() => {
    if (Platform.OS === 'android') {
      notificationService.initializeAndroidChannels().catch(error => {
        console.error('Error initializing Android notification channels:', error);
      });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      
      // Register for push notifications when user logs in
      if (user) {
        try {
          const result = await notificationService.registerForPushNotifications();
          if (!result.success && result.error) {
            if (__DEV__) {
              console.warn('Push notification registration failed on login:', result.error);
              // Don't show alert on automatic login registration - user can enable manually in settings
            }
          }
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

  // Setup notification listeners after navigation is ready and user is logged in
  useEffect(() => {
    if (user && navigationReady && navigationRef) {
      notificationService.setupNotificationListeners(navigationRef);
    }

    return () => {
      if (navigationReady) {
        notificationService.removeNotificationListeners();
      }
    };
  }, [user, navigationReady]);

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <StatusBar style="auto" />
        <NavigationContainer 
          ref={navigationRef}
          onReady={() => setNavigationReady(true)}
        >
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
              <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
              </>
            ) : (
              <>
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen name="CheckIn" component={createLazyScreen(CheckInScreen)} />
                <Stack.Screen name="EventDetails" component={createLazyScreen(EventDetailsScreen)} />
                <Stack.Screen name="Devotional" component={createLazyScreen(DevotionalScreen)} />
                <Stack.Screen name="Giving" component={createLazyScreen(GivingScreen)} />
                <Stack.Screen name="GivingHistory" component={createLazyScreen(GivingHistoryScreen)} />
                <Stack.Screen name="Departments" component={createLazyScreen(DepartmentsScreen)} />
                <Stack.Screen name="DepartmentDetails" component={createLazyScreen(DepartmentDetailsScreen)} />
                <Stack.Screen name="Ministries" component={createLazyScreen(MinistriesScreen)} />
                <Stack.Screen name="Volunteer" component={createLazyScreen(VolunteerScreen)} />
                <Stack.Screen name="Directory" component={createLazyScreen(DirectoryScreen)} />
                <Stack.Screen name="Prayer" component={createLazyScreen(PrayerScreen)} />
                <Stack.Screen name="Messages" component={createLazyScreen(MessagesScreen)} />
                <Stack.Screen name="Bible" component={createLazyScreen(BibleScreen)} />
                <Stack.Screen name="SmallGroups" component={createLazyScreen(SmallGroupsScreen)} />
                <Stack.Screen name="SermonNotes" component={createLazyScreen(SermonNotesScreen)} />
                <Stack.Screen name="SermonPlayer" component={createLazyScreen(SermonPlayerScreen)} />
                <Stack.Screen name="MediaGallery" component={createLazyScreen(MediaGalleryScreen)} />
                <Stack.Screen name="ChurchCalendar" component={createLazyScreen(ChurchCalendarScreen)} />
                <Stack.Screen name="FamilyMinistry" component={createLazyScreen(FamilyMinistryScreen)} />
                <Stack.Screen name="MyActivity" component={createLazyScreen(MyActivityScreen)} />
                <Stack.Screen name="EditProfile" component={createLazyScreen(EditProfileScreen)} />
                <Stack.Screen name="Notifications" component={createLazyScreen(NotificationScreen)} />
                <Stack.Screen name="Privacy" component={createLazyScreen(PrivacyScreen)} />
                <Stack.Screen name="HelpSupport" component={createLazyScreen(HelpSupportScreen)} />
                <Stack.Screen name="About" component={createLazyScreen(AboutScreen)} />
                <Stack.Screen name="ChatBot" component={createLazyScreen(ChatBotScreen)} />
                <Stack.Screen name="Resources" component={createLazyScreen(ResourcesScreen)} />
                <Stack.Screen name="DiscipleshipTraining" component={createLazyScreen(DiscipleshipTrainingScreen)} />
                <Stack.Screen name="LiveStreaming" component={createLazyScreen(LiveStreamingScreen)} />
                <Stack.Screen name="CommunityFeed" component={createLazyScreen(CommunityFeedScreen)} />
                <Stack.Screen name="Testimonies" component={createLazyScreen(TestimoniesScreen)} />
                <Stack.Screen name="News" component={createLazyScreen(NewsScreen)} />
                <Stack.Screen name="ArticleDetails" component={createLazyScreen(ArticleDetailsScreen)} />
                <Stack.Screen name="PrayerJournal" component={createLazyScreen(PrayerJournalScreen)} />
                <Stack.Screen name="AddPrayerEntry" component={createLazyScreen(AddPrayerEntryScreen)} />
                <Stack.Screen name="PrayerEntryDetails" component={createLazyScreen(PrayerEntryDetailsScreen)} />
                <Stack.Screen name="GoalsChallenges" component={createLazyScreen(GoalsChallengesScreen)} />
                <Stack.Screen name="AdminDashboard" component={createLazyScreen(AdminDashboardScreen)} />
                <Stack.Screen name="ManageMembers" component={createLazyScreen(ManageMembersScreen)} />
                <Stack.Screen name="ManageEvents" component={createLazyScreen(ManageEventsScreen)} />
                <Stack.Screen name="ManageSermons" component={createLazyScreen(ManageSermonsScreen)} />
                <Stack.Screen name="ManageAnnouncements" component={createLazyScreen(ManageAnnouncementsScreen)} />
                <Stack.Screen name="ManageDevotionals" component={createLazyScreen(ManageDevotionalsScreen)} />
                <Stack.Screen name="ManageVolunteers" component={createLazyScreen(ManageVolunteersScreen)} />
                <Stack.Screen name="MemberActivity" component={createLazyScreen(MemberActivityScreen)} />
                <Stack.Screen name="Reports" component={createLazyScreen(ReportsScreen)} />
                <Stack.Screen name="ManageBanner" component={createLazyScreen(ManageBannerScreen)} />
                <Stack.Screen name="ManageResources" component={createLazyScreen(ManageResourcesScreen)} />
                <Stack.Screen name="ManageLiveStreams" component={createLazyScreen(ManageLiveStreamsScreen)} />
                <Stack.Screen name="ManageNews" component={createLazyScreen(ManageNewsScreen)} />
                <Stack.Screen name="AdminSettings" component={createLazyScreen(AdminSettingsScreen)} />
                <Stack.Screen name="ChurchStaff" component={createLazyScreen(ChurchStaffScreen)} />
                <Stack.Screen name="ManageChurchStaff" component={createLazyScreen(ManageChurchStaffScreen)} />
                <Stack.Screen name="ManageServiceLeaders" component={createLazyScreen(ManageServiceLeadersScreen)} />
                <Stack.Screen name="ServiceLeaders" component={createLazyScreen(ServiceLeadersScreen)} />
                <Stack.Screen name="ManageCourseEnrollments" component={createLazyScreen(ManageCourseEnrollmentsScreen)} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
