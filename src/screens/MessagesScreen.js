import React, { useState, useEffect, useCallback } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebase.config';
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendMessageNotification } from '../utils/notificationHelpers';

export default function MessagesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState('Inbox');
  const [messages, setMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [messageDetailModalVisible, setMessageDetailModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [composeModalVisible, setComposeModalVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState(null);
  
  // Compose form state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [composeLoading, setComposeLoading] = useState(false);

  // Load user data and check admin status
  useEffect(() => {
    loadUserData();
  }, []);

  // Load messages and announcements when tab changes or on mount
  useEffect(() => {
    if (selectedTab === 'Inbox') {
      loadMessages();
    } else {
      loadAnnouncements();
    }
  }, [selectedTab]);

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setIsAdmin(data.role === 'admin');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadMessages = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const q = query(
        collection(db, 'messages'),
        where('toUserId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const messagesList = [];
      
      querySnapshot.forEach((doc) => {
        messagesList.push({ id: doc.id, ...doc.data() });
      });
      
      setMessages(messagesList);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAnnouncements = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const announcementsList = [];
      
      querySnapshot.forEach((doc) => {
        announcementsList.push({ id: doc.id, ...doc.data() });
      });
      
      setAnnouncements(announcementsList);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (selectedTab === 'Inbox') {
      await loadMessages();
    } else {
      await loadAnnouncements();
    }
  }, [selectedTab]);

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Unknown date';
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffMs = diffTime;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) {
        return 'Just now';
      } else if (diffMins < 60) {
        return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    } catch (error) {
      return dateString || 'Unknown date';
    }
  };

  const formatMessageDate = (dateString) => {
    try {
      if (!dateString) return 'Unknown date';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateString || 'Unknown date';
    }
  };

  const getUnreadCount = () => {
    return messages.filter((msg) => !msg.read).length;
  };

  const openMessageDetail = async (message) => {
    setSelectedMessage(message);
    setMessageDetailModalVisible(true);
    
    // Mark message as read if not already read
    if (!message.read) {
      try {
        await updateDoc(doc(db, 'messages', message.id), {
          read: true,
          readAt: new Date().toISOString(),
        });
        // Update local state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === message.id ? { ...msg, read: true, readAt: new Date().toISOString() } : msg
          )
        );
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const handleDeleteMessage = (message) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'messages', message.id));
              setMessages((prev) => prev.filter((msg) => msg.id !== message.id));
              if (selectedMessage?.id === message.id) {
                setMessageDetailModalVisible(false);
                setSelectedMessage(null);
              }
              Alert.alert('Success', 'Message deleted successfully');
            } catch (error) {
              console.error('Error deleting message:', error);
              Alert.alert('Error', 'Failed to delete message');
            }
          },
        },
      ]
    );
  };

  const handleComposeMessage = async () => {
    if (!composeTo || !composeSubject || !composeMessage) {
      Alert.alert('Validation Error', 'Please fill in all fields');
      return;
    }

    try {
      setComposeLoading(true);
      const user = auth.currentUser;
      
      // Find user by email or display name
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      let targetUser = null;
      
      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        if (
          userData.email?.toLowerCase() === composeTo.toLowerCase() ||
          userData.displayName?.toLowerCase() === composeTo.toLowerCase()
        ) {
          targetUser = { id: userDoc.id, ...userData };
        }
      });

      if (!targetUser) {
        Alert.alert('Error', 'User not found. Please check the email or name.');
        setComposeLoading(false);
        return;
      }

      // Create message
      const docRef = await addDoc(collection(db, 'messages'), {
        fromUserId: user.uid,
        fromUserName: userData?.displayName || user.displayName || 'Admin',
        fromUserEmail: user.email,
        toUserId: targetUser.id,
        toUserName: targetUser.displayName || targetUser.email,
        subject: composeSubject.trim(),
        message: composeMessage.trim(),
        read: false,
        createdAt: new Date().toISOString(),
      });

      // Send push notification to recipient (respects user preferences)
      try {
        const messageData = {
          id: docRef.id,
          subject: composeSubject.trim(),
          fromUserName: userData?.displayName || user.displayName || 'Someone',
        };
        await sendMessageNotification(messageData, targetUser.id);
      } catch (notifError) {
        if (__DEV__) {
          console.error('Error sending message notification:', notifError);
        }
        // Don't fail message sending if notification fails
      }

      Alert.alert('Success', 'Message sent successfully', [
        {
          text: 'OK',
          onPress: () => {
            setComposeModalVisible(false);
            setComposeTo('');
            setComposeSubject('');
            setComposeMessage('');
          },
        },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setComposeLoading(false);
    }
  };

  const openAnnouncementDetail = (announcement) => {
    setSelectedAnnouncement(announcement);
    setDetailModalVisible(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      default:
        return '#10b981';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity
          style={styles.composeButton}
          onPress={() => setComposeModalVisible(true)}
        >
          <Ionicons name="create-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'Inbox' && styles.tabSelected]}
          onPress={() => setSelectedTab('Inbox')}
        >
          <Text
            style={[styles.tabText, selectedTab === 'Inbox' && styles.tabTextSelected]}
          >
            Inbox
          </Text>
          {getUnreadCount() > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getUnreadCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'Announcements' && styles.tabSelected]}
          onPress={() => setSelectedTab('Announcements')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'Announcements' && styles.tabTextSelected,
            ]}
          >
            Announcements
          </Text>
        </TouchableOpacity>
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
        {selectedTab === 'Inbox' ? (
          loading && messages.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="mail-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No Messages Yet</Text>
              <Text style={styles.emptyText}>
                Your messages will appear here when you receive them
              </Text>
            </View>
          ) : (
            <View>
              {messages.map((message) => (
                <TouchableOpacity
                  key={message.id}
                  style={styles.messageCard}
                  onPress={() => openMessageDetail(message)}
                >
                  <View
                    style={[
                      styles.messageIndicator,
                      !message.read && styles.messageIndicatorUnread,
                    ]}
                  />
                  <View style={styles.messageContent}>
                    <View style={styles.messageHeader}>
                      <Text
                        style={[
                          styles.messageFrom,
                          !message.read && styles.messageFromUnread,
                        ]}
                      >
                        {message.fromUserName || message.fromUserEmail || 'Unknown'}
                      </Text>
                      <Text style={styles.messageDate}>
                        {formatDate(message.createdAt)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.messageSubject,
                        !message.read && styles.messageSubjectUnread,
                      ]}
                    >
                      {message.subject}
                    </Text>
                    <Text style={styles.messagePreview} numberOfLines={2}>
                      {message.message}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading announcements...</Text>
          </View>
        ) : announcements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="megaphone-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Announcements Yet</Text>
            <Text style={styles.emptyText}>
              Check back later for church updates and announcements
            </Text>
          </View>
        ) : (
          <View>
            {announcements.map((announcement) => (
              <TouchableOpacity
                key={announcement.id}
                style={styles.announcementCard}
                onPress={() => openAnnouncementDetail(announcement)}
              >
                <View style={styles.announcementHeader}>
                  <View
                    style={[
                      styles.priorityDot,
                      { backgroundColor: getPriorityColor(announcement.priority) },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.announcementTitle}>{announcement.title}</Text>
                    {announcement.category && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{announcement.category}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.announcementMessage} numberOfLines={3}>
                  {announcement.message}
                </Text>
                <View style={styles.announcementFooter}>
                  <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                    <Text style={styles.announcementDate}>
                      {formatDate(announcement.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.readMoreContainer}>
                    <Text style={styles.readMoreLink}>Read more</Text>
                    <Ionicons name="chevron-forward" size={14} color="#6366f1" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Message Detail Modal */}
      <Modal
        visible={messageDetailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMessageDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Message</Text>
              <View style={styles.modalHeaderActions}>
                {selectedMessage && (
                  <TouchableOpacity
                    onPress={() => handleDeleteMessage(selectedMessage)}
                    style={[styles.modalActionButton, styles.deleteButton]}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setMessageDetailModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {selectedMessage && (
                <>
                  <View style={styles.messageDetailHeader}>
                    <Text style={styles.messageDetailFrom}>
                      From: {selectedMessage.fromUserName || selectedMessage.fromUserEmail || 'Unknown'}
                    </Text>
                    <Text style={styles.messageDetailDate}>
                      {formatMessageDate(selectedMessage.createdAt)}
                    </Text>
                  </View>

                  <View style={styles.modalDivider} />

                  <Text style={styles.modalTitle}>{selectedMessage.subject}</Text>

                  <Text style={styles.modalMessage}>{selectedMessage.message}</Text>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Compose Message Modal */}
      <Modal
        visible={composeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setComposeModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>Compose Message</Text>
                <TouchableOpacity
                  onPress={() => {
                    setComposeModalVisible(false);
                    setComposeTo('');
                    setComposeSubject('');
                    setComposeMessage('');
                  }}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.modalContent} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.composeForm}>
                  <Text style={styles.composeLabel}>To (Email or Name)</Text>
                  <TextInput
                    style={styles.composeInput}
                    placeholder="Enter recipient email or name"
                    value={composeTo}
                    onChangeText={setComposeTo}
                    autoCapitalize="none"
                  />

                  <Text style={styles.composeLabel}>Subject</Text>
                  <TextInput
                    style={styles.composeInput}
                    placeholder="Enter message subject"
                    value={composeSubject}
                    onChangeText={setComposeSubject}
                  />

                  <Text style={styles.composeLabel}>Message</Text>
                  <TextInput
                    style={[styles.composeInput, styles.composeTextArea]}
                    placeholder="Enter your message"
                    value={composeMessage}
                    onChangeText={setComposeMessage}
                    multiline
                    numberOfLines={8}
                    textAlignVertical="top"
                  />

                  <TouchableOpacity
                    style={[styles.composeSendButton, composeLoading && styles.composeSendButtonDisabled]}
                    onPress={handleComposeMessage}
                    disabled={composeLoading}
                  >
                    {composeLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="send" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.composeSendButtonText}>Send Message</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Announcement Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Announcement</Text>
              <TouchableOpacity
                onPress={() => setDetailModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {selectedAnnouncement && (
                <>
                  <View style={styles.modalPriorityRow}>
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: getPriorityColor(selectedAnnouncement.priority) },
                      ]}
                    />
                    <Text
                      style={[
                        styles.modalPriorityText,
                        { color: getPriorityColor(selectedAnnouncement.priority) },
                      ]}
                    >
                      {selectedAnnouncement.priority?.toUpperCase()} PRIORITY
                    </Text>
                    {selectedAnnouncement.category && (
                      <View style={[styles.categoryBadge, { marginLeft: 10 }]}>
                        <Text style={styles.categoryText}>{selectedAnnouncement.category}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.modalTitle}>{selectedAnnouncement.title}</Text>

                  <View style={styles.modalDateContainer}>
                    <Ionicons name="calendar-outline" size={16} color="#9ca3af" />
                    <Text style={styles.modalDate}>
                      {formatDate(selectedAnnouncement.createdAt)}
                    </Text>
                  </View>

                  <View style={styles.modalDivider} />

                  <Text style={styles.modalMessage}>{selectedAnnouncement.message}</Text>
                </>
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
  composeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  tabSelected: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 15,
    color: '#9ca3af',
    fontWeight: '600',
  },
  tabTextSelected: {
    color: '#6366f1',
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  messageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
    marginRight: 12,
  },
  messageIndicatorUnread: {
    backgroundColor: '#6366f1',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageFrom: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  messageFromUnread: {
    color: '#1f2937',
    fontWeight: '600',
  },
  messageDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  messageSubject: {
    fontSize: 15,
    color: '#4b5563',
    marginBottom: 4,
  },
  messageSubjectUnread: {
    color: '#1f2937',
    fontWeight: '600',
  },
  messagePreview: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  announcementCard: {
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
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  announcementMessage: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  announcementDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 5,
  },
  readMoreLink: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '600',
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
  modalPriorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalPriorityText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    lineHeight: 30,
  },
  modalDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalDate: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 6,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 16,
  },
  modalMessage: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 20,
  },
  messageDetailHeader: {
    marginBottom: 16,
  },
  messageDetailFrom: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  messageDetailDate: {
    fontSize: 14,
    color: '#9ca3af',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  composeForm: {
    paddingTop: 10,
  },
  composeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  composeInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1f2937',
    marginBottom: 4,
  },
  composeTextArea: {
    minHeight: 150,
    paddingTop: 12,
  },
  composeSendButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  composeSendButtonDisabled: {
    opacity: 0.6,
  },
  composeSendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

