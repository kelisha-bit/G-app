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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { db, storage } from '../../../firebase.config';
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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDayOfWeek, getDayName } from '../../utils/recurringEvents';
import { sendEventNotification } from '../../utils/sendPushNotification';

export default function ManageEventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [selectedEventCheckIns, setSelectedEventCheckIns] = useState([]);
  const [loadingCheckIns, setLoadingCheckIns] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Worship');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDayOfWeek, setRecurringDayOfWeek] = useState(null);
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const categories = ['Worship', 'Youth', 'Prayer', 'Outreach', 'Conference', 'Other'];
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'events'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const eventsList = [];
      
      querySnapshot.forEach((doc) => {
        eventsList.push({ id: doc.id, ...doc.data() });
      });
      
      // Load check-ins and count per event
      const checkInsSnapshot = await getDocs(collection(db, 'checkIns'));
      const checkInCounts = {};
      
      checkInsSnapshot.forEach((checkInDoc) => {
        const checkInData = checkInDoc.data();
        const serviceId = checkInData.serviceId;
        if (serviceId) {
          checkInCounts[serviceId] = (checkInCounts[serviceId] || 0) + 1;
        }
        // Also match by service name for backward compatibility
        const serviceName = checkInData.service;
        if (serviceName) {
          eventsList.forEach((event) => {
            if (event.title === serviceName) {
              const eventId = event.id;
              checkInCounts[eventId] = (checkInCounts[eventId] || 0) + 1;
            }
          });
        }
      });
      
      // Add check-in counts to events
      eventsList.forEach((event) => {
        event.checkInCount = checkInCounts[event.id] || 0;
      });
      
      setEvents(eventsList);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditMode(false);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (event) => {
    setEditMode(true);
    setSelectedEvent(event);
    setTitle(event.title || '');
    setDate(event.date || '');
    setTime(event.time || '');
    setLocation(event.location || '');
    setCategory(event.category || 'Worship');
    setDescription(event.description || '');
    setImageUrl(event.image || '');
    setImagePreview(event.image || null);
    setIsRecurring(event.isRecurring || false);
    setRecurringDayOfWeek(event.recurrencePattern?.dayOfWeek ?? null);
    setRecurringEndDate(event.recurrencePattern?.endDate || '');
    setIsMultiDay(event.isMultiDay || false);
    setEndDate(event.endDate || '');
    setModalVisible(true);
  };

  const resetForm = () => {
    setTitle('');
    setDate('');
    setTime('');
    setLocation('');
    setCategory('Worship');
    setDescription('');
    setImageUrl('');
    setImagePreview(null);
    setIsRecurring(false);
    setRecurringDayOfWeek(null);
    setRecurringEndDate('');
    setIsMultiDay(false);
    setEndDate('');
    setSelectedEvent(null);
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload photos.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // Event images are typically wider
        quality: 0.7,
      });

      if (!result.canceled) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri) => {
    try {
      setUploadingImage(true);
      
      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Create unique filename
      const timestamp = Date.now();
      const filename = `events/${timestamp}_${Math.random().toString(36).substring(7)}.jpg`;
      const storageRef = ref(storage, filename);

      // Upload image
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      setImageUrl(downloadURL);
      setImagePreview(downloadURL);
      Alert.alert('Success', 'Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!title || !time || !location) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    // For recurring events, date is optional (will use startDate from recurrencePattern)
    // For non-recurring events, date is required
    if (!isRecurring && !date) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    // For recurring events, dayOfWeek is required
    if (isRecurring && recurringDayOfWeek === null) {
      Alert.alert('Validation Error', 'Please select a day of the week for recurring events');
      return;
    }

    // For multi-day events, endDate is required
    if (isMultiDay && !endDate) {
      Alert.alert('Validation Error', 'Please provide an end date for multi-day events');
      return;
    }

    // Validate that endDate is after start date for multi-day events
    if (isMultiDay && endDate && date) {
      const start = new Date(date);
      const end = new Date(endDate);
      if (end <= start) {
        Alert.alert('Validation Error', 'End date must be after the start date');
        return;
      }
    }

    try {
      const eventData = {
        title: title.trim(),
        time: time.trim(),
        location: location.trim(),
        category: category,
        description: description.trim(),
        image: imageUrl.trim() || null,
        isRecurring: isRecurring,
        isMultiDay: isMultiDay,
        updatedAt: new Date().toISOString(),
      };

      // Add date for non-recurring events
      if (!isRecurring) {
        eventData.date = date.trim();
        // Add endDate for multi-day events
        if (isMultiDay && endDate) {
          eventData.endDate = endDate.trim();
        }
      } else {
        // For recurring events, store the start date and recurrence pattern
        eventData.date = date.trim() || new Date().toISOString().split('T')[0]; // Use provided date or today as start
        eventData.recurrencePattern = {
          dayOfWeek: recurringDayOfWeek,
          startDate: date.trim() || new Date().toISOString().split('T')[0],
          endDate: recurringEndDate.trim() || null,
          time: time.trim(),
        };
        // Note: Multi-day recurring events are not supported in this version
        // as recurring events are expanded into single-day instances
      }

      if (editMode && selectedEvent) {
        await updateDoc(doc(db, 'events', selectedEvent.id), eventData);
        Alert.alert('Success', 'Event updated successfully');
      } else {
        const docRef = await addDoc(collection(db, 'events'), {
          ...eventData,
          createdAt: new Date().toISOString(),
          registrations: 0,
        });
        
        // Send push notification for new events
        try {
          const result = await sendEventNotification({
            id: docRef.id,
            title: title.trim(),
            description: description.trim(),
          });
          
          if (result.success) {
            Alert.alert(
              '✅ Success!',
              `Event created and notification sent to ${result.sentCount} devices!`
            );
          } else {
            Alert.alert('Success', 'Event created successfully (notification failed)');
          }
        } catch (notifError) {
          console.error('Error sending event notification:', notifError);
          Alert.alert('Success', 'Event created successfully (notification failed)');
        }
      }

      setModalVisible(false);
      resetForm();
      loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Error', 'Failed to save event');
    }
  };

  const handleDelete = (event) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'events', event.id));
              Alert.alert('Success', 'Event deleted successfully');
              loadEvents();
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  const getCategoryColor = (cat) => {
    const colors = {
      Worship: '#8b5cf6',
      Youth: '#f59e0b',
      Prayer: '#ec4899',
      Outreach: '#10b981',
      Conference: '#3b82f6',
      Other: '#6b7280',
    };
    return colors[cat] || '#6b7280';
  };

  const viewCheckIns = async (event) => {
    try {
      setLoadingCheckIns(true);
      setSelectedEvent(event);
      setCheckInModalVisible(true);
      
      // Load all check-ins and filter in memory (more reliable than Firestore queries)
      const allCheckInsSnapshot = await getDocs(collection(db, 'checkIns'));
      const allCheckIns = [];
      
      allCheckInsSnapshot.forEach((doc) => {
        const checkInData = doc.data();
        // Match by serviceId or service name
        if (checkInData.serviceId === event.id || checkInData.service === event.title) {
          // Extract date from check-in (use date field if available, otherwise extract from checkedInAt)
          let checkInDate = checkInData.date;
          if (!checkInDate && checkInData.checkedInAt) {
            checkInDate = new Date(checkInData.checkedInAt).toISOString().split('T')[0];
          }
          
          // For non-recurring events, filter by exact date match
          if (!event.isRecurring && event.date) {
            const eventDate = event.date.split('T')[0]; // Handle ISO strings
            if (checkInDate === eventDate) {
              allCheckIns.push({ id: doc.id, ...checkInData, checkInDate });
            }
          } 
          // For recurring events, include all check-ins (they'll be grouped by date in display)
          else if (event.isRecurring) {
            allCheckIns.push({ id: doc.id, ...checkInData, checkInDate });
          }
          // For multi-day events, check if check-in date falls within event date range
          else if (event.isMultiDay && event.date && event.endDate) {
            const eventStartDate = event.date.split('T')[0];
            const eventEndDate = event.endDate.split('T')[0];
            if (checkInDate && checkInDate >= eventStartDate && checkInDate <= eventEndDate) {
              allCheckIns.push({ id: doc.id, ...checkInData, checkInDate });
            }
          }
          // Fallback: if event has a date, match it
          else if (event.date && checkInDate) {
            const eventDate = event.date.split('T')[0];
            if (checkInDate === eventDate) {
              allCheckIns.push({ id: doc.id, ...checkInData, checkInDate });
            }
          }
        }
      });
      
      // Sort by check-in time (most recent first)
      allCheckIns.sort((a, b) => {
        const timeA = new Date(a.checkedInAt || a.date || 0);
        const timeB = new Date(b.checkedInAt || b.date || 0);
        return timeB - timeA;
      });
      
      setSelectedEventCheckIns(allCheckIns);
    } catch (error) {
      console.error('Error loading check-ins:', error);
      Alert.alert('Error', 'Failed to load check-ins. Please try again.');
      setCheckInModalVisible(false);
    } finally {
      setLoadingCheckIns(false);
    }
  };

  const renderEventCard = (event) => (
    <View key={event.id} style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            {event.isRecurring && (
              <View style={styles.recurringBadge}>
                <Ionicons name="repeat" size={12} color="#6366f1" />
                <Text style={styles.recurringBadgeText}>Recurring</Text>
              </View>
            )}
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(event.category) + '20' }]}>
            <Text style={[styles.categoryText, { color: getCategoryColor(event.category) }]}>
              {event.category}
            </Text>
          </View>
        </View>
        <View style={styles.eventActions}>
          <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(event)}>
            <Ionicons name="create-outline" size={20} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(event)}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.eventDetails}>
        {event.isRecurring && event.recurrencePattern ? (
          <>
            <View style={styles.eventDetailRow}>
              <Ionicons name="repeat" size={16} color="#6366f1" />
              <Text style={styles.eventDetailText}>
                Every {getDayName(event.recurrencePattern.dayOfWeek)}
              </Text>
            </View>
            <View style={styles.eventDetailRow}>
              <Ionicons name="calendar" size={16} color="#6b7280" />
              <Text style={styles.eventDetailText}>
                Starts: {event.recurrencePattern.startDate}
                {event.recurrencePattern.endDate ? ` - Ends: ${event.recurrencePattern.endDate}` : ' (Ongoing)'}
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.eventDetailRow}>
              <Ionicons name="calendar" size={16} color="#6b7280" />
              <Text style={styles.eventDetailText}>
                {event.isMultiDay && event.endDate 
                  ? `${event.date} - ${event.endDate}`
                  : event.date}
              </Text>
            </View>
            {event.isMultiDay && (
              <View style={styles.eventDetailRow}>
                <Ionicons name="calendar-outline" size={16} color="#6366f1" />
                <Text style={styles.eventDetailText}>Multi-day event</Text>
              </View>
            )}
          </>
        )}
        <View style={styles.eventDetailRow}>
          <Ionicons name="time" size={16} color="#6b7280" />
          <Text style={styles.eventDetailText}>{event.time}</Text>
        </View>
        <View style={styles.eventDetailRow}>
          <Ionicons name="location" size={16} color="#6b7280" />
          <Text style={styles.eventDetailText}>{event.location}</Text>
        </View>
      </View>

      {event.description && (
        <Text style={styles.eventDescription} numberOfLines={2}>
          {event.description}
        </Text>
      )}

      <View style={styles.eventFooter}>
        <View style={styles.registrationsInfo}>
          <Ionicons name="people" size={16} color="#6366f1" />
          <Text style={styles.registrationsText}>
            {event.registrations || 0} registered
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.checkInInfo} 
          onPress={() => viewCheckIns(event)}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={styles.checkInText}>
            {event.checkInCount || 0} checked in
          </Text>
          {(event.checkInCount || 0) > 0 && (
            <Ionicons name="chevron-forward" size={16} color="#10b981" style={{ marginLeft: 4 }} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Events</Text>
          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{events.length}</Text>
          <Text style={styles.statLabel}>Total Events</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {events.filter(e => new Date(e.date) >= new Date()).length}
          </Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {events.reduce((sum, e) => sum + (e.registrations || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Total Registrations</Text>
        </View>
      </View>

      {/* Events List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {events.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No events yet</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
                <Text style={styles.emptyButtonText}>Create First Event</Text>
              </TouchableOpacity>
            </View>
          ) : (
            events.map(renderEventCard)
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
              {editMode ? 'Edit Event' : 'Create New Event'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Event Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter event title"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Date *</Text>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Time *</Text>
                <TextInput
                  style={styles.input}
                  value={time}
                  onChangeText={setTime}
                  placeholder="9:00 AM"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Event location"
                placeholderTextColor="#9ca3af"
              />
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

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Event description..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Event Image</Text>
              
              {/* Image Preview */}
              {(imagePreview || imageUrl) && (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: imagePreview || imageUrl }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      setImagePreview(null);
                      setImageUrl('');
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Upload Button */}
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={pickImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <>
                    <ActivityIndicator size="small" color="#6366f1" />
                    <Text style={styles.uploadButtonText}>Uploading...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="image-outline" size={20} color="#6366f1" />
                    <Text style={styles.uploadButtonText}>
                      {imagePreview || imageUrl ? 'Change Image' : 'Upload Image'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Or use URL */}
              <View style={styles.orDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TextInput
                style={styles.input}
                value={imageUrl}
                onChangeText={(text) => {
                  setImageUrl(text);
                  setImagePreview(text);
                }}
                placeholder="Enter image URL (e.g., https://...)"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.helperText}>
                Upload an image or paste a URL. Recommended: 16:9 aspect ratio, max 2MB
              </Text>
            </View>

            {/* Multi-Day Event Toggle */}
            {!isRecurring && (
              <View style={styles.formGroup}>
                <TouchableOpacity
                  style={styles.toggleContainer}
                  onPress={() => setIsMultiDay(!isMultiDay)}
                >
                  <View style={styles.toggleRow}>
                    <Ionicons 
                      name={isMultiDay ? "calendar" : "calendar-outline"} 
                      size={20} 
                      color={isMultiDay ? "#6366f1" : "#6b7280"} 
                    />
                    <Text style={styles.toggleLabel}>Multi-Day Event</Text>
                    <View style={[styles.toggleSwitch, isMultiDay && styles.toggleSwitchActive]}>
                      <View style={[styles.toggleThumb, isMultiDay && styles.toggleThumbActive]} />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Multi-Day Event End Date */}
            {isMultiDay && !isRecurring && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>End Date *</Text>
                <TextInput
                  style={styles.input}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                />
                <Text style={styles.helperText}>
                  The last day of the event
                </Text>
              </View>
            )}

            {/* Recurring Event Toggle */}
            <View style={styles.formGroup}>
              <TouchableOpacity
                style={styles.toggleContainer}
                onPress={() => {
                  setIsRecurring(!isRecurring);
                  // Disable multi-day when enabling recurring (they're mutually exclusive)
                  if (!isRecurring) {
                    setIsMultiDay(false);
                    setEndDate('');
                  }
                }}
              >
                <View style={styles.toggleRow}>
                  <Ionicons 
                    name={isRecurring ? "repeat" : "calendar-outline"} 
                    size={20} 
                    color={isRecurring ? "#6366f1" : "#6b7280"} 
                  />
                  <Text style={styles.toggleLabel}>Recurring Event</Text>
                  <View style={[styles.toggleSwitch, isRecurring && styles.toggleSwitchActive]}>
                    <View style={[styles.toggleThumb, isRecurring && styles.toggleThumbActive]} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Recurring Event Options */}
            {isRecurring && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Day of Week *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {daysOfWeek.map((day) => {
                      const dayNumber = getDayOfWeek(day);
                      const isSelected = recurringDayOfWeek === dayNumber;
                      return (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.dayButton,
                            isSelected && styles.dayButtonActive
                          ]}
                          onPress={() => setRecurringDayOfWeek(dayNumber)}
                        >
                          <Text style={[
                            styles.dayButtonText,
                            isSelected && styles.dayButtonTextActive
                          ]}>
                            {day.substring(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Start Date (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD (defaults to today)"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>End Date (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={recurringEndDate}
                    onChangeText={setRecurringEndDate}
                    placeholder="YYYY-MM-DD (leave empty for ongoing)"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </>
            )}

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={styles.saveButtonGradient}
              >
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.saveButtonText}>
                  {editMode ? 'Update Event' : 'Create Event'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Check-Ins Modal */}
      <Modal
        visible={checkInModalVisible}
        animationType="slide"
        onRequestClose={() => setCheckInModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                Check-Ins: {selectedEvent?.title}
              </Text>
              <Text style={styles.modalSubtitle}>
                {selectedEventCheckIns.length} {selectedEventCheckIns.length === 1 ? 'person' : 'people'} checked in
                {selectedEvent?.isRecurring 
                  ? ' (all dates)' 
                  : selectedEvent?.date 
                    ? ` • ${new Date(selectedEvent.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setCheckInModalVisible(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modalContent}>
            {loadingCheckIns ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Loading check-ins...</Text>
              </View>
            ) : selectedEventCheckIns.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyText}>No check-ins yet</Text>
                <Text style={styles.emptySubtext}>
                  Users will appear here once they check in to this event
                </Text>
              </View>
            ) : (
              (() => {
                // Group check-ins by date for recurring events
                const groupedCheckIns = selectedEvent?.isRecurring 
                  ? selectedEventCheckIns.reduce((groups, checkIn) => {
                      const date = checkIn.checkInDate || checkIn.date || 
                        (checkIn.checkedInAt ? new Date(checkIn.checkedInAt).toISOString().split('T')[0] : 'Unknown');
                      if (!groups[date]) {
                        groups[date] = [];
                      }
                      groups[date].push(checkIn);
                      return groups;
                    }, {})
                  : { 'all': selectedEventCheckIns };

                const sortedDates = Object.keys(groupedCheckIns).sort((a, b) => {
                  if (a === 'all' || a === 'Unknown') return 1;
                  if (b === 'all' || b === 'Unknown') return -1;
                  return b.localeCompare(a); // Most recent first
                });

                return sortedDates.map((dateKey) => {
                  const checkInsForDate = groupedCheckIns[dateKey];
                  const formattedDate = dateKey !== 'all' && dateKey !== 'Unknown'
                    ? new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : null;

                  return (
                    <View key={dateKey}>
                      {formattedDate && (
                        <View style={styles.dateHeader}>
                          <Ionicons name="calendar" size={16} color="#6366f1" />
                          <Text style={styles.dateHeaderText}>{formattedDate}</Text>
                          <Text style={styles.dateHeaderCount}>({checkInsForDate.length})</Text>
                        </View>
                      )}
                      {checkInsForDate.map((checkIn, index) => (
                        <View key={checkIn.id} style={[styles.checkInItem, index !== checkInsForDate.length - 1 && styles.checkInItemBorder]}>
                          <View style={styles.checkInAvatar}>
                            <Text style={styles.checkInAvatarText}>
                              {checkIn.userName?.charAt(0)?.toUpperCase() || 'U'}
                            </Text>
                          </View>
                          <View style={styles.checkInDetails}>
                            <Text style={styles.checkInName}>{checkIn.userName || 'Unknown User'}</Text>
                            <Text style={styles.checkInEmail}>{checkIn.userEmail || ''}</Text>
                            <Text style={styles.checkInTime}>
                              {checkIn.checkedInAt 
                                ? new Date(checkIn.checkedInAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: formattedDate ? undefined : 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  })
                                : checkIn.date || 'Unknown time'}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  );
                });
              })()
            )}
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
  eventCard: {
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
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  eventActions: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
  },
  eventDetails: {
    marginBottom: 12,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventDetailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  eventDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  eventFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  registrationsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registrationsText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  checkInInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkInText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  checkInItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkInItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#ede9fe',
    borderRadius: 8,
    marginTop: 15,
    marginBottom: 10,
  },
  dateHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 8,
    flex: 1,
  },
  dateHeaderCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  checkInAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  checkInAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  checkInDetails: {
    flex: 1,
  },
  checkInName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  checkInEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  checkInTime: {
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
    height: 100,
    textAlignVertical: 'top',
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
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
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
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  recurringBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 4,
  },
  toggleContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 10,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#6366f1',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dayButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#f3f4f6',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 4,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6366f1',
    borderStyle: 'dashed',
    marginBottom: 15,
  },
  uploadButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  orText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});



