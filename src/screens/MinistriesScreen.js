import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, orderBy, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase.config';

export default function MinistriesScreen({ navigation }) {
  const [ministries, setMinistries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userMemberships, setUserMemberships] = useState([]);

  useEffect(() => {
    loadMinistries();
    loadUserMemberships();
  }, []);

  const loadMinistries = async () => {
    try {
      setLoading(true);
      const ministriesQuery = query(
        collection(db, 'ministries'),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(ministriesQuery);
      
      if (!querySnapshot.empty) {
        const ministriesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMinistries(ministriesData);
      } else {
        // Use fallback data if no ministries in Firestore
        setMinistries(getFallbackMinistries());
      }
    } catch (error) {
      console.error('Error loading ministries:', error);
      // Use fallback data on error
      setMinistries(getFallbackMinistries());
    } finally {
      setLoading(false);
    }
  };

  const loadUserMemberships = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserMemberships(userData.ministries || []);
      }
    } catch (error) {
      console.error('Error loading user memberships:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMinistries();
    await loadUserMemberships();
    setRefreshing(false);
  };

  const getFallbackMinistries = () => [
    {
      id: 'youth',
      name: 'Youth Ministry',
      leader: 'Pastor Emmanuel',
      schedule: 'Saturdays, 5:00 PM',
      memberCount: 120,
      members: [],
      image: 'https://via.placeholder.com/400x200',
      description: 'Empowering young people to live for Christ',
      ageRange: '13-35 years',
      contact: '+233 20 123 4567',
    },
    {
      id: 'women',
      name: "Women's Ministry",
      leader: 'Sister Grace',
      schedule: 'First Saturday, 3:00 PM',
      memberCount: 85,
      members: [],
      image: 'https://via.placeholder.com/400x200',
      description: 'Building strong women of faith',
      ageRange: 'All ages',
      contact: '+233 20 234 5678',
    },
    {
      id: 'men',
      name: "Men's Ministry",
      leader: 'Brother Kwame',
      schedule: 'Second Saturday, 6:00 AM',
      memberCount: 70,
      members: [],
      image: 'https://via.placeholder.com/400x200',
      description: 'Raising godly men and leaders',
      ageRange: '18+ years',
      contact: '+233 20 345 6789',
    },
    {
      id: 'singles',
      name: 'Singles Ministry',
      leader: 'Pastor Ama',
      schedule: 'Sundays, 2:00 PM',
      memberCount: 95,
      members: [],
      image: 'https://via.placeholder.com/400x200',
      description: 'Fellowship and growth for singles',
      ageRange: '18-45 years',
      contact: '+233 20 456 7890',
    },
    {
      id: 'marriage',
      name: 'Marriage Ministry',
      leader: 'Pastor & Mrs. Mensah',
      schedule: 'Third Friday, 7:00 PM',
      memberCount: 60,
      members: [],
      image: 'https://via.placeholder.com/400x200',
      description: 'Strengthening marriages and families',
      ageRange: 'Married couples',
      contact: '+233 20 567 8901',
    },
  ];

  const handleJoinMinistry = async (ministry) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Authentication Required', 'Please login to join a ministry');
        return;
      }

      const isAlreadyMember = userMemberships.includes(ministry.id);

      if (isAlreadyMember) {
        Alert.alert(
          'Leave Ministry',
          `Are you sure you want to leave ${ministry.name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Leave',
              style: 'destructive',
              onPress: async () => {
                await leaveMinistry(ministry);
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Join Ministry',
          `Would you like to join ${ministry.name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Join',
              onPress: async () => {
                await joinMinistry(ministry);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error handling ministry membership:', error);
      Alert.alert('Error', 'Failed to update ministry membership');
    }
  };

  const joinMinistry = async (ministry) => {
    try {
      const user = auth.currentUser;
      
      // Add user to ministry members
      const ministryRef = doc(db, 'ministries', ministry.id);
      await updateDoc(ministryRef, {
        members: arrayUnion(user.uid),
        memberCount: (ministry.memberCount || 0) + 1,
      });

      // Add ministry to user's memberships
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ministries: arrayUnion(ministry.id),
      });

      setUserMemberships([...userMemberships, ministry.id]);
      
      // Update local state
      setMinistries(ministries.map(m => 
        m.id === ministry.id 
          ? { ...m, memberCount: (m.memberCount || 0) + 1, members: [...(m.members || []), user.uid] }
          : m
      ));

      Alert.alert('Success', `You have joined ${ministry.name}!`);
    } catch (error) {
      console.error('Error joining ministry:', error);
      Alert.alert('Error', 'Failed to join ministry. Please try again.');
    }
  };

  const leaveMinistry = async (ministry) => {
    try {
      const user = auth.currentUser;
      
      // Remove user from ministry members
      const ministryRef = doc(db, 'ministries', ministry.id);
      await updateDoc(ministryRef, {
        members: arrayRemove(user.uid),
        memberCount: Math.max((ministry.memberCount || 0) - 1, 0),
      });

      // Remove ministry from user's memberships
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ministries: arrayRemove(ministry.id),
      });

      setUserMemberships(userMemberships.filter(id => id !== ministry.id));
      
      // Update local state
      setMinistries(ministries.map(m => 
        m.id === ministry.id 
          ? { 
              ...m, 
              memberCount: Math.max((m.memberCount || 0) - 1, 0),
              members: (m.members || []).filter(uid => uid !== user.uid)
            }
          : m
      ));

      Alert.alert('Success', `You have left ${ministry.name}`);
    } catch (error) {
      console.error('Error leaving ministry:', error);
      Alert.alert('Error', 'Failed to leave ministry. Please try again.');
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#8b5cf6', '#a855f7']} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ministries</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading ministries...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#8b5cf6', '#a855f7']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ministries</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

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
        <View style={styles.infoCard}>
          <Ionicons name="business" size={32} color="#6366f1" />
          <Text style={styles.infoTitle}>Life-Stage Ministries</Text>
          <Text style={styles.infoText}>
            Join large, organized ministries based on your life stage (Youth, Men, Women, Singles, Marriage). These are formal church ministries with regular programs and activities.
          </Text>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Ionicons name="people" size={14} color="#6366f1" />
              <Text style={styles.badgeText}>Large Groups</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="calendar" size={14} color="#6366f1" />
              <Text style={styles.badgeText}>Monthly Events</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="star" size={14} color="#6366f1" />
              <Text style={styles.badgeText}>Organized</Text>
            </View>
          </View>
        </View>

        {ministries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>No Ministries Yet</Text>
            <Text style={styles.emptyStateText}>
              Check back later for ministry opportunities
            </Text>
          </View>
        ) : (
          ministries.map((ministry) => {
            const isMember = userMemberships.includes(ministry.id);
            return (
              <TouchableOpacity key={ministry.id} style={styles.ministryCard}>
                <Image source={{ uri: ministry.image }} style={styles.ministryImage} />
                {isMember && (
                  <View style={styles.memberBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.memberBadgeText}>Member</Text>
                  </View>
                )}
                <View style={styles.ministryContent}>
                  <Text style={styles.ministryName}>{ministry.name}</Text>
                  <Text style={styles.ministryDescription}>{ministry.description}</Text>
                  
                  <View style={styles.ministryDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="person-outline" size={16} color="#6366f1" />
                      <Text style={styles.detailText}>Led by {ministry.leader}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={16} color="#6366f1" />
                      <Text style={styles.detailText}>{ministry.schedule}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="people-outline" size={16} color="#6366f1" />
                      <Text style={styles.detailText}>{ministry.memberCount || 0} members</Text>
                    </View>
                    {ministry.ageRange && (
                      <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color="#6366f1" />
                        <Text style={styles.detailText}>{ministry.ageRange}</Text>
                      </View>
                    )}
                    {ministry.contact && (
                      <View style={styles.detailRow}>
                        <Ionicons name="call-outline" size={16} color="#6366f1" />
                        <Text style={styles.detailText}>{ministry.contact}</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity 
                    style={[
                      styles.joinButton,
                      isMember && styles.leaveButton
                    ]}
                    onPress={() => handleJoinMinistry(ministry)}
                  >
                    <Text style={styles.joinButtonText}>
                      {isMember ? 'Leave Ministry' : 'Join Ministry'}
                    </Text>
                    <Ionicons 
                      name={isMember ? 'exit-outline' : 'arrow-forward'} 
                      size={16} 
                      color="#fff" 
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
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
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 10,
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  ministryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  ministryImage: {
    width: '100%',
    height: 150,
  },
  memberBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  memberBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  ministryContent: {
    padding: 15,
  },
  ministryName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  ministryDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 15,
    lineHeight: 20,
  },
  ministryDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 8,
    flex: 1,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 12,
  },
  leaveButton: {
    backgroundColor: '#ef4444',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 5,
  },
});

