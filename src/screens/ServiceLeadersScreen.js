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
import { db } from '../../firebase.config';
import { collection, getDocs } from 'firebase/firestore';

const { width } = Dimensions.get('window');
const DAY_WIDTH = (width - 64) / 7; // Fallback width: screen width - margins (32) - padding (32)

export default function ServiceLeadersScreen({ navigation }) {
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, list
  const [calendarWidth, setCalendarWidth] = useState(0);

  useEffect(() => {
    loadRoster();
  }, []);

  const loadRoster = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      const q = collection(db, 'serviceLeaders');
      const querySnapshot = await getDocs(q);
      const rosterList = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const serviceDate = data.serviceDate?.toDate ? data.serviceDate.toDate() : new Date(data.serviceDate);
        rosterList.push({
          id: doc.id,
          ...data,
          serviceDate,
        });
      });

      setRoster(rosterList);
    } catch (error) {
      console.error('Error loading roster:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRoster();
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getEntriesForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return roster.filter((entry) => {
      const entryDate = entry.serviceDate instanceof Date 
        ? entry.serviceDate 
        : new Date(entry.serviceDate);
      const entryDateStr = entryDate.toISOString().split('T')[0];
      return entryDateStr === dateStr;
    });
  };

  const getEntriesForMonth = () => {
    const { year, month } = getDaysInMonth(currentDate);
    return roster.filter((entry) => {
      const entryDate = entry.serviceDate instanceof Date 
        ? entry.serviceDate 
        : new Date(entry.serviceDate);
      return entryDate.getFullYear() === year && entryDate.getMonth() === month;
    });
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    if (time.includes(':')) {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    }
    return time;
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Calculate cell width based on actual container width (accounting for padding: 16px each side = 32px total)
    // Divide by 7 to get equal width for each day, ensuring exact fit
    // Use measured width if available, otherwise fallback to screen width calculation
    const containerPadding = 32; // 16px padding on each side
    const availableWidth = calendarWidth > 0 
      ? calendarWidth - containerPadding 
      : width - 64; // screen width - margins (32) - padding (32)
    const dayCellWidth = Math.floor((availableWidth / 7) * 100) / 100; // Round to 2 decimal places for precision

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const entries = getEntriesForDate(date);
      days.push({ day, date, entries });
    }

    return (
      <View 
        style={styles.calendarContainer}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          setCalendarWidth(width);
        }}
      >
        <View style={styles.dayNamesRow}>
          {dayNames.map((dayName, index) => (
            <View key={index} style={[styles.dayNameCell, { width: dayCellWidth }]}>
              <Text style={styles.dayNameText}>{dayName}</Text>
            </View>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {days.map((dayData, index) => {
            const cellStyle = { width: dayCellWidth, height: dayCellWidth };
            
            if (dayData === null) {
              return <View key={`empty-${index}`} style={[styles.emptyDayCell, cellStyle]} />;
            }

            const { day, date, entries } = dayData;
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            const hasEntries = entries.length > 0;

            return (
              <TouchableOpacity
                key={`day-${day}-${index}`}
                style={[
                  styles.dayCell,
                  cellStyle,
                  isToday && styles.todayCell,
                  isSelected && styles.selectedDayCell,
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    isToday && styles.todayDayNumber,
                    isSelected && styles.selectedDayNumber,
                  ]}
                >
                  {day}
                </Text>
                {hasEntries && (
                  <View style={styles.entriesIndicator}>
                    <View style={styles.entryDot} />
                    {entries.length > 1 && (
                      <Text style={styles.entryCount}>{entries.length}</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderSelectedDateDetails = () => {
    if (!selectedDate) return null;

    const entries = getEntriesForDate(selectedDate);
    if (entries.length === 0) {
      return (
        <View style={styles.detailsContainer}>
          <Text style={styles.noEntriesText}>No service leaders scheduled for this date</Text>
        </View>
      );
    }

    return (
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
        {entries.map((entry) => (
          <View key={entry.id} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <View style={styles.entryInfo}>
                <Text style={styles.leaderName}>{entry.leaderName}</Text>
                <Text style={styles.roleText}>{entry.role}</Text>
              </View>
              {entry.serviceTime && (
                <View style={styles.timeBadge}>
                  <Ionicons name="time-outline" size={16} color="#6366f1" />
                  <Text style={styles.timeText}>{formatTime(entry.serviceTime)}</Text>
                </View>
              )}
            </View>
            {entry.notes && (
              <Text style={styles.notesText}>{entry.notes}</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderListView = () => {
    const monthEntries = getEntriesForMonth();
    
    if (monthEntries.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No service leaders scheduled this month</Text>
        </View>
      );
    }

    // Group entries by date
    const groupedEntries = {};
    monthEntries.forEach((entry) => {
      const dateStr = entry.serviceDate.toISOString().split('T')[0];
      if (!groupedEntries[dateStr]) {
        groupedEntries[dateStr] = [];
      }
      groupedEntries[dateStr].push(entry);
    });

    const sortedDates = Object.keys(groupedEntries).sort();

    return (
      <ScrollView style={styles.listContainer}>
        {sortedDates.map((dateStr) => {
          const date = new Date(dateStr);
          const entries = groupedEntries[dateStr];
          
          return (
            <View key={dateStr} style={styles.listDateSection}>
              <Text style={styles.listDateTitle}>
                {date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              {entries.map((entry) => (
                <View key={entry.id} style={styles.listEntryCard}>
                  <View style={styles.listEntryHeader}>
                    <View style={styles.listEntryInfo}>
                      <Text style={styles.listLeaderName}>{entry.leaderName}</Text>
                      <Text style={styles.listRoleText}>{entry.role}</Text>
                    </View>
                    {entry.serviceTime && (
                      <View style={styles.listTimeBadge}>
                        <Ionicons name="time-outline" size={14} color="#6366f1" />
                        <Text style={styles.listTimeText}>{formatTime(entry.serviceTime)}</Text>
                      </View>
                    )}
                  </View>
                  {entry.notes && (
                    <Text style={styles.listNotesText}>{entry.notes}</Text>
                  )}
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading service leaders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Leaders</Text>
        <View style={{ width: 40 }} />
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
            Calendar
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

      {viewMode === 'month' ? (
        <>
          <View style={styles.dateNavigation}>
            <TouchableOpacity
              onPress={() => navigateMonth(-1)}
              style={styles.navButton}
            >
              <Ionicons name="chevron-back" size={24} color="#6366f1" />
            </TouchableOpacity>
            <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
            <TouchableOpacity
              onPress={() => navigateMonth(1)}
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

          <ScrollView
            style={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {renderCalendar()}
            {renderSelectedDateDetails()}
            <View style={{ height: 30 }} />
          </ScrollView>
        </>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.monthHeader}>
            <TouchableOpacity
              onPress={() => navigateMonth(-1)}
              style={styles.navButton}
            >
              <Ionicons name="chevron-back" size={24} color="#6366f1" />
            </TouchableOpacity>
            <Text style={styles.monthText}>{formatDate(currentDate)}</Text>
            <TouchableOpacity
              onPress={() => navigateMonth(1)}
              style={styles.navButton}
            >
              <Ionicons name="chevron-forward" size={24} color="#6366f1" />
            </TouchableOpacity>
          </View>
          {renderListView()}
          <View style={{ height: 30 }} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
    fontSize: 16,
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
  content: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 8,
    width: '100%',
  },
  dayNameCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    flexShrink: 0,
    flexGrow: 0,
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
  },
  emptyDayCell: {
    // Width and height set dynamically
    // Empty placeholder to maintain grid alignment
    flexShrink: 0,
    flexGrow: 0,
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    // Width and height set dynamically
    // No margin to ensure proper alignment
    flexShrink: 0,
    flexGrow: 0,
  },
  todayCell: {
    backgroundColor: '#ede9fe',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  selectedDayCell: {
    backgroundColor: '#6366f1',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  todayDayNumber: {
    color: '#6366f1',
    fontWeight: '600',
  },
  selectedDayNumber: {
    color: '#fff',
    fontWeight: '600',
  },
  entriesIndicator: {
    position: 'absolute',
    bottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366f1',
  },
  entryCount: {
    fontSize: 8,
    color: '#6366f1',
    marginLeft: 2,
    fontWeight: '600',
  },
  detailsContainer: {
    margin: 16,
    marginTop: 0,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  entryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  entryInfo: {
    flex: 1,
  },
  leaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
    marginLeft: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    lineHeight: 20,
  },
  noEntriesText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    padding: 20,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  listContainer: {
    flex: 1,
  },
  listDateSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  listDateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  listEntryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  listEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listEntryInfo: {
    flex: 1,
  },
  listLeaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  listRoleText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  listTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  listTimeText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
    marginLeft: 4,
  },
  listNotesText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
});

