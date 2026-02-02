import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Share,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../firebase.config';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DevotionalScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [devotional, setDevotional] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState([]);
  const [liked, setLiked] = useState(false);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [userNote, setUserNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  // Generate week days for selector
  useEffect(() => {
    generateWeekDays();
  }, []);

  // Load devotional when date changes
  useEffect(() => {
    loadDevotional();
  }, [selectedDate]);

  // Load bookmark, like, and note status when devotional changes
  useEffect(() => {
    if (devotional) {
      checkBookmark();
      checkLike();
      loadUserNote();
    } else {
      // Reset states when devotional is cleared
      setBookmarked(false);
      setLiked(false);
      setUserNote('');
    }
  }, [devotional]);

  const generateWeekDays = () => {
    const today = new Date();
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Start from Monday of current week
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();
      
      days.push({
        day: dayNames[date.getDay()],
        date: date.getDate().toString(),
        fullDate: new Date(date),
        active: isSelected,
        isToday: isToday,
      });
    }
    
    setWeekDays(days);
  };

  const formatDateForQuery = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  const loadDevotional = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const dateString = formatDateForQuery(selectedDate);
      
      // Query for devotional on selected date
      const q = query(
        collection(db, 'devotionals'),
        where('date', '==', dateString),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        setDevotional({ id: doc.id, ...doc.data() });
      } else {
        // If no devotional for selected date, try to get today's or most recent
        const todayString = formatDateForQuery(new Date());
        const todayQuery = query(
          collection(db, 'devotionals'),
          where('date', '==', todayString),
          orderBy('createdAt', 'desc')
        );
        const todaySnapshot = await getDocs(todayQuery);
        
        if (!todaySnapshot.empty) {
          const doc = todaySnapshot.docs[0];
          setDevotional({ id: doc.id, ...doc.data() });
          // Update selected date to today
          setSelectedDate(new Date());
          generateWeekDays();
        } else {
          // Get most recent devotional
          const recentQuery = query(
            collection(db, 'devotionals'),
            orderBy('date', 'desc')
          );
          const recentSnapshot = await getDocs(recentQuery);
          
          if (!recentSnapshot.empty) {
            const doc = recentSnapshot.docs[0];
            setDevotional({ id: doc.id, ...doc.data() });
            // Update selected date to devotional's date
            const devotionalDate = new Date(doc.data().date);
            setSelectedDate(devotionalDate);
            generateWeekDays();
          } else {
            setDevotional(null);
          }
        }
      }
    } catch (error) {
      console.error('Error loading devotional:', error);
      Alert.alert('Error', 'Failed to load devotional. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const checkBookmark = async () => {
    if (!auth.currentUser || !devotional) return;
    
    try {
      const bookmarksQuery = query(
        collection(db, 'devotionalBookmarks'),
        where('userId', '==', auth.currentUser.uid),
        where('devotionalId', '==', devotional.id)
      );
      const snapshot = await getDocs(bookmarksQuery);
      setBookmarked(!snapshot.empty);
    } catch (error) {
      console.error('Error checking bookmark:', error);
    }
  };

  const toggleBookmark = async () => {
    if (!auth.currentUser || !devotional) {
      Alert.alert('Login Required', 'Please login to bookmark devotionals');
      return;
    }

    try {
      if (bookmarked) {
        // Remove bookmark
        const bookmarksQuery = query(
          collection(db, 'devotionalBookmarks'),
          where('userId', '==', auth.currentUser.uid),
          where('devotionalId', '==', devotional.id)
        );
        const snapshot = await getDocs(bookmarksQuery);
        if (!snapshot.empty) {
          await deleteDoc(doc(db, 'devotionalBookmarks', snapshot.docs[0].id));
        }
        setBookmarked(false);
      } else {
        // Add bookmark
        await addDoc(collection(db, 'devotionalBookmarks'), {
          userId: auth.currentUser.uid,
          devotionalId: devotional.id,
          devotionalTitle: devotional.title,
          devotionalDate: devotional.date,
          createdAt: new Date().toISOString(),
        });
        setBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      Alert.alert('Error', 'Failed to update bookmark');
    }
  };

  const loadUserNote = async () => {
    if (!auth.currentUser || !devotional) {
      setUserNote('');
      return;
    }

    try {
      const notesQuery = query(
        collection(db, 'devotionalNotes'),
        where('userId', '==', auth.currentUser.uid),
        where('devotionalId', '==', devotional.id)
      );
      const snapshot = await getDocs(notesQuery);
      
      if (!snapshot.empty) {
        setUserNote(snapshot.docs[0].data().note || '');
      } else {
        setUserNote('');
      }
    } catch (error) {
      console.error('Error loading note:', error);
    }
  };

  const saveUserNote = async () => {
    if (!auth.currentUser || !devotional) {
      Alert.alert('Login Required', 'Please login to save notes');
      return;
    }

    try {
      setNoteLoading(true);
      
      const notesQuery = query(
        collection(db, 'devotionalNotes'),
        where('userId', '==', auth.currentUser.uid),
        where('devotionalId', '==', devotional.id)
      );
      const snapshot = await getDocs(notesQuery);
      
      const noteData = {
        userId: auth.currentUser.uid,
        devotionalId: devotional.id,
        devotionalTitle: devotional.title,
        devotionalDate: devotional.date,
        note: userNote.trim(),
        updatedAt: new Date().toISOString(),
      };

      if (!snapshot.empty) {
        // Update existing note
        await setDoc(doc(db, 'devotionalNotes', snapshot.docs[0].id), noteData, { merge: true });
      } else {
        // Create new note
        await addDoc(collection(db, 'devotionalNotes'), {
          ...noteData,
          createdAt: new Date().toISOString(),
        });
      }
      
      setNotesModalVisible(false);
      Alert.alert('Success', 'Note saved successfully');
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note');
    } finally {
      setNoteLoading(false);
    }
  };

  const handleShare = async () => {
    if (!devotional) return;

    try {
      const shareContent = `${devotional.title}\n\n${devotional.verse}\n"${devotional.verseText}"\n\n${devotional.content.substring(0, 200)}...\n\nRead more in the Greater Works Church App`;
      
      await Share.share({
        message: shareContent,
        title: devotional.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const checkLike = async () => {
    if (!auth.currentUser || !devotional) {
      setLiked(false);
      return;
    }
    
    try {
      const likesQuery = query(
        collection(db, 'devotionalLikes'),
        where('userId', '==', auth.currentUser.uid),
        where('devotionalId', '==', devotional.id)
      );
      const snapshot = await getDocs(likesQuery);
      setLiked(!snapshot.empty);
    } catch (error) {
      console.error('Error checking like:', error);
      setLiked(false);
    }
  };

  const handleLike = async () => {
    if (!auth.currentUser || !devotional) {
      Alert.alert('Login Required', 'Please login to like devotionals');
      return;
    }

    try {
      if (liked) {
        // Remove like
        const likesQuery = query(
          collection(db, 'devotionalLikes'),
          where('userId', '==', auth.currentUser.uid),
          where('devotionalId', '==', devotional.id)
        );
        const snapshot = await getDocs(likesQuery);
        if (!snapshot.empty) {
          await deleteDoc(doc(db, 'devotionalLikes', snapshot.docs[0].id));
        }
        setLiked(false);
      } else {
        // Add like
        await addDoc(collection(db, 'devotionalLikes'), {
          userId: auth.currentUser.uid,
          devotionalId: devotional.id,
          devotionalTitle: devotional.title,
          devotionalDate: devotional.date,
          createdAt: new Date().toISOString(),
        });
        setLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const selectDate = (date) => {
    setSelectedDate(date);
    generateWeekDays();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDevotional();
  }, [selectedDate]);

  if (loading && !devotional) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Daily Devotional</Text>
            <View style={styles.bookmarkButton} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading devotional...</Text>
        </View>
      </View>
    );
  }

  if (!devotional) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Daily Devotional</Text>
            <View style={styles.bookmarkButton} />
          </View>
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Devotional Available</Text>
          <Text style={styles.emptyText}>
            Check back later for today's devotional reflection
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Devotional</Text>
          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={toggleBookmark}
          >
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.weekSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {weekDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.dayCard, day.active && styles.dayCardActive]}
              onPress={() => selectDate(day.fullDate)}
            >
              <Text style={[styles.dayText, day.active && styles.dayTextActive]}>
                {day.day}
              </Text>
              <Text style={[styles.dateText, day.active && styles.dateTextActive]}>
                {day.date}
              </Text>
              {day.isToday && !day.active && (
                <View style={styles.todayIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
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
        <View style={styles.devotionalCard}>
          <Text style={styles.devotionalTitle}>{devotional.title}</Text>
          <Text style={styles.devotionalDate}>
            {formatDateForDisplay(devotional.date)}
          </Text>

          <View style={styles.verseCard}>
            <Ionicons name="book" size={24} color="#6366f1" />
            <View style={styles.verseContent}>
              <Text style={styles.verseReference}>{devotional.verse}</Text>
              <Text style={styles.verseText}>"{devotional.verseText}"</Text>
            </View>
          </View>

          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Today's Reflection</Text>
            <Text style={styles.contentText}>{devotional.content}</Text>
          </View>

          <View style={styles.prayerSection}>
            <View style={styles.prayerHeader}>
              <Ionicons name="hand-left" size={20} color="#8b5cf6" />
              <Text style={styles.sectionTitle}>Prayer</Text>
            </View>
            <Text style={styles.prayerText}>{devotional.prayer}</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={20} color="#6366f1" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setNotesModalVisible(true)}
            >
              <Ionicons name="create-outline" size={20} color="#6366f1" />
              <Text style={styles.actionText}>Notes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={20}
                color={liked ? '#ef4444' : '#6366f1'}
              />
              <Text style={styles.actionText}>Like</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Notes Modal */}
      <Modal
        visible={notesModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNotesModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>My Notes</Text>
                <TouchableOpacity
                  onPress={() => setNotesModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.modalContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalSubtitle}>{devotional.title}</Text>
                <TextInput
                  style={styles.noteInput}
                  multiline
                  numberOfLines={10}
                  placeholder="Write your thoughts, reflections, or prayers here..."
                  value={userNote}
                  onChangeText={setUserNote}
                  textAlignVertical="top"
                />
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setNotesModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, noteLoading && styles.saveButtonDisabled]}
                  onPress={saveUserNote}
                  disabled={noteLoading}
                >
                  {noteLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  bookmarkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekSelector: {
    paddingVertical: 20,
    paddingLeft: 20,
    backgroundColor: '#fff',
  },
  dayCard: {
    width: 50,
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    position: 'relative',
  },
  dayCardActive: {
    backgroundColor: '#6366f1',
  },
  dayText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 5,
  },
  dayTextActive: {
    color: '#fff',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  dateTextActive: {
    color: '#fff',
  },
  todayIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366f1',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9ca3af',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4b5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  devotionalCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  devotionalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  devotionalDate: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 20,
  },
  verseCard: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    marginBottom: 20,
  },
  verseContent: {
    flex: 1,
    marginLeft: 12,
  },
  verseReference: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 5,
  },
  verseText: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  contentSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    marginLeft: 5,
  },
  contentText: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 26,
  },
  prayerSection: {
    backgroundColor: '#faf5ff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  prayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  prayerText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  actionText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 12,
  },
  noteInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    color: '#1f2937',
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
