import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db, auth } from '../../firebase.config';

export default function DepartmentDetailsScreen({ navigation, route }) {
  const { departmentId } = route.params;
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    loadDepartmentDetails();
  }, [departmentId]);

  const getFallbackDepartment = (id) => {
    const fallbackDepartments = {
      worship: {
        id: 'worship',
        name: 'Worship & Music',
        icon: 'musical-notes',
        color: '#ec4899',
        description: 'Leading the congregation in worship',
        fullDescription: 'The Worship & Music department is dedicated to leading the congregation into the presence of God through music, song, and worship. We believe that worship is more than just music—it\'s a lifestyle of honoring God in everything we do.',
        memberCount: 0,
        members: [],
        meetings: 'Weekly',
        leaders: [{ name: 'Michael Johnson', role: 'Worship Director', phone: '+233 20 123 4567' }],
        activities: ['Lead Sunday worship services', 'Organize choir practice', 'Coordinate with worship leaders'],
        schedule: { frequency: 'Every Sunday', day: 'Sunday', time: '9:00 AM', location: 'Main Sanctuary' },
        requirements: ['Love for worship and music', 'Commitment to weekly rehearsals'],
        contact: { name: 'Michael Johnson', phone: '+233 20 123 4567', email: 'worship@church.org' },
      },
      media: {
        id: 'media',
        name: 'Media & Tech',
        icon: 'videocam',
        color: '#6366f1',
        description: 'Audio, video, and technical support',
        fullDescription: 'The Media & Tech department ensures that all technical aspects of church services run smoothly.',
        memberCount: 0,
        members: [],
        meetings: 'Weekly',
        leaders: [{ name: 'David Chen', role: 'Media Director', phone: '+233 20 345 6789' }],
        activities: ['Operate sound systems', 'Record sermons', 'Manage live streaming'],
        schedule: { frequency: 'Every Sunday', day: 'Saturday', time: '4:00 PM', location: 'Media Room' },
        requirements: ['Basic technical knowledge', 'Reliability'],
        contact: { name: 'David Chen', phone: '+233 20 345 6789', email: 'media@church.org' },
      },
      ushering: {
        id: 'ushering',
        name: 'Ushering',
        icon: 'people',
        color: '#10b981',
        description: 'Welcoming and guiding members',
        fullDescription: 'The Ushering department serves as the first point of contact for members and visitors.',
        memberCount: 0,
        members: [],
        meetings: 'Bi-weekly',
        leaders: [{ name: 'Grace Mensah', role: 'Head Usher', phone: '+233 20 456 7890' }],
        activities: ['Welcome visitors', 'Guide seating', 'Assist with offerings'],
        schedule: { frequency: 'Every Sunday', day: 'Sunday', time: '7:30 AM', location: 'Church Entrance' },
        requirements: ['Friendly personality', 'Punctuality'],
        contact: { name: 'Grace Mensah', phone: '+233 20 456 7890', email: 'ushering@church.org' },
      },
      children: {
        id: 'children',
        name: 'Children Ministry',
        icon: 'happy',
        color: '#f59e0b',
        description: 'Teaching and caring for children',
        fullDescription: 'The Children Ministry teaches children about God\'s love in fun, engaging ways.',
        memberCount: 0,
        members: [],
        meetings: 'Weekly',
        leaders: [{ name: 'Rebecca Osei', role: 'Children\'s Director', phone: '+233 20 567 8901' }],
        activities: ['Teach Sunday School', 'Lead children\'s worship', 'Organize activities'],
        schedule: { frequency: 'Every Sunday', day: 'Sunday', time: '9:00 AM', location: 'Children\'s Wing' },
        requirements: ['Love for children', 'Patience', 'Background check'],
        contact: { name: 'Rebecca Osei', phone: '+233 20 567 8901', email: 'children@church.org' },
      },
      prayer: {
        id: 'prayer',
        name: 'Prayer Team',
        icon: 'hand-left',
        color: '#8b5cf6',
        description: 'Intercession and prayer ministry',
        fullDescription: 'The Prayer Team dedicates themselves to interceding for members and the community.',
        memberCount: 0,
        members: [],
        meetings: 'Weekly',
        leaders: [{ name: 'Elder Samuel Owusu', role: 'Prayer Coordinator', phone: '+233 20 678 9012' }],
        activities: ['Lead prayer meetings', 'Pray for requests', 'Organize prayer vigils'],
        schedule: { frequency: 'Tuesday & Friday', day: 'Tuesday', time: '6:00 AM', location: 'Prayer Chapel' },
        requirements: ['Strong prayer life', 'Confidentiality', 'Faith maturity'],
        contact: { name: 'Elder Samuel Owusu', phone: '+233 20 678 9012', email: 'prayer@church.org' },
      },
      hospitality: {
        id: 'hospitality',
        name: 'Hospitality',
        icon: 'restaurant',
        color: '#14b8a6',
        description: 'Food and refreshment services',
        fullDescription: 'The Hospitality department ensures everyone is well-fed during church events.',
        memberCount: 0,
        members: [],
        meetings: 'Monthly',
        leaders: [{ name: 'Mrs. Mary Appiah', role: 'Hospitality Coordinator', phone: '+233 20 789 0123' }],
        activities: ['Prepare refreshments', 'Coordinate catering', 'Manage kitchen'],
        schedule: { frequency: 'As needed', day: 'First Sunday', time: '2:00 PM', location: 'Fellowship Hall' },
        requirements: ['Love for serving', 'Cooking skills helpful', 'Food safety awareness'],
        contact: { name: 'Mrs. Mary Appiah', phone: '+233 20 789 0123', email: 'hospitality@church.org' },
      },
      evangelism: {
        id: 'evangelism',
        name: 'Evangelism',
        icon: 'megaphone',
        color: '#ef4444',
        description: 'Outreach and soul winning',
        fullDescription: 'The Evangelism department is passionate about sharing the Gospel and reaching the lost.',
        memberCount: 0,
        members: [],
        meetings: 'Weekly',
        leaders: [{ name: 'Pastor Emmanuel Boateng', role: 'Evangelism Director', phone: '+233 20 890 1234' }],
        activities: ['Community outreach', 'Street evangelism', 'Visit new members'],
        schedule: { frequency: 'Every Saturday', day: 'Saturday', time: '9:00 AM', location: 'Meeting Point TBD' },
        requirements: ['Passion for souls', 'Bold in faith', 'Good people skills'],
        contact: { name: 'Pastor Emmanuel Boateng', phone: '+233 20 890 1234', email: 'evangelism@church.org' },
      },
      admin: {
        id: 'admin',
        name: 'Administration',
        icon: 'briefcase',
        color: '#3b82f6',
        description: 'Church operations and management',
        fullDescription: 'The Administration department handles operations that keep the church running smoothly.',
        memberCount: 0,
        members: [],
        meetings: 'Bi-weekly',
        leaders: [{ name: 'James Asante', role: 'Admin Manager', phone: '+233 20 901 2345' }],
        activities: ['Manage facilities', 'Coordinate events', 'Handle admin tasks'],
        schedule: { frequency: 'Bi-weekly', day: 'Second Tuesday', time: '7:00 PM', location: 'Admin Office' },
        requirements: ['Organizational skills', 'Attention to detail', 'Computer literacy'],
        contact: { name: 'James Asante', phone: '+233 20 901 2345', email: 'admin@church.org' },
      },
    };
    return fallbackDepartments[id] || null;
  };

  const loadDepartmentDetails = async () => {
    try {
      setLoading(true);
      const deptRef = doc(db, 'departments', departmentId);
      const deptSnap = await getDoc(deptRef);

      if (deptSnap.exists()) {
        const deptData = { id: deptSnap.id, ...deptSnap.data() };
        setDepartment(deptData);
        
        // Check if current user is a member
        if (deptData.members && currentUser) {
          setIsMember(deptData.members.includes(currentUser.uid));
        }
      } else {
        // Use fallback data if not in Firebase yet
        const fallbackDept = getFallbackDepartment(departmentId);
        if (fallbackDept) {
          setDepartment(fallbackDept);
          Alert.alert(
            'Viewing Sample Data',
            'This department is not yet in the database. You can view details but cannot join until it\'s added to Firebase.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', 'Department not found');
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('Error loading department:', error);
      // Try fallback data on error
      const fallbackDept = getFallbackDepartment(departmentId);
      if (fallbackDept) {
        setDepartment(fallbackDept);
      } else {
        Alert.alert('Error', 'Failed to load department details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeave = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'Please login to join departments');
      return;
    }

    // Check if department exists in Firebase
    try {
      const deptRef = doc(db, 'departments', departmentId);
      const deptSnap = await getDoc(deptRef);
      
      if (!deptSnap.exists()) {
        Alert.alert(
          'Department Not Available',
          'This department needs to be added to the database first. Please contact your church administrator to set up this department in Firebase.',
          [{ text: 'OK' }]
        );
        return;
      }
    } catch (error) {
      console.error('Error checking department:', error);
      Alert.alert('Error', 'Unable to verify department. Please check your connection.');
      return;
    }

    try {
      setJoining(true);
      const deptRef = doc(db, 'departments', departmentId);

      if (isMember) {
        // Leave department
        await updateDoc(deptRef, {
          members: arrayRemove(currentUser.uid),
          memberCount: increment(-1),
        });
        setIsMember(false);
        Alert.alert('Success', `You have left ${department.name}`);
      } else {
        // Join department
        await updateDoc(deptRef, {
          members: arrayUnion(currentUser.uid),
          memberCount: increment(1),
        });
        setIsMember(true);
        Alert.alert('Success', `Welcome to ${department.name}!`);
      }

      // Reload details
      await loadDepartmentDetails();
    } catch (error) {
      console.error('Error joining/leaving department:', error);
      Alert.alert('Error', 'Failed to update membership. The department may not be set up in the database yet.');
    } finally {
      setJoining(false);
    }
  };

  const contactLeader = () => {
    if (department?.contact?.phone) {
      Alert.alert(
        'Contact Leader',
        `Call ${department.contact.name || 'Department Leader'}?\n${department.contact.phone}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', onPress: () => console.log('Call functionality') },
        ]
      );
    } else {
      Alert.alert('Info', 'Contact information not available');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading department...</Text>
      </View>
    );
  }

  if (!department) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{department.name}</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Department Icon & Info */}
        <View style={styles.heroSection}>
          <View style={[styles.heroIcon, { backgroundColor: department.color }]}>
            <Ionicons name={department.icon} size={48} color="#fff" />
          </View>
          <Text style={styles.departmentName}>{department.name}</Text>
          <Text style={styles.departmentTagline}>{department.description}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={24} color="#6366f1" />
              <Text style={styles.statNumber}>{department.memberCount || 0}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="calendar" size={24} color="#6366f1" />
              <Text style={styles.statNumber}>{department.meetings || 'Weekly'}</Text>
              <Text style={styles.statLabel}>Meetings</Text>
            </View>
          </View>
        </View>

        {/* Join/Leave Button */}
        <TouchableOpacity
          style={styles.joinButton}
          onPress={handleJoinLeave}
          disabled={joining}
        >
          <LinearGradient
            colors={isMember ? ['#ef4444', '#dc2626'] : ['#6366f1', '#8b5cf6']}
            style={styles.joinButtonGradient}
          >
            {joining ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={isMember ? 'exit-outline' : 'add-circle-outline'}
                  size={24}
                  color="#fff"
                />
                <Text style={styles.joinButtonText}>
                  {isMember ? 'Leave Department' : 'Join Department'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <Text style={styles.aboutText}>
              {department.fullDescription || department.description}
            </Text>
          </View>
        </View>

        {/* Leadership */}
        {department.leaders && department.leaders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Leadership</Text>
            {department.leaders.map((leader, index) => (
              <View key={index} style={styles.leaderCard}>
                <View style={styles.leaderIcon}>
                  <Ionicons name="person" size={28} color="#6366f1" />
                </View>
                <View style={styles.leaderInfo}>
                  <Text style={styles.leaderName}>{leader.name}</Text>
                  <Text style={styles.leaderRole}>{leader.role || 'Leader'}</Text>
                </View>
                {leader.phone && (
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={() =>
                      Alert.alert('Call', `Call ${leader.name}?\n${leader.phone}`)
                    }
                  >
                    <Ionicons name="call" size={20} color="#6366f1" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Activities */}
        {department.activities && department.activities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activities & Responsibilities</Text>
            <View style={styles.card}>
              {department.activities.map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text style={styles.activityText}>{activity}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Meeting Schedule */}
        {department.schedule && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meeting Schedule</Text>
            <View style={styles.card}>
              <View style={styles.scheduleItem}>
                <Ionicons name="calendar-outline" size={20} color="#6366f1" />
                <Text style={styles.scheduleText}>{department.schedule.frequency}</Text>
              </View>
              {department.schedule.day && (
                <View style={styles.scheduleItem}>
                  <Ionicons name="time-outline" size={20} color="#6366f1" />
                  <Text style={styles.scheduleText}>
                    {department.schedule.day} at {department.schedule.time}
                  </Text>
                </View>
              )}
              {department.schedule.location && (
                <View style={styles.scheduleItem}>
                  <Ionicons name="location-outline" size={20} color="#6366f1" />
                  <Text style={styles.scheduleText}>
                    {department.schedule.location}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Requirements */}
        {department.requirements && department.requirements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements to Join</Text>
            <View style={styles.card}>
              {department.requirements.map((req, index) => (
                <View key={index} style={styles.requirementItem}>
                  <Ionicons name="checkbox" size={20} color="#8b5cf6" />
                  <Text style={styles.requirementText}>{req}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get Involved</Text>
          <View style={styles.card}>
            <Text style={styles.contactText}>
              Interested in serving? Contact the department leader for more information
              and to get started.
            </Text>
            {department.contact && (
              <TouchableOpacity
                style={styles.contactLeaderButton}
                onPress={contactLeader}
              >
                <Ionicons name="mail-outline" size={20} color="#6366f1" />
                <Text style={styles.contactLeaderText}>Contact Leader</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
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
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
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
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  heroIcon: {
    width: 100,
    height: 100,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  departmentName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  departmentTagline: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  joinButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aboutText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
  },
  leaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  leaderIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  leaderInfo: {
    flex: 1,
  },
  leaderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  leaderRole: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  activityText: {
    flex: 1,
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  scheduleText: {
    flex: 1,
    fontSize: 15,
    color: '#4b5563',
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  requirementText: {
    flex: 1,
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  contactText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 15,
  },
  contactLeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ede9fe',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  contactLeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6366f1',
  },
});

