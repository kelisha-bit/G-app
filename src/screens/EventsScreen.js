import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { expandRecurringEvents } from '../utils/recurringEvents';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EventsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('upcoming'); // upcoming, past, all

  const categories = ['All', 'Worship', 'Youth', 'Prayer', 'Outreach', 'Conference', 'Other'];

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, selectedCategory, searchQuery, viewMode]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsQuery = query(collection(db, 'events'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(eventsQuery);
      const eventsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Expand recurring events into instances
      const expandedEvents = expandRecurringEvents(eventsData, 12); // Generate 12 weeks ahead
      setEvents(expandedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      // Sample data for testing
      setEvents([
        {
          id: '1',
          title: 'Sunday Worship Service',
          date: '2025-01-12',
          time: '9:00 AM',
          location: 'Main Sanctuary',
          category: 'Worship',
          description: 'Join us for a powerful worship experience with praise, worship, and the Word of God.',
          image: 'https://via.placeholder.com/400x200',
          registrations: 856,
        },
        {
          id: '2',
          title: 'Youth Conference 2025',
          date: '2025-01-20',
          time: '5:00 PM',
          location: 'Youth Center',
          category: 'Youth',
          description: 'Annual youth gathering with special guest speakers, worship, and fellowship.',
          image: 'https://via.placeholder.com/400x200',
          registrations: 120,
        },
        {
          id: '3',
          title: 'Prayer & Fasting',
          date: '2025-01-15',
          time: '6:00 AM',
          location: 'Prayer Room',
          category: 'Prayer',
          description: '21 days of prayer and fasting for breakthrough and spiritual growth.',
          image: 'https://via.placeholder.com/400x200',
          registrations: 200,
        },
        {
          id: '4',
          title: 'Community Outreach',
          date: '2025-01-25',
          time: '10:00 AM',
          location: 'Community Center',
          category: 'Outreach',
          description: 'Serving our community with love and compassion. Bring food and supplies.',
          image: 'https://via.placeholder.com/400x200',
          registrations: 85,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const filterEvents = () => {
    let filtered = events;

    // Filter by view mode (upcoming/past/all)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (viewMode === 'upcoming') {
      filtered = filtered.filter(event => new Date(event.date) >= today);
    } else if (viewMode === 'past') {
      filtered = filtered.filter(event => new Date(event.date) < today);
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
      );
    }

    setFilteredEvents(filtered);
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isUpcoming = (dateString) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  };

  const renderEventCard = (event) => (
    <TouchableOpacity 
      key={event.id} 
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: event.image || 'https://via.placeholder.com/400x200' }} 
        style={styles.eventImage} 
      />
      
      {/* Status Badge */}
      {event.isRecurringInstance && (
        <View style={styles.recurringBadge}>
          <Ionicons name="repeat" size={12} color="#fff" />
          <Text style={styles.badgeText}>Recurring</Text>
        </View>
      )}
      {!event.isRecurringInstance && isUpcoming(event.date) ? (
        <View style={styles.upcomingBadge}>
          <Ionicons name="time" size={12} color="#fff" />
          <Text style={styles.badgeText}>Upcoming</Text>
        </View>
      ) : !event.isRecurringInstance ? (
        <View style={styles.pastBadge}>
          <Text style={styles.badgeText}>Past Event</Text>
        </View>
      ) : null}

      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(event.category) + '20' }]}>
            <Text style={[styles.categoryBadgeText, { color: getCategoryColor(event.category) }]}>
              {event.category}
            </Text>
          </View>
        </View>

        <Text style={styles.eventDescription} numberOfLines={2}>
          {event.description}
        </Text>

        <View style={styles.eventDetails}>
          <View style={styles.eventDetailItem}>
            <Ionicons name="calendar" size={16} color="#6366f1" />
            <Text style={styles.eventDetailText}>{formatDate(event.date)}</Text>
          </View>
          <View style={styles.eventDetailItem}>
            <Ionicons name="time" size={16} color="#6366f1" />
            <Text style={styles.eventDetailText}>{event.time}</Text>
          </View>
        </View>

        <View style={styles.eventFooter}>
          <View style={styles.eventDetailItem}>
            <Ionicons name="location" size={16} color="#6b7280" />
            <Text style={styles.eventDetailText}>{event.location}</Text>
          </View>
          <View style={styles.registrationInfo}>
            <Ionicons name="people" size={16} color="#10b981" />
            <Text style={styles.registrationText}>{event.registrations || 0} registered</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.registerButton}
          onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
        >
          <Text style={styles.registerButtonText}>View Details</Text>
          <Ionicons name="arrow-forward" size={16} color="#6366f1" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Events</Text>
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={() => navigation.navigate('ChurchCalendar')}
          >
            <Ionicons name="calendar-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Stay connected with church activities</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* View Mode Selector */}
      <View style={styles.viewModeContainer}>
        {[
          { id: 'upcoming', label: 'Upcoming', icon: 'calendar' },
          { id: 'all', label: 'All Events', icon: 'list' },
          { id: 'past', label: 'Past', icon: 'time' },
        ].map((mode) => (
          <TouchableOpacity
            key={mode.id}
            style={[styles.viewModeButton, viewMode === mode.id && styles.viewModeButtonActive]}
            onPress={() => setViewMode(mode.id)}
          >
            <Ionicons 
              name={mode.icon} 
              size={18} 
              color={viewMode === mode.id ? '#fff' : '#6b7280'} 
            />
            <Text style={[styles.viewModeText, viewMode === mode.id && styles.viewModeTextActive]}>
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextSelected,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Events List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#6366f1']} />
          }
        >
          {/* Results Count */}
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsText}>
              {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
            </Text>
          </View>

          {filteredEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No events found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try a different search term' : 'Check back later for upcoming events'}
              </Text>
            </View>
          ) : (
            filteredEvents.map(renderEventCard)
          )}
          
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  calendarButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 10,
  },
  viewModeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'space-between',
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  viewModeButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  viewModeText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
    marginLeft: 6,
  },
  viewModeTextActive: {
    color: '#fff',
  },
  categoriesContainer: {
    paddingVertical: 10,
    paddingLeft: 20,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryChipSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  resultsText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eventImage: {
    width: '100%',
    height: 200,
  },
  upcomingBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pastBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#6b7280',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recurringBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  eventContent: {
    padding: 15,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 10,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  eventDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 15,
    lineHeight: 20,
  },
  eventDetails: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  eventDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 6,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginBottom: 12,
  },
  registrationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registrationText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
    marginLeft: 6,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    paddingVertical: 12,
    borderRadius: 12,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginRight: 5,
  },
});
