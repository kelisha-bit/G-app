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
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { fetchBibleVerse, isValidVerseReference, fetchBibleChapter } from '../utils/bibleApi';
import { auth, db } from '../../firebase.config';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const BIBLE_BOOKS = [
  { name: 'Genesis', chapters: 50 },
  { name: 'Exodus', chapters: 40 },
  { name: 'Leviticus', chapters: 27 },
  { name: 'Numbers', chapters: 36 },
  { name: 'Deuteronomy', chapters: 34 },
  { name: 'Joshua', chapters: 24 },
  { name: 'Judges', chapters: 21 },
  { name: 'Ruth', chapters: 4 },
  { name: '1 Samuel', chapters: 31 },
  { name: '2 Samuel', chapters: 24 },
  { name: '1 Kings', chapters: 22 },
  { name: '2 Kings', chapters: 25 },
  { name: '1 Chronicles', chapters: 29 },
  { name: '2 Chronicles', chapters: 36 },
  { name: 'Ezra', chapters: 10 },
  { name: 'Nehemiah', chapters: 13 },
  { name: 'Esther', chapters: 10 },
  { name: 'Job', chapters: 42 },
  { name: 'Psalm', chapters: 150 },
  { name: 'Proverbs', chapters: 31 },
  { name: 'Ecclesiastes', chapters: 12 },
  { name: 'Song of Solomon', chapters: 8 },
  { name: 'Isaiah', chapters: 66 },
  { name: 'Jeremiah', chapters: 52 },
  { name: 'Lamentations', chapters: 5 },
  { name: 'Ezekiel', chapters: 48 },
  { name: 'Daniel', chapters: 12 },
  { name: 'Hosea', chapters: 14 },
  { name: 'Joel', chapters: 2 },
  { name: 'Amos', chapters: 9 },
  { name: 'Obadiah', chapters: 1 },
  { name: 'Jonah', chapters: 4 },
  { name: 'Micah', chapters: 7 },
  { name: 'Nahum', chapters: 3 },
  { name: 'Habakkuk', chapters: 3 },
  { name: 'Zephaniah', chapters: 3 },
  { name: 'Haggai', chapters: 2 },
  { name: 'Zechariah', chapters: 14 },
  { name: 'Malachi', chapters: 4 },
  { name: 'Matthew', chapters: 28 },
  { name: 'Mark', chapters: 16 },
  { name: 'Luke', chapters: 24 },
  { name: 'John', chapters: 21 },
  { name: 'Acts', chapters: 28 },
  { name: 'Romans', chapters: 16 },
  { name: '1 Corinthians', chapters: 16 },
  { name: '2 Corinthians', chapters: 13 },
  { name: 'Galatians', chapters: 6 },
  { name: 'Ephesians', chapters: 6 },
  { name: 'Philippians', chapters: 4 },
  { name: 'Colossians', chapters: 4 },
  { name: '1 Thessalonians', chapters: 5 },
  { name: '2 Thessalonians', chapters: 3 },
  { name: '1 Timothy', chapters: 6 },
  { name: '2 Timothy', chapters: 4 },
  { name: 'Titus', chapters: 3 },
  { name: 'Philemon', chapters: 1 },
  { name: 'Hebrews', chapters: 13 },
  { name: 'James', chapters: 5 },
  { name: '1 Peter', chapters: 5 },
  { name: '2 Peter', chapters: 3 },
  { name: '1 John', chapters: 5 },
  { name: '2 John', chapters: 1 },
  { name: '3 John', chapters: 1 },
  { name: 'Jude', chapters: 1 },
  { name: 'Revelation', chapters: 22 },
];

const READING_PLANS = [
  { id: '365', name: 'Bible in a Year', description: 'Read through the entire Bible in 365 days', days: 365 },
  { id: 'new-testament', name: 'New Testament', description: 'Read through the New Testament in 90 days', days: 90 },
  { id: 'psalms', name: 'Psalms & Proverbs', description: 'Read through Psalms and Proverbs in 60 days', days: 60 },
  { id: 'gospels', name: 'The Gospels', description: 'Read through Matthew, Mark, Luke, and John in 30 days', days: 30 },
];

// Helper function to calculate days since start date
const calculateDaysSinceStart = (startDate) => {
  const start = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  const diffTime = today - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays + 1); // +1 because day 1 is the start date
};

