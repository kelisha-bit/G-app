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
  Switch,
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
import { sendAnnouncementNotification } from '../../utils/sendPushNotification';
import { generateAnnouncementContent } from '../../utils/aiService';

export default function ManageAnnouncementsScreen({ navigation }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('General');
  const [sendNotification, setSendNotification] = useState(true);
  const [generatingContent, setGeneratingContent] = useState(false);

  const priorities = ['low', 'medium', 'high'];
  const categories = ['General', 'Event', 'Urgent', 'Update', 'Prayer', 'Reminder'];

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const announcementsList = [];
      
      querySnapshot.forEach((doc) => {
        announcementsList.push({ id: doc.id, ...doc.data() });
      });
      
      setAnnouncements(announcementsList);
    } catch (error) {
      console.error('Error loading announcements:', error);
      Alert.alert('Error', 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditMode(false);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (announcement) => {
    setEditMode(true);
    setSelectedAnnouncement(announcement);
    setTitle(announcement.title || '');
    setMessage(announcement.message || '');
    setPriority(announcement.priority || 'medium');
    setCategory(announcement.category || 'General');
    setSendNotification(false); // Don't send notification on edit by default
    setModalVisible(true);
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setPriority('medium');
    setCategory('General');
    setSendNotification(true);
    setSelectedAnnouncement(null);
  };

  const handleSave = async () => {
    if (!title || !message) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      const announcementData = {
        title: title.trim(),
        message: message.trim(),
        priority: priority,
        category: category,
        updatedAt: new Date().toISOString(),
      };

      if (editMode && selectedAnnouncement) {
        // Update existing announcement
        await updateDoc(doc(db, 'announcements', selectedAnnouncement.id), announcementData);
        
        // Optionally send notification for updates too
        if (sendNotification) {
          const announcement = {
            id: selectedAnnouncement.id,
            ...announcementData,
          };
          const result = await sendAnnouncementNotification(announcement);
          
          if (result.success) {
            Alert.alert(
              '✅ Updated & Notified',
              `Announcement updated!\n\n📱 Notification sent to ${result.sent} of ${result.tokenCount} devices.`
            );
          } else {
            Alert.alert(
              '⚠️ Updated',
              `Announcement updated but notification failed:\n${result.error || 'Unknown error'}`
            );
          }
        } else {
          Alert.alert('✅ Success', 'Announcement updated successfully');
        }
      } else {
        // Create new announcement
        const docRef = await addDoc(collection(db, 'announcements'), {
          ...announcementData,
          createdAt: new Date().toISOString(),
          read: false,
        });
        
        // Send push notification if enabled
        if (sendNotification) {
          const announcement = {
            id: docRef.id,
            ...announcementData,
          };
          
          const result = await sendAnnouncementNotification(announcement);
          
          if (result.success) {
            Alert.alert(
              '✅ Success!',
              `Announcement created and sent!\n\n📱 Notification delivered to ${result.sent} of ${result.tokenCount} devices.${result.errors > 0 ? `\n⚠️ ${result.errors} failed.` : ''}`
            );
          } else if (result.warning) {
            Alert.alert(
              '⚠️ Partial Success',
              `Announcement created.\n\n${result.warning}`
            );
          } else {
            Alert.alert(
              '⚠️ Created Without Notification',
              `Announcement saved but notification failed:\n\n${result.error || 'No devices registered for notifications.'}`
            );
          }
        } else {
          Alert.alert('✅ Success', 'Announcement created (notification not sent)');
        }
      }

      setModalVisible(false);
      resetForm();
      loadAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      Alert.alert('Error', 'Failed to save announcement: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (announcement) => {
    Alert.alert(
      'Delete Announcement',
      `Are you sure you want to delete "${announcement.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'announcements', announcement.id));
              Alert.alert('Success', 'Announcement deleted successfully');
              loadAnnouncements();
            } catch (error) {
              console.error('Error deleting announcement:', error);
              Alert.alert('Error', 'Failed to delete announcement');
            }
          },
        },
      ]
    );
  };

  const handleGenerateContent = async () => {
    if (!title || !title.trim()) {
      Alert.alert('Info', 'Please enter an announcement title first');
      return;
    }

    try {
      setGeneratingContent(true);
      const result = await generateAnnouncementContent(title, category, priority);

      if (result.error) {
        Alert.alert('Info', result.error);
      } else {
        if (result.message) {
          setMessage(result.message);
          Alert.alert('Success', 'AI-generated announcement content added! Please review and edit as needed.');
        }
      }
    } catch (error) {
      console.error('Error generating content:', error);
      Alert.alert('Info', 'AI content generation unavailable. Please write content manually.');
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleResendNotification = async (announcement) => {
    Alert.alert(
      'Resend Notification',
      `Send push notification for "${announcement.title}" again?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setSaving(true);
            try {
              const result = await sendAnnouncementNotification(announcement);
              
              if (result.success) {
                Alert.alert(
                  '✅ Sent!',
                  `Notification sent to ${result.sent} of ${result.tokenCount} devices.`
                );
              } else {
                Alert.alert(
                  '❌ Failed',
                  result.error || 'Failed to send notification'
                );
              }
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
    };
    return colors[priority] || '#6b7280';
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      low: 'information-circle',
      medium: 'alert-circle',
      high: 'warning',
    };
    return icons[priority] || 'information-circle';
  };

  const renderAnnouncementCard = (announcement) => (
    <View key={announcement.id} style={styles.announcementCard}>
      <View style={styles.announcementHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.priorityRow}>
            <Ionicons
              name={getPriorityIcon(announcement.priority)}
              size={20}
              color={getPriorityColor(announcement.priority)}
            />
            <Text style={[styles.priorityText, { color: getPriorityColor(announcement.priority) }]}>
              {announcement.priority?.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.announcementTitle}>{announcement.title}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{announcement.category}</Text>
          </View>
        </View>
        <View style={styles.announcementActions}>
          <TouchableOpacity 
            style={styles.resendButton} 
            onPress={() => handleResendNotification(announcement)}
          >
            <Ionicons name="notifications-outline" size={20} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(announcement)}>
            <Ionicons name="create-outline" size={20} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(announcement)}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.announcementMessage} numberOfLines={3}>
        {announcement.message}
      </Text>

      <View style={styles.announcementFooter}>
        <Text style={styles.announcementDate}>
          {new Date(announcement.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Loading Overlay */}
      {saving && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingOverlayText}>Sending notification...</Text>
          </View>
        </View>
      )}

      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Announcements</Text>
          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{announcements.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>
            {announcements.filter(a => a.priority === 'high').length}
          </Text>
          <Text style={styles.statLabel}>High Priority</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>
            {announcements.filter(a => a.priority === 'low').length}
          </Text>
          <Text style={styles.statLabel}>Low Priority</Text>
        </View>
      </View>

      {/* Announcements List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading announcements...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {announcements.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="megaphone-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No announcements yet</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
                <Text style={styles.emptyButtonText}>Create First Announcement</Text>
              </TouchableOpacity>
            </View>
          ) : (
            announcements.map(renderAnnouncementCard)
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editMode ? 'Edit Announcement' : 'Create Announcement'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter announcement title"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Message *</Text>
                <TouchableOpacity
                  style={[styles.aiGenerateButton, generatingContent && styles.aiGenerateButtonDisabled]}
                  onPress={handleGenerateContent}
                  disabled={generatingContent || !title.trim()}
                >
                  {generatingContent ? (
                    <ActivityIndicator size="small" color="#6366f1" />
                  ) : (
                    <Ionicons name="sparkles" size={16} color="#6366f1" />
                  )}
                  <Text style={styles.aiGenerateButtonText}>
                    {generatingContent ? 'Generating...' : 'AI Generate'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={message}
                onChangeText={setMessage}
                placeholder="Enter announcement message..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={6}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Priority *</Text>
              <View style={styles.prioritySelector}>
                {priorities.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityButton,
                      priority === p && styles.priorityButtonActive,
                      { borderColor: getPriorityColor(p) },
                      priority === p && { backgroundColor: getPriorityColor(p) },
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      priority === p && styles.priorityButtonTextActive,
                    ]}>
                      {p.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryButton, category === cat && styles.categoryButtonActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.categoryButtonText, category === cat && styles.categoryButtonTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Send Notification Toggle */}
            <View style={styles.notificationToggle}>
              <View style={styles.notificationToggleLeft}>
                <Ionicons name="notifications" size={24} color="#6366f1" />
                <View style={styles.notificationToggleText}>
                  <Text style={styles.notificationToggleTitle}>Send Push Notification</Text>
                  <Text style={styles.notificationToggleSubtitle}>
                    Notify all church members
                  </Text>
                </View>
              </View>
              <Switch
                value={sendNotification}
                onValueChange={setSendNotification}
                trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
                thumbColor={sendNotification ? '#6366f1' : '#9ca3af'}
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={saving}
            >
              <LinearGradient
                colors={saving ? ['#9ca3af', '#9ca3af'] : ['#6366f1', '#8b5cf6']}
                style={styles.saveButtonGradient}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons 
                      name={sendNotification ? "send" : "save"} 
                      size={24} 
                      color="#fff" 
                    />
                    <Text style={styles.saveButtonText}>
                      {editMode 
                        ? (sendNotification ? 'Update & Notify' : 'Update') 
                        : (sendNotification ? 'Send Announcement' : 'Save Without Notification')
                      }
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </ScrollView>
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingBox: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  loadingOverlayText: {
    marginTop: 15,
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
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
  addButton: {
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
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 10,
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
  announcementCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
  },
  announcementActions: {
    flexDirection: 'row',
  },
  resendButton: {
    padding: 8,
  },
  editButton: {
    padding: 8,
    marginLeft: 4,
  },
  deleteButton: {
    padding: 8,
  },
  announcementMessage: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  announcementFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
  },
  announcementDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  prioritySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 2,
  },
  priorityButtonActive: {
    borderWidth: 0,
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  priorityButtonTextActive: {
    color: '#fff',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  notificationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  notificationToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationToggleText: {
    marginLeft: 12,
  },
  notificationToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  notificationToggleSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c4b5fd',
  },
  aiGenerateButtonDisabled: {
    opacity: 0.6,
  },
  aiGenerateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 6,
  },
});