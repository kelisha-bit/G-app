import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db, auth } from '../../firebase.config';

export default function VolunteerScreen({ navigation }) {
  const [selectedOpportunities, setSelectedOpportunities] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [userApplications, setUserApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      await Promise.all([
        loadOpportunities(),
        loadUserApplications(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load volunteer opportunities. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const loadOpportunities = async () => {
    try {
      // Try with orderBy first, fallback to simple query if it fails
      let querySnapshot;
      try {
        const opportunitiesQuery = query(
          collection(db, 'volunteerOpportunities'),
          orderBy('title', 'asc')
        );
        querySnapshot = await getDocs(opportunitiesQuery);
      } catch (orderByError) {
        // If orderBy fails (e.g., missing index or permissions), try without it
        console.log('orderBy failed, trying without:', orderByError);
        querySnapshot = await getDocs(collection(db, 'volunteerOpportunities'));
      }
      
      if (querySnapshot.empty) {
        // If no opportunities in Firestore, use default sample data
        const defaultOpportunities = [
          {
            id: '1',
            title: 'Sunday Service Usher',
            department: 'Ushering',
            time: 'Sundays, 8:30 AM - 12:00 PM',
            icon: 'people',
            color: '#10b981',
            totalSpots: 5,
          },
          {
            id: '2',
            title: 'Children Church Teacher',
            department: 'Children Ministry',
            time: 'Sundays, 9:00 AM - 11:00 AM',
            icon: 'happy',
            color: '#f59e0b',
            totalSpots: 3,
          },
          {
            id: '3',
            title: 'Media Team Member',
            department: 'Media & Tech',
            time: 'Flexible Schedule',
            icon: 'videocam',
            color: '#6366f1',
            totalSpots: 2,
          },
          {
            id: '4',
            title: 'Prayer Intercessor',
            department: 'Prayer Team',
            time: 'Daily, 6:00 AM - 7:00 AM',
            icon: 'hand-left',
            color: '#8b5cf6',
            totalSpots: 10,
          },
          {
            id: '5',
            title: 'Hospitality Server',
            department: 'Hospitality',
            time: 'Sundays, After Service',
            icon: 'restaurant',
            color: '#14b8a6',
            totalSpots: 4,
          },
          {
            id: '6',
            title: 'Outreach Volunteer',
            department: 'Evangelism',
            time: 'Saturdays, 2:00 PM - 5:00 PM',
            icon: 'megaphone',
            color: '#ef4444',
            totalSpots: 8,
          },
        ];
        setOpportunities(defaultOpportunities);
        return;
      }

      const opportunitiesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOpportunities(opportunitiesData);
    } catch (error) {
      console.error('Error loading opportunities:', error);
      // Use default data on error
      const defaultOpportunities = [
        {
          id: '1',
          title: 'Sunday Service Usher',
          department: 'Ushering',
          time: 'Sundays, 8:30 AM - 12:00 PM',
          icon: 'people',
          color: '#10b981',
          totalSpots: 5,
        },
        {
          id: '2',
          title: 'Children Church Teacher',
          department: 'Children Ministry',
          time: 'Sundays, 9:00 AM - 11:00 AM',
          icon: 'happy',
          color: '#f59e0b',
          totalSpots: 3,
        },
        {
          id: '3',
          title: 'Media Team Member',
          department: 'Media & Tech',
          time: 'Flexible Schedule',
          icon: 'videocam',
          color: '#6366f1',
          totalSpots: 2,
        },
        {
          id: '4',
          title: 'Prayer Intercessor',
          department: 'Prayer Team',
          time: 'Daily, 6:00 AM - 7:00 AM',
          icon: 'hand-left',
          color: '#8b5cf6',
          totalSpots: 10,
        },
        {
          id: '5',
          title: 'Hospitality Server',
          department: 'Hospitality',
          time: 'Sundays, After Service',
          icon: 'restaurant',
          color: '#14b8a6',
          totalSpots: 4,
        },
        {
          id: '6',
          title: 'Outreach Volunteer',
          department: 'Evangelism',
          time: 'Saturdays, 2:00 PM - 5:00 PM',
          icon: 'megaphone',
          color: '#ef4444',
          totalSpots: 8,
        },
      ];
      setOpportunities(defaultOpportunities);
    }
  };

  const loadUserApplications = async () => {
    if (!auth.currentUser) return;
    
    try {
      const applicationsQuery = query(
        collection(db, 'volunteerApplications'),
        where('userId', '==', auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(applicationsQuery);
      
      const applications = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setUserApplications(applications);
    } catch (error) {
      console.error('Error loading user applications:', error);
    }
  };

  const getAvailableSpots = (opportunityId) => {
    // Count applications for this opportunity
    const applicationsForOpportunity = userApplications.filter(
      (app) => app.opportunityId === opportunityId
    );
    
    const opportunity = opportunities.find((opp) => opp.id === opportunityId);
    if (!opportunity) return 0;
    
    const totalSpots = opportunity.totalSpots || opportunity.spots || 0;
    
    // For now, we'll calculate based on user's own applications
    // In a full implementation, you'd count all applications
    const takenSpots = applicationsForOpportunity.length;
    const available = Math.max(0, totalSpots - takenSpots);
    
    return available;
  };

  const hasApplied = (opportunityId) => {
    return userApplications.some((app) => app.opportunityId === opportunityId);
  };

  const toggleSelection = (id) => {
    if (hasApplied(id)) {
      Alert.alert(
        'Already Applied',
        'You have already applied for this opportunity. Our team will contact you soon!'
      );
      return;
    }

    const availableSpots = getAvailableSpots(id);
    if (availableSpots <= 0 && !selectedOpportunities.includes(id)) {
      Alert.alert('Full', 'This opportunity is currently full. Please check back later.');
      return;
    }

    if (selectedOpportunities.includes(id)) {
      setSelectedOpportunities(selectedOpportunities.filter((item) => item !== id));
    } else {
      setSelectedOpportunities([...selectedOpportunities, id]);
    }
  };

  const handleSignUp = async () => {
    if (selectedOpportunities.length === 0) {
      Alert.alert('Error', 'Please select at least one opportunity');
      return;
    }

    if (!auth.currentUser) {
      Alert.alert('Error', 'Please log in to volunteer');
      navigation.navigate('Login');
      return;
    }

    // Check if user has already applied for any selected opportunity
    const alreadyApplied = selectedOpportunities.filter((id) => hasApplied(id));
    if (alreadyApplied.length > 0) {
      Alert.alert(
        'Already Applied',
        'You have already applied for some of these opportunities. Please select different ones.'
      );
      return;
    }

    try {
      setSubmitting(true);
      
      // Get user data
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      // Create applications for each selected opportunity
      const applicationPromises = selectedOpportunities.map((opportunityId) => {
        const opportunity = opportunities.find((opp) => opp.id === opportunityId);
        return addDoc(collection(db, 'volunteerApplications'), {
          userId: auth.currentUser.uid,
          userName: userData.displayName || auth.currentUser.displayName || 'Member',
          userEmail: auth.currentUser.email || '',
          opportunityId: opportunityId,
          opportunityTitle: opportunity?.title || '',
          opportunityDepartment: opportunity?.department || '',
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
      });

      await Promise.all(applicationPromises);

      Alert.alert(
        'Success!',
        `You have successfully applied for ${selectedOpportunities.length} opportunity(ies). Our team will contact you soon!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedOpportunities([]);
              loadData(); // Reload to show updated status
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting applications:', error);
      Alert.alert('Error', 'Failed to submit your application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Volunteer</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading opportunities...</Text>
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
        <Text style={styles.headerTitle}>Volunteer</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />
        }
      >
        <View style={styles.bannerCard}>
          <Ionicons name="heart" size={40} color="#ef4444" />
          <Text style={styles.bannerTitle}>Serve with Purpose</Text>
          <Text style={styles.bannerText}>
            Use your gifts and talents to make a difference in our church and community
          </Text>
          <TouchableOpacity
            style={styles.challengeLink}
            onPress={() => navigation.navigate('GoalsChallenges')}
          >
            <Ionicons name="flag" size={16} color="#6366f1" />
            <Text style={styles.challengeLinkText}>Track your service goals</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Available Opportunities</Text>

        {opportunities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No opportunities available</Text>
            <Text style={styles.emptySubtext}>Check back later for volunteer opportunities</Text>
          </View>
        ) : (
          opportunities.map((opportunity) => {
            const availableSpots = getAvailableSpots(opportunity.id);
            const applied = hasApplied(opportunity.id);
            const isSelected = selectedOpportunities.includes(opportunity.id);
            const isDisabled = applied || availableSpots <= 0;

            return (
              <TouchableOpacity
                key={opportunity.id}
                style={[
                  styles.opportunityCard,
                  isSelected && styles.opportunityCardSelected,
                  isDisabled && styles.opportunityCardDisabled,
                ]}
                onPress={() => toggleSelection(opportunity.id)}
                disabled={isDisabled && !applied}
              >
                <View
                  style={[
                    styles.opportunityIcon,
                    { backgroundColor: opportunity.color },
                  ]}
                >
                  <Ionicons name={opportunity.icon} size={28} color="#fff" />
                </View>
                <View style={styles.opportunityInfo}>
                  <View style={styles.opportunityHeader}>
                    <Text style={styles.opportunityTitle}>{opportunity.title}</Text>
                    {applied && (
                      <View style={styles.appliedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                        <Text style={styles.appliedText}>Applied</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.opportunityDepartment}>
                    {opportunity.department}
                  </Text>
                  <View style={styles.opportunityMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color="#6b7280" />
                      <Text style={styles.metaText}>{opportunity.time}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="people-outline" size={14} color="#6b7280" />
                      <Text style={[
                        styles.metaText,
                        availableSpots <= 0 && styles.metaTextFull
                      ]}>
                        {availableSpots > 0 ? `${availableSpots} spots left` : 'Full'}
                      </Text>
                    </View>
                  </View>
                </View>
                {!applied && (
                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected,
                      isDisabled && styles.checkboxDisabled,
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    )}
                  </View>
                )}
                {applied && (
                  <View style={styles.checkboxApplied}>
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}

        {selectedOpportunities.length > 0 && (
          <TouchableOpacity 
            style={[styles.signUpButton, submitting && styles.signUpButtonDisabled]} 
            onPress={handleSignUp}
            disabled={submitting}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.signUpGradient}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
              )}
              <Text style={styles.signUpButtonText}>
                {submitting 
                  ? 'Submitting...' 
                  : `Sign Up (${selectedOpportunities.length})`
                }
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  bannerCard: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 15,
    marginBottom: 10,
  },
  bannerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  challengeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  challengeLinkText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  opportunityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  opportunityCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f5f3ff',
  },
  opportunityCardDisabled: {
    opacity: 0.6,
  },
  opportunityIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  opportunityInfo: {
    flex: 1,
  },
  opportunityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  opportunityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  appliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  appliedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 4,
  },
  opportunityDepartment: {
    fontSize: 13,
    color: '#6366f1',
    marginBottom: 8,
    fontWeight: '600',
  },
  opportunityMeta: {
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 5,
  },
  metaTextFull: {
    color: '#ef4444',
    fontWeight: '600',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  checkboxDisabled: {
    borderColor: '#d1d5db',
    backgroundColor: '#f3f4f6',
  },
  checkboxApplied: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpButton: {
    marginTop: 20,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
  },
  signUpButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
});
