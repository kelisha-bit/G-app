import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, orderBy, doc, getDoc, updateDoc, arrayUnion, setDoc, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { db, auth } from '../../firebase.config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function DiscipleshipTrainingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState('Courses');
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [myProgress, setMyProgress] = useState([]);
  const [forums, setForums] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [materialModalVisible, setMaterialModalVisible] = useState(false);
  const [forumModalVisible, setForumModalVisible] = useState(false);
  const [newForumPost, setNewForumPost] = useState({ title: '', content: '' });
  const [userEnrolledCourses, setUserEnrolledCourses] = useState([]);
  const [userProgress, setUserProgress] = useState({});

  const tabs = ['Courses', 'Materials', 'My Progress', 'Forums', 'Assignments'];

  useEffect(() => {
    loadData();
    loadUserData();
  }, []);

  useEffect(() => {
    if (selectedTab === 'Courses') {
      loadCourses();
    } else if (selectedTab === 'Materials') {
      loadMaterials();
    } else if (selectedTab === 'My Progress') {
      loadMyProgress();
    } else if (selectedTab === 'Forums') {
      loadForums();
    } else if (selectedTab === 'Assignments') {
      loadAssignments();
    }
  }, [selectedTab]);

  const loadData = async () => {
    await Promise.all([
      loadCourses(),
      loadMaterials(),
      loadMyProgress(),
      loadForums(),
      loadAssignments(),
    ]);
  };

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserEnrolledCourses(userData.enrolledCourses || []);
        setUserProgress(userData.courseProgress || {});
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      try {
        const coursesQuery = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(coursesQuery);
        
        if (!querySnapshot.empty) {
          const coursesData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setCourses(coursesData);
        } else {
          setCourses(getFallbackCourses());
        }
      } catch (error) {
        console.log('Error with query, using fallback:', error);
        setCourses(getFallbackCourses());
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses(getFallbackCourses());
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async () => {
    try {
      try {
        const materialsQuery = query(collection(db, 'trainingMaterials'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(materialsQuery);
        
        if (!querySnapshot.empty) {
          const materialsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMaterials(materialsData);
        } else {
          setMaterials(getFallbackMaterials());
        }
      } catch (error) {
        setMaterials(getFallbackMaterials());
      }
    } catch (error) {
      console.error('Error loading materials:', error);
      setMaterials(getFallbackMaterials());
    }
  };

  const loadMyProgress = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setMyProgress([]);
        return;
      }

      const enrolledCoursesData = [];
      for (const courseId of userEnrolledCourses) {
        try {
          const courseDoc = await getDoc(doc(db, 'courses', courseId));
          if (courseDoc.exists()) {
            const courseData = { id: courseDoc.id, ...courseDoc.data() };
            const progress = userProgress[courseId] || { progress: 0, completedLessons: [], completed: false };
            enrolledCoursesData.push({ ...courseData, ...progress });
          }
        } catch (error) {
          console.error(`Error loading course ${courseId}:`, error);
        }
      }

      if (enrolledCoursesData.length === 0 && userEnrolledCourses.length === 0) {
        // Show sample progress for demo
        setMyProgress([]);
      } else {
        setMyProgress(enrolledCoursesData);
      }
    } catch (error) {
      console.error('Error loading my progress:', error);
      setMyProgress([]);
    }
  };

  const loadForums = async () => {
    try {
      try {
        const forumsQuery = query(collection(db, 'trainingForums'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(forumsQuery);
        
        if (!querySnapshot.empty) {
          const forumsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setForums(forumsData);
        } else {
          setForums(getFallbackForums());
        }
      } catch (error) {
        setForums(getFallbackForums());
      }
    } catch (error) {
      console.error('Error loading forums:', error);
      setForums(getFallbackForums());
    }
  };

  const loadAssignments = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setAssignments([]);
        return;
      }

      try {
        const assignmentsQuery = query(
          collection(db, 'assignments'),
          where('userId', '==', user.uid),
          orderBy('dueDate', 'asc')
        );
        const querySnapshot = await getDocs(assignmentsQuery);
        
        if (!querySnapshot.empty) {
          const assignmentsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setAssignments(assignmentsData);
        } else {
          setAssignments([]);
        }
      } catch (error) {
        // Try without where clause if it fails
        const allAssignmentsQuery = query(collection(db, 'assignments'), orderBy('dueDate', 'asc'));
        const querySnapshot = await getDocs(allAssignmentsQuery);
        if (!querySnapshot.empty) {
          const allAssignments = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          const userAssignments = allAssignments.filter(a => a.userId === user.uid);
          setAssignments(userAssignments);
        } else {
          setAssignments([]);
        }
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
      setAssignments([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await loadUserData();
    setRefreshing(false);
  };

  const handleEnrollCourse = async (course) => {
    if (!auth.currentUser) {
      Alert.alert('Login Required', 'Please login to enroll in courses');
      return;
    }

    if (userEnrolledCourses.includes(course.id)) {
      Alert.alert('Already Enrolled', 'You are already enrolled in this course.');
      return;
    }

    Alert.alert(
      'Enroll in Course',
      `Are you sure you want to enroll in "${course.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enroll',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              const userRef = doc(db, 'users', user.uid);
              
              await updateDoc(userRef, {
                enrolledCourses: arrayUnion(course.id),
                [`courseProgress.${course.id}`]: {
                  progress: 0,
                  completedLessons: [],
                  enrolledAt: serverTimestamp(),
                  completed: false,
                },
              });

              setUserEnrolledCourses([...userEnrolledCourses, course.id]);
              Alert.alert('Success', 'You have been enrolled in the course!');
            } catch (error) {
              console.error('Error enrolling in course:', error);
              Alert.alert('Error', 'Failed to enroll in course. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSubmitForumPost = async () => {
    if (!auth.currentUser) {
      Alert.alert('Login Required', 'Please login to post in forums');
      return;
    }

    if (!newForumPost.title.trim() || !newForumPost.content.trim()) {
      Alert.alert('Required Fields', 'Please fill in both title and content');
      return;
    }

    try {
      const user = auth.currentUser;
      await addDoc(collection(db, 'trainingForums'), {
        title: newForumPost.title,
        content: newForumPost.content,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
        replies: [],
        likes: 0,
        views: 0,
      });

      Alert.alert('Success', 'Your post has been submitted!');
      setNewForumPost({ title: '', content: '' });
      setForumModalVisible(false);
      loadForums();
    } catch (error) {
      console.error('Error submitting forum post:', error);
      Alert.alert('Error', 'Failed to submit post. Please try again.');
    }
  };

  const getFallbackCourses = () => [
    {
      id: '1',
      title: 'Foundations of Faith',
      description: 'A comprehensive course covering the basics of Christian faith and doctrine.',
      instructor: 'Pastor John Smith',
      duration: '8 weeks',
      lessons: 24,
      category: 'Foundations',
      image: 'https://via.placeholder.com/400x200',
      enrolled: 156,
      level: 'Beginner',
      createdAt: new Date(),
    },
    {
      id: '2',
      title: 'Bible Study Methods',
      description: 'Learn effective methods for studying and interpreting Scripture.',
      instructor: 'Dr. Sarah Johnson',
      duration: '6 weeks',
      lessons: 18,
      category: 'Bible Study',
      image: 'https://via.placeholder.com/400x200',
      enrolled: 89,
      level: 'Intermediate',
      createdAt: new Date(),
    },
    {
      id: '3',
      title: 'Christian Leadership',
      description: 'Develop leadership skills based on biblical principles.',
      instructor: 'Pastor Michael Brown',
      duration: '10 weeks',
      lessons: 30,
      category: 'Leadership',
      image: 'https://via.placeholder.com/400x200',
      enrolled: 67,
      level: 'Advanced',
      createdAt: new Date(),
    },
  ];

  const getFallbackMaterials = () => [
    {
      id: '1',
      title: 'Old Testament Survey Guide',
      type: 'pdf',
      category: 'Bible Study',
      description: 'Comprehensive guide covering all books of the Old Testament',
      url: 'https://example.com/ot-survey.pdf',
    },
    {
      id: '2',
      title: 'New Testament Overview',
      type: 'video',
      category: 'Teaching',
      description: 'Video series exploring the themes and structure of the New Testament',
      url: 'https://example.com/nt-overview',
    },
    {
      id: '3',
      title: 'Prayer and Fasting Guide',
      type: 'pdf',
      category: 'Spiritual Growth',
      description: 'Practical guide to prayer and fasting practices',
      url: 'https://example.com/prayer-fasting.pdf',
    },
  ];

  const getFallbackForums = () => [
    {
      id: '1',
      title: 'Study Group Discussion - Week 1',
      content: 'Let\'s discuss the key points from this week\'s lesson on faith foundations.',
      authorName: 'John Doe',
      createdAt: new Date(),
      replies: 12,
      views: 45,
    },
    {
      id: '2',
      title: 'Bible Study Tips',
      content: 'Share your favorite methods for studying the Bible effectively.',
      authorName: 'Jane Smith',
      createdAt: new Date(),
      replies: 8,
      views: 32,
    },
  ];

  const renderCourses = () => {
    if (loading && courses.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      );
    }

    if (courses.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="school-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyStateText}>No courses available</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {courses.map((course) => {
          const isEnrolled = userEnrolledCourses.includes(course.id);
          return (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              onPress={() => {
                setSelectedCourse(course);
                setCourseModalVisible(true);
              }}
            >
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={styles.courseHeader}
              >
                <View style={styles.courseHeaderContent}>
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    <Text style={styles.courseInstructor}>{course.instructor}</Text>
                  </View>
                  {course.level && (
                    <View style={[styles.levelBadge, { backgroundColor: getLevelColor(course.level) }]}>
                      <Text style={styles.levelText}>{course.level}</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
              
              <View style={styles.courseBody}>
                <Text style={styles.courseDescription} numberOfLines={2}>
                  {course.description}
                </Text>
                
                <View style={styles.courseDetails}>
                  <View style={styles.courseDetailItem}>
                    <Ionicons name="time-outline" size={16} color="#6b7280" />
                    <Text style={styles.courseDetailText}>{course.duration}</Text>
                  </View>
                  <View style={styles.courseDetailItem}>
                    <Ionicons name="book-outline" size={16} color="#6b7280" />
                    <Text style={styles.courseDetailText}>{course.lessons} lessons</Text>
                  </View>
                  <View style={styles.courseDetailItem}>
                    <Ionicons name="people-outline" size={16} color="#6b7280" />
                    <Text style={styles.courseDetailText}>{course.enrolled || 0} enrolled</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.enrollButton, isEnrolled && styles.enrolledButton]}
                  onPress={() => {
                    if (!isEnrolled) {
                      handleEnrollCourse(course);
                    } else {
                      Alert.alert('Enrolled', 'You are already enrolled in this course.');
                    }
                  }}
                >
                  <Text style={[styles.enrollButtonText, isEnrolled && styles.enrolledButtonText]}>
                    {isEnrolled ? 'Enrolled' : 'Enroll Now'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderMaterials = () => {
    if (materials.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="library-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyStateText}>No materials available</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {materials.map((material) => (
          <TouchableOpacity
            key={material.id}
            style={styles.materialCard}
            onPress={() => {
              setSelectedMaterial(material);
              setMaterialModalVisible(true);
            }}
          >
            <View style={[styles.materialIcon, { backgroundColor: getMaterialColor(material.type) + '20' }]}>
              <Ionicons name={getMaterialIcon(material.type)} size={32} color={getMaterialColor(material.type)} />
            </View>
            <View style={styles.materialContent}>
              <Text style={styles.materialTitle}>{material.title}</Text>
              <Text style={styles.materialCategory}>{material.category}</Text>
              <Text style={styles.materialDescription} numberOfLines={2}>
                {material.description}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderMyProgress = () => {
    if (myProgress.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyStateText}>No enrolled courses</Text>
          <Text style={styles.emptyStateSubtext}>Enroll in a course to track your progress</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {myProgress.map((course) => {
          const progress = course.progress || 0;
          const completed = course.completed || false;
          
          return (
            <View key={course.id} style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressCourseTitle}>{course.title}</Text>
                {completed && (
                  <View style={styles.certificateBadge}>
                    <Ionicons name="trophy" size={16} color="#f59e0b" />
                    <Text style={styles.certificateText}>Certificate</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
              </View>
              
              <View style={styles.progressDetails}>
                <Text style={styles.progressDetailText}>
                  {course.completedLessons?.length || 0} of {course.lessons || 0} lessons completed
                </Text>
                {completed && (
                  <TouchableOpacity style={styles.viewCertificateButton}>
                    <Text style={styles.viewCertificateText}>View Certificate</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderForums = () => {
    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.newPostButton}
          onPress={() => setForumModalVisible(true)}
        >
          <Ionicons name="add-circle" size={24} color="#6366f1" />
          <Text style={styles.newPostText}>New Discussion Post</Text>
        </TouchableOpacity>

        {forums.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No discussions yet</Text>
            <Text style={styles.emptyStateSubtext}>Start a new discussion</Text>
          </View>
        ) : (
          forums.map((forum) => (
            <TouchableOpacity key={forum.id} style={styles.forumCard}>
              <Text style={styles.forumTitle}>{forum.title}</Text>
              <Text style={styles.forumContent} numberOfLines={3}>
                {forum.content}
              </Text>
              <View style={styles.forumFooter}>
                <Text style={styles.forumAuthor}>{forum.authorName}</Text>
                <View style={styles.forumStats}>
                  <View style={styles.forumStat}>
                    <Ionicons name="chatbubble-outline" size={14} color="#6b7280" />
                    <Text style={styles.forumStatText}>{forum.replies || 0}</Text>
                  </View>
                  <View style={styles.forumStat}>
                    <Ionicons name="eye-outline" size={14} color="#6b7280" />
                    <Text style={styles.forumStatText}>{forum.views || 0}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    );
  };

  const renderAssignments = () => {
    if (assignments.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyStateText}>No assignments</Text>
          <Text style={styles.emptyStateSubtext}>Assignments will appear here when assigned</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {assignments.map((assignment) => {
          const dueDate = assignment.dueDate?.toDate ? assignment.dueDate.toDate() : new Date(assignment.dueDate);
          const isOverdue = dueDate < new Date() && !assignment.completed;
          
          return (
            <View key={assignment.id} style={[styles.assignmentCard, isOverdue && styles.overdueCard]}>
              <View style={styles.assignmentHeader}>
                <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                {assignment.completed && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                )}
                {isOverdue && !assignment.completed && (
                  <View style={styles.overdueBadge}>
                    <Text style={styles.overdueText}>Overdue</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.assignmentDescription}>{assignment.description}</Text>
              
              <View style={styles.assignmentFooter}>
                <View style={styles.assignmentDetail}>
                  <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                  <Text style={styles.assignmentDetailText}>
                    Due: {dueDate.toLocaleDateString()}
                  </Text>
                </View>
                {assignment.course && (
                  <View style={styles.assignmentDetail}>
                    <Ionicons name="school-outline" size={16} color="#6b7280" />
                    <Text style={styles.assignmentDetailText}>{assignment.course}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return '#10b981';
      case 'intermediate':
        return '#f59e0b';
      case 'advanced':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getMaterialIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return 'document-text';
      case 'video':
        return 'videocam';
      case 'audio':
        return 'headset';
      default:
        return 'document';
    }
  };

  const getMaterialColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return '#ef4444';
      case 'video':
        return '#6366f1';
      case 'audio':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Discipleship & Training</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.tabActive]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.mainContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {selectedTab === 'Courses' && renderCourses()}
        {selectedTab === 'Materials' && renderMaterials()}
        {selectedTab === 'My Progress' && renderMyProgress()}
        {selectedTab === 'Forums' && renderForums()}
        {selectedTab === 'Assignments' && renderAssignments()}
      </ScrollView>

      {/* Course Detail Modal */}
      <Modal
        visible={courseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCourseModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedCourse && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedCourse.title}</Text>
                  <TouchableOpacity onPress={() => setCourseModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#111827" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                  <Text style={styles.modalInstructor}>Instructor: {selectedCourse.instructor}</Text>
                  <Text style={styles.modalDescription}>{selectedCourse.description}</Text>
                  <View style={styles.modalDetails}>
                    <View style={styles.modalDetailItem}>
                      <Ionicons name="time-outline" size={20} color="#6366f1" />
                      <Text style={styles.modalDetailText}>{selectedCourse.duration}</Text>
                    </View>
                    <View style={styles.modalDetailItem}>
                      <Ionicons name="book-outline" size={20} color="#6366f1" />
                      <Text style={styles.modalDetailText}>{selectedCourse.lessons} lessons</Text>
                    </View>
                    <View style={styles.modalDetailItem}>
                      <Ionicons name="people-outline" size={20} color="#6366f1" />
                      <Text style={styles.modalDetailText}>{selectedCourse.enrolled || 0} enrolled</Text>
                    </View>
                  </View>
                </ScrollView>
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.enrollModalButton]}
                    onPress={() => {
                      setCourseModalVisible(false);
                      handleEnrollCourse(selectedCourse);
                    }}
                  >
                    <Text style={styles.modalButtonText}>Enroll Now</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Material Detail Modal */}
      <Modal
        visible={materialModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMaterialModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedMaterial && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedMaterial.title}</Text>
                  <TouchableOpacity onPress={() => setMaterialModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#111827" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                  <Text style={styles.modalDescription}>{selectedMaterial.description}</Text>
                </ScrollView>
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.downloadButton]}
                    onPress={() => {
                      if (selectedMaterial.url) {
                        Linking.openURL(selectedMaterial.url).catch(err => {
                          Alert.alert('Error', 'Could not open the resource');
                        });
                      }
                    }}
                  >
                    <Ionicons name="download-outline" size={20} color="#fff" />
                    <Text style={styles.modalButtonText}>View/Download</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Forum Post Modal */}
      <Modal
        visible={forumModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setForumModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Discussion Post</Text>
              <TouchableOpacity onPress={() => setForumModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter post title"
                value={newForumPost.title}
                onChangeText={(text) => setNewForumPost({ ...newForumPost, title: text })}
              />
              <Text style={styles.inputLabel}>Content</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter your message"
                multiline
                numberOfLines={6}
                value={newForumPost.content}
                onChangeText={(text) => setNewForumPost({ ...newForumPost, content: text })}
              />
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmitForumPost}
              >
                <Text style={styles.modalButtonText}>Submit Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabScrollContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 8,
  },
  tabActive: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#6366f1',
    fontWeight: '600',
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
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseHeader: {
    padding: 16,
  },
  courseHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  courseBody: {
    padding: 16,
  },
  courseDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  courseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  courseDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  courseDetailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  enrollButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  enrolledButton: {
    backgroundColor: '#10b981',
  },
  enrollButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  enrolledButtonText: {
    color: '#fff',
  },
  materialCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  materialIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  materialContent: {
    flex: 1,
  },
  materialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  materialCategory: {
    fontSize: 12,
    color: '#6366f1',
    marginBottom: 4,
  },
  materialDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  progressCard: {
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressCourseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  certificateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  certificateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
    marginLeft: 4,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    minWidth: 45,
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressDetailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  viewCertificateButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f59e0b',
  },
  viewCertificateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  newPostButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newPostText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 8,
  },
  forumCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  forumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  forumContent: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  forumFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forumAuthor: {
    fontSize: 12,
    color: '#9ca3af',
  },
  forumStats: {
    flexDirection: 'row',
  },
  forumStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  forumStatText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  assignmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 4,
  },
  overdueBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overdueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  assignmentDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  assignmentFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  assignmentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  assignmentDetailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
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
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalInstructor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  modalDetails: {
    marginTop: 16,
  },
  modalDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalDetailText: {
    fontSize: 14,
    color: '#111827',
    marginLeft: 12,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  enrollModalButton: {
    backgroundColor: '#6366f1',
  },
  downloadButton: {
    backgroundColor: '#6366f1',
  },
  submitButton: {
    backgroundColor: '#6366f1',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
});

