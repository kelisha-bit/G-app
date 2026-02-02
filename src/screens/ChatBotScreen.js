import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { chatWithAI } from '../utils/aiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAT_HISTORY_KEY = '@chatbot_history';

export default function ChatBotScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const scrollViewRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
    // Request permissions
    requestPermissions();
    // Add welcome message if no history
    if (messages.length === 0) {
      addWelcomeMessage();
    }
    return () => {
      // Cleanup recording interval
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const requestPermissions = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    } catch (error) {
      if (__DEV__) console.error('Error requesting permissions:', error);
    }
  };

  const loadChatHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
      if (history) {
        const parsedHistory = JSON.parse(history);
        setMessages(parsedHistory);
      }
    } catch (error) {
      if (__DEV__) console.error('Error loading chat history:', error);
    }
  };

  const saveChatHistory = async (newMessages) => {
    try {
      await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(newMessages));
    } catch (error) {
      if (__DEV__) console.error('Error saving chat history:', error);
    }
  };

  const addWelcomeMessage = () => {
    const welcomeMessage = {
      id: Date.now().toString(),
      text: "Hello! I'm your church assistant. I can help you with:\n\n• Bible verses and study\n• Prayer guidance\n• Church information\n• App features\n• Spiritual questions\n\nHow can I help you today?",
      sender: 'bot',
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
    saveChatHistory([welcomeMessage]);
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      // Create voice message
      const voiceMessage = {
        id: Date.now().toString(),
        text: `🎤 Voice message (${formatDuration(recordingDuration)})`,
        sender: 'user',
        timestamp: new Date().toISOString(),
        type: 'voice',
        audioUri: uri,
        duration: recordingDuration,
      };

      const newMessages = [...messages, voiceMessage];
      setMessages(newMessages);
      saveChatHistory(newMessages);

      // Send voice message to AI (with a note that it's a voice message)
      setLoading(true);
      try {
        const response = await chatWithAI(
          'I sent a voice message. Please acknowledge it.',
          messages
        );
        const botMessage = {
          id: (Date.now() + 1).toString(),
          text: response || "I received your voice message! I'm currently processing voice messages. For now, please type your question and I'll be happy to help.",
          sender: 'bot',
          timestamp: new Date().toISOString(),
        };
        const updatedMessages = [...newMessages, botMessage];
        setMessages(updatedMessages);
        saveChatHistory(updatedMessages);
      } catch (error) {
        console.error('Chat error:', error);
      } finally {
        setLoading(false);
      }

      setRecording(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAttachedFile({
          type: 'image',
          uri: result.assets[0].uri,
          name: result.assets[0].fileName || 'image.jpg',
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setAttachedFile({
          type: 'document',
          uri: result.assets[0].uri,
          name: result.assets[0].name,
          mimeType: result.assets[0].mimeType,
          size: result.assets[0].size,
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document.');
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !attachedFile) || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim() || (attachedFile ? `📎 ${attachedFile.name}` : ''),
      sender: 'user',
      timestamp: new Date().toISOString(),
      attachment: attachedFile,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setAttachedFile(null);
    setLoading(true);

    // Save user message
    saveChatHistory(newMessages);

    try {
      // If there's an attachment, mention it in the message
      const messageToSend = attachedFile
        ? `${inputText.trim() || ''} [User attached a ${attachedFile.type === 'image' ? 'image' : 'document'}: ${attachedFile.name}]`.trim()
        : inputText.trim();

      const response = await chatWithAI(messageToSend, messages);

      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: response || "I'm sorry, I'm having trouble responding right now. Please try again later.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...newMessages, botMessage];
      setMessages(updatedMessages);
      saveChatHistory(updatedMessages);
    } catch (error) {
      if (__DEV__) console.error('Chat error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
      saveChatHistory(updatedMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat History',
      'Are you sure you want to clear all chat messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
              setMessages([]);
              addWelcomeMessage();
            } catch (error) {
              console.error('Error clearing chat:', error);
            }
          },
        },
      ]
    );
  };

  const quickQuestions = [
    { text: 'Find a Bible verse', icon: 'book-outline' },
    { text: 'Prayer help', icon: 'heart-outline' },
    { text: 'Church events', icon: 'calendar-outline' },
    { text: 'How to give', icon: 'cash-outline' },
    { text: 'Sermon topics', icon: 'mic-outline' },
    { text: 'Ministries info', icon: 'people-outline' },
    { text: 'Bible study tips', icon: 'library-outline' },
    { text: 'Prayer requests', icon: 'hand-right-outline' },
  ];

  const handleQuickQuestion = (question) => {
    setInputText(question);
    // Auto-send after a brief delay
    setTimeout(() => {
      handleSend();
    }, 100);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const playVoiceMessage = async (audioUri) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play voice message.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="chatbubbles" size={24} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>AI Assistant</Text>
        </View>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearChat}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Start a Conversation</Text>
            <Text style={styles.emptyText}>
              Ask me anything about the church, Bible, prayer, or app features!
            </Text>
          </View>
        ) : (
          <>
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageWrapper,
                  message.sender === 'user' ? styles.userMessageWrapper : styles.botMessageWrapper,
                ]}
              >
                {message.sender === 'bot' && (
                  <View style={styles.botAvatar}>
                    <Ionicons name="sparkles" size={20} color="#6366f1" />
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    message.sender === 'user' ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  {/* Voice message */}
                  {message.type === 'voice' && (
                    <TouchableOpacity
                      style={styles.voiceMessageContainer}
                      onPress={() => playVoiceMessage(message.audioUri)}
                    >
                      <Ionicons name="play-circle" size={24} color={message.sender === 'user' ? '#fff' : '#6366f1'} />
                      <Text
                        style={[
                          styles.voiceMessageText,
                          message.sender === 'user' ? styles.userMessageText : styles.botMessageText,
                        ]}
                      >
                        {message.text}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Image attachment */}
                  {message.attachment?.type === 'image' && (
                    <View style={styles.attachmentContainer}>
                      <Image source={{ uri: message.attachment.uri }} style={styles.attachmentImage} />
                      <Text
                        style={[
                          styles.attachmentName,
                          message.sender === 'user' ? styles.userMessageText : styles.botMessageText,
                        ]}
                      >
                        {message.attachment.name}
                      </Text>
                    </View>
                  )}

                  {/* Document attachment */}
                  {message.attachment?.type === 'document' && (
                    <View style={styles.attachmentContainer}>
                      <View style={styles.documentIcon}>
                        <Ionicons name="document-text" size={32} color={message.sender === 'user' ? '#fff' : '#6366f1'} />
                      </View>
                      <Text
                        style={[
                          styles.attachmentName,
                          message.sender === 'user' ? styles.userMessageText : styles.botMessageText,
                        ]}
                      >
                        {message.attachment.name}
                      </Text>
                      {message.attachment.size && (
                        <Text
                          style={[
                            styles.attachmentSize,
                            message.sender === 'user' ? styles.userMessageText : styles.botMessageText,
                          ]}
                        >
                          {(message.attachment.size / 1024).toFixed(1)} KB
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Text message */}
                  {message.text && !message.type && (
                    <Text
                      style={[
                        styles.messageText,
                        message.sender === 'user' ? styles.userMessageText : styles.botMessageText,
                      ]}
                    >
                      {message.text}
                    </Text>
                  )}

                  <Text style={[
                    styles.messageTime,
                    message.sender === 'user' ? styles.userMessageTime : styles.botMessageTime,
                  ]}>
                    {formatTime(message.timestamp)}
                  </Text>
                </View>
                {message.sender === 'user' && (
                  <View style={styles.userAvatar}>
                    <Ionicons name="person" size={20} color="#fff" />
                  </View>
                )}
              </View>
            ))}
            {loading && (
              <View style={[styles.messageWrapper, styles.botMessageWrapper]}>
                <View style={styles.botAvatar}>
                  <Ionicons name="sparkles" size={20} color="#6366f1" />
                </View>
                <View style={[styles.messageBubble, styles.botBubble]}>
                  <ActivityIndicator size="small" color="#6366f1" />
                </View>
              </View>
            )}
          </>
        )}

        {messages.length > 0 && messages.length <= 2 && (
          <View style={styles.quickQuestionsContainer}>
            <Text style={styles.quickQuestionsTitle}>Quick Questions:</Text>
            <View style={styles.quickQuestionsGrid}>
              {quickQuestions.map((q, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickQuestionButton}
                  onPress={() => handleQuickQuestion(q.text)}
                >
                  <Ionicons name={q.icon} size={18} color="#6366f1" />
                  <Text style={styles.quickQuestionText}>{q.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Attachment preview */}
      {attachedFile && (
        <View style={styles.attachmentPreview}>
          {attachedFile.type === 'image' ? (
            <Image source={{ uri: attachedFile.uri }} style={styles.previewImage} />
          ) : (
            <View style={styles.previewDocument}>
              <Ionicons name="document-text" size={24} color="#6366f1" />
              <Text style={styles.previewText} numberOfLines={1}>{attachedFile.name}</Text>
            </View>
          )}
          <TouchableOpacity onPress={removeAttachment} style={styles.removeAttachmentButton}>
            <Ionicons name="close-circle" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.inputWrapper}>
          {/* Attachment buttons */}
          <View style={styles.attachmentButtons}>
            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={handlePickImage}
              disabled={loading || isRecording}
            >
              <Ionicons name="image-outline" size={20} color="#6366f1" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={handlePickDocument}
              disabled={loading || isRecording}
            >
              <Ionicons name="document-attach-outline" size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor="#9ca3af"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!loading && !isRecording}
          />

          {/* Voice recording button */}
          {!isRecording ? (
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={startRecording}
              disabled={loading || !!attachedFile}
            >
              <Ionicons name="mic-outline" size={20} color="#6366f1" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.voiceButton, styles.recordingButton]}
              onPress={stopRecording}
            >
              <View style={styles.recordingIndicator} />
              <Text style={styles.recordingTime}>{formatDuration(recordingDuration)}</Text>
            </TouchableOpacity>
          )}

          {/* Send button */}
          {!isRecording && (
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() && !attachedFile || loading) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={(!inputText.trim() && !attachedFile) || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  botMessageWrapper: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  botMessageText: {
    color: '#1f2937',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  botMessageTime: {
    color: '#9ca3af',
  },
  voiceMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  voiceMessageText: {
    marginLeft: 8,
    fontSize: 15,
  },
  attachmentContainer: {
    marginBottom: 4,
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 4,
  },
  documentIcon: {
    alignItems: 'center',
    marginBottom: 4,
  },
  attachmentName: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  attachmentSize: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.8,
  },
  quickQuestionsContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  quickQuestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  quickQuestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
    marginBottom: 8,
  },
  quickQuestionText: {
    fontSize: 13,
    color: '#6366f1',
    marginLeft: 6,
    fontWeight: '500',
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  previewImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 8,
  },
  previewDocument: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  previewText: {
    fontSize: 13,
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  removeAttachmentButton: {
    marginLeft: 'auto',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginBottom: 8,
  },
  attachmentButtons: {
    flexDirection: 'row',
    marginRight: 4,
  },
  attachmentButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  recordingButton: {
    backgroundColor: '#fee2e2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    width: 'auto',
    minWidth: 80,
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  recordingTime: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
});
