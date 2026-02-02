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
  Image,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, orderBy, doc, getDoc, updateDoc, arrayUnion, setDoc, addDoc, serverTimestamp, where, increment } from 'firebase/firestore';
import { db, auth, storage } from '../../firebase.config';
import { ref, getDownloadURL } from 'firebase/storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logError } from '../utils/logger';
import FormattedText from '../components/FormattedText';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [bookmarkedMaterials, setBookmarkedMaterials] = useState([]);
  const [courseLessons, setCourseLessons] = useState([]);
  const [lessonsModalVisible, setLessonsModalVisible] = useState(false);
  const [selectedForum, setSelectedForum] = useState(null);
  const [forumDetailModalVisible, setForumDetailModalVisible] = useState(false);
  const [forumReply, setForumReply] = useState('');
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [certificateModalVisible, setCertificateModalVisible] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonModalVisible, setLessonModalVisible] = useState(false);

  const tabs = ['Courses', 'Materials', 'My Progress', 'Forums', 'Assignments'];
  const categories = ['All', 'Foundations', 'Bible Study', 'Leadership', 'Spiritual Growth', 'Evangelism'];
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

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

  // Filter courses and materials based on search and filters
  useEffect(() => {
    filterCourses();
  }, [courses, searchQuery, selectedCategory, selectedLevel]);

  useEffect(() => {
    filterMaterials();
  }, [materials, searchQuery, selectedCategory]);

  const filterCourses = () => {
    let filtered = [...courses];
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(course =>
        course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }
    
    if (selectedLevel !== 'All') {
      filtered = filtered.filter(course => course.level === selectedLevel);
    }
    
    setFilteredCourses(filtered);
  };

  const filterMaterials = () => {
    let filtered = [...materials];
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(material =>
        material.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(material => material.category === selectedCategory);
    }
    
    setFilteredMaterials(filtered);
  };

  const handleBookmarkMaterial = async (materialId) => {
    if (!auth.currentUser) {
      Alert.alert('Login Required', 'Please login to bookmark materials');
      return;
    }

    try {
      const user = auth.currentUser;
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      const currentBookmarks = userDoc.data()?.bookmarkedMaterials || [];
      const isBookmarked = currentBookmarks.includes(materialId);
      
      if (isBookmarked) {
        await updateDoc(userRef, {
          bookmarkedMaterials: currentBookmarks.filter(id => id !== materialId)
        });
        setBookmarkedMaterials(bookmarkedMaterials.filter(id => id !== materialId));
        Alert.alert('Success', 'Material removed from bookmarks');
      } else {
        await updateDoc(userRef, {
          bookmarkedMaterials: arrayUnion(materialId)
        });
        setBookmarkedMaterials([...bookmarkedMaterials, materialId]);
        Alert.alert('Success', 'Material bookmarked');
      }
    } catch (error) {
      logError('Error bookmarking material:', error);
      Alert.alert('Error', 'Failed to update bookmark. Please try again.');
    }
  };

  const loadCourseLessons = async (courseId) => {
    try {
      const lessonsQuery = query(
        collection(db, 'courses', courseId, 'lessons'),
        orderBy('order', 'asc')
      );
      const querySnapshot = await getDocs(lessonsQuery);
      
      if (!querySnapshot.empty) {
        const lessonsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCourseLessons(lessonsData);
      } else {
        // Generate sample lessons if none exist
        const sampleLessons = Array.from({ length: 5 }, (_, i) => ({
          id: `lesson-${i + 1}`,
          title: `Lesson ${i + 1}`,
          description: `This is lesson ${i + 1} of the course`,
          duration: '15 min',
          order: i + 1,
          completed: false,
        }));
        setCourseLessons(sampleLessons);
      }
    } catch (error) {
      logError('Error loading course lessons:', error);
      setCourseLessons([]);
    }
  };

  const handleLessonPress = (lesson) => {
    setSelectedLesson(lesson);
    setLessonModalVisible(true);
  };

  const handleCompleteLesson = async (courseId, lessonId) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const progress = userProgress[courseId] || { progress: 0, completedLessons: [], completed: false };
      
      if (!progress.completedLessons.includes(lessonId)) {
        const course = courses.find(c => c.id === courseId);
        const totalLessons = course?.lessons || courseLessons.length;
        const newCompletedLessons = [...progress.completedLessons, lessonId];
        const newProgress = (newCompletedLessons.length / totalLessons) * 100;
        const isCompleted = newProgress >= 100;

        await updateDoc(userRef, {
          [`courseProgress.${courseId}`]: {
            progress: newProgress,
            completedLessons: newCompletedLessons,
            completed: isCompleted,
            lastUpdated: serverTimestamp(),
          },
        });

        setUserProgress({
          ...userProgress,
          [courseId]: {
            progress: newProgress,
            completedLessons: newCompletedLessons,
            completed: isCompleted,
          },
        });

        // Update courseLessons state to reflect completion
        setCourseLessons(prevLessons => 
          prevLessons.map(lesson => 
            lesson.id === lessonId 
              ? { ...lesson, completed: true }
              : lesson
          )
        );

        if (isCompleted) {
          Alert.alert('Congratulations!', 'You have completed this course!');
        }
      }
    } catch (error) {
      logError('Error completing lesson:', error);
      Alert.alert('Error', 'Failed to mark lesson as complete. Please try again.');
    }
  };

  const handleForumReply = async () => {
    if (!auth.currentUser || !selectedForum || !forumReply.trim()) {
      return;
    }

    try {
      const user = auth.currentUser;
      const forumRef = doc(db, 'trainingForums', selectedForum.id);
      
      await updateDoc(forumRef, {
        replies: arrayUnion({
          content: forumReply.trim(),
          authorId: user.uid,
          authorName: user.displayName || 'Anonymous',
          createdAt: serverTimestamp(),
        }),
        replyCount: increment(1),
      });

      setForumReply('');
      loadForums();
      Alert.alert('Success', 'Your reply has been posted!');
    } catch (error) {
      logError('Error posting reply:', error);
      Alert.alert('Error', 'Failed to post reply. Please try again.');
    }
  };

  const handleLikeForum = async (forumId) => {
    if (!auth.currentUser) {
      Alert.alert('Login Required', 'Please login to like posts');
      return;
    }

    try {
      const forumRef = doc(db, 'trainingForums', forumId);
      const forumDoc = await getDoc(forumRef);
      
      if (forumDoc.exists()) {
        const currentLikes = forumDoc.data().likes || 0;
        await updateDoc(forumRef, {
          likes: increment(1),
        });
        
        // Update local state
        setForums(prevForums =>
          prevForums.map(forum =>
            forum.id === forumId
              ? { ...forum, likes: (forum.likes || 0) + 1 }
              : forum
          )
        );
        
        if (selectedForum && selectedForum.id === forumId) {
          setSelectedForum({
            ...selectedForum,
            likes: (selectedForum.likes || 0) + 1,
          });
        }
      }
    } catch (error) {
      logError('Error liking forum:', error);
    }
  };

  const handleCompleteAssignment = async (assignmentId) => {
    if (!auth.currentUser) {
      Alert.alert('Login Required', 'Please login to complete assignments');
      return;
    }

    Alert.alert(
      'Complete Assignment',
      'Are you sure you want to mark this assignment as complete?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              const assignmentRef = doc(db, 'assignments', assignmentId);
              await updateDoc(assignmentRef, {
                completed: true,
                completedAt: serverTimestamp(),
              });

              setAssignments(prevAssignments =>
                prevAssignments.map(assignment =>
                  assignment.id === assignmentId
                    ? { ...assignment, completed: true }
                    : assignment
                )
              );

              Alert.alert('Success', 'Assignment marked as complete!');
            } catch (error) {
              logError('Error completing assignment:', error);
              Alert.alert('Error', 'Failed to complete assignment. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleViewCertificate = (course) => {
    setSelectedCertificate(course);
    setCertificateModalVisible(true);
  };

  const handleImageError = (courseId) => {
    setImageErrors(prev => ({ ...prev, [courseId]: true }));
  };

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
        setBookmarkedMaterials(userData.bookmarkedMaterials || []);
      }
    } catch (error) {
      logError('Error loading user data:', error);
    }
  };

  // Convert gs:// URLs to download URLs
  const convertImageUrl = async (imageUrl) => {
    if (!imageUrl) return null;
    
    // If already a valid HTTP/HTTPS URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If it's a gs:// URL, convert to download URL
    if (imageUrl.startsWith('gs://')) {
      try {
        // Extract path from gs://bucket/path format
        const pathMatch = imageUrl.match(/gs:\/\/[^/]+\/(.+)/);
        if (pathMatch) {
          const filePath = pathMatch[1];
          const storageRef = ref(storage, filePath);
          const downloadURL = await getDownloadURL(storageRef);
          return downloadURL;
        }
      } catch (error) {
        console.warn('Error converting gs:// URL to download URL:', error);
        return null;
      }
    }
    
    return imageUrl;
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      try {
        const coursesQuery = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(coursesQuery);
        
        if (!querySnapshot.empty) {
          const coursesData = await Promise.all(
            querySnapshot.docs.map(async (doc) => {
              const courseData = { id: doc.id, ...doc.data() };
              // Convert image URL if it's a gs:// URL
              if (courseData.image) {
                courseData.image = await convertImageUrl(courseData.image);
              }
              return courseData;
            })
          );
          setCourses(coursesData);
        } else {
          setCourses(getFallbackCourses());
        }
      } catch (error) {
        if (__DEV__) console.log('Error with query, using fallback:', error);
        setCourses(getFallbackCourses());
      }
    } catch (error) {
      logError('Error loading courses:', error);
      setCourses(getFallbackCourses());
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async () => {
    try {
      setLoading(true);
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
      logError('Error loading materials:', error);
      setMaterials(getFallbackMaterials());
    } finally {
      setLoading(false);
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
          logError(`Error loading course ${courseId}:`, error);
        }
      }

      if (enrolledCoursesData.length === 0 && userEnrolledCourses.length === 0) {
        // Show sample progress for demo
        setMyProgress([]);
      } else {
        setMyProgress(enrolledCoursesData);
      }
    } catch (error) {
      logError('Error loading my progress:', error);
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
      logError('Error loading forums:', error);
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
        // Try query with where clause and orderBy (requires composite index)
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
        // If composite index error or permission error, try alternative approaches
        if (error.code === 'failed-precondition' || error.code === 'permission-denied') {
          try {
            // Try without orderBy (only where clause)
            const assignmentsQuery = query(
              collection(db, 'assignments'),
              where('userId', '==', user.uid)
            );
            const querySnapshot = await getDocs(assignmentsQuery);
            
            if (!querySnapshot.empty) {
              const assignmentsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
              }));
              // Sort manually by dueDate
              assignmentsData.sort((a, b) => {
                const dateA = a.dueDate?.toDate ? a.dueDate.toDate() : new Date(a.dueDate || 0);
                const dateB = b.dueDate?.toDate ? b.dueDate.toDate() : new Date(b.dueDate || 0);
                return dateA - dateB;
              });
              setAssignments(assignmentsData);
            } else {
              setAssignments([]);
            }
          } catch (secondError) {
            // Last resort: get all and filter client-side (may fail if no read permission)
            try {
              const allAssignmentsQuery = query(collection(db, 'assignments'));
              const querySnapshot = await getDocs(allAssignmentsQuery);
              if (!querySnapshot.empty) {
                const allAssignments = querySnapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data(),
                }));
                const userAssignments = allAssignments.filter(a => a.userId === user.uid);
                // Sort manually
                userAssignments.sort((a, b) => {
                  const dateA = a.dueDate?.toDate ? a.dueDate.toDate() : new Date(a.dueDate || 0);
                  const dateB = b.dueDate?.toDate ? b.dueDate.toDate() : new Date(b.dueDate || 0);
                  return dateA - dateB;
                });
                setAssignments(userAssignments);
              } else {
                setAssignments([]);
              }
            } catch (finalError) {
              // If all queries fail, just set empty array
              logError('Error loading assignments (all methods failed):', finalError);
              setAssignments([]);
            }
          }
        } else {
          // Other errors - log and set empty
          logError('Error loading assignments:', error);
          setAssignments([]);
        }
      }
    } catch (error) {
      logError('Error loading assignments:', error);
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
      if (Platform.OS === 'web') {
        window.alert('Login Required\n\nPlease login to enroll in courses');
      } else {
        Alert.alert('Login Required', 'Please login to enroll in courses');
      }
      return;
    }

    if (userEnrolledCourses.includes(course.id)) {
      if (Platform.OS === 'web') {
        window.alert('Already Enrolled\n\nYou are already enrolled in this course.');
      } else {
        Alert.alert('Already Enrolled', 'You are already enrolled in this course.');
      }
      return;
    }

    // Enrollment confirmation function
    const confirmEnrollment = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          if (Platform.OS === 'web') {
            window.alert('Error\n\nYou must be logged in to enroll.');
          } else {
            Alert.alert('Error', 'You must be logged in to enroll.');
          }
          return;
        }

        const userRef = doc(db, 'users', user.uid);
        const courseRef = doc(db, 'courses', course.id);
        
        // Check if user document exists, if not create it
        const userDoc = await getDoc(userRef);
        const currentEnrolledCourses = userDoc.exists() 
          ? (userDoc.data().enrolledCourses || [])
          : [];
        
        // Use setDoc with merge to create document if it doesn't exist
        await setDoc(userRef, {
          enrolledCourses: currentEnrolledCourses.includes(course.id) 
            ? currentEnrolledCourses 
            : [...currentEnrolledCourses, course.id],
          [`courseProgress.${course.id}`]: {
            progress: 0,
            completedLessons: [],
            enrolledAt: serverTimestamp(),
            completed: false,
          },
        }, { merge: true });

        // Try to increment enrolled count on course document
        // This may fail if user doesn't have permission, but enrollment still succeeds
        try {
          await updateDoc(courseRef, {
            enrolled: increment(1),
          });
        } catch (incrementError) {
          // Log but don't block enrollment if increment fails
          logError('Error incrementing course enrollment count:', incrementError);
          // On web, also log to console for debugging
          if (typeof window !== 'undefined' && window.console) {
            console.warn('Could not update course enrollment count:', incrementError);
          }
        }

        setUserEnrolledCourses([...userEnrolledCourses, course.id]);
        
        // Reload courses to show updated enrolled count
        await loadCourses();
        
        if (Platform.OS === 'web') {
          window.alert('Success!\n\nYou have been enrolled in the course!');
        } else {
          Alert.alert('Success', 'You have been enrolled in the course!');
        }
        loadUserData();
      } catch (error) {
        logError('Error enrolling in course:', error);
        // On web, also log to console for debugging
        if (typeof window !== 'undefined' && window.console) {
          console.error('Enrollment error:', error);
        }
        
        // Show more specific error message
        let errorMessage = 'Failed to enroll in course. Please try again.';
        if (error.code === 'permission-denied') {
          errorMessage = 'Permission denied. Please make sure you are logged in and try again.';
        } else if (error.code === 'unavailable') {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message) {
          errorMessage = `Error: ${error.message}`;
        }
        
        if (Platform.OS === 'web') {
          window.alert(`Error\n\n${errorMessage}`);
        } else {
          Alert.alert('Error', errorMessage);
        }
      }
    };

    // Platform-specific confirmation dialog
    if (Platform.OS === 'web') {
      if (window.confirm(`Enroll in Course\n\nAre you sure you want to enroll in "${course.title}"?`)) {
        confirmEnrollment();
      }
    } else {
      Alert.alert(
        'Enroll in Course',
        `Are you sure you want to enroll in "${course.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enroll',
            onPress: confirmEnrollment,
          },
        ]
      );
    }
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
        title: newForumPost.title.trim(),
        content: newForumPost.content.trim(),
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
      logError('Error submitting forum post:', error);
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
      image: null,
      enrolled: 0,
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
      image: null,
      enrolled: 0,
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
      image: null,
      enrolled: 0,
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
      url: null,
    },
    {
      id: '2',
      title: 'New Testament Overview',
      type: 'video',
      category: 'Teaching',
      description: 'Video series exploring the themes and structure of the New Testament',
      url: null,
    },
    {
      id: '3',
      title: 'Prayer and Fasting Guide',
      type: 'pdf',
      category: 'Spiritual Growth',
      description: 'Practical guide to prayer and fasting practices',
      url: null,
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

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses, materials..."
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
  );

  const renderFilters = () => {
    if (selectedTab !== 'Courses' && selectedTab !== 'Materials') return null;

    return (
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {selectedTab === 'Courses' && (
            <>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[styles.filterChip, selectedCategory === category && styles.filterChipActive]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[styles.filterChipText, selectedCategory === category && styles.filterChipTextActive]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
              {levels.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.filterChip, selectedLevel === level && styles.filterChipActive]}
                  onPress={() => setSelectedLevel(level)}
                >
                  <Text style={[styles.filterChipText, selectedLevel === level && styles.filterChipTextActive]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}
          {selectedTab === 'Materials' && (
            <>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[styles.filterChip, selectedCategory === category && styles.filterChipActive]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[styles.filterChipText, selectedCategory === category && styles.filterChipTextActive]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderCourses = () => {
    if (loading && courses.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      );
    }

    // Check if any filters are active
    const hasActiveFilters = searchQuery.trim() || selectedCategory !== 'All' || selectedLevel !== 'All';
    // If filters are active, always use filteredCourses (even if empty, to show proper empty state)
    // If no filters are active, use filteredCourses if populated, otherwise fallback to courses
    const displayCourses = hasActiveFilters ? filteredCourses : (filteredCourses.length > 0 ? filteredCourses : courses);

    if (displayCourses.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="school-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyStateText}>
            {searchQuery || selectedCategory !== 'All' || selectedLevel !== 'All' 
              ? 'No courses match your filters' 
              : 'No courses available'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {displayCourses.map((course) => {
          const isEnrolled = userEnrolledCourses.includes(course.id);
          return (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              onPress={async () => {
                setSelectedCourse(course);
                if (userEnrolledCourses.includes(course.id)) {
                  await loadCourseLessons(course.id);
                }
                setCourseModalVisible(true);
              }}
            >
              {course.image && !imageErrors[course.id] ? (
                <Image 
                  source={{ uri: course.image }} 
                  style={styles.courseImage}
                  onError={() => handleImageError(course.id)}
                />
              ) : (
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
              )}
              {course.image && (
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.courseImageOverlay}
                >
                  <View style={styles.courseInfo}>
                    <Text style={[styles.courseTitle, { color: '#fff' }]}>{course.title}</Text>
                    <Text style={[styles.courseInstructor, { color: '#fff', opacity: 0.9 }]}>{course.instructor}</Text>
                  </View>
                  {course.level && (
                    <View style={[styles.levelBadge, { backgroundColor: getLevelColor(course.level) }]}>
                      <Text style={styles.levelText}>{course.level}</Text>
                    </View>
                  )}
                </LinearGradient>
              )}
              
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
    if (loading && materials.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      );
    }

    // Check if any filters are active
    const hasActiveFilters = searchQuery.trim() || selectedCategory !== 'All';
    // If filters are active, always use filteredMaterials (even if empty, to show proper empty state)
    // If no filters are active, use filteredMaterials if populated, otherwise fallback to materials
    const displayMaterials = hasActiveFilters ? filteredMaterials : (filteredMaterials.length > 0 ? filteredMaterials : materials);

    if (displayMaterials.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="library-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyStateText}>
            {searchQuery || selectedCategory !== 'All' 
              ? 'No materials match your filters' 
              : 'No materials available'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {displayMaterials.map((material) => {
          const isBookmarked = bookmarkedMaterials.includes(material.id);
          return (
            <TouchableOpacity
              key={material.id}
              style={styles.materialCard}
              onPress={() => {
                setSelectedMaterial(material);
                setMaterialModalVisible(true);
              }}
            >
              <View style={[styles.materialIcon, { backgroundColor: getMaterialColor(material.type || 'document') + '20' }]}>
                <Ionicons name={getMaterialIcon(material.type || 'document')} size={32} color={getMaterialColor(material.type || 'document')} />
              </View>
              <View style={styles.materialContent}>
                <View style={styles.materialHeader}>
                  <Text style={styles.materialTitle}>{material.title}</Text>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleBookmarkMaterial(material.id);
                    }}
                    style={styles.bookmarkButton}
                  >
                    <Ionicons 
                      name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                      size={20} 
                      color={isBookmarked ? "#f59e0b" : "#6b7280"} 
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.materialCategory}>{material.category}</Text>
                <Text style={styles.materialDescription} numberOfLines={2}>
                  {material.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
            </TouchableOpacity>
          );
        })}
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
                  <TouchableOpacity 
                    style={styles.viewCertificateButton}
                    onPress={() => handleViewCertificate(course)}
                  >
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
            <TouchableOpacity 
              key={forum.id} 
              style={styles.forumCard}
              onPress={() => {
                setSelectedForum(forum);
                setForumDetailModalVisible(true);
              }}
            >
              <Text style={styles.forumTitle}>{forum.title}</Text>
              <FormattedText style={styles.forumContent} numberOfLines={3}>
                {forum.content}
              </FormattedText>
              <View style={styles.forumFooter}>
                <Text style={styles.forumAuthor}>{forum.authorName}</Text>
                <View style={styles.forumStats}>
                  <View style={styles.forumStat}>
                    <Ionicons name="chatbubble-outline" size={14} color="#6b7280" />
                    <Text style={styles.forumStatText}>{forum.replies?.length || forum.replyCount || 0}</Text>
                  </View>
                  <View style={styles.forumStat}>
                    <Ionicons name="eye-outline" size={14} color="#6b7280" />
                    <Text style={styles.forumStatText}>{forum.views || 0}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.forumStat}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleLikeForum(forum.id);
                    }}
                  >
                    <Ionicons name="heart-outline" size={14} color="#6b7280" />
                    <Text style={styles.forumStatText}>{forum.likes || 0}</Text>
                  </TouchableOpacity>
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
                {assignment.completed ? (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => handleCompleteAssignment(assignment.id)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={20} color="#6366f1" />
                    <Text style={styles.completeButtonText}>Mark Complete</Text>
                  </TouchableOpacity>
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

      {(selectedTab === 'Courses' || selectedTab === 'Materials') && renderSearchBar()}
      {(selectedTab === 'Courses' || selectedTab === 'Materials') && renderFilters()}

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

                  {/* Course Lessons Section - Show if enrolled */}
                  {userEnrolledCourses.includes(selectedCourse.id) && courseLessons.length > 0 && (
                    <View style={styles.lessonsSection}>
                      <Text style={styles.lessonsSectionTitle}>Course Lessons</Text>
                      {courseLessons.map((lesson) => {
                        const progress = userProgress[selectedCourse.id] || { completedLessons: [] };
                        const isCompleted = progress.completedLessons?.includes(lesson.id);
                        return (
                          <TouchableOpacity
                            key={lesson.id}
                            style={[styles.lessonItem, isCompleted && styles.lessonItemCompleted]}
                            onPress={() => handleLessonPress(lesson)}
                          >
                            <View style={styles.lessonNumber}>
                              {isCompleted ? (
                                <Ionicons name="checkmark" size={20} color="#fff" />
                              ) : (
                                <Text style={styles.lessonNumberText}>{lesson.order || 1}</Text>
                              )}
                            </View>
                            <View style={styles.lessonContent}>
                              <Text style={styles.lessonTitle}>{lesson.title}</Text>
                              {lesson.description && (
                                <FormattedText style={styles.lessonDescription}>{lesson.description}</FormattedText>
                              )}
                              {lesson.duration && (
                                <Text style={styles.lessonDuration}>{lesson.duration}</Text>
                              )}
                            </View>
                            {isCompleted && (
                              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </ScrollView>
                <View style={styles.modalFooter}>
                  {userEnrolledCourses.includes(selectedCourse.id) ? (
                    <TouchableOpacity
                      style={[styles.modalButton, styles.enrolledModalButton]}
                      onPress={() => {
                        setCourseModalVisible(false);
                        setSelectedTab('My Progress');
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.modalButtonText}>View Progress</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.modalButton, styles.enrollModalButton]}
                      onPress={() => {
                        setCourseModalVisible(false);
                        handleEnrollCourse(selectedCourse);
                      }}
                    >
                      <Text style={styles.modalButtonText}>Enroll Now</Text>
                    </TouchableOpacity>
                  )}
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
                  {selectedMaterial.category && (
                    <View style={styles.modalDetailItem}>
                      <Ionicons name="folder-outline" size={20} color="#6366f1" />
                      <Text style={styles.modalDetailText}>{selectedMaterial.category}</Text>
                    </View>
                  )}
                  {selectedMaterial.type && (
                    <View style={styles.modalDetailItem}>
                      <Ionicons name={getMaterialIcon(selectedMaterial.type)} size={20} color={getMaterialColor(selectedMaterial.type)} />
                      <Text style={styles.modalDetailText}>
                        Type: {selectedMaterial.type.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.modalDescription}>{selectedMaterial.description}</Text>
                </ScrollView>
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[
                      styles.modalButton, 
                      styles.downloadButton,
                      !selectedMaterial.url && styles.buttonDisabled
                    ]}
                    onPress={() => {
                      if (selectedMaterial.url) {
                        Linking.openURL(selectedMaterial.url).catch(err => {
                          Alert.alert('Error', 'Could not open the resource');
                        });
                      } else {
                        Alert.alert('No Resource Available', 'This material does not have a download link yet.');
                      }
                    }}
                    disabled={!selectedMaterial.url}
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

      {/* Forum Detail Modal */}
      <Modal
        visible={forumDetailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setForumDetailModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            {selectedForum && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} numberOfLines={2}>{selectedForum.title}</Text>
                  <TouchableOpacity onPress={() => setForumDetailModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#111827" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                  <View style={styles.forumDetailHeader}>
                    <Text style={styles.forumDetailAuthor}>By {selectedForum.authorName}</Text>
                    <View style={styles.forumDetailStats}>
                      <View style={styles.forumStat}>
                        <Ionicons name="chatbubble-outline" size={16} color="#6b7280" />
                        <Text style={styles.forumStatText}>{selectedForum.replies?.length || selectedForum.replyCount || 0}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.forumStat}
                        onPress={() => handleLikeForum(selectedForum.id)}
                      >
                        <Ionicons name="heart-outline" size={16} color="#6b7280" />
                        <Text style={styles.forumStatText}>{selectedForum.likes || 0}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <FormattedText style={styles.forumDetailContent}>{selectedForum.content}</FormattedText>
                  
                  {selectedForum.replies && selectedForum.replies.length > 0 && (
                    <View style={styles.repliesSection}>
                      <Text style={styles.repliesTitle}>Replies ({selectedForum.replies.length})</Text>
                      {selectedForum.replies.map((reply, index) => (
                        <View key={index} style={styles.replyItem}>
                          <Text style={styles.replyAuthor}>{reply.authorName}</Text>
                          <FormattedText style={styles.replyContent}>{reply.content}</FormattedText>
                        </View>
                      ))}
                    </View>
                  )}
                </ScrollView>
                <View style={styles.modalFooter}>
                  <TextInput
                    style={[styles.input, styles.replyInput]}
                    placeholder="Write a reply..."
                    placeholderTextColor="#9ca3af"
                    value={forumReply}
                    onChangeText={setForumReply}
                    multiline
                  />
                  <TouchableOpacity
                    style={[styles.modalButton, styles.submitButton, !forumReply.trim() && styles.buttonDisabled]}
                    onPress={handleForumReply}
                    disabled={!forumReply.trim()}
                  >
                    <Ionicons name="send" size={20} color="#fff" />
                    <Text style={styles.modalButtonText}>Reply</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Lesson Detail Modal */}
      <Modal
        visible={lessonModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLessonModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedLesson && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} numberOfLines={2}>{selectedLesson.title}</Text>
                  <TouchableOpacity onPress={() => setLessonModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#111827" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                  {selectedLesson.description && (
                    <FormattedText style={styles.modalDescription}>{selectedLesson.description}</FormattedText>
                  )}
                  
                  {selectedLesson.duration && (
                    <View style={styles.modalDetailItem}>
                      <Ionicons name="time-outline" size={20} color="#6366f1" />
                      <Text style={styles.modalDetailText}>{selectedLesson.duration}</Text>
                    </View>
                  )}

                  {selectedLesson.content && (
                    <View style={styles.lessonContentSection}>
                      <Text style={styles.lessonContentTitle}>Lesson Content</Text>
                      <FormattedText style={styles.lessonContentText}>{selectedLesson.content}</FormattedText>
                    </View>
                  )}

                  {selectedLesson.videoUrl && (
                    <View style={styles.lessonMediaSection}>
                      <Text style={styles.lessonMediaTitle}>Video Lesson</Text>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.downloadButton]}
                        onPress={() => {
                          if (selectedLesson.videoUrl) {
                            Linking.openURL(selectedLesson.videoUrl).catch(err => {
                              Alert.alert('Error', 'Could not open the video');
                            });
                          }
                        }}
                      >
                        <Ionicons name="videocam-outline" size={20} color="#fff" />
                        <Text style={styles.modalButtonText}>Watch Video</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {selectedLesson.audioUrl && (
                    <View style={styles.lessonMediaSection}>
                      <Text style={styles.lessonMediaTitle}>Audio Lesson</Text>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.downloadButton]}
                        onPress={() => {
                          if (selectedLesson.audioUrl) {
                            Linking.openURL(selectedLesson.audioUrl).catch(err => {
                              Alert.alert('Error', 'Could not open the audio');
                            });
                          }
                        }}
                      >
                        <Ionicons name="headset-outline" size={20} color="#fff" />
                        <Text style={styles.modalButtonText}>Listen to Audio</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {selectedLesson.pdfUrl && (
                    <View style={styles.lessonMediaSection}>
                      <Text style={styles.lessonMediaTitle}>Lesson Materials</Text>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.downloadButton]}
                        onPress={() => {
                          if (selectedLesson.pdfUrl) {
                            Linking.openURL(selectedLesson.pdfUrl).catch(err => {
                              Alert.alert('Error', 'Could not open the PDF');
                            });
                          }
                        }}
                      >
                        <Ionicons name="document-text-outline" size={20} color="#fff" />
                        <Text style={styles.modalButtonText}>View/Download PDF</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {!selectedLesson.content && !selectedLesson.videoUrl && !selectedLesson.audioUrl && !selectedLesson.pdfUrl && (
                    <View style={styles.emptyLessonContent}>
                      <Ionicons name="document-outline" size={48} color="#d1d5db" />
                      <Text style={styles.emptyLessonText}>No lesson content available yet</Text>
                      <Text style={styles.emptyLessonSubtext}>Content will be added soon</Text>
                    </View>
                  )}
                </ScrollView>
                <View style={styles.modalFooter}>
                  {(() => {
                    const progress = userProgress[selectedCourse?.id] || { completedLessons: [] };
                    const isCompleted = progress.completedLessons?.includes(selectedLesson.id);
                    
                    if (isCompleted) {
                      return (
                        <View style={styles.completedBadge}>
                          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                          <Text style={styles.completedText}>Lesson Completed</Text>
                        </View>
                      );
                    } else {
                      return (
                        <TouchableOpacity
                          style={[styles.modalButton, styles.submitButton]}
                          onPress={() => {
                            handleCompleteLesson(selectedCourse?.id, selectedLesson.id);
                            setLessonModalVisible(false);
                          }}
                        >
                          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                          <Text style={styles.modalButtonText}>Mark as Complete</Text>
                        </TouchableOpacity>
                      );
                    }
                  })()}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Certificate Modal */}
      <Modal
        visible={certificateModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCertificateModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedCertificate && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Course Certificate</Text>
                  <TouchableOpacity onPress={() => setCertificateModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#111827" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                  <View style={styles.certificateContainer}>
                    <View style={styles.certificateHeader}>
                      <Ionicons name="trophy" size={64} color="#f59e0b" />
                      <Text style={styles.certificateTitle}>Certificate of Completion</Text>
                      <Text style={styles.certificateSubtitle}>This certifies that</Text>
                    </View>
                    <View style={styles.certificateBody}>
                      <Text style={styles.certificateName}>
                        {auth.currentUser?.displayName || 'Student'}
                      </Text>
                      <Text style={styles.certificateText}>
                        has successfully completed the course
                      </Text>
                      <Text style={styles.certificateCourseName}>
                        {selectedCertificate.title}
                      </Text>
                      <Text style={styles.certificateInstructor}>
                        Instructor: {selectedCertificate.instructor}
                      </Text>
                    </View>
                    <View style={styles.certificateFooter}>
                      <Text style={styles.certificateDate}>
                        {new Date().toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                  </View>
                </ScrollView>
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.downloadButton]}
                    onPress={() => {
                      Alert.alert(
                        'Download Certificate',
                        'Certificate download feature will be available soon!',
                        [{ text: 'OK' }]
                      );
                    }}
                  >
                    <Ionicons name="download-outline" size={20} color="#fff" />
                    <Text style={styles.modalButtonText}>Download PDF</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filtersScroll: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  courseImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  courseImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookmarkButton: {
    padding: 4,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  lessonsSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  lessonsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  lessonItem: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  lessonItemCompleted: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  lessonNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lessonNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  lessonDuration: {
    fontSize: 12,
    color: '#9ca3af',
  },
  enrolledModalButton: {
    backgroundColor: '#10b981',
  },
  forumDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  forumDetailAuthor: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  forumDetailStats: {
    flexDirection: 'row',
  },
  forumDetailContent: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 24,
  },
  repliesSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  repliesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  replyItem: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  replyAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 6,
  },
  replyContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  replyInput: {
    marginBottom: 12,
    minHeight: 60,
    maxHeight: 120,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 4,
  },
  certificateContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#f59e0b',
    alignItems: 'center',
    minHeight: 400,
  },
  certificateHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  certificateTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  certificateSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  certificateBody: {
    alignItems: 'center',
    marginVertical: 32,
    flex: 1,
  },
  certificateName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 12,
    textAlign: 'center',
  },
  certificateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  certificateCourseName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  certificateInstructor: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  certificateFooter: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    width: '100%',
    alignItems: 'center',
  },
  certificateDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  lessonContentSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  lessonContentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  lessonContentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  lessonMediaSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  lessonMediaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  emptyLessonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyLessonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyLessonSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
});

