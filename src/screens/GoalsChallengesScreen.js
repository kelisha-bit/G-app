import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, auth } from '../../firebase.config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CHALLENGE_CATEGORIES = {
  bible: { name: 'Bible Reading', icon: 'book', color: '#3b82f6' },
  prayer: { name: 'Prayer', icon: 'hand-left', color: '#8b5cf6' },
  service: { name: 'Service', icon: 'people', color: '#10b981' },
  community: { name: 'Community', icon: 'heart', color: '#ef4444' },
  personal: { name: 'Personal', icon: 'person', color: '#f59e0b' },
};

const DIFFICULTY_LEVELS = {
  easy: { name: 'Easy', color: '#10b981' },
  medium: { name: 'Medium', color: '#f59e0b' },
  hard: { name: 'Hard', color: '#ef4444' },
};

const PREDEFINED_CHALLENGES = [
  {
    id: 'bible-30',
    title: '30-Day Bible Reading Challenge',
    description: 'Read the Bible every day for 30 days',
    category: 'bible',
    difficulty: 'easy',
    duration: 30,
    type: 'streak',
    target: 30,
    unit: 'days',
    icon: 'book',
    color: '#3b82f6',
  },
  {
    id: 'bible-90',
    title: '90-Day Bible Reading Challenge',
    description: 'Read the Bible every day for 90 days',
    category: 'bible',
    difficulty: 'medium',
    duration: 90,
    type: 'streak',
    target: 90,
    unit: 'days',
    icon: 'book',
    color: '#3b82f6',
  },
  {
    id: 'bible-365',
    title: 'Bible in a Year',
    description: 'Complete a full year of daily Bible reading',
    category: 'bible',
    difficulty: 'hard',
    duration: 365,
    type: 'streak',
    target: 365,
    unit: 'days',
    icon: 'book',
    color: '#3b82f6',
  },
  {
    id: 'prayer-7',
    title: '7-Day Prayer Streak',
    description: 'Pray every day for 7 consecutive days',
    category: 'prayer',
    difficulty: 'easy',
    duration: 7,
    type: 'streak',
    target: 7,
    unit: 'days',
    icon: 'hand-left',
    color: '#8b5cf6',
  },
  {
    id: 'prayer-30',
    title: '30-Day Prayer Challenge',
    description: 'Maintain a daily prayer habit for 30 days',
    category: 'prayer',
    difficulty: 'medium',
    duration: 30,
    type: 'streak',
    target: 30,
    unit: 'days',
    icon: 'hand-left',
    color: '#8b5cf6',
  },
  {
    id: 'service-10',
    title: '10 Service Hours',
    description: 'Complete 10 hours of volunteer service',
    category: 'service',
    difficulty: 'medium',
    duration: null,
    type: 'accumulative',
    target: 10,
    unit: 'hours',
    icon: 'people',
    color: '#10b981',
  },
  {
    id: 'service-50',
    title: '50 Service Hours',
    description: 'Complete 50 hours of volunteer service',
    category: 'service',
    difficulty: 'hard',
    duration: null,
    type: 'accumulative',
    target: 50,
    unit: 'hours',
    icon: 'people',
    color: '#10b981',
  },
  {
    id: 'scripture-10',
    title: 'Memorize 10 Scriptures',
    description: 'Memorize 10 Bible verses',
    category: 'personal',
    difficulty: 'medium',
    duration: null,
    type: 'accumulative',
    target: 10,
    unit: 'verses',
    icon: 'document-text',
    color: '#f59e0b',
  },
];

