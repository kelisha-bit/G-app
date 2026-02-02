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
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { db, auth, storage } from '../../../firebase.config';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ManageNewsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Updates');
  const [tags, setTags] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [imageUri, setImageUri] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const categories = ['Updates', 'Events', 'Ministry', 'Sermons', 'Community', 'Other'];

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'newsArticles'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const articlesList = [];
      
      querySnapshot.forEach((doc) => {
        articlesList.push({ 
          id: doc.id, 
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        });
      });
      
      setArticles(articlesList);
    } catch (error) {
      if (__DEV__) console.error('Error loading articles:', error);
      Alert.alert('Error', 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditMode(false);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (article) => {
    setEditMode(true);
    setSelectedArticle(article);
    setTitle(article.title || '');
    setExcerpt(article.excerpt || '');
    setContent(article.content || '');
    setCategory(article.category || 'Updates');
    setTags(article.tags ? article.tags.join(', ') : '');
    setIsFeatured(article.isFeatured || false);
    setIsPublished(article.isPublished !== false);
    setImageUrl(article.imageUrl || null);
    setImageUri(null);
    setModalVisible(true);
  };

  const resetForm = () => {
    setTitle('');
    setExcerpt('');
    setContent('');
    setCategory('Updates');
    setTags('');
    setIsFeatured(false);
    setIsPublished(true);
    setImageUri(null);
    setImageUrl(null);
    setSelectedArticle(null);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      if (__DEV__) console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri) => {
    try {
      setUploadingImage(true);
      const user = auth.currentUser;
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `newsArticles/${user.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      if (__DEV__) console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Required', 'Please fill in title and content');
      return;
    }

    try {
      setSaving(true);
      const user = auth.currentUser;
      
      // Upload image if new one selected
      let finalImageUrl = imageUrl;
      if (imageUri) {
        finalImageUrl = await uploadImage(imageUri);
      }

      // Parse tags
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const articleData = {
        title: title.trim(),
        excerpt: excerpt.trim() || title.trim().substring(0, 150),
        content: content.trim(),
        category: category,
        tags: tagsArray,
        isFeatured: isFeatured,
        isPublished: isPublished,
        imageUrl: finalImageUrl,
        author: user?.displayName || user?.email || 'Admin',
        authorId: user?.uid,
        likes: [],
        likesCount: 0,
        contentType: 'text', // 'text' or 'html'
        updatedAt: serverTimestamp(),
      };

      if (editMode && selectedArticle) {
        await updateDoc(doc(db, 'newsArticles', selectedArticle.id), articleData);
        Alert.alert('Success', 'Article updated successfully');
      } else {
        articleData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'newsArticles'), articleData);
        Alert.alert('Success', 'Article created successfully');
      }

      setModalVisible(false);
      resetForm();
      loadArticles();
    } catch (error) {
      if (__DEV__) console.error('Error saving article:', error);
      Alert.alert('Error', 'Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (article) => {
    Alert.alert(
      'Delete Article',
      'Are you sure you want to delete this article? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'newsArticles', article.id));
              Alert.alert('Success', 'Article deleted successfully');
              loadArticles();
            } catch (error) {
              if (__DEV__) console.error('Error deleting article:', error);
              Alert.alert('Error', 'Failed to delete article');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date) => {
    if (!date) return '';
    let d;
    if (date instanceof Date) {
      d = date;
    } else if (date && typeof date.toDate === 'function') {
      d = date.toDate();
    } else {
      d = new Date(date);
      if (isNaN(d.getTime())) return '';
    }
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      Updates: '#6366f1',
      Events: '#f59e0b',
      Ministry: '#10b981',
      Sermons: '#8b5cf6',
      Community: '#ec4899',
      Other: '#6b7280',
    };
    return colors[category] || '#6366f1';
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
        <Text style={styles.headerTitle}>Manage News</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openCreateModal}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#fff', '#f3f4f6']}
            style={styles.addButtonGradient}
          >
            <Ionicons name="add" size={24} color="#6366f1" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* Articles List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {articles.map((article) => (
            <View key={article.id} style={styles.articleCard}>
              {article.imageUrl && (
                <Image source={{ uri: article.imageUrl }} style={styles.articleImage} />
              )}
              <View style={styles.articleContent}>
                <View style={styles.articleHeader}>
                  <View style={styles.articleBadges}>
                    {article.isFeatured && (
                      <View style={styles.featuredBadge}>
                        <Ionicons name="star" size={12} color="#fbbf24" />
                        <Text style={styles.featuredBadgeText}>Featured</Text>
                      </View>
                    )}
                    {article.category && (
                      <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(article.category) + '20' }]}>
                        <Text style={[styles.categoryText, { color: getCategoryColor(article.category) }]}>
                          {article.category}
                        </Text>
                      </View>
                    )}
                    {article.isPublished === false && (
                      <View style={styles.draftBadge}>
                        <Text style={styles.draftBadgeText}>Draft</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.articleDate}>{formatDate(article.createdAt)}</Text>
                </View>
                <Text style={styles.articleTitle}>{article.title}</Text>
                {article.excerpt && (
                  <Text style={styles.articleExcerpt} numberOfLines={2}>{article.excerpt}</Text>
                )}
                <View style={styles.articleActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openEditModal(article)}
                  >
                    <Ionicons name="create-outline" size={20} color="#6366f1" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(article)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode ? 'Edit Article' : 'Create Article'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Article title"
                value={title}
                onChangeText={setTitle}
                maxLength={200}
              />

              <Text style={styles.inputLabel}>Excerpt</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Short description (optional)"
                value={excerpt}
                onChangeText={setExcerpt}
                multiline
                numberOfLines={3}
                maxLength={300}
              />

              <Text style={styles.inputLabel}>Content *</Text>
              <TextInput
                style={[styles.input, styles.textArea, styles.contentArea]}
                placeholder="Article content... You can use basic formatting with line breaks."
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={12}
                textAlignVertical="top"
              />

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categorySelect}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryOption,
                      category === cat && styles.categoryOptionActive,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        category === cat && styles.categoryOptionTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Tags (comma-separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., church, update, event"
                value={tags}
                onChangeText={setTags}
              />

              <Text style={styles.inputLabel}>Featured Image</Text>
              {(imageUri || imageUrl) && (
                <View style={styles.imagePreview}>
                  <Image 
                    source={{ uri: imageUri || imageUrl }} 
                    style={styles.previewImage} 
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      setImageUri(null);
                      setImageUrl(null);
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <Ionicons name="image-outline" size={20} color="#6366f1" />
                <Text style={styles.imageButtonText}>
                  {imageUri || imageUrl ? 'Change Image' : 'Add Image'}
                </Text>
              </TouchableOpacity>

              <View style={styles.switchContainer}>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Featured Article</Text>
                  <Switch
                    value={isFeatured}
                    onValueChange={setIsFeatured}
                    trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                    thumbColor={isFeatured ? '#fff' : '#f4f3f4'}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Published</Text>
                  <Switch
                    value={isPublished}
                    onValueChange={setIsPublished}
                    trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                    thumbColor={isPublished ? '#fff' : '#f4f3f4'}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving || uploadingImage}
              >
                {saving || uploadingImage ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
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
  addButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  articleCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  articleImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f3f4f6',
  },
  articleContent: {
    padding: 16,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  articleBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featuredBadgeText: {
    color: '#92400e',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  draftBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  draftBadgeText: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '600',
  },
  articleDate: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  articleExcerpt: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  articleActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#eef2ff',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
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
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  contentArea: {
    minHeight: 200,
  },
  categorySelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryOptionActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryOptionTextActive: {
    color: '#6366f1',
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f3f4f6',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    gap: 8,
    backgroundColor: '#f9fafb',
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  switchContainer: {
    marginTop: 20,
    gap: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
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
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

