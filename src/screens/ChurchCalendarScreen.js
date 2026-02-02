import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { expandRecurringEvents } from '../utils/recurringEvents';

const { width } = Dimensions.get('window');
const CALENDAR_PADDING = 16;
const CALENDAR_MARGIN = 16;
const AVAILABLE_WIDTH = width - (CALENDAR_MARGIN * 2) - (CALENDAR_PADDING * 2);
const DAY_WIDTH = AVAILABLE_WIDTH / 7;

// Category colors
const categoryColors = {
  Worship: '#6366f1',
  Youth: '#ec4899',
  Prayer: '#8b5cf6',
  Outreach: '#10b981',
  Conference: '#f59e0b',
  Other: '#6b7280',
};

export default function ChurchCalendarScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('month'); // month, week, list
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarWidth, setCalendarWidth] = useState(0);

  const categories = ['All', 'Worship', 'Youth', 'Prayer', 'Outreach', 'Conference', 'Other'];

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, selectedCategory, currentDate, viewMode]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsQuery = query(collection(db, 'events'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(eventsQuery);
      const eventsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Expand recurring events into instances (6 months ahead for calendar)
      const expandedEvents = expandRecurringEvents(eventsData, 26); // 26 weeks = ~6 months
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
        },
        {
          id: '2',
          title: 'Youth Conference 2025',
          date: '2025-01-20',
          time: '5:00 PM',
          location: 'Youth Center',
          category: 'Youth',
        },
        {
          id: '3',
          title: 'Prayer & Fasting',
          date: '2025-01-15',
          time: '6:00 AM',
          location: 'Prayer Room',
          category: 'Prayer',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const filterEvents = () => {
    let filtered = events;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((event) => event.category === selectedCategory);
    }

    // Filter by date range based on view mode
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      endDate.setHours(23, 59, 59);

      filtered = filtered.filter((event) => {
        const eventStart = new Date(event.date);
        // For multi-day events, check if the event overlaps with the month
        if (event.isMultiDay && event.endDate) {
          const eventEnd = new Date(event.endDate);
          eventEnd.setHours(23, 59, 59, 999);
          return (eventStart <= endDate && eventEnd >= startDate);
        }
        return eventStart >= startDate && eventStart <= endDate;
      });
    } else if (viewMode === 'week') {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59);

      filtered = filtered.filter((event) => {
        const eventStart = new Date(event.date);
        // For multi-day events, check if the event overlaps with the week
        if (event.isMultiDay && event.endDate) {
          const eventEnd = new Date(event.endDate);
          eventEnd.setHours(23, 59, 59, 999);
          return (eventStart <= weekEnd && eventEnd >= weekStart);
        }
        return eventStart >= weekStart && eventStart <= weekEnd;
      });
    } else if (viewMode === 'list') {
      // Show upcoming events (next 30 days)
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 30);
      endDate.setHours(23, 59, 59);

      filtered = filtered.filter((event) => {
        const eventStart = new Date(event.date);
        // For multi-day events, check if the event overlaps with the next 30 days
        if (event.isMultiDay && event.endDate) {
          const eventEnd = new Date(event.endDate);
          eventEnd.setHours(23, 59, 59, 999);
          return (eventStart <= endDate && eventEnd >= today);
        }
        return eventStart >= today && eventStart <= endDate;
      });
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB;
    });

    setFilteredEvents(filtered);
  };

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    // Use timezone-safe date string formatting
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return filteredEvents.filter((event) => {
      // For multi-day events, show on all days they span
      if (event.isMultiDay && event.endDate) {
        const eventStart = new Date(event.date);
        const eventEnd = new Date(event.endDate);
        const checkDate = new Date(dateStr);
        return checkDate >= eventStart && checkDate <= eventEnd;
      }
      return event.date === dateStr;
    });
  };

  const getWeekDays = () => {
    const weekStart = getWeekStart(currentDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatWeekRange = (date) => {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return `${weekStart.getDate()} ${weekStart.toLocaleDateString('en-US', { month: 'short' })} - ${weekEnd.getDate()} ${weekEnd.toLocaleDateString('en-US', { month: 'short' })}`;
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date) => {
    if (!date) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // onLayout gives container width, but content area is smaller due to padding (16px each side)
    const dayCellWidth = calendarWidth > 0 ? (calendarWidth - 32) / 7 : DAY_WIDTH;

    return (
      <View 
        style={styles.calendarContainer}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          setCalendarWidth(width);
        }}
      >
        <View style={styles.dayNamesRow}>
          {dayNames.map((day, index) => (
            <View key={index} style={[styles.dayNameCell, { width: dayCellWidth }]}>
              <Text style={styles.dayNameText}>{day}</Text>
            </View>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {days.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isTodayDate = isToday(date);
            const isSelectedDate = isSelected(date);
            const dateKey = date ? date.toISOString() : `empty-${index}`;

            return (
              <TouchableOpacity
                key={dateKey}
                style={[
                  styles.dayCell,
                  { width: dayCellWidth, height: dayCellWidth },
                  isTodayDate && styles.todayCell,
                  isSelectedDate && styles.selectedCell,
                ]}
                onPress={() => date && setSelectedDate(date)}
              >
                {date ? (
                  <>
                    <Text
                      style={[
                        styles.dayText,
                        isTodayDate && styles.todayText,
                        isSelectedDate && styles.selectedText,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                    {dayEvents.length > 0 && (
                      <View style={styles.eventIndicators}>
                        {dayEvents.slice(0, 3).map((event) => (
                          <View
                            key={`${event.id}-${dateKey}`}
                            style={[
                              styles.eventDot,
                              { backgroundColor: categoryColors[event.category] || categoryColors.Other },
                            ]}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <Text style={styles.moreEventsText}>+{dayEvents.length - 3}</Text>
                        )}
                      </View>
                    )}
                  </>
                ) : (
                  <View />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <View style={styles.weekContainer}>
        <View style={styles.weekHeader}>
          {dayNames.map((day, index) => (
            <View key={index} style={styles.weekDayHeader}>
              <Text style={styles.weekDayName}>{day}</Text>
            </View>
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.weekDaysRow}>
            {weekDays.map((date, index) => {
              const dayEvents = getEventsForDate(date);
              const isTodayDate = isToday(date);
              const isSelectedDate = isSelected(date);
              const dateKey = date.toISOString();

              return (
                <View
                  key={dateKey}
                  style={[
                    styles.weekDayCell,
                    isTodayDate && styles.weekTodayCell,
                    isSelectedDate && styles.weekSelectedCell,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.weekDayContent}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text
                      style={[
                        styles.weekDayNumber,
                        isTodayDate && styles.weekTodayText,
                        isSelectedDate && styles.weekSelectedText,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                    <ScrollView style={styles.weekEventsList}>
                      {dayEvents.map((event) => (
                        <TouchableOpacity
                          key={`${event.id}-${dateKey}`}
                          style={[
                            styles.weekEventItem,
                            { borderLeftColor: categoryColors[event.category] || categoryColors.Other },
                          ]}
                          onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
                        >
                          <Text style={styles.weekEventTime}>{event.time}</Text>
                          <Text style={styles.weekEventTitle} numberOfLines={2}>
                            {event.title}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderListView = () => {
    // Group events by date
    const eventsByDate = {};
    filteredEvents.forEach((event) => {
      const dateStr = event.date;
      if (!eventsByDate[dateStr]) {
        eventsByDate[dateStr] = [];
      }
      eventsByDate[dateStr].push(event);
    });

    const sortedDates = Object.keys(eventsByDate).sort();

    return (
      <ScrollView style={styles.listContainer}>
        {sortedDates.map((dateStr) => {
          const date = new Date(dateStr);
          const dayEvents = eventsByDate[dateStr];
          const isTodayDate = isToday(date);

          return (
            <View key={dateStr} style={styles.listDateSection}>
              <View style={styles.listDateHeader}>
                <View style={styles.listDateContent}>
                  <Text style={styles.listDateDay}>{date.getDate()}</Text>
                  <View>
                    <Text style={styles.listDateMonth}>
                      {date.toLocaleDateString('en-US', { month: 'short' })}
                    </Text>
                    <Text style={styles.listDateWeekday}>
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                  </View>
                </View>
                {isTodayDate && (
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>Today</Text>
                  </View>
                )}
              </View>
              {dayEvents.map((event) => (
                <TouchableOpacity
                  key={`${event.id}-${dateStr}`}
                  style={styles.listEventCard}
                  onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
                >
                  <View
                    style={[
                      styles.listEventColorBar,
                      { backgroundColor: categoryColors[event.category] || categoryColors.Other },
                    ]}
                  />
                  <View style={styles.listEventContent}>
                    <Text style={styles.listEventTitle}>{event.title}</Text>
                    <View style={styles.listEventDetails}>
                      <Ionicons name="time-outline" size={14} color="#6b7280" />
                      <Text style={styles.listEventDetailText}>{event.time}</Text>
                      {event.location && (
                        <>
                          <Ionicons name="location-outline" size={14} color="#6b7280" style={styles.listEventIcon} />
                          <Text style={styles.listEventDetailText}>{event.location}</Text>
                        </>
                      )}
                    </View>
                    {event.category && (
                      <View
                        style={[
                          styles.listEventCategory,
                          { backgroundColor: `${categoryColors[event.category] || categoryColors.Other}20` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.listEventCategoryText,
                            { color: categoryColors[event.category] || categoryColors.Other },
                          ]}
                        >
                          {event.category}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
        {sortedDates.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No events found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try selecting a different category or date range
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderSelectedDateEvents = () => {
    // Use timezone-safe date string formatting
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Use full events array instead of filteredEvents to show events for any selected date
    // but still apply category filter
    let eventsToFilter = events;
    if (selectedCategory !== 'All') {
      eventsToFilter = events.filter((event) => event.category === selectedCategory);
    }
    
    const dayEvents = eventsToFilter.filter((event) => {
      // For multi-day events, show on all days they span
      if (event.isMultiDay && event.endDate) {
        const eventStart = new Date(event.date);
        const eventEnd = new Date(event.endDate);
        const checkDate = new Date(dateStr);
        return checkDate >= eventStart && checkDate <= eventEnd;
      }
      return event.date === dateStr;
    });

    if (dayEvents.length === 0) {
      return (
        <View style={styles.selectedDateEvents}>
          <Text style={styles.selectedDateTitle}>
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          <View style={styles.emptyEventsState}>
            <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyEventsText}>No events on this date</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.selectedDateEvents}>
        <Text style={styles.selectedDateTitle}>
          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        <ScrollView style={styles.selectedEventsList}>
          {dayEvents.map((event) => {
            const dateStr = selectedDate.toISOString().split('T')[0];
            return (
              <TouchableOpacity
                key={`${event.id}-${dateStr}`}
                style={styles.selectedEventCard}
                onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
              >
                <LinearGradient
                  colors={[
                    `${categoryColors[event.category] || categoryColors.Other}20`,
                    `${categoryColors[event.category] || categoryColors.Other}10`,
                  ]}
                  style={styles.selectedEventGradient}
                >
                  <View
                    style={[
                      styles.selectedEventColorBar,
                      { backgroundColor: categoryColors[event.category] || categoryColors.Other },
                    ]}
                  />
                  <View style={styles.selectedEventContent}>
                    <Text style={styles.selectedEventTitle}>{event.title}</Text>
                    <View style={styles.selectedEventDetails}>
                      <View style={styles.selectedEventDetailRow}>
                        <Ionicons name="time-outline" size={16} color="#6b7280" />
                        <Text style={styles.selectedEventDetailText}>{event.time}</Text>
                      </View>
                      {event.location && (
                        <View style={styles.selectedEventDetailRow}>
                          <Ionicons name="location-outline" size={16} color="#6b7280" />
                          <Text style={styles.selectedEventDetailText}>{event.location}</Text>
                        </View>
                      )}
                    </View>
                    {event.category && (
                      <View
                        style={[
                          styles.selectedEventCategory,
                          { backgroundColor: `${categoryColors[event.category] || categoryColors.Other}30` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectedEventCategoryText,
                            { color: categoryColors[event.category] || categoryColors.Other },
                          ]}
                        >
                          {event.category}
                        </Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Church Calendar</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <View style={styles.viewModeSelector}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'month' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('month')}
        >
          <Ionicons
            name="calendar"
            size={20}
            color={viewMode === 'month' ? '#6366f1' : '#6b7280'}
          />
          <Text
            style={[
              styles.viewModeText,
              viewMode === 'month' && styles.viewModeTextActive,
            ]}
          >
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'week' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('week')}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={viewMode === 'week' ? '#6366f1' : '#6b7280'}
          />
          <Text
            style={[
              styles.viewModeText,
              viewMode === 'week' && styles.viewModeTextActive,
            ]}
          >
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <Ionicons
            name="list"
            size={20}
            color={viewMode === 'list' ? '#6366f1' : '#6b7280'}
          />
          <Text
            style={[
              styles.viewModeText,
              viewMode === 'list' && styles.viewModeTextActive,
            ]}
          >
            List
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dateNavigation}>
        <TouchableOpacity
          onPress={() => (viewMode === 'month' ? navigateMonth(-1) : navigateWeek(-1))}
          style={styles.navButton}
        >
          <Ionicons name="chevron-back" size={24} color="#6366f1" />
        </TouchableOpacity>
        <Text style={styles.dateText}>
          {viewMode === 'month'
            ? formatDate(currentDate)
            : viewMode === 'week'
            ? formatWeekRange(currentDate)
            : 'Upcoming Events'}
        </Text>
        <TouchableOpacity
          onPress={() => (viewMode === 'month' ? navigateMonth(1) : navigateWeek(1))}
          style={styles.navButton}
        >
          <Ionicons name="chevron-forward" size={24} color="#6366f1" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            const today = new Date();
            setCurrentDate(today);
            setSelectedDate(today);
          }}
          style={styles.todayButton}
        >
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'list' && renderListView()}
        </ScrollView>

        {(viewMode === 'month' || viewMode === 'week') && renderSelectedDateEvents()}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilter}
          contentContainerStyle={styles.categoryFilterContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
                selectedCategory === category &&
                  category !== 'All' && {
                    backgroundColor: `${categoryColors[category]}20`,
                    borderColor: categoryColors[category],
                  },
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              {category !== 'All' && (
                <View
                  style={[
                    styles.categoryDot,
                    { backgroundColor: categoryColors[category] },
                  ]}
                />
              )}
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.categoryChipTextActive,
                  selectedCategory === category &&
                    category !== 'All' && {
                      color: categoryColors[category],
                    },
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  viewModeSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  viewModeButtonActive: {
    backgroundColor: '#f3f4f6',
  },
  viewModeText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  viewModeTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  navButton: {
    padding: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#6366f1',
  },
  todayButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  content: {
    flexShrink: 1,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayNameCell: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    paddingHorizontal: 2,
    borderRadius: 8,
  },
  todayCell: {
    backgroundColor: '#6366f120',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  selectedCell: {
    backgroundColor: '#6366f1',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  todayText: {
    color: '#6366f1',
    fontWeight: '700',
  },
  selectedText: {
    color: '#fff',
    fontWeight: '700',
  },
  eventIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
    marginVertical: 1,
  },
  moreEventsText: {
    fontSize: 8,
    color: '#6b7280',
    marginLeft: 2,
  },
  weekContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  weekHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  weekDayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  weekDaysRow: {
    flexDirection: 'row',
    minHeight: 400,
  },
  weekDayCell: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  weekTodayCell: {
    backgroundColor: '#6366f110',
  },
  weekSelectedCell: {
    backgroundColor: '#6366f120',
  },
  weekDayContent: {
    flex: 1,
    padding: 8,
  },
  weekDayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  weekTodayText: {
    color: '#6366f1',
    fontWeight: '700',
  },
  weekSelectedText: {
    color: '#6366f1',
    fontWeight: '700',
  },
  weekEventsList: {
    flex: 1,
  },
  weekEventItem: {
    padding: 6,
    marginBottom: 4,
    borderRadius: 4,
    backgroundColor: '#f9fafb',
    borderLeftWidth: 3,
  },
  weekEventTime: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  weekEventTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#111827',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  listDateSection: {
    marginBottom: 24,
  },
  listDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listDateContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listDateDay: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginRight: 12,
  },
  listDateMonth: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  listDateWeekday: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#6366f1',
  },
  todayBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  listEventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  listEventColorBar: {
    width: 4,
  },
  listEventContent: {
    flex: 1,
    padding: 16,
  },
  listEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  listEventDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  listEventDetailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    marginRight: 12,
  },
  listEventIcon: {
    marginLeft: 12,
  },
  listEventCategory: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  listEventCategoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  categoryFilter: {
    maxHeight: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  categoryFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#f3f4f6',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  categoryChipTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
  selectedDateEvents: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 250,
    flexShrink: 0,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectedEventsList: {
    maxHeight: 200,
  },
  selectedEventCard: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedEventGradient: {
    flexDirection: 'row',
  },
  selectedEventColorBar: {
    width: 4,
  },
  selectedEventContent: {
    flex: 1,
    padding: 16,
  },
  selectedEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  selectedEventDetails: {
    marginBottom: 8,
  },
  selectedEventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectedEventDetailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  selectedEventCategory: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  selectedEventCategoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyEventsState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyEventsText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
});