// Generate reading assignments for each plan type
const getReadingAssignment = (planId, day) => {
  const assignments = {
    '365': () => {
      // Bible in a Year - distribute books across 365 days
      const books = BIBLE_BOOKS;
      const totalChapters = books.reduce((sum, book) => sum + book.chapters, 0);
      const chaptersPerDay = totalChapters / 365;
      let currentChapter = Math.floor((day - 1) * chaptersPerDay);
      
      for (const book of books) {
        if (currentChapter < book.chapters) {
          const chapter = Math.floor(currentChapter) + 1;
          return `${book.name} ${chapter}`;
        }
        currentChapter -= book.chapters;
      }
      return 'Revelation 22'; // Fallback
    },
    'new-testament': () => {
      // New Testament books (Matthew to Revelation)
      const ntBooks = BIBLE_BOOKS.slice(39); // Starting from Matthew
      const totalChapters = ntBooks.reduce((sum, book) => sum + book.chapters, 0);
      const chaptersPerDay = totalChapters / 90;
      let currentChapter = Math.floor((day - 1) * chaptersPerDay);
      
      for (const book of ntBooks) {
        if (currentChapter < book.chapters) {
          const chapter = Math.floor(currentChapter) + 1;
          return `${book.name} ${chapter}`;
        }
        currentChapter -= book.chapters;
      }
      return 'Revelation 22';
    },
    'psalms': () => {
      // Psalms and Proverbs - alternate or distribute
      if (day <= 60) {
        if (day <= 30) {
          // First 30 days: Psalms
          const psalmsPerDay = 150 / 30;
          const psalm = Math.floor((day - 1) * psalmsPerDay) + 1;
          return `Psalm ${psalm}`;
        } else {
          // Next 30 days: Proverbs
          const proverbsPerDay = 31 / 30;
          const proverb = Math.floor((day - 31) * proverbsPerDay) + 1;
          return `Proverbs ${proverb}`;
        }
      }
      return 'Proverbs 31';
    },
    'gospels': () => {
      // The Gospels - Matthew, Mark, Luke, John
      const gospels = [
        { name: 'Matthew', chapters: 28 },
        { name: 'Mark', chapters: 16 },
        { name: 'Luke', chapters: 24 },
        { name: 'John', chapters: 21 },
      ];
      const totalChapters = gospels.reduce((sum, book) => sum + book.chapters, 0);
      const chaptersPerDay = totalChapters / 30;
      let currentChapter = Math.floor((day - 1) * chaptersPerDay);
      
      for (const book of gospels) {
        if (currentChapter < book.chapters) {
          const chapter = Math.floor(currentChapter) + 1;
          return `${book.name} ${chapter}`;
        }
        currentChapter -= book.chapters;
      }
      return 'John 21';
    },
  };
  
  const generator = assignments[planId];
  return generator ? generator() : `Day ${day} Reading`;
};

