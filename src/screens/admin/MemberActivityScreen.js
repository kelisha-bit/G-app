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
  orderBy,
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
    lastMonthCheckIns: 0,
    totalGiving: 0,
    thisMonthGiving: 0,
    lastMonthGiving: 0,
    registeredEvents: 0,
    volunteerCommitments: 0,
    prayerRequests: 0,
    sermonNotes: 0,
    bookmarks: 0,
    groupsJoined: 0,
    lastActive: null,
    engagementScore: 0,
    activityStreak: 0,
    averageGivingPerMonth: 0,
  });
  const [activityTimeline, setActivityTimeline] = useState([]);
  const [filteredTimeline, setFilteredTimeline] = useState([]);
  const [showMemberSelector, setShowMemberSelector] = useState(!memberId);
  const [expandedActivities, setExpandedActivities] = useState(new Set());
  const [activityFilter, setActivityFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [detailedStats, setDetailedStats] = useState({
    givingByCategory: {},
    groupsList: [],
    ministriesList: [],
    volunteerRoles: [],
    monthlyActivity: {},
    activityByDayOfWeek: {},
    eventDetails: [],
  });

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

  useEffect(() => {
    applyFilters();
  }, [activityFilter, dateRangeFilter, activityTimeline]);

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

  const applyFilters = () => {
    let filtered = [...activityTimeline];

    // Filter by activity type
    if (activityFilter !== 'all') {
      filtered = filtered.filter((activity) => activity.type === activityFilter);
    }

    // Filter by date range
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      let startDate;
      switch (dateRangeFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case '3months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        filtered = filtered.filter((activity) => {
          const activityDate = new Date(activity.date?.toDate?.() || activity.date || 0);
          return activityDate >= startDate;
        });
      }
    }

    setFilteredTimeline(filtered);
  };

  const toggleActivityExpansion = (activityId) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  const loadMemberActivity = async (userId) => {
    try {
      setLoading(true);
      setRefreshing(false);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Helper function to safely load collections with error handling
      const safeGetDocs = async (collectionRef, queryFn = null) => {
        try {
          if (queryFn) {
            return await getDocs(queryFn(collectionRef));
          }
          return await getDocs(collectionRef);
        } catch (error) {
          if (error.code !== 'permission-denied') {
            console.warn(`Error loading ${collectionRef.id}:`, error.message);
          }
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
        eventsCollectionSnapshot,
      ] = await Promise.all([
        safeGetDocs(collection(db, 'checkIns'), (col) => query(col, where('userId', '==', userId), orderBy('checkedInAt', 'desc'))),
        safeGetDocs(collection(db, 'giving'), (col) => query(col, where('userId', '==', userId))),
        safeGetDocs(collection(db, 'donations'), (col) => query(col, where('userId', '==', userId), orderBy('createdAt', 'desc'))),
        safeGetDocs(collection(db, 'eventRegistrations'), (col) => query(col, where('userId', '==', userId))),
        safeGetDocs(collection(db, 'volunteerApplications'), (col) => query(col, where('userId', '==', userId))),
        safeGetDocs(collection(db, 'prayerRequests'), (col) => query(col, where('userId', '==', userId), orderBy('createdAt', 'desc'))),
        safeGetDocs(collection(db, 'sermonNotes'), (col) => query(col, where('userId', '==', userId))),
        safeGetDocs(collection(db, 'devotionalBookmarks'), (col) => query(col, where('userId', '==', userId))),
        safeGetDocs(collection(db, 'smallGroups')),
        safeGetDocs(collection(db, 'ministries')),
        safeGetDocs(collection(db, 'events')),
      ]);

      // Create events map for lookup
      const eventsMap = {};
      if (eventsCollectionSnapshot && eventsCollectionSnapshot.forEach) {
        eventsCollectionSnapshot.forEach((doc) => {
          eventsMap[doc.id] = doc.data();
        });
      }

      // Calculate check-ins
      let totalCheckIns = 0;
      let thisMonthCheckIns = 0;
      let lastMonthCheckIns = 0;
      const checkInActivities = [];
      const activityByDayOfWeek = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      const monthlyActivity = {};

      if (checkInsSnapshot && checkInsSnapshot.forEach) {
        checkInsSnapshot.forEach((doc) => {
          totalCheckIns++;
          const data = doc.data();
          const checkInDate = new Date(data.checkedInAt?.toDate?.() || data.checkedInAt || data.createdAt?.toDate?.() || data.createdAt || 0);
          
          // Monthly breakdown
          const monthKey = `${checkInDate.getFullYear()}-${String(checkInDate.getMonth() + 1).padStart(2, '0')}`;
          monthlyActivity[monthKey] = (monthlyActivity[monthKey] || 0) + 1;
          
          // Day of week
          activityByDayOfWeek[checkInDate.getDay()] = (activityByDayOfWeek[checkInDate.getDay()] || 0) + 1;

          if (checkInDate >= startOfMonth) {
            thisMonthCheckIns++;
          }
          if (checkInDate >= startOfLastMonth && checkInDate <= endOfLastMonth) {
            lastMonthCheckIns++;
          }

          checkInActivities.push({
            id: `checkin-${doc.id}`,
            type: 'checkin',
            title: `Checked in to ${data.service || 'Service'}`,
            date: data.checkedInAt || data.createdAt,
            details: {
              service: data.service || 'Service',
              location: data.location || 'Not specified',
              checkedInAt: checkInDate,
            },
            icon: 'checkbox',
            color: '#10b981',
          });
        });
      }

      // Calculate giving (from both donations and giving collections)
      let totalGiving = 0;
      let thisMonthGiving = 0;
      let lastMonthGiving = 0;
      const givingActivities = [];
      const givingByCategory = {};

      // Process donations collection
      if (donationsSnapshot && donationsSnapshot.forEach) {
        donationsSnapshot.forEach((doc) => {
          const data = doc.data();
          const amount = parseFloat(data.amount || 0);
          const status = data.status || 'completed';
          const category = data.category || 'General';
          const donationDate = new Date(data.createdAt?.toDate?.() || data.createdAt || data.date || 0);

          if (status === 'completed' || status === 'pending') {
            totalGiving += amount;
            givingByCategory[category] = (givingByCategory[category] || 0) + amount;

            if (donationDate >= startOfMonth) {
              thisMonthGiving += amount;
            }
            if (donationDate >= startOfLastMonth && donationDate <= endOfLastMonth) {
              lastMonthGiving += amount;
            }

            givingActivities.push({
              id: `donation-${doc.id}`,
              type: 'giving',
              title: `Gave GH₵${amount.toFixed(2)} - ${category}`,
              date: data.createdAt || data.date,
              details: {
                amount: amount,
                category: category,
                method: data.method || 'Not specified',
                status: status,
                transactionId: data.transactionId || 'N/A',
              },
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
          const category = data.category || 'General';
          totalGiving += amount;
          givingByCategory[category] = (givingByCategory[category] || 0) + amount;
          givingActivities.push({
            id: `giving-${doc.id}`,
            type: 'giving',
            title: `Gave GH₵${amount.toFixed(2)} - ${category}`,
            date: data.createdAt || data.date,
            details: {
              amount: amount,
              category: category,
              method: data.method || 'Not specified',
            },
            icon: 'heart',
            color: '#ef4444',
          });
        });
      }

      // Calculate events
      const registeredEvents = eventsSnapshot && eventsSnapshot.size ? eventsSnapshot.size : 0;
      const eventActivities = [];
      const eventDetails = [];

      if (eventsSnapshot && eventsSnapshot.forEach) {
        eventsSnapshot.forEach((doc) => {
          const data = doc.data();
          const eventData = eventsMap[data.eventId] || {};
          const eventDate = new Date(data.registeredAt?.toDate?.() || data.createdAt?.toDate?.() || data.createdAt || 0);
          
          eventActivities.push({
            id: `event-${doc.id}`,
            type: 'event',
            title: `Registered for ${data.eventTitle || eventData.title || 'Event'}`,
            date: data.registeredAt || data.createdAt,
            details: {
              eventTitle: data.eventTitle || eventData.title || 'Event',
              eventDate: eventData.date || 'Not specified',
              eventTime: eventData.time || 'Not specified',
              eventLocation: eventData.location || 'Not specified',
              category: eventData.category || 'Not specified',
            },
            icon: 'calendar',
            color: '#f59e0b',
          });

          eventDetails.push({
            id: doc.id,
            title: data.eventTitle || eventData.title || 'Event',
            date: eventData.date,
            registeredAt: eventDate,
          });
        });
      }

      // Calculate volunteers
      let activeVolunteers = 0;
      const volunteerRoles = [];
      if (volunteersSnapshot && volunteersSnapshot.forEach) {
        volunteersSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'approved' || data.status === 'pending') {
            activeVolunteers++;
            volunteerRoles.push({
              id: doc.id,
              role: data.role || data.position || 'Volunteer',
              department: data.department || 'Not specified',
              status: data.status,
            });
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
            details: {
              title: data.title || 'Prayer Request',
              description: data.description || 'No description',
              isAnonymous: data.isAnonymous || false,
              prayedBy: data.prayedBy || 0,
            },
            icon: 'hand-left',
            color: '#8b5cf6',
          });
        });
      }

      // Calculate notes and bookmarks
      const sermonNotes = notesSnapshot && notesSnapshot.size ? notesSnapshot.size : 0;
      const bookmarks = bookmarksSnapshot && bookmarksSnapshot.size ? bookmarksSnapshot.size : 0;

      // Calculate groups and ministries with names
      let groupsJoined = 0;
      const groupsList = [];
      const ministriesList = [];

      if (groupsSnapshot && groupsSnapshot.forEach) {
        groupsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.members && data.members.includes(userId)) {
            groupsJoined++;
            groupsList.push({
              id: doc.id,
              name: data.name || 'Unnamed Group',
              description: data.description || '',
              leader: data.leader || 'Not specified',
            });
          }
        });
      }

      if (ministriesSnapshot && ministriesSnapshot.forEach) {
        ministriesSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.members && data.members.includes(userId)) {
            groupsJoined++;
            ministriesList.push({
              id: doc.id,
              name: data.name || 'Unnamed Ministry',
              description: data.description || '',
              leader: data.leader || 'Not specified',
            });
          }
        });
      }

      // Calculate last active date
      const allActivityDates = [
        ...checkInActivities.map(a => a.date),
        ...givingActivities.map(a => a.date),
        ...eventActivities.map(a => a.date),
        ...prayerActivities.map(a => a.date),
      ].filter(Boolean);

      let lastActive = null;
      if (allActivityDates.length > 0) {
        const dates = allActivityDates.map(d => new Date(d?.toDate?.() || d || 0));
        dates.sort((a, b) => b - a);
        lastActive = dates[0];
      }

      // Calculate engagement score (0-100)
      const engagementScore = Math.min(100, Math.round(
        (totalCheckIns * 2) +
        (registeredEvents * 3) +
        (activeVolunteers * 5) +
        (prayerRequests * 2) +
        (sermonNotes * 1) +
        (bookmarks * 1) +
        (groupsJoined * 4) +
        (totalGiving > 0 ? 10 : 0)
      ));

      // Calculate activity streak (consecutive weeks with activity)
      let activityStreak = 0;
      if (allActivityDates.length > 0) {
        const sortedDates = allActivityDates
          .map(d => new Date(d?.toDate?.() || d || 0))
          .sort((a, b) => b - a);
        
        const weeksWithActivity = new Set();
        sortedDates.forEach(date => {
          const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
          weeksWithActivity.add(weekKey);
        });

        const weeks = Array.from(weeksWithActivity).sort().reverse();
        let currentStreak = 0;
        const now = new Date();
        const currentWeek = `${now.getFullYear()}-W${getWeekNumber(now)}`;

        for (let i = 0; i < weeks.length; i++) {
          if (weeks[i] === currentWeek || weeks[i] === getPreviousWeek(currentWeek)) {
            currentStreak++;
            if (i > 0) {
              const prevWeek = getPreviousWeek(weeks[i - 1]);
              if (weeks[i] === prevWeek) {
                currentStreak++;
              } else {
                break;
              }
            }
          }
        }
        activityStreak = currentStreak;
      }

      // Calculate average giving per month
      const monthsWithGiving = Object.keys(monthlyActivity).length || 1;
      const averageGivingPerMonth = totalGiving / monthsWithGiving;

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
        lastMonthCheckIns,
        totalGiving,
        thisMonthGiving,
        lastMonthGiving,
        registeredEvents,
        volunteerCommitments: activeVolunteers,
        prayerRequests,
        sermonNotes,
        bookmarks,
        groupsJoined,
        lastActive,
        engagementScore,
        activityStreak,
        averageGivingPerMonth,
      });

      setDetailedStats({
        givingByCategory,
        groupsList,
        ministriesList,
        volunteerRoles,
        monthlyActivity,
        activityByDayOfWeek,
        eventDetails,
      });

      setActivityTimeline(allActivities);
      setFilteredTimeline(allActivities);
    } catch (error) {
      console.error('Error loading member activity:', error);
      if (error.code !== 'permission-denied') {
        Alert.alert('Error', 'Failed to load some member activity data. Please check Firebase permissions.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  const getPreviousWeek = (weekKey) => {
    const [year, week] = weekKey.split('-W').map(Number);
    if (week === 1) {
      return `${year - 1}-W52`;
    }
    return `${year}-W${week - 1}`;
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

  const formatFullDate = (dateValue) => {
    if (!dateValue) return 'Not available';
    const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDayName = (dayIndex) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  };

  const renderActivityItem = ({ item, index }) => {
    const isExpanded = expandedActivities.has(item.id);
    const hasDetails = item.details && Object.keys(item.details).length > 0;

    return (
      <View key={item.id} style={styles.timelineItem}>
        <View style={[styles.timelineDot, { backgroundColor: item.color }]}>
          <Ionicons name={item.icon} size={16} color="#fff" />
        </View>
        <View style={styles.timelineContent}>
          <TouchableOpacity
            onPress={() => hasDetails && toggleActivityExpansion(item.id)}
            activeOpacity={hasDetails ? 0.7 : 1}
          >
            <Text style={styles.timelineTitle}>{item.title}</Text>
            <Text style={styles.timelineDate}>{formatDate(item.date)}</Text>
            
            {isExpanded && hasDetails && (
              <View style={styles.activityDetails}>
                {Object.entries(item.details).map(([key, value]) => (
                  <View key={key} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:</Text>
                    <Text style={styles.detailValue}>
                      {value instanceof Date ? formatFullDate(value) : String(value)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            
            {hasDetails && (
              <TouchableOpacity
                onPress={() => toggleActivityExpansion(item.id)}
                style={styles.expandButton}
              >
                <Ionicons 
                  name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color="#6366f1" 
                />
                <Text style={styles.expandButtonText}>
                  {isExpanded ? 'Show less' : 'Show details'}
                </Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
        {index < filteredTimeline.length - 1 && <View style={styles.timelineLine} />}
      </View>
    );
  };

  const statCards = [
    {
      id: 1,
      title: 'Check-Ins',
      value: memberStats.totalCheckIns.toString(),
      subtitle: `${memberStats.thisMonthCheckIns} this month`,
      icon: 'checkbox',
      color: '#10b981',
      trend: memberStats.lastMonthCheckIns > 0 
        ? ((memberStats.thisMonthCheckIns - memberStats.lastMonthCheckIns) / memberStats.lastMonthCheckIns * 100).toFixed(0)
        : null,
    },
    {
      id: 2,
      title: 'Total Giving',
      value: `GH₵${memberStats.totalGiving.toFixed(2)}`,
      subtitle: `Avg: GH₵${memberStats.averageGivingPerMonth.toFixed(2)}/mo`,
      icon: 'heart',
      color: '#ef4444',
      trend: memberStats.lastMonthGiving > 0
        ? ((memberStats.thisMonthGiving - memberStats.lastMonthGiving) / memberStats.lastMonthGiving * 100).toFixed(0)
        : null,
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
          {/* Engagement Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Engagement Overview</Text>
            <View style={styles.engagementCard}>
              <View style={styles.engagementItem}>
                <Ionicons name="trophy" size={24} color="#f59e0b" />
                <View style={styles.engagementItemContent}>
                  <Text style={styles.engagementLabel}>Engagement Score</Text>
                  <Text style={styles.engagementValue}>{memberStats.engagementScore}/100</Text>
                </View>
              </View>
              <View style={styles.engagementItem}>
                <Ionicons name="flame" size={24} color="#ef4444" />
                <View style={styles.engagementItemContent}>
                  <Text style={styles.engagementLabel}>Activity Streak</Text>
                  <Text style={styles.engagementValue}>{memberStats.activityStreak} weeks</Text>
                </View>
              </View>
              <View style={styles.engagementItem}>
                <Ionicons name="time" size={24} color="#6366f1" />
                <View style={styles.engagementItemContent}>
                  <Text style={styles.engagementLabel}>Last Active</Text>
                  <Text style={styles.engagementValue}>
                    {memberStats.lastActive ? formatDate(memberStats.lastActive) : 'Never'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

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
                {stat.trend !== null && (
                  <View style={styles.trendContainer}>
                    <Ionicons 
                      name={parseFloat(stat.trend) >= 0 ? 'trending-up' : 'trending-down'} 
                      size={12} 
                      color={parseFloat(stat.trend) >= 0 ? '#10b981' : '#ef4444'} 
                    />
                    <Text style={[
                      styles.trendText,
                      { color: parseFloat(stat.trend) >= 0 ? '#10b981' : '#ef4444' }
                    ]}>
                      {Math.abs(parseFloat(stat.trend))}%
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Detailed Breakdowns */}
          {Object.keys(detailedStats.givingByCategory).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Giving by Category</Text>
              {Object.entries(detailedStats.givingByCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([category, amount]) => (
                  <View key={category} style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>{category}</Text>
                    <Text style={styles.breakdownValue}>GH₵{amount.toFixed(2)}</Text>
                  </View>
                ))}
            </View>
          )}

          {(detailedStats.groupsList.length > 0 || detailedStats.ministriesList.length > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Groups & Ministries</Text>
              {detailedStats.groupsList.map((group) => (
                <View key={group.id} style={styles.groupItem}>
                  <Ionicons name="people" size={20} color="#6366f1" />
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupDetails}>Leader: {group.leader}</Text>
                  </View>
                </View>
              ))}
              {detailedStats.ministriesList.map((ministry) => (
                <View key={ministry.id} style={styles.groupItem}>
                  <Ionicons name="business" size={20} color="#8b5cf6" />
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{ministry.name}</Text>
                    <Text style={styles.groupDetails}>Leader: {ministry.leader}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {detailedStats.volunteerRoles.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Volunteer Roles</Text>
              {detailedStats.volunteerRoles.map((volunteer) => (
                <View key={volunteer.id} style={styles.volunteerItem}>
                  <Ionicons name="hand-right" size={20} color="#8b5cf6" />
                  <View style={styles.volunteerInfo}>
                    <Text style={styles.volunteerRole}>{volunteer.role}</Text>
                    <Text style={styles.volunteerDetails}>
                      {volunteer.department} • {volunteer.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Activity Distribution */}
          {Object.values(detailedStats.activityByDayOfWeek).some(v => v > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Activity by Day of Week</Text>
              {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                const count = detailedStats.activityByDayOfWeek[dayIndex] || 0;
                const maxCount = Math.max(...Object.values(detailedStats.activityByDayOfWeek));
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                
                return (
                  <View key={dayIndex} style={styles.dayDistributionItem}>
                    <Text style={styles.dayName}>{getDayName(dayIndex)}</Text>
                    <View style={styles.dayBarContainer}>
                      <View style={[styles.dayBar, { width: `${percentage}%` }]} />
                    </View>
                    <Text style={styles.dayCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Filters */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Timeline</Text>
            <View style={styles.filterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <TouchableOpacity
                  style={[styles.filterChip, activityFilter === 'all' && styles.filterChipActive]}
                  onPress={() => setActivityFilter('all')}
                >
                  <Text style={[styles.filterChipText, activityFilter === 'all' && styles.filterChipTextActive]}>
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, activityFilter === 'checkin' && styles.filterChipActive]}
                  onPress={() => setActivityFilter('checkin')}
                >
                  <Text style={[styles.filterChipText, activityFilter === 'checkin' && styles.filterChipTextActive]}>
                    Check-ins
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, activityFilter === 'giving' && styles.filterChipActive]}
                  onPress={() => setActivityFilter('giving')}
                >
                  <Text style={[styles.filterChipText, activityFilter === 'giving' && styles.filterChipTextActive]}>
                    Giving
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, activityFilter === 'event' && styles.filterChipActive]}
                  onPress={() => setActivityFilter('event')}
                >
                  <Text style={[styles.filterChipText, activityFilter === 'event' && styles.filterChipTextActive]}>
                    Events
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, activityFilter === 'prayer' && styles.filterChipActive]}
                  onPress={() => setActivityFilter('prayer')}
                >
                  <Text style={[styles.filterChipText, activityFilter === 'prayer' && styles.filterChipTextActive]}>
                    Prayers
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
            <View style={styles.filterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <TouchableOpacity
                  style={[styles.filterChip, dateRangeFilter === 'all' && styles.filterChipActive]}
                  onPress={() => setDateRangeFilter('all')}
                >
                  <Text style={[styles.filterChipText, dateRangeFilter === 'all' && styles.filterChipTextActive]}>
                    All Time
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, dateRangeFilter === '3months' && styles.filterChipActive]}
                  onPress={() => setDateRangeFilter('3months')}
                >
                  <Text style={[styles.filterChipText, dateRangeFilter === '3months' && styles.filterChipTextActive]}>
                    Last 3 Months
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, dateRangeFilter === 'month' && styles.filterChipActive]}
                  onPress={() => setDateRangeFilter('month')}
                >
                  <Text style={[styles.filterChipText, dateRangeFilter === 'month' && styles.filterChipTextActive]}>
                    This Month
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, dateRangeFilter === 'week' && styles.filterChipActive]}
                  onPress={() => setDateRangeFilter('week')}
                >
                  <Text style={[styles.filterChipText, dateRangeFilter === 'week' && styles.filterChipTextActive]}>
                    This Week
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, dateRangeFilter === 'today' && styles.filterChipActive]}
                  onPress={() => setDateRangeFilter('today')}
                >
                  <Text style={[styles.filterChipText, dateRangeFilter === 'today' && styles.filterChipTextActive]}>
                    Today
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
            {filteredTimeline.length > 0 ? (
              <View style={styles.timeline}>
                <FlatList
                  data={filteredTimeline}
                  keyExtractor={(item) => item.id}
                  renderItem={renderActivityItem}
                  scrollEnabled={false}
                />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyStateText}>No activity found for selected filters</Text>
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
  engagementCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  engagementItemContent: {
    marginLeft: 12,
    flex: 1,
  },
  engagementLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  engagementValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
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
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  groupInfo: {
    marginLeft: 12,
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  groupDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  volunteerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  volunteerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  volunteerRole: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  volunteerDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  dayDistributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    width: 80,
    fontSize: 14,
    color: '#6b7280',
  },
  dayBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  dayBar: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  dayCount: {
    width: 30,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },
  filterContainer: {
    marginBottom: 12,
  },
  filterScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#6366f1',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  timeline: {
    position: 'relative',
    marginTop: 8,
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
  activityDetails: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    width: 100,
  },
  detailValue: {
    fontSize: 12,
    color: '#111827',
    flex: 1,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  expandButtonText: {
    fontSize: 12,
    color: '#6366f1',
    marginLeft: 4,
    fontWeight: '500',
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
