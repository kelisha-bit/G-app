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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../../firebase.config';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import { fetchBibleVerse, isValidVerseReference } from '../../utils/bibleApi';
import { generateDevotionalContent } from '../../utils/aiService';
import { sendDevotionalNotification } from '../../utils/sendPushNotification';

export default function ManageDevotionalsScreen({ navigation }) {
  const [devotionals, setDevotionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDevotional, setSelectedDevotional] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [verse, setVerse] = useState('');
  const [verseText, setVerseText] = useState('');
  const [content, setContent] = useState('');
  const [prayer, setPrayer] = useState('');
  const [fetchingVerse, setFetchingVerse] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);

  useEffect(() => {
    loadDevotionals();
  }, []);

  const loadDevotionals = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'devotionals'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const devotionalsList = [];
      
      querySnapshot.forEach((doc) => {
        devotionalsList.push({ id: doc.id, ...doc.data() });
      });
      
      setDevotionals(devotionalsList);
    } catch (error) {
      console.error('Error loading devotionals:', error);
      Alert.alert('Error', 'Failed to load devotionals');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditMode(false);
    resetForm();
    // Set default date to today
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setDate(dateString);
    setModalVisible(true);
  };

  const openEditModal = (devotional) => {
    setEditMode(true);
    setSelectedDevotional(devotional);
    setTitle(devotional.title || '');
    setDate(devotional.date || '');
    setVerse(devotional.verse || '');
    setVerseText(devotional.verseText || '');
    setContent(devotional.content || '');
    setPrayer(devotional.prayer || '');
    setModalVisible(true);
  };

  const resetForm = () => {
    setTitle('');
    setDate('');
    setVerse('');
    setVerseText('');
    setContent('');
    setPrayer('');
    setSelectedDevotional(null);
    setFetchingVerse(false);
  };

  const handleFetchVerse = async () => {
    if (!verse || !verse.trim()) {
      Alert.alert('Error', 'Please enter a verse reference first (e.g., John 3:16)');
      return;
    }

    if (!isValidVerseReference(verse)) {
      Alert.alert('Invalid Format', 'Please enter a valid verse reference (e.g., John 3:16, Psalm 23:1)');
      return;
    }

    try {
      setFetchingVerse(true);
      const result = await fetchBibleVerse(verse);

      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        setVerseText(result.text);
        Alert.alert('Success', 'Verse text fetched successfully!');
      }
    } catch (error) {
      console.error('Error fetching verse:', error);
      Alert.alert('Error', 'Failed to fetch verse. Please check your internet connection.');
    } finally {
      setFetchingVerse(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!verse || !verseText) {
      Alert.alert('Info', 'Please fetch a Bible verse first using the "Fetch Verse" button');
      return;
    }

    try {
      setGeneratingContent(true);
      const result = await generateDevotionalContent(verse, verseText, title);

      if (result.error) {
        Alert.alert('Info', result.error);
      } else {
        if (result.reflection) {
          setContent(result.reflection);
        }
        if (result.prayer) {
          setPrayer(result.prayer);
        }
        Alert.alert('Success', 'AI-generated content added! Please review and edit as needed.');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      Alert.alert('Info', 'AI content generation unavailable. Please write content manually.');
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleSave = async () => {
    if (!title || !date || !verse || !verseText || !content || !prayer) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      Alert.alert('Validation Error', 'Date must be in YYYY-MM-DD format (e.g., 2025-01-08)');
      return;
    }

    try {
      const devotionalData = {
        title: title.trim(),
        date: date.trim(),
        verse: verse.trim(),
        verseText: verseText.trim(),
        content: content.trim(),
        prayer: prayer.trim(),
        updatedAt: new Date().toISOString(),
      };

      if (editMode && selectedDevotional) {
        await updateDoc(doc(db, 'devotionals', selectedDevotional.id), devotionalData);
        Alert.alert('Success', 'Devotional updated successfully');
      } else {
        const docRef = await addDoc(collection(db, 'devotionals'), {
          ...devotionalData,
          createdAt: new Date().toISOString(),
        });
        
        // Send push notification for new devotionals
        try {
          const result = await sendDevotionalNotification({
            id: docRef.id,
            title: title.trim(),
          });
          
          if (result.success) {
            Alert.alert(
              '✅ Success!',
              `Devotional created and notification sent to ${result.sentCount} devices!`
            );
          } else {
            Alert.alert('Success', 'Devotional created successfully (notification failed)');
          }
        } catch (notifError) {
          console.error('Error sending devotional notification:', notifError);
          Alert.alert('Success', 'Devotional created successfully (notification failed)');
        }
      }

      setModalVisible(false);
      resetForm();
      loadDevotionals();
    } catch (error) {
      console.error('Error saving devotional:', error);
      Alert.alert('Error', 'Failed to save devotional');
    }
  };

  const handleDelete = (devotional) => {
    Alert.alert(
      'Delete Devotional',
      `Are you sure you want to delete "${devotional.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'devotionals', devotional.id));
              Alert.alert('Success', 'Devotional deleted successfully');
              loadDevotionals();
            } catch (error) {
              console.error('Error deleting devotional:', error);
              Alert.alert('Error', 'Failed to delete devotional');
            }
          },
        },
      ]
    );
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

  const renderDevotionalCard = (devotional) => (
    <View key={devotional.id} style={styles.devotionalCard}>
      <View style={styles.devotionalHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.devotionalTitle}>{devotional.title}</Text>
          <View style={styles.devotionalMeta}>
            <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
            <Text style={styles.devotionalDate}>
              {formatDateForDisplay(devotional.date)}
            </Text>
            <View style={styles.separator} />
            <Ionicons name="book-outline" size={14} color="#9ca3af" />
            <Text style={styles.devotionalVerse}>{devotional.verse}</Text>
          </View>
        </View>
        <View style={styles.devotionalActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openEditModal(devotional)}
          >
            <Ionicons name="create-outline" size={20} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(devotional)}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.devotionalPreview} numberOfLines={2}>
        {devotional.content}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Devotionals</Text>
          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{devotionals.length}</Text>
          <Text style={styles.statLabel}>Total Devotionals</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {devotionals.filter((d) => {
              const devotionalDate = new Date(d.date);
              const today = new Date();
              return devotionalDate.toDateString() === today.toDateString();
            }).length}
          </Text>
          <Text style={styles.statLabel}>Today's</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {devotionals.filter((d) => {
              const devotionalDate = new Date(d.date);
              const today = new Date();
              return devotionalDate >= today;
            }).length}
          </Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
      </View>

      {/* Devotionals List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading devotionals...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {devotionals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No devotionals yet</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
                <Text style={styles.emptyButtonText}>Create First Devotional</Text>
              </TouchableOpacity>
            </View>
          ) : (
            devotionals.map(renderDevotionalCard)
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode ? 'Edit Devotional' : 'Create Devotional'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., God's Unfailing Love"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Date *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD (e.g., 2025-01-08)"
                  value={date}
                  onChangeText={setDate}
                />
                <Text style={styles.helperText}>
                  Format: YYYY-MM-DD (e.g., 2025-01-08)
                </Text>
              </View>

              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Bible Verse Reference *</Text>
                  <TouchableOpacity
                    style={[styles.fetchButton, fetchingVerse && styles.fetchButtonDisabled]}
                    onPress={handleFetchVerse}
                    disabled={fetchingVerse}
                  >
                    {fetchingVerse ? (
                      <ActivityIndicator size="small" color="#6366f1" />
                    ) : (
                      <>
                        <Ionicons name="cloud-download-outline" size={16} color="#6366f1" />
                        <Text style={styles.fetchButtonText}>Fetch Verse</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Psalm 136:1 or John 3:16"
                  value={verse}
                  onChangeText={setVerse}
                />
                <Text style={styles.helperText}>
                  Enter a verse reference and tap "Fetch Verse" to automatically get the verse text
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Verse Text *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter the Bible verse text... (or use 'Fetch Verse' button above)"
                  value={verseText}
                  onChangeText={setVerseText}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Reflection Content *</Text>
                  <TouchableOpacity
                    style={[styles.aiGenerateButton, generatingContent && styles.aiGenerateButtonDisabled]}
                    onPress={handleGenerateContent}
                    disabled={generatingContent || !verseText}
                  >
                    {generatingContent ? (
                      <ActivityIndicator size="small" color="#6366f1" />
                    ) : (
                      <>
                        <Ionicons name="sparkles" size={16} color="#6366f1" />
                        <Text style={styles.aiGenerateButtonText}>AI Generate</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.helperText}>
                  {verseText ? 'AI can generate content based on the verse above' : 'Fetch a verse first to use AI generation'}
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Write the devotional reflection... (or use AI Generate after fetching a verse)"
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Prayer *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Write the prayer... (AI will also generate this when you use AI Generate)"
                  value={prayer}
                  onChangeText={setPrayer}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editMode ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  content: {
    flex: 1,
    padding: 20,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  devotionalCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  devotionalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  devotionalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  devotionalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  devotionalDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 5,
  },
  separator: {
    width: 1,
    height: 12,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  devotionalVerse: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 5,
  },
  devotionalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  devotionalPreview: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
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
    maxHeight: '90%',
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '70%',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 5,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fetchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  fetchButtonDisabled: {
    opacity: 0.6,
  },
  fetchButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
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
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  aiGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  aiGenerateButtonDisabled: {
    opacity: 0.6,
  },
  aiGenerateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
});

