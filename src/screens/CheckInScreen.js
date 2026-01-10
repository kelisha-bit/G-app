import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  getDoc,
  limit 
} from 'firebase/firestore';
import { db, auth } from '../../firebase.config';

export default function CheckInScreen({ navigation }) {
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState([]);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [todayCheckIns, setTodayCheckIns] = useState([]);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    totalCheckIns: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (!refreshing) {
        setInitialLoading(true);
      }
      
      await Promise.all([
        loadServices(),
        loadUserData(),
        loadRecentCheckIns(),
        loadTodayCheckIns(),
        loadStats(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const loadServices = async () => {
    try {
      // Load upcoming events from Firebase
      const eventsQuery = query(
        collection(db, 'events'),
        orderBy('date', 'asc')
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      
      const upcomingEvents = [];
      const today = new Date().toISOString().split('T')[0];
      
      eventsSnapshot.forEach((doc) => {
        const event = doc.data();
        // Only include today and future events
        if (event.date >= today) {
          upcomingEvents.push({
            id: doc.id,
            name: event.title,
            time: event.time,
            date: event.date,
            location: event.location,
            category: event.category,
            icon: getCategoryIcon(event.category),
          });
        }
      });

      // Add default recurring services if no events
      if (upcomingEvents.length === 0) {
        upcomingEvents.push(
          { id: 'sunday', name: 'Sunday Service', time: '9:00 AM', icon: 'sunny', category: 'Worship' },
          { id: 'bible', name: 'Bible Study', time: '6:00 PM', icon: 'book', category: 'Teaching' },
          { id: 'prayer', name: 'Prayer Meeting', time: '7:00 PM', icon: 'hand-left', category: 'Prayer' },
          { id: 'youth', name: 'Youth Service', time: '5:00 PM', icon: 'people', category: 'Youth' }
        );
      }

      setServices(upcomingEvents);
    } catch (error) {
      console.error('Error loading services:', error);
      // Fallback to default services
      setServices([
        { id: 'sunday', name: 'Sunday Service', time: '9:00 AM', icon: 'sunny', category: 'Worship' },
        { id: 'bible', name: 'Bible Study', time: '6:00 PM', icon: 'book', category: 'Teaching' },
        { id: 'prayer', name: 'Prayer Meeting', time: '7:00 PM', icon: 'hand-left', category: 'Prayer' },
        { id: 'youth', name: 'Youth Service', time: '5:00 PM', icon: 'people', category: 'Youth' },
      ]);
    }
  };

  const loadUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadRecentCheckIns = async () => {
    try {
      const checkInsQuery = query(
        collection(db, 'checkIns'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('checkedInAt', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(checkInsQuery);
      const checkIns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecentCheckIns(checkIns);
    } catch (error) {
      console.error('Error loading recent check-ins:', error);
    }
  };

  const loadTodayCheckIns = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const checkInsQuery = query(
        collection(db, 'checkIns'),
        where('userId', '==', auth.currentUser.uid),
        where('checkedInAt', '>=', todayISO),
        orderBy('checkedInAt', 'desc')
      );
      const snapshot = await getDocs(checkInsQuery);
      const checkIns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTodayCheckIns(checkIns);
    } catch (error) {
      console.error('Error loading today check-ins:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Get total check-ins
      const allCheckInsQuery = query(
        collection(db, 'checkIns'),
        where('userId', '==', auth.currentUser.uid)
      );
      const allSnapshot = await getDocs(allCheckInsQuery);
      
      // Get this month's check-ins
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      
      const monthCheckInsQuery = query(
        collection(db, 'checkIns'),
        where('userId', '==', auth.currentUser.uid),
        where('checkedInAt', '>=', firstDayOfMonth.toISOString())
      );
      const monthSnapshot = await getDocs(monthCheckInsQuery);

      setStats({
        totalCheckIns: allSnapshot.size,
        thisMonth: monthSnapshot.size,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getCategoryIcon = (category) => {
    const iconMap = {
      'Worship': 'musical-notes',
      'Youth': 'people',
      'Prayer': 'hand-left',
      'Outreach': 'heart',
      'Conference': 'mic',
      'Teaching': 'book',
      'Other': 'ellipsis-horizontal',
    };
    return iconMap[category] || 'calendar';
  };

  const isAlreadyCheckedIn = (serviceId) => {
    return todayCheckIns.some(checkIn => 
      checkIn.serviceId === serviceId || checkIn.service === services.find(s => s.id === serviceId)?.name
    );
  };

  const handleCheckIn = async () => {
    if (!selectedService) {
      Alert.alert('Error', 'Please select a service');
      return;
    }

    const service = services.find((s) => s.id === selectedService);
    
    // Check if already checked in
    if (isAlreadyCheckedIn(selectedService)) {
      Alert.alert(
        'Already Checked In',
        `You've already checked in to ${service.name} today.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      const checkInData = {
        userId: auth.currentUser.uid,
        userName: userData?.displayName || auth.currentUser.displayName || 'Member',
        userEmail: auth.currentUser.email,
        service: service.name,
        serviceId: service.id,
        time: service.time,
        location: service.location || 'Main Campus',
        category: service.category || 'Service',
        checkedInAt: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
      };

      await addDoc(collection(db, 'checkIns'), checkInData);

      // Reload data
      await loadData();

      Alert.alert(
        '✅ Check-In Successful!',
        `You've checked in to ${service.name}\n${service.time}${service.location ? ` at ${service.location}` : ''}`,
        [{ text: 'Great!', onPress: () => setSelectedService(null) }]
      );
    } catch (error) {
      console.error('Check-in error:', error);
      Alert.alert('Error', 'Failed to check in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = date.toISOString().split('T')[0];
    const todayOnly = today.toISOString().split('T')[0];
    const yesterdayOnly = yesterday.toISOString().split('T')[0];

    if (dateOnly === todayOnly) return 'Today';
    if (dateOnly === yesterdayOnly) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (initialLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Check In</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading check-in options...</Text>
        </View>
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
        <Text style={styles.headerTitle}>Check In</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name="refresh" 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeHeader}>
            <View>
              <Text style={styles.welcomeTitle}>
                Welcome, {userData?.displayName?.split(' ')[0] || 'Member'}! 👋
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Ready to check in to a service?
              </Text>
            </View>
          </View>
          
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-done-circle" size={24} color="#10b981" />
              <Text style={styles.statNumber}>{stats.totalCheckIns}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="calendar" size={24} color="#6366f1" />
              <Text style={styles.statNumber}>{stats.thisMonth}</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="today" size={24} color="#f59e0b" />
              <Text style={styles.statNumber}>{todayCheckIns.length}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#6366f1" />
          <Text style={styles.infoText}>
            Select a service below to check in. You can check in to multiple services throughout the day!
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Available Services</Text>

        {services.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No services available</Text>
            <Text style={styles.emptyStateSubtext}>
              Check back later for upcoming services
            </Text>
          </View>
        ) : (
          services.map((service) => {
            const alreadyCheckedIn = isAlreadyCheckedIn(service.id);
            return (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.serviceCard,
                  selectedService === service.id && styles.serviceCardSelected,
                  alreadyCheckedIn && styles.serviceCardDisabled,
                ]}
                onPress={() => !alreadyCheckedIn && setSelectedService(service.id)}
                disabled={alreadyCheckedIn}
              >
                <View
                  style={[
                    styles.serviceIcon,
                    selectedService === service.id && styles.serviceIconSelected,
                    alreadyCheckedIn && styles.serviceIconDisabled,
                  ]}
                >
                  <Ionicons
                    name={alreadyCheckedIn ? 'checkmark-circle' : service.icon}
                    size={28}
                    color={
                      alreadyCheckedIn
                        ? '#10b981'
                        : selectedService === service.id
                        ? '#fff'
                        : '#6366f1'
                    }
                  />
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <View style={styles.serviceDetails}>
                    <Ionicons name="time-outline" size={14} color="#6b7280" />
                    <Text style={styles.serviceTime}>{service.time}</Text>
                    {service.location && (
                      <>
                        <Ionicons name="location-outline" size={14} color="#6b7280" style={{ marginLeft: 10 }} />
                        <Text style={styles.serviceTime}>{service.location}</Text>
                      </>
                    )}
                  </View>
                  {service.date && (
                    <View style={styles.serviceDetails}>
                      <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                      <Text style={styles.serviceTime}>
                        {new Date(service.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric' 
                        })}
                      </Text>
                    </View>
                  )}
                  {alreadyCheckedIn && (
                    <View style={styles.checkedInBadge}>
                      <Text style={styles.checkedInText}>✓ Checked In</Text>
                    </View>
                  )}
                </View>
                {!alreadyCheckedIn && (
                  <View
                    style={[
                      styles.radioButton,
                      selectedService === service.id && styles.radioButtonSelected,
                    ]}
                  >
                    {selectedService === service.id && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}

        {services.length > 0 && (
          <TouchableOpacity
            style={[styles.checkInButton, (loading || !selectedService) && styles.checkInButtonDisabled]}
            onPress={handleCheckIn}
            disabled={loading || !selectedService}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.checkInGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
              )}
              <Text style={styles.checkInButtonText}>
                {loading ? 'Checking In...' : 'Check In Now'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Recent Check-Ins */}
        {recentCheckIns.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Check-Ins</Text>
            <View style={styles.historyCard}>
              {recentCheckIns.map((checkIn, index) => (
                <View 
                  key={checkIn.id} 
                  style={[
                    styles.historyItem,
                    index !== recentCheckIns.length - 1 && styles.historyItemBorder,
                  ]}
                >
                  <View style={styles.historyIcon}>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyService}>{checkIn.service}</Text>
                    <Text style={styles.historyDate}>
                      {formatDate(checkIn.checkedInAt)} at {formatTime(checkIn.checkedInAt)}
                    </Text>
                  </View>
                  <View style={styles.historyCategoryBadge}>
                    <Text style={styles.historyCategoryText}>
                      {checkIn.category || 'Service'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#ede9fe',
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#5b21b6',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
    marginTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 5,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f5f3ff',
  },
  serviceCardDisabled: {
    opacity: 0.7,
    borderColor: '#d1fae5',
    backgroundColor: '#f0fdf4',
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  serviceIconSelected: {
    backgroundColor: '#6366f1',
  },
  serviceIconDisabled: {
    backgroundColor: '#d1fae5',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  serviceTime: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 4,
  },
  checkedInBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  checkedInText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#6366f1',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366f1',
  },
  checkInButton: {
    marginTop: 30,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  checkInButtonDisabled: {
    opacity: 0.5,
  },
  checkInGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
  },
  checkInButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  historyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyService: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 13,
    color: '#6b7280',
  },
  historyCategoryBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  historyCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
  },
});

