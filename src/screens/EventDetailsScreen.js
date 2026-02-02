import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebase.config';
import { doc, getDoc, updateDoc, increment, collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { formatRecurrencePattern, getDayName } from '../utils/recurringEvents';
import { fetchWeatherForecast, getWeatherIconUrl, extractCityFromLocation } from '../utils/weatherApi';
import notificationService from '../utils/notificationService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EventDetailsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { eventId } = route?.params || {};
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadEventDetails();
  }, []);

  useEffect(() => {
    if (event) {
      checkRegistrationStatus();
      loadRegistrations();
    }
  }, [event]);

  useEffect(() => {
    if (event && event.date) {
      loadWeather();
      // Schedule event reminders if user has event reminders enabled
      scheduleEventReminders();
    }
  }, [event]);

  const scheduleEventReminders = async () => {
    try {
      // Check user's notification settings
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const settings = userData.notificationSettings || {};
        
        // Only schedule if event reminders are enabled
        if (settings.eventReminders && settings.pushNotifications) {
          await notificationService.scheduleEventReminder(event);
        }
      }
    } catch (error) {
      console.error('Error scheduling event reminders:', error);
    }
  };

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      
      if (!eventId) {
        Alert.alert('Error', 'Event ID is missing');
        navigation.goBack();
        return;
      }
      
      // Check if this is a recurring event instance (ID format: originalEventId_date)
      let actualEventId = eventId;
      let instanceDate = null;
      
      if (eventId.includes('_')) {
        // Split the ID to get the original event ID and the instance date
        const parts = eventId.split('_');
        // The date is the last part (YYYY-MM-DD format)
        const potentialDate = parts[parts.length - 1];
        // Validate that the last part is a date in YYYY-MM-DD format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(potentialDate)) {
          instanceDate = potentialDate;
          // The original event ID is everything before the last underscore
          actualEventId = parts.slice(0, -1).join('_');
        }
      }
      
      const eventDoc = await getDoc(doc(db, 'events', actualEventId));
      
      if (eventDoc.exists()) {
        const eventData = { id: eventDoc.id, ...eventDoc.data() };
        
        // If this is a recurring instance, update the date and add instance flags
        if (instanceDate) {
          eventData.originalDate = eventData.date; // Preserve original template date
          eventData.date = instanceDate;
          eventData.isRecurringInstance = true;
          eventData.recurringEventId = actualEventId;
        }
        
        setEvent(eventData);
      } else {
        Alert.alert('Error', 'Event not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading event:', error);
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    if (!auth.currentUser || !event) return;
    
    try {
      const registrationsQuery = query(
        collection(db, 'eventRegistrations'),
        where('eventId', '==', event.id),
        where('userId', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(registrationsQuery);
      setIsRegistered(!snapshot.empty);
    } catch (error) {
      console.error('Error checking registration status:', error);
      setIsRegistered(false);
    }
  };

  const loadRegistrations = async () => {
    if (!event) return;
    
    try {
      setLoadingRegistrations(true);
      const registrationsQuery = query(
        collection(db, 'eventRegistrations'),
        where('eventId', '==', event.id),
        orderBy('registeredAt', 'desc')
      );
      const snapshot = await getDocs(registrationsQuery);
      const registrationsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRegistrations(registrationsData);
    } catch (error) {
      console.error('Error loading registrations:', error);
      // If orderBy fails due to missing index, try without it
      try {
        const registrationsQuery = query(
          collection(db, 'eventRegistrations'),
          where('eventId', '==', event.id)
        );
        const snapshot = await getDocs(registrationsQuery);
        const registrationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort in memory
        registrationsData.sort((a, b) => {
          const dateA = a.registeredAt?.toDate?.() || new Date(a.registeredAt || 0);
          const dateB = b.registeredAt?.toDate?.() || new Date(b.registeredAt || 0);
          return dateB - dateA;
        });
        setRegistrations(registrationsData);
      } catch (fallbackError) {
        console.error('Error loading registrations (fallback):', fallbackError);
        setRegistrations([]);
      }
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleRegister = async () => {
    if (!auth.currentUser) {
      if (Platform.OS === 'web') {
        window.alert('Please login to register for events');
      } else {
        Alert.alert('Login Required', 'Please login to register for events');
      }
      return;
    }

    // Web-compatible confirmation
    const confirmRegistration = async () => {
      try {
        setRegistering(true);

        // Add registration to Firestore
        await addDoc(collection(db, 'eventRegistrations'), {
          eventId: event.id,
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName || 'User',
          userEmail: auth.currentUser.email,
          registeredAt: new Date().toISOString(),
        });

        // Increment registration count
        const eventRef = doc(db, 'events', event.id);
        await updateDoc(eventRef, {
          registrations: increment(1),
        });

        setIsRegistered(true);
        if (Platform.OS === 'web') {
          window.alert('Success! You have been registered for this event!');
        } else {
          Alert.alert('Success', 'You have been registered for this event!');
        }
        await loadEventDetails(); // Reload to get updated count
        await loadRegistrations(); // Reload registrations list
        await checkRegistrationStatus(); // Update registration status
      } catch (error) {
        console.error('Error registering:', error);
        if (Platform.OS === 'web') {
          window.alert('Failed to register. Please try again.');
        } else {
          Alert.alert('Error', 'Failed to register. Please try again.');
        }
      } finally {
        setRegistering(false);
      }
    };

    // Platform-specific confirmation dialog
    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to register for ${event?.title}?`)) {
        confirmRegistration();
      }
    } else {
      Alert.alert(
        'Confirm Registration',
        `Are you sure you want to register for ${event?.title}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Register',
            onPress: confirmRegistration,
          },
        ]
      );
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      Worship: '#8b5cf6',
      Youth: '#f59e0b',
      Prayer: '#ec4899',
      Outreach: '#10b981',
      Conference: '#3b82f6',
      Other: '#6b7280',
    };
    return colors[category] || '#6b7280';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateRange = (event) => {
    if (event.isMultiDay && event.endDate) {
      const startDate = formatDate(event.date);
      const endDate = formatDate(event.endDate);
      return `${startDate} - ${endDate}`;
    }
    return formatDate(event.date);
  };

  const formatRegistrationDate = (dateValue) => {
    let date;
    if (dateValue?.toDate) {
      // Firestore Timestamp
      date = dateValue.toDate();
    } else if (dateValue) {
      // ISO string or Date object
      date = new Date(dateValue);
    } else {
      return 'recently';
    }

    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 1) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const loadWeather = async () => {
    if (!event || !event.date || !event.location) return;

    try {
      setLoadingWeather(true);
      const city = extractCityFromLocation(event.location);
      const result = await fetchWeatherForecast(city, event.date);

      if (!result.error) {
        setWeather(result);
      } else {
        // Only set weather to null if it's not a configuration error
        // (configuration errors are expected and shouldn't show as failures)
        if (typeof result.error === 'string' && !result.error.includes('API key not configured')) {
          setWeather(null);
        } else if (typeof result.error !== 'string') {
          // If error is not a string, set weather to null
          setWeather(null);
        }
      }
    } catch (error) {
      // Only log unexpected errors (not API key issues, which are expected if not configured)
      if (!error.message?.includes('Invalid API key') && !error.message?.includes('API key not configured')) {
        console.error('Error loading weather:', error);
      }
      setWeather(null);
    } finally {
      setLoadingWeather(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
        <Text style={styles.emptyText}>Event not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hero Image with Back Button */}
      <View style={styles.heroSection}>
        {event.image ? (
          <Image 
            source={{ uri: event.image }} 
            style={styles.heroImage}
          />
        ) : (
          <View style={[styles.heroImage, { backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="calendar" size={64} color="#fff" />
          </View>
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={styles.heroOverlay}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
        
        {/* Category Badge */}
        <View style={[styles.categoryBadgeHero, { backgroundColor: getCategoryColor(event.category) }]}>
          <Text style={styles.categoryBadgeTextHero}>{event.category}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 100, 120) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Title */}
        <Text style={styles.eventTitle}>{event.title}</Text>

        {/* Quick Info Cards */}
        <View style={styles.infoCards}>
          <View style={styles.infoCard}>
            <Ionicons name="calendar" size={24} color="#6366f1" />
            <Text style={styles.infoCardLabel}>Date</Text>
            <Text style={styles.infoCardValue} numberOfLines={2}>
              {formatDateRange(event)}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="time" size={24} color="#10b981" />
            <Text style={styles.infoCardLabel}>Time</Text>
            <Text style={styles.infoCardValue}>{event.time}</Text>
          </View>
        </View>

        <View style={styles.infoCards}>
          <View style={styles.infoCard}>
            <Ionicons name="location" size={24} color="#ef4444" />
            <Text style={styles.infoCardLabel}>Location</Text>
            <Text style={styles.infoCardValue}>{event.location}</Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="people" size={24} color="#8b5cf6" />
            <Text style={styles.infoCardLabel}>Registered</Text>
            <Text style={styles.infoCardValue}>{registrations.length || 0}</Text>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About This Event</Text>
          <Text style={styles.description}>
            {event.description || 'No description available.'}
          </Text>
        </View>

        {/* Event Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Details</Text>
          
          {event.isRecurringInstance && event.recurringEventId && (
            <View style={styles.detailRow}>
              <Ionicons name="repeat-outline" size={20} color="#6366f1" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Recurrence</Text>
                <Text style={styles.detailValue}>This is a recurring event</Text>
              </View>
            </View>
          )}

          {event.isRecurring && event.recurrencePattern && (
            <View style={styles.detailRow}>
              <Ionicons name="repeat-outline" size={20} color="#6366f1" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Recurrence Pattern</Text>
                <Text style={styles.detailValue}>
                  {formatRecurrencePattern(event.recurrencePattern)}
                  {event.recurrencePattern.endDate 
                    ? ` (until ${new Date(event.recurrencePattern.endDate).toLocaleDateString()})`
                    : ' (Ongoing)'}
                </Text>
              </View>
            </View>
          )}

          {event.isMultiDay && (
            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={20} color="#6366f1" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Event Duration</Text>
                <Text style={styles.detailValue}>Multi-day event</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color="#6b7280" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDateRange(event)}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color="#6b7280" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{event.time}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color="#6b7280" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{event.location}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="pricetag-outline" size={20} color="#6b7280" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{event.category}</Text>
            </View>
          </View>
        </View>

        {/* Weather Forecast */}
        {weather && !weather.error && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weather Forecast</Text>
            <View style={styles.weatherCard}>
              <View style={styles.weatherHeader}>
                <View style={styles.weatherInfo}>
                  {weather.icon && (
                    <Image
                      source={{ uri: getWeatherIconUrl(weather.icon) }}
                      style={styles.weatherIcon}
                    />
                  )}
                  <View style={styles.weatherTemp}>
                    <Text style={styles.weatherTempValue}>{weather.temp}°C</Text>
                    <Text style={styles.weatherDescription}>
                      {weather.description.charAt(0).toUpperCase() + weather.description.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
              {weather.humidity !== undefined && (
                <View style={styles.weatherDetails}>
                  <View style={styles.weatherDetailItem}>
                    <Ionicons name="water-outline" size={16} color="#06b6d4" />
                    <Text style={styles.weatherDetailText}>{weather.humidity}% humidity</Text>
                  </View>
                  {weather.windSpeed > 0 && (
                    <View style={styles.weatherDetailItem}>
                      <Ionicons name="leaf-outline" size={16} color="#06b6d4" />
                      <Text style={styles.weatherDetailText}>{weather.windSpeed.toFixed(1)} m/s wind</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {loadingWeather && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weather Forecast</Text>
            <View style={styles.weatherCard}>
              <ActivityIndicator size="small" color="#6366f1" />
              <Text style={styles.weatherLoadingText}>Loading weather...</Text>
            </View>
          </View>
        )}

        {weather && weather.error && !weather.error.includes('API key not configured') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weather Forecast</Text>
            <View style={styles.weatherCard}>
              <Ionicons name="cloud-offline-outline" size={24} color="#9ca3af" />
              <Text style={styles.weatherErrorText}>Weather unavailable</Text>
            </View>
          </View>
        )}

        {/* Registration Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registration Information</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={32} color="#6366f1" />
              <Text style={styles.statValue}>{registrations.length || 0}</Text>
              <Text style={styles.statLabel}>Registered</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={32} color="#10b981" />
              <Text style={styles.statValue}>Open</Text>
              <Text style={styles.statLabel}>Status</Text>
            </View>
          </View>
        </View>

        {/* Registered Users List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registered Attendees</Text>
          {loadingRegistrations ? (
            <View style={styles.registrationsLoadingContainer}>
              <ActivityIndicator size="small" color="#6366f1" />
              <Text style={styles.registrationsLoadingText}>Loading attendees...</Text>
            </View>
          ) : registrations.length === 0 ? (
            <View style={styles.emptyRegistrationsContainer}>
              <Ionicons name="people-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyRegistrationsText}>No registrations yet</Text>
              <Text style={styles.emptyRegistrationsSubtext}>Be the first to register for this event!</Text>
            </View>
          ) : (
            <View style={styles.registrationsList}>
              {registrations.map((registration, index) => (
                <View key={registration.id || index} style={styles.registrationItem}>
                  <View style={styles.registrationAvatar}>
                    <Text style={styles.registrationAvatarText}>
                      {registration.userName?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View style={styles.registrationInfo}>
                    <Text style={styles.registrationName}>
                      {registration.userName || 'Anonymous User'}
                    </Text>
                    <Text style={styles.registrationEmail}>
                      {registration.userEmail || 'No email'}
                    </Text>
                    {registration.registeredAt && (
                      <Text style={styles.registrationDate}>
                        Registered {formatRegistrationDate(registration.registeredAt)}
                      </Text>
                    )}
                  </View>
                  {auth.currentUser && registration.userId === auth.currentUser.uid && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>You</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      {/* Fixed Bottom Register Button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 15) }]}>
        {isRegistered ? (
          <TouchableOpacity style={styles.registeredButton} disabled>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <Text style={styles.registeredButtonText}>Already Registered</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={registering}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.registerButtonGradient}
              pointerEvents="none"
            >
              {registering ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.registerButtonText}>Register for Event</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
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
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#9ca3af',
  },
  heroSection: {
    position: 'relative',
    height: 300,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadgeHero: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryBadgeTextHero: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 20,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 20,
    lineHeight: 36,
  },
  infoCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoCardLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  detailContent: {
    marginLeft: 15,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
    ...(Platform.OS === 'web' && {
      position: 'fixed',
    }),
  },
  registerButton: {
    borderRadius: 15,
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      userSelect: 'none',
      WebkitUserSelect: 'none',
    }),
  },
  registerButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  registeredButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  registeredButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
    marginLeft: 10,
  },
  weatherCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  weatherHeader: {
    width: '100%',
    marginBottom: 15,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherIcon: {
    width: 64,
    height: 64,
    marginRight: 15,
  },
  weatherTemp: {
    alignItems: 'flex-start',
  },
  weatherTempValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  weatherDescription: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    width: '100%',
  },
  weatherDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherDetailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  weatherLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#9ca3af',
  },
  weatherErrorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af',
  },
  registrationsLoadingContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  registrationsLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyRegistrationsContainer: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 15,
    alignItems: 'center',
  },
  emptyRegistrationsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 15,
  },
  emptyRegistrationsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  registrationsList: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
  },
  registrationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  registrationAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  registrationAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  registrationInfo: {
    flex: 1,
  },
  registrationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  registrationEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  registrationDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  youBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  youBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});



