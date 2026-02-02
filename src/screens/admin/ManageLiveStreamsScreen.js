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
  KeyboardAvoidingView,
  Platform,
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
  where,
  Timestamp,
  increment,
  onSnapshot,
} from 'firebase/firestore';
import { sendLiveStreamNotification } from '../../utils/sendPushNotification';

export default function ManageLiveStreamsScreen({ navigation }) {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedStream, setSelectedStream] = useState(null);
  const [selectedTab, setSelectedTab] = useState('All'); // All, Live, Scheduled, Past
  const [sendingNotification, setSendingNotification] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [hdUrl, setHdUrl] = useState('');
  const [sdUrl, setSdUrl] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  useEffect(() => {
    loadStreams();
  }, []);

  const loadStreams = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'liveStreams'), orderBy('startTime', 'desc'));
      const querySnapshot = await getDocs(q);
      const streamsList = [];
      
      querySnapshot.forEach((doc) => {
        streamsList.push({ id: doc.id, ...doc.data() });
      });
      
      setStreams(streamsList);
    } catch (error) {
      console.error('Error loading streams:', error);
      Alert.alert('Error', 'Failed to load live streams');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredStreams = () => {
    const now = new Date();
    switch (selectedTab) {
      case 'Live':
        return streams.filter(s => s.isLive === true);
      case 'Scheduled':
        return streams.filter(s => {
          if (s.isLive === true) return false;
          if (s.scheduledTime) {
            const scheduled = s.scheduledTime.toDate ? s.scheduledTime.toDate() : new Date(s.scheduledTime);
            return scheduled > now;
          }
          return false;
        });
      case 'Past':
        return streams.filter(s => {
          if (s.isLive === true) return false;
          if (s.endTime) {
            const ended = s.endTime.toDate ? s.endTime.toDate() : new Date(s.endTime);
            return ended < now;
          }
          return s.hasRecording === true;
        });
      default:
        return streams;
    }
  };

  const openCreateModal = () => {
    setEditMode(false);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (stream) => {
    setEditMode(true);
    setSelectedStream(stream);
    setTitle(stream.title || '');
    setDescription(stream.description || '');
    setStreamUrl(stream.streamUrl || '');
    setHdUrl(stream.hdUrl || '');
    setSdUrl(stream.sdUrl || '');
    setShareUrl(stream.shareUrl || '');
    setIsLive(stream.isLive || false);
    setHasRecording(stream.hasRecording || false);
    setRecordingUrl(stream.recordingUrl || '');
    
    // Handle scheduled time
    if (stream.scheduledTime) {
      const scheduled = stream.scheduledTime.toDate ? stream.scheduledTime.toDate() : new Date(stream.scheduledTime);
      setScheduledDate(scheduled.toISOString().split('T')[0]);
      setScheduledTime(scheduled.toTimeString().split(' ')[0].slice(0, 5));
    } else {
      setScheduledDate('');
      setScheduledTime('');
    }
    
    setModalVisible(true);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStreamUrl('');
    setHdUrl('');
    setSdUrl('');
    setShareUrl('');
    setIsLive(false);
    setHasRecording(false);
    setRecordingUrl('');
    setScheduledDate('');
    setScheduledTime('');
    setSelectedStream(null);
  };

  const handleSave = async () => {
    if (!title || !streamUrl) {
      Alert.alert('Validation Error', 'Please fill in title and stream URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(streamUrl);
      if (hdUrl && hdUrl.trim()) new URL(hdUrl);
      if (sdUrl && sdUrl.trim()) new URL(sdUrl);
      if (shareUrl && shareUrl.trim()) new URL(shareUrl);
      if (recordingUrl && recordingUrl.trim()) new URL(recordingUrl);
    } catch (e) {
      Alert.alert('Validation Error', 'Please enter valid URLs (e.g., https://youtube.com/...)');
      return;
    }

    try {
      const now = Timestamp.now();
      const streamData = {
        title: title.trim(),
        description: description.trim(),
        streamUrl: streamUrl.trim(),
        hdUrl: hdUrl.trim() || null,
        sdUrl: sdUrl.trim() || null,
        shareUrl: shareUrl.trim() || null,
        isLive: isLive,
        hasRecording: hasRecording,
        recordingUrl: recordingUrl.trim() || null,
        viewerCount: 0,
        peakViewers: 0,
        totalViews: 0,
      };

      if (isLive) {
        // If going live, set startTime
        streamData.startTime = now;
        streamData.endTime = null;
        streamData.scheduledTime = null;
        
        // Send notification if creating a new live stream
        if (!editMode) {
          try {
            const notificationResult = await sendLiveStreamNotification({
              id: 'new',
              title: title.trim(),
              description: description.trim(),
            });
            if (notificationResult.success) {
              console.log(`Notification sent to ${notificationResult.tokenCount} devices`);
            }
          } catch (notifError) {
            console.error('Error sending notification:', notifError);
            // Don't fail the save if notification fails
          }
        }
      } else if (scheduledDate && scheduledTime) {
        // If scheduled, set scheduledTime
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        streamData.scheduledTime = Timestamp.fromDate(scheduledDateTime);
        streamData.startTime = null;
        streamData.endTime = null;
      } else if (hasRecording && recordingUrl) {
        // If it's a recording, set endTime
        streamData.endTime = now;
        streamData.startTime = streamData.startTime || now;
      }

      if (editMode && selectedStream) {
        // Preserve existing timestamps if not being changed
        if (!isLive && selectedStream.startTime) {
          streamData.startTime = selectedStream.startTime;
        }
        if (!hasRecording && selectedStream.endTime) {
          streamData.endTime = selectedStream.endTime;
        }
        
        await updateDoc(doc(db, 'liveStreams', selectedStream.id), streamData);
        Alert.alert('Success', 'Live stream updated successfully');
      } else {
        await addDoc(collection(db, 'liveStreams'), streamData);
        Alert.alert('Success', 'Live stream created successfully');
      }

      setModalVisible(false);
      resetForm();
      loadStreams();
    } catch (error) {
      console.error('Error saving stream:', error);
      Alert.alert('Error', 'Failed to save live stream');
    }
  };

  const handleStartStream = async (stream) => {
    Alert.alert(
      'Start Live Stream',
      `Are you sure you want to start "${stream.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            try {
              // Update stream to live
              await updateDoc(doc(db, 'liveStreams', stream.id), {
                isLive: true,
                startTime: Timestamp.now(),
                endTime: null,
                viewerCount: 0, // Initialize viewer count
                peakViewers: 0,
              });

              // Send push notification to all users
              setSendingNotification(true);
              try {
                const notificationResult = await sendLiveStreamNotification({
                  id: stream.id,
                  title: stream.title,
                  description: stream.description,
                });
                
                if (notificationResult.success) {
                  console.log(`Notification sent to ${notificationResult.tokenCount} devices`);
                } else {
                  console.warn('Notification failed:', notificationResult.error);
                }
              } catch (notifError) {
                console.error('Error sending notification:', notifError);
                // Don't fail the stream start if notification fails
              } finally {
                setSendingNotification(false);
              }

              Alert.alert('Success', 'Live stream started and notification sent!');
              loadStreams();
            } catch (error) {
              console.error('Error starting stream:', error);
              Alert.alert('Error', 'Failed to start live stream');
            }
          },
        },
      ]
    );
  };

  const handleStopStream = async (stream) => {
    Alert.alert(
      'Stop Live Stream',
      `Are you sure you want to stop "${stream.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'liveStreams', stream.id), {
                isLive: false,
                endTime: Timestamp.now(),
              });
              Alert.alert('Success', 'Live stream stopped');
              loadStreams();
            } catch (error) {
              console.error('Error stopping stream:', error);
              Alert.alert('Error', 'Failed to stop live stream');
            }
          },
        },
      ]
    );
  };

  const handleDelete = (stream) => {
    Alert.alert(
      'Delete Live Stream',
      `Are you sure you want to delete "${stream.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'liveStreams', stream.id));
              Alert.alert('Success', 'Live stream deleted successfully');
              loadStreams();
            } catch (error) {
              console.error('Error deleting stream:', error);
              Alert.alert('Error', 'Failed to delete live stream');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderStreamCard = (stream) => {
    const isLiveNow = stream.isLive === true;
    const hasScheduled = stream.scheduledTime && !isLiveNow;
    const isPast = stream.endTime || (stream.hasRecording && !isLiveNow);

    return (
      <View key={stream.id} style={styles.streamCard}>
        <View style={styles.streamCardHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.streamTitleRow}>
              <Text style={styles.streamTitle}>{stream.title}</Text>
              {isLiveNow && (
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              )}
              {hasScheduled && (
                <View style={styles.scheduledBadge}>
                  <Ionicons name="calendar" size={12} color="#f59e0b" />
                  <Text style={styles.scheduledText}>SCHEDULED</Text>
                </View>
              )}
              {isPast && (
                <View style={styles.pastBadge}>
                  <Text style={styles.pastText}>PAST</Text>
                </View>
              )}
            </View>
            {stream.description && (
              <Text style={styles.streamDescription} numberOfLines={2}>
                {stream.description}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.streamDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="link" size={14} color="#6b7280" />
            <Text style={styles.detailText} numberOfLines={1}>
              {stream.streamUrl || 'No URL'}
            </Text>
          </View>
          {isLiveNow && stream.startTime && (
            <>
              <View style={styles.detailRow}>
                <Ionicons name="play-circle" size={14} color="#10b981" />
                <Text style={styles.detailText}>Started: {formatDate(stream.startTime)}</Text>
              </View>
              {(stream.viewerCount !== undefined || stream.peakViewers !== undefined) && (
                <View style={styles.detailRow}>
                  <Ionicons name="people" size={14} color="#6366f1" />
                  <Text style={styles.detailText}>
                    Viewers: {stream.viewerCount || 0}
                    {stream.peakViewers > 0 && ` (Peak: ${stream.peakViewers})`}
                  </Text>
                </View>
              )}
            </>
          )}
          {hasScheduled && stream.scheduledTime && (
            <View style={styles.detailRow}>
              <Ionicons name="time" size={14} color="#f59e0b" />
              <Text style={styles.detailText}>Scheduled: {formatDate(stream.scheduledTime)}</Text>
            </View>
          )}
          {isPast && stream.endTime && (
            <>
              <View style={styles.detailRow}>
                <Ionicons name="stop-circle" size={14} color="#6b7280" />
                <Text style={styles.detailText}>Ended: {formatDate(stream.endTime)}</Text>
              </View>
              {stream.totalViews > 0 && (
                <View style={styles.detailRow}>
                  <Ionicons name="eye" size={14} color="#8b5cf6" />
                  <Text style={styles.detailText}>Total Views: {stream.totalViews}</Text>
                </View>
              )}
            </>
          )}
          {stream.hasRecording && (
            <View style={styles.detailRow}>
              <Ionicons name="film" size={14} color="#8b5cf6" />
              <Text style={styles.detailText}>Recording available</Text>
            </View>
          )}
        </View>

        <View style={styles.streamActions}>
          {!isLiveNow && !isPast && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => handleStartStream(stream)}
            >
              <Ionicons name="play" size={16} color="#fff" />
              <Text style={styles.startButtonText}>Start</Text>
            </TouchableOpacity>
          )}
          {isLiveNow && (
            <>
              <TouchableOpacity
                style={styles.stopButton}
                onPress={() => handleStopStream(stream)}
              >
                <Ionicons name="stop" size={16} color="#fff" />
                <Text style={styles.stopButtonText}>Stop</Text>
              </TouchableOpacity>
              {sendingNotification && (
                <ActivityIndicator size="small" color="#6366f1" style={{ marginLeft: 8 }} />
              )}
            </>
          )}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openEditModal(stream)}
          >
            <Ionicons name="create-outline" size={18} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(stream)}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const filteredStreams = getFilteredStreams();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Live Streams</Text>
          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['All', 'Live', 'Scheduled', 'Past'].map((tab) => (
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
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{streams.filter(s => s.isLive).length}</Text>
          <Text style={styles.statLabel}>Live Now</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{streams.length}</Text>
          <Text style={styles.statLabel}>Total Streams</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {streams.filter(s => s.hasRecording).length}
          </Text>
          <Text style={styles.statLabel}>Recordings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {streams.reduce((sum, s) => sum + (s.totalViews || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Total Views</Text>
        </View>
      </View>

      {/* Streams List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading streams...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {filteredStreams.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="videocam-off-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No {selectedTab.toLowerCase()} streams</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
                <Text style={styles.emptyButtonText}>Create First Stream</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredStreams.map(renderStreamCard)
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editMode ? 'Edit Live Stream' : 'Create Live Stream'}
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
                placeholder="Sunday Morning Service"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Join us for worship and the Word"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Stream URL *</Text>
              <TextInput
                style={styles.input}
                value={streamUrl}
                onChangeText={setStreamUrl}
                placeholder="https://youtube.com/watch?v=..."
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
              />
              <Text style={styles.helperText}>
                Main streaming URL (YouTube, Vimeo, etc.)
              </Text>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>HD URL (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={hdUrl}
                  onChangeText={setHdUrl}
                  placeholder="HD quality URL"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>SD URL (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={sdUrl}
                  onChangeText={setSdUrl}
                  placeholder="SD quality URL"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Share URL (Optional)</Text>
              <TextInput
                style={styles.input}
                value={shareUrl}
                onChangeText={setShareUrl}
                placeholder="https://your-church-app.com/live"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setIsLive(!isLive)}
                >
                  {isLive ? (
                    <Ionicons name="checkbox" size={24} color="#6366f1" />
                  ) : (
                    <Ionicons name="square-outline" size={24} color="#9ca3af" />
                  )}
                  <Text style={styles.checkboxLabel}>Stream is Live Now</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                Check this if the stream is currently live
              </Text>
            </View>

            {!isLive && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Schedule Stream (Optional)</Text>
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                    <TextInput
                      style={styles.input}
                      value={scheduledDate}
                      onChangeText={setScheduledDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <TextInput
                      style={styles.input}
                      value={scheduledTime}
                      onChangeText={setScheduledTime}
                      placeholder="HH:MM"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>
                <Text style={styles.helperText}>
                  Set when this stream is scheduled to go live
                </Text>
              </View>
            )}

            <View style={styles.formGroup}>
              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setHasRecording(!hasRecording)}
                >
                  {hasRecording ? (
                    <Ionicons name="checkbox" size={24} color="#6366f1" />
                  ) : (
                    <Ionicons name="square-outline" size={24} color="#9ca3af" />
                  )}
                  <Text style={styles.checkboxLabel}>Has Recording</Text>
                </TouchableOpacity>
              </View>
            </View>

            {hasRecording && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Recording URL</Text>
                <TextInput
                  style={styles.input}
                  value={recordingUrl}
                  onChangeText={setRecordingUrl}
                  placeholder="https://youtube.com/watch?v=..."
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                />
              </View>
            )}

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={styles.saveButtonGradient}
              >
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.saveButtonText}>
                  {editMode ? 'Update Stream' : 'Create Stream'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </ScrollView>
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
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
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
  streamCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  streamCardHeader: {
    marginBottom: 12,
  },
  streamTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  streamTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 8,
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ef4444',
  },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  scheduledText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f59e0b',
  },
  pastBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pastText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
  },
  streamDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  streamDetails: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  streamActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 8,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
    marginLeft: 'auto',
  },
  deleteButton: {
    padding: 8,
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
  formRow: {
    flexDirection: 'row',
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
    height: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 10,
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
});

