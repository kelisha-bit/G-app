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
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ManageSermonsScreen({ navigation }) {
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedSermon, setSelectedSermon] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [pastor, setPastor] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [series, setSeries] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadSermons();
  }, []);

  const loadSermons = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'sermons'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const sermonsList = [];
      
      querySnapshot.forEach((doc) => {
        sermonsList.push({ id: doc.id, ...doc.data() });
      });
      
      setSermons(sermonsList);
    } catch (error) {
      console.error('Error loading sermons:', error);
      Alert.alert('Error', 'Failed to load sermons');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditMode(false);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (sermon) => {
    setEditMode(true);
    setSelectedSermon(sermon);
    setTitle(sermon.title || '');
    setPastor(sermon.pastor || '');
    setDate(sermon.date || '');
    setDuration(sermon.duration || '');
    setVideoUrl(sermon.videoUrl || '');
    setAudioUrl(sermon.audioUrl || '');
    setImageUrl(sermon.image || '');
    setImagePreview(sermon.image || '');
    setSeries(sermon.series || '');
    setDescription(sermon.description || '');
    setModalVisible(true);
  };

  const resetForm = () => {
    setTitle('');
    setPastor('');
    setDate('');
    setDuration('');
    setVideoUrl('');
    setAudioUrl('');
    setImageUrl('');
    setImagePreview('');
    setSeries('');
    setDescription('');
    setSelectedSermon(null);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need access to your photos to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
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
      const filename = `sermons/${timestamp}_${Math.random().toString(36).substring(7)}.jpg`;
      const storageRef = ref(storage, filename);

      // Upload image
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      setImageUrl(downloadURL);
      setImagePreview(downloadURL);
      Alert.alert('Success', 'Thumbnail uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload thumbnail. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!title || !pastor || !date) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      const sermonData = {
        title: title.trim(),
        pastor: pastor.trim(),
        date: date.trim(),
        duration: duration.trim() || '45 min',
        videoUrl: videoUrl.trim(),
        audioUrl: audioUrl.trim(),
        image: imageUrl.trim() || 'https://via.placeholder.com/400x200',
        series: series.trim(),
        description: description.trim(),
        updatedAt: new Date().toISOString(),
      };

      if (editMode && selectedSermon) {
        await updateDoc(doc(db, 'sermons', selectedSermon.id), sermonData);
        Alert.alert('Success', 'Sermon updated successfully');
      } else {
        await addDoc(collection(db, 'sermons'), {
          ...sermonData,
          createdAt: new Date().toISOString(),
          views: '0',
        });
        Alert.alert('Success', 'Sermon created successfully');
      }

      setModalVisible(false);
      resetForm();
      loadSermons();
    } catch (error) {
      console.error('Error saving sermon:', error);
      Alert.alert('Error', 'Failed to save sermon');
    }
  };

  const handleDelete = (sermon) => {
    Alert.alert(
      'Delete Sermon',
      `Are you sure you want to delete "${sermon.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'sermons', sermon.id));
              Alert.alert('Success', 'Sermon deleted successfully');
              loadSermons();
            } catch (error) {
              console.error('Error deleting sermon:', error);
              Alert.alert('Error', 'Failed to delete sermon');
            }
          },
        },
      ]
    );
  };

  const renderSermonCard = (sermon) => (
    <View key={sermon.id} style={styles.sermonCard}>
      <View style={styles.sermonCardContent}>
        {sermon.image && (
          <Image 
            source={{ uri: sermon.image }} 
            style={styles.sermonThumbnail}
          />
        )}
        <View style={styles.sermonCardInfo}>
          <View style={styles.sermonHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sermonTitle}>{sermon.title}</Text>
              <Text style={styles.sermonPastor}>by {sermon.pastor}</Text>
              {sermon.series && (
                <View style={styles.seriesBadge}>
                  <Text style={styles.seriesText}>{sermon.series}</Text>
                </View>
              )}
            </View>
            <View style={styles.sermonActions}>
              <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(sermon)}>
                <Ionicons name="create-outline" size={20} color="#6366f1" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(sermon)}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sermonDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={14} color="#6b7280" />
              <Text style={styles.detailText}>{sermon.date}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time" size={14} color="#6b7280" />
              <Text style={styles.detailText}>{sermon.duration}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="eye" size={14} color="#6b7280" />
              <Text style={styles.detailText}>{sermon.views || '0'} views</Text>
            </View>
          </View>

          <View style={styles.mediaInfo}>
            {sermon.videoUrl && (
              <View style={styles.mediaTag}>
                <Ionicons name="videocam" size={14} color="#10b981" />
                <Text style={styles.mediaTagText}>Video</Text>
              </View>
            )}
            {sermon.audioUrl && (
              <View style={styles.mediaTag}>
                <Ionicons name="musical-notes" size={14} color="#8b5cf6" />
                <Text style={styles.mediaTagText}>Audio</Text>
              </View>
            )}
          </View>
        </View>
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
          <Text style={styles.headerTitle}>Manage Sermons</Text>
          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{sermons.length}</Text>
          <Text style={styles.statLabel}>Total Sermons</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {sermons.filter(s => s.videoUrl).length}
          </Text>
          <Text style={styles.statLabel}>With Video</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {sermons.reduce((sum, s) => sum + parseInt(s.views || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Total Views</Text>
        </View>
      </View>

      {/* Sermons List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading sermons...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {sermons.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="play-circle-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No sermons yet</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
                <Text style={styles.emptyButtonText}>Add First Sermon</Text>
              </TouchableOpacity>
            </View>
          ) : (
            sermons.map(renderSermonCard)
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
              {editMode ? 'Edit Sermon' : 'Add New Sermon'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Sermon Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter sermon title"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Pastor/Speaker *</Text>
              <TextInput
                style={styles.input}
                value={pastor}
                onChangeText={setPastor}
                placeholder="Enter pastor name"
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
                <Text style={styles.label}>Duration</Text>
                <TextInput
                  style={styles.input}
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="45 min"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Series (Optional)</Text>
              <TextInput
                style={styles.input}
                value={series}
                onChangeText={setSeries}
                placeholder="Sermon series name"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Video URL</Text>
              <TextInput
                style={styles.input}
                value={videoUrl}
                onChangeText={setVideoUrl}
                placeholder="https://youtube.com/..."
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Audio URL</Text>
              <TextInput
                style={styles.input}
                value={audioUrl}
                onChangeText={setAudioUrl}
                placeholder="https://..."
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Thumbnail Image</Text>
              
              {/* Image Preview */}
              {imagePreview ? (
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ uri: imagePreview }} 
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      setImagePreview('');
                      setImageUrl('');
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ) : null}

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
                      {imagePreview || imageUrl ? 'Change Thumbnail' : 'Upload Thumbnail'}
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

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Sermon description..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={styles.saveButtonGradient}
              >
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.saveButtonText}>
                  {editMode ? 'Update Sermon' : 'Add Sermon'}
                </Text>
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
  sermonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sermonCardContent: {
    flexDirection: 'row',
  },
  sermonThumbnail: {
    width: 120,
    height: 120,
    backgroundColor: '#f3f4f6',
  },
  sermonCardInfo: {
    flex: 1,
    padding: 15,
  },
  sermonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sermonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  sermonPastor: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  seriesBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  seriesText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  sermonActions: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
  },
  sermonDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  mediaInfo: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
  },
  mediaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  mediaTagText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
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
    backgroundColor: '#ede9fe',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    borderStyle: 'dashed',
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
    marginHorizontal: 15,
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
});




