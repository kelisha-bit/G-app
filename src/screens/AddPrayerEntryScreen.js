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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
// DateTimePicker would require @react-native-community/datetimepicker package
// Using text input for date selection for now
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../../firebase.config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import notificationService from '../utils/notificationService';

export default function AddPrayerEntryScreen({ route, navigation }) {
  const { prayerId } = (route && route.params) ? route.params : {};
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [request, setRequest] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderDate, setReminderDate] = useState(null);
  const [reminderDateText, setReminderDateText] = useState('');
  const [hasReminder, setHasReminder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (prayerId) {
      loadPrayer();
      setIsEditMode(true);
    }
  }, [prayerId]);

  const loadPrayer = async () => {
    try {
      const prayerDoc = await getDoc(doc(db, 'prayerJournal', prayerId));
      if (prayerDoc.exists()) {
        const data = prayerDoc.data();
        setTitle(data.title || '');
        setRequest(data.request || '');
        setNotes(data.notes || '');
        if (data.reminderDate) {
          const date = data.reminderDate.toDate();
          setReminderDate(date);
          setReminderDateText(date.toISOString().slice(0, 16)); // Format: YYYY-MM-DDTHH:mm
          setHasReminder(true);
        }
      }
    } catch (error) {
      if (__DEV__) console.error('Error loading prayer:', error);
      Alert.alert('Error', 'Failed to load prayer entry');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a prayer title');
      return;
    }

    if (!request.trim()) {
      Alert.alert('Required', 'Please enter your prayer request');
      return;
    }

    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to save prayers');
        return;
      }

      // Parse reminder date if provided
      let reminderDateValue = null;
      if (hasReminder && reminderDateText) {
        try {
          const parsedDate = new Date(reminderDateText);
          if (!isNaN(parsedDate.getTime()) && parsedDate > new Date()) {
            reminderDateValue = parsedDate;
          }
        } catch (error) {
          // Invalid date, will be null
        }
      }

      const prayerData = {
        title: title.trim(),
        request: request.trim(),
        notes: notes.trim() || null,
        userId: user.uid,
        isAnswered: false,
        hasNotes: notes.trim().length > 0,
        reminderDate: reminderDateValue,
        updatedAt: serverTimestamp(),
      };

      let savedPrayerId;
      if (isEditMode && prayerId) {
        await updateDoc(doc(db, 'prayerJournal', prayerId), prayerData);
        savedPrayerId = prayerId;
        Alert.alert('Success', 'Prayer entry updated');
      } else {
        prayerData.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'prayerJournal'), prayerData);
        savedPrayerId = docRef.id;
        Alert.alert('Success', 'Prayer entry added to your journal');
      }

      // Schedule notification if reminder is set
      if (reminderDateValue) {
        try {
          // Check user's notification settings
          const user = auth.currentUser;
          if (user) {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const settings = userData.notificationSettings || {};
              
              // Only schedule if push notifications are enabled
              if (settings.pushNotifications !== false) {
                await notificationService.schedulePrayerJournalReminder({
                  id: savedPrayerId,
                  title: title.trim(),
                  reminderDate: reminderDateValue,
                });
              }
            }
          }
        } catch (notifError) {
          console.error('Error scheduling prayer reminder notification:', notifError);
          // Don't fail the save operation if notification scheduling fails
        }
      } else {
        // Cancel any existing notification if reminder was removed
        try {
          await notificationService.cancelPrayerJournalReminder(savedPrayerId);
        } catch (cancelError) {
          console.error('Error canceling prayer reminder notification:', cancelError);
        }
      }

      navigation.goBack();
    } catch (error) {
      if (__DEV__) console.error('Error saving prayer:', error);
      Alert.alert('Error', 'Failed to save prayer entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDateTextChange = (text) => {
    setReminderDateText(text);
    if (text) {
      try {
        const date = new Date(text);
        if (!isNaN(date.getTime())) {
          setReminderDate(date);
        }
      } catch (error) {
        // Invalid date format
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={['#8b5cf6', '#6366f1']}
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
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Prayer' : 'Add Prayer'}
        </Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <Text style={styles.label}>Prayer Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Healing for my mother"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />

            <Text style={styles.label}>Prayer Request *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Share your prayer request..."
              value={request}
              onChangeText={setRequest}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.charCount}>{request.length}/1000</Text>

            <Text style={styles.label}>Notes & Reflections</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add personal notes, reflections, or updates..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={styles.charCount}>{notes.length}/2000</Text>

            <View style={styles.reminderSection}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.label}>Set Reminder</Text>
                  <Text style={styles.hint}>Get notified to pray for this request</Text>
                </View>
                <TouchableOpacity
                  style={[styles.switch, hasReminder && styles.switchActive]}
                  onPress={() => {
                    const newValue = !hasReminder;
                    setHasReminder(newValue);
                    if (newValue && !reminderDate) {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setReminderDate(tomorrow);
                      setReminderDateText(tomorrow.toISOString().slice(0, 16));
                    } else if (!newValue) {
                      setReminderDate(null);
                      setReminderDateText('');
                    }
                  }}
                >
                  <View style={[styles.switchThumb, hasReminder && styles.switchThumbActive]} />
                </TouchableOpacity>
              </View>

              {hasReminder && (
                <View style={styles.dateInputContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#8b5cf6" style={styles.dateIcon} />
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY-MM-DD HH:MM (e.g., 2025-01-25 09:00)"
                    value={reminderDateText}
                    onChangeText={handleDateTextChange}
                    placeholderTextColor="#9ca3af"
                  />
                  <Text style={styles.dateHint}>
                    Format: YYYY-MM-DD HH:MM
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  hint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  reminderSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: '#8b5cf6',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  dateInputContainer: {
    marginTop: 16,
  },
  dateIcon: {
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  dateHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

