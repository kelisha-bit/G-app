import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../../firebase.config';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  query, 
  orderBy,
} from 'firebase/firestore';

export default function ManageCourseEnrollmentsScreen({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollmentsModalVisible, setEnrollmentsModalVisible] = useState(false);
  const [enrolledUsers, setEnrolledUsers] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [filteredCourses, setFilteredCourses] = useState([]);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [searchQuery, courses]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      
      // Try to load courses with createdAt order, fallback to simple query if it fails
      let querySnapshot;
      try {
        const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
        querySnapshot = await getDocs(q);
      } catch (orderError) {
        // If orderBy fails (e.g., no createdAt field or index), just get all courses
        console.warn('Could not order by createdAt, loading all courses:', orderError);
        querySnapshot = await getDocs(collection(db, 'courses'));
      }
      
      const coursesList = [];
      querySnapshot.forEach((doc) => {
        coursesList.push({ id: doc.id, ...doc.data() });
      });
      
      // Fetch all users once and calculate enrollment counts for all courses
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const enrollmentCounts = {};
      
      // Initialize counts for all courses
      coursesList.forEach(course => {
        enrollmentCounts[course.id] = 0;
      });
      
      // Count enrollments by iterating through users once
      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        if (userData.enrolledCourses && Array.isArray(userData.enrolledCourses)) {
          userData.enrolledCourses.forEach((courseId) => {
            if (enrollmentCounts.hasOwnProperty(courseId)) {
              enrollmentCounts[courseId]++;
            }
          });
        }
      });
      
      // Add enrollment counts to courses
      const coursesWithEnrollments = coursesList.map(course => ({
        ...course,
        enrollmentCount: enrollmentCounts[course.id] || course.enrolled || 0,
      }));
      
      // Sort by createdAt if available, otherwise by title
      coursesWithEnrollments.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          const aDate = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bDate = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bDate - aDate;
        }
        return (a.title || '').localeCompare(b.title || '');
      });
      
      setCourses(coursesWithEnrollments);
      setFilteredCourses(coursesWithEnrollments);
    } catch (error) {
      console.error('Error loading courses:', error);
      Alert.alert('Error', 'Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadEnrolledUsers = async (courseId) => {
    try {
      setLoadingEnrollments(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const enrolledUsersList = [];
      
      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        if (userData && userData.enrolledCourses && Array.isArray(userData.enrolledCourses) && userData.enrolledCourses.includes(courseId)) {
          const progress = userData.courseProgress?.[courseId] || {};
          const enrolledAt = progress.enrolledAt;
          
          // Safely convert timestamp to date
          let enrollmentDate = null;
          if (enrolledAt) {
            try {
              if (enrolledAt.toDate && typeof enrolledAt.toDate === 'function') {
                enrollmentDate = enrolledAt.toDate();
              } else if (enrolledAt.seconds) {
                // Firestore timestamp object
                enrollmentDate = new Date(enrolledAt.seconds * 1000);
              } else if (typeof enrolledAt === 'string' || typeof enrolledAt === 'number') {
                enrollmentDate = new Date(enrolledAt);
              }
            } catch (dateError) {
              console.warn('Error parsing enrollment date:', dateError);
            }
          }
          
          enrolledUsersList.push({
            id: userDoc.id,
            name: userData.fullName || userData.displayName || userData.name || 'Unknown User',
            email: userData.email || 'No email',
            phone: userData.phone || userData.phoneNumber || 'No phone',
            enrolledAt: enrollmentDate,
            progress: typeof progress.progress === 'number' ? progress.progress : 0,
            completed: progress.completed === true,
            completedLessons: Array.isArray(progress.completedLessons) ? progress.completedLessons.length : 0,
          });
        }
      });
      
      // Sort by enrollment date (newest first)
      enrolledUsersList.sort((a, b) => {
        if (!a.enrolledAt && !b.enrolledAt) return 0;
        if (!a.enrolledAt) return 1;
        if (!b.enrolledAt) return -1;
        return b.enrolledAt.getTime() - a.enrolledAt.getTime();
      });
      
      setEnrolledUsers(enrolledUsersList);
    } catch (error) {
      console.error('Error loading enrolled users:', error);
      Alert.alert('Error', 'Failed to load enrolled users. Please try again.');
      setEnrolledUsers([]);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const filterCourses = () => {
    if (!searchQuery.trim()) {
      setFilteredCourses(courses);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = courses.filter(course =>
      course.title?.toLowerCase().includes(query) ||
      course.description?.toLowerCase().includes(query) ||
      course.instructor?.toLowerCase().includes(query) ||
      course.category?.toLowerCase().includes(query)
    );
    
    setFilteredCourses(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
    setRefreshing(false);
  };

  const handleViewEnrollments = async (course) => {
    setSelectedCourse(course);
    setEnrollmentsModalVisible(true);
    await loadEnrolledUsers(course.id);
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    try {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Unknown';
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const renderCourses = () => {
    if (loading && courses.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      );
    }

    if (filteredCourses.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="school-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyStateText}>
            {searchQuery ? 'No courses match your search' : 'No courses available'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredCourses.map((course) => (
          <TouchableOpacity
            key={course.id}
            style={styles.courseCard}
            onPress={() => handleViewEnrollments(course)}
          >
            <View style={styles.courseHeader}>
              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle}>{course.title || 'Untitled Course'}</Text>
                {course.instructor && (
                  <Text style={styles.courseInstructor}>Instructor: {course.instructor}</Text>
                )}
                {course.category && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{course.category}</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.courseStats}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={20} color="#6366f1" />
                <Text style={styles.statText}>
                  {course.enrollmentCount || 0} Enrolled
                </Text>
              </View>
              {course.lessons && (
                <View style={styles.statItem}>
                  <Ionicons name="book" size={20} color="#8b5cf6" />
                  <Text style={styles.statText}>{course.lessons} Lessons</Text>
                </View>
              )}
            </View>
            
            <View style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View Enrollments</Text>
              <Ionicons name="chevron-forward" size={20} color="#6366f1" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Course Enrollments</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.mainContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {renderCourses()}
      </ScrollView>

      {/* Enrollments Modal */}
      <Modal
        visible={enrollmentsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEnrollmentsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle} numberOfLines={2}>
                  {selectedCourse?.title || 'Course Enrollments'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {enrolledUsers.length} {enrolledUsers.length === 1 ? 'Student' : 'Students'} Enrolled
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEnrollmentsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {loadingEnrollments ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color="#6366f1" />
                  <Text style={styles.loadingText}>Loading enrollments...</Text>
                </View>
              ) : enrolledUsers.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={64} color="#d1d5db" />
                  <Text style={styles.emptyStateText}>No enrollments yet</Text>
                </View>
              ) : (
                enrolledUsers.map((user) => (
                  <View key={user.id} style={styles.userCard}>
                    <View style={styles.userHeader}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                        {user.phone && user.phone !== 'No phone' && (
                          <Text style={styles.userPhone}>{user.phone}</Text>
                        )}
                      </View>
                    </View>
                    
                    <View style={styles.userDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                        <Text style={styles.detailText}>
                          Enrolled: {formatDate(user.enrolledAt)}
                        </Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#6b7280" />
                        <Text style={styles.detailText}>
                          Progress: {Math.round(user.progress)}%
                        </Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Ionicons name="book-outline" size={16} color="#6b7280" />
                        <Text style={styles.detailText}>
                          {user.completedLessons} lessons completed
                        </Text>
                      </View>
                      
                      {user.completed && (
                        <View style={styles.completedBadge}>
                          <Ionicons name="trophy" size={16} color="#f59e0b" />
                          <Text style={styles.completedText}>Course Completed</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressBarFill, 
                            { width: `${user.progress}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressText}>{Math.round(user.progress)}%</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
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
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  mainContent: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseHeader: {
    marginBottom: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  courseStats: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#6b7280',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  userCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  userHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#6b7280',
  },
  userDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    minWidth: 40,
    textAlign: 'right',
  },
});

