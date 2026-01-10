import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../../firebase.config';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from 'firebase/firestore';

export default function MemberActivityScreen({ navigation, route }) {
  const { memberId, memberName } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(memberId ? { id: memberId, displayName: memberName } : null);
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [memberStats, setMemberStats] = useState({
    totalCheckIns: 0,
    thisMonthCheckIns: 0,
    totalGiving: 0,
    registeredEvents: 0,
    volunteerCommitments: 0,
    prayerRequests: 0,
    sermonNotes: 0,
    bookmarks: 0,
    groupsJoined: 0,
  });
  const [activityTimeline, setActivityTimeline] = useState([]);
  const [showMemberSelector, setShowMemberSelector] = useState(!memberId);

  useEffect(() => {
    if (memberId) {
      loadMemberActivity(memberId);
    } else {
      loadMembers();
    }
  }, [memberId]);

  useEffect(() => {
    filterMembers();
  }, [searchQuery, members]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      const membersList = [];

      snapshot.forEach((doc) => {
        membersList.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Sort by name
      membersList.sort((a, b) => {
        const nameA = (a.displayName || a.email || '').toLowerCase();
        const nameB = (b.displayName || b.email || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setMembers(membersList);
      setFilteredMembers(membersList);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    if (!searchQuery) {
      setFilteredMembers(members);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = members.filter(
      (member) =>
        member.displayName?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query) ||
        member.phoneNumber?.includes(query)
    );
    setFilteredMembers(filtered);
  };

  const loadMemberActivity = async (userId) => {
    try {
      setLoading(true);
      setRefreshing(false);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Helper function to safely load collections with error handling
      const safeGetDocs = async (collectionRef, queryFn = null) => {
        try {
          if (queryFn) {
            return await getDocs(queryFn(collectionRef));
          }
          return await getDocs(collectionRef);
        } catch (error) {
          // Only log non-permission errors
          if (error.code !== 'permission-denied') {
            console.warn(`Error loading ${collectionRef.id}:`, error.message);
          }
          // Return empty snapshot-like object
          return {
            size: 0,
            forEach: () => {},
            docs: [],
          };
        }
      };

      // Load all activity data in parallel with error handling
      const [
        checkInsSnapshot,
        givingSnapshot,
        donationsSnapshot,
        eventsSnapshot,
        volunteersSnapshot,
        prayersSnapshot,
        notesSnapshot,
        bookmarksSnapshot,
        groupsSnapshot,
        ministriesSnapshot,
      ] = await Promise.all([
        safeGetDocs(collection(db, 'checkIns'), (col) => query(col, where('userId', '==', userId))),
        safeGetDocs(collection(db, 'giving'), (col) => query(col, where('userId', '==', userId))),
        safeGetDocs(collection(db, 'donations'), (col) => query(col, where('userId', '==', userId))),
        safeGetDocs(collection(db, 'eventRegistrations'), (col) => query(col, where('userId', '==', userId))),
        safeGetDocs(collection(db, 'volunteerApplications'), (col) => query(col, where('userId', '==', userId))),
        safeGetDocs(collection(db, 'prayerRequests'), (col) => query(col, where('userId', '==', userId))),
        safeGetDocs(collection(db, 'sermonNotes'), (col) => query(col, where('userId', '==', userId))),
        safeGetDocs(collection(db, 'devotionalBookmarks'), (col) => query(col, where('userId', '==', userId))),
        safeGetDocs(collection(db, 'smallGroups')),
        safeGetDocs(collection(db, 'ministries')),
      ]);

      // Calculate check-ins
      let totalCheckIns = 0;
      let thisMonthCheckIns = 0;
      const checkInActivities = [];

      if (checkInsSnapshot && checkInsSnapshot.forEach) {
        checkInsSnapshot.forEach((doc) => {
        totalCheckIns++;
        const data = doc.data();
        const checkInDate = new Date(data.checkedInAt || data.createdAt || 0);
        if (checkInDate >= startOfMonth) {
          thisMonthCheckIns++;
        }
        checkInActivities.push({
          id: `checkin-${doc.id}`,
          type: 'checkin',
          title: `Checked in to ${data.service || 'Service'}`,
          date: data.checkedInAt || data.createdAt,
          icon: 'checkbox',
          color: '#10b981',
        });
        });
      }

      // Calculate giving (from both donations and giving collections)
      let totalGiving = 0;
      const givingActivities = [];

      // Process donations collection
      if (donationsSnapshot && donationsSnapshot.forEach) {
        donationsSnapshot.forEach((doc) => {
          const data = doc.data();
          const amount = parseFloat(data.amount || 0);
          const status = data.status || 'completed';
          // Only count completed or pending donations
          if (status === 'completed' || status === 'pending') {
            totalGiving += amount;
            givingActivities.push({
              id: `donation-${doc.id}`,
              type: 'giving',
              title: `Gave GH₵${amount.toFixed(2)} - ${data.category || 'General'}`,
              date: data.createdAt || data.date,
              icon: 'heart',
              color: '#ef4444',
            });
          }
        });
      }

      // Process giving collection (fallback)
      if (givingSnapshot && givingSnapshot.forEach) {
        givingSnapshot.forEach((doc) => {
          const data = doc.data();
          const amount = parseFloat(data.amount || 0);
          totalGiving += amount;
          givingActivities.push({
            id: `giving-${doc.id}`,
            type: 'giving',
            title: `Gave GH₵${amount.toFixed(2)} - ${data.category || 'General'}`,
            date: data.createdAt || data.date,
            icon: 'heart',
            color: '#ef4444',
          });
        });
      }

      // Calculate events
      const registeredEvents = eventsSnapshot && eventsSnapshot.size ? eventsSnapshot.size : 0;
      const eventActivities = [];

      if (eventsSnapshot && eventsSnapshot.forEach) {
        eventsSnapshot.forEach((doc) => {
        const data = doc.data();
        eventActivities.push({
          id: `event-${doc.id}`,
          type: 'event',
          title: `Registered for ${data.eventTitle || 'Event'}`,
          date: data.registeredAt || data.createdAt,
          icon: 'calendar',
          color: '#f59e0b',
        });
        });
      }

      // Calculate volunteers
      let activeVolunteers = 0;
      if (volunteersSnapshot && volunteersSnapshot.forEach) {
        volunteersSnapshot.forEach((doc) => {
        const data = doc.data();
          if (data.status === 'approved' || data.status === 'pending') {
            activeVolunteers++;
          }
        });
      }

      // Calculate prayers
      const prayerRequests = prayersSnapshot && prayersSnapshot.size ? prayersSnapshot.size : 0;
      const prayerActivities = [];

      if (prayersSnapshot && prayersSnapshot.forEach) {
        prayersSnapshot.forEach((doc) => {
        const data = doc.data();
        prayerActivities.push({
          id: `prayer-${doc.id}`,
          type: 'prayer',
          title: `Submitted: ${data.title || 'Prayer Request'}`,
          date: data.createdAt,
          icon: 'hand-left',
          color: '#8b5cf6',
        });
        });
      }

      // Calculate notes and bookmarks
      const sermonNotes = notesSnapshot && notesSnapshot.size ? notesSnapshot.size : 0;
      const bookmarks = bookmarksSnapshot && bookmarksSnapshot.size ? bookmarksSnapshot.size : 0;

      // Calculate groups
      let groupsJoined = 0;
      if (groupsSnapshot && groupsSnapshot.forEach) {
        groupsSnapshot.forEach((doc) => {
        const data = doc.data();
          if (data.members && data.members.includes(userId)) {
            groupsJoined++;
          }
        });
      }

      if (ministriesSnapshot && ministriesSnapshot.forEach) {
        ministriesSnapshot.forEach((doc) => {
        const data = doc.data();
          if (data.members && data.members.includes(userId)) {
            groupsJoined++;
          }
        });
      }

      // Combine all activities and sort
      const allActivities = [
        ...checkInActivities,
        ...givingActivities,
        ...eventActivities,
        ...prayerActivities,
      ];

      allActivities.sort((a, b) => {
        const dateA = new Date(a.date?.toDate?.() || a.date || 0);
        const dateB = new Date(b.date?.toDate?.() || b.date || 0);
        return dateB - dateA;
      });

      setMemberStats({
        totalCheckIns,
        thisMonthCheckIns,
        totalGiving,
        registeredEvents,
        volunteerCommitments: activeVolunteers,
        prayerRequests,
        sermonNotes,
        bookmarks,
        groupsJoined,
      });

      setActivityTimeline(allActivities.slice(0, 50));
    } catch (error) {
      console.error('Error loading member activity:', error);
      // Don't show error to user if it's just a permissions issue for optional collections
      if (error.code !== 'permission-denied') {
        Alert.alert('Error', 'Failed to load some member activity data. Please check Firebase permissions.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedMember) {
      await loadMemberActivity(selectedMember.id);
    } else {
      await loadMembers();
    }
    setRefreshing(false);
  };

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setShowMemberSelector(false);
    loadMemberActivity(member.id);
  };

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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const statCards = [
    {
      id: 1,
      title: 'Check-Ins',
      value: memberStats.totalCheckIns.toString(),
      subtitle: `${memberStats.thisMonthCheckIns} this month`,
      icon: 'checkbox',
      color: '#10b981',
    },
    {
      id: 2,
      title: 'Total Giving',
      value: `GH₵${memberStats.totalGiving.toFixed(2)}`,
      subtitle: 'All time',
      icon: 'heart',
      color: '#ef4444',
    },
    {
      id: 3,
      title: 'Events',
      value: memberStats.registeredEvents.toString(),
      subtitle: 'Registered',
      icon: 'calendar',
      color: '#f59e0b',
    },
    {
      id: 4,
      title: 'Groups',
      value: memberStats.groupsJoined.toString(),
      subtitle: 'Joined',
      icon: 'people',
      color: '#6366f1',
    },
    {
      id: 5,
      title: 'Volunteers',
      value: memberStats.volunteerCommitments.toString(),
      subtitle: 'Active',
      icon: 'hand-right',
      color: '#8b5cf6',
    },
    {
      id: 6,
      title: 'Prayers',
      value: memberStats.prayerRequests.toString(),
      subtitle: 'Requests',
      icon: 'hand-left',
      color: '#ec4899',
    },
    {
      id: 7,
      title: 'Notes',
      value: memberStats.sermonNotes.toString(),
      subtitle: 'Sermon notes',
      icon: 'document-text',
      color: '#06b6d4',
    },
    {
      id: 8,
      title: 'Bookmarks',
      value: memberStats.bookmarks.toString(),
      subtitle: 'Devotionals',
      icon: 'bookmark',
      color: '#14b8a6',
    },
  ];

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading activity...</Text>
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
          <Text style={styles.headerTitle}>
            {selectedMember ? `${selectedMember.displayName || 'Member'}'s Activity` : 'Member Activity'}
          </Text>
          <TouchableOpacity
            onPress={() => setShowMemberSelector(true)}
            style={styles.selectButton}
          >
            <Ionicons name="people" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {!selectedMember ? (
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select a Member</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search members..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
            />
          </View>
          <FlatList
            data={filteredMembers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.memberCard}
                onPress={() => handleSelectMember(item)}
              >
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {(item.displayName || item.email || 'M')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{item.displayName || item.email || 'Member'}</Text>
                  <Text style={styles.memberEmail}>{item.email}</Text>
                  {item.phoneNumber && (
                    <Text style={styles.memberPhone}>{item.phoneNumber}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyStateText}>No members found</Text>
              </View>
            }
          />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {statCards.map((stat) => (
              <View key={stat.id} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                  <Ionicons name={stat.icon} size={24} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
                <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
              </View>
            ))}
          </View>

          {/* Activity Timeline */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Timeline</Text>
            {activityTimeline.length > 0 ? (
              <View style={styles.timeline}>
                {activityTimeline.map((activity, index) => (
                  <View key={activity.id} style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: activity.color }]}>
                      <Ionicons name={activity.icon} size={16} color="#fff" />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>{activity.title}</Text>
                      <Text style={styles.timelineDate}>{formatDate(activity.date)}</Text>
                    </View>
                    {index < activityTimeline.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyStateText}>No activity recorded</Text>
              </View>
            )}
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* Member Selector Modal */}
      <Modal
        visible={showMemberSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMemberSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Member</Text>
              <TouchableOpacity onPress={() => setShowMemberSelector(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search members..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
            />
            <FlatList
              data={filteredMembers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.memberCard}
                  onPress={() => handleSelectMember(item)}
                >
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {(item.displayName || item.email || 'M')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.displayName || item.email || 'Member'}</Text>
                    <Text style={styles.memberEmail}>{item.email}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={48} color="#d1d5db" />
                  <Text style={styles.emptyStateText}>No members found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginLeft: 8,
  },
  selectButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  memberPhone: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
});

