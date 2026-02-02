import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Animated,
  Alert,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { db } from '../../../firebase.config';
import { collection, getDocs, query, where, Timestamp, orderBy } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

export default function ReportsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Month');
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalEvents: 0,
    totalSermons: 0,
    totalCheckIns: 0,
    totalPrayers: 0,
    totalGiving: 0,
    newMembers: 0,
    activeVolunteers: 0,
    periodGiving: 0,
    avgGivingPerMember: 0,
    totalAnnouncements: 0,
  });
  const [previousStats, setPreviousStats] = useState({
    totalMembers: 0,
    totalEvents: 0,
    totalSermons: 0,
    totalCheckIns: 0,
    totalPrayers: 0,
    totalGiving: 0,
    newMembers: 0,
    activeVolunteers: 0,
    periodGiving: 0,
    avgGivingPerMember: 0,
    totalAnnouncements: 0,
  });
  const [quickReportData, setQuickReportData] = useState({
    attendance: null,
    giving: null,
    memberGrowth: null,
    eventAnalytics: null,
    sermonViews: null,
    engagement: null,
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const loadStatistics = useCallback(async () => {
    try {
      setLoading(true);

      // Load total members
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalMembers = usersSnapshot.size;

      // Load total events
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const totalEvents = eventsSnapshot.size;

      // Load total sermons
      const sermonsSnapshot = await getDocs(collection(db, 'sermons'));
      const totalSermons = sermonsSnapshot.size;

      // Load total check-ins
      const checkInsSnapshot = await getDocs(collection(db, 'checkIns'));
      const totalCheckIns = checkInsSnapshot.size;

      // Load total prayer requests
      const prayersSnapshot = await getDocs(collection(db, 'prayerRequests'));
      const totalPrayers = prayersSnapshot.size;

      // Load announcements count
      const announcementsSnapshot = await getDocs(collection(db, 'announcements'));
      const totalAnnouncements = announcementsSnapshot.size;

      // Calculate period-based stats
      const periodDate = getPeriodDate(selectedPeriod);
      const previousPeriodDate = getPreviousPeriodDate(selectedPeriod);
      
      // New members in period
      let newMembers = 0;
      let previousNewMembers = 0;
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        const createdAt = userData.createdAt;
        if (createdAt) {
          const createdDate = createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt);
          const now = new Date();
          const periodStart = new Date(periodDate);
          
          // Check if within current period (between period start and now)
          if (createdDate >= periodStart && createdDate <= now) {
            newMembers++;
          }
          // Check if within previous period
          const previousStart = new Date(previousPeriodDate);
          if (createdDate >= previousStart && createdDate < periodStart) {
            previousNewMembers++;
          }
        }
      });

      // Load giving data from donations collection
      let totalGiving = 0;
      let periodGiving = 0;
      let previousPeriodGiving = 0;
      try {
        const donationsSnapshot = await getDocs(collection(db, 'donations'));
        donationsSnapshot.forEach((doc) => {
          const donationData = doc.data();
          const amount = parseFloat(donationData.amount) || 0;
          const status = donationData.status || 'pending';
          
          // Only count completed or pending donations (exclude failed)
          if (status === 'completed' || status === 'pending') {
            totalGiving += amount;
            
            // Check if within period
            const createdAt = donationData.createdAt;
            if (createdAt) {
              const createdDate = createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt);
              const now = new Date();
              const periodStart = new Date(periodDate);
              
              // Check if within current period (between period start and now)
              if (createdDate >= periodStart && createdDate <= now) {
                periodGiving += amount;
              }
              // Check if within previous period
              const previousStart = new Date(previousPeriodDate);
              if (createdDate >= previousStart && createdDate < periodStart) {
                previousPeriodGiving += amount;
              }
            }
          }
        });
      } catch (error) {
        console.error('Error loading donations:', error);
        // Also try 'giving' collection as fallback
        try {
          const givingSnapshot = await getDocs(collection(db, 'giving'));
          givingSnapshot.forEach((doc) => {
            const givingData = doc.data();
            const amount = parseFloat(givingData.amount) || 0;
            totalGiving += amount;
            
            const date = givingData.date || givingData.createdAt;
            if (date) {
              const givingDate = date instanceof Timestamp ? date.toDate() : new Date(date);
              if (givingDate >= new Date(periodDate)) {
                periodGiving += amount;
              } else if (givingDate >= new Date(previousPeriodDate) && givingDate < new Date(periodDate)) {
                previousPeriodGiving += amount;
              }
            }
          });
        } catch (givingError) {
          console.error('Error loading giving:', givingError);
        }
      }

      // Load active volunteers (users with approved applications or volunteer roles)
      let activeVolunteers = 0;
      try {
        const volunteerApplicationsSnapshot = await getDocs(collection(db, 'volunteerApplications'));
        const uniqueVolunteers = new Set();
        
        // Count approved volunteer applications
        volunteerApplicationsSnapshot.forEach((doc) => {
          const appData = doc.data();
          const status = appData.status || 'pending';
          // Count approved volunteers
          if (status === 'approved' || status === 'active') {
            uniqueVolunteers.add(appData.userId);
          }
        });
        
        // Also check users with volunteer roles set directly
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.isVolunteer || (userData.volunteerRoles && userData.volunteerRoles.length > 0)) {
            uniqueVolunteers.add(doc.id);
          }
        });
        
        activeVolunteers = uniqueVolunteers.size;
      } catch (error) {
        console.error('Error loading volunteers:', error);
      }

      // Calculate average giving per member
      const avgGivingPerMember = totalMembers > 0 ? totalGiving / totalMembers : 0;

      // Store previous stats before updating (using functional update to avoid stale closure)
      setPreviousStats((prev) => {
        // Use the previous state values (which are the current stats before this update)
        const currentStats = {
          totalMembers: prev.totalMembers || 0,
          totalEvents: prev.totalEvents || 0,
          totalSermons: prev.totalSermons || 0,
          totalCheckIns: prev.totalCheckIns || 0,
          totalPrayers: prev.totalPrayers || 0,
          totalGiving: prev.totalGiving || 0,
          newMembers: prev.newMembers || 0,
          activeVolunteers: prev.activeVolunteers || 0,
          periodGiving: prev.periodGiving || 0,
          avgGivingPerMember: prev.avgGivingPerMember || 0,
          totalAnnouncements: prev.totalAnnouncements || 0,
        };

        const previousAvgGivingPerMember = currentStats.totalMembers > 0 
          ? currentStats.totalGiving / currentStats.totalMembers 
          : 0;

        return {
          ...currentStats,
          newMembers: previousNewMembers,
          periodGiving: previousPeriodGiving,
          avgGivingPerMember: previousAvgGivingPerMember,
        };
      });

      setStats({
        totalMembers,
        totalEvents,
        totalSermons,
        totalCheckIns,
        totalPrayers,
        totalGiving,
        newMembers,
        activeVolunteers,
        periodGiving,
        avgGivingPerMember,
        totalAnnouncements,
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
      Alert.alert('Error', 'Failed to load statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  // Helper functions must be defined before loadQuickReportData
  const calculateEngagementScore = ({ totalMembers, totalCheckIns, totalPrayers, totalEvents, totalRegistrations }) => {
    if (totalMembers === 0) return 0;
    
    const attendanceScore = Math.min((totalCheckIns / totalMembers) * 50, 50);
    const prayerScore = Math.min((totalPrayers / totalMembers) * 20, 20);
    const eventScore = Math.min((totalRegistrations / totalMembers) * 30, 30);
    
    return Math.round(attendanceScore + prayerScore + eventScore);
  };

  const getPeriodDate = (period) => {
    const now = new Date();
    const periodDate = new Date();
    
    switch (period) {
      case 'Day':
        // Today (start of today to now)
        periodDate.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
        periodDate.setHours(0, 0, 0, 0);
        break;
      case 'Week':
        // Last 7 days
        periodDate.setTime(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case 'Month':
        // First day of current month (to show current month's data)
        periodDate.setFullYear(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'Year':
        // First day of current year
        periodDate.setFullYear(now.getFullYear(), 0, 1);
        break;
      default:
        // Default to first day of current month
        periodDate.setFullYear(now.getFullYear(), now.getMonth(), 1);
    }
    
    // All periods use start of day
    periodDate.setHours(0, 0, 0, 0);
    return periodDate.toISOString();
  };

  const getPreviousPeriodDate = (period) => {
    const now = new Date();
    const periodDate = new Date(getPeriodDate(period));
    const previousPeriodDate = new Date();
    
    switch (period) {
      case 'Day':
        // Yesterday (start of yesterday to end of yesterday)
        previousPeriodDate.setFullYear(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        previousPeriodDate.setHours(0, 0, 0, 0);
        break;
      case 'Week':
        // Previous 7 days (14 days ago to 7 days ago)
        previousPeriodDate.setTime(periodDate.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case 'Month':
        // First day of previous month
        const prevMonth = periodDate.getMonth() === 0 ? 11 : periodDate.getMonth() - 1;
        const prevYear = periodDate.getMonth() === 0 ? periodDate.getFullYear() - 1 : periodDate.getFullYear();
        previousPeriodDate.setFullYear(prevYear, prevMonth, 1);
        break;
      case 'Year':
        // First day of previous year
        previousPeriodDate.setFullYear(periodDate.getFullYear() - 1, 0, 1);
        break;
      default:
        // Default to first day of previous month
        const defaultPrevMonth = periodDate.getMonth() === 0 ? 11 : periodDate.getMonth() - 1;
        const defaultPrevYear = periodDate.getMonth() === 0 ? periodDate.getFullYear() - 1 : periodDate.getFullYear();
        previousPeriodDate.setFullYear(defaultPrevYear, defaultPrevMonth, 1);
    }
    
    // All periods use start of day
    previousPeriodDate.setHours(0, 0, 0, 0);
    return previousPeriodDate.toISOString();
  };

  const calculateTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    const change = ((current - previous) / previous) * 100;
    return parseFloat(change.toFixed(1));
  };

  const loadQuickReportData = useCallback(async () => {
    try {
      // Load attendance data with detailed breakdowns
      const checkInsSnapshot = await getDocs(collection(db, 'checkIns'));
      const periodDate = getPeriodDate(selectedPeriod);
      const previousPeriodDate = getPreviousPeriodDate(selectedPeriod);
      
      let periodCheckIns = 0;
      let previousPeriodCheckIns = 0;
      const checkInsByDay = {};
      const checkInsByService = {};
      const checkInsByDayOfWeek = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      const checkInsByServiceType = {};
      
      checkInsSnapshot.forEach((doc) => {
        const data = doc.data();
        const checkInDate = data.checkedInAt ? 
          (data.checkedInAt instanceof Timestamp ? data.checkedInAt.toDate() : new Date(data.checkedInAt)) : 
          new Date();
        
        const serviceName = data.service || data.serviceName || 'General Service';
        const serviceId = data.serviceId || 'unknown';
        const serviceType = data.serviceType || data.category || 'Worship';
        
        const now = new Date();
        const periodStart = new Date(periodDate);
        
        // Check if within current period (between period start and now)
        if (checkInDate >= periodStart && checkInDate <= now) {
          periodCheckIns++;
          const dayKey = checkInDate.toISOString().split('T')[0];
          checkInsByDay[dayKey] = (checkInsByDay[dayKey] || 0) + 1;
          
          // Track by service
          const serviceKey = `${serviceId}_${serviceName}`;
          if (!checkInsByService[serviceKey]) {
            checkInsByService[serviceKey] = {
              name: serviceName,
              id: serviceId,
              count: 0,
            };
          }
          checkInsByService[serviceKey].count++;
          
          // Track by day of week (0 = Sunday, 6 = Saturday)
          const dayOfWeek = checkInDate.getDay();
          checkInsByDayOfWeek[dayOfWeek] = (checkInsByDayOfWeek[dayOfWeek] || 0) + 1;
          
          // Track by service type
          checkInsByServiceType[serviceType] = (checkInsByServiceType[serviceType] || 0) + 1;
        }
        // Check if within previous period
        const previousStart = new Date(previousPeriodDate);
        if (checkInDate >= previousStart && checkInDate < periodStart) {
          previousPeriodCheckIns++;
        }
      });

      // Load giving data
      let periodGiving = 0;
      let previousPeriodGiving = 0;
      const givingByCategory = {};
      try {
        const donationsSnapshot = await getDocs(collection(db, 'donations'));
        donationsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'completed' || data.status === 'pending') {
            const amount = parseFloat(data.amount) || 0;
            const createdAt = data.createdAt;
            if (createdAt) {
              const createdDate = createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt);
              const now = new Date();
              const periodStart = new Date(periodDate);
              
              // Check if within current period (between period start and now)
              if (createdDate >= periodStart && createdDate <= now) {
                periodGiving += amount;
                const category = data.category || 'General';
                givingByCategory[category] = (givingByCategory[category] || 0) + amount;
              }
              // Check if within previous period
              const previousStart = new Date(previousPeriodDate);
              if (createdDate >= previousStart && createdDate < periodStart) {
                previousPeriodGiving += amount;
              }
            }
          }
        });
      } catch (error) {
        console.error('Error loading giving data:', error);
      }

      // Calculate total giving
      let totalGiving = 0;
      try {
        const allDonationsSnapshot = await getDocs(collection(db, 'donations'));
        allDonationsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'completed' || data.status === 'pending') {
            totalGiving += parseFloat(data.amount) || 0;
          }
        });
      } catch (error) {
        console.error('Error calculating total giving:', error);
      }

      // Load member growth data
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const memberGrowthByMonth = {};
      let totalMembers = 0;
      let newMembers = 0;
      let previousNewMembers = 0;
      usersSnapshot.forEach((doc) => {
        totalMembers++;
        const data = doc.data();
        const createdAt = data.createdAt;
        if (createdAt) {
          const createdDate = createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt);
          const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
          memberGrowthByMonth[monthKey] = (memberGrowthByMonth[monthKey] || 0) + 1;
          
          const now = new Date();
          const periodStart = new Date(periodDate);
          
          // Check if within current period (between period start and now)
          if (createdDate >= periodStart && createdDate <= now) {
            newMembers++;
          }
          // Check if within previous period
          const previousStart = new Date(previousPeriodDate);
          if (createdDate >= previousStart && createdDate < periodStart) {
            previousNewMembers++;
          }
        }
      });

      // Load event analytics with attendance breakdown
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const eventRegistrationsSnapshot = await getDocs(collection(db, 'eventRegistrations'));
      const eventsByCategory = {};
      let totalRegistrations = 0;
      const eventAttendanceMap = {};
      const eventRegistrationsMap = {};
      
      // Create events map
      const eventsMap = {};
      eventsSnapshot.forEach((doc) => {
        const data = doc.data();
        const category = data.category || 'Other';
        eventsByCategory[category] = (eventsByCategory[category] || 0) + 1;
        eventsMap[doc.id] = {
          id: doc.id,
          title: data.title || 'Untitled Event',
          category: category,
          date: data.date,
        };
        eventAttendanceMap[doc.id] = {
          id: doc.id,
          title: data.title || 'Untitled Event',
          category: category,
          registrations: 0,
          checkIns: 0,
        };
      });
      
      // Count registrations per event
      eventRegistrationsSnapshot.forEach((doc) => {
        const regData = doc.data();
        totalRegistrations++;
        const eventId = regData.eventId;
        if (eventId && eventAttendanceMap[eventId]) {
          eventAttendanceMap[eventId].registrations++;
          if (!eventRegistrationsMap[eventId]) {
            eventRegistrationsMap[eventId] = 0;
          }
          eventRegistrationsMap[eventId]++;
        }
      });
      
      // Count check-ins per event (match by serviceId or service name)
      checkInsSnapshot.forEach((doc) => {
        const checkInData = doc.data();
        const checkInDate = checkInData.checkedInAt ? 
          (checkInData.checkedInAt instanceof Timestamp ? checkInData.checkedInAt.toDate() : new Date(checkInData.checkedInAt)) : 
          null;
        
        const now = new Date();
        const periodStart = new Date(periodDate);
        
        // Check if within current period (between period start and now)
        if (checkInDate && checkInDate >= periodStart && checkInDate <= now) {
          const serviceId = checkInData.serviceId;
          const serviceName = checkInData.service || checkInData.serviceName;
          
          // Try to match by serviceId first
          if (serviceId && eventAttendanceMap[serviceId]) {
            eventAttendanceMap[serviceId].checkIns++;
          } else {
            // Try to match by service name
            Object.values(eventAttendanceMap).forEach((event) => {
              if (event.title === serviceName) {
                event.checkIns++;
              }
            });
          }
        }
      });
      
      // Convert to array and sort by attendance
      const eventAttendanceBreakdown = Object.values(eventAttendanceMap)
        .filter(event => event.registrations > 0 || event.checkIns > 0)
        .sort((a, b) => (b.checkIns + b.registrations) - (a.checkIns + a.registrations))
        .slice(0, 10); // Top 10 events

      // Load sermon views
      const sermonsSnapshot = await getDocs(collection(db, 'sermons'));
      let totalViews = 0;
      const topSermons = [];
      sermonsSnapshot.forEach((doc) => {
        const data = doc.data();
        const views = parseInt(data.views || 0);
        totalViews += views;
        if (views > 0) {
          topSermons.push({
            title: data.title || 'Untitled',
            views: views,
            pastor: data.pastor || 'Unknown',
          });
        }
      });
      topSermons.sort((a, b) => b.views - a.views);

      // Load prayer requests count
      let totalPrayers = 0;
      try {
        const prayersSnapshot = await getDocs(collection(db, 'prayerRequests'));
        totalPrayers = prayersSnapshot.size;
      } catch (error) {
        console.error('Error loading prayers:', error);
      }

      // Calculate engagement score
      const engagementScore = calculateEngagementScore({
        totalMembers,
        totalCheckIns: checkInsSnapshot.size,
        totalPrayers,
        totalEvents: eventsSnapshot.size,
        totalRegistrations,
      });

      // Convert service attendance to array and sort
      const serviceAttendanceBreakdown = Object.values(checkInsByService)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 services
      
      // Day of week names
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const checkInsByDayOfWeekFormatted = Object.entries(checkInsByDayOfWeek).map(([day, count]) => ({
        day: parseInt(day),
        dayName: dayNames[parseInt(day)],
        count,
      })).sort((a, b) => b.count - a.count);

      setQuickReportData({
        attendance: {
          periodCheckIns,
          previousPeriodCheckIns,
          totalCheckIns: checkInsSnapshot.size,
          checkInsByDay,
          checkInsByService: serviceAttendanceBreakdown,
          checkInsByDayOfWeek: checkInsByDayOfWeekFormatted,
          checkInsByServiceType,
          trend: calculateTrend(periodCheckIns, previousPeriodCheckIns),
        },
        giving: {
          periodGiving,
          previousPeriodGiving,
          totalGiving,
          givingByCategory,
          trend: calculateTrend(periodGiving, previousPeriodGiving),
        },
        memberGrowth: {
          totalMembers,
          newMembers,
          previousNewMembers,
          memberGrowthByMonth,
          trend: calculateTrend(newMembers, previousNewMembers),
        },
        eventAnalytics: {
          totalEvents: eventsSnapshot.size,
          totalRegistrations,
          eventsByCategory,
          avgRegistrationsPerEvent: eventsSnapshot.size > 0 ? totalRegistrations / eventsSnapshot.size : 0,
          eventAttendanceBreakdown,
        },
        sermonViews: {
          totalViews,
          totalSermons: sermonsSnapshot.size,
          avgViews: sermonsSnapshot.size > 0 ? totalViews / sermonsSnapshot.size : 0,
          topSermons: topSermons.slice(0, 5),
        },
        engagement: {
          score: engagementScore,
          breakdown: {
            attendance: (checkInsSnapshot.size / Math.max(totalMembers, 1)) * 100,
            giving: (totalGiving > 0 ? 1 : 0) * 100,
            events: (totalRegistrations / Math.max(totalMembers, 1)) * 100,
            prayers: (totalPrayers / Math.max(totalMembers, 1)) * 100,
          },
        },
      });
    } catch (error) {
      console.error('Error loading quick report data:', error);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    // Load statistics first, then quick report data to ensure previousStats is updated
    const loadData = async () => {
      await loadStatistics();
      await loadQuickReportData();
    };
    loadData();
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [selectedPeriod, loadStatistics, loadQuickReportData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Load statistics first to update previousStats, then load quick report data
    await loadStatistics();
    await loadQuickReportData();
    setRefreshing(false);
  }, [loadStatistics, loadQuickReportData]);

  const getTrendIndicator = (current, previous) => {
    const trend = calculateTrend(current, previous);
    if (trend > 0) {
      return { icon: 'trending-up', color: '#10b981', trend: `+${trend}%` };
    } else if (trend < 0) {
      return { icon: 'trending-down', color: '#ef4444', trend: `${trend}%` };
    } else {
      return { icon: 'remove', color: '#6b7280', trend: '0%' };
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return `GH₵${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (num) => {
    return num.toLocaleString('en-US');
  };

  // Simple Bar Chart Component
  const SimpleBarChart = ({ data, maxValue, color, height = 100 }) => {
    const max = Math.max(...data, maxValue || 100, 1);
    return (
      <View style={styles.chartContainer}>
        <View style={styles.barChart}>
          {data.map((value, index) => {
            const barHeight = (value / max) * height;
            return (
              <View key={index} style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: color || '#6366f1',
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{value}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Summary Card Component
  const SummaryCard = ({ icon, title, value, subtitle, trend, color, gradient }) => {
    const trendData = trend ? getTrendIndicator(trend.current, trend.previous) : null;
    
    return (
      <LinearGradient
        colors={gradient || [color, color + 'dd']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.summaryCard}
      >
        <View style={styles.summaryCardContent}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name={icon} size={28} color="#fff" />
          </View>
          <View style={styles.summaryTextContainer}>
            <Text style={styles.summaryValue}>{value}</Text>
            <Text style={styles.summaryTitle}>{title}</Text>
            {subtitle && <Text style={styles.summarySubtitle}>{subtitle}</Text>}
            {trendData && (
              <View style={styles.trendContainer}>
                <Ionicons name={trendData.icon} size={14} color={trendData.color} />
                <Text style={[styles.trendText, { color: trendData.color }]}>
                  {trendData.trend}
                </Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    );
  };

  const reportCards = [
    {
      id: 1,
      title: 'Members Overview',
      icon: 'people',
      color: '#6366f1',
      gradient: ['#6366f1', '#8b5cf6'],
      stats: [
        { 
          label: 'Total Members', 
          value: formatNumber(stats.totalMembers),
          trend: { current: stats.totalMembers, previous: previousStats.totalMembers }
        },
        { 
          label: `New (${selectedPeriod})`, 
          value: formatNumber(stats.newMembers),
          trend: { current: stats.newMembers, previous: previousStats.newMembers }
        },
        { 
          label: 'Active Volunteers', 
          value: formatNumber(stats.activeVolunteers),
          trend: { current: stats.activeVolunteers, previous: previousStats.activeVolunteers }
        },
      ],
    },
    {
      id: 2,
      title: 'Engagement',
      icon: 'pulse',
      color: '#10b981',
      gradient: ['#10b981', '#059669'],
      stats: [
        { 
          label: 'Total Check-ins', 
          value: formatNumber(stats.totalCheckIns),
          trend: { current: stats.totalCheckIns, previous: previousStats.totalCheckIns }
        },
        { 
          label: 'Prayer Requests', 
          value: formatNumber(stats.totalPrayers),
          trend: { current: stats.totalPrayers, previous: previousStats.totalPrayers }
        },
        { 
          label: 'Event Registrations', 
          value: formatNumber(stats.totalEvents),
          trend: { current: stats.totalEvents, previous: previousStats.totalEvents }
        },
      ],
    },
    {
      id: 3,
      title: 'Content',
      icon: 'albums',
      color: '#8b5cf6',
      gradient: ['#8b5cf6', '#6366f1'],
      stats: [
        { 
          label: 'Total Sermons', 
          value: formatNumber(stats.totalSermons),
          trend: { current: stats.totalSermons, previous: previousStats.totalSermons }
        },
        { 
          label: 'Total Events', 
          value: formatNumber(stats.totalEvents),
          trend: { current: stats.totalEvents, previous: previousStats.totalEvents }
        },
        { 
          label: 'Announcements', 
          value: formatNumber(stats.totalAnnouncements),
          trend: { current: stats.totalAnnouncements, previous: previousStats.totalAnnouncements }
        },
      ],
    },
    {
      id: 4,
      title: 'Giving',
      icon: 'heart',
      color: '#ef4444',
      gradient: ['#ef4444', '#dc2626'],
      stats: [
        { 
          label: 'Total Giving', 
          value: formatCurrency(stats.totalGiving),
          trend: { current: stats.totalGiving, previous: previousStats.totalGiving }
        },
        { 
          label: `This ${selectedPeriod}`, 
          value: formatCurrency(stats.periodGiving),
          trend: { current: stats.periodGiving, previous: previousStats.periodGiving }
        },
        { 
          label: 'Avg per Member', 
          value: formatCurrency(stats.avgGivingPerMember),
          trend: { current: stats.avgGivingPerMember, previous: previousStats.avgGivingPerMember }
        },
      ],
    },
  ];

  const getQuickReports = () => {
    const { attendance, giving, memberGrowth, eventAnalytics, sermonViews, engagement } = quickReportData;
    
    return [
      { 
        id: 1, 
        title: 'Attendance Report', 
        icon: 'checkbox', 
        color: '#10b981', 
        subtitle: attendance ? `${formatNumber(attendance.periodCheckIns)} this ${selectedPeriod.toLowerCase()}` : 'Check-in analytics',
        value: attendance ? formatNumber(attendance.totalCheckIns) : '0',
        data: attendance,
      },
      { 
        id: 2, 
        title: 'Giving Report', 
        icon: 'heart', 
        color: '#ef4444', 
        subtitle: giving ? formatCurrency(giving.periodGiving) + ` this ${selectedPeriod.toLowerCase()}` : 'Donation breakdown',
        value: giving ? formatCurrency(giving.totalGiving) : 'GH₵0',
        data: giving,
      },
      { 
        id: 3, 
        title: 'Member Growth', 
        icon: 'trending-up', 
        color: '#6366f1', 
        subtitle: memberGrowth ? `${formatNumber(memberGrowth.newMembers)} new this ${selectedPeriod.toLowerCase()}` : 'Growth trends',
        value: memberGrowth ? formatNumber(memberGrowth.totalMembers) : '0',
        data: memberGrowth,
      },
      { 
        id: 4, 
        title: 'Event Analytics', 
        icon: 'calendar', 
        color: '#f59e0b', 
        subtitle: eventAnalytics ? `${formatNumber(eventAnalytics.totalRegistrations)} registrations` : 'Event statistics',
        value: eventAnalytics ? formatNumber(eventAnalytics.totalEvents) : '0',
        data: eventAnalytics,
      },
      { 
        id: 5, 
        title: 'Sermon Views', 
        icon: 'play-circle', 
        color: '#8b5cf6', 
        subtitle: sermonViews ? `${formatNumber(sermonViews.totalViews)} total views` : 'View analytics',
        value: sermonViews ? formatNumber(sermonViews.totalSermons) : '0',
        data: sermonViews,
      },
      { 
        id: 6, 
        title: 'Engagement Score', 
        icon: 'stats-chart', 
        color: '#14b8a6', 
        subtitle: engagement ? `${engagement.score}% overall score` : 'Overall engagement',
        value: engagement ? `${engagement.score}%` : '0%',
        data: engagement,
      },
    ];
  };

  const generatePDFHTML = () => {
    const date = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const trendIcon = (current, previous) => {
      const trend = calculateTrend(current, previous);
      if (trend > 0) return '↑';
      if (trend < 0) return '↓';
      return '→';
    };

    const trendColor = (current, previous) => {
      const trend = calculateTrend(current, previous);
      if (trend > 0) return '#10b981';
      if (trend < 0) return '#ef4444';
      return '#6b7280';
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              padding: 40px;
              color: #1f2937;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #6366f1;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #6366f1;
              margin: 0;
              font-size: 32px;
            }
            .header p {
              color: #6b7280;
              margin: 10px 0 0 0;
            }
            .section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 20px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #e5e7eb;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            .stat-card {
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #6366f1;
            }
            .stat-label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              margin-bottom: 8px;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
            }
            .stat-trend {
              font-size: 12px;
              margin-top: 5px;
            }
            .report-card {
              background: #fff;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
            }
            .report-card-title {
              font-size: 18px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 15px;
            }
            .report-stats {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
            }
            .report-stat {
              text-align: center;
            }
            .report-stat-value {
              font-size: 20px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 5px;
            }
            .report-stat-label {
              font-size: 11px;
              color: #6b7280;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
            }
            th {
              background: #f9fafb;
              font-weight: bold;
              color: #1f2937;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
            @media print {
              body { padding: 20px; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Greater Works City Church</h1>
            <p>Reports & Analytics - ${selectedPeriod} Report</p>
            <p>Generated on ${date}</p>
          </div>

          <div class="section">
            <div class="section-title">Summary Statistics</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Total Members</div>
                <div class="stat-value">${formatNumber(stats.totalMembers)}</div>
                <div class="stat-trend" style="color: ${trendColor(stats.totalMembers, previousStats.totalMembers)}">
                  ${trendIcon(stats.totalMembers, previousStats.totalMembers)} ${calculateTrend(stats.totalMembers, previousStats.totalMembers).toFixed(1)}%
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-label">New Members (${selectedPeriod})</div>
                <div class="stat-value">${formatNumber(stats.newMembers)}</div>
                <div class="stat-trend" style="color: ${trendColor(stats.newMembers, previousStats.newMembers)}">
                  ${trendIcon(stats.newMembers, previousStats.newMembers)} ${calculateTrend(stats.newMembers, previousStats.newMembers).toFixed(1)}%
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Total Giving</div>
                <div class="stat-value">${formatCurrency(stats.totalGiving)}</div>
                <div class="stat-trend" style="color: ${trendColor(stats.totalGiving, previousStats.totalGiving)}">
                  ${trendIcon(stats.totalGiving, previousStats.totalGiving)} ${calculateTrend(stats.totalGiving, previousStats.totalGiving).toFixed(1)}%
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-label">This ${selectedPeriod} Giving</div>
                <div class="stat-value">${formatCurrency(stats.periodGiving)}</div>
                <div class="stat-trend" style="color: ${trendColor(stats.periodGiving, previousStats.periodGiving)}">
                  ${trendIcon(stats.periodGiving, previousStats.periodGiving)} ${calculateTrend(stats.periodGiving, previousStats.periodGiving).toFixed(1)}%
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Total Check-ins</div>
                <div class="stat-value">${formatNumber(stats.totalCheckIns)}</div>
                <div class="stat-trend" style="color: ${trendColor(stats.totalCheckIns, previousStats.totalCheckIns)}">
                  ${trendIcon(stats.totalCheckIns, previousStats.totalCheckIns)} ${calculateTrend(stats.totalCheckIns, previousStats.totalCheckIns).toFixed(1)}%
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Prayer Requests</div>
                <div class="stat-value">${formatNumber(stats.totalPrayers)}</div>
                <div class="stat-trend" style="color: ${trendColor(stats.totalPrayers, previousStats.totalPrayers)}">
                  ${trendIcon(stats.totalPrayers, previousStats.totalPrayers)} ${calculateTrend(stats.totalPrayers, previousStats.totalPrayers).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          ${reportCards.map(card => `
            <div class="section">
              <div class="report-card">
                <div class="report-card-title">${card.title}</div>
                <div class="report-stats">
                  ${card.stats.map(stat => `
                    <div class="report-stat">
                      <div class="report-stat-value">${stat.value}</div>
                      <div class="report-stat-label">${stat.label}</div>
                      <div class="stat-trend" style="color: ${trendColor(stat.trend.current, stat.trend.previous)}">
                        ${trendIcon(stat.trend.current, stat.trend.previous)} ${calculateTrend(stat.trend.current, stat.trend.previous).toFixed(1)}%
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          `).join('')}

          <div class="section">
            <div class="section-title">Quick Reports Summary</div>
            ${getQuickReports().map(report => `
              <div class="report-card">
                <div class="report-card-title">${report.title}</div>
                <div style="margin-top: 10px;">
                  <div style="font-size: 14px; color: #6b7280;">${report.subtitle || ''}</div>
                  <div style="font-size: 20px; font-weight: bold; color: #1f2937; margin-top: 5px;">${report.value || 'N/A'}</div>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="footer">
            <p>This report was generated automatically by the Greater Works City Church App</p>
            <p>For questions or support, please contact your church administrator</p>
          </div>
        </body>
      </html>
    `;
  };

  const handleExportPDF = async () => {
    try {
      setGeneratingPDF(true);

      // Generate HTML content
      const html = generatePDFHTML();

      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Create a readable filename
      const date = new Date().toISOString().split('T')[0];
      const filename = `Church_Report_${selectedPeriod}_${date}.pdf`;
      const newPath = `${FileSystem.documentDirectory}${filename}`;

      // Copy file to a more accessible location
      await FileSystem.copyAsync({
        from: uri,
        to: newPath,
      });

      setGeneratingPDF(false);

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Share the PDF - this will open the native share dialog
        await Sharing.shareAsync(newPath, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Report PDF',
        });
      } else {
        // For platforms that don't support sharing, show file location
        Alert.alert(
          'PDF Generated Successfully',
          `Your report has been saved as "${filename}".\n\nFile location: ${newPath}\n\nYou can find it in your device's file manager or documents folder.`,
          [
            { text: 'OK' },
            ...(Platform.OS === 'ios' ? [{
              text: 'Open Files',
              onPress: async () => {
                try {
                  // Try to open the file with the system default app
                  const canOpen = await Linking.canOpenURL(newPath);
                  if (canOpen) {
                    await Linking.openURL(newPath);
                  }
                } catch (err) {
                  console.error('Error opening file:', err);
                }
              }
            }] : [])
          ]
        );
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setGeneratingPDF(false);
      Alert.alert(
        'Error',
        'Failed to generate PDF. Please try again.\n\n' + (error.message || 'Unknown error'),
        [{ text: 'OK' }]
      );
    }
  };

  const handleExportExcel = () => {
    Alert.alert(
      'Export to Excel',
      'This feature will generate an Excel spreadsheet with detailed data.',
      [{ text: 'OK', onPress: () => console.log('Excel Export initiated') }]
    );
  };

  const handleQuickReport = async (report) => {
    setSelectedReport(report);
    setReportModalVisible(true);
    
    // Reload data for the selected report if needed
    if (!report.data) {
      setLoadingReport(true);
      await loadQuickReportData();
      setLoadingReport(false);
    }
  };

  const renderReportModal = () => {
    if (!selectedReport || !selectedReport.data) {
      return null;
    }

    const { data, title, color } = selectedReport;

    return (
      <Modal
        visible={reportModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setReportModalVisible(false)}
          />
          <View style={[
            styles.modalContent, 
            { 
              paddingBottom: insets.bottom,
              maxHeight: Platform.OS === 'android' 
                ? height * 0.75 
                : height < 700 ? height * 0.9 : height * 0.85,
            }
          ]}>
            <LinearGradient colors={[color, color + 'dd']} style={styles.modalHeader}>
              <View style={styles.modalHeaderTop}>
                <Text style={styles.modalTitle}>{title}</Text>
                <TouchableOpacity
                  onPress={() => setReportModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {loadingReport ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="large" color={color} />
                  <Text style={styles.modalLoadingText}>Loading report data...</Text>
                </View>
              ) : (
                <>
                  {selectedReport.id === 1 && renderAttendanceReport(data)}
                  {selectedReport.id === 2 && renderGivingReport(data)}
                  {selectedReport.id === 3 && renderMemberGrowthReport(data)}
                  {selectedReport.id === 4 && renderEventAnalyticsReport(data)}
                  {selectedReport.id === 5 && renderSermonViewsReport(data)}
                  {selectedReport.id === 6 && renderEngagementReport(data)}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderAttendanceReport = (data) => {
    if (!data) return null;
    const trendData = getTrendIndicator(data.periodCheckIns || 0, data.previousPeriodCheckIns || 0);
    const recentDays = Object.entries(data.checkInsByDay || {})
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 7);

    return (
      <View style={styles.reportDetailContainer}>
        <View style={styles.reportSummaryCard}>
          <Text style={styles.reportSummaryLabel}>Total Check-ins</Text>
          <Text style={styles.reportSummaryValue}>{formatNumber(data.totalCheckIns)}</Text>
        </View>
        
        <View style={styles.reportSummaryCard}>
          <Text style={styles.reportSummaryLabel}>This {selectedPeriod}</Text>
          <Text style={styles.reportSummaryValue}>{formatNumber(data.periodCheckIns)}</Text>
          <View style={styles.trendContainer}>
            <Ionicons name={trendData.icon} size={16} color={trendData.color} />
            <Text style={[styles.trendText, { color: trendData.color }]}>
              {trendData.trend} vs previous period
            </Text>
          </View>
        </View>

        {/* Attendance by Service */}
        {data.checkInsByService && data.checkInsByService.length > 0 && (
          <View style={styles.reportSection}>
            <Text style={styles.reportSectionTitle}>Attendance by Service/Event</Text>
            {data.checkInsByService.map((service, index) => (
              <View key={service.id || index} style={styles.reportItem}>
                <View style={styles.reportItemLeft}>
                  <Text style={styles.reportItemRank}>#{index + 1}</Text>
                  <View style={{ flex: 1, marginRight: width < 400 ? 8 : 0 }}>
                    <Text style={styles.reportItemTitle} numberOfLines={2}>{service.name}</Text>
                  </View>
                </View>
                <Text style={styles.reportItemValue}>{formatNumber(service.count)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Attendance by Day of Week */}
        {data.checkInsByDayOfWeek && data.checkInsByDayOfWeek.length > 0 && (
          <View style={styles.reportSection}>
            <Text style={styles.reportSectionTitle}>Attendance by Day of Week</Text>
            {data.checkInsByDayOfWeek.map((dayData, index) => (
              <View key={dayData.day} style={styles.reportItem}>
                <View style={styles.reportItemLeft}>
                  <Ionicons 
                    name={dayData.day === 0 ? 'sunny' : 'calendar'} 
                    size={18} 
                    color="#6366f1" 
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.reportItemLabel}>{dayData.dayName}</Text>
                </View>
                <Text style={styles.reportItemValue}>{formatNumber(dayData.count)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Attendance by Service Type */}
        {data.checkInsByServiceType && Object.keys(data.checkInsByServiceType).length > 0 && (
          <View style={styles.reportSection}>
            <Text style={styles.reportSectionTitle}>Attendance by Service Type</Text>
            {Object.entries(data.checkInsByServiceType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <View key={type} style={styles.reportItem}>
                  <Text style={styles.reportItemLabel}>{type}</Text>
                  <Text style={styles.reportItemValue}>{formatNumber(count)}</Text>
                </View>
              ))}
          </View>
        )}

        {recentDays.length > 0 && (
          <View style={styles.reportSection}>
            <Text style={styles.reportSectionTitle}>Recent Daily Activity</Text>
            {recentDays.map(([day, count]) => (
              <View key={day} style={styles.reportItem}>
                <Text style={styles.reportItemLabel}>
                  {new Date(day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
                <Text style={styles.reportItemValue}>{formatNumber(count)} check-ins</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderGivingReport = (data) => {
    if (!data) return null;
    const trendData = getTrendIndicator(data.periodGiving || 0, data.previousPeriodGiving || 0);
    const categories = Object.entries(data.givingByCategory || {})
      .sort((a, b) => b[1] - a[1]);

    return (
      <View style={styles.reportDetailContainer}>
        <View style={styles.reportSummaryCard}>
          <Text style={styles.reportSummaryLabel}>Total Giving</Text>
          <Text style={styles.reportSummaryValue}>{formatCurrency(data.totalGiving)}</Text>
        </View>
        
        <View style={styles.reportSummaryCard}>
          <Text style={styles.reportSummaryLabel}>This {selectedPeriod}</Text>
          <Text style={styles.reportSummaryValue}>{formatCurrency(data.periodGiving)}</Text>
          <View style={styles.trendContainer}>
            <Ionicons name={trendData.icon} size={16} color={trendData.color} />
            <Text style={[styles.trendText, { color: trendData.color }]}>
              {trendData.trend} vs previous period
            </Text>
          </View>
        </View>

        {categories.length > 0 && (
          <View style={styles.reportSection}>
            <Text style={styles.reportSectionTitle}>Giving by Category</Text>
            {categories.map(([category, amount]) => (
              <View key={category} style={styles.reportItem}>
                <Text style={styles.reportItemLabel}>{category}</Text>
                <Text style={styles.reportItemValue}>{formatCurrency(amount)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderMemberGrowthReport = (data) => {
    if (!data) return null;
    const trendData = getTrendIndicator(data.newMembers || 0, data.previousNewMembers || 0);
    const recentMonths = Object.entries(data.memberGrowthByMonth || {})
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 6);

    return (
      <View style={styles.reportDetailContainer}>
        <View style={styles.reportSummaryCard}>
          <Text style={styles.reportSummaryLabel}>Total Members</Text>
          <Text style={styles.reportSummaryValue}>{formatNumber(data.totalMembers)}</Text>
        </View>
        
        <View style={styles.reportSummaryCard}>
          <Text style={styles.reportSummaryLabel}>New This {selectedPeriod}</Text>
          <Text style={styles.reportSummaryValue}>{formatNumber(data.newMembers)}</Text>
          <View style={styles.trendContainer}>
            <Ionicons name={trendData.icon} size={16} color={trendData.color} />
            <Text style={[styles.trendText, { color: trendData.color }]}>
              {trendData.trend} vs previous period
            </Text>
          </View>
        </View>

        {recentMonths.length > 0 && (
          <View style={styles.reportSection}>
            <Text style={styles.reportSectionTitle}>Growth by Month</Text>
            {recentMonths.map(([month, count]) => (
              <View key={month} style={styles.reportItem}>
                <Text style={styles.reportItemLabel}>
                  {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
                <Text style={styles.reportItemValue}>{formatNumber(count)} new members</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderEventAnalyticsReport = (data) => {
    if (!data) return null;
    const categories = Object.entries(data.eventsByCategory || {})
      .sort((a, b) => b[1] - a[1]);

    return (
      <View style={styles.reportDetailContainer}>
        <View style={styles.reportSummaryCard}>
          <Text style={styles.reportSummaryLabel}>Total Events</Text>
          <Text style={styles.reportSummaryValue}>{formatNumber(data.totalEvents)}</Text>
        </View>
        
        <View style={styles.reportSummaryCard}>
          <Text style={styles.reportSummaryLabel}>Total Registrations</Text>
          <Text style={styles.reportSummaryValue}>{formatNumber(data.totalRegistrations)}</Text>
        </View>

        <View style={styles.reportSummaryCard}>
          <Text style={styles.reportSummaryLabel}>Avg per Event</Text>
          <Text style={styles.reportSummaryValue}>
            {formatNumber(Math.round(data.avgRegistrationsPerEvent))}
          </Text>
        </View>

        {/* Event Attendance Breakdown */}
        {data.eventAttendanceBreakdown && data.eventAttendanceBreakdown.length > 0 && (
          <View style={styles.reportSection}>
            <Text style={styles.reportSectionTitle}>Event Attendance Breakdown</Text>
            <Text style={styles.reportSectionSubtitle}>
              Registrations vs Actual Check-ins
            </Text>
            {data.eventAttendanceBreakdown.map((event, index) => {
              const attendanceRate = event.registrations > 0 
                ? ((event.checkIns / event.registrations) * 100).toFixed(1)
                : '0';
              return (
                <View key={event.id || index} style={styles.eventAttendanceItem}>
                  <View style={styles.reportItemLeft}>
                    <Text style={styles.reportItemRank}>#{index + 1}</Text>
                    <View style={{ flex: 1, marginRight: width < 400 ? 8 : 0 }}>
                      <Text style={styles.reportItemTitle} numberOfLines={2}>{event.title}</Text>
                      <Text style={styles.reportItemSubtitle} numberOfLines={1}>{event.category}</Text>
                    </View>
                  </View>
                  <View style={styles.eventAttendanceStats}>
                    <View style={styles.eventStatRow}>
                      <Ionicons name="person-add" size={14} color="#6366f1" />
                      <Text style={styles.eventStatText}>
                        {formatNumber(event.registrations)} reg.
                      </Text>
                    </View>
                    <View style={styles.eventStatRow}>
                      <Ionicons name="checkbox" size={14} color="#10b981" />
                      <Text style={styles.eventStatText}>
                        {formatNumber(event.checkIns)} checked in
                      </Text>
                    </View>
                    <Text style={styles.attendanceRateText}>
                      {attendanceRate}% attendance
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {categories.length > 0 && (
          <View style={styles.reportSection}>
            <Text style={styles.reportSectionTitle}>Events by Category</Text>
            {categories.map(([category, count]) => (
              <View key={category} style={styles.reportItem}>
                <Text style={styles.reportItemLabel}>{category}</Text>
                <Text style={styles.reportItemValue}>{formatNumber(count)} events</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderSermonViewsReport = (data) => {
    if (!data) return null;
    return (
      <View style={styles.reportDetailContainer}>
        <View style={styles.reportSummaryCard}>
          <Text style={styles.reportSummaryLabel}>Total Views</Text>
          <Text style={styles.reportSummaryValue}>{formatNumber(data.totalViews || 0)}</Text>
        </View>
        
        <View style={styles.reportSummaryCard}>
          <Text style={styles.reportSummaryLabel}>Total Sermons</Text>
          <Text style={styles.reportSummaryValue}>{formatNumber(data.totalSermons)}</Text>
        </View>

        <View style={styles.reportSummaryCard}>
          <Text style={styles.reportSummaryLabel}>Average Views</Text>
          <Text style={styles.reportSummaryValue}>
            {formatNumber(Math.round(data.avgViews))}
          </Text>
        </View>

        {data.topSermons && data.topSermons.length > 0 && (
          <View style={styles.reportSection}>
            <Text style={styles.reportSectionTitle}>Top Sermons</Text>
            {data.topSermons.map((sermon, index) => (
              <View key={index} style={styles.reportItem}>
                <View style={styles.reportItemLeft}>
                  <Text style={styles.reportItemRank}>#{index + 1}</Text>
                  <View>
                    <Text style={styles.reportItemTitle}>{sermon.title}</Text>
                    <Text style={styles.reportItemSubtitle}>{sermon.pastor}</Text>
                  </View>
                </View>
                <Text style={styles.reportItemValue}>{formatNumber(sermon.views)} views</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderEngagementReport = (data) => {
    if (!data) return null;
    const { score = 0, breakdown = {} } = data;
    const scoreColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

    return (
      <View style={styles.reportDetailContainer}>
        <View style={[styles.reportSummaryCard, { backgroundColor: scoreColor + '20' }]}>
          <Text style={styles.reportSummaryLabel}>Overall Engagement Score</Text>
          <Text style={[styles.reportSummaryValue, { color: scoreColor, fontSize: width < 400 ? 36 : 48 }]}>
            {score}%
          </Text>
        </View>

        <View style={styles.reportSection}>
          <Text style={styles.reportSectionTitle}>Engagement Breakdown</Text>
          
          <View style={styles.engagementItem}>
            <View style={styles.engagementItemHeader}>
              <Ionicons name="checkbox" size={20} color="#10b981" />
              <Text style={styles.engagementItemLabel}>Attendance</Text>
            </View>
            <View style={styles.engagementBarContainer}>
              <View style={[styles.engagementBar, { width: `${Math.min(breakdown.attendance, 100)}%`, backgroundColor: '#10b981' }]} />
              <Text style={styles.engagementBarText}>{Math.round(breakdown.attendance)}%</Text>
            </View>
          </View>

          <View style={styles.engagementItem}>
            <View style={styles.engagementItemHeader}>
              <Ionicons name="heart" size={20} color="#ef4444" />
              <Text style={styles.engagementItemLabel}>Giving</Text>
            </View>
            <View style={styles.engagementBarContainer}>
              <View style={[styles.engagementBar, { width: `${Math.min(breakdown.giving, 100)}%`, backgroundColor: '#ef4444' }]} />
              <Text style={styles.engagementBarText}>{Math.round(breakdown.giving)}%</Text>
            </View>
          </View>

          <View style={styles.engagementItem}>
            <View style={styles.engagementItemHeader}>
              <Ionicons name="calendar" size={20} color="#f59e0b" />
              <Text style={styles.engagementItemLabel}>Events</Text>
            </View>
            <View style={styles.engagementBarContainer}>
              <View style={[styles.engagementBar, { width: `${Math.min(breakdown.events, 100)}%`, backgroundColor: '#f59e0b' }]} />
              <Text style={styles.engagementBarText}>{Math.round(breakdown.events)}%</Text>
            </View>
          </View>

          <View style={styles.engagementItem}>
            <View style={styles.engagementItemHeader}>
              <Ionicons name="hand-left" size={20} color="#6366f1" />
              <Text style={styles.engagementItemLabel}>Prayers</Text>
            </View>
            <View style={styles.engagementBarContainer}>
              <View style={[styles.engagementBar, { width: `${Math.min(breakdown.prayers, 100)}%`, backgroundColor: '#6366f1' }]} />
              <Text style={styles.engagementBarText}>{Math.round(breakdown.prayers)}%</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Generate chart data for giving trends
  const givingChartData = [
    previousStats.periodGiving || 0,
    stats.periodGiving || 0,
    (stats.periodGiving || 0) * 1.1, // Projected
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reports & Analytics</Text>
          <TouchableOpacity 
            style={styles.downloadButton}
            onPress={onRefresh}
          >
            <Ionicons name="refresh-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {['Day', 'Week', 'Month', 'Year'].map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonSelected,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            {selectedPeriod === period && (
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            )}
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

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
            }
          >
            {/* Summary Cards */}
            <View style={styles.summarySection}>
              <SummaryCard
                icon="people"
                title="Total Members"
                value={formatNumber(stats.totalMembers)}
                subtitle={`${stats.newMembers} new this ${selectedPeriod.toLowerCase()}`}
                trend={{ current: stats.totalMembers, previous: previousStats.totalMembers }}
                gradient={['#6366f1', '#8b5cf6']}
              />
              <SummaryCard
                icon="heart"
                title="Total Giving"
                value={formatCurrency(stats.totalGiving)}
                subtitle={formatCurrency(stats.periodGiving) + ` this ${selectedPeriod.toLowerCase()}`}
                trend={{ current: stats.totalGiving, previous: previousStats.totalGiving }}
                gradient={['#ef4444', '#dc2626']}
              />
            </View>

            {/* Overview Stats */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Detailed Statistics</Text>
                <Text style={styles.sectionSubtitle}>Compare with previous period</Text>
              </View>
              {reportCards.map((card) => (
                <View key={card.id} style={styles.reportCard}>
                  <View style={styles.reportHeader}>
                    <LinearGradient
                      colors={card.gradient}
                      style={styles.reportIcon}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name={card.icon} size={24} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.reportTitle}>{card.title}</Text>
                  </View>
                  <View style={styles.reportStats}>
                    {card.stats.map((stat, index) => {
                      const trendData = stat.trend ? getTrendIndicator(stat.trend.current, stat.trend.previous) : null;
                      return (
                        <View key={index} style={styles.reportStatItem}>
                          <Text style={styles.reportStatValue}>{stat.value}</Text>
                          <Text style={styles.reportStatLabel}>{stat.label}</Text>
                          {trendData && (
                            <View style={styles.miniTrendContainer}>
                              <Ionicons name={trendData.icon} size={12} color={trendData.color} />
                              <Text style={[styles.miniTrendText, { color: trendData.color }]}>
                                {trendData.trend}
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>

            {/* Giving Trend Chart */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Giving Trend</Text>
                <Text style={styles.sectionSubtitle}>Period comparison</Text>
              </View>
              <View style={styles.chartCard}>
                <View style={styles.chartLabels}>
                  <Text style={styles.chartLabel}>Previous</Text>
                  <Text style={styles.chartLabel}>Current</Text>
                  <Text style={styles.chartLabel}>Projected</Text>
                </View>
                <SimpleBarChart 
                  data={givingChartData} 
                  maxValue={Math.max(...givingChartData) * 1.2}
                  color="#ef4444"
                  height={120}
                />
              </View>
            </View>

            {/* Quick Reports */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Quick Reports</Text>
                <Text style={styles.sectionSubtitle}>Access detailed analytics</Text>
              </View>
              <View style={styles.quickReportsGrid}>
                {getQuickReports().map((report) => (
                  <TouchableOpacity
                    key={report.id}
                    style={styles.quickReportCard}
                    onPress={() => handleQuickReport(report)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.quickReportIcon, { backgroundColor: report.color }]}>
                      <Ionicons name={report.icon} size={24} color="#fff" />
                    </View>
                    <View style={styles.quickReportContent}>
                      <Text style={styles.quickReportText}>{report.title}</Text>
                      {report.subtitle && (
                        <Text style={styles.quickReportSubtext}>{report.subtitle}</Text>
                      )}
                      {report.value && (
                        <Text style={styles.quickReportValue}>{report.value}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Export Options */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Export Reports</Text>
                <Text style={styles.sectionSubtitle}>Download comprehensive reports</Text>
              </View>
              <TouchableOpacity 
                style={styles.exportButton}
                onPress={handleExportPDF}
                activeOpacity={0.8}
                disabled={generatingPDF}
              >
                <LinearGradient
                  colors={['#6366f1', '#8b5cf6']}
                  style={styles.exportButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {generatingPDF ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.exportButtonText}>Generating PDF...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="document-text" size={24} color="#fff" />
                      <Text style={styles.exportButtonText}>Export to PDF</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.exportButton}
                onPress={handleExportExcel}
                activeOpacity={0.8}
              >
                <View style={styles.exportButtonOutline}>
                  <Ionicons name="grid" size={24} color="#6366f1" />
                  <Text style={styles.exportButtonTextOutline}>Export to Excel</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>
        </Animated.View>
      )}
      
      {renderReportModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  periodButtonSelected: {
    borderColor: '#6366f1',
  },
  periodText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    zIndex: 1,
  },
  periodTextSelected: {
    color: '#fff',
    fontWeight: '700',
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
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  summarySection: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryCardContent: {
    alignItems: 'flex-start',
  },
  summaryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTextContainer: {
    width: '100%',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  reportIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  reportStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  reportStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  reportStatValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  reportStatLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 4,
  },
  miniTrendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  miniTrendText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  chartContainer: {
    marginTop: 16,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  chartLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 140,
    paddingHorizontal: 8,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 4,
  },
  bar: {
    width: '80%',
    borderRadius: 8,
    marginBottom: 8,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    marginTop: 4,
  },
  quickReportsGrid: {
    gap: 12,
  },
  quickReportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  quickReportIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  quickReportContent: {
    flex: 1,
  },
  quickReportText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  quickReportSubtext: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  exportButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  exportButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  exportButtonOutline: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 14,
    gap: 12,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  exportButtonTextOutline: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingTop: Platform.OS === 'android' 
      ? height * 0.25 
      : height < 700 ? 40 : 60,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: Platform.OS === 'android' 
      ? height * 0.75 
      : height < 700 ? height * 0.4 : height * 0.3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    paddingTop: height < 700 ? 12 : 16,
    paddingBottom: height < 700 ? 12 : 16,
    paddingHorizontal: width < 400 ? 16 : 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  modalHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: width < 400 ? 18 : 22,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    paddingRight: 8,
  },
  modalCloseButton: {
    width: width < 400 ? 32 : 36,
    height: width < 400 ? 32 : 36,
    borderRadius: width < 400 ? 16 : 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    flex: 1,
    padding: width < 400 ? 16 : 20,
    paddingBottom: 10,
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  reportDetailContainer: {
    gap: width < 400 ? 12 : 16,
  },
  reportSummaryCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: width < 400 ? 16 : 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reportSummaryLabel: {
    fontSize: width < 400 ? 12 : 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: width < 400 ? 6 : 8,
  },
  reportSummaryValue: {
    fontSize: width < 400 ? 24 : 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  reportSection: {
    marginTop: width < 400 ? 6 : 8,
  },
  reportSectionTitle: {
    fontSize: width < 400 ? 16 : 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: width < 400 ? 12 : 16,
  },
  reportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: width < 400 ? 10 : 12,
    paddingHorizontal: width < 400 ? 12 : 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: width < 400 ? 6 : 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: width < 400 ? 44 : 48,
  },
  reportItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportItemRank: {
    fontSize: width < 400 ? 14 : 16,
    fontWeight: 'bold',
    color: '#6366f1',
    marginRight: width < 400 ? 8 : 12,
    minWidth: width < 400 ? 24 : 30,
  },
  reportItemTitle: {
    fontSize: width < 400 ? 13 : 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
    flex: 1,
    flexWrap: 'wrap',
  },
  reportItemSubtitle: {
    fontSize: width < 400 ? 11 : 12,
    color: '#6b7280',
  },
  reportItemLabel: {
    fontSize: width < 400 ? 12 : 14,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
  },
  reportItemValue: {
    fontSize: width < 400 ? 14 : 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: width < 400 ? 8 : 12,
    textAlign: 'right',
  },
  engagementItem: {
    marginBottom: width < 400 ? 16 : 20,
  },
  engagementItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: width < 400 ? 6 : 8,
  },
  engagementItemLabel: {
    fontSize: width < 400 ? 12 : 14,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  engagementBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: width < 400 ? 8 : 12,
  },
  engagementBar: {
    flex: 1,
    height: width < 400 ? 6 : 8,
    borderRadius: 4,
  },
  engagementBarText: {
    fontSize: width < 400 ? 11 : 12,
    fontWeight: '600',
    color: '#6b7280',
    minWidth: width < 400 ? 35 : 40,
    textAlign: 'right',
  },
  quickReportValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  reportSectionSubtitle: {
    fontSize: width < 400 ? 11 : 12,
    color: '#6b7280',
    marginBottom: width < 400 ? 10 : 12,
    fontStyle: 'italic',
  },
  eventAttendanceItem: {
    flexDirection: width < 400 ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: width < 400 ? 'flex-start' : 'flex-start',
    paddingVertical: width < 400 ? 12 : 14,
    paddingHorizontal: width < 400 ? 12 : 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: width < 400 ? 8 : 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eventAttendanceStats: {
    alignItems: width < 400 ? 'flex-start' : 'flex-end',
    gap: 4,
    marginTop: width < 400 ? 8 : 0,
    width: width < 400 ? '100%' : 'auto',
  },
  eventStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventStatText: {
    fontSize: width < 400 ? 11 : 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  attendanceRateText: {
    fontSize: width < 400 ? 10 : 11,
    color: '#6366f1',
    fontWeight: '600',
    marginTop: 4,
    paddingHorizontal: width < 400 ? 6 : 8,
    paddingVertical: 2,
    backgroundColor: '#6366f120',
    borderRadius: 6,
  },
});




