import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase.config';

export default function DepartmentsScreen({ navigation }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDepartments();
  }, []);

  const fetchMemberNames = async (memberIds) => {
    if (!memberIds || memberIds.length === 0) return [];
    
    // Filter out invalid user IDs (must be non-empty strings)
    const validMemberIds = memberIds.filter(
      (userId) => userId && typeof userId === 'string' && userId.trim().length > 0
    );
    
    if (validMemberIds.length === 0) return [];
    
    try {
      const memberPromises = validMemberIds.map(async (userId) => {
        try {
          // Additional validation: ensure userId doesn't contain invalid characters
          if (userId.includes('/') || userId.includes('\\')) {
            console.warn(`Invalid user ID format: ${userId}`);
            return null;
          }
          
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            return userData.displayName || userData.fullName || 'Unknown Member';
          }
          return null;
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
          return null;
        }
      });
      
      const memberNames = await Promise.all(memberPromises);
      return memberNames.filter(name => name !== null);
    } catch (error) {
      console.error('Error fetching member names:', error);
      return [];
    }
  };

  const loadDepartments = async () => {
    try {
      setLoading(true);
      
      // Try to load from Firestore
      const departmentsQuery = query(
        collection(db, 'departments'),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(departmentsQuery);
      
      if (!querySnapshot.empty) {
        const depts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Fetch member names for each department
        const deptsWithMembers = await Promise.all(
          depts.map(async (dept) => {
            const memberNames = await fetchMemberNames(dept.members || []);
            return {
              ...dept,
              memberNames,
            };
          })
        );
        
        setDepartments(deptsWithMembers);
      } else {
        // Use fallback data if no departments in Firestore
        setDepartments(getFallbackDepartments());
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      // Use fallback data on error
      setDepartments(getFallbackDepartments());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackDepartments = () => [
    {
      id: 'worship',
      name: 'Worship & Music',
      icon: 'musical-notes',
      color: '#ec4899',
      memberCount: 45,
      description: 'Leading the congregation in worship',
    },
    {
      id: 'media',
      name: 'Media & Tech',
      icon: 'videocam',
      color: '#6366f1',
      memberCount: 28,
      description: 'Audio, video, and technical support',
    },
    {
      id: 'ushering',
      name: 'Ushering',
      icon: 'people',
      color: '#10b981',
      memberCount: 60,
      description: 'Welcoming and guiding members',
    },
    {
      id: 'children',
      name: 'Children Ministry',
      icon: 'happy',
      color: '#f59e0b',
      memberCount: 35,
      description: 'Teaching and caring for children',
    },
    {
      id: 'prayer',
      name: 'Prayer Team',
      icon: 'hand-left',
      color: '#8b5cf6',
      memberCount: 52,
      description: 'Intercession and prayer ministry',
    },
    {
      id: 'hospitality',
      name: 'Hospitality',
      icon: 'restaurant',
      color: '#14b8a6',
      memberCount: 40,
      description: 'Food and refreshment services',
    },
    {
      id: 'evangelism',
      name: 'Evangelism',
      icon: 'megaphone',
      color: '#ef4444',
      memberCount: 38,
      description: 'Outreach and soul winning',
    },
    {
      id: 'admin',
      name: 'Administration',
      icon: 'briefcase',
      color: '#3b82f6',
      memberCount: 15,
      description: 'Church operations and management',
    },
    {
      id: 'workers',
      name: 'Workers',
      icon: 'construct',
      color: '#f97316',
      memberCount: 30,
      description: 'Maintenance and facility management',
    },
    {
      id: 'welfare',
      name: 'Welfare',
      icon: 'heart',
      color: '#e91e63',
      memberCount: 0,
      description: 'Caring for members in need',
    },
  ];

  const handleDepartmentPress = (dept) => {
    navigation.navigate('DepartmentDetails', { departmentId: dept.id });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading departments...</Text>
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
        <Text style={styles.headerTitle}>Departments</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Get Involved</Text>
          <Text style={styles.infoText}>
            Join a department and use your gifts to serve the church and community.
          </Text>
        </View>

        {departments.length > 0 ? (
          departments.map((dept) => (
            <TouchableOpacity 
              key={dept.id} 
              style={styles.departmentCard}
              onPress={() => handleDepartmentPress(dept)}
            >
              <View style={[styles.iconContainer, { backgroundColor: dept.color }]}>
                <Ionicons name={dept.icon} size={28} color="#fff" />
              </View>
              <View style={styles.departmentInfo}>
                <Text style={styles.departmentName}>{dept.name}</Text>
                <Text style={styles.departmentDescription}>{dept.description}</Text>
                <View style={styles.membersBadge}>
                  <Ionicons name="people-outline" size={14} color="#6b7280" />
                  <Text style={styles.membersText}>
                    {dept.memberCount || (dept.members ? dept.members.length : 0)} members
                  </Text>
                </View>
                {dept.memberNames && dept.memberNames.length > 0 && (
                  <Text style={styles.memberNamesText} numberOfLines={1}>
                    {dept.memberNames.slice(0, 3).join(', ')}
                    {dept.memberNames.length > 3 && ` +${dept.memberNames.length - 3} more`}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No departments available</Text>
            <Text style={styles.emptyStateSubtext}>Check back later</Text>
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
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
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
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  departmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  departmentInfo: {
    flex: 1,
  },
  departmentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  departmentDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
  },
  membersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membersText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  memberNamesText: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 5,
  },
});

