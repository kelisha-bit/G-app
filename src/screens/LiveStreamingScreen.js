import React, { useState, useEffect, useRef } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  Share,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebase.config';
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Helper function to check if URL is a YouTube URL
const isYouTubeUrl = (url) => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
};

// Helper function to extract YouTube video ID from URL
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  
  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

// Helper function to create YouTube embed URL
const getYouTubeEmbedUrl = (url, autoplay = true) => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  
  return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`;
};

export default function LiveStreamingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState('Live');
  const [liveStream, setLiveStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Video player state
  const [videoQuality, setVideoQuality] = useState('HD');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const playerRef = useRef(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatScrollRef = useRef(null);
  
  // Prayer requests state
  const [prayerModalVisible, setPrayerModalVisible] = useState(false);
  const [prayerTitle, setPrayerTitle] = useState('');
  const [prayerRequest, setPrayerRequest] = useState('');
  const [submittingPrayer, setSubmittingPrayer] = useState(false);
  
  // Notes state
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [streamNotes, setStreamNotes] = useState([]);
  
  // Schedule and recordings
  const [upcomingStreams, setUpcomingStreams] = useState([]);
  const [pastRecordings, setPastRecordings] = useState([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  
  // User data
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState(null);

  useEffect(() => {
    loadUserData();
    loadLiveStream();
    loadUpcomingStreams();
    loadPastRecordings();
    
    // Set up real-time listener for live stream
    const unsubscribe = onSnapshot(
      query(collection(db, 'liveStreams'), where('isLive', '==', true), orderBy('startTime', 'desc'), where('startTime', '<=', new Date())),
      (snapshot) => {
        if (!snapshot.empty) {
          const stream = snapshot.docs[0].data();
          setLiveStream({ id: snapshot.docs[0].id, ...stream });
        } else {
          setLiveStream(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to live stream:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (liveStream && selectedTab === 'Live') {
      setupChatListener();
      loadStreamNotes();
      trackViewer(); // Track when user views the stream
    }
  }, [liveStream, selectedTab]);

  // Track viewer count
  const trackViewer = async () => {
    if (!liveStream || !auth.currentUser) return;
    
    try {
      const streamRef = doc(db, 'liveStreams', liveStream.id);
      const streamDoc = await getDoc(streamRef);
      
      if (streamDoc.exists()) {
        const streamData = streamDoc.data();
        const currentViewers = streamData.viewerCount || 0;
        
        // Increment viewer count
        await updateDoc(streamRef, {
          viewerCount: increment(1),
          totalViews: increment(1),
          peakViewers: Math.max(streamData.peakViewers || 0, currentViewers + 1),
        });
      }
    } catch (error) {
      console.error('Error tracking viewer:', error);
      // Don't show error to user, just log it
    }
  };

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserName(data.name || data.email || 'User');
          setUserPhoto(data.photoURL);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadLiveStream = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'liveStreams'),
        where('isLive', '==', true),
        orderBy('startTime', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const stream = querySnapshot.docs[0].data();
        setLiveStream({ id: querySnapshot.docs[0].id, ...stream });
      } else {
        setLiveStream(null);
      }
    } catch (error) {
      console.error('Error loading live stream:', error);
      Alert.alert('Error', 'Failed to load live stream');
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingStreams = async () => {
    try {
      const q = query(
        collection(db, 'liveStreams'),
        where('isLive', '==', false),
        where('scheduledTime', '>', new Date()),
        orderBy('scheduledTime', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const streams = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUpcomingStreams(streams);
    } catch (error) {
      console.error('Error loading upcoming streams:', error);
    }
  };

  const loadPastRecordings = async () => {
    try {
      setLoadingRecordings(true);
      const q = query(
        collection(db, 'liveStreams'),
        where('isLive', '==', false),
        where('hasRecording', '==', true),
        orderBy('endTime', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const recordings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPastRecordings(recordings);
    } catch (error) {
      console.error('Error loading past recordings:', error);
    } finally {
      setLoadingRecordings(false);
    }
  };

  const setupChatListener = () => {
    if (!liveStream) return;
    
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'liveStreams', liveStream.id, 'chat'),
        orderBy('timestamp', 'asc')
      ),
      (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChatMessages(messages);
        
        // Auto-scroll to bottom
        setTimeout(() => {
          if (chatScrollRef.current) {
            chatScrollRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      },
      (error) => {
        console.error('Error listening to chat:', error);
      }
    );

    return () => unsubscribe();
  };

  const loadStreamNotes = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !liveStream) return;

      const q = query(
        collection(db, 'liveStreams', liveStream.id, 'notes'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const notes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStreamNotes(notes);
    } catch (error) {
      console.error('Error loading stream notes:', error);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !liveStream) return;

    try {
      setSendingChat(true);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to send messages');
        return;
      }

      await addDoc(collection(db, 'liveStreams', liveStream.id, 'chat'), {
        userId: user.uid,
        userName: userName,
        userPhoto: userPhoto,
        message: chatInput.trim(),
        timestamp: serverTimestamp(),
      });

      setChatInput('');
    } catch (error) {
      console.error('Error sending chat message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSendingChat(false);
    }
  };

  const submitPrayerRequest = async () => {
    if (!prayerRequest.trim() || !liveStream) return;

    try {
      setSubmittingPrayer(true);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to submit prayer requests');
        return;
      }

      // Add to prayer requests collection
      await addDoc(collection(db, 'prayerRequests'), {
        userId: user.uid,
        userName: userName,
        title: prayerTitle.trim() || 'Prayer Request During Service',
        request: prayerRequest.trim(),
        isLiveService: true,
        liveStreamId: liveStream.id,
        createdAt: serverTimestamp(),
        prayers: 0,
        prayedBy: [],
      });

      // Also add to live stream prayer requests
      await addDoc(collection(db, 'liveStreams', liveStream.id, 'prayerRequests'), {
        userId: user.uid,
        userName: userName,
        title: prayerTitle.trim() || 'Prayer Request',
        request: prayerRequest.trim(),
        timestamp: serverTimestamp(),
      });

      Alert.alert('Success', 'Prayer request submitted');
      setPrayerModalVisible(false);
      setPrayerTitle('');
      setPrayerRequest('');
    } catch (error) {
      console.error('Error submitting prayer request:', error);
      Alert.alert('Error', 'Failed to submit prayer request');
    } finally {
      setSubmittingPrayer(false);
    }
  };

  const saveNote = async () => {
    if (!noteContent.trim() || !liveStream) return;

    try {
      setSavingNote(true);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to save notes');
        return;
      }

      await addDoc(collection(db, 'liveStreams', liveStream.id, 'notes'), {
        userId: user.uid,
        userName: userName,
        content: noteContent.trim(),
        timestamp: serverTimestamp(),
        streamTitle: liveStream.title || 'Live Service',
      });

      Alert.alert('Success', 'Note saved');
      setNotesModalVisible(false);
      setNoteContent('');
      loadStreamNotes();
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  const shareLiveStream = async () => {
    if (!liveStream) return;

    try {
      const shareUrl = liveStream.shareUrl || liveStream.streamUrl || 'https://your-church-app.com/live';
      await Share.share({
        message: `Join us for live service: ${liveStream.title || 'Live Service'}\n${shareUrl}`,
        title: 'Live Service',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStreamUrl = () => {
    if (!liveStream) return null;
    if (videoQuality === 'HD' && liveStream.hdUrl) {
      return liveStream.hdUrl;
    }
    if (videoQuality === 'SD' && liveStream.sdUrl) {
      return liveStream.sdUrl;
    }
    return liveStream.streamUrl;
  };

  const VideoPlayer = ({ streamUrl }) => {
    if (!streamUrl) return null;

    // Check if it's a YouTube URL
    const isYouTube = isYouTubeUrl(streamUrl);
    const youtubeEmbedUrl = isYouTube ? getYouTubeEmbedUrl(streamUrl, true) : null;

    // For YouTube, use WebView
    if (isYouTube && youtubeEmbedUrl) {
      return (
        <View style={styles.videoContainer}>
          <WebView
            source={{ uri: youtubeEmbedUrl }}
            style={styles.videoPlayer}
            allowsFullscreenVideo={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
              </View>
            )}
          />
          <View style={styles.videoOverlay}>
            <TouchableOpacity
              style={styles.qualityButton}
              onPress={() => setVideoQuality(videoQuality === 'HD' ? 'SD' : 'HD')}
            >
              <Text style={styles.qualityButtonText}>{videoQuality}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={shareLiveStream}
            >
              <Ionicons name="share-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // For regular video URLs, use expo-video
    const player = useVideoPlayer(streamUrl, (player) => {
      player.play();
      setIsPlaying(true);
    });

    useEffect(() => {
      if (player) {
        const subscription = player.addListener('statusChange', (status) => {
          setIsPlaying(status.isPlaying);
        });
        return () => subscription.remove();
      }
    }, [player]);

    return (
      <View style={styles.videoContainer}>
        <VideoView
          player={player}
          style={styles.videoPlayer}
          contentFit="contain"
          nativeControls={true}
        />
        <View style={styles.videoOverlay}>
          <TouchableOpacity
            style={styles.qualityButton}
            onPress={() => setVideoQuality(videoQuality === 'HD' ? 'SD' : 'HD')}
          >
            <Text style={styles.qualityButtonText}>{videoQuality}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={shareLiveStream}
          >
            <Ionicons name="share-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderLiveTab = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading live stream...</Text>
        </View>
      );
    }

    if (!liveStream) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="videocam-off-outline" size={64} color="#9ca3af" />
          <Text style={styles.noStreamText}>No live stream at the moment</Text>
          <Text style={styles.noStreamSubtext}>Check back during service times</Text>
        </View>
      );
    }

    const streamUrl = getStreamUrl();

    return (
      <View style={styles.liveContainer}>
        {/* Video Player */}
        {streamUrl && <VideoPlayer streamUrl={streamUrl} />}
        
        {/* Stream Info */}
        <View style={styles.streamInfo}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <Text style={styles.streamTitle}>{liveStream.title || 'Live Service'}</Text>
          {liveStream.description && (
            <Text style={styles.streamDescription}>{liveStream.description}</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setPrayerModalVisible(true)}
          >
            <Ionicons name="heart-outline" size={20} color="#6366f1" />
            <Text style={styles.actionButtonText}>Prayer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setNotesModalVisible(true)}
          >
            <Ionicons name="document-text-outline" size={20} color="#6366f1" />
            <Text style={styles.actionButtonText}>Notes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={shareLiveStream}
          >
            <Ionicons name="share-outline" size={20} color="#6366f1" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Chat Section */}
        <View style={styles.chatSection}>
          <Text style={styles.sectionTitle}>Live Chat</Text>
          <ScrollView
            ref={chatScrollRef}
            style={styles.chatMessages}
            showsVerticalScrollIndicator={false}
          >
            {chatMessages.length === 0 ? (
              <Text style={styles.emptyChatText}>No messages yet. Be the first to chat!</Text>
            ) : (
              chatMessages.map((msg) => (
                <View key={msg.id} style={styles.chatMessage}>
                  <Text style={styles.chatUserName}>{msg.userName || 'User'}:</Text>
                  <Text style={styles.chatMessageText}>{msg.message}</Text>
                </View>
              ))
            )}
          </ScrollView>
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Type a message..."
              value={chatInput}
              onChangeText={setChatInput}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, sendingChat && styles.sendButtonDisabled]}
              onPress={sendChatMessage}
              disabled={sendingChat || !chatInput.trim()}
            >
              {sendingChat ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderScheduleTab = () => {
    return (
      <ScrollView
        style={styles.tabContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadUpcomingStreams().finally(() => setRefreshing(false));
          }} />
        }
      >
        {upcomingStreams.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="calendar-outline" size={64} color="#9ca3af" />
            <Text style={styles.noStreamText}>No upcoming streams scheduled</Text>
          </View>
        ) : (
          upcomingStreams.map((stream) => (
            <TouchableOpacity key={stream.id} style={styles.streamCard}>
              <View style={styles.streamCardHeader}>
                <Ionicons name="calendar" size={24} color="#6366f1" />
                <View style={styles.streamCardInfo}>
                  <Text style={styles.streamCardTitle}>{stream.title || 'Scheduled Service'}</Text>
                  <Text style={styles.streamCardTime}>
                    {stream.scheduledTime && formatDate(stream.scheduledTime)}
                  </Text>
                  {stream.description && (
                    <Text style={styles.streamCardDescription} numberOfLines={2}>
                      {stream.description}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    );
  };

  const renderRecordingsTab = () => {
    return (
      <ScrollView
        style={styles.tabContent}
        refreshControl={
          <RefreshControl
            refreshing={loadingRecordings}
            onRefresh={loadPastRecordings}
          />
        }
      >
        {loadingRecordings ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : pastRecordings.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="film-outline" size={64} color="#9ca3af" />
            <Text style={styles.noStreamText}>No recordings available</Text>
          </View>
        ) : (
          pastRecordings.map((recording) => (
            <TouchableOpacity
              key={recording.id}
              style={styles.recordingCard}
              onPress={() => {
                // Navigate to playback or open in external player
                if (recording.recordingUrl) {
                  navigation.navigate('Sermons');
                }
              }}
            >
              <View style={styles.recordingThumbnail}>
                <Ionicons name="play-circle" size={48} color="#fff" />
              </View>
              <View style={styles.recordingInfo}>
                <Text style={styles.recordingTitle}>{recording.title || 'Service Recording'}</Text>
                <Text style={styles.recordingDate}>
                  {recording.endTime && formatDate(recording.endTime)}
                </Text>
                {recording.description && (
                  <Text style={styles.recordingDescription} numberOfLines={2}>
                    {recording.description}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Streaming</Text>
        <View style={styles.headerRight} />
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['Live', 'Schedule', 'Recordings'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.tabActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {selectedTab === 'Live' && renderLiveTab()}
      {selectedTab === 'Schedule' && renderScheduleTab()}
      {selectedTab === 'Recordings' && renderRecordingsTab()}

      {/* Prayer Request Modal */}
      <Modal
        visible={prayerModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPrayerModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Prayer Request</Text>
              <TouchableOpacity onPress={() => setPrayerModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Title (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Prayer request title"
                value={prayerTitle}
                onChangeText={setPrayerTitle}
              />
              <Text style={styles.inputLabel}>Prayer Request *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Share your prayer request..."
                value={prayerRequest}
                onChangeText={setPrayerRequest}
                multiline
                numberOfLines={6}
                maxLength={1000}
              />
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setPrayerModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, submittingPrayer && styles.submitButtonDisabled]}
                onPress={submitPrayerRequest}
                disabled={submittingPrayer || !prayerRequest.trim()}
              >
                {submittingPrayer ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Notes Modal */}
      <Modal
        visible={notesModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNotesModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Take Notes</Text>
              <TouchableOpacity onPress={() => setNotesModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Your Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Write your notes here..."
                value={noteContent}
                onChangeText={setNoteContent}
                multiline
                numberOfLines={10}
                maxLength={5000}
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
                style={[styles.submitButton, savingNote && styles.submitButtonDisabled]}
                onPress={saveNote}
                disabled={savingNote || !noteContent.trim()}
              >
                {savingNote ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Save</Text>
                )}
              </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  noStreamText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  noStreamSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  liveContainer: {
    flex: 1,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  videoOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  qualityButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  qualityButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 4,
  },
  streamInfo: {
    padding: 16,
    backgroundColor: '#fff',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  streamTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  streamDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  chatSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  chatMessages: {
    flex: 1,
    padding: 16,
    maxHeight: 200,
  },
  emptyChatText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 32,
  },
  chatMessage: {
    marginBottom: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chatUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginRight: 4,
  },
  chatMessageText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'flex-end',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#6366f1',
    padding: 10,
    borderRadius: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  tabContent: {
    flex: 1,
  },
  streamCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  streamCardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  streamCardInfo: {
    flex: 1,
  },
  streamCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  streamCardTime: {
    fontSize: 14,
    color: '#6366f1',
    marginBottom: 4,
  },
  streamCardDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  recordingCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    gap: 12,
  },
  recordingThumbnail: {
    width: 80,
    height: 60,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInfo: {
    flex: 1,
  },
  recordingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  recordingDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  recordingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    marginBottom: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

