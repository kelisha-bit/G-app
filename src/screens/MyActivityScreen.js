import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, auth } from '../../firebase.config';

export default function MyActivityScreen({ navigation, route }) {
  // Ensure route object has expected structure for React Navigation
  const safeRoute = route || { params: {}, index: 0 };
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalCheckIns: 0,
    thisMonthCheckIns: 0,
    totalGiving: 0,
    registeredEvents: 0,
    myGroups: 0,
    volunteerCommitments: 0,
    prayerRequests: 0,
    sermonNotes: 0,
    bookmarks: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [myVolunteers, setMyVolunteers] = useState([]);
  const [myPrayers, setMyPrayers] = useState([]);

  const loadStats = async () => {
    try {
      if (!auth.currentUser) return;

      const userId = auth.currentUser.uid;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Load check-ins
      const checkInsQuery = query(
        collection(db, 'checkIns'),
        where('userId', '==', userId)
      );
      const checkInsSnapshot = await getDocs(checkInsQuery);
      const allCheckIns = [];
      let thisMonthCount = 0;

      checkInsSnapshot.forEach((doc) => {
        const data = doc.data();
        allCheckIns.push(data);
        const checkInDate = new Date(data.checkedInAt);
        if (checkInDate >= startOfMonth) {
          thisMonthCount++;
        }
      });

      // Load giving from donations collection (matching GivingScreen)
      const donationsQuery = query(
        collection(db, 'donations'),
        where('userId', '==', userId)
      );
      const donationsSnapshot = await getDocs(donationsQuery);
      let totalGiving = 0;

      donationsSnapshot.forEach((doc) => {
        const data = doc.data();
        // Only count completed and pending donations (matching GivingHistoryScreen logic)
        if (data.status === 'completed' || data.status === 'pending') {
          totalGiving += parseFloat(data.amount || 0);
        }
      });

      // Load event registrations
      const eventsQuery = query(
        collection(db, 'eventRegistrations'),
        where('userId', '==', userId)
      );
      const eventsSnapshot = await getDocs(eventsQuery);

      // Load small groups (check if user is a member)
      const groupsQuery = query(collection(db, 'smallGroups'));
      const groupsSnapshot = await getDocs(groupsQuery);
      let myGroupsCount = 0;

      groupsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.members && data.members.includes(userId)) {
          myGroupsCount++;
        }
      });

      // Load ministries (check if user is a member)
      const ministriesQuery = query(collection(db, 'ministries'));
      const ministriesSnapshot = await getDocs(ministriesQuery);
      let myMinistriesCount = 0;

      ministriesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.members && data.members.includes(userId)) {
          myMinistriesCount++;
        }
      });

      // Load volunteer applications
      const volunteersQuery = query(
        collection(db, 'volunteerApplications'),
        where('userId', '==', userId)
      );
      const volunteersSnapshot = await getDocs(volunteersQuery);
      let activeVolunteers = 0;

      volunteersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'approved' || data.status === 'pending') {
          activeVolunteers++;
        }
      });

      // Load prayer requests
      const prayersQuery = query(
        collection(db, 'prayerRequests'),
        where('userId', '==', userId)
      );
      const prayersSnapshot = await getDocs(prayersQuery);

      // Load sermon notes
      const notesQuery = query(
        collection(db, 'sermonNotes'),
        where('userId', '==', userId)
      );
      const notesSnapshot = await getDocs(notesQuery);

      // Load devotional bookmarks
      const bookmarksQuery = query(
        collection(db, 'devotionalBookmarks'),
        where('userId', '==', userId)
      );
      const bookmarksSnapshot = await getDocs(bookmarksQuery);

      setStats({
        totalCheckIns: allCheckIns.length,
        thisMonthCheckIns: thisMonthCount,
        totalGiving: totalGiving,
        registeredEvents: eventsSnapshot.size,
        myGroups: myGroupsCount + myMinistriesCount,
        volunteerCommitments: activeVolunteers,
        prayerRequests: prayersSnapshot.size,
        sermonNotes: notesSnapshot.size,
        bookmarks: bookmarksSnapshot.size,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      if (!auth.currentUser) return;

      const userId = auth.currentUser.uid;
      const activities = [];

      // Get recent check-ins
      const checkInsQuery = query(
        collection(db, 'checkIns'),
        where('userId', '==', userId),
        orderBy('checkedInAt', 'desc'),
        limit(3)
      );
      const checkInsSnapshot = await getDocs(checkInsQuery);
      checkInsSnapshot.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: `checkin-${doc.id}`,
          type: 'checkin',
          title: `Checked in to ${data.service}`,
          date: data.checkedInAt,
          icon: 'checkbox',
          color: '#10b981',
        });
      });

      // Get recent giving from donations collection (query without orderBy to avoid index requirement)
      const donationsQuery = query(
        collection(db, 'donations'),
        where('userId', '==', userId)
      );
      const donationsSnapshot = await getDocs(donationsQuery);
      const givingActivities = [];
      donationsSnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include completed and pending donations
        if (data.status === 'completed' || data.status === 'pending') {
          givingActivities.push({
            id: `giving-${doc.id}`,
            type: 'giving',
            title: `Gave GH₵${parseFloat(data.amount || 0).toFixed(2)} - ${data.category || 'General'}`,
            date: data.createdAt,
            icon: 'heart',
            color: '#ef4444',
          });
        }
      });
      // Sort and take top 3
      givingActivities.sort((a, b) => {
        const dateA = new Date(a.date?.toDate?.() || a.date || 0);
        const dateB = new Date(b.date?.toDate?.() || b.date || 0);
        return dateB - dateA;
      });
      activities.push(...givingActivities.slice(0, 3));

      // Get recent event registrations (query without orderBy)
      const eventsQuery = query(
        collection(db, 'eventRegistrations'),
        where('userId', '==', userId)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const eventActivities = [];
      eventsSnapshot.forEach((doc) => {
        const data = doc.data();
        eventActivities.push({
          id: `event-${doc.id}`,
          type: 'event',
          title: `Registered for ${data.eventTitle || 'Event'}`,
          date: data.registeredAt,
          icon: 'calendar',
          color: '#f59e0b',
        });
      });
      // Sort and take top 3
      eventActivities.sort((a, b) => {
        const dateA = new Date(a.date?.toDate?.() || a.date || 0);
        const dateB = new Date(b.date?.toDate?.() || b.date || 0);
        return dateB - dateA;
      });
      activities.push(...eventActivities.slice(0, 3));

      // Get recent prayer requests (query without orderBy)
      const prayersQuery = query(
        collection(db, 'prayerRequests'),
        where('userId', '==', userId)
      );
      const prayersSnapshot = await getDocs(prayersQuery);
      const prayerActivities = [];
      prayersSnapshot.forEach((doc) => {
        const data = doc.data();
        prayerActivities.push({
          id: `prayer-${doc.id}`,
          type: 'prayer',
          title: `Submitted prayer request: ${data.title || 'Prayer'}`,
          date: data.createdAt,
          icon: 'hand-left',
          color: '#8b5cf6',
        });
      });
      // Sort and take top 2
      prayerActivities.sort((a, b) => {
        const dateA = new Date(a.date?.toDate?.() || a.date || 0);
        const dateB = new Date(b.date?.toDate?.() || b.date || 0);
        return dateB - dateA;
      });
      activities.push(...prayerActivities.slice(0, 2));

      // Sort by date and limit to 10 most recent
      activities.sort((a, b) => {
        const dateA = new Date(a.date?.toDate?.() || a.date || 0);
        const dateB = new Date(b.date?.toDate?.() || b.date || 0);
        return dateB - dateA;
      });

      setRecentActivity(activities.slice(0, 10));
    } catch (error) {
      console.error('Error loading recent activity:', error);
      setRecentActivity([]);
    }
  };

  const loadMyEvents = async () => {
    try {
      if (!auth.currentUser) return;

      const userId = auth.currentUser.uid;
      // Query without orderBy to avoid index requirement, then sort in memory
      const eventsQuery = query(
        collection(db, 'eventRegistrations'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(eventsQuery);
      const events = [];

      snapshot.forEach((doc) => {
        events.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Sort by registeredAt descending
      events.sort((a, b) => {
        const dateA = new Date(a.registeredAt?.toDate?.() || a.registeredAt || 0);
        const dateB = new Date(b.registeredAt?.toDate?.() || b.registeredAt || 0);
        return dateB - dateA;
      });

      setMyEvents(events.slice(0, 5));
    } catch (error) {
      console.error('Error loading my events:', error);
      setMyEvents([]);
    }
  };

  const loadMyGroups = async () => {
    try {
      if (!auth.currentUser) return;

      const userId = auth.currentUser.uid;
      const groups = [];

      // Load small groups
      const groupsQuery = query(collection(db, 'smallGroups'));
      const groupsSnapshot = await getDocs(groupsQuery);
      groupsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.members && data.members.includes(userId)) {
          groups.push({
            id: doc.id,
            name: data.name,
            type: 'Small Group',
            ...data,
          });
        }
      });

      // Load ministries
      const ministriesQuery = query(collection(db, 'ministries'));
      const ministriesSnapshot = await getDocs(ministriesQuery);
      ministriesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.members && data.members.includes(userId)) {
          groups.push({
            id: doc.id,
            name: data.name,
            type: 'Ministry',
            ...data,
          });
        }
      });

      setMyGroups(groups.slice(0, 5));
    } catch (error) {
      console.error('Error loading my groups:', error);
      setMyGroups([]);
    }
  };

  const loadMyVolunteers = async () => {
    try {
      if (!auth.currentUser) return;

      const userId = auth.currentUser.uid;
      // Query without orderBy to avoid index requirement, then sort in memory
      const volunteersQuery = query(
        collection(db, 'volunteerApplications'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(volunteersQuery);
      const volunteers = [];

      snapshot.forEach((doc) => {
        volunteers.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Sort by appliedAt descending
      volunteers.sort((a, b) => {
        const dateA = new Date(a.appliedAt?.toDate?.() || a.appliedAt || 0);
        const dateB = new Date(b.appliedAt?.toDate?.() || b.appliedAt || 0);
        return dateB - dateA;
      });

      setMyVolunteers(volunteers.slice(0, 5));
    } catch (error) {
      console.error('Error loading my volunteers:', error);
      setMyVolunteers([]);
    }
  };

  const loadMyPrayers = async () => {
    try {
      if (!auth.currentUser) return;

      const userId = auth.currentUser.uid;
      // Query without orderBy to avoid index requirement, then sort in memory
      const prayersQuery = query(
        collection(db, 'prayerRequests'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(prayersQuery);
      const prayers = [];

      snapshot.forEach((doc) => {
        prayers.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Sort by createdAt descending
      prayers.sort((a, b) => {
        const dateA = new Date(a.createdAt?.toDate?.() || a.createdAt || 0);
        const dateB = new Date(b.createdAt?.toDate?.() || b.createdAt || 0);
        return dateB - dateA;
      });

      setMyPrayers(prayers.slice(0, 5));
    } catch (error) {
      console.error('Error loading my prayers:', error);
      setMyPrayers([]);
    }
  };

  const loadData = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      await Promise.all([
        loadStats(),
        loadRecentActivity(),
        loadMyEvents(),
        loadMyGroups(),
        loadMyVolunteers(),
        loadMyPrayers(),
      ]);
    } catch (error) {
      console.error('Error loading activity data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Recently';
    const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const statCards = [
    {
      id: 1,
      title: 'Check-Ins',
      value: stats.totalCheckIns.toString(),
      subtitle: `${stats.thisMonthCheckIns} this month`,
      icon: 'checkbox',
      color: '#10b981',
      onPress: () => navigation.navigate('CheckIn'),
    },
    {
      id: 2,
      title: 'Total Giving',
      value: `GH₵${stats.totalGiving.toFixed(2)}`,
      subtitle: 'All time',
      icon: 'heart',
      color: '#ef4444',
      onPress: () => navigation.navigate('Giving'),
    },
    {
      id: 3,
      title: 'Events',
      value: stats.registeredEvents.toString(),
      subtitle: 'Registered',
      icon: 'calendar',
      color: '#f59e0b',
      onPress: () => {
        // Navigate back to home, user can then tap Events tab
        navigation.navigate('MainTabs');
      },
    },
    {
      id: 4,
      title: 'Groups',
      value: stats.myGroups.toString(),
      subtitle: 'Joined',
      icon: 'people',
      color: '#6366f1',
      onPress: () => navigation.navigate('SmallGroups'),
    },
    {
      id: 5,
      title: 'Volunteers',
      value: stats.volunteerCommitments.toString(),
      subtitle: 'Active',
      icon: 'hand-right',
      color: '#8b5cf6',
      onPress: () => navigation.navigate('Volunteer'),
    },
    {
      id: 6,
      title: 'Prayers',
      value: stats.prayerRequests.toString(),
      subtitle: 'Requests',
      icon: 'hand-left',
      color: '#ec4899',
      onPress: () => navigation.navigate('Prayer'),
    },
    {
      id: 7,
      title: 'Notes',
      value: stats.sermonNotes.toString(),
      subtitle: 'Sermon notes',
      icon: 'document-text',
      color: '#06b6d4',
      onPress: () => navigation.navigate('SermonNotes'),
    },
    {
      id: 8,
      title: 'Bookmarks',
      value: stats.bookmarks.toString(),
      subtitle: 'Devotionals',
      icon: 'bookmark',
      color: '#14b8a6',
      onPress: () => navigation.navigate('Devotional'),
    },
  ];

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading your activity...</Text>
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
          <Text style={styles.headerTitle}>My Activity</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statCards.map((stat) => (
            <TouchableOpacity
              key={stat.id}
              style={styles.statCard}
              onPress={stat.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                <Ionicons name={stat.icon} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
              <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentActivity.length > 0 ? (
            <View style={styles.timeline}>
              {recentActivity.map((activity, index) => (
                <View key={activity.id} style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: activity.color }]}>
                    <Ionicons name={activity.icon} size={16} color="#fff" />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>{activity.title}</Text>
                    <Text style={styles.timelineDate}>{formatDate(activity.date)}</Text>
                  </View>
                  {index < recentActivity.length - 1 && <View style={styles.timelineLine} />}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyStateText}>No recent activity</Text>
            </View>
          )}
        </View>

        {/* My Events */}
        {myEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Events</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Events')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {myEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.itemCard}
                onPress={() => navigation.navigate('EventDetails', { eventId: event.eventId })}
              >
                <Ionicons name="calendar" size={20} color="#f59e0b" />
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{event.eventTitle || 'Event'}</Text>
                  <Text style={styles.itemSubtitle}>
                    Registered {formatDate(event.registeredAt)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* My Groups */}
        {myGroups.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Groups</Text>
              <TouchableOpacity onPress={() => navigation.navigate('SmallGroups')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {myGroups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={styles.itemCard}
                onPress={() => navigation.navigate('SmallGroups')}
              >
                <Ionicons name="people" size={20} color="#6366f1" />
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{group.name}</Text>
                  <Text style={styles.itemSubtitle}>{group.type}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* My Volunteer Commitments */}
        {myVolunteers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Volunteer Commitments</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Volunteer')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {myVolunteers.map((volunteer) => (
              <View key={volunteer.id} style={styles.itemCard}>
                <Ionicons name="hand-right" size={20} color="#8b5cf6" />
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{volunteer.opportunityName || 'Volunteer Opportunity'}</Text>
                  <View style={styles.statusBadge}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor:
                            volunteer.status === 'approved'
                              ? '#10b981'
                              : volunteer.status === 'pending'
                              ? '#f59e0b'
                              : '#6b7280',
                        },
                      ]}
                    />
                    <Text style={styles.statusText}>
                      {volunteer.status === 'approved'
                        ? 'Approved'
                        : volunteer.status === 'pending'
                        ? 'Pending'
                        : 'Other'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* My Prayer Requests */}
        {myPrayers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Prayer Requests</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Prayer')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {myPrayers.map((prayer) => (
              <TouchableOpacity
                key={prayer.id}
                style={styles.itemCard}
                onPress={() => navigation.navigate('Prayer')}
              >
                <Ionicons name="hand-left" size={20} color="#ec4899" />
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{prayer.title || 'Prayer Request'}</Text>
                  <Text style={styles.itemSubtitle}>
                    {prayer.prayers || 0} prayers • {formatDate(prayer.createdAt)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
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
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 8,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  timeline: {
    position: 'relative',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
    position: 'relative',
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 32,
    width: 2,
    height: 20,
    backgroundColor: '#e5e7eb',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
});

