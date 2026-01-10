import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebase.config';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';

export default function SermonNotesScreen({ navigation, route }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sermons, setSermons] = useState([]);
  const [selectedSermon, setSelectedSermon] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sermonId, setSermonId] = useState('');
  const [sermonTitle, setSermonTitle] = useState('');

  useEffect(() => {
    loadNotes();
    loadSermons();
    
    // If sermonId passed from route, pre-select it
    if (route?.params?.sermonId) {
      setSermonId(route.params.sermonId);
      if (route.params.sermonTitle) {
        setSermonTitle(route.params.sermonTitle);
      }
    }
  }, [route]);

  const loadSermons = async () => {
    try {
      const q = query(collection(db, 'sermons'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const sermonsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSermons(sermonsList);
    } catch (error) {
      console.error('Error loading sermons:', error);
    }
  };

  const loadNotes = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, 'sermonNotes'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const notesList = [];
      querySnapshot.forEach((doc) => {
        notesList.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      setNotes(notesList);
    } catch (error) {
      console.error('Error loading notes:', error);
      Alert.alert('Error', 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  };

  const openCreateModal = () => {
    setEditMode(false);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (note) => {
    setEditMode(true);
    setSelectedNote(note);
    setTitle(note.title || '');
    setContent(note.content || '');
    setSermonId(note.sermonId || '');
    setSermonTitle(note.sermonTitle || '');
    setModalVisible(true);
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setSermonId(route?.params?.sermonId || '');
    setSermonTitle(route?.params?.sermonTitle || '');
    setSelectedNote(null);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Validation Error', 'Please fill in title and content');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Login Required', 'Please login to save notes');
        return;
      }

      const noteData = {
        title: title.trim(),
        content: content.trim(),
        sermonId: sermonId || null,
        sermonTitle: sermonTitle || null,
        userId: user.uid,
        updatedAt: new Date().toISOString(),
      };

      if (editMode && selectedNote) {
        await updateDoc(doc(db, 'sermonNotes', selectedNote.id), noteData);
        Alert.alert('Success', 'Note updated successfully');
      } else {
        await addDoc(collection(db, 'sermonNotes'), {
          ...noteData,
          createdAt: new Date().toISOString(),
        });
        Alert.alert('Success', 'Note saved successfully');
      }

      setModalVisible(false);
      resetForm();
      loadNotes();
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note');
    }
  };

  const handleDelete = (note) => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${note.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'sermonNotes', note.id));
              Alert.alert('Success', 'Note deleted successfully');
              loadNotes();
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const handleShare = async (note) => {
    try {
      await Share.share({
        message: `${note.title}\n\n${note.content}\n\n${note.sermonTitle ? `From: ${note.sermonTitle}` : ''}`,
        title: note.title,
      });
    } catch (error) {
      console.error('Error sharing note:', error);
    }
  };

  const selectSermon = () => {
    Alert.alert(
      'Select Sermon',
      'Choose a sermon to link this note to',
      [
        ...sermons.map(sermon => ({
          text: sermon.title || 'Untitled',
          onPress: () => {
            setSermonId(sermon.id);
            setSermonTitle(sermon.title || 'Untitled');
          },
        })),
        { text: 'No Sermon', onPress: () => {
          setSermonId('');
          setSermonTitle('');
        }},
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getFilteredNotes = () => {
    if (!searchQuery.trim()) return notes;
    
    const query = searchQuery.toLowerCase();
    return notes.filter(note =>
      note.title?.toLowerCase().includes(query) ||
      note.content?.toLowerCase().includes(query) ||
      note.sermonTitle?.toLowerCase().includes(query)
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderNoteCard = (note) => (
    <TouchableOpacity
      key={note.id}
      style={styles.noteCard}
      onPress={() => openEditModal(note)}
      activeOpacity={0.8}
    >
      <View style={styles.noteHeader}>
        <View style={styles.noteHeaderLeft}>
          <Text style={styles.noteTitle} numberOfLines={1}>
            {note.title}
          </Text>
          {note.sermonTitle && (
            <Text style={styles.noteSermon} numberOfLines={1}>
              📖 {note.sermonTitle}
            </Text>
          )}
        </View>
        <View style={styles.noteActions}>
          <TouchableOpacity
            style={styles.actionIcon}
            onPress={(e) => {
              e.stopPropagation();
              handleShare(note);
            }}
          >
            <Ionicons name="share-outline" size={20} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionIcon}
            onPress={(e) => {
              e.stopPropagation();
              handleDelete(note);
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.noteContent} numberOfLines={3}>
        {note.content}
      </Text>
      <Text style={styles.noteDate}>
        {formatDate(note.createdAt)}
      </Text>
    </TouchableOpacity>
  );

  const filteredNotes = getFilteredNotes();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sermon Notes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openCreateModal}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notes List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
        ) : filteredNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Try a different search term'
                : 'Tap + to create your first note'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={openCreateModal}
              >
                <Text style={styles.emptyButtonText}>Create Note</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.notesList}>
            {filteredNotes.map(note => renderNoteCard(note))}
          </View>
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editMode ? 'Edit Note' : 'New Note'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#1f2937" />
                </TouchableOpacity>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Note title"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />
              </View>

              <View style={styles.formSection}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Linked Sermon</Text>
                  <TouchableOpacity onPress={selectSermon}>
                    <Text style={styles.linkText}>
                      {sermonTitle ? 'Change' : 'Select'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {sermonTitle ? (
                  <View style={styles.sermonTag}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.sermonTagText}>{sermonTitle}</Text>
                    <TouchableOpacity onPress={() => {
                      setSermonId('');
                      setSermonTitle('');
                    }}>
                      <Ionicons name="close-circle" size={16} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.selectSermonButton}
                    onPress={selectSermon}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#6366f1" />
                    <Text style={styles.selectSermonText}>Link to a sermon</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.formSection}>
                <Text style={styles.label}>Notes *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Write your notes here..."
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={10}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>
                  {content.length} characters
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>
                    {editMode ? 'Update' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loader: {
    marginTop: 50,
  },
  notesList: {
    gap: 15,
  },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  noteHeaderLeft: {
    flex: 1,
    marginRight: 10,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  noteSermon: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  noteActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionIcon: {
    padding: 5,
  },
  noteContent: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 10,
  },
  noteDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    padding: 50,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 20,
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 150,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 5,
  },
  sermonTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  sermonTagText: {
    flex: 1,
    fontSize: 14,
    color: '#065f46',
    fontWeight: '500',
  },
  selectSermonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  selectSermonText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