export default function GoalsChallengesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('active'); // active, available, completed, my-goals
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [availableChallenges, setAvailableChallenges] = useState([]);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [myGoals, setMyGoals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'personal',
    target: '',
    unit: 'times',
    deadline: null,
  });
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(false);
  const [accountabilityPartners, setAccountabilityPartners] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    if (activeTab === 'active') {
      loadActiveChallenges();
    } else if (activeTab === 'available') {
      loadAvailableChallenges();
    } else if (activeTab === 'completed') {
      loadCompletedChallenges();
    } else if (activeTab === 'my-goals') {
      loadMyGoals();
    }
  }, [activeTab]);

  const loadData = async () => {
    await Promise.all([
      loadActiveChallenges(),
      loadAvailableChallenges(),
      loadCompletedChallenges(),
      loadMyGoals(),
      loadAchievements(),
      loadUserSettings(),
    ]);
  };

  const loadUserSettings = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setLeaderboardEnabled(userData.leaderboardEnabled || false);
        setAccountabilityPartners(userData.accountabilityPartners || []);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const loadActiveChallenges = async () => {
    try {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      const userId = auth.currentUser.uid;
      let snapshot;
      try {
        // Try with both where clauses first (requires composite index)
        const challengesQuery = query(
          collection(db, 'userChallenges'),
          where('userId', '==', userId),
          where('status', '==', 'active')
        );
        snapshot = await getDocs(challengesQuery);
      } catch (queryError) {
        // If query fails (e.g., missing index), try with just userId and filter in memory
        console.log('Query with status failed, trying without:', queryError);
        const challengesQuery = query(
          collection(db, 'userChallenges'),
          where('userId', '==', userId)
        );
        const allSnapshot = await getDocs(challengesQuery);
        // Filter in memory
        snapshot = {
          forEach: (callback) => {
            allSnapshot.forEach((doc) => {
              if (doc.data().status === 'active') {
                callback(doc);
              }
            });
          },
          empty: false,
        };
      }
      const challenges = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        challenges.push({
          id: docSnap.id,
          ...data,
          startDate: data.startDate?.toDate?.() || new Date(data.startDate),
          endDate: data.endDate?.toDate?.() || (data.endDate ? new Date(data.endDate) : null),
        });
      });

      // Calculate progress for each challenge
      const challengesWithProgress = await Promise.all(
        challenges.map(async (challenge) => {
          const progress = await calculateProgress(challenge);
          return { ...challenge, progress };
        })
      );

      setActiveChallenges(challengesWithProgress);
    } catch (error) {
      console.error('Error loading active challenges:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAvailableChallenges = async () => {
    try {
      if (!auth.currentUser) return;

      const userId = auth.currentUser.uid;
      
      // Get user's active and completed challenge IDs
      const userChallengesQuery = query(
        collection(db, 'userChallenges'),
        where('userId', '==', userId)
      );
      const userChallengesSnapshot = await getDocs(userChallengesQuery);
      const userChallengeIds = new Set();
      userChallengesSnapshot.forEach((doc) => {
        userChallengeIds.add(doc.data().challengeId);
      });

      // Filter out challenges user already has
      const available = PREDEFINED_CHALLENGES.filter(
        (challenge) => !userChallengeIds.has(challenge.id)
      );

      setAvailableChallenges(available);
    } catch (error) {
      console.error('Error loading available challenges:', error);
    }
  };

  const loadCompletedChallenges = async () => {
    try {
      if (!auth.currentUser) return;

      const userId = auth.currentUser.uid;
      let snapshot;
      try {
        // Try with both where clauses first (requires composite index)
        const challengesQuery = query(
          collection(db, 'userChallenges'),
          where('userId', '==', userId),
          where('status', '==', 'completed')
        );
        snapshot = await getDocs(challengesQuery);
      } catch (queryError) {
        // If query fails (e.g., missing index), try with just userId and filter in memory
        console.log('Query with status failed, trying without:', queryError);
        const challengesQuery = query(
          collection(db, 'userChallenges'),
          where('userId', '==', userId)
        );
        const allSnapshot = await getDocs(challengesQuery);
        // Filter in memory
        snapshot = {
          forEach: (callback) => {
            allSnapshot.forEach((doc) => {
              if (doc.data().status === 'completed') {
                callback(doc);
              }
            });
          },
          empty: false,
        };
      }
      const challenges = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        challenges.push({
          id: docSnap.id,
          ...data,
          completedAt: data.completedAt?.toDate?.() || new Date(data.completedAt),
          startDate: data.startDate?.toDate?.() || new Date(data.startDate),
        });
      });

      // Sort by completion date
      challenges.sort((a, b) => b.completedAt - a.completedAt);
      setCompletedChallenges(challenges);
    } catch (error) {
      console.error('Error loading completed challenges:', error);
    }
  };

  const loadMyGoals = async () => {
    try {
      if (!auth.currentUser) return;

      const userId = auth.currentUser.uid;
      let snapshot;
      try {
        // Try with orderBy first (requires composite index)
        const goalsQuery = query(
          collection(db, 'userGoals'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        snapshot = await getDocs(goalsQuery);
      } catch (queryError) {
        // If query fails (e.g., missing index), try without orderBy and sort in memory
        console.log('Query with orderBy failed, trying without:', queryError);
        const goalsQuery = query(
          collection(db, 'userGoals'),
          where('userId', '==', userId)
        );
        const allSnapshot = await getDocs(goalsQuery);
        // Sort in memory
        const goals = [];
        allSnapshot.forEach((doc) => {
          goals.push(doc);
        });
        goals.sort((a, b) => {
          const dateA = a.data().createdAt?.toDate?.() || new Date(a.data().createdAt || 0);
          const dateB = b.data().createdAt?.toDate?.() || new Date(b.data().createdAt || 0);
          return dateB - dateA;
        });
        snapshot = {
          forEach: (callback) => {
            goals.forEach((doc) => callback(doc));
          },
          empty: goals.length === 0,
        };
      }
      const goals = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        goals.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          deadline: data.deadline?.toDate?.() || (data.deadline ? new Date(data.deadline) : null),
        });
      });

      // Calculate progress for each goal
      const goalsWithProgress = await Promise.all(
        goals.map(async (goal) => {
          const progress = await calculateGoalProgress(goal);
          return { ...goal, progress };
        })
      );

      setMyGoals(goalsWithProgress);
    } catch (error) {
      console.error('Error loading my goals:', error);
    }
  };

  const loadAchievements = async () => {
    try {
      if (!auth.currentUser) return;

      const userId = auth.currentUser.uid;
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setAchievements(userData.achievements || []);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const calculateProgress = async (challenge) => {
    try {
      const user = auth.currentUser;
      if (!user) return { current: 0, percentage: 0 };

      const challengeData = challenge.challengeData || {};
      const challengeType = challengeData.type || 'streak';

      if (challengeType === 'streak') {
        // Calculate streak from check-ins or activity
        const streak = await calculateStreak(challengeData.category);
        const target = challengeData.target || 30;
        return {
          current: streak,
          target,
          percentage: Math.min((streak / target) * 100, 100),
        };
      } else if (challengeType === 'accumulative') {
        // Calculate accumulated value
        const accumulated = await calculateAccumulated(challengeData.category, challengeData.unit);
        const target = challengeData.target || 10;
        return {
          current: accumulated,
          target,
          percentage: Math.min((accumulated / target) * 100, 100),
        };
      }

      return { current: 0, target: 0, percentage: 0 };
    } catch (error) {
      console.error('Error calculating progress:', error);
      return { current: 0, target: 0, percentage: 0 };
    }
  };

  const calculateStreak = async (category) => {
    try {
      const user = auth.currentUser;
      if (!user) return 0;

      const userId = user.uid;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (category === 'bible') {
        // Check reading plans from user document
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const readingPlans = userData.readingPlans || {};
          // Get the most recent reading plan and calculate streak
          // This is a simplified version - you might want to track daily readings separately
          return 0; // Placeholder
        }
      } else if (category === 'prayer') {
        // Check prayer requests or prayer activity
        const prayersQuery = query(
          collection(db, 'prayerRequests'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const prayersSnapshot = await getDocs(prayersQuery);
        let streak = 0;
        let checkDate = new Date(today);

        prayersSnapshot.forEach((doc) => {
          const data = doc.data();
          const prayerDate = data.createdAt?.toDate?.() || new Date(data.createdAt);
          prayerDate.setHours(0, 0, 0, 0);

          if (prayerDate.getTime() === checkDate.getTime()) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          }
        });

        return streak;
      }

      return 0;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  };

  const calculateAccumulated = async (category, unit) => {
    try {
      const user = auth.currentUser;
      if (!user) return 0;

      const userId = user.uid;

      if (category === 'service' && unit === 'hours') {
        // Get volunteer hours from volunteer applications
        const volunteersQuery = query(
          collection(db, 'volunteerApplications'),
          where('userId', '==', userId),
          where('status', '==', 'approved')
        );
        const snapshot = await getDocs(volunteersQuery);
        let totalHours = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          totalHours += parseFloat(data.hoursCompleted || 0);
        });
        return totalHours;
      }

      return 0;
    } catch (error) {
      console.error('Error calculating accumulated:', error);
      return 0;
    }
  };

  const calculateGoalProgress = async (goal) => {
    // For custom goals, progress is manually updated
    return {
      current: goal.currentProgress || 0,
      target: parseFloat(goal.target) || 1,
      percentage: Math.min(((goal.currentProgress || 0) / (parseFloat(goal.target) || 1)) * 100, 100),
    };
  };

  const joinChallenge = async (challenge) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to join challenges');
        return;
      }

      const userId = user.uid;
      const startDate = new Date();
      const endDate = challenge.duration
        ? new Date(startDate.getTime() + challenge.duration * 24 * 60 * 60 * 1000)
        : null;

      await addDoc(collection(db, 'userChallenges'), {
        userId,
        challengeId: challenge.id,
        challengeData: {
          title: challenge.title,
          description: challenge.description,
          category: challenge.category,
          difficulty: challenge.difficulty,
          duration: challenge.duration,
          type: challenge.type,
          target: challenge.target,
          unit: challenge.unit,
        },
        status: 'active',
        startDate: serverTimestamp(),
        endDate: endDate ? serverTimestamp() : null,
        progress: 0,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', `You've joined the ${challenge.title}!`);
      loadAvailableChallenges();
      setActiveTab('active');
      loadActiveChallenges();
    } catch (error) {
      console.error('Error joining challenge:', error);
      Alert.alert('Error', 'Failed to join challenge');
    }
  };

  const createCustomGoal = async () => {
    try {
      if (!newGoal.title.trim() || !newGoal.target.trim()) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to create goals');
        return;
      }

      const userId = user.uid;

      await addDoc(collection(db, 'userGoals'), {
        userId,
        title: newGoal.title.trim(),
        description: newGoal.description.trim(),
        category: newGoal.category,
        target: parseFloat(newGoal.target),
        unit: newGoal.unit,
        currentProgress: 0,
        deadline: newGoal.deadline || null,
        status: 'active',
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Goal created successfully!');
      setShowCreateModal(false);
      setNewGoal({
        title: '',
        description: '',
        category: 'personal',
        target: '',
        unit: 'times',
        deadline: null,
      });
      loadMyGoals();
      setActiveTab('my-goals');
    } catch (error) {
      console.error('Error creating goal:', error);
      Alert.alert('Error', 'Failed to create goal');
    }
  };

  const updateGoalProgress = async (goalId, newProgress) => {
    try {
      const goalRef = doc(db, 'userGoals', goalId);
      await updateDoc(goalRef, {
        currentProgress: newProgress,
        updatedAt: serverTimestamp(),
      });

      // Check if goal is completed
      const goalSnap = await getDoc(goalRef);
      const goalData = goalSnap.data();
      if (goalData.currentProgress >= goalData.target) {
        await updateDoc(goalRef, {
          status: 'completed',
          completedAt: serverTimestamp(),
        });
        await awardAchievement('goal_completed');
      }

      loadMyGoals();
    } catch (error) {
      console.error('Error updating goal progress:', error);
      Alert.alert('Error', 'Failed to update progress');
    }
  };

  const awardAchievement = async (achievementId) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userId = user.uid;
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const achievements = userData.achievements || [];

        if (!achievements.includes(achievementId)) {
          await updateDoc(userRef, {
            achievements: arrayUnion(achievementId),
          });
          loadAchievements();
        }
      }
    } catch (error) {
      console.error('Error awarding achievement:', error);
    }
  };

  const shareProgress = async (challenge) => {
    try {
      const progress = challenge.progress || { current: 0, target: 0 };
      const percentage = Math.round(progress.percentage || 0);
      const message = `I'm ${percentage}% complete with the ${challenge.challengeData?.title || 'challenge'}! Join me in this spiritual journey! 🎯`;

      await Share.share({
        message,
        title: 'My Challenge Progress',
      });
    } catch (error) {
      console.error('Error sharing progress:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderProgressBar = (progress) => {
    const percentage = Math.min(progress.percentage || 0, 100);
    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {progress.current || 0} / {progress.target || 0} {progress.unit || ''}
        </Text>
      </View>
    );
  };

  const renderChallengeCard = (challenge, isActive = false) => {
    const category = CHALLENGE_CATEGORIES[challenge.category || challenge.challengeData?.category] || CHALLENGE_CATEGORIES.personal;
    const progress = challenge.progress || { current: 0, target: 0, percentage: 0 };
    const isCompleted = progress.percentage >= 100;

    return (
      <TouchableOpacity
        key={challenge.id}
        style={styles.challengeCard}
        onPress={() => {
          setSelectedChallenge(challenge);
          setDetailModalVisible(true);
        }}
      >
        <View style={styles.challengeHeader}>
          <View style={[styles.challengeIconContainer, { backgroundColor: category.color + '20' }]}>
            <Ionicons name={category.icon} size={24} color={category.color} />
          </View>
          <View style={styles.challengeTitleContainer}>
            <Text style={styles.challengeTitle}>
              {challenge.title || challenge.challengeData?.title}
            </Text>
            <Text style={styles.challengeDescription} numberOfLines={2}>
              {challenge.description || challenge.challengeData?.description}
            </Text>
          </View>
        </View>

        {isActive && (
          <>
            {renderProgressBar(progress)}
            <View style={styles.challengeFooter}>
              <View style={styles.challengeMeta}>
                <Ionicons name="calendar" size={14} color="#666" />
                <Text style={styles.challengeMetaText}>
                  {challenge.duration ? `${challenge.duration} days` : 'Ongoing'}
                </Text>
              </View>
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.completedText}>Completed!</Text>
                </View>
              )}
            </View>
          </>
        )}

        {!isActive && (
          <View style={styles.challengeFooter}>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>
                {DIFFICULTY_LEVELS[challenge.difficulty || challenge.challengeData?.difficulty]?.name || 'Medium'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => joinChallenge(challenge)}
            >
              <Text style={styles.joinButtonText}>Join Challenge</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderGoalCard = (goal) => {
    const category = CHALLENGE_CATEGORIES[goal.category] || CHALLENGE_CATEGORIES.personal;
    const progress = goal.progress || { current: 0, target: 0, percentage: 0 };
    const isCompleted = goal.status === 'completed' || progress.percentage >= 100;

    return (
      <View key={goal.id} style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={[styles.goalIconContainer, { backgroundColor: category.color + '20' }]}>
            <Ionicons name={category.icon} size={20} color={category.color} />
          </View>
          <View style={styles.goalTitleContainer}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            {goal.description ? (
              <Text style={styles.goalDescription} numberOfLines={2}>
                {goal.description}
              </Text>
            ) : null}
          </View>
          {isCompleted && (
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          )}
        </View>

        {renderProgressBar(progress)}

        <View style={styles.goalActions}>
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => {
              Alert.prompt(
                'Update Progress',
                `Current: ${progress.current} / ${progress.target} ${goal.unit}`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Update',
                    onPress: (value) => {
                      const newProgress = parseFloat(value) || 0;
                      updateGoalProgress(goal.id, newProgress);
                    },
                  },
                ],
                'plain-text',
                progress.current.toString()
              );
            }}
          >
            <Ionicons name="create-outline" size={16} color="#6366f1" />
            <Text style={styles.updateButtonText}>Update</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Goals & Challenges</Text>
        <TouchableOpacity
          style={styles.achievementsButton}
          onPress={() => {
            // Show achievements modal
            Alert.alert(
              'Achievements',
              `You have ${achievements.length} achievement${achievements.length !== 1 ? 's' : ''}!`,
              [{ text: 'OK' }]
            );
          }}
        >
          <Ionicons name="trophy" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Available
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my-goals' && styles.activeTab]}
          onPress={() => setActiveTab('my-goals')}
        >
          <Text style={[styles.tabText, activeTab === 'my-goals' && styles.activeTabText]}>
            My Goals
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && activeTab === 'active' ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : (
          <>
            {activeTab === 'active' && (
              <>
                {activeChallenges.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="flag-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>No active challenges</Text>
                    <Text style={styles.emptySubtext}>
                      Join a challenge to get started!
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyButton}
                      onPress={() => setActiveTab('available')}
                    >
                      <Text style={styles.emptyButtonText}>Browse Challenges</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  activeChallenges.map((challenge) => renderChallengeCard(challenge, true))
                )}
              </>
            )}

            {activeTab === 'available' && (
              <>
                {availableChallenges.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="checkmark-circle-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>No available challenges</Text>
                    <Text style={styles.emptySubtext}>
                      You've joined all available challenges!
                    </Text>
                  </View>
                ) : (
                  availableChallenges.map((challenge) => renderChallengeCard(challenge, false))
                )}
              </>
            )}

            {activeTab === 'completed' && (
              <>
                {completedChallenges.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="trophy-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>No completed challenges</Text>
                    <Text style={styles.emptySubtext}>
                      Complete challenges to see them here!
                    </Text>
                  </View>
                ) : (
                  completedChallenges.map((challenge) => renderChallengeCard(challenge, true))
                )}
              </>
            )}

            {activeTab === 'my-goals' && (
              <>
                <TouchableOpacity
                  style={styles.createGoalButton}
                  onPress={() => setShowCreateModal(true)}
                >
                  <Ionicons name="add-circle" size={24} color="#6366f1" />
                  <Text style={styles.createGoalButtonText}>Create Custom Goal</Text>
                </TouchableOpacity>

                {myGoals.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="target-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>No personal goals</Text>
                    <Text style={styles.emptySubtext}>
                      Create a custom goal to track your progress!
                    </Text>
                  </View>
                ) : (
                  myGoals.map((goal) => renderGoalCard(goal))
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Create Goal Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Custom Goal</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Goal Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Read 5 books this year"
                value={newGoal.title}
                onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your goal..."
                multiline
                numberOfLines={3}
                value={newGoal.description}
                onChangeText={(text) => setNewGoal({ ...newGoal, description: text })}
              />

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryButtons}>
                {Object.entries(CHALLENGE_CATEGORIES).map(([key, category]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.categoryButton,
                      newGoal.category === key && styles.categoryButtonActive,
                    ]}
                    onPress={() => setNewGoal({ ...newGoal, category: key })}
                  >
                    <Ionicons
                      name={category.icon}
                      size={20}
                      color={newGoal.category === key ? '#fff' : category.color}
                    />
                    <Text
                      style={[
                        styles.categoryButtonText,
                        newGoal.category === key && styles.categoryButtonTextActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Target *</Text>
              <View style={styles.targetInputContainer}>
                <TextInput
                  style={[styles.input, styles.targetInput]}
                  placeholder="10"
                  keyboardType="numeric"
                  value={newGoal.target}
                  onChangeText={(text) => setNewGoal({ ...newGoal, target: text })}
                />
                <TextInput
                  style={[styles.input, styles.unitInput]}
                  placeholder="times"
                  value={newGoal.unit}
                  onChangeText={(text) => setNewGoal({ ...newGoal, unit: text })}
                />
              </View>

              <TouchableOpacity
                style={styles.createButton}
                onPress={createCustomGoal}
              >
                <Text style={styles.createButtonText}>Create Goal</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Challenge Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedChallenge && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedChallenge.title || selectedChallenge.challengeData?.title}
                  </Text>
                  <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <Text style={styles.detailDescription}>
                    {selectedChallenge.description || selectedChallenge.challengeData?.description}
                  </Text>

                  {selectedChallenge.progress && (
                    <>
                      {renderProgressBar(selectedChallenge.progress)}
                      <View style={styles.detailActions}>
                        <TouchableOpacity
                          style={styles.shareButton}
                          onPress={() => shareProgress(selectedChallenge)}
                        >
                          <Ionicons name="share-outline" size={20} color="#6366f1" />
                          <Text style={styles.shareButtonText}>Share Progress</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </ScrollView>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  achievementsButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  challengeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  challengeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  challengeTitleContainer: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  progressBarContainer: {
    marginVertical: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  challengeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  challengeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeMetaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginLeft: 4,
  },
  difficultyBadge: {
    backgroundColor: '#f59e0b20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  createGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderStyle: 'dashed',
  },
  createGoalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 8,
  },
  goalCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  goalActions: {
    marginTop: 12,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#6366f120',
    borderRadius: 8,
  },
  updateButtonText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  targetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetInput: {
    flex: 1,
    marginRight: 8,
  },
  unitInput: {
    width: 100,
  },
  createButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  detailDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  detailActions: {
    marginTop: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#6366f120',
    borderRadius: 8,
  },
  shareButtonText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 8,
  },
});

