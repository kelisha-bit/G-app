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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../../firebase.config';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';

const { width } = Dimensions.get('window');

export default function ReportsScreen({ navigation }) {
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
  const fadeAnim = useState(new Animated.Value(0))[0];

  const loadStatistics = async () => {
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
          if (createdDate >= new Date(periodDate)) {
            newMembers++;
          }
          if (createdDate >= new Date(previousPeriodDate) && createdDate < new Date(periodDate)) {
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
              if (createdDate >= new Date(periodDate)) {
                periodGiving += amount;
              } else if (createdDate >= new Date(previousPeriodDate) && createdDate < new Date(periodDate)) {
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

      // Store previous stats before updating (using current stats as previous)
      setPreviousStats((prev) => {
        const currentStats = {
          totalMembers: stats.totalMembers || 0,
          totalEvents: stats.totalEvents || 0,
          totalSermons: stats.totalSermons || 0,
          totalCheckIns: stats.totalCheckIns || 0,
          totalPrayers: stats.totalPrayers || 0,
          totalGiving: stats.totalGiving || 0,
          newMembers: stats.newMembers || 0,
          activeVolunteers: stats.activeVolunteers || 0,
          periodGiving: stats.periodGiving || 0,
          avgGivingPerMember: stats.avgGivingPerMember || 0,
          totalAnnouncements: stats.totalAnnouncements || 0,
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
  };

  useEffect(() => {
    loadStatistics();
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [selectedPeriod]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStatistics();
    setRefreshing(false);
  };

  const getPeriodDate = (period) => {
    const now = new Date();
    const periodDate = new Date();
    
    switch (period) {
      case 'Day':
        periodDate.setDate(now.getDate() - 1);
        break;
      case 'Week':
        periodDate.setDate(now.getDate() - 7);
        break;
      case 'Month':
        periodDate.setMonth(now.getMonth() - 1);
        break;
      case 'Year':
        periodDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        periodDate.setMonth(now.getMonth() - 1);
    }
    
    // Set to start of day
    periodDate.setHours(0, 0, 0, 0);
    return periodDate.toISOString();
  };

  const getPreviousPeriodDate = (period) => {
    const periodDate = new Date(getPeriodDate(period));
    const previousPeriodDate = new Date(periodDate);
    
    switch (period) {
      case 'Day':
        previousPeriodDate.setDate(periodDate.getDate() - 1);
        break;
      case 'Week':
        previousPeriodDate.setDate(periodDate.getDate() - 7);
        break;
      case 'Month':
        previousPeriodDate.setMonth(periodDate.getMonth() - 1);
        break;
      case 'Year':
        previousPeriodDate.setFullYear(periodDate.getFullYear() - 1);
        break;
      default:
        previousPeriodDate.setMonth(periodDate.getMonth() - 1);
    }
    
    previousPeriodDate.setHours(0, 0, 0, 0);
    return previousPeriodDate.toISOString();
  };

  const calculateTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    const change = ((current - previous) / previous) * 100;
    return parseFloat(change.toFixed(1));
  };

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

  const quickReports = [
    { id: 1, title: 'Attendance Report', icon: 'checkbox', color: '#10b981', subtitle: 'Check-in analytics' },
    { id: 2, title: 'Giving Report', icon: 'heart', color: '#ef4444', subtitle: 'Donation breakdown' },
    { id: 3, title: 'Member Growth', icon: 'trending-up', color: '#6366f1', subtitle: 'Growth trends' },
    { id: 4, title: 'Event Analytics', icon: 'calendar', color: '#f59e0b', subtitle: 'Event statistics' },
    { id: 5, title: 'Sermon Views', icon: 'play-circle', color: '#8b5cf6', subtitle: 'View analytics' },
    { id: 6, title: 'Engagement Score', icon: 'stats-chart', color: '#14b8a6', subtitle: 'Overall engagement' },
  ];

  const handleExportPDF = () => {
    Alert.alert(
      'Export to PDF',
      'This feature will generate a comprehensive PDF report with all analytics.',
      [{ text: 'OK', onPress: () => console.log('PDF Export initiated') }]
    );
  };

  const handleExportExcel = () => {
    Alert.alert(
      'Export to Excel',
      'This feature will generate an Excel spreadsheet with detailed data.',
      [{ text: 'OK', onPress: () => console.log('Excel Export initiated') }]
    );
  };

  const handleQuickReport = (report) => {
    Alert.alert(
      report.title,
      `${report.subtitle || 'Detailed analytics'} for ${report.title.toLowerCase()}.`,
      [{ text: 'OK' }]
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
                {quickReports.map((report) => (
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
              >
                <LinearGradient
                  colors={['#6366f1', '#8b5cf6']}
                  style={styles.exportButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="document-text" size={24} color="#fff" />
                  <Text style={styles.exportButtonText}>Export to PDF</Text>
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
});




