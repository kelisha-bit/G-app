import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebase.config';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { expandRecurringEvents } from '../utils/recurringEvents';
import { cacheEvents, getCachedEvents } from '../utils/cacheService';
import { isOnline } from '../utils/networkService';
import { fetchBibleVerse } from '../utils/bibleApi';
import OfflineIndicator from '../components/OfflineIndicator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Video player component for banner
function BannerVideoPlayer({ uri, style }) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <VideoView
      player={player}
      style={style}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [userName, setUserName] = useState('');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [totalNotificationCount, setTotalNotificationCount] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [latestSermon, setLatestSermon] = useState(null);
  const [sermonLoading, setSermonLoading] = useState(true);
  const [verseOfTheDay, setVerseOfTheDay] = useState(null);
  const [verseLoading, setVerseLoading] = useState(true);
  const [bannerImageUrl, setBannerImageUrl] = useState(null);
  const [bannerMediaType, setBannerMediaType] = useState('image'); // 'image' or 'video'
  const [bannerLoading, setBannerLoading] = useState(true);

  useEffect(() => {
    loadUserName();
    loadNotificationCounts();
    loadUpcomingEvents();
    loadLatestSermon();
    loadVerseOfTheDay();
    loadBannerImage();
    
    // Set up real-time listener for unread messages
    if (auth.currentUser) {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('toUserId', '==', auth.currentUser.uid)
      );
      
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const unreadCount = snapshot.docs.filter(doc => !doc.data().read).length;
        setUnreadMessagesCount(unreadCount);
        setTotalNotificationCount(unreadCount);
      }, (error) => {
        console.error('Error listening to messages:', error);
      });

      return () => unsubscribe();
    }
  }, []);

  // Set up real-time listener for banner media changes
  useEffect(() => {
    const settingsDocRef = doc(db, 'settings', 'homeBanner');
    const unsubscribe = onSnapshot(settingsDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setBannerImageUrl(data.imageUrl || null);
        setBannerMediaType(data.mediaType || 'image');
      } else {
        setBannerImageUrl(null);
        setBannerMediaType('image');
      }
      setBannerLoading(false);
    }, (error) => {
      console.error('Error listening to banner media:', error);
      setBannerLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadBannerImage = async () => {
    try {
      setBannerLoading(true);
      const settingsDoc = await getDoc(doc(db, 'settings', 'homeBanner'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setBannerImageUrl(data.imageUrl || null);
        setBannerMediaType(data.mediaType || 'image');
      } else {
        setBannerImageUrl(null);
        setBannerMediaType('image');
      }
    } catch (error) {
      console.error('Error loading banner media:', error);
      // If permission error, just set to null (user might not have read access)
      if (error.code === 'permission-denied') {
        setBannerImageUrl(null);
        setBannerMediaType('image');
      } else {
        setBannerImageUrl(null);
        setBannerMediaType('image');
      }
    } finally {
      setBannerLoading(false);
    }
  };

  const loadUserName = async () => {
    if (auth.currentUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserName(userDoc.data().displayName || auth.currentUser.displayName || 'Member');
        } else {
          setUserName(auth.currentUser.displayName || 'Member');
        }
      } catch (error) {
        console.error('Error loading user name:', error);
        setUserName(auth.currentUser.displayName || 'Member');
      }
    }
  };

  const loadNotificationCounts = async () => {
    if (!auth.currentUser) return;
    
    try {
      // Load unread messages count
      const messagesQuery = query(
        collection(db, 'messages'),
        where('toUserId', '==', auth.currentUser.uid)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      const unreadCount = messagesSnapshot.docs.filter(doc => !doc.data().read).length;
      
      setUnreadMessagesCount(unreadCount);
      setTotalNotificationCount(unreadCount);
    } catch (error) {
      console.error('Error loading notification counts:', error);
    }
  };

  const loadLatestSermon = async () => {
    try {
      setSermonLoading(true);
      const sermonsQuery = query(
        collection(db, 'sermons'),
        orderBy('date', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(sermonsQuery);
      
      if (!snapshot.empty) {
        const sermonData = snapshot.docs[0].data();
        setLatestSermon({
          id: snapshot.docs[0].id,
          ...sermonData,
        });
      } else {
        setLatestSermon(null);
      }
    } catch (error) {
      console.error('Error loading latest sermon:', error);
      setLatestSermon(null);
    } finally {
      setSermonLoading(false);
    }
  };

  const loadVerseOfTheDay = async () => {
    try {
      setVerseLoading(true);
      // Get verse based on day of year (1-365)
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
      const verses = [
        'John 3:16',
        'Jeremiah 29:11',
        'Philippians 4:13',
        'Romans 8:28',
        'Proverbs 3:5-6',
        'Isaiah 40:31',
        'Matthew 28:20',
        'Psalm 23:1',
        '1 Corinthians 13:4-7',
        'Ephesians 2:8-9',
      ];
      const verseRef = verses[dayOfYear % verses.length];
      
      const result = await fetchBibleVerse(verseRef);
      if (!result.error) {
        setVerseOfTheDay(result);
      }
    } catch (error) {
      console.error('Error loading verse of the day:', error);
    } finally {
      setVerseLoading(false);
    }
  };

  const handleSermonPress = async () => {
    if (!latestSermon) {
      navigation.navigate('Sermons');
      return;
    }

    // Try video first, then audio
    const url = latestSermon.videoUrl || latestSermon.audioUrl;
    
    if (url) {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Cannot open this URL');
        }
      } catch (error) {
        console.error('Error opening URL:', error);
        Alert.alert('Error', 'Failed to open sermon');
      }
    } else {
      // No media URL, navigate to sermons screen
      navigation.navigate('Sermons');
    }
  };

  const loadUpcomingEvents = async () => {
    try {
      setEventsLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0];

      const online = await isOnline();
      let events = [];

      if (online) {
        // Try to load from Firebase
        try {
          let querySnapshot;
          
          try {
            // Try query with orderBy first (requires index)
            const eventsQuery = query(
              collection(db, 'events'),
              orderBy('date', 'asc')
            );
            querySnapshot = await getDocs(eventsQuery);
          } catch (orderByError) {
            // Fallback: get all events and filter/sort in memory
            console.log('OrderBy query failed, using fallback:', orderByError);
            const allEventsQuery = query(collection(db, 'events'));
            querySnapshot = await getDocs(allEventsQuery);
          }

          querySnapshot.forEach((doc) => {
            const eventData = doc.data();
            events.push({
              id: doc.id,
              ...eventData,
            });
          });

          // Cache the events for offline use
          await cacheEvents(events);
        } catch (error) {
          console.error('Error loading events from Firebase:', error);
          // Fall back to cached data
          const cachedEvents = await getCachedEvents(true); // Allow expired cache
          if (cachedEvents) {
            events = cachedEvents;
          }
        }
      } else {
        // Offline: Load from cache
        console.log('Offline: Loading events from cache');
        const cachedEvents = await getCachedEvents(true); // Allow expired cache
        if (cachedEvents) {
          events = cachedEvents;
        }
      }

      // Expand recurring events into instances
      const expandedEvents = expandRecurringEvents(events, 12);

      // Filter for upcoming events (from today onwards)
      const upcomingEvents = expandedEvents.filter(event => {
        const eventDate = event.date;
        return eventDate && eventDate >= todayString;
      });

      // Sort by date and time to ensure proper ordering
      upcomingEvents.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
        return dateA - dateB;
      });

      // Limit to 3 for display
      setUpcomingEvents(upcomingEvents.slice(0, 3));
    } catch (error) {
      console.error('Error loading upcoming events:', error);
      // Try to load from cache as last resort
      try {
        const cachedEvents = await getCachedEvents(true);
        if (cachedEvents) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayString = today.toISOString().split('T')[0];
          const expandedEvents = expandRecurringEvents(cachedEvents, 12);
          const upcomingEvents = expandedEvents
            .filter(event => event.date && event.date >= todayString)
            .sort((a, b) => {
              const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
              const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
              return dateA - dateB;
            })
            .slice(0, 3);
          setUpcomingEvents(upcomingEvents);
        } else {
          setUpcomingEvents([]);
        }
      } catch (cacheError) {
        setUpcomingEvents([]);
      }
    } finally {
      setEventsLoading(false);
    }
  };

  const formatEventDate = (dateString, timeString) => {
    if (!dateString) return 'Date TBA';
    
    try {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Check if it's today
      if (date.toDateString() === today.toDateString()) {
        return timeString ? `Today, ${timeString}` : 'Today';
      }
      
      // Check if it's tomorrow
      if (date.toDateString() === tomorrow.toDateString()) {
        return timeString ? `Tomorrow, ${timeString}` : 'Tomorrow';
      }
      
      // Check if it's this week
      const daysDiff = Math.floor((date - today) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 0 && daysDiff < 7) {
        const dayName = dayNames[date.getDay()];
        return timeString ? `${dayName}, ${timeString}` : dayName;
      }
      
      // Otherwise show date
      const dayName = dayNames[date.getDay()];
      const month = monthNames[date.getMonth()];
      const day = date.getDate();
      return timeString 
        ? `${dayName}, ${month} ${day} • ${timeString}`
        : `${dayName}, ${month} ${day}`;
    } catch (error) {
      return dateString;
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      Worship: 'musical-notes',
      Youth: 'people',
      Prayer: 'hand-left',
      Outreach: 'heart',
      Conference: 'business',
      Other: 'calendar',
    };
    return icons[category] || 'calendar';
  };

  const quickActions = [
    { id: 1, title: 'Check In', icon: 'checkbox-outline', color: '#10b981', screen: 'CheckIn' },
    { id: 2, title: 'Events', icon: 'calendar', color: '#f59e0b', screen: 'Events' },
    { id: 3, title: 'Calendar', icon: 'calendar-outline', color: '#6366f1', screen: 'ChurchCalendar' },
    { id: 4, title: 'Bible', icon: 'book-outline', color: '#6366f1', screen: 'Bible' },
    { id: 5, title: 'Give', icon: 'heart', color: '#ef4444', screen: 'Giving' },
    { id: 6, title: 'Prayer', icon: 'hand-left', color: '#8b5cf6', screen: 'Prayer' },
    { id: 7, title: 'Devotional', icon: 'book', color: '#06b6d4', screen: 'Devotional' },
    { id: 8, title: 'Small Groups', icon: 'people-circle', color: '#14b8a6', screen: 'SmallGroups' },
    { id: 9, title: 'Gallery', icon: 'images', color: '#ec4899', screen: 'MediaGallery' },
    { id: 10, title: 'Family', icon: 'people-circle', color: '#f59e0b', screen: 'FamilyMinistry' },
    { id: 11, title: 'Directory', icon: 'people', color: '#8b5cf6', screen: 'Directory' },
    { id: 12, title: 'Volunteer', icon: 'hand-right', color: '#f59e0b', screen: 'Volunteer' },
    { id: 13, title: 'Messages', icon: 'chatbubbles', color: '#6366f1', screen: 'Messages' },
    { id: 14, title: 'Resources', icon: 'library', color: '#f59e0b', screen: 'Resources' },
  ];

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 30, 50) }}
      showsVerticalScrollIndicator={false}
    >
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* Header */}
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Messages')}
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            {totalNotificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>
                  {totalNotificationCount > 99 ? '99+' : totalNotificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Hero Banner Section */}
      <View style={styles.bannerContainer}>
        {bannerLoading ? (
          <View style={[styles.banner, styles.bannerPlaceholder]}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : bannerImageUrl ? (
          bannerMediaType === 'video' ? (
            <BannerVideoPlayer uri={bannerImageUrl} style={styles.bannerImage} />
          ) : (
            <Image 
              source={{ uri: bannerImageUrl }} 
              style={styles.bannerImage}
              resizeMode="cover"
            />
          )
        ) : (
          <View style={[styles.banner, styles.bannerPlaceholder]}>
            <LinearGradient
              colors={['#ec4899', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bannerGradient}
            >
              <View style={styles.bannerContent}>
                <Image 
                  source={require('../../assets/icon.png')} 
                  style={styles.bannerLogo}
                  resizeMode="contain"
                />
                <View style={styles.bannerText}>
                  <Text style={styles.bannerTitle}>Greater Works City Church</Text>
                  <Text style={styles.bannerSubtitle}>Building Faith, Changing Lives</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}
      </View>

      {/* Verse of the Day */}
      {verseOfTheDay && (
        <TouchableOpacity
          style={styles.verseCard}
          onPress={() => navigation.navigate('Bible')}
          activeOpacity={0.8}
        >
          <View style={styles.verseHeader}>
            <Ionicons name="sunny" size={20} color="#f59e0b" />
            <Text style={styles.verseTitle}>Verse of the Day</Text>
          </View>
          <Text style={styles.verseText} numberOfLines={2}>
            "{verseOfTheDay.text}"
          </Text>
          <Text style={styles.verseReference}>- {verseOfTheDay.reference}</Text>
          <View style={styles.verseFooter}>
            <Text style={styles.verseLink}>Tap to read more</Text>
            <Ionicons name="chevron-forward" size={16} color="#6366f1" />
          </View>
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionCard}
              onPress={() => navigation.navigate(action.screen)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon} size={28} color="#fff" />
                {action.screen === 'Messages' && unreadMessagesCount > 0 && (
                  <View style={styles.quickActionBadge}>
                    <Text style={styles.quickActionBadgeText}>
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.quickActionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Upcoming Events */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Events')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {eventsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : upcomingEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No upcoming events</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('Events')}
            >
              <Text style={styles.emptyButtonText}>View All Events</Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcomingEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
              activeOpacity={0.7}
            >
              <View style={styles.eventIconContainer}>
                <Ionicons
                  name={getCategoryIcon(event.category)}
                  size={24}
                  color="#6366f1"
                />
              </View>
              <View style={styles.eventDetails}>
                <Text style={styles.eventTitle}>{event.title || 'Untitled Event'}</Text>
                <Text style={styles.eventDate}>
                  {formatEventDate(event.date, event.time)}
                </Text>
                {event.location && (
                  <View style={styles.eventLocationRow}>
                    <Ionicons name="location-outline" size={14} color="#9ca3af" />
                    <Text style={styles.eventLocation}>{event.location}</Text>
                  </View>
                )}
                {event.category && (
                  <View style={styles.eventCategoryBadge}>
                    <Text style={styles.eventCategoryText}>{event.category}</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={24} color="#ccc" />
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Departments & Ministries */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Church Organizations</Text>
        <Text style={styles.sectionSubtitle}>
          Departments: Service teams • Ministries: Life-stage groups (Youth, Men, Women, etc.)
        </Text>
        <View style={styles.departmentsRow}>
          <TouchableOpacity
            style={styles.departmentCard}
            onPress={() => navigation.navigate('Departments')}
          >
            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.departmentGradient}>
              <Ionicons name="business" size={32} color="#fff" />
              <Text style={styles.departmentText}>Departments</Text>
              <Text style={styles.departmentSubtext}>Service Teams</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.departmentCard}
            onPress={() => navigation.navigate('Ministries')}
          >
            <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.departmentGradient}>
              <Ionicons name="business" size={32} color="#fff" />
              <Text style={styles.departmentText}>Ministries</Text>
              <Text style={styles.departmentSubtext}>Life-Stage Groups</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Latest Sermon */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Sermon</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Sermons')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {sermonLoading ? (
          <View style={styles.sermonCard}>
            <View style={styles.sermonLoadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.sermonLoadingText}>Loading sermon...</Text>
            </View>
          </View>
        ) : latestSermon ? (
          <TouchableOpacity 
            style={styles.sermonCard}
            onPress={handleSermonPress}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: latestSermon.image || 'https://via.placeholder.com/400x200' }}
              style={styles.sermonImage}
            />
            <View style={styles.sermonOverlay}>
              <View style={styles.playButton}>
                <Ionicons 
                  name={latestSermon.videoUrl ? "play" : latestSermon.audioUrl ? "headset" : "play"} 
                  size={30} 
                  color="#fff" 
                />
              </View>
            </View>
            {latestSermon.duration && (
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{latestSermon.duration}</Text>
              </View>
            )}
            <View style={styles.sermonInfo}>
              <Text style={styles.sermonTitle}>{latestSermon.title || 'Untitled Sermon'}</Text>
              <Text style={styles.sermonPastor}>{latestSermon.pastor || 'Speaker not specified'}</Text>
              {latestSermon.date && (
                <Text style={styles.sermonDate}>
                  {new Date(latestSermon.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.sermonCard}>
            <View style={styles.sermonEmptyContainer}>
              <Ionicons name="videocam-outline" size={48} color="#d1d5db" />
              <Text style={styles.sermonEmptyText}>No sermons available</Text>
              <Text style={styles.sermonEmptySubtext}>Check back later for new sermons</Text>
            </View>
          </View>
        )}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  quickActionBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  quickActionBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bannerContainer: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  banner: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  bannerPlaceholder: {
    backgroundColor: '#e5e7eb',
  },
  bannerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerLogo: {
    width: 50,
    height: 50,
  },
  bannerText: {
    marginLeft: 15,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  verseCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  verseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
    marginLeft: 8,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1f2937',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  verseReference: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    textAlign: 'right',
    marginBottom: 10,
  },
  verseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  verseLink: {
    fontSize: 12,
    color: '#6366f1',
    marginRight: 5,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 18,
  },
  seeAll: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  quickActionCard: {
    width: (width - 60) / 4,
    alignItems: 'center',
    marginBottom: 20,
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#4b5563',
    textAlign: 'center',
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#6366f1',
    marginBottom: 4,
    fontWeight: '600',
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventLocation: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  eventCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  eventCategoryText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginTop: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  departmentsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  departmentCard: {
    width: (width - 50) / 2,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  departmentGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  departmentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  departmentSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontWeight: '500',
  },
  sermonCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sermonImage: {
    width: '100%',
    height: 200,
  },
  sermonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sermonInfo: {
    padding: 15,
  },
  sermonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  sermonPastor: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  sermonDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 80,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sermonLoadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  sermonLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  sermonEmptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  sermonEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 4,
  },
  sermonEmptySubtext: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

