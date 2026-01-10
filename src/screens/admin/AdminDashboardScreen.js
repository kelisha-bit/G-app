import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Animated,
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
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen({ navigation }) {
  const [selectedPeriod, setSelectedPeriod] = useState('Week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [stats, setStats] = useState([
    { id: 1, title: 'Total Members', value: '0', icon: 'people', color: '#6366f1', change: '+0%', trend: 'up' },
    { id: 2, title: 'This Week Attendance', value: '0', icon: 'checkbox', color: '#10b981', change: '+0%', trend: 'up' },
    { id: 3, title: 'Total Giving', value: 'GH₵0', icon: 'heart', color: '#ef4444', change: '+0%', trend: 'up' },
    { id: 4, title: 'Active Volunteers', value: '0', icon: 'hand-right', color: '#f59e0b', change: '+0%', trend: 'up' },
  ]);
  const [additionalStats, setAdditionalStats] = useState({
    totalDepartments: 0,
    totalMinistries: 0,
    totalSermons: 0,
    totalAnnouncements: 0,
    prayerRequests: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadDashboardData();
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [selectedPeriod]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      setError(null);

      // Calculate period date for comparisons
      const periodDate = getPeriodDate(selectedPeriod);
      const prevPeriodDate = getPreviousPeriodDate(selectedPeriod);

      // Load all data in parallel for better performance
      const [
        usersSnapshot,
        checkInsSnapshot,
        eventsSnapshot,
        sermonsSnapshot,
        departmentsSnapshot,
        ministriesSnapshot,
        prayersSnapshot,
        givingSnapshot,
        announcementsSnapshot,
      ] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'checkIns')),
        getDocs(collection(db, 'events')),
        getDocs(collection(db, 'sermons')),
        getDocs(collection(db, 'departments')),
        getDocs(collection(db, 'ministries')),
        getDocs(collection(db, 'prayerRequests')),
        getDocs(collection(db, 'giving')),
        getDocs(collection(db, 'announcements')),
      ]);

      const totalMembers = usersSnapshot.size;
      const totalCheckIns = checkInsSnapshot.size;

      // Process events
      const eventsData = [];
      eventsSnapshot.forEach((doc) => {
        const data = doc.data();
        eventsData.push({ 
          id: doc.id, 
          ...data,
          date: data.date || data.createdAt || new Date().toISOString()
        });
      });

      // Calculate attendance for the selected period
      let periodCheckIns = 0;
      let prevPeriodCheckIns = 0;
      checkInsSnapshot.forEach((doc) => {
        const checkInDate = doc.data().timestamp || doc.data().createdAt;
        if (checkInDate && new Date(checkInDate) >= new Date(periodDate)) {
          periodCheckIns++;
        }
        if (checkInDate && new Date(checkInDate) >= new Date(prevPeriodDate) && new Date(checkInDate) < new Date(periodDate)) {
          prevPeriodCheckIns++;
        }
      });

      // Calculate member growth
      let newMembers = 0;
      let prevPeriodMembers = 0;
      usersSnapshot.forEach((doc) => {
        const createdAt = doc.data().createdAt;
        if (createdAt && new Date(createdAt) >= new Date(periodDate)) {
          newMembers++;
        }
        if (createdAt && new Date(createdAt) >= new Date(prevPeriodDate) && new Date(createdAt) < new Date(periodDate)) {
          prevPeriodMembers++;
        }
      });

      // Calculate giving totals
      let totalGiving = 0;
      let periodGiving = 0;
      let prevPeriodGiving = 0;
      givingSnapshot.forEach((doc) => {
        const amount = parseFloat(doc.data().amount) || 0;
        totalGiving += amount;
        const givingDate = doc.data().date || doc.data().createdAt;
        if (givingDate && new Date(givingDate) >= new Date(periodDate)) {
          periodGiving += amount;
        }
        if (givingDate && new Date(givingDate) >= new Date(prevPeriodDate) && new Date(givingDate) < new Date(periodDate)) {
          prevPeriodGiving += amount;
        }
      });

      // Count volunteers (users with volunteer role or who have volunteered)
      let activeVolunteers = 0;
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.isVolunteer || userData.volunteerRoles?.length > 0) {
          activeVolunteers++;
        }
      });

      // Calculate trend percentages
      const membersTrend = prevPeriodMembers > 0 
        ? Math.round(((newMembers - prevPeriodMembers) / prevPeriodMembers) * 100)
        : newMembers > 0 ? 100 : 0;
      
      const attendanceTrend = prevPeriodCheckIns > 0 
        ? Math.round(((periodCheckIns - prevPeriodCheckIns) / prevPeriodCheckIns) * 100)
        : periodCheckIns > 0 ? 100 : 0;
      
      const givingTrend = prevPeriodGiving > 0 
        ? Math.round(((periodGiving - prevPeriodGiving) / prevPeriodGiving) * 100)
        : periodGiving > 0 ? 100 : 0;

      // Update stats with calculated values
      setStats([
        { 
          id: 1, 
          title: 'Total Members', 
          value: totalMembers.toString(), 
          icon: 'people', 
          color: '#6366f1', 
          change: `${membersTrend >= 0 ? '+' : ''}${membersTrend}%`,
          trend: membersTrend >= 0 ? 'up' : 'down'
        },
        { 
          id: 2, 
          title: `${selectedPeriod} Attendance`, 
          value: periodCheckIns.toString(), 
          icon: 'checkbox', 
          color: '#10b981', 
          change: `${attendanceTrend >= 0 ? '+' : ''}${attendanceTrend}%`,
          trend: attendanceTrend >= 0 ? 'up' : 'down'
        },
        { 
          id: 3, 
          title: 'Total Giving', 
          value: `GH₵${totalGiving.toFixed(2)}`, 
          icon: 'heart', 
          color: '#ef4444', 
          change: `${givingTrend >= 0 ? '+' : ''}${givingTrend}%`,
          trend: givingTrend >= 0 ? 'up' : 'down'
        },
        { 
          id: 4, 
          title: 'Active Volunteers', 
          value: activeVolunteers.toString(), 
          icon: 'hand-right', 
          color: '#f59e0b', 
          change: '—',
          trend: 'neutral'
        },
      ]);

      // Set additional stats
      setAdditionalStats({
        totalDepartments: departmentsSnapshot.size,
        totalMinistries: ministriesSnapshot.size,
        totalSermons: sermonsSnapshot.size,
        totalAnnouncements: announcementsSnapshot.size,
        prayerRequests: prayersSnapshot.size,
      });

      // Filter upcoming events (next 3)
      const now = new Date();
      const upcoming = eventsData
        .filter(event => new Date(event.date) >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3)
        .map(event => ({
          id: event.id,
          title: event.title,
          date: new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          attendees: event.registrations || 0,
        }));

      setUpcomingEvents(upcoming);
      
      // Build recent activities (last 5)
      const activities = [];
      
      // Recent members
      const recentMembers = [];
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.createdAt) {
          recentMembers.push({ ...data, id: doc.id });
        }
      });
      recentMembers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (recentMembers.length > 0) {
        const latest = recentMembers[0];
        activities.push({
          id: 'member-' + latest.id,
          type: 'member',
          text: `${latest.displayName || 'New member'} joined`,
          time: getTimeAgo(latest.createdAt),
        });
      }

      // Recent check-ins
      if (periodCheckIns > 0) {
        activities.push({
          id: 'checkin',
          type: 'giving',
          text: `${periodCheckIns} attendance check-ins this ${selectedPeriod.toLowerCase()}`,
          time: 'Recent',
        });
      }

      // Recent events
      if (upcoming.length > 0) {
        activities.push({
          id: 'event-' + upcoming[0].id,
          type: 'event',
          text: `Upcoming: ${upcoming[0].title}`,
          time: upcoming[0].date,
        });
      }

      // Recent prayers
      if (prayersSnapshot.size > 0) {
        activities.push({
          id: 'prayer',
          type: 'prayer',
          text: `${prayersSnapshot.size} prayer requests submitted`,
          time: 'Active',
        });
      }

      // Recent giving
      if (periodGiving > 0) {
        activities.push({
          id: 'giving',
          type: 'giving',
          text: `GH₵${periodGiving.toFixed(2)} received this ${selectedPeriod.toLowerCase()}`,
          time: 'Recent',
        });
      }

      setRecentActivities(activities.slice(0, 5));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      Alert.alert(
        'Error',
        'Failed to load dashboard data. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: loadDashboardData },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getPeriodDate = (period) => {
    const now = new Date();
    switch (period) {
      case 'Day':
        return new Date(now.setDate(now.getDate() - 1)).toISOString();
      case 'Week':
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
      case 'Month':
        return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
      case 'Year':
        return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
      default:
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
    }
  };

  const getPreviousPeriodDate = (period) => {
    const now = new Date();
    switch (period) {
      case 'Day':
        return new Date(now.setDate(now.getDate() - 2)).toISOString();
      case 'Week':
        return new Date(now.setDate(now.getDate() - 14)).toISOString();
      case 'Month':
        return new Date(now.setMonth(now.getMonth() - 2)).toISOString();
      case 'Year':
        return new Date(now.setFullYear(now.getFullYear() - 2)).toISOString();
      default:
        return new Date(now.setDate(now.getDate() - 14)).toISOString();
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const quickActions = [
    { id: 1, title: 'Manage Events', icon: 'calendar', color: '#6366f1', screen: 'ManageEvents' },
    { id: 2, title: 'Manage Sermons', icon: 'play-circle', color: '#8b5cf6', screen: 'ManageSermons' },
    { id: 3, title: 'Manage Users', icon: 'people', color: '#10b981', screen: 'ManageMembers' },
    { id: 4, title: 'Member Activity', icon: 'stats-chart', color: '#f59e0b', screen: 'MemberActivity' },
    { id: 5, title: 'Announcements', icon: 'megaphone', color: '#ef4444', screen: 'ManageAnnouncements' },
    { id: 6, title: 'Devotionals', icon: 'book', color: '#06b6d4', screen: 'ManageDevotionals' },
    { id: 7, title: 'Volunteers', icon: 'hand-right', color: '#8b5cf6', screen: 'ManageVolunteers' },
    { id: 8, title: 'Reports', icon: 'bar-chart', color: '#14b8a6', screen: 'Reports' },
    { id: 9, title: 'Departments', icon: 'albums', color: '#f59e0b', screen: 'Departments' },
    { id: 10, title: 'Ministries', icon: 'sparkles', color: '#ec4899', screen: 'Ministries' },
    { id: 11, title: 'Giving', icon: 'heart', color: '#ef4444', screen: 'Giving' },
    { id: 12, title: 'Manage Banner', icon: 'image', color: '#ec4899', screen: 'ManageBanner' },
  ];

  const handleSettingsPress = () => {
    navigation.navigate('AdminSettings');
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'member':
        return 'person-add';
      case 'giving':
        return 'heart';
      case 'event':
        return 'calendar';
      case 'prayer':
        return 'hand-left';
      case 'volunteer':
        return 'hand-right';
      default:
        return 'information-circle';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'member':
        return '#6366f1';
      case 'giving':
        return '#ef4444';
      case 'event':
        return '#8b5cf6';
      case 'prayer':
        return '#f59e0b';
      case 'volunteer':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#6366f1', '#8b5cf6', '#a855f7']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="shield-checkmark" size={22} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>Admin Dashboard</Text>
            </View>
            {lastUpdated && (
              <View style={styles.lastUpdatedContainer}>
                <Ionicons name="time-outline" size={12} color="#fff" style={{ opacity: 0.8, marginRight: 4 }} />
                <Text style={styles.lastUpdated}>
                  Updated {getTimeAgo(lastUpdated.toISOString())}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={handleSettingsPress}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerBottom}>
          <Ionicons name="business" size={16} color="#fff" style={{ opacity: 0.9, marginRight: 6 }} />
          <Text style={styles.headerSubtitle}>Greater Works City Church</Text>
        </View>
      </LinearGradient>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadDashboardData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6366f1']}
              tintColor="#6366f1"
            />
          }
        >
          {/* Period Selector */}
          <View style={styles.periodSelectorContainer}>
            <View style={styles.periodSelector}>
              {['Day', 'Week', 'Month', 'Year'].map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period && styles.periodButtonSelected,
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.periodText,
                      selectedPeriod === period && styles.periodTextSelected,
                    ]}
                  >
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <Animated.View style={[styles.statsGrid, { opacity: fadeAnim }]}>
            {stats.map((stat) => (
              <TouchableOpacity 
                key={stat.id} 
                style={[
                  styles.statCard,
                  { borderLeftWidth: 4, borderLeftColor: stat.color }
                ]}
                activeOpacity={0.8}
              >
                <View style={styles.statCardHeader}>
                  <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                    <Ionicons name={stat.icon} size={26} color={stat.color} />
                  </View>
                  <View style={[
                    styles.trendBadge,
                    stat.trend === 'up' && styles.trendBadgeUp,
                    stat.trend === 'down' && styles.trendBadgeDown,
                    stat.trend === 'neutral' && styles.trendBadgeNeutral,
                  ]}>
                    <Ionicons 
                      name={stat.trend === 'up' ? 'trending-up' : stat.trend === 'down' ? 'trending-down' : 'remove'} 
                      size={10} 
                      color={stat.trend === 'up' ? '#10b981' : stat.trend === 'down' ? '#ef4444' : '#6b7280'} 
                    />
                    <Text style={[
                      styles.trendText,
                      stat.trend === 'up' && styles.trendTextUp,
                      stat.trend === 'down' && styles.trendTextDown,
                      stat.trend === 'neutral' && styles.trendTextNeutral,
                    ]}>
                      {stat.change}
                    </Text>
                  </View>
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>

        {/* Additional Stats Row */}
        <View style={styles.additionalStatsWrapper}>
          <View style={styles.additionalStatsContainer}>
            <TouchableOpacity style={[styles.miniStatCard, { borderLeftWidth: 3, borderLeftColor: '#6366f1' }]} activeOpacity={0.7}>
              <View style={[styles.miniStatIcon, { backgroundColor: '#6366f115' }]}>
                <Ionicons name="albums" size={22} color="#6366f1" />
              </View>
              <Text style={styles.miniStatValue}>{additionalStats.totalDepartments}</Text>
              <Text style={styles.miniStatLabel}>Departments</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.miniStatCard, { borderLeftWidth: 3, borderLeftColor: '#ec4899' }]} activeOpacity={0.7}>
              <View style={[styles.miniStatIcon, { backgroundColor: '#ec489915' }]}>
                <Ionicons name="sparkles" size={22} color="#ec4899" />
              </View>
              <Text style={styles.miniStatValue}>{additionalStats.totalMinistries}</Text>
              <Text style={styles.miniStatLabel}>Ministries</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.miniStatCard, { borderLeftWidth: 3, borderLeftColor: '#8b5cf6' }]} activeOpacity={0.7}>
              <View style={[styles.miniStatIcon, { backgroundColor: '#8b5cf615' }]}>
                <Ionicons name="play-circle" size={22} color="#8b5cf6" />
              </View>
              <Text style={styles.miniStatValue}>{additionalStats.totalSermons}</Text>
              <Text style={styles.miniStatLabel}>Sermons</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.miniStatCard, { borderLeftWidth: 3, borderLeftColor: '#f59e0b' }]} activeOpacity={0.7}>
              <View style={[styles.miniStatIcon, { backgroundColor: '#f59e0b15' }]}>
                <Ionicons name="hand-left" size={22} color="#f59e0b" />
              </View>
              <Text style={styles.miniStatValue}>{additionalStats.prayerRequests}</Text>
              <Text style={styles.miniStatLabel}>Prayers</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="flash" size={20} color="#6366f1" style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
          </View>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => navigation.navigate(action.screen)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[action.color, `${action.color}CC`]}
                  style={styles.actionIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={action.icon} size={26} color="#fff" />
                </LinearGradient>
                <Text style={styles.actionText} numberOfLines={2}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="pulse" size={20} color="#6366f1" style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            </View>
            {recentActivities.length > 0 && (
              <TouchableOpacity 
                onPress={() => navigation.navigate('Reports')}
                style={styles.seeAllButton}
                activeOpacity={0.7}
              >
                <Text style={styles.seeAll}>See All</Text>
                <Ionicons name="chevron-forward" size={14} color="#6366f1" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}
          </View>
          {recentActivities.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="pulse-outline" size={48} color="#d1d5db" />
              </View>
              <Text style={styles.emptyStateText}>No recent activity</Text>
              <Text style={styles.emptyStateSubtext}>
                Activity will appear here as members engage with your church
              </Text>
            </View>
          ) : (
            <View style={styles.activitiesContainer}>
              {recentActivities.map((activity, index) => (
                <TouchableOpacity 
                  key={activity.id} 
                  style={[
                    styles.activityItem,
                    index === recentActivities.length - 1 && styles.activityItemLast
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.activityIconContainer, { backgroundColor: `${getActivityColor(activity.type)}15` }]}>
                    <Ionicons
                      name={getActivityIcon(activity.type)}
                      size={22}
                      color={getActivityColor(activity.type)}
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>{activity.text}</Text>
                    <View style={styles.activityTimeContainer}>
                      <Ionicons name="time-outline" size={12} color="#9ca3af" style={{ marginRight: 4 }} />
                      <Text style={styles.activityTime}>{activity.time}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Upcoming Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="calendar" size={20} color="#6366f1" style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
            </View>
            <TouchableOpacity 
              onPress={() => navigation.navigate('ManageEvents')}
              style={styles.seeAllButton}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAll}>Manage</Text>
              <Ionicons name="chevron-forward" size={14} color="#6366f1" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
          {upcomingEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
              </View>
              <Text style={styles.emptyStateText}>No upcoming events</Text>
              <Text style={styles.emptyStateSubtext}>
                Create events to engage your congregation
              </Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('ManageEvents')}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.emptyStateButtonText}>Create Event</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.eventsContainer}>
              {upcomingEvents.map((event, index) => (
                <TouchableOpacity 
                  key={event.id} 
                  style={[
                    styles.eventItem,
                    index === upcomingEvents.length - 1 && styles.eventItemLast
                  ]}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#6366f1', '#8b5cf6']}
                    style={styles.eventDate}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.eventDateText}>{event.date}</Text>
                  </LinearGradient>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <View style={styles.eventMeta}>
                      <View style={styles.eventMetaItem}>
                        <Ionicons name="people-outline" size={14} color="#6b7280" />
                        <Text style={styles.eventAttendees}>
                          {event.attendees} expected
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.eventAction}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="create-outline" size={20} color="#6366f1" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  lastUpdatedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  lastUpdated: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.85,
    fontWeight: '500',
  },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.95,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#991b1b',
    marginLeft: 10,
    fontWeight: '500',
  },
  retryText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  periodSelectorContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonSelected: {
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  periodText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  periodTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 50) / 2,
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  statIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
  },
  trendBadgeUp: {
    backgroundColor: '#f0fdf4',
  },
  trendBadgeDown: {
    backgroundColor: '#fef2f2',
  },
  trendBadgeNeutral: {
    backgroundColor: '#f3f4f6',
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 3,
  },
  trendTextUp: {
    color: '#10b981',
  },
  trendTextDown: {
    color: '#ef4444',
  },
  trendTextNeutral: {
    color: '#6b7280',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  statTitle: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
  },
  seeAll: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '700',
  },
  additionalStatsWrapper: {
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 10,
  },
  additionalStatsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  miniStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  miniStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  miniStatLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionCard: {
    width: (width - 56) / 4,
    alignItems: 'center',
    marginBottom: 18,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  actionText: {
    fontSize: 11,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#f3f4f6',
    borderStyle: 'dashed',
  },
  emptyStateIcon: {
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  activitiesContainer: {
    gap: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  activityItemLast: {
    marginBottom: 0,
  },
  activityIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  activityTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  eventsContainer: {
    gap: 12,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  eventItemLast: {
    marginBottom: 0,
  },
  eventDate: {
    width: 64,
    height: 64,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  eventDateText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 22,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventAttendees: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 5,
    fontWeight: '500',
  },
  eventAction: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

