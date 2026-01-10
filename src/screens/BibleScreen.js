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
import { fetchBibleVerse, isValidVerseReference } from '../utils/bibleApi';
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

  useEffect(() => {
    loadVerseOfTheDay();
    loadBookmarks();
  }, []);

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
      if (!result.error) {
        setVerseOfTheDay(result);
      }
    } catch (error) {
      console.error('Error loading verse of the day:', error);
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
        ) : (
          verseOfTheDay && renderVerseCard(verseOfTheDay)
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

  const renderReadingPlans = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reading Plans</Text>
        <Text style={styles.sectionDescription}>
          Choose a reading plan to guide your daily Bible reading
        </Text>
      </View>

      {READING_PLANS.map((plan) => (
        <TouchableOpacity
          key={plan.id}
          style={styles.planCard}
          onPress={() => {
            setSelectedPlan(plan);
            Alert.alert(
              plan.name,
              `${plan.description}\n\nThis plan will help you read through ${plan.days} days of Bible reading.`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Start Plan', onPress: () => {
                  // TODO: Implement reading plan tracking
                  Alert.alert('Coming Soon', 'Reading plan tracking will be available soon!');
                }},
              ]
            );
          }}
        >
          <View style={styles.planHeader}>
            <Ionicons name="calendar-outline" size={24} color="#6366f1" />
            <View style={styles.planInfo}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planDescription}>{plan.description}</Text>
            </View>
          </View>
          <View style={styles.planFooter}>
            <Text style={styles.planDays}>{plan.days} days</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

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
        onRequestClose={() => setBookModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Book</Text>
              <TouchableOpacity onPress={() => setBookModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.modalHint}>
                Browse by book feature coming soon!
              </Text>
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
});

