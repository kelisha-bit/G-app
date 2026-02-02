import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db, auth } from '../../firebase.config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PrayerJournalScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    answered: 0,
  });

  const filters = ['All', 'Active', 'Answered', 'Recent'];

  useEffect(() => {
    loadPrayers();
    
    // Set up real-time listener
    const user = auth.currentUser;
    if (!user) return;

    const prayersQuery = query(
      collection(db, 'prayerJournal'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      prayersQuery,
      (snapshot) => {
        const prayersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
          updatedAt: doc.data().updatedAt?.toDate?.() || null,
          reminderDate: doc.data().reminderDate?.toDate?.() || null,
        }));
        
        setPrayers(prayersData);
        calculateStats(prayersData);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        if (__DEV__) console.error('Error listening to prayers:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const loadPrayers = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const q = query(
        collection(db, 'prayerJournal'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const prayersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        updatedAt: doc.data().updatedAt?.toDate?.() || null,
        reminderDate: doc.data().reminderDate?.toDate?.() || null,
      }));
      
      setPrayers(prayersData);
      calculateStats(prayersData);
    } catch (error) {
      if (__DEV__) console.error('Error loading prayers:', error);
      Alert.alert('Error', 'Failed to load prayer journal');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (prayersData) => {
    const total = prayersData.length;
    const active = prayersData.filter(p => !p.isAnswered).length;
    const answered = prayersData.filter(p => p.isAnswered).length;
    setStats({ total, active, answered });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPrayers();
  };

  const formatDate = (date) => {
    if (!date) return '';
    let d;
    if (date instanceof Date) {
      d = date;
    } else if (date && typeof date.toDate === 'function') {
      d = date.toDate();
    } else {
      d = new Date(date);
      if (isNaN(d.getTime())) return '';
    }
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / 86400000);

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getFilteredPrayers = () => {
    switch (selectedFilter) {
      case 'Active':
        return prayers.filter(p => !p.isAnswered);
      case 'Answered':
        return prayers.filter(p => p.isAnswered);
      case 'Recent':
        return prayers.slice(0, 10);
      default:
        return prayers;
    }
  };

  const filteredPrayers = getFilteredPrayers();

  const renderPrayerCard = (prayer) => (
    <TouchableOpacity
      key={prayer.id}
      style={styles.prayerCard}
      onPress={() => navigation.navigate('PrayerEntryDetails', { prayerId: prayer.id })}
      activeOpacity={0.7}
    >
      <View style={styles.prayerHeader}>
        <View style={styles.prayerTitleRow}>
          <Text style={styles.prayerTitle} numberOfLines={2}>{prayer.title}</Text>
          {prayer.isAnswered && (
            <View style={styles.answeredBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.answeredText}>Answered</Text>
            </View>
          )}
        </View>
        <Text style={styles.prayerDate}>{formatDate(prayer.createdAt)}</Text>
      </View>
      
      {prayer.request && (
        <Text style={styles.prayerRequest} numberOfLines={3}>{prayer.request}</Text>
      )}
      
      {prayer.reminderDate && (
        <View style={styles.reminderBadge}>
          <Ionicons name="alarm-outline" size={14} color="#f59e0b" />
          <Text style={styles.reminderText}>
            Reminder: {prayer.reminderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      )}
      
      <View style={styles.prayerFooter}>
        {prayer.hasNotes && (
          <View style={styles.footerItem}>
            <Ionicons name="document-text-outline" size={16} color="#6b7280" />
            <Text style={styles.footerText}>Has notes</Text>
          </View>
        )}
        {prayer.isAnswered && prayer.answeredDate && (
          <View style={styles.footerItem}>
            <Ionicons name="calendar-outline" size={16} color="#10b981" />
            <Text style={styles.footerText}>
              Answered {formatDate(prayer.answeredDate)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={['#8b5cf6', '#6366f1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prayer Journal</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddPrayerEntry')}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#fff', '#f3f4f6']}
            style={styles.addButtonGradient}
          >
            <Ionicons name="add" size={24} color="#8b5cf6" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Prayers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#6366f1' }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.answered}</Text>
          <Text style={styles.statLabel}>Answered</Text>
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter && styles.filterButtonTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Prayers List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading your prayers...</Text>
        </View>
      ) : filteredPrayers.length === 0 ? (
        <View style={styles.centerContainer}>
          <LinearGradient
            colors={['#e9d5ff', '#ddd6fe']}
            style={styles.emptyIconContainer}
          >
            <Ionicons name="heart-outline" size={48} color="#8b5cf6" />
          </LinearGradient>
          <Text style={styles.emptyText}>
            {selectedFilter === 'All' ? 'No prayers yet' : `No ${selectedFilter.toLowerCase()} prayers`}
          </Text>
          <Text style={styles.emptySubtext}>
            {selectedFilter === 'All' 
              ? 'Start your prayer journal by adding your first prayer request'
              : 'Try selecting a different filter'}
          </Text>
          {selectedFilter === 'All' && (
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={() => navigation.navigate('AddPrayerEntry')}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.emptyActionButtonText}>Add Prayer</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredPrayers.map(prayer => renderPrayerCard(prayer))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  addButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8b5cf6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#8b5cf6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
    elevation: 3,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  emptyActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  prayerCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  prayerHeader: {
    marginBottom: 12,
  },
  prayerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  prayerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  answeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  answeredText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  prayerDate: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  prayerRequest: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  reminderText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
  },
  prayerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 16,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
});