export default function BibleScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('verse'); // verse, search, plans, bookmarks
  const [verseOfTheDay, setVerseOfTheDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [readingPlans, setReadingPlans] = useState({});
  const [chapterModalVisible, setChapterModalVisible] = useState(false);
  const [chapterVerses, setChapterVerses] = useState([]);
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [chapterViewVisible, setChapterViewVisible] = useState(false);
  const [todayReading, setTodayReading] = useState(null);
  const [todayReadingLoading, setTodayReadingLoading] = useState(false);

  useEffect(() => {
    loadVerseOfTheDay();
    loadBookmarks();
    loadReadingPlans();
  }, []);

  // Auto-update reading plans when component mounts or when active tab changes
  useEffect(() => {
    if (activeTab === 'plans') {
      autoUpdateReadingPlans();
      loadTodayReading();
    }
  }, [activeTab]);

  // Reload today's reading when reading plans change
  useEffect(() => {
    if (activeTab === 'plans' && Object.keys(readingPlans).length > 0) {
      loadTodayReading();
    }
  }, [readingPlans]);

  const loadVerseOfTheDay = async () => {
    try {
      setLoading(true);
      // Get verse based on day of year (1-365)
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
      const verses = [
        'John 3:16',
        'Jeremiah 29:11',
        'Philippians 4:13',
        'Romans 8:28',
        'Proverbs 3:5-6',
        'Isaiah 40:31',
        'Matthew 28:20',
        'Psalm 23:1',
        '1 Corinthians 13:4-7',
        'Ephesians 2:8-9',
      ];
      const verseRef = verses[dayOfYear % verses.length];
      
      const result = await fetchBibleVerse(verseRef);
      if (result && !result.error) {
        setVerseOfTheDay(result);
      } else {
        // If there's an error, set verseOfTheDay to null so error state shows
        setVerseOfTheDay(null);
        console.error('Failed to load verse:', result?.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error loading verse of the day:', error);
      setVerseOfTheDay(null);
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarks = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setBookmarks(userData.bibleBookmarks || []);
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  const loadReadingPlans = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const plans = userData.readingPlans || {};
        
        // Normalize daysCompleted and auto-calculate current day
        const normalizedPlans = {};
        Object.keys(plans).forEach(planId => {
          const plan = plans[planId];
          const daysCompleted = Array.isArray(plan.daysCompleted) 
            ? plan.daysCompleted 
            : (plan.daysCompleted ? [plan.daysCompleted] : []);
          
          // Auto-calculate current day based on start date
          let currentDay = plan.currentDay || 1;
          if (plan.startDate) {
            const calculatedDay = calculateDaysSinceStart(plan.startDate);
            // Only auto-advance if calculated day is ahead of stored current day
            if (calculatedDay > currentDay && calculatedDay <= plan.totalDays) {
              currentDay = calculatedDay;
            }
          }
          
          normalizedPlans[planId] = {
            ...plan,
            daysCompleted,
            currentDay, // Auto-updated current day
          };
        });
        
        setReadingPlans(normalizedPlans);
      }
    } catch (error) {
      console.error('Error loading reading plans:', error);
    }
  };

  // Auto-update reading plans with current day
  const autoUpdateReadingPlans = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const updatedPlans = { ...readingPlans };
      let needsUpdate = false;

      Object.keys(updatedPlans).forEach(planId => {
        const plan = updatedPlans[planId];
        if (plan.startDate) {
          const calculatedDay = calculateDaysSinceStart(plan.startDate);
          if (calculatedDay !== plan.currentDay && calculatedDay <= plan.totalDays) {
            updatedPlans[planId] = {
              ...plan,
              currentDay: calculatedDay,
            };
            needsUpdate = true;
          }
        }
      });

      if (needsUpdate) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          readingPlans: updatedPlans,
        });
        setReadingPlans(updatedPlans);
      }
    } catch (error) {
      console.error('Error auto-updating reading plans:', error);
    }
  };

  // Load today's reading assignment
  const loadTodayReading = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setTodayReading(null);
        return;
      }

      // Find the first active plan
      const activePlans = Object.values(readingPlans).filter(
        plan => plan.startDate && plan.currentDay <= plan.totalDays
      );

      if (activePlans.length === 0) {
        setTodayReading(null);
        return;
      }

      // Use the first active plan (or could prioritize by plan type)
      const activePlan = activePlans[0];
      const planInfo = READING_PLANS.find(p => p.id === activePlan.planId);
      
      if (!planInfo) {
        setTodayReading(null);
        return;
      }

      const todayDay = activePlan.currentDay;
      const readingAssignment = getReadingAssignment(activePlan.planId, todayDay);
      
      setTodayReadingLoading(true);
      
      // Try to fetch the reading
      try {
        const result = await fetchBibleChapter(
          readingAssignment.split(' ')[0], 
          parseInt(readingAssignment.split(' ')[1])
        );
        
        setTodayReading({
          plan: planInfo,
          day: todayDay,
          totalDays: activePlan.totalDays,
          assignment: readingAssignment,
          content: result,
          planId: activePlan.planId,
        });
      } catch (error) {
        // If chapter fetch fails, still show the assignment
        setTodayReading({
          plan: planInfo,
          day: todayDay,
          totalDays: activePlan.totalDays,
          assignment: readingAssignment,
          content: null,
          planId: activePlan.planId,
        });
      }
    } catch (error) {
      console.error('Error loading today reading:', error);
      setTodayReading(null);
    } finally {
      setTodayReadingLoading(false);
    }
  };

  const startReadingPlan = async (plan) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Login Required', 'Please login to start a reading plan');
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      const planData = {
        planId: plan.id,
        planName: plan.name,
        startDate: new Date().toISOString(),
        daysCompleted: [],
        currentDay: 1,
        totalDays: plan.days,
      };

      await updateDoc(userRef, {
        readingPlans: {
          ...readingPlans,
          [plan.id]: planData,
        },
      });

      setReadingPlans({
        ...readingPlans,
        [plan.id]: planData,
      });

      // Load today's reading immediately
      await loadTodayReading();

      Alert.alert('Success', `Started ${plan.name}! Your reading plan will automatically advance each day.`);
    } catch (error) {
      console.error('Error starting reading plan:', error);
      Alert.alert('Error', 'Failed to start reading plan. Please try again.');
    }
  };

  const markDayComplete = async (planId, day) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const plan = readingPlans[planId];
      
      if (!plan) return;

      // Ensure daysCompleted is always an array
      const daysCompleted = Array.isArray(plan.daysCompleted) 
        ? plan.daysCompleted 
        : (plan.daysCompleted ? [plan.daysCompleted] : []);
      
      if (daysCompleted.includes(day)) {
        // Unmark if already completed
        const updatedDays = daysCompleted.filter(d => d !== day);
        await updateDoc(userRef, {
          [`readingPlans.${planId}.daysCompleted`]: updatedDays,
        });
        setReadingPlans({
          ...readingPlans,
          [planId]: {
            ...plan,
            daysCompleted: updatedDays,
          },
        });
      } else {
        // Mark as complete
        const updatedDays = [...daysCompleted, day].sort((a, b) => a - b);
        await updateDoc(userRef, {
          [`readingPlans.${planId}.daysCompleted`]: updatedDays,
        });
        setReadingPlans({
          ...readingPlans,
          [planId]: {
            ...plan,
            daysCompleted: updatedDays,
          },
        });
        
        // If marking today's reading as complete, refresh today's reading
        if (day === plan.currentDay) {
          setTimeout(() => loadTodayReading(), 500);
        }
      }
    } catch (error) {
      console.error('Error marking day complete:', error);
      Alert.alert('Error', 'Failed to update progress');
    }
  };

  // Mark today's reading as complete
  const markTodayComplete = async () => {
    if (!todayReading) return;
    await markDayComplete(todayReading.planId, todayReading.day);
  };

  const loadChapter = async (bookName, chapter) => {
    try {
      setLoadingChapter(true);
      setSelectedChapter(chapter);
      
      // Helper function to delay between requests
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Strategy 1: Try to fetch the entire chapter using the utility function
      // This tries multiple approaches (full chapter, then range)
      let result = await fetchBibleChapter(bookName, chapter);
      
      if (result && !result.error && result.text) {
        // Check if we have a verses array with individual verse numbers
        if (result.verses && Array.isArray(result.verses) && result.verses.length > 0) {
          // Use the verses array from the API which includes verse numbers
          const verses = result.verses.map((v, idx) => {
            // Extract verse number from various possible property names
            const verseNum = v.verse !== undefined ? v.verse : 
                           (v.verse_number !== undefined ? v.verse_number : 
                           (v.verseNum !== undefined ? v.verseNum : idx + 1));
            return {
              verse: typeof verseNum === 'number' ? verseNum : parseInt(verseNum) || (idx + 1),
              text: v.text || '',
              reference: result.reference,
            };
          });
          setChapterVerses(verses);
        } else {
          // Fallback: if no verses array, try to parse the text or use individual verse fetching
          // For now, we'll still try individual verses as fallback
          const verses = [];
          const maxIndividualVerses = 50;
          
          for (let verse = 1; verse <= maxIndividualVerses; verse++) {
            if (verse > 1) {
              await delay(300); // Shorter delay for fallback
            }
            
            try {
              const reference = `${bookName} ${chapter}:${verse}`;
              const verseResult = await fetchBibleVerse(reference);
              
              if (verseResult && !verseResult.error && verseResult.text) {
                verses.push({
                  verse: verse,
                  text: verseResult.text,
                  reference: verseResult.reference,
                });
              } else {
                break; // End of chapter
              }
            } catch (error) {
              console.error(`Error loading verse ${verse}:`, error);
              break;
            }
          }
          
          if (verses.length > 0) {
            setChapterVerses(verses);
          } else {
            // Last resort: show the full chapter text
            setChapterVerses([{
              verse: 0,
              text: result.text,
              reference: result.reference,
            }]);
          }
        }
        setChapterViewVisible(true);
        setBookModalVisible(false);
        setLoadingChapter(false);
        return;
      }

      // Strategy 2: Fallback - fetch individual verses with delays (limited to avoid rate limits)
      // Only fetch first 10 verses to avoid hitting rate limits
      const verses = [];
      const maxIndividualVerses = 10;
      
      for (let verse = 1; verse <= maxIndividualVerses; verse++) {
        // Add delay between requests to avoid rate limiting
        if (verse > 1) {
          await delay(800); // 800ms delay between requests to be safer
        }
        
        try {
          const reference = `${bookName} ${chapter}:${verse}`;
          const verseResult = await fetchBibleVerse(reference);
          
          if (verseResult && !verseResult.error && verseResult.text) {
            verses.push({
              verse: verse,
              text: verseResult.text,
              reference: verseResult.reference,
            });
          } else {
            // Check if it's a rate limit error
            if (verseResult?.error?.includes('Too many requests') || verseResult?.error?.includes('rate')) {
              Alert.alert(
                'Rate Limit Reached',
                'Too many requests. Please wait 30-60 seconds before trying again.',
                [{ text: 'OK' }]
              );
              setChapterVerses(verses.length > 0 ? verses : []);
              setLoadingChapter(false);
              return;
            }
            // Otherwise, assume end of chapter
            break;
          }
        } catch (error) {
          console.error(`Error loading verse ${verse}:`, error);
          if (error.message?.includes('429') || error.message?.includes('rate')) {
            Alert.alert(
              'Rate Limit Reached',
              'Too many requests. Please wait 30-60 seconds before trying again.',
              [{ text: 'OK' }]
            );
            break;
          }
          // Continue to next verse or stop if we have some verses
          if (verses.length === 0) break;
        }
      }

      if (verses.length > 0) {
        setChapterVerses(verses);
        setChapterViewVisible(true);
        setBookModalVisible(false);
      } else {
        setChapterVerses([]);
        Alert.alert(
          'Unable to Load Chapter',
          'Could not load this chapter. This might be due to rate limiting. Please wait 30-60 seconds and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error loading chapter:', error);
      const isRateLimit = error.message?.includes('429') || error.message?.includes('rate');
      Alert.alert(
        'Error',
        isRateLimit
          ? 'Too many requests. Please wait 30-60 seconds before trying again.'
          : 'Failed to load chapter. Please try again.'
      );
      setChapterVerses([]);
    } finally {
      setLoadingChapter(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a verse reference');
      return;
    }

    if (!isValidVerseReference(searchQuery)) {
      Alert.alert('Invalid Format', 'Please use format like "John 3:16" or "Psalm 23:1-3"');
      return;
    }

    try {
      setSearching(true);
      const result = await fetchBibleVerse(searchQuery);
      setSearchResult(result);
    } catch (error) {
      console.error('Error searching verse:', error);
      Alert.alert('Error', 'Failed to fetch verse. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const toggleBookmark = async (verse) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Login Required', 'Please login to bookmark verses');
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const currentBookmarks = userDoc.exists() ? (userDoc.data().bibleBookmarks || []) : [];
      
      const isBookmarked = currentBookmarks.some(b => b.reference === verse.reference);
      
      if (isBookmarked) {
        await updateDoc(userRef, {
          bibleBookmarks: arrayRemove(verse),
        });
        setBookmarks(bookmarks.filter(b => b.reference !== verse.reference));
        Alert.alert('Success', 'Verse removed from bookmarks');
      } else {
        await updateDoc(userRef, {
          bibleBookmarks: arrayUnion(verse),
        });
        setBookmarks([...bookmarks, verse]);
        Alert.alert('Success', 'Verse bookmarked');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      Alert.alert('Error', 'Failed to update bookmark');
    }
  };

  const shareVerse = async (verse) => {
    try {
      await Share.share({
        message: `"${verse.text}"\n\n- ${verse.reference}`,
        title: 'Bible Verse',
      });
    } catch (error) {
      console.error('Error sharing verse:', error);
    }
  };

  const isBookmarked = (reference) => {
    return bookmarks.some(b => b.reference === reference);
  };

  const renderVerseCard = (verse, showActions = true) => {
    if (!verse || verse.error) {
      return (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={24} color="#ef4444" />
          <Text style={styles.errorText}>
            {verse?.error || 'Verse not found'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.verseCard}>
        <Text style={styles.verseText}>{verse.text}</Text>
        <Text style={styles.verseReference}>- {verse.reference}</Text>
        {showActions && (
          <View style={styles.verseActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => toggleBookmark(verse)}
            >
              <Ionicons
                name={isBookmarked(verse.reference) ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isBookmarked(verse.reference) ? '#6366f1' : '#6b7280'}
              />
              <Text style={styles.actionText}>Bookmark</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => shareVerse(verse)}
            >
              <Ionicons name="share-outline" size={20} color="#6b7280" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderVerseOfTheDay = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="sunny-outline" size={24} color="#f59e0b" />
          <Text style={styles.sectionTitle}>Verse of the Day</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
        ) : verseOfTheDay ? (
          renderVerseCard(verseOfTheDay)
        ) : (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={24} color="#ef4444" />
            <Text style={styles.errorText}>
              Failed to load verse of the day. Please check your internet connection and try again.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadVerseOfTheDay}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.quickAccessGrid}>
          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => setActiveTab('search')}
          >
            <Ionicons name="search" size={28} color="#6366f1" />
            <Text style={styles.quickAccessText}>Search Verse</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => setActiveTab('bookmarks')}
          >
            <Ionicons name="bookmark" size={28} color="#8b5cf6" />
            <Text style={styles.quickAccessText}>Bookmarks</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => setActiveTab('plans')}
          >
            <Ionicons name="calendar" size={28} color="#10b981" />
            <Text style={styles.quickAccessText}>Reading Plans</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => setBookModalVisible(true)}
          >
            <Ionicons name="book" size={28} color="#ef4444" />
            <Text style={styles.quickAccessText}>Browse Bible</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => navigation.navigate('GoalsChallenges')}
          >
            <Ionicons name="flag" size={28} color="#f59e0b" />
            <Text style={styles.quickAccessText}>Challenges</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderSearch = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter verse (e.g., John 3:16)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={searching}
          >
            {searching ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="search" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.searchHint}>
          Examples: "John 3:16", "Psalm 23:1-3", "1 Corinthians 13:4"
        </Text>
      </View>

      {searchResult && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Result</Text>
          {renderVerseCard(searchResult)}
        </View>
      )}
    </ScrollView>
  );

  const renderReadingPlans = () => {
    const getPlanProgress = (planId) => {
      const plan = readingPlans[planId];
      if (!plan) return null;
      const daysCompleted = plan.daysCompleted || [];
      const progress = (daysCompleted.length / plan.totalDays) * 100;
      return {
        ...plan,
        progress: Math.round(progress),
        daysCompletedCount: daysCompleted.length, // Keep count separate
        daysCompletedArray: daysCompleted, // Keep the array for checking
      };
    };

    const isTodayCompleted = todayReading && readingPlans[todayReading.planId]?.daysCompleted?.includes(todayReading.day);

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Today's Reading Section */}
        {todayReading && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={24} color="#6366f1" />
              <Text style={styles.sectionTitle}>Today's Reading</Text>
            </View>
            <View style={styles.todayReadingCard}>
              <View style={styles.todayReadingHeader}>
                <View>
                  <Text style={styles.todayReadingPlan}>{todayReading.plan.name}</Text>
                  <Text style={styles.todayReadingDay}>Day {todayReading.day} of {todayReading.totalDays}</Text>
                </View>
                {isTodayCompleted && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  </View>
                )}
              </View>
              <View style={styles.todayReadingAssignment}>
                <Ionicons name="book" size={20} color="#6366f1" />
                <Text style={styles.todayReadingText}>{todayReading.assignment}</Text>
              </View>
              {todayReading.content && todayReading.content.text && (
                <View style={styles.todayReadingPreview}>
                  <Text style={styles.todayReadingPreviewText} numberOfLines={3}>
                    {todayReading.content.text}
                  </Text>
                </View>
              )}
              <View style={styles.todayReadingActions}>
                <TouchableOpacity
                  style={[styles.todayActionButton, isTodayCompleted && styles.todayActionButtonCompleted]}
                  onPress={markTodayComplete}
                >
                  <Ionicons 
                    name={isTodayCompleted ? "checkmark-circle" : "checkmark-circle-outline"} 
                    size={20} 
                    color={isTodayCompleted ? "#fff" : "#6366f1"} 
                  />
                  <Text style={[styles.todayActionText, isTodayCompleted && styles.todayActionTextCompleted]}>
                    {isTodayCompleted ? 'Completed' : 'Mark Complete'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.todayActionButton, styles.todayActionButtonSecondary]}
                  onPress={() => {
                    const [book, chapter] = todayReading.assignment.split(' ');
                    loadChapter(book, parseInt(chapter));
                  }}
                >
                  <Ionicons name="book-outline" size={20} color="#6366f1" />
                  <Text style={styles.todayActionText}>Read Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reading Plans</Text>
          <Text style={styles.sectionDescription}>
            {todayReading 
              ? 'Your reading plan automatically advances each day. Start a new plan to read multiple books.'
              : 'Choose a reading plan to guide your daily Bible reading. Plans automatically advance each day.'}
          </Text>
        </View>

        {READING_PLANS.map((plan) => {
          const progress = getPlanProgress(plan.id);
          const isActive = progress !== null;

          return (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, isActive && styles.planCardActive]}
              onPress={() => {
                if (isActive) {
                  // Show progress modal - keep the full plan data with array
                  const fullPlan = readingPlans[plan.id];
                  setSelectedPlan({ 
                    ...plan, 
                    ...fullPlan, // Include the full plan data with daysCompleted array
                    progress: progress.progress,
                    daysCompletedCount: progress.daysCompletedCount,
                  });
                  setChapterModalVisible(true);
                } else {
                  // Start new plan
                  Alert.alert(
                    plan.name,
                    `${plan.description}\n\nThis plan will help you read through ${plan.days} days of Bible reading.`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Start Plan', onPress: () => startReadingPlan(plan) },
                    ]
                  );
                }
              }}
            >
              <View style={styles.planHeader}>
                <Ionicons 
                  name={isActive ? "checkmark-circle" : "calendar-outline"} 
                  size={24} 
                  color={isActive ? "#10b981" : "#6366f1"} 
                />
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planDescription}>{plan.description}</Text>
                  {isActive && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[styles.progressFill, { width: `${progress.progress}%` }]} 
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {progress.daysCompletedCount} of {plan.days} days ({progress.progress}%)
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.planFooter}>
                <Text style={styles.planDays}>{plan.days} days</Text>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderBookmarks = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bookmarked Verses</Text>
        {bookmarks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No bookmarked verses yet</Text>
            <Text style={styles.emptySubtext}>
              Bookmark verses you want to remember
            </Text>
          </View>
        ) : (
          bookmarks.map((bookmark, index) => (
            <View key={index} style={styles.bookmarkCard}>
              {renderVerseCard(bookmark, true)}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bible</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'verse' && styles.tabActive]}
          onPress={() => setActiveTab('verse')}
        >
          <Ionicons
            name="sunny"
            size={20}
            color={activeTab === 'verse' ? '#6366f1' : '#6b7280'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'verse' && styles.tabTextActive,
            ]}
          >
            Verse
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.tabActive]}
          onPress={() => setActiveTab('search')}
        >
          <Ionicons
            name="search"
            size={20}
            color={activeTab === 'search' ? '#6366f1' : '#6b7280'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'search' && styles.tabTextActive,
            ]}
          >
            Search
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'plans' && styles.tabActive]}
          onPress={() => setActiveTab('plans')}
        >
          <Ionicons
            name="calendar"
            size={20}
            color={activeTab === 'plans' ? '#6366f1' : '#6b7280'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'plans' && styles.tabTextActive,
            ]}
          >
            Plans
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bookmarks' && styles.tabActive]}
          onPress={() => setActiveTab('bookmarks')}
        >
          <Ionicons
            name="bookmark"
            size={20}
            color={activeTab === 'bookmarks' ? '#6366f1' : '#6b7280'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'bookmarks' && styles.tabTextActive,
            ]}
          >
            Saved
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'verse' && renderVerseOfTheDay()}
      {activeTab === 'search' && renderSearch()}
      {activeTab === 'plans' && renderReadingPlans()}
      {activeTab === 'bookmarks' && renderBookmarks()}

      {/* Book Selection Modal */}
      <Modal
        visible={bookModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setBookModalVisible(false);
          setSelectedBook(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedBook ? `${selectedBook.name} - Select Chapter` : 'Select Book'}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  if (selectedBook) {
                    setSelectedBook(null);
                  } else {
                    setBookModalVisible(false);
                  }
                }}
              >
                <Ionicons name={selectedBook ? "arrow-back" : "close"} size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {!selectedBook ? (
                <View style={styles.booksGrid}>
                  {BIBLE_BOOKS.map((book) => (
                    <TouchableOpacity
                      key={book.name}
                      style={styles.bookCard}
                      onPress={() => setSelectedBook(book)}
                    >
                      <Text style={styles.bookName}>{book.name}</Text>
                      <Text style={styles.bookChapters}>{book.chapters} chapters</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.chaptersGrid}>
                  {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((chapter) => (
                    <TouchableOpacity
                      key={chapter}
                      style={styles.chapterCard}
                      onPress={() => {
                        // Show confirmation before loading
                        Alert.alert(
                          'Load Chapter',
                          `Load ${selectedBook.name} Chapter ${chapter}?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Load', 
                              onPress: () => loadChapter(selectedBook.name, chapter)
                            },
                          ]
                        );
                      }}
                      disabled={loadingChapter}
                    >
                      <Text style={styles.chapterNumber}>{chapter}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {loadingChapter && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#6366f1" />
                  <Text style={styles.loadingText}>Loading chapter...</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Chapter View Modal */}
      <Modal
        visible={chapterViewVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChapterViewVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedBook ? `${selectedBook.name} ${selectedChapter}` : 'Chapter'}
              </Text>
              <TouchableOpacity onPress={() => setChapterViewVisible(false)}>
                <Ionicons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.chapterScrollView}>
              {chapterVerses.length > 0 ? (
                chapterVerses.map((verse, index) => (
                  <View key={index} style={styles.verseInChapter}>
                    {verse.verse > 0 && (
                      <Text style={styles.verseNumber}>{verse.verse}</Text>
                    )}
                    <Text style={styles.verseTextInChapter}>{verse.text}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="book-outline" size={48} color="#9ca3af" />
                  <Text style={styles.emptyText}>No verses found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Reading Plan Progress Modal */}
      <Modal
        visible={chapterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChapterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedPlan ? selectedPlan.planName : 'Reading Plan Progress'}
              </Text>
              <TouchableOpacity onPress={() => setChapterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {selectedPlan && (
                <View style={styles.progressModalContent}>
                  <View style={styles.progressStats}>
                    <View style={styles.statCard}>
                      <Text style={styles.statValue}>
                        {(selectedPlan.daysCompleted && Array.isArray(selectedPlan.daysCompleted) 
                          ? selectedPlan.daysCompleted.length 
                          : selectedPlan.daysCompletedCount) || 0}
                      </Text>
                      <Text style={styles.statLabel}>Days Completed</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statValue}>
                        {selectedPlan.totalDays - ((selectedPlan.daysCompleted && Array.isArray(selectedPlan.daysCompleted) 
                          ? selectedPlan.daysCompleted.length 
                          : selectedPlan.daysCompletedCount) || 0)}
                      </Text>
                      <Text style={styles.statLabel}>Days Remaining</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statValue}>{selectedPlan.progress || 0}%</Text>
                      <Text style={styles.statLabel}>Progress</Text>
                    </View>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[styles.progressFill, { width: `${selectedPlan.progress || 0}%` }]} 
                    />
                  </View>
                  <Text style={styles.sectionTitle}>Mark Days Complete</Text>
                  <View style={styles.daysGrid}>
                    {Array.from({ length: Math.min(selectedPlan.totalDays, 30) }, (_, i) => i + 1).map((day) => {
                      const daysCompletedArray = selectedPlan.daysCompleted && Array.isArray(selectedPlan.daysCompleted) 
                        ? selectedPlan.daysCompleted 
                        : [];
                      const isCompleted = daysCompletedArray.includes(day);
                      return (
                        <TouchableOpacity
                          key={day}
                          style={[styles.dayCard, isCompleted && styles.dayCardCompleted]}
                          onPress={async () => {
                            await markDayComplete(selectedPlan.planId, day);
                            // Refresh selectedPlan to reflect the update
                            const updatedPlan = readingPlans[selectedPlan.planId];
                            if (updatedPlan) {
                              const daysCompleted = updatedPlan.daysCompleted || [];
                              const progress = Math.round((daysCompleted.length / selectedPlan.totalDays) * 100);
                              setSelectedPlan({
                                ...selectedPlan,
                                ...updatedPlan,
                                progress: progress,
                                daysCompletedCount: daysCompleted.length,
                              });
                            }
                          }}
                        >
                          <Text style={[styles.dayNumber, isCompleted && styles.dayNumberCompleted]}>
                            {day}
                          </Text>
                          {isCompleted && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {selectedPlan.totalDays > 30 && (
                    <Text style={styles.moreDaysText}>
                      ... and {selectedPlan.totalDays - 30} more days
                    </Text>
                  )}
                </View>
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#ede9fe',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 15,
    lineHeight: 20,
  },
  verseCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verseText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#1f2937',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  verseReference: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    textAlign: 'right',
    marginBottom: 15,
  },
  verseActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6b7280',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAccessCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickAccessText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  searchSection: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  searchButton: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  searchHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  planCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  planHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  planInfo: {
    flex: 1,
    marginLeft: 15,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 5,
  },
  planDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  planDays: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  bookmarkCard: {
    marginBottom: 15,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 40,
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
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalHint: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    padding: 20,
  },
  planCardActive: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bookCard: {
    width: '48%',
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  bookName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  bookChapters: {
    fontSize: 12,
    color: '#6b7280',
  },
  chaptersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  chapterCard: {
    width: '18%',
    aspectRatio: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6b7280',
  },
  chapterScrollView: {
    maxHeight: 500,
  },
  verseInChapter: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6366f1',
    marginRight: 10,
    minWidth: 30,
  },
  verseTextInChapter: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#1f2937',
  },
  progressModalContent: {
    paddingVertical: 10,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  dayCard: {
    width: '18%',
    aspectRatio: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayCardCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  dayNumberCompleted: {
    color: '#fff',
  },
  moreDaysText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  todayReadingCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  todayReadingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  todayReadingPlan: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  todayReadingDay: {
    fontSize: 14,
    color: '#6b7280',
  },
  completedBadge: {
    backgroundColor: '#d1fae5',
    borderRadius: 20,
    padding: 4,
  },
  todayReadingAssignment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  todayReadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 10,
  },
  todayReadingPreview: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  todayReadingPreviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
    fontStyle: 'italic',
  },
  todayReadingActions: {
    flexDirection: 'row',
    gap: 10,
  },
  todayActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#ede9fe',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  todayActionButtonCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  todayActionButtonSecondary: {
    backgroundColor: '#fff',
  },
  todayActionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  todayActionTextCompleted: {
    color: '#fff',
  },
});

